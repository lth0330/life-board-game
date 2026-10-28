// 단계 끝 대회 (2026-10-29): 어린이·학생·청년·중년이 끝날 때 모두 같은 미니게임, 1·2등 보상
import { expect, it } from 'vitest'
import { aiChoose, aiStep } from './ai'
import { choose, createGame, finishMini } from './game'

it('단계가 끝날 때마다 대회를 하고, 끝나면 다음 단계로 간다', () => {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 3, settings: { startAdult: false, difficulty: 'normal' }, seed: 7 })
  const seen: string[] = []
  let n = 0
  while (s.phase !== 'gameover' && n++ < 8000) {
    if (s.mini?.contest) {
      const stage = s.stageIdx
      seen.push(s.stages[stage].id)
      expect(s.mini.playerId).toBe(0)
      finishMini(s, 2) // 대성공이면 1등
      expect(s.stageIdx).toBe(stage + 1)
      expect(s.mini?.contest).toBeFalsy()
      expect(s.popup?.text).toContain('나: 1등!')
      continue
    }
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini && s.players[s.mini.playerId].human) { finishMini(s, 1); continue }
    const p = s.players[s.current]
    if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
  }
  expect(s.phase).toBe('gameover')
  expect(seen).toEqual(['child', 'student', 'young', 'middle'])
}, 60000)

it('사람이 여럿이면 차례대로 하고, 모두 실패하면 상이 없다', () => {
  const s = createGame({ humanName: '나', humans: 2, aiCount: 0, settings: { startAdult: false, difficulty: 'normal' }, seed: 3 })
  let n = 0
  while (!s.mini?.contest && n++ < 4000) {
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini) { finishMini(s, 1); continue }
    const p = s.players[s.current]
    p.human = false; aiStep(s); p.human = true
  }
  expect(s.mini?.playerId).toBe(0)
  finishMini(s, 0)
  expect(s.mini?.contest).toBeTruthy()
  expect(s.mini?.playerId).toBe(1)
  expect(s.stageIdx).toBe(0)
  finishMini(s, 0)
  expect(s.stageIdx).toBe(1)
  expect(s.popup?.text).toContain('상이 없어요')
})
