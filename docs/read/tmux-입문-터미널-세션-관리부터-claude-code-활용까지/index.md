---
title: "tmux 입문: 터미널 세션 관리부터 Claude Code 활용까지"
description: "터미널 멀티플렉서 tmux의 기본 개념부터 세션·윈도우·페인 사용법, 최소 설정, 그리고 Claude Code 세션과 함께 쓰는 활용법까지 입문자 기준으로 정리한다."
date: 2026-05-25
update: 2026-05-25
tags:
  - tmux
  - terminal
  - 터미널
  - 세션
  - claude-code
  - 생산성
---

# 1. 들어가며

예전에 Linux 서버를 자주 다룰 때는 `tmux` 없이 일하는 게 상상이 안 됐다. 그러다 로컬 개발 위주로 일하면서 한동안 잊고 지냈는데, 요즘 Claude Code 같은 터미널 기반 AI 코딩 도구를 쓰면서 다시 손이 가기 시작했다. 이참에 입문자 관점에서 tmux를 처음부터 차근차근 정리해 둔다.

혹시 이런 경험이 있다면 tmux가 답이 될 수 있다.

- 터미널 탭이 10개씩 열려서 어디에 뭐가 있는지 모르겠다.
- 원격 서버에서 작업하다 SSH가 끊겨 돌아가던 빌드나 스크립트가 통째로 날아갔다.
- 한 화면에서 코드 편집과 로그를 같이 보고 싶은데 창을 계속 왔다 갔다 한다.

이 글은 설치를 macOS 기준으로 다루고, 개념부터 기본 사용법, 최소 설정까지 순서대로 짚은 뒤, 마지막에 Claude Code 세션과 함께 쓰는 활용법을 소개한다. 위에서 아래로 그대로 따라 치면 된다.

# 2. tmux란?

tmux는 **t**erminal **mux**(multiplexer), 즉 "터미널 멀티플렉서"의 줄임말이다. 하나의 터미널 창 안에서 여러 작업 공간을 다루고, 그 작업 공간을 백그라운드에 띄워둘 수 있게 해주는 도구다.

입문자가 기억할 핵심 가치는 두 가지다.

**① 세션 지속성(persistence)** — tmux 세션은 터미널 창을 닫거나 SSH 연결이 끊겨도 백그라운드에 그대로 살아있다. 나중에 다시 붙기만(attach) 하면 하던 작업이 끊긴 적 없다는 듯 이어진다. 앞서 말한 "SSH가 끊겨 빌드가 날아갔다"는 문제가 바로 여기서 사라진다.

**② 화면 분할** — 하나의 화면을 여러 윈도우와 페인으로 나눠 동시에 여러 작업을 볼 수 있다. 편집기, 로그, 개발 서버를 한눈에 두고 작업할 수 있다.

한 줄로 비유하면, tmux는 **닫아도 사라지지 않고, 칸막이를 자유롭게 나눌 수 있는 작업 공간**이다.

# 3. 설치 (macOS)

macOS에서는 Homebrew로 한 줄이면 끝난다.

```bash
brew install tmux
```

설치가 끝나면 버전을 확인해 본다.

```bash
tmux -V
# tmux 3.5a  (예시)
```

버전 문자열이 출력되면 준비 완료다. 이제 터미널에서 `tmux`라고 입력하면 첫 세션이 시작된다.

# 4. 핵심 개념: Session, Window, Pane

tmux를 쓰려면 세 가지 단위를 알아야 한다. 셋은 **Session > Window > Pane** 순서로 포함 관계를 이룬다.

- **Session(세션)**: tmux의 최상위 작업 공간 단위다. 보통 프로젝트나 작업 하나당 세션 하나를 쓴다. 앞서 말한 detach/attach의 대상이 바로 이 세션이다.
- **Window(윈도우)**: 세션 안의 "탭"이라고 보면 된다. 화면 전체를 차지하며, 여러 윈도우를 번갈아 가며 본다.
- **Pane(페인)**: 윈도우를 나눈 분할 화면이다. 한 윈도우 안에 여러 페인이 동시에 보인다.

세션 하나 안에 윈도우 여러 개가 있고, 윈도우 하나 안에 페인 여러 개가 있는 구조다. 그림으로 보면 이렇다.

