import type { CustomMessageTriggerHandler } from 'aws-lambda'

// 비밀번호 찾기 메일: 아이디 + 6자리 코드. 아이디만 잊었으면 코드는 안 써도 됨
export const handler: CustomMessageTriggerHandler = async (event) => {
  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailSubject = '[데굴데굴 라이프] 아이디·비밀번호 찾기'
    event.response.emailMessage =
      `<p>데굴데굴 라이프 계정 안내예요.</p>` +
      `<p>아이디: <b>${event.userName}</b></p>` +
      `<p>비밀번호를 바꾸려면 게임의 '아이디·비밀번호 찾기'에 이 코드를 넣어 주세요: <b>${event.request.codeParameter}</b></p>` +
      `<p>직접 요청하지 않았다면 이 메일은 무시해도 돼요.</p>`
  }
  return event
}
