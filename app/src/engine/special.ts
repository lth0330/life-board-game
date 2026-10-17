// 특별 이벤트 (2026-10-17 사용자): '좋은 일' 칸의 성장 몫 절반을 고르는 사건으로.
// 능력치는 공짜로 오르지 않고 돈·행복·운(판정)과 바꿈. 돈 50만 = 행복 1 = 점수 1 (SCORE_PER_POINT)
import type { StageId, StatKey } from './types'

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
        { id: 'study', label: '📖 같이 공부', stats: { int: 1 }, happy: -1 },
        { id: 'sport', label: '⚽ 같이 운동', stats: { str: 1 }, happy: -1 },
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
        { id: 'go', label: '✈️ 간다', cost: 4, stats: { int: 2 }, happy: 2 },
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
  return parts.join(' · ') || '아무 일 없음'
}

// AI가 보는 기대 점수: 능력치 1 = 3점, 행복 1 = 1점, 돈 50만 = 1점
export function specialValue(o: SpecialOption, sc: number, statOf: (k: StatKey) => number): number {
  const sv = (st?: Partial<Record<StatKey, number>>) => Object.entries(st ?? {}).reduce((a, [k, v]) => a + (statOf(k as StatKey) >= 10 && v! > 0 ? 0 : v! * 3), 0)
  let v = sv(o.stats) + (o.happy ?? 0) - ((o.cost ?? 0) * sc) / 50 + ((o.gain ?? 0) * sc) / 50
  if (o.check) {
    const p = Math.max(0, Math.min(1, (7 - (o.check.need - statOf(o.check.stat))) / 6))
    v += p * (sv(o.check.win.stats) + (o.check.win.happy ?? 0)) + (1 - p) * (sv(o.check.lose.stats) + (o.check.lose.happy ?? 0))
  }
  if (o.risk) v += o.risk.chance * (sv(o.risk.stats) + (o.risk.happy ?? 0))
  return v
}
