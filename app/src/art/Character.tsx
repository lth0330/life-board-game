// 캐릭터 그림 (SVG): 테두리 선 + 부드러운 곡선 + 그림자, 표정 8가지. 2026-10-17 다시 그림 (docs/12-art.md)
import { useId, type ReactNode } from 'react'
import { accList, type Outfit } from '../engine/outfit'

export type Expr = 'normal' | 'happy' | 'sad' | 'surprised' | 'angry' | 'love' | 'tease' | 'clap'
// pose: 춤 동작 (left·right = 화면 기준 그쪽 팔 위로, up = 두 팔 위로, out = 두 팔 옆으로)
export type Pose = 'idle' | 'left' | 'right' | 'up' | 'out'
interface Props { outfit: Outfit; view?: 'front' | 'back'; size?: number; title?: string; age?: number; expr?: Expr; crop?: 'head'; pose?: Pose }

const INK = '#2A2118'
const SW = 2.2 // 테두리 굵기

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)))
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t)
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`
}

type Extra = 'baby' | 'kinder' | 'student' | null
function aged(o: Outfit, age?: number): { o: Outfit; scale: number; cane: boolean; extra: Extra } {
  if (age === undefined) return { o, scale: 1, cane: false, extra: null }
  const f = o.gender === 'f'
  if (age < 4) return { o: { ...o, hair: 'buzz', hat: f ? 'ribbon' : 'none', hatColor: '#F3A3C0', top: 'tee', topColor: f ? '#F7D3E2' : '#CFE7F5', outer: 'none', bottom: 'shorts', bottomColor: '#FFFFFF', shoes: 'sneakers', shoesColor: '#FFFFFF', acc: 'none', acc2: 'none', acc3: 'none' }, scale: 0.66, cane: false, extra: 'baby' }
  if (age < 8) return { o: { ...o, hat: 'cap', hatColor: '#F2C230', top: 'tee', outer: 'none', bottom: 'shorts', acc: 'none', acc2: 'none', acc3: 'none' }, scale: 0.76, cane: false, extra: 'kinder' }
  if (age < 20) return { o: { ...o, hat: 'none', top: 'shirt', topColor: '#F4EBD6', outer: 'jacket', outerColor: '#1E2A44', bottom: f ? 'skirt' : 'pants', bottomColor: '#2C3A5C', acc: 'none', acc2: 'none', acc3: 'none' }, scale: age < 14 ? 0.8 : 0.9, cane: false, extra: 'student' }
  const hairColor = age >= 60 ? '#A9AEB6' : age >= 45 ? mix(o.hairColor, '#C8C8C8', 0.4) : o.hairColor
  return { o: { ...o, hairColor }, scale: 1, cane: age >= 65, extra: null }
}

// 팔·다리: 굵은 선 두 겹(테두리 + 색)
function Limb({ d, w, fill, cls }: { d: string; w: number; fill: string; cls?: string }) {
  return <g className={cls} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={d} stroke={INK} strokeWidth={w + SW * 2} /><path d={d} stroke={fill} strokeWidth={w} /></g>
}

// 팔: d = 팔 전체, sleeve = 반팔 소매, hand = 손 위치
interface Arm { d: string; sleeve: string; hand: [number, number] }
const ARM_DOWN: [Arm, Arm] = [
  { d: 'M33 78 Q26 96 25 112', sleeve: 'M33 78 Q29.5 86 28.5 91', hand: [25, 114] },
  { d: 'M67 78 Q74 96 75 112', sleeve: 'M67 78 Q70.5 86 71.5 91', hand: [75, 114] },
]
const ARM_UP: [Arm, Arm] = [
  { d: 'M33 78 Q17 62 14 26', sleeve: 'M33 78 Q27 72 24 66', hand: [14, 23] },
  { d: 'M67 78 Q83 62 86 26', sleeve: 'M67 78 Q73 72 76 66', hand: [86, 23] },
]
const ARM_OUT: [Arm, Arm] = [
  { d: 'M33 78 Q22 79 12 79', sleeve: 'M33 78 Q29 78.5 25 79', hand: [10, 79] },
  { d: 'M67 78 Q78 79 88 79', sleeve: 'M67 78 Q71 78.5 75 79', hand: [90, 79] },
]
const armsOf = (pose: Pose): [Arm, Arm] =>
  pose === 'left' ? [ARM_UP[0], ARM_DOWN[1]] : pose === 'right' ? [ARM_DOWN[0], ARM_UP[1]] : pose === 'up' ? ARM_UP : pose === 'out' ? ARM_OUT : ARM_DOWN
const TORSO = 'M33 72 Q50 66 67 72 Q71 94 70 118 Q50 122 30 118 Q29 94 33 72Z'
const TORSO_SHADE = 'M62 72.5 Q69 92 68.5 117 Q64 119 59 119.5 Q64 96 62 72.5Z'
// 길이가 긴 겉옷 (코트 모양)
const LONG_OUTER = ['coat', 'gown', 'raincoat']
const DRESS = 'M33 72 Q50 66 67 72 Q70 92 71 104 L79 148 Q50 156 21 148 L29 104 Q30 92 33 72Z'

export function Character({ outfit, view = 'front', size = 100, title, age, expr = 'normal', crop, pose = 'idle' }: Props) {
  const [aL, aR] = armsOf(pose)
  const uid = useId().replace(/:/g, '')
  const a = aged(outfit, age)
  const { o, cane, extra } = a
  const accs = accList(o)
  const hasAcc = (id: string) => accs.some((x) => x.id === id)
  const accC = (id: string) => accs.find((x) => x.id === id)?.color ?? o.accColor
  const scale = crop ? 1 : a.scale // 얼굴만 그릴 땐 아기도 크게
  const back = view === 'back'
  const dress = o.top === 'dress'
  const longSleeve = ['hoodie', 'shirt', 'tie', 'sport', 'hanbok', 'police'].includes(o.top)
  const bareLegs = o.bottom === 'shorts' || o.bottom === 'skirt' || dress
  const pantsLike = !dress && (o.bottom === 'pants' || o.bottom === 'jeans' || o.bottom === 'track')
  const outerOn = o.outer !== 'none'
  const outerLong = LONG_OUTER.includes(o.outer)
  const vb = crop === 'head' ? '14 2 72 72' : '0 0 100 200'
  // 아이 비율 (2026-10-21 사용자: 어른을 줄인 모습이 아니게): 몸·팔다리는 짧고 통통하게, 머리는 크게
  const kid = !crop && (extra === 'baby' || extra === 'kinder')
  const [bx, by, hs] = extra === 'baby' ? [1.24, 0.5, 1.4] : [1.1, 0.66, 1.22]
  const bodyT = kid ? `translate(50 188) scale(${bx} ${by}) translate(-50 -188)` : undefined
  const headT = kid ? `translate(50 ${188 - 116 * by}) scale(${hs}) translate(-50 -72)` : undefined
  const h = crop === 'head' ? size : size * 2
  const torsoClip = `t${uid}`
  return (
    <svg viewBox={vb} width={size} height={h} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs><clipPath id={torsoClip}><path d={dress ? DRESS : TORSO} /></clipPath><clipPath id={`${torsoClip}L`}><rect x="0" y="0" width="50" height="200" /></clipPath><clipPath id={`${torsoClip}R`}><rect x="50" y="0" width="50" height="200" /></clipPath></defs>
      {!crop && <ellipse cx="50" cy="191" rx={24 * scale} ry="4" fill="rgba(42,33,24,0.16)" />}
      <g transform={`translate(${50 - 50 * scale} ${200 - 200 * scale}) scale(${scale})`} strokeLinejoin="round">
        {/* 뒤로 넘어간 머리 (앞모습일 때 몸 뒤) */}
        <g transform={headT}>{!back && <HairBehind o={o} />}</g>

        <g transform={bodyT}>
        {/* 다리 */}
        {bareLegs && <><Limb cls="leg-l" d="M42 116 L41.5 178" w={9} fill={o.skin} /><Limb cls="leg-r" d="M58 116 L58.5 178" w={9} fill={o.skin} /></>}
        {pantsLike && (
          <>
            <Limb cls="leg-l" d="M42 114 L41 179" w={13} fill={o.bottomColor} />
            <Limb cls="leg-r" d="M58 114 L59 179" w={13} fill={o.bottomColor} />
            <path d="M30 110 h40 v10 q-20 5 -40 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />
            {o.bottom === 'jeans' && <path d="M41.5 122v52M58.5 122v52" stroke={shade(o.bottomColor, 0.45)} strokeWidth="1.3" strokeDasharray="2.5 2.5" />}
            {o.bottom === 'jeans' && <path d="M35 175h13M52 175h13" stroke={shade(o.bottomColor, 0.3)} strokeWidth="3" />}
            {o.bottom === 'track' && <path d="M35.5 120 L35 177M64.5 120 L65 177" stroke="#fff" strokeWidth="2" />}
          </>
        )}
        {!dress && o.bottom === 'shorts' && (
          <>
            <Limb cls="leg-l" d="M42 114 L41.5 134" w={14} fill={o.bottomColor} />
            <Limb cls="leg-r" d="M58 114 L58.5 134" w={14} fill={o.bottomColor} />
            <path d="M30 110 h40 v10 q-20 5 -40 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />
          </>
        )}
        {!dress && o.bottom === 'skirt' && <path d="M31 108 h38 l8 38 q-27 7 -54 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />}
        {!dress && o.bottom === 'skirt' && <path d="M44 112 l-3 36 M56 112 l3 36" stroke={shade(o.bottomColor, -0.18)} strokeWidth="1.5" fill="none" />}
        {!dress && o.bottom === 'longskirt' && <path d="M31 108 h38 l10 66 q-29 7 -58 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />}
        {!dress && o.bottom === 'longskirt' && <path d="M45 112 l-4 62 M55 112 l4 62" stroke={shade(o.bottomColor, -0.18)} strokeWidth="1.5" fill="none" />}

        {/* 신발 */}
        <g className="leg-l" clipPath={`url(#${torsoClip}L)`}><Shoes o={o} /></g>
        <g className="leg-r" clipPath={`url(#${torsoClip}R)`}><Shoes o={o} /></g>

        {/* 코트 자락 (몸 뒤) */}
        {outerOn && outerLong && !back && <path d="M29 100 L25 150 Q50 156 75 150 L71 100Z" fill={o.outerColor} stroke={INK} strokeWidth={SW} />}

        {/* 팔 */}
        <Limb d={aL.d} w={9} fill={longSleeve ? o.topColor : o.skin} />
        <Limb d={aR.d} w={9} fill={longSleeve ? o.topColor : o.skin} />
        {!longSleeve && !dress && <><Limb d={aL.sleeve} w={12} fill={o.topColor} /><Limb d={aR.sleeve} w={12} fill={o.topColor} /></>}
        {dress && <><Limb d={aL.sleeve} w={11} fill={o.topColor} /><Limb d={aR.sleeve} w={11} fill={o.topColor} /></>}
        {longSleeve && pose === 'idle' && <path d="M22 109 l7 1.5 M78 109 l-7 1.5" stroke={shade(o.topColor, -0.25)} strokeWidth="2.5" strokeLinecap="round" />}
        {o.top === 'sport' && pose === 'idle' && <path d="M29 82 Q25 96 24 106 M71 82 Q75 96 76 106" stroke="#fff" strokeWidth="1.8" fill="none" />}
        <g fill={o.skin} stroke={INK} strokeWidth={SW}><circle cx={aL.hand[0]} cy={aL.hand[1]} r="5.5" /><circle cx={aR.hand[0]} cy={aR.hand[1]} r="5.5" /></g>
        {hasAcc('watch') && pose === 'idle' && <rect x="20" y="106.5" width="10" height="4" rx="1.5" fill={accC('watch')} stroke={INK} strokeWidth="1.5" />}

        {/* 상의 */}
        <path d={dress ? DRESS : TORSO} fill={o.topColor} stroke={INK} strokeWidth={SW} />
        <g clipPath={`url(#${torsoClip})`}>
          {o.top === 'stripe' && <g stroke={shade(o.topColor, 0.75)} strokeWidth="4.5"><path d="M20 82h60M20 94h60M20 106h60" /></g>}
          <path d={dress ? 'M60 72 Q70 100 80 150 L66 152 Q62 100 60 72Z' : TORSO_SHADE} fill="rgba(42,33,24,0.13)" />
          <path d="M37 76 Q35 86 36 94" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
        {!back && <TopFront o={o} />}
        {back && o.top === 'hoodie' && <path d="M36 70 Q50 92 64 70 Q50 76 36 70Z" fill={shade(o.topColor, -0.12)} stroke={INK} strokeWidth={SW} />}

        {/* 겉옷 */}
        {outerOn && <Outer o={o} back={back} arms={[aL, aR]} />}
        {/* 겉옷 소매가 손을 덮지 않게 손을 한 번 더 (2026-10-21 사용자) */}
        {outerOn && <g fill={o.skin} stroke={INK} strokeWidth={SW}><circle cx={aL.hand[0]} cy={aL.hand[1]} r="5.5" /><circle cx={aR.hand[0]} cy={aR.hand[1]} r="5.5" /></g>}
        </g>

        <g transform={headT}>
        {/* 목 */}
        <path d="M45 62 v10 q5 3 10 0 v-10z" fill={o.skin} stroke={INK} strokeWidth={SW} />
        <path d="M45 66 q5 4 10 0" fill="none" stroke="rgba(42,33,24,0.18)" strokeWidth="3" />
        {hasAcc('scarf') && <Scarf c={accC('scarf')} back={back} />}

        {/* 얼굴 */}
        <g stroke={INK} strokeWidth={SW} fill={o.skin}>
          <circle cx="23.5" cy="46" r="5" />
          <circle cx="76.5" cy="46" r="5" />
          <ellipse cx="50" cy="42" rx="27" ry="25" />
        </g>
        {!back && <Face o={o} expr={expr} layer="face" />}
        {hasAcc('earrings') && <g fill={accC('earrings')} stroke={INK} strokeWidth="1.2"><circle cx="22.5" cy="53" r="2.4" /><circle cx="77.5" cy="53" r="2.4" /></g>}

        {/* 머리카락 */}
        {back ? <HairBack o={o} /> : <HairFront o={o} />}
        {hasAcc('hairpin') && !back && <Flower x={33} y={27} c={accC('hairpin')} />}

        {/* 액세서리 */}
        {!back && hasAcc('glasses') && <g stroke={INK} strokeWidth="2" fill="rgba(255,255,255,0.25)"><circle cx="40" cy="47" r="7" /><circle cx="60" cy="47" r="7" /><path d="M47 46 q3 -2 6 0" fill="none" /></g>}
        {!back && hasAcc('sunglasses') && <g fill={INK}><path d="M30 42 h17 v5 q0 6 -8 6 q-9 0 -9 -6z" /><path d="M53 42 h17 v5 q0 6 -9 6 q-8 0 -8 -6z" /><rect x="46" y="42" width="8" height="2" /><path d="M33 44.5 h5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" /></g>}
        {!back && hasAcc('mask') && <g><path d="M24 50 Q30 52 37 53 M76 50 Q70 52 63 53" stroke="#ddd" strokeWidth="1.4" fill="none" /><rect x="37" y="50" width="26" height="13" rx="5" fill={accC('mask')} stroke={INK} strokeWidth="1.6" /><path d="M40 55 h20 M40 58.5 h20" stroke={shade(accC('mask'), -0.2)} strokeWidth="1" /></g>}
        </g>
        <g transform={bodyT}>
        {!back && hasAcc('necklace') && <g><path d="M42 72 Q50 82 58 72" stroke="#E2B85C" strokeWidth="2" fill="none" /><circle cx="50" cy="79" r="2.6" fill="#E2B85C" stroke={INK} strokeWidth="1.2" /></g>}
        {hasAcc('bag') && (back
          ? <g><rect x="31" y="74" width="38" height="40" rx="10" fill={accC('bag')} stroke={INK} strokeWidth={SW} /><rect x="37" y="92" width="26" height="14" rx="4" fill={shade(accC('bag'), -0.12)} stroke={INK} strokeWidth="1.5" /></g>
          : <g><path d="M35 72 L68 108" stroke={shade(accC('bag'), -0.3)} strokeWidth="3.5" strokeLinecap="round" /><rect x="62" y="102" width="17" height="15" rx="4" fill={accC('bag')} stroke={INK} strokeWidth={SW} /><path d="M62 108 h17" stroke={INK} strokeWidth="1.3" /></g>)}
        </g>
        <g transform={headT}>
        {hasAcc('headphones') && <g><path d="M24 44 Q24 12 50 12 Q76 12 76 44" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" /><path d="M24 44 Q24 12 50 12 Q76 12 76 44" fill="none" stroke={accC('headphones')} strokeWidth="3.6" strokeLinecap="round" /><g fill={accC('headphones')} stroke={INK} strokeWidth={SW}><rect x="17" y="38" width="10" height="16" rx="4" /><rect x="73" y="38" width="10" height="16" rx="4" /></g></g>}

        {/* 모자 */}
        <Hat o={o} back={back} />
        {!back && <Face o={o} expr={expr} layer="fx" />}
        {extra === 'baby' && !back && <g><circle cx="50" cy="66" r="4.5" fill="#F3A3C0" stroke={INK} strokeWidth="1.5" /><circle cx="50" cy="66" r="1.8" fill="#fff" /></g>}
        </g>

        <g transform={bodyT}>
        {/* 나이별 */}
        {(extra === 'kinder' || extra === 'student') && (back
          ? <g><rect x="31" y="74" width="38" height={extra === 'kinder' ? 34 : 44} rx="10" fill={extra === 'kinder' ? '#F2C230' : outfit.topColor} stroke={INK} strokeWidth={SW} /><rect x="38" y="88" width="24" height="10" rx="3" fill="rgba(255,255,255,0.4)" /></g>
          : <path d="M37 72 v38 M63 72 v38" stroke={extra === 'kinder' ? '#F2C230' : outfit.topColor} strokeWidth="4" strokeLinecap="round" />)}
        {extra === 'student' && !back && <path d="M46 72 l4 12 4 -12z" fill="#C2452D" stroke={INK} strokeWidth="1.5" />}
        {cane && <g fill="none" strokeLinecap="round"><path d="M85 110 v80 M85 110 q0 -8 8 -8" stroke={INK} strokeWidth="7.5" /><path d="M85 110 v80 M85 110 q0 -8 8 -8" stroke="#9A6A3E" strokeWidth="4" /></g>}
        </g>
      </g>
    </svg>
  )
}

