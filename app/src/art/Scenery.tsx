import type { ReactElement } from 'react'

// 배경 그림 (2026-10-22 사용자: 게임 시작 전·게임 안 배경 꾸미기). 잉크 테두리 그림체, 구름은 천천히 흘러감
const K = '#2A2118'

// 테두리 있는 구름
const cloud = (x: number, y: number, s: number, key: string) => (
  <g key={key} transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M10 30a12 12 0 0 1 6-22 16 16 0 0 1 30-2 12 12 0 0 1 20 8 10 10 0 0 1-2 16z" fill="#fff" stroke={K} strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M18 14q4-4 10-3" stroke="#D8ECF6" strokeWidth="3" strokeLinecap="round" fill="none" />
  </g>
)
const tree = (x: number, y: number, s: number, key: string, dark = false) => (
  <g key={key} transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-3" y="0" width="6" height="14" rx="2" fill="#8A5A3B" stroke={K} strokeWidth="2" />
    <circle cx="0" cy="-6" r="12" fill={dark ? '#4F9A5E' : '#6DBB5A'} stroke={K} strokeWidth="2" />
    <path d="M-6 -10q2-5 7-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
  </g>
)
const house = (x: number, y: number, s: number, roof: string, key: string) => (
  <g key={key} transform={`translate(${x} ${y}) scale(${s})`} stroke={K} strokeWidth="2" strokeLinejoin="round">
    <path d="M18 2l12-5v20l-12 5z" fill="#DDBF8E" />
    <rect x="-12" y="2" width="30" height="22" fill="#F6E3BE" />
    <path d="M3 -16l12-5 20 18-12 5z" fill={roof} opacity="0.75" />
    <path d="M-16 4L3 -16 22 4z" fill={roof} />
    <rect x="-1" y="10" width="8" height="14" fill="#8A5A3B" />
    <rect x="-9" y="7" width="6" height="6" fill="#CFE7F5" strokeWidth="1.5" />
  </g>
)

// 시작 전 화면 배경: 하늘·해·구름·산·언덕·보드게임 칸으로 된 꼬불꼬불 길·집·나무
export function TitleScenery() {
  const tiles = ['#FFD45C', '#FF9DB8', '#7FE0A8', '#C9B6F0', '#8FC8F0', '#FFB27A']
  const path: [number, number][] = [[60, 560], [130, 540], [200, 548], [270, 532], [330, 510], [380, 488], [440, 478], [510, 486], [580, 500], [650, 494], [710, 474], [760, 452], [820, 440], [890, 446], [950, 460]]
  return (
    <svg className="scenery" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="titleSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FD0F2" /><stop offset="0.7" stopColor="#D4EEF8" /></linearGradient>
      </defs>
      <rect width="1000" height="620" fill="url(#titleSky)" />
      <g className="sun-rays"><circle cx="840" cy="110" r="70" fill="#FFE9A0" opacity="0.5" /></g>
      <circle cx="840" cy="110" r="42" fill="#FFD45C" stroke={K} strokeWidth="3" />
      <g className="drift slow">{cloud(90, 80, 1.6, 'c1')}{cloud(560, 60, 1.1, 'c2')}</g>
      <g className="drift">{cloud(300, 150, 1.2, 'c3')}{cloud(700, 190, 0.9, 'c4')}</g>
      <path d="M0 380L120 300 220 350 340 270 470 340 560 290 690 350 800 280 920 330 1000 300V620H0z" fill="#A9C8E8" stroke={K} strokeWidth="3" strokeLinejoin="round" opacity="0.9" />
      <path d="M300 286l40-16 20 14-16 6z M780 292l20-12 16 10z" fill="#fff" opacity="0.8" />
      <path d="M0 440Q160 360 330 420T680 400 1000 380V620H0z" fill="#7FB8A0" stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <path d="M0 520Q200 450 420 490T820 450 1000 470V620H0z" fill="#8CC67A" stroke={K} strokeWidth="3" strokeLinejoin="round" />
      {tree(140, 398, 1, 't1', true)}{tree(600, 388, 0.9, 't2', true)}{tree(905, 378, 1, 't3', true)}
      {house(250, 404, 1, '#E2553B', 'h1')}{house(760, 392, 0.9, '#4C8FD6', 'h2')}
      {/* 보드게임 칸 길 */}
      {path.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="6" rx="30" ry="12" fill={K} opacity="0.18" />
          <rect x="-26" y="-14" width="52" height="24" rx="8" fill={tiles[i % tiles.length]} stroke={K} strokeWidth="3" />
          <path d="M-18 -8h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        </g>
      ))}
      <g transform="translate(950 410)"><path d="M0 40V0" stroke={K} strokeWidth="4" /><path d="M2 2h30l-8 9 8 9H2z" fill="#E2553B" stroke={K} strokeWidth="3" strokeLinejoin="round" /></g>
      {tree(40, 590, 1.3, 't4')}{tree(470, 600, 1.1, 't5')}{tree(980, 590, 1.2, 't6')}
      {[[180, 600, '#FF7AA2'], [350, 590, '#FFD45C'], [640, 605, '#fff'], [820, 596, '#FF7AA2']].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}><circle r="6" fill={c as string} stroke={K} strokeWidth="1.8" /><circle r="2.4" fill="#E2A92C" /></g>
      ))}
    </svg>
  )
}

