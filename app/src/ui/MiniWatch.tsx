import { useEffect, useState } from 'react'
import { Character } from '../art/Character'
import type { Outfit } from '../engine/outfit'
import { MiniScene } from './MiniScenes'
import { WATCHABLE, type MiniView } from './miniView'

// 단계 끝 대회에서 다른 사람이 하는 장면 (2026-10-29 사용자: 내 화면 크게 + 옆에 작게)
// remote: 다른 기기 사람 (받은 장면) · ai: 이 기기에서 흉내 내는 장면 (결과는 이미 정해짐) · local: 이 기기 다음 차례 사람
export interface Watcher {
  id: number; name: string; color: string; outfit: Outfit; age?: number
  kind: 'remote' | 'ai' | 'local'
  view?: MiniView | null // remote
  grade?: number // 끝난 결과 (remote·local은 끝났을 때, ai는 정해진 결과)
  level: number
  ready?: boolean // '준비 완료'를 눌렀나 (AI는 늘)
  go?: boolean // 모두 준비돼서 시작함
}

const GRADE = ['아쉬워요', '성공!', '대성공!']

// 같은 값이면 늘 같은 수 (기기마다 AI 장면이 조금 달라도 괜찮지만, 한 화면 안에서는 흔들리지 않게)
function rnd(seed: number, k: number) {
  let x = (seed * 9301 + k * 49297 + 233280) % 2147483647
  x = (x * 16807) % 2147483647
  return (x % 10000) / 10000
}

// AI 흉내: 시작한 지 t초일 때 장면. 결과(grade)에 맞게 끝남. level은 그 AI의 난이도 (내 화면 게임과 같은 숫자)
type Ghost = { view: MiniView; done: boolean }
const play = (v: Omit<MiniView, 'phase'>, done: boolean): Ghost => ({ view: { phase: done ? 'done' : 'play', ...v }, done })
const MEMORY_ICONS = ['apple', 'star', 'heart', 'fish', 'umbrella', 'crown']
const CITY_ICONS = ['eiffel', 'liberty', 'pyramid', 'moai', 'castle', 'ferris']
const POSES = ['up', 'out', 'left', 'right']
const PACK_ICONS = ['passport', 'toothbrush', 'charger', 'shirt', 'sunscreen', 'piano', 'plant', 'sofa', 'bike', 'watermelon']
// 같은 seed로 섞기 (한 화면 안에서는 늘 같은 순서)
const shuffled = <T,>(xs: T[], r: (k: number) => number, at: number) => xs.map((x, i) => ({ x, k: r(at + i) })).sort((a, b) => a.k - b.k).map((c) => c.x)

