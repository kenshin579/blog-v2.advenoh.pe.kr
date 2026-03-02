# PRD: Grafana 완벽 가이드 블로그 포스팅

## 개요

Grafana + Prometheus + Tempo를 활용한 모니터링 시스템 구축을 다루는 블로그 포스팅.
Go 애플리케이션에서 커스텀 메트릭을 수집하고, Grafana 대시보드로 시각화하며, 알림 설정과 분산 트레이싱까지 다루는 실전 가이드를 작성한다.

### 대상 독자

- 모니터링 시스템을 처음 구축하려는 백엔드 개발자
- Prometheus + Grafana 조합을 이해하고 싶은 개발자
- Go 애플리케이션에 메트릭을 추가하고 싶은 개발자
- 분산 트레이싱(Distributed Tracing)을 시작하고 싶은 개발자

### 기존 인프라 현황

이미 `charts` repo에 Grafana + Prometheus가 K8s 환경에서 운영 중이며, 이를 기반으로 실전 예제를 구성한다.

| 구성 요소 | 버전 | 상태 |
|-----------|------|------|
| Grafana | 11.4.0 | 운영 중 (`grafana.advenoh.pe.kr`) |
| Prometheus | v2.51.0 | 운영 중 (retention 7일) |
| node-exporter | v1.8.1 | 운영 중 |
| kube-state-metrics | v2.12.0 | 운영 중 |
| mysqld-exporter | v0.15.1 | 운영 중 |
| redis_exporter | v1.62.0 | 운영 중 |

기존 대시보드 (7개):
- Kubernetes Cluster Overview
- Node Exporter Full
- Kubernetes Pods
- MySQL Overview
- Redis Dashboard
- NGINX Gateway Fabric
- CronJob Monitor (Stock Data Batch)

## 기술 스택

| 구분 | 기술 |
|------|------|
| **모니터링** | Prometheus, Grafana |
| **트레이싱** | Grafana Tempo, OpenTelemetry |
| **백엔드 샘플** | Go (Echo v4) |
| **메트릭 라이브러리** | `prometheus/client_golang` |
| **트레이싱 라이브러리** | `go.opentelemetry.io/otel` |
| **인프라** | docker-compose (로컬 실행) |
| **샘플 코드 위치** | `tutorials-go/monitoring/grafana-metrics/` (편 1~2), `tutorials-go/monitoring/grafana-tracing/` (편 3) |

## 블로그 포스팅 구성

### 시리즈 전체 구성: "Grafana 완벽 가이드"

| 편 | 제목 | Observability 영역 | 상태 |
|----|------|-------------------|------|
| 편 1 | Grafana + Prometheus 기초 — 개념부터 대시보드 구축까지 | Metrics | 작성 예정 |
| 편 2 | Go 애플리케이션 커스텀 메트릭 — Prometheus 계측과 Grafana 시각화 | Metrics | 작성 예정 |
| 편 3 | Grafana Tempo — Go 애플리케이션 분산 트레이싱 | Traces | 작성 예정 |
| 편 4 | Grafana Pyroscope — Go 애플리케이션 Continuous Profiling | Profiles | **작성 완료** |

### 편 1: Grafana + Prometheus 기초 — 개념부터 대시보드 구축까지

