import { describe, expect, it } from 'vitest'
import { buildStages, tileX, tileY, zigOffsets } from './board'
import { makeRng } from './rng'

// 칸은 120px. 어떤 두 칸도 가로·세로 둘 다 120px 안으로 붙으면 겹침 (2026-10-21 사용자: 칸끼리 겹치지 않게)
describe('판 배치', () => {
  it('어느 단계에서도 칸끼리 겹치지 않는다', () => {
    for (let seed = 1; seed <= 8; seed++) for (const st of buildStages(makeRng({ seed }))) {
      const zig = zigOffsets(st)
      st.tiles.forEach((a, i) => st.tiles.forEach((b, j) => {
        if (j <= i) return
        const dx = Math.abs(tileX(a, zig) - tileX(b, zig)), dy = Math.abs(tileY(a) - tileY(b))
        expect(dx >= 125 || dy >= 125, `seed ${seed} ${st.id} 칸 ${i}·${j} (dx ${dx}, dy ${dy.toFixed(0)})`).toBe(true)
      }))
    }
  })
})
