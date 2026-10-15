import { it } from 'vitest'
import { aiStep } from './ai'
import { createGame, stageOf } from './game'

// 점검용: 갈림길·결혼 지점 같은 중요한 곳에 실제로 몇 명이 닿는지
it('도달률 점검', () => {
  const reach: Record<string, number> = {}
  let players = 0
  for (let seed = 1; seed <= 80; seed++) {
    const s = createGame({ humanName: '', humans: 0, aiCount: 4, settings: { startAdult: false, difficulty: 'normal' }, seed })
    players += 4
    const seen = new Set<string>()
    const mark = (k: string, id: number) => { const key = `${k}:${id}`; if (!seen.has(key)) { seen.add(key); reach[k] = (reach[k] ?? 0) + 1 } }
    let n = 0
    while (s.phase !== 'gameover' && n++ < 8000) {
      aiStep(s)
      const st = stageOf(s)
      for (const p of s.players) {
        const t = st.tiles[p.pos]
        const d = t.d
        if (st.id === 'young' && d >= 1 && st.tiles[p.pos].kind !== 'campus') mark('청년: 본 길 직업 칸(1)까지 옴', p.id)
        if (st.id === 'child' && d >= 5) mark('어린이: 학원/놀이 갈림길(5)', p.id)
        if (st.id === 'young' && d >= 10) mark('청년: 첫 결혼 지점(10)', p.id)
        if (st.id === 'young' && d >= 20 && st.tiles[p.pos].road === 'main') mark('청년: 둘째 결혼 지점(20)', p.id)
        if (st.id === 'young' && d >= 18 && st.tiles[p.pos].road === 'main') mark('청년: 둘째 상점(18)', p.id)
        if (st.id === 'middle' && d >= 15) mark('중년: 새 가족 칸(15)', p.id)
        if (p.collegeDecided) mark('진로(대학/취업) 정함', p.id)
        if (st.id === 'middle' && d >= 13) mark('중년: 결혼 지점(13)', p.id)
        if (st.id === 'middle' && d >= 21) mark('중년: 카지노 갈림길(21)', p.id)
        if (st.id === 'child' && d >= 12) mark('어린이: 운동회 갈림길(12)', p.id)
        if (st.id === 'student' && d >= 13) mark('학생: 두뇌 올림피아드 갈림길(13)', p.id)
        if (st.id === 'young' && d >= 11) mark('청년: 축제 거리 갈림길(11)', p.id)
        if (p.college) mark('대학 감', p.id)
        if (p.spouse) mark('결혼함', p.id)
        if (p.children) mark('출산함', p.id)
        if (p.adopted) mark('입양함', p.id)
      }
    }
  }
  const rows = Object.entries(reach).map(([k, v]) => `${k}: ${Math.round((v / players) * 100)}%`)
  console.log(`AI ${players}명 기준\n` + rows.join('\n'))
}, 30000) // AI 320명이라 다른 테스트와 같이 돌면 오래 걸림
