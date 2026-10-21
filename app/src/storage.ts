// 저장. 2026-10-17부터 계정(AWS)이 진짜 저장소이고, 이 기기에는 빠른 예비용으로 같이 둠.
// 계정 쪽 읽기·쓰기는 account/api.ts (AWS 코드가 커서 로그인할 때만 내려받음)
import type { GameState } from './engine/types'
import type { Outfit } from './engine/outfit'

export const SAVE_VERSION = 12 // 저장 형식이 바뀌면 올림 → 예전 저장은 무시

// 로그인한 사람: 온라인 계정 + 옷차림. cloudId = 계정 저장 칸 번호
export interface Profile { userId: string; loginId: string; nick: string; outfit: Outfit; cloudId: string }
export interface SaveSlot { version: number; savedAt: number; state: GameState }

const ACCOUNT = 'dgl:account' // 마지막으로 로그인한 아이디 (있으면 시작할 때 계정을 불러옴)
const saveKey = (loginId: string) => `dgl:save2:${loginId}`

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
function remove(key: string) { try { localStorage.removeItem(key) } catch { /* 무시 */ } }

// 예전 시험판의 이 기기 프로필(이름 + 숫자 4자리)은 버림 (2026-10-17 사용자 결정)
export function dropOldProfiles() {
  try {
    for (const k of Object.keys(localStorage)) if (k === 'dgl:profiles' || k === 'dgl:session' || k.startsWith('dgl:save:')) localStorage.removeItem(k)
  } catch { /* 무시 */ }
}

export const lastAccount = (): string | null => read<string | null>(ACCOUNT, null)
export function rememberAccount(loginId: string | null) {
  if (loginId) write(ACCOUNT, loginId)
  else remove(ACCOUNT)
}

export const makeSlot = (state: GameState): SaveSlot => ({ version: SAVE_VERSION, savedAt: Date.now(), state })
const valid = (s: SaveSlot | null | undefined): SaveSlot | null => (s && s.version === SAVE_VERSION && s.state ? s : null)

export const loadLocalGame = (loginId: string): SaveSlot | null => valid(read<SaveSlot | null>(saveKey(loginId), null))
export function saveLocalGame(loginId: string, slot: SaveSlot) { write(saveKey(loginId), slot) }
export function deleteLocalGame(loginId: string) { remove(saveKey(loginId)) }

// 이 기기 저장과 계정 저장이 다르면 더 나중에 저장된 쪽 (2026-10-17 사용자 결정: 묻지 않고 자동)
export function newerSave(a: SaveSlot | null | undefined, b: SaveSlot | null | undefined): SaveSlot | null {
  const x = valid(a), y = valid(b)
  if (!x) return y
  if (!y) return x
  return y.savedAt > x.savedAt ? y : x
}

// 새로고침해도 하던 화면으로 돌아가기 (2026-10-21). 탭을 닫으면 잊음 (sessionStorage)
export type Where = { screen: 'play' } | { screen: 'online'; roomId: string }
const WHERE = 'dgl:where'
export function lastWhere(): Where | null {
  try { const raw = sessionStorage.getItem(WHERE); return raw ? (JSON.parse(raw) as Where) : null } catch { return null }
}
export function rememberWhere(w: Where | null) {
  try { if (w) sessionStorage.setItem(WHERE, JSON.stringify(w)); else sessionStorage.removeItem(WHERE) } catch { /* 무시 */ }
}

// AI 차례 속도: 이 기기에 기억 (2026-10-21)
export function savedSpeed(): 'fast' | 'normal' | 'slow' {
  try { const v = localStorage.getItem('dgl:speed'); return v === 'normal' || v === 'slow' ? v : 'fast' } catch { return 'fast' }
}
export function saveSpeed(v: string) { try { localStorage.setItem('dgl:speed', v) } catch { /* 무시 */ } }
