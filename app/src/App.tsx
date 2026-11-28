import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Character, type Expr } from './art/Character'
import { aiStep } from './engine/ai'
import { CARS, DICE_ITEMS, MINI_PRACTICE_LIMIT } from './engine/data'
import {
  ageOf, turnIncome, loanTotal, canAct, canUseCar, createGame, cur, fortuneName, miniGuide, canSeekJob, canReunion, has, diceIn, bagOf, stageOf, contestName, miniLevel, contestReady,
} from './engine/game'
import { applyOp, type Op } from './engine/ops'
import { DEFAULT_OUTFIT, type Outfit } from './engine/outfit'
import type { DiceItem, GameState } from './engine/types'
import { setTipsOn, tipsFor, tipsOn } from './ui/tips'
import { deleteLocalGame, dropOldProfiles, lastAccount, lastWhere, makeSlot, rememberAccount, rememberWhere, saveLocalGame, savedSpeed, saveSpeed, type Profile, type SaveSlot } from './storage'
import type { Me } from './online/client'
import { BannerArt, EventArt, EventPopup, Roulette } from './art/More'
import { setBgmStage, setSoundPrefs, sfx, soundPrefs, unlockAudio } from './sound'
import { Board, FullMap } from './ui/Board'
import { Dresser } from './ui/Dresser'
import { LogBox } from './ui/LogBox'
import type { ChatMsg } from './online/Online'
import { EMOTE_COOLDOWN_MS, EMOTE_MS, EmoteBubble, EmotePicker } from './ui/Emotes'
import { autoEmote } from './ui/emoteData'
import { Confetti, DICE_THROW_MS, DiceThrow, StageCard } from './ui/Effects'
import { Manual } from './ui/Manual'
import type { MiniView } from './ui/miniView'
import type { Watcher } from './ui/MiniWatch'
import { BackButton, Frame, MenuScreen, NickScreen, SetupScreen, TitleScreen, type Speed } from './ui/Screens'
import { CardsSheet, FinanceSheet, GameOver, JobsSheet, MyInfoSheet, PeopleSheet, StageSummary, TeamBadge } from './ui/Sheets'
import { playerLine, won } from './ui/format'

// 온라인 화면(AWS 연결 포함)은 '온라인으로 하기'를 눌렀을 때만 내려받음 (혼자 하기는 가볍게)
const Online = lazy(() => import('./online/Online').then((m) => ({ default: m.Online })))
// 로그인 화면과 계정 저장도 AWS 코드라 필요할 때만
const AuthScreen = lazy(() => import('./account/AuthScreen'))
const AccountSheet = lazy(() => import('./account/AccountSheet'))
const AdminScreen = lazy(() => import('./account/AdminScreen'))
// 미니게임 화면은 처음 화면에 필요 없어서 따로 받음 (2026-10-29: 첫 화면 빨리). 게임 화면이 열리면 미리 받아 둠
type SceneMod = typeof import('./scenes/forGame')
const loadMini = () => Promise.all([import('./ui/MiniGames'), import('./ui/MiniWatch')])
const MiniGame = lazy(() => import('./ui/MiniGames').then((m) => ({ default: m.MiniGame })))
const MiniWatch = lazy(() => import('./ui/MiniWatch').then((m) => ({ default: m.MiniWatch })))
const account = () => import('./account/api')

const SPEED_MS: Record<Speed, number> = { fast: 450, normal: 1000, slow: 1700 }
const MY_POP_MS = 5000 // 내 사건 창이 저절로 닫히는 시간 (2026-10-31 사용자)
const WALK_MS = 230
const DICE_ROLL_MS = 400 // AI가 주사위를 손에 쥐고 흔드는 시간 (뒤에 던지는 연출이 붙어서 750 → 400, 2026-10-24)
const DICE_SHOW_MS = DICE_THROW_MS + 550 // 던져서 멈춘 뒤 숫자를 보여 주는 시간까지
const DICE_BEFORE_WHEEL_MS = DICE_THROW_MS + 1600
// 상점 카테고리 (물건 id로 나눔)
const SHOP_CATS = [
  { id: 'home', icon: '🏠', name: '집·차', match: (id: string) => id.startsWith('house') || id.startsWith('mortgage') || id.startsWith('car') },
  { id: 'love', icon: '💕', name: '연애', match: (id: string) => id.startsWith('agency') },
  { id: 'pet', icon: '🐶', name: '반려동물', match: (id: string) => id === 'pet' },
  { id: 'item', icon: '🎲', name: '카드·주사위', match: (id: string) => id === 'chance' || id.startsWith('dice_') },
  { id: 'loan', icon: '💳', name: '은행 대출', match: (id: string) => id.startsWith('loan') },
]
// 정보 칸 대출 줄 (2026-10-21 사용자): 남은 빚, 가장 빠른 기한. 접어도 보임
function LoanLine({ p }: { p: GameState['players'][number] }) {
  const due = p.loans.filter((l) => l.kind !== '주담대').sort((a, b) => a.dueTurn - b.dueTurn)[0]
  const mort = p.loans.find((l) => l.kind === '주담대')
  const left = due ? Math.max(0, due.dueTurn - p.turnsPlayed) : null
  const parts = p.loans.map((l) => `${l.kind ?? '일반'} ${won(l.amount)}`).join(' · ')
  return (
    <div className={`hud-loan${left !== null && left <= 3 ? ' warn' : ''}`} title={parts}>
      💳 대출 <b>{won(loanTotal(p))}</b>{p.loans.length > 1 ? ` (${p.loans.length}개)` : ''}
      {due && (left !== null && left > 50
        ? <> · {due.kind ?? '일반'} 기한 <b>졸업 뒤 8턴</b></> // 학자금은 졸업할 때 기한을 정함 (그전엔 99턴으로 둠)
        : <> · {due.kind ?? '일반'} 기한 <b>{left}턴</b> 남음{left !== null && left <= 3 ? ' ⚠️' : ''}</>)}
      {mort && <> · 주담대 매 턴 {won(mort.installment ?? 0)}</>}
    </div>
  )
}
const CELEBRATE = ['결혼!', '복권 1등!', '복권 2등!', '아기 탄생', '수능 상위권!', '게임 끝!', '회사 성장!', '감독 도전 성공!', '자녀 대성공!', '금메달!', '은메달!', '동메달!', '육순 잔치', '칠순 잔치']

