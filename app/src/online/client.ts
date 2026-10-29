// 온라인: AWS 연결 (로그인·방·행동). 화면은 Online.tsx
import { Amplify } from 'aws-amplify'
import { confirmResetPassword, fetchAuthSession, fetchUserAttributes, getCurrentUser, signIn, signInWithRedirect, signOut, signUp, updatePassword, updateUserAttributes } from 'aws-amplify/auth'
import 'aws-amplify/auth/enable-oauth-listener' // 구글 로그인에서 돌아왔을 때 로그인을 마무리
import { Hub } from 'aws-amplify/utils'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import type { GameState, MapTheme } from '../engine/types'
import type { Outfit } from '../engine/outfit'
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
export const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (name === 'NotAuthorizedException' && /disabled/i.test(msg)) return '관리자가 잠근 계정이에요'
  if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') return '아이디나 비밀번호가 맞지 않아요'
  if (name === 'UserAlreadyAuthenticatedException') return '이미 로그인되어 있어요'
  if (name === 'CodeMismatchException') return '코드가 맞지 않아요'
  if (name === 'ExpiredCodeException') return '코드가 만료됐어요. 메일을 다시 받아 주세요'
  if (name === 'LimitExceededException' || name === 'TooManyRequestsException') return '너무 많이 시도했어요. 잠시 뒤 다시 해 주세요'
  if (msg.includes('이메일을')) return '이메일을 확인해 주세요'
  if (msg.includes('아이디는')) return '아이디는 영어 소문자·숫자 4~16자예요'
  if (name === 'NetworkError' || msg.includes('Network')) return '인터넷 연결을 확인해 주세요'
  return '잠시 뒤 다시 해 주세요'
}

// 브라우저에 예전 로그인이 남아 있으면 먼저 로그아웃 ('이미 로그인되어 있어요'로 막히지 않게, 2026-10-21)
async function freshSignIn(username: string, password: string) {
  try { await signIn({ username, password }) } catch (e) {
    if ((e as { name?: string })?.name !== 'UserAlreadyAuthenticatedException') throw e
    await signOut()
    await signIn({ username, password })
  }
}

export async function join(loginId: string, password: string, nick: string, email: string): Promise<string | null> {
  try {
    await signOut().catch(() => {})
    await signUp({ username: loginId, password, options: { userAttributes: { preferred_username: nick, email } } })
    await freshSignIn(loginId, password)
    return null
  } catch (e) { return errText(e) }
}

export async function login(loginId: string, password: string): Promise<string | null> {
  try {
    await freshSignIn(loginId, password)
    return null
  } catch (e) { return errText(e) }
}

export async function setNick(nick: string) {
  await updateUserAttributes({ userAttributes: { preferred_username: nick } })
}

export const logoutOnline = () => signOut()

// ───────── 구글 로그인 (2026-10-29) ─────────
// 서버에 구글 로그인 설정이 있을 때만 버튼을 보여 줌
export const googleReady = !!(outputs.auth as { oauth?: { identity_providers?: string[] } }).oauth?.identity_providers?.includes('GOOGLE')
// 구글 로그인 창으로 감 (돌아오면 주소에 ?code=… 가 붙어서 이 사이트가 다시 열림)
export async function googleLogin(): Promise<string | null> {
  try {
    await signOut().catch(() => {})
    await signInWithRedirect({ provider: 'Google' })
    return null
  } catch (e) { return errText(e) }
}
// 구글에서 돌아온 직후: 로그인이 끝날 때까지 기다림 (실패·취소면 null)
export function finishGoogle(): Promise<Me | null> {
  return new Promise((resolve) => {
    let done = false
    const end = (v: Me | null) => { if (done) return; done = true; stop(); clearTimeout(t); resolve(v) }
    const stop = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') void currentMe().then(end)
      if (payload.event === 'signInWithRedirect_failure') end(null)
    })
    const t = setTimeout(() => void currentMe().then(end), 15000) // 신호를 놓쳐도 15초 뒤에 확인
    void currentMe().then((m) => { if (m) end(m) }) // 이미 끝났으면 바로
  })
}

