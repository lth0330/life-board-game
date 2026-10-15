import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { choose, createGame, cur, roll } from './game'
import type { GameState } from './types'

const newGame = (seed: number, startAdult = false) =>
  createGame({ humanName: '나', humans: 0, aiCount: 4, settings: { startAdult, difficulty: 'normal' }, seed })

function playOut(s: GameState) {
  let n = 0
  while (s.phase !== 'gameover' && n++ < 6000) aiStep(s)
  return s
}

function readyHuman(seed: number): GameState {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: true, difficulty: 'normal' }, seed })
  if (s.pending) choose(s, 'work')
  if (s.pending?.type === 'job') choose(s, 'job:office') // 바로 취업하면 직업 선택 창이 바로 뜸
  const p = cur(s)
  p.car = 2
  p.carCharges = 2
  p.chance = null
  return s
}

describe('주사위 아이템', () => {
  it('쌍둥이는 2~12, 짝수는 짝수만, 홀수는 홀수만 나오고 1번 쓰면 사라진다', () => {
    const seen = { twin: new Set<number>(), even: new Set<number>(), odd: new Set<number>() }
    for (let seed = 1; seed < 300; seed++) {
      for (const item of ['twin', 'even', 'odd'] as const) {
        const s = readyHuman(seed)
        cur(s).diceItems = [item]
        roll(s, 0, false, item)
        seen[item].add(s.dice!.value + (s.dice!.second ?? 0)) // 차례가 끝나면 lastRoll은 지워지므로 주사위 기록으로
        expect(cur(s).diceItems.length, item).toBe(0)
      }
    }
    expect([...seen.twin].every((v) => v >= 2 && v <= 12)).toBe(true)
    expect(seen.twin.size).toBeGreaterThan(8)
    expect([...seen.even].sort()).toEqual([2, 4, 6])
    expect([...seen.odd].sort()).toEqual([1, 3, 5])
  })

  it('주사위 아이템을 쓰면 자동차 ±1은 쓰이지 않는다', () => {
    const s = readyHuman(5)
    cur(s).diceItems = ['even']
    roll(s, 0, true, 'even')
    expect(cur(s).carCharges).toBe(2)
    expect(s.pending?.type).not.toBe('afterRoll')
  })

  it('없는 아이템은 쓸 수 없고 보통 주사위로 굴린다', () => {
    const s = readyHuman(7)
    roll(s, 0, false, 'twin')
    expect(s.dice!.second).toBeUndefined()
    expect(s.dice!.value).toBeLessThanOrEqual(6)
  })
})

describe('자녀', () => {
  it('AI 판에서 자녀가 어른이 되어 판정을 받고, 용돈을 준다', () => {
    const results = [0, 0, 0]
    const adopted = [0, 0, 0]
    const edu = [0, 0, 0]
    let items = 0
    let itemUse = 0
    for (let seed = 1; seed <= 80; seed++) {
      const s = playOut(newGame(seed, seed % 3 === 0))
      expect(s.phase).toBe('gameover')
      for (const p of s.players) {
        for (const k of p.kids) {
          expect(k.result, '끝날 때는 모든 자녀가 어른').not.toBeNull()
          if (k.result === null) continue
          ;(k.adopted ? adopted : results)[k.result]++
          edu[k.edu ?? 0]++
        }
      }
      items += s.log.filter((l) => /주사위를 샀다/.test(l.text)).length
      itemUse += s.log.filter((l) => /^(쌍둥이|짝수|홀수) 주사위 /.test(l.text)).length
    }
    console.log('친자녀 판정 [잘 안 풀림, 보통, 크게 성공]:', results, '입양:', adopted, '교육 [안 함, 보통, 많이]:', edu)
    console.log('주사위 아이템 구매(기록 200줄 기준):', items, '사용:', itemUse)
    expect(results.reduce((a, b) => a + b)).toBeGreaterThan(0)
  })
})
