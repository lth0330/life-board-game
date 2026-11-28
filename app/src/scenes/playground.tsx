// 장면: 놀이터에서 신나게 놀기 (좋은 일 10초, 어린이, 11-28). 사다리를 한 칸씩 올라가 → 꼭대기에서 "야호!" 손 흔들기
// → 미끄럼틀을 슝 → 모래밭에 내려 친구와 손뼉 "또 타자!"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Playground } from './Backdrops3'
import { Bubble, Hearts, Sparkle, SpeedLines } from './Fx'
import { ease, keys, pick, poseAt, seg } from './kit'
import { CLAP, run, SIT_LEGS, STAND } from './poses'
import { pal } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

// 미끄럼틀 (Playground 안 좌표 + 36): 사다리 x 26~48 (아래 132 → 위 64), 발판 y 57, 활강판 곡선
const LADDER_X = 30, PLAT_Y = 57, BASE = 132
const S = 36 // 뒤쪽(놀이기구 깊이)에서의 크기 (지붕 아래 앉을 수 있게)
const SEAT = 8 // 활강판 위에 앉을 때 발 기준을 곡선보다 이만큼 아래로 (엉덩이가 판에 닿게)
const CLIMB0 = 1.4, TOP = 3.4, SLIDE = 5.0, LAND = 6.4
// 활강판 곡선 (세상 좌표): M66 60 C88 62 98 92 116 114 Q126 127 148 128
function slideAt(k: number): [number, number, number] {
  if (k < 0.75) {
    const u = k / 0.75, a = 1 - u
    const x = a * a * a * 66 + 3 * a * a * u * 88 + 3 * a * u * u * 98 + u * u * u * 116
    const y = a * a * a * 60 + 3 * a * a * u * 62 + 3 * a * u * u * 92 + u * u * u * 114
    const dx = 3 * a * a * (88 - 66) + 6 * a * u * (98 - 88) + 3 * u * u * (116 - 98), dy = 3 * a * a * (62 - 60) + 6 * a * u * (92 - 62) + 3 * u * u * (114 - 92)
    return [x, y, (Math.atan2(dy, dx) * 180) / Math.PI]
  }
  const u = (k - 0.75) / 0.25, a = 1 - u
  const x = a * a * 116 + 2 * a * u * 126 + u * u * 148, y = a * a * 114 + 2 * a * u * 127 + u * u * 128
  const dx = 2 * a * (126 - 116) + 2 * u * (148 - 126), dy = 2 * a * (127 - 114) + 2 * u * (128 - 127)
  return [x, y, (Math.atan2(dy, dx) * 180) / Math.PI]
}

export const playground: SceneDef = {
  id: 'playground',
  dur: 10,
  still: 4.2,
  draw: (t, cast) => {
    const me = cast[0], fr = pal(cast, 1)
    // 위치·자세: 뛰어옴 → 사다리 오르기 → 발판 → 미끄럼 → 내려와 앞으로 뛰어나옴
    let x = 0, y = BASE, size = S, rot = 0, pose: SidePose = STAND
    if (t < CLIMB0) { x = keys(t, [[0, -20], [CLIMB0, LADDER_X - 8]], ease.linear); pose = run(t) }
    else if (t < TOP) {
      const k = seg(t, CLIMB0, TOP)
      x = LADDER_X - 8 + k * 14; y = BASE - k * (BASE - PLAT_Y) * 0.8 // 머리가 지붕 위로 나오지 않게 발판 조금 아래까지
      const st = Math.sin(t * 9)
      pose = { ...STAND, lean: 8, head: -14, armN: [150 + 14 * st, 30], armF: [140 - 14 * st, 30], legN: [40 + 30 * Math.max(0, st), 60, 0], legF: [40 + 30 * Math.max(0, -st), 60, 0] }
    } else if (t < SLIDE) {
      // 발판에 올라 바로 활강판 꼭대기에 앉아 손 흔들기 (지붕이 낮아서 서지 않음)
      const k = seg(t, TOP, TOP + 0.5)
      x = LADDER_X + 6 + k * 30; y = keys(t, [[TOP, BASE - (BASE - PLAT_Y) * 0.8], [TOP + 0.5, 60 + SEAT]])
      const wave = (tt: number): SidePose => ({ ...SIT_LEGS, lean: -4, head: -8, armN: [160 + 14 * Math.sin(tt * 12), 20], armF: [40, 30] })
      pose = poseAt(t, [[TOP, { ...SIT_LEGS, lean: 20 } as SidePose], [TOP + 0.5, SIT_LEGS as SidePose], [TOP + 0.8, wave], [SLIDE - 0.4, wave], [SLIDE - 0.1, { ...SIT_LEGS, armN: [150, 10], armF: [140, 10] }]])
    } else if (t < LAND) {
      const k = ease.in(seg(t, SLIDE, LAND))
      const [sx, sy, ang] = slideAt(k)
      x = sx; y = sy + SEAT; rot = ang * 0.8
      pose = { ...SIT_LEGS, lean: -10, head: -6, armN: [150, 10], armF: [140, 10] }
    } else {
      // 활강판 끝에서 내려 모래밭(앞쪽)으로 뛰어나옴: 크기가 커짐
      const k = ease.inOut(seg(t, LAND, LAND + 1.2))
      x = 148 + k * 34; y = 128 + k * (GROUND - 128); size = S + k * (62 - S)
      pose = t < LAND + 1.2 ? run(t) : poseAt(t, [[LAND + 1.2, STAND], [LAND + 1.5, CLAP]])
    }
    const expr = pick<Expr>(t, [[0, 'happy'], [CLIMB0, 'normal'], [TOP, 'happy'], [SLIDE, 'surprised'], [LAND, 'happy']])
    const frX = keys(t, [[LAND, 300], [LAND + 1.2, 236]])
    const frPose = t < LAND + 1.2 && t > LAND ? run(t) : poseAt(t, [[0, CLAP], [LAND + 1.3, STAND], [LAND + 1.6, CLAP]])
    const top = y - headH(me, size)
    return (
      <g>
        <Playground />
        <Actor c={me} x={x} y={y} size={size} rot={rot} pose={pose} expr={expr} noCane />
        {t > SLIDE + 0.2 && t < LAND && <g transform={`translate(${x - 18} ${y - 16}) rotate(${rot})`}><SpeedLines x={0} y={0} len={14} n={3} /></g>}
        <Actor c={fr} x={frX} flip pose={frPose} expr="happy" />
        {[0, 0.3].map((d, i) => <Sparkle key={i} t={t} t0={TOP + 0.4 + d} x={x + 16 - i * 30} y={top + 6} s={0.8} />)}
        <Hearts t={t} t0={LAND + 1.6} x={(x + frX) / 2} y={GROUND - headH(me) - 2} n={3} />
        <Bubble t={t} t0={TOP + 0.3} t1={SLIDE} at={x + 2} y={top - 12} text="야호!" />
        <Bubble t={t} t0={SLIDE + 0.2} t1={LAND} at={x + 2} y={Math.max(24, top - 12)} text="슝~" />
        <Bubble t={t} t0={LAND + 1.4} t1={8.6} at={x + 2} y={GROUND - headH(me) - 14} text="진짜 재밌다!" />
        <Bubble t={t} t0={8.6} t1={9.9} at={frX} tail="right" y={GROUND - headH(fr) - 14} text="또 타자!" />
      </g>
    )
  },
}
