// 장면: 집에서 푹 쉬기 (좋은 일 10초, 어른, 11-28). 소파에 털썩 "오늘은 푹 쉬어야지~" → TV 켜고 과자 냠냠
// → 기지개·하품 → 꾸벅꾸벅 → 담요 덮고 쿨쿨 (창밖이 저녁으로)
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { SideSofa, SideTable } from './Props2'
import { Blanket, SnackPlate, TV } from './Props4'
import { Bubble, Hearts } from './Fx'
import { Zzz } from './Fx3'
import { ease, keys, pick, poseAt, seg } from './kit'
import { gaitOf, SIT_LEGS, sitLift } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const SOFA = 80, SIT = 1.4, TVON = 1.9, YAWN = 5.2, NOD = 6.4, SLEEP = 7.6

export const rest: SceneDef = {
  id: 'rest',
  dur: 10,
  still: 3.6,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const lift = sitLift(me, 30)
    const seated = t > SIT
    const x = seated ? SOFA + 6 : keys(t, [[0, 210], [SIT, SOFA + 6]], ease.linear)
    const y = seated ? GROUND - lift * ease.out(seg(t, SIT, SIT + 0.25)) : GROUND
    // 리모컨 누르기 → 과자 집어 먹기 반복 → 기지개 → 꾸벅 → 잠
    const remote: SidePose = { ...SIT_LEGS, lean: 4, armN: [84, 20], armF: [30, 50] }
    const snack = (tt: number): SidePose => { const k = Math.max(0, Math.sin(tt * 4)); return { ...SIT_LEGS, lean: 6 - 4 * k, head: -2, armN: [60 - 20 * k, 40 + 80 * k], armF: [26, 54] } }
    const yawn = (tt: number): SidePose => ({ ...SIT_LEGS, lean: -10, head: -14, armN: [170 + 6 * Math.sin(tt * 3), 6], armF: [165, 6] })
    const nod = (tt: number): SidePose => ({ ...SIT_LEGS, lean: -6, head: 8 + 14 * Math.max(0, Math.sin(tt * 3.4)), armN: [20, 40], armF: [16, 40] })
    const sleep: SidePose = { ...SIT_LEGS, lean: -16, head: -12, armN: [16, 70], armF: [12, 70] }
    const pose = seated ? poseAt(t, [[SIT, { ...SIT_LEGS, armN: [20, 30], armF: [16, 30] }], [TVON - 0.2, remote], [TVON + 0.4, remote], [TVON + 0.8, snack], [YAWN - 0.2, snack], [YAWN, yawn], [NOD - 0.3, yawn], [NOD, nod], [SLEEP - 0.2, nod], [SLEEP, sleep]]) : g.pose(t)
    const expr = pick<Expr>(t, [[0, 'happy'], [TVON + 1, 'love'], [YAWN, 'surprised'], [NOD, 'normal'], [SLEEP, 'happy']])
    const dusk = seg(t, 5, 9)
    const top = y - (seated ? headH(me) - 22 : headH(me))
    const blanket = ease.out(seg(t, SLEEP, SLEEP + 0.8))
    return (
      <g>
        <Home winX={196} frameX={20} night={dusk > 0.6 ? 1 : 0} />
        <rect width="320" height="180" fill="#2E2A50" opacity={0.18 * dusk} />
        <SideSofa x={SOFA} y={GROUND} />
        <Actor c={me} x={x} y={y} pose={pose} expr={expr} flip={!seated} caneLean={seated} noCane={seated} />
        {blanket > 0 && <g opacity={blanket} transform={`translate(0 ${(1 - blanket) * -8})`}><Blanket x={SOFA - 12} y={GROUND - 30} w={56} h={18} /></g>}
        <SideTable x={SOFA + 62} y={GROUND} />
        <g transform={`translate(${SOFA + 62} ${GROUND - 31})`}><SnackPlate kind="chips" /></g>
        <TV x={262} y={GROUND} t={t} on={t > TVON} />
        {/* TV 불빛이 방을 비춤 */}
        {t > TVON && <path d={`M234 ${GROUND - 70} L${SOFA + 20} ${GROUND - 50} L${SOFA + 20} ${GROUND} L234 ${GROUND - 20}Z`} fill="#BFE4F7" opacity={0.08 + 0.12 * dusk} />}
        <Hearts t={t} t0={TVON + 1.4} x={x + 20} y={top + 6} n={2} />
        <Zzz t={t} t0={SLEEP + 0.3} x={x + 16} y={top + 6} />
        <Bubble t={t} t0={SIT + 0.1} t1={TVON + 1.4} at={x + 2} y={top - 12} text="오늘은 푹 쉬어야지~" size={12} />
        <Bubble t={t} t0={YAWN} t1={NOD} at={x + 2} y={top - 12} text="하암~" />
      </g>
    )
  },
}
