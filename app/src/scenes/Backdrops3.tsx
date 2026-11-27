// 장면 배경 더: 결혼식장·병실·새 집·회사·졸업식·놀이동산·밤 방·텃밭
import { Bush, Flowers, Tree } from './Nature'
import { INK, seg } from './kit'
import { W, H, GROUND } from './Stage'

/** 결혼식장 (아치 + 꽃 + 버진로드) */
export function WeddingHall() {
  return (
    <g>
      <rect width={W} height={H} fill="#FBEFF2" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 40 + 10} 0 V${GROUND}`} stroke="#F4DDE3" strokeWidth="8" />)}
      {/* 아치 */}
      <path d="M190 158 V62 Q236 4 282 62 V158" fill="none" stroke="#E8C9D2" strokeWidth="12" />
      <path d="M190 158 V62 Q236 4 282 62 V158" fill="none" stroke={INK} strokeWidth="2" />
      {[[194, 66], [208, 38], [236, 24], [264, 38], [278, 66], [192, 110], [280, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={i % 2 ? '#F7B8C8' : '#fff'} stroke={INK} strokeWidth="1.3" />)}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#E9DDD0" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      <path d={`M0 ${GROUND + 4} H${W} V${GROUND + 14} H0Z`} fill="#E0533F" opacity="0.8" />
    </g>
  )
}

/** 병실 (침대) */
export function BabyRoom() {
  return (
    <g>
      <rect width={W} height={H} fill="#EAF4F8" />
      <g transform="translate(220 26)">
        <rect width="74" height="54" rx="6" fill="#BFE4F7" stroke={INK} strokeWidth="2.2" />
        <path d="M37 0 V54 M0 27 H74" stroke={INK} strokeWidth="1.8" />
      </g>
      <g transform="translate(24 30)"><rect width="34" height="24" rx="4" fill="#fff" stroke={INK} strokeWidth="1.8" /><path d="M17 6 v12 M11 12 h12" stroke="#F2708A" strokeWidth="3.4" strokeLinecap="round" /></g>
      {/* 침대 */}
      <g transform="translate(70 158)">
        <rect x="-4" y="-56" width="8" height="56" rx="3" fill="#C9D6E0" stroke={INK} strokeWidth="2" />
        <rect x="0" y="-34" width="90" height="16" rx="5" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="58" y="-38" width="30" height="20" rx="6" fill="#F7D3E2" stroke={INK} strokeWidth="1.8" />
        <path d="M8 -18 V0 M84 -18 V0" stroke={INK} strokeWidth="3" />
      </g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D8E2E8" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 새 집 앞 (문: open 0~1). lit = 창문 불 켜짐 */
/** 문 위치 (큰 집): 왼쪽 x · 폭 · 위 y */
export const DOOR = { x: 198, w: 32, y: 74 }
/** 사람 크기 (집 장면은 집이 커 보이게 사람을 조금 작게) */
export const HOUSE_SIZE = 44
export function HouseFront({ open = 0, lit = 0, stormy = 0, banner, boxes }: { open?: number; lit?: number; stormy?: number; banner?: string; boxes?: boolean }) {
  // 높은 1층 + 다락 창이 있는 집: 문이 사람 키보다 큼. 지붕 기와 · 굴뚝 · 큰 창 2 · 현관(차양·등·문패·계단) · 우편함 · 울타리 · 나무
  const win = (x: number, y: number, w: number, h: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} rx="2" fill={lit ? '#FFE9A0' : stormy ? '#9AAAB8' : '#BFE4F7'} stroke={INK} strokeWidth="2" />
      {!lit && <path d={`M${x + 4} ${y + 4} l8 0 l-8 8z`} fill="#fff" opacity="0.6" />}
      <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke="#FFFDF5" strokeWidth="2.6" />
      <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke={INK} strokeWidth="0.8" opacity="0.5" />
      <rect x={x - 3} y={y + h} width={w + 6} height="4" rx="1.5" fill="#E3C79A" stroke={INK} strokeWidth="1.4" />
      {/* 창 아래 화분 */}
      {!stormy && <g>{[0.2, 0.5, 0.8].map((k, i) => <circle key={i} cx={x + w * k} cy={y + h - 1} r="2.6" fill={['#F2708A', '#FFE27A', '#F7A3B8'][i]} stroke={INK} strokeWidth="0.8" />)}</g>}
    </g>
  )
  return (
    <g>
      <defs><linearGradient id="hf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stormy ? '#6E7C8E' : '#9ED3F0'} /><stop offset="1" stopColor={stormy ? '#AEB8C4' : '#E8F5FB'} /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#hf-sky)" />
      {!stormy && <path d="M30 30 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H30Z M70 56 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H70Z" fill="#fff" />}
      <rect y="124" width={W} height={H - 124} fill="#8CC377" />
      <path d={`M0 124 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 나무 · 덤불 */}
      <g transform={stormy ? 'rotate(6 40 125)' : undefined}><Tree x={40} y={125} s={1.05} c={stormy ? '#6E9A62' : '#7FB86A'} /></g>
      <Bush x={84} y={125} s={0.7} c={stormy ? '#5E8A52' : '#6FAF5E'} flowers={stormy ? undefined : '#F2708A'} />
      {/* 굴뚝 · 지붕 (다락 둥근 창) */}
      <rect x="268" y="12" width="16" height="34" fill="#A8553E" stroke={INK} strokeWidth="2" />
      <rect x="265" y="8" width="22" height="6" rx="1.5" fill="#8E4532" stroke={INK} strokeWidth="1.6" />
      <path d="M110 68 L214 6 L320 68Z" fill="#C9694F" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      {[58, 46, 34, 22].map((y) => <path key={y} d={`M${110 + (68 - y) * 1.68 + 5} ${y} H${320 - (68 - y) * 1.71 - 5}`} stroke="#A8553E" strokeWidth="1.6" />)}
      <circle cx="214" cy="40" r="11" fill={lit ? '#FFE9A0' : stormy ? '#9AAAB8' : '#BFE4F7'} stroke={INK} strokeWidth="2" />
      <path d="M214 29 V51 M203 40 H225" stroke="#FFFDF5" strokeWidth="2" />
      {/* 벽 */}
      <rect x="122" y="66" width="186" height="92" fill="#F6E7CF" stroke={INK} strokeWidth="2.6" />
      {[90, 112, 134].map((y) => <path key={y} d={`M124 ${y} H306`} stroke="#EBD8B8" strokeWidth="1.4" />)}
      {win(136, 84, 44, 40)}{win(250, 84, 44, 40)}
      {/* 현관: 차양 · 등 · 문(창·손잡이) · 문패 · 계단 */}
      <path d={`M${DOOR.x - 10} ${DOOR.y - 2} H${DOOR.x + DOOR.w + 10} L${DOOR.x + DOOR.w + 5} ${DOOR.y - 11} H${DOOR.x - 5}Z`} fill="#A8553E" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={DOOR.x - 9} cy={DOOR.y + 12} r="3.2" fill={lit ? '#FFE27A' : '#F4F0E6'} stroke={INK} strokeWidth="1.2" />
      <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={158 - DOOR.y} fill="#5A3A22" stroke={INK} strokeWidth="2" />
      {open > 0 && <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={158 - DOOR.y} fill="#FFE9A0" opacity={open} />}
      <rect x={DOOR.x} y={DOOR.y} width={DOOR.w * (1 - open * 0.8)} height={158 - DOOR.y} fill="#9A6A3E" stroke={INK} strokeWidth="2" />
      {open < 0.5 && <><rect x={DOOR.x + 6} y={DOOR.y + 8} width={DOOR.w - 12} height="20" rx="3" fill="#BFE4F7" stroke="#7A4A2A" strokeWidth="1.4" /><rect x={DOOR.x + 6} y={DOOR.y + 36} width={DOOR.w - 12} height="34" rx="2" fill="none" stroke="#7A4A2A" strokeWidth="1.4" /><circle cx={DOOR.x + DOOR.w - 6} cy={DOOR.y + 46} r="2.6" fill="#F2C230" stroke={INK} strokeWidth="1" /></>}
      <rect x={DOOR.x + DOOR.w + 8} y={DOOR.y + 4} width="16" height="9" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <path d={`M${DOOR.x + DOOR.w + 11} ${DOOR.y + 8.5} h10`} stroke={INK} strokeWidth="1" />
      <rect x={DOOR.x - 8} y="154" width={DOOR.w + 16} height="5" rx="1" fill="#CFC4B3" stroke={INK} strokeWidth="1.4" />
      {/* 우편함 */}
      <g transform="translate(112 158)"><path d="M0 0 V-22" stroke="#7A5232" strokeWidth="3" /><rect x="-8" y="-32" width="16" height="11" rx="5" fill="#E0533F" stroke={INK} strokeWidth="1.6" /></g>
      {/* 축 입주 현수막 (처마 아래) */}
      {banner && <g transform="translate(214 60)">
        <path d="M-62 -4 Q0 4 62 -4" stroke={INK} strokeWidth="1.2" fill="none" />
        <rect x="-46" y="-2" width="92" height="17" rx="2" fill="#E0533F" stroke={INK} strokeWidth="1.8" />
        <text textAnchor="middle" y="11" fontSize="11" fill="#FFF3A6">{banner}</text>
      </g>}
      {/* 이삿짐 상자 */}
      {boxes && <g>
        {[[166, 158, 22, 18], [169, 140, 16, 14], [246, 158, 22, 16], [270, 158, 18, 22]].map(([x, y, w, h], i) => <g key={i}><rect x={x} y={y - h} width={w} height={h} fill="#D9A866" stroke={INK} strokeWidth="1.6" /><path d={`M${x} ${y - h + 5} H${x + w} M${x + w / 2} ${y - h} V${y - h + 5}`} stroke="#A87A3E" strokeWidth="1.4" /></g>)}
      </g>}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D9C49A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      {/* 울타리 */}
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={i * 20 + 2} y="122" width="8" height="26" rx="2" fill="#fff" stroke={INK} strokeWidth="1.5" />)}
      <path d="M0 130 H104 M0 142 H104" stroke={INK} strokeWidth="1.5" />
    </g>
  )
}

