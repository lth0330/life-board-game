import type { Rng } from './rng'
import type { ForkId, UniEvent, MiniId, PointKind, RoadId, Stage, StageId, StopEvent, Tile, TileKind } from './types'

// 단계별 길 설계. 숫자는 '깊이'(본 길 기준 몇 번째 칸). docs/01-structure.md, 11-event-maps.md

interface LifeFork {
  id: Exclude<ForkId, 'event'>
  at: number
  rejoin: number
  title: string
  text: string
  roads: [ForkRoad, ForkRoad]
}
interface ForkRoad { road: RoadId; label: string; desc: string }

interface EventRoad { at: number; rejoin: number; len: number; name: string; minis: MiniId[]; desc: string }

interface StageDef {
  id: StageId
  name: string
  ages: [number, number]
  rolls: number | null
  length: number
  weights: [TileKind, number][]
  stops: Record<number, StopEvent>
  points: Record<number, PointKind>
  dateUntil?: number // 이 깊이 뒤에는 데이트 칸 없음 (중년 결혼식장 뒤)
  campus?: boolean // 본 길 옆 대학교 출발 칸 (대학 간 사람은 여기서 시작)
  life?: LifeFork
  event: EventRoad
  event2?: EventRoad // 같은 갈림길에서 고르는 두 번째 이벤트 길 (반대쪽)
}

export const STAGE_DEFS: StageDef[] = [
  {
    id: 'child', name: '어린이', ages: [1, 7], rolls: 4, length: 20,
    weights: [['grow', 35], ['happy', 30], ['money', 10], ['card', 15], ['risk', 10]],
    stops: {}, points: {},
    life: {
      id: 'academy', at: 5, rejoin: 10, title: '학원 vs 실컷 놀기', text: '어린 시절을 어떻게 보낼까요?',
      roads: [
        { road: 'academy', label: '학원 길', desc: '지력이 크는 칸이 많아요' },
        { road: 'play', label: '놀이 길', desc: '행복·매력 칸이 많아요' },
      ],
    },
    event: { at: 12, rejoin: 17, len: 5, name: '운동회', minis: ['race', 'tug', 'throw'], desc: '칸마다 체력 미니게임이 있어요 (체력이 높을수록 쉬워요)' },
  },
  {
    id: 'student', name: '학생', ages: [8, 19], rolls: 8, length: 40,
    weights: [['grow', 30], ['card', 25], ['happy', 15], ['money', 15], ['risk', 15]],
    stops: { 6: 'club' }, points: {},
    event: { at: 13, rejoin: 20, len: 9, name: '두뇌 올림피아드', minis: ['memory', 'pairs', 'quickmath'], desc: '칸마다 지력 미니게임이 있어요 (지력이 높을수록 쉬워요)' },
    event2: { at: 13, rejoin: 20, len: 9, name: '학교 축제', minis: ['rhythm', 'firstImpression', 'dance'], desc: '매력 미니게임 (매력이 높을수록 쉬움, 이기면 매력↑)' },
  },
  {
    id: 'young', name: '청년', ages: [20, 39], rolls: 10, length: 50,
    weights: [['money', 22], ['card', 18], ['date', 32], ['risk', 14], ['happy', 9], ['grow', 8]],
    // 대학생이 3차례 늦게 출발해도 둘째 결혼식장(20)에 대부분 닿도록 앞쪽에 모음 (docs/13-review.md)
    // 직업 칸 = 출발 칸 (바로 취업은 제자리에서 고름, 대학 졸업생은 여기로 합류. 2026-10-17 사용자)
    stops: { 0: 'job' }, points: { 5: 'shop', 10: 'marriage', 18: 'shop', 20: 'marriage' },
    campus: true,
    event: { at: 11, rejoin: 17, len: 7, name: '축제 거리', minis: ['firstImpression', 'rhythm', 'confess'], desc: '칸마다 연애·매력 미니게임이 있어요 (매력이 높을수록 쉬워요)' },
  },
  {
    id: 'middle', name: '중년', ages: [40, 59], rolls: 8, length: 40,
    weights: [['money', 25], ['risk', 25], ['happy', 20], ['card', 20], ['grow', 10], ['date', 20]],
    // 12: 승진 심사 (능력치 조건만 맞으면 무조건 한 단계 승진, 2026-10-17 사용자)
    // 20 취업 박람회는 2026-10-21 없앰 (창업은 인생 2막 갈림길에서 누구나)
    stops: { 12: 'promotion', 15: 'middleBranch' }, points: { 13: 'marriage', 17: 'shop' }, dateUntil: 13,
    life: {
      id: 'startup', at: 5, rejoin: 11, title: '인생 2막', text: '앞으로 어떻게 살까요? (창업하면 지금 직업은 그만두고 퇴직금을 받아요)',
      roads: [
        { road: 'startup', label: '창업 길', desc: '직업에 맞는 회사(백수는 카페)를 차려요. 큰돈과 위기가 섞인 길이에요' },
        { road: 'company', label: '하던 일 계속', desc: '지금 하는 일을 이어 가요. 안정적인 길이에요' },
      ],
    },
    event: { at: 21, rejoin: 28, len: 9, name: '세계일주', minis: ['snap', 'pack', 'photo'], desc: '칸마다 행복 미니게임이 있어요 (지력·체력이 높을수록 쉬워요)' }, // 2026-10-21 카지노와 자리 바꿈
  },
  {
    id: 'old', name: '노년', ages: [60, 80], rolls: null, length: 22,
    weights: [['card', 40], ['happy', 20], ['money', 20], ['risk', 20]], // 노년 행복 몰림 줄이기 (2026-10-17)
    stops: {}, points: {}, // 노년 상점은 없앰 (2026-10-21 사용자)
    life: {
      id: 'retire', at: 1, rejoin: 7, title: '은퇴지 고르기', text: '어디서 노후를 보낼까요?',
      roads: [
        { road: 'city', label: '도시 길', desc: '매 턴 돈이 오르내려요 (위험한 만큼 보상도 커요)' },
        { road: 'country', label: '시골 길', desc: '매 턴 행복 +2, 행복 칸이 많아요' },
      ],
    },
    event: { at: 10, rejoin: 16, len: 8, name: '카지노', minis: ['oddEven', 'highLow', 'slot'], desc: '마지막 역전 기회! 가진 돈의 10~50%를 걸어요 (운세가 좋을수록 유리하고, 도박중독에 주의해요)' },
  },
]

