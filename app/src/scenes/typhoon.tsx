// 장면: 태풍 피해 (안 좋은 일 10.5초). 비바람 속 우산 들고 집으로 → 우산이 뒤집혀 날아감 → 지붕 기와가 "덜컹" 날아감 → 창문 "쨍!" → 흠뻑 젖어 "집이…"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { HOUSE_SIZE, HouseFront } from './Backdrops3'
import { Bang, Bubble } from './Fx'
import { Exclaim, Gloom } from './Fx2'
import { Storm } from './Fx3'
import { Umbrella } from './Props3'
import { INK, ease, keys, pick, poseAt, seg, shakeT } from './kit'
import { gaitOf, HOLD_HEAD, SLUMP, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const FLIP = 3.0 // 우산 뒤집힘
const TILE = 4.6 // 기와 날아감
const CRACK = 6.0 // 창문 깨짐

export const typhoon: SceneDef = {
  id: 'typhoon',
  dur: 10.5,
  still: 6.4,
  draw: (t, cast) => {
    const me = cast[0]
    const g = gaitOf(me, 0.5 * HOUSE_SIZE / 62)
    const MEX = 110
    const x = t < FLIP ? MEX - g.v * (FLIP - t) : MEX - keys(t, [[FLIP, 0], [FLIP + 0.4, 10]], ease.out)
    // 바람을 맞으며 앞으로 숙여 걷기
    const push = (tt: number): SidePose => { const p = g.pose(tt); return { ...p, lean: (p.lean ?? 0) + 18, head: (p.head ?? 0) + 10, armN: [60, 60] } }
    const grab: SidePose = { ...STAND, lean: -10, head: -20, armN: [150, 20], armF: [130, 20] }
    const pose = poseAt(t, [[FLIP, push], [FLIP + 0.2, grab], [FLIP + 0.8, grab], [FLIP + 1.0, STAND], [TILE, STAND], [TILE + 0.3, HOLD_HEAD], [CRACK + 0.6, HOLD_HEAD], [7.2, SLUMP]])
    const expr = pick<Expr>(t, [[0, 'sad'], [FLIP, 'surprised'], [7.0, 'sad']])
    const flip = ease.back(seg(t, FLIP, FLIP + 0.3))
    // 우산: 뒤집힌 뒤 손을 떠나 오른쪽 위로 날아감
    const fly = seg(t, FLIP + 0.5, FLIP + 1.6)
    const top = GROUND - headH(me, HOUSE_SIZE)
    // 기와: 지붕에서 떨어져 나와 바람에 날아감
    const tk = seg(t, TILE, TILE + 1.4)
    const crack = t > CRACK
    return (
      <g transform={shakeT(t, CRACK, 0.35, 4)}>
        <HouseFront stormy={1} />
        {/* 깨진 창문 */}
        {crack && <path d="M262 90 l9 9 l-5 7 l10 10 M271 99 l12 -5 M266 106 l-7 8 M258 112 l7 -10" stroke={INK} strokeWidth="1.8" fill="none" />}
        {t < TILE + 1.6 && [0, 1].map((i) => <rect key={i} x={226 + i * 22 + tk * (120 + i * 30)} y={30 + i * 8 - Math.sin(tk * Math.PI) * 30 + tk * 10} width="18" height="8" rx="1.5" fill="#C9694F" stroke={INK} strokeWidth="1.4" transform={`rotate(${tk * (600 - i * 200)} ${235 + i * 22 + tk * (120 + i * 30)} ${34 + i * 8})`} />)}
        <Actor c={me} x={x} size={HOUSE_SIZE} pose={pose} expr={expr} holding={t < FLIP + 0.5 ? <g transform="scale(1.4)"><Umbrella flip={flip} /></g> : undefined} caneLean />
        {fly > 0 && fly < 1 && <g transform={`translate(${x + 20 + fly * 220} ${top - 10 - fly * 80}) rotate(${fly * 400})`}><Umbrella flip={1} /></g>}
        <Storm t={t} />
        <Exclaim t={t} t0={FLIP + 0.1} x={x - 20} y={top + 4} />
        <Bang t={t} t0={TILE} x={180} y={30} text="덜컹!" size={15} color="#7A4A2A" dur={0.9} />
        <Bang t={t} t0={CRACK} x={272} y={78} text="쨍!" size={16} color="#5E8FC9" dur={0.9} />
        <Gloom t={t} t0={7.6} x={x - 10} y={top - 6} />
        <Bubble t={t} t0={FLIP + 0.3} t1={4.4} x={x + 40} y={top - 14} text="내 우산!" />
        <Bubble t={t} t0={7.4} t1={10.3} x={x + 40} y={top - 14} text="집이…" />
      </g>
    )
  },
}
