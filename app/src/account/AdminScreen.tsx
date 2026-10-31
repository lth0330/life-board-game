// 관리자 화면 (2026-10-21): 관리자 계정으로만. 회원 관리(목록·고치기·잠그기·삭제)와 게임 설정(공지)
// 비밀번호는 저장 방식상 아무도 볼 수 없음
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Frame } from '../ui/Screens'
import { adminDeleteUser, adminUpdateUser, adminUsers, amAdmin, cleanId, cleanPw, currentMe, EMAIL_OK, getNotice, isGoogleId, login, logoutOnline, setNotice, type AdminUser, type Me } from '../online/client'
import { idInputProps } from './idInput'
const AccountSheet = lazy(() => import('./AccountSheet'))

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-')

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<'checking' | 'login' | 'ok'>('checking')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [ask, setAsk] = useState<AdminUser | null>(null) // 지우기 전에 한 번 더 묻기
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [tab, setTab] = useState<'users' | 'settings'>('users')
  const [me, setMe] = useState<Me | null>(null)
  const [mine, setMine] = useState(false) // 내 계정 (관리자 비밀번호 바꾸기)
  useEffect(() => { if (state === 'ok') void currentMe().then(setMe) }, [state])
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const r = await adminUsers()
    if (typeof r === 'string') { setErr(r); return }
    setUsers(r.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')))
  }, [])
  useEffect(() => { void amAdmin().then((ok) => { setState(ok ? 'ok' : 'login'); if (ok) void load() }) }, [load])
  const signIn = async () => {
    setBusy(true); setErr('')
    const e = await login(cleanId(id), pw)
    if (e) { setBusy(false); setErr(e); return }
    const ok = await amAdmin()
    setBusy(false)
    if (!ok) { await logoutOnline(); setErr('관리자만 쓸 수 있어요'); return }
    setState('ok'); void load()
  }
  const remove = async (u: AdminUser) => {
    setBusy(true)
    const e = await adminDeleteUser(u.id)
    setBusy(false); setAsk(null)
    if (e) { setErr(e); return }
    setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null)
  }
  const leave = async () => { if (state === 'ok') await logoutOnline().catch(() => {}); onBack() }

  if (state === 'checking') return <Frame><p className="center muted">확인하는 중…</p></Frame>
  if (state === 'login') {
    return (
      <Frame onBack={onBack}>
        <h2 className="jua center">⚙️ 관리자</h2>
        <p className="muted center">관리자 계정으로만 들어갈 수 있어요</p>
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void signIn() }}>
          <label className="field"><span>아이디</span><input value={id} {...idInputProps(setId)} /></label>
          <label className="field"><span>비밀번호</span><input value={pw} type="password" onChange={(e) => setPw(cleanPw(e.target.value))} autoComplete="current-password" /></label>
          {err && <p className="bad">{err}</p>}
          <button className="wide big" type="submit" disabled={busy}>{busy ? '잠시만요…' : '들어가기'}</button>
          <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
        </form>
      </Frame>
    )
  }
  return (
    <Frame onBack={() => void leave()}>
      <h2 className="jua center">⚙️ 관리자</h2>
      <div className="seg">
        <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>회원 관리</button>
        <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>게임 설정</button>
      </div>
      {tab === 'settings' ? <Settings /> : <>
      <p className="muted center">{users ? `회원 ${users.length}명` : '불러오는 중…'} · 비밀번호는 아무도 볼 수 없어요</p>
      {err && <p className="bad">{err}</p>}
      <div className="admin-list">
        {users?.map((u) => (
          <div key={u.id} className="admin-user">
            <div className="grow">
              <b>{u.nick || '(닉네임 없음)'}</b> {isGoogleId(u.id) ? <em className="admin-tag google">구글 계정</em> : <span className="muted">{u.id}</span>}{u.admin && <em className="admin-tag">관리자</em>}{!u.enabled && <em className="admin-tag locked">잠김</em>}
              <div className="muted">{u.email ?? '이메일 없음'}</div>
              <div className="muted">가입 {day(u.created)} · 최근 접속 {day(u.lastSeen)}</div>
            </div>
            {!u.admin && <div className="admin-btns"><button disabled={busy} onClick={() => setEditing(u)}>수정</button><button className="danger" disabled={busy} onClick={() => setAsk(u)}>삭제</button></div>}
          </div>
        ))}
      </div>
      <button className="wide secondary" disabled={busy} onClick={() => void load()}>새로고침</button>
      </>}
      {me && <button className="wide ghost" onClick={() => setMine(true)}>내 계정 (관리자 비밀번호 바꾸기)</button>}
      <button className="wide ghost" onClick={() => void leave()}>나가기 (로그아웃)</button>
      {mine && me && <Suspense fallback={null}><AccountSheet loginId={me.loginId} nick={me.nick} onClose={() => setMine(false)} /></Suspense>}
      {editing && <EditUser u={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load() }} />}
      {ask && (
        <div className="sheet-backdrop">
          <div className="sheet mini center">
            <h2 className="jua">계정 삭제</h2>
            <p><b>{ask.nick}</b> ({ask.id}) 계정을 지울까요?<br />옷차림과 저장된 게임도 같이 지워지고 되돌릴 수 없어요.</p>
            <div className="row">
              <button className="grow danger" disabled={busy} onClick={() => void remove(ask)}>지우기</button>
              <button className="grow" onClick={() => setAsk(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </Frame>
  )
}

// 회원 고치기: 바꿀 칸만 채움. 비밀번호는 새로 정해 주고 그 사람에게 알려 줌
function EditUser({ u, onClose, onSaved }: { u: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [nick, setNick] = useState(u.nick ?? '')
  const [email, setEmail] = useState(u.email ?? '')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (patch: Parameters<typeof adminUpdateUser>[1]) => {
    setBusy(true); setErr('')
    const e = await adminUpdateUser(u.id, patch)
    setBusy(false)
    if (e) { setErr(e); return }
    onSaved()
  }
  const save = () => {
    const patch: Parameters<typeof adminUpdateUser>[1] = {}
    if (nick.trim() && nick.trim() !== u.nick) patch.nick = nick.trim()
    if (email.trim() && email.trim() !== u.email) {
      if (!EMAIL_OK.test(email.trim())) { setErr('이메일을 확인해 주세요'); return }
      patch.email = email.trim()
    }
    if (pw) {
      if (!/^[\x21-\x7e]{6,32}$/.test(pw)) { setErr('비밀번호는 영어 소문자·숫자·특수기호 6자 이상이에요'); return }
      patch.password = pw
    }
    if (!Object.keys(patch).length) { setErr('바꾼 것이 없어요'); return }
    void run(patch)
  }
  return (
    <div className="sheet-backdrop">
      <div className="sheet account-sheet">
        <div className="sheet-head">
          <h2 className="jua">회원 수정: {isGoogleId(u.id) ? `${u.nick || '구글 계정'} (구글)` : u.id}</h2>
          <button className="x" onClick={onClose}>닫기</button>
        </div>
        <label className="field"><span>닉네임 (8자까지)</span><input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} /></label>
        <label className="field"><span>이메일</span><input value={email} type="email" autoCapitalize="none" spellCheck={false} onChange={(e) => setEmail(e.target.value.trim())} /></label>
        {isGoogleId(u.id)
          ? <p className="muted">구글로 로그인하는 계정이라 비밀번호가 없어요</p>
          : <label className="field"><span>새 비밀번호 (비워 두면 그대로. 바꾸면 그 사람에게 알려 주세요)</span><input value={pw} onChange={(e) => setPw(cleanPw(e.target.value))} autoComplete="off" /></label>}
        {err && <p className="bad">{err}</p>}
        <button className="wide big" disabled={busy} onClick={save}>저장</button>
        <button className={`wide ${u.enabled ? 'danger' : 'secondary'}`} disabled={busy} onClick={() => void run({ enabled: !u.enabled })}>
          {u.enabled ? '🔒 계정 잠그기 (로그인 막기)' : '🔓 잠금 풀기'}
        </button>
      </div>
    </div>
  )
}

// 게임 설정: 공지 (처음 화면·메뉴에 보임)
function Settings() {
  const [notice, setText] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void getNotice().then(setText) }, [])
  const save = async (v: string) => {
    setBusy(true)
    const e = await setNotice(v)
    setBusy(false)
    setMsg(e ? { text: e, bad: true } : { text: v ? '공지를 올렸어요' : '공지를 내렸어요', bad: false })
    if (!e) setText(v)
  }
  if (notice === null) return <p className="center muted">불러오는 중…</p>
  return (
    <div className="login-form">
      <label className="field"><span>📢 공지 (처음 화면과 메뉴 위에 보여요. 비우면 안 보여요)</span>
        <textarea className="notice-input" value={notice} maxLength={200} rows={4} onChange={(e) => setText(e.target.value)} />
      </label>
      {msg && <p className={msg.bad ? 'bad' : 'good'}>{msg.text}</p>}
      <button className="wide big" disabled={busy} onClick={() => void save(notice.trim())}>공지 저장</button>
      <button className="wide secondary" disabled={busy || !notice} onClick={() => void save('')}>공지 내리기</button>
    </div>
  )
}
