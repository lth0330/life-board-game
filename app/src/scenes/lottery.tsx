// 장면: 복권 당첨 (좋은 일 11초). 소파에서 TV 추첨을 보며 번호 하나씩 확인 → 다 맞음 → 벌떡 "당첨!!" → 돈 비 → 방방 뛰기
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bang, Bubble, Hearts } from './Fx'
import { Exclaim } from './Fx2'
import { Confetti, MoneyRain } from './Fx3'
import { Sofa, SofaBack } from './Props2'
import { Ticket } from './Props3'
import { INK, ease, pick, poseAt, seg } from './kit'
import { CHEER, SIT, STAND, sitLift } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const SOFA = 110
const BALLS = [1.4, 2.4, 3.4, 4.4] // 공이 하나씩 나옴
const WIN = 5.0
const NUMS = [7, 15, 23, 38]

/** TV (번호 공) */
function TV({ t }: { t: number }) {
  return (
    <g transform="translate(250 64)">
      <rect x="-46" y="-34" width="92" height="62" rx="5" fill="#1E2A44" stroke={INK} strokeWidth="2.4" />
      <text x="0" y="-18" textAnchor="middle" fontSize="10" fill="#FFE27A">복권 추첨</text>
      {BALLS.map((b, i) => t > b && (
        <g key={i} transform={`translate(${-30 + i * 20} 4) scale(${ease.back(seg(t, b, b + 0.3))})`}>
          <circle r="8.5" fill={['#F2C230', '#5E8FC9', '#E0533F', '#7FBF6A'][i]} stroke={INK} strokeWidth="1.4" />
          <text textAnchor="middle" y="3.5" fontSize="9" fill="#fff">{NUMS[i]}</text>
        </g>
      ))}
      {/* TV 받침 다리 + 낮은 나무 TV장 (서랍 2칸, 다리) */}
      <path d="M-6 28 L-12 36 H12 L6 28Z" fill="#3A3434" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="-54" y="36" width="108" height="8" rx="2" fill="#C98B55" stroke={INK} strokeWidth="2" />
      <rect x="-50" y="44" width="100" height="34" fill="#B07A44" stroke={INK} strokeWidth="2" />
      <path d="M0 44 V78" stroke={INK} strokeWidth="1.6" />
      <path d="M-30 58 h12 M18 58 h12" stroke="#6A4424" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-44 78 v12 M44 78 v12" stroke={INK} strokeWidth="3" />
    </g>
  )
}

export const lottery: SceneDef = {
  id: 'lottery',
  dur: 11,
  still: 7.0,
  draw: (t, cast, text) => {
    const me = cast[0]
    const rank = /(\d)등/.exec(text)?.[1] ?? '1' // 사건 문장의 등수 (11-28 사용자: "대박이다" 대신 "1등이다!")
    const seatY = GROUND - sitLift(me, 30)
    // 공 나올 때마다 복권을 내려다봤다가 TV를 봄
    const look = (tt: number): SidePose => {
      const near = BALLS.some((b) => tt > b + 0.2 && tt < b + 0.7)
      return { ...SIT, armN: [56, 70], armF: [40, 70], head: near ? 22 : -6, lean: near ? 10 : 2 }
    }
    const jump = (tt: number): SidePose => ({ ...CHEER(tt), bob: -Math.abs(Math.sin(tt * 7)) * 14 })
    const pose = poseAt(t, [[0, look], [WIN, look], [WIN + 0.3, { ...STAND, lean: -10, head: -14, armN: [90, 20], armF: [70, 30] }], [6.0, { ...STAND, lean: -10, head: -14, armN: [90, 20], armF: [70, 30] }], [6.3, jump]])
    const expr = pick<Expr>(t, [[0, 'normal'], [2.6, 'surprised'], [3.6, 'normal'], [4.6, 'surprised'], [6.2, 'love'], [8, 'happy']])
    const seated = t < WIN + 0.2
    const top = (seated ? seatY + 22 : GROUND) - headH(me)
    return (
      <g>
        <Home winX={14} frameX={116} />
        <MoneyRain t={t} t0={WIN + 0.6} n={10} />
        <TV t={t} />
        <SofaBack x={SOFA} y={GROUND} w={100} />
        <Sofa x={SOFA} y={GROUND} w={100} />
        <Confetti t={t} t0={WIN + 0.4} dur={4} />
        <Actor c={me} x={seated ? SOFA + 10 : SOFA + 40} y={seated ? seatY : GROUND} pose={pose} expr={expr} holding={t < 6.3 ? <Ticket /> : undefined} caneLean={!seated} />
        {BALLS.map((b, i) => <Exclaim key={i} t={t} t0={b + 0.5} x={SOFA + 40} y={top + 2} text={'!'.repeat(i + 1)} dur={0.8} />)}
        <Bang t={t} t0={WIN} x={SOFA + 42} y={top - 12} text="당첨!!" size={22} dur={1.4} />
        <Hearts t={t} t0={8.0} x={SOFA + 40} y={GROUND - headH(me) + 4} n={3} />
        <Bubble t={t} t0={7.4} t1={10.4} x={SOFA + 4} y={GROUND - headH(me) - 14} text={`${rank}등이다!`} />
      </g>
    )
  },
}
