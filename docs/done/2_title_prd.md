## 시리즈 글 제목 포맷 통일 - PRD

### 1. 배경 및 목적

`contents/` 디렉토리의 시리즈 글(`series:` 메타데이터가 있는 글) 제목에서 편 번호 표기 방식이 혼재되어 있다. 동일한 시리즈 내에서도 `(1)`, `(5)`, `5편` 등 서로 다른 포맷이 섞여 있어 일관성이 떨어지고 시리즈 소속 글이라는 인식을 저해한다.

- 기존 포맷 예시: `Golang Concurrency (1) - ...`, `MQTT v5 완벽 가이드 (3): ...`, `Golang Concurrency 5편 - ...`
- **목표 포맷**: `N편` (예: `1편`, `2편`, `3편`)
- **기준 사례**: `Golang Concurrency 5편 - Context 완벽 가이드` (이미 목표 포맷 준수)

### 2. 변환 규칙

**Title 변환 규칙:**

| 기존 포맷 | 변환 후 |
|---|---|
| `... (1): 본문` | `... 1편: 본문` |
| `... (2) - 본문` | `... 2편 - 본문` |

원칙:
- 괄호 `(N)` → `N편`으로 치환
- 뒤따르는 구분자(`:`, `-`)와 띄어쓰기는 그대로 유지
- 숫자 외 다른 텍스트는 변경하지 않음

### 3. 수정 대상

#### 3.1 Title 필드 (총 12개 파일)

**MQTT v5 완벽 가이드 시리즈 (5개) — `database/`**

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `contents/database/mqtt-v5-완벽-가이드-1-입문과-기본-아키텍처/index.md` | `"MQTT v5 완벽 가이드 (1): 개념과 아키텍처 이해하기"` | `"MQTT v5 완벽 가이드 1편: 개념과 아키텍처 이해하기"` |
| `contents/database/mqtt-v5-완벽-가이드-2-topic-설계와-메시지-모델/index.md` | `"MQTT v5 완벽 가이드 (2): Topic 설계와 메시지 모델"` | `"MQTT v5 완벽 가이드 2편: Topic 설계와 메시지 모델"` |
| `contents/database/mqtt-v5-완벽-가이드-3-qos-session-재연결-전략/index.md` | `"MQTT v5 완벽 가이드 (3): QoS, Session, 재연결 전략"` | `"MQTT v5 완벽 가이드 3편: QoS, Session, 재연결 전략"` |
| `contents/database/mqtt-v5-완벽-가이드-4-고급-기능과-보안/index.md` | `"MQTT v5 완벽 가이드 (4): 고급 기능과 보안"` | `"MQTT v5 완벽 가이드 4편: 고급 기능과 보안"` |
| `contents/database/mqtt-v5-완벽-가이드-5-go-paho-실전-구현과-운영/index.md` | `"MQTT v5 완벽 가이드 (5): Go + Paho 실전 구현과 운영"` | `"MQTT v5 완벽 가이드 5편: Go + Paho 실전 구현과 운영"` |

**Golang Generics 시리즈 (3개) — `go/`**

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `contents/go/golang-generics-1-개요와-기본-문법/index.md` | `"Golang Generics (1) - 개요와 기본 문법"` | `"Golang Generics 1편 - 개요와 기본 문법"` |
| `contents/go/golang-generics-2-type-constraint-완벽-이해/index.md` | `"Golang Generics (2) - Type Constraint 완벽 이해"` | `"Golang Generics 2편 - Type Constraint 완벽 이해"` |
| `contents/go/golang-generics-3-실전-예제-모음/index.md` | `"Golang Generics (3) - 실전 예제 모음"` | `"Golang Generics 3편 - 실전 예제 모음"` |

**Golang Concurrency 시리즈 (4개) — `go/`**

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `contents/go/golang-concurrency-1-goroutine-기초/index.md` | `"Golang Concurrency (1) - 개요와 Goroutine 기초"` | `"Golang Concurrency 1편 - 개요와 Goroutine 기초"` |
| `contents/go/golang-concurrency-2-channel-완전-정복/index.md` | `"Golang Concurrency (2) - Channel 완전 정복"` | `"Golang Concurrency 2편 - Channel 완전 정복"` |
| `contents/go/golang-concurrency-3-select와-channel-심화/index.md` | `"Golang Concurrency (3) - Select와 Channel 심화 패턴"` | `"Golang Concurrency 3편 - Select와 Channel 심화 패턴"` |
| `contents/go/golang-concurrency-4-sync-패키지/index.md` | `"Golang Concurrency (4) - sync 패키지 완벽 가이드"` | `"Golang Concurrency 4편 - sync 패키지 완벽 가이드"` |

