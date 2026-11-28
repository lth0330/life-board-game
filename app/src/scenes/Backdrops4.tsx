// 배경 4 (11-28 장면 20개 추가용): 교실·캠퍼스·학교 뒤뜰·카페·경로당·잔치 홀·신생아실 복도·강의실·축제 무대·수학여행지
// 기준: 처음부터 자세히 (창틀·커튼·창밖, 액자 내용, 빈 곳 채우기)
import type { ReactNode } from 'react'
import { GROUND, H, W } from './Stage'
import { INK } from './kit'
import { Bush, Flowers, Grass, Tree } from './Nature'
import { Pagoda } from './Props4'

/** 창문 (창틀·창턱·밖 풍경). (x, y) = 왼쪽 위 */
export function Window({ x, y, w = 70, h = 54, id, night = false, view = 'trees', curtain = '#F3A3C0' }: { x: number; y: number; w?: number; h?: number; id: string; night?: boolean; view?: 'trees' | 'city' | 'field'; curtain?: string | null }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={id}><rect width={w} height={h} rx="3" /></clipPath>
      <rect width={w} height={h} rx="3" fill={night ? '#2E3A66' : '#BFE4F7'} />
      <g clipPath={`url(#${id})`}>
        {night ? <g><circle cx={w - 14} cy="12" r="5" fill="#FFF3A6" />{[[10, 8], [26, 18], [40, 6]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="0.9" fill="#fff" />)}</g> : <path d={`M6 ${h * 0.3} q4 -6 10 -3 q4 -5 10 0 q5 0 4 4 H6Z`} fill="#fff" />}
        {view === 'trees' && <g><circle cx={w * 0.7} cy={h * 0.62} r="9" fill={night ? '#3E5A4A' : '#8CC377'} /><circle cx={w * 0.85} cy={h * 0.5} r="10" fill={night ? '#3E5A4A' : '#7FB86A'} /><path d={`M0 ${h * 0.85} Q${w / 2} ${h * 0.72} ${w} ${h * 0.82} V${h} H0Z`} fill={night ? '#2E4A3A' : '#A9D98F'} /></g>}
        {view === 'city' && <g>{[[4, 20, 14], [20, 30, 12], [34, 14, 16], [52, 26, 14]].map(([bx, by, bw], i) => <g key={i}><rect x={bx} y={by} width={bw} height={h} fill={night ? '#4A5478' : ['#C9D6E8', '#DDE5EE', '#B9C8DC', '#D3DCE6'][i]} stroke="rgba(42,33,24,0.3)" strokeWidth="0.8" />{Array.from({ length: 4 }, (_, r) => <rect key={r} x={bx + 3} y={by + 4 + r * 7} width={bw - 6} height="3" fill={night ? '#FFE27A' : '#fff'} opacity="0.7" />)}</g>)}</g>}
        {view === 'field' && <path d={`M0 ${h * 0.6} Q${w * 0.4} ${h * 0.45} ${w} ${h * 0.58} V${h} H0Z`} fill="#A9D98F" />}
        <path d={`M4 4 L14 4 L4 14Z`} fill="#fff" opacity="0.45" />
      </g>
      <rect width={w} height={h} rx="3" fill="none" stroke={INK} strokeWidth="2.2" />
      <path d={`M${w / 2} 0 V${h} M0 ${h / 2} H${w}`} stroke="#FFFDF5" strokeWidth="2.6" />
      <path d={`M${w / 2} 0 V${h} M0 ${h / 2} H${w}`} stroke={INK} strokeWidth="0.8" opacity="0.5" />
      <rect x="-4" y={h} width={w + 8} height="4" rx="1.5" fill="#F7E9CF" stroke={INK} strokeWidth="1.4" />
      {curtain && <g>
        <path d={`M-8 -6 Q-2 ${h * 0.4} -10 ${h + 2} H4 Q8 ${h * 0.4} 8 -6Z`} fill={curtain} stroke={INK} strokeWidth="1.4" />
        <path d={`M${w + 8} -6 Q${w + 2} ${h * 0.4} ${w + 10} ${h + 2} H${w - 4} Q${w - 8} ${h * 0.4} ${w - 8} -6Z`} fill={curtain} stroke={INK} strokeWidth="1.4" />
        <path d={`M-12 -7 H${w + 12}`} stroke="#8A5A34" strokeWidth="2.6" strokeLinecap="round" />
      </g>}
    </g>
  )
}

/** 벽시계 (둥근 테·눈금·바늘). */
export function WallClock({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#FFFDF5" stroke={INK} strokeWidth="1.8" /><circle r={r - 1.8} fill="none" stroke="#C98B55" strokeWidth="1.2" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 ${-r + 2.6} V${-r + 4}`} stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.1} transform={`rotate(${i * 30})`} />)}
      <path d={`M0 0 V${-r * 0.55} M0 0 L${r * 0.4} ${r * 0.15}`} stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
    </g>
  )
}

