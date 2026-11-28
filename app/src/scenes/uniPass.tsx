// 장면: 대학 합격 (좋은 일 10.5초, 학생·청년, 11-28). 책상 앞 노트북으로 합격자 발표 확인 "두근두근…"
// → 마우스 딸깍 → 화면에 '합격' → 의자에서 벌떡 만세 → 엄마(아빠)가 들어와 같이 기뻐함
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Desk, LaptopSide, ScreenZoom, SideChair } from './Props4'
import { Bubble, Hearts, Sweat } from './Fx'
import { Confetti } from './Fx3'
import { ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, CLAP, gaitOf, SIT_LEGS, sitLift, STAND } from './poses'
import { parentName, parentOf } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const CLICK = 2.6, SHOW = 3.0, JUMP = 3.9, MOM = 5.6
const ME_X = 112, DESK_X = 160

export const uniPass: SceneDef = {
  id: 'uniPass',
  dur: 10.5,
  still: 4.6,
  draw: (t, cast, text) => {
    const me = cast[0]
    const mom = parentOf(me)
    const uni = /체대/.test(text) ? '체육대학' : /예대|방송대/.test(text) ? '예술대학' : '한국대학교'
    const lift = sitLift(me, 30)
    const seated = t < JUMP
    // 앉아서 노트북 (손은 자판 위, 클릭 때 톡)
    const type = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 8, head: 4, armN: [74, 40 + 6 * Math.max(0, Math.sin(tt * 14))], armF: [70, 44] })
    const nervous = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 2, head: -2, armN: [64, 110 + 4 * Math.sin(tt * 20)], armF: [60, 100] }) // 두 손 모아 기도
    const click: SidePose = { ...SIT_LEGS, lean: 12, head: 6, armN: [78, 34], armF: [70, 44] }
    const pose = seated
      ? poseAt(t, [[0, type], [1.2, type], [1.5, nervous], [CLICK - 0.3, nervous], [CLICK, click], [SHOW + 0.4, click], [SHOW + 0.6, { ...click, head: -10, lean: -6 }]])
      : poseAt(t, [[JUMP, CHEER], [MOM + 0.8, CHEER], [MOM + 1.2, CLAP]])
    const meY = seated ? GROUND - lift : GROUND - Math.max(0, Math.sin(seg(t, JUMP, JUMP + 0.5) * Math.PI)) * 14
    const meX = seated ? ME_X : keys(t, [[JUMP, ME_X], [JUMP + 0.5, ME_X - 14]])
    const expr = pick<Expr>(t, [[0, 'normal'], [1.5, 'surprised'], [SHOW + 0.4, 'surprised'], [JUMP, 'happy'], [MOM + 1, 'love']])
    const g = gaitOf(mom)
    const momX = keys(t, [[MOM, 330], [MOM + 1.4, 236]], ease.out)
    const momPose = t < MOM + 1.4 ? g.pose(t) : poseAt(t, [[MOM + 1.4, STAND], [MOM + 1.7, CHEER]])
    const zoom = ease.back(seg(t, SHOW, SHOW + 0.35)) * (t < JUMP + 1.4 ? 1 : 1 - seg(t, JUMP + 1.4, JUMP + 1.8))
    const top = seated ? meY - (headH(me) - 22) : GROUND - headH(me)
    return (
      <g>
        <Home winX={214} frameX={20} />
        <Desk x={DESK_X} y={GROUND} w={70} h={42} lamp={false} />
        <g transform={`translate(${DESK_X - 8} ${GROUND - 42}) scale(1.35)`}><LaptopSide x={0} y={0} glow={t > CLICK ? 1 : 0.5} /></g>
        <SideChair x={ME_X - 4} y={GROUND} h={30} />
        <Actor c={me} x={meX} y={meY} pose={pose} expr={expr} noCane />
        {t > MOM - 0.1 && <Actor c={mom} x={momX} flip pose={momPose} expr={t > MOM + 1.4 ? 'love' : 'surprised'} />}
        <ScreenZoom x={232} y={66} k={zoom} title="합격자 발표" big="합격" sub={`${uni} 합격을 축하합니다`} color="#2E6FD8" />
        {t > 1.4 && t < CLICK + 0.2 && <Sweat t={t} t0={1.4} x={ME_X + 20} y={top + 16} />}
        <Confetti t={t} t0={JUMP} n={28} dur={3.2} />
        <Hearts t={t} t0={MOM + 1.8} x={(meX + momX) / 2} y={GROUND - headH(me) - 4} n={3} />
        <Bubble t={t} t0={1.4} t1={CLICK + 0.2} at={ME_X + 2} y={top - 12} text="두근두근…" />
        <Bubble t={t} t0={JUMP + 0.2} t1={MOM + 0.8} at={meX + 2} y={GROUND - headH(me) - 14} text="합격이다!!" />
        <Bubble t={t} t0={MOM + 1.5} t1={8.4} at={meX + 2} y={GROUND - headH(me) - 14} text={`${parentName(mom) === '엄마' ? '엄마' : '아빠'}! 나 붙었어!`} />
        <Bubble t={t} t0={8.4} t1={10.4} at={momX} tail="right" y={GROUND - headH(mom) - 14} text="아이고, 장하다!" />
      </g>
    )
  },
}
