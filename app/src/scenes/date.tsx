// 장면: 데이트 (좋은 일 13초, 11-28 다시 다듬음). 밝을 때 공원을 나란히 걷다 → 노을 지고 어두워짐 → 가로등이 켜짐 → 그 아래 멈춰 마주 봄 → "저기…" (등 뒤에 선물 상자)
// → "너 주려고 샀어" 리본 상자를 건넴 → "고마워!" → 상자를 열면 목도리 → 목에 둘러 봄 "와, 따뜻하다!" → "잘 어울려!" 하트
// (11-28 사용자: 남자·여자 누가 받아도 어색하지 않은 선물로)
import { Actor, GROUND, headH, partnerOf, type SceneDef } from './Stage'
import { Park } from './Backdrops2'
import { Lamp } from './Nature'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Petals } from './Fx3'
import { INK, ease, pick, poseAt, seg } from './kit'
import { gaitOf, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

/** 선물 상자 (리본). open 0~1 = 뚜껑이 열림 */
function GiftBox({ open = 0, empty }: { open?: number; empty?: boolean }) {
  const lid = ease.out(open)
  return (
    <g transform="translate(0 -2)">
      {open > 0.3 && !empty && <g transform={`translate(0 ${-13 - 4 * lid})`}><Scarf s={0.8} /></g>}
      <rect x="-8" y="-12" width="16" height="12" rx="1.5" fill="#F2708A" stroke={INK} strokeWidth="1.4" />
      <rect x="-1.6" y="-12" width="3.2" height="12" fill="#FFE27A" />
      <g transform={`translate(${lid * 10} ${-12 - lid * 10}) rotate(${lid * 40})`}>
        <rect x="-9" y="-3.5" width="18" height="4" rx="1.2" fill="#F7A3B8" stroke={INK} strokeWidth="1.3" />
        <rect x="-1.6" y="-3.5" width="3.2" height="4" fill="#FFE27A" />
        <path d="M0 -3.5 q-6 -6 -6 -1 q0 3 6 1 q6 2 6 -1 q0 -5 -6 1Z" fill="#FFE27A" stroke={INK} strokeWidth="1" />
      </g>
    </g>
  )
}
/** 접힌 목도리 (상자 안 · 손에 듦) */
function Scarf({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M-9 -4 Q0 -8 9 -4 L9 3 Q0 -1 -9 3Z" fill="#E0533F" stroke={INK} strokeWidth="1.1" />
      <path d="M-5 -6 V2 M0 -7 V1 M5 -6 V2" stroke="#F7A3B8" strokeWidth="1" />
      <path d="M9 0 l2 6 M7 1 l1 6" stroke="#E0533F" strokeWidth="1.2" />
    </g>
  )
}

const STOP = 4.8, LIT = 4.0, HIDE = 5.4, OFFER = 6.6, TAKE = 8.0, OPEN = 9.0, SHOW = 10.0 // 11-28 사용자: 걷다가 어두워지고 가로등 아래에서 선물
const MEX = 116, PX = 176, LAMP_X = 92 // 가로등: 기둥은 왼쪽, 전구는 두 사람 사이 위

export const date: SceneDef = {
  id: 'date',
  dur: 13,
  still: OPEN + 0.6,
  draw: (t, cast) => {
    const me = cast[0], pa = partnerOf(me)
    const g = gaitOf(me), gp = gaitOf(pa)
    const cam = t < STOP ? t * g.v : STOP * g.v
    const shy: SidePose = { ...STAND, head: 10, armN: [30, 100], armF: [26, 100] }
    const behind: SidePose = { ...STAND, head: 8, armN: [-40, 40], armF: [-30, 40] } // 선물을 등 뒤에 숨김
    const offer: SidePose = { ...STAND, lean: 8, head: 6, armN: [76, 16], armF: [70, 20] }
    const take: SidePose = { ...STAND, lean: 4, armN: [70, 20], armF: [62, 24] }
    const hold: SidePose = { ...STAND, head: 12, armN: [52, 60], armF: [46, 64] } // 상자를 가슴 앞에서 봄
    const wrap = (tt: number): SidePose => ({ ...STAND, head: 6, armN: [70, 120 + 8 * Math.sin(tt * 10)], armF: [62, 120] }) // 목도리를 목에 두름
    const cozy: SidePose = { ...STAND, head: -4, armN: [40, 100], armF: [34, 100] } // 목도리를 감싸 쥠
    const mePose = poseAt(t, [[STOP, g.pose], [STOP + 0.3, shy], [TAKE - 0.4, shy], [TAKE, take], [TAKE + 0.4, take], [TAKE + 0.8, hold], [SHOW, hold], [SHOW + 0.3, wrap], [SHOW + 1.1, wrap], [SHOW + 1.4, cozy]])
    const paPose = poseAt(t, [[STOP, (tt) => ({ ...gp.pose(tt + 0.3), armN: [-40, 40] })], [STOP + 0.3, behind], [OFFER - 0.2, behind], [OFFER + 0.2, offer], [TAKE + 0.2, offer], [TAKE + 0.6, shy]])
    const facing = t > STOP + 0.2
    const meExpr = pick<Expr>(t, [[0, 'happy'], [STOP, 'normal'], [OFFER, 'surprised'], [TAKE, 'happy'], [OPEN + 0.3, 'surprised'], [SHOW, 'love']])
    const paExpr = pick<Expr>(t, [[0, 'happy'], [HIDE, 'love']])
    const given = t > TAKE + 0.2
    const open = seg(t, OPEN, OPEN + 0.6)
    const top = GROUND - headH(me), ptop = GROUND - headH(pa)
    // 하늘: 낮 → 노을(1.2~3.6초) → 저녁(3.6~5.2초). 가로등은 LIT에 깜빡이며 켜짐
    const dusk = seg(t, 1.2, 3.6), night = seg(t, 3.2, 5.2)
    const lampOn = t > LIT + 0.35 || (t > LIT && Math.sin(t * 70) > 0)
    const lampX = LAMP_X + STOP * g.v - cam
    const meHold = !given ? undefined : t < SHOW + 0.2 ? <g transform="scale(1.4)"><GiftBox open={open} /></g> : t < SHOW + 0.9 ? <g transform="scale(1.6)"><Scarf /></g> : undefined
    // 목도리를 두르면 내 옷에 목도리가 생김
    const meDressed = t > SHOW + 0.9 ? { ...me, outfit: { ...me.outfit, acc3: 'scarf', acc3Color: '#E0533F' } } : me
    return (
      <g>
        <Park cam={cam} sunset={dusk * (1 - night * 0.85)} />
        {/* 노을 → 저녁 (하늘·땅이 어두워지고 별·달) */}
        <rect width="320" height="122" fill="#FF9E6E" opacity={0.22 * dusk * (1 - night)} />
        <rect width="320" height="180" fill="#1E2A50" opacity={0.42 * night} />
        {night > 0.4 && <g opacity={seg(night, 0.4, 1)}>{[[30, 18], [80, 32], [126, 12], [210, 24], [262, 10], [300, 36]].map(([sx, sy], i) => <path key={i} d={`M${sx} ${sy - 2.4} l0.7 1.7 l1.7 0.7 l-1.7 0.7 l-0.7 1.7 l-0.7 -1.7 l-1.7 -0.7 l1.7 -0.7z`} fill="#FFF3C0" opacity={0.6 + 0.4 * Math.sin(t * 3 + i)} />)}<circle cx="272" cy="30" r="8" fill="#FFF3C0" /><circle cx="268" cy="27" r="7" fill="#3A3A66" opacity="0.55" /></g>}
        {/* 가로등: 걸어가면 다가와서 두 사람 사이 위에 섬 → 켜지면 불빛 고깔 · 땅에 둥근 빛 */}
        {/* 사람보다 키 큰 가로등 (전구가 머리 위) */}
        <g transform={`translate(${lampX} ${GROUND - 2}) scale(1.75) translate(${-lampX} ${-(GROUND - 2)})`}><Lamp x={lampX} y={GROUND - 2} on={lampOn} /></g>
        {lampOn && (() => {
          const bx = lampX + 17.5, by = GROUND - 2 - 65 * 1.75
          return <g>
            <circle cx={bx} cy={by + 2} r="12" fill="#FFF3A6" opacity="0.4" />
            <path d={`M${bx - 6} ${by + 4} L${bx - 58} ${GROUND + 6} H${bx + 58} L${bx + 6} ${by + 4}Z`} fill="#FFF3A6" opacity="0.2" />
            <ellipse cx={bx} cy={GROUND + 4} rx="60" ry="7" fill="#FFF3A6" opacity="0.35" />
          </g>
        })()}
        <Actor c={pa} x={PX} pose={paPose} expr={paExpr} flip={facing} holding={!given && t > STOP ? <g transform="scale(1.4)"><GiftBox /></g> : undefined} caneLean={facing} />
        <Actor c={meDressed} x={MEX} pose={mePose} expr={meExpr} holding={meHold} caneLean={facing} />
        {/* 다 연 상자는 발밑에 */}
        {t > SHOW + 0.2 && <g transform={`translate(${MEX - 30} ${GROUND}) scale(1.3)`}><GiftBox open={1} empty /></g>}
        {[0, 0.15, 0.3].map((d, i) => <Sparkle key={i} t={t} t0={OPEN + 0.4 + d} x={MEX + 30 + i * 8} y={top + 30 - i * 6} />)}
        <Sparkle t={t} t0={SHOW + 0.6} x={MEX + 34} y={top + 6} s={1.2} />
        <Hearts t={t} t0={SHOW + 0.5} x={(MEX + PX) / 2} y={Math.min(top, ptop) + 6} n={4} />
        <Petals t={t} t0={SHOW + 0.4} n={10} />
        <Bubble t={t} t0={0.6} t1={2.2} at={PX} tail="right" y={ptop - 14} text="날씨 좋다~" />
        <Bubble t={t} t0={2.8} t1={4.3} at={MEX + 2} y={top - 14} text="벌써 어두워졌네" />
        <Bubble t={t} t0={HIDE} t1={OFFER} at={PX} tail="right" y={ptop - 14} text="저기…" />
        <Bubble t={t} t0={OFFER + 0.1} t1={TAKE} at={PX} tail="right" y={ptop - 14} text="너 주려고 샀어" />
        <Bubble t={t} t0={TAKE} t1={OPEN} at={MEX + 2} y={top - 14} text="정말? 고마워!" />
        <Bubble t={t} t0={SHOW + 0.2} t1={11.5} at={MEX + 2} y={top - 14} text="와, 따뜻하다!" />
        <Bubble t={t} t0={11.5} t1={12.9} at={PX} tail="right" y={ptop - 14} text="잘 어울려!" />
      </g>
    )
  },
}
