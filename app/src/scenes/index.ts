// 사건 장면 목록: 사건 문장에 맞는 장면을 고름 (맞는 게 없으면 지금처럼 그림 한 장)
import type { SceneDef } from './Stage'
import { fall } from './fall'
import { eat } from './eat'
import { accident } from './accident'
import { cold } from './cold'
import { wallet } from './wallet'
import { fight } from './fight'
import { karaoke } from './karaoke'
import { hike } from './hike'
import { pet } from './pet'
import { leak } from './leak'
import { wedding } from './wedding'
import { baby } from './baby'
import { house } from './house'
import { promo } from './promo'
import { grad } from './grad'
import { lottery } from './lottery'
import { amusement } from './amusement'
import { gamenight } from './gamenight'
import { garden } from './garden'
import { backpain } from './backpain'
import { typhoon } from './typhoon'
import { scam, scamUsed } from './scam'
import { date } from './date'
import { birthday } from './birthday'
import { uniPass } from './uniPass'
import { playground } from './playground'
import { cafeJob } from './cafeJob'
import { rest } from './rest'
import { bbq } from './bbq'
import { reunion } from './reunion'
import { seniorCenter } from './seniorCenter'
import { campusCouple } from './campusCouple'
import { festival } from './festival'
import { grandchild } from './grandchild'
import { kidWed } from './kidWed'
import { schoolTrip } from './schoolTrip'
import { classPresident } from './classPresident'
import { firstPhone } from './firstPhone'
import { confessFail } from './confessFail'
import { autobiography } from './autobiography'
import { photos } from './photos'
import { exam } from './exam'
import { grandkids } from './grandkids'

/** 사건이 나오는 나이 (게임 코드 기준, 11-28 사용자: 일어날 수 없는 나이는 만들지 않기) */
export type AgeGroup = 'kid' | 'teen' | 'adult' | 'old'
export interface SceneEntry { scene: SceneDef; match: RegExp; title: string; mood: 'good' | 'bad'; friends?: boolean; ages: AgeGroup[]; sample: string; samples?: Partial<Record<AgeGroup, string>> }
// 같은 장면의 변형 (사건 문장으로 배경·소품이 바뀜). 목록에서 따로 보이게 id만 다르게
const fallPark = { ...fall, id: 'fallPark' }, fallRide = { ...fall, id: 'fallRide' }

