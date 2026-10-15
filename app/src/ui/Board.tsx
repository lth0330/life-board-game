import type { CSSProperties, ReactElement } from 'react'
import type { GameState, Player, Tile } from '../engine/types'

const TILE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  money: { label: '돈', bg: '#2F8F5B', fg: '#fff' },
  grow: { label: '성장', bg: '#2E6FD8', fg: '#fff' },
  happy: { label: '행복', bg: '#F2C230', fg: '#2A2118' },
  risk: { label: '위기', bg: '#C2452D', fg: '#fff' },
  card: { label: '카드', bg: '#6F45BD', fg: '#fff' },
  stop: { label: '정지', bg: '#2A2118', fg: '#FFF7E8' },
  date: { label: '연애', bg: '#F3A3C0', fg: '#3A1020' },
  map: { label: '맵', bg: '#178C8C', fg: '#fff' },
  rest: { label: '휴식', bg: '#E9DFC8', fg: '#2A2118' },
  goal: { label: '골', bg: '#FFD45C', fg: '#2A2118' },
}

const STOP_LABEL: Record<string, string> = {
  academy: '학원?', club: '동아리', college: '대학?', job: '직업', jobfair: '박람회',
  middleBranch: '갈림길', careerChange: '이직', retire: '은퇴지',
}

export function tileLook(t: Tile) {
  const base = TILE_STYLE[t.kind]
  return { ...base, label: t.stop ? STOP_LABEL[t.stop] : base.label }
}

const DECOR: Record<string, string[]> = {
  child: ['우리 집', '유치원', '놀이터', '문방구'],
  student: ['학교', '학원', '도서관', '분식집'],
  young: ['회사', '카페', '원룸촌', '헬스장'],
  middle: ['병원', '회사', '공원', '마트'],
  old: ['공원', '경로당', '병원', '꽃집'],
}
const ROOFS = ['#B5452F', '#2C5E8A', '#7A5232', '#3F8A4F', '#8A4FA8']

const TILT = 62
const stand: CSSProperties = { transformOrigin: '50% 100%', transform: `rotateX(-${TILT}deg)` }

interface Props { s: GameState; focus: Player; showSteps: boolean }

export function Board({ s, focus, showSteps }: Props) {
  const st = s.stages[s.stageIdx]
  const from = Math.max(0, focus.pos - 1)
  const to = Math.min(st.tiles.length - 1, focus.pos + 10)
  const xAt = (i: number) => 540 + Math.round(Math.sin(i * 0.55) * 170)
  const yAt = (i: number) => 1600 - (i - focus.pos) * 150
  const items: ReactElement[] = []

  for (let i = from; i <= to; i++) {
    const t = st.tiles[i]
    const look = tileLook(t)
    const step = i - focus.pos
    items.push(
      <div key={`t${i}`} className="tile" style={{ left: xAt(i), top: yAt(i), background: look.bg, color: look.fg }}>
        {look.label}
        {showSteps && step >= 1 && step <= 6 && <span className="tile-step">{step}</span>}
      </div>,
    )
    if (t.point) {
      const left = i % 2 ? xAt(i) + 170 : xAt(i) - 300
      const shop = t.point === 'shop'
      items.push(
        <div key={`p${i}`} className="bld" style={{ ...stand, left, top: yAt(i) - 260, width: 260, height: 330 }}>
          <div className="roof" style={{ width: 260, height: 100, background: shop ? '#2C5E8A' : '#E9A3BC' }} />
          <div className="wall" style={{ width: 220, background: shop ? '#fff' : '#FFF5F8' }}>
            <span className="sign" style={{ background: shop ? '#2C5E8A' : '#B0476F' }}>{shop ? '상점' : '결혼식장'}</span>
          </div>
        </div>,
      )
    } else if (i % 4 === 2) {
      const name = DECOR[st.id][Math.floor(i / 4) % 4]
      const left = (i / 4) % 2 ? xAt(i) + 190 : xAt(i) - 300
      items.push(
        <div key={`d${i}`} className="bld" style={{ ...stand, left, top: yAt(i) - 200, width: 220, height: 270 }}>
          <div className="roof" style={{ width: 220, height: 80, background: ROOFS[i % ROOFS.length] }} />
          <div className="wall" style={{ width: 180, background: '#F2E2C4' }}>
            <span className="sign" style={{ background: '#5A3A21' }}>{name}</span>
          </div>
        </div>,
      )
    } else if (i % 2 === 1) {
      const left = i % 3 ? xAt(i) - 210 : xAt(i) + 230
      items.push(
        <div key={`r${i}`} className="tree" style={{ ...stand, left, top: yAt(i) - 60 }}>
          <div className="leaf" /><div className="trunk" />
        </div>,
      )
    }
  }

  // 사람들 (같은 칸이면 옆으로 비켜 섬)
  const byTile = new Map<number, Player[]>()
  for (const p of s.players) if (p.pos >= from && p.pos <= to) byTile.set(p.pos, [...(byTile.get(p.pos) ?? []), p])
  for (const [i, ps] of byTile) {
    ps.forEach((p, k) => {
      const dx = (k - (ps.length - 1) / 2) * 60
      const me = p.id === focus.id
      items.push(
        <div key={`s${p.id}`} className="shadow" style={{ left: xAt(i) + 20 + dx, top: yAt(i) + 70 }} />,
        <div key={`c${p.id}`} className="char" style={{ ...stand, left: xAt(i) + 25 + dx, top: yAt(i) - 50 }}>
          <div className="head" style={{ borderColor: p.color }} />
          <div className="body" style={{ background: p.color }} />
          <div className="name-tag" style={{ background: me ? '#2A2118' : 'rgba(42,33,24,0.6)' }}>{p.name}</div>
        </div>,
      )
    })
  }

  return (
    <div className="world">
      <div className="sky-deco">
        <div className="hill a" /><div className="hill b" />
        <div className="ground" />
        <div className="cloud a" /><div className="cloud b" />
      </div>
      <div className="camera">
        <div className="plane" style={{ transform: `rotateX(${TILT}deg)` }}>{items}</div>
      </div>
    </div>
  )
}

export function FullMap({ s, onClose }: { s: GameState; onClose: () => void }) {
  const st = s.stages[s.stageIdx]
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="jua">{st.name}의 길 · 전체 지도</h2>
          <button className="x" onClick={onClose} aria-label="닫기">닫기</button>
        </div>
        <div className="map-grid">
          {st.tiles.map((t, i) => {
            const look = tileLook(t)
            const here = s.players.filter((p) => p.pos === i)
            return (
              <div key={i} className="map-tile" style={{ background: look.bg, color: look.fg }}>
                <span>{look.label}</span>
                {t.point && <em>{t.point === 'shop' ? '상점' : '결혼'}</em>}
                <div className="map-dots">{here.map((p) => <i key={p.id} style={{ background: p.color }} />)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
