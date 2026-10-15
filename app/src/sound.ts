// 효과음·배경음. 소리 파일 없이 Web Audio로 직접 만든 기본 버전 — 아트 단계에서 진짜 소리로 바꿀 수 있음 (docs/12-art.md)
// 브라우저는 사용자가 한 번 누르기 전에는 소리를 못 내게 막으므로, 첫 클릭 때 AudioContext를 깨움

export type Sfx = 'dice' | 'step' | 'coin' | 'bad' | 'fanfare' | 'click' | 'pop' | 'win' | 'lose' | 'spin' | 'tick'

const KEY = 'degul.sound'
type Prefs = { sfx: boolean; bgm: boolean }
function load(): Prefs {
  try { return { sfx: true, bgm: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { sfx: true, bgm: false } }
}
let prefs: Prefs = load()
export const soundPrefs = () => prefs
export function setSoundPrefs(p: Partial<Prefs>) {
  prefs = { ...prefs, ...p }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* 저장 못 해도 이번 판은 그대로 */ }
  if (prefs.bgm) startBgm()
  else stopBgm()
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
// 첫 클릭·터치 때 소리 켜기 (배경음이 켜져 있으면 시작)
export function unlockAudio() {
  audio()
  if (prefs.bgm) startBgm()
}

// 음 하나: 주파수, 시작(초), 길이(초), 파형, 크기
function tone(freq: number, at: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slideTo?: number) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + at
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}
// 짧은 잡음 (주사위 굴러가는 소리)
function noise(at: number, dur: number, vol = 0.05) {
  const a = audio()
  if (!a) return
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  const g = a.createGain()
  g.gain.value = vol
  src.buffer = buf
  src.connect(g).connect(a.destination)
  src.start(a.currentTime + at)
}

const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5

export function sfx(name: Sfx) {
  if (!prefs.sfx) return
  switch (name) {
    case 'dice': for (let i = 0; i < 6; i++) noise(i * 0.09, 0.05, 0.06); tone(220, 0.55, 0.08, 'triangle', 0.1); break
    case 'step': tone(330, 0, 0.05, 'triangle', 0.04); break
    case 'coin': tone(E5 * 2, 0, 0.07, 'square', 0.05); tone(G5 * 2, 0.07, 0.18, 'square', 0.05); break
    case 'bad': tone(220, 0, 0.18, 'sawtooth', 0.05, 140); tone(150, 0.16, 0.3, 'sawtooth', 0.05, 90); break
    case 'fanfare': [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.45 : 0.12, 'square', 0.06)); break
    case 'click': tone(880, 0, 0.03, 'square', 0.03); break
    case 'pop': tone(600, 0, 0.08, 'sine', 0.08, 900); break
    case 'win': [G5, A5, C6].forEach((f, i) => tone(f, i * 0.08, 0.14, 'triangle', 0.08)); break
    case 'lose': [E5, D5, C5].forEach((f, i) => tone(f / 2, i * 0.12, 0.18, 'triangle', 0.07)); break
    case 'spin': tone(700, 0, 0.03, 'square', 0.025); break
    case 'tick': tone(1200, 0, 0.02, 'square', 0.02); break
  }
}

// 배경음: 느긋한 5음계 멜로디를 작게 반복 (기본 꺼짐)
let bgmTimer: ReturnType<typeof setInterval> | null = null
const MELODY = [C5, E5, G5, A5, G5, E5, D5, E5, C5, D5, E5, G5, E5, D5, C5, 0]
const BASS = [130.81, 130.81, 174.61, 174.61, 196, 196, 130.81, 130.81]
export function startBgm() {
  if (bgmTimer || !prefs.bgm || !audio()) return
  let i = 0
  bgmTimer = setInterval(() => {
    const f = MELODY[i % MELODY.length]
    if (f) tone(f, 0, 0.32, 'triangle', 0.018)
    if (i % 2 === 0) tone(BASS[(i / 2) % BASS.length], 0, 0.6, 'sine', 0.025)
    i++
  }, 340)
}
export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer)
  bgmTimer = null
}
