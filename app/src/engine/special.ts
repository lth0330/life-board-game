// 특별 이벤트 (2026-10-17 사용자): '좋은 일' 칸의 성장 몫 절반을 고르는 사건으로.
// 능력치는 공짜로 오르지 않고 돈·행복·운(판정)과 바꿈. 돈 100만 = 행복 1 = 점수 1 (SCORE_PER_POINT)
import { SCORE_PER_POINT } from './data'
import type { MapTheme, StageId, StatKey } from './types'

export interface SpecialOption {
  id: string
  label: string
  cost?: number // 돈 (그 단계 돈 단위의 몇 배)
  gain?: number // 버는 돈 (돈 단위의 몇 배)
  stats?: Partial<Record<StatKey, number>>
  happy?: number
  // 판정: 능력치 + 주사위(1~6) >= need 이면 win, 아니면 lose
  check?: { stat: StatKey; need: number; win: { stats?: Partial<Record<StatKey, number>>; happy?: number }; lose: { stats?: Partial<Record<StatKey, number>>; happy?: number } }
  // 확률로 생기는 일
  risk?: { chance: number; stats?: Partial<Record<StatKey, number>>; happy?: number }
  luck?: number // 운세 한 칸 ↑(+1) / ↓(-1). 착한 선택 ↑, 이기적인 선택 ↓ (2026-10-21)
  othersHappy?: number // 다른 플레이어 모두 행복 (한턱내기 같은 모두에게 좋은 일)
}
export interface SpecialEvent { id: string; title: string; text: string; options: SpecialOption[] }

export const SPECIALS: Partial<Record<StageId, SpecialEvent[]>> = {
  child: [
    {
      id: 'talent', title: '장기자랑', text: '학예회 장기자랑 날이에요. 무엇으로 나갈까요?',
      options: [
        { id: 'sing', label: '🎤 노래', check: { stat: 'cha', need: 6, win: { stats: { cha: 1 }, happy: 3 }, lose: { happy: -2 } } },
        { id: 'draw', label: '🎨 그림 대회', check: { stat: 'int', need: 6, win: { stats: { int: 1 }, happy: 3 }, lose: { happy: -2 } } },
        { id: 'watch', label: '👀 구경만', happy: 1 },
      ],
    },
    {
      id: 'lesson', title: '학원 고르기', text: '엄마가 학원을 하나 보내 준대요.',
      options: [
        { id: 'tkd', label: '🥋 태권도', cost: 2, stats: { str: 1 } },
        { id: 'piano', label: '🎹 피아노', cost: 2, stats: { cha: 1 } },
        { id: 'play', label: '🛝 안 다니고 놀기', happy: 3 },
      ],
    },
  ],
  student: [
    {
      id: 'trip', title: '수학여행', text: '수학여행을 가요! 어떻게 보낼까요?',
      options: [
        { id: 'big', label: '🛍️ 기념품 잔뜩', cost: 3, happy: 6 },
        { id: 'mid', label: '🙂 적당히', cost: 1, happy: 3 },
        { id: 'study', label: '📚 안 가고 공부', stats: { int: 1 }, happy: -3 },
      ],
    },
    {
      id: 'newkid', title: '전학 온 친구', text: '전학 온 친구와 친해졌어요. 무엇을 같이 할까요?',
      options: [
        { id: 'study', label: '📖 같이 공부', stats: { int: 1 } },
        { id: 'sport', label: '⚽ 같이 운동', stats: { str: 1 } },
        { id: 'play', label: '🎮 같이 놀기', happy: 3 },
      ],
    },
    {
      id: 'exam', title: '시험 기간', text: '내일이 시험이에요.',
      options: [
        { id: 'allnight', label: '🌙 밤새 공부', stats: { int: 1, str: -1 } },
        { id: 'normal', label: '🙂 적당히', happy: 1 },
        { id: 'giveup', label: '🎉 포기하고 놀기', happy: 4, risk: { chance: 0.5, stats: { int: -1 } } },
      ],
    },
  ],
  young: [
    {
      id: 'abroad', title: '해외 연수', text: '회사에서 해외 연수 기회가 생겼어요. 비용은 내가 내요.',
      options: [
        { id: 'go', label: '✈️ 간다', cost: 4, stats: { int: 1 }, happy: 3 },
        { id: 'stay', label: '🏠 안 간다' },
      ],
    },
    {
      id: 'bungee', title: '번지점프', text: '친구들이 번지점프를 하러 가재요.',
      options: [
        { id: 'jump', label: '🪂 뛴다', check: { stat: 'str', need: 8, win: { stats: { cha: 1 }, happy: 6 }, lose: { happy: -3 } } },
        { id: 'watch', label: '👀 구경만', happy: 1 },
      ],
    },
    {
      id: 'gym', title: '운동 결심', text: '요즘 몸이 무거워요.',
      options: [
        { id: 'pt', label: '💪 PT 등록', cost: 2, stats: { str: 1 } },
        { id: 'home', label: '🏠 홈트', happy: -1, risk: { chance: 0.5, stats: { str: 1 } } },
        { id: 'skip', label: '🛋️ 다음에', happy: 1 },
      ],
    },
  ],
  middle: [
    {
      id: 'checkup', title: '건강검진', text: '건강검진 안내가 왔어요.',
      options: [
        { id: 'go', label: '🏥 정밀 검진', cost: 1, happy: 1 },
        { id: 'skip', label: '🙅 안 받는다', risk: { chance: 0.4, stats: { str: -1 }, happy: -2 } },
      ],
    },
    {
      id: 'reunion', title: '동창회', text: '20년 만에 동창회가 열려요.',
      options: [
        { id: 'go', label: '🥂 간다', cost: 1, check: { stat: 'cha', need: 9, win: { happy: 5 }, lose: { happy: -2 } } },
        { id: 'skip', label: '🏠 안 간다' },
      ],
    },
    {
      id: 'hobby', title: '취미 배우기', text: '새 취미를 시작해 볼까요?',
      options: [
        { id: 'music', label: '🎸 악기', cost: 2, stats: { cha: 1 }, happy: 2 },
        { id: 'book', label: '📚 독서 모임', cost: 1, stats: { int: 1 } },
        { id: 'none', label: '🛋️ 쉬기', happy: 1 },
      ],
    },
  ],
}