/** 교실: 칠판(분필 글씨는 board로)·분필 받침·시간표·창문·게시판·교실 바닥. */
export function Classroom({ board, boardX = 70 }: { board?: ReactNode; boardX?: number }) {
  return (
    <g>
      <rect width={W} height={H} fill="#EFE6CF" />
      <rect width={W} height="10" fill="#E2D4B4" /><path d={`M0 10 H${W}`} stroke={INK} strokeWidth="1.8" />
      {/* 형광등 */}
      {[80, 240].map((lx) => <g key={lx}><rect x={lx - 24} y="10" width="48" height="5" rx="2" fill="#FFFDF0" stroke={INK} strokeWidth="1.2" /><path d={`M${lx - 20} 18 H${lx + 20}`} stroke="#FFF7C8" strokeWidth="2" opacity="0.6" /></g>)}
      {/* 칠판 */}
      <g transform={`translate(${boardX} 26)`}>
        <rect x="-4" y="-4" width="148" height="70" rx="3" fill="#8A5A34" stroke={INK} strokeWidth="2" />
        <rect width="140" height="62" rx="1.5" fill="#2F5A46" />
        <path d="M6 54 q20 -2 40 1 M90 8 q14 2 30 -1" stroke="#fff" strokeWidth="0.8" opacity="0.18" fill="none" />
        {board}
        <rect x="-2" y="64" width="144" height="5" rx="1.5" fill="#A86B3C" stroke={INK} strokeWidth="1.2" />
        <rect x="20" y="61.6" width="7" height="2.4" rx="1" fill="#fff" /><rect x="32" y="61.6" width="6" height="2.4" rx="1" fill="#F7B8C8" /><rect x="110" y="60" width="14" height="4" rx="1" fill="#C9B07A" stroke={INK} strokeWidth="0.6" />
      </g>
      {/* 시간표 · 급훈 액자 */}
      <g transform="translate(14 28)"><rect width="40" height="44" rx="2" fill="#FFFDF5" stroke={INK} strokeWidth="1.4" /><text x="20" y="8" textAnchor="middle" fontSize="5.4" fill={INK}>시간표</text>{Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => <rect key={`${r}${c}`} x={4 + c * 8.2} y={11 + r * 6.2} width="7" height="5" fill={['#F7D3E2', '#CFE7F5', '#FFF3C0', '#DDF2D9'][(r + c) % 4]} />))}</g>
      <g transform="translate(232 24)"><rect width="34" height="12" rx="1.5" fill="#FFFDF5" stroke={INK} strokeWidth="1.2" /><text x="17" y="8.4" textAnchor="middle" fontSize="5.6" fill={INK}>성실 · 배려</text></g>
      <WallClock x={290} y={30} />
      {/* 게시판 (그림·안내문 압정) */}
      <g transform="translate(232 44)"><rect width="74" height="40" rx="2" fill="#C99A62" stroke={INK} strokeWidth="1.6" />{[[4, 4, '#FFFDF5'], [26, 6, '#CFE7F5'], [50, 3, '#F7D3E2'], [8, 22, '#FFF3C0'], [36, 22, '#DDF2D9']].map(([px, py, c], i) => <g key={i}><rect x={px as number} y={py as number} width="20" height="15" fill={c as string} stroke={INK} strokeWidth="0.6" transform={`rotate(${(i % 3) - 1} ${px} ${py})`} /><circle cx={(px as number) + 10} cy={(py as number) + 1.6} r="1.2" fill="#E0533F" /></g>)}</g>
      {/* 아래 벽 · 바닥 (마루) */}
      <rect y={GROUND - 36} width={W} height="30" fill="#CBB892" />
      <rect y={GROUND - 39} width={W} height="4" fill="#E9DDBE" stroke="rgba(42,33,24,0.4)" strokeWidth="1" />
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#C9A273" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 40 + 10} ${GROUND - 6} L${i * 40 - 10} ${H}`} stroke="rgba(120,80,40,0.35)" strokeWidth="1.2" />)}
      <path d={`M0 ${GROUND - 6} H${W}`} stroke={INK} strokeWidth="1.8" />
    </g>
  )
}

