// 와이파이 없이 열리게 (2026-11-28): 빌드 결과 파일 목록으로 dist/sw.js를 만드는 vite 플러그인 (sw-template.js 참고). 새 패키지 없이
// (vite.config.ts 쪽에는 node 타입이 없어서 이 파일은 그냥 JS. 타입은 sw-plugin.d.mts)
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p] })

export function offlineSW() {
  return {
    name: 'offline-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [...Object.keys(bundle), ...walk('public').map((p) => relative('public', p).split(String.fromCharCode(92)).join('/'))] // 윈도우 경로 \ → /
        .filter((f) => !f.endsWith('.map') && f !== 'sw.js' && !f.endsWith('.html')).sort()
      const tpl = readFileSync('sw-template.js', 'utf-8')
      const version = createHash('sha1').update(files.join('|') + tpl).digest('hex').slice(0, 10) // 파일이나 워커 내용이 바뀌면 새 버전
      const src = tpl.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files.map((f) => `./${f}`)))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src })
    },
  }
}
