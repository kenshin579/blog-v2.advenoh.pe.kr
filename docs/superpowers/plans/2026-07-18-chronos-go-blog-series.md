# Chronos-go 블로그 시리즈 집필 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chronos-go의 구현을 스터디하며, 분산 태스크 큐의 설계 문제를 다루는 9편짜리 한글 블로그 시리즈 초안을 `docs/read`에 작성한다.

**Architecture:** 편별 반복 워크플로우(코드 스터디 → 초안 작성 → 리뷰). 각 편은 "도입(문제 제기 + 위치 다이어그램) → 원리(mermaid) → 구현 해부(실제 코드 발췌) → 정리" 4단 구조를 공유한다. 한 번에 한 편씩 진행하며, 코드 스터디 단계가 스터디의 핵심이자 사실 검증 지점이다.

**Tech Stack:** Markdown + YAML frontmatter, mermaid 다이어그램(blog-v2 `mermaid-renderer.tsx`가 렌더링). 소재는 `chronos-go` Go 소스와 `internal/rdb`의 임베드 Lua 스크립트.

**설계 문서:** `docs/superpowers/specs/2026-07-18-chronos-go-blog-series-design.md`

---

## 이 계획의 특성 (코드 프로젝트와 다른 점)

이것은 집필 계획이라 TDD(failing test)가 없다. 대신 각 편의 **검증**은 두 가지다.

1. **사실 검증(코드 스터디 단계)** — 글에 쓸 동작 설명이 실제 코드와 일치하는지, 스터디 단계에서 소스를 직접 읽어 확인한다. 오해가 있으면 여기서 걸러낸다.
2. **렌더링 검증(최종화 시점)** — `contents/`로 옮긴 뒤 `npm run check`와 빌드가 통과하는지 확인한다. (초안 단계인 `docs/read`에서는 빌드 대상이 아니다.)

**워크플로우 (2026-07-19 변경):** 1편은 대화형으로 함께 작성·리뷰했다. 시간 절약을 위해 **2~9편은 배치로 한꺼번에 작성**하고(편별 독립성을 살려 병렬 에이전트로 진행), 완성된 시리즈 전체를 한 번에 리뷰한다. 각 편은 반드시 실제 코드로 사실을 검증한 뒤 작성한다.

## 공유 규칙 (모든 편 공통)

### 프론트매터 템플릿

```yaml
---
title: "Chronos-go로 배우는 분산 태스크 큐 N편 - <부제>"
description: "<이 편이 다루는 문제를 한 문장으로, 검색 키워드 포함>"
date: 2026-07-18
update: 2026-07-18
tags:
  - golang
  - redis
  - distributed-systems
  - task-queue
  - <편별 키워드>
  - 분산시스템
  - 태스크큐
series: "Chronos-go로 배우는 분산 태스크 큐"
---
```

- `date`/`update`는 실제 작성일로 채운다.
- `series` 값은 9편 전체에서 **글자 하나까지 동일**해야 한다(시리즈 그룹핑 키).

### 4단 본문 구조 (모든 편)

1. **도입** — 일반 문제 제기 + 시리즈 전체 지도에서 현재 위치를 표시한 미니 mermaid 다이어그램.
2. **원리** — Redis 자료구조/명령 흐름을 mermaid sequence/flow로 설명.
3. **구현 해부** — chronos-go 코드 발췌 2~4개 + 해설. 발췌 기준 커밋 해시를 각 편 하단에 명시.
4. **정리** — 핵심 요약 + 다음 편 예고.

### heading 스타일

`content-heading-style` 스킬(`docs/read`·`contents` 작업 시 자동 활성화)의 목차 번호 규칙을 따른다. 초안 작성 직전 스킬 지침을 확인한다.

### 파일 위치

- 초안: `docs/read/chronos-go-{N}-{슬러그}/index.md`
- 최종: 사용자 결정 시 `contents/go/`로 이동.

### 발췌 기준 커밋 고정

각 편 작성 시작 시 아래를 실행해 커밋 해시를 기록하고, 그 해시를 글 하단 "코드 기준" 각주에 적는다.

```bash
git -C ../../chronos-go rev-parse --short HEAD
```

(경로는 `blog-v2.advenoh.pe.kr` 기준 상대경로. 실제 실행 시 chronos-go 절대경로 사용: `/Users/user/src/workspace_blogv2/chronos-go`)

---

## 편별 소재 매핑 (스터디 시작점)

각 편의 "코드 스터디" 단계에서 먼저 읽을 파일이다. 경로는 `chronos-go/` 기준.

| 편 | 슬러그(안) | 1차로 읽을 파일 | 보조 파일 |
|----|-----------|----------------|----------|
| 1 | `chronos-go-1-전체-아키텍처` | `README.md`(How it works), `internal/base/keys.go`, `doc.go` | `chronos.go`, `server.go` (컴포넌트 조립) |
| 2 | `chronos-go-2-redis-stream-즉시-큐` | `internal/rdb/rdb.go`(enqueue/dequeue), `server.go`(워커 루프) | `internal/base/task.go`, `codec.go` |
| 3 | `chronos-go-3-지연-작업과-forwarder` | `internal/rdb/forward.go`, `schedule.go` | `internal/rdb/schedule.go` |
| 4 | `chronos-go-4-재시도-dlq-janitor` | `internal/rdb/retry.go`, `retry.go`, `internal/rdb/janitor.go` | `handler.go`(handler outcome) |
| 5 | `chronos-go-5-크래시-복구-at-least-once` | `internal/rdb/recover.go`, `internal/rdb/heartbeat.go` | `server.go`(recoverer/heartbeat 기동) |
| 6 | `chronos-go-6-큐-우선순위-wrr` | `wrr.go`, `internal/rdb/pause.go` | `server.go`(큐 선택), `internal/base/keys.go`(paused) |
| 7 | `chronos-go-7-리더-선출-스케줄러` | `internal/rdb/leader.go`, `scheduler.go`, `internal/rdb/periodic.go` | `schedule.go` |
| 8 | `chronos-go-8-chain-group-오케스트레이션` | `internal/rdb/chain.go`, `internal/rdb/group.go`, `chain.go`, `group.go` | `handler.go`(AddHandlerR, PrevResult) |
| 9 | `chronos-go-9-cluster-해시태그-lua-원자성` | `internal/base/keys.go`(해시 태그 주석), `internal/rdb/unique.go` | 앞선 편들에서 본 Lua 스크립트 재검토 |

