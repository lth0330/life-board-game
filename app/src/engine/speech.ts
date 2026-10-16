import type { Personality } from './types'

// AI 말풍선 대사. 공통 4개씩, 성격별 대사가 있으면 그것이 대신 나옴 (2026-10-16 콘텐츠 단계에서 늘림)
export type SpeechKey =
  | 'lotteryBuy' | 'lotteryWin' | 'insurancePaid' | 'sabotaged' | 'sabotageUse' | 'married' | 'divorce'
  | 'promoted' | 'bigLoss' | 'greatFortune' | 'casinoWin' | 'casinoLose' | 'duelWin' | 'duelLose' | 'debut'
  | 'startup' | 'baby' | 'lawsuitWin' | 'lawsuitLose'
  | 'uniPass' | 'uniFail' | 'confessFail' | 'house' | 'retire' | 'goal'

const COMMON: Record<SpeechKey, string[]> = {
  lotteryBuy: ['이번엔 느낌이 와', '한 장만 사 볼까', '꿈에 돼지가 나왔어', '번호는 생일로'],
  lotteryWin: ['대박! 진짜 됐어!', '오늘 저녁은 내가 쏜다', '손이 떨려서 못 보겠어', '이거 꿈 아니지?'],
  insurancePaid: ['보험 들어 두길 잘했다', '휴, 보험 덕분에 살았네', '보험료 아깝다던 말 취소', '서류 떼느라 고생은 했다'],
  sabotaged: ['누구야, 기억해 두겠어…', '이건 좀 너무하잖아', '뒤끝 있는 거 알지?', '웃고 있지만 화났어'],
  sabotageUse: ['미안, 이것도 게임이야', '잠깐만 쉬어 가', '너무 앞서가길래', '원망은 주사위한테'],
  married: ['우리 행복하게 살자', '드디어 결혼이다!', '부케는 누가 받았어?', '신혼여행은 어디로 가지'],
  divorce: ['…혼자서도 잘 살 거야', '이렇게 끝나는구나', '짐 싸는 게 제일 힘들다', '다시 혼자 밥 먹기'],
  promoted: ['승진이다!', '노력은 배신하지 않아', '명함 새로 파야겠다', '오늘은 칼퇴한다'],
  bigLoss: ['아이고, 이게 무슨 일이야', '오늘 운이 없네', '통장이 울고 있다', '라면 먹고 버티자'],
  greatFortune: ['오늘은 뭘 해도 될 것 같아', '대대길! 기분 좋다', '하늘이 내 편이야', '발걸음이 가볍다'],
  casinoWin: ['역시 오늘은 내 날이야', '한 판 더?', '칩 세는 소리가 좋다', '딜러님 감사합니다'],
  casinoLose: ['딱 한 판만 더 하면 되는데…', '여기서 멈춰야 해', '집에 갈 차비는 남겼다', '카지노는 원래 이래'],
  duelWin: ['내가 이겼다!', '한 수 배웠지?', '몸이 기억하더라', '다음에도 덤벼'],
  duelLose: ['다음엔 안 져', '아깝다…', '손이 미끄러졌어', '오늘은 봐준다'],
  debut: ['무대 위가 내 자리야', '데뷔다!', '조명이 뜨겁네', '사인 연습 해 둘걸'],
  startup: ['내 회사를 차렸다', '사장님이라고 불러 줘', '간판 달았다!', '이제 월급 주는 쪽이다'],
  baby: ['아기가 태어났어!', '세상에서 제일 예쁘다', '손가락이 이렇게 작아', '잠은 다 잤다'],
  lawsuitWin: ['정의는 살아 있다', '법대로 했을 뿐이야', '판사님 감사합니다', '변호사비가 안 아깝네'],
  lawsuitLose: ['변호사를 바꿔야 하나…', '억울하다', '항소하고 싶다', '법은 멀고 빚은 가깝다'],
  uniPass: ['합격이다!', '엄마한테 전화해야지', '캠퍼스 낭만 가 보자', '학자금은… 나중에 생각하자'],
  uniFail: ['내년엔 꼭', '붙은 친구들 축하해', '문이 좁았을 뿐이야', '다른 길도 길이다'],
  confessFail: ['…괜찮아, 괜찮아', '친구로 지내자는 말', '오늘 노래방 갈 사람', '거울아, 내가 별로니?'],
  house: ['드디어 내 집!', '벽에 못 박아도 된다', '집들이 날짜 잡자', '대출은 이제 시작'],
  retire: ['수고했다, 나', '내일 알람은 끈다', '이제 뭐 하고 놀지', '마지막 출근 끝'],
  goal: ['인생 참 길었다', '이 정도면 잘 살았지', '다들 고생했어', '한 판 더 살아 볼까'],
}

const BY_PERSONALITY: Partial<Record<Personality, Partial<Record<SpeechKey, string[]>>>> = {
  gambler: {
    lotteryBuy: ['이번엔 진짜 느낌 왔다', '인생은 한 방이지'], lotteryWin: ['봐, 내 말이 맞지'], casinoWin: ['오늘 판 다 쓸어 간다'],
    casinoLose: ['원금만 찾고 갈게…'], bigLoss: ['이 정도는 다음 판에 찾으면 돼'], greatFortune: ['오늘 같은 날은 걸어야 해'], goal: ['마지막까지 재밌었다'],
  },
  safe: {
    insurancePaid: ['거봐, 들어 두길 잘했지', '이래서 보험이 필요한 거야'], lotteryBuy: ['딱 한 장만, 진짜 한 장만'], bigLoss: ['비상금 꺼낼 때가 왔군'],
    casinoLose: ['역시 오는 게 아니었어'], house: ['상환표부터 붙여 두자'], retire: ['연금 계산은 끝났다'], greatFortune: ['그래도 조심해야지'],
  },
  investor: {
    lotteryWin: ['수익률 계산해 보자'], promoted: ['연봉 협상 들어갑니다'], startup: ['투자 유치부터 해야지'], bigLoss: ['손절도 투자다'],
    house: ['입지가 다 했다'], married: ['결혼도 장기 투자지'], retire: ['이제 배당으로 산다'],
  },
  family: {
    married: ['우리 가족 행복하자', '엄마가 제일 좋아하겠다'], baby: ['우리 아기 최고!', '이름은 벌써 정했어'], sabotaged: ['우리 가족한테 왜 그래…'],
    house: ['애들 방부터 꾸미자'], confessFail: ['인연은 어딘가 있겠지'], retire: ['이제 손주 봐 줘야지'], goal: ['가족이 있어서 다행이었다'],
  },
  elite: {
    promoted: ['당연한 결과지'], duelWin: ['예상대로야'], duelLose: ['…이번만 봐준 거야'], uniPass: ['수석이 아니라 아쉽네'],
    uniFail: ['이건 뭔가 잘못됐어'], lawsuitWin: ['논리에서 이미 끝났어'], startup: ['시장을 바꿔 보겠어'],
  },
}

export function speechLine(personality: Personality, key: SpeechKey, r: number): string {
  const list = BY_PERSONALITY[personality]?.[key] ?? COMMON[key]
  return list[Math.floor(r * list.length)]
}
