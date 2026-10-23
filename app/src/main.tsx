import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* 가로로 눕힌 폰에서만 보임 (App.css) */}
    <div className="rotate-hint" role="alert"><div className="phone" aria-hidden="true" />폰을 세로로 돌려 주세요<small>이 게임은 세로 화면에 맞춰져 있어요</small></div>
  </StrictMode>,
)
