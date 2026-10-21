import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { Character, type Expr } from './art/Character'
import { aiStep } from './engine/ai'
import { CARS, DICE_ITEMS, MINI_PRACTICE_LIMIT } from './engine/data'
import {
  ageOf, turnIncome, moodLevel, MOOD_FACES, MOOD_HELP, MOOD_NAMES, canAct, canUseCar, createGame, cur, fortuneName, miniGuide, canSeekJob, stageOf,
} from './engine/game'
import { applyOp, type Op } from './engine/ops'
import { DEFAULT_OUTFIT, type Outfit } from './engine/outfit'
import type { DiceItem, GameState } from './engine/types'
import { deleteLocalGame, dropOldProfiles, lastAccount, lastWhere, makeSlot, rememberAccount, rememberWhere, saveLocalGame, savedSpeed, saveSpeed, type Profile, type SaveSlot } from './storage'
import type { Me } from './online/client'
import { BannerArt, EventArt, EventPopup, Roulette } from './art/More'
import { setSoundPrefs, sfx, soundPrefs, unlockAudio } from './sound'
import { Board, FullMap } from './ui/Board'
import { Dresser } from './ui/Dresser'
import { autoEmote, EMOTE_COOLDOWN_MS, EMOTE_MS, EmotePicker } from './ui/Emotes'
import { Confetti, DiceThrow, StageCard } from './ui/Effects'
import { Manual } from './ui/Manual'
import { MiniGame } from './ui/MiniGames'
import { Frame, MenuScreen, SetupScreen, TitleScreen, type Speed } from './ui/Screens'
import { CardsSheet, FinanceSheet, GameOver, MyInfoSheet, PeopleSheet, playerLine, StageSummary, won } from './ui/Sheets'

// 온라인 화면(AWS 연결 포함)은 '온라인으로 하기'를 눌렀을 때만 내려받음 (혼자 하기는 가볍게)
const Online = lazy(() => import('./online/Online').then((m) => ({ default: m.Online })))
// 로그인 화면과 계정 저장도 AWS 코드라 필요할 때만
const AuthScreen = lazy(() => import('./account/AuthScreen'))
const AccountSheet = lazy(() => import('./account/AccountSheet'))
const AdminScreen = lazy(() => import('./account/AdminScreen'))
const account = () => import('./account/api')

const SPEED_MS: Record<Speed, number> = { fast: 450, normal: 1000, slow: 1700 }
const WALK_MS = 230
const DICE_ROLL_MS = 750
const DICE_SHOW_MS = 650
// 상점 카테고리 (물건 id로 나눔)
const SHOP_CATS = [
  { id: 'home', icon: '🏠', name: '집·차', match: (id: string) => id.startsWith('house') || id.startsWith('mortgage') || id.startsWith('car') },
  { id: 'love', icon: '💕', name: '연애', match: (id: string) => id.startsWith('agency') },
  { id: 'pet', icon: '🐶', name: '반려동물', match: (id: string) => id === 'pet' },
  { id: 'item', icon: '🎲', name: '카드·주사위', match: (id: string) => id === 'chance' || id.startsWith('dice_') },
  { id: 'loan', icon: '💳', name: '은행 대출', match: (id: string) => id.startsWith('loan') },
]
const CELEBRATE = ['결혼!', '복권 1등!', '복권 2등!', '아기 탄생', '수능 상위권!', '게임 끝!', '회사 성장!', '감독 도전 성공!', '자녀 대성공!', '금메달!', '은메달!', '동메달!', '육순 잔치', '칠순 잔치']

