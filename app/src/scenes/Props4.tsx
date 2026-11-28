// 소품 4 (11-28 장면 20개 추가용). 기준: 사각형·원으로 대충 두지 않고 진짜 물건처럼 (16-scenes.md '장면 만들기 기준')
import { INK } from './kit'

/** 2단 생크림 케이크 (받침 접시·크림 물결·딸기·초·이름표). (x, y) = 받침 바닥 가운데 */
export function Cake({ x, y, t = 0, candles = 5, lit = true, label = '축 칠순', s = 1 }: { x: number; y: number; t?: number; candles?: number; lit?: boolean; label?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      {/* 받침 접시 (다리 있는 케이크 스탠드) */}
      <path d="M-8 0 H8 L5 -6 H-5Z" fill="#E8E2D8" stroke={INK} strokeWidth="1.4" />
      <ellipse cy="-7" rx="34" ry="4" fill="#F4F0EA" stroke={INK} strokeWidth="1.6" />
      {/* 아래 단 */}
      <path d="M-28 -9 V-30 Q0 -34 28 -30 V-9 Q0 -6 -28 -9Z" fill="#FFF6EC" stroke={INK} strokeWidth="1.8" />
      <path d="M-28 -24 Q-24 -19 -20 -24 Q-16 -19 -12 -24 Q-8 -19 -4 -24 Q0 -19 4 -24 Q8 -19 12 -24 Q16 -19 20 -24 Q24 -19 28 -24" fill="none" stroke="#F3A3C0" strokeWidth="2.2" />
      {[-22, -11, 0, 11, 22].map((k) => <circle key={k} cx={k} cy="-13" r="1.4" fill="#F3A3C0" />)}
      {/* 위 단 */}
      <path d="M-18 -31 V-46 Q0 -49 18 -46 V-31 Q0 -29 -18 -31Z" fill="#FFF6EC" stroke={INK} strokeWidth="1.8" />
      <path d="M-18 -42 q3 4 6 0 q3 4 6 0 q3 4 6 0 q3 4 6 0 q3 4 6 0 q3 4 6 0" fill="none" stroke="#F3A3C0" strokeWidth="2" />
      {/* 크림 꽃 · 딸기 */}
      {[-14, -5, 5, 14].map((k) => <g key={k} transform={`translate(${k} -47)`}><path d="M-3 0 Q-3 -4 0 -4 Q3 -4 3 0Z" fill="#fff" stroke={INK} strokeWidth="1" /><path d="M-2.4 -3.4 Q0 -7.6 2.4 -3.4" fill="#E0533F" stroke={INK} strokeWidth="0.9" /><path d="M-1 -6.6 l1 -1.4 l1 1.4" stroke="#4E8A3A" strokeWidth="0.9" fill="none" /></g>)}
      {/* 이름표 (초콜릿 판) */}
      {label && <g transform="translate(0 -20)"><rect x="-15" y="-5" width="30" height="9" rx="2" fill="#7A4A2A" stroke={INK} strokeWidth="1" /><text y="2" textAnchor="middle" fontSize="6" fill="#FFF3C0">{label}</text></g>}
      {/* 초 (줄무늬) + 불꽃 */}
      {Array.from({ length: candles }, (_, i) => {
        const cx = (i - (candles - 1) / 2) * 6
        return (
          <g key={i} transform={`translate(${cx} -49)`}>
            <rect x="-1.3" y="-11" width="2.6" height="11" fill="#fff" stroke={INK} strokeWidth="0.8" />
            <path d="M-1.3 -8 L1.3 -10 M-1.3 -4 L1.3 -6" stroke="#E0533F" strokeWidth="0.9" />
            {lit && <g transform={`translate(0 -13) scale(${1 + 0.15 * Math.sin(t * 18 + i)} ${1 + 0.2 * Math.sin(t * 14 + i * 2)})`}><path d="M0 -5 Q3 -1 0 2 Q-3 -1 0 -5Z" fill="#FFB547" stroke="#E0833F" strokeWidth="0.6" /><path d="M0 -2 Q1.2 0 0 1.4 Q-1.2 0 0 -2Z" fill="#FFF3A6" /></g>}
            {!lit && <path d="M0 -12 q-2 -4 1 -7 q3 -3 0 -7" stroke="#B8B2AA" strokeWidth="1" fill="none" opacity="0.7" />}
          </g>
        )
      })}
    </g>
  )
}

/** 과일 탑 (잔칫상: 사과·배를 높이 쌓은 굽 접시). (x, y) = 굽 바닥 */
export function FruitTower({ x, y, c = '#E0533F', s = 1 }: { x: number; y: number; c?: string; s?: number }) {
  const rows = [5, 4, 3, 2, 1]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-7 0 H7 L5 -5 H-5Z" fill="#B5452F" stroke={INK} strokeWidth="1.2" />
      <rect x="-16" y="-8" width="32" height="4" rx="1.5" fill="#C9553B" stroke={INK} strokeWidth="1.2" />
      {rows.map((n, r) => Array.from({ length: n }, (_, i) => {
        const fx = (i - (n - 1) / 2) * 6.2, fy = -12 - r * 5.4
        return <g key={`${r}-${i}`}><circle cx={fx} cy={fy} r="3.4" fill={(r + i) % 3 === 0 ? '#F2D27A' : c} stroke={INK} strokeWidth="0.9" /><circle cx={fx - 1} cy={fy - 1.2} r="0.9" fill="#fff" opacity="0.6" /></g>
      }))}
      <path d="M0 -42 v-3 M0 -44 q3 -2 4 0" stroke="#4E8A3A" strokeWidth="1" fill="none" />
    </g>
  )
}

