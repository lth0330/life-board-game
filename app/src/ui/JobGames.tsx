import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { josa } from '../engine/josa'
import { sfx } from '../sound'
import { KeyHint, rand, shuffle, useKeys } from './MiniGames'

// 직업 미니게임 '오늘의 업무' (2026-11-02 사용자 B안: 직업마다 하나, 16개)
// 결과: 0 실패, 1 성공, 2 대성공. level 0 쉬움 ~ 2 어려움 (직업 주 능력치가 높을수록 쉬움)

type GameProps = { level: number; onDone: (v: number) => void }
const L3 = <T,>(level: number, a: [T, T, T]) => a[Math.max(0, Math.min(2, level))]
const gradeOf = (n: number, goal: number, great: number) => (n >= great ? 2 : n >= goal ? 1 : 0)

export const JOB_HOW: Record<string, string> = {
  jBox: '상대가 펀치를 준비하면 펀치가 오는 반대쪽으로 피하세요. "빈틈!"이 뜨면 🥊 반격을 누르세요. 8번 나와요.',
  jTactic: '상대 팀이 공격해 온 방향을 보고, 다음엔 어디로 올지 맞혀 수비를 세우세요. 5번 나와요.',
  jSuspect: '목격자가 말한 모자 색과 옷 색이 둘 다 맞는 사람을 찾아 누르세요. 5번 나와요.',
  jFire: '창문에 불이 붙으면 커지기 전에 눌러서 끄세요. 다 커지면 타 버려요. 12초 동안 해요.',
  jCpr: '원이 줄어들어 가운데 하트에 닿을 때마다 누르세요. 박자를 지켜야 해요. 보통·어려움은 중간부터 원이 안 보여요.',
  jLab: '보이는 색을 만들려면 어떤 물약 두 개를 섞어야 할까요? 5문제예요.',
  jBurger: '주문서에 적힌 순서대로 아래부터 재료를 쌓으세요. 틀리면 그 주문은 실패예요. 4개 주문을 받아요.',
  jStamp: '서류가 지나가요. 초록 칸 안에 왔을 때 "도장 쾅!"을 누르세요. 6장이에요.',
  jTicket: '번호를 1번부터 순서대로 빨리 누르세요. 틀리면 0.5초 늦어져요.',
  jGrade: '답안이 맞으면 ⭕, 틀리면 ❌를 빨리 누르세요. 8문제예요.',
  jBug: '코드 줄에 나타나는 🐛 버그를 숨기 전에 누르세요. ⭐ 새 기능은 누르면 안 돼요.',
  jObjection: '먼저 사건 내용을 외우세요. 그다음 증인 말이 사건과 다르면 "이의 있음!", 맞으면 "넘어가기"를 누르세요.',
  jIdol: '화살표 순서를 보고 그대로 빨리 누르세요. 틀리면 그 파트는 실패예요. 5파트예요.',
  jLines: '대사를 잠깐 보여 줘요. 외웠다가 빈칸에 들어갈 말을 고르세요. 5번 나와요.',
  jComment: '댓글이 하나씩 올라와요. 좋은 댓글은 💗, 악플은 🚫 차단을 누르세요. 10개예요.',
  jDeal: '"올리기"를 누를 때마다 계약금이 10%씩 올라요. 상대 표정을 보고 화내기 전에 "계약하기"를 누르세요. 너무 올리면 협상이 깨져요.',
}

// 차례대로 한 문제씩: 시간 안에 답하면 다음 문제. 다 하면 맞힌 수로 끝냄
function useRounds(total: number, limit: number, onEnd: (right: number) => void, pause = 450) {
  const [i, setI] = useState(0)
  const [marks, setMarks] = useState<boolean[]>([])
  const [fb, setFb] = useState<boolean | null>(null)
  const marksRef = useRef<boolean[]>([])
  const iRef = useRef(0)
  const busy = useRef(false)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  const answer = useCallback((ok: boolean) => {
    if (busy.current || iRef.current >= total) return
    busy.current = true
    marksRef.current = [...marksRef.current, ok]
    setMarks(marksRef.current)
    setFb(ok)
    sfx(ok ? 'pop' : 'bad')
    setTimeout(() => {
      busy.current = false
      setFb(null)
      const n = iRef.current + 1
      iRef.current = n
      if (n >= total) endRef.current(marksRef.current.filter(Boolean).length)
      else setI(n)
    }, pause)
  }, [total, pause])
  useEffect(() => {
    if (!limit) return
    const t = setTimeout(() => answer(false), limit * 1000)
    return () => clearTimeout(t)
  }, [i, limit, answer])
  return { i, marks, fb, answer, right: marks.filter(Boolean).length }
}

