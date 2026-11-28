// 장면: 결혼 (좋은 일 14초, 어른, 11-28 다시 만듦)
// 꽃 아치·버진로드·하객석이 있는 식장 → 둘이 함께 입장 (하객 박수) → 아치 아래 마주 섬 → 주례 "서로 사랑하겠습니까?" → "네!"
// → 반지 끼워 주기 (반짝) → 꽃잎·색종이, 하객 박수 → 부케 던지기 → 친구가 일어나 잡음 → 다 같이 찰칵
import { Actor, castAt, DEFAULT_FRIENDS, GROUND, H, headH, partnerOf, W, type Cast, type SceneDef } from './Stage'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Notes } from './Fx2'
import { Confetti, Petals } from './Fx3'
import { Bouquet } from './Props3'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, CLAP, gaitOf, SIT, sitLift, STAND } from './poses'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MEX = 198, PX = 222, OX = 236, OFX = 272 // 나 · 배우자(나란히) · 아치 가운데 · 주례
const ARRIVE = 3.8, ASK = 4.4, YES = 5.9, RING = 7.0, KISS = 8.8, THROW = 10.2, SNAP = 12.4
const OFFICIANT: Cast = { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#B8B2A8', top: 'tie', topColor: '#FFFFFF', outer: 'jacket', outerColor: '#3A3A44', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118', acc: 'glasses' }, age: 62 }
const SEATS = [34, 76, 118, 160] // 하객 의자 (뒤쪽 줄)
const GY = GROUND - 12 // 하객 줄 바닥 (조금 뒤)

/** 식장: 샹들리에 · 꽃 아치 · 주례단 · 꽃 기둥 · 버진로드 */
function Hall() {
  const flowers = Array.from({ length: 15 }, (_, i) => { const a = Math.PI * (i / 14); return [OX - Math.cos(a) * 46, 60 - Math.sin(a) * 50] })
  return (
    <g>
      <rect width={W} height={H} fill="#FBF1F3" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 40 + 10} 0 V${GROUND}`} stroke="#F4E1E6" strokeWidth="8" />)}
      <path d={`M0 ${GROUND - 40} H${W}`} stroke="#EED3DA" strokeWidth="2" />
      {/* 벽 몰딩 판 · 위 띠 · 양옆 드레이프 커튼 */}
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 40 + 16} y={GROUND - 34} width="28" height="26" rx="2" fill="none" stroke="#EBCBD4" strokeWidth="1.4" />)}
      <rect width={W} height="6" fill="#F7E3E8" stroke="#E0B8C4" strokeWidth="1" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 20} 6 q10 8 20 0`} fill="#FFFFFF" stroke="#E0B8C4" strokeWidth="1" />)}
      <g transform={`translate(${W} 0) scale(-1 1)`}><path d="M0 6 Q24 8 26 46 Q18 66 12 140 H0Z" fill="#FFFFFF" stroke="#D8B8C2" strokeWidth="1.4" /><path d="M6 12 Q16 40 10 80 M14 20 Q22 50 18 100" stroke="#EAD4DA" strokeWidth="1.1" fill="none" /><path d="M8 62 Q20 58 25 64" stroke="#E8C060" strokeWidth="2.2" fill="none" strokeLinecap="round" /></g>
      {/* 샹들리에 */}
      {[70, 160].map((x) => <g key={x} transform={`translate(${x} 0)`}><path d="M0 0 V10" stroke="#C9A24A" strokeWidth="1.6" /><path d="M-16 14 Q0 26 16 14" fill="none" stroke="#C9A24A" strokeWidth="2" />{[-16, -8, 0, 8, 16].map((d) => <g key={d}><path d={`M${d} ${14 + (8 - Math.abs(d) / 2)} v6`} stroke="#C9A24A" strokeWidth="1.2" /><circle cx={d} cy={22 + (8 - Math.abs(d) / 2)} r="2.4" fill="#FFF3A6" stroke="#C9A24A" strokeWidth="0.8" /><path d={`M${d} ${24.4 + (8 - Math.abs(d) / 2)} l-1.4 3 l1.4 2.4 l1.4 -2.4z`} fill="#E8F4FF" stroke="#9AB0C2" strokeWidth="0.5" /></g>)}<path d="M-12 12 Q0 4 12 12" fill="none" stroke="#C9A24A" strokeWidth="1.2" /><circle cy="9" r="2" fill="#E8C060" stroke="#C9A24A" strokeWidth="0.6" /></g>)}
      {/* 주례단 + 꽃 아치 */}
      <rect x={OX - 40} y={GROUND - 10} width="80" height="10" fill="#F4E6D6" stroke={INK} strokeWidth="1.8" />
      <path d={`M${OX - 46} ${GROUND - 10} V60 A46 50 0 0 1 ${OX + 46} 60 V${GROUND - 10}`} fill="none" stroke="#EFD9C2" strokeWidth="9" />
      <path d={`M${OX - 46} ${GROUND - 10} V60 A46 50 0 0 1 ${OX + 46} 60 V${GROUND - 10}`} fill="none" stroke={INK} strokeWidth="1.6" />
      {flowers.map(([x, y], i) => <g key={i}><ellipse cx={x + 4} cy={y + 4} rx="2.4" ry="5" fill="#7FBF6A" stroke={INK} strokeWidth="0.8" transform={`rotate(${i * 47} ${x + 4} ${y + 4})`} /><ellipse cx={x - 4} cy={y + 3} rx="2" ry="4.4" fill="#6FAF5E" stroke={INK} strokeWidth="0.7" transform={`rotate(${-i * 31} ${x - 4} ${y + 3})`} /><circle cx={x} cy={y} r="6" fill={['#fff', '#F7B8C8', '#F2708A'][i % 3]} stroke={INK} strokeWidth="1.1" />{i % 3 === 1 ? <circle cx={x} cy={y} r="1.8" fill="#F2C230" /> : <path d={`M${x - 2.4} ${y} q2.4 -3.4 4.8 0 q-1.2 3 -3.4 1.8`} stroke="rgba(42,33,24,0.45)" strokeWidth="0.8" fill="none" />}{i % 2 === 0 && <circle cx={x + 5} cy={y - 5} r="1.4" fill="#fff" stroke="rgba(42,33,24,0.4)" strokeWidth="0.5" />}</g>)}
      {[[OX - 46, 100], [OX + 46, 100], [OX - 46, 128], [OX + 46, 128]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? '#F7B8C8' : '#fff'} stroke={INK} strokeWidth="1.1" />)}
      {/* 하객 의자 (등받이 흰 덮개 + 리본) */}
      {SEATS.map((x) => <g key={x} transform={`translate(${x} ${GY})`}><path d="M-12 0 V-26 M10 0 V-24" stroke="#C9B8A8" strokeWidth="2.4" /><rect x="-14" y="-28" width="26" height="6" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" /><rect x="-18" y="-58" width="9" height="34" rx="3" fill="#fff" stroke={INK} strokeWidth="1.6" /><path d="M-18 -40 l-4 -3 v6z" fill="#F2A3B8" stroke={INK} strokeWidth="0.8" /></g>)}
      {/* 버진로드 */}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#EADDD0" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      <path d={`M0 ${GROUND + 3} H${OX - 40} L${OX - 30} ${GROUND + 15} H0Z`} fill="#fff" stroke={INK} strokeWidth="1.4" />
      <path d={`M0 ${GROUND + 5} H${OX - 38} M0 ${GROUND + 13} H${OX - 32}`} stroke="#F2C230" strokeWidth="0.9" />
      {[14, 44, 70, 98, 120, 146, 170].map((x, i) => <ellipse key={x} cx={x} cy={GROUND + 8 + (i % 2) * 3} rx="2" ry="1.2" fill={i % 2 ? '#F7B8C8' : '#F2708A'} transform={`rotate(${i * 50} ${x} ${GROUND + 8 + (i % 2) * 3})`} />)}
      {/* 촛대 (버진로드 옆) */}
      {[98].map((cx) => <g key={cx} transform={`translate(${cx} ${GY})`}><path d="M0 0 V-30 M-6 -30 H6 M-6 -30 V-34 M6 -30 V-34 M0 -30 V-36" stroke="#C9A24A" strokeWidth="1.6" /><rect x="-4" y="-2" width="8" height="2" fill="#C9A24A" />{[-6, 0, 6].map((d) => <g key={d}><rect x={d - 1.2} y={d === 0 ? -42 : -40} width="2.4" height="6" fill="#FFFDF5" stroke={INK} strokeWidth="0.5" /><path d={`M${d} ${d === 0 ? -42 : -40} q-1.4 -2 0 -4 q1.4 2 0 4`} fill="#FFD23F" /></g>)}</g>)}
      {/* 꽃 기둥: 홈 파인 흰 기둥 · 받침 · 꽃병 · 여러 꽃과 잎 · 늘어진 리본 (11-28 사용자: 맨 왼쪽 디테일) */}
      {[16, 186].map((x) => <g key={x} transform={`translate(${x} ${GROUND})`} strokeLinejoin="round">
        <rect x="-8" y="-4" width="16" height="4" rx="1" fill="#F4F0E8" stroke={INK} strokeWidth="1.1" />
        <path d="M-5 -4 L-4 -40 H4 L5 -4Z" fill="#FFFDF7" stroke={INK} strokeWidth="1.3" />
        <path d="M-2 -6 V-38 M1.5 -6 V-38" stroke="#E6DED0" strokeWidth="1" />
        <rect x="-7" y="-44" width="14" height="4" rx="1" fill="#F4F0E8" stroke={INK} strokeWidth="1.1" />
        <path d="M-6 -44 Q-8 -50 -5 -54 H5 Q8 -50 6 -44Z" fill="#DFF3FB" stroke={INK} strokeWidth="1.1" />
        {[[-11, -58, -50], [11, -58, 50], [-6, -68, -20], [7, -68, 25], [0, -72, 0]].map(([lx, ly, r], i) => <ellipse key={i} cx={lx} cy={ly} rx="2.4" ry="5.6" fill={i % 2 ? '#6FAF5E' : '#7FBF6A'} stroke={INK} strokeWidth="0.8" transform={`rotate(${r} ${lx} ${ly})`} />)}
        {[[-7, -58, '#fff', 5], [1, -62, '#F7B8C8', 5.4], [8, -57, '#F2708A', 4.6], [-3, -54, '#F7B8C8', 4], [4, -52, '#fff', 4], [-1, -68, '#fff', 3.6]].map(([fx, fy, c, r], i) => <g key={i}><circle cx={fx as number} cy={fy as number} r={r as number} fill={c as string} stroke={INK} strokeWidth="0.9" /><path d={`M${(fx as number) - 2} ${fy} q2 -3 4 0 q-1 2.6 -3 1.4`} stroke="rgba(42,33,24,0.4)" strokeWidth="0.7" fill="none" /></g>)}
        {[[-10, -64], [10, -64], [-12, -52], [12, -51], [5, -70]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r="1.3" fill="#fff" stroke="rgba(42,33,24,0.45)" strokeWidth="0.5" />)}
        <path d="M-4 -46 q-6 4 -4 14 M4 -46 q6 4 4 14" stroke="#F2A3B8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M-4 -46 q-4 -3 -6 0 q2 3 6 0 q4 -3 6 0 q-2 3 -6 0" fill="#F2A3B8" stroke={INK} strokeWidth="0.7" />
      </g>)}
    </g>
  )
}

