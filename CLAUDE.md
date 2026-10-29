# 데굴데굴 라이프 (인생게임류 웹 보드게임)

타카라토미 「인생게임 for Nintendo Switch」 같은 인생 보드게임을 **웹**으로 만드는 개인 프로젝트. 최대 4인, 솔로(AI)와 같이 하기 둘 다.

## 지금 상태 (2026-10-29)
- 기획 끝, 게임(`app/`) 동작, 온라인 배포 중: https://main.d16edqa9h9pqgu.amplifyapp.com (GitHub main에 올리면 자동 배포)
- 실행: `cd app && npm run dev`, 테스트 `npm test` (68개, 시간 제한 30초)
- 날짜별로 한 일·사용자 결정은 `docs/13-review.md` (맨 끝에 예전 `CLAUDE.md`의 10-17~10-29 기록도 옮겨 둠)
- 한 주제씩 천천히 정한다. 선택지는 2~4개 + 추천안과 이유를 함께
- 결정이 나면 바로 해당 문서에 기록하고, `docs/spec.md` 확정 요약 표·체크리스트도 갱신
- 사용자 아이디어에 허점이 있으면 솔직히 말한다 (예: 자동차 매 턴 ±1이 너무 강했던 것을 사용자가 먼저 지적함)

## 문서
- `docs/spec.md` — **먼저 읽을 것.** 확정 요약 + 진행 체크리스트 + 문서 목록
- `docs/13-review.md` 전체 점검·고친 것·사용자 결정 (날짜순, 최신이 끝)
- `docs/10-prototype.md` 시험판 현황 / `docs/12-art.md` 그림·연출 기본 버전 / `docs/14-images.md` **그림 파일로 바꾸기** (`app/src/assets/art/`에 이름 맞는 그림을 넣으면 코드 그림 대신 씀)
- `docs/01-structure.md` 구조 / `02-character.md` 능력치·직업 / `03-money.md` 돈·재테크 / `04-luck.md` 운세 / `05-marriage.md` 결혼 / `06-players.md` 플레이어끼리 / `07-cards.md` 카드 / `08-ai.md` AI / `reference.md` 참고 게임

## 온라인 (AWS)
- Amplify Gen 2 → Cognito·DynamoDB·AppSync·Amplify Hosting, 서울. 계정 433889138774 무료 플랜(크레딧 100달러, 2027-04-16까지), 요금 알림 `lifegame-monthly` 1달러
- 서버 설정 `app/amplify/`, 화면 쪽 `app/src/online/`, 방장 기기가 게임을 진행하고 상태를 올림. 같이 하기는 각자 기기로 (한 기기 여럿 문제는 고치지 않음)
- **비밀 파일은 절대 커밋하지 않기**: `aws.txt`(AWS·관리자 비밀번호), `google.txt`(구글 로그인 키). 둘 다 `.gitignore`
- 관리자: 처음 화면 ⚙️, 아이디 `admin`
- 구글 로그인: Google Cloud 프로젝트 `degul-life`·클라이언트 `degul-web`. 키는 AWS SSM 비밀 보관함(`GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`, sandbox와 main 각각). 리디렉션 URI는 Cognito 도메인 `…/oauth2/idpresponse` (sandbox `91fd253f8581921aeeef`, main `f1ed733f4a1a9d798dac`). 아이디 계정과 구글 계정은 따로. Google '테스트' 상태라 테스트 사용자만 → 모두 쓰려면 '앱 게시'
- 서버 설정을 바꾸면 먼저 `npx ampx sandbox --once`로 시험 환경에 올려 보기. main 비밀값 바꾸기는 자동 모드에서 막힘 → 스크립트를 만들어 사용자가 `!`로 실행
- `aws login`은 2026-10-29에 다시 됨 (만료되면 사용자가 `! aws login`). 배포 확인: `aws amplify list-jobs --app-id d16edqa9h9pqgu --branch-name main`, 또는 사이트 JS를 curl로 받아 새 문구 찾기

