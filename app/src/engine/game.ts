import { buildStages, isEnd, maxDepth, walkAhead } from './board'
import {
  AI_NAMES, BIZ, BUSINESSES, CARS, CHANCE_NAMES, DICE_ITEMS, FORTUNES, HOUSES, CAR_CRASH_LOSS, CAR_RESALE, HOUSE_RULES, INSURANCE, CAFE, JOBS, KIDS, LOTTERY_PRICE, MAX_DICE_ITEMS, MEDALS, PENSION, SEVERANCE_RATE,
  ADULT_BONUS_MULT, PERF_BONUS, SAVINGS_RATE, SCORE_PER_POINT,
  PERSONALITIES, PLAYER_COLORS, PRESTIGE_JOBS, SABOTAGE_NAMES, SECTORS, SPOUSE_NAMES, STAGE_SCALE, STAT_NAMES,
  TAX_RATE, TRAITS, JOB_PROS_CONS, JOB_AFFINITY, JOB_HEALTH,
} from './data'
import { DEFAULT_OUTFIT, randomOutfit, type Outfit } from './outfit'
import { makeRng, type Rng } from './rng'
import { DILEMMAS, findEvent, SPECIALS, specialDesc, type SpecialEvent, type SpecialOption } from './special'
import { speechLine, type SpeechKey } from './speech'
import type {
  ChanceCard, ChoiceOption, DiceItem, DuelId, GameState, InsuranceKind, JobDef, MiniId, Personality, Player,
  Biz, Kid, SabotageCard, Sector, Settings, Stage, StageId, StatKey, Suitor, Tile,
} from './types'

// ───────── 기본 도우미 ─────────