/** 학생 책상 (옆에서: 철 다리 + 나무 상판 + 책가방 고리). (x, y) = 바닥 */
export function SchoolDesk({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d="M-14 -34 V0 M14 -34 V0" stroke={INK} strokeWidth="3.6" /><path d="M-14 -34 V0 M14 -34 V0" stroke="#8A95A3" strokeWidth="2" />
      <rect x="-16" y="-30" width="32" height="8" fill="#9BA5B2" stroke={INK} strokeWidth="1.2" />
      <rect x="-19" y="-38" width="38" height="5" rx="1.5" fill="#D9B080" stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 대학 캠퍼스: 시계탑 본관·잔디·은행나무·벤치·보도. cam = 옆으로 흐름 */
export function Campus({ cam = 0, night = false }: { cam?: number; night?: boolean }) {
  const o = -(cam % 320)
  return (
    <g>
      <defs><linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#2A3060' : '#A9DCF5'} /><stop offset="1" stopColor={night ? '#5A4A7A' : '#E8F6FB'} /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#cp-sky)" />
      {[0, 320].map((dx) => (
        <g key={dx} transform={`translate(${o + dx} 0)`}>
          {/* 본관: 붉은 벽돌 + 시계탑 */}
          <rect x="30" y="54" width="170" height="64" fill="#C9694F" stroke={INK} strokeWidth="2" />
          {Array.from({ length: 8 }, (_, r) => <path key={r} d={`M30 ${60 + r * 7} H200`} stroke="#B2563E" strokeWidth="0.8" />)}
          {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={40 + i * 26} y="62" width="14" height="18" rx="6" fill={night ? '#FFE27A' : '#BFE4F7'} stroke={INK} strokeWidth="1.2" /><rect x={40 + i * 26} y="88" width="14" height="18" rx="1" fill={night ? '#FFE27A' : '#BFE4F7'} stroke={INK} strokeWidth="1.2" /></g>)}
          <path d="M24 56 L115 38 L206 56Z" fill="#7A4A3A" stroke={INK} strokeWidth="2" />
          <rect x="100" y="12" width="30" height="44" fill="#D97A5E" stroke={INK} strokeWidth="2" />
          <path d="M96 14 L115 -2 L134 14Z" fill="#5A7A9A" stroke={INK} strokeWidth="2" />
          <WallClock x={115} y={28} r={9} />
          <rect x="104" y="92" width="22" height="26" rx="2" fill="#7A4A2A" stroke={INK} strokeWidth="1.6" />
          <path d="M115 92 V118" stroke={INK} strokeWidth="1" />
          {/* 은행나무 (노란 잎) · 덤불 */}
          <Tree x={232} y={124} s={0.85} c="#F2C230" />
          <Tree x={14} y={124} s={0.7} />
          <Bush x={280} y={124} s={0.7} flowers="#F2708A" />
        </g>
      ))}
      <rect y="118" width={W} height={H - 118} fill="#8CC377" />
      <path d={`M0 118 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 보도 (벽돌 길) */}
      <rect y={GROUND - 8} width={W} height={H - GROUND + 8} fill="#D9C2A0" />
      {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${((i * 20 + o) % 340 + 340) % 340 - 10} ${GROUND - 8} v8 M${((i * 20 + 10 + o) % 340 + 340) % 340 - 10} ${GROUND} v${H - GROUND}`} stroke="rgba(120,80,40,0.3)" strokeWidth="1" />)}
      <path d={`M0 ${GROUND} H${W}`} stroke="rgba(120,80,40,0.3)" strokeWidth="1" />
      <path d={`M0 ${GROUND - 8} H${W}`} stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 10 }, (_, i) => <Grass key={i} x={((i * 37 + o) % 340 + 340) % 340 - 10} y={GROUND - 9} />)}
    </g>
  )
}

