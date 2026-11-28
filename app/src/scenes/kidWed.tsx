// 장면: 자녀 결혼 (좋은 일 11.5초, 중년·노년, 11-28). 식장 앞줄 혼주석에 배우자와 앉아 있음
// → 신랑·신부(우리 아이)가 부모님께 큰절(허리 숙여 인사) → 손수건으로 눈물 "잘 살아라…" → 꽃잎 · 손뼉
import { Actor, GROUND, headH, partnerOf, type SceneDef } from './Stage'
import { Hall } from './wedding'
import { SideChair } from './Props4'
import { Bubble, Hearts } from './Fx'
import { Petals } from './Fx3'
import { INK, pick, poseAt } from './kit'
import { BOW, SIT_LEGS, sitLift, STAND } from './poses'
import { grownKids } from './people'
import { DEFAULT_OUTFIT } from '../engine/outfit'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const BOW0 = 1.6, BOW1 = 3.6, TEAR = 4.2, SPEAK = 6.0, CHEER = 8.6
const MEX = 56, SPX = 96, GX = 196, BX = 222

export const kidWed: SceneDef = {
  id: 'kidWed',
  dur: 11.5,
  still: 3.0,
  draw: (t, cast) => {
    const me = cast[0], sp = partnerOf(me)
    const [son, daughter] = grownKids(me)
    // 신랑·신부: 내 아이 + 그 짝 (흰 드레스 · 검은 턱시도)
    const groom = { ...son, outfit: { ...son.outfit, top: 'tie', topColor: '#FFFFFF', outer: 'jacket', outerColor: '#2A2118', bottomColor: '#2A2118' } }
    const bride = { ...daughter, outfit: { ...DEFAULT_OUTFIT, gender: 'f' as const, hair: 'bun', hairColor: '#5A3A21', top: 'dress', topColor: '#FFFFFF', bottom: 'longskirt', bottomColor: '#FFFFFF', shoes: 'loafers', shoesColor: '#FFFFFF', hat: 'ribbon', hatColor: '#FFFFFF' } }
    const lift = sitLift(me, 30), spLift = sitLift(sp, 30)
    const sit: SidePose = { ...SIT_LEGS, armN: [30, 50], armF: [24, 50] }
    const wipe = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 6, head: 8, armN: [70, 120 + 6 * Math.sin(tt * 6)], armF: [24, 50] })
    const clapS = (tt: number): SidePose => ({ ...SIT_LEGS, armN: [55, 50 + 18 * Math.max(0, Math.sin(tt * 16))], armF: [55, 40 + 18 * Math.max(0, Math.sin(tt * 16))] })
    const mePose = poseAt(t, [[0, sit], [TEAR, sit], [TEAR + 0.3, wipe], [SPEAK + 2.4, wipe], [CHEER, clapS]])
    const spPose = poseAt(t, [[0, sit], [TEAR + 0.6, sit], [TEAR + 0.9, { ...SIT_LEGS, lean: 4, armN: [60, 30], armF: [24, 50] }], [CHEER, clapS]]) // 어깨 토닥
    const bowK = (k0: number) => poseAt(t, [[0, STAND], [BOW0, STAND], [BOW0 + 0.6, BOW(1)], [BOW1, BOW(1)], [BOW1 + 0.6, STAND], [CHEER, STAND], [CHEER + 0.3, { ...STAND, armN: [60, 60], armF: [56, 60] }]].map(([tt, p]) => [(tt as number) + k0, p]) as never)
    const meExpr = pick<Expr>(t, [[0, 'happy'], [TEAR, 'sad'], [CHEER, 'happy']])
    const top = GROUND - lift - (headH(me) - 22)
    const handkerchief = t > TEAR + 0.2 && t < CHEER ? <g transform="translate(-4 -2) rotate(-20)"><path d="M-6 -6 L6 -6 L5 6 L-5 6Z" fill="#FFFFFF" stroke={INK} strokeWidth="1" /><path d="M-4 -3 H4 M-4 1 H3" stroke="#F3A3C0" strokeWidth="0.8" /></g> : undefined
    return (
      <g>
        <Hall />
        {/* 혼주석: 앞줄 의자 두 개 (등받이 커버·리본) */}
        <SideChair x={MEX - 4} y={GROUND} h={30} color="#FFFFFF" />
        <SideChair x={SPX - 4} y={GROUND} h={30} color="#FFFFFF" />
        <Actor c={me} x={MEX} y={GROUND - lift} pose={mePose} expr={meExpr} holding={handkerchief} noCane />
        <Actor c={sp} x={SPX} y={GROUND - spLift} pose={spPose} expr={t > TEAR ? 'love' : 'happy'} noCane />
        <Actor c={groom} x={GX} flip pose={bowK(0)} expr="happy" />
        <Actor c={bride} x={BX} flip pose={bowK(0.15)} expr="happy" holding={t < BOW0 || t > BOW1 + 0.6 ? <g transform="scale(0.9)"><path d="M0 -4 Q-10 -16 0 -22 Q10 -16 0 -4Z" fill="#F7D3E2" stroke={INK} strokeWidth="1" />{[[-4, -16], [0, -20], [4, -16], [0, -13]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="3" fill={['#F2708A', '#FFFFFF', '#F2708A', '#F7B8C8'][i]} stroke={INK} strokeWidth="0.6" />)}</g> : undefined} />
        <Petals t={t} t0={CHEER - 0.4} n={16} />
        <Hearts t={t} t0={CHEER + 0.2} x={(GX + BX) / 2} y={GROUND - headH(groom) - 4} n={3} />
        <Bubble t={t} t0={0.3} t1={BOW0 + 0.6} at={GX} tail="right" y={GROUND - headH(groom) - 14} text="잘 살겠습니다!" />
        <Bubble t={t} t0={SPEAK} t1={CHEER} at={MEX + 2} y={top - 12} text="잘 살아라…" />
        <Bubble t={t} t0={CHEER + 0.3} t1={11.4} at={SPX + 2} y={GROUND - spLift - (headH(sp) - 22) - 12} text="축하한다, 얘들아!" size={12} />
      </g>
    )
  },
}
