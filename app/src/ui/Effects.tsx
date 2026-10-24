import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PIPS } from '../art/pips'

// 연출 모음. 기본 버전 — 아트 단계에서 다듬는다 (docs/12-art.md)

const FACES: [number, string][] = [
  [1, 'translateZ(28px)'], [6, 'rotateY(180deg) translateZ(28px)'], [3, 'rotateY(90deg) translateZ(28px)'],
  [4, 'rotateY(-90deg) translateZ(28px)'], [2, 'rotateX(90deg) translateZ(28px)'], [5, 'rotateX(-90deg) translateZ(28px)'],
]

const PIP_IDX = Array.from({ length: 9 }, (_, i) => i)
// 각 면이 위(화면 쪽)로 오게 하는 회전 [X, Y]
const TOP: Record<number, [number, number]> = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] }

export const DICE_THROW_MS = 750
const TWIN_GAP = 34 // 쌍둥이 주사위: 가운데에서 좌우로

// 튀는 높이(px): [시간 비율, 높이] 조각을 이어 붙임
const HOPS: [number, number][] = [[0.4, 110], [0.27, 44], [0.18, 14]]
function hopAt(t: number) {
  let at = 0
  for (const [len, h] of HOPS) {
    if (t <= at + len) { const u = (t - at) / len; return 4 * h * u * (1 - u) }
    at += len
  }
  return 0
}
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// 주사위: 굴리는 동안 내 캐릭터 옆에서 손에 쥐고 흔들다가, 결과가 나오면 판 위로 던져져
// 튀며 굴러가 멈춤 (2026-10-24 사용자: 견본 A '내가 던지기'). value가 없으면 아직 손에 있음
// second: 쌍둥이 주사위의 두 번째 (undefined면 주사위 1개, null이면 아직 손에)
// 폰 브라우저가 3D 주사위를 못 그리는 일 때문에 주사위를 감싼 칸은 transform 대신 left·top으로 옮김
export function DiceThrow({ value, second }: { value: number | null; second?: number | null }) {
  const twin = second !== undefined
  const faces = twin ? [value, second ?? null] : [value]
  const done = faces.every((v) => v !== null)
  const total = done ? faces.reduce<number>((a, v) => a + (v ?? 0), 0) : null
  const box = useRef<HTMLDivElement>(null)
  const flights = useRef<(HTMLDivElement | null)[]>([])
  const cubes = useRef<(HTMLDivElement | null)[]>([])
  const shadows = useRef<(HTMLDivElement | null)[]>([])
  // 시작: 판 위 지금 차례 캐릭터 오른쪽 발밑(바닥), lift는 손 높이 (못 찾으면 화면 가운데 아래)
  const [from, setFrom] = useState<{ x: number; y: number; lift: number } | null>(null)
  const [to, setTo] = useState<{ x: number; y: number } | null>(null)
  const [landed, setLanded] = useState(false)
  // 손에 쥐고 있는 동안은 캐릭터를 따라감 (판이 움직이는 중일 수 있음)
  const measure = useCallback(() => {
    const el = box.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const c = el.parentElement?.querySelector('.char[data-focus]')?.getBoundingClientRect()
    const x = c && c.width ? c.right - r.left + 24 : r.width / 2
    const y = c && c.height ? c.bottom - r.top - 6 : r.height * 0.66
    const lift = c && c.height ? Math.min(70, c.height * 0.4) : 40
    const next = { x: Math.round(Math.max(70, Math.min(r.width - 70, x))), y: Math.round(Math.max(160, Math.min(r.height - 90, y))), lift: Math.round(lift) }
    setFrom((f) => (f && f.x === next.x && f.y === next.y && f.lift === next.lift ? f : next))
  }, [])
  useLayoutEffect(measure, [measure])
  useEffect(() => {
    if (done) return
    let raf = 0
    const loop = () => { measure(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [done, measure])
  useEffect(() => {
    if (!done || !from || !box.current) return // from은 손에 쥐고 있던 마지막 자리
    const h = box.current.clientHeight, w = box.current.clientWidth
    // 판 안쪽(화면 위쪽)으로 던짐
    const end = { x: Math.max(80, Math.min(w - 80, from.x + 10 + Math.random() * 50)), y: Math.max(140, from.y - h * 0.15) }
    setTo(end)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let raf = 0
    const draw = (t: number) => {
      const e = easeOut(t), spin = 1 - e
      faces.forEach((v, i) => {
        const dx = twin ? (i ? TWIN_GAP : -TWIN_GAP) : 0
        const x = from.x + dx + (end.x - from.x) * e, y = from.y + (end.y - from.y) * e
        const z = hopAt(t) + from.lift * Math.max(0, 1 - t / HOPS[0][0]) // 손 높이에서 첫 바닥까지 내려옴
        const f = flights.current[i], c = cubes.current[i], sh = shadows.current[i]
        if (f) { f.style.left = `${x}px`; f.style.top = `${y - z}px` }
        if (sh) { sh.style.left = `${x}px`; sh.style.top = `${y}px`; sh.style.opacity = String(Math.max(0.35, 1 - z / 160)) }
        const [rx, ry] = TOP[v ?? 1]
        if (c) c.style.transform = `rotateX(${rx - (720 + i * 180) * spin}deg) rotateY(${ry + 360 * spin}deg)`
      })
    }
    const step = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - t0) / DICE_THROW_MS)
      draw(t)
      if (t < 1) raf = requestAnimationFrame(step)
      else setLanded(true)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [done, !!from]) // eslint-disable-line react-hooks/exhaustive-deps -- 던진 뒤엔 자리를 다시 재지 않음
  return (
    <div ref={box} className="dice-throw" aria-live="polite" aria-label={landed && total ? `주사위 ${total}` : '주사위 굴러가는 중'}>
      {from && faces.map((_, i) => {
        const left = from.x + (twin ? (i ? TWIN_GAP : -TWIN_GAP) : 0)
        return [
          <div key={`s${i}`} ref={(el) => { shadows.current[i] = el }} className={`dice-shadow${done ? '' : ' holding'}`} style={{ left, top: from.y }} />,
          <div key={`f${i}`} ref={(el) => { flights.current[i] = el }} className={`dice-flight${done ? '' : ' holding'}`} style={{ left, top: from.y - from.lift }}>
            <div className="cube-wrap">
              <div ref={(el) => { cubes.current[i] = el }} className={`cube${done ? '' : ' tumbling'}`}>
                {FACES.map(([n, t]) => (
                  <div key={n} className="cube-face" style={{ transform: t }}>
                    {PIP_IDX.map((k) => <i key={k} className={PIPS[n].includes(k) ? (n === 1 ? 'pip red' : 'pip') : ''} />)}
                  </div>
                ))}
              </div>
            </div>
          </div>,
        ]
      })}
      {landed && total && to && <div className="dice-number jua" style={{ left: to.x, top: to.y - 150 }}>{total}</div>}
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