export const rngOf = (s: GameState): Rng => makeRng(s)
export const stageOf = (s: GameState): Stage => s.stages[s.stageIdx]
export const cur = (s: GameState): Player => s.players[s.current]
export const tileOf = (s: GameState, p: Player): Tile => stageOf(s).tiles[p.pos]
export const jobOf = (p: Player): JobDef | null => JOBS.find((j) => j.id === p.jobId) ?? null
export const scaleOf = (s: GameState) => STAGE_SCALE[stageOf(s).id]
export const isAdultStage = (s: GameState) => s.stageIdx >= 2
export const fortuneName = (f: number) => FORTUNES[f]
const clampStat = (v: number) => Math.max(0, Math.min(10, v))
// 직업 특성을 쓰는 직업: 노년엔 은퇴해서 없음 (연금 때문에 직업 기록만 남아 있음)
export const workJob = (s: GameState, p: Player): JobDef | null => (stageOf(s).id === 'old' ? null : jobOf(p))
const jobTag = (j: JobDef) => `[${j.name}] `

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
const MOOD_AFFINITY = [1, 1, 1.15]
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`
const STATS: StatKey[] = ['int', 'str', 'cha']
const SCHOOL_GIFT = 10 // 학생 단계 시작 때 모두에게 (만 원)
const HOUSE_HAPPY = [0, 1, 1, 2] // 집이 있으면 매 턴 행복 (원룸·아파트 +1, 단독주택 +2)
const HOUSE_AFFINITY = 1.1 // 집이 있으면 연애 호감도 +10%
const STUDENT_ALLOWANCE = 2 // 학생 동안 차례마다 용돈 (만 원, 2026-10-21 사용자: 학생 때 마이너스가 잦아서)

export function log(s: GameState, playerId: number | null, text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  s.log.push({ turn: s.turn, playerId, text, tone })
  s.logCount = (s.logCount ?? 0) + 1
  if (s.log.length > 200) s.log.splice(0, s.log.length - 200)
}

// AI만 말풍선으로 말함
function say(s: GameState, p: Player, key: SpeechKey) {
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
  { id: 'invest', name: '투자왕', desc: '주식으로 가장 많이 번 사람이 받아요 (판 이익 + 들고 있는 주식의 오른 만큼)', value: (p, s) => stockGainOf(s, p) },
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
function spend(p: Player, amount: number) {
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
function bankLoan(s: GameState, p: Player, amount: number) {
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
    s.players.push(newPlayer(humans + i, name, false, rng.pick(kinds)))
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
    const prize = [0, 3000, 300, 30][rank]
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
function fromSavings(s: GameState, p: Player, need: number) {
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
  log(s, p.id, `${name}이 경매로 ${won(sale)}에 넘어갔다… 행복 -8${left > 0 ? `, 남은 빚 ${won(left)}은 일반 대출로 · 신용불량` : `, 남은 돈 +${won(-left)}`}`, 'bad')
  s.banner = { title: '집 경매', text: p.name, tone: 'bad' }
}

// 주택담보대출로 집 살 때 필요한 계약금·빌릴 돈·매 턴 갚을 돈
export function mortgagePlan(s: GameState, p: Player, tier: number, coupon = p.chance === 'coupon') {
  const cost = houseCost(s, p, tier, coupon)
  const down = Math.round(cost * HOUSE_RULES.downRate)
  const borrow = cost - down
  return { cost, down, borrow, installment: Math.ceil((borrow * (1 + HOUSE_RULES.mortgageRate * HOUSE_RULES.mortgageTurns / 2)) / HOUSE_RULES.mortgageTurns) }
}
const hasMortgage = (p: Player) => p.loans.some((l) => l.kind === '주담대')

// ───────── 창업·퇴직금·메달 ─────────

// 사업 능력치: 업종 능력치 하나, 동네 가게는 세 능력치 평균
const bizStat = (p: Player) => (p.biz?.avg ? Math.round((p.stats.int + p.stats.str + p.stats.cha) / 3) : p.stats[p.biz?.stat ?? 'int'])
const bizStatMult = (p: Player) => 0.5 + bizStat(p) / 10
export const medalPension = (p: Player) => p.medals.reduce((a, m) => a + MEDALS[m].pension, 0)
export const bizCost = (p: Player) => (p.jobId === 'chef' ? BIZ.chefCost : BIZ.cost)
const bizRankOf = (p: Player, r = p.jobRank) => p.biz?.ranks?.[r] ?? JOBS.find((j) => j.id === 'ceo')!.ranks[r]
export const bizBase = (p: Player) => (p.biz?.base ?? BIZ.base)[p.jobRank]
const bizSale = (p: Player) => (p.biz?.sale ?? BIZ.sale)[p.jobRank]

// 매 턴 사업 수익 = 회사 크기 기본 × 능력치 배율 × 운세 배율. 그다음 회사가 크거나 작아질 수 있음
function bizTick(s: GameState, p: Player, mult: number) {
  const rng = rngOf(s)
  const biz = p.biz!
  const raw = bizBase(p) * bizStatMult(p) * BIZ.fortune[p.fortune] * mult
  const income = Math.round(raw > 0 ? raw * (1 - TAX_RATE(raw)) : raw)
  p.money += income
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
function bizReview(s: GameState, p: Player) {
  const raw = bizBase(p) * bizStatMult(p) * BIZ.fortune[p.fortune]
  if (raw <= 0) { log(s, p.id, `사업 평가: ${p.biz!.name}가 적자라 보너스가 없다`, 'info'); return }
  const income = Math.round(raw * (1 - TAX_RATE(raw)))
  p.money += income
  log(s, p.id, `사업 평가 좋음! ${p.biz!.name} 수익 한 번 더 +${won(income)}`, 'good')
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
function paySeverance(s: GameState, p: Player) {
  const job = jobOf(p)
  const amt = severanceOf(p)
  if (!job || !amt) return
  p.money += amt
  log(s, p.id, `${job.name} 퇴직금 +${won(amt)} (${p.jobTenure}턴 근무)`, 'good')
  p.jobTenure = 0
}

function startCompany(s: GameState, p: Player, biz: Biz) {
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
}

function sellCompany(s: GameState, p: Player) {
  const amt = bizSale(p)
  p.money += amt
  log(s, p.id, `${p.biz?.name ?? '회사'}(${bizRankOf(p)})를 팔고 은퇴 +${won(amt)}`, 'good')
  s.banner = { title: '회사 매각', text: `${p.name}: +${won(amt)}`, tone: 'good' }
  p.bizKeep = false
  p.jobId = null
}

const coachChance = (p: Player, rank: number) => Math.min(0.95, 0.2 + p.stats.str * 0.04 + rank * 0.15 + p.medals.length * 0.1)

// 체력이 낮을수록 건강 문제 (성인부터, 노년엔 1.5배)
function healthTick(s: GameState, p: Player) {
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
function carCrashTick(s: GameState, p: Player) {
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
function forceLiquidate(s: GameState, p: Player, overdue: { amount: number }[]) {
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

// ───────── 자녀 ─────────

const isMinor = (k: Kid) => k.result === null
export function kidUpkeep(s: GameState, p: Player) {
  const young = stageOf(s).id === 'young'
  return p.kids.filter(isMinor).reduce((a, k) => a + (young || k.edu === null ? KIDS.youngCost : KIDS.eduCost[k.edu]), 0)
}
export const kidAllowance = (p: Player) =>
  p.kids.reduce((a, k) => a + (k.result === null ? 0 : (k.adopted ? KIDS.adoptAllowance : KIDS.allowance)[k.result]), 0)

function addKid(s: GameState, p: Player, adopted: boolean) {
  const age = ageOf(s, p)
  const kidAge = adopted ? rngOf(s).int(5, 8) : 0
  p.kids.push({ adopted, bornAge: age - kidAge, edu: null, result: null })
  if (adopted) p.adopted = 1
  else p.children++
  return kidAge
}

// 성인이 된 자녀 판정 + 용돈
function kidsTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const age = ageOf(s, p)
  const avg = Math.round((p.stats.int + p.stats.str + p.stats.cha) / 3)
  for (const k of p.kids) {
    if (k.result !== null || age < k.bornAge + 20) continue
    const dice = rng.int(1, 6)
    const edu = KIDS.eduBonus[k.edu ?? 0]
    const teach = p.jobId === 'teacher' ? 1 : 0 // 교사 특성: 내 아이 교육 (은퇴 뒤에도)
    const score = avg + edu + dice + teach - (k.adopted ? KIDS.adoptPenalty : 0)
    k.result = score >= KIDS.bigAt ? 2 : score >= KIDS.okAt ? 1 : 0
    p.happy += KIDS.resultHappy[k.result]
    const who = k.adopted ? '입양한 아이' : '아이'
    const how = [`${who}가 어른이 됐지만 잘 안 풀렸다…`, `${who}가 어엿한 어른이 됐다`, `${who}가 크게 성공했다!`][k.result]
    log(s, p.id, `${how} (능력치 ${avg} + 교육 ${edu} + 주사위 ${dice}${teach ? ' + 교사 1' : ''}${k.adopted ? ` - ${KIDS.adoptPenalty}` : ''}) 매 턴 용돈 ${won((k.adopted ? KIDS.adoptAllowance : KIDS.allowance)[k.result])}`, k.result ? 'good' : 'bad')
    if (k.result === 2) s.banner = { title: '자녀 대성공!', text: p.name, tone: 'good' }
  }
  // 교육을 적게 하면 말썽이 잦고, 많이 하면 가끔 공부 스트레스
  for (const k of p.kids) {
    if (k.result !== null || k.edu === null || !rng.chance(KIDS.eduTrouble[k.edu])) continue
    const sc = scaleOf(s)
    const b = k.edu === 2
      ? { text: '아이가 공부 스트레스로 힘들어한다', loss: 0, happyLoss: 2 }
      : rng.pick([{ text: '아이가 학교에서 사고를 쳤다', loss: sc * 2, happyLoss: 3 }, { text: '아이가 방황한다', loss: 0, happyLoss: 2 }])
    badEvent(s, p, b)
  }
  // 좋은 사건: 교육을 많이 할수록 잦음 (7살부터)
  for (const k of p.kids) {
    if (k.result !== null || age - k.bornAge < 7 || !rng.chance(KIDS.eduGood[k.edu ?? 0])) continue
    if (rng.chance(0.5)) { p.happy += 3; log(s, p.id, '아이가 공부를 잘해서 상을 받아 왔다 (행복 +3)', 'good') }
    else { const g = scaleOf(s) * 2; p.money += g; p.happy += 1; log(s, p.id, `아이가 대회에서 상금·장학금을 받아 왔다 +${won(g)}`, 'good') }
  }
  // 육순·칠순: 어른이 된 자녀가 용돈을 드림
  for (const m of [60, 70]) {
    if (age < m || p.celebrated.includes(m)) continue
    p.celebrated.push(m)
    const grown = p.kids.filter((k) => k.result !== null)
    if (!grown.length) continue
    const gift = grown.reduce((a, k) => a + KIDS.birthdayGift[k.result!], 0)
    p.money += gift
    p.happy += 3
    log(s, p.id, `${m === 60 ? '육순' : '칠순'} 잔치! 자녀들이 용돈 ${won(gift)}을 드렸다 (행복 +3)`, 'good')
    s.banner = { title: `${m === 60 ? '육순' : '칠순'} 잔치`, text: p.name, tone: 'good' }
  }
  const allowance = kidAllowance(p)
  if (allowance) p.money += allowance
  if (p.kids.some((k) => k.result === 0) && rng.chance(0.04)) {
    badEvent(s, p, { text: '다 큰 자녀가 사고를 쳐서 뒷수습했다', loss: scaleOf(s) * 2, happyLoss: 2 })
  }
}

function eduPending(s: GameState, p: Player) {
  const n = p.kids.filter((k) => isMinor(k) && k.edu === null).length
  s.pending = {
    type: 'kidEdu', playerId: p.id, title: '아이 교육', text: `아이 ${n}명. 어른이 될 때까지 매 턴 1명당 드는 돈이에요. 많이 투자할수록 크게 성공하기 쉬워요.`,
    options: KIDS.eduNames.map((name, i) => ({ id: String(i), label: name, desc: `${KIDS.eduCost[i] ? `매 턴 ${won(KIDS.eduCost[i] * n)}` : '돈 안 듦 · 말썽이 잦아요'}${KIDS.eduBonus[i] ? ` · 성공 판정 +${KIDS.eduBonus[i]}` : ''}` })),
  }
}

function familyTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const sp = p.spouse
  if (sp) {
    if (isAdultStage(s)) p.money += sp.wealth * 12
    if (sp.kindness >= 7) p.happy += 1
    if (workJob(s, p)?.id === 'chef') p.happy += 1 // 요리사 특성: 집밥
    if (sp.kindness <= 3) {
      p.happy -= 1
      if (rng.chance(0.1)) { p.happy -= 3; log(s, p.id, `${sp.name}와 부부 싸움을 했다`, 'bad') }
    }
    if (sp.fame >= 7 && rng.chance(0.08)) {
      p.money += sc * 3
      p.happy += 2
      log(s, p.id, `${sp.name}가 방송·광고에 나왔다! 수입 ${won(sc * 3)}`, 'good')
    }
    if (sp.fame >= 7 && rng.chance(0.05)) {
      s.stockPrice[sp.sector] = Math.max(10, Math.round(s.stockPrice[sp.sector] * 0.85))
      badEvent(s, p, { text: `${sp.name} 스캔들! (${sp.sector}주 하락)`, loss: 0, happyLoss: 4 })
    }
    if (sp.fame >= 7 && rng.chance(0.04)) {
      s.stockPrice[sp.sector] = Math.round(s.stockPrice[sp.sector] * 1.15)
      log(s, null, `${p.name}의 배우자 ${sp.name} 큰 성과! ${sp.sector}주 +15%`, 'good')
    }
    if (sp.wealth >= 7 && rng.chance(0.06)) {
      p.money += sc * 2
      log(s, p.id, `${sp.name} 집안에서 도와줬다 +${won(sc * 2)}`, 'good')
    }
    if (rng.chance(0.12)) traitEvent(s, p)
    if (s.stageIdx >= 3 && p.spouse) {
      // 배우자 잘못 사건 (성격이 낮을수록 잘 일어남)
      const myFault = p.lottery.addicted || p.money < 0
      const spouseCh = (sp.kindness <= 3 ? 0.03 : sp.kindness <= 5 ? 0.012 : 0.004) + (sp.trait === '바람기' ? 0.03 : 0)
      if (rng.chance(spouseCh)) divorce(s, p, 'spouse', rng.pick(['외도', '몰래 진 빚', '큰 스캔들']))
      else if (myFault && rng.chance(0.03)) divorce(s, p, 'me', p.lottery.addicted ? '도박중독' : '오래 간 빚')
      else if (workJob(s, p)?.id === 'doctor' && rng.chance(0.04)) divorce(s, p, 'me', '[의사] 일에 바빠 가족에게 소홀했던 것') // 의사 특성
    }
  }
  p.happy += p.kids.filter((k) => k.result === null).length // 어릴 때만 행복, 어른이 되면 행복 대신 용돈
  kidsTick(s, p)
  if (p.pet?.alive) {
    p.happy += 1
    // 운세가 좋으면 더 오래, 나쁘면 조금 빨리
    p.pet.turnsLeft -= p.fortune >= 4 && rng.chance(0.4) ? 0 : p.fortune === 0 && rng.chance(0.4) ? 2 : 1
    if (rng.chance(0.06)) badEvent(s, p, { text: '반려동물이 가구를 망가뜨렸다', loss: sc, happyLoss: 0 })
    if (rng.chance(0.05)) badEvent(s, p, { text: '반려동물 병원비', loss: sc, happyLoss: 1 })
    if (rng.chance(0.06)) { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, '반려동물과 꾸준히 산책해서 체력 +1', 'good') }
    if (p.pet.turnsLeft <= 0) {
      p.pet.alive = false
      p.happy -= 6
      log(s, p.id, '반려동물이 무지개다리를 건넜다…', 'bad')
    }
  }
}

function traitEvent(s: GameState, p: Player) {
  const sp = p.spouse!
  const sc = scaleOf(s)
  switch (sp.trait) {
    case '짠돌이': p.money += Math.round(sc * 0.5); p.happy -= 1; log(s, p.id, `${sp.name}가 아껴서 돈을 모아 왔다 (대신 행복 -1)`, 'info'); break
    case '요리왕': p.happy += 2; log(s, p.id, `${sp.name}의 요리로 행복 +2`, 'good'); break
    case '재테크 고수': p.money += sc; log(s, p.id, `${sp.name}가 주식으로 ${won(sc)} 벌었다`, 'good'); break
    case '육아 천재': if (p.children + p.adopted) { p.happy += 3; log(s, p.id, '아이들이 무럭무럭 자란다 (행복 +3)', 'good') } break
    case '운동 마니아': p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, `${sp.name}와 같이 운동해서 체력 +1`, 'good'); break
    case '인맥왕': p.money += sc; log(s, p.id, `${sp.name}가 좋은 거래를 소개해 줬다 +${won(sc)}`, 'good'); break
    case '도박증': p.money -= sc; log(s, p.id, `${sp.name}가 도박으로 ${won(sc)} 날렸다`, 'bad'); break
    case '명품 중독': p.money -= Math.round(sc * 1.5); log(s, p.id, `${sp.name}의 명품 쇼핑 -${won(sc * 1.5)}`, 'bad'); break
    case '까칠함': p.happy -= 3; log(s, p.id, `${sp.name}와 다퉜다 (행복 -3)`, 'bad'); break
    case '게으름': p.happy -= 2; log(s, p.id, '집안일이 쌓였다 (행복 -2)', 'bad'); break
    case '술고래': badEvent(s, p, { text: `${sp.name}가 술 마시다 다쳤다`, loss: sc, happyLoss: 1, kind: 'health' }); break
    default: break
  }
}

function divorce(s: GameState, p: Player, fault: 'me' | 'spouse', reason: string) {
  const sp = p.spouse!
  if (p.fortune >= 4) {
    log(s, p.id, `[운세 ${fortuneName(p.fortune)}] ${reason} 때문에 이혼 위기… 겨우 넘기고 화해했다`, 'good')
    return
  }
  const sc = scaleOf(s)
  p.happy -= 15
  if (sp.wealth >= 7) p.money += Math.round(Math.max(0, p.money) * 0.1 + sp.wealth * 50)
  else p.money -= Math.round(Math.max(0, p.money) * 0.2)
  const alimony = sc * 4 // 이혼으로 잃는 것(행복·맞벌이)보다 항상 적게
  p.money += fault === 'spouse' ? alimony : -alimony
  p.spouse = null
  p.divorced = true
  p.suitors = [{ ...sp, affinity: fault === 'me' ? 10 : 35 }] // 재결합 후보
  log(s, p.id, `${sp.name}와 이혼했다 (${reason} · ${fault === 'spouse' ? '배우자 잘못, 위자료 받음' : '내 잘못, 위자료 냄'})`, 'bad')
  s.banner = { title: '이혼', text: `${p.name}와 ${sp.name}`, tone: 'bad' }
  say(s, p, 'divorce')
}

// ───────── 나쁜 일과 운세 ─────────

interface Bad { text: string; loss: number; happyLoss: number; kind?: InsuranceKind }

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
  if (choice === 'minus' && n > 1) { n -= 1; log(s, p.id, `${CARS[p.car].name}로 1칸 덜 갔다`, 'info') }
  if (choice === 'plus') { n += 1; log(s, p.id, `${CARS[p.car].name}로 1칸 더 갔다`, 'info') }
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
const luckBonus = (p: Player) => (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0)
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
    if (p.spouse) c.push({ art: 'travel', title: '함께 여행', text: `${p.spouse.name}와 여행을 다녀왔다!`, bonus: 1 })
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

const POP_ART: Record<string, string> = { special: 'card', dilemma: 'card', money: 'money', risk: 'warn', card: 'card', happy: 'rest', date: 'heart', mini: 'medal' }
const POP_TITLE: Record<string, string> = { special: '특별 이벤트', dilemma: '양심 선택', money: '돈 칸', risk: '위기 칸', card: '랜덤이벤트', happy: '행복 칸', date: '연애 칸', mini: '미니게임' }

// 사건 팝업: start 이후 남은 기록(내 것 + 모두에게 일어난 것)을 그림과 함께. 고를 게 있으면 선택 창이 대신 뜸
function showPop(s: GameState, p: Player, start: number, art: string, title: string) {
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
  const kind = t.kind === 'good' ? pickGood(s) : t.kind
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
    case 'mini': startMini(s, p, t.mini!); break
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

function giveChance(s: GameState, p: Player, card: ChanceCard) {
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

const randomChance = (rng: Rng) => rng.pick(['reroll', 'block', 'charm', 'coupon'] as ChanceCard[]) // 지름길(+2)은 없앰 (2026-10-23 사용자)

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

function contest(s: GameState, p: Player) {
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

// ───────── 미니게임 (이벤트 길) ─────────

const MINI_STAT: Record<MiniId, StatKey | 'fortune' | null> = {
  race: 'str', tug: 'str', throw: 'str',
  memory: 'int', pairs: 'int', quickmath: 'int',
  firstImpression: 'cha', rhythm: 'cha', confess: 'cha', dance: 'cha',
  oddEven: 'fortune', highLow: 'fortune', slot: 'fortune',
  snap: 'str', pack: 'int', photo: 'int',
}
export const MINI_NAMES: Record<MiniId | DuelId, string> = {
  race: '달리기', tug: '줄다리기', throw: '공 던지기',
  memory: '기억력', pairs: '같은 그림 찾기', quickmath: '빠른 계산',
  firstImpression: '첫인상', rhythm: '무대 공연', confess: '고백 타이밍', dance: '댄스 따라 하기',
  oddEven: '홀짝', highLow: '카드 높낮이', slot: '슬롯머신',
  snap: '사진 찍기', pack: '짐 싸기', photo: '여행 코스 기억',
  dice: '주사위 대결', rps: '가위바위보', timing: '타이밍 멈추기',
}
const CASINO: MiniId[] = ['oddEven', 'highLow', 'slot']

// 0 쉬움, 1 보통, 2 어려움 (능력치·운세가 높을수록 쉬움)
export function miniLevel(p: Player, game: MiniId | DuelId): number {
  const key = game in MINI_STAT ? MINI_STAT[game as MiniId] : game === 'timing' ? 'str' : null
  if (key === null) return 1
  const v = key === 'fortune' ? [1, 3, 5, 8, 10][p.fortune] : p.stats[key]
  return v >= 7 ? 0 : v >= 4 ? 1 : 2
}

// 카지노 판돈: 가진 돈의 몇 % (2026-10-21 사용자: 노년의 역전 또는 패망 기회)
const CASINO_PCT = [10, 30, 50]
const casinoStake = (p: Player, pct: number) => Math.max(0, Math.floor((p.money * pct) / 100))

const FEST_GAMES: MiniId[] = ['firstImpression', 'rhythm', 'confess', 'dance']
// 축제 거리(청년): 칸마다 누구와 할지 고름. 예전에 만난 사람 또는 새 사람(랜덤). 만난 사람이 없으면 새 사람 (2026-10-21 사용자)
const festPartners = (p: Player) => [...p.suitors].filter((x) => x.affinity < 100).sort((a, b) => b.affinity - a.affinity).slice(0, 4)

function startMini(s: GameState, p: Player, game: MiniId, target?: string) {
  const level = miniLevel(p, game)
  const casino = CASINO.includes(game)
  const fest = FEST_GAMES.includes(game) && stageOf(s).id === 'young' && !p.spouse
  if (fest && target === undefined) {
    const known = festPartners(p)
    if (known.length && p.human) {
      s.pending = {
        type: 'festTarget', playerId: p.id, title: `축제 거리: ${MINI_NAMES[game]}`, text: '누구와 축제를 즐길까요? 잘하면 호감도가 올라요.',
        options: [
          ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `💞 ${x.name}${stars(x.grade)} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
          { id: 'new', label: '✨ 새로운 사람 만나기', desc: '아무나 한 명을 골라요' },
        ],
        data: { game },
      }
      return
    }
    // AI: 호감이 쌓인 사람이 있으면 대개 그 사람과
    const best = known[0]
    target = best && (best.affinity >= 30 || rngOf(s).chance(0.6)) ? `old:${best.name}:${best.grade}` : 'new'
  }
  if (casino && p.human) {
    s.pending = {
      type: 'casinoStake', playerId: p.id, title: `카지노: ${MINI_NAMES[game]}`, text: `마지막 역전 기회! 가진 돈(${won(p.money)})에서 얼마나 걸까요? 운세가 좋을수록 잘 맞아요 (지금 운세 ${fortuneName(p.fortune)}).\n대박이면 건 돈의 3배를 받고(+2배), 조금 따면 +절반, 지면 건 돈을 다 잃어요.`,
      options: CASINO_PCT.map((pct) => { const v = casinoStake(p, pct); return { id: `pct${pct}`, label: `가진 돈의 ${pct}% 걸기 (${won(v)})`, disabled: v <= 0 } }).concat([{ id: '0', label: '그냥 구경만', disabled: false }]),
      data: { game, level },
    }
    return
  }
  // AI 판돈: 도박꾼형은 운세가 좋으면 크게, 나머지는 성격대로
  const stake = casino ? casinoStake(p, p.personality === 'gambler' ? (p.fortune >= 3 ? 50 : 30) : p.personality === 'investor' ? 30 : 10) || undefined : undefined
  if (stake) {
    // 카지노: 할 때마다 도박중독 확률과 연결
    const rng = rngOf(s)
    if (!p.lottery.addicted && rng.chance(p.lottery.chance / 100)) {
      p.lottery.addicted = true
      log(s, p.id, '카지노에 빠졌다… 도박중독', 'bad')
    }
    p.lottery.chance = Math.min(50, p.lottery.chance + 5)
  }
  if (p.human) {
    s.mini = { game, playerId: p.id, level, stake, target }
    return
  }
  // AI: 능력치에 비례한 확률로 결과
  const rng = rngOf(s)
  const great = [0.55, 0.32, 0.15][level]
  const r = rng.next()
  const grade = r < great ? 2 : r < great + 0.35 ? 1 : 0
  log(s, p.id, `[${MINI_NAMES[game]}] ${['실패', '성공', '대성공'][grade]}`, grade ? 'good' : 'bad')
  miniReward(s, p, game, grade, stake, target)
}