type Screen = 'title' | 'auth' | 'menu' | 'setup' | 'play' | 'online' | 'admin'
const CLOUD_SAVE_MS = 8000 // 계정 저장은 많아야 8초에 한 번 (이 기기에는 매번)

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [slot, setSlot] = useState<SaveSlot | null>(null) // 이어 하기
  const [screen, setScreen] = useState<Screen>(() => (lastAccount() ? 'menu' : 'title'))
  const [booting, setBooting] = useState(() => !!lastAccount())
  const [authMode, setAuthMode] = useState<'login' | 'join'>('login')
  const [afterAuth, setAfterAuth] = useState<Screen>('menu')
  const [notice, setNotice] = useState('')
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
  }, [])

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
          onNew={() => {
            if (profile) { deleteLocalGame(profile.loginId); pending.current = null; flush(); setSlot(null) }
            setScreen('setup')
          }}
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
          setSpeed(o.speed)
          saveSpeed(o.speed)
          setGame(createGame({
            humanName: o.name, humanNames: o.names, humans: o.humans, aiCount: o.ai, outfits: [o.outfit],
            settings: { startAdult: false, difficulty: o.difficulty },
          }))
          setScreen('play')
        }}
      />
    )
  }
  return (
    <Play game={game} setGame={setGame} speed={speed} saving={!!profile} onQuit={() => {
      flush()
      if (profile) setSlot(game.phase === 'gameover' ? null : makeSlot(game))
      setGame(null)
      setScreen('menu')
    }} />
  )
}

type SheetKind = null | 'finance' | 'cards' | 'people' | 'map' | 'manual' | 'me'

// 온라인일 때: mine = 이 기기가 맡은 플레이어, host = 방장 기기(AI를 돌림), send = 손님 기기가 행동을 방장에게 보냄
// emote = 내 표정을 다른 기기에 알림, incoming = 다른 사람이 보낸 표정 (id가 바뀔 때마다 띄움)
export interface OnlinePlay {
  mine: number[]; host: boolean; send: (op: Op) => void
  emote?: (player: number, expr: Expr) => void
  incoming?: { player: number; expr: Expr; id: string } | null
}

