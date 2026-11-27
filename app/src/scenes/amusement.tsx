// 장면: 아이들과 놀이동산 (좋은 일 13초, 어른, 11-28 내용 더함)
// ① 입구: '데굴랜드' 아치 · 깃발 · 풍선 → 아이 손잡고 들어감 "와아~ 놀이동산!"
// ② 롤러코스터: 덜컹덜컹 올라가 → 쏟아지듯 내려옴 "꺄아~!" 만세
// ③ 광장: 회전목마 · 솜사탕 가게 → 솜사탕과 풍선을 들고 "또 오자!"
import { Actor, castAt, GROUND, H, headH, W, type Cast, type SceneDef } from './Stage'
import { Amusement, railY } from './Backdrops3'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Notes } from './Fx2'
import { INK, pick, poseAt, seg } from './kit'
import { gaitOf, SIT, STAND } from './poses'
import { Bush, Tree } from './Nature'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'
import { DEFAULT_OUTFIT } from '../engine/outfit'

const GATE_END = 2.6, RIDE_END = 7.6
const KID: Cast = { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'pony', topColor: '#F28CB1' }, age: 7 }

/** 깃발 줄 */
const Garland = ({ y, x0 = 0, x1 = W }: { y: number; x0?: number; x1?: number }) => (
  <g>
    <path d={`M${x0} ${y} Q${(x0 + x1) / 2} ${y + 14} ${x1} ${y}`} stroke={INK} strokeWidth="1.2" fill="none" />
    {Array.from({ length: Math.floor((x1 - x0) / 16) }, (_, i) => { const x = x0 + 8 + i * 16, k = (x - x0) / (x1 - x0), yy = y + 14 * 4 * k * (1 - k) * 0.5 * 2; return <path key={i} d={`M${x - 5} ${yy} L${x + 5} ${yy} L${x} ${yy + 9}Z`} fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A', '#C77FD0'][i % 5]} stroke={INK} strokeWidth="0.9" /> })}
  </g>
)
/** 풍선 (줄 끝 = 0,0) */
const Balloon = ({ c, t = 0 }: { c: string; t?: number }) => <g transform={`rotate(${Math.sin(t * 2) * 6})`}><path d="M0 0 Q-3 -14 0 -26" stroke={INK} strokeWidth="1" fill="none" /><ellipse cy="-34" rx="8" ry="10" fill={c} stroke={INK} strokeWidth="1.4" /><path d="M-3 -39 q2 -3 5 -2" stroke="#fff" strokeWidth="1.6" fill="none" /><path d="M-1.5 -24 h3 l-1.5 2z" fill={c} stroke={INK} strokeWidth="0.8" /></g>
/** 솜사탕 */
const Cotton = () => <g><path d="M0 4 V-12" stroke="#E8DCC8" strokeWidth="2" /><g fill="#F7B8D8" stroke={INK} strokeWidth="1.2"><circle cx="-5" cy="-18" r="6" /><circle cx="4" cy="-20" r="7" /><circle cx="0" cy="-26" r="6" /></g></g>

/** 롤러코스터 칸 (두 사람) */
function Coaster({ x, riders }: { x: number; riders: Cast[] }) {
  const y = railY(x)
  const dy = railY(x + 4) - railY(x - 4)
  const ang = (Math.atan2(dy, 8) * 180) / Math.PI
  const down = dy > 1.5 // 내려갈 때 만세
  const pose: SidePose = down ? { ...SIT, armN: [160, 10], armF: [150, 10], head: -10 } : { ...SIT, armN: [70, 30], armF: [60, 30] }
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      {riders.map((c, i) => <Actor key={i} c={c} x={-12 + i * 26} y={2} size={32} pose={pose} expr={down ? 'surprised' : 'happy'} noCane />)}
      <path d="M-26 -14 H30 Q34 -14 34 -8 V0 H-28 Q-30 -8 -26 -14Z" fill="#F2C230" stroke={INK} strokeWidth="2" />
      <path d="M-22 -8 H26" stroke="#E0533F" strokeWidth="2" />
      <circle cx="-16" cy="2" r="4" fill="#3A3434" stroke={INK} strokeWidth="1.4" />
      <circle cx="22" cy="2" r="4" fill="#3A3434" stroke={INK} strokeWidth="1.4" />
    </g>
  )
}

/** 입구: 하늘 · 아치 간판 · 매표소 · 깃발 · 나무 */
function Gate({ t }: { t: number }) {
  return (
    <g>
      <defs><linearGradient id="gt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9ED3F0" /><stop offset="1" stopColor="#E8F5FB" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#gt-sky)" />
      {/* 뒤로 보이는 대관람차 · 성 지붕 */}
      <g transform="translate(270 70)" opacity="0.85"><circle r="40" fill="none" stroke="#C77FD0" strokeWidth="2.6" />{Array.from({ length: 8 }, (_, i) => { const a = t * 0.4 + (i * Math.PI) / 4; return <g key={i}><path d={`M0 0 L${Math.cos(a) * 40} ${Math.sin(a) * 40}`} stroke="#C77FD0" strokeWidth="1.2" /><rect x={Math.cos(a) * 40 - 5} y={Math.sin(a) * 40} width="10" height="8" rx="2.5" fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A'][i % 4]} stroke={INK} strokeWidth="1.1" /></g> })}</g>
      <g transform="translate(40 112)"><rect x="-14" y="-40" width="28" height="40" fill="#F4E3F4" stroke={INK} strokeWidth="1.6" /><path d="M-18 -40 L0 -66 L18 -40Z" fill="#C77FD0" stroke={INK} strokeWidth="1.6" /><path d="M0 -66 V-74 l8 3 l-8 3" fill="#E0533F" stroke={INK} strokeWidth="1" /></g>
      <Tree x={18} y={124} s={0.7} />
      <rect y="122" width={W} height={H - 122} fill="#E9DDCB" />
      <path d={`M0 122 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 아치 문 */}
      <g transform="translate(160 0)">
        <rect x="-96" y="44" width="16" height="114" fill="#F2C230" stroke={INK} strokeWidth="2" />
        <rect x="80" y="44" width="16" height="114" fill="#F2C230" stroke={INK} strokeWidth="2" />
        {[-88, 88].map((x) => <g key={x}><circle cx={x} cy="40" r="9" fill="#E0533F" stroke={INK} strokeWidth="1.8" /><path d={`M${x} 31 V22 l8 3 l-8 3`} fill="#5E8FC9" stroke={INK} strokeWidth="1" /></g>)}
        <path d="M-90 58 Q0 6 90 58 L90 72 Q0 22 -90 72Z" fill="#E0533F" stroke={INK} strokeWidth="2" />
        <text textAnchor="middle" y="46" fontSize="15" fill="#FFF3A6" stroke={INK} strokeWidth="0.6" paintOrder="stroke">데굴랜드</text>
        {Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.12 + i * 0.095); return <circle key={i} cx={-Math.cos(a) * 88} cy={66 - Math.sin(a) * 40} r="2" fill={Math.sin(t * 8 + i) > 0 ? '#FFF3A6' : '#fff'} stroke={INK} strokeWidth="0.6" /> })}
      </g>
      <Garland y={88} x0={0} x1={64} />
      <Garland y={88} x0={256} x1={320} />
      {/* 풍선 장수 */}
      <g transform="translate(290 150)">{['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A'].map((c, i) => <g key={i} transform={`translate(${(i - 1.5) * 7} ${-i % 2 * 6})`}><Balloon c={c} t={t + i} /></g>)}</g>
      <Bush x={246} y={124} s={0.6} flowers="#F7A3B8" />
    </g>
  )
}

/** 광장: 회전목마 · 솜사탕 가게 · 깃발 · 나무 */
function Plaza({ t }: { t: number }) {
  return (
    <g>
      <defs><linearGradient id="pz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD6A8" /><stop offset="1" stopColor="#FFF0D8" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#pz-sky)" />
      {/* 회전목마 */}
      <g transform="translate(226 0)">
        <path d="M-70 52 L0 20 L70 52Z" fill="#E0533F" stroke={INK} strokeWidth="2" />
        {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${-70 + i * 20} 52 q10 8 20 0`} fill={i % 2 ? '#fff' : '#F2C230'} stroke={INK} strokeWidth="1.4" />)}
        <path d="M0 20 V10" stroke={INK} strokeWidth="2" /><circle cy="8" r="4" fill="#F2C230" stroke={INK} strokeWidth="1.4" />
        <rect x="-66" y="58" width="132" height="6" fill="#C77FD0" stroke={INK} strokeWidth="1.4" />
        {[-48, -16, 16, 48].map((x0, i) => { const x = ((x0 + t * 30 + 64) % 128) - 64, b = Math.sin(t * 4 + i) * 4; return <g key={i}><path d={`M${x} 64 V${112 + b}`} stroke="#E8C060" strokeWidth="2" /><g transform={`translate(${x} ${116 + b})`}><path d="M-10 0 Q-8 -8 4 -8 L10 -14 L12 -8 Q12 2 6 4 H-8Z" fill={['#fff', '#F7B8C8', '#BFE4F7', '#FFE27A'][i]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" /></g></g> })}
        <rect x="-70" y="132" width="140" height="10" rx="2" fill="#C77FD0" stroke={INK} strokeWidth="1.6" />
      </g>
      {/* 솜사탕 가게 */}
      <g transform="translate(46 158)">
        <rect x="-36" y="-44" width="72" height="44" fill="#FFF6EA" stroke={INK} strokeWidth="2" />
        <path d="M-42 -44 H42 L36 -62 H-36Z" fill="#F7A3B8" stroke={INK} strokeWidth="1.8" />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-42 + i * 14} -44 q7 8 14 0`} fill={i % 2 ? '#fff' : '#F2708A'} stroke={INK} strokeWidth="1.2" />)}
        <text y="-24" textAnchor="middle" fontSize="10" fill="#C2452D">솜사탕</text>
        {[-20, 0, 20].map((x) => <g key={x} transform={`translate(${x} -2) scale(0.7)`}><Cotton /></g>)}
      </g>
      <Garland y={6} x0={0} x1={150} />
      <rect y={GROUND} width={W} height={H - GROUND} fill="#E9DDCB" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 44} ${GROUND} L${i * 44 - 12} ${H}`} stroke="rgba(42,33,24,0.12)" strokeWidth="1.6" />)}
    </g>
  )
}

export const amusement: SceneDef = {
  id: 'amusement',
  dur: 13,
  still: 4.8,
  draw: (t, cast) => {
    const me = cast[0], fr = castAt(cast, 1)
    const kidRider = (me.age ?? 30) < 13 ? fr : KID // 어른이면 아이를 옆자리에
    const g = gaitOf(me), gk = gaitOf(kidRider)
    const white = (a: number) => 1 - Math.abs(seg(t, a - 0.3, a + 0.3) * 2 - 1) // 장면 바뀔 때 하얗게
    const top = GROUND - headH(me)
    const handUp = (p: SidePose): SidePose => ({ ...p, armF: [40, 10] })
    if (t < GATE_END) {
      // ① 입구: 둘이 손잡고 걸어 들어감
      const x = 90 + t * g.v * 0.7
      return (
        <g>
          <Gate t={t} />
          <Actor c={kidRider} x={x + 26} pose={handUp(gk.pose(t + 0.3))} expr="happy" holding={undefined} noCane />
          <Actor c={me} x={x} pose={{ ...g.pose(t), armN: [30, 10] }} expr="happy" caneLean />
          <Bubble t={t} t0={0.3} t1={GATE_END} at={x + 30} y={GROUND - headH(kidRider) - 14} text="와아~ 놀이동산!" size={13} />
          <rect width={W} height={H} fill="#fff" opacity={white(GATE_END)} />
        </g>
      )
    }
    if (t < RIDE_END) {
      // ② 롤러코스터: 천천히 올라갔다가(덜컹덜컹) 빠르게 내려옴
      const k = seg(t, GATE_END + 0.1, RIDE_END)
      const cx = -60 + 440 * (k + 0.08 * Math.sin(k * Math.PI * 3))
      return (
        <g>
          <Amusement t={t} />
          <Coaster x={cx} riders={[fr]} />
          <Coaster x={cx - 66} riders={[me, kidRider]} />
          {t < 4.0 && Math.sin(t * 14) > 0 && <text x={Math.min(280, Math.max(40, cx - 50))} y={railY(cx) + 30} fontSize="9" fill={INK}>덜컹덜컹</text>}
          <Bubble t={t} t0={4.4} t1={5.8} x={Math.min(260, Math.max(60, cx - 66))} y={34} text="꺄아~!" size={15} />
          <Bubble t={t} t0={6.0} t1={7.2} x={Math.min(260, Math.max(60, cx - 66))} y={34} text="한 번 더!" size={15} />
          <rect width={W} height={H} fill="#fff" opacity={white(GATE_END) + white(RIDE_END)} />
        </g>
      )
    }
    // ③ 광장: 솜사탕 · 풍선 들고 걷다가 멈춰 "또 오자!"
    const walk = seg(t, RIDE_END, RIDE_END + 2.2)
    const x = 70 + walk * 50
    const moving = walk < 1
    const happy = (tt: number): SidePose => ({ ...STAND, armN: [64, 100], head: -4 + 3 * Math.sin(tt * 5), bob: -Math.abs(Math.sin(tt * 5)) * 2 })
    const pose = (who: number) => poseAt(t, [[RIDE_END, (tt: number) => (who ? gk : g).pose(tt)], [RIDE_END + 2.2, (tt: number) => (who ? gk : g).pose(tt)], [RIDE_END + 2.5, who ? { ...STAND, armN: [80, 40] } : happy]])
    const expr = pick<Expr>(t, [[0, 'happy'], [RIDE_END + 2.5, 'love'], [11.6, 'happy']])
    return (
      <g>
        <Plaza t={t} />
        <Actor c={kidRider} x={x + 30} pose={pose(1)} expr={expr} holding={<g transform="scale(2.6)"><Balloon c="#E0533F" t={t} /></g>} noCane />
        <Actor c={me} x={x} pose={pose(0)} expr={expr} holding={<g transform="scale(1.3)"><Cotton /></g>} caneLean={!moving} />
        <Notes t={t} t0={RIDE_END + 0.4} t1={RIDE_END + 2.4} x={226} y={70} n={3} />
        <Hearts t={t} t0={10.6} x={x + 14} y={top + 4} n={3} />
        <Sparkle t={t} t0={11.2} x={x + 60} y={top} />
        <Bubble t={t} t0={RIDE_END + 0.5} t1={RIDE_END + 2.2} at={x + 36} y={GROUND - headH(kidRider) - 14} text="솜사탕 맛있다!" size={13} />
        <Bubble t={t} t0={RIDE_END + 2.6} t1={12.8} at={x + 8} y={top - 14} text="또 오자!" />
        <rect width={W} height={H} fill="#fff" opacity={white(RIDE_END)} />
      </g>
    )
  },
}
