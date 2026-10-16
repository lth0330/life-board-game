// 기본 그림 모음 (칸 아이콘, 건물, 로고, 주사위 면). 기본 버전 — 아트 단계에서 다시 그린다 (docs/12-art.md)
import type { ReactElement } from 'react'

// ───── 칸 아이콘 (viewBox 0 0 48 48, 흰색 위주) ─────
const ICONS: Record<string, ReactElement> = {
  good: <g><rect x="11" y="21" width="26" height="18" rx="2" fill="#FFD45C" stroke="#fff" strokeWidth="2.5" /><rect x="9" y="15" width="30" height="8" rx="2" fill="#FFE58A" stroke="#fff" strokeWidth="2.5" /><path d="M24 15v24" stroke="#E2553B" strokeWidth="4" /><path d="M24 15c-3-6-10-6-9-1 1 3 6 2 9 1zM24 15c3-6 10-6 9-1-1 3-6 2-9 1z" fill="#E2553B" /></g>,
  money: <g><circle cx="24" cy="24" r="15" fill="#F2C230" stroke="#fff" strokeWidth="3" /><text x="24" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill="#7A5232">₩</text></g>,
  grow: <g fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M24 40V22" /><path d="M24 26c-10 0-13-8-13-12 8 0 13 4 13 12zM24 22c0-9 5-13 14-13 0 6-4 13-14 13z" fill="#7FE0A8" /></g>,
  happy: <g><circle cx="24" cy="24" r="15" fill="#fff" /><circle cx="19" cy="21" r="2.4" fill="#2A2118" /><circle cx="29" cy="21" r="2.4" fill="#2A2118" /><path d="M17 28q7 7 14 0" stroke="#2A2118" strokeWidth="2.6" fill="none" strokeLinecap="round" /></g>,
  risk: <g><path d="M24 8l18 32H6z" fill="#fff" /><path d="M24 20v10" stroke="#C2452D" strokeWidth="4" strokeLinecap="round" /><circle cx="24" cy="35" r="2.4" fill="#C2452D" /></g>,
  card: <g><rect x="12" y="8" width="24" height="32" rx="4" fill="#fff" /><path d="M24 16l2.6 5.4 5.8.8-4.2 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4 5.8-.8z" fill="#6F45BD" /></g>,
  stop: <g><path d="M17 6h14l10 10v14L31 40H17L7 30V16z" fill="#fff" /><text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2A2118">STOP</text></g>,
  date: <path d="M24 40S8 30 8 18a8 8 0 0 1 16-2 8 8 0 0 1 16 2c0 12-16 22-16 22z" fill="#fff" />,
  mini: <g><rect x="6" y="15" width="36" height="20" rx="10" fill="#fff" /><path d="M15 21v8M11 25h8" stroke="#E8742C" strokeWidth="3" strokeLinecap="round" /><circle cx="31" cy="23" r="2.4" fill="#E8742C" /><circle cx="35" cy="28" r="2.4" fill="#E8742C" /></g>,
  rest: <g fill="#7A5232"><rect x="8" y="20" width="32" height="6" rx="2" /><rect x="8" y="29" width="32" height="5" rx="2" /><rect x="11" y="34" width="4" height="8" /><rect x="33" y="34" width="4" height="8" /></g>,
  goal: <g><path d="M14 42V8" stroke="#2A2118" strokeWidth="3.5" strokeLinecap="round" /><path d="M14 9h22l-5 7 5 7H14z" fill="#C2452D" /></g>,
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
