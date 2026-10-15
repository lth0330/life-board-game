import type { Rng } from './rng'
import type { ForkId, MiniId, PointKind, RoadId, Stage, StageId, StopEvent, Tile, TileKind } from './types'

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
    event: { at: 12, rejoin: 17, len: 5, name: '운동회', minis: ['race', 'tug', 'throw'], desc: '체력 미니게임 (체력이 높을수록 쉬움)' },
  },
  {
    id: 'student', name: '학생', ages: [8, 19], rolls: 8, length: 40,
    weights: [['grow', 30], ['card', 25], ['happy', 15], ['money', 15], ['risk', 15]],
    stops: { 6: 'club' }, points: {},
    event: { at: 13, rejoin: 20, len: 9, name: '두뇌 올림피아드', minis: ['memory', 'pairs', 'quickmath'], desc: '지력 미니게임 (지력이 높을수록 쉬움)' },
  },
  {
    id: 'young', name: '청년', ages: [20, 39], rolls: 10, length: 50,
    weights: [['money', 25], ['card', 22], ['date', 22], ['risk', 15], ['happy', 10], ['grow', 8]],
    // 대학생이 3차례 늦게 출발해도 둘째 결혼식장(20)에 대부분 닿도록 앞쪽에 모음 (docs/13-review.md)
    stops: { 1: 'job', 22: 'jobfair' }, points: { 5: 'shop', 10: 'marriage', 18: 'shop', 20: 'marriage' },
    campus: true,
    event: { at: 11, rejoin: 17, len: 7, name: '축제 거리', minis: ['firstImpression', 'rhythm', 'confess'], desc: '연애·매력 미니게임 (매력이 높을수록 쉬움)' },
  },
  {
    id: 'middle', name: '중년', ages: [40, 59], rolls: 8, length: 40,
    weights: [['money', 25], ['risk', 25], ['happy', 20], ['card', 20], ['grow', 10], ['date', 12]],
    stops: { 15: 'middleBranch', 20: 'jobfair' }, points: { 13: 'marriage', 17: 'shop' }, dateUntil: 13,
    life: {
      id: 'startup', at: 5, rejoin: 11, title: '창업 vs 회사', text: '인생 2막을 어떻게 할까요?',
      roads: [
        { road: 'startup', label: '창업 길', desc: '사업가가 돼요. 큰돈과 위기가 섞인 길' },
        { road: 'company', label: '회사 길', desc: '지금 일을 계속해요. 안정적인 길' },
      ],
    },
    event: { at: 21, rejoin: 28, len: 9, name: '카지노', minis: ['oddEven', 'highLow', 'slot'], desc: '돈·운세 미니게임 (운세가 좋을수록 유리, 도박중독 주의)' },
  },
  {
    id: 'old', name: '노년', ages: [60, 80], rolls: null, length: 22,
    weights: [['card', 35], ['happy', 30], ['money', 15], ['risk', 20]],
    stops: {}, points: {},
    life: {
      id: 'retire', at: 1, rejoin: 7, title: '은퇴지 고르기', text: '어디서 노후를 보낼까요?',
      roads: [
        { road: 'city', label: '도시 길', desc: '매 턴 돈이 오르내려요 (위험·보상)' },
        { road: 'country', label: '시골 길', desc: '매 턴 행복 +2, 행복 칸이 많아요' },
      ],
    },
    event: { at: 10, rejoin: 16, len: 8, name: '세계일주', minis: ['capital', 'souvenir', 'photo'], desc: '행복 미니게임 (지력이 높을수록 쉬움)' },
  },
]

export const EVENT_ROAD_NAME: Record<StageId, string> = Object.fromEntries(STAGE_DEFS.map((d) => [d.id, d.event.name])) as Record<StageId, string>

const ROAD_WEIGHTS: Partial<Record<RoadId, [TileKind, number][]>> = {
  academy: [['grow', 70], ['card', 15], ['happy', 15]],
  play: [['happy', 50], ['grow', 30], ['card', 20]],
  college: [['grow', 60], ['card', 25], ['risk', 15]],
  work: [['money', 70], ['card', 15], ['risk', 15]],
  startup: [['money', 45], ['risk', 40], ['card', 15]],
  company: [['money', 40], ['happy', 30], ['card', 20], ['risk', 10]],
  city: [['money', 50], ['risk', 30], ['card', 20]],
  country: [['happy', 60], ['grow', 20], ['card', 20]],
}

export function buildStage(d: StageDef, rng: Rng): Stage {
  const tiles: Tile[] = []
  const mainIdx: Record<number, number> = {}
  const removed = (dep: number) => !!d.life && dep > d.life.at && dep < d.life.rejoin

  // 본 길
  for (let dep = 0; dep < d.length; dep++) {
    if (removed(dep)) continue
    let kind: TileKind = dep === 0 ? 'happy' : rng.weighted(d.weights)
    if (kind === 'date' && d.dateUntil !== undefined && dep > d.dateUntil) kind = 'happy'
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

  // 대학교: 대학 간 사람의 출발 칸. 정해진 차례 동안 머물다 졸업하면 직업 칸으로
  if (d.campus) {
    const jobDep = Number(Object.keys(d.stops).find((k) => d.stops[+k] === 'job'))
    tiles.push({ kind: 'campus', next: [mainIdx[jobDep]], d: 0, lane: -1, road: 'campus' })
  }

  // 이벤트 길: 본 길 옆으로 빠졌다가 조금 앞에서 합류. 칸마다 미니게임
  const ev = d.event
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
    const idx = tiles.push({ kind: 'mini', mini, next: [], d: ev.at + (k + 1) * spacing, lane: d.life && d.life.at < ev.at && ev.at < d.life.rejoin ? -1 : 1, road: 'event' }) - 1
    if (prev >= 0) tiles[prev].next.push(idx)
    else first = idx
    prev = idx
  })
  tiles[prev].next.push(mainIdx[ev.rejoin])
  const evFork = tiles[mainIdx[ev.at]]
  evFork.next = [...evFork.next, first]
  evFork.fork = {
    id: 'event', title: `${ev.name}로 갈까요?`, text: `옆길로 빠지면 칸마다 미니게임이 있어요. ${ev.desc}`,
    options: [
      { label: '본 길로 가기', desc: '그대로 가요', to: evFork.next[0], road: 'main' },
      { label: `${ev.name} 길`, desc: ev.desc, to: first, road: 'event' },
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
