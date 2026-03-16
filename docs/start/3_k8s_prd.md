# Kubernetes Pod 디자인 패턴 블로그 시리즈 - PRD

## 1. 개요

### 1.1 목적

Kubernetes에서 Pod를 설계할 때 사용하는 핵심 패턴들을 학습하고 블로그 시리즈로 정리한다.
Sidecar 패턴을 중심으로, Multi-Container Pod 패턴 전체를 3편 시리즈로 다룬다.

### 1.2 시리즈 구성

| 편 | 제목 (안) | 핵심 내용 | 상태 |
|----|-----------|-----------|------|
| **1편** | **Multi-Container Pod 패턴 - Sidecar, Ambassador, Adapter** | 3가지 런타임 패턴 개념 + 실전 YAML + 비교 | 이번 PRD |
| **2편** | **Init Container 완벽 가이드** | 초기화 패턴, 체이닝, 실전 사례 (DB 대기, 마이그레이션) | 이번 PRD |
| **3편** | **K8s Native Sidecar (KEP-753)와 Pod 라이프사이클** | 1.28+ 네이티브 사이드카, 종료 순서, 기존 방식 마이그레이션 | 이번 PRD |

### 1.3 왜 3편으로 나누는가?

- **1편**: Pod와 함께 실행되는 런타임 패턴 3가지 (Sidecar/Ambassador/Adapter)는 서로 비교해야 이해가 빠름
- **2편**: Init Container는 실행 시점(Pod 시작 전)이 다르므로 라이프사이클 중심으로 별도 정리
- **3편**: Native Sidecar는 K8s 1.28+에서 추가된 새로운 스펙으로, 1편의 기존 Sidecar와 비교하며 심화

### 1.4 대상 독자

- Kubernetes 기본 개념(Pod, Deployment, Service)은 아는 개발자
- Pod에 여러 컨테이너를 넣는 이유와 패턴을 체계적으로 이해하고 싶은 개발자
- Istio, Fluentd 등 도구가 왜 Sidecar로 동작하는지 궁금한 개발자

### 1.5 관련 Repo

- **샘플 코드**: `tutorials-go/kubernetes/pod-design-patterns/`에 K8s manifest + Go 예제 작성
- **블로그**: `blog-v2.advenoh.pe.kr`

---

## 2. 1편: Multi-Container Pod 패턴 - Sidecar, Ambassador, Adapter

### 2.1 블로그 메타 정보

```yaml
---
title: "K8s Pod 디자인 패턴 (1) - Sidecar, Ambassador, Adapter"
description: "Kubernetes Multi-Container Pod의 3가지 런타임 패턴(Sidecar, Ambassador, Adapter)을 개념, 사례, 실전 YAML과 함께 비교 정리한다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - kubernetes
  - sidecar
  - ambassador
  - adapter
  - pod-design-pattern
  - multi-container
  - kind
series: "K8s Pod 디자인 패턴"
---
```

- **Draft 위치**: `docs/start/k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter/index.md`
- **Publish 위치**: `contents/cloud/k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter/`

### 2.2 목차