/** 학교 뒤뜰 (방과 후): 학교 건물 벽·창문, 벚나무, 꽃밭, 노을. */
export function SchoolYard({ dusk = 0.6 }: { dusk?: number }) {
  return (
    <g>
      <defs><linearGradient id="sy-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6B48A" /><stop offset="1" stopColor="#FCE3C0" /></linearGradient></defs>
      <rect width={W} height={H} fill="#BFE4F7" />
      <rect width={W} height={H} fill="url(#sy-sky)" opacity={dusk} />
      {/* 학교 건물 (크림 벽 + 창 줄 + 현관 지붕 + 시계) */}
      <rect x="150" y="20" width="180" height="104" fill="#F2E6CC" stroke={INK} strokeWidth="2" />
      {[0, 1, 2].map((r) => Array.from({ length: 6 }, (_, i) => <g key={`${r}${i}`}><rect x={160 + i * 28} y={30 + r * 30} width="20" height="18" fill="#BFE4F7" stroke={INK} strokeWidth="1.2" /><path d={`M${170 + i * 28} ${30 + r * 30} V${48 + r * 30}`} stroke={INK} strokeWidth="0.8" /></g>))}
      <rect x="150" y="16" width="180" height="6" fill="#C9B89A" stroke={INK} strokeWidth="1.6" />
      <WallClock x={240} y={10} r={7} />
      {/* 벚나무 (분홍 꽃 덩어리) */}
      <path d="M70 124 Q66 96 72 70 M72 86 Q56 78 46 66 M72 80 Q90 70 98 58" stroke="#7A5232" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M70 124 Q66 96 72 70" stroke={INK} strokeWidth="1.4" fill="none" />
      {[[48, 60, 18], [72, 50, 22], [98, 54, 18], [60, 74, 14], [88, 72, 14]].map(([cx, cy, r], i) => <g key={i}><circle cx={cx} cy={cy} r={r} fill="#F7C6D6" stroke={INK} strokeWidth="1.6" />{Array.from({ length: 5 }, (_, j) => <circle key={j} cx={cx - r / 2 + ((j * 7) % r)} cy={cy - r / 3 + ((j * 5) % (r * 0.8))} r="1.6" fill="#FFFFFF" />)}</g>)}
      <rect y="124" width={W} height={H - 124} fill="#9BCB7F" />
      <path d={`M0 124 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 꽃밭 (벽돌 테두리) */}
      <rect x="160" y="128" width="150" height="10" fill="#B5452F" stroke={INK} strokeWidth="1.4" />
      <Flowers x0={166} x1={304} y={128} seed={4} />
      {/* 떨어지는 꽃잎은 장면에서 */}
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#E3D2AE" />
      <path d={`M0 ${GROUND - 6} H${W}`} stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={i * 33 + 8} cy={GROUND + 6 + (i % 3) * 4} r="1.2" fill="#C9B07A" />)}
    </g>
  )
}

/** 카페 (알바): 메뉴판 칠판·원두 선반·펜던트 조명·창문·화분, 앞 카운터는 장면에서 */
export function Cafe({ t = 0 }: { t?: number }) {
  return (
    <g>
      <rect width={W} height={H} fill="#EAD9C0" />
      {/* 벽: 위쪽 페인트 + 아래 흰 타일 */}
      <rect y="0" width={W} height="12" fill="#5A3E2E" /><path d={`M0 12 H${W}`} stroke={INK} strokeWidth="1.8" />
      <rect y="78" width={W} height={GROUND - 78} fill="#F7F3EC" />
      {Array.from({ length: 21 }, (_, i) => Array.from({ length: 6 }, (_, r) => <rect key={`${i}${r}`} x={i * 16 - (r % 2) * 8} y={80 + r * 12} width="15" height="11" fill="none" stroke="rgba(42,33,24,0.12)" strokeWidth="0.8" />))}
      {/* 펜던트 조명 */}
      {[60, 160, 260].map((lx) => <g key={lx}><path d={`M${lx} 12 V26`} stroke={INK} strokeWidth="1.2" /><path d={`M${lx - 10} 34 Q${lx - 10} 24 ${lx} 24 Q${lx + 10} 24 ${lx + 10} 34Z`} fill="#2F5A46" stroke={INK} strokeWidth="1.4" /><ellipse cx={lx} cy="35" rx="4" ry="2" fill="#FFF3A6" /><path d={`M${lx - 12} 36 L${lx - 22} 70 H${lx + 22} L${lx + 12} 36Z`} fill="#FFF3A6" opacity={0.18 + 0.04 * Math.sin(t * 2)} /></g>)}
      {/* 메뉴판 칠판 */}
      <g transform="translate(18 26)">
        <rect width="92" height="50" rx="3" fill="#2F3A34" stroke="#8A5A34" strokeWidth="3" />
        <text x="46" y="10" textAnchor="middle" fontSize="7" fill="#FFF3C0">MENU</text>
        {[['아메리카노', '3.0'], ['카페라테', '3.5'], ['바닐라라테', '4.0'], ['딸기 주스', '4.5']].map(([m, p], i) => <g key={m}><text x="6" y={20 + i * 8} fontSize="5.6" fill="#fff">{m}</text><text x="86" y={20 + i * 8} textAnchor="end" fontSize="5.6" fill="#F7B8C8">{p}</text></g>)}
      </g>
      {/* 원두 선반 (병·자루) */}
      <g transform="translate(200 40)">
        {[0, 22].map((sy) => <rect key={sy} y={sy + 16} width="100" height="3" fill="#8A5A34" stroke={INK} strokeWidth="1" />)}
        {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${8 + i * 24} 16)`}><path d="M-6 0 V-12 Q-6 -14 -4 -14 H4 Q6 -14 6 -12 V0Z" fill="#F4F0EA" stroke={INK} strokeWidth="1" opacity="0.9" /><path d="M-5 0 V-8 H5 V0Z" fill="#6A3E1E" /><rect x="-5" y="-16" width="10" height="2.4" rx="1" fill="#C98B55" stroke={INK} strokeWidth="0.6" /></g>)}
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${14 + i * 32} 38)`}><path d="M-8 0 Q-9 -12 -6 -14 H6 Q9 -12 8 0Z" fill="#C9A27A" stroke={INK} strokeWidth="1" /><text y="-5" textAnchor="middle" fontSize="4.4" fill={INK}>COFFEE</text></g>)}
      </g>
      {/* 화분 */}
      <g transform="translate(182 78)"><path d="M-7 0 L-5 -10 H5 L7 0Z" fill="#C9694F" stroke={INK} strokeWidth="1.2" /><path d="M0 -10 Q-10 -22 -12 -30 M0 -10 Q2 -26 8 -34 M0 -10 Q10 -18 14 -24" stroke="#4E8A3A" strokeWidth="2" fill="none" />{[[-12, -30], [8, -34], [14, -24], [-6, -22], [4, -20]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx="4" ry="2" fill="#7FBF6A" stroke={INK} strokeWidth="0.6" transform={`rotate(${i * 40} ${a} ${b})`} />)}</g>
      <rect y={GROUND - 4} width={W} height={H - GROUND + 4} fill="#8A6A4A" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 30} ${GROUND - 4} V${H}`} stroke="rgba(42,33,24,0.25)" strokeWidth="1" />)}
      <path d={`M0 ${GROUND - 4} H${W}`} stroke={INK} strokeWidth="1.8" />
    </g>
  )
}

