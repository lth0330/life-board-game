// 장면: 친구들과 떡볶이 (좋은 일 10초, 학생). 각자 작은 접시 하나씩 → 젓가락으로 떡 집기 → 후후 불기 → 냠 → 오물오물 → 배부름
import { Actor, FrontActor, GROUND, castAt, headH, type Cast, type SceneDef } from './Stage'
import { Restaurant } from './Backdrops'
import { Chopsticks, FrontStool, Plate, SeatedLegs, Stool, Table } from './Props'
import { Bubble, Hearts, Sparkle, Steam, Sweat } from './Fx'
import { ease, keys, pick, seg } from './kit'
import type { SidePose } from '../art/SideCharacter'
import { sitLift } from './poses'
import type { Expr } from '../art/Character'

const SIT_LEGS = { legN: [88, 92, 0] as [number, number, number], legF: [84, 88, 0] as [number, number, number] }
const SIZE = 62
const TH = 32 // 식탁 높이
const TOP = GROUND - TH - 7 // 식탁 윗면
const lift = (c: Cast) => sitLift(c, 28)
const START = 1.5 // 먹기 시작
const STOP = 7.0 // 다 먹음
const MX = 165 // 가운데 친구 자리

/** 한 입 순서 (p = 0~1): 접시로 손 뻗어 집기 → 입 앞으로 → 후후 → 냠 → 오물오물 */
function phase(p: number) {
  if (p < 0.2) return { k: keys(p, [[0, 0.15], [0.2, 0]]), food: false, blow: false, chew: false }
  if (p < 0.38) return { k: ease.inOut(seg(p, 0.2, 0.38)) * 0.72, food: true, blow: false, chew: false }
  if (p < 0.58) return { k: 0.72, food: true, blow: true, chew: false }
  if (p < 0.66) return { k: 0.72 + 0.28 * ease.inOut(seg(p, 0.58, 0.66)), food: true, blow: false, chew: false }
  return { k: 1 - 0.85 * ease.inOut(seg(p, 0.7, 1)), food: false, blow: false, chew: true }
}
// k = 0 접시까지 손 뻗기(몸 숙임) → 1 입에 넣기
const reach = (k: number, blow: boolean): SidePose => ({
  ...SIT_LEGS,
  lean: 14 - 10 * k, head: (blow ? 10 : 8) - 14 * k,
  armN: [92 - 34 * k, 22 + 94 * k], armF: [34, 56],
})
const full = (t: number): SidePose => ({ ...SIT_LEGS, lean: -8, head: -8, armN: [30 + 4 * Math.sin(t * 16), 70], armF: [24, 70] })

