// 놀이동산 소품 (11-28 사용자: 풍선이 허공에, 덤불이 이상한 곳에, 전반적으로 퀄리티 부족 → 하나씩 진짜처럼)
import { INK } from './kit'
import { Balloons } from './Backdrops3'
import { Bush, Lamp } from './Nature'

const C4 = ['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A', '#C77FD0', '#F7A3B8']

/** 대관람차: (x, y) = 가운데 축, gy = 땅. 곤돌라는 늘 아래로 매달림 */
export function FerrisWheel({ x, y, r, gy, t, color = '#C77FD0' }: { x: number; y: number; r: number; gy: number; t: number; color?: string }) {
  const n = 10
  const a0 = t * 0.35
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {/* 뒤 다리 */}
      <path d={`M0 0 L${-r * 0.5} ${gy - y} M0 0 L${r * 0.5} ${gy - y}`} stroke={INK} strokeWidth="4.4" />
      <path d={`M0 0 L${-r * 0.5} ${gy - y} M0 0 L${r * 0.5} ${gy - y}`} stroke="#9AA4AE" strokeWidth="2.4" />
      <path d={`M${-r * 0.25} ${(gy - y) / 2} H${r * 0.25}`} stroke={INK} strokeWidth="1.6" />
      {/* 바퀴: 두 겹 테 · 살 · 테 사이 지지대 */}
      {Array.from({ length: n * 2 }, (_, i) => { const a = a0 + (i * Math.PI) / n; return <path key={i} d={`M0 0 L${Math.cos(a) * r} ${Math.sin(a) * r}`} stroke={color} strokeWidth="1" opacity="0.9" /> })}
      <circle r={r} fill="none" stroke={INK} strokeWidth="3.6" /><circle r={r} fill="none" stroke={color} strokeWidth="2" />
      <circle r={r * 0.82} fill="none" stroke={color} strokeWidth="1.4" />
      {Array.from({ length: n * 2 }, (_, i) => { const a = a0 + (i * Math.PI) / n + 0.15; return <path key={i} d={`M${Math.cos(a) * r * 0.82} ${Math.sin(a) * r * 0.82} L${Math.cos(a + 0.12) * r} ${Math.sin(a + 0.12) * r}`} stroke={color} strokeWidth="0.9" /> })}
      {/* 테두리 전구 */}
      {Array.from({ length: 20 }, (_, i) => { const a = a0 + (i * Math.PI) / 10 + 0.16; return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="1.2" fill={Math.sin(t * 6 + i) > 0 ? '#FFF3A6' : '#fff'} /> })}
      {/* 축 */}
      <circle r="6" fill="#F2C230" stroke={INK} strokeWidth="1.6" /><circle r="2.4" fill="#fff" stroke={INK} strokeWidth="1" />
      {/* 곤돌라 */}
      {Array.from({ length: n }, (_, i) => {
        const a = a0 + (i * 2 * Math.PI) / n, gx = Math.cos(a) * r, gyy = Math.sin(a) * r
        const sw = Math.sin(t * 2 + i) * 4
        return (
          <g key={i} transform={`translate(${gx} ${gyy}) rotate(${sw})`}>
            <path d="M0 0 V3" stroke={INK} strokeWidth="1.4" />
            <path d="M-6 4 Q0 0 6 4 Z" fill={C4[i % 6]} stroke={INK} strokeWidth="1" />
            <rect x="-5.5" y="4" width="11" height="9" rx="2.4" fill={C4[i % 6]} stroke={INK} strokeWidth="1.1" />
            <rect x="-3.8" y="5.4" width="7.6" height="3.8" rx="1" fill="#DFF3FB" stroke={INK} strokeWidth="0.6" />
          </g>
        )
      })}
      {/* 앞 다리 */}
      <path d={`M0 0 L${-r * 0.42} ${gy - y} M0 0 L${r * 0.42} ${gy - y}`} stroke={INK} strokeWidth="4.8" />
      <path d={`M0 0 L${-r * 0.42} ${gy - y} M0 0 L${r * 0.42} ${gy - y}`} stroke="#C9D3DA" strokeWidth="2.8" />
      <rect x={-r * 0.6} y={gy - y - 4} width={r * 1.2} height="5" rx="1.5" fill="#8A8F98" stroke={INK} strokeWidth="1.2" />
    </g>
  )
}

