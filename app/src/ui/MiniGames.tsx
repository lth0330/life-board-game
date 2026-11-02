import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MINI_NAMES } from '../engine/game'
import { sfx } from '../sound'
import { EventArt, Landmark } from '../art/More'
import type { MiniState } from '../engine/types'
import { Character, type Pose } from '../art/Character'
import { DEFAULT_OUTFIT, type Outfit } from '../engine/outfit'
import { Cup, DieFace, MiniIcon, PlayingCard } from '../art/MiniArt'
import type { MiniView } from './miniView'
import { ThemeArt, type ThemeArtKind } from '../art/Scenery'

// 미니게임 화면. 결과: 0 실패, 1 성공, 2 대성공 (대결 timing은 0~100점)
// level 0 쉬움 ~ 2 어려움 (능력치가 높을수록 쉬움)
// 2026-10-21 난이도 한 단계쯤 올림 (실력 게임만, 운·지식 게임은 그대로)

interface Props {
  mini: MiniState
  onFinish: (value: number) => void
  guide: { stat: string; reward: string } // 설명서: 무엇이 쉽게 해 주나, 보상
  practiceLimit: number // 연습 횟수 (혼자 무제한, 온라인 3번)
  outfit?: Outfit // 이 미니게임을 하는 사람 옷차림 (춤 동작·달리기·공 던지기 그림)
  age?: number
  contest?: string // 단계 끝 대회 이름 · 하는 사람
  onView?: (v: MiniView) => void // 하는 장면을 다른 사람에게 보여 주기 (대회, 2026-10-29)
  // 대회: '준비 완료'를 누르고, 모두 준비되면(go) 3·2·1 뒤 다 같이 시작 (2026-10-29 사용자)
  ready?: { mine: boolean; go: boolean; onReady: () => void }
  watch?: ReactNode // 다른 사람 장면 칸
}

type Report = (v: Omit<MiniView, 'phase' | 'practice'>) => void


// 설명서: 게임 방법
const HOW: Record<string, string> = {
  race: '5초 동안 버튼을 최대한 많이 누르세요. 목표 횟수를 넘기면 대성공이에요.',
  tug: '왼손·오른손 버튼을 번갈아 눌러 줄을 당겨요. 같은 쪽만 누르면 안 당겨져요. 깃발을 끝까지 끌어오면 이겨요.',
  throw: '버튼을 꾹 누르고 있으면 힘이 찼다 빠졌다 해요. 힘이 초록 칸 가운데에 왔을 때 손을 떼세요.',
  memory: '잠깐 보여 주는 모양의 순서를 기억했다가 그대로 누르세요.',
  photo: '잠깐 보여 주는 여행지 순서를 기억했다가 그대로 누르세요.',
  pairs: '카드를 두 장씩 뒤집어 같은 그림을 모두 찾으세요. 시간이 정해져 있어요.',
  quickmath: '덧셈 문제 5개가 나와요. 알맞은 답을 빨리 고르세요.',
  firstImpression: '위에서 하트가 떨어져요. 바구니를 좌우로 옮겨 💗 하트는 받고 💔 깨진 하트는 피하세요. 받은 하트에서 깨진 하트를 뺀 수가 목표를 넘으면 성공이에요.',
  rhythm: '음표 4개가 위에서 떨어져요. 노란 선에 닿을 때 "지금!"을 누르세요. 너무 일찍 누르면 그 음표는 놓쳐요.',
  confess: '하트가 콩닥콩닥 커졌다 작아져요. 가장 커졌을 때 "고백!"을 누르세요.',
  dance: '캐릭터가 춤 동작을 하나씩 보여 줘요. 다 본 뒤 같은 순서로 동작 버튼을 누르세요.',
  oddEven: '주사위 두 개가 구르다가 컵에 덮여요. 컵 속 두 주사위의 합이 홀수일지 짝수일지 맞히세요. 운세가 좋으면(길·대길) 맞혔을 때 대박이 더 잘 나와요.',
  highLow: '다음 카드가 지금 카드보다 높을지 낮을지 두 번 맞히세요. 카드는 1~13이에요. 운세가 좋으면(길·대길) 두 번째 판에 힌트가 나와요.',
  slot: '시작을 누르면 릴 3개의 그림이 차례로 돌아요. 누른 순간의 그림에서 멈추니 타이밍을 맞춰 같은 그림 셋을 만드세요. 운세가 나쁘면 조금 더 빨리 돌고, 가끔 한 칸 미끄러져요.',
  snap: '랜드마크가 왔다 갔다 해요. 사진 틀 안에 들어왔을 때 "찰칵!"을 누르세요. 3장 중 잘 찍은 사진이 많을수록 좋아요.',
  pack: '물건이 하나씩 나와요. 여행에 필요한 것은 챙기고, 필요 없는 것은 두고 가세요. 시간 안에 골라야 해요.',
  leaves: '낙엽이 위에서 떨어져요. 땅에 닿기 전에 낙엽을 눌러서 잡으세요. 8초 동안 목표만큼 잡으면 성공이에요.',
  snowball: '눈벽 뒤에서 친구가 고개를 내밀어요. 숨기 전에 눌러서 눈덩이를 맞히세요. 10번 나와요.',
  flower: '물뿌리개가 화분 위를 왔다 갔다 해요. 아직 안 핀 화분 바로 위에 왔을 때 "물 주기!"를 누르세요. 7번 안에 5개를 다 피우면 대성공이에요.',
  melon: '눈을 가렸어요. 친구들이 외치는 말을 보고 큰 걸음·작은 걸음으로 수박 앞까지 가서 "내리치기!"를 누르세요. 가까울수록 잘 깨져요. 어려우면 친구 하나가 가끔 장난으로 반대로 말해요.',
  butterfly: '나비가 왼쪽에서 오른쪽으로 날아가요. 화면 밖으로 나가기 전에 눌러서 잡으세요. 8초 동안 목표만큼 잡으면 성공이에요.',
  watergun: '튜브 뒤에서 친구가 고개를 내밀어요. 숨기 전에 눌러서 물총을 쏘세요. 10번 나와요.',
  timing: '바늘이 왔다 갔다 해요. 가운데 초록 구역에 왔을 때 "멈춰!"를 누르세요. 가운데에 가까울수록 점수가 높아요.',
}

const LEVEL_NAME = ['쉬움', '보통', '어려움']
const rand = (n: number) => Math.floor(Math.random() * n)
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

// 미니게임 주제별 배경·그림 (이벤트 길과 같은 그림)
const MINI_THEME: Record<string, string> = {
  race: 'sport', tug: 'sport', throw: 'sport',
  memory: 'brain', pairs: 'brain', quickmath: 'brain',
  firstImpression: 'fest', rhythm: 'fest', confess: 'fest', dance: 'fest',
  oddEven: 'casino', highLow: 'casino', slot: 'casino',
  snap: 'travel', pack: 'travel', photo: 'travel',
  leaves: 'fall', snowball: 'snow', flower: 'bloom', melon: 'sun', butterfly: 'bloom', watergun: 'sun',
}
const THEME_LANDMARK: Record<string, string> = { sport: '운동회', brain: '두뇌 올림피아드', fest: '축제 거리', casino: '카지노', travel: '세계일주' }

