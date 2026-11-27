// 장면: 친구들과 노래방 (좋은 일 10초). 마이크 잡고 열창 → 고음 → 100점! → 다 같이 만세
import { Actor, castAt, GROUND, type SceneDef } from './Stage'
import { Karaoke } from './Backdrops2'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Notes } from './Fx2'
import { Mic, Sofa, Tambourine } from './Props2'
import { pick, poseAt } from './kit'
import { CHEER, SIT_LEGS, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MX = 62
const HIGH = 4.4 // 고음
const SCORE = 6.6

const sing = (tt: number): SidePose => ({ ...STAND, lean: 6 * Math.sin(tt * 3), head: -4 + 4 * Math.sin(tt * 6), armN: [62, 118], armF: [36 + 30 * Math.sin(tt * 3), 40], bob: Math.abs(Math.sin(tt * 6)) * 4, legN: [14 * Math.abs(Math.sin(tt * 6)), 26 * Math.abs(Math.sin(tt * 6)), 0], legF: [10 * Math.abs(Math.sin(tt * 6)), 22 * Math.abs(Math.sin(tt * 6)), 0] }) // 박자 맞춰 무릎 굽혔다 펴기
const high: SidePose = { ...STAND, lean: -12, head: -18, armN: [70, 120], armF: [150, 10] }
const seatClap = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 4 + 5 * Math.sin(tt * 4), head: 4 * Math.sin(tt * 8), armN: [55, 50 + 18 * Math.max(0, Math.sin(tt * 14))], armF: [55, 40 + 18 * Math.max(0, Math.sin(tt * 14))] })
// 탬버린: 한 손은 높이 들고 흔들고, 다른 손으로 박자 맞춰 탁탁
const tamb = (tt: number): SidePose => ({ ...STAND, lean: -4 + 4 * Math.sin(tt * 6), head: -10, armN: [118 + 8 * Math.sin(tt * 12), 14], armF: [92, 40 + 30 * Math.max(0, Math.sin(tt * 12))], bob: -Math.abs(Math.sin(tt * 6)) * 4 })
const seatCheer = (tt: number): SidePose => ({ ...SIT_LEGS, head: -10, armN: [155 + 8 * Math.sin(tt * 9), 8], armF: [145 + 8 * Math.sin(tt * 9 + 1), 8] })

export const karaoke: SceneDef = {
  id: 'karaoke',
  dur: 10,
  still: 3.2,
  draw: (t, cast) => {
    const me = cast[0], a = castAt(cast, 1), b = cast[2]
    const mePose = poseAt(t, [[0, STAND], [0.8, sing], [HIGH - 0.2, sing], [HIGH + 0.2, high], [5.6, high], [5.9, sing], [SCORE - 0.4, sing], [SCORE, STAND], [SCORE + 0.8, STAND], [SCORE + 1.1, CHEER]])
    const frPose = poseAt(t, [[0, seatClap], [SCORE + 0.8, seatClap], [SCORE + 1.1, seatCheer]])
    const meExpr = pick<Expr>(t, [[0, 'happy'], [HIGH, 'surprised'], [5.7, 'happy'], [SCORE, 'surprised'], [SCORE + 0.8, 'love'], [SCORE + 2, 'happy']])
    const frExpr = pick<Expr>(t, [[0, 'happy'], [HIGH, 'surprised'], [5.6, 'happy']])
    return (
      <g>
        <Karaoke t={t} spot={MX} score={t > SCORE + 0.8 ? '100점!' : t > SCORE ? '두구두구' : undefined} />
        <Sofa x={252} y={GROUND} w={110} color="#8A5AA8" />
        {b && <Actor c={b} x={298} y={GROUND - 6} size={58} flip pose={frPose} expr={frExpr} noCane />}
        <Actor c={a} x={254} flip pose={poseAt(t, [[0, tamb], [SCORE + 0.8, tamb], [SCORE + 1.1, CHEER]])} expr={frExpr} holding={t < SCORE + 0.9 ? <g transform="scale(1.15)"><Tambourine t={t} /></g> : undefined} noCane />
        {/* 찰랑찰랑 */}
        {t < SCORE && Math.sin(t * 12) > 0 && <g fill="#FFE27A" fontSize="10" textAnchor="middle"><text x={262} y={GROUND - 130}>찰랑찰랑</text><path d={`M214 ${GROUND - 112} l-6 -3 M212 ${GROUND - 104} l-7 0 M216 ${GROUND - 120} l-5 -5`} stroke="#FFE27A" strokeWidth="2" strokeLinecap="round" /></g>}
        <Actor c={me} x={MX} pose={mePose} expr={meExpr} holding={<Mic />} noCane />
        <Notes t={t} t0={0.9} t1={SCORE} x={MX + 30} y={GROUND - 96} n={4} light />
        {[0, 0.2, 0.4, 0.7].map((d, i) => <Sparkle key={i} t={t} t0={SCORE + 0.8 + d} x={[110, 210, 140, 190][i]} y={[30, 40, 100, 96][i]} s={1.2} />)}
        <Hearts t={t} t0={SCORE + 1.2} x={MX + 6} y={GROUND - 124} />
        <Bubble t={t} t0={HIGH} t1={5.7} x={MX + 40} y={GROUND - 124} text="♪~~~!" />
        <Bubble t={t} t0={SCORE + 1.4} t1={9.7} at={254} y={GROUND - 130} text="최고야!" tail="right" />
      </g>
    )
  },
}
