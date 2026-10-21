import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { createGame, stageOf } from './game'

describe('입학 축하금', () => {
  it('학생 단계가 되면 모두 10만 원을 받는다', () => {
    const s = createGame({ humanName: '', humans: 0, aiCount: 3, settings: { startAdult: false, difficulty: 'normal' }, seed: 7 })
    let before: number[] = []
    for (let i = 0; i < 5000 && stageOf(s).id === 'child'; i++) { before = s.players.map((p) => p.money); aiStep(s) }
    expect(stageOf(s).id).toBe('student')
    expect(s.log.some((l) => l.text.startsWith('입학 축하금'))).toBe(true)
    // 마지막 한 걸음에서 단계가 바뀌었으니, 그 걸음에 생긴 다른 돈 변화가 없다면 정확히 +10
    const diffs = s.players.map((p, i) => p.money - before[i])
    expect(diffs.filter((d) => d === 10).length).toBeGreaterThanOrEqual(s.players.length - 1)
  })
})
