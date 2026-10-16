// 온라인 화면: 로그인·가입 → 온라인 메뉴(방 만들기·코드로 들어가기) → 대기실
// 게임 진행 연결은 다음 단계 (docs/13-review.md 14)
import { useCallback, useEffect, useRef, useState } from 'react'
import { Frame } from '../ui/Screens'
import {
  cleanId, cleanPw, client, createRoom, currentMe, ID_OK, join, login, logoutOnline, openRooms, parse, PW_OK, saveRoom, sendAction,
  type ActionPayload, type LobbyState, type Me, type Room, type Seat,
} from './client'

export function Online({ onBack }: { onBack: () => void }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined) // undefined: 확인 중
  const [roomId, setRoomId] = useState<string | null>(null)
  useEffect(() => { void currentMe().then(setMe) }, [])

  if (me === undefined) return <Frame><p className="center muted">불러오는 중…</p></Frame>
  if (!me) return <AuthScreen onDone={setMe} onBack={onBack} />
  if (roomId) return <Lobby me={me} roomId={roomId} onLeave={() => setRoomId(null)} />
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
    if (room.status !== 'waiting') { setErr('이미 시작한 방이에요'); return }
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

function Lobby({ me, roomId, onLeave }: { me: Me; roomId: string; onLeave: () => void }) {
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
  const isHost = !!room?.owner && room.owner.startsWith(me.userId)

  // 방 불러오기 + 바뀔 때마다 받기
  useEffect(() => {
    void client.models.Room.get({ id: roomId }).then((r) => apply(r.data))
    const sub = client.models.Room.onUpdate({ filter: { id: { eq: roomId } } }).subscribe({ next: apply })
    return () => sub.unsubscribe()
  }, [roomId, apply])

  // 손님: 들어가겠다고 알림
  const joined = useRef(false)
  useEffect(() => {
    if (!room || isHost || joined.current) return
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
        <button className="wide big" disabled>시작 ({humans}명 + AI {players - humans}) · 다음 단계에서 연결</button>
      ) : (
        <p className="center">방장이 시작하기를 기다리는 중…</p>
      )}
      <button className="wide ghost" onClick={() => void leave()}>{isHost ? '방 닫고 나가기' : '나가기'}</button>
    </Frame>
  )
}