/** 카페 카운터 (앞에 서는 계산대: 나무 앞판 + 대리석 상판 + 계산기 + 진열장). (x, y) = 바닥 가운데 */
export function CafeCounter({ x, y, w = 140, h = 50 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <rect x={-w / 2} y={-h} width={w} height={h} fill="#B07A48" stroke={INK} strokeWidth="2" />
      {Array.from({ length: Math.floor(w / 12) }, (_, i) => <path key={i} d={`M${-w / 2 + 6 + i * 12} ${-h + 6} V-2`} stroke="#8A5A34" strokeWidth="1.2" />)}
      <rect x={-w / 2 - 4} y={-h - 5} width={w + 8} height="6" rx="2" fill="#F1EEE8" stroke={INK} strokeWidth="1.8" />
      <path d={`M${-w / 2 + 10} ${-h - 3} q12 2 24 -1 M${w / 4} ${-h - 2.6} q10 2 20 0`} stroke="#B8B2AA" strokeWidth="0.7" fill="none" />
      {/* 계산기 */}
      <g transform={`translate(${-w / 2 + 18} ${-h - 5})`}><path d="M-10 0 L-8 -10 H8 L10 0Z" fill="#3A4250" stroke={INK} strokeWidth="1.2" /><rect x="-6" y="-9" width="12" height="5" fill="#8FE0B0" /><path d="M2 -10 L6 -18 H-4 L-2 -10" fill="#5A5F68" stroke={INK} strokeWidth="1" /></g>
      {/* 빵 진열장 */}
      <g transform={`translate(${w / 2 - 26} ${-h - 5})`}><rect x="-20" y="-18" width="40" height="18" rx="2" fill="#E6F4FB" stroke={INK} strokeWidth="1.4" opacity="0.95" />{[-12, 0, 12].map((k, i) => <path key={k} d={`M${k - 5} -2 Q${k} -9 ${k + 5} -2Z`} fill={['#E0A55A', '#C98B55', '#F2C9A0'][i]} stroke={INK} strokeWidth="0.8" />)}<path d="M-20 -10 H20" stroke={INK} strokeWidth="0.8" /></g>
    </g>
  )
}

/** 경로당 (온돌방): 창호지 미닫이문·노란 장판·달력·선풍기·'경로당' 현판·액자 */
export function SeniorCenter() {
  return (
    <g>
      <rect width={W} height={H} fill="#F1E3C4" />
      <rect width={W} height="12" fill="#C9A273" /><path d={`M0 12 H${W}`} stroke={INK} strokeWidth="1.8" />
      {/* 현판 */}
      <g transform="translate(160 26)"><rect x="-40" y="-9" width="80" height="18" rx="2" fill="#7A4A2A" stroke={INK} strokeWidth="1.8" /><rect x="-36" y="-6" width="72" height="12" fill="#5A3420" /><text y="4" textAnchor="middle" fontSize="9" fill="#F2D27A">행복 경로당</text></g>
      {/* 창호지 미닫이문 (나무 살) */}
      <g transform="translate(14 40)">
        <rect width="84" height="78" fill="#FFF8E8" stroke={INK} strokeWidth="2" />
        {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${i * 16.8 + 8.4} 0 V78`} stroke="#A86B3C" strokeWidth="1.6" />)}
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${i * 13 + 6.5} H84`} stroke="#A86B3C" strokeWidth="1.6" />)}
        <path d="M42 0 V78" stroke={INK} strokeWidth="2" />
        <rect x="36" y="36" width="4" height="8" rx="1" fill="#7A4A2A" /><rect x="44" y="36" width="4" height="8" rx="1" fill="#7A4A2A" />
      </g>
      {/* 달력 */}
      <g transform="translate(236 36)"><rect width="34" height="40" fill="#FFFFFF" stroke={INK} strokeWidth="1.4" /><rect width="34" height="10" fill="#E0533F" /><text x="17" y="7.6" textAnchor="middle" fontSize="6" fill="#fff">11월</text>{Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 }, (_, c) => <rect key={`${r}${c}`} x={3 + c * 5} y={14 + r * 6} width="3.6" height="3.6" fill={c === 0 ? '#F7B8C8' : '#E8E2D8'} />))}<circle cx="17" cy="-2" r="1.4" fill={INK} /></g>
      {/* 액자 (단체 사진) */}
      <g transform="translate(124 46)"><rect width="56" height="34" fill="#C98B55" stroke={INK} strokeWidth="1.6" /><rect x="4" y="4" width="48" height="26" fill="#E9D8B4" />{[10, 20, 30, 40].map((px, i) => <g key={px}><circle cx={px + 2} cy="16" r="3" fill="#F4D9A8" stroke={INK} strokeWidth="0.5" /><path d={`M${px - 2} 30 Q${px + 2} 20 ${px + 6} 30`} fill={['#5E8FC9', '#E0533F', '#7FBF6A', '#C77FD0'][i]} /><path d={`M${px - 1} 14 Q${px + 2} 11 ${px + 5} 14`} fill={i % 2 ? '#DDD' : '#B8B2AA'} /></g>)}</g>
      {/* 선풍기 */}
      <g transform="translate(296 118)"><path d="M-8 0 Q0 -4 8 0Z" fill="#B9C3CF" stroke={INK} strokeWidth="1.2" /><path d="M0 -2 V-30" stroke={INK} strokeWidth="2.4" /><circle cy="-38" r="11" fill="#E6F4FB" stroke={INK} strokeWidth="1.6" />{[0, 120, 240].map((a) => <ellipse key={a} cy="-43" rx="3" ry="5" fill="#9DD2F0" stroke={INK} strokeWidth="0.6" transform={`rotate(${a} 0 -38)`} />)}<circle cy="-38" r="2" fill="#5E8FC9" stroke={INK} strokeWidth="0.6" /></g>
      {/* 아래 벽 · 장판 */}
      <rect y="118" width={W} height="6" fill="#C9A273" stroke={INK} strokeWidth="1.4" />
      <rect y="124" width={W} height={H - 124} fill="#E9BF5E" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${128 + i * 7} H${W}`} stroke="rgba(160,110,30,0.25)" strokeWidth="1" />)}
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${i * 80 + 30} 124 V${H}`} stroke="rgba(160,110,30,0.35)" strokeWidth="1.2" />)}
    </g>
  )
}