export function MiniGame({ mini, onFinish, guide, practiceLimit, outfit = DEFAULT_OUTFIT, age, contest, onView, ready, watch }: Props) {
  // 시작 화면(설명서·연습·시작) → 연습이면 결과를 보여 주고 다시 시작 화면, 시작이면 진짜 결과
  const [mode, setMode] = useState<'intro' | 'help' | 'practice' | 'real'>('intro')
  const [practiced, setPracticed] = useState(0)
  const [round, setRound] = useState(0) // 게임을 새로 시작할 때마다 바꿔서 처음부터 다시 그림
  const [practiceResult, setPracticeResult] = useState<number | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const resultRef = useRef<number | null>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const roundRef = useRef(round)
  roundRef.current = round
  const doneRound = useRef(-1)
  const isDuelRef = useRef(!!mini.duel)
  // 판마다 한 번만 결과를 받음 (타이머·StrictMode에서 두 번 불려도 안전)
  const done = useCallback((v: number) => {
    if (doneRound.current === roundRef.current) return
    doneRound.current = roundRef.current
    sfx(isDuelRef.current ? (v >= 50 ? 'win' : 'lose') : v >= 1 ? 'win' : 'lose')
    if (modeRef.current === 'practice') { setPracticeResult(v); return }
    if (resultRef.current !== null) return
    resultRef.current = v
    setResult(v)
  }, [])
  const isDuel = !!mini.duel
  // 장면 보내기: 너무 자주 보내지 않게 0.25초에 한 번 (마지막 것은 꼭 보냄)
  const viewRef = useRef(onView)
  viewRef.current = onView
  const lastSent = useRef(0)
  const pendingView = useRef<MiniView | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastView = useRef<MiniView | null>(null)
  const sendView = useCallback((v: MiniView, now = false) => {
    if (!viewRef.current) return
    lastView.current = v
    pendingView.current = v
    const flush = () => { timer.current = null; lastSent.current = Date.now(); if (pendingView.current) viewRef.current?.(pendingView.current); pendingView.current = null }
    const wait = 250 - (Date.now() - lastSent.current)
    if (now || wait <= 0) { if (timer.current) clearTimeout(timer.current); flush() } else if (!timer.current) timer.current = setTimeout(flush, wait)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const report: Report = useCallback((v) => sendView({ phase: 'play', practice: modeRef.current === 'practice', ...v }), [sendView])
  useEffect(() => {
    if (mode === 'intro') sendView({ phase: 'ready' }, true)
    if (mode === 'help') sendView({ phase: 'help' }, true)
  }, [mode, sendView])
  useEffect(() => { if (result !== null) sendView({ ...lastView.current, phase: 'done', practice: false }, true) }, [result, sendView])
  const resultText = (v: number) => (isDuel ? `${v}점!` : v % 1 ? `${Math.round((v - Math.floor(v)) * 200)}% 맞혔어요!` : ['아쉬워요', '성공!', '대성공!'][v])
  const play = (m: 'practice' | 'real') => { setPracticeResult(null); setRound((r) => r + 1); setMode(m) }
  // 모두 준비되면 3·2·1 (연습 중이었어도 멈추고)
  const [count, setCount] = useState<number | null>(null)
  const go = !!ready?.go
  useEffect(() => {
    if (!go || modeRef.current === 'real') return
    setMode('intro')
    setCount(3)
    let n = 3
    const t = setInterval(() => {
      n -= 1
      if (n > 0) { setCount(n); return }
      clearInterval(t)
      setCount(null)
      setPracticeResult(null); setRound((r) => r + 1); setMode('real')
    }, 1000)
    return () => clearInterval(t)
  }, [go])
  const canPractice = practiced < practiceLimit
  const body = (() => {
    switch (mini.game) {
      case 'timing': return <Timing level={mini.level} rounds={1} duel={isDuel} onDone={done} report={report} />
      case 'tug': return <Tug level={mini.level} onDone={done} report={report} />
      case 'leaves': return <Leaves level={mini.level} onDone={done} report={report} />
      case 'snowball': return <Snowball level={mini.level} onDone={done} report={report} />
      case 'flower': return <Flower level={mini.level} onDone={done} report={report} />
      case 'melon': return <Melon level={mini.level} outfit={outfit} age={age} onDone={done} report={report} />
      case 'butterfly': return <Leaves level={mini.level} onDone={done} report={report} fly />
      case 'watergun': return <Snowball level={mini.level} onDone={done} report={report} water />
      case 'throw': return <Throw level={mini.level} outfit={outfit} age={age} onDone={done} report={report} />
      case 'confess': return <Confess level={mini.level} onDone={done} />
      case 'rhythm': return <Rhythm level={mini.level} onDone={done} report={report} />
      case 'dance': return <Dance level={mini.level} outfit={outfit} age={age} onDone={done} report={report} exact={!!contest && !isDuel} />
      case 'race': return <Mash level={mini.level} outfit={outfit} age={age} onDone={done} report={report} />
      case 'memory': return <Memory level={mini.level} symbols={MEMORY_ICONS} draw={(x) => <MiniIcon name={x} size={34} />} onDone={done} report={report} />
      case 'photo': return <Memory level={mini.level} symbols={Object.keys(CITY_ICON)} draw={(x) => <span className="city"><MiniIcon name={CITY_ICON[x]} size={30} /><small>{x}</small></span>} iconOf={cityIcon} onDone={done} report={report} />
      case 'pairs': return <Pairs level={mini.level} onDone={done} report={report} />
      case 'quickmath': return <QuickMath level={mini.level} onDone={done} report={report} />
      case 'firstImpression': return <Hearts level={mini.level} onDone={done} />
      case 'oddEven': return <OddEven level={mini.level} onDone={done} />
      case 'highLow': return <HighLow level={mini.level} onDone={done} />
      case 'slot': return <Slot level={mini.level} onDone={done} />
      case 'snap': return <Snap level={mini.level} onDone={done} report={report} />
      case 'pack': return <Pack level={mini.level} onDone={done} report={report} />
      default: return <Pack level={mini.level} onDone={done} />
    }
  })()
  return (
    <div className="sheet-backdrop mini-backdrop">
      <div className={`mini-wrap${watch ? ' has-watch' : ''}`}>
      {watch}
      <div className={`sheet mini theme-${MINI_THEME[mini.game] ?? 'duel'}`}>
        <div className="mini-art">{isDuel ? <EventArt type="afterRoll" /> : ['fall', 'snow', 'bloom', 'sun'].includes(MINI_THEME[mini.game]) ? <ThemeArt kind={MINI_THEME[mini.game] as ThemeArtKind} /> : <Landmark name={THEME_LANDMARK[MINI_THEME[mini.game]] ?? ''} />}</div>
        <div className="mini-head">
          <h2 className="jua">{MINI_NAMES[mini.game]}</h2>
          <span className="mini-level">난이도 {LEVEL_NAME[mini.level]}</span>
        </div>
        {contest && <p className="note jua">{contest}</p>}
        {mini.stake ? <p className="note">판돈 {mini.stake.toLocaleString('ko-KR')}만</p> : null}
        {mode === 'intro' && count !== null && <div className="mini-count jua" key={count}>{count}</div>}
        {mode === 'intro' && count === null && (
          <div className="mini-intro">
            <button className="wide" onClick={() => setMode('help')}>📖 설명서</button>
            <button className="wide" disabled={!canPractice || ready?.mine} onClick={() => { setPracticed((n) => n + 1); play('practice') }}>
              🔁 연습하기{Number.isFinite(practiceLimit) ? ` (남은 ${practiceLimit - practiced}번)` : ''}
            </button>
            {!ready && <button className="wide big" onClick={() => play('real')}>▶ 시작</button>}
            {ready && !ready.mine && <button className="wide big" onClick={ready.onReady}>✋ 준비 완료</button>}
            {ready?.mine && <p className="center muted">✅ 준비 완료! 모두 준비되면 다 같이 시작해요</p>}
          </div>
        )}
        {mode === 'help' && (
          <div className="mini-help">
            <p>{HOW[mini.game] ?? ''}</p>
            <p className="note">💪 {guide.stat}</p>
            <div className="note">🎁 보상<ul className="reward-list">{guide.reward.split(/ \/ | · /).map((x) => <li key={x}>{x}</li>)}</ul></div>
            <button className="wide" onClick={() => setMode('intro')}>돌아가기</button>
          </div>
        )}
        {mode === 'practice' && (practiceResult === null
          ? <><div className="practice-tag">연습 중 · 결과는 보상에 들어가지 않아요</div><div key={round}>{body}</div></>
          : (
            <div className="mini-result">
              <span className="practice-tag">연습 결과</span>
              <b className="jua">{resultText(practiceResult)}</b>
              <button className="wide big" onClick={() => setMode('intro')}>돌아가기</button>
            </div>
          ))}
        {mode === 'real' && (result === null ? <div key={round}>{body}</div> : (
          <div className="mini-result">
            <b className="jua">{resultText(result)}</b>
            <button className="wide big" onClick={() => onFinish(result)}>확인</button>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

// 바늘을 가운데에 멈추기. 쉬울수록 판정 범위가 넓고 바늘이 느림
// 노트북·컴퓨터(마우스)면 키보드로도 (2026-10-21 사용자: 마우스로 연타하기 힘듦). 폰은 그대로 버튼
const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches
function useKeys(map: Record<string, () => void>, up?: Record<string, () => void>) {
  const ref = useRef(map)
  ref.current = map
  const upRef = useRef(up)
  upRef.current = up
  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement // 채팅 쓰는 중엔 안 받음
    const on = (e: KeyboardEvent) => {
      if (e.repeat || typing(e)) return // 꾹 누르기는 한 번만
      const f = ref.current[e.code] ?? ref.current[e.key]
      if (f) { e.preventDefault(); f() }
    }
    const off = (e: KeyboardEvent) => {
      if (typing(e)) return
      const f = upRef.current?.[e.code] ?? upRef.current?.[e.key]
      if (f) { e.preventDefault(); f() }
    }
    window.addEventListener('keydown', on)
    window.addEventListener('keyup', off)
    return () => { window.removeEventListener('keydown', on); window.removeEventListener('keyup', off) }
  }, [])
}
// 키보드 안내 한 줄 (마우스 기기에서만)
const KeyHint = ({ children }: { children: ReactNode }) => (finePointer() ? <p className="muted center">⌨️ 키보드로: {children}</p> : null)

function Timing({ level, rounds, duel, onDone, report }: { level: number; rounds: number; duel: boolean; onDone: (v: number) => void; report?: Report }) {
  const zone = [25, 17, 10][level]
  const speed = [1.0, 1.4, 1.8][level]
  const [pos, setPos] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [frozen, setFrozen] = useState(false) // 멈춘 자리를 잠깐 보여 줌
  const t0 = useRef(performance.now())
  const posAt = useCallback((now: number) => 50 + Math.sin(((now - t0.current) / 1000) * speed * Math.PI) * 50, [speed])
  useEffect(() => {
    if (frozen) return
    let raf = 0
    const tick = (now: number) => {
      setPos(posAt(now))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [posAt, frozen])
  useEffect(() => { report?.({ pos: Math.round(pos), zone, right: frozen ? scores[scores.length - 1] : undefined }) }, [report, pos, zone, frozen, scores])
  // 손을 뗄 때가 아니라 누르는 순간의 바늘 위치로 판정 (화면에 그려진 위치가 아니라 그 순간 시각으로 계산)
  const stop = () => {
    if (frozen) return
    const at = posAt(performance.now())
    setPos(at)
    setFrozen(true)
    const score = Math.max(0, Math.round(100 - Math.abs(at - 50) * 2))
    const next = [...scores, score]
    setScores(next)
    setTimeout(() => {
      if (next.length >= rounds) {
        const avg = next.reduce((a, b) => a + b, 0) / next.length
        if (duel) onDone(Math.round(avg))
        else onDone(avg >= 100 - zone ? 2 : avg >= 100 - zone * 1.8 ? 1 : 0)
        return
      }
      t0.current = performance.now() - Math.random() * 800
      setFrozen(false)
    }, 600)
  }
  return (
    <div className="mini-body">
      <p>바늘이 가운데 초록 구역에 왔을 때 멈추세요{rounds > 1 ? ` (${Math.min(scores.length + (frozen ? 0 : 1), rounds)}/${rounds})` : ''}</p>
      <div className="gauge">
        <div className="gauge-zone" style={{ left: `${50 - zone / 2}%`, width: `${zone}%` }} />
        <div className={`gauge-needle${frozen ? ' frozen' : ''}`} style={{ left: `${pos}%` }} />
      </div>
      {frozen && <p className="jua">{scores[scores.length - 1]}점</p>}
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); stop() }}>멈춰!</button>
      <TimingKeys stop={stop} />
    </div>
  )
}

// 줄다리기: 왼쪽·오른쪽을 번갈아 눌러 줄을 당김. 상대는 계속 당김 (체력이 높을수록 상대가 약함)
// 미니게임마다 키보드 연결 (2026-10-21 밤: 줄다리기처럼 다른 미니게임도)
function SpaceKey({ run }: { run: () => void }) {
  useKeys({ Space: run, Enter: run })
  return <KeyHint>스페이스바</KeyHint>
}
function TimingKeys({ stop }: { stop: () => void }) {
  useKeys({ Space: stop, Enter: stop })
  return <KeyHint>스페이스바로 멈춰요</KeyHint>
}
function HoldKeys({ down, up }: { down: () => void; up: () => void }) {
  useKeys({ Space: down }, { Space: up })
  return <KeyHint>스페이스바를 꾹 누르고 있다가 떼요</KeyHint>
}
function ArrowKeys({ pick }: { pick: (a: string) => void }) {
  useKeys({ ArrowUp: () => pick('↑'), ArrowDown: () => pick('↓'), ArrowLeft: () => pick('←'), ArrowRight: () => pick('→') })
  return <KeyHint>방향키 ↑ ↓ ← →</KeyHint>
}

// 줄다리기 장면. pos 100이면 내가 이김
function TugScene({ pos, left }: { pos: number; left: number }) {
  return (
    <>
      <div className="tug-track"><div className="tug-flag" style={{ left: `${50 + pos / 2}%` }}><MiniIcon name="flag" size={34} /></div></div>
      <div className="mini-big jua">{left}초</div>
    </>
  )
}

function Tug({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const pull = [12, 19, 26][level] // 상대가 1초에 당기는 양
  const [pos, setPos] = useState(0) // 100이면 내가 이김
  const [left, setLeft] = useState(6)
  const [started, setStarted] = useState(false)
  const posRef = useRef(0)
  const leftRef = useRef(6)
  const lastSide = useRef<'L' | 'R' | null>(null)
  const ended = useRef(false)
  const finish = useCallback((v: number) => { if (!ended.current) { ended.current = true; onDone(v) } }, [onDone])
  useEffect(() => {
    if (!started) return
    const t0 = performance.now()
    const t = setInterval(() => {
      const el = (performance.now() - t0) / 1000
      posRef.current = Math.max(-100, posRef.current - pull * 0.1)
      leftRef.current = Math.max(0, 6 - el)
      setPos(posRef.current)
      setLeft(Math.ceil(leftRef.current))
      report?.({ pos: Math.round(posRef.current), left: Math.ceil(leftRef.current) })
      if (el >= 6) { clearInterval(t); finish(posRef.current >= 50 ? 1 : 0) }
    }, 100)
    return () => clearInterval(t)
  }, [started, pull, finish, report])
  const tap = (side: 'L' | 'R') => {
    if (ended.current) return
    if (!started) setStarted(true)
    if (lastSide.current === side) return // 같은 쪽을 두 번 누르면 안 당겨짐
    lastSide.current = side
    posRef.current = Math.min(100, posRef.current + 7)
    setPos(posRef.current)
    report?.({ pos: Math.round(posRef.current), left: Math.ceil(leftRef.current) })
    if (posRef.current >= 100) finish(leftRef.current >= 2 ? 2 : 1)
  }
  // 키보드: 왼손 ← 또는 A, 오른손 → 또는 L
  useKeys({ ArrowLeft: () => tap('L'), KeyA: () => tap('L'), ArrowRight: () => tap('R'), KeyL: () => tap('R') })
  const keyHint = finePointer()
  return (
    <div className="mini-body">
      <p>왼손·오른손을 <b>번갈아</b> 눌러 줄을 당기세요! (6초)</p>
      <TugScene pos={pos} left={left} />
      <div className="mini-grid two">
        <button onPointerDown={(e) => { e.preventDefault(); tap('L') }}>왼손{keyHint && <small className="key-hint">← 또는 A</small>}</button>
        <button onPointerDown={(e) => { e.preventDefault(); tap('R') }}>오른손{keyHint && <small className="key-hint">→ 또는 L</small>}</button>
      </div>
      {keyHint && <p className="muted center">⌨️ 키보드로: ←와 →(또는 A와 L)를 번갈아 눌러요</p>}
    </div>
  )
}

// 공 던지기: 누르고 있으면 힘이 찼다 빠졌다 함. 목표 칸에서 손을 떼기
// 2026-10-22: 막대 위에 장면 (내 캐릭터가 던진 공이 힘만큼 날아가 바구니로)
function Throw({ level, outfit, age, onDone, report }: { level: number; outfit: Outfit; age?: number; onDone: (v: number) => void; report?: Report }) {
  const w = [20, 13, 8][level] // 목표 칸 너비
  const speed = [0.8, 1.1, 1.4][level]
  const target = useMemo(() => 55 + rand(25), [])
  const [power, setPower] = useState(0)
  const [state, setState] = useState<'ready' | 'hold' | 'done'>('ready')
  const t0 = useRef(0)
  const powerAt = useCallback((now: number) => Math.abs(Math.sin(((now - t0.current) / 1000) * speed * Math.PI / 2)) * 100, [speed])
  useEffect(() => {
    if (state !== 'hold') return
    let raf = 0
    const tick = (now: number) => { setPower(powerAt(now)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, powerAt])
  useEffect(() => { report?.({ pos: Math.round(power), target, zone: w, n: state === 'done' ? 2 : state === 'hold' ? 1 : 0 }) }, [power, state, target, w, report])
  const down = () => { if (state !== 'ready') return; t0.current = performance.now(); setState('hold') }
  const up = () => {
    if (state !== 'hold') return
    const v = powerAt(performance.now())
    setPower(v)
    setState('done')
    const d = Math.abs(v - (target + w / 2))
    setTimeout(() => onDone(d <= w / 4 ? 2 : d <= w / 2 ? 1 : 0), 600)
  }
  return (
    <div className="mini-body">
      <p>버튼을 <b>누르고 있다가</b> 힘이 초록 칸에 왔을 때 떼세요</p>
      <div className="throw-field">
        <span className="thrower"><Character outfit={outfit} age={age} pose={state === 'done' ? 'up' : 'idle'} expr={state === 'hold' ? 'surprised' : 'normal'} size={28} /></span>
        <span className="throw-basket" style={{ left: `${8 + (target + w / 2) * 0.88}%` }}><svg viewBox="0 0 48 40" width="48" height="40" aria-hidden="true"><path d="M4 8h40l-6 30H10z" fill="#C98F5B" stroke="#2A2118" strokeWidth="3" strokeLinejoin="round" /><path d="M8 18h32M10 28h28M18 8l2 30M30 8l-2 30" stroke="#8A5A3B" strokeWidth="2" /></svg></span>
        {state === 'done' && <span className="throw-ball" style={{ left: `${8 + power * 0.88}%` }}><i /></span>}
      </div>
      <div className="gauge">
        <div className="gauge-zone" style={{ left: `${target}%`, width: `${w}%` }} />
        <div className="power-fill" style={{ width: `${power}%` }} />
      </div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); down() }} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        {state === 'ready' ? '꾹 누르기' : state === 'hold' ? '…지금 떼기!' : '던졌다!'}
      </button>
      <HoldKeys down={down} up={up} />
    </div>
  )
}

// 고백 타이밍: 하트가 콩닥콩닥. 가장 클 때 누르기
function Confess({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const speed = [0.8, 1.1, 1.4][level]
  const great = [0.975, 0.988, 0.995][level]
  const ok = [0.88, 0.93, 0.96][level]
  const [beat, setBeat] = useState(0)
  const [stopped, setStopped] = useState(false)
  const t0 = useRef(performance.now())
  const beatAt = useCallback((now: number) => Math.abs(Math.sin(((now - t0.current) / 1000) * speed * Math.PI)), [speed])
  useEffect(() => {
    if (stopped) return
    let raf = 0
    const tick = (now: number) => { setBeat(beatAt(now)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stopped, beatAt])
  const press = () => {
    if (stopped) return
    const v = beatAt(performance.now())
    setBeat(v)
    setStopped(true)
    setTimeout(() => onDone(v >= great ? 2 : v >= ok ? 1 : 0), 600)
  }
  return (
    <div className="mini-body">
      <p>하트가 <b>가장 커졌을 때</b> 고백하세요</p>
      <div className="heart-box"><span className="heart" style={{ transform: `scale(${0.5 + beat * 0.7})` }}><MiniIcon name="heart" size={110} /></span></div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); press() }}>고백!</button>
      <SpaceKey run={press} />
    </div>
  )
}

// 무대 공연: 음표 4개가 떨어짐. 선에 닿을 때 누르기
function Rhythm({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const fall = [1600, 1250, 1000][level] // 위에서 선까지 걸리는 시간(ms)
  const perfect = [130, 100, 70][level]
  const good = [240, 180, 130][level]
  const hits = useMemo(() => { let t = fall + 600; return Array.from({ length: 4 }, () => (t += 700 + rand(500))) }, [fall]) // 선에 닿는 시각
  const [now, setNow] = useState(0)
  const [marks, setMarks] = useState<(number | null)[]>([null, null, null, null]) // 2 딱 맞음, 1 좋음, 0 놓침
  const marksRef = useRef(marks)
  const t0 = useRef(performance.now())
  const ended = useRef(false)
  const setM = (m: (number | null)[]) => { marksRef.current = m; setMarks(m) }
  useEffect(() => {
    let raf = 0
    const tick = (t: number) => {
      const el = t - t0.current
      setNow(el)
      const m = marksRef.current
      if (m.some((x, i) => x === null && el > hits[i] + good)) {
        marksRef.current = m.map((x, i) => (x === null && el > hits[i] + good ? 0 : x))
        setMarks(marksRef.current)
      }
      if (!ended.current && marksRef.current.every((x) => x !== null)) {
        ended.current = true
        const sum = marksRef.current.reduce<number>((a, x) => a + (x ?? 0), 0)
        setTimeout(() => onDone(sum >= 6 ? 2 : sum >= 3 ? 1 : 0), 500)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hits, good, onDone])
  useEffect(() => {
    report?.({ marks, ys: hits.map((h, i) => { const y = ((now - (h - fall)) / fall) * 85; return marks[i] !== null || y < -10 || y > 100 ? -1 : Math.round(y) }) })
  }, [now, marks, hits, fall, report])
  const press = () => {
    const el = performance.now() - t0.current
    const m = marksRef.current
    const i = m.findIndex((x, k) => x === null && Math.abs(el - hits[k]) <= good)
    if (i < 0) {
      // 선에 음표가 없을 때 누르면 다음 음표를 놓친 걸로 (마구 누르기 막기, 2026-10-22 친구 피드백)
      const next = m.findIndex((x) => x === null)
      if (next >= 0) setM(m.map((x, k) => (k === next ? 0 : x)))
      return
    }
    const d = Math.abs(el - hits[i])
    setM(m.map((x, k) => (k === i ? (d <= perfect ? 2 : 1) : x)))
  }
  return (
    <div className="mini-body">
      <p>음표가 <b>선에 닿을 때</b> 누르세요 (4개)</p>
      <div className="rhythm-track">
        <div className="rhythm-line" />
        {hits.map((h, i) => {
          const y = ((now - (h - fall)) / fall) * 85 // 85%가 선
          if (marks[i] !== null || y < -10 || y > 100) return null
          return <span key={i} className="rhythm-note" style={{ top: `${y}%` }}><MiniIcon name="note" size={36} /></span>
        })}
      </div>
      <div className="mini-seq">{marks.map((x, i) => <span key={i}>{x === null ? '·' : ['놓침', '좋아', '딱!'][x]}</span>)}</div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); press() }}>지금!</button>
      <SpaceKey run={press} />
    </div>
  )
}

// 댄스 따라 하기: 화살표 순서를 보고 그대로 누르기 (매력이 높을수록 짧음)
const ARROWS = ['↑', '↓', '←', '→']
// 춤: 화살표 대신 내 캐릭터가 춤 동작을 보여 줌 (2026-10-17 사용자). ← 왼팔 · ↑ 두 팔 · → 오른팔 · ↓ 팔 벌리기
const POSE_OF: Record<string, Pose> = { '←': 'left', '↑': 'up', '→': 'right', '↓': 'out' }
const POSE_NAME: Record<string, string> = { '←': '왼팔', '↑': '만세', '→': '오른팔', '↓': '팔 벌리기' }
// exact: 대회에서는 맞힌 비율도 같이 보냄 (등급 + 비율 × 0.5, 엔진 finishMini가 나눔)
function Dance({ level, outfit, age, onDone, report, exact }: { level: number; outfit: Outfit; age?: number; onDone: (v: number) => void; report?: Report; exact?: boolean }) {
  const len = [5, 6, 7][level]
  const seq = useMemo(() => Array.from({ length: len }, () => ARROWS[rand(4)]), [len])
  const [shown, setShown] = useState(0) // 지금까지 보여 준 개수 (len이면 내 차례)
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => {
    if (shown >= len) return
    const t = setTimeout(() => setShown((n) => n + 1), 700)
    return () => clearTimeout(t)
  }, [shown, len])
  const showing = shown < len
  useEffect(() => { report?.({ show: showing, seq: (showing ? [seq[shown]] : picked).map((a) => POSE_OF[a]), n: shown, m: len }) }, [showing, shown, picked, seq, len, report])
  const pick = (a: string) => {
    if (showing || picked.length >= len) return
    const next = [...picked, a]
    setPicked(next)
    if (next.length === len) {
      const right = next.filter((v, i) => v === seq[i]).length
      const grade = right === len ? 2 : right >= len - 1 ? 1 : 0
      setTimeout(() => onDone(exact ? grade + (right / len) * 0.5 : grade), 400)
    }
  }
  return (
    <div className="mini-body">
      <p>{showing ? '춤 동작을 잘 보세요' : '본 순서대로 따라 하세요!'}</p>
      <div className="dance-stage" key={shown}>
        {showing && <span className="dance-step">{shown + 1}번째 / {len}</span>}
        {showing
          ? <Character outfit={outfit} age={age} pose={POSE_OF[seq[shown]]} expr="happy" size={70} title={POSE_NAME[seq[shown]]} />
          : picked.length < len ? <Character outfit={outfit} age={age} pose="idle" size={70} title="따라 할 차례" /> : <b className="jua mini-big">끝!</b>}
      </div>
      <div className="mini-seq dance-seq">{Array.from({ length: len }, (_, i) => <span key={i}>{picked[i] ? <Character outfit={outfit} pose={POSE_OF[picked[i]]} size={14} /> : ''}</span>)}</div>
      <div className="mini-grid dance-btns">{ARROWS.map((a) => <button key={a} disabled={showing} onClick={() => pick(a)} aria-label={POSE_NAME[a]}><Character outfit={outfit} pose={POSE_OF[a]} size={20} /><small>{POSE_NAME[a]}</small></button>)}</div>
      <ArrowKeys pick={(a) => { if (!showing) pick(a) }} />
    </div>
  )
}

// 5초 동안 많이 누르기 (운동회 달리기). 체력이 높으면 목표가 낮음
// 2026-10-22: 트랙 위에서 내 캐릭터가 누른 만큼 달려 나감
function Mash({ level, outfit, age, onDone, report }: { level: number; outfit: Outfit; age?: number; onDone: (v: number) => void; report?: Report }) {
  const goal = [20, 28, 36][level]
  const [count, setCount] = useState(0)
  const [left, setLeft] = useState(5)
  const [started, setStarted] = useState(false)
  const countRef = useRef(0)
  useEffect(() => {
    if (!started) return
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) {
        clearInterval(t)
        const c = countRef.current
        onDone(c >= goal ? 2 : c >= goal * 0.7 ? 1 : 0)
        return 0
      }
      return l - 1
    }), 1000)
    return () => clearInterval(t)
  }, [started, goal, onDone])
  useEffect(() => { report?.({ n: count, m: goal, left }) }, [count, goal, left, report])
  const press = () => { if (left <= 0) return; if (!started) setStarted(true); countRef.current++; setCount(countRef.current) }
  // 키보드: 스페이스바 연타 (꾹 누르기는 한 번만)
  useKeys({ Space: press, Enter: press })
  const keyHint = finePointer()
  return (
    <div className="mini-body">
      <p>5초 동안 최대한 많이 누르세요! 목표 {goal}번</p>
      <div className="race-track">
        <span className="race-finish" style={{ left: `${4 + 78}%` }} aria-hidden="true" />
        <span className={`racer${started && left > 0 ? ' go' : ''}`} style={{ left: `${4 + Math.min(1, count / goal) * 78}%` }}><Character outfit={outfit} age={age} pose="idle" expr={count >= goal ? 'happy' : 'normal'} size={32} /></span>
      </div>
      <div className="mini-big jua">{count}번 · {left}초</div>
      <button className="wide big" onPointerDown={(e) => e.preventDefault()} onClick={press}>{/* 눌러도 포커스가 안 남아 스페이스가 두 번 세지지 않게 */}
        {started ? '달려!' : '누르면 시작'}
      </button>
      {keyHint && <p className="muted center">⌨️ 키보드로: 스페이스바를 연타해요</p>}
    </div>
  )
}

