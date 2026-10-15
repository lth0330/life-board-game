import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { createGame, scoreOf } from './game'

function playOut(seed: number, startAdult: boolean) {
  const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult, difficulty: 'normal' }, seed })
  let steps = 0
  while (s.phase !== 'gameover' && steps < 5000) { aiStep(s); steps++ }
  return { s, steps }
}

describe('AI끼리 한 판', () => {
  for (const startAdult of [false, true]) {
    it(`${startAdult ? '성인부터' : '1살부터'} 여러 판이 끝까지 간다`, () => {
      const turns: number[] = []
      for (let seed = 1; seed <= 40; seed++) {
        const { s, steps } = playOut(seed, startAdult)
        expect(s.phase, `seed ${seed} steps ${steps}`).toBe('gameover')
        for (const p of s.players) {
          expect(Number.isFinite(p.money)).toBe(true)
          expect(Number.isFinite(p.happy)).toBe(true)
          expect(Number.isFinite(scoreOf(s, p).total)).toBe(true)
        }
        turns.push(s.turn)
      }
      const avg = turns.reduce((a, b) => a + b, 0) / turns.length
      console.log(startAdult ? '성인부터' : '1살부터', '평균 턴(4인 합계):', avg.toFixed(1), '최대:', Math.max(...turns))
    })
  }

  it('점수 분포 보기', () => {
    const { s } = playOut(7, false)
    for (const p of s.players) {
      const sc = scoreOf(s, p)
      console.log(p.name, p.personality, p.jobId, '자산', sc.assets, '행복', sc.happy, '총점', sc.total, p.spouse ? `배우자 ${p.spouse.name}(${p.spouse.trait})` : '미혼', '자녀', p.children)
    }
  })
})
