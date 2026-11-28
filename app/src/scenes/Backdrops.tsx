// 장면 배경 (코드 그림). cam = 카메라가 오른쪽으로 간 만큼 → 먼 것은 천천히, 가까운 것은 빨리 흘러감
import { Bush, Lamp, Tree } from './Nature'
import { INK } from './kit'
import { W, H, GROUND } from './Stage'

const wrap = (x: number, span: number) => ((x % span) + span) % span

const BLD = [
  { w: 62, h: 64, c: '#F2E3C9', win: '#9FD0EC' },
  { w: 48, h: 86, c: '#E8C9B6', win: '#B8E0F2' },
  { w: 70, h: 52, c: '#DDE6C8', win: '#9FD0EC' },
  { w: 54, h: 74, c: '#F6D7C8', win: '#B8E0F2' },
  { w: 66, h: 60, c: '#E4DCEB', win: '#9FD0EC' },
]
const BLD_SPAN = BLD.reduce((a, b) => a + b.w + 14, 0)
const SHOPS = ['빵집', '꽃집', '카페', '약국', '문구점']

/** 동네 길 (보도블록 + 건물 + 나무) */
export function Street({ cam = 0, sky = ['#BFE4F7', '#E8F5FB'] }: { cam?: number; sky?: [string, string] }) {
  const far = cam * 0.35, near = cam
  const horizon = GROUND - 44
  return (
    <g>
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#st-sky)" />
      {/* 구름 */}
      {[30, 190, 330].map((cx, i) => {
        const x = wrap(cx - cam * 0.12, W + 80) - 40
        return <g key={i} transform={`translate(${x} ${22 + i * 9})`} fill="#fff" stroke={INK} strokeWidth="1.8"><path d="M-18 6 a9 9 0 0 1 8 -12 a12 12 0 0 1 20 2 a8 8 0 0 1 8 10z" /></g>
      })}
      {/* 건물 (멀리) */}
      {[0, 1].map((rep) => {
        let bx = -wrap(far, BLD_SPAN) + rep * BLD_SPAN
        return BLD.map((b, i) => {
          const x = bx; bx += b.w + 14
          if (x > W || x + b.w < 0) return null
          return (
            <g key={`${rep}-${i}`} transform={`translate(${x} ${horizon - b.h})`}>
              <rect width={b.w} height={b.h + 2} rx="5" fill={b.c} stroke={INK} strokeWidth="2.2" />
              <rect x="-3" y="-4" width={b.w + 6} height="7" rx="3" fill={shadeRoof(i)} stroke={INK} strokeWidth="2" />
              {/* 옥상: 실외기 · 물탱크 */}
              {i % 2 === 0 ? <g transform={`translate(${b.w - 18} -4)`}><rect y="-8" width="12" height="8" rx="1" fill="#D8DCE0" stroke={INK} strokeWidth="1.2" /><circle cx="6" cy="-4" r="2.6" fill="none" stroke={INK} strokeWidth="0.8" /></g>
                : <g transform="translate(8 -4)"><path d="M0 0 V-6 M10 0 V-6" stroke={INK} strokeWidth="1.2" /><rect x="-2" y="-14" width="14" height="9" rx="4" fill="#7FB0D8" stroke={INK} strokeWidth="1.2" /></g>}
              {/* 위층 창: 창틀 · 가운데 살 · 창턱 · 반짝 */}
              {Array.from({ length: Math.max(1, Math.floor((b.h - 34) / 20)) }, (_, r) => Array.from({ length: Math.floor((b.w - 8) / 18) }, (_, c) => (
                <g key={`${r}-${c}`}>
                  <rect x={8 + c * 18} y={10 + r * 20} width="10" height="11" rx="1.5" fill={b.win} stroke={INK} strokeWidth="1.5" />
                  <path d={`M${13 + c * 18} ${10 + r * 20} V${21 + r * 20}`} stroke="#fff" strokeWidth="1" />
                  <path d={`M${9.5 + c * 18} ${11.5 + r * 20} l3 0 l-3 3z`} fill="#fff" opacity="0.6" />
                  <rect x={7 + c * 18} y={21 + r * 20} width="12" height="2" rx="0.8" fill="#fff" stroke={INK} strokeWidth="0.7" />
                </g>
              )))}
              {/* 1층 가게: 간판 · 줄무늬 차양 · 유리문 · 진열창 */}
              <g transform={`translate(0 ${b.h - 20})`}>
                <rect x="3" y="-7" width={b.w - 6} height="7" rx="1" fill="#fff" stroke={INK} strokeWidth="1.1" />
                <text x={b.w / 2} y="-1.6" textAnchor="middle" fontSize="5.4" fill={INK}>{SHOPS[i % SHOPS.length]}</text>
                <path d={`M1 0 H${b.w - 1} L${b.w - 3} 6 H3Z`} fill={shadeRoof(i + 1)} stroke={INK} strokeWidth="1.1" />
                {Array.from({ length: Math.floor((b.w - 4) / 8) }, (_, k) => <path key={k} d={`M${4 + k * 8} 0 L${5 + k * 8} 6`} stroke="#fff" strokeWidth="2.4" opacity="0.8" />)}
                <rect x="6" y="8" width="10" height="14" fill="#BFE4F7" stroke={INK} strokeWidth="1.1" /><circle cx="14" cy="15" r="0.8" fill={INK} />
                <rect x="20" y="8" width={b.w - 26} height="9" fill="#DFF3FB" stroke={INK} strokeWidth="1.1" />
                <path d={`M23 10 l4 0 l-4 4z`} fill="#fff" opacity="0.7" />
              </g>
            </g>
          )
        })
      })}
      {/* 화단·나무 (중간) */}
      {Array.from({ length: 4 }, (_, i) => {
        const x = wrap(i * 96 + 40 - cam * 0.7, 384) - 32
        return (
          <g key={i}>
            <Tree x={x} y={horizon + 1} s={0.5} flip={i % 2 === 1} c={i % 2 ? '#7FBF6A' : '#8CC77A'} />
            <Bush x={x + 26} y={horizon + 1} s={0.55} flowers={i % 2 ? '#F2708A' : undefined} />
            {i % 2 === 0 && <Lamp x={x + 48} y={horizon + 6} />}
          </g>
        )
      })}
      <rect x="0" y={horizon} width={W} height="6" fill="#B9D59A" stroke={INK} strokeWidth="2" />
      {/* 보도 */}
      <rect x="0" y={horizon + 6} width={W} height={GROUND - horizon + 6} fill="#E9DDCB" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = wrap(i * 32 - near, 384) - 32
        return <path key={i} d={`M${x} ${horizon + 6} L${x - 10} ${GROUND + 12}`} stroke="rgba(42,33,24,0.15)" strokeWidth="2" />
      })}
      <path d={`M0 ${(horizon + GROUND) / 2 + 3} H${W}`} stroke="rgba(42,33,24,0.12)" strokeWidth="2" />
      {/* 연석 + 차도 */}
      <rect x="-2" y={GROUND + 10} width={W + 4} height="5" fill="#CFC4B3" stroke={INK} strokeWidth="2" />
      <rect x="0" y={GROUND + 15} width={W} height={H - GROUND - 15} fill="#7E7A78" />
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={wrap(i * 80 - near * 1.1, 400) - 40} y={GROUND + 19} width="34" height="2.5" rx="1" fill="#F2F0E6" />)}
    </g>
  )
}
const shadeRoof = (i: number) => ['#C9694F', '#8A6A8F', '#5E8F6A', '#C2884F', '#6A7FA8'][i % 5]

