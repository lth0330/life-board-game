// 장면 배경 더: 결혼식장·병실·새 집·회사·졸업식·놀이동산·밤 방·텃밭
import { Bush, Flowers, Tree } from './Nature'
import { INK, seg } from './kit'
import { FerrisWheel, Tent } from './Amuse'
import { W, H, GROUND } from './Stage'



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
      <Bush x={100} y={125} s={0.6} c={stormy ? '#5E8A52' : '#6FAF5E'} flowers={stormy ? undefined : '#F2708A'} />
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
      {/* 이삿짐 상자 */}
      {boxes && <g>
        {[[166, 158, 22, 18], [169, 140, 16, 14], [246, 158, 22, 16], [270, 158, 18, 22]].map(([x, y, w, h], i) => <g key={i}><rect x={x} y={y - h} width={w} height={h} fill="#D9A866" stroke={INK} strokeWidth="1.6" /><path d={`M${x} ${y - h + 5} H${x + w} M${x + w / 2} ${y - h} V${y - h + 5}`} stroke="#A87A3E" strokeWidth="1.4" /></g>)}
      </g>}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D9C49A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      {/* 울타리 */}
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={i * 20 + 2} y="122" width="8" height="26" rx="2" fill="#fff" stroke={INK} strokeWidth="1.5" />)}
      <path d="M0 130 H104 M0 142 H104" stroke={INK} strokeWidth="1.5" />
      {/* 축하 화환 (세 발 받침 · 꽃 둥근 띠 · 글씨 리본) + 우편함에 묶은 풍선 (11-28 사용자: 문 위 말고 따로 축하하는 물건에) */}
      {banner && <CongratsWreath x={70} y={GROUND} text={banner} />}
      {banner && <Balloons x={112} y={130} />}
    </g>
  )
}

