// 옆모습 캐릭터 걷기·뛰기 동작 (한 걸음을 여러 자세로 나누고 그 사이를 부드럽게 이음)
import type { SidePose } from './SideCharacter'

type L3 = [number, number, number] // 엉덩이, 무릎, 발목
type Key = { leg: L3; bob: number }

// 끊김 없이 이어지는 곡선 (Catmull-Rom): 자세 사이를 직선이 아니라 둥글게 지나감
const cr = (a: number, b: number, c: number, d: number, t: number) =>
  0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)

function sample(keys: Key[], ph: number) {
  const n = keys.length
  const x = (((ph % 1) + 1) % 1) * n
  const i = Math.floor(x), t = x - i
  const k = (j: number) => keys[(i + j + n) % n]
  const leg = [0, 1, 2].map((q) => cr(k(-1).leg[q], k(0).leg[q], k(1).leg[q], k(2).leg[q], t)) as L3
  return { leg, bob: cr(k(-1).bob, k(0).bob, k(1).bob, k(2).bob, t) }
}

// 걷기 한 주기 (가까운 다리 기준 8자세): 뒤꿈치 닿기 → 체중 싣기 → 지나가기 → 밀기 → 발끝 떼기 → 들기 → 앞으로 → 뻗기
const WALK: Key[] = [
  { leg: [26, 4, -16], bob: 0 }, // 뒤꿈치 닿기 (발끝 들림)
  { leg: [16, 16, -2], bob: 2.5 }, // 체중 싣기 (무릎 살짝, 몸 낮음)
  { leg: [2, 6, 0], bob: -0.5 }, // 몸 아래로 지나감
  { leg: [-14, 3, 8], bob: -2.5 }, // 밀기 (몸 가장 높음, 뒤꿈치 들기 시작)
  { leg: [-24, 14, 26], bob: 0 }, // 발끝 떼기
  { leg: [-12, 46, 12], bob: 2.5 }, // 들기 (무릎 굽힘)
  { leg: [10, 54, 0], bob: -0.5 }, // 앞으로 지나감
  { leg: [26, 22, -12], bob: -2.5 }, // 앞으로 뻗기
]

// 뛰기 한 주기: 두 발이 다 뜨는 순간이 있음
const RUN: Key[] = [
  { leg: [34, 14, -8], bob: 0 }, // 발 닿기
  { leg: [14, 38, 0], bob: 3.5 }, // 체중 싣기 (깊게)
  { leg: [-8, 26, 6], bob: 1 }, // 몸 아래
  { leg: [-34, 8, 30], bob: -4 }, // 차고 나가기
  { leg: [-40, 46, 28], bob: -8 }, // 공중
  { leg: [-12, 108, 12], bob: -5 }, // 뒤꿈치 엉덩이 쪽으로
  { leg: [32, 100, 0], bob: -4 }, // 무릎 높이 들기
  { leg: [50, 44, -10], bob: -6 }, // 앞으로 뻗기 (공중)
]

const half = (ph: number) => ph + 0.5

/** 걷기 자세. ph = 걸음 주기 (1 = 왼발·오른발 한 번씩) */
export function walkPose(ph: number): SidePose {
  const n = sample(WALK, ph), f = sample(WALK, half(ph))
  // 팔은 반대쪽 다리와 같이 (조금 늦게 따라와서 자연스럽게)
  const aN = 0.85 * sample(WALK, half(ph) - 0.04).leg[0]
  const aF = 0.85 * sample(WALK, ph - 0.04).leg[0]
  const bob = (n.bob + f.bob) / 2
  const nod = 1.6 * Math.cos(4 * Math.PI * (ph - 0.08))
  return {
    legN: n.leg, legF: f.leg,
    armN: [aN, 14 + Math.max(0, aN) * 0.6], armF: [aF, 14 + Math.max(0, aF) * 0.6],
    lean: 4 + bob * 0.3, head: nod, bob,
  }
}

/** 뛰기 자세 */
export function runPose(ph: number): SidePose {
  const n = sample(RUN, ph), f = sample(RUN, half(ph))
  const aN = 1.3 * sample(RUN, half(ph) - 0.03).leg[0]
  const aF = 1.3 * sample(RUN, ph - 0.03).leg[0]
  const bob = Math.min(n.bob, f.bob)
  return {
    legN: n.leg, legF: f.leg,
    armN: [aN, 78 + aN * 0.25], armF: [aF, 78 + aF * 0.25],
    lean: 13 + bob * 0.4, head: -3 + 2 * Math.cos(4 * Math.PI * ph), bob,
  }
}

/** 지팡이 걸음 (노인): 보폭 작게, 허리 숙이고, 지팡이(가까운 손)는 먼 다리와 같이 앞으로 */
export function canePose(ph: number): SidePose {
  const sm = (l: L3): L3 => [l[0] * 0.6, l[1] * 0.75, l[2] * 0.5]
  const n = sample(WALK, ph), f = sample(WALK, half(ph))
  const fh = 0.6 * sample(WALK, half(ph) - 0.05).leg[0] // 지팡이는 먼 다리를 조금 늦게 따라감
  const bob = (n.bob + f.bob) / 3
  return {
    legN: sm(n.leg), legF: sm(f.leg),
    armN: [10 + fh * 0.9, 6], armF: [-8 + 0.3 * sample(WALK, ph).leg[0], 24],
    lean: 9 + bob * 0.3, head: -4 + 1.2 * Math.cos(4 * Math.PI * ph), bob,
  }
}