// 얼굴. layer='fx'는 반짝이·느낌표·김 같은 효과 (머리카락·모자 위에 그림)
function Face({ o, expr, layer }: { o: Outfit; expr: Expr; layer: 'face' | 'fx' }) {
  const f = o.gender === 'f'
  const brow = shade(o.hairColor, -0.1)
  const RED = '#E5484D', BLUE = '#6FC3EE', MOUTH = '#B3463A'
  const dot = (x: number, rx = 3.3, ry = 4.2) => (
    <g><ellipse cx={x} cy="47" rx={rx} ry={ry} fill={INK} /><circle cx={x + rx * 0.35} cy={47 - ry * 0.4} r={rx * 0.42} fill="#fff" /></g>
  )
  const arc = (x: number) => <path d={`M${x - 4.5} 48.5 q4.5 -6.5 9 0`} stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
  const heart = (x: number, y: number, s: number, c = RED) => <path d={`M${x} ${y + s * 0.9} C${x - s * 1.4} ${y - s * 0.1} ${x - s * 0.7} ${y - s * 1.1} ${x} ${y - s * 0.35} C${x + s * 0.7} ${y - s * 1.1} ${x + s * 1.4} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`} fill={c} stroke={INK} strokeWidth="1.2" />
  const star = (x: number, y: number, r: number) => <path d={`M${x} ${y - r} Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`} fill="#F2C230" stroke={INK} strokeWidth="1" />
  const blush = (c: string, op: number, rx = 5) => <g fill={c} opacity={op}><ellipse cx="32.5" cy="54.5" rx={rx} ry={rx * 0.64} /><ellipse cx="67.5" cy="54.5" rx={rx} ry={rx * 0.64} /></g>
  const B = (d: string, w = 2) => <path d={d} stroke={brow} strokeWidth={w} strokeLinecap="round" fill="none" />
  const smileEyes = <>{arc(40)}{arc(60)}</>
  let face: ReactNode
  let fx: ReactNode = null
  switch (expr) {
    case 'happy':
      face = <>
        {blush('#F07A7A', 0.7, 5.6)}
        {B('M34 36 q5.5 -4 10 -1 M56 35 q4.5 -3 10 1')}
        {smileEyes}
        <path d="M41 54 q9 1 18 0 q-1.5 10 -9 10 q-7.5 0 -9 -10z" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
        <path d="M45 60.5 q5 -3 10 0 q-2 3 -5 3 q-3 0 -5 -3z" fill="#F07A8A" />
        <path d="M42.5 55 h15" stroke="#fff" strokeWidth="2.2" />
      </>
      fx = <>{star(21, 26, 5)}{star(80, 22, 4)}{star(84, 36, 2.6)}</>
      break
    case 'sad':
      face = <>
        {blush('#9DB4D8', 0.45)}
        {B('M34 39 l9.5 -5 M66 39 l-9.5 -5', 2.4)}
        <path d="M36 48 q4 3 8 0 M56 48 q4 3 8 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M37 50 q-3 8 -1 16 q3 -2 3 -8z M63 50 q3 8 1 16 q-3 -2 -3 -8z" fill={BLUE} stroke={INK} strokeWidth="1.1" />
        <path d="M44 61 q2 -3 4 -1 q2 -3 4 -1 q2 -3 4 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
      fx = <path d="M38 19 v7 M44 17.5 v8 M50 17 v8.5 M56 17.5 v8 M62 19 v7" stroke="#7C8FB8" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      break
    case 'surprised':
      face = <>
        {blush('#F09A8A', 0.45)}
        {B('M34 33 q5 -4 10 -1 M56 32 q5 -3 10 1', 2.2)}
        <g fill="#fff" stroke={INK} strokeWidth="2"><circle cx="40" cy="46" r="6" /><circle cx="60" cy="46" r="6" /></g>
        <circle cx="40" cy="46.5" r="2.2" fill={INK} /><circle cx="60" cy="46.5" r="2.2" fill={INK} />
        <ellipse cx="50" cy="59" rx="4.6" ry="5.6" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
      </>
      fx = <>
        <g fill={RED} stroke={INK} strokeWidth="1"><path d="M76 13 l4 13 h-3.6z" /><circle cx="78" cy="30" r="1.9" /><path d="M84 18 l2.6 9 h-2.8z" /><circle cx="85" cy="30.6" r="1.4" /></g>
        <path d="M24 30 q-3 5 0 7 q3 -2 0 -7z" fill={BLUE} stroke={INK} strokeWidth="1" />
      </>
      break
    case 'angry':
      face = <>
        <ellipse cx="50" cy="42" rx="25.5" ry="23.5" fill={RED} opacity="0.2" />
        {blush(RED, 0.6, 5.4)}
        {B('M33 35 l11 5 M67 35 l-11 5', 3)}
        <g fill={INK}><path d="M36 45.5 h8.5 q0 5 -4.2 5 q-4.3 0 -4.3 -5z" /><path d="M55.5 45.5 h8.5 q0 5 -4.3 5 q-4.2 0 -4.2 -5z" /></g>
        <rect x="42" y="55" width="16" height="7" rx="2.5" fill="#fff" stroke={INK} strokeWidth="1.8" />
        <path d="M42 58.5 h16 M46 55 v7 M50 55 v7 M54 55 v7" stroke={INK} strokeWidth="1.1" />
      </>
      fx = <>
        <path d="M69 18 q3.5 3.5 0 7 M69 18 q3.5 3.5 7 0 M76 25 q-3.5 -3.5 0 -7 M76 25 q-3.5 -3.5 -7 0" stroke={RED} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <g fill="#fff" stroke={INK} strokeWidth="1.1"><circle cx="17" cy="34" r="3.6" /><circle cx="14.5" cy="27.5" r="2.6" /><circle cx="83" cy="40" r="3.2" /><circle cx="86" cy="34" r="2.3" /></g>
      </>
      break
    case 'love':
      face = <>
        {blush('#F07A9A', 0.8, 6)}
        {B('M35 37 q5 -3 9 0 M56 37 q5 -3 9 0')}
        {heart(40, 47, 6.2)}{heart(60, 47, 6.2)}
        <path d="M43 55 q7 1 14 0 q-1 7 -7 7 q-6 0 -7 -7z" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
      </>
      fx = <>{heart(78, 20, 4.6)}{heart(20, 24, 3.4, '#F3A3C0')}{heart(85, 33, 2.8, '#F3A3C0')}</>
      break
    case 'tease':
      face = <>
        {blush('#F09A8A', 0.6)}
        {B('M35 36 q5 -4 9 -1 M56 38 q5 -2 9 0')}
        {dot(40, 3.6, 4.6)}
        {f && <path d="M35.8 44 l-2.6 -1.8" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}
        <path d="M56 44 l8 3.5 l-8 3.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M43 55 q7 4 14 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M46 56.5 h8 v4.5 q0 5.5 -4 5.5 q-4 0 -4 -5.5z" fill="#F07A8A" stroke={INK} strokeWidth="1.4" />
        <path d="M50 58 v4.5" stroke="#C9566A" strokeWidth="1.1" />
      </>
      fx = <path d="M76 22 q3 -3 6 0 q3 3 6 0 M78 30 q2.4 -2.4 4.8 0 q2.4 2.4 4.8 0" stroke="#6F45BD" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      break
    case 'clap':
      face = <>
        {blush('#F07A7A', 0.65, 5.4)}
        {B('M34 36 q5.5 -4 10 -1 M56 35 q4.5 -3 10 1')}
        {smileEyes}
        <path d="M42 53 q8 1 16 0 q-1.5 8 -8 8 q-6.5 0 -8 -8z" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
      </>
      fx = <>
        <g fill={o.skin} stroke={INK} strokeWidth={SW}><ellipse cx="43.5" cy="66" rx="6" ry="7.2" transform="rotate(-22 43.5 66)" /><ellipse cx="56.5" cy="66" rx="6" ry="7.2" transform="rotate(22 56.5 66)" /></g>
        <path d="M34 60 l-5 -3 M33 66 h-6 M66 60 l5 -3 M67 66 h6" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        {star(22, 28, 4)}{star(80, 26, 4.6)}
      </>
      break
    default:
      face = <>
        {blush('#F09A8A', 0.55)}
        {B('M35 38 q5 -2.5 9 0 M56 38 q5 -2.5 9 0')}
        {dot(40)}{dot(60)}
        {f && <path d="M35.8 44 l-2.6 -1.8 M64.2 44 l2.6 -1.8" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}
        <path d="M45.5 56 q4.5 4 9 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
  }
  return <g>{layer === 'fx' ? fx : face}</g>
}

