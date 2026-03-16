---
title: "Grafana Pyroscope로 Go 애플리케이션 Continuous Profiling 시작하기"
description: "Grafana Pyroscope로 Go 애플리케이션 Continuous Profiling 시작하기"
date: 2026-03-16
update: 2026-03-16
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
  - 고랭
  - 프로파일링
series: "Grafana 완벽 가이드"
---

# 1. 들어가며

Go에서 성능 분석을 할 때 `net/http/pprof`나 `runtime/pprof`를 주로 사용한다. 개발 환경에서 특정 시점의 CPU 사용량이나 메모리 할당을 스냅샷으로 확인하기에는 충분하지만, 프로덕션 환경에서는 몇 가지 한계가 있다.

- 문제가 발생한 **시점에 수동으로** 프로파일을 수집해야 한다
- 수집한 프로파일은 **로컬 파일**로만 남아 시간 경과에 따른 비교가 어렵다
- 여러 인스턴스에서 분산된 프로파일 데이터를 **중앙에서 관리**할 수 없다

**Continuous Profiling**은 이러한 한계를 해결한다. 프로덕션에서 상시 낮은 오버헤드로 프로파일 데이터를 수집하고, 중앙 저장소에 보관하여 언제든 과거 데이터를 조회할 수 있다.

이 글에서는 Continuous Profiling 플랫폼인 **Grafana Pyroscope**를 Go 애플리케이션에 연동하는 방법을 실습한다. **Push 모드(SDK)**와 **Pull 모드(Alloy)** 두 가지 수집 방식을 모두 다루며, Flame Graph로 성능 병목을 분석하는 과정까지 살펴본다.

> 이 글에서 사용한 전체 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/profiling/pyroscope)에서 확인할 수 있다.

# 2. Continuous Profiling 개요

## 2.1 전통적 프로파일링 vs Continuous Profiling

| 구분 | 전통적 프로파일링 | Continuous Profiling |
|------|-------------------|---------------------|
| 수집 시점 | 개발/디버깅 시 수동 실행 | 프로덕션에서 상시 자동 수집 |
| 오버헤드 | 높음 (개발 환경에서만 사용) | 낮음 (~2-5% CPU) |
| 데이터 범위 | 특정 시점 스냅샷 | 시간 경과에 따른 연속 데이터 |
| 분석 방식 | 사후 분석 (reactive) | 사전 예방적 분석 (proactive) |
| 저장 | 로컬 파일 | 중앙 집중 DB (장기 보관) |

전통적 프로파일링은 문제가 발생한 후 수동으로 데이터를 수집하는 반면, Continuous Profiling은 항상 데이터를 수집하므로 문제 발생 시점의 프로파일을 즉시 확인할 수 있다.

## 2.2 프로파일 유형 (Go 기준)

Go에서 수집할 수 있는 주요 프로파일 유형은 다음과 같다.

| 프로파일 유형 | 설명 | 활성화 방법 |
|--------------|------|------------|
| CPU | 함수별 CPU 사용 시간 | 기본 활성화 |
| Alloc (Objects/Space) | 메모리 할당 횟수/크기 | 기본 활성화 |
| Inuse (Objects/Space) | 현재 사용 중인 메모리 | 기본 활성화 |
| Goroutine | 활성 고루틴 수 및 스택 | 선택 활성화 |
| Mutex (Count/Duration) | 뮤텍스 경합 횟수/시간 | `runtime.SetMutexProfileFraction()` |
| Block (Count/Duration) | 블로킹 대기 횟수/시간 | `runtime.SetBlockProfileRate()` |

> Mutex와 Block 프로파일은 기본 비활성화이므로, 명시적으로 활성화해야 한다. Push 모드에서는 SDK 초기화 전에, Pull 모드에서는 애플리케이션 시작 시 설정한다.

# 3. Grafana Pyroscope 아키텍처

## 3.1 핵심 컴포넌트

Pyroscope는 다음과 같은 마이크로서비스 컴포넌트로 구성되며, Monolithic 모드에서는 단일 프로세스로 실행된다.

```mermaid
flowchart LR
    Client["Client\n(SDK / Alloy)"]
    Dist["Distributor"]
    Ing["Ingester"]
    Store["Object Storage"]
    QF["Query Frontend"]
    Q["Querier"]
    SG["Store Gateway"]
    UI["Grafana UI"]

    Client --> Dist --> Ing --> Store
    UI --> QF --> Q --> Ing
    Q --> SG --> Store
```

