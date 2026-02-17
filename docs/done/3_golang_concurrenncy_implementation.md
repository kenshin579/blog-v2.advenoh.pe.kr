# Golang Concurrency 블로그 시리즈 - 구현 문서

## 프로젝트 경로

| 항목 | 경로 |
|------|------|
| 샘플 코드 | `tutorials-go/golang/concurrency/` |
| 블로그 포스트 | `blog-v2.advenoh.pe.kr/contents/go/` |
| 기존 concurrency 코드 | `tutorials-go/golang/concurrency/{mutex,waitgroup,once-do}/` |

---

## 편별 구현 상세

### 1편: Concurrency 개요와 Goroutine

**샘플 코드**: `tutorials-go/golang/concurrency/goroutine/`

| 파일 | 구현 내용 |
|------|----------|
| `basic_test.go` | `go func()` 으로 goroutine 생성, `runtime.NumGoroutine()` 확인, 실행 순서 비결정성 테스트 |
| `lifecycle_test.go` | main 함수 종료 시 goroutine 미완료 문제, `sync.WaitGroup`으로 대기 |
| `leak_test.go` | channel 대기로 인한 goroutine leak 예시, `runtime.NumGoroutine()` 으로 leak 탐지 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-1-goroutine-기초/index.md`

```yaml
---
title: "Golang Concurrency (1) - 개요와 Goroutine 기초"
description: "Golang Concurrency (1) - 개요와 Goroutine 기초"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - goroutine
  - parallelism
  - scheduler
  - lightweight-thread
  - 고랭
  - 동시성
  - 고루틴
series: "Golang Concurrency"
seriesOrder: 1
---
```

**블로그 본문 핵심 포인트**:
- Concurrency vs Parallelism 다이어그램 (텍스트 기반 ASCII 또는 이미지)
- CSP 모델 설명 + Go 철학 인용
- GMP 모델 다이어그램 (Goroutine-Machine-Processor)
- goroutine 비용: ~2KB 스택 vs OS thread ~1MB
- `runtime.GOMAXPROCS` 설정 예제

---

### 2편: Channel 완전 정복

**샘플 코드**: `tutorials-go/golang/concurrency/channel/`

| 파일 | 구현 내용 |
|------|----------|
| `basic_test.go` | `make(chan int)` 생성, send/receive, blocking 동작 확인 |
| `buffered_test.go` | `make(chan int, N)` buffered channel, 버퍼 가득 찼을 때 blocking |
| `direction_test.go` | `chan<- int` (send-only), `<-chan int` (receive-only) 함수 파라미터 |
| `close_test.go` | `close(ch)`, 닫힌 채널 receive (zero value + false), `range ch` |
| `bench_test.go` | `BenchmarkUnbuffered`, `BenchmarkBuffered` 성능 비교 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-2-channel-완전-정복/index.md`

```yaml
---
title: "Golang Concurrency (2) - Channel 완전 정복"
description: "Golang Concurrency (2) - Channel 완전 정복"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - channel
  - buffered
  - unbuffered
  - producer-consumer
  - 고랭
  - 동시성
  - 채널
series: "Golang Concurrency"
seriesOrder: 2
---
```

**블로그 본문 핵심 포인트**:
- Unbuffered vs Buffered channel 동작 다이어그램
- Producer/Consumer 패턴 전체 코드
- close 규칙: sender만 close, receiver는 close 금지

---

### 3편: Select와 Channel 심화 패턴

**샘플 코드**: `tutorials-go/golang/concurrency/select/`

| 파일 | 구현 내용 |
|------|----------|
| `basic_test.go` | `select` 여러 case, `default` case, 랜덤 선택 확인 |
| `timeout_test.go` | `time.After` 타임아웃, `context.WithTimeout` 조합 |
| `fanin_fanout_test.go` | fan-out: 입력을 N개 worker에 분배, fan-in: N개 결과를 하나로 merge |
| `nil_channel_test.go` | nil channel 할당으로 select case 동적 비활성화 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-3-select와-channel-심화/index.md`

```yaml
---
title: "Golang Concurrency (3) - Select와 Channel 심화 패턴"
description: "Golang Concurrency (3) - Select와 Channel 심화 패턴"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - select
  - timeout
  - fan-in
  - fan-out
  - nil-channel
  - 고랭
  - 동시성
