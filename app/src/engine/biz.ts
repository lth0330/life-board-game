// 창업·퇴직금·메달·동업·사업 기회 (2026-10-29 game.ts에서 나눔)
import { BIZ_OPP, BIZ_RISK, bizEventsFor, findBizEvent, type BizEvent } from './bizEvents'
import {
  BIZ, CARS, HOUSES, CAR_CRASH_LOSS, HOUSE_RULES, INSURANCE, JOBS, MEDALS, PENSION, SEVERANCE_RATE, SECTORS, STAT_NAMES, TAX_RATE, JOB_HEALTH,
} from './data'
import type { GameState, InsuranceKind, Pending, Player, Biz } from './types'
import { kidAllowance, kidUpkeep } from './kids'
import {
  type Bad, badEvent, carResale, fortuneName, fromSavings, houseValue, isAdultStage, jobOf, jobTag, log, luckBonus, rngOf, salaryOf, say, scaleOf,
  setJob, stageOf, STUDENT_ALLOWANCE, won, workJob,
} from './game'

// ───────── 창업·퇴직금·메달 ─────────

// 사업 능력치: 업종 능력치 하나, 동네 가게는 세 능력치 평균
const bizStat = (p: Player) => (p.biz?.avg ? Math.round((p.stats.int + p.stats.str + p.stats.cha) / 3) : p.stats[p.biz?.stat ?? 'int'])
export const bizStatMult = (p: Player) => 0.5 + bizStat(p) / 10
export const medalPension = (p: Player) => p.medals.reduce((a, m) => a + MEDALS[m].pension, 0)
export const bizCost = (p: Player) => (p.jobId === 'chef' ? BIZ.chefCost : BIZ.cost)
export const bizRankOf = (p: Player, r = p.jobRank) => p.biz?.ranks?.[r] ?? JOBS.find((j) => j.id === 'ceo')!.ranks[r]
export const bizBase = (p: Player) => (p.biz?.base ?? BIZ.base)[p.jobRank]
export const bizSale = (p: Player) => (p.biz?.sale ?? BIZ.sale)[p.jobRank]

// 매 턴 사업 수익 = 회사 크기 기본 × 능력치 배율 × 운세 배율. 그다음 회사가 크거나 작아질 수 있음
export function bizTick(s: GameState, p: Player, mult: number) {
  const rng = rngOf(s)
  const biz = p.biz!
  const raw = bizBase(p) * bizStatMult(p) * BIZ.fortune[p.fortune] * mult
  const income = Math.round(raw > 0 ? raw * (1 - TAX_RATE(raw)) : raw)
  p.money += income
  shareBiz(s, p, income, '수익')
  if (income < 0) log(s, p.id, `[운세 ${fortuneName(p.fortune)}] ${biz.name} 적자 ${won(income)}`, 'bad')
  if (mult < 1) p.happy -= 1 // 노년까지 일하느라 지침
  const stat = bizStat(p)
  if (p.fortune >= 2 && p.jobRank < (biz.maxRank ?? 2) && rng.chance(stat * BIZ.growPerStat)) {
    p.jobRank++
    log(s, p.id, `${biz.name}가 커졌다! ${bizRankOf(p)} (${biz.avg ? '능력치 평균' : STAT_NAMES[biz.stat]} ${stat} 덕분)`, 'good')
    s.banner = { title: '회사 성장!', text: `${p.name}: ${biz.name}`, tone: 'good' }
    say(s, p, 'promoted')
    if (biz.sector) { s.stockPrice[biz.sector] = Math.round(s.stockPrice[biz.sector] * 1.1); log(s, null, `${p.name}의 회사가 커졌다! ${biz.sector}주 +10%`, 'good') }
  } else if (p.fortune <= 1 && p.jobRank > 0 && rng.chance(Math.max(0.05, BIZ.fallBase - stat * BIZ.fallPerStat))) {
    p.jobRank--
    log(s, p.id, `${biz.name}가 휘청… ${bizRankOf(p)}로 줄었다`, 'bad')
    if (biz.sector) { s.stockPrice[biz.sector] = Math.max(10, Math.round(s.stockPrice[biz.sector] * 0.85)); log(s, null, `${p.name}의 회사가 휘청! ${biz.sector}주 -15%`, 'bad') }
  }
}