| 컴포넌트 | 역할 |
|----------|------|
| **Distributor** | 클라이언트로부터 프로파일 데이터 수신 및 라우팅 |
| **Ingester** | 메모리에 임시 저장 후 Object Storage에 쓰기 |
| **Querier** | 프로파일 데이터 조회 및 병합 |
| **Query Frontend** | 쿼리 캐싱 및 최적화 |
| **Store Gateway** | 장기 저장소(Object Storage) 접근 |

## 3.2 데이터 수집 방식: Push vs Pull

Pyroscope는 두 가지 방식으로 프로파일 데이터를 수집할 수 있다. **데이터가 Pyroscope 서버에 도달한 이후의 저장, 조회, Flame Graph 분석은 어떤 수집 방식을 사용하든 완전히 동일하다.** 차이는 수집 경로뿐이다.

```mermaid
flowchart TD
    subgraph push["Push 모드 (SDK)"]
        App1["Go App\n+ pyroscope-go SDK"] -->|"직접 전송"| PS1["Pyroscope Server"]
    end

    subgraph pull["Pull 모드 (Alloy)"]
        App2["Go App\n+ pprof 엔드포인트"] <-->|"주기적 스크래핑"| Alloy["Grafana Alloy"]
        Alloy -->|"전송"| PS2["Pyroscope Server"]
    end
```

| 기준 | Push (SDK) | Pull (Alloy) |
|------|-----------|--------------|
| **코드 변경** | SDK 추가 필요 | 변경 없음 (`pprof`만 노출) |
| **인프라** | 추가 없음 | Alloy 설치 필요 |
| **Profiling Labels** | `TagWrapper`로 세밀한 label 태깅 가능 | pprof 기본 label만 사용 |
| **기존 pprof 활용** | 별도 공존 설정 필요 | 그대로 활용 |
| **K8s 환경** | Pod마다 SDK 설정 | Alloy DaemonSet으로 일괄 수집 |
| **추천 상황** | 새 프로젝트, 세밀한 분석 필요 | 기존 서비스, 코드 변경 어려운 경우 |

> **실무 팁**: Kubernetes 환경에서 이미 pprof를 노출하는 서비스가 많다면 Pull 모드가 효율적이다. 반면 엔드포인트별 프로파일링 같은 세밀한 분석이 필요하면 Push 모드의 `TagWrapper`가 유리하다.

# 4. 로컬 환경 구축

Docker Compose로 Pyroscope 서버, Grafana, 그리고 Push/Pull 모드 샘플 애플리케이션을 한 번에 실행할 수 있다.

## 4.1 Docker Compose 구성

```yaml
services:
  # --- 공통 인프라 ---
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
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - pyroscope
    networks:
      - pyroscope-net

  # --- Push 모드 ---
  app-http:
    build:
      context: .
      dockerfile: http-server/Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - pyroscope
    environment:
      - PYROSCOPE_SERVER=http://pyroscope:4040
      - PORT=8080
    networks:
      - pyroscope-net

  # --- Pull 모드 ---
  app-pull:
    build:
      context: .
      dockerfile: pull-server/Dockerfile
    ports:
      - "6060:6060"
    environment:
      - PORT=6060
    networks:
      - pyroscope-net

  alloy:
    image: grafana/alloy:latest
    volumes:
      - ./alloy/config.alloy:/etc/alloy/config.alloy
    command: ["run", "/etc/alloy/config.alloy"]
    depends_on:
      - pyroscope
      - app-pull
    networks:
      - pyroscope-net

networks:
  pyroscope-net:
    driver: bridge
```

```bash
> docker compose up -d
```

## 4.2 Grafana 데이터소스 연결

Grafana 프로비저닝 설정으로 Pyroscope 데이터소스를 자동 등록할 수 있다.

```yaml
# grafana/provisioning/datasources/pyroscope.yml
apiVersion: 1

datasources:
  - name: Pyroscope
    type: grafana-pyroscope-datasource
    url: http://pyroscope:4040
    isDefault: true
    editable: true
```

## 4.3 접속 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| Pyroscope | http://localhost:4040 | Pyroscope UI |
| Grafana | http://localhost:3000 | Grafana 대시보드 (익명 접속) |
| App (Push) | http://localhost:8080 | Echo HTTP 서버 (Push 모드) |
| App (Pull) | http://localhost:6060 | pprof 서버 (Pull 모드) |

