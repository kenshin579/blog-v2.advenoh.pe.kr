# Go 프로젝트 레이아웃과 Clean Architecture PRD

> 시리즈: Golang 블로그 주제 Phase 3 - 아키텍처 (1/2)
> 참조: `6_golang_topic_prd.md` C-1

---

## 1. 개요

Go 프로젝트의 디렉토리 구조 설계와 Clean Architecture 적용. 실제 Article CRUD API를 예제로 Domain → Repository → UseCase → Handler 레이어를 구현하며, V1과 V2의 구조 비교를 통해 프로젝트 레이아웃 발전 과정을 보여준다.

**대상 독자**: Go로 실제 프로젝트를 구성하려는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/project-layout/go-clean-arch-v1/`, `tutorials-go/project-layout/go-clean-arch-v2/`

---

## 2. 블로그 목차

### # 1. 들어가며
- Go 프로젝트가 커지면 구조 설계가 중요해지는 이유
- 이 글에서 다루는 것: 프로젝트 레이아웃 + Clean Architecture + 실전 예제

### # 2. Go 프로젝트 레이아웃
- #### 2.1 golang-standards/project-layout 소개
  - 핵심 디렉토리: `cmd/`, `pkg/`, `internal/`, `domain/`
  - Go 공식 입장: "표준 레이아웃은 없다" vs 커뮤니티 관례
- #### 2.2 소규모 vs 대규모 프로젝트
  - 소규모: 플랫 구조로 충분
  - 대규모: 레이어 분리 필요 → Clean Architecture 도입 근거

### # 3. Clean Architecture 개요
- Uncle Bob의 Clean Architecture 원칙
- 의존성 규칙: 바깥 → 안쪽만 허용
- Mermaid 다이어그램으로 레이어 의존성 시각화:
  - Handler → UseCase → Domain ← Repository
- Go에서의 적용: 인터페이스 기반 의존성 역전
- 레이어별 역할:

| 레이어 | 역할 | 예시 |
|---|---|---|
| Domain | 엔티티, 인터페이스 정의 | `Article`, `ArticleRepository` |
| Repository | 데이터 접근 구현 | MySQL 쿼리, GORM |
| UseCase | 비즈니스 로직 오케스트레이션 | Article + Author 조합 |
| Handler | HTTP 핸들러 | Echo 라우트, 요청 검증 |

### # 4. 실전 예제: Article CRUD API
- #### 4.1 Domain 레이어 (핵심 발췌)
  - `Article`, `Author` 엔티티
  - `ArticleRepository`, `ArticleUsecase` 인터페이스 정의
  - `errors.go` — 도메인 에러 타입
- #### 4.2 Repository 레이어 (핵심 발췌)
  - MySQL 구현체
  - Cursor 기반 페이지네이션 패턴
- #### 4.3 UseCase 레이어 (핵심 발췌)
  - `errgroup` 기반 동시 Author 조회 패턴
  - Context 타임아웃 전파
- #### 4.4 Handler 레이어 (핵심 발췌)
  - Echo 라우트 등록
  - 도메인 에러 → HTTP 상태 코드 매핑
  - Validator를 활용한 요청 검증

### # 5. 프로젝트 구조 비교: V1 vs V2
- V1 (중첩형): `article/repository/mysql/`, `article/http/`
- V2 (플랫형): `article/` 한 패키지에 handler, usecase, repository
- 디렉토리 트리 비교 (코드 블록)

| 관점 | V1 | V2 |
|---|---|---|
| 디렉토리 구조 | 중첩형 (깊은 경로) | 플랫형 (한 레벨) |
| 공통 코드 | `common/` | `pkg/` |
| main 위치 | 루트 `main.go` | `cmd/main.go` |
| 미들웨어 | `article/http/middleware/` | `pkg/middleware/` |
| Import | 언더스코어 별칭 필요 | 깔끔한 패키지명 |
| 파일 수 | 27개 (14 디렉토리) | 20개 (10 디렉토리) |

### # 6. 테스트 전략
- 레이어별 Mock 주입 테스트
  - Handler 테스트: Mock UseCase 주입
  - UseCase 테스트: Mock Repository 주입
  - Repository 테스트: sqlmock 활용
- mockery로 Mock 자동 생성

### # 7. 마무리

### # 8. 참고

---

## 3. 샘플 코드 참조

| 파일 (V2 기준) | 내용 |
|---|---|
| `go-clean-arch-v2/cmd/main.go` | 앱 진입점, fx DI 설정 |
| `go-clean-arch-v2/domain/` | 엔티티, 인터페이스, 에러, Mocks |
| `go-clean-arch-v2/article/` | handler, usecase, repository (한 패키지) |
| `go-clean-arch-v2/author/` | repository 구현 |
| `go-clean-arch-v2/pkg/` | config, database, middleware |

---

## 4. 논의 사항 (결정됨)

- [x] DI 부분은 다른 글(uber/fx)에서 다루므로 간단히 언급만
- [x] Hexagonal Architecture 비교는 제외
- [x] 블로그에서는 코드 핵심만 발췌해서 설명
- [x] 시각화는 Mermaid 다이어그램 사용
