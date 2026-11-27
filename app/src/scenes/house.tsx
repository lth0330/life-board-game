// 장면: 내 집 마련 (좋은 일 13초, 11-28 다시 만듦)
// 부동산: 매매 계약서에 도장 "쾅!" → 열쇠를 받음 "축하드려요!" → (장면 바뀜) → 큰 새집 앞 '축 입주' 현수막·이삿짐 상자
// → 열쇠로 "철컥" → 문이 열리고 불빛 → "드디어 내 집!" 만세 → 색종이·하트
import { Actor, GROUND, H, headH, W, type Cast, type SceneDef } from './Stage'
import { DOOR, HOUSE_SIZE, HouseFront } from './Backdrops3'
import { Bang, Bubble, Hearts, Sparkle } from './Fx'
import { Confetti } from './Fx3'
import { Key } from './Props3'
import { INK, ease, pick, poseAt, seg } from './kit'
import { CHEER, CLAP, gaitOf, STAND } from './poses'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const AGENT: Cast = { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#3A2A1A', top: 'tie', topColor: '#FFFFFF', outer: 'vest', outerColor: '#6A5A8A', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118', acc: 'glasses' }, age: 50 }
const STAMP = 1.6, KEY = 2.8, CUT = 4.6 // 부동산 → 집 앞
const ARRIVE = 6.9, UNLOCK = 7.4, OPEN = 7.9
const DESK = 166

/** 부동산 사무실: 간판 · 매물 사진들 · 책상 */
function Realty() {
  return (
    <g>
      <rect width={W} height={H} fill="#F4EEE2" />
      <rect x="20" y="16" width="120" height="22" rx="3" fill="#2E6FD8" stroke={INK} strokeWidth="2" />
      <text x="80" y="32" textAnchor="middle" fontSize="13" fill="#fff">행복 부동산</text>
      {/* 매물 사진 */}
      {[[176, 18], [218, 18], [260, 18], [176, 62], [218, 62], [260, 62]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect width="36" height="38" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" />
          <rect x="4" y="4" width="28" height="18" fill="#DDEFF8" />
          <path d="M10 22 V14 L18 8 L26 14 V22Z" fill={['#F6E7CF', '#E9C9B8', '#DCE6F0'][i % 3]} stroke={INK} strokeWidth="1" />
          <path d="M9 14 L18 7 L27 14" stroke="#C9694F" strokeWidth="2" fill="none" />
          <path d="M6 28 H30 M6 33 H22" stroke="#B8A898" strokeWidth="1.6" />
        </g>
      ))}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#C9B49A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

export const house: SceneDef = {
  id: 'house',
  dur: 13,
  still: 9.0,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const hv = g.v * (HOUSE_SIZE / 62) // 작은 사람은 걸음도 짧음
    const inRealty = t < CUT
    const fade = 1 - Math.abs(seg(t, CUT - 0.35, CUT + 0.35) * 2 - 1) // 장면 바뀔 때 하얗게
    // ── 부동산 ──
    const stampP = (tt: number): SidePose => ({ ...STAND, lean: 14, head: 14, armN: [72 - 22 * Math.max(0, Math.sin((tt - STAMP) * 9)), 30], armF: [40, 50] })
    const takeKey: SidePose = { ...STAND, lean: 8, armN: [80, 20], armF: [20, 40] }
    const lookKey: SidePose = { ...STAND, head: 6, armN: [66, 90], armF: [20, 40] }
    const realPose = poseAt(t, [[0, { ...STAND, lean: 10, head: 12, armN: [50, 50] }], [STAMP - 0.4, { ...STAND, lean: 14, head: 14, armN: [80, 30] }], [STAMP, stampP], [STAMP + 0.5, stampP], [STAMP + 0.8, STAND], [KEY, STAND], [KEY + 0.3, takeKey], [KEY + 0.7, takeKey], [KEY + 1.0, lookKey]])
    const agentPose = poseAt(t, [[0, { ...STAND, armN: [30, 70], armF: [24, 70] }], [KEY - 0.3, { ...STAND, armN: [30, 70], armF: [24, 70] }], [KEY, { ...STAND, lean: 14, armN: [80, 14] }], [KEY + 0.7, { ...STAND, lean: 14, armN: [80, 14] }], [KEY + 1.0, CLAP]])
    const stamped = t > STAMP + 0.1
    const gotKey = t > KEY + 0.5
    // ── 새집 ──
    const doorStand = DOOR.x - 8
    const x = t < ARRIVE ? doorStand - hv * (ARRIVE - t) : t < 8.6 ? doorStand : t < 11.4 ? doorStand - Math.min(t - 8.6, 0.6) * 60 : doorStand - 36 + (t - 11.4) * hv // 문 열고 물러나 집을 올려다봄 → 집 안으로
    const keyUp: SidePose = { ...STAND, armN: [80, 30] }
    const turn: SidePose = { ...STAND, lean: 6, armN: [76, 10] }
    const housePose = poseAt(t, [[ARRIVE, (tt) => ({ ...g.pose(tt), armN: [70, 40] })], [ARRIVE + 0.3, keyUp], [UNLOCK, turn], [OPEN, turn], [OPEN + 0.4, STAND], [8.6, STAND], [9.2, (tt) => g.pose(tt)], [9.5, { ...STAND, head: -16 }], [9.9, CHEER], [11.3, CHEER], [11.5, (tt) => g.pose(tt)]])
    const open = ease.out(seg(t, OPEN, OPEN + 0.8))
    const expr = pick<Expr>(t, [[0, 'normal'], [STAMP, 'surprised'], [STAMP + 0.6, 'happy'], [KEY + 0.8, 'love'], [CUT, 'happy'], [OPEN, 'surprised'], [8.6, 'love'], [10.5, 'happy']])
    const top = GROUND - headH(me, inRealty ? 62 : HOUSE_SIZE)
    if (inRealty) {
      return (
        <g>
          <Realty />
          <Actor c={AGENT} x={DESK + 44} pose={agentPose} expr="happy" flip noCane holding={t > KEY - 0.3 && !gotKey ? <Key /> : undefined} />
          {/* 책상 + 계약서 + 도장 자국 */}
          <rect x={DESK - 50} y={GROUND - 40} width="96" height="8" rx="2" fill="#B07A44" stroke={INK} strokeWidth="2" />
          <rect x={DESK - 44} y={GROUND - 32} width="84" height="32" fill="#C98B55" stroke={INK} strokeWidth="2" />
          <g transform={`translate(${DESK - 22} ${GROUND - 41}) skewX(-30)`}>
            <rect x="-14" y="-4" width="30" height="5" fill="#fff" stroke={INK} strokeWidth="1.2" />
          </g>
          <g transform={`translate(${DESK - 6} ${GROUND - 42})`}>
            <rect x="-17" y="-20" width="34" height="22" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" />
            <text textAnchor="middle" y="-10" fontSize="7" fill={INK}>매매 계약서</text>
            <path d="M-12 -5 H8 M-12 -1 H4" stroke="#B8A898" strokeWidth="1.2" />
            {stamped && <circle cx="10" cy="-3" r="4" fill="none" stroke="#E0533F" strokeWidth="1.6" />}
          </g>
          <Actor c={me} x={DESK - 62} pose={realPose} expr={expr} caneLean holding={gotKey ? <Key /> : t < STAMP + 0.8 && t > STAMP - 0.5 ? <g><rect x="-3" y="-2" width="6" height="10" rx="2" fill="#C2452D" stroke={INK} strokeWidth="1.2" /></g> : undefined} />
          <Bang t={t} t0={STAMP} x={DESK + 6} y={GROUND - 96} text="쾅!" size={18} dur={0.8} />
          <Sparkle t={t} t0={KEY + 0.5} x={DESK - 40} y={GROUND - 96} />
          <Bubble t={t} t0={0.2} t1={STAMP - 0.2} at={DESK + 40} tail="right" y={GROUND - headH(AGENT) - 14} text="여기에 도장 찍으세요" size={12} />
          <Bubble t={t} t0={KEY} t1={CUT - 0.4} x={DESK + 18} y={GROUND - headH(AGENT) - 14} text="축하드려요!" tail="right" />
          {fade > 0 && <rect width={W} height={H} fill="#fff" opacity={fade} />}
        </g>
      )
    }
    return (
      <g>
        <HouseFront open={open} lit={t > OPEN + 0.4 ? 1 : 0} banner="축 입주" boxes />
        {t > OPEN && <path d={`M${DOOR.x + DOOR.w / 2} ${DOOR.y + 4} L${DOOR.x - 30} 162 H${DOOR.x + DOOR.w + 30}Z`} fill="#FFE9A0" opacity={0.35 * open} />}
        {!(t > 11.4 && x > DOOR.x + 10) && <Actor c={me} x={x} size={HOUSE_SIZE} pose={housePose} expr={expr} holding={t < 8.6 ? <Key /> : undefined} flip={t > 8.6 && t < 9.4} caneLean={t > ARRIVE && t < 11.4} />}
        {/* 문 안으로 들어가면 문틀에 가려짐 */}
        {t > 11.4 && <rect x={DOOR.x + DOOR.w * 0.2} y={DOOR.y} width={Math.min(DOOR.w * 0.8, Math.max(0, x + 20 - (DOOR.x + DOOR.w * 0.2)))} height={158 - DOOR.y} fill="#FFE9A0" />}
        <Bang t={t} t0={UNLOCK} x={DOOR.x + 40} y={GROUND - 56} text="철컥" size={13} color="#7A4A2A" dur={0.7} />
        {[0, 0.2, 0.35].map((d, i) => <Sparkle key={i} t={t} t0={OPEN + 0.3 + d} x={DOOR.x + [6, 26, 16][i]} y={DOOR.y + [8, 16, 36][i]} s={1.1} />)}
        <Confetti t={t} t0={9.9} dur={3} />
        <Hearts t={t} t0={11.0} x={x + 10} y={top + 4} n={3} />
        <Bubble t={t} t0={CUT + 0.4} t1={ARRIVE} x={Math.max(x + 30, 60)} y={top - 14} text="여기가 우리 집!" />
        <Bubble t={t} t0={9.9} t1={11.4} x={x + 30} y={top - 14} text="드디어 내 집!" />
        {fade > 0 && <rect width={W} height={H} fill="#fff" opacity={fade} />}
      </g>
    )
  },
}
