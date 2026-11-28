// 장면 소품 (코드 그림). (x, y) = 바닥 가운데
import { useId, type ReactNode } from 'react'
import { INK } from './kit'
import { shade as shadeHex } from '../art/Character'
import type { Outfit } from '../engine/outfit'

/** 길 위 돌멩이 */
export function Stone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cy="1" rx="11" ry="2.5" fill="rgba(42,33,24,0.18)" />
      <path d="M-10 0 Q-11 -8 -3 -10 Q6 -12 10 -5 Q12 0 9 0Z" fill="#A39C90" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M-4 -7 q3 -2 6 -1" stroke="#CFC8BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** 옆에서 본 작은 자동차 (오른쪽을 봄). dent = 앞 범퍼 찌그러짐 0~1, spin = 바퀴 돌아간 각도 */
export function Car({ x, y, color = '#E0533F', dent = 0, spin = 0, flip, bob = 0, glass = 1, rear = 0, inside }: { x: number; y: number; color?: string; dent?: number; spin?: number; flip?: boolean; bob?: number; glass?: number; rear?: number; inside?: ReactNode }) {
  // inside = 차 안 (창문으로 보이는 것, 차 기준 좌표: 바닥 가운데가 0,0)
  const cid = useId().replace(/:/g, '')
  // glass = 유리 불투명도 (낮추면 안의 사람이 보임), rear = 뒤 범퍼 찌그러짐 0~1
  const d = dent * 7
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} -10) rotate(${spin})`}>
      <circle r="10" fill="#3A3434" stroke={INK} strokeWidth="2.2" />
      <circle r="4.5" fill="#CFCBC6" stroke={INK} strokeWidth="1.6" />
      <path d="M0 -4.5 V4.5 M-4.5 0 H4.5" stroke={INK} strokeWidth="1.2" />
    </g>
  )
  const r = rear * 6
  // 승용차 옆모습: 앞(오른쪽)은 길고 낮은 보닛, 비스듬한 앞유리, 지붕, 뒷유리, 짧은 트렁크
  const body = `M${-50 + r} -11 L${-51 + r} -24 Q${-50 + r} -29 ${-44 + r} -30 L-34 -31 L-21 -46 Q-18 -48 -14 -48 L6 -48 Q10 -48 13 -45 L25 -32 L${46 - d} -29 Q${53 - d} -28 ${53 - d * 0.6} -22 L${53 - d * 0.5} -11 Z`
  const winR = 'M-30 -33 L-19 -45 H-5 V-33Z', winF = 'M-1 -45 H8 Q10 -45 12 -43 L21 -33 H-1Z'
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cy="1" rx="50" ry="4" fill="rgba(42,33,24,0.2)" />
      <g transform={`translate(0 ${bob})`}>
        <path d={body} fill={color} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        {/* 바퀴 집 */}
        <path d="M-45 -11 A13 13 0 0 1 -19 -11Z M21 -11 A13 13 0 0 1 47 -11Z" fill="#3A3434" />
        {inside && <><clipPath id={`${cid}w`}><path d={`${winR} ${winF}`} /></clipPath><rect x="-31" y="-46" width="54" height="14" fill="#BFE4F7" clipPath={`url(#${cid}w)`} /><g clipPath={`url(#${cid}w)`}>{inside}</g></>}
        <path d={winR} fill="#BFE4F7" fillOpacity={glass} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d={winF} fill="#BFE4F7" fillOpacity={glass} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        {/* 문 선·손잡이·옆 거울 */}
        <path d="M-3 -33 V-12 M23 -31 Q25 -20 21 -12" stroke={shadeHex(color, -0.35)} strokeWidth="1.5" fill="none" />
        <path d="M-27 -33 V-14" stroke={shadeHex(color, -0.35)} strokeWidth="1.5" />
        <rect x="-14" y="-28" width="6" height="2.4" rx="1.2" fill={shadeHex(color, -0.4)} />
        <rect x="11" y="-28" width="6" height="2.4" rx="1.2" fill={shadeHex(color, -0.4)} />
        <path d="M21 -34 l5 -3 l2 4 z" fill={shadeHex(color, -0.15)} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M-46 -27 H44" stroke={shadeHex(color, 0.3)} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
        {/* 앞: 전조등(노랑) · 뒤: 후미등(빨강) · 범퍼 */}
        <path d={`M${45 - d} -28 L${52 - d} -27 L${52 - d * 0.6} -23 L${46 - d} -24Z`} fill="#FFF3A6" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <rect x={-51 + r} y="-28" width="5" height="6" rx="1.5" fill="#E0533F" stroke={INK} strokeWidth="1.5" />
        <rect x={45 - d * 0.6} y="-15" width="9" height="5" rx="2" fill="#6A6460" stroke={INK} strokeWidth="1.5" />
        <rect x={-53 + r} y="-15" width="8" height="5" rx="2" fill="#6A6460" stroke={INK} strokeWidth="1.5" />
        {dent > 0.3 && <path d={`M${50 - d} -26 l-3 3 l3 2 l-3 3`} stroke={INK} strokeWidth="1.6" fill="none" />}
        {rear > 0.3 && <path d={`M${-47 + r} -26 l3 3 l-3 2 l3 3`} stroke={INK} strokeWidth="1.6" fill="none" />}
      </g>
      {wheel(-32)}{wheel(34)}
    </g>
  )
}

