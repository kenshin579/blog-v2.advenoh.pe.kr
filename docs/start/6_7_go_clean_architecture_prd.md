# Go 프로젝트 레이아웃과 Clean Architecture PRD

> 시리즈: Golang 블로그 주제 Phase 3 - 아키텍처 (1/2)
> 참조: `6_golang_topic_prd.md` C-1

---

## 1. 개요

Go 프로젝트의 디렉토리 구조 설계와 Clean Architecture 적용. 실제 Article CRUD API를 예제로 Domain → Repository → UseCase → Handler 레이어를 구현하며, V1과 V2의 구조 비교를 통해 프로젝트 레이아웃 발전 과정을 보여준다.

**대상 독자**: Go로 실제 프로젝트를 구성하려는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/project-layout/`

---

## 2. 블로그 구조

### 2.1 Go 프로젝트 레이아웃이란?
- `golang-standards/project-layout` 소개
- 핵심 디렉토리: `cmd/`, `pkg/`, `internal/`, `domain/`
- Go 공식 입장: "표준 레이아웃은 없다" vs 커뮤니티 관례
- 소규모 vs 대규모 프로젝트에서의 적용 차이

### 2.2 Clean Architecture 개요
- Uncle Bob의 Clean Architecture 원칙
- 의존성 규칙: 바깥 → 안쪽 (Handler → UseCase → Domain)
- Go에서의 적용: 인터페이스 기반 의존성 역전
- 레이어별 역할:
  - **Domain**: 엔티티, 인터페이스 정의 (비즈니스 규칙)
  - **Repository**: 데이터 접근 구현 (MySQL, Redis 등)
  - **UseCase**: 비즈니스 로직 오케스트레이션
  - **Handler/Delivery**: HTTP 핸들러 (Echo)

### 2.3 V1 구조 분석 - 전통적 접근
- 디렉토리 구조: 전송 방식/저장소별 중첩 (`article/repository/mysql/`)
- 공통 코드: `/common/config/`, `/common/database/`
- 장점: 구현체별 명확한 분리
- 단점: 깊은 중첩, 긴 import 경로
- 참고 코드: `go-clean-arch-v1/`

### 2.4 V2 구조 분석 - 개선된 접근
- 디렉토리 구조: 도메인 모듈별 플랫 (`article/`, `author/`, `pkg/`)
- `cmd/main.go` - 표준 Go 프로젝트 구조
- `pkg/` - 공유 인프라 (config, database, middleware)
- 장점: 탐색 용이, 깔끔한 import
- 참고 코드: `go-clean-arch-v2/`

### 2.5 V1 vs V2 비교

| 관점 | V1 | V2 |
|------|----|----|
| 디렉토리 구조 | 중첩형 | 플랫형 |
| 공통 코드 | `/common/` | `/pkg/` |
| main 위치 | 루트 `main.go` | `cmd/main.go` |
| 미들웨어 | 도메인 내부 | 공유 `pkg/middleware/` |
| Import | 언더스코어 별칭 필요 | 깔끔한 패키지명 |

### 2.6 핵심 구현 패턴
- **Domain 레이어**: 인터페이스 정의 (`ArticleRepository`, `ArticleUsecase`)
- **Repository**: GORM/SQL 구현, Cursor 기반 페이지네이션
- **UseCase**: errgroup 기반 동시 Author 조회, Context 타임아웃
- **Handler**: Echo 라우트 등록, 에러 코드 매핑, Validator
- **Mocks**: mockery로 자동 생성된 테스트용 Mock

### 2.7 테스트 전략
- Handler 테스트: Mock UseCase 주입
- UseCase 테스트: Mock Repository 주입
- Repository 테스트: sqlmock 활용
- 참고 코드: `*_test.go` 파일들

---

## 3. 샘플 코드 참조

| 파일 (V2 기준) | 내용 |
|------|------|
| `go-clean-arch-v2/cmd/main.go` | 앱 진입점, fx DI 설정 |
| `go-clean-arch-v2/domain/` | 엔티티, 인터페이스, 에러, Mocks |
| `go-clean-arch-v2/article/` | handler, usecase, repository (한 패키지) |
| `go-clean-arch-v2/author/` | repository 구현 |
| `go-clean-arch-v2/pkg/` | config, database, middleware |

---

## 4. 논의 사항

- [ ] DI 부분은 다음 글(uber/fx)에서 상세히 다루므로 여기선 간단히만
- [ ] `golang-standards/project-layout`이 비공식이라는 논란 언급 수위
- [ ] Hexagonal Architecture와의 비교도 포함할지
- [ ] 코드 전체를 보여줄지, 핵심 부분만 발췌할지
- [ ] Mermaid 다이어그램으로 레이어 의존성 시각화
