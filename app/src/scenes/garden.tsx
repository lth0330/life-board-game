// 장면: 텃밭 (좋은 일 10초). 물뿌리개로 물 주기 → 상추가 쑥쑥 → 쪼그려 앉아 뽑기 → 바구니 들고 "싱싱하다!"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Garden } from './Backdrops3'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Basket, Lettuce, WateringCan } from './Props3'
import { INK, ease, pick, poseAt, seg } from './kit'
import { gaitOf, SQUAT, STAND } from './poses'
import { sideHand, type SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MEX = 120
const ROW = [168, 200, 232, 264]
const PULL = 5.6

export const garden: SceneDef = {
  id: 'garden',
  dur: 10,
  still: 4.0,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me)
    const x = t < 1.6 ? MEX - g.v * (1.6 - t) : t < 4.8 ? MEX : t < 5.4 ? MEX + (t - 4.8) * 50 : MEX + 30
    const water: SidePose = { ...STAND, lean: 10, armN: [64, 10] }
    const pull = (tt: number): SidePose => ({ ...SQUAT, armN: [70 - 30 * seg(tt, PULL + 0.3, PULL + 0.9), 20], head: 14 })
    const show: SidePose = { ...STAND, head: -4, armN: [64, 50] }
    const pose = poseAt(t, [[1.6, g.pose], [1.9, water], [4.6, water], [4.8, g.pose], [5.4, g.pose], [5.6, pull], [PULL + 1.0, pull], [7.0, STAND], [7.2, show], [8.8, show], [9.0, (tt: number) => ({ ...STAND, head: -8, armN: [80, 50] as [number, number], armF: [155 + 8 * Math.sin(tt * 9), 8] as [number, number], bob: -Math.abs(Math.sin(tt * 9)) * 4 })]])
    const grow = (i: number) => (i === 0 ? 1.1 : 0.4 + 0.8 * ease.back(seg(t, 2.4 + i * 0.4, 3.2 + i * 0.4)))
    const pulled = t > PULL + 0.6
    const lift = seg(t, PULL + 0.3, PULL + 0.9)
    const expr = pick<Expr>(t, [[0, 'happy'], [3, 'love'], [PULL, 'normal'], [PULL + 0.6, 'happy'], [7.2, 'love']])
    const top = GROUND - headH(me)
    const pour = t > 2.0 && t < 4.6
    return (
      <g>
        <Garden />
        {/* 빈 바구니는 처음부터 밭 옆 땅에 (뽑은 상추를 담고 들어 올림) */}
        {t < 6.8 && <g transform={`translate(${ROW[0] - 2} ${GROUND + 2}) scale(1.3)`}><Basket full={t > PULL + 0.6 ? 0.6 : 0} /></g>}
        {/* 물 다 준 뒤 물뿌리개는 땅에 내려놓음 */}
        {t >= 4.8 && <g transform={`translate(${MEX + 10} ${GROUND - 2}) scale(1.5)`}><WateringCan /></g>}
        {ROW.map((rx, i) => !(i === 0 && pulled) && <Lettuce key={i} x={rx} y={GROUND - 6 - (i === 0 ? lift * 16 : 0)} size={grow(i)} roots={i === 0 && lift > 0.2} />)}
        <Actor c={me} x={x} pose={pose} expr={expr} holding={t < 4.8 ? <g transform="scale(1.5)"><WateringCan pour={pour ? 1 : 0} /></g> : t > 6.8 ? <g transform="scale(1.3)"><Basket full={1} /></g> : undefined} caneLean={t > 1.8 && t < 6.9} />
        {/* 물 주기 (11-28 사용자: 디테일): 물뿌리개 꽃머리에서 여러 줄기로 쏟아지는 물 · 물방울 · 땅에 튀는 물 · 젖어 가는 흙 · 잎에 맺힌 물방울 · 작은 무지개 */}
        {t > 2.0 && (() => {
          const k = seg(t, 2.0, 4.6)
          return <g>
            <ellipse cx={ROW[0] + 6} cy={GROUND - 4} rx={8 + 22 * k} ry={2 + 2.4 * k} fill="#5A3A22" opacity={0.45 * Math.min(1, k * 2) * (t > 5.6 ? 1 - seg(t, 5.6, 7) * 0.5 : 1)} />
            {ROW.slice(0, 2).map((rx, i) => k > 0.3 + i * 0.2 && <g key={i}>{[[-4, -12], [3, -16], [6, -9]].map(([dx, dy], j) => <path key={j} transform={`translate(${rx + dx} ${GROUND + dy})`} d="M0 -2 Q1.4 0.4 0 1.4 Q-1.4 0.4 0 -2Z" fill="#BFE6F7" stroke="#3E8EBE" strokeWidth="0.5" />)}</g>)}
          </g>
        })()}
        {pour && (() => {
          const [hx, hy] = sideHand(me.outfit, me.age, water, 62)
          // 물뿌리개 꽃머리 위치 (손에서 주둥이 끝까지, 기울인 각도 반영)
          const sx = x + hx + 26, sy = GROUND + hy + 7
          const streams = [-6, -3, 0, 3, 6]
          return (
            <g>
              {streams.map((o, i) => {
                const ex = sx + 14 + o * 2.2, ey = GROUND - 6
                const d = `M${sx + o * 0.5} ${sy + o * 0.4} Q${sx + 10 + o} ${sy + 4} ${ex} ${ey}`
                return <g key={i}><path d={d} stroke="#9FD8F2" strokeWidth="1.6" fill="none" opacity="0.55" /><path d={d} stroke="#E6F7FF" strokeWidth="1.1" fill="none" strokeDasharray="3 5" strokeDashoffset={-t * 60 - i * 3} /></g>
              })}
              {Array.from({ length: 8 }, (_, i) => { const q = (t * 2.2 + i / 8) % 1, o = (i % 5) - 2; return <path key={i} transform={`translate(${sx + 4 + o * 3 + q * 12} ${sy + q * (GROUND - 6 - sy)})`} d="M0 -2.4 Q1.6 0.4 0 1.6 Q-1.6 0.4 0 -2.4Z" fill="#7FC6EA" stroke="#3E8EBE" strokeWidth="0.5" opacity={1 - q * 0.4} /> })}
              {[0, 1, 2].map((i) => { const q = (t * 3 + i / 3) % 1; return <ellipse key={i} cx={sx + 12 + (i - 1) * 7} cy={GROUND - 5} rx={2 + q * 5} ry={0.8 + q * 1.4} fill="none" stroke="#7FC6EA" strokeWidth="0.9" opacity={1 - q} /> })}
              {[[-3, -3], [3, -4], [6, -2]].map(([dx, dy], i) => { const q = (t * 3.4 + i * 0.3) % 1; return <circle key={i} cx={sx + 12 + dx * (1 + q)} cy={GROUND - 6 + dy * Math.sin(q * Math.PI) * 2} r="0.9" fill="#9FD8F2" opacity={1 - q} /> })}
              {/* 물보라 속 작은 무지개 */}
              <g opacity={0.35 * seg(t, 2.4, 3.0)}>{['#F2708A', '#FFD23F', '#7FBF6A', '#5E8FC9'].map((c, i) => <path key={c} d={`M${sx - 2} ${GROUND - 8} A${16 - i * 2} ${12 - i * 1.6} 0 0 1 ${sx + 30 - i * 4} ${GROUND - 8}`} stroke={c} strokeWidth="1.4" fill="none" />)}</g>
            </g>
          )
        })()}
        {/* 나비 (밭 위를 팔랑팔랑) */}
        {(() => { const bx = 200 + Math.sin(t * 0.9) * 60, by = 96 + Math.sin(t * 1.7) * 10, f = Math.abs(Math.sin(t * 14)); return <g transform={`translate(${bx} ${by})`}><ellipse cx="-2.4" cy="0" rx={3.4 * (0.3 + 0.7 * f)} ry="2.6" fill="#FFD23F" stroke={INK} strokeWidth="0.7" /><ellipse cx="2.4" cy="0" rx={3.4 * (0.3 + 0.7 * f)} ry="2.6" fill="#FFD23F" stroke={INK} strokeWidth="0.7" /><path d="M0 -2.4 V2.4 M0 -2.4 l-1.6 -2 M0 -2.4 l1.6 -2" stroke={INK} strokeWidth="0.7" /></g> })()}
        {[1, 2, 3].map((i) => <Sparkle key={i} t={t} t0={3.0 + i * 0.4} x={ROW[i]} y={GROUND - 30} />)}
        <Hearts t={t} t0={7.6} x={MEX + 30} y={top + 6} n={3} />
        <Bubble t={t} t0={3.2} t1={4.6} x={MEX + 30} y={top - 14} text="쑥쑥 자라라~" />
        <Bubble t={t} t0={7.3} t1={9.6} x={MEX + 40} y={top - 14} text="싱싱하다!" />
      </g>
    )
  },
}
