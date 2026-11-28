import { expect, it } from 'vitest'
import { createGame } from './game'
import { applyOp, opActor } from './ops'

it('장면 건너뛰기: 주인공만, 키를 게임 상태에 남김', () => {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 3, settings: { startAdult: true, difficulty: 'normal' }, seed: 1 })
  expect(opActor(s, ['skipScene', 'p:3', 2])).toBe(2)
  expect(opActor(s, ['skipScene', 'p:3', 9])).toBe(null)
  applyOp(s, ['skipScene', 'p:3', 0])
  expect(s.sceneSkip).toBe('p:3')
})