// 게임 안 하늘 (지평선 위): 해·흘러가는 구름·산·새. 색은 단계마다 CSS 변수로
export function SkyScenery() {
  return (
    <svg className="sky-scenery" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g className="sun-rays"><circle cx="820" cy="70" r="52" className="sky-sun-glow" /></g>
      <circle cx="820" cy="70" r="30" className="sky-sun" stroke={K} strokeWidth="3" />
      <g className="drift slow">{cloud(80, 40, 1.1, 'a')}{cloud(520, 24, 0.8, 'b')}</g>
      <g className="drift">{cloud(300, 70, 0.9, 'c')}{cloud(680, 96, 0.7, 'd')}</g>
      <g className="birds" fill="none" stroke={K} strokeWidth="2.4" strokeLinecap="round">
        <path d="M420 60q6-6 12 0q6-6 12 0" /><path d="M452 44q5-5 10 0q5-5 10 0" /><path d="M396 40q4-4 8 0q4-4 8 0" />
      </g>
      <path d="M0 170L90 120 170 150 270 96 380 150 470 110 590 160 700 104 820 150 920 116 1000 140V200H0z" className="sky-mtn-far" stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <path d="M230 106l40-10 18 14-14 4z M690 112l14-8 14 10z" fill="#fff" opacity="0.7" />
      <path d="M0 190Q140 140 300 172T620 160 1000 168V200H0z" className="sky-mtn-near" stroke={K} strokeWidth="3" strokeLinejoin="round" />
      {[[60, 176], [180, 168], [420, 176], [560, 170], [760, 172], [900, 168]].map(([x, y], i) => tree(x, y, 0.55, `st${i}`, true))}
    </svg>
  )
}

// 판 바깥쪽 잔디 꾸미기 (2026-10-22: 게임 안 배경. 넓은 화면에서 양옆 잔디가 비어 보여서)
const DECOR: Record<string, { w: number; h: number; body: ReactElement }> = {
  bush: { w: 120, h: 70, body: <g stroke={K} strokeWidth="3" strokeLinejoin="round"><path d="M10 64a20 20 0 0 1 14-34 26 26 0 0 1 46-10 22 22 0 0 1 38 18 16 16 0 0 1 2 26z" fill="#5DAA5E" /><path d="M30 34q6-8 16-8" stroke="#fff" strokeWidth="3" fill="none" opacity="0.45" /><circle cx="44" cy="48" r="4" fill="#FF7AA2" strokeWidth="2" /><circle cx="78" cy="40" r="4" fill="#FFD45C" strokeWidth="2" /></g> },
  flowers: { w: 130, h: 60, body: <g stroke={K} strokeWidth="2.2">{[[16, 40, '#FF7AA2'], [40, 26, '#FFD45C'], [62, 44, '#fff'], [86, 30, '#C9B6F0'], [108, 46, '#FF7AA2'], [30, 52, '#FFB27A'], [96, 54, '#fff']].map(([x, y, c], i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M0 4v12" stroke="#4F9A5E" strokeWidth="3" /><circle r="7" fill={c as string} /><circle r="2.8" fill="#E2A92C" strokeWidth="1.2" /></g>)}</g> },
  pond: { w: 200, h: 90, body: <g stroke={K} strokeWidth="3" strokeLinejoin="round"><path d="M14 46c0-22 40-38 90-38s92 14 92 36-44 40-96 40S14 68 14 46z" fill="#8FC8F0" /><path d="M50 40q20-8 44-4M120 56q20-4 34 2" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" /><ellipse cx="150" cy="34" rx="14" ry="7" fill="#5DAA5E" strokeWidth="2.4" /><path d="M36 74l-6-26M44 76l2-30" stroke="#4F9A5E" strokeWidth="3" /><ellipse cx="30" cy="46" rx="4" ry="9" fill="#8A5A3B" strokeWidth="2" /></g> },
  fence: { w: 190, h: 60, body: <g stroke={K} strokeWidth="3" strokeLinejoin="round" fill="#E9D3A8"><path d="M6 26h178M6 44h178" strokeWidth="8" stroke={K} /><path d="M6 26h178M6 44h178" strokeWidth="4" stroke="#E9D3A8" />{[10, 50, 90, 130, 170].map((x) => <path key={x} d={`M${x} 56V14l6-8 6 8v42z`} />)}</g> },
  rocks: { w: 110, h: 50, body: <g stroke={K} strokeWidth="3" strokeLinejoin="round"><path d="M8 44q2-22 24-26 20 2 22 26z" fill="#B9B5A6" /><path d="M48 44q4-30 32-32 22 6 22 32z" fill="#A5A294" /><path d="M60 22q8-6 16-4" stroke="#fff" strokeWidth="2.6" fill="none" opacity="0.6" /></g> },
  tuft: { w: 70, h: 40, body: <g stroke={K} strokeWidth="2.4" strokeLinejoin="round" fill="#5DAA5E"><path d="M8 36l8-26 6 24 8-30 6 30 8-24 6 26z" /></g> },
}
export const DECOR_KINDS = Object.keys(DECOR)
export function GroundDecor({ kind }: { kind: string }) {
  const d = DECOR[kind] ?? DECOR.tuft
  return <svg viewBox={`0 0 ${d.w + 10} ${d.h + 10}`} width={d.w * 1.6} height={d.h * 1.6} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>{d.body}</svg>
}
