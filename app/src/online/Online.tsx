// 온라인 화면: 로그인·가입 → 온라인 메뉴(방 만들기·코드로 들어가기) → 대기실
// 게임: 방장 기기가 엔진을 돌리고 바뀔 때마다 방에 올림, 손님 기기는 받은 상태를 보여 주고 누른 것만 방장에게 보냄
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createGame } from '../engine/game'
import { applyOp, opActor, type Op } from '../engine/ops'
import type { GameState } from '../engine/types'
import { Frame } from '../ui/Screens'
import { EMOTES } from '../ui/Emotes'
import type { Expr } from '../art/Character'
import type { OnlinePlay } from '../App'
import {
  cleanId, cleanPw, client, createRoom, currentMe, ID_OK, isRoomOwner, join, login, logoutOnline, openRooms, parse, PW_OK, saveRoom, sendAction,
  type ActionPayload, type LobbyState, type Me, type Room, type Seat,
} from './client'

// 게임 화면(Play)은 App에서 그려서 넘겨받음 (서로 불러오는 고리를 피하려고)
export interface PlayProps {
  game: GameState; setGame: (g: GameState) => void; onQuit: () => void
  online: OnlinePlay
}
type RenderPlay = (p: PlayProps) => ReactNode

export function Online({ onBack, renderPlay }: { onBack: () => void; renderPlay: RenderPlay }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined) // undefined: 확인 중
  const [roomId, setRoomId] = useState<string | null>(null)
  useEffect(() => { void currentMe().then(setMe) }, [])

  if (me === undefined) return <Frame><p className="center muted">불러오는 중…</p></Frame>
  if (!me) return <AuthScreen onDone={setMe} onBack={onBack} />
  if (roomId) return <Lobby me={me} roomId={roomId} renderPlay={renderPlay} onLeave={() => setRoomId(null)} />
  return <OnlineHome me={me} onRoom={setRoomId} onBack={onBack} onLogout={() => { void logoutOnline().then(() => setMe(null)) }} />
}

// ───────── 로그인 · 가입 ─────────
function AuthScreen({ onDone, onBack }: { onDone: (me: Me) => void; onBack: () => void }) {
  const [mode, setMode] = useState<'login' | 'join'>('login')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [nick, setNick] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!ID_OK.test(id)) { setErr('아이디는 영어 소문자·숫자 4~16자예요'); return }
    if (!PW_OK.test(pw)) { setErr('비밀번호는 영어·숫자·특수기호 6자 이상이에요'); return }
    if (mode === 'join' && !nick.trim()) { setErr('닉네임을 적어 주세요'); return }
    setBusy(true)
    const e = mode === 'join' ? await join(id, pw, nick.trim()) : await login(id, pw)
    setBusy(false)
    if (e) { setErr(e); return }
    const m = await currentMe()
    if (m) onDone(m)
  }
  return (
    <Frame>
      <h2 className="jua center">온라인으로 하기</h2>
      <div className="seg">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr('') }}>로그인</button>
        <button className={mode === 'join' ? 'on' : ''} onClick={() => { setMode('join'); setErr('') }}>회원가입</button>
      </div>
      <form className="login-form" onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <label className="field"><span>아이디 (영어 소문자·숫자 4~16자)</span>
          <input value={id} onChange={(e) => setId(cleanId(e.target.value))} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </label>
        <label className="field"><span>비밀번호 (영어·숫자·특수기호 6자 이상)</span>
          <input value={pw} type="password" onChange={(e) => setPw(cleanPw(e.target.value))} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        {mode === 'join' && (
          <label className="field"><span>닉네임 (게임에서 보이는 이름)</span>
            <input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} />
          </label>
        )}
        {err && <p className="bad">{err}</p>}
        <button className="wide big" type="submit" disabled={busy}>{busy ? '잠시만요…' : mode === 'login' ? '로그인' : '가입하고 시작'}</button>
        {mode === 'join' && <p className="muted center">이메일을 받지 않아서 비밀번호를 잊으면 스스로 찾을 수 없어요</p>}
        <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
      </form>
    </Frame>
  )
}

// ───────── 온라인 메뉴 ─────────
function OnlineHome({ me, onRoom, onBack, onLogout }: { me: Me; onRoom: (id: string) => void; onBack: () => void; onLogout: () => void }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const make = async () => {
    setBusy(true); setErr('')
    const r = await createRoom(me)
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
    <Frame>
      <h2 className="jua center">{me.nick}님, 어서 오세요</h2>
      <button className="wide big" disabled={busy} onClick={() => void make()}>방 만들기</button>
      <div className="row">
        <input className="grow code-input" value={code} placeholder="방 코드" maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} aria-label="방 코드 4자리" />
        <button className="grow" disabled={busy} onClick={() => void enter()}>들어가기</button>
      </div>
      {err && <p className="bad">{err}</p>}
      <button className="wide ghost" onClick={onLogout}>로그아웃 ({me.loginId})</button>
      <button className="wide ghost" onClick={onBack}>처음 메뉴로</button>
    </Frame>
  )
}

// ───────── 대기실 ─────────
const DIFF: [LobbyState['settings']['difficulty'], string][] = [['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']]

