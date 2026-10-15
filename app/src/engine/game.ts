import {
  AI_NAMES, CARS, CHANCE_NAMES, FORTUNES, FORTUNE_WEIGHTS, HOUSES, INSURANCE, JOBS, LOTTERY_PRICE,
  PERSONALITIES, PLAYER_COLORS, PRESTIGE_JOBS, SABOTAGE_NAMES, SECTORS, SPOUSE_NAMES, STAGE_DEFS,
  STAGE_SCALE, STAT_NAMES, TAX_RATE, TRAITS,
} from './data'
import { makeRng, type Rng } from './rng'
import type {
  ChanceCard, ChoiceOption, GameState, InsuranceKind, JobDef, Personality, Player, SabotageCard, Sector,
  Settings, Stage, StatKey, Suitor, Tile, TileKind,
} from './types'

// ───────── 기본 도우미 ─────────

export const rngOf = (s: GameState): Rng => makeRng(s)
export const stageOf = (s: GameState): Stage => s.stages[s.stageIdx]
export const cur = (s: GameState): Player => s.players[s.current]
export const jobOf = (p: Player): JobDef | null => JOBS.find((j) => j.id === p.jobId) ?? null
export const scaleOf = (s: GameState) => STAGE_SCALE[stageOf(s).id]
export const isAdultStage = (s: GameState) => s.stageIdx >= 2
export const fortuneName = (f: number) => FORTUNES[f]
const clampStat = (v: number) => Math.max(0, Math.min(10, v))
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`

export function log(s: GameState, playerId: number | null, text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  s.log.push({ turn: s.turn, playerId, text, tone })
  if (s.log.length > 200) s.log.splice(0, s.log.length - 200)
}

export function ageOf(s: GameState, p: Player): number {
  const st = stageOf(s)
  const [a, b] = st.ages
  if (st.rolls) {
    const used = st.rolls - p.rollsLeft
    return a + Math.floor((used / st.rolls) * (b - a + 1))
  }
  return a + Math.floor((p.pos / (st.tiles.length - 1)) * (b - a))
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
export function assetsOf(s: GameState, p: Player) {
  return p.money + HOUSES[p.house].price + stocksValue(s, p) - loanTotal(p)
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
export function eligibleJobs(p: Player) {
  const relax = p.spouse && p.spouse.fame >= 7 ? 1 : 0 // 명성 높은 배우자: 인맥으로 조건 1 완화
  return JOBS.filter((j) => j.id !== 'ceo' && meetsReq(p, j, relax))
}

// ───────── 게임 만들기 ─────────

function buildStages(rng: Rng): Stage[] {
  return STAGE_DEFS.map((d) => {
    const tiles: Tile[] = []
    for (let i = 0; i < d.length; i++) {
      let kind: TileKind = rng.weighted(d.weights)
      if (i === 0) kind = 'happy'
      tiles.push({ kind })
    }
    for (const [i, ev] of Object.entries(d.stops)) tiles[+i] = { kind: 'stop', stop: ev }
    for (const [i, pt] of Object.entries(d.points)) tiles[+i] = { ...tiles[+i], point: pt }
    for (const i of d.maps) tiles[i] = { kind: 'map' }
    tiles[d.length - 1] = { kind: d.rolls ? 'rest' : 'goal' }
    return { id: d.id, name: d.name, ages: d.ages, rolls: d.rolls, tiles }
  })
}

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
    chance: null, sabotage: null,
  }
}

export interface NewGameOptions {
  humanName: string
  aiCount: number
  humans?: number
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
    phase: 'roll', pending: null, move: null, lastRoll: null, log: [],
    stockPrice: { 생명: 100, IT: 100, 화학: 100, 의료: 100, 엔터: 100 },
    nextNews: null, finishCount: 0, banner: null,
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
  p.fortune = Math.min(5, f)
}

function beginTurn(s: GameState) {
  if (s.phase === 'gameover') return
  const p = cur(s)
  const rng = rngOf(s)
  s.turn++
  p.turnsPlayed++
  s.lastRoll = null
  s.move = null
  s.phase = 'roll'
  drawFortune(s, p)
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
      if (prize >= 1000) s.banner = { title: '복권 당첨!', text: `${p.name}: ${won(prize)} 원`, tone: 'good' }
    } else log(s, p.id, '복권 꽝', 'info')
  } else if (isAdultStage(s)) {
    p.lottery.chance = Math.max(10, p.lottery.chance - 10)
  }

  if (isAdultStage(s)) economyTick(s, p)
  familyTick(s, p)

  if (p.lottery.addicted && rng.chance(0.2)) {
    badEvent(s, p, { text: '도박중독: 몰래 도박으로 돈을 날렸다', loss: scaleOf(s) * 2, happyLoss: 2 })
  }
  if (p.money < 0 && rng.chance(0.25)) {
    badEvent(s, p, { text: '빚 독촉에 시달렸다', loss: 0, happyLoss: 4 })
  }
  // 대학 가는 길 선택 (성인부터 시작한 판)
  if (s.settings.startAdult && p.turnsPlayed === 1 && stageOf(s).id === 'young') {
    s.pending = collegePending(p)
  }
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
    if (!job.boom && p.jobRank < 2) {
      const fast = p.stats[job.key] >= (job.req[job.key] ?? 0) + 2
      if (p.jobTurns >= (fast ? 4 : 6)) {
        p.jobRank++
        p.jobTurns = 0
        log(s, p.id, `승진! ${job.name} ${job.ranks[p.jobRank]}`, 'good')
      }
    }
  }
  if (st.id === 'old') {
    if (job?.pension) { p.money += 120; }
    if (p.retire === 'city') {
      if (rng.chance(0.5)) p.money += 80
      else p.money -= 50
    } else if (p.retire === 'country') p.happy += 2
  }
  // 고정 지출
  let upkeep = 0
  for (const k of Object.keys(p.insurance) as InsuranceKind[]) if (p.insurance[k]) upkeep += INSURANCE[k].premium
  upkeep += CARS[p.car].upkeep
  upkeep += (p.children + p.adopted) * 20
  if (p.pet?.alive) upkeep += 5
  p.money -= upkeep
  for (const l of p.loans) l.amount = Math.round(l.amount * 1.01)
  // 대출 기한
  const overdue = p.loans.filter((l) => p.turnsPlayed > l.dueTurn)
  if (overdue.length) forceLiquidate(s, p, overdue)
}

function forceLiquidate(s: GameState, p: Player, overdue: { amount: number }[]) {
  let need = overdue.reduce((a, l) => a + l.amount, 0)
  p.loans = p.loans.filter((l) => !overdue.includes(l))
  for (const k of SECTORS) {
    const v = p.stocks[k] * s.stockPrice[k]
    p.money += v
    p.stocks[k] = 0
  }
  if (p.money < need && p.house > 0) {
    p.money += Math.round(HOUSES[p.house].price * 0.8)
    log(s, p.id, `강제 청산: ${HOUSES[p.house].name}을 팔았다`, 'bad')
    p.house = 0
  }
  p.money -= need
  need = 0
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
      p.money += sc * 2
      p.happy += 2
      log(s, p.id, `${sp.name}가 방송·광고에 나왔다! 수입 ${won(sc * 2)}`, 'good')
    }
    if (sp.fame >= 7 && rng.chance(0.05)) {
      s.stockPrice[sp.sector] = Math.max(10, Math.round(s.stockPrice[sp.sector] * 0.85))
      badEvent(s, p, { text: `${sp.name} 스캔들! (${sp.sector}주 하락)`, loss: 0, happyLoss: 4 })
    }
    if (rng.chance(0.12)) traitEvent(s, p)
    // 이혼: 중년부터
    if (s.stageIdx >= 3 && p.spouse) {
      const spouseFault = sp.trait === '바람기' || sp.kindness <= 3
      const myFault = p.lottery.addicted || p.money < 0
      const ch = 0.01 + (sp.kindness <= 3 ? 0.03 : 0) + (sp.trait === '바람기' ? 0.03 : 0) + (myFault ? 0.03 : 0)
      if (rng.chance(ch)) divorce(s, p, spouseFault && !myFault ? 'spouse' : myFault ? 'me' : rng.chance(0.5) ? 'spouse' : 'me')
    }
  }
  const kids = p.children + p.adopted
  if (kids) p.happy += p.children + (p.adopted ? 1 : 0)
  if (p.pet?.alive) {
    p.happy += 1
    p.pet.turnsLeft--
    if (rng.chance(0.06)) badEvent(s, p, { text: '반려동물이 가구를 망가뜨렸다', loss: sc, happyLoss: 0 })
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
  const reveal = () => {
    if (!sp.revealed) { sp.revealed = true; log(s, p.id, `배우자의 숨은 특성이 드러났다: ${sp.trait}`, sp.traitGood ? 'good' : 'bad') }
  }
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
  reveal()
}

function divorce(s: GameState, p: Player, fault: 'me' | 'spouse') {
  const sp = p.spouse!
  if (p.fortune >= 4) {
    log(s, p.id, `[운세 ${fortuneName(p.fortune)}] 이혼 위기를 넘기고 화해했다`, 'good')
    return
  }
  const sc = scaleOf(s)
  p.happy -= 15
  if (sp.wealth >= 7) p.money += Math.round(Math.max(0, p.money) * 0.1 + sp.wealth * 50)
  else p.money -= Math.round(Math.max(0, p.money) * 0.2)
  const alimony = sc * 4
  p.money += fault === 'spouse' ? alimony : -alimony
  p.spouse = null
  p.divorced = true
  p.suitors = []
  log(s, p.id, `${sp.name}와 이혼했다 (${fault === 'spouse' ? '배우자 잘못, 위자료 받음' : '내 잘못, 위자료 냄'})`, 'bad')
  s.banner = { title: '이혼', text: `${p.name}와 ${sp.name}`, tone: 'bad' }
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
    return
  }
  const f = p.fortune
  let mult = 1
  let note = ''
  if (f === 0) { mult = 1.5; note = '더 나빠졌다' }
  else if (f === 1) { mult = 1.2; note = '조금 더 나빠졌다' }
  else if (f === 3 && rng.chance(0.6)) { mult = 0.5; note = '다행히 절반은 돌려받았다' }
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
}

// ───────── 굴리기와 이동 ─────────

export function canAct(s: GameState) {
  return s.phase === 'roll' && !s.pending
}

export const canUseCar = (p: Player) => p.car > 0 && p.carCharges > 0

// useCar: 던지기 전에 자동차 ±1 능력을 쓰겠다고 정함 (쓰면 결과와 상관없이 1번 차감)
export function roll(s: GameState, bonus = 0, useCar = false) {
  if (!canAct(s)) return
  const p = cur(s)
  const rng = rngOf(s)
  const st = stageOf(s)
  const last = st.tiles.length - 1
  if (st.rolls && p.pos >= last) {
    s.lastRoll = rng.int(1, 6)
    const k = rng.pick(['int', 'str', 'cha'] as StatKey[])
    p.stats[k] = clampStat(p.stats[k] + 1)
    p.money += scaleOf(s)
    log(s, p.id, `휴식 칸에서 쉬었다: ${STAT_NAMES[k]} +1, +${won(scaleOf(s))}`, 'good')
    endTurn(s)
    return
  }
  const value = rng.int(1, 6)
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
    const choice = aiAfterRoll(s, p, s.lastRoll, carOn)
    applyAfterRoll(s, p, choice)
    return
  }
  startMove(s, s.lastRoll)
}

function tileAhead(s: GameState, p: Player, steps: number): Tile {
  const tiles = stageOf(s).tiles
  for (let i = 1; i <= steps; i++) {
    const t = tiles[Math.min(p.pos + i, tiles.length - 1)]
    if (t.kind === 'stop' || t.kind === 'goal') return t
  }
  return tiles[Math.min(p.pos + steps, tiles.length - 1)]
}

function aiAfterRoll(s: GameState, p: Player, n: number, carOn: boolean): string {
  const tileKind = (k: number) => tileAhead(s, p, k).kind
  const value = (k: number) => {
    const t = tileKind(k)
    return t === 'risk' ? -3 : t === 'money' || t === 'map' ? 2 : t === 'card' || t === 'happy' || t === 'date' ? 1 : 0
  }
  if (carOn) {
    const cands = [['keep', n], ['plus', n + 1], ...(n > 1 ? [['minus', n - 1]] : [])] as [string, number][]
    // 노년은 골까지 경주라 많이 가는 쪽에 가산점
    const bonus = (k: number) => (stageOf(s).id === 'old' ? k * 0.5 : 0)
    return cands.reduce((a, c) => (value(c[1]) + bonus(c[1]) > value(a[1]) + bonus(a[1]) ? c : a))[0]
  }
  if (p.chance === 'reroll' && tileKind(n) === 'risk') return 'reroll'
  return 'keep'
}

// AI가 던지기 전에 자동차 능력을 쓸지: 남은 횟수에 여유가 있거나 노년 경주면 사용
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
  continueMove(s)
}

function continueMove(s: GameState) {
  const p = cur(s)
  const tiles = stageOf(s).tiles
  const last = tiles.length - 1
  while (s.move && s.move.remaining > 0 && p.pos < last) {
    p.pos++
    s.move.remaining--
    const t = tiles[p.pos]
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
  if (s.move) { s.phase = 'roll'; continueMove(s); return }
  if (s.lastRoll === null) { s.phase = 'roll'; return }
  endTurn(s)
}

// ───────── 칸 효과 ─────────

function land(s: GameState) {
  const p = cur(s)
  const st = stageOf(s)
  const t = st.tiles[p.pos]
  const rng = rngOf(s)
  const sc = scaleOf(s)
  switch (t.kind) {
    case 'money': {
      const amt = sc * rng.int(2, 5)
      p.money += amt
      log(s, p.id, `${isAdultStage(s) ? '보너스' : '용돈'} +${won(amt)}`, 'good')
      break
    }
    case 'grow': {
      const k = rng.pick(['int', 'str', 'cha'] as StatKey[])
      const add = isAdultStage(s) && !p.jobId ? 2 : 1
      p.stats[k] = clampStat(p.stats[k] + add)
      log(s, p.id, `${STAT_NAMES[k]} +${add}`, 'good')
      break
    }
    case 'happy': {
      const h = rng.int(3, 6)
      p.happy += h
      log(s, p.id, `즐거운 일! 행복 +${h}`, 'good')
      break
    }
    case 'risk': riskTile(s, p); break
    case 'card': drawCard(s, p); break
    case 'date': dateTile(s, p); break
    case 'map': mapTile(s, p); break
    case 'stop': stopTile(s, p, t); break
    case 'rest': log(s, p.id, '단계 끝 휴식 칸에 도착했다', 'info'); break
    case 'goal': break
  }
  resume(s)
}

function riskTile(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const opts: Bad[] = [
    { text: '감기에 걸려 병원에 갔다', loss: sc * 2, happyLoss: 2, kind: 'health' },
    { text: '지갑을 잃어버렸다', loss: sc * 3, happyLoss: 1 },
    { text: '친구와 크게 싸웠다', loss: 0, happyLoss: 5 },
  ]
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

function drawCard(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const adult = isAdultStage(s)
  const r = rng.next()
  if (r < 0.12) return giveChance(s, p, rng.pick(['reroll', 'block', 'charm', 'coupon', 'shortcut'] as ChanceCard[]))
  if (adult && r < 0.2) return giveSabotage(s, p, rng.pick(['rumor', 'stockRumor', 'love'] as SabotageCard[]))
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
  if (adult) {
    deck.push(() => {
      s.pending = {
        type: 'invest', playerId: p.id, title: '투자 권유', text: `친구가 ${won(sc * 3)}을 투자하자고 한다. 결과는 운세에 달렸다.`,
        options: [{ id: 'yes', label: `투자한다 (-${won(sc * 3)})` }, { id: 'no', label: '거절한다' }], data: { cost: sc * 3 },
      }
    })
    if (p.jobId) {
      deck.push(() => {
        s.pending = {
          type: 'overtime', playerId: p.id, title: '야근 부탁', text: '회사에서 야근을 부탁한다.',
          options: [{ id: 'yes', label: '한다', desc: `+${won(sc)}, 행복 -3` }, { id: 'no', label: '거절한다', desc: '행복 +2' }], data: { amt: sc },
        }
      })
      deck.push(() => {
        const tax = Math.round(salaryOf(p) * 0.5)
        s.pending = {
          type: 'taxEvade', playerId: p.id, title: '세금 안 내기?', text: `이번 세금 ${won(tax)}을 안 낼 기회가 생겼다. 걸리면 세금에 벌금까지.`,
          options: [{ id: 'yes', label: '안 낸다 (운세에 맡김)' }, { id: 'no', label: '정직하게 낸다' }], data: { tax },
        }
      })
    }
    if (p.house) deck.push(() => everyoneStorm(s))
  }
  rng.pick(deck)()
}

function contest(s: GameState, p: Player) {
  const rng = rngOf(s)
  const k = rng.pick(['int', 'str', 'cha'] as StatKey[])
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

function mapTile(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const id = stageOf(s).id
  const ev = {
    child: { name: '놀이공원', happy: 6, stat: 'cha' as StatKey, cost: 0 },
    student: { name: '수학여행', happy: 5, stat: 'cha' as StatKey, cost: sc },
    young: { name: '해외여행', happy: 9, stat: 'int' as StatKey, cost: sc * 2 },
    middle: { name: '가족 캠핑장', happy: 8, stat: 'str' as StatKey, cost: sc },
    old: { name: '세계일주', happy: 10, stat: 'int' as StatKey, cost: sc * 2 },
  }[id]
  p.happy += ev.happy
  p.money -= ev.cost
  p.stats[ev.stat] = clampStat(p.stats[ev.stat] + 1)
  log(s, p.id, `[이벤트 맵] ${ev.name}! 행복 +${ev.happy}, ${STAT_NAMES[ev.stat]} +1${ev.cost ? `, -${won(ev.cost)}` : ''}`, 'good')
  if (rng.chance(0.4)) giveChance(s, p, rng.pick(['reroll', 'block', 'charm', 'coupon', 'shortcut'] as ChanceCard[]))
}

// ───────── 연애와 결혼 ─────────

function makeSuitor(s: GameState, p: Player): Suitor {
  const rng = rngOf(s)
  const boost = (PRESTIGE_JOBS.includes(p.jobId ?? '') ? 1 : 0) + (p.car === 3 ? 1 : 0)
  const w = [30, 30, 20, 13, 7].map((x, i) => [i + 1, i < 2 ? x - boost * 6 : x + boost * 4] as const)
  const grade = rng.weighted(w)
  const base = 2 + grade
  const roll = () => Math.max(1, Math.min(10, base + rng.int(-3, 3)))
  const attrs = { looks: roll(), wealth: roll(), fame: roll(), kindness: roll() }
  const keys = Object.keys(attrs) as (keyof typeof attrs)[]
  const strong = rng.pick(keys)
  attrs[strong] = Math.min(10, attrs[strong] + 2)
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

const suitorDesc = (x: Suitor) => `${x.grade}등급 · 외모 ${x.looks} 재력 ${x.wealth} 명성 ${x.fame} 성격 ${x.kindness} · ${x.sector}`

function dateTile(s: GameState, p: Player) {
  const id = stageOf(s).id
  if (p.spouse) {
    if (id === 'young' && p.children < 3) {
      s.pending = {
        type: 'baby', playerId: p.id, title: '아기를 낳을까요?', text: `지금 자녀 ${p.children}명 (최대 3명). 자녀는 매 턴 행복을 주지만 돈이 들어요.`,
        options: [{ id: 'yes', label: '낳는다' }, { id: 'no', label: '나중에' }],
      }
    } else { p.happy += 2; log(s, p.id, `${p.spouse.name}와 데이트. 행복 +2`, 'good') }
    return
  }
  if (id !== 'young' && id !== 'middle') { p.happy += 2; log(s, p.id, '좋은 사람들을 만났다. 행복 +2', 'good'); return }
  if (id === 'middle' && !p.divorced && p.suitors.length === 0 && s.stages[3].tiles.findIndex((t) => t.point === 'marriage') < p.pos) {
    p.happy += 2; log(s, p.id, '친구들과 즐거운 시간. 행복 +2', 'good'); return
  }
  const fresh = [makeSuitor(s, p), makeSuitor(s, p)]
  const known = [...p.suitors].sort((a, b) => b.affinity - a.affinity).slice(0, 2)
  const options: ChoiceOption[] = [
    ...fresh.map((x, i) => ({ id: `new${i}`, label: `새로운 사람: ${x.name}`, desc: suitorDesc(x) })),
    ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `다시 데이트: ${x.name} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
  ]
  s.pending = { type: 'date', playerId: p.id, title: '데이트', text: '누구와 데이트할까요?', options, data: { fresh } }
}

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
    opts.push({ id: 'chance', label: '찬스 카드 사기', desc: won(100), disabled: p.money < 100 })
    opts.push({ id: 'pass', label: '그냥 지나가기' })
    s.pending = { type: 'shop', playerId: p.id, title: '상점', text: `가진 돈 ${won(p.money)}. 하나만 살 수 있어요.`, options: opts }
    return
  }
  // 결혼 지점
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