// 승진 심사 칸에 사업가가 서면 사업 평가: 이번 턴 사업 수익을 한 번 더 (2026-10-21 사용자)
export function bizReview(s: GameState, p: Player) {
  const raw = bizBase(p) * bizStatMult(p) * BIZ.fortune[p.fortune]
  if (raw <= 0) { log(s, p.id, `사업 평가: ${p.biz!.name}가 적자라 보너스가 없다`, 'info'); return }
  const income = Math.round(raw * (1 - TAX_RATE(raw)))
  p.money += income
  log(s, p.id, `사업 평가 좋음! ${p.biz!.name} 수익 한 번 더 +${won(income)}`, 'good')
  shareBiz(s, p, income, '평가 보너스')
  s.banner = { title: '사업 평가', text: `${p.name}: +${won(income)}`, tone: 'good' }
}

// 퇴직금: 꾸준형 직업만. 그만둘 때 월급 × 일한 턴 × 0.3
export function severanceOf(p: Player) {
  const job = jobOf(p)
  return !job || job.boom || p.jobTenure <= 0 ? 0 : Math.round(salaryOf(p) * p.jobTenure * SEVERANCE_RATE)
}
// 그만두는 선택지에 붙이는 안내 (2026-10-23 사용자: 퇴직금이 얼마인지 같이)
export function severanceNote(p: Player) {
  const job = jobOf(p)
  if (!job) return ''
  if (job.boom) return `${job.name}은 퇴직금이 없어요`
  const amt = severanceOf(p)
  return amt ? `${job.name} 퇴직금 +${won(amt)} (${p.jobTenure}턴 근무)` : `${job.name} 퇴직금은 아직 없어요 (일한 턴이 없음)`
}
export function paySeverance(s: GameState, p: Player) {
  const job = jobOf(p)
  const amt = severanceOf(p)
  if (!job || !amt) return
  p.money += amt
  log(s, p.id, `${job.name} 퇴직금 +${won(amt)} (${p.jobTenure}턴 근무)`, 'good')
  p.jobTenure = 0
}

export function startCompany(s: GameState, p: Player, biz: Biz) {
  const cost = bizCost(p)
  if (p.money < cost) { p.loans.push({ amount: cost - p.money, dueTurn: p.turnsPlayed + 12, kind: '창업' }); p.money = cost; log(s, p.id, '빚을 내서 창업 자금을 마련했다', 'info') }
  p.money -= cost
  setJob(s, p, 'ceo') // 다니던 직장 퇴직금은 여기서 받음
  p.jobRank = 0 // 모두 소기업부터
  p.biz = { ...biz }
  p.sector = biz.sector
  p.bizKeep = null
  log(s, p.id, `${biz.name} 창업! (${biz.avg ? '지력·체력·매력 평균' : STAT_NAMES[biz.stat]}이 높을수록 잘 벌고 잘 큼)`, 'good')
  say(s, p, 'startup')
  p.biz.investors = []
  askFounder(s, p)
}

