import { buildStages, isEnd, maxDepth, walkAhead } from './board'
import {
  AI_NAMES, CARS, CHANCE_NAMES, FORTUNES, FORTUNE_WEIGHTS, HOUSES, INSURANCE, JOBS, LOTTERY_PRICE,
  PERSONALITIES, PLAYER_COLORS, PRESTIGE_JOBS, SABOTAGE_NAMES, SECTORS, SPOUSE_NAMES, STAGE_SCALE, STAT_NAMES,
  TAX_RATE, TRAITS,
} from './data'
import { DEFAULT_OUTFIT, randomOutfit, type Outfit } from './outfit'
import { makeRng, type Rng } from './rng'
import { speechLine, type SpeechKey } from './speech'
import type {
  ChanceCard, ChoiceOption, DuelId, GameState, InsuranceKind, JobDef, MiniId, Personality, Player,
  SabotageCard, Sector, Settings, Stage, StatKey, Suitor, Tile,
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
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`
const STATS: StatKey[] = ['int', 'str', 'cha']

export function log(s: GameState, playerId: number | null, text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  s.log.push({ turn: s.turn, playerId, text, tone })
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
  const mult = job.boom ? [0.4, 1, 2.6][p.jobRank] : [1, 1.4, 1.9][p.jobRank]
  return Math.round(job.salary * mult)
}

export function stocksValue(s: GameState, p: Player) {
  return SECTORS.reduce((sum, k) => sum + p.stocks[k] * s.stockPrice[k], 0)
}
export const loanTotal = (p: Player) => p.loans.reduce((a, l) => a + l.amount, 0)
export const friendDebt = (s: GameState, p: Player) => s.friendLoans.filter((l) => l.borrowerId === p.id).reduce((a, l) => a + l.owe, 0)
export const friendCredit = (s: GameState, p: Player) => s.friendLoans.filter((l) => l.lenderId === p.id).reduce((a, l) => a + l.owe, 0)
export function assetsOf(s: GameState, p: Player) {
  return p.money + HOUSES[p.house].price + stocksValue(s, p) - loanTotal(p) - friendDebt(s, p) + friendCredit(s, p)
}
export function scoreOf(s: GameState, p: Player) {
  const assets = assetsOf(s, p)
  return { assets, assetScore: Math.round(assets / 100), happy: p.happy, total: Math.round(assets / 100) + p.happy }
}
export function loanLimit(p: Player) {
  return Math.round(1000 + salaryOf(p) * 10 + HOUSES[p.house].price * 0.5 + CARS[p.car].price * 0.2)
}

function meetsReq(p: Player, job: JobDef, relax = 0) {
  if (job.college && !p.college) return false
  return (Object.keys(job.req) as StatKey[]).every((k) => p.stats[k] + relax >= (job.req[k] ?? 0))
}
export function eligibleJobs(p: Player, stageIdx = 2) {
  const relax = p.spouse && p.spouse.fame >= 7 ? 1 : 0 // 명성 높은 배우자: 인맥으로 조건 1 완화
  // 운동선수는 중년이 되면 은퇴하므로 중년부터는 새로 될 수 없음
  return JOBS.filter((j) => j.id !== 'ceo' && !(j.id === 'athlete' && stageIdx >= 3) && meetsReq(p, j, relax))
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
    car: 0, carCharges: 0, house: 0, loans: [], creditBad: 0,
    lottery: { ticket: false, chance: 10, addicted: false },
    stocks: { 생명: 0, IT: 0, 화학: 0, 의료: 0, 엔터: 0 },
    suitors: [], spouse: null, divorced: false, children: 0, adopted: 0, pet: null, retire: null,
    chance: null, sabotage: null, fortuneMod: 0, agency: null, borrowedFrom: [], forkChoice: null,
    outfit: DEFAULT_OUTFIT, sector: null, collegeDecided: false,
  }
}

export interface NewGameOptions {
  humanName: string
  aiCount: number
  humans?: number
  outfits?: Outfit[] // 사람 플레이어 옷차림 (없으면 무작위)
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
    stockPrice: { 생명: 100, IT: 100, 화학: 100, 의료: 100, 엔터: 100 },
    nextNews: null, finishCount: 0, friendLoans: [], mini: null, meetCheck: false, speech: null, banner: null,
  }
  const rng = rngOf(s)
  s.stages = buildStages(rng)
  const humans = o.humans ?? 1
  for (let i = 0; i < humans; i++) s.players.push(newPlayer(i, i === 0 ? o.humanName || '나' : `친구${i}`, true, 'safe'))
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
  beginTurn(s)
  return s
}

// ───────── 차례 시작 ─────────

function drawFortune(s: GameState, p: Player) {
  const rng = rngOf(s)
  let f = rng.weighted(FORTUNE_WEIGHTS.map((w, i) => [i, w] as const))
  if (p.goodDeeds > 0 && rng.chance(0.4)) { f++; p.goodDeeds-- }
  if (p.spouse?.revealed && p.spouse.trait === '대운' && rng.chance(0.3)) f++
  if (p.charmTurns > 0) { f++; p.charmTurns-- }
  f += p.fortuneMod
  p.fortuneMod = 0
  p.fortune = Math.max(0, Math.min(5, f))
  if (p.fortune === 5) say(s, p, 'greatFortune')
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
  drawFortune(s, p)
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
    const prize = r < 0.004 ? 30000 : r < 0.03 ? 1000 : r < 0.15 ? 30 : 0
    if (prize > 0) {
      p.money += prize
      log(s, p.id, `복권 당첨! ${won(prize)} 원`, 'good')
      if (prize >= 1000) { s.banner = { title: '복권 당첨!', text: `${p.name}: ${won(prize)} 원`, tone: 'good' }; say(s, p, 'lotteryWin') }
    } else log(s, p.id, '복권 꽝', 'info')
  } else if (isAdultStage(s)) {
    p.lottery.chance = Math.max(10, p.lottery.chance - 10)
  }

  if (isAdultStage(s)) economyTick(s, p)
  familyTick(s, p)
  friendLoanTick(s, p)

  if (p.lottery.addicted && rng.chance(0.2)) {
    badEvent(s, p, { text: '도박중독: 몰래 도박으로 돈을 날렸다', loss: scaleOf(s) * 2, happyLoss: 2 })
  }
  if (p.money < 0 && rng.chance(0.25)) {
    badEvent(s, p, { text: '빚 독촉에 시달렸다', loss: 0, happyLoss: 4 })
  }
  if (p.agency && !p.spouse && (stageOf(s).id === 'young' || stageOf(s).id === 'middle')) agencyTurn(s, p)
  resume(s)
}

function economyTick(s: GameState, p: Player) {
  const st = stageOf(s)
  const rng = rngOf(s)
  const job = jobOf(p)
  if (st.id !== 'old' && job) {
    const sal = salaryOf(p)
    const tax = Math.round(sal * TAX_RATE(sal))
    p.money += sal - tax
    p.jobTurns++
    jobPerkTick(s, p)
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
  if (st.id !== 'old' && !job) p.happy += 1 // 백수: 월급은 없지만 여유
  if (st.id === 'old') {
    if (job?.pension) p.money += 120
    if (p.retire === 'city') {
      if (rng.chance(0.5)) p.money += 80
      else p.money -= 50
    } else if (p.retire === 'country') p.happy += 2
  }
  let upkeep = 0
  for (const k of Object.keys(p.insurance) as InsuranceKind[]) if (p.insurance[k]) upkeep += INSURANCE[k].premium
  upkeep += CARS[p.car].upkeep
  upkeep += (p.children + p.adopted) * 20
  if (p.pet?.alive) upkeep += 5
  if (p.agency && !p.spouse && st.id !== 'old') upkeep += p.agency.vip ? 100 : 30
  if (p.spouse?.trait === '짠돌이') upkeep = Math.round(upkeep * 0.8)
  if (p.spouse?.trait === '명품 중독') upkeep += 15
  p.money -= upkeep
  for (const l of p.loans) l.amount = Math.round(l.amount * 1.01)
  const overdue = p.loans.filter((l) => p.turnsPlayed > l.dueTurn)
  if (overdue.length) forceLiquidate(s, p, overdue)
}

function forceLiquidate(s: GameState, p: Player, overdue: { amount: number }[]) {
  const need = overdue.reduce((a, l) => a + l.amount, 0)
  p.loans = p.loans.filter((l) => !overdue.includes(l))
  for (const k of SECTORS) {
    p.money += p.stocks[k] * s.stockPrice[k]
    p.stocks[k] = 0
  }
  if (p.money < need && p.house > 0) {
    p.money += Math.round(HOUSES[p.house].price * 0.8)
    log(s, p.id, `강제 청산: ${HOUSES[p.house].name}을 팔았다`, 'bad')
    p.house = 0
  }
  p.money -= need
  if (p.money < 0) p.creditBad = 8
  log(s, p.id, '대출 기한을 넘겨 강제 청산을 당했다', 'bad')
  s.banner = { title: '강제 청산', text: `${p.name}: 대출 기한을 넘겼어요`, tone: 'bad' }
}

function familyTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const sp = p.spouse
  if (sp) {
    if (isAdultStage(s)) p.money += sp.wealth * 12
    if (sp.kindness >= 7) p.happy += 1
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
    }
  }
  if (p.children + p.adopted) p.happy += p.children + (p.adopted ? 1 : 0)
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
  else if (f === 4) { mult = rng.chance(0.8) ? 0 : 0.5; note = mult === 0 ? '다행히 큰일 없이 넘어갔다' : '다행히 절반은 돌려받았다' }
  else if (f === 5) {
    if (rng.chance(0.5)) {
      const gain = Math.max(Math.round(loss * 0.5), 10)
      p.money += gain
      p.happy += 2
      log(s, p.id, `${b.text} … [대대길] 전화위복! 오히려 +${won(gain)}`, 'good')
      return
    }
    mult = 0
    note = '운 좋게 아무 일도 없었다'
  }
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
export function roll(s: GameState, bonus = 0, useCar = false) {
  if (!canAct(s)) return
  const p = cur(s)
  const rng = rngOf(s)
  const st = stageOf(s)
  if (st.rolls && isEnd(tileOf(s, p))) {
    s.lastRoll = rng.int(1, 6)
    s.dice = { value: s.lastRoll, id: (s.dice?.id ?? 0) + 1 }
    const k = rng.pick(STATS)
    p.stats[k] = clampStat(p.stats[k] + 1)
    p.money += scaleOf(s)
    log(s, p.id, `휴식 칸에서 쉬었다: ${STAT_NAMES[k]} +1, +${won(scaleOf(s))}`, 'good')
    if (rng.chance(0.25) && !p.chance) giveChance(s, p, randomChance(rng))
    endTurn(s)
    return
  }
  const value = rng.int(1, 6)
  s.dice = { value, id: (s.dice?.id ?? 0) + 1 }
  s.lastRoll = value + bonus
  log(s, p.id, `주사위 ${value}${bonus ? ` +${bonus}` : ''}`, 'info')
  const carOn = useCar && canUseCar(p)
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
      }
      s.phase = 'decision'
      return
    }
    applyAfterRoll(s, p, aiAfterRoll(s, p, s.lastRoll, carOn))
    return
  }
  startMove(s, s.lastRoll)
}

function aiAfterRoll(s: GameState, p: Player, n: number, carOn: boolean): string {
  const st = stageOf(s)
  const kindAt = (k: number) => st.tiles[walkAhead(st, p.pos, k, p.forkChoice)].kind
  const value = (k: number) => {
    const t = kindAt(k)
    return t === 'risk' ? -3 : t === 'money' || t === 'mini' ? 2 : t === 'card' || t === 'happy' || t === 'date' ? 1 : 0
  }
  if (carOn) {
    const cands = [['keep', n], ['plus', n + 1], ...(n > 1 ? [['minus', n - 1]] : [])] as [string, number][]
    const bonus = (k: number) => (st.id === 'old' ? k * 0.5 : 0) // 노년은 골까지 경주
    return cands.reduce((a, c) => (value(c[1]) + bonus(c[1]) > value(a[1]) + bonus(a[1]) ? c : a))[0]
  }
  if (p.chance === 'reroll' && kindAt(n) === 'risk') return 'reroll'
  return 'keep'
}

// AI가 던지기 전에 자동차 능력을 쓸지
export function aiWantsCar(s: GameState, p: Player): boolean {
  if (!canUseCar(p)) return false
  if (stageOf(s).id === 'old') return true
  if (p.rollsLeft <= p.carCharges) return true
  return rngOf(s).chance(0.35)
}

function applyAfterRoll(s: GameState, p: Player, choice: string) {
  let n = s.lastRoll ?? 1
  if (choice === 'minus' && n > 1) { n -= 1; log(s, p.id, `${CARS[p.car].name}로 1칸 덜 갔다`, 'info') }
  if (choice === 'plus') { n += 1; log(s, p.id, `${CARS[p.car].name}로 1칸 더 갔다`, 'info') }
  if (choice === 'reroll') {
    p.chance = null
    n = rngOf(s).int(1, 6)
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
      const cost = p.jobId === 'chef' ? 1200 : 2000
      desc = `${desc} · 창업 자금 ${won(cost)}${p.jobId === 'chef' ? ' (요리사 할인)' : ''}${p.money < cost ? ' (모자라면 빚)' : ''}`
      disabled = p.money < cost && p.creditBad > 0
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

function applyRoadStart(s: GameState, p: Player, road: string) {
  const rng = rngOf(s)
  switch (road) {
    case 'college': {
      p.college = true
      p.collegeDecided = true
      // 수능: 문제 없이 지력 + 주사위 + 운세
      const dice = rng.int(1, 6)
      const score = p.stats.int + dice + (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0)
      const loan = score >= 12 ? 300 : score >= 8 ? 800 : 1200
      const grade = score >= 12 ? '상위권! 장학금을 받았다' : score >= 8 ? '중간' : '하위권… 등록금 비싼 대학'
      log(s, p.id, `수능: 지력 ${p.stats.int} + 주사위 ${dice} → ${grade} (학자금 대출 ${won(loan)})`, score >= 12 ? 'good' : score >= 8 ? 'info' : 'bad')
      p.loans.push({ amount: loan, dueTurn: p.turnsPlayed + 40 })
      if (score >= 12) s.banner = { title: '수능 상위권!', text: `${p.name}: 장학금`, tone: 'good' }
      s.pending = { type: 'collegeStat', playerId: p.id, title: '대학에서 키울 능력치', text: '무엇을 공부할까요?', options: [{ id: 'int', label: '지력 +2' }, { id: 'str', label: '체력 +2' }, { id: 'cha', label: '매력 +2' }] }
      break
    }
    case 'work': p.collegeDecided = true; p.money += 400; log(s, p.id, '바로 취업 준비. 모아 둔 돈 +400만', 'good'); break
    case 'startup': {
      const cost = p.jobId === 'chef' ? 1200 : 2000
      if (p.money < cost) { p.loans.push({ amount: cost - p.money, dueTurn: p.turnsPlayed + 20 }); p.money = cost; log(s, p.id, '빚을 내서 창업 자금을 마련했다', 'info') }
      p.money -= cost
      const wasChef = p.jobId === 'chef'
      setJob(s, p, 'ceo')
      p.jobRank = rng.chance(wasChef ? 0.7 : p.stats.int >= 6 ? 0.6 : 0.4) ? 1 : 0
      say(s, p, 'startup')
      s.pending = sectorPending(p, '어떤 분야로 창업할까요?', SECTORS)
      break
    }
    case 'city': p.retire = 'city'; break
    case 'country': p.retire = 'country'; break
    default: break
  }
}

// ───────── 칸 효과 ─────────

function land(s: GameState) {
  const p = cur(s)
  const t = tileOf(s, p)
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const road = t.road
  switch (t.kind) {
    case 'money': {
      const mult = road === 'startup' ? 2.5 : road === 'work' ? 1.5 : road === 'city' ? (rng.chance(0.5) ? 2 : -1) : 1
      const amt = Math.round(sc * rng.int(2, 5) * mult)
      p.money += amt
      log(s, p.id, amt >= 0 ? `${isAdultStage(s) ? '보너스' : '용돈'} +${won(amt)}` : `투자 손실 ${won(amt)}`, amt >= 0 ? 'good' : 'bad')
      break
    }
    case 'grow': {
      const k: StatKey = road === 'academy' ? 'int' : road === 'play' ? 'cha' : rng.pick(STATS)
      const add = isAdultStage(s) && !p.jobId ? 2 : 1
      p.stats[k] = clampStat(p.stats[k] + add)
      log(s, p.id, `${STAT_NAMES[k]} +${add}`, 'good')
      break
    }
    case 'happy': {
      const h = rng.int(3, 6) + (road === 'country' || road === 'play' ? 2 : 0)
      p.happy += h
      log(s, p.id, `즐거운 일! 행복 +${h}`, 'good')
      break
    }
    case 'risk': riskTile(s, p, road === 'startup' ? 2 : 1); break
    case 'card': drawCard(s, p); break
    case 'date': dateTile(s, p); break
    case 'mini': startMini(s, p, t.mini!); break
    case 'stop': stopTile(s, p, t); break
    case 'rest': log(s, p.id, '단계 끝 휴식 칸에 도착했다', 'info'); break
    case 'goal': break
  }
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
  if (p.car) opts.push({ text: '접촉 사고가 났다', loss: sc * 3, happyLoss: 2, kind: 'car' })
  if (stageOf(s).id === 'old' && p.car) opts.push({ text: '운전하다 사고가 났다', loss: sc * 4, happyLoss: 3, kind: 'car' })
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

const randomChance = (rng: Rng) => rng.pick(['reroll', 'block', 'charm', 'coupon', 'shortcut'] as ChanceCard[])

function drawCard(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const adult = isAdultStage(s)
  const r = rng.next()
  if (r < 0.12) return giveChance(s, p, randomChance(rng))
  if (adult && r < 0.2) return giveSabotage(s, p, rng.pick(['rumor', 'stockRumor', 'love', 'lawsuit'] as SabotageCard[]))
  const deck: (() => void)[] = [
    () => { p.money += sc * 2; p.goodDeeds++; log(s, p.id, `지갑 주인을 찾아줬다. 사례금 +${won(sc * 2)} (선행)`, 'good') },
    () => { p.happy += 3; p.goodDeeds += 2; log(s, p.id, '봉사활동을 했다. 행복 +3 (선행)', 'good') },
    () => { p.stats.int = clampStat(p.stats.int + 1); log(s, p.id, '책을 많이 읽었다. 지력 +1', 'good') },
    () => { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, '운동을 시작했다. 체력 +1', 'good') },
    () => { p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '패션 감각이 늘었다. 매력 +1', 'good') },
    () => badEvent(s, p, { text: '휴대폰 액정이 깨졌다', loss: sc * 2, happyLoss: 1 }),
    () => contest(s, p),
    () => everyoneDraw(s),
  ]
  // 단계별 카드 (그 나이에 맞는 일)
  const id = stageOf(s).id
  const stageCards: Record<string, (() => void)[]> = {
    child: [
      () => { p.happy += 3; log(s, p.id, '선생님께 칭찬 스티커를 받았다. 행복 +3', 'good') },
      () => badEvent(s, p, { text: '친구랑 싸웠다', loss: 0, happyLoss: 3 }),
      () => { p.money += sc * 2; log(s, p.id, `세뱃돈을 받았다 +${won(sc * 2)}`, 'good') },
    ],
    student: [
      () => { p.stats.int = clampStat(p.stats.int + 1); p.happy += 2; log(s, p.id, '시험 100점! 지력 +1, 행복 +2', 'good') },
      () => badEvent(s, p, { text: '지각해서 벌을 섰다', loss: 0, happyLoss: 2 }),
      () => { p.money += sc * 3; log(s, p.id, `아르바이트 월급 +${won(sc * 3)}`, 'good') },
    ],
    young: [
      () => { p.stats.cha = clampStat(p.stats.cha + 1); log(s, p.id, '첫 월급으로 옷을 샀다. 매력 +1', 'good') },
      () => badEvent(s, p, { text: '자취방 보증금 문제', loss: sc * 2, happyLoss: 1, kind: 'property' }),
    ],
    middle: [
      () => badEvent(s, p, { text: '건강검진에서 재검 판정', loss: sc * 2, happyLoss: 2, kind: 'health' }),
      () => { p.happy += 4; log(s, p.id, '오랜 친구들과 동창회. 행복 +4', 'good') },
    ],
    old: [
      () => { p.happy += 5; log(s, p.id, '손주가 찾아왔다. 행복 +5', 'good') },
      () => badEvent(s, p, { text: '관절이 쑤신다', loss: sc, happyLoss: 2, kind: 'health' }),
    ],
  }
  deck.push(...stageCards[id], ...stageCards[id]) // 단계 카드가 더 자주 나오게
  if (adult && p.jobId && id !== 'old') {
    deck.push(() => {
      const safe = ['civil', 'teacher', 'police', 'fire'].includes(p.jobId!)
      if (safe) { p.happy += 1; log(s, p.id, '회사들이 구조조정… 공무원이라 무사했다 (행복 +1)', 'good'); return }
      const job = jobOf(p)
      if (job && !job.boom && p.jobRank > 0 && p.fortune <= 2) { p.jobRank--; log(s, p.id, `구조조정으로 ${job.ranks[p.jobRank]}(으)로 밀려났다`, 'bad') }
      else badEvent(s, p, { text: '회사 구조조정으로 월급이 깎였다', loss: sc * 2, happyLoss: 2 })
    })
  }
  if (adult) {
    deck.push(() => {
      s.pending = {
        type: 'invest', playerId: p.id, title: '투자 권유', text: `친구가 ${won(sc * 3)}을 투자하자고 한다. 결과는 운세에 달렸다.`,
        options: [{ id: 'yes', label: `투자한다 (-${won(sc * 3)})` }, { id: 'no', label: '거절한다' }], data: { cost: sc * 3 },
      }
    })
    deck.push(() => {
      const k = rng.pick(STATS)
      p.stats[k] = clampStat(p.stats[k] - 1)
      log(s, p.id, `바빠서 자기 관리를 못 했다. ${STAT_NAMES[k]} -1`, 'bad')
    })
    if (p.jobId) {
      const overtime = () => {
        s.pending = {
          type: 'overtime', playerId: p.id, title: '야근 부탁', text: '회사에서 야근을 부탁한다.',
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
        options: [{ id: 'yes', label: '키운다', desc: '매 턴 행복 +1, 사료값 (선행)' }, { id: 'no', label: '보호소에 데려다준다' }],
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
  firstImpression: 'cha', rhythm: 'cha', confess: 'cha',
  oddEven: 'fortune', highLow: 'fortune', slot: 'fortune',
  capital: 'int', souvenir: null, photo: 'int',
}
export const MINI_NAMES: Record<MiniId | DuelId, string> = {
  race: '달리기', tug: '줄다리기', throw: '공 던지기',
  memory: '기억력', pairs: '같은 그림 찾기', quickmath: '빠른 계산',
  firstImpression: '첫인상', rhythm: '무대 공연', confess: '고백 타이밍',
  oddEven: '홀짝', highLow: '카드 높낮이', slot: '슬롯머신',
  capital: '수도 맞히기', souvenir: '기념품 고르기', photo: '추억 사진',
  dice: '주사위 대결', rps: '가위바위보', timing: '타이밍 멈추기',
}
const CASINO: MiniId[] = ['oddEven', 'highLow', 'slot']

// 0 쉬움, 1 보통, 2 어려움 (능력치·운세가 높을수록 쉬움)
export function miniLevel(p: Player, game: MiniId | DuelId): number {
  const key = game in MINI_STAT ? MINI_STAT[game as MiniId] : game === 'timing' ? 'str' : null
  if (key === null) return 1
  const v = key === 'fortune' ? [1, 3, 5, 7, 9, 10][p.fortune] : p.stats[key]
  return v >= 7 ? 0 : v >= 4 ? 1 : 2
}

function startMini(s: GameState, p: Player, game: MiniId) {
  const level = miniLevel(p, game)
  const stake = CASINO.includes(game) ? scaleOf(s) * 2 : undefined
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
    s.mini = { game, playerId: p.id, level, stake }
    return
  }
  // AI: 능력치에 비례한 확률로 결과
  const rng = rngOf(s)
  const great = [0.55, 0.32, 0.15][level]
  const r = rng.next()
  const grade = r < great ? 2 : r < great + 0.35 ? 1 : 0
  log(s, p.id, `[${MINI_NAMES[game]}] ${['실패', '성공', '대성공'][grade]}`, grade ? 'good' : 'bad')
  miniReward(s, p, game, grade, stake)
}

// 사람이 미니게임을 마치면 화면에서 부름. grade: 0 실패, 1 성공, 2 대성공 / 대결 timing이면 점수(0~100)
export function finishMini(s: GameState, value: number) {
  const m = s.mini
  if (!m) return
  const p = s.players[m.playerId]
  s.mini = null
  if (m.duel) resolveDuel(s, m.game as DuelId, m.duel.ids, { ...m.duel.results, [p.id]: value })
  else miniReward(s, p, m.game as MiniId, Math.max(0, Math.min(2, Math.round(value))), m.stake)
  resume(s)
}

function addAffinityOrMeet(s: GameState, p: Player, amount: number) {
  if (p.spouse) { p.happy += Math.round(amount / 5); log(s, p.id, `${p.spouse.name}와 축제를 즐겼다. 행복 +${Math.round(amount / 5)}`, 'good'); return }
  const top = [...p.suitors].sort((a, b) => b.affinity - a.affinity)[0]
  if (top) { top.affinity = Math.min(100, top.affinity + amount); log(s, p.id, `${top.name} 호감도 +${amount} (${top.affinity}%)`, 'good'); return }
  const x = makeSuitor(s, p)
  x.affinity = amount + 10
  p.suitors.push(x)
  log(s, p.id, `축제에서 ${x.name}를 만났다! 호감도 ${x.affinity}%`, 'good')
}

function miniReward(s: GameState, p: Player, game: MiniId, grade: number, stake?: number) {
  const name = MINI_NAMES[game]
  if (grade === 2 && !p.chance && rngOf(s).chance(0.25)) giveChance(s, p, randomChance(rngOf(s)))
  const statUp = (k: StatKey, n: number) => { p.stats[k] = clampStat(p.stats[k] + n) }
  if (['race', 'tug', 'throw'].includes(game)) {
    if (grade === 2) { statUp('str', 2); p.happy += 3; log(s, p.id, `${name} 1등! 체력 +2, 행복 +3`, 'good') }
    else if (grade === 1) { statUp('str', 1); p.happy += 1; log(s, p.id, `${name} 입상! 체력 +1`, 'good') }
    else { p.happy -= 1; log(s, p.id, `${name}에서 넘어졌다… 행복 -1`, 'bad') }
  } else if (['memory', 'pairs', 'quickmath'].includes(game)) {
    if (grade === 2) { statUp('int', 2); log(s, p.id, `${name} 금메달! 지력 +2`, 'good') }
    else if (grade === 1) { statUp('int', 1); log(s, p.id, `${name} 통과! 지력 +1`, 'good') }
    else log(s, p.id, `${name} 아쉽게 탈락`, 'info')
  } else if (['firstImpression', 'rhythm', 'confess'].includes(game)) {
    if (grade === 2) { statUp('cha', 1); addAffinityOrMeet(s, p, 30) }
    else if (grade === 1) addAffinityOrMeet(s, p, 15)
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
  if (id === 'young' || id === 'middle') {
    const game = rng.pick(['dice', 'rps', 'timing'] as DuelId[])
    log(s, null, `${all.map((q) => q.name).join(', ')} 같은 칸에서 만났다! ${MINI_NAMES[game]}`, 'info')
    const ids = all.map((q) => q.id)
    if (game === 'dice') {
      const res: Record<number, number> = {}
      for (const q of all) res[q.id] = rng.int(1, 6)
      resolveDuel(s, game, ids, res)
    } else if (game === 'rps') {
      if (p.human) {
        s.pending = {
          type: 'rps', playerId: p.id, title: '가위바위보!', text: `${others.map((q) => q.name).join(', ')}와 한 판. 진 사람은 능력치 -1`,
          options: [{ id: '0', label: '가위' }, { id: '1', label: '바위' }, { id: '2', label: '보' }], data: { ids },
        }
      } else resolveRps(s, ids, { [p.id]: rng.int(0, 2) })
    } else {
      const res: Record<number, number> = {}
      for (const q of all) if (q.id !== p.id || !p.human) res[q.id] = timingScore(rng, q)
      if (p.human) s.mini = { game: 'timing', playerId: p.id, level: miniLevel(p, 'timing'), duel: { ids, results: res } }
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

const timingScore = (rng: Rng, q: Player) => Math.max(0, Math.min(100, Math.round(35 + q.stats.str * 5 + (rng.next() - 0.5) * 50)))

function resolveRps(s: GameState, ids: number[], picks: Record<number, number>) {
  const rng = rngOf(s)
  for (const id of ids) if (picks[id] === undefined) picks[id] = rng.int(0, 2)
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
  const names = ['가위', '바위', '보']
  log(s, null, ids.map((i) => `${s.players[i].name} ${names[picks[i]]}`).join(', '), 'info')
  resolveDuel(s, 'rps', ids, res)
}

// 꼴찌만 잃고, 1등이 잃은 만큼 얻는다 (운은 1단계, 능력치는 1개 +1, 돈은 전부)
function resolveDuel(s: GameState, game: DuelId, ids: number[], res: Record<number, number>) {
  const rng = rngOf(s)
  const vals = ids.map((i) => res[i])
  const top = Math.max(...vals)
  const low = Math.min(...vals)
  if (top === low) { log(s, null, `${MINI_NAMES[game]}: 무승부!`, 'info'); return }
  const winners = ids.filter((i) => res[i] === top).map((i) => s.players[i])
  const losers = ids.filter((i) => res[i] === low).map((i) => s.players[i])
  if (game === 'dice') {
    for (const l of losers) l.fortuneMod -= 1
    for (const w of winners) w.fortuneMod += 1
    log(s, null, `${MINI_NAMES[game]}: ${winners.map((w) => w.name).join(', ')} 승! 다음 운세 ↑ / ${losers.map((l) => l.name).join(', ')} 다음 운세 ↓`, 'info')
  } else if (game === 'rps') {
    for (const l of losers) { const k = rng.pick(STATS); l.stats[k] = clampStat(l.stats[k] - 1); log(s, l.id, `가위바위보 패배: ${STAT_NAMES[k]} -1`, 'bad') }
    const k = rng.pick(STATS)
    for (const w of winners) { w.stats[k] = clampStat(w.stats[k] + 1); log(s, w.id, `가위바위보 승리: ${STAT_NAMES[k]} +1`, 'good') }
  } else {
    const loss = scaleOf(s)
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
        type: 'baby', playerId: p.id, title: '아기를 낳을까요?', text: `지금 자녀 ${p.children}명 (최대 3명). 자녀는 매 턴 행복을 주지만 돈이 들어요.`,
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

function triggerPoint(s: GameState, p: Player, kind: 'shop' | 'marriage') {
  if (kind === 'shop') {
    const coupon = p.chance === 'coupon' ? 0.7 : 1
    const opts: ChoiceOption[] = []
    HOUSES.forEach((h, i) => {
      if (i > p.house) opts.push({ id: `house${i}`, label: `${h.name} 사기`, desc: `${won(h.price * coupon)}${coupon < 1 ? ' (쿠폰)' : ''}`, disabled: p.money < h.price * coupon })
    })
    if (stageOf(s).id !== 'old') CARS.forEach((c, i) => {
      if (i > p.car) opts.push({ id: `car${i}`, label: `${c.name} 사기`, desc: `${won(c.price * coupon)} · 주사위 ±1을 단계마다 ${c.charges[Math.max(0, s.stageIdx - 2)]}번`, disabled: p.money < c.price * coupon })
    })
    if (!p.agency && canDate(s, p)) {
      opts.push({ id: 'agency0', label: '소개팅 회사 일반 회원', desc: '매 턴 30만, 연애 시작 100만, 속성 지정' })
      opts.push({ id: 'agency1', label: '소개팅 회사 VIP 회원', desc: '매 턴 100만, 연애 시작 300만, 속성 지정 + ★3 이상 잘 나옴' })
    }
    if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 데려오기', desc: `${won(50)} · 매 턴 행복 +1, 사료값`, disabled: p.money < 50 })
    opts.push({ id: 'chance', label: '찬스 카드 사기', desc: won(100), disabled: p.money < 100 })
    opts.push({ id: 'pass', label: '그냥 지나가기' })
    s.pending = { type: 'shop', playerId: p.id, title: '상점', text: `가진 돈 ${won(p.money)}. 하나만 살 수 있어요.`, options: opts }
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

function jobOptions(s: GameState, p: Player, includeStay: boolean): ChoiceOption[] {
  const opts = eligibleJobs(p, s.stageIdx).map((j) => ({
    id: `job:${j.id}`, label: j.name, desc: `${j.boom ? '대박형' : '꾸준형'} · 월급 ${won(j.salary)} · ${j.note}`,
  }))
  opts.push({ id: includeStay ? 'stay' : 'jobless', label: includeStay ? '지금 그대로' : '백수로 지내기', desc: includeStay ? '' : '월급 없음, 성장 칸 효과 +1' })
  return opts
}

function stopTile(s: GameState, p: Player, t: Tile) {
  switch (t.stop) {
    case 'club':
      s.pending = { type: 'club', playerId: p.id, title: '동아리', text: '어떤 동아리에 들어갈까요?', options: [{ id: 'int', label: '공부 동아리', desc: '지력 +2' }, { id: 'str', label: '운동부', desc: '체력 +2' }, { id: 'cha', label: '예체능', desc: '매력 +2' }] }
      break
    case 'job':
      s.pending = { type: 'job', playerId: p.id, title: '직업 선택', text: `지력 ${p.stats.int} · 체력 ${p.stats.str} · 매력 ${p.stats.cha}${p.college ? ' · 대학 졸업' : ''}`, options: jobOptions(s, p, false) }
      break
    case 'jobfair':
      s.pending = { type: 'job', playerId: p.id, title: '취업 박람회', text: '직업을 바꿀 수 있어요.', options: jobOptions(s, p, true) }
      break
    case 'middleBranch': {
      const opts: ChoiceOption[] = []
      if (p.spouse && p.children + p.adopted === 0) opts.push({ id: 'adopt', label: '입양하기', desc: '행복, 매 턴 양육비 (중년에 1번만)' })
      if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 키우기', desc: '매 턴 행복 +1, 사료값' })
      opts.push({ id: 'none', label: '지금처럼 살기' })
      s.pending = { type: 'middleBranch', playerId: p.id, title: '새 가족', text: '새 가족을 맞을까요?', options: opts }
      break
    }
  }
}

function sectorPending(p: Player, title: string, list: Sector[]) {
  return {
    type: 'sector', playerId: p.id, title, text: '고른 분야의 주가가 내 성과에 따라 오르내려요.',
    options: list.map((k) => ({ id: k, label: k })),
  }
}

// 직업별 특징 (docs/02-character.md)
function jobPerkTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  switch (p.jobId) {
    case 'teacher':
      if (rng.chance(0.12)) { p.happy += 3; log(s, p.id, '방학이다! 행복 +3', 'good') }
      break
    case 'police': case 'fire':
      if (rng.chance(0.08)) { p.happy += 3; log(s, p.id, `${p.jobId === 'police' ? '범인을 잡았다' : '불을 끄고 사람을 구했다'}! 행복 +3`, 'good') }
      else if (rng.chance(0.06)) badEvent(s, p, { text: '출동 중에 다쳤다', loss: sc, happyLoss: 2, kind: 'health' })
      break
    case 'doctor':
      if (rng.chance(0.15)) { p.happy -= 2; log(s, p.id, '밤샘 당직… 행복 -2', 'bad') }
      break
    default: break
  }
}

function adoptPet(s: GameState, p: Player, text: string) {
  p.pet = { alive: true, turnsLeft: rngOf(s).int(15, 20) }
  p.happy += 3
  log(s, p.id, `${text}. 행복 +3`, 'good')
}

function setJob(s: GameState, p: Player, id: string | null) {
  p.jobId = id
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
  switch (pd.type) {
    case 'afterRoll': applyAfterRoll(s, p, optionId); return
    case 'fork': applyForkChoice(s, p, +optionId); break
    case 'adultStart': applyRoadStart(s, p, optionId); break
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
      p.stats[k] = clampStat(p.stats[k] + 2)
      log(s, p.id, `${STAT_NAMES[k]} 동아리 활동. ${STAT_NAMES[k]} +2`, 'good')
      break
    }
    case 'collegeStat': {
      const k = optionId as StatKey
      p.stats[k] = clampStat(p.stats[k] + 2)
      log(s, p.id, `대학에서 ${STAT_NAMES[k]} +2`, 'good')
      break
    }
    case 'job':
      if (optionId === 'jobless') setJob(s, p, null)
      else if (optionId !== 'stay') setJob(s, p, optionId.slice(4))
      break
    case 'middleBranch':
      if (optionId === 'adopt') { p.adopted = 1; p.happy += 6; log(s, p.id, '아이를 입양했다. 행복 +6', 'good') }
      if (optionId === 'pet') adoptPet(s, p, '반려동물을 맞았다')
      break
    case 'shop':
      if (optionId.startsWith('house')) {
        const i = +optionId.slice(5) as 0 | 1 | 2 | 3
        const price = Math.round(HOUSES[i].price * (p.chance === 'coupon' ? 0.7 : 1))
        if (p.chance === 'coupon') p.chance = null
        p.money -= price; p.house = i; p.happy += HOUSES[i].happy
        log(s, p.id, `${HOUSES[i].name}을 샀다! 행복 +${HOUSES[i].happy}`, 'good')
      } else if (optionId.startsWith('car')) {
        const i = +optionId.slice(3) as 0 | 1 | 2 | 3
        const price = Math.round(CARS[i].price * (p.chance === 'coupon' ? 0.7 : 1))
        if (p.chance === 'coupon') p.chance = null
        p.money -= price
        // 차를 바꿔도 이번 단계에 이미 쓴 횟수는 이어진다
        const usedThisStage = p.car ? CARS[p.car].charges[Math.max(0, s.stageIdx - 2)] - p.carCharges : 0
        p.car = i
        p.carCharges = Math.max(0, CARS[i].charges[Math.max(0, s.stageIdx - 2)] - usedThisStage)
        if (i === 3) p.happy += 4
        log(s, p.id, `${CARS[i].name}를 샀다!`, 'good')
      } else if (optionId.startsWith('agency')) {
        const vip = optionId === 'agency1'
        s.pending = {
          type: 'agencyAttr', playerId: p.id, title: `소개팅 회사 ${vip ? 'VIP' : '일반'} 가입`, text: '어떤 사람을 소개받고 싶나요?',
          options: [...(Object.keys(ATTR_NAMES) as Attr[]).map((a) => ({ id: a, label: `${ATTR_NAMES[a]} 높은 사람` })), { id: 'none', label: '상관없음' }],
          data: { vip },
        }
      } else if (optionId === 'chance') {
        p.money -= 100
        giveChance(s, p, randomChance(rng))
      } else if (optionId === 'pet') {
        p.money -= 50
        adoptPet(s, p, '상점에서 반려동물을 데려왔다')
      }
      break
    case 'stray':
      if (optionId === 'yes') { p.goodDeeds++; adoptPet(s, p, '유기견을 가족으로 맞았다 (선행)') }
      else log(s, p.id, '유기견을 보호소에 데려다줬다', 'info')
      break
    case 'agencyAttr': {
      const vip = (pd.data as { vip: boolean }).vip
      p.agency = { vip, attr: optionId === 'none' ? null : (optionId as Attr) }
      log(s, p.id, `소개팅 회사 ${vip ? 'VIP' : '일반'} 회원 가입`, 'info')
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
        if (x) { const add = rng.int(15, 25); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${x.name}와 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
      }
      break
    }
    case 'agencyMatch': {
      if (optionId === 'yes') {
        const { x, cost } = pd.data as { x: Suitor; cost: number }
        p.money -= cost
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
        if (x) { const add = rng.int(15, 25); x.affinity = Math.min(100, x.affinity + add); log(s, p.id, `${x.name}와 데이트. 호감도 ${x.affinity}% (+${add})`, 'good') }
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
      }
      break
    }
    case 'wedding': {
      const x = findSuitor(p, (pd.data as { key: string }).key)
      if (!x) break
      const tier = +optionId
      p.money -= sc * [0, 3, 8, 20][tier]
      const { affinity: _a, ...spouse } = x
      void _a
      p.spouse = { ...spouse, revealed: true }
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
      if (tier === 3 && rng.chance(0.5)) { p.goodDeeds += 2; log(s, p.id, '화려한 결혼식이 화제가 됐다 (운세↑)', 'good') }
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
      if (optionId === 'yes') { p.children++; p.happy += 6; log(s, p.id, `아기가 태어났다! (자녀 ${p.children}명) 행복 +6`, 'good'); s.banner = { title: '아기 탄생', text: p.name, tone: 'good' }; say(s, p, 'baby') }
      break
    case 'invest': {
      const cost = (pd.data as { cost: number }).cost
      if (optionId === 'yes') {
        p.money -= cost
        const f = p.fortune
        const win = f >= 3 || (f === 2 && rng.chance(0.5))
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
      } else log(s, p.id, '세금을 정직하게 냈다', 'info')
      break
    }
    case 'sector':
      p.sector = optionId as Sector
      log(s, p.id, `${optionId} 분야를 골랐다`, 'info')
      break
    case 'rps': resolveRps(s, (pd.data as { ids: number[] }).ids, { [p.id]: +optionId }); break
    case 'sabotageTarget': {
      const target = s.players[+optionId]
      if (target) applySabotage(s, p, target)
      break
    }
    case 'loanRequest': {
      const d = pd.data as { borrowerId: number; amount: number; rate: number; term: number }
      if (optionId === 'yes') makeFriendLoan(s, s.players[d.borrowerId], p, d.amount, d.rate, d.term)
      else log(s, p.id, `${s.players[d.borrowerId].name}의 돈 부탁을 거절했다`, 'info')
      break
    }
  }
  resume(s)
}

// ───────── 차례 전에 하는 행동 (재테크·카드) ─────────

export function buyLottery(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s) || p.lottery.ticket || p.money < LOTTERY_PRICE) return
  p.money -= LOTTERY_PRICE
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
  p.money -= price * qty
  p.stocks[sector] += qty
  log(s, p.id, `${sector}주 ${Math.abs(qty)}주 ${qty > 0 ? '샀다' : '팔았다'} (${won(price)}/주)`, 'info')
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

export function takeLoan(s: GameState, amount: number) {
  const p = cur(s)
  if (!canAct(s) || !isAdultStage(s) || p.creditBad > 0) return
  if (loanTotal(p) + amount > loanLimit(p)) return
  p.loans.push({ amount, dueTurn: p.turnsPlayed + 15 })
  p.money += amount
  log(s, p.id, `은행에서 ${won(amount)} 빌렸다 (15턴 안에 갚기)`, 'info')
}

export function repayLoans(s: GameState) {
  const p = cur(s)
  if (!canAct(s)) return
  p.loans.sort((a, b) => a.dueTurn - b.dueTurn)
  while (p.loans.length && p.money >= p.loans[0].amount) {
    p.money -= p.loans[0].amount
    log(s, p.id, `대출 ${won(p.loans[0].amount)}을 갚았다`, 'good')
    p.loans.shift()
  }
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
  lender.goodDeeds += 2 // 돈을 빌려줘서 돌려받으면 선행 → 운세↑
  s.friendLoans.splice(idx, 1)
  log(s, p.id, `${lender.name}에게 빌린 돈 ${won(l.owe)}을 갚았다`, 'good')
}

function friendLoanTick(s: GameState, p: Player) {
  const overdue = s.friendLoans.filter((l) => l.borrowerId === p.id && p.turnsPlayed > l.dueTurn)
  for (const l of overdue) {
    s.friendLoans.splice(s.friendLoans.indexOf(l), 1)
    lawsuit(s, s.players[l.lenderId], p, 'loan', l.owe)
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
  const b = power(defendant) - (kind === 'loan' ? 1 : 0)
  log(s, null, `[법적 공방] ${plaintiff.name}(${a}) vs ${defendant.name}(${b})`, 'info')
  s.banner = { title: '법적 공방', text: `${plaintiff.name} vs ${defendant.name}`, tone: 'info' }
  if (kind === 'loan') {
    if (a >= b) {
      const pay = Math.round(owe * 1.5)
      defendant.money -= pay
      plaintiff.money += pay
      defendant.creditBad = 8
      defendant.fortuneMod -= 1
      log(s, defendant.id, `소송에서 졌다. ${won(pay)}을 물어줬고 신용불량이 됐다`, 'bad')
      say(s, plaintiff, 'lawsuitWin'); say(s, defendant, 'lawsuitLose')
    } else {
      defendant.fortuneMod -= 1
      defendant.creditBad = 8 // 소송에서 이겨도 돈을 안 갚은 사실은 남음
      log(s, defendant.id, `소송에서 이겨 빚 ${won(owe)}을 안 갚아도 된다 (대신 신용불량, 운세↓)`, 'info')
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

export function useChance(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !p.chance) return
  if (p.chance === 'charm') {
    p.chance = null
    p.charmTurns = 3
    p.fortune = Math.min(5, p.fortune + 1)
    log(s, p.id, `행운 부적! 3턴 동안 운세 한 단계↑ (지금: ${fortuneName(p.fortune)})`, 'good')
  } else if (p.chance === 'shortcut') {
    p.chance = null
    log(s, p.id, '지름길 카드: 이번 주사위 +2', 'good')
    roll(s, 2)
  }
}

export function startSabotage(s: GameState) {
  const p = cur(s)
  if (!canAct(s) || !p.sabotage) return
  s.pending = {
    type: 'sabotageTarget', playerId: p.id, title: SABOTAGE_NAMES[p.sabotage], text: '누구에게 쓸까요? 상대 운세가 나보다 좋을수록 역풍이 불 수 있어요.',
    options: s.players.filter((q) => q.id !== p.id).map((q) => ({ id: String(q.id), label: q.name, desc: `운세 ${fortuneName(q.fortune)}` })),
  }
  s.phase = 'decision'
}

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
  const backfire = Math.max(0, target.fortune - p.fortune) * 0.12
  const victim = rng.chance(backfire) ? p : target
  if (victim === p) log(s, p.id, '역풍! 방해가 나에게 돌아왔다', 'bad')
  else say(s, target, 'sabotaged')
  if (card === 'rumor') badEvent(s, victim, { text: '나쁜 소문이 퍼졌다', loss: 0, happyLoss: 6 })
  if (card === 'stockRumor') {
    const sector = SECTORS.reduce((a, k) => (victim.stocks[k] > victim.stocks[a] ? k : a), SECTORS[0])
    s.stockPrice[sector] = Math.max(10, Math.round(s.stockPrice[sector] * 0.8))
    log(s, null, `주가 루머로 ${sector}주 -20%`, 'bad')
  }
  if (card === 'love') {
    const top = [...victim.suitors].sort((a, b) => b.affinity - a.affinity)[0]
    if (top) { top.affinity = Math.max(0, top.affinity - 25); log(s, victim.id, `연애 방해로 ${top.name} 호감도 -25`, 'bad') }
    else badEvent(s, victim, { text: '연애 방해로 마음고생', loss: 0, happyLoss: 3 })
  }
}

// ───────── 차례 끝, 단계 전환 ─────────

function endTurn(s: GameState) {
  const p = cur(s)
  const st = stageOf(s)
  if (st.rolls) p.rollsLeft = Math.max(0, p.rollsLeft - 1)
  if (st.id === 'old' && tileOf(s, p).kind === 'goal' && !p.finished) {
    p.finished = true
    s.finishCount++
    p.finishOrder = s.finishCount
    const bonus = [0, 500, 300, 100, 0][s.finishCount] ?? 0
    p.money += bonus
    log(s, p.id, `${s.finishCount}번째로 골인!${bonus ? ` +${won(bonus)}` : ''}`, 'good')
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
  for (const k of SECTORS) s.stockPrice[k] = Math.max(10, Math.round(s.stockPrice[k] * (1 + (rng.next() - 0.5) * 0.12)))
  if (s.nextNews) {
    const n = s.nextNews
    s.stockPrice[n.sector] = Math.max(10, Math.round(s.stockPrice[n.sector] * (n.up ? 1 + n.size : 1 - n.size)))
    log(s, null, `[뉴스] ${n.sector} ${n.up ? '호재' : '악재'}! ${n.up ? '+' : '-'}${Math.round(n.size * 100)}%`, n.up ? 'good' : 'bad')
  }
  s.nextNews = rng.chance(0.35) ? { sector: rng.pick(SECTORS), up: rng.chance(0.5), size: 0.2 + rng.next() * 0.3 } : null
  for (const p of s.players) {
    if (p.jobId === 'scientist' && rng.chance(0.15)) {
      const k = p.sector ?? '화학'
      s.stockPrice[k] = Math.round(s.stockPrice[k] * 1.12)
      log(s, null, `${p.name}의 연구 성과! ${k}주 +12%`, 'good')
    }
  }
}

export function stockHint(s: GameState, p: Player): string | null {
  const n = s.nextNews
  if (p.fortune < 3) return null
  if (!n) return p.fortune >= 4 ? '다음 바퀴엔 큰 소식이 없을 것 같다' : null
  if (p.fortune === 3) return '어떤 분야에 소식이 있을 것 같다…'
  if (p.fortune === 4) return `${n.sector} 쪽에 소식이 있다`
  return `${n.sector}에 ${n.up ? '좋은' : '나쁜'} 소식이 있다`
}

function careerRoll(s: GameState, p: Player) {
  const job = jobOf(p)
  if (!job?.boom) return
  const rng = rngOf(s)
  const below = p.stats[job.key] < (job.req[job.key] ?? 0) ? -1 : 0 // 능력치가 조건 밑이면 추락 확률↑
  const v = rng.int(1, 6) + (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0) + below
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
  s.stageIdx++
  s.path = [] // 단계가 바뀌면 칸 번호가 달라지므로 걷는 연출 생략
  s.pathId++
  const st = stageOf(s)
  for (const p of s.players) {
    p.pos = 0
    p.forkChoice = null
    p.rollsLeft = st.rolls ?? 0
    p.carCharges = CARS[p.car].charges[Math.max(0, s.stageIdx - 2)]
    if (st.id === 'middle' && p.jobId === 'athlete') { log(s, p.id, '운동선수 은퇴! 창업 길이나 취업 박람회에서 새 출발', 'info'); p.jobId = null }
    if (st.id !== 'young') careerRoll(s, p)
    if (st.id === 'old') {
      if (p.jobId) log(s, p.id, `${jobOf(p)?.name} 은퇴${jobOf(p)?.pension ? ' (연금 받음)' : ''}`, 'info')
      p.agency = null
    }
  }
  log(s, null, `${st.name} 단계 시작! (${st.ages[0]}세)`, 'info')
  s.banner = { title: `${st.name} 단계`, text: `${st.ages[0]}세가 되었어요`, tone: 'info' }
  s.current = 0
  beginTurn(s)
}
