# Golang 블로그 주제 PRD

> 작성일: 2026-03-02
> 목적: Go 블로그 시리즈의 현황 파악 및 추가 주제 도출

---

## 1. 현황 분석

### 1.1 작성 완료된 블로그 글 (17편)

| # | 제목 | 작성일 | 카테고리 |
|---|------|--------|----------|
| 1 | Go에서의 로그깅 (Logging in Go) | 2021-01-02 | 기본 |
| 2 | Go에서의 게터, 세터 메서드 (Getter, Setter in Go) | 2021-01-14 | OOP |
| 3 | 타입 단언 (Type Assertion) | 2021-01-16 | 타입 시스템 |
| 4 | 타입 스위치 (Type switch) | 2021-01-16 | 타입 시스템 |
| 5 | 타입 변환 (Type Conversion) | 2021-01-16 | 타입 시스템 |
| 6 | Go에서의 메서드 (Method in Go) | 2021-02-19 | OOP |
| 7 | Go에서 삼 도트 (dot) 사용방법 (Three Dots Usage) | 2021-05-08 | 기본 |
| 8 | Go에서 컬렉션 정렬하는 방법 (Go Sort) | 2021-05-09 | 기본 |
| 9 | Go Ternary Operator (삼항연산자) | 2021-05-18 | 기본 |
| 10 | Go Strings (문자열 함수) | 2021-05-28 | 기본 |
| 11 | Go에서의 다형성 (Polymorphism) | 2021-06-06 | OOP |
| 12 | Go Test Suite (Lifecycle 메서드) | 2021-07-17 | 테스트 |
| 13 | Go에서의 열거형 상수 (Enums in Go) | 2020-12-20 | 기본 |
| 14 | Go Recover 함수에서 반환값을 반환하는 예제 | 2022-08-07 | 에러 처리 |
| 15 | jq - 명령어 JSON 처리기 사용법 | 2023-01-27 | 도구 |
| 16 | Golang 기반의 분산 스케줄러 - Asynq | 2024-06-24 | 라이브러리 |
| 17 | JWKS(JSON Web Key Set)이란? | 2025-02-17 | 보안/인증 |

### 1.2 작성 중인 블로그 초안 (docs/start/)

현재 `docs/start/`에 이미 작성 중이거나 리뷰 대기 중인 Go 관련 블로그 초안:

| 시리즈 | 제목 | 상태 |
|--------|------|------|
| **Concurrency 7** | 에러 처리 전략 (error channel, errgroup, errors.Join) | 초안 |
| **Concurrency 8** | Memory Model과 Atomic (happens-before, sync/atomic) | 초안 |
| **Concurrency 9** | Debugging과 Race Detector (-race, 데드락 감지) | 초안 |
| **Concurrency 10** | 실전 프로젝트와 Best Practices (웹 크롤러, graceful shutdown) | 초안 |
| **Concurrency 11** | 시각화 - go tool trace 완벽 가이드 | 초안 |
| **Generics 5** | 실무 패턴과 Best Practices (generic repository, migration) | 초안 |
| **Go 1.25** | Go 1.25 변경사항 (GOMAXPROCS, Green Tea GC, Flight Recorder) | 초안 |
| **OAuth** | Go Google OAuth 로그인 구현 가이드 (Echo, React, JWT, GORM) | 초안 |
| **Grafana 2** | Go 앱 커스텀 메트릭 (Prometheus, Echo 미들웨어, RED method) | 초안 |
| **Grafana 3** | Grafana Tempo 분산 트레이싱 (OpenTelemetry, spans) | 초안 |
| **Grafana Pyroscope** | Go 앱 Continuous Profiling (flame graphs, 성능 분석) | 초안 |
| **OpenSearch 2** | 검색과 Aggregation - Go로 쿼리 DSL 다루기 | 초안 |
| **OpenSearch 3** | Dashboards - Top Errors와 API 호출 지표 시각화 | 초안 |
| **WebRTC 2** | P2P 연결 - Signaling, Pion 실습 | 초안 |
| **WebRTC 3** | SFU 서버 아키텍처 - Pion 구현, 보안, 운영 | 초안 |
| **WebRTC 4** | 트러블슈팅과 기술 선택 | 초안 |

