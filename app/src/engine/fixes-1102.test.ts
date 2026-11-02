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
  expect(p.bag).toContain('reunion')
  s.pending = null
  s.phase = 'roll'
  applyOp(s, ['playReunion'])
  const pd = s.pending as { type: string; options: { id: string }[] } | null
  expect(pd?.type).toBe('reunion')
  choose(s, pd!.options[0].id)
  expect(x.affinity).toBeGreaterThan(30)
  expect(p.bag).not.toContain('reunion')
})

it('나중에 쓰기를 고르면 카드가 남는다', () => {
  const s = youngGame()
  const p = s.players[0]
  const x = makeSuitor(s, p)
  x.affinity = 30
  p.suitors.push(x)
  p.bag = ['reunion']
  applyOp(s, ['playReunion'])
  choose(s, 'later')
  expect(p.bag).toContain('reunion')
  expect(x.affinity).toBe(30)
})

it('직업 미니게임: 결과에 따라 업무 칸 보너스가 0.5·1.5·2배', async () => {
  const { startMini, finishMini, JOB_GAME } = await import('./game')
  const s = youngGame()
  const p = s.players[0]
  p.jobId = 'office'
  expect(JOB_GAME.office).toBe('jStamp')
  for (const [grade, mult] of [[0, 0.5], [1, 1.5], [2, 2]] as const) {
    const before = p.money
    startMini(s, p, 'jStamp', undefined, undefined, 300)
    expect(s.mini?.pay).toBe(300)
    finishMini(s, grade)
    expect(p.money - before).toBe(300 * mult)
  }
})

it('💼 업무 칸은 청년·중년 판에만 있다', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed })
    for (const st of s.stages) {
      const n = st.tiles.filter((t) => t.kind === 'work').length
      if (st.id === 'young' || st.id === 'middle') expect(n, `${seed} ${st.id}`).toBeGreaterThan(0)
      else expect(n, st.id).toBe(0)
    }
  }
})

it('가방: 카드·주사위 아이템을 합쳐 3칸, 꽉 차면 버릴 것을 고름', async () => {
  const { giveChance, openShop, fixOldBag } = await import('./game')
  const s = youngGame()
  const p = s.players[0]
  p.money = 5000
  p.bag = ['even', 'rumor', 'twin']
  giveChance(s, p, 'charm')
  expect(s.pending?.type).toBe('bagFull')
  choose(s, 'drop1') // 소문 퍼뜨리기를 버림
  expect(p.bag).toEqual(['even', 'twin', 'charm'])
  // 상점: 사기 전에 버릴 것을 고르고, 산 뒤에 버리고 넣음
  s.pending = null; s.phase = 'roll'
  openShop(s, p)
  choose(s, 'dice_odd')
  expect((s.pending as { type: string } | null)?.type).toBe('shopDiscard')
  const before = p.money
  choose(s, 'drop0')
  expect(p.bag).toEqual(['twin', 'charm', 'odd'])
  expect(before - p.money).toBe(60)
  // 예전 저장: 따로 있던 카드·아이템을 가방으로
  const old = { ...p, bag: undefined, chance: 'coupon', sabotage: 'love', reunion: true, diceItems: ['even'] } as unknown as typeof p
  fixOldBag(old)
  expect(old.bag).toEqual(['coupon', 'love', 'reunion'])
})
