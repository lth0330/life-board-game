// 장면에 나오는 기본 사람들 (11-28 장면 20개 추가): 친구는 내 나이에 맞게, 가족(자녀·손주·부모)은 따로
import { DEFAULT_OUTFIT } from '../engine/outfit'
import { DEFAULT_FRIENDS, type Cast } from './Stage'

/** i번째 친구: 다른 플레이어가 있으면 그 사람, 없으면 기본 친구를 내 나이로 (아이 장면에 어른 친구가 나오지 않게) */
export const pal = (cast: Cast[], i: number): Cast => cast[i] ?? { ...DEFAULT_FRIENDS[(i - 1) % DEFAULT_FRIENDS.length], age: cast[0].age }

/** 엄마·아빠 (아이·학생 장면) */
export const parentOf = (me: Cast): Cast => ({ outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'bun', hairColor: '#3A2A1A', top: 'shirt', topColor: '#F4EBD6', outer: 'cardigan', outerColor: '#C98B55', bottom: 'longskirt', bottomColor: '#5A4A6A', shoes: 'loafers', shoesColor: '#7A4A2A' }, age: Math.min(46, Math.max(38, (me.age ?? 15) + 28)) })

/** 다 큰 자녀 (부모가 노년·중년인 장면): 아들·딸 */
export const grownKids = (me: Cast): Cast[] => {
  const a = Math.max(28, (me.age ?? 70) - 30)
  return [
    { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#2A1E17', top: 'shirt', topColor: '#CFE7F5', outer: 'jacket', outerColor: '#2E4A7A', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118' }, age: a },
    { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'long', hairColor: '#5A3A21', top: 'dress', topColor: '#F3A3C0', shoes: 'loafers', shoesColor: '#C2452D' }, age: a - 2 },
  ]
}

/** 손주 둘 (아이) */
export const grandKids = (): Cast[] => [
  { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#2A1E17', top: 'stripe', topColor: '#F2C230', bottom: 'shorts', bottomColor: '#1B4DDB', shoesColor: '#C2452D' }, age: 7 },
  { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'twin', hairColor: '#5A3A21', top: 'dress', topColor: '#F3A3C0', hat: 'ribbon', hatColor: '#E0533F', shoesColor: '#F3A3C0' }, age: 5 },
]

/** 선생님·사진사 같은 어른 (중년) */
export const TEACHER: Cast = { outfit: { ...DEFAULT_OUTFIT, hair: 'short', hairColor: '#3A2A1A', top: 'tie', topColor: '#FFFFFF', outer: 'vest', outerColor: '#5A6A7A', bottomColor: '#3A3A44', shoes: 'loafers', shoesColor: '#2A2118', acc: 'glasses' }, age: 45 }
/** 카페 손님 */
export const CUSTOMER: Cast = { outfit: { ...DEFAULT_OUTFIT, gender: 'f', hair: 'bob', hairColor: '#2A1E17', top: 'shirt', topColor: '#FFFFFF', outer: 'coat', outerColor: '#C9A27A', bottom: 'skirt', bottomColor: '#2A2118', shoes: 'boots', shoesColor: '#5A3A21', acc: 'bag', accColor: '#C2452D' }, age: 30 }

export const grandName = (me: Cast) => (me.outfit.gender === 'f' ? '할머니' : '할아버지')
export const parentName = (me: Cast) => (me.outfit.gender === 'f' ? '엄마' : '아빠')