/** 잔치 홀 (칠순·육순): 병풍·현수막·풍선 묶음·가랜드·조명 */
export function Banquet({ title = '축 칠순', t = 0 }: { title?: string; t?: number }) {
  return (
    <g>
      <rect width={W} height={H} fill="#FBEFE0" />
      {/* 금빛 커튼 주름 */}
      {Array.from({ length: 20 }, (_, i) => <path key={i} d={`M${i * 16} 0 Q${i * 16 + 8} 40 ${i * 16} 120`} stroke="rgba(201,150,60,0.25)" strokeWidth="6" fill="none" />)}
      {/* 가랜드 (삼각 깃발) */}
      <path d={`M0 10 Q80 26 160 12 Q240 26 320 10`} stroke={INK} strokeWidth="1" fill="none" />
      {Array.from({ length: 16 }, (_, i) => { const gx = 10 + i * 20, gy = 10 + Math.sin((i / 16) * Math.PI * 2) * -6 + 8; return <path key={i} d={`M${gx - 5} ${gy} L${gx + 5} ${gy} L${gx} ${gy + 9}Z`} fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A'][i % 4]} stroke={INK} strokeWidth="0.7" /> })}
      {/* 병풍 (여덟 폭: 모란·소나무 그림) */}
      <g transform="translate(64 30)">
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`translate(${i * 24} 0)`}>
            <rect width="24" height="84" fill={i % 2 ? '#F6E7C8' : '#F2E0BC'} stroke="#8A5A34" strokeWidth="2" />
            <rect x="3" y="3" width="18" height="78" fill="none" stroke="#C9A26A" strokeWidth="0.8" />
            {i % 2 === 0 ? <g><circle cx="12" cy="56" r="5" fill="#E0708A" stroke={INK} strokeWidth="0.6" /><circle cx="8" cy="64" r="3.6" fill="#F3A3C0" stroke={INK} strokeWidth="0.5" /><path d="M12 61 Q10 70 12 78" stroke="#4E8A3A" strokeWidth="1.2" fill="none" /></g>
              : <g><path d="M12 78 Q10 60 14 40" stroke="#7A5232" strokeWidth="1.6" fill="none" /><path d="M6 46 h12 M4 54 h14 M8 38 h9" stroke="#4E8A3A" strokeWidth="3" strokeLinecap="round" /></g>}
          </g>
        ))}
      </g>
      {/* 현수막 */}
      <g transform="translate(160 22)"><path d="M-62 -8 H62 V8 H-62Z" fill="#C2452D" stroke={INK} strokeWidth="1.8" /><path d="M-62 -8 l-8 8 l8 8 M62 -8 l8 8 l-8 8" fill="#A8392A" stroke={INK} strokeWidth="1.4" /><text y="4" textAnchor="middle" fontSize="10" fill="#FFE27A">{title}을 축하합니다</text></g>
      {/* 풍선 묶음 */}
      {[30, 290].map((bx, j) => <g key={bx}>{[[-8, 40], [6, 34], [0, 50], [-4, 26]].map(([dx, dy], i) => { const sw = Math.sin(t * 1.6 + i + j) * 1.5; return <g key={i}><path d={`M${bx} 112 Q${bx + dx / 2} ${dy + 40} ${bx + dx + sw} ${dy + 10}`} stroke={INK} strokeWidth="0.6" fill="none" /><ellipse cx={bx + dx + sw} cy={dy} rx="8" ry="10" fill={['#E0533F', '#F2C230', '#F3A3C0', '#5E8FC9'][(i + j) % 4]} stroke={INK} strokeWidth="1.2" /><path d={`M${bx + dx + sw - 3} ${dy - 5} q1 -2 3 -2`} stroke="#fff" strokeWidth="1.2" fill="none" /></g> })}<rect x={bx - 4} y="110" width="8" height="5" rx="1" fill="#8A5A34" stroke={INK} strokeWidth="0.8" /></g>)}
      <rect y="118" width={W} height="4" fill="#C9A26A" stroke={INK} strokeWidth="1.2" />
      <rect y="122" width={W} height={H - 122} fill="#B5452F" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${i * 34} 122 L${i * 34 - 20} ${H}`} stroke="rgba(0,0,0,0.12)" strokeWidth="1.4" />)}
    </g>
  )
}

/** 산부인과 신생아실 복도: 큰 유리창 안 아기 침대 줄, 손잡이 난간, 안내판 */
export function NurseryHall({ inside }: { inside?: ReactNode }) {
  return (
    <g>
      <rect width={W} height={H} fill="#EEF4F7" />
      <rect width={W} height="10" fill="#DDE7EC" /><path d={`M0 10 H${W}`} stroke={INK} strokeWidth="1.6" />
      {/* 안내판 */}
      <g transform="translate(160 22)"><rect x="-34" y="-7" width="68" height="14" rx="3" fill="#F3A3C0" stroke={INK} strokeWidth="1.4" /><text y="3.4" textAnchor="middle" fontSize="8" fill="#fff">신생아실</text></g>
      {/* 큰 유리창 (안쪽 방) */}
      <g transform="translate(40 34)">
        <rect width="240" height="78" rx="3" fill="#FFF6F9" />
        <rect y="58" width="240" height="20" fill="#F7E2EA" />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${24 + i * 48} 10)`}><rect x="-10" y="0" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#E8C6D2" strokeWidth="1" /><path d="M-6 6 h12 M-6 10 h8" stroke="#F3A3C0" strokeWidth="1.2" /></g>)}
        {inside}
        <rect width="240" height="78" rx="3" fill="#DCEFF8" opacity="0.25" />
        <path d="M20 6 L60 6 L20 40Z M150 6 L170 6 L150 22Z" fill="#fff" opacity="0.4" />
        <rect width="240" height="78" rx="3" fill="none" stroke={INK} strokeWidth="2.4" />
        <path d="M80 0 V78 M160 0 V78" stroke="#B9C3CF" strokeWidth="3" /><path d="M80 0 V78 M160 0 V78" stroke={INK} strokeWidth="0.8" />
      </g>
      {/* 아래 벽 · 난간 · 바닥 타일 */}
      <rect y="112" width={W} height={GROUND - 118} fill="#D3E3EA" />
      <rect y="124" width={W} height="4" rx="2" fill="#B9C3CF" stroke={INK} strokeWidth="1.2" />
      {[20, 120, 220, 300].map((bx) => <rect key={bx} x={bx} y="122" width="4" height="8" fill="#8A95A3" stroke={INK} strokeWidth="0.6" />)}
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#E3ECF0" />
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${i * 32} ${GROUND - 6} V${H}`} stroke="rgba(42,33,24,0.15)" strokeWidth="1" />)}
      <path d={`M0 ${GROUND + 8} H${W}`} stroke="rgba(42,33,24,0.15)" strokeWidth="1" />
      <path d={`M0 ${GROUND - 6} H${W}`} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 대학 강의실: 계단식 뒷벽 · 화이트보드(수식) · 스크린 · 시계. 책상은 장면에서 */
export function LectureHall({ board }: { board?: ReactNode }) {
  return (
    <g>
      <rect width={W} height={H} fill="#E6E2DA" />
      {/* 나무 벽판 */}
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 20} y="0" width="20" height="118" fill={i % 2 ? '#D8C6A8' : '#D2BE9E'} />)}
      <path d={`M0 118 H${W}`} stroke={INK} strokeWidth="1.6" />
      {/* 화이트보드 */}
      <g transform="translate(40 22)">
        <rect x="-3" y="-3" width="166" height="76" rx="2" fill="#B9C3CF" stroke={INK} strokeWidth="2" />
        <rect width="160" height="70" fill="#FFFFFF" />
        {board ?? <g fontSize="8" fill="#2E4A7A"><text x="10" y="18">∫ f(x)dx = F(b) - F(a)</text><text x="10" y="34" fill="#C2452D">기말고사</text><text x="10" y="50">1. 미분하시오</text><path d="M110 40 q10 -20 20 0 t20 0" stroke="#2E6FD8" strokeWidth="1.2" fill="none" /></g>}
        <rect x="10" y="70" width="140" height="4" rx="1" fill="#8A95A3" stroke={INK} strokeWidth="0.8" />
        <rect x="24" y="68" width="8" height="3" rx="1" fill="#2E6FD8" /><rect x="36" y="68" width="8" height="3" rx="1" fill="#E0533F" />
      </g>
      <WallClock x={250} y={34} r={10} />
      <g transform="translate(222 56)"><rect width="56" height="30" rx="2" fill="#FFFDF5" stroke={INK} strokeWidth="1.4" /><text x="28" y="12" textAnchor="middle" fontSize="6" fill={INK}>시험 중</text><text x="28" y="22" textAnchor="middle" fontSize="5" fill="#C2452D">휴대폰 끄기</text></g>
      <rect y="118" width={W} height={H - 118} fill="#B9A587" />
      {[128, 140].map((sy) => <path key={sy} d={`M0 ${sy} H${W}`} stroke="rgba(42,33,24,0.25)" strokeWidth="1.2" />)}
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#9C8A6E" />
      <path d={`M0 ${GROUND - 6} H${W}`} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 대학 축제 무대 (밤): 트러스 조명·스피커·'대동제' 현수막·반짝이는 조명·관객 실루엣 */
export function FestivalStage({ t }: { t: number }) {
  const lights = ['#F2708A', '#7FCBE8', '#F2C230', '#9D7FD0']
  return (
    <g>
      <defs><linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E2050" /><stop offset="1" stopColor="#4A3A7A" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#fs-sky)" />
      {[[20, 14], [60, 30], [270, 12], [300, 40], [240, 26]].map(([sx, sy], i) => <circle key={i} cx={sx} cy={sy} r="1" fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
      {/* 무대 뒤 LED 벽 + 현수막 */}
      <rect x="60" y="30" width="200" height="74" fill="#2A2A44" stroke={INK} strokeWidth="2" />
      {Array.from({ length: 20 }, (_, i) => Array.from({ length: 7 }, (_, r) => <rect key={`${i}${r}`} x={62 + i * 10} y={32 + r * 10.4} width="8" height="8.6" fill={lights[(i + r + Math.floor(t * 4)) % 4]} opacity={0.25 + 0.2 * Math.sin(t * 5 + i * 0.6 + r)} />))}
      <g transform="translate(160 22)"><rect x="-54" y="-9" width="108" height="18" rx="2" fill="#E0533F" stroke={INK} strokeWidth="1.8" /><text y="4.4" textAnchor="middle" fontSize="11" fill="#FFF3A6">2026 대동제</text></g>
      {/* 트러스 (철골 기둥 · 위 가로대) */}
      {[50, 270].map((tx) => <g key={tx}><rect x={tx - 5} y="12" width="10" height="110" fill="none" stroke="#B9C3CF" strokeWidth="2" />{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${tx - 5} ${12 + i * 10} L${tx + 5} ${22 + i * 10}`} stroke="#B9C3CF" strokeWidth="1" />)}</g>)}
      <rect x="45" y="6" width="230" height="8" fill="none" stroke="#B9C3CF" strokeWidth="2" />
      {/* 조명 (빛줄기) */}
      {[90, 140, 180, 230].map((lx, i) => { const a = Math.sin(t * 1.4 + i) * 18; return <g key={lx}><path d={`M${lx} 14 L${lx - 20 + a} 150 H${lx + 20 + a}Z`} fill={lights[i]} opacity="0.16" /><rect x={lx - 5} y="12" width="10" height="7" rx="1.5" fill="#3A3434" stroke={INK} strokeWidth="1" /></g> })}
      {/* 스피커 */}
      {[30, 290].map((sx) => <g key={sx} transform={`translate(${sx} 104)`}><rect x="-14" y="-34" width="28" height="34" rx="2" fill="#2A2A30" stroke={INK} strokeWidth="1.6" /><circle cy="-22" r="7" fill="#3A3A44" stroke="#8A95A3" strokeWidth="1.4" /><circle cy="-22" r={2.6 + Math.max(0, Math.sin(t * 16)) * 0.8} fill="#8A95A3" /><circle cy="-6" r="3.6" fill="#3A3A44" stroke="#8A95A3" strokeWidth="1" /></g>)}
      {/* 무대 바닥 */}
      <rect x="40" y="104" width="240" height="16" fill="#3A3434" stroke={INK} strokeWidth="2" />
      <path d="M40 108 H280" stroke="#F2C230" strokeWidth="1.4" />
      {/* 잔디 관객석 */}
      <rect y="120" width={W} height={H - 120} fill="#2E3A2E" />
      <path d={`M0 120 H${W}`} stroke={INK} strokeWidth="2" />
    </g>
  )
}

