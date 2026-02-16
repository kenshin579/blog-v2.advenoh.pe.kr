# Go pprof를 활용한 프로파일링 블로그 PRD

## 개요

Go 프로그램의 성능 문제를 진단하고 최적화하기 위한 pprof 프로파일링 기법을 정리한 기술 블로그 포스트를 작성한다.
CPU, 메모리, 고루틴, 블로킹, 뮤텍스 등 다양한 프로파일 유형을 다루며, 실무에서 바로 활용할 수 있는 실전 예제를 포함한다.
샘플 코드는 `tutorials-go/golang/profiling/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/contents/go/`에 작성한다.

## 참고 자료

- https://pkg.go.dev/net/http/pprof
- https://pkg.go.dev/runtime/pprof
- https://go.dev/blog/pprof
- https://go.dev/doc/diagnostics
- https://github.com/google/pprof
- https://github.com/google/gops
- https://jvns.ca/blog/2017/09/24/profiling-go-with-pprof/
- https://www.practical-go-lessons.com/chap-36-program-profiling

---

## 블로그 구성

### 블로그 메타 정보

- **폴더**: `blog-v2.advenoh.pe.kr/contents/go/go-pprof-프로파일링으로-성능-문제-진단하기/index.md`
- **제목**: "Go pprof 프로파일링으로 성능 문제 진단하기 (Profiling Go Programs with pprof)"
- **태그**: golang, go, pprof, profiling, performance, cpu, memory, goroutine, heap, 프로파일링, 성능분석, 고랭

### 목차 구성

#### 1. 개요
- 프로파일링이란 무엇인가?
  - 프로그램 실행 중 자원 사용 패턴을 측정하는 기법
  - 성능 병목(bottleneck) 지점 식별
- Go에서 프로파일링이 중요한 이유
  - 고루틴/GC 등 Go 런타임 고유 특성
  - 프로덕션에서도 안전하게 사용 가능한 저오버헤드 프로파일링
- pprof 도구 소개
  - `runtime/pprof` vs `net/http/pprof` 차이점
  - Go 표준 라이브러리에 내장된 프로파일링 지원

#### 2. pprof 기본 설정

##### 2.1 net/http/pprof - HTTP 엔드포인트 방식
- `import _ "net/http/pprof"` 한 줄로 활성화
- `localhost:6060/debug/pprof/` 엔드포인트 목록 설명
- 코드 예제: 기본 HTTP 서버에 pprof 추가
- 실행 중인 프로그램에 접속하여 실시간 프로파일링

##### 2.2 runtime/pprof - 파일 출력 방식
- `pprof.StartCPUProfile()` / `pprof.StopCPUProfile()`
- `pprof.WriteHeapProfile()`
- CLI 프로그램이나 배치 작업에 적합
- 코드 예제: 프로파일 결과를 파일로 저장

##### 2.3 go test -bench와 함께 사용
- `go test -bench=. -cpuprofile=cpu.prof`
- `go test -bench=. -memprofile=mem.prof`
- 벤치마크 테스트에서 프로파일링 데이터 수집

#### 3. 프로파일 유형별 분석

##### 3.1 CPU 프로파일 (cpu)
- CPU 시간을 많이 소비하는 함수 식별
- 수집 방법: `go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30`
- 코드 예제: CPU 집약적인 작업 (무한 루프, 연산 반복)
- 분석 예시: `top`, `list`, `web` 명령어로 핫스팟 확인

##### 3.2 힙 메모리 프로파일 (heap)
- 현재 메모리 할당 상태 확인
- `inuse_space` vs `alloc_space` 차이
  - `inuse_space`: 현재 사용 중인 메모리 (메모리 누수 탐지)
  - `alloc_space`: 총 할당된 메모리 (할당 빈도 분석)
- 수집 방법: `go tool pprof http://localhost:6060/debug/pprof/heap`
- 코드 예제: 메모리 누수 시나리오 (슬라이스 무한 append)

##### 3.3 고루틴 프로파일 (goroutine)
- 실행 중인 고루틴 스택 트레이스 확인
- 고루틴 누수(leak) 탐지
- 수집 방법: `go tool pprof http://localhost:6060/debug/pprof/goroutine`
- `debug=2` 파라미터로 전체 스택 덤프 확인

