// 장면: 축제와 MT (청년, 12초, 11-28). ① 밤 축제 무대 앞에서 친구들과 응원봉 흔들며 "꺄~!" (무대에서 가수가 노래)
// → ② 장면이 바뀌어 MT: 텐트 앞 모닥불에 둘러앉아 마시멜로 굽기 → 기타 치며 다 같이 노래
import { Actor, FrontActor, GROUND, headH, type SceneDef } from './Stage'
import { FestivalStage } from './Backdrops4'
import { LightStick } from './Props4'
import { Bubble, Hearts } from './Fx'
import { Notes } from './Fx2'
import { INK, pick, poseAt, seg } from './kit'
import { STAND } from './poses'
import { pal } from './people'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const CUT = 5.6 // 축제 → MT
const SINGER = { outfit: { ...DEFAULT_OUTFIT, gender: 'f' as const, hair: 'long', hairColor: '#E2B85C', top: 'dress', topColor: '#F3A3C0', shoes: 'boots', shoesColor: '#FFFFFF' }, age: 24 }

/** MT 밤 풍경: 별·산 그림자·텐트 두 동·나무 */
function MtNight({ t }: { t: number }) {
  return (
    <g>
      <defs><linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141838" /><stop offset="1" stopColor="#3A3466" /></linearGradient></defs>
      <rect width="320" height="180" fill="url(#mt-sky)" />
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={(i * 53) % 320} cy={8 + (i * 17) % 60} r={0.8 + (i % 3) * 0.3} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 2 + i)} />)}
      <circle cx="270" cy="30" r="9" fill="#FFF3C0" /><circle cx="266" cy="27" r="8" fill="#141838" opacity="0.5" />
      <path d="M0 110 Q60 70 120 104 Q180 64 240 100 Q290 80 320 96 V130 H0Z" fill="#232A4A" />
      {[[30, 120, 1], [292, 118, 0.9]].map(([px, py, s], i) => <g key={i} transform={`translate(${px} ${py}) scale(${s})`}><path d="M0 0 V-14" stroke="#3A2A20" strokeWidth="4" /><path d="M-16 -10 L0 -46 L16 -10Z M-12 -26 L0 -56 L12 -26Z" fill="#20402E" stroke={INK} strokeWidth="1.2" /></g>)}
      {/* 텐트 두 동 (지퍼 문·줄·말뚝) */}
      {[[86, '#E0833F'], [228, '#5E8FC9']].map(([tx, c]) => <g key={tx as number} transform={`translate(${tx} 128)`}><path d="M-30 0 L0 -40 L30 0Z" fill={c as string} stroke={INK} strokeWidth="1.8" /><path d="M0 -40 L-8 0 H8Z" fill="rgba(0,0,0,0.25)" /><path d="M0 -40 V0" stroke={INK} strokeWidth="1" strokeDasharray="2 1.4" /><path d="M-30 0 L-40 6 M30 0 L40 6 M0 -40 L-24 6" stroke="#D8D2C8" strokeWidth="0.7" /><path d="M-6 0 L-4 -14 L4 -14 L6 0" fill="#FFE27A" opacity="0.5" /></g>)}
      <rect y="128" width="320" height="52" fill="#2E3A2A" />
      <path d="M0 128 H320" stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 모닥불: 장작 + 흔들리는 불꽃 + 불티 + 둥근 불빛 */
function Campfire({ x, y, t }: { x: number; y: number; t: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="-6" rx="70" ry="22" fill="#FFB547" opacity={0.16 + 0.04 * Math.sin(t * 9)} />
      {[[-14, 2, 20], [14, 2, -20], [0, 0, 0]].map(([dx, dy, r], i) => <rect key={i} x={dx - 12} y={dy - 3} width="24" height="6" rx="3" fill="#7A4A2A" stroke={INK} strokeWidth="1.2" transform={`rotate(${r} ${dx} ${dy})`} />)}
      {[-6, 0, 6].map((d, i) => { const h = 18 + 5 * Math.sin(t * 11 + i * 2); return <path key={i} d={`M${d - 7} -2 Q${d - 6} ${-h * 0.6} ${d + Math.sin(t * 8 + i) * 2} ${-h} Q${d + 6} ${-h * 0.6} ${d + 7} -2Z`} fill={['#E0533F', '#FFB547', '#FFE27A'][i]} stroke={i === 0 ? INK : 'none'} strokeWidth="1" /> })}
      {[0, 1, 2, 3].map((i) => { const q = (t * 0.9 + i / 4) % 1; return <circle key={i} cx={Math.sin(i * 3 + t) * 10} cy={-10 - q * 40} r="1" fill="#FFE27A" opacity={1 - q} /> })}
      {[-18, 18].map((sx) => <ellipse key={sx} cx={sx} cy="2" rx="4" ry="2" fill="#8A8F98" stroke={INK} strokeWidth="0.6" />)}
    </g>
  )
}

