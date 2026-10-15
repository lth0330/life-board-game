import type { CSSProperties, ReactElement } from 'react'
import { distancesFrom, EVENT_ROAD_NAME } from '../engine/board'
import { MINI_NAMES } from '../engine/game'
import type { GameState, Player, Tile } from '../engine/types'

const TILE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  money: { label: '돈', bg: '#2F8F5B', fg: '#fff' },
  grow: { label: '성장', bg: '#2E6FD8', fg: '#fff' },
  happy: { label: '행복', bg: '#F2C230', fg: '#2A2118' },
  risk: { label: '위기', bg: '#C2452D', fg: '#fff' },
  card: { label: '카드', bg: '#6F45BD', fg: '#fff' },
  stop: { label: '정지', bg: '#2A2118', fg: '#FFF7E8' },
  date: { label: '연애', bg: '#F3A3C0', fg: '#3A1020' },
  mini: { label: '게임', bg: '#E8742C', fg: '#fff' },
  rest: { label: '휴식', bg: '#E9DFC8', fg: '#2A2118' },
  goal: { label: '골', bg: '#FFD45C', fg: '#2A2118' },
}

const STOP_LABEL: Record<string, string> = { club: '동아리', job: '직업', jobfair: '박람회', middleBranch: '새 가족' }

