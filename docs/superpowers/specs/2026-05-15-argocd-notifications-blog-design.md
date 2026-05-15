# 블로그 글 설계: ArgoCD Notifications 실전 (운영 환경에 무중단 적용)

**작성일**: 2026-05-15
**대상 레포**: `blog-v2.advenoh.pe.kr`
**브랜치**: `docs/argocd-notifications-blog`
**소스 PR**: [argocd-charts-sample#13](https://github.com/kenshin579/argocd-charts-sample/pull/13)

## 1. 목적

`argocd-charts-sample` 레포에서 진행한 ArgoCD Notifications 적용 작업(PR #13)을 토대로, **운영 중인 ArgoCD에 알림을 무중단으로 추가하는 패턴**을 다루는 블로그 글을 작성한다.

차별 포인트: 공식 문서/일반 튜토리얼은 "argo-cd Helm chart의 notifications 섹션을 켜라"식 단순 가이드인 반면, 이 글은 **이미 운영 중이라 Helm release 재배포가 어려운 production 시나리오**에서 별도 chart + ArgoCD Application + `ServerSideApply`로 깔끔히 추가하는 디자인 패턴을 설명한다.

## 2. 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 글 유형 | 개념 + 실습 가이드 (B) |
| 분량 | 1편 풍부한 단편 (~2,500-3,000 단어) |
| 핵심 메시지 | 운영 환경 무중단 적용 시나리오 |
| 코드 샘플 정책 | 핵심만 inline + 보일러플레이트는 GitHub 링크 |
| 시리즈 | 기존 `"ArgoCD"` 시리즈에 합류 |
| 카테고리 | `cloud/` (final publish 시) |

## 3. 메타데이터 (frontmatter)

```yaml
---
title: "ArgoCD Notifications 실전: 운영 중인 ArgoCD에 알림 무중단 추가하기"
description: "이미 운영 중인 ArgoCD에 알림을 어떻게 추가할까? Helm release 재배포 없이 별도 chart + ArgoCD Application으로 GitOps 패턴을 유지하며 OutOfSync / Sync Failed / Health Degraded 알림 시스템을 구축한다."
date: 2026-05-15
update: 2026-05-15
tags:
  - argocd
  - argo
  - notifications
  - alerts
  - webhook
  - kubernetes
  - k8s
  - gitops
  - helm
  - helm-chart
  - applicationset
  - serversideapply
  - 알림
  - 모니터링
  - 운영
  - 드리프트
series: "ArgoCD"
---
```

**파일 위치 (draft)**: `docs/start/argocd-notifications-운영-환경에-무중단-추가하기/index.md`
**커버 이미지**: `docs/start/argocd-notifications-운영-환경에-무중단-추가하기/cover.png` (별도 준비 또는 placeholder)

## 4. 글 아웃라인

7개 섹션. 흐름: 운영 환경의 문제 → ArgoCD Notifications 개념 → 우리의 디자인 결정 → 실습 → 검증 → 회고.

### 4.1 섹션 1: 개요 (~250 단어)

- **목적**: 글의 동기와 미리보기 제시
- **핵심 메시지**: "운영 중인 ArgoCD에 알림 추가는 표준 가이드대로 가기 어렵다"
- **포함 자료**:
  - 시작 동기: drift 알림이 필요했던 상황
  - 표준 방법(Helm values 추가)이 production에서 어려운 이유
  - 이 글에서 다룰 내용 미리보기 (3가지 trigger, 별도 chart 패턴, 검증)
  - **다이어그램 1**: 전체 구성도 (mermaid flowchart)
- **출처**: 신규 작성 + spec §1, §2

### 4.2 섹션 2: ArgoCD Notifications 개념 (~300 단어)

- **목적**: 알림 시스템의 빌딩 블록을 빠르게 정리
- **핵심 메시지**: "trigger / template / service / subscription 4가지가 어떻게 맞물리는가"
- **포함 자료**:
  - notifications-controller의 역할 (별도 Pod, 60초 polling)
  - 4가지 빌딩 블록 짧은 설명
  - **표 1**: 기본 trigger 카탈로그 (on-sync-succeeded, on-sync-failed, on-health-degraded, on-deployed, on-sync-status-unknown 등)
  - 결론: **OutOfSync 전용 trigger는 카탈로그에 없음 → 커스텀 작성 필요** (다음 섹션으로 hook)
  - **다이어그램 2**: 알림 발생 흐름 (mermaid sequence)
- **출처**: ArgoCD 공식 문서 + spec §7

### 4.3 섹션 3: 운영 환경에서의 문제와 디자인 결정 (~400 단어)

- **목적**: "왜 별도 chart인가"를 설득
- **핵심 메시지**: "argo-cd Helm release 재배포 없이도 GitOps로 알림을 관리할 수 있다"
- **포함 자료**:
  - 표준 방법: argo-cd Helm release values에 notifications 추가
  - production 문제: 재배포 위험, 변경 격리 어려움
  - **표 2**: 4가지 옵션 비교 (Terraform values 추가 / Raw manifest / 별도 Helm chart / App of Apps)
  - 우리 선택: 별도 Helm chart + ArgoCD Application + `ServerSideApply=true`
  - 핵심 트릭 강조: 기존 `argocd-notifications-cm`의 ownership을 field-level merge로 인수
  - **표 3**: 의사결정 트레일 (이미 spec §11에 있음)
- **출처**: spec §2, §11

### 4.4 섹션 4: 알림 설정 chart 작성 (~600 단어)

- **목적**: 가장 디자인 결정이 많은 부분 — chart 내부 상세
- **핵심 메시지**: "trigger 표현식에 namespace 필터 + oncePer 정책으로 격리와 노이즈 방지"
- **포함 자료**:
  - **코드 1**: `chart/argocd-notifications-config/` 디렉토리 트리
  - **코드 2**: `values.yaml` 전체 (3개 변수)
  - **코드 3**: `cm.yaml`의 trigger 3개 부분 (OutOfSync 커스텀 + Sync Failed + Health Degraded, namespace 필터, oncePer)
  - **코드 4**: `cm.yaml`의 template 1개 발췌 (out-of-sync, JSON shape) + 나머지 template은 GitHub 링크
  - **코드 5**: service + default subscription
  - 짧게 언급: `secret.yaml` 빈 secret의 ServerSideApply 인수 의도
  - **Helm escape 패턴 설명**: ArgoCD Notifications template 변수(`{{.app.metadata.name}}`)와 Helm 변수(`{{ .Values.targetNamespace }}`) 구분 → backtick escape (`{{`...`}}`)
- **출처**: PR #13의 chart/argocd-notifications-config 전체

### 4.5 섹션 5: webhook receiver + 부트스트랩 (~400 단어)

- **목적**: 수신 서버 구성 + GitOps 부트스트랩 일괄
- **핵심 메시지**: "수신은 별도 namespace로 격리, 부트스트랩은 multi-doc YAML 1개로 단순화"
- **포함 자료**:
  - `mendhak/http-https-echo`로 단순 수신 (Deployment + ClusterIP Service)
  - **코드 6**: `webhook-receiver/templates/deployment.yaml` 핵심 부분 (image + env)
  - 별도 namespace 격리 이유 (자기 자신이 알림 대상이 되는 것 방지 + 책임 분리)
  - 부트스트랩 multi-doc YAML 통합 결정 (한 번의 kubectl apply)
  - **코드 7**: `bootstrap/notifications.yaml` 전체 (53줄 — 한 번에 보여줄 가치 있음. 두 Application의 syncOptions 차이 강조: `CreateNamespace=true` vs `ServerSideApply=true`)
  - **코드 8**: 적용 명령어 (`kubectl apply -f bootstrap/notifications.yaml`)
- **출처**: PR #13의 chart/webhook-receiver, bootstrap/notifications.yaml

### 4.6 섹션 6: 검증 — 알림이 정말 오는가 (~600 단어)

- **목적**: "글대로 만들면 정말 알림이 온다"는 증거
- **핵심 메시지**: "4가지 시나리오에서 알림이 어떻게 다른지 payload로 직접 확인"
- **포함 자료**:
  - **코드 9**: 정상 설치 검증 (`kubectl get application`, `kubectl get pod`)
  - **코드 10**: 로그 tail 명령어
  - **시나리오 6.1 — Cluster Drift** (`kubectl scale`)
    - 명령어 + 기대 동작 + payload JSON 발췌 (`event: argocd.out-of-sync`)
  - **시나리오 6.2 — Git Drift** (values.yaml 변경 + push + refresh)
    - 명령어 + revision 차이 강조 + payload JSON
  - **시나리오 6.3 — Sync Failed** (잘못된 image)
    - 명령어 + payload JSON (`event: argocd.sync-failed`, `operation.message`)
  - **시나리오 6.4 — Health Degraded** (존재하지 않는 image tag → ImagePullBackOff)
    - 명령어 + payload JSON (`event: argocd.health-degraded`, `resources` 배열)
  - **시나리오 6.5 — Negative test** (다른 namespace는 알림 안 옴)
  - **표 4**: timing 특성 정리 (cluster drift ~10s, notifications polling 60s, oncePer 효과)
- **출처**: spec §8, plan Task 6-10

### 4.7 섹션 7: 정리 (~200 단어)

- **목적**: 회고 + 확장 방향
- **핵심 메시지**: "디자인 결정을 한눈에, 다음 단계는 무엇"
- **포함 자료**:
  - 디자인 결정 트레일 요약 표 (재게시 또는 §3과 다른 각도)
  - production 적용 시 추가 고려 사항:
    - Slack/Email 등 외부 service 통합 → secret에 token 추가
    - notifications-controller가 webhook 실패 시 retry 없음 → 알림 유실 가능
    - default subscription의 broad 영향
  - 다음 단계 후보 (Slack 연동, AppProject별 subscription, 알림 노이즈 관리)
  - 전체 코드: PR #13 링크
- **출처**: spec §9, §11

## 5. 시각자료 상세

### 5.1 cover.png

기존 ArgoCD 글 패턴(`cover.png` 사용). 별도 디자인 또는 placeholder. **이 글에서는 placeholder로 두고 사용자가 추후 교체** (블로그 글 작성 자체에 영향 없음).

### 5.2 다이어그램 1: 전체 구성도 (mermaid flowchart)

위치: 섹션 1 마지막

```
flowchart TB
  subgraph cluster["Kubernetes Cluster"]
    subgraph argocd["argocd namespace"]
      ctrl[notifications-controller]
      cm[(argocd-notifications-cm)]
      cm -- config --> ctrl
    end
    subgraph receiver["argocd-noti-receiver namespace"]
      whr["webhook-receiver Pod"]
    end
    subgraph test["argocd-noti-test namespace"]
      app["hello-world-server (manual sync)"]
    end
  end
  ctrl -. watch .-> app
  ctrl == POST webhook ==> whr
  Dev[Developer] -- kubectl logs -f --> whr
```

**제약 (CLAUDE.md):** 노드 텍스트에 `<br/>` 사용 금지 — 위처럼 단일 라인으로 작성.

### 5.3 다이어그램 2: 알림 발생 흐름 (mermaid sequence)

위치: 섹션 2 마지막

```
sequenceDiagram
  participant Dev as Developer
  participant K8s as Cluster
  participant AC as application-controller
  participant NC as notifications-controller
  participant WR as webhook-receiver

  Dev->>K8s: kubectl scale --replicas=3
  K8s-->>AC: Deployment changed
  AC->>AC: status → OutOfSync
  Note over NC: 60s polling
  NC->>AC: list Applications
  NC->>NC: trigger 매칭 (ns 필터 + sync.status)
  NC->>WR: POST JSON payload
  WR->>WR: stdout JSON 출력
  Dev->>WR: kubectl logs -f
  WR-->>Dev: payload 확인
```

## 6. 코드 inline 정책 매핑

각 섹션에 inline으로 들어가는 코드 vs GitHub 링크로 보낼 코드의 명확한 분리:

| 자료 | 형식 | 분량 |
|---|---|---|
| `chart/argocd-notifications-config/Chart.yaml` | GitHub 링크만 | 6줄 |
| `chart/argocd-notifications-config/values.yaml` | inline (코드 2) | 8줄 |
| `chart/argocd-notifications-config/templates/cm.yaml` (trigger 3개) | inline (코드 3) | ~25줄 |
| `cm.yaml`의 template 1개 (out-of-sync) | inline (코드 4) | ~25줄 |
| `cm.yaml`의 template 2개 (sync-failed, health-degraded) | GitHub 링크 + 짧은 차이점 설명 | (링크) |
| `cm.yaml`의 service + subscription | inline (코드 5) | ~10줄 |
| `chart/argocd-notifications-config/templates/secret.yaml` | inline 짧게 + ServerSideApply 의도 설명 | 5줄 |
| `chart/webhook-receiver/Chart.yaml` | GitHub 링크 | 6줄 |
| `chart/webhook-receiver/values.yaml` | GitHub 링크 | 9줄 |
| `chart/webhook-receiver/templates/deployment.yaml` | inline 핵심 부분 (코드 6) | ~15줄 |
| `chart/webhook-receiver/templates/service.yaml` | GitHub 링크 | 12줄 |
| `bootstrap/notifications.yaml` | inline 전체 (코드 7) | 53줄 |
| `bootstrap/application-set/appset-noti-test.yaml` | GitHub 링크 + 한 줄 언급 | 36줄 |
| 적용/검증 명령어 (코드 8-16) | inline 전체 | 짧음 |
| webhook payload JSON (4개 시나리오) | inline 발췌 | ~80줄 |

**총 inline 코드 라인 수 가늠**: ~250-300줄. 글 본문 크기 대비 적정.

## 7. 표 일람

| 표 | 위치 | 내용 |
|---|---|---|
| 표 1 | 섹션 2 | 기본 trigger 카탈로그 (8개 trigger의 의미와 운영 가치) |
| 표 2 | 섹션 3 | 4가지 통합 옵션 비교 (장단점) |
| 표 3 | 섹션 3 | 의사결정 트레일 (Why) |
| 표 4 | 섹션 6 | timing 특성 (감지/polling/oncePer) |
| 표 5 | 섹션 7 | 디자인 결정 요약 (재게시) — 또는 §3 표 3과 통합 |

## 8. 참고 자료 (글 끝에 링크)

- [argocd-charts-sample 레포](https://github.com/kenshin579/argocd-charts-sample)
- [PR #13](https://github.com/kenshin579/argocd-charts-sample/pull/13)
- [ArgoCD Notifications 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/)
- [ArgoCD Notifications Catalog](https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/catalog/)
- [기존 ArgoCD 시리즈 글](https://blog.advenoh.pe.kr) (App of Apps vs ApplicationSet, Resource Hooks)

## 9. 제약사항 (CLAUDE.md 준수)

- ASCII art 다이어그램 금지 → mermaid만 사용
- 노드 텍스트에 `<br/>`, `<br>` 금지
- frontmatter에 `category` 키 추가 금지 (디렉토리 구조로 결정)
- 한글 인코딩 UTF-8 (작성 후 `file -I` 확인)
- 작성 위치: `docs/start/{글-제목}/index.md` (publish 단계가 아니므로 `contents/`에 직접 넣지 않음)
- 커밋 메시지: 한국어, `[#이슈번호]` 또는 `[브랜치명]` prefix

## 10. 글 작성 후 검증 항목

작성 후 self-review 시 확인할 것:
- [ ] frontmatter 필드(title/description/date/update/tags/series) 모두 정확
- [ ] 모든 mermaid 코드블록이 ` ```mermaid `로 시작
- [ ] 노드 텍스트에 `<br/>` 없음
- [ ] inline 코드의 helm escape 패턴(`{{`...`}}`) 정확
- [ ] GitHub 링크는 `argocd-charts-sample`의 main branch 파일을 가리키는지 확인
- [ ] 4개 시나리오 모두 webhook payload JSON 발췌 포함
- [ ] 7개 섹션 헤더 깊이 일관 (`##` 섹션, `###` 서브섹션)
- [ ] 한글 인코딩 UTF-8 (`file -I docs/start/.../index.md`)
- [ ] 분량 ~2,500-3,000 단어 (`wc -w`)

## 11. 범위 외 (Out of Scope)

- 커버 이미지(`cover.png`) 디자인 — placeholder로 두고 사용자가 추후 교체
- ArgoCD 설치 자체 가이드 — 기존 ArgoCD 시리즈 글에 있음 (링크만)
- Slack/Email 등 외부 service 통합 상세 — "다음 단계" 섹션에서 언급만
- Mermaid 다이어그램 외의 시각자료 (스크린샷 등) — 텍스트 + 코드로 충분
- AppProject 단위 subscription — spec §12와 동일
- 실제 cluster validation 수행 결과 — 글은 "어떻게 검증할 수 있는지" 가이드를 담되, 실측 결과 캡처는 사용자 환경 의존
