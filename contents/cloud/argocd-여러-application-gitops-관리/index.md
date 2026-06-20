---
title: "ArgoCD에서 여러 Application을 GitOps로 관리하기: App of Apps vs ApplicationSet"
description: "ArgoCD의 App of Apps와 ApplicationSet 패턴을 비교하고, 여러 애플리케이션을 GitOps 방식으로 효율적으로 배포하는 방법을 알아본다"
date: 2026-03-10
update: 2026-03-10
tags:
  - argocd
  - argo
  - kubernetes
  - k8s
  - gitops
  - applicationset
  - app-of-apps
  - helm
  - generator
  - matrix
  - 배포
  - 쿠버네티스
  - 멀티앱관리
  - 헬름차트
series: "ArgoCD"
---

# 1. 개요

![cover](cover.png)

`GitOps` 환경에서 `Helm Chart`로 여러 애플리케이션을 관리할 때, 각 애플리케이션마다 `ArgoCD` Application을 수동으로 생성하는 것은 번거롭고 실수가 발생하기 쉽다.

예를 들어, 다음과 같은 `Helm Chart` 구조가 있다고 가정해보자.

```
chart/
├── echo-server/
├── hello-world-server/
└── hello-world-server-hook/
```

이 3개의 애플리케이션을 `ArgoCD`로 배포하려면 어떻게 해야 할까?

## 1.1 ArgoCD가 제공하는 배포 패턴

| 패턴 | 설명 | 자동화 수준 | 유연성 |
| --- | --- | --- | --- |
| **단일 Application** | 각 앱마다 수동으로 Application 생성 | 낮음 | 높음 |
| **App of Apps** | 부모 Application이 자식 Application들을 관리 | 중간 | 중간 |
| **ApplicationSet** | `Generator`를 통해 Application을 동적 생성 | 높음 | 매우 높음 |

이 글에서는 **App of Apps** 패턴과 **ApplicationSet** 패턴을 실제 예제와 함께 비교해본다.