// ───── 테마 맵 게임 (2026-10-29) ─────
// 가을 낙엽 잡기: 떨어지는 낙엽을 땅에 닿기 전에 누름. 체력이 높을수록 천천히 떨어지고 목표가 적음
// 봄 나비 잡기(fly): 같은 규칙으로 나비가 왼쪽에서 오른쪽으로 날아감
const LEAVES_T = 8
const LEAF_KEY_ZONE = 50 // 키보드로 잡을 수 있는 높이(%)부터
function Leaves({ level, onDone, report, fly = false }: { level: number; onDone: (v: number) => void; report?: Report; fly?: boolean }) {
  const goal = [8, 10, 12][level]
  const fall = [2.6, 2.1, 1.7][level] // 위에서 땅까지 초
  const leaves = useMemo(() => Array.from({ length: Math.floor((LEAVES_T - 0.6) / 0.42) }, (_, i) => ({ id: i, at: i * 0.42, x: 6 + Math.random() * 82, y: 8 + Math.random() * 62, c: i % 3 })), [])
  const [t, setT] = useState(0)
  const [caught, setCaught] = useState<number[]>([])
  const caughtRef = useRef<number[]>([])
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      setT(s)
      if (s >= LEAVES_T) { const c = caughtRef.current.length; onDone(c >= goal + 3 ? 2 : c >= goal ? 1 : 0); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [goal, onDone])
  const falling = leaves.filter((l) => t >= l.at && t < l.at + fall && !caught.includes(l.id))
  const yOf = (l: { at: number }) => ((t - l.at) / fall) * 100 // 얼마나 왔나 (0~100)
  const posOf = (l: { id: number; at: number; x: number; y: number }) => (fly ? { left: yOf(l), top: l.y + Math.sin(t * 5 + l.id) * 6 } : { left: l.x, top: yOf(l) * 0.86 })
  const thing = fly ? '나비' : '낙엽'
  const thingObj = fly ? '나비를' : '낙엽을'
  const unit = fly ? '마리' : '개'
  const catchLeaf = (id: number) => { if (caughtRef.current.includes(id)) return; caughtRef.current = [...caughtRef.current, id]; setCaught(caughtRef.current); sfx('pop') }
  const left = Math.max(0, Math.ceil(LEAVES_T - t))
  // 키보드 (2026-10-29): 스페이스바로 점선을 지난 것 중 가장 멀리 간 것을 잡음 (낙엽은 아래쪽 반, 나비는 오른쪽 반)
  const lowest = falling.filter((l) => yOf(l) >= LEAF_KEY_ZONE).sort((a, b) => yOf(b) - yOf(a))[0]
  useKeys({ Space: () => { if (lowest) catchLeaf(lowest.id) } })
  const keyHint = finePointer()
  const xs = falling.map((l) => (fly ? Math.round(yOf(l) / 5) * 5 : Math.round(l.x))).join(',')
  const ys = falling.map((l) => (fly ? Math.round(l.y) : Math.round(yOf(l) / 5) * 5)).join(',') // 장면은 5% 단위로만 (너무 자주 안 바뀌게)
  useEffect(() => { report?.({ n: caught.length, m: goal, left, xs: xs ? xs.split(',').map(Number) : [], ys: ys ? ys.split(',').map(Number) : [] }) }, [report, caught.length, goal, left, xs, ys])
  return (
    <div className="mini-body">
      <p>{thingObj} 눌러서 잡으세요! 목표 {goal}{unit}</p>
      <div className={`leaf-field${fly ? ' fly' : ''}`}>
        {falling.map((l) => (
          <button key={l.id} className={`leaf-btn${fly ? ' bfly' : ''} c${l.c}`} style={{ left: `${posOf(l).left}%`, top: `${posOf(l).top}%`, rotate: fly ? undefined : `${Math.sin(t * 3 + l.id) * 40}deg` }} onPointerDown={(e) => { e.preventDefault(); catchLeaf(l.id) }} aria-label={thing}><i /></button>
        ))}
        {keyHint && <div className={`leaf-zone${fly ? ' v' : ''}`} style={fly ? { left: `${LEAF_KEY_ZONE}%` } : { top: `${LEAF_KEY_ZONE * 0.86}%` }} />}
        <div className="leaf-ground" />
      </div>
      <div className="mini-big jua">{caught.length}{unit} · {left}초</div>
      <KeyHint>스페이스바로 점선을 지난 {thingObj} 잡아요</KeyHint>
    </div>
  )
}

