// 장면: 손주 탄생 (좋은 일 10.5초, 노년·중년, 11-28). 산부인과 신생아실 복도로 걸어옴 → 아들(딸)이 유리창 안 아기를 가리킴
// "저기요, 저 아기예요!" → 유리창에 바짝 다가가 들여다봄 → 아기가 꼼지락, 하트 → "아이고, 예쁘다… 할머니(할아버지)야~" 손 흔듦
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { NurseryHall } from './Backdrops4'
import { Bassinet } from './Props4'
import { Bubble, Hearts, Sparkle } from './Fx'
import { ease, keys, pick, poseAt } from './kit'
import { gaitOf, STAND } from './poses'
import { grandName, grownKids } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const ARRIVE = 2.6, POINT = 3.0, PEEK = 4.6, WAVE = 7.0
const BABY_X = 172 // 우리 손주 (유리창 안)

export const grandchild: SceneDef = {
  id: 'grandchild',
  dur: 10.5,
  still: 6.0,
  draw: (t, cast) => {
    const me = cast[0], [son] = grownKids(me)
    const g = gaitOf(me)
    const meX = keys(t, [[0, -20], [ARRIVE, 112], [PEEK - 0.4, 112], [PEEK, 138]], ease.linear)
    const walking = t < ARRIVE || (t > PEEK - 0.4 && t < PEEK)
    const peek: SidePose = { ...STAND, lean: 10, head: -6, armN: [100, 30], armF: [94, 34] } // 두 손을 유리에 대고 들여다봄
    const wave = (tt: number): SidePose => ({ ...STAND, head: -4, armN: [150 + 16 * Math.sin(tt * 10), 20], armF: [-4, 10] })
    const mePose = walking ? g.pose(t) : poseAt(t, [[ARRIVE, STAND], [PEEK, peek], [WAVE - 0.2, peek], [WAVE, wave]])
    const sonPose = poseAt(t, [[0, STAND], [POINT, STAND], [POINT + 0.3, { ...STAND, head: -10, armN: [130, 0], armF: [-4, 10] }], [PEEK, { ...STAND, head: -10, armN: [130, 0], armF: [-4, 10] }], [PEEK + 0.3, STAND]])
    const expr = pick<Expr>(t, [[0, 'happy'], [POINT + 0.4, 'surprised'], [PEEK + 0.4, 'love'], [WAVE, 'happy']])
    const top = GROUND - headH(me), stop = GROUND - headH(son)
    // 우리 손주 아기 침대가 반짝 (이름표 '우리 손주')
    const wiggle = Math.sin(t * 6) * (t > PEEK ? 1.5 : 0.5)
    return (
      <g>
        <NurseryHall inside={<g>
          {[30, 80, BABY_X - 40, 190].map((bx, i) => <g key={i} transform={`translate(${bx} 78) scale(1.35)`}><Bassinet x={0} y={0} tag={['하늘', '바다', '우리 손주', '별이'][i]} blanket={['#F7D3E2', '#FFF3C0', '#9DD2F0', '#DDF2D9'][i]} /></g>)}
          <g transform={`translate(${BABY_X - 40} 78) scale(1.35) rotate(${wiggle} 0 -40)`}><ellipse cy="-30" rx="28" ry="22" fill="#FFF3A6" opacity={0.35 + 0.15 * Math.sin(t * 3)} /></g>
        </g>} />
        <Actor c={son} x={226} flip pose={sonPose} expr="happy" />
        <Actor c={me} x={meX} pose={mePose} expr={expr} caneLean={!walking} />
        {[0, 0.3, 0.6].map((d, i) => <Sparkle key={i} t={t} t0={PEEK + 0.3 + d} x={BABY_X + 8 - i * 14} y={70 + i * 6} s={0.8} />)}
        <Hearts t={t} t0={PEEK + 0.6} x={BABY_X} y={78} n={3} />
        <Bubble t={t} t0={POINT + 0.3} t1={PEEK + 0.2} at={226} tail="right" y={stop - 12} text={`${grandName(me) === '할머니' ? '어머니' : '아버지'}, 저 아기예요!`} size={12} />
        <Bubble t={t} t0={PEEK + 0.6} t1={WAVE} at={meX + 2} y={top - 12} text="아이고, 예쁘다…" />
        <Bubble t={t} t0={WAVE + 0.1} t1={10.4} at={meX + 2} y={top - 12} text={`${grandName(me)}야~`} />
      </g>
    )
  },
}