```mermaid
graph TD
    S[Session: my-project] --> W1[Window 1: editor]
    S --> W2[Window 2: server]
    W1 --> P1[Pane: code]
    W1 --> P2[Pane: logs]
    W2 --> P3[Pane: dev server]
```

# 5. 기본 사용법

## prefix 키부터

tmux의 거의 모든 단축키는 **prefix 키를 먼저 누른 뒤** 다음 키를 누르는 방식이다. 기본 prefix는 `Ctrl+b`다. 이 글에서는 이걸 `prefix`로 표기한다. 즉 `prefix c`는 "`Ctrl+b`를 누르고 손을 뗀 다음 `c`를 누른다"는 뜻이다. 동시에 누르는 게 아니라 순서대로 누른다는 점만 기억하면 된다.

## 세션

```text
- 새 세션 시작(이름 지정): tmux new -s my-project
- 세션에서 빠져나오기(detach): prefix d   (세션은 계속 살아있음)
- 세션 목록 보기: tmux ls
- 세션에 다시 붙기(attach): tmux attach -t my-project
- 세션 종료: tmux kill-session -t my-project
```

여기서 핵심은 `prefix d`(detach)와 `tmux attach -t`(다시 붙기)다. detach해도 세션 안의 작업은 백그라운드에서 계속 돌아간다.

## 윈도우

```text
- 새 윈도우: prefix c
- 다음 / 이전 윈도우: prefix n / prefix p
- 번호로 이동: prefix 0 ~ prefix 9
- 윈도우 이름 변경: prefix ,
```

## 페인

```text
- 좌우 분할: prefix %
- 상하 분할: prefix "
- 페인 간 이동: prefix 방향키
- 페인 크기 조절: prefix Ctrl+방향키
- 현재 페인 닫기: prefix x   (확인 후 y)
```

## 핵심 단축키 치트시트

자주 쓰는 명령만 한눈에 모았다. 이 표만 옆에 두고 시작해도 충분하다.

| 구분 | 동작 | 명령 / 단축키 |
|------|------|---------------|
| 세션 | 새 세션 | `tmux new -s 이름` |
| 세션 | detach | `prefix d` |
| 세션 | attach | `tmux attach -t 이름` |
| 세션 | 목록 | `tmux ls` |
| 윈도우 | 새 윈도우 | `prefix c` |
| 윈도우 | 이동 | `prefix n` / `prefix p` / `prefix 숫자` |
| 페인 | 좌우 분할 | `prefix %` |
| 페인 | 상하 분할 | `prefix "` |
| 페인 | 이동 | `prefix 방향키` |
| 페인 | 닫기 | `prefix x` |

# 6. .tmux.conf 최소 설정

처음부터 화려하게 꾸밀 필요는 없다. 입문자에게 체감이 큰 네 가지만 `~/.tmux.conf`에 넣어보자.

```bash
# 1) prefix를 Ctrl+a로 변경 (Ctrl+b가 손에 안 맞으면)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 2) 마우스로 페인 선택/크기 조절/스크롤 가능
set -g mouse on

# 3) 분할 단축키를 직관적으로 ( | 좌우, - 상하 )
bind | split-window -h
bind - split-window -v

# 4) 설정 리로드 단축키 (prefix r)
bind r source-file ~/.tmux.conf \; display "Reloaded!"
```

저장한 뒤 적용하려면 tmux 안에서 `prefix r`을 누르거나, `tmux kill-server`로 모든 세션을 끄고 다시 시작한다.

참고로 1번 설정에서 prefix를 `Ctrl+a`로 바꾸는 것은 어디까지나 취향에 따른 **선택**이다. 바꾸면 기본 prefix와 달라지므로 헷갈릴 수 있다. 이 글의 나머지 본문에서 쓰는 단축키는 모두 **기본 prefix인 `Ctrl+b`** 기준이라는 점만 기억하자.

# 7. Claude Code와 함께 쓰기

여기까지가 tmux 기본기다. 이제 처음에 말했던, 내가 tmux를 다시 자주 쓰게 된 이유로 돌아와 보자. Claude Code와 tmux는 궁합이 꽤 좋다. 이유는 두 가지다.

