// 장면: 자서전 쓰기 (노년, 11초, 11-28). 밤, 스탠드 켠 책상에서 만년필로 한 장씩 씀 → 원고가 쌓임, 시계가 빨리 돎, 창밖이 밝아옴
// → 마지막 장 "끝." → 기지개 → 완성된 책 '나의 인생'을 들어 보이며 "드디어 다 썼다!" (반짝)
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { BookCover, Desk, Manuscript, Pen, SideChair } from './Props4'
import { Bubble, Sparkle } from './Fx'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, SIT_LEGS, sitLift, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const WRITE = 0.6, DONE = 5.6, STRETCH = 6.2, SHOW = 7.4
const MEX = 104, DESK_X = 160

export const autobiography: SceneDef = {
  id: 'autobiography',
  dur: 11,
  still: 3.0,
  draw: (t, cast) => {
    const me = cast[0]
    const lift = sitLift(me, 30)
    const standing = t > SHOW - 0.3
    const write = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 14, head: 14, armN: [74 + 4 * Math.sin(tt * 9), 44 + 6 * Math.sin(tt * 13)], armF: [70, 40] })
    const stretch: SidePose = { ...SIT_LEGS, lean: -10, head: -14, armN: [170, 6], armF: [165, 6] }
    const show: SidePose = { ...STAND, head: -6, armN: [120, 10], armF: [-4, 10] }
    const pose = standing ? poseAt(t, [[SHOW - 0.3, STAND], [SHOW, show], [9.4, show], [9.7, CHEER]]) : poseAt(t, [[0, write], [DONE, write], [STRETCH, stretch], [SHOW - 0.6, stretch]])
    const expr = pick<Expr>(t, [[0, 'normal'], [DONE - 0.2, 'happy'], [STRETCH, 'surprised'], [SHOW, 'love']])
    const night = 1 - seg(t, 2, 6.4) // 밤 → 새벽
    const pages = Math.floor(2 + 10 * seg(t, WRITE, DONE))
    const y = standing ? GROUND : GROUND - lift
    const top = y - (standing ? headH(me) : headH(me) - 22)
    const book = standing ? <g transform="scale(1.6) translate(0 6)"><BookCover title="나의 인생" /></g> : t > WRITE && t < DONE ? <Pen /> : undefined
    return (
      <g>
        <Home winX={206} frameX={16} night={night > 0.5 ? 1 : 0} />
        <rect width="320" height="180" fill="#1E2A50" opacity={0.35 * night} />
        {/* 새벽빛 */}
        <rect width="320" height="180" fill="#FFD9A8" opacity={0.12 * seg(t, 5, 7) * (1 - seg(t, 9, 11))} />
        <Desk x={DESK_X} y={GROUND} w={70} h={42} lampOn={!standing} />
        {/* 원고 더미 (쌓여 감) · 쓰는 중인 원고지 (칸) */}
        <g transform={`translate(${DESK_X + 10} ${GROUND - 42})`}><Manuscript n={pages} /></g>
        {!standing && <g transform={`translate(${DESK_X - 22} ${GROUND - 42})`}><path d="M-12 0 L-10 -2 H12 L10 0Z" fill="#FFFDF7" stroke={INK} strokeWidth="0.8" />{[-6, -2, 2, 6].map((k) => <path key={k} d={`M${k} -0.4 v-1.2`} stroke="#E8A0A0" strokeWidth="0.5" />)}</g>}
        {!standing && <SideChair x={MEX - 4} y={GROUND} h={30} />}
        <Actor c={me} x={standing ? keys(t, [[SHOW - 0.3, MEX], [SHOW, MEX - 10]], ease.out) : MEX} y={y} pose={pose} expr={expr} holding={book} noCane={!standing} caneLean={standing} />
        {standing && <SideChair x={MEX + 6} y={GROUND} h={30} />}
        {[0, 0.25, 0.5].map((d, i) => <Sparkle key={i} t={t} t0={SHOW + 0.3 + d} x={MEX + 26 + i * 8} y={top + 24 - i * 6} />)}
        <Bubble t={t} t0={1.0} t1={3.6} at={MEX + 2} y={top - 12} text="그때 나는 말이야…" size={12} />
        <Bubble t={t} t0={DONE - 0.4} t1={STRETCH + 0.4} at={MEX + 2} y={top - 12} text="끝." />
        <Bubble t={t} t0={SHOW + 0.4} t1={10.9} at={MEX - 8} y={GROUND - headH(me) - 14} text="드디어 다 썼다!" />
      </g>
    )
  },
}