/** 축하 화환: (x, y) = 받침 발 가운데. 리본에 세로 글씨 */
export function CongratsWreath({ x, y, text, from = '친구들 일동' }: { x: number; y: number; text: string; from?: string }) {
  const cy = -62, r = 19
  const ring = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * r, cy + Math.sin(a) * r, i] as const })
  const cs = ['#F2708A', '#FFFFFF', '#FFE27A', '#F7A3B8', '#E0533F', '#FFFFFF', '#C77FD0', '#FFE27A']
  const vtext = (s: string, tx: number, ty: number, fs: number, c: string) => s.replace(/ /g, '').split('').map((ch, i) => <text key={i} x={tx} y={ty + i * (fs + 1)} textAnchor="middle" fontSize={fs} fill={c}>{ch}</text>)
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
      {/* 받침 */}
      <path d={`M0 ${cy + 10} L-14 0 M0 ${cy + 10} L14 0 M0 ${cy + 10} V0 M-9 -18 H9`} stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M0 ${cy + 10} L-14 0 M0 ${cy + 10} L14 0 M0 ${cy + 10} V0`} stroke="#C9A06A" strokeWidth="1.8" strokeLinecap="round" />
      {/* 잎 바탕 */}
      <circle cy={cy} r={r + 7} fill="#5E9A50" stroke={INK} strokeWidth="1.8" />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 360; return <ellipse key={i} cx="0" cy={-(r + 6)} rx="3" ry="5.4" fill="#6FAF5E" stroke={INK} strokeWidth="0.8" transform={`translate(0 ${cy}) rotate(${a})`} /> })}
      <circle cy={cy} r={r - 7} fill="#FFFDF5" stroke={INK} strokeWidth="1.4" />
      {/* 가운데 */}
      <circle cy={cy} r="5" fill="#F2708A" stroke={INK} strokeWidth="1" />
      <path d={`M-2 ${cy - 1} q2 -3 4 0 q-1 3 -3 2`} stroke="rgba(42,33,24,0.5)" strokeWidth="0.8" fill="none" />
      {/* 꽃 띠 */}
      {ring.map(([fx, fy, i]) => (
        <g key={i} transform={`translate(${fx} ${fy})`}>
          <circle r="4.6" fill={cs[i % cs.length]} stroke={INK} strokeWidth="1" />
          {i % 2 === 0 ? <path d="M-2 0 q2 -3 4 0 q-1 3 -3 1.6" stroke="rgba(42,33,24,0.45)" strokeWidth="0.7" fill="none" /> : <circle r="1.4" fill="#F2C230" />}
        </g>
      ))}
      {/* 리본 두 줄 (글씨) */}
      <path d={`M-11 ${cy + 14} L-17 ${cy + 64} L-12 ${cy + 60} L-7 ${cy + 65} L-2 ${cy + 16}Z`} fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
      <path d={`M11 ${cy + 14} L17 ${cy + 64} L12 ${cy + 60} L7 ${cy + 65} L2 ${cy + 16}Z`} fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
      <g transform={`rotate(7 -6.5 ${cy + 15})`}>{vtext(text, -6.5, cy + 28, 7.5, '#C0392B')}</g>
      <g transform={`rotate(-7 6.5 ${cy + 15})`}>{vtext(from, 6.5, cy + 26, 5.6, INK)}</g>
      {/* 리본 매듭 */}
      <path d={`M0 ${cy + 15} q-8 -6 -9 0 q2 4 9 0 q8 -6 9 0 q-2 4 -9 0`} fill="#E0533F" stroke={INK} strokeWidth="1" />
    </g>
  )
}

/** 풍선 세 개: (x, y) = 끈을 묶은 곳 */
export function Balloons({ x, y, t = 0 }: { x: number; y: number; t?: number }) {
  const bs: [number, number, string][] = [[-12, -50, '#F2708A'], [2, -58, '#FFE27A'], [14, -46, '#7FCBE8']]
  return (
    <g transform={`translate(${x} ${y})`}>
      {bs.map(([bx, by, c], i) => {
        const sw = Math.sin(t * 1.6 + i) * 2
        return (
          <g key={i}>
            <path d={`M0 0 Q${bx * 0.4 + sw} ${by * 0.5} ${bx + sw} ${by + 11}`} stroke={INK} strokeWidth="0.8" fill="none" />
            <g transform={`translate(${bx + sw} ${by})`}>
              <path d="M0 -10 C7 -10 9 -3 8 2 C7 7 3 10 0 10 C-3 10 -7 7 -8 2 C-9 -3 -7 -10 0 -10Z" fill={c} stroke={INK} strokeWidth="1.4" />
              <path d="M-1.6 10 L0 12.4 L1.6 10Z" fill={c} stroke={INK} strokeWidth="1" />
              <ellipse cx="-3.4" cy="-4" rx="1.6" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(20 -3.4 -4)" />
            </g>
          </g>
        )
      })}
      <path d="M-2 0 q2 2 4 0" stroke={INK} strokeWidth="1" fill="none" />
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
      <rect y={GROUND - 30} width={W} height="30" fill="#E2E6EC" />      {/* 천장 조명 · 아래 벽 판 · 걸레받이 */}
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 34 + 4} y={GROUND - 26} width="26" height="20" rx="1.5" fill="none" stroke="rgba(120,130,150,0.3)" strokeWidth="1.1" />)}
      <rect y={GROUND - 32} width={W} height="3" fill="#F2F4F7" stroke="rgba(42,33,24,0.3)" strokeWidth="0.8" />
      <rect width={W} height="5" fill="#F7F8FA" />
      {[60, 160, 260].map((x) => <g key={x}><rect x={x - 24} y="0" width="48" height="4" fill="#FFFDF0" stroke={INK} strokeWidth="0.9" /><path d={`M${x - 22} 2 H${x + 22}`} stroke="#E8E2C0" strokeWidth="1" /></g>)}
      <path d={`M0 5 H${W}`} stroke="rgba(42,33,24,0.35)" strokeWidth="1" />
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
<g transform="translate(240 24)"><circle r="9" fill="#FFFDF5" stroke={INK} strokeWidth="1.8" /><circle r="7.2" fill="none" stroke="#9AA4AE" strokeWidth="1" />{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 -6.4 V-5.2" stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.2} transform={`rotate(${i * 30})`} />)}<path d="M0 0 V-5 M0 0 L3.6 1.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /><circle r="0.9" fill="#E0533F" /></g>
      <g transform="translate(256 40)"><rect width="50" height="36" rx="3" fill="#fff" stroke={INK} strokeWidth="1.8" /><path d="M6 30 V20 M14 30 V14 M22 30 V18 M30 30 V10 M38 30 V6" stroke="#5E8FC9" strokeWidth="4" /><path d="M6 18 L14 12 L22 16 L30 8 L40 4" stroke="#E0533F" strokeWidth="1.6" fill="none" /></g>
      {/* 칸막이 · 게시판 (메모) */}
      <g transform="translate(150 96)"><rect width="56" height="30" rx="2" fill="#C9D3DE" stroke={INK} strokeWidth="1.4" /><rect x="3" y="3" width="50" height="24" fill="#B8C4D2" />{[[8, 6, '#FFE27A'], [22, 9, '#F7B8C8'], [36, 5, '#BFE4F7'], [14, 17, '#A6D98F']].map(([x, y, c], i) => <g key={i}><rect x={x as number} y={y as number} width="10" height="9" fill={c as string} stroke={INK} strokeWidth="0.6" transform={`rotate(${(i % 2 ? 4 : -5)} ${x} ${y})`} /><circle cx={(x as number) + 5} cy={(y as number) + 1} r="0.9" fill="#E0533F" /></g>)}</g>
      {/* 정수기 */}
      <g transform="translate(236 158)"><rect x="-8" y="-40" width="16" height="40" rx="1.5" fill="#E8EEF2" stroke={INK} strokeWidth="1.4" /><path d="M-6 -56 h12 v12 q0 4 -6 4 q-6 0 -6 -4z" fill="#BFE4F7" stroke={INK} strokeWidth="1.2" /><rect x="-4" y="-32" width="3" height="4" fill="#5E8FC9" /><rect x="1" y="-32" width="3" height="4" fill="#E0533F" /><rect x="-5" y="-22" width="10" height="2" fill="#B8C2CE" /></g>      {/* 뒤쪽 책상 + 모니터 */}
      <g transform="translate(176 128)">
        <rect x="-26" y="0" width="52" height="5" rx="1.5" fill="#C98B55" stroke={INK} strokeWidth="1.4" />
        <path d="M-22 5 V30 M22 5 V30" stroke={INK} strokeWidth="2" />
        <rect x="-12" y="-20" width="24" height="16" rx="2" fill="#2A2A2A" stroke={INK} strokeWidth="1.4" /><rect x="-10" y="-18" width="20" height="12" fill="#7FCBE8" />
        <path d="M0 -4 V0" stroke={INK} strokeWidth="2" />
        {/* 키보드 · 머그잔 · 서류함 · 의자 */}
        <rect x="-10" y="-2" width="16" height="2" rx="0.6" fill="#3A3434" />
        <g transform="translate(16 0)"><path d="M-3 0 V-6 H3 V0Z" fill="#fff" stroke={INK} strokeWidth="0.9" /><path d="M3 -5 q3 0 3 2 q0 2 -3 2" stroke={INK} strokeWidth="0.8" fill="none" /><path d="M-1 -8 q1 -2 0 -3" stroke="#B8C2CE" strokeWidth="0.7" fill="none" /></g>
        <g transform="translate(-20 0)"><rect x="-4" y="-4" width="8" height="4" fill="#5E8FC9" stroke={INK} strokeWidth="0.8" /><rect x="-3.4" y="-6" width="7" height="2" fill="#fff" stroke={INK} strokeWidth="0.5" /></g>
        <g transform="translate(-34 30)"><path d="M0 -2 V-10" stroke="#4A4E56" strokeWidth="2" /><path d="M-6 0 L0 -2 L6 0" stroke="#4A4E56" strokeWidth="1.6" fill="none" /><rect x="-7" y="-14" width="14" height="4" rx="1.5" fill="#3A4A6A" stroke={INK} strokeWidth="1" /><rect x="-9" y="-30" width="4" height="18" rx="2" fill="#3A4A6A" stroke={INK} strokeWidth="1" /></g>
      </g>
      {/* 화분 */}
      <g transform="translate(302 158)">
        <path d="M-11 0 L-13 -20 H13 L11 0Z" fill="#C2884F" stroke={INK} strokeWidth="1.8" />
        <path d="M0 -20 Q-4 -40 -16 -48 M0 -20 Q2 -44 8 -54 M0 -20 Q8 -36 18 -40" stroke="#4E8A3A" strokeWidth="2" fill="none" />
        {[[-16, -48, -30], [8, -54, 10], [18, -40, 40], [-8, -36, -50], [6, -32, 30]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="4.5" fill={i % 2 ? '#7FBF6A' : '#6FAF5E'} stroke={INK} strokeWidth="1.2" transform={`rotate(${r} ${x} ${y})`} />)}
      </g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="#B9C2CE" />
      {/* 카펫 타일 */}
      {Array.from({ length: 12 }, (_, i) => Array.from({ length: 2 }, (_, j) => <rect key={`${i}-${j}`} x={i * 28 + (j % 2) * 14 - 14} y={GROUND + 3 + j * 10} width="26" height="8" fill={(i + j) % 2 ? '#B2BCC8' : '#BFC8D3'} />))}
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 44} ${GROUND} L${i * 44 - 14} ${H}`} stroke="rgba(42,33,24,0.12)" strokeWidth="1.6" />)}
    </g>
  )
}