/** 회사 사무실 */
export function Office() {
  // 사무실: 큰 창 밖 도시 빌딩(불 켜진 창·구름) · 블라인드 · 회사 이름 · 벽시계 · 그래프 판 · 뒤쪽 책상과 모니터 · 화분
  const blds = [[4, 34, 22, '#C9D6E6'], [28, 20, 18, '#B8C8DC'], [48, 40, 26, '#D6DEE9'], [76, 14, 20, '#AFC1D6'], [98, 30, 22, '#C9D6E6']]
  return (
    <g>
      <rect width={W} height={H} fill="#EEF0F4" />
      <rect y={GROUND - 30} width={W} height="30" fill="#E2E6EC" />
      <g transform="translate(16 20)">
        <clipPath id="of-win"><rect width="124" height="70" rx="3" /></clipPath>
        <rect width="124" height="70" rx="3" fill="#9ED3F0" />
        <g clipPath="url(#of-win)">
          <path d="M10 16 q5 -8 13 -4 q6 -6 13 0 q8 0 6 6 H10Z M78 10 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H78Z" fill="#fff" />
          {blds.map(([x, y, w, c], i) => <g key={i}><rect x={x as number} y={y as number} width={w as number} height={80} fill={c as string} stroke="#8A9AB0" strokeWidth="1.2" />{Array.from({ length: 6 }, (_, r) => Array.from({ length: Math.floor((w as number) / 7) }, (_, k) => <rect key={`${r}-${k}`} x={(x as number) + 3 + k * 7} y={(y as number) + 5 + r * 9} width="3.6" height="5" fill={(r + k + i) % 3 ? '#EAF4FB' : '#FFF3A6'} />))}</g>)}
        </g>
        <rect width="124" height="70" rx="3" fill="none" stroke={INK} strokeWidth="2.2" />
        {[0, 1, 2].map((i) => <path key={i} d={`M${i * 41 + 41} 0 V70`} stroke="#FFFDF5" strokeWidth="3" />)}
        <rect x="-3" y="-6" width="130" height="10" fill="#DCE2EA" stroke={INK} strokeWidth="1.6" />
        {[0, 1, 2].map((i) => <path key={i} d={`M-2 ${-3 + i * 3} H126`} stroke="#B8C2CE" strokeWidth="1" />)}
      </g>
      {/* 회사 이름 · 벽시계 · 그래프 */}
      <rect x="156" y="16" width="70" height="16" rx="3" fill="#2E6FD8" stroke={INK} strokeWidth="1.6" />
      <text x="191" y="28" textAnchor="middle" fontSize="9" fill="#fff">데굴 주식회사</text>
      <g transform="translate(240 24)"><circle r="9" fill="#fff" stroke={INK} strokeWidth="1.8" /><path d="M0 0 V-6 M0 0 L4 2" stroke={INK} strokeWidth="1.4" strokeLinecap="round" /></g>
      <g transform="translate(256 40)"><rect width="50" height="36" rx="3" fill="#fff" stroke={INK} strokeWidth="1.8" /><path d="M6 30 V20 M14 30 V14 M22 30 V18 M30 30 V10 M38 30 V6" stroke="#5E8FC9" strokeWidth="4" /><path d="M6 18 L14 12 L22 16 L30 8 L40 4" stroke="#E0533F" strokeWidth="1.6" fill="none" /></g>
      {/* 뒤쪽 책상 + 모니터 */}
      <g transform="translate(176 128)">
        <rect x="-26" y="0" width="52" height="5" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.4" />
        <path d="M-22 5 V30 M22 5 V30" stroke={INK} strokeWidth="2" />
        <rect x="-12" y="-20" width="24" height="16" rx="2" fill="#2A2A2A" stroke={INK} strokeWidth="1.4" /><rect x="-10" y="-18" width="20" height="12" fill="#7FCBE8" />
        <path d="M0 -4 V0" stroke={INK} strokeWidth="2" />
      </g>
      {/* 화분 */}
      <g transform="translate(302 158)">
        <path d="M-11 0 L-13 -20 H13 L11 0Z" fill="#C2884F" stroke={INK} strokeWidth="1.8" />
        <path d="M0 -20 Q-4 -40 -16 -48 M0 -20 Q2 -44 8 -54 M0 -20 Q8 -36 18 -40" stroke="#4E8A3A" strokeWidth="2" fill="none" />
        {[[-16, -48, -30], [8, -54, 10], [18, -40, 40], [-8, -36, -50], [6, -32, 30]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="4.5" fill={i % 2 ? '#7FBF6A' : '#6FAF5E'} stroke={INK} strokeWidth="1.2" transform={`rotate(${r} ${x} ${y})`} />)}
      </g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="#B9C2CE" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 44} ${GROUND} L${i * 44 - 14} ${H}`} stroke="rgba(42,33,24,0.12)" strokeWidth="1.6" />)}
    </g>
  )
}

/** 졸업식 (강당 + 현수막) */
export function GradHall() {
  return (
    <g>
      <rect width={W} height={H} fill="#F4ECDD" />
      <path d="M0 0 Q30 40 0 100Z M320 0 Q290 40 320 100Z" fill="#B03A3A" stroke={INK} strokeWidth="2" />
      <g transform="translate(160 4)">
        <rect x="-50" y="0" width="100" height="24" rx="4" fill="#2A4A8A" stroke={INK} strokeWidth="2" />
        <text textAnchor="middle" y="17" fontSize="14" fill="#FFE27A">졸업식</text>
      </g>
      <rect y={GROUND - 10} width={W} height="10" fill="#C98B55" stroke={INK} strokeWidth="1.8" />
      <rect y={GROUND} width={W} height={H - GROUND} fill="#A8784A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 놀이동산: 대관람차 + 롤러코스터 레일. railY(x) = 레일 높이 */
export const railY = (x: number) => 118 - 34 * Math.sin(((x - 20) / 280) * Math.PI) ** 2 + 18 * Math.sin(((x - 20) / 280) * Math.PI * 3)
export function Amusement({ t }: { t: number }) {
  let rail = ''
  for (let x = -20; x <= W + 20; x += 8) rail += `${x === -20 ? 'M' : 'L'}${x} ${railY(x)}`
  return (
    <g>
      <defs><linearGradient id="am-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD6A8" /><stop offset="1" stopColor="#FFF0D8" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#am-sky)" />
      {/* 대관람차 */}
      <g transform="translate(62 70)">
        <circle r="46" fill="none" stroke="#C77FD0" strokeWidth="3" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = t * 0.4 + (i * Math.PI) / 4
          return <g key={i}><path d={`M0 0 L${Math.cos(a) * 46} ${Math.sin(a) * 46}`} stroke="#C77FD0" strokeWidth="1.5" /><rect x={Math.cos(a) * 46 - 6} y={Math.sin(a) * 46} width="12" height="9" rx="3" fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A'][i % 4]} stroke={INK} strokeWidth="1.3" /></g>
        })}
        <path d="M-20 88 L0 0 L20 88" stroke={INK} strokeWidth="3" fill="none" />
      </g>
      {/* 구름 · 천막 · 나무 */}
      <path d="M150 26 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H150Z M240 40 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H240Z" fill="#fff" />
      {[[170, '#E0533F'], [268, '#5E8FC9']].map(([x, c], i) => <g key={i} transform={`translate(${x} ${GROUND})`}><rect x="-20" y="-24" width="40" height="24" fill="#FFF6EA" stroke={INK} strokeWidth="1.6" />{[0, 1, 2, 3].map((k) => <rect key={k} x={-20 + k * 10} y="-24" width="5" height="24" fill={c as string} opacity="0.7" />)}<path d="M-24 -24 L0 -44 L24 -24Z" fill={c as string} stroke={INK} strokeWidth="1.6" /><path d="M0 -44 V-52 l7 3 l-7 3" fill="#F2C230" stroke={INK} strokeWidth="1" /></g>)}
      <Tree x={118} y={GROUND + 1} s={0.6} />
      {/* 레일 기둥 */}
      {Array.from({ length: 9 }, (_, i) => { const x = i * 40 + 10; return <path key={i} d={`M${x} ${railY(x)} V${GROUND}`} stroke="#8A6A9A" strokeWidth="2.4" /> })}
      <path d={rail} fill="none" stroke={INK} strokeWidth="5" />
      <path d={rail} fill="none" stroke="#E0533F" strokeWidth="2.6" />
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D9C49A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
    </g>
  )
}

/** 밤 방 (창밖이 밤 → 아침으로). dawn 0~1 */
export function NightRoom({ dawn = 0 }: { dawn?: number }) {
  const sky = dawn < 0.5 ? '#1E2A44' : '#FFC98A'
  return (
    <g>
      <rect width={W} height={H} fill={dawn > 0.5 ? '#E6D8C2' : '#3A3350'} />
      <g transform="translate(206 24)">
        <rect width="80" height="58" rx="5" fill={sky} stroke={INK} strokeWidth="2.2" />
        {dawn < 0.5 ? <><circle cx="58" cy="18" r="8" fill="#FFF3A6" /><circle cx="54" cy="15" r="7" fill={sky} /></> : <circle cx="40" cy={52 - dawn * 20} r="11" fill="#FFD23F" stroke={INK} strokeWidth="1.4" />}
        <path d="M40 0 V58 M0 29 H80" stroke={INK} strokeWidth="1.8" />
      </g>
      {/* 시계 */}
      <g transform="translate(60 40)">
        <circle r="13" fill="#fff" stroke={INK} strokeWidth="2" />
        <path d={`M0 0 L${Math.sin(dawn * 6) * 7} ${-Math.cos(dawn * 6) * 7} M0 0 L0 -10`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${dawn * 720})`} />
      </g>
      <rect y={GROUND} width={W} height={H - GROUND} fill={dawn > 0.5 ? '#C99B6B' : '#2A2238'} />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}