/** 식탁 (옆에서). w = 너비 */
export function Table({ x, y, w = 120, h = 40, color = '#C98B55' }: { x: number; y: number; w?: number; h?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="1" rx={w / 2} ry="4" fill="rgba(42,33,24,0.16)" />
      {/* 다리 (아래로 살짝 가늘게) · 가로대 · 앞판 · 윗판 (나뭇결·빛) */}
      {[-w / 2 + 8, w / 2 - 15].map((lx) => <path key={lx} d={`M${lx} ${-h} H${lx + 7} L${lx + 6} 0 H${lx + 1}Z`} fill={shadeHex(color, -0.2)} stroke={INK} strokeWidth="2" strokeLinejoin="round" />)}
      <rect x={-w / 2 + 14} y={-h * 0.35} width={w - 28} height="3" fill={shadeHex(color, -0.25)} stroke={INK} strokeWidth="1.2" />
      <rect x={-w / 2 + 6} y={-h - 1} width={w - 12} height="6" fill={shadeHex(color, -0.1)} stroke={INK} strokeWidth="1.6" />
      <rect x={-w / 2} y={-h - 7} width={w} height="8" rx="3" fill={color} stroke={INK} strokeWidth="2.2" />
      <path d={`M${-w / 2 + 4} ${-h - 5} H${w / 2 - 4}`} stroke={shadeHex(color, 0.3)} strokeWidth="1.2" />
      <path d={`M${-w / 2 + 12} ${-h - 2.5} q10 -1.5 20 0 M${w / 2 - 40} ${-h - 2.5} q10 1.5 22 0`} stroke={shadeHex(color, -0.25)} strokeWidth="0.8" fill="none" />
    </g>
  )
}

/** 동그란 의자 (옆에서) */
export function Stool({ x, y, color = '#E0533F', h = 28 }: { x: number; y: number; color?: string; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M-9 0 L-6 ${6 - h} M9 0 L6 ${6 - h}`} stroke={INK} strokeWidth="2.6" />
      <rect x="-13" y={-h} width="26" height="7" rx="3.5" fill={color} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 동그란 의자 (앞에서 봄): 방석·다리 네 개·가로대 */
export function FrontStool({ x, y, h = 28, color = '#5FB36A' }: { x: number; y: number; h?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M-10 ${-h + 4} L-15 0 M10 ${-h + 4} L15 0 M-4 ${-h + 5} L-5 -1 M4 ${-h + 5} L5 -1`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d={`M-10 ${-h + 4} L-15 0 M10 ${-h + 4} L15 0`} stroke="#B9C3CF" strokeWidth="2" strokeLinecap="round" />
      <path d={`M-13 -9 H13`} stroke={INK} strokeWidth="1.8" />
      <ellipse cy={-h} rx="16" ry="4.5" fill={shadeHex(color, -0.25)} stroke={INK} strokeWidth="1.8" />
      <ellipse cy={-h - 2} rx="16" ry="4.5" fill={color} stroke={INK} strokeWidth="1.8" />
      <ellipse cx="-4" cy={-h - 3} rx="6" ry="1.4" fill="rgba(255,255,255,0.4)" />
    </g>
  )
}

