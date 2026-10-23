// 나이에 따른 키 (발은 그대로, 머리가 내려옴). Character 그림과 판 위 이름표 높이가 같이 씀 (2026-10-23)
export const heightOf = (age?: number) => (age === undefined ? 1 : age < 4 ? 0.66 : age < 8 ? 0.76 : age < 14 ? 0.8 : age < 20 ? 0.9 : 1)
