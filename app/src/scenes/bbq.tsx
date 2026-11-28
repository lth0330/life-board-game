// 장면: 친구들과 맛집 (어른, 11초, 11-28). 고깃집 불판에 고기 "지글지글" → 집게로 뒤집기(색이 익어 감)
// → 친구가 상추쌈 싸서 냠 → 나도 한 쌈 "음~ 맛있다!" → 음료 잔 "짠!"
import { Actor, GROUND, headH, type Cast, type SceneDef } from './Stage'
import { Restaurant } from './Backdrops'
import { Stool, Table } from './Props'
import { Grill, Tongs, Wrap } from './Props4'
import { Bang, Bubble, Hearts, Sparkle } from './Fx'
import { INK, pick, poseAt, seg } from './kit'
import { SIT_LEGS, sitLift } from './poses'
import { pal } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const TH = 32, TOP = GROUND - TH - 7
const FLIP = 2.0, FR_EAT = 4.4, ME_EAT = 6.0, CHEERS = 8.4
const MX = 96, FX = 228
const lift = (c: Cast) => sitLift(c, 28)

// 사이다 잔 (손에 쥠)
const Glass = () => <g><path d="M-4 0 L-5 -12 H5 L4 0Z" fill="#E6F4FB" stroke={INK} strokeWidth="1" opacity="0.95" /><path d="M-4.4 -8 H4.4 L4 0 H-4Z" fill="#CFEFD8" /><circle cx="-1" cy="-5" r="0.7" fill="#fff" /><circle cx="1.6" cy="-3" r="0.6" fill="#fff" /></g>

