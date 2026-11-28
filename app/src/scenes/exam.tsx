// 장면: 대학 시험 (청년, 10.5초, 11-28). 강의실, 시험지를 받고 열심히 풂 (펜이 움직임, 시계 째깍) → 종료 종 "그만!"
// → 며칠 뒤 성적 확인: 잘 봤으면 'A+' 만세 "해냈다!" / 망쳤으면 'F' 책상에 엎드려 먹구름 "망했다…"
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { LectureHall, SchoolDesk } from './Backdrops4'
import { ExamPaper, Pen, ScreenZoom } from './Props4'
import { Bang, Bubble, Sweat } from './Fx'
import { Gloom } from './Fx2'
import { Confetti } from './Fx3'
import { ease, pick, poseAt, seg } from './kit'
import { CHEER, SIT_LEGS, sitLift, STAND } from './poses'
import { pal } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BELL = 4.2, RESULT = 5.6, REACT = 6.6
const MEX = 150

export const exam: SceneDef = {
  id: 'exam',
  dur: 10.5,
  still: 2.4,
  draw: (t, cast, text) => {
    const me = cast[0], a = pal(cast, 1)
    const good = !/망쳤/.test(text)
    const lift = sitLift(me, 26)
    const write = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 18, head: 18, armN: [70 + 4 * Math.sin(tt * 11), 50 + 6 * Math.sin(tt * 15)], armF: [66, 46] })
    const think = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 6, head: -6, armN: [64, 120 + 4 * Math.sin(tt * 3)], armF: [60, 50] }) // 턱 괴고 고민
    const down: SidePose = { ...SIT_LEGS, lean: 40, head: 30, armN: [86, 100], armF: [82, 100] } // 책상에 엎드림
    const standUp = !good ? false : t > REACT
    const mePose = standUp ? poseAt(t, [[REACT, STAND], [REACT + 0.3, CHEER]]) : poseAt(t, [[0, write], [1.8, write], [2.0, think], [2.8, think], [3.0, write], [BELL, write], [BELL + 0.3, { ...SIT_LEGS, lean: -4, armN: [30, 50], armF: [24, 50] }], [REACT - 0.3, { ...SIT_LEGS, lean: 4, armN: [70, 60], armF: [64, 60] }], [REACT, good ? CHEER : down]])
    const expr = pick<Expr>(t, [[0, 'normal'], [2.0, 'surprised'], [3.0, 'normal'], [BELL, 'surprised'], [REACT, good ? 'happy' : 'sad']])
    const meY = standUp ? GROUND : GROUND - lift
    const top = meY - (standUp ? headH(me) : headH(me) - 22)
    const zoom = ease.back(seg(t, RESULT, RESULT + 0.35)) * (1 - seg(t, REACT + 1.4, REACT + 1.8))
    return (
      <g>
        <LectureHall />
        {/* 뒷줄 친구도 시험 중 */}
        <Actor c={a} x={248} y={GROUND - sitLift(a, 26) - 8} size={56} pose={write(t + 1)} expr="normal" noCane holding={t < BELL ? <Pen /> : undefined} />
        <SchoolDesk x={270} y={GROUND - 8} />
        <Actor c={me} x={MEX} y={meY} pose={mePose} expr={expr} noCane holding={t < BELL ? <Pen /> : undefined} />
        <SchoolDesk x={MEX + 22} y={GROUND} />
        <g transform={`translate(${MEX + 22} ${GROUND - 38}) scale(0.7) rotate(-80)`}><ExamPaper /></g>
        <Bang t={t} t0={BELL} x={90} y={70} text="따르릉" size={14} color="#E0533F" dur={1} />
        {t > 2.0 && t < 2.8 && <Sweat t={t} t0={2.0} x={MEX + 20} y={top + 18} />}
        <ScreenZoom x={88} y={64} k={zoom} title="성적 확인" big={good ? 'A+' : 'F'} color={good ? '#2E6FD8' : '#C2452D'} sub={good ? '수고했어요!' : '재수강을 권합니다'} />
        {good && <Confetti t={t} t0={REACT} n={20} dur={2.6} />}
        {!good && <Gloom t={t} t0={REACT + 0.3} x={MEX + 4} y={top - 20} />}
        <Bubble t={t} t0={BELL + 0.1} t1={BELL + 1.2} at={MEX + 2} y={top - 12} text="그만…!" />
        <Bubble t={t} t0={REACT + 0.4} t1={10.4} at={MEX + 2} y={(good ? GROUND - headH(me) : top) - 12} text={good ? '해냈다!' : '망했다…'} />
      </g>
    )
  },
}
