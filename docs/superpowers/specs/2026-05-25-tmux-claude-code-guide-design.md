# tmux 입문 가이드 (+ Claude Code 활용) — 블로그 글 설계

- 작성일: 2026-05-25
- 대상 블로그: `blog-v2.advenoh.pe.kr` (IT 기술 블로그)
- 카테고리: `mac` (설치를 macOS Homebrew 기준으로 다루고, 같은 카테고리에 iterm2 등 터미널 환경 글이 모여 있어 맥락이 맞음)
- **초안 작성 위치**: `docs/read/<글-제목>/index.md` (발행 워크플로우상 `contents/`에 직접 넣지 않음)
- 발행 시 이동 경로: `contents/mac/<글-제목>/index.md`
- 글 작성 컨벤션(blog-v2 CLAUDE.md 준수):
  - frontmatter에 `category` **넣지 않음** (디렉토리로 결정됨)
  - 다이어그램은 **Mermaid만** 사용 (ASCII art 금지, 노드 텍스트에 `<br/>` 금지)
  - 모든 파일 **UTF-8** 인코딩

## 1. 글의 목적 (한 줄)

터미널 초심자도 따라 할 수 있는 **tmux 입문 가이드**. 더불어, 요즘 Claude Code 같은 터미널 기반 AI 코딩 세션을 쓸 때 tmux가 왜 특히 유용한지를 마지막에 보여준다.

- **주제(primary)**: tmux 사용법 (입문자 기준)
- **동기/후킹(secondary)**: "Claude Code 세션을 쓸 때 tmux를 곁들이면 좋다"

이 프레이밍의 장점: tmux 기본기는 글 수명이 길고(낡지 않음) 독자층이 넓다. Claude Code 섹션은 "지금 익혀두면 이래서 좋다"는 신선한 동기를 더한다.

## 2. 독자 / 톤

- **독자 수준**: tmux를 처음 접하거나 이름만 들어본 실무 개발자. 터미널 자체는 익숙하다고 가정.
- **톤**: 입문자가 그대로 따라 칠 수 있게 명령어/단축키를 구체적으로. 개념 → 실습 순서.
- **플랫폼 전제**: 설치는 **macOS(Homebrew)만** 다룬다. (Linux 설치는 생략)

## 3. 구성 (목차)

정석 튜토리얼형: 개념을 차곡차곡 쌓고, Claude Code 활용을 피날레(클라이맥스)로 배치한다.

1. **들어가며** — 개인적 배경 + 페인 포인트
   - 개인적 배경: 원래 **Linux 서버를 다룰 때** tmux를 자주 썼는데, 한동안 멀어졌다가 **Claude Code를 쓰면서 다시 자주 쓰게 되어** 이 참에 간단히 정리한다는 도입 맥락
   - 페인 포인트: 터미널 탭 지옥, SSH 끊기면 작업 날아감, 화면 분할이 번거로움
2. **tmux란?** — 터미널 멀티플렉서 개념. 두 가지 핵심 가치: ① 세션 지속성(persistence) ② 화면 분할(window/pane)
3. **설치** — macOS Homebrew (`brew install tmux`). 버전 확인.
4. **핵심 개념 3가지** — Session > Window > Pane 계층 구조. **Mermaid 다이어그램**으로 계층 구조를 시각화(ASCII 금지).
5. **기본 사용법** (실습)
   - prefix 키(`Ctrl+b`) 개념 먼저 설명
   - 세션: `new -s`, detach(`prefix d`), `attach -t`, `ls`, `kill-session`
   - 윈도우: 생성(`prefix c`), 이동(`prefix n/p/숫자`), 이름 변경(`prefix ,`)
   - 페인: 분할(`prefix %`, `prefix "`), 이동(`prefix 방향키`), 리사이즈, 닫기
   - **핵심 단축키 치트시트 표**