> 주의: `contents/go/golang-concurrency-5-context-완벽-가이드/index.md`의 title `"Golang Concurrency 5편 - Context 완벽 가이드"`는 이미 목표 포맷과 일치하므로 **변경하지 않는다**.

#### 3.2 Description 필드 (3개 파일)

Golang Generics 시리즈의 `description:` 필드에도 `(N)` 표기가 들어 있어 함께 수정한다.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `contents/go/golang-generics-1-개요와-기본-문법/index.md` (line 3) | `"Golang Generics (1) - 개요와 기본 문법"` | `"Golang Generics 1편 - 개요와 기본 문법"` |
| `contents/go/golang-generics-2-type-constraint-완벽-이해/index.md` (line 3) | `"Golang Generics (2) - Type Constraint 완벽 이해"` | `"Golang Generics 2편 - Type Constraint 완벽 이해"` |
| `contents/go/golang-generics-3-실전-예제-모음/index.md` (line 3) | `"Golang Generics (3) - 실전 예제 모음"` | `"Golang Generics 3편 - 실전 예제 모음"` |

> MQTT v5, Golang Concurrency 시리즈의 description은 `(N)` 표기가 없어 수정 불필요.

#### 3.3 본문 내 상호 참조 링크 (4개 파일, MQTT v5)

본문 하단 "다음 편 안내" 영역에서 시리즈 다음 편 제목을 참조하는 문구도 title과 일치시켜야 한다.

| 파일 | 위치 | 변경 전 | 변경 후 |
|---|---|---|---|
| `contents/database/mqtt-v5-완벽-가이드-1-입문과-기본-아키텍처/index.md` | line 258 | `MQTT v5 완벽 가이드 (2)` | `MQTT v5 완벽 가이드 2편` |
| `contents/database/mqtt-v5-완벽-가이드-2-topic-설계와-메시지-모델/index.md` | line 359 | `[MQTT v5 완벽 가이드 (3): QoS, Session, 재연결 전략]` | `[MQTT v5 완벽 가이드 3편: QoS, Session, 재연결 전략]` |
| `contents/database/mqtt-v5-완벽-가이드-3-qos-session-재연결-전략/index.md` | line 712 | `[MQTT v5 완벽 가이드 (4): 고급 기능과 보안]` | `[MQTT v5 완벽 가이드 4편: 고급 기능과 보안]` |
| `contents/database/mqtt-v5-완벽-가이드-4-고급-기능과-보안/index.md` | line 783 | `[MQTT v5 완벽 가이드 (5): Go + Paho 실전 구현과 운영]` | `[MQTT v5 완벽 가이드 5편: Go + Paho 실전 구현과 운영]` |

> 마크다운 링크의 URL(괄호 안의 경로)은 슬러그 기반이므로 **변경 없음**. 링크 텍스트만 수정한다.
> Golang Concurrency/Generics 본문에는 다음 편을 "다음 편에서는 ..." 형태로 서술할 뿐, 편 번호를 직접 표기한 링크가 없어 수정 불필요.

### 4. 영향도 분석

- **URL/슬러그**: 디렉토리명과 `manifest.json`(구 구조) 등 경로는 변경하지 않으므로 영구 링크, SEO, 외부 공유 링크에 영향 없음.
- **series 메타데이터**: `series:` 값은 모두 편 번호가 없는 순수 시리즈명(`"MQTT v5 완벽 가이드"`, `"Golang Generics"`, `"Golang Concurrency"`)이므로 변경 불필요.
- **검색 인덱스(MiniSearch)**: title/description이 검색 대상이지만 클라이언트 사이드에서 로드 시 매번 재인덱싱되므로 별도 조치 불필요.
- **파일 개수 총계**: title 12건 + description 3건 + 본문 링크 4건 = **총 19곳 수정**

### 5. 수정 체크리스트

- [ ] MQTT v5 완벽 가이드 title 5건 수정
- [ ] Golang Generics title 3건 수정
- [ ] Golang Generics description 3건 수정
- [ ] Golang Concurrency title 4건 수정 (5편 제외)
- [ ] MQTT v5 본문 "다음 편 안내" 링크 4건 수정
- [ ] 수정 후 `grep -rE "\([0-9]+\)" contents/` 로 잔존 `(N)` 포맷 최종 확인
- [ ] UTF-8 인코딩 확인 (`file -I`)
- [ ] 로컬 dev 서버(`npm run dev`)로 시리즈 목록·본문 렌더링 확인

### 6. 작업 방식 제안

- 브랜치: `chore/unify-series-title-format` (이슈 번호가 있다면 `chore/#번호-unify-series-title-format`)
- 커밋 단위: 시리즈별(MQTT v5 / Golang Generics / Golang Concurrency) 3개 커밋 또는 전체 1개 커밋
- PR 생성 시 `gh pr create` + HEREDOC 사용, 리뷰어 `kenshin579` 지정