// ───────── 동업 (2026-10-24 사용자) ─────────
// 누가 창업하면 다른 사람에게 차례로 투자를 물음. 1,000만 = 회사 몫 10%, 투자금은 창업한 사람에게.
// 수익·평가 보너스·매각 값의 10%씩 받고, 적자는 나누지 않음
const canInvest = (q: Player) => !q.finished && q.money >= BIZ.invest
export function aiInvestDecision(s: GameState, q: Player, founder: Player) {
  if (q.money < BIZ.invest * 1.5) return false
  const base = { investor: 0.6, gambler: 0.55, elite: 0.35, family: 0.25, safe: 0.15 }[q.personality]
  return rngOf(s).chance(Math.max(0.05, Math.min(0.9, base + (bizStat(founder) - 5) * 0.05)))
}
// 창업한 사람에게 먼저 투자를 받을지 물음 (2026-10-24 사용자: 원하지 않는데 받으면 안 됨). 투자할 수 있는 사람이 없으면 안 물음
const AI_TAKE_INVEST = { safe: 0.9, family: 0.8, elite: 0.6, investor: 0.5, gambler: 0.4 }
function askFounder(s: GameState, founder: Player) {
  const queue = s.players.filter((q) => q.id !== founder.id && canInvest(q)).map((q) => q.id)
  if (!queue.length || !founder.biz) return
  if (founder.human) {
    s.pending = {
      type: 'bizTakeInvest', playerId: founder.id, title: '투자를 받을까요?',
      text: `다른 사람에게 ${founder.biz.name} 투자를 물어봐요. 한 사람이 ${won(BIZ.invest)}을 넣으면 회사 몫 10%를 가져가요. 수익이 나면 매 턴, 회사를 팔면 판 돈의 10%를 그 사람에게 줘요. 적자는 나누지 않아요.`,
      options: [{ id: 'yes', label: '투자를 받는다', desc: `받으면 한 사람당 +${won(BIZ.invest)}` }, { id: 'no', label: '혼자 한다', desc: '수익을 나누지 않아요' }],
      data: { queue },
    }
    s.phase = 'decision'
    return
  }
  if (rngOf(s).chance(AI_TAKE_INVEST[founder.personality])) offerInvest(s, founder, queue)
}
export function offerInvest(s: GameState, founder: Player, queue: number[]) {
  const biz = founder.biz
  if (!biz) return
  for (let i = 0; i < queue.length; i++) {
    const q = s.players[queue[i]]
    if (!canInvest(q)) continue
    if (q.human) {
      const stat = biz.avg ? `능력치 평균 ${bizStat(founder)}` : `${STAT_NAMES[biz.stat]} ${bizStat(founder)}`
      s.pending = {
        type: 'bizInvest', playerId: q.id, title: `${founder.name}의 ${biz.name}에 투자할까요?`,
        text: `${won(BIZ.invest)}을 넣으면 회사 몫 10%를 가져요. 수익이 나면 매 턴 10%, 회사를 팔면 판 돈의 10%를 받아요. 적자는 나누지 않아요. (${founder.name}: ${stat} · 운세 ${fortuneName(founder.fortune)})`,
        options: [{ id: 'yes', label: `투자한다 (${won(BIZ.invest)})` }, { id: 'no', label: '안 한다' }],
        data: { founderId: founder.id, queue: queue.slice(i + 1) },
      }
      s.phase = 'decision'
      return
    }
    if (aiInvestDecision(s, q, founder)) invest(s, q, founder)
  }
}
export function invest(s: GameState, q: Player, founder: Player) {
  if (!founder.biz || !canInvest(q)) return
  q.money -= BIZ.invest
  founder.money += BIZ.invest
  founder.biz.investors = [...(founder.biz.investors ?? []), q.id]
  q.record.bizShare = (q.record.bizShare ?? 0) - BIZ.invest
  log(s, q.id, `${founder.name}의 ${founder.biz.name}에 ${won(BIZ.invest)} 투자! 회사 몫 10%`, 'info')
}
function shareBiz(s: GameState, founder: Player, amount: number, what: string) {
  const ids = founder.biz?.investors ?? []
  if (amount <= 0 || !ids.length) return
  const each = Math.round(amount * BIZ.investShare)
  for (const id of ids) {
    const q = s.players[id]
    founder.money -= each
    q.money += each
    q.record.bizShare = (q.record.bizShare ?? 0) + each
  }
  log(s, founder.id, `동업 나눔(${what}): ${ids.map((id) => s.players[id].name).join('·')}에게 ${won(each)}씩`, 'info')
}
// ───────── 사업 기회 (2026-10-24 사용자, engine/bizEvents.ts) ─────────
export const bizOppCost = (p: Player, ev: BizEvent) => Math.round(BIZ_OPP.cost[p.jobRank] * BIZ_RISK[ev.risk].cost / 10) * 10
// 점수에 더해지는 것: 사업 능력치의 절반 + 운세
const bizOppBonus = (p: Player) => Math.round(bizStat(p) / 2) + luckBonus(p)
export function bizOppRule(p: Player, ev: BizEvent) {
  const r = BIZ_RISK[ev.risk]
  const b = bizOppBonus(p)
  return `주사위 + ${b}(사업 능력치 ${bizStat(p)}의 절반${luckBonus(p) ? `, 운세 ${luckBonus(p) > 0 ? '+' : ''}${luckBonus(p)}` : ''}) → ${r.great} 이상 대성공(${ev.grow ? '회사 성장' : `${r.reward}배`}) · ${r.ok} 이상 효과 없음(반만 돌려받음) · 그 밑 실패`
}
export function bizOpportunity(s: GameState, p: Player) {
  const rng = rngOf(s)
  const ev = rng.pick(bizEventsFor(p.biz!.name))
  const cost = bizOppCost(p, ev)
  s.pending = {
    type: 'bizOpp', playerId: p.id, title: `사업 기회: ${ev.title}`,
    text: `${ev.desc}. 비용 ${won(cost)} · ${BIZ_RISK[ev.risk].name}
${bizOppRule(p, ev)}`,
    options: [
      { id: 'yes', label: `도전한다 (-${won(cost)})`, disabled: p.money < cost },
      { id: 'no', label: '안 한다' },
    ],
    data: { ev: ev.id, cost },
  }
}
export function bizOppResult(s: GameState, p: Player, evId: string, cost: number, v: number) {
  const ev = p.biz && findBizEvent(p.biz.name, evId)
  if (!ev) return
  const r = BIZ_RISK[ev.risk]
  const score = v + bizOppBonus(p)
  if (score >= r.great) {
    if (ev.grow && p.jobRank < (p.biz!.maxRank ?? 2)) {
      p.jobRank++
      log(s, p.id, `[사업 기회] ${ev.great} ${bizRankOf(p)}! (점수 ${score})`, 'good')
    } else {
      const gain = Math.round(cost * r.reward)
      p.money += gain
      log(s, p.id, `[사업 기회] ${ev.great} +${won(gain)} (점수 ${score})`, 'good')
      shareBiz(s, p, gain, ev.title)
    }
    p.happy += 2
    if (ev.sector) { s.stockPrice[ev.sector] = Math.round(s.stockPrice[ev.sector] * 1.15); log(s, null, `${p.name}의 ${ev.title} 성공! ${ev.sector}주 +15%`, 'good') }
    s.banner = { title: `${ev.title} 대성공!`, text: `${p.name}: 점수 ${score}`, tone: 'good' }
    say(s, p, 'promoted')
  } else if (score >= r.ok) {
    const back = Math.round(cost * BIZ_OPP.okBack)
    p.money += back
    log(s, p.id, `[사업 기회] ${ev.ok} 쓴 돈의 절반 +${won(back)} 돌아옴 (점수 ${score})`, 'info')
    s.banner = { title: `${ev.title}: 효과 없음`, text: `${p.name}: 점수 ${score}`, tone: 'info' }
  } else {
    p.happy -= BIZ_OPP.failHappy
    log(s, p.id, `[사업 기회] ${ev.fail} -${won(cost)}, 행복 -${BIZ_OPP.failHappy} (점수 ${score})`, 'bad')
    if (ev.sector) { s.stockPrice[ev.sector] = Math.max(10, Math.round(s.stockPrice[ev.sector] * 0.9)); log(s, null, `${p.name}의 ${ev.title} 실패… ${ev.sector}주 -10%`, 'bad') }
    s.banner = { title: `${ev.title} 실패`, text: `${p.name}: 점수 ${score}`, tone: 'bad' }
  }
}
export function aiBizOpp(s: GameState, p: Player, pd: Pending) {
  const d = pd.data as { ev: string; cost: number }
  const ev = p.biz && findBizEvent(p.biz.name, d.ev)
  if (!ev || p.money < d.cost * 1.5) return false
  const want = { gambler: 0.9, investor: 0.7, elite: 0.6, family: 0.4, safe: 0.3 }[p.personality] + (bizOppBonus(p) - 3) * 0.1 - (ev.risk === 'normal' ? 0 : 0.15)
  return rngOf(s).chance(Math.max(0.05, Math.min(0.95, want)))
}