```
# 1. 들어가며
  - 왜 모니터링이 필요한가?
  - Observability 3요소: Metrics, Logs, Traces
  - 이 글에서 다루는 범위

# 2. Prometheus 핵심 개념
  ## 2.1 아키텍처 — Pull 기반 메트릭 수집
    - Prometheus Server, Exporter, Pushgateway 역할
    - Pull vs Push 모델 비교
    - [다이어그램] Prometheus 아키텍처
  ## 2.2 메트릭 타입 4가지
    ### 2.2.1 Counter — 단조 증가 값
      - 예시: http_requests_total, errors_total
    ### 2.2.2 Gauge — 증감 가능한 현재 값
      - 예시: temperature, goroutines, memory_usage
    ### 2.2.3 Histogram — 값의 분포 (버킷 기반)
      - bucket, sum, count의 관계
      - 예시: request_duration_seconds
    ### 2.2.4 Summary — 값의 분포 (분위수 기반)
      - Histogram과 차이점, 언제 어떤 것을 쓸지
  ## 2.3 Label과 Time Series
    - Label의 역할과 카디널리티 주의점
    - 메트릭 네이밍 규칙 (Best Practice)
  ## 2.4 PromQL 기본 문법
    - Instant Vector vs Range Vector
    - 핵심 함수: rate(), increase(), avg_over_time(), histogram_quantile()
    - 실전 쿼리 예시 (CPU 사용률, 에러율, P99 레이턴시)

# 3. Grafana 핵심 개념
  ## 3.1 Data Source 연동
    - Prometheus를 Data Source로 추가하는 방법
  ## 3.2 Dashboard 구조 이해
    - Dashboard / Row / Panel 계층 구조
    - [스크린샷] 실제 대시보드 예시
  ## 3.3 주요 Panel 타입
    - Time Series, Stat, Gauge, Table, Bar Chart
    - 각 패널의 적합한 사용 사례
  ## 3.4 Variables(변수)와 템플릿
    - 드롭다운 필터로 동적 대시보드 만들기
    - Label values 기반 변수 설정

# 4. 실전: 로컬 환경 구축 (docker-compose)
  ## 4.1 docker-compose로 Prometheus + Grafana 실행
    - docker-compose.yml 구성
    - Prometheus scrape 설정 (prometheus.yml)
  ## 4.2 node-exporter로 시스템 메트릭 수집
    - node-exporter 추가 및 설정
  ## 4.3 첫 번째 대시보드 만들기
    - CPU 사용률 패널 (Time Series)
    - 메모리 사용량 패널 (Gauge + Time Series)
    - 디스크 I/O 패널 (Time Series)
    - 네트워크 트래픽 패널 (Time Series)
    - [스크린샷] 완성된 시스템 모니터링 대시보드

# 5. 마무리
  - 편 1 정리
  - 다음 편 예고: Go 커스텀 메트릭

# 6. 참고
```

### 편 2: Go 애플리케이션 커스텀 메트릭 — Prometheus 계측과 Grafana 시각화

```
# 1. 들어가며
  - 기본 인프라 메트릭만으로는 부족한 이유
  - 애플리케이션 레벨 메트릭의 가치
  - 이 글에서 만들 것: Go 주문 서비스 + 커스텀 대시보드 + 알림

# 2. Go 애플리케이션에 Prometheus 메트릭 추가
  ## 2.1 prometheus/client_golang 소개
    - 라이브러리 설치 및 기본 구조
    - promhttp.Handler()로 /metrics 엔드포인트 노출
  ## 2.2 메트릭 타입별 구현
    ### 2.2.1 Counter — HTTP 요청 수, 에러 수
      - NewCounterVec과 Label 활용
      - 코드 예시: http_requests_total{method, path, status}
    ### 2.2.2 Gauge — 활성 요청 수
      - Inc() / Dec()로 현재 상태 추적
      - 코드 예시: http_requests_in_flight
    ### 2.2.3 Histogram — 요청 응답 시간 분포
      - Bucket 설정 전략
      - 코드 예시: http_request_duration_seconds{method, path}
  ## 2.3 비즈니스 메트릭 추가
    - orders_created_total{status} — 주문 성공/실패 수
    - order_processing_duration_seconds — 주문 처리 시간
  ## 2.4 Echo 미들웨어로 자동 계측
    - 모든 HTTP 요청에 자동으로 메트릭 수집하는 미들웨어 구현

# 3. 샘플 프로젝트: 주문 서비스
  ## 3.1 프로젝트 구조
    - 디렉토리 레이아웃 설명
  ## 3.2 API 엔드포인트
    - POST /api/orders — 주문 생성
    - GET /api/orders — 주문 목록
    - GET /api/orders/:id — 주문 상세
  ## 3.3 docker-compose로 전체 스택 실행
    - Go앱 + Prometheus + Grafana 한번에 실행
    - Prometheus에서 Go앱 메트릭 확인

# 4. Grafana 대시보드 구축
  ## 4.1 RED 메서드란?
    - Rate(요청률), Errors(에러율), Duration(응답 시간)
    - [다이어그램] RED 메서드 개념
  ## 4.2 HTTP 메트릭 대시보드
    - 초당 요청 수 (rate) — Time Series 패널
    - 에러율 (%) — Stat + Time Series 패널
    - 응답 시간 P50/P90/P99 — Time Series 패널
    - 활성 요청 수 — Gauge 패널
  ## 4.3 비즈니스 메트릭 대시보드
    - 주문 성공/실패 추이 — Stacked Time Series
    - 주문 처리 시간 분포 — Heatmap 또는 Histogram
  ## 4.4 대시보드 JSON 내보내기/가져오기
    - Dashboard as Code로 관리하는 방법
    - [스크린샷] 완성된 Go 앱 대시보드

# 5. Grafana Alerting 설정
  ## 5.1 Alert Rule 생성
    - 에러율 급증 알림 (5xx > 5%)
    - 응답 시간 초과 알림 (P99 > 3s)
  ## 5.2 Contact Point 설정
    - Telegram 봇 연동
  ## 5.3 Notification Policy 구성
    - 심각도별 알림 라우팅
    - [스크린샷] Alert 발생 시 Telegram 알림 예시

# 6. 실전 팁
  ## 6.1 메트릭 네이밍 Best Practice
    - Prometheus 공식 네이밍 규칙
    - Label 카디널리티 관리
  ## 6.2 프로덕션 적용 시 주의사항
    - 히스토그램 버킷 튜닝
    - 메트릭 수가 많아질 때의 성능 영향
    - Grafana 대시보드 로딩 최적화

# 7. 마무리
  - 편 2 정리
  - 다음 편 예고: Grafana Tempo로 분산 트레이싱

# 8. 참고
```

