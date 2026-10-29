// 미니게임·단계 끝 대회·같은 칸 만남(대결) (2026-10-29 game.ts에서 나눔)
import { josa } from './josa'
import { STAT_NAMES, JOB_AFFINITY } from './data'
import type { Rng } from './rng'
import type { DuelId, GameState, MiniId, Player, StageId, StatKey, Suitor } from './types'
import {
  choose, clampStat, cur, findSuitor, fortuneName, giveChance, HOUSE_AFFINITY, log, makeSuitor, MOOD_AFFINITY, moodLevel, nextStage,
  randomChance, resume, rngOf, say, scaleOf, showPop, stageOf, stars, STATS, suitorDesc, THEME_GAME, THEME_MINI_CHANCE, won, workJob,
} from './game'

// ───────── 미니게임 (이벤트 길) ─────────

const MINI_STAT: Record<MiniId, StatKey | 'fortune' | null> = {
  race: 'str', tug: 'str', throw: 'str',
  memory: 'int', pairs: 'int', quickmath: 'int',
  firstImpression: 'cha', rhythm: 'cha', confess: 'cha', dance: 'cha',
  oddEven: 'fortune', highLow: 'fortune', slot: 'fortune',
  snap: 'str', pack: 'int', photo: 'int',
  leaves: 'str', snowball: 'str', flower: 'cha', melon: 'str', butterfly: 'str', watergun: 'str',
}
export const MINI_NAMES: Record<MiniId | DuelId, string> = {
  race: '달리기', tug: '줄다리기', throw: '공 던지기',
  memory: '기억력', pairs: '같은 그림 찾기', quickmath: '빠른 계산',
  firstImpression: '첫인상', rhythm: '무대 공연', confess: '고백 타이밍', dance: '댄스 따라 하기',
  oddEven: '홀짝', highLow: '카드 높낮이', slot: '슬롯머신',
  snap: '사진 찍기', pack: '짐 싸기', photo: '여행 코스 기억',
  leaves: '낙엽 잡기', snowball: '눈싸움', flower: '꽃 심기', melon: '수박 깨기', butterfly: '나비 잡기', watergun: '물총 싸움',
  dice: '주사위 대결', rps: '가위바위보', timing: '타이밍 멈추기',
}
export const CASINO: MiniId[] = ['oddEven', 'highLow', 'slot']

// 0 쉬움, 1 보통, 2 어려움 (능력치·운세가 높을수록 쉬움)
export function miniLevel(p: Player, game: MiniId | DuelId): number {
  const key = game in MINI_STAT ? MINI_STAT[game as MiniId] : game === 'timing' ? 'str' : null
  if (key === null) return 1
  const v = key === 'fortune' ? [1, 3, 5, 8, 10][p.fortune] : p.stats[key]
  return v >= 7 ? 0 : v >= 4 ? 1 : 2
}

// 카지노 판돈: 가진 돈의 몇 % (2026-10-21 사용자: 노년의 역전 또는 패망 기회)
const CASINO_PCT = [10, 30, 50]
export const casinoStake = (p: Player, pct: number) => Math.max(0, Math.floor((p.money * pct) / 100))

export const FEST_GAMES: MiniId[] = ['firstImpression', 'rhythm', 'confess', 'dance']
// 축제 거리(청년): 칸마다 누구와 할지 고름. 예전에 만난 사람 또는 새 사람(랜덤). 만난 사람이 없으면 새 사람 (2026-10-21 사용자)
const festPartners = (p: Player) => [...p.suitors].filter((x) => x.affinity < 100).sort((a, b) => b.affinity - a.affinity).slice(0, 4)

export function startMini(s: GameState, p: Player, game: MiniId, target?: string, as?: MiniId) {
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
    s.mini = { game, playerId: p.id, level, stake, target, ...(as ? { as } : {}) }
    return
  }
  // AI: 능력치에 비례한 확률로 결과
  const grade = aiGrade(rngOf(s), level)
  log(s, p.id, `[${MINI_NAMES[game]}] ${['실패', '성공', '대성공'][grade]}`, grade ? 'good' : 'bad')
  miniReward(s, p, as ?? game, grade, stake, target, game)
}

