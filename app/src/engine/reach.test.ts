import { it } from 'vitest'
import { aiStep } from './ai'
import { createGame, stageOf } from './game'

// 점검용: 청년 길 깊이별 도달률 (대학 / 취업 따로). 칸 위치를 정할 때 씀
it('청년 깊이별 도달률', () => {
  const maxBy: { college: boolean; d: number }[] = []
  for (let seed = 1; seed <= 100; seed++) {
    const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
    const best: Record<number, number> = {}
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000 && s.stageIdx <= 2) {
      aiStep(s)
      const st = stageOf(s)
      if (st.id !== 'young') continue
      for (const p of s.players) {
        const t = st.tiles[p.pos]
        if (t.road === 'main') best[p.id] = Math.max(best[p.id] ?? 0, t.d)
      }
    }
    for (const p of s.players) maxBy.push({ college: p.college, d: best[p.id] ?? 0 })
  }
  const pct = (list: typeof maxBy, d: number) => Math.round((list.filter((x) => x.d >= d).length / list.length) * 100)
  const col = maxBy.filter((x) => x.college)
  const work = maxBy.filter((x) => !x.college)
  const rows = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((d) => `깊이 ${d}: 전체 ${pct(maxBy, d)}% · 대학 ${pct(col, d)}% · 취업 ${pct(work, d)}%`)
  console.log(`대학 ${col.length}명 / 취업 ${work.length}명\n` + rows.join('\n'))
})