export const SCENES: SceneEntry[] = [
  { scene: fallPark, match: /놀이터에서 넘어져/, title: '넘어지기 (놀이터)', mood: 'bad', ages: ['kid'], sample: '놀이터에서 넘어져 무릎이 까졌다' },
  { scene: fallRide, match: /스쿠터를 타다 넘어져/, title: '넘어지기 (스쿠터)', mood: 'bad', ages: ['adult', 'old'], sample: '스쿠터를 타다 넘어져 다쳤다' },
  { scene: scamUsed, match: /중고 거래 사기/, title: '중고 사기', mood: 'bad', ages: ['adult'], sample: '중고 거래 사기를 당했다' },
  { scene: eat, match: /떡볶이|맛집/, title: '친구들과 떡볶이', mood: 'good', friends: true, ages: ['teen'], sample: '친구들과 떡볶이를 먹었다!' },
  { scene: accident, match: /접촉 사고/, title: '접촉 사고', mood: 'bad', friends: true, ages: ['adult', 'old'], sample: '접촉 사고가 났다' },
  { scene: cold, match: /감기에 걸려/, title: '감기', mood: 'bad', ages: ['kid', 'teen', 'adult', 'old'], sample: '감기에 걸려 병원에 갔다' },
  { scene: wallet, match: /지갑을 잃어버렸다|용돈을 잃어버렸다/, title: '지갑 잃어버림', mood: 'bad', ages: ['kid', 'teen', 'adult', 'old'], sample: '지갑을 잃어버렸다', samples: { kid: '모아 둔 용돈을 잃어버렸다' } },
  { scene: fight, match: /친구와 크게 싸웠다/, title: '친구와 싸움', mood: 'bad', friends: true, ages: ['kid', 'teen', 'adult', 'old'], sample: '친구와 크게 싸웠다' },
  { scene: karaoke, match: /노래방/, title: '노래방', mood: 'good', friends: true, ages: ['teen'], sample: '친구들과 노래방에 갔다!' },
  { scene: hike, match: /뒷산|등산/, title: '등산', mood: 'good', friends: true, ages: ['old'], sample: '친구들과 뒷산에 올랐다!' },
  { scene: pet, match: /반려동물과 공원/, title: '반려동물 산책', mood: 'good', ages: ['adult', 'old'], sample: '반려동물과 공원을 산책했다!' },
  { scene: leak, match: /물이 샜다/, title: '집에 물이 샘', mood: 'bad', ages: ['adult', 'old'], sample: '집에 물이 샜다' },
  { scene: wedding, match: /^(?!.*자녀).*결혼!/, title: '결혼', mood: 'good', friends: true, ages: ['adult'], sample: '결혼!' },
  { scene: baby, match: /아기가 태어났다|아기 탄생/, title: '아기 탄생', mood: 'good', ages: ['adult'], sample: '아기가 태어났다!' },
  { scene: house, match: /내 집 마련/, title: '내 집 마련', mood: 'good', ages: ['adult', 'old'], sample: '내 집 마련 완료' },
  { scene: promo, match: /승진!|바로 취업|합격이다/, title: '승진·취업', mood: 'good', friends: true, ages: ['adult'], sample: '승진!' },
  { scene: grad, match: /졸업/, title: '졸업', mood: 'good', friends: true, ages: ['teen', 'adult'], sample: '대학 졸업', samples: { teen: '고등학교 졸업' } },
  { scene: lottery, match: /복권 \d등/, title: '복권 당첨', mood: 'good', ages: ['adult', 'old'], sample: '복권 1등!' },
  { scene: amusement, match: /놀이동산/, title: '놀이동산', mood: 'good', friends: true, ages: ['adult'], sample: '아이들과 놀이동산에 갔다!' },
  { scene: gamenight, match: /게임을 했다/, title: '밤샘 게임', mood: 'good', ages: ['kid', 'adult'], sample: '밤새 게임을 했다!', samples: { kid: '친구네서 게임을 했다!' } },
  { scene: garden, match: /텃밭/, title: '텃밭', mood: 'good', ages: ['old'], sample: '텃밭에서 상추를 땄다!' },
  { scene: backpain, match: /허리 디스크가 왔다|허리가 아프기|무릎을 다쳤|무릎 수술/, title: '허리·무릎 삐끗', mood: 'bad', ages: ['adult', 'old'], sample: '허리 디스크가 왔다' },
  { scene: typhoon, match: /태풍 피해/, title: '태풍 피해', mood: 'bad', ages: ['adult', 'old'], sample: '태풍 피해' },
  { scene: scam, match: /보이스피싱/, title: '보이스피싱', mood: 'bad', ages: ['old'], sample: '보이스피싱 전화에 속았다' },
  { scene: date, match: /데이트[.!]/, title: '데이트', mood: 'good', ages: ['adult'], sample: '첫 데이트!' },
  // 11-28 추가 (장면 없는 사건 중 많이 나오는 것부터)
  { scene: birthday, match: /^(칠순|육순) 잔치/, title: '칠순·육순 잔치', mood: 'good', ages: ['old'], sample: '칠순 잔치', samples: {} },
  { scene: uniPass, match: /(일반대|체대|예대·방송대) 합격!/, title: '대학 합격', mood: 'good', ages: ['teen', 'adult'], sample: '일반대 합격!' },
  { scene: playground, match: /놀이터에서 신나게/, title: '놀이터에서 놀기', mood: 'good', friends: true, ages: ['kid'], sample: '놀이터에서 신나게 놀았다!' },
  { scene: cafeJob, match: /카페 알바/, title: '카페 알바', mood: 'good', ages: ['adult'], sample: '카페 알바를 했다.' },
  { scene: rest, match: /집에서 푹 쉬었다/, title: '집에서 푹 쉬기', mood: 'good', ages: ['adult'], sample: '집에서 푹 쉬었다.' },
  { scene: bbq, match: /맛집에 갔다/, title: '맛집 (고깃집)', mood: 'good', friends: true, ages: ['adult', 'old'], sample: '친구들과 맛집에 갔다!' },
  { scene: reunion, match: /옛 동창을|친구들과 동창회\./, title: '동창회', mood: 'good', friends: true, ages: ['adult', 'old'], sample: '오랜 친구들과 동창회.', samples: { old: '옛 동창을 오랜만에 만났다!' } },
  { scene: seniorCenter, match: /경로당/, title: '경로당 수다', mood: 'good', friends: true, ages: ['old'], sample: '경로당 친구들과 수다를 떨었다!' },
  { scene: campusCouple, match: /캠퍼스 커플/, title: '캠퍼스 커플', mood: 'good', ages: ['adult'], sample: '캠퍼스 커플!' },
  { scene: festival, match: /축제와 MT/, title: '축제·MT', mood: 'good', friends: true, ages: ['adult'], sample: '축제와 MT!' },
  { scene: grandchild, match: /손주 탄생!/, title: '손주 탄생', mood: 'good', ages: ['adult', 'old'], sample: '손주 탄생!' },
  { scene: kidWed, match: /자녀 결혼!/, title: '자녀 결혼', mood: 'good', ages: ['adult', 'old'], sample: '자녀 결혼!' },
  { scene: schoolTrip, match: /수학여행!/, title: '수학여행', mood: 'good', friends: true, ages: ['teen'], sample: '수학여행!' },
  { scene: classPresident, match: /반장 선거 당선/, title: '반장 선거', mood: 'good', friends: true, ages: ['teen'], sample: '반장 선거 당선!' },
  { scene: firstPhone, match: /첫 휴대폰/, title: '첫 휴대폰', mood: 'good', ages: ['teen'], sample: '첫 휴대폰이 생겼다.' },
  { scene: confessFail, match: /고백했다가 차였다/, title: '고백했다 차임', mood: 'bad', ages: ['teen'], sample: '짝사랑에게 고백했다가 차였다' },
  { scene: autobiography, match: /자서전을 썼다/, title: '자서전 쓰기', mood: 'good', ages: ['old'], sample: '자서전을 썼다.' },
  { scene: photos, match: /옛 사진을 정리/, title: '옛 사진 정리', mood: 'good', ages: ['old'], sample: '옛 사진을 정리했다.' },
  { scene: exam, match: /시험을 잘 봤다|시험을 망쳤다/, title: '대학 시험', mood: 'good', ages: ['adult'], sample: '시험을 잘 봤다!', samples: {} },
  { scene: grandkids, match: /손주들이 놀러|손주가 찾아왔다|손주에게 용돈/, title: '손주 방문', mood: 'good', ages: ['old'], sample: '손주들이 놀러 왔다!' },
]
// 11-28 게임 연결: '감기 기운이 있었지만 멀쩡했다'·'허리 디스크가 올 뻔했지만'·'데이트 칸에서'·집 없는 사람의 '태풍이 왔다' 같은 문장은 장면이 안 나오게 좁힘
export const sceneFor = (text: string) => SCENES.find((s) => s.match.test(text))
