import { BIZ, BUSINESSES, DICE_ITEMS, JOBS, SECTORS } from './data'
import { findEvent, specialValue } from './special'
import {
  aiDiceItem, aiInvestDecision, aiFinishMini, aiWantsCar, passChance, buyLottery, canAct, canBorrowFrom, choose, cur, bankDebt, carCost, cureAddiction, houseCost, mortgagePlan, isAdultStage, canBankLoan, loanLimit, loanTotal, repayFriendLoan,
  repayLoans, requestFriendLoan, roll, rngOf, salaryOf, scoreOf, stageOf, startSabotage, takeLoan, toggleInsurance,
  tradeStock, playChance, moodLevel, scaleOf, withdraw,
} from './game'
import type { GameState, Pending, Personality, Player } from './types'

// 규칙 기반 AI. 사람과 같은 정보만 본다 (미래 뉴스는 아무도 모름)

// 성격에 맞는 직업 (2026-10-23 사용자: 직업 특성을 보고 고르게). 1보다 크면 좋아함
// 가족형: 연애·가정에 좋은 직업(요리사 집밥·교사 자녀 교육·소방관·회사원 연애), 의사(이혼 위기)·과학자(연애↓)·변호사(과로)는 피함
// 안전형: 연금·건강(공무원), 다치는 직업·대박형은 피함 / 엘리트형: 대학 나온 고소득 / 재테크형: 고소득·주식 분야 / 도박꾼형: 대박형
const FIT: Record<Personality, Record<string, number>> = {
  family: { chef: 1.6, teacher: 1.6, fire: 1.5, office: 1.4, civil: 1.3, police: 1.2, idol: 1.2, doctor: 0.6, scientist: 0.6, lawyer: 0.8, dev: 0.8, youtuber: 0.8 },
  safe: { civil: 2, teacher: 1.7, police: 1.3, office: 1.3, fire: 1.1, chef: 0.9, dev: 0.7, athlete: 0.4, idol: 0.4, youtuber: 0.4 },
  elite: { doctor: 1.8, lawyer: 1.5, scientist: 1.4, dev: 1.2, teacher: 1.1, youtuber: 0.5, idol: 0.7, athlete: 0.8, chef: 0.8 },
  investor: { dev: 1.4, scientist: 1.3, lawyer: 1.2, doctor: 1.2, office: 1.1, civil: 0.6, teacher: 0.8 },
  gambler: { idol: 1.8, youtuber: 1.6, athlete: 1.6, chef: 1.1, civil: 0.4, teacher: 0.6, office: 0.7 },
}
const jobValue = (id: string, p: Player): number => {
  const j = JOBS.find((x) => x.id === id)
  if (!j) return 0
  let v = j.salary * (FIT[p.personality][id] ?? 1)
  // 월급만 보지 않고 잘 맞는 직업: 핵심 능력치가 조건보다 높을수록, 대학 전공에 맞을수록
  v *= 1 + 0.08 * Math.max(0, p.stats[j.key] - (j.req[j.key] ?? 0))
  if (p.major === 'str' && (j.id === 'athlete' || j.key === 'str')) v *= 1.6
  if (p.major === 'cha' && (j.id === 'idol' || j.id === 'youtuber' || j.id === 'teacher')) v *= 1.5
  return v
}

// 창업하면 벌 것 같은 돈 ÷ 지금 월급 (2026-10-23: 재테크형·도박꾼형이 능력치와 상관없이 늘 창업해서 손해를 봄)
// 업종 능력치가 높을수록 수익이 크고 회사도 잘 큼. 운세가 나쁘면 적자. 성격마다 거는 정도가 다름
function bizRatio(p: Player): number {
  const b = p.jobId ? BUSINESSES[p.jobId] : null
  const st = b ? p.stats[b.stat] : Math.round((p.stats.int + p.stats.str + p.stats.cha) / 3) // 백수는 카페 (세 능력치 평균)
  const grow = st >= 7 ? 2 : st >= 5 ? 1.4 : 1
  const luck = [0.2, 0.5, 0.8, 1.2, 1.6][p.fortune] ?? 0.8
  const expect = BIZ.base[0] * (0.5 + st / 10) * grow * luck * (p.jobId === 'chef' ? 1.2 : 1)
  const appetite = { gambler: 1.1, investor: 1, elite: 0.75, family: 0.6, safe: 0.45 }[p.personality]
  return (expect * appetite) / Math.max(300, salaryOf(p))
}

