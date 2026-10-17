// 로그인 · 회원가입 (온라인 계정 하나로 혼자 하기 저장과 온라인을 모두 씀)
import { useState } from 'react'
import { Frame } from '../ui/Screens'
import { cleanId, cleanPw, currentMe, ID_OK, join, login, PW_OK, type Me } from '../online/client'

export default function AuthScreen({ initial = 'login', onDone, onBack }: { initial?: 'login' | 'join'; onDone: (me: Me) => void; onBack: () => void }) {
  const [mode, setMode] = useState<'login' | 'join'>(initial)
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
    if (e) { setBusy(false); setErr(e); return }
    const m = await currentMe()
    setBusy(false)
    if (m) onDone(m)
    else setErr('잠시 뒤 다시 해 주세요')
  }
  return (
    <Frame>
      <h2 className="jua center">{mode === 'login' ? '로그인' : '회원가입'}</h2>
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
        <p className="muted center">{mode === 'join' ? '이메일을 받지 않아서 비밀번호를 잊으면 스스로 찾을 수 없어요' : '옷차림과 하던 게임이 계정에 저장돼서 다른 기기에서도 이어 할 수 있어요'}</p>
        <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
      </form>
    </Frame>
  )
}
