import { a, defineData, type ClientSchema } from '@aws-amplify/backend'
import { account } from '../functions/account/resource'

// 온라인 방 (2026-10-16 설계)
// - 방장 기기가 게임 엔진을 돌리고, 바뀐 상태(state)를 방에 올림. 방은 방장만 고칠 수 있음
// - 다른 사람은 '행동'(들어가기·주사위·선택 등)만 만들고, 방장 기기가 받아서 적용
// - 첫 버전: 로그인한 사람은 방 코드를 알면 방을 볼 수 있음 (게임 데이터라 민감하지 않음)
// - expiresAt: 이 시각(초)이 지나면 AWS가 알아서 지움 (2026-10-21 TTL, backend.ts). 방 7일·행동 1일
const schema = a.schema({
  Room: a
    .model({
      code: a.string().required(), // 초대 코드 4자리
      hostName: a.string(),
      status: a.enum(['waiting', 'playing', 'ended']),
      seats: a.json(), // [{ userId, name, ai }] 자리 목록
      state: a.json(), // 게임 상태 (GameState)
      version: a.integer(), // 상태가 바뀔 때마다 1씩 늘림 (늦게 온 옛 상태 버리기)
      expiresAt: a.integer(), // 마지막으로 바뀐 뒤 7일
    })
    .secondaryIndexes((index) => [index('code')])
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  // 계정마다 하나: 옷차림과 혼자 하던 게임 (본인만 읽고 씀). 2026-10-17 진짜 로그인
  Profile: a
    .model({
      outfit: a.json(), // Outfit
      save: a.json(), // { version, savedAt, state } 혼자 하던 게임 이어 하기 1개
      lastSeen: a.datetime(), // 최근 접속 (관리자 화면, 2026-10-21)
    })
    .authorization((allow) => [allow.owner()]),

  Action: a
    .model({
      roomId: a.id().required(),
      name: a.string(), // 보낸 사람 게임 안 이름
      kind: a.string().required(), // join, leave, roll, choose, mini …
      payload: a.json(),
      expiresAt: a.integer(), // 만든 뒤 1일
    })
    // roomId만으로 찾기(예전부터) + 방 안에서 종류로 찾기(채팅 기록만 바로, 2026-10-29: 대회 장면 신호가 많아져서)
    .secondaryIndexes((index) => [index('roomId'), index('roomId').sortKeys(['kind']).name('byRoomKind').queryField('listActionByRoomAndKind')])
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  // 게임 설정 (관리자가 고침, 모두 읽음). 지금은 공지 하나: 처음 화면·메뉴에 보임 (2026-10-21)
  Setting: a
    .model({
      notice: a.string(), // 공지 (비우면 안 보임)
    })
    .authorization((allow) => [allow.group('admin'), allow.guest().to(['read']), allow.authenticated().to(['read'])]),

  // 계정 관리 (2026-10-21, functions/account)
  // 아이디·비밀번호 찾기: 로그인 전이라 손님도 부름. 등록된 이메일로 아이디 + 코드 메일
  findAccount: a.mutation().arguments({ email: a.string().required() }).returns(a.boolean())
    .authorization((allow) => [allow.guest(), allow.authenticated()]).handler(a.handler.function(account)),
  setMyEmail: a.mutation().arguments({ email: a.string().required() }).returns(a.boolean())
    .authorization((allow) => [allow.authenticated()]).handler(a.handler.function(account)),
  adminUsers: a.query().returns(a.json())
    .authorization((allow) => [allow.group('admin')]).handler(a.handler.function(account)),
  adminUpdateUser: a.mutation().arguments({ id: a.string().required(), nick: a.string(), email: a.string(), password: a.string(), enabled: a.boolean() }).returns(a.boolean())
    .authorization((allow) => [allow.group('admin')]).handler(a.handler.function(account)),
  adminDeleteUser: a.mutation().arguments({ id: a.string().required() }).returns(a.boolean())
    .authorization((allow) => [allow.group('admin')]).handler(a.handler.function(account)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
})
