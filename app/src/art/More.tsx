import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { sfx } from '../sound'
import { awning, box, door, gable, sideWin } from './toyParts'

// 추가 그림 (기본 버전 — 아트 단계에서 다시 그림, docs/12-art.md)
// 이벤트 길 입구 랜드마크, 결정 창 그림

// 이벤트 길 입구 랜드마크 (viewBox 0 0 260 270). 2026-10-22 건물과 같은 '장난감 입체' 그림체로 다시 그림
const INK = '#2A2118', GLASS = '#CFE7F5'
const lmPlate = (name: string, bg: string) => {
  const w = Math.min(240, name.length * 22 + 44)
  return (
    <g>
      <rect x={130 - w / 2} y="230" width={w} height="34" rx="9" fill={bg} strokeWidth="4" />
      <text x="130" y="254" textAnchor="middle" fontSize="21" fontFamily="Jua, sans-serif" fill="#fff" stroke="none">{name}</text>
    </g>
  )
}
const lmShadow = (rx: number) => <ellipse cx="134" cy="226" rx={rx} ry="11" fill={INK} opacity="0.2" stroke="none" />
const toy = (body: ReactElement) => (
  <svg viewBox="0 0 260 270" width="100%" height="100%" aria-hidden="true">
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">{body}</g>
  </svg>
)

