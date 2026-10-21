import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MINI_NAMES } from '../engine/game'
import { sfx } from '../sound'
import { EventArt, Landmark } from '../art/More'
import type { MiniState } from '../engine/types'
import { Character, type Pose } from '../art/Character'
import { DEFAULT_OUTFIT, type Outfit } from '../engine/outfit'

// 미니게임 화면. 결과: 0 실패, 1 성공, 2 대성공 (대결 timing은 0~100점)
// level 0 쉬움 ~ 2 어려움 (능력치가 높을수록 쉬움)
// 2026-10-21 난이도 한 단계쯤 올림 (실력 게임만, 운·지식 게임은 그대로)

interface Props {
  mini: MiniState
  onFinish: (value: number) => void
  guide: { stat: string; reward: string } // 설명서: 무엇이 쉽게 해 주나, 보상
  practiceLimit: number // 연습 횟수 (혼자 무제한, 온라인 3번)
  outfit?: Outfit // 이 미니게임을 하는 사람 옷차림 (춤 동작 그림)
}

// 설명서: 게임 방법
const HOW: Record<string, string> = {
  race: '5초 동안 버튼을 최대한 많이 누르세요. 목표 횟수를 넘기면 대성공이에요.',
  tug: '왼손·오른손 버튼을 번갈아 눌러 줄을 당겨요. 같은 쪽만 누르면 안 당겨져요. 깃발을 끝까지 끌어오면 이겨요.',
  throw: '버튼을 꾹 누르고 있으면 힘이 찼다 빠졌다 해요. 힘이 초록 칸 가운데에 왔을 때 손을 떼세요.',
  memory: '잠깐 보여 주는 모양의 순서를 기억했다가 그대로 누르세요.',
  photo: '잠깐 보여 주는 여행지 순서를 기억했다가 그대로 누르세요.',
  pairs: '카드를 두 장씩 뒤집어 같은 그림을 모두 찾으세요. 시간이 정해져 있어요.',
  quickmath: '덧셈 문제 5개가 나와요. 알맞은 답을 빨리 고르세요.',
  firstImpression: '상황에 맞는 가장 좋은 말이나 행동을 고르세요.',
  rhythm: '음표 4개가 위에서 떨어져요. 노란 선에 닿을 때 "지금!"을 누르세요.',
  confess: '하트가 콩닥콩닥 커졌다 작아져요. 가장 커졌을 때 "고백!"을 누르세요.',
  dance: '화살표 춤 동작이 하나씩 나와요. 다 본 뒤 같은 순서로 화살표를 누르세요.',
  oddEven: '주사위 두 개의 합이 홀수일지 짝수일지 고르세요.',
  highLow: '다음 카드가 지금 카드보다 높을지 낮을지 두 번 맞히세요. 카드는 1~13이에요.',
  slot: '시작을 누르면 릴 3개가 돌아요. 버튼으로 하나씩 멈춰서 같은 그림을 맞추세요.',
  capital: '나라 이름을 보고 수도를 고르세요.',
  souvenir: '기념품 상자 3개 중 하나를 고르세요. 무엇이 들었는지는 운이에요.',
  timing: '바늘이 왔다 갔다 해요. 가운데 초록 구역에 왔을 때 "멈춰!"를 누르세요. 가운데에 가까울수록 점수가 높아요.',
}

const LEVEL_NAME = ['쉬움', '보통', '어려움']
const rand = (n: number) => Math.floor(Math.random() * n)
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
// 연습에서 나온 문제는 진짜 판에 다시 안 나오게 (퀴즈류). 이 미니게임 창이 열려 있는 동안만 기억
type Seen = Set<string>
const fresh = <T,>(pool: T[], key: (x: T) => string, seen: Seen) => { const left = pool.filter((x) => !seen.has(key(x))); return left.length ? left : pool }

// 미니게임 주제별 배경·그림 (이벤트 길과 같은 그림)
const MINI_THEME: Record<string, string> = {
  race: 'sport', tug: 'sport', throw: 'sport',
  memory: 'brain', pairs: 'brain', quickmath: 'brain',
  firstImpression: 'fest', rhythm: 'fest', confess: 'fest', dance: 'fest',
  oddEven: 'casino', highLow: 'casino', slot: 'casino',
  capital: 'travel', souvenir: 'travel', photo: 'travel',
}
const THEME_LANDMARK: Record<string, string> = { sport: '운동회', brain: '두뇌 올림피아드', fest: '축제 거리', casino: '카지노', travel: '세계일주' }