/** 텃밭 (흙 두둑) */
export function Garden() {
  return (
    <g>
      <defs><linearGradient id="gd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE4F7" /><stop offset="1" stopColor="#F2F8E6" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#gd-sky)" />
      <circle cx="270" cy="34" r="16" fill="#FFD23F" stroke={INK} strokeWidth="1.8" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${270 + Math.cos(i * 0.785) * 21} ${34 + Math.sin(i * 0.785) * 21} l${Math.cos(i * 0.785) * 6} ${Math.sin(i * 0.785) * 6}`} stroke="#F2B230" strokeWidth="2" strokeLinecap="round" />)}
      <path d="M40 30 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H40Z M150 44 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H150Z" fill="#fff" stroke="#D8E6EE" strokeWidth="1.2" />
      {/* 먼 언덕 · 나무 · 창고 */}
      <path d="M-10 108 Q60 70 140 100 Q200 80 330 104 V110 H-10Z" fill="#A6D98F" stroke={INK} strokeWidth="1.6" />
      <Tree x={36} y={104} s={0.62} />
      <Tree x={300} y={102} s={0.55} c="#8CC77A" flip />
      <g transform="translate(206 102)"><rect x="-18" y="-22" width="36" height="22" fill="#C9694F" stroke={INK} strokeWidth="1.6" /><path d="M-22 -22 L0 -36 L22 -22Z" fill="#8A4A3A" stroke={INK} strokeWidth="1.6" /><rect x="-6" y="-14" width="12" height="14" fill="#7A4A2A" stroke={INK} strokeWidth="1.2" /></g>
      <rect y="108" width={W} height={H - 108} fill="#8CC377" />
      <path d={`M0 108 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 울타리 */}
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 28 + 4} y="88" width="6" height="22" rx="2" fill="#C98B55" stroke={INK} strokeWidth="1.3" />)}
      <path d={`M0 96 H${W}`} stroke={INK} strokeWidth="1.5" />
      <Flowers x0={0} x1={W} y={112} seed={2} />
      {/* 허수아비 */}
      <g transform="translate(300 124)"><path d="M0 0 V-34 M-14 -24 H14" stroke="#8A5A34" strokeWidth="2.6" /><circle cy="-38" r="6" fill="#F4D9A8" stroke={INK} strokeWidth="1.3" /><path d="M-9 -40 H9 L4 -48 H-4Z" fill="#C2884F" stroke={INK} strokeWidth="1.2" /><rect x="-8" y="-30" width="16" height="14" fill="#5E8FC9" stroke={INK} strokeWidth="1.2" /></g>
      <rect y={GROUND - 8} width={W} height={H - GROUND + 8} fill="#9A6A3E" />
      <path d={`M0 ${GROUND - 8} Q40 ${GROUND - 16} 80 ${GROUND - 8} T160 ${GROUND - 8} T240 ${GROUND - 8} T320 ${GROUND - 8}`} fill="#7A5232" stroke={INK} strokeWidth="2" />
    </g>
  )
}

