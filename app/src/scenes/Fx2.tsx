// 장면 효과 더: 음표·물방울·화남·느낌표·먹구름·떨림·날아가는 돈
import { INK, ease, seg } from './kit'

/** 음표가 둥실둥실 (노래) */
export function Notes({ t, t0 = 0, t1 = 99, x, y, n = 3, light }: { t: number; t0?: number; t1?: number; x: number; y: number; n?: number; light?: boolean }) {
  if (t < t0 || t > t1) return null
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = ((t - t0) * 0.6 + i / n) % 1
        const c = light ? ['#FFE27A', '#FFFFFF', '#FFB8C8', '#A6E8FF'][i % 4] : ['#E0533F', '#5E8FC9', '#7FBF6A', '#C77FD0'][i % 4]
        return (
          <g key={i} transform={`translate(${x + i * 10 + Math.sin(k * 8 + i) * 6} ${y - k * 34}) scale(${0.8 + 0.3 * Math.sin(k * Math.PI)})`} opacity={Math.sin(k * Math.PI)}>
            <path d="M2 -12 V2" stroke={INK} strokeWidth="1.8" />
            <path d="M2 -12 Q8 -10 8 -5" stroke={INK} strokeWidth="1.8" fill="none" />
            <ellipse cx="-1" cy="2" rx="4" ry="3" fill={c} stroke={INK} strokeWidth="1.5" />
          </g>
        )
      })}
    </g>
  )
}

/** 물방울 하나가 (x, y0)에서 (x, y1)로 떨어짐. t0에 시작 */
export function Drop({ t, t0, x, y0, y1, splash = true }: { t: number; t0: number; x: number; y0: number; y1: number; splash?: boolean }) {
  const fall = 0.45
  if (t < t0) return null
  if (t < t0 + fall) {
    const k = ease.in((t - t0) / fall)
    return <path transform={`translate(${x} ${y0 + (y1 - y0) * k}) scale(1.5)`} d="M0 -6 Q5 1 0 4 Q-5 1 0 -6Z" fill="#6FC3EE" stroke="#2A5A8A" strokeWidth="1.3" />
  }
  const k = seg(t, t0 + fall, t0 + fall + 0.35)
  if (!splash || k >= 1) return null
  return <g stroke="#2F7FD0" strokeWidth="2.4" strokeLinecap="round" opacity={1 - k}>{[-1, 0, 1].map((d) => <path key={d} d={`M${x + d * (4 + k * 9)} ${y1 - 1} l${d * 4} ${-6 - k * 4}`} />)}</g>
}

/** 화남 표시 (빨간 핏줄) */
export function Anger({ t, t0, t1, x, y }: { t: number; t0: number; t1: number; x: number; y: number }) {
  if (t < t0 || t > t1) return null
  const s = 1 + 0.15 * Math.sin(t * 14)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#E0533F" strokeWidth="2.6" strokeLinecap="round">
      <path d="M-6 -2 Q-2 -2 -2 -6 M2 -6 Q2 -2 6 -2 M6 2 Q2 2 2 6 M-2 6 Q-2 2 -6 2" />
    </g>
  )
}

/** 느낌표 '!' 튀어나옴 */
export function Exclaim({ t, t0, x, y, dur = 0.9, text = '!' }: { t: number; t0: number; x: number; y: number; dur?: number; text?: string }) {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return null
  return <text x={x} y={y} textAnchor="middle" fontSize={22 * ease.back(Math.min(1, k * 4))} fill="#E0533F" stroke={INK} strokeWidth="1.3" paintOrder="stroke" opacity={k > 0.8 ? (1 - k) * 5 : 1}>{text}</text>
}

