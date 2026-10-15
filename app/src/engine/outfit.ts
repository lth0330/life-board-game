// 캐릭터 꾸미기 목록. 기본 버전 — 나중에 아트 단계에서 그림·개수를 다시 만든다 (docs/12-art.md)
import type { Rng } from './rng'

export type Slot = 'hair' | 'hat' | 'top' | 'outer' | 'bottom' | 'shoes' | 'acc'

export interface Outfit {
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
}

export const SKINS = ['#F6D3B3', '#EBB98F', '#C98F62', '#8D5A3B']
export const HAIR_COLORS = ['#2A1E17', '#5A3A21', '#A8692E', '#E2B85C', '#B33B2A', '#8A8F98']
export const CLOTH_COLORS = ['#1B4DDB', '#C2452D', '#2F8F5B', '#F2C230', '#6F45BD', '#F3A3C0', '#2A2118', '#F4EBD6', '#178C8C', '#8A6A55']

export const ITEMS: Record<Slot, { id: string; name: string }[]> = {
  hair: [
    { id: 'short', name: '짧은 머리' }, { id: 'long', name: '긴 머리' }, { id: 'curly', name: '곱슬' },
    { id: 'bun', name: '똥머리' }, { id: 'buzz', name: '삭발' }, { id: 'pony', name: '포니테일' },
  ],
  hat: [
    { id: 'none', name: '없음' }, { id: 'cap', name: '야구 모자' }, { id: 'beanie', name: '비니' },
    { id: 'bucket', name: '벙거지' }, { id: 'ribbon', name: '리본' }, { id: 'crown', name: '왕관' },
  ],
  top: [
    { id: 'tee', name: '티셔츠' }, { id: 'stripe', name: '줄무늬 티' }, { id: 'hoodie', name: '후드티' },
    { id: 'shirt', name: '셔츠' }, { id: 'dress', name: '원피스' },
  ],
  outer: [
    { id: 'none', name: '없음' }, { id: 'jacket', name: '자켓' }, { id: 'coat', name: '코트' },
    { id: 'cardigan', name: '가디건' }, { id: 'vest', name: '조끼' },
  ],
  bottom: [
    { id: 'pants', name: '바지' }, { id: 'jeans', name: '청바지' }, { id: 'shorts', name: '반바지' }, { id: 'skirt', name: '치마' },
  ],
  shoes: [
    { id: 'sneakers', name: '운동화' }, { id: 'boots', name: '부츠' }, { id: 'sandals', name: '샌들' }, { id: 'loafers', name: '구두' },
  ],
  acc: [
    { id: 'none', name: '없음' }, { id: 'glasses', name: '안경' }, { id: 'sunglasses', name: '선글라스' },
    { id: 'bag', name: '가방' }, { id: 'scarf', name: '목도리' }, { id: 'necklace', name: '목걸이' }, { id: 'headphones', name: '헤드폰' },
  ],
}

export const SLOT_NAMES: Record<Slot, string> = { hair: '머리', hat: '모자', top: '상의', outer: '겉옷', bottom: '하의', shoes: '신발', acc: '액세서리' }

export const DEFAULT_OUTFIT: Outfit = {
  skin: SKINS[0], hair: 'short', hairColor: HAIR_COLORS[0],
  hat: 'none', hatColor: CLOTH_COLORS[1], top: 'tee', topColor: CLOTH_COLORS[0],
  outer: 'none', outerColor: CLOTH_COLORS[6], bottom: 'pants', bottomColor: CLOTH_COLORS[6],
  shoes: 'sneakers', shoesColor: CLOTH_COLORS[7], acc: 'none', accColor: CLOTH_COLORS[3],
}

// AI·친구용 무작위 옷차림. 대표 색(플레이어 색)을 상의에 써서 누군지 알아보기 쉽게
export function randomOutfit(rng: Rng, mainColor: string): Outfit {
  const pick = (slot: Slot) => rng.pick(ITEMS[slot]).id
  return {
    skin: rng.pick(SKINS), hair: pick('hair'), hairColor: rng.pick(HAIR_COLORS),
    hat: rng.chance(0.4) ? pick('hat') : 'none', hatColor: rng.pick(CLOTH_COLORS),
    top: pick('top'), topColor: mainColor,
    outer: rng.chance(0.35) ? pick('outer') : 'none', outerColor: rng.pick(CLOTH_COLORS),
    bottom: pick('bottom'), bottomColor: rng.pick(CLOTH_COLORS),
    shoes: pick('shoes'), shoesColor: rng.pick(CLOTH_COLORS),
    acc: rng.chance(0.5) ? pick('acc') : 'none', accColor: rng.pick(CLOTH_COLORS),
  }
}