### 편 3: Grafana Tempo — Go 애플리케이션 분산 트레이싱

```
# 1. 들어가며
  - Observability 3요소 중 Traces의 역할
  - 메트릭만으로는 알 수 없는 것: "어디서 느려졌는가?"
  - 이 글에서 만들 것: Go 주문 서비스에 트레이싱 추가 + Grafana에서 시각화

# 2. 분산 트레이싱 핵심 개념
  ## 2.1 Trace, Span, Context Propagation
    - Trace: 하나의 요청이 서비스를 거치는 전체 경로
    - Span: Trace를 구성하는 개별 작업 단위
    - Context Propagation: 서비스 간 Trace ID 전달
    - [다이어그램] Trace/Span 구조 예시
  ## 2.2 Grafana Tempo란?
    - 인덱싱 없이 Object Storage에 저장 → 비용 효율적
    - OpenTelemetry, Jaeger, Zipkin 호환
    - TraceQL 쿼리 언어
  ## 2.3 OpenTelemetry란?
    - 벤더 중립 Observability 표준
    - Traces, Metrics, Logs 통합 SDK
    - Exporter로 Tempo에 전송

# 3. 로컬 환경 구축 (docker-compose)
  ## 3.1 Tempo 추가 구성
    - docker-compose에 Tempo 서비스 추가
    - Tempo 설정 (tempo.yml)
    - Grafana에 Tempo Data Source 연결
  ## 3.2 전체 스택 확인
    - Go앱 + Prometheus + Tempo + Grafana 실행
    - [다이어그램] 데이터 흐름 (메트릭 → Prometheus, 트레이스 → Tempo)

# 4. Go 애플리케이션에 OpenTelemetry 트레이싱 추가
  ## 4.1 OTel SDK 초기화
    - TracerProvider, OTLP Exporter 설정
    - 코드 예시: initTracer()
  ## 4.2 Echo 미들웨어로 HTTP 자동 트레이싱
    - otelecho 미들웨어 적용
    - HTTP 요청마다 자동 Span 생성
  ## 4.3 커스텀 Span 추가
    - 비즈니스 로직에 수동 Span 추가 (주문 생성, 결제 처리 등)
    - Span Attributes, Events, Status 설정
    - 코드 예시: 주문 생성 핸들러에 Span 추가
  ## 4.4 서비스 간 Context Propagation
    - HTTP 클라이언트에 trace context 전파
    - 코드 예시: 외부 API 호출 시 Span 연결

# 5. Grafana에서 트레이스 분석
  ## 5.1 Explore에서 트레이스 조회
    - TraceQL 기본 쿼리
    - Trace ID로 검색
    - [스크린샷] Trace 상세 뷰 (Waterfall 다이어그램)
  ## 5.2 메트릭 → 트레이스 연결 (Exemplar)
    - Prometheus Exemplar로 메트릭에서 트레이스로 점프
    - "응답 시간이 느린 요청"을 클릭하면 해당 Trace로 이동
    - [스크린샷] Exemplar 연결 예시
  ## 5.3 트레이스 기반 대시보드
    - 서비스별 요청 시간 분포
    - 에러 트레이스 필터링

# 6. 실전 팁
  ## 6.1 Sampling 전략
    - Always, Probability, Rate Limiting 방식 비교
    - 프로덕션에서의 적정 샘플링 비율
  ## 6.2 트레이싱 오버헤드 관리
    - 성능 영향 최소화 방법
    - 불필요한 Span 줄이기

# 7. 마무리
  - 편 3 정리 (Metrics + Traces로 Observability 확장)
  - 다음 편 예고: Grafana Pyroscope로 Continuous Profiling (편 4)

# 8. 참고
```