// 동업으로 번 돈 (받은 돈 - 투자금)
export const bizShareGain = (_s: GameState, p: Player) => p.record.bizShare ?? 0
// 내가 투자한 회사들
export const myStakes = (s: GameState, p: Player) => s.players.filter((f) => f.biz?.investors?.includes(p.id))

export function sellCompany(s: GameState, p: Player) {
  const amt = bizSale(p)
  p.money += amt
  log(s, p.id, `${p.biz?.name ?? '회사'}(${bizRankOf(p)})를 팔고 은퇴 +${won(amt)}`, 'good')
  shareBiz(s, p, amt, '매각')
  s.banner = { title: '회사 매각', text: `${p.name}: +${won(amt)}`, tone: 'good' }
  p.bizKeep = false
  p.jobId = null
}

export const coachChance = (p: Player, rank: number) => Math.min(0.95, 0.2 + p.stats.str * 0.04 + rank * 0.15 + p.medals.length * 0.1)

// 체력이 낮을수록 건강 문제 (성인부터, 노년엔 1.5배)
export function healthTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const str = p.stats.str
  const job = workJob(s, p)
  const jobMult = (job && JOB_HEALTH[job.id]) ?? 1 // 직업 특성: 공무원 절반, 개발자 2배, 사업가 1.5배
  const ch = (str <= 2 ? 0.08 : str <= 4 ? 0.04 : str <= 6 ? 0.02 : 0.01) * (stageOf(s).id === 'old' ? 1.5 : 1) * jobMult
  if (!rng.chance(ch)) return
  const what = job?.id === 'dev' ? rng.pick(['거북목이 와서 병원에 다녔다', '밤샘 코딩으로 쓰러졌다', '허리 디스크가 왔다'])
    : job?.id === 'ceo' ? rng.pick(['사업 스트레스로 위염이 왔다', '과로로 쓰러졌다', '허리 디스크가 왔다'])
    : rng.pick(['허리 디스크가 왔다', '위염으로 병원에 갔다', '독감으로 입원했다', '무릎을 다쳤다'])
  badEvent(s, p, { text: `${job && jobMult > 1 ? jobTag(job) : ''}${what} (체력 ${str})`, loss: scaleOf(s) * 3, happyLoss: 2, kind: 'health' })
}

