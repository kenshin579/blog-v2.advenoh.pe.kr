# tmux 입문 가이드 (+ Claude Code 활용) — 블로그 글 작성 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** macOS 기준 tmux 입문 가이드 블로그 글을 작성한다. tmux 기본기를 차곡차곡 쌓고, 마지막에 Claude Code 세션과 함께 쓰는 활용법을 피날레로 보여준다.

**Architecture:** 단일 마크다운 글(`docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md`)을 섹션별로 작성한다. 섹션을 독립 task로 쪼개 점진적으로 채운다. 코드 산출물은 글 안의 bash 헬퍼 스크립트 1개뿐이며, 별도 검증(`bash -n`)을 거친다.

**Tech Stack:** Markdown + YAML frontmatter, Mermaid 다이어그램, bash 스크립트(헬퍼). 빌드 도구는 사용하지 않음(초안 단계).

**Spec:** `docs/superpowers/specs/2026-05-25-tmux-claude-code-guide-design.md`

---

## 작성 컨벤션 (blog-v2 준수 — 모든 task 공통)

- frontmatter에 `category` **넣지 않는다** (디렉토리로 결정).
- 다이어그램은 **Mermaid만**. ASCII art 금지. Mermaid 노드 텍스트에 `<br/>`, `<br>` 등 HTML 태그 금지.
- 모든 파일 **UTF-8** 인코딩. 한글 깨짐 시 heredoc 사용.
- 톤: 입문자가 그대로 따라 칠 수 있게 명령어/단축키를 구체적으로. 개념 → 실습 순서.
- 단축키 표기는 `prefix` = `Ctrl+b` 기준으로 일관되게 (예: `prefix c`, `prefix %`).

## File Structure

- Create: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` — 글 전체(단일 파일). 모든 섹션이 여기에 누적된다.

> 글 본문에 들어가는 헬퍼 스크립트(`bin/claude_tmux_sessions.sh`)는 별도 파일로 저장하지 않고, 코드블록으로 글 안에 인라인한다. 단, 문법 검증을 위해 Task 8에서 임시 파일로 `bash -n` 검사를 거친 뒤 임시 파일은 삭제한다.

---

## Task 0: 작업 브랜치 생성

**Files:** 없음 (git 작업만)

- [ ] **Step 1: 현재 main 최신화 후 feature 브랜치 생성**

main에 직접 커밋 금지 정책에 따라 브랜치를 먼저 만든다. 이슈 번호가 없으므로 `docs/` prefix + 설명형 브랜치명을 사용한다.

Run:
```bash
cd blog-v2.advenoh.pe.kr
git checkout main && git pull
git checkout -b docs/tmux-claude-code-guide
```
Expected: `Switched to a new branch 'docs/tmux-claude-code-guide'`

- [ ] **Step 2: 브랜치 확인**

Run: `git branch --show-current`
Expected: `docs/tmux-claude-code-guide`

---

## Task 1: 글 파일 생성 + frontmatter + 섹션 스켈레톤

**Files:**
- Create: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md`

- [ ] **Step 1: 디렉토리 생성**

Run:
```bash
mkdir -p "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지"
```

- [ ] **Step 2: frontmatter + 빈 섹션 헤딩 작성**

`category`는 넣지 않는다. `description`은 한 줄 요약으로 채운다.

```markdown
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

# 2. tmux란?

# 3. 설치 (macOS)

# 4. 핵심 개념: Session, Window, Pane

# 5. 기본 사용법

# 6. .tmux.conf 최소 설정

# 7. Claude Code와 함께 쓰기

# 8. 마치며
```

- [ ] **Step 3: UTF-8 인코딩 확인**

Run: `file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"`
Expected: `... charset=utf-8`

- [ ] **Step 4: 커밋**

```bash
git add "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git commit -m "docs: tmux 입문 글 스켈레톤 추가"
```

---

