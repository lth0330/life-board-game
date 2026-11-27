// 배경 자연물·거리 소품 (11-28 사용자: 나무가 막대사탕 같다 → 줄기·가지·겹친 잎 덩어리·그늘·빛)
import { INK } from './kit'

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)))
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}

/** 잎 덩어리 여러 개를 하나로 (바깥 테두리만 선) */
function Blobs({ b, c, sw = 3.6 }: { b: [number, number, number][]; c: string; sw?: number }) {
  return (
    <g>
      {b.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r} fill={INK} stroke={INK} strokeWidth={sw} />)}
      {b.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill={c} />)}
    </g>
  )
}

/** 활엽수: (x, y) = 밑동. s = 크기 배수 (1 = 키 약 90) */
export function Tree({ x, y, s = 1, c = '#7FBF6A', trunk = '#8A5A34', flip }: { x: number; y: number; s?: number; c?: string; trunk?: string; flip?: boolean }) {
  const crown: [number, number, number][] = [[-20, -62, 17], [0, -74, 21], [20, -62, 17], [-10, -50, 15], [12, -48, 15], [-26, -48, 11], [27, -50, 11], [2, -92, 13]]
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* 줄기: 아래가 넓고 위에서 두 갈래 */}
      <path d="M-7 1 Q-4 -10 -4 -26 Q-4 -36 -12 -46 L-8 -48 Q0 -40 1 -36 Q4 -44 12 -50 L15 -46 Q6 -38 5 -26 Q5 -10 8 1Z" fill={trunk} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M-1 -4 V-20 M3 -10 V-24" stroke={shade(trunk, -0.3)} strokeWidth="1.2" />
      <Blobs b={crown} c={shade(c, -0.18)} />
      {/* 밝은 앞 잎 (그늘은 아래쪽에 남음) */}
      <Blobs b={[[-16, -66, 13], [2, -78, 16], [18, -66, 12], [-4, -60, 12], [4, -95, 9]]} c={c} sw={0} />
      <g fill={shade(c, 0.35)}>
        <circle cx="-6" cy="-84" r="5" /><circle cx="-20" cy="-70" r="4" /><circle cx="12" cy="-72" r="3.5" />
      </g>
      <path d="M-14 -56 q3 -3 6 0 M10 -56 q3 -3 6 0 M-2 -66 q3 -3 6 0" stroke={shade(c, -0.35)} strokeWidth="1.3" fill="none" />
    </g>
  )
}

/** 덤불 */
export function Bush({ x, y, s = 1, c = '#6FAF5E', flowers }: { x: number; y: number; s?: number; c?: string; flowers?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Blobs b={[[-14, -8, 9], [0, -12, 12], [14, -8, 9], [-6, -4, 8], [8, -4, 8]]} c={c} sw={3.2} />
      <g fill={shade(c, 0.3)}><circle cx="-4" cy="-16" r="3.5" /><circle cx="-15" cy="-11" r="2.5" /></g>
      {flowers && [[-10, -10], [4, -16], [12, -6], [-2, -5]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r="2.2" fill={flowers} stroke={INK} strokeWidth="0.8" />)}
    </g>
  )
}

/** 가로등 */
export function Lamp({ x, y, on }: { x: number; y: number; on?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-5" y="-4" width="10" height="5" rx="1.5" fill="#4A4E56" stroke={INK} strokeWidth="1.4" />
      <path d="M0 -4 V-64 Q0 -70 8 -70" stroke="#4A4E56" strokeWidth="3" fill="none" />
      <path d="M4 -72 H16 L14 -66 H6Z" fill="#4A4E56" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="10" cy="-65" rx="4" ry="1.8" fill={on ? '#FFF3A6' : '#E8E4DC'} stroke={INK} strokeWidth="1" />
    </g>
  )
}

/** 꽃밭 띠 (x0~x1, 땅 y) */
export function Flowers({ x0, x1, y, seed = 1 }: { x0: number; x1: number; y: number; seed?: number }) {
  const cs = ['#F2708A', '#FFE27A', '#fff', '#C77FD0', '#F7A3B8']
  const n = Math.floor((x1 - x0) / 9)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const fx = x0 + i * 9 + ((i * 7 + seed * 3) % 5), h = 5 + ((i * 5 + seed) % 4)
        return <g key={i}><path d={`M${fx} ${y} V${y - h}`} stroke="#4E8A3A" strokeWidth="1.2" /><circle cx={fx} cy={y - h} r="2.2" fill={cs[(i + seed) % cs.length]} stroke={INK} strokeWidth="0.7" /></g>
      })}
    </g>
  )
}

/** 풀 포기 */
export function Grass({ x, y, c = '#5E9A50' }: { x: number; y: number; c?: string }) {
  return <path transform={`translate(${x} ${y})`} d="M-5 0 Q-4 -6 -6 -9 M0 0 Q0 -7 1 -11 M5 0 Q4 -6 6 -8" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
}
