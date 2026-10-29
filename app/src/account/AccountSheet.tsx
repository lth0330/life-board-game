// 내 계정 (2026-10-21): 아이디·닉네임·이메일 보기, 이메일 바꾸기(확인 코드 없이), 비밀번호 바꾸기
// 구글 계정(2026-10-29)은 이메일·비밀번호를 구글에서 관리해서 바꾸기를 안 보여 줌
import { useEffect, useState } from 'react'
import { changeEmail, changePassword, cleanPw, EMAIL_OK, isGoogleId, myEmail, PW_OK } from '../online/client'

export default function AccountSheet({ loginId, nick, onClose }: { loginId: string; nick: string; onClose: () => void }) {
  const [email, setEmail] = useState<string | null | undefined>(undefined) // undefined: 불러오는 중
  const [newEmail, setNewEmail] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void myEmail().then(setEmail) }, [])
  const saveEmail = async () => {
    const v = newEmail.trim().toLowerCase()
    if (!EMAIL_OK.test(v)) { setMsg({ text: '이메일을 확인해 주세요', bad: true }); return }
    setBusy(true)
    const e = await changeEmail(v)
    setBusy(false)
    if (e) { setMsg({ text: e, bad: true }); return }
    setEmail(v); setNewEmail(''); setMsg({ text: '이메일을 바꿨어요', bad: false })
  }
  const savePw = async () => {
    if (!oldPw) { setMsg({ text: '지금 비밀번호를 적어 주세요', bad: true }); return }
    if (!PW_OK.test(newPw)) { setMsg({ text: '새 비밀번호는 영어·숫자·특수기호 6자 이상이에요', bad: true }); return }
    setBusy(true)
    const e = await changePassword(oldPw, newPw)
    setBusy(false)
    if (e) { setMsg({ text: e, bad: true }); return }
    setOldPw(''); setNewPw(''); setMsg({ text: '비밀번호를 바꿨어요', bad: false })
  }
  const google = isGoogleId(loginId)
  return (
    <div className="sheet-backdrop">
      <div className="sheet account-sheet">
        <div className="sheet-head">
          <h2 className="jua">내 계정</h2>
          <button className="x" onClick={onClose}>닫기</button>
        </div>
        <div className="info-row"><b>아이디</b> <span>{google ? '구글 계정으로 로그인' : loginId}</span></div>
        <div className="info-row"><b>닉네임</b> <span>{nick}</span></div>
        <div className="info-row"><b>이메일</b> <span>{email === undefined ? '불러오는 중…' : email ?? '없음 (아래에서 등록해 주세요)'}</span></div>
        {msg && <p className={msg.bad ? 'bad' : 'good'}>{msg.text}</p>}

        {google ? <p className="muted">구글로 로그인하는 계정이에요. 이메일과 비밀번호는 구글 계정에서 관리해요.</p> : <>
        <h3>이메일 {email ? '바꾸기' : '등록'}</h3>
        <p className="muted">아이디·비밀번호를 잊었을 때 이 메일로 아이디와 코드를 보내 드려요.</p>
        <form className="row" onSubmit={(e) => { e.preventDefault(); void saveEmail() }}>
          <input className="grow" value={newEmail} type="email" inputMode="email" placeholder="새 이메일" aria-label="새 이메일" autoCapitalize="none" spellCheck={false} onChange={(e) => setNewEmail(e.target.value.trim())} />
          <button type="submit" disabled={busy}>저장</button>
        </form>

        <h3>비밀번호 바꾸기</h3>
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void savePw() }}>
          <input value={oldPw} type="password" placeholder="지금 비밀번호" aria-label="지금 비밀번호" autoComplete="current-password" onChange={(e) => setOldPw(cleanPw(e.target.value))} />
          <input value={newPw} type="password" placeholder="새 비밀번호 (6자 이상)" aria-label="새 비밀번호" autoComplete="new-password" onChange={(e) => setNewPw(cleanPw(e.target.value))} />
          <button className="wide" type="submit" disabled={busy}>비밀번호 바꾸기</button>
        </form>
        </>}
      </div>
    </div>
  )
}
