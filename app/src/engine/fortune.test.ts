import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { changeFortune, choose, createGame, FORTUNE_DRIFT } from './game'

const newGame = () => createGame({ humanName: '나', aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed: 3 })

describe('운세 (2026-10-21)', () => {
  it('모두 평에서 시작하고, 행동으로만 바뀌며, 시간이 지나면 평 쪽으로 돌아온다', () => {
    const s = createGame({ humanName: '', humans: 0, aiCount: 2, settings: { startAdult: false, difficulty: 'normal' }, seed: 3 })
    expect(s.players.every((p) => p.fortune === 2)).toBe(true)
    const p = s.players[1]
    changeFortune(s, p, 1, '시험')
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(4)
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(4) // 대길이 끝
    p.fortuneTurns = FORTUNE_DRIFT - 1
    // 차례가 한 번 더 시작되면 한 칸 내려옴
    const before = p.fortune
    let guard = 0
    const turn0 = p.turnsPlayed
    while (p.turnsPlayed === turn0 && guard++ < 2000) aiStep(s)
    expect(p.fortune).toBe(before - 1)
  })

  it('판정이 있는 특별 이벤트는 사람이 주사위를 직접 굴린다', () => {
    const s = newGame()
    const p = s.players[0]
    s.pending = { type: 'special', playerId: p.id, title: '장기자랑', text: '', options: [], data: { ev: 'talent' } }
    s.phase = 'decision'
    choose(s, 'sing')
    expect(s.pending?.type).toBe('diceCheck')
    const id = s.dice?.id ?? 0
    choose(s, 'roll')
    expect(s.dice?.id).toBe(id + 1)
    expect(s.banner?.title.startsWith('장기자랑')).toBe(true)
  })

  it('착한 선택은 운세 ↑, 이기적인 선택은 운세 ↓', () => {
    const s = newGame()
    const p = s.players[0]
    s.pending = { type: 'special', playerId: p.id, title: '', text: '', options: [], data: { ev: 'snack' } }
    choose(s, 'share')
    expect(p.fortune).toBe(3)
    s.pending = { type: 'special', playerId: p.id, title: '', text: '', options: [], data: { ev: 'snack' } }
    choose(s, 'mine')
    choose(s, 'mine')
    expect(p.fortune).toBe(2)
  })
})
