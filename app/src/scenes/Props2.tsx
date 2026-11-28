// 장면 소품 더: 강아지·마이크·지갑·양동이·깃발·체온계·휴대폰·소파·탬버린
import { INK } from './kit'
import { shade } from '../art/Character'

/** 강아지 (옆, 오른쪽을 봄). t = 시간(다리·꼬리), walk = 걷는 중, jump = 0~1 뛰어오름 */
export function Dog({ x, y, t, walk = true, jump = 0, color = '#E8B27A', sniff = false, flip }: { x: number; y: number; t: number; walk?: boolean; jump?: number; color?: string; sniff?: boolean; flip?: boolean }) {
  const sw = walk ? Math.sin(t * 16) * 22 : 0
  const leg = (lx: number, a: number) => (
    <g transform={`translate(${lx} -12) rotate(${a})`}>
      <path d="M0 0 V11" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M0 0 V11" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </g>
  )
  const tail = Math.sin(t * 22) * 25
  const up = jump * 14
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cy="1" rx="16" ry="3" fill="rgba(42,33,24,0.16)" />
      <g transform={`translate(0 ${-up}) rotate(${-jump * 35} 0 -12)`}>
        {leg(-9, -sw * 0.8)}{leg(8, sw * 0.8)}
        <g transform={`translate(-14 -18) rotate(${-40 + tail})`}>
          <path d="M0 0 Q-3 -9 2 -12" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M0 0 Q-3 -9 2 -12" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
        <rect x="-16" y="-24" width="30" height="14" rx="7" fill={color} stroke={INK} strokeWidth="2" />
        {leg(-6, sw)}{leg(11, -sw)}
        <g transform={`translate(13 -24) rotate(${sniff ? 30 + Math.sin(t * 20) * 4 : 0})`}>
          <circle r="9" fill={color} stroke={INK} strokeWidth="2" />
          <path d="M-4 -6 Q-9 -2 -6 6 Q-2 2 -1 -5Z" fill={shade(color, -0.3)} stroke={INK} strokeWidth="1.6" />
          <ellipse cx="8" cy="3" rx="4.5" ry="3.2" fill={shade(color, 0.35)} stroke={INK} strokeWidth="1.4" />
          <circle cx="11.5" cy="1.6" r="1.8" fill={INK} />
          <circle cx="4" cy="-2" r="1.6" fill={INK} />
        </g>
        <path d="M5 -23 l2 8" stroke="#E0533F" strokeWidth="3" />
      </g>
    </g>
  )
}

/** 마이크 (손에 쥐는 소품) */
export function Mic() {
  return (
    <g>
      <rect x="-2.5" y="-6" width="5" height="12" rx="2" fill="#3A3434" stroke={INK} strokeWidth="1.4" />
      <circle cy="-9" r="5" fill="#B7B2AA" stroke={INK} strokeWidth="1.6" />
      <path d="M-3 -10 h6 M-3 -8 h6" stroke={INK} strokeWidth="0.8" />
    </g>
  )
}

/** 탬버린 (손에 쥐는 소품) */
export function Tambourine({ t }: { t: number }) {
  // 탬버린: 빨간 테두리 + 가죽 + 은색 방울 5쌍 (흔들면 방울이 떨림)
  const j = Math.sin(t * 40) * 1.4
  return (
    <g transform={`rotate(${Math.sin(t * 20) * 18}) translate(0 -14)`}>
      <circle r="14" fill="#FFF1DA" stroke="#C2452D" strokeWidth="5" />
      <circle r="16.5" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle r="11.5" fill="none" stroke={INK} strokeWidth="1.1" />
      {[0, 1, 2, 3, 4].map((i) => { const a = i * 1.257 + 0.3; return <g key={i} transform={`translate(${Math.cos(a) * 14 + j * 0.3} ${Math.sin(a) * 14 + j})`}><ellipse rx="3.2" ry="2.2" fill="#E8E4DC" stroke={INK} strokeWidth="1" /><ellipse cx="0.8" cy="-0.8" rx="1.4" ry="0.8" fill="#fff" /></g> })}
    </g>
  )
}

/** 지갑 */
export function Wallet({ x = 0, y = 0, rot = 0 }: { x?: number; y?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-8" y="-6" width="16" height="11" rx="2.5" fill="#8A5A34" stroke={INK} strokeWidth="1.8" />
      <path d="M-8 -2 H8" stroke={INK} strokeWidth="1.2" />
      <rect x="3" y="-3" width="5" height="4" rx="1.5" fill="#C9A27A" stroke={INK} strokeWidth="1.1" />
    </g>
  )
}

/** 용돈 봉투 (아이) */
export function Pouch({ x = 0, y = 0, rot = 0 }: { x?: number; y?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-9 -7 H9 V6 H-9Z" fill="#F2A3C0" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-9 -7 L0 0 L9 -7" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cy="0" r="2.2" fill="#FFD23F" stroke={INK} strokeWidth="1" />
    </g>
  )
}

