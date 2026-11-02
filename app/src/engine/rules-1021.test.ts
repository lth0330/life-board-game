// 2026-10-21 사용자 피드백 규칙: 상점 여러 개 사기, 쿠폰 묻기, 대출 한도·중복·고르기, 차 능력 횟수
import { describe, expect, it } from 'vitest'
import { canBankLoan, carChargesAt, choose, createGame, cur, loanCap, repayLoans, takeLoan } from './game'
import type { GameState } from './types'

function adult(seed = 3): GameState {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: true, difficulty: 'normal' }, seed })
  if (s.pending) choose(s, 'work')
  if (s.pending?.type === 'job') choose(s, 'job:office')
  s.pending = null
  return s
}
const shop = (s: GameState) => { s.pending = { type: 'shop', playerId: cur(s).id, title: '상점', text: '', options: [] } }

describe('상점 (2026-10-21)', () => {
  it('집·차는 하나만, 다른 물건은 계속 살 수 있다', () => {
    const s = adult()
    const p = cur(s)
    p.money = 10000
    p.bag = []
    shop(s)
    choose(s, 'car1')
    expect(p.car).toBe(1)
    expect(s.pending?.type).toBe('shop')
    const ids = s.pending!.options.map((o) => o.id)
    expect(ids.some((id) => /^(house|car|mortgage)\d/.test(id))).toBe(false)
    choose(s, 'pet')
    choose(s, 'dice_twin')
    expect(s.pending?.type).toBe('shop')
    expect(p.pet?.alive).toBe(true)
    choose(s, 'pass')
    expect(s.pending).toBeNull()
  })

  it('쿠폰이 있으면 집·차를 살 때 쓸지 묻고, 안 쓰면 쿠폰이 남는다', () => {
    const s = adult()
    const p = cur(s)
    p.money = 10000
    p.bag = ['coupon']
    shop(s)
    choose(s, 'car1')
    expect(s.pending?.type).toBe('shopCoupon')
    choose(s, 'keep')
    expect(p.car).toBe(1)
    expect(p.bag).toEqual(['coupon'])
    expect(p.money).toBe(10000 - 300)
  })
})

describe('대출 (2026-10-21)', () => {
  it('한도는 500만 + 집·차·주식 값의 절반, 일반 대출은 다 갚아야 다시 빌린다', () => {
    const s = adult()
    const p = cur(s)
    p.carValue = 1000
    expect(loanCap(s, p)).toBe(3000) // 청년은 재산이 없어도 3,000만
    p.carValue = 8000
    expect(loanCap(s, p)).toBe(500 + 4000)
    p.carValue = 1000
    takeLoan(s, 1000)
    expect(p.loans.filter((l) => l.kind === '일반')).toHaveLength(1)
    expect(canBankLoan(s, p)).toBe(false)
    takeLoan(s, 500)
    expect(p.loans.filter((l) => l.kind === '일반')).toHaveLength(1)
  })

  it('대출이 2개면 고른 대출만 갚는다', () => {
    const s = adult()
    const p = cur(s)
    p.loans = [{ amount: 300, dueTurn: 5, kind: '학자금' }, { amount: 500, dueTurn: 9, kind: '일반' }]
    p.money = 1000
    repayLoans(s, undefined, 1)
    expect(p.loans).toEqual([{ amount: 300, dueTurn: 5, kind: '학자금' }])
    expect(p.money).toBe(500)
  })
})

describe('차 능력 횟수 (2026-10-21)', () => {
  it('산 단계에는 첫 숫자, 다음 단계부터 1씩 늘어난다', () => {
    const s = adult()
    const p = cur(s)
    p.car = 1
    p.carStage = 3 // 중년에 산 스쿠터
    expect(carChargesAt(p, 3)).toBe(1)
    expect(carChargesAt(p, 4)).toBe(2)
    p.carStage = 2 // 청년에 산 스쿠터
    expect(carChargesAt(p, 3)).toBe(2)
    expect(carChargesAt(p, 4)).toBe(3)
  })
})

describe('대학 지원 순서 (2026-10-21)', () => {
  it('수능 주사위를 먼저 굴리고, 그다음 합격 룰렛. 학자금은 0·500·800만', () => {
    let passed = 0
    for (let seed = 1; seed <= 30; seed++) {
      const s = adult(seed)
      const p = cur(s)
      p.loans = []
      p.college = false
      const wheel = s.roulette?.id ?? 0
      s.pending = { type: 'adultStart', playerId: p.id, title: '', text: '', options: [] }
      choose(s, 'uni:int')
      expect(s.pending?.type).toBe('diceCheck')
      expect(s.roulette?.id ?? 0).toBe(wheel) // 아직 룰렛 안 돌림
      choose(s, 'roll')
      expect(s.roulette!.id).toBe(wheel + 1)
      if (p.college) {
        passed++
        const loan = p.loans.find((l) => l.kind === '학자금')?.amount ?? 0
        expect([0, 500, 800]).toContain(loan)
      } else expect(s.pending?.type).toBe('uniFail')
    }
    expect(passed).toBeGreaterThan(0)
  })
})

describe('결과 창 (2026-10-22)', () => {
  it('사람이 고른 결과는 기록에만 남지 않고 결과 창(popup)으로도 뜬다', () => {
    const s = adult(5)
    const p = cur(s)
    const before = s.popup?.id ?? 0
    s.pending = { type: 'wallet', playerId: p.id, title: '양심 선택: 주운 지갑', text: '', options: [], data: { sc: 60 } }
    choose(s, 'return')
    expect(s.popup?.id).toBe(before + 1)
    expect(s.popup?.title).toBe('양심 선택: 주운 지갑')
    expect(s.popup?.text).toContain('사례금')
  })
})
