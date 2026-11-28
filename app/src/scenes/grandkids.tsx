// 장면: 손주들이 놀러 옴 (노년, 10.5초, 11-28). "딩동" → 현관문이 열리고 손주 둘이 뛰어 들어옴 "할머니(할아버지)~!"
// → 쪼그려 앉아 두 팔 벌려 꼭 안음 → 주머니에서 용돈 봉투를 하나씩 → 손주들 "고맙습니다!" 만세 · 하트
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Envelope } from './Props4'
import { Bang, Bubble, Hearts } from './Fx'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, run, SQUAT, STAND } from './poses'
import { grandKids, grandName } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BELL = 0.4, OPEN = 1.2, HUG = 2.8, GIVE = 5.2, YAY = 7.0
const MEX = 104, DOOR = 262

export const grandkids: SceneDef = {
  id: 'grandkids',
  dur: 10.5,
  still: HUG + 0.8,
  draw: (t, cast) => {
    const me = cast[0], [k1, k2] = grandKids()
    const open = ease.out(seg(t, OPEN, OPEN + 0.5)) * (1 - seg(t, HUG + 1, HUG + 1.5))
    // 손주: 문에서 뛰어 들어와 내 앞에 (큰 아이 → 작은 아이)
    const k1X = keys(t, [[OPEN + 0.3, DOOR], [HUG, MEX + 30]], ease.out), k2X = keys(t, [[OPEN + 0.6, DOOR], [HUG + 0.2, MEX + 56]], ease.out)
    const hugArms: SidePose = { ...SQUAT, armN: [84, 70], armF: [80, 76] }
    const open2: SidePose = { ...SQUAT, armN: [110, 10], armF: [100, 10] }
    const give: SidePose = { ...SQUAT, lean: 18, armN: [86, 6], armF: [30, 40] }
    const mePose = poseAt(t, [[0, STAND], [OPEN + 0.6, STAND], [OPEN + 1.0, open2], [HUG - 0.1, open2], [HUG + 0.2, hugArms], [GIVE - 0.6, hugArms], [GIVE - 0.3, give], [GIVE + 1.4, give], [YAY - 0.2, { ...SQUAT, armN: [40, 60], armF: [30, 60] }], [YAY + 0.6, STAND]])
    const kPose = (k: number, x0: number): SidePose | ((tt: number) => SidePose) => (t < x0 ? STAND : t < HUG + k * 0.2 ? run : t < GIVE + k * 0.5 ? { ...STAND, lean: 10, armN: [80, 40], armF: [70, 40] } : t < YAY ? { ...STAND, armN: [80, 10], armF: [-4, 10] } : CHEER)
    const kp = (k: number, x0: number) => { const p = kPose(k, x0); return typeof p === 'function' ? p(t + k) : p }
    const expr = pick<Expr>(t, [[0, 'normal'], [OPEN + 0.4, 'surprised'], [OPEN + 1.0, 'love'], [GIVE, 'happy']])
    const top = GROUND - headH(me)
    const env = (k: number) => t > GIVE - 0.4 + k * 0.6 ? <g transform="scale(1.4)"><Envelope /></g> : undefined
    return (
      <g>
        <Home winX={160} frameX={20} />
        {/* 현관문 (오른쪽): 문틀 · 문짝이 열림 · 바깥 빛 */}
        <g transform={`translate(${DOOR} ${GROUND})`}>
          <rect x="-24" y="-92" width="48" height="92" fill="#FFF6DC" />
          <rect x="-24" y="-92" width="48" height="92" fill="#BFE4F7" opacity={open} />
          <path d={`M-24 0 V-92 H${-24 + 48 * (1 - open * 0.85)} V0Z`} fill="#A86B3C" stroke={INK} strokeWidth="1.8" />
          {open < 0.5 && <g><rect x="-18" y="-84" width="36" height="34" rx="2" fill="none" stroke="#8A5A34" strokeWidth="1.4" /><rect x="-18" y="-44" width="36" height="34" rx="2" fill="none" stroke="#8A5A34" strokeWidth="1.4" /><circle cx="14" cy="-46" r="2.4" fill="#F2C230" stroke={INK} strokeWidth="0.8" /></g>}
          <rect x="-28" y="-96" width="56" height="96" fill="none" stroke={INK} strokeWidth="2.6" />
          <rect x="-34" y="-2" width="68" height="4" fill="#8A6A55" stroke={INK} strokeWidth="1" />
        </g>
        <Actor c={me} x={MEX} pose={mePose} expr={expr} noCane={t > OPEN} caneLean={t > OPEN} holding={env(0)} />
        {t > OPEN + 0.3 && <Actor c={k1} x={k1X} flip pose={kp(0, OPEN + 0.3)} expr={t > YAY ? 'happy' : 'love'} holding={t > GIVE + 0.2 ? <g transform="scale(1.4)"><Envelope /></g> : undefined} />}
        {t > OPEN + 0.6 && <Actor c={k2} x={k2X} flip pose={kp(1, OPEN + 0.6)} expr={t > YAY ? 'happy' : 'love'} holding={t > GIVE + 0.8 ? <g transform="scale(1.4)"><Envelope /></g> : undefined} />}
        <Bang t={t} t0={BELL} x={DOOR} y={GROUND - 110} text="딩동~" size={14} color="#5E8FC9" dur={0.9} />
        <Hearts t={t} t0={HUG + 0.3} x={MEX + 20} y={GROUND - 70} n={3} />
        <Hearts t={t} t0={YAY + 0.2} x={k1X + 10} y={GROUND - headH(k1) - 2} n={3} />
        <Bubble t={t} t0={OPEN + 0.4} t1={HUG + 0.4} at={k1X} tail="right" y={GROUND - headH(k1) - 14} text={`${grandName(me)}~!`} />
        <Bubble t={t} t0={HUG + 0.5} t1={GIVE - 0.2} at={MEX + 2} y={top - 2} text="아이고, 내 새끼들!" />
        <Bubble t={t} t0={GIVE} t1={YAY} at={MEX + 2} y={top - 2} text="맛있는 거 사 먹어라" size={12} />
        <Bubble t={t} t0={YAY + 0.2} t1={10.4} at={k1X} tail="right" y={GROUND - headH(k1) - 14} text="고맙습니다!" />
      </g>
    )
  },
}