// 겨울 눈싸움: 눈벽 6개 중 하나에서 친구가 고개를 내밀면 숨기 전에 눌러 맞힘. 10번
// 여름 물총 싸움(water): 같은 규칙으로 눈벽 대신 튜브
const SNOW_TOTAL = 10
function Snowball({ level, onDone, report, water = false }: { level: number; onDone: (v: number) => void; report?: Report; water?: boolean }) {
  const up = [1.3, 1.05, 0.85][level] // 고개를 내밀고 있는 초 (2026-11-02 사용자: 너무 어려워서 늘림)
  const gap = 0.35
  const goal = [5, 6, 7][level]
  const slots = useMemo(() => { const r: number[] = []; for (let i = 0; i < SNOW_TOTAL; i++) { let k = rand(6); if (k === r[i - 1]) k = (k + 1 + rand(5)) % 6; r.push(k) } return r }, [])
  const [t, setT] = useState(0)
  const [hits, setHits] = useState<number[]>([])
  const hitsRef = useRef<number[]>([])
  const end = SNOW_TOTAL * (up + gap) + 0.3
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      setT(s)
      if (s >= end) { const h = hitsRef.current.length; onDone(h >= Math.min(SNOW_TOTAL, goal + 2) ? 2 : h >= goal ? 1 : 0); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, goal, onDone])
  const i = Math.floor(t / (up + gap))
  const upNow = i < SNOW_TOTAL && t - i * (up + gap) >= gap && !hits.includes(i)
  const slot = upNow ? slots[i] : -1
  const hitSlot = hits[hits.length - 1] === i ? slots[i] : -1 // 방금 맞힌 자리 (눈 튀김)
  const throwAt = (k: number) => { if (k !== slot || hitsRef.current.includes(i)) return; hitsRef.current = [...hitsRef.current, i]; setHits(hitsRef.current); sfx('pop') }
  useEffect(() => { report?.({ pos: slot, right: hits.length, n: Math.min(i, SNOW_TOTAL), m: SNOW_TOTAL }) }, [report, slot, hits.length, i])
  // 키보드 (2026-10-29): 숫자 1~6이 눈벽 자리 (위 줄 1·2·3, 아래 줄 4·5·6)
  useKeys(Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap((n) => [[`Digit${n}`, () => throwAt(n - 1)], [`Numpad${n}`, () => throwAt(n - 1)]])))
  const keyHint = finePointer()
  return (
    <div className="mini-body">
      <p>친구가 나오면 눌러서 맞히세요! 목표 {goal}번</p>
      <div className={`snow-grid${water ? ' water' : ''}`}>
        {Array.from({ length: 6 }, (_, k) => (
          <button key={k} className={`snow-cell${k === slot ? ' up' : ''}${k === hitSlot ? ' hit' : ''}`} onPointerDown={(e) => { e.preventDefault(); throwAt(k) }} aria-label={`${water ? '튜브' : '눈벽'} ${k + 1}`}>
            <span className="snow-friend"><Character outfit={DEFAULT_OUTFIT} pose="idle" expr={k === hitSlot ? 'sad' : 'happy'} size={44} crop="head" /></span>
            <span className="snow-wall">{keyHint && <b>{k + 1}</b>}</span>
          </button>
        ))}
      </div>
      <div className="mini-big jua">맞힘 {hits.length} · {Math.min(i + 1, SNOW_TOTAL)}/{SNOW_TOTAL}</div>
      <KeyHint>숫자 1~6 ({water ? '튜브' : '눈벽'}에 쓰인 번호)</KeyHint>
    </div>
  )
}