/** 분식집·식당 안 (벽·창문·메뉴판) */
export function Restaurant({ menu = ['떡볶이', '순대', '튀김'], prices = ['4,000', '4,500', '3,000'] }: { menu?: string[]; prices?: string[] }) {
  return (
    <g>
      <rect width={W} height={H} fill="#F7E6C4" />
      {/* 벽 아래 나무판 */}
      <rect y="98" width={W} height="60" fill="#E3B987" />
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${i * 32} 98 V158`} stroke="rgba(42,33,24,0.15)" strokeWidth="2" />)}
      <path d={`M0 98 H${W}`} stroke={INK} strokeWidth="2.4" />
      {/* 창문 */}
      <g transform="translate(22 18)">
        <rect width="86" height="62" rx="6" fill="#BFE4F7" stroke={INK} strokeWidth="2.4" />
        <path d="M43 0 V62 M0 31 H86" stroke={INK} strokeWidth="2" />
        <path d="M10 10 l14 -0 M8 40 l10 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M0 0 H86 V8 Q76 14 66 8 Q56 14 46 8 Q36 14 26 8 Q16 14 6 8 L0 8Z" fill="#E0533F" stroke={INK} strokeWidth="1.4" />
      </g>
      {/* 메뉴판 */}
      <g transform="translate(200 6)">
        <rect width="106" height="58" rx="6" fill="#3E4A3D" stroke={INK} strokeWidth="2.4" />
        <rect x="-4" y="-4" width="114" height="66" rx="8" fill="none" stroke="#9A6A3E" strokeWidth="4" />
        {menu.map((m, i) => <text key={m} x="10" y={19 + i * 16} fontSize="12" fill="#F6F1DC">{m}<tspan x="96" textAnchor="end" fill="#FFD23F">{prices[i] ?? ''}</tspan></text>)}
      </g>
      {/* 천장 조명 · 벽시계 · 음식 사진 · 정수기 */}
      {[124, 184].map((x) => <g key={x}><path d={`M${x} 0 V10`} stroke={INK} strokeWidth="1.2" /><path d={`M${x - 10} 18 Q${x} 6 ${x + 10} 18Z`} fill="#F2C230" stroke={INK} strokeWidth="1.4" /><ellipse cx={x} cy="19" rx="4" ry="1.6" fill="#FFF3A6" /></g>)}
      <g transform="translate(150 44)"><circle r="10" fill="#fff" stroke={INK} strokeWidth="1.8" /><circle r="8.2" fill="none" stroke="#E0533F" strokeWidth="1.2" />{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 -7 V-5.6" stroke={INK} strokeWidth={i % 3 ? 0.6 : 1.2} transform={`rotate(${i * 30})`} />)}<path d="M0 0 V-6 M0 0 L5 2" stroke={INK} strokeWidth="1.4" strokeLinecap="round" /><circle r="0.9" fill="#E0533F" /></g>
      {([[124, 64, '#E2452F', menu[0]], [166, 64, '#E8B070', menu[2] ?? menu[1]]] as const).map(([x, y, c, n]) => <g key={n} transform={`translate(${x} ${y})`}><rect width="30" height="24" rx="2" fill="#fff" stroke={INK} strokeWidth="1.4" /><ellipse cx="15" cy="15" rx="10" ry="5" fill={c} stroke={INK} strokeWidth="0.9" /><text x="15" y="8" textAnchor="middle" fontSize="5.5" fill={INK}>{n}</text></g>)}
      <g transform="translate(304 158)"><rect x="-8" y="-44" width="16" height="44" fill="#E8EEF2" stroke={INK} strokeWidth="1.6" /><rect x="-6" y="-58" width="12" height="14" rx="3" fill="#BFE4F7" stroke={INK} strokeWidth="1.4" /><rect x="-4" y="-34" width="8" height="5" fill="#5E8FC9" /></g>
      {/* 바닥 */}
      <rect y={GROUND} width={W} height={H - GROUND} fill="#C99B6B" />
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.4" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${i * 64 + 20} ${GROUND} L${i * 64} ${H}`} stroke="rgba(42,33,24,0.15)" strokeWidth="2" />)}
    </g>
  )
}