/** 반지 */
const Ring = ({ s = 1 }: { s?: number }) => <g transform={`scale(${s})`}><circle r="3.4" fill="none" stroke="#E8B830" strokeWidth="1.8" /><circle cy="-3.6" r="1.6" fill="#DDF3FF" stroke={INK} strokeWidth="0.7" /></g>

export const wedding: SceneDef = {
  id: 'wedding',
  dur: 14,
  still: 7.8,
  draw: (t, cast) => {
    // 결혼식 옷: 신랑은 검은 턱시도, 신부는 흰 드레스 (모자·가방은 벗음)
    const wear = (c: Cast): Cast => ({ ...c, outfit: c.outfit.gender === 'f'
      ? { ...c.outfit, top: 'dress', topColor: '#FFFFFF', outer: 'none', hat: 'none', acc: 'none', shoes: 'loafers', shoesColor: '#F4F0E6' }
      : { ...c.outfit, top: 'tie', topColor: '#FFFFFF', outer: 'jacket', outerColor: '#2A2A34', bottom: 'pants', bottomColor: '#2A2A34', hat: 'none', acc: 'none', shoes: 'loafers', shoesColor: '#1E1A16' } })
    const me = wear(cast[0]), pa = wear(partnerOf(cast[0]))
    const brideMe = me.outfit.gender === 'f' // 부케는 신부가 들고 던짐
    const guests = [castAt(cast, 1), castAt(cast, 2), DEFAULT_FRIENDS[1], DEFAULT_FRIENDS[0]]
    const g = gaitOf(me, 0.75)
    // 둘이 나란히 입장 (배우자는 내 오른쪽 조금 앞) → 아치 아래서 마주 봄
    const walkX = (end: number) => (t < ARRIVE ? end - g.v * (ARRIVE - t) : end)
    const x = walkX(MEX)
    const px = walkX(PX)
    const walk = (tt: number): SidePose => ({ ...g.pose(tt), armN: [50, 40], armF: [40, 50] })
    const paWalk = (tt: number): SidePose => ({ ...g.pose(tt + 0.3), armF: [30, 60] })
    const hold: SidePose = { ...STAND, armN: [50, 40], armF: [40, 50] } // 부케를 두 손으로
    const give: SidePose = { ...STAND, lean: 6, armN: [78, 10], armF: [50, 40] }
    const take: SidePose = { ...STAND, lean: 4, armN: [70, 4], armF: [-4, 10] }
    const throwP: SidePose = { ...STAND, lean: -10, head: -8, armN: [168, 6], armF: [130, 20] }
    const tossKeys: [number, SidePose | ((t: number) => SidePose)][] = [[THROW - 0.6, CHEER], [THROW - 0.3, { ...STAND, lean: 12, armN: [50, 60] }], [THROW, throwP], [THROW + 0.5, throwP], [THROW + 0.9, CHEER]]
    const mePose = poseAt(t, [[ARRIVE, brideMe ? walk : g.pose], [ARRIVE + 0.3, brideMe ? hold : STAND], [RING, brideMe ? hold : STAND], [RING + 0.3, give], [KISS - 0.3, give], [KISS, CHEER], ...(brideMe ? tossKeys : [])])
    const paPose = poseAt(t, [[ARRIVE, brideMe ? paWalk : (tt: number) => ({ ...paWalk(tt), armN: [50, 40], armF: [40, 50] })], [ARRIVE + 0.5, brideMe ? STAND : hold], [RING, brideMe ? STAND : hold], [RING + 0.3, take], [KISS - 0.3, take], [KISS, CHEER], ...(brideMe ? [] : tossKeys)])
    const bx0 = brideMe ? MEX : PX
    const meExpr = pick<Expr>(t, [[0, 'happy'], [ASK, 'normal'], [YES, 'happy'], [RING + 0.5, 'love'], [THROW, 'happy']])
    const paExpr = pick<Expr>(t, [[0, 'happy'], [ASK, 'normal'], [YES + 0.3, 'happy'], [RING + 0.6, 'love'], [THROW, 'happy']])
    const offPose = poseAt(t, [[ASK - 0.2, { ...STAND, armN: [30, 70], armF: [24, 70] }], [ASK, { ...STAND, head: -4, armN: [60, 50], armF: [24, 70] }], [YES - 0.2, { ...STAND, head: -4, armN: [60, 50], armF: [24, 70] }], [YES, { ...STAND, armN: [30, 70], armF: [24, 70] }], [KISS, CLAP]])
    // 부케: 뒤로 높이 날아 → 하객 1(두 번째 자리)이 일어나 잡음
    const bk = seg(t, THROW + 0.1, THROW + 1.3)
    const bx = keys(t, [[THROW + 0.1, bx0 - 6], [THROW + 1.3, SEATS[1] + 8]], ease.inOut), by = GROUND - 112 - Math.sin(bk * Math.PI) * 50 + bk * 30
    const caught = t > THROW + 1.3
    const stood = t > THROW + 0.5
    const guestPose = (i: number): SidePose => {
      if (i === 1 && stood) return caught ? { ...STAND, head: -8, armN: [118, 20], armF: [-4, 10] } : { ...STAND, head: -14, armN: [140, 10], armF: [130, 10] }
      return t < ARRIVE + 0.4 || (t > KISS && t < KISS + 1.6) || t > SNAP ? { ...SIT, ...CLAP(t + i * 0.3), legN: SIT.legN, legF: SIT.legF } : { ...SIT, armN: [30, 50], armF: [24, 50] }
    }
    const top = GROUND - headH(me), ptop = GROUND - headH(pa), otop = GROUND - 10 - headH(OFFICIANT, 54)
    const gs = 50 // 하객 크기
    return (
      <g>
        <Hall />
        {/* 하객 (뒤쪽 줄에 앉아 앞(오른쪽)을 봄) */}
        {guests.map((c, i) => <Actor key={i} c={c} x={SEATS[i] + 2} y={i === 1 && stood ? GY : GY - sitLift(c, 28, gs)} size={gs} pose={guestPose(i)} expr={i === 1 && caught ? 'love' : 'happy'} holding={i === 1 && caught ? <g transform="scale(0.8)"><Bouquet wrap="#FFFFFF" ribbon="#F2C230" /></g> : undefined} noCane />)}
        {/* 주례 (단 위, 왼쪽을 봄) */}
        <Actor c={OFFICIANT} x={OFX} y={GROUND - 10} size={54} pose={offPose} expr="happy" flip noCane holding={t < KISS ? <rect x="-7" y="-12" width="14" height="11" rx="1.5" fill="#2E4A7A" stroke={INK} strokeWidth="1.4" /> : undefined} />
        <Actor c={pa} x={px} pose={paPose} expr={paExpr} flip={t > RING && t < KISS + 0.6} holding={!brideMe && t < THROW + 0.1 ? <g transform="scale(0.8)"><Bouquet wrap="#FFFFFF" ribbon="#F2C230" /></g> : undefined} caneLean />
        <Actor c={me} x={x} pose={mePose} expr={meExpr} holding={brideMe && t < THROW + 0.1 ? <g transform="scale(0.8)"><Bouquet wrap="#FFFFFF" ribbon="#F2C230" /></g> : undefined} caneLean />
        {t > THROW + 0.1 && !caught && <g transform={`translate(${bx} ${by}) rotate(${bk * 540})`}><g transform="scale(0.8)"><Bouquet wrap="#FFFFFF" ribbon="#F2C230" /></g></g>}
        {/* 반지: 내 손에서 배우자 손가락으로 */}
        {t > RING + 0.2 && t < KISS + 0.4 && <g transform={`translate(${keys(t, [[RING + 0.3, x + 10], [RING + 1.1, (x + PX) / 2 + 2]])} ${GROUND - 70})`}><Ring s={1.6} /></g>}
        {[0, 0.15, 0.3].map((d, i) => <Sparkle key={i} t={t} t0={RING + 1.1 + d} x={(x + PX) / 2 + 2 + i * 6} y={GROUND - 80 - i * 6} s={1.2} />)}
        <Notes t={t} t0={0.2} t1={ARRIVE} x={110} y={60} n={3} />
        <Hearts t={t} t0={KISS} x={(x + PX) / 2} y={top} n={4} />
        <Petals t={t} t0={KISS + 0.2} />
        <Confetti t={t} t0={KISS + 0.4} dur={4} />
        <Bubble t={t} t0={ASK} t1={YES - 0.1} at={OFX - 6} tail="right" y={Math.max(otop - 14, 26)} text="서로 사랑하겠습니까?" size={13} />
        <Bubble t={t} t0={YES} t1={RING} at={x - 4} tail="right" y={top - 14} text="네!" />
        <Bubble t={t} t0={YES + 0.3} t1={RING} at={PX + 6} y={ptop - 30} text="네!" />
        <Bubble t={t} t0={KISS + 0.2} t1={THROW - 0.2} x={92} y={GY - 70} text="축하해~!" size={13} />
        <Bubble t={t} t0={THROW + 1.4} t1={SNAP} x={SEATS[1] + 40} y={GY - headH(guests[1], gs) - 14} text="잡았다!" />
        <Bubble t={t} t0={SNAP} t1={13.9} at={x + 4} y={top - 14} text="행복하게 살게요!" tail="right" />
      </g>
    )
  },
}
