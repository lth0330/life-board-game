// 장면: 졸업 (좋은 일 11.5초, 11-28 다시 만듦). 학생(고등학교)·어른(대학)
// 단상 위 졸업생 셋이 정면을 봄 · 단상 아래 가족이 뒷모습으로 카메라를 듦 → "여기 보세요~" → "하나, 둘, 셋!"
// → 어른: 학사모를 하늘로 던짐 (찰칵) → 받아서 다시 씀 / 학생: 꽃다발 번쩍 → "졸업이다!" → 브이 찰칵 → 색종이
import { castAt, FrontActor, GROUND, H, isKid, W, type Cast, type SceneDef } from './Stage'
import { Bubble, Hearts } from './Fx'
import { Confetti, Flash } from './Fx3'
import { Bouquet, Diploma, GradCap } from './Props3'
import { INK, ease, keys, pick, seg } from './kit'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { Expr, Pose } from '../art/Character'

const LOOK = 1.0, COUNT = 2.6, THROW = 3.8, SNAP1 = 4.8, CATCH = 6.0, SNAP2 = 8.6
const PARENT: Cast = { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'bob', hairColor: '#5A4030', top: 'shirt', topColor: '#F4C7A1', outer: 'cardigan', outerColor: '#C97F7F', bottomColor: '#5A5A6A', shoes: 'loafers', shoesColor: '#8A5A34' }, age: 52 }
const STAGE_Y = GROUND - 26 // 단상 윗면
const SZ = 48 // 졸업생 크기 (정면)

