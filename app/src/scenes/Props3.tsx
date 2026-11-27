// 장면 소품 더: 부케·아기·열쇠·상자·졸업장·학사모·복권·모니터·스쿠터·우산·물뿌리개·상추·아이스크림·상자 속 돌
import { INK } from './kit'

/** 부케 (손에 듦) */
export function Bouquet() {
  return (
    <g>
      <path d="M-3 0 L0 -12 L3 0Z" fill="#7FBF6A" stroke={INK} strokeWidth="1.2" />
      {[[-5, -14, '#F7B8C8'], [0, -17, '#fff'], [5, -14, '#F2708A'], [-2, -11, '#FFE27A'], [3, -10, '#fff']].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="4" fill={c as string} stroke={INK} strokeWidth="1.1" />)}
    </g>
  )
}

/** 포대기에 싼 아기 (두 팔로 안음, 손 위치 기준) */
export function Baby({ t, cry = false }: { t: number; cry?: boolean }) {
  const wob = Math.sin(t * 3) * 3
  return (
    <g transform={`translate(4 -6) rotate(${-20 + wob})`}>
      <ellipse cx="0" cy="0" rx="14" ry="8" fill="#FFF6EA" stroke={INK} strokeWidth="1.8" />
      <circle cx="10" cy="-3" r="7" fill="#F6D2B8" stroke={INK} strokeWidth="1.6" />
      <path d="M6 -9 Q10 -12 14 -8" fill="#F2A3C0" stroke={INK} strokeWidth="1.2" />
      {cry ? <ellipse cx="13" cy="-1" rx="2" ry="2.4" fill={INK} /> : <path d="M11 -1 q2 1.5 3 0" stroke={INK} strokeWidth="1.1" fill="none" />}
      <path d="M8 -4 q1 -1 2 0 M12 -5 q1 -1 2 0" stroke={INK} strokeWidth="1" fill="none" />
    </g>
  )
}

/** 열쇠 */
export function Key() {
  return (
    <g transform="rotate(-30)">
      <circle cy="-12" r="4.5" fill="#F2C230" stroke={INK} strokeWidth="1.5" />
      <circle cy="-12" r="1.6" fill="#fff" />
      <path d="M0 -7 V4 M0 1 h3 M0 3 h2.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M0 -7 V4" stroke="#F2C230" strokeWidth="1" />
    </g>
  )
}

/** 무거운 상자 (두 손으로 듦, 손 위치 기준) */
export function BoxHeld() {
  return (
    <g transform="translate(6 -4)">
      <rect x="-14" y="-14" width="28" height="22" rx="2" fill="#C98B55" stroke={INK} strokeWidth="2" />
      <path d="M-14 -6 H14 M0 -14 V-6" stroke="#9A6A3E" strokeWidth="2" />
    </g>
  )
}

/** 졸업장 (돌돌 만 종이) */
export function Diploma() {
  return (
    <g transform="rotate(-50)">
      <rect x="-3" y="-16" width="6" height="20" rx="3" fill="#FFF6EA" stroke={INK} strokeWidth="1.4" />
      <path d="M-3 -6 H3" stroke="#E0533F" strokeWidth="2.4" />
    </g>
  )
}

