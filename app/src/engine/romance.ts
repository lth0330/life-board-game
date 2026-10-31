// 연애와 결혼 (2026-10-29 game.ts에서 나눔)
import { josa } from './josa'
import { CAR_RESALE, CARS, DICE_ITEMS, HOUSES, HOUSE_RULES, MAX_DICE_ITEMS, PRESTIGE_JOBS, SECTORS, SPOUSE_NAMES, TRAITS } from './data'
import type { ChoiceOption, DiceItem, GameState, Player, Sector, Suitor } from './types'
import { breakSavings } from './money'
import {
  adoptPet, canBankLoan, carChargesAt, carCost, carResale, couponOff, giveChance, hasMortgage, HOUSE_HAPPY, houseCost, housePriceOf, houseValue,
  LOAN_RATE, LOAN_TURNS, loanLimit, log, mortgagePlan, randomChance, rngOf, say, spend, stageOf, tileOf, won,
} from './game'

// ───────── 연애와 결혼 ─────────

export type Attr = 'looks' | 'wealth' | 'fame' | 'kindness'

export function makeSuitor(s: GameState, p: Player, opts: { attr?: Attr | null; vip?: boolean } = {}): Suitor {
  const rng = rngOf(s)
  const boost = (PRESTIGE_JOBS.includes(p.jobId ?? '') ? 1 : 0) + (p.car === 3 ? 1 : 0)
  const base = opts.vip ? [4, 10, 34, 32, 20] : [30, 30, 20, 13, 7]
  const w = base.map((x, i) => [i + 1, Math.max(1, i < 2 ? x - boost * 6 : x + boost * 4)] as const)
  const grade = rng.weighted(w)
  const b = 2 + grade
  const roll = () => Math.max(1, Math.min(10, b + rng.int(-3, 3)))
  const attrs = { looks: roll(), wealth: roll(), fame: roll(), kindness: roll() }
  const keys = Object.keys(attrs) as Attr[]
  const strong = opts.attr ?? rng.pick(keys)
  attrs[strong] = Math.min(10, attrs[strong] + (opts.attr ? 3 : 2))
  const weights = TRAITS.map((t) => {
    let x = 1
    const n = t.name
    if (attrs.kindness >= 7 && (n === '요리왕' || n === '육아 천재')) x *= 3
    if (attrs.kindness >= 7 && (n === '까칠함' || n === '게으름')) x *= 0.3
    if (attrs.kindness <= 3 && (n === '까칠함' || n === '게으름')) x *= 3
    if (attrs.looks >= 7 && (n === '운동 마니아' || n === '명품 중독' || n === '바람기')) x *= 2.5
    if (attrs.fame >= 7 && (n === '인맥왕' || n === '도박증' || n === '술고래' || n === '바람기')) x *= 2.5
    if (attrs.wealth >= 7 && n === '재테크 고수') x *= 3
    if (attrs.wealth <= 3 && n === '짠돌이') x *= 3
    return [t, x] as const
  })
  const trait = rng.weighted(weights)
  const sector: Sector = attrs.fame >= 7 && rng.chance(0.6) ? '엔터' : attrs.wealth >= 7 && rng.chance(0.5) ? '의료' : rng.pick(SECTORS)
  return {
    name: rng.pick(SPOUSE_NAMES), grade, ...attrs, sector,
    trait: trait.name, traitGood: trait.good, revealed: false, affinity: 0,
  }
}

export const stars = (n: number) => '★'.repeat(n)
export const suitorDesc = (x: Suitor) => `${stars(x.grade)} · 외모 ${x.looks} 재력 ${x.wealth} 명성 ${x.fame} 성격 ${x.kindness} · ${x.sector}`

export function canDate(s: GameState, p: Player) {
  const id = stageOf(s).id
  if (p.spouse || (id !== 'young' && id !== 'middle')) return false
  if (id === 'middle') {
    // 중년 결혼 지점을 지나면 더는 결혼 기회가 없음
    const st = stageOf(s)
    const point = st.tiles.find((t) => t.point === 'marriage')
    if (point && tileOf(s, p).d > point.d) return false
  }
  return true
}