// 물뿌리개 그림 (잉크 테두리)
function WateringCan() {
  return (
    <svg viewBox="0 0 60 44" width="54" height="40">
      <g stroke="#2A2118" strokeWidth="2.6" strokeLinejoin="round">
        <path d="M14 14h26l-2 26H16z" fill="#4C8FD6" />
        <path d="M40 20l16-10 2 4-15 12" fill="#4C8FD6" />
        <path d="M18 14a9 9 0 0 1 18 0" fill="none" />
        <circle cx="56" cy="11" r="3.5" fill="#9FD3F2" />
      </g>
    </svg>
  )
}

// 봄 꽃 심기 (2026-10-29): 물뿌리개가 화분 5개 위를 왔다 갔다. 안 핀 화분 위에서 누르면 핌. 7번 안에
const POTS = 5
const POT_AT = (i: number) => 10 + i * 20 // 화분 가운데 (%)
const FLOWER_TRIES = 7
function Flower({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const speed = [0.55, 0.75, 0.95][level] // 1초에 왕복 몇 번 쯤
  const half = [6, 4.5, 3.2][level] // 화분 위로 쳐 주는 너비 (%)
  const [pos, setPos] = useState(50)
  const [bloom, setBloom] = useState<boolean[]>(() => Array(POTS).fill(false))
  const [tries, setTries] = useState(0)
  const [splash, setSplash] = useState<{ at: number; ok: boolean } | null>(null)
  const t0 = useRef(performance.now())
  const posAt = useCallback((now: number) => 50 + Math.sin(((now - t0.current) / 1000) * speed * Math.PI * 2) * 46, [speed])
  const doneRef = useRef(false)
  useEffect(() => {
    let raf = 0
    const tick = (now: number) => { setPos(posAt(now)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [posAt])
  const water = () => {
    if (doneRef.current || tries >= FLOWER_TRIES) return
    const at = posAt(performance.now()) // 누르는 순간 위치로 판정
    const i = bloom.findIndex((b, k) => !b && Math.abs(at - POT_AT(k)) <= half)
    const next = i >= 0 ? bloom.map((b, k) => b || k === i) : bloom
    const n = tries + 1
    setBloom(next); setTries(n); setSplash({ at, ok: i >= 0 })
    sfx(i >= 0 ? 'pop' : 'click')
    const count = next.filter(Boolean).length
    if (count === POTS || n >= FLOWER_TRIES) {
      doneRef.current = true
      setTimeout(() => onDone(count === POTS ? 2 : count >= 3 ? 1 : 0), 500)
    }
  }
  useKeys({ Space: water, Enter: water })
  useEffect(() => { report?.({ pos: Math.round(pos), marks: bloom.map((b) => (b ? 1 : 0)), n: tries, m: FLOWER_TRIES, zone: half }) }, [report, pos, bloom, tries, half])
  return (
    <div className="mini-body">
      <p>안 핀 화분 위에서 물을 주세요! 남은 물 {FLOWER_TRIES - tries}번</p>
      <div className="flower-field">
        <span className="can" style={{ left: `${pos}%` }} aria-hidden="true"><WateringCan /></span>
        {splash && <span key={tries} className={`drop${splash.ok ? ' ok' : ''}`} style={{ left: `${splash.at}%` }} />}
        {Array.from({ length: POTS }, (_, k) => (
          <span key={k} className={`pot${bloom[k] ? ' bloom' : ''}`} style={{ left: `${POT_AT(k)}%`, width: `${half * 2}%` }}>
            <i className="sprout" />
          </span>
        ))}
      </div>
      <div className="mini-big jua">{bloom.filter(Boolean).length}/{POTS} 핌</div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); water() }}>물 주기!</button>
      <KeyHint>스페이스바로 물을 줘요</KeyHint>
    </div>
  )
}

// 여름 수박 깨기 (2026-10-29): 눈을 가리고 친구 3명의 말을 보고 걸어가서 내리침. 가까울수록 잘 깨짐
// 어려움이면 친구 한 명이 가끔 장난으로 반대로 말함
const MELON_T = 12
type Shout = { who: string; text: string }
function melonShouts(x: number, target: number, level: number, liar: number): Shout[] {
  const d = target - x
  const far = Math.abs(d)
  const dir = d > 0 ? '오른쪽' : '왼쪽'
  const wrong = d > 0 ? '왼쪽' : '오른쪽'
  const how = far <= 3 ? '바로 앞이야! 지금!' : far <= 10 ? `${dir}으로 조금만!` : far <= 25 ? `${dir}으로 더 가!` : `${dir}! 아직 멀었어!`
  return ['민트', '보리', '호두'].map((who, i) => {
    const lie = level === 2 && i === liar && far > 3 && (x * 7 + target) % 2 === 0 // 어려움에서만 (설명서와 같게)
    return { who, text: lie ? `${wrong}으로 가!` : how }
  })
}
function Melon({ level, outfit, age, onDone, report }: { level: number; outfit: Outfit; age?: number; onDone: (v: number) => void; report?: Report }) {
  const target = useMemo(() => 12 + rand(77), [])
  const liar = useMemo(() => rand(3), [])
  const [x, setX] = useState(() => (target > 50 ? 4 : 96))
  const [left, setLeft] = useState(MELON_T)
  const [hit, setHit] = useState<number | null>(null) // 내리친 자리
  const doneRef = useRef(false)
  const xRef = useRef(x)
  xRef.current = x
  const smash = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    const d = Math.abs(xRef.current - target)
    setHit(xRef.current)
    sfx(d <= 9 ? 'pop' : 'click')
    setTimeout(() => onDone(d <= 3 ? 2 : d <= 9 ? 1 : 0), 900)
  }, [target, onDone])
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { if (left === 0) smash() }, [left, smash]) // 시간이 다 되면 그 자리에서 내리침
  const move = (dx: number) => { if (!doneRef.current) setX((v) => Math.max(0, Math.min(100, v + dx))) }
  useKeys({ ArrowLeft: () => move(-8), ArrowRight: () => move(8), KeyA: () => move(-3), KeyD: () => move(3), Space: smash, Enter: smash })
  const shouts = melonShouts(x, target, level, liar)
  const d = Math.abs(x - target)
  useEffect(() => { report?.({ pos: Math.round(x), target, ok: hit === null ? null : d <= 9, left }) }, [report, x, target, hit, d, left])
  return (
    <div className="mini-body">
      <div className="shouts">{shouts.map((s) => <p key={s.who}><b>{s.who}</b> {s.text}</p>)}</div>
      <div className="melon-field">
        {/* 수박은 내리친 뒤에야 보임 (눈을 가렸으니까) */}
        {hit !== null && <span className={`melon${d <= 9 ? ' broken' : ''}`} style={{ left: `${6 + target * 0.88}%` }} aria-hidden="true"><MiniIcon name="watermelon" size={40} /></span>}
        <span className={`blind${hit !== null ? ' swing' : ''}`} style={{ left: `${6 + x * 0.88}%` }} aria-hidden="true"><Character outfit={outfit} age={age} pose="up" size={46} /><i className="band" /></span>
      </div>
      <div className="mini-big jua">{hit !== null ? (d <= 3 ? '쩍! 반으로!' : d <= 9 ? '퍽! 깨졌다' : '헛스윙…') : `${left}초`}</div>
      <div className="melon-btns">
        <button aria-label="왼쪽 큰 걸음" onPointerDown={(e) => { e.preventDefault(); move(-8) }}>◀◀</button>
        <button aria-label="왼쪽 작은 걸음" onPointerDown={(e) => { e.preventDefault(); move(-3) }}>◀</button>
        <button aria-label="오른쪽 작은 걸음" onPointerDown={(e) => { e.preventDefault(); move(3) }}>▶</button>
        <button aria-label="오른쪽 큰 걸음" onPointerDown={(e) => { e.preventDefault(); move(8) }}>▶▶</button>
      </div>
      <p className="muted center small">◀◀ ▶▶ 큰 걸음 · ◀ ▶ 작은 걸음</p>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); smash() }}>내리치기!</button>
      <KeyHint>← → 큰 걸음 · A D 작은 걸음 · 스페이스바 내리치기</KeyHint>
    </div>
  )
}

