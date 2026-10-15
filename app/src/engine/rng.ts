// 저장 가능한 난수: 상태(seed)를 게임 상태 안에 넣어 두면 같은 판을 다시 재현할 수 있다
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [value, (seed + 0x6d2b79f5) | 0]
}

export interface Rng {
  next(): number
  int(min: number, max: number): number
  chance(p: number): boolean
  pick<T>(list: readonly T[]): T
  weighted<T>(entries: readonly (readonly [T, number])[]): T
}

export function makeRng(holder: { seed: number }): Rng {
  const next = () => {
    const [v, s] = nextRandom(holder.seed)
    holder.seed = s
    return v
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (entries) => {
      const total = entries.reduce((s, [, w]) => s + w, 0)
      let r = next() * total
      for (const [v, w] of entries) {
        r -= w
        if (r < 0) return v
      }
      return entries[entries.length - 1][0]
    },
  }
}
