// 관리자 화면 (2026-10-21): 관리자 계정으로만. 회원 목록(닉네임·아이디·이메일·가입일·최근 접속)과 계정 삭제
// 비밀번호는 저장 방식상 아무도 볼 수 없음
import { useCallback, useEffect, useState } from 'react'
import { Frame } from '../ui/Screens'
import { adminDeleteUser, adminUsers, amAdmin, cleanId, cleanPw, login, logoutOnline, type AdminUser } from '../online/client'

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-')

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<'checking' | 'login' | 'ok'>('checking')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [ask, setAsk] = useState<AdminUser | null>(null) // 지우기 전에 한 번 더 묻기
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const r = await adminUsers()
    if (typeof r === 'string') { setErr(r); return }
    setUsers(r.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')))
  }, [])
  useEffect(() => { void amAdmin().then((ok) => { setState(ok ? 'ok' : 'login'); if (ok) void load() }) }, [load])
  const signIn = async () => {
    setBusy(true); setErr('')
    const e = await login(id, pw)
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
      <Frame>
        <h2 className="jua center">⚙️ 관리자</h2>
        <p className="muted center">관리자 계정으로만 들어갈 수 있어요</p>
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void signIn() }}>
          <label className="field"><span>아이디</span><input value={id} onChange={(e) => setId(cleanId(e.target.value))} autoComplete="username" autoCapitalize="none" spellCheck={false} /></label>
          <label className="field"><span>비밀번호</span><input value={pw} type="password" onChange={(e) => setPw(cleanPw(e.target.value))} autoComplete="current-password" /></label>
          {err && <p className="bad">{err}</p>}
          <button className="wide big" type="submit" disabled={busy}>{busy ? '잠시만요…' : '들어가기'}</button>
          <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
        </form>
      </Frame>
    )
  }
  return (
    <Frame>
      <h2 className="jua center">⚙️ 회원 관리</h2>
      <p className="muted center">{users ? `회원 ${users.length}명` : '불러오는 중…'} · 비밀번호는 아무도 볼 수 없어요</p>
      {err && <p className="bad">{err}</p>}
      <div className="admin-list">
        {users?.map((u) => (
          <div key={u.id} className="admin-user">
            <div className="grow">
              <b>{u.nick || '(닉네임 없음)'}</b> <span className="muted">{u.id}</span>{u.admin && <em className="admin-tag">관리자</em>}
              <div className="muted">{u.email ?? '이메일 없음'}</div>
              <div className="muted">가입 {day(u.created)} · 최근 접속 {day(u.lastSeen)}</div>
            </div>
            {!u.admin && <button className="danger" disabled={busy} onClick={() => setAsk(u)}>삭제</button>}
          </div>
        ))}
      </div>
      <button className="wide secondary" disabled={busy} onClick={() => void load()}>새로고침</button>
      <button className="wide ghost" onClick={() => void leave()}>나가기 (로그아웃)</button>
      {ask && (
        <div className="sheet-backdrop">
          <div className="sheet mini center">
            <h2 className="jua">계정 삭제</h2>
            <p><b>{ask.nick}</b> ({ask.id}) 계정을 지울까요?<br />옷차림과 혼자 하던 게임도 같이 지워지고 되돌릴 수 없어요.</p>
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
