// 장면: 칠순·육순 잔치 (좋은 일 11.5초, 노년, 11-28). 병풍 앞 잔칫상에 앉은 나 → 자녀·손주가 손뼉 "생신 축하드려요!"
// → 케이크 초를 "후~" → 꽃가루 → 자녀가 용돈 봉투를 두 손으로 드림 → 받아 들고 "아이고, 고맙다"
import { Actor, FrontActor, GROUND, headH, type SceneDef } from './Stage'
import { Banquet } from './Backdrops4'
import { Cake, Envelope, FruitTower, LowTable, SnackPlate } from './Props4'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Confetti } from './Fx3'
import { ease, keys, pick, poseAt, seg } from './kit'
import { CLAP, STAND } from './poses'
import { grandKids, grandName, grownKids } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BLOW = 3.4, GIVE = 6.0, TAKE = 7.4
const ME_X = 160, TBL_Y = GROUND - 26

export const birthday: SceneDef = {
  id: 'birthday',
  dur: 11.5,
  still: 4.4,
  draw: (t, cast, text) => {
    const me = cast[0]
    const seventy = !/육순/.test(text)
    const [son, daughter] = grownKids(me)
    const [kidA] = grandKids()
    // 아들: 왼쪽에서 손뼉 → 봉투 들고 상 앞으로 (두 손으로 드림) → 제자리
    const sonX = keys(t, [[GIVE - 0.8, 62], [GIVE, 112], [TAKE + 0.6, 112], [TAKE + 1.4, 62]])
    const walking = (t > GIVE - 0.8 && t < GIVE) || (t > TAKE + 0.6 && t < TAKE + 1.4)
    const offer: SidePose = { ...STAND, lean: 22, head: 8, armN: [82, 12], armF: [76, 16] } // 허리 숙여 두 손으로
    const walkP = (tt: number): SidePose => ({ ...STAND, legN: [22 * Math.sin(tt * 10), 10, 0], legF: [-22 * Math.sin(tt * 10), 10, 0], armN: [40, 30], armF: [-10, 20] })
    const sonPose = walking ? walkP(t) : poseAt(t, [[0, CLAP], [GIVE - 1, CLAP], [GIVE - 0.9, STAND], [GIVE, offer], [TAKE, offer], [TAKE + 0.4, STAND], [TAKE + 1.5, STAND], [TAKE + 1.8, CLAP]])
    const blowing = t > BLOW - 0.5 && t < BLOW + 0.5
    const meExpr = pick<Expr>(t, [[0, 'happy'], [BLOW - 0.5, 'surprised'], [BLOW + 0.6, 'happy'], [TAKE, 'love'], [TAKE + 2, 'happy']])
    const top = TBL_Y + 28 - headH(me, 60)
    const lit = t < BLOW
    const envHeld = t > GIVE - 0.9 && t < TAKE
    const envY = keys(t, [[TAKE, TBL_Y - 40], [TAKE + 0.5, TBL_Y - 56]], ease.out)
    return (
      <g>
        <Banquet title={seventy ? '칠순' : '육순'} t={t} />
        {/* 주인공: 상 뒤 방석에 앉아 앞을 봄 (상에 가려 다리는 안 보임) */}
        <clipPath id="bd-me"><rect x="0" y="0" width="320" height={TBL_Y + 2} /></clipPath>
        <g clipPath="url(#bd-me)"><g transform={`translate(0 ${blowing ? 2 : 0})`}><FrontActor c={me} x={ME_X} y={TBL_Y + 28} size={60} expr={meExpr} pose={t > TAKE && t < TAKE + 2.4 ? 'up' : 'idle'} /></g></g>
        {/* 받은 봉투를 높이 들어 보임 */}
        {t >= TAKE && t < TAKE + 2.6 && <g transform={`translate(${ME_X + 18} ${envY}) scale(1.4)`}><Envelope open={seg(t, TAKE + 0.4, TAKE + 0.9)} /></g>}
        <LowTable x={160} y={GROUND} w={200} h={26} />
        <FruitTower x={86} y={TBL_Y} s={0.95} />
        <FruitTower x={234} y={TBL_Y} c="#F2D27A" s={0.95} />
        <g transform={`translate(118 ${TBL_Y})`}><SnackPlate kind="ricecake" /></g>
        <g transform={`translate(202 ${TBL_Y})`}><SnackPlate kind="persimmon" /></g>
        <Cake x={ME_X} y={TBL_Y} t={t} candles={seventy ? 7 : 6} lit={lit} label={seventy ? '축 칠순' : '축 육순'} s={0.6} />
        {/* 후~ 바람 */}
        {blowing && [0, 1, 2].map((i) => <path key={i} d={`M${ME_X - 6 + i * 6} ${TBL_Y - 58} q2 ${6 + i * 2} 0 ${12}`} stroke="#9DD2F0" strokeWidth="1.6" fill="none" opacity={1 - seg(t, BLOW, BLOW + 0.5)} />)}
        {/* 가족: 왼쪽 아들·손주, 오른쪽 딸 */}
        <Actor c={kidA} x={30} pose={t > BLOW ? CLAP(t + 0.4) : STAND} expr="happy" />
        <Actor c={son} x={sonX} pose={sonPose} expr="happy" holding={envHeld ? <g transform="scale(1.5)"><Envelope /></g> : undefined} />
        <Actor c={daughter} x={278} flip pose={CLAP(t + 0.8)} expr="happy" />
        <Confetti t={t} t0={BLOW + 0.3} n={30} dur={3.4} />
        {[0, 0.2, 0.4].map((d, i) => <Sparkle key={i} t={t} t0={TAKE + 0.5 + d} x={ME_X + 10 + i * 10} y={envY - 14 + i * 4} />)}
        <Hearts t={t} t0={TAKE + 0.8} x={ME_X} y={top} n={3} />
        <Bubble t={t} t0={0.4} t1={2.6} at={sonX + 4} y={GROUND - headH(son) - 14} text={`${grandName(me) === '할머니' ? '어머니' : '아버지'}, 생신 축하드려요!`} size={12} />
        <Bubble t={t} t0={2.7} t1={BLOW + 0.4} at={ME_X} y={top - 12} text="후~" />
        <Bubble t={t} t0={GIVE + 0.1} t1={TAKE} at={sonX + 4} y={GROUND - headH(son) - 14} text="건강하세요!" size={12} />
        <Bubble t={t} t0={TAKE + 0.4} t1={11.4} at={ME_X} y={top - 12} text="아이고, 고맙다 얘들아" size={12} />
      </g>
    )
  },
}