/** 시간에 따라 해 질 녘 하늘 (데이트) */
export const duskSky = (t: number, t0: number, t1: number) => seg(t, t0, t1)

/** 놀이터 (미끄럼틀·그네·모래) */
export function Playground() {
  return (
    <g>
      <defs><linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE4F7" /><stop offset="1" stopColor="#EEF8E6" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#pg-sky)" />
      <path d="M120 30 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H120Z M220 20 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H220Z" fill="#fff" stroke="#D8E6EE" strokeWidth="1.2" />
      <Tree x={150} y={113} s={0.85} />
      <Tree x={310} y={113} s={0.7} c="#8CC77A" flip />
      <rect y="112" width={W} height={H - 112} fill="#8CC377" />
      <path d={`M0 112 H${W}`} stroke={INK} strokeWidth="2" />
      <Bush x={196} y={114} s={0.6} flowers="#FFE27A" />
      {/* 벤치 */}
      <g transform="translate(186 128)"><path d="M-18 0 V-10 M18 0 V-10" stroke={INK} strokeWidth="2" /><rect x="-22" y="-14" width="44" height="5" rx="2" fill="#C98B55" stroke={INK} strokeWidth="1.4" /><rect x="-22" y="-24" width="44" height="5" rx="2" fill="#C98B55" stroke={INK} strokeWidth="1.4" /></g>
      {/* 미끄럼틀 */}
      <g transform="translate(40 0)">
        <path d="M0 132 V62 M22 132 V62" stroke={INK} strokeWidth="3" />
        {[74, 88, 102, 116].map((y) => <path key={y} d={`M0 ${y} H22`} stroke={INK} strokeWidth="2.4" />)}
        <rect x="-4" y="56" width="30" height="8" rx="3" fill="#E0533F" stroke={INK} strokeWidth="2" />
        <path d="M26 60 Q60 70 80 128 L90 128 Q70 64 30 52Z" fill="#F2C230" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
      {/* 그네 */}
      <g transform="translate(250 0)">
        <path d="M-34 130 L-24 54 H24 L34 130" fill="none" stroke="#5E8FC9" strokeWidth="4" />
        <path d="M-24 54 H24" stroke={INK} strokeWidth="2" />
        <path d="M-10 56 V100 M6 56 V100" stroke={INK} strokeWidth="1.5" />
        <rect x="-14" y="100" width="24" height="5" rx="2" fill="#C98B55" stroke={INK} strokeWidth="1.5" />
      </g>
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#E8D7A8" />
      <path d={`M0 ${GROUND - 6} H${W}`} stroke="rgba(42,33,24,0.35)" strokeWidth="2" />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={(i * 47) % W} cy={GROUND + 4 + (i % 3) * 5} r="1.4" fill="#C9B07A" />)}
      {/* 모래놀이 양동이 · 삽 */}
      <g transform={`translate(140 ${GROUND + 8})`}><path d="M-6 0 L-5 -9 H5 L6 0Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.2" /><path d="M-5 -9 Q0 -15 5 -9" stroke={INK} strokeWidth="1" fill="none" /><path d="M10 0 L18 -10" stroke="#E0533F" strokeWidth="2" /><path d="M8 -1 l4 2 l-1 -5z" fill="#E0533F" /></g>
    </g>
  )
}
