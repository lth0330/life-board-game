// 플레이어가 하는 행동을 '주고받을 수 있는 목록'으로 (온라인에서 손님 기기는 이것만 방장 기기로 보냄)
// 혼자 할 때도 같은 길로 적용해서, 온라인과 혼자 하기가 똑같이 움직이게 함
import {
  buyLottery, choose, contestReady, rpsPick, cur, cureAddiction, finishMini, playChance, repayFriendLoan, repayLoans, requestFriendLoan, roll, seekJob,
  startSabotage, takeLoan, toggleInsurance, tradeStock, deposit, withdraw, giveTeammate,
} from './game'
import type { DiceItem, GameState, InsuranceKind, Sector } from './types'

export type Op =
  | ['roll', number, boolean, DiceItem | null]
  | ['choose', string]
  | ['finishMini', number, number?] // 대회는 누가 끝냈는지도
  | ['contestReady', number]
  | ['rpsPick', number, number] // 가위바위보 동시에: 누가, 무엇을
  | ['buyLottery'] | ['cureAddiction'] | ['seekJob'] | ['playChance'] | ['startSabotage']
  | ['tradeStock', Sector, number]
  | ['toggleInsurance', InsuranceKind]
  | ['takeLoan', number]
  | ['repayLoans', number | undefined, number?]
  | ['requestFriendLoan', number, number, number, number]
  | ['repayFriendLoan', number]
  | ['deposit', number, number?] // 금액, 기간(5·10)
  | ['withdraw', number | undefined]
  | ['giveTeam', number, number]

export function applyOp(s: GameState, op: Op) {
  switch (op[0]) {
    case 'roll': return roll(s, op[1], op[2], op[3])
    case 'choose': return choose(s, op[1])
    case 'finishMini': return finishMini(s, op[1], op[2])
    case 'contestReady': return contestReady(s, op[1])
    case 'rpsPick': return rpsPick(s, op[1], op[2])
    case 'buyLottery': return buyLottery(s)
    case 'cureAddiction': return cureAddiction(s)
    case 'seekJob': return seekJob(s)
    case 'playChance': return playChance(s)
    case 'startSabotage': return startSabotage(s)
    case 'tradeStock': return tradeStock(s, op[1], op[2])
    case 'toggleInsurance': return toggleInsurance(s, op[1])
    case 'takeLoan': return takeLoan(s, op[1])
    case 'repayLoans': return repayLoans(s, op[1], op[2])
    case 'requestFriendLoan': return requestFriendLoan(s, op[1], op[2], op[3], op[4])
    case 'repayFriendLoan': return repayFriendLoan(s, op[1])
    case 'deposit': return deposit(s, op[1], op[2])
    case 'withdraw': return withdraw(s)
    case 'giveTeam': return giveTeammate(s, op[1], op[2])
  }
}

// 이 행동을 할 수 있는 플레이어: 고르기는 선택 창 주인, 미니게임은 그 미니게임 주인, 나머지는 지금 차례인 사람
export function opActor(s: GameState, op: Op): number | null {
  if (op[0] === 'choose') return s.pending?.playerId ?? null
  if (op[0] === 'rpsPick') return ((s.pending?.data as { queue?: number[] } | undefined)?.queue ?? []).includes(op[1]) && s.pending?.type === 'rps' ? op[1] : null
  if (op[0] === 'contestReady') return s.mini?.contest?.queue.includes(op[1]) ? op[1] : null
  if (op[0] === 'finishMini') {
    const c = s.mini?.contest
    if (c) { const who = op[2] ?? s.mini!.playerId; return c.queue.includes(who) ? who : null }
    return s.mini?.playerId ?? null
  }
  return cur(s).id
}
