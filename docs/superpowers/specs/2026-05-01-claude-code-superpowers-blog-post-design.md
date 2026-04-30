# "Claude Code Superpowers 완벽 가이드" 블로그 포스트 — 설계 문서

- **작성일**: 2026-05-01
- **블로그 위치 (최종 발행)**: `blog-v2.advenoh.pe.kr/contents/ai/claude-code-superpowers-완벽-가이드/index.md`
- **초안 위치 (작성 단계)**: `blog-v2.advenoh.pe.kr/docs/start/claude-code-superpowers-완벽-가이드/index.md` (블로그 저장소 CLAUDE.md 워크플로우: `docs/start/` → PR 머지 → `docs/merge_ready/` → 발행 시점에 `contents/{카테고리}/`로 이동)
- **목적**: 팀원들에게 Claude Code의 superpowers plugin 사용법을 공유하기 위한 단일 종합 가이드 작성. 실제 진행한 Todo 앱 풀 사이클(PR #701, #702)을 사례로 활용.
- **상태**: 설계 확정 (구현 미착수)

---

## 1. 목적과 범위

### 1.1 목적

`tutorials-go` 저장소에서 Claude Code superpowers plugin을 사용해 Todo 웹앱을 brainstorm 단계부터 PR/머지까지 풀 사이클로 진행한 경험을 정리한다. 팀 동료들이 superpowers를 도입하거나 학습할 때 처음부터 끝까지 한 번에 따라갈 수 있는 종합 레퍼런스 역할을 한다.

### 1.2 콘텐츠 범위

**포함**

- Superpowers의 위치(Claude Code plugin marketplace의 한 plugin) 설명
- 핵심 skill 카탈로그 (brainstorming, writing-plans, subagent-driven-development, executing-plans, requesting-code-review, test-driven-development, using-git-worktrees, finishing-a-development-branch)
- 풀 사이클 흐름도 (mermaid)
- 실제 사례: PR #701 Todo 풀 구현 (백엔드 Echo + 프론트 React + e2e)
- visual companion / MCP playwright 같은 부속 도구 짧은 언급 (PR #702 사이드 reference)
- 시작하기 가이드 (설치/호출/디렉토리 구조)
- 별도 섹션으로 honest 후기 (좋았던 점, 비용/트레이드오프, 함정, 권장 시나리오)

**의도적 제외 (YAGNI)**

- Claude Code 자체 기본 사용법 (sister 포스트 cross-link로 대체)
- Skill/Plugin 일반 개념 (sister 포스트 cross-link)
- 모든 skill의 깊은 내부 동작 분석 (대표 skill 위주)
- 다른 plugin과의 상세 비교 (간단 언급만)
- 영상/대화 기록 전체 (요약 발췌만)

### 1.3 성공 기준

- 길이: ~800줄 (sister 포스트 600~900줄 범위 부합)
- 동료가 본인 프로젝트에 적용할 때 sister 포스트 + 본 글만으로 시작 가능한 정보량
- 사례(5장)에서 실제 PR commit 흐름이 명시적으로 드러남
- 7장(후기)이 "그냥 광고가 아니라 실제 해본 사람의 관찰"로 읽힘
- frontmatter `series: "Claude Code 완벽 가이드"` 편입 → 시리즈 일관성

---

## 2. 메타데이터

| 항목 | 값 |
|---|---|
| 제목 | "Claude Code Superpowers 완벽 가이드: brainstorm부터 PR까지" |
| 슬러그 (URL) | `claude-code-superpowers-완벽-가이드` |
| 발행 위치 | `blog-v2.advenoh.pe.kr/contents/ai/claude-code-superpowers-완벽-가이드/index.md` |
| 초안 위치 | `blog-v2.advenoh.pe.kr/docs/start/claude-code-superpowers-완벽-가이드/index.md` |
| 카테고리 | `ai` |
| series | `Claude Code 완벽 가이드` |
| date / update | 2026-05-01 |
| description | "Claude Code의 superpowers plugin을 사용해 Todo 웹앱을 처음부터 PR까지 만들어본 풀 사이클 가이드. brainstorming, writing-plans, subagent-driven-development, MCP playwright e2e까지 실제 흐름과 후기." |
| tags | Claude Code, Superpowers, AI, Skill, Plugin, Subagent, MCP, Playwright, AI코딩도구, 워크플로우자동화, TDD, 코드리뷰, Anthropic |

### 2.1 frontmatter (최종)

```yaml
---
title: "Claude Code Superpowers 완벽 가이드: brainstorm부터 PR까지"
description: "Claude Code의 superpowers plugin을 사용해 Todo 웹앱을 처음부터 PR까지 만들어본 풀 사이클 가이드. brainstorming, writing-plans, subagent-driven-development, MCP playwright e2e까지 실제 흐름과 후기."
date: 2026-05-01
update: 2026-05-01
tags:
  - Claude Code
  - Superpowers
  - AI
  - Skill
  - Plugin
  - Subagent
  - MCP
  - Playwright
  - AI코딩도구
  - 워크플로우자동화
  - TDD
  - 코드리뷰
  - Anthropic
series: "Claude Code 완벽 가이드"
---
```

---

## 3. 목차 (전체 outline)

sister 포스트들이 사용하는 `# N. 제목` 번호 헤딩 컨벤션을 따른다. 분량은 ~800줄.

```
# 1. 개요                                                      [~30줄]
# 2. Superpowers란                                             [~80줄]
# 3. 핵심 Skill 카탈로그                                       [~120줄]
# 4. 풀 사이클 흐름                                            [~80줄]
# 5. 사례: Todo 웹앱 처음부터 PR까지 (Echo + React)            [~250줄]
  ## 5.1 Brainstorming — visual companion 시연 짧게 + spec 산출
  ## 5.2 Writing-plans — spec → 11 phase plan 자동 생성
  ## 5.3 Subagent-driven-development — implementer + 두 단계 리뷰
  ## 5.4 MCP Playwright로 e2e 자동화
  ## 5.5 PR 생성과 머지 (#701 링크)
# 6. 시작하기 (설치/사용)                                      [~60줄]
# 7. 실제 해보고 느낀 점 (honest 후기)                         [~120줄]
  ## 7.1 좋았던 점
  ## 7.2 비용/트레이드오프
  ## 7.3 함정/주의
  ## 7.4 권장 적용 시나리오
# 8. 마무리                                                     [~30줄]
# 9. 참고                                                       [~20줄]
```

### 3.1 분량 budget

| 섹션 | 예상 줄 수 |
|---|---|
| 1. 개요 | 30 |
| 2. Superpowers란 | 80 |
| 3. 핵심 Skill 카탈로그 | 120 |
| 4. 풀 사이클 흐름 | 80 (mermaid 1개) |
| 5. 사례 (Todo) | 250 (mermaid 1개 + commit 표 + prompt 인용) |
| 6. 시작하기 | 60 |
| 7. 후기 | 120 (4 subsection) |
| 8. 마무리 | 30 |
| 9. 참고 | 20 |
| **합계** | **~790줄** |

여유 있어 다소 늘어도 무방.

---

## 4. 섹션별 핵심 내용

### 4.1 1장 — 개요

- 시작 hook: AI 도구로 코드 작성하다 보면 컨텍스트가 산만해짐, 흐름이 즉흥적이 됨
- superpowers는 brainstorm → plan → impl → review → finish의 구조화된 워크플로우를 강제하는 plugin
- 이 글에서 다룰 것: 핵심 skill 소개 + Todo 웹앱 사례 + 실제 후기

### 4.2 2장 — Superpowers란

- Claude Code plugin marketplace의 공식 plugin
  - cross-link: `[Plugin Hooks 가이드](/articles/claude-code-plugin-hooks-완벽-가이드)`로 plugin 개념 보충
- 여러 skill의 묶음 + skill끼리 정해진 순서로 호출되는 워크플로우
- 다른 Skill 가이드와의 차이
  - cross-link: `[Command/Skill/Subagent 가이드](/articles/claude-code-확장-기능-완벽-가이드-command-skill-subagent)`
- 설치/marketplace 가입 (간단 한 줄, 자세한 건 6장)

### 4.3 3장 — 핵심 Skill 카탈로그

표 형식으로 핵심 skill을 한 번에 훑은 뒤 각 skill 한 단락씩 설명.

| Skill | 역할 | 입력 → 출력 | 본문에서 다루는 깊이 |
|---|---|---|---|
| brainstorming | 아이디어 → spec | 자연어 → spec.md | 깊게 (5장에서 시연) |
| writing-plans | spec → plan | spec.md → plan.md | 깊게 |
| subagent-driven-development | plan → 코드 | plan.md → 커밋들 | 깊게 |
| executing-plans | plan → 코드 (인라인) | plan.md → 커밋들 | 짧게 (대안) |
| requesting-code-review | 코드 → 리뷰 | 브랜치/커밋 → 리뷰 코멘트 | 중간 |
| test-driven-development | 매 phase TDD 강제 | 명시적 Red→Green | 짧게 |
| using-git-worktrees | 격리 워크트리 | feature 작업 격리 | 짧게 |
| finishing-a-development-branch | 마무리 | 작업 끝 → PR/cleanup | 중간 |

### 4.4 4장 — 풀 사이클 흐름

mermaid 다이어그램 1개:

```mermaid
flowchart LR
    A[brainstorming] --> B[writing-plans]
    B --> C[subagent-driven-development]
    C --> D[requesting-code-review]
    D --> E[finishing-a-development-branch]
```

- 각 노드에서 사용자가 호출하는 명령 (`/superpowers:brainstorming` 등)
- skill 간 자동 호출 관계 (brainstorming의 종료가 writing-plans invoke)
- 인-메모리 task list 추적 vs 파일 기반 추적 차이 (subagent-driven vs executing-plans)

### 4.5 5장 — 사례: Todo 웹앱 처음부터 PR까지 (메인 비중)

**5.1 Brainstorming 단계 (~40줄)**
- `/superpowers:brainstorming`로 시작
- 1문항씩 다중선택 형식 — 스택, 기능 범위, 라이브러리 결정
- visual companion은 별도 글 또는 PR #702 참고 (사이드 박스)
- 결과: `docs/superpowers/specs/2026-04-30-todo-app-design.md` 자동 생성

**5.2 Writing-plans 단계 (~30줄)**
- `superpowers:writing-plans` 호출
- spec → 11 phase plan으로 자동 분해 (Pre-flight + Phase 0-10)
- 각 phase는 1 commit 단위, 명시적 Red/Green/Refactor 단계 포함

**5.3 Subagent-driven-development 단계 (~120줄)**

본 사이클의 핵심. 다음 표로 실제 commit 흐름 발췌:

| Phase | Commit | 비고 |
|---|---|---|
| Pre-flight | spec/plan 커밋 | feat/todo-app 브랜치 생성 |
| 0 | 백엔드 main.go 스텁 | go.mod 의존성 확인 |
| 1 | 도메인 모델 | TDD 1번째 — Priority/Validate |
| 1 fixup | 한글 rune count 수정 | 코드 리뷰가 잡은 이슈 |
| 2 | Store CRUD | sync.RWMutex + 동시성 테스트 |
| 5 | FE 인프라 | types/api/MSW |
| 8 | App 통합 + e2e | MSW 풀 라운드트립 |
| 10 fixup | DueDate aliasing 수정 | 최종 코드 리뷰가 잡은 이슈 |

각 phase에서 implementer subagent + spec compliance reviewer + code quality reviewer 3회 디스패치 패턴 설명. 2단계 리뷰가 실제로 critical 이슈를 잡아준 사례 인용 (DueDate pointer aliasing이 package GoDoc 약속을 위반하던 부분 — code reviewer가 발견).

**5.4 MCP Playwright e2e (~30줄)**
- 수동 e2e 시연: navigate → 빈 상태 검증 → 추가 → 토글 → 필터 → 인라인 편집 → 삭제 → BE 다운 시 에러 배너
- Playwright Test 영속화: webServer로 BE+FE 자동 기동, 9개 시나리오 spec
- `make test-e2e`로 회귀 검증 자동화

**5.5 PR 생성과 머지 (~30줄)**
- `git push -u origin feat/todo-app` + `gh pr create --title ... --body "$(cat <<'EOF'...EOF)"`
- `gh pr merge 701 --merge --delete-branch`로 머지 + 브랜치 정리
- 외부 링크: PR #701 https://github.com/kenshin579/tutorials-go/pull/701

### 4.6 6장 — 시작하기

- Plugin marketplace 등록 (정확한 명령은 작성 시 확인)
- `/superpowers:brainstorming` 첫 호출
- 기본 디렉토리 구조 (`docs/superpowers/specs/`, `docs/superpowers/plans/`)
- 작업 진입 전 권장: master/main 브랜치에서 시작하지 말 것 (skill이 feature 브랜치 생성하도록 함)

### 4.7 7장 — 실제 해보고 느낀 점 (honest 후기)

별도 섹션으로 가이드 톤과 분리.

**7.1 좋았던 점**
- Phase 분리로 컨텍스트 오염 거의 0
- 두 단계 리뷰가 critical 이슈 발견 — DueDate 포인터 aliasing 사례
- 회귀 발견을 자연스럽게 유도 (vitest e2e exclude 버그를 phase 4에서 발견 → fix-up commit)
- MCP playwright로 시각 회귀까지 자동화

**7.2 비용/트레이드오프**
- per-task 3회 subagent dispatch (implementer + spec + quality) → 작은 작업은 controller-level 검증으로 단축 가능
- 단순 transcription에 strict 흐름은 과함 → 선택적 적용 팁

**7.3 함정/주의**
- subagent에 plan 파일을 직접 읽히지 말 것 (controller가 발췌해 전달이 정석)
- 한국어 길이 검증은 byte 아닌 rune count로 (`utf8.RuneCountInString`)
- segmented control e2e: hidden radio 패턴은 `getByRole('radio').click()` 안 됨 → label 직접 클릭

**7.4 권장 적용 시나리오 + 미사용 skill**
- 다단계 feature 구현 / 리디자인엔 강력
- 한 줄 fix엔 과함
- 학습/온보딩 자료로 매우 좋음 (재현 가능한 흐름)
- 미사용 skill 추천: `using-git-worktrees`, `executing-plans` (인라인), `finishing-a-development-branch` (자동 PR/cleanup)

### 4.8 8장 — 마무리

- 핵심 takeaway 3-4줄
  - superpowers = 구조화된 AI 코딩 워크플로우
  - 학습/온보딩 가치 ↑
  - 비용 vs 가치는 작업 규모에 따라 조정
- 다음 시도 권장 (worktree, executing-plans 등)

### 4.9 9장 — 참고

- PR #701, #702 외부 링크
- superpowers marketplace 페이지 (작성 시 URL 확인)
- sister 포스트 내부 링크
- Anthropic Claude Code 공식 문서

---

## 5. 시각 자료 정책

| 종류 | 사용처 | 비고 |
|---|---|---|
| **mermaid 다이어그램** (2개) | 4장 풀 사이클, 5장 phase 흐름 | sister 포스트와 일치, ASCII art 금지. 라벨엔 `<br/>` 사용 자제 (termaid CLI 렌더링 호환) |
| **표** (5-8개) | 3장 skill 카탈로그, 5장 commit 발췌, 7장 좋았던점/트레이드오프 | markdown 표준 |
| **이미지** (선택, 1장 권장) | 5.4장에 시각 회귀 검증 캡처 | 파일명 `todo-app-final.png` 또는 `image-{timestamp}.png` |
| **코드 블록** | prompt 발췌, command, frontmatter | bash + tsx + go |

이미지 저장 위치 (초안 단계): `blog-v2.advenoh.pe.kr/docs/start/claude-code-superpowers-완벽-가이드/` (발행 시 `contents/ai/...`로 함께 이동)

---

## 6. 코드/prompt 인용 정책

- **실제 prompt 발췌**: 각 skill 호출 시 출력의 핵심 줄만 인용 (예: "I'm using the writing-plans skill to create the implementation plan.")
- **실제 commit log**: 25 commit 중 대표 6-8개만 표로 발췌
- **실전 명령**: `/superpowers:brainstorming`, `gh pr create --title ... --body "$(cat <<'EOF'...EOF)"` 같은 사용자가 그대로 복사할 수 있는 형태
- **전체 코드 X**: 핵심 발췌. 전체는 PR 링크로
- **prompt 한국어 그대로**: 우리가 실제 한국어로 진행했던 부분 발췌 → 진솔성 ↑

---

## 7. Cross-link

### 7.1 내부 링크 (sister 포스트)
- `[Skill 가이드](/articles/claude-code-확장-기능-완벽-가이드-command-skill-subagent)` — Skill 모음 위치 설명할 때
- `[MCP 추천 가이드](/articles/claude-code-mcp-추천-가이드)` — MCP playwright 언급
- `[Plugin Hooks 가이드](/articles/claude-code-plugin-hooks-완벽-가이드)` — plugin 위치 설명

### 7.2 외부 링크
- PR #701: https://github.com/kenshin579/tutorials-go/pull/701
- PR #702: https://github.com/kenshin579/tutorials-go/pull/702
- superpowers marketplace 페이지 (작성 시 URL 확인)
- Claude Code 공식 문서 (skill 문서)

---

## 8. 작성 순서 (writing-plans skill로 넘어갈 때 참고)

1. **frontmatter + 1, 2, 8, 9장 (개요/소개/마무리/참고)** — 프레임 먼저 잡기
2. **3장 (skill 카탈로그)** — 사실 위주, 빠르게
3. **4장 (흐름) + mermaid 1개**
4. **5장 (사례)** — 가장 시간 많이 쓰이는 부분, PR commit log + prompt 발췌
5. **6장 (시작하기)** — 짧음
6. **7장 (후기)** — 우리 실제 경험 회상해 작성

각 단계는 별도 git commit으로 분리해 진행 추적 가능하게 한다.

---

## 9. 다음 단계

1. 본 spec을 사용자가 검토 → 승인
2. `superpowers:writing-plans` skill로 작성 phase 분해
3. `subagent-driven-development` 또는 `executing-plans`로 글 작성 진행