### 편 4: Grafana Pyroscope — Go 애플리케이션 Continuous Profiling (작성 완료)

> **이미 작성된 글**: `blog-v2.advenoh.pe.kr/docs/start/grafana-pyroscope로-go-애플리케이션-continuous-profiling-시작하기/index.md`
> 이 글을 "Grafana 완벽 가이드" 시리즈의 편 4로 편입한다. frontmatter에 `series: "Grafana 완벽 가이드"` 추가 필요.

#### 기존 목차

```
# 1. 들어가며
# 2. Continuous Profiling이란?
  ## 2.1 전통적 프로파일링 vs Continuous Profiling
  ## 2.2 프로파일 유형 (Go 기준)
# 3. Grafana Pyroscope 아키텍처
  ## 3.1 핵심 컴포넌트
  ## 3.2 데이터 수집 방식: Push vs Pull
# 4. 로컬 환경 구축
  ## 4.1 Docker Compose로 Pyroscope + Grafana 실행
  ## 4.2 Grafana에서 Pyroscope 데이터소스 연결
# 5. Go SDK 연동
  ## 5.1 SDK 설치 및 기본 설정
  ## 5.2 주요 설정 항목
# 6. Profiling Labels로 세밀한 분석
  ## 6.1 TagWrapper 사용법
  ## 6.2 HTTP 서버에서 엔드포인트별 프로파일링
# 7. Flame Graph 분석
  ## 7.1 Flame Graph 읽는 법
  ## 7.2 Pyroscope에서 Flame Graph 활용
# 8. 실전 팁
  ## 8.1 프로덕션 적용 시 주의사항
  ## 8.2 기존 pprof 코드와의 공존
# 9. 마무리
# 10. 참고
```

## 샘플 코드 설계 (`tutorials-go`)

### 프로젝트 구조

#### 편 1~2: `monitoring/grafana-metrics/`

```
tutorials-go/
└── monitoring/
    └── grafana-metrics/
        ├── main.go                # 진입점
        ├── go.mod
        ├── go.sum
        ├── config/
        │   └── config.go          # 서버 설정
        ├── handler/
        │   ├── order_handler.go   # 주문 API (비즈니스 로직 예시)
        │   └── health_handler.go  # 헬스체크
        ├── metrics/
        │   └── metrics.go         # Prometheus 메트릭 정의 (Counter, Gauge, Histogram)
        ├── middleware/
        │   └── prometheus.go      # HTTP 메트릭 자동 수집 미들웨어
        ├── dashboard/
        │   └── go-app-dashboard.json  # Grafana 대시보드 JSON
        ├── docker-compose.yml     # 로컬 실행 (Go앱 + Prometheus + Grafana)
        ├── prometheus/
        │   └── prometheus.yml     # Prometheus scrape 설정
        └── README.md
```

#### 편 3: `monitoring/grafana-tracing/`

