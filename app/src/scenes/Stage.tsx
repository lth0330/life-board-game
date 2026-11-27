// 사건 장면 무대: 시간을 흘려 장면을 그리고, 누르면 넘김. '움직임 줄이기'면 멈춘 한 장면
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SideCharacter, type SidePose } from '../art/SideCharacter'
import { aged, Character, type Expr, type Pose } from '../art/Character'
import { DEFAULT_OUTFIT, type Outfit } from '../engine/outfit'

export const W = 320, H = 180 // 무대 크기 (그림 단위)
export const GROUND = 158 // 기본 땅 높이

export interface Cast { outfit: Outfit; age?: number }
/** 친구가 모자랄 때(혼자 하기 등) 쓰는 기본 친구 */
export const DEFAULT_FRIENDS: Cast[] = [
  { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'bob', hairColor: '#5A3A22', topColor: '#F2C230' }, age: 25 },
  { outfit: { ...DEFAULT_OUTFIT, hair: 'curly', topColor: '#7FCB8A' }, age: 25 },
]
/** 배우자·연인 (게임에 따로 옷이 없어서 내 성별 반대의 기본 모습, 나이는 비슷하게) */
export const partnerOf = (me: Cast): Cast => me.outfit.gender === 'f'
  ? { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#3A2A1A', top: 'tie', topColor: '#FFFFFF', outer: 'jacket', outerColor: '#2E3A5C', bottomColor: '#2E3A5C', shoes: 'loafers', shoesColor: '#2A2118' }, age: me.age }
  : { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'long', hairColor: '#5A3A22', top: 'dress', topColor: '#F7D3E2', shoes: 'loafers', shoesColor: '#E08AA0' }, age: me.age }
/** 장면에 나올 사람 i번째 (없으면 기본 친구) */
export const castAt = (cast: Cast[], i: number) => cast[i] ?? DEFAULT_FRIENDS[(i - 1) % DEFAULT_FRIENDS.length]
export interface SceneDef {
  id: string
  dur: number // 초
  still: number // 움직임 줄이기 때 보여 줄 순간 (초)
  draw: (t: number, cast: Cast[], text: string) => ReactNode // text = 사건 문장 (나이·사건마다 조금 다르게)
}

/** 무대 위 캐릭터: (x, y) = 발 가운데. rot = 발 기준으로 몸 전체 기울이기 (넘어질 때) */
export function Actor({ c, x, y = GROUND, size = 62, pose, expr, rot = 0, rotAt, flip, noCane, caneLean, holding }: {
  c: Cast; x: number; y?: number; size?: number; pose?: SidePose; expr?: Expr; rot?: number; rotAt?: [number, number]; flip?: boolean; noCane?: boolean; caneLean?: boolean; holding?: ReactNode
}) {
  const [rx, ry] = rotAt ?? [x, y]
  const lie = Math.abs(Math.sin((rot * Math.PI) / 180))
  return (
    <g>
    {/* 그림자는 돌리지 않고 땅에 (누우면 옆으로 길게) */}
    <ellipse cx={x + Math.sin((rot * Math.PI) / 180) * size * 0.75} cy={y + 1} rx={size * (0.2 + 0.55 * lie)} ry={4} fill="rgba(42,33,24,0.16)" />
    <g transform={`rotate(${rot} ${rx} ${ry})`}>
      <g transform={`translate(${x - size / 2} ${y - size * 1.9})`}>
        <SideCharacter outfit={c.outfit} age={c.age} size={size} pose={pose} expr={expr} flip={flip} noCane={noCane} caneLean={caneLean} holding={holding} noShadow />
      </g>
    </g>
    </g>
  )
}

/** 정면(또는 뒷모습) 캐릭터: (x, y) = 발 가운데. 앞을 보고 앉은 사람·사진사 뒷모습 등에 씀 */
export function FrontActor({ c, x, y = GROUND, size = 60, expr, pose, back }: { c: Cast; x: number; y?: number; size?: number; expr?: Expr; pose?: Pose; back?: boolean }) {
  return (
    <g transform={`translate(${x - size / 2} ${y - size * 1.88})`}>
      <Character outfit={c.outfit} age={c.age} size={size} expr={expr} pose={pose} view={back ? 'back' : 'front'} />
    </g>
  )
}

/** 서 있을 때 발에서 머리 꼭대기까지 높이(px). 말풍선·효과를 머리 위에 맞출 때 씀 (아이는 작음) */
export function headH(c: Cast, size = 62) {
  const a = aged(c.outfit, c.age)
  const body = a.extra === 'baby' ? 1.3 : a.extra === 'kinder' ? 1.55 : 1.82
  return size * body * a.scale
}
export const isKid = (c: Cast) => (c.age ?? 30) < 13
export const isOld = (c: Cast) => (c.age ?? 30) >= 65

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 장면 재생. speed 2 = 두 배 빠르게. at을 주면 그 순간에 멈춤 (시험·캡처용) */
export function ScenePlayer({ scene, cast, text = '', speed = 1, at, onDone, onSkip }: {
  scene: SceneDef; cast: Cast[]; text?: string; speed?: number; at?: number; onDone?: () => void; onSkip?: () => void
}) {
  const still = at ?? (reduced() ? scene.still : undefined)
  const [t, setT] = useState(still ?? 0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (still !== undefined) { setT(still); return }
    const s0 = performance.now()
    let r = 0, ended = false
    const f = () => {
      const x = Math.min(scene.dur, ((performance.now() - s0) / 1000) * speed)
      setT(x)
      if (x >= scene.dur) { if (!ended) { ended = true; done.current?.() } return }
      r = requestAnimationFrame(f)
    }
    r = requestAnimationFrame(f)
    return () => cancelAnimationFrame(r)
  }, [scene, speed, still])
  return (
    <div className="scene" onClick={onSkip} style={{ position: 'relative', cursor: onSkip ? 'pointer' : undefined, lineHeight: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'hidden', fontFamily: "'Jua', sans-serif" }} aria-hidden="true">
        {scene.draw(t, cast, text)}
      </svg>
      {still === undefined && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${(t / scene.dur) * 100}%`, background: 'rgba(42,33,24,0.45)' }} />}
    </div>
  )
}
