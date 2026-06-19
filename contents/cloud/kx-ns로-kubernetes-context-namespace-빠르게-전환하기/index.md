---
title: "kx, ns로 Kubernetes context·namespace 빠르게 전환하기 (with fzf)"
description: "kubectl config use-context, -n namespace를 매번 길게 치는 게 번거롭다면? fzf 기반의 두 줄짜리 스크립트 kx와 ns로 context와 namespace를 대화형으로 골라 전환하는 워크플로우를 소개합니다. ~/.ns 파일과 alias를 엮어 매번 -n을 생략하는 트릭까지 다룹니다."
date: 2026-06-19
update: 2026-06-19
tags:
  - kubernetes
  - k8s
  - kubectl
  - fzf
  - kx
  - ns
  - 생산성
---

# 1. 들어가며

여러 Kubernetes 클러스터를 오가며 일하다 보면, 클러스터(context)를 전환하고 작업할 namespace를 지정하는 일을 하루에도 수십 번 반복한다.

```bash
# 지금 내가 보고 있는 클러스터가 어디였더라?
kubectl config current-context

# 작업할 namespace를 매 명령어마다 지정...
kubectl get pods -n web-dev
kubectl logs -n web-dev my-pod-xxxx
kubectl describe deploy -n web-dev my-app
```

특히 namespace는 명령어마다 `-n`을 붙여야 해서 번거롭다. `kubectl config set-context --current --namespace=...`로 기본 namespace를 바꿀 수는 있지만, 이것도 namespace 이름을 정확히 알아야 하고 명령어가 길다.

이걸 매번 손으로 하는 게 번거로워서, `fzf`로 **목록에서 골라 전환**하는 두 줄짜리 스크립트 `kx`(context 전환)와 `ns`(namespace 전환)를 만들어 쓰고 있다. 이 글에서 그 워크플로우를 공유한다.

> 참고로 kubeconfig는 여러 파일로 나누지 않고 `~/.kube/config` 하나로 합쳐서 쓴다. 여러 클러스터의 context가 이 파일 하나에 다 들어있다는 전제로 글을 읽으면 된다.

## 1.1 fzf로 목록에서 골라 실행하기

