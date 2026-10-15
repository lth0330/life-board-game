import type { JobDef, Personality, Sector, StageId } from './types'

export const SECTORS: Sector[] = ['생명', 'IT', '화학', '의료', '엔터']

export const FORTUNES = ['대흉', '흉', '평', '길', '대길'] as const // 2026-10-16 5단계로
export const FORTUNE_WEIGHTS = [6, 18, 42, 24, 10]

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
  { id: 'doctor', name: '의사', boom: false, req: { int: 7, str: 3 }, college: true, salary: 360, ranks: ['레지던트', '전문의', '병원장'], key: 'int', sector: '의료', note: '병원비 위기↓, 높은 등급 배우자↑' },
  { id: 'athlete', name: '운동선수', boom: true, req: { str: 5 }, college: false, salary: 260, ranks: ['2군', '주전', '국가대표'], key: 'str', note: '중년에 은퇴' },
  { id: 'idol', name: '아이돌·배우', boom: true, req: { cha: 6 }, college: false, salary: 280, ranks: ['연습생', '신인', '톱스타'], key: 'cha', sector: '엔터', note: '대박 아니면 쪽박' },
  { id: 'youtuber', name: '유튜버', boom: true, req: { cha: 3 }, college: false, salary: 180, ranks: ['구독자 1만', '10만', '100만'], key: 'cha', sector: '엔터', note: '떡상·떡락' },
  { id: 'ceo', name: '사업가', boom: true, req: {}, college: false, salary: 300, ranks: ['소기업', '중소기업', '중견기업'], key: 'int', note: '중년 창업으로만' },
  { id: 'coach', name: '감독', boom: false, req: {}, college: false, salary: 200, ranks: ['코치', '감독', '국가대표 감독'], key: 'str', note: '운동선수 출신만 (은퇴 때 도전)' },
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
  // crash: 매 턴 사고 확률 (노년엔 1.5배). 스쿠터는 잘 나고 몸을 다침, 고급차는 드물지만 수리비가 큼
  { name: '없음', price: 0, upkeep: 0, charges: [0, 0, 0], crash: 0 },
  { name: '스쿠터', price: 300, upkeep: 3, charges: [1, 2, 3], crash: 0.07 },
  { name: '일반차', price: 1500, upkeep: 12, charges: [2, 3, 4], crash: 0.03 },
  { name: '고급차', price: 3000, upkeep: 30, charges: [3, 4, 5], crash: 0.01 },
]

export const INSURANCE = {
  health: { name: '건강보험', premium: 8 },
  property: { name: '재산보험', premium: 10 },
  car: { name: '자동차보험', premium: 8 },
} as const

export const CHANCE_NAMES = { reroll: '다시 굴리기', block: '방해 막기', charm: '행운 부적', coupon: '할인 쿠폰 (집·차 30%, 최대 집 1,000만·차 500만)', shortcut: '지름길' } as const
export const SABOTAGE_NAMES = { rumor: '소문 퍼뜨리기', stockRumor: '주가 루머', love: '연애 방해', lawsuit: '소송 걸기' } as const

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

// 주사위 아이템 (상점, 1회용). 자동차 ±1과 같은 차례에 함께 못 씀
export const DICE_ITEMS = {
  twin: { name: '쌍둥이 주사위', price: 300, desc: '2개 굴려서 합만큼 (2~12칸)' },
  even: { name: '짝수 주사위', price: 100, desc: '2·4·6만 나와요' },
  odd: { name: '홀수 주사위', price: 60, desc: '1·3·5만 나와요' },
} as const
export const MAX_DICE_ITEMS = 2

