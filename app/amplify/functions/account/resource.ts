import { defineFunction } from '@aws-amplify/backend'

// 계정 관리 (2026-10-21): 아이디·비밀번호 찾기 메일, 내 이메일 바꾸기, 관리자 회원 목록·삭제
// data 쪽에 두어야 auth와 서로 기대는 고리가 안 생김
export const account = defineFunction({ name: 'account', resourceGroupName: 'data', timeoutSeconds: 20 })
