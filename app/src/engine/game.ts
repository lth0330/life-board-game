import { josa } from './josa'
import { BIZ_OPP, findBizEvent } from './bizEvents'
import { buildStages, isEnd, maxDepth, walkAhead } from './board'
import {
  AI_NAMES, BIZ, BUSINESSES, CAFE, CARS, CHANCE_NAMES, DICE_ITEMS, FORTUNES, HOUSES, CAR_RESALE, HOUSE_RULES, INSURANCE, JOBS, KIDS, LOTTERY_PRICE, MEDALS, PENSION,
  ADULT_BONUS_MULT, PERF_BONUS, SAVINGS_RATE, SCORE_PER_POINT, PERSONALITIES, PLAYER_COLORS, PRESTIGE_JOBS, SABOTAGE_NAMES, SECTORS, STAGE_SCALE,
  STAT_NAMES, TAX_RATE, JOB_PROS_CONS,
} from './data'
import { DEFAULT_OUTFIT, randomOutfit, type Outfit } from './outfit'
import { makeRng, type Rng } from './rng'
import { DILEMMAS, findEvent, SPECIALS, specialDesc, THEME_EVENTS, type SpecialEvent, type SpecialOption } from './special'
import { speechLine, type SpeechKey } from './speech'
import type {
  ChanceCard, ChoiceOption, DiceItem, GameState, InsuranceKind, JobDef, MapTheme, MiniId, Personality, Player, SabotageCard, Sector, Settings, Stage,
  StageId, StatKey, Suitor, Tile,
} from './types'
import { affinityGain, CASINO, casinoStake, FEST_GAMES, meet, resolveRps, rpsPending, startContest, startMini } from './mini'
import {
  agencyTurn, type Attr, bigPrice, canDate, dateTile, findSuitor, makeSuitor, openShop, shopBuy, type ShopVisit, suitorDesc, triggerPoint,
} from './romance'
import { addKid, eduPending, familyTick, isMinor, kidUpkeep } from './kids'
import {
  bizBase, bizCost, bizOpportunity, bizOppResult, bizOppRule, bizRankOf, bizReview, bizSale, bizShareGain, bizStatMult, bizTick, carCrashTick,
  coachChance, forceLiquidate, healthTick, invest, medalPension, offerInvest, paySeverance, sellCompany, severanceNote, startCompany,
} from './biz'
import { friendLoanTick, lawsuit, makeFriendLoan } from './money'
export * from './biz'
export * from './kids'
export * from './mini'
export * from './money'
export * from './romance'

// ───────── 기본 도우미 ─────────

export const rngOf = (s: GameState): Rng => makeRng(s)
export const stageOf = (s: GameState): Stage => s.stages[s.stageIdx]
export const cur = (s: GameState): Player => s.players[s.current]
export const tileOf = (s: GameState, p: Player): Tile => stageOf(s).tiles[p.pos]
export const jobOf = (p: Player): JobDef | null => JOBS.find((j) => j.id === p.jobId) ?? null
export const scaleOf = (s: GameState) => STAGE_SCALE[stageOf(s).id]
export const isAdultStage = (s: GameState) => s.stageIdx >= 2
export const fortuneName = (f: number) => FORTUNES[f]
export const clampStat = (v: number) => Math.max(0, Math.min(10, v))
// 직업 특성을 쓰는 직업: 노년엔 은퇴해서 없음 (연금 때문에 직업 기록만 남아 있음)
export const workJob = (s: GameState, p: Player): JobDef | null => (stageOf(s).id === 'old' ? null : jobOf(p))
export const jobTag = (j: JobDef) => `[${j.name}] `