// 사람이 미니게임을 마치면 화면에서 부름. grade: 0 실패, 1 성공, 2 대성공 / 대결 timing이면 점수(0~100)
export function finishMini(s: GameState, value: number) {
  const m = s.mini
  if (!m) return
  const p = s.players[m.playerId]
  s.mini = null
  if (m.duel?.queue?.length) { // 대결에서 아직 안 한 사람이 있으면 그 사람 차례 (온라인)
    const next = s.players[m.duel.queue[0]]
    s.mini = { game: m.game, playerId: next.id, level: miniLevel(next, m.game), duel: { ids: m.duel.ids, results: { ...m.duel.results, [p.id]: value }, queue: m.duel.queue.slice(1) } }
    resume(s)
    return
  }
  const miniStart = s.logCount
  if (m.duel) resolveDuel(s, m.game as DuelId, m.duel.ids, { ...m.duel.results, [p.id]: value })
  else miniReward(s, p, m.game as MiniId, Math.max(0, Math.min(2, Math.round(value))), m.stake, m.target)
  showPop(s, p, miniStart, 'medal', m.duel ? '대결 결과' : '미니게임 결과')
  resume(s)
}

// 미니게임 주인이 AI가 됐을 때 (온라인에서 하던 사람이 나감) AI 결과로 끝냄
export function aiFinishMini(s: GameState) {
  const m = s.mini
  if (!m || s.players[m.playerId].human) return
  const rng = rngOf(s)
  const q = s.players[m.playerId]
  if (m.duel) { finishMini(s, timingScore(rng, q)); return }
  const r = rng.next()
  const great = [0.55, 0.32, 0.15][m.level] ?? 0.32
  finishMini(s, r < great ? 2 : r < great + 0.35 ? 1 : 0)
}

