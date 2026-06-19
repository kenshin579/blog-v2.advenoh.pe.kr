---
date: 2026-06-19
topic: kx/ns + fzf 기반 Kubernetes context·namespace 전환 워크플로우 블로그 글
status: design
---

# kx, ns로 Kubernetes context·namespace 빠르게 전환하기 (with fzf)

## 1. 목적

여러 Kubernetes 클러스터와 namespace를 오가며 작업할 때 `kubectl config use-context …`,
`kubectl … -n <namespace>` 를 매번 길게 입력하는 불편함을, 직접 만든 `kx` / `ns` 스크립트와
`fzf` 대화형 선택으로 어떻게 해소하는지 소개하는 블로그 글을 작성한다.

## 2. 방향성 (브레인스토밍 결정 사항)

- **초점**: Kubernetes 워크플로우 중심. kx/ns + fzf가 주인공, `~/bin` 관리는 곁들임. (Q1=A)
- **성격**: 혼합형 — 동기·배경을 이야기하되 핵심 스크립트는 따라할 수 있게 코드·설치법 제공. (Q2=C)
- **kubectx/kubens 비교**: 다루지 않는다. 내 스크립트 설명에 집중. (Q3=C)
- **kubeconfig 병합**: 다루지 않는다. `~/.kube/config` 하나가 최종 버전이고 나머지 yaml은 백업일 뿐.
  들어가며에서 "kubeconfig는 `~/.kube/config` 하나로 쓴다"는 전제만 한 줄 언급.
- **제외 소재**: `kexec.sh`, `kubevpn-hosts.sh` 는 다루지 않는다.

## 3. 글 구조 (목차)

1. **들어가며** — 여러 클러스터·namespace를 오가며 `use-context …`, `-n …` 를 매번 길게 치는 불편함.
   kubeconfig는 `~/.kube/config` 하나로 쓴다는 전제만 짧게.
2. **준비물: fzf** — 설치 한 줄(`brew install fzf`) + "왜 fzf인가"(대화형 fuzzy 선택).
3. **`kx` — fzf로 context 전환** — 스크립트 해부: `kubectl config get-contexts` → grep/sed/awk 파이프라인
   → fzf 옵션(`--reverse`, `--bind`, `-e` 등) → `kubectl config use-context`.
4. **`ns` — fzf로 namespace 전환** — `kubectl get ns` → fzf 선택 → 선택값을 `~/.ns`에 저장하는 트릭 +
   `kubectl config set-context --current --namespace`.
5. **alias로 완성** — `k=kubectl`, `kc='kubectl -n $(cat ~/.ns)'`. `~/.ns`를 단일 소스로 삼아 매번 `-n` 생략.
6. **곁들임: 이 스크립트들을 `~/bin`으로 관리하기** — git 저장소 + PATH 등록(`$HOME/bin`)으로 어디서나 실행.
7. **마치며** — 전후 비교(긴 명령 → 두 글자), 정리.

## 4. 게재 위치 / 산출물

- 디렉토리: `blog-v2.advenoh.pe.kr/contents/cloud/<한글-케밥케이스-슬러그>/`
  - 슬러그(잠정): `kx-ns로-kubernetes-context-namespace-빠르게-전환하기`
- 파일: `index.md` (한글). 영문 `index_en.md`는 후속 작업으로 분리(이번 범위 아님).
- frontmatter: `title`, `description`, `date: 2026-06-19`, `update: 2026-06-19`,
  `tags`(예: kubernetes, k8s, kubectl, fzf, kx, ns, context, namespace, 생산성)
- 본문 스타일: 기존 글 컨벤션을 따른다 — `# 1. 개요`, `## 1.1` 식 번호 매긴 헤딩, 한국어 본문, UTF-8.

## 5. 코드 소재 (실제 스크립트, 글에 인용)

- `~/bin/kx`:
  ```bash
  context=$(kubectl config get-contexts \
      | grep -v CURRENT | sed 's/\*//' \
      | awk '{print $1}' \
      | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)
  [[ $context != "" ]] && kubectl config use-context $context
  ```
- `~/bin/ns`:
  ```bash
  namespace=$(kubectl get ns | awk '{print $1}' | grep -v NAME \
      | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)
  [[ $namespace != "" ]] && echo $namespace > ~/.ns
  kubectl config set-context --current --namespace=$namespace
  ```
- alias (`~/.zshrc`): `alias k='kubectl'`, `alias kc='kubectl -n $(cat ~/.ns)'`

## 6. 비범위 (YAGNI)

- kubeconfig 병합 스크립트, kexec, kubevpn-hosts 설명
- kubectx/kubens 비교
- 영문 글 (후속)
