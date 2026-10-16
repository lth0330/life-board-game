// 온라인: AWS 연결 (로그인·방·행동). 화면은 Online.tsx
import { Amplify } from 'aws-amplify'
import { fetchUserAttributes, getCurrentUser, signIn, signOut, signUp, updateUserAttributes } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import outputs from '../../amplify_outputs.json'

Amplify.configure(outputs)
export const client = generateClient<Schema>()

export type Room = Schema['Room']['type']
export type Action = Schema['Action']['type']

// ───────── 계정 ─────────
// 아이디: 영어 소문자·숫자 4~16자 / 비밀번호: 한글·띄어쓰기 없이 6자 이상, 대문자는 소문자로
export const cleanId = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)
export const cleanPw = (v: string) => v.toLowerCase().replace(/[^\x21-\x7e]/g, '').slice(0, 32)
export const ID_OK = /^[a-z0-9]{4,16}$/
export const PW_OK = /^[\x21-\x7e]{6,32}$/

export interface Me { userId: string; loginId: string; nick: string }

export async function currentMe(): Promise<Me | null> {
  try {
    const u = await getCurrentUser()
    const attrs = await fetchUserAttributes()
    return { userId: u.userId, loginId: u.username, nick: attrs.preferred_username ?? '' }
  } catch {
    return null
  }
}

// 실패하면 화면에 보여 줄 말을 돌려줌
function errText(e: unknown): string {
  const name = (e as { name?: string })?.name ?? ''
  const msg = (e as { message?: string })?.message ?? ''
  if (name === 'UsernameExistsException') return '이미 있는 아이디예요'
  if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') return '아이디나 비밀번호가 맞지 않아요'
  if (name === 'UserAlreadyAuthenticatedException') return '이미 로그인되어 있어요'
  if (msg.includes('아이디는')) return '아이디는 영어 소문자·숫자 4~16자예요'
  if (name === 'NetworkError' || msg.includes('Network')) return '인터넷 연결을 확인해 주세요'
  return '잠시 뒤 다시 해 주세요'
}

export async function join(loginId: string, password: string, nick: string): Promise<string | null> {
  try {
    await signUp({ username: loginId, password, options: { userAttributes: { preferred_username: nick } } })
    await signIn({ username: loginId, password })
    return null
  } catch (e) { return errText(e) }
}

export async function login(loginId: string, password: string): Promise<string | null> {
  try {
    await signIn({ username: loginId, password })
    return null
  } catch (e) { return errText(e) }
}

export async function setNick(nick: string) {
  await updateUserAttributes({ userAttributes: { preferred_username: nick } })
}

export const logoutOnline = () => signOut()

// ───────── 방 ─────────
export type SeatKind = 'human' | 'ai' | 'open'
export interface Seat { kind: SeatKind; userId?: string; name?: string }
export interface RoomSettings { startAdult: boolean; difficulty: 'easy' | 'normal' | 'hard' }
export interface LobbyState { settings: RoomSettings }

export const parse = <T,>(v: unknown, fallback: T): T => {
  if (v == null) return fallback
  if (typeof v === 'string') { try { return JSON.parse(v) as T } catch { return fallback } }
  return v as T
}

// 헷갈리는 글자(0·O·1·I·L)를 뺀 4자리 코드
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

export async function openRooms(code: string) {
  const r = await client.models.Room.listRoomByCode({ code })
  return r.data.filter((x) => x.status !== 'ended')
}

export async function createRoom(me: Me): Promise<Room | string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode()
    if ((await openRooms(code)).length) continue // 쓰고 있는 코드면 다시
    const seats: Seat[] = [{ kind: 'human', userId: me.userId, name: me.nick }, { kind: 'ai' }, { kind: 'open' }, { kind: 'open' }]
    const state: LobbyState = { settings: { startAdult: false, difficulty: 'normal' } }
    const r = await client.models.Room.create({ code, hostName: me.nick, status: 'waiting', seats: JSON.stringify(seats), state: JSON.stringify(state), version: 0 })
    if (r.data) return r.data
    return '방을 만들지 못했어요'
  }
  return '방을 만들지 못했어요. 다시 해 주세요'
}

// 방장만: 자리·설정·상태를 고침
export async function saveRoom(room: Room, patch: { seats?: Seat[]; state?: unknown; status?: 'waiting' | 'playing' | 'ended' }) {
  const r = await client.models.Room.update({
    id: room.id,
    ...(patch.seats ? { seats: JSON.stringify(patch.seats) } : {}),
    ...(patch.state !== undefined ? { state: JSON.stringify(patch.state) } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    version: (room.version ?? 0) + 1,
  })
  return r.data
}

// 행동: 보낸 사람(userId)을 늘 같이 넣음. 방장 기기가 받아서 처리
export interface ActionPayload { userId: string; [k: string]: unknown }
export async function sendAction(roomId: string, me: Me, kind: string, extra: Record<string, unknown> = {}) {
  const payload: ActionPayload = { userId: me.userId, ...extra }
  await client.models.Action.create({ roomId, name: me.nick, kind, payload: JSON.stringify(payload) })
}