export function tileLook(t: Tile) {
  const base = TILE_STYLE[t.kind]
  const label = t.stop ? STOP_LABEL[t.stop] : t.mini ? MINI_NAMES[t.mini] : base.label
  return { ...base, label }
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
const LANE = 250
const stand: CSSProperties = { transformOrigin: '50% 100%', transform: `rotateX(-${TILT}deg)` }

interface Props { s: GameState; focus: Player; showSteps: boolean }

export function Board({ s, focus, showSteps }: Props) {
  const st = s.stages[s.stageIdx]
  const fd = st.tiles[focus.pos].d
  const xAt = (t: Tile) => 540 + Math.round(Math.sin(t.d * 0.55) * 150) + t.lane * LANE - 60
  const yAt = (t: Tile) => 1600 - (t.d - fd) * 150
  const visible = (t: Tile) => t.d >= fd - 1.2 && t.d <= fd + 10
  const steps = showSteps ? distancesFrom(st, focus.pos, 6) : new Map<number, number>()
  const items: ReactElement[] = []
  // 갈라진 길이 지나는 쪽에는 건물·나무를 더 바깥으로 밀어냄
  const sideBusy = (d: number, side: number) => st.tiles.some((x) => x.lane === side && Math.abs(x.d - d) < 2.5)
  const decorX = (t: Tile, side: number, near: number, far: number) => xAt(t) + side * (sideBusy(t.d, side) ? far : near) + (side < 0 ? -110 : 0)

  st.tiles.forEach((t, i) => {
    if (!visible(t)) return
    const look = tileLook(t)
    const step = steps.get(i)
    const small = look.label.length > 3
    items.push(
      <div key={`t${i}`} className={`tile${t.kind === 'mini' ? ' tile-mini' : ''}`} style={{ left: xAt(t), top: yAt(t), background: look.bg, color: look.fg, fontSize: small ? 22 : undefined }}>
        {look.label}
        {step && <span className="tile-step">{step}</span>}
      </div>,
    )
    // 갈림길 표지판
    if (t.fork) {
      items.push(
        <div key={`f${i}`} className="sign-post" style={{ ...stand, left: xAt(t) - 330, top: yAt(t) - 200 }}>
          <div className="sign-board">
            {t.fork.options.map((o) => {
              const target = st.tiles[o.to]
              const dir = target.lane < t.lane ? '◀' : target.lane > t.lane ? '▶' : '▲'
              return <div key={o.to}>{dir} {o.label}</div>
            })}
          </div>
          <div className="sign-pole" />
        </div>,
      )
    }
    if (t.point) {
      const left = decorX(t, t.d % 2 ? 1 : -1, 170, 420)
      const shop = t.point === 'shop'
      items.push(
        <div key={`p${i}`} className="bld" style={{ ...stand, left, top: yAt(t) - 260, width: 260, height: 330 }}>
          <div className="roof" style={{ width: 260, height: 100, background: shop ? '#2C5E8A' : '#E9A3BC' }} />
          <div className="wall" style={{ width: 220, background: shop ? '#fff' : '#FFF5F8' }}>
            <span className="sign" style={{ background: shop ? '#2C5E8A' : '#B0476F' }}>{shop ? '상점' : '결혼식장'}</span>
          </div>
        </div>,
      )
    } else if (t.road === 'main' && !t.fork && t.d % 4 === 2) {
      const name = DECOR[st.id][Math.floor(t.d / 4) % 4]
      const left = decorX(t, (t.d / 4) % 2 ? 1 : -1, 190, 430)
      items.push(
        <div key={`d${i}`} className="bld" style={{ ...stand, left, top: yAt(t) - 200, width: 220, height: 270 }}>
          <div className="roof" style={{ width: 220, height: 80, background: ROOFS[i % ROOFS.length] }} />
          <div className="wall" style={{ width: 180, background: '#F2E2C4' }}>
            <span className="sign" style={{ background: '#5A3A21' }}>{name}</span>
          </div>
        </div>,
      )
    } else if (t.road === 'main' && Math.round(t.d) % 2 === 1) {
      const left = decorX(t, Math.round(t.d) % 3 ? -1 : 1, 120, 400)
      items.push(
        <div key={`r${i}`} className="tree" style={{ ...stand, left, top: yAt(t) - 60 }}>
          <div className="leaf" /><div className="trunk" />
        </div>,
      )
    }
    // 갈라진 길의 첫 칸에 길 이름 깃발
    const prev = st.tiles.find((x) => x.fork && x.next.includes(i))
    if (prev && t.road !== 'main') {
      const name = t.road === 'event' ? EVENT_ROAD_NAME[st.id] : prev.fork!.options.find((o) => o.to === i)?.label ?? ''
      items.push(
        <div key={`g${i}`} className="road-flag" style={{ ...stand, left: xAt(t) - 10, top: yAt(t) - 150 }}>
          <span>{name}</span>
        </div>,
      )
    }
  })

  // 사람들 (같은 칸이면 옆으로 비켜 섬)
  const byTile = new Map<number, Player[]>()
  for (const p of s.players) if (visible(st.tiles[p.pos])) byTile.set(p.pos, [...(byTile.get(p.pos) ?? []), p])
  for (const [i, ps] of byTile) {
    const t = st.tiles[i]
    ps.forEach((p, k) => {
      const dx = (k - (ps.length - 1) / 2) * 60
      const me = p.id === focus.id
      items.push(
        <div key={`s${p.id}`} className="shadow" style={{ left: xAt(t) + 20 + dx, top: yAt(t) + 70 }} />,
        <div key={`c${p.id}`} className="char" style={{ ...stand, left: xAt(t) + 25 + dx, top: yAt(t) - 50 }}>
          <div className="head" style={{ borderColor: p.color }} />
          <div className="body" style={{ background: p.color }} />
          <div className="name-tag" style={{ background: me ? '#2A2118' : 'rgba(42,33,24,0.6)', top: -48 - k * 34 }}>{p.name}</div>
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

// 전체 지도: 아래에서 위로, 왼쪽 길 / 본 길 / 오른쪽 길
export function FullMap({ s, onClose }: { s: GameState; onClose: () => void }) {
  const st = s.stages[s.stageIdx]
  const sorted = st.tiles.map((t, i) => ({ t, i })).sort((a, b) => b.t.d - a.t.d || a.t.lane - b.t.lane)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="jua">{st.name}의 길 · 전체 지도</h2>
          <button className="x" onClick={onClose}>닫기</button>
        </div>
        <p className="muted">아래에서 위로 걸어가요. 가운데가 본 길, 양옆이 갈라지는 길이에요.</p>
        <div className="map-col">
          {sorted.map(({ t, i }) => {
            const look = tileLook(t)
            const here = s.players.filter((p) => p.pos === i)
            return (
              <div key={i} className="map-row" style={{ justifyContent: t.lane < 0 ? 'flex-start' : t.lane > 0 ? 'flex-end' : 'center' }}>
                <div className="map-tile" style={{ background: look.bg, color: look.fg }}>
                  <span>{look.label}</span>
                  {t.point && <em>{t.point === 'shop' ? '상점' : '결혼'}</em>}
                  {t.fork && <em>갈림길</em>}
                  <div className="map-dots">{here.map((p) => <i key={p.id} style={{ background: p.color }} />)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
