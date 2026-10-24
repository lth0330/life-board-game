// 온라인 화면: 온라인 메뉴(방 만들기·코드로 들어가기·꾸미기) → 대기실. 로그인은 처음 화면에서 (account/)
// 게임: 방장 기기가 엔진을 돌리고 바뀔 때마다 방에 올림, 손님 기기는 받은 상태를 보여 주고 누른 것만 방장에게 보냄
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createGame } from '../engine/game'
import { applyOp, opActor, type Op } from '../engine/ops'
import type { GameState } from '../engine/types'
import { Frame } from '../ui/Screens'
import { EMOTES } from '../ui/emoteData'
import type { Expr } from '../art/Character'
import type { OnlinePlay } from '../App'
import { Character } from '../art/Character'
import { cleanOutfit, type Outfit } from '../engine/outfit'
import { Dresser } from '../ui/Dresser'
import { rememberWhere } from '../storage'
import {
  client, createRoom, isRoomOwner, openRooms, parse, saveRoom, sendAction,
  type ActionPayload, type LobbyState, type Me, type Room, type Seat,
} from './client'

export const CHAT_MAX = 60
export interface ChatMsg { id: string; name: string; text: string; player: number | null; mine: boolean }

// 게임 화면(Play)은 App에서 그려서 넘겨받음 (서로 불러오는 고리를 피하려고)
export interface PlayProps {
  game: GameState; setGame: (g: GameState) => void; onQuit: () => void
  online: OnlinePlay
}
type RenderPlay = (p: PlayProps) => ReactNode

export function Online({ me, outfit, onOutfit, onBack, renderPlay, initialRoom = null }: {
  me: Me; outfit: Outfit; onOutfit: (o: Outfit) => void; onBack: () => void; renderPlay: RenderPlay; initialRoom?: string | null
}) {
  const [roomId, setRoomId] = useState<string | null>(initialRoom)
  // 새로고침해도 이 방으로 돌아오게
  useEffect(() => { rememberWhere(roomId ? { screen: 'online', roomId } : null) }, [roomId])
  if (roomId) return <Lobby me={me} outfit={outfit} roomId={roomId} renderPlay={renderPlay} onLeave={() => setRoomId(null)} />
  return <OnlineHome me={me} outfit={outfit} onOutfit={onOutfit} onRoom={setRoomId} onBack={onBack} />
}

// ───────── 온라인 메뉴 ─────────
function OnlineHome({ me, outfit, onOutfit, onRoom, onBack }: { me: Me; outfit: Outfit; onOutfit: (o: Outfit) => void; onRoom: (id: string) => void; onBack: () => void }) {
  const [dress, setDress] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const make = async () => {
    setBusy(true); setErr('')
    const r = await createRoom(me, outfit)
    setBusy(false)
    if (typeof r === 'string') setErr(r)
    else onRoom(r.id)
  }
  const enter = async () => {
    if (code.length !== 4) { setErr('방 코드 4자리를 적어 주세요'); return }
    setBusy(true); setErr('')
    const rooms = await openRooms(code)
    setBusy(false)
    const room = rooms[0]
    if (!room) { setErr('그런 방이 없어요'); return }
    const owners = parse<LobbyState>(room.state, { settings: { startAdult: false, difficulty: 'normal' } }).owners ?? []
    if (room.status === 'playing') {
      if (owners.includes(me.userId) || isRoomOwner(room.owner, me)) { onRoom(room.id); return } // 내가 하던 게임: 이어 하기
      setErr('이미 시작한 방이에요'); return
    }
    const seats = parse<Seat[]>(room.seats, [])
    if (!seats.some((s) => s.userId === me.userId) && !seats.some((s) => s.kind === 'open')) { setErr('자리가 꽉 찼어요'); return }
    onRoom(room.id)
  }
  return (
    <Frame onBack={onBack}>
      <div className="menu-hello">
        <Character outfit={outfit} size={44} />
        <b className="jua">{me.nick}님, 어서 오세요</b>
      </div>
      <button className="wide big" disabled={busy} onClick={() => void make()}>방 만들기</button>
      <div className="row">
        <input className="grow code-input" value={code} placeholder="방 코드" maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} aria-label="방 코드 4자리" />
        <button className="grow" disabled={busy} onClick={() => void enter()}>들어가기</button>
      </div>
      {err && <p className="bad">{err}</p>}
      <button className="wide secondary" onClick={() => setDress(true)}>캐릭터 꾸미기</button>
      <button className="wide ghost" onClick={onBack}>처음 메뉴로</button>
      {dress && <Dresser value={outfit} onChange={onOutfit} onDone={() => setDress(false)} />}
    </Frame>
  )
}