/** 학사모 (날아가는 것) */
export function GradCap({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.5)`}>
      <rect x="-8" y="0" width="16" height="7" rx="2" fill="#2A2238" stroke={INK} strokeWidth="1.3" />
      <path d="M-14 0 L0 -6 L14 0 L0 6Z" fill="#2A2238" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <circle r="1.4" fill="#F2C230" />
      <path d="M0 0 L10 3 V11" stroke="#F2C230" strokeWidth="1.6" fill="none" />
    </g>
  )
}

/** 머리에 쓴 학사모 (머리 꼭대기 위치) */
export function GradCapOn({ x, y }: { x: number; y: number }) {
  return <GradCap x={x} y={y} />
}

/** 복권 종이 (손에 듦) */
export function Ticket() {
  return (
    <g transform="rotate(-10)">
      <rect x="-9" y="-14" width="18" height="12" rx="1.5" fill="#FFF6C8" stroke={INK} strokeWidth="1.4" />
      <path d="M-6 -10 h12 M-6 -6 h8" stroke="#E0533F" strokeWidth="1.4" />
    </g>
  )
}

/** 책상 + 모니터 (게임). glow = 화면 불빛 */
export function GameDesk({ x, y, t }: { x: number; y: number; t: number }) {
  const c = ['#7FCBE8', '#F2708A', '#A6D98F', '#F2C230'][Math.floor(t * 3) % 4]
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="-60" rx="56" ry="40" fill={c} opacity="0.18" />
      <rect x="-30" y="-38" width="60" height="6" rx="2" fill="#8A5A34" stroke={INK} strokeWidth="2" />
      <path d="M-24 -32 V0 M24 -32 V0" stroke={INK} strokeWidth="3" />
      <rect x="-20" y="-72" width="40" height="28" rx="3" fill="#1E2A44" stroke={INK} strokeWidth="2" />
      <rect x="-17" y="-69" width="34" height="22" rx="2" fill={c} opacity="0.85" />
      <path d="M-3 -44 V-38 M-8 -38 H8" stroke={INK} strokeWidth="2.4" />
    </g>
  )
}

/** 게임기 (두 손으로) */
export function Pad() {
  return <g><rect x="-9" y="-6" width="18" height="9" rx="4" fill="#3A3434" stroke={INK} strokeWidth="1.4" /><circle cx="-4" cy="-2" r="1.5" fill="#F2708A" /><circle cx="4" cy="-2" r="1.5" fill="#7FCBE8" /></g>
}

/** 스쿠터 (옆, 오른쪽). 사람은 위에 따로 그림 */
export function Scooter({ x, y, color = '#7FCBE8', spin = 0, rot = 0, fallen = 0 }: { x: number; y: number; color?: string; spin?: number; rot?: number; fallen?: number }) {
  // fallen 0~1: 손잡이 기둥이 앞으로 넘어가 바닥에 눕는 정도
  const wheel = (cx: number) => <g transform={`translate(${cx} -8) rotate(${spin})`}><circle r="8" fill="#3A3434" stroke={INK} strokeWidth="2" /><circle r="3" fill="#CFCBC6" /><path d="M-3 0 H3" stroke={INK} strokeWidth="1.2" /></g>
  if (fallen >= 1) return (
    // 옆으로 누운 스쿠터: 발판·손잡이 기둥이 바닥에 납작, 바퀴는 위에서 본 납작한 모양
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="-22" cy="-3" rx="8" ry="3" fill="#3A3434" stroke={INK} strokeWidth="1.6" />
      <ellipse cx="20" cy="-3" rx="8" ry="3" fill="#3A3434" stroke={INK} strokeWidth="1.6" />
      <rect x="-30" y="-8" width="36" height="6" rx="2" fill={color} stroke={INK} strokeWidth="1.8" />
      <path d="M8 -5 H48" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M48 -11 V1" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} 0 -8)`}>
      <path d="M-26 -12 H10 Q18 -12 20 -20" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
      <g transform={`rotate(${fallen * 84} 20 -20)`}><path d="M20 -20 L27 -74" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" /><path d="M21 -74 h14" stroke={INK} strokeWidth="5" strokeLinecap="round" /><path d="M29 -74 h6" stroke="#3A3434" strokeWidth="3" strokeLinecap="round" /></g>
      <path d="M-30 -10 Q-30 -24 -16 -24 H4 V-12 H-30Z" fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {wheel(-22)}{wheel(20)}
    </g>
  )
}

/** 우산 (손에 듦). flip = 0~1 뒤집힘 */
export function Umbrella({ flip = 0 }: { flip?: number }) {
  const k = 1 - 1.9 * flip // 1 = 펼침, 음수 = 바람에 뒤집힘
  const pts = [-22, -11, 0, 11, 22]
  return (
    <g transform="translate(0 -14) scale(1.5)">
      <path d="M0 8 V-40" stroke={INK} strokeWidth="2" />
      <path d="M0 8 q0 5 -5 5 q-3 0 -3 -3" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <g transform={`translate(0 -22) scale(1 ${k}) translate(0 22)`}>
        <path d="M-22 -22 Q-20 -42 0 -44 Q20 -42 22 -22 q-5.5 -4 -11 0 q-5.5 -4 -11 0 q-5.5 -4 -11 0 q-5.5 -4 -11 0Z" fill="#E0533F" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        {pts.slice(1, 4).map((x) => <path key={x} d={`M0 -44 Q${x * 0.6} -36 ${x} -22`} stroke="#A83A2A" strokeWidth="1.2" fill="none" />)}
        <circle cy="-45" r="1.6" fill={INK} />
      </g>
    </g>
  )
}

/** 물뿌리개 (손에 듦). pour = 기울임 0~1 */
export function WateringCan({ pour = 0 }: { pour?: number }) {
  // 물뿌리개: 둥근 통 + 위 손잡이 + 길쭉한 주둥이 끝에 꽃 모양 머리
  return (
    <g transform={`rotate(${pour * 35})`}>
      <path d="M-4 -12 Q2 -22 10 -12" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M-9 2 L-8 -12 H10 L11 2Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-8 -8 H10" stroke="#8FB4E0" strokeWidth="1.4" />
      <path d="M10 -2 L22 -14" stroke={INK} strokeWidth="3.2" strokeLinecap="round" /><path d="M10 -2 L22 -14" stroke="#5E8FC9" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 -17 L26 -11 L28 -13 L22 -19Z" fill="#8FB4E0" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </g>
  )
}