## 작업 주의
- `package-lock.json`이 어긋나면 Amplify의 `npm ci`가 실패함 → 패키지를 더하면 빈 폴더에서 `npm ci`로 확인
- 화면 확인: Edge(`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`)를 `--remote-debugging-port`로 띄워 CDP 스크립트로 조종·캡처. 서버 없이: `npx vite build --base ./ --outDir <scratchpad>` 뒤 `--allow-file-access-from-files`로 file:// 열기. 한 부분만 볼 땐 임시 `preview.html`+`src/preview.tsx`(커밋 안 함)
- agent-browser는 그리기를 멈출 때가 있음 → `--disable-renderer-backgrounding,--disable-backgrounding-occluded-windows`. 배포본 시험 뒤 시험 계정·방·행동·프로필은 지우기
- 밸런스 측정: AI끼리 1000판 시뮬레이션(임시 시험 파일, 커밋 안 함). 2026-10-29 기준 점수 중간값 224 (재산 121·행복 95·상 16)
- 밸런스 결정(바꾸지 않기): AI 성격끼리 점수 차이는 안 맞춤(대신 어려움이면 첫 AI는 가족형), 의사 1위 그대로, 주가 오름세 안 넣음

## 다음에 할 것
- 정리: `game.ts`(약 3,300줄)를 주제별 파일로 나누기 (게임 동작은 그대로)
- 고르기 남은 것: 아이디 계정과 구글 계정 합치기, 봄·여름 미니게임에 새 규칙(지금은 가을·겨울과 같은 규칙), 캐릭터를 그림 파일로 바꿀 계획서, 폰에 앱처럼 설치, '지난 차례 뒤 일어난 일' 창 저절로 닫기, 협력 후보(`06-players.md` 맨 아래)
- 나중에: 그림·배경을 이미지 파일로 더 좋은 퀄리티로, 판 밖(전체 지도·대기실·미니게임 창) 테마, 겨울 지붕 눈, 진짜 3D(맨 마지막)
- 사용자에게 물어볼 것: 주사위 굴릴 때 '댓글도 이상해진다'가 어떤 화면인지

## ⭐ 사용자가 직접 해 볼 것 (아직 사람이 못 본 것)
- **두 기기 온라인**: 손님 쪽 주사위가 안 사라지는지, 다른 사람이 굴리는 주사위가 보이는지('spin'), '지난 차례 뒤 일어난 일' 창 빈도(자주면 3~4초 뒤 저절로 닫히게), 미니게임 중 나가기, 방장 연결 끊김 안내(방장 폰 화면 끄고 45초)
- **대회·같은 칸 대결**(두 기기): 준비 완료·3·2·1이 같이 뜨는지, 다른 사람 장면이 늦거나 끊기지 않는지, 가위바위보 동시에 고르기
- **테마**: 대기실 테마 버튼·판 테마, 테마 게임 손맛(낙엽·나비 크기와 빠르기, 친구가 나와 있는 시간), 테마 사건 문구
- **구글 로그인**: 로그인 → 구글로 로그인 → 돌아와서 닉네임 정하기 (구글 클라우드 '대상'의 테스트 사용자 이메일로). 관리자·내 계정 화면의 구글 계정 표시
- **폰**: 주사위 던지기(투명 문제), 판 0.76배 크기, Pretendard 글꼴·'~요' 문장, 직업 특성 문구, 가로 폰 안내
- 그 밖: 춤 동작 번호, 청년 이후 주식 탭, 결산 화면, 소리, 룰렛 손가락으로 끌기, 배경, 노년 카지노, 혼자 팀전 설정

## 작업 방식
- 기본은 **코드를 고치기 전에 바꿀 내용을 먼저 보여 주고 확인받기**. 단 사용자가 "물어보지 말고 진행"이라고 한 범위는 진행하고, 판단이 어렵거나 사용자가 골라야 할 것만 묻기
- 서버(`npm run dev`)는 사용자가 켜 달라고 할 때만. 배포는 GitHub main에 올리면 자동

## 사용자
- 개발 초보. 쉬운 말로, 용어는 풀어서 설명
- 문구는 짧고 흔하지 않게
- 커밋에 Claude 공동작성자 표기 넣지 않기