[fzf](https://github.com/junegunn/fzf)는 명령줄용 대화형 fuzzy finder다. 표준 입력으로 받은 목록을 띄워주고, 타이핑으로 필터링하고, 화살표로 골라서 선택값을 표준 출력으로 돌려준다. 이 글의 핵심 도구다.

macOS라면 Homebrew로 설치한다.

```bash
brew install fzf
```

`fzf`의 동작은 간단하다. 어떤 명령의 출력을 파이프로 넘기면 선택 UI가 뜨고, 고른 줄이 그대로 출력된다.

```bash
# 디렉토리의 파일 목록에서 하나 골라보기
ls | fzf
```

즉 **"목록을 만드는 명령" + `fzf` + "고른 값으로 실행할 명령"** 조합이면 어떤 대화형 선택기도 만들 수 있다. `kx`와 `ns`가 정확히 이 패턴이다.

# 2. fzf로 쉽게 k8s context, namespace 설정하기

이제 `fzf`로 실제 전환 도구를 만들어보자. context를 고르는 `kx`, namespace를 고르는 `ns`, 그리고 둘을 묶어 더 편하게 쓰는 alias 순서로 살펴본다.

## 2.1 kx — fzf로 context 전환하기

먼저 context를 골라서 전환하는 `kx` 스크립트다.

```bash
#!/bin/bash

context=$(kubectl config get-contexts \
    | grep -v CURRENT | sed 's/\*//' \
    | awk '{print $1}' \
    | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)

if [[ $context != "" ]]; then
  kubectl config use-context $context
fi
```

파이프라인을 한 단계씩 뜯어보자.

- `kubectl config get-contexts` — 등록된 context 목록을 테이블로 출력한다. 첫 줄은 `CURRENT NAME CLUSTER ...` 헤더이고, 현재 context 앞에는 `*` 표시가 붙는다.
- `grep -v CURRENT` — `CURRENT`라는 단어가 들어간 **헤더 줄을 제거**한다.
- `sed 's/\*//'` — 현재 context를 가리키는 `*` 기호를 지운다. 이게 없으면 context 이름에 `*`가 섞여 들어간다.
- `awk '{print $1}'` — 각 줄의 **첫 번째 컬럼(context 이름)**만 뽑는다.
- `fzf ...` — 그 이름 목록을 `fzf`로 넘겨 대화형으로 고른다.

`fzf` 옵션도 정리해두면:

| 옵션 | 의미 |
| --- | --- |
| `-x` (`--extended`) | 확장 검색 모드 (공백으로 여러 키워드 AND 검색) |
| `-e` (`--exact`) | 부분 문자열 정확 매칭 (fuzzy가 아닌 exact) |
| `--reverse` | 입력창을 위에, 목록을 아래로 (위→아래로 읽기) |
| `--bind=left:page-up,right:page-down` | ←/→ 키를 페이지 이동에 매핑 |
| `--no-mouse` | 마우스 비활성화 (터미널 스크롤이 `fzf`에 먹히지 않게) |

마지막으로 `[[ $context != "" ]]` 가드는 **`fzf`에서 `ESC`로 취소했을 때**(빈 값) `use-context`가 실행되지 않게 막아준다.

이제 클러스터 전환은 이렇게 끝난다.

`kx`를 실행하면 등록된 context들이 `fzf` 화면으로 뜬다.

```text
>                                                              ← 검색어 입력창
  4/4                                                          ← (매칭 개수 / 전체 개수)
> minikube                                                     ← 현재 커서(>) 위치
  docker-desktop
  prod-cluster
  staging-cluster
```

여기서 `prod` 몇 글자만 타이핑하면 목록이 즉시 좁혀진다. 여러 context를 일일이 확인할 필요 없이 원하는 것만 바로 고를 수 있다.

```text
> prod
  1/4
> prod-cluster
```

남은 한 줄에서 `Enter`를 누르면 그 context로 전환된다.

```bash
$ kx
Switched to context "prod-cluster".
```

## 2.2 ns — fzf로 namespace 전환하기

같은 패턴을 namespace에도 적용한 `ns` 스크립트다.

```bash
#!/bin/bash

namespace=$(kubectl get ns \
  | awk '{print $1}' \
  | grep -v NAME \
  | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)

if [[ $namespace != "" ]]; then
  echo $namespace > ~/.ns
  cat ~/.ns
fi

kubectl config set-context --current --namespace=$namespace
```

`kx`와 거의 같다.

- `kubectl get ns` — namespace 목록(`NAME STATUS AGE`)을 출력한다.
- `awk '{print $1}'` — 첫 컬럼(namespace 이름)만 뽑는다.
- `grep -v NAME` — `NAME` 헤더 줄을 제거한다.
- `fzf ...` — 대화형으로 고른다.

여기서 `kx`와 다른 핵심이 하나 있다.

```bash
echo $namespace > ~/.ns
```

고른 namespace를 **`~/.ns` 파일에 저장**한다. 이게 다음 섹션에서 진짜 빛을 발하는 부분이다. 동시에 `kubectl config set-context --current --namespace=$namespace`로 현재 context의 기본 namespace도 바꿔준다.

`ns`를 실행하면 현재 클러스터의 namespace 목록이 `fzf`로 뜬다.

```text
>
  6/6
> default
  kube-system
  kube-public
  web-dev
  web-staging
  monitoring
```

`web` 을 입력해 좁힌 뒤 `web-dev`를 고르고 `Enter`를 누르면 된다.

```text
> web
  2/6
> web-dev
  web-staging
```

선택값이 `~/.ns`에 저장되고, 현재 context의 기본 namespace도 함께 바뀐다.

```bash
$ ns
web-dev
Context "..." modified.
```

## 2.3 alias로 완성하기

`ns`가 선택한 namespace를 `~/.ns`에 저장해두는 이유는, 그 값을 **단일 소스(single source of truth)**로 삼아 alias와 엮기 위해서다. `~/.zshrc`(또는 `~/.bashrc`)에 다음 alias를 둔다.

```bash
alias kc='kubectl -n $(cat ~/.ns)'
```

`kc`는 `kubectl -n $(cat ~/.ns)` — 즉 **`ns`로 골라둔 namespace를 자동으로 `-n`에 끼워 넣는다.** alias가 실행될 때마다 `~/.ns`를 읽으므로, `ns`로 namespace를 바꾸면 `kc`의 대상도 따라 바뀐다.

이제 워크플로우 전체는 이렇게 흐른다.

```bash
$ kx          # 클러스터(context) 선택
$ ns          # namespace 선택 → ~/.ns에 저장

$ kc get pods            # = kubectl -n web-dev get pods
$ kc logs my-pod-xxxx    # = kubectl -n web-dev logs my-pod-xxxx
$ kc describe deploy x   # = kubectl -n web-dev describe deploy x
```

`-n web-dev`를 매번 붙일 필요가 사라진다. `set-context --namespace`로 기본 namespace를 바꾸는 방법도 있지만, `~/.ns` + `kc` 조합은 **"지금 작업 중인 namespace"를 파일 하나로 명시적으로 들고 다닌다**는 점에서 더 직관적이다. 어느 namespace를 보고 있는지 헷갈리면 `cat ~/.ns` 한 번이면 된다.

## 2.4 kx는 왜 `~/.kx`를 만들지 않을까?

여기서 한 가지 의문이 들 수 있다. `ns`는 선택값을 `~/.ns`에 저장하는데, `kx`는 왜 `~/.kx` 같은 파일을 만들지 않을까? 비대칭처럼 보이지만 이유가 있다.

핵심은 **`kubectl`이 "현재 상태"를 어디에 기억하느냐**의 차이다.

- **context**: `kubectl config use-context`를 실행하면 그 선택이 kubeconfig(`~/.kube/config`)의 `current-context` 필드에 영속적으로 저장된다. 이후 모든 `kubectl` 명령이 자동으로 그 context를 사용한다. 현재 값이 궁금하면 `kubectl config current-context` 한 줄이면 충분하니, 별도 파일이 필요 없다.
- **namespace**: namespace도 kubeconfig에 저장되긴 하지만, `kc='kubectl -n $(cat ~/.ns)'` alias가 그 값을 **셸에서 텍스트로 꺼내** `-n` 뒤에 끼워 넣어야 한다. kubeconfig 안의 값은 `kubectl` 내부에서만 쓰여 `$(...)`로 간단히 꺼내기 어렵다. 그래서 `~/.ns`라는 평범한 텍스트 파일에 따로 적어두고 alias가 `cat`으로 읽는다.

| | 현재 상태 저장 위치 | 셸에서 값을 꺼내 쓸 일 | 별도 파일 |
| --- | --- | --- | --- |
| **context** | kubeconfig `current-context` (`kubectl`이 자동 사용) | 없음 | ❌ |
| **namespace** | kubeconfig + `~/.ns` | `kc` alias가 `$(cat ~/.ns)`로 사용 | ✅ |

즉 `~/.ns`는 namespace를 "저장"한다기보다, **셸에서 꺼내 쓰기 좋은 형태로 복제**해두는 용도에 가깝다. context는 그럴 필요가 없으니 `~/.kx`도 없는 것이다.

# 3. 개인 스크립트는 ~/bin에 모아두자

`kx`, `ns` 같은 개인 스크립트는 `~/bin` 디렉토리에 모아 git 저장소로 관리하고 있다. 이렇게 하면 새 맥에서도 클론 한 번으로 똑같은 환경을 복원할 수 있다.

```bash
# 스크립트를 ~/bin에 두고 실행 권한 부여
chmod +x ~/bin/kx ~/bin/ns
```

`~/bin`을 `PATH`에 등록해두면 어디서나 `kx`, `ns`만 쳐도 실행된다.

```bash
# ~/.zshrc
export PATH="$HOME/bin:$PATH"
```

`~/bin`을 git 저장소로 만들어두면 스크립트의 변경 이력도 남고, 여러 머신 간 동기화도 쉽다. 개인 자동화 스크립트가 쌓이기 시작하면 한 번쯤 정리해둘 가치가 있다.

# 4. 마치며

정리하면, 매번 길게 치던 명령어가 이렇게 짧아졌다.

| 전 | 후 |
| --- | --- |
| `kubectl config use-context prod-cluster` | `kx` |
| `kubectl config set-context --current --namespace=web-dev` | `ns` |
| `kubectl -n web-dev get pods` | `kc get pods` |

핵심은 거창한 도구가 아니라 **`목록 명령 | fzf | 실행 명령`** 이라는 단순한 패턴이다. 이 패턴은 context/namespace뿐 아니라 pod 선택, git 브랜치 전환 등 "목록에서 골라 실행"하는 거의 모든 작업에 응용할 수 있다. 매일 반복하는 명령어가 있다면, 두 줄짜리 `fzf` 스크립트로 한번 묶어보길 권한다.