Grafana에서 **Explore** 메뉴 → Pyroscope 데이터소스를 선택하면 수집된 프로파일 데이터를 Flame Graph로 확인할 수 있다. Push 모드 앱은 `echo.server`, Pull 모드 앱은 `pull.golang.app`으로 표시된다.

# 5. 데이터 수집

## 5.1 Push 모드: SDK 연동

Push 모드는 애플리케이션에 **Pyroscope Go SDK**를 추가하여, 프로파일 데이터를 Pyroscope 서버로 직접 전송하는 방식이다.

### 5.1.1 SDK 설치 및 기본 설정

```bash
> go get github.com/grafana/pyroscope-go
```

`pyroscope.Start()`로 프로파일러를 초기화하면, 애플리케이션이 실행되는 동안 설정된 프로파일 유형의 데이터를 Pyroscope 서버로 지속 전송한다.

```go
package main

import (
	"log"
	"os"
	"runtime"

	"github.com/grafana/pyroscope-go"
)

func main() {
	// 뮤텍스/블로킹 프로파일은 기본 비활성화이므로 명시적으로 활성화
	runtime.SetMutexProfileFraction(5)
	runtime.SetBlockProfileRate(5)

	profiler, err := pyroscope.Start(pyroscope.Config{
		ApplicationName: "simple.golang.app",       // Pyroscope UI에서 표시되는 이름
		ServerAddress:   "http://localhost:4040",    // Pyroscope 서버 주소
		Logger:          pyroscope.StandardLogger,
		Tags:            map[string]string{"hostname": os.Getenv("HOSTNAME")},
		ProfileTypes: []pyroscope.ProfileType{
			pyroscope.ProfileCPU,           // CPU 프로파일
			pyroscope.ProfileAllocObjects,  // 메모리 할당 횟수
			pyroscope.ProfileAllocSpace,    // 메모리 할당 크기
			pyroscope.ProfileInuseObjects,  // 현재 사용 중인 객체 수
			pyroscope.ProfileInuseSpace,    // 현재 사용 중인 메모리 크기
			pyroscope.ProfileGoroutines,    // 고루틴
			pyroscope.ProfileMutexCount,    // 뮤텍스 경합 횟수
			pyroscope.ProfileMutexDuration, // 뮤텍스 경합 시간
			pyroscope.ProfileBlockCount,    // 블로킹 횟수
			pyroscope.ProfileBlockDuration, // 블로킹 시간
		},
	})
	if err != nil {
		log.Fatalf("pyroscope 시작 실패: %v", err)
	}
	defer profiler.Stop() // 종료 시 마지막 프로파일 데이터 전송
}
```

### 5.1.2 주요 설정 항목

| 필드 | 설명 | 기본값 |
|------|------|--------|
| `ApplicationName` | Pyroscope UI에서 표시되는 애플리케이션 이름 | (필수) |
| `ServerAddress` | Pyroscope 서버 URL | (필수) |
| `Tags` | 프로파일 데이터에 추가할 메타데이터 태그 | `nil` |
| `ProfileTypes` | 수집할 프로파일 유형 목록 | CPU + Alloc + Inuse |
| `Logger` | 로깅 인터페이스 | `nil` |
| `DisableGCRuns` | GC 실행 비활성화 (CPU 오버헤드 감소) | `false` |

### 5.1.3 Profiling Labels (TagWrapper)

> **참고**: Profiling Labels는 **Push 모드에서만** 사용할 수 있다. Pull 모드에서는 pprof가 제공하는 기본 스택 트레이스만 수집되므로, 커스텀 label 태깅이 불가능하다. 이것이 Push/Pull 모드의 가장 큰 기능적 차이다.

Pyroscope의 `TagWrapper`를 사용하면 특정 코드 경로에 label을 태깅할 수 있다. 태깅된 프로파일 데이터는 Flame Graph에서 label 기준으로 필터링할 수 있어서, "어떤 엔드포인트가 CPU를 많이 쓰는가?"와 같은 질문에 답할 수 있다.

```go
pyroscope.TagWrapper(ctx,
	pyroscope.Labels("workload", "cpu"),
	func(c context.Context) {
		cpuWork() // 이 블록의 프로파일 데이터에 workload=cpu label 태깅
	})
```

### 5.1.4 엔드포인트별 프로파일링

Echo HTTP 서버에서 각 핸들러를 `TagWrapper`로 감싸면 엔드포인트별 성능을 개별적으로 분석할 수 있다.

