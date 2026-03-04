# Go Rate Limiting 완벽 가이드 - 구현 문서

> 참조: `6_14_go_rate_limiting_prd.md`

---

## 1. 샘플 코드 구현 (tutorials-go)

### 1.1 프로젝트 구조

```
tutorials-go/golang/resilience/
├── go.mod
├── go.sum
├── ratelimit/
│   ├── token_bucket.go           # x/time/rate 활용
│   ├── token_bucket_test.go
│   ├── middleware.go             # Echo HTTP 미들웨어
│   ├── middleware_test.go
│   ├── redis_limiter.go          # go-redis/redis_rate 분산 Rate Limiting
│   └── redis_limiter_test.go     # testcontainers-go Redis
├── retry/
│   ├── backoff.go                # cenkalti/backoff 활용
│   ├── backoff_test.go
│   ├── retry.go                  # avast/retry-go 활용
│   └── retry_test.go
└── README.md
```

### 1.2 의존성

```
golang.org/x/time
github.com/labstack/echo/v4
github.com/redis/go-redis/v9
github.com/go-redis/redis_rate/v10
github.com/cenkalti/backoff/v5
github.com/avast/retry-go/v4
github.com/stretchr/testify
github.com/testcontainers/testcontainers-go
```

### 1.3 Rate Limiting 구현 상세

#### ratelimit/token_bucket.go - 단일 인스턴스 Rate Limiter

- `golang.org/x/time/rate` 패키지 활용 (Token Bucket)
- 3가지 사용 방식 래퍼 함수 제공:
  - `Allow()`: 즉시 판단 (비차단) - 빠른 거부가 필요한 경우
  - `Wait(ctx)`: 토큰 가용할 때까지 대기 (차단) - 큐잉 처리
  - `Reserve()`: 예약 후 대기 시간 반환 - 세밀한 제어

```go
type RateLimiter struct {
    limiter *rate.Limiter
}

func NewRateLimiter(r rate.Limit, burst int) *RateLimiter {
    return &RateLimiter{limiter: rate.NewLimiter(r, burst)}
}

func (rl *RateLimiter) Allow() bool {
    return rl.limiter.Allow()
}

func (rl *RateLimiter) Wait(ctx context.Context) error {
    return rl.limiter.Wait(ctx)
}

func (rl *RateLimiter) Reserve() *rate.Reservation {
    return rl.limiter.Reserve()
}
```

#### ratelimit/middleware.go - Echo HTTP 미들웨어

- IP별 Rate Limiting (sync.Map으로 리미터 관리)
- `RateLimitConfig` 구조체: Rate, Burst, Skipper
- 429 Too Many Requests + `Retry-After` 헤더 응답

```go
type RateLimitConfig struct {
    Rate    rate.Limit
    Burst   int
    Skipper middleware.Skipper
}

func RateLimitMiddleware(config RateLimitConfig) echo.MiddlewareFunc {
    var clients sync.Map
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            if config.Skipper != nil && config.Skipper(c) {
                return next(c)
            }
            ip := c.RealIP()
            limiter, _ := clients.LoadOrStore(ip, rate.NewLimiter(config.Rate, config.Burst))
            if !limiter.(*rate.Limiter).Allow() {
                return c.JSON(http.StatusTooManyRequests, map[string]string{
                    "error": "rate limit exceeded",
                })
            }
            return next(c)
        }
    }
}
```

#### ratelimit/redis_limiter.go - 분산 Rate Limiting

- `go-redis/redis_rate` 라이브러리 활용 (GCRA 알고리즘)
- Redis 기반으로 여러 서버 인스턴스가 공유하는 Rate Limiter
- key 패턴: `rate:{identifier}` (IP, user ID 등)

```go
type DistributedRateLimiter struct {
    limiter *redis_rate.Limiter
}

func NewDistributedRateLimiter(rdb *redis.Client) *DistributedRateLimiter {
    return &DistributedRateLimiter{
        limiter: redis_rate.NewLimiter(rdb),
    }
}

func (d *DistributedRateLimiter) Allow(ctx context.Context, key string, limit redis_rate.Limit) (*redis_rate.Result, error) {
    return d.limiter.Allow(ctx, key, limit)
}
```

### 1.4 Retry 구현 상세

#### retry/backoff.go - cenkalti/backoff 활용

- Exponential Backoff 래퍼
- MaxElapsedTime, MaxInterval 설정
- Context 기반 취소 지원

```go
func RetryWithExponentialBackoff(ctx context.Context, operation func() error, maxElapsed time.Duration) error {
    b := backoff.NewExponentialBackOff()
    b.MaxElapsedTime = maxElapsed
    return backoff.Retry(operation, backoff.WithContext(b, ctx))
}
```

#### retry/retry.go - avast/retry-go 활용

- Jitter 기반 Retry
- 커스텀 retry 조건 (RetryIf)
- OnRetry 콜백으로 로깅

```go
func RetryWithJitter(ctx context.Context, fn retry.RetryableFunc, maxAttempts uint, opts ...retry.Option) error {
    defaultOpts := []retry.Option{
        retry.Attempts(maxAttempts),
        retry.DelayType(retry.BackOffDelay),
        retry.Context(ctx),
        retry.MaxJitter(1 * time.Second),
    }
    return retry.Do(fn, append(defaultOpts, opts...)...)
}
```

### 1.5 테스트 구현

- `token_bucket_test.go`: Allow/Wait/Reserve 동작 검증, 동시성 테스트
- `middleware_test.go`: echo.New() + httptest로 429 응답 검증, IP별 분리 확인
- `redis_limiter_test.go`: testcontainers-go로 Redis 컨테이너 띄워서 통합 테스트
- `backoff_test.go`: 재시도 횟수, MaxElapsedTime 초과 시 중단 검증
- `retry_test.go`: Jitter 동작, RetryIf 조건, Context 취소 검증

---

## 2. 블로그 글 작성 (blog-v2)

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/go-rate-limiting-완벽-가이드/index.md
```

### 2.2 frontmatter

```yaml
---
title: "Go Rate Limiting 완벽 가이드"
description: "Token Bucket부터 Sliding Window까지 Rate Limiting 알고리즘 이론과 Go 구현, Redis 기반 분산 Rate Limiting, Retry 패턴(Exponential Backoff + Jitter)까지 다룹니다"
date: 2026-03-XX
tags:
  - go
  - rate-limiting
  - redis
  - retry
  - resilience
series: "Go 웹 개발"
---
```

### 2.3 Mermaid 다이어그램 목록

1. **Rate Limiting 필요성**: 서버 과부하 시나리오 (sequence diagram)
2. **Token Bucket 동작**: 토큰 충전/소비 흐름 (flowchart)
3. **Fixed Window 경계 문제**: 윈도우 경계에서 2배 트래픽 발생 (flowchart)
4. **분산 Rate Limiting 구조**: 다중 서버 → Redis 공유 (flowchart)
5. **Backoff 전략 비교**: Fixed vs Exponential vs Jitter 시각화 (flowchart)
6. **Retry 흐름**: 요청 실패 → Backoff → 재시도 (sequence diagram)

### 2.4 참조 링크

- [Go Redis 활용하기](/article/go-redis-활용하기) - Redis 기본 사용법
- GitHub 샘플 코드 링크: `tutorials-go/golang/resilience/`