// 앞모습: 몸 뒤로 보이는 머리 (긴 머리·포니테일·양갈래·똥머리)
function HairBehind({ o }: { o: Outfit }) {
  const c = o.hairColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  switch (o.hair) {
    case 'long': return <path d="M22 40 Q20 13 50 13 Q80 13 78 40 L81 86 Q66 92 50 90 Q34 92 19 86Z" {...p} />
    case 'bob': return <path d="M21 40 Q20 13 50 13 Q80 13 79 40 L80 64 Q72 68 66 64 L34 64 Q28 68 20 64Z" {...p} />
    case 'pony': return <path d="M68 22 Q92 30 86 70 Q80 58 72 50Z" {...p} />
    case 'bun': return <circle cx="50" cy="12" r="10" {...p} />
    case 'twin': return <g {...p}><path d="M27 34 Q8 46 14 82 Q22 70 30 50Z" /><path d="M73 34 Q92 46 86 82 Q78 70 70 50Z" /></g>
    case 'curly': return <g {...p}><circle cx="26" cy="46" r="8" /><circle cx="74" cy="46" r="8" /><circle cx="28" cy="58" r="7" /><circle cx="72" cy="58" r="7" /></g>
    default: return null
  }
}

// 앞모습: 앞머리
function HairFront({ o }: { o: Outfit }) {
  const c = o.hairColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  const hi = <path d="M36 22 Q44 17 54 18" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
  switch (o.hair) {
    case 'buzz': return <path d="M24 38 Q24 16 50 16 Q76 16 76 38 Q64 28 50 28 Q36 28 24 38Z" fill={c} opacity="0.85" />
    case 'curly': return <g {...p}><circle cx="30" cy="30" r="9" /><circle cx="70" cy="30" r="9" /><circle cx="38" cy="20" r="10" /><circle cx="62" cy="20" r="10" /><circle cx="50" cy="16" r="10" /><circle cx="44" cy="28" r="7" /><circle cx="57" cy="28" r="7" /></g>
    case 'bob': case 'long': return <g><path d="M23 42 Q23 16 50 15 Q77 16 77 42 Q76 33 70 32 H30 Q24 33 23 42Z" {...p} />{hi}</g>
    case 'twoblock': return <g><path d="M24 44 Q22 30 26 24" stroke={shade(c, 0.25)} strokeWidth="4" fill="none" /><path d="M76 44 Q78 30 74 24" stroke={shade(c, 0.25)} strokeWidth="4" fill="none" /><path d="M25 36 Q22 13 52 13 Q80 14 77 34 Q70 24 58 27 Q46 30 36 38 Q30 34 25 36Z" {...p} />{hi}</g>
    default: return <g><path d="M23 44 Q22 16 50 15 Q78 16 77 44 Q74 31 66 30 Q60 36 52 31 Q44 37 36 31 Q28 34 23 44Z" {...p} />{hi}</g>
  }
}

