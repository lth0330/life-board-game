// 장면: 고백했다 차임 (안 좋은 일, 학생, 12초, 11-28). 노을 진 학교 뒤뜰, 편지를 등 뒤에 숨기고 서성임 "두근두근…"
// → 좋아하는 친구가 옴 → 허리 숙여 두 손으로 편지 "좋아해! 받아 줘!" → 친구가 놀람… 고개 저음 "미안… 우리 친구로 지내자"
// → 친구는 떠나고 혼자 남음, 벚꽃잎이 바람에 날림 → 고개 푹 → 그래도 "…말해서 후련해" (용기 덕분에 매력 +1)
import { Actor, GROUND, headH, type Cast, type SceneDef } from './Stage'
import { SchoolYard } from './Backdrops4'
import { LoveLetter } from './Props4'
import { Bubble, Sweat } from './Fx'
import { Exclaim, Gloom } from './Fx2'
import { INK, ease, keys, pick, poseAt, seg } from './kit'
import { BOW, gaitOf, SLUMP, STAND } from './poses'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const COME = 1.8, ASK = 3.6, NO = 5.8, LEAVE = 7.6, ALONE = 8.8
const MEX = 120, CX = 176

export const confessFail: SceneDef = {
  id: 'confessFail',
  dur: 12,
  still: 4.4,
  draw: (t, cast) => {
    const me = cast[0]
    // 좋아하는 친구: 나와 다른 성별의 같은 나이 학생 (교복 느낌)
    const crush: Cast = me.outfit.gender === 'f'
      ? { outfit: { ...DEFAULT_OUTFIT, hair: 'twoblock', hairColor: '#2A1E17', top: 'shirt', topColor: '#FFFFFF', outer: 'vest', outerColor: '#2E4A7A', bottomColor: '#3A4A6A', shoesColor: '#2A2118' }, age: me.age }
      : { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'pony', hairColor: '#3A2A1A', top: 'shirt', topColor: '#FFFFFF', outer: 'vest', outerColor: '#2E4A7A', bottom: 'skirt', bottomColor: '#3A4A6A', shoesColor: '#2A2118' }, age: me.age }
    const cg = gaitOf(crush)
    const cX = t < LEAVE ? keys(t, [[0, 360], [COME, 360], [COME + 1.4, CX]], ease.out) : keys(t, [[LEAVE, CX], [LEAVE + 2, 380]], ease.in)
    const cWalk = (t > COME && t < COME + 1.4) || t > LEAVE
    const hide: SidePose = { ...STAND, armN: [-30, 50], armF: [-26, 50] } // 편지를 등 뒤에
    const fidget = (tt: number): SidePose => ({ ...hide, head: 6 * Math.sin(tt * 3), bob: -Math.abs(Math.sin(tt * 6)) * 1.5 })
    const offer: SidePose = { ...BOW(0.9), armN: [84, 6], armF: [80, 8] }
    const mePose = poseAt(t, [[0, fidget], [ASK - 0.4, fidget], [ASK, offer], [NO + 0.4, offer], [NO + 0.8, STAND], [ALONE, STAND], [ALONE + 0.5, SLUMP]])
    const shake = (tt: number): SidePose => ({ ...STAND, head: 10 * Math.sin(tt * 10), armN: [50, 60], armF: [44, 60] })
    const cPose = cWalk ? cg.pose(t) : poseAt(t, [[COME + 1.4, STAND], [ASK + 0.3, { ...STAND, lean: -6, armN: [40, 120], armF: [-4, 10] }], [NO - 0.2, { ...STAND, lean: -6, armN: [40, 120], armF: [-4, 10] }], [NO, shake], [LEAVE - 0.3, shake], [LEAVE, STAND]])
    const meExpr = pick<Expr>(t, [[0, 'love'], [ASK, 'love'], [NO + 0.3, 'surprised'], [NO + 1.4, 'sad'], [10.4, 'normal']])
    const cExpr = pick<Expr>(t, [[0, 'normal'], [ASK + 0.2, 'surprised'], [NO, 'normal']])
    const top = GROUND - headH(me), ctop = GROUND - headH(crush)
    const letter = t < NO + 0.6 ? <g transform="scale(1.4)"><LoveLetter /></g> : undefined
    const wind = seg(t, LEAVE, LEAVE + 4)
    return (
      <g>
        <SchoolYard dusk={0.4 + 0.5 * seg(t, 0, 10)} />
        <Actor c={me} x={MEX} pose={mePose} expr={meExpr} holding={letter} />
        <Actor c={crush} x={cX} flip={t < LEAVE} pose={cPose} expr={cExpr} />
        {/* 떨어진 편지 (거절 뒤 손에서 툭) */}
        {t > NO + 0.6 && <g transform={`translate(${MEX + 26} ${keys(t, [[NO + 0.6, GROUND - 40], [NO + 1.2, GROUND - 2]], ease.in)}) rotate(${keys(t, [[NO + 0.6, 0], [NO + 1.2, 80]])}) scale(1.2)`}><LoveLetter /></g>}
        {/* 바람에 날리는 벚꽃잎 */}
        {Array.from({ length: 12 }, (_, i) => {
          const q = (t * (0.12 + wind * 0.15) + i / 12) % 1
          const px = 330 - q * 360 + Math.sin(t * 2 + i) * 10, py = 40 + ((i * 37) % 100) + Math.sin(t * 3 + i) * 6
          return <path key={i} transform={`translate(${px} ${py}) rotate(${t * 120 + i * 30})`} d="M0 0 Q2 -3 4 0 Q2 3 0 0Z" fill="#F7C6D6" stroke={INK} strokeWidth="0.4" />
        })}
        {t > 0.4 && t < ASK && <Sweat t={t} t0={0.4} x={MEX + 22} y={top + 16} />}
        <Exclaim t={t} t0={ASK + 0.3} x={cX - 18} y={ctop + 4} />
        <Gloom t={t} t0={ALONE + 0.6} x={MEX + 4} y={top - 16} />
        <Bubble t={t} t0={0.4} t1={COME + 1.2} at={MEX + 2} y={top - 12} text="두근두근…" />
        <Bubble t={t} t0={ASK + 0.1} t1={NO - 0.2} at={MEX + 2} y={top - 12} text="좋아해! 받아 줘!" />
        <Bubble t={t} t0={NO} t1={LEAVE + 0.6} at={cX} tail="right" y={ctop - 12} text="미안… 우리 친구로 지내자" size={12} />
        <Bubble t={t} t0={10.2} t1={11.9} at={MEX + 2} y={top - 12} text="…그래도 말해서 후련해" size={12} />
      </g>
    )
  },
}