/** 상차림 큰 상 (옆에서 본 낮은 교자상 + 상보). (x, y) = 바닥 가운데, w = 너비 */
export function LowTable({ x, y, w = 150, h = 26, cloth = '#FFFFFF' }: { x: number; y: number; w?: number; h?: number; cloth?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {[-w / 2 + 10, w / 2 - 16].map((lx) => <path key={lx} d={`M${lx} ${-h + 6} V0 H${lx + 6} V${-h + 6}`} fill="#8A5A34" stroke={INK} strokeWidth="1.6" />)}
      <rect x={-w / 2} y={-h} width={w} height="7" rx="2" fill="#A86B3C" stroke={INK} strokeWidth="1.8" />
      <path d={`M${-w / 2 - 2} ${-h} H${w / 2 + 2} V${-h + 12} Q${w / 4} ${-h + 16} 0 ${-h + 12} Q${-w / 4} ${-h + 16} ${-w / 2 - 2} ${-h + 12}Z`} fill={cloth} stroke={INK} strokeWidth="1.4" />
      {Array.from({ length: Math.floor(w / 16) }, (_, i) => <circle key={i} cx={-w / 2 + 8 + i * 16} cy={-h + 9} r="1.6" fill="#E0533F" opacity="0.6" />)}
    </g>
  )
}

/** 용돈 봉투 (흰 봉투 + 빨간 띠 + 글씨). 손에 들게 원점 = 봉투 아래 가운데 */
export function Envelope({ text = '용돈', open = 0 }: { text?: string; open?: number }) {
  return (
    <g strokeLinejoin="round">
      {open > 0 && <g transform={`translate(0 ${-14 - 8 * open})`}>{[-3, 0, 3].map((k, i) => <rect key={i} x={-8 + k} y="-4" width="12" height="8" rx="1" fill="#9BD39B" stroke={INK} strokeWidth="0.8" transform={`rotate(${k * 3})`} />)}</g>}
      <rect x="-10" y="-16" width="20" height="16" rx="1.5" fill="#FFFFFF" stroke={INK} strokeWidth="1.5" />
      <path d="M-10 -16 L0 -9 L10 -16" fill="none" stroke={INK} strokeWidth="1" />
      <rect x="-10" y="-7" width="20" height="3.4" fill="#E0533F" />
      <text y="-1.2" textAnchor="middle" fontSize="4.6" fill={INK}>{text}</text>
    </g>
  )
}

/** 노트북 (옆에서 본 모습: 바닥 + 열린 화면 뒷면). (x, y) = 바닥 가운데. 화면은 사람 쪽(왼쪽)을 봄 */
export function LaptopSide({ x, y, glow = 0 }: { x: number; y: number; glow?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {glow > 0 && <path d="M8 -26 L-30 -6 L-30 2 L4 0Z" fill="#CFE7F5" opacity={0.35 * glow} />}
      <rect x="-16" y="-3" width="32" height="3" rx="1" fill="#B9C3CF" stroke={INK} strokeWidth="1.3" />
      <path d="M12 -3 L18 -26 L20.5 -25.5 L14.5 -3Z" fill="#8A95A3" stroke={INK} strokeWidth="1.3" />
      <circle cx="17" cy="-16" r="1.2" fill="#fff" opacity="0.8" />
    </g>
  )
}

/** 큰 화면 확대 (사람이 보는 화면을 말풍선처럼 옆에 크게): 합격 발표 등. (x, y) = 가운데 */
export function ScreenZoom({ x, y, k = 1, title, big, color = '#2E6FD8', sub }: { x: number; y: number; k?: number; title: string; big: string; color?: string; sub?: string }) {
  if (k <= 0) return null
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x="-46" y="-34" width="92" height="62" rx="5" fill="#3A4250" stroke={INK} strokeWidth="2" />
      <rect x="-42" y="-30" width="84" height="50" rx="2" fill="#FFFFFF" />
      <rect x="-42" y="-30" width="84" height="9" fill={color} />
      <circle cx="-38" cy="-25.5" r="1.4" fill="#fff" /><circle cx="-34" cy="-25.5" r="1.4" fill="#fff" opacity="0.7" />
      <text y="-23" textAnchor="middle" fontSize="6" fill="#fff">{title}</text>
      <text y="2" textAnchor="middle" fontSize="15" fill={color}>{big}</text>
      {sub && <text y="14" textAnchor="middle" fontSize="6.4" fill="#5A5A6A">{sub}</text>}
      <path d="M-8 28 L-12 36 H12 L8 28Z" fill="#3A4250" stroke={INK} strokeWidth="1.4" />
    </g>
  )
}

