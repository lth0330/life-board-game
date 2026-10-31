import { josa } from '../engine/josa'
import { useState, type ReactNode } from 'react'
import { Character } from '../art/Character'
import { Trophy } from '../art/More'
import { CARS, CHANCE_NAMES, DICE_ITEMS, HOUSE_RULES, HOUSES, INSURANCE, JOB_PROS_CONS, JOBS, KIDS, MEDALS, SABOTAGE_NAMES, SAVINGS_FEE, SAVINGS_PLANS, SECTORS } from '../engine/data'
import {
  ageOf, moodLevel, moodOf, MOOD_FACES, MOOD_HELP, MOOD_NAMES, MOOD_TURNS, AWARD_POINTS, awardsOf, canBankLoan, canBorrowFrom, loanCap, LOAN_RATE, LOAN_TURNS, fortuneName, friendDebt, houseValue, isAdultStage, jobOf, kidAllowance, LOAN_RATES, loanLimit, loanTotal, salaryOf, scoreOf,
  stageOf, stars, stocksValue, teamTotals, TEAM_COLORS, TEAM_NAMES, sameTeam,
  myStakes, lotteryMult, lotteryPrice, LOTTERY_PRIZES,
} from '../engine/game'
import type { GameState, InsuranceKind, Player, Sector } from '../engine/types'
import { playerLine, won } from './format'


export function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="jua">{title}</h2>
          <button className="x" onClick={onClose}>닫기</button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface FinanceProps {
  s: GameState
  p: Player
  canUse: boolean
  onLottery: () => void
  onCure: () => void
  onTrade: (k: Sector, q: number) => void
  onInsurance: (k: InsuranceKind) => void
  onLoan: (amount: number) => void
  onRepay: (amount?: number, idx?: number) => void
  onFriendLoan: (lenderId: number, amount: number, rateIdx: number, term: number) => void
  onRepayFriend: (idx: number) => void
  onDeposit: (amount: number, term: number) => void
  onWithdraw: () => void
  onGiveTeam: (toId: number, amount: number) => void
  onClose: () => void
}

function StockChange({ now, prev }: { now: number; prev: number }) {
  const d = now - prev
  if (!d) return <span className="muted">(지난 바퀴 그대로)</span>
  return <span className={d > 0 ? 'stock-up' : 'stock-down'}>{d > 0 ? '▲' : '▼'} {Math.abs(Math.round((d / prev) * 100))}% ({d > 0 ? '+' : ''}{won(d)})</span>
}
function ProfitText({ v }: { v: number }) {
  const r = Math.round(v)
  return <b className={r >= 0 ? 'stock-up' : 'stock-down'}>{r >= 0 ? `+${won(r)} 이익` : `${won(r)} 손해`}</b>
}

