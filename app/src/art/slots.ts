// 그림 파일 자리 (2026-10-29 사용자: 나중에 그림·배경을 이미지로 더 좋은 퀄리티로)
// src/assets/art/ 에 이름이 맞는 그림 파일을 넣으면 코드 그림 대신 그 그림을 씀. 없으면 지금 코드 그림 그대로
// 테마 판 전용 그림은 이름 뒤에 -spring·-summer·-autumn·-winter (예: tree-round-winter.webp). 없으면 코드 그림(계절 모습)
// 이름과 크기 목록은 docs/14-images.md
const files = import.meta.glob('../assets/art/*.{webp,png,svg,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const byName: Record<string, string> = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), url]))

// 계절 판(theme)은 그 계절 그림이 있을 때만 그림 파일, 없으면 계절 모습이 있는 코드 그림 (2026-11-03 사용자 A안:
// 기본 그림을 쓰면 겨울·가을 판도 초록 잔디·나무가 돼 버림)
export function artFile(name: string, theme?: string | null): string | undefined {
  return theme ? byName[`${name}-${theme}`] : byName[name]
}
// 들어 있는 그림 이름 (설명서·시험용)
export const ART_FILE_NAMES = Object.keys(byName)