export const EVENT_ROAD_NAME: Record<StageId, string> = Object.fromEntries(STAGE_DEFS.map((d) => [d.id, d.event.name])) as Record<StageId, string>

// 본 길은 돈·성장·행복 칸을 '좋은 일' 칸 하나로 합침 (무엇이 나올지는 도착했을 때 정함, 2026-10-16 사용자)
// 옆길(학원·일·도시·시골 등)은 길 성격이 드러나도록 원래 칸 그대로
const GOOD_PARTS: TileKind[] = ['money', 'grow', 'happy']
function mainWeights(d: StageDef): [TileKind, number][] {
  const good = d.weights.filter(([k]) => GOOD_PARTS.includes(k)).reduce((a, [, w]) => a + w, 0)
  return [...d.weights.filter(([k]) => !GOOD_PARTS.includes(k)), ['good', good]]
}

const ROAD_WEIGHTS: Partial<Record<RoadId, [TileKind, number][]>> = {
  academy: [['grow', 70], ['card', 15], ['happy', 15]],
  play: [['happy', 50], ['grow', 30], ['card', 20]],
  college: [['grow', 60], ['card', 25], ['risk', 15]],
  work: [['money', 70], ['card', 15], ['risk', 15]],
  startup: [['money', 45], ['risk', 40], ['card', 15]],
  company: [['money', 40], ['happy', 30], ['card', 20], ['risk', 10]],
  city: [['money', 50], ['risk', 30], ['card', 20]],
  country: [['happy', 80], ['card', 20]], // 노년은 능력치가 안 바뀌게 성장 칸 없음 (2026-10-17 사용자)
}