// 시간 막대 + 진행 표시
const Bar = ({ k, sec }: { k: number | string; sec: number }) => <i key={k} className="job-timer" style={{ animationDuration: `${sec}s` }} />
const Dots = ({ marks, total }: { marks: boolean[]; total: number }) => (
  <div className="job-dots">{Array.from({ length: total }, (_, k) => <span key={k} className={k < marks.length ? (marks[k] ? 'ok' : 'no') : ''} />)}</div>
)
const Fb = ({ fb }: { fb: boolean | null }) => (fb === null ? null : <div className={`job-fb ${fb ? 'ok' : 'no'}`}>{fb ? '⭕' : '❌'}</div>)

// 시간에 따라 움직이는 게임용: 시작부터 지난 초
function useClock(end: number, onEnd: () => void) {
  const [t, setT] = useState(0)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const s = Math.max(0, (now - t0) / 1000) // 첫 화면 시각이 시작보다 조금 앞설 수 있음
      setT(s)
      if (s >= end) { endRef.current(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end])
  return t
}

// ── 운동선수: 복싱 ──
function Boxing({ level, onDone }: GameProps) {
  const TOTAL = 8
  const limit = L3(level, [1.3, 1.0, 0.8])
  const moves = useMemo(() => Array.from({ length: TOTAL }, () => (Math.random() < 0.3 ? 'open' : Math.random() < 0.5 ? 'L' : 'R') as 'L' | 'R' | 'open'), [])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [5, 6, 6]), L3(level, [7, 7, 8]))), 500)
  const m = moves[Math.min(r.i, TOTAL - 1)]
  const act = (a: 'L' | 'R' | 'hit') => r.answer(m === 'open' ? a === 'hit' : m === 'L' ? a === 'R' : a === 'L')
  useKeys({ ArrowLeft: () => act('L'), ArrowRight: () => act('R'), ArrowUp: () => act('hit'), Space: () => act('hit') })
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="job-stage box-ring">
        <span className={`box-foe ${m === 'open' ? 'open' : ''}`}>{m === 'open' ? '😵' : '😠'}</span>
        {m !== 'open' && <span className={`box-glove ${m === 'L' ? 'left' : 'right'}`}>🥊</span>}
        <b className="box-call jua">{m === 'open' ? '빈틈!' : m === 'L' ? '← 왼쪽 펀치!' : '오른쪽 펀치! →'}</b>
        <Fb fb={r.fb} />
      </div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid">
        <button onPointerDown={(e) => { e.preventDefault(); act('L') }}>◀ 피하기</button>
        <button onPointerDown={(e) => { e.preventDefault(); act('hit') }}>🥊 반격</button>
        <button onPointerDown={(e) => { e.preventDefault(); act('R') }}>피하기 ▶</button>
      </div>
      <KeyHint>← → 피하기 · 스페이스 반격</KeyHint>
    </div>
  )
}

// ── 감독: 작전판 (다음 공격 방향 맞히기) ──
const SIDES = ['왼쪽', '가운데', '오른쪽']
const PATTERNS = [[0, 1, 0, 1, 0, 1], [0, 1, 2, 0, 1, 2], [0, 0, 1, 0, 0, 1], [0, 1, 1, 0, 1, 1], [0, 0, 1, 1, 0, 0], [0, 1, 2, 1, 0, 1]]
function Tactic({ level, onDone }: GameProps) {
  const TOTAL = 5
  const limit = L3(level, [9, 7, 5])
  const qs = useMemo(() => shuffle(PATTERNS).slice(0, TOTAL).map((pt) => { const map = shuffle([0, 1, 2]); return pt.map((x) => map[x]) }), [])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [3, 3, 4]), 5)))
  const q = qs[Math.min(r.i, TOTAL - 1)]
  useKeys({ Digit1: () => r.answer(q[5] === 0), Digit2: () => r.answer(q[5] === 1), Digit3: () => r.answer(q[5] === 2) })
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <p>상대 팀이 공격해 온 방향이에요. 다음엔 어디로 올까요?</p>
      <div className="tactic-board">
        {q.slice(0, 5).map((x, k) => <span key={k} className="tactic-row"><small>{k + 1}</small>{SIDES.map((_, c) => <i key={c} className={c === x ? 'on' : ''}>{c === x ? '⚽' : ''}</i>)}</span>)}
        <span className="tactic-row next"><small>?</small>{SIDES.map((_, c) => <i key={c}>❔</i>)}</span>
        <Fb fb={r.fb} />
      </div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid">{SIDES.map((sd, c) => <button key={c} onClick={() => r.answer(q[5] === c)}>{sd} 수비</button>)}</div>
      <KeyHint>1 왼쪽 · 2 가운데 · 3 오른쪽</KeyHint>
    </div>
  )
}