export function dateTile(s: GameState, p: Player) {
  if (p.spouse) {
    if (stageOf(s).id === 'young' && p.children < 3) {
      s.pending = {
        type: 'baby', playerId: p.id, title: '아기를 낳을까요?', text: `지금 자녀 ${p.children}명 (최대 3명). 자녀는 매 턴 행복을 주고 양육비가 들어요. 어른이 되면 용돈을 줘요.`,
        options: [{ id: 'yes', label: '낳는다' }, { id: 'no', label: '나중에' }],
      }
    } else { p.happy += 2; log(s, p.id, `${josa(p.spouse.name, '와/과')} 데이트. 행복 +2`, 'good') }
    return
  }
  if (!canDate(s, p)) { p.happy += 2; log(s, p.id, '좋은 사람들을 만났다. 행복 +2', 'good'); return }
  const fresh = [makeSuitor(s, p), makeSuitor(s, p)]
  const known = [...p.suitors].sort((a, b) => b.affinity - a.affinity).slice(0, 2)
  const options: ChoiceOption[] = [
    ...fresh.map((x, i) => ({ id: `new${i}`, label: `새로운 사람: ${x.name}`, desc: suitorDesc(x) })),
    ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `다시 데이트: ${x.name} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
  ]
  s.pending = { type: 'date', playerId: p.id, title: '데이트', text: '누구와 데이트할까요?', options, data: { fresh } }
}

// 소개팅 회사: 가입 중이면 매 턴 시작마다 만남
export function agencyTurn(s: GameState, p: Player) {
  if (!canDate(s, p)) return
  const known = [...p.suitors].sort((a, b) => b.affinity - a.affinity).slice(0, 2)
  s.pending = {
    type: 'agency', playerId: p.id, title: `소개팅 회사 (${p.agency!.vip ? 'VIP' : '일반'})`, text: '이번 차례 만남을 골라요.',
    options: [
      { id: 'new', label: '새 사람 소개받기', desc: p.agency!.attr ? `${ATTR_NAMES[p.agency!.attr]} 높은 사람으로` : '' },
      ...known.map((x) => ({ id: `old:${x.name}:${x.grade}`, label: `데이트: ${x.name} (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
      { id: 'skip', label: '이번엔 쉬기' },
      { id: 'quit', label: '해지하기' },
    ],
  }
}

const ATTR_NAMES: Record<Attr, string> = { looks: '외모', wealth: '재력', fame: '명성', kindness: '성격' }

// 집·차 값 (쿠폰을 쓰는지에 따라). 대출 끼고 사기는 계약금
export function bigPrice(s: GameState, p: Player, id: string, coupon: boolean) {
  if (id.startsWith('mortgage')) return mortgagePlan(s, p, +id.slice(8), coupon).down
  if (id.startsWith('house')) return houseCost(s, p, +id.slice(5), coupon)
  return carCost(p, +id.slice(3), coupon)
}

// after: 다 사고 다시 열 상점 (소개팅 회사처럼 창이 하나 더 뜨면 그 뒤에 엶)
export function shopBuy(s: GameState, p: Player, optionId: string, useCoupon: boolean, after?: ShopVisit) {
  const rng = rngOf(s)
  p.record.shopBuys++
  const big = /^(house|mortgage|car)\d/.test(optionId)
  if (big && useCoupon) { p.chance = null; log(s, p.id, '할인 쿠폰을 썼다', 'info') }
  if (optionId.startsWith('mortgage')) {
    const i = +optionId.slice(8) as 0 | 1 | 2 | 3
    const m = mortgagePlan(s, p, i, useCoupon)
    const old = p.house ? `${josa(HOUSES[p.house].name, '을/를')} 팔고 ` : ''
    spend(p, m.down)
    p.loans.push({ amount: m.borrow, dueTurn: p.turnsPlayed + HOUSE_RULES.mortgageTurns, kind: '주담대', installment: m.installment, missed: 0 })
    p.house = i; p.happy += HOUSES[i].happy
    log(s, p.id, `${old}${josa(HOUSES[i].name, '을/를')} 대출 끼고 샀다! 계약금 ${won(m.down)}, 매 턴 ${won(m.installment)}씩 갚기. 행복 +${HOUSES[i].happy}`, 'good')
    say(s, p, 'house')
    s.banner = { title: '내 집 마련!', text: `${p.name}: ${HOUSES[i].name}`, tone: 'good' }
  } else if (optionId.startsWith('house')) {
    const i = +optionId.slice(5) as 0 | 1 | 2 | 3
    const cost = houseCost(s, p, i, useCoupon)
    const old = p.house ? `${josa(HOUSES[p.house].name, '을/를')} ${won(houseValue(s, p))}에 팔고 ` : ''
    spend(p, cost); p.house = i; p.happy += HOUSES[i].happy
    log(s, p.id, `${old}${josa(HOUSES[i].name, '을/를')} 샀다! 행복 +${HOUSES[i].happy}`, 'good')
    say(s, p, 'house')
  } else if (optionId.startsWith('car')) {
    const i = +optionId.slice(3) as 0 | 1 | 2 | 3
    const cost = carCost(p, i, useCoupon)
    const old = p.car ? `${josa(CARS[p.car].name, '을/를')} ${won(carResale(p))}에 팔고 ` : ''
    spend(p, cost)
    p.carValue = CARS[i].price
    // 차를 바꿔도 이번 단계에 이미 쓴 횟수는 이어진다
    const usedThisStage = p.car ? carChargesAt(p, s.stageIdx) - p.carCharges : 0
    p.car = i
    p.carStage = s.stageIdx
    p.carCharges = Math.max(0, carChargesAt(p, s.stageIdx) - usedThisStage)
    if (i === 3) p.happy += 4
    log(s, p.id, `${old}${josa(CARS[i].name, '을/를')} 샀다!`, 'good')
  } else if (optionId.startsWith('agency')) {
    const vip = optionId === 'agency1'
    s.pending = {
      type: 'agencyAttr', playerId: p.id, title: `소개팅 회사 ${vip ? 'VIP' : '일반'} 가입`, text: '어떤 사람을 소개받고 싶나요?',
      options: [...(Object.keys(ATTR_NAMES) as Attr[]).map((a) => ({ id: a, label: `${ATTR_NAMES[a]} 높은 사람` })), { id: 'none', label: '상관없음' }],
      data: { vip, visit: after },
    }
  } else if (optionId === 'chance') {
    spend(p, 100)
    giveChance(s, p, randomChance(rng))
  } else if (optionId === 'pet') {
    spend(p, 50)
    adoptPet(s, p, '상점에서 반려동물을 데려왔다')
  } else if (optionId.startsWith('dice_')) {
    const k = optionId.slice(5) as DiceItem
    if (p.diceItems.length < MAX_DICE_ITEMS) {
      spend(p, DICE_ITEMS[k].price)
      p.diceItems.push(k)
      log(s, p.id, `${josa(DICE_ITEMS[k].name, '을/를')} 샀다 (가진 주사위 아이템 ${p.diceItems.length}개)`, 'info')
    }
  }
}

