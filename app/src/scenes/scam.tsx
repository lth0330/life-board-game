// 장면: 보이스피싱(13.5초)·중고 사기(10.5초) (안 좋은 일)
// 중고 사기: 택배 상자를 신나게 열었더니 돌멩이 → "돌…?!" → 전화해도 "연락이 안 돼…"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bang, Bubble, Dust, Sweat } from './Fx'
import { Exclaim, Gloom, MoneyFly } from './Fx2'
import { Phone, Sofa, SofaBack } from './Props2'
import { Brick, Parcel } from './Props3'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { HOLD_HEAD, SIT, sitLift, SLUMP, SQUAT, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const MEX = 130

export const scamUsed: SceneDef = {
  id: 'scamUsed',
  dur: 10.5,
  still: 5.0,
  draw: (t, cast) => {
    const me = cast[0]
    const top = GROUND - headH(me)
    const ear: SidePose = { ...STAND, armN: [56, 128], head: 4 } // 전화기를 귀에
    const open = ease.out(seg(t, 2.6, 3.4))
    const pose = poseAt(t, [[0, STAND], [1.4, STAND], [1.9, SQUAT], [2.4, { ...SQUAT, armN: [60, 20], armF: [50, 20] }], [3.6, { ...SQUAT, armN: [60, 20], armF: [50, 20] }], [4.0, { ...STAND, lean: 4, head: 16, armN: [56, 66], armF: [50, 66] }], [5.0, { ...STAND, lean: 4, head: 16, armN: [56, 66], armF: [50, 66] }], [5.35, { ...STAND, lean: 44, head: 14, armN: [40, 8], armF: [30, 10], legN: [20, 30, 0], legF: [10, 20, 0] }], [5.6, { ...STAND, lean: 44, head: 14, armN: [40, 8], armF: [30, 10], legN: [20, 30, 0], legF: [10, 20, 0] }], [5.95, STAND], [6.2, ear], [8.0, ear], [8.4, SLUMP]]) // 벽돌을 허리 숙여 바닥에 내려놓음
    const expr = pick<Expr>(t, [[0, 'happy'], [3.6, 'surprised'], [5.6, 'sad']])
    return (
      <g>
        <Home />
        <Parcel x={MEX + 50} y={GROUND} open={open} />
        <Actor c={me} x={MEX} pose={pose} expr={expr} holding={t > 3.5 && t < 5.5 ? <g transform="rotate(-10) scale(1.3)"><Brick /></g> : t > 6.0 && t < 8.2 ? <g transform="rotate(-70)"><Phone /></g> : undefined} caneLean />
        <Exclaim t={t} t0={3.5} x={MEX + 50} y={GROUND - 60} text="!?" />
        <Sweat t={t} t0={4.2} x={MEX - 14} y={top + 16} />
        {t > 5.5 && <g transform={`translate(${MEX + 34} ${GROUND + 1}) scale(1.2)`}><ellipse cy="-1" rx="14" ry="2.5" fill="rgba(42,33,24,0.2)" /><Brick /></g>}
          <Bang t={t} t0={5.5} x={MEX + 50} y={GROUND - 22} text="툭" size={11} color="#7A4A2A" dur={0.6} />
          <Dust t={t} t0={5.5} x={MEX + 34} y={GROUND} n={3} spread={12} />
        <Gloom t={t} t0={8.4} x={MEX + 4} y={top - 16} />
        <Bubble t={t} t0={0.3} t1={1.6} x={MEX + 30} y={top - 14} text="드디어 왔다!" />
        <Bubble t={t} t0={4.0} t1={5.4} x={MEX + 40} y={top - 14} text="벽돌…?!" />
        <Bubble t={t} t0={6.4} t1={8.4} at={MEX + 8} y={top - 14} text="연락이 안 돼…" />
      </g>
    )
  },
}

// 보이스피싱 (노인, 13초, 11-28 사용자: 중간 단계를 빼먹지 않게)
// 소파에서 쉬는데 모르는 번호로 "따르릉" → 받음 → "은행입니다. 고객님 계좌가 해킹됐어요!" → "네?! 어떡해요?" (벌떡)
// → "안전한 계좌로 옮기세요, 지금 바로요!" → 망설임 "그, 그래도…" → "빨리요! 돈이 다 사라져요!" → 폰으로 이체 (화면)
// → 돈이 날아감 → "뚝" 끊김 → 다시 걸어 보니 "없는 번호입니다" → "속았다…"
const SOFA = 92
const RING = 0.2, PICK = 1.2, SCARED = 3.6, ORDER = 4.8, DOUBT = 6.6, RUSH = 7.6, SEND = 8.6, CUT = 10.0, RECALL = 11.4, REAL = 13.6 // 끝부분은 천천히 (11-28 사용자)
export const scam: SceneDef = {
  id: 'scam',
  dur: 15,
  still: SEND + 0.6,
  draw: (t, cast) => {
    const me = cast[0]
    const seatY = GROUND - sitLift(me, 30)
    const seated = t < SCARED + 0.2
    const top = seated ? seatY - (headH(me) - 22) : GROUND - headH(me)
    const x = seated ? SOFA + 6 : keys(t, [[SCARED + 0.2, SOFA + 40], [SCARED + 0.7, SOFA + 92]])
    const sitIdle: SidePose = { ...SIT, armN: [30, 50], armF: [24, 50] }
    const sitEar: SidePose = { ...SIT, armN: [56, 128], head: 4 }
    const ear: SidePose = { ...STAND, armN: [56, 128], head: 4 }
    const earWorry = (tt: number): SidePose => ({ ...ear, lean: 6, head: 10 + 3 * Math.sin(tt * 5), armF: [30, 90] })
    const doubt: SidePose = { ...STAND, armN: [56, 128], head: 14, lean: 4, armF: [40, 110] } // 한 손 입에 대고 망설임
    const tap: SidePose = { ...STAND, lean: 10, head: 18, armN: [60, 70], armF: [50, 60] } // 화면 보며 이체
    const pose = poseAt(t, [[0, sitIdle], [PICK - 0.3, sitIdle], [PICK, sitEar], [SCARED, sitEar], [SCARED + 0.3, ear], [ORDER, ear], [ORDER + 0.3, earWorry], [DOUBT, earWorry], [DOUBT + 0.3, doubt], [RUSH, doubt], [RUSH + 0.3, earWorry], [SEND - 0.2, earWorry], [SEND, tap], [CUT - 0.3, tap], [CUT, ear], [RECALL - 0.3, ear], [RECALL, tap], [RECALL + 0.5, tap], [RECALL + 0.8, ear], [REAL - 0.2, ear], [REAL, HOLD_HEAD], [14.2, HOLD_HEAD], [14.5, SLUMP]])
    const expr = pick<Expr>(t, [[0, 'happy'], [RING, 'surprised'], [PICK + 0.4, 'normal'], [PICK + 1.4, 'surprised'], [DOUBT, 'sad'], [RUSH, 'surprised'], [SEND, 'sad'], [CUT, 'surprised'], [REAL, 'sad']])
    const ringing = t > RING && t < PICK - 0.2
    const phoneHeld = t > PICK - 0.2 && t < REAL
    const phone = phoneHeld ? <g transform={(t > SEND - 0.1 && t < CUT - 0.2) || (t > RECALL - 0.1 && t < RECALL + 0.6) ? 'rotate(-10)' : 'rotate(-70)'}><Phone /></g> : undefined
    const vx = 236 // 전화기 너머 목소리 자리
    const screen = t > SEND && t < CUT - 0.1
    const sent = t > SEND + 0.8
    return (
      <g>
        <Home winX={214} frameX={18} />
        <SofaBack x={SOFA} y={GROUND} w={90} />
        <Sofa x={SOFA} y={GROUND} w={90} />
        {/* 옆 탁자 위 전화 (울릴 때 흔들림) */}
        <rect x={SOFA + 60} y={GROUND - 30} width="26" height="30" fill="#C98B55" stroke={INK} strokeWidth="1.8" />
        {!phoneHeld && t < PICK && <g transform={`translate(${SOFA + 73 + (ringing ? 1.5 * Math.sin(t * 60) : 0)} ${GROUND - 31}) rotate(-90)`}><Phone /></g>}
        <Actor c={me} x={x} y={seated ? seatY : GROUND} pose={pose} expr={expr} holding={phone} caneLean />
        {ringing && <g><Bang t={t} t0={RING} x={SOFA + 76} y={GROUND - 56} text="따르릉" size={13} color="#5E8FC9" dur={0.9} /></g>}
        {t > RING && t < PICK + 0.4 && <g transform={`translate(${SOFA + 104} ${GROUND - 78})`}><rect x="-30" y="-9" width="60" height="16" rx="4" fill="#fff" stroke={INK} strokeWidth="1.4" /><text textAnchor="middle" y="3" fontSize="9" fill="#E0533F">모르는 번호</text></g>}
        <Sweat t={t} t0={SCARED} x={x + 20} y={top + 18} />
        <Sweat t={t} t0={RUSH} x={x + 22} y={top + 20} />
        {/* 이체 화면 */}
        {screen && (
          <g transform={`translate(${x + 72} ${top + 30})`}>
            <rect x="-30" y="-26" width="60" height="50" rx="6" fill="#fff" stroke={INK} strokeWidth="2" />
            <text textAnchor="middle" y="-12" fontSize="8" fill={INK}>이체하기</text>
            <text textAnchor="middle" y="2" fontSize="10" fill="#2E6FD8">3,000,000원</text>
            <rect x="-20" y="8" width="40" height="11" rx="3" fill={sent ? '#7FBF6A' : '#2E6FD8'} />
            <text textAnchor="middle" y="16.5" fontSize="7.5" fill="#fff">{sent ? '보냈어요' : '보내기'}</text>
          </g>
        )}
        <MoneyFly t={t} t0={SEND + 0.9} x={x + 72} y={top + 30} n={3} />
        <Bang t={t} t0={CUT} x={x + 46} y={top + 2} text="뚝" size={17} color="#7A4A2A" dur={0.7} />
        <Exclaim t={t} t0={CUT + 0.1} x={x - 20} y={top + 4} text="!?" />
        <Gloom t={t} t0={14.3} x={x - 6} y={top - 10} />
        <Bubble t={t} t0={PICK + 0.1} t1={PICK + 0.9} x={x + 30} y={top - 14} text="여보세요?" size={13} />
        <Bubble t={t} t0={PICK + 1.0} t1={SCARED} x={vx} y={top - 6} text="은행입니다. 계좌가 해킹됐어요!" tail="left" size={11} dashed />
        <Bubble t={t} t0={SCARED} t1={ORDER} x={x + 20} y={top - 14} text="네?! 어떡해요?" />
        <Bubble t={t} t0={ORDER} t1={DOUBT} x={vx} y={top - 6} text="안전한 계좌로 옮기세요. 지금요!" tail="left" size={11} dashed />
        <Bubble t={t} t0={DOUBT} t1={RUSH} x={x + 20} y={top - 14} text="그, 그래도…" />
        <Bubble t={t} t0={RUSH} t1={SEND + 0.2} x={vx} y={top - 6} text="빨리요! 돈이 다 사라져요!" tail="left" size={11} dashed />
        <Bubble t={t} t0={CUT + 0.2} t1={RECALL - 0.1} at={x + 8} y={top - 14} text="여보세요? 여보세요?" size={13} />
        <Bubble t={t} t0={RECALL + 0.8} t1={RECALL + 1.4} x={vx} y={top - 6} text="뚜르르…" tail="left" size={12} dashed />
        <Bubble t={t} t0={RECALL + 1.4} t1={REAL} x={vx} y={top - 6} text="없는 번호입니다" tail="left" size={12} dashed />
        <Bubble t={t} t0={REAL + 0.2} t1={14.95} at={x + 8} y={top - 14} text="속았다…" />
      </g>
    )
  },
}