### 1.3 완료된 시리즈 PRD (docs/done/)

이미 기획 완료 또는 블로그 발행 완료된 Go 관련 PRD:

| PRD | 내용 | 상태 |
|-----|------|------|
| Concurrency 1~6 | Goroutine, Channel, sync, Context, Select, Pipeline/Pattern | 발행 완료 |
| Generics 1~4 | 타입 파라미터, 제약조건, 인터페이스, 실전 활용 | 발행 완료 |
| Go 1.25 PRD | Go 1.25 릴리즈 노트 | PRD 완료 |
| Go 1.26 PRD | Go 1.26 릴리즈 노트 | PRD 완료 |
| MQTT 블로그 | MQTT 프로토콜 + Go 대시보드 | 완료 |
| WebRTC Part 1 | WebRTC 기초 개념 | PRD 완료 |
| OpenSearch Part 1 | OpenSearch 기초 | PRD 완료 |
| Pyroscope PRD | Grafana Pyroscope | PRD 완료 |
| Graph 기초 | DFS, DAG, 위상정렬 | 작성 중 |
| SCC 알고리즘 | 강연결 요소, 도달 가능성 판정 | 작성 중 |

### 1.4 tutorials-go 예제 코드 현황 (블로그 미작성, 초안도 없음)

이미 예제 코드가 있지만 블로그 글도 초안도 없는 주제들:

| 카테고리 | 디렉토리 | 주제 |
|----------|----------|------|
| **테스트** | `go-unit-test/mockery/` | Mock 코드 생성 |
| | `go-unit-test/testcontainers/` | 통합 테스트 (Docker) |
| | `go-unit-test/httpmock/` | HTTP 요청 모킹 |
| | `golang/testing/` | 테이블 기반 테스트, 벤치마크 |
| **데이터베이스** | `database/mysql/` | MySQL + GORM |
| | `database/redis/` | Redis 클라이언트 |
| | `database/mongo/` | MongoDB |
| | `database/postgresql/` | PostgreSQL |
| | `database/liquibase/` | DB 마이그레이션 |
| **아키텍처** | `project-layout/go-clean-arch-v1/` | Clean Architecture v1 |
| | `project-layout/go-clean-arch-v2/` | Clean Architecture v2 (fx DI) |
| **고급 기능** | `golang/reflect/` | Reflection API |
| | `golang/embed-directive/` | 파일 임베딩 (Go 1.16+) |
| | `golang/functional/` | 함수형 프로그래밍 패턴 |
| | `golang/runtime/` | Runtime 정보 |
| **기타** | `golang/pattern/` | 디자인 패턴 |
| | `golang/data-structure/` | 자료구조 구현 |
| | `golang/build-ldflags/` | 빌드 타임 플래그 |
| | `golang/workspace/` | Go Workspace |
| | `message-queue/kafka/` | Kafka 연동 |
| | `scheduler/go-cron/`, `dcron/` | Cron 스케줄러 |
| | `webhook/github/` | GitHub Webhook |

---

## 2. 추천 블로그 주제 (중복 제거)

### 우선순위 기준
- **P0**: 예제 코드 있음 + Go 필수 지식 + 기존 시리즈와 중복 없음
- **P1**: 예제 코드 있음 + 실무 활용도 높음
- **P2**: 코드 일부 있음, 보완 필요
- **P3**: 신규 코드 작성 필요

---

### P0 - 핵심 주제 (즉시 작성 가능)

#### 시리즈 A: 테스트 전략 (3편)

기존 Test Suite 1편만 있고, 실무 테스트 전략이 전혀 없음. Concurrency 시리즈에 Race Detector는 있지만 일반적인 테스트 패턴은 미커버.

