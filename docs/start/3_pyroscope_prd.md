# PRD: Grafana Pyroscope를 활용한 Go 애플리케이션 Continuous Profiling

## 1. 개요

### 배경
Go Concurrency 시리즈의 후속 편으로, 프로덕션 환경에서 Go 애플리케이션의 성능을 지속적으로 모니터링하고 최적화하는 방법을 다룬다. Grafana Pyroscope는 continuous profiling을 위한 오픈소스 플랫폼으로, 기존 pprof 기반 프로파일링의 한계를 넘어 **상시 프로파일링 데이터 수집·저장·시각화**를 제공한다.

### 목표
- Grafana Pyroscope의 개념과 아키텍처를 이해한다
- Go 애플리케이션에 Pyroscope SDK를 통합하는 방법을 실습한다
- Flame Graph를 통한 성능 병목 분석 방법을 익힌다
- Docker Compose 기반 로컬 환경에서 Pyroscope + Grafana를 구축한다

### 대상 독자
- Go 개발자 (기본 pprof 사용 경험이 있으면 이해하기 쉬움)
- 백엔드 성능 최적화에 관심 있는 개발자
- Observability(관측 가능성) 도구를 도입하려는 팀

---

## 2. Continuous Profiling이란?

### 2.1 전통적 프로파일링 vs Continuous Profiling

| 구분 | 전통적 프로파일링 | Continuous Profiling |
|------|-------------------|---------------------|
| 수집 시점 | 개발/디버깅 시 수동 실행 | 프로덕션에서 상시 자동 수집 |
| 오버헤드 | 높음 (개발 환경에서만 사용) | 낮음 (~2-5% CPU) |
| 데이터 범위 | 특정 시점 스냅샷 | 시간 경과에 따른 연속 데이터 |
| 분석 방식 | 사후 분석 (reactive) | 사전 예방적 분석 (proactive) |
| 저장 | 로컬 파일 | 중앙 집중 DB (장기 보관) |

### 2.2 왜 Continuous Profiling이 필요한가?

- **코드 레벨 인사이트**: 함수 단위로 리소스 사용량 파악 가능
- **Observability 완성**: Metrics, Logs, Traces에 이어 4번째 신호(signal)
- **비용 절감**: 비효율적인 코드 식별 → 클라우드 인프라 비용 감소
- **MTTR 단축**: 성능 이슈 발생 시 즉시 원인 파악 가능

### 2.3 프로파일 유형 (Go 기준)

| 프로파일 유형 | 설명 | Go 관련 |
|--------------|------|---------|
| CPU | 함수별 CPU 사용 시간 | `runtime/pprof` |
| Heap (Alloc) | 메모리 할당량/사용량 | `runtime.MemProfileRate` |
| Goroutine | 활성 고루틴 수 및 스택 | `runtime.NumGoroutine()` |
| Mutex | 뮤텍스 경합 시간/횟수 | `runtime.SetMutexProfileFraction()` |
| Block | 블로킹 대기 시간/횟수 | `runtime.SetBlockProfileRate()` |

---

## 3. Grafana Pyroscope 아키텍처

### 3.1 핵심 컴포넌트

```
Client (SDK/Alloy)  →  Distributor  →  Ingester  →  Object Storage
                                                         ↓
Grafana UI  ←  Query Frontend  ←  Querier  ←  Store Gateway
```

| 컴포넌트 | 역할 |
|----------|------|
| **Distributor** | 클라이언트로부터 프로파일 데이터 수신 및 라우팅 |
| **Ingester** | 프로파일 데이터를 메모리에 임시 저장 후 스토리지에 쓰기 |
| **Querier** | 프로파일 데이터 조회 및 처리 |
| **Query Frontend** | 쿼리 캐싱 및 최적화 |
| **Query Scheduler** | 쿼리 큐 분배 관리 |
| **Store Gateway** | 장기 저장소(Object Storage) 접근 |
| **Compactor** | 데이터 압축 및 정리 |

### 3.2 배포 모드

- **Monolithic**: 단일 프로세스로 모든 컴포넌트 실행 (개발/소규모 환경)
- **Microservices**: 컴포넌트별 독립 배포 (대규모 프로덕션 환경)

### 3.3 데이터 수집 방식

1. **Push 모드 (SDK)**: 애플리케이션에 SDK 내장 → Pyroscope 서버로 직접 전송
   - `github.com/grafana/pyroscope-go` Go SDK 사용
2. **Pull 모드 (Alloy)**: Grafana Alloy가 pprof 엔드포인트를 주기적으로 스크래핑
   - 기존 pprof HTTP 엔드포인트 활용 가능

---

## 4. Flame Graph 이해하기

### 4.1 Flame Graph란?

- 프로파일링 데이터를 **스택 트레이스 기반**으로 시각화한 그래프
- **가로축**: 전체 시간 대비 해당 함수가 차지하는 비율 (넓을수록 많은 리소스 사용)
- **세로축**: 함수 호출 계층 (위→아래로 호출 깊어짐)
- 루트 노드 = 전체 애플리케이션 시간의 100%