// 뒷모습: 머리 전체
function HairBack({ o }: { o: Outfit }) {
  const c = o.hairColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  if (o.hair === 'buzz') return <ellipse cx="50" cy="38" rx="25" ry="21" fill={c} opacity="0.85" />
  return (
    <g {...p}>
      {o.hair === 'long' && <path d="M22 38 L19 86 Q34 92 50 90 Q66 92 81 86 L78 38Z" />}
      {o.hair === 'bob' && <path d="M21 38 L20 64 Q50 70 80 64 L79 38Z" />}
      {o.hair === 'twin' && <><path d="M27 40 Q8 50 14 84 Q22 72 30 54Z" /><path d="M73 40 Q92 50 86 84 Q78 72 70 54Z" /></>}
      {o.hair === 'curly'
        ? <><circle cx="50" cy="38" r="27" /><circle cx="27" cy="50" r="8" /><circle cx="73" cy="50" r="8" /><circle cx="36" cy="62" r="8" /><circle cx="64" cy="62" r="8" /><circle cx="50" cy="64" r="8" /></>
        : <path d="M23 44 Q21 13 50 13 Q79 13 77 44 Q77 62 50 64 Q23 62 23 44Z" />}
      {o.hair === 'twoblock' && <path d="M27 48 Q50 58 73 48" fill="none" stroke={shade(c, 0.25)} strokeWidth="5" />}
      {o.hair === 'bun' && <circle cx="50" cy="16" r="10" />}
      {o.hair === 'pony' && <><path d="M46 52 Q42 78 50 90 Q58 78 54 52Z" /><rect x="45" y="48" width="10" height="5" rx="2" fill={shade(c, 0.4)} /></>}
      {o.hair === 'twin' && <><circle cx="28" cy="44" r="3" fill="#F3A3C0" /><circle cx="72" cy="44" r="3" fill="#F3A3C0" /></>}
    </g>
  )
}