// ───────── 아이디·비밀번호 찾기, 내 계정 (2026-10-21) ─────────
// 그 이메일로 가입한 계정마다 메일(아이디 + 6자리 코드). 있든 없든 같은 대답
export async function sendFindMail(email: string): Promise<string | null> {
  try {
    const r = await client.mutations.findAccount({ email }, { authMode: 'identityPool' })
    return r.errors?.length ? '잠시 뒤 다시 해 주세요' : null
  } catch (e) { return errText(e) }
}
export async function resetWithCode(loginId: string, code: string, newPassword: string): Promise<string | null> {
  try { await confirmResetPassword({ username: loginId, confirmationCode: code, newPassword }); return null } catch (e) { return errText(e) }
}
export async function myEmail(): Promise<string | null> {
  try { return (await fetchUserAttributes()).email ?? null } catch { return null }
}
export async function changeEmail(email: string): Promise<string | null> {
  try {
    const r = await client.mutations.setMyEmail({ email })
    return r.data ? null : '이메일을 바꾸지 못했어요'
  } catch (e) { return errText(e) }
}
export async function changePassword(oldPassword: string, newPassword: string): Promise<string | null> {
  try { await updatePassword({ oldPassword, newPassword }); return null } catch (e) {
    return (e as { name?: string })?.name === 'NotAuthorizedException' ? '지금 비밀번호가 맞지 않아요' : errText(e)
  }
}

// ───────── 관리자 ─────────
export interface AdminUser { id: string; nick: string | null; email: string | null; created: string | null; lastSeen: string | null; admin: boolean; enabled: boolean }
export async function amAdmin(): Promise<boolean> {
  try {
    const t = (await fetchAuthSession()).tokens?.accessToken.payload['cognito:groups']
    return Array.isArray(t) && t.includes('admin')
  } catch { return false }
}
export async function adminUsers(): Promise<AdminUser[] | string> {
  try {
    const r = await client.queries.adminUsers()
    if (r.errors?.length) return r.errors[0].message
    const v = parse<unknown>(r.data, [])
    return typeof v === 'string' ? parse<AdminUser[]>(v, []) : (v as AdminUser[]) // AWSJSON이 글자로 한 번 더 싸여 올 때도
  } catch (e) { return errText(e) }
}
// 회원 고치기: 바꿀 것만 넣음 (닉네임·이메일·새 비밀번호·잠그기/풀기)
export async function adminUpdateUser(id: string, patch: { nick?: string; email?: string; password?: string; enabled?: boolean }): Promise<string | null> {
  try {
    const r = await client.mutations.adminUpdateUser({ id, ...patch })
    return r.data ? null : r.errors?.[0]?.message ?? '고치지 못했어요'
  } catch (e) { return errText(e) }
}

// 게임 설정(공지): 모두 읽고 관리자만 고침. 로그인 전이면 손님 권한으로 읽음
export async function getNotice(): Promise<string> {
  for (const authMode of ['userPool', 'identityPool'] as const) {
    try {
      const r = await client.models.Setting.list({ authMode })
      if (!r.errors?.length) return r.data[0]?.notice ?? ''
    } catch { /* 다음 방법으로 */ }
  }
  return ''
}
export async function setNotice(notice: string): Promise<string | null> {
  try {
    const r = await client.models.Setting.list()
    const row = r.data[0]
    const w = row ? await client.models.Setting.update({ id: row.id, notice }) : await client.models.Setting.create({ notice })
    return w.data ? null : w.errors?.[0]?.message ?? '저장하지 못했어요'
  } catch (e) { return errText(e) }
}

