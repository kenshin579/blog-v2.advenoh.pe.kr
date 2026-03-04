# Go Rate Limiting 완벽 가이드 - TODO

> 참조: `6_14_go_rate_limiting_prd.md`, `6_14_go_rate_limiting_implementation.md`

---

## Phase 1: 샘플 코드 작성 (tutorials-go)

### 프로젝트 초기화
- [ ] `tutorials-go/golang/resilience/` 디렉토리 생성
- [ ] `go.mod` 초기화
- [ ] 의존성 설치 (x/time, echo/v4, go-redis/v9, redis_rate/v10, cenkalti/backoff/v5, avast/retry-go/v4, testify, testcontainers-go)
- [ ] `go mod tidy`

### Rate Limiting - 단일 인스턴스
- [ ] `ratelimit/token_bucket.go` - x/time/rate 래퍼
  - [ ] NewRateLimiter 생성자
  - [ ] Allow(), Wait(), Reserve() 3가지 방식
- [ ] `ratelimit/token_bucket_test.go`
  - [ ] Allow: 허용/거부 동작 검증
  - [ ] Wait: 대기 후 허용 검증
  - [ ] Reserve: 예약 시간 반환 검증
  - [ ] 동시성 테스트 (goroutine 부하)

### Rate Limiting - HTTP 미들웨어
- [ ] `ratelimit/middleware.go` - Echo 미들웨어
  - [ ] RateLimitConfig 구조체 (Rate, Burst, Skipper)
  - [ ] IP별 Rate Limiting (sync.Map)
  - [ ] 429 Too Many Requests + Retry-After 헤더
- [ ] `ratelimit/middleware_test.go`
  - [ ] 정상 요청 → 200
  - [ ] 초과 요청 → 429
  - [ ] IP별 분리 확인
  - [ ] Skipper 동작 확인

### Rate Limiting - 분산 (Redis)
- [ ] `ratelimit/redis_limiter.go` - go-redis/redis_rate 활용
  - [ ] DistributedRateLimiter 구조체
  - [ ] Allow(ctx, key, limit) 메서드
- [ ] `ratelimit/redis_limiter_test.go` - testcontainers-go
  - [ ] Redis 컨테이너 셋업/정리
  - [ ] 허용/거부 동작 검증
  - [ ] 동일 키 다중 클라이언트 테스트

### Retry 패턴
- [ ] `retry/backoff.go` - cenkalti/backoff/v5
  - [ ] RetryWithExponentialBackoff 함수
  - [ ] MaxElapsedTime, Context 지원
- [ ] `retry/backoff_test.go`
  - [ ] 일시적 실패 → 재시도 후 성공
  - [ ] MaxElapsedTime 초과 → 중단
  - [ ] Context 취소 → 즉시 중단
- [ ] `retry/retry.go` - avast/retry-go/v4
  - [ ] RetryWithJitter 함수
  - [ ] RetryIf 조건 설정
  - [ ] OnRetry 콜백
- [ ] `retry/retry_test.go`
  - [ ] Jitter 동작 확인
  - [ ] RetryIf 조건별 재시도/중단
  - [ ] 최대 시도 횟수 초과 검증

### 전체 검증
- [ ] `go test ./...` 전체 통과 확인
- [ ] `go vet ./...` 정적 분석 통과
- [ ] README.md 작성

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 초안 작성
- [ ] `docs/start/go-rate-limiting-완벽-가이드/index.md` 생성
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] # 1. Rate Limiting이란?
  - [ ] 서비스 장애 시나리오 설명
  - [ ] DDoS 방어, API 남용 방지, 리소스 분배
  - [ ] Mermaid sequence diagram: 과부하 시나리오
- [ ] # 2. Rate Limiting 알고리즘
  - [ ] ## 2.1 Token Bucket - 이론 설명 + Mermaid flowchart
  - [ ] ## 2.2 Leaky Bucket - 이론 설명 + Token Bucket 차이점 비교표
  - [ ] ## 2.3 Fixed Window Counter - 이론 설명 + 경계 문제 Mermaid 시각화
  - [ ] ## 2.4 Sliding Window Log - 이론 설명
  - [ ] ## 2.5 Sliding Window Counter - 이론 설명
  - [ ] ## 2.6 알고리즘 비교 요약표
- [ ] # 3. Go로 Rate Limiting 구현하기
  - [ ] ## 3.1 x/time/rate - Allow/Wait/Reserve 코드 스니펫 + 설명
  - [ ] ## 3.2 HTTP 미들웨어 - Echo 미들웨어 코드 + IP별 Rate Limiting
- [ ] # 4. 분산 Rate Limiting
  - [ ] ## 4.1 왜 분산인가? - 한계 설명 + Mermaid 구조도
  - [ ] ## 4.2 go-redis/redis_rate - GCRA 설명 + 코드 스니펫
  - [ ] ## 4.3 Redis Lua Script - Sliding Window Lua 스크립트 설명
- [ ] # 5. Retry 패턴
  - [ ] ## 5.1 왜 Retry가 필요한가? - transient fault, 429 전략
  - [ ] ## 5.2 Backoff 전략 - Fixed/Exponential/Jitter 이론 + Mermaid 시각화
  - [ ] ## 5.3 Go 구현 - cenkalti/backoff, avast/retry-go 코드 스니펫
- [ ] # 6. 테스트
  - [ ] ## 6.1 Rate Limiter 테스트 - 시간 기반 패턴
  - [ ] ## 6.2 Retry 테스트 - mock 서버 시나리오
  - [ ] ## 6.3 동시성 테스트 - goroutine 부하
- [ ] # 마무리
- [ ] GitHub 샘플 코드 링크 추가
- [ ] UTF-8 인코딩 확인 (`file -I`)

### 리뷰 준비
- [ ] PR 생성 (feature 브랜치)
