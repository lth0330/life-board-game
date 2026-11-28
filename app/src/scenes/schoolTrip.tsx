// 장면: 수학여행 (학생, 11.5초, 11-28). 관광버스가 도착해 멈춤 → 문에서 친구들과 내림 "와, 도착!" → 석탑 앞으로 뛰어가
// → 선생님이 카메라를 듦 (뒷모습) "자, 하나 둘 셋!" → 다 같이 브이 → 찰칵(번쩍) → 찍힌 사진이 툭 나타남
import { Actor, FrontActor, GROUND, headH, type SceneDef } from './Stage'
import { TripSite } from './Backdrops4'
import { Photo, TourBus } from './Props4'
import { Bubble } from './Fx'
import { Flash } from './Fx3'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { run, STAND } from './poses'
import { pal, TEACHER } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BUS_IN = 1.8, OFF = 2.2, RUN = 3.6, POSE = 5.6, SNAP = 7.4

export const schoolTrip: SceneDef = {
  id: 'schoolTrip',
  dur: 11.5,
  still: 7.8,
  draw: (t, cast) => {
    const me = cast[0], a = pal(cast, 1), b = pal(cast, 2)
    // 버스: 오른쪽에서 들어와 멈춤 → 학생들이 탑 쪽으로 가면 화면이 왼쪽으로 조금 흐름
    const busX = t < RUN + 0.6 ? keys(t, [[0, 420], [BUS_IN, 210]], ease.out) : keys(t, [[RUN + 0.6, 210], [POSE + 0.6, -260]], ease.in) // 다 내리면 주차장으로 떠남
    const cam = keys(t, [[RUN, 0], [POSE, 60]])
    const doorX = 210 + 50 - cam
    const people = [[me, 0], [a, 0.35], [b, 0.7]] as const
    const v: SidePose = { ...STAND, head: -6, armN: [150, 70], armF: [-4, 10] } // 브이 (손을 얼굴 옆으로)
    const pos = (i: number, d: number) => {
      const outT = OFF + d
      const finalX = [92, 124, 156][i]
      if (t < outT) return { x: doorX, show: false, pose: STAND }
      if (t < RUN + d) return { x: doorX - 16 - (t - outT) * 18, show: true, pose: STAND }
      if (t < POSE) return { x: keys(t, [[RUN + d, doorX - 16 - (RUN - OFF) * 18], [POSE - 0.2, finalX]]), show: true, pose: run(t + d) }
      return { x: finalX, show: true, pose: poseAt(t, [[POSE, STAND], [POSE + 0.4, v]]) }
    }
    const expr = pick<Expr>(t, [[0, 'happy'], [SNAP - 0.3, 'tease'], [SNAP + 0.4, 'happy']])
    const shot = ease.back(seg(t, SNAP + 0.6, SNAP + 1.0))
    const top = GROUND - headH(me)
    return (
      <g>
        <TripSite cam={cam} />
        <TourBus x={busX - cam} y={GROUND} />
        {people.map(([c, d], i) => { const p = pos(i, d); return p.show && <Actor key={i} c={c} x={p.x} pose={p.pose} expr={expr} flip={t < POSE} noCane /> })}
        {/* 선생님 (뒷모습, 카메라 들고) */}
        {t > POSE - 0.6 && <g transform={`translate(${keys(t, [[POSE - 0.6, 340], [POSE, 262]])} 0)`}>
          <FrontActor c={TEACHER} x={0} y={GROUND + 6} size={58} back pose="up" />
          <g transform={`translate(0 ${GROUND + 6 - 58 * 1.88 + 30})`}><rect x="-10" y="-7" width="20" height="13" rx="2" fill="#3A3434" stroke={INK} strokeWidth="1.2" /><circle cx="0" cy="-0.6" r="4" fill="#5A5F68" stroke="#C9CED6" strokeWidth="1" /><rect x="4" y="-10" width="5" height="3" rx="1" fill="#3A3434" /></g>
        </g>}
        <Flash t={t} t0={SNAP} power={0.7} />
        {/* 찍힌 사진 */}
        {shot > 0 && <g transform={`translate(222 50) scale(${shot * 2.8}) rotate(-6)`}><Photo w={26} h={20} kind="school" /><text y="12.4" textAnchor="middle" fontSize="2.6" fill={INK}>2026 수학여행</text></g>}
        <Bubble t={t} t0={OFF + 0.6} t1={RUN + 0.4} at={pos(0, 0).x} tail="right" y={top - 12} text="와, 도착!" />
        <Bubble t={t} t0={POSE + 0.2} t1={SNAP} at={262} tail="right" y={44} text="자, 하나 둘 셋!" />
        <Bubble t={t} t0={SNAP + 0.3} t1={SNAP + 1.6} at={94} y={top - 12} text="김치~!" />
      </g>
    )
  },
}
