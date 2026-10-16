import { a, defineData, type ClientSchema } from '@aws-amplify/backend'

// 온라인 방 (2026-10-16 설계)
// - 방장 기기가 게임 엔진을 돌리고, 바뀐 상태(state)를 방에 올림. 방은 방장만 고칠 수 있음
// - 다른 사람은 '행동'(들어가기·주사위·선택 등)만 만들고, 방장 기기가 받아서 적용
// - 첫 버전: 로그인한 사람은 방 코드를 알면 방을 볼 수 있음 (게임 데이터라 민감하지 않음)
const schema = a.schema({
  Room: a
    .model({
      code: a.string().required(), // 초대 코드 4자리
      hostName: a.string(),
      status: a.enum(['waiting', 'playing', 'ended']),
      seats: a.json(), // [{ userId, name, ai }] 자리 목록
      state: a.json(), // 게임 상태 (GameState)
      version: a.integer(), // 상태가 바뀔 때마다 1씩 늘림 (늦게 온 옛 상태 버리기)
    })
    .secondaryIndexes((index) => [index('code')])
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  Action: a
    .model({
      roomId: a.id().required(),
      name: a.string(), // 보낸 사람 게임 안 이름
      kind: a.string().required(), // join, leave, roll, choose, mini …
      payload: a.json(),
    })
    .secondaryIndexes((index) => [index('roomId')])
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
})
