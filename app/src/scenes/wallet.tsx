// 장면: 지갑(용돈)을 잃어버림 (안 좋은 일 10.5초). 걷다가 모르는 새 떨어뜨리고 → 주머니가 비어 있음
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Street } from './Backdrops'
import { Bang, Bubble, Sweat } from './Fx'
import { Exclaim, Gloom, Notes } from './Fx2'
import { Pouch, Wallet } from './Props2'
import { Sparkle } from './Fx'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { gaitOf, HOLD_HEAD, SLUMP, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const X = 140
const STOP = 3.3

export const wallet: SceneDef = {
  id: 'wallet',
  dur: 10.5,
  still: 5.0,
  draw: (t, cast, text) => {
    const me = cast[0]
    // 아이(또는 '용돈' 사건)는 용돈 봉투
    const kid = (me.age ?? 30) < 13 || /용돈/.test(text)
    const top = GROUND - headH(me)
    const g = gaitOf(me)
    // 떨어뜨리는 순간 (느리게 걷는 노인은 일찍 → 멈출 때쯤 하수구가 화면 밖)
    const DROP = (me.age ?? 30) >= 65 ? 0.2 : 1.5
    // 걷는 동안 길이 흐름 → 멈추면 멈춤
    const cam = t < STOP ? t * g.v : STOP * g.v + g.v * 0.25 * ease.out(seg(t, STOP, STOP + 0.4))
    // 지갑: 엉덩이 쪽에서 떨어져 바닥에 → 길과 같이 뒤로 흘러감
    const camAtDrop = DROP * g.v
    // 떨어져 통통 튀다가 하수구 틈으로 쏙 → 주인은 못 봄
    const wy = keys(t, [[DROP, GROUND - 52], [DROP + 0.4, GROUND - 4], [DROP + 0.6, GROUND - 14], [DROP + 0.8, GROUND - 3], [DROP + 1.15, GROUND + 8]], ease.in)
    const drainX = X - 22 - (cam - camAtDrop)
    const wx = X - 10 - (cam - camAtDrop) - keys(t, [[DROP, 0], [DROP + 0.8, 12]])
    const gone = t > DROP + 1.15
    const pat = (tt: number): SidePose => ({ ...STAND, lean: 6, armN: [-34 + 12 * Math.sin(tt * 18), 40], armF: [-30 + 12 * Math.sin(tt * 18 + 1), 40], head: 10 }) // 뒷주머니 툭툭 (양손)
    const patFront = (tt: number): SidePose => ({ ...STAND, lean: 10, head: 16, armN: [20 + 14 * Math.sin(tt * 18), 70], armF: [16 + 14 * Math.sin(tt * 18 + 2), 70] }) // 가슴·배 주머니
    const pose = poseAt(t, [
      [STOP, g.pose], [STOP + 0.3, STAND], [3.6, pat], [4.3, pat], [4.5, patFront], [5.3, patFront],
      [5.5, STAND], [6.6, STAND], [6.9, HOLD_HEAD], [8.3, HOLD_HEAD], [8.7, SLUMP],
    ])
    // 뒤돌아 두리번 (5.6~6.6)
    // 좌우로 두 번 두리번
    const flip = (t > 5.55 && t < 5.85) || (t > 6.1 && t < 6.4)
    const expr = pick<Expr>(t, [[0, 'happy'], [STOP, 'normal'], [4.3, 'surprised'], [6.9, 'sad']])
    return (
      <g>
        <Street cam={cam} />
        {drainX > (t > STOP ? 24 : -30) && <g transform={`translate(${drainX} ${GROUND - 2})`}><rect x="-14" y="-4" width="28" height="9" rx="2" fill="#6E6A66" stroke={INK} strokeWidth="1.8" />{[-8, -3, 2, 7].map((d) => <path key={d} d={`M${d} -2 V3`} stroke={INK} strokeWidth="2.2" />)}</g>}
        <clipPath id="wl-clip"><rect x="-50" y="0" width="420" height={GROUND - 2} /></clipPath>
        {t > DROP && !gone && <g clipPath={t > DROP + 0.8 ? 'url(#wl-clip)' : undefined}><g transform={`translate(${wx} ${wy}) scale(1.5) translate(${-wx} ${-wy})`}>{kid ? <Pouch x={wx} y={wy} rot={keys(t, [[DROP, 0], [DROP + 0.5, 160], [DROP + 0.8, 90]])} /> : <Wallet x={wx} y={wy} rot={keys(t, [[DROP, 0], [DROP + 0.5, 160], [DROP + 0.8, 90]])} />}</g></g>}
        <Sparkle t={t} t0={DROP + 0.1} x={X - 4} y={GROUND - 60} s={0.9} />
        <Bang t={t} t0={DROP + 0.95} x={drainX + 8} y={GROUND - 28} text="쏙" size={13} color="#5E8FC9" dur={0.9} />
        <Actor c={me} x={X} pose={pose} expr={expr} flip={flip} caneLean={t > STOP + 0.3} />
        <Notes t={t} t0={0.2} t1={2.9} x={X + 18} y={top + 10} />
        <Exclaim t={t} t0={4.3} x={X - 22} y={top + 6} text="!?" />
        <Sweat t={t} t0={5.6} x={X + 24} y={top + 18} />
        <Gloom t={t} t0={8.8} x={X + 6} y={top - 16} />
        <Bubble t={t} t0={4.5} t1={5.6} x={X + 44} y={top - 14} text={kid ? '어? 내 용돈!' : '어? 내 지갑!'} />
        <Bubble t={t} t0={7.0} t1={8.8} x={X + 60} y={top - 14} text={kid ? '내 용돈 어디 갔지…' : '어디서 떨어뜨렸지…'} />
      </g>
    )
  },
}
