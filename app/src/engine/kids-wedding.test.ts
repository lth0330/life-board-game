// 어른이 된 자녀의 결혼·손주 (2026-10-29): 다른 플레이어가 축의금을 냄
import { expect, it } from 'vitest'
import { aiStep } from './ai'
import { createGame } from './game'

it('AI끼리 하면 자녀 결혼·손주가 생기고, 손주는 결혼한 자녀만', () => {
  let weds = 0
  let grands = 0
  let gifts = 0
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) aiStep(s)
    for (const p of s.players) {
      for (const k of p.kids) {
        if (k.married) weds++
        if (k.grandkid) { grands++; expect(k.married).toBe(true) }
      }
    }
    gifts += s.log.filter((l) => l.text.includes('축의금 -') || l.text.includes('축하금 -')).length
  }
  expect(weds).toBeGreaterThan(0)
  expect(grands).toBeGreaterThan(0)
  expect(gifts).toBeGreaterThan(0)
}, 120000)
