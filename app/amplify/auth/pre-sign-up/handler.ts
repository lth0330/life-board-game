import type { PreSignUpTriggerHandler } from 'aws-lambda'

// 게임 아이디: 영어 소문자·숫자 4~16자. 구글 로그인은 아이디 검사 없이 통과
// 이메일은 필수 (아이디·비밀번호 찾기용). 확인 코드 없이 인증된 것으로 침 (2026-10-21 사용자 결정)
export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource === 'PreSignUp_SignUp') {
    if (!/^[a-z0-9]{4,16}$/.test(event.userName)) throw new Error('아이디는 영어 소문자·숫자 4~16자예요')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.request.userAttributes.email ?? '')) throw new Error('이메일을 확인해 주세요')
  }
  event.response.autoConfirmUser = true
  if (event.request.userAttributes.email) event.response.autoVerifyEmail = true
  return event
}