type Screen = 'title' | 'auth' | 'menu' | 'setup' | 'play' | 'online' | 'admin' | 'nick'
// 구글 로그인에서 돌아온 주소 (?code=…&state=… 또는 ?error=…)
const fromGoogle = () => /[?&](code|error)=/.test(location.search) && /[?&]state=/.test(location.search)
const CLOUD_SAVE_MS = 8000 // 계정 저장은 많아야 8초에 한 번 (이 기기에는 매번)

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [slot, setSlot] = useState<SaveSlot | null>(null) // 이어 하기
  const [screen, setScreen] = useState<Screen>(() => (lastAccount() ? 'menu' : 'title'))
  const [booting, setBooting] = useState(() => !!lastAccount() || fromGoogle())
  const [authMode, setAuthMode] = useState<'login' | 'join'>('login')
  const [afterAuth, setAfterAuth] = useState<Screen>('menu')
  const [notice, setNotice] = useState('')
  const [nickFor, setNickFor] = useState<Me | null>(null) // 닉네임을 정할 사람 (구글로 처음)
  const [game, setGame] = useState<GameState | null>(null)
  const [speed, setSpeed] = useState<Speed>(savedSpeed) // 새로고침해도 그대로
  const [dress, setDress] = useState(false)
  const [myAccount, setMyAccount] = useState(false)
  const [gameNotice, setGameNotice] = useState('') // 관리자 공지 (처음 화면·메뉴)
  useEffect(() => { account().then((a) => a.getNotice()).then(setGameNotice).catch(() => {}) }, [screen === 'title' || screen === 'menu']) // eslint-disable-line react-hooks/exhaustive-deps
  const [resumeRoom, setResumeRoom] = useState<string | null>(null) // 새로고침 전에 있던 온라인 방
  const outfit = profile?.outfit ?? DEFAULT_OUTFIT
  const profileRef = useRef(profile)
  profileRef.current = profile

  // 예전에 로그인했으면 계정을 다시 불러옴
  useEffect(() => {
    dropOldProfiles()
    if (fromGoogle()) { // 구글 로그인에서 돌아옴: 로그인을 마무리하고 주소의 ?code=… 를 지움
      const failed = /[?&]error=/.test(location.search)
      account().then((a) => a.finishGoogle()).then((me) => {
        history.replaceState(null, '', location.pathname)
        if (!me) { setScreen('title'); setNotice(failed ? '구글 로그인을 취소했어요' : '구글 로그인에 실패했어요. 잠시 뒤 다시 해 주세요'); return }
        void onAuthed(me)
      }).catch(() => { setScreen('title'); setNotice('구글 로그인에 실패했어요') }).finally(() => setBooting(false))
      return
    }
    if (!lastAccount()) return
    account().then((a) => a.restoreAccount()).then((r) => {
      if (!r) { rememberAccount(null); setScreen('title'); return }
      setProfile(r.profile)
      setSlot(r.slot)
      // 새로고침이면 하던 화면으로 (혼자 하기는 저장된 게임, 온라인은 그 방)
      const w = lastWhere()
      if (w?.screen === 'play' && r.slot) { setGame(r.slot.state); setScreen('play') }
      else if (w?.screen === 'online') { setResumeRoom(w.roomId); setScreen('online') }
    }).catch(() => { setScreen('title'); setNotice('계정을 불러오지 못했어요. 인터넷 연결을 확인해 주세요') })
      .finally(() => setBooting(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- 처음 한 번만 (onAuthed는 그때 값으로 충분)

  // 지금 화면 기억 (온라인 방은 Online이 기억함)
  useEffect(() => {
    if (booting || screen === 'online') return
    rememberWhere(screen === 'play' && profile ? { screen: 'play' } : null)
  }, [booting, screen, profile])

  // ── 자동 저장: 이 기기에는 매번, 계정에는 모아서 (창을 닫거나 숨길 때·메뉴로 나갈 때는 바로) ──
  const pending = useRef<SaveSlot | null | undefined>(undefined) // undefined: 보낼 것 없음, null: 저장 지우기
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const p = profileRef.current
    const save = pending.current
    if (!p || save === undefined) return
    pending.current = undefined
    account().then((a) => a.saveCloud(p.cloudId, { save })).catch(() => { if (pending.current === undefined) pending.current = save })
  }, [])
  useEffect(() => {
    if (!game || !profile || screen !== 'play') return
    if (game.phase === 'gameover') {
      deleteLocalGame(profile.loginId)
      pending.current = null
      flush()
      return
    }
    const s = makeSlot(game)
    saveLocalGame(profile.loginId, s)
    pending.current = s
    if (!timer.current) timer.current = setTimeout(flush, CLOUD_SAVE_MS)
  }, [game, profile, screen, flush])
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush) }
  }, [flush])

  // 옷차림: 바꿀 때마다 화면엔 바로, 계정엔 잠깐 모았다가
  const outfitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const changeOutfit = (o: Outfit) => {
    if (!profile) return
    setProfile({ ...profile, outfit: o })
    if (outfitTimer.current) clearTimeout(outfitTimer.current)
    const id = profile.cloudId
    outfitTimer.current = setTimeout(() => { account().then((a) => a.saveCloud(id, { outfit: o })).catch(() => {}) }, 1200)
  }

  const onAuthed = async (me: Me) => {
    if (!me.nick) { setNickFor(me); setScreen('nick'); return } // 구글로 처음 들어온 사람: 게임 안 이름부터
    try {
      const r = await (await account()).openAccount(me)
      rememberAccount(me.loginId)
      setProfile(r.profile)
      setSlot(r.slot)
      setNotice('')
      setScreen(afterAuth)
    } catch {
      setNotice('계정을 불러오지 못했어요. 잠시 뒤 다시 해 주세요')
      setScreen('title')
    }
  }
  const askLogin = (mode: 'login' | 'join', next: Screen) => { setAuthMode(mode); setAfterAuth(next); setScreen('auth') }
  const logoutAll = () => {
    flush()
    account().then((a) => a.logoutOnline()).catch(() => {})
    rememberAccount(null)
    setProfile(null)
    setSlot(null)
    setResumeRoom(null)
    setScreen('title')
  }

  if (booting) return <Frame><p className="center muted">계정 불러오는 중…</p></Frame>
  if (screen === 'title') {
    return <TitleScreen notice={notice} gameNotice={gameNotice} onAuth={(m) => askLogin(m, 'menu')} onGuest={() => { setProfile(null); setScreen('menu') }} onAdmin={() => setScreen('admin')} />
  }
  if (screen === 'nick' && nickFor) {
    return <NickScreen onDone={async (nick) => { await (await account()).setNick(nick); void onAuthed({ ...nickFor, nick }) }} onBack={() => { account().then((a) => a.logoutOnline()).catch(() => {}); setScreen('title') }} />
  }
  if (screen === 'admin') {
    return <Suspense fallback={<Frame><p className="center muted">불러오는 중…</p></Frame>}><AdminScreen onBack={() => setScreen('title')} /></Suspense>
  }
  if (screen === 'auth') {
    return (
      <Suspense fallback={<Frame><p className="center muted">불러오는 중…</p></Frame>}>
        <AuthScreen initial={authMode} onDone={(me) => void onAuthed(me)} onBack={() => setScreen(afterAuth === 'online' ? 'menu' : 'title')} />
      </Suspense>
    )
  }
  if (screen === 'menu') {
    return (
      <>
        <MenuScreen
          profile={profile}
          slot={profile ? slot : null}
          gameNotice={gameNotice}
          onContinue={() => { if (slot) { setGame(slot.state); setScreen('play') } }}
          onNew={() => setScreen('setup')} // 저장은 새 게임을 실제로 시작할 때 지움 (설정 화면에서 뒤로 가면 그대로)
          onOnline={() => (profile ? setScreen('online') : askLogin('login', 'online'))}
          onLogout={() => (profile ? logoutAll() : setScreen('title'))}
          onDress={() => setDress(true)}
          onAccount={() => setMyAccount(true)}
        />
        {dress && <Dresser value={outfit} onChange={changeOutfit} onDone={() => setDress(false)} />}
        {myAccount && profile && <Suspense fallback={null}><AccountSheet loginId={profile.loginId} nick={profile.nick} onClose={() => setMyAccount(false)} /></Suspense>}
      </>
    )
  }
  if (screen === 'online' && profile) {
    return (
      <Suspense fallback={<div className="setup"><p className="center muted">온라인 불러오는 중…</p></div>}>
        <Online me={profile} outfit={outfit} initialRoom={resumeRoom} onOutfit={changeOutfit} onBack={() => { setResumeRoom(null); setScreen('menu') }}
          renderPlay={(o) => <Play game={o.game} setGame={o.setGame} speed="fast" saving={false} onQuit={o.onQuit} online={o.online} />} />
      </Suspense>
    )
  }
  if (screen === 'setup' || !game) {
    return (
      <SetupScreen
        defaultName={profile?.nick ?? '나'}
        outfit={outfit}
        onOutfit={changeOutfit}
        onBack={() => setScreen('menu')}
        onStart={(o) => {
          if (profile) { deleteLocalGame(profile.loginId); pending.current = null; flush(); setSlot(null) }
          setGame(createGame({
            humanName: o.name, humanNames: o.names, humans: o.humans, aiCount: o.ai, outfits: [o.outfit], teams: o.teams,
            settings: { startAdult: false, difficulty: o.difficulty, theme: o.theme },
          }))
          setScreen('play')
        }}
      />
    )
  }
  return (
    <Play game={game} setGame={setGame} speed={speed} onSpeed={(v) => { setSpeed(v); saveSpeed(v) }} saving={!!profile} onQuit={() => {
      flush()
      if (profile) setSlot(game.phase === 'gameover' ? null : makeSlot(game))
      setGame(null)
      setScreen('menu')
    }} onNew={() => { // 결산 화면의 '새 게임': 메뉴를 거치지 않고 바로 설정으로
      flush()
      if (profile) setSlot(null)
      setGame(null)
      setScreen('setup')
    }} />
  )
}

type SheetKind = null | 'finance' | 'cards' | 'people' | 'map' | 'manual' | 'me' | 'jobs'

// 온라인일 때: mine = 이 기기가 맡은 플레이어, host = 방장 기기(AI를 돌림), send = 손님 기기가 행동을 방장에게 보냄
// emote = 내 표정을 다른 기기에 알림, incoming = 다른 사람이 보낸 표정 (id가 바뀔 때마다 띄움)
export interface OnlinePlay {
  mine: number[]; host: boolean; send: (op: Op) => void
  emote?: (player: number, expr: Expr) => void
  incoming?: { player: number; expr: Expr; id: string } | null
  spin?: (player: number) => void // 주사위 굴리기 시작을 다른 기기에 알림 (2026-10-22)
  miniView?: (player: number, v: MiniView) => void // 대회 중 내 장면을 다른 기기에 (2026-10-29)
  miniViews?: Record<number, MiniView> // 다른 기기 사람의 최근 장면
  incomingSpin?: { player: number; id: string } | null // 다른 기기에서 굴리기 시작함
  chat?: ChatMsg[] // 채팅 (2026-10-21)
  sendChat?: (text: string) => boolean
}