// 잠깐 보여준 순서 기억하기. 지력이 높으면 개수가 적음
// 그림 (2026-10-22): 기억력은 그림 6개, 여행 코스는 랜드마크 + 도시 이름
const MEMORY_ICONS = ['apple', 'star', 'heart', 'fish', 'umbrella', 'crown']
const CITY_ICON: Record<string, string> = { 파리: 'eiffel', 뉴욕: 'liberty', 카이로: 'pyramid', 이스터섬: 'moai', 독일: 'castle', 런던: 'ferris' }
const cityIcon = (x: string) => CITY_ICON[x]
const same = (x: string) => x
function Memory({ level, symbols, draw = (x) => x, iconOf = same, onDone, report }: { level: number; symbols: string[]; draw?: (x: string) => ReactNode; iconOf?: (x: string) => string; onDone: (v: number) => void; report?: Report }) {
  const len = [4, 5, 6][level]
  const seq = useMemo(() => Array.from({ length: len }, () => symbols[rand(symbols.length)]), [len, symbols])
  const [show, setShow] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => { const t = setTimeout(() => setShow(false), 1200 + len * 500); return () => clearTimeout(t) }, [len])
  useEffect(() => { report?.({ show, seq: (show ? seq : picked).map(iconOf), m: len }) }, [show, seq, picked, len, iconOf, report])
  // 잘못 누르면 하나 지우기, 다 고르면 '확인'으로 끝 (2026-10-21 사용자)
  const pick = (x: string) => { if (picked.length < len) setPicked([...picked, x]) }
  const confirm = () => {
    if (picked.length < len) return
    const right = picked.filter((v, i) => v === seq[i]).length
    onDone(right === len ? 2 : right >= Math.ceil(len / 2) ? 1 : 0)
  }
  // 키보드: 숫자 1~6으로 고르기, 백스페이스로 지우기, 엔터로 확인
  const keys: Record<string, () => void> = { Backspace: () => { if (!show) setPicked((x) => x.slice(0, -1)) }, Enter: () => { if (!show) confirm() } }
  symbols.forEach((x, k) => { keys[`Digit${k + 1}`] = () => { if (!show) pick(x) }; keys[`Numpad${k + 1}`] = keys[`Digit${k + 1}`] })
  useKeys(keys)
  return (
    <div className="mini-body">
      <p>{show ? '순서를 기억하세요!' : `순서대로 고르세요 (${picked.length}/${len})`}</p>
      <div className="mini-seq pics">{(show ? seq : picked).map((x, i) => <span key={i}>{draw(x)}</span>)}</div>
      {!show && (
        <>
          <div className="mini-grid">
            {symbols.map((x, k) => <button key={x} className="pic-btn" aria-label={x} disabled={picked.length >= len} onClick={() => pick(x)}>{draw(x)}{finePointer() && <small className="key-hint">{k + 1}</small>}</button>)}
          </div>
          <div className="row">
            <button className="grow" disabled={!picked.length} onClick={() => setPicked(picked.slice(0, -1))}>⌫ 하나 지우기</button>
            <button className="grow" disabled={picked.length < len} onClick={confirm}>✅ 확인</button>
          </div>
          <KeyHint>숫자 1~{symbols.length}로 고르고, 백스페이스로 지우고, 엔터로 확인</KeyHint>
        </>
      )}
    </div>
  )
}

// 같은 그림 찾기. 지력이 높으면 짝이 적음
function Pairs({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const n = [3, 4, 6][level]
  const deck = useMemo(() => shuffle([...MEMORY_ICONS.slice(0, n), ...MEMORY_ICONS.slice(0, n)]), [n])
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const [left, setLeft] = useState(18)
  const doneRef = useRef(false)
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (doneRef.current) return
    if (found.length === deck.length) { doneRef.current = true; onDone(left >= 8 ? 2 : 1) }
    else if (left <= 0) { doneRef.current = true; onDone(0) }
  }, [found, left, deck.length, onDone])
  useEffect(() => { report?.({ seq: deck, open, found, left: Math.max(0, left) }) }, [deck, open, found, left, report])
  const flip = (i: number) => {
    if (open.includes(i) || found.includes(i) || open.length === 2) return
    const next = [...open, i]
    setOpen(next)
    if (next.length === 2) {
      setTimeout(() => {
        if (deck[next[0]] === deck[next[1]]) setFound((f) => [...f, ...next])
        setOpen([])
      }, 450)
    }
  }
  return (
    <div className="mini-body">
      <p>같은 그림 짝 맞추기 · 남은 시간 {Math.max(0, left)}초</p>
      <div className="mini-grid cards">
        {deck.map((x, i) => (
          <button key={i} className={found.includes(i) ? 'found' : ''} onClick={() => flip(i)} aria-label={`카드 ${i + 1}`}>
            {open.includes(i) || found.includes(i) ? <MiniIcon name={x} size={40} /> : '?'}
          </button>
        ))}
      </div>
    </div>
  )
}