## Task 2: "1. 들어가며" 섹션 작성

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 1. 들어가며` 아래)

- [ ] **Step 1: 개인적 배경 + 페인 포인트 본문 작성**

`# 1. 들어가며` 헤딩 아래에 아래 내용을 작성한다. 핵심 요소:
- 개인 배경: 원래 **Linux 서버를 다룰 때** tmux를 자주 썼는데 한동안 멀어졌다가, **Claude Code를 쓰면서 다시 자주 쓰게 되어** 이참에 간단히 정리한다는 도입.
- 페인 포인트 3가지(독자 공감): ① 터미널 탭이 너무 많아져 관리가 힘들다 ② SSH가 끊기면 돌아가던 작업이 날아간다 ③ 화면을 나눠 동시에 보기 번거롭다.
- 이 글에서 다룰 범위 한 줄 안내(설치는 macOS 기준, 마지막에 Claude Code 활용).

작성 예시(초안 — 다듬어도 됨):
```markdown
예전에 Linux 서버를 자주 다룰 때는 `tmux` 없이 일하는 게 상상이 안 됐다. 그런데 로컬 개발 위주로 일하면서 한동안 잊고 지냈는데, 요즘 Claude Code 같은 터미널 기반 AI 코딩 도구를 쓰면서 다시 손이 가기 시작했다. 이참에 입문자 관점에서 tmux를 간단히 정리해 둔다.

혹시 이런 경험이 있다면 tmux가 답이 될 수 있다.

- 터미널 탭이 10개씩 열려서 어디에 뭐가 있는지 모르겠다.
- 원격 서버에서 작업하다 SSH가 끊겨 돌아가던 빌드/스크립트가 통째로 날아갔다.
- 한 화면에서 코드 편집과 로그를 같이 보고 싶은데 창을 계속 왔다 갔다 한다.
```

- [ ] **Step 2: UTF-8 인코딩 확인**

Run: `file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"`
Expected: `... charset=utf-8`

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "docs: 들어가며 섹션 작성"
```

---

## Task 3: "2. tmux란?" 섹션 작성

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 2. tmux란?` 아래)

- [ ] **Step 1: 개념 + 두 가지 핵심 가치 작성**

내용 요소:
- tmux = **t**erminal **mux**(multiplexer). 하나의 터미널 창 안에서 여러 세션/화면을 다루고, 그 세션을 백그라운드에 띄워둘 수 있게 해주는 도구.
- 핵심 가치 ①: **세션 지속성(persistence)** — tmux 세션은 터미널을 닫거나 SSH가 끊겨도 백그라운드에 살아있다. 나중에 다시 붙으면(attach) 하던 작업이 그대로 있다.
- 핵심 가치 ②: **화면 분할** — 하나의 화면을 여러 윈도우/페인으로 나눠 동시에 여러 작업을 본다.
- 한 줄 비유: "닫아도 사라지지 않는, 칸막이를 자유롭게 나눌 수 있는 작업 공간".

- [ ] **Step 2: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: tmux란 섹션 작성"
```

---

## Task 4: "3. 설치 (macOS)" 섹션 작성

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 3. 설치 (macOS)` 아래)

- [ ] **Step 1: Homebrew 설치 안내 작성**

