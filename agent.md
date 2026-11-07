# agent.md — 포켓 수학 모험 (작업 인수인계)

이 문서는 다음 작업자(사람 또는 AI 에이전트)가 현재 상태를 바로 이어받기 위한 기록입니다.
프로젝트 루트: `D:\Programming\workspace_rea\poketmon_study`
게임 코드: `game/` (순수 HTML/JS, 빌드 도구 없음)

---

## 1. 목표
- 5~8살 어린이용 **수학 문제 + 포켓몬 포획** 로컬 웹 게임.
- 포켓몬고와 비슷한 흐름: 마을 탐험(3D 지도) → 지도 위 야생 포켓몬 조우 지점 5곳 찾아가기 / 포켓스톱 퀴즈 / 관장 배틀 → 도감·파트너·진화.
- 어셋은 **개인 학습용**. 외부 공유/배포 금지 (사용자와 합의됨). GPS·AR은 제외 (사용자 요청).

## 2. 사용자 정보 / 소통 방식
- 사용자는 한국어로 소통. 응답도 한국어.
- 사용자가 직접 파일(`map.js` 등)을 수정하는 경우가 있음 → 디스크 변경이 알림으로 오면 **현재 파일 상태를 존중**하고 되돌리지 말 것. 필요하면 Read로 확인.
- "이어서 해줘" 요청 시: 이 문서 → 관련 파일 Read → 변경 → 검증 순서.
- 시각 확인이 어려운 경우가 많음. 결과를 과장하지 말고 "헤드리스 스크린샷으로 확인했고, 실제 브라우저 확인은 필요"처럼 명확히 보고.

## 3. 파일 구조

```
game/
├─ index.html         진입점. 스크립트 로드 순서 중요 (아래 참고)
├─ style.css          화면 스타일 (라이트/다크 토큰, 지도 HUD, 방향 버튼)
├─ app.js             게임 로직: 화면(홈/지도/조우/배틀/포켓스톱/파트너/도감), 문제 생성, 포획, 진화, 저장
├─ map.js             3D 마을 지도 (Three.js r128): 타일맵 생성, 플레이어(스킨드 아바타), 이동, 카메라
├─ scene3d.js         3D 조우 연출 (포켓몬 빌보드 + 3D 볼 던지기)
├─ README.md          사용자용 간단 설명
└─ assets/
   ├─ pokemon/*.png           포켓몬 공식 아트워크 153종 (PokeAPI 공식 아트워크: 1세대 151 + 172 피츄, 242 해피너스)
   ├─ pokemon-data.js         위 이미지를 data URI로 묶은 파일 (file:// 에서 WebGL 텍스처 사용용)
   ├─ avatar/*.png|json       추출한 아바타 텍스처/메쉬 중간 산출물 (현재 런타임에서는 사용 안 함)
   ├─ avatar-rig-data.js      트레이너 남/여 아바타: 메쉬 + 뼈 + 바인드 행렬 + 스킨 가중치 + 텍스처(data URI)
   ├─ ui/*.png, sfx/*.wav     포켓볼·별·버튼 이미지, 효과음 (Unity 번들에서 추출)
```

스크립트 로드 순서 (`index.html`): three.js(cdnjs r128) → `assets/pokemon-data.js` → `scene3d.js` → `map.js` → `assets/avatar-rig-data.js` → `app.js`
- `app.js`는 `PokeMap`(map.js), `Scene3D`(scene3d.js)를 전역으로 씀.
- `avatar-rig-data.js`는 `window.AVATAR_RIGS = { male: [...], female: [...] }`.

## 4. 핵심 설계 결정 (왜 이렇게 했는지)