function optionScore(s: GameState, p: Player, pd: Pending, id: string): number {
  const rng = rngOf(s)
  const per = p.personality
  switch (pd.type) {
    case 'academy': return id === 'study' ? (per === 'elite' ? 3 : 1) : per === 'family' ? 3 : 1.5
    case 'club': return p.stats[id as 'int'] < 4 ? 1 : 0.5 + (per === 'elite' && id === 'int' ? 2 : 0) + (per === 'gambler' && id === 'cha' ? 1 : 0)
    case 'campus': {
      const k = id as 'int' | 'str' | 'cha'
      return 10 - p.stats[k] + (per === 'elite' && k === 'int' ? 3 : 0) + (per === 'family' && k === 'cha' ? 1 : 0) + rng.next()
    }
    case 'career':
    case 'adultStart': {
      if (!id.startsWith('uni:')) return 1
      const k = id.slice(4) as 'int' | 'str' | 'cha'
      return passChance(p, k) * 2.5 + (per === 'elite' && k === 'int' ? 1 : 0) - (per === 'gambler' ? 1 : 0)
    }
    case 'uniFail': return id === 'retake' ? (per === 'elite' || per === 'family' ? 2 : 0.8) : 1
    case 'fork': {
      const st = stageOf(s)
      const tile = st.tiles[(pd.data as { tile: number }).tile]
      const road = tile.fork?.options.find((o) => String(o.to) === id)?.road
      switch (road) {
        case 'academy': return per === 'elite' ? 3 : per === 'family' ? 1 : 1.5
        case 'play': return per === 'family' || per === 'gambler' ? 2.5 : 1.4
        case 'college': return per === 'elite' ? 3 : per === 'gambler' ? 0.5 : 1.5
        case 'work': return per === 'investor' ? 2 : 1
        case 'startup': return p.jobId === 'ceo' ? 0 : 1.5 * bizRatio(p) // '하던 일 계속'(1.5)보다 벌 것 같으면 창업
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
    case 'special': {
      const ev = findEvent(stageOf(s).id, (pd.data as { ev: string }).ev)
      const o = ev?.options.find((x) => x.id === id)
      if (!o) return 0
      // 운세: 가족형·안전형은 더 챙기고, 도박꾼형·재테크형은 돈·재미 쪽으로 (2026-10-21)
      const luckTaste = { family: 2, safe: 1.5, elite: 0, investor: -2, gambler: -2.5 }[per] * (o.luck ?? 0)
      return specialValue(o, scaleOf(s), (k) => p.stats[k]) + luckTaste + (moodLevel(p) === 0 ? (o.happy ?? 0) * 0.5 : 0) + rng.next() * 0.5 // 기분이 나쁘면 행복을 더 챙김
    }
    case 'happyPick': {
      // 기분이 나쁘면 크게 놀고, 돈이 모자라면 일하고, 아니면 소소하게 (성격 따라 조금씩)
      const mood = moodLevel(p)
      const cost = (pd.data as { cost: number }).cost
      if (id === 'big') return (mood === 0 ? 3 : 1) + (per === 'family' ? 1 : 0) - (p.money < cost * 4 ? 2 : 0) + rng.next()
      if (id === 'work') return (p.money < 0 ? 3 : 0.5) + (per === 'investor' || per === 'elite' ? 1 : 0) - (mood === 0 ? 1.5 : 0) + rng.next()
      return 1.5 + rng.next()
    }
    case 'growPick': {
      const k = id as 'int' | 'str' | 'cha'
      return 10 - p.stats[k] + (per === 'elite' && k === 'int' ? 3 : 0) + (per === 'family' && k === 'cha' ? 2 : 0) + (p.biz?.stat === k ? 3 : 0) + rng.next()
    }
    case 'collegeStat': {
      const k = id as 'int' | 'str' | 'cha'
      return 10 - p.stats[k] + (per === 'elite' && k === 'int' ? 3 : 0)
    }
    case 'job':
    case 'careerChange': {
      if (id === 'stay') return p.jobId ? jobValue(p.jobId, p) * 1.05 : 0
      if (id === 'biz') {
        // 창업: 업종 능력치가 높고 운을 거는 성격일수록. 기대 수익을 지금 월급과 비교
        if (!p.jobId || !BUSINESSES[p.jobId]) return 0
        return jobValue(p.jobId, p) * 1.05 * bizRatio(p) // 그대로 있기보다 나을 때만
      }
      if (id === 'jobless') return 1
      return jobValue(id.slice(4), p)
    }
    case 'middleBranch': return id === 'adopt' ? (per === 'family' ? 5 : 2) : id === 'pet' ? (per === 'family' ? 4 : 2.5) : 1
    case 'bizRetire': return id === 'sell' ? 2 : p.jobRank >= 1 && (per === 'gambler' || per === 'investor') ? 2.5 : 1
    case 'idolNext': { // 아이돌 등급이 높을수록 전직, 도박꾼형·재테크형은 창업도
      const r = p.exIdol ?? 0
      return id === 'actor' ? 2 + r : id === 'youtuber' ? 1.5 + r * 0.8 : id === 'biz' ? (per === 'gambler' || per === 'investor' ? 3 : 1) + r * 0.5 : 0.3
    }
    case 'athleteNext': return id === 'coach' ? 2 + p.stats.str / 10 : id === 'biz' ? (per === 'gambler' || per === 'investor' ? 3 : 1.5) : 0.5
    case 'retire': return id === 'city' ? (per === 'gambler' || per === 'investor' ? 3 : 1) : 2
    case 'shop': {
      // 한 번 들러서 여러 개 살 수 있으니, 이미 산 게 있으면 나가기 쪽으로
      if (id === 'pass') return (per === 'safe' || per === 'investor' ? 2 : 1) + ((pd.data as { n?: number } | undefined)?.n ?? 0) * 1.2
      if (id.startsWith('mortgage')) {
        const i = +id.slice(8)
        const m = mortgagePlan(s, p, i)
        if (m.installment > salaryOf(p) * (per === 'safe' ? 0.25 : 0.4) || p.money - m.down < bankDebt(p)) return 0
        return 2.6 + i * 0.5 + (per === 'investor' || per === 'gambler' ? 0.6 : 0)
      }
      if (id.startsWith('house')) { const i = +id.slice(5); return p.money - houseCost(s, p, i) >= loanTotal(p) ? 3 + i : 0 } // 빚 갚을 돈은 남기고 살 수 있으면 삼
      if (id.startsWith('car')) { const i = +id.slice(3); return p.money - loanTotal(p) > carCost(p, i) * 2 ? 2.5 + i * 0.5 : 0 }
      if (id === 'chance') return 0.5
      if (id === 'pet') return per === 'family' ? 2.4 : 0.8
      if (id.startsWith('dice_')) {
        const k = id.slice(5) as keyof typeof DICE_ITEMS
        if (p.money < DICE_ITEMS[k].price * 5) return 0
        return k === 'twin' ? (per === 'gambler' ? 2.6 : 1.3) : k === 'even' ? 1.4 : 0.9
      }
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
    case 'kidEdu': {
      const e = +id
      const n = p.kids.filter((k) => k.result === null).length
      if (p.money < 0 && e > 0) return 0
      return per === 'elite' || per === 'family' ? e + 1 : per === 'safe' ? (e === 1 ? 2 : 1) : per === 'investor' ? (p.money > 2000 * n ? e + 0.5 : 2 - e) : 1 + rng.next()
    }
    case 'baby': return id === 'yes' ? (per === 'family' ? 5 : 2) : 1.5
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
    case 'sector': return rng.next()
    case 'festTarget': return id === 'new' ? 1 : 1.5 + rng.next()
    case 'wallet': return id === 'return' ? (per === 'family' || per === 'safe' ? 2 : 1.2) : per === 'gambler' ? 2 : 0.8
    case 'stray': return id === 'yes' ? (per === 'family' || per === 'safe' ? 2 : 0.8) : 1
    case 'loanRequest': return id === 'yes' ? 1 : 1.2
    case 'bizTakeInvest': return id === 'yes' ? (per === 'safe' || per === 'family' ? 2 : 1) : 1.2 // 온라인에서 나간 사람
    case 'bizInvest': return id === 'yes' && aiInvestDecision(s, p, s.players[(pd.data as { founderId: number }).founderId]) ? 2 : 1 // 온라인에서 나간 사람
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
  if (p.chance === 'charm' && p.fortune <= 1) playChance(s)
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
    if (!p.insurance.health && rng.chance(p.stats.str <= 4 ? Math.max(wantIns, 0.7) : wantIns)) toggleInsurance(s, 'health') // 체력이 약하면 건강보험
    if (p.house && !p.insurance.property && rng.chance(wantIns)) toggleInsurance(s, 'property')
    if (p.car && !p.insurance.car && rng.chance(wantIns)) toggleInsurance(s, 'car')
  }
  // 주식: 미래 정보 없이. 재테크형은 싸진 종목을 조금씩 사고, 현금은 남겨 둠 (월세·관리비로 빚이 쌓이지 않게)
  const spare = Math.max(0, p.money - (800 + salaryOf(p) * 2)) // 주식에 넣어도 되는 돈
  if ((per === 'investor' || (per === 'gambler' && rng.chance(0.3))) && spare > 0 && rng.chance(0.4)) {
    const cheap = [...SECTORS].sort((a, b) => s.stockPrice[a] - s.stockPrice[b])[0]
    if (s.stockPrice[cheap] < 100) {
      const qty = Math.floor((spare * (per === 'gambler' ? 0.3 : 0.15)) / s.stockPrice[cheap])
      if (qty > 0) tradeStock(s, cheap, qty)
    }
  }
  // 재테크형·엘리트: 많이 오르면 팔고(익절), 많이 떨어지면 손해 보고 팔기(손절)
  if (per === 'investor' || (per === 'elite' && rng.chance(0.25))) {
    for (const k of SECTORS) if (p.stocks[k] && (s.stockPrice[k] > 130 || s.stockPrice[k] < 75)) tradeStock(s, k, -p.stocks[k])
  }
  // 돈이 마이너스면 주식부터 팔아서 메움
  if (p.money < 0) for (const k of SECTORS) if (p.money < 0 && p.stocks[k]) tradeStock(s, k, -p.stocks[k])
  // 대출: 마이너스면 메우고, 여유 있으면 갚기
  if (p.money < 0 && canBankLoan(s, p)) {
    const need = Math.min(-p.money + 200, loanLimit(s, p))
    if (need > 0) takeLoan(s, Math.round(need))
  }
  // 주택담보대출 할부금은 다음 차례 시작에 빠짐 → 그만큼은 남겨 두고 다른 빚을 갚음 (2026-10-23: 은행 빚만 갚다가 집이 경매로 넘어갔음)
  const mort = p.loans.find((l) => l.kind === '주담대')
  const reserve = mort ? Math.min(mort.amount, mort.installment ?? mort.amount) : 0
  const near = p.loans.filter((l) => l.kind !== '주담대' && l.dueTurn - p.turnsPlayed <= 2)
  const soonest = Math.min(...near.map((l) => l.dueTurn - p.turnsPlayed))
  // AI는 남는 돈을 적금에 넣어 둠 → 기한이 다가온 빚은 적금에서 꺼내서 갚음
  if (near.length && p.savings) {
    const want = near.reduce((a, l) => a + l.amount, 0) + reserve - p.money
    if (want > 0) withdraw(s, want)
  }
  if (p.loans.length && p.money > loanTotal(p) + salaryOf(p) * 3) repayLoans(s)
  else if (soonest <= 1 && p.money > 0) repayLoans(s) // 다음 차례에 강제 청산: 경매(3번 연체)보다 급하니 있는 만큼
  else if (soonest <= 2 && p.money > reserve) repayLoans(s, p.money - reserve) // 기한이 다가오면 할부금을 빼고 갚기
  // 이미 2번 연체(한 번 더면 경매)인데 할부금이 모자라면 은행에서 빌려서라도 냄
  if (mort && (mort.missed ?? 0) >= 2 && p.money + (p.savings ?? 0) < reserve && canBankLoan(s, p)) {
    const need = Math.min(reserve - p.money - (p.savings ?? 0) + 50, loanLimit(s, p))
    if (need > 0) takeLoan(s, Math.round(need))
  }
  // 친구 돈: 여유 있으면 갚고, 은행이 막히면 친구에게 부탁
  s.friendLoans.forEach((l, i) => { if (l.borrowerId === p.id && p.money > l.owe * 2) repayFriendLoan(s, i) })
  if (p.money < 0 && (!canBankLoan(s, p) || loanLimit(s, p) < 200)) {
    const lender = [...s.players].sort((a, b) => b.money - a.money).find((q) => canBorrowFrom(s, p, q))
    if (lender && canAct(s)) requestFriendLoan(s, lender.id, Math.min(Math.round(-p.money + 300), Math.round(lender.money / 3)), 1, 8)
    if (s.pending && !s.players[s.pending.playerId].human) choose(s, aiChoose(s))
  }
}

// 화면에서 AI 한 걸음 진행: 결정이 있으면 고르고, 아니면 준비 후 던지기
export function aiStep(s: GameState) {
  if (s.phase === 'gameover') return
  if (s.mini) { aiFinishMini(s); return } // 하던 사람이 나가서 AI가 맡은 미니게임

  if (s.pending) {
    if (!s.players[s.pending.playerId].human) choose(s, aiChoose(s))
    return
  }
  const p = cur(s)
  if (p.human || !canAct(s)) return
  aiPreRoll(s)
  if (!canAct(s)) return
  const q = cur(s)
  const item = aiDiceItem(s, q)
  roll(s, 0, !item && aiWantsCar(s, q), item)
}
