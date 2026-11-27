// 장면 공통 효과: 쿵(글자)·먼지·별·땀·하트·김·말풍선·반짝
import { INK, ease, seg } from './kit'

/** 큰 글자 '쿵!' 같은 것: t0에 튀어나와 커졌다가 사라짐 */
export function Bang({ t, t0, x, y, text, color = '#E0533F', size = 26, dur = 0.9 }: { t: number; t0: number; x: number; y: number; text: string; color?: string; size?: number; dur?: number }) {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return null
  const sc = k < 0.25 ? ease.back(k / 0.25) : 1
  const op = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1
  return (
    <g transform={`translate(${x} ${y - k * 8}) scale(${sc}) rotate(-8)`} opacity={op}>
      {/* 뾰족 테두리 */}
      <path d={star(size * 1.25, size * 0.8, 10)} fill="#FFE27A" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <text textAnchor="middle" dy={size * 0.34} fontSize={size} fill={color} stroke={INK} strokeWidth="1.4" paintOrder="stroke">{text}</text>
    </g>
  )
}
const star = (R: number, r: number, n: number) => {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 ? r : R * 0.95
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr * 1.25).toFixed(1)} ${(Math.sin(a) * rr * 0.8).toFixed(1)}`
  }
  return d + 'Z'
}

/** 먼지 구름: t0에 양옆으로 퍼짐 */
export function Dust({ t, t0, x, y, n = 4, spread = 30 }: { t: number; t0: number; x: number; y: number; n?: number; spread?: number }) {
  const k = seg(t, t0, t0 + 0.9)
  if (k <= 0 || k >= 1) return null
  const e = ease.out(k)
  return (
    <g opacity={1 - k}>
      {Array.from({ length: n }, (_, i) => {
        const dir = i % 2 ? 1 : -1, far = 0.5 + (i >> 1) * 0.5
        return <circle key={i} cx={x + dir * spread * far * e} cy={y - 4 - e * (6 + i * 2)} r={5 + e * 6 * (1 - i * 0.1)} fill="#F6EFE2" stroke={INK} strokeWidth="1.8" />
      })}
    </g>
  )
}

/** 머리 위에서 도는 별 (어지러움) */
export function Stars({ t, x, y, r = 16 }: { t: number; x: number; y: number; r?: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a = t * 5 + (i * Math.PI * 2) / 3
        const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * 0.35
        return <path key={i} transform={`translate(${sx} ${sy}) scale(${0.8 + 0.25 * Math.sin(a)})`} d={star(6, 2.6, 5)} fill="#FFD23F" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      })}
    </g>
  )
}

/** 땀 한 방울 (민망·당황) */
export function Sweat({ t, t0, x, y, dur = 1.2 }: { t: number; t0: number; x: number; y: number; dur?: number }) {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return null
  return <path transform={`translate(${x} ${y + k * 6})`} opacity={k > 0.8 ? (1 - k) * 5 : 1} d="M0 -7 Q6 1 0 5 Q-6 1 0 -7Z" fill="#8FD3F4" stroke={INK} strokeWidth="1.6" />
}

/** 하트가 퐁퐁 올라감 */
export function Hearts({ t, t0, x, y, n = 3, dur = 1.6 }: { t: number; t0: number; x: number; y: number; n?: number; dur?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = seg(t, t0 + i * 0.25, t0 + i * 0.25 + dur)
        if (k <= 0 || k >= 1) return null
        return <path key={i} transform={`translate(${x + Math.sin(k * 7 + i) * 6 + (i - 1) * 10} ${y - k * 34}) scale(${0.7 + 0.4 * ease.back(Math.min(1, k * 4))})`} opacity={1 - k * k} d="M0 4 C-9 -3 -5 -10 0 -5 C5 -10 9 -3 0 4Z" fill="#F2708A" stroke={INK} strokeWidth="1.5" />
      })}
    </g>
  )
}

/** 김 (뜨거운 음식) */
export function Steam({ t, x, y, n = 3 }: { t: number; x: number; y: number; n?: number }) {
  return (
    <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
      {Array.from({ length: n }, (_, i) => {
        const k = (t * 0.7 + i / n) % 1
        return <path key={i} opacity={Math.sin(k * Math.PI)} transform={`translate(${x + (i - (n - 1) / 2) * 7} ${y - k * 16})`} d="M0 0 q-3 -4 0 -8 q3 -4 0 -8" />
      })}
    </g>
  )
}

/** 말풍선: t0~t1 동안. 꼬리는 (tx, ty)를 가리킴 */
/** 말풍선. at = 말하는 사람 머리 x (주면 꼬리가 그 사람 머리 위에 오도록 말풍선 자리를 맞춤) */
export function Bubble({ t, t0, t1, x = 0, y, text, tail = 'left', size = 14, dashed, at }: { t: number; t0: number; t1: number; x?: number; y: number; text: string; tail?: 'left' | 'right'; size?: number; dashed?: boolean; at?: number }) {
  if (t < t0 || t > t1) return null
  const pop = ease.back(seg(t, t0, t0 + 0.25))
  const op = seg(t, t1, t1 - 0.25)
  const w = text.length * size * 0.92 + 18, h = size + 14
  const tx = tail === 'left' ? -w / 2 + 14 : w / 2 - 14
  if (at !== undefined) x = at - tx
  // 무대(320×180) 밖으로 안 나가게
  const bx = Math.max(w / 2 + 3, Math.min(320 - w / 2 - 3, x)), by = Math.max(h / 2 + 3, y)
  return (
    <g transform={`translate(${bx} ${by}) scale(${pop})`} opacity={op}>
      {!dashed && <path d={`M${tx - 5} ${h / 2 - 2} L${tx + (tail === 'left' ? -6 : 6)} ${h / 2 + 9} L${tx + 6} ${h / 2 - 2}Z`} fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#fff" stroke={INK} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} />
      {!dashed && <path d={`M${tx - 4} ${h / 2 - 1.2} H${tx + 5}`} stroke="#fff" strokeWidth="2.6" />}
      <text textAnchor="middle" dy={size * 0.36} fontSize={size} fill={INK}>{text}</text>
    </g>
  )
}

/** 반짝 (기쁨·새것) */
export function Sparkle({ t, t0, x, y, dur = 0.8, s = 1 }: { t: number; t0: number; x: number; y: number; dur?: number; s?: number }) {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return null
  const sc = Math.sin(k * Math.PI) * s
  return <path transform={`translate(${x} ${y}) scale(${sc}) rotate(${k * 90})`} d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2Z" fill="#FFF3A6" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
}

/** 빠르게 움직이는 느낌 선 */
export function SpeedLines({ x, y, len = 18, n = 3, op = 1 }: { x: number; y: number; len?: number; n?: number; op?: number }) {
  return <g stroke={INK} strokeWidth="2" strokeLinecap="round" opacity={0.5 * op}>{Array.from({ length: n }, (_, i) => <path key={i} d={`M${x - i * 4} ${y + i * 9} h${-len + i * 4}`} />)}</g>
}
