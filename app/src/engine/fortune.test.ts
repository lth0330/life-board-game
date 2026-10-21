import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { changeFortune, choose, createGame } from './game'

const newGame = () => createGame({ humanName: '나', aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed: 3 })

describe('운세 (2026-10-21)', () => {
  it('모두 평에서 시작하고, 행동이 쌓여야 바뀐다 (평→길 2번, 길→대길 3번, 내려갈 때도 같게)', () => {
    const s = createGame({ humanName: '', humans: 0, aiCount: 2, settings: { startAdult: false, difficulty: 'normal' }, seed: 3 })
    expect(s.players.every((p) => p.fortune === 2)).toBe(true)
    const p = s.players[1]
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(2)
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(3) // 길
    changeFortune(s, p, 1, '시험'); changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(3)
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(4) // 대길
    changeFortune(s, p, 1, '시험')
    expect(p.fortune).toBe(4)
    changeFortune(s, p, -1, '시험')
    expect(p.fortune).toBe(3) // 대길에서는 한 번에 내려옴 (포인트가 5에서 4로)
    for (let i = 0; i < 9; i++) changeFortune(s, p, -1, "시험")
    expect(p.fortune).toBe(0) // 대흉
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
    expect(p.luckPts).toBe(1)
    s.pending = { type: 'special', playerId: p.id, title: '', text: '', options: [], data: { ev: 'snack' } }
    choose(s, 'mine')
    expect(p.luckPts).toBe(0)
  })
})

describe('아이돌 은퇴 (2026-10-21)', () => {
  it('중년이 되면 아이돌은 은퇴하고, 배우·유튜버로 가면 아이돌 등급에서 한 단계 아래부터', async () => {
    const { stageOf } = await import('./game')
    let checked = 0
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame({ humanName: '', humans: 0, aiCount: 2, settings: { startAdult: true, difficulty: 'normal' }, seed })
      const p = s.players[0]
      let i = 0
      while (stageOf(s).id !== 'middle' && i++ < 8000) { if (stageOf(s).id === 'young') { p.jobId = 'idol'; p.jobRank = 2; p.biz = null } aiStep(s) }
      expect(stageOf(s).id).toBe('middle')
      expect(p.jobId).not.toBe('idol')
      while (p.exIdol != null && i++ < 9000) aiStep(s)
      expect(p.exIdol ?? null).toBeNull()
      if (p.jobId === 'actor' || p.jobId === 'youtuber') { expect(p.jobRank).toBeGreaterThanOrEqual(1); checked++ } // 톱스타 → 2단계 (그 뒤 승진으로 3단계일 수도)
    }
    expect(checked).toBeGreaterThan(0)
  })
})
