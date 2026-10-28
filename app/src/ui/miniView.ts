// 대회 중 다른 사람이 보는 장면: 게임마다 화면을 다시 그릴 만큼의 값만 (2026-10-29)
// phase: ready 시작 전 · play 하는 중 · done 끝 / k: 어느 대회 것인지 (지난 대회 장면은 안 씀)
export type MiniView = { phase: 'ready' | 'play' | 'done'; practice?: boolean; pos?: number; left?: number; k?: number }
// 장면을 보여 줄 수 있는 게임 (하나씩 늘려 감)
export const WATCHABLE: string[] = ['tug']
