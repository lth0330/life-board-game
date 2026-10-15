import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MINI_NAMES } from '../engine/game'
import type { MiniState } from '../engine/types'

// 미니게임 화면. 결과: 0 실패, 1 성공, 2 대성공 (대결 timing은 0~100점)
// level 0 쉬움 ~ 2 어려움 (능력치가 높을수록 쉬움)

interface Props { mini: MiniState; onFinish: (value: number) => void }

const LEVEL_NAME = ['쉬움', '보통', '어려움']
const rand = (n: number) => Math.floor(Math.random() * n)
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

export function MiniGame({ mini, onFinish }: Props) {
  const [result, setResult] = useState<number | null>(null)
  const resultRef = useRef<number | null>(null)
  // 한 번만 결과를 받음 (타이머·StrictMode에서 두 번 불려도 안전)
  const done = useCallback((v: number) => {
    if (resultRef.current !== null) return
    resultRef.current = v
    setResult(v)
  }, [])
  const isDuel = !!mini.duel
  const body = (() => {
    switch (mini.game) {
      case 'tug': case 'throw': case 'confess': case 'timing':
        return <Timing level={mini.level} rounds={1} duel={isDuel} onDone={done} />
      case 'rhythm': return <Timing level={mini.level} rounds={3} duel={false} onDone={done} />
      case 'race': return <Mash level={mini.level} onDone={done} />
      case 'memory': return <Memory level={mini.level} symbols={['●', '■', '▲', '★', '♥', '◆']} onDone={done} />
      case 'photo': return <Memory level={mini.level} symbols={['파리', '도쿄', '뉴욕', '로마', '카이로', '시드니']} onDone={done} />
      case 'pairs': return <Pairs level={mini.level} onDone={done} />
      case 'quickmath': return <QuickMath level={mini.level} onDone={done} />
      case 'firstImpression': return <FirstImpression level={mini.level} onDone={done} />
      case 'oddEven': return <OddEven level={mini.level} onDone={done} />
      case 'highLow': return <HighLow onDone={done} />
      case 'slot': return <Slot level={mini.level} onDone={done} />
      case 'capital': return <Capital level={mini.level} onDone={done} />
      case 'souvenir': return <Souvenir onDone={done} />
      default: return <Souvenir onDone={done} />
    }
  })()
  return (
    <div className="sheet-backdrop mini-backdrop">
      <div className="sheet mini">
        <div className="mini-head">
          <h2 className="jua">{MINI_NAMES[mini.game]}</h2>
          <span className="mini-level">난이도 {LEVEL_NAME[mini.level]}</span>
        </div>
        {mini.stake ? <p className="note">판돈 {mini.stake.toLocaleString('ko-KR')}만</p> : null}
        {result === null ? body : (
          <div className="mini-result">
            <b className="jua">{isDuel ? `${result}점!` : ['아쉬워요', '성공!', '대성공!'][result]}</b>
            <button className="wide big" onClick={() => onFinish(result)}>확인</button>
          </div>
        )}
      </div>
    </div>
  )
}

// 바늘을 가운데에 멈추기. 쉬울수록 판정 범위가 넓고 바늘이 느림
function Timing({ level, rounds, duel, onDone }: { level: number; rounds: number; duel: boolean; onDone: (v: number) => void }) {
  const zone = [30, 20, 12][level]
  const speed = [0.9, 1.25, 1.6][level]
  const [pos, setPos] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const t0 = useRef(performance.now())
  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) * speed
      setPos(50 + Math.sin(t * Math.PI) * 50)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed])
  const stop = () => {
    const dist = Math.abs(pos - 50)
    const score = Math.max(0, Math.round(100 - dist * 2))
    const next = [...scores, score]
    setScores(next)
    t0.current = performance.now() - Math.random() * 800
    if (next.length >= rounds) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length
      if (duel) onDone(Math.round(avg))
      else onDone(avg >= 100 - zone ? 2 : avg >= 100 - zone * 1.8 ? 1 : 0)
    }
  }
  return (
    <div className="mini-body">
      <p>바늘이 가운데 초록 구역에 왔을 때 멈추세요{rounds > 1 ? ` (${scores.length + 1}/${rounds})` : ''}</p>
      <div className="gauge">
        <div className="gauge-zone" style={{ left: `${50 - zone / 2}%`, width: `${zone}%` }} />
        <div className="gauge-needle" style={{ left: `${pos}%` }} />
      </div>
      <button className="wide big" onClick={stop}>멈춰!</button>
    </div>
  )
}

// 5초 동안 많이 누르기 (운동회 달리기). 체력이 높으면 목표가 낮음
function Mash({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const goal = [18, 25, 32][level]
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
  const len = [3, 4, 6][level]
  const seq = useMemo(() => Array.from({ length: len }, () => symbols[rand(symbols.length)]), [len, symbols])
  const [show, setShow] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => { const t = setTimeout(() => setShow(false), 1200 + len * 500); return () => clearTimeout(t) }, [len])
  const pick = (x: string) => {
    const next = [...picked, x]
    setPicked(next)
    if (next.length === len) {
      const right = next.filter((v, i) => v === seq[i]).length
      onDone(right === len ? 2 : right >= Math.ceil(len / 2) ? 1 : 0)
    }
  }
  return (
    <div className="mini-body">
      <p>{show ? '순서를 기억하세요!' : `순서대로 고르세요 (${picked.length}/${len})`}</p>
      <div className="mini-seq">{(show ? seq : picked).map((x, i) => <span key={i}>{x}</span>)}</div>
      {!show && (
        <div className="mini-grid">
          {symbols.map((x) => <button key={x} onClick={() => pick(x)}>{x}</button>)}
        </div>
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
  const [left, setLeft] = useState(20)
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
  const [left, setLeft] = useState([14, 11, 9][level])
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
function FirstImpression({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const sc = useMemo(() => IMPRESSIONS[rand(IMPRESSIONS.length)], [])
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
function Capital({ level, onDone }: { level: number; onDone: (v: number) => void }) {
  const qs = useMemo(() => {
    const pool = CAPITALS.filter((c) => c[2] <= level)
    return shuffle(pool).slice(0, 3).map((c) => ({ country: c[0], ans: c[1], opts: shuffle([c[1], ...shuffle(CAPITALS.filter((x) => x[1] !== c[1])).slice(0, 2).map((x) => x[1])]) }))
  }, [level])
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