| # | 제목 (안) | 예제 코드 | 난이도 |
|---|----------|----------|--------|
| A-1 | Go 테이블 기반 테스트와 벤치마크 작성법 | `golang/testing/` | 초중급 |
| A-2 | Mockery로 인터페이스 Mock 자동 생성하기 | `go-unit-test/mockery/` | 중급 |
| A-3 | Testcontainers로 실제 DB 통합 테스트하기 | `go-unit-test/testcontainers/` | 중급 |

#### 시리즈 B: 데이터베이스 연동 (3편)

DB 관련 블로그 0편. 예제 코드는 풍부.

| # | 제목 (안) | 예제 코드 | 난이도 |
|---|----------|----------|--------|
| B-1 | GORM으로 MySQL 다루기 - CRUD, 마이그레이션, 관계 매핑 | `database/mysql/` | 초중급 |
| B-2 | Go에서 Redis 활용하기 - 캐싱, Pub/Sub, 분산 락 | `database/redis/` | 중급 |
| B-3 | Go에서 MongoDB 사용하기 | `database/mongo/` | 초중급 |

---

### P1 - 실무 필수 주제

#### 시리즈 C: 아키텍처 & 프로젝트 구조 (2편)

| # | 제목 (안) | 예제 코드 | 난이도 |
|---|----------|----------|--------|
| C-1 | Go 프로젝트 레이아웃과 Clean Architecture | `project-layout/` | 중급 |
| C-2 | uber/fx로 의존성 주입 구현하기 | `project-layout/go-clean-arch-v2/` | 중고급 |

---

### P2 - 확장 주제 (코드 있음, 보완 필요)

#### 시리즈 D: Go 고급 기능 (2편)

| # | 제목 (안) | 예제 코드 | 난이도 |
|---|----------|----------|--------|
| D-1 | Reflect 패키지 이해하기 - 런타임 타입 검사와 동적 호출 | `golang/reflect/` | 중고급 |
| D-2 | Go Embed Directive - 바이너리에 파일 내장하기 | `golang/embed-directive/` | 중급 |

#### 기타 단편 (1편)

| # | 제목 (안) | 예제 코드 | 난이도 |
|---|----------|----------|--------|
| E-1 | Go Workspace로 멀티 모듈 프로젝트 관리하기 | `golang/workspace/` | 중급 |

---

### P3 - 신규 주제 (코드 작성 필요)

현재 tutorials-go에 코드가 없어 새로 작성이 필요한 주제들.

| # | 제목 (안) | 설명 | 난이도 |
|---|----------|------|--------|
| 1 | gRPC 서비스 구현과 Protobuf 활용 | Go에서 gRPC 매우 활발히 사용됨 | 중급 |
| 2 | Go에서 미들웨어 패턴 구현하기 | HTTP 미들웨어 체인, 로깅, 인증, CORS | 중급 |
| 3 | Rate Limiting과 Circuit Breaker 패턴 | 실무 안정성 패턴 | 중고급 |
| 4 | Go 메모리 관리와 가비지 컬렉터 이해하기 | 내부 동작 원리 | 고급 |

---

## 3. 추천 작성 로드맵

이미 코드가 있는 P0/P1 위주로 시작. **이미 진행 중인 시리즈(Concurrency 7-11, Generics 5, Grafana 2-3, WebRTC 2-4, Go 1.25, OAuth)는 제외.**

### Phase 1: 테스트 전략 (가장 큰 갭)

기존 17편 + 진행 중 초안에도 테스트 전략이 거의 없음.

```
1. 테이블 기반 테스트와 벤치마크         (A-1) ← golang/testing/
2. Mockery Mock 자동 생성              (A-2) ← go-unit-test/mockery/
3. Testcontainers 통합 테스트          (A-3) ← go-unit-test/testcontainers/
```

### Phase 2: 데이터베이스 연동

DB 관련 글이 전혀 없음. 백엔드 필수.

