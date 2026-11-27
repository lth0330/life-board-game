// 장면에서 자주 쓰는 자세 모음 (각도 = 도. 팔·다리 + 는 앞으로)
import type { SidePose } from '../art/SideCharacter'
import { walkPose, runPose, canePose } from '../art/sideMotion'
import type { Cast } from './Stage'

type L3 = [number, number, number]
export const STAND: SidePose = { lean: 0, head: 0, armN: [6, 10], armF: [-4, 10], legN: [0, 0, 0], legF: [0, 0, 0] }
export const SIT_LEGS = { legN: [88, 92, 0] as L3, legF: [84, 88, 0] as L3 }
export const SIT: SidePose = { ...SIT_LEGS, lean: 2, armN: [30, 50], armF: [24, 50] }
/** 만세 (기쁨) */
export const CHEER = (t: number): SidePose => ({ ...STAND, head: -10, armN: [160 + 8 * Math.sin(t * 9), 8], armF: [150 + 8 * Math.sin(t * 9 + 1), 8], bob: -Math.abs(Math.sin(t * 9)) * 4 })
/** 팔짱 (화남·삐짐) */
export const CROSS: SidePose = { ...STAND, head: -6, armN: [40, 115], armF: [38, 110] }
/** 머리 감싸기 (당황·큰일) */
export const HOLD_HEAD = (t: number): SidePose => ({ ...STAND, lean: 4, head: 6, armN: [150, 95 + 5 * Math.sin(t * 10)], armF: [145, 95] })
/** 고개 푹 (속상) */
export const SLUMP: SidePose = { ...STAND, lean: 10, head: 18, armN: [2, 6], armF: [-2, 6] }
/** 손뼉 */
export const CLAP = (t: number): SidePose => ({ ...STAND, armN: [55, 50 + 18 * Math.max(0, Math.sin(t * 16))], armF: [55, 40 + 18 * Math.max(0, Math.sin(t * 16))] })
/** 꾸벅 인사·사과 */
export const BOW = (k: number): SidePose => ({ ...STAND, lean: 40 * k, head: 10 * k, armN: [4, 6], armF: [-2, 6] })
/** 손을 입 가까이 (기침·하품) */
export const HAND_MOUTH: SidePose = { ...STAND, lean: 6, head: 6, armN: [62, 122], armF: [10, 20] }
/** 손으로 위 가리키기 */
export const POINT_UP: SidePose = { ...STAND, head: -18, armN: [150, 0], armF: [-4, 10] }
/** 쪼그려 앉기 */
export const SQUAT: SidePose = { lean: 24, head: 10, armN: [40, 40], armF: [30, 40], legN: [95, 140, 0], legF: [85, 135, 0] }

/** 나이에 맞는 걸음: 노인은 지팡이 걸음, 그 밖은 보통 걸음. 빠르기도 같이 (px/초, size 62 기준) */
export function gaitOf(c: Cast, speed = 1) {
  const old = (c.age ?? 30) >= 65
  return {
    pose: (t: number) => (old ? canePose(t * 0.7 * speed) : walkPose(t * 0.9 * speed)),
    v: (old ? 34 : 64) * speed,
  }
}
export const run = (t: number) => runPose(t * 1.4)
/** 의자(높이 seatH px)에 앉을 때 몸을 얼마나 올릴지: 어른 엉덩이 높이 ≈ 0.42×size, 아이는 다리가 짧음 */
export function sitLift(c: Cast, seatH: number, size = 62) {
  const a = c.age ?? 30
  const leg = a < 4 ? 0.5 : a < 8 ? 0.66 : 1
  return Math.max(0, seatH - 4 - 0.42 * size * leg)
}
export const RUN_V = 160
