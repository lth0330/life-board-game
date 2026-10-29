// 자녀 (2026-10-29 game.ts에서 나눔)
import { josa } from './josa'
import { KIDS } from './data'
import type { GameState, Player, Kid } from './types'
import { ageOf, badEvent, clampStat, fortuneName, isAdultStage, log, rngOf, say, scaleOf, stageOf, won, workJob } from './game'

// ───────── 자녀 ─────────

export const isMinor = (k: Kid) => k.result === null
export function kidUpkeep(s: GameState, p: Player) {
  const young = stageOf(s).id === 'young'
  return p.kids.filter(isMinor).reduce((a, k) => a + (young || k.edu === null ? KIDS.youngCost : KIDS.eduCost[k.edu]), 0)
}
export const kidAllowance = (p: Player) =>
  p.kids.reduce((a, k) => a + (k.result === null ? 0 : (k.adopted ? KIDS.adoptAllowance : KIDS.allowance)[k.result]), 0)

export function addKid(s: GameState, p: Player, adopted: boolean) {
  const age = ageOf(s, p)
  const kidAge = adopted ? rngOf(s).int(5, 8) : 0
  p.kids.push({ adopted, bornAge: age - kidAge, edu: null, result: null })
  if (adopted) p.adopted = 1
  else p.children++
  return kidAge
}

// 성인이 된 자녀 판정 + 용돈
function kidsTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const age = ageOf(s, p)
  const avg = Math.round((p.stats.int + p.stats.str + p.stats.cha) / 3)
  for (const k of p.kids) {
    if (k.result !== null || age < k.bornAge + 20) continue
    const dice = rng.int(1, 6)
    const edu = KIDS.eduBonus[k.edu ?? 0]
    const teach = p.jobId === 'teacher' ? 1 : 0 // 교사 특성: 내 아이 교육 (은퇴 뒤에도)
    const score = avg + edu + dice + teach - (k.adopted ? KIDS.adoptPenalty : 0)
    k.result = score >= KIDS.bigAt ? 2 : score >= KIDS.okAt ? 1 : 0
    p.happy += KIDS.resultHappy[k.result]
    const who = k.adopted ? '입양한 아이' : '아이'
    const how = [`${who}가 어른이 됐지만 잘 안 풀렸다…`, `${who}가 어엿한 어른이 됐다`, `${who}가 크게 성공했다!`][k.result]
    log(s, p.id, `${how} (능력치 ${avg} + 교육 ${edu} + 주사위 ${dice}${teach ? ' + 교사 1' : ''}${k.adopted ? ` - ${KIDS.adoptPenalty}` : ''}) 매 턴 용돈 ${won((k.adopted ? KIDS.adoptAllowance : KIDS.allowance)[k.result])}`, k.result ? 'good' : 'bad')
    if (k.result === 2) s.banner = { title: '자녀 대성공!', text: p.name, tone: 'good' }
  }
  // 교육을 적게 하면 말썽이 잦고, 많이 하면 가끔 공부 스트레스
  for (const k of p.kids) {
    if (k.result !== null || k.edu === null || !rng.chance(KIDS.eduTrouble[k.edu])) continue
    const sc = scaleOf(s)
    const b = k.edu === 2
      ? { text: '아이가 공부 스트레스로 힘들어한다', loss: 0, happyLoss: 2 }
      : rng.pick([{ text: '아이가 학교에서 사고를 쳤다', loss: sc * 2, happyLoss: 3 }, { text: '아이가 방황한다', loss: 0, happyLoss: 2 }])
    badEvent(s, p, b)
  }
  // 좋은 사건: 교육을 많이 할수록 잦음 (7살부터)
  for (const k of p.kids) {
    if (k.result !== null || age - k.bornAge < 7 || !rng.chance(KIDS.eduGood[k.edu ?? 0])) continue
    if (rng.chance(0.5)) { p.happy += 3; log(s, p.id, '아이가 공부를 잘해서 상을 받아 왔다 (행복 +3)', 'good') }
    else { const g = scaleOf(s) * 2; p.money += g; p.happy += 1; log(s, p.id, `아이가 대회에서 상금·장학금을 받아 왔다 +${won(g)}`, 'good') }
  }
  // 어른이 된 자녀의 결혼·손주: 다른 플레이어가 축의금을 냄 (돈이 모자라면 마음만)
  for (const k of p.kids) {
    if (k.result === null || k.grandkid) continue
    const wed = !k.married
    if (!rng.chance(wed ? KIDS.wedChance : KIDS.grandChance)) continue
    if (wed) k.married = true
    else k.grandkid = true
    const gift = wed ? KIDS.wedGift : KIDS.grandGift
    const who = k.adopted ? '입양한 아이' : '아이'
    let got = 0
    for (const q of s.players) {
      if (q.id === p.id) continue
      if (q.money < gift) { log(s, q.id, `${p.name}의 ${wed ? '자녀 결혼' : '손주 탄생'}: 형편이 어려워 마음만 보냈다`, 'info'); continue }
      q.money -= gift
      got += gift
      log(s, q.id, `${p.name}의 ${wed ? '자녀 결혼식 축의금' : '손주 탄생 축하금'} -${won(gift)}`, 'info')
    }
    p.money += got
    p.happy += wed ? 3 : 4
    log(s, p.id, `${wed ? `${who}가 결혼했다!` : '손주가 태어났다!'} 행복 +${wed ? 3 : 4}${got ? `, 축의금 +${won(got)}` : ''}`, 'good')
    s.banner = { title: wed ? '자녀 결혼!' : '손주 탄생!', text: p.name, tone: 'good' }
  }
  // 육순·칠순: 어른이 된 자녀가 용돈을 드림
  for (const m of [60, 70]) {
    if (age < m || p.celebrated.includes(m)) continue
    p.celebrated.push(m)
    const grown = p.kids.filter((k) => k.result !== null)
    if (!grown.length) continue
    const gift = grown.reduce((a, k) => a + KIDS.birthdayGift[k.result!], 0)
    p.money += gift
    p.happy += 3
    log(s, p.id, `${m === 60 ? '육순' : '칠순'} 잔치! 자녀들이 용돈 ${won(gift)}을 드렸다 (행복 +3)`, 'good')
    s.banner = { title: `${m === 60 ? '육순' : '칠순'} 잔치`, text: p.name, tone: 'good' }
  }
  const allowance = kidAllowance(p)
  if (allowance) p.money += allowance
  if (p.kids.some((k) => k.result === 0) && rng.chance(0.04)) {
    badEvent(s, p, { text: '다 큰 자녀가 사고를 쳐서 뒷수습했다', loss: scaleOf(s) * 2, happyLoss: 2 })
  }
}

