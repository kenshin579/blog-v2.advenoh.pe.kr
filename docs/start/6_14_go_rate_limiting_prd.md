# Go Rate Limiting 완벽 가이드 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (3/3-a)
> 참조: `6_golang_topic_prd.md` P3-3
> 관련: `6_15_go_circuit_breaker_prd.md` (Circuit Breaker 별도 PRD)

---

## 1. 개요

API 서버에서 트래픽을 제어하고 서비스 안정성을 확보하기 위한 Rate Limiting 패턴을 다룬다. 알고리즘 이론을 중심으로 설명하고, Go 구현은 핵심 샘플 코드로 보여준다. 단일 인스턴스부터 분산 환경(Redis 기반)까지 커버하며, Retry 패턴(backoff, jitter)도 함께 다룬다.

**대상 독자**: 백엔드 서비스 안정성에 관심 있는 중급 이상 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요

---

## 2. 블로그 목차

> 블로그 글의 heading 구조 (`# 1.` → `## 1.1` → `### 1.1.1`)

```
# 1. Rate Limiting이란?
  - 과도한 트래픽으로 인한 서비스 장애 시나리오
  - DDoS 방어, API 남용 방지, 공정한 리소스 분배
  - Rate Limiting이 없는 서버 vs 있는 서버 비교 (Mermaid sequence diagram)

# 2. Rate Limiting 알고리즘
  각 알고리즘을 Mermaid 다이어그램으로 시각화하며 이론 중심으로 설명한다.
  ## 2.1 Token Bucket
    - 일정 속도로 토큰 충전, 요청 시 토큰 소비
    - 버스트 허용 (버킷 용량만큼)
    - 장점: 구현 간단, 버스트 허용 / 단점: 메모리 사용
    - Mermaid flowchart로 동작 흐름 시각화
  ## 2.2 Leaky Bucket
    - 일정 속도로만 처리, 초과분 대기 또는 거부
    - 출력 속도 일정 보장
    - 장점: 균일한 처리 속도 / 단점: 버스트 불가
    - Token Bucket과의 차이점 비교표
  ## 2.3 Fixed Window Counter
    - 고정 시간 창(예: 1분) 내 요청 수 제한
    - 장점: 구현 간단, 메모리 효율적 / 단점: 경계(boundary) 문제
    - 경계 문제를 Mermaid 다이어그램으로 시각화
  ## 2.4 Sliding Window Log
    - 각 요청의 타임스탬프를 기록
    - 장점: 정확한 제한 / 단점: 메모리 사용량 많음
  ## 2.5 Sliding Window Counter
    - Fixed Window + Sliding 방식의 하이브리드
    - 가중치 기반으로 이전 윈도우와 현재 윈도우 합산
    - 장점: 정확하면서도 메모리 효율적 / 실무에서 가장 많이 사용
  ## 2.6 알고리즘 비교 요약표
    | 알고리즘 | 정확도 | 메모리 | 버스트 허용 | 구현 복잡도 |

# 3. Go로 Rate Limiting 구현하기
  ## 3.1 golang.org/x/time/rate (표준 확장 라이브러리)
    - Token Bucket 기반
    - rate.NewLimiter(rate, burst) 생성
    - 3가지 사용 방식: Allow(), Wait(), Reserve()
    - 각 방식의 사용 시나리오와 핵심 코드 스니펫
  ## 3.2 HTTP 미들웨어로 적용
    - Echo/Gin 미들웨어에서 Rate Limiter 적용
    - IP별 Rate Limiting (sync.Map으로 리미터 관리)
    - 429 Too Many Requests 응답 처리

# 4. 분산 Rate Limiting
  ## 4.1 왜 분산 Rate Limiting인가?
    - 다중 서버 인스턴스에서 단일 인스턴스 Rate Limiter의 한계
    - Mermaid diagram: 여러 서버가 하나의 Redis를 공유하는 구조
  ## 4.2 go-redis/redis_rate
    - GCRA(Generic Cell Rate Algorithm) 기반
    - redis_rate.NewLimiter(rdb) 생성
    - limiter.Allow(ctx, key, rate) 사용법
    - 핵심 코드 스니펫
  ## 4.3 Redis Lua Script 기반 Sliding Window
    - 원자적 연산으로 race condition 방지
    - Lua 스크립트 핵심 로직 설명

# 5. Retry 패턴
  ## 5.1 왜 Retry가 필요한가?
    - 일시적 장애(transient fault)에서의 복구
    - Rate Limit 응답(429)을 받았을 때의 클라이언트 전략
  ## 5.2 Backoff 전략
    - Fixed Delay: 일정 간격으로 재시도
    - Exponential Backoff: 1s → 2s → 4s → 8s 지수적 증가
    - Exponential Backoff + Jitter: Thundering Herd 방지
      - Full Jitter / Equal Jitter / Decorrelated Jitter
    - Mermaid 시각화
  ## 5.3 Go 구현
    ### cenkalti/backoff/v5
      - Exponential backoff 핵심 코드
      - Context 지원, MaxElapsedTime 설정
    ### avast/retry-go/v4
      - FullJitterBackoffDelay 사용법
      - 커스텀 retry 조건 설정

# 6. 테스트
  ## 6.1 Rate Limiter 테스트
    - 시간 기반 테스트 패턴
  ## 6.2 Retry 테스트
    - mock 서버로 실패/성공 시나리오
  ## 6.3 동시성 테스트
    - goroutine으로 부하 시뮬레이션

# 마무리
```

---

## 3. 샘플 코드 계획

```
tutorials-go/golang/resilience/
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

---

## 4. 사용 라이브러리

| 라이브러리 | 버전 | 용도 | Stars |
|-----------|------|------|-------|
| `golang.org/x/time/rate` | latest | Token Bucket Rate Limiter | (표준 확장) |
| `github.com/redis/go-redis/v9` | v9 | Redis 클라이언트 | 20k+ |
| `github.com/go-redis/redis_rate/v10` | v10 | 분산 Rate Limiting (GCRA) | 1k |
| `github.com/cenkalti/backoff/v5` | v5 | Exponential Backoff | 3.9k |
| `github.com/avast/retry-go/v4` | v4 | Retry with Jitter | 2.9k |
| `github.com/testcontainers/testcontainers-go` | latest | Redis 통합 테스트 | 3.5k |

---

## 5. 작업량 추정

### 블로그 글 작성
- 알고리즘 이론 + Mermaid 다이어그램 5~6개: **3~4시간**
- Go 코드 스니펫 + 설명: **2시간**
- Retry 패턴 섹션: **1~2시간**
- **소계: 6~8시간**

### 샘플 코드 작성
- ratelimit/ (단일 + 분산 + 미들웨어 + 테스트): **3~4시간**
- retry/ (backoff + retry-go + 테스트): **2시간**
- **소계: 5~6시간**

### 전체 예상: **11~14시간** (2~3일)

---

## 6. 논의 사항 (결정 완료)

- [x] Rate Limiting과 Circuit Breaker 분리 → **별도 PRD** (`6_15_go_circuit_breaker_prd.md`)
- [x] 알고리즘 설명 → **이론 중심**, 구현은 핵심 샘플 코드만
- [x] 분산 Rate Limiting → **포함** (Redis 기반)
- [x] Retry 패턴 → **포함** (backoff, jitter)
- [x] 시각화 → **Mermaid** 다이어그램 사용
- [x] 라이브러리 → **최신 버전** 사용 (cenkalti/backoff v5, avast/retry-go v4 등)