// 양심 선택 (2026-10-21 사용자): 착한 선택은 운세 ↑, 이기적인 선택은 운세 ↓ 대신 돈과 행복 둘 다 (저녁: 내린 만큼 이득이 확실하게). '좋은 일' 칸에서 나옴
export const DILEMMAS: Partial<Record<StageId, SpecialEvent[]>> = {
  child: [
    {
      id: 'snack', title: '마지막 간식', text: '맛있는 간식이 딱 하나 남았어요. 친구도 먹고 싶어 해요.',
      options: [
        { id: 'share', label: '🤝 반씩 나눠 먹기', happy: 1, luck: 1 },
        { id: 'mine', label: '😋 혼자 다 먹기', happy: 3, gain: 2, luck: -1 },
      ],
    },
    {
      id: 'lostToy', title: '주운 장난감', text: '놀이터에서 멋진 장난감을 주웠어요.',
      options: [
        { id: 'give', label: '🙋 선생님께 드리기', luck: 1 },
        { id: 'keep', label: '🧸 몰래 갖기', happy: 3, gain: 3, luck: -1 },
      ],
    },
  ],
  student: [
    {
      id: 'peek', title: '보이는 답안지', text: '시험 중에 옆 친구 답안지가 다 보여요…',
      options: [
        { id: 'honest', label: '✋ 내 실력으로', happy: -1, luck: 1 },
        { id: 'peek', label: '👀 슬쩍 보기', happy: 3, gain: 2, luck: -1 },
      ],
    },
    {
      id: 'cleanup', title: '동네 청소', text: '반 친구들이 주말에 동네 청소를 하재요.',
      options: [
        { id: 'go', label: '🧹 같이 한다', othersHappy: 1, luck: 1 },
        { id: 'skip', label: '🎮 집에서 게임', happy: 2 },
      ],
    },
  ],
  young: [
    {
      id: 'credit', title: '대박 난 프로젝트', text: '팀 프로젝트가 대박 났어요. 공은 누구 몫일까요?',
      options: [
        { id: 'team', label: '🙌 팀 모두의 덕', happy: 2, luck: 1 },
        { id: 'me', label: '😎 내 덕이라고 하기', gain: 5, happy: 3, luck: -1 },
      ],
    },
    {
      id: 'treat', title: '월급날', text: '월급날이에요. 모두에게 한턱낼까요?',
      options: [
        { id: 'treat', label: '🍖 모두에게 한턱', cost: 2, othersHappy: 2, luck: 1 },
        { id: 'home', label: '🏠 그냥 집에', happy: 1 },
      ],
    },
    {
      id: 'change', title: '거스름돈', text: '편의점 알바생이 거스름돈을 너무 많이 줬어요.',
      options: [
        { id: 'back', label: '🙏 돌려준다', luck: 1 },
        { id: 'keep', label: '🤫 모른 척', gain: 2, happy: 2, luck: -1 },
      ],
    },
  ],
  middle: [
    {
      id: 'donate', title: '이웃 돕기', text: '동네에 큰불이 나서 모금을 해요.',
      options: [
        { id: 'big', label: '💝 크게 기부', cost: 3, happy: 2, luck: 1 },
        { id: 'small', label: '🪙 조금', cost: 1, happy: 1 },
        { id: 'skip', label: '🙈 모른 척' },
      ],
    },
    {
      id: 'insider', title: '솔깃한 정보', text: '아는 사람이 회사 내부 정보를 몰래 알려 줬어요.',
      options: [
        { id: 'use', label: '💰 몰래 투자', gain: 6, happy: 2, luck: -1 },
        { id: 'no', label: '🙅 듣지 않은 걸로', happy: 1, luck: 1 },
      ],
    },
  ],
  old: [
    {
      id: 'scholarship', title: '장학금', text: '모교에서 장학금 기부를 부탁해요.',
      options: [
        { id: 'give', label: '🎓 기부한다', cost: 3, happy: 3, luck: 1 },
        { id: 'no', label: '🙅 사양한다' },
      ],
    },
    {
      id: 'gossip', title: '동네 소문', text: '이웃집 이야기를 들었어요. 말하면 다들 재밌어할 텐데…',
      options: [
        { id: 'talk', label: '🗣️ 소문낸다', happy: 3, gain: 1, luck: -1 },
        { id: 'quiet', label: '🤐 입을 다문다', luck: 1 },
      ],
    },
    {
      id: 'grandkid', title: '손주 용돈', text: '손주가 놀러 왔어요.',
      options: [
        { id: 'give', label: '💌 두둑이 준다', cost: 2, othersHappy: 1, happy: 2, luck: 1 },
        { id: 'small', label: '🍬 사탕만', happy: 1 },
      ],
    },
  ],
}
// 테마 맵 사건 (2026-10-29 사용자): 좋은 일·랜덤이벤트 칸에서 가끔. 크기는 지금 사건과 같게
// 단계와 상관없이 나옴. 능력치가 바뀌는 사건은 노년에 안 나옴 (노년은 능력치가 안 바뀜)
export const THEME_EVENTS: Record<MapTheme, SpecialEvent[]> = {
  spring: [
    {
      id: 'th-blossom', title: '벚꽃 축제', text: '동네 길가에 벚꽃이 활짝 폈어요.',
      options: [
        { id: 'picnic', label: '🍱 친구들과 도시락 소풍', cost: 1, happy: 4 },
        { id: 'photo', label: '📷 사진 찍어 올리기', check: { stat: 'cha', need: 7, win: { stats: { cha: 1 }, happy: 2 }, lose: { happy: -1 } } },
        { id: 'rest', label: '🏠 창문 열고 쉬기', happy: 1 },
      ],
    },
    {
      id: 'th-tree', title: '식목일', text: '동네에서 나무 심기 봉사를 해요. 오늘은 쉬는 날이기도 해요.',
      options: [
        { id: 'plant', label: '🌳 나무 심으러 가기', happy: 1, luck: 1 },
        { id: 'rest', label: '🛋️ 푹 쉬기', happy: 3 },
      ],
    },
    {
      id: 'th-fresh', title: '새로운 시작', text: '봄이 왔어요. 새로 무언가를 시작해 볼까요?',
      options: [
        { id: 'plan', label: '📒 계획 세우고 공부', stats: { int: 1 } },
        { id: 'run', label: '🏃 아침 운동', stats: { str: 1 } },
        { id: 'friend', label: '💬 새 친구 사귀기', stats: { cha: 1 } },
      ],
    },
    {
      id: 'th-dust', title: '미세먼지', text: '하늘이 뿌옇게 미세먼지가 가득해요.',
      options: [
        { id: 'mask', label: '😷 마스크 사서 쓰기', cost: 1 },
        { id: 'share', label: '🤝 이웃에게도 나눠 주기', cost: 1, othersHappy: 1, luck: 1 },
        { id: 'skip', label: '🙈 그냥 나가기', risk: { chance: 0.4, happy: -3 } },
      ],
    },
  ],
  summer: [
    {
      id: 'th-beach', title: '여름 휴가', text: '여름 휴가철이에요. 어디로 갈까요?',
      options: [
        { id: 'sea', label: '🏖️ 멀리 바다로', cost: 3, happy: 6 },
        { id: 'pool', label: '🏊 동네 수영장', cost: 1, happy: 3 },
        { id: 'work', label: '💼 휴가 없이 일하기', gain: 1, happy: -1 },
      ],
    },
    {
      id: 'th-melon', title: '무더위', text: '푹푹 찌는 날이에요. 시원한 수박이 한 통 생겼어요.',
      options: [
        { id: 'share', label: '🍉 이웃과 나눠 먹기', happy: 2, luck: 1 },
        { id: 'mine', label: '😋 혼자 다 먹기', happy: 3, luck: -1 },
      ],
    },
    {
      id: 'th-rescue', title: '물놀이 사고', text: '계곡에서 아이가 물에 떠내려가요!',
      options: [
        { id: 'swim', label: '🏊 직접 뛰어들기', check: { stat: 'str', need: 7, win: { stats: { str: 1 }, happy: 4 }, lose: { happy: -2 } } },
        { id: 'call', label: '📣 안전요원 부르기', happy: 1, luck: 1 },
      ],
    },
    {
      id: 'th-rain', title: '장마', text: '며칠째 비가 와요. 우산 없는 친구가 보여요.',
      options: [
        { id: 'lend', label: '☂️ 우산 같이 쓰기', luck: 1 },
        { id: 'run', label: '🏃 혼자 뛰어가기', risk: { chance: 0.5, happy: -2 } },
        { id: 'home', label: '🏠 집에서 빈둥빈둥', happy: 2 },
      ],
    },
  ],
  autumn: [
    {
      id: 'th-maple', title: '단풍 구경', text: '산이 울긋불긋 물들었어요. 단풍 구경을 갈까요?',
      options: [
        { id: 'far', label: '🚗 멀리 단풍 명소로', cost: 2, happy: 6 },
        { id: 'near', label: '🍁 동네 공원 산책', happy: 3 },
        { id: 'work', label: '💼 그 시간에 할 일 하기', gain: 1, happy: -1 },
      ],
    },
    {
      id: 'th-chestnut', title: '밤 줍기', text: '뒷산에서 알밤을 한 바구니 주웠어요. 이웃 할머니가 부러운 눈으로 봐요.',
      options: [
        { id: 'share', label: '🤝 할머니와 나누기', happy: 2, luck: 1 },
        { id: 'sell', label: '🌰 다 팔기', gain: 2, happy: 1, luck: -1 },
      ],
    },
    {
      id: 'th-harvest', title: '추수 축제', text: '마을 추수 축제가 열렸어요. 씨름 대회도 있대요!',
      options: [
        { id: 'wrestle', label: '💪 씨름 나가기', check: { stat: 'str', need: 7, win: { stats: { str: 1 }, happy: 3 }, lose: { happy: -1 } } },
        { id: 'eat', label: '🍠 군고구마 사 먹기', cost: 1, happy: 4 },
        { id: 'help', label: '🧺 일손 돕기', othersHappy: 1, happy: 1 },
      ],
    },
    {
      id: 'th-read', title: '독서의 계절', text: '선선한 가을, 무엇을 해 볼까요?',
      options: [
        { id: 'book', label: '📚 책 읽기', stats: { int: 1 } },
        { id: 'run', label: '🏃 마라톤 연습', stats: { str: 1 } },
        { id: 'nap', label: '😴 낮잠', happy: 3 },
      ],
    },
  ],
  winter: [
    {
      id: 'th-snowman', title: '눈사람 만들기', text: '밤새 함박눈이 왔어요! 눈사람을 만들어요.',
      options: [
        { id: 'big', label: '⛄ 아주 크게', check: { stat: 'str', need: 6, win: { happy: 5 }, lose: { happy: 1 } } },
        { id: 'together', label: '🧤 친구들과 같이', othersHappy: 1, happy: 2 },
        { id: 'inside', label: '🛋️ 창밖으로 구경만', happy: 1 },
      ],
    },
    {
      id: 'th-ice', title: '빙판길', text: '집 앞 길이 꽁꽁 얼었어요. 사람들이 미끄러질 것 같아요.',
      options: [
        { id: 'sand', label: '🧂 모래 뿌리기', cost: 1, luck: 1 },
        { id: 'pass', label: '🙈 그냥 지나가기', risk: { chance: 0.4, happy: -3 } },
      ],
    },
    {
      id: 'th-xmas', title: '크리스마스', text: '거리가 반짝반짝해요. 선물을 어떻게 할까요?',
      options: [
        { id: 'all', label: '🎁 모두에게 선물', cost: 2, othersHappy: 1, happy: 2, luck: 1 },
        { id: 'family', label: '🎄 우리 집만 조촐하게', cost: 1, happy: 3 },
        { id: 'none', label: '🙅 선물 없이 아끼기', gain: 1, happy: -1 },
      ],
    },
    {
      id: 'th-blizzard', title: '폭설', text: '눈이 너무 많이 와서 길이 막혔어요.',
      options: [
        { id: 'shovel', label: '❄️ 동네 눈 치우기', stats: { str: 1 }, luck: 1 },
        { id: 'home', label: '🍲 집에서 따뜻하게', happy: 3 },
        { id: 'go', label: '💼 그래도 나가서 일하기', gain: 2, risk: { chance: 0.3, happy: -2 } },
      ],
    },
  ],
}
const ALL_THEME_EVENTS = Object.values(THEME_EVENTS).flat()

