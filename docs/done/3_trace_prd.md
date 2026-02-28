# Go Concurrency Visualization & Tracing 블로그 PRD

## 개요

Go의 동시성 코드를 **시각화하고 분석**하는 도구들을 스터디하면서 블로그로 정리한다.
`go tool trace`, Flight Recorder, GODEBUG 스케줄러 트레이싱, 서드파티 시각화 도구를 다룬다.

**목표 독자**: Go 동시성 코드를 작성해본 경험이 있고, 내부 동작을 눈으로 확인하고 싶은 개발자

---

## 블로그 글 정보

- **폴더**: `docs/start/golang-concurrency-시각화-go-tool-trace-완벽-가이드/index.md`
- **제목**: "Go Concurrency 시각화 - go tool trace 완벽 가이드"
- **시리즈**: `"Golang Concurrency"` (기존 시리즈 연장)
- **태그**: golang, go, concurrency, trace, visualization, go-tool-trace, flight-recorder, pprof, 시각화, 트레이싱
- **카테고리 폴더**: `contents/go/`

### Frontmatter

```yaml
---
title: "Go Concurrency 시각화 - go tool trace 완벽 가이드"
description: "go tool trace, Flight Recorder, GODEBUG schedtrace 등 Go 동시성 코드를 시각화하고 분석하는 도구를 실습과 함께 정리합니다."
date: 2026-03-XX
update: 2026-03-XX
tags:
  - golang
  - go
  - concurrency
  - trace
  - visualization
  - go-tool-trace
  - flight-recorder
  - pprof
  - 시각화
  - 트레이싱
series: "Golang Concurrency"
---
```

---

## 목차 구성

### 1. 왜 동시성 코드를 시각화해야 하는가

- 동시성 버그는 재현이 어렵고 로그만으로는 인과관계 파악이 힘듦
- `fmt.Println` 디버깅의 한계 (순서 보장 안 됨, Heisenbug)
- 도구별 역할 비교표

| 도구 | 유형 | 용도 | 오버헤드 |
|------|------|------|---------|
| `go tool trace` | 내장 | 전체 타임라인, GC, blocking 분석 | 1-2% CPU (Go 1.21+) |
| `GODEBUG=schedtrace` | 내장 | 스케줄러 상태 빠른 확인 | 거의 없음 |
| `gotraceui` | 서드파티 | 대용량 trace, 상세 goroutine 분석 | 없음 (뷰어) |
| `divan/gotrace` | 서드파티 | 교육용 3D 시각화 | 높음 |
| Flight Recorder | 내장 (Go 1.25) | 프로덕션 이상 징후 캡처 | 메모리 2-10 MB/s |

### 2. go tool trace 기본 사용법

- `runtime/trace` 패키지 소개
- trace 수집 3가지 방법:
  1. 코드에 직접 삽입 (`trace.Start` / `trace.Stop`)
  2. `go test -trace=trace.out`
  3. HTTP endpoint (`net/http/pprof`)
- `go tool trace trace.out` 으로 브라우저에서 열기
- 실습: 간단한 goroutine + channel 프로그램 trace 수집

### 3. go tool trace 핵심 뷰 해석

- **View Trace (타임라인)**
  - Heap row: 메모리 할당 패턴
  - Goroutines row: running vs runnable 개수 (runnable 높으면 스케줄링 경합)
  - OS Threads row: 활성 스레드, syscall 블로킹
  - PROCS rows: P별 goroutine 실행, GC 이벤트
- **Goroutine Analysis**: goroutine 유형별 시간 분포 (Network wait, Sync block, Scheduler wait 등)
- **Blocking Profiles**: Network / Synchronization / Syscall blocking (pprof 스타일)
- **Scheduler Latency Profile**: 스케줄러 대기 시간
- 실습: Worker Pool 패턴 trace → 각 뷰에서 어떻게 보이는지 스크린샷 + 해석

### 4. User-Defined Tasks와 Regions

- **Task**: 여러 goroutine에 걸친 논리적 작업 단위
  - `trace.NewTask(ctx, "taskName")` / `task.End()`
  - trace에서 task별 latency 히스토그램 확인
- **Region**: 단일 goroutine 내의 구간 측정
  - `trace.WithRegion(ctx, "regionName", func() { ... })`
  - `trace.StartRegion(ctx, "regionName")` / `region.End()`
  - 중첩(nested) 가능
- **Log**: 이벤트 마킹
  - `trace.Log(ctx, "key", "value")`
- 실습: HTTP 핸들러에 Task/Region 적용 → trace에서 확인

### 5. GODEBUG 스케줄러 트레이싱

- `GODEBUG=schedtrace=1000` 출력 해석
  - `gomaxprocs`, `idleprocs`, `threads`, `spinningthreads`, `runqueue`, `[P별 로컬 큐]`
- `GODEBUG=schedtrace=1000,scheddetail=1` 상세 출력
  - P(Processor) / M(Machine) / G(Goroutine) 각 라인 해석
  - Goroutine 상태 코드: `_Grunnable(1)`, `_Grunning(2)`, `_Gsyscall(3)`, `_Gwaiting(4)`
- 언제 사용하나: 빠르게 스케줄러 매크로 상태를 확인하고 싶을 때
- 실습: goroutine 수백 개 생성 → schedtrace로 큐 상태 관찰

### 6. Flight Recorder (Go 1.25)

- 개념: 항상 돌아가는 블랙박스 레코더 (링 버퍼)
- Go trace 발전사:
  - Go 1.21: 오버헤드 10-20% → 1-2%로 감소
  - Go 1.22: 새 trace 포맷 (파티셔닝, 스트리밍, per-M 배치)
  - Go 1.25: `runtime/trace.FlightRecorder` 정식 포함