export function buildStage(d: StageDef, rng: Rng): Stage {
  const tiles: Tile[] = []
  const mainIdx: Record<number, number> = {}
  const removed = (dep: number) => !!d.life && dep > d.life.at && dep < d.life.rejoin

  // 본 길
  for (let dep = 0; dep < d.length; dep++) {
    if (removed(dep)) continue
    let kind: TileKind = dep === 0 ? 'good' : rng.weighted(mainWeights(d))
    if (kind === 'date' && d.dateUntil !== undefined && dep > d.dateUntil) kind = 'good'
    if (dep === d.length - 1) kind = d.rolls ? 'rest' : 'goal'
    const t: Tile = { kind, next: [], d: dep, lane: 0, road: 'main' }
    if (d.stops[dep]) { t.kind = 'stop'; t.stop = d.stops[dep] }
    if (d.points[dep]) t.point = d.points[dep]
    mainIdx[dep] = tiles.push(t) - 1
  }
  const mainKeys = Object.keys(mainIdx).map(Number).sort((a, b) => a - b)
  mainKeys.forEach((dep, k) => {
    const nextDep = mainKeys[k + 1]
    if (nextDep !== undefined && !(d.life && dep === d.life.at)) tiles[mainIdx[dep]].next.push(mainIdx[nextDep])
  })

  // 인생 갈림길: 두 길이 나란히 갈라졌다가 합쳐짐 (본 길 구간은 없음)
  if (d.life) {
    const lf = d.life
    const len = lf.rejoin - lf.at - 1
    const starts: number[] = []
    lf.roads.forEach((r, side) => {
      let prev = -1
      for (let k = 0; k < len; k++) {
        const w = ROAD_WEIGHTS[r.road] ?? d.weights
        const idx = tiles.push({ kind: rng.weighted(w), next: [], d: lf.at + 1 + k, lane: side === 0 ? -1 : 1, road: r.road }) - 1
        if (prev >= 0) tiles[prev].next.push(idx)
        else starts.push(idx)
        prev = idx
      }
      tiles[prev].next.push(mainIdx[lf.rejoin])
    })
    const forkTile = tiles[mainIdx[lf.at]]
    forkTile.next = starts
    forkTile.fork = {
      id: lf.id, title: lf.title, text: lf.text,
      options: lf.roads.map((r, i) => ({ label: r.label, desc: r.desc, to: starts[i], road: r.road })),
    }
  }

  // 대학교: 대학 간 사람의 출발 칸 → 대학 길 9칸을 주사위로 걷고 → 졸업하면 본 길 직업 칸으로
  if (d.campus) {
    const jobDep = Number(Object.keys(d.stops).find((k) => d.stops[+k] === 'job'))
    const UNI: [UniEvent, number][] = [['study', 40], ['love', 15], ['parttime', 15], ['exam', 15], ['party', 10], ['scholar', 5]] // study = 캠퍼스 생활(지력·매력·체력 중 고름)
    const gate = tiles.push({ kind: 'campus', next: [], d: -9, lane: -1, road: 'campus' }) - 1
    let prev = gate
    for (let k = 0; k < 9; k++) {
      const idx = tiles.push({ kind: 'uni', uni: rng.weighted(UNI), next: [], d: -8 + k, lane: -1, road: 'campus' }) - 1
      tiles[prev].next = [idx]
      prev = idx
    }
    tiles[prev].next = [mainIdx[jobDep]]
  }

  // 이벤트 길: 본 길 옆으로 빠졌다가 조금 앞에서 합류. 칸마다 미니게임 (학생은 양쪽에 하나씩, 둘 중 고름)
  const buildEvent = (ev: EventRoad, lane: number) => {
    const minis = [...ev.minis]
    const order: MiniId[] = []
    for (let k = 0; k < ev.len; k++) {
      if (k % minis.length === 0) minis.sort(() => rng.next() - 0.5)
      order.push(minis[k % minis.length])
    }
    const spacing = (ev.rejoin - ev.at) / (ev.len + 1)
    let prev = -1
    let first = -1
    order.forEach((mini, k) => {
      const idx = tiles.push({ kind: 'mini', mini, next: [], d: ev.at + (k + 1) * spacing, lane, road: 'event' }) - 1
      if (prev >= 0) tiles[prev].next.push(idx)
      else first = idx
      prev = idx
    })
    tiles[prev].next.push(mainIdx[ev.rejoin])
    return first
  }
  const ev = d.event
  const lane1 = d.life && d.life.at < ev.at && ev.at < d.life.rejoin ? -1 : 1
  const first = buildEvent(ev, lane1)
  const second = d.event2 ? buildEvent(d.event2, -lane1) : -1
  const evFork = tiles[mainIdx[ev.at]]
  const mainNext = evFork.next[0]
  evFork.next = [...evFork.next, first, ...(second >= 0 ? [second] : [])]
  evFork.fork = {
    id: 'event', title: d.event2 ? `${ev.name}? ${d.event2.name}?` : `${ev.name}로 갈까요?`, text: `옆길로 빠지면 칸마다 미니게임이 있어요. ${ev.desc}${d.event2 ? ` / ${d.event2.name}: ${d.event2.desc}` : ''}`,
    options: [
      { label: '본 길로 가기', desc: '그대로 가요', to: mainNext, road: 'main' },
      { label: `${ev.name} 길`, desc: ev.desc, to: first, road: 'event' },
      ...(d.event2 ? [{ label: `${d.event2.name} 길`, desc: d.event2.desc, to: second, road: 'event' as RoadId }] : []),
    ],
  }
  return { id: d.id, name: d.name, ages: d.ages, rolls: d.rolls, tiles }
}

