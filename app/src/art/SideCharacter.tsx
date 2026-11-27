// 옆모습 캐릭터 (사건 장면용, 2026-11-27 docs/16-scenes.md)
// 판 위 앞모습 캐릭터(Character.tsx)와 같은 옷·머리·피부·나이 모습을 오른쪽을 보는 옆모습으로.
// 팔(위팔·아래팔)·다리(허벅지·종아리)에 관절이 있어 자세(SidePose)를 각도로 줌.
// 각도(도): 어깨·엉덩이 = 앞으로(+) / 뒤로(-) 흔듦, 팔꿈치 = 앞으로 굽힘(+), 무릎 = 뒤로 굽힘(+), lean = 상체를 앞으로 숙임(+)
import { useId, type ReactNode } from 'react'
import { accList, type Outfit } from '../engine/outfit'
import { aged, shade, type Expr } from './Character'

const INK = '#2A2118'
const SW = 2.2

export interface SidePose {
  lean?: number // 상체 숙이기 (엉덩이 기준)
  head?: number // 고개 (+ = 숙임)
  armN?: [number, number] // 가까운 팔 [어깨, 팔꿈치]
  armF?: [number, number] // 먼 팔
  legN?: [number, number] | [number, number, number] // 가까운 다리 [엉덩이, 무릎, 발목(+ = 발끝 내림)]
  legF?: [number, number] | [number, number, number]
  bob?: number // 몸 전체 위아래 (+ = 아래로)
}
export const IDLE: Required<SidePose> = { lean: 0, head: 0, armN: [4, 8], armF: [-4, 8], legN: [0, 0], legF: [0, 0], bob: 0 }

// noCane: 먹기·울기처럼 지팡이가 어색한 장면에서는 노인이어도 지팡이를 안 그림
interface Props { outfit: Outfit; age?: number; pose?: SidePose; expr?: Expr; size?: number; flip?: boolean; holding?: ReactNode; noCane?: boolean; noShadow?: boolean; caneLean?: boolean }

// 굵은 선 두 겹 (테두리 + 색)
function Seg({ d, w, c }: { d: string; w: number; c: string }) {
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={d} stroke={INK} strokeWidth={w + SW * 2} /><path d={d} stroke={c} strokeWidth={w} /></g>
}

const SHOULDER: [number, number] = [50, 79]
const HIP: [number, number] = [50, 113]
const UPPER = 19, FORE = 17, THIGH = 35, SHIN = 33, CANE = 64
// 팔을 위로 들수록 조금 길게 (머리가 큰 비율이라 그대로면 만세가 머리 높이까지밖에 안 감)
const reach = (sh: number) => 1 + 0.55 * Math.min(1, Math.max(0, (sh - 60) / 100))
const LONG_OUTER = ['coat', 'gown', 'raincoat']

