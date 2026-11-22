/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // React는 따로 한 파일로: 게임 코드를 고쳐 다시 올려도 이 파일은 브라우저에 남아 있어 빨리 열림 (2026-10-29)
  build: {
    rollupOptions: {
      output: { manualChunks: (id) => (/node_modules[/](react|react-dom|scheduler)[/]/.test(id) ? 'react' : undefined) },
    },
  },
  // 시험 시간 제한: 컴퓨터 메모리가 부족하면 5초(기본)를 넘겨 실패해서 30초로 (2026-10-22)
  test: { testTimeout: 30000 },
})
