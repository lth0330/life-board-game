// 사건 장면 틀: 시간에 따라 값·자세를 부드럽게 바꾸는 도구들 (장면 하나 = 몇 초에 무엇이 어디 있는지)
import type { SidePose } from '../art/SideCharacter'

export const INK = '#2a2118'

/** 0~1 사이로 자르기 */
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** t가 a~b 사이에서 얼마나 왔는지 (0~1) */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
  out: (x: number) => 1 - (1 - x) ** 3,
  in: (x: number) => x * x * x,
  /** 살짝 넘쳤다가 돌아옴 (통통) */
  back: (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2,
  /** 바닥에 튕김 */
  bounce: (x: number) => {
    const n = 7.5625, d = 2.75
    if (x < 1 / d) return n * x * x
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375
    return n * (x -= 2.625 / d) * x + 0.984375
  },
}
export type Ease = (x: number) => number

/** 시간표대로 숫자 바꾸기: keys = [[초, 값], ...], 사이는 ease로 이음 */
export function keys(t: number, k: [number, number][], e: Ease = ease.inOut): number {
  if (t <= k[0][0]) return k[0][1]
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, v0] = k[i - 1], [t1, v1] = k[i]
      return v0 + (v1 - v0) * e((t - t0) / (t1 - t0 || 1))
    }
  }
  return k[k.length - 1][1]
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpArr = (a: readonly number[] | undefined, b: readonly number[] | undefined, k: number, def: readonly number[]) => {
  const x = a ?? def, y = b ?? def
  const n = Math.max(x.length, y.length)
  return Array.from({ length: n }, (_, i) => lerp(x[i] ?? 0, y[i] ?? 0, k))
}

/** 두 자세 섞기 (k = 0 이면 a, 1 이면 b) */
export function mixPose(a: SidePose, b: SidePose, k: number): SidePose {
  return {
    lean: lerp(a.lean ?? 0, b.lean ?? 0, k),
    head: lerp(a.head ?? 0, b.head ?? 0, k),
    bob: lerp(a.bob ?? 0, b.bob ?? 0, k),
    armN: lerpArr(a.armN, b.armN, k, [4, 8]) as [number, number],
    armF: lerpArr(a.armF, b.armF, k, [-4, 8]) as [number, number],
    legN: lerpArr(a.legN, b.legN, k, [0, 0, 0]) as [number, number, number],
    legF: lerpArr(a.legF, b.legF, k, [0, 0, 0]) as [number, number, number],
  }
}

/** 시간표대로 자세 바꾸기: 자세 자리에 함수를 넣으면 그 시간의 움직이는 자세(걷기 등) */
export type PoseKey = [number, SidePose | ((t: number) => SidePose)]
export function poseAt(t: number, k: PoseKey[], e: Ease = ease.inOut): SidePose {
  const at = (p: PoseKey[1]) => (typeof p === 'function' ? p(t) : p)
  if (t <= k[0][0]) return at(k[0][1])
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, p0] = k[i - 1], [t1, p1] = k[i]
      return mixPose(at(p0), at(p1), e((t - t0) / (t1 - t0 || 1)))
    }
  }
  return at(k[k.length - 1][1])
}

/** 시간표대로 고르기 (표정 등): [[초부터, 값], ...] */
export function pick<T>(t: number, k: [number, T][]): T {
  let v = k[0][1]
  for (const [t0, x] of k) if (t >= t0) v = x
  return v
}

/** 흔들림 transform (흔들리는 동안 1.05배로 키워 가장자리 빈틈을 가림) */
export function shakeT(t: number, t0: number, dur = 0.4, amp = 5) {
  const [x, y] = shake(t, t0, dur, amp)
  return x || y ? `translate(${x} ${y}) translate(160 90) scale(1.05) translate(-160 -90)` : undefined
}
/** 화면 흔들림: t0부터 dur초 동안 amp만큼 */
export function shake(t: number, t0: number, dur = 0.4, amp = 5): [number, number] {
  const k = seg(t, t0, t0 + dur)
  if (k <= 0 || k >= 1) return [0, 0]
  const f = amp * (1 - k)
  return [Math.sin(t * 90) * f, Math.cos(t * 77) * f * 0.6]
}
