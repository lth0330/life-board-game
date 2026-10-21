import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { createGame, giveTeammate, scoreOf, teamTotals } from './game'
import { SABOTAGE_NAMES } from './data'

describe('팀전 (2026-10-21)', () => {
  it('2 대 2로 끝까지 가고, 팀 합계는 두 사람 점수의 합', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = createGame({ humanName: '', humans: 0, aiCount: 4, teams: [0, 1, 0, 1], settings: { startAdult: false, difficulty: 'normal' }, seed })
      expect(s.settings.teams).toBe(true)
      let i = 0
      while (s.phase !== 'gameover' && i++ < 20000) aiStep(s)
      expect(s.phase).toBe('gameover')
      const t = teamTotals(s)
      expect(t[0]).toBe(scoreOf(s, s.players[0]).total + scoreOf(s, s.players[2]).total)
      // 방해 카드는 상대 팀에게만
      for (const l of s.log) {
        const m = l.text.match(/^(.+)에게 (.+)!$/)
        if (!m || l.playerId === null || !(Object.values(SABOTAGE_NAMES) as string[]).includes(m[2])) continue
        const target = s.players.find((q) => q.name === m[1])!
        expect(target.team).not.toBe(s.players[l.playerId].team)
      }
    }
  })
  it('2 대 2가 아니면 팀전이 아님, 팀원에게만 돈을 보냄', () => {
    expect(createGame({ humanName: '', humans: 0, aiCount: 4, teams: [0, 0, 0, 1], settings: { startAdult: false, difficulty: 'normal' } }).settings.teams).toBe(false)
    const s = createGame({ humanName: '나', humans: 2, aiCount: 2, teams: [0, 0, 1, 1], settings: { startAdult: true, difficulty: 'normal' }, seed: 5 })
    s.pending = null; s.phase = 'roll'
    const me = s.players[s.current]
    const mate = s.players.find((q) => q.id !== me.id && q.team === me.team)!
    const foe = s.players.find((q) => q.team !== me.team)!
    me.money = 1000
    giveTeammate(s, foe.id, 100)
    expect(me.money).toBe(1000)
    giveTeammate(s, mate.id, 100)
    expect(me.money).toBe(900)
  })
})
