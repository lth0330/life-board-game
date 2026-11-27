// 장면: 감기에 걸려 병원에 감 (안 좋은 일 13.5초)
// 콜록이며 들어와 앉음 → 흐…흐…에취! → 코 풀기 → 체온 38.5℃ → "다음 분~" → 진료실 → 약 봉투 들고 나와 "콜록…"
import { Actor, GROUND, headH, isKid, type SceneDef } from './Stage'
import { Clinic, Bench } from './Backdrops2'
import { coldKid } from './coldKid'
import { Bang, Bubble, Sweat } from './Fx'
import { Puff, Shiver } from './Fx2'
import { Thermo, Tissue } from './Props2'
import { INK, pick, poseAt } from './kit'
import { gaitOf, SIT, SIT_LEGS, sitLift } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BX = 130 // 의자 자리
const SNEEZE = 4.2
const DOOR = 284 // 진료실 문 가운데
const IN = 11.0 // 진료실로 들어감
const OUTT = 12.0 // 약 봉투 들고 나옴

/** 약 봉투 (손에 듦) */
const MedBag = () => (
  <g transform="translate(0 2)">
    <rect x="-8" y="0" width="16" height="18" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" />
    <path d="M0 5 V13 M-4 9 H4" stroke="#7FBF6A" strokeWidth="2.4" />
  </g>
)

export const cold: SceneDef = {
  id: 'cold',
  dur: 13.5,
  still: 6.8,
  draw: (t, cast, text) => {
    const me = cast[0]
    if (isKid(me)) return coldKid.draw(t, cast, text) // 아이는 집에서 누워 (11-28 사용자)
    const g = gaitOf(me, 0.7)
    const slow = gaitOf(me, 0.5) // 터벅터벅
    const shake = t < 9.4 ? Math.sin(t * 34) * 0.8 : 0 // 덜덜
    const coughing = t > 1.2 && t < 2.3
    const walkIn = (tt: number): SidePose => { const p = g.pose(tt); return coughing ? { ...p, armN: [62, 120], head: 8 + 4 * Math.sin(tt * 20) } : p }
    const trudge = (tt: number): SidePose => { const p = slow.pose(tt); return { ...p, lean: (p.lean ?? 0) + 8, head: (p.head ?? 0) + 14 } }
    const x = t < 2.6 ? BX - g.v * (2.6 - t) : t < 9.4 ? BX : t < IN ? BX + (t - 9.4) * ((DOOR - BX) / (IN - 9.4)) : t < OUTT ? DOOR : DOOR - Math.min(t - OUTT, 1.2) * slow.v
    const seat: SidePose = { ...SIT, armN: [36, 70], armF: [30, 70] } // 팔 감싸 안기 (추움)
    const STANDS: SidePose = { lean: 8, head: 14, armN: [20, 30], armF: [-4, 8], legN: [0, 0, 0], legF: [0, 0, 0] }
    const pose = poseAt(t, [
      [2.6, walkIn], [3.1, seat],
      [3.35, seat], [4.05, { ...SIT_LEGS, lean: -14, head: -20, armN: [40, 60], armF: [30, 60] }], // 흐…흐… (뒤로 젖힘)
      [SNEEZE + 0.12, { ...SIT_LEGS, lean: 26, head: 18, armN: [64, 118], armF: [30, 60] }], [SNEEZE + 0.6, { ...SIT_LEGS, lean: 22, head: 16, armN: [64, 118], armF: [30, 60] }], // 에취!
      [4.9, { ...SIT_LEGS, lean: 6, head: 6, armN: [64, 122], armF: [30, 60] }], [6.1, { ...SIT_LEGS, lean: 6, head: 6, armN: [64, 122], armF: [30, 60] }], // 코 풀기
      [6.3, { ...SIT_LEGS, lean: 2, head: 2, armN: [58, 120], armF: [36, 70] }], [8.3, { ...SIT_LEGS, lean: 2, head: 2, armN: [58, 120], armF: [36, 70] }], // 체온계
      [8.5, seat], [9.2, seat], [9.6, trudge], [OUTT, trudge], [OUTT + 1.2, trudge], [OUTT + 1.4, STANDS],
    ])
    const expr = pick<Expr>(t, [[0, 'sad'], [3.4, 'surprised'], [SNEEZE + 0.4, 'sad'], [8.3, 'surprised'], [8.9, 'sad']])
    const holding = t > 4.8 && t < 6.15 ? <Tissue /> : t > 6.25 && t < 8.35 ? <g transform="scale(1.6)"><Thermo /></g> : t > OUTT ? <MedBag /> : undefined
    const seated = t > 2.7 && t < 9.3
    const top = GROUND - (seated ? sitLift(me, 30) + headH(me) - 22 : headH(me)) // 머리 꼭대기
    const inside = t > IN && t < OUTT // 진료실 안 (안 보임)
    const doorOpen = t > IN - 0.3 && t < OUTT + 0.4
    const fade = 1
    return (
      <g>
        <Clinic sign="내과" open={doorOpen} />
        <Bench x={BX - 4} y={GROUND} n={3} />
        {!inside && (
          <g transform={`translate(${shake} 0)`} opacity={fade}>
            <Actor c={me} x={x} y={GROUND - (seated ? sitLift(me, 30) : 0)} pose={pose} expr={expr} holding={holding} flip={t > OUTT} noCane={t > 4.7 && t < 8.4} caneLean={seated} />
          </g>
        )}
        {t < 9.4 && <Shiver t={t} x={x + 4} y={top + 20} />}
        <Bang t={t} t0={SNEEZE} x={BX + 72} y={top + 4} text="에취!" size={20} dur={1.0} />
        <Puff t={t} t0={SNEEZE + 0.05} x={BX + 30} y={top + 40} />
        {/* 체온계 숫자는 체온계 옆에 */}
        {t > 6.9 && t < 8.35 && <g transform={`translate(${BX + 44} ${top + 30})`}><rect x="-22" y="-10" width="44" height="17" rx="5" fill="#fff" stroke={INK} strokeWidth="1.6" /><text textAnchor="middle" y="3" fontSize="12" fill="#E0533F">38.5℃</text></g>}
        <Sweat t={t} t0={7.0} x={BX + 22} y={top + 20} dur={1.3} />
        <Puff t={t} t0={OUTT + 0.5} x={x - 26} y={top + 40} dir={-1} />
        <Bubble t={t} t0={1.2} t1={2.4} x={x + 46} y={top - 14} text="콜록콜록" />
        <Bubble t={t} t0={3.4} t1={4.15} x={BX + 50} y={top - 12} text="흐…흐…" />
        <Bubble t={t} t0={5.0} t1={6.0} x={BX + 50} y={top - 12} text="팽~" />
        <Bubble t={t} t0={8.3} t1={9.6} x={208} y={36} text="다음 분~" tail="right" />
        <Bubble t={t} t0={OUTT + 0.4} t1={13.4} x={x - 40} y={top - 14} text="콜록…" tail="right" />
      </g>
    )
  },
}
