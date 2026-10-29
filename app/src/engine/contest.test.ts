// 단계 끝 대회 (2026-10-29): 어린이·학생·청년·중년이 끝날 때 모두 같은 미니게임, 1·2등 보상
import { expect, it } from 'vitest'
import { aiChoose, aiStep } from './ai'
import { aiFinishMini, choose, contestReady, createGame, finishMini } from './game'
import { opActor } from './ops'

it('단계가 끝날 때마다 대회를 하고, 끝나면 다음 단계로 간다', () => {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 3, settings: { startAdult: false, difficulty: 'normal' }, seed: 7 })
  const seen: string[] = []
  let n = 0
  while (s.phase !== 'gameover' && n++ < 8000) {
    if (s.mini?.contest && !s.mini.duel) {
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
  while (!(s.mini?.contest && !s.mini.duel) && n++ < 4000) {
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini) { finishMini(s, 1, s.mini.contest?.queue[0]); continue }
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

it('사람이 여럿이면 동시에: 누가 먼저 끝내도 되고, 끝낸 사람은 다시 못 보냄', () => {
  const s = createGame({ humanName: '나', humans: 3, aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed: 5 })
  let n = 0
  while (!(s.mini?.contest && !s.mini.duel) && n++ < 4000) {
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini) { finishMini(s, 1, s.mini.contest?.queue[0]); continue }
    const p = s.players[s.current]
    if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
  }
  expect(s.mini?.contest?.queue).toEqual([0, 1, 2])
  expect(opActor(s, ['finishMini', 2, 2])).toBe(2)
  expect(opActor(s, ['finishMini', 2, 3])).toBe(null) // AI는 이미 결과가 있음
  finishMini(s, 2, 2)
  expect(s.mini?.contest?.queue).toEqual([0, 1])
  expect(opActor(s, ['finishMini', 0, 2])).toBe(null)
  finishMini(s, 0, 2) // 두 번 보내도 무시
  expect(s.mini?.contest?.results[2]).toBe(2)
  finishMini(s, 1, 0)
  s.players[1].human = false // 온라인에서 나감 → AI가 끝냄
  aiFinishMini(s)
  expect(s.mini?.contest).toBeFalsy()
  expect(s.stageIdx).toBe(1)
})

it("'준비 완료'를 모두 눌러야 go, 끝낸 사람·없는 사람은 무시", () => {
  const s = createGame({ humanName: '나', humans: 2, aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed: 9 })
  let n = 0
  while (!(s.mini?.contest && !s.mini.duel) && n++ < 4000) {
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini) { finishMini(s, 1, s.mini.contest?.queue[0]); continue }
    const p = s.players[s.current]
    if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
  }
  expect(opActor(s, ['contestReady', 2])).toBe(null)
  contestReady(s, 0)
  contestReady(s, 2)
  expect(s.mini?.contest?.go).toBeFalsy()
  contestReady(s, 1)
  expect(s.mini?.contest?.go).toBe(true)
})