// ── 경찰: 범인 찾기 ──
const COLORS = [['빨간', '#E0503A'], ['파란', '#3A7BE0'], ['초록', '#3AA65A'], ['노란', '#F2C230'], ['보라', '#8A5AD0']] as const
function Suspect({ level, onDone }: GameProps) {
  const TOTAL = 5
  const limit = L3(level, [7, 5, 4])
  const size = L3(level, [6, 9, 12])
  const qs = useMemo(() => Array.from({ length: TOTAL }, () => {
    const hat = rand(5), shirt = rand(5)
    const people: [number, number][] = [[hat, shirt]]
    while (people.length < size) {
      const h = Math.random() < 0.45 ? hat : rand(5)
      const sh = h === hat ? (shirt + 1 + rand(4)) % 5 : Math.random() < 0.5 ? shirt : rand(5)
      people.push([h, sh])
    }
    return { hat, shirt, people: shuffle(people) }
  }), [size])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, 4, 5)))
  const q = qs[Math.min(r.i, TOTAL - 1)]
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <p className="jua center">🗣️ "<b style={{ color: COLORS[q.hat][1] }}>{COLORS[q.hat][0]} 모자</b>에 <b style={{ color: COLORS[q.shirt][1] }}>{COLORS[q.shirt][0]} 옷</b>이었어요!"</p>
      <div className={`sus-grid n${size}`}>
        {q.people.map(([h, sh], k) => (
          <button key={`${r.i}-${k}`} className="sus" onClick={() => r.answer(h === q.hat && sh === q.shirt)} aria-label={`${COLORS[h][0]} 모자 ${COLORS[sh][0]} 옷`}>
            <i className="sus-hat" style={{ background: COLORS[h][1] }} /><b>🙂</b><i className="sus-shirt" style={{ background: COLORS[sh][1] }} />
          </button>
        ))}
        <Fb fb={r.fb} />
      </div>
      <Bar k={r.i} sec={limit} />
    </div>
  )
}

// ── 소방관: 불 끄기 ──
const FIRE_T = 12
function Fire({ level, onDone }: GameProps) {
  const every = L3(level, [0.95, 0.75, 0.6])
  const life = L3(level, [3.0, 2.4, 1.9])
  const fires = useMemo(() => {
    const r: { id: number; at: number; win: number }[] = []
    const freeAt = Array(6).fill(0)
    for (let at = 0.5, id = 0; at + life <= FIRE_T; at += every * (0.7 + Math.random() * 0.6), id++) {
      const open = [0, 1, 2, 3, 4, 5].filter((w) => freeAt[w] <= at)
      if (!open.length) continue
      const win = open[rand(open.length)]
      freeAt[win] = at + life + 0.2
      r.push({ id, at, win })
    }
    return r
  }, [every, life])
  const outRef = useRef<Set<number>>(new Set())
  const [, setOut] = useState(0)
  const t = useClock(FIRE_T, () => {
    const burned = fires.filter((f) => !outRef.current.has(f.id)).length
    onDone(burned <= 1 ? 2 : burned <= 3 ? 1 : 0)
  })
  const active = (w: number) => fires.find((f) => f.win === w && t >= f.at && t < f.at + life && !outRef.current.has(f.id))
  const burnedNow = fires.filter((f) => t >= f.at + life && !outRef.current.has(f.id))
  const douse = (w: number) => { const f = active(w); if (!f) return; outRef.current.add(f.id); setOut((n) => n + 1); sfx('pop') }
  useKeys(Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap((n) => [[`Digit${n}`, () => douse(n - 1)], [`Numpad${n}`, () => douse(n - 1)]])))
  return (
    <div className="mini-body">
      <div className="fire-house">
        {Array.from({ length: 6 }, (_, w) => {
          const f = active(w)
          const k = f ? (t - f.at) / life : 0
          const lastBurn = [...burnedNow].reverse().find((b) => b.win === w)
          return (
            <button key={w} className={`fire-win${lastBurn && !f ? ' burnt' : ''}`} onPointerDown={(e) => { e.preventDefault(); douse(w) }} aria-label={`창문 ${w + 1}`}>
              {f && <span style={{ fontSize: `${18 + k * 30}px` }}>🔥</span>}
              <small>{w + 1}</small>
            </button>
          )
        })}
      </div>
      <div className="mini-big jua">🔥 끈 불 {outRef.current.size} · 탄 창문 {burnedNow.length} · {Math.max(0, Math.ceil(FIRE_T - t))}초</div>
      <KeyHint>숫자 1~6 (창문 번호)</KeyHint>
    </div>
  )
}

