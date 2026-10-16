import type { PreSignUpTriggerHandler } from 'aws-lambda'

// 게임 아이디: 영어 소문자·숫자 4~16자. 구글 로그인은 아이디 검사 없이 통과
export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource === 'PreSignUp_SignUp') {
    if (!/^[a-z0-9]{4,16}$/.test(event.userName)) throw new Error('아이디는 영어 소문자·숫자 4~16자예요')
  }
  event.response.autoConfirmUser = true
  return event
}