// 사람이 미니게임을 마치면 화면에서 부름. grade: 0 실패, 1 성공, 2 대성공 / 대결 timing이면 점수(0~100)
// who: 단계 끝 대회는 모두 동시에 하므로 누가 끝냈는지 (없으면 playerId)
export function finishMini(s: GameState, value: number, who?: number) {
  const m = s.mini
  if (!m) return
  if (m.contest) {
    const id = who ?? m.playerId
    if (!m.contest.queue.includes(id)) return
    const results = { ...m.contest.results, [id]: m.duel ? Math.max(0, Math.min(100, Math.round(value))) : Math.max(0, Math.min(2, Math.round(value))) }
    const queue = m.contest.queue.filter((x) => x !== id)
    if (queue.length) {
      s.mini = { ...m, playerId: queue[0], level: miniLevel(s.players[queue[0]], m.game), contest: { ...m.contest, results, queue } }
      return
    }
    s.mini = null
    const p = s.players[id]
    const start = s.logCount
    if (m.duel) { // 같은 칸 대결: 모두 끝나면 결과를 보이고 하던 차례를 이어감
      resolveDuel(s, 'timing', m.duel.ids, results)
      showPop(s, p, start, 'medal', '대결 결과')
      resume(s)
      return
    }
    resolveContest(s, m.game as MiniId, results)
    // 결과 창은 모두의 등수를 보여 줌 (showPop은 한 사람 것만 모음). 다음 단계 첫 사건 창보다 먼저 보이게 나중에 넣음
    const lines = s.log.slice(-(s.logCount - start))
    const title = `${contestName(s, m.game)} 결과`
    nextStage(s)
    s.popup = { id: (s.popup?.id ?? 0) + 1, art: 'trophy', title, text: lines.map((l) => (l.playerId === null ? l.text : `${s.players[l.playerId].name}: ${l.text}`)).join('\n'), tone: 'good', playerId: p.id }
    return
  }
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
  else miniReward(s, p, m.as ?? (m.game as MiniId), Math.max(0, Math.min(2, Math.round(value))), m.stake, m.target, m.game as MiniId)
  showPop(s, p, miniStart, 'medal', m.duel ? '대결 결과' : '미니게임 결과')
  resume(s)
}

// 미니게임 주인이 AI가 됐을 때 (온라인에서 하던 사람이 나감) AI 결과로 끝냄
export function aiFinishMini(s: GameState) {
  const m = s.mini
  if (!m) return
  const rng = rngOf(s)
  if (m.contest) { // 대회: 나간 사람 모두 AI 결과로
    for (const id of m.contest.queue) if (!s.players[id].human) finishMini(s, m.duel ? timingScore(rng, s.players[id]) : aiGrade(rng, miniLevel(s.players[id], m.game)), id)
    return
  }
  if (s.players[m.playerId].human) return
  const q = s.players[m.playerId]
  if (m.duel) { finishMini(s, timingScore(rng, q)); return }
  finishMini(s, aiGrade(rng, m.level))
}

// AI 미니게임 등급: 쉬울수록 대성공이 잘 나옴
function aiGrade(rng: Rng, level: number) {
  const great = [0.55, 0.32, 0.15][level] ?? 0.32
  const r = rng.next()
  return r < great ? 2 : r < great + 0.35 ? 1 : 0
}

// ───────── 단계 끝 대회 (2026-10-29 사용자) ─────────
// 어린이·학생·청년·중년이 끝날 때 모두 같은 미니게임. 가장 잘한 등급이 1등, 그다음이 2등 (같은 등급이면 같은 등수, 실패는 상 없음)
const CONTEST_GAMES: Partial<Record<StageId, MiniId[]>> = {
  child: ['race', 'tug', 'throw'], student: ['memory', 'pairs', 'quickmath'], young: ['rhythm', 'dance'], middle: ['snap', 'pack', 'photo'],
}
export const CONTEST_NAMES: Partial<Record<StageId, string>> = { child: '꼬마 운동회', student: '두뇌 대회', young: '청춘 무대', middle: '여행 사진 대회' }
// 대회 이름: 테마 게임이 뽑히면 단계 이름 대신 테마 대회 (두뇌 대회에서 낙엽 잡기를 하면 어색해서)
const THEME_CONTEST: Partial<Record<MiniId, string>> = { leaves: '가을 낙엽 대회', snowball: '겨울 눈싸움 대회', flower: '봄 꽃 심기 대회', melon: '여름 수박 깨기 대회', butterfly: '봄 나비 대회', watergun: '여름 물총 대회' }
export const contestName = (s: GameState, game: string) => THEME_CONTEST[game as MiniId] ?? CONTEST_NAMES[stageOf(s).id] ?? '대회'
// 청년·중년은 돈 (2등은 절반), 어린이·학생은 그 게임 능력치 +1
const CONTEST_PRIZE: Partial<Record<StageId, number>> = { young: 300, middle: 500 }