function TopFront({ o }: { o: Outfit }) {
  const d = shade(o.topColor, -0.22)
  switch (o.top) {
    case 'tee': case 'stripe': return <path d="M43 70 q7 6 14 0" fill="none" stroke={d} strokeWidth="2" />
    case 'hoodie': return <g><path d="M38 70 Q50 84 62 70" fill={shade(o.topColor, -0.12)} stroke={INK} strokeWidth="1.8" /><path d="M46 77 l-1 10 M54 77 l1 10" stroke="#F4EBD6" strokeWidth="1.8" strokeLinecap="round" /><path d="M39 100 h22 l2 12 h-26z" fill={shade(o.topColor, -0.08)} stroke={INK} strokeWidth="1.5" /></g>
    case 'shirt': return <g><path d="M50 74 v42" stroke={d} strokeWidth="1.6" /><g fill={d}><circle cx="50" cy="86" r="1.3" /><circle cx="50" cy="96" r="1.3" /><circle cx="50" cy="106" r="1.3" /></g><path d="M42 69 l8 7 l-6 4z M58 69 l-8 7 l6 4z" fill="#fff" stroke={INK} strokeWidth="1.5" /></g>
    case 'tie': return <g><path d="M42 69 l8 7 l-6 4z M58 69 l-8 7 l6 4z" fill="#fff" stroke={INK} strokeWidth="1.5" /><path d="M48 76 h4 l2 4 l-2 24 l-2 3 l-2 -3 l-2 -24z" fill="#C2452D" stroke={INK} strokeWidth="1.5" /></g>
    case 'sport': return <g><path d="M50 70 v48" stroke={INK} strokeWidth="1.5" /><path d="M47 70 h6 v4 h-6z" fill="#fff" stroke={INK} strokeWidth="1.2" /><path d="M34 80 v34 M66 80 v34" stroke="#fff" strokeWidth="2" /></g>
    case 'hanbok': return <g><path d="M38 70 L58 98 M62 70 L44 94" stroke="#fff" strokeWidth="4" fill="none" /><path d="M38 70 L58 98 M62 70 L44 94" stroke={INK} strokeWidth="1" fill="none" opacity="0.4" /><path d="M54 94 q8 4 4 22 M54 94 q2 8 -4 20" stroke={o.accColor === o.topColor ? '#C2452D' : o.accColor} strokeWidth="3" fill="none" strokeLinecap="round" /></g>
    case 'police': return <g><path d="M42 69 l8 7 l-6 4z M58 69 l-8 7 l6 4z" fill={shade(o.topColor, -0.15)} stroke={INK} strokeWidth="1.5" /><path d="M50 76 v40" stroke={shade(o.topColor, -0.3)} strokeWidth="1.4" /><path d="M36 86 h9 v6 h-9z M55 86 h9 v6 h-9z" fill={shade(o.topColor, -0.12)} stroke={INK} strokeWidth="1.2" /><path d="M59.5 80 l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#E8C060" stroke={INK} strokeWidth="0.8" /></g>
    case 'dress': return <g><path d="M43 70 q7 6 14 0" fill="none" stroke={d} strokeWidth="2" /><path d="M30 102 Q50 106 70 102" stroke={shade(o.topColor, 0.5)} strokeWidth="4" fill="none" /><circle cx="50" cy="104" r="3" fill={shade(o.topColor, 0.5)} stroke={INK} strokeWidth="1.2" /></g>
    default: return null
  }
}

