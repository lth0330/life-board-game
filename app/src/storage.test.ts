import { describe, expect, it } from 'vitest'
import { createGame } from './engine/game'
import { cleanOutfit, DEFAULT_OUTFIT } from './engine/outfit'
import { newerSave, SAVE_VERSION, type SaveSlot } from './storage'

const slot = (savedAt: number, version = SAVE_VERSION): SaveSlot => ({ version, savedAt, state: createGame({ humanName: '나', aiCount: 1, settings: { startAdult: false, difficulty: 'normal' } }) })

describe('계정 저장', () => {
  it('이 기기 저장과 계정 저장 중 더 나중 것을 고름', () => {
    const a = slot(100), b = slot(200)
    expect(newerSave(a, b)).toBe(b)
    expect(newerSave(b, a)).toBe(b)
    expect(newerSave(a, null)).toBe(a)
    expect(newerSave(null, b)).toBe(b)
    expect(newerSave(null, undefined)).toBeNull()
  })

  it('저장 형식이 옛날 것이면 무시', () => {
    const old = slot(999, SAVE_VERSION - 1), cur = slot(1)
    expect(newerSave(old, cur)).toBe(cur)
    expect(newerSave(old, null)).toBeNull()
  })

  it('다른 기기에서 온 옷차림은 모르는 값을 기본값으로 바꿈', () => {
    expect(cleanOutfit(null)).toEqual({ ...DEFAULT_OUTFIT, gender: 'm' })
    const o = cleanOutfit({ gender: 'f', hair: 'twin', hat: 'rocket', topColor: 'red', skin: '#C98F62', extra: 1 })
    expect(o.gender).toBe('f')
    expect(o.hair).toBe('twin')
    expect(o.hat).toBe(DEFAULT_OUTFIT.hat)
    expect(o.topColor).toBe(DEFAULT_OUTFIT.topColor)
    expect(o.skin).toBe('#C98F62')
    expect('extra' in o).toBe(false)
  })
})
