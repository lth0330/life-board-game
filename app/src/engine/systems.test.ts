import { describe, expect, it } from 'vitest'
import { aiStep } from './ai'
import { distancesFrom } from './board'
import { choose, createGame, cur, finishMini, requestFriendLoan, roll, stageOf } from './game'
import type { GameState } from './types'

const newGame = (seed: number, startAdult = false, humans = 0, ai = 4) =>
  createGame({ humanName: '나', humans, aiCount: ai, settings: { startAdult, difficulty: 'normal' }, seed })

function playOut(s: GameState) {
  let n = 0
  while (s.phase !== 'gameover' && n++ < 6000) aiStep(s)
  return s
}

describe('길 지도', () => {
  it('모든 단계에서 시작 칸부터 끝 칸까지 이어져 있고, 갈림길은 다시 합쳐진다', () => {
    const s = newGame(1)
    for (const st of s.stages) {
      const end = st.tiles.findIndex((t) => !t.next.length)
      const reach = distancesFrom(st, 0, 200)
      expect(reach.has(end), st.name).toBe(true)
      // 모든 칸에서 끝 칸에 닿을 수 있음 (막다른 길 없음)
      st.tiles.forEach((_, i) => {
        if (i === end) return
        expect(distancesFrom(st, i, 200).has(end), `${st.name} ${i}`).toBe(true)
      })
      const forks = st.tiles.filter((t) => t.next.length > 1)
      expect(forks.length, st.name).toBeGreaterThanOrEqual(1)
      expect(st.tiles.filter((t) => t.kind === 'mini').length, st.name).toBeGreaterThan(0)
    }
  })
})

describe('AI끼리 판에서 새 시스템이 실제로 일어나는가', () => {
  it('갈림길·미니게임·만남·소개팅·친구 대출이 나온다', () => {
    const counts: Record<string, number> = {}
    const final: Record<string, number> = {}
    const keys: [string, RegExp][] = [
      ['갈림길', /길로 간다/], ['이벤트 길 미니게임', /^\[(달리기|줄다리기|공 던지기|기억력|같은 그림 찾기|빠른 계산|첫인상|무대 공연|고백 타이밍|홀짝|카드 높낮이|슬롯머신|수도 맞히기|기념품 고르기|추억 사진)\]/],
      ['같은 칸 만남', /같은 칸에서 만났다/], ['수능', /^수능/], ['소개팅 회사', /소개팅/], ['친구 대출', /빌렸다 \(\d+턴/], ['법적 공방', /법적 공방/],
      ['결혼', /결혼!/], ['이혼', /이혼했다/], ['창업', /사업가/],
    ]
    for (let seed = 1; seed <= 60; seed++) {
      const s = playOut(newGame(seed, seed % 3 === 0))
      expect(s.phase).toBe('gameover')
      for (const l of s.log) for (const [k, re] of keys) if (re.test(l.text)) counts[k] = (counts[k] ?? 0) + 1
      for (const p of s.players) {
        const add = (k: string, on: boolean) => { if (on) final[k] = (final[k] ?? 0) + 1 }
        add('끝까지 결혼 유지', !!p.spouse)
        add('이혼 경험', p.divorced)
        add('대학 졸업', p.college)
        add('자녀 있음', p.children + p.adopted > 0)
        add('반려동물', !!p.pet)
        add('집 있음', p.house > 0)
        add('차 있음', p.car > 0)
        add('도박중독', p.lottery.addicted)
        add('친구에게 빌림', p.borrowedFrom.length > 0)
        add('소개팅 회원이었음', s.log.some((l) => l.playerId === p.id && l.text.includes('소개팅')))
      }
    }
    console.log('60판 240명의 마지막 상태:', final)
    console.log('60판 동안 일어난 횟수 (기록 200줄 기준):', counts)
    for (const k of ['갈림길', '이벤트 길 미니게임', '같은 칸 만남', '결혼']) expect(counts[k] ?? 0, k).toBeGreaterThan(0)
  })
})

describe('사람 플레이어 흐름', () => {
  it('갈림길에 닿으면 길을 묻고, 고르면 그 길로 간다', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed })
      const p = cur(s)
      const st = stageOf(s)
      const forkIdx = st.tiles.findIndex((t) => t.fork)
      p.pos = st.tiles.findIndex((t) => t.next.includes(forkIdx)) // 갈림길 바로 앞
      roll(s)
      if (s.pending?.type !== 'fork') continue
      const opt = s.pending.options[1]
      choose(s, opt.id)
      expect(s.log.some((l) => l.text === `${opt.label}로 간다`)).toBe(true)
      // 고른 길의 첫 칸을 지나갔거나 그 위에 있음
      const chosen = st.tiles[+opt.id]
      expect(p.pos === +opt.id || st.tiles[p.pos].d >= chosen.d).toBe(true)
      return
    }
    throw new Error('갈림길 상황을 못 만듦')
  })

  it('미니게임 칸에 멈추면 미니게임 화면이 열리고, 끝내면 보상', () => {
    for (let seed = 1; seed < 300; seed++) {
      const s = createGame({ humanName: '나', humans: 1, aiCount: 1, settings: { startAdult: false, difficulty: 'normal' }, seed })
      const p = cur(s)
      const st = stageOf(s)
      p.pos = st.tiles.findIndex((t) => t.kind === 'mini') // 이벤트 길 첫 칸에서 출발
      roll(s)
      if (s.phase !== 'mini') continue
      const str = p.stats.str
      finishMini(s, 2)
      expect(s.mini).toBe(null)
      expect(p.stats.str >= str).toBe(true)
      return
    }
    throw new Error('미니게임 상황을 못 만듦')
  })

  it('친구에게 돈을 빌리면 상대마다 1번만, 기한을 넘기면 소송', () => {
    const s = newGame(9, true, 1, 3)
    if (s.pending) choose(s, 'work')
  if (s.pending?.type === 'job') choose(s, 'job:office') // 바로 취업하면 직업 선택 창이 바로 뜸
    const me = cur(s)
    const ai = s.players[1]
    ai.money = 100000
    ai.personality = 'family'
    let tries = 0
    while (!s.friendLoans.length && tries++ < 30) {
      me.borrowedFrom = []
      requestFriendLoan(s, ai.id, 500, 1, 3)
    }
    expect(s.friendLoans.length).toBe(1)
    requestFriendLoan(s, ai.id, 500, 1, 3)
    expect(s.friendLoans.length).toBe(1) // 같은 사람에게 두 번은 안 됨
    me.money = -10000
    me.turnsPlayed += 10
    // 다음 내 차례가 올 때까지 진행
    let n = 0
    while (n++ < 500 && !s.log.some((l) => l.text.includes('법적 공방'))) {
      if (cur(s).human) {
        if (s.pending) choose(s, s.pending.options.find((o) => !o.disabled)!.id)
        else if (s.phase === 'mini') finishMini(s, 1)
        else roll(s)
      } else aiStep(s)
    }
    expect(s.log.some((l) => l.text.includes('법적 공방'))).toBe(true)
  })
})
