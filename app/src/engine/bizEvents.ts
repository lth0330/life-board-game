// 사업 기회 (2026-10-24 사용자: 창업하면 돈을 쓰는 이벤트가 많아야 함)
// 사업가 차례에 매 턴 20% → 하면 돈을 쓰고 판정 주사위로 대성공 / 효과 없음 / 실패
// 점수 = 주사위 + 사업 능력치의 절반 + 운세(대길↑ +1, 흉↓ -1)
import type { Sector } from './types'

export type BizRisk = 'normal' | 'risky' | 'wild'
export interface BizEvent {
  id: string
  title: string
  desc: string
  risk: BizRisk
  grow?: boolean // 대성공이면 돈 대신 회사가 한 단계 커짐 (더 못 크면 돈)
  sector?: Sector // 대성공 +15%, 실패 -10%
  great: string
  ok: string
  fail: string
}

// 위험도별: 비용 배율, 대성공·효과 없음 기준 점수, 대성공이면 비용의 몇 배를 받는지
export const BIZ_RISK: Record<BizRisk, { cost: number; great: number; ok: number; reward: number; name: string }> = {
  normal: { cost: 1, great: 8, ok: 5, reward: 2.5, name: '보통' },
  risky: { cost: 1.5, great: 9, ok: 6, reward: 4, name: '위험' },
  wild: { cost: 1, great: 10, ok: 8, reward: 6, name: '아주 위험' },
}
export const BIZ_OPP = {
  chance: 0.2, // 매 턴
  gap: 2, // 한 번 나오면 적어도 2턴 뒤에
  cost: [500, 1200, 2500], // 회사 크기별 기본 비용 (매 턴 기본 수익과 비슷)
  okBack: 0.5, // 효과 없음: 쓴 돈의 절반이 돌아옴
  failHappy: 2,
}

const COMMON: BizEvent[] = [
  { id: 'ad', title: '광고 내기', desc: 'TV·인터넷에 광고를 내요', risk: 'normal', great: '광고가 대박! 손님이 몰려왔다', ok: '광고를 냈지만 반응이 별로였다', fail: '광고 대행사가 돈만 받고 사라졌다' },
  { id: 'office', title: '사무실 넓히기', desc: '더 큰 곳으로 옮겨요', risk: 'normal', grow: true, great: '넓힌 사무실 덕분에 회사가 커졌다', ok: '넓혔지만 일이 늘진 않았다', fail: '공사 업체가 부실 공사를 했다' },
  { id: 'shady', title: '수상한 투자 제안', desc: '"수익 10배 보장!" 낯선 사람이 찾아왔어요', risk: 'wild', great: '진짜였다! 투자가 대박 났다', ok: '이상해서 반만 돌려받고 빠져나왔다', fail: '사기였다… 돈을 몽땅 날렸다' },
]

const FOOD: BizEvent[] = [
  { id: 'remodel', title: '가게 리모델링', desc: '가게를 예쁘게 새로 꾸며요', risk: 'normal', grow: true, great: '리모델링 뒤 손님이 폭발했다', ok: '리모델링했지만 효과가 없었다', fail: '인테리어 업자에게 사기를 당했다' },
  { id: 'delivery', title: '배달 시작', desc: '배달 앱에 가게를 올려요', risk: 'normal', great: '배달 주문이 쏟아졌다', ok: '배달 주문이 가끔 들어온다', fail: '배달 사고가 이어져 접었다' },
  { id: 'menu', title: '신메뉴 개발', desc: '새 메뉴를 만들어요', risk: 'normal', great: '신메뉴가 SNS에서 유행했다', ok: '신메뉴가 그냥 그랬다', fail: '신메뉴가 혹평을 받았다' },
]

