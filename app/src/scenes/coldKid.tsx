// 장면: 감기 (아이판, 13.5초, 11-28 사용자). 집에서 이불 덮고 누워 콜록 → 엄마가 이마 짚기 → 체온계 38.5℃ "삑!" → 젖은 수건 → "엄마… 아파…"
import { Actor, GROUND, headH, type Cast, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bang, Bubble, Sweat } from './Fx'
import { Shiver } from './Fx2'
import { INK, keys, pick, poseAt } from './kit'
import { gaitOf, STAND } from './poses'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MOM: Cast = { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'bun', hairColor: '#4A3426', top: 'shirt', topColor: '#F4C7A1', bottomColor: '#6A7A9A', shoes: 'loafers', shoesColor: '#8A5A34' }, age: 36 }
const MT = GROUND - 30 // 매트리스 윗면
const HB = 92 // 머리판 x
const MOMX = 80
const TOUCH = 3.4, THERMO = 5.0, BEEP = 7.4, TOWEL = 9.4

/** 침대 (머리 쪽이 왼쪽) */
function Bed({ x0, x1 }: { x0: number; x1: number }) {
  return (
    <g>
      <rect x={x0 - 8} y={MT - 30} width="12" height={GROUND - MT + 30} rx="4" fill="#B07A44" stroke={INK} strokeWidth="2.2" />
      <rect x={x1 - 6} y={MT - 8} width="10" height={GROUND - MT + 8} rx="3" fill="#B07A44" stroke={INK} strokeWidth="2.2" />
      <rect x={x0} y={MT + 8} width={x1 - x0} height="12" fill="#C98B55" stroke={INK} strokeWidth="2" />
      <rect x={x0} y={MT} width={x1 - x0} height="10" rx="3" fill="#FFFDF5" stroke={INK} strokeWidth="2" />
      <path d={`M${x0 + 4} ${GROUND} V${MT + 20} M${x1 - 4} ${GROUND} V${MT + 20}`} stroke={INK} strokeWidth="3" />
      {/* 베개 */}
      <rect x={x0 + 2} y={MT - 9} width="30" height="11" rx="5.5" fill="#DDEFF8" stroke={INK} strokeWidth="1.8" />
    </g>
  )
}

