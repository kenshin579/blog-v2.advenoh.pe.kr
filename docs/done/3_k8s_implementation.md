# Kubernetes Pod 디자인 패턴 블로그 시리즈 - 구현 문서

## 1. 프로젝트 구조

### 1.1 샘플 코드 디렉토리 (`tutorials-go`)

```
tutorials-go/kubernetes/pod-design-patterns/
├── README.md                          # 전체 실습 가이드
├── kind-config.yaml                   # Kind 클러스터 설정
├── Makefile                           # 빌드/배포 자동화
│
├── common/
│   └── main-app/                      # 메인 Go 웹 서버 (전 패턴 공통 사용)
│       ├── main.go
│       └── Dockerfile
│
├── sidecar/
│   ├── request-logger/                # Go Request Logger Sidecar
│   │   ├── main.go
│   │   └── Dockerfile
│   └── sidecar-pod.yaml               # K8s manifest
│
├── ambassador/
│   ├── redis-proxy/                   # Go Redis Ambassador Proxy
│   │   ├── main.go
│   │   └── Dockerfile
│   ├── ambassador-pod.yaml            # K8s manifest
│   └── redis-deployment.yaml          # 외부 Redis 서비스
│
├── adapter/
│   ├── metrics-adapter/               # Go Prometheus Exporter Adapter
│   │   ├── main.go
│   │   └── Dockerfile
│   └── adapter-pod.yaml               # K8s manifest
│
├── init-container/
│   ├── init-chain-pod.yaml            # Init Container 체이닝 예제
│   ├── init-sidecar-combo-pod.yaml    # Init + Sidecar 조합 예제
│   └── wait-for-service.sh            # DB 대기 스크립트
│
└── native-sidecar/
    ├── native-logger-pod.yaml         # Native Sidecar 로그 수집
    ├── native-vs-legacy-pod.yaml      # 기존 vs Native 비교용
    └── job-with-sidecar.yaml          # Job + Native Sidecar
```

### 1.2 블로그 디렉토리 (`blog-v2.advenoh.pe.kr`)

```
docs/start/
├── k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter/
│   └── index.md
├── k8s-pod-디자인-패턴-2-init-container-완벽-가이드/
│   └── index.md
└── k8s-pod-디자인-패턴-3-native-sidecar-kep-753/
    └── index.md
```

---

## 2. 공통 컴포넌트

### 2.1 Kind 클러스터 설정

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

```bash
# 클러스터 생성
kind create cluster --name pod-patterns --config kind-config.yaml

# 클러스터 삭제
kind delete cluster --name pod-patterns
```

### 2.2 메인 Go 웹 서버 (`common/main-app/`)

전 패턴에서 공통으로 사용하는 간단한 HTTP 서버.

```go
// main.go - 핵심 구현
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "time"
)

type StatsResponse struct {
    RequestCount int     `json:"request_count"`
    Uptime       float64 `json:"uptime_seconds"`
    GoRoutines   int     `json:"goroutines"`
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }

    start := time.Now()
    requestCount := 0

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        requestCount++
        fmt.Fprintf(w, "Hello from main-app! (request #%d)\n", requestCount)
    })

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintln(w, "OK")
    })

    // Adapter 패턴용: 커스텀 JSON 메트릭
    http.HandleFunc("/stats", func(w http.ResponseWriter, r *http.Request) {
        stats := StatsResponse{
            RequestCount: requestCount,
            Uptime:       time.Since(start).Seconds(),
            GoRoutines:   10, // 간소화
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(stats)
    })

    log.Printf("main-app listening on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}
```

```dockerfile
# Dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY main.go .
RUN go build -o main-app main.go

FROM alpine:3.19
COPY --from=builder /app/main-app /usr/local/bin/
ENTRYPOINT ["main-app"]
```

### 2.3 Makefile

```makefile
CLUSTER_NAME := pod-patterns
IMAGES := main-app request-logger redis-proxy metrics-adapter

.PHONY: cluster-up cluster-down build load all clean

cluster-up:
	kind create cluster --name $(CLUSTER_NAME) --config kind-config.yaml

cluster-down:
	kind delete cluster --name $(CLUSTER_NAME)

build:
	docker build -t main-app:local common/main-app/
	docker build -t request-logger:local sidecar/request-logger/
	docker build -t redis-proxy:local ambassador/redis-proxy/
	docker build -t metrics-adapter:local adapter/metrics-adapter/

load: build
	@for img in $(IMAGES); do \
		kind load docker-image $$img:local --name $(CLUSTER_NAME); \
	done

all: cluster-up load

clean: cluster-down
```

---

## 3. 1편: Sidecar, Ambassador, Adapter 구현

### 3.1 Sidecar - Go Request Logger

`httputil.ReverseProxy` 기반. 모든 요청을 프록시하면서 로그 파일에 기록.

