// 적금·플레이어끼리 돈 빌려주기 (2026-10-29 game.ts에서 나눔)
import type { GameState, Player } from './types'
import { bankLoan, canAct, canBankLoan, changeFortune, cur, isAdultStage, loanLimit, loanTotal, log, rngOf, say, scaleOf, won } from './game'

// ───────── 적금 (2026-10-21) ─────────
// 넣어 두면 매 턴 이자. 언제든 뺄 수 있고, 돈이 마이너스가 되면 차례 시작에 자동으로 꺼내 메움
export function deposit(s: GameState, amount: number) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s) || amount <= 0 || p.money < amount) return
  p.money -= amount
  p.savings = (p.savings ?? 0) + amount
  log(s, p.id, `적금에 ${won(amount)} 넣었다 (모은 돈 ${won(p.savings)})`, 'info')
}
export function withdraw(s: GameState, amount?: number) {
  const p = cur(s)
  const amt = Math.min(p.savings ?? 0, amount ?? Infinity)
  if (!canAct(s) || amt <= 0) return
  p.savings = (p.savings ?? 0) - amt
  p.money += amt
  log(s, p.id, `적금에서 ${won(amt)} 꺼냈다`, 'info')
}

export function takeLoan(s: GameState, amount: number) {
  const p = cur(s)
  if (!canAct(s) || !canBankLoan(s, p) || amount <= 0 || amount > loanLimit(s, p)) return
  bankLoan(s, p, amount)
}

// idx: 갚을 대출 하나 (없으면 기한이 빠른 것부터)
export function repayLoans(s: GameState, amount?: number, idx?: number) {
  const p = cur(s)
  if (!canAct(s)) return
  let budget = Math.min(Math.max(0, p.money), amount ?? Infinity)
  let paid = 0
  const target = idx === undefined ? null : p.loans[idx]
  if (idx !== undefined && !target) return
  p.loans.sort((a, b) => a.dueTurn - b.dueTurn)
  for (const l of target ? [target] : p.loans) {
    const pay = Math.min(budget, l.amount)
    l.amount -= pay
    budget -= pay
    paid += pay
  }
  p.loans = p.loans.filter((l) => l.amount > 0)
  p.money -= paid
  if (paid) log(s, p.id, `대출 ${won(paid)}을 갚았다${p.loans.length ? ` (남은 빚 ${won(loanTotal(p))})` : ' (다 갚았다!)'}`, 'good')
}

// ───────── 플레이어끼리 돈 빌려주기 ─────────

export const LOAN_RATES = [0.05, 0.15, 0.3] // 이자 조금 / 보통 / 많이

export function canBorrowFrom(s: GameState, p: Player, lender: Player) {
  return isAdultStage(s) && lender.id !== p.id && !p.borrowedFrom.includes(lender.id) && p.creditBad <= 0 && lender.money > 0
}

// AI 쪽이 빌려줄지 판단
export function aiLendDecision(s: GameState, lender: Player, borrower: Player, amount: number, rate: number): boolean {
  if (lender.money < amount * 1.3) return false
  const base = { family: 0.65, safe: 0.45, investor: 0.35 + rate, gambler: 0.5, elite: 0.35 }[lender.personality]
  const risk = borrower.money < 0 ? 0.2 : 0
  return rngOf(s).chance(Math.max(0.05, base - risk))
}

export function requestFriendLoan(s: GameState, lenderId: number, amount: number, rateIdx: number, term: number) {
  const p = cur(s)
  const lender = s.players[lenderId]
  if (!canAct(s) || !lender || !canBorrowFrom(s, p, lender)) return
  const rate = LOAN_RATES[rateIdx] ?? LOAN_RATES[1]
  p.borrowedFrom.push(lender.id) // 거절당해도 그 사람에게는 다시 못 부탁함
  if (lender.human && lender.id !== p.id) {
    s.pending = {
      type: 'loanRequest', playerId: lender.id, title: `${p.name}의 돈 부탁`,
      text: `${won(amount)}을 ${term}턴 뒤에 이자 ${Math.round(rate * 100)}% 붙여 갚겠대요. 안 갚으면 소송으로 가요.`,
      options: [{ id: 'yes', label: '빌려준다', disabled: lender.money < amount }, { id: 'no', label: '거절한다' }],
      data: { borrowerId: p.id, amount, rate, term },
    }
    s.phase = 'decision'
    return
  }
  if (aiLendDecision(s, lender, p, amount, rate)) makeFriendLoan(s, p, lender, amount, rate, term)
  else log(s, lender.id, `${p.name}의 돈 부탁을 거절했다`, 'info')
}

