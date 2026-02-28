# Implementation: Grafana Pyroscope Go Continuous Profiling

## 1. 샘플 코드 구현 (tutorials-go)

### 1.1 디렉토리 구조

```
tutorials-go/golang/profiling/pyroscope/
├── docker-compose.yml              # Pyroscope + Grafana + App
├── grafana/
│   └── provisioning/
│       └── datasources/
│           └── pyroscope.yml       # Pyroscope 데이터소스 자동 설정
├── basic/
│   ├── main.go                     # 기본 SDK 연동 (부하 생성 포함)
│   ├── Dockerfile
│   └── main_test.go
├── http-server/
│   ├── main.go                     # Echo + Pyroscope 연동
│   ├── handler.go                  # /fast, /slow, /memory 핸들러
│   ├── Dockerfile
│   └── main_test.go
└── README.md
```

### 1.2 basic/main.go - 핵심 구현

**목적**: Pyroscope SDK 연동 최소 예제 + CPU/메모리/고루틴 부하 생성

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "runtime"
    "sync"
    "syscall"
    "time"

    "github.com/grafana/pyroscope-go"
)

func main() {
    runtime.SetMutexProfileFraction(5)
    runtime.SetBlockProfileRate(5)

    serverAddr := os.Getenv("PYROSCOPE_SERVER")
    if serverAddr == "" {
        serverAddr = "http://localhost:4040"
    }

    profiler, err := pyroscope.Start(pyroscope.Config{
        ApplicationName: "simple.golang.app",
        ServerAddress:   serverAddr,
        Logger:          pyroscope.StandardLogger,
        Tags:            map[string]string{"hostname": hostname()},
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

    ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
    defer cancel()

    // Labels로 구분되는 부하 생성
    go func() {
        for {
            pyroscope.TagWrapper(ctx, pyroscope.Labels("workload", "cpu"), func(c context.Context) {
                cpuWork()
            })
        }
    }()
    go func() {
        for {
            pyroscope.TagWrapper(ctx, pyroscope.Labels("workload", "memory"), func(c context.Context) {
                memoryWork()
            })
        }
    }()
    go func() {
        for {
            pyroscope.TagWrapper(ctx, pyroscope.Labels("workload", "mutex"), func(c context.Context) {
                mutexWork()
            })
        }
    }()

    log.Println("Pyroscope 프로파일링 시작 - Ctrl+C로 종료")
    <-ctx.Done()
}
```

**부하 생성 함수들** (같은 파일 또는 workload.go):
- `cpuWork()` - 피보나치 연산으로 CPU 부하
- `memoryWork()` - 슬라이스 할당으로 힙 메모리 부하
- `mutexWork()` - sync.Mutex 경합 유발

### 1.3 http-server/main.go - Echo 연동

**목적**: 실제 HTTP 서버 환경에서 엔드포인트별 프로파일링

```go
func main() {
    profiler, _ := pyroscope.Start(pyroscope.Config{
        ApplicationName: "echo.server",
        ServerAddress:   serverAddr,
        ProfileTypes:    defaultProfileTypes(),
    })
    defer profiler.Stop()

    e := echo.New()
    e.GET("/fast", handleFast)       // 빠른 응답 (기준선)
    e.GET("/slow", handleSlow)       // CPU 집약적 연산
    e.GET("/memory", handleMemory)   // 대량 메모리 할당
    e.Logger.Fatal(e.Start(":8080"))
}
```

**handler.go 핸들러들**:
- `handleFast` - 단순 JSON 응답 (비교 기준선)
- `handleSlow` - `pyroscope.TagWrapper`로 감싸서 CPU 부하 함수 호출
- `handleMemory` - `pyroscope.TagWrapper`로 감싸서 메모리 할당 함수 호출

### 1.4 Docker Compose 환경

```yaml
services:
  pyroscope:
    image: grafana/pyroscope:latest
    ports: ["4040:4040"]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on: [pyroscope]

  app:
    build: ./basic
    depends_on: [pyroscope]
    environment:
      PYROSCOPE_SERVER: http://pyroscope:4040
```

### 1.5 Grafana 데이터소스 프로비저닝

```yaml
# grafana/provisioning/datasources/pyroscope.yml
apiVersion: 1
datasources:
  - name: Pyroscope
    type: grafana-pyroscope-datasource
    url: http://pyroscope:4040
    isDefault: true
```

### 1.6 의존성

```
github.com/grafana/pyroscope-go   # Pyroscope Go SDK
github.com/labstack/echo/v4       # Echo HTTP 프레임워크 (http-server)
```

---

## 2. 블로그 글 구현

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/
  grafana-pyroscope로-go-애플리케이션-continuous-profiling-시작하기/
    index.md
```

### 2.2 Frontmatter

```yaml
---
title: "Grafana Pyroscope로 Go 애플리케이션 Continuous Profiling 시작하기"
description: "Grafana Pyroscope와 Go SDK를 활용하여 Continuous Profiling 환경을 구축하고, Flame Graph로 성능 병목을 분석하는 방법을 알아봅니다"
date: 2026-03-XX
update: 2026-03-XX
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
---
```

### 2.3 글 구조 (10개 섹션)

| # | 섹션 | 핵심 내용 |
|---|------|----------|
| 1 | 들어가며 | pprof 한계 → Continuous Profiling 필요성 |
| 2 | Continuous Profiling이란? | 전통적 vs Continuous 비교표, 프로파일 유형 |
| 3 | Grafana Pyroscope 아키텍처 | 컴포넌트 다이어그램(Mermaid), Push/Pull 모드 |
| 4 | 로컬 환경 구축 | Docker Compose 실행, Grafana 데이터소스 연결 |
| 5 | Go SDK 연동 | basic/main.go 코드 설명, 프로파일 유형 선택 |
| 6 | Profiling Labels | TagWrapper 사용법, 엔드포인트별 분류 |
| 7 | Flame Graph 분석 | 읽는 법, 병목 찾기, 비교 뷰 |
| 8 | 실전 팁 | 프로덕션 주의사항, 오버헤드, pprof 공존 |
| 9 | 마무리 | 요약, GitHub 코드 링크 |
| 10 | 참고 | 공식 문서, 레퍼런스 링크 |

### 2.4 다이어그램 규칙

- **Mermaid 형식 필수** (ASCII art 금지)
- 아키텍처 다이어그램: `flowchart LR` 사용
- Push/Pull 비교: `flowchart TD` 2개 나란히
- 노드 텍스트에 `<br/>` 사용 금지

### 2.5 필요한 스크린샷

| 스크린샷 | 설명 |
|---------|------|
| pyroscope-ui-main.png | Pyroscope 단독 UI (localhost:4040) |
| grafana-explore-flamegraph.png | Grafana Explore에서 Flame Graph 조회 |
| grafana-compare-view.png | Grafana 비교 뷰 (두 시점 비교) |
| grafana-labels-filter.png | Labels 필터링 화면 |

---

## 3. 핵심 구현 포인트

### 3.1 Pyroscope SDK 초기화 패턴

```go
// 환경변수로 서버 주소 주입 (Docker/K8s 호환)
serverAddr := os.Getenv("PYROSCOPE_SERVER")
if serverAddr == "" {
    serverAddr = "http://localhost:4040"
}

// 뮤텍스/블로킹 프로파일은 명시적 활성화 필요
runtime.SetMutexProfileFraction(5)
runtime.SetBlockProfileRate(5)
```

### 3.2 Labels(Tags) 활용 패턴

```go
// 엔드포인트별, 작업 유형별로 프로파일 데이터 분류
pyroscope.TagWrapper(ctx,
    pyroscope.Labels("endpoint", "/api/users", "method", "GET"),
    func(c context.Context) {
        // 이 블록의 프로파일 데이터에 label이 태깅됨
        handleUsers(c)
    })
```

### 3.3 graceful shutdown

```go
// signal.NotifyContext로 깔끔한 종료
ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
defer cancel()
defer profiler.Stop()  // 종료 시 마지막 프로파일 데이터 전송
```
