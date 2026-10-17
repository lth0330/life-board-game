// 기본 그림 모음 (칸 아이콘, 건물, 로고, 주사위 면). 기본 버전 — 아트 단계에서 다시 그린다 (docs/12-art.md)
import type { ReactElement } from 'react'

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
  // 벤치
  rest: <g><rect x="7" y="16" width="34" height="7" rx="2.5" fill="#B47A48" {...L} /><rect x="7" y="26" width="34" height="6" rx="2.5" fill="#C98F5B" {...L} /><path d="M12 32v9M36 32v9" {...L} fill="none" strokeWidth={3.4} /></g>,
  // 골 깃발
  goal: <g><path d="M14 43V7" {...L} strokeWidth={3.6} fill="none" /><path d="M15 8h21l-5 7 5 7H15z" fill="#E2553B" {...L} /><path d="M20 8v14M25 8v14M30 8v14" stroke="#fff" strokeWidth="1.4" opacity="0.6" /></g>,
}

export function TileIcon({ kind, size = 44 }: { kind: string; size?: number }) {
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">{ICONS[kind] ?? ICONS.happy}</svg>
}

// ───── 건물 (viewBox 0 0 220 270) ─────
export type BuildingKind = 'house' | 'school' | 'shop' | 'chapel' | 'office' | 'hospital' | 'cafe' | 'park' | 'apartment' | 'gym' | 'library' | 'flower'

const BUILDING_FOR: Record<string, BuildingKind> = {
  '우리 집': 'house', 유치원: 'school', 놀이터: 'park', 문방구: 'shop',
  학교: 'school', 학원: 'office', 도서관: 'library', 분식집: 'cafe',
  회사: 'office', 카페: 'cafe', 원룸촌: 'apartment', 헬스장: 'gym',
  병원: 'hospital', 공원: 'park', 마트: 'shop', 경로당: 'house', 꽃집: 'flower',
  상점: 'shop', 결혼식장: 'chapel',
}