| 주제 | 결정 | 이유 |
|---|---|---|
| 엔진 | 3D는 Three.js r128 (cdnjs). Phaser는 제거됨 | 사용자가 3D 지도 요청. r128은 `three.min.js` 전역 방식이라 file:// 에서 동작 |
| file:// 제약 | 이미지/메쉬 데이터는 **JS 파일에 data URI/배열로 묶음** | Chrome은 file://에서 fetch/JSON 로드 불가, 로컬 이미지는 WebGL 텍스처로 쓰면 SecurityError |
| 지도 | 절차적 생성 (`generate(village)`), 24×16 타일, 마을 50개 | 외부 맵 어셋 없이 마을별 다른 배치 |
| 문제 | `makeQuestion(age, lvl)` 나이 5~8별 문제 | 연령 맞춤 |
| 조우 난이도 | 야생 레벨 − 파트너 레벨 = d → 문제 레벨/정답 수/도망 허용 오답 조정 | 사용자 요구 |
| 야생 조우 | 랜덤 풀숲 조우 없음. 마을마다 야생 포켓몬 5마리를 지도에 미리 배치(빨간 볼 + 이름표), 찾아가서 밟으면 조우. 잡으면 지점이 사라지고(`done`), 도망가면 다른 풀밭 칸에 새 랜덤 포켓몬으로 재배치(`app.js respawnSpot`, 다른 지점·원래 자리와 3칸 이상 떨어진 칸). 지점 좌표는 `spotCache`에 보관하므로 고정 배치가 아님. 풀숲(T) 밟으면 15% 랜덤 조우(`map.js GRASS_ENCOUNTER`). 배치는 `map.js generate()`의 `spots`(마을 번호 시드, 길에서 걸어 닿는 풀밭만, 서로 3칸 이상 간격), 포켓몬 정보는 `app.js spotsFor()`가 마을별로 메모리에 보관 | 사용자 요구 |
| 이동 | 8방향. 화면 하단 왼쪽 D-pad(8버튼), 키보드(방향키 2개 동시 = 대각선), 지도 화면을 누르면 캐릭터 기준으로 누른 쪽으로 걸음(누르고 있으면 반복). 대각선은 양옆 두 칸이 모두 걸을 수 있을 때만 (`map.js canStep`) | 사용자 요구 |
| 관장 | 랜덤 등장 없음, 지도에서 직접 선택 | 사용자 요구 |
| 포켓몬 등급 | `app.js POKEMON`의 `tier`(1·2·3) = 진화 단계 (기본=1, 중간=2, 최종·단독=3). 전설(`legendary: true`)은 랜덤 조우·관장 풀에서 제외. 신규 117종은 이 규칙 + PokeAPI 한국어 이름·속성·진화 레벨 사용. 기존 36종의 등급은 바꾸지 않음(가디·고오스·이브이·미뇽 등 6종은 단계 규칙과 다름, 검토 결과 참고). 평균 종족값: 1단계 304 / 2단계 358 / 3단계 485 | 사용자 요구 |
| 난이도 구간 | `app.js DIFFICULTY_BANDS`: 마을 10개씩 5구간 (초급 1~10, 입문 11~20, 중급 21~30, 상급 31~40, 최상급 41~50). 구간마다 야생 등급 비율(`weights`)과 관장 최대 등급(`cap`)이 다름. `bandOf(village)`로 조회, 지도 제목에 구간 표시 | 사용자 요구 |
| 야생 레벨 | `genWild`: `round(2 + village*1.1 + (tier-1)*4 + rand(0,2))`, 상한 60. 이전 식(`1 + village*3`)은 마을 20 부근에서 상한에 닿아 난이도 차이가 사라졌음 | 밸런스 수정 |
| 마을 선택 | 지도 화면의 "🧭 클리어한 마을 선택" → `renderVillagePick()`: 배지를 받은 마을만 목록에 표시. 다음 마을 이동(`#move`)은 기존대로 순서대로만 | 사용자 요구 |
| 속성 기본 스킬 | `SKILLS`에 없는 포켓몬은 속성별 기본 스킬(`TYPE_SKILL`, `skillOf()`) | 신규 종 스킬 자동 부여 |
| 고유 스킬 | 포켓몬마다 스킬 1개 (`app.js SKILLS`, 36종 전부). 관장 대결에서 문제를 맞히면 `SKILL_CHANCE`(35%) 확률로 파트너 스킬 발동 → 추가 피해 + `Scene3D.impact(fx)` 색 조각 연출. APK 어셋에는 기술 이름/데이터가 없음(영문 기술명 검색 결과 없음, 이펙트 이름만 있음) → 스킬 이름·색은 직접 정함 | 사용자 요구 |
| 진화 | 파트너만 성장, Lv10 1차 / Lv20 2차. 진화 시 도감의 이전 종은 교체 | 사용자 요구 |
| 볼 | 보유 개수 소모형 (몬스터볼 10 시작, 나머지는 포켓스톱에서 획득) | 포켓몬고 흐름 |
| 아바타 | Unity 번들(`sharedassets0.assets`)에서 추출 → 뼈대 스킨드 메쉬 | 사용자 요구 (트레이너 모델) |
| 걷기/대기 | **절차적 뼈 회전** (Unity 클립 디코딩 안 함) | 클립 포맷이 Unity 5 압축 형식이라 비용 큼. 대신 뼈 회전으로 흉내 |