// 대회 '준비 완료': 사람이 모두 누르면 go (화면에서 3·2·1 뒤 다 같이 시작)
export function contestReady(s: GameState, who: number) {
  const c = s.mini?.contest
  if (!c || c.go || !c.queue.includes(who)) return
  const ready = [...new Set([...(c.ready ?? []), who])]
  c.ready = ready
  if (c.queue.every((i) => ready.includes(i))) c.go = true
}

// 대회를 열면 true (사람이 할 차례가 남음). 사람이 없으면 바로 끝내고 false
export function startContest(s: GameState): boolean {
  const st = stageOf(s)
  const games = CONTEST_GAMES[st.id]
  if (!games) return false
  const rng = rngOf(s)
  const theme = s.settings.theme
  const game = theme && rng.chance(THEME_MINI_CHANCE) ? THEME_GAME[theme] : rng.pick(games) // 테마 맵이면 테마 게임도 가끔
  const results: Record<number, number> = {}
  for (const q of s.players) if (!q.human) results[q.id] = aiGrade(rng, miniLevel(q, game))
  log(s, null, `${st.name} 단계 끝! ${contestName(s, game)}: ${MINI_NAMES[game]}`, 'info')
  // 사람은 모두 동시에 (각자 기기, 한 기기에 여럿이면 차례로). queue = 아직 안 끝낸 사람
  const queue = s.players.filter((q) => q.human).map((q) => q.id)
  if (!queue.length) { resolveContest(s, game, results); return false }
  s.mini = { game, playerId: queue[0], level: miniLevel(s.players[queue[0]], game), contest: { results, queue, seed: rng.int(1, 1e9) } }
  s.phase = 'mini'
  return true
}

function resolveContest(s: GameState, game: MiniId, res: Record<number, number>) {
  const st = stageOf(s)
  const names = ['실패', '성공', '대성공']
  log(s, null, s.players.map((q) => `${q.name} ${names[res[q.id] ?? 0]}`).join(', '), 'info')
  const grades = [...new Set(Object.values(res))].filter((g) => g >= 1).sort((a, b) => b - a).slice(0, 2)
  if (!grades.length) { log(s, null, '아무도 성공하지 못해서 상이 없어요', 'info'); return }
  const prize = CONTEST_PRIZE[st.id]
  const key = MINI_STAT[game]
  grades.forEach((g, rank) => {
    for (const q of s.players) {
      if (res[q.id] !== g) continue
      if (prize) {
        const money = rank === 0 ? prize : prize / 2
        q.money += money
        if (rank === 0) q.happy += 2
        log(s, q.id, `${rank + 1}등! +${won(money)}${rank === 0 ? ', 행복 +2' : ''}`, 'good')
      } else if (rank === 0 && key && key !== 'fortune') {
        q.stats[key] = clampStat(q.stats[key] + 1)
        q.happy += 2
        log(s, q.id, `1등! ${STAT_NAMES[key]} +1, 행복 +2`, 'good')
      } else {
        q.happy += 1
        log(s, q.id, `${rank + 1}등! 행복 +1`, 'good')
      }
      if (rank === 0) say(s, q, 'duelWin')
    }
  })
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
  if (p.spouse) { p.happy += Math.round(amount / 5); log(s, p.id, `${josa(p.spouse.name, '와/과')} 축제를 즐겼다. 행복 +${Math.round(amount / 5)}`, 'good'); return }
  const known = target && target !== 'new' ? findSuitor(p, target) : undefined
  if (known) {
    const add = Math.min(100 - known.affinity, amount)
    known.affinity += add
    log(s, p.id, `축제에서 ${josa(known.name, '와/과')} 더 가까워졌다! 호감도 +${add}% (지금 ${known.affinity}%)`, 'good')
    return
  }
  const x = makeSuitor(s, p, { vip: amount >= 30 })
  x.affinity = amount + 10 // 축제에서 만나면 첫인상이 좋아 조금 높게 시작
  p.suitors.push(x)
  log(s, p.id, `축제에서 ${x.name}${stars(x.grade)}를 만났다! 호감도 ${x.affinity}% (데이트 칸에서 호감도를 올려요)`, 'good')
}