// onSpeed: 게임 안 설정에서 AI 속도 바꾸기 (혼자 하기만, 바꾸면 다음 게임에도 그대로 2026-10-22)
export function Play({ game, setGame, speed, onSpeed, saving, onQuit, onNew, online }: { game: GameState; setGame: (g: GameState) => void; speed: Speed; onSpeed?: (v: Speed) => void; saving: boolean; onQuit: () => void; onNew?: () => void; online?: OnlinePlay }) {
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [rolling, setRolling] = useState(false)
  const [menu, setMenu] = useState(false)
  const [leaveAsk, setLeaveAsk] = useState(false) // 뒤로 가기: 게임에서 나갈지 물음
  const [pendingDown, setPendingDown] = useState(false) // 선택 창을 잠깐 내렸는지
  // 위쪽 정보 칸 접기 (폰에서 판을 넓게). 이 기기에 기억
  const [hudMini, setHudMini] = useState(() => { try { return localStorage.getItem('dgl:hudMini') === '1' } catch { return false } })
  // 게임 팁: 내 상황에 맞는 것을 15초마다 바꿔 보여 줌 (설정에서 끄기, 2026-10-31 사용자)
  const [showTips, setShowTips] = useState(tipsOn)
  const [tipTick, setTipTick] = useState(() => Math.floor(Math.random() * 100))
  useEffect(() => { if (!showTips) return; const t = setInterval(() => setTipTick((n) => n + 1), 15000); return () => clearInterval(t) }, [showTips])
  const toggleHud = () => { const v = !hudMini; setHudMini(v); try { localStorage.setItem('dgl:hudMini', v ? '1' : '0') } catch { /* 무시 */ } }
  const [sound, setSound] = useState(soundPrefs())
  const [carMode, setCarMode] = useState(false)
  const [itemMode, setItemMode] = useState<DiceItem | null>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  const act = useCallback((fn: (s: GameState) => void) => {
    const next = structuredClone(gameRef.current)
    next.banner = null
    next.speech = null
    fn(next)
    setGame(next)
  }, [setGame])
  // 플레이어 행동: 손님 기기는 방장에게 보내고, 방장·혼자 하기는 바로 적용
  const run = useCallback((op: Op) => {
    if (online && !online.host) online.send(op)
    else act((s) => applyOp(s, op))
  }, [act, online])
  const isMine = (id: number) => (online ? online.mine.includes(id) : game.players[id].human)
  // 단계 정산 창: 온라인은 각자 닫음 (다른 사람 화면을 닫지 않게)
  // 닫은 것은 탭을 닫기 전까지 기억 (새로고침하면 지난 정산 창이 다시 뜨던 것, 2026-11-23). 판(seed)·단계로 구분
  const summaryKey = `${game.seed}:${game.stageIdx}`
  const [closedSummary, setClosedSummary] = useState<string | null>(() => { try { return sessionStorage.getItem('dgl:closedSummary') } catch { return null } })
  const closeSummary = () => { setClosedSummary(summaryKey); try { sessionStorage.setItem('dgl:closedSummary', summaryKey) } catch { /* 무시 */ } }
  const summaryOpen = !!game.summary && (!online || closedSummary !== summaryKey)

  // ── 주사위 결과 잠깐 보여주기 ──
  const [diceShow, setDiceShow] = useState<{ value: number; second?: number } | null>(null)
  const lastDiceId = useRef(game.dice?.id ?? 0)
  const lastWheel = useRef(game.roulette?.id ?? 0)
  // 온라인: 손님이 멈춘 뒤 방장 결과가 올 때까지, 다른 기기 사람이 굴리는 동안 주사위를 계속 굴림 (2026-10-22: 중간에 안 보이던 것)
  const [awaitDice, setAwaitDice] = useState(false)
  const [remoteRoll, setRemoteRoll] = useState(false)
  useEffect(() => { if (!awaitDice) return; const t = setTimeout(() => setAwaitDice(false), 5000); return () => clearTimeout(t) }, [awaitDice])
  useEffect(() => { if (!remoteRoll) return; const t = setTimeout(() => setRemoteRoll(false), 9000); return () => clearTimeout(t) }, [remoteRoll])
  const spinId = online?.incomingSpin?.id
  useEffect(() => {
    const sp = online?.incomingSpin
    if (sp && !online?.mine.includes(sp.player)) setRemoteRoll(true)
  }, [spinId]) // eslint-disable-line react-hooks/exhaustive-deps
  const diceAt = useRef(0) // 주사위 결과가 나온 시각 (룰렛을 그 뒤에 띄우려고)
  useEffect(() => {
    if (!game.dice || game.dice.id === lastDiceId.current) return
    lastDiceId.current = game.dice.id
    setAwaitDice(false)
    setRemoteRoll(false)
    diceAt.current = Date.now()
    setDiceShow({ value: game.dice.value, second: game.dice.second })
    const land = setTimeout(() => sfx('diceLand'), DICE_THROW_MS * 0.4) // 처음 바닥에 닿을 때
    // 수능처럼 주사위 바로 뒤에 룰렛이 오면 주사위를 1.6초 보여 준 뒤 룰렛 (2026-10-21·22 사용자)
    const wheelNext = !!game.roulette && game.roulette.id !== lastWheel.current
    const t = setTimeout(() => setDiceShow(null), wheelNext ? DICE_BEFORE_WHEEL_MS : DICE_SHOW_MS)
    return () => { clearTimeout(t); clearTimeout(land) }
  }, [game.dice]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 한 칸씩 걷기 ──
  const [walk, setWalk] = useState({ id: game.pathId, idx: Math.max(0, game.path.length - 1) })
  const walkIdx = walk.id === game.pathId ? walk.idx : 0
  const walking = game.path.length > 1 && walkIdx < game.path.length - 1
  useEffect(() => {
    if (walk.id !== game.pathId) setWalk({ id: game.pathId, idx: 0 })
  }, [game.pathId, walk.id])
  useEffect(() => {
    if (!walking || diceShow !== null) return
    const t = setTimeout(() => { sfx('step'); setWalk((w) => ({ ...w, idx: w.idx + 1 })) }, WALK_MS)
    return () => clearTimeout(t)
  }, [walking, walkIdx, diceShow])
  const posOf = (q: GameState['players'][number]) => (walking && q.id === game.pathPlayer ? game.path[walkIdx] : q.pos)

  // ── 칸 사건 팝업: 걷기가 끝난 뒤 보여 주고 2.6초 뒤 저절로 꺼짐 ──
  const [popShow, setPopShow] = useState<GameState['popup']>(null)
  // 사건 장면 (11-28): 사건 창·큰 사건 배너 위에 캐릭터 장면. 장면 코드는 게임 화면에서 따로 불러옴
  const [sceneMod, setSceneMod] = useState<SceneMod | null>(null)
  useEffect(() => { import('./scenes/forGame').then((m) => setSceneMod(m)).catch(() => {}) }, [])
  const scenePlayed = useRef(new Set<string>()) // 같은 사건을 사건 창에서 보여 줬으면 배너에서 또 안 보여 줌
  const sceneSpeed = (pid: number) => (!game.players[pid].human && speed === 'fast' ? 2 : 1) // AI 차례만 게임 빠르기에 맞춤
  const sceneCast = (pid: number) => sceneMod ? sceneMod.castFor(game.players.map((q) => ({ outfit: q.outfit, age: ageOf(game, q) })), pid) : []
  const [rpsReveal, setRpsReveal] = useState<Record<number, number> | null>(null) // 가위바위보 손 공개 중 (아래에서 씀)
  const [suspense, setSuspense] = useState(false) // AI 미니게임 '도전 중…'
  const lastPopId = useRef(game.popup?.id ?? 0)
  // '지난 차례 뒤 일어난 일': 내 칸 사건 창이 닫힌 뒤에 보여 줌 (2026-11-02 사용자). 내 기기에서만
  const newsQ = useRef<NonNullable<GameState['news']>[]>([])
  const lastNewsId = useRef(game.news?.id ?? 0)
  useEffect(() => {
    const n = game.news
    if (n && n.id !== lastNewsId.current) {
      lastNewsId.current = n.id
      if (isMine(n.playerId)) newsQ.current.push({ ...n, id: -n.id }) // 사건 창 번호와 겹치지 않게 음수
    }
    if (popShow || walking || diceShow !== null || !newsQ.current.length) return
    if (game.popup && game.popup.id !== lastPopId.current) return // 칸 사건 창이 먼저 (이 효과가 사건 창 효과보다 먼저 돌아야 함)
    const next = newsQ.current.shift()!
    setPopShow(next)
    sfx(next.tone === 'bad' ? 'bad' : 'pop')
  }, [game.news, game.popup, popShow, walking, diceShow]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!game.popup || game.popup.id === lastPopId.current) return
    lastPopId.current = game.popup.id
    setPopShow(game.popup)
    // AI 미니게임은 도착하자마자 결과를 보여 주지 않고 '도전 중…'을 먼저 잠깐 보여 줌
    const aiMini = !game.players[game.popup.playerId].human && game.popup.art === 'medal' && game.popup.title === '미니게임'
    setSuspense(aiMini)
    if (!aiMini) sfx(game.popup.tone === 'bad' ? 'bad' : game.popup.art === 'money' ? 'coin' : 'pop')
  }, [game.popup, game.players])
  // 사건 창에 맞는 장면 ('지난 차례 뒤 일어난 일'은 모아 보여 주는 글이라 장면 없음). 장면 코드를 늦게 불러와도 뜨게 계산으로
  const popScene = useMemo(() => (popShow && popShow.id > 0 && sceneMod ? sceneMod.pickScene(popShow.text, stageOf(game).id) : null), [popShow, sceneMod]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (popScene && popShow) scenePlayed.current.add(`${game.turn}|${popShow.playerId}|${popScene.entry.scene.id}`) }, [popScene, popShow]) // eslint-disable-line react-hooks/exhaustive-deps
  // 건너뛰기 (11-28 사용자): 장면 주인공이 누르면 모든 기기에서 장면 없이 결과만 (게임 상태 sceneSkip으로 알림)
  const popKey = popShow ? `p:${popShow.id}` : ''
  const popSceneOn = popScene && game.sceneSkip !== popKey ? popScene : null
  const canSkip = (pid: number) => isMine(pid) && game.players[pid].human
  // 가위바위보를 고르거나 손을 보여 주는 동안에는 사건 창을 미뤄 둠 (가려서, 2026-10-31 사용자)
  const rpsOn = game.pending?.type === 'rps' || !!rpsReveal
  const popVisible = !!popShow && !walking && diceShow === null && !rpsOn
  const popBlocks = popShow !== null && !rpsOn // 미뤄 둔 창은 가위바위보 진행을 막지 않음
  useEffect(() => {
    if (!popVisible || !suspense || !popShow) return
    const t = setTimeout(() => { setSuspense(false); sfx(popShow.tone === 'bad' ? 'bad' : 'pop') }, 1500)
    return () => clearTimeout(t)
  }, [popVisible, suspense, popShow])
  // 내 사건은 천천히 보도록 길게 (2026-10-22 친구 피드백 → 10-31 사용자: 눌러서 닫기 대신 5초 뒤 저절로). 다른 사람·AI 것은 짧게
  const popMine = !!popShow && isMine(popShow.playerId) && game.players[popShow.playerId].human
  useEffect(() => {
    if (!popVisible || suspense) return
    const normal = popMine ? MY_POP_MS : popShow && game.players[popShow.playerId].human ? 2600 : 1500 // AI 차례는 짧게
    // 장면이 있으면 장면 길이만큼 (+ 글 읽을 시간)
    const ms = popSceneOn && popShow && sceneMod ? sceneMod.sceneMs(popSceneOn.entry.scene.dur, sceneSpeed(popShow.playerId), popMine, normal) : normal
    const t = setTimeout(() => setPopShow(null), ms)
    return () => clearTimeout(t)
  }, [popVisible, popShow, game.players, suspense, popMine, popSceneOn]) // eslint-disable-line react-hooks/exhaustive-deps
  // 룰렛 연출 (대학 합격·감독 도전)
  const [wheel, setWheel] = useState<GameState['roulette']>(null)
  // 주사위 결과와 같은 순간에 오면, 주사위가 나온 시각부터 재서 기다렸다가 돌림
  // (diceShow 상태로 확인하면 같은 순간엔 아직 null이라 바로 돌아 버렸음, 2026-10-22)
  useEffect(() => {
    if (!game.roulette || game.roulette.id === lastWheel.current) return
    const r = game.roulette
    const t = setTimeout(() => { lastWheel.current = r.id; setWheel(r) }, Math.max(0, diceAt.current + DICE_BEFORE_WHEEL_MS - Date.now()))
    return () => clearTimeout(t)
  }, [game.roulette])
  const wheelWaiting = !!game.roulette && game.roulette.id !== lastWheel.current // 룰렛 차례를 기다리는 중엔 선택 창도 안 띄움
  const closeWheel = useCallback(() => setWheel(null), [])
  // 상점 카테고리
  const [shopCat, setShopCat] = useState<string | null>(null)
  useEffect(() => { setShopCat(null) }, [game.pending])

  // 차례가 넘어가도 방금 움직인 사람을 1.2초 더 보여 줌 (팝업·걷기가 끝난 뒤)
  const [banner, setBanner] = useState(game.banner)
  const [hold, setHold] = useState<number | null>(null)
  const curIdx = game.current
  const prevCur = useRef(curIdx)
  useEffect(() => {
    if (curIdx === prevCur.current) return
    setHold(prevCur.current)
    prevCur.current = curIdx
  }, [curIdx])
  useEffect(() => {
    if (hold === null || walking || diceShow !== null || popBlocks) return
    const t = setTimeout(() => setHold(null), 1200)
    return () => clearTimeout(t)
  }, [hold, walking, diceShow, popBlocks])

  const baseBusy = rolling || awaitDice || remoteRoll || diceShow !== null || walking || popBlocks || hold !== null || summaryOpen || wheel !== null || wheelWaiting
  // 큰 사건 배너(결혼·아기·집·복권·승진·졸업)에 장면: 사건 창에서 이미 보여 줬으면 보통 배너. 장면이 도는 동안은 게임을 멈춤
  const bannerPid = banner ? game.players.filter((q) => banner.text.startsWith(q.name)).sort((a, b) => b.name.length - a.name.length)[0]?.id ?? -1 : -1
  const bScene = banner && sceneMod && bannerPid >= 0 && !banner.title.endsWith('단계') ? sceneMod.pickScene(banner.title, stageOf(game).id) : null
  const bannerKey = banner ? `b:${game.turn}:${banner.title}` : ''
  const bannerScene = bScene && !scenePlayed.current.has(`${game.turn}|${bannerPid}|${bScene.entry.scene.id}`) && game.sceneSkip !== bannerKey && !baseBusy ? bScene : null
  const bannerMine = bannerPid >= 0 && isMine(bannerPid) && game.players[bannerPid].human
  const bannerMs = bannerScene && sceneMod ? sceneMod.sceneMs(bannerScene.entry.scene.dur, sceneSpeed(bannerPid), bannerMine, 2800) : 0
  const busy = baseBusy || !!bannerScene
  const p = cur(game)
  const shown = walking ? game.players[game.pathPlayer] : hold !== null ? game.players[hold] : p
  // 룰렛을 기다리거나 돌리는 동안은 정보 칸도 그 전 모습 그대로 (학자금 대출이 먼저 보여 합격을 미리 알 수 있었음, 2026-10-22)
  const hudHeld = useRef(shown)
  const holdHud = wheel !== null || wheelWaiting
  if (!holdHud) hudHeld.current = shown
  const hudP = holdHud ? hudHeld.current : shown
  const myTurn = isMine(p.id) && canAct(game) && !busy
  const st = stageOf(game)
  useEffect(() => { setBgmStage(st.id) }, [st.id])
  useEffect(() => { void loadMini().catch(() => {}) }, [])

  // ── 단계 끝 대회 (같은 칸 대결 타이밍도 같은 방식) ──
  const contest = game.mini?.contest
  const duelIds = game.mini?.duel?.ids
  const contestTitle = game.mini?.duel?.coop ? '🤝 같은 칸 함께하기' : duelIds ? '⚔️ 같은 칸 대결' : `🏆 ${contestName(game, game.mini?.game ?? '')}`
  const myContestant = contest?.queue.find((i) => isMine(i))
  const [contestStart, setContestStart] = useState<number | null>(null) // 다 같이 시작한 때 (3·2·1 뒤, AI 흉내는 그때부터)
  const contestKey = contest ? `${game.turn}-${contest.seed}` : ''
  const contestGo = !!contest?.go
  useEffect(() => { setContestStart(contestGo ? Date.now() + 3000 : null) }, [contestKey, contestGo])
  // 60초 안에 '준비 완료'를 안 누른 사람이 있으면 저절로 준비 (방장 기기·혼자 하기에서)
  useEffect(() => {
    if (!contestKey || contestGo || (online && !online.host)) return
    const t = setTimeout(() => act((s) => { for (const i of s.mini?.contest?.queue ?? []) contestReady(s, i) }), 60000)
    return () => clearTimeout(t)
  }, [contestKey, contestGo, online, act])
  const watchers = (me: number | null): Watcher[] => {
    if (!contest || !game.mini) return []
    return game.players.filter((q) => q.id !== me && !(me === null && isMine(q.id)) && (!duelIds || duelIds.includes(q.id))).map((q) => ({
      id: q.id, name: q.name, color: q.color, outfit: q.outfit, age: ageOf(game, q),
      kind: !q.human ? 'ai' : isMine(q.id) ? 'local' : 'remote',
      view: online?.miniViews?.[q.id]?.k === contest.seed ? online?.miniViews?.[q.id] : null,
      grade: !q.human || !contest.queue.includes(q.id) ? contest.results[q.id] : undefined,
      ready: !q.human || !!contest.ready?.includes(q.id), go: !!contest.go,
      level: miniLevel(q, game.mini!.game),
    }))
  }

  // ── AI 진행 ──
  useEffect(() => {
    if (game.phase === 'gameover' || busy || (online && !online.host)) return // AI는 방장 기기만 돌림
    const aiPending = game.pending && !game.players[game.pending.playerId].human
    const aiMini = !!game.mini && (game.mini.contest ? game.mini.contest.queue.some((i) => !game.players[i].human) : !game.players[game.mini.playerId].human) // 온라인에서 미니게임 하던 사람이 나감
    const aiTurn = !game.pending && !game.mini && !p.human && game.phase === 'roll'
    if (!aiPending && !aiMini && !aiTurn) return
    const t = setTimeout(() => {
      if (aiTurn) {
        setRolling(true)
        online?.spin?.(p.id) // 방장 기기에서 AI가 굴릴 때도 다른 기기에 보여 줌
        setTimeout(() => { setRolling(false); act(aiStep) }, Math.min(DICE_ROLL_MS, SPEED_MS[speed]))
      } else act(aiStep)
    }, SPEED_MS[speed])
    return () => clearTimeout(t)
  }, [game, busy, p.human, p.id, speed, act, online])

  // ── 말풍선·배너 ──
  const [speech, setSpeech] = useState(game.speech)
  useEffect(() => {
    if (!game.speech) return
    setSpeech(game.speech)
    const t = setTimeout(() => setSpeech(null), 5000)
    return () => clearTimeout(t)
  }, [game.speech])
  useEffect(() => { setPendingDown(false) }, [game.pending?.type, game.pending?.title, game.turn])
  // 단계 카드('중년 단계' 등)가 떠 있는 동안은 선택 창을 띄우지 않음 → 카드가 사라진 뒤에 뜸 (2026-10-22 사용자)
  const pending = busy || banner?.title.endsWith('단계') ? null : game.pending
  useEffect(() => {
    if (!game.banner) return
    setBanner(game.banner)
    const t = game.banner.title
    sfx(t === '결혼!' ? 'bell' : CELEBRATE.includes(t) ? 'fanfare' : t.startsWith('복권') ? 'win' : t === '강제 청산' || t === '집 경매' ? 'bigBad' : t.startsWith('대출') && game.banner.tone === 'bad' ? 'warn' : game.banner.tone === 'bad' ? 'bad' : 'pop')
  }, [game.banner])
  useEffect(() => { if (game.phase === 'gameover') sfx('fanfare') }, [game.phase])
  useEffect(() => {
    if (!bannerMs) return
    const t = setTimeout(() => setBanner(null), bannerMs)
    return () => clearTimeout(t)
  }, [banner, bannerMs])
  useEffect(() => {
    if (!banner || busy) return
    const t = setTimeout(() => setBanner(null), banner.title.endsWith('단계') ? 2000 : banner.title.startsWith('복권') ? 3200 : CELEBRATE.includes(banner.title) ? 2800 : 1800) // 큰 장면은 더 길게
    return () => clearTimeout(t)
  }, [banner, busy])

  useEffect(() => { setCarMode(false); setItemMode(null) }, [game.turn])

  // 내 차례가 되면 가운데에 잠깐 '내 차례!' (2026-10-21 사용자)
  const [turnToast, setTurnToast] = useState(false)
  const toastTurn = useRef(-1)
  const toastable = myTurn && isMine(p.id) && p.human // 다른 사람 차례(관람)에는 안 뜨게
  useEffect(() => {
    if (!toastable || game.phase !== 'roll' || game.pending || toastTurn.current === game.turn) return
    toastTurn.current = game.turn
    setTurnToast(true)
    sfx('myTurn')
    const t = setTimeout(() => setTurnToast(false), 2000)
    return () => clearTimeout(t)
  }, [toastable, game.phase, game.pending, game.turn])

  // ── 같은 칸 가위바위보: 고르는 동안 머리 위 손이 돌다가, 다 고르면 2.8초 공개 ──
  const rps = game.rpsShow
  // 동시에 하는 가위바위보: 아직 안 고른 사람 중 이 기기 사람 (2026-10-29)
  const rpsData = game.pending?.type === 'rps' ? (game.pending.data as { sim?: boolean; queue?: number[] } | undefined) : undefined
  const rpsMine = rpsData?.sim ? rpsData.queue?.find((i) => isMine(i)) : undefined
  useEffect(() => {
    if (!rps?.picks) return
    setRpsReveal(rps.picks)
    const t = setTimeout(() => setRpsReveal(null), 2800)
    return () => clearTimeout(t)
  }, [rps?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const hands: Record<number, number | null> = rps && !rps.picks && game.pending?.type === 'rps'
    ? Object.fromEntries(rps.ids.map((i) => [i, null]))
    : rpsReveal ?? {}

  // ── 표정 말풍선 ──
  const [emotes, setEmotes] = useState<Record<number, Expr>>({})
  const emoteTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  // 사람이 고른 표정은 화면에도 (그 사람이 판에 안 보이거나 창이 판을 가릴 때, 2026-10-24 사용자)
  const [screenEmotes, setScreenEmotes] = useState<Record<number, Expr>>({})
  const showEmote = useCallback((pid: number, expr: Expr, byHand = false) => {
    setEmotes((e) => ({ ...e, [pid]: expr }))
    if (byHand) setScreenEmotes((e) => ({ ...e, [pid]: expr }))
    clearTimeout(emoteTimers.current[pid])
    emoteTimers.current[pid] = setTimeout(() => {
      const drop = (e: Record<number, Expr>) => { const n = { ...e }; delete n[pid]; return n }
      setEmotes(drop)
      setScreenEmotes(drop)
    }, EMOTE_MS)
  }, [])
  useEffect(() => () => Object.values(emoteTimers.current).forEach(clearTimeout), [])
  // AI: 새 기록이 좋은 일·나쁜 일이면 자동으로 (걷기·주사위·칸 사건 창이 끝난 뒤에 띄움)
  const [aiQueue, setAiQueue] = useState<[number, Expr][]>([])
  const seenLog = useRef(game.logCount ?? 0)
  useEffect(() => {
    const count = game.logCount ?? 0
    const fresh = Math.min(count - seenLog.current, game.log.length)
    seenLog.current = count
    if (fresh <= 0) return
    const last = new Map<number, Expr>()
    for (const l of game.log.slice(-fresh)) {
      if (l.playerId === null || game.players[l.playerId].human) continue
      const e = autoEmote(l)
      if (e) last.set(l.playerId, e)
    }
    if (last.size) setAiQueue((q) => [...q, ...last])
  }, [game.logCount, game.log, game.players])
  useEffect(() => {
    if (!aiQueue.length || walking || diceShow !== null || popBlocks) return
    aiQueue.forEach(([pid, e]) => showEmote(pid, e))
    setAiQueue([])
  }, [aiQueue, walking, diceShow, popBlocks, showEmote])
  // 다른 기기에서 온 표정
  const incomingId = online?.incoming?.id
  useEffect(() => {
    const inc = online?.incoming
    if (inc) showEmote(inc.player, inc.expr, true)
  }, [incomingId]) // eslint-disable-line react-hooks/exhaustive-deps
  // 플레이어: 직접 골라서 (온라인은 내 첫 플레이어, 혼자 하기는 지금 차례인 사람 아니면 첫 사람)
  const emoteId = online ? online.mine[0] : p.human ? p.id : game.players.find((q) => q.human)?.id
  const [picker, setPicker] = useState(false)
  const [coolUntil, setCoolUntil] = useState(0)
  const cooling = coolUntil > Date.now()
  useEffect(() => {
    if (!cooling) return
    const t = setTimeout(() => setCoolUntil(0), coolUntil - Date.now())
    return () => clearTimeout(t)
  }, [cooling, coolUntil])
  const pickEmote = (e: Expr) => {
    if (emoteId === undefined || cooling) return
    setPicker(false)
    setCoolUntil(Date.now() + EMOTE_COOLDOWN_MS)
    showEmote(emoteId, e, true)
    online?.emote?.(emoteId, e)
  }

  const onCampus = p.campusTurns > 0 && stageOf(game).tiles[p.pos].kind === 'campus'
  // 주사위: 한 번 누르면 돌고, 한 번 더 누르면 멈춤 (결과는 운. 2026-10-17 사용자)
  const [spinning, setSpinning] = useState(false)
  // 판정 주사위(능력치 + 주사위·수능·커리어): 고르면 바로 굴러가고 '멈추기!'로 멈춤 (2026-10-21 사용자)
  const checkPending = game.pending?.type === 'diceCheck' && isMine(game.pending.playerId) ? game.pending : null
  useEffect(() => {
    if (!checkPending || spinning || walking || diceShow !== null || popBlocks || hold !== null) return
    sfx('dice')
    setRolling(true)
    setSpinning(true)
    online?.spin?.(checkPending.playerId)
  }, [checkPending, walking, diceShow, popBlocks, hold]) // eslint-disable-line react-hooks/exhaustive-deps
  const doRoll = () => {
    if (spinning) {
      setSpinning(false)
      setRolling(false)
      if (online && !online.host) setAwaitDice(true) // 방장 결과가 올 때까지 계속 굴러가게
      if (checkPending) run(['choose', 'roll'])
      else run(['roll', 0, carMode, itemMode])
      return
    }
    if (!myTurn) return
    if (onCampus) { run(['roll', 0, false, null]); return } // 대학교에서는 주사위 대신 대학 생활
    sfx('dice')
    setRolling(true)
    setSpinning(true)
    online?.spin?.(p.id)
  }
  const showCar = myTurn && canUseCar(p) && !onCampus
  const heldItems = myTurn && !onCampus ? [...new Set(diceIn(p))] : []
  const showSeek = myTurn && canSeekJob(game, p)
  const showReunion = myTurn && has(p, 'reunion') && canReunion(game, p)
  const sheetP = !myTurn && online ? game.players[online.mine[0]] : p // 온라인은 내 차례가 아닐 때 내 재테크·카드를 보여 줌
  const stageBanner = banner && !busy && banner.title.endsWith('단계')

  // 화면을 위로 밀어서 주사위 던지기
  const swipeY = useRef<{ y: number; t: number } | null>(null)
  // 설정: 정보 칸 밖 오른쪽 버튼 줄에 (2026-10-21 사용자: 톱니 모양으로)
  const gear = (
    <button className="gear-btn" aria-label="설정" onClick={() => setMenu(true)}>
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M10.3 1.5h3.4l.5 2.6a8 8 0 0 1 1.9.8l2.2-1.5 2.4 2.4-1.5 2.2c.3.6.6 1.2.8 1.9l2.6.5v3.4l-2.6.5a8 8 0 0 1-.8 1.9l1.5 2.2-2.4 2.4-2.2-1.5a8 8 0 0 1-1.9.8l-.5 2.6h-3.4l-.5-2.6a8 8 0 0 1-1.9-.8l-2.2 1.5-2.4-2.4 1.5-2.2a8 8 0 0 1-.8-1.9l-2.6-.5v-3.4l2.6-.5c.2-.7.5-1.3.8-1.9L3.3 5.8l2.4-2.4 2.2 1.5a8 8 0 0 1 1.9-.8zM12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z" /></svg>
      <small>설정</small>
    </button>
  )
  return (
    <div
      className="play"
      onPointerDown={(e) => { unlockAudio(); if ((e.target as HTMLElement).closest('.world')) swipeY.current = { y: e.clientY, t: Date.now() } }}
      onPointerUp={(e) => { const sw = swipeY.current; if (sw && sw.y - e.clientY > 70 && Date.now() - sw.t < 300) doRoll(); swipeY.current = null }}
    >
      <Board s={game} focus={shown} posOf={posOf} walkingId={walking ? game.pathPlayer : null} canPan={myTurn || (pendingDown && !!game.pending && isMine(game.pending.playerId))} emotes={emotes} hands={hands} say={speech} showSteps={myTurn || (!p.human && game.phase === 'roll' && !busy)} />

      <header className={`hud${hudMini ? ' mini' : ''}`}>
        <div className="hud-row">
          <div className="hud-who">
            <span className="hud-face" style={{ borderColor: hudP.color }}><Character outfit={hudP.outfit} size={26} age={ageOf(game, hudP)} crop="head" /></span>
            <div className="jua hud-stage">{st.name} · {ageOf(game, hudP)}세{game.settings.teams && <TeamBadge team={hudP.team} />}</div>
          </div>
          <div className="hud-money"><span aria-label="돈">💰</span><b>{won(hudP.money)}</b>{turnIncome(game, hudP) ? <span className={turnIncome(game, hudP) > 0 ? 'inc-up' : 'inc-down'} title="매 턴 들어오고 나가는 돈"> ({turnIncome(game, hudP) > 0 ? '+' : ''}{won(turnIncome(game, hudP))})</span> : null} · 행복 <b>{hudP.happy}</b></div>
          <div className={`fortune f${hudP.fortune}`} title="운세 (착한 일 ↑, 이기적인 일 ↓)">{fortuneName(hudP.fortune)}</div>
        </div>
        <div className="hud-row">
          <div className="order">
            <span className="muted">
              {hudP.human ? (isMine(hudP.id) ? `${hudP.name} 차례` : `${hudP.name} 차례 · 보는 중`) : `${hudP.name}(AI) 차례 · 보는 중`}
              {st.rolls ? ` · 남은 주사위 ${hudP.rollsLeft}/${st.rolls}` : ' · 골까지 경주'}
            </span>
          </div>
        </div>
        {hudP.loans.length > 0 && <LoanLine p={hudP} />}
        <div className="hud-sub muted">{playerLine(game, hudP)} · <b className="hud-stats">지력 {hudP.stats.int} · 체력 {hudP.stats.str} · 매력 {hudP.stats.cha}</b></div>
        {showTips && !hudMini && (() => {
          const me = game.players.find((q) => q.human && isMine(q.id)) ?? hudP
          const list = tipsFor(game, me)
          return list.length ? <div className="hud-tip" key={tipTick % list.length}>💡 {list[tipTick % list.length]}</div> : null
        })()}
        <button className="hud-fold" aria-label={hudMini ? '정보 펼치기' : '정보 접기'} aria-expanded={!hudMini} onClick={toggleHud}>{hudMini ? '▼' : '▲'}</button>
      </header>

      <div className="side-buttons">
        <button onClick={() => setSheet('map')}>지도</button>
        <button onClick={() => setSheet('people')}>사람들</button>
        <button onClick={() => setSheet('me')}>내 정보</button>
        <button onClick={() => setSheet('jobs')}>직업</button>
        {gear}
        {emoteId !== undefined && (
          <button className="emote-btn" aria-label="표정" disabled={cooling} onClick={() => setPicker(true)}>
            <Character outfit={game.players[emoteId].outfit} age={ageOf(game, game.players[emoteId])} expr="happy" size={44} crop="head" />
          </button>
        )}
      </div>
      {picker && emoteId !== undefined && <EmotePicker outfit={game.players[emoteId].outfit} age={ageOf(game, game.players[emoteId])} onPick={pickEmote} onClose={() => setPicker(false)} />}

      <LogBox game={game} chat={online?.chat} onSend={online?.sendChat} hold={wheel !== null || wheelWaiting} />

      {(showCar || heldItems.length > 0 || showSeek || showReunion) && (
        <div className="roll-mods">
          {showSeek && <button className="car-toggle" onClick={() => run(['seekJob'])}>💼 취업 도전</button>}
          {showReunion && <button className="car-toggle" onClick={() => run(['playReunion'])}>💌 다시 만나기</button>}
          {showCar && (
            <button className={`car-toggle ${carMode ? 'on' : ''}`} aria-pressed={carMode} onClick={() => { setCarMode(!carMode); setItemMode(null) }}>
              {CARS[p.car].name} ±1 {carMode ? '사용함' : '쓰기'} · 남은 {p.carCharges}번
            </button>
          )}
          {heldItems.map((k) => (
            <button key={k} className={`car-toggle ${itemMode === k ? 'on' : ''}`} aria-pressed={itemMode === k} onClick={() => { setItemMode(itemMode === k ? null : k); setCarMode(false) }}>
              {DICE_ITEMS[k].name} {itemMode === k ? '사용함' : '쓰기'}{diceIn(p).filter((x) => x === k).length > 1 ? ` · ${diceIn(p).filter((x) => x === k).length}개` : ''}
            </button>
          ))}
        </div>
      )}

      <div className="controls">
        <button className="mid" onClick={() => setSheet('cards')}>가방{bagOf(p).length ? <em>{bagOf(p).length}</em> : null}</button>
        <button className={`dice-btn${spinning ? ' spinning' : ''}`} disabled={!myTurn && !spinning} onClick={doRoll}>
          {spinning ? <span>멈추기!</span> : onCampus ? <span>대학<br />생활</span> : <span>주사위<br />던지기</span>}
        </button>
        <button className="mid" onClick={() => setSheet('finance')}>재테크</button>
      </div>

      {spinning && checkPending && <div className="check-hint" role="status"><b className="jua">{checkPending.title}</b><span>{checkPending.text}</span></div>}
      {(rolling || awaitDice || remoteRoll || diceShow !== null) && <DiceThrow value={rolling || awaitDice || remoteRoll ? null : diceShow?.value ?? null} second={rolling ? (itemMode === 'twin' ? null : undefined) : diceShow?.second} />}

      {/* 선택 창 잠깐 내리기: 내리면 판을 끌어 보거나 지도를 볼 수 있음 (2026-10-22 친구 피드백) */}
      {pending && pendingDown && (
        <button className="pending-reopen jua" onClick={() => setPendingDown(false)}>▲ {pending.title} · 선택 창 다시 열기</button>
      )}
      {pending && !pendingDown && (
        <div className={`sheet-backdrop${pending.type === 'rps' ? ' see-board' : ''}`}>
          <div className="sheet decision">
            <button className="pending-down" onClick={() => setPendingDown(true)} aria-label="선택 창 잠깐 내리기">▼ 잠깐 내리기</button>
            <EventArt type={pending.type} />
            <h2 className="jua">{pending.title}</h2>
            <p>{pending.text}</p>
            {/* 창이 떠 있어도 표정 보내기 (오른쪽 표정 버튼은 창에 가려서). 내가 고를 때도 (2026-10-24) */}
            {rpsData?.sim && rpsMine !== undefined && <p className="note jua">{game.players[rpsMine].name} 차례: 무엇을 낼까요?</p>}
            {(rpsData?.sim ? rpsMine === undefined || emoteId !== undefined : !isMine(pending.playerId) || emoteId !== undefined) && (
              <div className="note-row">
                {rpsData?.sim
                  ? (rpsMine !== undefined ? <span className="note-spacer" /> : <p className="note">{(rpsData.queue ?? []).map((i) => game.players[i].name).join(', ')}님이 고르는 중…</p>)
                  : isMine(pending.playerId) ? <span className="note-spacer" /> : <p className="note">{game.players[pending.playerId].name}{game.players[pending.playerId].human ? '님이' : '(AI)가'} 고르는 중…</p>}
                {emoteId !== undefined && (
                  <button className="emote-btn-inline" aria-label="표정" disabled={cooling} onClick={() => setPicker(true)}>
                    <Character outfit={game.players[emoteId].outfit} age={ageOf(game, game.players[emoteId])} expr="happy" size={40} crop="head" />
                  </button>
                )}
              </div>
            )}
            {pending.type === 'shop' && !shopCat && (
              <div className="shop-cats">
                {SHOP_CATS.filter((c) => pending.options.some((o) => c.match(o.id))).map((c) => (
                  <button key={c.id} onClick={() => setShopCat(c.id)}><b>{c.icon}</b>{c.name}</button>
                ))}
              </div>
            )}
            {pending.type === 'shop' && shopCat && <button className="ghost-btn" onClick={() => setShopCat(null)}>← 다른 물건 보기</button>}
            <div className="options">
              {pending.options.filter((o) => pending.type !== 'shop' || o.id === 'pass' || (shopCat && SHOP_CATS.find((c) => c.id === shopCat)!.match(o.id))).map((o) => (
                <button key={o.id} disabled={o.disabled || (rpsData?.sim ? rpsMine === undefined : !isMine(pending.playerId))} onClick={() => { sfx('click'); if (rpsData?.sim && rpsMine !== undefined) run(['rpsPick', rpsMine, +o.id]); else run(['choose', o.id]) }}>
                  <b>{o.label}</b>{o.desc && <span>{o.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 화면 표정: 판에서 그 사람이 안 보이거나(다른 사람 차례) 창이 판을 가릴 때 왼쪽에 얼굴·이름 (2026-10-24 사용자) */}
      {(() => {
        const covered = (!!pending && !pendingDown) || summaryOpen || !!wheel
        const list = Object.entries(screenEmotes).map(([k, e]) => [Number(k), e] as const).filter(([pid]) => covered || pid !== shown.id)
        return list.length > 0 && (
          <div className="screen-emotes" aria-live="polite">
            {list.map(([pid, e]) => (
              <div key={`${pid}-${e}`} className="screen-emote">
                <EmoteBubble outfit={game.players[pid].outfit} age={ageOf(game, game.players[pid])} expr={e} size={52} />
                <span className="screen-emote-name jua" style={{ background: game.players[pid].color }}>{game.players[pid].name}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {summaryOpen && !walking && !popShow && <StageSummary s={game} onClose={() => (online ? closeSummary() : act((s) => { s.summary = null }))} />}

      {wheel && <Roulette title={wheel.title} chance={wheel.chance} ok={wheel.ok} who={game.players[wheel.playerId].name} manual={isMine(wheel.playerId) && game.players[wheel.playerId].human} onDone={closeWheel} />}

      {popVisible && popShow && (
        suspense
          ? <EventPopup art={popShow.art} title={popShow.text.match(/^\[(.+?)\]/)?.[1] ?? popShow.title} text="도전 중…" tone="info" who={game.players[popShow.playerId].name} onClose={() => setSuspense(false)} />
          : <EventPopup art={popShow.art} title={popShow.title} text={popShow.text} tone={popShow.tone} who={game.players[popShow.playerId].name}
              hint={popMine ? (popSceneOn && sceneMod ? sceneMod.sceneMs(popSceneOn.entry.scene.dur, 1, true, MY_POP_MS) : MY_POP_MS) : 0} onClose={() => setPopShow(null)}
              onSkip={popSceneOn && canSkip(popShow.playerId) ? () => run(['skipScene', popKey, popShow.playerId]) : undefined}
              scene={popSceneOn && sceneMod ? <sceneMod.ScenePlayer key={popShow.id} scene={popSceneOn.entry.scene} cast={sceneCast(popShow.playerId)} text={popSceneOn.line} speed={sceneSpeed(popShow.playerId)} /> : undefined} />
      )}

      <Suspense fallback={null}>
      {!busy && game.mini && !contest && isMine(game.mini.playerId) && (
        <MiniGame key={`${game.turn}-${game.mini.game}-${game.mini.playerId}`} mini={game.mini} guide={miniGuide(game, game.mini.game, !!game.mini.duel)} practiceLimit={online ? MINI_PRACTICE_LIMIT.online : MINI_PRACTICE_LIMIT.local} outfit={game.players[game.mini.playerId].outfit} age={ageOf(game, game.players[game.mini.playerId])} onFinish={(v) => run(['finishMini', v])} />
      )}
      {!busy && game.mini && !contest && !isMine(game.mini.playerId) && game.players[game.mini.playerId].human && (
        <div className="speech waiting-note" role="status">{game.players[game.mini.playerId].name}님이 미니게임 중…</div>
      )}
      {/* 단계 끝 대회: 모두 동시에, 내 게임은 크게 + 다른 사람 장면은 작게 (2026-10-29) */}
      {!busy && game.mini && contest && myContestant !== undefined && (
        <MiniGame key={`${game.turn}-${game.mini.game}-${myContestant}`} mini={{ ...game.mini, playerId: myContestant, level: miniLevel(game.players[myContestant], game.mini.game) }}
          guide={miniGuide(game, game.mini.game, !!duelIds, !duelIds)} contest={`${contestTitle} · ${game.players[myContestant].name}`}
          practiceLimit={online ? MINI_PRACTICE_LIMIT.online : MINI_PRACTICE_LIMIT.local} outfit={game.players[myContestant].outfit} age={ageOf(game, game.players[myContestant])}
          onView={online?.miniView ? (v) => online.miniView?.(myContestant, { ...v, k: contest.seed }) : undefined}
          ready={{ mine: !!contest.ready?.includes(myContestant), go: !!contest.go, onReady: () => { for (const i of contest.queue) if (isMine(i)) run(['contestReady', i]) } }}
          watch={<MiniWatch game={game.mini.game} people={watchers(myContestant)} startAt={contestStart} seed={contest.seed ?? 1} duel={!!duelIds} />}
          onFinish={(v) => run(['finishMini', v, myContestant])} />
      )}
      {!busy && game.mini && contest && myContestant === undefined && (
        <div className="sheet-backdrop mini-backdrop">
          <div className="mini-wrap has-watch">
            <MiniWatch game={game.mini.game} people={watchers(null)} startAt={contestStart} seed={contest.seed ?? 1} duel={!!duelIds} />
            <div className="sheet mini center">
              <h2 className="jua">{contestTitle}</h2>
              <p>다른 사람이 끝날 때까지 기다리는 중…</p>
            </div>
          </div>
        </div>
      )}
      </Suspense>

      {sheet === 'finance' && (
        <FinanceSheet
          s={game} p={sheetP} canUse={myTurn}
          onLottery={() => run(['buyLottery'])} onCure={() => run(['cureAddiction'])}
          onTrade={(k, q) => run(['tradeStock', k, q])}
          onInsurance={(k) => run(['toggleInsurance', k])}
          onLoan={(a) => run(['takeLoan', a])} onRepay={(a, i) => run(['repayLoans', a, i])}
          onFriendLoan={(id, a, r, t) => { setSheet(null); run(['requestFriendLoan', id, a, r, t]) }}
          onRepayFriend={(i) => run(['repayFriendLoan', i])}
          onDeposit={(a, t) => run(['deposit', a, t])} onWithdraw={() => run(['withdraw', undefined])}
          onGiveTeam={(id, a) => run(['giveTeam', id, a])}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'cards' && (
        <CardsSheet p={sheetP} canUse={myTurn} canMeet={canReunion(game, sheetP)}
          onUseChance={() => { setSheet(null); run(['playChance']) }}
          onReunion={() => { setSheet(null); run(['playReunion']) }}
          onSabotage={(c) => { setSheet(null); run(['startSabotage', c]) }}
          onClose={() => setSheet(null)} />
      )}
      {sheet === 'people' && <PeopleSheet s={game} onClose={() => setSheet(null)} />}
      {sheet === 'me' && <MyInfoSheet s={game} p={game.players[emoteId ?? p.id]} onClose={() => setSheet(null)} />}
      {sheet === 'jobs' && <JobsSheet p={game.players[emoteId ?? p.id]} onClose={() => setSheet(null)} />}
      {sheet === 'map' && <FullMap s={game} meId={online ? (online.mine.includes(p.id) ? p.id : online.mine[0] ?? p.id) : p.human ? p.id : (game.players.find((q) => q.human)?.id ?? p.id)} onClose={() => setSheet(null)} />}
      {sheet === 'manual' && <Manual onClose={() => setSheet(null)} />}


      {turnToast && !banner && <div className="turn-toast jua" role="status">{online || game.players.filter((q) => q.human).length <= 1 ? '내 차례!' : `${p.name} 차례!`}</div>}
      {stageBanner && <StageCard title={banner.title} text={banner.text} />}
      {banner && !busy && !stageBanner && (
        <div className={`banner b-${banner.tone}${banner.title.startsWith('복권') ? ' b-lottery' : ''}`} role="status">
          <BannerArt title={banner.title} tone={banner.tone} />
          <b className="jua">{banner.title}</b>
          <span>{banner.text}</span>
        </div>
      )}
      {banner && bannerScene && sceneMod && (
        <EventPopup art="" title={banner.title} text={banner.text} tone={banner.tone} who="" hint={bannerMine ? bannerMs : 0} onClose={() => setBanner(null)}
          onSkip={canSkip(bannerPid) ? () => run(['skipScene', bannerKey, bannerPid]) : undefined}
          scene={<sceneMod.ScenePlayer key={banner.title + game.turn} scene={bannerScene.entry.scene} cast={sceneCast(bannerPid)} text={bannerScene.line} speed={sceneSpeed(bannerPid)} />} />
      )}
      {banner && (!busy || bannerScene) && CELEBRATE.includes(banner.title) && <Confetti key={banner.title + game.turn} />}

      {/* 왼쪽 위 뒤로 가기: 열린 창이 있으면 닫고, 없으면 게임에서 나갈지 물음 (2026-10-22 사용자) */}
      <BackButton label={sheet || menu || picker ? '닫기' : '게임에서 나가기'} onClick={() => {
        if (picker) setPicker(false)
        else if (sheet) setSheet(null)
        else if (menu) setMenu(false)
        else setLeaveAsk(true)
      }} />
      {leaveAsk && (
        <div className="sheet-backdrop" onClick={() => setLeaveAsk(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="jua">게임에서 나갈까요?</h2>
            <p className="muted">{online ? '같은 방 코드로 다시 들어오면 이어서 해요.' : saving ? '게임은 저장돼요. 메뉴의 이어 하기로 돌아올 수 있어요.' : '손님 모드라 저장되지 않아요.'}</p>
            <button className="wide" onClick={() => setLeaveAsk(false)}>계속하기</button>
            <button className="wide secondary" onClick={onQuit}>메뉴로 나가기</button>
          </div>
        </div>
      )}
      {menu && (
        <div className="sheet-backdrop" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="jua">설정</h2>
            <p className="muted">{online ? '온라인 게임은 방에 저장돼요. 같은 방 코드로 다시 들어오면 이어져요.' : saving ? '게임은 자동 저장돼요. 메뉴에서 이어 할 수 있어요.' : '손님 모드라 저장되지 않아요.'}</p>
            <div className="sound-row">
              <button className={sound.sfx ? 'on' : ''} aria-pressed={sound.sfx} onClick={() => { setSoundPrefs({ sfx: !sound.sfx }); setSound(soundPrefs()); sfx('click') }}>🔊 효과음 {sound.sfx ? '켜짐' : '꺼짐'}</button>
              <button className={sound.bgm ? 'on' : ''} aria-pressed={sound.bgm} onClick={() => { unlockAudio(); setSoundPrefs({ bgm: !sound.bgm }); setSound(soundPrefs()) }}>🎵 배경음 {sound.bgm ? '켜짐' : '꺼짐'}</button>
              <button className={showTips ? 'on' : ''} aria-pressed={showTips} onClick={() => { setTipsOn(!showTips); setShowTips(!showTips); sfx('click') }}>💡 게임 팁 {showTips ? '켜짐' : '꺼짐'}</button>
            </div>
            {onSpeed && game.players.some((q) => !q.human) && (
              <div className="speed-row">
                <span>AI 속도</span>
                <div className="seg">
                  {([['fast', '빠르게'], ['normal', '보통'], ['slow', '천천히']] as const).map(([k, l]) => (
                    <button key={k} className={speed === k ? 'on' : ''} aria-pressed={speed === k} onClick={() => onSpeed(k)}>{l}</button>
                  ))}
                </div>
              </div>
            )}
            <label className="sound-vol">
              <span>소리 크기 {Math.round(sound.vol * 100)}</span>
              <input type="range" min={0} max={100} step={5} value={Math.round(sound.vol * 100)} aria-label="소리 크기"
                onChange={(e) => { setSoundPrefs({ vol: +e.target.value / 100 }); setSound(soundPrefs()) }}
                onPointerUp={() => sfx('pop')} onKeyUp={() => sfx('pop')} />
            </label>
            <button className="wide" onClick={() => setMenu(false)}>계속하기</button>
            <button className="wide secondary" onClick={() => { setMenu(false); setSheet('manual') }}>게임 설명서</button>
            <button className="wide secondary" onClick={onQuit}>메뉴로 나가기</button>
          </div>
        </div>
      )}

      {game.phase === 'gameover' && !busy && <GameOver s={game} onMenu={onQuit} onNew={onNew} />}
    </div>
  )
}