// 차 사고: 스쿠터는 자주(몸을 다침), 일반차는 적당히, 고급차는 드물지만 수리비가 큼
export function carCrashTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  if (!p.car || !rng.chance(CARS[p.car].crash * (stageOf(s).id === 'old' ? 1.5 : 1))) return
  const sc = scaleOf(s)
  const crash: Bad[] = [
    { text: '', loss: 0, happyLoss: 0 },
    { text: '스쿠터를 타다 넘어져 다쳤다', loss: sc * 2, happyLoss: 3, kind: 'health' },
    { text: '접촉 사고가 났다', loss: sc * 3, happyLoss: 2, kind: 'car' },
    { text: '고급차를 긁혔다. 수리비가 비싸다', loss: sc * 5, happyLoss: 1, kind: 'car' },
  ]
  badEvent(s, p, crash[p.car])
  p.carValue = Math.round(p.carValue * (1 - CAR_CRASH_LOSS))
  log(s, p.id, `${CARS[p.car].name} 가치가 떨어졌다 (지금 ${won(p.carValue)})`, 'info')
}

// 강제 청산: 가진 돈 → 적금 → 주식(모자란 만큼만) → 차 → 집 순서로 갚음 (2026-10-21 사용자)
export function forceLiquidate(s: GameState, p: Player, overdue: { amount: number }[]) {
  const need = overdue.reduce((a, l) => a + l.amount, 0)
  p.loans = p.loans.filter((l) => !overdue.includes(l))
  fromSavings(s, p, need)
  for (const k of SECTORS) {
    if (p.money >= need || !p.stocks[k]) continue
    const n = Math.min(p.stocks[k], Math.ceil((need - p.money) / Math.max(1, s.stockPrice[k])))
    const avg = p.stockCost[k] / p.stocks[k]
    p.money += n * s.stockPrice[k]
    p.record.stockGain += n * (s.stockPrice[k] - avg)
    p.stockCost[k] = Math.round(avg * (p.stocks[k] - n))
    p.stocks[k] -= n
    log(s, p.id, `강제 청산: ${k}주 ${n}주를 팔았다`, 'bad')
  }
  if (p.money < need && p.car > 0) {
    p.money += carResale(p)
    log(s, p.id, `강제 청산: ${CARS[p.car].name}를 ${won(carResale(p))}에 팔았다`, 'bad')
    p.car = 0; p.carValue = 0; p.carCharges = 0
  }
  if (p.money < need && p.house > 0) {
    p.money += Math.round(houseValue(s, p) * HOUSE_RULES.forcedRate)
    log(s, p.id, `강제 청산: ${HOUSES[p.house].name}을 팔았다`, 'bad')
    p.house = 0
    // 집을 판 돈으로 주택담보대출부터 갚음 (집이 없는데 할부금만 남지 않게)
    const m = p.loans.find((l) => l.kind === '주담대')
    if (m) {
      p.money -= m.amount
      p.loans = p.loans.filter((l) => l !== m)
      log(s, p.id, `집 판 돈으로 주택담보대출 ${won(m.amount)}을 갚았다`, 'info')
    }
  }
  p.money -= need
  if (p.money < 0) p.creditBad = 8
  log(s, p.id, '대출 기한을 넘겨 강제 청산을 당했다', 'bad')
  s.banner = { title: '강제 청산', text: `${p.name}: 대출 기한을 넘겼어요`, tone: 'bad' }
}