/** 앞을 보고 앉은 사람의 다리 (의자 위 무릎 → 정강이 → 신발). (x, y) = 바닥 가운데. 윗몸은 FrontActor를 엉덩이 위로 잘라 따로 그림 */
export function SeatedLegs({ c, x, y }: { c: { outfit: Outfit }; x: number; y: number }) {
  const o = c.outfit
  const dress = o.top === 'dress'
  const pants = !dress && ['pants', 'jeans', 'track'].includes(o.bottom)
  const legC = pants ? o.bottomColor : o.skin
  const skirtC = dress ? o.topColor : o.bottomColor
  const longSkirt = !dress && o.bottom === 'longskirt'
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {/* 정강이 */}
      {[-5, 5].map((dx) => <g key={dx}><path d={`M${dx} -25 V-5`} stroke={INK} strokeWidth="9.4" strokeLinecap="round" /><path d={`M${dx} -25 V-5`} stroke={legC} strokeWidth="6.4" strokeLinecap="round" /></g>)}
      {/* 신발 (앞코가 보는 사람 쪽) */}
      {[-5.5, 5.5].map((dx) => <path key={dx} d={`M${dx - 5} -1 Q${dx - 5} -6 ${dx} -6 Q${dx + 5} -6 ${dx + 5} -1 Q${dx} 1.5 ${dx - 5} -1Z`} fill={o.shoesColor} stroke={INK} strokeWidth="1.5" />)}
      {/* 허벅지 (앞으로 나와 짧게 보임) · 무릎 */}
      <path d="M-11 -33 H11 V-26 Q11 -22 6 -22 Q0 -23 -6 -22 Q-11 -22 -11 -26Z" fill={pants ? o.bottomColor : o.skin} stroke={INK} strokeWidth="1.6" />
      {pants && <path d="M0 -32 V-23" stroke="rgba(42,33,24,0.35)" strokeWidth="1.2" />}
      {/* 치마·원피스는 무릎을 덮음 */}
      {!pants && o.bottom !== 'shorts' && <path d={`M-13 -34 H13 L${longSkirt ? 15 : 13} ${longSkirt ? -8 : -21} Q0 ${longSkirt ? -5 : -18} ${longSkirt ? -15 : -13} ${longSkirt ? -8 : -21}Z`} fill={skirtC} stroke={INK} strokeWidth="1.6" />}
      {!dress && o.bottom === 'shorts' && <path d="M-12 -34 H12 V-28 H-12Z" fill={o.bottomColor} stroke={INK} strokeWidth="1.6" />}
    </g>
  )
}

/** 분식집 떡볶이 접시 (초록 플라스틱). n = 남은 떡 수 (0~6) */
export function Plate({ x, y, n = 6, fish = 2 }: { x: number; y: number; n?: number; fish?: number }) {
  const cakes = [[-9, -6, -8], [-2, -7, 6], [5, -6, -4], [-6, -9, 14], [2, -10, -12], [9, -9, 10]].slice(0, Math.max(0, Math.round(n)))
  return (
    <g transform={`translate(${x} ${y})`}>
      {n > 0.2 && <path d={`M-15 -4 Q-13 ${-6 - n * 0.6} 0 ${-7 - n * 0.6} Q13 ${-6 - n * 0.6} 15 -4Z`} fill="#D9372A" stroke={INK} strokeWidth="1.4" />}
      {n > 0.5 && fish > 0 && <path d="M-3 -9 L5 -14 L7 -6Z" fill="#E8B070" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />}
      {n > 2.5 && fish > 1 && <path d="M-12 -7 L-5 -12 L-4 -5Z" fill="#E8B070" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />}
      {cakes.map(([cx, cy, r], i) => <rect key={i} x={cx - 5.5} y={cy - 1.8} width="11" height="3.6" rx="1.8" fill="#F59A7E" stroke="#A32218" strokeWidth="1.1" transform={`rotate(${r} ${cx} ${cy})`} />)}
      {n > 0.2 && <path d="M-8 -5 q2 -2 4 0 M4 -5 q2 -2 4 0" stroke="#A32218" strokeWidth="1" fill="none" />}
      <path d="M-18 -4 H18 Q16 1 12 1 H-12 Q-16 1 -18 -4Z" fill="#5FB36A" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  )
}

/** 젓가락 (손에 듦, 위쪽이 끝). food = 집은 떡 */
export function Chopsticks({ food }: { food?: boolean }) {
  return (
    <g>
      <path d="M-1.5 4 L-1 -20 M1.5 4 L2.4 -20" stroke="#8A6A4A" strokeWidth="1.7" strokeLinecap="round" />
      {food && <rect x="-4.5" y="-23" width="9" height="4" rx="2" fill="#FFF1DA" stroke="#D9372A" strokeWidth="1.3" transform="rotate(80 0 -21)" />}
    </g>
  )
}