/** 수학여행지: 먼 산·소나무·3층 석탑·돌담·자갈길 */
export function TripSite({ cam = 0 }: { cam?: number }) {
  const o = -cam
  return (
    <g>
      <defs><linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9AD4F2" /><stop offset="1" stopColor="#E8F6FB" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#tr-sky)" />
      <path d={`M${o * 0.2 - 20} 100 Q${o * 0.2 + 40} 50 ${o * 0.2 + 100} 90 Q${o * 0.2 + 160} 40 ${o * 0.2 + 240} 86 Q${o * 0.2 + 300} 56 ${o * 0.2 + 380} 96 V120 H-20Z`} fill="#A7C8B0" stroke="rgba(42,33,24,0.3)" strokeWidth="1.4" />
      <path d="M150 26 q6 -8 14 -4 q6 -7 14 0 q8 0 6 6 H150Z M40 36 q4 -6 10 -3 q4 -5 10 0 q6 0 4 4 H40Z" fill="#fff" />
      <g transform={`translate(${o * 0.6} 0)`}>
        <Pagoda x={200} y={124} s={0.92} />
        {/* 소나무 */}
        {[[60, 124, 1], [300, 124, 0.9], [120, 124, 0.7]].map(([px, py, s], i) => <g key={i} transform={`translate(${px} ${py}) scale(${s})`}><path d="M0 0 Q-4 -30 2 -60" stroke="#7A5232" strokeWidth="5" fill="none" /><path d="M0 0 Q-4 -30 2 -60" stroke={INK} strokeWidth="1" fill="none" />{[[-14, -40, 18], [10, -52, 16], [-6, -64, 14], [12, -34, 14]].map(([a, b, w], j) => <ellipse key={j} cx={a} cy={b} rx={w} ry="5" fill="#3E7A4A" stroke={INK} strokeWidth="1.2" />)}</g>)}
      </g>
      {/* 돌담 */}
      <rect y="112" width={W} height="12" fill="#C9C2B4" />
      {Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx={((i * 16 + o * 0.9) % 340 + 340) % 340 - 10} cy={117 + (i % 2) * 3} rx="8" ry="4" fill="#D6CFC0" stroke={INK} strokeWidth="0.8" />)}
      <path d={`M0 124 H${W}`} stroke={INK} strokeWidth="1.6" />
      <rect y="124" width={W} height={H - 124} fill="#E3D6B8" />
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={((i * 29 + o) % 340 + 340) % 340 - 10} cy={130 + (i * 7) % 40} r={1 + (i % 3) * 0.5} fill="#B8A882" />)}
    </g>
  )
}
