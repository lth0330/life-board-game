// 장면: 허리·무릎 삐끗 (안 좋은 일 8.5초). 무거운 상자 들다 "삐끗!" → 쿵 떨어뜨림 → 허리(무릎) 붙잡고 "아이고 내 허리…" 하고 잠깐 있다 끝
// (11-28 사용자: 울며 걸어가는 장면은 빼기, 안 좋은 일이라고 다 같은 끝으로 만들지 않기)
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bang, Bubble, Sweat } from './Fx'
import { Zap } from './Fx3'
import { BoxHeld } from './Props3'
import { INK, ease, keys, pick, poseAt } from './kit'
import { gaitOf, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BOXX = 184
const LIFT = 2.4
const ZAPT = 3.3
const DROPT = 3.7

export const backpain: SceneDef = {
  id: 'backpain',
  dur: 8.5,
  still: 4.6,
  draw: (t, cast, text) => {
    const me = cast[0]
    const knee = /무릎/.test(text) && !/허리/.test(text)
    const g = gaitOf(me)
    const MEX = BOXX - 26
    const x = t < 1.8 ? MEX - g.v * (1.8 - t) : MEX
    const bend: SidePose = { ...STAND, lean: 52, head: 12, armN: [60, 10], armF: [50, 10], legN: [24, 30, 0], legF: [16, 24, 0] }
    const strain: SidePose = { ...STAND, lean: 20, head: -4, armN: [64, 70], armF: [56, 70], legN: [10, 14, 0], legF: [4, 10, 0] }
    const frozen: SidePose = { ...STAND, lean: 34, head: 2, armN: [40, 40], armF: [30, 40], legN: [14, 18, 0], legF: [6, 10, 0] }
    const holdBack: SidePose = knee
      ? { ...STAND, lean: 34, head: 12, armN: [52, 8], armF: [40, 20], legN: [20, 26, 0] } // 무릎 붙잡기
      : { ...STAND, lean: 30, head: 8, armN: [-56, 70], armF: [-44, 60] } // 허리 짚기
    // 아픈 곳을 문지름
    const rub = (tt: number): SidePose => ({ ...holdBack, armN: [(holdBack.armN?.[0] ?? 0) + 6 * Math.sin(tt * 10), holdBack.armN?.[1] ?? 0] as [number, number] })
    const pose = poseAt(t, [[1.8, g.pose], [2.1, bend], [LIFT, bend], [LIFT + 0.6, strain], [ZAPT, strain], [ZAPT + 0.15, frozen], [DROPT + 0.3, frozen], [4.4, holdBack], [5.0, rub]])
    const expr = pick<Expr>(t, [[0, 'normal'], [LIFT, 'angry'], [ZAPT, 'surprised'], [DROPT + 0.4, 'sad']])
    const holding = t > LIFT + 0.2 && t < DROPT ? <BoxHeld /> : undefined
    // 상자: 바닥 → 들림(손) → 쿵 떨어짐
    const boxOnFloor = t < LIFT + 0.2 || t > DROPT
    const boxY = t > DROPT ? keys(t, [[DROPT, GROUND - 46], [DROPT + 0.3, GROUND]], ease.in) : GROUND
    const top = GROUND - headH(me)
    const zapY = knee ? GROUND - 30 : top + 52
    return (
      <g>
        <Home />
        {boxOnFloor && <g transform={`translate(${BOXX + (t > DROPT ? 6 : 0)} ${boxY})`}><rect x="-14" y="-22" width="28" height="22" rx="2" fill="#C98B55" stroke={INK} strokeWidth="2" /><path d="M-14 -14 H14 M0 -22 V-14" stroke="#9A6A3E" strokeWidth="2" /></g>}
        <Actor c={me} x={x} pose={pose} expr={expr} holding={holding} caneLean={t > 1.8} />
        <Sweat t={t} t0={LIFT + 0.3} x={x + 22} y={top + 22} dur={1.0} />
        <Zap t={t} t0={ZAPT} t1={ZAPT + 1.2} x={x - 14} y={zapY} />
        <Bang t={t} t0={ZAPT} x={x - 30} y={top + 8} text="삐끗!" size={17} color="#E0533F" dur={1.0} />
        <Bang t={t} t0={DROPT + 0.3} x={BOXX + 30} y={GROUND - 34} text="쿵" size={13} color="#7A4A2A" dur={0.7} />
        {t > 4.4 && <Zap t={t} t0={4.4} t1={7.0} x={x - 14} y={zapY} />}
        <Sweat t={t} t0={5.6} x={x + 24} y={top + 26} dur={1.2} />
        <Bubble t={t} t0={4.5} t1={8.3} x={x + 30} y={top - 4} text={knee ? '아이고 내 무릎…' : '아이고 내 허리…'} />
      </g>
    )
  },
}
