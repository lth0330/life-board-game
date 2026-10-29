import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactElement } from 'react'
import { Building, TileIcon, Tree } from '../art/Art'
import { DECOR_KINDS, GroundDecor, SkyScenery, Weather } from '../art/Scenery'
import { artFile } from '../art/slots'
import { Landmark } from '../art/More'
import { Character, type Expr } from '../art/Character'
import { heightOf } from '../art/height'
import { EmoteBubble, RpsBubble } from './Emotes'
import { ageOf, TEAM_COLORS, UNI_NAMES } from '../engine/game'
import { distancesFrom, EVENT_ROAD_NAME, tileX, tileY, zigOffsets } from '../engine/board'
import { MINI_NAMES } from '../engine/game'
import type { GameState, Player, Tile } from '../engine/types'

const TILE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  good: { label: '좋은 일', bg: '#1E9E8C', fg: '#fff' },
  money: { label: '돈', bg: '#2F8F5B', fg: '#fff' },
  grow: { label: '성장', bg: '#2E6FD8', fg: '#fff' },
  happy: { label: '행복', bg: '#F2C230', fg: '#2A2118' },
  risk: { label: '위기', bg: '#C2452D', fg: '#fff' },
  card: { label: '랜덤이벤트', bg: '#6F45BD', fg: '#fff' },
  stop: { label: '정지', bg: '#2A2118', fg: '#FFF7E8' },
  date: { label: '연애', bg: '#F3A3C0', fg: '#3A1020' },
  mini: { label: '게임', bg: '#E8742C', fg: '#fff' },
  rest: { label: '휴식', bg: '#E9DFC8', fg: '#2A2118' },
  goal: { label: '골', bg: '#FFD45C', fg: '#2A2118' },
  campus: { label: '대학교', bg: '#8A4FA8', fg: '#fff' },
  uni: { label: '대학', bg: '#B48AD8', fg: '#fff' },
}
const UNI_LOOK: Record<string, { bg: string; icon: string }> = {
  study: { bg: '#8A4FA8', icon: 'grow' }, club: { bg: '#2E6FD8', icon: 'happy' }, love: { bg: '#F3A3C0', icon: 'date' },
  parttime: { bg: '#2F8F5B', icon: 'money' }, exam: { bg: '#C9553B', icon: 'risk' }, party: { bg: '#E8742C', icon: 'happy' }, scholar: { bg: '#E2B85C', icon: 'money' },
}

const STOP_LABEL: Record<string, string> = { club: '동아리', job: '직업', middleBranch: '새 가족', promotion: '승진 심사' }