series: "Golang Concurrency"
seriesOrder: 3
---
```

---

### 4편: Sync 패키지

**샘플 코드**: `tutorials-go/golang/concurrency/sync-pkg/`

| 파일 | 구현 내용 |
|------|----------|
| `waitgroup_test.go` | `wg.Add(N)`, `wg.Done()`, `wg.Wait()` 기본 패턴 |
| `mutex_test.go` | `sync.Mutex` 임계영역, `sync.RWMutex` 읽기 동시성, `BenchmarkMutex` vs `BenchmarkRWMutex` |
| `once_test.go` | `sync.Once` 로 singleton 패턴, 여러 goroutine에서 호출해도 1회만 실행 |
| `syncmap_test.go` | `sync.Map` 사용, `map+Mutex` 대비 벤치마크 |
| `cond_test.go` | `sync.Cond` 로 producer-consumer 조건 대기 (선택 구현) |

**기존 코드 참조**: `mutex/`, `waitgroup/`, `once-do/` 디렉토리의 기존 예제 활용

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-4-sync-패키지/index.md`

```yaml
---
title: "Golang Concurrency (4) - sync 패키지 완벽 가이드"
description: "Golang Concurrency (4) - sync 패키지 완벽 가이드"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - sync
  - mutex
  - rwmutex
  - waitgroup
  - once
  - race-condition
  - 고랭
  - 동시성
  - 동기화
series: "Golang Concurrency"
seriesOrder: 4
---
```

---

### 5편: Context 패키지

**샘플 코드**: `tutorials-go/golang/concurrency/context/`

| 파일 | 구현 내용 |
|------|----------|
| `cancel_test.go` | `context.WithCancel`, cancel 호출 시 `ctx.Done()` 수신 확인 |
| `timeout_test.go` | `context.WithTimeout`, `context.WithDeadline`, 시간 초과 시 자동 취소 |
| `value_test.go` | `context.WithValue`, key 타입 정의, 값 조회 |
| `propagation_test.go` | parent → child context 전파, cancel 체인 동작 확인 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-5-context-패키지/index.md`

```yaml
---
title: "Golang Concurrency (5) - Context 패키지 필수 가이드"
description: "Golang Concurrency (5) - Context 패키지 필수 가이드"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - context
  - cancellation
  - timeout
  - deadline
  - request-scope
  - 고랭
  - 동시성
series: "Golang Concurrency"
seriesOrder: 5
---
```

---

### 6편: Concurrency Patterns

**샘플 코드**: `tutorials-go/golang/concurrency/patterns/`

| 파일 | 구현 내용 |
|------|----------|
| `worker_pool_test.go` | job channel → N개 worker → result channel, 고정 worker 수 |
| `pipeline_test.go` | generator → square → print 스테이지 체이닝 |
| `semaphore_test.go` | `make(chan struct{}, N)` 으로 동시 실행 수 제한 |
| `rate_limit_test.go` | `time.Ticker` 기반 rate limiter, token bucket |
| `pubsub_test.go` | channel 기반 이벤트 브로커, subscribe/publish/unsubscribe |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-6-concurrency-patterns/index.md`

```yaml
---
title: "Golang Concurrency (6) - 실무 핵심 Concurrency Patterns"
description: "Golang Concurrency (6) - 실무 핵심 Concurrency Patterns"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - worker-pool
  - pipeline
  - semaphore
  - rate-limiting
  - pub-sub
  - pattern
  - 고랭
  - 동시성
series: "Golang Concurrency"
seriesOrder: 6
---
```

---

### 7편: Error Handling in Concurrency

**샘플 코드**: `tutorials-go/golang/concurrency/errhandling/`

| 파일 | 구현 내용 |
|------|----------|
| `error_channel_test.go` | `Result{Value, Err}` struct 를 channel로 전달 |
| `errgroup_test.go` | `errgroup.Group`, `errgroup.WithContext`, `SetLimit()` |
| `multi_error_test.go` | 여러 goroutine 에러를 slice로 수집, `errors.Join` 활용 |

**의존성 추가**: `golang.org/x/sync/errgroup`

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-7-error-handling/index.md`

```yaml
---
title: "Golang Concurrency (7) - 동시성 환경의 Error Handling"
description: "Golang Concurrency (7) - 동시성 환경의 Error Handling"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - error
  - errgroup
  - error-channel
  - multi-error
  - 고랭
  - 동시성
  - 에러처리
