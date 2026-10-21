// 캐릭터 꾸미기 목록. 2026-10-17 새 그림체와 함께 머리 3·옷 6·액세서리 3 추가, 이어서 모자 3·경찰복·가운·우비·마스크 (docs/12-art.md)
import type { Rng } from './rng'

export type Slot = 'hair' | 'hat' | 'top' | 'outer' | 'bottom' | 'shoes' | 'acc'

export interface Outfit {
  gender?: 'm' | 'f' // 남자 / 여자 (예전 저장엔 없음 → 남자)
  skin: string
  hair: string
  hairColor: string
  hat: string
  hatColor: string
  top: string
  topColor: string
  outer: string
  outerColor: string
  bottom: string
  bottomColor: string
  shoes: string
  shoesColor: string
  acc: string
  accColor: string
  // 액세서리 최대 3개 (2026-10-21). 같은 자리(ACC_SPOT)끼리는 하나만
  acc2?: string
  acc2Color?: string
  acc3?: string
  acc3Color?: string
}

export const SKINS = ['#F6D3B3', '#EBB98F', '#C98F62', '#8D5A3B']
export const HAIR_COLORS = ['#2A1E17', '#5A3A21', '#A8692E', '#E2B85C', '#B33B2A', '#8A8F98']
export const CLOTH_COLORS = ['#1B4DDB', '#C2452D', '#2F8F5B', '#F2C230', '#6F45BD', '#F3A3C0', '#2A2118', '#F4EBD6', '#178C8C', '#8A6A55']

export const ITEMS: Record<Slot, { id: string; name: string }[]> = {
  hair: [
    { id: 'short', name: '짧은 머리' }, { id: 'long', name: '긴 머리' }, { id: 'curly', name: '곱슬' },
    { id: 'bun', name: '똥머리' }, { id: 'buzz', name: '삭발' }, { id: 'pony', name: '포니테일' },
    { id: 'bob', name: '단발' }, { id: 'twin', name: '양갈래' }, { id: 'twoblock', name: '투블럭' },
  ],
  hat: [
    { id: 'none', name: '없음' }, { id: 'cap', name: '야구 모자' }, { id: 'beanie', name: '비니' },
    { id: 'bucket', name: '벙거지' }, { id: 'ribbon', name: '리본' }, { id: 'crown', name: '왕관' },
    { id: 'chef', name: '요리사 모자' }, { id: 'santa', name: '산타 모자' }, { id: 'police', name: '경찰 모자' },
  ],
  top: [
    { id: 'tee', name: '티셔츠' }, { id: 'stripe', name: '줄무늬 티' }, { id: 'hoodie', name: '후드티' },
    { id: 'shirt', name: '셔츠' }, { id: 'dress', name: '원피스' },
    { id: 'tie', name: '셔츠+넥타이' }, { id: 'sport', name: '운동복' }, { id: 'hanbok', name: '한복' }, { id: 'police', name: '경찰복' },
  ],
  outer: [
    { id: 'none', name: '없음' }, { id: 'jacket', name: '자켓' }, { id: 'coat', name: '코트' },
    { id: 'cardigan', name: '가디건' }, { id: 'vest', name: '조끼' }, { id: 'padding', name: '패딩' }, { id: 'gown', name: '가운' }, { id: 'raincoat', name: '우비' },
  ],
  bottom: [
    { id: 'pants', name: '바지' }, { id: 'jeans', name: '청바지' }, { id: 'shorts', name: '반바지' }, { id: 'skirt', name: '치마' },
    { id: 'track', name: '트레이닝 바지' }, { id: 'longskirt', name: '긴 치마' },
  ],
  shoes: [
    { id: 'sneakers', name: '운동화' }, { id: 'boots', name: '부츠' }, { id: 'sandals', name: '샌들' }, { id: 'loafers', name: '구두' },
  ],
  acc: [
    { id: 'none', name: '없음' }, { id: 'glasses', name: '안경' }, { id: 'sunglasses', name: '선글라스' },
    { id: 'bag', name: '가방' }, { id: 'scarf', name: '목도리' }, { id: 'necklace', name: '목걸이' }, { id: 'headphones', name: '헤드폰' },
    { id: 'earrings', name: '귀걸이' }, { id: 'hairpin', name: '머리핀' }, { id: 'watch', name: '손목시계' }, { id: 'mask', name: '마스크' },
  ],
}

