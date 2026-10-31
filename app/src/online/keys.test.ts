import { describe, expect, it } from 'vitest'
import { hangulToKeys } from './keys'

describe('한글로 친 아이디 → 영어 키', () => {
  it('완성된 글자·낱자·겹받침·겹모음', () => {
    expect(hangulToKeys('안녕')).toBe('dkssud')
    expect(hangulToKeys('ㅁ')).toBe('a')
    expect(hangulToKeys('닭')).toBe('ekfr')
    expect(hangulToKeys('뭐')).toBe('anj')
    expect(hangulToKeys('ㅃ')).toBe('Q')
  })
  it('영어·숫자는 그대로', () => {
    expect(hangulToKeys('ab12한')).toBe('ab12gks')
  })
})