---

## Task 1: 시리즈 스캐폴딩 (공유 자산 확정)

**Files:**
- Create: `docs/read/chronos-go-1-전체-아키텍처/` (폴더)
- 참고: `docs/superpowers/specs/2026-07-18-chronos-go-blog-series-design.md`

- [ ] **Step 1: 시리즈명·프론트매터 템플릿 최종 확정**

위 "공유 규칙"의 프론트매터 템플릿을 그대로 채택한다. `series: "Chronos-go로 배우는 분산 태스크 큐"`를 9편 공통 상수로 고정한다.

- [ ] **Step 2: 발췌 기준 커밋 기록**

Run: `git -C /Users/user/src/workspace_blogv2/chronos-go rev-parse --short HEAD`
Expected: 짧은 커밋 해시 출력. 이 값을 1편 각주에 사용.

- [ ] **Step 3: 커밋 (선택)**

`docs/read`는 blog-v2 저장소의 추적 대상인지 먼저 확인(`git -C /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr status`). 추적한다면 feature 브랜치에서 진행, 아니면 커밋 없이 초안만 작성.

---

## Task 2~10: 각 편 집필 (동일 반복 구조)

아래 5단계를 **1편부터 9편까지 순서대로** 반복한다. N과 파일 경로는 위 "편별 소재 매핑" 표에서 가져온다.

### 반복 단계 (편 N)

- [ ] **Step 1: 코드 스터디**

"편별 소재 매핑" 표의 파일을 읽고, 다음을 한 문단으로 정리해 사용자에게 공유한다:
  - 이 서브시스템이 사용하는 Redis 자료구조와 키
  - 핵심 동작 시퀀스(명령 순서)
  - 발췌할 가치가 있는 코드 2~4곳(Lua 스크립트 우선)
  - 스터디하며 새로 이해한 점 / 헷갈렸던 점

이 단계에서 사용자와 사실관계를 맞춘 뒤 초안으로 넘어간다.

- [ ] **Step 2: mermaid 다이어그램 작성**

이 편의 (a) 시리즈 위치 미니맵, (b) 원리 설명용 sequence/flow 다이어그램을 작성한다. blog-v2가 지원하는 mermaid 문법만 사용(```mermaid 코드 펜스).

- [ ] **Step 3: 초안 작성**

`docs/read/chronos-go-{N}-{슬러그}/index.md`에 프론트매터 + 4단 구조로 초안을 쓴다.
  - 코드 발췌는 Step 1에서 고른 실제 코드를 그대로 인용(임의 재작성 금지).
  - 하단에 "코드 기준: chronos-go @ `<커밋해시>`" 각주.
  - UTF-8 인코딩 확인: `file -I docs/read/chronos-go-{N}-{슬러그}/index.md`

- [ ] **Step 4: 사용자 리뷰**

초안을 사용자가 읽고 수정 요청. 사실 오류/설명 보강/톤 조정 반영.

- [ ] **Step 5: 다음 편으로**

이 편이 승인되면 다음 편(N+1)의 Step 1로 이동. 마지막 9편까지 반복.

---

## 최종화 (전체 시리즈 또는 사용자 결정 시점)

편별 초안이 준비되고 사용자가 게시를 결정하면:

- [ ] **Step 1: `contents/go/`로 이동**

`docs/read/chronos-go-{N}-{슬러그}/` → `contents/go/chronos-go-{N}-{슬러그}/`

- [ ] **Step 2: 1편 cover 이미지**

1편은 `cover.png` 필요. `generate-blog-image` 스킬로 생성하거나 사용자 제공 이미지 사용.

- [ ] **Step 3: 타입/빌드 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
npm run check
npm run build
```
Expected: 타입 검사 통과, 빌드 성공(시리즈 글이 목록/시리즈 그룹에 노출).

- [ ] **Step 4: PR 생성**

`feature/chronos-series` 브랜치에서 `gh pr create` + HEREDOC 사용(PR 본문 영어 불필요 — blog-v2는 개인 블로그, 단 chronos-go 저장소에 커밋할 일이 있으면 그쪽은 영어). PR 단위(편별 vs 묶음)는 사용자와 결정.

---

## Self-Review (계획 vs 설계 문서)

- **스펙 커버리지:** 9편 목차 → Task 2~10 반복으로 전부 커버. 4단 구조/프론트매터/파일 규칙/워크플로우 → 공유 규칙 및 반복 단계에 반영. 비목표(영문판·미니 재현·contrib)는 계획에 포함하지 않음(일치). ✅
- **Placeholder 스캔:** 슬러그·제목은 "(안)"으로 표기하고 확정 시점(초안 작성)을 명시 — 열린 항목으로 설계 문서에 이미 선언됨. 코드 발췌 내용을 지금 채우지 않는 것은 의도(코드 스터디 결과에 의존). ✅
- **일관성:** 시리즈명 문자열, 슬러그 규칙(`chronos-go-{N}-{슬러그}`), 소재 파일 경로가 표와 반복 단계에서 동일. ✅
