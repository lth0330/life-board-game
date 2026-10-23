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