// ── 의사: 심폐소생술 (박자 맞추기) ──
const BEAT = 0.6
const BEATS = 12
const BEAT0 = 1.2
function Cpr({ level, onDone }: GameProps) {
  const tol = L3(level, [0.16, 0.12, 0.09])
  const hideFrom = L3(level, [99, 5, 4]) // 몇 번째 박자부터 원을 숨기나
  const hitRef = useRef<Set<number>>(new Set())
  const missRef = useRef(0)
  const [flash, setFlash] = useState<{ ok: boolean; n: number } | null>(null)
  const t0 = useRef(performance.now())
  const t = useClock(BEAT0 + BEAT * (BEATS - 1) + 0.6, () => {
    const score = hitRef.current.size - missRef.current
    onDone(gradeOf(score, L3(level, [7, 7, 8]), L3(level, [10, 10, 11])))
  })
  const press = () => {
    const now = (performance.now() - t0.current) / 1000
    const k = Math.round((now - BEAT0) / BEAT)
    const ok = k >= 0 && k < BEATS && Math.abs(now - (BEAT0 + k * BEAT)) <= tol && !hitRef.current.has(k)
    if (ok) hitRef.current.add(k)
    else missRef.current++
    setFlash({ ok, n: (flash?.n ?? 0) + 1 })
    sfx(ok ? 'pop' : 'bad')
  }
  useKeys({ Space: press })
  const k = Math.max(0, Math.ceil((t - BEAT0) / BEAT - 0.5))
  const into = t - (BEAT0 + (k - 1) * BEAT) // 지난 박자부터
  const ring = Math.max(0, 1 - into / BEAT) // 1 → 0이 되는 순간이 박자
  const show = k < hideFrom && k < BEATS
  return (
    <div className="mini-body">
      <p>{t < BEAT0 ? '준비…' : k >= hideFrom ? '이제 박자를 기억해서!' : '원이 하트에 닿을 때 누르세요'}</p>
      <button className="cpr-pad" onPointerDown={(e) => { e.preventDefault(); press() }}>
        {show && t >= BEAT0 - BEAT && <i className="cpr-ring" style={{ transform: `scale(${1 + ring * 1.6})` }} />}
        <span className={flash ? (flash.ok ? 'ok' : 'no') : ''} key={flash?.n}>❤️</span>
      </button>
      <div className="mini-big jua">맞춤 {hitRef.current.size}/{BEATS}{missRef.current ? ` · 엇박 ${missRef.current}` : ''}</div>
      <KeyHint>스페이스바로 눌러요</KeyHint>
    </div>
  )
}

// ── 과학자: 색 실험 ──
const DROPS: Record<string, [string, string]> = { r: ['빨강', '#E0403A'], b: ['파랑', '#2F6FE0'], y: ['노랑', '#F5D020'], w: ['하양', '#FFFFFF'], k: ['검정', '#222222'] }
const MIXES: { pair: [string, string]; color: string }[] = [
  { pair: ['r', 'b'], color: '#8A3FB0' }, { pair: ['r', 'y'], color: '#F08A24' }, { pair: ['b', 'y'], color: '#3AA64A' },
  { pair: ['r', 'w'], color: '#F5A3B5' }, { pair: ['b', 'w'], color: '#9CCBF5' }, { pair: ['k', 'w'], color: '#8C8C8C' }, { pair: ['y', 'w'], color: '#FBEFA0' },
]
function Lab({ level, onDone }: GameProps) {
  const TOTAL = 5
  const limit = L3(level, [8, 6, 4.5])
  const qs = useMemo(() => shuffle(MIXES).slice(0, TOTAL).map((m) => ({ m, opts: shuffle([m, ...shuffle(MIXES.filter((x) => x !== m)).slice(0, 3)]) })), [])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [3, 4, 4]), 5)))
  const q = qs[Math.min(r.i, TOTAL - 1)]
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="lab-target"><span className="flask" style={{ background: q.m.color }}>🧪</span><b className="jua">이 색을 만들려면?</b><Fb fb={r.fb} /></div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid two">
        {q.opts.map((o, k) => (
          <button key={k} className="lab-opt" onClick={() => r.answer(o === q.m)}>
            {o.pair.map((d) => <span key={d}><i style={{ background: DROPS[d][1] }} />{DROPS[d][0]}</span>)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 요리사: 주문 만들기 ──
const FOODS: Record<string, string> = { bun: '🍞', meat: '🥩', cheese: '🧀', lettuce: '🥬', tomato: '🍅' }
const FOOD_NAME: Record<string, string> = { bun: '빵', meat: '고기', cheese: '치즈', lettuce: '양상추', tomato: '토마토' }
function Burger({ level, onDone }: GameProps) {
  const TOTAL = 4
  const mid = L3(level, [2, 3, 4])
  const limit = L3(level, [9, 8, 7])
  const orders = useMemo(() => Array.from({ length: TOTAL }, () => ['bun', ...Array.from({ length: mid }, () => ['meat', 'cheese', 'lettuce', 'tomato'][rand(4)]), 'bun']), [mid])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, 3, 4)), 600)
  const [stack, setStack] = useState<string[]>([])
  useEffect(() => { setStack([]) }, [r.i])
  const order = orders[Math.min(r.i, TOTAL - 1)]
  const add = (f: string) => {
    if (r.fb !== null) return
    const next = [...stack, f]
    setStack(next)
    if (order[next.length - 1] !== f) { r.answer(false); return }
    sfx('step')
    if (next.length === order.length) r.answer(true)
  }
  useKeys(Object.fromEntries(Object.keys(FOODS).map((f, k) => [`Digit${k + 1}`, () => add(f)])))
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="burger-row">
        <div className="burger-ticket"><small>주문서 (아래부터)</small>{[...order].reverse().map((f, k) => <span key={k}>{FOODS[f]} {FOOD_NAME[f]}</span>)}</div>
        <div className="burger-plate">{[...stack].reverse().map((f, k) => <span key={k}>{FOODS[f]}</span>)}<i>🍽️</i><Fb fb={r.fb} /></div>
      </div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid food-grid">{Object.keys(FOODS).map((f) => <button key={f} onClick={() => add(f)}>{FOODS[f]}<small>{FOOD_NAME[f]}</small></button>)}</div>
      <KeyHint>숫자 1 빵 · 2 고기 · 3 치즈 · 4 양상추 · 5 토마토</KeyHint>
    </div>
  )
}