// 집 (2026-10-15 밸런스)
export const HOUSE_RULES = {
  upkeepRate: 0.002, // 매 턴 관리비·재산세 = 시세의 0.2% (원룸 약 5만, 아파트 14만, 단독주택 28만)
  scoreRate: 1, // 최종 자산에는 시세 그대로 (사용자 결정: 사는 게 조금이라도 이득이게)
  rent: 15, // 집이 없으면 성인부터 매 턴 월세
  downRate: 0.3, // 주택담보대출 계약금 (집값의 30%)
  mortgageTurns: 10, // 주택담보대출 갚는 기간
  mortgageRate: 0.005, // 주택담보대출 이자 (매 턴 0.5%)
  auctionRate: 0.7, // 3번 연체하면 집을 시세의 70%에 경매
  forcedRate: 0.8, // 강제 청산 때 시세의 80%에 팔림
}
// 창업 (2026-10-15 사용자 결정). 숫자는 초안
export const BIZ = {
  cost: 2000, chefCost: 1200,
  base: [300, 700, 1500], // 회사 크기별 매 턴 기본 수익 (소 / 중소 / 중견)
  fortune: [-0.6, -0.2, 0.5, 1, 1.8], // 운세별 배율 (대흉 ~ 대길)
  growPerStat: 0.05, // 운세 평타 이상일 때 커질 확률 = 능력치 × 5%
  fallBase: 0.3, fallPerStat: 0.02, // 악 이하일 때 작아질 확률 = 30% - 능력치 × 2%
  sale: [1000, 4000, 10000], // 노년에 팔 때
  oldMult: 0.7, // 노년에 계속 경영하면 수익 배율
}
// 직업별 창업 업종 (자기 직업에 맞춰서). 백수는 능력치로 고름
export const BUSINESSES: Record<string, { name: string; stat: 'int' | 'str' | 'cha'; sector: Sector | null; maxRank?: number }> = {
  office: { name: '유통 회사', stat: 'int', sector: null },
  civil: { name: '유통 회사', stat: 'int', sector: null },
  teacher: { name: '학원', stat: 'cha', sector: null },
  dev: { name: 'IT 스타트업', stat: 'int', sector: 'IT' },
  police: { name: '경호·안전 회사', stat: 'str', sector: null },
  fire: { name: '경호·안전 회사', stat: 'str', sector: null },
  chef: { name: '식당', stat: 'cha', sector: null },
  scientist: { name: '바이오 연구소', stat: 'int', sector: '생명' },
  lawyer: { name: '법률 사무소', stat: 'int', sector: null },
  doctor: { name: '개인 병원', stat: 'int', sector: '의료' },
  idol: { name: '엔터 기획사', stat: 'cha', sector: '엔터' },
  youtuber: { name: '엔터 기획사', stat: 'cha', sector: '엔터' },
  coach: { name: '스포츠 센터', stat: 'str', sector: null, maxRank: 1 }, // 체인점(중소기업)까지
  athlete: { name: '스포츠 센터', stat: 'str', sector: null, maxRank: 1 }, // 체인점(중소기업)까지
}
// 백수 창업: 카페 하나. 이것저것 다 해야 해서 세 능력치 평균으로 벎. 단계 이름과 수입·판 값이 일반 회사보다 조금 낮음
export const CAFE = {
  name: '카페', stat: 'int' as const, sector: null, avg: true,
  ranks: ['동네 카페', '유명 카페', '인스타 유명 카페'],
  base: [300, 600, 1100], // 일반 회사 300 / 700 / 1,500
  sale: [1000, 3000, 6000], // 일반 회사 1,000 / 4,000 / 1억
}
// 퇴직금 = 그만둘 때 월급 × 그 직업에서 일한 턴 × 0.3. 꾸준형만 (아이돌·유튜버·운동선수·사업가 없음)
export const SEVERANCE_RATE = 0.3
export const PENSION = 180 // 공무원·교사·경찰·소방관: 노년 매 턴
// 운동선수 메달: 국가대표일 때 매 턴 체력 × 2% 확률, 최대 3개. 그때부터 매 턴 메달 연금
export const MEDALS = [{ name: '금', pension: 40 }, { name: '은', pension: 25 }, { name: '동', pension: 15 }]
export const CAR_CRASH_LOSS = 0.15 // 사고 날 때마다 차 가치 -15%
export const CAR_RESALE = 0.8 // 차를 바꿀 때 지금 차는 지금 가치(원가 - 사고 감가)의 80%에 팔림

// 자녀 (숫자는 초안 — 밸런스 단계에서 조정)
export const KIDS = {
  birthGrant: 100, // 출산 지원금
  adoptGrant: 50, // 입양 지원금
  youngCost: 20, // 청년 때 양육비 (매 턴, 1명당)
  eduNames: ['안 함', '보통', '많이'],
  eduCost: [20, 40, 80], // 중년부터 성인이 될 때까지 양육비
  eduBonus: [0, 2, 4], // 성장 판정 보너스
  adoptPenalty: 1, // 입양 자녀는 같은 교육이어도 판정 -1
  bigAt: 14, // 판정 점수가 이 이상이면 크게 성공
  okAt: 10, // 이 이상이면 보통, 밑이면 잘 안 풀림
  resultNames: ['잘 안 풀림', '보통', '크게 성공'],
  allowance: [20, 60, 100], // 성인 자녀가 주는 용돈 (매 턴)
  adoptAllowance: [10, 60, 80],
  resultHappy: [-2, 2, 5],
  eduGood: [0.02, 0.04, 0.06], // 7살 이상 어린 자녀 1명당 매 턴 좋은 사건 확률 (교육 고르기 전은 '안 함'으로)
  birthdayGift: [50, 150, 300], // 육순·칠순 때 어른 자녀 1명이 주는 용돈 (잘 안 풀림 / 보통 / 크게 성공)
  eduTrouble: [0.08, 0.03, 0.02], // 교육을 고른 뒤 어린 자녀 1명당 매 턴 나쁜 사건 확률 (안 함 / 보통 / 많이)
}