```go
func handleSlow(c echo.Context) error {
	start := time.Now()

	pyroscope.TagWrapper(c.Request().Context(),
		pyroscope.Labels("endpoint", "/slow"),
		func(ctx context.Context) {
			fibonacci(38) // CPU 집약적 연산
		})

	return c.JSON(http.StatusOK, response{
		Message: "slow response (CPU intensive)",
		Elapsed: time.Since(start).String(),
	})
}

func handleMemory(c echo.Context) error {
	start := time.Now()

	pyroscope.TagWrapper(c.Request().Context(),
		pyroscope.Labels("endpoint", "/memory"),
		func(ctx context.Context) {
			allocateMemory() // 대량 메모리 할당
		})

	return c.JSON(http.StatusOK, response{
		Message: "memory response (heap allocation)",
		Elapsed: time.Since(start).String(),
	})
}
```

Grafana에서 Pyroscope 데이터소스를 조회하면 `endpoint` label로 `/slow`와 `/memory` 요청의 프로파일을 각각 필터링할 수 있다.

아래는 Push 모드(echo.server)의 CPU 프로파일 Flame Graph이다. `main.fibonacci`가 CPU 시간의 대부분을 차지하는 것을 한눈에 확인할 수 있다.

![Push 모드 CPU Flame Graph](pyroscope-cpu-flamegraph.png)

메모리 프로파일에서는 `main.allocateMemory`의 메모리 할당 패턴을 확인할 수 있다.

![Push 모드 Memory Flame Graph](pyroscope-memory-flamegraph.png)

## 5.2 Pull 모드: Alloy 연동

Pull 모드는 애플리케이션 코드를 변경하지 않고, 기존 `net/http/pprof` 엔드포인트를 **Grafana Alloy**가 주기적으로 스크래핑하는 방식이다. Prometheus의 Pull 방식과 동일한 개념이다.

### 5.2.1 애플리케이션 측 설정

Pull 모드에서 애플리케이션은 pprof 엔드포인트만 노출하면 된다. Pyroscope SDK를 추가할 필요가 없다.

```go
import (
	"net/http"
	_ "net/http/pprof" // /debug/pprof/* 엔드포인트 자동 등록
)

func main() {
	http.ListenAndServe(":6060", nil)
}
```

### 5.2.2 Grafana Alloy 설정

Alloy는 Grafana에서 만든 텔레메트리 수집기(collector)로, Pyroscope의 Pull 모드 수집을 담당한다. `config.alloy` 파일에 스크래핑 대상을 정의한다.

```hcl
// config.alloy
pyroscope.scrape "default" {
  targets = [
    {"__address__" = "app-pull:6060", "service_name" = "pull.golang.app"},
  ]

  scrape_interval = "15s"  // 15초마다 스크래핑

  profiling_config {
    profile.process_cpu { enabled = true }           // CPU 프로파일
    profile.memory {                                  // 메모리 프로파일
      enabled = true
      path    = "/debug/pprof/allocs"
    }
    profile.goroutine { enabled = true }              // 고루틴 프로파일
    profile.mutex { enabled = true }                  // 뮤텍스 프로파일
    profile.block { enabled = true }                  // 블로킹 프로파일
  }

  forward_to = [pyroscope.write.endpoint.receiver]    // 수집 데이터 전송 대상
}

pyroscope.write "endpoint" {
  endpoint {
    url = "http://pyroscope:4040"                     // Pyroscope 서버 주소
  }
}
```

Alloy가 15초마다 pprof 엔드포인트를 스크래핑하므로, 부하 생성 후 잠시 기다리면 Grafana에서 `pull.golang.app` 애플리케이션으로 프로파일 데이터를 조회할 수 있다.

아래는 Pull 모드(pull.golang.app)의 CPU 프로파일이다. Push 모드와 동일하게 `main.fibonacci`가 CPU 병목으로 표시되지만, `TagWrapper` 기반 label 필터링은 사용할 수 없다.

![Pull 모드 CPU Flame Graph](pyroscope-pull-flamegraph.png)

## 5.3 부하 테스트

Push/Pull 모드 모두 동일한 엔드포인트로 부하를 생성할 수 있다.

```bash
# --- Push 모드 (http://localhost:8080) ---
> curl http://localhost:8080/fast       # 빠른 응답 (기준선)
> curl http://localhost:8080/slow       # CPU 부하
> curl http://localhost:8080/memory     # 메모리 부하

# --- Pull 모드 (http://localhost:6060) ---
> curl http://localhost:6060/fast       # 빠른 응답
> curl http://localhost:6060/slow       # CPU 부하
> curl http://localhost:6060/memory     # 메모리 부하

# Pull 모드 pprof 엔드포인트 직접 확인
> curl http://localhost:6060/debug/pprof/
```