export function Building({ name, color = '#B5452F' }: { name: string; color?: string }) {
  const kind = BUILDING_FOR[name] ?? 'house'
  const sign = (bg: string) => (
    <g>
      <rect x="40" y="128" width="140" height="40" rx="10" fill={bg} />
      <text x="110" y="157" textAnchor="middle" fontSize="26" fontFamily="Jua, sans-serif" fill="#fff">{name}</text>
    </g>
  )
  const win = (x: number, y: number, w = 30, h = 30) => <rect x={x} y={y} width={w} height={h} rx="3" fill="#CFE7F5" stroke="#fff" strokeWidth="4" />
  switch (kind) {
    case 'chapel':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="40" y="110" width="140" height="160" fill="#FFF5F8" />
          <path d="M30 116L110 40l80 76z" fill="#E9A3BC" />
          <rect x="98" y="0" width="24" height="60" fill="#FFF5F8" /><path d="M92 10l18-10 18 10v10H92z" fill="#E9A3BC" />
          <path d="M110 12v20M102 20h16" stroke="#E2B85C" strokeWidth="4" />
          <path d="M94 270v-50a16 16 0 0 1 32 0v50z" fill="#B0476F" />
          {sign('#B0476F')}
          <path d="M150 196a8 8 0 0 1 16 0c0 8-8 12-8 12s-8-4-8-12z" fill="#F3A3C0" />
        </svg>
      )
    case 'shop':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="20" y="70" width="180" height="200" fill="#fff" />
          <path d="M14 70h192l-10 40H24z" fill="#2C5E8A" />
          <g fill="#fff" opacity="0.9">{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${34 + i * 36} 70l-6 40h18l6-40z`} />)}</g>
          {win(36, 190, 50, 50)}{win(134, 190, 50, 50)}
          {sign('#2C5E8A')}
        </svg>
      )
    case 'school':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="10" y="90" width="200" height="180" fill="#F2E2C4" />
          <path d="M0 96L110 40l110 56z" fill={color} />
          <rect x="92" y="50" width="36" height="36" rx="18" fill="#fff" stroke="#5A3A21" strokeWidth="4" />
          <path d="M110 58v10l7 5" stroke="#5A3A21" strokeWidth="3" fill="none" />
          {win(26, 186)}{win(66, 186)}{win(124, 186)}{win(164, 186)}
          {sign('#5A3A21')}
        </svg>
      )
    case 'hospital':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="30" y="40" width="160" height="230" fill="#fff" />
          <rect x="88" y="54" width="44" height="44" rx="6" fill="#C2452D" />
          <path d="M110 62v28M96 76h28" stroke="#fff" strokeWidth="8" />
          {win(46, 186)}{win(86, 186)}{win(126, 186)}
          {sign('#C2452D')}
        </svg>
      )
    case 'office':
    case 'apartment':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="40" y="10" width="140" height="260" fill={kind === 'office' ? '#8FB3D9' : '#E9DFC8'} />
          {[30, 70, 110, 180, 220].map((y) => [56, 96, 136].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="28" height="24" fill="#CFE7F5" stroke="#fff" strokeWidth="3" />))}
          {sign(kind === 'office' ? '#2C5E8A' : '#7A5232')}
        </svg>
      )
    case 'cafe':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="30" y="90" width="160" height="180" fill="#F4EBD6" />
          <path d="M20 90h180l-8 34H28z" fill={color} />
          <g fill="#fff" opacity="0.85">{[0, 1, 2, 3].map((i) => <path key={i} d={`M${40 + i * 40} 90l-4 34h16l4-34z`} />)}</g>
          {win(46, 190, 50, 50)}{win(124, 190, 50, 50)}
          {sign('#5A3A21')}
        </svg>
      )
    case 'park':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <circle cx="60" cy="150" r="46" fill="#3F8A4F" /><rect x="54" y="180" width="12" height="90" fill="#7A5232" />
          <circle cx="160" cy="140" r="52" fill="#4F9A5E" /><rect x="154" y="176" width="12" height="94" fill="#7A5232" />
          <rect x="70" y="230" width="80" height="10" rx="4" fill="#7A5232" /><rect x="76" y="240" width="6" height="20" fill="#5A3A21" /><rect x="138" y="240" width="6" height="20" fill="#5A3A21" />
          <g transform="translate(0 -60)">{sign('#2F8F5B')}</g>
        </svg>
      )
    case 'gym':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="20" y="90" width="180" height="180" fill="#E5ECF2" />
          <rect x="20" y="80" width="180" height="20" fill="#2E6FD8" />
          <rect x="40" y="186" width="140" height="70" fill="#9CC3E0" stroke="#fff" strokeWidth="4" />
          <g fill="#3a2a1f"><rect x="62" y="52" width="96" height="10" rx="4" /><rect x="50" y="38" width="16" height="38" rx="4" /><rect x="154" y="38" width="16" height="38" rx="4" /></g>
          {sign('#2E6FD8')}
        </svg>
      )
    case 'library':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="24" y="100" width="172" height="170" fill="#F4ECDD" />
          <path d="M14 104L110 50l96 54z" fill="#8A6A4A" />
          {[40, 80, 124, 164].map((x) => <rect key={x} x={x} y="176" width="16" height="94" fill="#fff" />)}
          <g transform="translate(86 62)"><path d="M0 8q12-6 24 2v20q-12-8-24-2z" fill="#6F45BD" /><path d="M48 8q-12-6-24 2v20q12-8 24-2z" fill="#8A6BD0" /></g>
          {sign('#8A6A4A')}
        </svg>
      )
    case 'flower':
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="30" y="100" width="160" height="170" fill="#FFF5F8" />
          <path d="M22 100h176l-12 34H34z" fill="#F3A3C0" />
          <rect x="44" y="186" width="132" height="70" fill="#CFE7F5" stroke="#fff" strokeWidth="4" />
          {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={56 + i * 27} cy="240" r="11" fill={['#E34B4B', '#F2C230', '#F3A3C0', '#6F45BD', '#E34B4B'][i]} />)}
          <g transform="translate(0 -40)">{sign('#B0476F')}</g>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 220 270" width="100%" height="100%" aria-hidden="true">
          <rect x="30" y="110" width="160" height="160" fill="#F2E2C4" />
          <path d="M14 116L110 40l96 76z" fill={color} />
          <rect x="146" y="50" width="22" height="44" fill="#7A5232" />
          <path d="M92 270v-56h36v56z" fill="#7A5232" />
          {win(46, 196)}{win(146, 196)}
          {sign('#5A3A21')}
        </svg>
      )
  }
}

export function Tree({ variant = 0 }: { variant?: number }) {
  return (
    <svg viewBox="0 0 90 150" width="100%" height="100%" aria-hidden="true">
      <rect x="38" y="80" width="14" height="70" rx="4" fill="#7A5232" />
      {variant % 2 ? (
        <path d="M45 6L84 96H6z" fill="#2F7A44" />
      ) : (
        <><circle cx="45" cy="52" r="40" fill="#3F8A4F" /><circle cx="30" cy="40" r="14" fill="#4F9A5E" /></>
      )}
    </svg>
  )
}

// ───── 로고 ─────
export function Logo({ size = 280 }: { size?: number }) {
  return (
    <svg viewBox="0 0 320 120" width={size} height={size * 0.375} role="img" aria-label="데굴데굴 라이프">
      <g transform="rotate(-12 50 60)">
        <rect x="18" y="26" width="64" height="64" rx="14" fill="#fff" stroke="#2A2118" strokeWidth="5" />
        <circle cx="36" cy="44" r="6" fill="#2A2118" /><circle cx="50" cy="58" r="6" fill="#C2452D" /><circle cx="64" cy="72" r="6" fill="#2A2118" />
      </g>
      <text x="100" y="58" fontFamily="Jua, sans-serif" fontSize="40" fill="#C2452D">데굴데굴</text>
      <text x="102" y="102" fontFamily="Jua, sans-serif" fontSize="40" fill="#2A2118">라이프</text>
    </svg>
  )
}

// ───── 주사위 면 점 위치 ─────
export const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }
