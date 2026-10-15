import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { sfx } from '../sound'

// 추가 그림 (기본 버전 — 아트 단계에서 다시 그림, docs/12-art.md)
// 이벤트 길 입구 랜드마크, 결정 창 그림

const S = { width: '100%', height: '100%', 'aria-hidden': true } as const
const sign = (name: string, bg: string, y = 228) => (
  <g>
    <rect x="30" y={y} width="200" height="38" rx="10" fill={bg} />
    <text x="130" y={y + 27} textAnchor="middle" fontSize="24" fontFamily="Jua, sans-serif" fill="#fff">{name}</text>
  </g>
)

// 이벤트 길 이름 → 입구 랜드마크
const LANDMARKS = ['운동회', '두뇌 올림피아드', '축제 거리', '카지노', '세계일주']
export function Landmark({ name }: { name: string }) {
  switch (name.includes('학교 축제') ? '축제 거리' : LANDMARKS.find((k) => name.includes(k))) {
    case '운동회':
      return (
        <svg viewBox="0 0 260 270" {...S}>
          <ellipse cx="130" cy="200" rx="120" ry="44" fill="#C9553B" />
          <ellipse cx="130" cy="200" rx="92" ry="28" fill="#6DBB5A" />
          <path d="M60 200h140" stroke="#fff" strokeWidth="4" strokeDasharray="10 8" />
          <path d="M40 60v110M220 60v110" stroke="#7a5232" strokeWidth="6" />
          <path d="M40 60h180" stroke="#7a5232" strokeWidth="4" />
          <g>{['#E34B4B', '#F2C230', '#2E6FD8', '#2F8F5B', '#F3A3C0', '#6F45BD', '#E34B4B'].map((c, i) => <path key={i} d={`M${50 + i * 25} 62l12 0-6 16z`} fill={c} />)}</g>
          {sign('운동회', '#C9553B')}
        </svg>
      )
    case '두뇌 올림피아드':
      return (
        <svg viewBox="0 0 260 270" {...S}>
          <rect x="40" y="100" width="180" height="128" fill="#EDE6FA" />
          <path d="M28 104L130 40l102 64z" fill="#6F45BD" />
          {[60, 100, 140, 180].map((x) => <rect key={x} x={x} y="112" width="16" height="116" fill="#fff" />)}
          <circle cx="130" cy="78" r="18" fill="#F3A3C0" />
          <path d="M120 72q10-12 20 0M118 82q12 8 24 0" stroke="#B0476F" strokeWidth="3" fill="none" />
          {sign('두뇌 올림피아드', '#6F45BD')}
        </svg>
      )
    case '축제 거리':
      return (
        <svg viewBox="0 0 260 270" {...S}>
          <path d="M20 40q110 50 220 0" stroke="#7a5232" strokeWidth="3" fill="none" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={40 + i * 30} cy={52 + Math.sin(i / 2) * 12} r="10" fill={['#E34B4B', '#F2C230', '#F3A3C0', '#2E6FD8'][i % 4]} />)}
          <rect x="50" y="130" width="160" height="98" fill="#F7D774" />
          <path d="M40 130h180l-14-34H54z" fill="#E34B4B" />
          <path d="M90 228v-50h80v50" fill="#B5452F" />
          <path d="M115 150l8 16 18 2-13 12 3 18-16-9-16 9 3-18-13-12 18-2z" fill="#fff" />
          {sign('축제 거리', '#E34B4B')}
        </svg>
      )
    case '카지노':
      return (
        <svg viewBox="0 0 260 270" {...S}>
          <rect x="30" y="80" width="200" height="148" fill="#1E2A44" />
          <rect x="30" y="66" width="200" height="22" fill="#E2B85C" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={42 + i * 25} cy="77" r="5" fill={i % 2 ? '#fff' : '#E34B4B'} />)}
          <rect x="70" y="110" width="120" height="60" rx="8" fill="#2F8F5B" stroke="#E2B85C" strokeWidth="4" />
          <text x="130" y="152" textAnchor="middle" fontSize="34" fontFamily="Jua, sans-serif" fill="#F2C230">777</text>
          <path d="M110 228v-40h40v40" fill="#E2B85C" />
          {sign('카지노', '#B5452F')}
        </svg>
      )
    case '세계일주':
      return (
        <svg viewBox="0 0 260 270" {...S}>
          <rect x="20" y="140" width="220" height="88" fill="#DDEBF5" />
          <path d="M20 140q110-46 220 0" fill="#9CC3E0" />
          <rect x="190" y="70" width="24" height="70" fill="#C9D8E4" /><rect x="180" y="58" width="44" height="18" rx="4" fill="#4E7FA8" />
          <path d="M40 90l60-6 20-22 10 2-10 22 40 0 10-10h8l-4 14 4 14h-8l-10-10-40 0 10 22-10 2-20-22-60-6z" fill="#fff" stroke="#4E7FA8" strokeWidth="3" />
          {[40, 80, 120, 160, 200].map((x) => <rect key={x} x={x} y="170" width="24" height="30" fill="#fff" />)}
          {sign('세계일주 공항', '#2E6FD8')}
        </svg>
      )
    default:
      return null
  }
}

