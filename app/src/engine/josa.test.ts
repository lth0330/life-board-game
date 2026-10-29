// 이름 뒤 조사 (2026-10-29)
import { expect, it } from 'vitest'
import { josa } from './josa'

it('받침에 맞는 조사', () => {
  expect(josa('서윤', '와/과')).toBe('서윤과')
  expect(josa('지호', '와/과')).toBe('지호와')
  expect(josa('하린', '이/가')).toBe('하린이')
  expect(josa('수아', '이/가')).toBe('수아가')
  expect(josa('아파트', '을/를')).toBe('아파트를')
  expect(josa('원룸', '을/를')).toBe('원룸을')
  expect(josa('유튜버', '은/는')).toBe('유튜버는')
  expect(josa('회사원', '은/는')).toBe('회사원은')
  expect(josa('스쿠터', '으로/로')).toBe('스쿠터로')
  expect(josa('고급차', '으로/로')).toBe('고급차로')
  expect(josa('세계일주', '으로/로')).toBe('세계일주로')
  expect(josa('축제 거리', '으로/로')).toBe('축제 거리로')
  expect(josa('일반 승용차', '으로/로')).toBe('일반 승용차로')
  expect(josa('호텔', '으로/로')).toBe('호텔로') // ㄹ 받침은 '로'
  expect(josa('집', '으로/로')).toBe('집으로')
  expect(josa('Kim', '이/가')).toBe('Kim가')
})
