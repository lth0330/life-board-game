// 표정 말풍선: 판 위 캐릭터는 등 뒤라 얼굴이 안 보여서 머리 위에 표정 얼굴을 잠깐 띄움 (docs/12-art.md)
// AI는 좋은 일·나쁜 일에 자동, 플레이어는 직접 골라서
import { useEffect, useState } from 'react'
import { Character, type Expr } from '../art/Character'
import type { LogEntry } from '../engine/types'
import type { Outfit } from '../engine/outfit'

export const EMOTES: Expr[] = ['normal', 'happy', 'sad', 'surprised', 'angry', 'love', 'tease', 'clap']
export const EMOTE_NAMES: Record<Expr, string> = {
  normal: '기본', happy: '기쁨', sad: '슬픔', surprised: '놀람', angry: '화남', love: '하트', tease: '메롱', clap: '박수',
}
export const EMOTE_MS = 2500 // 말풍선이 떠 있는 시간
export const EMOTE_COOLDOWN_MS = 3000 // 플레이어가 한 번 누르면 쉬는 시간 (도배 막기)

// AI 자동 표정: 기록 한 줄을 보고 고름
export function autoEmote(l: LogEntry): Expr | null {
  if (l.tone === 'bad') return l.text.includes('방해') ? 'angry' : 'sad'
  if (l.tone === 'good') return /복권|대박|떡상/.test(l.text) ? 'surprised' : 'happy'
  return null
}

export function EmoteBubble({ outfit, expr, age, size = 64 }: { outfit: Outfit; expr: Expr; age?: number; size?: number }) {
  // 다른 기기에서 온 표정은 기울어진 판 안에 새로 생기면 브라우저가 안 그릴 때가 있어서, 한 박자 뒤 스타일을 바꿔 다시 그리게 함
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`emote-bubble${ready ? ' ready' : ''}`} aria-label={EMOTE_NAMES[expr]} role="img">
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