// 결정 창 위 작은 그림. 결정 종류(pending.type)로 고름
const ART: Record<string, (c: string) => ReactElement> = {
  marriage: () => (<g><circle cx="44" cy="52" r="20" fill="none" stroke="#E2B85C" strokeWidth="7" /><circle cx="76" cy="52" r="20" fill="none" stroke="#E2B85C" strokeWidth="7" /><path d="M70 22l6-10 6 10-6 6z" fill="#9CC3E0" /></g>),
  baby: () => (<g><rect x="46" y="30" width="28" height="56" rx="10" fill="#fff" stroke="#9CC3E0" strokeWidth="4" /><rect x="50" y="18" width="20" height="14" rx="4" fill="#F3A3C0" /><path d="M54 52h12M54 64h12" stroke="#9CC3E0" strokeWidth="3" /></g>),
  shop: () => (<g><path d="M30 40h60l-6 50H36z" fill="#2C5E8A" /><path d="M46 40v-8a14 14 0 0 1 28 0v8" stroke="#2C5E8A" strokeWidth="5" fill="none" /><circle cx="60" cy="64" r="8" fill="#F2C230" /></g>),
  job: () => (<g><rect x="26" y="40" width="68" height="44" rx="8" fill="#7a5232" /><rect x="46" y="28" width="28" height="14" rx="4" fill="none" stroke="#7a5232" strokeWidth="5" /><rect x="26" y="56" width="68" height="6" fill="#5a3a21" /></g>),
  biz: () => (<g><rect x="28" y="44" width="64" height="44" fill="#fff" stroke="#B5452F" strokeWidth="4" /><path d="M22 44h76l-8-18H30z" fill="#B5452F" /><path d="M52 88V66h16v22" fill="#F2C230" /><path d="M40 24v-12h40v12" stroke="#2F8F5B" strokeWidth="4" fill="none" /></g>),
  medal: () => (<g><path d="M44 14l16 30 16-30" stroke="#2E6FD8" strokeWidth="8" fill="none" /><circle cx="60" cy="64" r="24" fill="#F2C230" stroke="#E2B85C" strokeWidth="4" /><path d="M60 50l4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z" fill="#fff" /></g>),
  book: () => (<g><path d="M20 30q20-8 40 4v52q-20-12-40-4z" fill="#6F45BD" /><path d="M100 30q-20-8-40 4v52q20-12 40-4z" fill="#8A6BD0" /><path d="M60 34v52" stroke="#fff" strokeWidth="3" /></g>),
  family: () => (<g><path d="M20 54L60 22l40 32v36H20z" fill="#F7D774" /><path d="M14 56L60 18l46 38" stroke="#B5452F" strokeWidth="7" fill="none" /><path d="M52 64a8 8 0 0 1 16 0c0 8-8 12-8 12s-8-4-8-12z" fill="#E34B4B" /></g>),
  sign: () => (<g><path d="M60 20v76" stroke="#7a5232" strokeWidth="6" /><path d="M30 30h50l12 10-12 10H30z" fill="#7a5232" /><path d="M90 56H40l-12 10 12 10h50z" fill="#9b6b43" /></g>),
  dice: () => (<g><rect x="30" y="30" width="60" height="60" rx="12" fill="#fff" stroke="#3a2a1f" strokeWidth="4" /><circle cx="46" cy="46" r="6" fill="#3a2a1f" /><circle cx="60" cy="60" r="6" fill="#E34B4B" /><circle cx="74" cy="74" r="6" fill="#3a2a1f" /></g>),
  heart: () => (<path d="M60 92S22 68 22 44a18 18 0 0 1 38-6 18 18 0 0 1 38 6c0 24-38 48-38 48z" fill="#F3A3C0" stroke="#B0476F" strokeWidth="4" />),
  ticket: () => (<g><rect x="10" y="26" width="100" height="56" rx="8" fill="#F2C230" stroke="#B5452F" strokeWidth="4" /><path d="M82 26v56" stroke="#B5452F" strokeWidth="3" strokeDasharray="5 4" /><text x="46" y="62" textAnchor="middle" fontSize="22" fontFamily="Jua, sans-serif" fill="#B5452F">LOTTO</text><circle cx="96" cy="54" r="7" fill="#E34B4B" /></g>),
  card: () => (<g><rect x="30" y="18" width="46" height="66" rx="6" fill="#6F45BD" transform="rotate(-10 53 51)" /><rect x="46" y="16" width="46" height="66" rx="6" fill="#fff" stroke="#6F45BD" strokeWidth="4" transform="rotate(8 69 49)" /><text x="70" y="58" textAnchor="middle" fontSize="26" fontFamily="Jua, sans-serif" fill="#6F45BD" transform="rotate(8 69 49)">?</text></g>),
  grow: () => (<g><path d="M20 84h80" stroke="#7a5232" strokeWidth="5" /><rect x="28" y="60" width="16" height="24" fill="#6DBB5A" /><rect x="52" y="44" width="16" height="40" fill="#2E6FD8" /><rect x="76" y="24" width="16" height="60" fill="#E34B4B" /><path d="M84 12l10 10M84 12l-10 10" stroke="#E34B4B" strokeWidth="4" /></g>),
  travel: () => (<g><rect x="30" y="38" width="60" height="48" rx="8" fill="#E34B4B" /><path d="M48 38v-10h24v10" stroke="#7a5232" strokeWidth="5" fill="none" /><path d="M30 56h60" stroke="#fff" strokeWidth="4" /><path d="M8 26l26-4 10-10 5 1-5 10 18 0 4-4h4l-2 6 2 6h-4l-4-4-18 0 5 10-5 1-10-10z" fill="#9CC3E0" /></g>),
  amusement: () => (<g><circle cx="60" cy="48" r="34" fill="none" stroke="#E34B4B" strokeWidth="5" /><path d="M60 14v68M26 48h68M36 24l48 48M84 24l-48 48" stroke="#F3A3C0" strokeWidth="3" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={60 + Math.cos(i * 0.785) * 34} cy={48 + Math.sin(i * 0.785) * 34} r="6" fill={['#F2C230', '#2E6FD8', '#2F8F5B', '#6F45BD'][i % 4]} />)}<path d="M50 96l10-14 10 14" stroke="#7a5232" strokeWidth="5" fill="none" /></g>),
  walk: () => (<g><ellipse cx="62" cy="62" rx="30" ry="16" fill="#C98B4E" /><circle cx="92" cy="48" r="13" fill="#C98B4E" /><path d="M96 36l8-6 0 12z" fill="#8A5A2E" /><circle cx="96" cy="46" r="2.5" fill="#3a2a1f" /><path d="M40 74v14M54 76v14M72 76v14M84 74v14" stroke="#8A5A2E" strokeWidth="5" /><path d="M32 58q-14-10-10-22" stroke="#C98B4E" strokeWidth="5" fill="none" /></g>),
  rest: () => (<g><rect x="16" y="54" width="88" height="26" rx="10" fill="#9CC3E0" /><rect x="22" y="38" width="76" height="24" rx="10" fill="#B9D6EA" /><path d="M24 80v8M96 80v8" stroke="#7a5232" strokeWidth="5" /><path d="M88 14a14 14 0 1 0 12 20 12 12 0 0 1-12-20z" fill="#F2C230" /><text x="62" y="30" fontSize="16" fontFamily="Jua, sans-serif" fill="#6F45BD">zZ</text></g>),
  game: () => (<g><path d="M22 44q0-12 14-12h48q14 0 14 12l6 28q2 12-10 12-6 0-12-10H38q-6 10-12 10-12 0-10-12z" fill="#3a2a1f" /><path d="M38 46v16M30 54h16" stroke="#fff" strokeWidth="5" /><circle cx="80" cy="50" r="5" fill="#E34B4B" /><circle cx="90" cy="60" r="5" fill="#2E6FD8" /></g>),
  friends: () => (<g><path d="M18 50h84q-4 34-42 34T18 50z" fill="#fff" stroke="#E34B4B" strokeWidth="4" /><path d="M30 50q10-14 20 0M52 50q10-16 20 0M72 50q8-12 18 0" fill="#E34B4B" /><path d="M86 14L66 50M96 20L72 50" stroke="#7a5232" strokeWidth="4" /></g>),
  playground: () => (<g><path d="M20 90V30h18v60" stroke="#2E6FD8" strokeWidth="5" fill="none" /><path d="M20 44h18M20 58h18M20 72h18" stroke="#2E6FD8" strokeWidth="3" /><path d="M38 30q40 0 62 60" stroke="#E34B4B" strokeWidth="8" fill="none" /></g>),
  karaoke: () => (<g><circle cx="74" cy="32" r="16" fill="#9CC3E0" stroke="#3a2a1f" strokeWidth="4" /><path d="M64 44L30 86" stroke="#3a2a1f" strokeWidth="10" strokeLinecap="round" /><path d="M20 30q6-10 12 0M14 50q6-10 12 0" stroke="#F3A3C0" strokeWidth="4" fill="none" /><text x="96" y="70" fontSize="22" fill="#6F45BD">♪</text></g>),
  hike: () => (<g><path d="M8 88L46 26l20 30 12-14 34 46z" fill="#6DBB5A" /><path d="M46 26l8 13-8 4-8-4z" fill="#fff" /><path d="M78 42l6 8" stroke="#fff" strokeWidth="3" /><path d="M58 14v14l10-5z" fill="#E34B4B" /><path d="M58 14v30" stroke="#7a5232" strokeWidth="2" /></g>),
  garden: () => (<g><rect x="12" y="66" width="96" height="22" rx="4" fill="#8A5A2E" />{[28, 52, 76, 98].map((x) => <g key={x}><path d={`M${x} 66q-10-18 0-26q10 8 0 26z`} fill="#6DBB5A" /><path d={`M${x} 66q-14-6-12-18q12 2 12 18z`} fill="#4F9A5E" /></g>)}<path d="M100 22q-12 4-8 16" stroke="#9CC3E0" strokeWidth="3" fill="none" /></g>),
  trophy: () => (<g><path d="M38 20h44v22a22 22 0 0 1-44 0z" fill="#F2C230" stroke="#E2B85C" strokeWidth="4" /><path d="M38 28H24q0 18 16 20M82 28h14q0 18-16 20" stroke="#E2B85C" strokeWidth="5" fill="none" /><rect x="54" y="62" width="12" height="14" fill="#E2B85C" /><rect x="40" y="76" width="40" height="12" rx="3" fill="#7a5232" /></g>),
  cake: () => (<g><rect x="24" y="52" width="72" height="36" rx="6" fill="#F3A3C0" /><rect x="24" y="52" width="72" height="10" fill="#fff" /><path d="M42 52V34M60 52V30M78 52V34" stroke="#9CC3E0" strokeWidth="5" /><path d="M42 30q-4-6 0-10 4 4 0 10M60 26q-4-6 0-10 4 4 0 10M78 30q-4-6 0-10 4 4 0 10" fill="#F2C230" /></g>),
  broken: () => (<g><path d="M58 90S22 66 22 42a18 18 0 0 1 36-6l-8 16 10 10-8 16z" fill="#C9553B" /><path d="M64 90s34-24 34-48a18 18 0 0 0-34-6l-6 16 10 10-8 16z" fill="#E07A5F" /></g>),
  warn: () => (<g><path d="M60 14l46 78H14z" fill="#F2C230" stroke="#B5452F" strokeWidth="5" strokeLinejoin="round" /><path d="M60 40v26" stroke="#3a2a1f" strokeWidth="8" strokeLinecap="round" /><circle cx="60" cy="78" r="5" fill="#3a2a1f" /></g>),
  grad: () => (<g><path d="M60 22l46 18-46 18-46-18z" fill="#3a2a1f" /><path d="M34 50v18q26 14 52 0V50" fill="#3a2a1f" /><path d="M100 40v28" stroke="#F2C230" strokeWidth="4" /><circle cx="100" cy="70" r="4" fill="#F2C230" /></g>),
  money: () => (<g><rect x="18" y="38" width="84" height="46" rx="6" fill="#6DBB5A" stroke="#2F8F5B" strokeWidth="4" /><circle cx="60" cy="61" r="13" fill="#2F8F5B" /><text x="60" y="68" textAnchor="middle" fontSize="20" fontFamily="Jua, sans-serif" fill="#fff">₩</text></g>),
}
const TYPE_ART: Record<string, string> = {
  marriage: 'marriage', wedding: 'marriage', baby: 'baby', shop: 'shop', job: 'job', career: 'book', adultStart: 'book', campus: 'book', collegeStat: 'book',
  club: 'book', academy: 'book', kidEdu: 'book', bizPick: 'biz', bizRetire: 'biz', athleteNext: 'medal', middleBranch: 'family', stray: 'family',
  fork: 'sign', retire: 'sign', afterRoll: 'dice', date: 'heart', agency: 'heart', agencyAttr: 'heart', agencyMatch: 'heart',
  growPick: 'grow', invest: 'money', overtime: 'money', taxEvade: 'money', loanRequest: 'money', sector: 'money',
}

