import { defineFunction } from '@aws-amplify/backend'

// 가입할 때 아이디 규칙을 확인하고, 이메일 인증 없이 바로 가입 완료
export const preSignUp = defineFunction({ name: 'pre-sign-up', resourceGroupName: 'auth' })
