// 장면: 접촉 사고 (안 좋은 일 12초). 내 차가 앞차를 '쿵' — 다치는 모습 없이 범퍼만 찌그러짐
import { Actor, castAt, GROUND, headH, type SceneDef } from './Stage'
import { Road } from './Backdrops'
import { Car } from './Props'
import { Bang, Bubble, Dust, SpeedLines, Sweat } from './Fx'
import { Anger, Exclaim, MoneyFly, Puff } from './Fx2'
import { ease, keys, pick, poseAt, seg, shakeT } from './kit'
import { BOW, CROSS, HOLD_HEAD, SIT, SLUMP, STAND, SQUAT } from './poses'
import type { Expr } from '../art/Character'

const CY = GROUND + 14 // 차 바퀴 닿는 높이
const CS = 1.5 // 차 크기
const HIT = 3.9 // 부딪치는 순간
const OUT = 4.9 // 내리는 순간
const PAL = ['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A', '#F4F0E6', '#C77FD0']
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const dist = (a: string, b: string) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) }
/** 차 색: 내 옷 색과 가장 다른 색 (옷과 차가 겹쳐 사람이 묻히지 않게), 앞차는 그다음 다른 색 */
const carColors = (shirt: string) => {
  const s = [...PAL].sort((a, b) => dist(b, shirt) - dist(a, shirt))
  return [s[0], s.find((c) => dist(c, s[0]) > 120 && dist(c, shirt) > 90) ?? s[1]]
}