/** 상추 (밭에 심긴 것). size 0~1 자람 */
export function Lettuce({ x, y, size = 1, roots = false }: { x: number; y: number; size?: number; roots?: boolean }) {
  // 상추 한 포기: 주름진 넓은 잎이 부채처럼 펼쳐짐 (뽑으면 흙 묻은 뿌리)
  return (
    <g transform={`translate(${x} ${y}) scale(${0.3 + 0.7 * size})`}>
      {roots && <g><path d="M0 0 L-3 9 M0 0 L2 10 M0 0 L5 7" stroke="#B89A72" strokeWidth="1.4" /><ellipse cy="3" rx="5" ry="3" fill="#7A5A3A" /></g>}
      <LeafFan />
    </g>
  )
}
/** 상추 잎 다발 (바닥 가운데 기준) */
function LeafFan({ c = '#8CC377', d = '#6FAF5E' }: { c?: string; d?: string }) {
  const leaf = (a: number, l: number, col: string) => (
    <g transform={`rotate(${a})`}><path d={`M0 0 Q${-l * 0.55} ${-l * 0.5} ${-l * 0.32} ${-l} Q${-l * 0.12} ${-l * 1.12} 0 ${-l * 0.98} Q${l * 0.12} ${-l * 1.12} ${l * 0.32} ${-l} Q${l * 0.55} ${-l * 0.5} 0 0Z`} fill={col} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" /><path d={`M0 -2 V${-l * 0.85}`} stroke="#E8F5D8" strokeWidth="1" /></g>
  )
  return <g>{leaf(-48, 13, d)}{leaf(48, 13, d)}{leaf(-22, 16, c)}{leaf(22, 16, c)}{leaf(0, 18, '#9ED38A')}</g>
}

/** 바구니 (손에 듦): 엮은 바구니 + 손잡이, 상추 잎이 가득 삐져나옴 */
export function Basket({ full = 0 }: { full?: number }) {
  return (
    <g transform="translate(0 6)">
      <path d="M-13 -10 Q0 -34 13 -10" fill="none" stroke="#9A6A3E" strokeWidth="2.6" />
      {full > 0 && <g transform={`translate(0 -9) scale(${0.6 + 0.4 * full})`}><g transform="translate(-7 0) scale(0.8)"><LeafFan /></g><g transform="translate(7 0) scale(0.8)"><LeafFan /></g><LeafFan /></g>}
      <path d="M-14 -10 H14 L11 4 H-11Z" fill="#D9A866" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-13 -6 H13 M-12 -1 H12 M-6 -10 L-5 4 M0 -10 V4 M6 -10 L5 4" stroke="#A87A3E" strokeWidth="1" />
      <rect x="-15" y="-12" width="30" height="3.5" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.2" />
    </g>
  )
}

/** 아이스크림 콘 */
export function IceCream({ c = '#F7B8C8' }: { c?: string }) {
  return <g><path d="M-5 -10 L0 4 L5 -10Z" fill="#E3B987" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" /><circle cy="-13" r="6" fill={c} stroke={INK} strokeWidth="1.4" /></g>
}

/** 택배 상자 (바닥). open = 열림 0~1, rock = 안에 돌 */
export function Parcel({ x, y, open = 0, rock = false }: { x: number; y: number; open?: number; rock?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="1" rx="20" ry="3" fill="rgba(42,33,24,0.16)" />
      {rock && open > 0.5 && <path d="M-9 -24 Q-10 -34 -2 -35 Q8 -36 10 -27 Q11 -22 8 -22Z" fill="#A39C90" stroke={INK} strokeWidth="1.6" />}
      <rect x="-18" y="-24" width="36" height="24" rx="2" fill="#C98B55" stroke={INK} strokeWidth="2" />
      <path d={`M-18 -24 L${-18 - open * 8} ${-24 - open * 12} L${-2 - open * 6} ${-24 - open * 14} L0 -24`} fill="#D9A06A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d={`M18 -24 L${18 + open * 8} ${-24 - open * 12} L${2 + open * 6} ${-24 - open * 14} L0 -24`} fill="#D9A06A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-6 -24 V-14 M6 -24 V-14" stroke="#F4EBD6" strokeWidth="3" />
    </g>
  )
}

/** 벽돌 (손에 듦) */
export function Brick() {
  // 붉은 벽돌 (윗면이 조금 보이게): 모서리 깨짐 · 시멘트 자국 · 거친 점
  return (
    <g transform="translate(0 -6)">
      <path d="M-12 -6 L-8 -10 H14 L12 -6Z" fill="#C9694F" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 -6 L14 -10 V2 L12 5Z" fill="#8E3E2C" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-12 -6 H12 V5 H-9 L-12 2Z" fill="#B0503A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-4 -6 q2 3 6 1" stroke="#D9D2C4" strokeWidth="1.6" fill="none" />
      {[[-7, -2], [-2, 1], [4, -3], [8, 2], [-9, 3], [1, -2]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.8" fill="#7A3424" />)}
    </g>
  )
}

/** 리본 달린 축하 현수막 */
export function Banner({ x, y, text, w = 120, color = '#E0533F' }: { x: number; y: number; text: string; w?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2} 0 Q0 10 ${w / 2} 0 V18 Q0 28 ${-w / 2} 18Z`} fill={color} stroke={INK} strokeWidth="2" />
      <text textAnchor="middle" y="17" fontSize="13" fill="#fff">{text}</text>
    </g>
  )
}