export function eduPending(s: GameState, p: Player) {
  const n = p.kids.filter((k) => isMinor(k) && k.edu === null).length
  s.pending = {
    type: 'kidEdu', playerId: p.id, title: '아이 교육', text: `아이 ${n}명. 어른이 될 때까지 매 턴 1명당 드는 돈이에요. 많이 투자할수록 크게 성공하기 쉬워요.`,
    options: KIDS.eduNames.map((name, i) => ({ id: String(i), label: name, desc: `${KIDS.eduCost[i] ? `매 턴 ${won(KIDS.eduCost[i] * n)}` : '돈 안 듦 · 말썽이 잦아요'}${KIDS.eduBonus[i] ? ` · 성공 판정 +${KIDS.eduBonus[i]}` : ''}` })),
  }
}

export function familyTick(s: GameState, p: Player) {
  const rng = rngOf(s)
  const sc = scaleOf(s)
  const sp = p.spouse
  if (sp) {
    if (isAdultStage(s)) p.money += sp.wealth * 12
    if (sp.kindness >= 7) p.happy += 1
    if (workJob(s, p)?.id === 'chef') p.happy += 1 // 요리사 특성: 집밥
    if (sp.kindness <= 3) {
      p.happy -= 1
      if (rng.chance(0.1)) { p.happy -= 3; log(s, p.id, `${josa(sp.name, '와/과')} 부부 싸움을 했다`, 'bad') }
    }
    if (sp.fame >= 7 && rng.chance(0.08)) {
      p.money += sc * 3
      p.happy += 2
      log(s, p.id, `${josa(sp.name, '이/가')} 방송·광고에 나왔다! 수입 ${won(sc * 3)}`, 'good')
    }
    if (sp.fame >= 7 && rng.chance(0.05)) {
      s.stockPrice[sp.sector] = Math.max(10, Math.round(s.stockPrice[sp.sector] * 0.85))
      badEvent(s, p, { text: `${sp.name} 스캔들! (${sp.sector}주 하락)`, loss: 0, happyLoss: 4 })
    }
    if (sp.fame >= 7 && rng.chance(0.04)) {
      s.stockPrice[sp.sector] = Math.round(s.stockPrice[sp.sector] * 1.15)
      log(s, null, `${p.name}의 배우자 ${sp.name} 큰 성과! ${sp.sector}주 +15%`, 'good')
    }
    if (sp.wealth >= 7 && rng.chance(0.06)) {
      p.money += sc * 2
      log(s, p.id, `${sp.name} 집안에서 도와줬다 +${won(sc * 2)}`, 'good')
    }
    if (rng.chance(0.12)) traitEvent(s, p)
    if (s.stageIdx >= 3 && p.spouse) {
      // 배우자 잘못 사건 (성격이 낮을수록 잘 일어남)
      const myFault = p.lottery.addicted || p.money < 0
      const spouseCh = (sp.kindness <= 3 ? 0.03 : sp.kindness <= 5 ? 0.012 : 0.004) + (sp.trait === '바람기' ? 0.03 : 0)
      if (rng.chance(spouseCh)) divorce(s, p, 'spouse', rng.pick(['외도', '몰래 진 빚', '큰 스캔들']))
      else if (myFault && rng.chance(0.03)) divorce(s, p, 'me', p.lottery.addicted ? '도박중독' : '오래 간 빚')
      else if (workJob(s, p)?.id === 'doctor' && rng.chance(0.04)) divorce(s, p, 'me', '[의사] 일에 바빠 가족에게 소홀했던 것') // 의사 특성
    }
  }
  p.happy += p.kids.filter((k) => k.result === null).length // 어릴 때만 행복, 어른이 되면 행복 대신 용돈
  kidsTick(s, p)
  if (p.pet?.alive) {
    p.happy += 1
    // 운세가 좋으면 더 오래, 나쁘면 조금 빨리
    p.pet.turnsLeft -= p.fortune >= 4 && rng.chance(0.4) ? 0 : p.fortune === 0 && rng.chance(0.4) ? 2 : 1
    if (rng.chance(0.06)) badEvent(s, p, { text: '반려동물이 가구를 망가뜨렸다', loss: sc, happyLoss: 0 })
    if (rng.chance(0.05)) badEvent(s, p, { text: '반려동물 병원비', loss: sc, happyLoss: 1 })
    // 노년에는 능력치가 그대로라 (2026-10-17 사용자) 행복으로 (2026-10-29)
    if (rng.chance(0.06)) {
      if (stageOf(s).id === 'old') { p.happy += 1; log(s, p.id, '반려동물과 꾸준히 산책해서 행복 +1', 'good') }
      else { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, '반려동물과 꾸준히 산책해서 체력 +1', 'good') }
    }
    if (p.pet.turnsLeft <= 0) {
      p.pet.alive = false
      p.happy -= 6
      log(s, p.id, '반려동물이 무지개다리를 건넜다…', 'bad')
    }
  }
}