// 이벤트 길 이름 → 입구 랜드마크
const LANDMARKS = ['운동회', '두뇌 올림피아드', '축제 거리', '카지노', '세계일주']
export function Landmark({ name }: { name: string }) {
  switch (name.includes('학교 축제') ? '축제 거리' : LANDMARKS.find((k) => name.includes(k))) {
    case '운동회':
      // 운동장 트랙 + 만국기 + 출발 아치
      return toy(
        <g>
          <ellipse cx="130" cy="186" rx="122" ry="44" fill="#E07A52" />
          <ellipse cx="130" cy="186" rx="88" ry="26" fill="#7FCB8A" />
          <path d="M70 186h120" stroke="#fff" strokeWidth="4" strokeDasharray="10 8" />
          <path d="M28 168V40M232 168V40" strokeWidth="6" />
          <path d="M28 46q102 34 204 0" fill="none" strokeWidth="3" />
          {['#E34B4B', '#F2C230', '#2E6FD8', '#2F8F5B', '#F3A3C0', '#6F45BD', '#E34B4B', '#F2C230'].map((c, i) => {
            const x = 40 + i * 25, y = 50 + Math.sin(((i + 0.5) / 8) * Math.PI) * 15
            return <path key={i} d={`M${x} ${y}h16l-8 16z`} fill={c} strokeWidth="2.5" />
          })}
          {box(94, 108, 64, 44, '#FFFDF6', true)}
          <path d="M104 152v-28h44v28" fill="#E2553B" strokeWidth="4" />
          <text x="126" y="122" textAnchor="middle" fontSize="13" fontFamily="Jua, sans-serif" fill={INK} stroke="none">START</text>
          {lmPlate('운동회', '#C9553B')}
        </g>,
      )
    case '두뇌 올림피아드':
      // 기둥 있는 전당 + 지붕에 전구(아이디어)
      return toy(
        <g>
          {lmShadow(110)}
          {box(30, 112, 160, 112, '#EDE6FA', false, '#CFC3EA')}
          {gable(30, 160, 112, 60, '#6F45BD')}
          <circle cx="110" cy="84" r="15" fill="#FFE07A" strokeWidth="3.5" />
          <path d="M104 100h12M105 106h10" strokeWidth="3" />
          <path d="M104 86q6-8 12 0" fill="none" strokeWidth="2.5" />
          {[44, 76, 128, 160].map((x) => <rect key={x} x={x} y="128" width="14" height="96" fill="#fff" />)}
          {door(96, 164, 28, 60, '#6F45BD')}
          {sideWin(200, 140, 20, 34)}
          {lmPlate('두뇌 올림피아드', '#6F45BD')}
        </g>,
      )
    case '축제 거리':
      // 무대 + 줄 전구 + 별
      return toy(
        <g>
          {lmShadow(116)}
          <path d="M14 34q116 46 232 0" fill="none" strokeWidth="3" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={30 + i * 28} cy={40 + Math.sin(((i + 0.5) / 8) * Math.PI) * 16} r="8" fill={['#E34B4B', '#F2C230', '#F3A3C0', '#2E6FD8'][i % 4]} strokeWidth="2.5" />)}
          {box(36, 126, 148, 98, '#F7D774', false, '#D9B85A')}
          {awning(36, 148, 104, '#E34B4B')}
          <path d="M60 224v-56h100v56" fill="#B5452F" />
          <path d="M110 160l8 15 17 2-12 12 3 17-16-8-16 8 3-17-12-12 17-2z" fill="#fff" strokeWidth="3" />
          {sideWin(196, 150, 18, 40)}
          {lmPlate('축제 거리', '#E34B4B')}
        </g>,
      )
    case '카지노':
      // 남색 건물 + 금색 전광판 + 777
      return toy(
        <g>
          {lmShadow(116)}
          {box(26, 90, 168, 134, '#2B3A5E', false, '#1E2A44')}
          {box(26, 72, 168, 20, '#E2B85C', true)}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={40 + i * 24} cy="82" r="4.5" fill={i % 2 ? '#fff' : '#E34B4B'} strokeWidth="2" />)}
          <rect x="54" y="108" width="112" height="56" rx="8" fill="#2F8F5B" stroke="#E2B85C" strokeWidth="5" />
          <text x="110" y="148" textAnchor="middle" fontSize="32" fontFamily="Jua, sans-serif" fill="#F2C230" stroke="none">777</text>
          <path d="M90 224v-44h40v44" fill="#E2B85C" strokeWidth="4" />
          <path d="M110 180v44" strokeWidth="3" />
          {sideWin(204, 112, 22, 30)}{sideWin(204, 160, 22, 30)}
          {lmPlate('카지노', '#B5452F')}
        </g>,
      )
    case '세계일주':
      // 공항: 둥근 지붕 터미널 + 관제탑 + 비행기
      return toy(
        <g>
          {lmShadow(118)}
          {box(160, 70, 26, 80, '#E8EEF4', false, '#C5D0DB')}
          {box(150, 52, 46, 20, '#4E7FA8', true)}
          <rect x="156" y="56" width="34" height="12" fill={GLASS} strokeWidth="3" />
          {box(14, 150, 186, 74, '#DDEBF5', false, '#B9CFE0')}
          <path d="M200 150L244 132Q222 108 178 126Z" fill="#6E9BC2" />
          <path d="M14 150Q107 104 200 150Z" fill="#9CC3E0" />
          {[28, 64, 100, 136].map((x) => <rect key={x} x={x} y="168" width="26" height="30" rx="3" fill={GLASS} strokeWidth="3.5" />)}
          {door(170, 176, 22, 48, '#4E7FA8')}
          <path d="M22 70l60-6 20-22 10 2-10 22h40l10-10h8l-4 14 4 14h-8l-10-10h-40l10 22-10 2-20-22-60-6z" fill="#fff" strokeWidth="3.5" />
          {lmPlate('세계일주 공항', '#2E6FD8')}
        </g>,
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

// 룰렛 (대학 합격·감독 도전). 2026-10-22 다시 만듦 (사용자: 더 크고 세련되게, 직접 돌리기)
// 내 룰렛이면 버튼을 누르거나 룰렛을 누르기·끌어서 돌림. AI·다른 사람 것은 저절로 돎
// 결과(ok)는 게임이 이미 정함 → 얼마나 세게 돌리든 바늘이 성공·실패 칸 안에 멈추도록 마지막 각도를 맞춤
const WHEEL_R = 46
const polar = (deg: number, r = WHEEL_R) => [50 + r * Math.sin((deg * Math.PI) / 180), 50 - r * Math.cos((deg * Math.PI) / 180)]
function arc(from: number, to: number, r = WHEEL_R) {
  const [x1, y1] = polar(from, r), [x2, y2] = polar(to, r)
  return `M50 50 L${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2} Z`
}
export function Roulette({ title, chance, ok, who, manual, onDone }: { title: string; chance: number; ok: boolean; who: string; manual: boolean; onDone: () => void }) {
  const [angle, setAngle] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'drag' | 'spin' | 'stopped'>('ready')
  const [dur, setDur] = useState(3000)
  const drag = useRef<{ start: number; from: number; last: { t: number; a: number }[]; moved: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const span = Math.max(0, Math.min(360, chance * 360))
  // 바늘(위)이 가리킬 룰렛 위의 자리: 성공 칸(0~span) 안쪽 또는 밖
  const spot = useMemo(() => (ok ? span * (0.2 + Math.random() * 0.6) : span + (360 - span) * (0.2 + Math.random() * 0.6)), [ok, span])

  const spin = useCallback((from: number, dir: 1 | -1, power: number) => {
    const turns = Math.max(3, Math.min(8, Math.round(3 + power * 3)))
    const rest = ((360 - spot) % 360 + 360) % 360 // 이 각도(360으로 나눈 나머지)에서 바늘이 spot을 가리킴
    const off = dir > 0 ? (((rest - from) % 360) + 360) % 360 : -((((from - rest) % 360) + 360) % 360)
    const to = from + dir * turns * 360 + off
    const d = Math.round(Math.max(2400, Math.min(4200, 2400 + power * 900)))
    setDur(d)
    setPhase('spin')
    requestAnimationFrame(() => setAngle(to))
    // 똑딱 소리: 처음엔 빠르게, 점점 느리게
    let t = 0, gap = 60
    while (t < d - 250) { timers.current.push(setTimeout(() => sfx('tick'), t)); t += gap; gap *= 1.09 }
    timers.current.push(setTimeout(() => { setPhase('stopped'); sfx(ok ? 'fanfare' : 'lose') }, d + 60))
    timers.current.push(setTimeout(onDone, d + 1900))
  }, [spot, ok, onDone])

  // AI·다른 사람 룰렛은 잠깐 보여 주고 저절로
  useEffect(() => {
    if (manual) return
    const t = setTimeout(() => spin(0, 1, 0.6), 500)
    return () => clearTimeout(t)
  }, [manual, spin])

  const pointerAngle = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect()
    return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI
  }
  const onDown = (e: React.PointerEvent) => {
    if (!manual || phase !== 'ready') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const a = pointerAngle(e)
    drag.current = { start: a, from: angle, last: [{ t: performance.now(), a: angle }], moved: 0 }
    setPhase('drag')
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || phase !== 'drag') return
    let delta = pointerAngle(e) - d.start
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const a = d.last[d.last.length - 1].a + delta
    d.start = pointerAngle(e)
    d.moved += Math.abs(delta)
    d.last = [...d.last.slice(-5), { t: performance.now(), a }]
    setAngle(a)
  }
  const onUp = () => {
    const d = drag.current
    if (!d || phase !== 'drag') return
    drag.current = null
    const now = performance.now()
    const recent = d.last.filter((x) => now - x.t < 120)
    const first = recent[0] ?? d.last[0], last = d.last[d.last.length - 1]
    const v = (last.a - first.a) / Math.max(16, last.t - first.t) // 도/ms
    // 거의 안 움직였으면(누르기) 보통 세기, 끌었으면 끈 방향·속도대로
    const dir: 1 | -1 = d.moved < 8 || v >= 0 ? 1 : -1
    spin(last.a, dir, d.moved < 8 ? 0.6 : Math.min(2, Math.abs(v) * 1.5))
  }

  // 손을 룰렛 밖에서 떼도 돌도록 화면 전체에서도 받음
  const upRef = useRef(onUp)
  upRef.current = onUp
  useEffect(() => {
    if (phase !== 'drag') return
    const up = () => upRef.current()
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up) }
  }, [phase])
  const lights = Array.from({ length: 16 }, (_, i) => polar(i * 22.5, 49.5))
  return (
    <div className="roulette-pop" role="dialog" aria-label={`${title}: ${phase === 'stopped' ? (ok ? '성공' : '실패') : '룰렛'}`}>
      <b className="jua">{title}</b>
      <span className="roulette-sub">{who}</span>
      <span className="roulette-legend"><i className="ok" />성공 <b>{Math.round(chance * 100)}%</b><i className="no" />실패 <b>{100 - Math.round(chance * 100)}%</b></span>
      <div
        className={`wheel-wrap${manual && phase === 'ready' ? ' can-spin' : ''}`} ref={wrap}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      >
        <svg className="wheel" viewBox="0 0 100 100" aria-hidden="true"
          style={{ transform: `rotate(${angle}deg)`, transition: phase === 'spin' ? `transform ${dur}ms cubic-bezier(.12,.75,.18,1)` : 'none' }}>
          <defs>
            <radialGradient id="wheelOk" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#9BE6A5" /><stop offset="100%" stopColor="#3FA45B" /></radialGradient>
            <radialGradient id="wheelNo" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFB4A2" /><stop offset="100%" stopColor="#D9573E" /></radialGradient>
          </defs>
          <circle cx="50" cy="50" r="49.5" fill="#E2B85C" stroke="#2A2118" strokeWidth="1.6" />
          <circle cx="50" cy="50" r={WHEEL_R} fill="url(#wheelNo)" stroke="#2A2118" strokeWidth="1.4" />
          {span >= 359.9 ? <circle cx="50" cy="50" r={WHEEL_R} fill="url(#wheelOk)" /> : span > 0 && <path d={arc(0, span)} fill="url(#wheelOk)" />}
          {Array.from({ length: 24 }, (_, i) => <path key={i} d={`M50 50 L${polar(i * 15).join(' ')}`} stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />)}
          {span > 0 && span < 359.9 && <path d={`M${polar(span).join(' ')} L50 50 L50 4`} stroke="#2A2118" strokeWidth="1.4" fill="none" />}
          {lights.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill={i % 2 ? '#FFF7D6' : '#FF7A59'} stroke="#2A2118" strokeWidth="0.4" />)}
          <circle cx="50" cy="50" r="9" fill="#FBF5E8" stroke="#2A2118" strokeWidth="1.6" />
          <path d="M50 44l1.8 3.7 4 .5-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.5z" fill="#E2B85C" stroke="#2A2118" strokeWidth="0.6" />
        </svg>
        <svg className="needle" viewBox="0 0 30 40" aria-hidden="true">
          <path d="M15 38L4 12a11 11 0 1 1 22 0z" fill="#E2553B" stroke="#2A2118" strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="15" cy="11" r="4" fill="#FBF5E8" stroke="#2A2118" strokeWidth="2" />
        </svg>
      </div>
      {phase === 'stopped'
        ? <button className={`jua roulette-result ${ok ? 'ok' : 'no'}`} onClick={onDone}>{ok ? '성공!' : '아쉬워요…'}</button>
        : manual
          ? <>
              <button className="wide big roulette-btn" disabled={phase !== 'ready'} onClick={() => spin(angle, 1, 0.6)}>{phase === 'ready' ? '🎯 룰렛 돌리기' : '돌아가는 중…'}</button>
              {phase === 'ready' && <span className="roulette-hint">룰렛을 손가락이나 마우스로 끌어서 돌려도 돼요</span>}
            </>
          : <span className="roulette-hint">{who} 차례 · 돌아가는 중…</span>}
    </div>
  )
}

// 칸 사건 팝업: 그림 + 제목 + 이번 칸 기록. 눌러서 닫거나 저절로 꺼짐
export function EventPopup({ art, title, text, tone, who, hint = false, onClose }: { art: string; title: string; text: string; tone: string; who: string; hint?: boolean; onClose: () => void }) {
  const draw = ART[art]
  return (
    <button className={`event-pop t-${tone}`} onClick={onClose} aria-label={`${title}: ${text} (눌러서 닫기)`}>
      {draw && <svg viewBox="0 0 120 100" width="150" height="125" aria-hidden="true">{draw('')}</svg>}
      <b className="jua">{title}</b>
      <span className="muted">{who}</span>
      {text.split('\n').map((l, i) => <span key={i}>{l}</span>)}
      {hint && <small className="pop-hint">눌러서 닫기</small>}
    </button>
  )
}

export function EventArt({ type }: { type: string }) {
  const draw = ART[TYPE_ART[type] ?? '']
  if (!draw) return null
  return <svg className="event-art" viewBox="0 0 120 100" width="96" height="80" aria-hidden="true">{draw('')}</svg>
}
