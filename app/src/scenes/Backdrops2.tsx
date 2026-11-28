// 장면 배경 더: 병원 대기실·노래방·산·공원·집 안
import { Blossom, Bush, Grass, Lamp, ParkBench, TrashBin, Tree } from './Nature'
import { INK } from './kit'
import { W, H, GROUND } from './Stage'

const wrap = (x: number, span: number) => ((x % span) + span) % span

/** 동네 병원 대기실 */
export function Clinic({ sign = '내과', open = false }: { sign?: string; open?: boolean }) {
  return (
    <g>
      <rect width={W} height={H} fill="#E3F2EC" />
      {/* 천장 조명판 */}
      <rect width={W} height="6" fill="#F4F8F6" />
      {[60, 160, 260].map((x) => <g key={x}><rect x={x - 22} y="0" width="44" height="5" fill="#FFFDF0" stroke={INK} strokeWidth="1" /><path d={`M${x - 20} 2.5 H${x + 20}`} stroke="#F2E7B0" strokeWidth="1.4" /></g>)}
      <path d={`M0 6 H${W}`} stroke="rgba(42,33,24,0.4)" strokeWidth="1" />      <rect y="100" width={W} height="58" fill="#CFE6DC" />
      <path d={`M0 100 H${W}`} stroke={INK} strokeWidth="2.2" />
      {/* 간판 */}
      <g transform="translate(14 8)">
        <rect width="84" height="30" rx="6" fill="#fff" stroke={INK} strokeWidth="2.2" />
        <path d="M14 9 h6 v-0 M17 6 v12 M11 12 h12" stroke="#E0533F" strokeWidth="4" strokeLinecap="round" />
        <text x="54" y="21" textAnchor="middle" fontSize="14" fill={INK}>{sign}</text>
      </g>
      {/* 진료실 문 */}
      <g transform="translate(262 46)">
        {open && <rect width="44" height="112" rx="4" fill="#5A4A3A" stroke={INK} strokeWidth="2.2" />}
        <rect width={open ? 12 : 44} height="112" rx="4" fill="#F4EBD6" stroke={INK} strokeWidth="2.2" />
        <rect x="8" y="10" width="28" height="20" rx="3" fill="#BFE4F7" stroke={INK} strokeWidth="1.6" />
        <circle cx="36" cy="64" r="3" fill="#C2884F" stroke={INK} strokeWidth="1.4" />
        <text x="22" y="-6" textAnchor="middle" fontSize="11" fill={INK}>진료실</text>
      </g>
      {/* 창문 (밖에 나무) */}
      <g transform="translate(20 46)">
        <clipPath id="cl-win"><rect width="70" height="44" rx="6" /></clipPath>
        <rect width="70" height="44" rx="6" fill="#BFE4F7" />
        <g clipPath="url(#cl-win)"><circle cx="56" cy="40" r="16" fill="#8CC377" /><circle cx="44" cy="46" r="12" fill="#7FB86A" /><path d="M6 14 q4 -6 10 -3 q5 -5 11 0 q6 0 5 5 H6Z" fill="#fff" /></g>
        <rect width="70" height="44" rx="6" fill="none" stroke={INK} strokeWidth="2.2" />
        <path d="M35 0 V44 M0 22 H70" stroke="#fff" strokeWidth="3" /><path d="M35 0 V44 M0 22 H70" stroke={INK} strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* 손 씻기 포스터 · 벽 TV · 정수기 */}
      <g transform="translate(108 40)"><rect width="34" height="44" rx="2" fill="#fff" stroke={INK} strokeWidth="1.6" /><text x="17" y="10" textAnchor="middle" fontSize="6" fill="#2E6FD8">손 씻기</text><path d="M10 26 q7 -10 14 0 q-7 8 -14 0Z" fill="#F6D2B8" stroke={INK} strokeWidth="0.9" /><circle cx="12" cy="34" r="2" fill="#BFE4F7" /><circle cx="22" cy="36" r="2.5" fill="#BFE4F7" /></g>
      <g transform="translate(160 36)"><rect width="60" height="36" rx="3" fill="#2A2A2A" stroke={INK} strokeWidth="1.8" /><rect x="3" y="3" width="54" height="30" fill="#7FCBE8" /><path d="M8 26 L20 14 L30 22 L44 10 L52 18" stroke="#fff" strokeWidth="1.6" fill="none" /><text x="30" y="11" textAnchor="middle" fontSize="6" fill="#fff">건강 정보</text></g>
      <g transform="translate(212 158)"><rect x="-8" y="-46" width="16" height="46" fill="#E8EEF2" stroke={INK} strokeWidth="1.6" /><rect x="-6" y="-60" width="12" height="14" rx="3" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" /><rect x="-4" y="-36" width="8" height="5" fill="#E0533F" /></g>
      {/* 화분 */}
      <g transform="translate(236 158)">
        <path d="M-9 0 L-11 -16 H11 L9 0Z" fill="#C2884F" stroke={INK} strokeWidth="1.8" />
        <path d="M0 -16 Q-4 -34 -14 -40 M0 -16 Q2 -38 8 -46 M0 -16 Q8 -30 16 -32" stroke="#4E8A3A" strokeWidth="2" fill="none" />
        {([[-14, -40, -30], [8, -46, 10], [16, -32, 40], [-6, -30, -50]] as const).map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="8" ry="4" fill={i % 2 ? '#7FBF6A' : '#6FAF5E'} stroke={INK} strokeWidth="1.1" transform={`rotate(${r} ${x} ${y})`} />)}
      </g>
      {/* 아래 벽: 판 무늬 · 손잡이 난간 */}
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 34 + 4} y="108" width="26" height="42" rx="2" fill="none" stroke="rgba(80,130,110,0.3)" strokeWidth="1.2" />)}
      <rect y="100" width={W} height="5" fill="#B8D8CA" stroke={INK} strokeWidth="1" />
      <path d={`M0 116 H${W}`} stroke="#A8B4BC" strokeWidth="2.4" /><path d={`M0 115 H${W}`} stroke="#E8EEF2" strokeWidth="0.8" />
      {/* 벽시계 · 순서 안내판 · 손 소독제 · 진료 시간표 */}
      <g transform="translate(244 24)"><circle r="9" fill="#FFFDF5" stroke={INK} strokeWidth="1.8" /><circle r="7.2" fill="none" stroke="#9AA4AE" strokeWidth="1" />{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 -6.4 V-5.2" stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.2} transform={`rotate(${i * 30})`} />)}<path d="M0 0 V-5 M0 0 L3.6 1.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /><circle r="0.9" fill="#E0533F" /></g>
      <g transform="translate(160 78)"><rect width="60" height="14" rx="2" fill="#2A2A2A" stroke={INK} strokeWidth="1.4" /><text x="17" y="10" textAnchor="middle" fontSize="6" fill="#fff">진료 중</text><text x="44" y="10.5" textAnchor="middle" fontSize="8" fill="#FF6A5A">12번</text></g>
      <g transform="translate(102 98)"><rect x="-4" y="-14" width="8" height="14" rx="2" fill="#E8EEF2" stroke={INK} strokeWidth="1" /><path d="M-1 -14 V-18 H4" stroke={INK} strokeWidth="1.2" fill="none" /><rect x="-3" y="-8" width="6" height="4" fill="#7FCBE8" /></g>
      <g transform="translate(228 40)"><rect width="26" height="32" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.2" /><text x="13" y="7" textAnchor="middle" fontSize="4.6" fill="#2E6FD8">진료 시간</text>{[12, 17, 22, 27].map((ly) => <path key={ly} d={`M4 ${ly} H22`} stroke="#B8C2CE" strokeWidth="1" />)}</g>
      {/* 창 블라인드 · 창턱 */}
      <g transform="translate(20 46)"><path d="M2 2 H68" stroke="#F4F8F6" strokeWidth="6" />{[2, 6].map((ly) => <path key={ly} d={`M2 ${ly} H68`} stroke="#B8C2CE" strokeWidth="0.8" />)}<rect x="-3" y="43" width="76" height="4" rx="1.5" fill="#F4F8F6" stroke={INK} strokeWidth="1.2" /></g>
      {/* 진료실 문틀 · 발판 */}
      <g transform="translate(262 46)"><rect x="-3" y="-3" width="50" height="115" rx="3" fill="none" stroke="#B8A888" strokeWidth="2.4" />{!open && <rect x="3" y="96" width="38" height="12" fill="#D9CFB8" stroke={INK} strokeWidth="1" />}</g>      <rect y={GROUND} width={W} height={H - GROUND} fill="#D9D2C4" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 44} ${GROUND} V${H}`} stroke="rgba(42,33,24,0.12)" strokeWidth="2" />)}
      {[GROUND + 9, GROUND + 17].map((fy) => <path key={fy} d={`M0 ${fy} H${W}`} stroke="rgba(42,33,24,0.1)" strokeWidth="1.4" />)}
    </g>
  )
}

/** 긴 의자 (대기실) */
export function Bench({ x, y, n = 1, color = '#5E8FC9', h = 28 }: { x: number; y: number; n?: number; color?: string; h?: number }) {
  // 병원 대기 의자 (옆에서): 의자 n개가 한 줄 (x = 맨 오른쪽 의자 가운데). 다리 · 앉는 판 · 등받이
  const one = (cx: number, i: number) => (
    <g key={i} transform={`translate(${cx} 0)`}>
      <path d={`M-10 0 L-9 ${-h + 4} M10 0 L9 ${-h + 4}`} stroke="#8A8E96" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-15" y={-h - 1} width="30" height="6" rx="2.5" fill={color} stroke={INK} strokeWidth="1.8" />
      <path d={`M-14 ${-h} L-17 ${-h - 22}`} stroke="#8A8E96" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="-22" y={-h - 30} width="8" height="20" rx="3" fill={color} stroke={INK} strokeWidth="1.8" transform={`rotate(-8 -18 ${-h - 20})`} />
    </g>
  )
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={-(n - 1) * 17} cy="1" rx={n * 17} ry="3" fill="rgba(42,33,24,0.15)" />
      {Array.from({ length: n }, (_, i) => one(-(n - 1 - i) * 34, i))}
    </g>
  )
}

/** 노래방 (어두운 방 + 화면 + 반짝 조명). lit = 조명 세기 0~1, score = 점수 화면 */
export function Karaoke({ t, score, spot }: { t: number; score?: string; spot?: number }) {
  return (
    <g>
      <rect width={W} height={H} fill="#3B2B52" />      {/* 누빈 방음벽 (마름모) · 위아래 네온 띠 */}
      {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${i * 20 - 40} 0 L${i * 20 + 80} ${GROUND} M${i * 20 + 40} 0 L${i * 20 - 80} ${GROUND}`} stroke="rgba(20,10,40,0.35)" strokeWidth="1" />)}
      {Array.from({ length: 16 }, (_, i) => Array.from({ length: 7 }, (_, j) => <circle key={`${i}-${j}`} cx={i * 20 + (j % 2) * 10} cy={j * 22 + 6} r="1" fill="rgba(255,255,255,0.12)" />))}
      <path d={`M0 4 H${W}`} stroke="#F2708A" strokeWidth="2.4" opacity={0.6 + 0.4 * Math.sin(t * 5)} /><path d={`M0 4 H${W}`} stroke="#FFD0DC" strokeWidth="0.8" />
      {/* 돌아가는 조명 */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = t * 1.3 + i * 1.26
        return <ellipse key={i} cx={160 + Math.cos(a) * 130} cy={70 + Math.sin(a * 1.3) * 40} rx="22" ry="14" fill={['#F2708A', '#F2C230', '#7FCBE8', '#A6D98F', '#C77FD0'][i]} opacity="0.28" />
      })}
      <g transform="translate(160 10)">
        <path d="M0 0 V10" stroke="#B7B2AA" strokeWidth="2" />
        {/* 미러볼: 작은 거울 조각 · 반짝 */}
        <circle cy="18" r="9" fill="#C9C4BC" stroke={INK} strokeWidth="1.8" />
        <clipPath id="kr-ball"><circle cy="18" r="8.2" /></clipPath>
        <g clipPath="url(#kr-ball)">{Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => <rect key={`${r}-${c}`} x={-9 + c * 3.2 + ((t * 6) % 3.2)} y={10 + r * 3} width="2.8" height="2.6" fill={(r + c + Math.floor(t * 4)) % 4 === 0 ? '#FFFFFF' : (r + c) % 3 ? '#E4E0D8' : '#A8A39A'} />))}</g>
        <path d="M5 13 l1.4 -3 l1.4 3 l3 1.4 l-3 1.4 l-1.4 3 l-1.4 -3 l-3 -1.4z" fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 9)} />
      </g>
      {/* 벽 무늬 별 · 스피커 · 노래책 선반 */}
      {[[30, 40], [300, 30], [250, 96], [20, 110]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 5} l1.6 3.4 l3.6 0.4 l-2.7 2.4 l0.8 3.6 l-3.3 -1.8 l-3.3 1.8 l0.8 -3.6 l-2.7 -2.4 l3.6 -0.4z`} fill="#8A6AB0" opacity="0.6" />)}
      {[70, 250].map((x) => <g key={x} transform={`translate(${x} 34)`}><rect x="-9" y="0" width="18" height="28" rx="3" fill="#2A2238" stroke={INK} strokeWidth="1.6" /><circle cy="9" r="4.5" fill="#4A3A60" stroke={INK} strokeWidth="1" /><circle cy="21" r="3" fill="#4A3A60" stroke={INK} strokeWidth="1" /></g>)}
      <g transform="translate(290 118)"><rect x="-16" y="0" width="32" height="5" fill="#5A4A6A" stroke={INK} strokeWidth="1.2" />{[0, 1, 2, 3].map((i) => <rect key={i} x={-14 + i * 7} y="-14" width="6" height="14" fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A'][i]} stroke={INK} strokeWidth="0.9" />)}</g>
      {/* 노래 화면 */}
      <g transform="translate(92 34)">
        <rect width="136" height="76" rx="6" fill="#1E2A44" stroke={INK} strokeWidth="2.6" />
        {score ? (
          <text x="68" y="50" textAnchor="middle" fontSize="30" fill="#FFD23F" stroke={INK} strokeWidth="1.2" paintOrder="stroke">{score}</text>
        ) : (
          <>
            <rect x="14" y="44" width="108" height="7" rx="3.5" fill="#5E6E8E" />
            <rect x="14" y="44" width={((t * 18) % 108)} height="7" rx="3.5" fill="#7FCBE8" />
            <rect x="26" y="58" width="84" height="6" rx="3" fill="#5E6E8E" />
            <path d="M18 24 q10 -14 20 0 t20 0 t20 0 t20 0 t20 0" stroke="#F2708A" strokeWidth="2" fill="none" opacity="0.7" />
          </>
        )}
      </g>
      <rect x="140" y="110" width="40" height="8" rx="2" fill="#2A2238" stroke={INK} strokeWidth="1.8" />
      {/* 노래방 기계 (번호판 · 불빛) */}
      <g transform="translate(160 136)"><rect x="-22" y="-26" width="44" height="26" rx="2" fill="#2A2238" stroke={INK} strokeWidth="1.6" /><rect x="-18" y="-22" width="20" height="8" rx="1" fill="#1A1424" stroke="#5A4A6A" strokeWidth="0.8" /><text x="-8" y="-15.6" textAnchor="middle" fontSize="6" fill="#7FE08A">0427</text>{[0, 1, 2].map((i) => <circle key={i} cx={8 + i * 5} cy="-18" r="1.6" fill={Math.sin(t * 6 + i * 2) > 0 ? ['#F2708A', '#F2C230', '#7FCBE8'][i] : '#4A3A60'} />)}<path d="M-18 -9 H18 M-18 -5 H18" stroke="#4A3A60" strokeWidth="1.2" /></g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="#2A2238" />
      {/* 카펫 무늬 · 바닥 네온 */}
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${i * 24 + 6} ${GROUND + 8} l2 -3 l2 3 l-2 3z`} fill="#4A3A60" />)}
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={i * 24 + 18} cy={GROUND + 17} r="1.4" fill="#4A3A60" />)}
      <path d={`M0 ${GROUND - 2} H${W}`} stroke="#7FCBE8" strokeWidth="2" opacity={0.5 + 0.5 * Math.sin(t * 4 + 1)} />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
      {spot !== undefined && <><path d={`M${spot - 14} 0 L${spot - 46} ${GROUND} H${spot + 46} L${spot + 14} 0Z`} fill="#FFF6C8" opacity="0.22" /><ellipse cx={spot} cy={GROUND + 2} rx="46" ry="9" fill="#FFF6C8" opacity="0.5" /></>}
    </g>
  )
}


