// 장면: 승진·취업·합격 (좋은 일 11.5초, 11-28 다시 다듬음)
// 동료들과 한 줄로 서 있음 → 상사 "이번 승진자는…" → "바로 당신!" (가리킴) → "저요?!" → 앞으로 걸어 나감
// → 선물을 건넴 (승진: 팀장 명패 / 취업: 사원증 / 합격: 합격증) → 꾸벅 받고 악수 → 동료 박수 · 만세 · 색종이 · 현수막
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Office } from './Backdrops3'
import { Bubble, Hearts, Sweat } from './Fx'
import { Exclaim } from './Fx2'
import { Confetti } from './Fx3'
import { Banner } from './Props3'
import { INK, keys, pick, poseAt } from './kit'
import { BOW, CLAP, gaitOf, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'
import { DEFAULT_OUTFIT } from '../engine/outfit'

const LINE = 112, FRONT = 192, BOSSX = 244
const CALL = 1.8, ME = 2.8, WALK = 3.4, AT = 5.0, GIVE = 5.4, CHEERT = 7.4

const CO1 = { outfit: { ...DEFAULT_OUTFIT, gender: 'f' as const, hair: 'bun', hairColor: '#3A2A1A', top: 'shirt', topColor: '#C9A27A', bottomColor: '#5A5A6A', shoes: 'loafers', shoesColor: '#2A2118' }, age: 30 }
const CO2 = { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#2A2118', top: 'tie', topColor: '#DDEFF8', outer: 'vest', outerColor: '#5A6A7A', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118' }, age: 33 }
const BOSS = { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#8A8A8A', top: 'tie', topColor: '#FFFFFF', outer: 'jacket', outerColor: '#3A3A44', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118', acc: 'glasses' }, age: 55 }

/** 팀장 명패 (나무 받침 + 금색 판) */
const Nameplate = () => <g transform="rotate(-10)"><path d="M-14 0 L-11 -10 H11 L14 0Z" fill="#8A5A34" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" /><rect x="-9" y="-9" width="18" height="7" rx="1" fill="#E8C060" stroke={INK} strokeWidth="0.9" /><text x="0" y="-3.6" textAnchor="middle" fontSize="5" fill={INK}>팀장</text></g>
/** 사원증 (목걸이 줄 + 카드) */
const Badge = () => <g><path d="M-6 -16 Q0 -6 6 -16" stroke="#2E6FD8" strokeWidth="1.4" fill="none" /><rect x="-6" y="-8" width="12" height="15" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.2" /><circle cy="-3" r="2.4" fill="#F6D2B8" stroke={INK} strokeWidth="0.6" /><path d="M-3 2 H3 M-3 4.5 H2" stroke="#2E6FD8" strokeWidth="1" /></g>
/** 합격증 (펼친 종이) */
const Certificate = () => <g transform="rotate(-8)"><rect x="-10" y="-14" width="20" height="15" rx="1" fill="#FFF6EA" stroke={INK} strokeWidth="1.2" /><text x="0" y="-8" textAnchor="middle" fontSize="4.6" fill="#C2452D">합격증</text><path d="M-6 -4 H6 M-6 -1.5 H4" stroke="#B8A898" strokeWidth="0.9" /><circle cx="6" cy="-2" r="1.8" fill="none" stroke="#E0533F" strokeWidth="0.8" /></g>

export const promo: SceneDef = {
  id: 'promo',
  dur: 11.5,
  still: GIVE + 0.6,
  draw: (t, cast, text) => {
    const me = cast[0]
    const kind = /취업/.test(text) ? 'job' : /합격/.test(text) ? 'pass' : 'promo'
    const L = {
      job: { call: '이번 신입 사원은…', give: '함께 일해 봐요!', yay: '드디어 취업!', banner: '취업 축하!', Gift: Badge },
      pass: { call: '이번 합격자는…', give: '합격 축하해요!', yay: '합격이다!', banner: '합격!', Gift: Certificate },
      promo: { call: '이번 승진자는…', give: '승진 축하해요!', yay: '해냈다!', banner: '승진!', Gift: Nameplate },
    }[kind]
    const Gift = L.Gift
    const g = gaitOf(me, 0.8)
    // 처음엔 동료들과 한 줄 → 이름이 불리면 앞으로 걸어 나감
    const x = keys(t, [[WALK, LINE], [AT, FRONT]], (k) => k)
    const wait: SidePose = { ...STAND, armN: [10, 20], armF: [6, 20] }
    const point: SidePose = { ...STAND, lean: 6, armN: [92, 4], armF: [-4, 10] }
    const startled: SidePose = { ...STAND, lean: -6, head: -6, armN: [60, 120], armF: [20, 30] } // "저요?" 자기 가리킴
    const receive: SidePose = { ...BOW(0.4), armN: [72, 20], armF: [64, 20] }
    const shake: SidePose = { ...STAND, lean: 6, armN: [70, 10 + 6 * Math.sin(t * 14)], armF: [-4, 10] }
    const yay = (tt: number): SidePose => ({ ...STAND, head: -8, armN: [104 + 6 * Math.sin(tt * 9), 40], armF: [155 + 8 * Math.sin(tt * 9), 8], bob: -Math.abs(Math.sin(tt * 9)) * 4 })
    const mePose = poseAt(t, [[0, wait], [ME - 0.2, wait], [ME, startled], [WALK, startled], [WALK + 0.2, g.pose], [AT - 0.1, g.pose], [AT + 0.2, wait], [GIVE, wait], [GIVE + 0.3, receive], [GIVE + 1.0, receive], [GIVE + 1.3, shake], [CHEERT - 0.2, shake], [CHEERT, yay]])
    const bossGive: SidePose = { ...STAND, lean: 12, armN: [76, 8] }
    const bossShake: SidePose = { ...STAND, lean: 6, armN: [70, 10 + 6 * Math.sin(t * 14)] }
    const bossPose = poseAt(t, [[0, { ...STAND, armN: [30, 70], armF: [24, 70] }], [CALL - 0.2, { ...STAND, armN: [30, 70], armF: [24, 70] }], [CALL, point], [ME + 0.4, point], [ME + 0.7, STAND], [GIVE - 0.3, STAND], [GIVE, bossGive], [GIVE + 0.8, bossGive], [GIVE + 1.3, bossShake], [CHEERT - 0.2, bossShake], [CHEERT + 0.2, CLAP]])
    const coPose = (i: number) => (t > GIVE + 1.2 ? CLAP(t + i * 0.3) : t > CALL && t < AT ? { ...STAND, head: -4, armN: [20, 30] } as SidePose : STAND)
    const meExpr = pick<Expr>(t, [[0, 'normal'], [ME, 'surprised'], [AT, 'normal'], [GIVE + 0.4, 'happy'], [CHEERT, 'love'], [9.5, 'happy']])
    const top = GROUND - headH(me), btop = GROUND - headH(BOSS)
    const has = t > GIVE + 0.7
    return (
      <g>
        <Office />
        {/* 동료들 (한 줄, 나는 맨 앞 자리) */}
        <Actor c={CO2} x={36} size={58} pose={coPose(1)} expr={t > GIVE + 1.2 ? 'happy' : t > ME ? 'surprised' : 'normal'} caneLean />
        <Actor c={CO1} x={74} size={58} pose={coPose(0)} expr={t > GIVE + 1.2 ? 'happy' : t > ME ? 'surprised' : 'normal'} caneLean />
        <Actor c={BOSS} x={BOSSX} pose={bossPose} expr="happy" flip holding={!has && t > GIVE - 0.4 ? <g transform="scale(1.6)"><Gift /></g> : undefined} />
        <Actor c={me} x={x} pose={mePose} expr={meExpr} holding={has ? <g transform="scale(1.6)"><Gift /></g> : undefined} caneLean={t < WALK || t > AT} />
        <Sweat t={t} t0={0.6} x={LINE + 22} y={top + 18} dur={1.0} />
        <Exclaim t={t} t0={ME} x={LINE - 16} y={top + 2} />
        <Confetti t={t} t0={CHEERT} dur={3.6} />
        {t > CHEERT && <Banner x={84} y={4} text={L.banner} w={100} />}
        <Hearts t={t} t0={9.6} x={FRONT - 26} y={top + 20} n={3} />
        <Bubble t={t} t0={0.3} t1={CALL} at={BOSSX - 6} tail="right" y={btop - 14} text={L.call} size={13} />
        <Bubble t={t} t0={CALL} t1={ME + 0.6} at={BOSSX - 6} tail="right" y={btop - 14} text="바로 당신!" />
        <Bubble t={t} t0={ME + 0.2} t1={WALK + 0.6} at={LINE + 8} y={top - 14} text="저요?!" />
        <Bubble t={t} t0={GIVE + 0.4} t1={CHEERT} at={BOSSX - 6} tail="right" y={btop - 14} text={L.give} />
        <Bubble t={t} t0={CHEERT + 0.3} t1={10.2} at={FRONT - 6} tail="right" y={Math.max(top - 20, 64)} text={L.yay} />
      </g>
    )
  },
}