// ───────── 기분 (2026-10-17 사용자): 최근 5턴 동안 행복이 얼마나 오르내렸나. 쌓인 행복은 마지막 점수, 기분은 지금 삶의 상태 ─────────
export const MOOD_TURNS = 5
export const moodOf = (p: Player) => p.happy - (p.happyHist?.[0] ?? p.happy)
export type MoodLevel = 0 | 1 | 2 // 우울 · 보통 · 기쁨 (2026-10-21 사용자: 5단계 → 3단계)
export function moodLevel(p: Player): MoodLevel {
  const m = moodOf(p)
  // 행복은 원래 오르는 편이라 기쁨 기준을 위로 (100판 분포: 대략 우울 25% · 보통 50% · 기쁨 25%)
  return m >= 12 ? 2 : m >= 0 ? 1 : 0
}
export const MOOD_NAMES = ['우울', '보통', '기쁨']
export const MOOD_FACES = ['😟', '😐', '😄']
export const MOOD_HELP = ['월급 -15%', '효과 없음', '연애 호감도 +15%'] // 운세와는 따로 (운세는 내 행동으로)
const MOOD_SALARY = [0.85, 1, 1]
export const MOOD_AFFINITY = [1, 1, 1.15]
export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`
export const STATS: StatKey[] = ['int', 'str', 'cha']
const SCHOOL_GIFT = 10 // 학생 단계 시작 때 모두에게 (만 원)
export const HOUSE_HAPPY = [0, 1, 1, 2] // 집이 있으면 매 턴 행복 (원룸·아파트 +1, 단독주택 +2)
export const HOUSE_AFFINITY = 1.1 // 집이 있으면 연애 호감도 +10%
export const STUDENT_ALLOWANCE = 2 // 학생 동안 차례마다 용돈 (만 원, 2026-10-21 사용자: 학생 때 마이너스가 잦아서)

export function log(s: GameState, playerId: number | null, text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  s.log.push({ turn: s.turn, playerId, text, tone })
  s.logCount = (s.logCount ?? 0) + 1
  if (s.log.length > 200) s.log.splice(0, s.log.length - 200)
}

// AI만 말풍선으로 말함
export function say(s: GameState, p: Player, key: SpeechKey) {
  if (p.human) return
  s.speech = { playerId: p.id, text: speechLine(p.personality, key, rngOf(s).next()), turn: s.turn }
}

export function ageOf(s: GameState, p: Player): number {
  const st = stageOf(s)
  const [a, b] = st.ages
  if (st.rolls) {
    const used = st.rolls - p.rollsLeft
    return Math.min(b, a + Math.floor((used / st.rolls) * (b - a + 1))) // 마지막 주사위 뒤에도 단계 나이를 넘지 않게
  }
  return a + Math.floor((tileOf(s, p).d / maxDepth(st)) * (b - a))
}

export function salaryOf(p: Player): number {
  const job = jobOf(p)
  if (!job) return 0
  if (job.id === 'ceo') return Math.round(bizBase(p) * bizStatMult(p)) // 사업가: 운세 '길'일 때 수익 (실제는 매 턴 운세로 바뀜)
  const mult = job.boom ? [0.4, 1, 2.6][p.jobRank] : [1, 1.4, 1.9][p.jobRank]
  return Math.round(job.salary * mult)
}

export function stocksValue(s: GameState, p: Player) {
  return SECTORS.reduce((sum, k) => sum + p.stocks[k] * s.stockPrice[k], 0)
}
export const loanTotal = (p: Player) => p.loans.reduce((a, l) => a + l.amount, 0)
export const bankDebt = (p: Player) => p.loans.filter((l) => l.kind !== '주담대').reduce((a, l) => a + l.amount, 0) // 일반 대출 한도에 들어가는 빚
export const friendDebt = (s: GameState, p: Player) => s.friendLoans.filter((l) => l.borrowerId === p.id).reduce((a, l) => a + l.owe, 0)
export const friendCredit = (s: GameState, p: Player) => s.friendLoans.filter((l) => l.lenderId === p.id).reduce((a, l) => a + l.owe, 0)
export function assetsOf(s: GameState, p: Player) {
  return p.money + (p.savings ?? 0) + Math.round(houseValue(s, p) * HOUSE_RULES.scoreRate) + p.carValue + stocksValue(s, p) - loanTotal(p) - friendDebt(s, p) + friendCredit(s, p)
}
// 집 시세: 상점 값 × 판 전체 시세
// 할인 쿠폰: 30% 할인, 최대 집 1,000만 · 차 500만
export const couponOff = (price: number, cap: number) => Math.min(Math.round(price * 0.3), cap)
// 차를 바꿀 때: 지금 차를 지금 가치의 80%에 팔고 모자란 만큼만 냄
export const carResale = (p: Player) => Math.round(p.carValue * CAR_RESALE)
export const carCost = (p: Player, tier: number, coupon = p.chance === 'coupon') =>
  Math.max(0, CARS[tier].price - (coupon ? couponOff(CARS[tier].price, 500) : 0) - carResale(p))
export const housePriceOf = (s: GameState, tier: number) => Math.round(HOUSES[tier].price * s.housePrice / 100)
export const houseValue = (s: GameState, p: Player) => housePriceOf(s, p.house)
// 집을 바꿀 때: 지금 집을 시세대로 팔고 모자란 만큼만 냄
export function houseCost(s: GameState, p: Player, tier: number, coupon = p.chance === 'coupon') {
  return Math.max(0, housePriceOf(s, tier) - (coupon ? couponOff(housePriceOf(s, tier), 1000) : 0) - houseValue(s, p))
}
export { SCORE_PER_POINT }

// ───────── 팀전 (2026-10-21 사용자: 부루마블처럼 2 대 2, 팀 점수 합계) ─────────
export const TEAM_NAMES = ['A팀', 'B팀']
export const TEAM_COLORS = ['#1B4DDB', '#C2452D']
export const sameTeam = (s: GameState, a: Player, b: Player) => !!s.settings.teams && a.id !== b.id && a.team === b.team
export function teamTotals(s: GameState) {
  const t = [0, 0]
  for (const p of s.players) if (p.team !== undefined) t[p.team] += scoreOf(s, p).total
  return t
}
// 팀원에게 돈 보내기 (빚 없이 그냥 줌)
export function giveTeammate(s: GameState, toId: number, amount: number) {
  const p = cur(s)
  const to = s.players[toId]
  if (!canAct(s) || !to || !sameTeam(s, p, to) || amount <= 0 || p.money < amount) return
  p.money -= amount
  to.money += amount
  log(s, p.id, `팀원 ${to.name}에게 ${won(amount)}을 보냈다`, 'info')
}
// 결산 상: 1등(같으면 모두)에게 10점. 기록이 0이면 없음
export const AWARD_POINTS = 10
// 주식으로 번 돈: 판 동안 판 이익·손해 + 아직 들고 있는 주식의 (지금 값 - 산 값)
export const stockGainOf = (s: GameState, p: Player) => p.record.stockGain + SECTORS.reduce((a, k) => a + p.stocks[k] * s.stockPrice[k] - p.stockCost[k], 0)
export const AWARDS: { id: string; name: string; desc: string; value: (p: Player, s: GameState) => number }[] = [
  // 산 개수가 같으면 상점에서 쓴 돈이 많은 사람 (2026-10-16: 공동 수상이 64% 판에서 나와서)
  { id: 'shop', name: '쇼핑왕', desc: '상점에서 가장 많이 산 사람이 받아요 (개수가 같으면 쓴 돈이 많은 사람)', value: (p) => p.record.shopBuys * 1e7 + p.record.shopSpent },
  { id: 'spend', name: '큰손', desc: '돈을 가장 많이 쓴 사람이 받아요 (집·차·상점·복권·결혼식 등)', value: (p) => p.record.spent },
  { id: 'kids', name: '다둥이', desc: '아이가 가장 많은 사람이 받아요', value: (p) => p.kids.length },
  { id: 'success', name: '자식 농사', desc: '크게 성공한 자녀가 가장 많은 사람이 받아요', value: (p) => p.kids.filter((k) => k.result === 2).length },
  { id: 'lucky', name: '행운아', desc: '복권 당첨금이 가장 많은 사람이 받아요', value: (p) => p.record.lotteryWon },
  { id: 'kind', name: '착한 사람', desc: '선행이 가장 많은 사람이 받아요 (봉사·지갑 찾아주기·유기견·친구에게 돈 빌려주기)', value: (p) => p.record.deeds },
  { id: 'invest', name: '투자왕', desc: '주식·동업으로 가장 많이 번 사람이 받아요 (판 이익 + 들고 있는 주식의 오른 만큼 + 동업으로 받은 돈 - 투자금)', value: (p, s) => stockGainOf(s, p) + bizShareGain(s, p) },
  { id: 'duel', name: '만남의 왕', desc: '같은 칸 대결에서 1등을 가장 많이 한 사람이 받아요', value: (p) => p.record.duelWins },
]
export function awardsOf(s: GameState, p: Player) {
  return AWARDS.flatMap((a) => {
    const best = Math.max(...s.players.map((q) => a.value(q, s)))
    if (best <= 0 || a.value(p, s) !== best) return []
    const ties = s.players.filter((q) => a.value(q, s) === best).length
    return [{ ...a, points: Math.floor(AWARD_POINTS / ties), ties }] // 같은 기록이면 나눠 가짐: 2명 5점, 3명 3점, 4명 2점
  })
}
// 상 점수는 게임이 끝났을 때만 더함
export function scoreOf(s: GameState, p: Player) {
  const assets = assetsOf(s, p)
  const assetScore = Math.round(assets / SCORE_PER_POINT)
  const awardScore = s.phase === 'gameover' ? awardsOf(s, p).reduce((a, x) => a + x.points, 0) : 0
  return { assets, assetScore, happy: p.happy, awardScore, total: assetScore + p.happy + awardScore }
}
// 상점·결혼식 같은 소비 (큰손 상 기록)
export function spend(p: Player, amount: number) {
  p.money -= amount
  p.record.spent += amount
}
// 차 능력 횟수: 산 단계에는 첫 숫자, 그다음 단계마다 1씩 늘어남 (2026-10-21 사용자)
export function carChargesAt(p: Player, stageIdx: number, tier = p.car, boughtAt = p.carStage ?? 2) {
  return CARS[tier].charges[Math.min(2, Math.max(0, stageIdx - boughtAt))]
}
// 은행 대출 (2026-10-21 사용자): 한도는 가진 재산(집·차·주식)을 보고 정함, 매 턴 이자 2%(2026-10-22 3%→2%), 같은 종류는 한 번에 하나만
export const LOAN_RATE = 0.02
export const LOAN_TURNS = 8
// 청년은 재산이 없어도 3,000만까지 (2026-10-21 사용자)
export const YOUNG_LOAN_MIN = 3000
export const loanCap = (s: GameState, p: Player) => Math.max(stageOf(s).id === 'young' ? YOUNG_LOAN_MIN : 0, Math.round(500 + (houseValue(s, p) + p.carValue + stocksValue(s, p)) * 0.5))
// 지금 더 빌릴 수 있는 돈
export const loanLimit = (s: GameState, p: Player) => Math.max(0, loanCap(s, p) - bankDebt(p))
export const canBankLoan = (s: GameState, p: Player) => isAdultStage(s) && p.creditBad <= 0 && !p.loans.some((l) => (l.kind ?? '일반') === '일반')
export function bankLoan(s: GameState, p: Player, amount: number) {
  p.loans.push({ amount, dueTurn: p.turnsPlayed + LOAN_TURNS, kind: '일반' })
  p.money += amount
  log(s, p.id, `은행에서 ${won(amount)} 빌렸다 (${LOAN_TURNS}턴 안에 갚기)`, 'info')
}

function meetsReq(p: Player, job: JobDef, relax = 0) {
  if (job.college && !p.college) return false
  return (Object.keys(job.req) as StatKey[]).every((k) => p.stats[k] + relax >= (job.req[k] ?? 0))
}
export function eligibleJobs(p: Player, stageIdx = 2) {
  const relax = p.spouse && p.spouse.fame >= 7 ? 1 : 0 // 명성 높은 배우자: 인맥으로 조건 1 완화
  // 운동선수는 중년이 되면 은퇴하므로 중년부터는 새로 될 수 없음
  return JOBS.filter((j) => j.id !== 'ceo' && j.id !== 'coach' && j.id !== 'actor' && !((j.id === 'athlete' || j.id === 'idol') && stageIdx >= 3) && meetsReq(p, j, relax))
}

// ───────── 게임 만들기 ─────────

function newPlayer(id: number, name: string, human: boolean, personality: Personality): Player {
  return {
    id, name, human, personality, color: PLAYER_COLORS[id],
    money: 0, happy: 10, stats: { int: 1, str: 1, cha: 1 },
    fortune: 2, charmTurns: 0, goodDeeds: 0,
    jobId: null, jobRank: 0, jobTurns: 0, college: false,
    pos: 0, rollsLeft: 0, finished: false, finishOrder: 0, turnsPlayed: 0,
    insurance: { health: false, property: false, car: false },
    insuranceCooldown: { health: 0, property: 0, car: 0 },
    car: 0, carCharges: 0, carValue: 0, stockCost: { 생명: 0, IT: 0, 화학: 0, 의료: 0, 엔터: 0 }, jobTenure: 0, biz: null, bizKeep: null, medals: [], exAthlete: null, celebrated: [], record: { shopBuys: 0, spent: 0, lotteryWon: 0, deeds: 0, duelWins: 0, stockGain: 0, shopSpent: 0 }, house: 0, loans: [], creditBad: 0,
    lottery: { ticket: false, chance: 10, addicted: false },
    stocks: { 생명: 0, IT: 0, 화학: 0, 의료: 0, 엔터: 0 },
    suitors: [], spouse: null, divorced: false, children: 0, adopted: 0, kids: [], diceItems: [], pet: null, retire: null,
    chance: null, sabotage: null, fortuneMod: 0, agency: null, borrowedFrom: [], forkChoice: null,
    outfit: DEFAULT_OUTFIT, sector: null, collegeDecided: false, campusTurns: 0,
  }
}

export interface NewGameOptions {
  humanName: string
  humanNames?: string[] // 2번째 사람부터 이름
  aiCount: number
  humans?: number
  outfits?: (Outfit | undefined)[] // 사람 플레이어 옷차림 (없으면 무작위)
  teams?: (0 | 1)[] // 팀전: 플레이어 순서(사람 다음 AI)대로 팀. 4명이고 2:2일 때만
  settings: Settings
  seed?: number
}

export function createGame(o: NewGameOptions): GameState {
  const s: GameState = {
    seed: o.seed ?? Math.floor(Math.random() * 2 ** 31),
    settings: o.settings,
    stageIdx: o.settings.startAdult ? 2 : 0,
    stages: [],
    players: [],
    current: 0, turn: 0, round: 1,
    phase: 'roll', pending: null, move: null, path: [], pathId: 0, pathPlayer: 0, dice: null, lastRoll: null, log: [],
    stockPrice: { 생명: 100, IT: 100, 화학: 100, 의료: 100, 엔터: 100 }, housePrice: 100,
    stockPrev: { 생명: 100, IT: 100, 화학: 100, 의료: 100, 엔터: 100 }, logCount: 0, popup: null,
    nextNews: null, finishCount: 0, friendLoans: [], mini: null, meetCheck: false, speech: null, banner: null,
  }
  const rng = rngOf(s)
  s.stages = buildStages(rng)
  s.settings = { ...s.settings, teams: false }
  const humans = o.humans ?? 1
  for (let i = 0; i < humans; i++) s.players.push(newPlayer(i, i === 0 ? o.humanName || '나' : o.humanNames?.[i - 1]?.trim() || `친구${i}`, true, 'safe'))
  const kinds = Object.keys(PERSONALITIES) as Personality[]
  const names = [...AI_NAMES]
  for (let i = 0; i < o.aiCount; i++) {
    const name = names.splice(rng.int(0, names.length - 1), 1)[0]
    // 어려움이면 첫 AI는 꼭 가족형 (점수가 가장 높은 성격, 2026-10-24 사용자)
    const kind = i === 0 && o.settings.difficulty === 'hard' ? 'family' : rng.pick(kinds)
    s.players.push(newPlayer(humans + i, name, false, kind))
  }
  const st = stageOf(s)
  for (const p of s.players) {
    p.outfit = (p.human && o.outfits?.[p.id]) || randomOutfit(rng, p.color)
    p.rollsLeft = st.rolls ?? 0
    if (o.settings.startAdult) {
      p.stats = { int: rng.int(2, 5), str: rng.int(2, 5), cha: rng.int(2, 5) }
      p.money = 500
      p.happy = 20
    }
  }
  log(s, null, `${st.name} 단계 시작! (${st.ages[0]}세)`, 'info')
  s.banner = { title: `${st.name} 단계`, text: `${st.ages[0]}세부터 시작해요`, tone: 'info' }
  // 팀전: 4명이고 2 대 2일 때만
  if (o.teams && o.teams.length === s.players.length && s.players.length === 4 && o.teams.filter((t) => t === 0).length === 2) {
    s.settings.teams = true
    s.players.forEach((p, k) => { p.team = o.teams![k] })
    log(s, null, `팀전! ${TEAM_NAMES[0]}: ${s.players.filter((p) => p.team === 0).map((p) => p.name).join('·')} vs ${TEAM_NAMES[1]}: ${s.players.filter((p) => p.team === 1).map((p) => p.name).join('·')}`, 'info')
  }
  beginTurn(s)
  return s
}

// ───────── 차례 시작 ─────────

// 운세 (2026-10-21 사용자): 모두 '평'에서 시작해 내 행동으로만 오르내림. 착한 일 ↑, 이기적인 선택 ↓
// 운세 포인트를 쌓아서 바뀜 (저녁 결정): 평→길 2번, 길→대길 3번 (내려갈 때도 같게). 저절로 평으로 돌아오지는 않음
const LUCK_MAX = 5
const levelOfLuck = (pts: number) => (pts >= 5 ? 4 : pts >= 2 ? 3 : pts <= -5 ? 0 : pts <= -2 ? 1 : 2)
const luckOf = (p: Player) => p.luckPts ?? [-5, -2, 0, 2, 5][p.fortune] ?? 0 // 예전 저장은 지금 운세에서 시작
// 다음 운세까지 남은 착한 일 (내 정보·기록에 보여 줌)
export function luckToNext(p: Player): { up: number | null; down: number | null } {
  const pts = luckOf(p)
  const up = pts >= 5 ? null : (pts >= 2 ? 5 : pts >= -1 ? 2 : pts >= -4 ? -1 : -4) - pts
  const down = pts <= -5 ? null : pts - (pts <= -2 ? -5 : pts <= 1 ? -2 : pts <= 4 ? 1 : 4)
  return { up, down }
}
function syncFortune(p: Player) { p.fortune = Math.min(4, levelOfLuck(luckOf(p)) + (p.charmTurns > 0 ? 1 : 0)) }
export function changeFortune(s: GameState, p: Player, delta: number, reason: string) {
  const before = p.fortune
  p.luckPts = Math.max(-LUCK_MAX, Math.min(LUCK_MAX, luckOf(p) + delta))
  syncFortune(p)
  if (p.fortune !== before) {
    log(s, p.id, `운세 ${p.fortune > before ? '↑' : '↓'} ${fortuneName(before)} → ${fortuneName(p.fortune)} (${reason})`, p.fortune > before ? 'good' : 'bad')
    if (p.fortune === 4) say(s, p, 'greatFortune')
    return
  }
  const n = luckToNext(p)
  const hint = delta > 0 ? (n.up ? ` · ${fortuneName(Math.min(4, p.fortune + 1))}까지 ${n.up}번 더` : '') : (n.down ? ` · ${n.down}번 더 하면 ${fortuneName(Math.max(0, p.fortune - 1))}` : '')
  log(s, p.id, `운세 포인트 ${delta > 0 ? '+' : ''}${delta} (${reason})${hint}`, delta > 0 ? 'good' : 'bad')
}
function tickFortune(s: GameState, p: Player) {
  if (p.charmTurns > 0 && --p.charmTurns === 0) {
    const before = p.fortune
    syncFortune(p)
    if (p.fortune !== before) log(s, p.id, `행운 부적이 끝났다 (운세 ${fortuneName(p.fortune)})`, 'info')
  }
}

function beginTurn(s: GameState) {
  if (s.phase === 'gameover') return
  const p = cur(s)
  const rng = rngOf(s)
  s.turn++
  p.turnsPlayed++
  s.lastRoll = null
  s.move = null
  s.mini = null
  s.meetCheck = false
  s.phase = 'roll'
  p.happyHist = [...(p.happyHist ?? []), p.happy].slice(-MOOD_TURNS)
  tickFortune(s, p)
  if ((p.chance as string) === 'shortcut') p.chance = 'reroll' // 예전 저장에 남은 지름길 카드 (2026-10-23 없앰)
  if (p.agency && !canDate(s, p) && stageOf(s).id === 'middle') {
    p.agency = null
    log(s, p.id, '중년 결혼식장을 지나 소개팅 회사가 자동 해지됐다', 'info')
  }
  for (const k of Object.keys(p.insuranceCooldown) as InsuranceKind[]) if (p.insuranceCooldown[k] > 0) p.insuranceCooldown[k]--
  if (p.creditBad > 0) p.creditBad--

  // 복권: 지난 차례에 산 표 확인, 안 샀으면 중독 확률 내려감
  if (p.lottery.ticket) {
    p.lottery.ticket = false
    const r = rng.next()
    // 1등 1% · 2등 7% · 3등 22% (전체 30%). 운세로 전체 확률이 바뀜: 대흉 -10%p, 흉 -5%p, 길 +5%p, 대길 +10%p (비율은 그대로)
    const luck = (0.3 + [-0.1, -0.05, 0, 0.05, 0.1][p.fortune]) / 0.3
    const rank = r < 0.01 * luck ? 1 : r < 0.08 * luck ? 2 : r < 0.3 * luck ? 3 : 0
    const prize = [0, 1500, 300, 30][rank] // 1등 3,000만 → 1,500만 (2026-10-29: 산 돈의 약 5배를 돌려받아서)
    if (prize > 0) {
      p.money += prize
      p.record.lotteryWon += prize
      log(s, p.id, `[운세 ${fortuneName(p.fortune)}] 복권 ${rank}등 당첨! +${won(prize)}`, 'good')
      s.banner = { title: `복권 ${rank}등!`, text: `${p.name} +${won(prize)}`, tone: 'good' }
      if (rank <= 2) say(s, p, 'lotteryWin')
    } else log(s, p.id, '복권 결과: 꽝… 다음 기회에', 'info')
  } else if (isAdultStage(s)) {
    p.lottery.chance = Math.max(10, p.lottery.chance - 10)
  }

  if (isAdultStage(s)) economyTick(s, p)
  else if (stageOf(s).id === 'student') p.money += STUDENT_ALLOWANCE
  fromSavings(s, p, 0) // 마이너스면 적금에서 자동으로
  familyTick(s, p)
  friendLoanTick(s, p)

  if (p.lottery.addicted && rng.chance(0.2)) {
    badEvent(s, p, { text: '도박중독: 몰래 도박으로 돈을 날렸다', loss: scaleOf(s) * 2, happyLoss: 2 })
  }
  if (p.money < 0 && rng.chance(0.25)) {
    badEvent(s, p, { text: '빚 독촉에 시달렸다', loss: 0, happyLoss: 4 })
  }
  // 지난 내 차례가 끝난 뒤 나에게 일어난 일(퇴직금·은퇴·복권·방해 카드·월급 밖의 좋은 일·나쁜 일)을 창으로 (2026-10-22: 기록 창에만 떠서 몰랐음)
  if (p.human && p.lastLog !== undefined) {
    const n = Math.min(s.log.length, Math.max(0, s.logCount - p.lastLog))
    const lines = s.log.slice(s.log.length - n).filter((l) => l.playerId === p.id && !/기한까지 \d+턴/.test(l.text) && (l.tone !== 'info' || /복권|퇴직금|은퇴|연금|월급|입학|축하/.test(l.text))) // 대출 기한 경고는 따로 알림이 떠서 뺌
    if (lines.length) s.popup = { id: (s.popup?.id ?? 0) + 1, art: lines.some((l) => /복권/.test(l.text)) ? 'ticket' : 'money', title: '지난 차례 뒤 일어난 일', text: lines.slice(-6).map((l) => l.text).join('\n'), tone: lines.some((l) => l.tone === 'bad') ? 'bad' : 'good', playerId: p.id }
  }
  const sid = stageOf(s).id
  const lastStudentTurn = sid === 'student' && p.rollsLeft === 1
  const careerJob = p.careerDue ? jobOf(p) : null
  p.careerDue = false
  if (careerJob?.boom && careerJob.id !== 'ceo') {
    const below = p.stats[careerJob.key] < (careerJob.req[careerJob.key] ?? 0) ? ' -1(능력치 부족)' : ''
    const charm = careerJob.id === 'youtuber' ? (p.stats.cha >= 7 ? ' +1(매력)' : p.stats.cha <= 3 ? ' -1(매력)' : '') : ''
    diceCheck(s, p, '커리어 주사위', `${careerJob.name} ${careerJob.ranks[p.jobRank]} · 주사위${luckBonusText(p)}${below}${charm} → 5 이상이면 한 단계 위, 2 이하면 한 단계 아래`, { kind: 'career' })
  } else if (!p.collegeDecided && (lastStudentTurn || sid === 'young')) {
    s.pending = {
      type: 'career', playerId: p.id,
      title: sid === 'student' ? '고등학교 졸업! 진로를 정해요' : '스무 살까지 어떻게 살았나요?',
      text: `대학은 3종류예요. 먼저 수능 주사위를 굴리고(상위권 합격 +15%, 하위권 -10%), 그다음 합격 룰렛. 고른 대학의 능력치가 높을수록 합격 확률이 올라가요. 떨어지면 바로 취업하거나 재수(1번)를 해요.\n지금 능력치 지력 ${p.stats.int} · 체력 ${p.stats.str} · 매력 ${p.stats.cha}\n\n[직업 조건]\n${jobGuide(p, false)}\n\n합격하면 청년이 되어 대학 길 9칸을 주사위로 걸으며(공부·동아리·연애·알바·시험·축제·장학금) 능력치를 키운 뒤 직업을 골라요. 대신 학자금 대출(수능 상위권 0원 · 중간 500만 · 하위권 800만, 이자 2%)이 생기고 그동안 월급이 없어요.`,
      options: [
        ...UNIS.map((u) => ({ id: `uni:${u.stat}`, label: `${u.name} 지원`, desc: `${STAT_NAMES[u.stat]} ${p.stats[u.stat]} → 합격 확률 ${Math.round(passChance(p, u.stat) * 100)}% (수능 상위권 +15%, 하위권 -10%) · 대학 길에서 ${STAT_NAMES[u.stat]}을 키우면 행복 +1` })),
        { id: 'work', label: '바로 취업', desc: '모아 둔 돈 +400만, 청년 첫 차례부터 직업과 월급이 생겨요' },
      ],
    }
  } else if (sid === 'young' && p.retake) {
    s.pending = { type: 'retake', playerId: p.id, title: '재수 1년', text: `${STAT_NAMES[p.retake]} +1 하고 다시 시험을 봐요 (이번 차례는 이걸로 끝나요)`, options: [{ id: 'go', label: '시험 보기' }] }
  } else if (sid === 'young' && p.collegeDecided && !p.college && !p.jobId && p.pos === 0) {
    goToJob(s, p)
  } else if (sid === 'middle' && p.exIdol != null) {
    const r = p.exIdol
    const start = Math.max(0, r - 1) // 전직하면 아이돌 등급에서 한 단계 아래부터 (연습생은 1단계)
    const actor = JOBS.find((j) => j.id === 'actor')!
    const yt = JOBS.find((j) => j.id === 'youtuber')!
    s.pending = {
      type: 'idolNext', playerId: p.id, title: '아이돌 은퇴! 다음 인생은?', text: `아이돌 때 ${JOBS.find((j) => j.id === 'idol')!.ranks[r]} · 매력 ${p.stats.cha}. 배우·유튜버로 가면 아이돌 등급에서 한 단계 아래부터 시작해요.`,
      options: [
        { id: 'actor', label: '🎬 배우 전직', desc: `${actor.ranks[start]}부터 시작해요 · 대박형 · 월급 ${won(actor.salary)}` },
        { id: 'youtuber', label: '📹 유튜버 전직', desc: `${yt.ranks[start]}부터 시작해요 · 대박형 · 월급 ${won(yt.salary)}` },
        { id: 'biz', label: `🏢 창업: ${BUSINESSES.idol.name}`, desc: `자금 ${won(bizCost(p))} · 매력 바탕 · ${r >= 2 ? '톱스타라 중소기업부터' : '소기업부터'}` },
        { id: 'rest', label: '🛋️ 좀 쉬기', desc: '백수가 돼요 (중년 초반 창업 갈림길에서 창업할 수 있어요)' },
      ],
    }
  } else if (sid === 'middle' && p.exAthlete !== null) {
    const ch = Math.round(coachChance(p, p.exAthlete) * 100)
    s.pending = {
      type: 'athleteNext', playerId: p.id, title: '선수 은퇴! 다음 인생은?', text: `선수 때 ${JOBS.find((j) => j.id === 'athlete')!.ranks[p.exAthlete]}${p.medals.length ? ` · 메달 ${p.medals.length}개` : ''} · 체력 ${p.stats.str}`,
      options: [
        { id: 'coach', label: '감독 도전', desc: `룰렛 성공 확률 ${ch}% (체력·선수 성적·메달) · 실패하면 백수가 돼요` },
        { id: 'biz', label: `창업: ${BUSINESSES.athlete.name}`, desc: `자금 ${won(bizCost(p))} · 체력이 바탕이에요 · 소기업부터 시작해요` },
        { id: 'rest', label: '좀 쉬기', desc: '백수가 돼요 (중년 초반 창업 갈림길에서 창업할 수 있어요)' },
      ],
    }
  } else if (sid === 'old' && p.jobId === 'ceo' && p.bizKeep === null) {
    s.pending = {
      type: 'bizRetire', playerId: p.id, title: '사업가의 노년', text: `${p.biz?.name} · ${bizRankOf(p)}`,
      options: [
        { id: 'sell', label: '회사 팔고 은퇴', desc: `+${won(bizSale(p))}` },
        { id: 'keep', label: '계속 경영', desc: `수익 ${BIZ.oldMult}배, 매 턴 행복 -1, 골인할 때 팔아요` },
      ],
    }
  } else if ((sid === 'young' || sid === 'middle') && p.jobId === 'ceo' && p.biz && rng.chance(BIZ_OPP.chance)) {
    bizOpportunity(s, p)
  } else if (sid === 'middle' && p.kids.some((k) => isMinor(k) && k.edu === null)) eduPending(s, p)
  else if (p.agency && !p.spouse && (sid === 'young' || sid === 'middle')) agencyTurn(s, p)
  resume(s)
}

function economyTick(s: GameState, p: Player) {
  const st = stageOf(s)
  const rng = rngOf(s)
  const job = jobOf(p)
  p.money += medalPension(p)
  if (job?.id === 'ceo' && (st.id !== 'old' || p.bizKeep)) bizTick(s, p, st.id === 'old' ? BIZ.oldMult : 1)
  if (st.id !== 'old' && job) p.jobTenure++
  if (st.id !== 'old' && job && job.id !== 'ceo') {
    const sal = Math.round(salaryOf(p) * MOOD_SALARY[moodLevel(p)]) // 우울하면 월급 -15%
    const tax = Math.round(sal * TAX_RATE(sal))
    p.money += sal - tax
    // 성과급: 운세가 좋을수록 자주, 월급의 2배 (2026-10-21)
    if (rng.chance(PERF_BONUS.chance[p.fortune] ?? 0.1)) {
      const bonus = sal * PERF_BONUS.salaries
      p.money += bonus
      log(s, p.id, `[운세 ${fortuneName(p.fortune)}] 성과급! +${won(bonus)}`, 'good')
    }
    p.jobTurns++
    jobPerkTick(s, p)
    // 대박형(아이돌·배우 등): 핵심 능력치가 조건보다 높을수록 매 턴 승진 확률 (넘친 1당 3%)
    if (job.boom && p.jobRank < 2) {
      const over = p.stats[job.key] - (job.req[job.key] ?? 0)
      if (over > 0 && rngOf(s).chance(over * 0.03)) {
        p.jobRank++
        log(s, p.id, `대박! ${job.name} ${job.ranks[p.jobRank]}`, 'good')
        s.banner = { title: '대박 승진!', text: `${p.name}: ${job.ranks[p.jobRank]}`, tone: 'good' }
        say(s, p, 'promoted')
      }
    }
    if (!job.boom && p.jobRank < 2) {
      const fast = p.stats[job.key] >= (job.req[job.key] ?? 0) + 2 || job.id === 'dev'
      const slow = p.stats[job.key] < (job.req[job.key] ?? 0) // 능력치가 조건 밑으로 떨어지면 승진이 느려짐
      if (p.jobTurns >= (fast ? 4 : slow ? 9 : 6)) {
        p.jobRank++
        p.jobTurns = 0
        log(s, p.id, `승진! ${job.name} ${job.ranks[p.jobRank]}`, 'good')
        say(s, p, 'promoted')
      }
    }
  }
  if (p.savings) { // 적금 이자
    const interest = Math.round(p.savings * SAVINGS_RATE)
    p.savings += interest
  }
  const aiKeep = st.id === 'old' ? 500 : st.id === 'middle' ? 5000 : 3000 // AI: 이만큼 남기고 적금에 (상점에서 꺼내 씀)
  if (!p.human && p.money > aiKeep && (st.id === 'old' || p.personality !== 'gambler')) {
    p.savings = (p.savings ?? 0) + p.money - aiKeep
    p.money = aiKeep
  }
  if (p.house) p.happy += HOUSE_HAPPY[p.house] // 내 집: 매 턴 행복 (2026-10-21)
  if (st.id !== 'old' && !job) p.happy += 1 // 백수: 월급은 없지만 여유
  if (st.id === 'old') {
    if (job?.pension) p.money += PENSION
    if (p.retire === 'city') {
      if (rng.chance(0.5)) p.money += 80
      else p.money -= 50
    } else if (p.retire === 'country') p.happy += 1 // 노년 몰림 줄이기 (+2 → +1, 2026-10-17)
  }
  let upkeep = 0
  for (const k of Object.keys(p.insurance) as InsuranceKind[]) if (p.insurance[k]) upkeep += INSURANCE[k].premium
  upkeep += CARS[p.car].upkeep
  upkeep += p.house ? Math.round(houseValue(s, p) * HOUSE_RULES.upkeepRate) : HOUSE_RULES.rent // 집 있으면 관리비·재산세, 없으면 월세
  upkeep += kidUpkeep(s, p)
  if (p.pet?.alive) upkeep += 5
  if (p.agency && !p.spouse && st.id !== 'old') upkeep += p.agency.vip ? 100 : 30
  if (p.spouse?.trait === '짠돌이') upkeep = Math.round(upkeep * 0.8)
  if (p.spouse?.trait === '명품 중독') upkeep += 15
  p.money -= upkeep
  carCrashTick(s, p)
  healthTick(s, p)
  for (const l of p.loans) l.amount = Math.round(l.amount * (l.kind === '주담대' ? 1 + HOUSE_RULES.mortgageRate : 1 + LOAN_RATE))
  mortgageTick(s, p)
  for (const l of p.loans) {
    if (l.kind === '주담대') continue
    const left = l.dueTurn - p.turnsPlayed
    if (left >= 1 && left <= 3) {
      log(s, p.id, `${l.kind ?? '일반'} 대출 ${won(l.amount)} 기한까지 ${left}턴! 못 갚으면 강제 청산`, 'bad')
      if (p.human && (left === 3 || left === 1)) s.banner = { title: `대출 기한 ${left}턴 전`, text: `${won(l.amount)} 갚기 (재테크 → 대출)`, tone: 'bad' }
    }
  }
  const overdue = p.loans.filter((l) => l.kind !== '주담대' && p.turnsPlayed > l.dueTurn)
  if (overdue.length) forceLiquidate(s, p, overdue)
}

// 주택담보대출: 매 턴 정해진 돈이 자동으로 빠짐. 못 내면 연체, 3번이면 집을 경매로 팖
// 적금에서 모자란 만큼 꺼냄 (갚을 돈이 모자랄 때)
export function fromSavings(s: GameState, p: Player, need: number) {
  const amt = Math.min(p.savings ?? 0, Math.max(0, need - p.money))
  if (amt <= 0) return
  p.savings = (p.savings ?? 0) - amt
  p.money += amt
  log(s, p.id, `돈이 모자라 적금에서 ${won(amt)} 꺼냈다`, 'info')
}

function mortgageTick(s: GameState, p: Player) {
  const m = p.loans.find((l) => l.kind === '주담대')
  if (!m) return
  const pay = Math.min(m.amount, m.installment ?? m.amount)
  fromSavings(s, p, pay)
  if (p.money >= pay) {
    p.money -= pay
    m.amount -= pay
    if (m.amount <= 0) { p.loans = p.loans.filter((l) => l !== m); log(s, p.id, '주택담보대출을 다 갚았다! 이제 진짜 내 집', 'good'); s.banner = { title: '대출 끝!', text: `${p.name}: 내 집 마련 완료`, tone: 'good' } }
    return
  }
  m.missed = (m.missed ?? 0) + 1
  log(s, p.id, `주택담보대출 연체 ${m.missed}번째 (${won(pay)}을 못 냄). 3번이면 경매`, 'bad')
  if (p.human) s.banner = { title: `대출 연체 ${m.missed}번`, text: '3번이면 집이 경매로 넘어가요', tone: 'bad' }
  if (m.missed < 3 || !p.house) return
  const sale = Math.round(houseValue(s, p) * HOUSE_RULES.auctionRate)
  const name = HOUSES[p.house].name
  p.house = 0
  p.happy -= 8
  const left = m.amount - sale
  p.loans = p.loans.filter((l) => l !== m)
  if (left > 0) { p.loans.push({ amount: left, dueTurn: p.turnsPlayed + 8, kind: '일반' }); p.creditBad = 8 }
  else p.money += -left
  log(s, p.id, `${josa(name, '이/가')} 경매로 ${won(sale)}에 넘어갔다… 행복 -8${left > 0 ? `, 남은 빚 ${won(left)}은 일반 대출로 · 신용불량` : `, 남은 돈 +${won(-left)}`}`, 'bad')
  s.banner = { title: '집 경매', text: p.name, tone: 'bad' }
}

// 주택담보대출로 집 살 때 필요한 계약금·빌릴 돈·매 턴 갚을 돈
export function mortgagePlan(s: GameState, p: Player, tier: number, coupon = p.chance === 'coupon') {
  const cost = houseCost(s, p, tier, coupon)
  const down = Math.round(cost * HOUSE_RULES.downRate)
  const borrow = cost - down
  return { cost, down, borrow, installment: Math.ceil((borrow * (1 + HOUSE_RULES.mortgageRate * HOUSE_RULES.mortgageTurns / 2)) / HOUSE_RULES.mortgageTurns) }
}
export const hasMortgage = (p: Player) => p.loans.some((l) => l.kind === '주담대')

// ───────── 나쁜 일과 운세 ─────────

export interface Bad { text: string; loss: number; happyLoss: number; kind?: InsuranceKind }

// 운세 덕분에 나쁜 일을 완전히 피했을 때 대사 (사건 글에 들어 있는 낱말로 고름)
const DODGE: [RegExp, string][] = [
  [/무릎 수술/, '무릎이 아팠지만 꾸준히 걸어서 수술까지는 안 갔다'],
  [/보이스피싱/, '전화가 수상해서 끊었다'],
  [/중고/, '판매자가 수상해서 거래를 그만뒀다'],
  [/월세/, '집주인이 월세를 올리려다 말았다'],
  [/비가/, '비 예보가 있었지만 소풍 날 아침에 딱 그쳤다'],
  [/체육복/, '체육복을 놓고 왔지만 옆 반 친구가 빌려줬다'],
  [/사춘기/, '괜히 짜증이 났지만 금방 풀렸다'],
  [/고백/, '고백했더니 생각해 보겠다는 답을 들었다'],
  [/승진/, '동기 승진 소식에도 마음이 편했다'],
  [/허리/, '허리 디스크가 올 뻔했지만 건강검진에서 일찍 발견해 막았다'],
  [/위염/, '속이 쓰렸지만 일찍 약을 먹어서 위염을 피했다'],
  [/독감|감기/, '감기 기운이 있었지만 예방 주사 덕분에 멀쩡했다'],
  [/무릎|넘어져/, '넘어질 뻔했지만 균형을 잡아 다치지 않았다'],
  [/관절|재검/, '몸이 안 좋을 뻔했지만 꾸준한 운동 덕분에 괜찮았다'],
  [/지갑/, '지갑을 잃어버렸지만 경찰서에 갔더니 찾아 줬다'],
  [/싸웠|싸움/, '크게 싸울 뻔했지만 먼저 사과해서 잘 풀었다'],
  [/사고가 났다|접촉|긁/, '사고가 날 뻔했지만 아슬아슬하게 피했다'],
  [/물이 샜|태풍/, '집에 물이 샐 뻔했지만 미리 고쳐 둬서 괜찮았다'],
  [/부도/, '거래처가 흔들렸지만 미리 계약을 정리해서 손해가 없었다'],
  [/구조조정/, '구조조정 소문이 돌았지만 내 자리는 무사했다'],
  [/도박/, '도박 생각이 났지만 꾹 참았다'],
  [/빚 독촉/, '빚 독촉 전화가 왔지만 잘 설명해서 넘겼다'],
  [/소문|연애 방해/, '나쁜 소문이 돌 뻔했지만 친구들이 내 편을 들어 줬다'],
  [/아이가|자녀가/, '아이가 말썽을 피울 뻔했지만 대화로 잘 풀었다'],
  [/액정/, '휴대폰을 떨어뜨렸지만 케이스 덕분에 멀쩡했다'],
  [/지각/, '지각할 뻔했지만 전력으로 뛰어서 겨우 도착했다'],
  [/반려동물/, '반려동물이 말썽을 부릴 뻔했지만 미리 막았다'],
  [/출동/, '출동 중 위험했지만 다치지 않았다'],
  [/술/, '배우자가 술을 마시다 다칠 뻔했지만 무사히 들어왔다'],
  [/보증금/, '보증금 문제가 생길 뻔했지만 계약서 덕분에 해결했다'],
  [/병원비/, '반려동물이 아플 뻔했지만 금방 나았다'],
]

export function badEvent(s: GameState, p: Player, b: Bad) {
  const rng = rngOf(s)
  let loss = b.loss
  if (b.kind === 'health' && p.jobId === 'doctor') loss = Math.round(loss * 0.5)
  if (b.kind && p.insurance[b.kind] && loss > 0) {
    log(s, p.id, `${b.text} → ${INSURANCE[b.kind].name} 덕분에 돈을 돌려받았다`, 'info')
    p.happy -= b.happyLoss
    say(s, p, 'insurancePaid')
    return
  }
  const f = p.fortune
  let mult = 1
  let note = ''
  if (f === 0) { mult = 1.5; note = '더 나빠졌다' }
  else if (f === 1) { mult = 1.2; note = '조금 더 나빠졌다' }
  else if (f === 3 && rng.chance(0.6)) { mult = 0.5; note = '다행히 범인을 잡아 절반은 돌려받았다' }
  else if (f === 4) {
    // 대길: 전화위복 20% · 완전히 피함 50% · 그대로 30% (2026-10-16 사용자: 무조건 피하면 안 됨)
    const r = rng.next()
    if (r < 0.2) {
      const gain = Math.max(Math.round(loss * 0.5), 10)
      p.money += gain
      p.happy += 2
      log(s, p.id, `${b.text} … [대길] 전화위복! 오히려 +${won(gain)}`, 'good')
      return
    }
    if (r < 0.7) { mult = 0; note = '운 좋게 아무 일도 없었다' }
  }
  const dodge = mult === 0 ? DODGE.find(([re]) => re.test(b.text))?.[1] : undefined
  if (dodge) { log(s, p.id, `[운세 ${fortuneName(f)}] ${dodge}`, 'good'); return }
  const ml = Math.round(loss * mult)
  const hl = Math.round(b.happyLoss * mult)
  p.money -= ml
  p.happy -= hl
  const parts = [ml ? `-${won(ml)}` : '', hl ? `행복 -${hl}` : ''].filter(Boolean).join(', ')
  log(s, p.id, `${b.text}${note ? ` … [운세 ${fortuneName(f)}] ${note}` : ''}${parts ? ` (${parts})` : ''}`, mult === 0 ? 'info' : 'bad')
  if (ml >= scaleOf(s) * 4) say(s, p, 'bigLoss')
}

// ───────── 굴리기와 이동 ─────────

export function canAct(s: GameState) {
  return s.phase === 'roll' && !s.pending && !s.mini
}

export const canUseCar = (p: Player) => p.car > 0 && p.carCharges > 0

// useCar: 던지기 전에 자동차 ±1 능력을 쓰겠다고 정함 (쓰면 결과와 상관없이 1번 차감)
// 주사위 아이템이면 그 방식으로 굴림
function throwDice(s: GameState, item: DiceItem | null): { value: number; a: number; b?: number } {
  const rng = rngOf(s)
  if (item === 'twin') { const a = rng.int(1, 6), b = rng.int(1, 6); return { value: a + b, a, b } }
  if (item === 'even') { const a = rng.pick([2, 4, 6]); return { value: a, a } }
  if (item === 'odd') { const a = rng.pick([1, 3, 5]); return { value: a, a } }
  const a = rng.int(1, 6)
  return { value: a, a }
}

export function roll(s: GameState, bonus = 0, useCar = false, item: DiceItem | null = null) {
  if (!canAct(s)) return
  const p = cur(s)
  const rng = rngOf(s)
  const st = stageOf(s)
  if (st.rolls && isEnd(tileOf(s, p))) {
    const restStart = s.logCount
    s.lastRoll = rng.int(1, 6)
    s.dice = { value: s.lastRoll, id: (s.dice?.id ?? 0) + 1 }
    const k = rng.pick(STATS)
    p.stats[k] = clampStat(p.stats[k] + 1)
    p.money += scaleOf(s)
    log(s, p.id, `휴식 칸에서 쉬었다: ${STAT_NAMES[k]} +1, +${won(scaleOf(s))}`, 'good')
    if (rng.chance(0.25) && !p.chance) giveChance(s, p, randomChance(rng))
    showPop(s, p, restStart, 'rest', '휴식 칸')
    endTurn(s)
    return
  }
  const again = s.reroll // 찬스 카드로 다시 굴리는 중: 아이템은 이미 썼고 자동차는 안 씀
  s.reroll = null
  if (again) { bonus = again.bonus; useCar = false }
  const used = again ? again.item : item && p.diceItems.includes(item) ? item : null
  if (used && !again) p.diceItems.splice(p.diceItems.indexOf(used), 1)
  const d = throwDice(s, used)
  s.dice = { value: d.a, second: d.b, id: (s.dice?.id ?? 0) + 1 }
  s.lastRoll = d.value + bonus
  const what = used ? `${DICE_ITEMS[used].name} ` : '주사위 '
  log(s, p.id, `${what}${d.b ? `${d.a} + ${d.b} = ${d.value}` : d.value}${bonus ? ` +${bonus}` : ''}`, 'info')
  const carOn = !used && useCar && canUseCar(p) // 주사위 아이템과 자동차는 같이 못 씀
  if (carOn) {
    p.carCharges--
    log(s, p.id, `${CARS[p.car].name} 능력 사용 (남은 ${p.carCharges}번)`, 'info')
  }
  if (carOn || p.chance === 'reroll') {
    if (p.human) {
      const n = s.lastRoll
      const opts: ChoiceOption[] = carOn
        ? [
            { id: 'minus', label: `-1 → ${n - 1}칸`, disabled: n <= 1 },
            { id: 'keep', label: `+0 → ${n}칸` },
            { id: 'plus', label: `+1 → ${n + 1}칸` },
          ].filter((o) => !o.disabled)
        : [{ id: 'keep', label: `그대로 ${n}칸` }]
      if (p.chance === 'reroll') opts.push({ id: 'reroll', label: '다시 굴리기 (찬스 카드)' })
      s.pending = {
        type: 'afterRoll', playerId: p.id, title: `주사위 ${n}`,
        text: carOn ? `${CARS[p.car].name} 능력: 몇 칸 갈까요?` : '이대로 갈까요?', options: opts,
        data: { item: used, bonus },
      }
      s.phase = 'decision'
      return
    }
    applyAfterRoll(s, p, aiAfterRoll(s, p, s.lastRoll, carOn), used, bonus)
    return
  }
  startMove(s, s.lastRoll)
}

// AI가 보는 k칸 앞 칸의 좋고 나쁨
function aheadValue(s: GameState, p: Player, k: number) {
  const st = stageOf(s)
  const t = st.tiles[walkAhead(st, p.pos, k, p.forkChoice)].kind
  return t === 'risk' ? -3 : t === 'money' || t === 'mini' || t === 'good' ? 2 : t === 'card' || t === 'happy' || t === 'grow' || t === 'date' ? 1 : 0
}

function aiAfterRoll(s: GameState, p: Player, n: number, carOn: boolean): string {
  const st = stageOf(s)
  const kindAt = (k: number) => st.tiles[walkAhead(st, p.pos, k, p.forkChoice)].kind
  const value = (k: number) => aheadValue(s, p, k)
  if (carOn) {
    const cands = [['keep', n], ['plus', n + 1], ...(n > 1 ? [['minus', n - 1]] : [])] as [string, number][]
    const bonus = (k: number) => (st.id === 'old' ? k * 0.5 : 0) // 노년은 골까지 경주
    return cands.reduce((a, c) => (value(c[1]) + bonus(c[1]) > value(a[1]) + bonus(a[1]) ? c : a))[0]
  }
  if (p.chance === 'reroll' && kindAt(n) === 'risk') return 'reroll'
  return 'keep'
}

// AI가 던지기 전에 주사위 아이템을 쓸지 (쓰면 자동차는 못 씀)
export function aiDiceItem(s: GameState, p: Player): DiceItem | null {
  if (!p.diceItems.length) return null
  const st = stageOf(s)
  if (isEnd(tileOf(s, p))) return null
  const avg = (ks: number[]) => ks.reduce((a, k) => a + aheadValue(s, p, k), 0) / ks.length
  const normal = avg([1, 2, 3, 4, 5, 6])
  for (const item of ['even', 'odd'] as const) {
    if (p.diceItems.includes(item) && avg(item === 'even' ? [2, 4, 6] : [1, 3, 5]) >= normal + 0.7) return item
  }
  if (p.diceItems.includes('twin') && (st.id === 'old' || (st.rolls && p.rollsLeft <= 2) || rngOf(s).chance(0.2))) return 'twin'
  if (st.id === 'old' && p.diceItems.includes('even')) return 'even' // 골 경주: 평균 4칸
  return null
}

// AI가 던지기 전에 자동차 능력을 쓸지
export function aiWantsCar(s: GameState, p: Player): boolean {
  if (!canUseCar(p)) return false
  if (stageOf(s).id === 'old') return true
  if (p.rollsLeft <= p.carCharges) return true
  return rngOf(s).chance(0.35)
}

function applyAfterRoll(s: GameState, p: Player, choice: string, item: DiceItem | null = null, bonus = 0) {
  let n = s.lastRoll ?? 1
  if (choice === 'minus' && n > 1) { n -= 1; log(s, p.id, `${josa(CARS[p.car].name, '으로/로')} 1칸 덜 갔다`, 'info') }
  if (choice === 'plus') { n += 1; log(s, p.id, `${josa(CARS[p.car].name, '으로/로')} 1칸 더 갔다`, 'info') }
  if (choice === 'reroll' && p.human) {
    // 사람은 직접 다시 굴림 (2026-10-17 사용자)
    p.chance = null
    s.reroll = { item, bonus }
    s.pending = null
    s.phase = 'roll'
    log(s, p.id, '찬스 카드: 다시 굴리기', 'info')
    return
  }
  if (choice === 'reroll') {
    p.chance = null
    const d = throwDice(s, item) // 주사위 아이템을 썼으면 같은 방식으로 다시
    n = d.value + bonus
    s.dice = { value: d.a, second: d.b, id: (s.dice?.id ?? 0) + 1 }
    log(s, p.id, `찬스 카드로 다시 굴렸다: ${n}`, 'info')
  }
  s.lastRoll = n
  startMove(s, n)
}

function startMove(s: GameState, steps: number) {
  s.move = { remaining: steps, from: cur(s).pos }
  s.path = [cur(s).pos]
  s.pathId++
  s.pathPlayer = cur(s).id
  continueMove(s)
}

function continueMove(s: GameState) {
  const p = cur(s)
  const st = stageOf(s)
  while (s.move && s.move.remaining > 0) {
    const here = st.tiles[p.pos]
    if (isEnd(here)) break
    let to = here.next[0]
    if (here.next.length > 1) {
      if (p.forkChoice == null || !here.next.includes(p.forkChoice)) {
        askFork(s, p, here)
        if (s.pending) { s.phase = 'decision'; return }
      }
      to = p.forkChoice ?? here.next[0]
      p.forkChoice = null
    }
    p.pos = to
    s.path.push(to)
    s.move.remaining--
    const t = st.tiles[p.pos]
    if (t.kind === 'stop' || t.kind === 'goal') s.move.remaining = 0
    if (t.point) {
      triggerPoint(s, p, t.point)
      if (s.pending) { s.phase = 'decision'; return }
    }
  }
  s.move = null
  land(s)
}

export function resume(s: GameState) {
  if (s.phase === 'gameover') return
  if (s.pending) { s.phase = 'decision'; return }
  if (s.mini) { s.phase = 'mini'; return }
  if (s.move) { s.phase = 'roll'; continueMove(s); return }
  if (s.lastRoll === null) { s.phase = 'roll'; return }
  if (s.meetCheck) {
    s.meetCheck = false
    meet(s)
    if (s.pending || s.mini) { resume(s); return }
  }
  endTurn(s)
}

// ───────── 갈림길 ─────────

function askFork(s: GameState, p: Player, t: Tile) {
  const f = t.fork!
  const options: ChoiceOption[] = f.options.map((o) => {
    let disabled = false
    let desc = o.desc
    if (o.road === 'startup') {
      const cost = bizCost(p)
      const biz = p.jobId && p.jobId !== 'ceo' ? BUSINESSES[p.jobId] : null
      desc = `${biz ? `${biz.name} 창업 · 지금 직업은 그만둬요 · ${severanceNote(p)}` : '카페 창업'} · 창업 자금 ${won(cost)}${p.money < cost ? ' (모자라면 빚)' : ''}`
      disabled = p.jobId === 'ceo' || (p.money < cost && p.creditBad > 0)
    }
    return { id: String(o.to), label: o.label, desc, disabled }
  })
  s.pending = { type: 'fork', playerId: p.id, title: f.title, text: f.text, options, data: { tile: p.pos } }
}

function applyForkChoice(s: GameState, p: Player, to: number) {
  const st = stageOf(s)
  const fork = st.tiles[p.pos].fork!
  const opt = fork.options.find((o) => o.to === to)!
  p.forkChoice = to
  log(s, p.id, `${opt.label}로 간다`, 'info')
  applyRoadStart(s, p, opt.road)
}

// 판정 주사위: 사람은 직접 굴림 (2026-10-21 사용자). 굴리면 choose('diceCheck')에서 결과
export const luckBonus = (p: Player) => (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0)
const luckBonusText = (p: Player) => (luckBonus(p) ? ` ${luckBonus(p) > 0 ? '+' : ''}${luckBonus(p)}(운세 ${fortuneName(p.fortune)})` : '')
function diceCheck(s: GameState, p: Player, title: string, text: string, data: Record<string, unknown>) {
  s.pending = { type: 'diceCheck', playerId: p.id, title: `🎲 ${title}`, text, options: [{ id: 'roll', label: '🎲 주사위 굴리기' }], data }
}
function showDice(s: GameState, v: number) { s.dice = { value: v, id: (s.dice?.id ?? 0) + 1 } }
// 대학 지원 (2026-10-21 사용자): 수능 주사위를 먼저 → 점수가 합격 룰렛 확률에 더해짐 → 합격하면 학자금 대출
// after: 처음 지원이면 떨어졌을 때 재수/취업을 묻고, 재수면 묻지 않음
type UniAfter = 'first' | 'retakeYoung' | 'retake'
export const SUNEUNG = { top: 12, mid: 8, bonus: [-0.1, 0, 0.15], loan: [800, 500, 0] } // [하위권, 중간, 상위권]
const suneungGrade = (score: number) => (score >= SUNEUNG.top ? 2 : score >= SUNEUNG.mid ? 1 : 0)
function startUni(s: GameState, p: Player, k: StatKey, after: UniAfter) {
  const u = UNIS.find((x) => x.stat === k)!
  if (p.human) diceCheck(s, p, '수능', `지력 ${p.stats.int} + 주사위${luckBonusText(p)} → ${SUNEUNG.top} 이상 상위권(합격 +15%, 장학금) · ${SUNEUNG.mid} 이상 중간 · 그 밖 하위권(합격 -10%). 그다음 ${u.name} 합격 룰렛`, { kind: 'suneung', k, after })
  else suneung(s, p, rngOf(s).int(1, 6), k, after)
}
function suneung(s: GameState, p: Player, dice: number, k: StatKey, after: UniAfter) {
  const score = p.stats.int + dice + luckBonus(p)
  const g = suneungGrade(score)
  log(s, p.id, `수능: 지력 ${p.stats.int} + 주사위 ${dice}${luckBonusText(p)} → ${['하위권…', '중간', '상위권!'][g]}`, (['bad', 'info', 'good'] as const)[g])
  if (uniTry(s, p, k, SUNEUNG.bonus[g])) {
    const loan = SUNEUNG.loan[g]
    if (loan) p.loans.push({ amount: loan, dueTurn: p.turnsPlayed + 99, kind: '학자금' }) // 기한은 졸업할 때 정함 (졸업 + 8턴)
    log(s, p.id, loan ? `학자금 대출 ${won(loan)}` : '수능 상위권이라 장학금! 학자금 대출 없음', loan ? 'info' : 'good')
    return
  }
  if (after === 'retakeYoung') log(s, p.id, '또 떨어졌다… 다음 차례에 바로 직업을 골라요', 'bad')
  else if (after === 'retake') log(s, p.id, '또 떨어졌다… 바로 일을 하기로 했다', 'bad')
  else s.pending = {
    type: 'uniFail', playerId: p.id, title: '대학 불합격', text: '어떻게 할까요?',
    options: [
      { id: 'retake', label: '재수하기 (1번만)', desc: `다음 차례를 써서 ${STAT_NAMES[k]} +1 하고 다시 도전해요`, disabled: !!p.retook },
      { id: 'work', label: '바로 취업', desc: '지금 능력치로 바로 직업을 골라요' },
    ],
    data: { k },
  }
}

function applyRoadStart(s: GameState, p: Player, road: string) {
  switch (road) {
    case 'college': {
      p.college = true
      p.collegeDecided = true
      p.campusTurns = CAMPUS_TURNS
      // 성인부터 시작한 판이면 지금 바로 대학교로
      if (stageOf(s).id === 'young') p.pos = campusIdx(s)
      break
    }
    case 'work': p.collegeDecided = true; p.money += 400; log(s, p.id, '바로 취업 준비. 모아 둔 돈 +400만', 'good'); if (stageOf(s).id === 'young') goToJob(s, p); break
    case 'startup': {
      // 직장인은 직업에 맞는 회사, 백수는 카페 (2026-10-21: 직장인도 이 길에서 창업, 퇴직금은 setJob에서)
      const biz = p.jobId && BUSINESSES[p.jobId]
      startCompany(s, p, biz ? { ...biz } : { ...CAFE, ranks: [...CAFE.ranks], base: [...CAFE.base], sale: [...CAFE.sale] })
      break
    }
    case 'city': p.retire = 'city'; break
    case 'country': p.retire = 'country'; break
    default: break
  }
}

// ───────── 칸 효과 ─────────

// 행복 칸 장면: 내 상황(배우자·아이·반려동물·단계)에 맞춰 고름
function happyScene(s: GameState, p: Player): { art: string; title: string; text: string; bonus: number } {
  const rng = rngOf(s)
  const sid = stageOf(s).id
  const c: { art: string; title: string; text: string; bonus: number }[] = []
  if (sid === 'child') c.push({ art: 'playground', title: '놀이터', text: '놀이터에서 신나게 놀았다!', bonus: 0 }, { art: 'game', title: '게임', text: '친구네서 게임을 했다!', bonus: 0 })
  else if (sid === 'student') c.push({ art: 'karaoke', title: '노래방', text: '친구들과 노래방에 갔다!', bonus: 0 }, { art: 'friends', title: '떡볶이', text: '친구들과 떡볶이를 먹었다!', bonus: 0 })
  else {
    if (p.spouse) c.push({ art: 'travel', title: '함께 여행', text: `${josa(p.spouse.name, '와/과')} 여행을 다녀왔다!`, bonus: 1 })
    if (p.kids.some((k) => k.result === null)) c.push({ art: 'amusement', title: '놀이동산', text: '아이들과 놀이동산에 갔다!', bonus: 1 })
    if (sid === 'old' && p.kids.length) c.push({ art: 'family', title: '손주', text: '손주들이 놀러 왔다!', bonus: 1 })
    if (p.pet?.alive) c.push({ art: 'walk', title: '산책', text: '반려동물과 공원을 산책했다!', bonus: 0 })
    if (sid === 'old') c.push({ art: 'hike', title: '등산', text: '친구들과 뒷산에 올랐다!', bonus: 0 }, { art: 'garden', title: '텃밭', text: '텃밭에서 상추를 땄다!', bonus: 0 }, { art: 'friends', title: '경로당', text: '경로당 친구들과 수다를 떨었다!', bonus: 0 }, { art: 'friends', title: '동창회', text: '옛 동창을 오랜만에 만났다!', bonus: 0 })
    else if (!c.length || rng.chance(0.3)) c.push({ art: 'rest', title: '푹 쉬기', text: '집에서 푹 쉬었다.', bonus: 0 }, { art: 'game', title: '게임', text: '밤새 게임을 했다!', bonus: 0 }, { art: 'friends', title: '맛집', text: '친구들과 맛집에 갔다!', bonus: 0 })
  }
  return rng.pick(c)
}

export const UNI_NAMES: Record<string, string> = { study: '캠퍼스 생활', club: '동아리', love: '캠퍼스 연애', parttime: '알바', exam: '시험', party: '축제·MT', scholar: '장학금' }
const UNI_ART: Record<string, string> = { study: 'book', club: 'medal', love: 'heart', parttime: 'money', exam: 'warn', party: 'karaoke', scholar: 'grad' }

// 대학 길 칸 사건
function uniTile(s: GameState, p: Player, ev: string) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const up = (k: StatKey, n: number) => { p.stats[k] = clampStat(p.stats[k] + n) }
  switch (ev) {
    case 'study': case 'club':
      s.pending = {
        type: 'growPick', playerId: p.id, title: '캠퍼스 생활', text: '이번엔 무엇을 할까요?',
        options: [
          { id: 'int', label: '📚 도서관에서 공부', desc: `지력 +1${p.major === 'int' ? ' · 전공이라 행복 +1' : ''} (현재 : ${p.stats.int})`, disabled: p.stats.int >= 10 },
          { id: 'cha', label: '🎤 동아리 활동', desc: `매력 +1${p.major === 'cha' ? ' · 전공이라 행복 +1' : ''} (현재 : ${p.stats.cha})`, disabled: p.stats.cha >= 10 },
          { id: 'str', label: '🏃 운동', desc: `체력 +1${p.major === 'str' ? ' · 전공이라 행복 +1' : ''} (현재 : ${p.stats.str})`, disabled: p.stats.str >= 10 },
          ...(STATS.every((k) => p.stats[k] >= 10) ? [{ id: 'rest', label: '☕ 쉬기', desc: '능력치가 모두 10이에요 · 행복 +2' }] : []),
        ],
        data: { add: 1, major: p.major },
      }
      break
    case 'love': up('cha', 1); up('int', -1); p.happy += 3; log(s, p.id, '캠퍼스 커플! 매력 +1, 지력 -1 (공부는 뒷전), 행복 +3', 'good'); break
    case 'parttime': { const m = sc * 2; p.money += m; p.happy -= 1; log(s, p.id, `카페 알바를 했다. +${won(m)}, 행복 -1`, 'good'); break }
    case 'exam':
      if (p.stats.int >= 6 || p.fortune >= 4) { p.happy += 2; log(s, p.id, `시험을 잘 봤다! (지력 ${p.stats.int}) 행복 +2`, 'good') }
      else { up('int', -1); p.happy -= 3; log(s, p.id, '시험을 망쳤다… 지력 -1, 행복 -3', 'bad') }
      break
    case 'party': up('cha', 1); p.happy += 4; log(s, p.id, '축제와 MT! 매력 +1, 행복 +4', 'good'); break
    case 'scholar': {
      const loan = p.loans.find((l) => l.kind === '학자금')
      if (p.stats.int >= 5 && loan) { const cut = Math.min(loan.amount, 300); loan.amount -= cut; p.loans = p.loans.filter((l) => l.amount > 0); log(s, p.id, `장학금! 학자금 대출 -${won(cut)}`, 'good') }
      else if (p.stats.int >= 5) { p.money += 300; log(s, p.id, `장학금! +${won(300)}`, 'good') }
      else { log(s, p.id, `장학금을 아깝게 놓쳤다 (지력 5 이상 필요, 지금 ${p.stats.int})`, 'info') }
      break
    }
  }
  void rng
}

// ───────── 테마 맵 (2026-10-29 사용자): 테마마다 미니게임 1개 + 사건 4개, 가끔 섞여 나옴 ─────────
const THEME_EVENT_CHANCE = 0.25 // 좋은 일·랜덤이벤트 칸 중
export const THEME_MINI_CHANCE = 1 / 3 // 미니게임 칸·단계 끝 대회 중
export const THEME_GAME: Record<MapTheme, MiniId> = { spring: 'butterfly', summer: 'watergun', autumn: 'leaves', winter: 'snowball' }
const THEME_LABEL: Record<MapTheme, string> = { spring: '🌸 봄 이벤트', summer: '☀️ 여름 이벤트', autumn: '🍂 가을 이벤트', winter: '❄️ 겨울 이벤트' }
const themePool = (theme: MapTheme): Partial<Record<StageId, SpecialEvent[]>> => {
  const all = THEME_EVENTS[theme]
  const noStats = all.filter((e) => e.options.every((o) => !o.stats && !o.check?.win.stats))
  return { child: all, student: all, young: all, middle: all, old: noStats }
}

const POP_ART: Record<string, string> = { special: 'card', dilemma: 'card', money: 'money', risk: 'warn', card: 'card', happy: 'rest', date: 'heart', mini: 'medal' }
const POP_TITLE: Record<string, string> = { special: '특별 이벤트', dilemma: '양심 선택', money: '돈 칸', risk: '위기 칸', card: '랜덤이벤트', happy: '행복 칸', date: '연애 칸', mini: '미니게임' }

// 사건 팝업: start 이후 남은 기록(내 것 + 모두에게 일어난 것)을 그림과 함께. 고를 게 있으면 선택 창이 대신 뜸
export function showPop(s: GameState, p: Player, start: number, art: string, title: string) {
  const n = s.logCount - start
  if (n <= 0 || s.pending || s.mini) return
  const lines = s.log.slice(-n).filter((l) => l.playerId === p.id || l.playerId === null)
  if (!lines.length) return
  s.popup = { id: (s.popup?.id ?? 0) + 1, art, title, text: lines.map((l) => l.text).join('\n'), tone: lines.some((l) => l.tone === 'bad') ? 'bad' : lines[0].tone, playerId: p.id }
}

// 좋은 일 칸에서 나올 것: 청년 전에는 행복·능력치, 청년·중년은 돈·능력치·행복, 노년은 돈·행복
// 좋은 일 칸: 성장 몫의 절반은 특별 이벤트 (2026-10-17 사용자, 노년은 능력치가 안 바뀌어서 없음)
type GoodKind = 'money' | 'grow' | 'happy' | 'special' | 'dilemma'
function pickGood(s: GameState): GoodKind {
  const id = stageOf(s).id
  // 양심 선택(운세): 2026-10-21 추가. 노년에도 나옴
  const list: GoodKind[] = id === 'child' || id === 'student' ? ['grow', 'special', 'dilemma', 'dilemma', 'happy', 'happy'] : id === 'old' ? ['money', 'happy', 'dilemma', 'dilemma'] : ['money', 'money', 'grow', 'special', 'dilemma', 'dilemma', 'happy', 'happy']
  return rngOf(s).pick(list)
}

function land(s: GameState) {
  const p = cur(s)
  const t = tileOf(s, p)
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const road = t.road
  const logStart = s.logCount
  const theme = s.settings.theme
  // 테마 맵: 좋은 일·랜덤이벤트 칸의 약 1/4은 테마 사건 (2026-10-29 사용자)
  const kind = theme && (t.kind === 'good' || t.kind === 'card') && rng.chance(THEME_EVENT_CHANCE) ? 'theme' : t.kind === 'good' ? pickGood(s) : t.kind
  let popArt = POP_ART[kind]
  let popTitle = POP_TITLE[kind]
  switch (kind) {
    case 'money': {
      const mult = road === 'startup' ? 2.5 : road === 'work' ? 1.5 : road === 'city' ? (rng.chance(0.5) ? 2 : -1) : 1
      const amt = Math.round(sc * rng.int(2, 5) * mult * (isAdultStage(s) ? ADULT_BONUS_MULT : 1))
      p.money += amt
      log(s, p.id, amt >= 0 ? `${isAdultStage(s) ? '보너스' : '용돈'} +${won(amt)}` : `투자 손실 ${won(amt)}`, amt >= 0 ? 'good' : 'bad')
      break
    }
    case 'grow': {
      const add = 1 // 백수도 다른 직업과 같음 (2026-10-16 사용자: 백수 +1 없앰)
      // 학원 길은 지력, 놀이 길은 매력. 그 밖에는 플레이어가 고름
      if (road === 'academy' || road === 'play') {
        const k: StatKey = road === 'academy' ? 'int' : 'cha'
        p.stats[k] = clampStat(p.stats[k] + add)
        log(s, p.id, `${STAT_NAMES[k]} +${add}`, 'good')
      } else {
        s.pending = {
          type: 'growPick', playerId: p.id, title: t.kind === 'good' ? '좋은 일: 성장' : '성장 칸', text: `무엇을 키울까요? (+${add})`,
          options: [
            ...STATS.map((k) => ({ id: k, label: `${STAT_NAMES[k]} +${add}`, desc: p.stats[k] >= 10 ? '이미 최고 (10)' : `현재 : ${p.stats[k]}`, disabled: p.stats[k] >= 10 })),
            ...(STATS.every((k) => p.stats[k] >= 10) ? [{ id: 'rest', label: '☕ 쉬기', desc: '능력치가 모두 10이에요 · 행복 +2' }] : []),
          ], data: { add },
        }
      }
      break
    }
    case 'happy': {
      const sc2 = happyScene(s, p)
      const h = rng.int(3, 6) + (road === 'country' || road === 'play' ? 1 : 0) + sc2.bonus
      // 절반은 고르는 칸: 크게 놀기(돈 쓰고 +7) / 소소하게(+3) / 일하기(돈 벌고 -1)
      if (rng.chance(0.5)) {
        const cost = sc * 2
        s.pending = {
          type: 'happyPick', playerId: p.id, title: `행복 칸: ${sc2.title}`, text: `${sc2.text.replace(/!$/, '')}… 어떻게 보낼까요? (기분 ${MOOD_FACES[moodLevel(p)]} ${MOOD_NAMES[moodLevel(p)]})`,
          options: [
            { id: 'big', label: '🎉 크게 놀기', desc: `-${won(cost)} · 행복 +7`, disabled: p.money < cost },
            { id: 'small', label: '☕ 소소하게', desc: '돈 안 듦 · 행복 +3' },
            { id: 'work', label: '💼 쉬지 않고 일하기', desc: `+${won(cost)} · 행복 -1` },
          ],
          data: { cost, art: sc2.art },
        }
        popArt = sc2.art
        popTitle = sc2.title
        break
      }
      p.happy += h
      log(s, p.id, `${sc2.text} 행복 +${h}`, 'good')
      popArt = sc2.art
      popTitle = sc2.title
      break
    }
    case 'special': specialTile(s, p, SPECIALS, '특별 이벤트'); break
    case 'dilemma': specialTile(s, p, DILEMMAS, '양심 선택'); break
    case 'risk': riskTile(s, p, road === 'startup' ? 2 : 1); break
    case 'card': drawCard(s, p); break
    case 'date': dateTile(s, p); break
    case 'theme': specialTile(s, p, themePool(theme!), THEME_LABEL[theme!]); break
    case 'mini': {
      // 테마 맵: 미니게임 칸의 약 1/3은 테마 게임 (보상은 원래 칸 게임대로). 카지노·축제 거리(연애)는 그대로
      const g = t.mini!
      const keep = CASINO.includes(g) || (FEST_GAMES.includes(g) && stageOf(s).id === 'young')
      if (theme && !keep && rng.chance(THEME_MINI_CHANCE)) startMini(s, p, THEME_GAME[theme], undefined, g)
      else startMini(s, p, g)
      break
    }
    case 'stop':
      if (t.stop === 'job' && p.campusTurns > 0) {
        p.campusTurns = 0
        for (const l of p.loans) if (l.kind === '학자금') l.dueTurn = p.turnsPlayed + 8 // 학자금은 졸업 뒤 8턴 안에
        log(s, p.id, `대학 졸업! 이제 직업을 골라요${p.loans.some((l) => l.kind === '학자금') ? ' (학자금은 8턴 안에 갚기)' : ''}`, 'good')
        s.banner = { title: '대학 졸업', text: p.name, tone: 'good' }
      }
      stopTile(s, p, t)
      break
    case 'uni': uniTile(s, p, t.uni!); popArt = UNI_ART[t.uni!]; popTitle = UNI_NAMES[t.uni!]; break
    case 'rest': log(s, p.id, '단계 끝 휴식 칸에 도착했다', 'info'); break
    case 'goal': break
  }
  // 칸 사건 팝업: 고를 게 없으면 이번 칸 기록을 그림과 함께 보여 줌 (화면에서 저절로 꺼짐)
  if (kind === 'money') popTitle = isAdultStage(s) ? '보너스!' : '용돈!'
  if (popArt) showPop(s, p, logStart, popArt, popTitle)
  s.meetCheck = true
  resume(s)
}

function riskTile(s: GameState, p: Player, mult: number) {
  const rng = rngOf(s)
  const sc = scaleOf(s) * mult
  const opts: Bad[] = [
    { text: '감기에 걸려 병원에 갔다', loss: sc * 2, happyLoss: 2, kind: 'health' },
    { text: '지갑을 잃어버렸다', loss: sc * 3, happyLoss: 1 },
    { text: '친구와 크게 싸웠다', loss: 0, happyLoss: 5 },
  ]
  if (mult > 1) opts.push({ text: '사업 거래처가 부도났다', loss: sc * 4, happyLoss: 3 })
  if (p.house) opts.push({ text: '집에 물이 샜다', loss: sc * 4, happyLoss: 1, kind: 'property' })
  badEvent(s, p, rng.pick(opts))
}

export function giveChance(s: GameState, p: Player, card: ChanceCard) {
  if (p.chance && p.chance !== card) {
    s.pending = {
      type: 'cardSwap', playerId: p.id, title: '찬스 카드는 1장만', text: '어느 카드를 가질까요?',
      options: [{ id: 'old', label: `가진 카드: ${CHANCE_NAMES[p.chance]}` }, { id: 'new', label: `새 카드: ${CHANCE_NAMES[card]}` }],
      data: { kind: 'chance', card },
    }
    return
  }
  p.chance = card
  log(s, p.id, `찬스 카드 획득: ${CHANCE_NAMES[card]}`, 'good')
}

function giveSabotage(s: GameState, p: Player, card: SabotageCard) {
  if (p.sabotage && p.sabotage !== card) {
    s.pending = {
      type: 'cardSwap', playerId: p.id, title: '방해 카드는 1장만', text: '어느 카드를 가질까요?',
      options: [{ id: 'old', label: `가진 카드: ${SABOTAGE_NAMES[p.sabotage]}` }, { id: 'new', label: `새 카드: ${SABOTAGE_NAMES[card]}` }],
      data: { kind: 'sabotage', card },
    }
    return
  }
  p.sabotage = card
  log(s, p.id, `방해 카드 획득: ${SABOTAGE_NAMES[card]}`, 'info')
}

export const randomChance = (rng: Rng) => rng.pick(['reroll', 'block', 'charm', 'coupon'] as ChanceCard[]) // 지름길(+2)은 없앰 (2026-10-23 사용자)

// 특별 이벤트: 단계별 사건 중 하나를 골라 물어봄 (special.ts)
function specialTile(s: GameState, p: Player, pool: typeof SPECIALS, kind: string) {
  const list = pool[stageOf(s).id]
  if (!list?.length) { p.happy += 2; log(s, p.id, '좋은 하루였다. 행복 +2', 'good'); return }
  const ev = rngOf(s).pick(list)
  const sc = scaleOf(s)
  // 올리는 능력치가 모두 10이고 다른 좋은 점이 없으면 못 고름
  const maxed = (o: SpecialOption) => !!o.stats && !o.happy && Object.values(o.stats).some((v) => v! > 0) && Object.entries(o.stats).every(([k, v]) => v! <= 0 || p.stats[k as StatKey] >= 10)
  s.pending = {
    type: 'special', playerId: p.id, title: `${kind}: ${ev.title}`, text: ev.text,
    options: ev.options.map((o) => ({ id: o.id, label: o.label, desc: specialDesc(o, sc, won), disabled: (!!o.cost && o.cost * sc > p.money) || maxed(o) })),
    data: { ev: ev.id },
  }
}
const statLine = (st?: Partial<Record<StatKey, number>>) => Object.entries(st ?? {}).map(([k, v]) => `${STAT_NAMES[k as StatKey]} ${v! > 0 ? '+' : ''}${v}`).join(', ')
function applySpecial(s: GameState, p: Player, ev: SpecialEvent, o: SpecialOption, dice?: number): boolean {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const addStats = (st?: Partial<Record<StatKey, number>>) => { for (const [k, v] of Object.entries(st ?? {})) p.stats[k as StatKey] = clampStat(p.stats[k as StatKey] + v!) }
  const parts: string[] = []
  if (o.cost) { spend(p, o.cost * sc); parts.push(`-${won(o.cost * sc)}`) }
  if (o.gain) { p.money += o.gain * sc; parts.push(`+${won(o.gain * sc)}`) }
  addStats(o.stats)
  if (o.stats) parts.push(statLine(o.stats))
  if (o.happy) { p.happy += o.happy; parts.push(`행복 ${o.happy > 0 ? '+' : ''}${o.happy}`) }
  let good = (o.happy ?? 0) >= 0
  if (o.check) {
    const roll = dice ?? rng.int(1, 6)
    const ok = p.stats[o.check.stat] + roll >= o.check.need
    const r = ok ? o.check.win : o.check.lose
    const before = p.stats[o.check.stat]
    addStats(r.stats)
    if (r.happy) p.happy += r.happy
    parts.push(`${STAT_NAMES[o.check.stat]} ${before} + 주사위 ${roll} → ${ok ? '성공!' : '실패'}${r.stats ? ` ${statLine(r.stats)}` : ''}${r.happy ? ` 행복 ${r.happy > 0 ? '+' : ''}${r.happy}` : ''}`)
    good = ok
  }
  if (o.othersHappy) for (const q of s.players) if (q.id !== p.id) q.happy += o.othersHappy
  if (o.risk && rng.chance(o.risk.chance)) {
    addStats(o.risk.stats)
    if (o.risk.happy) p.happy += o.risk.happy
    parts.push(`(${[statLine(o.risk.stats), o.risk.happy ? `행복 ${o.risk.happy}` : ''].filter(Boolean).join(', ')})`)
    if ((o.risk.happy ?? 0) < 0 || Object.values(o.risk.stats ?? {}).some((v) => v! < 0)) good = false
  }
  log(s, p.id, `[${ev.title}] ${o.label.replace(/^\S+ /, '')}${parts.length ? ` · ${parts.join(' · ')}` : ''}`, good ? 'good' : 'bad')
  if (o.othersHappy) log(s, null, `${p.name} 덕분에 모두 행복 +${o.othersHappy}`, 'good')
  if (o.luck) changeFortune(s, p, o.luck, ev.title)
  return good
}

// 지갑 줍기: 돌려주면 사례금·운세↑, 가지면 돈 더·운세↓ (2026-10-21)
function walletPick(s: GameState, p: Player) {
  const sc = scaleOf(s)
  s.pending = {
    type: 'wallet', playerId: p.id, title: '지갑을 주웠다', text: '길에서 두툼한 지갑을 주웠어요.',
    options: [
      { id: 'return', label: '👮 주인 찾아주기', desc: `사례금 +${won(sc * 3)} · 운세 ↑` },
      { id: 'keep', label: '🤫 내가 갖기', desc: `+${won(sc * 8)} · 행복 +2 · 운세 ↓` },
    ],
    data: { sc },
  }
}

function drawCard(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const adult = isAdultStage(s)
  const r = rng.next()
  if (r < 0.12) return giveChance(s, p, randomChance(rng))
  if (adult && r < 0.2) return giveSabotage(s, p, rng.pick(['rumor', 'stockRumor', 'love', 'lawsuit'] as SabotageCard[]))
  const deck: (() => void)[] = [
    () => walletPick(s, p),
    () => { p.happy += 3; p.record.deeds++; log(s, p.id, '봉사활동을 했다. 행복 +3 (선행)', 'good'); changeFortune(s, p, 1, '봉사활동') },
    // 노년에는 랜덤이벤트로 능력치가 오르내리지 않음 (2026-10-17 사용자)
    ...(stageOf(s).id === 'old' ? [] : [
      () => { p.stats.int = clampStat(p.stats.int + 1); log(s, p.id, '책을 많이 읽었다. 지력 +1', 'good') },
      () => { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, '운동을 시작했다. 체력 +1', 'good') },
      () => { p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '패션 감각이 늘었다. 매력 +1', 'good') },
    ]),
    () => badEvent(s, p, { text: '휴대폰 액정이 깨졌다', loss: sc * 2, happyLoss: 1 }),
    () => contest(s, p),
    () => everyoneDraw(s),
    () => changeFortune(s, p, -1, rngOf(s).pick(['검은 고양이가 앞을 지나감', '거울을 깨뜨림', '불길한 꿈을 꿈'])), // 운이 좋아도 가끔 내려가는 일
  ]
  // 단계별 카드 (그 나이에 맞는 일)
  const id = stageOf(s).id
  const stageCards: Record<string, (() => void)[]> = {
    child: [
      () => { p.happy += 3; log(s, p.id, '선생님께 칭찬 스티커를 받았다. 행복 +3', 'good') },
      () => badEvent(s, p, { text: '친구랑 싸웠다', loss: 0, happyLoss: 3 }),
      () => { p.money += sc * 2; log(s, p.id, `세뱃돈을 받았다 +${won(sc * 2)}`, 'good') },
      () => { p.stats.int = clampStat(p.stats.int + 1); log(s, p.id, '받아쓰기 100점! 지력 +1', 'good') },
      () => { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, '줄넘기 2단 뛰기 성공! 체력 +1', 'good') },
      () => { p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '장래희망 발표에서 박수를 받았다. 매력 +1', 'good') },
      () => { p.money += sc; log(s, p.id, `이를 뺐더니 베개 밑에 동전이 있었다 +${won(sc)}`, 'good') },
      () => badEvent(s, p, { text: '소풍 날 비가 왔다', loss: 0, happyLoss: 2 }),
      () => badEvent(s, p, { text: '놀이터에서 넘어져 무릎이 까졌다', loss: sc, happyLoss: 1, kind: 'health' }),
    ],
    student: [
      // 능력치가 떨어지는 일 (2026-10-17 사용자: 오르는 일이 많아서)
      () => { p.stats.int = clampStat(p.stats.int - 1); log(s, p.id, '밤새 게임하다 성적이 떨어졌다. 지력 -1', 'bad') },
      () => { p.stats.str = clampStat(p.stats.str - 1); log(s, p.id, '하루 종일 앉아만 있었다. 체력 -1', 'bad') },
      () => { p.stats.int = clampStat(p.stats.int + 1); p.happy += 2; log(s, p.id, '시험 100점! 지력 +1, 행복 +2', 'good') },
      () => badEvent(s, p, { text: '지각해서 벌을 섰다', loss: 0, happyLoss: 2 }),
      () => { p.money += sc * 3; log(s, p.id, `아르바이트 월급 +${won(sc * 3)}`, 'good') },
      () => { p.stats.cha = clampStat(p.stats.cha + 1); p.happy += 2; log(s, p.id, '반장 선거 당선! 매력 +1, 행복 +2', 'good') },
      () => { p.stats.int = clampStat(p.stats.int + 1); p.money -= sc; log(s, p.id, `독서실 등록. 지력 +1, -${won(sc)}`, 'good') },
      () => { p.happy += 4; p.money -= sc * 2; log(s, p.id, `수학여행! 행복 +4, -${won(sc * 2)}`, 'good') },
      () => { p.happy += 3; p.money -= sc * 2; log(s, p.id, `첫 휴대폰이 생겼다. 행복 +3, -${won(sc * 2)}`, 'good') },
      () => badEvent(s, p, { text: '체육복을 놓고 와서 벌점을 받았다', loss: 0, happyLoss: 1 }),
      () => badEvent(s, p, { text: '사춘기라 괜히 다 싫다', loss: 0, happyLoss: 3 }),
      () => { badEvent(s, p, { text: '짝사랑에게 고백했다가 차였다', loss: 0, happyLoss: 2 }); p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '그래도 용기를 낸 덕분에 매력 +1', 'good') },
    ],
    young: [
      // 능력치가 떨어지는 일 (2026-10-17 사용자: 오르는 일이 많아서)
      () => { p.stats.str = clampStat(p.stats.str - 1); log(s, p.id, '야근이 이어져 운동을 못 했다. 체력 -1', 'bad') },
      () => { p.stats.int = clampStat(p.stats.int - 1); log(s, p.id, '책을 한 권도 안 읽었다. 지력 -1', 'bad') },
      () => { p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '첫 월급으로 옷을 샀다. 매력 +1', 'good') },
      () => badEvent(s, p, { text: '자취방 보증금 문제', loss: sc * 2, happyLoss: 1, kind: 'property' }),
      () => { p.stats.int = clampStat(p.stats.int + 1); log(s, p.id, '자격증 합격! 지력 +1', 'good') },
      () => { p.stats.str = clampStat(p.stats.str + 1); p.money -= sc; log(s, p.id, `헬스장 1년 등록. 체력 +1, -${won(sc)}`, 'good') },
      () => { p.happy += 4; p.money -= sc * 2; log(s, p.id, `혼자 여행을 떠났다. 행복 +4, -${won(sc * 2)}`, 'good') },
      () => { p.money -= sc; log(s, p.id, `친구 결혼식 축의금 -${won(sc)}`, 'info') },
      () => badEvent(s, p, { text: '중고 거래 사기를 당했다', loss: sc * 2, happyLoss: 2 }),
      () => {
        if (p.house) { p.happy += 1; log(s, p.id, '친구들 월세가 올랐다는 소식. 내 집이 있어 다행이다 (행복 +1)', 'good') }
        else badEvent(s, p, { text: '월세가 올랐다', loss: sc * 2, happyLoss: 0 })
      },
    ],
    middle: [
      // 능력치가 떨어지는 일 (2026-10-17 사용자: 오르는 일이 많아서)
      () => { p.stats.cha = clampStat(p.stats.cha - 1); log(s, p.id, '배가 나오기 시작했다. 매력 -1', 'bad') },
      () => { p.stats.str = clampStat(p.stats.str - 1); log(s, p.id, '허리가 아프기 시작했다. 체력 -1', 'bad') },
      () => badEvent(s, p, { text: '건강검진에서 재검 판정', loss: sc * 2, happyLoss: 2, kind: 'health' }),
      () => { p.happy += 4; log(s, p.id, '오랜 친구들과 동창회. 행복 +4', 'good') },
      () => { p.stats.str = clampStat(p.stats.str + 1); p.happy += 2; log(s, p.id, '마라톤 완주! 체력 +1, 행복 +2', 'good') },
      () => { p.stats.cha = clampStat(p.stats.cha + 1); p.money -= sc * 2; log(s, p.id, `골프를 시작했다. 매력 +1, -${won(sc * 2)}`, 'good') },
      () => { p.happy += 3; p.money -= sc * 2; log(s, p.id, `부모님 칠순 잔치. 행복 +3, -${won(sc * 2)}`, 'good') },
      () => {
        if (p.kids.length) { p.money -= sc * 2; log(s, p.id, `아이 학원비 -${won(sc * 2)}`, 'info') }
        else { p.happy += 2; log(s, p.id, '조카에게 학원비 이야기를 들었다. 나는 홀가분 (행복 +2)', 'good') }
      },
      () => badEvent(s, p, { text: '허리 디스크가 왔다', loss: sc * 2, happyLoss: 2, kind: 'health' }),
      () => badEvent(s, p, { text: '동기가 먼저 승진했다', loss: 0, happyLoss: 2 }),
    ],
    old: [
      () => { if (p.kids.length) { p.happy += 5; log(s, p.id, '손주가 찾아왔다. 행복 +5', 'good') } else { p.happy += 3; log(s, p.id, '옛 친구가 놀러 왔다. 행복 +3', 'good') } },
      () => badEvent(s, p, { text: '관절이 쑤신다', loss: sc, happyLoss: 2, kind: 'health' }),
      () => { p.happy += 4; log(s, p.id, '자서전을 썼다. 행복 +4', 'good') },
      () => { p.happy += 3; log(s, p.id, '노인 대학에 입학했다. 행복 +3', 'good') },
      () => { p.happy += 2; log(s, p.id, '옛 사진을 정리했다. 행복 +2', 'good') },
      () => {
        if (p.kids.length) { p.money -= sc; p.happy += 3; log(s, p.id, `손주에게 용돈을 줬다. -${won(sc)}, 행복 +3`, 'good') }
        else { p.happy += 2; log(s, p.id, '동네 아이들에게 사탕을 나눠 줬다. 행복 +2', 'good') }
      },
      () => badEvent(s, p, { text: '보이스피싱 전화에 속았다', loss: sc * 3, happyLoss: 2 }),
      () => badEvent(s, p, { text: '무릎 수술을 받았다', loss: sc * 2, happyLoss: 2, kind: 'health' }),
    ],
  }
  deck.push(...stageCards[id], ...stageCards[id]) // 단계 카드가 더 자주 나오게
  const ceo = p.jobId === 'ceo'
  if (adult && p.jobId && id !== 'old') {
    deck.push(() => {
      const safe = ['civil', 'teacher', 'police', 'fire'].includes(p.jobId!)
      if (safe) { p.happy += 1; log(s, p.id, '회사들이 구조조정… 공무원이라 무사했다 (행복 +1)', 'good'); return }
      if (ceo) { badEvent(s, p, { text: '경기가 나빠져 거래처 주문이 줄었다', loss: sc * 2, happyLoss: 2 }); return } // 사업가는 월급이 없어서
      const job = jobOf(p)
      if (job && !job.boom && job.id !== 'civil' && p.jobRank > 0 && p.fortune <= 2) { p.jobRank--; log(s, p.id, `구조조정으로 ${job.ranks[p.jobRank]}(으)로 밀려났다`, 'bad') }
      else badEvent(s, p, { text: '회사 구조조정으로 월급이 깎였다', loss: sc * 2, happyLoss: 2 })
    })
  }
  if (adult) {
    const invest = () => {
      s.pending = {
        type: 'invest', playerId: p.id, title: '투자 권유', text: `친구가 ${won(sc * 3)}을 투자하자고 한다. 결과는 운세에 달렸다.`,
        options: [{ id: 'yes', label: `투자한다 (-${won(sc * 3)})`, desc: p.money < sc * 3 ? '돈이 모자라요' : ceo && id !== 'old' ? '사업가 투자 감각: 운세가 평이면 꼭 성공해요' : undefined, disabled: p.money < sc * 3 }, { id: 'no', label: '거절한다' }], data: { cost: sc * 3 },
      }
    }
    deck.push(invest)
    if (ceo && id !== 'old') deck.push(invest, invest) // 사업가 특성: 투자 권유가 자주
    if (id !== 'old') deck.push(() => {
      const k = rng.pick(STATS)
      p.stats[k] = clampStat(p.stats[k] - 1)
      log(s, p.id, `바빠서 자기 관리를 못 했다. ${STAT_NAMES[k]} -1`, 'bad')
    })
    if (p.jobId && id !== 'old') { // 노년은 은퇴해서 직업 기록(연금용)만 남아 있음
      const overtime = () => {
        s.pending = {
          type: 'overtime', playerId: p.id, title: ceo ? '급한 주문' : '야근 부탁', text: ceo ? '거래처에서 급한 주문이 들어왔다. 밤새 일하면 맞출 수 있다.' : '회사에서 야근을 부탁한다.',
          options: [{ id: 'yes', label: '한다', desc: `+${won(sc)}, 행복 -3` }, { id: 'no', label: '거절한다', desc: '행복 +2' }], data: { amt: sc },
        }
      }
      deck.push(overtime)
      if (p.jobId === 'office') deck.push(overtime, overtime) // 회사원은 야근 카드가 자주
      deck.push(() => {
        const tax = Math.round(salaryOf(p) * 0.5)
        s.pending = {
          type: 'taxEvade', playerId: p.id, title: '세금 안 내기?', text: `이번 세금 ${won(tax)}을 안 낼 기회가 생겼다. 걸리면 세금에 벌금까지.`,
          options: [{ id: 'yes', label: '안 낸다 (운세에 맡김)' }, { id: 'no', label: '정직하게 낸다' }], data: { tax },
        }
      })
    }
    if (s.players.some((q) => q.house)) deck.push(() => everyoneStorm(s))
    if (!p.pet?.alive && s.stageIdx <= 3) deck.push(() => {
      s.pending = {
        type: 'stray', playerId: p.id, title: '유기견을 만났다', text: '길에서 떠도는 강아지가 따라온다. 키울까요?',
        options: [{ id: 'yes', label: '키운다', desc: '매 턴 행복 +1, 사료값이 들어요 (선행)' }, { id: 'no', label: '보호소에 데려다준다' }],
      }
    })
  }
  rng.pick(deck)()
}

export function contest(s: GameState, p: Player) {
  const rng = rngOf(s)
  const k = rng.pick(STATS)
  const name = { int: '퀴즈 대회', str: '체육대회', cha: '노래자랑' }[k]
  const score = p.stats[k] + rng.int(1, 6)
  const sc = scaleOf(s)
  if (score >= 12) { p.money += sc * 3; p.happy += 4; log(s, p.id, `${name} 1등! (${STAT_NAMES[k]} 덕분) +${won(sc * 3)}`, 'good') }
  else if (score >= 9) { p.money += sc; p.happy += 2; log(s, p.id, `${name} 준우승! +${won(sc)}`, 'good') }
  else { p.happy += 1; log(s, p.id, `${name}에 나갔지만 입상은 못 했다`, 'info') }
}

function everyoneDraw(s: GameState) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const rolls = s.players.map((q) => ({ q, v: rng.int(1, 6) }))
  const best = Math.max(...rolls.map((r) => r.v))
  const winners = rolls.filter((r) => r.v === best)
  const prize = Math.round((sc * 5) / winners.length)
  for (const w of winners) w.q.money += prize
  log(s, null, `[다 같이] 동창회 경품 추첨! ${rolls.map((r) => `${r.q.name} ${r.v}`).join(', ')} → ${winners.map((w) => w.q.name).join(', ')} +${won(prize)}`, 'good')
}

function everyoneStorm(s: GameState) {
  const sc = scaleOf(s)
  log(s, null, '[다 같이] 태풍이 왔다! 집이 있는 사람은 피해', 'bad')
  for (const q of s.players) if (q.house) badEvent(s, q, { text: '태풍 피해', loss: sc * 4, happyLoss: 1, kind: 'property' })
}

// ───────── 정지 칸 ─────────

// 바로 취업: 주사위 없이 본 길 직업 칸으로 가서 바로 고름
function goToJob(s: GameState, p: Player) {
  const st = stageOf(s)
  if (p.pos !== 0) return
  const jobIdx = st.tiles.findIndex((t) => t.stop === 'job')
  p.pos = jobIdx
  stopTile(s, p, st.tiles[jobIdx])
}

// 룰렛 연출: 결과는 이미 정해져 있고 화면이 돌려서 보여 줌
function spinRoulette(s: GameState, p: Player, title: string, chance: number, ok: boolean) {
  s.roulette = { id: (s.roulette?.id ?? 0) + 1, title, chance, ok, playerId: p.id }
}

// 대학 3종: 능력치가 높을수록 합격 (룰렛)
export const UNIS: { stat: StatKey; name: string }[] = [{ stat: 'int', name: '일반대' }, { stat: 'str', name: '체대' }, { stat: 'cha', name: '예대·방송대' }]
export const passChance = (p: Player, k: StatKey) => Math.min(0.95, 0.15 + p.stats[k] * 0.09)
function uniTry(s: GameState, p: Player, k: StatKey, bonus = 0) {
  const u = UNIS.find((x) => x.stat === k)!
  const ch = Math.max(0.05, Math.min(0.95, passChance(p, k) + bonus))
  const ok = rngOf(s).next() < ch
  spinRoulette(s, p, `${u.name} 합격 룰렛`, ch, ok)
  if (ok) {
    p.major = k
    log(s, p.id, `🎯 ${u.name} 합격! (확률 ${Math.round(ch * 100)}%)`, 'good')
    s.banner = { title: `${u.name} 합격!`, text: p.name, tone: 'good' }
    say(s, p, 'uniPass')
    applyRoadStart(s, p, 'college')
    return true
  }
  log(s, p.id, `${u.name} 불합격… (확률 ${Math.round(ch * 100)}%)`, 'bad')
  say(s, p, 'uniFail')
  return false
}

// 직업 조건 한눈에 보기 (진로·직업 선택 창 설명에 붙임). ✅ = 지금 조건이 됨
export function jobGuide(p: Player, collegeAssumed = p.college) {
  const short = { int: '지력', str: '체력', cha: '매력' } as const
  return JOBS.filter((j) => j.id !== 'ceo' && j.id !== 'coach' && j.id !== 'actor').map((j) => {
    const req = (Object.keys(j.req) as StatKey[]).map((k) => `${short[k]} ${j.req[k]}`).join('·')
    const ok = (!j.college || collegeAssumed) && (Object.keys(j.req) as StatKey[]).every((k) => p.stats[k] >= (j.req[k] ?? 0))
    return `${ok ? '✅' : '·'} ${j.name} (${req}${j.college ? ' · 🎓대학 필수' : ''}) 월급 ${won(j.salary)}`
  }).join('\n')
}

function jobOptions(s: GameState, p: Player, includeStay: boolean): ChoiceOption[] {
  const quit = (id: string) => (p.jobId && id !== p.jobId ? `
