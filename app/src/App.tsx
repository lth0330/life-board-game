import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { aiStep } from './engine/ai'
import {
  ageOf, buyLottery, canAct, canUseCar, choose, createGame, cur, cureAddiction, finishMini, fortuneName, repayFriendLoan,
  repayLoans, requestFriendLoan, roll, stageOf, startSabotage, takeLoan, toggleInsurance, tradeStock, useChance,
} from './engine/game'
import { CARS } from './engine/data'
import type { Difficulty, GameState } from './engine/types'
import { Board, FullMap } from './ui/Board'
import { MiniGame } from './ui/MiniGames'
import { CardsSheet, FinanceSheet, GameOver, PeopleSheet, playerLine, won } from './ui/Sheets'

type Speed = 'fast' | 'normal' | 'slow'
const SPEED_MS: Record<Speed, number> = { fast: 450, normal: 1000, slow: 1700 }
const SAVE_KEY = 'life-board-game:save:v2' // 저장 형식이 바뀌면 숫자를 올림

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as GameState) : null
  } catch { return null }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [saved, setSaved] = useState<GameState | null>(() => loadSave())

  useEffect(() => {
    if (!game) return
    try {
      if (game.phase === 'gameover') localStorage.removeItem(SAVE_KEY)
      else localStorage.setItem(SAVE_KEY, JSON.stringify(game))
    } catch { /* 저장 못 해도 게임은 계속 */ }
  }, [game])

  if (!game) {
    return (
      <Setup
        saved={saved}
        onContinue={() => saved && setGame(saved)}
        onStart={(o) => {
          setSaved(null)
          setSpeed(o.speed)
          setGame(createGame({ humanName: o.name, humans: o.humans, aiCount: o.ai, settings: { startAdult: o.adult, difficulty: o.difficulty } }))
        }}
      />
    )
  }
  return <Play game={game} setGame={setGame} speed={speed} onQuit={() => { setSaved(loadSave()); setGame(null) }} />
}

interface SetupResult { name: string; humans: number; ai: number; adult: boolean; difficulty: Difficulty; speed: Speed }

function Choice<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={String(v)} className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}

function Setup({ onStart, saved, onContinue }: { onStart: (o: SetupResult) => void; saved: GameState | null; onContinue: () => void }) {
  const [name, setName] = useState('나')
  const [humans, setHumans] = useState(1)
  const [ai, setAi] = useState(3)
  const [adult, setAdult] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [speed, setSpeed] = useState<Speed>('normal')
  const maxAi = 4 - humans
  return (
    <div className="setup">
      <div className="setup-card">
        <h1 className="jua">인생게임</h1>
        <p className="muted">주사위 하나로 1살부터 노년까지. 돈과 행복을 합친 점수로 승부해요.</p>
        {saved && (
          <button className="wide big secondary" onClick={onContinue}>
            이어 하기 · {saved.stages[saved.stageIdx].name} 단계
          </button>
        )}
        <label className="field">
          <span>내 이름</span>
          <input value={name} maxLength={8} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field"><span>이 폰으로 같이 할 사람 (나 포함)</span>
          <Choice value={humans} options={[[1, '혼자'], [2, '2명'], [3, '3명'], [4, '4명']]} onChange={(v) => { setHumans(v); setAi(Math.min(ai, 4 - v)) }} />
        </div>
        <div className="field"><span>AI 수</span>
          <Choice value={Math.min(ai, maxAi)} options={([0, 1, 2, 3] as number[]).filter((n) => n <= maxAi && n + humans >= 2).map((n) => [n, `${n}명`] as [number, string])} onChange={setAi} />
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
        <button className="wide big" disabled={humans + Math.min(ai, maxAi) < 2} onClick={() => onStart({ name, humans, ai: Math.min(ai, maxAi), adult, difficulty, speed })}>
          게임 시작
        </button>
      </div>
    </div>
  )
}

type SheetKind = null | 'finance' | 'cards' | 'people' | 'map'

