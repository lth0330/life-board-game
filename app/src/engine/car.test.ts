import { describe, expect, it } from 'vitest'
import { choose, createGame, cur, roll } from './game'
import type { GameState } from './types'

function readyWithCar(seed: number): GameState {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: true, difficulty: 'normal' }, seed })
  if (s.pending) choose(s, 'work') // 대학 vs 바로 취업
  if (s.pending?.type === 'job') choose(s, 'job:office') // 바로 취업하면 직업 선택 창이 바로 뜸
  const p = cur(s)
  p.car = 2
  p.carCharges = 2
  p.bag = []
  return s
}

describe('자동차 ±1 능력', () => {
  it('던지기 전에 고르면 1번 차감되고, -1/+0/+1을 고른다', () => {
    const s = readyWithCar(3)
    roll(s, 0, true)
    expect(cur(s).carCharges).toBe(1)
    expect(s.pending?.type).toBe('afterRoll')
    const ids = s.pending!.options.map((o) => o.id)
    expect(ids).toContain('keep')
    expect(ids).toContain('plus')
  })

  it('주사위 1이면 -1은 없고 +0, +1만', () => {
    let found = false
    for (let seed = 1; seed < 400 && !found; seed++) {
      const s = readyWithCar(seed)
      roll(s, 0, true)
      if (s.lastRoll === 1) {
        expect(s.pending!.options.map((o) => o.id).sort()).toEqual(['keep', 'plus'])
        found = true
      }
    }
    expect(found).toBe(true)
  })

  it('능력을 안 쓰면 묻지 않고 바로 이동, 횟수 그대로', () => {
    const s = readyWithCar(5)
    const before = cur(s).pos
    roll(s, 0, false)
    expect(s.players[0].carCharges).toBe(2)
    expect(s.pending?.type).not.toBe('afterRoll')
    expect(s.players[0].pos).toBeGreaterThan(before)
  })
})