# 6. Grafana Profiles Drilldown

**어떤 수집 방식을 사용하든** Pyroscope 서버에 저장된 프로파일 데이터는 동일한 방식으로 분석할 수 있다. 부하 생성 후 Grafana의 **Drilldown > Profiles** 메뉴에서 수집된 프로파일 데이터를 확인할 수 있다. Profiles Drilldown은 서비스 목록 → 프로파일 유형 → Flame Graph → Labels 순서로 점진적으로 분석 범위를 좁혀갈 수 있다.

## 6.1 All Services (서비스 목록)

첫 화면에서는 Pyroscope에 등록된 모든 서비스의 프로파일 데이터를 Grid 뷰로 보여준다.

![Grafana Profiles Drilldown - All Services](pyroscope-profiles-drilldown.png)

| 서비스명 | 설명 | 수집 방식 |
|----------|------|-----------|
| **echo.server** | Echo HTTP 서버 (엔드포인트별 프로파일링) | Push (SDK) |
| **pull.golang.app** | pprof 엔드포인트를 노출하는 서버 | Pull (Alloy) |
| **pyroscope** | Pyroscope 서버 자체의 프로파일 | Push (자체 수집) |
| **simple.golang.app** | 기본 SDK 연동 예제 | Push (SDK) |

상단의 **Profile type** 드롭다운에서 `process_cpu/cpu`, `memory` 등 프로파일 유형을 전환할 수 있고, 서비스 이름으로 검색 필터링도 가능하다.

## 6.2 Profile Types (프로파일 유형별 현황)

서비스를 선택하면 해당 서비스에서 수집 중인 모든 프로파일 유형을 한눈에 볼 수 있다. 아래는 `echo.server`의 Profile Types 화면이다.

![Profile Types - echo.server](pyroscope-drilldown-profile-types.png)

CPU, memory, goroutine, mutex, block 등 각 프로파일 유형의 시계열 그래프가 표시되어, 어떤 리소스에 이상이 있는지 빠르게 파악할 수 있다. 각 카드의 **Flame graph** 링크를 클릭하면 해당 프로파일 유형의 상세 Flame Graph로 이동한다.

## 6.3 Flame Graph (상세 분석)

특정 프로파일 유형을 선택하면 Flame Graph와 함께 심볼 테이블이 표시된다. 심볼 테이블에서는 각 함수의 Self time과 Total time을 정렬하여 성능 병목 함수를 빠르게 식별할 수 있다.

![Flame Graph - echo.server CPU](pyroscope-drilldown-flamegraph.png)

Flame Graph는 프로파일링 데이터를 스택 트레이스 기반으로 시각화한 그래프다.

- **가로축**: 전체 시간 대비 해당 함수가 차지하는 비율 (넓을수록 많은 리소스 사용)
- **세로축**: 함수 호출 계층 (위에서 아래로 호출이 깊어짐)
- **루트 노드**: 전체 애플리케이션 시간의 100%

```
[              root (100%)                ]
[     funcA (60%)      ][   funcB (40%)   ]
[  funcC (30%) ][ funcD (30%) ]
```

Flame Graph를 분석할 때 주의할 점은 다음과 같다.

- **넓은 블록** = 성능 병목 후보 (해당 함수에서 많은 시간 소비)
- **깊은 스택** = 호출 체인이 깊음 (반드시 문제를 의미하지는 않음)
- **Self time vs Total time**: 자기 자신의 실행 시간 vs 하위 함수를 포함한 전체 시간

주요 분석 기능은 다음과 같다.

- **시간 범위 선택**: 특정 시간 구간의 프로파일만 분석
- **함수 클릭**: 해당 함수 중심으로 필터링하여 상세 확인
- **Labels 필터링**: `endpoint=/slow` 등으로 특정 코드 경로만 분석 (Push 모드에서 label 태깅한 경우)

## 6.4 Labels (label별 분류)

**Labels** 탭에서는 프로파일 데이터를 label 기준으로 그룹화하여 볼 수 있다. Push 모드에서 `TagWrapper`로 태깅한 label(예: `hostname`, `pyroscope_spy`)별로 시계열을 분리하여 비교할 수 있다.

![Labels - echo.server](pyroscope-drilldown-labels.png)

