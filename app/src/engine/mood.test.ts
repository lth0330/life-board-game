import { describe, expect, it } from 'vitest'
import { createGame, moodLevel, moodOf } from './game'

describe('기분', () => {
  it('최근 5턴 행복 변화로 정함 (+22 신남, +12 좋음, 0~+11 보통, -1~-3 우울, -4 지침)', () => {
    const p = createGame({ humanName: '나', aiCount: 1, settings: { startAdult: false, difficulty: 'normal' } }).players[0]
    p.happy = 20
    p.happyHist = [20, 22, 25]
    expect(moodOf(p)).toBe(0)
    expect(moodLevel(p)).toBe(2)
    for (const [h, lv] of [[42, 4], [32, 3], [31, 2], [20, 2], [19, 1], [17, 1], [16, 0]] as const) {
      p.happy = h
      expect(moodLevel(p)).toBe(lv)
    }
    p.happyHist = undefined
    expect(moodLevel(p)).toBe(2) // 기록이 없으면 보통
  })
})
