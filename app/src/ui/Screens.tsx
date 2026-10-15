import { useState, type ReactNode } from 'react'
import { Logo } from '../art/Art'
import { Character } from '../art/Character'
import { DEFAULT_OUTFIT, type Outfit } from '../engine/outfit'
import type { Difficulty } from '../engine/types'
import { createProfile, listProfiles, login, type Profile, type SaveSlot } from '../storage'
import { Dresser } from './Dresser'
import { Manual } from './Manual'

export type Speed = 'fast' | 'normal' | 'slow'
export interface SetupResult { name: string; humans: number; ai: number; adult: boolean; difficulty: Difficulty; speed: Speed; outfit: Outfit }

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="setup">
      <div className="setup-scene" aria-hidden="true"><div className="hill a" /><div className="hill b" /><div className="cloud a" /><div className="cloud b" /></div>
      <div className="setup-card">{children}</div>
    </div>
  )
}

// 처음 화면: 로그인 / 프로필 만들기 / 로그인 없이 / 설명서
export function TitleScreen({ onProfile, onGuest }: { onProfile: (p: Profile) => void; onGuest: () => void }) {
  const [mode, setMode] = useState<'home' | 'login' | 'create'>('home')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [manual, setManual] = useState(false)
  const profiles = listProfiles()
  const submit = async () => {
    const r = mode === 'login' ? await login(name, pin) : await createProfile(name, pin)
    if (typeof r === 'string') setErr(r)
    else onProfile(r)
  }
  return (
    <Frame>
      <div className="title-logo"><Logo size={260} /></div>
      <div className="title-cast" aria-hidden="true">
        <Character outfit={{ ...DEFAULT_OUTFIT, hat: 'cap', hatColor: '#C2452D' }} size={46} />
        <Character outfit={{ ...DEFAULT_OUTFIT, hair: 'long', hairColor: '#A8692E', top: 'dress', topColor: '#F3A3C0', acc: 'bag', accColor: '#2F8F5B' }} size={46} />
        <Character outfit={{ ...DEFAULT_OUTFIT, hair: 'curly', skin: '#C98F62', top: 'hoodie', topColor: '#2F8F5B', acc: 'glasses' }} size={46} />
      </div>
      {mode === 'home' ? (
        <>
          <button className="wide big" onClick={() => { setMode('login'); setErr('') }} disabled={!profiles.length}>로그인</button>
          <button className="wide secondary" onClick={() => { setMode('create'); setErr('') }}>프로필 만들기</button>
          <button className="wide secondary" onClick={onGuest}>로그인 없이 하기 (저장 안 됨)</button>
          <button className="wide ghost" onClick={() => setManual(true)}>게임 설명서</button>
          <p className="muted center">프로필과 저장은 지금은 이 기기 안에만 남아요.</p>
        </>
      ) : (
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); void submit() }}>
          <h2 className="jua">{mode === 'login' ? '로그인' : '프로필 만들기'}</h2>
          {mode === 'login' && profiles.length > 0 && (
            <div className="seg">{profiles.map((p) => <button type="button" key={p.name} className={name === p.name ? 'on' : ''} onClick={() => setName(p.name)}>{p.name}</button>)}</div>
          )}
          <label className="field"><span>이름</span><input value={name} maxLength={8} onChange={(e) => setName(e.target.value)} autoComplete="username" /></label>
          <label className="field"><span>비밀번호 (숫자 4자리)</span><input value={pin} inputMode="numeric" maxLength={4} type="password" onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {err && <p className="bad">{err}</p>}
          <button className="wide big" type="submit">{mode === 'login' ? '들어가기' : '만들기'}</button>
          <button className="wide ghost" type="button" onClick={() => setMode('home')}>뒤로</button>
        </form>
      )}
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}