function Outer({ o, back, arms }: { o: Outfit; back: boolean; arms: [Arm, Arm] }) {
  const c = o.outerColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  const sleeves = o.outer !== 'vest'
  const len = LONG_OUTER.includes(o.outer) ? 150 : o.outer === 'padding' ? 120 : 118
  return (
    <g>
      {sleeves && <><Limb d={arms[0].d} w={o.outer === 'padding' ? 13 : 11} fill={c} /><Limb d={arms[1].d} w={o.outer === 'padding' ? 13 : 11} fill={c} /></>}
      {back ? (
        <path d={`M32 71 Q50 64 68 71 Q72 96 ${LONG_OUTER.includes(o.outer) ? '75 150 Q50 156 25 150' : '71 ' + len + ' Q50 ' + (len + 5) + ' 29 ' + len} Q28 96 32 71Z`} {...p} />
      ) : (
        <>
          <path d={`M32 71 Q38 68 44 69 L46 ${len} Q38 ${len + 2} 29 ${len - 1} Q28 96 32 71Z`} {...p} />
          <path d={`M68 71 Q62 68 56 69 L54 ${len} Q62 ${len + 2} 71 ${len - 1} Q72 96 68 71Z`} {...p} />
          {(o.outer === 'jacket' || o.outer === 'coat' || o.outer === 'gown') && <path d="M44 69 L40 84 L46 88 M56 69 L60 84 L54 88" fill="none" stroke={INK} strokeWidth="1.6" />}
          {o.outer === 'cardigan' && <g fill="#F4EBD6" stroke={INK} strokeWidth="1"><circle cx="43" cy="84" r="1.8" /><circle cx="43" cy="96" r="1.8" /><circle cx="43" cy="108" r="1.8" /></g>}
          {o.outer === 'gown' && <g fill="none" stroke={shade(c, -0.25)} strokeWidth="1.5"><path d="M33 104 h8 v7 h-8z" /><path d="M36 102 v-6" stroke="#1B4DDB" strokeWidth="2" /></g>}
          {o.outer === 'raincoat' && <g fill={shade(c, -0.25)}><circle cx="42" cy="92" r="2" /><circle cx="42" cy="108" r="2" /><circle cx="42" cy="124" r="2" /></g>}
          {o.outer === 'coat' && <g fill={shade(c, -0.3)}><circle cx="42" cy="100" r="1.8" /><circle cx="42" cy="116" r="1.8" /><circle cx="58" cy="100" r="1.8" /><circle cx="58" cy="116" r="1.8" /></g>}
        </>
      )}
      {o.outer === 'padding' && <g stroke={shade(c, -0.25)} strokeWidth="1.6" fill="none"><path d="M30 84 h14 M56 84 h14 M30 97 h14 M56 97 h14 M30 110 h14 M56 110 h14" />{back && <path d="M30 84 h40 M30 97 h40 M30 110 h40" />}</g>}
      {o.outer === 'padding' && !back && <path d="M36 66 Q50 74 64 66 v6 Q50 80 36 72z" {...p} />}
      {o.outer === 'raincoat' && (back ? <path d="M34 66 Q50 92 66 66 Q50 74 34 66Z" {...p} /> : <path d="M36 67 Q50 80 64 67 Q50 72 36 67Z" {...p} />)}
      {!back && o.outer !== 'vest' && <path d="M58 76 q6 6 10 22" stroke="rgba(42,33,24,0.15)" strokeWidth="4" fill="none" />}
    </g>
  )
}

