---
title: "K8s Pod 디자인 패턴 (2) - Init Container 완벽 가이드"
description: "Kubernetes Init Container의 개념, 실행 순서, 실전 사례(DB 대기, 마이그레이션, 설정 다운로드)를 예제와 함께 정리한다"
date: 2026-03-16
update: 2026-03-16
tags:
  - kubernetes
  - init-container
  - pod-lifecycle
  - pod-design-pattern
  - database-migration
series: "K8s Pod 디자인 패턴"
---

> **K8s Pod 디자인 패턴 시리즈**
> - **1편**: [Sidecar, Ambassador, Adapter](../k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter)
> - **2편**: Init Container 완벽 가이드 (현재 글)
> - **3편**: [Native Sidecar (KEP-753)](../k8s-pod-디자인-패턴-3-native-sidecar-kep-753)

[1편](../k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter)에서는 Pod와 함께 **실행 중인** 보조 컨테이너 패턴(Sidecar, Ambassador, Adapter)을 다뤘다. 이번 편에서는 Pod가 **시작되기 전**에 실행되는 **Init Container**를 다룬다. 의존 서비스 대기, 설정 파일 준비, DB 마이그레이션 등 "메인 앱 시작 전에 반드시 해야 할 일"을 Init Container로 처리하는 방법을 실전 예제와 함께 정리한다.

