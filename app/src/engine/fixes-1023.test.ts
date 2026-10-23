// 2026-10-23 점검에서 고친 것: 노년 야근·세금 카드, 집 없는데 주택담보대출만 남는 것
import { expect, it } from 'vitest'
import { aiStep } from './ai'
import { createGame, stageOf } from './game'

it('노년엔 야근·세금 카드가 안 나오고, 집 없이 주택담보대출만 남지 않는다', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) {
      if (stageOf(s).id === 'old') expect(['overtime', 'taxEvade']).not.toContain(s.pending?.type)
      aiStep(s)
      for (const p of s.players) if (!p.house) expect(p.loans.some((l) => l.kind === '주담대'), `seed ${seed} ${p.name}`).toBe(false)
    }
  }
}, 30000)

it('미니게임 하던 사람이 나가 AI가 되면 AI가 미니게임을 끝낸다', () => {
  const s = createGame({ humanName: '나', humans: 2, aiCount: 0, settings: { startAdult: false, difficulty: 'normal', online: true }, seed: 5 })
  s.pending = null
  s.mini = { game: 'race', playerId: 0, level: 1 }
  s.phase = 'mini'
  s.players[0].human = false // 손님이 나감
  aiStep(s)
  expect(s.mini).toBe(null)
  s.mini = { game: 'timing', playerId: 0, level: 1, duel: { ids: [0, 1], results: { 1: 50 }, queue: [] } }
  aiStep(s)
  expect(s.mini).toBe(null)
})