/** 양동이. level = 물 0~1 */
export function Bucket({ x, y, level = 0 }: { x: number; y: number; level?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="1" rx="14" ry="3" fill="rgba(42,33,24,0.16)" />
      <path d="M-13 -20 Q0 -36 13 -20" fill="none" stroke={INK} strokeWidth="1.8" />
      <path d="M-14 -20 L-11 0 H11 L14 -20Z" fill="#5E8FC9" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cy="-20" rx="14" ry="3.2" fill={level > 0.05 ? '#8FD3F4' : '#3E5F9A'} stroke={INK} strokeWidth="2" />
    </g>
  )
}

/** 손에 든 양동이 (손 위치 기준 아래로 매달림) */
export function BucketHeld() {
  return (
    <g transform="translate(0 2)">
      <path d="M-9 4 Q0 -6 9 4" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M-10 4 L-8 18 H8 L10 4Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cy="4" rx="10" ry="2.4" fill="#3E5F9A" stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 깃발 */
export function Flag({ x, y, t, color = '#E0533F' }: { x: number; y: number; t: number; color?: string }) {
  const w = Math.sin(t * 6) * 3
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 V-40" stroke={INK} strokeWidth="2.6" />
      <path d={`M1 -40 Q10 ${-42 + w} 20 -36 Q10 ${-32 - w} 1 -30Z`} fill={color} stroke={INK} strokeWidth="1.8" />
    </g>
  )
}

/** 체온계 (손에 쥐고 입으로) */
export function Thermo() {
  return <g transform="rotate(-60)"><rect x="-1.6" y="-16" width="3.2" height="16" rx="1.6" fill="#fff" stroke={INK} strokeWidth="1.2" /><circle cy="-16" r="2.2" fill="#E0533F" stroke={INK} strokeWidth="1.1" /></g>
}

/** 휴지 (손에 쥐고 코에) */
export function Tissue() {
  return <path d="M-6 -10 Q0 -14 6 -10 L5 2 Q0 4 -5 2Z" fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
}

/** 휴대폰 (손에 쥔 아래 끝이 0,0). 귀에 대면 얼굴 반쯤 크기 (11-28 사용자: 작으면 통화하는 것 같지 않음) */
export function Phone({ lit = true }: { lit?: boolean }) {
  return (
    <g>
      <rect x="-6.5" y="-25" width="13" height="25" rx="3" fill="#2E2A2C" stroke={INK} strokeWidth="1.5" />
      <rect x="-5" y="-22" width="10" height="19" rx="1.4" fill={lit ? '#BFE6F7' : '#3E4A56'} />
      {lit && <><circle cx="0" cy="-15" r="3" fill="#7FCB8A" /><path d="M-1.6 -16 q0.4 2.4 3 3.2" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" /><path d="M-3 -8 h6 M-2 -6 h4" stroke="#7A98B0" strokeWidth="0.9" /></>}
      <path d="M-1.8 -23.6 h3.6" stroke="#5A5658" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="0" cy="-1.6" r="0.9" fill="#5A5658" />
      <path d="M-4.2 -21 L-2 -21" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
      <path d="M6.6 -19 v4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

/** 소파 (옆) — 왼쪽이 등받이 */
export function Sofa({ x, y, w = 90, color = '#C9694F' }: { x: number; y: number; w?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="1" rx={w / 2 + 4} ry="4" fill="rgba(42,33,24,0.16)" />
      {/* 받침 (진한 색) → 방석 두 개 (솔기·빛) → 앞 테두리 바느질 → 가는 나무 다리 */}
      <rect x={-w / 2} y="-22" width={w} height="14" rx="5" fill={shade(color, -0.18)} stroke={INK} strokeWidth="2.2" />
      <path d={`M${-w / 2 + 4} -12 H${w / 2 - 4}`} stroke={shade(color, -0.32)} strokeWidth="1" strokeDasharray="2 2" />
      {[0, 1].map((k) => <g key={k}><rect x={-w / 2 + 2 + k * (w / 2 - 2)} y="-31" width={w / 2 - 2} height="11" rx="5" fill={color} stroke={INK} strokeWidth="1.8" /><path d={`M${-w / 2 + 8 + k * (w / 2 - 2)} -28 H${-w / 2 + 22 + k * (w / 2 - 2)}`} stroke={shade(color, 0.35)} strokeWidth="1.6" strokeLinecap="round" /></g>)}
      {[-w / 2 + 6, w / 2 - 10].map((lx) => <path key={lx} d={`M${lx} -8 L${lx + 1} 0 H${lx + 4} L${lx + 5} -8Z`} fill="#7A5232" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />)}
    </g>
  )
}
export function SofaBack({ x, y, w = 90, color = '#C9694F' }: { x: number; y: number; w?: number; color?: string }) {
  return (
    <g>
      <rect x={x - w / 2 - 6} y={y - 62} width="16" height="42" rx="7" fill={shade(color, -0.12)} stroke={INK} strokeWidth="2.2" />
      <path d={`M${x - w / 2 - 1} ${y - 56} V${y - 28}`} stroke={shade(color, 0.25)} strokeWidth="1.6" strokeLinecap="round" />
      {[y - 50, y - 40, y - 30].map((by) => <circle key={by} cx={x - w / 2 + 3} cy={by} r="1.1" fill={shade(color, -0.35)} />)}
    </g>
  )
}

/** 작은 옆 탁자: (x, y) = 바닥 가운데. 윗판 · 서랍(손잡이) · 다리 · 아래 선반의 책 */
export function SideTable({ x, y, w = 26, h = 30, color = '#C98B55' }: { x: number; y: number; w?: number; h?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {[-w / 2 + 2, w / 2 - 5].map((lx) => <path key={lx} d={`M${lx} ${-h + 4} H${lx + 3} L${lx + 2.6} 0 H${lx + 0.4}Z`} fill={shade(color, -0.25)} stroke={INK} strokeWidth="1.3" />)}
      <rect x={-w / 2 + 3} y={-9} width={w - 6} height="2.6" fill={shade(color, -0.15)} stroke={INK} strokeWidth="1" />
      <rect x={-w / 2 + 5} y={-15} width="6" height="6" fill="#5E8FC9" stroke={INK} strokeWidth="0.8" /><rect x={-w / 2 + 11} y={-14} width="5" height="5" fill="#E0533F" stroke={INK} strokeWidth="0.8" />
      <rect x={-w / 2 + 1} y={-h + 3} width={w - 2} height="11" fill={color} stroke={INK} strokeWidth="1.5" />
      <path d={`M-3 ${-h + 8.5} h6`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x={-w / 2 - 2} y={-h} width={w + 4} height="4" rx="1.5" fill={shade(color, 0.12)} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 옆에서 본 소파 (한 사람이 앉음): 등받이(단추·쿠션) · 먼 쪽 팔걸이(둥근 끝) · 방석 · 받침 · 다리. (x, y) = 바닥 가운데, 앉는 면 높이 약 30 */
export function SideSofa({ x, y, color = '#C9694F', pillow = '#F2C230' }: { x: number; y: number; color?: string; pillow?: string }) {
  const dk = shade(color, -0.18), lt = shade(color, 0.3)
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <ellipse cy="1" rx="36" ry="4" fill="rgba(42,33,24,0.16)" />
      {/* 먼 쪽 팔걸이 (앞 끝이 둥글게 말림) */}
      <path d="M-26 -20 V-40 Q-26 -44 -22 -44 H22 Q32 -44 32 -35 Q32 -27 24 -26 V-20Z" fill={dk} stroke={INK} strokeWidth="2" />
      <circle cx="26" cy="-36" r="4.4" fill={shade(color, -0.08)} stroke={INK} strokeWidth="1.4" /><path d="M26 -38 q2 1 0 3" stroke={INK} strokeWidth="0.9" fill="none" />
      {/* 등받이 (단추 · 빛) */}
      <rect x="-34" y="-74" width="18" height="58" rx="8" fill={color} stroke={INK} strokeWidth="2.2" />
      <path d="M-29 -66 V-30" stroke={lt} strokeWidth="1.8" strokeLinecap="round" />
      {[-60, -48, -36].map((by) => <circle key={by} cx="-24" cy={by} r="1.2" fill={dk} />)}
      {/* 기대 놓은 쿠션 */}
      <rect x="-18" y="-50" width="13" height="16" rx="4" fill={pillow} stroke={INK} strokeWidth="1.4" transform="rotate(-12 -12 -42)" />
      <path d="M-14 -46 l6 6" stroke={shade(pillow, -0.2)} strokeWidth="0.9" transform="rotate(-12 -12 -42)" />
      {/* 받침 · 방석 */}
      <rect x="-30" y="-22" width="62" height="14" rx="5" fill={dk} stroke={INK} strokeWidth="2.2" />
      <path d="M-26 -12 H28" stroke={shade(color, -0.32)} strokeWidth="1" strokeDasharray="2 2" />
      <rect x="-18" y="-32" width="48" height="12" rx="5" fill={color} stroke={INK} strokeWidth="2" />
      <path d="M-12 -29 H8" stroke={lt} strokeWidth="1.6" strokeLinecap="round" />
      {/* 다리 */}
      {[-24, 22].map((lx) => <path key={lx} d={`M${lx} -8 L${lx + 1} 0 H${lx + 4} L${lx + 5} -8Z`} fill="#7A5232" stroke={INK} strokeWidth="1.4" />)}
    </g>
  )
}
