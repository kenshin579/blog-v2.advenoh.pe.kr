# Golang Concurrency 블로그 시리즈 - TODO

---

## 1편: Concurrency 개요와 Goroutine

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/goroutine/` 디렉토리 생성
- [x] `basic_test.go` 작성 - goroutine 생성, 실행 순서 비결정성
- [x] `lifecycle_test.go` 작성 - main 종료 시 goroutine 종료 문제
- [x] `leak_test.go` 작성 - goroutine leak 예시
- [x] `go test -v -race ./golang/concurrency/goroutine/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-1-goroutine-기초/index.md` 생성
- [x] frontmatter 작성 (series: "Golang Concurrency", seriesOrder: 1)
- [x] 본문 작성: Concurrency vs Parallelism, CSP 모델, GMP 스케줄러, goroutine 기초
- [x] 인코딩 확인 (`file -I`)

### Phase 3: 검증
- [x] 블로그 빌드 확인 (`npm run build`)
- [x] 테스트 재확인

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 2편: Channel 완전 정복

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/channel/` 디렉토리 생성
- [x] `basic_test.go` 작성 - send/receive, blocking 동작
- [x] `buffered_test.go` 작성 - unbuffered vs buffered channel
- [x] `direction_test.go` 작성 - send-only, receive-only
- [x] `close_test.go` 작성 - close 동작, range over channel
- [x] `bench_test.go` 작성 - buffered vs unbuffered 벤치마크
- [x] `go test -v -race ./golang/concurrency/channel/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-2-channel-완전-정복/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 2)
- [x] 본문 작성: Channel 개념, blocking, buffered/unbuffered, close 규칙, producer-consumer
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 블로그 빌드 확인
- [x] 테스트 재확인

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 3편: Select와 Channel 심화 패턴

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/select/` 디렉토리 생성
- [x] `basic_test.go` 작성 - select 기본, default case
- [x] `timeout_test.go` 작성 - time.After, context timeout
- [x] `fanin_fanout_test.go` 작성 - fan-in / fan-out 패턴
- [x] `nil_channel_test.go` 작성 - nil channel 트릭
- [x] `go test -v -race ./golang/concurrency/select/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-3-select와-channel-심화/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 3)
- [x] 본문 작성: select 멀티플렉싱, timeout, fan-in/fan-out, nil channel
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 블로그 빌드 확인
- [x] 테스트 재확인

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 4편: Sync 패키지

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/sync-pkg/` 디렉토리 생성
- [x] `waitgroup_test.go` 작성 - WaitGroup 패턴
- [x] `mutex_test.go` 작성 - Mutex, RWMutex + 벤치마크
- [x] `once_test.go` 작성 - sync.Once singleton
- [x] `syncmap_test.go` 작성 - sync.Map vs map+Mutex
- [x] ~~`cond_test.go` 작성 - sync.Cond (선택)~~ (스킵)
- [x] 기존 코드 참조 확인 (mutex/, waitgroup/, once-do/)
- [x] `go test -v -race ./golang/concurrency/sync-pkg/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-4-sync-패키지/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 4)
- [x] 본문 작성: Race Condition, WaitGroup, Mutex, RWMutex, Once, sync.Map
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 블로그 빌드 확인
- [x] 테스트 재확인 (벤치마크 포함)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 5편: Context 패키지

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/context/` 디렉토리 생성
- [x] `cancel_test.go` 작성 - WithCancel, Done() 채널
- [x] `timeout_test.go` 작성 - WithTimeout, WithDeadline
- [x] `value_test.go` 작성 - WithValue, key 타입 정의
- [x] `propagation_test.go` 작성 - parent→child 전파 체인
- [x] `go test -v -race ./golang/concurrency/context/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-5-context-완벽-가이드/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 5)
- [x] 본문 작성: Context 개념, Cancel, Timeout, Value, 전파 규칙
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 테스트 재확인 (race detector 포함)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 6편: Concurrency Patterns

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/patterns/` 디렉토리 생성
- [x] `worker_pool_test.go` 작성 - Worker Pool (job → workers → result)
- [x] `pipeline_test.go` 작성 - Pipeline 스테이지 체이닝
- [x] `semaphore_test.go` 작성 - buffered channel 세마포어
- [x] `rate_limit_test.go` 작성 - Ticker, token bucket
- [x] `pubsub_test.go` 작성 - channel 기반 Pub/Sub
- [x] `go test -v -race ./golang/concurrency/patterns/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-6-동시성-패턴-실전/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 6)
- [x] 본문 작성: Worker Pool, Pipeline, Semaphore, Rate Limiting, Pub/Sub
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 테스트 재확인 (race detector 포함)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 7편: Error Handling in Concurrency

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/errhandling/` 디렉토리 생성
- [x] `error_channel_test.go` 작성 - Result{Value, Err} struct channel
- [x] `errgroup_test.go` 작성 - errgroup.Group, WithContext, SetLimit
- [x] `go test -v -race ./golang/concurrency/errhandling/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-7-에러-처리-전략/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 7)
- [x] 본문 작성: Error 전달 문제, Error Channel, errgroup, Multi-error
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 테스트 재확인 (race detector 포함)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 8편: Memory Model과 Atomic

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/memory-model/` 디렉토리 생성
- [x] `visibility_test.go` 작성 - 공유 변수 visibility 문제
- [x] `atomic_test.go` 작성 - atomic.Int64, Bool, Value, CAS
- [x] `bench_test.go` 작성 - atomic vs mutex 벤치마크
- [x] `go test -v -race ./golang/concurrency/memory-model/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-8-memory-model과-atomic/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 8)
- [x] 본문 작성: Memory Model, Happens-before, Visibility, Atomic, 벤치마크
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 테스트 재확인 (벤치마크 포함)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 9편: Debugging과 Race Detector

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/debugging/` 디렉토리 생성
- [x] `race_test.go` 작성 - race condition 생성 + 수정 버전
- [x] `deadlock_test.go` 작성 - deadlock 재현 + 수정 패턴
- [x] `goroutine_dump_test.go` 작성 - runtime.Stack() 덤프
- [x] `go test -v -race ./golang/concurrency/debugging/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-9-debugging과-race-detector/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 9)
- [x] 본문 작성: Race Detector, Goroutine Dump, Deadlock, pprof
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 테스트 재확인

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성

---

## 10편: 실전 프로젝트 + Best Practices

### Phase 1: 샘플 코드
- [x] `tutorials-go/golang/concurrency/project/crawler/` 디렉토리 생성
- [x] `crawler.go` 작성 - Crawler 구조체 (Worker Pool + Rate Limiter + Context)
- [x] `crawler_test.go` 작성 - httptest.Server 기반 테스트
- [x] `tutorials-go/golang/concurrency/project/shutdown/` 디렉토리 생성
- [x] `server.go` 작성 - Graceful Shutdown 서버
- [x] `server_test.go` 작성 - shutdown 테스트
- [x] `go test -v -race ./golang/concurrency/project/...` 테스트 통과

### Phase 2: 블로그 포스트
- [x] `blog-v2.advenoh.pe.kr/contents/go/golang-concurrency-10-실전-프로젝트와-best-practices/index.md` 생성
- [x] frontmatter 작성 (seriesOrder: 10)
- [x] 본문 작성: Crawler 프로젝트, Graceful Shutdown, Best Practices
- [x] 인코딩 확인

### Phase 3: 검증
- [x] 전체 concurrency 테스트 확인 (`go test -race ./golang/concurrency/...`)

### Phase 4: PR
- [ ] feature 브랜치 생성 및 PR 생성