```
# 1. 실습 환경 준비
  ## 1.1 사전 준비물
    - Docker, kubectl, Kind 설치 확인
  ## 1.2 Kind 클러스터 생성
    - kind-config.yaml 작성 (워커 노드 구성)
    - kind create cluster --config kind-config.yaml
    - kubectl cluster-info로 연결 확인
  ## 1.3 샘플 이미지 빌드 & 로드
    - 실습에 사용할 Go 앱 이미지 빌드
    - kind load docker-image로 클러스터에 로드
    - (Docker Hub 없이 로컬에서 완결)

# 2. Multi-Container Pod이란?
  ## 2.1 왜 하나의 Pod에 여러 컨테이너를 넣는가?
    - Pod 내 컨테이너는 네트워크(localhost), 스토리지(Volume)를 공유
    - "하나의 프로세스 = 하나의 컨테이너" 원칙과 보조 컨테이너의 역할
    - 단일 컨테이너 vs 멀티 컨테이너 Pod 비교
  ## 2.2 3가지 런타임 패턴 개요
    - Mermaid 다이어그램: Sidecar, Ambassador, Adapter를 한눈에 비교
    - 각 패턴의 핵심 한 줄 요약
    - (Init Container는 2편에서 별도 다룸을 안내)

# 3. Sidecar 패턴
  ## 3.1 개념
    - 메인 컨테이너의 기능을 변경하지 않고 확장/보강
    - 관심사 분리(Separation of Concerns) 원칙
    - Mermaid 다이어그램: 메인 컨테이너 ↔ Sidecar 관계
  ## 3.2 대표 사용 사례
    - 로그 수집 (Fluentd/Fluent Bit): 메인 앱 로그를 Sidecar가 수집하여 외부 전송
    - 서비스 메시 (Istio Envoy, Linkerd): 트래픽 관리/mTLS를 앱 코드 변경 없이 제공
    - 시크릿 관리 (Vault Agent): 시크릿을 주기적으로 갱신하여 공유 Volume에 기록
  ## 3.3 실전 예제: Go Request Logger Sidecar
    - 직접 만든 Go Reverse Proxy Sidecar (요청 로깅 + 응답 시간 측정)
    - 구조: Client → Sidecar(:8080, 프록시+로깅) → Main App(:3000)
    - Go 코드 설명 (httputil.ReverseProxy 기반)
    - K8s YAML manifest 전체 (공유 Volume으로 로그 파일 기록)
    - 실습: kubectl apply → curl 요청 → kubectl exec로 로그 확인

# 4. Ambassador 패턴
  ## 4.1 개념
    - 메인 컨테이너 대신 외부 서비스와 통신하는 프록시 역할
    - 메인 앱은 localhost로만 접근 → Ambassador가 외부 라우팅 처리
    - Sidecar와의 차이: Sidecar는 "확장", Ambassador는 "대리"
    - Mermaid 다이어그램: App → Ambassador → External Service
  ## 4.2 대표 사용 사례
    - DB 커넥션 풀링 (PgBouncer, ProxySQL)
    - 멀티 환경 라우팅 (dev/staging/prod DB를 Ambassador가 선택)
    - Rate limiting 프록시
  ## 4.3 실전 예제: Redis Ambassador
    - 메인 앱 → localhost:6379 → Ambassador → 실제 Redis 클러스터
    - K8s YAML manifest
    - 실습: kubectl apply → 앱에서 Redis 접근 → Ambassador 로그 확인

# 5. Adapter 패턴
  ## 5.1 개념
    - 메인 컨테이너의 출력을 외부 시스템이 기대하는 형식으로 변환
    - Sidecar와의 차이: Sidecar는 "기능 추가", Adapter는 "형식 변환"
    - Mermaid 다이어그램: App → (raw output) → Adapter → (standardized) → External
  ## 5.2 대표 사용 사례
    - Prometheus exporter (커스텀 메트릭 → Prometheus 형식)
    - 로그 포맷 변환 (앱별 다른 형식 → JSON 표준화)
    - 프로토콜 변환 (gRPC → REST)
  ## 5.3 실전 예제: Prometheus Exporter Adapter
    - 메인 앱이 /stats에 커스텀 JSON 메트릭 → Adapter가 /metrics로 Prometheus 형식 변환
    - K8s YAML manifest
    - 실습: kubectl apply → curl /metrics → Prometheus 형식 확인

# 6. 패턴 비교 & 선택 가이드
  ## 6.1 한눈에 비교
    - 표: 패턴별 목적, 통신 방향, 대표 사례 비교
  ## 6.2 의사결정 플로우차트
    - Mermaid flowchart: "어떤 패턴을 써야 할까?" 의사결정 트리
  ## 6.3 실무 팁
    - Sidecar 남용 주의: 리소스 오버헤드, Pod 복잡도 증가
    - 실무에서는 직접 구현보다 기존 도구(Istio, Fluentd 등) 활용 권장

# 7. 정리
  ## 7.1 실습 환경 정리
    - kind delete cluster
  ## 7.2 3가지 패턴 핵심 요약
  ## 7.3 다음 편 예고: Init Container 완벽 가이드

# 참고
```

### 2.3 다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid flowchart | 3가지 런타임 패턴 전체 개요 비교 구조도 |
| 2 | Mermaid flowchart | Sidecar 패턴 구조 (Client → Sidecar → Main App) |
| 3 | Mermaid flowchart | Ambassador 패턴 구조 (App → Ambassador → External) |
| 4 | Mermaid flowchart | Adapter 패턴 구조 (App → Adapter → External) |
| 5 | Mermaid flowchart | 패턴 선택 의사결정 플로우차트 |

---

## 3. 2편: Init Container 완벽 가이드

### 3.1 블로그 메타 정보

```yaml
---
title: "K8s Pod 디자인 패턴 (2) - Init Container 완벽 가이드"
description: "Kubernetes Init Container의 개념, 실행 순서, 실전 사례(DB 대기, 마이그레이션, 설정 다운로드)를 예제와 함께 정리한다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - kubernetes
  - init-container
  - pod-lifecycle
  - pod-design-pattern
  - database-migration
series: "K8s Pod 디자인 패턴"
---
```