// 배너 제목으로 그림 고르기
const BANNER_ART: [RegExp, string][] = [
  [/집|대출 끝/, 'family'], [/결혼/, 'marriage'], [/아기/, 'baby'], [/복권/, 'ticket'], [/메달|감독/, 'medal'], [/회사|창업|매각/, 'biz'], [/잔치/, 'cake'],
  [/자녀/, 'grad'], [/수능|대학/, 'grad'], [/이혼/, 'broken'], [/게임 끝/, 'trophy'],
]
// 큰 사건 장면 (배너 위에 크게)
const SCENES: [RegExp, () => ReactElement][] = [
  [/결혼!/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#FFF5F8" />
    <path d="M40 150V70a70 60 0 0 1 140 0v80" fill="none" stroke="#F3A3C0" strokeWidth="10" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={40 + i * 23.3} cy={i === 0 || i === 6 ? 70 : 70 - Math.sin((i / 6) * Math.PI) * 58} r="7" fill={['#fff', '#F3A3C0', '#F2C230'][i % 3]} />)}
    <circle cx="88" cy="78" r="12" fill="#F1C9A5" /><path d="M72 150v-46q16-14 32 0v46z" fill="#2A2118" /><path d="M86 94l2 8 2-8z" fill="#fff" />
    <circle cx="132" cy="78" r="12" fill="#F1C9A5" /><path d="M114 150l6-50q12-10 24 0l6 50z" fill="#fff" stroke="#E8DCE3" strokeWidth="2" /><path d="M122 68q10-12 20 0" fill="#fff" opacity="0.9" />
    <path d="M110 40a6 6 0 0 1 12 0c0 7-6 10-6 10s-6-3-6-10z" fill="#E34B4B" transform="translate(-6 -6)" />
  </g>)],
  [/아기 탄생/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#EAF4FB" />
    {[[30, 30], [180, 26], [60, 60], [160, 70], [110, 18]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 6}l2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z`} fill="#F2C230" />)}
    <path d="M50 96h120l-10 36H60z" fill="#F7D3E2" stroke="#B0476F" strokeWidth="3" />
    <path d="M58 132v14M162 132v14" stroke="#B0476F" strokeWidth="4" />
    <circle cx="110" cy="86" r="16" fill="#F6D3B3" /><path d="M86 100q24-14 48 0v8H86z" fill="#CFE7F5" />
    <circle cx="104" cy="85" r="2" fill="#2A2118" /><circle cx="116" cy="85" r="2" fill="#2A2118" /><path d="M106 92q4 3 8 0" stroke="#2A2118" strokeWidth="1.5" fill="none" />
  </g>)],
  [/내 집 마련|대출 끝/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#FDF6E8" />
    <rect x="60" y="62" width="100" height="78" fill="#F2E2C4" /><path d="M48 66L110 22l62 44z" fill="#B5452F" />
    <rect x="98" y="100" width="24" height="40" fill="#7A5232" /><rect x="70" y="80" width="20" height="18" fill="#CFE7F5" /><rect x="130" y="80" width="20" height="18" fill="#CFE7F5" />
    <g transform="translate(168 96) rotate(-30)"><circle r="10" fill="none" stroke="#E2B85C" strokeWidth="5" /><path d="M10 0h26M28 0v8M34 0v6" stroke="#E2B85C" strokeWidth="5" /></g>
    {[[30, 30], [190, 40], [24, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={['#E34B4B', '#2E6FD8', '#2F8F5B'][i]} />)}
  </g>)],
  [/이혼/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#E9ECF2" />
    <path d="M60 46q0-22 26-22 18 0 24 16 6-16 24-16 26 0 26 22" fill="#9AA6B8" />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${66 + i * 18} 60l-5 12`} stroke="#6E8BB8" strokeWidth="3" strokeLinecap="round" />)}
    <path d="M104 140S70 118 70 98a18 18 0 0 1 34-6l-6 16 10 8-6 24z" fill="#C9553B" /><path d="M116 140s34-22 34-42a18 18 0 0 0-34-6l-6 16 10 8-4 24z" fill="#E07A5F" />
  </g>)],
  [/대학 졸업|합격!/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#F3EDFF" />
    {[[40, 50, -20], [110, 30, 10], [176, 56, 25]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M-26 0L0-10 26 0 0 10z" fill="#2A2118" /><path d="M-14 4v12q14 8 28 0V4" fill="#2A2118" /><path d="M22 2v14" stroke="#F2C230" strokeWidth="3" /></g>)}
    <path d="M70 140q40-40 80 0" fill="#6F45BD" /><circle cx="110" cy="96" r="14" fill="#F1C9A5" />
  </g>)],
  [/골인|게임 끝/, () => (<g>
    <rect x="0" y="0" width="220" height="150" rx="14" fill="#FFF8DC" />
    {Array.from({ length: 6 }, (_, c) => Array.from({ length: 3 }, (_, r) => <rect key={`${c}${r}`} x={40 + c * 23} y={30 + r * 16} width="23" height="16" fill={(c + r) % 2 ? '#2A2118' : '#fff'} />))}
    <path d="M40 30v110M178 30v110" stroke="#7A5232" strokeWidth="5" />
    <g transform="translate(80 92)"><path d="M0 0h60v18a30 30 0 0 1-60 0z" fill="#F2C230" stroke="#E2B85C" strokeWidth="3" /><rect x="24" y="46" width="12" height="10" fill="#E2B85C" /><rect x="14" y="56" width="32" height="8" fill="#7A5232" /></g>
  </g>)],
]