function Scarf({ c, back }: { c: string; back: boolean }) {
  return (
    <g fill={c} stroke={INK} strokeWidth={SW}>
      <path d="M36 64 Q50 72 64 64 L65 72 Q50 80 35 72Z" />
      <path d={back ? 'M56 72 l2 22 l7 -2 l-2 -22z' : 'M54 74 l-1 22 l8 1 l1 -23z'} />
      <path d={back ? 'M58 88 h7' : 'M53 92 h8'} stroke={shade(c, -0.25)} strokeWidth="1.5" />
    </g>
  )
}

function Shoes({ o }: { o: Outfit }) {
  const c = o.shoesColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  switch (o.shoes) {
    case 'boots': return <g {...p}><path d="M34 162 h15 v20 q0 6 -6 6 h-12 q-4 0 -4 -4 q0 -4 7 -6z" /><path d="M66 162 h-15 v20 q0 6 6 6 h12 q4 0 4 -4 q0 -4 -7 -6z" /></g>
    case 'sandals': return <g><g {...p}><rect x="30" y="184" width="20" height="5" rx="2.5" /><rect x="50" y="184" width="20" height="5" rx="2.5" /></g><path d="M36 184 q5 -6 10 0 M54 184 q5 -6 10 0" stroke={shade(c, -0.3)} strokeWidth="2.5" fill="none" /></g>
    case 'loafers': return <g><g {...p}><path d="M34 177 h14 q3 0 3 4 v5 q0 3 -3 3 h-18 q-3 0 -3 -3 q0 -6 7 -9z" /><path d="M66 177 h-14 q-3 0 -3 4 v5 q0 3 3 3 h18 q3 0 3 -3 q0 -6 -7 -9z" /></g><path d="M34 181 h10 M56 181 h10" stroke={shade(c, 0.35)} strokeWidth="1.5" /></g>
    default: return <g><g {...p}><path d="M35 176 h13 q3 0 3 4 v6 q0 3 -3 3 h-19 q-3 0 -3 -3 q0 -8 9 -10z" /><path d="M65 176 h-13 q-3 0 -3 4 v6 q0 3 3 3 h19 q3 0 3 -3 q0 -8 -9 -10z" /></g><path d="M27 185 h23 M50 185 h23" stroke="#fff" strokeWidth="2" /></g>
  }
}

