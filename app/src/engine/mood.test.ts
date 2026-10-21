import { describe, expect, it } from 'vitest'
import { createGame, moodLevel, moodOf } from './game'

describe('기분', () => {
  it('최근 5턴 행복 변화로 정함 (+12 이상 기쁨, 0~+11 보통, 마이너스 우울)', () => {
    const p = createGame({ humanName: '나', aiCount: 1, settings: { startAdult: false, difficulty: 'normal' } }).players[0]
    p.happy = 20
    p.happyHist = [20, 22, 25]
    expect(moodOf(p)).toBe(0)
    expect(moodLevel(p)).toBe(1)
    for (const [h, lv] of [[42, 2], [32, 2], [31, 1], [20, 1], [19, 0], [10, 0]] as const) {
      p.happy = h
      expect(moodLevel(p)).toBe(lv)
    }
    p.happyHist = undefined
    expect(moodLevel(p)).toBe(1) // 기록이 없으면 보통
  })
})
