// 아이디 칸: 한글로 쳐도 같은 자리 영어 키로 바꿈. 한 글자를 다 친 뒤에 바꿔야 글자가 겹쳐 들어가지 않음
import type { ChangeEvent, CompositionEvent, FocusEvent } from 'react'
import { cleanId } from '../online/client'

export const idInputProps = (setId: (v: string) => void) => ({
  onChange: (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setId((e.nativeEvent as InputEvent).isComposing ? v : cleanId(v))
  },
  onCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => setId(cleanId(e.currentTarget.value)),
  onBlur: (e: FocusEvent<HTMLInputElement>) => setId(cleanId(e.currentTarget.value)),
  autoComplete: 'username', autoCapitalize: 'none', spellCheck: false,
})
