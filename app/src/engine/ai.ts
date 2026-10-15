import { CARS, HOUSES, JOBS, SECTORS } from './data'
import {
  aiWantsCar, buyLottery, canAct, canBorrowFrom, choose, cur, cureAddiction, isAdultStage, loanLimit, loanTotal, repayFriendLoan,
  repayLoans, requestFriendLoan, roll, rngOf, salaryOf, scoreOf, stageOf, startSabotage, stockHint, takeLoan, toggleInsurance,
  tradeStock, useChance,
} from './game'
import type { GameState, Pending, Player } from './types'

// 규칙 기반 AI. 사람과 같은 정보만 본다 (미래 뉴스는 운세 힌트로만)

const jobValue = (id: string, p: Player): number => {
  const j = JOBS.find((x) => x.id === id)
  if (!j) return 0
  let v = j.salary
  switch (p.personality) {
    case 'safe': if (j.pension) v *= 1.6; if (j.boom) v *= 0.4; break
    case 'family': if (j.id === 'teacher' || j.pension) v *= 1.4; break
    case 'gambler': if (j.boom) v *= 1.8; break
    case 'elite': if (j.college) v *= 1.3; break
    case 'investor': break
  }
  return v
}

function optionScore(s: GameState, p: Player, pd: Pending, id: string): number {
  const rng = rngOf(s)
  const per = p.personality
  switch (pd.type) {
    case 'academy': return id === 'study' ? (per === 'elite' ? 3 : 1) : per === 'family' ? 3 : 1.5
    case 'club': return p.stats[id as 'int'] < 4 ? 1 : 0.5 + (per === 'elite' && id === 'int' ? 2 : 0) + (per === 'gambler' && id === 'cha' ? 1 : 0)
    case 'adultStart': return id === 'college' ? (per === 'elite' ? 3 : per === 'gambler' ? 0.5 : 1.5) : 1
    case 'fork': {
      const st = stageOf(s)
      const tile = st.tiles[(pd.data as { tile: number }).tile]
      const road = tile.fork?.options.find((o) => String(o.to) === id)?.road
      switch (road) {
        case 'academy': return per === 'elite' ? 3 : per === 'family' ? 1 : 1.5
        case 'play': return per === 'family' || per === 'gambler' ? 2.5 : 1.4
        case 'college': return per === 'elite' ? 3 : per === 'gambler' ? 0.5 : 1.5
        case 'work': return per === 'investor' ? 2 : 1
        case 'startup': return per === 'gambler' || per === 'investor' || p.jobId === 'chef' ? 3 : !p.jobId ? 2 : 0.6
        case 'company': return 1.5
        case 'city': return per === 'gambler' || per === 'investor' ? 3 : 1
        case 'country': return 2
        case 'event': {
          const casino = st.id === 'middle'
          if (casino) return per === 'gambler' ? 3 : per === 'safe' ? 0.3 : p.fortune >= 4 ? 2 : 0.8
          return 1.3
        }
        default: return 1
      }
    }
    case 'collegeStat': {
      const k = id as 'int' | 'str' | 'cha'
      return 10 - p.stats[k] + (per === 'elite' && k === 'int' ? 3 : 0)
    }
    case 'job':
    case 'careerChange': {
      if (id === 'stay') return p.jobId ? jobValue(p.jobId, p) * 1.05 : 0
      if (id === 'jobless') return 1
      if (id === 'ceo') return per === 'gambler' || per === 'investor' ? 500 : p.jobId === 'chef' ? 450 : 50
      return jobValue(id.slice(4), p)
    }
    case 'middleBranch': return id === 'adopt' ? (per === 'family' ? 5 : 2) : id === 'pet' ? (per === 'family' ? 4 : 2.5) : per === 'investor' ? 3 : 1
    case 'retire': return id === 'city' ? (per === 'gambler' || per === 'investor' ? 3 : 1) : 2
    case 'shop': {
      if (id === 'pass') return per === 'safe' || per === 'investor' ? 2 : 1
      if (id.startsWith('house')) { const i = +id.slice(5); return p.money > HOUSES[i].price * 1.5 ? 3 + i : 0 }
      if (id.startsWith('car')) { const i = +id.slice(3); return p.money > CARS[i].price * 2 ? 2.5 + i * 0.5 : 0 }
      if (id === 'chance') return 0.5
      if (id.startsWith('agency')) {
        const want = !p.spouse && p.suitors.every((x) => x.affinity < 50)
        if (!want) return 0
        const vip = id === 'agency1'
        return per === 'family' ? (vip ? 1.5 : 2.6) : per === 'elite' ? (vip && p.money > 3000 ? 2.8 : 1.2) : vip ? 0.5 : 1.1
      }
      return 0
    }
    case 'date': {
      const o = pd.options.find((x) => x.id === id)
      if (!o?.desc) return 0
      const grade = (o.desc.match(/★/g) ?? []).length
      const [looks, wealth, fame, kind] = o.desc.match(/\d+/g)?.map(Number) ?? []
      let v = grade + (per === 'family' ? kind * 1.5 : per === 'elite' ? fame + wealth : per === 'investor' ? wealth * 1.5 : looks + kind)
      if (id.startsWith('old')) v += 6 // 이미 아는 사람과 호감 쌓기
      return v
    }
    case 'marriage': {
      if (id === 'single') return per === 'investor' ? 3 : 0.5
      const o = pd.options.find((x) => x.id === id)
      const aff = Number(o?.label.match(/(\d+)%/)?.[1] ?? 0)
      return aff / 10
    }
    case 'wedding': return per === 'gambler' ? (id === '3' ? 3 : 1) : per === 'safe' || per === 'investor' ? (id === '1' ? 3 : 1) : id === '2' ? 3 : 1
    case 'baby': return id === 'yes' ? (per === 'family' ? 5 : per === 'investor' ? 0.5 : 2) : 1.5
    case 'invest': return id === 'yes' ? (p.fortune >= 3 ? 3 : per === 'gambler' ? 2 : 0.5) : 1
    case 'overtime': return id === 'yes' ? (per === 'investor' || per === 'elite' ? 2 : 1) : per === 'family' ? 2 : 1
    case 'taxEvade': return id === 'yes' ? (per === 'gambler' ? 3 : p.fortune >= 4 ? 2 : 0.2) : 1
    case 'cardSwap': return id === 'new' ? rng.next() : 0.5
    case 'agencyAttr': {
      const want = { family: 'kindness', elite: 'fame', investor: 'wealth', gambler: 'looks', safe: 'kindness' }[per]
      return id === want ? 2 : 0.5
    }
    case 'agency': {
      if (id === 'quit') return p.money < 0 ? 3 : 0
      if (id === 'skip') return 0.3
      if (id.startsWith('old')) { const aff = Number(pd.options.find((o) => o.id === id)?.label.match(/(\d+)%/)?.[1] ?? 0); return aff >= 50 ? 1.5 : 1.8 }
      return p.suitors.length < 2 ? 2.5 : 1
    }
    case 'agencyMatch': return id === 'yes' ? (p.money > 600 ? 2 : 0.5) : 1
    case 'rps': return rng.next()
    case 'loanRequest': return id === 'yes' ? 1 : 1.2
    case 'sabotageTarget': {
      const q = s.players[+id]
      return scoreOf(s, q).total - q.fortune * 10
    }
    case 'afterRoll': return id === 'keep' ? 1 : 0
    default: return 0
  }
}