// 데이트로 오르는 호감도: 등급이 낮을수록, 내 매력이 높을수록 많이 오름
export function affinityGain(s: GameState, p: Player, x: Suitor) {
  const [lo, hi] = ([[30, 40], [25, 33], [20, 27], [15, 22], [12, 18]] as const)[Math.max(0, Math.min(4, x.grade - 1))]
  const base = rngOf(s).int(lo, hi) + Math.max(0, p.stats.cha - 4)
  const job = workJob(s, p)
  const jobMult = JOB_AFFINITY[job ? job.id : 'none'] ?? 1 // 직업 특성 (아이돌 +30% … 백수 -25%)
  return Math.round(base * MOOD_AFFINITY[moodLevel(p)] * (p.house ? HOUSE_AFFINITY : 1) * jobMult) // 기쁘면 +15%, 집 있으면 +10%
}

// 축제 거리: 호감도가 아니라 새 사람을 만나는 곳. 대성공이면 높은 등급이 잘 나옴
function addAffinityOrMeet(s: GameState, p: Player, amount: number, target?: string) {
  if (p.spouse) { p.happy += Math.round(amount / 5); log(s, p.id, `${p.spouse.name}와 축제를 즐겼다. 행복 +${Math.round(amount / 5)}`, 'good'); return }
  const known = target && target !== 'new' ? findSuitor(p, target) : undefined
  if (known) {
    const add = Math.min(100 - known.affinity, amount)
    known.affinity += add
    log(s, p.id, `축제에서 ${known.name}와 더 가까워졌다! 호감도 +${add}% (지금 ${known.affinity}%)`, 'good')
    return
  }
  const x = makeSuitor(s, p, { vip: amount >= 30 })
  x.affinity = amount + 10 // 축제에서 만나면 첫인상이 좋아 조금 높게 시작
  p.suitors.push(x)
  log(s, p.id, `축제에서 ${x.name}${stars(x.grade)}를 만났다! 호감도 ${x.affinity}% (데이트 칸에서 호감도를 올려요)`, 'good')
}