export function FinanceSheet(f: FinanceProps) {
  const [tab, setTab] = useState<'lottery' | 'stock' | 'ins' | 'loan' | 'save' | 'friend'>('stock')
  const [amount, setAmount] = useState(1000)
  const [repay, setRepay] = useState('')
  const [loanPick, setLoanPick] = useState(-1) // 갚을 대출 (-1 = 기한이 빠른 것부터)
  const [rateIdx, setRateIdx] = useState(1)
  const [term, setTerm] = useState(10)
  const { s, p } = f
  const adult = isAdultStage(s)
  const locked = !f.canUse || !adult
  const [saveTerm, setSaveTerm] = useState<number>(SAVINGS_PLANS[0].term)
  // 청년 전에는 쓸 수 없는 버튼을 늘어놓지 않고 안내만 (2026-10-22)
  if (!adult) return (
    <Sheet title="재테크" onClose={f.onClose}>
      <p className="note">재테크는 청년(성인)부터 할 수 있어요.</p>
      <p className="muted">청년이 되면 여기서 주식·적금·복권·보험·대출을 하고, 다른 사람과 돈을 빌리고 빌려줄 수 있어요.</p>
    </Sheet>
  )
  return (
    <Sheet title="재테크" className="finance-sheet" onClose={f.onClose}>
      {adult && !f.canUse && <p className="note">지금은 구경만 할 수 있어요 (내 차례, 주사위 던지기 전에 사용).</p>}
      <div className="tabs" role="tablist">
        {([['stock', '주식'], ['save', '적금'], ['lottery', '복권'], ['ins', '보험'], ['loan', '대출'], ['friend', '친구']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'stock' && (
        <div className="list">
          <p className="note">주가는 바퀴가 끝날 때 뉴스와 함께 오르내려요. 미리 알 방법은 없어요.</p>
          {SECTORS.map((k) => (
            <div key={k} className="stock-row">
              <div>
                <b>{k}</b> <span className="muted">{won(s.stockPrice[k])}/주</span> <StockChange now={s.stockPrice[k]} prev={s.stockPrev?.[k] ?? s.stockPrice[k]} />
                <div className="muted">보유 {p.stocks[k]}주 · {won(p.stocks[k] * s.stockPrice[k])}{p.stocks[k] > 0 && <> · 평균 {won(p.stockCost[k] / p.stocks[k])}에 삼 · 지금 팔면 <ProfitText v={p.stocks[k] * s.stockPrice[k] - p.stockCost[k]} /></>}</div>
              </div>
              <div className="stock-btns">
                <button disabled={locked || p.money < s.stockPrice[k]} onClick={() => f.onTrade(k, 1)}>+1</button>
                <button disabled={locked || p.money < s.stockPrice[k] * 10} onClick={() => f.onTrade(k, 10)}>+10</button>
                <button disabled={locked || p.stocks[k] < 1} onClick={() => f.onTrade(k, -1)}>-1</button>
                <button disabled={locked || p.stocks[k] < 10} onClick={() => f.onTrade(k, -10)}>-10</button>
                <button disabled={locked || p.stocks[k] < 1} onClick={() => f.onTrade(k, -p.stocks[k])}>전부</button>
              </div>
            </div>
          ))}
          <p className="muted">주식 평가액 {won(stocksValue(s, p))}</p>
          <p className="muted">집 시세 {s.housePrice} (처음 100){p.house ? ` · 내 ${HOUSES[p.house].name} ${won(houseValue(s, p))}, 매 턴 관리비 ${won(houseValue(s, p) * HOUSE_RULES.upkeepRate)}` : ''}</p>
        </div>
      )}
      {tab === 'lottery' && (
        <div className="list">
          <p>한 장 {won(lotteryPrice(s))}. 당첨 여부는 다음 내 차례에 알려줘요.</p>
          <p className="note">당첨금 1등 {won(LOTTERY_PRIZES[1] * lotteryMult(s))} · 2등 {won(LOTTERY_PRIZES[2] * lotteryMult(s))} · 3등 {won(LOTTERY_PRIZES[3] * lotteryMult(s))} (중년은 2배, 노년은 4배로 커져요)</p>
          <p className="note">이번에 사면 도박중독에 걸릴 확률: <b>{p.lottery.chance}%</b> (살수록 +5%, 쉬면 -10%)</p>
          {p.lottery.addicted && <p className="bad">도박중독 상태예요. 매 턴 나쁜 일이 생길 수 있어요.</p>}
          <button className="wide" disabled={locked || p.lottery.ticket || p.money < lotteryPrice(s)} onClick={f.onLottery}>
            {p.lottery.ticket ? '이번 차례에 이미 샀어요' : '복권 사기'}
          </button>
          {p.lottery.addicted && <button className="wide" disabled={locked || p.money < 300} onClick={f.onCure}>상담 치료 (300만)</button>}
        </div>
      )}
      {tab === 'ins' && (
        <div className="list">
          {(Object.keys(INSURANCE) as InsuranceKind[]).map((k) => {
            const need = k === 'car' ? (p.car ? '' : '자동차가 있어야 해요') : k === 'property' ? (p.house ? '' : '집이 있어야 해요') : ''
            const cd = p.insuranceCooldown[k]
            return (
              <div key={k} className="row">
                <div className="grow">
                  <b>{INSURANCE[k].name}</b> <span className="muted">매 턴 {won(INSURANCE[k].premium)}</span>
                  <div className="muted">{p.insurance[k] ? '가입 중' : need || (cd ? `${cd}턴 뒤 재가입 가능` : '미가입')}</div>
                </div>
                <button disabled={locked || (!p.insurance[k] && (!!need || cd > 0))} onClick={() => f.onInsurance(k)}>
                  {p.insurance[k] ? '해지' : '가입'}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {tab === 'loan' && (
        <div className="list">
          <p>빌린 돈 <b>{won(loanTotal(p))}</b> · 더 빌릴 수 있는 돈 {won(loanLimit(s, p))} (한도 {won(loanCap(s, p))}) · 매 턴 이자 {LOAN_RATE * 100}% · {LOAN_TURNS}턴 뒤 한꺼번에 갚기 (못 갚으면 강제 청산)</p>
          <p className="note">한도 = 기본 500만 + 집·차·주식 값의 절반 (청년은 적어도 3,000만). 일반 대출은 다 갚아야 다시 빌릴 수 있어요.</p>
          {p.creditBad > 0 && <p className="bad">신용불량 {p.creditBad}턴: 대출을 받을 수 없어요</p>}
          {p.loans.length >= 2 && <p className="note">갚을 대출을 눌러 고르세요</p>}
          {p.loans.map((l, i) => {
            const left = l.dueTurn - p.turnsPlayed
            const text = l.kind === '주담대'
              ? `주택담보대출 ${won(l.amount)} · 매 턴 ${won(l.installment ?? 0)} 자동 상환${l.missed ? ` · 연체 ${l.missed}번 ⚠️ (3번이면 경매)` : ''}`
              : `${l.kind ?? '일반'} 대출 ${won(l.amount)} · ${left > 50 ? '졸업 뒤 8턴 안에 갚기' : `남은 ${Math.max(0, left)}턴${left <= 3 ? ' ⚠️' : ''}`}`
            const warn = l.kind === '주담대' ? !!l.missed : left <= 3
            // 대출마다 바로 갚는 버튼 (2026-10-22: 창업 대출 갚는 곳을 못 찾았음)
            const payNow = <button className="loan-pay" disabled={locked || p.money <= 0} onClick={(e) => { e.stopPropagation(); f.onRepay(Math.min(l.amount, Math.max(0, p.money)), i) }}>{p.money >= l.amount ? '다 갚기' : '가진 만큼 갚기'}</button>
            if (p.loans.length < 2) return <div key={i} className={`loan-line ${warn ? 'bad' : 'muted'}`}><span>· {text}</span>{payNow}</div>
            return <div key={i} className="loan-line"><button className={`loan-pick${loanPick === i ? ' on' : ''}${warn ? ' bad' : ''}`} aria-pressed={loanPick === i} onClick={() => setLoanPick(loanPick === i ? -1 : i)}>{loanPick === i ? '✔ ' : ''}{text}</button>{payNow}</div>
          })}
          <div className="row">
            {[500, 1000, 3000].map((a) => (
              <button key={a} disabled={locked || !canBankLoan(s, p) || a > loanLimit(s, p)} onClick={() => f.onLoan(a)}>{won(a)} 빌리기</button>
            ))}
          </div>
          {p.loans.length > 0 && (() => {
            // 갚을 돈을 직접 적기 (만 원 단위, 가진 돈과 남은 빚을 넘지 않게) + 전부 갚기 (2026-10-21 사용자)
            // 대출이 2개 이상이면 고른 대출만 갚을 수 있음 (2026-10-21 사용자)
            const picked = loanPick >= 0 ? p.loans[loanPick] : undefined
            const idx = picked ? loanPick : undefined
            const total = picked ? picked.amount : loanTotal(p)
            const max = Math.max(0, Math.min(p.money, total))
            const amt = Math.min(Math.floor(Number(repay) || 0), max)
            return (
              <div className="row repay">
                <input className="grow" type="number" inputMode="numeric" min={1} max={max} value={repay} placeholder="얼마 갚을까요?"
                  aria-label="갚을 돈 (만 원)" disabled={locked || max <= 0} onChange={(e) => setRepay(e.target.value.replace(/[^0-9]/g, ''))} />
                <span>만</span>
                <button disabled={locked || amt < 1} onClick={() => { f.onRepay(amt, idx); setRepay('') }}>갚기</button>
                <button disabled={locked || max <= 0} onClick={() => { f.onRepay(picked ? picked.amount : undefined, idx); setRepay(''); setLoanPick(-1) }}>{p.money >= total ? (picked ? '이 대출 다 갚기' : '전부 갚기') : '가진 만큼 갚기'}</button>
              </div>
            )
          })()}
        </div>
      )}
      {tab === 'save' && (
        <div className="list">
          {p.savings ? (() => {
            const plan = SAVINGS_PLANS.find((x) => x.term === p.savingsTerm)
            const left = Math.max(0, (p.savingsDue ?? 0) - p.turnsPlayed)
            const fee = plan ? Math.round(p.savings * SAVINGS_FEE) : 0
            return <>
              <p>적금 <b>{won(p.savings)}</b>{plan ? ` · ${plan.term}차례짜리` : ''}</p>
              <p>{left > 0 ? `만기까지 ${left}차례` : '다음 차례에 만기'}{plan ? ` · 만기에 이자 +${won(p.savings * plan.rate)}` : ''}</p>
              <p className="note">만기가 되면 차례 시작에 저절로 돌려받아요. 그 전에는 더 넣을 수 없어요.</p>
              <button className="wide secondary" disabled={locked} onClick={() => f.onWithdraw()}>만기 전에 꺼내기 (이자 없음{fee ? `, 수수료 ${won(fee)}` : ''})</button>
            </>
          })() : s.stageIdx >= 4 ? (
            <p className="note">노년에는 적금을 새로 넣을 수 없어요.</p>
          ) : <>
            <p className="note">기간을 골라 넣으면 만기에 이자와 함께 돌려받아요. 만기 전에 꺼내면 이자 없이 수수료 {SAVINGS_FEE * 100}%를 내요. 적금은 하나만 들 수 있어요.</p>
            <div className="seg" role="tablist">
              {SAVINGS_PLANS.map((x) => <button key={x.term} role="tab" aria-selected={saveTerm === x.term} className={saveTerm === x.term ? 'on' : ''} onClick={() => setSaveTerm(x.term)}>{x.term}차례 · 이자 {Math.round(x.rate * 100)}%</button>)}
            </div>
            <div className="row">
              {[100, 500, 1000].map((a) => <button key={a} disabled={locked || p.money < a} onClick={() => f.onDeposit(a, saveTerm)}>{won(a)} 넣기</button>)}
              <button disabled={locked || p.money <= 0} onClick={() => f.onDeposit(p.money, saveTerm)}>가진 돈 전부</button>
            </div>
          </>}
        </div>
      )}
      {tab === 'friend' && (
        <div className="list">
          {s.settings.teams && s.players.filter((q) => sameTeam(s, p, q)).map((q) => (
            <div key={`team${q.id}`} className="note">
              <b>🤝 팀원 {q.name}에게 돈 보내기</b> <span className="muted">(빚 없이 그냥 줘요 · 팀원 돈 {won(q.money)})</span>
              <div className="row">
                {[100, 500, 1000].map((a) => <button key={a} disabled={locked || p.money < a} onClick={() => f.onGiveTeam(q.id, a)}>{won(a)}</button>)}
              </div>
            </div>
          ))}
          <p className="note">친구에게는 <b>사람마다 한 번만</b> 부탁할 수 있어요. 기한을 넘기면 3턴 동안 독촉, 그래도 안 갚으면 소송이에요 (큰돈일수록 빌린 사람이 불리). 빌려준 사람은 돌려받으면 운세가 좋아져요.</p>
          {s.friendLoans.map((l, i) => (l.borrowerId === p.id || l.lenderId === p.id) && (
            <div key={i} className="row">
              <div className="grow">
                {l.borrowerId === p.id ? `${s.players[l.lenderId].name}에게 갚을 돈` : `${s.players[l.borrowerId].name}에게 받을 돈`} <b>{won(l.owe)}</b>
                <div className={l.nag !== undefined ? 'bad' : 'muted'}>{l.nag !== undefined ? `기한 지남 · 독촉 중 (${l.nag}턴 뒤 소송)` : `남은 ${Math.max(0, l.dueTurn - s.players[l.borrowerId].turnsPlayed)}턴 (${s.players[l.borrowerId].name} 차례 기준)`}</div>
              </div>
              {l.borrowerId === p.id && <button disabled={locked || p.money < l.owe} onClick={() => f.onRepayFriend(i)}>갚기</button>}
            </div>
          ))}
          <div className="field"><span>빌릴 돈</span>
            <div className="seg">{[500, 1000, 3000].map((a) => <button key={a} className={amount === a ? 'on' : ''} onClick={() => setAmount(a)}>{won(a)}</button>)}</div>
          </div>
          <div className="field"><span>이자</span>
            <div className="seg">{LOAN_RATES.map((r, i) => <button key={r} className={rateIdx === i ? 'on' : ''} onClick={() => setRateIdx(i)}>{['조금', '보통', '많이'][i]} {Math.round(r * 100)}%</button>)}</div>
          </div>
          <div className="field"><span>갚는 기한</span>
            <div className="seg">{[5, 10, 15].map((t) => <button key={t} className={term === t ? 'on' : ''} onClick={() => setTerm(t)}>{t}턴</button>)}</div>
          </div>
          {s.players.filter((q) => q.id !== p.id).map((q) => (
            <div key={q.id} className="row">
              <div className="grow"><b style={{ color: q.color }}>{q.name}</b> <span className="muted">가진 돈 {won(q.money)}</span></div>
              <button disabled={locked || !canBorrowFrom(s, p, q)} onClick={() => f.onFriendLoan(q.id, amount, rateIdx, term)}>
                {p.borrowedFrom.includes(q.id) ? '이미 부탁함' : '부탁하기'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}

export function CardsSheet({ p, canUse, onUseChance, onSabotage, onClose }: {
  p: Player; canUse: boolean; onUseChance: () => void; onSabotage: () => void; onClose: () => void
}) {
  const active = p.chance === 'charm'
  return (
    <Sheet title="내 카드" onClose={onClose}>
      <div className="cards">
        <div className="card chance">
          <span className="muted">찬스 카드</span>
          <b className="jua">{p.chance ? CHANCE_NAMES[p.chance] : '없음'}</b>
          <p className="muted">
            {p.chance === 'reroll' && '주사위를 던진 뒤 다시 굴릴지 물어봐요.'}
            {p.chance === 'block' && '방해를 받으면 자동으로 막아요.'}
            {p.chance === 'coupon' && '상점에서 집·차를 살 때 30% 할인. 쓸지 물어봐요.'}
            {p.chance === 'charm' && '3턴 동안 운세가 한 단계 올라가요.'}
          </p>
          {active && <button disabled={!canUse} onClick={onUseChance}>지금 쓰기</button>}
        </div>
        <div className="card sabotage">
          <span className="muted">방해 카드</span>
          <b className="jua">{p.sabotage ? SABOTAGE_NAMES[p.sabotage] : '없음'}</b>
          <p className="muted">상대 운세가 좋을수록 역풍이 불기 쉬워요.</p>
          {p.sabotage && <button disabled={!canUse} onClick={onSabotage}>상대 고르기</button>}
        </div>
      </div>
      <p className="note">찬스·방해 카드는 한 장씩만 가질 수 있어요. 찬스 카드는 랜덤이벤트 칸·미니게임 대성공·휴식 칸·상점, 방해 카드는 청년부터 랜덤이벤트 칸에서 얻어요.</p>
    </Sheet>
  )
}


export function PeopleSheet({ s, onClose }: { s: GameState; onClose: () => void }) {
  return (
    <Sheet title="사람들" onClose={onClose}>
      <div className="people">
        {s.players.map((p) => {
          const sc = scoreOf(s, p)
          const tags: string[] = []
          if (p.spouse) tags.push(`배우자 ${p.spouse.name} ${stars(p.spouse.grade)}${p.spouse.revealed ? ` (${p.spouse.trait})` : ''}`)
          for (const k of p.kids) tags.push(`${k.adopted ? '입양 자녀' : '자녀'} ${k.result === null ? `(교육 ${KIDS.eduNames[k.edu ?? 0]})` : `· ${KIDS.resultNames[k.result]}`}`)
          if (kidAllowance(p)) tags.push(`자녀 용돈 ${won(kidAllowance(p))}`)
          for (const k of p.diceItems) tags.push(DICE_ITEMS[k].name)
          if (p.medals.length) tags.push(`메달 ${p.medals.map((m) => MEDALS[m].name).join('·')}`)
          if (p.pet?.alive) tags.push('반려동물')
          if (p.house) tags.push(`${HOUSES[p.house].name} (시세 ${won(houseValue(s, p))})`)
          if (p.car) tags.push(`${CARS[p.car].name} (${won(p.carValue)})`)
          if (p.lottery.addicted) tags.push('도박중독')
          if (p.creditBad) tags.push('신용불량')
          if (p.agency) tags.push(`소개팅 ${p.agency.vip ? 'VIP' : '일반'}`)
          if (friendDebt(s, p)) tags.push(`친구 빚 ${won(friendDebt(s, p))}`)
          if (p.college) tags.push('대졸')
          return (
            <div key={p.id} className="person" style={{ borderColor: p.color }}>
              <div className="person-head">
                <span className="person-face" style={{ borderColor: p.color }}><Character outfit={p.outfit} size={24} /></span>
                <b className="jua">{p.name}</b><TeamBadge team={p.team} />
                <span className="muted">{p.human ? '사람' : 'AI'}</span>
                <span className="fortune">{fortuneName(p.fortune)}</span>
              </div>
              <div className="muted">{ageOf(s, p)}세 · {playerLine(s, p)}{salaryOf(p) ? ` · 월급 ${won(salaryOf(p))}` : ''}</div>
              <div>돈 <b>{won(p.money)}</b> · 행복 <b>{p.happy}</b> · 지금 점수 <b>{sc.total}</b></div>
              <div className="muted">지력 {p.stats.int} · 체력 {p.stats.str} · 매력 {p.stats.cha}</div>
              {tags.length > 0 && <div className="tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>}
              {p.suitors.length > 0 && <div className="muted">연애 중: {p.suitors.map((x) => `${x.name} ${x.affinity}%`).join(', ')}</div>}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}

// 중간 정산: 청년·중년이 끝날 때 지금 순위와 각자 상황
export function StageSummary({ s, onClose }: { s: GameState; onClose: () => void }) {
  const ranked = [...s.players].map((p) => ({ p, sc: scoreOf(s, p) })).sort((a, b) => b.sc.total - a.sc.total)
  return (
    <div className="sheet-backdrop">
      <div className="sheet">
        <h2 className="jua center">{s.summary} 정산</h2>
        <p className="center muted">지금까지 점수 (자산 150만당 1점 + 행복, 상은 마지막에 더해요)</p>
        {s.settings.teams && <TeamTotal s={s} />}
        <div className="people">
          {ranked.map(({ p, sc }, i) => {
            const debt = loanTotal(p) + friendDebt(s, p)
            return (
              <div key={p.id} className="person" style={{ borderColor: p.color }}>
                <div className="person-head">
                  <b className="jua rank">{['🥇', '🥈', '🥉'][i] ?? ''}{i + 1}위</b>
                  <span className="person-face" style={{ borderColor: p.color }}><Character outfit={p.outfit} size={24} age={ageOf(s, p)} /></span>
                  <b className="jua">{p.name}</b><TeamBadge team={p.team} />
                  <b className="jua total">{sc.total}점</b>
                </div>
                <div className="muted">{ageOf(s, p)}세 · {playerLine(s, p)}{salaryOf(p) ? ` · 월급 ${won(salaryOf(p))}` : ''}</div>
                <div>자산 <b>{won(sc.assets)}</b>{debt ? <span className="bad"> (빚 {won(debt)})</span> : null} · 행복 <b>{p.happy}</b></div>
                <div className="muted">지력 {p.stats.int} · 체력 {p.stats.str} · 매력 {p.stats.cha}</div>
                <div className="muted">{p.spouse ? `배우자 ${p.spouse.name} ${stars(p.spouse.grade)}` : p.divorced ? '이혼' : '미혼'}{p.kids.length ? ` · 자녀 ${p.kids.length}` : ''}{p.house ? ` · ${HOUSES[p.house].name}` : ''}{p.car ? ` · ${CARS[p.car].name}` : ''}</div>
              </div>
            )
          })}
        </div>
        <button className="wide big" onClick={onClose}>다음 단계로</button>
      </div>
    </div>
  )
}

// 팀전 합계: 팀 점수 합 + 재산 합 (2026-10-21)
export const TeamBadge = ({ team }: { team?: 0 | 1 }) => (team === undefined ? null : <span className="team-badge" style={{ background: TEAM_COLORS[team] }}>{TEAM_NAMES[team]}</span>)
function TeamTotal({ s, final = false }: { s: GameState; final?: boolean }) {
  const t = teamTotals(s)
  const assets = [0, 1].map((k) => s.players.filter((p) => p.team === k).reduce((a, p) => a + scoreOf(s, p).assets, 0))
  const win = t[0] === t[1] ? -1 : t[0] > t[1] ? 0 : 1
  return (
    <div className="team-total">
      {[0, 1].map((k) => (
        <div key={k} className={win === k ? 'win' : ''} style={{ borderColor: TEAM_COLORS[k] }}>
          <b className="jua" style={{ color: TEAM_COLORS[k] }}>{final && win === k ? '🏆 ' : ''}{TEAM_NAMES[k]}</b>
          <div className="jua">{t[k]}점</div>
          <div className="muted">{s.players.filter((p) => p.team === k).map((p) => p.name).join(' · ')}</div>
          <div className="muted">재산 합계 {won(assets[k])}</div>
        </div>
      ))}
      {final && win === -1 && <p className="center">무승부!</p>}
    </div>
  )
}

export function GameOver({ s, onMenu, onNew }: { s: GameState; onMenu: () => void; onNew?: () => void }) {
  const ranked = [...s.players].map((p) => ({ p, sc: scoreOf(s, p) })).sort((a, b) => b.sc.total - a.sc.total)
  return (
    <div className="sheet-backdrop">
      <div className="sheet">
        <div className="center"><Trophy size={64} /></div>
        <h2 className="jua center">인생 결산</h2>
        <p className="center muted">점수 = 자산 150만당 1점 + 행복 + 상 {AWARD_POINTS}점씩(같으면 나눠요) (집은 지금 시세, 차는 지금 가치로 계산해요)</p>
        {s.settings.teams && <TeamTotal s={s} final />}
        <div className="people">
          {ranked.map(({ p, sc }, i) => (
            <div key={p.id} className="person" style={{ borderColor: p.color }}>
              <div className="person-head">
                <b className="jua rank">{['🥇', '🥈', '🥉'][i] ?? ''}{i + 1}위</b>
                <span className="person-face" style={{ borderColor: p.color }}><Character outfit={p.outfit} size={24} /></span>
                <b className="jua">{p.name}</b><TeamBadge team={p.team} />
                <span className="muted">{p.human ? '사람' : 'AI'}</span>
                <b className="jua total">{sc.total}점</b>
              </div>
              <div className="muted">
                {jobOf(p)?.name ?? '백수'} · 자산 {won(sc.assets)} ({sc.assetScore}점){loanTotal(p) + friendDebt(s, p) > 0 ? ` (빚 -${won(loanTotal(p) + friendDebt(s, p))} 포함)` : ''} · 행복 {sc.happy}{sc.awardScore ? ` · 상 ${sc.awardScore}점` : ''}
                {p.spouse ? ` · ${josa(p.spouse.name, '와/과')} 결혼` : p.divorced ? ' · 이혼' : ' · 비혼'}
                {p.children + p.adopted ? ` · 자녀 ${p.children + p.adopted}` : ''}
              </div>
              {awardsOf(s, p).length > 0 && <div className="tags">{awardsOf(s, p).map((a) => <span key={a.id} className="award" title={a.desc}>🏆 {a.name} +{a.points}{a.ties > 1 ? ` (${a.ties}명 공동)` : ''}</span>)}</div>}
            </div>
          ))}
        </div>
        <div className="row-btns">
          <button className="wide big secondary" onClick={onMenu}>메뉴로</button>
          {onNew && <button className="wide big" onClick={onNew}>새 게임</button>}
        </div>
      </div>
    </div>
  )
}

export const JOB_COUNT = JOBS.length

// 배우자 능력치·특성 설명 (내 정보에서 눌러서 펼침, 2026-10-21 사용자). 숫자는 engine/game.ts familyTick·traitEvent와 같게
const SPOUSE_ATTR_HELP: [string, 'looks' | 'wealth' | 'fame' | 'kindness', string, string][] = [
  ['외모', 'looks', '결혼할 때 행복이 더 커요 (외모 1당 +2)', '7 이상이면 운동 마니아·명품 중독·바람기 같은 특성이 잘 붙어요'],
  ['재력', 'wealth', '매 턴 재력 × 12만을 보태 줘요. 7 이상이면 가끔 집안에서 도와줘요', '없음'],
  ['명성', 'fame', '7 이상이면 직업 조건이 1 쉬워지고, 가끔 방송·광고 수입과 주가 상승', '7 이상이면 가끔 스캔들(행복 -4, 주가 하락)'],
  ['성격', 'kindness', '7 이상이면 매 턴 행복 +1', '3 이하면 매 턴 행복 -1, 가끔 부부 싸움, 이혼 위험이 커져요'],
]
const TRAIT_HELP: Record<string, string> = {
  대운: '결혼할 때 운세 포인트 +2', 짠돌이: '매 턴 나가는 생활비 20% 줄임', 요리왕: '가끔 맛있는 요리로 행복 +2', '재테크 고수': '가끔 주식으로 돈을 벌어 와요',
  '육아 천재': '아이가 있으면 가끔 행복 +3', '운동 마니아': '가끔 같이 운동해서 체력 +1', 인맥왕: '가끔 좋은 거래를 소개해 돈을 벌어요',
  도박증: '가끔 도박으로 돈을 날려요', '명품 중독': '매 턴 생활비 15만 더', 까칠함: '가끔 다퉈서 행복 -3', 게으름: '가끔 집안일이 쌓여 행복 -2',
  술고래: '가끔 술 마시다 다쳐 병원비', 바람기: '이혼 위험이 커져요',
}

// 내 정보: 나 · 가족(배우자·아이·반려동물) · 재산(집·차·주식·빚) · 카드 (2026-10-17 사용자)
export function MyInfoSheet({ s, p, onClose }: { s: GameState; p: Player; onClose: () => void }) {
  const age = ageOf(s, p)
  const job = jobOf(p)
  // 직업 특성: 일하는 동안만 (노년엔 은퇴, 학생 때는 없음)
  const working = isAdultStage(s) && stageOf(s).id !== 'old'
  const traits = working ? JOB_PROS_CONS[job ? job.id : 'none'] : undefined
  const sp = p.spouse
  const debt = p.loans.reduce((a, l) => a + l.amount, 0) // 주택담보대출 포함
  const fDebt = friendDebt(s, p)
  const stockList = (Object.keys(p.stocks) as Sector[]).filter((k) => p.stocks[k] > 0)
  return (
    <Sheet title="내 정보" onClose={onClose}>
      <div className="info-me">
        <span className="person-face big" style={{ borderColor: p.color }}><Character outfit={p.outfit} size={48} age={age} crop="head" /></span>
        <div>
          <b className="jua">{p.name}</b> <span className="muted">{age}세</span>
          <div className="muted">{job ? `${job.name} ${job.ranks[p.jobRank] ?? ''}` : p.biz ? p.biz.name : '직업 없음'}{salaryOf(p) ? ` · 월급 ${won(salaryOf(p))}` : ''}{p.college ? ' · 대졸' : ''}</div>
          <div>돈 <b>{won(p.money)}</b> · 행복 <b>{p.happy}</b> · 지력 {p.stats.int} · 체력 {p.stats.str} · 매력 {p.stats.cha}</div>
        </div>
      </div>
      {traits && (
        <div className="note job-traits">
          <b>{job ? job.name : '백수'} 특성</b>
          <div>👍 {traits[0]}</div>
          <div>👎 {traits[1]}</div>
        </div>
      )}
      {(myStakes(s, p).length > 0 || !!p.biz?.investors?.length) && (
        <div className="note">
          <b>동업</b>
          {myStakes(s, p).map((f) => <div key={f.id}>{f.name}의 {f.biz!.name}에 투자 · 회사 몫 10%</div>)}
          {!!p.biz?.investors?.length && <div>내 {p.biz.name}에 {p.biz.investors.map((id) => s.players[id].name).join('·')} 투자 · 수익과 판 돈의 {p.biz.investors.length * 10}%를 나눠요</div>}
          {p.record.bizShare !== undefined && <div className="muted">동업으로 번 돈 (받은 돈 - 투자금) {p.record.bizShare >= 0 ? '+' : ''}{won(p.record.bizShare)}</div>}
        </div>
      )}
      <div className="note">
        기분 {MOOD_FACES[moodLevel(p)]} <b>{MOOD_NAMES[moodLevel(p)]}</b> (최근 {MOOD_TURNS}턴 행복 {moodOf(p) >= 0 ? '+' : ''}{moodOf(p)}) · {MOOD_HELP[moodLevel(p)]}
        <div className="muted">최근 5턴 행복이 많이 오르면 기쁨, 내려가면 우울이 돼요. 쌓인 행복은 마지막 점수에 들어가요.</div>
      </div>

      <h3 className="jua">가족</h3>
      <div className="info-list">
        {sp ? (
          <div className="info-row">
            <b>💍 배우자 {sp.name}</b> <span>{stars(sp.grade)}</span>
            <div className="muted">외모 {sp.looks} · 재력 {sp.wealth} · 명성 {sp.fame} · 성격 {sp.kindness}{sp.revealed ? ` · ${sp.trait}` : ' · 특성은 아직 몰라요'}</div>
            {SPOUSE_ATTR_HELP.map(([name, key, good, bad]) => (
              <details key={key} className="spouse-help">
                <summary>{name} {sp[key]} <span className="muted">▾ 좋은 점·나쁜 점</span></summary>
                <div>👍 {good}</div>
                <div>👎 {bad}</div>
              </details>
            ))}
            {sp.revealed && (
              <details className="spouse-help">
                <summary>특성: {sp.trait} {sp.traitGood ? '😊' : '😣'} <span className="muted">▾ 설명</span></summary>
                <div>{TRAIT_HELP[sp.trait] ?? ''}</div>
              </details>
            )}
          </div>
        ) : <div className="muted">아직 결혼 전이에요{p.suitors.length ? ` · 연애 중: ${p.suitors.map((x) => `${x.name} ${x.affinity}%`).join(', ')}` : ''}</div>}
        {p.kids.map((k, i) => {
          const kidAge = Math.max(0, age - k.bornAge)
          return (
            <div key={i} className="info-row">
              <b>{k.adopted ? '🧸 입양 자녀' : '👶 자녀'} {i + 1}</b> <span className="muted">{kidAge}살</span>
              <div className="muted">{k.result === null ? `교육 ${k.edu === null ? '아직 안 정함' : KIDS.eduNames[k.edu]}` : `어른이 됨 · ${KIDS.resultNames[k.result]}`}</div>
            </div>
          )
        })}
        {kidAllowance(p) > 0 && <div className="muted">자녀가 주는 용돈 매 턴 {won(kidAllowance(p))}</div>}
        {p.pet?.alive && <div className="info-row"><b>🐶 반려동물</b></div>}
      </div>

      <h3 className="jua">재산</h3>
      <div className="info-list">
        <div className="info-row"><b>🏠 집</b> <span>{p.house ? `${HOUSES[p.house].name} · 시세 ${won(houseValue(s, p))}` : '없음'}</span></div>
        <div className="info-row"><b>🚗 차</b> <span>{p.car ? `${CARS[p.car].name} · ${won(p.carValue)}${p.carCharges ? ` · ±1 남은 ${p.carCharges}번` : ''}` : '없음'}</span></div>
        <div className="info-row"><b>📈 주식</b> <span>{stockList.length ? `${stockList.map((k) => `${k} ${p.stocks[k]}주`).join(' · ')} (${won(stocksValue(s, p))})` : '없음'}</span></div>
        {!!p.savings && <div className="info-row"><b>🐷 적금</b> <span>{won(p.savings)}</span></div>}
        <div className="info-row"><b>💳 빚</b> <span>{debt || fDebt ? [debt ? `대출 ${won(debt)}` : '', fDebt ? `친구 ${won(fDebt)}` : ''].filter(Boolean).join(' · ') : '없음'}</span></div>
      </div>

      <h3 className="jua">카드·아이템</h3>
      <div className="tags">
        {p.chance && <span>찬스: {CHANCE_NAMES[p.chance]}</span>}
        {p.sabotage && <span>방해: {SABOTAGE_NAMES[p.sabotage]}</span>}
        {p.diceItems.map((k, i) => <span key={i}>{DICE_ITEMS[k].name}</span>)}
        {p.medals.length > 0 && <span>메달 {p.medals.map((m) => MEDALS[m].name).join('·')}</span>}
        {!p.chance && !p.sabotage && !p.diceItems.length && !p.medals.length && <span className="muted">없음</span>}
      </div>
    </Sheet>
  )
}

// 직업 안내: 게임 중 언제든 (학생 때 미리 준비하도록, 2026-10-23 사용자). 조건·월급·특성, 지금 내 능력치로 되는지
const SPECIAL_JOB_WAY: Record<string, string> = {
  ceo: '중년 \'인생 2막\' 갈림길에서 창업 길로 가면 돼요 (백수는 카페)',
  actor: '아이돌이 중년에 은퇴할 때 고를 수 있어요',
  coach: '운동선수가 중년에 은퇴할 때 감독 도전 룰렛에 성공하면 돼요',
}
const STAT_SHORT = { int: '지력', str: '체력', cha: '매력' } as const
export function JobsSheet({ p, onClose }: { p: Player; onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const noCollege = p.collegeDecided && !p.college // 대학을 안 가기로 정함
  return (
    <Sheet title="직업 안내" onClose={onClose}>
      <p className="note">직업은 청년이 될 때 골라요. 조건은 고르는 순간의 능력치로 봐요. 🎓 직업은 고등학교 졸업 때 대학에 가야 할 수 있어요. 직업을 누르면 좋은 점·나쁜 점이 보여요.<br />지금 내 능력치: 지력 {p.stats.int} · 체력 {p.stats.str} · 매력 {p.stats.cha}{p.college ? ' · 대학' : ''}</p>
      <div className="info-list">
        {JOBS.map((j) => {
          const keys = Object.keys(j.req) as (keyof typeof STAT_SHORT)[]
          const short = keys.filter((k) => p.stats[k] < (j.req[k] ?? 0)).map((k) => `${STAT_SHORT[k]} ${(j.req[k] ?? 0) - p.stats[k]}`)
          const way = SPECIAL_JOB_WAY[j.id]
          const status = way ? '' : j.college && noCollege ? '대학을 안 가서 못 해요' : short.length ? `${short.join(' · ')} 더 필요` : j.college && !p.college ? '능력치 OK · 대학 필요' : '✅ 지금 조건이 돼요'
          const pc = JOB_PROS_CONS[j.id]
          return (
            <button key={j.id} className="info-row job-row" aria-expanded={open === j.id} onClick={() => setOpen(open === j.id ? null : j.id)}>
              <div className="job-row-head">
                <b>{j.name}</b>
                <span className="muted">{j.boom ? '대박형' : '꾸준형'} · 월급 {won(j.salary)}{j.pension ? ' · 연금' : ''}</span>
              </div>
              <div className="muted">조건: {way ?? `${keys.length ? keys.map((k) => `${STAT_SHORT[k]} ${j.req[k]}`).join(' · ') : '없음'}${j.college ? ' · 🎓대학' : ''}`}</div>
              {status && <div className={status.startsWith('✅') ? 'good' : 'bad'}>{status}</div>}
              {open === j.id && (
                <div className="job-more">
                  <div>{j.ranks.join(' → ')}</div>
                  {pc && <div>👍 {pc[0]}</div>}
                  {pc && <div>👎 {pc[1]}</div>}
                </div>
              )}
            </button>
          )
        })}
        <div className="info-row">
          <b>백수</b> <span className="muted">월급 없음 · 조건 없음</span>
          <div>👍 {JOB_PROS_CONS.none[0]}</div>
          <div>👎 {JOB_PROS_CONS.none[1]}</div>
        </div>
      </div>
    </Sheet>
  )
}