/** 공원 (잔디·나무·벤치·산책길). cam = 카메라 이동 */
export function Park({ cam = 0, sunset = 0 }: { cam?: number; sunset?: number }) {
  return (
    <g>
      <defs><linearGradient id="pk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE4F7" /><stop offset="1" stopColor="#EEF8E6" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#pk-sky)" />
      {/* 노을: 하늘빛 · 지는 해 · 먼 도시 · 새 */}
      {sunset > 0 && <g>
        <rect width={W} height="120" fill="#FFB27A" opacity={0.35 * sunset} />
        <circle cx="250" cy={58 + 20 * sunset} r="16" fill="#FFD27A" stroke="#F2A33A" strokeWidth="2" opacity={sunset} />
        {[[0, 30, 40], [30, 22, 52], [52, 26, 34], [78, 18, 58], [96, 30, 30], [126, 24, 46], [150, 20, 36], [170, 28, 50], [198, 22, 40], [220, 30, 30], [250, 18, 44], [268, 26, 36], [294, 22, 50]].map(([x, w, h], i) => <rect key={i} x={x} y={104 - h} width={w} height={h} fill="#C79A9A" opacity={0.55 * sunset} />)}
        {[[60, 30], [74, 26], [200, 40]].map(([x, y], i) => <path key={i} d={`M${x - 4} ${y} q4 -3 4 0 q0 -3 4 0`} stroke={INK} strokeWidth="1.1" fill="none" opacity={sunset} />)}
      </g>}
      {[0, 1, 2, 3].map((i) => {
        const x = wrap(i * 110 + 30 - cam * 0.3, 440) - 60
        return <ellipse key={i} cx={x} cy="108" rx="60" ry="26" fill="#A6D98F" stroke={INK} strokeWidth="2" />
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const x = wrap(i * 100 + 50 - cam * 0.7, 400) - 40
        return (
          <g key={i}>
            <Tree x={x} y={123} s={0.82} flip={i % 2 === 1} c={['#7FBF6A', '#8CC77A', '#6FB463', '#94C97E'][i]} />
            <Bush x={x + 34} y={123} s={0.7} flowers={i % 2 ? '#F7A3B8' : '#FFE27A'} />
            {i === 2 && <Lamp x={x - 30} y={124} />}
          </g>
        )
      })}
      {Array.from({ length: 2 }, (_, i) => {
        const x = wrap(i * 200 + 150 - cam * 0.85, 400) - 40
        return (
          <g key={i}><ParkBench x={x} y={129} /><TrashBin x={x + 40} y={130} /></g>
        )
      })}
      <rect y="122" width={W} height={H - 122} fill="#8CC377" />
      <path d={`M0 122 H${W}`} stroke={INK} strokeWidth="2" />
      <rect y={GROUND - 12} width={W} height="22" fill="#E6D3AE" />
      <path d={`M0 ${GROUND - 12} H${W} M0 ${GROUND + 10} H${W}`} stroke="rgba(42,33,24,0.3)" strokeWidth="2" />
      {/* 길 가장자리 돌 */}
      {Array.from({ length: 24 }, (_, i) => { const x = wrap(i * 16 - cam, 384) - 16; return <g key={i}><rect x={x} y={GROUND - 14} width="14" height="3.4" rx="1.5" fill="#D8C7A0" stroke="rgba(42,33,24,0.35)" strokeWidth="0.8" /><rect x={x + 3} y={GROUND + 9} width="14" height="3.4" rx="1.5" fill="#D8C7A0" stroke="rgba(42,33,24,0.35)" strokeWidth="0.8" /></g> })}
      {/* 잔디 속 풀포기 · 꽃 (줄기·잎·꽃잎) */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = wrap(i * 46 - cam, 368) - 24
        return <g key={i}><Grass x={x} y={GROUND + 22} /><Grass x={x + 14} y={GROUND - 20} c="#6FAF5E" /><path d={`M${x + 26} ${GROUND - 15} V${GROUND - 21}`} stroke="#4E8A3A" strokeWidth="1.1" /><Blossom x={x + 26} y={GROUND - 22} c={i % 2 ? '#F2708A' : '#FFD23F'} r={2.6} /></g>
      })}
    </g>
  )
}

