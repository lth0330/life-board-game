// 폰에 앱처럼 설치 (2026-11-03 사용자 B안): 홈 화면 아이콘만 만들고, 열 때마다 사이트에서 새 버전을 불러옴
// 서비스 워커(파일을 폰에 저장해 두는 도우미)는 안 씀 → 업데이트가 늘 바로 보임
import { useEffect, useState } from 'react'
import { Sheet } from './Sheets'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const tell = () => listeners.forEach((f) => f())
// 안드로이드 크롬·삼성 인터넷은 설치할 수 있을 때 이 신호를 줌 (화면이 뜨기 전에 올 수 있어서 처음부터 들음)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; tell() })
  window.addEventListener('appinstalled', () => { deferred = null; tell() })
}

// 이미 설치한 앱으로 열었으면 버튼을 숨김
const standalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isMobile = () => isIOS() || /android/i.test(navigator.userAgent)

export function InstallButton() {
  const [, force] = useState(0)
  const [guide, setGuide] = useState(false)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    listeners.add(f)
    return () => { listeners.delete(f) }
  }, [])
  if (standalone()) return null
  const click = async () => {
    if (!deferred) { setGuide(true); return }
    const e = deferred
    await e.prompt()
    await e.userChoice.catch(() => null)
    deferred = null
    force((n) => n + 1)
  }
  return (
    <>
      <button className="wide ghost" onClick={click}>📲 홈 화면에 앱으로 설치</button>
      {guide && (
        <Sheet title="홈 화면에 설치하기" onClose={() => setGuide(false)}>
          {isIOS() ? (
            <ol className="install-steps">
              <li>사파리 아래쪽(아이패드는 위쪽)의 <b>공유 버튼 ⬆️</b>을 눌러요</li>
              <li>목록을 내려서 <b>'홈 화면에 추가'</b>를 눌러요</li>
              <li>오른쪽 위 <b>'추가'</b>를 누르면 홈 화면에 데굴데굴 아이콘이 생겨요</li>
            </ol>
          ) : isMobile() ? (
            <ol className="install-steps">
              <li>브라우저 오른쪽 위(삼성 인터넷은 아래)의 <b>메뉴 ⋮ / ≡</b>를 눌러요</li>
              <li><b>'홈 화면에 추가'</b> 또는 <b>'앱 설치'</b>를 눌러요</li>
              <li>'설치'를 누르면 홈 화면에 아이콘이 생겨요</li>
            </ol>
          ) : (
            <ol className="install-steps">
              <li>크롬·엣지 주소창 오른쪽의 <b>설치 아이콘(⊕ 또는 컴퓨터 모양)</b>을 눌러요</li>
              <li>안 보이면 메뉴 ⋮ → <b>'앱' → '이 사이트를 앱으로 설치'</b> (엣지) / <b>'저장 및 공유' → '바로가기 만들기'</b> (크롬)</li>
            </ol>
          )}
          <p className="note">설치해도 열 때마다 사이트에서 새로 불러와서 업데이트는 늘 바로 보여요. 인터넷이 있어야 열려요.</p>
        </Sheet>
      )}
    </>
  )
}