// 액세서리 자리: 같은 자리끼리는 겹쳐서 하나만
export const ACC_SPOT: Record<string, string> = {
  glasses: 'face', sunglasses: 'face', mask: 'face', headphones: 'head', earrings: 'head', hairpin: 'head',
  scarf: 'neck', necklace: 'neck', bag: 'bag', watch: 'wrist',
}
export const MAX_ACC = 3
export interface Acc { id: string; color: string }
export function accList(o: Outfit): Acc[] {
  return ([[o.acc, o.accColor], [o.acc2, o.acc2Color], [o.acc3, o.acc3Color]] as const)
    .filter(([id]) => id && id !== 'none').map(([id, c]) => ({ id: id!, color: c ?? o.accColor }))
}
export function withAccs(o: Outfit, list: Acc[]): Outfit {
  const [a, b, c] = list
  return { ...o, acc: a?.id ?? 'none', accColor: a?.color ?? o.accColor, acc2: b?.id ?? 'none', acc2Color: b?.color, acc3: c?.id ?? 'none', acc3Color: c?.color }
}
// 고르기: 이미 있으면 빼고, 같은 자리에 있으면 바꾸고, 3개가 넘으면 null (못 넣음)
export function toggleAcc(o: Outfit, id: string, color: string): Outfit | null {
  const list = accList(o)
  if (id === 'none') return withAccs(o, [])
  if (list.some((x) => x.id === id)) return withAccs(o, list.filter((x) => x.id !== id))
  const same = list.findIndex((x) => ACC_SPOT[x.id] === ACC_SPOT[id])
  if (same >= 0) { list[same] = { id, color }; return withAccs(o, list) }
  if (list.length >= MAX_ACC) return null
  return withAccs(o, [...list, { id, color }])
}

export const SLOT_NAMES: Record<Slot, string> = { hair: '머리', hat: '모자', top: '상의', outer: '겉옷', bottom: '하의', shoes: '신발', acc: '액세서리' }

const MALE_HAIR = ['short', 'buzz', 'twoblock']
const FEMALE_HAIR = ['long', 'pony', 'bun', 'bob', 'twin']
// 성별을 바꾸면 머리 모양을 그에 맞게 (직접 고른 건 그대로 두되, 반대 성별 대표 머리만 바꿈)
export function withGender(o: Outfit, gender: 'm' | 'f'): Outfit {
  const hair = gender === 'f' && MALE_HAIR.includes(o.hair) ? 'long' : gender === 'm' && FEMALE_HAIR.includes(o.hair) ? 'short' : o.hair
  return { ...o, gender, hair }
}

export const DEFAULT_OUTFIT: Outfit = {
  gender: 'm', skin: SKINS[0], hair: 'short', hairColor: HAIR_COLORS[0],
  hat: 'none', hatColor: CLOTH_COLORS[1], top: 'tee', topColor: CLOTH_COLORS[0],
  outer: 'none', outerColor: CLOTH_COLORS[6], bottom: 'pants', bottomColor: CLOTH_COLORS[6],
  shoes: 'sneakers', shoesColor: CLOTH_COLORS[7], acc: 'none', accColor: CLOTH_COLORS[3],
}

// AI·친구용 무작위 옷차림. 대표 색(플레이어 색)을 상의에 써서 누군지 알아보기 쉽게
export function randomOutfit(rng: Rng, mainColor: string): Outfit {
  const pick = (slot: Slot) => rng.pick(ITEMS[slot]).id
  const gender = rng.chance(0.5) ? 'f' : 'm'
  return {
    gender, skin: rng.pick(SKINS), hair: gender === 'f' ? rng.pick(['long', 'pony', 'bun', 'curly', 'bob', 'twin']) : rng.pick(['short', 'curly', 'buzz', 'twoblock']), hairColor: rng.pick(HAIR_COLORS),
    hat: rng.chance(0.4) ? pick('hat') : 'none', hatColor: rng.pick(CLOTH_COLORS),
    top: pick('top'), topColor: mainColor,
    outer: rng.chance(0.35) ? pick('outer') : 'none', outerColor: rng.pick(CLOTH_COLORS),
    bottom: pick('bottom'), bottomColor: rng.pick(CLOTH_COLORS),
    shoes: pick('shoes'), shoesColor: rng.pick(CLOTH_COLORS),
    acc: rng.chance(0.5) ? pick('acc') : 'none', accColor: rng.pick(CLOTH_COLORS),
  }
}

// 저장소나 다른 기기에서 받은 옷차림을 안전하게: 모르는 값은 기본값으로 (깨진 값으로 그림이 망가지지 않게)
const COLOR_OK = /^#[0-9a-fA-F]{6}$/
export function cleanOutfit(v: unknown): Outfit {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const out: Outfit = { ...DEFAULT_OUTFIT, gender: o.gender === 'f' ? 'f' : 'm' }
  for (const slot of Object.keys(ITEMS) as Slot[]) {
    if (typeof o[slot] === 'string' && ITEMS[slot].some((it) => it.id === o[slot])) out[slot] = o[slot] as string
  }
  for (const k of ['skin', 'hairColor', 'hatColor', 'topColor', 'outerColor', 'bottomColor', 'shoesColor', 'accColor'] as const) {
    if (typeof o[k] === 'string' && COLOR_OK.test(o[k] as string)) out[k] = o[k] as string
  }
  // 두·세 번째 액세서리 (모르는 값·같은 자리 겹침은 버림)
  const extra: Acc[] = []
  for (const [k, ck] of [['acc2', 'acc2Color'], ['acc3', 'acc3Color']] as const) {
    const id = o[k], c = o[ck]
    if (typeof id === 'string' && id !== 'none' && ITEMS.acc.some((it) => it.id === id)) extra.push({ id, color: typeof c === 'string' && COLOR_OK.test(c) ? c : out.accColor })
  }
  const list: Acc[] = []
  for (const x of [...accList(out), ...extra]) if (!list.some((y) => ACC_SPOT[y.id] === ACC_SPOT[x.id])) list.push(x)
  return withAccs(out, list.slice(0, MAX_ACC))
}
