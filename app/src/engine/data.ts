import type { JobDef, Personality, PointKind, Sector, StageId, StopEvent, TileKind } from './types'

export const SECTORS: Sector[] = ['생명', 'IT', '화학', '의료', '엔터']

export const FORTUNES = ['최악', '악', '평타', '길', '대길', '대대길'] as const
export const FORTUNE_WEIGHTS = [6, 16, 40, 24, 11, 3]

export const STAT_NAMES = { int: '지력', str: '체력', cha: '매력' } as const

export const PERSONALITIES: Record<Personality, string> = {
  investor: '재테크형',
  elite: '엘리트형',
  family: '가족형',
  gambler: '도박꾼형',
  safe: '안전형',
}

export const PLAYER_COLORS = ['#1B4DDB', '#E08A00', '#0E9F6E', '#B02E8C']
export const AI_NAMES = ['민트', '보리', '자두', '호두', '살구', '앵두']

interface StageDef {
  id: StageId
  name: string
  ages: [number, number]
  rolls: number | null
  length: number
  weights: [TileKind, number][]
  stops: Record<number, StopEvent>
  points: Record<number, PointKind>
  maps: number[]
}

// 단계별 주사위 횟수·칸 수는 docs/01-structure.md 초안
export const STAGE_DEFS: StageDef[] = [
  {
    id: 'child', name: '어린이', ages: [1, 7], rolls: 4, length: 20,
    weights: [['grow', 35], ['happy', 30], ['money', 10], ['card', 15], ['risk', 10]],
    stops: { 7: 'academy' }, points: {}, maps: [13],
  },
  {
    id: 'student', name: '학생', ages: [8, 19], rolls: 8, length: 40,
    weights: [['grow', 30], ['card', 25], ['happy', 15], ['money', 15], ['risk', 15]],
    stops: { 9: 'club', 24: 'college' }, points: {}, maps: [17],
  },
  {
    id: 'young', name: '청년', ages: [20, 39], rolls: 10, length: 50,
    weights: [['money', 25], ['card', 20], ['date', 22], ['risk', 15], ['happy', 10], ['grow', 8]],
    stops: { 1: 'job', 20: 'jobfair' }, points: { 7: 'shop', 13: 'marriage', 24: 'shop', 29: 'marriage' }, maps: [16],
  },
  {
    id: 'middle', name: '중년', ages: [40, 59], rolls: 8, length: 40,
    weights: [['money', 25], ['risk', 25], ['happy', 20], ['card', 20], ['grow', 10]],
    stops: { 5: 'middleBranch', 19: 'careerChange' }, points: { 11: 'marriage', 15: 'shop' }, maps: [24],
  },
  {
    id: 'old', name: '노년', ages: [60, 80], rolls: null, length: 22,
    weights: [['card', 35], ['happy', 30], ['money', 15], ['risk', 20]],
    stops: { 2: 'retire' }, points: {}, maps: [11],
  },
]

// 돈 단위: 만 원. 단계마다 칸 효과 크기
export const STAGE_SCALE: Record<StageId, number> = { child: 2, student: 5, young: 60, middle: 90, old: 70 }