### 4.2 Flame Graph 읽는 법

```
[          root (100%)           ]
[    funcA (60%)   ][ funcB (40%)]
[ funcC (30%) ][funcD(30%)]
```

- **넓은 블록** = 성능 병목 후보 (해당 함수에서 많은 시간 소비)
- **깊은 스택** = 호출 체인이 깊음 (반드시 문제는 아님)
- **Self time** vs **Total time**: 자기 자신 실행 시간 vs 하위 함수 포함 시간

### 4.3 Pyroscope에서의 Flame Graph 활용

- 시간 범위 선택으로 특정 구간 분석
- 함수 클릭으로 해당 함수 중심 필터링
- 비교(Comparison) 모드로 두 시점 간 차이 분석
- Diff 뷰로 변경 전후 성능 비교

---

## 5. 샘플 코드 구조 (tutorials-go)

### 5.1 디렉토리 구조

```
tutorials-go/golang/profiling/pyroscope/
├── docker-compose.yml          # Pyroscope + Grafana 로컬 환경
├── basic/
│   ├── main.go                 # 기본 Pyroscope SDK 연동 예제
│   └── main_test.go
├── http-server/
│   ├── main.go                 # Echo HTTP 서버 + Pyroscope 연동
│   ├── handler.go
│   └── main_test.go
├── push-vs-pull/
│   ├── push/main.go            # Push 모드 (SDK 직접 전송)
│   └── pull/main.go            # Pull 모드 (pprof 엔드포인트 + Alloy)
├── labels/
│   ├── main.go                 # Profiling Labels/Tags 활용
│   └── main_test.go
└── README.md
```

### 5.2 핵심 예제 코드

#### 5.2.1 기본 연동 (basic/main.go)

```go
package main

import (
    "log"
    "os"
    "runtime"

    "github.com/grafana/pyroscope-go"
)

func main() {
    // 뮤텍스/블로킹 프로파일 활성화
    runtime.SetMutexProfileFraction(5)
    runtime.SetBlockProfileRate(5)

    profiler, err := pyroscope.Start(pyroscope.Config{
        ApplicationName: "simple.golang.app",
        ServerAddress:   "http://localhost:4040",
        Logger:          pyroscope.StandardLogger,
        Tags:            map[string]string{"hostname": os.Getenv("HOSTNAME")},
        ProfileTypes: []pyroscope.ProfileType{
            pyroscope.ProfileCPU,
            pyroscope.ProfileAllocObjects,
            pyroscope.ProfileAllocSpace,
            pyroscope.ProfileInuseObjects,
            pyroscope.ProfileInuseSpace,
            pyroscope.ProfileGoroutines,
            pyroscope.ProfileMutexCount,
            pyroscope.ProfileMutexDuration,
            pyroscope.ProfileBlockCount,
            pyroscope.ProfileBlockDuration,
        },
    })
    if err != nil {
        log.Fatalf("pyroscope 시작 실패: %v", err)
    }
    defer profiler.Stop()

    // 부하 생성 로직...
}
```

#### 5.2.2 Profiling Labels 활용 (labels/main.go)

```go
// 특정 코드 경로별 프로파일링 데이터 태깅
pyroscope.TagWrapper(context.Background(),
    pyroscope.Labels("endpoint", "/api/users"),
    func(c context.Context) {
        handleUsers(c)
    })

pyroscope.TagWrapper(context.Background(),
    pyroscope.Labels("endpoint", "/api/orders"),
    func(c context.Context) {
        handleOrders(c)
    })
```

#### 5.2.3 HTTP 서버 연동 (http-server/main.go)

```go
// Echo 프레임워크 + Pyroscope 연동
func main() {
    // Pyroscope 초기화
    profiler, _ := pyroscope.Start(pyroscope.Config{
        ApplicationName: "echo.server",
        ServerAddress:   "http://localhost:4040",
        ProfileTypes: []pyroscope.ProfileType{
            pyroscope.ProfileCPU,
            pyroscope.ProfileAllocObjects,
            pyroscope.ProfileAllocSpace,
            pyroscope.ProfileInuseObjects,
            pyroscope.ProfileInuseSpace,
        },
    })
    defer profiler.Stop()

    e := echo.New()
    e.GET("/fast", handleFast)
    e.GET("/slow", handleSlow)      // 의도적으로 CPU 부하 유발
    e.GET("/memory", handleMemory)  // 의도적으로 메모리 할당
    e.Logger.Fatal(e.Start(":8080"))
}
```

### 5.3 Docker Compose 환경

```yaml
# docker-compose.yml
version: "3.8"

services:
  pyroscope:
    image: grafana/pyroscope:latest
    ports:
      - "4040:4040"
    networks:
      - pyroscope-net

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_INSTALL_PLUGINS=grafana-pyroscope-app
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - pyroscope
    networks:
      - pyroscope-net

  app:
    build: ./basic
    depends_on:
      - pyroscope
    environment:
      - PYROSCOPE_SERVER=http://pyroscope:4040
    networks:
      - pyroscope-net

networks:
  pyroscope-net:
    driver: bridge
```