function ghost(game: string, grade: number, t: number, seed: number, level: number): Ghost {
  if (t < 0) return { view: { phase: 'ready' }, done: false }
  const r = (k: number) => rnd(seed, k)
  const L = Math.max(0, Math.min(2, level))
  switch (game) {
    case 'flower': {
      const speed = [0.55, 0.75, 0.95][L]
      const bloomN = grade === 2 ? 5 : grade === 1 ? 3 + Math.floor(r(1) * 2) : Math.floor(r(1) * 3)
      const tries = grade === 2 ? 5 + Math.floor(r(2) * 3) : 7
      const gap = 1.1 + r(3) * 0.4 // 누르는 사이
      const k = Math.min(tries, Math.floor(t / gap))
      const okAt = shuffled(Array.from({ length: tries }, (_, i) => i < bloomN), r, 20) // 몇 번째 물 주기가 맞았나
      const order = shuffled([0, 1, 2, 3, 4], r, 40)
      const got = okAt.slice(0, k).filter(Boolean).length
      const marks = [0, 1, 2, 3, 4].map((p) => (order.indexOf(p) < got ? 1 : 0))
      return play({ pos: Math.round(50 + Math.sin(t * speed * Math.PI * 2 + seed) * 46), marks, n: k, m: 7 }, t >= tries * gap + 0.5)
    }
    case 'melon': {
      const target = 12 + Math.floor(r(1) * 77)
      const start = target > 50 ? 4 : 96
      const miss = grade === 2 ? r(2) * 3 : grade === 1 ? 4 + r(2) * 5 : 11 + r(2) * 15
      const final = Math.max(0, Math.min(100, target + (r(3) < 0.5 ? -miss : miss)))
      const T = 4 + r(4) * 6 // 내리치는 때
      const k = Math.min(1, t / T)
      return play({ pos: Math.round(start + (final - start) * k + (k < 1 ? Math.sin(t * 5) * 3 : 0)), target, ok: t >= T ? grade >= 1 : null, left: Math.max(0, Math.ceil(12 - t)) }, t >= T + 0.9)
    }
    case 'leaves':
    case 'butterfly': {
      const fly = game === 'butterfly'
      const goal = [8, 10, 12][L]
      const fall = [2.6, 2.1, 1.7][L]
      const final = grade === 2 ? goal + 3 + Math.floor(r(1) * 2) : grade === 1 ? goal + Math.floor(r(1) * 3) : Math.floor(goal * (0.4 + r(1) * 0.45))
      const count = Math.floor((8 - 0.6) / 0.42)
      // 잡은 낙엽은 떨어지는 중간에 사라짐
      const caught = new Set(shuffled(Array.from({ length: count }, (_, i) => i), r, 30).slice(0, final))
      const xs: number[] = []
      const ys: number[] = []
      for (let i = 0; i < count; i++) {
        const at = i * 0.42
        const k = (t - at) / fall
        if (k < 0 || k >= 1 || (caught.has(i) && k > 0.3 + r(50 + i) * 0.4)) continue
        if (fly) { xs.push(Math.round(k * 100)); ys.push(Math.round(8 + r(80 + i) * 62)) } else { xs.push(Math.round(6 + r(80 + i) * 82)); ys.push(Math.round(k * 100)) }
      }
      const n = [...caught].filter((i) => (t - i * 0.42) / fall > 0.3 + r(50 + i) * 0.4).length
      return play({ n: Math.min(n, final), m: goal, left: Math.max(0, Math.ceil(8 - t)), xs, ys }, t >= 8)
    }
    case 'snowball':
    case 'watergun': {
      const up = [1.3, 1.05, 0.85][L] // 내 화면 게임(Snowball)과 같게 (2026-11-02)
      const gap = 0.35
      const goal = [5, 6, 7][L]
      const hitsTotal = grade === 2 ? Math.min(10, goal + 2 + Math.floor(r(1) * 2)) : grade === 1 ? goal + Math.floor(r(1) * 2) : Math.floor(r(1) * goal)
      const hitAt = shuffled(Array.from({ length: 10 }, (_, i) => i < hitsTotal), r, 40)
      const i = Math.floor(t / (up + gap))
      const into = t - i * (up + gap)
      const slot = Math.floor(r(60 + i) * 6)
      const hitNow = i < 10 && hitAt[i] && into >= gap + up * 0.5 // 맞히면 반쯤에서 숨음
      const pos = i < 10 && into >= gap && !hitNow ? slot : -1
      const right = hitAt.slice(0, Math.min(i, 10)).filter(Boolean).length + (hitNow ? 1 : 0)
      return play({ pos, right, n: Math.min(i, 10), m: 10 }, t >= 10 * (up + gap) + 0.3)
    }
    case 'timing': {
      // grade는 점수(0~100). 바늘이 몇 번 오가다가 그 점수 자리에서 멈춤
      const zone = [25, 17, 10][L]
      const speed = [1.0, 1.4, 1.8][L]
      const at = 1.2 + r(1) * 2.2
      const side = r(2) < 0.5 ? -1 : 1
      const stopAt = 50 + side * (100 - grade) / 2
      if (t < at) return play({ pos: Math.round(50 + Math.sin(t * speed * Math.PI + r(3) * 6) * 50), zone }, false)
      return play({ pos: Math.round(stopAt), zone, right: grade }, t >= at + 0.6)
    }
    case 'tug': {
      // 대성공: 4초 안에 끝까지 / 성공: 늦게 끝까지 / 실패: 6초 끝에 반도 못 감
      const end = grade === 2 ? 3.2 + r(1) * 0.7 : grade === 1 ? 4.6 + r(1) * 1.2 : 6
      const final = grade === 0 ? -30 + r(2) * 70 : 100
      const k = Math.min(1, t / end)
      const pos = Math.max(-100, Math.min(100, final * Math.pow(k, 1.15) + Math.sin(t * 7 + seed) * 5 * (1 - k)))
      return play({ pos: Math.round(t >= end ? final : pos), left: Math.max(0, Math.ceil(6 - Math.min(t, end))) }, t >= end)
    }
    case 'race': {
      const goal = [20, 28, 36][L]
      const final = grade === 2 ? goal + 1 + Math.floor(r(1) * 5) : grade === 1 ? Math.ceil(goal * (0.72 + r(1) * 0.25)) : Math.floor(goal * (0.35 + r(1) * 0.3))
      return play({ n: Math.min(final, Math.floor((final * t) / 5)), m: goal, left: Math.max(0, Math.ceil(5 - t)) }, t >= 5)
    }
    case 'throw': {
      const w = [20, 13, 8][L]
      const target = 55 + Math.floor(r(1) * 25)
      const speed = [0.8, 1.1, 1.4][L]
      const at = 1.6 + r(2) * 1.5 // 손을 떼는 때
      const c = target + w / 2
      const off = grade === 2 ? r(3) * (w / 4) : grade === 1 ? w / 4 + 0.5 + r(3) * (w / 4 - 0.5) : w / 2 + 3 + r(3) * 15
      const final = Math.max(0, Math.min(100, c + (r(4) < 0.5 ? -off : off)))
      if (t < 0.4) return play({ pos: 0, target, zone: w, n: 0 }, false)
      if (t < at) return play({ pos: Math.round(Math.abs(Math.sin(((t - 0.4) * speed * Math.PI) / 2)) * 100), target, zone: w, n: 1 }, false)
      return play({ pos: Math.round(final), target, zone: w, n: 2 }, t >= at + 0.6)
    }
    case 'memory':
    case 'photo': {
      const len = [4, 5, 6][L]
      const pool = game === 'photo' ? CITY_ICONS : MEMORY_ICONS
      const seq = Array.from({ length: len }, (_, i) => pool[Math.floor(r(10 + i) * pool.length)])
      const wrong = grade === 2 ? 0 : grade === 1 ? 1 : Math.ceil(len / 2) + 1
      const picks = seq.map((x, i) => (i < len - wrong ? x : pool[(pool.indexOf(x) + 1) % pool.length]))
      const showFor = 1.2 + len * 0.5
      if (t < showFor) return play({ show: true, seq, m: len }, false)
      const k = Math.min(len, Math.floor((t - showFor) / 0.8))
      return play({ show: false, seq: picks.slice(0, k), m: len }, t >= showFor + len * 0.8 + 0.6)
    }
    case 'dance': {
      const len = [5, 6, 7][L]
      const seq = Array.from({ length: len }, (_, i) => POSES[Math.floor(r(10 + i) * 4)])
      const wrong = grade === 2 ? 0 : grade === 1 ? 1 : 2 + Math.floor(r(2) * 2)
      const picks = seq.map((x, i) => (i < len - wrong ? x : POSES[(POSES.indexOf(x) + 1) % 4]))
      const showFor = len * 0.7
      if (t < showFor) { const i = Math.floor(t / 0.7); return play({ show: true, seq: [seq[i]], n: i, m: len }, false) }
      const k = Math.min(len, Math.floor((t - showFor) / 0.6))
      return play({ show: false, seq: picks.slice(0, k), n: len, m: len }, t >= showFor + len * 0.6 + 0.4)
    }
    case 'pairs': {
      const n = [3, 4, 6][L]
      const icons = MEMORY_ICONS.slice(0, n)
      const deck = shuffled([...icons, ...icons], r, 20)
      const goal = grade === 0 ? n - 1 : n // 실패면 한 쌍을 못 찾음
      const T = grade === 2 ? 6 + r(1) * 3 : grade === 1 ? 11 + r(1) * 5 : 17
      const step = Math.floor(t) // 1초에 한 번 두 장을 뒤집음
      const matchAt = icons.slice(0, goal).map((_, j) => Math.max(1, Math.round(((j + 1) * T) / n)))
      const found: number[] = []
      icons.slice(0, goal).forEach((x, j) => { if (step > matchAt[j] || (step === matchAt[j] && t - step >= 0.5)) deck.forEach((y, i) => { if (y === x) found.push(i) }) })
      let open: number[] = []
      if (t - step < 0.5) {
        const j = matchAt.indexOf(step)
        if (j >= 0) open = deck.flatMap((y, i) => (y === icons[j] ? [i] : []))
        else {
          const rest = deck.map((_, i) => i).filter((i) => !found.includes(i))
          const a = rest[Math.floor(r(40 + step) * rest.length)]
          const others = rest.filter((i) => deck[i] !== deck[a])
          const b = others[Math.floor(r(60 + step) * others.length)]
          open = [a, b].filter((x) => x !== undefined)
        }
      }
      const end = grade === 0 ? 18 : Math.max(...matchAt) + 0.6
      return play({ seq: deck, open, found, left: Math.max(0, Math.ceil(18 - t)) }, t >= end)
    }
    case 'quickmath': {
      const max = [10, 30, 70][L]
      const limit = [12, 10, 8][L]
      const gap = grade === 0 ? 2 + r(1) * 0.6 : 1.2 + r(1) * 0.5
      const rightTotal = grade === 2 ? 5 : grade === 1 ? 3 + Math.floor(r(2) * 2) : Math.floor(r(2) * 3)
      const n = Math.min(5, Math.floor(t / gap))
      const q = Math.min(n, 4)
      const a = 1 + Math.floor(r(30 + q) * max)
      const b = 1 + Math.floor(r(50 + q) * max)
      const end = Math.min(limit, 5 * gap)
      return play({ n, m: 5, right: t >= end ? rightTotal : Math.min(n, rightTotal), left: Math.max(0, Math.ceil(limit - t)), item: a + ' + ' + b }, t >= end)
    }
    case 'rhythm': {
      const fall = [1.6, 1.25, 1][L]
      let h = fall + 0.6
      const hits = Array.from({ length: 4 }, (_, i) => (h += 0.7 + r(10 + i) * 0.5))
      const want = grade === 2 ? [2, 2, 1, 2] : grade === 1 ? [1, 2, 0, 1] : [0, 1, 0, 0]
      const marks = hits.map((x, i) => (t >= x ? want[i] : null))
      const ys = hits.map((x, i) => { const y = ((t - (x - fall)) / fall) * 85; return marks[i] !== null || y < -10 || y > 100 ? -1 : Math.round(y) })
      return play({ marks, ys }, t >= hits[3] + 0.5)
    }
    case 'snap': {
      const zone = [24, 17, 12][L]
      const speed = [0.6, 0.85, 1.1][L]
      const spots = shuffled(CITY_ICONS, r, 20).slice(0, 3)
      const okCount = grade === 2 ? 3 : grade === 1 ? 2 : Math.floor(r(1) * 2)
      const okAt = shuffled([0, 1, 2].map((i) => i < okCount), r, 70)
      const shotT = [1.6, 3.6, 5.6].map((x, i) => x + r(8 + i) * 0.6)
      const shots = shotT.filter((x) => t >= x).map((_, i) => (okAt[i] ? 1 : 0))
      const last = shots.length - 1
      const flash = last >= 0 && t < shotT[last] + 0.7
      const pos = flash
        ? (okAt[last] ? 50 + (r(30 + last) - 0.5) * zone * 0.6 : r(30 + last) < 0.5 ? 50 - zone / 2 - 8 : 50 + zone / 2 + 8)
        : 50 + Math.sin(t * speed * Math.PI + seed) * 46
      return play({ pos: Math.round(pos), zone, marks: shots, item: spots[Math.max(0, Math.min(flash ? last : shots.length, 2))] }, t >= shotT[2] + 0.7)
    }
    case 'pack': {
      const total = 8
      const right = grade === 2 ? 8 : grade === 1 ? 6 + Math.floor(r(1) * 2) : 3 + Math.floor(r(1) * 3)
      const okAt = shuffled(Array.from({ length: total }, (_, i) => i < right), r, 80)
      const each = 1.1 + r(2) * 0.4
      const i = Math.min(total - 1, Math.floor(t / each))
      const decided = t - i * each >= each - 0.35 || t >= total * each
      const sofar = okAt.slice(0, i).filter(Boolean).length + (decided && okAt[i] ? 1 : 0)
      return play({ item: PACK_ICONS[Math.floor(r(40 + i) * PACK_ICONS.length)], n: i, m: total, right: sofar, ok: decided ? okAt[i] : null }, t >= total * each)
    }
  }
  // 장면이 없는 게임: 몇 초 하는 중이다가 끝
  return play({}, t >= 4 + r(3) * 5)
}