// 빠른 계산 5문제. 지력이 높으면 숫자가 작고 시간이 길다. 어느 기기든 눌러서 답함 (2026-10-21 사용자)
function QuickMath({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const max = [10, 30, 70][level]
  const qs = useMemo(() => Array.from({ length: 5 }, () => {
    const a = rand(max) + 1, b = rand(max) + 1
    const ans = a + b
    const opts = shuffle([ans, ans + rand(5) + 1, Math.max(0, ans - rand(5) - 1)])
    return { a, b, ans, opts }
  }), [max])
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [left, setLeft] = useState([12, 10, 8][level])
  const doneRef = useRef(false)
  useEffect(() => { const t = setInterval(() => setLeft((l) => l - 1), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (doneRef.current) return
    if (i >= qs.length || left <= 0) { doneRef.current = true; onDone(right >= 5 ? 2 : right >= 3 ? 1 : 0) }
  }, [i, left, right, qs.length, onDone])
  const q = qs[Math.min(i, qs.length - 1)]
  useEffect(() => { report?.({ n: i, m: qs.length, right, left: Math.max(0, left), item: `${q.a} + ${q.b}` }) }, [i, qs.length, right, left, q, report])
  const answer = (o: number) => { if (doneRef.current) return; if (o === q.ans) setRight((r) => r + 1); setI((x) => x + 1) }
  return (
    <div className="mini-body">
      <p>{Math.min(i + 1, 5)}/5 · 남은 시간 {Math.max(0, left)}초 · 맞힌 수 {right}</p>
      <div className="mini-big jua">{q.a} + {q.b} = ?</div>
      <div className="mini-grid">
        {q.opts.map((o, k) => <button key={k} onClick={() => answer(o)}>{o}</button>)}
      </div>
    </div>
  )
}

// 하트 받기 (2026-11-02 사용자: 첫인상 고르기 대신). 바구니를 좌우로 옮겨 하트는 받고 깨진 하트는 피함
// 매력이 높으면(쉬움) 천천히 떨어지고 깨진 하트가 적음. 받은 하트 - 깨진 하트 = 점수
const HEART_T = 12
const HEART_LANES = 5
function Hearts({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const every = [0.8, 0.7, 0.6][level] // 몇 초마다 하나
  const fall = [2.2, 1.8, 1.4][level] // 위에서 바구니까지 초
  const goal = [6, 7, 8][level]
  const items = useMemo(() => {
    const r: { id: number; at: number; lane: number; bad: boolean }[] = []
    for (let i = 0; i * every + fall <= HEART_T - 0.2; i++) {
      const prev = r[i - 1]?.lane ?? 2
      const lane = Math.max(0, Math.min(HEART_LANES - 1, prev + rand(5) - 2)) // 앞 것과 두 줄 넘게 떨어지지 않게
      r.push({ id: i, at: 0.4 + i * every, lane, bad: i > 0 && Math.random() < [0.2, 0.28, 0.35][level] })
    }
    return r
  }, [every, fall, level])
  const [t, setT] = useState(0)
  const [lane, setLane] = useState(2)
  const laneRef = useRef(2)
  const [got, setGot] = useState<Record<number, 'good' | 'bad' | 'miss'>>({})
  const gotRef = useRef<Record<number, 'good' | 'bad' | 'miss'>>({})
  const score = Object.values(got).reduce((n, g) => n + (g === 'good' ? 1 : g === 'bad' ? -1 : 0), 0)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      setT(s)
      let changed = false
      for (const it of items) {
        if (gotRef.current[it.id] || s < it.at + fall) continue
        const hit = it.lane === laneRef.current
        gotRef.current = { ...gotRef.current, [it.id]: hit ? (it.bad ? 'bad' : 'good') : 'miss' }
        if (hit) sfx(it.bad ? 'bad' : 'pop')
        changed = true
      }
      if (changed) setGot(gotRef.current)
      if (s >= HEART_T) {
        const sc = Object.values(gotRef.current).reduce((n, g) => n + (g === 'good' ? 1 : g === 'bad' ? -1 : 0), 0)
        onDone(sc >= goal + 3 ? 2 : sc >= goal ? 1 : 0)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [items, fall, goal, onDone])
  const move = (to: number) => { const k = Math.max(0, Math.min(HEART_LANES - 1, to)); laneRef.current = k; setLane(k) }
  useKeys({ ArrowLeft: () => move(laneRef.current - 1), ArrowRight: () => move(laneRef.current + 1), KeyA: () => move(laneRef.current - 1), KeyD: () => move(laneRef.current + 1) })
  const laneX = (k: number) => 10 + k * 20
  const falling = items.filter((it) => t >= it.at && t < it.at + fall && !gotRef.current[it.id])
  const last = items.filter((it) => gotRef.current[it.id] && gotRef.current[it.id] !== 'miss' && t < it.at + fall + 0.35)
  return (
    <div className="mini-body">
      <p>💗 하트는 받고 💔 깨진 하트는 피하세요! 목표 {goal}개</p>
      <div className="heart-field">
        {Array.from({ length: HEART_LANES }, (_, k) => <button key={k} className="heart-lane" style={{ left: `${k * 20}%` }} onPointerDown={(e) => { e.preventDefault(); move(k) }} aria-label={`${k + 1}번 줄로`} />)}
        {falling.map((it) => <span key={it.id} className="heart-drop" style={{ left: `${laneX(it.lane)}%`, top: `${((t - it.at) / fall) * 78}%` }}>{it.bad ? '💔' : '💗'}</span>)}
        {last.map((it) => <span key={`p${it.id}`} className="heart-pop" style={{ left: `${laneX(it.lane)}%` }}>{gotRef.current[it.id] === 'good' ? '+1' : '-1'}</span>)}
        <span className="heart-basket" style={{ left: `${laneX(lane)}%` }}>🧺</span>
      </div>
      <div className="mini-grid two">
        <button onPointerDown={(e) => { e.preventDefault(); move(laneRef.current - 1) }}>◀</button>
        <button onPointerDown={(e) => { e.preventDefault(); move(laneRef.current + 1) }}>▶</button>
      </div>
      <div className="mini-big jua">💗 {score} · {Math.max(0, Math.ceil(HEART_T - t))}초</div>
      <KeyHint>← → 로 바구니를 옮겨요 (줄을 눌러도 돼요)</KeyHint>
    </div>
  )
}

// 홀짝 (2026-10-21 사용자, 야바위처럼): 주사위 두 개가 구르다 멈추기 직전에 컵이 덮음 → 홀·짝을 고르면 컵을 엶
// 운세가 좋으면 이겼을 때 크게 받음
function OddEven({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const final = useMemo<[number, number]>(() => [rand(6) + 1, rand(6) + 1], [])
  const [face, setFace] = useState<[number, number]>([1, 1])
  const [stage, setStage] = useState<'roll' | 'cover' | 'open'>('roll')
  const [bet, setBet] = useState<boolean | null>(null)
  useEffect(() => {
    const spin = setInterval(() => setFace([rand(6) + 1, rand(6) + 1]), 90)
    const cover = setTimeout(() => { setStage('cover'); sfx('cupDown') }, 1100) // 멈추기 직전에 컵이 덮음
    const stop = setTimeout(() => { clearInterval(spin); setFace(final) }, 1400)
    return () => { clearInterval(spin); clearTimeout(cover); clearTimeout(stop) }
  }, [final])
  const ready = stage === 'cover' && face === final
  const guess = (odd: boolean) => {
    if (!ready || bet !== null) return
    setBet(odd)
    setStage('open')
    sfx('cupUp')
    const win = ((final[0] + final[1]) % 2 === 1) === odd
    // 대박: 같은 숫자 두 개면 늘, 운세가 길·대길이면 절반 확률로 더 (운세 영향을 줄임, 10-31 사용자)
    setTimeout(() => onDone(win ? (final[0] === final[1] || (level === 0 && Math.random() < 0.5) ? 2 : 1) : 0), 1300)
  }
  useKeys({ ArrowLeft: () => guess(true), ArrowRight: () => guess(false) })
  const sum = final[0] + final[1]
  return (
    <div className="mini-body">
      <p>{stage === 'roll' ? '주사위를 굴리는 중…' : stage === 'cover' ? '컵 속 주사위 두 개의 합은 홀일까요, 짝일까요?' : `${final[0]} + ${final[1]} = ${sum} (${sum % 2 ? '홀' : '짝'})${((sum % 2 === 1) === bet) ? ' 맞혔다!' : ' 틀렸다…'}`}</p>
      <div className="cup-table">
        <div className="cup-dice">{face.map((f, i) => <span key={i} className={stage === 'roll' ? 'tumble' : ''}><DieFace value={f} size={46} /></span>)}</div>
        <div className={`cup cup-${stage}`} aria-hidden="true"><Cup width={176} /></div>
      </div>
      <div className="mini-grid two">
        <button disabled={!ready || bet !== null} onClick={() => guess(true)}>홀</button>
        <button disabled={!ready || bet !== null} onClick={() => guess(false)}>짝</button>
      </div>
      <KeyHint>← 홀 · → 짝</KeyHint>
    </div>
  )
}

// 카드 높낮이 두 판. 운세가 좋으면(쉬움) 두 번째 판에 다음 카드 힌트 (2026-10-31 사용자: 카지노는 실력 + 운세)
const drawCard = (prev: number) => { let n = rand(13) + 1; while (n === prev) n = rand(13) + 1; return n }
function HighLow({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const [cards, setCards] = useState(() => [rand(13) + 1])
  const [next, setNext] = useState(() => drawCard(cards[0])) // 다음 카드는 미리 뽑아 둠 (힌트가 맞게)
  const suits = useMemo(() => [rand(4), rand(4), rand(4)], [])
  const [right, setRight] = useState(0)
  const guess = (higher: boolean) => {
    if (cards.length > 2) return
    const prev = cards[cards.length - 1]
    const ok = higher ? next > prev : next < prev
    const r = right + (ok ? 1 : 0)
    setCards([...cards, next])
    setNext(drawCard(next))
    setRight(r)
    if (cards.length >= 2) setTimeout(() => onDone(r === 2 ? 2 : r === 1 ? 1 : 0), 700)
  }
  useKeys({ ArrowLeft: () => guess(true), ArrowRight: () => guess(false) })
  const doneGuess = cards.length > 2
  const hint = level === 0 && cards.length === 2 && !doneGuess
  return (
    <div className="mini-body">
      <p>다음 카드가 더 높을까, 낮을까? (2번)<br /><small>카드 숫자는 1~13 (A=1, J=11, Q=12, K=13), 같은 숫자는 안 나와요</small></p>
      {hint && <p className="note jua">🍀 운세 힌트: 다음 카드는 {next >= 7 ? '7 이상' : '7 미만'}이에요</p>}
      <div className="card-row">{cards.map((c, i) => <PlayingCard key={i} value={c} suit={suits[i]} size={84} />)}{!doneGuess && <span className="card-back" aria-hidden="true">?</span>}</div>
      <div className="mini-grid two">
        <button disabled={doneGuess} onClick={() => guess(true)}>높다</button>
        <button disabled={doneGuess} onClick={() => guess(false)}>낮다</button>
      </div>
      <KeyHint>← 높다 · → 낮다</KeyHint>
    </div>
  )
}

// 슬롯머신: 그림이 차례로 돌고, 멈춤을 누른 순간의 그림에서 멈춤 (2026-10-31 사용자: 진짜 타이밍)
// 운세가 나쁠수록 빨리 돌고, 멈출 때 한 칸 미끄러질 때가 많음
const SLOT_FACES = ['seven', 'star', 'heart', 'diamond']
function Slot({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const tick = [220, 200, 180][level] // 그림 하나가 보이는 시간 (ms). 운세 차이는 작게 (10-31 사용자)
  const slip = [0.15, 0.2, 0.25][level] // 멈출 때 한 칸 더 넘어갈 확률
  const [pos, setPos] = useState(() => [rand(4), rand(4), rand(4)])
  const [stopped, setStopped] = useState([false, false, false])
  const [started, setStarted] = useState(false)
  const posRef = useRef(pos)
  posRef.current = pos
  const stoppedRef = useRef(stopped)
  stoppedRef.current = stopped
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  const start = () => {
    if (started) return
    setStarted(true)
    timer.current = setInterval(() => setPos((ps) => ps.map((x, i) => (stoppedRef.current[i] ? x : (x + 1) % 4))), tick)
  }
  const stop = (i: number) => {
    if (!started || stoppedRef.current[i]) return
    const at = Math.random() < slip ? (posRef.current[i] + 1) % 4 : posRef.current[i]
    const ps = posRef.current.map((x, k) => (k === i ? at : x))
    const next = stoppedRef.current.map((v, k) => v || k === i)
    stoppedRef.current = next
    posRef.current = ps
    setStopped(next)
    setPos(ps)
    if (next.every(Boolean)) {
      if (timer.current) clearInterval(timer.current)
      const same = Math.max(...ps.map((x) => ps.filter((y) => y === x).length))
      setTimeout(() => onDone(same === 3 ? 2 : same === 2 ? 1 : 0), 700)
    }
  }
  useKeys({ Space: () => { if (!started) start(); else { const k = stoppedRef.current.findIndex((v) => !v); if (k >= 0) stop(k) } } })
  return (
    <div className="mini-body">
      <p>그림이 ⑦ → ⭐ → ♥ → ◆ 순서로 돌아요. 원하는 그림이 왔을 때 멈춰서 셋을 맞추세요 (둘이면 조금 따요)</p>
      <KeyHint>스페이스바로 시작하고, 한 번 누를 때마다 하나씩 멈춰요</KeyHint>
      <div className="mini-seq slot">{pos.map((x, i) => <span key={i} className={stopped[i] ? 'stopped' : ''}>{started || stopped[i] ? <MiniIcon name={SLOT_FACES[x]} size={46} /> : '?'}</span>)}</div>
      {!started
        ? <button className="wide big" onPointerDown={(e) => e.preventDefault()} onClick={start}>시작</button>
        : <div className="mini-grid three">{[0, 1, 2].map((i) => <button key={i} disabled={stopped[i]} onClick={() => stop(i)}>멈춤 {i + 1}</button>)}</div>}
    </div>
  )
}

// 세계일주 사진 찍기 (2026-10-21 사용자, 수도 맞히기 대신): 랜드마크가 왔다 갔다, 사진 틀 안에 왔을 때 찰칵 (3장)
const SNAP_SPOTS = ['eiffel', 'liberty', 'castle', 'moai', 'pyramid', 'ferris']
function Snap({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const zone = [24, 17, 12][level] // 사진 틀 너비 (%)
  const speed = [0.6, 0.85, 1.1][level]
  const spots = useMemo(() => shuffle(SNAP_SPOTS).slice(0, 3), [])
  const [pos, setPos] = useState(0)
  const [shots, setShots] = useState<boolean[]>([])
  const [flash, setFlash] = useState(false)
  const t0 = useRef(performance.now() - Math.random() * 1000)
  const posAt = useCallback((now: number) => 50 + Math.sin(((now - t0.current) / 1000) * speed * Math.PI) * 46, [speed])
  useEffect(() => {
    if (flash) return
    let raf = 0
    const tick = (now: number) => { setPos(posAt(now)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [posAt, flash])
  const spotNow = spots[Math.max(0, Math.min(shots.length - (flash ? 1 : 0), 2))]
  useEffect(() => { report?.({ pos: Math.round(pos), zone, marks: shots.map((b) => (b ? 1 : 0)), item: spotNow }) }, [pos, zone, shots, spotNow, report])
  const shoot = () => {
    if (flash || shots.length >= 3) return
    const at = posAt(performance.now())
    setPos(at)
    setFlash(true)
    sfx('snap')
    const next = [...shots, Math.abs(at - 50) <= zone / 2]
    setShots(next)
    setTimeout(() => {
      if (next.length >= 3) { const n = next.filter(Boolean).length; onDone(n === 3 ? 2 : n === 2 ? 1 : 0); return }
      t0.current = performance.now() - Math.random() * 1000
      setFlash(false)
    }, 700)
  }
  const last = shots[shots.length - 1]
  return (
    <div className="mini-body">
      <p>{Math.min(shots.length + (flash ? 0 : 1), 3)}/3 · 랜드마크가 <b>사진 틀 안</b>에 왔을 때 찍으세요</p>
      <div className={`snap-view${flash ? ' flash' : ''}`}>
        <div className="snap-frame" style={{ left: `${50 - zone / 2}%`, width: `${zone}%` }} />
        <span className="snap-spot" style={{ left: `${pos}%` }}><MiniIcon name={spots[Math.max(0, Math.min(shots.length - (flash ? 1 : 0), 2))]} size={60} /></span>
      </div>
      <div className="snap-shots">{shots.map((ok, i) => <span key={i} className={ok ? 'ok' : 'no'}>{ok ? <MiniIcon name={spots[i]} size={30} /> : '흔들림'}</span>)}<b className="jua">{flash ? (last ? '잘 찍었다!' : '흔들렸다…') : ''}</b></div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); shoot() }}>찰칵!</button>
      <SpaceKey run={shoot} />
    </div>
  )
}

// 세계일주 짐 싸기 (2026-10-21 사용자, 기념품 고르기 대신): 하나씩 나오는 물건을 여행에 챙길지 고르기. 지력이 높으면 시간이 길다
const PACK_GOOD: [string, string][] = [['passport', '여권'], ['toothbrush', '칫솔'], ['charger', '충전기'], ['shirt', '옷'], ['sunscreen', '선크림'], ['camera', '카메라'], ['wallet', '지갑'], ['sunglasses', '선글라스']]
const PACK_BAD: [string, string][] = [['piano', '피아노'], ['plant', '화분'], ['sofa', '소파'], ['bowling', '볼링공'], ['bike', '자전거'], ['watermelon', '수박'], ['fishbowl', '어항'], ['tv', '텔레비전']]
function Pack({ level, onDone, report }: { level: number; onDone: (v: number) => void; report?: Report }) {
  const limit = [1800, 1400, 1050][level] // 2026-10-31 사용자: 30% 짧게 (2600·2000·1500 →)
  const items = useMemo(() => shuffle([...shuffle(PACK_GOOD).slice(0, 5).map((x) => ({ x, good: true })), ...shuffle(PACK_BAD).slice(0, 3).map((x) => ({ x, good: false }))]), [])
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [mark, setMark] = useState<boolean | null>(null)
  const doneRef = useRef(false)
  const pick = useCallback((take: boolean | null) => {
    if (doneRef.current || mark !== null) return
    const ok = take === items[i].good
    const r = right + (ok ? 1 : 0)
    setRight(r)
    setMark(ok)
    setTimeout(() => {
      setMark(null)
      if (i + 1 >= items.length) { doneRef.current = true; onDone(r >= 8 ? 2 : r >= 6 ? 1 : 0) }
      else setI(i + 1)
    }, 350)
  }, [i, items, mark, right, onDone])
  useEffect(() => {
    if (mark !== null || doneRef.current) return
    const t = setTimeout(() => pick(null), limit) // 시간이 지나면 틀린 것
    return () => clearTimeout(t)
  }, [i, mark, limit, pick])
  useEffect(() => { report?.({ item: items[i].x[0], n: i, m: items.length, right, ok: mark }) }, [i, items, right, mark, report])
  useKeys({ ArrowLeft: () => pick(true), ArrowRight: () => pick(false) })
  return (
    <div className="mini-body">
      <p>{i + 1}/{items.length} · 여행에 필요한 것만 챙기세요 · 맞힌 수 {right}</p>
      <div className={`mini-big jua pack-item${mark === null ? '' : mark ? ' ok' : ' no'}`} key={i}><MiniIcon name={items[i].x[0]} size={84} /><span>{items[i].x[1]}</span><i className="pack-timer" style={{ animationDuration: `${limit}ms` }} /></div>
      <div className="mini-grid two">
        <button onClick={() => pick(true)}>🧳 챙기기</button>
        <button onClick={() => pick(false)}>🙅 두고 가기</button>
      </div>
      <KeyHint>← 챙기기 · → 두고 가기</KeyHint>
    </div>
  )
}
