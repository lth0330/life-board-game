// 대회 중 다른 사람이 보는 장면: 게임마다 화면을 다시 그릴 만큼의 값만 (2026-10-29)
// phase: ready 시작 전 · help 설명서 보는 중 · play 하는 중(practice면 연습) · done 끝 / k: 어느 대회 것인지 (지난 대회 장면은 안 씀)
export type MiniView = {
  phase: 'ready' | 'help' | 'play' | 'done'; practice?: boolean; k?: number
  pos?: number; left?: number // 줄 위치·힘·랜드마크 위치 / 남은 초
  n?: number; m?: number; right?: number // 지금 몇 번째·센 수 / 전체·목표 / 맞힌 수
  seq?: string[]; show?: boolean // 그림·동작 순서 (보여 주는 중이면 show), 같은 그림은 카드 배치
  open?: number[]; found?: number[] // 같은 그림: 뒤집은 카드·찾은 카드
  marks?: (number | null)[]; ys?: number[] // 무대 공연 판정·음표 높이(%) / 사진 찍기 결과
  target?: number; zone?: number // 목표 칸 시작·너비 (%)
  item?: string; ok?: boolean | null // 지금 물건·문제·랜드마크 / 맞았나
}
// 장면을 보여 줄 수 있는 게임 (대회에 나오는 게임 전부 + 같은 칸 대결 타이밍)
export const WATCHABLE: string[] = ['timing', 'tug', 'race', 'throw', 'memory', 'photo', 'pairs', 'quickmath', 'rhythm', 'dance', 'snap', 'pack']