export function buildStages(rng: Rng): Stage[] {
  return STAGE_DEFS.map((d) => buildStage(d, rng))
}

export const maxDepth = (st: Stage) => st.tiles.reduce((m, t) => Math.max(m, t.d), 0)
export const isEnd = (t: Tile) => t.next.length === 0

// 지금 칸에서 n칸 안에 있는 칸들과 거리 (모든 갈래 포함)
export function distancesFrom(st: Stage, from: number, maxSteps = 6): Map<number, number> {
  const dist = new Map<number, number>()
  let frontier = [from]
  for (let step = 1; step <= maxSteps; step++) {
    const nextF: number[] = []
    for (const i of frontier) for (const n of st.tiles[i].next) {
      if (!dist.has(n)) { dist.set(n, step); nextF.push(n) }
    }
    frontier = nextF
  }
  return dist
}

// 앞으로 k칸 가면 닿는 칸 (갈림길에서는 첫 번째 길, 정지 칸에서 멈춤)
export function walkAhead(st: Stage, from: number, steps: number, prefer?: number | null): number {
  let i = from
  for (let k = 0; k < steps; k++) {
    const t = st.tiles[i]
    if (!t.next.length) break
    i = t.next.length > 1 && prefer != null && t.next.includes(prefer) ? prefer : t.next[0]
    const nt = st.tiles[i]
    if (nt.kind === 'stop' || nt.kind === 'goal') break
  }
  return i
}

// 화면 배치: 칸이 좁게 모인 옆길(이벤트 길 등)은 좌우로 번갈아 놓아 칸끼리 안 겹치게 (2026-10-21 사용자)
// 칸 크기 120px, 깊이 1 = 150px라 깊이 차이가 0.95보다 작으면 위아래로 겹침
export const ZIG = 190 // 바깥쪽으로만 번갈아 (본 길 쪽으로 가면 본 길 칸과 겹침)
export function zigOffsets(st: Stage): Map<Tile, number> {
  const out = new Map<Tile, number>()
  const groups = new Map<string, Tile[]>()
  for (const t of st.tiles) if (t.road !== 'main') groups.set(`${t.road}:${t.lane}`, [...(groups.get(`${t.road}:${t.lane}`) ?? []), t])
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => a.d - b.d)
    const tight = sorted.some((t, k) => k > 0 && t.d - sorted[k - 1].d < 0.95)
    if (tight) sorted.forEach((t, k) => out.set(t, k % 2 ? Math.sign(t.lane || 1) * ZIG : 0))
  }
  return out
}
// 판 위 칸 자리 (px). 화면(ui/Board.tsx)과 겹침 시험이 같이 씀
export const LANE_PX = 250
export const tileX = (t: Tile, zig: Map<Tile, number>) => 540 + Math.round(Math.sin(t.d * 0.55) * 150) + t.lane * LANE_PX - 60 + (zig.get(t) ?? 0)
export const tileY = (t: Tile) => 1600 - t.d * 150