// 메뉴: 이어 하기 / 새로 하기
export function MenuScreen({ profile, slot, onContinue, onNew, onLogout, onDress }: {
  profile: Profile | null; slot: SaveSlot | null; onContinue: () => void; onNew: () => void; onLogout: () => void; onDress: () => void
}) {
  const [manual, setManual] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const st = slot?.state
  const p0 = st?.players[0]
  return (
    <Frame>
      <div className="title-logo"><Logo size={200} /></div>
      <div className="menu-hello">
        {profile?.outfit && <Character outfit={profile.outfit} size={44} />}
        <div>
          <b className="jua">{profile ? `${profile.name}님, 어서 오세요` : '손님 모드'}</b>
          <p className="muted">{profile ? '게임은 자동 저장돼요' : '로그인하지 않으면 저장되지 않아요'}</p>
        </div>
      </div>
      {st && p0 && (
        <button className="wide big" onClick={onContinue}>
          이어 하기
          <span className="btn-sub">{st.stages[st.stageIdx].name} 단계 · {new Date(slot!.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} 저장</span>
        </button>
      )}
      {confirm ? (
        <div className="note">
          <p>새로 하면 지금 저장된 게임은 지워져요. 새로 할까요?</p>
          <div className="row"><button className="grow" onClick={onNew}>새로 하기</button><button className="grow" onClick={() => setConfirm(false)}>취소</button></div>
        </div>
      ) : (
        <button className={`wide ${st ? 'secondary' : 'big'}`} onClick={() => (st ? setConfirm(true) : onNew())}>새로 하기</button>
      )}
      {profile && <button className="wide secondary" onClick={onDress}>캐릭터 꾸미기</button>}
      <button className="wide ghost" onClick={() => setManual(true)}>게임 설명서</button>
      <button className="wide ghost" onClick={onLogout}>{profile ? '로그아웃' : '처음 화면으로'}</button>
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}

function Choice<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={String(v)} className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}

// 새 게임 설정 (+ 캐릭터 꾸미기)
export function SetupScreen({ defaultName, outfit: initialOutfit, onStart, onBack, onOutfit }: {
  defaultName: string; outfit: Outfit; onStart: (o: SetupResult) => void; onBack: () => void; onOutfit: (o: Outfit) => void
}) {
  const [name, setName] = useState(defaultName)
  const [humans, setHumans] = useState(1)
  const [ai, setAi] = useState(3)
  const [adult, setAdult] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [speed, setSpeed] = useState<Speed>('normal')
  const [outfit, setOutfit] = useState(initialOutfit)
  const [dress, setDress] = useState(false)
  const [manual, setManual] = useState(false)
  const maxAi = 4 - humans
  const aiCount = Math.min(ai, maxAi)
  return (
    <Frame>
      <div className="setup-head">
        <h1 className="jua">새 게임</h1>
        <button className="ghost-btn" onClick={() => setManual(true)}>설명서</button>
      </div>
      <div className="setup-me">
        <button className="me-preview" onClick={() => setDress(true)} aria-label="캐릭터 꾸미기">
          <Character outfit={outfit} size={56} />
          <span>꾸미기</span>
        </button>
        <label className="field grow"><span>내 이름</span><input value={name} maxLength={8} onChange={(e) => setName(e.target.value)} /></label>
      </div>
      <div className="field"><span>이 폰으로 같이 할 사람 (나 포함)</span>
        <Choice value={humans} options={[[1, '혼자'], [2, '2명'], [3, '3명'], [4, '4명']]} onChange={(v) => { setHumans(v); setAi(Math.min(ai, 4 - v)) }} />
      </div>
      <div className="field"><span>AI 수</span>
        <Choice value={aiCount} options={([0, 1, 2, 3] as number[]).filter((n) => n <= maxAi && n + humans >= 2).map((n) => [n, `${n}명`] as [number, string])} onChange={setAi} />
      </div>
      <div className="field"><span>시작 나이</span>
        <Choice value={adult} options={[[false, '1살부터 (약 45분)'], [true, '성인부터 (약 30분)']]} onChange={setAdult} />
      </div>
      <div className="field"><span>AI 난이도</span>
        <Choice value={difficulty} options={[['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']]} onChange={setDifficulty} />
      </div>
      <div className="field"><span>AI 차례 속도</span>
        <Choice value={speed} options={[['fast', '빠르게'], ['normal', '보통'], ['slow', '천천히']]} onChange={setSpeed} />
      </div>
      <button className="wide big" disabled={humans + aiCount < 2} onClick={() => onStart({ name, humans, ai: aiCount, adult, difficulty, speed, outfit })}>게임 시작</button>
      <button className="wide ghost" onClick={onBack}>뒤로</button>
      {dress && <Dresser value={outfit} onChange={(o) => { setOutfit(o); onOutfit(o) }} onDone={() => setDress(false)} />}
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}