function Play({ game, setGame, speed, onQuit }: { game: GameState; setGame: (g: GameState) => void; speed: Speed; onQuit: () => void }) {
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [rolling, setRolling] = useState<number | null>(null)
  const [menu, setMenu] = useState(false)
  const [carMode, setCarMode] = useState(false)
  const gameRef = useRef(game)
  gameRef.current = game

  const act = useCallback((fn: (s: GameState) => void) => {
    const next = structuredClone(gameRef.current)
    next.banner = null
    next.speech = null
    fn(next)
    setGame(next)
  }, [setGame])

  const p = cur(game)
  const pending = game.pending
  const viewerIsActor = p.human
  const myTurn = p.human && canAct(game)
  const st = stageOf(game)

  // AI 진행
  useEffect(() => {
    if (game.phase === 'gameover' || rolling !== null) return
    const aiPending = pending && !game.players[pending.playerId].human
    const aiTurn = !pending && !p.human && game.phase === 'roll'
    if (!aiPending && !aiTurn) return
    const t = setTimeout(() => {
      if (aiTurn) {
        setRolling(1)
        setTimeout(() => { setRolling(null); act(aiStep) }, Math.min(700, SPEED_MS[speed]))
      } else act(aiStep)
    }, SPEED_MS[speed] + (game.banner ? 900 : 0))
    return () => clearTimeout(t)
  }, [game, pending, p.human, rolling, speed, act])

  // AI 말풍선도 잠깐 보였다가 사라짐
  const [speech, setSpeech] = useState(game.speech)
  useEffect(() => {
    if (!game.speech) return
    setSpeech(game.speech)
    const t = setTimeout(() => setSpeech(null), 2600)
    return () => clearTimeout(t)
  }, [game.speech])

  // 배너는 잠깐 보였다가 사라짐
  const [banner, setBanner] = useState(game.banner)
  useEffect(() => {
    if (!game.banner) return
    setBanner(game.banner)
    const t = setTimeout(() => setBanner(null), 1800)
    return () => clearTimeout(t)
  }, [game.banner])

  // 차 능력은 차례마다 새로 고름
  useEffect(() => { setCarMode(false) }, [game.turn])

  const doRoll = () => {
    if (!myTurn) return
    const useCar = carMode
    setRolling(1)
    setTimeout(() => { setRolling(null); act((s) => roll(s, 0, useCar)) }, 650)
  }
  const showCar = myTurn && canUseCar(p)

  const recent = game.log.slice(-3)
  const order = game.players

  return (
    <div className="play">
      <Board s={game} focus={p} showSteps={myTurn || (!p.human && game.phase === 'roll')} />

      <header className="hud">
        <div className="hud-row">
          <div className="jua hud-stage">{st.name} · {ageOf(game, p)}세</div>
          <div className="hud-money">돈 <b>{won(p.money)}</b> · 행복 <b>{p.happy}</b></div>
          <div className={`fortune f${p.fortune}`} title="오늘의 운세">{fortuneName(p.fortune)}</div>
        </div>
        <div className="hud-row">
          <div className="order">
            {order.map((q) => <i key={q.id} className={q.id === p.id ? 'now' : ''} style={{ background: q.color }} title={q.name} />)}
            <span className="muted">
              {p.human ? `${p.name} 차례` : `${p.name}(AI) 차례 · 보는 중`}
              {st.rolls ? ` · 남은 주사위 ${p.rollsLeft}/${st.rolls}` : ' · 골까지 경주'}
            </span>
          </div>
          <button className="gear" aria-label="설정" onClick={() => setMenu(true)}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
          </button>
        </div>
        <div className="hud-sub muted">{playerLine(game, p)}</div>
      </header>

      <div className="side-buttons">
        <button onClick={() => setSheet('map')}>지도</button>
        <button onClick={() => setSheet('people')}>사람들</button>
      </div>

      <div className="ticker">
        {recent.map((l, i) => (
          <div key={game.log.length - 3 + i} className={`log-${l.tone}`}>
            {l.playerId !== null && <b style={{ color: game.players[l.playerId].color }}>{game.players[l.playerId].name} </b>}{l.text}
          </div>
        ))}
      </div>

      {showCar && (
        <button className={`car-toggle ${carMode ? 'on' : ''}`} aria-pressed={carMode} onClick={() => setCarMode(!carMode)}>
          {CARS[p.car].name} ±1 {carMode ? '사용함' : '쓰기'} · 남은 {p.carCharges}번
        </button>
      )}

      <div className="controls">
        <button className="mid" onClick={() => setSheet('cards')}>카드{(p.chance || p.sabotage) ? <em>{(p.chance ? 1 : 0) + (p.sabotage ? 1 : 0)}</em> : null}</button>
        <button className="dice-btn" disabled={!myTurn || rolling !== null} onClick={doRoll}>
          {rolling !== null ? <Dice spinning /> : game.lastRoll && !myTurn ? <Dice value={game.lastRoll} /> : <span>주사위<br />던지기</span>}
        </button>
        <button className="mid" onClick={() => setSheet('finance')}>재테크</button>
      </div>

      {pending && (
        <div className="sheet-backdrop">
          <div className="sheet decision">
            <h2 className="jua">{pending.title}</h2>
            <p>{pending.text}</p>
            {!game.players[pending.playerId].human && <p className="note">{game.players[pending.playerId].name}(AI)가 고르는 중…</p>}
            <div className="options">
              {pending.options.map((o) => (
                <button key={o.id} disabled={o.disabled || !game.players[pending.playerId].human} onClick={() => act((s) => choose(s, o.id))}>
                  <b>{o.label}</b>{o.desc && <span>{o.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet === 'finance' && (
        <FinanceSheet
          s={game} p={p} canUse={myTurn}
          onLottery={() => act(buyLottery)} onCure={() => act(cureAddiction)}
          onTrade={(k, q) => act((s) => tradeStock(s, k, q))}
          onInsurance={(k) => act((s) => toggleInsurance(s, k))}
          onLoan={(a) => act((s) => takeLoan(s, a))} onRepay={() => act(repayLoans)}
          onFriendLoan={(id, a, r, t) => { setSheet(null); act((s) => requestFriendLoan(s, id, a, r, t)) }}
          onRepayFriend={(i) => act((s) => repayFriendLoan(s, i))}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'cards' && (
        <CardsSheet p={p} canUse={myTurn}
          onUseChance={() => { setSheet(null); act(useChance) }}
          onSabotage={() => { setSheet(null); act(startSabotage) }}
          onClose={() => setSheet(null)} />
      )}
      {sheet === 'people' && <PeopleSheet s={game} onClose={() => setSheet(null)} />}
      {sheet === 'map' && <FullMap s={game} onClose={() => setSheet(null)} />}

      {game.mini && game.players[game.mini.playerId].human && (
        <MiniGame key={`${game.turn}-${game.mini.game}`} mini={game.mini} onFinish={(v) => act((s) => finishMini(s, v))} />
      )}

      {speech && (
        <div className="speech" style={{ borderColor: game.players[speech.playerId].color }} role="status">
          <b style={{ color: game.players[speech.playerId].color }}>{game.players[speech.playerId].name}</b> {speech.text}
        </div>
      )}

      {banner && (
        <div className={`banner b-${banner.tone}`} role="status">
          <b className="jua">{banner.title}</b>
          <span>{banner.text}</span>
        </div>
      )}

      {menu && (
        <div className="sheet-backdrop" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="jua">설정</h2>
            <p className="muted">게임은 자동 저장돼요. 처음 화면에서 이어 할 수 있어요.</p>
            <button className="wide" onClick={() => setMenu(false)}>계속하기</button>
            <button className="wide secondary" onClick={onQuit}>처음 화면으로</button>
          </div>
        </div>
      )}

      {game.phase === 'gameover' && <GameOver s={game} onRestart={onQuit} />}
      {!viewerIsActor && <div className="spectate-badge">관전 중 · 조작은 {p.name}만</div>}
    </div>
  )
}

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }

function Dice({ value = 1, spinning = false }: { value?: number; spinning?: boolean }) {
  const v = Math.max(1, Math.min(6, value))
  return (
    <span className={`dice ${spinning ? 'spin' : ''}`} aria-label={spinning ? '주사위 굴러가는 중' : `주사위 ${value}`}>
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[v].includes(i) ? 'pip' : ''} />)}
      {value > 6 && <em>+{value - 6}</em>}
    </span>
  )
}
