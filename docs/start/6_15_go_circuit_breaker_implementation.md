# Go Circuit Breaker 패턴 완벽 가이드 - 구현 문서

> 참조: `6_15_go_circuit_breaker_prd.md`

---

## 1. 샘플 코드 구현 (tutorials-go)

### 1.1 프로젝트 구조

```
tutorials-go/golang/resilience/
├── circuitbreaker/
│   ├── gobreaker_example.go       # sony/gobreaker 기본 사용법
│   ├── gobreaker_example_test.go
│   ├── gobreaker_http.go          # HTTP 클라이언트 래핑
│   ├── gobreaker_http_test.go
│   ├── failsafe_example.go        # failsafe-go Circuit Breaker
│   ├── failsafe_example_test.go
│   ├── failsafe_composed.go       # Fallback + Retry + CB 조합
│   └── failsafe_composed_test.go
└── README.md
```

> `ratelimit/`, `retry/` 디렉토리는 `6_14_go_rate_limiting`에서 생성. 동일 `resilience/` 모듈 공유.

### 1.2 의존성

```
github.com/sony/gobreaker/v2
github.com/failsafe-go/failsafe-go
github.com/stretchr/testify
```

### 1.3 sony/gobreaker 구현 상세

#### circuitbreaker/gobreaker_example.go - 기본 사용법

- `gobreaker.NewCircuitBreaker[T](settings)` 으로 생성 (v2 제네릭 지원)
- Settings 설정: MaxRequests, Interval, Timeout, ReadyToTrip, OnStateChange
- Execute 메서드로 보호된 함수 실행

```go
func NewBreaker(name string) *gobreaker.CircuitBreaker[[]byte] {
    settings := gobreaker.Settings{
        Name:        name,
        MaxRequests: 3,                // Half-Open 상태에서 허용할 요청 수
        Interval:    10 * time.Second, // Closed 상태 카운터 초기화 주기
        Timeout:     30 * time.Second, // Open → Half-Open 전환 대기 시간
        ReadyToTrip: func(counts gobreaker.Counts) bool {
            return counts.ConsecutiveFailures > 5
        },
        OnStateChange: func(name string, from, to gobreaker.State) {
            log.Printf("Circuit Breaker %s: %s → %s", name, from, to)
        },
    }
    return gobreaker.NewCircuitBreaker[[]byte](settings)
}
```

#### circuitbreaker/gobreaker_http.go - HTTP 클라이언트 래핑

- `http.Client`를 Circuit Breaker로 래핑하는 패턴
- 외부 API 호출 보호
- HTTP 상태 코드 기반 실패 판단 (5xx = 실패)

```go
type ProtectedHTTPClient struct {
    client  *http.Client
    breaker *gobreaker.CircuitBreaker[*http.Response]
}

func (c *ProtectedHTTPClient) Do(req *http.Request) (*http.Response, error) {
    return c.breaker.Execute(func() (*http.Response, error) {
        resp, err := c.client.Do(req)
        if err != nil {
            return nil, err
        }
        if resp.StatusCode >= 500 {
            return resp, fmt.Errorf("server error: %d", resp.StatusCode)
        }
        return resp, nil
    })
}
```

### 1.4 failsafe-go 구현 상세

#### circuitbreaker/failsafe_example.go - Circuit Breaker

- Count-based, Time-based 두 가지 모드
- Builder 패턴으로 설정

```go
// Count-based
cb := circuitbreaker.Builder[any]().
    HandleErrors(errExternal).
    WithFailureThreshold(5).
    WithSuccessThreshold(3).
    WithDelay(30 * time.Second).
    Build()

// Time-based
cb := circuitbreaker.Builder[any]().
    HandleErrors(errExternal).
    WithFailureRateThreshold(50, 10, 1*time.Minute).
    WithSuccessThreshold(3).
    WithDelay(30 * time.Second).
    Build()
```

#### circuitbreaker/failsafe_composed.go - 정책 조합

- Fallback → Retry → Circuit Breaker 순서로 조합
- 정책 순서에 따른 동작 차이 설명

```go
fb := fallback.WithResult(cachedData)
rt := retrypolicy.Builder[any]().
    WithMaxRetries(3).
    WithBackoff(1*time.Second, 10*time.Second).
    Build()
cb := circuitbreaker.Builder[any]().
    WithFailureThreshold(5).
    WithDelay(30*time.Second).
    Build()

// 실행: Circuit Breaker 먼저 체크 → 실패 시 Retry → 최종 실패 시 Fallback
result, err := failsafe.Get(fn, fb, rt, cb)
```

### 1.5 테스트 구현

- `gobreaker_example_test.go`: 상태 전이 검증 (Closed→Open→Half-Open→Closed)
- `gobreaker_http_test.go`: httptest.NewServer로 5xx 시뮬레이션, Circuit Open 시 즉시 거부 확인
- `failsafe_example_test.go`: count-based/time-based 각각 테스트
- `failsafe_composed_test.go`: Retry + CB + Fallback 조합 동작 검증

---

## 2. 블로그 글 작성 (blog-v2)

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/go-circuit-breaker-패턴-완벽-가이드/index.md
```

### 2.2 frontmatter

```yaml
---
title: "Go Circuit Breaker 패턴 완벽 가이드"
description: "Circuit Breaker 상태 머신 이론과 sony/gobreaker, failsafe-go를 활용한 Go 구현, Fallback 전략과 정책 조합 패턴까지 다룹니다"
date: 2026-03-XX
tags:
  - go
  - circuit-breaker
  - failsafe-go
  - resilience
series: "Go 웹 개발"
---
```

### 2.3 Mermaid 다이어그램 목록

1. **Cascading Failure**: 외부 장애 전파 시나리오 (sequence diagram)
2. **상태 머신**: Closed/Open/Half-Open 상태 전이 (state diagram)
3. **gobreaker 동작 흐름**: 요청 → 상태 확인 → 실행/거부 (flowchart)
4. **failsafe-go 정책 조합**: Fallback → Retry → CB 흐름 (flowchart)

### 2.4 참조 링크

- [Go Rate Limiting 완벽 가이드](/article/go-rate-limiting-완벽-가이드) - Rate Limiting 패턴
- GitHub 샘플 코드 링크: `tutorials-go/golang/resilience/`
