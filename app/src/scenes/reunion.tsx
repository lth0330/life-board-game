// 장면: 동창회 (좋은 일 11초, 중년·노년, 11-28). '동창회' 현수막 걸린 식당에 들어섬 → 두리번 → 친구가 "어?! 너…?"
// → 둘 다 옛 교복 시절이 떠오름(빛바랜 단체 사진) → "맞다! 반가워!" 달려가 끌어안음 → 셋이 웃으며 사진 보며 수다
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Restaurant } from './Backdrops'
import { Banner } from './Props3'
import { Photo } from './Props4'
import { Bubble, Hearts } from './Fx'
import { Exclaim } from './Fx2'
import { ease, keys, pick, poseAt, seg } from './kit'
import { CLAP, gaitOf, STAND } from './poses'
import { pal } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const ENTER = 2.2, SEE = 2.8, MEMO = 3.6, RUN = 5.4, HUG = 6.2, CHAT = 8.0

export const reunion: SceneDef = {
  id: 'reunion',
  dur: 11,
  still: 6.6,
  draw: (t, cast, text) => {
    const me = cast[0], a = pal(cast, 1), b = pal(cast, 2)
    const middle = (me.age ?? 50) < 60
    const g = gaitOf(me)
    // 나: 왼쪽에서 걸어 들어와 멈춤 → 두리번 → 친구 쪽으로 빠르게 → 안음
    const meX = keys(t, [[0, -30], [ENTER, 96], [RUN, 96], [HUG, 140]], ease.linear)
    const aX = keys(t, [[RUN, 236], [HUG, 172]], ease.linear)
    const hug: SidePose = { ...STAND, lean: 8, head: 6, armN: [86, 80], armF: [80, 86] }
    const look = (tt: number): SidePose => ({ ...STAND, head: -6 + 6 * Math.sin(tt * 3) })
    const mePose = t < ENTER || (t > RUN && t < HUG) ? g.pose(t * (t > RUN ? 1.6 : 1)) : poseAt(t, [[ENTER, STAND], [ENTER + 0.2, look], [SEE, look], [SEE + 0.2, { ...STAND, head: -4, armN: [60, 100], armF: [-4, 10] }], [RUN - 0.2, { ...STAND, head: -4, armN: [60, 100], armF: [-4, 10] }], [HUG, hug], [CHAT - 0.3, hug], [CHAT, CLAP]])
    const aPose = t > RUN && t < HUG ? gaitOf(a).pose(t * 1.6) : poseAt(t, [[0, { ...STAND, armN: [40, 70] }], [SEE, { ...STAND, armN: [40, 70] }], [SEE + 0.2, { ...STAND, armN: [150, 20], armF: [-4, 10] }], [RUN - 0.2, { ...STAND, armN: [150, 20], armF: [-4, 10] }], [HUG, hug], [CHAT - 0.3, hug], [CHAT, CLAP]])
    const bPose = poseAt(t, [[0, { ...STAND, armN: [40, 70] }], [CHAT, { ...STAND, armN: [40, 70] }], [CHAT + 0.2, CLAP]])
    const meExpr = pick<Expr>(t, [[0, 'normal'], [SEE, 'surprised'], [MEMO + 0.8, 'happy'], [HUG, 'love'], [CHAT, 'happy']])
    const aExpr = pick<Expr>(t, [[0, 'happy'], [SEE, 'surprised'], [MEMO + 0.8, 'happy'], [HUG, 'love'], [CHAT, 'happy']])
    const top = GROUND - headH(me)
    const memo = ease.back(seg(t, MEMO, MEMO + 0.4)) * (t < RUN ? 1 : 1 - seg(t, RUN, RUN + 0.3))
    return (
      <g>
        <Restaurant menu={['한정식', '불고기', '잡채']} prices={['25,000', '18,000', '12,000']} />
        <Banner x={128} y={2} w={110} color="#2E6FD8" text={middle ? '20년 만의 동창회' : '그리운 동창회'} />
        <Actor c={b} x={284} flip pose={bPose} expr="happy" />
        <Actor c={a} x={aX} flip pose={aPose} expr={aExpr} caneLean={t > HUG} />
        <Actor c={me} x={meX} pose={mePose} expr={meExpr} caneLean={t > HUG} />
        {/* 옛 기억: 빛바랜 교복 단체 사진이 둘 사이에 떠오름 */}
        {memo > 0 && <g transform={`translate(${(meX + aX) / 2} 58) scale(${memo * 3.2})`}><Photo w={26} h={18} kind="school" old /><text y="12.6" textAnchor="middle" fontSize="3.4" fill="#7A5232">{/졸업|초등/.test(text) ? '' : '그 시절 우리 반'}</text></g>}
        <Exclaim t={t} t0={SEE} x={aX - 16} y={GROUND - headH(a) + 4} text="!?" />
        <Hearts t={t} t0={HUG + 0.2} x={(meX + aX) / 2} y={top} n={3} />
        <Bubble t={t} t0={0.5} t1={ENTER} at={meX + 2} y={top - 12} text="다들 왔나?" />
        <Bubble t={t} t0={SEE + 0.1} t1={MEMO + 0.6} at={aX} tail="right" y={GROUND - headH(a) - 14} text="어?! 너…" />
        <Bubble t={t} t0={MEMO + 0.7} t1={RUN + 0.4} at={meX + 2} y={top - 12} text="맞다! 반가워!" />
        <Bubble t={t} t0={CHAT} t1={10.9} at={aX} tail="right" y={GROUND - headH(a) - 14} text="하나도 안 변했네!" />
      </g>
    )
  },
}