/** 집 안 거실 (천장 얼룩 자리 stainX). stain = 얼룩 크기 0~1 */
export function Home({ stainX = 150, stain = 0, winX = 220, frameX = 30, night = 0 }: { stainX?: number; stain?: number; winX?: number; frameX?: number; night?: number }) {
  const sky = night > 0.5 ? '#2E3A66' : '#BFE4F7'
  // 벽시계: 액자 오른쪽, 창문(커튼 포함)과 겹치면 창문 왼쪽 → 그래도 겹치면 창문 오른쪽
  const clockX = (() => { const hit = (cx: number) => winX >= 0 && cx > winX - 24 && cx < winX + 102; let cx = frameX + 100; if (hit(cx)) cx = winX - 30; if (hit(cx) || cx < frameX + 92) cx = winX + 114; return cx > W - 12 ? -1 : cx })()
  return (
    <g>
      <rect width={W} height={H} fill="#F6EAD2" />
      <rect width={W} height="14" fill="#E9D9B8" />
      <rect y="14" width={W} height="4" fill="#FFF8EA" />
      {Array.from({ length: 40 }, (_, i) => <rect key={i} x={i * 8 + 2} y="10" width="4" height="4" fill="#DCC9A4" />)}
      <path d={`M0 14 H${W}`} stroke={INK} strokeWidth="2.2" /><path d={`M0 18 H${W}`} stroke="rgba(42,33,24,0.35)" strokeWidth="1" />
      {stain > 0 && <ellipse cx={stainX} cy="16" rx={6 + 18 * stain} ry={2.5 + 4 * stain} fill="#8A7050" opacity="0.75" stroke="#6A5238" strokeWidth="1" />}
      {/* 벽지 줄무늬 */}
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 22 + 10} 18 V${GROUND - 40}`} stroke="rgba(201,162,122,0.18)" strokeWidth="6" />)}
      {/* 벽지 작은 꽃무늬 */}
      {Array.from({ length: 15 }, (_, i) => [30, 62, 94].map((wy, j) => <g key={`${i}-${j}`} transform={`translate(${i * 22 + 21} ${wy + (i % 2) * 16})`} fill="rgba(201,140,110,0.28)"><circle cx="-1.6" r="1.3" /><circle cx="1.6" r="1.3" /><circle cy="-1.6" r="1.3" /><circle cy="1.6" r="1.3" /></g>))}
      {/* 아래 벽: 판자 벽 + 가로 몰딩 */}
      <rect y={GROUND - 40} width={W} height="34" fill="#EAD6B4" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 34 + 4} y={GROUND - 34} width="26" height="24" rx="1.5" fill="none" stroke="rgba(150,110,70,0.35)" strokeWidth="1.2" />)}
      <rect y={GROUND - 43} width={W} height="4" fill="#F7E9CF" stroke="rgba(42,33,24,0.45)" strokeWidth="1" />
      {/* 벽시계 (둥근 테 · 눈금 · 바늘). 자리가 없으면 안 그림 */}
      {clockX > 0 && <g transform={`translate(${clockX} 38)`}>
        <circle r="10" fill="#FFFDF5" stroke={INK} strokeWidth="2" /><circle r="8.2" fill="none" stroke="#C98B55" strokeWidth="1.4" />
        {Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 -7 V-5.6" stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.2} transform={`rotate(${i * 30})`} />)}
        <path d="M0 0 L0 -5.4 M0 0 L3.6 1.4" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /><circle r="0.9" fill="#E0533F" />
      </g>}
      {/* 전등 스위치 · 콘센트 */}
      <g transform={`translate(${frameX + 6} 86)`}><rect x="-4" y="-6" width="8" height="12" rx="1.2" fill="#FFFDF5" stroke={INK} strokeWidth="1" /><rect x="-1.6" y="-3" width="3.2" height="4" rx="0.6" fill="#E8E0D0" stroke={INK} strokeWidth="0.6" /></g>
      {/* 창문: 창밖 하늘·구름·나뭇가지, 창틀·창턱, 커튼(주름·끈), 커튼봉 */}
      {winX >= 0 && <g transform={`translate(${winX} 34)`}>
        <clipPath id="home-win"><rect width="78" height="60" rx="5" /></clipPath>
        <rect width="78" height="60" rx="5" fill={sky} />
        <g clipPath="url(#home-win)">
          {night > 0.5 ? <><circle cx="60" cy="14" r="6" fill="#FFF3A6" /><circle cx="18" cy="10" r="1.2" fill="#fff" /><circle cx="34" cy="20" r="1" fill="#fff" /></> : <>
            <path d="M8 18 q4 -7 11 -4 q4 -6 11 0 q6 0 5 5 H8Z" fill="#fff" />
            <path d="M46 34 q3 -5 8 -3 q3 -4 8 0 q5 0 4 4 H46Z" fill="#fff" opacity="0.9" />
            <path d="M70 -2 Q58 18 66 30 M64 14 q-8 0 -12 6" stroke="#7A5232" strokeWidth="2.4" fill="none" />
            <circle cx="56" cy="20" r="5" fill="#8CC377" /><circle cx="66" cy="28" r="6" fill="#8CC377" /><circle cx="72" cy="10" r="6" fill="#7FB86A" />
            <path d="M0 52 Q20 44 40 50 T78 48 V60 H0Z" fill="#A9D98F" />
          </>}
          <path d="M6 6 L16 6 L6 18Z M44 6 L50 6 L44 13Z" fill="#fff" opacity="0.45" />
        </g>
        <rect width="78" height="60" rx="5" fill="none" stroke={INK} strokeWidth="2.4" />
        <rect x="3" y="3" width="72" height="54" rx="3" fill="none" stroke="#FFFDF5" strokeWidth="2" />
        <path d="M39 0 V60 M0 30 H78" stroke="#FFFDF5" strokeWidth="3" />
        <path d="M39 0 V60 M0 30 H78" stroke={INK} strokeWidth="1" opacity="0.5" />
        <rect x="-6" y="59" width="90" height="6" rx="2" fill="#E3C79A" stroke={INK} strokeWidth="1.8" />
        <path d="M-12 -7 H90" stroke="#8A5A34" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="-12" cy="-7" r="3" fill="#8A5A34" stroke={INK} strokeWidth="1.2" /><circle cx="90" cy="-7" r="3" fill="#8A5A34" stroke={INK} strokeWidth="1.2" />
        <path d="M-9 -6 Q4 20 -1 40 Q-6 52 -2 68 L-11 68 Q-14 30 -9 -6Z" fill="#F2A3A3" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M87 -6 Q74 20 79 40 Q84 52 80 68 L89 68 Q92 30 87 -6Z" fill="#F2A3A3" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M-6 4 Q-3 20 -6 34 M84 4 Q81 20 84 34" stroke="#D97F86" strokeWidth="1.3" fill="none" />
        <path d="M-10 40 Q-4 38 0 41 M78 41 Q82 38 88 40" stroke="#C2452D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>}
      {/* 액자 2개: 가족사진 · 풍경화 (못에 걸린 끈) */}
      <g transform={`translate(${frameX} 30)`}>
        <path d="M6 8 L20 -4 L34 8" stroke="#8A6A4A" strokeWidth="1.2" fill="none" /><circle cx="20" cy="-4" r="1.6" fill={INK} />
        <rect width="40" height="32" rx="2" fill="#B07A44" stroke={INK} strokeWidth="2" />
        <rect x="4" y="4" width="32" height="24" fill="#DDEFF8" />
        <path d="M4 22 H36 V28 H4Z" fill="#B8DDA0" />
        {/* 세 식구 */}
        {[[12, '#E0533F', 1], [20, '#5E8FC9', 0.75], [28, '#F2C230', 1]].map(([cx, c, k], i) => <g key={i}><circle cx={cx as number} cy={28 - 15 * (k as number)} r={3.2 * (k as number)} fill="#F6D2B8" stroke={INK} strokeWidth="0.9" /><path d={`M${(cx as number) - 4 * (k as number)} 28 Q${cx} ${28 - 12 * (k as number)} ${(cx as number) + 4 * (k as number)} 28Z`} fill={c as string} stroke={INK} strokeWidth="0.9" /></g>)}
        <rect x="4" y="4" width="32" height="24" fill="none" stroke={INK} strokeWidth="1" />
        <path d="M7 7 L14 7 L7 14Z" fill="#fff" opacity="0.45" />
        <path d="M1.5 2 H38.5" stroke="#D9A066" strokeWidth="1" />
      </g>
      <g transform={`translate(${frameX + 50} 44)`}>
        <rect width="32" height="24" rx="2" fill="#5A4A3A" stroke={INK} strokeWidth="2" />
        <rect x="3" y="3" width="26" height="18" fill="#FFF1DA" />
        <circle cx="22" cy="8" r="3" fill="#F2C230" />
        <path d="M3 21 L11 10 L16 16 L20 12 L29 21Z" fill="#7FB86A" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M9 13 L11 10 L13 13Z" fill="#fff" />
      </g>
      <rect y={GROUND - 6} width={W} height="6" fill="#E3C79A" stroke={INK} strokeWidth="1.6" />
      {[40, 200].map((ox) => <g key={ox} transform={`translate(${ox + frameX} ${GROUND - 12})`}><rect x="-5" y="-4" width="10" height="8" rx="1.2" fill="#FFFDF5" stroke={INK} strokeWidth="0.9" /><circle cx="-1.8" r="0.8" fill={INK} /><circle cx="1.8" r="0.8" fill={INK} /></g>)}
      {/* 마루: 가로 널판 · 엇갈린 이음매 · 결 */}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#C99B6B" />
      {[GROUND + 6, GROUND + 13, GROUND + 21].map((fy, r) => <g key={fy}><path d={`M0 ${fy} H${W}`} stroke="rgba(42,33,24,0.18)" strokeWidth="1.2" />{Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${i * 60 + (r % 2) * 30 + 12} ${fy - (r ? 7 : 6)} V${fy}`} stroke="rgba(42,33,24,0.14)" strokeWidth="1" />)}</g>)}
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 41 + 6} ${GROUND + 9 + (i % 3) * 7} q6 -1.4 12 0`} stroke="rgba(120,80,40,0.25)" strokeWidth="0.8" fill="none" />)}
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
    </g>
  )
}