export function makeFriendLoan(s: GameState, borrower: Player, lender: Player, amount: number, rate: number, term: number) {
  lender.money -= amount
  lender.record.deeds++ // 친구에게 돈을 빌려주면 선행 (착한 사람 상)
  borrower.money += amount
  s.friendLoans.push({ lenderId: lender.id, borrowerId: borrower.id, principal: amount, owe: Math.round(amount * (1 + rate)), dueTurn: borrower.turnsPlayed + term })
  log(s, borrower.id, `${lender.name}에게 ${won(amount)} 빌렸다 (${term}턴 안에 ${won(amount * (1 + rate))} 갚기)`, 'info')
}

export function repayFriendLoan(s: GameState, idx: number) {
  const p = cur(s)
  const l = s.friendLoans[idx]
  if (!canAct(s) || !l || l.borrowerId !== p.id || p.money < l.owe) return
  const lender = s.players[l.lenderId]
  p.money -= l.owe
  lender.money += l.owe
  changeFortune(s, lender, 1, '친구를 도와줌') // 돈을 빌려줘서 돌려받으면 선행 → 운세↑
  s.friendLoans.splice(idx, 1)
  log(s, p.id, `${lender.name}에게 빌린 돈 ${won(l.owe)}을 갚았다`, 'good')
}

export function friendLoanTick(s: GameState, p: Player) {
  const overdue = s.friendLoans.filter((l) => l.borrowerId === p.id && p.turnsPlayed > l.dueTurn)
  for (const l of overdue) {
    const lender = s.players[l.lenderId]
    l.nag = l.nag === undefined ? 3 : l.nag - 1
    if (l.nag > 0) {
      log(s, p.id, `${lender.name}의 독촉: "${won(l.owe)} 빨리 갚아!" (${l.nag}턴 안에 안 갚으면 소송)`, 'bad')
      if (p.human) s.banner = { title: '빚 독촉', text: `${lender.name}에게 ${won(l.owe)} · ${l.nag}턴 남음`, tone: 'bad' }
      continue
    }
    s.friendLoans.splice(s.friendLoans.indexOf(l), 1)
    lawsuit(s, lender, p, 'loan', l.owe)
  }
}

// 법적 공방: 주사위 + 운세 + 변호사. 빌린 돈 소송은 빌린 사람이 불리
export function lawsuit(s: GameState, plaintiff: Player, defendant: Player, kind: 'loan' | 'card', owe = 0) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  // 변호사 직업이면 +2, 아니면 돈이 있을 때 변호사를 사서 +1
  const lawyer = (q: Player) => {
    if (q.jobId === 'lawyer') return 2
    if (q.money >= sc * 4) { q.money -= sc * 2; log(s, q.id, `변호사를 샀다 (-${won(sc * 2)})`, 'info'); return 1 }
    return 0
  }
  const power = (q: Player) => rng.int(1, 6) + (q.fortune - 2) + lawyer(q)
  const a = power(plaintiff)
  const b = power(defendant) - (kind === 'loan' ? 1 + Math.min(3, Math.floor(owe / 1000)) : 0) // 큰돈일수록 빌린 사람이 질 확률↑
  log(s, null, `[법적 공방] ${plaintiff.name}(${a}) vs ${defendant.name}(${b})`, 'info')
  s.banner = { title: '법적 공방', text: `${plaintiff.name} vs ${defendant.name}`, tone: 'info' }
  if (kind === 'loan') {
    if (a >= b) {
      const pay = Math.round(owe * 1.5)
      defendant.money -= pay
      plaintiff.money += pay
      defendant.creditBad = 8
      log(s, defendant.id, `소송에서 졌다. ${won(pay)}을 물어줬고 신용불량이 됐다`, 'bad')
      say(s, plaintiff, 'lawsuitWin'); say(s, defendant, 'lawsuitLose')
    } else {
      defendant.creditBad = 8 // 소송에서 이겨도 돈을 안 갚은 사실은 남음
      log(s, defendant.id, `소송에서 이겨 빚 ${won(owe)}을 안 갚아도 된다 (대신 신용불량)`, 'info')
      log(s, plaintiff.id, `빌려준 돈을 떼였다…`, 'bad')
      say(s, defendant, 'lawsuitWin'); say(s, plaintiff, 'lawsuitLose')
    }
    return
  }
  if (a > b) {
    defendant.money -= sc * 3
    plaintiff.money += sc * 3
    log(s, plaintiff.id, `소송 승리! ${defendant.name}에게서 ${won(sc * 3)}`, 'good')
  } else {
    plaintiff.money -= sc
    log(s, plaintiff.id, `소송 패배… 소송비 ${won(sc)}`, 'bad')
  }
}