function tileLook(t: Tile) {
  const base = TILE_STYLE[t.kind]
  if (t.uni) return { ...base, bg: UNI_LOOK[t.uni].bg, label: UNI_NAMES[t.uni] }
  if (t.kind === 'stop' && !t.stop) return { ...base, label: '갈림길' }
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

interface Props {
  s: GameState
  focus: Player
  showSteps: boolean
  posOf?: (p: Player) => number // 걷는 연출 중에는 실제 위치 대신 지금 보여줄 칸
  walkingId?: number | null // 지금 걷고 있는 사람 (통통 튀는 동작)
  canPan?: boolean // 끌어서 보기는 내 차례에만
  emotes?: Record<number, Expr> // 지금 머리 위에 띄울 표정 (플레이어 번호 → 표정)
  say?: { playerId: number; text: string } | null // AI 말 (그 캐릭터 머리 위에, 2026-10-21)
  hands?: Record<number, number | null> // 가위바위보 손 (null = 고르는 중)
}

export function Board({ s, focus, showSteps, posOf = (p) => p.pos, walkingId = null, canPan = false, emotes = {}, hands = {}, say = null }: Props) {
  const theme = s.settings.theme // 테마 맵: 규칙은 그대로, 판 겉모습만 (2026-10-29)
  const groundFile = artFile('ground', theme) // 땅 그림 파일 (반복 무늬)
  const st = s.stages[s.stageIdx]
  const focusPos = posOf(focus)
  const fd = st.tiles[focusPos].d
  // 끌어서 보기: pan.y > 0 이면 앞쪽(먼 칸), < 0 이면 뒤쪽
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  useEffect(() => { setPan({ x: 0, y: 0 }) }, [focus.id, focusPos, s.stageIdx])
  useEffect(() => { if (!canPan) { drag.current = null; setDragging(false); setPan({ x: 0, y: 0 }) } }, [canPan])
  const panD = pan.y / 150 // 끌어서 옮긴 깊이
  const zig = useMemo(() => zigOffsets(st), [st])
  const xAt = (t: Tile) => tileX(t, zig) // 좁은 옆길은 지그재그 (칸끼리 안 겹치게)
  const yAt = (t: Tile) => tileY(t) // 칸 위치는 고정. 카메라(.track)가 fd만큼 움직임
  const maxLane = useMemo(() => Math.max(1, ...st.tiles.map((x) => Math.abs(x.lane))), [st])
  const visible = (t: Tile) => t.d >= fd + panD - 2.5 && t.d <= fd + panD + 11
  const steps = showSteps ? distancesFrom(st, focusPos, 6) : new Map<number, number>()
  const items: ReactElement[] = []
  // 갈라진 길이 지나는 쪽에는 건물·나무를 더 바깥으로 밀어냄
  const sideBusy = (d: number, side: number) => st.tiles.some((x) => x.lane === side && Math.abs(x.d - d) < 2.5)
  const decorX = (t: Tile, side: number, near: number, far: number) => xAt(t) + side * (sideBusy(t.d, side) ? far : near) + (side < 0 ? -110 : 0)

  // 흙길: 칸과 다음 칸을 잇는 길 (칸 밑에 깔림) + 길가 꽃·풀·돌 (2026-10-21 사용자: 판 그림을 더 세세하게)
  const ground: ReactElement[] = []
  st.tiles.forEach((t, i) => {
    if (!visible(t)) return
    const ax = xAt(t) + 60, ay = yAt(t) + 60
    for (const n of t.next) {
      const b = st.tiles[n]
      const bx = xAt(b) + 60, by = yAt(b) + 60
      const len = Math.hypot(bx - ax, by - ay)
      const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
      ground.push(<div key={`road${i}-${n}`} className={`road-seg road-${b.road === 'main' ? 'main' : b.road === 'event' ? 'event' : 'side'}`} style={{ left: ax, top: ay - 38, width: len, transform: `rotate(${ang}deg)` }} />)
    }
    // 길에서 멀리 떨어진 양옆 잔디: 덤불·꽃밭·연못·울타리·바위·풀 (넓은 화면에서도 비어 보이지 않게, 2026-10-22)
    if (t.road === 'main') {
      for (const side of [-1, 1] as const) for (const band of [0, 1]) {
        const seed = (i * 31 + (side + 1) * 17 + band * 53) % 97
        const far = LANE * (maxLane + 1) + 320 + band * 520 + (seed % 4) * 90 // 건물·나무(길에서 ~650px)보다 바깥
        const kind = DECOR_KINDS[seed % DECOR_KINDS.length]
        const flat = kind === 'pond' || kind === 'flowers' // 연못·꽃밭은 땅에 눕고, 나머지는 서 있음
        if (band === 0 && seed % 3 === 0) ground.push(<div key={`fn${i}-${side}`} className="far-decor" style={{ left: xAt(t) + 60 + side * (520 + (seed % 4) * 40) - (side < 0 ? 200 : 0), top: yAt(t) + 30 }}><GroundDecor kind="flowers" theme={theme} /></div>) // 가까운 쪽 잔디에도 꽃밭·풀 (땅에 눕힘)
        items.push(<div key={`fd${i}-${side}-${band}`} className="far-decor" style={{ ...(flat ? {} : stand), left: xAt(t) + 60 + side * far - (side < 0 ? 260 : 0), top: yAt(t) - 60 + (seed % 3) * 40 }}><GroundDecor kind={kind} theme={theme} /></div>)
      }
    }
    if (t.road === 'main') {
      for (const [k, side] of [[0, -1], [1, 1]] as const) {
        const seed = (i * 7 + k * 13) % 5
        ground.push(<div key={`gb${i}-${k}`} className={`ground-bit gb-${seed}`} style={{ left: xAt(t) + 60 + side * (110 + ((i * 37 + k * 53) % 70)), top: yAt(t) + 20 + ((i * 23 + k * 31) % 80) }} />)
      }
    }
  })

  st.tiles.forEach((t, i) => {
    if (!visible(t)) return
    const look = tileLook(t)
    const step = steps.get(i)
    const small = look.label.length > 3
    items.push(
      <div key={`t${i}`} className={`tile${t.kind === 'mini' ? ' tile-mini' : ''}${t.kind === 'stop' ? ' tile-stop' : ''}`} style={{ left: xAt(t), top: yAt(t), background: look.bg, color: look.fg }}>
        <TileIcon kind={t.stop ? 'stop' : t.uni ? UNI_LOOK[t.uni].icon : t.kind === 'campus' ? 'grow' : t.kind} size={46} />
        {/* 멀리 있는 칸도 읽히게 글씨를 키움 (2026-10-22) */}
        <span className="tile-label" style={{ fontSize: look.label.length > 5 ? 16 : look.label.length > 4 ? 19 : small ? 22 : 27 }}>{look.label}</span>
        {step && <span className="tile-step">{step}</span>}
      </div>,
    )
    // 이벤트 길 입구 랜드마크 (표지판 반대쪽)
    for (const ev of t.fork?.options.filter((o) => o.road === 'event') ?? []) {
      items.push(
        <div key={`lm${i}-${ev.to}`} className="bld" style={{ ...stand, left: xAt(t) + (st.tiles[ev.to].lane >= 0 ? LANE + 150 : -LANE - 430), top: yAt(t) - 250, width: 280, height: 290 }}>
          <Landmark name={ev.label} />
        </div>,
      )
    }
    // 갈림길 표지판: 가리키는 쪽으로 뾰족한 나무판 (이벤트 길은 색깔)
    if (t.fork) {
      items.push(
        <div key={`f${i}`} className="sign-post" style={{ ...stand, left: xAt(t) - 350, top: yAt(t) - 110 }}>
          <div className="sign-boards">
            {t.fork.options.map((o) => {
              const target = st.tiles[o.to]
              const dir = target.lane < t.lane ? 'l' : target.lane > t.lane ? 'r' : 'u'
              return <div key={o.to} className={`sign-arrow sa-${dir}${o.road === 'event' ? ' sa-event' : ''}`}>{dir === 'u' ? '▲ ' : ''}{o.label}</div>
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
        <div key={`p${i}`} className="bld" style={{ ...stand, left, top: yAt(t) - 260, width: 260, height: 320 }}>
          <Building name={shop ? '상점' : '결혼식장'} theme={theme} />
        </div>,
      )
    } else if (t.road === 'main' && !t.fork && t.d % 4 === 2) {
      const name = DECOR[st.id][Math.floor(t.d / 4) % 4]
      const left = decorX(t, (t.d / 4) % 2 ? 1 : -1, 190, 430)
      items.push(
        <div key={`d${i}`} className="bld" style={{ ...stand, left, top: yAt(t) - 200, width: 220, height: 270 }}>
          <Building name={name} color={ROOFS[i % ROOFS.length]} theme={theme} />
        </div>,
      )
    } else if (t.road === 'main' && Math.round(t.d) % 2 === 1) {
      const left = decorX(t, Math.round(t.d) % 3 ? -1 : 1, 120, 400)
      items.push(
        <div key={`r${i}`} className="tree" style={{ ...stand, left, top: yAt(t) - 60 }}>
          <Tree variant={i} theme={theme} />
        </div>,
      )
    }
    if (t.kind === 'campus') {
      items.push(
        <div key={`u${i}`} className="bld" style={{ ...stand, left: xAt(t) - 300, top: yAt(t) - 220, width: 240, height: 290 }}>
          <Building name="학교" color="#8A4FA8" theme={theme} />
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
  for (const p of s.players) {
    const pos = posOf(p)
    if (visible(st.tiles[pos])) byTile.set(pos, [...(byTile.get(pos) ?? []), p])
  }
  for (const [i, ps] of byTile) {
    const t = st.tiles[i]
    ps.forEach((p, k) => {
      const dx = (k - (ps.length - 1) / 2) * 60
      const me = p.id === focus.id
      const age = ageOf(s, p)
      const drop = Math.round((1 - heightOf(age) * (age <= 2 ? 0.78 : 1)) * 150) // 키가 작으면 이름표·말풍선도 내려옴 (아기는 납작하게 그림)
      const row = -(k % 2) * 34 + drop
      // 이름표: 같은 칸이면 두 줄로 번갈아 (옆 사람과 안 겹치고 몸 가까이, 2026-10-23: 4명이면 계단처럼 높이 떠 있었음)
      items.push(
        <div key={`s${p.id}`} className="shadow" style={{ left: xAt(t) + 20 + dx, top: yAt(t) + 70 }} />,
        <div key={`c${p.id}`} data-focus={me || undefined} className={`char${p.id === walkingId ? ' walking' : ''}${ageOf(s, p) <= 2 ? ' baby' : ''}`} style={{ ...stand, left: xAt(t) + 20 + dx, top: yAt(t) - 90 }}>
          <div style={{ opacity: me ? 1 : 0.5 }}>
            <Character outfit={p.outfit} view={p.id === walkingId ? 'back' : 'front'} size={80} age={ageOf(s, p)} /> {/* 걸을 때만 뒷모습 */}
            <div className="name-tag" style={{ background: me ? p.color : 'rgba(42,33,24,0.6)', top: -40 + row, ...(p.team !== undefined && s.settings.teams ? { boxShadow: `0 0 0 4px ${TEAM_COLORS[p.team]}` } : {}) }}>{p.name}</div>{/* 팀전: 이름표 둘레 팀 색 */}
          </div>
          {p.id in hands
            ? <div className="emote-on-board" style={{ top: -130 + row }}><RpsBubble value={hands[p.id]} /></div>
            : emotes[p.id] ? <div className="emote-on-board" style={{ top: -130 + row }}><EmoteBubble key={emotes[p.id]} outfit={p.outfit} age={ageOf(s, p)} expr={emotes[p.id]} /></div>
            : say?.playerId === p.id && <div className="say-on-board" style={{ top: -100 + row, borderColor: p.color }} key={say.text}>{say.text}</div>}
        </div>,
      )
    })
  }

  const maxD = Math.max(...st.tiles.map((t) => t.d))
  // 누른 채로 다른 화면 위를 지나가도 놓을 때까지 계속 따라오게 (포인터 붙잡기)
  const onDown = (e: ReactPointerEvent) => {
    if (!canPan) return
    e.preventDefault() // 그림·글자 끌기로 착각하지 않게
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    setDragging(true)
  }
  const onUp = () => { drag.current = null; setDragging(false) }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const y = Math.max((-fd - 1) * 150, Math.min((maxD - fd) * 150, d.py + (e.clientY - d.y) * 2.5))
    const x = Math.max(-500, Math.min(500, d.px + (e.clientX - d.x) * 1.5))
    setPan({ x, y })
  }
  const panned = Math.abs(pan.x) > 20 || Math.abs(pan.y) > 40
  return (
    <div className={`world stage-${st.id}${theme ? ` theme-${theme}` : ''}${groundFile ? ' has-ground' : ''}${canPan ? ' can-pan' : ''}`} style={groundFile ? ({ '--ground-img': `url(${groundFile})` } as CSSProperties) : undefined} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onDragStart={(e) => e.preventDefault()}>
      <div className="sky-deco">
        <SkyScenery theme={theme} />
        <div className="ground" />
      </div>
      <div className="camera">
        <div className="plane" style={{ transform: `rotateX(${TILT}deg)` }}>
          <div key={s.stageIdx} className={`track${dragging ? ' dragging' : ''}`} style={{ transform: `translate(${-st.tiles[focusPos].lane * LANE + pan.x}px, ${fd * 150 + pan.y}px)` }}>{ground}{items}</div>
        </div>
      </div>
      {theme && theme !== 'summer' && <Weather kind={theme === 'winter' ? 'snow' : theme === 'spring' ? 'petals' : 'leaves'} />}
      {panned && <button className="pan-home" onClick={(e) => { e.stopPropagation(); setPan({ x: 0, y: 0 }) }} onPointerDown={(e) => e.stopPropagation()}>내 위치로</button>}
    </div>
  )
}

// 전체 지도 (2026-10-22 다시: 길이 이어진 진짜 지도 + 내 위치·다른 사람 위치·내 앞 칸 이동 숫자)
// 판과 같은 자리 계산(갈래·지그재그)을 줄여서 그림. 아래에서 위로 걸어감
const MAP_ROW = 80 // 깊이 1당 세로 px
export function FullMap({ s, meId, onClose }: { s: GameState; meId: number; onClose: () => void }) {
  const st = s.stages[s.stageIdx]
  const zig = useMemo(() => zigOffsets(st), [st])
  const me = s.players[meId]
  const steps = useMemo(() => distancesFrom(st, me.pos, 999), [st, me.pos]) // 끝까지 몇 칸인지 (2026-10-22 사용자)
  const maxD = Math.max(...st.tiles.map((t) => t.d))
  const height = maxD * MAP_ROW + 110
  // 가로: 판의 칸 자리(px)를 지도 폭(%)으로 줄임
  const xs = st.tiles.map((t) => tileX(t, zig) + 60)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const xOf = (i: number) => 9 + ((xs[i] - minX) / Math.max(1, maxX - minX)) * 82 // %
  const yOf = (i: number) => (maxD - st.tiles[i].d) * MAP_ROW + 60 // px
  const meRef = useRef<HTMLDivElement>(null)
  useEffect(() => { meRef.current?.scrollIntoView({ block: 'center' }) }, [])
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet map-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="jua">{st.name}의 길 · 지도</h2>
          <button className="x" onClick={onClose}>닫기</button>
        </div>
        <div className="map-legend">
          <span><i className="lg-me" />나</span>
          <span><i className="lg-other" />다른 사람</span>
          <span><b className="map-step">3</b>내 앞 칸 수 (점선: 주사위 한 번에 닿는 칸)</span>
          <span className="muted">아래에서 위로 가요</span>
        </div>
        <div className="map-scroll">
        <div className="map-board" style={{ height }}>
          <svg className="map-roads" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {st.tiles.flatMap((t, i) => t.next.map((n) => (
              <line key={`${i}-${n}`} x1={xOf(i)} y1={yOf(i)} x2={xOf(n)} y2={yOf(n)} className={`map-road${st.tiles[n].road === 'main' ? '' : ' side'}`} vectorEffect="non-scaling-stroke" />
            )))}
          </svg>
          {st.tiles.map((t, i) => {
            const look = tileLook(t)
            const here = s.players.filter((p) => p.pos === i)
            const mine = i === me.pos
            const n = steps.get(i)
            return (
              <div key={i} ref={mine ? meRef : undefined} className={`map-node${mine ? ' me' : ''}${n && n <= 6 ? ' reach' : ''}`} style={{ left: `${xOf(i)}%`, top: yOf(i), background: look.bg, color: look.fg }} title={look.label}>
                <TileIcon kind={t.stop ? 'stop' : t.uni ? UNI_LOOK[t.uni].icon : t.kind === 'campus' ? 'grow' : t.kind} size={28} />
                <span className="map-label">{look.label}</span>
                {n && <b className="map-step">{n}</b>}
                {t.point && <em className="map-point">{t.point === 'shop' ? '상점' : '결혼식장'}</em>}
                {here.length > 0 && (
                  <span className="map-people">
                    {here.map((p) => (
                      <span key={p.id} className={`map-face${p.id === meId ? ' me' : ''}`} style={{ borderColor: p.color }} title={p.name}>
                        <Character outfit={p.outfit} size={20} age={ageOf(s, p)} crop="head" />
                      </span>
                    ))}
                  </span>
                )}
                {mine && <span className="map-me-tag jua">나</span>}
              </div>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}
