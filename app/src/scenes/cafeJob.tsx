// 장면: 카페 알바 (청년, 11.5초, 11-28). 손님 "카페라테 한 잔이요" → 커피 머신에서 추출 → 우유 스팀 → 라테 아트 하트(확대)
// → 손님에게 건넴 "와, 하트다!" → 땀 닦으며 "휴, 오늘도 열심히!" (알바비 +)
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Cafe, CafeCounter } from './Backdrops4'
import { EspressoMachine, LatteCup } from './Props4'
import { Bubble, Hearts, Sparkle, Sweat } from './Fx'
import { MoneyFly } from './Fx2'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { gaitOf, STAND } from './poses'
import { CUSTOMER } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const ORDER = 1.6, POUR = 2.8, STEAM = 4.4, ART = 6.0, HAND = 7.8, DONE = 9.2
const ME_X = 132, CTR_TOP = GROUND - 55, MACH_X = 76

export const cafeJob: SceneDef = {
  id: 'cafeJob',
  dur: 11.5,
  still: 6.6,
  draw: (t, cast) => {
    const me = cast[0], cu = CUSTOMER
    const g = gaitOf(cu)
    const cuX = keys(t, [[0, 340], [ORDER, 252]], ease.out)
    const cuPose = t < ORDER ? g.pose(t) : poseAt(t, [[ORDER, STAND], [HAND, STAND], [HAND + 0.3, { ...STAND, armN: [70, 20], armF: [-4, 10] }], [HAND + 1.2, { ...STAND, armN: [60, 60], armF: [-4, 10] }]])
    // 나: 손님 보며 인사 → 돌아서 머신 (왼쪽) → 다시 손님 쪽
    const atMachine = t > ORDER + 0.8 && t < ART + 0.4
    const work = (tt: number): SidePose => ({ ...STAND, lean: 10, head: 6, armN: [68, 30 + 4 * Math.sin(tt * 6)], armF: [60, 36] })
    const jug = (tt: number): SidePose => ({ ...STAND, lean: 8, head: 8, armN: [60 + 6 * Math.sin(tt * 12), 46], armF: [56, 40] }) // 스팀 피처 흔들기
    const pourArt: SidePose = { ...STAND, lean: 14, head: 12, armN: [56, 60], armF: [62, 30] }
    const give: SidePose = { ...STAND, lean: 6, head: 0, armN: [80, 8], armF: [-4, 10] }
    const wipe = (tt: number): SidePose => ({ ...STAND, head: -6, armN: [150, 120 + 10 * Math.sin(tt * 10)], armF: [-4, 10] })
    const pose = poseAt(t, [[0, STAND], [ORDER + 0.8, STAND], [ORDER + 1.0, work], [STEAM, work], [STEAM + 0.2, jug], [ART - 0.2, jug], [ART, pourArt], [ART + 1.2, pourArt], [HAND - 0.2, STAND], [HAND, give], [HAND + 0.8, give], [DONE, STAND], [DONE + 0.3, wipe]])
    const expr = pick<Expr>(t, [[0, 'happy'], [ORDER + 1, 'normal'], [ART + 0.6, 'happy'], [DONE, 'happy']])
    const top = GROUND - headH(me)
    // 잔: 머신 받침 → 내 손(라테 아트) → 카운터 위로 밀어 줌 → 손님 손
    const cupX = keys(t, [[ART - 0.2, MACH_X + 9], [ART + 0.1, ME_X - 20], [HAND, ME_X - 20], [HAND + 0.6, ME_X + 50], [HAND + 1.1, cuX - 26]])
    const cupY = t < ART - 0.2 ? CTR_TOP - 8 : t < HAND + 0.6 ? CTR_TOP : CTR_TOP - keys(t, [[HAND + 0.6, 0], [HAND + 1.1, 14]])
    const artK = seg(t, ART + 0.2, ART + 1.4)
    return (
      <g>
        <Cafe t={t} />
        <Actor c={me} x={ME_X} pose={pose} expr={expr} flip={atMachine} noCane />
        <CafeCounter x={140} y={GROUND} w={170} h={50} />
        <EspressoMachine x={MACH_X} y={CTR_TOP} t={t} pour={t > POUR && t < STEAM ? 1 : 0} steam={t > STEAM && t < ART ? 1 : 0} />
        <g transform={`translate(${cupX} ${cupY})`}><LatteCup art={artK > 0.9} /></g>
        <Actor c={cu} x={cuX} flip pose={cuPose} expr={t > HAND + 0.8 ? 'love' : 'happy'} />
        {/* 라테 아트 확대: 위에서 본 잔에 우유로 하트가 그려짐 */}
        {t > ART + 0.1 && t < HAND + 0.2 && (() => {
          const k = ease.back(seg(t, ART + 0.1, ART + 0.4)) * (t < HAND - 0.1 ? 1 : 1 - seg(t, HAND - 0.1, HAND + 0.2))
          return (
            <g transform={`translate(${ME_X + 6} 58) scale(${k})`}>
              <circle r="26" fill="#fff" stroke={INK} strokeWidth="2" />
              <circle r="22" fill="#FFFFFF" stroke="#D8D2C8" strokeWidth="1" />
              <circle r="18" fill="#B07A48" stroke={INK} strokeWidth="1.2" />
              <g transform={`scale(${0.3 + 0.7 * artK})`}><path d="M0 10 Q-14 0 -10 -8 Q-6 -14 0 -6 Q6 -14 10 -8 Q14 0 0 10Z" fill="#FFF6EC" /><path d="M0 -6 V10" stroke="#E8D2B8" strokeWidth="1" /></g>
              <path d="M24 -6 q10 0 9 8 q-1 6 -9 4" fill="none" stroke={INK} strokeWidth="2" />
            </g>
          )
        })()}
        {t > STEAM && t < ART && <Sweat t={t} t0={STEAM} x={ME_X - 18} y={top + 18} />}
        <Sparkle t={t} t0={ART + 1.3} x={ME_X + 20} y={46} />
        <Hearts t={t} t0={HAND + 1.1} x={cuX - 4} y={GROUND - headH(cu) + 4} n={3} />
        <MoneyFly t={t} t0={DONE + 0.3} x={ME_X + 20} y={top + 10} n={2} />
        <Bubble t={t} t0={0.8} t1={ORDER + 1.0} at={cuX} tail="right" y={GROUND - headH(cu) - 14} text="카페라테 한 잔이요!" size={12} />
        <Bubble t={t} t0={ORDER + 1.05} t1={ORDER + 2.0} at={ME_X + 2} y={top - 14} text="네, 잠시만요~" size={12} />
        <Bubble t={t} t0={HAND + 1.0} t1={DONE + 0.2} at={cuX} tail="right" y={GROUND - headH(cu) - 14} text="와, 하트다!" />
        <Bubble t={t} t0={DONE + 0.3} t1={11.4} at={ME_X + 2} y={top - 14} text="휴, 오늘도 열심히!" />
      </g>
    )
  },
}