> 전체 코드: [tutorials-go/kubernetes/pod-design-patterns/init-container/](https://github.com/kenshin579/tutorials-go/tree/master/kubernetes/pod-design-patterns/init-container)

## 1. Init Container란?

### 1.1 개념

Init Container는 **Pod의 메인 컨테이너가 시작되기 전에 실행되는 초기화 전용 컨테이너**다. 초기화 작업이 성공적으로 완료되어야만 메인 컨테이너가 시작된다.

일반 컨테이너와의 주요 차이점:

| 항목 | Init Container | 일반 Container |
|------|---------------|----------------|
| 실행 시점 | 메인 컨테이너 **시작 전** | Pod 생성 후 |
| 실행 횟수 | **1회** 실행 후 종료 | 계속 실행 |
| 실행 순서 | 정의된 순서대로 **순차** 실행 | **동시** 시작 |
| Probe 지원 | 없음 (startupProbe 등 불가) | 지원 |
| 완료 조건 | exit 0으로 종료해야 성공 | 계속 Running |

```mermaid
sequenceDiagram
    participant K as Kubelet
    participant I1 as Init Container 1
    participant I2 as Init Container 2
    participant M as Main Container

    K->>I1: 시작
    I1->>K: 완료 (exit 0)
    K->>I2: 시작
    I2->>K: 완료 (exit 0)
    K->>M: 시작
    Note over M: Running...
```

### 1.2 왜 Init Container를 쓰는가?

**관심사 분리**
초기화 로직(DB 대기, 설정 다운로드)을 앱 코드에서 분리한다. 메인 앱 이미지에 `nc`, `curl` 같은 도구를 포함할 필요가 없다.

**보안**
초기화에만 필요한 도구나 권한을 메인 컨테이너에 포함하지 않는다. 예를 들어 `chmod`로 파일 권한을 설정하는 Init Container는 root로 실행하고, 메인 앱은 일반 유저로 실행할 수 있다.

**의존성 관리**
메인 앱이 시작되기 전에 의존 서비스(DB, Redis, 외부 API)가 준비되었는지 확인한다. Init Container가 성공해야만 메인 앱이 시작되므로, 앱 내부에서 재시도 로직을 구현할 필요가 줄어든다.

## 2. Pod 라이프사이클과 Init Container

### 2.1 실행 순서

Init Container는 정의된 순서대로 **순차적으로** 실행된다. 이전 Init Container가 성공(exit 0)해야 다음 Init Container가 시작된다.

```mermaid
sequenceDiagram
    participant K as Kubelet
    participant I1 as init-1: wait-for-db
    participant I2 as init-2: download-config
    participant I3 as init-3: run-migration
    participant M as main-app

    K->>I1: 시작
    Note over I1: DB 서비스 대기 중...
    I1->>K: 완료 (exit 0)

    K->>I2: 시작
    Note over I2: 설정 파일 다운로드
    I2->>K: 완료 (exit 0)

    K->>I3: 시작
    Note over I3: DB 마이그레이션 실행
    I3->>K: 완료 (exit 0)

    K->>M: 시작
    Note over M: 앱 실행 중...
```

이 순서 보장 덕분에 **"DB 준비 → 설정 다운로드 → 마이그레이션 → 앱 시작"** 같은 의존성 체인을 안전하게 구성할 수 있다.

### 2.2 실패 시 동작

Init Container가 실패하면 Pod의 `restartPolicy`에 따라 동작이 달라진다.

| restartPolicy | Init 실패 시 동작 |
|---------------|-------------------|
| `Always` (기본) | Init Container를 무한 재시작 |
| `OnFailure` | 실패한 Init Container만 재시작 |
| `Never` | 재시작하지 않음 (Pod가 Error 상태) |

```mermaid
flowchart TD
    Start[Init Container 실행] --> Result{성공?}
    Result -->|exit 0| Next[다음 Init 또는 메인 컨테이너]
    Result -->|exit 1+| Policy{restartPolicy?}
    Policy -->|Always| Retry[Init Container 재시작]
    Policy -->|OnFailure| Retry
    Policy -->|Never| Error[Pod 상태: Init:Error]
    Retry --> Start
```

**디버깅 방법:**

```bash
# Pod 상태 확인 (Init:Error, Init:CrashLoopBackOff 등)
kubectl get pod <pod-name>

# Init Container 로그 확인
kubectl logs <pod-name> -c <init-container-name>

# Pod 이벤트 확인
kubectl describe pod <pod-name>
```

### 2.3 리소스 관리

Init Container의 리소스 요청/제한은 Pod 스케줄링에 영향을 준다. Pod의 effective request는 다음 중 큰 값이다:

- 모든 일반 컨테이너의 리소스 요청 **합계**
- 가장 높은 Init Container의 리소스 요청

```yaml
# 예: Init Container가 일시적으로 더 많은 리소스 필요
initContainers:
  - name: heavy-init
    resources:
      requests:
        cpu: "500m"      # 마이그레이션에 CPU 필요
        memory: "512Mi"
containers:
  - name: main-app
    resources:
      requests:
        cpu: "100m"      # 앱 자체는 적은 리소스
        memory: "128Mi"
# Pod의 effective request: cpu=500m, memory=512Mi
```

Init Container는 1회 실행 후 종료되므로 리소스가 반환된다. 따라서 일시적으로 높은 리소스를 요청해도 장기적 비용은 메인 컨테이너의 리소스만 소비한다.

## 3. 대표 사용 사례

### 3.1 의존성 대기 (wait-for-service)

가장 흔한 사례다. DB, Redis, 외부 API 등 의존 서비스가 준비될 때까지 대기한다.

```yaml
initContainers:
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
```

`busybox`의 `nc`(netcat)로 TCP 포트를 체크한다. 서비스가 응답할 때까지 2초 간격으로 재시도한다. DNS 해석이 필요하면 `nslookup`을 사용할 수도 있다.

### 3.2 설정 파일 생성/다운로드

원격 설정을 다운로드하거나, 템플릿으로부터 설정 파일을 생성한다.

```yaml
initContainers:
  - name: download-config
    image: busybox:1.36
    command:
      - sh
      - -c
      - |
        echo '{"db_host":"redis-service","db_port":6379,"log_level":"info"}' \
          > /config/app-config.json
        echo "Config file created."
    volumeMounts:
      - name: config-volume
        mountPath: /config
```

공유 Volume(`config-volume`)에 설정 파일을 쓰면, 메인 컨테이너가 같은 Volume을 마운트하여 읽는다. 실무에서는 S3에서 설정을 다운로드하거나, ConfigMap을 렌더링하는 경우가 많다.

### 3.3 DB 마이그레이션

앱 시작 전 데이터베이스 스키마 마이그레이션을 실행한다.

```yaml
initContainers:
  - name: run-migration
    image: migrate/migrate:v4.16.2
    command:
      - migrate
      - -path=/migrations
      - -database=postgres://user:pass@db-service:5432/app?sslmode=disable
      - up
    volumeMounts:
      - name: migration-files
        mountPath: /migrations
```

[golang-migrate](https://github.com/golang-migrate/migrate), Flyway, Liquibase 등을 Init Container로 실행한다. 마이그레이션이 완료되어야만 앱이 시작되므로 스키마 불일치 문제를 방지할 수 있다.

### 3.4 파일 권한 설정

Volume 마운트 후 파일 소유자나 권한을 변경한다.

```yaml
initContainers:
  - name: fix-permissions
    image: busybox:1.36
    command: ["sh", "-c", "chown -R 1000:1000 /data && chmod -R 755 /data"]
    securityContext:
      runAsUser: 0    # root로 실행
    volumeMounts:
      - name: data-volume
        mountPath: /data
containers:
  - name: main-app
    securityContext:
      runAsUser: 1000  # 일반 유저로 실행
    volumeMounts:
      - name: data-volume
        mountPath: /data
```

Init Container는 root로 실행하여 권한을 설정하고, 메인 앱은 일반 유저로 실행한다. 보안 원칙(최소 권한)을 지키면서도 Volume 권한 문제를 해결할 수 있다.

## 4. 실전 예제: Init Container 체이닝

### 4.1 시나리오

두 개의 Init Container를 체이닝하는 예제다:

1. **Init 1 (wait-for-db)**: Redis 서비스가 준비될 때까지 대기
2. **Init 2 (download-config)**: 설정 파일 생성
3. **Main (main-app)**: Go 웹 서버 시작

### 4.2 전체 K8s YAML manifest

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
          echo '{"db_host":"redis-service","db_port":6379,"log_level":"info"}' \
            > /config/app-config.json
          echo "Config file created."
      volumeMounts:
        - name: config-volume
          mountPath: /config

  containers:
    - name: main-app
      image: main-app:local
      imagePullPolicy: Never
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

포인트:
- `wait-for-db`가 먼저 실행되어 Redis가 준비될 때까지 대기
- 성공 후 `download-config`가 실행되어 설정 파일 생성
- 두 Init Container 모두 성공해야 `main-app`이 시작
- `config-volume`을 통해 Init Container가 생성한 설정을 메인 앱이 읽음

### 4.3 동작 확인

```bash
# 1편에서 사용한 Kind 클러스터와 이미지가 필요하다
# Redis 서비스 배포 (Init Container가 대기할 대상)
kubectl apply -f ambassador/redis-deployment.yaml
kubectl wait --for=condition=Available deployment/redis --timeout=60s

# Init Container 체이닝 Pod 배포
kubectl apply -f init-container/init-chain-pod.yaml

# Pod 상태 변화 관찰
kubectl get pod init-chain-demo -w
```

상태 변화:

```
NAME              READY   STATUS     RESTARTS   AGE
init-chain-demo   0/1     Init:0/2   0          1s    # Init 1 실행 중
init-chain-demo   0/1     Init:1/2   0          3s    # Init 1 완료, Init 2 실행 중
init-chain-demo   0/1     PodInitializing   0   4s    # Init 2 완료, 메인 준비 중
init-chain-demo   1/1     Running    0          5s    # 메인 앱 실행 중
```

```bash
# 설정 파일이 정상 생성되었는지 확인
kubectl exec init-chain-demo -- cat /config/app-config.json
# 출력: {"db_host":"redis-service","db_port":6379,"log_level":"info"}

# Init Container 로그 확인
kubectl logs init-chain-demo -c wait-for-db
# Waiting for redis-service...
# redis-service is ready!

kubectl logs init-chain-demo -c download-config
# Config file created.
```

## 5. Init Container vs Sidecar 비교

### 5.1 실행 시점 차이

두 패턴의 가장 큰 차이는 **실행 시점**이다.

| 항목 | Init Container | Sidecar |
|------|---------------|---------|
| 실행 시점 | Pod 시작 **전** | Pod와 **함께** |
| 실행 기간 | 완료 후 **종료** | Pod 종료까지 **계속 실행** |
| 실행 횟수 | **1회** | **지속적** |
| 사용 목적 | 초기화, 선행 조건 확인 | 기능 확장, 보조 서비스 |

```mermaid
sequenceDiagram
    participant I as Init Container
    participant M as Main App
    participant S as Sidecar

    Note over I: Pod 시작 전
    I->>I: 초기화 작업
    I->>I: 완료 후 종료

    Note over M,S: Pod 실행 중
    par
        M->>M: 비즈니스 로직
    and
        S->>S: 로깅/프록시 등
    end
```

### 5.2 언제 어떤 것을 쓸까?

| 상황 | Init Container | Sidecar |
|------|:-:|:-:|
| DB가 준비될 때까지 대기 | O | |
| 설정 파일 1회 다운로드 | O | |
| DB 스키마 마이그레이션 | O | |
| 파일 권한 변경 | O | |
| 요청 로깅 (지속적) | | O |
| 메트릭 수집 (지속적) | | O |
| 시크릿 주기적 갱신 | | O |
| 프록시 (지속적) | | O |

한 줄 요약: **"1회성 초기화 → Init Container, 지속적 보조 → Sidecar"**

### 5.3 함께 쓰는 패턴

Init Container와 Sidecar를 **함께** 쓰는 것도 흔한 패턴이다. 예를 들어:

- Init Container로 DB 대기 → Sidecar로 요청 로깅

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
      imagePullPolicy: Never
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

    - name: request-logger
      image: request-logger:local
      imagePullPolicy: Never
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

실행 순서: `wait-for-db`(Init) 완료 → `main-app` + `request-logger`(Sidecar) 동시 시작

```bash
kubectl apply -f init-container/init-sidecar-combo-pod.yaml
kubectl wait --for=condition=Ready pod/init-sidecar-combo --timeout=60s

# Sidecar를 통해 요청
kubectl exec init-sidecar-combo -c main-app -- wget -qO- http://localhost:8080/
# 출력: Hello from main-app! (request #1)

# 로그 확인
kubectl exec init-sidecar-combo -c main-app -- cat /var/log/app/access.log
# 2026-03-16T10:29:03Z GET / 759.625µs
```

## 6. 마무리

### 핵심 정리

- **Init Container**는 Pod의 메인 컨테이너 시작 전에 실행되는 초기화 전용 컨테이너
- **순차 실행**: 정의된 순서대로 하나씩 실행되며, 이전 Init이 성공해야 다음이 시작
- **대표 사례**: 의존성 대기, 설정 다운로드, DB 마이그레이션, 파일 권한 설정
- **Sidecar와의 차이**: Init은 1회성 초기화, Sidecar는 지속적 보조
- **함께 사용 가능**: Init Container(초기화) + Sidecar(런타임 보조) 조합이 흔함

### 다음 편 예고

다음 편에서는 **Native Sidecar (KEP-753)**를 다룬다. 기존 Sidecar 방식의 문제점(시작/종료 순서 미보장, Job 호환 불가)을 K8s 1.28+에서 도입된 Native Sidecar가 어떻게 해결하는지 정리한다.

## 참고

- [Kubernetes 공식 문서 - Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Kubernetes 공식 문서 - Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- Kubernetes Patterns (O'Reilly, Bilgin Ibryam & Roland Huß)