##### 3.4 블로킹 프로파일 (block)
- 고루틴이 대기(blocking) 상태에 머무는 시간 분석
- `runtime.SetBlockProfileRate(1)` 활성화 필요
- 채널 대기, sync.Mutex 대기 등 감지
- 코드 예제: 채널 블로킹 상황 재현 및 분석

##### 3.5 뮤텍스 프로파일 (mutex)
- Mutex 경합(contention) 분석
- `runtime.SetMutexProfileFraction(1)` 활성화 필요
- 여러 고루틴이 같은 뮤텍스를 두고 경쟁하는 상황 감지
- 코드 예제: 다수 고루틴의 뮤텍스 경합

##### 3.6 스레드 생성 프로파일 (threadcreate)
- OS 스레드 생성 패턴 확인
- 과도한 스레드 생성 감지

#### 4. pprof 분석 도구 활용법

##### 4.1 go tool pprof CLI 인터랙티브 모드
- 주요 명령어 정리
  - `top` / `top10`: 상위 리소스 소비 함수
  - `list <함수명>`: 소스코드 라인별 프로파일 정보
  - `tree`: 호출 트리 형태로 표시
  - `web`: 콜 그래프를 브라우저에서 시각화 (Graphviz 필요)
  - `peek <함수명>`: 특정 함수의 호출자/피호출자 확인
- `cum` vs `flat` 차이
  - `flat`: 해당 함수 자체에서 소비한 시간
  - `cum`: 해당 함수 + 호출한 하위 함수까지 포함한 시간

##### 4.2 웹 UI 시각화
- `go tool pprof -http=:8080 cpu.prof`
- 브라우저 기반 인터랙티브 분석
  - Graph 뷰: 콜 그래프 시각화 (노드 크기 = 리소스 소비량)
  - Flame Graph: 플레임 그래프로 계층적 호출 관계 파악
  - Top 뷰: 함수별 리소스 소비 랭킹
  - Source 뷰: 소스코드 라인별 프로파일링 결과
- 스크린샷 포함하여 각 뷰 설명

##### 4.3 Flame Graph (플레임 그래프) 읽는 법
- X축: 샘플 수 (시간 비율)
- Y축: 콜 스택 깊이
- 넓은 블록 = 많은 시간 소비
- 실제 예제로 플레임 그래프 해석 방법 설명

#### 5. 실전 예제: 성능 문제 진단 워크플로우

##### 5.1 시나리오: CPU 병목 진단
- 문제 상황 설정 (느린 API 응답)
- pprof로 CPU 프로파일 수집
- top → list → web 순서로 원인 분석
- 최적화 전후 비교

##### 5.2 시나리오: 메모리 누수 진단
- 문제 상황 설정 (메모리 사용량 지속 증가)
- heap 프로파일 비교 (`-base` 옵션으로 diff)
- `inuse_space`로 누수 지점 식별
- 최적화 전후 비교

##### 5.3 시나리오: 고루틴 누수 진단
- 문제 상황 설정 (고루틴 수 지속 증가)
- goroutine 프로파일로 스택 트레이스 확인
- 누수 원인 식별 (닫히지 않는 채널, context 미사용)

#### 6. Echo 프레임워크와 pprof 통합
- echo-pprof 라이브러리 활용
- 프로덕션 서버에서 안전하게 pprof 엔드포인트 노출
- 별도 포트로 분리하여 보안 확보
- 코드 예제: Echo 서버에 pprof 통합

#### 7. 유용한 보조 도구

##### 7.1 gops
- 실행 중인 Go 프로세스 목록 확인
- 프로세스별 GC 통계, 고루틴 수 등 모니터링
- `gops <pid>`: 프로세스 정보 조회

##### 7.2 trace
- `go tool trace`로 실행 흐름 추적
- 고루틴 스케줄링, GC 이벤트, 네트워크/시스템 콜 시각화
- `runtime/trace` 패키지 사용법

##### 7.3 benchstat
- 벤치마크 결과 비교 도구
- 최적화 전후 성능 변화 통계적 비교

#### 8. 프로덕션 환경에서의 pprof 사용 팁
- pprof의 오버헤드: CPU 프로파일링 약 5% 성능 영향
- 보안: 별도 포트 + 인증 미들웨어로 보호
- 지속적 프로파일링 (Continuous Profiling)
  - Google Cloud Profiler, Pyroscope 등
- 프로파일 데이터 저장 및 비교 전략