/** 동화 성: (x, gy) = 땅 가운데 */
export function Castle({ x, gy, s = 1 }: { x: number; gy: number; s?: number }) {
  const tower = (tx: number, h: number, w: number, c: string) => (
    <g>
      <rect x={tx - w / 2} y={-h} width={w} height={h} fill="#F4E3F4" stroke={INK} strokeWidth="1.5" />
      <path d={`M${tx - w / 2 - 3} ${-h} L${tx} ${-h - w * 1.3} L${tx + w / 2 + 3} ${-h}Z`} fill={c} stroke={INK} strokeWidth="1.5" />
      <path d={`M${tx - w / 4} ${-h - 2} L${tx} ${-h - w * 1.3 + 2}`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
      <path d={`M${tx} ${-h - w * 1.3} v-8 l7 2.5 l-7 2.5`} fill="#E0533F" stroke={INK} strokeWidth="0.9" />
      <path d={`M${tx - 2.5} ${-h + 14} v-4 q2.5 -3.5 5 0 v4z`} fill="#5E8FC9" stroke={INK} strokeWidth="0.9" />
    </g>
  )
  return (
    <g transform={`translate(${x} ${gy}) scale(${s})`} strokeLinejoin="round">
      {tower(-22, 52, 12, '#C77FD0')}{tower(22, 52, 12, '#C77FD0')}
      <rect x="-18" y="-40" width="36" height="40" fill="#FBEFFB" stroke={INK} strokeWidth="1.5" />
      {[-15, -7, 1, 9].map((cx) => <rect key={cx} x={cx} y="-45" width="5" height="5" fill="#FBEFFB" stroke={INK} strokeWidth="1.2" />)}
      {tower(0, 62, 14, '#5E8FC9')}
      <path d="M-7 0 V-14 Q0 -22 7 -14 V0Z" fill="#9A6A3E" stroke={INK} strokeWidth="1.3" />
      <path d="M0 -20 V0" stroke="#7A4A2A" strokeWidth="0.9" />
      {[-12, 12].map((wx) => <path key={wx} d={`M${wx - 2.5} -24 v-5 q2.5 -3.5 5 0 v5z`} fill="#BFE4F7" stroke={INK} strokeWidth="0.9" />)}
    </g>
  )
}

/** 줄무늬 기둥 (사탕 막대 무늬): (x, top) ~ gy */
export function CandyPillar({ x, top, gy, w = 16, c = '#E0533F', id }: { x: number; top: number; gy: number; w?: number; c?: string; id: string }) {
  return (
    <g>
      <clipPath id={id}><rect x={x - w / 2} y={top} width={w} height={gy - top} /></clipPath>
      <rect x={x - w / 2} y={top} width={w} height={gy - top} fill="#FFF8EC" />
      <g clipPath={`url(#${id})`}>{Array.from({ length: Math.ceil((gy - top) / 12) + 2 }, (_, i) => <path key={i} d={`M${x - w} ${top + i * 12 - 6} L${x + w} ${top + i * 12 - 18} L${x + w} ${top + i * 12 - 12} L${x - w} ${top + i * 12}Z`} fill={c} />)}</g>
      <rect x={x - w / 2} y={top} width={w} height={gy - top} fill="none" stroke={INK} strokeWidth="2" />
      <path d={`M${x - w / 2 + 3} ${top + 2} V${gy - 12}`} stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
      {/* 받침 · 머리 장식 */}
      <rect x={x - w / 2 - 4} y={gy - 12} width={w + 8} height="12" rx="2" fill="#F2C230" stroke={INK} strokeWidth="1.8" />
      <path d={`M${x - w / 2 - 4} ${gy - 8} H${x + w / 2 + 4}`} stroke="#D9A21A" strokeWidth="1.4" />
      <rect x={x - w / 2 - 3} y={top - 5} width={w + 6} height="6" rx="2" fill="#F2C230" stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** 매표소: (x, gy) = 땅 가운데 */
export function TicketBooth({ x, gy, s = 1 }: { x: number; gy: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${gy}) scale(${s})`} strokeLinejoin="round">
      <rect x="-20" y="-40" width="40" height="40" fill="#FFF6EA" stroke={INK} strokeWidth="1.8" />
      {[-15, -5, 5, 15].map((k) => <path key={k} d={`M${k} -12 V0`} stroke="#E8D7BE" strokeWidth="2" />)}
      {/* 창 · 말하는 구멍 · 받침 */}
      <rect x="-14" y="-34" width="28" height="18" rx="2" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" />
      <path d="M-10 -30 l6 0 l-6 6z" fill="#fff" opacity="0.7" />
      <circle cy="-22" r="2.6" fill="none" stroke={INK} strokeWidth="0.8" />
      <rect x="-17" y="-16" width="34" height="4" rx="1" fill="#C98B55" stroke={INK} strokeWidth="1.2" />
      {/* 둥근 줄무늬 지붕 · 간판 */}
      <path d="M-26 -40 Q0 -64 26 -40Z" fill="#E0533F" stroke={INK} strokeWidth="1.8" />
      {[-14, 0, 14].map((k) => <path key={k} d={`M${k * 0.9} -52 L${k * 1.6} -40`} stroke="#fff" strokeWidth="3.2" />)}
      <path d="M-26 -40 Q0 -64 26 -40Z" fill="none" stroke={INK} strokeWidth="1.8" />
      <circle cy="-54" r="2.6" fill="#F2C230" stroke={INK} strokeWidth="1" />
      <rect x="-15" y="-11" width="30" height="8" rx="1.5" fill="#5E8FC9" stroke={INK} strokeWidth="1.1" />
      <text y="-4.6" textAnchor="middle" fontSize="6" fill="#fff">매표소</text>
    </g>
  )
}

/** 풍선 수레: (x, gy) = 땅 가운데. 풍선 끈은 수레 기둥에 묶임 */
export function BalloonCart({ x, gy, t }: { x: number; gy: number; t: number }) {
  return (
    <g transform={`translate(${x} ${gy})`} strokeLinejoin="round">
      <g transform="translate(0 -44)"><Balloons x={0} y={0} t={t} /></g>
      <g transform="translate(-6 -40) scale(0.8)"><Balloons x={0} y={0} t={t + 1.3} /></g>
      <path d="M0 -10 V-44" stroke={INK} strokeWidth="3" /><path d="M0 -10 V-44" stroke="#C98B55" strokeWidth="1.6" />
      <rect x="-16" y="-22" width="32" height="14" rx="2" fill="#7FCBE8" stroke={INK} strokeWidth="1.6" />
      <path d="M-16 -18 H16" stroke="#fff" strokeWidth="2" />
      <path d="M16 -20 L24 -26" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      {[-9, 9].map((wx) => <g key={wx}><circle cx={wx} cy="-5" r="5" fill="#3A3434" stroke={INK} strokeWidth="1.4" /><circle cx={wx} cy="-5" r="1.8" fill="#CFCBC6" /></g>)}
    </g>
  )
}

/** 화단 (네모 화분 + 덤불·꽃) */
export function Planter({ x, gy, w = 30 }: { x: number; gy: number; w?: number }) {
  return (
    <g>
      <Bush x={x} y={gy - 10} s={w / 40} flowers="#F2708A" />
      <rect x={x - w / 2} y={gy - 12} width={w} height="12" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.6" />
      <path d={`M${x - w / 2} ${gy - 8} H${x + w / 2}`} stroke="#A87040" strokeWidth="1.2" />
    </g>
  )
}

/** 줄무늬 천막 (먹거리·게임 가게): (x, gy) = 땅 가운데 */
export function Tent({ x, gy, c, sign }: { x: number; gy: number; c: string; sign?: string }) {
  return (
    <g transform={`translate(${x} ${gy})`} strokeLinejoin="round">
      <rect x="-20" y="-26" width="40" height="26" fill="#FFF6EA" stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2, 3].map((k) => <rect key={k} x={-20 + k * 10} y="-26" width="5" height="26" fill={c} opacity="0.75" />)}
      <rect x="-20" y="-26" width="40" height="26" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M-7 0 V-15 Q0 -20 7 -15 V0Z" fill="#5A3A22" stroke={INK} strokeWidth="1.2" />
      <path d="M-24 -26 L0 -46 L24 -26Z" fill={c} stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-24 + i * 8} -26 q4 5 8 0`} fill={i % 2 ? '#fff' : c} stroke={INK} strokeWidth="1" />)}
      <path d="M0 -46 V-54 l7 3 l-7 3" fill="#F2C230" stroke={INK} strokeWidth="1" />
      {sign && <><rect x="-13" y="-38" width="26" height="8" rx="1.5" fill="#fff" stroke={INK} strokeWidth="0.9" /><text y="-31.8" textAnchor="middle" fontSize="5.6" fill={INK}>{sign}</text></>}
    </g>
  )
}