- **Draft 위치**: `docs/start/k8s-pod-디자인-패턴-2-init-container-완벽-가이드/index.md`
- **Publish 위치**: `contents/cloud/k8s-pod-디자인-패턴-2-init-container-완벽-가이드/`

### 3.2 목차

```
# 1. Init Container란?
  ## 1.1 개념
    - Pod의 메인 컨테이너 시작 전에 실행되는 초기화 전용 컨테이너
    - 일반 컨테이너와의 차이 (프로브 없음, 완료되면 종료, 순차 실행)
    - Mermaid sequence: Init Container 실행 흐름
  ## 1.2 왜 Init Container를 쓰는가?
    - 관심사 분리: 초기화 로직을 앱 코드에서 분리
    - 보안: 초기화에만 필요한 도구/권한을 메인 컨테이너에 포함하지 않음
    - 의존성 관리: 메인 앱이 시작되기 전 선행 조건 보장

# 2. Pod 라이프사이클과 Init Container
  ## 2.1 실행 순서
    - init1 완료 → init2 실행 → ... → 모든 init 완료 → 메인 컨테이너 시작
    - Mermaid sequence diagram: 전체 라이프사이클
  ## 2.2 실패 시 동작
    - Init Container 실패 → Pod 재시작 (restartPolicy에 따라)
    - Always: 무한 재시작, OnFailure: 실패 시만, Never: 재시작 안 함
    - 디버깅 방법: kubectl describe pod, kubectl logs -c init-container-name
  ## 2.3 리소스 관리
    - Init Container의 리소스 요청/제한이 Pod 전체에 미치는 영향
    - 가장 높은 init container의 리소스 요청이 Pod의 effective request

# 3. 대표 사용 사례
  ## 3.1 의존성 대기 (wait-for-service)
    - DB, Redis, 외부 API 등 의존 서비스가 준비될 때까지 대기
    - busybox + nslookup/nc 활용
    - YAML 예제
  ## 3.2 설정 파일 생성/다운로드
    - 원격 설정 다운로드 (S3, ConfigMap 렌더링)
    - 공유 Volume에 설정 파일 기록 → 메인 컨테이너가 읽기
    - YAML 예제
  ## 3.3 DB 마이그레이션
    - Flyway, Liquibase, golang-migrate 등 스키마 마이그레이션 실행
    - 마이그레이션 완료 후 앱 시작 보장
    - YAML 예제
  ## 3.4 파일 권한 설정
    - Volume 마운트 후 파일 소유자/권한 변경 (chown, chmod)
    - 보안 컨텍스트(SecurityContext)와 함께 사용
    - YAML 예제

# 4. 실전 예제: Init Container 체이닝
  ## 4.1 시나리오
    - Init 1: DB 서비스 대기 (wait-for-db)
    - Init 2: 설정 파일 다운로드 (download-config)
    - Main: Go 웹 서버
  ## 4.2 전체 K8s YAML manifest
  ## 4.3 동작 확인
    - kubectl get pod -w (상태 변화 관찰)
    - kubectl logs -c init-container-name
    - kubectl describe pod

# 5. Init Container vs Sidecar 비교
  ## 5.1 실행 시점 차이
    - Init: Pod 시작 전 1회 실행 후 종료
    - Sidecar: Pod와 함께 계속 실행
  ## 5.2 언제 어떤 것을 쓸까?
    - 표: 판단 기준별 Init vs Sidecar 비교
    - "1회성 초기화 → Init, 지속적 보조 → Sidecar"
  ## 5.3 함께 쓰는 패턴
    - Init Container로 초기화 + Sidecar로 런타임 보조 (조합 예제)

# 6. 마무리
  - Init Container 핵심 정리
  - 다음 편 예고: K8s Native Sidecar (KEP-753)

# 참고
```

### 3.3 다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid sequence | Init Container 실행 흐름 (init1 → init2 → main) |
| 2 | Mermaid sequence | Pod 전체 라이프사이클 (init → main → termination) |
| 3 | Mermaid flowchart | Init Container 실패 시 동작 흐름 |
| 4 | Mermaid flowchart | Init Container vs Sidecar 판단 기준 |

---

## 4. 3편: K8s Native Sidecar (KEP-753)와 Pod 라이프사이클

### 4.1 블로그 메타 정보