macOS만 다룬다(Linux 생략). 내용:
```markdown
macOS에서는 Homebrew로 한 줄이면 끝난다.

​```bash
brew install tmux
​```

설치 후 버전을 확인한다.

​```bash
tmux -V
# tmux 3.5a  (예시)
​```
```
(위 코드펜스의 제로폭 문자는 실제 작성 시 제거하고 ```bash 로 쓴다.)

- [ ] **Step 2: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: 설치 섹션 작성"
```

---

## Task 5: "4. 핵심 개념: Session, Window, Pane" 섹션 작성 (Mermaid)

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 4. 핵심 개념` 아래)

- [ ] **Step 1: 계층 구조 설명 + Mermaid 다이어그램 작성**

세 개념의 관계: **Session > Window > Pane**.
- Session: tmux의 최상위 작업 공간 단위. 보통 프로젝트/작업 하나당 세션 하나. detach/attach 대상.
- Window: 세션 안의 "탭". 하나의 화면 전체를 차지하며 여러 개를 번갈아 본다.
- Pane: 윈도우를 나눈 분할 화면. 한 윈도우 안에 여러 페인이 동시에 보인다.

아래 Mermaid 다이어그램을 포함한다(노드 텍스트에 `<br/>` 금지):
```markdown
​```mermaid
graph TD
    S[Session: my-project] --> W1[Window 1: editor]
    S --> W2[Window 2: server]
    W1 --> P1[Pane: code]
    W1 --> P2[Pane: logs]
    W2 --> P3[Pane: dev server]
​```
```

- [ ] **Step 2: Mermaid 문법 점검 (수동)**

확인 항목: 코드펜스가 ` ```mermaid `로 시작하는지, 노드 텍스트에 `<br/>`/`<br>`/HTML 태그가 없는지, 노드 라벨에 콜론(`:`)만 있고 따옴표가 필요한 특수문자가 없는지.

- [ ] **Step 3: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: 핵심 개념 섹션 + Mermaid 다이어그램 작성"
```

---

## Task 6: "5. 기본 사용법" 섹션 작성 (+ 치트시트 표)

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 5. 기본 사용법` 아래)

- [ ] **Step 1: prefix 키 개념 작성**

내용: tmux의 거의 모든 단축키는 **prefix 키를 먼저 누른 뒤** 다음 키를 누른다. 기본 prefix는 `Ctrl+b`. 이 글에서는 `prefix`로 표기하며 `prefix c`는 "Ctrl+b를 누르고 손을 뗀 뒤 c"를 뜻한다고 명시.

- [ ] **Step 2: 세션 명령 작성**

```markdown
- 새 세션 시작(이름 지정): `tmux new -s my-project`
- 세션에서 빠져나오기(detach): `prefix d` (세션은 계속 살아있음)
- 세션 목록 보기: `tmux ls`
- 세션에 다시 붙기(attach): `tmux attach -t my-project`
- 세션 종료: `tmux kill-session -t my-project`
```

- [ ] **Step 3: 윈도우 명령 작성**

```markdown
- 새 윈도우: `prefix c`
- 다음/이전 윈도우: `prefix n` / `prefix p`
- 번호로 이동: `prefix 0` ~ `prefix 9`
- 윈도우 이름 변경: `prefix ,`
```

- [ ] **Step 4: 페인 명령 작성**

```markdown
- 좌우 분할: `prefix %`
- 상하 분할: `prefix "`
- 페인 간 이동: `prefix 방향키`
- 페인 크기 조절: `prefix Ctrl+방향키`
- 현재 페인 닫기: `prefix x` (확인 후 y)
```

- [ ] **Step 5: 핵심 단축키 치트시트 표 작성**

마크다운 표로 위 명령을 한눈에 정리:
```markdown
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
```

- [ ] **Step 6: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: 기본 사용법 + 치트시트 섹션 작성"
```

---

## Task 7: "6. .tmux.conf 최소 설정" 섹션 작성

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 6. .tmux.conf 최소 설정` 아래)

- [ ] **Step 1: 입문자용 최소 설정 작성**

"딱 이만큼만"이라는 톤으로 부담을 줄인다. 설정 파일 위치는 `~/.tmux.conf`.

```markdown
처음부터 화려하게 꾸밀 필요 없다. 입문자에게 체감이 큰 네 가지만 `~/.tmux.conf`에 넣어보자.

​```bash
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
​```

저장 후 적용하려면 tmux 안에서 `prefix r`을 누르거나, `tmux kill-server` 후 다시 시작한다.
```
(코드펜스의 제로폭 문자는 실제 작성 시 제거.)

- [ ] **Step 2: prefix 변경은 선택임을 명시**

`Ctrl+a`로 바꾸면 기본 prefix와 달라지므로, 이후 본문 단축키는 여전히 `Ctrl+b`(기본) 기준임을 한 줄로 안내해 혼란 방지.

- [ ] **Step 3: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: .tmux.conf 최소 설정 섹션 작성"
```

---

