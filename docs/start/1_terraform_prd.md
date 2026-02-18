# Terraform 블로그 포스트 PRD

> 상태: 목차 확정
> 작성일: 2026-02-18

---

## 1. 개요

Terraform을 스터디하면서 블로그 포스트로 작성한다.

- **블로그**: `blog-v2.advenoh.pe.kr/contents/devops/`
- **샘플 코드**: `tutorials-go/cloud/terraform/`
- **실제 운영 참고**: `charts/` (Kind + ArgoCD + Helm 기반 GitOps)

---

## 2. 블로그 목차 (안)

### 제목: "Terraform 완벽 가이드: 기본 개념부터 GitOps 실전까지"

```
1. 들어가며
   - IaC(Infrastructure as Code)란?
   - Terraform을 선택한 이유 (vs Pulumi, CloudFormation, Ansible)

2. Terraform 기본 개념
   - HCL(HashiCorp Configuration Language) 문법
   - Provider / Resource / Data Source
   - Variable / Output / Local
   - State 파일과 상태 관리
   - Module 구조

3. 아키텍처
   - Terraform 동작 원리 (Init → Plan → Apply → Destroy)
   - Provider Plugin 아키텍처
   - State 관리 방식 (Local vs Remote)
   - 의존성 그래프 (Dependency Graph)

4. 설치 및 기본 사용법
   - 설치 방법 (brew, tfenv)
   - 주요 CLI 명령어 (init, plan, apply, destroy, validate, fmt)
   - .tf 파일 구조 컨벤션

5. 실습: Kind 클러스터 + ArgoCD 배포
   - 실습 목표 및 아키텍처 다이어그램
   - Step 1: Kind 클러스터 생성
   - Step 2: ArgoCD Helm 배포
   - Step 3: 리소스 확인 및 접속
   - Step 4: 정리 (destroy)

6. 내가 사용하는 방식: Terraform + ArgoCD + Helm
   - 왜 Terraform 범위를 최소화하는가?
     - Terraform: Kind 클러스터 + ArgoCD만 관리
     - Helm Charts: 애플리케이션 설정 관리
     - ArgoCD: GitOps로 K8s 배포 자동화
   - 계층 구조 다이어그램
     ┌─ Terraform ──→ Kind 클러스터 + ArgoCD 설치
     ├─ ArgoCD ─────→ ApplicationSet으로 앱 등록
     └─ Helm Charts ─→ 각 앱의 K8s 리소스 정의
   - 이 구조의 장점
     - 앱 설정 변경 시 charts만 수정하면 됨
     - Terraform state 관리 복잡도 감소
     - ArgoCD가 drift detection/자동 동기화 처리

7. 마무리
   - 참고 자료
```

---

## 3. 확정 사항

### 3-1. 블로그 분량: **단일 포스트**
- 전체 목차를 하나의 긴 글로 작성
- 실습이 Kind+ArgoCD라 자연스럽게 연결됨

### 3-2. 실습 구성: Kind 클러스터에 ArgoCD 배포하기

기존 `tutorials-go/cloud/terraform/` 코드를 메인 샘플로 활용:

| Step | 내용 | 핵심 개념 |
|------|------|-----------|
| 1 | Provider 설정 | Provider, required_providers |
| 2 | Kind 클러스터 생성 | Resource, Variable |
| 3 | Module로 ArgoCD 배포 | Module, Helm provider |
| 4 | Output으로 결과 확인 | Output |
| 5 | 리소스 정리 | destroy |

### 3-3. 샘플 코드 수정 계획

**메인 샘플**: `tutorials-go/cloud/terraform/`

**수정 사항:**
- [x] 결정: `modules/app/` → **삭제** (앱은 ArgoCD로 관리하는 철학과 일치)
- [x] 결정: 학습용 **한글 주석 추가** (코드만 봐도 이해 가능하도록)
- [ ] "내가 사용하는 방식" 풀 플로우 샘플 추가 (아래 참고)
- [ ] README.md 업데이트
- [ ] 블로그 링크 연동

**추가 샘플: 풀 플로우 예제**

현재 `cloud/terraform/`은 Kind + ArgoCD 설치까지만 있음.
블로그 6장 "내가 사용하는 방식"을 위해 전체 흐름을 보여주는 샘플 필요:

