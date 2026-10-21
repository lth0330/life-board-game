import { defineAuth } from '@aws-amplify/backend'
import { preSignUp } from './pre-sign-up/resource'
import { customMessage } from './custom-message/resource'

// 로그인: 게임 아이디 + 비밀번호 (이메일 없음, 2026-10-16 사용자). 구글 로그인은 다음에 붙임
// Amplify는 email/phone 로그인만 바로 지원해서, 아이디 로그인으로 바꾸는 설정은 backend.ts에서 함
// 게임 안 이름(닉네임)은 preferred_username에 저장
// 2026-10-21: 가입 때 이메일 필수(확인 코드 없이), 찾기 메일에 아이디 + 코드, 관리자 모임 'admin'
export const auth = defineAuth({
  loginWith: { email: true },
  userAttributes: {
    preferredUsername: { required: false, mutable: true },
  },
  groups: ['admin'],
  triggers: { preSignUp, customMessage },
})