/** 회전목마 말 (옆): 0,0 = 등 가운데 (봉이 지나감) */
export function Horse({ c, dir = 1 }: { c: string; dir?: number }) {
  return (
    <g transform={`scale(${dir} 1)`} strokeLinejoin="round">
      {/* 뒷다리 · 앞다리 (뛰는 모양) */}
      <path d="M-9 4 L-15 10 L-18 8 M9 4 L14 9 L17 6" stroke={INK} strokeWidth="3.6" strokeLinecap="round" fill="none" />
      <path d="M-9 4 L-15 10 L-18 8 M9 4 L14 9 L17 6" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 꼬리 */}
      <path d="M-12 -1 Q-20 -2 -19 8" stroke="#F2C230" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* 몸 · 목 · 머리 */}
      <path d="M-13 -2 Q-13 -6 -6 -6 H6 Q10 -6 11 -10 L13 -17 Q15 -21 19 -19 L22 -15 Q23 -13 21 -12 L16 -12 L14 -4 Q12 5 4 5 H-8 Q-13 5 -13 -2Z" fill={c} stroke={INK} strokeWidth="1.3" />
      {/* 갈기 */}
      <path d="M12 -18 Q8 -14 9 -8 Q7 -12 5 -7" stroke="#E0533F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="17.5" cy="-16" r="0.9" fill={INK} />
      {/* 안장 */}
      <path d="M-5 -6 Q0 -2 5 -6 L4 0 H-4Z" fill="#E0533F" stroke={INK} strokeWidth="1" />
      <path d="M0 -1 V4" stroke="#F2C230" strokeWidth="1.4" />
    </g>
  )
}