```
tutorials-go/
└── monitoring/
    └── grafana-tracing/
        ├── main.go                # 진입점 (OTel 초기화 포함)
        ├── go.mod
        ├── go.sum
        ├── config/
        │   └── config.go          # 서버 설정
        ├── handler/
        │   ├── order_handler.go   # 주문 API (커스텀 Span 포함)
        │   └── health_handler.go  # 헬스체크
        ├── tracing/
        │   └── tracer.go          # OTel TracerProvider 초기화, OTLP Exporter 설정
        ├── middleware/
        │   └── otel.go            # Echo OTel 트레이싱 미들웨어
        ├── docker-compose.yml     # 로컬 실행 (Go앱 + Prometheus + Tempo + Grafana)
        ├── tempo/
        │   └── tempo.yml          # Tempo 설정
        ├── prometheus/
        │   └── prometheus.yml     # Prometheus scrape 설정 (Exemplar 포함)
        └── README.md
```

### 샘플 API (주문 서비스 시뮬레이션)

비즈니스 로직이 있어야 의미 있는 메트릭이 나오므로, 간단한 주문 서비스를 시뮬레이션한다.

| Method | Path | 설명 | 관련 메트릭 |
|--------|------|------|------------|
| GET | `/health` | 헬스체크 | - |
| GET | `/metrics` | Prometheus 메트릭 | - |
| POST | `/api/orders` | 주문 생성 | 요청 수, 응답 시간, 에러율 |
| GET | `/api/orders` | 주문 목록 | 요청 수, 응답 시간 |
| GET | `/api/orders/:id` | 주문 상세 | 요청 수, 응답 시간, 404 비율 |

### 커스텀 메트릭 설계

```go
// metrics/metrics.go

// Counter - HTTP 요청 총 수
var HttpRequestsTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total number of HTTP requests",
    },
    []string{"method", "path", "status"},
)

// Histogram - HTTP 요청 응답 시간
var HttpRequestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request duration in seconds",
        Buckets: prometheus.DefBuckets,
    },
    []string{"method", "path"},
)

// Gauge - 활성 요청 수 (현재 처리 중)
var HttpRequestsInFlight = prometheus.NewGauge(
    prometheus.GaugeOpts{
        Name: "http_requests_in_flight",
        Help: "Number of HTTP requests currently being processed",
    },
)

// Counter - 주문 생성 수 (비즈니스 메트릭)
var OrdersCreatedTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "orders_created_total",
        Help: "Total number of orders created",
    },
    []string{"status"}, // success, failed
)

// Histogram - 주문 처리 시간
var OrderProcessingDuration = prometheus.NewHistogram(
    prometheus.HistogramOpts{
        Name:    "order_processing_duration_seconds",
        Help:    "Time spent processing an order",
        Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5},
    },
)
```

### 주요 라이브러리

| 라이브러리 | 용도 | 편 |
|-----------|------|-----|
| `github.com/labstack/echo/v4` | HTTP 프레임워크 | 편 1~3 |
| `github.com/prometheus/client_golang` | Prometheus 메트릭 | 편 1~2 |
| `github.com/google/uuid` | 주문 ID 생성 | 편 2~3 |
| `go.opentelemetry.io/otel` | OpenTelemetry SDK | 편 3 |
| `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` | OTLP gRPC Exporter (Tempo 전송) | 편 3 |
| `go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho` | Echo 자동 트레이싱 미들웨어 | 편 3 |

### docker-compose 구성

로컬에서 바로 실행해볼 수 있도록 docker-compose로 전체 스택을 구성한다.

#### 편 1~2: `grafana-metrics/docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"

  prometheus:
    image: prom/prometheus:v2.51.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./dashboard:/var/lib/grafana/dashboards
```

#### 편 3: `grafana-tracing/docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=tempo:4317

  prometheus:
    image: prom/prometheus:v2.51.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  tempo:
    image: grafana/tempo:2.6.1
    ports:
      - "3200:3200"   # Tempo API
      - "4317:4317"   # OTLP gRPC
    volumes:
      - ./tempo/tempo.yml:/etc/tempo/tempo.yml
    command: ["-config.file=/etc/tempo/tempo.yml"]

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## PromQL 쿼리 예시 (블로그에서 다룰 것)

### 기본 쿼리

```promql
# 초당 요청 수 (5분 평균)
rate(http_requests_total[5m])

# 에러율 (%)
rate(http_requests_total{status=~"5.."}[5m])
  / rate(http_requests_total[5m]) * 100

# P99 응답 시간
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# P50 / P90 / P99 비교
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.90, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### 비즈니스 메트릭 쿼리

```promql
# 주문 성공률
rate(orders_created_total{status="success"}[5m])
  / rate(orders_created_total[5m]) * 100