```yaml
---
title: "K8s Pod 디자인 패턴 (3) - Native Sidecar (KEP-753)와 Pod 라이프사이클"
description: "K8s 1.28+에서 도입된 Native Sidecar Container의 개념, 기존 Sidecar와의 차이, 시작/종료 순서 보장, 마이그레이션 방법을 정리한다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - kubernetes
  - sidecar
  - native-sidecar
  - KEP-753
  - pod-lifecycle
  - pod-design-pattern
  - istio
series: "K8s Pod 디자인 패턴"
---
```

- **Draft 위치**: `docs/start/k8s-pod-디자인-패턴-3-native-sidecar-kep-753/index.md`
- **Publish 위치**: `contents/cloud/k8s-pod-디자인-패턴-3-native-sidecar-kep-753/`

### 4.2 목차

```
# 1. 기존 Sidecar의 문제점
  ## 1.1 종료 순서 문제
    - 메인 컨테이너가 먼저 종료 → Sidecar가 로그/메트릭 유실
    - Sidecar가 먼저 종료 → 메인 컨테이너가 네트워크 잃음 (Istio Envoy 사례)
    - Mermaid sequence: 기존 방식의 종료 순서 문제 시각화
  ## 1.2 시작 순서 문제
    - 메인 컨테이너와 Sidecar가 동시 시작 → Sidecar 준비 전에 메인이 요청 시도
    - preStop hook, sleep 등 우회 방법의 한계
  ## 1.3 Job/CronJob에서의 문제
    - 메인 컨테이너 완료 후 Sidecar가 종료되지 않음 → Job이 영원히 완료 안 됨

# 2. Native Sidecar Container (KEP-753)
  ## 2.1 개념
    - initContainers에 restartPolicy: Always를 지정하는 새로운 방식
    - K8s 1.28 Alpha → 1.29 Beta → 1.33 Stable 히스토리
    - 공식 스펙 정의와 기존 일반 컨테이너 Sidecar와의 차이
  ## 2.2 동작 방식
    - 시작 순서: Native Sidecar → 다음 init container → 메인 컨테이너
    - 종료 순서: 메인 컨테이너 종료 → Native Sidecar 종료 (역순 보장)
    - Mermaid sequence: Native Sidecar의 라이프사이클
  ## 2.3 YAML 문법
    - 기존 방식 vs Native Sidecar YAML 비교
    - initContainers + restartPolicy: Always 핵심 필드
    - startupProbe, livenessProbe 활용

# 3. 기존 방식 vs Native Sidecar 비교
  ## 3.1 라이프사이클 비교
    - Mermaid diagram: 기존 vs Native의 시작/종료 순서 병렬 비교
    - 표: 항목별 차이 (시작 순서, 종료 순서, Job 호환, 프로브 지원 등)
  ## 3.2 어떤 경우에 Native Sidecar를 써야 하나?
    - 반드시 써야 하는 경우: Job/CronJob + Sidecar, 종료 순서가 중요한 경우
    - 기존 방식도 괜찮은 경우: 단순한 로그 수집, 순서 무관한 보조 작업
  ## 3.3 K8s 버전별 지원 현황
    - 1.28 (Alpha, 피처게이트 필요) → 1.29+ (Beta, 기본 활성화) → 1.33 (Stable)
    - 클라우드 프로바이더별 지원 상태 (EKS, GKE, AKS)

# 4. 실전 예제
  ## 4.1 로그 수집 Native Sidecar
    - 1편의 Fluent Bit Sidecar 예제를 Native Sidecar로 전환
    - YAML 전체 + 동작 확인
  ## 4.2 Request Logger를 Native Sidecar로 전환
    - 1편의 Go Request Logger Sidecar를 Native Sidecar로 전환
    - 기존 방식 대비 시작/종료 순서 개선 확인
  ## 4.3 Job + Native Sidecar
    - Job 완료 시 Sidecar도 자동 종료되는 예제
    - 기존 방식에서의 문제점 재현 → Native Sidecar로 해결

# 5. 마이그레이션 가이드
  ## 5.1 기존 Sidecar → Native Sidecar 전환 방법
    - containers[] → initContainers[] + restartPolicy: Always
    - 주의사항: 프로브 설정, 리소스 요청 변경점
  ## 5.2 호환성 체크리스트
    - K8s 버전 확인
    - Helm 차트/Operator 호환성
    - 모니터링 도구 호환성

# 6. 마무리
  - 시리즈 전체 회고 (1~3편 요약)
  - Native Sidecar 도입 권장 시나리오 정리

# 참고
```

