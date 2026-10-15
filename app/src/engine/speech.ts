import type { Personality } from './types'

// AI 말풍선 대사. 성격마다 말투가 다름. 문구는 콘텐츠 단계에서 더 늘린다
export type SpeechKey =
  | 'lotteryBuy' | 'lotteryWin' | 'insurancePaid' | 'sabotaged' | 'sabotageUse' | 'married' | 'divorce'
  | 'promoted' | 'bigLoss' | 'greatFortune' | 'casinoWin' | 'casinoLose' | 'duelWin' | 'duelLose' | 'debut'
  | 'startup' | 'baby' | 'lawsuitWin' | 'lawsuitLose'

const COMMON: Record<SpeechKey, string[]> = {
  lotteryBuy: ['이번엔 느낌이 와', '한 장만 사 볼까'],
  lotteryWin: ['대박! 진짜 됐어!', '오늘 저녁은 내가 쏜다'],
  insurancePaid: ['보험 들어 두길 잘했다', '휴, 보험 덕분에 살았네'],
  sabotaged: ['누구야, 기억해 두겠어…', '이건 좀 너무하잖아'],
  sabotageUse: ['미안, 이것도 게임이야', '잠깐만 쉬어 가'],
  married: ['우리 행복하게 살자', '드디어 결혼이다!'],
  divorce: ['…혼자서도 잘 살 거야', '이렇게 끝나는구나'],
  promoted: ['승진이다!', '노력은 배신하지 않아'],
  bigLoss: ['아이고, 이게 무슨 일이야', '오늘 운이 없네'],
  greatFortune: ['오늘은 뭘 해도 될 것 같아', '대대길! 기분 좋다'],
  casinoWin: ['역시 오늘은 내 날이야', '한 판 더?'],
  casinoLose: ['딱 한 판만 더 하면 되는데…', '여기서 멈춰야 해'],
  duelWin: ['내가 이겼다!', '한 수 배웠지?'],
  duelLose: ['다음엔 안 져', '아깝다…'],
  debut: ['무대 위가 내 자리야', '데뷔다!'],
  startup: ['내 회사를 차렸다', '사장님이라고 불러 줘'],
  baby: ['아기가 태어났어!', '세상에서 제일 예쁘다'],
  lawsuitWin: ['정의는 살아 있다', '법대로 했을 뿐이야'],
  lawsuitLose: ['변호사를 바꿔야 하나…', '억울하다'],
}

const BY_PERSONALITY: Partial<Record<Personality, Partial<Record<SpeechKey, string[]>>>> = {
  gambler: { lotteryBuy: ['이번엔 진짜 느낌 왔다', '인생은 한 방이지'], casinoLose: ['원금만 찾고 갈게…'], bigLoss: ['이 정도는 다음 판에 찾으면 돼'] },
  safe: { insurancePaid: ['거봐, 들어 두길 잘했지', '이래서 보험이 필요한 거야'], lotteryBuy: ['딱 한 장만, 진짜 한 장만'] },
  investor: { lotteryWin: ['수익률 계산해 보자'], promoted: ['연봉 협상 들어갑니다'], startup: ['투자 유치부터 해야지'] },
  family: { married: ['우리 가족 행복하자'], baby: ['우리 아기 최고!'], sabotaged: ['우리 가족한테 왜 그래…'] },
  elite: { promoted: ['당연한 결과지'], duelWin: ['예상대로야'], duelLose: ['…이번만 봐준 거야'] },
}

export function speechLine(personality: Personality, key: SpeechKey, r: number): string {
  const list = BY_PERSONALITY[personality]?.[key] ?? COMMON[key]
  return list[Math.floor(r * list.length)]
}
