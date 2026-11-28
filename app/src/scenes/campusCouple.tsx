// 장면: 캠퍼스 커플 (청년, 11초, 11-28). 은행잎 떨어지는 캠퍼스를 나란히 걸음 → 은행나무 아래 멈춤
// → 이어폰 한쪽씩 나눠 끼고 같은 노래 (음표) → 서로 마주 보고 웃음, 하트 → "이 노래 좋다" "응, 너랑 들어서"
import { Actor, GROUND, headH, partnerOf, type SceneDef } from './Stage'
import { Campus } from './Backdrops4'
import { Bubble, Hearts } from './Fx'
import { Notes } from './Fx2'
import { INK, ease, pick, poseAt, seg } from './kit'
import { gaitOf, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const STOP = 3.6, BUDS = 4.6, LISTEN = 5.6, LOOK = 7.6
const MEX = 132, PX = 166

export const campusCouple: SceneDef = {
  id: 'campusCouple',
  dur: 11,
  still: 6.4,
  draw: (t, cast) => {
    const me = cast[0], pa = partnerOf(me)
    const g = gaitOf(me)
    const cam = t < STOP ? t * g.v * 0.8 : STOP * g.v * 0.8 + g.v * 0.2 * ease.out(seg(t, STOP, STOP + 0.4))
    const walking = t < STOP
    const facing = t > LOOK - 0.2
    // 이어폰 끼워 주기: 나 → 상대 귀로 손 뻗기 → 각자 귀에
    const give: SidePose = { ...STAND, lean: 6, armN: [112, 30], armF: [-4, 10] }
    const ear: SidePose = { ...STAND, head: 6, armN: [124, 118], armF: [-4, 10] }
    const listen = (tt: number): SidePose => ({ ...STAND, head: 4 * Math.sin(tt * 4), armN: [10, 20], armF: [-4, 10], bob: -Math.abs(Math.sin(tt * 4)) * 1.2 })
    const mePose = walking ? g.pose(t) : poseAt(t, [[STOP, STAND], [BUDS - 0.4, give], [BUDS + 0.2, give], [BUDS + 0.5, ear], [LISTEN, ear], [LISTEN + 0.3, listen]])
    const paPose = walking ? g.pose(t + 0.3) : poseAt(t, [[STOP, STAND], [BUDS + 0.4, STAND], [BUDS + 0.8, ear], [LISTEN, ear], [LISTEN + 0.3, listen]])
    const expr = pick<Expr>(t, [[0, 'happy'], [LISTEN, 'happy'], [LOOK, 'love']])
    const top = GROUND - headH(me), ptop = GROUND - headH(pa)
    // 귀 위치(대략): 머리 가운데 높이
    // 옆모습 귀 = 머리 뒤쪽 (오른쪽 보면 왼쪽, 왼쪽 보면 오른쪽)
    const meEar = [MEX - 3, top + 30], paEar = [facing ? PX + 3 : PX - 3, ptop + 30]
    const wire = t > BUDS + 0.4
    return (
      <g>
        <Campus cam={cam} />
        <Actor c={me} x={MEX} pose={mePose} expr={expr} />
        <Actor c={pa} x={PX} pose={paPose} expr={expr} flip={facing} />
        {/* 이어폰 줄: 두 귀에서 내려와 가운데 아래(내 주머니 폰)로 */}
        {wire && <g fill="none" strokeLinecap="round">
          <path d={`M${meEar[0]} ${meEar[1]} Q${MEX - 8} ${top + 52} ${MEX + 8} ${top + 66} M${paEar[0]} ${paEar[1]} Q${PX + (facing ? 8 : -6)} ${ptop + 54} ${MEX + 8} ${top + 66} L${MEX + 4} ${top + 74}`} stroke={INK} strokeWidth="2" />
          <path d={`M${meEar[0]} ${meEar[1]} Q${MEX - 8} ${top + 52} ${MEX + 8} ${top + 66} M${paEar[0]} ${paEar[1]} Q${PX + (facing ? 8 : -6)} ${ptop + 54} ${MEX + 8} ${top + 66} L${MEX + 4} ${top + 74}`} stroke="#FFFFFF" strokeWidth="1" />
          <rect x={MEX} y={top + 72} width="7" height="11" rx="1.5" fill="#2A3A5A" stroke={INK} strokeWidth="1" />
          {[meEar, paEar].map(([ex, ey], i) => <circle key={i} cx={ex} cy={ey} r="2.4" fill="#FFFFFF" stroke={INK} strokeWidth="1" />)}
        </g>}
        {/* 은행잎이 팔랑팔랑 */}
        {Array.from({ length: 9 }, (_, i) => {
          const q = (t * 0.22 + i / 9) % 1, lx = ((i * 41 + 30 - cam * 0.3) % 340 + 340) % 340 - 10 + Math.sin(t * 2 + i) * 8, ly = q * 170
          return <path key={i} transform={`translate(${lx} ${ly}) rotate(${t * 90 + i * 40})`} d="M0 0 L-4 -5 Q0 -8 4 -5Z" fill="#F2C230" stroke={INK} strokeWidth="0.6" />
        })}
        <Notes t={t} t0={LISTEN} t1={10.8} x={(MEX + PX) / 2} y={top + 4} n={3} />
        <Hearts t={t} t0={LOOK + 0.3} x={(MEX + PX) / 2} y={top} n={3} />
        <Bubble t={t} t0={0.5} t1={STOP} at={MEX + 2} y={top - 12} text="같이 들을래?" />
        <Bubble t={t} t0={LISTEN + 0.3} t1={LOOK} at={PX} tail="right" y={ptop - 12} text="이 노래 좋다" />
        <Bubble t={t} t0={LOOK + 0.4} t1={10.9} at={MEX + 2} y={top - 12} text="응, 너랑 들어서" />
      </g>
    )
  },
}
