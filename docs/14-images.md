# 그림 파일로 바꾸기 (2026-10-29)

사용자 결정: 나중에 그림·배경을 코드 그림 대신 **이미지 파일**로 더 좋은 퀄리티로 바꿈. 그래서 그림을 넣을 자리를 미리 만들어 둠.

## 넣는 법

1. 그림 파일을 `app/src/assets/art/` 폴더에 넣는다
2. 파일 이름은 아래 표의 이름 그대로 (확장자는 `.webp` 추천, `.png`·`.svg`·`.jpg`도 됨)
3. GitHub에 올리면 끝. 이름이 맞는 그림이 있으면 그 그림을, 없으면 지금 코드 그림을 그대로 씀 (하나씩 바꿔도 됨)

- **배경은 투명**으로 (땅·하늘 그림만 빼고)
- **테마 판 전용 그림**: 이름 뒤에 `-spring`·`-summer`·`-autumn`·`-winter`를 붙임. 예: `tree-round-winter.webp`(눈 덮인 나무). **없으면 계절 모습이 있는 코드 그림**을 씀(2026-11-03, 기본 그림을 쓰면 계절 판이 초록이 돼서). 판 위 그림(건물·나무·꾸미기·땅·하늘)만 테마별로 됨. **건물만은 계절 그림이 없으면 기본 그림 파일**을 씀(2026-11-27, 건물 코드 그림엔 계절 차이가 없어서) → 계절마다 그릴 것은 땅·하늘·나무 2·꾸미기 6 = 10장. **겨울 10장 넣음(11-27)**
- 크기는 아래 '추천 크기'의 2배 정도로 만들면 폰에서도 선명함. 파일 하나는 200KB 안쪽이 좋음 (첫 화면이 느려지지 않게)
- 코드: `app/src/art/slots.ts` (파일 찾기), 각 그림 조각에서 `artFile(이름)`

## 판 (게임 화면)

| 파일 이름 | 무엇 | 추천 크기(가로×세로) | 비고 |
|---|---|---|---|
| `ground` | 땅(잔디) 무늬 | 512×512 | 위아래·양옆이 이어지는 반복 무늬. 투명 아님 |
| `sky` | 지평선 위 하늘·산 | 2000×400 | 아래쪽이 지평선. 투명 아님 |
| `tree-round` | 둥근 나무 | 90×150 | 아래 가운데가 땅에 닿는 곳 |
| `tree-pine` | 뾰족한 나무 | 90×150 | |
| `building-house` | 집 (우리 집·경로당) | 220×228 | 이름판은 코드가 그 아래에 그림 |
| `building-school` | 학교·유치원 | 220×228 | |
| `building-shop` | 상점·문방구·마트 | 220×228 | |
| `building-chapel` | 결혼식장 | 220×228 | |
| `building-office` | 회사·학원 | 220×228 | |
| `building-hospital` | 병원 | 220×228 | |
| `building-cafe` | 카페·분식집 | 220×228 | |
| `building-park` | 공원·놀이터 | 220×228 | |
| `building-apartment` | 원룸촌 | 220×228 | |
| `building-gym` | 헬스장 | 220×228 | |
| `building-library` | 도서관 | 220×228 | |
| `building-flower` | 꽃집 | 220×228 | |
| `landmark-sport` | 운동회 입구 | 260×270 | 이벤트 길 입구·미니게임 창 위 |
| `landmark-brain` | 두뇌 올림피아드 | 260×270 | |
| `landmark-fest` | 축제 거리·학교 축제 | 260×270 | |
| `landmark-casino` | 카지노 | 260×270 | |
| `landmark-travel` | 세계일주 | 260×270 | |
| `decor-bush` `decor-flowers` `decor-pond` `decor-fence` `decor-rocks` `decor-tuft` | 판 바깥 잔디 꾸미기 (덤불·꽃밭·연못·울타리·바위·풀) | 덤불 190×110, 꽃밭 210×100, 연못 320×145, 울타리 300×100, 바위 180×80, 풀 110×65 | 연못·꽃밭은 땅에 눕혀서 보임 |

## 칸 그림

`tile-` + 칸 종류: `tile-good`(좋은 일) `tile-money` `tile-grow` `tile-happy` `tile-risk`(위기) `tile-card`(랜덤이벤트) `tile-stop` `tile-date`(연애) `tile-mini` `tile-rest` `tile-goal` `tile-work`(업무 칸, 11-03) `tile-shop`(상점) — 각 96×96. **11-23 모두 넣음**

## 사건 창 그림

**11-23 모두 넣음** (파일은 300×250). 결정 창·칸 사건 창·큰 사건 배너의 작은 그림이 모두 이 파일을 씀(11-23 전엔 칸 사건 창·배너는 코드 그림만 썼음). 배너 위 큰 장면(`SCENES`)은 아직 코드 그림

`event-` + 이름 (120×100): `marriage` `baby` `shop` `job` `biz` `medal` `book` `family` `sign` `dice` `heart` `ticket` `card` `grow` `travel` `amusement` `walk` `rest` `game` `friends` `playground` `karaoke` `hike` `garden` `trophy` `cake` `broken` `warn` `grad` `money`

## 미니게임

- 테마 게임 창 위 그림 (260×200): `theme-art-bloom`(봄) `theme-art-sun`(여름) `theme-art-fall`(가을) `theme-art-snow`(겨울)
- 미니게임 안 작은 그림 `mini-` + 이름 (96×96): 랜드마크 `eiffel` `liberty` `castle` `moai` `pyramid` `ferris` / 짐 `passport` `toothbrush` `charger` `shirt` `sunscreen` `camera` `wallet` `sunglasses` `piano` `plant` `sofa` `bowling` `bike` `watermelon` `fishbowl` `tv` / 기억력 `apple` `star` `heart` `fish` `umbrella` `crown` / 슬롯·리듬·줄다리기 `seven` `diamond` `note` `flag`

## 아직 파일로 못 바꾸는 것

- **캐릭터·꾸미기**: 옷·머리·표정·나이·동작을 겹쳐 그려서 그림 한 장으로 못 바꿈. 바꾸려면 부위별 그림 묶음(머리·몸·팔·옷 따로)과 그리는 방식을 다시 정해야 함 → 따로 계획
- 주사위·카드·홀짝 컵, 룰렛, 낙엽·눈 날림, 버튼·창 모양
- 처음 화면 그림은 이미 이미지 파일 (`app/src/assets/title-art.webp`)
