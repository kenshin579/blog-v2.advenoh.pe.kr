# API Rate Limiting TODO

## Phase 1: 프로젝트 셋업

- [x] `tutorials-go/rate-limiting/` 디렉토리 생성
- [x] `go.mod` 초기화 (루트 모듈 사용)
- [x] 의존성 추가: `go-redis/redis`, `labstack/echo`, `alicebob/miniredis`
- [x] `docker-compose.yml` 작성 (Redis + Go app)
- [x] `cmd/server/main.go` 기본 Echo 서버 작성
- [x] `internal/limiter/limiter.go` - `Limiter` 인터페이스 및 `Result` 구조체 정의

## Phase 2: 알고리즘 구현 + Unit Test

### Fixed Window Counter
- [x] `internal/limiter/fixed_window.go` 구현
- [x] `fixed_window_test.go` 작성
  - [x] 윈도우 내 요청 허용 (limit 미만)
  - [x] 제한 초과 시 거부
  - [x] 윈도우 리셋 후 다시 허용
  - [x] 경계값 테스트 (정확히 limit 도달)

### Sliding Window Counter
- [x] `internal/limiter/sliding_window.go` 구현
- [x] `sliding_window_test.go` 작성
  - [x] 가중 평균 계산 검증
  - [x] 윈도우 슬라이딩 동작 확인
  - [x] 이전 윈도우 만료 후 카운트 리셋

### Token Bucket
- [x] `internal/limiter/token_bucket.go` 구현
- [x] `token_bucket_test.go` 작성
  - [x] 토큰 소비 후 Remaining 감소
  - [x] burst 트래픽 허용 (capacity까지)
  - [x] 토큰 부족 시 거부
  - [x] 시간 경과 후 토큰 리필 확인

### Leaky Bucket
- [x] `internal/limiter/leaky_bucket.go` 구현
- [x] `leaky_bucket_test.go` 작성
  - [x] 큐 내 요청 허용
  - [x] 큐 초과 시 거부
  - [x] leak rate에 따른 큐 비움 확인

## Phase 3: 미들웨어 + 통합 테스트

- [x] `internal/handler/api.go` - 테스트용 API 핸들러 작성
- [x] `internal/middleware/ratelimit.go` - Echo 미들웨어 구현
  - [x] `KeyFunc`으로 클라이언트 식별 (IP 기반)
  - [x] `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` 헤더 설정
  - [x] 429 응답 시 `Retry-After` 헤더 설정
- [x] `internal/middleware/ratelimit_test.go` 작성
  - [x] 정상 요청 시 200 + RateLimit 헤더 검증
  - [x] 제한 초과 시 429 + Retry-After 검증
  - [x] 다른 IP에서의 요청이 독립적으로 제한되는지 검증

## Phase 4: Docker 환경 검증

- [x] `Dockerfile` 작성 (multi-stage build)
- [ ] `docker-compose up`으로 Redis + App 기동 확인
- [ ] curl로 rate limiting 동작 수동 검증

## Phase 5: 블로그 포스트 작성

### 포스트 1: "API Rate Limiting 완벽 가이드 - 개념과 알고리즘"
- [x] Rate Limiting 개념 및 필요성 정리
- [x] 5가지 알고리즘 설명 (Mermaid 다이어그램 포함)
- [x] 알고리즘별 장단점 비교표
- [x] 상황별 알고리즘 선택 가이드
- [x] `docs/start/api-rate-limiting-guide/index.md` 초안 작성

### 포스트 2: "Rate Limiting 구현 - Go/Redis 실전 예제"
- [x] 프로젝트 구조 설명
- [x] Limiter 인터페이스 설계 설명
- [x] 각 알고리즘 구현 코드 설명 (핵심 Lua script 포함)
- [x] 미들웨어 패턴 설명
- [x] Unit Test 코드 설명
- [x] Docker Compose 실행 방법
- [x] `docs/start/rate-limiting-go-redis/index.md` 초안 작성

### 포스트 3: "분산 환경에서의 Rate Limiting"
- [x] 분산 환경 이슈 정리 (Race Condition, 노드 동기화)
- [x] Redis Lua script를 활용한 atomic 처리 상세 설명
- [x] API Gateway vs 애플리케이션 레벨 비교
- [x] 실제 서비스 사례 분석 (GitHub, Stripe, Cloudflare)
- [x] Redis Cluster 환경 고려사항
- [x] 장애 대응 전략 (fallback)
- [x] `docs/start/distributed-rate-limiting/index.md` 초안 작성

## Phase 6: 레퍼런스 스터디

- [ ] System Design Interview - Rate Limiter (Alex Xu)
- [ ] Redis 공식 문서 - Rate Limiting 패턴
- [ ] Stripe API Rate Limiting 사례
- [ ] GitHub API Rate Limiting 사례
- [ ] Go rate limiter 패키지 (`golang.org/x/time/rate`)
- [ ] IETF RateLimit Header Fields 초안