// 미니게임 설명서에 보여 줄 '무엇이 쉽게 해 주나'와 보상 (miniReward와 같은 내용)
export function miniGuide(s: GameState, game: MiniId | DuelId, duel: boolean, contest = false): { stat: string; reward: string } {
  if (contest) {
    const k = MINI_STAT[game as MiniId]
    const prize = CONTEST_PRIZE[stageOf(s).id]
    const stat = k && k !== 'fortune' ? `모두 같은 게임을 해요 · ${STAT_NAMES[k]}이 높을수록 쉬워요` : '모두 같은 게임을 해요'
    const reward = prize ? `1등 ${won(prize)}·행복 +2 / 2등 ${won(prize / 2)} / 실패는 상 없음` : `1등 ${k && k !== 'fortune' ? STAT_NAMES[k] : '능력치'} +1·행복 +2 / 2등 행복 +1 / 실패는 상 없음`
    return { stat, reward }
  }
  if (duel) return { stat: '같은 칸에 선 사람끼리 점수로 겨뤄요', reward: `1등이 꼴찌에게서 ${won(DUEL_STAKE[stageOf(s).id] ?? scaleOf(s))}을 받아요` }
  const shown = game
  if (s.mini?.game === game && s.mini.as) game = s.mini.as // 테마 게임: 보상은 원래 칸 게임대로
  const k = MINI_STAT[shown as MiniId]
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

// game: 보상 종류(칸의 게임), played: 실제로 한 게임 (테마 게임이면 다름)
function miniReward(s: GameState, p: Player, game: MiniId, grade: number, stake?: number, target?: string, played: MiniId = game) {
  const name = MINI_NAMES[played]
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
    good: [['옛날이야기로 웃었다 (행복 +3)', (p) => { p.happy += 3 }], ['같이 산책했다 (행복 +2)', (p) => { p.happy += 2 }]], // 노년은 능력치 그대로 (2026-10-17 사용자)
    bad: [['옛날 빚 이야기가 나왔다 (돈 -50만)', (p) => { p.money -= 50 }], ['말다툼을 했다 (행복 -2)', (p) => { p.happy -= 2 }]],
  },
}

export function meet(s: GameState) {
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
    // 직접 하는 사람: 온라인은 대결에 낀 사람 모두(각자 기기에서 동시에), 혼자 하기는 지금 차례인 사람만
    const players = (s.settings.online ? all.filter((q) => q.human) : p.human ? [p] : []).map((q) => q.id)
    if (game === 'rps') {
      if (players.length) rpsPending(s, ids, {}, players)
      else resolveRps(s, ids, {})
    } else if (game === 'timing') {
      const res: Record<number, number> = {}
      for (const q of all) if (!players.includes(q.id)) res[q.id] = timingScore(rng, q)
      // 직접 하는 사람은 모두 동시에 (준비 완료 → 3·2·1), 다른 사람 장면도 보임 (2026-10-29 사용자)
      if (players.length) s.mini = { game: 'timing', playerId: players[0], level: miniLevel(s.players[players[0]], 'timing'), duel: { ids, results: {} }, contest: { results: res, queue: players, seed: rng.int(1, 1e9) } }
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

// 가위바위보: 직접 하는 사람은 모두 동시에 고름 (2026-10-29 사용자: 타이밍 대결처럼). 다 고르면 한꺼번에 공개
// queue: 아직 안 고른 사람 전부, picks: 고른 손, humans: 직접 고르는 사람 전부 (비기면 처음부터 다시). again: 비겨서 다시
export function rpsPending(s: GameState, ids: number[], picks: Record<number, number>, queue: number[], humans = queue, again = false) {
  if (!again && (!s.rpsShow || s.rpsShow.picks)) s.rpsShow = { id: (s.rpsShow?.id ?? 0) + 1, ids, picks: null }
  s.pending = {
    type: 'rps', playerId: queue[0], title: again ? '비겼어요! 한 번 더' : '가위바위보!', text: `${ids.map((i) => s.players[i].name).join(', ')} 한 판. 진 사람은 능력치 -1`,
    options: [{ id: '0', label: '가위' }, { id: '1', label: '바위' }, { id: '2', label: '보' }], data: { ids, picks, queue, humans, sim: true },
  }
}
// 동시에 하는 가위바위보에서 한 사람이 고름 (온라인은 각자 기기에서). 이미 골랐거나 고를 사람이 아니면 무시
export function rpsPick(s: GameState, who: number, pick: number) {
  const pd = s.pending
  const d = pd?.data as { sim?: boolean; queue?: number[] } | undefined
  if (!pd || pd.type !== 'rps' || !d?.sim || !d.queue?.includes(who) || ![0, 1, 2].includes(pick)) return
  pd.playerId = who
  choose(s, String(pick))
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
export function resolveRps(s: GameState, ids: number[], picks: Record<number, number>, humans: number[] = []) {
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
