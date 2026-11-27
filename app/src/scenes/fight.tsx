// 장면: 친구와 크게 싸움 (안 좋은 일 12.5초, 11-28 사용자: 싸우는 이유가 처음부터 보이게)
// 친구가 공원 시계 앞에서 발을 동동 구르며 기다림 → 내가 30분 늦게 뛰어옴 "미안, 늦었지~" → "30분이나 기다렸잖아!"
// → "버스가 늦게 와서…" → "맨날 핑계야!" → "맨날은 아니거든?!" → 말싸움 → "흥!" 등 돌리고 각자 감
import { Actor, castAt, GROUND, headH, type SceneDef } from './Stage'
import { Park } from './Backdrops2'
import { Bang, Bubble, Sweat } from './Fx'
import { Anger, Exclaim } from './Fx2'
import { INK, keys, pick, poseAt, shakeT } from './kit'
import { CROSS, gaitOf, run, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MX = 128, FX = 200
const ARRIVE = 2.0, LATE = 3.2, EXCUSE = 4.6, BLAME = 5.9, BACK = 7.1, LOUD = 8.1, HMPH = 9.2, APART = 9.9

const tap = (tt: number): SidePose => ({ ...CROSS, head: 4, legN: [8 * Math.max(0, Math.sin(tt * 10)), 10 * Math.max(0, Math.sin(tt * 10)), -10 * Math.max(0, Math.sin(tt * 10))] }) // 팔짱 끼고 발 동동
const watch: SidePose = { ...STAND, head: 18, armN: [70, 110], armF: [60, 100] } // 손목시계 보기
const pant = (tt: number): SidePose => ({ ...STAND, lean: 24, head: -4, armN: [40, 10], armF: [30, 10], bob: Math.sin(tt * 12) * 1.5 }) // 헉헉
const sorry: SidePose = { ...STAND, head: 6, armN: [140, 40], armF: [-4, 10] } // 머리 긁적
const plead: SidePose = { ...STAND, lean: 4, armN: [60, 60], armF: [50, 60] }
const insist = (tt: number): SidePose => ({ ...STAND, lean: 6, armN: [70 + 10 * Math.sin(tt * 8), 30], armF: [-6, 20] })
const shout = (tt: number): SidePose => ({ ...STAND, lean: 12, head: -4, armN: [80 + 25 * Math.sin(tt * 13), 40], armF: [-20, 30], bob: -Math.abs(Math.sin(tt * 13)) * 3 })

export const fight: SceneDef = {
  id: 'fight',
  dur: 12.5,
  still: BLAME + 0.4,
  draw: (t, cast) => {
    const me = cast[0], fr = castAt(cast, 1)
    const gm = gaitOf(me), gf = gaitOf(fr)
    const top = GROUND - headH(me), ftop = GROUND - headH(fr)
    // 나는 왼쪽에서 뛰어 옴 → 흥! 하고 둘 다 반대쪽으로 걸어 나감
    const meX = t < ARRIVE ? MX - (ARRIVE - t) * 110 : t < APART ? MX : MX - (t - APART) * gm.v * 0.5
    const frX = t < APART ? FX : FX + (t - APART) * gf.v * 0.5
    const angryWalk = (g: typeof gm) => (tt: number): SidePose => { const p = g.pose(tt * 0.8); return { ...p, lean: (p.lean ?? 0) + 6, head: (p.head ?? 0) - 6, armN: [-10, 50], armF: [-14, 50] } }
    const mePose = poseAt(t, [[ARRIVE - 0.1, run], [ARRIVE + 0.2, pant], [LATE - 0.3, pant], [LATE, sorry], [EXCUSE - 0.2, sorry], [EXCUSE, plead], [BLAME - 0.2, plead], [BLAME, STAND], [BACK - 0.2, STAND], [BACK, insist], [LOUD, shout], [HMPH - 0.1, shout], [HMPH, CROSS], [APART - 0.1, CROSS], [APART + 0.2, angryWalk(gm)]])
    const frPose = poseAt(t, [[0, tap], [0.8, tap], [1.0, watch], [1.6, watch], [1.8, tap], [LATE, tap], [LATE + 0.2, insist], [EXCUSE - 0.2, insist], [EXCUSE, CROSS], [BLAME - 0.2, CROSS], [BLAME, shout], [BACK - 0.2, shout], [BACK, CROSS], [LOUD, shout], [HMPH - 0.1, shout], [HMPH, CROSS], [APART - 0.1, CROSS], [APART + 0.2, angryWalk(gf)]])
    const meExpr = pick<Expr>(t, [[0, 'surprised'], [ARRIVE + 0.3, 'happy'], [LATE + 1.0, 'surprised'], [EXCUSE, 'sad'], [BACK, 'angry']])
    const frExpr = pick<Expr>(t, [[0, 'normal'], [1.0, 'angry']])
    const turned = t > HMPH
    // 공원 시계 (약속 3:00 → 지금 3:30)
    const min = keys(t, [[0, 28], [ARRIVE, 30]], (x) => x)
    return (
      <g transform={shakeT(t, LOUD, 1.2, 2.5)}>
        <Park />
        <g transform={`translate(${FX + 46} ${GROUND})`}>
          <path d="M0 0 V-74" stroke="#4A4E56" strokeWidth="3.4" />
          <circle cy="-86" r="13" fill="#fff" stroke={INK} strokeWidth="2.2" />
          {[0, 1, 2, 3].map((k) => <path key={k} d="M0 -97 v2.5" stroke={INK} strokeWidth="1.4" transform={`rotate(${k * 90} 0 -86)`} />)}
          {/* 3시 30분: 분침은 아래, 시침은 3과 4 사이 (분침이 28분 → 30분으로 움직임) */}
          <path d="M0 -86 V-77" stroke={INK} strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${(min - 30) * 6} 0 -86)`} />
          <path d="M0 -86 L5.5 -83" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <Actor c={fr} x={frX} pose={frPose} expr={frExpr} flip={!turned} caneLean={t < APART} />
        <Actor c={me} x={meX} pose={mePose} expr={meExpr} flip={turned} caneLean={t > ARRIVE && t < APART} />
        <Exclaim t={t} t0={1.1} x={FX - 18} y={ftop + 2} text="…" />
        <Sweat t={t} t0={ARRIVE + 0.1} x={meX + 20} y={top + 18} />
        <Sweat t={t} t0={EXCUSE + 0.2} x={MX + 20} y={top + 18} />
        <Anger t={t} t0={1.2} t1={12.5} x={frX + (turned ? 22 : -22)} y={ftop + 8} />
        <Anger t={t} t0={BACK} t1={12.5} x={meX + (turned ? -22 : 22)} y={top + 8} />
        <Bang t={t} t0={HMPH} x={MX - 12} y={top - 16} text="흥!" size={17} color="#7A4A2A" dur={1} />
        <Bang t={t} t0={HMPH + 0.1} x={FX + 12} y={ftop - 16} text="흥!" size={17} color="#7A4A2A" dur={1} />
        <Bubble t={t} t0={0.3} t1={1.8} at={FX - 8} tail="right" y={ftop - 14} text="왜 안 와…" size={13} />
        <Bubble t={t} t0={ARRIVE + 0.3} t1={LATE + 0.2} at={MX + 8} y={top - 14} text="미안, 늦었지~" />
        <Bubble t={t} t0={LATE + 0.3} t1={EXCUSE} at={FX - 8} tail="right" y={ftop - 14} text="30분이나 기다렸잖아!" size={13} />
        <Bubble t={t} t0={EXCUSE} t1={BLAME} at={MX + 8} y={top - 14} text="버스가 늦게 와서…" />
        <Bubble t={t} t0={BLAME} t1={BACK} at={FX - 8} tail="right" y={ftop - 14} text="맨날 핑계야!" />
        <Bubble t={t} t0={BACK} t1={LOUD} at={MX + 8} y={top - 14} text="맨날은 아니거든?!" />
        <Bubble t={t} t0={LOUD} t1={HMPH} at={FX - 8} tail="right" y={ftop - 14} text="됐어, 그만해!" size={15} />
        <Bubble t={t} t0={10.6} t1={12.4} at={Math.max(meX, 20)} y={top - 14} text="다시는 안 놀아!" />
      </g>
    )
  },
}