// ───────── 대기실 ─────────
const DIFF: [LobbyState['settings']['difficulty'], string][] = [['normal', '보통'], ['hard', '어려움']]

function Lobby({ me, outfit, roomId, onLeave, renderPlay }: { me: Me; outfit: Outfit; roomId: string; onLeave: () => void; renderPlay: RenderPlay }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [closed, setClosed] = useState(false)
  const [missing, setMissing] = useState(false) // 방이 지워짐 (새로고침으로 돌아왔는데 오래된 방)
  const [netErr, setNetErr] = useState(false) // 방을 못 불러옴 (인터넷)
  const [tryNo, setTryNo] = useState(0) // 다시 시도
  const roomRef = useRef<Room | null>(null)
  const apply = useCallback((r: Room | null) => {
    if (!r) return
    if (roomRef.current && (r.version ?? 0) < (roomRef.current.version ?? 0)) return // 늦게 온 옛 상태는 버림
    roomRef.current = r
    setRoom(r)
    // 끝남: 게임이 있으면 결과 화면을 그대로 보여 주고, 시작 전에 닫힌 방만 '방장이 방을 닫았어요'
    if (r.status === 'ended' && !parse<LobbyState>(r.state, { settings: { startAdult: false, difficulty: 'normal' } }).game) setClosed(true)
  }, [])
  const isHost = isRoomOwner(room?.owner, me)

  // 방 불러오기 + 바뀔 때마다 받기
  useEffect(() => {
    setNetErr(false)
    void client.models.Room.get({ id: roomId }).then((r) => {
      if (r.data) apply(r.data)
      else if (r.errors?.length) setNetErr(true) // 서버에 못 닿음: 방이 없는 것과 구별
      else setMissing(true)
    }).catch(() => setNetErr(true))
    const sub = client.models.Room.onUpdate({ filter: { id: { eq: roomId } } }).subscribe({ next: apply })
    return () => sub.unsubscribe()
  }, [roomId, apply, tryNo])

  // 손님: 들어가겠다고 알림
  const joined = useRef(false)
  useEffect(() => {
    if (!room || isHost || joined.current || room.status !== 'waiting') return
    joined.current = true
    void sendAction(roomId, me, 'join', { outfit })
  }, [room, isHost, roomId, me, outfit])

  // 방장: 들어오기·나가기 행동을 받아 자리를 고침
  useEffect(() => {
    if (!isHost) return
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: roomId } } }).subscribe({
      next: (a) => {
        const r = roomRef.current
        if (!r || r.status !== 'waiting') return
        const p = parse<ActionPayload & { outfit?: unknown } | null>(a.payload, null)
        if (!p) return
        const seats = parse<Seat[]>(r.seats, [])
        if (a.kind === 'join' && !seats.some((s) => s.userId === p.userId)) {
          const i = seats.findIndex((s) => s.kind === 'open')
          if (i < 0) return
          seats[i] = { kind: 'human', userId: p.userId, name: a.name ?? '친구', outfit: cleanOutfit(p.outfit) }
        } else if (a.kind === 'leave') {
          const i = seats.findIndex((s) => s.userId === p.userId)
          if (i < 0) return
          seats[i] = { kind: 'open' }
        } else return
        void saveRoom(r, { seats }).then(apply)
      },
    })
    return () => sub.unsubscribe()
  }, [isHost, roomId, apply])

  const leave = async () => {
    const r = roomRef.current
    if (r && isHost) await saveRoom(r, { status: 'ended' })
    else if (r) await sendAction(roomId, me, 'leave')
    onLeave()
  }

  if ((closed && !isHost) || missing) {
    return (
      <Frame onBack={onLeave}>
        <p className="center">{missing ? '방이 없어졌어요' : '방장이 방을 닫았어요'}</p>
        <button className="wide big" onClick={onLeave}>돌아가기</button>
      </Frame>
    )
  }
  if (netErr && !room) {
    return (
      <Frame onBack={onLeave}>
        <p className="center">방을 불러오지 못했어요. 인터넷 연결을 확인해 주세요</p>
        <button className="wide big" onClick={() => setTryNo((n) => n + 1)}>다시 시도</button>
        <button className="wide ghost" onClick={onLeave}>돌아가기</button>
      </Frame>
    )
  }
  if (!room) return <Frame><p className="center muted">방에 들어가는 중…</p></Frame>
  const finished = room.status === 'ended' && !!parse<LobbyState>(room.state, { settings: { startAdult: false, difficulty: 'normal' } }).game
  if (room.status === 'playing' || finished) return <OnlineGame me={me} room={room} isHost={isHost} renderPlay={renderPlay} onLeave={onLeave} />

  const seats = parse<Seat[]>(room.seats, [])
  const lobby = parse<LobbyState>(room.state, { settings: { startAdult: false, difficulty: 'normal' } })
  const inSeat = seats.some((s) => s.userId === me.userId)
  const humans = seats.filter((s) => s.kind === 'human').length
  const players = seats.filter((s) => s.kind !== 'open').length
  // 팀전 (2026-10-21): 4자리가 다 차면 켤 수 있음. 자리마다 팀 (처음엔 번갈아)
  const seatTeam = (i: number) => seats[i].team ?? ((i % 2) as 0 | 1)
  const teamOk = players === 4 && [0, 1, 2, 3].filter((i) => seatTeam(i) === 0).length === 2
  const flipTeam = (i: number) => {
    if (!isHost) return
    void saveRoom(room, { seats: seats.map((x, k) => (k === i ? { ...x, team: (seatTeam(i) ? 0 : 1) as 0 | 1 } : x)) }).then(apply)
  }
  const toggleSeat = (i: number) => {
    if (!isHost || seats[i].kind === 'human') return
    const next = seats.map((s, k) => (k === i ? { kind: s.kind === 'ai' ? 'open' : 'ai' } as Seat : s))
    void saveRoom(room, { seats: next }).then(apply)
  }
  // 시작: 사람 자리 순서대로 플레이어 0, 1, …  그다음 AI
  const start = async () => {
    const people = seats.filter((s) => s.kind === 'human')
    const ai = seats.filter((s) => s.kind === 'ai').length
    // 팀: 플레이어 순서(사람 자리 다음 AI 자리)에 맞춰
    const order = [...seats.map((x, i) => ({ x, i })).filter(({ x }) => x.kind === 'human'), ...seats.map((x, i) => ({ x, i })).filter(({ x }) => x.kind === 'ai')]
    const teams = lobby.settings.teams && teamOk ? order.map(({ i }) => seatTeam(i)) : undefined
    const game = createGame({
      humanName: people[0]?.name ?? '방장', humanNames: people.slice(1).map((s) => s.name ?? '친구'), humans: people.length, aiCount: ai,
      outfits: people.map((s) => (s.outfit ? cleanOutfit(s.outfit) : undefined)),
      teams,
      settings: { startAdult: false, difficulty: lobby.settings.difficulty, online: true },
    })
    const owners = [...people.map((s) => s.userId ?? null), ...Array<null>(ai).fill(null)]
    const r = await saveRoom(room, { status: 'playing', state: { ...lobby, owners, game } })
    apply(r)
  }
  const setSettings = (patch: Partial<LobbyState['settings']>) => {
    if (!isHost) return
    void saveRoom(room, { state: { ...lobby, settings: { ...lobby.settings, ...patch } } }).then(apply)
  }

  return (
    <Frame onBack={() => void leave()}>
      <p className="muted center">방 코드 · 친구에게 알려 주세요</p>
      <div className="room-code jua">{room.code}</div>
      <div className="seats">
        {seats.map((s, i) => (
          <button key={i} className={`seat seat-${s.kind}`} disabled={!isHost || s.kind === 'human'} onClick={() => toggleSeat(i)}>
            <b>{i + 1}</b>
            {s.kind === 'human' && s.outfit && <Character outfit={cleanOutfit(s.outfit)} size={30} crop="head" />}
            <span>{s.kind === 'human' ? `${s.name}${i === 0 ? ' (방장)' : ''}${s.userId === me.userId ? ' · 나' : ''}` : s.kind === 'ai' ? '🤖 AI' : '빈자리'}</span>
            {isHost && s.kind !== 'human' && <em>{s.kind === 'ai' ? '눌러서 비우기' : '눌러서 AI 넣기'}</em>}
          </button>
        ))}
      </div>
      {!isHost && !inSeat && <p className="muted center">자리에 앉는 중…</p>}
      <div className="lobby-settings">
        {players === 4 && (
          <div className="seg">
            {([[false, '각자'], [true, '팀전 (2 대 2)']] as const).map(([v, l]) => (
              <button key={l} className={!!lobby.settings.teams === v ? 'on' : ''} disabled={!isHost} onClick={() => setSettings({ teams: v })}>{l}</button>
            ))}
          </div>
        )}
        {players === 4 && lobby.settings.teams && (
          <div className="team-pick">
            {seats.map((x, i) => (
              <button key={i} className={`team-seat t${seatTeam(i)}`} disabled={!isHost} onClick={() => flipTeam(i)}>
                <b>{x.kind === 'human' ? x.name : '🤖 AI'}</b><span>{seatTeam(i) ? 'B팀' : 'A팀'}</span>
              </button>
            ))}
            {!teamOk && <p className="bad">두 명씩 나눠 주세요 (방장이 눌러서 바꿔요)</p>}
          </div>
        )}
        <div className="seg">
          {DIFF.map(([v, l]) => <button key={v} className={lobby.settings.difficulty === v ? 'on' : ''} disabled={!isHost} onClick={() => setSettings({ difficulty: v })}>AI {l}</button>)}
        </div>
      </div>
      {isHost ? (
        <button className="wide big" disabled={players < 2 || (players === 4 && !!lobby.settings.teams && !teamOk)} onClick={() => void start()}>시작 ({humans}명 + AI {players - humans})</button>
      ) : (
        <p className="center">방장이 시작하기를 기다리는 중…</p>
      )}
      <button className="wide ghost" onClick={() => void leave()}>{isHost ? '방 닫고 나가기' : '나가기'}</button>
    </Frame>
  )
}