```
4. GORM으로 MySQL 다루기              (B-1) ← database/mysql/
5. Redis 활용하기                     (B-2) ← database/redis/
6. MongoDB 사용하기                   (B-3) ← database/mongo/
```

### Phase 3: 아키텍처

```
7. Clean Architecture                (C-1) ← project-layout/
8. uber/fx DI                        (C-2) ← project-layout/go-clean-arch-v2/
```

### Phase 4: 고급 기능

```
9. Reflect 패키지                     (D-1) ← golang/reflect/
10. Embed Directive                  (D-2) ← golang/embed-directive/
11. Go Workspace                     (E-1) ← golang/workspace/
```

### Phase 5: 신규 주제

```
12. gRPC 서비스 구현                   (P3-1) ← 신규 작성
13. 미들웨어 패턴                      (P3-2) ← 신규 작성
14. Rate Limiting / Circuit Breaker  (P3-3) ← 신규 작성
```

---

## 4. 주제별 커버리지 맵

```
Go 주제 커버리지

■ = 블로그 발행 완료
▶ = 초안 작성 중 (docs/start/)
★ = 시리즈 PRD 완료 (docs/done/)
□ = 예제 코드만 있음 (추천 주제)
○ = 코드/블로그 모두 없음 (P3 주제)

[기본 문법]        ■■■■■■■ (Enum, String, Sort, Ternary, 3Dots, Method, Logging)
[타입 시스템]      ■■■ (Assertion, Switch, Conversion)
[OOP]             ■■■ (Method, Getter/Setter, Polymorphism)
[동시성]           ★★★★★★ (1~6 발행) ▶▶▶▶▶ (7~11 초안)
[에러 처리]        ■ (Recover) ▶ (Concurrency 7에서 errgroup 커버)
[Generics]        ★★★★ (1~4 발행) ▶ (5 초안)
[Go 버전]          ▶ (1.25 초안) ★ (1.26 PRD)
[테스트]           ■ (Test Suite) □□□ (Table Test, Mockery, Testcontainers)
[웹/인증]          ■ (JWKS) ▶ (Google OAuth 초안)
                   ○ (gRPC)
[데이터베이스]      □□□□ (MySQL, Redis, MongoDB, PostgreSQL)
[메시지 큐]        ■ (Asynq) ★ (MQTT 완료)
[아키텍처]         □□ (Clean Arch, DI)
                   ○ (미들웨어, Rate Limiting)
[관측성]           ▶▶▶ (Grafana 2, 3, Pyroscope 초안)
[OpenSearch]       ▶▶ (Part 2, 3 초안)
[WebRTC]          ▶▶▶ (Part 2, 3, 4 초안)
[고급 기능]        □□ (Reflect, Embed Directive)
[DevOps/도구]      ■ (jq) □ (Workspace)
```

---

## 5. 요약

| 구분 | 수량 |
|------|------|
| 블로그 발행 완료 | 17편 |
| 초안 작성 중 (docs/start/) | 16편 |
| 시리즈 PRD 완료 (docs/done/) | ~10개 |
| **추천 신규 주제 (이 PRD)** | **~14개** |

**이미 진행 중이라 제외한 주제:**
- 동시성 시리즈 (1~11 전체 커버됨)
- Generics 시리즈 (1~5 전체 커버됨)
- Go 1.25/1.26 (PRD 완료)
- OAuth (Google OAuth 초안 있음)
- OpenTelemetry/Profiling (Grafana 시리즈에서 커버)
- Graceful Shutdown (Concurrency 10에서 커버)
- MQTT (완료)
- WebRTC (Part 1~4 커버)
- OpenSearch (Part 1~3 커버)

**실제 갭 (중복 제거 후):** 테스트 전략, 데이터베이스 연동, 아키텍처/DI, 고급 기능

**추천 우선순위:** 테스트 → DB → 아키텍처 → 고급 기능 → 신규 주제
