// 효과음·배경음 (2026-10-22 사용자: 진짜 소리로)
// 효과음은 Kenney.nl의 CC0 소리(public/sfx, mp3로 바꿈). 파일을 아직 못 불러왔거나 못 읽는 기기는 Web Audio로 만든 기본 소리
// 배경음은 파일 없이 Web Audio로 만든 멜로디. 단계마다 분위기가 다름
// 브라우저는 사용자가 한 번 누르기 전에는 소리를 못 내게 막으므로, 첫 클릭 때 AudioContext를 깨우고 파일을 불러옴

import type { StageId } from './engine/types'

export type Sfx = 'dice' | 'diceLand' | 'step' | 'coin' | 'bad' | 'bigBad' | 'fanfare' | 'click' | 'pop' | 'win' | 'lose' | 'spin' | 'tick'
  | 'myTurn' | 'snap' | 'cupDown' | 'cupUp' | 'bell' | 'warn'

const KEY = 'degul.sound'
type Prefs = { sfx: boolean; bgm: boolean; vol: number } // vol: 0~1
const DEFAULT: Prefs = { sfx: true, bgm: false, vol: 0.7 }
function load(): Prefs {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { ...DEFAULT } }
}
let prefs: Prefs = load()
export const soundPrefs = () => prefs
export function setSoundPrefs(p: Partial<Prefs>) {
  prefs = { ...prefs, ...p }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* 저장 못 해도 이번 판은 그대로 */ }
  if (master) master.gain.value = prefs.vol
  if (prefs.bgm) startBgm()
  else stopBgm()
}

let ctx: AudioContext | null = null
let master: GainNode | null = null // 소리 크기 (효과음·배경음 모두)
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
    master = ctx.createGain()
    master.gain.value = prefs.vol
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
// 첫 클릭·터치 때 소리 켜기 (배경음이 켜져 있으면 시작)
export function unlockAudio() {
  audio()
  loadFiles()
  if (prefs.bgm) startBgm()
}