export const coldKid: SceneDef = {
  id: 'cold',
  dur: 13.5,
  still: 7.6,
  draw: (t, cast) => {
    const kid = cast[0]
    const hh = headH(kid)
    const feetX = HB + 10 + hh // 누운 아이 발 (머리는 왼쪽 베개)
    const headX = feetX - hh * 0.8 // 얼굴 가운데쯤
    const bodyY = MT - 14
    const cough = (t > 0.4 && t < 1.6) || (t > 11.2 && t < 11.9)
    const kidPose: SidePose = { ...STAND, head: cough ? -10 + 6 * Math.sin(t * 22) : -4, armN: [4, 6], armF: [-2, 6] }
    const kidExpr = pick<Expr>(t, [[0, 'sad'], [BEEP, 'surprised'], [BEEP + 0.6, 'sad']])
    // 엄마: 들어와서 → 이마 짚기 → 체온계 물려 주기 → 기다림 → 수건 → 쓰다듬기
    const g = gaitOf(MOM)
    const mx = t < TOUCH - 0.4 ? MOMX - g.v * Math.max(0, TOUCH - 0.4 - t) : MOMX
    const lean = (a: number, b: number): SidePose => ({ ...STAND, lean: 34, head: 14, armN: [a, b], armF: [20, 30] })
    const stroke = (tt: number): SidePose => lean(80 + 6 * Math.sin(tt * 6), 6)
    const momPose = poseAt(t, [
      [TOUCH - 0.4, g.pose], [TOUCH, STAND], [TOUCH + 0.4, lean(84, 6)], [TOUCH + 1.4, lean(84, 6)], [TOUCH + 1.7, STAND],
      [THERMO - 0.3, STAND], [THERMO, lean(86, 2)], [BEEP, lean(86, 2)], [BEEP + 0.3, { ...STAND, head: 6, armN: [60, 110], armF: [30, 60] }], [TOWEL - 0.4, { ...STAND, head: 6, armN: [60, 110], armF: [30, 60] }],
      [TOWEL, lean(82, 6)], [TOWEL + 0.6, lean(82, 6)], [TOWEL + 1.0, stroke], [12.2, stroke], [12.6, { ...STAND, head: 8, armN: [30, 40] }],
    ])
    const momExpr = pick<Expr>(t, [[0, 'normal'], [TOUCH + 0.5, 'surprised'], [TOUCH + 1.6, 'normal'], [BEEP, 'surprised'], [BEEP + 1.0, 'normal']])
    const thermo = t > THERMO + 0.3 && t < BEEP + 1.4
    const temp = keys(t, [[THERMO + 0.6, 37.0], [BEEP, 38.5]])
    const towel = t > TOWEL + 0.4
    const faceTop = bodyY - 26 // 얼굴 위쪽 (말풍선 자리)
    const blanketX0 = feetX - hh * 0.56
    return (
      <g>
        <Home winX={222} frameX={118} />
        <Bed x0={HB} x1={feetX + 18} />
        {/* 누운 아이: 머리 왼쪽, 얼굴 위 */}
        <Actor c={kid} x={feetX} y={bodyY} rot={-90} pose={kidPose} expr={kidExpr} noCane />
        {/* 이불 (몸을 덮음, 콜록할 때 들썩) */}
        <path d={`M${blanketX0} ${MT + 3} V${MT - 16 - (cough ? 2 * Math.abs(Math.sin(t * 22)) : 0)} Q${blanketX0 + 4} ${MT - 22} ${blanketX0 + 14} ${MT - 21} H${feetX - 6} Q${feetX + 12} ${MT - 22} ${feetX + 14} ${MT - 6} L${feetX + 16} ${MT + 8} H${blanketX0}Z`} fill="#F7D36A" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        {[0.2, 0.45, 0.7].map((k, i) => <circle key={i} cx={blanketX0 + (feetX - blanketX0) * k + 6} cy={MT - 10 + (i % 2) * 6} r="3" fill="#F2A33A" />)}
        <path d={`M${blanketX0 + 2} ${MT - 14} H${blanketX0 + 14}`} stroke="#E0B040" strokeWidth="2" />
        {/* 젖은 수건 (이마 위) */}
        {towel && <rect x={feetX - hh + 2} y={bodyY - 20} width="12" height="14" rx="3" fill="#BFE4F7" stroke={INK} strokeWidth="1.5" />}
        {/* 체온계 (입에 물고) + 숫자 */}
        {thermo && <g transform={`translate(${headX + 34} ${bodyY - 50})`}><rect x="-24" y="-10" width="48" height="18" rx="5" fill="#fff" stroke={INK} strokeWidth="1.6" /><text textAnchor="middle" y="4" fontSize="12" fill={temp > 37.5 ? '#E0533F' : INK}>{temp.toFixed(1)}℃</text></g>}
        <Bang t={t} t0={BEEP} x={headX + 80} y={bodyY - 44} text="삑!" size={15} color="#5E8FC9" dur={0.7} />
        {/* 엄마 */}
        <Actor c={MOM} x={mx} pose={momPose} expr={momExpr} holding={thermo ? <g transform="rotate(150)"><rect x="-3" y="-14" width="6" height="14" rx="3" fill="#fff" stroke={INK} strokeWidth="1.3" /><rect x="-2" y="-11" width="4" height="5" rx="1" fill="#7FCBE8" /></g> : undefined} />
        {t < 11 && <Shiver t={t} x={feetX - 30} y={MT - 30} />}
        <Sweat t={t} t0={BEEP + 0.3} x={MOMX + 24} y={GROUND - headH(MOM) + 18} />
        <Sweat t={t} t0={11.6} x={headX - 4} y={bodyY - 30} />
        <Bubble t={t} t0={0.4} t1={1.7} x={headX + 30} y={faceTop - 20} text="콜록콜록" />
        <Bubble t={t} t0={TOUCH + 0.5} t1={THERMO - 0.3} x={MOMX + 16} y={GROUND - headH(MOM) - 14} text="어머, 뜨거워!" />
        <Bubble t={t} t0={BEEP + 0.5} t1={TOWEL - 0.3} x={MOMX + 16} y={GROUND - headH(MOM) - 14} text="38.5도네…" />
        <Bubble t={t} t0={TOWEL + 1.0} t1={11.1} x={MOMX + 16} y={GROUND - headH(MOM) - 14} text="푹 자자" />
        <Bubble t={t} t0={11.9} t1={13.4} x={headX + 40} y={faceTop - 20} text="엄마… 아파…" />
      </g>
    )
  },
}