## 6.5 Diff Flame Graph (비교 분석)

**Diff flame graph** 탭에서는 두 시간 구간의 프로파일을 나란히 비교할 수 있다. Baseline과 Comparison 구간을 각각 선택하면, 변경 전후의 성능 차이를 색상으로 시각화한다 (빨간색=증가, 초록색=감소).

![Diff Flame Graph](pyroscope-drilldown-diff-flamegraph.png)

# 7. 실전 팁

## 7.1 프로덕션 적용 시 주의사항

- **오버헤드 관리**: Pyroscope SDK의 CPU 오버헤드는 약 2-5%이다. `DisableGCRuns: true` 옵션으로 GC 관련 오버헤드를 줄일 수 있다
- **프로파일 유형 선택**: 모든 프로파일을 활성화하면 오버헤드가 늘어나므로, CPU와 메모리 프로파일만 기본 활성화하고 필요 시 Mutex/Block을 추가하는 것을 권장한다
- **`SetMutexProfileFraction`과 `SetBlockProfileRate` 값**: 값이 작을수록 더 많은 이벤트를 기록한다. 프로덕션에서는 `5` 이상의 값으로 오버헤드를 조절한다

## 7.2 기존 pprof 코드와의 공존

Pyroscope Go SDK는 내부적으로 `runtime/pprof`를 사용한다. 기존에 `net/http/pprof`를 사용하고 있다면 Pyroscope SDK와 함께 사용할 수 있다.

```go
import _ "net/http/pprof" // 기존 pprof HTTP 엔드포인트 유지

// Pyroscope SDK 추가 - 동일한 프로파일 데이터를 Pyroscope 서버로도 전송
profiler, _ := pyroscope.Start(pyroscope.Config{...})
defer profiler.Stop()
```

기존 pprof 엔드포인트는 즉석 디버깅용으로 유지하면서, Pyroscope로 상시 프로파일링 데이터를 수집하는 하이브리드 구성이 가능하다.

## 7.3 Push/Pull 모드 마이그레이션

이미 Pull 모드로 운영 중인 서비스에 Push 모드를 추가하거나, 그 반대도 가능하다.

- **Pull → Push 전환**: SDK를 추가하고, Alloy 설정에서 해당 타겟을 제거한다. `TagWrapper`로 세밀한 label 태깅이 필요해진 경우에 전환한다.
- **Push + Pull 공존**: SDK로 Push하면서 pprof 엔드포인트도 노출할 수 있다. 다만 Alloy가 같은 서비스를 스크래핑하면 **데이터가 중복**되므로, 하나의 수집 방식만 활성화하는 것을 권장한다.

# 8. 마무리

이 글에서는 Grafana Pyroscope를 활용한 Go 애플리케이션 Continuous Profiling을 다루었다.

- **Continuous Profiling**은 프로덕션에서 상시 프로파일을 수집하여, 전통적 pprof의 "문제 발생 후 수동 수집" 한계를 해결한다
- **Push 모드(SDK)**는 `pyroscope.Start()` 한 줄로 연동할 수 있으며, `TagWrapper`로 엔드포인트별 세밀한 분석이 가능하다
- **Pull 모드(Alloy)**는 코드 변경 없이 기존 pprof 엔드포인트를 활용하여, 특히 K8s 환경에서 DaemonSet으로 여러 서비스를 일괄 수집하기에 유리하다
- **Flame Graph**를 통해 성능 병목을 시각적으로 빠르게 파악하고, 비교/Diff 뷰로 변경 전후의 성능 차이를 확인할 수 있다

전체 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/profiling/pyroscope)에서 확인할 수 있다.

# 9. 참고

- [Grafana Pyroscope 공식 문서](https://grafana.com/docs/pyroscope/latest/)
- [Pyroscope Go SDK (Push 모드)](https://grafana.com/docs/pyroscope/latest/configure-client/language-sdks/go_push/)
- [Grafana Alloy (Pull 모드)](https://grafana.com/docs/pyroscope/latest/configure-client/grafana-alloy/)
- [Pyroscope GitHub 저장소](https://github.com/grafana/pyroscope)
- [pyroscope-go Go 클라이언트](https://github.com/grafana/pyroscope-go)
- [Continuous Profiling이란?](https://grafana.com/docs/pyroscope/latest/introduction/continuous-profiling/)
- [Flame Graph 가이드](https://grafana.com/docs/pyroscope/latest/introduction/flamegraphs/)