// ── 회사원: 결재 도장 ──
function Stamp({ level, onDone }: GameProps) {
  const DOCS = 6
  const dur = L3(level, [2.2, 1.8, 1.45])
  const zone = L3(level, [22, 16, 11])
  const hitRef = useRef<Map<number, boolean>>(new Map())
  const [, setN] = useState(0)
  const t = useClock(DOCS * dur, () => onDone(gradeOf([...hitRef.current.values()].filter(Boolean).length, L3(level, [4, 4, 5]), 6)))
  const i = Math.min(DOCS - 1, Math.floor(t / dur))
  const pos = ((t - i * dur) / dur) * 110 - 5
  const press = () => {
    if (hitRef.current.has(i)) return
    const ok = Math.abs(pos - 50) <= zone / 2
    hitRef.current.set(i, ok)
    setN((n) => n + 1)
    sfx(ok ? 'pop' : 'bad')
  }
  useKeys({ Space: press })
  const done = hitRef.current.get(i)
  return (
    <div className="mini-body">
      <div className="job-dots">{Array.from({ length: DOCS }, (_, k) => <span key={k} className={hitRef.current.has(k) ? (hitRef.current.get(k) ? 'ok' : 'no') : k < i ? 'no' : ''} />)}</div>
      <div className="stamp-track">
        <i className="stamp-zone" style={{ left: `${50 - zone / 2}%`, width: `${zone}%` }} />
        <span className="stamp-doc" style={{ left: `${pos}%` }}>📄{done !== undefined && <b className={done ? 'ok' : 'no'}>{done ? '승인' : '삐뚤'}</b>}</span>
      </div>
      <button className="wide big" onPointerDown={(e) => { e.preventDefault(); press() }}>🔴 도장 쾅!</button>
      <KeyHint>스페이스바로 도장</KeyHint>
    </div>
  )
}

// ── 공무원: 번호표 ──
function Ticket({ level, onDone }: GameProps) {
  const N = L3(level, [9, 9, 12])
  const limit = L3(level, [11, 9, 10])
  const nums = useMemo(() => shuffle(Array.from({ length: N }, (_, k) => k + 1)), [N])
  const [next, setNext] = useState(1)
  const [penalty, setPenalty] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const finished = useRef(false)
  const t = useClock(limit, () => { if (!finished.current) { finished.current = true; onDone(0) } })
  const used = t + penalty
  useEffect(() => { if (used >= limit && !finished.current) { finished.current = true; onDone(0) } }, [used, limit, onDone])
  const tap = (n: number) => {
    if (finished.current) return
    if (n !== next) { setPenalty((p) => p + 0.5); setWrong(n); sfx('bad'); return }
    sfx('pop')
    if (n === N) { finished.current = true; onDone(used <= limit * 0.6 ? 2 : 1); return }
    setNext(n + 1)
  }
  return (
    <div className="mini-body">
      <p>다음 번호: <b className="jua">{next}번</b> 손님!</p>
      <div className={`ticket-grid n${N}`}>
        {nums.map((n) => <button key={n} className={`${n < next ? 'done' : ''}${wrong === n ? ' wrong' : ''}`} disabled={n < next} onClick={() => tap(n)}>{n}</button>)}
      </div>
      <i className="job-timer" style={{ animationDuration: `${limit}s` }} />
      <div className="mini-big jua">{Math.max(0, limit - used).toFixed(1)}초{penalty ? ` (−${penalty}초)` : ''}</div>
      <p className="muted center">⏱️ 남은 시간의 40% 넘게 남기고 끝내면 대성공</p>
    </div>
  )
}

