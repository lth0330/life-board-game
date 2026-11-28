// 장면: 반장 선거 당선 (학생, 11.5초, 11-28). 선생님이 투표함에서 쪽지를 한 장씩 꺼내 읽음 → 칠판에 바를 정(正) 획이 하나씩 늘어남
// (기호 1번 = 나, 기호 2번 = 친구, 엎치락뒤치락) → 마지막 한 표 "1번!" → 당선, 반 친구들 박수 → 일어나 꾸벅 "열심히 하겠습니다!"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Classroom, SchoolDesk } from './Backdrops4'
import { BallotBox } from './Props4'
import { Bubble, Sweat } from './Fx'
import { Confetti } from './Fx3'
import { INK, pick, poseAt, seg } from './kit'
import { BOW, CHEER, SIT_LEGS, sitLift, STAND } from './poses'
import { pal, TEACHER } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

// 개표 순서 (1 = 나, 2 = 친구): 마지막이 나
const VOTES = [1, 2, 2, 1, 1, 2, 1, 2, 1]
const START = 0.8, EACH = 0.62
const END = START + VOTES.length * EACH // 마지막 표
const STANDUP = END + 1.2

/** 바를 정(正) 획: n획까지 (5획 = 한 글자) */
function Tally({ x, y, n }: { x: number; y: number; n: number }) {
  const strokes = ['M0 0 H10', 'M5 0 V14', 'M5 7 H9', 'M1.5 5 V14', 'M-1 14 H11']
  return <g transform={`translate(${x} ${y})`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none">
    {Array.from({ length: n }, (_, i) => <path key={i} d={strokes[i % 5]} transform={`translate(${Math.floor(i / 5) * 14} 0)`} />)}
  </g>
}

export const classPresident: SceneDef = {
  id: 'classPresident',
  dur: 11.5,
  still: END + 0.8,
  draw: (t, cast) => {
    const me = cast[0], rival = pal(cast, 1), c2 = pal(cast, 2)
    const counted = Math.max(0, Math.min(VOTES.length, Math.floor((t - START) / EACH) + 1))
    const n1 = VOTES.slice(0, counted).filter((v) => v === 1).length, n2 = VOTES.slice(0, counted).filter((v) => v === 2).length
    const last = counted > 0 ? VOTES[counted - 1] : 0
    const won = t > END + 0.2
    const lift = sitLift(me, 26)
    const sit: SidePose = { ...SIT_LEGS, lean: 4, armN: [60, 50], armF: [54, 50] }
    const pray: SidePose = { ...SIT_LEGS, lean: 2, head: -4, armN: [64, 110], armF: [60, 100] }
    const mePose = t < STANDUP - 0.3 ? poseAt(t, [[0, sit], [END - 2, sit], [END - 1.8, pray], [END, pray], [END + 0.3, { ...SIT_LEGS, armN: [150, 10], armF: [140, 10] }]]) : poseAt(t, [[STANDUP, STAND], [STANDUP + 0.5, BOW(1)], [STANDUP + 1.3, BOW(1)], [STANDUP + 1.7, CHEER]])
    const meY = t < STANDUP - 0.3 ? GROUND - lift : GROUND
    const clapS = (tt: number): SidePose => ({ ...SIT_LEGS, armN: [55, 50 + 18 * Math.max(0, Math.sin(tt * 16))], armF: [55, 40 + 18 * Math.max(0, Math.sin(tt * 16))] })
    const friendPose = (k: number) => (won ? clapS(t + k) : sit)
    // 선생님: 쪽지를 꺼내 들어 읽음 (표마다 팔 위로)
    const ph = ((t - START) % EACH) / EACH
    const tPose: SidePose = t > START && t < END + 0.3 ? { ...STAND, head: -4, armN: ph < 0.5 ? [40, 40] : [110, 30], armF: [40, 50] } : STAND
    const expr = pick<Expr>(t, [[0, 'normal'], [END - 1.8, 'surprised'], [END + 0.2, 'happy'], [STANDUP + 1.7, 'love']])
    const top = meY - (t < STANDUP - 0.3 ? headH(me) - 22 : headH(me))
    const board = (
      <g fontSize="8" fill="#FFFFFF">
        <text x="70" y="12" textAnchor="middle" fontSize="8.4">반장 선거 개표</text>
        <text x="8" y="28">기호 1번</text><Tally x={46} y={20} n={n1} />
        <text x="8" y="50">기호 2번</text><Tally x={46} y={42} n={n2} />
        {won && <g><circle cx="20" cy="25" r="11" fill="none" stroke="#F2C230" strokeWidth="1.6" opacity={seg(t, END + 0.2, END + 0.6)} /><text x="118" y="30" fontSize="9" fill="#F2C230">당선!</text></g>}
      </g>
    )
    return (
      <g>
        <Classroom board={board} boardX={74} />
        <Actor c={TEACHER} x={52} pose={tPose} expr={won ? 'happy' : 'normal'} holding={t > START && t < END + 0.3 && ph > 0.5 ? <g><rect x="-5" y="-12" width="10" height="7" fill="#FFFFFF" stroke={INK} strokeWidth="0.8" /><text y="-6.6" textAnchor="middle" fontSize="5" fill={INK}>{last}</text></g> : undefined} />
        <BallotBox x={82} y={GROUND} />
        {/* 학생 자리: 나 · 경쟁자 · 친구 (다 오른쪽 칠판 반대 → 앞을 봄: 왼쪽) */}
        {[[rival, 194, 1], [c2, 252, 2]].map(([c, x, k], i) => <g key={i}><Actor c={c as typeof me} x={x as number} y={GROUND - sitLift(c as typeof me, 26)} flip pose={friendPose(k as number)} expr={won ? 'happy' : 'normal'} noCane /><SchoolDesk x={(x as number) - 22} y={GROUND} /></g>)}
        <Actor c={me} x={t < STANDUP - 0.3 ? 140 : 146} y={meY} flip pose={mePose} expr={expr} noCane />
        <SchoolDesk x={118} y={GROUND} />
        {t > END - 1.8 && t < END && <Sweat t={t} t0={END - 1.8} x={126} y={top + 18} />}
        <Confetti t={t} t0={END + 0.3} n={22} dur={2.6} />
        <Bubble t={t} t0={START + 0.1} t1={END + 0.3} at={52} y={GROUND - headH(TEACHER) - 14} text={last ? `${last}번!` : ''} />
        <Bubble t={t} t0={STANDUP + 0.6} t1={11.4} at={140} tail="right" y={GROUND - headH(me) - 14} text="열심히 하겠습니다!" />
      </g>
    )
  },
}