// ───────── 게임 ─────────
function OnlineGame({ me, room, isHost, renderPlay, onLeave }: { me: Me; room: Room; isHost: boolean; renderPlay: RenderPlay; onLeave: () => void }) {
  // 방 상태는 바뀔 때만 다시 읽음 (게임 상태가 커서 화면을 그릴 때마다 읽지 않게)
  const lobby = useMemo(() => parse<LobbyState>(room.state, { settings: { startAdult: false, difficulty: 'normal' } }), [room.state])
  const owners = lobby.owners ?? []
  const mine = owners.map((u, i) => (u === me.userId ? i : -1)).filter((i) => i >= 0)

  // 방장: 내 기기의 게임이 진짜. 바뀔 때마다 순서대로 올림 (올리는 중이면 끝난 뒤 가장 새 것만)
  const [hostGame, setHostGame] = useState<GameState | null>(() => (isHost ? lobby.game ?? null : null))
  const gameRef = useRef(hostGame)
  const ownersRef = useRef(owners)
  const version = useRef(room.version ?? 0)
  const uploading = useRef(false)
  const dirty = useRef(false)
  const roomRef = useRef(room)
  roomRef.current = room
  const settingsRef = useRef(lobby.settings)
  const upload = useCallback(async () => {
    if (uploading.current) { dirty.current = true; return }
    uploading.current = true
    do {
      dirty.current = false
      const g = gameRef.current
      if (!g) break
      version.current += 1
      await saveRoom(roomRef.current, {
        state: { settings: settingsRef.current, owners: ownersRef.current, game: g }, version: version.current,
        ...(g.phase === 'gameover' ? { status: 'ended' as const } : {}),
      }).catch(() => { dirty.current = true })
    } while (dirty.current)
    uploading.current = false
  }, [])
  const setGame = useCallback((g: GameState) => {
    gameRef.current = g
    setHostGame(g)
    void upload()
  }, [upload])

  // 방장: 손님이 보낸 행동을 받아서 적용 (그 차례·선택 창 주인이 보낸 것만)
  useEffect(() => {
    if (!isHost) return
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: room.id } } }).subscribe({
      next: (a) => {
        const g = gameRef.current
        const p = parse<ActionPayload & { op?: Op } | null>(a.payload, null)
        if (!g || !p) return
        if (a.kind === 'leave') { // 게임 중에 나가면 AI가 대신
          const i = ownersRef.current.indexOf(p.userId)
          if (i < 0) return
          ownersRef.current = ownersRef.current.map((u, k) => (k === i ? null : u))
          const next = structuredClone(g)
          next.players[i].human = false
          setGame(next)
          return
        }
        if (a.kind !== 'op' || !p.op) return
        const actor = opActor(g, p.op)
        if (actor === null || ownersRef.current[actor] !== p.userId) return
        const next = structuredClone(g)
        next.banner = null
        next.speech = null
        applyOp(next, p.op)
        setGame(next)
      },
    })
    return () => sub.unsubscribe()
  }, [isHost, room.id, setGame])

  // 표정: 모든 기기가 표정 행동을 직접 받아서 띄움 (게임 상태는 다시 올리지 않음)
  const [incoming, setIncoming] = useState<{ player: number; expr: Expr; id: string } | null>(null)
  const [incomingSpin, setIncomingSpin] = useState<{ player: number; id: string } | null>(null) // 다른 기기에서 주사위를 굴리기 시작함
  const ownersNow = useRef(owners)
  ownersNow.current = isHost ? ownersRef.current : owners
  // 채팅 (2026-10-21): 행동 기록으로 주고받음. 새로고침하면 지난 채팅은 사라짐 (하루 뒤 서버에서도 지워짐)
  const [chat, setChat] = useState<ChatMsg[]>([])
  // 새로고침·다시 들어오기: 서버에 남은 이 방 채팅(하루 동안)을 최근 20개까지 다시 불러옴
  useEffect(() => {
    let alive = true
    void (async () => {
      const found: { id: string; name: string; text: string; userId: string; at: string }[] = []
      let token: string | null | undefined
      for (let page = 0; page < 10; page++) {
        const r = await client.models.Action.listActionByRoomId({ roomId: room.id }, { filter: { kind: { eq: 'chat' } }, nextToken: token, limit: 500 }).catch(() => null)
        if (!r) break
        for (const a of r.data) {
          const p = parse<ActionPayload & { text?: string } | null>(a.payload, null)
          const text = typeof p?.text === 'string' ? p.text.trim().slice(0, CHAT_MAX) : ''
          if (p && text) found.push({ id: a.id, name: a.name ?? '?', text, userId: p.userId, at: a.createdAt })
        }
        token = r.nextToken
        if (!token) break
      }
      if (!alive || !found.length) return
      const old = found.sort((x, y) => x.at.localeCompare(y.at)).slice(-20).map((x) => {
        const player = ownersNow.current.indexOf(x.userId)
        return { id: x.id, name: x.name, text: x.text, player: player >= 0 ? player : null, mine: x.userId === me.userId }
      })
      setChat((c) => [...old.filter((o) => !c.some((x) => x.id === o.id)), ...c].slice(-50))
    })()
    return () => { alive = false }
  }, [room.id, me.userId])
  useEffect(() => {
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: room.id } } }).subscribe({
      next: (a) => {
        if (a.kind !== 'chat') return
        const p = parse<ActionPayload & { text?: string } | null>(a.payload, null)
        const text = typeof p?.text === 'string' ? p.text.trim().slice(0, CHAT_MAX) : ''
        if (!p || !text) return
        const player = ownersNow.current.indexOf(p.userId)
        setChat((c) => [...c, { id: a.id, name: a.name ?? '?', text, player: player >= 0 ? player : null, mine: p.userId === me.userId }].slice(-50))
      },
    })
    return () => sub.unsubscribe()
  }, [room.id, me.userId])
  const lastChat = useRef(0)
  const sendChat = (text: string) => {
    const t = text.trim().slice(0, CHAT_MAX)
    if (!t || Date.now() - lastChat.current < 1000) return false // 도배 막기: 1초에 한 번
    lastChat.current = Date.now()
    void sendAction(room.id, me, 'chat', { text: t })
    return true
  }

  useEffect(() => {
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: room.id } } }).subscribe({
      next: (a) => {
        if (a.kind === 'beat') { lastBeat.current = Date.now(); setHostLost(false); return }
        // 주사위 굴리기 시작 신호: 다른 기기에서도 굴러가는 주사위를 보여 줌 (2026-10-22)
        if (a.kind === 'spin') {
          const q = parse<ActionPayload & { player?: number } | null>(a.payload, null)
          if (q && q.userId !== me.userId && typeof q.player === 'number') setIncomingSpin({ player: q.player, id: a.id })
          return
        }
        if (a.kind !== 'emote') return
        const p = parse<ActionPayload & { player?: number; expr?: Expr } | null>(a.payload, null)
        if (!p || p.userId === me.userId || typeof p.player !== 'number' || !p.expr || !EMOTES.includes(p.expr)) return
        if (ownersNow.current[p.player] !== p.userId) return // 자기 플레이어 표정만
        setIncoming({ player: p.player, expr: p.expr, id: a.id })
      },
    })
    return () => sub.unsubscribe()
  }, [room.id, me.userId])

  // 방장 연결 끊김 알아채기 (2026-10-24, 13-review의 A): 방장 기기가 15초마다 신호,
  // 손님은 45초 동안 신호도 상태 변화도 없으면 안내. 창 닫기·인터넷 끊김·폰 화면 끄기도 잡음
  const lastBeat = useRef(Date.now())
  const [hostLost, setHostLost] = useState(false)
  const over = lobby.game?.phase === 'gameover' || hostGame?.phase === 'gameover'
  const meRef = useRef(me)
  meRef.current = me
  useEffect(() => {
    if (!isHost || over) return
    const beat = () => void sendAction(room.id, meRef.current, 'beat').catch(() => {})
    beat()
    const t = setInterval(beat, 15000)
    return () => clearInterval(t)
  }, [isHost, over, room.id])
  useEffect(() => { lastBeat.current = Date.now(); setHostLost(false) }, [room.version]) // 상태가 올라와도 살아 있는 것
  useEffect(() => {
    if (isHost || over) return
    const t = setInterval(() => { if (Date.now() - lastBeat.current > 45000) setHostLost(true) }, 3000)
    // 내 화면이 꺼졌다 켜지면 그동안 못 받은 신호가 있을 수 있어 다시 기다림
    const back = () => { if (document.visibilityState === 'visible') lastBeat.current = Date.now() }
    document.addEventListener('visibilitychange', back)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', back) }
  }, [isHost, over])

  // 방장이 돌아옴: 상태를 다시 올려서 '방장이 나갔어요'를 지움
  const awayAtStart = useRef(lobby.hostAway)
  useEffect(() => {
    if (isHost && awayAtStart.current) void upload()
  }, [isHost, upload])

  const game = isHost ? hostGame : lobby.game ?? null
  if (!game) return <Frame><p className="center muted">게임을 불러오는 중…</p></Frame>
  const quit = async () => {
    if (game.phase !== 'gameover') {
      if (isHost) { // 방장이 나가면 손님 화면에 알림
        version.current += 1
        await saveRoom(roomRef.current, { state: { settings: settingsRef.current, owners: ownersRef.current, game, hostAway: true }, version: version.current }).catch(() => {})
      } else void sendAction(room.id, me, 'leave') // 손님이 나가면 AI가 대신
    }
    onLeave()
  }
  const hostAway = !isHost && lobby.hostAway && game.phase !== 'gameover'
  return (
    <>
      {renderPlay({
        game,
        setGame: isHost ? setGame : () => {},
        onQuit: () => void quit(),
        online: {
          mine, host: isHost, send: (op) => void sendAction(room.id, me, 'op', { op }),
          emote: (player, expr) => { if (mine.includes(player)) void sendAction(room.id, me, 'emote', { player, expr }) },
          incoming, chat, sendChat, incomingSpin,
          // 내 사람이나(방장이면 AI도) 굴리기 시작할 때 다른 기기에 알림
          spin: (player) => { if (mine.includes(player) || (isHost && ownersRef.current[player] == null)) void sendAction(room.id, me, 'spin', { player }) },
        },
      })}
      {!hostAway && hostLost && !isHost && game.phase !== 'gameover' && (
        <div className="sheet-backdrop mini-backdrop host-away">
          <div className="sheet mini center">
            <h2 className="jua">방장과 연결이 끊겼어요</h2>
            <p>방장의 인터넷이 끊겼거나 앱을 닫은 것 같아요. 방장이 돌아오면 저절로 이어져요</p>
            <p className="muted">기다리는 중…</p>
            <button className="wide" onClick={() => void quit()}>나가기</button>
          </div>
        </div>
      )}
      {hostAway && (
        <div className="sheet-backdrop mini-backdrop host-away">
          <div className="sheet mini center">
            <h2 className="jua">방장이 나갔어요</h2>
            <p>방장이 같은 코드({room.code})로 다시 들어오면 이어서 해요</p>
            <p className="muted">기다리는 중…</p>
            <button className="wide" onClick={() => void quit()}>나가기</button>
          </div>
        </div>
      )}
    </>
  )
}