function collegePending(p: Player) {
  return {
    type: 'college', playerId: p.id, title: '대학 vs 바로 취업',
    text: '대학에 가면 직업 고르기 전에 능력치를 키울 수 있고 🎓 직업이 열려요. 대신 학자금 대출이 생겨요.',
    options: [{ id: 'college', label: '대학 진학', desc: '능력치 +2, 학자금 대출 800만' }, { id: 'work', label: '바로 취업', desc: '모아 둔 돈 +400만' }],
  }
}

function jobOptions(p: Player, includeStay: boolean): ChoiceOption[] {
  const opts = eligibleJobs(p).map((j) => ({
    id: `job:${j.id}`, label: j.name, desc: `${j.boom ? '대박형' : '꾸준형'} · 월급 ${won(j.salary)} · ${j.note}`,
  }))
  opts.push({ id: includeStay ? 'stay' : 'jobless', label: includeStay ? '지금 그대로' : '백수로 지내기', desc: includeStay ? '' : '월급 없음, 성장 칸 효과 +1' })
  return opts
}

function stopTile(s: GameState, p: Player, t: Tile) {
  switch (t.stop) {
    case 'academy':
      s.pending = { type: 'academy', playerId: p.id, title: '학원 vs 실컷 놀기', text: '어린 시절을 어떻게 보낼까요?', options: [{ id: 'study', label: '학원 다니기', desc: '지력 +2' }, { id: 'play', label: '실컷 놀기', desc: '매력 +1, 행복 +4' }] }
      break
    case 'club':
      s.pending = { type: 'club', playerId: p.id, title: '동아리', text: '어떤 동아리에 들어갈까요?', options: [{ id: 'int', label: '공부 동아리', desc: '지력 +2' }, { id: 'str', label: '운동부', desc: '체력 +2' }, { id: 'cha', label: '예체능', desc: '매력 +2' }] }
      break
    case 'college':
      s.pending = collegePending(p)
      break
    case 'job':
      s.pending = { type: 'job', playerId: p.id, title: '직업 선택', text: `지력 ${p.stats.int} · 체력 ${p.stats.str} · 매력 ${p.stats.cha}${p.college ? ' · 대학 졸업' : ''}`, options: jobOptions(p, false) }
      break
    case 'jobfair':
      s.pending = { type: 'job', playerId: p.id, title: '취업 박람회', text: '직업을 바꿀 수 있어요.', options: jobOptions(p, true) }
      break
    case 'middleBranch': {
      const opts: ChoiceOption[] = []
      if (p.spouse && p.children + p.adopted === 0) opts.push({ id: 'adopt', label: '입양하기', desc: '행복, 매 턴 양육비' })
      if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 키우기', desc: '매 턴 행복 +1, 사료값' })
      opts.push({ id: 'none', label: '지금처럼 살기' })
      s.pending = { type: 'middleBranch', playerId: p.id, title: '중년 갈림길', text: '새 가족을 맞을까요?', options: opts }
      break
    }
    case 'careerChange': {
      const cost = p.jobId === 'chef' ? 1200 : 2000
      const opts: ChoiceOption[] = [{ id: 'ceo', label: '창업하기', desc: `${won(cost)} 필요${p.jobId === 'chef' ? ' (요리사 할인)' : ''} · 대박 아니면 빚`, disabled: p.money < cost && p.creditBad > 0 }]
      opts.push(...jobOptions(p, true))
      s.pending = { type: 'careerChange', playerId: p.id, title: '이직·창업 갈림길', text: '인생 2막을 어떻게 할까요?', options: opts, data: { cost } }
      break
    }
    case 'retire':
      s.pending = { type: 'retire', playerId: p.id, title: '은퇴지 고르기', text: '어디서 노후를 보낼까요?', options: [{ id: 'city', label: '도시', desc: '매 턴 돈이 오르내림 (위험·보상)' }, { id: 'country', label: '시골', desc: '매 턴 행복 +2' }] }
      break
  }
}

