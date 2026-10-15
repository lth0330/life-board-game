import { useState, type ReactNode } from 'react'
import { Character } from '../art/Character'
import { Trophy } from '../art/More'
import { CARS, CHANCE_NAMES, DICE_ITEMS, HOUSE_RULES, HOUSES, INSURANCE, JOBS, KIDS, LOTTERY_PRICE, MEDALS, PERSONALITIES, SABOTAGE_NAMES, SECTORS } from '../engine/data'
import {
  ageOf, AWARD_POINTS, awardsOf, bankDebt, canBorrowFrom, fortuneName, friendDebt, houseValue, isAdultStage, jobOf, kidAllowance, LOAN_RATES, loanLimit, loanTotal, salaryOf, scoreOf,
  stars, stockHint, stocksValue,
} from '../engine/game'
import type { GameState, InsuranceKind, Player, Sector } from '../engine/types'

export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만`

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
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
  onRepay: (amount?: number) => void
  onFriendLoan: (lenderId: number, amount: number, rateIdx: number, term: number) => void
  onRepayFriend: (idx: number) => void
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
  const [tab, setTab] = useState<'lottery' | 'stock' | 'ins' | 'loan' | 'friend'>('stock')
  const [amount, setAmount] = useState(1000)
  const [repay, setRepay] = useState(100)
  const [rateIdx, setRateIdx] = useState(1)
  const [term, setTerm] = useState(10)
  const { s, p } = f
  const adult = isAdultStage(s)
  const hint = stockHint(s, p)
  const locked = !f.canUse || !adult
  return (
    <Sheet title="재테크" onClose={f.onClose}>
      {!adult && <p className="note">재테크는 청년(성인)부터 할 수 있어요.</p>}
      {adult && !f.canUse && <p className="note">지금은 구경만 할 수 있어요 (내 차례, 주사위 던지기 전에 사용).</p>}
      <div className="tabs" role="tablist">
        {([['stock', '주식'], ['lottery', '복권'], ['ins', '보험'], ['loan', '대출'], ['friend', '친구']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'stock' && (
        <div className="list">
          <p className="note">{hint ? `오늘의 운세 힌트: ${hint}` : `운세 ${fortuneName(p.fortune)}: 힌트 없음 (길 이상이면 힌트)`}</p>
          {SECTORS.map((k) => (
            <div key={k} className="row">
              <div className="grow">
                <b>{k}</b> <span className="muted">{won(s.stockPrice[k])}/주</span> <StockChange now={s.stockPrice[k]} prev={s.stockPrev?.[k] ?? s.stockPrice[k]} />
                <div className="muted">보유 {p.stocks[k]}주 · {won(p.stocks[k] * s.stockPrice[k])}{p.stocks[k] > 0 && <> · 평균 {won(p.stockCost[k] / p.stocks[k])}에 삼 · 지금 팔면 <ProfitText v={p.stocks[k] * s.stockPrice[k] - p.stockCost[k]} /></>}</div>
              </div>
              <button disabled={locked || p.money < s.stockPrice[k]} onClick={() => f.onTrade(k, 1)}>+1</button>
              <button disabled={locked || p.money < s.stockPrice[k] * 10} onClick={() => f.onTrade(k, 10)}>+10</button>
              <button disabled={locked || p.stocks[k] < 1} onClick={() => f.onTrade(k, -1)}>-1</button>
              <button disabled={locked || p.stocks[k] < 10} onClick={() => f.onTrade(k, -10)}>-10</button>
              <button disabled={locked || p.stocks[k] < 1} onClick={() => f.onTrade(k, -p.stocks[k])}>전부</button>
            </div>
          ))}
          <p className="muted">주식 평가액 {won(stocksValue(s, p))}</p>
          <p className="muted">집 시세 {s.housePrice} (처음 100){p.house ? ` · 내 ${HOUSES[p.house].name} ${won(houseValue(s, p))}, 매 턴 관리비 ${won(houseValue(s, p) * HOUSE_RULES.upkeepRate)}` : ''}</p>
        </div>
      )}
      {tab === 'lottery' && (
        <div className="list">
          <p>한 장 {won(LOTTERY_PRICE)}. 당첨 여부는 다음 내 차례에 알려줘요.</p>
          <p className="note">이번에 사면 도박중독에 걸릴 확률: <b>{p.lottery.chance}%</b> (살수록 +5%, 쉬면 -10%)</p>
          {p.lottery.addicted && <p className="bad">도박중독 상태예요. 매 턴 나쁜 일이 생길 수 있어요.</p>}
          <button className="wide" disabled={locked || p.lottery.ticket || p.money < LOTTERY_PRICE} onClick={f.onLottery}>
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
          <p>빌린 돈 <b>{won(loanTotal(p))}</b> · 일반 대출 한도 {won(bankDebt(p))} / {won(loanLimit(p))} · 매 턴 이자 1% · 기한에 한꺼번에 갚기 (못 갚으면 강제 청산)</p>
          {p.creditBad > 0 && <p className="bad">신용불량 {p.creditBad}턴: 대출 불가</p>}
          {p.loans.map((l, i) => {
            const left = l.dueTurn - p.turnsPlayed
            if (l.kind === '주담대') return <div key={i} className={l.missed ? 'bad' : 'muted'}>· 주택담보대출 {won(l.amount)} · 매 턴 {won(l.installment ?? 0)} 자동 상환{l.missed ? ` · 연체 ${l.missed}번 ⚠️ (3번이면 경매)` : ''}</div>
            return <div key={i} className={left <= 3 ? 'bad' : 'muted'}>· {l.kind ?? '일반'} 대출 {won(l.amount)} · 남은 {Math.max(0, left)}턴{left <= 3 ? ' ⚠️' : ''}</div>
          })}
          <div className="row">
            {[500, 1000, 3000].map((a) => (
              <button key={a} disabled={locked || p.creditBad > 0 || bankDebt(p) + a > loanLimit(p)} onClick={() => f.onLoan(a)}>{won(a)} 빌리기</button>
            ))}
          </div>
          {p.loans.length > 0 && (() => {
            // 100만 단위로 갚을 액수 고르기 (가진 돈과 남은 빚을 넘지 않게)
            const max = Math.max(0, Math.floor(Math.min(p.money, loanTotal(p)) / 100) * 100)
            const amt = Math.min(repay, max)
            return (
              <div className="row repay">
                <button disabled={locked || amt <= 100} onClick={() => setRepay(Math.max(100, amt - 100))} aria-label="100만 줄이기">−</button>
                <b className="grow center">{won(amt)}</b>
                <button disabled={locked || amt + 100 > max} onClick={() => setRepay(amt + 100)} aria-label="100만 늘리기">＋</button>
                <button disabled={locked || amt < 100} onClick={() => f.onRepay(amt)}>갚기</button>
                <button disabled={locked || p.money <= 0} onClick={() => f.onRepay()}>최대</button>
              </div>
            )
          })()}
        </div>
      )}
      {tab === 'friend' && (
        <div className="list">
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
  const active = p.chance === 'charm' || p.chance === 'shortcut'
  return (
    <Sheet title="내 카드" onClose={onClose}>
      <div className="cards">
        <div className="card chance">
          <span className="muted">찬스 카드</span>
          <b className="jua">{p.chance ? CHANCE_NAMES[p.chance] : '없음'}</b>
          <p className="muted">
            {p.chance === 'reroll' && '주사위를 던진 뒤 다시 굴릴지 물어봐요.'}
            {p.chance === 'block' && '방해를 받으면 자동으로 막아요.'}
            {p.chance === 'coupon' && '상점에서 자동으로 30% 할인돼요.'}
            {p.chance === 'charm' && '3턴 동안 운세가 한 단계 올라가요.'}
            {p.chance === 'shortcut' && '이번 주사위에 +2.'}
          </p>
          {active && <button disabled={!canUse} onClick={onUseChance}>지금 쓰기</button>}
        </div>
        <div className="card sabotage">
          <span className="muted">방해 카드</span>
          <b className="jua">{p.sabotage ? SABOTAGE_NAMES[p.sabotage] : '없음'}</b>
          <p className="muted">상대 운세가 나보다 좋으면 역풍이 불 수 있어요.</p>
          {p.sabotage && <button disabled={!canUse} onClick={onSabotage}>상대 고르기</button>}
        </div>
      </div>
      <p className="note">찬스·방해 카드는 한 장씩만 가질 수 있어요. 카드 칸, 이벤트 맵, 상점에서 얻어요.</p>
    </Sheet>
  )
}

export function playerLine(s: GameState, p: Player) {
  const job = jobOf(p)
  const jobText = job?.id === 'ceo' && p.biz ? `${p.biz.name} 사장 · ${job.ranks[p.jobRank]}` : job ? `${job.name}${job.boom ? ` · ${job.ranks[p.jobRank]}` : ` ${job.ranks[p.jobRank]}`}` : isAdultStage(s) ? (p.biz ? `${p.biz.name} 팔고 은퇴` : '백수') : '학생'
  return jobText
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
                <b className="jua">{p.name}</b>
                <span className="muted">{p.human ? '사람' : PERSONALITIES[p.personality]}</span>
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
      <h3 className="jua">최근 기록</h3>
      <div className="log-full">
        {[...s.log].reverse().slice(0, 40).map((l, i) => (
          <div key={i} className={`log-${l.tone}`}>
            {l.playerId !== null && <b style={{ color: s.players[l.playerId].color }}>{s.players[l.playerId].name} </b>}
            {l.text}
          </div>
        ))}
      </div>
    </Sheet>
  )
}

export function GameOver({ s, onRestart }: { s: GameState; onRestart: () => void }) {
  const ranked = [...s.players].map((p) => ({ p, sc: scoreOf(s, p) })).sort((a, b) => b.sc.total - a.sc.total)
  return (
    <div className="sheet-backdrop">
      <div className="sheet">
        <div className="center"><Trophy size={64} /></div>
        <h2 className="jua center">인생 결산</h2>
        <p className="center muted">점수 = 자산 50만당 1점 + 행복 + 상 {AWARD_POINTS}점씩(공동이면 나눔) (집은 지금 시세, 차는 지금 가치로)</p>
        <div className="people">
          {ranked.map(({ p, sc }, i) => (
            <div key={p.id} className="person" style={{ borderColor: p.color }}>
              <div className="person-head">
                <b className="jua rank">{['🥇', '🥈', '🥉'][i] ?? ''}{i + 1}위</b>
                <span className="person-face" style={{ borderColor: p.color }}><Character outfit={p.outfit} size={24} /></span>
                <b className="jua">{p.name}</b>
                <span className="muted">{p.human ? '사람' : PERSONALITIES[p.personality]}</span>
                <b className="jua total">{sc.total}점</b>
              </div>
              <div className="muted">
                {jobOf(p)?.name ?? '백수'} · 자산 {won(sc.assets)} ({sc.assetScore}점){loanTotal(p) + friendDebt(s, p) > 0 ? ` (빚 -${won(loanTotal(p) + friendDebt(s, p))} 포함)` : ''} · 행복 {sc.happy}{sc.awardScore ? ` · 상 ${sc.awardScore}점` : ''}
                {p.spouse ? ` · ${p.spouse.name}와 결혼` : p.divorced ? ' · 이혼' : ' · 비혼'}
                {p.children + p.adopted ? ` · 자녀 ${p.children + p.adopted}` : ''}
              </div>
              {awardsOf(s, p).length > 0 && <div className="tags">{awardsOf(s, p).map((a) => <span key={a.id} className="award" title={a.desc}>🏆 {a.name} +{a.points}{a.ties > 1 ? ` (${a.ties}명 공동)` : ''}</span>)}</div>}
            </div>
          ))}
        </div>
        <button className="wide big" onClick={onRestart}>새 게임</button>
      </div>
    </div>
  )
}

export const JOB_COUNT = JOBS.length