💰 ${severanceNote(p)}` : '') // 지금 직업을 그만두게 되면 퇴직금 안내
  const opts: ChoiceOption[] = eligibleJobs(p, s.stageIdx).filter((j) => !includeStay || j.id !== p.jobId).map((j) => ({
    id: `job:${j.id}`, label: j.name,
    desc: `${j.boom ? '대박형' : '꾸준형'} · 월급 ${won(j.salary)} · ${j.ranks.join(' → ')}${JOB_PROS_CONS[j.id] ? `
👍 ${JOB_PROS_CONS[j.id][0]}
👎 ${JOB_PROS_CONS[j.id][1]}` : ` · ${j.note}`}${quit(j.id)}`,
  }))
  const biz = p.jobId ? BUSINESSES[p.jobId] : null
  if (includeStay && biz && stageOf(s).id === 'middle') {
    opts.push({ id: 'biz', label: `창업: ${biz.name}`, desc: `자금 ${won(bizCost(p))}${p.jobId === 'chef' ? ' (요리사 할인)' : ''} · ${STAT_NAMES[biz.stat]} ${p.stats[biz.stat]}이 바탕이에요 · 소기업부터 시작해요 · ${severanceNote(p)}`, disabled: p.money < bizCost(p) && p.creditBad > 0 })
  }
  opts.push({ id: includeStay ? 'stay' : 'jobless', label: includeStay ? (p.jobId ? '지금 그대로' : '계속 백수로') : '백수로 지내기', desc: includeStay ? '' : `월급 없음
