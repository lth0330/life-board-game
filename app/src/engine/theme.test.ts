// 테마 맵 (2026-10-29): 테마마다 미니게임 1개 + 사건 4개가 가끔 섞여 나옴. 기본 판에는 안 나옴
import { expect, it } from 'vitest'
import { aiChoose, aiStep } from './ai'
import { choose, createGame, finishMini } from './game'
import { THEME_EVENTS } from './special'
import type { MapTheme } from './types'

function playAll(theme: MapTheme | undefined, seed: number) {
  const s = createGame({ humanName: '나', humans: 1, aiCount: 3, settings: { startAdult: false, difficulty: 'normal', theme }, seed })
  const seen = { events: 0, games: 0, rewardAs: 0, oldStats: 0 }
  let n = 0
  while (s.phase !== 'gameover' && n++ < 8000) {
    if (s.pending?.title.includes('이벤트:') && /🍂|❄️/.test(s.pending.title)) {
      seen.events++
      if (s.stages[s.stageIdx].id === 'old' && s.pending.options.some((o) => /(지력|체력|매력) [+-]\d/.test(o.desc ?? ''))) seen.oldStats++
    }
    if (s.pending && s.players[s.pending.playerId].human) { choose(s, aiChoose(s)); continue }
    if (s.mini && s.players[s.mini.playerId].human) {
      if (s.mini.game === 'leaves' || s.mini.game === 'snowball') { seen.games++; if (s.mini.as) seen.rewardAs++ }
      finishMini(s, 1, s.mini.contest?.queue[0])
      continue
    }
    const p = s.players[s.current]
    if (p.human) { p.human = false; aiStep(s); p.human = true } else aiStep(s)
  }
  const aiGames = s.log.filter((l) => l.text.startsWith('[낙엽 잡기]') || l.text.startsWith('[눈싸움]')).length
  return { s, ...seen, aiGames }
}

it('가을·겨울 판에서는 테마 사건과 테마 게임이 나오고, 기본 판에는 안 나온다', () => {
  for (const theme of ['autumn', 'winter'] as const) {
    let events = 0, games = 0, oldStats = 0
    for (const seed of [1, 2, 3]) {
      const r = playAll(theme, seed)
      expect(r.s.phase).toBe('gameover')
      events += r.events
      games += r.games + r.aiGames
      oldStats += r.oldStats
    }
    expect(events).toBeGreaterThan(0)
    expect(games).toBeGreaterThan(0)
    expect(oldStats).toBe(0) // 노년에는 능력치가 바뀌는 테마 사건이 안 나옴
  }
  const plain = playAll(undefined, 1)
  expect(plain.events + plain.games + plain.aiGames).toBe(0)
}, 120000)

it('테마 사건 선택지는 지금 사건과 같은 크기 (돈 3배·행복 6 이하)', () => {
  for (const ev of [...THEME_EVENTS.autumn, ...THEME_EVENTS.winter]) {
    expect(ev.id.startsWith('th-')).toBe(true)
    for (const o of ev.options) {
      expect(o.cost ?? 0).toBeLessThanOrEqual(3)
      expect(o.gain ?? 0).toBeLessThanOrEqual(3)
      expect(o.happy ?? 0).toBeLessThanOrEqual(6)
    }
  }
})