// startAt: 내가 진짜 시작을 누른 때 (AI는 그때부터 흉내). 내가 이미 끝냈으면 그때부터
// duel: 같은 칸 대결이면 grade 자리에 점수(0~100)
export function MiniWatch({ game, people, startAt, seed, duel = false }: { game: string; people: Watcher[]; startAt: number | null; seed: number; duel?: boolean }) {
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
          const g = startAt === null ? null : ghost(game, p.grade ?? 1, (now - startAt) / 1000 - delay, seed + p.id, p.level)
          view = g?.view ?? { phase: 'ready' }
          if (g?.done) grade = p.grade
        } else {
          view = p.view ?? null
          grade = p.grade
        }
        const status = grade !== undefined ? (duel ? `${grade}점` : GRADE[grade] ?? '')
          : !p.go ? (p.ready ? '✅ 준비 완료' : view?.phase === 'help' ? '📖 설명서 보는 중' : view?.practice ? '🔁 연습 중' : '준비 중…')
          : p.kind === 'local' ? '차례 기다리는 중' : !view || view.phase !== 'play' ? '시작!' : '하는 중…'
        const scene = p.go && view && view.phase !== 'ready' && view.phase !== 'help' && !view.practice && WATCHABLE.includes(game) && Object.keys(view).some((k) => k !== 'phase' && k !== 'practice' && k !== 'k')
        return (
          <div key={p.id} className={`watch-card${grade !== undefined ? ` done g${duel ? (grade >= 80 ? 2 : grade >= 50 ? 1 : 0) : grade}` : ''}`} style={{ borderColor: p.color }}>
            <div className="watch-head">
              <Character outfit={p.outfit} age={p.age} size={20} crop="head" />
              <b>{p.name}</b>
            </div>
            {scene && view ? <div className="watch-scene"><MiniScene game={game} view={view} outfit={p.outfit} age={p.age} /></div> : null}
            <span className="watch-status">{status}</span>
          </div>
        )
      })}
    </div>
  )
}
