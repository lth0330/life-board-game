/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 시험 시간 제한: 컴퓨터 메모리가 부족하면 5초(기본)를 넘겨 실패해서 30초로 (2026-10-22)
  test: { testTimeout: 30000 },
})