> 전체 샘플 코드: [kenshin579/argocd-charts-sample](https://github.com/kenshin579/argocd-charts-sample)

---

# 2. 단일 Application

가장 기본적인 방식으로, 하나의 Application `YAML`을 직접 작성하여 배포한다.

```yaml
# bootstrap/single-app/single.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello-world-server
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kenshin579/argocd-charts-sample
    path: chart/hello-world-server
    targetRevision: HEAD
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd-test
```

```bash
kubectl apply -f bootstrap/single-app/single.yaml -n argocd
```

애플리케이션이 몇 개 안 될 때는 문제없지만, 관리 대상이 늘어나면 `YAML` 파일을 반복적으로 작성해야 하므로 유지보수가 어려워진다.

---

# 3. App of Apps 패턴

## 3.1 개념

부모 Application이 자식 Application 매니페스트가 있는 디렉토리를 참조하는 구조다. `ArgoCD`의 기본 기능만으로 구현할 수 있다.

```
bootstrap/app-of-apps/
├── apps.yaml                          # 부모 Application
└── applications/
    ├── echo-server.yaml               # 자식 Application 1
    ├── hello-world-server.yaml        # 자식 Application 2
    └── hello-world-server-hook.yaml   # 자식 Application 3
```

## 3.2 부모 Application

부모 Application은 `applications/` 디렉토리를 `source.path`로 지정한다. 이 디렉토리 안의 모든 Application 매니페스트를 `ArgoCD`가 자동으로 감지하여 생성한다.

```yaml
# bootstrap/app-of-apps/apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app-of-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kenshin579/argocd-charts-sample
    path: bootstrap/app-of-apps/applications
    targetRevision: HEAD
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 3.3 자식 Application

각 자식 Application은 개별 `Helm Chart`를 참조하는 별도의 `YAML` 파일로 정의한다.

```yaml
# bootstrap/app-of-apps/applications/echo-server.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: echo-server
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kenshin579/argocd-charts-sample
    path: chart/echo-server
    targetRevision: HEAD
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd-test
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# bootstrap/app-of-apps/applications/hello-world-server.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello-world-server
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kenshin579/argocd-charts-sample
    path: chart/hello-world-server
    targetRevision: HEAD
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd-test
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 3.4 배포

```bash
kubectl apply -f bootstrap/app-of-apps/apps.yaml -n argocd
```

부모 Application을 배포하면, `ArgoCD`가 `applications/` 디렉토리의 `YAML` 파일들을 읽어 자식 Application들을 자동으로 생성한다.

## 3.5 장단점

**장점**
- 개념이 단순하고 이해하기 쉬움
- 각 Application을 독립적으로 세밀하게 제어 가능
- 디버깅이 용이함 (어떤 Application이 문제인지 바로 파악 가능)

**단점**
- 새 애플리케이션 추가 시 매번 `YAML` 파일 작성 필요
- 애플리케이션이 많아지면 관리해야 할 파일 수가 증가
- 중복 코드가 발생하기 쉬움

---

# 4. ApplicationSet 패턴

## 4.1 개념

ApplicationSet은 `Generator`를 사용해 Application을 동적으로 생성하는 `ArgoCD`의 확장 기능이다(ArgoCD 2.0+). 템플릿 기반으로 여러 Application을 한 번에 정의할 수 있어 `DRY` 원칙을 지킬 수 있다.

주요 `Generator` 유형은 다음과 같다.

| `Generator` | 설명 |
| --- | --- |
| `List` | 명시적으로 애플리케이션 목록 정의 |
| `Git` | `Git` 저장소의 디렉토리 구조를 자동 탐지 |
| `Matrix` | 여러 `Generator`를 조합하여 조합(cartesian product) 생성 |
| `Cluster` | 등록된 클러스터 목록 기반으로 생성 |

## 4.2 List Generator

배포할 애플리케이션 목록을 명시적으로 나열한다. 각 항목에 이름, 경로, 네임스페이스 등을 지정할 수 있다.

```yaml
# bootstrap/application-set/appset-list.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: chart-applications-list
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - name: echo-server
            path: chart/echo-server
            namespace: argocd-test
          - name: hello-world-server
            path: chart/hello-world-server
            namespace: argocd-test
          - name: hello-world-server-hook
            path: chart/hello-world-server-hook
            namespace: argocd-test
  template:
    metadata:
      name: '{{name}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/kenshin579/argocd-charts-sample
        targetRevision: HEAD
        path: '{{path}}'
        helm:
          valueFiles:
            - values.yaml
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

```bash
kubectl apply -f bootstrap/application-set/appset-list.yaml -n argocd
```

`template` 블록에서 `{{name}}`, `{{path}}`, `{{namespace}}` 변수가 `generators.list.elements`의 각 항목으로 치환되어 Application이 생성된다.

## 4.3 Git Generator

`Git` 저장소의 디렉토리 구조를 자동으로 탐지하여 Application을 생성한다. 새로운 `Chart` 디렉토리를 추가하면 별도 설정 변경 없이 Application이 자동으로 생성된다.

```yaml
# bootstrap/application-set/appset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: chart-applications
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/kenshin579/argocd-charts-sample
        revision: HEAD
        directories:
          - path: chart/*
  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/kenshin579/argocd-charts-sample
        targetRevision: HEAD
        path: '{{path}}'
        helm:
          valueFiles:
            - values.yaml
      destination:
        server: https://kubernetes.default.svc
        namespace: argocd-test
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

```bash
kubectl apply -f bootstrap/application-set/appset.yaml -n argocd
```

`chart/*` 경로의 모든 하위 디렉토리를 탐지하여 `{{path.basename}}`(디렉토리명)을 Application 이름으로 사용한다. `chart/new-app/` 디렉토리를 추가하기만 하면 자동으로 `new-app` Application이 생성된다.

## 4.4 Matrix Generator

여러 `Generator`를 조합하여 cartesian product를 생성한다. 다중 환경(`dev`/`staging`/`prod`) 배포에 유용하다.

```yaml
# bootstrap/application-set/appset-matrix.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: chart-applications-matrix
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - git:
              repoURL: https://github.com/kenshin579/argocd-charts-sample
              revision: HEAD
              directories:
                - path: chart/*
          - list:
              elements:
                - env: dev
                  namespace: argocd-dev
                  replicas: "1"
                - env: staging
                  namespace: argocd-staging
                  replicas: "2"
                - env: prod
                  namespace: argocd-prod
                  replicas: "3"
  template:
    metadata:
      name: '{{path.basename}}-{{env}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/kenshin579/argocd-charts-sample
        targetRevision: HEAD
        path: '{{path}}'
        helm:
          valueFiles:
            - values.yaml
          parameters:
            - name: replicaCount
              value: '{{replicas}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

```bash
kubectl apply -f bootstrap/application-set/appset-matrix.yaml -n argocd
```

`Git Generator`가 탐지한 3개 Chart × `List Generator`의 3개 환경 = 총 9개 Application이 생성된다.

- `echo-server-dev`, `echo-server-staging`, `echo-server-prod`
- `hello-world-server-dev`, `hello-world-server-staging`, `hello-world-server-prod`
- `hello-world-server-hook-dev`, `hello-world-server-hook-staging`, `hello-world-server-hook-prod`

환경별로 `replicaCount`를 다르게 설정할 수 있어, 동일한 `Chart`를 환경에 맞게 배포할 수 있다.

## 4.5 장단점

**장점**

- `DRY` 원칙 준수 (중복 코드 최소화)
- 새 애플리케이션 추가가 간편 (**Git Generator** 사용 시 자동 탐지)
- 다중 환경 배포가 용이 (**Matrix Generator**)

**단점**

- `Generator`와 템플릿 문법에 대한 학습 필요
- 복잡한 요구사항에서 디버깅이 상대적으로 어려움
- 모든 Application에 동일한 설정이 적용되므로, 앱마다 완전히 다른 설정이 필요한 경우 부적합

---

# 5. App of Apps vs ApplicationSet 비교

| 구분 | App of Apps | ApplicationSet |
| --- | --- | --- |
| **Application 정의** | 각각 별도의 `YAML` 파일 | 템플릿 기반 동적 생성 |
| **새 앱 추가** | 새 `YAML` 파일 작성 필요 | `Generator`에 따라 자동 또는 목록에 추가 |
| **코드 중복** | 발생하기 쉬움 | 최소화 |
| **다중 환경 지원** | 파일 복제 필요 | `Matrix Generator`로 간편 구현 |
| **세밀한 제어** | 각 Application별 완전한 제어 가능 | 템플릿 내 변수로 제어 |
| **디버깅** | 쉬움 | 상대적으로 어려움 |
| **`ArgoCD` 버전** | 기본 기능 | `ArgoCD` 2.0+ |

## 5.1 언제 어떤 패턴을 사용할까?

**App of Apps가 적합한 경우**
- `ArgoCD`를 처음 도입하는 팀
- 각 Application마다 완전히 다른 설정이 필요한 경우
- Application 수가 적고 변경이 자주 없는 경우

**ApplicationSet이 적합한 경우**
- 많은 수의 Application을 관리해야 하는 경우
- 다중 환경(`dev`/`staging`/`prod`)에 동일한 앱을 배포하는 경우
- 새로운 애플리케이션이 자주 추가되는 경우
- 마이크로서비스 아키텍처에서 다수의 서비스를 관리하는 경우

---

# 6. FAQ

## 6.1 ApplicationSet에서 특정 Application을 삭제하려면?

ApplicationSet으로 생성된 Application을 `ArgoCD` UI나 `kubectl delete`로 직접 삭제하면, `ApplicationSet Controller`가 이를 감지하고 **다시 생성**한다.

올바른 삭제 방법은 `Generator`에서 해당 항목을 제거하는 것이다.

**`List Generator`에서 제거하는 경우:**

```yaml
# 변경 전
generators:
  - list:
      elements:
        - name: echo-server
          path: chart/echo-server
          namespace: argocd-test
        - name: hello-world-server
          path: chart/hello-world-server
          namespace: argocd-test

# 변경 후 (echo-server 제거)
generators:
  - list:
      elements:
        - name: hello-world-server
          path: chart/hello-world-server
          namespace: argocd-test
```

**`Git Generator`에서 제외하는 경우:**

```yaml
generators:
  - git:
      repoURL: https://github.com/kenshin579/argocd-charts-sample
      revision: HEAD
      directories:
        - path: chart/*
        - path: chart/echo-server
          exclude: true  # echo-server 제외
```

## 6.2 PreSync Job에 필요한 Secret을 먼저 생성하려면?

`ArgoCD`의 **`Sync Wave`**를 사용하여 리소스 생성 순서를 제어할 수 있다. `Sync Wave` 값이 낮은 리소스가 먼저 생성된다.

**Secret 정의 (sync-wave: "-1")**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hello-world-server-hook-secret
  namespace: argocd-test
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/sync-wave: "-1"  # 가장 먼저 실행
type: Opaque
data:
  common_secret.yaml: "dGVzdDoKICBkYXRhOgogICAgYXV0aF9rZXk6IC..."
```

**PreSync Job 정의 (sync-wave: "1")**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  generateName: presync-job1
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
    argocd.argoproj.io/sync-wave: "1"  # Secret 이후 실행
spec:
  backoffLimit: 2
  template:
    spec:
      volumes:
        - name: secret-volume
          secret:
            secretName: hello-world-server-hook-secret
      containers:
        - name: presync-job1
          image: busybox:1.36
          volumeMounts:
            - name: secret-volume
              mountPath: /opt/secret
          command:
            - /bin/sh
            - -c
            - |
              echo "Pre Sync Job - Secret 사용 가능"
              cat /opt/secret/common_secret.yaml
      restartPolicy: Never
```

**`Sync Wave` 실행 순서:**

```
sync-wave: "-1"  →  Secret 생성
sync-wave: "1"   →  PreSync Job 실행
(기본값: "0")    →  일반 리소스 배포 (Deployment, Service 등)
PostSync         →  PostSync Hook 실행
```

주요 Annotation 정리:

| Annotation | 설명 |
| --- | --- |
| `argocd.argoproj.io/hook` | `Hook` 타입 (`PreSync`, `Sync`, `PostSync`, `SyncFail`) |
| `argocd.argoproj.io/sync-wave` | 실행 순서 (낮은 값이 먼저 실행, 기본값: "0") |
| `argocd.argoproj.io/hook-delete-policy` | `Hook` 리소스 삭제 정책 (`BeforeHookCreation`, `HookSucceeded`, `HookFailed`) |

---

# 7. 마무리

`ArgoCD`에서 여러 애플리케이션을 관리하는 두 가지 주요 패턴을 살펴보았다.

- **App of Apps**: 직관적이고 각 Application을 개별적으로 제어할 수 있어 소규모 프로젝트나 `ArgoCD` 입문 단계에 적합하다.
- **ApplicationSet**: 템플릿 기반으로 중복을 줄이고 자동화 수준이 높아, 대규모 마이크로서비스나 다중 환경 배포에 적합하다.

두 패턴은 상호 배타적이지 않으므로, 프로젝트 규모와 요구사항에 따라 적절히 선택하거나 혼합하여 사용할 수 있다.

---

# 8. 참고

- [ArgoCD ApplicationSet Documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [ArgoCD App of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [ArgoCD Sync Waves and Hooks](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)
- [예제 Repository - kenshin579/argocd-charts-sample](https://github.com/kenshin579/argocd-charts-sample)
