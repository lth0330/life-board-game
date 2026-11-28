// 장면: 아기 탄생 (좋은 일 12.5초, 어른, 11-28 다시 만듦)
// 병실: 엄마가 병원 침대(등받이 세움·링거·심장 모니터)에서 갓 태어난 아기를 안고 있음 → 아빠가 꽃다발 들고 문으로 헐레벌떡
// → "여보!" → 꽃다발은 침대 끝(이불 위)에 내려놓고 → 아기를 보고 "우리 아기…!" → 엄마가 건네줌 → 아빠가 조심조심 안음 → 아기가 방긋 → "고생했어" 하트
import { Actor, GROUND, H, headH, partnerOf, W, type Cast, type SceneDef } from './Stage'
import { Bubble, Hearts, Sparkle, Sweat } from './Fx'
import { Notes } from './Fx2'
import { Zzz } from './Fx3'
import { Baby, Bouquet } from './Props3'
import { SideTable } from './Props2'
import { INK, keys, pick, poseAt } from './kit'
import { run, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BX0 = 46, BX1 = 196 // 침대 머리 · 발
const MT = GROUND - 38 // 매트리스 윗면
const HIPX = 92 // 엄마 엉덩이 자리

/** 병실: 창문 · 링거대 · 심장 모니터 · 꽃병 · 병원 침대(등받이 세움, 난간, 바퀴) */
function Room({ t }: { t: number }) {
  const beat = (x: number) => { const p = (x + t * 30) % 40; return p < 6 ? -p * 2 : p < 10 ? -12 + (p - 6) * 5 : p < 13 ? 8 - (p - 10) * 2.6 : 0 }
  let ecg = 'M0 0'
  for (let x = 0; x <= 40; x += 1) ecg += ` L${x} ${beat(x)}`
  return (
    <g>
      <rect width={W} height={H} fill="#EAF4F8" />
      <rect y="96" width={W} height={GROUND - 96} fill="#DCEBF2" />
      <path d={`M0 96 H${W}`} stroke="#B8D0DC" strokeWidth="2" />      <path d={`M0 96 H${W}`} stroke="#B8D0DC" strokeWidth="2" />
      {/* 천장 조명 · 침대 머리 쪽 의료 판(산소·콘센트·간호사 호출) · 벽시계 · 손 소독제 */}
      <rect width={W} height="5" fill="#F7FBFC" /><path d={`M0 5 H${W}`} stroke="rgba(42,33,24,0.3)" strokeWidth="1" />
      {[100, 230].map((x) => <rect key={x} x={x - 22} y="0" width="44" height="4" fill="#FFFDF0" stroke={INK} strokeWidth="0.8" />)}
      <g transform="translate(70 70)">
        <rect width="70" height="12" rx="2" fill="#F4F8FA" stroke={INK} strokeWidth="1.3" />
        <circle cx="10" cy="6" r="2.6" fill="#7FBF6A" stroke={INK} strokeWidth="0.8" /><circle cx="19" cy="6" r="2.6" fill="#E8EEF2" stroke={INK} strokeWidth="0.8" />
        <rect x="27" y="3" width="8" height="6" rx="1" fill="#fff" stroke={INK} strokeWidth="0.7" /><circle cx="29.6" cy="6" r="0.6" fill={INK} /><circle cx="32.4" cy="6" r="0.6" fill={INK} />
        <rect x="40" y="2.6" width="10" height="7" rx="1.5" fill="#E0533F" stroke={INK} strokeWidth="0.8" /><circle cx="45" cy="6" r="1.6" fill="#fff" />
        <rect x="54" y="3.6" width="12" height="4.8" rx="2" fill="#FFF3A6" stroke={INK} strokeWidth="0.7" />
      </g>
      <g transform="translate(160 32)"><circle r="9" fill="#FFFDF5" stroke={INK} strokeWidth="1.8" />{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 -7 V-5.8" stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.1} transform={`rotate(${i * 30})`} />)}<path d="M0 0 V-5 M0 0 L3.4 1.4" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /></g>
      <g transform="translate(282 104)"><rect x="-4" y="-14" width="8" height="14" rx="2" fill="#E8EEF2" stroke={INK} strokeWidth="1" /><path d="M-1 -14 V-18 H4" stroke={INK} strokeWidth="1.2" fill="none" /><rect x="-3" y="-8" width="6" height="4" fill="#7FCBE8" /></g>
      {/* 창문 */}
      <g transform="translate(200 20)">
        <rect width="70" height="56" rx="4" fill="#BFE4F7" stroke={INK} strokeWidth="2.2" />
        <path d="M8 22 q4 -6 10 -3 q4 -5 10 0 q5 0 4 4 H8Z" fill="#fff" />
        <path d="M35 0 V56 M0 28 H70" stroke="#fff" strokeWidth="3" /><path d="M35 0 V56 M0 28 H70" stroke={INK} strokeWidth="1" opacity="0.4" />
        <rect x="-4" y="-6" width="78" height="8" rx="2" fill="#F2F7FA" stroke={INK} strokeWidth="1.6" />
        {/* 블라인드 반쯤 · 창턱 · 커튼 */}
        <rect x="1" y="1" width="68" height="12" fill="#F4F8FA" />
        {[3, 6, 9, 12].map((ly) => <path key={ly} d={`M1 ${ly} H69`} stroke="#B8C8D4" strokeWidth="0.8" />)}
        <path d="M58 13 V30" stroke="#9AA4AE" strokeWidth="0.8" />
        <rect x="-3" y="55" width="76" height="4" rx="1.5" fill="#F2F7FA" stroke={INK} strokeWidth="1.2" />
        <path d="M-8 -4 Q-4 20 -8 60 H-14 Q-12 20 -14 -4Z M78 -4 Q74 20 78 60 H84 Q82 20 84 -4Z" fill="#A9D4E8" stroke={INK} strokeWidth="1.3" />
        <path d="M-11 4 V54 M81 4 V54" stroke="#8ABFD8" strokeWidth="0.9" />
      </g>
      {/* 심장 모니터 (벽) */}
      <g transform="translate(14 30)">
        <rect width="52" height="34" rx="4" fill="#2A3440" stroke={INK} strokeWidth="2" />
        <g transform="translate(6 20)"><path d={ecg} stroke="#7FE08A" strokeWidth="1.6" fill="none" /></g>
        <text x="46" y="11" textAnchor="end" fontSize="7" fill="#7FE08A">♥ 72</text>
      </g>
      {/* 링거대 */}
      <g transform="translate(34 0)">
        <path d={`M0 52 V${GROUND} M-10 ${GROUND} H10`} stroke="#9AA4AE" strokeWidth="2.6" />
        <path d="M-8 52 H8" stroke="#9AA4AE" strokeWidth="2.2" />
        <path d="M-6 54 h12 v18 q0 4 -6 4 q-6 0 -6 -4Z" fill="#E6F4FB" stroke={INK} strokeWidth="1.4" />
        <path d="M0 76 Q4 100 30 104" stroke="#9AA4AE" strokeWidth="1" fill="none" />
      </g>
      {/* 꽃병 (창턱 아래 작은 탁자) */}
      <g transform="translate(286 128)">
        <SideTable x={0} y={30} w={28} color="#E9E2D6" />
        <path d="M-5 0 L-6 -12 H6 L5 0Z" fill="#9ED3F0" stroke={INK} strokeWidth="1.4" />
        {[[-6, -20, '#F7B8C8'], [0, -24, '#FFE27A'], [6, -20, '#F2708A']].map(([x, y, c], i) => <g key={i}><path d={`M0 -12 L${x} ${(y as number) + 3}`} stroke="#5E9A50" strokeWidth="1.2" /><circle cx={x as number} cy={y as number} r="3.6" fill={c as string} stroke={INK} strokeWidth="1" /></g>)}
      </g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D2DEE5" />
      {/* 바닥 타일 */}
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${i * 32} ${GROUND} L${i * 32 - 8} ${H}`} stroke="rgba(42,33,24,0.12)" strokeWidth="1.2" />)}
      <path d={`M0 ${GROUND + 10} H${W}`} stroke="rgba(42,33,24,0.1)" strokeWidth="1.2" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 병원 침대 (등받이를 세움). front = 난간 (사람 앞에 그림) */
function Bed({ front }: { front?: boolean }) {
  if (front) return (
    <g>
      {/* 침대 옆으로 늘어진 시트 (다리·치마를 가림) */}
      <path d={`M${HIPX - 18} ${MT - 2} H${BX1 - 6} V${MT + 12} H${HIPX - 18}Z`} fill="#FFFFFF" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d={`M${HIPX + 30} ${MT - 10} H${BX1 - 14} M${HIPX + 30} ${MT - 10} V${MT + 2} M${BX1 - 14} ${MT - 10} V${MT + 2} M${HIPX + 62} ${MT - 10} V${MT + 2}`} stroke="#9AA4AE" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
  return (
    <g>
      {/* 바퀴 · 다리 · 틀 */}
      {[BX0 + 10, BX1 - 10].map((x) => <g key={x}><path d={`M${x} ${MT + 14} V${GROUND - 6}`} stroke="#9AA4AE" strokeWidth="3.4" /><circle cx={x} cy={GROUND - 4} r="4" fill="#3A3434" stroke={INK} strokeWidth="1.4" /></g>)}
      <rect x={BX0} y={MT + 8} width={BX1 - BX0} height="8" rx="2" fill="#C9D3DA" stroke={INK} strokeWidth="1.8" />
      {/* 발판 */}
      <rect x={BX1 - 4} y={MT - 18} width="9" height="36" rx="3" fill="#E6EEF3" stroke={INK} strokeWidth="1.8" />
      {/* 매트리스 (머리 쪽이 비스듬히 올라감) */}
      <path d={`M${BX0} ${MT + 8} L${BX0 + 4} ${MT - 50} L${BX0 + 18} ${MT - 50} L${HIPX - 6} ${MT} H${BX1 - 4} V${MT + 8}Z`} fill="#FFFFFF" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {/* 베개 */}
      <path d={`M${BX0 + 6} ${MT - 54} L${BX0 + 22} ${MT - 52} L${BX0 + 34} ${MT - 26} L${BX0 + 18} ${MT - 28}Z`} fill="#DDEFF8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  )
}

const RUSH = 1.6, ARR = 3.6, PUT = 4.3, LOOK = 4.9, HAND = 6.4, HOLD = 7.2, SMILE2 = 8.4

export const baby: SceneDef = {
  id: 'baby',
  dur: 12.5,
  still: SMILE2 + 0.6,
  draw: (t, cast) => {
    // 병실이라 모자·가방은 벗음
    const plain = (c: Cast): Cast => ({ ...c, outfit: { ...c.outfit, hat: 'none', acc: 'none' } })
    const me = plain(cast[0]), pa = plain(partnerOf(cast[0]))
    const meMom = me.outfit.gender === 'f'
    const mom = meMom ? me : pa, dad = meMom ? pa : me
    const lie: SidePose = { lean: -34, head: 4, armN: [20, 40], armF: [14, 40], legN: [86, 0, 0], legF: [84, 0, 0] }
    const momHold = (tt: number): SidePose => ({ ...lie, head: 22, armN: [40, 74], armF: [34, 80], bob: Math.sin(tt * 2.4) })
    const momGive: SidePose = { ...lie, lean: -20, head: 10, armN: [74, 24], armF: [64, 30] }
    const momPose = poseAt(t, [[0, momHold], [HAND - 0.5, momHold], [HAND, momGive], [HOLD, momGive], [HOLD + 0.4, { ...lie, head: 8, armN: [30, 60], armF: [24, 60] }]])
    // 아빠: 문(오른쪽)에서 달려옴 → 침대 옆 → 꽃은 탁자에 → 아기 받음 → 흔들흔들
    const DADX = 206
    const dadX = t < RUSH ? 360 : keys(t, [[RUSH, 360], [ARR, DADX]], (x) => x)
    const runP = (tt: number): SidePose => ({ ...run(tt), armN: [60, 60] })
    const cradle = (tt: number): SidePose => ({ ...STAND, lean: 6, head: 16, armN: [48, 92], armF: [40, 96], bob: Math.sin(tt * 3) * 1.5 })
    const dadPose = poseAt(t, [[RUSH, runP], [ARR - 0.1, runP], [ARR + 0.3, { ...STAND, lean: 18, head: 4, armN: [50, 40], armF: [40, 40] }], [PUT - 0.1, { ...STAND, lean: 34, head: 14, armN: [58, 6], armF: [36, 30] }], [PUT + 0.2, { ...STAND, lean: 34, head: 14, armN: [58, 6], armF: [36, 30] }], [LOOK, { ...STAND, lean: 18, head: 8, armN: [40, 50] }], [LOOK + 0.6, { ...STAND, lean: 22, head: 14, armN: [30, 90], armF: [26, 90] }], [HAND - 0.2, { ...STAND, lean: 22, head: 14, armN: [30, 90], armF: [26, 90] }], [HAND + 0.2, { ...STAND, lean: 24, head: 12, armN: [70, 30], armF: [62, 30] }], [HOLD, { ...STAND, lean: 24, head: 12, armN: [70, 30], armF: [62, 30] }], [HOLD + 0.5, cradle]])
    const baby = t < HOLD ? 'mom' : 'dad'
    const crying = t > HOLD && t < SMILE2
    const momExpr = pick<Expr>(t, [[0, 'love'], [RUSH + 0.6, 'happy'], [HAND, 'love']])
    const dadExpr = pick<Expr>(t, [[0, 'surprised'], [LOOK, 'love'], [HOLD, 'surprised'], [SMILE2, 'love']])
    const momY = MT + 2
    const dadTop = GROUND - headH(dad)
    const momTop = momY - headH(mom) * 0.78
    const flowersOnTable = t > PUT
    const babyX = baby === 'mom' ? HIPX + 30 : DADX - 26
    const babyY = baby === 'mom' ? momY - 44 : GROUND - 76
    // 말하는 사람: 내가 엄마면 엄마 말, 아빠면 아빠 말이 주인공 대사
    return (
      <g>
        <Room t={t} />
        {/* 병실 문 (오른쪽, 아빠가 들어옴) */}
        <g transform="translate(300 0)"><rect x="-14" y={GROUND - 92} width="34" height="92" fill="#E6EEF3" stroke={INK} strokeWidth="2" /><rect x="-8" y={GROUND - 84} width="12" height="18" rx="2" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" /><circle cx="-8" cy={GROUND - 46} r="2" fill="#9AA4AE" stroke={INK} strokeWidth="1" /></g>
        <Bed />
        <Actor c={mom} x={HIPX} y={momY} pose={momPose} expr={momExpr} holding={baby === 'mom' ? <Baby t={t} cry={false} /> : undefined} noCane />
        {/* 이불 (다리 덮음) */}
        <path d={`M${HIPX - 4} ${MT + 2} Q${HIPX - 2} ${MT - 16} ${HIPX + 16} ${MT - 16} H${BX1 - 14} Q${BX1 - 4} ${MT - 14} ${BX1 - 4} ${MT + 6}Z`} fill="#F7D3E2" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${HIPX + 30} ${MT - 12} q10 4 20 0 M${HIPX + 70} ${MT - 12} q10 4 20 0`} stroke="#E8A8C0" strokeWidth="1.6" fill="none" />
        <Bed front />
        {/* 침대 끝 이불 위에 눕혀 둔 꽃다발 */}
        {flowersOnTable && <g transform={`translate(${BX1 - 30} ${MT - 15}) rotate(-80)`}><Bouquet /></g>}
        <Actor c={dad} x={dadX} pose={dadPose} expr={dadExpr} flip holding={baby === 'dad' ? <Baby t={t} cry={crying} /> : !flowersOnTable && t > RUSH ? <g transform="scale(1.1)"><Bouquet /></g> : undefined} caneLean={t > ARR} />
        {t < 2.0 && <Zzz t={t} t0={0} x={HIPX + 40} y={momY - 56} />}
        <Sweat t={t} t0={ARR - 0.2} x={dadX - 22} y={dadTop + 16} />
        <Sweat t={t} t0={HOLD + 0.2} x={dadX - 22} y={dadTop + 18} />
        <Notes t={t} t0={SMILE2 + 0.2} t1={11.5} x={babyX} y={babyY - 10} n={2} />
        <Sparkle t={t} t0={SMILE2} x={babyX - 8} y={babyY - 4} />
        <Hearts t={t} t0={SMILE2 + 0.3} x={babyX} y={babyY - 18} n={3} />
        <Hearts t={t} t0={10.2} x={HIPX + 60} y={momTop - 4} n={4} />
        <Bubble t={t} t0={0.3} t1={RUSH} at={HIPX + 22} y={momTop - 18} text="쌔근쌔근…" size={12} />
        <Bubble t={t} t0={RUSH + 0.5} t1={ARR + 0.4} at={Math.min(dadX - 6, 300)} tail="right" y={dadTop - 14} text="여보!" />
        <Bubble t={t} t0={LOOK + 0.2} t1={HAND - 0.3} at={DADX - 6} tail="right" y={dadTop - 14} text="우리 아기…!" />
        <Bubble t={t} t0={HAND - 0.2} t1={HOLD + 0.2} at={HIPX + 22} y={momTop - 18} text="안아 봐요" />
        <Bubble t={t} t0={HOLD + 0.3} t1={SMILE2} x={DADX - 70} y={GROUND - 110} text="응애~" size={12} />
        <Bubble t={t} t0={SMILE2 + 0.4} t1={10.2} at={DADX - 6} tail="right" y={dadTop - 14} text="웃었다!" />
        <Bubble t={t} t0={10.3} t1={12.4} at={DADX - 6} tail="right" y={dadTop - 14} text="고생했어, 여보" />
      </g>
    )
  },
}