```
cloud/terraform/
├── main.tf                      # Provider 설정
├── kind.tf                      # Kind 클러스터
├── variables.tf                 # 변수
├── outputs.tf                   # 출력
├── Makefile
├── modules/
│   └── infra/
│       ├── infra.tf             # ArgoCD Helm 배포
│       └── variables.tf
├── bootstrap/
│   └── sample-apps.yaml         # (신규) ArgoCD ApplicationSet 예제
└── charts/
    └── sample-nginx/            # (신규) 간단한 Helm 차트 예제
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── deployment.yaml
            └── service.yaml
```

**풀 플로우 시나리오:**
1. `terraform apply` → Kind 클러스터 + ArgoCD 설치
2. `kubectl apply -f bootstrap/sample-apps.yaml` → ArgoCD에 앱 등록
3. ArgoCD가 `charts/sample-nginx/`를 감지 → 자동 배포
4. 앱 설정 변경 시 `charts/sample-nginx/values.yaml`만 수정하면 ArgoCD가 자동 반영

**기존 코드 현황** (`tutorials-go`):

| 위치 | 설명 | 블로그 관련 |
|------|------|-------------|
| `cloud/terraform/` | Kind + ArgoCD (모듈 구조) | **메인 샘플** |
| `cloud/ingress-gateway/terraform/` | Ingress vs Gateway 비교용 | 별도 주제 |
| `ai/ollama/` | Ollama on K8s | 별도 주제 |

---

## 4. 실제 운영 코드 참고 (`charts/`)

> **주의**: `charts/`는 private repo이며 민감한 값 포함. 블로그에서 구조/다이어그램은 언급 가능하나, 실제 코드/설정값은 노출 금지. — 블로그 6장 작성 시 참고용

블로그 6장 "내가 사용하는 방식"에서 참고할 실제 구조:

```
charts/
├── main.tf                          # Terraform Provider 설정
├── k8s.tf                           # Kind 클러스터 (1 CP + 3 Workers)
├── variables.tf                     # 변수
├── outputs.tf                       # 출력
├── modules/infra/infra.tf           # ArgoCD만 Helm으로 설치
├── bootstrap/
│   ├── macmini-infra.yaml           # DB ApplicationSet (MySQL, Redis)
│   ├── macmini-app.yaml             # 앱 ApplicationSet (10개+)
│   └── macmini-gateway.yaml         # Gateway ApplicationSet
├── charts/                          # 20개+ Helm 차트
│   ├── mysql/
│   ├── redis/
│   ├── inspireme-be/
│   ├── moneyflow-be/
│   └── ...
└── Makefile
```

**핵심 포인트**: Terraform은 Kind + ArgoCD만 관리하고, 나머지는 전부 ArgoCD → Helm 으로 관리

---

## 5. 블로그 frontmatter (예정)

```yaml
---
title: "Terraform 완벽 가이드: 기본 개념부터 GitOps 실전까지"
description: "Terraform의 기본 개념, 아키텍처, 사용법을 알아보고, Kind 클러스터와 ArgoCD를 배포하는 실습을 진행합니다. Terraform + ArgoCD + Helm으로 효율적인 인프라를 관리하는 방법도 소개합니다."
date: 2026-02-18
update: 2026-02-18
tags:
  - Terraform
  - IaC
  - Infrastructure as Code
  - HCL
  - HashiCorp
  - Kind
  - Kubernetes
  - ArgoCD
  - GitOps
  - Helm
  - DevOps
  - 테라폼
  - 인프라
  - 쿠버네티스
series: "Terraform"
---
```

---

## 6. 작업 순서

1. ~~목차 확정~~ ✅
2. ~~샘플 코드 정리/보완~~ ✅
   - ~~`modules/app/` 삭제~~
   - ~~각 .tf 파일에 학습용 한글 주석 추가~~
   - ~~풀 플로우 샘플 추가 (bootstrap/ + charts/sample-nginx/)~~
   - ~~README.md 생성~~
3. ~~블로그 포스트 초안 작성~~ ✅
   - 위치: `docs/start/terraform-완벽-가이드-기본-개념부터-gitops-실전까지/index.md`
4. 리뷰 및 수정