series: "Golang Concurrency"
seriesOrder: 7
---
```

---

### 8편: Memory Model과 Atomic

**샘플 코드**: `tutorials-go/golang/concurrency/memory-model/`

| 파일 | 구현 내용 |
|------|----------|
| `visibility_test.go` | 공유 변수 visibility 문제 재현 (컴파일러 최적화 영향) |
| `atomic_test.go` | `atomic.Int64`, `atomic.Bool`, `atomic.Value`, Load/Store/CAS |
| `bench_test.go` | `BenchmarkAtomicCounter`, `BenchmarkMutexCounter` 비교 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-8-memory-model/index.md`

```yaml
---
title: "Golang Concurrency (8) - Go Memory Model과 Atomic Operations"
description: "Golang Concurrency (8) - Go Memory Model과 Atomic Operations"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - memory-model
  - happens-before
  - atomic
  - visibility
  - sync-atomic
  - 고랭
  - 동시성
series: "Golang Concurrency"
seriesOrder: 8
---
```

---

### 9편: Debugging과 Race Detector

**샘플 코드**: `tutorials-go/golang/concurrency/debugging/`

| 파일 | 구현 내용 |
|------|----------|
| `race_test.go` | 의도적 race condition 코드 + 수정 버전, `-race` 플래그로 탐지 |
| `deadlock_test.go` | unbuffered channel 양방향 대기 deadlock, 수정 패턴 |
| `goroutine_dump_test.go` | `runtime.Stack()` 으로 goroutine 상태 덤프 |

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-9-debugging-race-detector/index.md`

```yaml
---
title: "Golang Concurrency (9) - Debugging과 Race Detector"
description: "Golang Concurrency (9) - Debugging과 Race Detector"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - race-detector
  - deadlock
  - pprof
  - goroutine-dump
  - debugging
  - 고랭
  - 동시성
  - 디버깅
series: "Golang Concurrency"
seriesOrder: 9
---
```

---

### 10편: 실전 프로젝트 + Best Practices

**샘플 코드**: `tutorials-go/golang/concurrency/project/`

| 파일 | 구현 내용 |
|------|----------|
| `crawler/crawler.go` | Crawler 구조체: URL 큐, visited map, Worker Pool, Rate Limiter |
| `crawler/worker.go` | Worker: HTTP fetch, 링크 추출, 결과 전달 |
| `crawler/crawler_test.go` | httptest.Server 로 테스트 서버 구성, 크롤링 결과 검증 |
| `shutdown/server.go` | HTTP 서버 + `signal.NotifyContext` 기반 graceful shutdown |
| `shutdown/server_test.go` | shutdown 시그널 전송 후 정상 종료 확인 |

**Crawler 구현 핵심**:
- `context.WithCancel` 로 전체 크롤링 취소
- `make(chan struct{}, maxConcurrency)` 세마포어
- `time.Ticker` rate limiting
- `sync.Map` 으로 visited URL 관리
- `errgroup` 으로 에러 수집

**블로그**: `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-10-실전-프로젝트-best-practices/index.md`

```yaml
---
title: "Golang Concurrency (10) - 실전 프로젝트와 Best Practices"
description: "Golang Concurrency (10) - 실전 프로젝트와 Best Practices"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - best-practice
  - anti-pattern
  - graceful-shutdown
  - project
  - 고랭
  - 동시성
  - 실전
series: "Golang Concurrency"
seriesOrder: 10
---
```

---

## 테스트 실행 명령어

```bash
# 편별 테스트
go test -v -race ./golang/concurrency/goroutine/...     # 1편
go test -v -race ./golang/concurrency/channel/...       # 2편
go test -v -race ./golang/concurrency/select/...        # 3편
go test -v -race ./golang/concurrency/sync-pkg/...      # 4편
go test -v -race ./golang/concurrency/context/...       # 5편
go test -v -race ./golang/concurrency/patterns/...      # 6편
go test -v -race ./golang/concurrency/errhandling/...   # 7편
go test -v -race ./golang/concurrency/memory-model/...  # 8편
go test -v -race ./golang/concurrency/debugging/...     # 9편
go test -v -race ./golang/concurrency/project/...       # 10편

# 전체 테스트
go test -v -race ./golang/concurrency/...

# 벤치마크
go test -bench=. -benchmem ./golang/concurrency/channel/...
go test -bench=. -benchmem ./golang/concurrency/sync-pkg/...
go test -bench=. -benchmem ./golang/concurrency/memory-model/...
```

## 블로그 빌드 확인

```bash
cd blog-v2.advenoh.pe.kr && npm run build
```

## 인코딩 확인

```bash
file -I blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-*/index.md
```