## 5. 아바타 구현에서 얻은 중요한 사실 (삽질 기록)

1. **Unity 바인드 행렬**: `Matrix4x4f`의 `e{row}{col}`. Three.js용 column-major 배열 = `[e00,e10,e20,e30, e01,...]` (전치). 추출 스크립트 `rig_export.py`의 `col_major()`가 이를 처리.
2. **`SkinnedMesh.bind(skel)`를 bindMatrix 없이 부르면** Three가 뼈 역행렬을 현재 위치로 **재계산**해서 바인드가 깨짐. 반드시 `bind(skel, new THREE.Matrix4())`.
3. **`matrixAutoUpdate=false` 뼈는** 자식이 자동 갱신되지 않음 → `rigRoot.updateMatrixWorld(true)`를 매 프레임 호출.
4. **일부 뼈는 행렬식 < 0 (좌우 반전)** → `decompose()` 쓰면 찌그러짐. 행렬을 그대로 씀 (`bone.matrix.copy(local)`).
5. **스킨드 메쉬의 프러스텀 컬링**: 경계 구가 메쉬 좌표 기준이라 잘못 가려짐 → `frustumCulled = false`.
6. 각 파트의 뼈 목록은 파트마다 다름(남 77, 여 84). 같은 이름의 뼈는 파트별로 따로 만듦(`rigParts[].bones[name]`).
7. 헤드리스 Edge 스크린샷은 `--force-device-scale-factor=3`에서 너무 느려 타임아웃됨 → 기본 배율 사용. 큰 배율은 백그라운드로.

### 현재 팔 자세 (미해결)
- 바인드 포즈는 팔이 T자(수평). 자세는 `map.js`의 `buildRig` 안 `ARM_OPEN_DEG` / `ARM_ROT`(어깨 뼈 회전)로 조정.
- 상태: 뼈 계산(수치)과 렌더 결과가 **서로 맞지 않음**. 15도 벌림이 검증되지 않음. 사용자는 "아무리 조정해도 안 된다"고 보고.
- 대안(미구현): 팔 정점을 JS에서 미리 회전(베이킹)해 자세를 고정 → 예측 가능하나 팔 흔들림 애니메이션은 별도 구현 필요. **사용자 결정 대기 중.**

### 방향 (정리)
- 모델 앞면은 **+Z** (머리 메쉬가 -Z 쪽으로 더 길게 뻗음). `rigRoot.rotation.y = playerT.rotation.y` (추가 π 없음). 사용자가 "좌우 위아래 맞춰졌다"고 확인함.

## 6. 데이터 재생성 방법

작업 중간 파일은 `%TEMP%\claude\...\scratchpad`에 있음 (세션마다 경로가 다름). 재생성이 필요하면 아래 순서. 모든 Python은 **Python 3.12** 사용 (3.8은 UnityPy 최신 버전 불가).

