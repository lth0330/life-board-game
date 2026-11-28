// 장면: 길 가다 돌에 걸려 넘어지기 (12초). 안 좋은 일이라 아파하며 절뚝절뚝 끝남 (11-27 사용자)
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Gloom } from './Fx2'
import { Playground } from './Backdrops3'
import { Scooter } from './Props3'
import { Street } from './Backdrops'
import { Stone } from './Props'
import { Bang, Bubble, Dust, Stars, Sweat } from './Fx'
import { INK, ease, keys, pick, poseAt, seg, shakeT, type PoseKey } from './kit'
import { walkPose, canePose } from '../art/sideMotion'
import { sideHand, type SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const TRIP = 3.0 // 돌에 걸리는 순간
const STONE_X = 176

const STUMBLE: SidePose = { lean: 26, head: -14, armN: [115, 25], armF: [95, 30], legN: [30, 20, -10], legF: [-45, 70, 20] }
const FLAT: SidePose = { lean: 4, head: -18, armN: [165, 5], armF: [150, 10], legN: [-6, 24, 20], legF: [-18, 46, 30] }
const KNEEL: SidePose = { lean: 30, head: 0, armN: [40, 30], armF: [30, 30], legN: [80, 120, 0], legF: [10, 100, 30], bob: 0 }
const STAND: SidePose = { lean: 0, head: 6, armN: [8, 10], armF: [-4, 10], legN: [0, 0, 0], legF: [0, 0, 0] }
// 옷 털기: 손으로 다리를 툭툭
const dustOff = (t: number): SidePose => ({ ...STAND, lean: 14, head: 10, armN: [18 + 10 * Math.sin(t * 18), 40], armF: [10, 30] })
// 무릎 문지르기: 허리 숙여 앞 무릎에 손
const rubKnee = (t: number): SidePose => ({ lean: 34, head: 12, armN: [52 + 6 * Math.sin(t * 14), 8], armF: [40, 20], legN: [22, 26, 0], legF: [-6, 4, 0] })
// 스쿠터 손잡이 잡기: 허리 숙여 뒤로 손을 뻗음
const PICK: SidePose = { lean: 30, head: 8, armN: [-40, 10], armF: [20, 20], legN: [16, 20, 0], legF: [-8, 6, 0] }
const END = 8.9 // 절뚝이며 걸어가기 시작

export const fall: SceneDef = {
  id: 'fall',
  dur: 12,
  still: 4.6,
  draw: (t, cast, text) => {
    const c = cast[0]
    const old = (c.age ?? 30) >= 65
    // 사건 문장에 따라: 놀이터(아이) / 스쿠터(어른) / 그냥 길
    const park = /놀이터/.test(text)
    const ride = /스쿠터/.test(text)
    const v = ride ? 50 : old ? 34 : 64 // 걷는(타는) 빠르기 (px/초, 걸음 폭에 맞춤)
    const riding: SidePose = { ...STAND, lean: 8, head: -2, armN: [72, 34], armF: [64, 34], legN: [6, 8, 0], legF: [-10, 10, 0] } // 스쿠터 손잡이 잡고 서기
    const gait = (tt: number) => (ride ? riding : old ? canePose(tt * 0.7) : walkPose(tt * 0.9))
    // 절뚝: 아픈 다리(가까운 다리)를 디딜 때 몸이 푹 내려가고 고개를 숙임
    const limp = (tt: number): SidePose => {
      const ph = tt * (old ? 0.45 : 0.5), p = old ? canePose(ph) : walkPose(ph)
      // 아픈 다리를 디딜 때만 푹 (한 걸음은 짧고 한 걸음은 김)
      const dip = Math.max(0, Math.sin(ph * Math.PI * 2 - 0.6)) ** 2
      return { ...p, legN: [(p.legN?.[0] ?? 0) * 0.6, (p.legN?.[1] ?? 0) * 0.5, 0], bob: (p.bob ?? 0) + 7 * dip, head: (p.head ?? 0) + 8 + 6 * dip, lean: (p.lean ?? 0) + (old && !ride ? 3 : 8 + 6 * dip), armN: ride ? [-34, -6] : old ? p.armN : [40, 30] }
    }
    // 걸어와서 돌 앞에서 걸림 → 넘어진 자리에서 일어나 → 서둘러 나감
    const x0 = t < TRIP ? STONE_X - 16 - v * (TRIP - t) : t < END ? STONE_X - 16 : STONE_X - 16 + (t - END) * (ride ? 32 : v * 0.5)
    const rise = keys(t, [[5.7, 0], [6.5, headH(c) * 0.4]]) // 일어날 때 몸 가운데쯤으로
    const x = x0 + rise
    const rot = keys(t, [[TRIP, 0], [TRIP + 0.35, 24], [TRIP + 0.75, 88], [TRIP + 0.9, 80], [TRIP + 1.05, 88], [5.7, 88], [6.5, 0]], ease.inOut)
    const pose = poseAt(t, [
      [TRIP, gait], [TRIP + 0.3, STUMBLE], [TRIP + 0.75, FLAT],
      [5.1, FLAT], [5.3, { ...FLAT, legN: [-6, 60, 20], legF: [-18, 20, 30] }], [5.5, FLAT], // 다리 버둥
      [5.75, FLAT], [6.3, KNEEL], [6.7, STAND], [6.85, dustOff], [7.6, dustOff], [7.9, rubKnee], ...(ride ? [[8.4, rubKnee], [8.75, PICK], [END, PICK]] as PoseKey[] : [[END - 0.1, rubKnee]] as PoseKey[]), [END + 0.3, limp],
    ])
    const expr = pick<Expr>(t, [[0, 'normal'], [TRIP, 'surprised'], [TRIP + 0.75, 'sad']])
    const down = t > TRIP + 0.7 && t < 6.2
    const hh = headH(c) // 발에서 머리 꼭대기까지 (누우면 옆으로)
    return (
      <g transform={shakeT(t, TRIP + 0.75, 0.45, 6)}>
        {park ? <Playground /> : <Street />}
        <Stone x={STONE_X} y={GROUND + 1} />
        {/* 스쿠터: 타고 오다 돌에 걸려 앞으로 고꾸라지고 옆으로 쓰러짐 */}
        {ride && (() => {
          // 돌에 걸린 스쿠터는 그 자리에 쓰러지고 사람만 앞으로 → 일어나 뒤로 손을 뻗어 손잡이를 잡고 세움 → 끌고 감
          const lieX = x0 - keys(t, [[TRIP, 0], [TRIP + 0.6, 6]], ease.out)
          const [hx, hy] = sideHand(c.outfit, c.age, pose, 62)
          const gx = x + hx - 22 // 손잡이가 손에 오는 스쿠터 위치
          if (t < 8.4) return <Scooter x={t < TRIP ? x0 : lieX} y={GROUND} spin={t < TRIP ? t * 900 : TRIP * 900} rot={keys(t, [[TRIP, 0], [TRIP + 0.25, 18], [TRIP + 0.6, 0]], ease.out)} fallen={t > TRIP + 0.6 ? 1 : 0.9 * ease.out(seg(t, TRIP + 0.1, TRIP + 0.6))} />
          if (t < END) { const k = seg(t, 8.4, END); return <Scooter x={lieX + (gx - lieX) * k} y={GROUND} spin={TRIP * 900} fallen={0.9 * (1 - ease.inOut(k))} /> }
          return <Scooter x={gx} y={GROUND} spin={t * 300} grip={[x + hx - gx, hy]} />
        })()}
        <Actor c={c} x={x} y={ride ? GROUND - keys(t, [[TRIP, 14], [TRIP + 0.5, 0]]) : GROUND} rot={rot} pose={pose} expr={expr} noCane={ride || (t > TRIP && t < 6.35)} />
        {/* 노인은 넘어질 때 지팡이를 놓침 → 바닥에 */}
        {old && !ride && t > TRIP + 0.3 && t < 6.35 && (
          <g transform={`translate(${STONE_X + 96 + keys(t, [[TRIP + 0.3, -60], [TRIP + 0.8, 0]])} ${GROUND + 7}) rotate(${keys(t, [[TRIP + 0.3, -60], [TRIP + 0.8, 0]], ease.bounce)})`}>
            <path d="M-30 0 H22 C32 0 32 -10 24 -10" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
            <path d="M-30 0 H22 C32 0 32 -10 24 -10" fill="none" stroke="#9A6A3E" strokeWidth="3.8" strokeLinecap="round" />
          </g>
        )}
        {/* 먼지는 몸 양끝(발·머리 앞)에서 퍼짐 → 몸을 가리지 않게 */}
        <Dust t={t} t0={TRIP + 0.75} x={x - 6} y={GROUND} n={4} spread={22} />
        <Dust t={t} t0={TRIP + 0.78} x={x + hh + 12} y={GROUND} n={4} spread={22} />
        <Bang t={t} t0={TRIP + 0.75} x={x + hh * 0.6} y={GROUND - 58} text="꽈당!" size={21} dur={1.1} />
        {down && t > TRIP + 1 && <Stars t={t} x={x + hh * 0.9} y={GROUND - 34} />}
        <Sweat t={t} t0={7.9} x={x + 34} y={GROUND - hh + 22} />
        <Gloom t={t} t0={9.9} x={x + 4} y={GROUND - hh - 18} />
        <Bubble t={t} t0={7.95} t1={9.8} x={x + 56} y={GROUND - hh - 12} text="아야야…" />
      </g>
    )
  },
}
