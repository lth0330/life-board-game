// 사업 기회 (2026-10-24): 사업가 차례에 가끔, 하면 돈을 쓰고 판정 주사위
import { expect, it } from 'vitest'
import { aiChoose, aiStep } from './ai'
import { BIZ_EVENTS, BIZ_OPP } from './bizEvents'
import { BUSINESSES, CAFE } from './data'
import { choose, createGame } from './game'

it('모든 업종에 자기 사업 기회가 있다', () => {
  for (const b of [...Object.values(BUSINESSES), CAFE]) expect(BIZ_EVENTS[b.name]?.length, b.name).toBeGreaterThan(0)
})

it('사람 사업가는 고르고 주사위를 직접 굴리고, 돈은 비용만큼 먼저 빠진다', () => {
  const chance0 = BIZ_OPP.chance
  BIZ_OPP.chance = 1 // 시험에서는 매번
  let rolled = 0
  for (let seed = 1; seed <= 40 && rolled < 3; seed++) {
    const s = createGame({ humanName: '나', humans: 2, aiCount: 2, settings: { startAdult: false, difficulty: 'normal' }, seed })
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) {
      const pd = s.pending
      if (pd?.type === 'bizOpp' && s.players[pd.playerId].human) {
        const p = s.players[pd.playerId]
        const { cost } = pd.data as { cost: number }
        if (p.money < cost) { choose(s, 'no'); continue }
        const m = p.money
        choose(s, 'yes')
        expect(s.pending?.type).toBe('diceCheck')
        expect(p.money).toBe(m - cost)
        choose(s, 'roll')
        expect(s.dice).not.toBe(null)
        rolled++
        continue
      }
      if (pd && s.players[pd.playerId].human) { choose(s, aiChoose(s)); continue }
      const p = s.players[s.current]
      if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
    }
  }
  BIZ_OPP.chance = chance0
  expect(rolled).toBeGreaterThan(0)
}, 120000)