/** 회전목마: (x, gy) = 땅 가운데 */
export function Carousel({ x, gy, t }: { x: number; gy: number; t: number }) {
  const top = gy - 128
  const horses = Array.from({ length: 5 }, (_, i) => {
    const p = (((i / 5 - t * 0.08) % 1) + 1) % 1 // 0~1 둘레. 앞쪽 말이 왼쪽으로 = 위에서 보면 시계방향 (11-28 사용자)
    const a = p * Math.PI * 2
    return { hx: Math.sin(a) * 52, z: Math.cos(a), i, bob: Math.sin(t * 3 + i * 1.7) * 5 }
  }).sort((a, b) => a.z - b.z)
  const horse = (h: typeof horses[number]) => {
    const sc = 0.82 + 0.18 * h.z
    return (
      <g key={h.i} opacity={h.z < -0.2 ? 0.75 : 1}>
        <path d={`M${h.hx} ${top + 40} V${gy - 18}`} stroke="#E8C060" strokeWidth={1.4 + h.z * 0.6} />
        <path d={`M${h.hx} ${top + 40} V${gy - 18}`} stroke="#FFF3A6" strokeWidth="0.6" />
        <g transform={`translate(${h.hx} ${gy - 52 + h.bob}) scale(${sc})`}><Horse c={['#FFFFFF', '#F7B8C8', '#BFE4F7', '#FFE27A', '#D8C2F0'][h.i]} dir={-1} /></g>
      </g>
    )
  }
  return (
    <g transform={`translate(${x} 0)`} strokeLinejoin="round">
      {/* 가운데 기둥 (거울 무늬) */}
      <rect x="-12" y={top + 36} width="24" height={gy - top - 50} fill="#C77FD0" stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2].map((k) => <rect key={k} x="-8" y={top + 46 + k * 22} width="16" height="14" rx="2" fill="#DFF3FB" stroke={INK} strokeWidth="1" />)}
      {horses.filter((h) => h.z < 0).map(horse)}
      {/* 지붕: 줄무늬 원뿔 · 꽃줄 테 · 전구 */}
      <path d={`M-74 ${top + 30} L0 ${top} L74 ${top + 30}Z`} fill="#E0533F" stroke={INK} strokeWidth="2" />
      {[-52, -26, 0, 26, 52].map((k) => <path key={k} d={`M0 ${top + 1} L${k * 1.25} ${top + 30}`} stroke="#fff" strokeWidth="5" />)}
      <path d={`M-74 ${top + 30} L0 ${top} L74 ${top + 30}Z`} fill="none" stroke={INK} strokeWidth="2" />
      <rect x="-74" y={top + 29} width="148" height="9" fill="#F2C230" stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${-74 + i * 18.5} ${top + 38} q9.25 9 18.5 0`} fill={i % 2 ? '#fff' : '#F2708A'} stroke={INK} strokeWidth="1.2" />)}
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={-68 + i * 12.4} cy={top + 33.5} r="1.6" fill={Math.sin(t * 7 + i) > 0 ? '#FFF3A6' : '#fff'} stroke={INK} strokeWidth="0.5" />)}
      <path d={`M0 ${top} V${top - 10}`} stroke={INK} strokeWidth="2" /><circle cy={top - 12} r="4" fill="#F2C230" stroke={INK} strokeWidth="1.4" />
      {/* 바닥 판 (두 겹) */}
      <path d={`M-74 ${gy - 18} H74 L70 ${gy - 8} H-70Z`} fill="#C77FD0" stroke={INK} strokeWidth="1.6" />
      <rect x="-78" y={gy - 8} width="156" height="8" rx="2" fill="#9A5AAE" stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-70 + i * 17.5} cy={gy - 4} r="1.4" fill="#FFF3A6" />)}
      {horses.filter((h) => h.z >= 0).map(horse)}
      {/* 앞 기둥 둘 */}
      {[-72, 72].map((px) => <g key={px}><path d={`M${px} ${top + 38} V${gy - 18}`} stroke={INK} strokeWidth="3.6" /><path d={`M${px} ${top + 38} V${gy - 18}`} stroke="#F2C230" strokeWidth="2" /></g>)}
    </g>
  )
}

/** 솜사탕 가게: (x, gy) = 땅 가운데. 계산대 · 솜사탕 기계(돌아가는 통) · 매달린 솜사탕 · 차양 · 간판 */
export function CottonStand({ x, gy, t }: { x: number; gy: number; t: number }) {
  const cotton = (cx: number, cy: number, c: string, s = 1) => (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M0 0 V10" stroke="#E8DCC8" strokeWidth="1.6" />
      <g fill={c} stroke={INK} strokeWidth="0.9"><circle cx="-3.5" cy="-2" r="4.2" /><circle cx="3.5" cy="-2.4" r="4.6" /><circle cx="0" cy="-6.5" r="4.4" /></g>
      <circle cx="-1.5" cy="-6.5" r="1.4" fill="rgba(255,255,255,0.6)" />
    </g>
  )
  return (
    <g transform={`translate(${x} ${gy})`} strokeLinejoin="round">
      {/* 뒤 벽 · 기둥 */}
      <rect x="-38" y="-62" width="76" height="62" fill="#FFF6EA" stroke={INK} strokeWidth="1.8" />
      {[-34, 34].map((px) => <rect key={px} x={px - 3} y="-62" width="6" height="62" fill="#F7A3B8" stroke={INK} strokeWidth="1.4" />)}
      {/* 매달린 솜사탕 (봉지) */}
      {[-22, -10, 10, 22].map((cx, i) => <g key={cx}><path d={`M${cx} -58 V-54`} stroke={INK} strokeWidth="0.8" /><rect x={cx - 4.5} y="-54" width="9" height="12" rx="3.5" fill={['#F7B8D8', '#BFE4F7', '#FFE27A', '#F7B8D8'][i]} stroke={INK} strokeWidth="1" /><path d={`M${cx - 2} -51 v4`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" /></g>)}
      {/* 계산대 */}
      <rect x="-40" y="-26" width="80" height="26" fill="#F2708A" stroke={INK} strokeWidth="1.8" />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${-32 + i * 16} -24 V-2`} stroke="#F7A3B8" strokeWidth="5" />)}
      <rect x="-42" y="-29" width="84" height="5" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.4" />
      {/* 솜사탕 기계 (계산대 위) */}
      <g transform="translate(14 -29)">
        <path d="M-12 0 Q-13 -10 -10 -12 H10 Q13 -10 12 0Z" fill="#DFF3FB" stroke={INK} strokeWidth="1.3" opacity="0.95" />
        <ellipse cy="-6" rx={7 + Math.sin(t * 20) * 0.6} ry="3" fill="#F7B8D8" stroke="rgba(42,33,24,0.5)" strokeWidth="0.6" />
        <path d={`M${-5 + Math.sin(t * 30) * 3} -7 q3 -2 6 0`} stroke="#fff" strokeWidth="0.8" fill="none" />
      </g>
      {cotton(-24, -38, '#F7B8D8', 1.1)}{cotton(-12, -36, '#BFE4F7')}
      {/* 차양 */}
      <path d="M-44 -62 H44 L40 -78 H-40Z" fill="#F7A3B8" stroke={INK} strokeWidth="1.8" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${-40 + i * 10} -78 L${-44 + i * 11} -62`} stroke="#fff" strokeWidth="4" />)}
      <path d="M-44 -62 H44 L40 -78 H-40Z" fill="none" stroke={INK} strokeWidth="1.8" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${-44 + i * 11} -62 q5.5 6 11 0`} fill={i % 2 ? '#fff' : '#F2708A'} stroke={INK} strokeWidth="1.1" />)}
      {/* 간판 (솜사탕 모양) */}
      <g transform="translate(0 -88)">
        <path d="M-26 6 Q-30 -2 -22 -6 Q-18 -13 -8 -10 Q0 -16 8 -10 Q18 -13 22 -6 Q30 -2 26 6Z" fill="#FFFFFF" stroke={INK} strokeWidth="1.5" />
        <text y="3" textAnchor="middle" fontSize="10" fill="#E0537F">솜사탕</text>
      </g>
    </g>
  )
}