### 4.3 다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid sequence | 기존 Sidecar의 종료 순서 문제 시각화 |
| 2 | Mermaid sequence | Native Sidecar의 라이프사이클 (시작/종료 순서) |
| 3 | Mermaid sequence | 기존 vs Native 라이프사이클 병렬 비교 |
| 4 | Mermaid flowchart | Native Sidecar 도입 판단 기준 |

---

## 5. 작성 규칙 (전 편 공통)

### 5.1 코드/매니페스트 작성 규칙
- K8s YAML manifest 예제는 실제 동작 가능한 완전한 형태로 작성
- 샘플 앱 코드(Go)는 `tutorials-go/kubernetes/pod-design-patterns/`에 작성
- K8s manifest는 샘플 코드와 함께 동일 디렉토리에 배치
- 간단한 Go 웹 서버를 메인 컨테이너로 사용하여 각 패턴 시연

### 5.2 다이어그램 규칙
- Mermaid 형식으로 작성 (ASCII art 금지)
- 노드 텍스트에 `<br/>` 등 HTML 태그 사용 금지

### 5.3 시리즈 연결
- 각 편 상단에 시리즈 네비게이션 포함:
  ```
  > **K8s Pod 디자인 패턴 시리즈**
  > - **1편**: [Sidecar, Ambassador, Adapter](../link)
  > - **2편**: [Init Container 완벽 가이드](../link)
  > - **3편**: [Native Sidecar (KEP-753)](../link)
  ```
- 이전 편 개념 재설명 금지, "1편 참조" 링크로 대체

### 5.4 스타일
- 개념 → 사례 → 실전 YAML 순서로 구성
- "왜 이 패턴이 필요한가"를 먼저 설명한 후 구현
- 패턴 간 혼동하기 쉬운 부분을 명확히 구분

---

## 6. 구현 순서 (마일스톤)

| 단계 | 작업 | 산출물 |
|------|------|--------|
| **1편** | | |
| M1-1 | 1편 샘플 코드 작성 (Sidecar, Ambassador, Adapter YAML) | `tutorials-go/kubernetes/pod-design-patterns/` |
| M1-2 | Kind 클러스터에서 동작 검증 | 검증 완료 |
| M1-3 | 1편 블로그 초안 작성 | `docs/start/k8s-pod-디자인-패턴-1-.../index.md` |
| M1-4 | PR 생성 + 리뷰 + Publish | `contents/cloud/` |
| **2편** | | |
| M2-1 | 2편 샘플 코드 작성 (Init Container 체이닝 예제) | `tutorials-go/kubernetes/pod-design-patterns/` |
| M2-2 | 2편 블로그 초안 작성 | `docs/start/k8s-pod-디자인-패턴-2-.../index.md` |
| M2-3 | PR 생성 + 리뷰 + Publish | `contents/cloud/` |
| **3편** | | |
| M3-1 | 3편 샘플 코드 작성 (Native Sidecar YAML, Job 예제) | `tutorials-go/kubernetes/pod-design-patterns/` |
| M3-2 | 3편 블로그 초안 작성 | `docs/start/k8s-pod-디자인-패턴-3-.../index.md` |
| M3-3 | PR 생성 + 리뷰 + Publish | `contents/cloud/` |

---

## 7. 논의사항

### 7.1 실전 예제 깊이
- [x] Kind 클러스터 생성부터 전체 실습 가이드 포함 (결정 완료)

### 7.2 Sidecar 예제
- [x] Istio 대신 직접 만든 Go Sidecar로 예제 작성 (결정 완료)
  - 요청 로깅/메트릭 수집용 간단한 Go Reverse Proxy Sidecar
  - 내부 동작을 100% 이해할 수 있어 교육적
  - Istio 등 실무 도구는 사례로만 간략 언급

### 7.3 작성 순서
- [x] 1편 → 2편 → 3편 순차 작성 (결정 완료)
  - 개념 빌드업 순서: 런타임 패턴 → 초기화 패턴 → 심화 (Native Sidecar)

---

## 8. 참고 자료

- [Kubernetes 공식 문서 - Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Kubernetes 공식 문서 - Sidecar Containers](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/)
- [KEP-753: Sidecar Containers](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/753-sidecar-containers)
- [The Distributed System ToolKit: Patterns for Composite Containers (Brendan Burns)](https://kubernetes.io/blog/2015/06/the-distributed-system-toolkit-patterns/)
- Kubernetes Patterns (O'Reilly, Bilgin Ibryam & Roland Huß)
- [Multi-Container Pod Design Patterns in Kubernetes](https://matthewpalmer.net/kubernetes-app-developer/articles/multi-container-pod-design-patterns.html)
