// 로그인과 저장. 지금은 이 기기(브라우저) 안에만 저장하는 기본 버전.
// 나중에 진짜 서버 로그인(예: Supabase)으로 바꿀 때는 이 파일의 함수 속만 바꾸면 된다 (docs/12-art.md "나중에 할 일")
import type { GameState } from './engine/types'
import type { Outfit } from './engine/outfit'

export const SAVE_VERSION = 7 // 저장 형식이 바뀌면 올림 → 예전 저장은 무시

export interface Profile { name: string; pinHash: string; outfit?: Outfit; createdAt: number }
export interface SaveSlot { version: number; savedAt: number; state: GameState }

const PROFILES = 'dgl:profiles'
const SESSION = 'dgl:session'
const saveKey = (name: string) => `dgl:save:${name}`

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

async function hashPin(name: string, pin: string) {
  const data = new TextEncoder().encode(`dgl:${name}:${pin}`)
  try {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // crypto.subtle을 못 쓰는 환경 (http 접속 등): 간단한 해시로 대신
    let h = 0
    for (const b of data) h = (h * 31 + b) | 0
    return `w${h}`
  }
}

export const listProfiles = (): Profile[] => read<Profile[]>(PROFILES, [])

export async function createProfile(name: string, pin: string, outfit?: Outfit): Promise<Profile | string> {
  const n = name.trim()
  if (!n) return '이름을 입력해 주세요'
  if (!/^\d{4}$/.test(pin)) return '비밀번호는 숫자 4자리예요'
  const all = listProfiles()
  if (all.some((p) => p.name === n)) return '이미 있는 이름이에요'
  const profile: Profile = { name: n, pinHash: await hashPin(n, pin), outfit, createdAt: Date.now() }
  if (!write(PROFILES, [...all, profile])) return '저장 공간을 쓸 수 없어요'
  write(SESSION, n)
  return profile
}

export async function login(name: string, pin: string): Promise<Profile | string> {
  const p = listProfiles().find((x) => x.name === name.trim())
  if (!p) return '없는 이름이에요'
  if (p.pinHash !== (await hashPin(p.name, pin))) return '비밀번호가 달라요'
  write(SESSION, p.name)
  return p
}

export function logout() { try { localStorage.removeItem(SESSION) } catch { /* 무시 */ } }

export function currentProfile(): Profile | null {
  const name = read<string | null>(SESSION, null)
  return name ? listProfiles().find((p) => p.name === name) ?? null : null
}

export function updateOutfit(name: string, outfit: Outfit) {
  write(PROFILES, listProfiles().map((p) => (p.name === name ? { ...p, outfit } : p)))
}

export function loadGame(name: string): SaveSlot | null {
  const slot = read<SaveSlot | null>(saveKey(name), null)
  return slot && slot.version === SAVE_VERSION ? slot : null
}

export function saveGame(name: string, state: GameState) {
  write(saveKey(name), { version: SAVE_VERSION, savedAt: Date.now(), state } satisfies SaveSlot)
}

export function deleteGame(name: string) { try { localStorage.removeItem(saveKey(name)) } catch { /* 무시 */ } }