export const accident: SceneDef = {
  id: 'accident',
  dur: 12,
  still: 6,
  draw: (t, cast) => {
    const me = cast[0], other = castAt(cast, 1)
    // 달리다(도로가 흐름) 3초부터 브레이크 → 앞차에 쿵
    const cam = t < 3 ? t * 90 : 270 + 90 * 0.9 * ease.out(seg(t, 3, 3.9)) * 0.9
    const myX = keys(t, [[3, 82], [HIT, 95], [HIT + 0.12, 89], [HIT + 0.4, 91]], ease.out)
    const otherX = Math.max(250, 594 - cam) + keys(t, [[HIT, 0], [HIT + 0.15, 6], [HIT + 0.5, 4]])
    const jolt = keys(t, [[HIT, 0], [HIT + 0.08, -4], [HIT + 0.25, 0]])
    const dent = ease.back(seg(t, HIT, HIT + 0.2))
    const spin = cam * 3
    const [myCar, otherCar] = carColors(me.outfit.topColor)
    const kid = (me.age ?? 30) < 13
    const top = GROUND + 14 - headH(me, 56) // 내 머리 꼭대기 (말풍선 자리)
    const otTop = GROUND + 14 - headH(other, 56)
    const meExpr = pick<Expr>(t, [[0, 'happy'], [3.1, 'surprised'], [HIT + 0.6, 'sad']])
    const otExpr = pick<Expr>(t, [[0, 'normal'], [HIT, 'surprised'], [5.4, 'angry']])
    // 차에서 내린 뒤 자세
    const mePose = poseAt(t, [[OUT, STAND], [5.3, HOLD_HEAD], [6.9, HOLD_HEAD], [7.2, BOW(0)], [7.5, BOW(1)], [8.3, BOW(1)], [8.6, STAND], [9, kid ? BOW(0.6) : SQUAT], [10.2, kid ? BOW(0.6) : SQUAT], [10.6, SLUMP]])
    // 상대: 범퍼 가리키며 화냄 → 발 구르기 → 사과해도 끝까지 화남 (손가락질·팔짱) (11-28 사용자)
    const point = { ...STAND, lean: 10, head: 8, armN: [62, 4] as [number, number], armF: [-10, 20] as [number, number] }
    const stompP = (tt: number) => ({ ...CROSS, legN: [26 * Math.max(0, Math.sin(tt * 12)), 36 * Math.max(0, Math.sin(tt * 12)), 0] as [number, number, number] })
    const wag = (tt: number) => ({ ...STAND, lean: 6, head: -6, armN: [96, 30 + 16 * Math.sin(tt * 14)] as [number, number], armF: [40, 110] as [number, number] })
    const otPose = poseAt(t, [[OUT, STAND], [5.3, point], [6.3, point], [6.5, stompP], [7.3, stompP], [7.5, CROSS], [8.6, CROSS], [8.8, wag], [10.0, wag], [10.2, stompP], [11.0, stompP], [11.2, CROSS]])
    const inCar = t < OUT
    return (
      <g transform={shakeT(t, HIT, 0.5, 7)}>
        <Road cam={cam} />
        {t < HIT && t > 3.1 && <SpeedLines x={myX - 74} y={CY - 50} len={20} op={1 - seg(t, 3.5, HIT)} />}
        {/* 앞차 */}
        <g>
          <g transform={`translate(${otherX} ${CY}) scale(${CS}) translate(${-otherX} ${-CY})`}><Car x={otherX} y={CY} color={otherCar} rear={dent} glass={0.12} inside={inCar && <Actor c={other} x={2} y={-3} size={34} pose={SIT} expr={otExpr} noCane />} /></g>
        </g>
        {/* 내 차 (내 옷 색) */}
        <g transform={`translate(0 ${jolt})`}>
          <g transform={`translate(${myX} ${CY}) scale(${CS}) translate(${-myX} ${-CY})`}><Car x={myX} y={CY} color={myCar} dent={dent} spin={spin} glass={0.12} inside={inCar && <g><Actor c={me} x={2} y={-3} size={34} pose={{ ...SIT, armN: [70, 20], armF: [60, 20] }} expr={meExpr} noCane /><path d="M16 -36 l3 8" stroke="#3A3434" strokeWidth="3" strokeLinecap="round" /></g>} /></g>
        </g>
        <Bang t={t} t0={3.1} x={myX + 30} y={CY - 100} text="끼익!" size={17} color="#5E8FC9" dur={0.7} />
        <Bang t={t} t0={HIT} x={myX + 80} y={CY - 96} text="쿵!" size={24} />
        <Dust t={t} t0={HIT} x={myX + 80} y={CY} n={4} spread={26} />
        {/* 내려서 */}
        {!inCar && <Actor c={me} x={myX + 6} y={GROUND + 14} size={56} pose={mePose} expr={meExpr} caneLean />}
        {!inCar && <Actor c={other} x={otherX + 8} y={GROUND + 14} size={56} pose={otPose} expr={otExpr} flip caneLean />}
        {/* 문 열고 내리는 순간 */}
        <Puff t={t} t0={OUT - 0.05} x={myX - 10} y={GROUND - 20} dir={-1} />
        <Puff t={t} t0={OUT + 0.05} x={otherX + 20} y={GROUND - 20} />
        <Exclaim t={t} t0={OUT + 0.1} x={myX - 14} y={top - 4} />
        <Sweat t={t} t0={5.4} x={myX + 24} y={top + 16} dur={1.4} />
        <Anger t={t} t0={5.5} t1={12} x={otherX - 10} y={otTop + 6} />
                <MoneyFly t={t} t0={10.2} x={myX + 20} y={CY - 90} n={3} />
        <Bubble t={t} t0={6.3} t1={7.3} x={myX + 36} y={top - 14} text="어떡해…" />
        <Bubble t={t} t0={5.3} t1={6.25} x={otherX - 30} y={otTop - 14} text="아이고, 내 차!" tail="right" />
        <Bubble t={t} t0={8.8} t1={10.0} x={otherX - 40} y={otTop - 14} text="수리비 물어내요!" tail="right" />
        <Bubble t={t} t0={11.2} t1={12} x={otherX - 34} y={otTop - 14} text="앞을 봐야지요!" tail="right" />
        <Bubble t={t} t0={7.45} t1={8.8} x={myX + 52} y={top - 4} text="죄송합니다…" />
        <Bubble t={t} t0={10.1} t1={11.1} x={myX + 78} y={top - 6} text={kid ? '혼나겠다…' : '수리비…'} />
      </g>
    )
  },
}
