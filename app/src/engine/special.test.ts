import { describe, expect, it } from 'vitest'
import { SPECIALS, specialDesc, specialValue } from './special'
import { aiStep } from './ai'
import { createGame } from './game'

describe('특별 이벤트', () => {
  it('모든 선택지에 설명이 있고, 공짜 선택지가 하나씩 있음 (돈이 없어도 고를 수 있게)', () => {
    for (const list of Object.values(SPECIALS)) for (const ev of list!) {
      for (const o of ev.options) expect(specialDesc(o, 60, (n) => `${n}만`).length).toBeGreaterThan(0)
      expect(ev.options.some((o) => !o.cost)).toBe(true)
    }
  })
  it('AI 기대 점수: 능력치가 10이면 올리는 값은 0으로 봄', () => {
    const o = { id: 'x', label: 'x', stats: { int: 1 } }
    expect(specialValue(o, 60, () => 5)).toBe(3)
    expect(specialValue(o, 60, () => 10)).toBe(0)
  })
  it('AI끼리 여러 판에서 특별 이벤트가 나오고 끝까지 감', () => {
    let seen = 0
    for (let seed = 1; seed <= 20; seed++) {
      const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
      let steps = 0
      while (s.phase !== 'gameover' && steps < 6000) { aiStep(s); steps++ }
      expect(s.phase).toBe('gameover')
      seen += s.log.filter((l) => /^\[(장기자랑|학원 고르기|수학여행|전학 온 친구|시험 기간|해외 연수|번지점프|운동 결심|건강검진|동창회|취미 배우기)\]/.test(l.text)).length
    }
    expect(seen).toBeGreaterThan(0)
  })
})