- **장시간 자율 작업이 detach로 살아남는다.** Claude Code에 긴 작업을 맡겨두고 `prefix d`로 빠져나오면, 터미널을 닫아도 작업은 계속 돌아간다.
- **한 화면에서 병렬로 일할 수 있다.** Claude Code와 dev server, 로그를 페인으로 나눠 동시에 보면 작업 흐름이 끊기지 않는다.

## 패턴 A — 한 화면 레이아웃

윈도우 하나를 페인으로 나눠, 왼쪽에는 Claude Code를, 오른쪽 위에는 개발 서버를, 오른쪽 아래에는 로그나 테스트를 띄우는 구성이다. 만드는 순서는 이렇다.

1. 세션을 시작하고 왼쪽 페인에서 `claude`를 실행한다.
2. `prefix %`로 좌우 분할 → 오른쪽 페인이 생긴다.
3. 오른쪽 페인에서 `prefix "`로 상하 분할 → 위/아래 페인이 생긴다.
4. 오른쪽 위에서 `npm run dev`, 오른쪽 아래에서 로그나 테스트를 돌린다.

이렇게 하면 한 화면에서 Claude의 작업, 서버 출력, 로그를 동시에 지켜볼 수 있다.

## 패턴 B — 지속성 & 원격

detach의 진가가 발휘되는 패턴이다.

- `tmux new -s claude-feature`로 세션을 만들고 그 안에서 `claude`를 실행한다.
- 긴 작업을 시킨 뒤 `prefix d`로 detach한다. → 노트북을 닫거나 SSH가 끊겨도 작업은 계속된다.
- 나중에 `tmux attach -t claude-feature`로 다시 붙으면 대화 기록과 출력이 그대로 남아있다.
- 원격 서버(VPS)에 띄워두면 사무실, 집, 심지어 폰에서 SSH로 붙어 이어서 작업할 수 있다.

## 패턴 C — 멀티 프로젝트 헬퍼 스크립트

여러 프로젝트를 다룰 때는 세션을 프로젝트별로 미리 띄워두면 편하다. 아래 스크립트는 정의해 둔 프로젝트마다 tmux 세션을 만들고(이미 있으면 재사용), 해당 디렉토리에서 시작한다. `PROJECTS` 목록만 본인 환경에 맞게 바꿔 쓰면 된다.

```bash
#!/usr/bin/env bash
# bin/claude_tmux_sessions.sh
# 미리 정의한 프로젝트마다 tmux 세션을 만들고(이미 있으면 재사용) 해당 디렉토리에서 시작한다.
set -euo pipefail

# "세션이름:프로젝트경로" 목록 — 본인 환경에 맞게 수정
PROJECTS=(
  "blog:$HOME/src/blog-v2.advenoh.pe.kr"
  "chatbot:$HOME/src/ai-chatbot.advenoh.pe.kr"
  "inspireme:$HOME/src/inspireme.advenoh.pe.kr"
)

for entry in "${PROJECTS[@]}"; do
  name="${entry%%:*}"
  path="${entry#*:}"

  if tmux has-session -t "$name" 2>/dev/null; then
    echo "이미 있음, 재사용: $name"
  else
    echo "세션 생성: $name ($path)"
    tmux new-session -d -s "$name" -c "$path"
    # 필요하면 각 세션에서 바로 claude 실행:
    # tmux send-keys -t "$name" "claude" C-m
  fi
done

echo
tmux ls
echo
echo "붙으려면: tmux attach -t <세션이름>"
```

> 주의: 같은 repo에 Claude 인스턴스 두 개가 동시에 파일을 쓰면 충돌할 수 있다. 병렬 작업은 작업별로 디렉토리를 나누거나 `git worktree`로 분리하는 것이 안전하다.

## 참고 — 공식 Agent Teams

Claude Code에는 여러 세션을 자동으로 띄워 협업시키는 공식 `Agent Teams` 기능도 실험적으로 제공된다(`tmux -CC` 컨트롤 모드를 활용한다). 더 깊이 들어가고 싶다면 [공식 문서](https://code.claude.com/docs/en/agent-teams)를 참고하자.

# 8. 마치며
