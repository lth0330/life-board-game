// 서비스 워커 (2026-11-28 사용자: 와이파이 없이도 혼자 하기). 빌드할 때 vite.config.ts가 VERSION·FILES를 채워 dist/sw.js로 만듦
// - 처음 인터넷으로 열 때 게임 파일(화면·그림·소리·미니게임·장면)을 전부 폰에 저장
// - 그다음부터 인터넷이 없으면 저장해 둔 파일로 열림 (혼자 하기·한 기기로 하기)
// - 새 버전을 올리면: 인터넷이 될 때 새 파일을 받아 두었다가, 앱을 완전히 닫고 다시 열면 새 버전
// - 글꼴(구글·jsdelivr)은 한 번 쓴 것을 따로 저장. 서버(AWS) 요청은 건드리지 않음
const VERSION = '__VERSION__'
const FILES = __FILES__
const CACHE = `dgl-${VERSION}`
const FONTS = 'dgl-fonts'
// 찾을 때 Vary(요청 출처 등)를 무시: 장면·미니게임 코드는 브라우저가 Origin을 붙여 요청해서, 무시하지 않으면 저장한 파일을 못 찾음 (11-28 시험에서 발견)
const MATCH = { ignoreVary: true }
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net']

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE)
    // 하나가 실패해도 나머지는 저장 (addAll은 하나만 실패해도 전부 실패)
    await Promise.all(['./', ...FILES].map((f) => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('dgl-') && k !== CACHE && k !== FONTS) await caches.delete(k)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // 글꼴: 저장한 게 있으면 바로 쓰고, 뒤에서 새로 받아 둠
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(FONTS)
      const hit = await c.match(req, MATCH)
      const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r }).catch(() => hit)
      return hit ?? net
    })())
    return
  }
  if (url.origin !== self.location.origin) return // 서버(AWS) 요청은 그대로
  // 화면(페이지): 인터넷이 되면 새 것, 안 되면 저장해 둔 첫 화면
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(async () => (await caches.match('./', { cacheName: CACHE, ...MATCH })) ?? (await caches.match(req, MATCH)) ?? Response.error()))
    return
  }
  // 그 밖의 파일(이름에 버전이 붙은 그림·코드·소리): 저장한 것 먼저, 없으면 받아서 저장
  e.respondWith((async () => {
    const hit = await caches.match(req, MATCH)
    if (hit) return hit
    const r = await fetch(req)
    if (r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()) }
    return r
  })())
})