export function MiniGame({ mini, onFinish, guide, practiceLimit, outfit = DEFAULT_OUTFIT }: Props) {
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
  const seen = useRef<Seen>(new Set())
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
  const resultText = (v: number) => (isDuel ? `${v}점!` : ['아쉬워요', '성공!', '대성공!'][v])
  const play = (m: 'practice' | 'real') => { setPracticeResult(null); setRound((r) => r + 1); setMode(m) }
  const canPractice = practiced < practiceLimit
  const body = (() => {
    switch (mini.game) {
      case 'timing': return <Timing level={mini.level} rounds={1} duel={isDuel} onDone={done} />
      case 'tug': return <Tug level={mini.level} onDone={done} />
      case 'throw': return <Throw level={mini.level} onDone={done} />
      case 'confess': return <Confess level={mini.level} onDone={done} />
      case 'rhythm': return <Rhythm level={mini.level} onDone={done} />
      case 'dance': return <Dance level={mini.level} outfit={outfit} onDone={done} />
      case 'race': return <Mash level={mini.level} onDone={done} />
      case 'memory': return <Memory level={mini.level} symbols={['●', '■', '▲', '★', '♥', '◆']} onDone={done} />
      case 'photo': return <Memory level={mini.level} symbols={['파리', '도쿄', '뉴욕', '로마', '카이로', '시드니']} onDone={done} />
      case 'pairs': return <Pairs level={mini.level} onDone={done} />
      case 'quickmath': return <QuickMath level={mini.level} onDone={done} />
      case 'firstImpression': return <FirstImpression level={mini.level} seen={seen.current} onDone={done} />
      case 'oddEven': return <OddEven level={mini.level} onDone={done} />
      case 'highLow': return <HighLow onDone={done} />
      case 'slot': return <Slot level={mini.level} onDone={done} />
      case 'capital': return <Capital level={mini.level} seen={seen.current} onDone={done} />
      case 'souvenir': return <Souvenir onDone={done} />
      default: return <Souvenir onDone={done} />
    }
  })()
  return (
    <div className="sheet-backdrop mini-backdrop">
      <div className={`sheet mini theme-${MINI_THEME[mini.game] ?? 'duel'}`}>
        <div className="mini-art">{isDuel ? <EventArt type="afterRoll" /> : <Landmark name={THEME_LANDMARK[MINI_THEME[mini.game]] ?? ''} />}</div>
        <div className="mini-head">
          <h2 className="jua">{MINI_NAMES[mini.game]}</h2>
          <span className="mini-level">난이도 {LEVEL_NAME[mini.level]}</span>
        </div>
        {mini.stake ? <p className="note">판돈 {mini.stake.toLocaleString('ko-KR')}만</p> : null}
        {mode === 'intro' && (
          <div className="mini-intro">
            <button className="wide" onClick={() => setMode('help')}>📖 설명서</button>
            <button className="wide" disabled={!canPractice} onClick={() => { setPracticed((n) => n + 1); play('practice') }}>
              🔁 연습하기{Number.isFinite(practiceLimit) ? ` (남은 ${practiceLimit - practiced}번)` : ''}
            </button>
            <button className="wide big" onClick={() => play('real')}>▶ 시작</button>
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
  )
}

// 바늘을 가운데에 멈추기. 쉬울수록 판정 범위가 넓고 바늘이 느림
function Timing({ level, rounds, duel, onDone }: { level: number; rounds: number; duel: boolean; onDone: (v: number) => void }) {
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
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); stop() }} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop() } }}>멈춰!</button>
    </div>
  )
}

