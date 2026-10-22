// 장난감 입체 건물 그리기 도우미 (2026-10-22, Art.tsx에서 나눔: 화면 조각과 도우미를 한 파일에 두면 개발 중 새로고침 경고)
// 옆면 깊이: 오른쪽으로 DX, 위로 DY
const DX = 44, DY = 18
export const GLASS = '#CFE7F5', GLASS_SIDE = '#A9CDE2', WOOD = '#8A5A3B'
// 색을 어둡게(f<1)·밝게(f>1)
export function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
// 상자: 앞면 + 오른쪽 옆면 (+ 평평한 지붕이면 윗면)
export function box(x: number, y: number, w: number, h: number, front: string, top = false, side = shade(front, 0.82)) {
  return (
    <g>
      <path d={`M${x + w} ${y}L${x + w + DX} ${y - DY}V${y + h - DY}L${x + w} ${y + h}Z`} fill={side} />
      {top && <path d={`M${x} ${y}L${x + DX} ${y - DY}H${x + w + DX}L${x + w} ${y}Z`} fill={shade(front, 1.25)} />}
      <rect x={x} y={y} width={w} height={h} fill={front} />
    </g>
  )
}
// 박공지붕: 앞 삼각형 + 오른쪽 지붕면 (처마는 양쪽으로 10씩)
export function gable(x: number, w: number, y: number, rise: number, color: string) {
  const cx = x + w / 2, l = x - 10, r = x + w + 10, ey = y + 8
  return (
    <g>
      <path d={`M${cx} ${y - rise}L${cx + DX} ${y - rise - DY}L${r + DX} ${ey - DY}L${r} ${ey}Z`} fill={shade(color, 0.78)} />
      <path d={`M${l} ${ey}L${cx} ${y - rise}L${r} ${ey}Z`} fill={color} />
      <path d={`M${l + 20} ${ey - 10}L${cx - 4} ${y - rise + 14}`} stroke="#fff" strokeWidth="6" opacity="0.5" fill="none" />
    </g>
  )
}
// 차양: 앞면 줄무늬 + 옆면
export function awning(x: number, w: number, y: number, color: string) {
  const n = Math.max(3, Math.round(w / 34)), sw = w / n
  return (
    <g>
      <path d={`M${x + w + 8} ${y}L${x + w + 8 + DX} ${y - DY}L${x + w + DX} ${y + 34 - DY}L${x + w} ${y + 34}Z`} fill={shade(color, 0.75)} />
      <path d={`M${x - 8} ${y}H${x + w + 8}L${x + w} ${y + 34}H${x}Z`} fill={color} />
      <path d={Array.from({ length: n }, (_, i) => `M${x - 6 + i * sw + sw / 2} ${y}l-2 34h${sw / 2}l2-34z`).join('')} fill="#fff" stroke="none" />
      <path d={`M${x - 8} ${y}H${x + w + 8}L${x + w} ${y + 34}H${x}Z`} fill="none" />
    </g>
  )
}
export const win = (x: number, y: number, w = 28, h = 28, cross = false) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="4" fill={GLASS} strokeWidth="3.5" />
    {cross && <path d={`M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`} strokeWidth="2.5" />}
  </g>
)
// 옆면 창문 (평행사변형)
export const sideWin = (x: number, y: number, w = 20, h = 24) => <path d={`M${x} ${y}l${w} ${(-w * DY) / DX}v${h}l${-w} ${(w * DY) / DX}z`} fill={GLASS_SIDE} strokeWidth="3" />
export const door = (x: number, y: number, w = 28, h = 64, color = WOOD) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="5" fill={color} />
    <circle cx={x + w - 7} cy={y + h / 2 + 2} r="3" fill="#FFD45C" strokeWidth="2" />
  </g>
)
export const shadow = (cx: number, rx: number) => <ellipse cx={cx} cy="226" rx={rx} ry="10" fill={INK} opacity="0.2" stroke="none" />
export const INK = '#2A2118'
