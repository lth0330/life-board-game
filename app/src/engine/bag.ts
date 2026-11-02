// 가방 (2026-11-02 사용자): 찬스·방해·💌 다시 만나기 카드와 주사위 아이템을 한 가방에, 모두 합쳐 3개까지
// 같은 것도 여러 개 가질 수 있음. 꽉 찼을 때 새로 생기면 버릴 것을 고름 (칸에서 받을 때·상점에서 살 때 모두)
import { BAG_MAX, CHANCE_NAMES, DICE_ITEMS, SABOTAGE_NAMES } from './data'
import type { BagItem, ChanceCard, DiceItem, GameState, Player, SabotageCard } from './types'

export const CHANCE_IDS: ChanceCard[] = ['reroll', 'block', 'charm', 'coupon']
export const SABOTAGE_IDS: SabotageCard[] = ['rumor', 'stockRumor', 'love', 'lawsuit']
export const DICE_IDS: DiceItem[] = ['twin', 'even', 'odd']

export type BagKind = 'chance' | 'sabotage' | 'reunion' | 'dice'
export const bagKind = (x: BagItem): BagKind =>
  (CHANCE_IDS as string[]).includes(x) ? 'chance' : (SABOTAGE_IDS as string[]).includes(x) ? 'sabotage' : x === 'reunion' ? 'reunion' : 'dice'
export const BAG_KIND_NAME: Record<BagKind, string> = { chance: '찬스 카드', sabotage: '방해 카드', reunion: '💌 카드', dice: '주사위 아이템' }

export function bagName(x: BagItem): string {
  switch (bagKind(x)) {
    case 'chance': return CHANCE_NAMES[x as ChanceCard]
    case 'sabotage': return SABOTAGE_NAMES[x as SabotageCard]
    case 'reunion': return '💌 다시 만나기'
    default: return DICE_ITEMS[x as DiceItem].name
  }
}
// '찬스 카드: 다시 굴리기'처럼 종류까지
export const bagLabel = (x: BagItem) => (bagKind(x) === 'reunion' || bagKind(x) === 'dice' ? bagName(x) : `${BAG_KIND_NAME[bagKind(x)]}: ${bagName(x)}`)

export const bagOf = (p: Player): BagItem[] => p.bag ?? []
export const has = (p: Player, x: BagItem) => bagOf(p).includes(x)
export const bagFull = (p: Player) => bagOf(p).length >= BAG_MAX
export const chancesIn = (p: Player) => bagOf(p).filter((x) => bagKind(x) === 'chance') as ChanceCard[]
export const sabotagesIn = (p: Player) => bagOf(p).filter((x) => bagKind(x) === 'sabotage') as SabotageCard[]
export const diceIn = (p: Player) => bagOf(p).filter((x) => bagKind(x) === 'dice') as DiceItem[]

// 하나 꺼내 씀 (있으면 true)
export function take(p: Player, x: BagItem): boolean {
  const i = bagOf(p).indexOf(x)
  if (i < 0) return false
  p.bag.splice(i, 1)
  return true
}
// 넣기 (꽉 찼으면 false: 부르는 쪽에서 버릴 것을 물어봄)
export function put(p: Player, x: BagItem): boolean {
  if (!p.bag) p.bag = []
  if (p.bag.length >= BAG_MAX) return false
  p.bag.push(x)
  return true
}

// 예전 저장(찬스·방해·💌 따로, 주사위 아이템 따로)을 가방으로 옮김. 3개가 넘으면 앞에서부터 3개
type OldPlayer = Player & { chance?: ChanceCard | null; sabotage?: SabotageCard | null; reunion?: boolean; diceItems?: DiceItem[] }
export function fixOldBag(p: Player) {
  const o = p as OldPlayer
  if (Array.isArray(o.bag)) return
  let chance = o.chance as string | null | undefined
  if (chance === 'shortcut') chance = 'reroll' // 지름길 카드 (2026-10-23 없앰)
  o.bag = [
    ...(chance ? [chance as ChanceCard] : []), ...(o.sabotage ? [o.sabotage] : []), ...(o.reunion ? ['reunion' as const] : []), ...(o.diceItems ?? []),
  ].slice(0, BAG_MAX)
  delete o.chance; delete o.sabotage; delete o.reunion; delete o.diceItems
}
export function fixOldGame(s: GameState | null | undefined) {
  if (s?.players) for (const p of s.players) fixOldBag(p)
  return s
}