// 줄다리기: 왼쪽·오른쪽을 번갈아 눌러 줄을 당김. 상대는 계속 당김 (체력이 높을수록 상대가 약함)
function Tug({ level, onDone }: { level: number; onDone: (v: number) => void }) {
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
      if (el >= 6) { clearInterval(t); finish(posRef.current >= 50 ? 1 : 0) }
    }, 100)
    return () => clearInterval(t)
  }, [started, pull, finish])
  const tap = (side: 'L' | 'R') => {
    if (ended.current) return
    if (!started) setStarted(true)
    if (lastSide.current === side) return // 같은 쪽을 두 번 누르면 안 당겨짐
    lastSide.current = side
    posRef.current = Math.min(100, posRef.current + 7)
    setPos(posRef.current)
    if (posRef.current >= 100) finish(leftRef.current >= 2 ? 2 : 1)
  }
  return (
    <div className="mini-body">
      <p>왼손·오른손을 <b>번갈아</b> 눌러 줄을 당기세요! (6초)</p>
      <div className="tug-track"><div className="tug-flag" style={{ left: `${50 + pos / 2}%` }}>🚩</div></div>
      <div className="mini-big jua">{left}초</div>
      <div className="mini-grid two">
        <button onPointerDown={(e) => { e.preventDefault(); tap('L') }}>왼손</button>
        <button onPointerDown={(e) => { e.preventDefault(); tap('R') }}>오른손</button>
      </div>
    </div>
  )
}

// 공 던지기: 누르고 있으면 힘이 찼다 빠졌다 함. 목표 칸에서 손을 떼기
function Throw({ level, onDone }: { level: number; onDone: (v: number) => void }) {
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
      <div className="gauge">
        <div className="gauge-zone" style={{ left: `${target}%`, width: `${w}%` }} />
        <div className="power-fill" style={{ width: `${power}%` }} />
      </div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); down() }} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        {state === 'ready' ? '꾹 누르기' : state === 'hold' ? '…지금 떼기!' : '던졌다!'}
      </button>
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
      <div className="heart-box"><span className="heart" style={{ transform: `scale(${0.5 + beat * 0.7})` }}>💗</span></div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); press() }}>고백!</button>
    </div>
  )
}

// 무대 공연: 음표 4개가 떨어짐. 선에 닿을 때 누르기
function Rhythm({ level, onDone }: { level: number; onDone: (v: number) => void }) {
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
  const press = () => {
    const el = performance.now() - t0.current
    const m = marksRef.current
    const i = m.findIndex((x, k) => x === null && Math.abs(el - hits[k]) <= good)
    if (i < 0) return
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
          return <span key={i} className="rhythm-note" style={{ top: `${y}%` }}>♪</span>
        })}
      </div>
      <div className="mini-seq">{marks.map((x, i) => <span key={i}>{x === null ? '·' : ['놓침', '좋아', '딱!'][x]}</span>)}</div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); press() }}>♪ 지금!</button>
    </div>
  )
}

// 댄스 따라 하기: 화살표 순서를 보고 그대로 누르기 (매력이 높을수록 짧음)
const ARROWS = ['↑', '↓', '←', '→']
// 춤: 화살표 대신 내 캐릭터가 춤 동작을 보여 줌 (2026-10-17 사용자). ← 왼팔 · ↑ 두 팔 · → 오른팔 · ↓ 팔 벌리기
const POSE_OF: Record<string, Pose> = { '←': 'left', '↑': 'up', '→': 'right', '↓': 'out' }
const POSE_NAME: Record<string, string> = { '←': '왼팔', '↑': '만세', '→': '오른팔', '↓': '팔 벌리기' }
function Dance({ level, outfit, onDone }: { level: number; outfit: Outfit; onDone: (v: number) => void }) {
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
  const pick = (a: string) => {
    if (showing || picked.length >= len) return
    const next = [...picked, a]
    setPicked(next)
    if (next.length === len) {
      const right = next.filter((v, i) => v === seq[i]).length
      setTimeout(() => onDone(right === len ? 2 : right >= len - 1 ? 1 : 0), 400)
    }
  }
  return (
    <div className="mini-body">
      <p>{showing ? '춤 동작을 잘 보세요' : '본 순서대로 따라 하세요!'}</p>
      <div className="dance-stage" key={shown}>
        {showing
          ? <Character outfit={outfit} pose={POSE_OF[seq[shown]]} expr="happy" size={70} title={POSE_NAME[seq[shown]]} />
          : picked.length < len ? <Character outfit={outfit} pose="idle" size={70} title="따라 할 차례" /> : <b className="jua mini-big">끝!</b>}
      </div>
      <div className="mini-seq dance-seq">{Array.from({ length: len }, (_, i) => <span key={i}>{picked[i] ? <Character outfit={outfit} pose={POSE_OF[picked[i]]} size={14} /> : ''}</span>)}</div>
      <div className="mini-grid dance-btns">{ARROWS.map((a) => <button key={a} disabled={showing} onClick={() => pick(a)} aria-label={POSE_NAME[a]}><Character outfit={outfit} pose={POSE_OF[a]} size={20} /><small>{POSE_NAME[a]}</small></button>)}</div>
    </div>
  )
}