export function BannerArt({ title, tone }: { title: string; tone: string }) {
  const scene = SCENES.find(([re]) => re.test(title))?.[1]
  if (scene) return <svg className="scene-art" viewBox="0 0 220 150" width="220" height="150" aria-hidden="true">{scene()}</svg>
  const key = BANNER_ART.find(([re]) => re.test(title))?.[1] ?? (tone === 'bad' ? 'warn' : null)
  const draw = key ? ART[key] : null
  if (!draw) return null
  return <svg className="banner-art" viewBox="0 0 120 100" width="72" height="60" aria-hidden="true">{draw('')}</svg>
}

export function Trophy({ size = 40 }: { size?: number }) {
  return <svg viewBox="0 0 120 100" width={size} height={size * 0.83} aria-hidden="true">{ART.trophy('')}</svg>
}

// 룰렛: 성공 칸(초록)이 확률만큼. 3바퀴 돌고 결과 칸에 멈춤
export function Roulette({ title, chance, ok, who, onDone }: { title: string; chance: number; ok: boolean; who: string; onDone: () => void }) {
  const [angle, setAngle] = useState(0)
  const [stopped, setStopped] = useState(false)
  const target = useMemo(() => {
    // 바늘은 위(0°). 성공 칸은 0 ~ chance×360°. 그 안이나 밖의 한 점이 위로 오게 돌림
    const span = chance * 360
    const inside = span * (0.2 + Math.random() * 0.6)
    const outside = span + (360 - span) * (0.2 + Math.random() * 0.6)
    return 360 * 4 + (360 - (ok ? inside : outside))
  }, [chance, ok])
  useEffect(() => {
    const t0 = setTimeout(() => setAngle(target), 50)
    const tick = setInterval(() => sfx('spin'), 120)
    const t1 = setTimeout(() => { clearInterval(tick); setStopped(true); sfx(ok ? 'fanfare' : 'lose') }, 2650)
    const t2 = setTimeout(onDone, 4300)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearInterval(tick) }
  }, [target, ok, onDone])
  const big = chance > 0.5 ? 1 : 0
  const a = chance * 2 * Math.PI
  const x = 50 + 46 * Math.sin(a), y = 50 - 46 * Math.cos(a)
  return (
    <button className="roulette-pop" onClick={() => stopped && onDone()} aria-label={`${title}: ${stopped ? (ok ? '성공' : '실패') : '돌아가는 중'}`}>
      <b className="jua">{title}</b>
      <span className="muted">{who} · 성공 확률 {Math.round(chance * 100)}%</span>
      <div className="wheel-wrap">
        <svg className="wheel" viewBox="0 0 100 100" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="#E07A5F" stroke="#2A2118" strokeWidth="3" />
          {chance >= 0.999 ? <circle cx="50" cy="50" r="46" fill="#6DBB5A" /> : <path d={`M50 50 L50 4 A46 46 0 ${big} 1 ${x} ${y} Z`} fill="#6DBB5A" />}
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M50 50 L${50 + 46 * Math.sin(i * Math.PI / 6)} ${50 - 46 * Math.cos(i * Math.PI / 6)}`} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />)}
          <circle cx="50" cy="50" r="7" fill="#2A2118" />
        </svg>
        <svg className="needle" viewBox="0 0 20 24" aria-hidden="true"><path d="M10 24L0 0h20z" fill="#2A2118" /></svg>
      </div>
      {stopped && <b className={`jua roulette-result ${ok ? 'ok' : 'no'}`}>{ok ? '성공!' : '아쉬워요…'}</b>}
    </button>
  )
}

// 칸 사건 팝업: 그림 + 제목 + 이번 칸 기록. 눌러서 닫거나 저절로 꺼짐
export function EventPopup({ art, title, text, tone, who, onClose }: { art: string; title: string; text: string; tone: string; who: string; onClose: () => void }) {
  const draw = ART[art]
  return (
    <button className={`event-pop t-${tone}`} onClick={onClose} aria-label={`${title}: ${text} (눌러서 닫기)`}>
      {draw && <svg viewBox="0 0 120 100" width="150" height="125" aria-hidden="true">{draw('')}</svg>}
      <b className="jua">{title}</b>
      <span className="muted">{who}</span>
      {text.split('\n').map((l, i) => <span key={i}>{l}</span>)}
    </button>
  )
}

export function EventArt({ type }: { type: string }) {
  const draw = ART[TYPE_ART[type] ?? '']
  if (!draw) return null
  return <svg className="event-art" viewBox="0 0 120 100" width="96" height="80" aria-hidden="true">{draw('')}</svg>
}