export function SideCharacter({ outfit, age, pose = {}, expr = 'normal', size = 100, flip, holding, noCane, noShadow, caneLean }: Props) {
  const uid = useId().replace(/:/g, '')
  const P = { ...IDLE, ...pose }
  // 다리를 굽히면 발이 땅에서 뜨므로, 더 낮은 발이 땅에 닿게 몸을 내림
  const footY = ([h, k]: readonly number[]) => THIGH * Math.cos((h * Math.PI) / 180) + SHIN * Math.cos(((k - h) * Math.PI) / 180)
  P.bob += THIGH + SHIN - Math.max(footY(P.legN), footY(P.legF))
  const a = aged(outfit, age)
  const { o, cane, extra } = a
  const accs = accList(o)
  const hasAcc = (id: string) => accs.some((x) => x.id === id)
  const accC = (id: string) => accs.find((x) => x.id === id)?.color ?? o.accColor
  const dress = o.top === 'dress'
  const longSleeve = ['hoodie', 'shirt', 'tie', 'sport', 'hanbok', 'police'].includes(o.top)
  const pantsLike = !dress && ['pants', 'jeans', 'track'].includes(o.bottom)
  const shorts = !dress && o.bottom === 'shorts'
  const outerOn = o.outer !== 'none'
  const outerLong = LONG_OUTER.includes(o.outer)
  const outerSleeve = outerOn && o.outer !== 'vest'
  const kid = extra === 'baby' || extra === 'kinder'
  const [bx, by, hs] = extra === 'baby' ? [1.24, 0.5, 1.4] : [1.1, 0.66, 1.22]
  const bodyT = kid ? `translate(50 188) scale(${bx} ${by}) translate(-50 -188)` : ''
  const neckY = kid ? 188 - 116 * by : 72
  const headT = kid ? `translate(50 ${neckY}) scale(${hs}) translate(-50 -72)` : ''

  // 다리 하나 (먼 다리는 조금 어둡게)
  const leg = (hip: number, knee: number, far: boolean, ankle = 0) => {
    const dk = (c: string) => (far ? shade(c, -0.14) : c)
    const legC = pantsLike ? dk(o.bottomColor) : dk(o.skin)
    const w = pantsLike ? 13 : 9
    return (
      <g transform={`translate(${HIP[0]} ${HIP[1]}) rotate(${-hip})`}>
        <Seg d={`M0 0 L0 ${THIGH}`} w={w} c={legC} />
        {shorts && <Seg d="M0 0 L0 17" w={14} c={dk(o.bottomColor)} />}
        {o.bottom === 'jeans' && !far && <path d={`M2 4 V${THIGH - 2}`} stroke={shade(o.bottomColor, 0.45)} strokeWidth="1.2" strokeDasharray="2.5 2.5" />}
        {o.bottom === 'track' && <path d={`M-4 2 V${THIGH}`} stroke="#fff" strokeWidth="1.8" />}
        <g transform={`translate(0 ${THIGH}) rotate(${knee})`}>
          <Seg d={`M0 0 L0 ${SHIN}`} w={w} c={legC} />
          {o.bottom === 'jeans' && !far && <path d={`M-6 ${SHIN - 6} h12`} stroke={shade(o.bottomColor, 0.3)} strokeWidth="3" />}
          {o.bottom === 'track' && <path d={`M-4 0 V${SHIN - 2}`} stroke="#fff" strokeWidth="1.8" />}
          {/* 무릎 굽힐 때 생기는 틈을 메움 */}
          <circle r={w / 2 + 0.3} fill={legC} />
          <g transform={`translate(0 ${SHIN}) rotate(${-knee + hip + ankle})`}><Shoe o={o} dk={dk} /></g>
        </g>
      </g>
    )
  }
  // 팔 하나
  const arm = (sh: number, el: number, far: boolean, hold?: ReactNode) => {
    const dk = (c: string) => (far ? shade(c, -0.14) : c)
    const sleeveC = outerSleeve ? o.outerColor : o.topColor
    const upperC = outerSleeve || longSleeve ? dk(sleeveC) : dk(o.skin)
    const foreC = outerSleeve || longSleeve ? dk(sleeveC) : dk(o.skin)
    const w = outerSleeve ? (o.outer === 'padding' ? 13 : 11) : 9
    const f = reach(sh), UPPER_ = UPPER * f, FORE_ = FORE * f
    return (
      <g transform={`translate(${SHOULDER[0]} ${SHOULDER[1]}) rotate(${-sh})`}>
        <Seg d={`M0 0 L0 ${UPPER_}`} w={w} c={upperC} />
        {!longSleeve && !outerSleeve && <Seg d="M0 0 L0 9" w={dress ? 11 : 12} c={dk(o.topColor)} />}
        <g transform={`translate(0 ${UPPER_}) rotate(${-el})`}>
          <circle r={w / 2 + 0.3} fill={upperC} />
          <Seg d={`M0 0 L0 ${FORE_}`} w={w} c={foreC} />
          {o.top === 'sport' && !outerSleeve && <path d={`M-3 0 V${FORE_ - 2}`} stroke="#fff" strokeWidth="1.6" />}
          {!far && hasAcc('watch') && !outerSleeve && !longSleeve && <rect x="-5" y={FORE_ - 6} width="10" height="4" rx="1.5" fill={accC('watch')} stroke={INK} strokeWidth="1.4" />}
          <circle cy={FORE_ + 2} r="5.5" fill={dk(o.skin)} stroke={INK} strokeWidth={SW} />
          {hold && <g transform={`translate(0 ${FORE_ + 2}) rotate(${sh + el})`}>{hold}</g>}
        </g>
      </g>
    )
  }
  // 지팡이: 가까운 손 위치에서 땅까지 (세상 좌표로 계산)
  const rad = (d: number) => (d * Math.PI) / 180
  const hipY = kid ? 188 - (188 - HIP[1]) * by : HIP[1]
  const handN = (() => {
    const s = rad(P.armN[0] - P.lean), e = rad(P.armN[0] + P.armN[1] - P.lean)
    const [sx, sy] = [HIP[0] + Math.sin(rad(P.lean)) * (HIP[1] - SHOULDER[1]), HIP[1] - Math.cos(rad(P.lean)) * (HIP[1] - SHOULDER[1])]
    const f = reach(P.armN[0])
    return [sx + Math.sin(s) * UPPER * f + Math.sin(e) * (FORE * f + 2), sy + Math.cos(s) * UPPER * f + Math.cos(e) * (FORE * f + 2)]
  })()
  // 지팡이: 늘 손에 쥐고 있음 (사라지지 않음). 아래팔 방향으로 들고 있다가, 끝이 땅에 닿으면 땅을 짚도록 기울임
  const caneT = (() => {
    if (!cane || noCane) return null
    const ground = (190 - (200 - 200 * a.scale + P.bob)) / a.scale
    // 손이 바쁘면(손뼉·머리 감싸기 등) 지팡이를 앞에 세워 둠
    // 손에 다른 걸 들었으면(부케·포크 등) 지팡이는 따로 세워 둠
    let th = P.armN[0] + P.armN[1] - P.lean // 아래팔 방향 (0 = 아래, + = 앞)
    // 팔을 크게 들거나 뻗으면(만세·가리키기) 지팡이가 창처럼 보임 → 그때도 세워 둠
    if (caneLean || holding || Math.abs(th) > 40) return `translate(70 ${ground - CANE}) rotate(5)`
    const dy = ground - handN[1]
    // 끝이 땅을 뚫으려 하면: 지팡이를 거의 세운 채(±12°) 손이 손잡이 아래 막대를 쥐는 것처럼 지팡이를 위로 올림
    let up = 0
    if (handN[1] + CANE * Math.cos(rad(th)) > ground) {
      th = Math.max(-12, Math.min(12, th))
      up = Math.max(0, CANE - dy / Math.cos(rad(th)))
    }
    return `translate(${handN[0]} ${handN[1]}) rotate(${-th}) translate(0 ${-up})`
  })()

  const armHigh = P.armN[0] > 125
  // 앉거나 쪼그리면 (허벅지가 앞으로) 치마·원피스 자락이 허벅지를 덮고 무릎에서 아래로 늘어짐 (11-28 사용자)
  const sitH = Math.max(P.legN[0], P.legF[0])
  const skirtKind = dress ? 'dress' : o.bottom === 'skirt' ? 'skirt' : o.bottom === 'longskirt' ? 'long' : null
  const seatedSkirt = skirtKind && sitH > 45
  const drape = (() => {
    if (!seatedSkirt) return null
    const h = (sitH * Math.PI) / 180, dx = Math.sin(h), dy = Math.cos(h), nx = Math.cos(h), ny = -Math.sin(h)
    const kx = HIP[0] + THIGH * dx, ky = HIP[1] + THIGH * dy
    const ext = skirtKind === 'skirt' ? 3 : 6, drop = skirtKind === 'skirt' ? 5 : skirtKind === 'dress' ? 12 : 30
    const cx = kx + dx * ext + nx * 8, cy = ky + dy * ext + ny * 8
    const ddx = cx + 2, ddy = Math.max(cy, ky) + 12 + drop
    const ex = kx - 6, ey = ky + 7 + drop * 0.5
    return `M35 103 L64 103 Q${cx - 14} ${cy - 3} ${cx} ${cy} Q${cx + 4} ${(cy + ddy) / 2} ${ddx} ${ddy} Q${(ddx + ex) / 2} ${ddy + 3} ${ex} ${ey} L36 ${HIP[1] + 14}Z`
  })()
  const torso = dress && !seatedSkirt
    ? 'M40 72 Q50 67 61 71 Q65 92 66 104 L74 148 Q50 155 27 148 L35 104 Q35 92 40 72Z'
    : 'M40 72 Q50 67 61 71 Q66 94 64 118 Q50 122 37 118 Q35 94 40 72Z'
  const s = a.scale
  return (
    <svg viewBox="0 0 100 200" width={size} height={size * 2} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1="66" x2="0" y2={dress ? 152 : 122}><stop offset="0" stopColor={shade(o.topColor, 0.35)} /><stop offset="0.4" stopColor={o.topColor} /><stop offset="1" stopColor={shade(o.topColor, -0.32)} /></linearGradient>
        <linearGradient id={`${uid}o`} gradientUnits="userSpaceOnUse" x1="0" y1="66" x2="0" y2={outerLong ? 152 : 122}><stop offset="0" stopColor={shade(o.outerColor, 0.35)} /><stop offset="0.4" stopColor={o.outerColor} /><stop offset="1" stopColor={shade(o.outerColor, -0.34)} /></linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1="106" x2="0" y2={o.bottom === 'longskirt' ? 176 : 148}><stop offset="0" stopColor={shade(o.bottomColor, 0.25)} /><stop offset="0.45" stopColor={o.bottomColor} /><stop offset="1" stopColor={shade(o.bottomColor, -0.34)} /></linearGradient>
        <clipPath id={`${uid}c`}><path d={torso} /></clipPath>
      </defs>
      <g transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
        {!noShadow && <ellipse cx="50" cy="191" rx={20 * s} ry="4" fill="rgba(42,33,24,0.16)" />}
        <g transform={`translate(${50 - 50 * s} ${200 - 200 * s + P.bob}) scale(${s})`} strokeLinejoin="round">
          <g transform={bodyT}>
            {/* 먼 쪽 (몸 뒤) */}
            <g transform={`rotate(${P.lean} ${HIP[0]} ${HIP[1]})`}>{arm(P.armF[0], P.armF[1], true)}</g>
            {leg(P.legF[0], P.legF[1], true, P.legF[2])}
            {/* 가방 (등 뒤) */}
            {(extra === 'kinder' || extra === 'student' || hasAcc('bag')) && (
              <g transform={`rotate(${P.lean} ${HIP[0]} ${HIP[1]})`}>
                <rect x="24" y="76" width="17" height={extra === 'kinder' ? 30 : 38} rx="7" fill={extra === 'kinder' ? '#F2C230' : extra === 'student' ? outfit.topColor : accC('bag')} stroke={INK} strokeWidth={SW} />
                <rect x="26" y="92" width="13" height="10" rx="3" fill="rgba(255,255,255,0.3)" />
              </g>
            )}
            {leg(P.legN[0], P.legN[1], false, P.legN[2])}
            {/* 치마 (다리 위, 몸통 아래) */}
            {drape && <path d={drape} fill={dress ? `url(#${uid}t)` : `url(#${uid}b)`} stroke={INK} strokeWidth={SW} />}
            {!drape && !dress && o.bottom === 'skirt' && <path d="M37 108 h27 l7 36 q-20 6 -41 0z" fill={`url(#${uid}b)`} stroke={INK} strokeWidth={SW} />}
            {!drape && !dress && o.bottom === 'longskirt' && <path d="M37 108 h27 l9 64 q-22 6 -45 0z" fill={`url(#${uid}b)`} stroke={INK} strokeWidth={SW} />}
            {pantsLike && <path d="M37 108 h27 v12 q-13 4 -27 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />}
            {shorts && <path d="M37 108 h27 v12 q-13 4 -27 0z" fill={o.bottomColor} stroke={INK} strokeWidth={SW} />}

            {/* 상체 (엉덩이 기준으로 숙임) */}
            <g transform={`rotate(${P.lean} ${HIP[0]} ${HIP[1]})`}>
              {outerOn && outerLong && <path d="M36 98 L28 150 Q50 156 70 150 L64 98Z" fill={`url(#${uid}o)`} stroke={INK} strokeWidth={SW} />}
              <path d={torso} fill={`url(#${uid}t)`} stroke={INK} strokeWidth={SW} />
              <g clipPath={`url(#${uid}c)`}>
                {o.top === 'stripe' && <path d="M30 84h40M30 96h40M30 108h40" stroke={shade(o.topColor, 0.75)} strokeWidth="4.5" />}
                <path d="M37 74 Q34 96 37 118 L44 118 Q41 96 43 74Z" fill="rgba(42,33,24,0.2)" />
                <path d="M57 76 Q61 88 60 98" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
                {o.top === 'sport' && <path d="M58 72 V120" stroke="#fff" strokeWidth="2" />}
                {o.top === 'hanbok' && <path d="M60 74 L48 98" stroke="#fff" strokeWidth="4" />}
              </g>
              <SideTop o={o} />
              {outerOn && <SideOuter o={o} grad={`url(#${uid}o)`} />}
              {extra === 'student' && <path d="M46 72 v40" stroke={outfit.topColor} strokeWidth="4" strokeLinecap="round" />}
              {extra === 'kinder' && <path d="M46 72 v34" stroke="#F2C230" strokeWidth="4" strokeLinecap="round" />}
              {hasAcc('bag') && !extra && <path d="M58 72 L40 104" stroke={shade(accC('bag'), -0.3)} strokeWidth="3.5" strokeLinecap="round" />}
              {hasAcc('necklace') && <path d="M55 72 Q60 80 62 76" stroke="#E2B85C" strokeWidth="2" fill="none" />}
            </g>
          </g>
          {/* 팔을 높이 들면(만세) 가까운 팔을 머리 뒤로 → 얼굴을 가리지 않음 */}
          {armHigh && <g transform={bodyT}><g transform={`rotate(${P.lean} ${HIP[0]} ${HIP[1]})`}>{arm(P.armN[0], P.armN[1], false, holding)}</g></g>}
          {/* 머리: 아이는 몸만 줄이고 머리는 크게 (앞모습과 같음) → 몸 줄임(bodyT) 밖에서, 숙이기는 같은 엉덩이 기준 */}
          <g transform={`rotate(${P.lean} 50 ${hipY})`}>
            <g transform={headT}>
              <g transform={`rotate(${P.head} 50 70)`}><SideHead o={o} expr={expr} extra={extra} hasAcc={hasAcc} accC={accC} /></g>
            </g>
          </g>
          {caneT && <g transform={caneT} fill="none" strokeLinecap="round">
            {/* 손잡이는 "?" 모양: 손 위에서 뒤쪽으로 굽어 내려옴 */}
            <path d={`M5 ${CANE} V0 C5 -11 -11 -11 -11 1`} stroke={INK} strokeWidth="7.5" />
            <path d={`M5 ${CANE} V0 C5 -11 -11 -11 -11 1`} stroke="#9A6A3E" strokeWidth="4" />
          </g>}
          {/* 가까운 팔: 보통은 맨 앞 */}
          {!armHigh && <g transform={bodyT}><g transform={`rotate(${P.lean} ${HIP[0]} ${HIP[1]})`}>{arm(P.armN[0], P.armN[1], false, holding)}</g></g>}
        </g>
      </g>
    </svg>
  )
}

function Shoe({ o, dk }: { o: Outfit; dk: (c: string) => string }) {
  const c = dk(o.shoesColor)
  const p = { fill: c, stroke: INK, strokeWidth: SW }
  switch (o.shoes) {
    case 'boots': return <path d="M-7 -14 h12 v10 q9 1 10 7 v3 h-22z" {...p} />
    case 'sandals': return <g><path d="M-7 3 h20 v3 h-20z" {...p} /><path d="M-3 3 q4 -6 9 0" stroke={shade(o.shoesColor, -0.3)} strokeWidth="2.5" fill="none" /></g>
    case 'loafers': return <g><path d="M-7 -4 h10 q9 0 10 6 v3 h-20z" {...p} /><path d="M2 -1 h6" stroke={shade(o.shoesColor, 0.35)} strokeWidth="1.5" /></g>
    default: return <g><path d="M-7 -5 h10 q10 0 11 7 v3 h-21z" {...p} /><path d="M-8 3 h22" stroke="#fff" strokeWidth="2" /><path d="M1 -2 l3 2" stroke={shade(o.shoesColor, 0.45)} strokeWidth="1.1" /></g>
  }
}

function SideTop({ o }: { o: Outfit }) {
  const d = shade(o.topColor, -0.22)
  switch (o.top) {
    case 'hoodie': return <path d="M38 70 Q30 76 36 88 Q42 80 46 72Z" fill={shade(o.topColor, -0.12)} stroke={INK} strokeWidth="1.8" />
    case 'shirt': case 'police': return <path d="M55 69 l8 4 l-6 5z" fill={o.top === 'police' ? shade(o.topColor, -0.15) : '#fff'} stroke={INK} strokeWidth="1.5" />
    case 'tie': return <g><path d="M55 69 l8 4 l-6 5z" fill="#fff" stroke={INK} strokeWidth="1.5" /><path d="M60 76 l3 1 l1 22 l-3 3 l-2 -3z" fill="#C2452D" stroke={INK} strokeWidth="1.4" /></g>
    case 'tee': case 'stripe': case 'dress': return <path d="M54 70 q4 4 8 2" fill="none" stroke={d} strokeWidth="2" />
    default: return null
  }
}

function SideOuter({ o, grad }: { o: Outfit; grad: string }) {
  const len = LONG_OUTER.includes(o.outer) ? 150 : o.outer === 'padding' ? 120 : 118
  const p = { fill: grad, stroke: INK, strokeWidth: SW }
  return (
    <g>
      <path d={`M39 71 Q46 68 52 70 L54 ${len} Q45 ${len + 2} 36 ${len - 1} Q34 96 39 71Z`} {...p} />
      <path d={`M58 70 Q62 71 62 73 Q66 94 ${LONG_OUTER.includes(o.outer) ? '68' : '65'} ${len - 1} L60 ${len} Z`} {...p} />
      {o.outer === 'padding' && <path d="M38 84 h14 M38 97 h15 M38 110 h16" stroke={shade(o.outerColor, -0.25)} strokeWidth="1.6" fill="none" />}
      {o.outer === 'raincoat' && <path d="M38 70 Q30 76 36 88 Q42 80 46 72Z" {...p} />}
      {o.outer === 'cardigan' && <g fill="#F4EBD6" stroke={INK} strokeWidth="1"><circle cx="61" cy="86" r="1.6" /><circle cx="62" cy="98" r="1.6" /></g>}
    </g>
  )
}

// 옆얼굴: 오른쪽을 봄. 눈 (64,46)
function SideHead({ o, expr, extra, hasAcc, accC }: { o: Outfit; expr: Expr; extra: string | null; hasAcc: (id: string) => boolean; accC: (id: string) => string }) {
  const brow = shade(o.hairColor, -0.1)
  const RED = '#E5484D', BLUE = '#6FC3EE', MOUTH = '#B3463A'
  const c = o.hairColor
  const hp = { fill: c, stroke: INK, strokeWidth: SW }
  const blush = (col: string, op: number) => <ellipse cx="61" cy="55" rx="5" ry="3.2" fill={col} opacity={op} />
  const B = (d: string, w = 2) => <path d={d} stroke={brow} strokeWidth={w} strokeLinecap="round" fill="none" />
  const heart = (x: number, y: number, sz: number) => <path d={`M${x} ${y + sz * 0.9} C${x - sz * 1.4} ${y - sz * 0.1} ${x - sz * 0.7} ${y - sz * 1.1} ${x} ${y - sz * 0.35} C${x + sz * 0.7} ${y - sz * 1.1} ${x + sz * 1.4} ${y - sz * 0.1} ${x} ${y + sz * 0.9}Z`} fill={RED} stroke={INK} strokeWidth="1.2" />
  let face: ReactNode
  switch (expr) {
    case 'happy': case 'clap':
      face = <>{blush('#F07A7A', 0.7)}{B('M59 36 q5 -3.5 10 -0.5')}<path d="M60 48 q4.5 -6.5 9 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" /><path d="M64 55 q6 0 10 -1 q-1 8 -6 8 q-4 0 -4 -7z" fill={MOUTH} stroke={INK} strokeWidth="1.8" /></>
      break
    case 'sad':
      face = <>{blush('#9DB4D8', 0.45)}{B('M59 39 l9 -4', 2.4)}<path d="M60 47 q4 3 8 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" /><path d="M63 50 q-2 8 0 14 q3 -2 2 -8z" fill={BLUE} stroke={INK} strokeWidth="1.1" /><path d="M66 60 q2 -3 4 -1 q2 -2 3 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" /></>
      break
    case 'surprised':
      face = <>{blush('#F09A8A', 0.45)}{B('M59 33 q5 -4 10 -1', 2.2)}<circle cx="64" cy="46" r="6" fill="#fff" stroke={INK} strokeWidth="2" /><circle cx="65.5" cy="46.5" r="2.2" fill={INK} /><ellipse cx="69" cy="59" rx="3.6" ry="4.6" fill={MOUTH} stroke={INK} strokeWidth="1.8" /></>
      break
    case 'angry':
      face = <>{blush(RED, 0.6)}{B('M58 36 l11 5', 3)}<path d="M59 45.5 h9 q0 5 -4.5 5 q-4.5 0 -4.5 -5z" fill={INK} /><rect x="64" y="56" width="10" height="6" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" /></>
      break
    case 'love':
      face = <>{blush('#F07A9A', 0.8)}{B('M59 37 q5 -3 9 0')}{heart(64, 47, 6)}<path d="M64 55 q5 1 9 0 q-1 6 -5 6 q-4 0 -4 -6z" fill={MOUTH} stroke={INK} strokeWidth="1.8" /></>
      break
    case 'tease':
      face = <>{blush('#F09A8A', 0.6)}{B('M59 38 q5 -2 9 0')}<path d="M60 44 l8 3 l-8 3.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M65 56 q5 2 9 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M68 57 h6 v3 q0 5 -3 5 q-3 0 -3 -5z" fill="#F07A8A" stroke={INK} strokeWidth="1.4" /></>
      break
    default:
      face = <>{blush('#F09A8A', 0.55)}{B('M59 38 q5 -2.5 9 0')}<ellipse cx="64" cy="47" rx="3.3" ry="4.2" fill={INK} /><circle cx="65.2" cy="45.3" r="1.4" fill="#fff" />{o.gender === 'f' && <path d="M67.3 44 l2.6 -1.8" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}<path d="M66 57 q4 2.5 7 -0.5" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" /></>
  }
  const behind = (() => {
    switch (o.hair) {
      case 'long': return <path d="M30 32 Q22 60 26 88 Q38 94 50 88 L48 52Z" {...hp} />
      case 'bob': return <path d="M27 34 Q22 52 26 66 Q38 70 52 64 L50 46Z" {...hp} />
      case 'pony': return <path d="M27 30 Q8 36 12 74 Q20 62 30 44Z" {...hp} />
      case 'twin': return <path d="M30 36 Q12 48 18 84 Q26 72 34 52Z" {...hp} />
      case 'bun': return <circle cx="30" cy="20" r="10" {...hp} />
      case 'curly': return <g {...hp}><circle cx="28" cy="50" r="8" /><circle cx="32" cy="60" r="7" /></g>
      default: return null
    }
  })()
  const front = (() => {
    const hi = <path d="M40 20 Q50 15 60 18" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
    switch (o.hair) {
      case 'buzz': return <path d="M26 44 Q24 16 50 16 Q72 16 75 34 Q62 28 48 30 Q38 32 34 46 Q30 50 26 44Z" fill={c} opacity="0.85" />
      case 'curly': return <g {...hp}><circle cx="30" cy="34" r="9" /><circle cx="38" cy="22" r="10" /><circle cx="52" cy="17" r="10" /><circle cx="64" cy="22" r="9" /><circle cx="70" cy="31" r="6" /><circle cx="30" cy="46" r="7" /></g>
      case 'twoblock': return <g><path d="M28 50 Q26 40 30 32" stroke={shade(c, 0.25)} strokeWidth="4" fill="none" /><path d="M27 38 Q26 14 52 13 Q76 14 77 34 Q68 26 58 28 Q46 32 36 40 Q31 37 27 38Z" {...hp} />{hi}</g>
      default: return <g><path d="M25 46 Q22 15 50 14 Q75 15 77 36 Q70 29 63 31 Q57 27 50 31 Q42 30 38 38 L36 52 Q29 54 25 46Z" {...hp} />{hi}</g>
    }
  })()
  const hat = (() => {
    const hc = o.hatColor
    const p = { fill: hc, stroke: INK, strokeWidth: SW }
    switch (o.hat) {
      case 'cap': return <g><path d="M66 31 Q82 31 90 37 Q78 39 64 36z" fill={shade(hc, -0.15)} stroke={INK} strokeWidth={SW} /><path d="M24 34 Q24 11 50 11 Q74 11 76 33 Q50 28 24 34Z" {...p} /></g>
      case 'beanie': return <g><path d="M25 34 Q25 9 50 9 Q75 9 75 34z" {...p} /><path d="M24 29 h52 v8 q-26 3 -52 0z" fill={shade(hc, -0.15)} stroke={INK} strokeWidth={SW} /><circle cx="48" cy="8" r="5.5" {...p} /></g>
      case 'bucket': return <g><path d="M30 30 Q32 12 50 12 Q68 12 70 30z" {...p} /><ellipse cx="50" cy="31" rx="33" ry="5" {...p} /></g>
      case 'ribbon': return <g {...p}><path d="M34 20 l-12 -8 v17z" /><path d="M34 20 l10 -9 v17z" /><circle cx="34" cy="20" r="4" /></g>
      case 'chef': return <g><path d="M31 30 v-5 q-9-2-7-10 q2-7 10-5 q2-8 16-8 q14 0 16 8 q8-2 10 5 q2 8-7 10 v5z" {...p} fill="#fff" /><rect x="30" y="26" width="40" height="9" rx="3" {...p} fill="#f2f2f2" /></g>
      case 'santa': return <g><path d="M25 32 Q28 8 52 8 Q40 10 20 30 L16 34z" {...p} fill="#D6342B" /><path d="M25 32 Q30 10 54 8 Q74 12 76 30z" {...p} fill="#D6342B" /><rect x="22" y="27" width="56" height="9" rx="4.5" {...p} fill="#fff" /><circle cx="16" cy="34" r="5.5" {...p} fill="#fff" /></g>
      case 'police': return <g><path d="M64 33 Q80 33 86 38 L64 38z" fill="#1d2433" stroke={INK} strokeWidth={SW} /><path d="M24 32 Q22 12 50 11 Q78 12 76 32z" {...p} /><rect x="23" y="27" width="54" height="7" rx="3" fill="#1d2433" stroke={INK} strokeWidth="1.6" /><circle cx="66" cy="20" r="3.6" fill="#E8C060" stroke={INK} strokeWidth="1.2" /></g>
      // 학사모 (장면 전용): 머리를 덮는 모자 + 납작한 네모 판 + 노란 술
      case 'grad': return <g><path d="M25 36 Q24 13 50 13 Q76 13 77 36 Q50 30 25 36Z" fill="#2A2238" stroke={INK} strokeWidth={SW} /><path d="M8 13 L50 2 L94 13 L50 24Z" fill="#2A2238" stroke={INK} strokeWidth={SW} strokeLinejoin="round" /><circle cx="50" cy="13" r="2.6" fill="#F2C230" stroke={INK} strokeWidth="1.2" /><path d="M50 13 L84 16 V34" stroke="#F2C230" strokeWidth="2.6" fill="none" /><path d="M81 33 h6 l-1 7 h-4z" fill="#F2C230" stroke={INK} strokeWidth="1" /></g>
      case 'crown': return <path d="M30 28 l5 -18 l9 10 l6 -14 l6 14 l9 -10 l5 18z" fill="#E8C060" stroke={INK} strokeWidth={SW} />
      default: return null
    }
  })()
  return (
    <g>
      {behind}
      {/* 목 */}
      <path d="M44 62 v10 q6 3 12 0 v-10z" fill={o.skin} stroke={INK} strokeWidth={SW} />
      {hasAcc('scarf') && <g fill={accC('scarf')} stroke={INK} strokeWidth={SW}><path d="M40 64 Q52 72 62 64 L63 72 Q52 80 39 72Z" /><path d="M40 70 l-6 22 l7 2 l5 -21z" /></g>}
      {/* 얼굴 (코가 앞으로 살짝) */}
      <path d="M26 42 Q26 17 50 17 Q72 17 75 38 Q76 42 79 46 Q80 49 76 50 Q75 62 62 66 Q50 69 38 64 Q26 58 26 42Z" fill={o.skin} stroke={INK} strokeWidth={SW} />
      {/* 귀 */}
      <ellipse cx="42" cy="47" rx="5" ry="6" fill={o.skin} stroke={INK} strokeWidth={SW} />
      <path d="M41 45 q2 2 0 4" stroke="rgba(42,33,24,0.35)" strokeWidth="1.5" fill="none" />
      {hasAcc('earrings') && <circle cx="42" cy="55" r="2.4" fill={accC('earrings')} stroke={INK} strokeWidth="1.2" />}
      {face}
      {front}
      {hasAcc('hairpin') && <g fill={accC('hairpin')} stroke={INK} strokeWidth="1.2">{[0, 72, 144, 216, 288].map((d) => <circle key={d} cx={60 + 3.4 * Math.cos((d * Math.PI) / 180)} cy={25 + 3.4 * Math.sin((d * Math.PI) / 180)} r="2.6" />)}<circle cx="60" cy="25" r="1.9" fill="#F2C230" /></g>}
      {hasAcc('glasses') && <g stroke={INK} strokeWidth="2" fill="rgba(255,255,255,0.25)"><circle cx="65" cy="47" r="7" /><path d="M58 46 L44 44" fill="none" /></g>}
      {hasAcc('sunglasses') && <g><path d="M57 42 h14 v5 q0 6 -7 6 q-7 0 -7 -6z" fill={INK} /><path d="M57 44 L44 43" stroke={INK} strokeWidth="2" /></g>}
      {hasAcc('mask') && <g><rect x="58" y="51" width="20" height="13" rx="5" fill={accC('mask')} stroke={INK} strokeWidth="1.6" /><path d="M58 55 Q50 52 44 50" stroke="#ddd" strokeWidth="1.4" fill="none" /></g>}
      {hasAcc('headphones') && <g><path d="M38 44 Q34 12 54 12" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" /><path d="M38 44 Q34 12 54 12" fill="none" stroke={accC('headphones')} strokeWidth="3.6" strokeLinecap="round" /><rect x="36" y="39" width="12" height="16" rx="4" fill={accC('headphones')} stroke={INK} strokeWidth={SW} /></g>}
      {hat}
      {extra === 'baby' && <g><circle cx="76" cy="57" r="4.5" fill="#F3A3C0" stroke={INK} strokeWidth="1.5" /><circle cx="77" cy="57" r="1.8" fill="#fff" /></g>}
    </g>
  )
}