/** 차도 + 건널목 (교통사고) */
export function Road({ cam = 0 }: { cam?: number }) {
  // 찻길: 먼 건물(창문·간판·옥상) · 가로수 · 가로등 · 보도 · 차선
  const B = [{ w: 62, h: 70, c: '#F2E3C9', sign: '편의점', sc: '#2E6FD8' }, { w: 70, h: 86, c: '#E4DCEB' }, { w: 56, h: 62, c: '#DDE6C8', sign: '카페', sc: '#7A4A2A' }, { w: 72, h: 92, c: '#F6D7C8' }]
  return (
    <g>
      <defs><linearGradient id="rd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A9D8F2" /><stop offset="1" stopColor="#E3F3FA" /></linearGradient></defs>
      <rect width={W} height={H} fill="url(#rd-sky)" />
      {[40, 200].map((cx, i) => <path key={i} transform={`translate(${wrap(cx - cam * 0.05, 360) - 20} ${20 + i * 10})`} d="M-18 6 a9 9 0 0 1 8 -12 a12 12 0 0 1 20 2 a8 8 0 0 1 8 10z" fill="#fff" stroke={INK} strokeWidth="1.6" />)}
      {B.map((b, i) => {
        const x = wrap(i * 100 - cam * 0.3, 400) - 50
        return (
          <g key={i} transform={`translate(${x} ${112 - b.h})`}>
            <rect width={b.w} height={b.h} rx="3" fill={b.c} stroke={INK} strokeWidth="2.2" />
            <rect x="-3" y="-5" width={b.w + 6} height="7" rx="2" fill="#B8A898" stroke={INK} strokeWidth="1.8" />
            {Array.from({ length: Math.floor((b.h - 30) / 18) }, (_, r) => Array.from({ length: Math.floor((b.w - 8) / 16) }, (_, c) => (
              <g key={`${r}-${c}`}><rect x={7 + c * 16} y={8 + r * 18} width="9" height="10" rx="1.5" fill="#BFE4F7" stroke={INK} strokeWidth="1.3" /><path d={`M${8 + c * 16} ${9 + r * 18} l3 0 l-3 3z`} fill="#fff" opacity="0.7" /></g>
            )))}
            {b.sign && <g><rect x="4" y={b.h - 26} width={b.w - 8} height="10" rx="2" fill={b.sc} stroke={INK} strokeWidth="1.4" /><text x={b.w / 2} y={b.h - 18} textAnchor="middle" fontSize="7.5" fill="#fff">{b.sign}</text></g>}
            <rect x={b.w / 2 - 7} y={b.h - 14} width="14" height="14" fill="#8A6A4A" stroke={INK} strokeWidth="1.4" />
          </g>
        )
      })}
      {/* 보도 + 가로수 + 가로등 */}
      <rect y="112" width={W} height="10" fill="#E9DDCB" stroke={INK} strokeWidth="2" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${wrap(i * 36 - cam * 0.6, 360) - 20} 112 v10`} stroke="rgba(42,33,24,0.15)" strokeWidth="1.6" />)}
      {[0, 1, 2].map((i) => { const x = wrap(i * 130 + 60 - cam * 0.6, 390) - 30; return <g key={i}><Tree x={x} y={115} s={0.55} flip={i === 1} />{i !== 1 && <Lamp x={x + 52} y={116} />}</g> })}
      <rect y="122" width={W} height={H - 122} fill="#8A8684" />
      <rect y="122" width={W} height="4" fill="#6E6A68" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={wrap(i * 64 - cam, 384) - 32} y="150" width="34" height="3" rx="1.5" fill="#F7E27A" />)}
    </g>
  )
}
