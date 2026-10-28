import { useEffect, useState } from 'react'
import { Character } from '../art/Character'
import type { Outfit } from '../engine/outfit'
import { MiniScene } from './MiniGames'
import { WATCHABLE, type MiniView } from './miniView'

// 단계 끝 대회에서 다른 사람이 하는 장면 (2026-10-29 사용자: 내 화면 크게 + 옆에 작게)
// remote: 다른 기기 사람 (받은 장면) · ai: 이 기기에서 흉내 내는 장면 (결과는 이미 정해짐) · local: 이 기기 다음 차례 사람
export interface Watcher {
  id: number; name: string; color: string; outfit: Outfit; age?: number
  kind: 'remote' | 'ai' | 'local'
  view?: MiniView | null // remote
  grade?: number // 끝난 결과 (remote·local은 끝났을 때, ai는 정해진 결과)
  level: number
}

const GRADE = ['아쉬워요', '성공!', '대성공!']

// 같은 값이면 늘 같은 수 (기기마다 AI 장면이 조금 달라도 괜찮지만, 한 화면 안에서는 흔들리지 않게)
function rnd(seed: number, k: number) {
  let x = (seed * 9301 + k * 49297 + 233280) % 2147483647
  x = (x * 16807) % 2147483647
  return (x % 10000) / 10000
}

// AI 흉내: 시작한 지 t초일 때 장면. 결과(grade)에 맞게 끝남
function ghost(game: string, grade: number, t: number, seed: number): { view: MiniView; done: boolean } {
  if (t < 0) return { view: { phase: 'ready' }, done: false }
  if (game === 'tug') {
    // 대성공: 4초 안에 끝까지 / 성공: 늦게 끝까지 / 실패: 6초 끝에 반도 못 감
    const end = grade === 2 ? 3.2 + rnd(seed, 1) * 0.7 : grade === 1 ? 4.6 + rnd(seed, 1) * 1.2 : 6
    const final = grade === 0 ? -30 + rnd(seed, 2) * 70 : 100
    const k = Math.min(1, t / end)
    const wobble = Math.sin(t * 7 + seed) * 5 * (1 - k)
    const pos = Math.max(-100, Math.min(100, final * Math.pow(k, 1.15) + wobble))
    return { view: { phase: t >= end ? 'done' : 'play', pos: Math.round(t >= end ? final : pos), left: Math.max(0, Math.ceil(6 - Math.min(t, end))) }, done: t >= end }
  }
  // 장면이 아직 없는 게임: 몇 초 하는 중이다가 끝
  const end = 4 + rnd(seed, 3) * 5
  return { view: { phase: t >= end ? 'done' : 'play' }, done: t >= end }
}

// startAt: 내가 진짜 시작을 누른 때 (AI는 그때부터 흉내). 내가 이미 끝냈으면 그때부터
export function MiniWatch({ game, people, startAt, seed }: { game: string; people: Watcher[]; startAt: number | null; seed: number }) {
  const [now, setNow] = useState(() => Date.now())
  const ghosting = startAt !== null && people.some((p) => p.kind === 'ai')
  useEffect(() => {
    if (!ghosting) return
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [ghosting])
  if (!people.length) return null
  return (
    <div className="watch">
      {people.map((p) => {
        let view: MiniView | null = null
        let grade: number | undefined
        if (p.kind === 'ai') {
          const delay = 0.4 + rnd(seed + p.id, 5) * 1.2
          const g = startAt === null ? null : ghost(game, p.grade ?? 1, (now - startAt) / 1000 - delay, seed + p.id)
          view = g?.view ?? { phase: 'ready' }
          if (g?.done) grade = p.grade
        } else {
          view = p.view ?? null
          grade = p.grade
        }
        const status = grade !== undefined ? GRADE[grade] ?? '' : p.kind === 'local' ? '차례 기다리는 중' : !view || view.phase === 'ready' ? '준비 중…' : view.practice ? '연습 중…' : '하는 중…'
        const scene = view && view.phase !== 'ready' && WATCHABLE.includes(game) && (view.pos !== undefined || view.left !== undefined)
        return (
          <div key={p.id} className={`watch-card${grade !== undefined ? ` done g${grade}` : ''}`} style={{ borderColor: p.color }}>
            <div className="watch-head">
              <Character outfit={p.outfit} age={p.age} size={20} crop="head" />
              <b>{p.name}</b>
            </div>
            {scene && view ? <div className="watch-scene"><MiniScene game={game} view={view} /></div> : null}
            <span className="watch-status">{status}</span>
          </div>
        )
      })}
    </div>
  )
}