// ── 교사: 채점 ──
function Grade({ level, onDone }: GameProps) {
  const TOTAL = 8
  const limit = L3(level, [3.2, 2.5, 2.0])
  const qs = useMemo(() => Array.from({ length: TOTAL }, () => {
    const a = 2 + rand(L3(level, [8, 12, 15])), b = 2 + rand(L3(level, [8, 12, 15]))
    const ok = Math.random() < 0.5
    const off = ok ? 0 : (Math.random() < 0.5 ? -1 : 1) * (1 + rand(L3(level, [3, 2, 1])))
    return { a, b, ans: a + b + off, ok }
  }), [level])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [6, 6, 7]), 8)), 350)
  const q = qs[Math.min(r.i, TOTAL - 1)]
  useKeys({ ArrowLeft: () => r.answer(q.ok), ArrowRight: () => r.answer(!q.ok), KeyO: () => r.answer(q.ok), KeyX: () => r.answer(!q.ok) })
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="grade-paper jua">{q.a} + {q.b} = {q.ans}<Fb fb={r.fb} /></div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid two">
        <button className="big" onClick={() => r.answer(q.ok)}>⭕ 맞아요</button>
        <button className="big" onClick={() => r.answer(!q.ok)}>❌ 틀려요</button>
      </div>
      <KeyHint>← ⭕ · → ❌</KeyHint>
    </div>
  )
}

// ── 개발자: 버그 잡기 ──
const CODE = ['const life = start()', 'if (happy) smile()', 'for (const day of days)', '  work(day)', 'save(money)', 'return dream']
function Bug({ level, onDone }: GameProps) {
  const TOTAL = 12
  const up = L3(level, [1.15, 0.9, 0.72])
  const gap = 0.3
  const items = useMemo(() => { const r: { line: number; good: boolean }[] = []; for (let k = 0; k < TOTAL; k++) { let l = rand(6); if (r[k - 1]?.line === l) l = (l + 1 + rand(5)) % 6; r.push({ line: l, good: k > 1 && Math.random() < 0.25 }) } return r }, [])
  const tapped = useRef<Map<number, boolean>>(new Map())
  const [, setN] = useState(0)
  const bugs = items.filter((x) => !x.good).length
  const t = useClock(TOTAL * (up + gap) + 0.3, () => {
    const hits = [...tapped.current.entries()].filter(([k]) => !items[k].good).length
    const bad = [...tapped.current.entries()].filter(([k]) => items[k].good).length
    const score = hits - bad
    onDone(score >= bugs - 1 ? 2 : score >= bugs - L3(level, [4, 3, 3]) ? 1 : 0)
  })
  const i = Math.floor(t / (up + gap))
  const showing = i < TOTAL && t - i * (up + gap) >= gap && !tapped.current.has(i)
  const tap = (line: number) => {
    if (!showing || items[i].line !== line) return
    tapped.current.set(i, true)
    setN((n) => n + 1)
    sfx(items[i].good ? 'bad' : 'pop')
  }
  useKeys(Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`Digit${n}`, () => tap(n - 1)])))
  const caught = [...tapped.current.keys()].filter((k) => !items[k].good).length
  return (
    <div className="mini-body">
      <div className="code-box">
        {CODE.map((c, l) => (
          <button key={l} className="code-line" onPointerDown={(e) => { e.preventDefault(); tap(l) }}>
            <small>{l + 1}</small><code>{c}</code>
            {showing && items[i].line === l && <span className="code-bug">{items[i].good ? '⭐' : '🐛'}</span>}
          </button>
        ))}
      </div>
      <div className="mini-big jua">🐛 {caught}/{bugs} · {Math.min(i + 1, TOTAL)}/{TOTAL}</div>
      <KeyHint>숫자 1~6 (줄 번호)</KeyHint>
    </div>
  )
}

// ── 변호사: 이의 있음! ──
const FACTS: [string, string[], (v: string) => string][] = [
  ['시간', ['아침 8시', '낮 12시', '저녁 6시', '밤 10시'], (v) => `그때는 ${v}쯤이었어요.`],
  ['장소', ['공원', '시장', '학교 앞', '지하철역'], (v) => `저는 ${v}에서 봤어요.`],
  ['물건', ['빨간 우산', '검은 가방', '파란 모자', '하얀 자전거'], (v) => `그 사람은 ${josa(v, '을/를')} 갖고 있었어요.`],
  ['날씨', ['비', '눈', '맑음', '안개'], (v) => ({ 비: '비가 오고 있었어요.', 눈: '눈이 오고 있었어요.', 맑음: '날씨가 맑았어요.', 안개: '안개가 끼어 있었어요.' } as Record<string, string>)[v]],
]
function Objection({ level, onDone }: GameProps) {
  const TOTAL = 5
  const read = L3(level, [7, 5.5, 4.5])
  const limit = L3(level, [5, 4, 3])
  const facts = useMemo(() => FACTS.map(([, vs]) => vs[rand(vs.length)]), [])
  const qs = useMemo(() => Array.from({ length: TOTAL }, () => {
    const f = rand(FACTS.length)
    const lie = Math.random() < 0.5
    const v = lie ? shuffle(FACTS[f][1].filter((x) => x !== facts[f]))[0] : facts[f]
    return { text: FACTS[f][2](v), lie }
  }), [facts])
  const [reading, setReading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setReading(false), read * 1000); return () => clearTimeout(t) }, [read])
  const r = useRounds(TOTAL, reading ? 0 : limit, (n) => onDone(gradeOf(n, L3(level, [3, 4, 4]), 5)), 500)
  const q = qs[Math.min(r.i, TOTAL - 1)]
  const say = (objection: boolean) => { if (!reading) r.answer(objection === q.lie) }
  useKeys({ ArrowLeft: () => say(true), ArrowRight: () => say(false) })
  if (reading) return (
    <div className="mini-body">
      <p className="jua center">📁 사건 기록을 외우세요!</p>
      <div className="case-card">{FACTS.map(([name], k) => <div key={k}><small>{name}</small> <b>{facts[k]}</b></div>)}</div>
      <Bar k="read" sec={read} />
    </div>
  )
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="witness">🧑‍💼 <span>"{q.text}"</span><Fb fb={r.fb} /></div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid two">
        <button className="big objection" onClick={() => say(true)}>☝️ 이의 있음!</button>
        <button className="big" onClick={() => say(false)}>넘어가기</button>
      </div>
      <KeyHint>← 이의 있음 · → 넘어가기</KeyHint>
    </div>
  )
}

