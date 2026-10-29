// 로그인 · 회원가입 (온라인 계정 하나로 혼자 하기 저장과 온라인을 모두 씀)
// 2026-10-21: 가입 때 이메일 필수, 아이디·비밀번호 찾기 (메일로 아이디 + 코드 → 코드와 새 비밀번호)
import { useState } from 'react'
import { Frame } from '../ui/Screens'
import { cleanId, cleanPw, currentMe, EMAIL_OK, googleLogin, googleReady, ID_OK, join, login, PW_OK, resetWithCode, sendFindMail, type Me } from '../online/client'

type Mode = 'login' | 'join' | 'find'

export default function AuthScreen({ initial = 'login', onDone, onBack }: { initial?: 'login' | 'join'; onDone: (me: Me) => void; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(initial)
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [nick, setNick] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const go = (m: Mode) => { setMode(m); setErr('') }
  const submit = async () => {
    if (!ID_OK.test(id)) { setErr('아이디는 영어 소문자·숫자 4~16자예요'); return }
    if (!PW_OK.test(pw)) { setErr('비밀번호는 영어·숫자·특수기호 6자 이상이에요'); return }
    if (mode === 'join' && !nick.trim()) { setErr('닉네임을 적어 주세요'); return }
    if (mode === 'join' && !EMAIL_OK.test(email.trim())) { setErr('이메일을 확인해 주세요 (아이디·비밀번호를 찾을 때 써요)'); return }
    setBusy(true)
    const e = mode === 'join' ? await join(id, pw, nick.trim(), email.trim().toLowerCase()) : await login(id, pw)
    if (e) { setBusy(false); setErr(e); return }
    const m = await currentMe()
    setBusy(false)
    if (m) onDone(m)
    else setErr('잠시 뒤 다시 해 주세요')
  }
  if (mode === 'find') return <FindAccount onBack={() => go('login')} onDone={(newId) => { setId(newId); setPw(''); go('login') }} />
  return (
    <Frame onBack={onBack}>
      <h2 className="jua center">{mode === 'login' ? '로그인' : '회원가입'}</h2>
      <div className="seg">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>로그인</button>
        <button className={mode === 'join' ? 'on' : ''} onClick={() => go('join')}>회원가입</button>
      </div>
      <form className="login-form" onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <label className="field"><span>아이디 (영어 소문자·숫자 4~16자)</span>
          <input value={id} onChange={(e) => setId(cleanId(e.target.value))} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </label>
        <label className="field"><span>비밀번호 (영어·숫자·특수기호 6자 이상)</span>
          <input value={pw} type="password" onChange={(e) => setPw(cleanPw(e.target.value))} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        {mode === 'join' && (
          <>
            <label className="field"><span>닉네임 (게임에서 보이는 이름)</span>
              <input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} />
            </label>
            <label className="field"><span>이메일 (아이디·비밀번호 찾기용)</span>
              <input value={email} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} onChange={(e) => setEmail(e.target.value.trim())} />
            </label>
          </>
        )}
        {err && <p className="bad">{err}</p>}
        <button className="wide big" type="submit" disabled={busy}>{busy ? '잠시만요…' : mode === 'login' ? '로그인' : '가입하고 시작'}</button>
        {mode === 'login' && <button className="wide ghost" type="button" onClick={() => go('find')}>아이디·비밀번호 찾기</button>}
        <p className="muted center">{mode === 'join' ? '이메일은 꼭 맞게 적어 주세요. 잊었을 때 이 메일로 아이디와 코드를 보내 드려요' : '옷차림과 하던 게임이 계정에 저장돼서 다른 기기에서도 이어 할 수 있어요'}</p>
        <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
      </form>
      {googleReady && (
        <>
          <p className="or-line muted center">또는</p>
          <button className="wide google-btn" disabled={busy} onClick={() => { setBusy(true); setErr(''); void googleLogin().then((e) => { if (e) { setBusy(false); setErr(e) } }) }}>
            <span className="g-logo" aria-hidden="true">G</span> 구글로 {mode === 'join' ? '가입하기' : '로그인'}
          </button>
          <p className="muted center small">구글 계정으로 처음 들어오면 게임 안 이름만 정하면 돼요</p>
        </>
      )}
    </Frame>
  )
}

// 아이디·비밀번호 찾기: ① 이메일 → 메일(아이디 + 코드) ② 아이디 + 코드 + 새 비밀번호
function FindAccount({ onBack, onDone }: { onBack: () => void; onDone: (id: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [id, setId] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const send = async () => {
    if (!EMAIL_OK.test(email)) { setErr('이메일을 확인해 주세요'); return }
    setBusy(true); setErr('')
    const e = await sendFindMail(email.toLowerCase())
    setBusy(false)
    if (e) { setErr(e); return }
    setStep(2)
  }
  const reset = async () => {
    if (!ID_OK.test(id)) { setErr('메일에 적힌 아이디를 적어 주세요'); return }
    if (!/^\d{6}$/.test(code)) { setErr('메일에 온 6자리 코드를 적어 주세요'); return }
    if (!PW_OK.test(pw)) { setErr('새 비밀번호는 영어·숫자·특수기호 6자 이상이에요'); return }
    setBusy(true); setErr('')
    const e = await resetWithCode(id, code, pw)
    setBusy(false)
    if (e) { setErr(e); return }
    setOk('비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요')
  }
  return (
    <Frame onBack={onBack}>
      <h2 className="jua center">아이디·비밀번호 찾기</h2>
      {ok ? (
        <>
          <p className="center">{ok}</p>
          <button className="wide big" onClick={() => onDone(id)}>로그인하러 가기</button>
        </>
      ) : step === 1 ? (
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void send() }}>
          <p className="muted">가입할 때 적은 이메일로 <b>아이디</b>와 비밀번호를 바꾸는 <b>6자리 코드</b>를 보내 드려요.</p>
          <label className="field"><span>이메일</span>
            <input value={email} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} onChange={(e) => setEmail(e.target.value.trim())} />
          </label>
          {err && <p className="bad">{err}</p>}
          <button className="wide big" type="submit" disabled={busy}>{busy ? '보내는 중…' : '메일 보내기'}</button>
          <button className="wide ghost" type="button" onClick={onBack}>뒤로</button>
        </form>
      ) : (
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void reset() }}>
          <p className="muted">등록된 이메일이면 메일이 갔어요 (스팸함도 확인해 주세요). 아이디만 잊었으면 메일에서 확인하고 로그인하면 돼요.</p>
          <label className="field"><span>아이디 (메일에 적혀 있어요)</span>
            <input value={id} onChange={(e) => setId(cleanId(e.target.value))} autoComplete="username" autoCapitalize="none" spellCheck={false} />
          </label>
          <label className="field"><span>6자리 코드</span>
            <input value={code} inputMode="numeric" maxLength={6} autoComplete="one-time-code" onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="field"><span>새 비밀번호 (영어·숫자·특수기호 6자 이상)</span>
            <input value={pw} type="password" autoComplete="new-password" onChange={(e) => setPw(cleanPw(e.target.value))} />
          </label>
          {err && <p className="bad">{err}</p>}
          <button className="wide big" type="submit" disabled={busy}>{busy ? '잠시만요…' : '비밀번호 바꾸기'}</button>
          <button className="wide ghost" type="button" onClick={() => onDone(id)}>아이디만 찾았어요 → 로그인</button>
          <button className="wide ghost" type="button" onClick={() => { setStep(1); setErr('') }}>메일 다시 보내기</button>
        </form>
      )}
    </Frame>
  )
}
