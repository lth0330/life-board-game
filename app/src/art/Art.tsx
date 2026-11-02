// 기본 그림 모음 (칸 아이콘, 건물, 로고, 주사위 면). 기본 버전 — 아트 단계에서 다시 그린다 (docs/12-art.md)
import type { ReactElement } from 'react'
import titleArt from '../assets/title-art.webp'
import { artFile } from './slots'
import { awning, box, door, gable, GLASS, GLASS_SIDE, INK, shade, shadow, sideWin, win, WOOD } from './toyParts'

// ───── 칸 아이콘 (viewBox 0 0 48 48). 2026-10-17 다시 그림: 잉크 테두리 + 밝은 색, 캐릭터·종이 보드게임 UI와 같은 느낌 ─────
const K = '#2A2118'
const L = { stroke: K, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const hi = (d: string) => <path d={d} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.7" />
const ICONS: Record<string, ReactElement> = {
  // 선물 상자
  good: <g><rect x="10" y="21" width="28" height="19" rx="3" fill="#FFD45C" {...L} /><rect x="8" y="14" width="32" height="9" rx="3" fill="#FFE58A" {...L} /><path d="M24 14v26" stroke="#E2553B" strokeWidth="5" /><path d="M24 14v26" {...L} fill="none" strokeWidth="1.2" /><path d="M24 14c-3-7-11-7-10-2 1 3 7 3 10 2zM24 14c3-7 11-7 10-2-1 3-7 3-10 2z" fill="#E2553B" {...L} />{hi('M13 26v8')}</g>,
  // 동전
  money: <g><circle cx="24" cy="25" r="15" fill="#E2A92C" {...L} /><circle cx="24" cy="23" r="15" fill="#F7CD45" {...L} /><circle cx="24" cy="23" r="10.5" fill="none" stroke="#C99418" strokeWidth="1.6" /><text x="24" y="28.5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A5232" fontFamily="sans-serif">₩</text>{hi('M14 17q3-5 8-6')}</g>,
  // 새싹
  grow: <g><path d="M24 41V23" stroke={K} strokeWidth="5" strokeLinecap="round" /><path d="M24 41V23" stroke="#5DBB72" strokeWidth="2.4" strokeLinecap="round" /><path d="M24 27c-11 0-14-9-14-13 9 0 14 4 14 13z" fill="#7FE0A8" {...L} /><path d="M24 23c0-10 6-14 15-14 0 7-5 14-15 14z" fill="#9BEBB9" {...L} /><ellipse cx="24" cy="41" rx="9" ry="2.6" fill="#8A6A55" {...L} /></g>,
  // 웃는 얼굴
  happy: <g><circle cx="24" cy="24" r="15" fill="#FFE07A" {...L} /><ellipse cx="18.5" cy="21" rx="2" ry="2.6" fill={K} /><ellipse cx="29.5" cy="21" rx="2" ry="2.6" fill={K} /><path d="M16.5 27q7.5 8 15 0z" fill="#D9604B" {...L} strokeWidth={2} /><circle cx="14.5" cy="27" r="2.6" fill="#F09A8A" opacity="0.8" /><circle cx="33.5" cy="27" r="2.6" fill="#F09A8A" opacity="0.8" /></g>,
  // 경고 삼각형
  risk: <g><path d="M24 7l18 32H6z" fill="#FFD45C" {...L} strokeWidth={2.8} /><path d="M24 18v11" stroke={K} strokeWidth="4.2" strokeLinecap="round" /><circle cx="24" cy="34" r="2.6" fill={K} /></g>,
  // 별 카드 (뒤에 한 장 더)
  card: <g><rect x="15" y="9" width="22" height="30" rx="4" fill="#C9B6F0" {...L} transform="rotate(10 26 24)" /><rect x="11" y="9" width="22" height="30" rx="4" fill="#fff" {...L} /><path d="M22 15l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.7 5.4-.7z" fill="#8B5CF6" {...L} strokeWidth={1.6} /></g>,
  // 멈춤 표지판
  stop: <g><path d="M17 5h14l10 10v14L31 39H17L7 29V15z" fill="#E2553B" {...L} /><path d="M18 8h12l8 8v12l-8 8H18l-8-8V16z" fill="none" stroke="#fff" strokeWidth="1.6" /><text x="24" y="26.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="sans-serif">STOP</text><path d="M24 39v6" {...L} fill="none" /></g>,
  // 하트
  date: <g><path d="M24 40S7 30 7 18a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 12-17 22-17 22z" fill="#FF7AA2" {...L} strokeWidth={2.6} />{hi('M13 15q2-3 6-3')}</g>,
  // 게임기
  mini: <g><rect x="5" y="14" width="38" height="22" rx="11" fill="#fff" {...L} /><path d="M15 20v10M10 25h10" stroke="#E8742C" strokeWidth="3.4" strokeLinecap="round" /><circle cx="31" cy="22.5" r="2.8" fill="#E8742C" {...L} strokeWidth={1.4} /><circle cx="36" cy="27.5" r="2.8" fill="#4CB0E0" {...L} strokeWidth={1.4} /></g>,
  // 서류 가방 (업무 칸)
  work: <g><rect x="7" y="16" width="34" height="23" rx="4" fill="#7A5232" {...L} /><path d="M18 16v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" {...L} fill="none" strokeWidth={2.6} /><path d="M7 26h34" {...L} fill="none" /><rect x="20" y="23" width="8" height="6" rx="1.5" fill="#F7CD45" {...L} strokeWidth={1.8} />{hi('M11 20v4')}</g>,
  // 벤치
  rest: <g><rect x="7" y="16" width="34" height="7" rx="2.5" fill="#B47A48" {...L} /><rect x="7" y="26" width="34" height="6" rx="2.5" fill="#C98F5B" {...L} /><path d="M12 32v9M36 32v9" {...L} fill="none" strokeWidth={3.4} /></g>,
  // 쇼핑백 (상점 칸)
  shop: <g><path d="M10 17h28l-2 24H12z" fill="#5AA9E6" {...L} /><path d="M18 20v-5a6 6 0 0 1 12 0v5" {...L} fill="none" strokeWidth={2.6} />{hi('M15 24v10')}</g>,
  // 골 깃발
  goal: <g><path d="M14 43V7" {...L} strokeWidth={3.6} fill="none" /><path d="M15 8h21l-5 7 5 7H15z" fill="#E2553B" {...L} /><path d="M20 8v14M25 8v14M30 8v14" stroke="#fff" strokeWidth="1.4" opacity="0.6" /></g>,
}

export function TileIcon({ kind, size = 44 }: { kind: string; size?: number }) {
  const file = artFile(`tile-${kind}`)
  if (file) return <img src={file} width={size} height={size} alt="" draggable={false} style={{ objectFit: 'contain' }} />
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">{ICONS[kind] ?? ICONS.happy}</svg>
}

// ───── 건물 (viewBox 0 0 220 270) ─────
// 2026-10-22 다시 그림 (사용자가 견본 3가지 중 '장난감 입체' 선택): 잉크 테두리 + 앞면·옆면·지붕 윗면이 보이는 장난감 집.
// 평평한 지붕은 윗면을 꼭 그림 (안 그리면 하늘이 비쳐 구멍처럼 보임). 이름판은 평평하게
export type BuildingKind = 'house' | 'school' | 'shop' | 'chapel' | 'office' | 'hospital' | 'cafe' | 'park' | 'apartment' | 'gym' | 'library' | 'flower'

const BUILDING_FOR: Record<string, BuildingKind> = {
  '우리 집': 'house', 유치원: 'school', 놀이터: 'park', 문방구: 'shop',
  학교: 'school', 학원: 'office', 도서관: 'library', 분식집: 'cafe',
  회사: 'office', 카페: 'cafe', 원룸촌: 'apartment', 헬스장: 'gym',
  병원: 'hospital', 공원: 'park', 마트: 'shop', 경로당: 'house', 꽃집: 'flower',
  상점: 'shop', 결혼식장: 'chapel',
}

export function Building({ name, color = '#B5452F', theme }: { name: string; color?: string; theme?: string | null }) {
  const kind = BUILDING_FOR[name] ?? 'house'
  const file = artFile(`building-${kind}`, theme) // 그림 파일이 있으면 그 그림 + 이름판
  // 이름판: 평평하게, 글자 수에 맞춰 너비
  const pw = Math.min(200, Math.max(110, name.length * 24 + 44))
  const plate = (bg: string) => (
    <g>
      <rect x={110 - pw / 2} y="230" width={pw} height="34" rx="9" fill={bg} strokeWidth="4" />
      <text x="110" y="254" textAnchor="middle" fontSize="22" fontFamily="Jua, sans-serif" fill="#fff" stroke="none">{name}</text>
    </g>
  )
  let body: ReactElement
  switch (kind) {
    case 'chapel':
      body = (
        <g>
          {shadow(114, 104)}
          <path d="M128 40L144 34V96L128 102Z" fill="#F3D7E2" />
          <rect x="92" y="40" width="36" height="62" fill="#FFF5F8" />
          <path d="M134 42L110 8L150 36Z" fill="#D96A93" />
          <path d="M86 42L110 8L134 42Z" fill="#F28CB1" />
          <path d="M101 80q0-18 9-18q9 0 9 18z" fill="#FFD45C" strokeWidth="3" />
          {box(40, 110, 128, 114, '#FFF5F8', false, '#F3D7E2')}
          <path d="M104 68L134 56L210 106L180 118Z" fill="#D96A93" />
          <path d="M28 118L104 68L180 118Z" fill="#F28CB1" />
          <path d="M40 118q32 20 64 0q32 20 64 0" fill="none" stroke="#FF7AA2" strokeWidth="4" />
          <path d="M104 160c-13-8-17-15-17-21a8 8 0 0 1 17-4a8 8 0 0 1 17 4c0 6-4 13-17 21z" fill="#FF7AA2" strokeWidth="3" />
          <path d="M54 206v-22a10 10 0 0 1 20 0v22z" fill={GLASS} strokeWidth="3" />
          <path d="M134 206v-22a10 10 0 0 1 20 0v22z" fill={GLASS} strokeWidth="3" />
          <path d="M84 224V190a20 20 0 0 1 40 0V224Z" fill="#C2457A" />
          <path d="M104 172V224" strokeWidth="3" />
          {sideWin(178, 152, 12, 24)}
          <circle cx="26" cy="208" r="17" fill="#7FCB8A" />
          <circle cx="20" cy="202" r="4" fill="#FF7AA2" strokeWidth="2" /><circle cx="32" cy="212" r="4" fill="#fff" strokeWidth="2" />
          {plate('#C2457A')}
        </g>
      )
      break
    case 'shop':
      body = (
        <g>
          {shadow(114, 98)}
          {box(22, 100, 128, 124, '#FFFDF6', false, '#E3DDD0')}
          {box(22, 86, 128, 14, '#2C5E8A', true)}
          <rect x="52" y="40" width="68" height="40" rx="7" fill="#FFD45C" />
          <rect x="74" y="52" width="24" height="22" rx="3" fill="#E2553B" strokeWidth="3" />
          <path d="M79 52q7-11 14 0" fill="none" strokeWidth="3" />
          {awning(22, 128, 100, '#4C8FD6')}
          <rect x="34" y="150" width="62" height="52" rx="5" fill={GLASS} />
          <circle cx="50" cy="190" r="8" fill="#E2553B" strokeWidth="3" /><circle cx="70" cy="190" r="8" fill="#FFD45C" strokeWidth="3" />
          {door(106, 150, 36, 74, '#4C8FD6')}
          {sideWin(162, 152, 22, 40)}
          {plate('#2C5E8A')}
        </g>
      )
      break
    case 'school':
      body = (
        <g>
          {shadow(110, 106)}
          {box(8, 104, 150, 120, '#F2E2C4')}
          {box(2, 90, 162, 16, color, true)}
          <path d="M150 74V20" strokeWidth="4" /><path d="M150 22L176 31L150 40Z" fill="#E2553B" strokeWidth="3" />
          <path d="M45 94L83 56L121 94Z" fill={shade(color, 1.25)} />
          <circle cx="83" cy="80" r="12" fill="#fff" strokeWidth="3.5" />
          <path d="M83 73v7l5 4" fill="none" strokeWidth="3" />
          {win(18, 124, 24, 26)}{win(46, 124, 24, 26)}{win(100, 124, 24, 26)}{win(128, 124, 24, 26)}
          {win(18, 172, 24, 26)}{win(128, 172, 24, 26)}
          <rect x="66" y="162" width="34" height="62" rx="5" fill={WOOD} /><path d="M83 162v62" strokeWidth="3" />
          {sideWin(168, 132, 18, 26)}{sideWin(168, 176, 18, 26)}
          {plate(shade(color, 0.75))}
        </g>
      )
      break
    case 'office':
    case 'apartment': {
      const off = kind === 'office'
      const wall = off ? '#8FB3D9' : '#E9DFC8'
      body = (
        <g>
          {shadow(118, 90)}
          {box(46, 46, 110, 178, wall, true)}
          {off ? <path d="M120 28V8M114 10h12" strokeWidth="4" fill="none" /> : <rect x="112" y="18" width="22" height="16" fill="#C98F5B" />}
          {[64, 100, 136].map((y) => [56, 88, 120].map((x) => <g key={`${x}-${y}`}>{win(x, y, 24, 22)}{!off && <path d={`M${x - 3} ${y + 26}h30`} strokeWidth="3" />}</g>))}
          {[56, 120].map((x) => <g key={x}>{win(x, 172, 24, 22)}</g>)}
          {door(86, 176, 30, 48, off ? '#2C5E8A' : WOOD)}
          {[60, 100, 140, 180].map((y) => <g key={y}>{sideWin(166, y, 22, 20)}</g>)}
          {plate(off ? '#2C5E8A' : '#7A5232')}
        </g>
      )
      break
    }
    case 'hospital':
      body = (
        <g>
          {shadow(116, 96)}
          {box(30, 64, 130, 160, '#FFFFFF', true, '#DCE3EA')}
          <rect x="75" y="76" width="40" height="40" rx="7" fill="#C2452D" />
          <path d="M95 84v24M83 96h24" stroke="#fff" strokeWidth="7" />
          {win(42, 130, 26, 24)}{win(82, 130, 26, 24)}{win(122, 130, 26, 24)}
          {win(42, 172, 26, 24)}{win(122, 172, 26, 24)}
          <rect x="80" y="170" width="30" height="54" rx="4" fill={GLASS_SIDE} /><path d="M95 170v54" strokeWidth="3" />
          {sideWin(170, 92, 22, 22)}{sideWin(170, 136, 22, 22)}{sideWin(170, 180, 22, 22)}
          {plate('#C2452D')}
        </g>
      )
      break
    case 'cafe':
      body = (
        <g>
          {shadow(114, 96)}
          {box(30, 110, 124, 114, '#F4EBD6', false, '#D9CBAE')}
          {box(30, 98, 124, 12, shade(color, 0.85), true)}
          <circle cx="92" cy="62" r="24" fill="#fff" />
          <path d="M80 56h20v12a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#8A5A3B" strokeWidth="3" />
          <path d="M100 60h3a5 5 0 0 1 0 10h-3" fill="none" strokeWidth="3" />
          <path d="M86 50q-3-5 0-8M94 50q-3-5 0-8" fill="none" strokeWidth="2.5" />
          {awning(30, 124, 110, color)}
          {win(42, 156, 46, 46, true)}
          {door(104, 156, 34, 68)}
          {sideWin(166, 156, 20, 36)}
          {plate('#5A3A21')}
        </g>
      )
      break
    case 'park':
      body = (
        <g>
          <ellipse cx="110" cy="206" rx="104" ry="26" style={{ fill: 'var(--lawn, #7FCB8A)' }} />
          <path d="M18 206q20 12 50 16" stroke="#5DAA6C" strokeWidth="3" fill="none" />
          <rect x="52" y="128" width="12" height="80" rx="3" fill="#7A5232" />
          <circle cx="58" cy="112" r="40" style={{ fill: 'var(--tree-b, #4F9A5E)' }} /><path d="M36 100q6-16 22-20" stroke="#fff" strokeWidth="5" opacity="0.45" fill="none" />
          <rect x="156" y="118" width="12" height="84" rx="3" fill="#7A5232" />
          <circle cx="162" cy="100" r="44" style={{ fill: 'var(--tree-a, #3F8A4F)' }} /><path d="M138 88q6-18 24-22" stroke="#fff" strokeWidth="5" opacity="0.45" fill="none" />
          <path d="M80 196l12-8h46l-12 8z" fill="#C98F5B" strokeWidth="4" />
          <path d="M80 196h46v8H80z" fill="#B47A48" strokeWidth="4" />
          <path d="M86 204v14M120 204v14M132 194v14" strokeWidth="4" />
          <path d="M80 182l12-8h46l-12 8z" fill="#C98F5B" strokeWidth="4" />
          <path d="M196 214V150" strokeWidth="4" /><circle cx="196" cy="146" r="8" fill="#FFE07A" strokeWidth="3" />
          {plate('#2F8F5B')}
        </g>
      )
      break
    case 'gym':
      body = (
        <g>
          {shadow(112, 100)}
          {box(20, 100, 140, 124, '#E5ECF2', false, '#C2CEDA')}
          {box(20, 86, 140, 16, '#2E6FD8', true)}
          <g fill={INK}><rect x="54" y="46" width="72" height="10" rx="4" /><rect x="42" y="32" width="16" height="38" rx="4" /><rect x="122" y="32" width="16" height="38" rx="4" /></g>
          <rect x="34" y="122" width="112" height="64" rx="5" fill="#9CC3E0" /><path d="M71 122v64M108 122v64" strokeWidth="3" />
          {door(74, 190, 32, 34, '#2E6FD8')}
          {sideWin(170, 120, 22, 50)}
          {plate('#2E6FD8')}
        </g>
      )
      break
    case 'library':
      body = (
        <g>
          {shadow(114, 98)}
          {box(26, 112, 128, 112, '#F4ECDD', false, '#D8CBB3')}
          {gable(26, 128, 112, 64, '#8A6A4A')}
          <g transform="translate(72 64)"><path d="M0 8q9-5 18 2v18q-9-7-18-2z" fill="#6F45BD" strokeWidth="2.5" /><path d="M36 8q-9-5-18 2v18q9-7 18-2z" fill="#8A6BD0" strokeWidth="2.5" /></g>
          {[38, 66, 106, 134].map((x) => <rect key={x} x={x} y="128" width="12" height="96" fill="#fff" />)}
          {door(76, 160, 28, 64)}
          {sideWin(164, 140, 22, 30)}
          {plate('#8A6A4A')}
        </g>
      )
      break
    case 'flower':
      body = (
        <g>
          {shadow(114, 96)}
          {box(30, 110, 124, 114, '#FFF5F8', false, '#EED5DF')}
          {box(30, 98, 124, 12, '#E9A3BC', true)}
          <g transform="translate(80 52)"><circle cx="12" cy="12" r="9" fill="#FF7AA2" strokeWidth="3" /><circle cx="24" cy="12" r="9" fill="#FFD45C" strokeWidth="3" /><circle cx="18" cy="3" r="9" fill="#F3A3C0" strokeWidth="3" /><path d="M18 20v18" strokeWidth="3" /></g>
          {awning(30, 124, 110, '#F3A3C0')}
          {win(42, 156, 56, 40)}
          {door(110, 156, 30, 68, '#B0476F')}
          {[0, 1, 2, 3].map((i) => <g key={i}><rect x={40 + i * 16} y="204" width="12" height="16" rx="2" fill="#C98F5B" strokeWidth="2.5" /><circle cx={46 + i * 16} cy="200" r="6" fill={['#E34B4B', '#F2C230', '#FF7AA2', '#8A6BD0'][i]} strokeWidth="2.5" /></g>)}
          {sideWin(166, 156, 20, 36)}
          {plate('#B0476F')}
        </g>
      )
      break
    default:
      body = (
        <g>
          {shadow(116, 98)}
          {box(26, 112, 124, 112, '#F6E3BE', false, '#DDBF8E')}
          {gable(26, 124, 112, 68, color)}
          <path d="M120 58l14-6v24l-14 6z" fill={shade(color, 0.65)} strokeWidth="4" />
          {win(36, 140, 28, 28, true)}{win(112, 140, 28, 28, true)}
          {door(74, 160, 28, 64)}
          {sideWin(162, 144, 22, 24)}
          {plate(shade(color, 0.85))}
        </g>
      )
  }
  if (file) body = <g><image href={file} x="0" y="0" width="220" height="228" preserveAspectRatio="xMidYMax meet" />{plate(kind === 'house' ? shade(color, 0.85) : '#5A3A21')}</g>
  return (
    <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">{body}</g>
    </svg>
  )
}

export function Tree({ variant = 0, theme }: { variant?: number; theme?: string | null }) {
  const file = artFile(variant % 2 ? 'tree-pine' : 'tree-round', theme)
  if (file) return <img src={file} width="100%" height="100%" alt="" draggable={false} style={{ objectFit: 'contain', objectPosition: 'bottom' }} />
  return (
    <svg viewBox="0 0 90 150" width="100%" height="100%" aria-hidden="true">
      <rect x="38" y="80" width="14" height="70" rx="4" fill="#7A5232" />
      {variant % 2 ? (
        <><path d="M45 6L84 96H6z" style={{ fill: 'var(--pine, #2F7A44)' }} /><path className="snow-cap" d="M45 6L63 48q-6 6-12 0-6 6-12 0-6 6-12 0z" /></>
      ) : (
        <><circle cx="45" cy="52" r="40" style={{ fill: `var(--tree-${variant % 4 ? 'a' : 'c'}, #3F8A4F)` }} /><circle cx="30" cy="40" r="14" style={{ fill: 'var(--tree-b, #4F9A5E)' }} /><path className="snow-cap" d="M9 44a36 36 0 0 1 72 0q-8 6-18 0-9 7-18 0-9 7-18 0-9 6-18 0z" /></>
      )}
    </svg>
  )
}

// ───── 로고 ─────
// 2026-10-21 사용자가 고른 그림(AI 그림 도구 시안 ②보드게임 길)에 제목 글자를 얹음. 그림은 위 하늘이 제목 자리
export function Logo({ size = 280 }: { size?: number }) {
  return (
    <div className="logo-art" style={{ width: size }} role="img" aria-label="데굴데굴 라이프">
      <img src={titleArt} alt="" width={960} height={575} />
      <svg viewBox="0 0 320 70" aria-hidden="true">
        <text x="160" y="40" textAnchor="middle" fontFamily="Jua, sans-serif" fontSize="40" fill="#C2452D" stroke="#fbf5e8" strokeWidth="8" paintOrder="stroke" strokeLinejoin="round">데굴데굴 <tspan fill="#2A2118">라이프</tspan></text>
      </svg>
    </div>
  )
}

// ───── 주사위 면 점 위치 ─────