// ── 소리 파일 ──
// 이름 여러 개면 번갈아 (발걸음). 크기는 소리마다 맞춤
const FILES: Partial<Record<Sfx, string[]>> = {
  dice: ['dice'], diceLand: ['dice-land'], step: ['step1', 'step2', 'step3'], coin: ['coin'], bad: ['bad'], bigBad: ['big-bad'],
  fanfare: ['fanfare'], click: ['click'], pop: ['pop'], win: ['win'], lose: ['lose'], spin: ['spin'], tick: ['tick'],
  myTurn: ['my-turn'], snap: ['snap'], cupDown: ['cup-down'], cupUp: ['cup-up'], bell: ['bell'], warn: ['warn'],
}
const GAIN: Partial<Record<Sfx, number>> = {
  dice: 1.6, diceLand: 1.4, step: 0.5, coin: 1.5, bad: 0.55, bigBad: 0.6, fanfare: 0.6, click: 0.35, pop: 0.5, win: 0.6, lose: 0.55,
  spin: 0.3, tick: 0.4, myTurn: 0.55, snap: 1, cupDown: 0.8, cupUp: 1.5, bell: 0.9, warn: 0.5,
}
const buffers = new Map<string, AudioBuffer>()
let loading = false
function loadFiles() {
  const a = audio()
  if (!a || loading) return
  loading = true
  const names = [...new Set(Object.values(FILES).flat())]
  for (const n of names) {
    fetch(`${import.meta.env.BASE_URL}sfx/${n}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
      .then((b) => a.decodeAudioData(b))
      .then((buf) => { buffers.set(n, buf) })
      .catch(() => { /* 못 불러오면 기본 소리 */ })
  }
}
const turn: Partial<Record<Sfx, number>> = {}
function playFile(name: Sfx): boolean {
  const a = audio()
  const list = FILES[name]
  if (!a || !master || !list) return false
  const i = (turn[name] = ((turn[name] ?? -1) + 1) % list.length)
  const buf = buffers.get(list[i])
  if (!buf) return false
  const src = a.createBufferSource()
  const g = a.createGain()
  g.gain.value = GAIN[name] ?? 1
  src.buffer = buf
  src.connect(g).connect(master)
  src.start()
  return true
}

// ── 파일이 없을 때 쓰는 기본 소리 ──
// 음 하나: 주파수, 시작(초), 길이(초), 파형, 크기
function tone(freq: number, at: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slideTo?: number) {
  const a = audio()
  if (!a || !master) return
  const t = a.currentTime + at
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}
// 짧은 잡음 (주사위 굴러가는 소리)
function noise(at: number, dur: number, vol = 0.05) {
  const a = audio()
  if (!a || !master) return
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  const g = a.createGain()
  g.gain.value = vol
  src.buffer = buf
  src.connect(g).connect(master)
  src.start(a.currentTime + at)
}

const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5

export function sfx(name: Sfx) {
  if (!prefs.sfx) return
  if (playFile(name)) return
  switch (name) {
    case 'dice': for (let i = 0; i < 6; i++) noise(i * 0.09, 0.05, 0.06); break
    case 'diceLand': tone(220, 0, 0.08, 'triangle', 0.1); break
    case 'step': tone(330, 0, 0.05, 'triangle', 0.04); break
    case 'coin': tone(E5 * 2, 0, 0.07, 'square', 0.05); tone(G5 * 2, 0.07, 0.18, 'square', 0.05); break
    case 'bad': case 'warn': tone(220, 0, 0.18, 'sawtooth', 0.05, 140); tone(150, 0.16, 0.3, 'sawtooth', 0.05, 90); break
    case 'bigBad': [E5, D5, C5].forEach((f, i) => tone(f / 2, i * 0.18, 0.3, 'sawtooth', 0.05)); break
    case 'fanfare': case 'myTurn': [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.45 : 0.12, 'square', 0.06)); break
    case 'click': case 'snap': tone(880, 0, 0.03, 'square', 0.03); break
    case 'pop': tone(600, 0, 0.08, 'sine', 0.08, 900); break
    case 'win': [G5, A5, C6].forEach((f, i) => tone(f, i * 0.08, 0.14, 'triangle', 0.08)); break
    case 'lose': [E5, D5, C5].forEach((f, i) => tone(f / 2, i * 0.12, 0.18, 'triangle', 0.07)); break
    case 'spin': tone(700, 0, 0.03, 'square', 0.025); break
    case 'tick': tone(1200, 0, 0.02, 'square', 0.02); break
    case 'cupDown': case 'cupUp': noise(0, 0.12, 0.08); break
    case 'bell': [C6, G5].forEach((f, i) => tone(f, i * 0.3, 0.8, 'sine', 0.08)); break
  }
}

// ── 배경음: 단계마다 다른 느긋한 멜로디를 작게 반복 (기본 꺼짐) ──
const G4 = 392, A4 = 440, B4 = 493.88, F5 = 698.46
type Tune = { melody: number[]; bass: number[]; ms: number; wave: OscillatorType }
const TUNES: Record<StageId, Tune> = {
  // 어린이: 밝고 통통
  child: { melody: [C5, E5, G5, E5, A5, G5, E5, 0, D5, E5, G5, A5, G5, E5, C5, 0], bass: [261.63, 196, 220, 196], ms: 260, wave: 'triangle' },
  // 학생: 경쾌하게
  student: { melody: [E5, G5, A5, G5, E5, D5, C5, D5, E5, E5, D5, C5, D5, E5, G5, 0], bass: [130.81, 174.61, 196, 130.81], ms: 300, wave: 'triangle' },
  // 청년: 힘차게
  young: { melody: [G4, C5, D5, E5, G5, E5, D5, C5, A4, C5, D5, E5, D5, C5, A4, 0], bass: [130.81, 110, 174.61, 196], ms: 300, wave: 'square' },
  // 중년: 따뜻하게
  middle: { melody: [C5, 0, E5, G5, F5, E5, D5, 0, B4, D5, F5, E5, D5, C5, 0, 0], bass: [130.81, 164.81, 174.61, 196], ms: 360, wave: 'triangle' },
  // 노년: 천천히, 조용히
  old: { melody: [E5, 0, D5, C5, 0, A4, G4, 0, A4, C5, D5, 0, C5, 0, 0, 0], bass: [130.81, 110, 87.31, 98], ms: 440, wave: 'sine' },
}
let tune: Tune = TUNES.student
let bgmTimer: ReturnType<typeof setInterval> | null = null
export function setBgmStage(id: StageId) {
  if (TUNES[id] === tune) return
  tune = TUNES[id]
  if (bgmTimer) { stopBgm(); startBgm() } // 빠르기가 바뀌므로 다시 시작
}
export function startBgm() {
  if (bgmTimer || !prefs.bgm || !audio()) return
  let i = 0
  const t = tune
  bgmTimer = setInterval(() => {
    const f = t.melody[i % t.melody.length]
    if (f) tone(f, 0, t.ms / 1000, t.wave, t.wave === 'square' ? 0.012 : 0.02)
    if (i % 4 === 0) tone(t.bass[(i / 4) % t.bass.length], 0, (t.ms * 3.5) / 1000, 'sine', 0.03)
    i++
  }, t.ms)
}
export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer)
  bgmTimer = null
}