// ── 아이돌: 하이라이트 파트 (화살표 따라 누르기) ──
const ARROWS = ['←', '↑', '↓', '→']
function Idol({ level, onDone }: GameProps) {
  const TOTAL = 5
  const len = L3(level, [3, 4, 5])
  const limit = L3(level, [4.5, 4, 3.6])
  const seqs = useMemo(() => Array.from({ length: TOTAL }, () => Array.from({ length: len }, () => rand(4))), [len])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [3, 4, 4]), 5)))
  const [pos, setPos] = useState(0)
  useEffect(() => { setPos(0) }, [r.i])
  const seq = seqs[Math.min(r.i, TOTAL - 1)]
  const hit = (a: number) => {
    if (r.fb !== null) return
    if (seq[pos] !== a) { r.answer(false); return }
    sfx('step')
    if (pos + 1 === seq.length) r.answer(true)
    else setPos(pos + 1)
  }
  useKeys({ ArrowLeft: () => hit(0), ArrowUp: () => hit(1), ArrowDown: () => hit(2), ArrowRight: () => hit(3) })
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="idol-stage">🎤<div className="idol-seq">{seq.map((a, k) => <b key={k} className={k < pos ? 'done' : k === pos ? 'now' : ''}>{ARROWS[a]}</b>)}</div><Fb fb={r.fb} /></div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid four">{ARROWS.map((a, k) => <button key={k} className="big" onPointerDown={(e) => { e.preventDefault(); hit(k) }}>{a}</button>)}</div>
      <KeyHint>방향키 ← ↑ ↓ →</KeyHint>
    </div>
  )
}

// ── 배우: 대사 외우기 ──
const LINES: [string, string, string, string][] = [
  ['오늘 밤, ___이 유난히 밝네요.', '별', '달', '해'],
  ['나는 아직 ___을 포기하지 않았어.', '꿈', '밥', '집'],
  ['그 ___, 절대 열지 마세요!', '상자', '창문', '냉장고'],
  ['비가 그치면 ___에서 만나요.', '정류장', '도서관', '바닷가'],
  ['당신의 ___ 소리가 들려요.', '웃음', '발', '노래'],
  ['우리 ___은 이제 시작이야.', '이야기', '여행', '싸움'],
  ['내일도 ___처럼 해가 뜰 거예요.', '오늘', '어제', '언제나'],
  ['이 ___ 하나면 충분해요.', '편지', '사진', '반지'],
  ['다시는 ___ 하지 않을게요.', '거짓말', '지각', '불평'],
  ['기차가 떠나기 ___ 전이에요.', '5분', '1시간', '하루'],
]
function Lines({ level, onDone }: GameProps) {
  const TOTAL = 5
  const show = L3(level, [3.2, 2.5, 1.9])
  const qs = useMemo(() => shuffle(LINES).slice(0, TOTAL).map(([l, a, b, c]) => ({ l, a, opts: shuffle([a, b, c]) })), [])
  const [peek, setPeek] = useState(true)
  const r = useRounds(TOTAL, peek ? 0 : 6, (n) => onDone(gradeOf(n, L3(level, [3, 4, 4]), 5)), 500)
  useEffect(() => { setPeek(true); const t = setTimeout(() => setPeek(false), show * 1000); return () => clearTimeout(t) }, [r.i, show])
  const q = qs[Math.min(r.i, TOTAL - 1)]
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="script jua">🎬 {peek ? q.l.replace('___', q.a) : q.l}<Fb fb={r.fb} /></div>
      {peek ? <Bar k={`p${r.i}`} sec={show} /> : <Bar k={r.i} sec={6} />}
      <div className="mini-grid">{q.opts.map((o) => <button key={o} disabled={peek} onClick={() => r.answer(o === q.a)}>{o}</button>)}</div>
    </div>
  )
}

