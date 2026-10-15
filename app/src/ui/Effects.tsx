import { useMemo } from 'react'
import { PIPS } from '../art/Art'

// 연출 모음. 기본 버전 — 아트 단계에서 다듬는다 (docs/12-art.md)

const FACE_ROT: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(-90deg)',
  3: 'rotateY(-90deg)',
  4: 'rotateY(90deg)',
  5: 'rotateX(90deg)',
  6: 'rotateY(180deg)',
}
const FACES: [number, string][] = [
  [1, 'translateZ(36px)'], [6, 'rotateY(180deg) translateZ(36px)'], [3, 'rotateY(90deg) translateZ(36px)'],
  [4, 'rotateY(-90deg) translateZ(36px)'], [2, 'rotateX(90deg) translateZ(36px)'], [5, 'rotateX(-90deg) translateZ(36px)'],
]

function Cube({ value, offset }: { value: number | null; offset: number }) {
  return (
    <div className={`dice-flight ${value ? 'landed' : ''}`} style={{ marginLeft: offset }}>
      <div className="dice-shadow" />
      <div className="cube-wrap">
        <div className={`cube ${value ? '' : 'tumbling'}`} style={value ? { transform: FACE_ROT[value] } : undefined}>
          {FACES.map(([n, t]) => (
            <div key={n} className="cube-face" style={{ transform: t }}>
              {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[n].includes(i) ? (n === 1 ? 'pip red' : 'pip') : ''} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 주사위가 보드 위로 던져져 굴러가다 멈춤. value가 없으면 계속 구르는 중
// second: 쌍둥이 주사위의 두 번째 (undefined면 주사위 1개, null이면 구르는 중)
export function DiceThrow({ value, second }: { value: number | null; second?: number | null }) {
  const twin = second !== undefined
  const total = value && twin ? (second ? value + second : null) : value
  return (
    <div className="dice-throw" aria-live="polite" aria-label={total ? `주사위 ${total}` : '주사위 굴러가는 중'}>
      <Cube value={value} offset={twin ? -84 : -36} />
      {twin && <Cube value={second ?? null} offset={12} />}
      {total && <div className="dice-number jua">{total}</div>}
    </div>
  )
}

const CONFETTI_COLORS = ['#C2452D', '#F2C230', '#2F8F5B', '#2E6FD8', '#F3A3C0', '#6F45BD']

export function Confetti() {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.2 + Math.random() * 0.9,
    rot: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: 6 + Math.random() * 6,
  })), [])
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, background: b.color, width: b.w, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  )
}

export function StageCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="stage-card" role="status">
      <div className="stage-card-inner">
        <span className="muted">새로운 인생 단계</span>
        <b className="jua">{title}</b>
        <span>{text}</span>
      </div>
    </div>
  )
}