/** 강당: 벽 · 커튼 · '졸업식' 현수막 · 꽃 장식 · 단상 */
function Hall() {
  return (
    <g>
      <rect width={W} height={H} fill="#F4ECDD" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 40 + 12} 0 V${STAGE_Y}`} stroke="#EADFC9" strokeWidth="6" />)}
      <path d="M0 0 Q34 50 6 120 L0 120Z M320 0 Q286 50 314 120 L320 120Z" fill="#B03A3A" stroke={INK} strokeWidth="2" />
      <path d="M0 0 H320 V10 Q300 16 280 10 Q260 16 240 10 Q220 16 200 10 Q180 16 160 10 Q140 16 120 10 Q100 16 80 10 Q60 16 40 10 Q20 16 0 10Z" fill="#C2452D" stroke={INK} strokeWidth="1.8" />
      <g transform="translate(160 18)">
        <rect x="-52" y="0" width="104" height="24" rx="4" fill="#2A4A8A" stroke={INK} strokeWidth="2" />
        <text textAnchor="middle" y="17" fontSize="14" fill="#FFE27A">졸업식</text>
      </g>
      {/* 꽃 장식 기둥 */}
      {[44, 276].map((x) => <g key={x} transform={`translate(${x} ${STAGE_Y})`}><path d="M-6 0 L-4 -22 H4 L6 0Z" fill="#E9D3A8" stroke={INK} strokeWidth="1.6" />{[[-7, -28], [0, -33], [7, -28], [0, -25]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r="5" fill={['#F2708A', '#FFE27A', '#F7A3B8', '#fff'][i]} stroke={INK} strokeWidth="1" />)}</g>)}
      {/* 단상 */}
      <rect x="20" y={STAGE_Y} width="280" height="8" fill="#C98B55" stroke={INK} strokeWidth="2" />
      <rect x="24" y={STAGE_Y + 8} width="272" height={GROUND - STAGE_Y - 8} fill="#A8784A" stroke={INK} strokeWidth="2" />
      {[80, 160, 240].map((x) => <path key={x} d={`M${x} ${STAGE_Y + 8} V${GROUND}`} stroke="#8A5A34" strokeWidth="1.4" />)}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#8A6A4A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 카메라 (뒤에서 본 모습) */
const Camera = ({ x, y }: { x: number; y: number }) => <g transform={`translate(${x} ${y})`}><rect x="-12" y="-8" width="24" height="15" rx="2.5" fill="#3A3434" stroke={INK} strokeWidth="1.6" /><rect x="-9" y="-12" width="7" height="4" rx="1" fill="#3A3434" stroke={INK} strokeWidth="1.2" /><rect x="4" y="-5" width="6" height="5" rx="1" fill="#BFE4F7" /></g>

export const grad: SceneDef = {
  id: 'grad',
  dur: 11.5,
  still: SNAP1 + 0.1,
  draw: (t, cast, text) => {
    const uni = !/고등학교/.test(text) && !isKid(cast[0]) && (cast[0].age ?? 30) >= 18
    const capOn = (i: number) => uni && (t < THROW + i * 0.08 || t > CATCH + 0.3 + i * 0.1)
    const dress = (c: Cast, i: number): Cast => (uni ? { ...c, outfit: { ...c.outfit, outer: 'gown', outerColor: '#2A2A44', hat: capOn(i) ? 'grad' : 'none', acc: 'none' } } : { ...c, outfit: { ...c.outfit, hat: 'none' } })
    const xs = [160, 108, 212] // 나는 가운데
    const people = [cast[0], castAt(cast, 1), castAt(cast, 2)].map((c, i) => dress(c, i))
    const pose = (i: number): Pose => (t > THROW - 0.1 && t < CATCH ? 'up' : t > SNAP2 - 0.6 ? (i === 2 ? 'left' : 'right') : 'idle')
    const jump = (i: number) => (t > THROW && t < THROW + 0.8 ? -Math.sin(seg(t, THROW + i * 0.05, THROW + 0.6 + i * 0.05) * Math.PI) * 10 : 0)
    const expr = (i: number) => pick<Expr>(t, [[0, 'happy'], [THROW, i === 0 ? 'love' : 'happy'], [CATCH, 'happy'], [SNAP2, i === 0 ? 'love' : 'happy']])
    const height = SZ * 1.88
    // 날아가는 학사모 (어른만)
    const cap = (i: number) => {
      const k = seg(t, THROW + i * 0.08, CATCH + i * 0.1)
      return { x: xs[i] + (i - 1) * 14 * Math.sin(k * Math.PI), y: Math.max(48, STAGE_Y - height + 6 - Math.sin(k * Math.PI) * 60), r: k * 720 }
    }
    // 가족 (단상 아래, 뒷모습): 카메라를 들고 찍음
    const py = keys(t, [[0, H + 70], [LOOK, H + 46]], ease.out)
    const camUp = t > LOOK
    const headTop = STAGE_Y - height
    return (
      <g>
        <Hall />
        {people.map((c, i) => (
          <g key={i} transform={`translate(0 ${jump(i)})`}>
            <FrontActor c={c} x={xs[i]} y={STAGE_Y} size={SZ} expr={expr(i)} pose={pose(i)} />
            {pose(i) === 'idle' && <g transform={`translate(${xs[i] + SZ * 0.3} ${STAGE_Y - height * 0.42})`}>{uni ? <g transform="scale(1.2)"><Diploma /></g> : <g transform="scale(1.4)"><Bouquet /></g>}</g>}
          </g>
        ))}
        {uni && people.map((_, i) => { const p = cap(i); return !capOn(i) && <GradCap key={i} x={p.x} y={p.y} rot={p.r} /> })}
        {!uni && pose(0) === 'up' && people.map((_, i) => <g key={i} transform={`translate(${xs[i] + SZ * 0.34} ${STAGE_Y - height - 4 + jump(i)}) scale(1.5)`}><Bouquet /></g>)}
        {/* 사진 찍는 가족: 뒷모습 */}
        <FrontActor c={PARENT} x={262} y={py} size={66} pose={camUp ? 'up' : 'idle'} back />
        {camUp && <Camera x={262} y={py - 66 * 1.88 + 2} />}
        <Flash t={t} t0={SNAP1} />
        <Flash t={t} t0={SNAP2} />
        <clipPath id="gr-clip"><rect y="44" width="320" height="136" /></clipPath>
        <g clipPath="url(#gr-clip)"><Confetti t={t} t0={SNAP2 + 0.2} dur={2.4} /></g>
        <Hearts t={t} t0={9.4} x={xs[0]} y={headTop + 10} n={3} />
        <Bubble t={t} t0={LOOK + 0.2} t1={COUNT} at={276} tail="left" y={112} text="여기 보세요~" size={13} />
        <Bubble t={t} t0={COUNT} t1={THROW} at={276} tail="left" y={112} text="하나, 둘, 셋!" size={13} />
        <Bubble t={t} t0={SNAP1} t1={SNAP1 + 0.8} at={276} tail="left" y={112} text="찰칵!" />
        <Bubble t={t} t0={CATCH + 0.6} t1={SNAP2 - 0.5} at={xs[0] + 6} y={Math.max(headTop - 10, 56)} text="졸업이다!" />
        <Bubble t={t} t0={SNAP2} t1={SNAP2 + 1.0} at={276} tail="left" y={112} text="찰칵!" />
      </g>
    )
  },
}
