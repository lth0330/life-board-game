import { defineFunction } from '@aws-amplify/backend'

// 비밀번호 찾기 메일에 아이디도 같이 적어 보냄 (아이디 찾기 겸, 2026-10-21)
export const customMessage = defineFunction({ name: 'custom-message', resourceGroupName: 'auth' })