// 상점: 한 번 들르면 여러 번 살 수 있음. 집·차는 둘 중 하나만, 다른 물건은 원하는 만큼 (2026-10-21 사용자)
// 노년 상점 물건(여행·선물·기부)은 없앰 (2026-10-21 사용자)
export type ShopVisit = { big: boolean; n: number }
export function openShop(s: GameState, p: Player, visit: ShopVisit = { big: false, n: 0 }) {
  const coupon = p.chance === 'coupon' ? 0.7 : 1
  const opts: ChoiceOption[] = []
  if (!visit.big) HOUSES.forEach((h, i) => {
    if (i <= p.house) return
    const cost = houseCost(s, p, i)
    // 지금 집은 시세 그대로(100%) 쳐서 빼 줌 (2026-10-31 사용자: 계산이 안 보였음)
    const sell = p.house ? ` · 지금 ${HOUSES[p.house].name}을 시세 그대로(100%) ${won(houseValue(s, p))}에 팔아서 빼면 ${won(cost)}만 내요` : ''
    opts.push({ id: `house${i}`, label: `${h.name} 사기`, desc: `시세 ${won(housePriceOf(s, i))}${coupon < 1 ? ` (쿠폰 쓰면 -${won(couponOff(housePriceOf(s, i), 1000))})` : ''}${sell} · 매 턴 관리비 ${won(housePriceOf(s, i) * HOUSE_RULES.upkeepRate)}`, disabled: p.money < cost })
    if (p.money < cost && !hasMortgage(p) && stageOf(s).id !== 'old') {
      const m = mortgagePlan(s, p, i)
      opts.push({ id: `mortgage${i}`, label: `${h.name} 대출 끼고 사기`, desc: `계약금 ${won(m.down)} (30%) · 나머지 ${won(m.borrow)}은 주택담보대출 · 매 턴 ${won(m.installment)}씩 ${HOUSE_RULES.mortgageTurns}턴 자동으로 갚아요 · 3번 못 내면 경매로 넘어가요`, disabled: p.money < m.down || p.creditBad > 0 })
    }
  })
  if (!visit.big && stageOf(s).id !== 'old') CARS.forEach((c, i) => {
    if (i <= p.car) return
    const cost = carCost(p, i)
    const trade = p.car ? ` · 지금 차를 지금 가치의 ${Math.round(CAR_RESALE * 100)}%인 ${won(carResale(p))}에 팔아서 빼면 ${won(cost)}만 내요` : ''
    opts.push({ id: `car${i}`, label: `${c.name} 사기`, desc: `${won(c.price)}${coupon < 1 ? ` (쿠폰 쓰면 -${won(couponOff(c.price, 500))})` : ''}${trade} · 주사위 ±1 이번 단계 ${c.charges[0]}번, 다음 단계부터 1번씩 늘어나요 · 노년엔 못 사요`, disabled: p.money < cost })
  })
  if (!p.agency && canDate(s, p)) {
    opts.push({ id: 'agency0', label: '소개팅 회사 일반 회원', desc: '매 턴 30만, 연애 시작 100만, 원하는 속성을 고를 수 있어요' })
    opts.push({ id: 'agency1', label: '소개팅 회사 VIP 회원', desc: '매 턴 100만, 연애 시작 300만, 원하는 속성을 고르고 ★3 이상이 잘 나와요' })
  }
  if (!p.pet?.alive) opts.push({ id: 'pet', label: '반려동물 데려오기', desc: `${won(50)} · 매 턴 행복 +1, 사료값이 들어요`, disabled: p.money < 50 })
  opts.push({ id: 'chance', label: '찬스 카드 사기', desc: `${won(100)}${p.chance ? ' · 이미 1장 있어요' : ''}`, disabled: p.money < 100 || !!p.chance })
  const full = p.diceItems.length >= MAX_DICE_ITEMS
  for (const k of Object.keys(DICE_ITEMS) as DiceItem[]) {
    const d = DICE_ITEMS[k]
    opts.push({ id: `dice_${k}`, label: `${d.name} 사기`, desc: `${won(d.price)} · ${d.desc} · 1번 쓰면 끝${full ? ` (이미 ${MAX_DICE_ITEMS}개)` : ''}`, disabled: full || p.money < d.price })
  }
  // 돈이 모자라면 여기서 바로 은행 대출 (2026-10-21 사용자). 일반 대출은 한 번에 하나만
  if (canBankLoan(s, p)) for (const a of [500, 1000, 3000]) {
    if (a <= loanLimit(s, p)) opts.push({ id: `loan${a}`, label: `💳 은행에서 ${won(a)} 빌리기`, desc: `${LOAN_TURNS}턴 안에 한꺼번에 갚아요 · 매 턴 이자 ${LOAN_RATE * 100}% · 빌린 뒤 다시 골라요` })
  }
  opts.push({ id: 'pass', label: visit.n ? '다 샀어요 (나가기)' : '그냥 지나가기' })
  const houseNote = visit.n ? '' : p.house
    ? `\n🏠 내 집 덕분에: 월세 없음 · 매 턴 행복 +${HOUSE_HAPPY[p.house]} · 연애 호감도 +10% · 점수에 집값`
    : `\n🏠 집이 있으면: 월세 없음 · 매 턴 행복 +1(단독주택 +2) · 연애 호감도 +10% · 점수에 집값(시세는 대체로 오름)\n집이 없으면: 매 턴 월세 ${won(HOUSE_RULES.rent)}`
  const rule = visit.big ? '집·차는 이번에 샀어요. 다른 물건은 더 살 수 있어요.' : '집·차는 하나만, 다른 물건은 원하는 만큼 살 수 있어요.'
  s.pending = { type: 'shop', playerId: p.id, title: '상점', text: `가진 돈 ${won(p.money)}. ${rule}${houseNote}`, options: opts, data: visit }
}

