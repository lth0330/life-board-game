// 게임에서 사건 장면 고르기 (11-28): 사건 창·배너 글에서 맞는 장면을 찾음. 이 파일은 게임 화면이 나중에 불러옴(처음 화면을 가볍게)
import { SCENES, type AgeGroup, type SceneEntry } from './index'
import type { Cast } from './Stage'
export { ScenePlayer } from './Stage'

// 게임 단계 → 장면 나이 (어린이 = 아이, 학생 = 학생, 청년·중년 = 어른, 노년 = 노인)
const GROUP_OF: Record<string, AgeGroup> = { child: 'kid', student: 'teen', young: 'adult', middle: 'adult', old: 'old' }

export interface Picked { entry: SceneEntry; line: string }

/** 여러 줄 글에서 그 나이에 나올 수 있는 장면을 찾음 (없으면 null → 지금처럼 그림 한 장) */
export function pickScene(text: string, stageId: string): Picked | null {
  const g = GROUP_OF[stageId]
  if (!g) return null
  for (const line of text.split('\n')) {
    const entry = SCENES.find((s) => s.ages.includes(g) && s.match.test(line))
    if (entry) return { entry, line }
  }
  return null
}

/** 장면에 나올 사람: 사건을 겪는 사람이 맨 앞, 그다음 다른 플레이어 (모자라면 장면이 기본 친구를 씀) */
export function castFor(people: Cast[], me: number): Cast[] {
  return [people[me], ...people.filter((_, i) => i !== me)]
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 장면이 있는 창을 띄워 둘 시간(ms). 장면 길이 + 글 읽을 시간. 움직임 줄이기면 멈춘 그림이라 보통 창 시간 */
export function sceneMs(dur: number, speed: number, mine: boolean, normalMs: number) {
  if (reduced()) return normalMs
  return Math.round((dur / speed) * 1000) + (mine ? 1500 : 700)
}