export function Play({ game, setGame, speed, saving, onQuit, online }: { game: GameState; setGame: (g: GameState) => void; speed: Speed; saving: boolean; onQuit: () => void; online?: OnlinePlay }) {
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [rolling, setRolling] = useState(false)
  const [menu, setMenu] = useState(false)
  // 위쪽 정보 칸 접기 (폰에서 판을 넓게). 이 기기에 기억
  const [hudMini, setHudMini] = useState(() => { try { return localStorage.getItem('dgl:hudMini') === '1' } catch { return false } })
  const [logOpen, setLogOpen] = useState(() => { try { return localStorage.getItem('dgl:logOpen') === '1' } catch { return false } })
  const toggleLog = () => { const v = !logOpen; setLogOpen(v); try { localStorage.setItem('dgl:logOpen', v ? '1' : '0') } catch { /* 무시 */ } }
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
  const [closedSummary, setClosedSummary] = useState<number | null>(null)
  const summaryOpen = !!game.summary && (!online || closedSummary !== game.stageIdx)

  // ── 주사위 결과 잠깐 보여주기 ──
  const [diceShow, setDiceShow] = useState<{ value: number; second?: number } | null>(null)
  const lastDiceId = useRef(game.dice?.id ?? 0)
  useEffect(() => {
    if (!game.dice || game.dice.id === lastDiceId.current) return
    lastDiceId.current = game.dice.id
    setDiceShow({ value: game.dice.value, second: game.dice.second })
    const t = setTimeout(() => setDiceShow(null), DICE_SHOW_MS)
    return () => clearTimeout(t)
  }, [game.dice])

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
  const [suspense, setSuspense] = useState(false) // AI 미니게임 '도전 중…'
  const lastPopId = useRef(game.popup?.id ?? 0)
  useEffect(() => {
    if (!game.popup || game.popup.id === lastPopId.current) return
    lastPopId.current = game.popup.id
    setPopShow(game.popup)
    // AI 미니게임은 도착하자마자 결과를 보여 주지 않고 '도전 중…'을 먼저 잠깐 보여 줌
    const aiMini = !game.players[game.popup.playerId].human && game.popup.art === 'medal' && game.popup.title === '미니게임'
    setSuspense(aiMini)
    if (!aiMini) sfx(game.popup.tone === 'bad' ? 'bad' : game.popup.art === 'money' ? 'coin' : 'pop')
  }, [game.popup, game.players])
  const popVisible = !!popShow && !walking && diceShow === null
  useEffect(() => {
    if (!popVisible || !suspense || !popShow) return
    const t = setTimeout(() => { setSuspense(false); sfx(popShow.tone === 'bad' ? 'bad' : 'pop') }, 1500)
    return () => clearTimeout(t)
  }, [popVisible, suspense, popShow])
  useEffect(() => {
    if (!popVisible || suspense) return
    const ms = popShow && game.players[popShow.playerId].human ? 2600 : 1500 // AI 차례는 짧게
    const t = setTimeout(() => setPopShow(null), ms)
    return () => clearTimeout(t)
  }, [popVisible, popShow, game.players, suspense])
  // 룰렛 연출 (대학 합격·감독 도전)
  const [wheel, setWheel] = useState<GameState['roulette']>(null)
  const lastWheel = useRef(game.roulette?.id ?? 0)
  useEffect(() => {
    if (!game.roulette || game.roulette.id === lastWheel.current) return
    lastWheel.current = game.roulette.id
    setWheel(game.roulette)
  }, [game.roulette])
  const closeWheel = useCallback(() => setWheel(null), [])
  // 상점 카테고리
  const [shopCat, setShopCat] = useState<string | null>(null)
  useEffect(() => { setShopCat(null) }, [game.pending])

  // 차례가 넘어가도 방금 움직인 사람을 1.2초 더 보여 줌 (팝업·걷기가 끝난 뒤)
  const [hold, setHold] = useState<number | null>(null)
  const prevCur = useRef(game.current)
  useEffect(() => {
    if (game.current === prevCur.current) return
    setHold(prevCur.current)
    prevCur.current = game.current
  }, [game.current])
  useEffect(() => {
    if (hold === null || walking || diceShow !== null || popShow !== null) return
    const t = setTimeout(() => setHold(null), 1200)
    return () => clearTimeout(t)
  }, [hold, walking, diceShow, popShow])

  const busy = rolling || diceShow !== null || walking || popShow !== null || hold !== null || summaryOpen || wheel !== null
  const p = cur(game)
  const shown = walking ? game.players[game.pathPlayer] : hold !== null ? game.players[hold] : p
  const pending = busy ? null : game.pending
  const myTurn = isMine(p.id) && canAct(game) && !busy
  const st = stageOf(game)

  // ── AI 진행 ──
  useEffect(() => {
    if (game.phase === 'gameover' || busy || (online && !online.host)) return // AI는 방장 기기만 돌림
    const aiPending = game.pending && !game.players[game.pending.playerId].human
    const aiTurn = !game.pending && !game.mini && !p.human && game.phase === 'roll'
    if (!aiPending && !aiTurn) return
    const t = setTimeout(() => {
      if (aiTurn) {
        setRolling(true)
        setTimeout(() => { setRolling(false); act(aiStep) }, Math.min(DICE_ROLL_MS, SPEED_MS[speed]))
      } else act(aiStep)
    }, SPEED_MS[speed])
    return () => clearTimeout(t)
  }, [game, busy, p.human, speed, act, online])

  // ── 말풍선·배너 ──
  const [speech, setSpeech] = useState(game.speech)
  useEffect(() => {
    if (!game.speech) return
    setSpeech(game.speech)
    const t = setTimeout(() => setSpeech(null), 5000)
    return () => clearTimeout(t)
  }, [game.speech])
  const [banner, setBanner] = useState(game.banner)
  useEffect(() => {
    if (!game.banner) return
    setBanner(game.banner)
    sfx(CELEBRATE.includes(game.banner.title) ? 'fanfare' : game.banner.title.startsWith('복권') ? 'win' : game.banner.tone === 'bad' ? 'bad' : 'pop')
  }, [game.banner])
  useEffect(() => { if (game.phase === 'gameover') sfx('fanfare') }, [game.phase])
  useEffect(() => {
    if (!banner || busy) return
    const t = setTimeout(() => setBanner(null), banner.title.endsWith('단계') ? 2000 : banner.title.startsWith('복권') ? 3200 : CELEBRATE.includes(banner.title) ? 2800 : 1800) // 큰 장면은 더 길게
    return () => clearTimeout(t)
  }, [banner, busy])

  useEffect(() => { setCarMode(false); setItemMode(null) }, [game.turn])

  // ── 같은 칸 가위바위보: 고르는 동안 머리 위 손이 돌다가, 다 고르면 2.8초 공개 ──
  const rps = game.rpsShow
  const [rpsReveal, setRpsReveal] = useState<Record<number, number> | null>(null)
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
  const showEmote = useCallback((pid: number, expr: Expr) => {
    setEmotes((e) => ({ ...e, [pid]: expr }))
    clearTimeout(emoteTimers.current[pid])
    emoteTimers.current[pid] = setTimeout(() => setEmotes((e) => { const n = { ...e }; delete n[pid]; return n }), EMOTE_MS)
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
    if (!aiQueue.length || walking || diceShow !== null || popShow !== null) return
    aiQueue.forEach(([pid, e]) => showEmote(pid, e))
    setAiQueue([])
  }, [aiQueue, walking, diceShow, popShow, showEmote])
  // AI: 차례가 오면 기쁘거나 우울할 때 표정 (자주 뜨지 않게 반만)
  useEffect(() => {
    const q = game.players[game.current]
    if (q.human || Math.random() < 0.5) return
    const lv = moodLevel(q)
    if (lv === 2) showEmote(q.id, 'happy')
    else if (lv === 0) showEmote(q.id, 'sad')
  }, [game.current]) // eslint-disable-line react-hooks/exhaustive-deps
  // 다른 기기에서 온 표정
  const incomingId = online?.incoming?.id
  useEffect(() => {
    const inc = online?.incoming
    if (inc) showEmote(inc.player, inc.expr)
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
    showEmote(emoteId, e)
    online?.emote?.(emoteId, e)
  }

  const onCampus = p.campusTurns > 0 && stageOf(game).tiles[p.pos].kind === 'campus'
  // 주사위: 한 번 누르면 돌고, 한 번 더 누르면 멈춤 (결과는 운. 2026-10-17 사용자)
  const [spinning, setSpinning] = useState(false)
  // 판정 주사위(능력치 + 주사위·수능·커리어): 고르면 바로 굴러가고 '멈추기!'로 멈춤 (2026-10-21 사용자)
  const checkPending = game.pending?.type === 'diceCheck' && isMine(game.pending.playerId) ? game.pending : null
  useEffect(() => {
    if (!checkPending || spinning || walking || diceShow !== null || popShow !== null || hold !== null) return
    sfx('dice')
    setRolling(true)
    setSpinning(true)
  }, [checkPending, walking, diceShow, popShow, hold]) // eslint-disable-line react-hooks/exhaustive-deps
  const doRoll = () => {
    if (spinning) {
      setSpinning(false)
      setRolling(false)
      if (checkPending) run(['choose', 'roll'])
      else run(['roll', 0, carMode, itemMode])
      return
    }
    if (!myTurn) return
    if (onCampus) { run(['roll', 0, false, null]); return } // 대학교에서는 주사위 대신 대학 생활
    sfx('dice')
    setRolling(true)
    setSpinning(true)
  }
  const showCar = myTurn && canUseCar(p) && !onCampus
  const heldItems = myTurn && !onCampus ? [...new Set(p.diceItems)] : []
  const showSeek = myTurn && canSeekJob(game, p)
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
      <Board s={game} focus={shown} posOf={posOf} walkingId={walking ? game.pathPlayer : null} canPan={myTurn} emotes={emotes} hands={hands} say={speech} showSteps={myTurn || (!p.human && game.phase === 'roll' && !busy)} />

      <header className={`hud${hudMini ? ' mini' : ''}`}>
        <div className="hud-row">
          <div className="hud-who">
            <span className="hud-face" style={{ borderColor: shown.color }}><Character outfit={shown.outfit} size={22} age={ageOf(game, shown)} /></span>
            <div className="jua hud-stage">{st.name} · {ageOf(game, shown)}세</div>
          </div>
          <div className="hud-money"><span aria-label="돈">💰</span><b>{won(shown.money)}</b>{turnIncome(game, shown) ? <span className={turnIncome(game, shown) > 0 ? 'inc-up' : 'inc-down'} title="매 턴 들어오고 나가는 돈"> ({turnIncome(game, shown) > 0 ? '+' : ''}{won(turnIncome(game, shown))})</span> : null} · 행복 <b>{shown.happy}</b></div>
          <div className={`fortune f${shown.fortune}`} title="운세 (착한 일 ↑, 이기적인 일 ↓)">{fortuneName(shown.fortune)}</div>
        </div>
        <div className="hud-row">
          <div className="order">
            {game.players.map((q) => <i key={q.id} className={q.id === shown.id ? 'now' : ''} style={{ background: q.color }} title={q.name} />)}
            <span className="muted">
              {shown.human ? `${shown.name} 차례` : `${shown.name}(AI) 차례 · 보는 중`}
              {st.rolls ? ` · 남은 주사위 ${shown.rollsLeft}/${st.rolls}` : ' · 골까지 경주'}
            </span>
          </div>
          <span className="hud-mood">기분 <span className="mood" title={`기분 ${MOOD_NAMES[moodLevel(shown)]}: ${MOOD_HELP[moodLevel(shown)]}`} aria-label={`기분 ${MOOD_NAMES[moodLevel(shown)]}`}>{MOOD_FACES[moodLevel(shown)]}</span></span>
        </div>
        <div className="hud-sub muted">{playerLine(game, shown)} · <b className="hud-stats">지력 {shown.stats.int} · 체력 {shown.stats.str} · 매력 {shown.stats.cha}</b></div>
        <button className="hud-fold" aria-label={hudMini ? '정보 펼치기' : '정보 접기'} aria-expanded={!hudMini} onClick={toggleHud}>{hudMini ? '▼' : '▲'}</button>
      </header>

      <div className="side-buttons">
        <button onClick={() => setSheet('map')}>지도</button>
        <button onClick={() => setSheet('people')}>사람들</button>
        <button onClick={() => setSheet('me')}>내 정보</button>
        {gear}
        {emoteId !== undefined && (
          <button className="emote-btn" aria-label="표정" disabled={cooling} onClick={() => setPicker(true)}>
            <Character outfit={game.players[emoteId].outfit} age={ageOf(game, game.players[emoteId])} expr="happy" size={44} crop="head" />
          </button>
        )}
      </div>
      {picker && emoteId !== undefined && <EmotePicker outfit={game.players[emoteId].outfit} age={ageOf(game, game.players[emoteId])} onPick={pickEmote} onClose={() => setPicker(false)} />}

      {/* 기록 창: 늘 보이고, 누르면 1줄 ↔ 5줄 (2026-10-21 사용자) */}
      <button className={`ticker${logOpen ? ' open' : ''}`} onClick={toggleLog} aria-label={logOpen ? '기록 줄이기' : '기록 크게 보기'}>
        {(logOpen ? game.log.slice(-5) : game.log.slice(-1)).map((l, i, arr) => (
          <div key={game.log.length - arr.length + i} className={`log-${l.tone}`}>
            {l.playerId !== null && <b style={{ color: game.players[l.playerId].color }}>{game.players[l.playerId].name} </b>}{l.text}
          </div>
        ))}
        <span className="ticker-toggle" aria-hidden="true">{logOpen ? '▼' : '▲'}</span>
      </button>

      {(showCar || heldItems.length > 0 || showSeek) && (
        <div className="roll-mods">
          {showSeek && <button className="car-toggle" onClick={() => run(['seekJob'])}>💼 취업 도전</button>}
          {showCar && (
            <button className={`car-toggle ${carMode ? 'on' : ''}`} aria-pressed={carMode} onClick={() => { setCarMode(!carMode); setItemMode(null) }}>
              {CARS[p.car].name} ±1 {carMode ? '사용함' : '쓰기'} · 남은 {p.carCharges}번
            </button>
          )}
          {heldItems.map((k) => (
            <button key={k} className={`car-toggle ${itemMode === k ? 'on' : ''}`} aria-pressed={itemMode === k} onClick={() => { setItemMode(itemMode === k ? null : k); setCarMode(false) }}>
              {DICE_ITEMS[k].name} {itemMode === k ? '사용함' : '쓰기'}{p.diceItems.filter((x) => x === k).length > 1 ? ' · 2개' : ''}
            </button>
          ))}
        </div>
      )}

      <div className="controls">
        <button className="mid" onClick={() => setSheet('cards')}>카드{(p.chance || p.sabotage) ? <em>{(p.chance ? 1 : 0) + (p.sabotage ? 1 : 0)}</em> : null}</button>
        <button className={`dice-btn${spinning ? ' spinning' : ''}`} disabled={!myTurn && !spinning} onClick={doRoll}>
          {spinning ? <span>멈추기!</span> : onCampus ? <span>대학<br />생활</span> : <span>주사위<br />던지기</span>}
        </button>
        <button className="mid" onClick={() => setSheet('finance')}>재테크</button>
      </div>

      {spinning && checkPending && <div className="check-hint" role="status"><b className="jua">{checkPending.title}</b><span>{checkPending.text}</span></div>}
      {(rolling || diceShow !== null) && <DiceThrow value={rolling ? null : diceShow?.value ?? null} second={rolling ? (itemMode === 'twin' ? null : undefined) : diceShow?.second} />}

      {pending && (
        <div className={`sheet-backdrop${pending.type === 'rps' ? ' see-board' : ''}`}>
          <div className="sheet decision">
            <EventArt type={pending.type} />
            <h2 className="jua">{pending.title}</h2>
            <p>{pending.text}</p>
            {!isMine(pending.playerId) && (
              <div className="note-row">
                <p className="note">{game.players[pending.playerId].name}{game.players[pending.playerId].human ? '님' : '(AI)'}이 고르는 중…</p>
                {/* 기다리는 동안에도 표정 보내기 (오른쪽 표정 버튼은 결정 창에 가려서) */}
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
                <button key={o.id} disabled={o.disabled || !isMine(pending.playerId)} onClick={() => { sfx('click'); run(['choose', o.id]) }}>
                  <b>{o.label}</b>{o.desc && <span>{o.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {summaryOpen && !walking && <StageSummary s={game} onClose={() => (online ? setClosedSummary(game.stageIdx) : act((s) => { s.summary = null }))} />}

      {wheel && <Roulette title={wheel.title} chance={wheel.chance} ok={wheel.ok} who={game.players[wheel.playerId].name} onDone={closeWheel} />}

      {popVisible && popShow && (
        suspense
          ? <EventPopup art={popShow.art} title={popShow.text.match(/^\[(.+?)\]/)?.[1] ?? popShow.title} text="도전 중…" tone="info" who={game.players[popShow.playerId].name} onClose={() => setSuspense(false)} />
          : <EventPopup art={popShow.art} title={popShow.title} text={popShow.text} tone={popShow.tone} who={game.players[popShow.playerId].name} onClose={() => setPopShow(null)} />
      )}

      {!busy && game.mini && isMine(game.mini.playerId) && (
        <MiniGame key={`${game.turn}-${game.mini.game}`} mini={game.mini} guide={miniGuide(game, game.mini.game, !!game.mini.duel)} practiceLimit={online ? MINI_PRACTICE_LIMIT.online : MINI_PRACTICE_LIMIT.local} outfit={game.players[game.mini.playerId].outfit} onFinish={(v) => run(['finishMini', v])} />
      )}
      {!busy && game.mini && !isMine(game.mini.playerId) && game.players[game.mini.playerId].human && (
        <div className="speech waiting-note" role="status">{game.players[game.mini.playerId].name}님이 미니게임 중…</div>
      )}

      {sheet === 'finance' && (
        <FinanceSheet
          s={game} p={sheetP} canUse={myTurn}
          onLottery={() => run(['buyLottery'])} onCure={() => run(['cureAddiction'])}
          onTrade={(k, q) => run(['tradeStock', k, q])}
          onInsurance={(k) => run(['toggleInsurance', k])}
          onLoan={(a) => run(['takeLoan', a])} onRepay={(a) => run(['repayLoans', a])}
          onFriendLoan={(id, a, r, t) => { setSheet(null); run(['requestFriendLoan', id, a, r, t]) }}
          onRepayFriend={(i) => run(['repayFriendLoan', i])}
          onDeposit={(a) => run(['deposit', a])} onWithdraw={(a) => run(['withdraw', a])}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'cards' && (
        <CardsSheet p={sheetP} canUse={myTurn}
          onUseChance={() => { setSheet(null); run(['playChance']) }}
          onSabotage={() => { setSheet(null); run(['startSabotage']) }}
          onClose={() => setSheet(null)} />
      )}
      {sheet === 'people' && <PeopleSheet s={game} onClose={() => setSheet(null)} />}
      {sheet === 'me' && <MyInfoSheet s={game} p={game.players[emoteId ?? p.id]} onClose={() => setSheet(null)} />}
      {sheet === 'map' && <FullMap s={game} onClose={() => setSheet(null)} />}
      {sheet === 'manual' && <Manual onClose={() => setSheet(null)} />}


      {stageBanner && <StageCard title={banner.title} text={banner.text} />}
      {banner && !busy && !stageBanner && (
        <div className={`banner b-${banner.tone}${banner.title.startsWith('복권') ? ' b-lottery' : ''}`} role="status">
          <BannerArt title={banner.title} tone={banner.tone} />
          <b className="jua">{banner.title}</b>
          <span>{banner.text}</span>
        </div>
      )}
      {banner && !busy && CELEBRATE.includes(banner.title) && <Confetti key={banner.title + game.turn} />}

      {menu && (
        <div className="sheet-backdrop" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="jua">설정</h2>
            <p className="muted">{online ? '온라인 게임은 방에 저장돼요. 같은 방 코드로 다시 들어오면 이어져요.' : saving ? '게임은 자동 저장돼요. 메뉴에서 이어 할 수 있어요.' : '손님 모드라 저장되지 않아요.'}</p>
            <div className="sound-row">
              <button className={sound.sfx ? 'on' : ''} aria-pressed={sound.sfx} onClick={() => { setSoundPrefs({ sfx: !sound.sfx }); setSound(soundPrefs()); sfx('click') }}>🔊 효과음 {sound.sfx ? '켜짐' : '꺼짐'}</button>
              <button className={sound.bgm ? 'on' : ''} aria-pressed={sound.bgm} onClick={() => { unlockAudio(); setSoundPrefs({ bgm: !sound.bgm }); setSound(soundPrefs()) }}>🎵 배경음 {sound.bgm ? '켜짐' : '꺼짐'}</button>
            </div>
            <button className="wide" onClick={() => setMenu(false)}>계속하기</button>
            <button className="wide secondary" onClick={() => { setMenu(false); setSheet('manual') }}>게임 설명서</button>
            <button className="wide secondary" onClick={onQuit}>메뉴로 나가기</button>
          </div>
        </div>
      )}

      {game.phase === 'gameover' && !busy && <GameOver s={game} onRestart={onQuit} />}
    </div>
  )
}