## Task 8: "7. Claude Code와 함께 쓰기" 섹션 작성 (피날레 + 헬퍼 스크립트)

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 7. Claude Code와 함께 쓰기` 아래)

- [ ] **Step 1: 도입 — 왜 궁합이 좋은가 작성**

두 가지 이유: ① Claude Code의 장시간 자율 작업이 detach로 살아남아 중간에 터미널을 닫아도 됨 ② 한 화면에서 Claude + dev server/로그를 동시에 보며 병렬로 일할 수 있음.

- [ ] **Step 2: 패턴 A — 한 화면 레이아웃 작성**

내용: 윈도우 하나를 페인으로 나눠 왼쪽엔 `claude`, 오른쪽 위엔 dev server(`npm run dev`), 오른쪽 아래엔 로그/테스트를 띄우는 구성. 만드는 절차를 단축키로 안내(`prefix %`, `prefix "`).

- [ ] **Step 3: 패턴 B — 지속성 & 원격 작성**

내용:
```markdown
- `tmux new -s claude-feature` 로 세션을 만들고 그 안에서 `claude` 실행
- 긴 작업을 시킨 뒤 `prefix d`로 detach → 노트북을 닫거나 SSH가 끊겨도 작업은 계속됨
- 나중에 `tmux attach -t claude-feature`로 다시 붙으면 대화 기록과 출력이 그대로 남아있다
- 원격 서버(VPS)에 띄워두면 사무실·집, 심지어 폰에서 SSH로 붙어 이어서 작업할 수 있다
```

- [ ] **Step 4: 패턴 C — 멀티 프로젝트 헬퍼 스크립트 작성**

여러 프로젝트를 세션별로 한 번에 띄우는 `bin/claude_tmux_sessions.sh`를 코드블록으로 제공한다.

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

주의 한 줄 포함: **같은 repo에 Claude 인스턴스 두 개가 동시에 파일을 쓰면 충돌**할 수 있으니, 병렬 작업은 작업별로 디렉토리를 나누거나 `git worktree`로 분리하라.

- [ ] **Step 5: 헬퍼 스크립트 bash 문법 검증**

글에 넣은 스크립트를 임시 파일로 저장해 문법만 검사하고 삭제한다.

Run:
```bash
cat > /tmp/claude_tmux_sessions.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
PROJECTS=(
  "blog:$HOME/src/blog-v2.advenoh.pe.kr"
)
for entry in "${PROJECTS[@]}"; do
  name="${entry%%:*}"
  path="${entry#*:}"
  if tmux has-session -t "$name" 2>/dev/null; then
    echo "재사용: $name"
  else
    tmux new-session -d -s "$name" -c "$path"
  fi
done
tmux ls
EOF
bash -n /tmp/claude_tmux_sessions.sh && echo "syntax OK" && rm /tmp/claude_tmux_sessions.sh
```
Expected: `syntax OK`

- [ ] **Step 6: 참고(짧게) — 공식 Agent Teams 언급 작성**