```go
// sidecar/request-logger/main.go - 핵심 구현
package main

import (
    "log"
    "net/http"
    "net/http/httputil"
    "net/url"
    "os"
    "time"
)

func main() {
    targetURL := os.Getenv("TARGET_URL") // http://localhost:3000
    logFile := os.Getenv("LOG_FILE")     // /var/log/app/access.log

    target, _ := url.Parse(targetURL)
    proxy := httputil.NewSingleHostReverseProxy(target)

    f, _ := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    defer f.Close()
    logger := log.New(f, "", 0)

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        proxy.ServeHTTP(w, r)
        duration := time.Since(start)
        logger.Printf("%s %s %s %v", time.Now().Format(time.RFC3339), r.Method, r.URL.Path, duration)
    })

    log.Println("request-logger sidecar listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

```yaml
# sidecar/sidecar-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-demo
spec:
  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

    - name: request-logger
      image: request-logger:local
      env:
        - name: TARGET_URL
          value: "http://localhost:3000"
        - name: LOG_FILE
          value: "/var/log/app/access.log"
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

  volumes:
    - name: shared-logs
      emptyDir: {}
```

**실습 확인:**
```bash
kubectl apply -f sidecar/sidecar-pod.yaml
kubectl wait --for=condition=Ready pod/sidecar-demo --timeout=60s

# Sidecar 포트로 요청 (프록시 → 메인앱)
kubectl exec sidecar-demo -c main-app -- wget -qO- http://localhost:8080/

# 로그 파일 확인
kubectl exec sidecar-demo -c main-app -- cat /var/log/app/access.log
```

### 3.2 Ambassador - Redis Proxy

메인 앱은 `localhost:6379`로 접근하고, Ambassador가 실제 Redis로 프록시.

```go
// ambassador/redis-proxy/main.go - 핵심 구현
package main

import (
    "io"
    "log"
    "net"
    "os"
)

func main() {
    listenAddr := ":6379"
    redisAddr := os.Getenv("REDIS_ADDR") // redis-service:6379

    listener, _ := net.Listen("tcp", listenAddr)
    defer listener.Close()
    log.Printf("redis-proxy listening on %s → %s", listenAddr, redisAddr)

    for {
        client, _ := listener.Accept()
        go func(c net.Conn) {
            defer c.Close()
            remote, err := net.Dial("tcp", redisAddr)
            if err != nil {
                log.Printf("failed to connect to redis: %v", err)
                return
            }
            defer remote.Close()
            go io.Copy(remote, c)
            io.Copy(c, remote)
        }(client)
    }
}
```

```yaml
# ambassador/ambassador-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: ambassador-demo
spec:
  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000

    - name: redis-proxy
      image: redis-proxy:local
      env:
        - name: REDIS_ADDR
          value: "redis-service:6379"
```

```yaml
# ambassador/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
```

### 3.3 Adapter - Prometheus Exporter

메인 앱의 `/stats` (커스텀 JSON) → Adapter가 `/metrics` (Prometheus 형식)로 변환.

```go
// adapter/metrics-adapter/main.go - 핵심 구현
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
)

type AppStats struct {
    RequestCount int     `json:"request_count"`
    Uptime       float64 `json:"uptime_seconds"`
    GoRoutines   int     `json:"goroutines"`
}

func main() {
    appURL := os.Getenv("APP_STATS_URL") // http://localhost:3000/stats

    http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
        resp, err := http.Get(appURL)
        if err != nil {
            http.Error(w, "failed to fetch stats", http.StatusBadGateway)
            return
        }
        defer resp.Body.Close()

        var stats AppStats
        json.NewDecoder(resp.Body).Decode(&stats)

        w.Header().Set("Content-Type", "text/plain")
        fmt.Fprintf(w, "# HELP app_request_count Total request count\n")
        fmt.Fprintf(w, "# TYPE app_request_count counter\n")
        fmt.Fprintf(w, "app_request_count %d\n", stats.RequestCount)
        fmt.Fprintf(w, "# HELP app_uptime_seconds Application uptime\n")
        fmt.Fprintf(w, "# TYPE app_uptime_seconds gauge\n")
        fmt.Fprintf(w, "app_uptime_seconds %.2f\n", stats.Uptime)
        fmt.Fprintf(w, "# HELP app_goroutines Number of goroutines\n")
        fmt.Fprintf(w, "# TYPE app_goroutines gauge\n")
        fmt.Fprintf(w, "app_goroutines %d\n", stats.GoRoutines)
    })

    log.Println("metrics-adapter listening on :9090")
    log.Fatal(http.ListenAndServe(":9090", nil))
}
```

```yaml
# adapter/adapter-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: adapter-demo
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
    prometheus.io/path: "/metrics"
spec:
  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000

    - name: metrics-adapter
      image: metrics-adapter:local
      env:
        - name: APP_STATS_URL
          value: "http://localhost:3000/stats"
      ports:
        - containerPort: 9090
