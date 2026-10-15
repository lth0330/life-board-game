export type StageId = 'child' | 'student' | 'young' | 'middle' | 'old'
export type StatKey = 'int' | 'str' | 'cha'
export type TileKind = 'money' | 'grow' | 'happy' | 'risk' | 'card' | 'stop' | 'date' | 'mini' | 'rest' | 'goal'
export type StopEvent = 'club' | 'job' | 'jobfair' | 'middleBranch'
// 갈라지는 길의 테마 (칸 효과가 그 길답게 바뀜)
export type RoadId = 'main' | 'academy' | 'play' | 'college' | 'work' | 'startup' | 'company' | 'city' | 'country' | 'event'
export type ForkId = 'academy' | 'college' | 'startup' | 'retire' | 'event'
export type MiniId =
  | 'race' | 'tug' | 'throw'
  | 'memory' | 'pairs' | 'quickmath'
  | 'firstImpression' | 'rhythm' | 'confess'
  | 'oddEven' | 'highLow' | 'slot'
  | 'capital' | 'souvenir' | 'photo'
export type DuelId = 'dice' | 'rps' | 'timing'
export type PointKind = 'shop' | 'marriage'
export type Personality = 'investor' | 'elite' | 'family' | 'gambler' | 'safe'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type Sector = '생명' | 'IT' | '화학' | '의료' | '엔터'
export type InsuranceKind = 'health' | 'property' | 'car'
export type ChanceCard = 'reroll' | 'block' | 'charm' | 'coupon' | 'shortcut'
export type SabotageCard = 'rumor' | 'stockRumor' | 'love' | 'lawsuit'
export type CarTier = 0 | 1 | 2 | 3 // 없음, 스쿠터, 일반차, 고급차
export type HouseTier = 0 | 1 | 2 | 3

export interface ForkOption {
  label: string
  desc: string
  to: number
  road: RoadId
}

export interface Tile {
  kind: TileKind
  stop?: StopEvent
  point?: PointKind
  next: number[] // 다음 칸 번호들 (2개 이상이면 갈림길)
  d: number // 단계 시작부터의 깊이 (화면 배치·나이 계산)
  lane: number // -1 왼쪽, 0 본 길, 1 오른쪽
  road: RoadId
  fork?: { id: ForkId; title: string; text: string; options: ForkOption[] }
  mini?: MiniId
}

export interface Stage {
  id: StageId
  name: string
  ages: [number, number]
  rolls: number | null // null = 골까지 경주
  tiles: Tile[]
}

export interface JobDef {
  id: string
  name: string
  boom: boolean
  req: Partial<Record<StatKey, number>>
  college: boolean
  salary: number // 턴당 만원 (꾸준형 1단계 기준, 대박형은 2단계 기준)
  ranks: [string, string, string]
  key: StatKey
  sector?: Sector
  pension?: boolean
  note: string
}

export interface Spouse {
  name: string
  grade: number // 1~5
  looks: number
  wealth: number
  fame: number
  kindness: number
  sector: Sector
  trait: string
  traitGood: boolean
  revealed: boolean
}

export interface Suitor extends Spouse {
  affinity: number // 0~100
}

export interface Loan {
  amount: number
  dueTurn: number
}

export interface FriendLoan {
  lenderId: number
  borrowerId: number
  principal: number
  owe: number // 갚아야 할 돈 (원금 + 이자)
  dueTurn: number // 빌린 사람의 차례 수 기준
}

export interface MiniState {
  game: MiniId | DuelId
  playerId: number // 지금 미니게임을 하는 사람
  level: number // 0 쉬움 ~ 2 어려움 (능력치가 높을수록 쉬움)
  stake?: number // 카지노 판돈
  duel?: { ids: number[]; results: Record<number, number> }
}

export interface Player {
  id: number
  name: string
  human: boolean
  personality: Personality
  color: string
  money: number
  happy: number
  stats: Record<StatKey, number>
  fortune: number // 0 최악 ~ 5 대대길
  charmTurns: number
  goodDeeds: number
  jobId: string | null
  jobRank: number // 0~2
  jobTurns: number
  college: boolean
  pos: number
  rollsLeft: number
  finished: boolean
  finishOrder: number
  turnsPlayed: number
  insurance: Record<InsuranceKind, boolean>
  insuranceCooldown: Record<InsuranceKind, number>
  car: CarTier
  carCharges: number
  house: HouseTier
  loans: Loan[]
  creditBad: number
  lottery: { ticket: boolean; chance: number; addicted: boolean }
  stocks: Record<Sector, number>
  suitors: Suitor[]
  spouse: Spouse | null
  divorced: boolean
  children: number
  adopted: number
  pet: { alive: boolean; turnsLeft: number } | null
  retire: 'city' | 'country' | null
  chance: ChanceCard | null
  sabotage: SabotageCard | null
  fortuneMod: number // 다음 운세 뽑기 보정 (대결 승패)
  agency: { vip: boolean; attr: 'looks' | 'wealth' | 'fame' | 'kindness' | null } | null
  borrowedFrom: number[] // 이미 돈을 빌린 상대 (상대마다 1번)
  forkChoice: number | null // 갈림길에서 고른 다음 칸
}

export interface ChoiceOption {
  id: string
  label: string
  desc?: string
  disabled?: boolean
}

export interface Pending {
  type: string
  playerId: number
  title: string
  text: string
  options: ChoiceOption[]
  data?: Record<string, unknown>
}

export interface LogEntry {
  turn: number
  playerId: number | null
  text: string
  tone: 'good' | 'bad' | 'info'
}

export interface Settings {
  startAdult: boolean
  difficulty: Difficulty
}

export interface GameState {
  seed: number
  settings: Settings
  stageIdx: number
  stages: Stage[]
  players: Player[]
  current: number
  turn: number
  round: number
  phase: 'roll' | 'decision' | 'mini' | 'gameover'
  pending: Pending | null
  move: { remaining: number; from: number } | null
  lastRoll: number | null
  log: LogEntry[]
  stockPrice: Record<Sector, number>
  nextNews: { sector: Sector; up: boolean; size: number } | null
  finishCount: number
  friendLoans: FriendLoan[]
  mini: MiniState | null
  meetCheck: boolean
  speech: { playerId: number; text: string; turn: number } | null
  banner: { title: string; text: string; tone: 'good' | 'bad' | 'info' } | null
}