6. **.tmux.conf 입문 (최소 설정)** — 입문자 부담을 줄여 "딱 이만큼만" 제시
   - prefix 변경(예: `Ctrl+a`) 또는 유지 (선택지로 설명)
   - 마우스 모드 on (`set -g mouse on`)
   - 분할 단축키를 직관적으로 (`|`, `-`)
   - 설정 리로드 방법
7. **Claude Code와 함께 쓰기 ★** (피날레)
   - **왜 궁합이 좋은가**: ① 장시간 작업이 detach로 살아남음 ② 한 화면에서 병렬 작업
   - **패턴 A — 한 화면 레이아웃**: 한 페인엔 Claude Code, 옆 페인엔 dev server / 로그 / 테스트
   - **패턴 B — 지속성 & 원격**: detach 후 장시간 작업 → 집/사무실/폰에서 `tmux attach`로 재접속. (원격 서버/SSH 시나리오 포함)
   - **패턴 C — 멀티 프로젝트 세션 + 헬퍼 스크립트**: 프로젝트별 세션을 한 번에 띄우는 `bin/claude_tmux_sessions.sh` 예시 스크립트 제공
   - **참고(짧게)**: Claude Code 공식 `Agent Teams` 기능(`tmux -CC` 컨트롤 모드)도 있다 — 링크만
8. **마치며** — 핵심 단축키 치트시트 요약 + 한 줄 마무리

## 4. 헬퍼 스크립트 (패턴 C) 설계

`bin/claude_tmux_sessions.sh` 예시의 동작 요구사항:

- 미리 정의한 프로젝트 목록(이름 + 경로)을 순회
- 각 프로젝트마다 tmux 세션이 **이미 있으면 재사용, 없으면 새로 생성**하고 해당 디렉토리에서 시작
- (선택) 각 세션에서 `claude` 실행 또는 그냥 셸만 준비
- 마지막에 세션 목록(`tmux ls`)을 출력하거나 첫 세션에 attach

> 주의: 같은 repo에 Claude 인스턴스 2개가 동시에 파일을 쓰면 충돌. 글에서 "각 작업은 별도 디렉토리 / git worktree로 분리하라"는 한 줄 주의를 포함한다.

## 5. 참고 링크 (리서치 결과, 글에 references로 활용)

- tmux + Claude Code 워크플로우: https://willness.dev/blog/tmux-claude-code-workflow
- Using tmux with Claude Code: https://hboon.com/using-tmux-with-claude-code/
- VPS에서 tmux로 Claude Code 유지: https://codeongrass.com/blog/how-to-run-claude-code-with-tmux/
- 폰에서 SSH+tmux로 핸드오프: https://elliotbonneville.com/phone-to-mac-persistent-terminal/
- 멀티 에이전트 tmux 셋업(런처 스크립트): https://www.dariuszparys.com/claude-code-multi-agent-tmux-setup/
- Claude Code 공식 Agent Teams 문서: https://code.claude.com/docs/en/agent-teams

## 6. frontmatter (예정)

```yaml
---
title: "tmux 입문: 터미널 세션 관리부터 Claude Code 활용까지"
description: "..."   # 본문 확정 후 작성. category는 frontmatter에 넣지 않음
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
```

## 7. 범위 밖 (YAGNI)

- Linux/Windows 설치 안내 (macOS만)
- tmux 플러그인 매니저(tpm), 화려한 상태바 테마 등 고급 커스터마이징
- Claude Code 공식 Agent Teams의 상세 사용법 (링크 언급만)
- screen 등 다른 멀티플렉서와의 비교

## 8. 성공 기준

- tmux를 처음 보는 개발자가 글만 따라 해서 세션 생성 → 분할 → detach/attach까지 할 수 있다.
- 마지막 섹션을 읽고 "내 Claude Code 작업에 tmux를 도입해봐야겠다"는 동기가 생긴다.
- 헬퍼 스크립트를 복사해 자기 프로젝트 목록만 바꿔 바로 쓸 수 있다.
