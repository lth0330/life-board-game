// 이름 뒤 조사를 받침에 맞게 (2026-10-29: '서윤와'·'아파트을'처럼 틀리게 나오던 것)
// 받침이 있으면 앞 것, 없으면 뒤 것. '으로/로'는 ㄹ 받침도 '로'. 한글이 아니면(숫자·영어) 뒤 것
export type JosaPair = '이/가' | '을/를' | '은/는' | '와/과' | '으로/로'
const FIRST_WITH_BATCHIM: Record<JosaPair, [string, string]> = { '이/가': ['이', '가'], '을/를': ['을', '를'], '은/는': ['은', '는'], '와/과': ['과', '와'], '으로/로': ['으로', '로'] }
export function josa(word: string, pair: JosaPair): string {
  const c = word.trim().charCodeAt(word.trim().length - 1)
  const hangul = c >= 0xac00 && c <= 0xd7a3
  const jong = hangul ? (c - 0xac00) % 28 : 0
  const [withB, without] = FIRST_WITH_BATCHIM[pair]
  const useFirst = jong !== 0 && !(pair === '으로/로' && jong === 8)
  return word + (useFirst ? withB : without)
}