// 5초 동안 많이 누르기 (운동회 달리기). 체력이 높으면 목표가 낮음
function Mash({ level, onDone }: { level: number; onDone: (v: number) => void }) {
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
  return (
    <div className="mini-body">
      <p>5초 동안 최대한 많이 누르세요! 목표 {goal}번</p>
      <div className="mini-big jua">{count}번 · {left}초</div>
      <button className="wide big" onClick={() => { if (!started) setStarted(true); countRef.current++; setCount(countRef.current) }}>
        {started ? '달려!' : '누르면 시작'}
      </button>
    </div>
  )
}

// 잠깐 보여준 순서 기억하기. 지력이 높으면 개수가 적음
function Memory({ level, symbols, onDone }: { level: number; symbols: string[]; onDone: (v: number) => void }) {
  const len = [4, 5, 6][level]
  const seq = useMemo(() => Array.from({ length: len }, () => symbols[rand(symbols.length)]), [len, symbols])
  const [show, setShow] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => { const t = setTimeout(() => setShow(false), 1200 + len * 500); return () => clearTimeout(t) }, [len])
  // 잘못 누르면 하나 지우기, 다 고르면 '확인'으로 끝 (2026-10-21 사용자)
  const pick = (x: string) => { if (picked.length < len) setPicked([...picked, x]) }
  const confirm = () => {
    const right = picked.filter((v, i) => v === seq[i]).length
    onDone(right === len ? 2 : right >= Math.ceil(len / 2) ? 1 : 0)
  }
  return (
    <div className="mini-body">
      <p>{show ? '순서를 기억하세요!' : `순서대로 고르세요 (${picked.length}/${len})`}</p>
      <div className="mini-seq">{(show ? seq : picked).map((x, i) => <span key={i}>{x}</span>)}</div>
      {!show && (
        <>
          <div className="mini-grid">
            {symbols.map((x) => <button key={x} disabled={picked.length >= len} onClick={() => pick(x)}>{x}</button>)}
          </div>
          <div className="row">
            <button className="grow" disabled={!picked.length} onClick={() => setPicked(picked.slice(0, -1))}>⌫ 하나 지우기</button>
            <button className="grow" disabled={picked.length < len} onClick={confirm}>✅ 확인</button>
          </div>
        </>
      )}
    </div>
  )
}