// 미니게임 설명서에 보여 줄 '무엇이 쉽게 해 주나'와 보상 (miniReward와 같은 내용)
export function miniGuide(s: GameState, game: MiniId | DuelId, duel: boolean): { stat: string; reward: string } {
  if (duel) return { stat: '같은 칸에 선 사람끼리 점수로 겨뤄요', reward: `1등이 꼴찌에게서 ${won(DUEL_STAKE[stageOf(s).id] ?? scaleOf(s))}을 받아요` }
  const k = MINI_STAT[game as MiniId]
  const stat = k === 'fortune' ? '운세가 좋을수록 유리해요' : k ? `${STAT_NAMES[k]}이 높을수록 쉬워요` : '운에 맡겨요'
  const chance = ' · 대성공이면 가끔 찬스 카드'
  let reward: string
  if (['race', 'tug', 'throw'].includes(game)) reward = '대성공 체력 +1·행복 +3 / 성공 체력 +1·행복 +1 / 실패 행복 -1'
  else if (['memory', 'pairs', 'quickmath'].includes(game)) reward = '대성공 지력 +1·행복 +2 / 성공 지력 +1 / 실패 없음'
  else if (['firstImpression', 'rhythm', 'confess', 'dance'].includes(game) && stageOf(s).id === 'student') reward = '대성공 매력 +1·행복 +2 / 성공 매력 +1 / 실패 행복 -1'
  else if (['firstImpression', 'rhythm', 'confess', 'dance'].includes(game)) reward = '대성공 매력 +1·호감도 +30 (없으면 새 사람) / 성공 호감도 +15 / 실패 행복 -2'
  else if (CASINO.includes(game as MiniId)) reward = '대박 판돈의 2배를 더 받음 / 조금 따면 절반 / 지면 판돈을 잃어요'
  else reward = '대성공 행복 +8 / 성공 +4 / 실패 +1'
  return { stat, reward: reward + chance }
}

function miniReward(s: GameState, p: Player, game: MiniId, grade: number, stake?: number, target?: string) {
  const name = MINI_NAMES[game]
  if (grade === 2 && !p.chance && rngOf(s).chance(0.25)) giveChance(s, p, randomChance(rngOf(s)))
  const statUp = (k: StatKey, n: number) => { p.stats[k] = clampStat(p.stats[k] + n) }
  if (['race', 'tug', 'throw'].includes(game)) {
    if (grade === 2) { statUp('str', 1); p.happy += 3; log(s, p.id, `${name} 1등! 체력 +1, 행복 +3`, 'good') }
    else if (grade === 1) { statUp('str', 1); p.happy += 1; log(s, p.id, `${name} 입상! 체력 +1`, 'good') }
    else { p.happy -= 1; log(s, p.id, `${name}에서 넘어졌다… 행복 -1`, 'bad') }
  } else if (['memory', 'pairs', 'quickmath'].includes(game)) {
    if (grade === 2) { statUp('int', 1); p.happy += 2; log(s, p.id, `${name} 금메달! 지력 +1, 행복 +2`, 'good') }
    else if (grade === 1) { statUp('int', 1); log(s, p.id, `${name} 통과! 지력 +1`, 'good') }
    else log(s, p.id, `${name} 아쉽게 탈락`, 'info')
  } else if (['firstImpression', 'rhythm', 'confess', 'dance'].includes(game) && stageOf(s).id === 'student') {
    // 학교 축제: 연애 대신 매력
    if (grade === 2) { statUp('cha', 1); p.happy += 2; log(s, p.id, `[학교 축제] ${name} 1등! 매력 +1, 행복 +2`, 'good') }
    else if (grade === 1) { statUp('cha', 1); log(s, p.id, `[학교 축제] ${name} 성공! 매력 +1`, 'good') }
    else { p.happy -= 1; log(s, p.id, `[학교 축제] ${name}… 긴장해서 망쳤다. 행복 -1`, 'bad') }
  } else if (['firstImpression', 'rhythm', 'confess', 'dance'].includes(game)) {
    if (grade === 2) { statUp('cha', 1); addAffinityOrMeet(s, p, 30, target) }
    else if (grade === 1) addAffinityOrMeet(s, p, 15, target)
    else { p.happy -= 2; log(s, p.id, `${name} 대실패… 행복 -2`, 'bad') }
  } else if (CASINO.includes(game)) {
    const st = stake ?? scaleOf(s) * 2
    if (grade === 2) { p.money += st * 2; log(s, p.id, `${name} 대박! +${won(st * 2)}`, 'good'); say(s, p, 'casinoWin') }
    else if (grade === 1) { p.money += Math.round(st * 0.5); log(s, p.id, `${name} 조금 땄다 +${won(st * 0.5)}`, 'good') }
    else { p.money -= st; log(s, p.id, `${name}에서 잃었다 -${won(st)}`, 'bad'); say(s, p, 'casinoLose') }
  } else {
    const h = [1, 4, 8][grade]
    p.happy += h
    log(s, p.id, `[세계일주] ${name}: 행복 +${h}`, 'good')
  }
}

// ───────── 같은 칸 만남 ─────────

const MEET_EVENTS: Record<'child' | 'student' | 'old', { good: [string, (p: Player) => void][]; bad: [string, (p: Player) => void][] }> = {
  child: {
    good: [['같이 놀았다 (행복 +3)', (p) => { p.happy += 3 }], ['간식을 나눠 먹었다 (행복 +2)', (p) => { p.happy += 2 }]],
    bad: [['장난감 때문에 싸웠다 (행복 -2)', (p) => { p.happy -= 2 }], ['같이 뛰다 넘어졌다 (체력 -1)', (p) => { p.stats.str = clampStat(p.stats.str - 1) }]],
  },
  student: {
    good: [['같이 공부했다 (지력 +1)', (p) => { p.stats.int = clampStat(p.stats.int + 1) }], ['같이 운동했다 (체력 +1)', (p) => { p.stats.str = clampStat(p.stats.str + 1) }]],
    bad: [['숙제 베끼다 걸렸다 (지력 -1)', (p) => { p.stats.int = clampStat(p.stats.int - 1) }], ['수업 시간에 떠들다 혼났다 (행복 -2)', (p) => { p.happy -= 2 }]],
  },
  old: {
    good: [['옛날이야기로 웃었다 (행복 +3)', (p) => { p.happy += 3 }], ['같이 산책했다 (체력 +1)', (p) => { p.stats.str = clampStat(p.stats.str + 1) }]],
    bad: [['옛날 빚 이야기가 나왔다 (돈 -)', (p) => { p.money -= 50 }], ['말다툼을 했다 (행복 -2)', (p) => { p.happy -= 2 }]],
  },
}

function meet(s: GameState) {
  const p = cur(s)
  const others = s.players.filter((q) => q.id !== p.id && q.pos === p.pos && !q.finished)
  if (!others.length) return
  const all = [p, ...others]
  const rng = rngOf(s)
  const id = stageOf(s).id
  // 팀전: 같은 팀끼리만 만나면 대결 대신 둘 다 행복 +2
  if (s.settings.teams && all.every((q) => q.team === p.team)) {
    for (const q of all) q.happy += 2
    log(s, null, `${all.map((q) => q.name).join(', ')} 같은 팀끼리 만났다! 하이파이브 (행복 +2)`, 'good')
    return
  }
  if (id === 'young' || id === 'middle') {
    const game = rng.pick(['dice', 'rps', 'timing'] as DuelId[])
    log(s, null, `${all.map((q) => q.name).join(', ')} 같은 칸에서 만났다! ${MINI_NAMES[game]}`, 'info')
    const ids = all.map((q) => q.id)
    if (game === 'dice') {
      const res: Record<number, number> = {}
      for (const q of all) res[q.id] = rng.int(1, 6)
      resolveDuel(s, game, ids, res)
    }
    // 직접 하는 사람: 온라인은 대결에 낀 사람 모두(각자 기기로 차례대로), 혼자 하기는 지금 차례인 사람만
    const players = (s.settings.online ? all.filter((q) => q.human) : p.human ? [p] : []).map((q) => q.id)
    if (game === 'rps') {
      if (players.length) rpsPending(s, ids, {}, players)
      else resolveRps(s, ids, {})
    } else if (game === 'timing') {
      const res: Record<number, number> = {}
      for (const q of all) if (!players.includes(q.id)) res[q.id] = timingScore(rng, q)
      if (players.length) s.mini = { game: 'timing', playerId: players[0], level: miniLevel(s.players[players[0]], 'timing'), duel: { ids, results: res, queue: players.slice(1) } }
      else resolveDuel(s, game, ids, res)
    }
    return
  }
  const ev = MEET_EVENTS[id]
  log(s, null, `${all.map((q) => q.name).join(', ')} 같은 칸에서 만났다!`, 'info')
  for (const q of all) {
    const good = q.fortune >= 3 || (q.fortune === 2 && rng.chance(0.5))
    const [text, fx] = rng.pick(good ? ev.good : ev.bad)
    fx(q)
    log(s, q.id, `[운세 ${fortuneName(q.fortune)}] ${text}`, good ? 'good' : 'bad')
  }
}