/** 머리 위 먹구름 + 빗방울 (속상함). 11-28 사용자: 디테일 → 겹친 구름 덩어리(뒤는 어둡게) · 아래 그늘 · 빛 · 물방울 모양 비 · 둥실둥실 */
export function Gloom({ t, t0, t1 = 99, x, y }: { t: number; t0: number; t1?: number; x: number; y: number }) {
  if (t < t0 || t > t1) return null
  const k = ease.back(seg(t, t0, t0 + 0.4))
  const bob = Math.sin((t - t0) * 2.2) * 1.2
  const back: [number, number, number][] = [[-12, -4, 7], [-3, -9, 9], [8, -7, 8], [15, -1, 6]]
  const front: [number, number, number][] = [[-15, 1, 6], [-6, -2, 8], [4, -4, 8.5], [13, 1, 6.5], [-1, 3, 7]]
  const blobs = (b: [number, number, number][], c: string, sw: number) => (
    <g>
      {sw > 0 && b.map(([cx, cy, r], i) => <circle key={`o${i}`} cx={cx} cy={cy} r={r} fill={INK} stroke={INK} strokeWidth={sw} />)}
      {b.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill={c} />)}
    </g>
  )
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${k})`}>
      {/* 비: 물방울 모양, 살짝 비스듬히, 떨어지며 흐려짐 */}
      {[-13, -6, 1, 8, 14].map((dx, i) => {
        const q = (t * 1.5 + i * 0.37) % 1
        return <path key={dx} d="M0 -3 Q2.4 1 0 2.4 Q-2.4 1 0 -3Z" fill="#7FC6EA" stroke="#3E8EBE" strokeWidth="0.6" opacity={1 - q * 0.9} transform={`translate(${dx - q * 3} ${8 + q * 18}) rotate(12)`} />
      })}
      {blobs(back, '#6E7884', 3.2)}
      {blobs(front, '#9AA3AE', 0)}
      {/* 아래 그늘 (평평한 밑면) */}
      <path d="M-20 4 Q-18 9 -10 9 H12 Q19 9 19 4 Q10 7 0 6.5 Q-10 7 -20 4Z" fill="#7E8894" />
      <path d="M-19 7 Q-12 11 0 10 Q12 11 19 6" stroke={INK} strokeWidth="1.6" fill="none" />
      {/* 빛 받은 윗부분 */}
      <path d="M-9 -6 Q-6 -10 -1 -9 M2 -9 Q6 -12 10 -9" stroke="#C3CAD2" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="-12" cy="-1" r="1.6" fill="#C3CAD2" />
      {/* 소용돌이 무늬 */}
      <path d="M-4 1 q2 -2 4 0 q1 2 -1 2" stroke="#7E8894" strokeWidth="1" fill="none" />
    </g>
  )
}

/** 덜덜 떨림 선 (추위·감기) */
export function Shiver({ t, x, y, h = 30 }: { t: number; x: number; y: number; h?: number }) {
  const o = Math.sin(t * 30) * 1.5
  return <g stroke="#5FB6E0" strokeWidth="1.8" strokeLinecap="round" fill="none">{[-1, 1].map((d) => <path key={d} d={`M${x + d * 22 + o} ${y} q${d * 4} ${h / 6} 0 ${h / 3} q${-d * 4} ${h / 6} 0 ${h / 3}`} />)}</g>
}

/** 지폐가 날개 달고 날아감 (돈 나감) */
export function MoneyFly({ t, t0, x, y, n = 2 }: { t: number; t0: number; x: number; y: number; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = seg(t, t0 + i * 0.35, t0 + i * 0.35 + 1.6)
        if (k <= 0 || k >= 1) return null
        const flap = Math.sin(t * 20) * 0.5 + 0.5
        return (
          <g key={i} transform={`translate(${x + k * 40 + i * 14} ${y - k * 50 + Math.sin(k * 9) * 4})`} opacity={k > 0.75 ? (1 - k) * 4 : 1}>
            <path d={`M-6 -3 Q-14 ${-10 * flap} -16 -2 Q-12 0 -6 0Z M6 -3 Q14 ${-10 * flap} 16 -2 Q12 0 6 0Z`} fill="#fff" stroke={INK} strokeWidth="1.3" />
            <rect x="-9" y="-5" width="18" height="10" rx="2" fill="#9ED48A" stroke={INK} strokeWidth="1.5" />
            <circle r="2.5" fill="#6FAF5A" />
          </g>
        )
      })}
    </g>
  )
}

/** 재채기 바람 (입 앞에서 퍼지는 작은 구름) */
export function Puff({ t, t0, x, y, dir = 1 }: { t: number; t0: number; x: number; y: number; dir?: number }) {
  const k = seg(t, t0, t0 + 0.7)
  if (k <= 0 || k >= 1) return null
  const e = ease.out(k)
  return (
    <g opacity={1 - k}>
      {[0, 1, 2].map((i) => <circle key={i} cx={x + dir * (6 + e * (14 + i * 8))} cy={y + (i - 1) * 6 * e} r={3 + e * 4} fill="#fff" stroke={INK} strokeWidth="1.4" />)}
    </g>
  )
}
