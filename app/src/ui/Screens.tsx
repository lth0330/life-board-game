import { useState, type ReactNode } from 'react'
import { Logo } from '../art/Art'
import { Character } from '../art/Character'
import type { Outfit } from '../engine/outfit'
import type { Difficulty } from '../engine/types'
import { savedSpeed, type Profile, type SaveSlot } from '../storage'
import { Dresser } from './Dresser'
import { Manual } from './Manual'

export type Speed = 'fast' | 'normal' | 'slow'
export interface SetupResult { name: string; names: string[]; humans: number; ai: number; difficulty: Difficulty; speed: Speed; outfit: Outfit }

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="setup">
      <div className="setup-scene" aria-hidden="true"><div className="hill a" /><div className="hill b" /><div className="cloud a" /><div className="cloud b" /></div>
      <div className="setup-card">{children}</div>
    </div>
  )
}

// 처음 화면: 로그인 / 회원가입 (온라인 계정) / 로그인 없이 / 설명서
export function TitleScreen({ notice, gameNotice, onAuth, onGuest, onAdmin }: { notice?: string; gameNotice?: string; onAuth: (mode: 'login' | 'join') => void; onGuest: () => void; onAdmin: () => void }) {
  const [manual, setManual] = useState(false)
  return (
    <Frame>
      <button className="admin-gear" aria-label="관리자 설정" onClick={onAdmin}>⚙️</button>
      <div className="title-logo"><Logo size={340} /></div>
      {gameNotice && <p className="game-notice">📢 {gameNotice}</p>}
      {notice && <p className="bad center">{notice}</p>}
      <button className="wide big" onClick={() => onAuth('login')}>로그인</button>
      <button className="wide secondary" onClick={() => onAuth('join')}>회원가입</button>
      <button className="wide secondary" onClick={onGuest}>로그인 없이 하기 (저장 안 됨)</button>
      <button className="wide ghost" onClick={() => setManual(true)}>게임 설명서</button>
      <p className="muted center">한 계정으로 혼자 하기 저장과 온라인을 같이 써요. 다른 기기에서도 이어 할 수 있어요.</p>
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}

// 메뉴: 이어 하기 / 새로 하기
export function MenuScreen({ profile, slot, gameNotice, onContinue, onNew, onOnline, onLogout, onDress, onAccount }: {
  profile: Profile | null; slot: SaveSlot | null; gameNotice?: string; onContinue: () => void; onNew: () => void; onOnline: () => void; onLogout: () => void; onDress: () => void; onAccount: () => void
}) {
  const [manual, setManual] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const st = slot?.state
  const p0 = st?.players[0]
  return (
    <Frame>
      <div className="title-logo"><Logo size={260} /></div>
      {gameNotice && <p className="game-notice">📢 {gameNotice}</p>}
      <div className="menu-hello">
        {profile && <Character outfit={profile.outfit} size={44} />}
        <div>
          <b className="jua">{profile ? `${profile.nick}님, 어서 오세요` : '손님 모드'}</b>
          <p className="muted">{profile ? `${profile.loginId} · 게임은 계정에 자동 저장돼요` : '로그인하지 않으면 저장되지 않아요'}</p>
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
      <button className="wide secondary" onClick={onOnline}>🌐 온라인으로 하기</button>
      {profile && <button className="wide secondary" onClick={onDress}>캐릭터 꾸미기</button>}
      {profile && <button className="wide ghost" onClick={onAccount}>내 계정 (이메일·비밀번호)</button>}
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
  const [names, setNames] = useState(['', '', ''])
  const [ai, setAi] = useState(3)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [speed, setSpeed] = useState<Speed>(savedSpeed) // 기본은 빠르게, 지난번 고른 속도를 기억
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
      {humans > 1 && (
        <div className="field"><span>같이 할 사람 이름</span>
          {Array.from({ length: humans - 1 }, (_, i) => (
            <input key={i} value={names[i]} maxLength={8} placeholder={`${i + 2}번 이름 (비우면 친구${i + 1})`} onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))} />
          ))}
        </div>
      )}
      <div className="field"><span>AI 수</span>
        <Choice value={aiCount} options={([0, 1, 2, 3] as number[]).filter((n) => n <= maxAi && n + humans >= 2).map((n) => [n, `${n}명`] as [number, string])} onChange={setAi} />
      </div>
      <div className="field"><span>AI 난이도</span>
        <Choice value={difficulty} options={[['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']]} onChange={setDifficulty} />
      </div>
      <div className="field"><span>AI 차례 속도</span>
        <Choice value={speed} options={[['fast', '빠르게'], ['normal', '보통'], ['slow', '천천히']]} onChange={setSpeed} />
      </div>
      <button className="wide big" disabled={humans + aiCount < 2} onClick={() => onStart({ name, names: names.slice(0, humans - 1), humans, ai: aiCount, difficulty, speed, outfit })}>게임 시작</button>
      <button className="wide ghost" onClick={onBack}>뒤로</button>
      {dress && <Dresser value={outfit} onChange={(o) => { setOutfit(o); onOutfit(o) }} onDone={() => setDress(false)} />}
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}