export function aiChoose(s: GameState): string {
  const pd = s.pending!
  const p = s.players[pd.playerId]
  const rng = rngOf(s)
  const opts = pd.options.filter((o) => !o.disabled)
  if (!opts.length) return pd.options[0].id
  if (s.settings.difficulty === 'easy' && rng.chance(0.25)) return rng.pick(opts).id
  let best = opts[0]
  let bestScore = -Infinity
  for (const o of opts) {
    const v = optionScore(s, p, pd, o.id) + (s.settings.difficulty === 'hard' ? 0 : rng.next() * 0.3)
    if (v > bestScore) { bestScore = v; best = o }
  }
  return best.id
}

// 주사위 던지기 전에 할 일 (재테크·카드). 한 번에 다 하고 끝
export function aiPreRoll(s: GameState) {
  const p = cur(s)
  const rng = rngOf(s)
  const per = p.personality
  if (p.chance === 'charm' && p.fortune <= 1) useChance(s)
  if (p.sabotage && isAdultStage(s) && rng.chance(per === 'gambler' ? 0.6 : s.settings.difficulty === 'hard' ? 0.4 : 0.15)) {
    startSabotage(s)
    if (s.pending) choose(s, aiChoose(s))
  }
  if (!isAdultStage(s) || !canAct(s)) return
  if (p.lottery.addicted && p.money > 600 && (per !== 'gambler' || rng.chance(0.3))) cureAddiction(s)
  const lotteryChance = { gambler: 0.85, investor: 0.15, elite: 0.05, family: 0.08, safe: 0.02 }[per]
  if (p.money > 50 && rng.chance(lotteryChance)) buyLottery(s)
  // 보험
  const wantIns = per === 'safe' ? 1 : per === 'family' ? 0.7 : 0.3
  if (p.money > 300) {
    if (!p.insurance.health && rng.chance(wantIns)) toggleInsurance(s, 'health')
    if (p.house && !p.insurance.property && rng.chance(wantIns)) toggleInsurance(s, 'property')
    if (p.car && !p.insurance.car && rng.chance(wantIns)) toggleInsurance(s, 'car')
  }
  // 주식: 힌트를 따르고, 재테크형은 적극적으로
  const hint = stockHint(s, p)
  const n = s.nextNews
  if (hint && n && p.fortune >= 4) {
    if (p.fortune === 5 && !n.up && p.stocks[n.sector] > 0) tradeStock(s, n.sector, -p.stocks[n.sector])
    if ((p.fortune === 5 && n.up) || (p.fortune === 4 && per === 'investor')) {
      const qty = Math.floor((p.money * 0.4) / s.stockPrice[n.sector])
      if (qty > 0) tradeStock(s, n.sector, qty)
    }
  }
  if (per === 'investor' && p.money > 1500 && rng.chance(0.4)) {
    const k = rng.pick(SECTORS)
    const qty = Math.floor((p.money * 0.25) / s.stockPrice[k])
    if (qty > 0) tradeStock(s, k, qty)
  }
  if ((per === 'investor' || per === 'elite') && rng.chance(0.25)) {
    for (const k of SECTORS) if (p.stocks[k] && s.stockPrice[k] > 130) tradeStock(s, k, -p.stocks[k])
  }
  // 대출: 마이너스면 메우고, 여유 있으면 갚기
  if (p.money < 0 && !p.creditBad) {
    const need = Math.min(-p.money + 200, loanLimit(p) - loanTotal(p))
    if (need > 0) takeLoan(s, Math.round(need))
  }
  if (p.loans.length && p.money > loanTotal(p) + salaryOf(p) * 3) repayLoans(s)
  // 친구 돈: 여유 있으면 갚고, 은행이 막히면 친구에게 부탁
  s.friendLoans.forEach((l, i) => { if (l.borrowerId === p.id && p.money > l.owe * 2) repayFriendLoan(s, i) })
  if (p.money < 0 && (p.creditBad > 0 || loanTotal(p) >= loanLimit(p) - 200)) {
    const lender = [...s.players].sort((a, b) => b.money - a.money).find((q) => canBorrowFrom(s, p, q))
    if (lender && canAct(s)) requestFriendLoan(s, lender.id, Math.min(Math.round(-p.money + 300), Math.round(lender.money / 3)), 1, 8)
    if (s.pending && !s.players[s.pending.playerId].human) choose(s, aiChoose(s))
  }
}

// 화면에서 AI 한 걸음 진행: 결정이 있으면 고르고, 아니면 준비 후 던지기
export function aiStep(s: GameState) {
  if (s.phase === 'gameover' || s.mini) return
  if (s.pending) {
    if (!s.players[s.pending.playerId].human) choose(s, aiChoose(s))
    return
  }
  const p = cur(s)
  if (p.human || !canAct(s)) return
  aiPreRoll(s)
  if (canAct(s)) roll(s, 0, aiWantsCar(s, cur(s)))
}