function Lobby({ me, roomId, onLeave, renderPlay }: { me: Me; roomId: string; onLeave: () => void; renderPlay: RenderPlay }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [closed, setClosed] = useState(false)
  const roomRef = useRef<Room | null>(null)
  const apply = useCallback((r: Room | null) => {
    if (!r) return
    if (roomRef.current && (r.version ?? 0) < (roomRef.current.version ?? 0)) return // 늦게 온 옛 상태는 버림
    roomRef.current = r
    setRoom(r)
    if (r.status === 'ended') setClosed(true)
  }, [])
  const isHost = isRoomOwner(room?.owner, me)

  // 방 불러오기 + 바뀔 때마다 받기
  useEffect(() => {
    void client.models.Room.get({ id: roomId }).then((r) => apply(r.data))
    const sub = client.models.Room.onUpdate({ filter: { id: { eq: roomId } } }).subscribe({ next: apply })
    return () => sub.unsubscribe()
  }, [roomId, apply])

  // 손님: 들어가겠다고 알림
  const joined = useRef(false)
  useEffect(() => {
    if (!room || isHost || joined.current || room.status !== 'waiting') return
    joined.current = true
    void sendAction(roomId, me, 'join')
  }, [room, isHost, roomId, me])

  // 방장: 들어오기·나가기 행동을 받아 자리를 고침
  useEffect(() => {
    if (!isHost) return
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: roomId } } }).subscribe({
      next: (a) => {
        const r = roomRef.current
        if (!r || r.status !== 'waiting') return
        const p = parse<ActionPayload | null>(a.payload, null)
        if (!p) return
        const seats = parse<Seat[]>(r.seats, [])
        if (a.kind === 'join' && !seats.some((s) => s.userId === p.userId)) {
          const i = seats.findIndex((s) => s.kind === 'open')
          if (i < 0) return
          seats[i] = { kind: 'human', userId: p.userId, name: a.name ?? '친구' }
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

  if (closed && !isHost) {
    return (
      <Frame>
        <p className="center">방장이 방을 닫았어요</p>
        <button className="wide big" onClick={onLeave}>돌아가기</button>
      </Frame>
    )
  }
  if (!room) return <Frame><p className="center muted">방에 들어가는 중…</p></Frame>
  if (room.status === 'playing') return <OnlineGame me={me} room={room} isHost={isHost} renderPlay={renderPlay} onLeave={onLeave} />

  const seats = parse<Seat[]>(room.seats, [])
  const lobby = parse<LobbyState>(room.state, { settings: { startAdult: false, difficulty: 'normal' } })
  const inSeat = seats.some((s) => s.userId === me.userId)
  const humans = seats.filter((s) => s.kind === 'human').length
  const players = seats.filter((s) => s.kind !== 'open').length
  const toggleSeat = (i: number) => {
    if (!isHost || seats[i].kind === 'human') return
    const next = seats.map((s, k) => (k === i ? { kind: s.kind === 'ai' ? 'open' : 'ai' } as Seat : s))
    void saveRoom(room, { seats: next }).then(apply)
  }
  // 시작: 사람 자리 순서대로 플레이어 0, 1, …  그다음 AI
  const start = async () => {
    const people = seats.filter((s) => s.kind === 'human')
    const ai = seats.filter((s) => s.kind === 'ai').length
    const game = createGame({
      humanName: people[0]?.name ?? '방장', humanNames: people.slice(1).map((s) => s.name ?? '친구'), humans: people.length, aiCount: ai,
      settings: { startAdult: lobby.settings.startAdult, difficulty: lobby.settings.difficulty, online: true },
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
    <Frame>
      <p className="muted center">방 코드 · 친구에게 알려 주세요</p>
      <div className="room-code jua">{room.code}</div>
      <div className="seats">
        {seats.map((s, i) => (
          <button key={i} className={`seat seat-${s.kind}`} disabled={!isHost || s.kind === 'human'} onClick={() => toggleSeat(i)}>
            <b>{i + 1}</b>
            <span>{s.kind === 'human' ? `${s.name}${i === 0 ? ' (방장)' : ''}${s.userId === me.userId ? ' · 나' : ''}` : s.kind === 'ai' ? '🤖 AI' : '빈자리'}</span>
            {isHost && s.kind !== 'human' && <em>{s.kind === 'ai' ? '눌러서 비우기' : '눌러서 AI 넣기'}</em>}
          </button>
        ))}
      </div>
      {!isHost && !inSeat && <p className="muted center">자리에 앉는 중…</p>}
      <div className="lobby-settings">
        <div className="seg">
          {([[false, '1살부터'], [true, '성인부터']] as const).map(([v, l]) => (
            <button key={l} className={lobby.settings.startAdult === v ? 'on' : ''} disabled={!isHost} onClick={() => setSettings({ startAdult: v })}>{l}</button>
          ))}
        </div>
        <div className="seg">
          {DIFF.map(([v, l]) => <button key={v} className={lobby.settings.difficulty === v ? 'on' : ''} disabled={!isHost} onClick={() => setSettings({ difficulty: v })}>AI {l}</button>)}
        </div>
      </div>
      {isHost ? (
        <button className="wide big" disabled={players < 2} onClick={() => void start()}>시작 ({humans}명 + AI {players - humans})</button>
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
  const ownersNow = useRef(owners)
  ownersNow.current = isHost ? ownersRef.current : owners
  useEffect(() => {
    const sub = client.models.Action.onCreate({ filter: { roomId: { eq: room.id } } }).subscribe({
      next: (a) => {
        if (a.kind !== 'emote') return
        const p = parse<ActionPayload & { player?: number; expr?: Expr } | null>(a.payload, null)
        if (!p || p.userId === me.userId || typeof p.player !== 'number' || !p.expr || !EMOTES.includes(p.expr)) return
        if (ownersNow.current[p.player] !== p.userId) return // 자기 플레이어 표정만
        setIncoming({ player: p.player, expr: p.expr, id: a.id })
      },
    })
    return () => sub.unsubscribe()
  }, [room.id, me.userId])

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
          incoming,
        },
      })}
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
