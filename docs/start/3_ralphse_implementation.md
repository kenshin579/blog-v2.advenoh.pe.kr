# Ralph Loop 블로그 - 구현 문서

## 1. 산출물

| 산출물 | 경로 | 설명 |
|--------|------|------|
| 블로그 글 | `docs/start/ralph-loop-완벽-가이드/index.md` | 단일 글 (개념 + 실전 데모) |
| 샘플 코드 | `tutorials-go/ai/ralph-loop/` | Best Practice 형식의 데모 프로젝트 |

---

## 2. 샘플 코드 구조 (`tutorials-go/ai/ralph-loop/`)

```
tutorials-go/ai/ralph-loop/
├── README.md                  # 프로젝트 설명 + 실행 방법
├── loop.sh                    # Ralph Loop 실행 스크립트 (확장 버전)
├── PROMPT_plan.md             # Planning 모드 프롬프트
├── PROMPT_build.md            # Building 모드 프롬프트
├── AGENTS.md                  # 에이전트 운영 가이드
├── CLAUDE.md                  # Ralph Loop용 Claude Code 설정
├── specs/                     # 요구사항 스펙 파일
│   ├── api-server.md          # 예시: HTTP API 서버 스펙
│   └── health-check.md        # 예시: 헬스체크 스펙
├── prd.json                   # PRD JSON (진행 상태 추적)
├── main.go                    # 데모 Go 프로젝트 (간단한 HTTP 서버)
├── main_test.go               # 테스트 코드
└── go.mod                     # Go 모듈
```

### 2.1 loop.sh

기본 루프 + 확장 버전 (모드 선택, 반복 횟수 제한, 자동 push) 포함.

```bash
#!/bin/bash
# Usage: ./loop.sh [plan|build] [max_iterations]

MODE="${1:-build}"
MAX="${2:-0}"
PROMPT_FILE="PROMPT_${MODE}.md"
BRANCH=$(git branch --show-current)
COUNT=0

while true; do
  [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ] && break
  cat "$PROMPT_FILE" | claude -p \
    --dangerously-skip-permissions \
    --output-format=stream-json \
    --model opus \
    --verbose
  git push origin "$BRANCH"
  COUNT=$((COUNT + 1))
done
```

### 2.2 PROMPT_plan.md

- specs/ 디렉토리 분석 지시
- 기존 코드와 Gap Analysis 수행
- IMPLEMENTATION_PLAN.md 생성/업데이트
- **구현 금지**, 분석만 수행

### 2.3 PROMPT_build.md

- IMPLEMENTATION_PLAN.md에서 최우선 작업 선택
- 코드베이스 검색 후 구현 (가정 금지)
- 테스트 실행 → 통과 후 커밋
- IMPLEMENTATION_PLAN.md 업데이트

### 2.4 Best Practice 형식

각 파일에 DO/DON'T 비교 주석 포함:

```markdown
<!-- ✅ DO: 한 가지 작업만 명시 -->
1. IMPLEMENTATION_PLAN.md에서 가장 중요한 항목 하나를 선택하라

<!-- ❌ DON'T: 여러 작업을 한번에 -->
<!-- 1. 모든 미완료 항목을 구현하라 -->
```

### 2.5 specs/ 예시

**좋은 스펙** (적절한 스코프):
```markdown
# API Server
HTTP 서버가 `/api/hello` 엔드포인트에서 JSON 응답을 반환한다.
```

**나쁜 스펙** (과도한 스코프):
```markdown
# 전체 시스템
HTTP 서버, 데이터베이스, 인증, 로깅, 모니터링을 모두 구현한다.
```

### 2.6 Go 데모 프로젝트

Ralph Loop가 자율적으로 만들어갈 간단한 HTTP API 서버:
- `GET /api/hello` - JSON 응답
- `GET /health` - 헬스체크
- 테스트 코드 포함 (Backpressure 역할)

---

## 3. 블로그 글 구현

### 3.1 frontmatter

```yaml
---
title: "Ralph Loop 완벽 가이드 - AI 에이전트 자율 개발 패턴"
description: "Ralph Wiggum Technique의 핵심 개념부터 3단계 워크플로우, PRD 구조, 실전 적용까지 체계적으로 정리합니다"
date: 2026-XX-XX
tags:
  - ralph-loop
  - ai-agent
  - claude-code
  - autonomous-coding
  - prd
  - agentic-engineering
---
```

### 3.2 본문 구성 (8개 섹션)

| 섹션 | 핵심 구현 포인트 |
|------|-----------------|
| 1. Ralph Loop란? | 탄생 배경, 핵심 아이디어, 전통 AI 코딩과 비교 Mermaid 다이어그램 |
| 2. 핵심 구조 | `loop.sh` 코드 블록, 디렉토리 구조, 컨텍스트 관리 전략 |
| 3. 3단계 워크플로우 | Specs → Planning → Building 각 단계별 Mermaid 다이어그램 + 프롬프트 예시 |
| 4. PRD 구조 | `prd.json` 코드 블록, progress.txt/AGENTS.md 역할 설명 |
| 5. 안전과 제어 | 샌드박스, Backpressure 다이어그램, 관찰자 역할 |
| 6. 실전 적용 가이드 | 적합/부적합 프로젝트, Claude Code 설정, **Best Practices (DO/DON'T 7가지)** |
| 7. 구현체 비교 | 4개 구현체 비교 테이블 |
| 8. 마무리 | 개발자 역할 변화, 한계, 향후 전망 |

### 3.3 다이어그램 (Mermaid)

6개 다이어그램 필요:
1. Ralph Loop 전체 워크플로우 (Outer Loop)
2. 단일 반복 Inner Loop (작업 선택 → 구현 → 테스트 → 커밋)
3. 3단계 워크플로우 (Specs → Planning → Building)
4. 컨텍스트 관리 비교 (전통 vs Ralph Loop)
5. 프로젝트 디렉토리 구조
6. Backpressure 메커니즘

### 3.4 코드 참조

블로그 본문에서 `tutorials-go/ai/ralph-loop/`의 코드를 참조/링크:
- GitHub 저장소 URL로 링크
- 핵심 코드는 본문에 코드 블록으로 인라인 포함

---

## 4. 스크린샷 확보

Ralph Loop 실행 경험 후 확보할 스크린샷:
1. Claude Code에서 Ralph Loop 실행 중인 터미널 화면
2. git log로 본 자동 커밋 이력
3. IMPLEMENTATION_PLAN.md 업데이트 모습
