import { useState, type ReactNode } from 'react'
import { CARS, CHANCE_NAMES, HOUSES, INSURANCE, JOBS, LOTTERY_PRICE, PERSONALITIES, SABOTAGE_NAMES, SECTORS } from '../engine/data'
import {
  ageOf, fortuneName, isAdultStage, jobOf, loanLimit, loanTotal, salaryOf, scoreOf, stockHint, stocksValue,
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
  onRepay: () => void
  onClose: () => void
}

export function FinanceSheet(f: FinanceProps) {
  const [tab, setTab] = useState<'lottery' | 'stock' | 'ins' | 'loan'>('stock')
  const { s, p } = f
  const adult = isAdultStage(s)
  const hint = stockHint(s, p)
  const locked = !f.canUse || !adult
  return (
    <Sheet title="재테크" onClose={f.onClose}>
      {!adult && <p className="note">재테크는 청년(성인)부터 할 수 있어요.</p>}
      {adult && !f.canUse && <p className="note">지금은 구경만 할 수 있어요 (내 차례, 주사위 던지기 전에 사용).</p>}
      <div className="tabs" role="tablist">
        {([['stock', '주식'], ['lottery', '복권'], ['ins', '보험'], ['loan', '대출']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'stock' && (
        <div className="list">
          <p className="note">{hint ? `오늘의 운세 힌트: ${hint}` : `운세 ${fortuneName(p.fortune)}: 힌트 없음 (길 이상이면 힌트)`}</p>
          {SECTORS.map((k) => (
            <div key={k} className="row">
              <div className="grow">
                <b>{k}</b> <span className="muted">{won(s.stockPrice[k])}/주</span>
                <div className="muted">보유 {p.stocks[k]}주 · {won(p.stocks[k] * s.stockPrice[k])}</div>
              </div>
              <button disabled={locked || p.money < s.stockPrice[k]} onClick={() => f.onTrade(k, 1)}>+1</button>
              <button disabled={locked || p.money < s.stockPrice[k] * 10} onClick={() => f.onTrade(k, 10)}>+10</button>
              <button disabled={locked || p.stocks[k] < 1} onClick={() => f.onTrade(k, -p.stocks[k])}>전부 팔기</button>
            </div>
          ))}
          <p className="muted">주식 평가액 {won(stocksValue(s, p))}</p>
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
          <p>빌린 돈 <b>{won(loanTotal(p))}</b> / 한도 {won(loanLimit(p))} · 매 턴 이자 1% · 15턴 안에 갚기</p>
          {p.creditBad > 0 && <p className="bad">신용불량 {p.creditBad}턴: 대출 불가</p>}
          {p.loans.map((l, i) => <div key={i} className="muted">· {won(l.amount)} (기한: {l.dueTurn}번째 차례)</div>)}
          <div className="row">
            {[500, 1000, 3000].map((a) => (
              <button key={a} disabled={locked || p.creditBad > 0 || loanTotal(p) + a > loanLimit(p)} onClick={() => f.onLoan(a)}>{won(a)} 빌리기</button>
            ))}
          </div>
          <button className="wide" disabled={locked || !p.loans.length} onClick={f.onRepay}>갚을 수 있는 만큼 갚기</button>
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
  const jobText = job ? `${job.name}${job.boom ? ` · ${job.ranks[p.jobRank]}` : ` ${job.ranks[p.jobRank]}`}` : isAdultStage(s) ? '백수' : '학생'
  return jobText
}

export function PeopleSheet({ s, onClose }: { s: GameState; onClose: () => void }) {
  return (
    <Sheet title="사람들" onClose={onClose}>
      <div className="people">
        {s.players.map((p) => {
          const sc = scoreOf(s, p)
          const tags: string[] = []
          if (p.spouse) tags.push(`배우자 ${p.spouse.name}${p.spouse.revealed ? `(${p.spouse.trait})` : ''}`)
          if (p.children) tags.push(`자녀 ${p.children}`)
          if (p.adopted) tags.push('입양 자녀')
          if (p.pet?.alive) tags.push('반려동물')
          if (p.house) tags.push(HOUSES[p.house].name)
          if (p.car) tags.push(CARS[p.car].name)
          if (p.lottery.addicted) tags.push('도박중독')
          if (p.creditBad) tags.push('신용불량')
          if (p.college) tags.push('대졸')
          return (
            <div key={p.id} className="person" style={{ borderColor: p.color }}>
              <div className="person-head">
                <i style={{ background: p.color }} />
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
        <h2 className="jua center">인생 결산</h2>
        <p className="center muted">점수 = 자산 100만당 1점 + 행복</p>
        <div className="people">
          {ranked.map(({ p, sc }, i) => (
            <div key={p.id} className="person" style={{ borderColor: p.color }}>
              <div className="person-head">
                <b className="jua rank">{i + 1}위</b>
                <b className="jua">{p.name}</b>
                <span className="muted">{p.human ? '사람' : PERSONALITIES[p.personality]}</span>
                <b className="jua total">{sc.total}점</b>
              </div>
              <div className="muted">
                {jobOf(p)?.name ?? '백수'} · 자산 {won(sc.assets)} ({sc.assetScore}점) · 행복 {sc.happy}
                {p.spouse ? ` · ${p.spouse.name}와 결혼` : p.divorced ? ' · 이혼' : ' · 비혼'}
                {p.children + p.adopted ? ` · 자녀 ${p.children + p.adopted}` : ''}
              </div>
            </div>
          ))}
        </div>
        <button className="wide big" onClick={onRestart}>새 게임</button>
      </div>
    </div>
  )
}

export const JOB_COUNT = JOBS.length