- API 사용법:

```go
fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
    MinAge:   200 * time.Millisecond,
    MaxBytes: 1 << 20, // 1 MiB
})
fr.Start()
defer fr.Stop()

// 이상 징후 감지 시 스냅샷 저장
if latency > threshold {
    f, _ := os.Create("snapshot.trace")
    fr.WriteTo(f)
    f.Close()
}
```

- `MinAge` / `MaxBytes` 설정 가이드
- 활용 시나리오: 프로덕션 tail latency 디버깅, 간헐적 장애 분석
- 실습: HTTP 서버에 Flight Recorder 적용 → 느린 요청 발생 시 자동 캡처

### 7. 서드파티 시각화 도구

#### gotraceui (dominikh/gotraceui)

- `go tool trace` 대안 네이티브 GUI 뷰어 (Gio 프레임워크)
- 장점:
  - Chrome 의존성 없음
  - 대용량 trace 효율적 처리
  - per-goroutine 타임라인, 히트맵, 플레임 그래프
  - CPU 샘플 오버레이
- 설치: `go install honnef.co/go/gotraceui/cmd/gotraceui@latest`
- 메모리 요구: trace 파일 크기의 약 30배

#### divan/gotrace (교육용 3D 시각화)

- WebGL 기반 3D 애니메이션으로 goroutine/channel 통신 시각화
- 파란 선 = goroutine, 빨간 화살표 = channel 메시지
- 교육 목적에 적합 (fan-in/fan-out 패턴 직관적 이해)
- 제한: 짧은 프로그램만 적합, 유지보수 중단 상태

### 8. pprof와 trace 조합 활용

- **pprof**: "무엇이 리소스를 소비하는가?" (샘플링, 통계적)
- **trace**: "무슨 일이 어떤 순서로 일어났는가?" (정확, 인과관계, 비샘플링)
- 워크플로우:
  1. pprof로 CPU/메모리 핫스팟 식별
  2. trace로 해당 구간의 동시성/타이밍 분석
  3. 인사이트 결합 → 최적화 타겟 결정
- trace가 pprof보다 우월한 경우:
  - goroutine 간 mutex 경합
  - 스케줄링 latency (runnable이지만 P 대기)
  - GC pause가 goroutine 실행에 미치는 영향
  - Channel 통신 패턴과 deadlock

### 9. 실전 예제: Concurrent Web Crawler 트레이싱

- 기존 Concurrency 시리즈의 Worker Pool + Pipeline 코드 활용
- 단계별 트레이싱:
  1. trace 수집 코드 추가
  2. Task/Region으로 크롤링 단계 annotate
  3. trace 분석: goroutine 활용률, blocking 원인, 스케줄링 효율
  4. 병목 발견 → 최적화 → 재분석 비교

---

## 샘플 코드 구성

### 디렉토리 구조

```
tutorials-go/golang/concurrency/trace/
├── basic_trace_test.go          # trace 기본 수집 + 분석
├── task_region_test.go          # User-defined Task/Region 예제
├── schedtrace_test.go           # GODEBUG schedtrace 출력 예제
├── flight_recorder_test.go      # Flight Recorder 예제 (Go 1.25)
├── pprof_trace_combo_test.go    # pprof + trace 조합 예제
└── crawler_trace_test.go        # 실전 크롤러 트레이싱
```

### 테스트 파일 규칙

- testify/suite 패턴 (기존 코드 스타일 준수)
- 한국어 주석으로 교육적 설명
- 각 테스트는 `trace.out` 파일 생성 → `go tool trace`로 확인 가능하도록

---

## 작업 순서

### Phase 1: 샘플 코드 작성
1. `tutorials-go/golang/concurrency/trace/` 디렉토리 생성
2. 각 테스트 파일 작성
3. `go test -v -race ./golang/concurrency/trace/...` 테스트 통과 확인
4. 각 예제의 trace 파일 생성 확인

### Phase 2: 블로그 포스트 작성
5. `docs/start/golang-concurrency-시각화-go-tool-trace-완벽-가이드/index.md` 생성
6. frontmatter 작성
7. 본문 작성 (개념 설명 + 코드 예제 인라인)
8. `go tool trace` / gotraceui 스크린샷 포함
9. 인코딩 확인 (`file -I`)

### Phase 3: 검증
10. 블로그 빌드 확인 (`npm run build`)
11. 테스트 재확인

### Phase 4: PR 생성
12. feature 브랜치: `docs/{issue-number}-golang-concurrency-trace`
13. PR 생성 및 리뷰 요청

---

## 참고 자료

- [More powerful Go execution traces (Go Blog, 2024)](https://go.dev/blog/execution-traces-2024)
- [Flight Recorder in Go 1.25 (Go Blog)](https://go.dev/blog/flight-recorder)
- [runtime/trace 공식 문서](https://pkg.go.dev/runtime/trace)
- [Execution tracer overhaul design proposal (#60773)](https://go.googlesource.com/proposal/+/ac09a140c3d26f8bb62cbad8969c8b154f93ead6/design/60773-execution-tracer-overhaul.md)
- [Scheduler Tracing In Go (Ardan Labs)](https://www.ardanlabs.com/blog/2015/02/scheduler-tracing-in-go.html)
- [gotraceui (GitHub)](https://github.com/dominikh/gotraceui)
- [divan/gotrace (GitHub)](https://github.com/divan/gotrace)
- [Visualizing Concurrency in Go (divan blog)](https://divan.dev/posts/go_concurrency_visualize/)
- [Go execution tracer (Gopher Academy)](https://blog.gopheracademy.com/advent-2017/go-execution-tracer/)
- 도서: "Concurrency in Go" (Katherine Cox-Buday, O'Reilly)