한두 문장으로: Claude Code에는 여러 세션을 자동으로 띄워 협업시키는 공식 `Agent Teams` 기능(`tmux -CC` 컨트롤 모드 활용)도 실험적으로 제공된다. 더 깊이 들어가고 싶으면 공식 문서를 참고하라며 링크만 남긴다. (https://code.claude.com/docs/en/agent-teams)

- [ ] **Step 7: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: Claude Code 활용 섹션 + 헬퍼 스크립트 작성"
```

---

## Task 9: "8. 마치며" + 참고 링크 작성

**Files:**
- Modify: `docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md` (`# 8. 마치며` 아래)

- [ ] **Step 1: 마무리 + 핵심 단축키 요약 작성**

내용: tmux의 진짜 가치는 "닫아도 사라지지 않는 작업 공간"이라는 한 줄 정리. 가장 자주 쓰는 단축키 5개(`tmux new -s`, `prefix d`, `tmux attach -t`, `prefix c`, `prefix %`)를 다시 한번 짚어주고, 일단 detach/attach부터 손에 익히길 권한다.

- [ ] **Step 2: 참고 링크 섹션 작성**

글 맨 아래에 `## 참고` 헤딩으로 출처 링크를 목록으로 추가:
```markdown
## 참고

- [tmux + Claude Code: The Perfect Terminal Workflow](https://willness.dev/blog/tmux-claude-code-workflow)
- [Using tmux with Claude Code](https://hboon.com/using-tmux-with-claude-code/)
- [How to Run Claude Code with tmux on a VPS](https://codeongrass.com/blog/how-to-run-claude-code-with-tmux/)
- [Seamless Claude Code Handoff: SSH From Your Phone With tmux](https://elliotbonneville.com/phone-to-mac-persistent-terminal/)
- [Claude Code Multi-Agent tmux Setup](https://www.dariuszparys.com/claude-code-multi-agent-tmux-setup/)
- [Claude Code 공식 Agent Teams 문서](https://code.claude.com/docs/en/agent-teams)
```

- [ ] **Step 3: UTF-8 인코딩 확인 + 커밋**

```bash
file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"
git add -A && git commit -m "docs: 마치며 + 참고 링크 작성"
```

---

## Task 10: 최종 검수

**Files:** 없음 (검토만)

- [ ] **Step 1: 전체 글 통독 점검**

확인 항목:
- 8개 섹션이 모두 채워졌는가 (빈 헤딩 없음)
- prefix 표기가 전부 `Ctrl+b` 기준으로 일관적인가 (Task 7에서 `Ctrl+a`로 바꾼 건 "선택"으로만 안내했는지)
- 입문자가 위→아래로 따라 하면 막히는 곳이 없는가

- [ ] **Step 2: Mermaid / 코드펜스 점검**

Run:
```bash
grep -n "br/>\|<br>" "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md" || echo "no <br> tags - OK"
grep -n '```' "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md" | wc -l
```
Expected: `<br>` 태그 없음. 코드펜스 백틱 라인 수가 짝수(열고 닫힘 일치).

- [ ] **Step 3: UTF-8 최종 확인**

Run: `file -I "docs/read/tmux-입문-터미널-세션-관리부터-claude-code-활용까지/index.md"`
Expected: `... charset=utf-8`

- [ ] **Step 4: 최종 커밋 (필요 시)**

```bash
git add -A && git commit -m "docs: tmux 입문 글 최종 검수" --allow-empty
```

---

## Self-Review (작성자 점검 결과)

**Spec 커버리지:**
- 들어가며(개인 배경 + 페인 포인트) → Task 2 ✅
- tmux란/두 가지 가치 → Task 3 ✅
- 설치 macOS만 → Task 4 ✅
- Session/Window/Pane + Mermaid → Task 5 ✅
- 기본 사용법 + 치트시트 → Task 6 ✅
- .tmux.conf 최소 설정(포함 결정) → Task 7 ✅
- Claude Code 3패턴(A/B/C) + 헬퍼 스크립트 + Agent Teams 링크 → Task 8 ✅
- 마치며 + 참고 링크 → Task 9 ✅
- 컨벤션(category 제외/Mermaid/UTF-8) → 공통 규칙 + Task 1·5·10에서 검증 ✅

**플레이스홀더 스캔:** frontmatter `description`은 Task 1에서 실제 문장으로 채움(빈 값 아님). 그 외 TBD/TODO 없음.

**일관성:** 단축키 표기 `prefix`(=`Ctrl+b`) 통일. 세션 예시 이름은 `my-project`/`claude-feature`로 맥락별 구분(혼동 없음). 헬퍼 스크립트 변수명(`name`/`path`/`entry`)이 Task 8 본문과 Step 5 검증 코드에서 동일.

---

## Execution Handoff

계획을 `docs/superpowers/plans/2026-05-25-tmux-claude-code-guide.md`에 저장했다. 실행 방식 두 가지:

1. **Subagent-Driven (권장)** — task마다 새 subagent를 띄워 작성하고 사이에 리뷰
2. **Inline Execution** — 이 세션에서 task를 순서대로 작성, 체크포인트에서 검토

어느 방식으로 진행할지 알려주세요.