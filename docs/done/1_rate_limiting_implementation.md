# API Rate Limiting 구현 계획서

## 1. 프로젝트 구조

```
tutorials-go/rate-limiting/
├── docker-compose.yml
├── go.mod
├── go.sum
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── limiter/
│   │   ├── limiter.go              # Limiter 인터페이스 정의
│   │   ├── fixed_window.go
│   │   ├── fixed_window_test.go
│   │   ├── sliding_window.go
│   │   ├── sliding_window_test.go
│   │   ├── token_bucket.go
│   │   ├── token_bucket_test.go
│   │   ├── leaky_bucket.go
│   │   └── leaky_bucket_test.go
│   ├── middleware/
│   │   ├── ratelimit.go
│   │   └── ratelimit_test.go
│   └── handler/
│       └── api.go
└── README.md
```

## 2. 핵심 인터페이스

```go
// internal/limiter/limiter.go
type Result struct {
    Allowed   bool
    Limit     int
    Remaining int
    ResetAt   time.Time
}

type Limiter interface {
    Allow(ctx context.Context, key string) (*Result, error)
}
```

- 모든 알고리즘이 `Limiter` 인터페이스를 구현
- `Result`에 HTTP 응답 헤더에 필요한 정보 포함

## 3. 알고리즘별 구현

### 3.1 Fixed Window Counter

- **저장소**: Redis `INCR` + `EXPIRE`
- **Key 패턴**: `ratelimit:fw:{key}:{window_start}`
- **핵심 로직**: Lua script로 INCR + EXPIRE atomic 처리

```go
type FixedWindow struct {
    client   *redis.Client
    limit    int
    window   time.Duration
}
```

### 3.2 Sliding Window Counter

- **저장소**: Redis Hash (이전 윈도우 카운트 + 현재 윈도우 카운트)
- **Key 패턴**: `ratelimit:sw:{key}`
- **핵심 로직**: `count = prev_count * (1 - elapsed/window) + curr_count`

```go
type SlidingWindow struct {
    client   *redis.Client
    limit    int
    window   time.Duration
}
```

### 3.3 Token Bucket

- **저장소**: Redis Hash (`tokens`, `last_refill`)
- **Key 패턴**: `ratelimit:tb:{key}`
- **핵심 로직**: Lua script로 토큰 리필 계산 + 소비 atomic 처리

```go
type TokenBucket struct {
    client     *redis.Client
    capacity   int           // 최대 토큰 수
    refillRate float64       // 초당 리필 토큰 수
}
```

### 3.4 Leaky Bucket

- **저장소**: Redis Sorted Set (타임스탬프 기반)
- **Key 패턴**: `ratelimit:lb:{key}`
- **핵심 로직**: Lua script로 오래된 요청 제거 + 새 요청 추가

```go
type LeakyBucket struct {
    client   *redis.Client
    capacity int           // 큐 최대 크기
    leakRate float64       // 초당 처리 요청 수
}
```

## 4. 미들웨어 구현

```go
// internal/middleware/ratelimit.go
func RateLimitMiddleware(limiter limiter.Limiter, keyFunc KeyFunc) echo.MiddlewareFunc
```

- **KeyFunc**: 요청에서 rate limit key 추출 (IP, User ID 등)
- **응답 헤더 설정**:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
- **429 응답**: `Retry-After` 헤더 포함

## 5. Docker Compose 환경

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  app:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - redis
    environment:
      - REDIS_ADDR=redis:6379
```

## 6. 테스트 전략

### Unit Test (각 알고리즘)

| 테스트 케이스 | 검증 내용 |
|-------------|----------|
| 제한 내 요청 | `Allowed=true`, `Remaining` 감소 |
| 제한 초과 | `Allowed=false`, `Remaining=0` |
| 윈도우/토큰 리셋 | 시간 경과 후 다시 허용 |
| 동시 요청 | Race condition 없이 정확한 카운트 |

- **Redis Mock**: `miniredis` 라이브러리 사용 (외부 Redis 불필요, 빠른 테스트)

### 미들웨어 통합 테스트

| 테스트 케이스 | 검증 내용 |
|-------------|----------|
| 정상 요청 | 200 OK + `X-RateLimit-*` 헤더 존재 |
| 제한 초과 | 429 Too Many Requests + `Retry-After` 헤더 |
| 다른 클라이언트 | IP별 독립적 제한 동작 |

- `httptest.NewServer`로 Echo 서버 구동하여 테스트

## 7. 블로그 포스트와 코드 매핑

| 포스트 | 관련 코드 |
|-------|----------|
| 포스트 1: 개념과 알고리즘 | 코드 없음 (다이어그램 중심) |
| 포스트 2: Go/Redis 구현 | `internal/limiter/`, `internal/middleware/`, `docker-compose.yml` |
| 포스트 3: 분산 환경 | 포스트 2 코드 기반 + 사례 분석 (추가 코드 없음) |
