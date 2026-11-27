// 장면 효과 더: 꽃가루(색종이)·돈 비·삐끗 번개·졸음 Zzz·비바람·꽃잎
import { INK, seg } from './kit'
import { W, H } from './Stage'

const COLORS = ['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A', '#C77FD0', '#F2708A']

/** 색종이가 위에서 흩날림 (축하) */
export function Confetti({ t, t0, n = 26, dur = 3 }: { t: number; t0: number; n?: number; dur?: number }) {
  if (t < t0 || t > t0 + dur + 1.5) return null
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const d = (i * 0.37) % 1.2
        const k = (t - t0 - d) / 1.8
        if (k < 0 || k > 1) return null
        const x = ((i * 53) % W) + Math.sin(k * 8 + i) * 10
        const y = -10 + k * (H + 20)
        return <rect key={i} x={x} y={y} width="5" height="8" rx="1" fill={COLORS[i % 6]} transform={`rotate(${k * 540 + i * 40} ${x + 2} ${y + 4})`} />
      })}
    </g>
  )
}

/** 꽃잎이 흩날림 (결혼·데이트) */
export function Petals({ t, t0 = 0, n = 14 }: { t: number; t0?: number; n?: number }) {
  if (t < t0) return null
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = ((t - t0) * 0.35 + i / n) % 1
        const x = ((i * 71) % W) + Math.sin(k * 6 + i) * 14
        return <ellipse key={i} cx={x} cy={-6 + k * (H + 12)} rx="3.5" ry="2.2" fill={i % 2 ? '#F7B8C8' : '#FFFFFF'} stroke="#E08AA0" strokeWidth="0.8" transform={`rotate(${k * 360 + i * 30} ${x} ${-6 + k * (H + 12)})`} />
      })}
    </g>
  )
}

/** 지폐 비 (복권 당첨) */
export function MoneyRain({ t, t0, n = 16 }: { t: number; t0: number; n?: number }) {
  if (t < t0) return null
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = ((t - t0) * 0.5 + (i * 0.61) % 1) % 1
        const x = ((i * 47) % (W - 20)) + 10 + Math.sin(k * 7 + i) * 8
        const y = -12 + k * (H + 24)
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${Math.sin(k * 9 + i) * 30})`}>
            <rect x="-9" y="-5" width="18" height="10" rx="2" fill="#9ED48A" stroke={INK} strokeWidth="1.3" />
            <circle r="2.5" fill="#6FAF5A" />
          </g>
        )
      })}
    </g>
  )
}

/** '삐끗!' 번개 표시 (허리·무릎) */
export function Zap({ t, t0, t1, x, y }: { t: number; t0: number; t1: number; x: number; y: number }) {
  if (t < t0 || t > t1) return null
  const f = Math.sin(t * 30) > 0 ? 1 : 0.85
  return (
    <g transform={`translate(${x} ${y}) scale(${f})`}>
      <path d="M-3 -14 L5 -3 L0 -2 L6 10 L-5 -1 L0 -2Z" fill="#FFD23F" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-12 -6 l-6 -3 M-12 2 l-7 1 M10 -8 l6 -4 M12 2 l7 0" stroke="#E0533F" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

/** 졸음 Zzz */
export function Zzz({ t, t0, x, y }: { t: number; t0: number; x: number; y: number }) {
  if (t < t0) return null
  return (
    <g fill={INK}>
      {[0, 1, 2].map((i) => {
        const k = ((t - t0) * 0.6 + i / 3) % 1
        return <text key={i} x={x + k * 16 + i * 2} y={y - k * 22} fontSize={9 + i * 3} opacity={Math.sin(k * Math.PI)}>Z</text>
      })}
    </g>
  )
}

/** 비바람 (태풍): 빗줄기 + 바람 선 */
export function Storm({ t, power = 1 }: { t: number; power?: number }) {
  return (
    <g>
      <rect width={W} height={H} fill="#3E4A5C" opacity={0.25 * power} />
      <g stroke="#9FC6E8" strokeWidth="1.6" strokeLinecap="round" opacity={0.8}>
        {Array.from({ length: 40 }, (_, i) => {
          const k = (t * 2.2 + i * 0.13) % 1
          const x = ((i * 37) % (W + 60)) - 20 + k * 40 * power
          return <path key={i} d={`M${x} ${-10 + k * (H + 20)} l${-8 * power} 14`} />
        })}
      </g>
      <g stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.4 * power}>
        {[30, 80, 130].map((y, i) => {
          const k = (t * 1.3 + i * 0.33) % 1
          const x = W - k * (W + 100)
          return <path key={i} d={`M${x} ${y} q20 -6 40 0 t40 0`} />
        })}
      </g>
    </g>
  )
}

/** 번쩍 (사진·번개) */
export function Flash({ t, t0, dur = 0.4, power = 0.6 }: { t: number; t0: number; dur?: number; power?: number }) {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return null
  return <rect width={W} height={H} fill="#fff" opacity={(1 - k) * power} />
}
