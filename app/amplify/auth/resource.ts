import { defineAuth } from '@aws-amplify/backend'

// 로그인: 이메일 + 비밀번호. 가입할 때 이메일로 인증 번호가 감
// 게임 안 이름은 preferred_username에 저장 (나중에 바꿀 수 있음)
export const auth = defineAuth({
  loginWith: { email: true },
  userAttributes: {
    preferredUsername: { required: false, mutable: true },
  },
})