// 업종 이름 → 그 업종 이벤트
export const BIZ_EVENTS: Record<string, BizEvent[]> = {
  카페: FOOD,
  식당: FOOD,
  'IT 스타트업': [
    { id: 'game', title: '게임 개발', desc: '모바일 게임을 만들어요', risk: 'risky', sector: 'IT', great: '출시한 게임이 인기 1위!', ok: '게임을 냈지만 조용히 묻혔다', fail: '개발이 끝없이 늦어져 접었다' },
    { id: 'app', title: '앱 출시', desc: '새 앱을 만들어 내놔요', risk: 'normal', sector: 'IT', great: '앱 다운로드가 100만을 넘었다', ok: '앱을 쓰는 사람이 적었다', fail: '앱에 큰 오류가 나서 내렸다' },
    { id: 'global', title: '해외 진출', desc: '외국에 지사를 내요', risk: 'risky', grow: true, great: '해외에서 통했다! 회사가 커졌다', ok: '해외 사업이 제자리걸음이다', fail: '해외 지사를 닫고 돌아왔다' },
  ],
  '바이오 연구소': [
    { id: 'drug', title: '신약 개발', desc: '새 약을 만들어요', risk: 'risky', sector: '생명', great: '신약 개발 성공! 큰 계약을 맺었다', ok: '임상 결과가 애매했다', fail: '임상 시험에서 실패했다' },
    { id: 'lab', title: '연구 장비 들이기', desc: '최신 장비를 사요', risk: 'normal', sector: '생명', great: '새 장비로 특허를 땄다', ok: '장비를 들였지만 성과는 아직이다', fail: '장비가 고장 나 수리비만 들었다' },
  ],
  '개인 병원': [
    { id: 'device', title: '최신 장비 들이기', desc: '최신 검사 장비를 사요', risk: 'normal', sector: '의료', great: '장비 소문이 나서 환자가 몰렸다', ok: '장비를 들였지만 환자는 그대로다', fail: '장비 리스 사기를 당했다' },
    { id: 'expand', title: '병원 넓히기', desc: '진료실을 늘려요', risk: 'normal', grow: true, great: '병원이 커졌다', ok: '넓혔지만 환자가 늘진 않았다', fail: '공사가 늦어져 문을 오래 닫았다' },
  ],
  '엔터 기획사': [
    { id: 'debut', title: '신인 그룹 데뷔', desc: '연습생들을 데뷔시켜요', risk: 'risky', sector: '엔터', great: '신인 그룹이 음원 1위!', ok: '데뷔했지만 아직 무명이다', fail: '데뷔 직전 멤버들이 흩어졌다' },
    { id: 'drama', title: '드라마 제작', desc: '드라마를 직접 만들어요', risk: 'risky', sector: '엔터', great: '드라마 시청률 대박!', ok: '시청률이 그저 그랬다', fail: '드라마가 조기 종영했다' },
  ],
  '유통 회사': [
    { id: 'warehouse', title: '물류 창고 짓기', desc: '큰 창고를 지어요', risk: 'normal', grow: true, great: '빠른 배송으로 회사가 커졌다', ok: '창고를 지었지만 물건이 그대로다', fail: '창고 공사 업체가 도망갔다' },
    { id: 'import', title: '해외 상품 수입', desc: '외국 물건을 들여와요', risk: 'normal', great: '수입한 상품이 품절 대란!', ok: '수입품이 조금씩 팔린다', fail: '가짜 상품이었다' },
  ],
  학원: [
    { id: 'branch', title: '새 분원 열기', desc: '다른 동네에 학원을 하나 더 내요', risk: 'normal', grow: true, great: '분원이 꽉 찼다! 회사가 커졌다', ok: '분원에 학생이 적다', fail: '분원 건물주와 다툼이 나 문을 닫았다' },
    { id: 'online', title: '온라인 강의', desc: '인터넷 강의를 찍어요', risk: 'normal', great: '온라인 강의가 인기 1위!', ok: '듣는 사람이 적었다', fail: '강의가 불법으로 퍼졌다' },
  ],
  '경호·안전 회사': [
    { id: 'contract', title: '대형 행사 계약', desc: '큰 공연 경호를 맡으려 해요', risk: 'normal', great: '큰 계약을 따냈다', ok: '계약은 다른 회사로 갔다', fail: '행사에서 사고가 나 물어줬다' },
    { id: 'gear', title: '장비 바꾸기', desc: '새 장비와 차를 사요', risk: 'normal', grow: true, great: '새 장비 덕분에 회사가 커졌다', ok: '장비를 바꿨지만 일은 그대로다', fail: '불량 장비를 샀다' },
  ],
  '법률 사무소': [
    { id: 'suit', title: '대형 소송 맡기', desc: '큰 회사 소송을 맡아요', risk: 'risky', great: '대형 소송에서 이겼다!', ok: '소송이 합의로 끝났다', fail: '소송에서 지고 평판이 떨어졌다' },
    { id: 'expand', title: '사무소 넓히기', desc: '변호사를 더 뽑아요', risk: 'normal', grow: true, great: '사무소가 커졌다', ok: '넓혔지만 사건이 늘진 않았다', fail: '새로 뽑은 사람이 사고를 쳤다' },
  ],
  '스포츠 센터': [
    { id: 'machine', title: '새 운동기구', desc: '최신 운동기구를 들여요', risk: 'normal', great: '회원이 몰려왔다', ok: '회원 수가 그대로다', fail: '기구가 불량이라 반품도 안 됐다' },
    { id: 'chain', title: '체인점 내기', desc: '두 번째 센터를 내요', risk: 'normal', grow: true, great: '체인점이 잘된다! 회사가 커졌다', ok: '체인점이 겨우 버틴다', fail: '체인점이 문을 닫았다' },
  ],
}

// 업종 이벤트 + 모든 업종 이벤트 (수상한 투자 제안은 가끔만)
export function bizEventsFor(name: string): BizEvent[] {
  const own = BIZ_EVENTS[name] ?? []
  return [...own, ...own, ...COMMON.filter((e) => e.id !== 'shady'), COMMON.find((e) => e.id === 'shady')!]
}
export const findBizEvent = (name: string, id: string) => [...(BIZ_EVENTS[name] ?? []), ...COMMON].find((e) => e.id === id)
