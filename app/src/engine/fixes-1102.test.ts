// 2026-11-02 사용자 피드백: 다시 만나기 카드, '지난 차례 뒤 일어난 일'은 큰 일만
import { expect, it } from 'vitest'
import { applyOp } from './ops'
import { choose, createGame, makeSuitor, openShop, stageOf } from './game'

const youngGame = () => {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: true, difficulty: 'normal' }, seed: 3 })
  s.pending = null
  s.mini = null
  s.phase = 'roll'
  s.current = 0
  return s
}

it('다시 만나기 카드: 만난 사람이 있어야 팔고, 쓰면 호감도가 오르고 카드가 없어진다', () => {
  const s = youngGame()
  expect(stageOf(s).id).toBe('young')
  const p = s.players[0]
  p.money = 5000
  openShop(s, p)
  expect(s.pending!.options.some((o) => o.id === 'reunion')).toBe(false) // 아직 만난 사람이 없음
  const x = makeSuitor(s, p)
  x.affinity = 30
  p.suitors.push(x)
  openShop(s, p)
  choose(s, 'reunion')
  expect(p.reunion).toBe(true)
  s.pending = null
  s.phase = 'roll'
  applyOp(s, ['playReunion'])
  const pd = s.pending as { type: string; options: { id: string }[] } | null
  expect(pd?.type).toBe('reunion')
  choose(s, pd!.options[0].id)
  expect(x.affinity).toBeGreaterThan(30)
  expect(p.reunion).toBe(false)
})

it('나중에 쓰기를 고르면 카드가 남는다', () => {
  const s = youngGame()
  const p = s.players[0]
  const x = makeSuitor(s, p)
  x.affinity = 30
  p.suitors.push(x)
  p.reunion = true
  applyOp(s, ['playReunion'])
  choose(s, 'later')
  expect(p.reunion).toBe(true)
  expect(x.affinity).toBe(30)
})
