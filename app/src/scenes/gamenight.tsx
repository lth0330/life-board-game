// 장면: 밤샘 게임 (좋은 일 11초, 11-28 다시 만듦)
// 어른: 밤에 컴퓨터 책상 (비스듬히 놓인 모니터에 게임 화면 · 키보드 · 마우스) → 마우스 딸깍·키보드 타닥 → "이겼다!"
// → 시계가 빨리 감기며 창밖이 새벽 → 하품 "하암~" → "한 판만 더!" / 아이(친구네서): 낮에 TV 앞에서 게임기로 둘이
import { Actor, castAt, GROUND, H, headH, W, type SceneDef } from './Stage'
import { Home } from './Backdrops2'
import { Bubble, Hearts, Sparkle } from './Fx'
import { Zzz } from './Fx3'
import { Pad } from './Props3'
import { INK, keys, pick, poseAt, seg } from './kit'
import { CHEER, SIT, SIT_LEGS, sitLift } from './poses'
import { sideHand, type SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const WIN = 3.4

/** 게임 화면 (w×h 안에): 이야기에 맞게 바뀜
 *  보스 싸움(용사가 칼질, 보스 체력이 줄어듦) → WIN!(트로피) → 다음 판(달리며 뛰어넘기) → 졸다가 GAME OVER → 다시 하기 */
function GameScreen({ t, win, w = 60, h = 40, over = 99, retry = 99 }: { t: number; win: number; w?: number; h?: number; over?: number; retry?: number }) {
  const gy = h * 0.74
  const ground = <><rect width={w} height={h} fill="#2B3A6B" /><rect y={gy} width={w} height={h - gy} fill="#3E8A4E" />{[0.15, 0.55, 0.85].map((k, i) => <circle key={i} cx={w * k} cy={h * 0.18} r="0.9" fill="#fff" />)}</>
  const hero = (x: number, y: number, swing = 0) => <g transform={`translate(${x} ${y})`}><rect x="-3" y="-8" width="6" height="8" rx="1.5" fill="#5E8FC9" /><circle cy="-10" r="3" fill="#F6D2B8" /><path d={`M3 -6 l${6 * Math.cos(swing)} ${-6 * Math.sin(swing)}`} stroke="#E8E4DC" strokeWidth="1.6" /></g>
  if (t < win) {
    // 보스 싸움
    const hp = Math.max(0.08, 1 - t / win)
    const swing = Math.sin(t * 10) * 1.2
    const hit = Math.sin(t * 10) > 0.8
    return (
      <g>
        {ground}
        {hero(w * 0.28, gy, swing)}
        <g transform={`translate(${w * 0.7 + (hit ? 1.5 : 0)} ${gy})`}><path d="M-11 0 Q-12 -16 0 -18 Q12 -16 11 0Z" fill="#8A4AA8" /><circle cx="-4" cy="-11" r="1.8" fill="#fff" /><circle cx="4" cy="-11" r="1.8" fill="#fff" /><path d="M-7 -18 l-2 -5 l4 3 M7 -18 l2 -5 l-4 3" stroke="#F2C230" strokeWidth="1.4" fill="none" /></g>
        {hit && <path d={`M${w * 0.55} ${gy - 12} l6 4 l-6 4`} stroke="#FFE27A" strokeWidth="1.4" fill="none" />}
        <rect x={w * 0.5} y="3" width={w * 0.45} height="4" fill="#3A3434" /><rect x={w * 0.5} y="3" width={w * 0.45 * hp} height="4" fill="#E0533F" />
        <text x="3" y="7" fontSize="5.5" fill="#fff">BOSS</text>
      </g>
    )
  }
  if (t < win + 1.6) {
    return <g>{ground}{hero(w * 0.3, gy)}<g transform={`translate(${w * 0.68} ${gy - 6})`}><path d="M-6 -10 H6 L4 -2 H-4Z" fill="#F2C230" stroke={INK} strokeWidth="0.6" /><rect x="-2" y="-2" width="4" height="4" fill="#F2C230" /></g><text x={w / 2} y={h * 0.42} textAnchor="middle" fontSize="12" fill="#FFE27A" stroke={INK} strokeWidth="0.6">WIN!</text></g>
  }
  if (t > retry) return <g>{ground}<text x={w / 2} y={h * 0.48} textAnchor="middle" fontSize="9" fill="#fff">STAGE 1</text><text x={w / 2} y={h * 0.66} textAnchor="middle" fontSize="7" fill="#FFE27A">START!</text></g>
  if (t > over) return <g><rect width={w} height={h} fill="#1A1A22" /><text x={w / 2} y={h * 0.44} textAnchor="middle" fontSize="9" fill="#E0533F">GAME OVER</text>{Math.sin(t * 8) > 0 && <text x={w / 2} y={h * 0.7} textAnchor="middle" fontSize="6.5" fill="#fff">다시 하기?</text>}</g>
  // 다음 판: 달리며 장애물 뛰어넘기 (판 번호가 올라감)
  const run = (t * 40) % (w + 20)
  const jump = Math.max(0, Math.sin(t * 6)) * 10
  return (
    <g>
      {ground}
      {[0, 1].map((i) => <rect key={i} x={w - ((run + i * 34) % (w + 8))} y={gy - 6} width="5" height="6" fill="#C9694F" />)}
      {hero(w * 0.3, gy - jump)}
      <text x="3" y="7" fontSize="5.5" fill="#fff">STAGE {2 + Math.floor((t - win - 1.6) / 0.8)}</text>
    </g>
  )
}

/** 비스듬히 놓인 화면 (앞면이 왼쪽 사람을 향해 살짝 돌아 있음): (x, y) = 화면 왼쪽 위 */
function AngledScreen({ x, y, t, win, w = 60, h = 40, sx = 0.62, over, retry }: { x: number; y: number; t: number; win: number; w?: number; h?: number; sx?: number; over?: number; retry?: number }) {
  return (
    <g transform={`translate(${x} ${y}) skewY(-10) scale(${sx} 1)`}>
      <rect x="-4" y="-4" width={w + 8} height={h + 8} rx="3" fill="#1E1E24" stroke={INK} strokeWidth="2.2" />
      <GameScreen t={t} win={win} w={w} h={h} over={over} retry={retry} />
      <path d={`M2 2 L14 2 L2 14Z`} fill="#fff" opacity="0.15" />
    </g>
  )
}

export const gamenight: SceneDef = {
  id: 'gamenight',
  dur: 11,
  still: WIN + 0.3,
  draw: (t, cast, text) => {
    const me = cast[0]
    const atFriend = /친구/.test(text)
    const fr = { ...castAt(cast, 1), age: me.age } // 친구는 같은 나이
    const expr = (who: number) => pick<Expr>(t, [[0, 'normal'], [WIN, who === 0 ? 'happy' : 'surprised'], [WIN + 0.6, 'happy'], [5.0, 'normal'], [7.2, 'surprised'], [8.4, 'happy'], [8.6, 'love']])
    if (atFriend) {
      // ── 아이: 친구네 거실, TV 앞 바닥 방석에 나란히 앉아 게임기 ──
      const sitF: SidePose = { lean: 8, head: 2, armN: [50, 80], armF: [44, 80], legN: [80, 150, 0], legF: [76, 150, 0] }
      const play = (tt: number): SidePose => ({ ...sitF, armN: [50 + 4 * Math.sin(tt * 24), 80], bob: Math.sin(tt * 3) })
      const yay = (tt: number): SidePose => ({ ...sitF, ...CHEER(tt), legN: sitF.legN, legF: sitF.legF })
      const pose = (who: number) => poseAt(t + who * 0.1, [[0, play], [WIN, play], [WIN + 0.2, who === 0 ? yay : { ...sitF, lean: 20, head: 14, armN: [30, 40] }], [5.0, who === 0 ? yay : { ...sitF, lean: 20, head: 14, armN: [30, 40] }], [5.3, play]])
      const top = GROUND - headH(me) * 0.72
      return (
        <g>
          <Home winX={20} frameX={110} />
          {/* TV + TV장 */}
          <rect x="226" y={GROUND - 40} width="80" height="40" fill="#B07A44" stroke={INK} strokeWidth="2" />
          <path d="M266 118 V112" stroke={INK} strokeWidth="3" />
          <AngledScreen x={240} y={66} t={t} win={WIN} w={80} h={48} sx={0.72} />
          {[[150, '#7FCBE8'], [84, '#F2A3B8']].map(([x, c], i) => <ellipse key={i} cx={x as number} cy={GROUND - 2} rx="20" ry="5" fill={c as string} stroke={INK} strokeWidth="1.6" />)}
          <Actor c={fr} x={84} y={GROUND - 4} pose={pose(1)} expr={expr(1)} holding={<Pad />} noCane />
          <Actor c={me} x={150} y={GROUND - 4} pose={pose(0)} expr={expr(0)} holding={<Pad />} noCane />
          {[0, 0.2].map((d, i) => <Sparkle key={i} t={t} t0={WIN + d} x={262 + i * 16} y={60} />)}
          <Hearts t={t} t0={8.6} x={150} y={top} n={2} />
          <Bubble t={t} t0={1.0} t1={2.6} at={154} y={top - 30} text="간다~!" />
          <Bubble t={t} t0={WIN + 0.1} t1={5.0} at={154} y={top - 30} text="이겼다!" />
          <Bubble t={t} t0={5.6} t1={7.4} at={88} y={top - 30} text="한 판 더 해!" />
          <Bubble t={t} t0={8.2} t1={10.8} at={154} y={top - 30} text="좋아!" />
        </g>
      )
    }
    // ── 어른: 밤 컴퓨터 책상 ──
    // 11-28 사용자: 의자를 낮추고 키보드·마우스를 책상 위로 → 손이 책상 높이의 마우스에 닿게 팔 각도를 맞춤
    const MEX = 158, DESK = 226, SEAT = 25, TOPY = GROUND - 46
    const lift = sitLift(me, SEAT)
    const armFor = (sh: number) => {
      let best = 40, err = 1e9
      for (let el = 0; el <= 120; el += 4) {
        const [, hy] = sideHand(me.outfit, me.age, { ...SIT, lean: 16, armN: [sh, el] }, 62)
        const e = Math.abs(GROUND - lift + hy - (TOPY - 3))
        if (e < err) { err = e; best = el }
      }
      return best
    }
    const elN = armFor(62), elF = armFor(58)
    const [mhx] = sideHand(me.outfit, me.age, { ...SIT, lean: 16, armN: [62, elN] }, 62)
    const mouseX = MEX + mhx
    const dawn = seg(t, 5.0, 7.0)
    const hour = keys(t, [[0, 2], [5.0, 3], [7.0, 6.5]], (x) => x)
    const clock = `0${Math.floor(hour)}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`
    // 가까운 손은 마우스(딸깍딸깍), 먼 손은 키보드(타닥타닥)
    const play = (tt: number): SidePose => ({ ...SIT, lean: 16, head: 4, armN: [62 + 2 * Math.sin(tt * 9), elN - 4 * Math.max(0, Math.sin(tt * 22))], armF: [58, elF + 4 * Math.sin(tt * 30)] })
    const yawn: SidePose = { ...SIT_LEGS, lean: -12, head: -16, armN: [70, 124], armF: [150, 20] }
    const sleepy = (tt: number): SidePose => ({ ...play(tt), head: 14 + 3 * Math.sin(tt * 2), lean: 8 })
    const pose = poseAt(t, [[0, play], [WIN - 0.1, play], [WIN + 0.2, { ...CHEER(t), ...SIT_LEGS }], [4.6, { ...CHEER(t), ...SIT_LEGS }], [5.0, play], [7.0, play], [7.3, yawn], [8.1, yawn], [8.5, sleepy]])
    const top = GROUND - lift - (headH(me) - 22)
    const sky = dawn < 0.5 ? '#1E2A44' : '#FFC98A'
    const glow = 0.25 + 0.08 * Math.sin(t * 17) // 모니터 불빛
    return (
      <g>
        {/* 방 (밤 → 새벽) */}
        <rect width={W} height={H} fill="#3A3350" />
        <rect width={W} height={H} fill="#E6D8C2" opacity={dawn} />        <rect width={W} height={H} fill="#E6D8C2" opacity={dawn} />
        {/* 벽지 세로 줄 · 걸레받이 */}
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 22 + 10} 0 V${GROUND}`} stroke="rgba(255,255,255,0.05)" strokeWidth="6" />)}
        <rect y={GROUND - 6} width={W} height="6" fill="#2A2238" opacity={1 - dawn} /><rect y={GROUND - 6} width={W} height="6" fill="#C9A87A" opacity={dawn} />
        <g transform="translate(20 22)">
          <rect width="78" height="56" rx="4" fill={sky} stroke={INK} strokeWidth="2.2" />
          {dawn < 0.5 ? <><circle cx="56" cy="16" r="8" fill="#FFF3A6" /><circle cx="52" cy="13" r="7" fill={sky} /><circle cx="18" cy="12" r="1.2" fill="#fff" /><circle cx="30" cy="30" r="1" fill="#fff" /></> : <circle cx="58" cy={50 - dawn * 14} r="9" fill="#FFD23F" stroke={INK} strokeWidth="1.4" />}
          <path d="M39 0 V56 M0 28 H78" stroke={INK} strokeWidth="1.8" />
          {/* 창턱 · 커튼봉 · 커튼 (주름 · 묶음) */}
          <rect x="-4" y="55" width="86" height="5" rx="1.5" fill="#8A7A9A" stroke={INK} strokeWidth="1.3" />
          <path d="M-10 -6 H88" stroke="#5A4A6A" strokeWidth="3" strokeLinecap="round" />
          <path d="M-8 -5 Q2 20 -2 40 Q-6 52 -2 64 L-11 64 Q-13 30 -8 -5Z M86 -5 Q76 20 80 40 Q84 52 80 64 L89 64 Q91 30 86 -5Z" fill="#5E5A8A" stroke={INK} strokeWidth="1.5" />
          <path d="M-5 4 Q-2 20 -5 34 M83 4 Q80 20 83 34" stroke="#4A4670" strokeWidth="1.1" fill="none" />
          <path d="M-10 40 Q-4 38 0 41 M78 41 Q82 38 88 40" stroke="#F2C230" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        {/* 헤드셋 (벽 고리) */}
        <g transform="translate(266 58)"><circle r="1.6" fill="#8A8F98" stroke={INK} strokeWidth="0.6" /><path d="M-8 12 Q-8 0 0 0 Q8 0 8 12" stroke="#2A2A2A" strokeWidth="2.6" fill="none" /><rect x="-11" y="9" width="6" height="9" rx="2.5" fill="#E0533F" stroke={INK} strokeWidth="1" /><rect x="5" y="9" width="6" height="9" rx="2.5" fill="#E0533F" stroke={INK} strokeWidth="1" /></g>
        {/* 게임 포스터 · 책장 (피규어·책) */}
        <g transform="translate(206 16)"><rect width="36" height="46" rx="2" fill="#2B3A6B" stroke={INK} strokeWidth="1.6" /><path d="M8 34 L18 14 L28 34Z" fill="#E0533F" /><circle cx="18" cy="22" r="4" fill="#F2C230" /><text x="18" y="42" textAnchor="middle" fontSize="5.5" fill="#fff">GAME</text></g>
        <g transform="translate(272 20)"><rect width="42" height="60" fill="#8A5A34" stroke={INK} strokeWidth="1.6" /><path d="M0 20 H42 M0 40 H42" stroke={INK} strokeWidth="1.4" />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={3 + i * 7} y={24 + (i % 2) * 2} width="6" height={14 - (i % 2) * 2} fill={['#E0533F', '#F2C230', '#5E8FC9', '#7FBF6A', '#C77FD0'][i]} stroke={INK} strokeWidth="0.7" />)}<circle cx="12" cy="13" r="4" fill="#F7B8C8" stroke={INK} strokeWidth="0.8" /><rect x="24" y="8" width="10" height="11" fill="#BFE4F7" stroke={INK} strokeWidth="0.8" />{[0, 1, 2].map((i) => <rect key={i} x={4 + i * 12} y={46} width="10" height="12" fill={['#5E8FC9', '#E0533F', '#F2C230'][i]} stroke={INK} strokeWidth="0.7" />)}</g>
        {/* 디지털 시계 */}
        <g transform="translate(150 26)"><rect x="-24" y="-11" width="48" height="20" rx="4" fill="#2A2A2A" stroke={INK} strokeWidth="1.8" /><text textAnchor="middle" y="4" fontSize="12" fill="#FF6A5A">{clock}</text></g>
        <rect y={GROUND} width={W} height={H - GROUND} fill="#2A2238" />
        <rect y={GROUND} width={W} height={H - GROUND} fill="#C99B6B" opacity={dawn} />
        <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth="2.2" />
        {/* 모니터 불빛 */}
        {dawn < 0.8 && <ellipse cx={DESK - 40} cy={GROUND - 80} rx="70" ry="44" fill="#7FCBE8" opacity={glow * (1 - dawn)} />}
        {/* 게임 의자 (등받이) */}
        <g transform={`translate(${MEX - 8} ${GROUND})`}>
          {/* 바퀴 다섯 갈래 · 가스 기둥 · 방석 · 팔걸이 · 등받이(머리 받침) */}
          <path d={`M-14 -2 L0 -6 L14 -2 M-6 -1 L0 -6 L6 -1`} stroke="#3A3434" strokeWidth="2.6" fill="none" />
          {[-14, -6, 6, 14].map((wx) => <circle key={wx} cx={wx} cy="-1" r="2.2" fill="#3A3434" stroke={INK} strokeWidth="0.8" />)}
          <path d={`M0 -6 V${-SEAT + 6}`} stroke="#8A8F98" strokeWidth="3.2" /><path d={`M0 -6 V${-SEAT + 6}`} stroke={INK} strokeWidth="0.8" />
          <rect x="-16" y={-SEAT - 3} width="32" height="8" rx="3" fill="#C2452D" stroke={INK} strokeWidth="2" />
          <path d={`M-14 ${-SEAT - 1} H14`} stroke="#E0705A" strokeWidth="1.2" />
          <g transform={`rotate(-8 -20 ${-SEAT})`}>
            <rect x="-26" y={-SEAT - 66} width="12" height="66" rx="5" fill="#C2452D" stroke={INK} strokeWidth="2" />
            <rect x="-25" y={-SEAT - 64} width="10" height="12" rx="4" fill="#2A2A2A" stroke={INK} strokeWidth="1" />
            <path d={`M-22 ${-SEAT - 48} V${-SEAT - 6}`} stroke="#2A2A2A" strokeWidth="2" />
          </g>
        </g>
        {/* 책상 */}
        <rect x={DESK - 62} y={TOPY} width="116" height="7" rx="2" fill="#8A5A34" stroke={INK} strokeWidth="2" />
        <path d={`M${DESK - 58} ${TOPY + 4} H${DESK + 50}`} stroke="#A87040" strokeWidth="1.2" />
        <path d={`M${DESK - 54} ${TOPY + 7} V${GROUND} M${DESK + 46} ${TOPY + 7} V${GROUND}`} stroke={INK} strokeWidth="3.4" />
        {/* 서랍 */}
        <rect x={DESK + 14} y={TOPY + 7} width="30" height="20" fill="#9A6A3E" stroke={INK} strokeWidth="1.6" /><path d={`M${DESK + 24} ${TOPY + 17} h10`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        {/* 모니터 (받침 + 비스듬한 화면) */}
        <path d={`M${DESK + 10} ${GROUND - 46} L${DESK + 14} ${GROUND - 62} M${DESK + 2} ${GROUND - 46} H${DESK + 22}`} stroke="#1E1E24" strokeWidth="3.4" />
        <AngledScreen x={DESK - 6} y={GROUND - 108} t={t} win={WIN} over={7.4} retry={8.8} />
        {/* 스탠드 · 스피커 · 선 */}
        <g transform={`translate(${DESK + 44} ${TOPY})`}><path d="M-5 0 H5" stroke="#3A3434" strokeWidth="2.4" /><path d="M0 0 L-4 -18 L6 -26" stroke="#3A3434" strokeWidth="1.8" fill="none" /><path d="M2 -30 L12 -24 L8 -20 L-1 -26Z" fill="#F2C230" stroke={INK} strokeWidth="1" />{dawn < 0.6 && <path d="M8 -21 L18 -4 H-2Z" fill="#FFF3A6" opacity="0.25" />}</g>
        <g transform={`translate(${DESK - 30} ${TOPY})`}><rect x="-4" y="-14" width="8" height="14" rx="1.5" fill="#2A2A2A" stroke={INK} strokeWidth="1" /><circle cy="-9.6" r="2" fill="#4A4A54" /><circle cy="-4" r="2.6" fill="#4A4A54" /></g>
        <path d={`M${DESK + 12} ${TOPY + 7} Q${DESK + 16} ${GROUND - 10} ${DESK + 30} ${GROUND - 4}`} stroke="#1E1E24" strokeWidth="1.4" fill="none" />
        {/* 러그 */}
        <ellipse cx={MEX - 4} cy={GROUND + 6} rx="56" ry="6" fill="#5E4A7A" opacity={1 - dawn * 0.4} />
        <ellipse cx={MEX - 4} cy={GROUND + 6} rx="48" ry="4" fill="none" stroke="#8A72AA" strokeWidth="1" strokeDasharray="3 2" />
        {/* 에너지 음료 */}
        <rect x={DESK + 32} y={GROUND - 60} width="9" height="14" rx="2" fill="#7FBF6A" stroke={INK} strokeWidth="1.4" />
        <Actor c={me} x={MEX} y={GROUND - lift} pose={pose} expr={expr(0)} caneLean />
        {/* 키보드 · 마우스 (사람 손 아래, 책상 위) */}
        <g transform={`translate(${Math.max(DESK - 58, mouseX + 6)} ${TOPY})`}>
          <path d="M0 0 L4 -4 H34 L36 0Z" fill="#2A2A2A" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={6 + i * 4.6} y="-3.4" width="3" height="1.6" fill={dawn < 0.5 ? ['#7FCBE8', '#F2708A', '#A6D98F'][i % 3] : '#888'} />)}
        </g>
        {/* 마우스 (패드 위, 손 바로 아래) */}
        <rect x={mouseX - 9} y={TOPY - 1.4} width="18" height="1.6" rx="0.6" fill="#3E4A6A" />
        <g transform={`translate(${mouseX + 1.5 * Math.sin(t * 9)} ${TOPY - 1})`}><path d="M-5.5 0 Q-5.5 -5 0 -5 Q5.5 -5 5.5 0Z" fill="#2A2A2A" stroke={INK} strokeWidth="1.2" /><path d="M0 -5 V-2.4" stroke="#7FCBE8" strokeWidth="0.8" /></g>
        {t < 7 && Math.sin(t * 22) > 0.6 && <text x={mouseX + 44} y={TOPY - 4} fontSize="8" fill="#FFE27A">딸깍</text>}
        {[0, 0.2].map((d, i) => <Sparkle key={i} t={t} t0={WIN + d} x={DESK + 4 + i * 14} y={GROUND - 112} />)}
        <Hearts t={t} t0={8.8} x={MEX + 24} y={top + 10} n={2} />
        {t < 8.5 && <Zzz t={t} t0={7.6} x={MEX - 24} y={top + 6} />}
        <Bubble t={t} t0={0.8} t1={2.6} x={MEX + 10} y={top - 14} text="집중…" />
        <Bubble t={t} t0={WIN + 0.1} t1={4.8} x={MEX + 10} y={top - 14} text="이겼다!" />
        <Bubble t={t} t0={7.3} t1={8.3} x={MEX + 20} y={top - 14} text="하암~" />
        <Bubble t={t} t0={8.6} t1={10.8} x={MEX + 6} y={top - 4} text="한 판만 더!" />
      </g>
    )
  },
}