/** 공원 가로등 + 꽃줄 (가로등 꼭대기에 걸침) */
export function LampGarland({ x0, x1, y0, y1, sag = 12 }: { x0: number; x1: number; y0: number; y1: number; sag?: number }) {
  const n = Math.max(3, Math.floor(Math.abs(x1 - x0) / 13))
  const pt = (k: number) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + sag * 4 * k * (1 - k)]
  return (
    <g>
      <path d={`M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}`} stroke={INK} strokeWidth="1" fill="none" />
      {Array.from({ length: n }, (_, i) => { const k = (i + 0.5) / n, [x, y] = pt(k); return <path key={i} d={`M${x - 4.5} ${y} L${x + 4.5} ${y} L${x} ${y + 8}Z`} fill={C4[i % 5]} stroke={INK} strokeWidth="0.8" /> })}
    </g>
  )
}
export { Lamp }

/** 보도블록 바닥 (y0 ~ 아래) */
export function Pavers({ y0, c = '#E9DDCB', line = 'rgba(42,33,24,0.14)' }: { y0: number; c?: string; line?: string }) {
  const rows: number[] = []
  for (let y = y0, h = 5; y < 182; y += h, h += 2.4) rows.push(y)
  return (
    <g>
      <rect y={y0} width="320" height={180 - y0} fill={c} />
      {rows.map((y, r) => {
        const h = (rows[r + 1] ?? 182) - y, w = h * 3.2
        return <g key={r}><path d={`M0 ${y} H320`} stroke={line} strokeWidth="1" />{Array.from({ length: Math.ceil(320 / w) + 1 }, (_, i) => <path key={i} d={`M${i * w + (r % 2) * w / 2} ${y} v${h}`} stroke={line} strokeWidth="1" />)}</g>
      })}
    </g>
  )
}
