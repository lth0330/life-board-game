import {
  AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, CognitoIdentityProviderClient, ForgotPasswordCommand,
  ListUsersCommand, ListUsersInGroupCommand, type UserType,
} from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

// AppSync가 부르는 계정 함수. 어떤 일을 할지는 필드 이름으로 정함 (data/resource.ts)
declare const process: { env: Record<string, string | undefined> }
const cognito = new CognitoIdentityProviderClient({})
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const POOL = process.env.USER_POOL_ID!
const CLIENT = process.env.USER_POOL_CLIENT_ID!
const PROFILE = process.env.PROFILE_TABLE!
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Ev { fieldName?: string; info?: { fieldName: string }; arguments: Record<string, string>; identity?: { username?: string; groups?: string[] | null } | null }

const attr = (u: UserType, name: string) => u.Attributes?.find((a) => a.Name === name)?.Value ?? null

async function allUsers(filter?: string) {
  const out: UserType[] = []
  let token: string | undefined
  do {
    const r = await cognito.send(new ListUsersCommand({ UserPoolId: POOL, Filter: filter, PaginationToken: token }))
    out.push(...(r.Users ?? []))
    token = r.PaginationToken
  } while (token)
  return out
}

async function profiles() {
  const items: Record<string, unknown>[] = []
  let key: Record<string, unknown> | undefined
  do {
    const r = await db.send(new ScanCommand({ TableName: PROFILE, ExclusiveStartKey: key }))
    items.push(...(r.Items ?? []))
    key = r.LastEvaluatedKey
  } while (key)
  return items
}
// 프로필 주인: '고유번호::아이디' 또는 '아이디'
const ownerName = (owner: unknown) => String(owner ?? '').split('::').pop()

const isAdmin = (ev: Ev) => !!ev.identity?.groups?.includes('admin')

export const handler = async (ev: Ev) => {
  switch (ev.fieldName ?? ev.info?.fieldName) { // Amplify는 fieldName을 맨 위에 줌
    // 아이디·비밀번호 찾기: 그 이메일로 가입한 계정마다 메일(아이디 + 코드). 있든 없든 같은 대답
    case 'findAccount': {
      const email = (ev.arguments.email ?? '').trim().toLowerCase()
      if (!EMAIL_OK.test(email)) return false
      const users = await allUsers(`email = "${email.replace(/"/g, '')}"`)
      for (const u of users) {
        if (attr(u, 'email_verified') !== 'true' || !u.Username) continue
        await cognito.send(new ForgotPasswordCommand({ ClientId: CLIENT, Username: u.Username })).catch(() => {})
      }
      return true
    }
    // 내 이메일 바꾸기 (확인 코드 없이, 2026-10-21 사용자 결정)
    case 'setMyEmail': {
      const email = (ev.arguments.email ?? '').trim().toLowerCase()
      const me = ev.identity?.username
      if (!me || !EMAIL_OK.test(email)) return false
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: POOL, Username: me,
        UserAttributes: [{ Name: 'email', Value: email }, { Name: 'email_verified', Value: 'true' }],
      }))
      return true
    }
    // 관리자: 회원 목록 (비밀번호는 원래 볼 수 없음)
    case 'adminUsers': {
      if (!isAdmin(ev)) throw new Error('관리자만 쓸 수 있어요')
      const [users, profs, admins] = await Promise.all([
        allUsers(), profiles(),
        cognito.send(new ListUsersInGroupCommand({ UserPoolId: POOL, GroupName: 'admin' })),
      ])
      const seen = new Map<string, string>()
      for (const p of profs) seen.set(ownerName(p.owner) ?? '', String(p.lastSeen ?? p.updatedAt ?? ''))
      const adminNames = new Set((admins.Users ?? []).map((u) => u.Username))
      return users.map((u) => ({
        id: u.Username, nick: attr(u, 'preferred_username'), email: attr(u, 'email'),
        created: u.UserCreateDate?.toISOString() ?? null, lastSeen: seen.get(u.Username ?? '') || null,
        admin: adminNames.has(u.Username),
      }))
    }
    // 관리자: 계정 삭제 + 그 사람 저장(옷차림·혼자 하던 게임)
    case 'adminDeleteUser': {
      if (!isAdmin(ev)) throw new Error('관리자만 쓸 수 있어요')
      const id = ev.arguments.id
      if (!id || id === ev.identity?.username) return false // 나 자신은 못 지움
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: POOL, Username: id }))
      for (const p of await profiles()) if (ownerName(p.owner) === id) await db.send(new DeleteCommand({ TableName: PROFILE, Key: { id: p.id } }))
      return true
    }
  }
  return null
}