---

## 6. 블로그 글 구성안

### 제목 (안)
- `Grafana Pyroscope로 Go 애플리케이션 Continuous Profiling 시작하기`
- `Go 프로파일링 완전 정복: Grafana Pyroscope와 Flame Graph`

### 태그
```yaml
tags:
  - golang
  - profiling
  - pyroscope
  - grafana
  - continuous-profiling
  - flame-graph
  - observability
  - performance
  - pprof
```

### 목차 구성

```
# 1. 들어가며
  - pprof의 한계 → Continuous Profiling의 필요성
  - Pyroscope 소개

# 2. Continuous Profiling이란?
  ## 2.1 전통적 프로파일링 vs Continuous Profiling
  ## 2.2 프로파일 유형 (CPU, Memory, Goroutine, Mutex, Block)

# 3. Grafana Pyroscope 아키텍처
  ## 3.1 핵심 컴포넌트
  ## 3.2 데이터 수집 방식 (Push vs Pull)

# 4. 로컬 환경 구축
  ## 4.1 Docker Compose로 Pyroscope + Grafana 실행
  ## 4.2 Grafana에서 Pyroscope 데이터소스 연결

# 5. Go SDK 연동
  ## 5.1 기본 설정
  ## 5.2 프로파일 유형 선택
  ## 5.3 뮤텍스/블로킹 프로파일 활성화

# 6. Profiling Labels로 세밀한 분석
  ## 6.1 TagWrapper 사용법
  ## 6.2 엔드포인트별 프로파일링

# 7. Flame Graph 분석
  ## 7.1 Flame Graph 읽는 법
  ## 7.2 성능 병목 찾기 실습
  ## 7.3 비교 뷰 활용

# 8. 실전 팁
  ## 8.1 프로덕션 적용 시 주의사항
  ## 8.2 오버헤드 최소화 전략
  ## 8.3 기존 pprof 코드와의 공존

# 9. 마무리

# 10. 참고
```

---

## 7. 블로그 글 작성 위치

```
blog-v2.advenoh.pe.kr/contents/go/
  grafana-pyroscope로-go-애플리케이션-continuous-profiling-시작하기/
    index.md
    (스크린샷 이미지들)
```

---

## 8. 작업 항목

> 상세 체크리스트는 `3_pyroscope_todo.md` 참조

---

## 9. 참고 자료

- [Grafana Pyroscope 공식 문서](https://grafana.com/docs/pyroscope/latest/)
- [Pyroscope Go SDK (Push 모드)](https://grafana.com/docs/pyroscope/latest/configure-client/language-sdks/go_push/)
- [Pyroscope GitHub 저장소](https://github.com/grafana/pyroscope)
- [pyroscope-go Go 클라이언트](https://github.com/grafana/pyroscope-go)
- [Continuous Profiling이란?](https://grafana.com/docs/pyroscope/latest/introduction/continuous-profiling/)
- [Flame Graph 가이드](https://grafana.com/docs/pyroscope/latest/introduction/flamegraphs/)
- [Pyroscope 아키텍처](https://grafana.com/docs/pyroscope/latest/reference-pyroscope-architecture/)
- [Pyroscope Getting Started](https://grafana.com/docs/pyroscope/latest/get-started/)
- [Grafana Alloy (Pull 모드)](https://grafana.com/docs/pyroscope/latest/configure-client/grafana-alloy/)
- [기존 pprof 프로파일링 예제](https://github.com/kenshin579/tutorials-go/tree/master/golang/profiling/profiling-examples)

---

## 10. 논의 사항

### 논의 1: 블로그 글 범위
- **Option A**: Pyroscope 개념 + SDK 연동 + Flame Graph 분석까지 한 글에 담기 (~300줄)
- **Option B**: 개념편/실습편으로 2편 분리
- **추천**: Option A (한 글로 통합, 독자가 끝까지 읽고 바로 실습 가능)

### 논의 2: 샘플 코드 복잡도
- **Option A**: 기본 예제 (basic) + HTTP 서버 예제 정도로 간결하게
- **Option B**: Push/Pull 비교, Labels, 다양한 프로파일 유형까지 포괄
- **추천**: Option A로 시작하고, 필요 시 후속 글에서 확장

### 논의 3: 기존 pprof 예제와의 연결
- `tutorials-go/golang/profiling/profiling-examples/`에 이미 pprof 기반 예제 존재
- Pyroscope가 내부적으로 pprof를 사용하므로 연관성 설명 필요
- pprof → Pyroscope로의 자연스러운 전환 스토리라인 구성

### 논의 4: Pull 모드(Alloy) 포함 여부
- Push 모드(SDK)만으로도 충분한 내용
- Pull 모드는 인프라 구성이 추가되어 글이 길어질 수 있음
- **추천**: Push 모드 중심, Pull 모드는 간단히 언급만