export function triggerPoint(s: GameState, p: Player, kind: 'shop' | 'marriage') {
  if (kind === 'shop') {
    // AI: 적금에 넣어 둔 돈은 상점에서 꺼내 씀
    if (!p.human && p.savings && p.money < 2000) breakSavings(s, p) // 쓸 돈이 모자랄 때만 깸 (수수료가 생겨서)
    openShop(s, p)
    return
  }
  if (p.spouse) return
  const cands = p.suitors.filter((x) => x.affinity >= 50)
  if (!cands.length) { log(s, p.id, '결혼 지점: 호감도 50% 넘는 사람이 없어 그냥 지나갔다', 'info'); return }
  s.pending = {
    type: 'marriage', playerId: p.id, title: '결혼 지점', text: '고백할까요? 성공 확률은 호감도에 비례해요.',
    options: [
      ...cands.map((x) => ({ id: `c:${x.name}:${x.grade}`, label: `${x.name}에게 고백 (호감 ${x.affinity}%)`, desc: suitorDesc(x) })),
      { id: 'single', label: '비혼으로 지낸다' },
    ],
  }
}

export function findSuitor(p: Player, key: string) {
  const [, name, grade] = key.split(':')
  return p.suitors.find((x) => x.name === name && String(x.grade) === grade)
}