// 가위바위보: queue의 첫 사람에게 묻고, 고른 것은 picks에 모음
// humans: 직접 고르는 사람 전부 (비기면 처음부터 다시 물음). again: 비겨서 다시 (방금 낸 손은 계속 보여 줌)
function rpsPending(s: GameState, ids: number[], picks: Record<number, number>, queue: number[], humans = queue, again = false) {
  const who = s.players[queue[0]]
  const others = ids.filter((i) => i !== who.id).map((i) => s.players[i].name)
  if (!again && (!s.rpsShow || s.rpsShow.picks)) s.rpsShow = { id: (s.rpsShow?.id ?? 0) + 1, ids, picks: null }
  s.pending = {
    type: 'rps', playerId: who.id, title: again ? '비겼어요! 한 번 더' : '가위바위보!', text: `${others.join(', ')}와 한 판. 진 사람은 능력치 -1`,
    options: [{ id: '0', label: '가위' }, { id: '1', label: '바위' }, { id: '2', label: '보' }], data: { ids, picks, queue: queue.slice(1), humans },
  }
}

const timingScore = (rng: Rng, q: Player) => Math.max(0, Math.min(100, Math.round(35 + q.stats.str * 5 + (rng.next() - 0.5) * 50)))

function rpsScore(ids: number[], picks: Record<number, number>) {
  // 점수 = 다른 사람 각각을 이긴 수 - 진 수
  const res: Record<number, number> = {}
  for (const a of ids) {
    res[a] = 0
    for (const b of ids) {
      if (a === b) continue
      const d = (picks[a] - picks[b] + 3) % 3
      if (d === 1) res[a]++
      else if (d === 2) res[a]--
    }
  }
  return res
}

// 비기면 승부가 날 때까지 다시 (2026-10-21 사용자). 사람이 끼면 다시 묻고, AI끼리는 바로 다시 냄
function resolveRps(s: GameState, ids: number[], picks: Record<number, number>, humans: number[] = []) {
  const rng = rngOf(s)
  const names = ['가위', '바위', '보']
  for (let tries = 0; ; tries++) {
    for (const id of ids) if (picks[id] === undefined) picks[id] = rng.int(0, 2)
    const res = rpsScore(ids, picks)
    const vals = ids.map((i) => res[i])
    const draw = Math.max(...vals) === Math.min(...vals)
    s.rpsShow = { id: (s.rpsShow?.id ?? 0) + 1, ids, picks: { ...picks } }
    log(s, null, ids.map((i) => `${s.players[i].name} ${names[picks[i]]}`).join(', ') + (draw ? ' → 비김! 한 번 더' : ''), 'info')
    if (!draw || tries >= 20) { resolveDuel(s, 'rps', ids, res); return }
    if (humans.length) { rpsPending(s, ids, {}, humans, humans, true); return }
    picks = {}
  }
}

// 타이밍 대결 판돈: 청년 150만·중년 300만 (2026-10-21 사용자)
const DUEL_STAKE: Partial<Record<StageId, number>> = { young: 150, middle: 300 }

// 꼴찌만 잃고, 1등이 잃은 만큼 얻는다 (운은 1단계, 능력치는 1개 +1, 돈은 전부)
function resolveDuel(s: GameState, game: DuelId, ids: number[], res: Record<number, number>) {
  const rng = rngOf(s)
  const vals = ids.map((i) => res[i])
  const top = Math.max(...vals)
  const low = Math.min(...vals)
  if (top === low) { log(s, null, `${MINI_NAMES[game]}: 무승부!`, 'info'); return }
  for (const i of ids) if (res[i] === top) s.players[i].record.duelWins++
  const winners = ids.filter((i) => res[i] === top).map((i) => s.players[i])
  const losers = ids.filter((i) => res[i] === low).map((i) => s.players[i])
  if (game === 'dice') {
    for (const l of losers) l.happy -= 1
    for (const w of winners) w.happy += 2
    log(s, null, `${MINI_NAMES[game]}: ${winners.map((w) => w.name).join(', ')} 승! 행복 +2 / ${losers.map((l) => l.name).join(', ')} 행복 -1`, 'info')
  } else if (game === 'rps') {
    for (const l of losers) { const k = rng.pick(STATS); l.stats[k] = clampStat(l.stats[k] - 1); log(s, l.id, `가위바위보 패배: ${STAT_NAMES[k]} -1`, 'bad') }
    const k = rng.pick(STATS)
    for (const w of winners) { w.stats[k] = clampStat(w.stats[k] + 1); log(s, w.id, `가위바위보 승리: ${STAT_NAMES[k]} +1`, 'good') }
  } else {
    const loss = DUEL_STAKE[stageOf(s).id] ?? scaleOf(s)
    let pot = 0
    for (const l of losers) { l.money -= loss; pot += loss }
    const share = Math.round(pot / winners.length)
    for (const w of winners) w.money += share
    log(s, null, `타이밍: ${ids.map((i) => `${s.players[i].name} ${res[i]}점`).join(', ')} → ${winners.map((w) => w.name).join(', ')} +${won(share)} / ${losers.map((l) => l.name).join(', ')} -${won(loss)}`, 'info')
  }
  for (const w of winners) say(s, w, 'duelWin')
  for (const l of losers) say(s, l, 'duelLose')
}

// ───────── 연애와 결혼 ─────────

type Attr = 'looks' | 'wealth' | 'fame' | 'kindness'

export function makeSuitor(s: GameState, p: Player, opts: { attr?: Attr | null; vip?: boolean } = {}): Suitor {
  const rng = rngOf(s)
  const boost = (PRESTIGE_JOBS.includes(p.jobId ?? '') ? 1 : 0) + (p.car === 3 ? 1 : 0)
  const base = opts.vip ? [4, 10, 34, 32, 20] : [30, 30, 20, 13, 7]
  const w = base.map((x, i) => [i + 1, Math.max(1, i < 2 ? x - boost * 6 : x + boost * 4)] as const)
  const grade = rng.weighted(w)
  const b = 2 + grade
  const roll = () => Math.max(1, Math.min(10, b + rng.int(-3, 3)))
  const attrs = { looks: roll(), wealth: roll(), fame: roll(), kindness: roll() }
  const keys = Object.keys(attrs) as Attr[]
  const strong = opts.attr ?? rng.pick(keys)
  attrs[strong] = Math.min(10, attrs[strong] + (opts.attr ? 3 : 2))
  const weights = TRAITS.map((t) => {
    let x = 1
    const n = t.name
    if (attrs.kindness >= 7 && (n === '요리왕' || n === '육아 천재')) x *= 3
    if (attrs.kindness >= 7 && (n === '까칠함' || n === '게으름')) x *= 0.3
    if (attrs.kindness <= 3 && (n === '까칠함' || n === '게으름')) x *= 3
    if (attrs.looks >= 7 && (n === '운동 마니아' || n === '명품 중독' || n === '바람기')) x *= 2.5
    if (attrs.fame >= 7 && (n === '인맥왕' || n === '도박증' || n === '술고래' || n === '바람기')) x *= 2.5
    if (attrs.wealth >= 7 && n === '재테크 고수') x *= 3
    if (attrs.wealth <= 3 && n === '짠돌이') x *= 3
    return [t, x] as const
  })
  const trait = rng.weighted(weights)
  const sector: Sector = attrs.fame >= 7 && rng.chance(0.6) ? '엔터' : attrs.wealth >= 7 && rng.chance(0.5) ? '의료' : rng.pick(SECTORS)
  return {
    name: rng.pick(SPOUSE_NAMES), grade, ...attrs, sector,
    trait: trait.name, traitGood: trait.good, revealed: false, affinity: 0,
  }
}

export const stars = (n: number) => '★'.repeat(n)
const suitorDesc = (x: Suitor) => `${stars(x.grade)} · 외모 ${x.looks} 재력 ${x.wealth} 명성 ${x.fame} 성격 ${x.kindness} · ${x.sector}`

function canDate(s: GameState, p: Player) {
  const id = stageOf(s).id
  if (p.spouse || (id !== 'young' && id !== 'middle')) return false
  if (id === 'middle') {
    // 중년 결혼 지점을 지나면 더는 결혼 기회가 없음
    const st = stageOf(s)
    const point = st.tiles.find((t) => t.point === 'marriage')
    if (point && tileOf(s, p).d > point.d) return false
  }
  return true
}