```

---

## 4. 2편: Init Container 구현

### 4.1 Init Container 체이닝 예제

```yaml
# init-container/init-chain-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-chain-demo
spec:
  initContainers:
    # Init 1: DB 서비스 대기
    - name: wait-for-db
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          echo "Waiting for redis-service..."
          until nc -z redis-service 6379; do
            echo "redis-service not ready, retrying in 2s..."
            sleep 2
          done
          echo "redis-service is ready!"

    # Init 2: 설정 파일 생성
    - name: download-config
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          echo '{"db_host":"redis-service","db_port":6379,"log_level":"info"}' > /config/app-config.json
          echo "Config file created."
      volumeMounts:
        - name: config-volume
          mountPath: /config

  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: config-volume
          mountPath: /config
          readOnly: true

  volumes:
    - name: config-volume
      emptyDir: {}
```

### 4.2 Init + Sidecar 조합 예제

```yaml
# init-container/init-sidecar-combo-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-sidecar-combo
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z redis-service 6379; do sleep 2; done"]

  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

    - name: request-logger
      image: request-logger:local
      env:
        - name: TARGET_URL
          value: "http://localhost:3000"
        - name: LOG_FILE
          value: "/var/log/app/access.log"
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

  volumes:
    - name: shared-logs
      emptyDir: {}
```

---

## 5. 3편: Native Sidecar 구현

### 5.1 Native Sidecar로 전환 (Request Logger)

```yaml
# native-sidecar/native-logger-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: native-sidecar-demo
spec:
  initContainers:
    # Native Sidecar: restartPolicy: Always가 핵심
    - name: request-logger
      image: request-logger:local
      restartPolicy: Always
      env:
        - name: TARGET_URL
          value: "http://localhost:3000"
        - name: LOG_FILE
          value: "/var/log/app/access.log"
      ports:
        - containerPort: 8080
      startupProbe:
        httpGet:
          port: 8080
          path: /
        initialDelaySeconds: 1
        periodSeconds: 1
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

  volumes:
    - name: shared-logs
      emptyDir: {}
```

### 5.2 Job + Native Sidecar

```yaml
# native-sidecar/job-with-sidecar.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: job-native-sidecar
spec:
  template:
    spec:
      initContainers:
        - name: log-collector
          image: request-logger:local
          restartPolicy: Always
          env:
            - name: TARGET_URL
              value: "http://localhost:3000"
            - name: LOG_FILE
              value: "/var/log/app/job.log"
          volumeMounts:
            - name: shared-logs
              mountPath: /var/log/app

      containers:
        - name: batch-job
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              echo "Job started"
              sleep 5
              echo "Job completed"
          volumeMounts:
            - name: shared-logs
              mountPath: /var/log/app

      restartPolicy: Never
      volumes:
        - name: shared-logs
          emptyDir: {}
  backoffLimit: 1
```

### 5.3 기존 방식 vs Native 비교용

```yaml
# native-sidecar/native-vs-legacy-pod.yaml
# 기존 방식 (종료 순서 문제 재현)
apiVersion: v1
kind: Pod
metadata:
  name: legacy-sidecar-demo
spec:
  containers:
    - name: main-app
      image: main-app:local
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

    - name: request-logger
      image: request-logger:local
      env:
        - name: TARGET_URL
          value: "http://localhost:3000"
        - name: LOG_FILE
          value: "/var/log/app/access.log"
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

  volumes:
    - name: shared-logs
      emptyDir: {}
```

**비교 실습:**
```bash
# 기존 방식으로 배포 후 삭제 → 종료 순서 관찰
kubectl apply -f native-sidecar/native-vs-legacy-pod.yaml
kubectl delete pod legacy-sidecar-demo &
kubectl logs legacy-sidecar-demo -c request-logger -f

# Native 방식으로 배포 후 삭제 → 종료 순서 관찰
kubectl apply -f native-sidecar/native-logger-pod.yaml
kubectl delete pod native-sidecar-demo &
kubectl logs native-sidecar-demo -c request-logger -f
```

---

## 6. 블로그 공통 사항

### 6.1 시리즈 네비게이션 (각 편 상단)

```markdown
> **K8s Pod 디자인 패턴 시리즈**
> - **1편**: [Sidecar, Ambassador, Adapter](../k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter)
> - **2편**: [Init Container 완벽 가이드](../k8s-pod-디자인-패턴-2-init-container-완벽-가이드)
> - **3편**: [Native Sidecar (KEP-753)](../k8s-pod-디자인-패턴-3-native-sidecar-kep-753)
```

### 6.2 GitHub 코드 참조 링크 형식

```markdown
> 전체 코드: [tutorials-go/kubernetes/pod-design-patterns/sidecar/](https://github.com/kenshin579/tutorials-go/tree/master/kubernetes/pod-design-patterns/sidecar)
```
