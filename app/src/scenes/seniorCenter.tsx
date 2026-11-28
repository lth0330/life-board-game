// 장면: 경로당 수다 (노년, 10초, 11-28). 장판 방에 방석 깔고 둘러앉음, 녹차·감 → "우리 손주가 글쎄~" 이야기
// → "아이고, 그랬어?" 맞장구 → 셋이 배를 잡고 "하하하!" → 감을 나눠 먹음
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { SeniorCenter } from './Backdrops4'
import { Cushion, LowTable, SnackPlate, TeaCup } from './Props4'
import { Bubble } from './Fx'
import { pick, poseAt } from './kit'
import { pal } from './people'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const TELL = 0.6, NOD = 3.2, LAUGH = 5.0, SHARE = 7.4
// 바닥에 양반다리: 허벅지 앞으로, 종아리는 접어 몸 쪽으로 → 엉덩이가 바닥에 닿게 내려 앉힘
const FLOOR = { legN: [84, 158, 0] as [number, number, number], legF: [80, 154, 0] as [number, number, number] }
const DROP = 26 // 서 있을 때 발 위치보다 이만큼 아래로 (엉덩이 = 방석 높이)

export const seniorCenter: SceneDef = {
  id: 'seniorCenter',
  dur: 10,
  still: 5.6,
  draw: (t, cast) => {
    const me = cast[0], a = pal(cast, 1), b = pal(cast, 2)
    const sit = (armN: [number, number], lean = 4, head = 0, bob = 0): SidePose => ({ ...FLOOR, lean, head, armN, armF: [30, 60], bob })
    const talk = (tt: number) => sit([70 + 18 * Math.sin(tt * 5), 60 + 20 * Math.sin(tt * 7)], 8, -2)
    const laugh = (tt: number) => sit([40, 100], -6 + 8 * Math.abs(Math.sin(tt * 9)), -14, -Math.abs(Math.sin(tt * 9)) * 2)
    const sip = sit([66, 118], 0, -8)
    const mePose = poseAt(t, [[0, talk], [NOD - 0.2, talk], [NOD, sit([40, 60])], [LAUGH - 0.2, sit([40, 60])], [LAUGH, laugh], [SHARE - 0.2, laugh], [SHARE, sit([84, 14], 10)], [SHARE + 0.8, sit([84, 14], 10)], [SHARE + 1.2, sip]])
    const aPose = poseAt(t, [[0, sit([40, 60])], [NOD, sit([40, 60], 10, 12)], [NOD + 0.3, sit([40, 60], 4, -4)], [NOD + 0.6, sit([40, 60], 10, 12)], [NOD + 0.9, sit([60, 90], 6, 0)], [LAUGH, laugh], [SHARE, sit([40, 60])], [SHARE + 0.8, sit([84, 14], 10)]])
    const bPose = poseAt(t, [[0, sip], [1.6, sit([40, 60])], [LAUGH, laugh], [SHARE, sit([40, 60])], [SHARE + 1.2, sip]])
    const expr = (who: number) => pick<Expr>(t, [[0, who === 0 ? 'happy' : 'normal'], [NOD, who === 1 ? 'surprised' : 'happy'], [LAUGH, 'happy'], [SHARE, 'love']])
    const y = GROUND - 4 + DROP
    const top = (c: typeof me) => y - headH(c) + 14
    return (
      <g>
        <SeniorCenter />
        <Cushion x={74} y={GROUND - 2} />
        <Cushion x={250} y={GROUND - 2} c="#5E8FC9" />
        <Actor c={me} x={74} y={y} pose={mePose} expr={expr(0)} noCane />
        <Actor c={a} x={250} y={y} flip pose={aPose} expr={expr(1)} noCane />
        {/* 가운데 친구는 상 뒤에 (조금 뒤, 작게) */}
        <Cushion x={164} y={GROUND - 14} c="#7FBF6A" w={22} />
        <Actor c={b} x={164} y={y - 14} size={54} pose={bPose} expr={expr(2)} noCane />
        <LowTable x={164} y={GROUND} w={110} h={20} cloth="#F7E9CF" />
        <g transform={`translate(146 ${GROUND - 20})`}><SnackPlate kind="persimmon" /></g>
        <g transform={`translate(176 ${GROUND - 20})`}><SnackPlate kind="ricecake" /></g>
        <g transform={`translate(124 ${GROUND - 20})`}><TeaCup t={t} /></g>
        <g transform={`translate(198 ${GROUND - 20})`}><TeaCup t={t + 0.5} /></g>
        {/* 웃음 소리 */}
        {t > LAUGH && t < SHARE && ['하', '하', '하'].map((c, i) => <text key={i} x={56 + i * 92 + 6 * Math.sin(t * 8 + i)} y={92 - (i === 1 ? 10 : 0) + 3 * Math.sin(t * 10 + i)} fontSize="13" fill="#E0833F" stroke="#fff" strokeWidth="2.4" paintOrder="stroke">{c}{c}{c}</text>)}
        <Bubble t={t} t0={TELL} t1={NOD} at={76} y={top(me) - 12} text="우리 손주가 글쎄~" size={12} />
        <Bubble t={t} t0={NOD + 0.2} t1={LAUGH} at={250} tail="right" y={top(a) - 12} text="아이고, 그랬어?" size={12} />
        <Bubble t={t} t0={SHARE + 0.2} t1={9.9} at={76} y={top(me) - 12} text="이 감 좀 드셔 봐요" size={12} />
      </g>
    )
  },
}