export const festival: SceneDef = {
  id: 'festival',
  dur: 12,
  still: 3.2,
  draw: (t, cast) => {
    const me = cast[0], a = pal(cast, 1), b = pal(cast, 2)
    if (t < CUT) {
      // ① 축제: 우리는 무대를 보고 뒷모습 (응원봉 흔들기), 가수는 무대 위 작게
      const wave = (i: number) => Math.sin(t * 6 + i)
      const people = [[me, 120], [a, 82], [b, 200]] as const
      const fade = 1 - seg(t, CUT - 0.4, CUT)
      return (
        <g opacity={fade}>
          <FestivalStage t={t} />
          <Actor c={SINGER} x={160 + 10 * Math.sin(t * 1.5)} y={106} size={34} pose={{ ...STAND, head: -6, armN: [120 + 20 * Math.sin(t * 4), 40], armF: [60, 100], legN: [8 * Math.sin(t * 4), 6, 0], legF: [-8 * Math.sin(t * 4), 6, 0] }} expr="happy" flip={Math.sin(t * 0.8) > 0} noCane />
          <Notes t={t} x={180} y={70} n={3} light />
          {people.map(([c, px], i) => (
            <g key={i} transform={`translate(0 ${-Math.abs(wave(i)) * 4})`}>
              <FrontActor c={c} x={px} y={GROUND + 8} size={58} back pose="up" />
              {/* 위로 든 손 끝에 응원봉 */}
              <g transform={`translate(${px + 20} ${GROUND + 8 - 58 * 1.88 + 26}) rotate(${wave(i) * 20})`}><g transform="scale(1.5)"><LightStick c={['#F2708A', '#7FCBE8', '#F2C230'][i]} t={t} /></g></g>
            </g>
          ))}
          <Bubble t={t} t0={1.0} t1={3.6} at={120} y={36} text="꺄~ 최고다!!" />
        </g>
      )
    }
    // ② MT 모닥불
    const k = seg(t, CUT, CUT + 0.4)
    const FLOOR = { legN: [84, 150, 0] as [number, number, number], legF: [80, 146, 0] as [number, number, number] }
    const y = GROUND + 18
    const roast: SidePose = { ...FLOOR, lean: 10, head: 6, armN: [84, 10], armF: [60, 30] }
    const guitar = (tt: number): SidePose => ({ ...FLOOR, lean: 2, head: 6 * Math.sin(tt * 4), armN: [52 + 10 * Math.sin(tt * 12), 70], armF: [70, 40] })
    const sing = (tt: number): SidePose => ({ ...FLOOR, lean: -4 + 4 * Math.sin(tt * 4), head: -10, armN: [40, 60], armF: [30, 60] })
    const mePose = poseAt(t, [[CUT, roast], [CUT + 2.6, roast], [CUT + 3.0, sing]])
    const expr = pick<Expr>(t, [[CUT, 'happy'], [CUT + 2.2, 'love'], [CUT + 3, 'happy']])
    const stick = <g><path d="M0 0 L26 -6" stroke="#8A5A34" strokeWidth="1.6" /><ellipse cx="27" cy="-6.4" rx="3.4" ry="2.6" fill={t > CUT + 2 ? '#E8B27A' : '#FFFFFF'} stroke={INK} strokeWidth="0.8" /></g>
    const top = y - headH(me) + 14
    return (
      <g opacity={k}>
        <MtNight t={t} />
        <Campfire x={160} y={GROUND} t={t} />
        <Actor c={me} x={96} y={y} pose={mePose} expr={expr} holding={t < CUT + 2.9 ? stick : undefined} noCane />
        <Actor c={a} x={216} y={y} flip pose={guitar(t)} expr="happy" noCane holding={<g transform="translate(-6 -2) rotate(-20)"><ellipse cx="0" cy="6" rx="9" ry="11" fill="#C98B55" stroke={INK} strokeWidth="1.2" /><circle cy="6" r="3" fill="#5A3420" /><rect x="-2" y="-22" width="4" height="20" fill="#7A4A2A" stroke={INK} strokeWidth="0.8" /></g>} />
        <Actor c={b} x={272} y={y} flip pose={sing(t + 1)} expr="happy" noCane />
        <Notes t={t} t0={CUT + 0.5} x={216} y={top + 4} n={3} light />
        <Hearts t={t} t0={CUT + 2.3} x={110} y={top + 6} n={2} />
        <Bubble t={t} t0={CUT + 0.6} t1={CUT + 2.6} at={98} y={top - 12} text="마시멜로 다 익었다!" size={12} />
        <Bubble t={t} t0={CUT + 3.2} t1={11.9} at={98} y={top - 12} text="오늘 정말 재밌다~" size={12} />
      </g>
    )
  },
}
