// 동업 (2026-10-24): 창업하면 다른 사람이 1,000만 투자 = 회사 몫 10%, 수익·매각만 나눔
import { expect, it } from 'vitest'
import { aiChoose, aiStep } from './ai'
import { createGame, choose } from './game'
import { BIZ } from './data'

it('AI끼리 하면 동업이 생기고, 한 사람은 한 회사에 한 번만 투자한다', () => {
  let deals = 0
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) aiStep(s)
    expect(s.phase).toBe('gameover')
    for (const p of s.players) {
      for (const id of p.biz?.investors ?? []) {
        deals++
        expect(id).not.toBe(p.id)
        expect(p.biz!.investors!.filter((x) => x === id).length).toBe(1) // 한 사람은 한 번만
      }
    }
  }
  expect(deals).toBeGreaterThan(0)
}, 120000)

it('사람에게는 투자를 묻고, 투자하면 돈이 창업한 사람에게 간다', () => {
  // 사람 2명이 AI처럼 고르게 하면서 투자 질문이 오면 '투자한다'
  let asked = 0
  for (let seed = 1; seed <= 30 && !asked; seed++) {
    const s = createGame({ humanName: '나', humans: 2, aiCount: 2, settings: { startAdult: false, difficulty: 'normal' }, seed })
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) {
      const pd = s.pending
      if (pd?.type === 'bizInvest') {
        asked++
        const q = s.players[pd.playerId]
        const f = s.players[(pd.data as { founderId: number }).founderId]
        const share0 = q.record.bizShare ?? 0
        choose(s, 'yes') // 고른 뒤 창업한 사람 차례가 이어져서 돈은 더 바뀔 수 있음 → 투자 기록으로 확인
        expect(q.record.bizShare).toBe(share0 - BIZ.invest)
        expect(f.biz?.investors).toContain(q.id)
        continue
      }
      if (pd && s.players[pd.playerId].human) { choose(s, aiChoose(s)); continue }
      const p = s.players[s.current]
      if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
    }
  }
  expect(asked).toBeGreaterThan(0)
}, 120000)