export const eat: SceneDef = {
  id: 'eat',
  dur: 10,
  still: 4.4,
  draw: (t, cast) => {
    const people = [cast[0], castAt(cast, 1), castAt(cast, 2)]
    // 나(왼쪽, 오른쪽 봄) · 친구1(오른쪽, 왼쪽 봄) · 친구2(식탁 뒤 가운데, 오른쪽 봄)
    const seat = [{ x: 78, plate: 118, flip: false, off: 0, per: 2.2 }, { x: 252, plate: 212, flip: true, off: 0.7, per: 2.4 }, { x: MX, plate: MX, flip: false, off: 1.3, per: 2.6 }]
    const st = (i: number) => {
      const s = seat[i]
      const eating = t > START && t < STOP
      const n = Math.floor(Math.max(0, t - START + s.off) / s.per) // 몇 입 먹었나
      const left = Math.max(0, 6 - n * 1.2 * (t > START ? 1 : 0)) * (t < STOP + 0.3 ? 1 : 0)
      if (!eating) return { pose: t < START ? { ...SIT_LEGS, lean: 6, head: -4, armN: [44, 66], armF: [36, 66] } as SidePose : full(t + s.off), food: false, blow: false, chew: false, left: t < START ? 6 : 0 }
      const ph = phase(((t - START + s.off) % s.per) / s.per)
      const p = reach(ph.k, ph.blow)
      const chewBob = ph.chew ? 2.5 * Math.max(0, Math.sin(t * 18)) : 0
      return { pose: { ...p, head: (p.head ?? 0) + chewBob }, food: ph.food, blow: ph.blow, chew: ph.chew, left }
    }
    const S = people.map((_, i) => st(i))
    const seatTop = (c: Cast) => GROUND - lift(c) - (headH(c) - 22)
    const expr = (i: number): Expr => S[i].blow ? 'surprised' : pick<Expr>(t, [[0, 'happy'], [START, 'normal'], [3.4 + i * 0.7, i === 0 ? 'love' : 'happy'], [STOP, 'happy']])
    const stick = (i: number) => {
      const k = S[i].pose.armN?.[1] ?? 0
      // 손이 접시 쪽이면 끝이 아래로, 입 쪽이면 입을 향해
      return <g transform={`rotate(${keys(k, [[22, 80], [116, -30]], ease.linear)}) scale(1.3)`}><Chopsticks food={S[i].food} /></g>
    }
    return (
      <g>
        <Restaurant />
        {/* 가운데 친구: 식탁 건너편 의자에 앞(보는 사람 쪽)을 보고 앉음. 의자·다리는 식탁 다리 사이로 보임 (11-28 사용자) */}
        <FrontStool x={MX} y={GROUND} h={28} />
        <clipPath id="eat-mid"><rect x="0" y="0" width="320" height={GROUND - 27} /></clipPath>
        <g clipPath="url(#eat-mid)"><g transform={`translate(0 ${S[2].chew ? -1.5 * Math.max(0, Math.sin(t * 18)) : 0})`}><FrontActor c={people[2]} x={MX} y={GROUND + 12} size={60} expr={expr(2)} pose="table" /></g></g>
        <SeatedLegs c={people[2]} x={MX} y={GROUND} />
        <Stool x={seat[0].x - 6} y={GROUND} h={28 + lift(people[0])} />
        <Stool x={seat[1].x + 6} y={GROUND} color="#5E8FC9" h={28 + lift(people[1])} />
        <Actor c={people[0]} x={seat[0].x} y={GROUND - lift(people[0])} size={SIZE} pose={S[0].pose} expr={expr(0)} holding={stick(0)} noCane />
        <Actor c={people[1]} x={seat[1].x} y={GROUND - lift(people[1])} size={SIZE} flip pose={S[1].pose} expr={expr(1)} holding={stick(1)} noCane />
        <Table x={165} y={GROUND} w={150} h={TH} />
        {/* 가운데 친구의 팔과 젓가락: 접시(끝이 떡에 닿음) → 입. 젓가락이 식탁을 뚫지 않게 (11-28 사용자) */}
        {(() => {
          const k = Math.max(0, Math.min(1, ((S[2].pose.armN?.[1] ?? 22) - 22) / 94))
          const o = people[2].outfit
          const sleeve = ['hoodie', 'shirt', 'tie', 'sport', 'hanbok', 'police'].includes(o.top) ? o.topColor : o.skin
          const eating = t > START && t < STOP
          // 먹기 전·후엔 손을 식탁 위에 두고 젓가락을 눕혀 쥠
          const hx = MX + 13, hy = eating ? TOP - 26 + 16 * k : TOP - 5, el: [number, number] = [MX + 14, TOP - 2]
          return (
            <g>
              <path d={`M${el[0]} ${el[1]} L${hx} ${hy + 3}`} stroke="#2a2118" strokeWidth="8.6" strokeLinecap="round" />
              <path d={`M${el[0]} ${el[1]} L${hx} ${hy + 3}`} stroke={sleeve} strokeWidth="5.4" strokeLinecap="round" />
              <g transform={`translate(${hx} ${hy}) rotate(${eating ? -150 + 120 * k : -75}) scale(1.3)`}><Chopsticks food={S[2].food} /></g>
              <circle cx={hx} cy={hy} r="3.6" fill={o.skin} stroke="#2a2118" strokeWidth="1.4" />
            </g>
          )
        })()}
        {seat.map((s, i) => <Plate key={i} x={s.plate} y={TOP + 1} n={S[i].left} fish={S[i].left > 3 ? 2 : S[i].left > 1 ? 1 : 0} />)}
        {seat.map((s, i) => S[i].left > 2 && <Steam key={i} t={t + i} x={s.plate} y={TOP - 14} n={2} />)}
        <Sparkle t={t} t0={0.3} x={seat[0].plate} y={TOP - 18} s={0.8} />
        <Sparkle t={t} t0={0.6} x={seat[1].plate} y={TOP - 16} s={0.7} />
        {/* 후후 부는 입김 */}
        {S.map((s, i) => s.blow && <path key={i} transform={`translate(${i === 2 ? MX + 4 : seat[i].x + (seat[i].flip ? -1 : 1) * 30} ${i === 2 ? GROUND - 72 : seatTop(people[i]) + 26}) scale(${seat[i].flip ? -1 : 1} 1)`} d={`M0 0 q4 -2 8 0 M2 5 q4 -2 8 0`} stroke="#9FC9E8" strokeWidth="1.6" fill="none" opacity={0.5 + 0.5 * Math.sin(t * 20)} />)}
        {/* 매워서 땀 */}
        <Sweat t={t} t0={4.6} x={seat[1].x - 14} y={seatTop(people[1]) + 14} />
        <Sweat t={t} t0={5.2} x={seat[1].x - 18} y={seatTop(people[1]) + 18} />
        <Hearts t={t} t0={3.6} x={seat[0].x - 20} y={seatTop(people[0]) + 10} />
        <Hearts t={t} t0={7.6} x={seat[1].x + 10} y={seatTop(people[1]) + 6} n={2} />
        <Bubble t={t} t0={0.2} t1={1.4} x={seat[0].x + 20} y={seatTop(people[0]) - 14} text="와, 떡볶이!" />
        <Bubble t={t} t0={2.2} t1={3.3} x={seat[0].x + 18} y={seatTop(people[0]) - 14} text="후~ 후~" size={13} />
        <Bubble t={t} t0={3.5} t1={4.6} x={seat[0].x + 16} y={seatTop(people[0]) - 14} text="맛있다!" />
        <Bubble t={t} t0={4.8} t1={6.2} x={seat[1].x - 30} y={seatTop(people[1]) - 14} text="스읍, 매워!" tail="right" />
        <Bubble t={t} t0={7.4} t1={9.6} x={seat[0].x + 26} y={seatTop(people[0]) - 14} text="배부르다~" />
      </g>
    )
  },
}