function setJob(s: GameState, p: Player, id: string | null) {
  p.jobId = id
  p.jobRank = id === 'ceo' || JOBS.find((j) => j.id === id)?.boom ? 1 : 0
  p.jobTurns = 0
  const j = jobOf(p)
  if (j) {
    log(s, p.id, `${j.name}${j.boom ? '' : ` ${j.ranks[p.jobRank]}`}(으)로 일을 시작했다`, 'good')
    if (j.id === 'idol') { s.stockPrice.엔터 = Math.round(s.stockPrice.엔터 * 1.1); log(s, null, `${p.name} 데뷔! 엔터주 +10%`, 'info') }
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
    case 'cardSwap': {
      const d = pd.data as { kind: string; card: string }
      if (optionId === 'new') {
        if (d.kind === 'chance') p.chance = d.card as ChanceCard
        else p.sabotage = d.card as SabotageCard
      }
      break
    }
    case 'academy':
      if (optionId === 'study') p.stats.int = clampStat(p.stats.int + 2)
      else { p.stats.cha = clampStat(p.stats.cha + 1); p.happy += 4 }
      log(s, p.id, optionId === 'study' ? '학원에 다녔다. 지력 +2' : '실컷 놀았다. 매력 +1, 행복 +4', 'good')
      break
    case 'club': {
      const k = optionId as StatKey
      p.stats[k] = clampStat(p.stats[k] + 2)
      log(s, p.id, `${STAT_NAMES[k]} 동아리 활동. ${STAT_NAMES[k]} +2`, 'good')
      break
    }
    case 'college':
      if (optionId === 'college') {
        p.college = true
        p.loans.push({ amount: 800, dueTurn: p.turnsPlayed + 40 })
        log(s, p.id, '대학에 진학했다 (학자금 대출 800만)', 'info')
        s.pending = { type: 'collegeStat', playerId: p.id, title: '대학에서 키울 능력치', text: '무엇을 공부할까요?', options: [{ id: 'int', label: '지력 +2' }, { id: 'str', label: '체력 +2' }, { id: 'cha', label: '매력 +2' }] }
      } else { p.money += 400; log(s, p.id, '바로 취업 준비. 모아 둔 돈 +400만', 'good') }
      break
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
    case 'careerChange': {
      if (optionId === 'ceo') {
        const cost = (pd.data as { cost: number }).cost
        if (p.money < cost) { p.loans.push({ amount: cost - p.money, dueTurn: p.turnsPlayed + 20 }); p.money = cost; log(s, p.id, '빚을 내서 창업 자금을 마련했다', 'info') }
        p.money -= cost
        setJob(s, p, 'ceo')
        p.jobRank = p.jobId === 'ceo' && rng.chance(p.stats.int >= 6 ? 0.6 : 0.4) ? 1 : 0
      } else if (optionId.startsWith('job:')) setJob(s, p, optionId.slice(4))
      break
    }
    case 'middleBranch':
      if (optionId === 'adopt') { p.adopted = 1; p.happy += 6; log(s, p.id, '아이를 입양했다. 행복 +6', 'good') }
      if (optionId === 'pet') { p.pet = { alive: true, turnsLeft: rng.int(15, 20) }; p.happy += 3; log(s, p.id, '반려동물을 맞았다. 행복 +3', 'good') }
      break
    case 'retire':
      p.retire = optionId as 'city' | 'country'
      log(s, p.id, optionId === 'city' ? '도시에서 노후를 보내기로 했다' : '시골로 내려가기로 했다', 'info')
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
      } else if (optionId === 'chance') {
        p.money -= 100
        giveChance(s, p, rng.pick(['reroll', 'block', 'charm', 'coupon', 'shortcut'] as ChanceCard[]))
      }
      break
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
            { id: '1', label: '작은 결혼식', desc: won(sc * 3), disabled: false },
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
      const cost = sc * [0, 3, 8, 20][tier]
      p.money -= cost
      const { affinity: _a, ...spouse } = x
      void _a
      p.spouse = { ...spouse, revealed: false }
      p.suitors = []
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
      s.banner = { title: '결혼!', text: `${p.name} ♥ ${x.name}`, tone: 'good' }
      p.spouse.revealed = true
      log(s, p.id, `결혼해 보니 ${x.name}의 숨은 특성: ${x.trait}`, x.traitGood ? 'good' : 'bad')
      break
    }
    case 'baby':
      if (optionId === 'yes') { p.children++; p.happy += 6; log(s, p.id, `아기가 태어났다! (자녀 ${p.children}명) 행복 +6`, 'good'); s.banner = { title: '아기 탄생', text: p.name, tone: 'good' } }
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
    case 'sabotageTarget': {
      const target = s.players[+optionId]
      if (target) applySabotage(s, p, target)
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
  log(s, p.id, `복권을 샀다 (다음 차례에 확인)`, 'info')
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
    type: 'sabotageTarget', playerId: p.id, title: SABOTAGE_NAMES[p.sabotage], text: '누구에게 쓸까요? 상대 운세가 좋을수록 역풍이 불 수 있어요.',
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
  if (target.chance === 'block') {
    target.chance = null
    log(s, target.id, '방해 막기 카드로 막았다!', 'good')
    return
  }
  const backfire = Math.max(0, target.fortune - p.fortune) * 0.12
  const victim = rng.chance(backfire) ? p : target
  if (victim === p) log(s, p.id, '역풍! 방해가 나에게 돌아왔다', 'bad')
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
  if (st.id === 'old' && st.tiles[p.pos].kind === 'goal' && !p.finished) {
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
  // 단계 끝?
  if (st.rolls && s.players.every((q) => q.rollsLeft <= 0)) { nextStage(s); return }
  if (!st.rolls && s.players.every((q) => q.finished)) { s.phase = 'gameover'; s.banner = { title: '게임 끝!', text: '최종 점수를 확인하세요', tone: 'info' }; log(s, null, '모두 골인! 게임 끝', 'info'); return }
  // 다음 사람
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
      s.stockPrice.화학 = Math.round(s.stockPrice.화학 * 1.12)
      log(s, null, `${p.name}의 연구 성과! 화학주 +12%`, 'good')
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
  const v = rng.int(1, 6) + (p.fortune >= 4 ? 1 : p.fortune <= 1 ? -1 : 0)
  if (v >= 5 && p.jobRank < 2) { p.jobRank++; log(s, p.id, `커리어 주사위 ${v}: 대박! ${job.ranks[p.jobRank]}`, 'good') }
  else if (v <= 2 && p.jobRank > 0) { p.jobRank--; log(s, p.id, `커리어 주사위 ${v}: 추락… ${job.ranks[p.jobRank]}`, 'bad') }
  else log(s, p.id, `커리어 주사위 ${v}: 유지 (${job.ranks[p.jobRank]})`, 'info')
}

function nextStage(s: GameState) {
  s.stageIdx++
  const st = stageOf(s)
  for (const p of s.players) {
    p.pos = 0
    p.rollsLeft = st.rolls ?? 0
    p.carCharges = CARS[p.car].charges[Math.max(0, s.stageIdx - 2)]
    if (st.id === 'young' && !p.college) p.money += 0
    if (st.id === 'middle' && p.jobId === 'athlete') { log(s, p.id, '운동선수 은퇴! 이직·창업 갈림길에서 새 출발', 'info'); p.jobId = null }
    if (st.id !== 'young') careerRoll(s, p)
    if (st.id === 'old' && p.jobId) log(s, p.id, `${jobOf(p)?.name} 은퇴${jobOf(p)?.pension ? ' (연금 받음)' : ''}`, 'info')
  }
  log(s, null, `${st.name} 단계 시작! (${st.ages[0]}세)`, 'info')
  s.banner = { title: `${st.name} 단계`, text: `${st.ages[0]}세가 되었어요`, tone: 'info' }
  s.current = 0
  beginTurn(s)
}

export { aiAfterRoll as _aiAfterRoll }
