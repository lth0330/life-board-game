import type { Outfit } from './outfit'

export type StageId = 'child' | 'student' | 'young' | 'middle' | 'old'
export type StatKey = 'int' | 'str' | 'cha'
export type TileKind = 'money' | 'grow' | 'happy' | 'risk' | 'card' | 'stop' | 'date' | 'mini' | 'rest' | 'goal' | 'campus' | 'uni'
export type UniEvent = 'study' | 'club' | 'love' | 'parttime' | 'exam' | 'party' | 'scholar'
export type StopEvent = 'club' | 'job' | 'jobfair' | 'middleBranch'
// 갈라지는 길의 테마 (칸 효과가 그 길답게 바뀜)
export type RoadId = 'main' | 'academy' | 'play' | 'college' | 'work' | 'startup' | 'company' | 'city' | 'country' | 'event' | 'campus'
export type ForkId = 'academy' | 'college' | 'startup' | 'retire' | 'event'
export type MiniId =
  | 'race' | 'tug' | 'throw'
  | 'memory' | 'pairs' | 'quickmath'
  | 'firstImpression' | 'rhythm' | 'confess'
  | 'oddEven' | 'highLow' | 'slot'
  | 'capital' | 'souvenir' | 'photo'
export type DuelId = 'dice' | 'rps' | 'timing'
export type DiceItem = 'twin' | 'even' | 'odd'

// 자녀 한 명. 태어난(입양한) 뒤 20살이 되면 '어떻게 자랐나' 판정
export interface Kid {
  adopted: boolean
  bornAge: number // 부모 나이 기준으로 아이가 0살이던 때 (입양은 부모 나이 - 아이 나이)
  edu: 0 | 1 | 2 | null // 교육 투자: 안 함 / 보통 / 많이 (중년 시작 때나 입양할 때 고름)
  result: 0 | 1 | 2 | null // 성인이 된 뒤: 잘 안 풀림 / 보통 / 크게 성공
}
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
  uni?: UniEvent // 대학 길 칸의 사건
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
  kind?: '일반' | '학자금' | '창업' | '주담대'
  installment?: number // 주택담보대출: 매 턴 자동으로 갚는 돈
  missed?: number // 주택담보대출: 연체 횟수 (3번이면 경매)
}

export interface FriendLoan {
  lenderId: number
  borrowerId: number
  principal: number
  owe: number // 갚아야 할 돈 (원금 + 이자)
  dueTurn: number // 빌린 사람의 차례 수 기준
  nag?: number // 기한이 지난 뒤 남은 독촉 턴 (0이 되면 소송)
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
  record: { shopBuys: number; spent: number; lotteryWon: number; deeds: number; duelWins: number } // 결산 상 계산용
  celebrated: number[] // 이미 치른 육순(60)·칠순(70)
  jobTenure: number // 지금 직업에서 일한 턴 (퇴직금 계산)
  biz: { name: string; stat: StatKey; sector: Sector | null } | null // 창업한 회사 (회사 크기는 jobRank)
  bizKeep: boolean | null // 노년에 회사를 계속 경영하는지 (null = 아직 안 정함)
  medals: number[] // 운동선수 메달 (0 금, 1 은, 2 동). 메달마다 매 턴 연금
  exAthlete: number | null // 중년에 은퇴한 운동선수의 마지막 등급 (창업/감독 고르기 전까지)
  stockCost: Record<Sector, number> // 종목별 산 돈 합계 (평균 산 가격 = 이것 ÷ 가진 수)
  carValue: number // 차의 지금 가치 (산 값에서 사고마다 깎임, 최종 자산에 들어감)
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
  kids: Kid[]
  diceItems: DiceItem[] // 상점에서 산 주사위 아이템 (1회용, 최대 2개)
  pet: { alive: boolean; turnsLeft: number } | null
  retire: 'city' | 'country' | null
  chance: ChanceCard | null
  sabotage: SabotageCard | null
  fortuneMod: number // 다음 운세 뽑기 보정 (대결 승패)
  agency: { vip: boolean; attr: 'looks' | 'wealth' | 'fame' | 'kindness' | null } | null
  borrowedFrom: number[] // 이미 돈을 빌린 상대 (상대마다 1번)
  forkChoice: number | null // 갈림길에서 고른 다음 칸
  outfit: Outfit
  sector: Sector | null // 과학자·사업가가 고른 분야
  major?: StatKey | null // 대학 종류: int 일반대 · str 체대 · cha 예대·방송대
  retake?: StatKey | null // 재수하는 대학 (청년 첫 차례에 다시 봄)
  retook?: boolean // 재수는 1번만
  collegeDecided: boolean // 대학/취업을 정했는지 (학생 마지막 차례, 성인부터 판은 첫 차례)
  campusTurns: number // 대학교에서 남은 차례 (주사위 대신 능력치 +1)
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
  path: number[] // 이번 이동에서 지나간 칸 (화면에서 한 칸씩 걷는 연출용)
  pathId: number
  pathPlayer: number
  dice: { value: number; id: number; second?: number } | null // 마지막으로 굴린 주사위 (연출용)
  lastRoll: number | null
  log: LogEntry[]
  logCount: number // 지금까지 남긴 기록 수 (팝업에 이번 칸 기록만 모으려고)
  popup: { id: number; art: string; title: string; text: string; tone: 'good' | 'bad' | 'info'; playerId: number } | null // 칸 사건 팝업
  stockPrev: Record<Sector, number>
  summary?: string | null // 중간 정산을 보여 줄 단계 이름 (청년·중년이 끝날 때) // 지난 바퀴 주가 (오르내림 표시)
  stockPrice: Record<Sector, number>
  housePrice: number // 집 시세 (처음 100 = 상점 기본값 그대로)
  nextNews: { sector: Sector; up: boolean; size: number } | null
  finishCount: number
  friendLoans: FriendLoan[]
  mini: MiniState | null
  meetCheck: boolean
  speech: { playerId: number; text: string; turn: number } | null
  banner: { title: string; text: string; tone: 'good' | 'bad' | 'info' } | null
}