export const JOBS: JobDef[] = [
  { id: 'office', name: '회사원', boom: false, req: { int: 2 }, college: false, salary: 160, ranks: ['신입', '부장', '임원'], key: 'int', note: '무난함' },
  { id: 'civil', name: '공무원', boom: false, req: { int: 3 }, college: false, salary: 120, ranks: ['주무관', '과장', '국장'], key: 'int', pension: true, note: '연금, 해고 위기에 강함' },
  { id: 'teacher', name: '교사', boom: false, req: { int: 3, cha: 2 }, college: true, salary: 160, ranks: ['일반 교사', '학년 부장', '교장'], key: 'cha', pension: true, note: '연금, 방학 행복' },
  { id: 'dev', name: '개발자', boom: false, req: { int: 4 }, college: false, salary: 200, ranks: ['주니어', '시니어', 'CTO'], key: 'int', sector: 'IT', note: '승진 빠름' },
  { id: 'police', name: '경찰', boom: false, req: { str: 4, int: 2 }, college: false, salary: 160, ranks: ['순경', '형사', '경찰서장'], key: 'str', pension: true, note: '연금, 행복' },
  { id: 'fire', name: '소방관', boom: false, req: { str: 4, int: 2 }, college: false, salary: 160, ranks: ['대원', '팀장', '소방서장'], key: 'str', pension: true, note: '연금, 행복' },
  { id: 'chef', name: '요리사', boom: false, req: { str: 2, cha: 2 }, college: false, salary: 160, ranks: ['보조', '셰프', '오너 셰프'], key: 'cha', note: '창업 성공률 크게↑' },
  { id: 'scientist', name: '과학자', boom: false, req: { int: 5 }, college: true, salary: 240, ranks: ['연구원', '책임연구원', '연구소장'], key: 'int', sector: '화학', note: '연구 성과 → 분야 주가↑' },
  { id: 'lawyer', name: '변호사', boom: false, req: { int: 5, cha: 3 }, college: true, salary: 300, ranks: ['변호사', '파트너', '대표 변호사'], key: 'int', note: '높은 등급 배우자↑' },
  { id: 'doctor', name: '의사', boom: false, req: { int: 6, str: 3 }, college: true, salary: 360, ranks: ['레지던트', '전문의', '병원장'], key: 'int', sector: '의료', note: '병원비 위기↓, 높은 등급 배우자↑' },
  { id: 'athlete', name: '운동선수', boom: true, req: { str: 6 }, college: false, salary: 260, ranks: ['2군', '주전', '국가대표'], key: 'str', note: '중년에 은퇴' },
  { id: 'idol', name: '아이돌·배우', boom: true, req: { cha: 6 }, college: false, salary: 280, ranks: ['연습생', '신인', '톱스타'], key: 'cha', sector: '엔터', note: '대박 아니면 쪽박' },
  { id: 'youtuber', name: '유튜버', boom: true, req: { cha: 3 }, college: false, salary: 180, ranks: ['구독자 1만', '10만', '100만'], key: 'cha', sector: '엔터', note: '떡상·떡락' },
  { id: 'ceo', name: '사업가', boom: true, req: {}, college: false, salary: 300, ranks: ['소기업', '중소기업', '중견기업'], key: 'int', note: '중년 창업으로만' },
]

export const PRESTIGE_JOBS = ['lawyer', 'doctor', 'athlete']

export const TAX_RATE = (salary: number) => (salary >= 300 ? 0.15 : salary >= 200 ? 0.1 : 0.06)

export const HOUSES = [
  { name: '없음', price: 0, happy: 0 },
  { name: '원룸', price: 2500, happy: 4 },
  { name: '아파트', price: 7000, happy: 10 },
  { name: '단독주택', price: 14000, happy: 18 },
]

export const CARS = [
  { name: '없음', price: 0, upkeep: 0, charges: [0, 0, 0] },
  { name: '스쿠터', price: 300, upkeep: 3, charges: [1, 2, 3] },
  { name: '일반차', price: 1800, upkeep: 12, charges: [2, 3, 4] },
  { name: '고급차', price: 6000, upkeep: 30, charges: [3, 4, 5] },
]

export const INSURANCE = {
  health: { name: '건강보험', premium: 8 },
  property: { name: '재산보험', premium: 10 },
  car: { name: '자동차보험', premium: 8 },
} as const

export const CHANCE_NAMES = { reroll: '다시 굴리기', block: '방해 막기', charm: '행운 부적', coupon: '할인 쿠폰', shortcut: '지름길' } as const
export const SABOTAGE_NAMES = { rumor: '소문 퍼뜨리기', stockRumor: '주가 루머', love: '연애 방해' } as const

export const LOTTERY_PRICE = 10

export const SPOUSE_NAMES = ['서윤', '지호', '하린', '도윤', '수아', '시우', '예린', '건우', '다은', '현우', '유나', '준서']

export const TRAITS: { name: string; good: boolean }[] = [
  { name: '대운', good: true },
  { name: '짠돌이', good: true },
  { name: '요리왕', good: true },
  { name: '재테크 고수', good: true },
  { name: '육아 천재', good: true },
  { name: '운동 마니아', good: true },
  { name: '인맥왕', good: true },
  { name: '도박증', good: false },
  { name: '명품 중독', good: false },
  { name: '까칠함', good: false },
  { name: '게으름', good: false },
  { name: '술고래', good: false },
  { name: '바람기', good: false },
]