// 특별 이벤트·양심 선택·테마 사건에서 찾기
export const findEvent = (stage: StageId, id: string) => [...(SPECIALS[stage] ?? []), ...(DILEMMAS[stage] ?? []), ...ALL_THEME_EVENTS].find((e) => e.id === id)

const STAT_LABEL: Record<StatKey, string> = { int: '지력', str: '체력', cha: '매력' }
const statText = (st?: Partial<Record<StatKey, number>>) =>
  Object.entries(st ?? {}).map(([k, v]) => `${STAT_LABEL[k as StatKey]} ${v! > 0 ? '+' : ''}${v}`)

// 선택지 설명 (돈은 단계 돈 단위를 곱해서)
export function specialDesc(o: SpecialOption, sc: number, won: (n: number) => string): string {
  const parts: string[] = []
  if (o.cost) parts.push(`-${won(o.cost * sc)}`)
  if (o.gain) parts.push(`+${won(o.gain * sc)}`)
  parts.push(...statText(o.stats))
  if (o.happy) parts.push(`행복 ${o.happy > 0 ? '+' : ''}${o.happy}`)
  if (o.check) {
    const w = [...statText(o.check.win.stats), ...(o.check.win.happy ? [`행복 +${o.check.win.happy}`] : [])].join(' ')
    const l = [...statText(o.check.lose.stats), ...(o.check.lose.happy ? [`행복 ${o.check.lose.happy}`] : [])].join(' ')
    parts.push(`${STAT_LABEL[o.check.stat]}+주사위 ${o.check.need} 이상이면 ${w}, 아니면 ${l}`)
  }
  if (o.risk) parts.push(`${Math.round(o.risk.chance * 100)}% 확률로 ${[...statText(o.risk.stats), ...(o.risk.happy ? [`행복 ${o.risk.happy}`] : [])].join(' ')}`)
  if (o.othersHappy) parts.push(`다른 사람 모두 행복 +${o.othersHappy}`)
  if (o.luck) parts.push(`운세 ${o.luck > 0 ? '↑' : '↓'}`)
  return parts.join(' · ') || '아무 일 없음'
}

// AI가 보는 기대 점수: 능력치 1 = 3점, 행복 1 = 1점, 돈 SCORE_PER_POINT = 1점, 운세 한 칸 = 3점
export function specialValue(o: SpecialOption, sc: number, statOf: (k: StatKey) => number): number {
  const sv = (st?: Partial<Record<StatKey, number>>) => Object.entries(st ?? {}).reduce((a, [k, v]) => a + (statOf(k as StatKey) >= 10 && v! > 0 ? 0 : v! * 3), 0)
  let v = sv(o.stats) + (o.happy ?? 0) + (o.luck ?? 0) * 3 - ((o.cost ?? 0) * sc) / SCORE_PER_POINT + ((o.gain ?? 0) * sc) / SCORE_PER_POINT
  if (o.check) {
    const p = Math.max(0, Math.min(1, (7 - (o.check.need - statOf(o.check.stat))) / 6))
    v += p * (sv(o.check.win.stats) + (o.check.win.happy ?? 0)) + (1 - p) * (sv(o.check.lose.stats) + (o.check.lose.happy ?? 0))
  }
  if (o.risk) v += o.risk.chance * (sv(o.risk.stats) + (o.risk.happy ?? 0))
  return v
}