// 위쪽 정보 줄용: 이번 단계에서 매 턴 대략 얼마가 들어오고 나가는지 (운에 따른 사건 제외)
export function turnIncome(s: GameState, p: Player) {
  if (!isAdultStage(s)) return stageOf(s).id === 'student' ? STUDENT_ALLOWANCE : 0
  const st = stageOf(s)
  const job = jobOf(p)
  let inc = 0
  if (st.id !== 'old' && job) { const sal = salaryOf(p); inc += Math.round(sal * (1 - TAX_RATE(sal))) }
  if (st.id === 'old' && job?.pension) inc += PENSION
  if (p.spouse) inc += p.spouse.wealth * 12
  inc += kidAllowance(p) + medalPension(p)
  let out = 0
  for (const k of Object.keys(p.insurance) as InsuranceKind[]) if (p.insurance[k]) out += INSURANCE[k].premium
  out += CARS[p.car].upkeep + kidUpkeep(s, p) + (p.pet?.alive ? 5 : 0)
  out += p.house ? Math.round(houseValue(s, p) * HOUSE_RULES.upkeepRate) : HOUSE_RULES.rent
  out += p.loans.filter((l) => l.kind === '주담대').reduce((a, l) => a + Math.min(l.amount, l.installment ?? 0), 0)
  if (p.agency && !p.spouse && st.id !== 'old') out += p.agency.vip ? 100 : 30
  return inc - out
}