function dateTile(s: GameState, p: Player) {
  if (p.spouse) {
    if (stageOf(s).id === 'young' && p.children < 3) {
      s.pending = {
        type: 'baby', playerId: p.id, title: '아기를 낳을까요?', text: `지금 자녀 ${p.children}명 (최대 3명). 자녀는 매 턴 행복을 주고 양육비가 들어요. 어른이 되면 용돈을 줘요.`,
        options: [{ id: 'yes', label: '낳는다' }, { id: 'no', label: '나중에' }],
      }
    } else { p.happy += 2; log(s, p.id, `${p.spouse.name}와 데이트. 행복 +2`, 'good') }
    return
  }
  if (!canDate(s, p)) { p.happy += 2; log(s, p.id, '좋은 사람들을 만났다. 행복 +2', 'good'); return }
  const fresh = [makeSuitor(s, p), makeSuitor(s, p)]
  const known = [...p.suitors].sort((a, b) => b.affinity - a.affinity).slice(0, 2)
  const options: ChoiceOption[] = [
    ...fresh.map((x, i) => ({ id: `new${i}`, label: `새로운 사람: ${x.name}`, desc: suitorDesc(x) })),
    ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `다시 데이트: ${x.name} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
  ]
  s.pending = { type: 'date', playerId: p.id, title: '데이트', text: '누구와 데이트할까요?', options, data: { fresh } }
}

// 소개팅 회사: 가입 중이면 매 턴 시작마다 만남
function agencyTurn(s: GameState, p: Player) {
  if (!canDate(s, p)) return
  const known = [...p.suitors].sort((a, b) => b.affinity - a.affinity).slice(0, 2)
  s.pending = {
    type: 'agency', playerId: p.id, title: `소개팅 회사 (${p.agency!.vip ? 'VIP' : '일반'})`, text: '이번 차례 만남을 골라요.',
    options: [
      { id: 'new', label: '새 사람 소개받기', desc: p.agency!.attr ? `${ATTR_NAMES[p.agency!.attr]} 높은 사람으로` : '' },
      ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `데이트: ${x.name} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
      { id: 'skip', label: '이번엔 쉬기' },
      { id: 'quit', label: '해지하기' },
    ],
  }
}

const ATTR_NAMES: Record<Attr, string> = { looks: '외모', wealth: '재력', fame: '명성', kindness: '성격' }

// 집·차 값 (쿠폰을 쓰는지에 따라). 대출 끼고 사기는 계약금
function bigPrice(s: GameState, p: Player, id: string, coupon: boolean) {
  if (id.startsWith('mortgage')) return mortgagePlan(s, p, +id.slice(8), coupon).down
  if (id.startsWith('house')) return houseCost(s, p, +id.slice(5), coupon)
  return carCost(p, +id.slice(3), coupon)
}

// after: 다 사고 다시 열 상점 (소개팅 회사처럼 창이 하나 더 뜨면 그 뒤에 엶)
function shopBuy(s: GameState, p: Player, optionId: string, useCoupon: boolean, after?: ShopVisit) {
  const rng = rngOf(s)
  p.record.shopBuys++
  const big = /^(house|mortgage|car)\d/.test(optionId)
  if (big && useCoupon) { p.chance = null; log(s, p.id, '할인 쿠폰을 썼다', 'info') }
  if (optionId.startsWith('mortgage')) {
    const i = +optionId.slice(8) as 0 | 1 | 2 | 3
    const m = mortgagePlan(s, p, i, useCoupon)
    const old = p.house ? `${HOUSES[p.house].name}을 팔고 ` : ''
    spend(p, m.down)
    p.loans.push({ amount: m.borrow, dueTurn: p.turnsPlayed + HOUSE_RULES.mortgageTurns, kind: '주담대', installment: m.installment, missed: 0 })
    p.house = i; p.happy += HOUSES[i].happy
    log(s, p.id, `${old}${HOUSES[i].name}을 대출 끼고 샀다! 계약금 ${won(m.down)}, 매 턴 ${won(m.installment)}씩 갚기. 행복 +${HOUSES[i].happy}`, 'good')
    say(s, p, 'house')
    s.banner = { title: '내 집 마련!', text: `${p.name}: ${HOUSES[i].name}`, tone: 'good' }
  } else if (optionId.startsWith('house')) {
    const i = +optionId.slice(5) as 0 | 1 | 2 | 3
    const cost = houseCost(s, p, i, useCoupon)
    const old = p.house ? `${HOUSES[p.house].name}을 ${won(houseValue(s, p))}에 팔고 ` : ''
    spend(p, cost); p.house = i; p.happy += HOUSES[i].happy
    log(s, p.id, `${old}${HOUSES[i].name}을 샀다! 행복 +${HOUSES[i].happy}`, 'good')
    say(s, p, 'house')
  } else if (optionId.startsWith('car')) {
    const i = +optionId.slice(3) as 0 | 1 | 2 | 3
    const cost = carCost(p, i, useCoupon)
    const old = p.car ? `${CARS[p.car].name}를 ${won(carResale(p))}에 팔고 ` : ''
    spend(p, cost)
    p.carValue = CARS[i].price
    // 차를 바꿔도 이번 단계에 이미 쓴 횟수는 이어진다
    const usedThisStage = p.car ? carChargesAt(p, s.stageIdx) - p.carCharges : 0
    p.car = i
    p.carStage = s.stageIdx
    p.carCharges = Math.max(0, carChargesAt(p, s.stageIdx) - usedThisStage)
    if (i === 3) p.happy += 4
    log(s, p.id, `${old}${CARS[i].name}를 샀다!`, 'good')
  } else if (optionId.startsWith('agency')) {
    const vip = optionId === 'agency1'
    s.pending = {
      type: 'agencyAttr', playerId: p.id, title: `소개팅 회사 ${vip ? 'VIP' : '일반'} 가입`, text: '어떤 사람을 소개받고 싶나요?',
      options: [...(Object.keys(ATTR_NAMES) as Attr[]).map((a) => ({ id: a, label: `${ATTR_NAMES[a]} 높은 사람` })), { id: 'none', label: '상관없음' }],
      data: { vip, visit: after },
    }
  } else if (optionId === 'chance') {
    spend(p, 100)
    giveChance(s, p, randomChance(rng))
  } else if (optionId === 'pet') {
    spend(p, 50)
    adoptPet(s, p, '상점에서 반려동물을 데려왔다')
  } else if (optionId.startsWith('dice_')) {
    const k = optionId.slice(5) as DiceItem
    if (p.diceItems.length < MAX_DICE_ITEMS) {
      spend(p, DICE_ITEMS[k].price)
      p.diceItems.push(k)
      log(s, p.id, `${DICE_ITEMS[k].name}를 샀다 (가진 주사위 아이템 ${p.diceItems.length}개)`, 'info')
    }
  }
}