function traitEvent(s: GameState, p: Player) {
  const sp = p.spouse!
  const sc = scaleOf(s)
  switch (sp.trait) {
    case '짠돌이': p.money += Math.round(sc * 0.5); p.happy -= 1; log(s, p.id, `${josa(sp.name, '이/가')} 아껴서 돈을 모아 왔다 (대신 행복 -1)`, 'info'); break
    case '요리왕': p.happy += 2; log(s, p.id, `${sp.name}의 요리로 행복 +2`, 'good'); break
    case '재테크 고수': p.money += sc; log(s, p.id, `${josa(sp.name, '이/가')} 주식으로 ${won(sc)} 벌었다`, 'good'); break
    case '육아 천재': if (p.children + p.adopted) { p.happy += 3; log(s, p.id, '아이들이 무럭무럭 자란다 (행복 +3)', 'good') } break
    case '운동 마니아':
      if (stageOf(s).id === 'old') { p.happy += 1; log(s, p.id, `${josa(sp.name, '와/과')} 같이 운동해서 행복 +1`, 'good') } // 노년은 능력치 그대로
      else { p.stats.str = clampStat(p.stats.str + 1); log(s, p.id, `${josa(sp.name, '와/과')} 같이 운동해서 체력 +1`, 'good') }
      break
    case '인맥왕': p.money += sc; log(s, p.id, `${josa(sp.name, '이/가')} 좋은 거래를 소개해 줬다 +${won(sc)}`, 'good'); break
    case '도박증': p.money -= sc; log(s, p.id, `${josa(sp.name, '이/가')} 도박으로 ${won(sc)} 날렸다`, 'bad'); break
    case '명품 중독': p.money -= Math.round(sc * 1.5); log(s, p.id, `${sp.name}의 명품 쇼핑 -${won(sc * 1.5)}`, 'bad'); break
    case '까칠함': p.happy -= 3; log(s, p.id, `${josa(sp.name, '와/과')} 다퉜다 (행복 -3)`, 'bad'); break
    case '게으름': p.happy -= 2; log(s, p.id, '집안일이 쌓였다 (행복 -2)', 'bad'); break
    case '술고래': badEvent(s, p, { text: `${josa(sp.name, '이/가')} 술 마시다 다쳤다`, loss: sc, happyLoss: 1, kind: 'health' }); break
    default: break
  }
}

function divorce(s: GameState, p: Player, fault: 'me' | 'spouse', reason: string) {
  const sp = p.spouse!
  if (p.fortune >= 4) {
    log(s, p.id, `[운세 ${fortuneName(p.fortune)}] ${reason} 때문에 이혼 위기… 겨우 넘기고 화해했다`, 'good')
    return
  }
  const sc = scaleOf(s)
  p.happy -= 15
  if (sp.wealth >= 7) p.money += Math.round(Math.max(0, p.money) * 0.1 + sp.wealth * 50)
  else p.money -= Math.round(Math.max(0, p.money) * 0.2)
  const alimony = sc * 4 // 이혼으로 잃는 것(행복·맞벌이)보다 항상 적게
  p.money += fault === 'spouse' ? alimony : -alimony
  p.spouse = null
  p.divorced = true
  p.suitors = [{ ...sp, affinity: fault === 'me' ? 10 : 35 }] // 재결합 후보
  log(s, p.id, `${josa(sp.name, '와/과')} 이혼했다 (${reason} · ${fault === 'spouse' ? '배우자 잘못, 위자료 받음' : '내 잘못, 위자료 냄'})`, 'bad')
  s.banner = { title: '이혼', text: `${josa(p.name, '와/과')} ${sp.name}`, tone: 'bad' }
  say(s, p, 'divorce')
}
