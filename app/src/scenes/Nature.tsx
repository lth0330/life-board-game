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
        return <g key={i}><path d={`M${fx} ${y} V${y - h}`} stroke="#4E8A3A" strokeWidth="1.2" /><path d={`M${fx} ${y - 2} q-3 -1 -4 -4 q3 0 4 3`} fill="#6FAF5E" stroke="#4E8A3A" strokeWidth="0.5" /><Blossom x={fx} y={y - h} c={cs[(i + seed) % cs.length]} /></g>
      })}
    </g>
  )
}

/** 꽃 한 송이 (꽃잎 다섯 장 + 가운데) */
export function Blossom({ x, y, c, r = 2.4 }: { x: number; y: number; c: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((d) => <ellipse key={d} cx="0" cy={-r * 0.75} rx={r * 0.55} ry={r * 0.8} fill={c} stroke={INK} strokeWidth="0.5" transform={`rotate(${d})`} />)}
      <circle r={r * 0.45} fill="#F2C230" stroke={INK} strokeWidth="0.4" />
    </g>
  )
}

/** 공원 휴지통 */
export function TrashBin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d="M-7 0 L-8 -20 H8 L7 0Z" fill="#5E8F6A" stroke={INK} strokeWidth="1.5" />
      {[-4, 0, 4].map((k) => <path key={k} d={`M${k} -17 V-3`} stroke="#4A7656" strokeWidth="1.4" />)}
      <path d="M-9.5 -20 Q0 -26 9.5 -20Z" fill="#4A7656" stroke={INK} strokeWidth="1.4" />
      <rect x="-4" y="-14" width="8" height="5" rx="1" fill="#fff" stroke={INK} strokeWidth="0.6" />
      <path d="M-2 -11.5 l1.5 1.5 l2.5 -3" stroke="#5E8F6A" strokeWidth="0.8" fill="none" />
    </g>
  )
}

/** 공원 벤치 (옆에서 본 긴 의자): 나무 판 여러 줄 · 쇠 다리 · 팔걸이 */
export function ParkBench({ x, y, w = 56, c = '#C98B55' }: { x: number; y: number; w?: number; c?: string }) {
  const leg = (lx: number) => <g key={lx}><path d={`M${lx} 0 Q${lx - 1} -8 ${lx + 2} -14 M${lx + 2} -14 L${lx - 2} -30`} stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" /><path d={`M${lx} 0 Q${lx - 1} -8 ${lx + 2} -14 M${lx + 2} -14 L${lx - 2} -30`} stroke="#4A4E56" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d={`M${lx - 3} -18 Q${lx + 4} -22 ${lx + 6} -16`} stroke="#4A4E56" strokeWidth="1.6" fill="none" /></g>
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {/* 등받이 판 3줄 */}
      {[-34, -29, -24].map((by) => <rect key={by} x={-w / 2} y={by} width={w} height="3.6" rx="1.2" fill={c} stroke={INK} strokeWidth="1.1" />)}
      {/* 앉는 판 2줄 */}
      <rect x={-w / 2 - 2} y="-16" width={w + 4} height="4" rx="1.4" fill={c} stroke={INK} strokeWidth="1.2" />
      <rect x={-w / 2 - 1} y="-13" width={w + 2} height="3" rx="1.2" fill={c} stroke={INK} strokeWidth="1" opacity="0.9" />
      {[-w / 2 + 6, w / 2 - 6].map(leg)}
      {/* 나뭇결 */}
      <path d={`M${-w / 2 + 6} -32 h10 M${w / 2 - 18} -27 h8 M${-w / 4} -14.5 h12`} stroke="rgba(42,33,24,0.25)" strokeWidth="0.7" />
    </g>
  )
}

/** 풀 포기 */
export function Grass({ x, y, c = '#5E9A50' }: { x: number; y: number; c?: string }) {
  return <path transform={`translate(${x} ${y})`} d="M-5 0 Q-4 -6 -6 -9 M0 0 Q0 -7 1 -11 M5 0 Q4 -6 6 -8" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
}
