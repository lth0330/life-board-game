// 장면: 태풍 피해 (안 좋은 일 10.5초). 비바람 속 우산 들고 집으로 → 우산이 뒤집혀 날아감 → 지붕 기와가 "덜컹" 날아가 구멍이 남음
// → 부러진 나뭇가지가 날아와 창문에 부딪혀 "쨍!" (11-28 사용자: 원인이 보이게) → 흠뻑 젖어 "집이…"
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
const CRACK = 6.0 // 창문 깨짐 (나뭇가지가 부딪힘)

/** 부러진 나뭇가지 (잎 몇 장) */
function Branch() {
  return (
    <g strokeLinejoin="round">
      <path d="M-16 2 L14 -2 M-2 0 L6 -9 M4 -1 L10 6" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M-16 2 L14 -2 M-2 0 L6 -9 M4 -1 L10 6" stroke="#8A5A34" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-17 0 l-2 1 l2 1 l-2 2" stroke="#C9A06A" strokeWidth="1.2" fill="none" />
      {[[8, -11, 30], [14, -5, -20], [12, 8, 60], [-6, -4, -40]].map(([lx, ly, lr], i) => <ellipse key={i} cx={lx} cy={ly} rx="2.6" ry="4.6" fill={i % 2 ? '#6E9A62' : '#5E8A52'} stroke={INK} strokeWidth="0.9" transform={`rotate(${lr} ${lx} ${ly})`} />)}
    </g>
  )
}

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
        {/* 지붕 구멍: 기와가 떨어져 나간 자리에 어두운 속과 서까래, 깨진 기와 끝 */}
        {t > TILE + 0.15 && <g>
          <path d="M226 32 L236 29 L246 31 L254 35 L262 40 L268 48 L258 50 L250 48 L240 47 L230 44Z" fill="#2E2320" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M232 31 L244 47 M244 30 L256 49 M256 37 L264 49" stroke="#7A5232" strokeWidth="2.2" />
          <path d="M228 37 L265 44" stroke="#5A3A22" strokeWidth="1.2" />
          {[[226, 32, -20], [246, 31, 15], [262, 40, -10], [240, 47, 8]].map(([bx, by, r], i) => <path key={i} d="M-4 -2 L4 -3 L3 2 L-3 2Z" fill="#C9694F" stroke={INK} strokeWidth="1" transform={`translate(${bx} ${by}) rotate(${r})`} />)}
        </g>}
        {/* 깨진 창문: 가운데 구멍 · 금 · 떨어지는 유리 조각 */}
        {crack && <g>
          <path d="M272 104 L266 97 L270 99 L272 92 L275 99 L281 96 L278 102 L285 106 L278 107 L281 114 L274 110 L270 117 L269 109 L262 110 L267 105Z" fill="#3E4A56" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M272 92 L270 85 M281 96 L290 88 M285 106 L293 108 M281 114 L288 123 M270 117 L268 124 M262 110 L252 116 M266 97 L254 90" stroke={INK} strokeWidth="1.1" fill="none" />
          {[0, 1, 2, 3].map((i) => { const k = seg(t, CRACK, CRACK + 0.9); return k < 1 && <path key={i} d="M0 0 l4 -2 l-1 5Z" fill="#DFF3FB" stroke={INK} strokeWidth="0.7" transform={`translate(${266 + i * 5 + k * (6 + i * 3)} ${106 + k * k * (GROUND - 110)}) rotate(${k * (200 + i * 90)})`} /> })}
        </g>}
        {t < TILE + 1.6 && [0, 1].map((i) => <rect key={i} x={226 + i * 22 + tk * (120 + i * 30)} y={30 + i * 8 - Math.sin(tk * Math.PI) * 30 + tk * 10} width="18" height="8" rx="1.5" fill="#C9694F" stroke={INK} strokeWidth="1.4" transform={`rotate(${tk * (600 - i * 200)} ${235 + i * 22 + tk * (120 + i * 30)} ${34 + i * 8})`} />)}
        <Actor c={me} x={x} size={HOUSE_SIZE} pose={pose} expr={expr} holding={t < FLIP + 0.5 ? <g transform="scale(1.4)"><Umbrella flip={flip} /></g> : undefined} caneLean />
        {fly > 0 && fly < 1 && <g transform={`translate(${x + 20 + fly * 220} ${top - 10 - fly * 80}) rotate(${fly * 400})`}><Umbrella flip={1} /></g>}
        {/* 부러진 나뭇가지: 왼쪽에서 바람에 날아와 창문에 쾅 → 튕겨 땅에 떨어짐 */}
        {t > CRACK - 0.8 && (() => {
          const k = seg(t, CRACK - 0.8, CRACK), d = seg(t, CRACK, CRACK + 0.7)
          const bx = t < CRACK ? -30 + k * 296 : 266 + d * 18
          const by = t < CRACK ? 46 + k * 58 - Math.sin(k * Math.PI) * 30 : 104 + ease.in(d) * (GROUND - 108)
          const r = t < CRACK ? k * 540 : 540 + d * 120
          return <g transform={`translate(${bx} ${by}) rotate(${r})`}><Branch /></g>
        })()}
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