// 상점: 한 번 들르면 여러 번 살 수 있음. 집·차는 둘 중 하나만, 다른 물건은 원하는 만큼 (2026-10-21 사용자)
// 노년 상점 물건(여행·선물·기부)은 없앰 (2026-10-21 사용자)
type ShopVisit = { big: boolean; n: number }
function openShop(s: GameState, p: Player, visit: ShopVisit = { big: false, n: 0 }) {
  const coupon = p.chance === 'coupon' ? 0.7 : 1
  const opts: ChoiceOption[] = []
  if (!visit.big) HOUSES.forEach((h, i) => {
    if (i <= p.house) return
    const cost = houseCost(s, p, i)
    const sell = p.house ? ` · 지금 집 팔고 ${won(cost)}만 더` : ''
    opts.push({ id: `house${i}`, label: `${h.name} 사기`, desc: `시세 ${won(housePriceOf(s, i))}${coupon < 1 ? ` (쿠폰 쓰면 -${won(couponOff(housePriceOf(s, i), 1000))})` : ''}${sell} · 매 턴 관리비 ${won(housePriceOf(s, i) * HOUSE_RULES.upkeepRate)}`, disabled: p.money < cost })
    if (p.money < cost && !hasMortgage(p) && stageOf(s).id !== 'old') {
      const m = mortgagePlan(s, p, i)
      opts.push({ id: `mortgage${i}`, label: `${h.name} 대출 끼고 사기`, desc: `계약금 ${won(m.down)} (30%) · 나머지 ${won(m.borrow)}은 주택담보대출 · 매 턴 ${won(m.installment)}씩 ${HOUSE_RULES.mortgageTurns}턴 자동으로 갚아요 · 3번 못 내면 경매로 넘어가요`, disabled: p.money < m.down || p.creditBad > 0 })
    }
  })
  if (!visit.big && stageOf(s).id !== 'old') CARS.forEach((c, i) => {
    if (i <= p.car) return
    const cost = carCost(p, i)
    const trade = p.car ? ` · 지금 차 ${won(carResale(p))}에 팔고 ${won(cost)}만 더` : ''
    opts.push({ id: `car${i}`, label: `${c.name} 사기`, desc: `${won(c.price)}${coupon < 1 ? ` (쿠폰 쓰면 -${won(couponOff(c.price, 500))})` : ''}${trade} · 주사위 ±1 이번 단계 ${c.charges[0]}번, 다음 단계부터 1번씩 늘어나요 · 노년엔 못 사요`, disabled: p.money < cost })
  })
  if (!p.agency && canDate(s, p)) {
    opts.push({ id: 'agency0', label: '소개팅 회사 일반 회원', desc: '매 턴 30만, 연애 시작 100만, 원하는 속성을 고를 수 있어요' })
    opts.push({ id: 'agency1', label: '소개팅 회사 VIP 회원', desc: '매 턴 100만, 연애 시작 300만, 원하는 속성을 고르고 ★3 이상이 잘 나와요' })
  }
  if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 데려오기', desc: `${won(50)} · 매 턴 행복 +1, 사료값이 들어요`, disabled: p.money < 50 })
  opts.push({ id: 'chance', label: '찬스 카드 사기', desc: `${won(100)}${p.chance ? ' · 이미 1장 있어요' : ''}`, disabled: p.money < 100 || !!p.chance })
  const full = p.diceItems.length >= MAX_DICE_ITEMS
  for (const k of Object.keys(DICE_ITEMS) as DiceItem[]) {
    const d = DICE_ITEMS[k]
    opts.push({ id: `dice_${k}`, label: `${d.name} 사기`, desc: `${won(d.price)} · ${d.desc} · 1번 쓰면 끝${full ? ` (이미 ${MAX_DICE_ITEMS}개)` : ''}`, disabled: full || p.money < d.price })
  }
  // 돈이 모자라면 여기서 바로 은행 대출 (2026-10-21 사용자). 일반 대출은 한 번에 하나만
  if (canBankLoan(s, p)) for (const a of [500, 1000, 3000]) {
    if (a <= loanLimit(s, p)) opts.push({ id: `loan${a}`, label: `💳 은행에서 ${won(a)} 빌리기`, desc: `${LOAN_TURNS}턴 안에 한꺼번에 갚아요 · 매 턴 이자 ${LOAN_RATE * 100}% · 빌린 뒤 다시 골라요` })
  }
  opts.push({ id: 'pass', label: visit.n ? '다 샀어요 (나가기)' : '그냥 지나가기' })
  const houseNote = visit.n ? '' : p.house
    ? `\n🏠 내 집 덕분에: 월세 없음 · 매 턴 행복 +${HOUSE_HAPPY[p.house]} · 연애 호감도 +10% · 점수에 집값`
    : `\n🏠 집이 있으면: 월세 없음 · 매 턴 행복 +1(단독주택 +2) · 연애 호감도 +10% · 점수에 집값(시세는 대체로 오름)\n집이 없으면: 매 턴 월세 ${won(HOUSE_RULES.rent)}`
  const rule = visit.big ? '집·차는 이번에 샀어요. 다른 물건은 더 살 수 있어요.' : '집·차는 하나만, 다른 물건은 원하는 만큼 살 수 있어요.'
  s.pending = { type: 'shop', playerId: p.id, title: '상점', text: `가진 돈 ${won(p.money)}. ${rule}${houseNote}`, options: opts, data: visit }
}

function triggerPoint(s: GameState, p: Player, kind: 'shop' | 'marriage') {
  if (kind === 'shop') {
    // AI: 적금에 넣어 둔 돈은 상점에서 꺼내 씀
    if (!p.human && p.savings) { p.money += p.savings; log(s, p.id, `적금에서 ${won(p.savings)} 꺼냈다`, 'info'); p.savings = 0 }
    openShop(s, p)
    return
  }
  if (p.spouse) return
  const cands = p.suitors.filter((x) => x.affinity >= 50)
  if (!cands.length) { log(s, p.id, '결혼 지점: 호감도 50% 넘는 사람이 없어 그냥 지나갔다', 'info'); return }
  s.pending = {
    type: 'marriage', playerId: p.id, title: '결혼 지점', text: '고백할까요? 성공 확률은 호감도에 비례해요.',
    options: [
      ...cands.map((x) => ({ id: `c:${x.name}:${x.grade}`, label: `${x.name}에게 고백 (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
      { id: 'single', label: '비혼으로 지낸다' },
    ],
  }
}

function findSuitor(p: Player, key: string) {
  const [, name, grade] = key.split(':')
  return p.suitors.find((x) => x.name === name && String(x.grade) === grade)
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

function adoptPet(s: GameState, p: Player, text: string) {
  p.pet = { alive: true, turnsLeft: rngOf(s).int(15, 20) }
  p.happy += 3
  log(s, p.id, `${text}. 행복 +3`, 'good')
}

function setJob(s: GameState, p: Player, id: string | null) {
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
      else { p.bizKeep = true; log(s, p.id, `노년에도 ${p.biz?.name}를 계속 경영한다`, 'info') }
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
      const d = pd.data as { kind: 'special' | 'suneung' | 'career'; ev?: string; opt?: string; k?: StatKey; after?: UniAfter }
      const v = rng.int(1, 6)
      showDice(s, v)
      if (d.kind === 'suneung') suneung(s, p, v, d.k ?? 'int', d.after ?? 'first')
      else if (d.kind === 'career') careerRoll(s, p, v)
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
        if (x) { const add = affinityGain(s, p, x); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${x.name}와 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
      }
      break
    }
    case 'agencyMatch': {
      if (optionId === 'yes') {
        const { x, cost } = pd.data as { x: Suitor; cost: number }
        spend(p, cost)
        x.affinity = rng.int(25, 35)
        p.suitors.push(x)
        log(s, p.id, `소개팅으로 ${x.name}와 연애 시작! 호감도 ${x.affinity}%`, 'good')
      }
      break
    }
    case 'date': {
      if (optionId.startsWith('new')) {
        const x = (pd.data as { fresh: Suitor[] }).fresh[+optionId.slice(3)]
        x.affinity = rng.int(25, 40)
        p.suitors.push(x)
        log(s, p.id, `${x.name}와 첫 데이트! 호감도 ${x.affinity}%`, 'good')
      } else {
        const x = findSuitor(p, optionId)
        if (x) { const add = affinityGain(s, p, x); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${x.name}와 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
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
          type: 'wedding', playerId: p.id, title: `${x.name}가 고백을 받아줬다!`, text: '결혼식장을 골라요. 비쌀수록 축의금과 좋은 일이 늘어요.',
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
      log(s, p.id, `${x.name}와 결혼! 행복 +${happy}, 지참금 +${won(x.wealth * 60)}, 축의금 +${won(gifts)}`, 'good')
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
      const d = pd.data as { ids: number[]; picks?: Record<number, number>; queue?: number[]; humans?: number[] }
      const picks = { ...d.picks, [p.id]: +optionId }
      if (d.queue?.length) rpsPending(s, d.ids, picks, d.queue, d.humans ?? [p.id, ...d.queue]) // 다음 사람 차례 (온라인)
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

function makeFriendLoan(s: GameState, borrower: Player, lender: Player, amount: number, rate: number, term: number) {
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

function friendLoanTick(s: GameState, p: Player) {
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
function lawsuit(s: GameState, plaintiff: Player, defendant: Player, kind: 'loan' | 'card', owe = 0) {
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
    if (victim.stocks[sector] <= 0) log(s, victim.id, `주가 루머… 그런데 ${victim.name}은(는) 주식이 없어서 효과가 없었다`, 'info')
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
  if (st.rolls && s.players.every((q) => q.rollsLeft <= 0)) { nextStage(s); return }
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

function nextStage(s: GameState) {
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
