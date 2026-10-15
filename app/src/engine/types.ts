export type StageId = 'child' | 'student' | 'young' | 'middle' | 'old'
export type StatKey = 'int' | 'str' | 'cha'
export type TileKind = 'money' | 'grow' | 'happy' | 'risk' | 'card' | 'stop' | 'date' | 'map' | 'rest' | 'goal'
export type StopEvent = 'academy' | 'club' | 'college' | 'job' | 'jobfair' | 'middleBranch' | 'careerChange' | 'retire'
export type PointKind = 'shop' | 'marriage'
export type Personality = 'investor' | 'elite' | 'family' | 'gambler' | 'safe'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type Sector = '생명' | 'IT' | '화학' | '의료' | '엔터'
export type InsuranceKind = 'health' | 'property' | 'car'
export type ChanceCard = 'reroll' | 'block' | 'charm' | 'coupon' | 'shortcut'
export type SabotageCard = 'rumor' | 'stockRumor' | 'love'
export type CarTier = 0 | 1 | 2 | 3 // 없음, 스쿠터, 일반차, 고급차
export type HouseTier = 0 | 1 | 2 | 3

export interface Tile {
  kind: TileKind
  stop?: StopEvent
  point?: PointKind
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
  phase: 'roll' | 'decision' | 'gameover'
  pending: Pending | null
  move: { remaining: number; from: number } | null
  lastRoll: number | null
  log: LogEntry[]
  stockPrice: Record<Sector, number>
  nextNews: { sector: Sector; up: boolean; size: number } | null
  finishCount: number
  banner: { title: string; text: string; tone: 'good' | 'bad' | 'info' } | null
}
