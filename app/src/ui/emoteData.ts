// 표정 목록·이름, AI 자동 표정 (2026-10-22 Emotes.tsx에서 나눔)
import type { Expr } from '../art/Character'
import type { LogEntry } from '../engine/types'

export const EMOTES: Expr[] = ['normal', 'happy', 'sad', 'surprised', 'angry', 'love', 'tease', 'clap']
export const EMOTE_NAMES: Record<Expr, string> = {
  normal: '기본', happy: '기쁨', sad: '슬픔', surprised: '놀람', angry: '화남', love: '하트', tease: '메롱', clap: '박수',
}
// AI 자동 표정: 기록 한 줄을 보고 고름
export function autoEmote(l: LogEntry): Expr | null {
  if (l.tone === 'bad') return l.text.includes('방해') ? 'angry' : 'sad'
  if (l.tone === 'good') return /복권|대박|떡상/.test(l.text) ? 'surprised' : 'happy'
  return null
}
