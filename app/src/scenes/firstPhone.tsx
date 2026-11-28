// 장면: 첫 휴대폰 (학생, 10.5초, 11-28). 엄마가 리본 달린 상자를 건넴 "선물이야" → 상자를 열자 반짝이는 새 휴대폰
// → 전원을 켜면 화면이 밝아짐 → 팔을 뻗어 셀카 "찰칵" (번쩍) → "드디어 내 폰!" 만세 → 엄마 "아껴 써라~"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { PhoneBox } from './Props4'
import { Phone } from './Props2'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Flash } from './Fx3'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, STAND } from './poses'
import { parentName, parentOf } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const GIVE = 1.4, TAKE = 2.4, OPEN = 3.0, ON = 4.4, SELFIE = 5.8, SNAP = 6.6, YAY = 7.6
const MEX = 128, MOMX = 196

export const firstPhone: SceneDef = {
  id: 'firstPhone',
  dur: 10.5,
  still: OPEN + 0.8,
  draw: (t, cast) => {
    const me = cast[0], mom = parentOf(me)
    const hold: SidePose = { ...STAND, lean: 6, head: 12, armN: [64, 40], armF: [58, 44] } // 두 손으로 들고 내려다봄
    const selfie: SidePose = { ...STAND, head: -8, armN: [112, -2], armF: [-4, 10] } // 팔을 앞 위로 뻗어 셀카
    const mePose = poseAt(t, [[0, STAND], [TAKE - 0.4, STAND], [TAKE, { ...STAND, armN: [80, 14], armF: [74, 16] }], [OPEN - 0.2, hold], [SELFIE - 0.3, hold], [SELFIE, selfie], [YAY - 0.3, selfie], [YAY, CHEER]])
    const momPose = poseAt(t, [[0, { ...STAND, armN: [60, 50], armF: [54, 50] }], [GIVE, { ...STAND, armN: [80, 14], armF: [74, 16] }], [TAKE + 0.2, { ...STAND, armN: [80, 14], armF: [74, 16] }], [TAKE + 0.5, STAND], [YAY + 1, { ...STAND, armN: [40, 100], armF: [-4, 10] }]])
    const boxX = keys(t, [[GIVE, MOMX - 26], [TAKE, MEX + 26]])
    const boxY = GROUND - 58
    const expr = pick<Expr>(t, [[0, 'surprised'], [OPEN + 0.4, 'love'], [SELFIE, 'tease'], [YAY, 'happy']])
    const top = GROUND - headH(me)
    const open = ease.out(seg(t, OPEN, OPEN + 0.6))
    // 들고 있는 물건: 상자(열림) → 폰
    const meHold = t > OPEN + 0.8 ? <g transform={t > SELFIE - 0.2 ? 'rotate(-80) translate(0 6)' : 'rotate(-60) translate(0 8)'}><Phone lit={t > ON} /></g> : undefined
    const showBox = t < OPEN + 0.8
    const glow = t > ON ? 0.5 + 0.2 * Math.sin(t * 6) : 0
    return (
      <g>
        <Home winX={220} frameX={24} />
        <Actor c={mom} x={MOMX} flip pose={momPose} expr="happy" />
        <Actor c={me} x={MEX} pose={mePose} expr={expr} holding={meHold} noCane />
        {showBox && <g transform={`translate(${boxX} ${boxY}) scale(1.8)`}>
          <PhoneBox open={open} />
          {t < OPEN && <g><path d="M-10 -5 H10 M0 -8 V0" stroke="#E0533F" strokeWidth="1.6" /><path d="M0 -8 q-5 -5 -6 -1 q1 3 6 1 q5 -5 6 -1 q-1 3 -6 1" fill="#E0533F" stroke={INK} strokeWidth="0.6" /></g>}
        </g>}
        {[0, 0.2, 0.4].map((d, i) => <Sparkle key={i} t={t} t0={OPEN + 0.4 + d} x={boxX - 8 + i * 10} y={boxY - 26 + i * 4} s={0.9} />)}
        {glow > 0 && t < SELFIE && <circle cx={MEX + 20} cy={top + 46} r="10" fill="#BFE4F7" opacity={glow * 0.5} />}
        <Flash t={t} t0={SNAP} power={0.5} />
        <Hearts t={t} t0={YAY + 0.2} x={MEX} y={top} n={3} />
        <Bubble t={t} t0={0.4} t1={TAKE} at={MOMX} tail="right" y={GROUND - headH(mom) - 14} text="자, 선물이야" />
        <Bubble t={t} t0={OPEN + 0.5} t1={SELFIE} at={MEX + 2} y={top - 12} text="우와! 내 휴대폰!" />
        <Bubble t={t} t0={SNAP - 0.4} t1={YAY} at={MEX + 2} y={top - 12} text="찰칵!" />
        <Bubble t={t} t0={YAY + 0.1} t1={9.0} at={MEX + 2} y={top - 12} text={`고마워, ${parentName(mom)}!`} />
        <Bubble t={t} t0={9.0} t1={10.4} at={MOMX} tail="right" y={GROUND - headH(mom) - 14} text="아껴 써라~" />
      </g>
    )
  },
}