/** 공부 책상 (옆에서: 상판·서랍·다리) + 스탠드. (x, y) = 바닥 가운데 */
export function Desk({ x, y, w = 70, h = 40, lamp = true, lampOn = false }: { x: number; y: number; w?: number; h?: number; lamp?: boolean; lampOn?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <rect x={-w / 2 + 3} y={-h + 4} width="5" height={h - 4} fill="#8A5A34" stroke={INK} strokeWidth="1.4" />
      <rect x={w / 2 - 26} y={-h + 4} width="22" height={h - 4} rx="1" fill="#B07A48" stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => <g key={i}><rect x={w / 2 - 24} y={-h + 7 + i * 12} width="18" height="10" rx="1" fill="#C98B55" stroke={INK} strokeWidth="1" /><rect x={w / 2 - 17} y={-h + 11 + i * 12} width="4" height="1.6" rx="0.8" fill={INK} /></g>)}
      <rect x={-w / 2} y={-h} width={w} height="5" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.8" />
      {lamp && <g transform={`translate(${w / 2 - 10} ${-h})`}>
        {lampOn && <path d="M-6 -30 L-34 0 H4Z" fill="#FFF3A6" opacity="0.35" />}
        <ellipse cy="-1" rx="6" ry="1.8" fill="#3A4250" stroke={INK} strokeWidth="1.2" />
        <path d="M0 -2 L-4 -20 L-10 -26" stroke={INK} strokeWidth="2.6" fill="none" /><path d="M0 -2 L-4 -20 L-10 -26" stroke="#5E8FC9" strokeWidth="1.4" fill="none" />
        <path d="M-6 -32 L-16 -22 L-6 -18Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.3" />
        {lampOn && <circle cx="-11" cy="-21" r="2" fill="#FFF3A6" />}
      </g>}
    </g>
  )
}

