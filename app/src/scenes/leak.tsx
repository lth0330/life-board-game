// 장면: 집에 물이 샘 (안 좋은 일 11초). 소파에서 쉬다 머리에 '똑!' → 천장에서 물 → 양동이 가져와 받기 → "수리비…"
import { Actor, GROUND, headH, isKid, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bang, Bubble, Sweat } from './Fx'
import { Drop, Exclaim, Gloom, MoneyFly } from './Fx2'
import { Bucket, BucketHeld, Phone, SideSofa } from './Props2'
import { keys, pick, poseAt, seg } from './kit'
import { gaitOf, HOLD_HEAD, POINT_UP, run, SIT, SIT_LEGS, SLUMP, STAND, sitLift } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const SOFA = 146
const SX = SOFA + 62 // 물 새는 자리 (천장): 앉은 사람 바로 위가 아니라 조금 앞 (11-28 사용자)
const HIT = 2.85 // 첫 방울이 머리에
const BUCKET = 7.0 // 양동이를 소파 위에 내려놓는 순간

/** 천장 물 얼룩: 번진 겹 무늬(가장자리가 진함) · 금 · 맺힌 물방울 (k = 번진 정도, bead = 맺힌 방울 크기) */
function Stain({ x, k, bead }: { x: number; k: number; bead: number }) {
  if (k <= 0) return null
  const r = 6 + 22 * k
  const blob = (s: number) => `M${x - r * s} 15 Q${x - r * s * 0.9} ${15 + 12 * s * k} ${x - r * s * 0.4} ${15 + 16 * s * k} Q${x} ${15 + 22 * s * k} ${x + r * s * 0.5} ${15 + 15 * s * k} Q${x + r * s * 0.95} ${15 + 10 * s * k} ${x + r * s} 15Z`
  return (
    <g>
      <path d={blob(1)} fill="#C9AE84" stroke="#8A7050" strokeWidth="1.4" opacity="0.85" />
      <path d={blob(0.72)} fill="#B39468" opacity="0.8" />
      <path d={blob(0.42)} fill="#94764E" opacity="0.85" />
      {k > 0.5 && <path d={`M${x - 4} 15 l-5 5 l3 3 M${x + 6} 15 l4 4`} stroke="#6A5238" strokeWidth="1.1" fill="none" />}
      {bead > 0 && <path transform={`translate(${x} ${16 + 20 * k}) scale(${0.4 + 0.9 * bead})`} d="M0 0 Q5 6 0 9 Q-5 6 0 0Z" fill="#6FC3EE" stroke="#2A5A8A" strokeWidth="1.1" />}
    </g>
  )
}

export const leak: SceneDef = {
  id: 'leak',
  dur: 11,
  still: 8.6,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const kid = isKid(me)
    const seatY = GROUND - sitLift(me, 30)
    // 소파(앉음) → 움찔·위 보기 → 비켜섬 → 오른쪽 끝으로 뛰어가 양동이 → 들고 와서 소파 위에 내려놓음 → 옆에 섬
    const x = keys(t, [[3.4, SOFA - 6], [3.9, SOFA - 50], [4.9, SOFA - 50], [5.45, 330], [5.75, 330], [6.5, SOFA + 90], [10, SOFA + 90]])
    // 양동이를 들고 왼쪽으로 돌아와 앞에 놓고, 그대로 물 새는 쪽(왼쪽)을 보고 섬 (11-28 사용자: 사람 기준 앞에 그릇)
    const carrying = t > 5.6 && t < BUCKET
    const sitPhone: SidePose = { ...SIT, armN: [50, 92], head: 8 }
    const pose = poseAt(t, [
      [0, sitPhone], [HIT, sitPhone], [HIT + 0.12, { ...SIT, lean: -6, head: -10, armN: [70, 92] }], [HIT + 0.45, { ...SIT, head: -28, armN: [50, 92] }], [3.3, { ...SIT, head: -28 }], // 움찔 → 위를 봄
      [3.5, { ...SIT_LEGS, legN: [40, 40, 0], legF: [36, 36, 0], lean: 20, head: -10, armN: [30, 30] }], [3.75, g.pose], [3.9, POINT_UP], [4.4, POINT_UP], [4.55, HOLD_HEAD], [4.9, HOLD_HEAD],
      [5.0, run], [5.45, run], [5.8, run], [6.5, run], [6.7, { ...STAND, armN: [50, 20], lean: 40, head: 10 }], [BUCKET, { ...STAND, armN: [50, 20], lean: 40, head: 10 }], [7.3, STAND], [7.8, SLUMP],
    ])
    const expr = pick<Expr>(t, [[0, 'happy'], [HIT, 'surprised'], [7.4, 'sad']])
    // 물방울 시간표 (첫 방울은 머리, 그다음 바닥, 양동이 놓은 뒤엔 양동이로)
    // 떨어지는 간격을 길게 (1.2초쯤), 첫 방울은 손에 든 폰 위로
    const drops = [HIT - 0.45, 4.0, 5.2, 6.4, 7.6, 8.8, 10.0]
    const headY = seatY - (headH(me) - 22) + 4
    // 다음 방울이 맺히는 정도 (천장에서 점점 커짐)
    const next = drops.find((d) => d > t)
    const bead = next === undefined ? 0 : seg(t, next - 1.0, next)
    const top = GROUND - headH(me)
    const holding = carrying ? <BucketHeld /> : t < 3.4 ? <g transform="rotate(-70)"><Phone /></g> : undefined
    return (
      <g>
        <Home />
        <Stain x={SX} k={seg(t, 0.4, 4)} bead={bead} />
        <SideSofa x={SOFA} y={GROUND} />
        {t > BUCKET && <Bucket x={SX} y={GROUND} level={seg(t, BUCKET, 11)} />}
        <Actor c={me} x={x} y={t < 3.5 ? seatY : GROUND} pose={pose} expr={expr} flip={t > 5.75} holding={holding} caneLean={t < 5.0 || carrying || t > 6.6} />
        {drops.map((d, i) => <Drop key={i} t={t} t0={d} x={SX} y0={36} y1={d + 0.45 > BUCKET ? GROUND - 20 : GROUND - 2} />)}
        <Bang t={t} t0={HIT} x={SX + 22} y={GROUND - 30} text="똑!" size={16} color="#5E8FC9" dur={0.9} />
        <Exclaim t={t} t0={HIT + 0.1} x={SOFA - 26} y={headY - 18} />
        <Sweat t={t} t0={4.2} x={SOFA - 30} y={top + 18} />
        {[7.6, 8.8, 10.0].map((d) => t > d + 0.45 && t < d + 1.1 && <text key={d} x={SX - 40} y={GROUND - 26} fontSize="12" fill="#2A5A8A">똑…</text>)}
        <Gloom t={t} t0={7.9} t1={8.4} x={SOFA + 90} y={top - 16} />
        {!kid && <MoneyFly t={t} t0={8.6} x={SOFA - 20} y={top + 30} />}
        <Gloom t={t} t0={10.2} x={SOFA + 90} y={top - 16} />
        <Bubble t={t} t0={3.9} t1={4.9} x={SX - 10} y={top - 14} text={kid ? '엄마~! 물 새요!' : '물이 새!'} size={15} />
        <Bubble t={t} t0={8.4} t1={10.1} x={SOFA + 104} y={top - 4} text={kid ? '으앙…' : '이번 달 어쩌지…'} />
      </g>
    )
  },
}