- Python 위치: `%LOCALAPPDATA%\Programs\Python\Python312\python.exe` (winget으로 설치)
- 필수 패키지: `UnityPy`, `Pillow` (`pip install UnityPy Pillow`)
- 원본: `apk\pokemongo\assets\bin\Data\sharedassets0.assets.split*` + `sharedassets0.resource.split*` → 이어 붙여 `sharedassets0.assets` / `sharedassets0.resource`로 만든 뒤 작업 디렉터리를 그 폴더로 두고 실행.
  - 이어 붙이기: split0~107 을 순서대로 바이너리 결합 (`sa0` 폴더 사용).

| 산출물 | 스크립트 (scratchpad) | 비고 |
|---|---|---|
| 스프라이트/UI 이미지 | `extract.py` | `game/assets/ui`, `sfx`에 일부 복사 |
| 효과음 | `extract_sfx.py` | 큰 파일(101,102,108)은 제외 |
| 포켓몬 번들 | `bundle_pokemon.py` | `assets/pokemon/*.png` → `pokemon-data.js` (256px 축소) |
| 아바타 리그 | `rig_export.py` | 남/여 파트, 뼈, 바인드, 스킨, 텍스처 → `avatar-rig-data.js` |

스크립트 자체가 scratchpad에 있으므로, 세션이 바뀌면 이 문서에 적힌 로직을 참고해 다시 작성해야 할 수 있음.

## 7. 검증 방법

- 문법: `node --check game/<file>.js`
- 로직 테스트: Node `vm`으로 파일을 로드해 함수 호출 (DOM 스텁 사용). 과거에 한 것: 문제 생성 정답/보기 검증, 난이도, 경험치/진화, 배틀 승패, 포켓스톱 보상·쿨다운, 마을 50개 도달 가능성.
- 화면: 헤드리스 Edge
  ```
  msedge.exe --headless --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader --window-size=400,800 --virtual-time-budget=4000 --screenshot=<png> file:///...\_map_test.html
  ```
  테스트용 HTML은 `game/_map_test.html`로 만들고 **반드시 삭제** (남기면 사용자 폴더 오염).
- 수치 확인: `--dump-dom`으로 페이지 안 값을 `<div id="out">`에 JSON으로 출력. `PokeMap.debug()` → `{ rigRoot, rigParts, playerT }`.
- 스크린샷은 작아서 세부 판단이 어려움. 팔·방향처럼 세밀한 것은 수치와 함께 볼 것.

## 8. 현재 알려진 문제 / 다음 할 일

1. **팔 자세** (최우선 미해결): 15도 벌림 보장 안 됨. 사용자 결정 필요 — 베이킹 방식으로 전환할지.
2. **여자 트레이너 텍스처**: 피부가 밝고 얼굴/머리 디테일 부족. 텍스처를 재료 기준으로 정확히 매핑하면 개선 (Unity 머티리얼 해석 필요, 현재는 이름 매칭).
3. **걷기/대기**: 절차적 뼈 회전. 실제 원작 클립 아님. 팔 흔들림은 팔 자세 문제와 엮여 있음.
4. **실제 브라우저 검증 미완료**: 이동 버튼, 조우, 포켓스톱, 관장 진입, 아바타 방향을 사용자가 직접 확인하는 중.
5. 조우 난이도/포켓스톱 확률/포획 확률은 임의 값 → 플레이 피드백 필요.
6. `map.js`에 디버그용 `api.debug` 노출이 남아 있음 (테스트용, 제거 가능).

## 9. 작업 원칙 (이어서 할 때)
- 파일 편집 전 반드시 Read. 사용자가 편집했을 수 있음.
- 큰 변경 후에는 `node --check`와 가능하면 헤드리스 확인.
- 확인하지 못한 것은 "확인 안 됨"이라고 명시.
- 어셋 추출/사용은 개인 학습용 범위 유지. 공개·배포 제안 금지.
- 테스트 파일/임시 파일은 프로젝트 `game/`에 남기지 않기.
