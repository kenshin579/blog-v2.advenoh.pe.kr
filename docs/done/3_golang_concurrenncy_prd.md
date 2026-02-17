# Golang Concurrency 블로그 시리즈 PRD

## 개요

Go 언어의 Concurrency를 체계적으로 스터디하면서 블로그 시리즈로 정리한다.
샘플 코드는 `tutorials-go/golang/concurrency/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/contents/go/`에 작성한다.

**시리즈 구성**: 총 10편 (개요부터 실전 프로젝트까지)

## 참고 자료

- [docs/start/2_chatgpt.md](./2_chatgpt.md) - ChatGPT 목차 초안
- https://go.dev/doc/effective_go#concurrency
- https://go.dev/blog/pipelines
- https://go.dev/blog/context
- https://go.dev/ref/mem (Go Memory Model)
- https://gobyexample.com
- 도서: "Concurrency in Go" (Katherine Cox-Buday, O'Reilly)

---

## 블로그 시리즈 구성

### 공통 사항

- **시리즈명**: `"Golang Concurrency"`
- **태그 공통**: golang, go, concurrency, 고랭, 동시성
- **카테고리 폴더**: `blog-v2.advenoh.pe.kr/contents/go/`
- **frontmatter 형식**:
  ```yaml
  ---
  title: "제목"
  description: "설명"
  date: YYYY-MM-DD
  update: YYYY-MM-DD
  tags:
    - golang
    - go
    - concurrency
    - (편별 추가 태그)
  series: "Golang Concurrency"
  seriesOrder: N
  ---
  ```

---

### 1편: Concurrency 개요와 Goroutine

- **폴더**: `golang-concurrency-1-goroutine-기초/index.md`
- **제목**: "Golang Concurrency (1) - 개요와 Goroutine 기초"
- **추가 태그**: goroutine, parallelism, scheduler, lightweight-thread, 고루틴
- **seriesOrder**: 1

#### 목차

1. Concurrency vs Parallelism 차이
   - 개념 설명 + 다이어그램
   - Go에서의 의미
2. 왜 Go는 concurrency에 강한가
   - CSP(Communicating Sequential Processes) 모델
   - "Do not communicate by sharing memory; share memory by communicating"
3. 언제 concurrency를 사용해야 하는가 / 사용하면 안 되는가
4. Goroutine 기초
   - goroutine 생성 방법 (`go` 키워드)
   - main goroutine과 lifecycle
   - goroutine 비용 (lightweight thread vs OS thread)
5. Goroutine Scheduling 개념
   - runtime scheduler (GMP 모델: Goroutine, Machine, Processor)
   - `runtime.GOMAXPROCS`
6. Goroutine Leak이란?
   - 발생 원인과 예방
7. 실습
   - goroutine 실행 순서 확인
   - sleep 없이 프로그램 종료되는 문제 재현

---

### 2편: Channel 완전 정복

- **폴더**: `golang-concurrency-2-channel-완전-정복/index.md`
- **제목**: "Golang Concurrency (2) - Channel 완전 정복"
- **추가 태그**: channel, buffered, unbuffered, producer-consumer, 채널
- **seriesOrder**: 2

#### 목차

1. Channel 개념과 생성 (`make(chan T)`)
2. Send / Receive 동작
3. Blocking 동작 이해
4. Unbuffered vs Buffered Channel
   - 동작 차이 + 다이어그램
   - 성능 비교 벤치마크
5. Channel 방향 제한 (send-only / receive-only)
6. Channel close 의미와 규칙
   - 닫힌 채널에서 receive
   - close 책임 원칙 (sender가 close)
7. Range over Channel
8. 실습
   - Producer / Consumer 패턴
   - Buffered vs Unbuffered 성능 비교

---

### 3편: Select와 Channel 심화 패턴

- **폴더**: `golang-concurrency-3-select와-channel-심화/index.md`
- **제목**: "Golang Concurrency (3) - Select와 Channel 심화 패턴"
- **추가 태그**: select, timeout, fan-in, fan-out, nil-channel
- **seriesOrder**: 3

#### 목차

1. Select 문 기본
   - 여러 channel 동시 대기
   - 랜덤 선택 특성
2. Default case 활용
   - non-blocking send/receive
3. Timeout 처리
   - `time.After`
   - `context.WithTimeout` (예고)
4. Fan-in / Fan-out 패턴
   - Fan-out: 하나의 입력을 여러 goroutine으로 분배
   - Fan-in: 여러 goroutine의 결과를 하나로 모음
5. Nil Channel 트릭
   - 동적으로 channel 비활성화
6. 실습
   - 여러 worker 결과 모으기
   - timeout 있는 API 호출 시뮬레이션

---

### 4편: Sync 패키지

- **폴더**: `golang-concurrency-4-sync-패키지/index.md`
- **제목**: "Golang Concurrency (4) - sync 패키지 완벽 가이드"
- **추가 태그**: sync, mutex, rwmutex, waitgroup, once, race-condition, 동기화
- **seriesOrder**: 4

#### 목차

1. 왜 Synchronization이 필요한가
   - Race Condition 예시
2. sync.WaitGroup
   - Add / Done / Wait 패턴
3. sync.Mutex
   - 임계 영역(Critical Section) 보호
4. sync.RWMutex
   - 읽기 동시성 허용
   - Mutex vs RWMutex 벤치마크
5. sync.Once
   - 한 번만 실행 보장 (singleton 패턴)
6. sync.Map
   - concurrent-safe map
   - 일반 map + Mutex vs sync.Map 비교
7. sync.Cond (선택)
   - 조건 변수 기반 동기화
8. 실습
   - shared counter 보호 (Mutex vs atomic)
   - singleton 구현

---

### 5편: Context 패키지

- **폴더**: `golang-concurrency-5-context-패키지/index.md`
- **제목**: "Golang Concurrency (5) - Context 패키지 필수 가이드"
- **추가 태그**: context, cancellation, timeout, deadline, request-scope
- **seriesOrder**: 5

#### 목차

1. Context 개념과 필요성
   - goroutine 생명주기 관리
   - 요청 범위(request scope) 전파
2. context.Background() / context.TODO()
3. context.WithCancel
   - 명시적 취소 신호
4. context.WithTimeout / context.WithDeadline
   - 시간 제한 설정
5. context.WithValue
   - 값 전달 주의사항 (남용 금지)
6. Context 전파 규칙
   - 함수 첫 번째 파라미터로 전달
   - `ctx.Done()` 채널 활용
7. 실습
   - goroutine cancel 체인
   - HTTP request timeout 구현

---

### 6편: Concurrency Patterns (핵심)

- **폴더**: `golang-concurrency-6-concurrency-patterns/index.md`
- **제목**: "Golang Concurrency (6) - 실무 핵심 Concurrency Patterns"
- **추가 태그**: worker-pool, pipeline, semaphore, rate-limiting, pub-sub, pattern
- **seriesOrder**: 6

#### 목차

1. Worker Pool 패턴
   - 고정 수의 worker goroutine
   - job channel + result channel
2. Pipeline 패턴
   - 스테이지 체이닝
   - 각 스테이지가 channel로 연결
3. Fan-out / Fan-in (심화)
   - Pipeline과 결합
4. Semaphore 패턴
   - buffered channel로 동시 실행 수 제한
5. Rate Limiting
   - `time.Ticker` 기반
   - Token bucket 패턴
6. Pub/Sub 패턴
   - channel 기반 이벤트 브로커
7. Bounded Concurrency
   - 동시 goroutine 수 제한
8. 실습
   - concurrent file processing (Worker Pool)
   - parallel API crawler (Pipeline + Fan-out)

---

### 7편: Error Handling in Concurrency

- **폴더**: `golang-concurrency-7-error-handling/index.md`
- **제목**: "Golang Concurrency (7) - 동시성 환경의 Error Handling"
- **추가 태그**: error, errgroup, error-channel, multi-error, 에러처리
- **seriesOrder**: 7

#### 목차

1. Goroutine에서의 Error 전달 문제
   - goroutine 내부 panic은 어떻게 되나
2. Error Channel 패턴
   - 결과와 에러를 함께 전달하는 struct
3. Multi-error 처리
   - 여러 goroutine의 에러 수집
4. errgroup 사용 (`golang.org/x/sync/errgroup`)
   - `errgroup.Group`
   - `errgroup.WithContext`
   - 첫 번째 에러 시 전체 취소
5. errgroup + Semaphore 조합
   - `SetLimit()`로 동시성 제한
6. 실습
   - parallel job error aggregation

---

### 8편: Memory Model과 Atomic

- **폴더**: `golang-concurrency-8-memory-model/index.md`
- **제목**: "Golang Concurrency (8) - Go Memory Model과 Atomic Operations"
- **추가 태그**: memory-model, happens-before, atomic, visibility, sync-atomic
- **seriesOrder**: 8

#### 목차

1. Go Memory Model 개요
   - 왜 메모리 모델을 알아야 하는가
2. Happens-before 관계
   - goroutine 생성, channel 통신, sync 패키지
3. Visibility 문제
   - 컴파일러/CPU 재정렬 (reordering)
4. sync/atomic 패키지
   - `atomic.Int64`, `atomic.Bool` (Go 1.19+)
   - `atomic.Value`
   - Load / Store / Swap / CompareAndSwap
5. Atomic vs Mutex 비교
   - 사용 시나리오별 가이드
   - 벤치마크
6. 실습
   - atomic counter vs mutex counter 벤치마크

---

### 9편: Debugging과 Race Detector

- **폴더**: `golang-concurrency-9-debugging-race-detector/index.md`
- **제목**: "Golang Concurrency (9) - Debugging과 Race Detector"
- **추가 태그**: race-detector, deadlock, pprof, goroutine-dump, debugging, 디버깅
- **seriesOrder**: 9

#### 목차

1. Race Detector (`-race` 플래그)
   - 사용법: `go test -race`, `go run -race`
   - 출력 읽는 법
2. Goroutine Dump
   - `runtime.Stack()`
   - SIGQUIT / pprof
3. Deadlock 분석
   - 일반적인 deadlock 패턴
   - `fatal error: all goroutines are asleep - deadlock!`
4. pprof로 분석
   - goroutine 프로파일링
   - `net/http/pprof`
5. Testing with Concurrency
   - `-count`, `-race` 조합
   - `t.Parallel()`
6. 실습
   - 의도적으로 race condition 만들기 + 수정
   - deadlock 재현 + 수정

---

### 10편: 실전 프로젝트 + Best Practices

- **폴더**: `golang-concurrency-10-실전-프로젝트-best-practices/index.md`
- **제목**: "Golang Concurrency (10) - 실전 프로젝트와 Best Practices"
- **추가 태그**: best-practice, anti-pattern, graceful-shutdown, project, 실전
- **seriesOrder**: 10

#### 목차

1. 실전 프로젝트: Concurrent Web Crawler
   - Worker Pool + Rate Limiting + Context 조합
   - Graceful Shutdown 구현
2. Best Practices 정리
   - Channel vs Mutex 언제 쓰나
   - Context 반드시 전달하기
   - Goroutine leak 방지 체크리스트
   - Channel close 책임 원칙
   - Structured concurrency
   - Graceful shutdown 패턴
3. Anti-patterns
   - Global channel 남용
   - 무한 goroutine 생성
   - Context 안 쓰는 서버
   - Channel close panic
   - Select default 남용
4. 핵심 개념 요약 + 실무 체크리스트
5. 추천 라이브러리
   - `golang.org/x/sync/errgroup`
   - `golang.org/x/sync/semaphore`
   - `golang.org/x/sync/singleflight`

---

## 샘플 코드 구성

### 디렉토리 구조

기존 `tutorials-go/golang/concurrency/` 디렉토리를 확장한다.

```
tutorials-go/golang/concurrency/
├── goroutine/                    # 1편: Goroutine 기초
│   ├── basic_test.go             # goroutine 생성, 실행 순서
│   ├── lifecycle_test.go         # main 종료 시 goroutine 종료
│   └── leak_test.go              # goroutine leak 예시
│
├── channel/                      # 2편: Channel
│   ├── basic_test.go             # send/receive, blocking
│   ├── buffered_test.go          # unbuffered vs buffered
│   ├── direction_test.go         # send-only, receive-only
│   ├── close_test.go             # close 동작, range
│   └── bench_test.go             # buffered vs unbuffered 벤치마크
│
├── select/                       # 3편: Select & Channel 심화
│   ├── basic_test.go             # select 기본, default
│   ├── timeout_test.go           # time.After, timeout 처리
│   ├── fanin_fanout_test.go      # fan-in / fan-out
│   └── nil_channel_test.go       # nil channel 트릭
│
├── sync-pkg/                     # 4편: Sync 패키지
│   ├── waitgroup_test.go         # WaitGroup
│   ├── mutex_test.go             # Mutex, RWMutex (+ 벤치마크)
│   ├── once_test.go              # Once (singleton)
│   ├── syncmap_test.go           # sync.Map vs map+Mutex
│   └── cond_test.go              # sync.Cond (선택)
│
├── context/                      # 5편: Context
│   ├── cancel_test.go            # WithCancel
│   ├── timeout_test.go           # WithTimeout, WithDeadline
│   ├── value_test.go             # WithValue
│   └── propagation_test.go       # Context 전파 체인
│
├── patterns/                     # 6편: Concurrency Patterns
│   ├── worker_pool_test.go       # Worker Pool
│   ├── pipeline_test.go          # Pipeline
│   ├── semaphore_test.go         # Semaphore (buffered channel)
│   ├── rate_limit_test.go        # Rate Limiting
│   └── pubsub_test.go            # Pub/Sub
│
├── errhandling/                  # 7편: Error Handling
│   ├── error_channel_test.go     # Error Channel 패턴
│   ├── errgroup_test.go          # errgroup 사용
│   └── multi_error_test.go       # Multi-error 수집
│
├── memory-model/                 # 8편: Memory Model & Atomic
│   ├── visibility_test.go        # Visibility 문제 예시
│   ├── atomic_test.go            # atomic 패키지 사용
│   └── bench_test.go             # atomic vs mutex 벤치마크
│
├── debugging/                    # 9편: Debugging
│   ├── race_test.go              # race condition 의도적 생성/수정
│   ├── deadlock_test.go          # deadlock 재현/수정
│   └── goroutine_dump_test.go    # goroutine dump
│
├── project/                      # 10편: 실전 프로젝트
│   ├── crawler/                  # Concurrent Web Crawler
│   │   ├── crawler.go
│   │   ├── crawler_test.go
│   │   └── worker.go
│   └── shutdown/                 # Graceful Shutdown
│       ├── server.go
│       └── server_test.go
│
├── mutex/                        # (기존) 기존 mutex 예제
├── waitgroup/                    # (기존) 기존 waitgroup 예제
└── once-do/                      # (기존) 기존 once-do 예제
```

### 테스트 파일 공통 규칙

- testify/suite 패턴 사용 (기존 코드 스타일 준수)
- 한국어 주석으로 교육적 설명 포함
- 벤치마크 테스트는 `bench_test.go` 또는 `*_bench_test.go`로 명명
- `defer util.Timer()("functionName")` 패턴 활용 (성능 측정 시)

### 각 편별 테스트 파일 요구사항

| 편 | 디렉토리 | 핵심 테스트 내용 |
|----|---------|-----------------|
| 1편 | `goroutine/` | goroutine 생성, 실행 순서 비결정성, leak 예시 |
| 2편 | `channel/` | unbuffered/buffered 차이, close 동작, producer-consumer |
| 3편 | `select/` | select 멀티플렉싱, timeout, fan-in/fan-out |
| 4편 | `sync-pkg/` | WaitGroup/Mutex/RWMutex/Once 사용, 벤치마크 |
| 5편 | `context/` | Cancel/Timeout/Value, 전파 체인 |
| 6편 | `patterns/` | Worker Pool, Pipeline, Semaphore, Rate Limiting |
| 7편 | `errhandling/` | error channel, errgroup, multi-error 수집 |
| 8편 | `memory-model/` | visibility 문제, atomic 연산, atomic vs mutex 벤치마크 |
| 9편 | `debugging/` | race 의도적 생성, deadlock 재현, goroutine dump |
| 10편 | `project/` | Concurrent Crawler 구현, Graceful Shutdown |

---

## 작업 순서 (편별)

각 편은 독립적으로 아래 순서를 따른다.

### Phase 1: 샘플 코드 작성
1. `tutorials-go/golang/concurrency/{topic}/` 디렉토리 생성
2. 테스트 파일 작성
3. `go test -v -race ./golang/concurrency/{topic}/...` 로 테스트 통과 확인

### Phase 2: 블로그 포스트 작성
4. `blog-v2.advenoh.pe.kr/contents/go/{폴더명}/index.md` 생성
5. frontmatter 작성 (series, seriesOrder 포함)
6. 본문 작성 (개념 설명 + 코드 예제 인라인)
7. 인코딩 확인 (`file -I`)

### Phase 3: 검증
8. 블로그 빌드 확인 (`npm run build`)
9. 테스트 재확인 (`go test -race ./golang/concurrency/...`)

### Phase 4: PR 생성
10. feature 브랜치 생성 (편당 또는 묶어서)
    - `feature/{issue-number}-golang-concurrency-{N}`
11. PR 생성 및 리뷰 요청

---

## 진행 우선순위

**필수 (Core)**: 1편 ~ 7편
- 기초부터 실무 패턴까지 핵심 내용

**심화 (Advanced)**: 8편 ~ 9편
- Memory Model, Debugging은 중급 이상 내용

**마무리 (Wrap-up)**: 10편
- 실전 프로젝트로 전체 지식 통합

---

## 기존 코드 활용

`tutorials-go/golang/concurrency/` 에 이미 존재하는 예제:
- `mutex/` - Mutex 예제 → 4편에서 참조 또는 확장
- `waitgroup/` - WaitGroup + 분산 락 예제 → 4편에서 참조
- `once-do/` - sync.Once 예제 → 4편에서 참조

기존 코드는 유지하면서, 새 디렉토리에 시리즈용 코드를 추가한다.