👍 ${JOB_PROS_CONS.none[0]}
👎 ${JOB_PROS_CONS.none[1]}${quit('')}` })
  return opts
}

function stopTile(s: GameState, p: Player, t: Tile) {
  switch (t.stop) {
    case 'club':
      s.pending = { type: 'club', playerId: p.id, title: '동아리', text: '어떤 동아리에 들어갈까요?', options: [{ id: 'int', label: '공부 동아리', desc: '지력 +1' }, { id: 'str', label: '운동부', desc: '체력 +1' }, { id: 'cha', label: '예체능', desc: '매력 +1' }] }
      break
    case 'job':
      s.pending = { type: 'job', playerId: p.id, title: '직업 선택', text: `지력 ${p.stats.int} · 체력 ${p.stats.str} · 매력 ${p.stats.cha}${p.college ? ' · 대학 졸업' : ''}\n\n${jobGuide(p)}`, options: jobOptions(s, p, false) }
      break
    case 'promotion': {
      // 승진 심사: 지금 직업의 핵심 능력치가 조건 이상이면 무조건 한 단계 위로
      const job = jobOf(p)
      if (job?.id === 'ceo' && p.biz) { bizReview(s, p); break }
      if (!job || job.id === 'ceo') { log(s, p.id, '승진 심사: 직장이 없어 그냥 지나갔다', 'info'); break }
      const need = job.req[job.key] ?? 0
      if (p.jobRank >= 2) { p.happy += 2; log(s, p.id, `승진 심사: 이미 ${job.ranks[2]}! 행복 +2`, 'good'); break }
      if (p.stats[job.key] >= need) {
        p.jobRank++
        p.jobTurns = 0
        log(s, p.id, `승진 심사 통과! ${job.name} ${job.ranks[p.jobRank]}`, 'good')
        s.banner = { title: '승진!', text: `${p.name}: ${job.ranks[p.jobRank]}`, tone: 'good' }
        say(s, p, 'promoted')
      } else log(s, p.id, `승진 심사 탈락 (${STAT_NAMES[job.key]} ${need} 필요)`, 'bad')
      break
    }
    case 'middleBranch': {
      const opts: ChoiceOption[] = []
      if (p.spouse && p.children + p.adopted === 0) opts.push({ id: 'adopt', label: '입양하기', desc: `5~8살 아이 · 지원금 +${won(KIDS.adoptGrant)}, 어른이 되면 용돈을 줘요 (중년에 1번만)` })
      if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 키우기', desc: '매 턴 행복 +1, 사료값이 들어요' })
      opts.push({ id: 'none', label: '지금처럼 살기' })
      s.pending = { type: 'middleBranch', playerId: p.id, title: '새 가족', text: '새 가족을 맞을까요?', options: opts }
      break
    }
  }
}

export const CAMPUS_TURNS = 1 // 0보다 크면 대학 길을 걷는 중 (직업 칸에 닿으면 0)
const campusIdx = (s: GameState) => stageOf(s).tiles.findIndex((t) => t.kind === 'campus')

function sectorPending(p: Player, title: string, list: Sector[]) {
  return {
    type: 'sector', playerId: p.id, title, text: '고른 분야의 주가가 내 성과에 따라 오르내려요.',
    options: list.map((k) => ({ id: k, label: k })),
  }
}

// 직업별 특징 (docs/02-character.md). 2026-10-23 사용자: 좋은 점·나쁜 점을 확실하게, 발동하면 [직업] 표시
function jobPerkTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const job = jobOf(p)
  if (!job) return
  const tag = jobTag(job)
  const up = (n: number, text: string) => { p.happy += n; log(s, p.id, `${tag}${text} 행복 +${n}`, 'good') }
  const down = (n: number, text: string) => badEvent(s, p, { text: `${tag}${text}`, loss: 0, happyLoss: n })
  const hurt = (text: string, loss: number) => badEvent(s, p, { text: `${tag}${text}`, loss, happyLoss: 2, kind: 'health' })
  const scandal = () => {
    down(4, '스캔들이 터졌다')
    const top = [...p.suitors].sort((x, y) => y.affinity - x.affinity)[0]
    if (top && !p.spouse) { top.affinity = Math.max(0, top.affinity - 15); log(s, p.id, `${tag}스캔들로 ${top.name} 호감도 -15`, 'bad') }
  }
  switch (job.id) {
    case 'civil':
      if (rng.chance(0.15)) up(2, '칼퇴하고 저녁이 있는 삶!')
      break
    case 'teacher':
      if (rng.chance(0.12)) up(3, '방학이다!')
      else if (rng.chance(0.1)) down(2, '학부모 민원에 시달렸다')
      break
    case 'dev':
      if (rng.chance(0.12)) down(3, '번아웃이 왔다')
      break
    case 'police': case 'fire':
      if (rng.chance(0.1)) {
        up(3, job.id === 'police' ? '범인을 잡았다!' : '불을 끄고 사람을 구했다!')
        if (job.id === 'police') { const m = sc * 3; p.money += m; log(s, p.id, `${tag}검거 포상금 +${won(m)}`, 'good') } // 경찰 특성 (2026-10-23 밸런스)
        changeFortune(s, p, 1, job.id === 'police' ? '범인 검거' : '인명 구조')
      }
      else if (rng.chance(job.id === 'fire' ? 0.12 : 0.09)) hurt('출동 중에 다쳤다', sc * 2)
      break
    case 'chef':
      if (rng.chance(0.1)) hurt('주방에서 화상을 입었다', sc)
      break
    case 'scientist':
      if (rng.chance(0.08)) { const m = sc * 4; p.money += m; log(s, p.id, `${tag}특허 수입! +${won(m)}`, 'good') }
      break
    case 'lawyer':
      if (rng.chance(0.15)) down(3, '사건이 몰려 과로했다')
      break
    case 'doctor':
      if (rng.chance(0.15)) down(2, '밤샘 당직…')
      else if (rng.chance(0.05)) badEvent(s, p, { text: `${tag}의료 사고로 합의금을 냈다`, loss: sc * 5, happyLoss: 3 })
      break
    case 'youtuber':
      // 매력이 높을수록 광고·후원이 큼
      if (rng.chance(0.3)) { const m = Math.round(sc * p.stats.cha * 0.5); p.money += m; log(s, p.id, `${tag}${rng.pick(['광고 협찬', '팬 후원', '라이브 방송 후원'])}! (매력 ${p.stats.cha}) +${won(m)}`, 'good') }
      else if (rng.chance(0.15)) down(3, '악플에 시달렸다')
      break
    case 'athlete':
      // 승급과는 상관없지만 매력이 높으면 부수입
      if (p.stats.cha >= 4 && rng.chance(0.2)) { const m = Math.round(sc * p.stats.cha * 0.3); p.money += m; log(s, p.id, `${tag}${rng.pick(['굿즈 판매', '예능 출연', '광고 촬영', '인터넷 방송 출연'])}! (매력 ${p.stats.cha}) +${won(m)}`, 'good') }
      else if (rng.chance(0.1)) { hurt('경기 중에 다쳤다', sc * 2); p.stats.str = clampStat(p.stats.str - 1); log(s, p.id, `${tag}부상으로 체력 -1`, 'bad') }
      break
    case 'idol': case 'actor':
      if (rng.chance(0.08)) scandal()
      break
    case 'coach':
      if (rng.chance(0.15)) up(2, '키운 후배가 좋은 성적을 냈다!')
      else if (rng.chance(0.1)) down(2, '성적 압박에 시달렸다')
      break
    default: break
  }
  // 운동선수 국가대표: 메달 도전 (체력 × 2%), 최대 3개
  if (p.jobId === 'athlete' && p.jobRank === 2 && p.medals.length < 3 && rng.chance(p.stats.str * 0.02)) {
    const v = rng.int(1, 6) + (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0)
    const m = v >= 6 ? 0 : v >= 4 ? 1 : 2
    p.medals.push(m)
    p.happy += 5
    log(s, p.id, `국제 대회 ${MEDALS[m].name}메달! 매 턴 연금 +${won(MEDALS[m].pension)} (행복 +5)`, 'good')
    s.banner = { title: `${MEDALS[m].name}메달!`, text: p.name, tone: 'good' }
  }
}

export function adoptPet(s: GameState, p: Player, text: string) {
  p.pet = { alive: true, turnsLeft: rngOf(s).int(15, 20) }
  p.happy += 3
  log(s, p.id, `${text}. 행복 +3`, 'good')
}

export function setJob(s: GameState, p: Player, id: string | null) {
  if (p.jobId && p.jobId !== id) paySeverance(s, p) // 직장을 옮기면 퇴직금
  p.jobId = id
  p.jobTenure = 0
  p.jobRank = id === 'ceo' || JOBS.find((j) => j.id === id)?.boom ? 1 : 0
  p.jobTurns = 0
  const j = jobOf(p)
  if (j) {
    log(s, p.id, `${j.name}${j.boom ? '' : ` ${j.ranks[p.jobRank]}`}(으)로 일을 시작했다`, 'good')
    if (j.id === 'scientist') s.pending = sectorPending(p, '어떤 분야를 연구할까요?', ['생명', '화학'])
    if (j.id === 'idol') { s.stockPrice.엔터 = Math.round(s.stockPrice.엔터 * 1.1); log(s, null, `${p.name} 데뷔! 엔터주 +10%`, 'info'); say(s, p, 'debut') }
  } else log(s, p.id, '백수로 지내기로 했다', 'info')
}

// ───────── 결정 처리 ─────────

export function choose(s: GameState, optionId: string) {
  const pd = s.pending
  if (!pd) return
  const p = s.players[pd.playerId]
  const rng = rngOf(s)
  const sc = scaleOf(s)
  s.pending = null
  const spent0 = p.record.spent
  const chooseStart = s.logCount
  switch (pd.type) {
    case 'afterRoll': {
      const d = (pd.data ?? {}) as { item?: DiceItem | null; bonus?: number }
      applyAfterRoll(s, p, optionId, d.item ?? null, d.bonus ?? 0)
      return
    }
    case 'fork': applyForkChoice(s, p, +optionId); break
    case 'adultStart': case 'career':
      if (optionId.startsWith('uni:')) {
        startUni(s, p, optionId.slice(4) as StatKey, 'first')
      } else applyRoadStart(s, p, optionId)
      break
    case 'uniFail': {
      const k = (pd.data as { k: StatKey }).k
      p.collegeDecided = true
      if (optionId === 'retake') {
        p.retook = true
        log(s, p.id, '재수를 하기로 했다', 'info')
        if (stageOf(s).id === 'young') {
          // 청년이면 이번 차례를 재수에 씀: 바로 다시 시험
          p.stats[k] = clampStat(p.stats[k] + 1)
          log(s, p.id, `재수 1년: ${STAT_NAMES[k]} +1`, 'info')
          startUni(s, p, k, 'retakeYoung')
          s.lastRoll = 0
        } else p.retake = k // 학생 마지막 차례면 청년 첫 차례에 다시 시험
      } else {
        log(s, p.id, '대학 대신 바로 일을 하기로 했다', 'info')
        if (stageOf(s).id === 'young') goToJob(s, p)
      }
      break
    }
    case 'retake': {
      const k = p.retake!
      p.retake = null
      p.stats[k] = clampStat(p.stats[k] + 1)
      log(s, p.id, `재수 1년: ${STAT_NAMES[k]} +1`, 'info')
      startUni(s, p, k, 'retake')
      s.lastRoll = 0 // 재수한 차례는 이걸로 끝
      break
    }
    case 'campus': {
      const k = optionId as StatKey
      p.stats[k] = clampStat(p.stats[k] + 1)
      p.campusTurns--
      log(s, p.id, `대학 생활: ${STAT_NAMES[k]} +1${p.campusTurns ? ` (남은 학기 ${p.campusTurns})` : ''}`, 'good')
      if (p.campusTurns === 0) {
        // 졸업 → 본 길 맨 앞 직업 선택 칸으로
        const st = stageOf(s)
        p.pos = st.tiles[campusIdx(s)].next[0]
        log(s, p.id, '대학 졸업! 이제 직업을 골라요', 'good')
        s.banner = { title: '대학 졸업', text: p.name, tone: 'good' }
        stopTile(s, p, st.tiles[p.pos])
      }
      s.lastRoll = 0 // 이번 차례는 대학 생활로 끝 (주사위 1번 쓴 것으로 침)
      break
    }
    case 'cardSwap': {
      const d = pd.data as { kind: string; card: string }
      if (optionId === 'new') {
        if (d.kind === 'chance') p.chance = d.card as ChanceCard
        else p.sabotage = d.card as SabotageCard
      }
      break
    }
    case 'club': {
      const k = optionId as StatKey
      p.stats[k] = clampStat(p.stats[k] + 1)
      log(s, p.id, `${STAT_NAMES[k]} 동아리 활동. ${STAT_NAMES[k]} +1`, 'good')
      break
    }
    case 'collegeStat': {
      const k = optionId as StatKey
      p.stats[k] = clampStat(p.stats[k] + 1)
      log(s, p.id, `대학에서 ${STAT_NAMES[k]} +1`, 'good')
      break
    }
    case 'job':
      if (optionId === 'jobless') setJob(s, p, null)
      else if (optionId === 'biz' && p.jobId) startCompany(s, p, BUSINESSES[p.jobId])
      else if (optionId !== 'stay') setJob(s, p, optionId.slice(4))
      break
    case 'bizRetire':
      if (optionId === 'sell') sellCompany(s, p)
      else { p.bizKeep = true; log(s, p.id, `노년에도 ${josa(p.biz?.name ?? '사업', '을/를')} 계속 경영한다`, 'info') }
      break
    case 'idolNext': {
      const rank = p.exIdol ?? 0
      p.exIdol = null
      if (optionId === 'actor' || optionId === 'youtuber') {
        setJob(s, p, optionId)
        p.jobRank = Math.max(0, rank - 1) // 아이돌 등급에서 한 단계 아래 (톱스타 → 2단계, 신인·연습생 → 1단계)
        log(s, p.id, `${jobOf(p)!.name}(으)로 전직! ${jobOf(p)!.ranks[p.jobRank]}부터 시작`, 'good')
        s.banner = { title: `${jobOf(p)!.name} 전직!`, text: `${p.name}: ${jobOf(p)!.ranks[p.jobRank]}`, tone: 'good' }
      } else if (optionId === 'biz') {
        startCompany(s, p, BUSINESSES.idol)
        if (rank >= 2) { p.jobRank = 1; log(s, p.id, `톱스타 이름값으로 ${bizRankOf(p)}부터!`, 'good') }
      } else log(s, p.id, '아이돌 생활을 마치고 좀 쉬기로 했다', 'info')
      break
    }
    case 'athleteNext': {
      const rank = p.exAthlete ?? 0
      p.exAthlete = null
      if (optionId === 'biz') startCompany(s, p, BUSINESSES.athlete)
      else if (optionId === 'coach') {
        const ch = coachChance(p, rank)
        const ok = rng.next() < ch
        spinRoulette(s, p, '감독 도전 룰렛', ch, ok)
        if (ok) {
          setJob(s, p, 'coach')
          p.jobRank = rank >= 2 || p.medals.length ? 1 : 0
          log(s, p.id, `감독 룰렛 성공! (확률 ${Math.round(ch * 100)}%) ${JOBS.find((j) => j.id === 'coach')!.ranks[p.jobRank]}가 됐다`, 'good')
          s.banner = { title: '감독 도전 성공!', text: p.name, tone: 'good' }
        } else log(s, p.id, `감독 룰렛 실패… (확률 ${Math.round(ch * 100)}%) 당분간 백수`, 'bad')
      } else log(s, p.id, '선수 생활을 마치고 좀 쉬기로 했다', 'info')
      break
    }
    case 'middleBranch':
      if (optionId === 'adopt') {
        const age = addKid(s, p, true)
        p.happy += 6
        p.money += KIDS.adoptGrant
        log(s, p.id, `${age}살 아이를 입양했다. 행복 +6, 입양 지원금 +${won(KIDS.adoptGrant)}`, 'good')
        eduPending(s, p)
      }
      if (optionId === 'pet') adoptPet(s, p, '반려동물을 맞았다')
      break
    case 'shop': {
      const visit = (pd.data as ShopVisit | undefined) ?? { big: false, n: 0 }
      if (optionId === 'pass') break
      if (optionId.startsWith('loan')) { // 상점에서 대출 받고 다시 고르기
        bankLoan(s, p, +optionId.slice(4))
        openShop(s, p, visit)
        break
      }
      const big = /^(house|mortgage|car)\d/.test(optionId)
      // 할인 쿠폰이 있으면 집·차를 살 때 쓸지 물어봄 (2026-10-21 사용자). AI는 늘 씀
      if (big && p.chance === 'coupon' && p.human) {
        const [withC, without] = [true, false].map((c) => bigPrice(s, p, optionId, c))
        s.pending = {
          type: 'shopCoupon', playerId: p.id, title: '할인 쿠폰', text: '할인 쿠폰을 쓸까요? 쓰면 카드는 없어져요.',
          options: [
            { id: 'use', label: `🎟️ 쿠폰 쓰기 (${won(withC)})`, desc: `${won(without - withC)} 아껴요`, disabled: p.money < withC },
            { id: 'keep', label: `쿠폰 아끼기 (${won(without)})`, disabled: p.money < without },
            { id: 'back', label: '다시 고르기' },
          ],
          data: { item: optionId, visit },
        }
        break
      }
      const next = { big: visit.big || big, n: visit.n + 1 }
      shopBuy(s, p, optionId, p.chance === 'coupon', next)
      if (!s.pending) openShop(s, p, next) // 소개팅 회사 속성 고르기 창이 뜨면 그 뒤에 다시 상점
      break
    }
    case 'shopCoupon': {
      const d = pd.data as { item: string; visit: ShopVisit }
      if (optionId === 'back') { openShop(s, p, d.visit); break }
      shopBuy(s, p, d.item, optionId === 'use')
      openShop(s, p, { big: true, n: d.visit.n + 1 })
      break
    }
    case 'special': {
      const ev = findEvent(stageOf(s).id, (pd.data as { ev: string }).ev)
      const o = ev?.options.find((x) => x.id === optionId)
      if (ev && o?.check && p.human) diceCheck(s, p, ev.title, `${STAT_NAMES[o.check.stat]} ${p.stats[o.check.stat]} + 주사위 → ${o.check.need} 이상이면 성공!`, { kind: 'special', ev: ev.id, opt: o.id })
      else if (ev && o) applySpecial(s, p, ev, o)
      break
    }
    case 'diceCheck': {
      const d = pd.data as { kind: 'special' | 'suneung' | 'career' | 'bizOpp'; ev?: string; opt?: string; k?: StatKey; after?: UniAfter; cost?: number }
      const v = rng.int(1, 6)
      showDice(s, v)
      if (d.kind === 'suneung') suneung(s, p, v, d.k ?? 'int', d.after ?? 'first')
      else if (d.kind === 'career') careerRoll(s, p, v)
      else if (d.kind === 'bizOpp') bizOppResult(s, p, d.ev ?? '', d.cost ?? 0, v)
      else {
        const ev = findEvent(stageOf(s).id, d.ev ?? '')
        const o = ev?.options.find((x) => x.id === d.opt)
        if (ev && o) {
          const ok = applySpecial(s, p, ev, o, v)
          s.banner = { title: ok ? `${ev.title} 성공!` : `${ev.title} 실패`, text: `주사위 ${v}`, tone: ok ? 'good' : 'bad' }
        }
      }
      break
    }
    case 'happyPick': {
      const cost = (pd.data as { cost: number }).cost
      if (optionId === 'big') { spend(p, cost); p.happy += 7; log(s, p.id, `크게 놀았다! -${won(cost)}, 행복 +7`, 'good') }
      else if (optionId === 'work') { p.money += cost; p.happy -= 1; log(s, p.id, `쉬지 않고 일했다. +${won(cost)}, 행복 -1`, 'info') }
      else { p.happy += 3; log(s, p.id, '소소하게 즐겼다. 행복 +3', 'good') }
      break
    }
    case 'growPick': {
      if (optionId === 'rest') { p.happy += 2; log(s, p.id, '능력치가 모두 최고라 푹 쉬었다. 행복 +2', 'good'); break }
      const k = optionId as StatKey
      const d = pd.data as { add: number; major?: StatKey | null }
      // 능력치는 한 번에 1씩만 (2026-10-21 사용자). 전공이면 대신 행복 +1
      const add = Math.min(1, d.add)
      p.stats[k] = clampStat(p.stats[k] + add)
      if (d.major === k) p.happy += 1
      log(s, p.id, `${STAT_NAMES[k]} +${add}${d.major === k ? ', 전공이라 행복 +1' : ''}`, 'good')
      break
    }
    case 'festTarget': {
      const { game } = pd.data as { game: MiniId }
      startMini(s, p, game, optionId)
      break
    }
    case 'casinoStake': {
      const { game, level } = pd.data as { game: MiniId; level: number }
      const stake = optionId.startsWith('pct') ? casinoStake(p, +optionId.slice(3)) : 0 // 버튼 이름이 겹치지 않게 %로 받음
      if (!stake) { log(s, p.id, '카지노는 구경만 하고 지나갔다', 'info'); break }
      if (!p.lottery.addicted && rng.chance(p.lottery.chance / 100)) { p.lottery.addicted = true; log(s, p.id, '카지노에 빠졌다… 도박중독', 'bad') }
      p.lottery.chance = Math.min(50, p.lottery.chance + 5)
      s.mini = { game, playerId: p.id, level, stake }
      break
    }
    case 'kidEdu': {
      const e = +optionId as 0 | 1 | 2
      for (const k of p.kids) if (k.result === null && k.edu === null) k.edu = e
      log(s, p.id, `아이 교육: ${KIDS.eduNames[e]}${KIDS.eduCost[e] ? ` (1명당 매 턴 ${won(KIDS.eduCost[e])})` : ' (돈 안 듦)'}`, 'info')
      break
    }
    case 'stray':
      if (optionId === 'yes') { p.record.deeds++; adoptPet(s, p, '유기견을 가족으로 맞았다 (선행)'); changeFortune(s, p, 1, '유기견 입양') }
      else log(s, p.id, '유기견을 보호소에 데려다줬다', 'info')
      break
    case 'agencyAttr': {
      const vip = (pd.data as { vip: boolean }).vip
      p.agency = { vip, attr: optionId === 'none' ? null : (optionId as Attr) }
      log(s, p.id, `소개팅 회사 ${vip ? 'VIP' : '일반'} 회원 가입`, 'info')
      const visit = (pd.data as { visit?: ShopVisit }).visit
      if (visit) openShop(s, p, visit)
      break
    }
    case 'agency': {
      if (optionId === 'quit') { p.agency = null; log(s, p.id, '소개팅 회사 해지', 'info'); break }
      if (optionId === 'skip') break
      if (optionId === 'new') {
        const x = makeSuitor(s, p, { attr: p.agency?.attr, vip: p.agency?.vip })
        const cost = p.agency?.vip ? 300 : 100
        s.pending = {
          type: 'agencyMatch', playerId: p.id, title: `소개: ${x.name}`, text: suitorDesc(x),
          options: [{ id: 'yes', label: `연애 시작 (${won(cost)})`, disabled: p.money < cost }, { id: 'no', label: '넘기기' }],
          data: { x, cost },
        }
      } else {
        const x = findSuitor(p, optionId)
        if (x) { const add = affinityGain(s, p, x); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${josa(x.name, '와/과')} 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
      }
      break
    }
    case 'agencyMatch': {
      if (optionId === 'yes') {
        const { x, cost } = pd.data as { x: Suitor; cost: number }
        spend(p, cost)
        x.affinity = rng.int(25, 35)
        p.suitors.push(x)
        log(s, p.id, `소개팅으로 ${josa(x.name, '와/과')} 연애 시작! 호감도 ${x.affinity}%`, 'good')
      }
      break
    }
    case 'date': {
      if (optionId.startsWith('new')) {
        const x = (pd.data as { fresh: Suitor[] }).fresh[+optionId.slice(3)]
        x.affinity = rng.int(25, 40)
        p.suitors.push(x)
        log(s, p.id, `${josa(x.name, '와/과')} 첫 데이트! 호감도 ${x.affinity}%`, 'good')
      } else {
        const x = findSuitor(p, optionId)
        if (x) { const add = affinityGain(s, p, x); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${josa(x.name, '와/과')} 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
      }
      p.happy += 1
      break
    }
    case 'marriage': {
      if (optionId === 'single') { log(s, p.id, '이번엔 비혼으로 지내기로 했다', 'info'); break }
      const x = findSuitor(p, optionId)
      if (!x) break
      let prob = x.affinity / 100 - (x.grade - 1) * 0.05
      if (PRESTIGE_JOBS.includes(p.jobId ?? '')) prob += 0.1
      if (p.car === 3) prob += 0.05
      if (p.creditBad > 0) prob -= 0.2
      if (rng.chance(Math.max(0.05, Math.min(0.95, prob)))) {
        s.pending = {
          type: 'wedding', playerId: p.id, title: `${josa(x.name, '이/가')} 고백을 받아줬다!`, text: '결혼식장을 골라요. 비쌀수록 축의금과 좋은 일이 늘어요.',
          options: [
            { id: '1', label: '작은 결혼식', desc: won(sc * 3) },
            { id: '2', label: '보통 결혼식', desc: won(sc * 8) },
            { id: '3', label: '호화 결혼식', desc: won(sc * 20) },
          ],
          data: { key: optionId },
        }
      } else {
        x.affinity = Math.max(0, x.affinity - 30)
        p.happy -= 5
        log(s, p.id, `${x.name}에게 차였다… 행복 -5`, 'bad')
        say(s, p, 'confessFail')
      }
      break
    }
    case 'wedding': {
      const x = findSuitor(p, (pd.data as { key: string }).key)
      if (!x) break
      const tier = +optionId
      spend(p, sc * [0, 3, 8, 20][tier])
      const { affinity: _a, ...spouse } = x
      void _a
      p.spouse = { ...spouse, revealed: true }
      if (spouse.trait === '대운') changeFortune(s, p, 2, '배우자의 대운')
      p.suitors = []
      p.agency = null // 결혼하면 소개팅 회사 자동 해지
      const happy = 8 + (x.looks - 5) * 2 + tier * 2
      p.happy += happy
      p.money += x.wealth * 60
      let gifts = 0
      for (const q of s.players) {
        if (q.id === p.id) continue
        const g = Math.round(rng.int(5, 15) * tier * (1 + x.fame / 10))
        q.money -= g
        gifts += g
      }
      p.money += gifts
      log(s, p.id, `${josa(x.name, '와/과')} 결혼! 행복 +${happy}, 지참금 +${won(x.wealth * 60)}, 축의금 +${won(gifts)}`, 'good')
      log(s, p.id, `결혼해 보니 ${x.name}의 숨은 특성: ${x.trait}`, x.traitGood ? 'good' : 'bad')
      s.banner = { title: '결혼!', text: `${p.name} ♥ ${x.name}`, tone: 'good' }
      say(s, p, 'married')
      if (stageOf(s).id === 'young' && p.children < 3) {
        s.pending = {
          type: 'baby', playerId: p.id, title: '아이를 가질까요?', text: '결혼 축하해요! 지금 아이를 가질 수 있어요. 나중에 데이트 칸에서도 가질 수 있어요 (최대 3명).',
          options: [{ id: 'yes', label: '아이를 갖는다' }, { id: 'no', label: '나중에' }],
        }
      }
      break
    }
    case 'baby':
      if (optionId === 'yes') { addKid(s, p, false); p.happy += 6; p.money += KIDS.birthGrant; log(s, p.id, `아기가 태어났다! (자녀 ${p.children}명) 행복 +6, 출산 지원금 +${won(KIDS.birthGrant)}`, 'good'); s.banner = { title: '아기 탄생', text: p.name, tone: 'good' }; say(s, p, 'baby') }
      break
    case 'invest': {
      const cost = (pd.data as { cost: number }).cost
      if (optionId === 'yes') {
        p.money -= cost
        const f = p.fortune
        const sense = workJob(s, p)?.id === 'ceo' // 사업가 특성: 투자 감각 (운세 한 단계 좋게 봄)
        const win = sense ? f >= 2 || (f === 1 && rng.chance(0.5)) : f >= 3 || (f === 2 && rng.chance(0.5))
        if (win) { const g = Math.round(cost * (f >= 4 ? 3 : 2)); p.money += g; log(s, p.id, `[운세 ${fortuneName(f)}] 투자 성공! +${won(g)}`, 'good') }
        else log(s, p.id, `[운세 ${fortuneName(f)}] 투자 실패… -${won(cost)}`, 'bad')
      } else log(s, p.id, '투자를 거절했다', 'info')
      break
    }
    case 'overtime': {
      const amt = (pd.data as { amt: number }).amt
      if (optionId === 'yes') { p.money += amt; p.happy -= 3; log(s, p.id, `야근했다. +${won(amt)}, 행복 -3`, 'info') }
      else { p.happy += 2; log(s, p.id, '야근을 거절했다. 행복 +2', 'info') }
      break
    }
    case 'taxEvade': {
      const tax = (pd.data as { tax: number }).tax
      if (optionId === 'yes') {
        const f = p.fortune
        const safe = f >= 3 || (f === 2 && rng.chance(0.5))
        if (safe) { p.money += tax; log(s, p.id, `[운세 ${fortuneName(f)}] 세금을 안 내고 넘어갔다 +${won(tax)}`, 'good') }
        else { p.money -= tax * 2; p.happy -= 3; log(s, p.id, `[운세 ${fortuneName(f)}] 세무조사! 세금과 벌금 -${won(tax * 2)}`, 'bad'); s.banner = { title: '세무조사', text: p.name, tone: 'bad' } }
        changeFortune(s, p, -1, '세금을 안 냄')
      } else log(s, p.id, '세금을 정직하게 냈다', 'info')
      break
    }
    case 'sector':
      p.sector = optionId as Sector
      log(s, p.id, `${optionId} 분야를 골랐다`, 'info')
      break
    case 'rps': {
      const d = pd.data as { ids: number[]; picks?: Record<number, number>; queue?: number[]; humans?: number[]; sim?: boolean }
      const picks = { ...d.picks, [p.id]: +optionId }
      if (d.sim) { // 동시에: 남은 사람이 있으면 계속 기다림
        const queue = (d.queue ?? []).filter((i) => i !== p.id)
        if (queue.length) { s.pending = { ...pd, playerId: queue[0], data: { ...d, picks, queue } }; break }
        resolveRps(s, d.ids, picks, d.humans ?? [p.id])
        break
      }
      if (d.queue?.length) rpsPending(s, d.ids, picks, d.queue, d.humans ?? [p.id, ...d.queue]) // 예전 저장: 다음 사람 차례
      else resolveRps(s, d.ids, picks, d.humans ?? [p.id])
      break
    }
    case 'sabotageTarget': {
      const target = s.players[+optionId]
      if (target) applySabotage(s, p, target)
      break
    }
    case 'wallet': {
      const wsc = (pd.data as { sc: number }).sc
      if (optionId === 'return') { p.money += wsc * 3; p.record.deeds++; log(s, p.id, `지갑 주인을 찾아줬다. 사례금 +${won(wsc * 3)} (선행)`, 'good'); changeFortune(s, p, 1, '지갑을 돌려줌') }
      else { p.money += wsc * 8; p.happy += 2; log(s, p.id, `주운 지갑의 돈을 가졌다 +${won(wsc * 8)}, 행복 +2`, 'info'); changeFortune(s, p, -1, '지갑을 가짐') }
      break
    }
    case 'bizOpp': {
      const d = pd.data as { ev: string; cost: number }
      if (optionId !== 'yes' || p.money < d.cost) { log(s, p.id, `사업 기회(${findBizEvent(p.biz?.name ?? '', d.ev)?.title ?? ''})를 넘겼다`, 'info'); break }
      p.money -= d.cost
      if (p.human) {
        const ev = findBizEvent(p.biz!.name, d.ev)!
        diceCheck(s, p, ev.title, bizOppRule(p, ev), { kind: 'bizOpp', ev: d.ev, cost: d.cost })
      } else {
        const v = rng.int(1, 6)
        showDice(s, v)
        bizOppResult(s, p, d.ev, d.cost, v)
      }
      break
    }
    case 'bizTakeInvest':
      if (optionId === 'yes') { log(s, p.id, `${p.biz?.name ?? '회사'} 투자를 받기로 했다`, 'info'); offerInvest(s, p, (pd.data as { queue: number[] }).queue) }
      else log(s, p.id, `${josa(p.biz?.name ?? '회사', '은/는')} 혼자 하기로 했다`, 'info')
      break
    case 'bizInvest': {
      const d = pd.data as { founderId: number; queue: number[] }
      const founder = s.players[d.founderId]
      if (optionId === 'yes') invest(s, p, founder)
      else log(s, p.id, `${founder.name}의 ${founder.biz?.name ?? '회사'}에 투자하지 않았다`, 'info')
      offerInvest(s, founder, d.queue)
      break
    }
    case 'loanRequest': {
      const d = pd.data as { borrowerId: number; amount: number; rate: number; term: number }
      if (optionId === 'yes') makeFriendLoan(s, s.players[d.borrowerId], p, d.amount, d.rate, d.term)
      else log(s, p.id, `${s.players[d.borrowerId].name}의 돈 부탁을 거절했다`, 'info')
      break
    }
  }
  if (pd.type === 'shop' || pd.type === 'shopCoupon') p.record.shopSpent += p.record.spent - spent0
  // 고른 결과를 화면에 (2026-10-22: 기록 창에만 떠서, 단계 마지막 차례면 결과를 못 보고 넘어갔음)
  const resultLines = p.human && !s.pending && !s.mini && !NO_RESULT_POP.has(pd.type)
    ? s.log.slice(s.log.length - Math.min(s.log.length, s.logCount - chooseStart)).filter((l) => l.playerId === p.id || l.playerId === null) : []
  const popBefore = s.popup?.id
  resume(s)
  if (resultLines.length && s.popup?.id === popBefore) {
    s.popup = { id: (s.popup?.id ?? 0) + 1, art: TYPE_POP_ART[pd.type] ?? 'card', title: pd.title, text: resultLines.slice(-6).map((l) => l.text).join('\n'), tone: resultLines.some((l) => l.tone === 'bad') ? 'bad' : resultLines[0].tone, playerId: p.id }
  }
}
// 결과 창을 따로 안 띄우는 선택 (갈림길·상점처럼 다음 화면이 바로 이어지는 것)
const NO_RESULT_POP = new Set(['fork', 'shop', 'shopCoupon', 'agencyAttr', 'afterRoll', 'retake', 'casinoStake', 'festTarget', 'sabotageTarget', 'cardSwap'])
const TYPE_POP_ART: Record<string, string> = { wallet: 'money', happyPick: 'rest', date: 'heart', marriage: 'heart', growPick: 'grow', job: 'money', invest: 'money' }

// ───────── 차례 전에 하는 행동 (재테크·카드) ─────────

export function buyLottery(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s) || p.lottery.ticket || p.money < LOTTERY_PRICE) return
  spend(p, LOTTERY_PRICE)
  p.lottery.ticket = true
  const rng = rngOf(s)
  if (!p.lottery.addicted && rng.chance(p.lottery.chance / 100)) {
    p.lottery.addicted = true
    log(s, p.id, '복권을 너무 자주 샀다… 도박중독에 걸렸다', 'bad')
    s.banner = { title: '도박중독', text: p.name, tone: 'bad' }
  }
  p.lottery.chance = Math.min(50, p.lottery.chance + 5)
  log(s, p.id, '복권을 샀다 (다음 차례에 확인)', 'info')
  say(s, p, 'lotteryBuy')
}

// 백수 취업 도전: 청년·중년에 백수면 굴리기 전에 언제든 조건 맞는 직업을 고를 수 있음 (2026-10-16 사용자)
export function canSeekJob(s: GameState, p: Player) {
  const id = stageOf(s).id
  return (id === 'young' || id === 'middle') && !p.jobId && p.collegeDecided && p.campusTurns === 0 && p.exAthlete === null && p.exIdol == null && !p.biz && eligibleJobs(p, s.stageIdx).length > 0
}
export function seekJob(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !canSeekJob(s, p)) return
  s.pending = { type: 'job', playerId: p.id, title: '취업 도전', text: `조건이 맞는 직업이에요. (지력 ${p.stats.int} · 체력 ${p.stats.str} · 매력 ${p.stats.cha})

