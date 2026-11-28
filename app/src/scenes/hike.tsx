// 장면: 친구들과 뒷산 등산 (좋은 일 12.5초, 노인, 11-28 다시 만듦)
// 숲길 비탈을 지팡이(등산 스틱) 짚고 오름 (카메라가 따라감, 나무·통나무 계단·이정표) → 헉헉 쉬었다 → 정상석 도착
// → 먼 산 보며 "야호~!" (메아리) → 정상석 앞에서 폰 들고 셀카 (사진 틀 → 찰칵 → 찍힌 사진)
import { Actor, castAt, GROUND, H, headH, W, type SceneDef } from './Stage'
import { Bubble, Hearts, Sparkle, Sweat } from './Fx'
import { Phone } from './Props2'
import { Tree } from './Nature'
import { INK, clamp01, ease, keys, pick, poseAt, seg } from './kit'
import { CHEER, gaitOf, STAND } from './poses'
import type { SidePose } from '../art/SideCharacter'
import type { Expr } from '../art/Character'

const SZ = 56 // 사람 크기
const K = 0.34 // 비탈 기울기
const SX = 240 // 정상(평평한 곳) 시작 (세상 x)
const EDGE = SX + 175 // 정상 끝 (그 너머는 먼 경치)
const REST0 = 2.6, REST1 = 3.4, ARRIVE = 6.6
const YAHO = 7.6, SELFIE = 9.4, SNAP = 10.4
const POSE_AT = SELFIE + 0.6
/** 세상 좌표의 땅 높이 (위로 갈수록 음수) */
const gy = (wx: number) => -K * Math.min(wx, SX)

