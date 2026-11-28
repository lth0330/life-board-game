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
import { Tree } from './Nature'
import { BalloonCart, CandyPillar, Carousel, Castle, CottonStand, FerrisWheel, Lamp, LampGarland, Pavers, Planter, TicketBooth } from './Amuse'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'
import { DEFAULT_OUTFIT } from '../engine/outfit'

const GATE_END = 2.6, RIDE_END = 7.6
const KID: Cast = { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'pony', topColor: '#F28CB1' }, age: 7 }

/** 풍선 (줄 끝 = 0,0) */
const Balloon = ({ c, t = 0 }: { c: string; t?: number }) => <g transform={`rotate(${Math.sin(t * 2) * 6})`}><path d="M0 0 Q-3 -14 0 -26" stroke={INK} strokeWidth="1" fill="none" /><ellipse cy="-34" rx="8" ry="10" fill={c} stroke={INK} strokeWidth="1.4" /><path d="M-3 -39 q2 -3 5 -2" stroke="#fff" strokeWidth="1.6" fill="none" /><path d="M-1.5 -24 h3 l-1.5 2z" fill={c} stroke={INK} strokeWidth="0.8" /></g>
/** 솜사탕 */
const Cotton = () => <g><path d="M0 4 V-12" stroke="#E8DCC8" strokeWidth="2" /><g fill="#F7B8D8" stroke={INK} strokeWidth="1.2"><circle cx="-5" cy="-18" r="6" /><circle cx="4" cy="-20" r="7" /><circle cx="0" cy="-26" r="6" /></g></g>

/** 롤러코스터 칸 (두 사람): 앞코 · 좌석 등받이 · 안전바 · 레일 위 바퀴 */
function Coaster({ x, riders, lead }: { x: number; riders: Cast[]; lead?: boolean }) {
  const y = railY(x)
  const dy = railY(x + 4) - railY(x - 4)
  const ang = (Math.atan2(dy, 8) * 180) / Math.PI
  const down = dy > 1.5 // 내려갈 때 만세
  const pose: SidePose = down ? { ...SIT, armN: [160, 10], armF: [150, 10], head: -10 } : { ...SIT, armN: [70, 30], armF: [60, 30] }
  return (
    <g transform={`translate(${x} ${y - 4}) rotate(${ang})`} strokeLinejoin="round">
      {/* 등받이 (사람 뒤) */}
      {[-20, 6].map((sx) => <path key={sx} d={`M${sx - 4} -10 V-22 Q${sx - 4} -26 ${sx} -26 Q${sx + 3} -26 ${sx + 3} -22 V-10Z`} fill="#E0533F" stroke={INK} strokeWidth="1.4" />)}
      {riders.map((c, i) => <Actor key={i} c={c} x={-12 + i * 26} y={0} size={32} pose={pose} expr={down ? 'surprised' : 'happy'} noCane />)}
      {/* 몸통 + 앞코 */}
      <path d={`M-28 -14 H26 Q${lead ? 40 : 32} -14 ${lead ? 42 : 34} -4 V0 H-28 Q-31 -8 -28 -14Z`} fill="#F2C230" stroke={INK} strokeWidth="2" />
      <path d="M-24 -8 H30" stroke="#E0533F" strokeWidth="2.4" /><path d="M-24 -11 H28" stroke="#FFF3A6" strokeWidth="1" />
      {lead && <circle cx="36" cy="-7" r="2.4" fill="#FFF3A6" stroke={INK} strokeWidth="0.9" />}
      {/* 안전바 */}
      {[-6, 20].map((bx) => <path key={bx} d={`M${bx - 8} -14 Q${bx - 2} -22 ${bx + 2} -14`} stroke="#5A5658" strokeWidth="1.8" fill="none" />)}
      {/* 바퀴 (레일 위·아래) */}
      {[-18, 22].map((wx) => <g key={wx}><rect x={wx - 5} y="-1" width="10" height="5" rx="1" fill="#8A8F98" stroke={INK} strokeWidth="1" /><circle cx={wx} cy="1" r="3.2" fill="#3A3434" stroke={INK} strokeWidth="1.1" /><circle cx={wx} cy="7.4" r="2" fill="#3A3434" stroke={INK} strokeWidth="0.9" /></g>)}
    </g>
  )
}