// 같은 그림 찾기. 지력이 높으면 짝이 적음
function Pairs({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const n = [3, 4, 6][level]
  const deck = useMemo(() => shuffle([...'●■▲★♥◆'.slice(0, n), ...'●■▲★♥◆'.slice(0, n)]), [n])
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
            {open.includes(i) || found.includes(i) ? x : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

// 빠른 계산 5문제. 지력이 높으면 숫자가 작고 시간이 길다
function QuickMath({ level, onDone }: { level: number; onDone: (v: number) => void }) {
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
  return (
    <div className="mini-body">
      <p>{Math.min(i + 1, 5)}/5 · 남은 시간 {Math.max(0, left)}초 · 맞힌 수 {right}</p>
      <div className="mini-big jua">{q.a} + {q.b} = ?</div>
      <div className="mini-grid">
        {q.opts.map((o, k) => <button key={k} onClick={() => { if (o === q.ans) setRight((r) => r + 1); setI((x) => x + 1) }}>{o}</button>)}
      </div>
    </div>
  )
}

const IMPRESSIONS = [
  { q: '축제에서 눈이 마주쳤다. 뭐라고 할까?', a: ['저기, 혹시 같이 구경할래요?', '(못 본 척한다)', '음식이 맛있네요, 하나 드실래요?', '제 팔로워 수 아세요?'], best: [0, 2] },
  { q: '상대가 공연을 보며 웃는다.', a: ['이 노래 좋아하세요?', '저 가수 별로던데요', '같이 앞쪽으로 가 볼래요?', '(휴대폰만 본다)'], best: [0, 2] },
  { q: '비가 오기 시작했다!', a: ['제 우산 같이 써요', '(혼자 뛰어간다)', '근처 카페로 피할까요?', '비 맞는 것도 낭만이죠'], best: [0, 2] },
]

// 첫인상 고르기. 매력이 높으면 선택지가 적고 쉬움
function FirstImpression({ level, seen, onDone }: { level: number; seen: Seen; onDone: (v: number) => void }) {
  const sc = useMemo(() => { const pool = fresh(IMPRESSIONS, (x) => x.q, seen); const pick = pool[rand(pool.length)]; seen.add(pick.q); return pick }, [seen])
  const shown = useMemo(() => {
    const idx = sc.a.map((_, i) => i)
    const bad = idx.filter((i) => !sc.best.includes(i))
    const keepBad = bad.slice(0, [1, 2, 2][level])
    const keepGood = level === 2 ? [sc.best[0]] : sc.best
    return shuffle([...keepGood, ...keepBad])
  }, [sc, level])
  return (
    <div className="mini-body">
      <p>{sc.q}</p>
      <div className="options">
        {shown.map((i) => <button key={i} onClick={() => onDone(sc.best.includes(i) ? (Math.random() < [0.8, 0.6, 0.5][level] ? 2 : 1) : 0)}><b>{sc.a[i]}</b></button>)}
      </div>
    </div>
  )
}

// 홀짝: 주사위 두 개 합. 운세가 좋으면 이겼을 때 크게 받음
function OddEven({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const [dice, setDice] = useState<[number, number] | null>(null)
  const bet = (odd: boolean) => {
    const d: [number, number] = [rand(6) + 1, rand(6) + 1]
    setDice(d)
    const win = ((d[0] + d[1]) % 2 === 1) === odd
    setTimeout(() => onDone(win ? (level === 0 || d[0] === d[1] ? 2 : 1) : 0), 900)
  }
  return (
    <div className="mini-body">
      <p>주사위 두 개의 합이 홀일까요, 짝일까요?</p>
      {dice && <div className="mini-big jua">{dice[0]} + {dice[1]} = {dice[0] + dice[1]}</div>}
      <div className="mini-grid two">
        <button disabled={!!dice} onClick={() => bet(true)}>홀</button>
        <button disabled={!!dice} onClick={() => bet(false)}>짝</button>
      </div>
    </div>
  )
}

// 카드 높낮이 두 판
function HighLow({ onDone }: { onDone: (v: number) => void }) {
  const [cards, setCards] = useState(() => [rand(13) + 1])
  const [right, setRight] = useState(0)
  const guess = (higher: boolean) => {
    const prev = cards[cards.length - 1]
    let next = rand(13) + 1
    while (next === prev) next = rand(13) + 1
    const ok = higher ? next > prev : next < prev
    const r = right + (ok ? 1 : 0)
    setCards([...cards, next])
    setRight(r)
    if (cards.length >= 2) setTimeout(() => onDone(r === 2 ? 2 : r === 1 ? 1 : 0), 700)
  }
  const doneGuess = cards.length > 2
  return (
    <div className="mini-body">
      <p>다음 카드가 더 높을까, 낮을까? (2번)<br /><small>카드 숫자는 1~13 (A=1, J=11, Q=12, K=13), 같은 숫자는 안 나와요</small></p>
      <div className="mini-seq">{cards.map((c, i) => <span key={i}>{c}</span>)}</div>
      <div className="mini-grid two">
        <button disabled={doneGuess} onClick={() => guess(true)}>높다</button>
        <button disabled={doneGuess} onClick={() => guess(false)}>낮다</button>
      </div>
    </div>
  )
}

// 슬롯머신: 시작을 누르면 3개가 돌고, 아래 버튼으로 하나씩 멈춤. 결과는 운세가 좋을수록 잘 나옴
function Slot({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const faces = ['7', '★', '♥', '◆']
  const [reels, setReels] = useState(['?', '?', '?'])
  const [stopped, setStopped] = useState([false, false, false])
  const [plan, setPlan] = useState<{ grade: number; out: string[] } | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  const start = () => {
    const r = Math.random()
    const grade = r < [0.35, 0.2, 0.1][level] ? 2 : r < [0.75, 0.6, 0.45][level] ? 1 : 0
    const f = faces[rand(4)]
    const out = grade === 2 ? [f, f, f] : grade === 1 ? shuffle([f, f, faces[(faces.indexOf(f) + 1) % 4]]) : shuffle([faces[0], faces[1], faces[2]])
    setPlan({ grade, out })
    timer.current = setInterval(() => setReels((rs) => rs.map((x, i) => (stoppedRef.current[i] ? x : faces[rand(4)]))), 90)
  }
  const stoppedRef = useRef(stopped)
  stoppedRef.current = stopped
  const stop = (i: number) => {
    if (!plan || stopped[i]) return
    const next = stopped.map((v, k) => v || k === i)
    setStopped(next)
    stoppedRef.current = next
    setReels((rs) => rs.map((x, k) => (k === i ? plan.out[i] : x)))
    if (next.every(Boolean)) { if (timer.current) clearInterval(timer.current); setTimeout(() => onDone(plan.grade), 700) }
  }
  return (
    <div className="mini-body">
      <p>세 개가 같으면 대박, 두 개면 조금 따요. 버튼을 눌러 하나씩 멈춰요</p>
      <div className="mini-seq slot">{reels.map((x, i) => <span key={i} className={stopped[i] ? 'stopped' : ''}>{x}</span>)}</div>
      {!plan
        ? <button className="wide big" onClick={start}>시작</button>
        : <div className="mini-grid three">{[0, 1, 2].map((i) => <button key={i} disabled={stopped[i]} onClick={() => stop(i)}>멈춤 {i + 1}</button>)}</div>}
    </div>
  )
}

const CAPITALS: [string, string, number][] = [
  ['프랑스', '파리', 0], ['일본', '도쿄', 0], ['미국', '워싱턴', 0], ['영국', '런던', 0], ['중국', '베이징', 0],
  ['이탈리아', '로마', 1], ['독일', '베를린', 1], ['스페인', '마드리드', 1], ['캐나다', '오타와', 1], ['호주', '캔버라', 1],
  ['브라질', '브라질리아', 2], ['터키', '앙카라', 2], ['스위스', '베른', 2], ['뉴질랜드', '웰링턴', 2], ['베트남', '하노이', 2],
]

// 세계일주 수도 맞히기 3문제. 지력이 높으면 쉬운 나라가 나옴
function Capital({ level, seen, onDone }: { level: number; seen: Seen; onDone: (v: number) => void }) {
  const qs = useMemo(() => {
    const pool = fresh(CAPITALS.filter((c) => c[2] <= level), (c) => c[0], seen)
    const picks = shuffle(pool).slice(0, 3)
    picks.forEach((c) => seen.add(c[0]))
    return picks.map((c) => ({ country: c[0], ans: c[1], opts: shuffle([c[1], ...shuffle(CAPITALS.filter((x) => x[1] !== c[1])).slice(0, 2).map((x) => x[1])]) }))
  }, [level, seen])
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const answer = (o: string) => {
    const r = right + (o === qs[i].ans ? 1 : 0)
    setRight(r)
    if (i + 1 >= qs.length) onDone(r === 3 ? 2 : r >= 2 ? 1 : 0)
    else setI(i + 1)
  }
  const q = qs[i]
  return (
    <div className="mini-body">
      <p>{i + 1}/3 · {q.country}의 수도는?</p>
      <div className="mini-grid">{q.opts.map((o) => <button key={o} onClick={() => answer(o)}>{o}</button>)}</div>
    </div>
  )
}

// 기념품 상자 고르기 (순수 운)
function Souvenir({ onDone }: { onDone: (v: number) => void }) {
  const prizes = useMemo(() => shuffle([2, 1, 0]), [])
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="mini-body">
      <p>기념품 상자 하나를 고르세요</p>
      <div className="mini-grid three">
        {prizes.map((p, i) => (
          <button key={i} disabled={open !== null} onClick={() => { setOpen(i); setTimeout(() => onDone(p), 700) }}>
            {open === i ? ['꽝', '엽서', '보물'][p] : '상자'}
          </button>
        ))}
      </div>
    </div>
  )
}