/** 소나무 (s = 크기 배수) */
function Pine({ x, y, s = 1, c = '#4E8A5A' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 줄기 (껍질 무늬) · 층층이 처진 가지 (톱니 끝 · 아래 그늘 · 위 빛) */}
      <path d="M-4 2 L-3 -30 H3 L4 2Z" fill="#7A5232" stroke={INK} strokeWidth="1.8" />
      <path d="M-1 -4 v-6 M1.5 -14 v-6 M-1.5 -22 v-5" stroke="#5A3A22" strokeWidth="1" />
      {[0, 1, 2, 3].map((i) => {
        const top = -132 + i * 26, w = 16 + i * 9, bot = top + 34 + i * 4
        const teeth = Array.from({ length: 5 }, (_, k) => { const x0 = -w + (k * 2 * w) / 5, x1 = x0 + w / 5, x2 = x0 + (2 * w) / 5; return `L${x1} ${bot + 4} L${x2} ${bot}` }).join(' ')
        return (
          <g key={i}>
            <path d={`M0 ${top} Q${-w * 0.5} ${top + 16} ${-w} ${bot} ${teeth} Q${w * 0.5} ${top + 16} 0 ${top}Z`} fill={c} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <path d={`M${-w + 4} ${bot - 1} Q0 ${bot - 7} ${w - 4} ${bot - 1}`} stroke="rgba(0,0,0,0.18)" strokeWidth="3" fill="none" />
            <path d={`M-2 ${top + 6} Q${-w * 0.3} ${top + 16} ${-w * 0.55} ${bot - 6}`} stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
}
/** 활엽수 */
function Leafy({ x, y, s = 1, c = '#7FB86A' }: { x: number; y: number; s?: number; c?: string }) {
  // 11-28 사용자: 나무가 이상함 → 줄기·가지·겹친 잎 덩어리가 있는 공원 나무 그림을 씀
  return <Tree x={x} y={y} s={s * 1.15} c={c} />
}

export const hike: SceneDef = {
  id: 'hike',
  dur: 12.5,
  still: 8.2,
  draw: (t, cast) => {
    const me = cast[0], fr = castAt(cast, 1)
    const gm = gaitOf(me, 0.9), gf = gaitOf(fr, 0.9)
    // 걸은 시간 (중간에 쉬는 동안은 멈춤)
    const walked = Math.min(t, REST0) + Math.max(0, Math.min(t, ARRIVE) - REST1)
    const v = (SX + 40 + 30) / (ARRIVE - (REST1 - REST0))
    const meWX = -30 + v * walked
    const frWX = meWX - 44
    // 카메라: 오를 땐 나를 따라가고, 도착하면 오른쪽 경치 쪽으로 조금
    const camX = keys(t, [[ARRIVE, meWX - 130], [ARRIVE + 0.9, SX - 46]], ease.inOut) + (t < ARRIVE ? 0 : 0)
    const camC = t < ARRIVE ? meWX - 130 : camX
    const baseY = gy(camC + 130)
    const sx = (wx: number) => wx - camC
    const sy = (wx: number) => GROUND + (gy(wx) - baseY)
    // 자세
    const climb = (g: typeof gm) => (tt: number): SidePose => { const p = g.pose(tt); return { ...p, lean: (p.lean ?? 0) + 14, head: (p.head ?? 0) + 4 } }
    const rest: SidePose = { ...STAND, lean: 30, head: -8, armN: [44, 6], armF: [34, 8], legN: [14, 18, 0], legF: [-6, 6, 0] } // 무릎 짚고 헉헉
    const look: SidePose = { ...STAND, head: -6, armN: [20, 30], armF: [-4, 20] }
    const shout: SidePose = { ...STAND, lean: -6, head: -16, armN: [92, 128], armF: [84, 128] } // 두 손 입에 모아 야호
    const shoot: SidePose = { ...STAND, head: -2, armN: [84, 62], armF: [70, 70] } // 폰을 눈앞에 들고 친구를 찍음
    const vSign: SidePose = { ...STAND, lean: -6, head: -6, armN: [118, 50], armF: [-4, 10] }
    const mePose = poseAt(t, [[REST0 - 0.1, climb(gm)], [REST0 + 0.2, rest], [REST1 - 0.2, rest], [REST1, climb(gm)], [ARRIVE, climb(gm)], [ARRIVE + 0.3, look], [YAHO - 0.3, look], [YAHO, shout], [8.8, shout], [9.0, CHEER], [SELFIE - 0.1, CHEER], [SELFIE + 0.3, shoot]])
    const frPose = poseAt(t, [[REST0 - 0.1, climb(gf)], [REST0 + 0.2, rest], [REST1 - 0.2, rest], [REST1, climb(gf)], [ARRIVE, climb(gf)], [ARRIVE + 0.3, look], [YAHO + 0.2, look], [YAHO + 0.5, CHEER], [YAHO + 1.3, CHEER], [YAHO + 1.5, gf.pose], [POSE_AT - 0.1, gf.pose], [POSE_AT + 0.2, vSign]])
    const meExpr = pick<Expr>(t, [[0, 'normal'], [1.8, 'sad'], [ARRIVE, 'surprised'], [ARRIVE + 0.6, 'happy'], [SNAP, 'love'], [11.2, 'happy']])
    const frExpr = pick<Expr>(t, [[0, 'happy'], [REST0, 'sad'], [REST1 + 0.5, 'normal'], [ARRIVE + 0.4, 'happy']])
    // 사진: 친구가 정상석 옆으로 가서 브이, 나는 뒤로 물러나 폰으로 찍음
    const meX = meWX - keys(t, [[YAHO + 1.4, 0], [SELFIE, 40]])
    const frX = frWX + keys(t, [[YAHO + 1.4, 0], [POSE_AT, 86]])
    const frWalk = t > YAHO + 1.4 && t < POSE_AT
    const meTop = sy(meX) - headH(me, SZ), frTop = sy(frX) - headH(fr, SZ)
    // 땅 (세상 좌표 → 화면)
    let ground = `M${sx(-200)} ${H}`
    for (let wx = -200; wx <= EDGE; wx += 10) ground += ` L${sx(wx)} ${sy(wx)}`
    // 정상 끝은 바위 벼랑으로 비스듬히 내려감 (길이 뚝 끊기지 않게)
    ground += ` L${sx(EDGE + 30)} ${sy(EDGE) + 30} L${sx(EDGE + 70)} ${H} Z`
    const trail = Array.from({ length: Math.ceil((EDGE + 200) / 10) }, (_, i) => { const wx = -200 + i * 10; return `${i ? 'L' : 'M'}${sx(wx)} ${sy(wx) + 7}` }).join(' ')
    const flash = t > SNAP ? clamp01(1 - seg(t, SNAP, SNAP + 0.45)) : 0
    const frame = t > SELFIE + 0.4 && t < SNAP + 0.3
    const photo = ease.back(seg(t, SNAP + 0.5, SNAP + 0.9))
    return (
      <g>
        {/* 하늘 · 먼 산들 · 구름 (멀리 있어 조금만 움직임) */}
        <defs><linearGradient id="hk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FCBEF" /><stop offset="1" stopColor="#E6F4FB" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#hk-sky)" />
        <g transform={`translate(${-camC * 0.15} 0)`}>
          {[[40, 22], [190, 14], [330, 30], [450, 18]].map(([x, y], i) => <path key={i} d={`M${x} ${y} q6 -10 16 -5 q8 -8 18 0 q10 0 8 8 H${x}Z`} fill="#fff" stroke="#C9DCE8" strokeWidth="1.5" />)}
          <path d="M-40 120 L30 70 L80 96 L140 58 L200 100 L260 64 L330 104 L400 72 L470 110 L520 120 V180 H-40Z" fill="#B8CCE0" stroke="#93AAC0" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M-40 140 L40 106 L110 128 L180 98 L250 130 L320 104 L400 132 L520 120 V180 H-40Z" fill="#9DBBA8" stroke="#7E9C8A" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
        {/* 뒤쪽 나무 (흐릿하게, 땅 뒤) */}
        {[-150, -70, 10, 95, 165, 215].map((wx, i) => i % 2 ? <Pine key={i} x={sx(wx)} y={sy(wx) + 4} s={0.9} c="#7FA88A" /> : <Leafy key={i} x={sx(wx)} y={sy(wx) + 4} s={1.05} c="#A6CF92" />)}
        <path d={ground} fill="#8CC377" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        {/* 비탈의 풀포기 · 작은 돌 · 들꽃 */}
        {Array.from({ length: 26 }, (_, i) => -190 + i * 17).filter((wx) => wx < EDGE - 10).map((wx, i) => (
          <g key={wx}>
            <path transform={`translate(${sx(wx)} ${sy(wx) + 18 + (i % 3) * 6})`} d="M-4 0 Q-3 -5 -5 -8 M0 0 Q0 -6 1 -9 M4 0 Q3 -5 5 -7" stroke="#5E9A50" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {i % 4 === 1 && <ellipse cx={sx(wx) + 8} cy={sy(wx) + 28} rx="4" ry="2.4" fill="#B8B2A6" stroke={INK} strokeWidth="0.9" />}
            {i % 3 === 2 && <g transform={`translate(${sx(wx) - 6} ${sy(wx) + 24})`}><path d="M0 0 V-5" stroke="#4E8A3A" strokeWidth="1" />{[0, 72, 144, 216, 288].map((d) => <ellipse key={d} cx="0" cy="-7.4" rx="1.1" ry="1.7" fill={['#F2708A', '#FFE27A', '#fff', '#C77FD0'][i % 4]} stroke={INK} strokeWidth="0.4" transform={`rotate(${d} 0 -6)`} />)}<circle cy="-6" r="0.8" fill="#F2C230" /></g>}
          </g>
        ))}
        {/* 흙길 + 통나무 계단 */}
        <path d={trail} stroke="#D9C49A" strokeWidth="9" fill="none" strokeLinecap="round" />
        {Array.from({ length: 22 }, (_, i) => -180 + i * 20).filter((wx) => wx < SX - 10).map((wx) => <rect key={wx} x={sx(wx) - 6} y={sy(wx) + 3} width="12" height="5" rx="2.5" fill="#9A6A3E" stroke={INK} strokeWidth="1.2" />)}
        {/* 이정표 */}
        <g transform={`translate(${sx(40)} ${sy(40) + 4})`}>
          <rect x="-2.5" y="-46" width="5" height="46" fill="#9A6A3E" stroke={INK} strokeWidth="1.6" />
          <path d="M-2 -46 H34 L42 -39 L34 -32 H-2Z" fill="#E9D3A8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <text x="18" y="-35.5" textAnchor="middle" fontSize="8.5" fill={INK}>정상 200m</text>
        </g>
        {/* 정상: 정상석 · 가장자리 바위 */}
        {/* 정상 뒤쪽: 큰 바위 무더기 · 소나무 (빈 곳을 채움) */}
        <g transform={`translate(${sx(EDGE - 10)} ${sy(SX) + 6})`}>
          <path d="M-30 0 Q-34 -30 -12 -40 Q4 -52 22 -38 Q40 -30 44 -8 L46 0Z" fill="#A8A296" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M-12 -40 Q-4 -30 -8 -14 M22 -38 Q16 -24 24 -10" stroke="#8A8478" strokeWidth="1.6" fill="none" />
          <path d="M14 0 Q16 -18 32 -20 Q50 -20 58 0Z" fill="#B8B2A6" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M-20 -30 q4 -3 8 -2 M30 -12 q4 -2 8 0" stroke="#CFCAC0" strokeWidth="2" fill="none" />
        </g>
        <Pine x={sx(EDGE + 26)} y={sy(SX) + 16} s={0.85} c="#4E8A5A" />
        {/* 정상석: 자연 바위에 글씨를 새김 (비석 모양이 아니게) */}
        <g transform={`translate(${sx(SX + 112)} ${sy(SX) + 4})`}>
          <path d="M-26 0 Q-30 -20 -20 -34 Q-8 -46 8 -44 Q24 -42 28 -24 Q31 -10 28 0Z" fill="#C9C4BA" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M-20 -34 Q-12 -30 -14 -20 M20 -38 Q16 -30 22 -22" stroke="#A8A296" strokeWidth="1.4" fill="none" />
          <text textAnchor="middle" x="2" y="-24" fontSize="9" fill={INK}>뒷산</text>
          <text textAnchor="middle" x="2" y="-11" fontSize="11" fill="#C2452D">정상</text>
          <text textAnchor="middle" x="2" y="-2" fontSize="6" fill={INK}>324m</text>
          {[-30, 30].map((dx) => <path key={dx} d={`M${dx} 2 q4 -8 10 -2`} fill="#6FAF5E" stroke={INK} strokeWidth="1" />)}
        </g>
        {/* 사람들 (뒤 친구 → 나) */}
        <Actor c={fr} x={sx(frX)} y={sy(frX)} size={SZ} pose={frPose} expr={frExpr} flip={t > POSE_AT} caneLean={t > ARRIVE && !frWalk} />
        <Actor c={me} x={sx(meX)} y={sy(meX)} size={SZ} pose={mePose} expr={meExpr} flip={t > YAHO + 1.4 && t < SELFIE} holding={t > SELFIE ? <g transform="rotate(-90) scale(0.85)"><Phone /></g> : undefined} caneLean={t > ARRIVE} />
        {/* 앞쪽 나무 (가까워서 크고 진함, 사람 안 가리게 아래쪽) */}
        {[-150, -10, 130].map((wx, i) => <g key={i} transform={`translate(${sx(wx)} ${sy(wx) + 26})`}><path d="M-26 4 Q-28 -12 -14 -14 Q-8 -26 6 -20 Q20 -24 24 -10 Q32 -2 26 4Z" fill="#5E9A50" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" /></g>)}
        <Sweat t={t} t0={1.9} x={sx(meX) + 20} y={meTop + 18} />
        <Sweat t={t} t0={REST0 + 0.2} x={sx(meX) + 26} y={meTop + 34} />
        {/* 메아리: 먼 산 쪽으로 작아지며 */}
        {[0, 0.5, 1.0].map((d, i) => { const k = seg(t, YAHO + 0.4 + d, YAHO + 1.6 + d); return k > 0 && k < 1 && <text key={i} x={200 + i * 36 + k * 10} y={74 - i * 8} fontSize={14 - i * 3} fill={INK} opacity={(1 - k) * (0.9 - i * 0.2)}>야호~</text> })}
        <Sparkle t={t} t0={ARRIVE + 0.3} x={sx(SX + 112)} y={sy(SX) - 66} s={1.1} />
        {/* 셀카 사진 틀 (폰 화면 모서리) */}
        {frame && <g stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round">
          {[[sx(SX + 64), frTop - 18, 1, 1], [sx(SX + 146), frTop - 18, -1, 1], [sx(SX + 64), sy(SX) + 6, 1, -1], [sx(SX + 146), sy(SX) + 6, -1, -1]].map(([x, y, dx, dy], i) => <path key={i} d={`M${x} ${(y as number) + 12 * (dy as number)} V${y} H${(x as number) + 12 * (dx as number)}`} />)}
        </g>}
        <Hearts t={t} t0={11.0} x={sx(frX)} y={frTop + 4} n={2} />
        {flash > 0 && <rect width={W} height={H} fill="#fff" opacity={flash * 0.6} />}
        {/* 찍힌 사진 (작게 튀어나옴) */}
        {photo > 0 && (
          <g transform={`translate(262 46) rotate(6) scale(${photo})`}>
            <rect x="-34" y="-28" width="68" height="60" rx="2" fill="#fff" stroke={INK} strokeWidth="1.8" />
            <rect x="-29" y="-23" width="58" height="42" fill="#BFE4F7" />
            <path d="M-29 9 Q0 2 29 9 V19 H-29Z" fill="#8CC377" />
            <path d="M14 10 L13 -6 Q20 -10 24 -6 L23 10Z" fill="#C9C4BA" stroke={INK} strokeWidth="0.9" />
            {[[-2, '#7FCB8A']].map(([x, c], i) => <g key={i}><circle cx={x as number} cy={-4} r="5" fill="#F6D2B8" stroke={INK} strokeWidth="0.9" /><path d={`M${(x as number) - 6} 12 Q${x} -2 ${(x as number) + 6} 12Z`} fill={c as string} stroke={INK} strokeWidth="0.9" /></g>)}
            <text x="0" y="28" textAnchor="middle" fontSize="7" fill={INK}>뒷산 정상!</text>
          </g>
        )}
        <Bubble t={t} t0={REST0 + 0.2} t1={REST1 + 0.3} x={sx(meX) + 44} y={meTop + 4} text="헉헉…" />
        <Bubble t={t} t0={REST1 + 0.2} t1={4.8} x={sx(frX) + 20} y={frTop - 12} text="조금만 더!" size={13} />
        <Bubble t={t} t0={ARRIVE + 0.2} t1={YAHO - 0.1} x={sx(meX) + 30} y={meTop - 12} text="정상이다!" />
        <Bubble t={t} t0={YAHO} t1={8.9} x={sx(meX) + 40} y={meTop - 12} text="야호~!" />
        <Bubble t={t} t0={SELFIE + 0.3} t1={SNAP} x={sx(meX) + 20} y={meTop - 12} text="자, 김치~" size={13} />
        <Bubble t={t} t0={SNAP} t1={SNAP + 0.8} x={sx(meX) + 20} y={meTop - 12} text="찰칵!" />
      </g>
    )
  },
}