/** 입구: 하늘 · 멀리 성·대관람차 · 산울타리 · 매표소 · 줄무늬 기둥 아치 · 화단 · 풍선 수레 · 보도블록 */
function Gate({ t }: { t: number }) {
  return (
    <g>
      <defs><linearGradient id="gt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9ED3F0" /><stop offset="1" stopColor="#E8F5FB" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#gt-sky)" />
      <path d="M118 22 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H118Z M196 34 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H196Z" fill="#fff" stroke="#D8E6EE" strokeWidth="1" />
      <FerrisWheel x={282} y={66} r={38} gy={122} t={t} />
      <Castle x={150} gy={122} s={0.8} />
      <Tree x={20} y={122} s={0.72} /><Tree x={108} y={122} s={0.55} c="#8CC77A" flip />
      {/* 산울타리 */}
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={i * 15 + 4} cy="111" r="8" fill="#6FAF5E" stroke={INK} strokeWidth="1.4" />)}
      <rect y="110" width={W} height="12" fill="#6FAF5E" />
      {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${i * 15} 108 q3 -3 6 0`} stroke="#4E8A3A" strokeWidth="1" fill="none" />)}
      <path d={`M0 122 H${W}`} stroke={INK} strokeWidth="2" />
      <Pavers y0={122} />
      <TicketBooth x={32} gy={150} s={1.3} /> {/* 11-28 사용자: 조금 크게 */}
      {/* 아치 문: 줄무늬 기둥 + 꼭대기 공·깃발 + 전구 달린 간판 */}
      <CandyPillar x={72} top={50} gy={150} id="gt-p1" />
      <CandyPillar x={248} top={50} gy={150} c="#5E8FC9" id="gt-p2" />
      <g transform="translate(160 0)">
        {[-88, 88].map((x) => <g key={x}><circle cx={x} cy="38" r="9" fill="#F2C230" stroke={INK} strokeWidth="1.8" /><circle cx={x - 3} cy="35" r="2.4" fill="#fff" opacity="0.7" /><path d={`M${x} 29 V18`} stroke={INK} strokeWidth="1.4" /><path d={`M${x} 18 l10 3.5 l-10 3.5Z`} fill="#E0533F" stroke={INK} strokeWidth="1" /></g>)}
        <path d="M-90 58 Q0 6 90 58 L90 72 Q0 22 -90 72Z" fill="#E0533F" stroke={INK} strokeWidth="2" />
        <path d="M-88 61 Q0 11 88 61" stroke="#F58A75" strokeWidth="1.4" fill="none" />
        <text textAnchor="middle" y="46" fontSize="15" fill="#FFF3A6" stroke={INK} strokeWidth="0.6" paintOrder="stroke">데굴랜드</text>
        {Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.1 + i * 0.08); return <circle key={i} cx={-Math.cos(a) * 88} cy={68 - Math.sin(a) * 41} r="2" fill={Math.sin(t * 8 + i) > 0 ? '#FFF3A6' : '#fff'} stroke={INK} strokeWidth="0.6" /> })}
      </g>
      <LampGarland x0={0} y0={70} x1={64} y1={58} sag={6} />
      <LampGarland x0={256} y0={58} x1={320} y1={72} sag={6} />
      <Planter x={100} gy={150} /><Planter x={220} gy={150} />
      <BalloonCart x={292} gy={156} t={t} />
    </g>
  )
}

/** 광장: 멀리 대관람차 · 나무 · 솜사탕 가게 · 가로등과 꽃줄 · 회전목마 · 보도블록 */
function Plaza({ t }: { t: number }) {
  return (
    <g>
      <defs><linearGradient id="pz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD6A8" /><stop offset="1" stopColor="#FFF0D8" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#pz-sky)" />
      <path d="M100 20 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H100Z" fill="#fff" opacity="0.9" />
      <FerrisWheel x={128} y={58} r={30} gy={124} t={t} color="#E08AA0" />
      <Tree x={100} y={126} s={0.6} c="#8CC77A" /><Tree x={160} y={126} s={0.5} flip />
      <rect y="124" width={W} height={GROUND - 124} fill="#9CCB86" />
      <path d={`M0 124 H${W}`} stroke={INK} strokeWidth="1.6" />
      <CottonStand x={46} gy={GROUND} t={t} />
      <Lamp x={124} y={GROUND} on />
      <LampGarland x0={128} y0={GROUND - 70} x1={170} y1={GROUND - 100} sag={4} />
      <Carousel x={240} gy={GROUND} t={t} />
      <Pavers y0={GROUND} />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
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
          <Coaster x={cx} riders={[fr]} lead />
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