/** 의자 (옆에서: 등받이·좌판·다리, 사람 엉덩이 높이 h). (x, y) = 바닥, 등받이는 왼쪽(사람이 오른쪽 봄) */
export function SideChair({ x, y, h = 28, color = '#C98B55', back = 'left' }: { x: number; y: number; h?: number; color?: string; back?: 'left' | 'right' }) {
  const d = back === 'left' ? 1 : -1
  return (
    <g transform={`translate(${x} ${y}) scale(${d} 1)`} strokeLinejoin="round">
      <path d={`M-12 ${-h} L-14 0 M12 ${-h} L13 0`} stroke={INK} strokeWidth="4" /><path d={`M-12 ${-h} L-14 0 M12 ${-h} L13 0`} stroke="#8A5A34" strokeWidth="2.2" />
      <path d={`M-13 ${-h} L-15 ${-h - 30}`} stroke={INK} strokeWidth="4.4" /><path d={`M-13 ${-h} L-15 ${-h - 30}`} stroke="#8A5A34" strokeWidth="2.6" />
      <rect x="-19" y={-h - 32} width="8" height="20" rx="3" fill={color} stroke={INK} strokeWidth="1.5" transform={`rotate(-4 -15 ${-h - 22})`} />
      <rect x="-15" y={-h - 4} width="30" height="5" rx="2" fill={color} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 스마트폰 상자 (흰 상자 + 뚜껑 + 폰 그림). open: 0 닫힘 → 1 뚜껑 열림. 원점 = 상자 아래 가운데 */
export function PhoneBox({ open = 0 }: { open?: number }) {
  return (
    <g strokeLinejoin="round">
      <rect x="-10" y="-8" width="20" height="8" rx="1" fill="#F4F4F6" stroke={INK} strokeWidth="1.4" />
      {open > 0.3 && <g><rect x="-6" y="-11" width="12" height="7" rx="1.4" fill="#2A3A5A" stroke={INK} strokeWidth="1" /><rect x="-5" y="-10.2" width="10" height="5.4" rx="1" fill="#8FC3F0" /></g>}
      <g transform={`translate(-10 ${-8 - open * 2}) rotate(${-open * 120})`}>
        <rect x="0" y="-5" width="20" height="5" rx="1" fill="#FFFFFF" stroke={INK} strokeWidth="1.4" />
        <rect x="7" y="-4" width="6" height="3" rx="0.8" fill="#C9CED6" />
      </g>
    </g>
  )
}

/** 편지 (분홍 봉투 + 하트 스티커). 원점 = 아래 가운데 */
export function LoveLetter({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round">
      <rect x="-11" y="-14" width="22" height="14" rx="1.5" fill="#FDE3EC" stroke={INK} strokeWidth="1.4" />
      <path d="M-11 -14 L0 -6 L11 -14" fill="none" stroke={INK} strokeWidth="1.1" />
      <path d="M0 -8.6 a1.8 1.8 0 0 1 3.2 -1 a1.8 1.8 0 0 1 0.6 2.6 L0 -3.6 L-3.8 -7 a1.8 1.8 0 0 1 0.6 -2.6 a1.8 1.8 0 0 1 3.2 1Z" fill="#E0533F" stroke={INK} strokeWidth="0.6" transform="translate(0 -1.4)" />
    </g>
  )
}

/** 사진 한 장 (흰 테두리 + 안에 작은 그림). kind: 'kids' 아이들, 'couple' 둘, 'school' 교복 단체, 'sea' 바다 */
export function Photo({ w = 18, h = 14, kind = 'couple', rot = 0, old = false }: { w?: number; h?: number; kind?: 'kids' | 'couple' | 'school' | 'sea'; rot?: number; old?: boolean }) {
  const bg = old ? '#E9D8B4' : '#BFE4F7'
  const faces = kind === 'couple' ? [-3, 3] : kind === 'kids' ? [-4, 0, 4] : kind === 'school' ? [-5, -2, 1, 4, 7] : []
  return (
    <g transform={`rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="0.8" fill="#FFFDF7" stroke={INK} strokeWidth="1" />
      <rect x={-w / 2 + 1.5} y={-h / 2 + 1.5} width={w - 3} height={h - 5} fill={bg} />
      {kind === 'sea' && <g><path d={`M${-w / 2 + 1.5} ${-h / 2 + 7} H${w / 2 - 1.5} V${h / 2 - 3.5} H${-w / 2 + 1.5}Z`} fill={old ? '#B9A27A' : '#5E8FC9'} /><circle cx={w / 2 - 5} cy={-h / 2 + 4} r="1.6" fill="#FFD23F" /></g>}
      {faces.map((fx, i) => <g key={i} transform={`translate(${fx - (kind === 'school' ? 1 : 0)} ${h / 2 - 5})`}><path d="M-1.8 0 Q-1.8 -3 0 -3 Q1.8 -3 1.8 0Z" fill={['#E0533F', '#5E8FC9', '#F2C230', '#7FBF6A', '#C77FD0'][i % 5]} /><circle cy="-4.4" r="1.5" fill="#F4D9A8" stroke={INK} strokeWidth="0.4" /><path d="M-1.5 -5 Q0 -6.6 1.5 -5" fill="#3A2A1A" /></g>)}
      {old && <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#C9A26A" opacity="0.18" />}
    </g>
  )
}

/** 펼친 앨범 (두 쪽 + 사진 칸). (x, y) = 아래 가운데. 옆에서 비스듬히 본 모양 */
export function Album({ x, y, k = 1, s = 1 }: { x: number; y: number; k?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <path d="M-30 0 L-28 -4 H28 L30 0Z" fill="#7A4A2A" stroke={INK} strokeWidth="1.4" />
      <path d="M0 -4 L-28 -4 L-26 -12 Q-13 -15 0 -12Z" fill="#FFF8EC" stroke={INK} strokeWidth="1.3" />
      <path d="M0 -4 L28 -4 L26 -12 Q13 -15 0 -12Z" fill="#FFF8EC" stroke={INK} strokeWidth="1.3" />
      {k > 0.2 && <g><rect x="-22" y="-12" width="8" height="5" fill="#E9D8B4" stroke={INK} strokeWidth="0.6" transform="skewX(-20)" /><rect x="-10" y="-12" width="7" height="5" fill="#BFE4F7" stroke={INK} strokeWidth="0.6" transform="skewX(-20)" /><rect x="6" y="-12" width="8" height="5" fill="#F7D3E2" stroke={INK} strokeWidth="0.6" transform="skewX(20)" /><rect x="16" y="-12" width="7" height="5" fill="#E9D8B4" stroke={INK} strokeWidth="0.6" transform="skewX(20)" /></g>}
      <path d="M0 -4 V-12" stroke={INK} strokeWidth="1" />
    </g>
  )
}

/** 원고지 묶음·책. 'stack' = 쌓인 원고, 'book' = 다 만든 책(표지 제목) */
export function Manuscript({ n = 6 }: { n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => <g key={i} transform={`translate(${(i % 2) * 0.8 - 0.4} ${-i * 1.6})`}><rect x="-12" y="-1.6" width="24" height="1.8" fill="#FFFDF7" stroke={INK} strokeWidth="0.6" /></g>)}
    </g>
  )
}
export function BookCover({ title = '나의 인생', color = '#2E4A7A' }: { title?: string; color?: string }) {
  return (
    <g strokeLinejoin="round">
      <rect x="-13" y="-34" width="26" height="34" rx="1.5" fill={color} stroke={INK} strokeWidth="1.6" />
      <rect x="-13" y="-34" width="4" height="34" fill="rgba(0,0,0,0.2)" />
      <rect x="-7" y="-28" width="17" height="8" rx="1" fill="#F7E8C6" stroke={INK} strokeWidth="0.8" />
      <text x="1.5" y="-22.6" textAnchor="middle" fontSize="4.2" fill={INK}>{title}</text>
      <path d="M-4 -12 q5.5 -6 11 0" stroke="#F2C230" strokeWidth="1.2" fill="none" /><circle cx="1.5" cy="-14" r="1.6" fill="#F2C230" />
    </g>
  )
}
/** 만년필 (손에 쥠: 원점 = 펜촉) */
export function Pen() {
  return <g transform="rotate(-35)"><path d="M0 0 L1.4 -4 H-1.4Z" fill="#C9B07A" stroke={INK} strokeWidth="0.6" /><rect x="-1.6" y="-16" width="3.2" height="12" rx="1.2" fill="#2A2A3A" stroke={INK} strokeWidth="0.7" /><path d="M1.6 -15 v6" stroke="#C9B07A" strokeWidth="0.8" /></g>
}

/** 커피잔 (받침 + 잔 + 위에서 보이는 라테 하트). 원점 = 받침 아래 */
export function LatteCup({ art = true, s = 1 }: { art?: boolean; s?: number }) {
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round">
      <ellipse cy="-1" rx="10" ry="2.4" fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
      <path d="M-7 -2 Q-7.6 -10 -7 -12 H7 Q7.6 -10 7 -2Z" fill="#FFFFFF" stroke={INK} strokeWidth="1.3" />
      <path d="M7 -10 q5 0 4 4 q-1 3 -4.4 2" fill="none" stroke={INK} strokeWidth="1.3" />
      <ellipse cy="-12" rx="7" ry="2" fill="#B07A48" stroke={INK} strokeWidth="1" />
      {art && <path d="M0 -11 Q-3 -12.6 -1.6 -13.4 Q-0.4 -13.8 0 -12.8 Q0.4 -13.8 1.6 -13.4 Q3 -12.6 0 -11Z" fill="#FFF6EC" />}
    </g>
  )
}

/** 커피 머신 (스테인리스 몸통·추출구·포터필터·스팀 막대·압력계·위에 컵). (x, y) = 바닥 가운데 */
export function EspressoMachine({ x, y, t = 0, pour = 0, steam = 0 }: { x: number; y: number; t?: number; pour?: number; steam?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <rect x="-30" y="-46" width="60" height="46" rx="4" fill="#C9CED6" stroke={INK} strokeWidth="2" />
      <rect x="-30" y="-46" width="60" height="10" rx="4" fill="#E0533F" stroke={INK} strokeWidth="1.6" />
      <text y="-38.6" textAnchor="middle" fontSize="6" fill="#fff">ESPRESSO</text>
      <path d="M-26 -30 V-4 M26 -30 V-4" stroke="#fff" strokeWidth="1.6" opacity="0.6" />
      {/* 압력계 */}
      <circle cx="-14" cy="-27" r="5" fill="#fff" stroke={INK} strokeWidth="1.3" /><path d={`M-14 -27 l${3 * Math.cos(t * 2)} ${-3 + Math.sin(t * 2)}`} stroke="#E0533F" strokeWidth="1" />
      {/* 추출구 + 포터필터 손잡이 */}
      <rect x="2" y="-30" width="14" height="6" rx="1.5" fill="#8A95A3" stroke={INK} strokeWidth="1.3" />
      <path d="M4 -24 H14 L12 -20 H6Z" fill="#5A5F68" stroke={INK} strokeWidth="1.2" />
      <path d="M14 -22 H30" stroke={INK} strokeWidth="4" strokeLinecap="round" /><path d="M14 -22 H30" stroke="#2A2A3A" strokeWidth="2.4" strokeLinecap="round" />
      {pour > 0 && <path d="M8 -20 V-9 M10 -20 V-9" stroke="#6A3E1E" strokeWidth="1.2" opacity={pour} />}
      {/* 받침 쇠망 */}
      <rect x="-4" y="-8" width="26" height="4" rx="1" fill="#8A95A3" stroke={INK} strokeWidth="1.2" />
      {[0, 5, 10, 15].map((k) => <path key={k} d={`M${k} -7.4 v2.8`} stroke={INK} strokeWidth="0.6" />)}
      {/* 스팀 막대 */}
      <path d="M-22 -30 L-26 -14" stroke={INK} strokeWidth="2.6" /><path d="M-22 -30 L-26 -14" stroke="#E8ECF0" strokeWidth="1.4" />
      {steam > 0 && [0, 1, 2].map((i) => { const q = (t * 1.6 + i / 3) % 1; return <path key={i} d={`M${-27 - q * 6} ${-12 - q * 18} q-3 -3 0 -6`} stroke="#fff" strokeWidth="1.6" fill="none" opacity={steam * (1 - q)} /> })}
      {/* 위에 데워 두는 컵 */}
      {[-18, -8, 2].map((cx) => <path key={cx} d={`M${cx} -46 l1 -5 h6 l1 5Z`} fill="#fff" stroke={INK} strokeWidth="1" />)}
    </g>
  )
}

/** 고기 불판 (둥근 불판 + 구멍 + 고기 + 마늘 + 연기 + 위 연통). (x, y) = 식탁 윗면 가운데 */
export function Grill({ x, y, t = 0, cook = 0, n = 5 }: { x: number; y: number; t?: number; cook?: number; n?: number }) {
  const meat = (k: number) => (k < 0.5 ? '#E8848A' : '#9A5A3A')
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {/* 연통 (천장에서 내려옴) */}
      <path d="M-4 -120 V-58 M4 -120 V-58" stroke={INK} strokeWidth="1.6" />
      <rect x="-4" y="-120" width="8" height="62" fill="#B9C3CF" />
      <path d="M-14 -46 L-6 -58 H6 L14 -46Z" fill="#C9CED6" stroke={INK} strokeWidth="1.6" />
      {/* 연기 */}
      {[0, 1, 2, 3].map((i) => { const q = (t * 0.8 + i / 4) % 1; return <path key={i} d={`M${-8 + i * 5} ${-6 - q * 34} q-3 -3 0 -6 q3 -3 0 -6`} stroke="#fff" strokeWidth="2" fill="none" opacity={0.7 * (1 - q)} /> })}
      {/* 숯 화로 + 불판 */}
      <path d="M-20 0 L-17 -6 H17 L20 0Z" fill="#5A4A42" stroke={INK} strokeWidth="1.4" />
      <ellipse cy="-6" rx="24" ry="5" fill="#3A3434" stroke={INK} strokeWidth="1.6" />
      {[-14, -7, 0, 7, 14].map((k) => <path key={k} d={`M${k} -9.4 V-2.6`} stroke="#6E6A66" strokeWidth="0.9" />)}
      <ellipse cy="-6" rx="24" ry="5" fill="none" stroke="#E0833F" strokeWidth="0.8" opacity={0.5 + 0.3 * Math.sin(t * 6)} />
      {/* 고기·마늘 */}
      {Array.from({ length: n }, (_, i) => {
        const mx = -15 + i * 7.4, k = Math.max(0, Math.min(1, cook - i * 0.08))
        return <g key={i} transform={`translate(${mx} -7.6) rotate(${-8 + (i % 2) * 12})`}><rect x="-3.4" y="-1.6" width="6.8" height="3.2" rx="1.4" fill={meat(k)} stroke={INK} strokeWidth="0.7" /><path d="M-2.4 -0.4 h4.8" stroke={k > 0.5 ? '#5A3420' : '#fff'} strokeWidth="0.6" /></g>
      })}
      {[-20, 19].map((gx) => <ellipse key={gx} cx={gx} cy="-7" rx="1.6" ry="1.1" fill="#F7EAD0" stroke={INK} strokeWidth="0.5" />)}
    </g>
  )
}
/** 집게 (손에 쥠). 원점 = 손 */
export function Tongs({ pinch = 0 }: { pinch?: number }) {
  return <g><path d={`M0 0 L${10 - pinch * 2} 16 M0 0 L${13 - pinch * 4} 15`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" /><path d={`M0 0 L${10 - pinch * 2} 16 M0 0 L${13 - pinch * 4} 15`} stroke="#C9CED6" strokeWidth="1" strokeLinecap="round" /></g>
}
/** 상추쌈 (손에 쥠) */
export function Wrap() {
  return <g><path d="M-6 0 Q-8 -8 0 -10 Q8 -8 6 0 Q0 3 -6 0Z" fill="#7FBF6A" stroke={INK} strokeWidth="1" /><path d="M-3 -5 Q0 -8 3 -5" stroke="#4E8A3A" strokeWidth="0.7" fill="none" /><rect x="-2.6" y="-4" width="5" height="2.2" rx="1" fill="#9A5A3A" /></g>
}

/** 응원봉 (손에 쥠, 불빛 색 c). 원점 = 손 */
export function LightStick({ c = '#F2708A', t = 0 }: { c?: string; t?: number }) {
  return (
    <g>
      <rect x="-1.6" y="-4" width="3.2" height="10" rx="1" fill="#3A3434" stroke={INK} strokeWidth="0.7" />
      <circle cy="-9" r={5.4 + 0.6 * Math.sin(t * 10)} fill={c} opacity="0.35" />
      <ellipse cy="-9" rx="3.4" ry="5" fill={c} stroke={INK} strokeWidth="0.8" />
      <ellipse cx="-1" cy="-10.6" rx="1" ry="1.8" fill="#fff" opacity="0.7" />
    </g>
  )
}

/** 방석 (옆에서). (x, y) = 바닥 가운데 */
export function Cushion({ x, y, c = '#C2452D', w = 26 }: { x: number; y: number; c?: string; w?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2} 0 Q${-w / 2} -5 ${-w / 2 + 3} -5 H${w / 2 - 3} Q${w / 2} -5 ${w / 2} 0Z`} fill={c} stroke={INK} strokeWidth="1.4" />
      <path d={`M${-w / 2 + 4} -2.6 H${w / 2 - 4}`} stroke="#F2C230" strokeWidth="1" strokeDasharray="2 1.6" />
    </g>
  )
}

/** 찻잔 (손잡이 없는 녹차 잔 + 김). 원점 = 바닥 */
export function TeaCup({ t = 0, hot = true }: { t?: number; hot?: boolean }) {
  return (
    <g>
      {hot && [0, 1].map((i) => { const q = (t * 0.9 + i * 0.5) % 1; return <path key={i} d={`M${-1 + i * 2} ${-8 - q * 10} q-2 -2 0 -4`} stroke="#fff" strokeWidth="1.1" fill="none" opacity={0.8 * (1 - q)} /> })}
      <path d="M-4 0 L-5 -7 H5 L4 0Z" fill="#E8F0E0" stroke={INK} strokeWidth="1.1" />
      <ellipse cy="-7" rx="5" ry="1.2" fill="#9DBF6A" stroke={INK} strokeWidth="0.7" />
      <path d="M-4.4 -3.4 H4.4" stroke="#5E8FC9" strokeWidth="0.7" />
    </g>
  )
}
/** 감·떡 접시 (상 위). 원점 = 접시 아래 */
export function SnackPlate({ kind = 'persimmon' }: { kind?: 'persimmon' | 'ricecake' | 'chips' }) {
  return (
    <g>
      <ellipse cy="-1.4" rx="11" ry="2.6" fill="#FFFFFF" stroke={INK} strokeWidth="1.1" />
      {kind === 'persimmon' && [-5, 0, 5].map((k, i) => <g key={k} transform={`translate(${k} ${i === 1 ? -6.4 : -4})`}><circle r="3.2" fill="#F08A2A" stroke={INK} strokeWidth="0.8" /><path d="M-1.6 -2.8 l1.6 -0.8 l1.6 0.8" stroke="#4E8A3A" strokeWidth="1" fill="none" /></g>)}
      {kind === 'ricecake' && [-5, 0, 5].map((k, i) => <rect key={k} x={k - 3} y={i === 1 ? -8 : -5.6} width="6" height="3.2" rx="1.2" fill={['#F7D3E2', '#FFFFFF', '#B8D88A'][i]} stroke={INK} strokeWidth="0.7" />)}
      {kind === 'chips' && <g><path d="M-9 -2 Q0 -9 9 -2Z" fill="#F2C230" stroke={INK} strokeWidth="0.8" />{[-5, -1, 3, 6].map((k) => <path key={k} d={`M${k} -4 q1.6 -2 3 0`} stroke="#C99A20" strokeWidth="0.6" fill="none" />)}</g>}
    </g>
  )
}

/** 텔레비전 (받침장 위 납작한 화면). (x, y) = 받침장 바닥 가운데 */
export function TV({ x, y, t = 0, on = true, show = 'drama' }: { x: number; y: number; t?: number; on?: boolean; show?: 'drama' | 'sports' | 'off' }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <rect x="-30" y="-20" width="60" height="20" rx="2" fill="#B07A48" stroke={INK} strokeWidth="1.8" />
      <path d="M0 -18 V-2" stroke={INK} strokeWidth="1" /><circle cx="-4" cy="-10" r="1.2" fill={INK} /><circle cx="4" cy="-10" r="1.2" fill={INK} />
      <path d="M-6 -20 L-8 -24 H8 L6 -20Z" fill="#3A3434" stroke={INK} strokeWidth="1.2" />
      <rect x="-28" y="-60" width="56" height="36" rx="2.4" fill="#2A2A30" stroke={INK} strokeWidth="2" />
      <rect x="-25" y="-57" width="50" height="30" fill={on ? '#8FC3F0' : '#3A4250'} />
      {on && show === 'drama' && <g><path d="M-25 -36 H25 V-27 H-25Z" fill="#7FBF6A" /><circle cx={-10 + 2 * Math.sin(t * 2)} cy="-40" r="4" fill="#F4D9A8" stroke={INK} strokeWidth="0.6" /><path d={`M-14 -27 Q-10 -36 -6 -27`} fill="#E0533F" /><circle cx={10} cy="-40" r="4" fill="#F4D9A8" stroke={INK} strokeWidth="0.6" /><path d="M6 -27 Q10 -36 14 -27" fill="#5E8FC9" />{Math.sin(t * 3) > 0 && <path d="M0 -46 a2 2 0 0 1 3.4 -1 a2 2 0 0 1 0.6 2.6 L0 -41 L-4 -44.4 a2 2 0 0 1 0.6 -2.6 a2 2 0 0 1 3.4 1Z" fill="#E0533F" />}</g>}
      {on && <path d="M-22 -54 L-14 -54" stroke="#fff" strokeWidth="1.4" opacity="0.6" />}
    </g>
  )
}

/** 담요 (사람 위에 덮음): 몸 위 둥근 덩어리 + 체크무늬. (x, y) = 아래 왼쪽, w·h */
export function Blanket({ x, y, w = 60, h = 16, c = '#7FB7E8' }: { x: number; y: number; w?: number; h?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d={`M0 0 Q-2 ${-h} ${w * 0.3} ${-h} Q${w * 0.7} ${-h - 3} ${w} ${-h + 4} Q${w + 4} ${-4} ${w - 2} 0Z`} fill={c} stroke={INK} strokeWidth="1.8" />
      {[0.2, 0.45, 0.7].map((k) => <path key={k} d={`M${w * k} ${-h + 1} Q${w * k + 2} ${-h / 2} ${w * k} 0`} stroke="#fff" strokeWidth="1.4" opacity="0.6" fill="none" />)}
      <path d={`M2 ${-h * 0.45} Q${w / 2} ${-h * 0.6} ${w - 1} ${-h * 0.35}`} stroke="#fff" strokeWidth="1.4" opacity="0.6" fill="none" />
    </g>
  )
}

/** 시험지 (손에 쥠 또는 책상 위): 문제 줄 + 빨간 점수·동그라미/빗금. 원점 = 아래 가운데 */
export function ExamPaper({ score, good = true, s = 1 }: { score?: string; good?: boolean; s?: number }) {
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round">
      <rect x="-12" y="-30" width="24" height="30" fill="#FFFDF7" stroke={INK} strokeWidth="1.2" />
      {[-24, -19, -14, -9, -4].map((ly, i) => <g key={ly}><path d={`M-9 ${ly} H6`} stroke="#B8B2AA" strokeWidth="0.8" />{score && (good || i % 2 === 0 ? <circle cx="8" cy={ly} r="1.8" fill="none" stroke="#E0533F" strokeWidth="0.8" /> : <path d={`M6.6 ${ly - 1.6} l3 3`} stroke="#E0533F" strokeWidth="0.8" />)}</g>)}
      {score && <text x="4" y="-25" textAnchor="middle" fontSize="7" fill="#E0533F" transform="rotate(-10 4 -26)">{score}</text>}
    </g>
  )
}