/** 놀이동산: 대관람차 + 롤러코스터 레일. railY(x) = 레일 높이 */
export const railY = (x: number) => 118 - 34 * Math.sin(((x - 20) / 280) * Math.PI) ** 2 + 18 * Math.sin(((x - 20) / 280) * Math.PI * 3)
export function Amusement({ t }: { t: number }) {
  // 레일: 위 레일 · 아래 레일 · 침목 · 격자 받침 (11-28 사용자: 퀄리티)
  let rail = '', rail2 = ''
  for (let x = -20; x <= W + 20; x += 4) { rail += `${x === -20 ? 'M' : 'L'}${x} ${railY(x)}`; rail2 += `${x === -20 ? 'M' : 'L'}${x} ${railY(x) + 5}` }
  const supports = Array.from({ length: 11 }, (_, i) => i * 32 + 6)
  return (
    <g>
      <defs><linearGradient id="am-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD6A8" /><stop offset="1" stopColor="#FFF0D8" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#am-sky)" />
      <path d="M150 26 q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H150Z M240 40 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H240Z" fill="#fff" />
      {/* 먼 산울타리 */}
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={i * 30 + 10} cy={GROUND - 22} r="16" fill="#A9CF8E" />)}
      <rect y={GROUND - 22} width={W} height="22" fill="#A9CF8E" />
      <FerrisWheel x={62} y={68} r={44} gy={GROUND} t={t} />
      <Tent x={170} gy={GROUND} c="#E0533F" sign="핫도그" />
      <Tent x={270} gy={GROUND} c="#5E8FC9" sign="풍선 쏘기" />
      <Tree x={124} y={GROUND + 1} s={0.6} />
      <Bush x={214} y={GROUND} s={0.6} flowers="#FFE27A" />
      {/* 격자 받침 */}
      {supports.map((x) => {
        const top = railY(x) + 6, h = GROUND - top
        if (h < 6) return null
        const n = Math.floor(h / 12)
        return (
          <g key={x}>
            <path d={`M${x - 4} ${top} V${GROUND} M${x + 4} ${top} V${GROUND}`} stroke="#6A5A7A" strokeWidth="2.2" />
            {Array.from({ length: n }, (_, k) => <path key={k} d={`M${x - 4} ${top + k * 12} L${x + 4} ${top + k * 12 + 12} M${x + 4} ${top + k * 12} L${x - 4} ${top + k * 12 + 12}`} stroke="#8A7A9A" strokeWidth="1" />)}
            <rect x={x - 6} y={GROUND - 3} width="12" height="3" fill="#8A8F98" stroke={INK} strokeWidth="0.8" />
          </g>
        )
      })}
      {/* 침목 */}
      {Array.from({ length: 44 }, (_, i) => { const x = i * 8 - 12; return <path key={i} d={`M${x} ${railY(x) - 1} V${railY(x) + 6}`} stroke="#8A6A4A" strokeWidth="2" /> })}
      <path d={rail2} fill="none" stroke={INK} strokeWidth="3.4" /><path d={rail2} fill="none" stroke="#B8475A" strokeWidth="1.6" />
      <path d={rail} fill="none" stroke={INK} strokeWidth="4.6" /><path d={rail} fill="none" stroke="#E0533F" strokeWidth="2.4" />
      <rect y={GROUND} width={W} height={H - GROUND} fill="#D9C49A" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2" />
      {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={(i * 41) % W} cy={GROUND + 6 + (i % 3) * 5} r="1.3" fill="#BFA678" />)}
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
      {/* 창고: 판자 벽 · 지붕 널 · 창 · 문(빗장) */}
      <g transform="translate(206 102)">
        <rect x="-18" y="-22" width="36" height="22" fill="#C9694F" stroke={INK} strokeWidth="1.6" />
        {[-12, -6, 0, 6, 12].map((k) => <path key={k} d={`M${k} -21 V0`} stroke="#A8553E" strokeWidth="0.9" />)}
        <path d="M-22 -22 L0 -36 L22 -22Z" fill="#8A4A3A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        {[-26, -31].map((ry) => <path key={ry} d={`M${(ry + 36) * -1.57 - 0} ${ry} H${(ry + 36) * 1.57}`} stroke="#6E3A2E" strokeWidth="0.9" />)}
        <rect x="-6" y="-14" width="12" height="14" fill="#7A4A2A" stroke={INK} strokeWidth="1.2" />
        <path d="M-6 -14 L6 0 M6 -14 L-6 0" stroke="#5A3420" strokeWidth="0.9" />
        <rect x="9" y="-17" width="7" height="6" fill="#BFE4F7" stroke={INK} strokeWidth="0.9" /><path d="M12.5 -17 V-11" stroke={INK} strokeWidth="0.6" />
      </g>
      <rect y="108" width={W} height={H - 108} fill="#8CC377" />
      <path d={`M0 108 H${W}`} stroke={INK} strokeWidth="2" />
      {/* 울타리 */}
      {/* 나무 울타리: 뾰족한 말뚝 · 가로대 두 줄 · 나뭇결 */}
      <path d={`M0 94 H${W} M0 104 H${W}`} stroke={INK} strokeWidth="3.6" /><path d={`M0 94 H${W} M0 104 H${W}`} stroke="#C98B55" strokeWidth="2" />
      {Array.from({ length: 23 }, (_, i) => <g key={i}><path d={`M${i * 14 + 2} 110 V90 L${i * 14 + 5} 86 L${i * 14 + 8} 90 V110Z`} fill="#D9A066" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" /><path d={`M${i * 14 + 4.5} 93 v8`} stroke="#B07A44" strokeWidth="0.7" /></g>)}
      {/* 기대 둔 삽 · 물통 */}
      <g transform="translate(150 110)"><path d="M0 0 L8 -30" stroke="#9A6A3E" strokeWidth="2" /><path d="M6 -31 h5 M8.5 -31 v-3" stroke={INK} strokeWidth="1.4" /><path d="M-3 0 L1 -8 L6 -6 L3 2Z" fill="#9AA4AE" stroke={INK} strokeWidth="1" /></g>
      <g transform="translate(250 112)"><path d="M-8 0 L-9 -16 H9 L8 0Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.3" /><path d="M-9 -11 H9 M-8.6 -5 H8.6" stroke="#4A72A0" strokeWidth="1.4" /><ellipse cy="-16" rx="9" ry="2" fill="#8FB8E0" stroke={INK} strokeWidth="1" /></g>
      <Flowers x0={0} x1={W} y={112} seed={2} />
      {/* 허수아비 */}
      <g transform="translate(300 124)" strokeLinejoin="round">
        <path d="M0 0 V-34 M-16 -24 H16" stroke="#8A5A34" strokeWidth="2.6" />
        {/* 옷 (체크 셔츠 · 소매 끝 지푸라기) */}
        <path d="M-9 -30 H9 L10 -14 H-10Z" fill="#E0533F" stroke={INK} strokeWidth="1.2" />
        <path d="M-9 -24 H9 M-9.4 -19 H9.4 M-4 -30 V-14 M4 -30 V-14" stroke="#B83A2A" strokeWidth="0.8" />
        <path d="M-16 -27 H-9 V-22 H-16Z M9 -27 H16 V-22 H9Z" fill="#E0533F" stroke={INK} strokeWidth="1" />
        <path d="M-16 -22 l-3 3 M-16 -24 l-4 0 M16 -22 l3 3 M16 -24 l4 0 M-6 -14 l-1 4 M0 -14 v4 M6 -14 l1 4" stroke="#E8C060" strokeWidth="1.1" />
        {/* 얼굴 (자루) · 밀짚모자 */}
        <circle cy="-38" r="6.4" fill="#F4D9A8" stroke={INK} strokeWidth="1.3" />
        <circle cx="-2.4" cy="-39" r="0.9" fill={INK} /><circle cx="2.4" cy="-39" r="0.9" fill={INK} /><path d="M-2.4 -35.6 q2.4 1.6 4.8 0" stroke={INK} strokeWidth="0.8" fill="none" />
        <ellipse cy="-43" rx="11" ry="2.4" fill="#E8C060" stroke={INK} strokeWidth="1.1" />
        <path d="M-6 -43 Q-6 -50 0 -50 Q6 -50 6 -43Z" fill="#E8C060" stroke={INK} strokeWidth="1.1" />
        <path d="M-6 -44.4 H6" stroke="#E0533F" strokeWidth="1.4" />
      </g>
      <rect y={GROUND - 8} width={W} height={H - GROUND + 8} fill="#9A6A3E" />
      {/* 밭이랑 · 흙 알갱이 */}
      {[GROUND + 6, GROUND + 14].map((fy) => <path key={fy} d={`M0 ${fy} Q40 ${fy - 4} 80 ${fy} T160 ${fy} T240 ${fy} T320 ${fy}`} stroke="#7A5232" strokeWidth="1.6" fill="none" />)}
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 37) % W} cy={GROUND + 2 + (i * 7) % 18} r={0.9 + (i % 3) * 0.4} fill={i % 2 ? '#7A5232' : '#B88A5A'} />)}
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
      {/* 미끄럼틀: 사다리(옆 기둥·발판) → 지붕 있는 발판 → 테두리 있는 곡선 활강판 → 끝은 평평하게 */}
      <g transform="translate(36 0)">
        {/* 뒤 기둥 */}
        <path d="M30 132 V60 M74 132 V104" stroke={INK} strokeWidth="5" /><path d="M30 132 V60 M74 132 V104" stroke="#4A7FC0" strokeWidth="2.8" />
        {/* 지붕 기둥·지붕 */}
        <path d="M0 60 V34 M32 60 V34" stroke={INK} strokeWidth="4.6" /><path d="M0 60 V34 M32 60 V34" stroke="#4A7FC0" strokeWidth="2.6" />
        <path d="M-7 35 L16 18 L39 35Z" fill="#E0533F" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 24 L4 35 M24 24 L28 35 M16 18 V35" stroke="#F2C230" strokeWidth="3" /><path d="M-7 35 L16 18 L39 35Z" fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        {/* 발판 난간 */}
        <path d="M0 46 H32 M0 52 H8 M24 52 H32" stroke={INK} strokeWidth="1.6" />
        {/* 활강판 받침 */}
        <path d="M74 132 V108" stroke={INK} strokeWidth="5" /><path d="M74 132 V108" stroke="#4A7FC0" strokeWidth="2.8" />
        {/* 발판 */}
        <rect x="-4" y="57" width="40" height="7" rx="2" fill="#E0533F" stroke={INK} strokeWidth="2" />
        <path d="M-2 59 H34" stroke="#F58A75" strokeWidth="1.4" />
        {/* 사다리: 옆 기둥 두 개 + 발판 다섯 */}
        {[76, 89, 102, 115, 128].map((y) => { const lx = -10 + (8 * (132 - y)) / 68; return <g key={y}><path d={`M${lx} ${y} H12`} stroke={INK} strokeWidth="4.4" /><path d={`M${lx} ${y} H12`} stroke="#B9C3CF" strokeWidth="2.4" /></g> })}
        <path d="M-10 132 L-2 64 M12 132 L12 64" stroke={INK} strokeWidth="5" /><path d="M-10 132 L-2 64 M12 132 L12 64" stroke="#4A7FC0" strokeWidth="3" />
        {/* 기둥 밑 받침 */}
        {[-10, 12, 30, 74].map((x) => <rect key={x} x={x - 4} y="130" width="8" height="4" rx="1" fill="#8A8F98" stroke={INK} strokeWidth="1.2" />)}
        {/* 활강판 (맨 앞, 11-28 사용자: 받침·기둥은 뒤로): 바깥 테두리(진한) → 판(노랑) → 가운데 반짝 */}
        <path d="M30 60 C52 62 62 92 80 114 Q90 127 112 128" fill="none" stroke={INK} strokeWidth="16" strokeLinecap="round" />
        <path d="M30 60 C52 62 62 92 80 114 Q90 127 112 128" fill="none" stroke="#E0A51C" strokeWidth="12.5" strokeLinecap="round" />
        <path d="M30 60 C52 62 62 92 80 114 Q90 127 112 128" fill="none" stroke="#F7CF45" strokeWidth="8" strokeLinecap="round" />
        <path d="M34 59 C52 61 61 88 78 110" fill="none" stroke="#FFF1B0" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* 그네: A자 기둥 두 쌍, 쇠사슬, 고무 의자 두 개 */}
      <g transform="translate(250 0)">
        <path d="M-40 132 L-30 52 L-20 132 M24 132 L34 52 L44 132" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M-40 132 L-30 52 L-20 132 M24 132 L34 52 L44 132" fill="none" stroke="#5E8FC9" strokeWidth="3" strokeLinejoin="round" />
        <rect x="-33" y="49" width="70" height="6" rx="3" fill="#5E8FC9" stroke={INK} strokeWidth="1.8" />
        {[-18, -4, 12, 26].map((x) => <g key={x}><circle cx={x} cy={56} r="1.6" fill="#8A8F98" stroke={INK} strokeWidth="0.8" /><path d={`M${x} 57 V102`} stroke={INK} strokeWidth="1.6" strokeDasharray="2.4 1.2" /></g>)}
        {[[-11, 102], [19, 104]].map(([x, y]) => <path key={x} d={`M${x - 10} ${y} Q${x} ${y + 6} ${x + 10} ${y} L${x + 9} ${y + 3} Q${x} ${y + 9} ${x - 9} ${y + 3}Z`} fill="#3E3A40" stroke={INK} strokeWidth="1.3" />)}
      </g>
      <rect y={GROUND - 6} width={W} height={H - GROUND + 6} fill="#E8D7A8" />
      <path d={`M0 ${GROUND - 6} H${W}`} stroke="rgba(42,33,24,0.35)" strokeWidth="2" />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={(i * 47) % W} cy={GROUND + 4 + (i % 3) * 5} r="1.4" fill="#C9B07A" />)}
      {/* 모래놀이 양동이 · 삽 */}
      <g transform={`translate(140 ${GROUND + 8})`}><path d="M-6 0 L-5 -9 H5 L6 0Z" fill="#5E8FC9" stroke={INK} strokeWidth="1.2" /><path d="M-5 -9 Q0 -15 5 -9" stroke={INK} strokeWidth="1" fill="none" /><path d="M10 0 L18 -10" stroke="#E0533F" strokeWidth="2" /><path d="M8 -1 l4 2 l-1 -5z" fill="#E0533F" /></g>
    </g>
  )
}