#### 9. 정리
- 프로파일 유형별 사용 시나리오 요약 표
- 진단 워크플로우 플로우차트
- 추가 학습 자료 및 참고 링크

---

## 기존 샘플 코드 활용

### 이미 작성된 예제 (`tutorials-go/golang/profiling/`)

| 디렉토리 | 설명 | 활용 섹션 |
|----------|------|----------|
| `pprof/main.go` | 기본 pprof + 메모리 누수 예제 | 2.1, 3.2, 5.2 |
| `profiling-examples/main.go` | CPU/메모리/블록/뮤텍스/스레드 종합 예제 | 3.1~3.6, 5.1 |
| `profiling-examples/pkg/cpu/` | CPU 집약적 연산 | 3.1 |
| `profiling-examples/pkg/memory/` | 메모리 할당 | 3.2 |
| `profiling-examples/pkg/block/` | 블로킹 I/O | 3.4 |
| `profiling-examples/pkg/mutex/` | 뮤텍스 경합 | 3.5 |
| `profiling-examples/pkg/threadcreate/` | 대량 고루틴 생성 | 3.6 |
| `echo/main.go` | Echo 프레임워크 pprof 통합 | 6 |

### 추가 작성이 필요한 코드

| 파일 | 설명 | 활용 섹션 |
|------|------|----------|
| `runtime-pprof/main.go` | runtime/pprof 파일 출력 방식 예제 | 2.2 |
| `benchmark/bench_test.go` | go test -bench 프로파일링 예제 | 2.3 |
| `goroutine-leak/main.go` | 고루틴 누수 진단 예제 | 3.3, 5.3 |
| `trace-example/main.go` | go tool trace 예제 | 7.2 |

---

## 작업 순서

### Phase 1: 스터디 및 자료 조사
1. Go 공식 문서 및 참고 자료 학습
2. 기존 예제 코드 실행하여 pprof 동작 확인
3. 각 프로파일 유형별 실습 및 스크린샷 수집

### Phase 2: 추가 샘플 코드 작성
4. `runtime-pprof/main.go` 작성 (파일 출력 방식)
5. `benchmark/bench_test.go` 작성 (벤치마크 프로파일링)
6. `goroutine-leak/main.go` 작성 (고루틴 누수 예제)
7. `trace-example/main.go` 작성 (trace 예제)
8. 전체 빌드 및 실행 확인

### Phase 3: 블로그 포스트 작성
9. frontmatter 작성 (title, description, date, update, tags)
10. 목차 순서대로 본문 작성
11. 스크린샷 및 코드 예제 인라인 포함
12. 인코딩 확인 (`file -I`)

### Phase 4: 검증
13. 블로그 빌드 확인 (`npm run build`)
14. 예제 코드 빌드 확인 (`go build ./...`)

---

## 프로파일 유형 요약

| 프로파일 유형 | 엔드포인트 | 용도 | 활성화 설정 |
|-------------|-----------|------|------------|
| CPU | `/debug/pprof/profile` | CPU 시간 소비 함수 분석 | 기본 활성화 |
| Heap | `/debug/pprof/heap` | 메모리 할당/사용 분석 | 기본 활성화 |
| Goroutine | `/debug/pprof/goroutine` | 고루틴 스택 트레이스 | 기본 활성화 |
| Allocs | `/debug/pprof/allocs` | 메모리 할당 빈도 분석 | 기본 활성화 |
| Block | `/debug/pprof/block` | 블로킹 대기 시간 분석 | `SetBlockProfileRate(1)` |
| Mutex | `/debug/pprof/mutex` | 뮤텍스 경합 분석 | `SetMutexProfileFraction(1)` |
| Threadcreate | `/debug/pprof/threadcreate` | OS 스레드 생성 분석 | 기본 활성화 |
| Trace | `/debug/pprof/trace` | 실행 흐름 추적 | 기본 활성화 |

## pprof CLI 주요 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `top [N]` | 상위 N개 리소스 소비 함수 |
| `list <func>` | 함수 소스코드 라인별 프로파일 |
| `tree` | 호출 트리 표시 |
| `web` | 콜 그래프 브라우저 시각화 |
| `peek <func>` | 호출자/피호출자 확인 |
| `disasm <func>` | 어셈블리 수준 프로파일 |
| `svg` | SVG 파일로 콜 그래프 저장 |
| `png` | PNG 이미지로 콜 그래프 저장 |
