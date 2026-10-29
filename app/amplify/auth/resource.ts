import { defineAuth, secret } from '@aws-amplify/backend'
import { preSignUp } from './pre-sign-up/resource'
import { customMessage } from './custom-message/resource'

// 로그인: 게임 아이디 + 비밀번호 (이메일 없음, 2026-10-16 사용자) + 구글 로그인 (2026-10-29)
// Amplify는 email/phone 로그인만 바로 지원해서, 아이디 로그인으로 바꾸는 설정은 backend.ts에서 함
// 게임 안 이름(닉네임)은 preferred_username에 저장
// 2026-10-21: 가입 때 이메일 필수(확인 코드 없이), 찾기 메일에 아이디 + 코드, 관리자 모임 'admin'
// 구글 로그인 키는 AWS 비밀 보관함(SSM)에: GOOGLE_CLIENT_ID·GOOGLE_CLIENT_SECRET (google.txt, 커밋 안 함)
// 로그인 뒤 돌아올 주소: 이 컴퓨터 시험 서버 + 배포 사이트
const SITES = ['http://localhost:5173/', 'https://main.d16edqa9h9pqgu.amplifyapp.com/']
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
        attributeMapping: { email: 'email' },
      },
      callbackUrls: SITES,
      logoutUrls: SITES,
    },
  },
  userAttributes: {
    preferredUsername: { required: false, mutable: true },
  },
  groups: ['admin'],
  triggers: { preSignUp, customMessage },
})