export const bbq: SceneDef = {
  id: 'bbq',
  dur: 11,
  still: 6.6,
  draw: (t, cast) => {
    const me = cast[0], fr = pal(cast, 1)
    const cook = seg(t, FLIP, FLIP + 2.4)
    const sit = (armN: [number, number], lean = 6, head = 0): SidePose => ({ ...SIT_LEGS, lean, head, armN, armF: [30, 56] })
    // 나: 집게로 뒤집기 → 쌈 들고 입으로 → 잔
    const flip = (tt: number): SidePose => sit([92 + 8 * Math.sin(tt * 6), 26 + 10 * Math.max(0, Math.sin(tt * 6))], 14, 10)
    const mePose = poseAt(t, [[0, sit([40, 60])], [FLIP - 0.3, sit([40, 60])], [FLIP, flip], [FR_EAT - 0.2, flip], [FR_EAT, sit([40, 60])], [ME_EAT - 0.4, sit([70, 40])], [ME_EAT, sit([62, 112], 0, -4)], [ME_EAT + 1.2, sit([30, 70], -4, -6)], [CHEERS - 0.3, sit([30, 70])], [CHEERS, sit([110, 20], 4, -8)], [CHEERS + 1, sit([110, 20], 4, -8)], [CHEERS + 1.3, sit([40, 60])]])
    const frPose = poseAt(t, [[0, sit([40, 60])], [FR_EAT - 0.6, sit([70, 40])], [FR_EAT, sit([62, 112], 0, -4)], [FR_EAT + 1.2, sit([30, 70], -4, -6)], [CHEERS - 0.3, sit([30, 70])], [CHEERS, sit([110, 20], 4, -8)], [CHEERS + 1, sit([110, 20], 4, -8)], [CHEERS + 1.3, sit([40, 60])]])
    const meHold = t > FLIP - 0.3 && t < FR_EAT ? <g transform="scale(1.4)"><Tongs pinch={Math.max(0, Math.sin(t * 6))} /></g>
      : t > ME_EAT - 0.4 && t < ME_EAT + 0.5 ? <g transform="scale(1.6)"><Wrap /></g>
      : t > CHEERS - 0.3 && t < CHEERS + 1.3 ? <g transform="scale(1.6)"><Glass /></g> : undefined
    const frHold = t > FR_EAT - 0.6 && t < FR_EAT + 0.5 ? <g transform="scale(1.6)"><Wrap /></g> : t > CHEERS - 0.3 && t < CHEERS + 1.3 ? <g transform="scale(1.6)"><Glass /></g> : undefined
    const chew = (t0: number) => t > t0 + 0.4 && t < t0 + 1.6
    const meExpr = pick<Expr>(t, [[0, 'happy'], [FLIP, 'normal'], [ME_EAT + 0.3, 'love'], [CHEERS, 'happy']])
    const frExpr = pick<Expr>(t, [[0, 'happy'], [FR_EAT + 0.3, 'love'], [FR_EAT + 1.6, 'happy']])
    const meTop = GROUND - lift(me) - (headH(me) - 22), frTop = GROUND - lift(fr) - (headH(fr) - 22)
    return (
      <g>
        <Restaurant menu={['삼겹살', '목살', '된장찌개']} prices={['15,000', '16,000', '8,000']} />
        <Stool x={MX - 6} y={GROUND} h={28 + lift(me)} />
        <Stool x={FX + 6} y={GROUND} color="#5E8FC9" h={28 + lift(fr)} />
        <Actor c={me} x={MX} y={GROUND - lift(me) - (chew(ME_EAT) ? 1.5 * Math.max(0, Math.sin(t * 18)) : 0)} pose={mePose} expr={meExpr} holding={meHold} noCane />
        <Actor c={fr} x={FX} y={GROUND - lift(fr) - (chew(FR_EAT) ? 1.5 * Math.max(0, Math.sin(t * 18)) : 0)} flip pose={frPose} expr={frExpr} holding={frHold} noCane />
        <Table x={162} y={GROUND} w={150} h={TH} />
        <g transform={`translate(162 ${TOP}) scale(1.25) translate(-162 ${-TOP})`}><Grill x={162} y={TOP} t={t} cook={cook} /></g>
        {/* 상추 바구니 · 쌈장 · 반찬 */}
        <g transform={`translate(118 ${TOP})`}><path d="M-10 0 L-8 -6 H8 L10 0Z" fill="#C98B55" stroke={INK} strokeWidth="1" />{[-6, 0, 6].map((k) => <path key={k} d={`M${k - 4} -6 Q${k} -14 ${k + 4} -6`} fill="#7FBF6A" stroke={INK} strokeWidth="0.8" />)}</g>
        <g transform={`translate(206 ${TOP})`}><ellipse cy="-1.5" rx="7" ry="2" fill="#fff" stroke={INK} strokeWidth="0.9" /><ellipse cy="-2.4" rx="4" ry="1.2" fill="#B5452F" /></g>
        <g transform={`translate(196 ${TOP})`}><ellipse cy="-1.5" rx="6" ry="1.8" fill="#fff" stroke={INK} strokeWidth="0.9" /><path d="M-3 -2 q3 -3 6 0" stroke="#E0533F" strokeWidth="2" fill="none" /></g>
        <Bang t={t} t0={0.4} x={162} y={TOP - 30} text="지글지글" size={13} color="#E0833F" dur={1.4} />
        <Bang t={t} t0={CHEERS + 0.1} x={162} y={meTop - 4} text="짠!" size={18} color="#2E6FD8" dur={0.9} />
        <Sparkle t={t} t0={CHEERS + 0.1} x={162} y={meTop + 14} />
        <Hearts t={t} t0={ME_EAT + 0.6} x={MX + 10} y={meTop + 4} n={2} />
        <Bubble t={t} t0={0.5} t1={FLIP} at={MX + 2} y={meTop - 12} text="잘 익어라~" />
        <Bubble t={t} t0={FR_EAT + 0.5} t1={ME_EAT - 0.2} at={FX} tail="right" y={frTop - 12} text="이 집 진짜 맛집이다!" size={12} />
        <Bubble t={t} t0={ME_EAT + 0.5} t1={CHEERS - 0.2} at={MX + 2} y={meTop - 12} text="음~ 맛있다!" />
        <Bubble t={t} t0={CHEERS + 1.2} t1={10.9} at={FX} tail="right" y={frTop - 12} text="또 오자!" />
      </g>
    )
  },
}
