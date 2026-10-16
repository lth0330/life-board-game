import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Character } from '../art/Character'
import { DEFAULT_OUTFIT, ITEMS, withGender, type Outfit } from '../engine/outfit'
import { autoEmote, EMOTES } from './Emotes'

describe('캐릭터·표정', () => {
  it('AI 자동 표정: 좋은 일 기쁨, 나쁜 일 슬픔, 방해 화남, 복권 놀람, 그냥 기록은 없음', () => {
    const l = (text: string, tone: 'good' | 'bad' | 'info') => ({ turn: 1, playerId: 1, text, tone })
    expect(autoEmote(l('승진했다', 'good'))).toBe('happy')
    expect(autoEmote(l('복권 2등 당첨', 'good'))).toBe('surprised')
    expect(autoEmote(l('공 던지기 1등!', 'good'))).toBe('happy')
    expect(autoEmote(l('사고가 났다', 'bad'))).toBe('sad')
    expect(autoEmote(l('방해 카드를 맞았다', 'bad'))).toBe('angry')
    expect(autoEmote(l('3칸 이동', 'info'))).toBeNull()
  })

  it('모든 아이템·표정·앞뒤·나이를 오류 없이 그림', () => {
    for (const [slot, items] of Object.entries(ITEMS)) {
      for (const it of items) {
        const o = { ...DEFAULT_OUTFIT, [slot]: it.id } as Outfit
        for (const view of ['front', 'back'] as const) expect(renderToStaticMarkup(createElement(Character, { outfit: o, view }))).toContain('<svg')
      }
    }
    for (const expr of EMOTES) expect(renderToStaticMarkup(createElement(Character, { outfit: DEFAULT_OUTFIT, expr, crop: 'head' }))).toContain('viewBox="14 2 72 72"')
    for (const age of [1, 6, 16, 30, 50, 70]) expect(renderToStaticMarkup(createElement(Character, { outfit: DEFAULT_OUTFIT, age }))).toContain('<svg')
  })

  it('예전 저장 옷차림(성별 없음)도 그려지고, 성별을 바꾸면 새 머리도 맞춰 바뀜', () => {
    const old = { ...DEFAULT_OUTFIT } as Outfit
    delete old.gender
    expect(renderToStaticMarkup(createElement(Character, { outfit: old }))).toContain('<svg')
    expect(withGender({ ...DEFAULT_OUTFIT, hair: 'twoblock' }, 'f').hair).toBe('long')
    expect(withGender({ ...DEFAULT_OUTFIT, hair: 'twin' }, 'm').hair).toBe('short')
    expect(withGender({ ...DEFAULT_OUTFIT, hair: 'curly' }, 'm').hair).toBe('curly')
  })
})
