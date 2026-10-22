// 미니게임 안 그림 (2026-10-22): 이모지·기호 대신 잉크 테두리 + 밝은 색 그림 (칸 아이콘·건물과 같은 그림체)
// 이모지는 기기마다 모양이 달라서 직접 그림. viewBox 0 0 48 48
import type { ReactElement } from 'react'

const K = '#2A2118'
const L = { stroke: K, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const hi = (d: string) => <path d={d} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.65" />

const ICONS: Record<string, ReactElement> = {
  // ── 세계일주 랜드마크 ──
  eiffel: <g><path d="M24 4l3 12 3 12 6 16h-7q-5-9-10 0h-7l6-16 3-12z" fill="#C98F5B" {...L} /><path d="M19 16h10M16 28h16" {...L} fill="none" /><path d="M24 4V1" {...L} /></g>,
  liberty: <g><rect x="15" y="38" width="18" height="7" rx="1.5" fill="#C9B48A" {...L} /><path d="M18 38l2-17q4-4 8 0l2 17z" fill="#7DC4A8" {...L} /><circle cx="24" cy="15" r="5" fill="#7DC4A8" {...L} /><path d="M19 11l-2-3M22 10l-1-4M26 10l1-4M29 11l2-3" {...L} fill="none" /><path d="M28 22l5-13" {...L} strokeWidth={3.4} fill="none" /><circle cx="33.5" cy="7" r="3.2" fill="#FFD45C" {...L} /></g>,
  castle: <g><rect x="11" y="22" width="26" height="22" fill="#E8E1F2" {...L} /><rect x="5" y="16" width="10" height="28" fill="#F4EFFA" {...L} /><rect x="33" y="16" width="10" height="28" fill="#F4EFFA" {...L} /><path d="M4 17l6-11 6 11zM32 17l6-11 6 11z" fill="#E2553B" {...L} /><path d="M11 22v-4h5v4M21 22v-4h6v4M32 22v-4" {...L} fill="none" /><path d="M20 44v-8a4 4 0 0 1 8 0v8z" fill="#8A5A3B" {...L} /></g>,
  moai: <g><path d="M15 44V18q0-13 11-13 8 0 8 11v28z" fill="#A5A294" {...L} /><path d="M18 18h13" {...L} strokeWidth={3} /><path d="M27 19l-2 10h4" fill="none" {...L} /><path d="M21 35h8" {...L} fill="none" />{hi('M19 10q2-3 5-3')}</g>,
  pyramid: <g><path d="M4 42L24 8l20 34z" fill="#F2C46D" {...L} /><path d="M24 8l20 34H30z" fill="#D9A447" {...L} /><path d="M12 30h16M16 22h10" stroke="#B9863A" strokeWidth="2" /></g>,
  ferris: <g><path d="M24 24l-9 20M24 24l9 20" {...L} strokeWidth={3} fill="none" /><circle cx="24" cy="22" r="16" fill="none" {...L} /><path d="M24 6v32M8 22h32M13 11l22 22M35 11L13 33" stroke={K} strokeWidth="1.4" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={24 + Math.cos(i * 0.785) * 16 - 3} y={22 + Math.sin(i * 0.785) * 16 - 3} width="6" height="6" rx="1.5" fill={['#E2553B', '#FFD45C', '#4CB0E0', '#7FE0A8'][i % 4]} {...L} strokeWidth={1.6} />)}<circle cx="24" cy="22" r="2.5" fill={K} /></g>,
  // ── 짐 싸기: 챙길 것 ──
  passport: <g><rect x="12" y="6" width="24" height="36" rx="3" fill="#2C5E8A" {...L} /><circle cx="24" cy="20" r="7" fill="none" stroke="#FFD45C" strokeWidth="2" /><path d="M17 20h14M24 13q-4 7 0 14M24 13q4 7 0 14" stroke="#FFD45C" strokeWidth="1.5" fill="none" /><path d="M17 33h14" stroke="#FFD45C" strokeWidth="2" /></g>,
  toothbrush: <g><path d="M10 40L32 14" stroke={K} strokeWidth="7" strokeLinecap="round" /><path d="M10 40L32 14" stroke="#4CB0E0" strokeWidth="3.6" strokeLinecap="round" /><rect x="30" y="5" width="9" height="14" rx="2" fill="#fff" transform="rotate(40 34 12)" {...L} /><path d="M33 7l3 3M31 10l3 3" stroke="#9CC3E0" strokeWidth="1.6" /></g>,
  charger: <g><path d="M24 30q0 12-12 12" {...L} fill="none" /><rect x="14" y="12" width="20" height="18" rx="4" fill="#fff" {...L} /><path d="M19 12V5M29 12V5" {...L} strokeWidth={3.2} /><path d="M25 16l-4 6h5l-3 5" stroke="#FFB020" strokeWidth="2" fill="none" strokeLinejoin="round" /></g>,
  shirt: <g><path d="M16 8l-10 6 4 8 5-2v22h18V20l5 2 4-8-10-6q-4 5-8 0z" fill="#FF7AA2" {...L} />{hi('M19 24v12')}</g>,
  sunscreen: <g><path d="M14 16h20l-2 26H16z" fill="#FFD45C" {...L} /><rect x="18" y="6" width="12" height="10" rx="2" fill="#E8742C" {...L} /><circle cx="24" cy="29" r="5" fill="#fff" stroke="#E8742C" strokeWidth="2" /><path d="M24 20v2M24 36v2M16 29h2M30 29h2" stroke="#E8742C" strokeWidth="2" /></g>,
  camera: <g><rect x="5" y="14" width="38" height="26" rx="5" fill="#5B5F6B" {...L} /><rect x="15" y="8" width="12" height="7" rx="2" fill="#5B5F6B" {...L} /><circle cx="24" cy="27" r="9" fill="#9CC3E0" {...L} /><circle cx="24" cy="27" r="4" fill={K} /><circle cx="36" cy="20" r="2" fill="#FFD45C" /></g>,
  wallet: <g><rect x="6" y="14" width="36" height="24" rx="5" fill="#8A5A3B" {...L} /><path d="M30 22h12v10H30a5 5 0 0 1 0-10z" fill="#B47A48" {...L} /><circle cx="32" cy="27" r="2" fill="#FFD45C" /><path d="M10 14l20-6 4 6" fill="#B47A48" {...L} /></g>,
  sunglasses: <g><path d="M4 18h40" {...L} fill="none" /><path d="M6 18h15v6a7 7 0 0 1-14 0z" fill="#2B3A5E" {...L} /><path d="M27 18h15v6a7 7 0 0 1-14 0z" fill="#2B3A5E" {...L} />{hi('M10 22l3-2')}{hi('M31 22l3-2')}</g>,
  // ── 짐 싸기: 두고 갈 것 ──
  piano: <g><path d="M6 14h36v14H6z" fill="#2A2118" {...L} /><path d="M6 28h36v6H6z" fill="#fff" {...L} /><path d="M12 28v6M18 28v6M24 28v6M30 28v6M36 28v6" stroke={K} strokeWidth="1.6" /><path d="M10 34v8M38 34v8" {...L} strokeWidth={3.4} /><path d="M9 28v-3h3M17 28v-3h2M27 28v-3h2" stroke="#2A2118" strokeWidth="1" /></g>,
  plant: <g><path d="M14 30h20l-3 14H17z" fill="#C98F5B" {...L} /><path d="M24 30V14" {...L} fill="none" /><path d="M24 22c-8 0-11-6-11-10 7 0 11 3 11 10zM24 18c0-8 5-11 12-11 0 6-4 11-12 11z" fill="#5DBB72" {...L} /></g>,
  sofa: <g><rect x="10" y="12" width="28" height="16" rx="5" fill="#E2553B" {...L} /><rect x="4" y="20" width="9" height="16" rx="4" fill="#C9432C" {...L} /><rect x="35" y="20" width="9" height="16" rx="4" fill="#C9432C" {...L} /><rect x="11" y="26" width="26" height="10" rx="3" fill="#F06A50" {...L} /><path d="M9 36v5M39 36v5" {...L} /></g>,
  bowling: <g><circle cx="24" cy="25" r="17" fill="#6F45BD" {...L} /><circle cx="19" cy="18" r="2.4" fill={K} /><circle cx="26" cy="16" r="2.4" fill={K} /><circle cx="23" cy="23" r="2.4" fill={K} />{hi('M12 28q1 6 6 9')}</g>,
  bike: <g><circle cx="12" cy="32" r="9" fill="none" {...L} /><circle cx="36" cy="32" r="9" fill="none" {...L} /><path d="M12 32l8-14h12l4 14M20 18l6 14h-14M26 32l6-14" fill="none" stroke="#E2553B" strokeWidth="3" strokeLinejoin="round" /><path d="M18 14h6M32 18l-2-6h4" {...L} fill="none" /></g>,
  watermelon: <g><path d="M4 18a20 20 0 0 0 40 0z" fill="#5DBB72" {...L} /><path d="M8 18a16 16 0 0 0 32 0z" fill="#FF6B6B" /><path d="M4 18a20 20 0 0 0 40 0z" fill="none" {...L} />{[[16, 24], [24, 28], [32, 24], [20, 30], [28, 30]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.3" ry="2" fill={K} />)}</g>,
  fishbowl: <g><path d="M14 10h20v4q8 6 8 16a18 14 0 0 1-36 0q0-10 8-16z" fill="#CFE7F5" {...L} /><path d="M8 26q16-4 32 0" stroke="#7FB5D9" strokeWidth="2" fill="none" /><path d="M20 32q5-6 10 0q-5 6-10 0zM20 32l-5-4v8z" fill="#FF9A3C" {...L} strokeWidth={1.6} /></g>,
  tv: <g><path d="M18 4l6 6 6-6" {...L} fill="none" /><rect x="5" y="10" width="38" height="26" rx="4" fill="#5B5F6B" {...L} /><rect x="9" y="14" width="30" height="18" rx="2" fill="#9CC3E0" {...L} strokeWidth={1.8} /><path d="M14 36l-2 6M34 36l2 6" {...L} />{hi('M13 18l6-1')}</g>,
  // ── 기억력·같은 그림 찾기 ──
  apple: <g><path d="M24 14c-6-4-16-2-16 10 0 10 7 18 12 18 2 0 3-1 4-1s2 1 4 1c5 0 12-8 12-18 0-12-10-14-16-10z" fill="#E2553B" {...L} /><path d="M24 14q0-6 4-9" {...L} fill="none" /><path d="M25 10q6-4 10 0-5 4-10 0z" fill="#5DBB72" {...L} strokeWidth={1.8} />{hi('M14 22q0-4 4-5')}</g>,
  star: <g><path d="M24 4l6 12 13 2-10 9 3 13-12-7-12 7 3-13L5 18l13-2z" fill="#FFD45C" {...L} />{hi('M17 20l4-1')}</g>,
  heart: <g><path d="M24 42S6 31 6 18a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="#FF7AA2" {...L} />{hi('M12 16q2-4 6-4')}</g>,
  fish: <g><path d="M6 24q12-16 28 0-16 16-28 0z" fill="#4CB0E0" {...L} /><path d="M34 24l9-8v16z" fill="#4CB0E0" {...L} /><circle cx="14" cy="22" r="2" fill={K} /><path d="M22 18q3 6 0 12" stroke={K} strokeWidth="1.6" fill="none" /></g>,
  umbrella: <g><path d="M4 22a20 16 0 0 1 40 0q-5-4-10 0-5-4-10 0-5-4-10 0-5-4-10 0z" fill="#8B5CF6" {...L} /><path d="M24 22v16a4 4 0 0 1-8 0" {...L} fill="none" /><path d="M24 6v-2" {...L} /></g>,
  crown: <g><path d="M6 36L4 14l11 9 9-15 9 15 11-9-2 22z" fill="#FFD45C" {...L} /><rect x="6" y="36" width="36" height="6" rx="2" fill="#E2A92C" {...L} /><circle cx="24" cy="26" r="3" fill="#E2553B" {...L} strokeWidth={1.6} /></g>,
  // ── 슬롯·리듬·줄다리기 ──
  seven: <g><path d="M10 8h28v7L24 42h-9l13-25H10z" fill="#E2553B" {...L} />{hi('M14 12h18')}</g>,
  diamond: <g><path d="M24 4l16 20-16 20L8 24z" fill="#4CB0E0" {...L} /><path d="M8 24h32M24 4l-6 20 6 20 6-20z" stroke={K} strokeWidth="1.4" fill="none" />{hi('M16 18l5-6')}</g>,
  note: <g><path d="M18 36V10l20-5v24" {...L} strokeWidth={3} fill="none" /><ellipse cx="13" cy="36" rx="6" ry="5" fill="#8B5CF6" {...L} /><ellipse cx="33" cy="30" rx="6" ry="5" fill="#8B5CF6" {...L} /><path d="M18 15l20-5" {...L} strokeWidth={3} /></g>,
  flag: <g><path d="M12 44V4" {...L} strokeWidth={3.4} /><path d="M13 6h24l-6 8 6 8H13z" fill="#E2553B" {...L} /></g>,
}

export function MiniIcon({ name, size = 40 }: { name: string; size?: number }) {
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>{ICONS[name] ?? ICONS.star}</svg>
}

// 주사위 한 면 (1~6)
const PIP_AT: Record<number, [number, number][]> = {
  1: [[24, 24]], 2: [[14, 14], [34, 34]], 3: [[14, 14], [24, 24], [34, 34]],
  4: [[14, 14], [34, 14], [14, 34], [34, 34]], 5: [[14, 14], [34, 14], [24, 24], [14, 34], [34, 34]],
  6: [[14, 13], [34, 13], [14, 24], [34, 24], [14, 35], [34, 35]],
}
export function DieFace({ value, size = 56 }: { value: number; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-label={`주사위 ${value}`} role="img" style={{ display: 'block' }}>
      <rect x="3" y="3" width="42" height="42" rx="9" fill="#FBF8F1" {...L} strokeWidth={2.8} />
      <path d="M8 40h32" stroke="#D6CBB4" strokeWidth="3" strokeLinecap="round" />
      {PIP_AT[value].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.2" fill={value === 1 ? '#E2553B' : K} />)}
    </svg>
  )
}

// 트럼프 카드 (1~13)
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export function PlayingCard({ value, suit = 0, size = 64 }: { value: number; suit?: number; size?: number }) {
  const red = suit % 2 === 0
  const color = red ? '#D6402C' : K
  const mark = [
    <path key="h" d="M24 38s-11-7-11-15a5.5 5.5 0 0 1 11-2 5.5 5.5 0 0 1 11 2c0 8-11 15-11 15z" fill={color} />,
    <path key="s" d="M24 14s11 8 11 15a5.5 5.5 0 0 1-9 4l2 6h-8l2-6a5.5 5.5 0 0 1-9-4c0-7 11-15 11-15z" fill={color} />,
    <path key="d" d="M24 14l9 13-9 13-9-13z" fill={color} />,
    <g key="c" fill={color}><circle cx="24" cy="20" r="5" /><circle cx="17.5" cy="29" r="5" /><circle cx="30.5" cy="29" r="5" /><path d="M22 30h4l2 9h-8z" /></g>,
  ][suit % 4]
  return (
    <svg viewBox="0 0 48 64" width={size * 0.75} height={size} aria-label={`카드 ${RANK[value]}`} role="img" style={{ display: 'block' }}>
      <rect x="2" y="2" width="44" height="60" rx="6" fill="#fff" {...L} strokeWidth={2.6} />
      <text x="7" y="15" fontSize="12" fontWeight="800" fontFamily="sans-serif" fill={color}>{RANK[value]}</text>
      <g transform="translate(0 6)">{mark}</g>
      <text x="41" y="58" fontSize="12" fontWeight="800" fontFamily="sans-serif" fill={color} textAnchor="end">{RANK[value]}</text>
    </svg>
  )
}

// 야바위 나무 컵
export function Cup({ width = 150 }: { width?: number }) {
  return (
    <svg viewBox="0 0 150 110" width={width} height={(width * 110) / 150} aria-hidden="true" style={{ display: 'block' }}>
      <path d="M22 104L36 14q39-10 78 0l14 90z" fill="#B87842" stroke={K} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="75" cy="14" rx="39" ry="8" fill="#9C6232" stroke={K} strokeWidth="4" />
      <path d="M30 70q45 10 90 0M27 88q48 10 96 0" stroke="#8A5228" strokeWidth="5" fill="none" />
      <path d="M48 28l-8 64" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
      <ellipse cx="75" cy="104" rx="53" ry="6" fill="#8A5228" stroke={K} strokeWidth="4" />
    </svg>
  )
}