# 주문 처리 시간 P95
histogram_quantile(0.95, rate(order_processing_duration_seconds_bucket[5m]))

# 현재 활성 요청 수
http_requests_in_flight
```

## Alert Rule 예시 (블로그에서 다룰 것)

| Alert 이름 | 조건 | 심각도 |
|-----------|------|--------|
| HighErrorRate | 5xx 에러율 > 5% (5분간) | critical |
| SlowResponseTime | P99 > 3초 (5분간) | warning |
| HighRequestRate | RPS > 1000 (5분간) | info |
| OrderFailureSpike | 주문 실패율 > 10% (5분간) | critical |

## 결정 사항

- [x] **실행 환경**: docker-compose로 지원 (K8s 배포는 범위에서 제외)
- [x] **Grafana Alerting**: Telegram 연동까지 다룬다
- [x] **Grafana Loki**: 이번 시리즈에서는 다루지 않는다 (별도 편으로 분리 권장)
  > Loki는 Prometheus에서 영감을 받은 **로그 집계 시스템**. Prometheus가 메트릭(숫자)을 수집한다면, Loki는 로그(텍스트)를 수집한다. 레이블 기반 인덱싱으로 비용 효율적이며, LogQL로 쿼리한다. Grafana에서 메트릭과 로그를 함께 조회할 수 있어 강력하지만, 이번 시리즈 범위와는 별개의 주제이므로 분리한다.
- [x] **Grafana Pyroscope**: 이미 작성된 글을 시리즈 편 4로 편입한다
- [x] **샘플 앱 도메인**: 주문 서비스 시뮬레이션
- [x] **tutorials-go 위치**: `monitoring/grafana-metrics/`

- [x] **블로그 편 수**: 4편 시리즈 (편 1: 기초, 편 2: 커스텀 메트릭 + Alerting, 편 3: Tempo 트레이싱, 편 4: Pyroscope 프로파일링(작성 완료))
- [x] **시리즈명**: "Grafana 완벽 가이드"

## 작업 순서

### Phase 1: 샘플 코드 작성 — 메트릭 (`tutorials-go/monitoring/grafana-metrics/`)

1. 프로젝트 생성 및 Echo + Prometheus 메트릭 통합
2. 주문 API 핸들러 구현
3. Prometheus 미들웨어 작성
4. docker-compose 환경 구성
5. 로컬 테스트 및 메트릭 확인

### Phase 2: Grafana 대시보드 + Alerting

1. Go 앱 대시보드 JSON 작성
2. RED 메서드 기반 패널 구성
3. 비즈니스 메트릭 패널 추가
4. Alert Rule + Telegram Contact Point 설정

### Phase 3: 샘플 코드 작성 — 트레이싱 (`tutorials-go/monitoring/grafana-tracing/`)

1. 프로젝트 생성 및 OpenTelemetry SDK 초기화
2. Echo OTel 미들웨어 적용
3. 커스텀 Span 추가 (주문 핸들러)
4. docker-compose에 Tempo 추가 구성
5. Grafana에서 트레이스 조회 및 Exemplar 연결 확인

### Phase 4: 블로그 작성 (`blog-v2`)

1. 편 1 초안 작성 (개념 + 기본 대시보드)
2. 편 2 초안 작성 (커스텀 메트릭 + Alerting)
3. 편 3 초안 작성 (Tempo 트레이싱)
4. 스크린샷 촬영 (Grafana 대시보드, Prometheus UI, Tempo Trace 뷰)
5. PR 생성 및 리뷰

## 참고 자료

- [Grafana 공식 문서](https://grafana.com/docs/grafana/latest/)
- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [prometheus/client_golang](https://pkg.go.dev/github.com/prometheus/client_golang)
- [RED Method](https://www.weave.works/blog/the-red-method-key-metrics-for-microservices-architecture/)
- [Prometheus Best Practices: Naming](https://prometheus.io/docs/practices/naming/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
- [Grafana Tempo 공식 문서](https://grafana.com/docs/tempo/latest/)
- [OpenTelemetry Go SDK](https://opentelemetry.io/docs/languages/go/)
- [TraceQL 쿼리 언어](https://grafana.com/docs/tempo/latest/traceql/)
