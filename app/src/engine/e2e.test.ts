import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { SECTORS } from './data'
import {
  buyLottery, canAct, choose, createGame, cur, finishMini, repayFriendLoan, requestFriendLoan, roll, scoreOf,
  startSabotage, takeLoan, toggleInsurance, tradeStock, playChance,
} from './game'
import type { GameState } from './types'

// 사람 플레이어가 아무 버튼이나 누르며 처음부터 끝까지 했을 때 멈추거나 숫자가 깨지지 않는지
function humanPlay(seed: number, startAdult: boolean, humans: number) {
  const s = createGame({ humanName: '나', humans, aiCount: 4 - humans, settings: { startAdult, difficulty: 'normal' }, seed })
  let r = seed * 7919
  const rand = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648 }
  let steps = 0
  const check = (g: GameState) => {
    for (const p of g.players) {
      if (!Number.isFinite(p.money) || !Number.isFinite(p.happy)) throw new Error(`숫자 깨짐 seed ${seed}`)
      for (const k of ['int', 'str', 'cha'] as const) if (p.stats[k] < 0 || p.stats[k] > 10) throw new Error(`능력치 범위 seed ${seed}`)
      if (p.pos < 0 || p.pos >= g.stages[g.stageIdx].tiles.length) throw new Error(`위치 오류 seed ${seed}`)
    }
  }
  while (s.phase !== 'gameover' && steps++ < 20000) {
    const pd = s.pending
    if (pd && s.players[pd.playerId].human) {
      const opts = pd.options.filter((o) => !o.disabled)
      choose(s, (opts[Math.floor(rand() * opts.length)] ?? pd.options[0]).id)
    } else if (s.mini) {
      finishMini(s, s.mini.duel ? Math.floor(rand() * 100) : Math.floor(rand() * 3))
    } else if (!pd && cur(s).human && canAct(s)) {
      const p = cur(s)
      const x = rand()
      if (x < 0.08) buyLottery(s)
      else if (x < 0.12) tradeStock(s, SECTORS[Math.floor(rand() * 5)], 1)
      else if (x < 0.14) toggleInsurance(s, 'health')
      else if (x < 0.16) takeLoan(s, 500)
      else if (x < 0.18) requestFriendLoan(s, (p.id + 1) % 4, 500, 1, 5)
      else if (x < 0.19) s.friendLoans.forEach((l, i) => { if (l.borrowerId === p.id) repayFriendLoan(s, i) })
      else if (x < 0.2) startSabotage(s)
      else if (x < 0.21) playChance(s)
      if (canAct(s)) roll(s, 0, rand() < 0.5, p.diceItems.length && rand() < 0.5 ? p.diceItems[0] : null)
    } else {
      aiStep(s)
    }
    check(s)
  }
  return { s, steps }
}

describe('처음부터 끝까지 (사람 플레이어 포함)', () => {
  for (const [label, adult, humans] of [['1살부터 혼자', false, 1], ['성인부터 혼자', true, 1], ['1살부터 한 폰 2명', false, 2], ['성인부터 한 폰 4명', true, 4]] as const) {
    it(label, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const { s, steps } = humanPlay(seed, adult, humans)
        expect(s.phase, `seed ${seed}, ${steps}걸음에서 멈춤 (pending: ${s.pending?.type}, mini: ${s.mini?.game})`).toBe('gameover')
        for (const p of s.players) expect(Number.isFinite(scoreOf(s, p).total)).toBe(true)
      }
    })
  }
})