${jobGuide(p)}`, options: jobOptions(s, p, true) }
  resume(s)
}

export function cureAddiction(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !p.lottery.addicted || p.money < 300) return
  p.money -= 300
  p.lottery.addicted = false
  p.lottery.chance = 10
  log(s, p.id, '상담 치료로 도박중독을 고쳤다 (-300만)', 'good')
}

export function tradeStock(s: GameState, sector: Sector, qty: number) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s)) return
  const price = s.stockPrice[sector]
  if (qty > 0 && p.money < price * qty) return
  if (qty < 0 && p.stocks[sector] < -qty) return
  const held = p.stocks[sector]
  p.money -= price * qty
  p.stocks[sector] += qty
  if (qty > 0) {
    p.stockCost[sector] += price * qty
    log(s, p.id, `${sector}주 ${qty}주 샀다 (${won(price)}/주)`, 'info')
  } else {
    const avg = held ? p.stockCost[sector] / held : price
    const gain = Math.round((price - avg) * -qty)
    p.record.stockGain += gain
    p.stockCost[sector] = Math.round(avg * p.stocks[sector])
    log(s, p.id, `${sector}주 ${-qty}주 팔았다 (${won(price)}/주, ${gain >= 0 ? `+${won(gain)} 이익` : `${won(gain)} 손해`})`, gain >= 0 ? 'good' : 'bad')
  }
}

export function toggleInsurance(s: GameState, kind: InsuranceKind) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s)) return
  if (p.insurance[kind]) {
    p.insurance[kind] = false
    p.insuranceCooldown[kind] = 3
    log(s, p.id, `${INSURANCE[kind].name} 해지 (3턴 동안 재가입 불가)`, 'info')
    return
  }
  if (p.insuranceCooldown[kind] > 0) return
  if (kind === 'car' && !p.car) return
  if (kind === 'property' && !p.house) return
  p.insurance[kind] = true
  log(s, p.id, `${INSURANCE[kind].name} 가입`, 'info')
}

// ───────── 카드 사용 ─────────

export function playChance(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !p.chance) return
  if (p.chance === 'charm') {
    p.chance = null
    p.charmTurns = 3
    syncFortune(p)
    log(s, p.id, `행운 부적! 3턴 동안 운세 한 단계↑ (지금 ${fortuneName(p.fortune)})`, 'good')
  }
}

export function startSabotage(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !p.sabotage) return
  s.pending = {
    type: 'sabotageTarget', playerId: p.id, title: SABOTAGE_NAMES[p.sabotage], text: '누구에게 쓸까요? 상대 운세가 나보다 좋을수록 역풍이 불 수 있어요.',
    options: s.players.filter((q) => q.id !== p.id && !sameTeam(s, p, q)).map((q) => ({ id: String(q.id), label: q.name, desc: `운세 ${fortuneName(q.fortune)} · 역풍 ${q.fortune > p.fortune ? Math.round((BACKFIRE[q.fortune] ?? 0) * 100) : 0}%` })),
  }
  s.phase = 'decision'
}

// 역풍 확률: 상대 운세가 내 운세보다 높을 때만, 상대 운세(대흉~대길)에 따라 (2026-10-21 사용자: 쓰는 사람 운세는 안 내려감)
export const BACKFIRE = [0, 0, 0.1, 0.25, 0.4]
function applySabotage(s: GameState, p: Player, target: Player) {
  const rng = rngOf(s)
  const card = p.sabotage
  if (!card) return
  p.sabotage = null
  log(s, p.id, `${target.name}에게 ${SABOTAGE_NAMES[card]}!`, 'info')
  say(s, p, 'sabotageUse')
  if (target.chance === 'block') {
    target.chance = null
    log(s, target.id, '방해 막기 카드로 막았다!', 'good')
    return
  }
  if (card === 'lawsuit') { lawsuit(s, p, target, 'card'); return }
  const backfire = target.fortune > p.fortune ? BACKFIRE[target.fortune] ?? 0 : 0 // 상대 운세가 나보다 높을 때만
  const victim = rng.chance(backfire) ? p : target
  if (victim === p) log(s, p.id, '역풍! 방해가 나에게 돌아왔다', 'bad')
  else say(s, target, 'sabotaged')
  if (card === 'rumor') badEvent(s, victim, { text: '나쁜 소문이 퍼졌다', loss: 0, happyLoss: 6 })
  if (card === 'stockRumor') {
    const sector = SECTORS.reduce((a, k) => (victim.stocks[k] > victim.stocks[a] ? k : a), SECTORS[0])
    if (victim.stocks[sector] <= 0) log(s, victim.id, `주가 루머… 그런데 ${josa(victim.name, '은/는')} 주식이 없어서 효과가 없었다`, 'info')
    else {
      s.stockPrice[sector] = Math.max(10, Math.round(s.stockPrice[sector] * 0.8))
      log(s, null, `주가 루머로 ${sector}주 -20%`, 'bad')
    }
  }
  if (card === 'love') {
    const top = [...victim.suitors].sort((a, b) => b.affinity - a.affinity)[0]
    if (top) { top.affinity = Math.max(0, top.affinity - 25); log(s, victim.id, `연애 방해로 ${top.name} 호감도 -25`, 'bad') }
    else badEvent(s, victim, { text: '연애 방해로 마음고생', loss: 0, happyLoss: 3 })
  }
}

// ───────── 차례 끝, 단계 전환 ─────────

// 골인할 때 남은 돈으로 빚을 갚음 (친구 빚 먼저, 그다음 은행). 못 갚은 빚은 결산 때 자산에서 빠짐
function payDebtsAtGoal(s: GameState, p: Player) {
  let paid = 0
  s.friendLoans = s.friendLoans.filter((l) => {
    if (l.borrowerId !== p.id || p.money < l.owe) return true
    p.money -= l.owe
    s.players[l.lenderId].money += l.owe
    paid += l.owe
    return false
  })
  p.loans.sort((a, b) => a.dueTurn - b.dueTurn)
  for (const l of p.loans) {
    const pay = Math.min(Math.max(0, p.money), l.amount)
    l.amount -= pay
    p.money -= pay
    paid += pay
  }
  p.loans = p.loans.filter((l) => l.amount > 0)
  const left = loanTotal(p) + friendDebt(s, p)
  if (paid) log(s, p.id, `골인하며 남은 돈으로 빚 ${won(paid)}을 갚았다`, 'info')
  if (left) log(s, p.id, `갚지 못한 빚 ${won(left)}은 결산 때 자산에서 빠져요`, 'bad')
}

function endTurn(s: GameState) {
  const p = cur(s)
  const st = stageOf(s)
  p.lastLog = s.logCount
  if (st.rolls) p.rollsLeft = Math.max(0, p.rollsLeft - 1)
  if (st.id === 'old' && tileOf(s, p).kind === 'goal' && !p.finished) {
    p.finished = true
    s.finishCount++
    p.finishOrder = s.finishCount
    const goalStart = s.logCount
    const bonus = [0, 500, 300, 100, 0][s.finishCount] ?? 0
    p.money += bonus
    if (p.jobId === 'ceo' && p.bizKeep) sellCompany(s, p)
    payDebtsAtGoal(s, p)
    log(s, p.id, `${s.finishCount}번째로 골인!${bonus ? ` +${won(bonus)}` : ''}`, 'good')
    showPop(s, p, goalStart, 'trophy', `${s.finishCount}등으로 골인!`)
    say(s, p, 'goal')
  }
  s.pending = null
  s.lastRoll = null
  s.move = null
  s.mini = null
  if (st.rolls && s.players.every((q) => q.rollsLeft <= 0)) { if (!startContest(s)) nextStage(s); return }
  if (!st.rolls && s.players.every((q) => q.finished)) {
    s.phase = 'gameover'
    s.banner = { title: '게임 끝!', text: '최종 점수를 확인하세요', tone: 'info' }
    log(s, null, '모두 골인! 게임 끝', 'info')
    return
  }
  let n = s.current
  for (let i = 0; i < s.players.length; i++) {
    n = (n + 1) % s.players.length
    if (n === 0) roundEnd(s)
    const q = s.players[n]
    if (st.rolls ? q.rollsLeft > 0 : !q.finished) break
  }
  s.current = n
  beginTurn(s)
}

function roundEnd(s: GameState) {
  const rng = rngOf(s)
  s.round++
  if (!isAdultStage(s)) return
  s.stockPrev = { ...s.stockPrice }
  for (const k of SECTORS) s.stockPrice[k] = Math.max(10, Math.round(s.stockPrice[k] * (1 + (rng.next() - 0.5) * 0.12)))
  if (s.nextNews) {
    const n = s.nextNews
    s.stockPrice[n.sector] = Math.max(10, Math.round(s.stockPrice[n.sector] * (n.up ? 1 + n.size : 1 - n.size)))
    log(s, null, `[뉴스] ${n.sector} ${n.up ? '호재' : '악재'}! ${n.up ? '+' : '-'}${Math.round(n.size * 100)}%`, n.up ? 'good' : 'bad')
  }
  // 집 시세: 대체로 조금씩 오르고 가끔 크게 오르거나 떨어짐 (한 바퀴 평균 약 +1.5%)
  const boom = rng.chance(0.05), crash = !boom && rng.chance(0.05)
  const change = boom ? 0.1 : crash ? -0.12 : 0.015 + (rng.next() - 0.5) * 0.06
  s.housePrice = Math.max(40, Math.round(s.housePrice * (1 + change)))
  if (boom || crash) log(s, null, `[부동산] 집값 ${boom ? '급등' : '폭락'}! ${boom ? '+10' : '-12'}% (시세 ${s.housePrice})`, boom ? 'good' : 'bad')
  s.nextNews = rng.chance(0.35) ? { sector: rng.pick(SECTORS), up: rng.chance(0.5), size: 0.2 + rng.next() * 0.3 } : null
  for (const p of s.players) {
    if (p.jobId === 'scientist' && rng.chance(0.15)) {
      const k = p.sector ?? '화학'
      s.stockPrice[k] = Math.round(s.stockPrice[k] * 1.12)
      log(s, null, `${p.name}의 연구 성과! ${k}주 +12%`, 'good')
    }
  }
}


function careerRoll(s: GameState, p: Player, dice?: number) {
  const job = jobOf(p)
  if (!job?.boom || job.id === 'ceo') return // 사업가는 매 턴 회사 크기가 바뀜
  const rng = rngOf(s)
  const below = p.stats[job.key] < (job.req[job.key] ?? 0) ? -1 : 0 // 능력치가 조건 밑이면 추락 확률↑
  const charm = job.id === 'youtuber' ? (p.stats.cha >= 7 ? 1 : p.stats.cha <= 3 ? -1 : 0) : 0 // 유튜버는 매력이 높을수록 구독자가 잘 늚
  const v = (dice ?? rng.int(1, 6)) + luckBonus(p) + below + charm
  const sector = job.id === 'ceo' ? p.sector : null
  if (v >= 5 && p.jobRank < 2) {
    p.jobRank++
    log(s, p.id, `커리어 주사위 ${v}: 대박! ${job.ranks[p.jobRank]}`, 'good')
    say(s, p, 'promoted')
    if (sector) { s.stockPrice[sector] = Math.round(s.stockPrice[sector] * 1.1); log(s, null, `${p.name}의 회사가 커졌다! ${sector}주 +10%`, 'good') }
  } else if (v <= 2 && p.jobRank > 0) {
    p.jobRank--
    log(s, p.id, `커리어 주사위 ${v}: 추락… ${job.ranks[p.jobRank]}`, 'bad')
    if (sector) { s.stockPrice[sector] = Math.max(10, Math.round(s.stockPrice[sector] * 0.85)); log(s, null, `${p.name}의 회사가 휘청! ${sector}주 -15%`, 'bad') }
  }
  else log(s, p.id, `커리어 주사위 ${v}: 유지 (${job.ranks[p.jobRank]})`, 'info')
}

export function nextStage(s: GameState) {
  if (s.stages[s.stageIdx].id === 'young' || s.stages[s.stageIdx].id === 'middle') s.summary = s.stages[s.stageIdx].name
  s.stageIdx++
  s.path = [] // 단계가 바뀌면 칸 번호가 달라지므로 걷는 연출 생략
  s.pathId++
  const st = stageOf(s)
  for (const p of s.players) {
    p.pos = st.id === 'young' && p.campusTurns > 0 ? campusIdx(s) : 0
    p.forkChoice = null
    p.rollsLeft = st.rolls ?? 0
    p.carCharges = carChargesAt(p, s.stageIdx)
    if (st.id === 'middle' && p.jobId === 'idol') { p.exIdol = p.jobRank; log(s, p.id, `아이돌 은퇴! (${jobOf(p)!.ranks[p.jobRank]})`, 'info'); p.jobId = null; p.jobTenure = 0 }
    if (st.id === 'middle' && p.jobId === 'athlete') { p.exAthlete = p.jobRank; log(s, p.id, `운동선수 은퇴!${p.medals.length ? ` (메달 ${p.medals.length}개)` : ''}`, 'info'); p.jobId = null; p.jobTenure = 0 }
    if (st.id !== 'young') { if (st.id === 'middle' && p.human && jobOf(p)?.boom && p.jobId !== 'ceo') p.careerDue = true; else careerRoll(s, p) } // 중년: 사람은 첫 차례에 직접 굴림 (노년은 은퇴 전이라 자동)
    if (st.id === 'old') {
      if (p.jobId && p.jobId !== 'ceo') { paySeverance(s, p); log(s, p.id, `${jobOf(p)?.name} 은퇴${jobOf(p)?.pension ? ` (연금 매 턴 ${won(PENSION)})` : ''}`, 'info'); say(s, p, 'retire') }
      p.agency = null
    }
  }
  log(s, null, `${st.name} 단계 시작! (${st.ages[0]}세)`, 'info')
  s.banner = { title: `${st.name} 단계`, text: `${st.ages[0]}세가 되었어요`, tone: 'info' }
  // 입학 축하금: 어린 시절엔 벌 곳이 적어 마이너스가 되기 쉬워서 모두에게 (2026-10-21 사용자)
  if (st.id === 'student') {
    for (const p of s.players) p.money += SCHOOL_GIFT
    log(s, null, `입학 축하금! 모두 ${won(SCHOOL_GIFT)}원 받음`, 'good')
    s.banner.text += ` · 입학 축하금 ${won(SCHOOL_GIFT)}원`
  }
  s.current = 0
  beginTurn(s)
}