/** 투표함 (교실): 상자 + 투입구 + '투표함' 글씨. (x, y) = 바닥 가운데 */
export function BallotBox({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d="M-14 0 V-22 L-8 -26 H20 V-4 L14 0Z" fill="#E9DDCB" stroke={INK} strokeWidth="1.6" />
      <path d="M-14 -22 H14 L20 -26 M14 -22 V0" fill="none" stroke={INK} strokeWidth="1.2" />
      <rect x="-6" y="-25" width="12" height="1.6" rx="0.8" fill={INK} />
      <text y="-8" x="0" textAnchor="middle" fontSize="6" fill={INK}>투표함</text>
    </g>
  )
}

/** 아기 침대 (신생아실 바구니 침대): 투명 통 + 받침 다리 + 이름표. (x, y) = 바닥 가운데 */
export function Bassinet({ x, y, tag = '아기', blanket = '#9DD2F0' }: { x: number; y: number; tag?: string; blanket?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d="M-14 0 L-10 -24 M14 0 L10 -24 M-12 -12 H12" stroke={INK} strokeWidth="3" /><path d="M-14 0 L-10 -24 M14 0 L10 -24 M-12 -12 H12" stroke="#C9CED6" strokeWidth="1.6" />
      <path d="M-20 -24 L-17 -40 H17 L20 -24Z" fill="#E6F4FB" stroke={INK} strokeWidth="1.6" opacity="0.95" />
      <path d="M-15 -38 L-13 -27" stroke="#fff" strokeWidth="2" opacity="0.8" />
      <rect x="-7" y="-23" width="14" height="6" rx="1" fill="#fff" stroke={INK} strokeWidth="0.9" />
      <text y="-18.4" textAnchor="middle" fontSize="4.2" fill={INK}>{tag}</text>
      {/* 아기 (포대기에 싸여 누움) */}
      <path d="M-12 -38 Q-12 -44 -4 -44 H10 Q14 -44 14 -40 V-38Z" fill={blanket} stroke={INK} strokeWidth="1.1" />
      <circle cx="-8" cy="-41" r="4.6" fill="#F6D3B3" stroke={INK} strokeWidth="1" />
      <path d="M-10.4 -41.6 q1 0.8 2 0 M-7 -41.6 q1 0.8 2 0" stroke={INK} strokeWidth="0.7" fill="none" />
      <circle cx="-10" cy="-39.6" r="0.9" fill="#F3A3C0" />
      <path d="M-12.6 -42 Q-12 -47 -8 -46.6 Q-4 -46.6 -3.6 -42.6" fill="#FFFFFF" stroke={INK} strokeWidth="0.8" />
    </g>
  )
}

