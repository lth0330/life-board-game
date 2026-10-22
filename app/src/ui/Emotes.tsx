// 표정 말풍선: 판 위 캐릭터는 등 뒤라 얼굴이 안 보여서 머리 위에 표정 얼굴을 잠깐 띄움 (docs/12-art.md)
// AI는 좋은 일·나쁜 일에 자동, 플레이어는 직접 골라서
import { useEffect, useState } from 'react'
import { Character, type Expr } from '../art/Character'
import { EMOTES, EMOTE_NAMES } from './emoteData'
import type { Outfit } from '../engine/outfit'

export const EMOTE_MS = 2500 // 말풍선이 떠 있는 시간
export const EMOTE_COOLDOWN_MS = 3000 // 플레이어가 한 번 누르면 쉬는 시간 (도배 막기)


export function EmoteBubble({ outfit, expr, age, size = 64 }: { outfit: Outfit; expr: Expr; age?: number; size?: number }) {
  return (
    <div className="emote-bubble" aria-label={EMOTE_NAMES[expr]} role="img">
      <Character outfit={outfit} expr={expr} age={age} size={size} crop="head" />
    </div>
  )
}

// 플레이어가 고르는 창: 내 캐릭터 얼굴로, 글자 없이 표정만
export function EmotePicker({ outfit, age, onPick, onClose }: { outfit: Outfit; age?: number; onPick: (e: Expr) => void; onClose: () => void }) {
  return (
    <div className="emote-picker-backdrop" onClick={onClose}>
      <div className="emote-picker" role="dialog" aria-label="표정 고르기" onClick={(e) => e.stopPropagation()}>
        {EMOTES.map((e) => (
          <button key={e} aria-label={EMOTE_NAMES[e]} onClick={() => onPick(e)}>
            <Character outfit={outfit} expr={e} age={age} size={52} crop="head" />
          </button>
        ))}
      </div>
    </div>
  )
}

// 가위바위보 손: value가 null이면 가위·바위·보가 차례로 돌아감 (고르는 중), 숫자면 그 손 (0 가위, 1 바위, 2 보)
const HANDS = ['✌️', '✊', '🖐️']
export function RpsBubble({ value }: { value: number | null }) {
  const [k, setK] = useState(0)
  useEffect(() => {
    if (value !== null) return
    const t = setInterval(() => setK((x) => (x + 1) % 3), 160)
    return () => clearInterval(t)
  }, [value])
  return (
    <div className={`emote-bubble rps-bubble${value === null ? ' spin' : ''}`} role="img" aria-label={value === null ? '고르는 중' : ['가위', '바위', '보'][value]}>
      <span>{HANDS[value ?? k]}</span>
    </div>
  )
}
