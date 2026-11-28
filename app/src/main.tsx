import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './ui/Install' // 설치 신호를 처음부터 들음

// 와이파이 없이도 열리게 게임 파일을 폰에 저장 (2026-11-28, sw-template.js). 배포판에서만
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}) })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* 가로로 눕힌 폰에서만 보임 (App.css) */}
    <div className="rotate-hint" role="alert"><div className="phone" aria-hidden="true" />폰을 세로로 돌려 주세요<small>이 게임은 세로 화면에 맞춰져 있어요</small></div>
  </StrictMode>,
)
