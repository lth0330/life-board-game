// 장면: 반려동물과 공원 산책 (좋은 일 10초). 강아지가 앞서 걷다 꽃 냄새 → 폴짝 안김 → 쓰다듬기 → 다시 산책
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Park } from './Backdrops2'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Dog } from './Props2'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { gaitOf, SQUAT, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const X = 104
const STOP = 3.4
const GO = 7.6

export const pet: SceneDef = {
  id: 'pet',
  dur: 10,
  still: 6.4,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const moving = t < STOP || t > GO
    const cam = t < STOP ? t * g.v : t < GO ? STOP * g.v : STOP * g.v + (t - GO) * g.v
    // 걸을 땐 줄 잡은 손을 앞으로
    const leashWalk = (tt: number): SidePose => ({ ...g.pose(tt), armN: [40 + 4 * Math.sin(tt * 6), 20] })
    const pet = (tt: number): SidePose => (me.age ?? 30) < 13 ? { ...STAND, lean: 22, head: 18, armN: [70 + 12 * Math.sin(tt * 9), 10], armF: [10, 20] } : { ...SQUAT, armN: [70 + 14 * Math.sin(tt * 9), 6], head: 16 } // 아이는 서서 허리 숙여
    const mePose = poseAt(t, [[STOP, leashWalk], [STOP + 0.3, { ...STAND, armN: [40, 20] }], [5.2, { ...STAND, armN: [40, 20] }], [5.6, pet], [GO - 0.2, pet], [GO + 0.2, leashWalk]])
    // 강아지: 앞서 걷다(멈춰 킁킁) → 돌아서 폴짝 → 다시 앞으로
    const near = (me.age ?? 30) < 13 ? 58 : 48 // 쓰다듬을 때 강아지 자리 (사람과 겹치지 않게)
    const dogX = keys(t, [[0, X + 56], [STOP, X + 64], [4.9, X + 70], [5.4, X + near], [GO, X + near], [GO + 0.8, X + 56]], ease.inOut)
    const kidS = (me.age ?? 30) < 13
    const jump = (Math.sin(Math.PI * seg(t, 5.0, 5.6)) * (t < 5.6 ? 1 : 0) + (t > 5.8 && t < GO ? 0.25 * Math.abs(Math.sin(t * 6)) : 0)) * (kidS ? 0.4 : 1)
    const dogBack = t > 4.9 && t < GO // 사람 쪽을 봄
    const expr = pick<Expr>(t, [[0, 'happy'], [5.4, 'love'], [GO, 'happy']])
    // 줄: 손(대략) → 목줄
    const kid = (me.age ?? 30) < 8
    const hand: [number, number] = t > 5.4 && t < GO ? [X + 26, GROUND - (kid ? 26 : 40)] : [X + 18, GROUND - (kid ? 34 : 54)]
    const collar: [number, number] = dogBack ? [dogX - 8, GROUND - 28 - jump * 18] : [dogX + 8, GROUND - 28 - jump * 18]
    return (
      <g>
        <Park cam={cam} />
        <Actor c={me} x={X} pose={mePose} expr={expr} caneLean={t > 5.2 && t < GO} />
        <path d={`M${hand[0]} ${hand[1]} Q${(hand[0] + collar[0]) / 2} ${Math.max(hand[1], collar[1]) + 12} ${collar[0]} ${collar[1]}`} stroke="#E0533F" strokeWidth="1.8" fill="none" />
        <circle cx={hand[0]} cy={hand[1]} r="2.4" fill="#E0533F" stroke={INK} strokeWidth="1" />
        <g transform={`translate(${dogX} ${GROUND}) scale(1.25) translate(${-dogX} ${-GROUND})`}><Dog x={dogX} y={GROUND} t={t} walk={moving || (t > 5.0 && t < 5.4)} jump={jump} sniff={t > STOP + 0.2 && t < 4.8} flip={dogBack} /></g>
        {/* 꽃 */}
        {t > 2.6 && t < GO + 1.5 && <g transform={`translate(${X + 96 - (cam - STOP * g.v)} ${GROUND - 2})`}><path d="M0 0 V-12" stroke="#5E8F6A" strokeWidth="2" /><circle cy="-14" r="4.5" fill="#F2708A" stroke={INK} strokeWidth="1.4" /><circle cy="-14" r="1.6" fill="#FFD23F" /></g>}
        <Hearts t={t} t0={5.8} x={X + near + 4} y={GROUND - 50} />
        <Sparkle t={t} t0={GO + 0.5} x={X + 70} y={GROUND - 90} />
        <Sparkle t={t} t0={GO + 0.9} x={X - 20} y={GROUND - 110} s={0.8} />
        <Bubble t={t} t0={STOP + 0.4} t1={4.8} x={X + 96} y={GROUND - 60} text="킁킁" tail="right" size={12} />
        <Bubble t={t} t0={5.0} t1={6.0} x={X + 70} y={GROUND - 74} text="멍!" tail="right" size={13} />
        <Bubble t={t} t0={6.2} t1={GO} x={X + 40} y={GROUND - headH(me) - ((me.age ?? 30) < 13 ? 18 : 6)} text="옳지, 착하지~" />
      </g>
    )
  },
}
