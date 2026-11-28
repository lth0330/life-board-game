// 장면: 옛 사진 정리 (노년, 11초, 11-28). 소파에 앉아 앨범을 펼침 → 사진을 한 장씩 꺼내 봄
// (젊은 날 바다 → 결혼식 날 → 아이들 어릴 때가 크게 떠오름) → 웃음, 눈가가 촉촉 "이땐 참 젊었지…" → 사진을 앨범에 꽂고 쓰다듬음
import { Actor, GROUND, headH, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { SideSofa, SideTable } from './Props2'
import { Album, Photo, TeaCup } from './Props4'
import { Bubble, Hearts } from './Fx'
import { INK, ease, pick, poseAt, seg } from './kit'
import { SIT_LEGS, sitLift } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const SOFA = 92
const SHOTS: { t0: number; kind: 'sea' | 'couple' | 'kids'; cap: string }[] = [
  { t0: 1.4, kind: 'sea', cap: '스무 살 여름, 바다' },
  { t0: 3.6, kind: 'couple', cap: '결혼식 날' },
  { t0: 5.8, kind: 'kids', cap: '아이들 어릴 때' },
]
const PUT = 8.0

export const photos: SceneDef = {
  id: 'photos',
  dur: 11,
  still: 4.4,
  draw: (t, cast) => {
    const me = cast[0]
    const lift = sitLift(me, 30)
    const look = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 8, head: 10 + 2 * Math.sin(tt * 2), armN: [74, 50], armF: [60, 60] })
    const lift1: SidePose = { ...SIT_LEGS, lean: 2, head: -4, armN: [100, 40], armF: [60, 60] } // 사진을 눈높이로 들어 봄
    const stroke = (tt: number): SidePose => ({ ...SIT_LEGS, lean: 12, head: 14, armN: [70 + 6 * Math.sin(tt * 4), 40], armF: [60, 60] })
    const keysP: [number, SidePose | ((t: number) => SidePose)][] = [[0, look]]
    SHOTS.forEach((s) => { keysP.push([s.t0 - 0.3, look], [s.t0, lift1], [s.t0 + 1.6, lift1], [s.t0 + 1.9, look]) })
    keysP.push([PUT, look], [PUT + 0.4, stroke])
    const pose = poseAt(t, keysP)
    const cur = [...SHOTS].reverse().find((s) => t > s.t0 && t < s.t0 + 2.0)
    const expr = pick<Expr>(t, [[0, 'normal'], [1.6, 'happy'], [3.8, 'love'], [6.0, 'happy'], [PUT, 'sad'], [9.2, 'happy']])
    const y = GROUND - lift
    const top = y - (headH(me) - 22)
    return (
      <g>
        <Home winX={214} frameX={20} />
        <SideSofa x={SOFA} y={GROUND} />
        <Actor c={me} x={SOFA + 6} y={y} pose={pose} expr={expr} noCane caneLean holding={cur ? <g transform="scale(1.6)"><Photo w={14} h={11} kind={cur.kind} old /></g> : undefined} />
        {/* 무릎 위 앨범 */}
        <Album x={SOFA + 34} y={y - 22} s={0.8} />
        <SideTable x={SOFA + 72} y={GROUND} />
        <g transform={`translate(${SOFA + 72} ${GROUND - 31})`}><TeaCup t={t} /></g>
        {/* 떠오르는 추억: 사진이 크게 (빛바랜 테두리 + 글) */}
        {SHOTS.map((s) => {
          const k = ease.back(seg(t, s.t0 + 0.2, s.t0 + 0.6)) * (1 - seg(t, s.t0 + 1.8, s.t0 + 2.1))
          if (k <= 0) return null
          return (
            <g key={s.kind} transform={`translate(236 64) scale(${k})`}>
              <circle cx="-38" cy="20" r="3" fill="#fff" stroke={INK} strokeWidth="1" /><circle cx="-46" cy="28" r="2" fill="#fff" stroke={INK} strokeWidth="1" />
              <g transform="scale(3.6) rotate(-4)"><Photo w={22} h={17} kind={s.kind} old /></g>
              <text y="40" textAnchor="middle" fontSize="9" fill="#7A5232" stroke="#fff" strokeWidth="2.4" paintOrder="stroke">{s.cap}</text>
            </g>
          )
        })}
        <Hearts t={t} t0={3.9} x={SOFA + 20} y={top + 6} n={2} />
        <Bubble t={t} t0={PUT + 0.4} t1={10.9} at={SOFA + 8} y={top - 12} text="이땐 참 젊었지…" />
      </g>
    )
  },
}