/** 관광버스 (옆모습: 큰 창·문·바퀴·여행사 글씨). (x, y) = 바퀴 바닥 가운데 */
export function TourBus({ x, y, label = '수학여행', door = 0 }: { x: number; y: number; label?: string; door?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      <path d="M-70 -8 V-54 Q-70 -60 -64 -60 H62 Q70 -60 72 -50 L74 -20 V-8Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.2" />
      <path d="M-70 -28 H74" stroke="#5E8FC9" strokeWidth="6" /><path d="M-70 -21 H74" stroke="#F2C230" strokeWidth="3" />
      {[-62, -40, -18, 4, 26].map((wx) => <g key={wx}><rect x={wx} y="-54" width="19" height="16" rx="2" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" /><path d={`M${wx + 3} -51 l5 0 l-5 6z`} fill="#fff" opacity="0.6" /></g>)}
      {/* 앞유리·문 */}
      <path d="M50 -54 H63 Q68 -54 69 -48 L71 -32 H50Z" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" />
      <rect x={50} y="-36" width="0" height="0" />
      <g transform={`translate(${50 - door * 14} 0)`}><rect x="48" y="-36" width="0" height="0" /></g>
      <rect x="-70" y="-14" width="144" height="6" fill="#3A4250" />
      <text x="-30" y="-31" fontSize="6.4" fill="#fff">{label}</text>
      <rect x="69" y="-20" width="5" height="4" rx="1" fill="#FFF3A6" stroke={INK} strokeWidth="1" />
      {[-44, 46].map((wx) => <g key={wx}><circle cx={wx} cy="-6" r="9" fill="#2A2A30" stroke={INK} strokeWidth="1.6" /><circle cx={wx} cy="-6" r="4" fill="#C9CED6" stroke={INK} strokeWidth="1" /></g>)}
    </g>
  )
}

/** 석탑 (여행지: 3층 돌탑). (x, y) = 바닥 가운데 */
export function Pagoda({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const tiers = [0, 1, 2]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <rect x="-34" y="-10" width="68" height="10" fill="#C9C2B4" stroke={INK} strokeWidth="1.8" />
      <rect x="-28" y="-26" width="56" height="16" fill="#D6CFC0" stroke={INK} strokeWidth="1.8" />
      {[-18, 0, 18].map((k) => <path key={k} d={`M${k} -24 V-12`} stroke="#A9A190" strokeWidth="1.2" />)}
      {tiers.map((i) => {
        const w = 22 - i * 5, by = -26 - i * 26
        return (
          <g key={i}>
            <rect x={-w / 2} y={by - 16} width={w} height="16" fill="#DCD5C6" stroke={INK} strokeWidth="1.6" />
            <path d={`M${-w / 2 - 12} ${by - 16} Q0 ${by - 20} ${w / 2 + 12} ${by - 16} L${w / 2 + 14} ${by - 22} Q0 ${by - 25} ${-w / 2 - 14} ${by - 22}Z`} fill="#BFB7A6" stroke={INK} strokeWidth="1.6" />
          </g>
        )
      })}
      <path d="M0 -100 V-116" stroke={INK} strokeWidth="2.4" /><circle cy="-106" r="2.4" fill="#BFB7A6" stroke={INK} strokeWidth="1" /><circle cy="-112" r="2" fill="#BFB7A6" stroke={INK} strokeWidth="1" />
    </g>
  )
}
