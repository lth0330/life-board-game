import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../art/Art'
import { Character } from '../art/Character'
import type { Outfit } from '../engine/outfit'
import type { Difficulty, MapTheme } from '../engine/types'
import { THEMES } from './format'
import type { Profile, SaveSlot } from '../storage'
import { TitleScenery } from '../art/Scenery'
import { Dresser } from './Dresser'
import { Manual } from './Manual'

export type Speed = 'fast' | 'normal' | 'slow'
export interface SetupResult { name: string; names: string[]; humans: number; ai: number; difficulty: Difficulty; outfit: Outfit; teams?: (0 | 1)[]; theme?: MapTheme }

// 왼쪽 위에 늘 같은 자리에 있는 뒤로 가기 버튼 (2026-10-22 사용자: 모든 화면에서)
// 폰의 뒤로 버튼·뒤로 쓸기(브라우저 뒤로)도 지금 보이는 '‹' 버튼과 똑같이 (2026-10-22)
// 화면에 '‹' 버튼이 있으면 그 동작을 하고 사이트에 머묾. 없으면(처음 화면·로그인한 메뉴) 원래대로 사이트를 떠남
let currentBack: (() => void) | null = null
let historyReady = false
function setupHistory() {
  if (historyReady || typeof window === 'undefined') return
  historyReady = true
  window.history.pushState({ dgl: true }, '')
  window.addEventListener('popstate', () => {
    if (!currentBack) return // 돌아갈 곳이 없으면 한 번 더 뒤로 가면 사이트를 떠남
    currentBack()
    window.history.pushState({ dgl: true }, '')
  })
}
export function BackButton({ onClick, label = '뒤로 가기' }: { onClick: () => void; label?: string }) {
  const latest = useRef(onClick)
  latest.current = onClick
  useEffect(() => {
    setupHistory()
    const run = () => latest.current()
    currentBack = run
    return () => { if (currentBack === run) currentBack = null }
  }, [])
  return (
    <button className="back-fab" onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 4L7 12l8 8" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}

// onBack이 있으면 왼쪽 위에 뒤로 가기 버튼
export function Frame({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <div className={`setup${onBack ? ' has-back' : ''}`}>
      <TitleScenery />
      {onBack && <BackButton onClick={onBack} />}
      <div className="setup-card">{children}</div>
    </div>
  )
}

// 처음 화면: 로그인 / 회원가입 (온라인 계정) / 로그인 없이 / 설명서
// 구글로 처음 들어온 사람: 게임 안 이름(닉네임) 정하기 (2026-10-29)
export function NickScreen({ onDone, onBack }: { onDone: (nick: string) => Promise<void>; onBack: () => void }) {
  const [nick, setNick] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async () => {
    if (!nick.trim()) { setErr('닉네임을 적어 주세요'); return }
    setBusy(true)
    try { await onDone(nick.trim()) } catch { setBusy(false); setErr('잠시 뒤 다시 해 주세요') }
  }
  return (
    <Frame onBack={onBack}>
      <h2 className="jua center">반가워요!</h2>
      <p className="center">게임 안에서 쓸 이름을 정해 주세요</p>
      <form className="login-form" onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <label className="field"><span>닉네임 (8자까지)</span><input value={nick} maxLength={8} autoFocus onChange={(e) => setNick(e.target.value)} /></label>
        {err && <p className="bad">{err}</p>}
        <button className="wide big" disabled={busy}>{busy ? '저장 중…' : '시작하기'}</button>
      </form>
    </Frame>
  )
}

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
    <Frame onBack={profile ? undefined : onLogout}>
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
          <p>새 게임을 시작하면 지금 저장된 게임은 지워져요. 새로 할까요?</p>
          <div className="row"><button className="grow" onClick={onNew}>새로 하기</button><button className="grow" onClick={() => setConfirm(false)}>취소</button></div>
        </div>
      ) : (
        <button className={`wide ${st ? 'secondary' : 'big'}`} onClick={() => (st ? setConfirm(true) : onNew())}>혼자 플레이</button>
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

function Choice<T extends string | number | boolean>({ value, options, onChange, tight = false }: { value: T; options: [T, string][]; onChange: (v: T) => void; tight?: boolean }) {
  return (
    <div className={`seg${tight ? ' tight' : ''}`}>
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
  const [outfit, setOutfit] = useState(initialOutfit)
  const [dress, setDress] = useState(false)
  const [manual, setManual] = useState(false)
  const maxAi = 4 - humans
  const aiCount = Math.min(ai, maxAi)
  // 팀전 (4명일 때): 자리마다 A/B. 처음엔 사람 2·AI 2면 사람 vs AI, 아니면 번갈아 (2026-10-21)
  const [teamOn, setTeamOn] = useState(false)
  const [theme, setTheme] = useState<MapTheme | ''>('')
  const [teamPick, setTeamPick] = useState<(0 | 1)[] | null>(null)
  const four = humans + aiCount === 4
  const seatNames = [name || '나', ...Array.from({ length: humans - 1 }, (_, i) => names[i] || `친구${i + 1}`), ...Array.from({ length: aiCount }, (_, i) => `AI ${i + 1}`)]
  const teams: (0 | 1)[] = teamPick && teamPick.length === 4 ? teamPick : humans === 2 ? [0, 0, 1, 1] : [0, 1, 0, 1]
  const teamOk = teams.filter((t) => t === 0).length === 2
  return (
    <Frame onBack={onBack}>
      <div className="setup-head">
        <h1 className="jua">혼자 플레이</h1>
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
      {four && (
        <div className="field"><span>팀전 (2 대 2, 팀 점수 합계로 승부)</span>
          <Choice value={teamOn} options={[[false, '각자'], [true, '팀전']]} onChange={setTeamOn} />
          {teamOn && (
            <div className="team-pick">
              {seatNames.map((n, k) => (
                <button key={k} className={`team-seat t${teams[k]}`} onClick={() => setTeamPick(teams.map((t, j) => (j === k ? (t ? 0 : 1) : t)) as (0 | 1)[])}>
                  <b>{n}</b><span>{teams[k] ? 'B팀' : 'A팀'}</span>
                </button>
              ))}
              {!teamOk && <p className="bad">두 명씩 나눠 주세요 (누르면 팀이 바뀌어요)</p>}
            </div>
          )}
        </div>
      )}
      <div className="field"><span>판 테마 (계절 미니게임·사건이 가끔 나와요)</span>
        <Choice value={theme} options={THEMES} onChange={setTheme} tight />
      </div>
      <div className="field"><span>AI 난이도</span>
        <Choice value={difficulty} options={[['normal', '보통'], ['hard', '어려움']]} onChange={setDifficulty} />
      </div>
      <button className="wide big" disabled={humans + aiCount < 2 || (four && teamOn && !teamOk)} onClick={() => onStart({ name, names: names.slice(0, humans - 1), humans, ai: aiCount, difficulty, outfit, teams: four && teamOn ? teams : undefined, theme: theme || undefined })}>게임 시작</button>
      <button className="wide ghost" onClick={onBack}>뒤로</button>
      {dress && <Dresser value={outfit} onChange={(o) => { setOutfit(o); onOutfit(o) }} onDone={() => setDress(false)} />}
      {manual && <Manual onClose={() => setManual(false)} />}
    </Frame>
  )
}
