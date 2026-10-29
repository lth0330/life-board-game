// 돈 글자·직업 한 줄 (2026-10-22 Sheets.tsx에서 나눔: 화면 조각과 도우미를 한 파일에 두면 개발 중 새로고침 경고)
import { isAdultStage, jobOf } from '../engine/game'
import type { GameState, MapTheme, Player } from '../engine/types'

export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`

export function playerLine(s: GameState, p: Player) {
  const job = jobOf(p)
  const jobText = job?.id === 'ceo' && p.biz ? `${p.biz.name} 사장 · ${p.biz.ranks?.[p.jobRank] ?? job.ranks[p.jobRank]}` : job ? `${job.name}${job.boom ? ` · ${job.ranks[p.jobRank]}` : ` ${job.ranks[p.jobRank]}`}` : isAdultStage(s) ? (p.biz ? `${p.biz.name} 팔고 은퇴` : '백수') : '학생'
  return jobText
}

// 테마 맵 고르기: 혼자 플레이 설정·방 대기실 (2026-10-29). ''은 기본 판
export const THEMES: [MapTheme | '', string][] = [['', '기본 판'], ['autumn', '🍂 가을'], ['winter', '❄️ 겨울']]