// ── 유튜버: 댓글 관리 ──
const GOOD_C = ['영상 너무 재밌어요!', '오늘도 힐링하고 가요', '편집 실력 늘었네요 👍', '구독 눌렀어요!', '다음 영상 기다릴게요', '덕분에 웃었어요 ㅋㅋ', '설명이 쉬워서 좋아요', '첫 댓글이다!', '목소리가 좋아요', '알림 설정 완료!']
const BAD_C = ['재미없음 ㅋ', '이걸 왜 올림?', '광고 클릭하면 돈 드림 →', '시간 아깝다', '구독자 사요 010-****', '얼굴 공개 안 함?', '노잼 그만해', '내 채널 와 주세요 맞구독', '이거 다 거짓말임', '싫어요 누르고 감']
function Comment({ level, onDone }: GameProps) {
  const TOTAL = 10
  const limit = L3(level, [2.8, 2.2, 1.7])
  const qs = useMemo(() => Array.from({ length: TOTAL }, () => { const good = Math.random() < 0.5; return { good, text: (good ? GOOD_C : BAD_C)[rand(10)] } }), [])
  const r = useRounds(TOTAL, limit, (n) => onDone(gradeOf(n, L3(level, [7, 8, 8]), L3(level, [9, 10, 10]))), 300)
  const q = qs[Math.min(r.i, TOTAL - 1)]
  useKeys({ ArrowLeft: () => r.answer(q.good), ArrowRight: () => r.answer(!q.good) })
  return (
    <div className="mini-body">
      <Dots marks={r.marks} total={TOTAL} />
      <div className="comment-card" key={r.i}><span className="avatar">👤</span><span>{q.text}</span><Fb fb={r.fb} /></div>
      <Bar k={r.i} sec={limit} />
      <div className="mini-grid two">
        <button className="big" onClick={() => r.answer(q.good)}>💗 좋아요</button>
        <button className="big" onClick={() => r.answer(!q.good)}>🚫 차단</button>
      </div>
      <KeyHint>← 💗 · → 🚫</KeyHint>
    </div>
  )
}

// ── 사업가: 협상 (욕심 조절) ──
function Deal({ level, onDone }: GameProps) {
  const limitStep = useMemo(() => 3 + rand(7), []) // 몇 번까지 올려도 괜찮나 (3~9번)
  const [step, setStep] = useState(0)
  const [end, setEnd] = useState<'deal' | 'broke' | null>(null)
  const left = limitStep - step // 남은 안전한 올리기
  const face = (() => {
    const th = L3(level, [[4, 2, 1], [3, 1, 0], [2, 0, -1]] as [number[], number[], number[]])
    return left >= th[0] ? '😊' : left >= th[1] ? '😐' : left >= th[2] ? '😠' : '😐'
  })()
  const raise = () => {
    if (end) return
    if (step + 1 > limitStep) { setEnd('broke'); sfx('bad'); setTimeout(() => onDone(0), 900); return }
    setStep(step + 1); sfx('coin')
  }
  const sign = () => {
    if (end) return
    setEnd('deal'); sfx('pop')
    setTimeout(() => onDone(left <= 1 ? 2 : left <= 2 ? 1 : 0), 900)
  }
  useKeys({ ArrowUp: raise, Space: sign })
  return (
    <div className="mini-body">
      <div className="deal-table">
        <span className="deal-face">{end === 'broke' ? '😡' : end === 'deal' ? '🤝' : face}</span>
        <b className="jua">계약금 {100 + step * 10}%</b>
        {end && <small>{end === 'broke' ? '협상이 깨졌어요… (이번엔 원래 보너스의 절반만)' : `상대는 ${100 + limitStep * 10}%까지 괜찮았대요`}</small>}
      </div>
      <div className="mini-grid two">
        <button className="big" disabled={!!end} onClick={raise}>⬆️ 올리기 (+10%)</button>
        <button className="big" disabled={!!end} onClick={sign}>✍️ 계약하기</button>
      </div>
      <p className="muted center">상대 한계에 가까울수록 결과가 좋아요 (한계 1번 앞이면 대성공, 2번 앞이면 성공)</p>
      <KeyHint>↑ 올리기 · 스페이스 계약</KeyHint>
    </div>
  )
}

export const JOB_GAME_UI: Record<string, ComponentType<GameProps>> = {
  jBox: Boxing, jTactic: Tactic, jSuspect: Suspect, jFire: Fire, jCpr: Cpr, jLab: Lab, jBurger: Burger, jStamp: Stamp,
  jTicket: Ticket, jGrade: Grade, jBug: Bug, jObjection: Objection, jIdol: Idol, jLines: Lines, jComment: Comment, jDeal: Deal,
}
export const JOB_ICON: Record<string, string> = {
  jBox: '🥊', jTactic: '📋', jSuspect: '🚓', jFire: '🚒', jCpr: '🩺', jLab: '🧪', jBurger: '🍔', jStamp: '📄',
  jTicket: '🎫', jGrade: '✏️', jBug: '🐛', jObjection: '⚖️', jIdol: '🎤', jLines: '🎬', jComment: '💬', jDeal: '🤝',
}