export async function adminDeleteUser(id: string): Promise<string | null> {
  try {
    const r = await client.mutations.adminDeleteUser({ id })
    return r.data ? null : r.errors?.[0]?.message ?? '지우지 못했어요'
  } catch (e) { return errText(e) }
}

// ───────── 방 ─────────
export type SeatKind = 'human' | 'ai' | 'open'
export interface Seat { kind: SeatKind; userId?: string; name?: string; outfit?: Outfit; team?: 0 | 1 } // outfit: 그 사람 계정 옷차림, team: 팀전 팀
export interface RoomSettings { startAdult: boolean; difficulty: 'normal' | 'hard'; teams?: boolean; theme?: MapTheme }
// 방 상태: 대기실 설정 + (시작하면) 플레이어마다 맡은 사람(userId, AI는 null)과 게임 상태
// hostAway: 게임 중에 방장이 나가기를 누름 (방장이 돌아와 상태를 다시 올리면 없어짐)
export interface LobbyState { settings: RoomSettings; owners?: (string | null)[]; game?: GameState; hostAway?: boolean }

export const parse = <T,>(v: unknown, fallback: T): T => {
  if (v == null) return fallback
  if (typeof v === 'string') { try { return JSON.parse(v) as T } catch { return fallback } }
  return v as T
}

// 방 주인 확인: AWS가 주인을 '아이디'로 주기도 하고 '고유번호::아이디'로 주기도 해서 둘 다 봄
export const isRoomOwner = (owner: string | null | undefined, me: Me) =>
  !!owner && (owner === me.loginId || owner === `${me.userId}::${me.loginId}`)

// 자동으로 지울 시각 (초). 방은 바뀔 때마다 7일 뒤로 미룸, 행동은 1일
const DAY = 24 * 60 * 60
const expires = (days: number) => Math.floor(Date.now() / 1000) + days * DAY

// 헷갈리는 글자(0·O·1·I·L)를 뺀 4자리 코드
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

export async function openRooms(code: string) {
  const r = await client.models.Room.listRoomByCode({ code })
  return r.data.filter((x) => x.status !== 'ended')
}

export async function createRoom(me: Me, outfit: Outfit): Promise<Room | string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode()
    if ((await openRooms(code)).length) continue // 쓰고 있는 코드면 다시
    const seats: Seat[] = [{ kind: 'human', userId: me.userId, name: me.nick, outfit }, { kind: 'ai' }, { kind: 'open' }, { kind: 'open' }]
    const state: LobbyState = { settings: { startAdult: false, difficulty: 'normal' } }
    const r = await client.models.Room.create({ code, hostName: me.nick, status: 'waiting', seats: JSON.stringify(seats), state: JSON.stringify(state), version: 0, expiresAt: expires(7) })
    if (r.data) return r.data
    return '방을 만들지 못했어요'
  }
  return '방을 만들지 못했어요. 다시 해 주세요'
}

// 방장만: 자리·설정·상태를 고침
export async function saveRoom(room: Room, patch: { seats?: Seat[]; state?: unknown; status?: 'waiting' | 'playing' | 'ended'; version?: number }) {
  const r = await client.models.Room.update({
    id: room.id,
    ...(patch.seats ? { seats: JSON.stringify(patch.seats) } : {}),
    ...(patch.state !== undefined ? { state: JSON.stringify(patch.state) } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    version: patch.version ?? (room.version ?? 0) + 1,
    expiresAt: expires(7),
  })
  return r.data
}

// 행동: 보낸 사람(userId)을 늘 같이 넣음. 방장 기기가 받아서 처리
export interface ActionPayload { userId: string; [k: string]: unknown }
export async function sendAction(roomId: string, me: Me, kind: string, extra: Record<string, unknown> = {}) {
  const payload: ActionPayload = { userId: me.userId, ...extra }
  await client.models.Action.create({ roomId, name: me.nick, kind, payload: JSON.stringify(payload), expiresAt: expires(1) })
}
