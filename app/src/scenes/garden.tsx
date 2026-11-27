// 장면: 텃밭 (좋은 일 10초). 물뿌리개로 물 주기 → 상추가 쑥쑥 → 쪼그려 앉아 뽑기 → 바구니 들고 "싱싱하다!"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Garden } from './Backdrops3'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Drop } from './Fx2'
import { Basket, Lettuce, WateringCan } from './Props3'
import { ease, pick, poseAt, seg } from './kit'
import { gaitOf, SQUAT, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MEX = 120
const ROW = [168, 200, 232, 264]
const PULL = 5.6

export const garden: SceneDef = {
  id: 'garden',
  dur: 10,
  still: 4.0,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const x = t < 1.6 ? MEX - g.v * (1.6 - t) : t < 4.8 ? MEX : t < 5.4 ? MEX + (t - 4.8) * 50 : MEX + 30
    const water: SidePose = { ...STAND, lean: 10, armN: [64, 10] }
    const pull = (tt: number): SidePose => ({ ...SQUAT, armN: [70 - 30 * seg(tt, PULL + 0.3, PULL + 0.9), 20], head: 14 })
    const show: SidePose = { ...STAND, head: -4, armN: [64, 50] }
    const pose = poseAt(t, [[1.6, g.pose], [1.9, water], [4.6, water], [4.8, g.pose], [5.4, g.pose], [5.6, pull], [PULL + 1.0, pull], [7.0, STAND], [7.2, show], [8.8, show], [9.0, (tt: number) => ({ ...STAND, head: -8, armN: [80, 50] as [number, number], armF: [155 + 8 * Math.sin(tt * 9), 8] as [number, number], bob: -Math.abs(Math.sin(tt * 9)) * 4 })]])
    const grow = (i: number) => (i === 0 ? 1.1 : 0.4 + 0.8 * ease.back(seg(t, 2.4 + i * 0.4, 3.2 + i * 0.4)))
    const pulled = t > PULL + 0.6
    const lift = seg(t, PULL + 0.3, PULL + 0.9)
    const expr = pick<Expr>(t, [[0, 'happy'], [3, 'love'], [PULL, 'normal'], [PULL + 0.6, 'happy'], [7.2, 'love']])
    const top = GROUND - headH(me)
    const pour = t > 2.0 && t < 4.6
    return (
      <g>
        <Garden />
        {/* 빈 바구니는 처음부터 밭 옆 땅에 (뽑은 상추를 담고 들어 올림) */}
        {t < 6.8 && <g transform={`translate(${ROW[0] - 2} ${GROUND + 2}) scale(1.3)`}><Basket full={t > PULL + 0.6 ? 0.6 : 0} /></g>}
        {/* 물 다 준 뒤 물뿌리개는 땅에 내려놓음 */}
        {t >= 4.8 && <g transform={`translate(${MEX + 10} ${GROUND - 2}) scale(1.5)`}><WateringCan /></g>}
        {ROW.map((rx, i) => !(i === 0 && pulled) && <Lettuce key={i} x={rx} y={GROUND - 6 - (i === 0 ? lift * 16 : 0)} size={grow(i)} roots={i === 0 && lift > 0.2} />)}
        <Actor c={me} x={x} pose={pose} expr={expr} holding={t < 4.8 ? <g transform="scale(1.5)"><WateringCan pour={pour ? 1 : 0} /></g> : t > 6.8 ? <g transform="scale(1.3)"><Basket full={1} /></g> : undefined} caneLean={t > 1.8 && t < 6.9} />
        {pour && [2.1, 2.5, 2.9, 3.3, 3.7, 4.1].map((d, i) => <Drop key={i} t={t} t0={d} x={MEX + 44 + (i % 3) * 8} y0={GROUND - 64} y1={GROUND - 10} />)}
        {[1, 2, 3].map((i) => <Sparkle key={i} t={t} t0={3.0 + i * 0.4} x={ROW[i]} y={GROUND - 30} />)}
        <Hearts t={t} t0={7.6} x={MEX + 30} y={top + 6} n={3} />
        <Bubble t={t} t0={3.2} t1={4.6} x={MEX + 30} y={top - 14} text="쑥쑥 자라라~" />
        <Bubble t={t} t0={7.3} t1={9.6} x={MEX + 40} y={top - 14} text="싱싱하다!" />
      </g>
    )
  },
}