function Flower({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <g fill={c} stroke={INK} strokeWidth="1.2">
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 3.6 * Math.cos((a * Math.PI) / 180)} cy={y + 3.6 * Math.sin((a * Math.PI) / 180)} r="2.8" />)}
      <circle cx={x} cy={y} r="2" fill="#F2C230" />
    </g>
  )
}

function Hat({ o, back }: { o: Outfit; back: boolean }) {
  const c = o.hatColor
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  switch (o.hat) {
    case 'cap': return <g>{!back && <path d="M30 31 Q50 27 70 31 Q80 33 84 38 Q60 40 30 36z" fill={shade(c, -0.15)} stroke={INK} strokeWidth={SW} />}<path d="M23 34 Q23 11 50 11 Q77 11 77 34 Q50 29 23 34Z" {...p} /><circle cx="50" cy="12" r="2.4" {...p} /><path d="M36 18 Q42 14 50 14" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>
    case 'beanie': return <g><path d="M24 34 Q24 9 50 9 Q76 9 76 34z" {...p} /><path d="M23 29 h54 v8 q-27 3 -54 0z" fill={shade(c, -0.15)} stroke={INK} strokeWidth={SW} /><path d="M32 29 v8 M40 29 v8.5 M48 29 v9 M56 29 v9 M64 29 v8.5 M72 29 v8" stroke={shade(c, -0.3)} strokeWidth="1.2" /><circle cx="50" cy="8" r="5.5" {...p} /></g>
    case 'bucket': return <g><path d="M30 30 Q32 12 50 12 Q68 12 70 30z" {...p} /><ellipse cx="50" cy="31" rx="33" ry="6" {...p} /><path d="M31 27 h38" stroke={shade(c, -0.25)} strokeWidth="2.5" /></g>
    case 'ribbon': return <g {...p}><path d="M62 22 l14 -9 v18z" /><path d="M62 22 l-12 -8 v17z" /><circle cx="62" cy="22" r="4" /></g>
    case 'chef': return <g><path d="M31 30 v-5 q-9-2-7-10 q2-7 10-5 q2-8 16-8 q14 0 16 8 q8-2 10 5 q2 8-7 10 v5z" {...p} fill="#fff" /><rect x="30" y="26" width="40" height="9" rx="3" {...p} fill="#f2f2f2" /></g>
    case 'santa': return <g><path d="M25 32 Q28 8 54 8 Q72 10 82 30 L74 28 Q64 18 52 20 Q36 22 32 32z" {...p} fill="#D6342B" /><rect x="22" y="27" width="56" height="9" rx="4.5" {...p} fill="#fff" /><circle cx="81" cy="30" r="5.5" {...p} fill="#fff" /></g>
    case 'police': return <g>{!back && <path d="M26 33 Q50 42 74 33 L74 37 Q50 46 26 37z" fill="#1d2433" stroke={INK} strokeWidth={SW} />}<path d="M24 32 Q22 12 50 11 Q78 12 76 32z" {...p} /><rect x="23" y="27" width="54" height="7" rx="3" fill="#1d2433" stroke={INK} strokeWidth="1.6" />{!back && <circle cx="50" cy="20" r="4" fill="#E8C060" stroke={INK} strokeWidth="1.2" />}</g>
    case 'crown': return <g><path d="M30 28 l5 -18 l9 10 l6 -14 l6 14 l9 -10 l5 18z" fill="#E8C060" stroke={INK} strokeWidth={SW} /><g fill="#C2452D" stroke={INK} strokeWidth="1"><circle cx="50" cy="22" r="2.4" /><circle cx="38" cy="23" r="1.8" /><circle cx="62" cy="23" r="1.8" /></g></g>
    default: return null
  }
}
