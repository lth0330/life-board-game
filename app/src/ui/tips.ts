// 게임 팁 (2026-10-31 사용자): 내 상태창 아래에 돌아가며. 지금 상황에 맞는 것만 나옴
// 단계 번호: 0 어린이 · 1 학생 · 2 청년 · 3 중년 · 4 노년
import type { GameState, Player } from '../engine/types'

interface Tip { text: string; when: (s: GameState, p: Player) => boolean }
const adult = (s: GameState) => s.stageIdx >= 2
const working = (s: GameState) => s.stageIdx === 2 || s.stageIdx === 3

export const TIPS: Tip[] = [
  { text: '대출은 늦게 갚을수록 갚을 돈이 늘어요', when: (_, p) => p.loans.length > 0 },
  { text: '집이 있으면 월세를 안 내고 매 차례 행복이 올라요', when: (s, p) => working(s) && !p.house },
  { text: '집이 있으면 연애할 때 호감도가 더 잘 올라요', when: (s, p) => working(s) && !p.spouse && !p.house },
  { text: '운세가 좋으면 나쁜 일을 피하기도 해요', when: () => true },
  { text: '착한 선택을 하면 운세가 올라요', when: () => true },
  { text: '복권을 자주 사면 도박 중독에 걸릴 수 있어요', when: (s) => adult(s) },
  { text: '능력치가 높을수록 그 능력치 미니게임이 쉬워요', when: (s) => s.stageIdx <= 1 },
  { text: '대학을 나와야 고를 수 있는 직업이 있어요', when: (s) => s.stageIdx === 1 },
  { text: '대학 생활은 최대 4차례예요', when: (s, p) => s.stageIdx === 2 && p.campusTurns > 0 },
  { text: '승진 심사는 능력치만 맞으면 무조건 통과해요', when: (s, p) => s.stageIdx === 3 && !!p.jobId },
  { text: '적금은 만기까지 두면 이자가 커요', when: (s) => working(s) },
  { text: '보험이 있으면 사고가 나도 돈을 돌려받아요', when: (s) => adult(s) },
  { text: '휴식 칸에 닿았을 때 주사위가 남으면 남은 칸만큼 보너스를 받아요', when: (s) => s.stageIdx <= 3 },
  { text: '💼 업무 칸에 서면 내 직업 미니게임을 해요. 잘하면 보너스가 2배예요', when: (s, p) => working(s) && !!p.jobId },
  { text: '상점 💌 다시 만나기 카드로 만난 사람과 더 가까워질 수 있어요', when: (s, p) => working(s) && !p.spouse && p.suitors.length > 0 && !(p.bag ?? []).includes('reunion') },
  { text: '노년 카지노는 역전 기회지만 운세가 나쁘면 위험해요', when: (s) => s.stageIdx === 4 },
]

export const tipsFor = (s: GameState, p: Player) => TIPS.filter((t) => t.when(s, p)).map((t) => t.text)

// 설정: 이 기기에 기억 (처음엔 켜짐)
export function tipsOn(): boolean {
  try { return localStorage.getItem('dgl:tips') !== '0' } catch { return true }
}
export function setTipsOn(v: boolean) {
  try { localStorage.setItem('dgl:tips', v ? '1' : '0') } catch { /* 무시 */ }
}
