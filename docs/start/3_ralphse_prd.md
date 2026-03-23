# Ralph Loop 완벽 가이드 - 블로그 PRD

## 1. 개요

### 1.1 목적

AI 코딩 에이전트를 반복 실행하여 자율적으로 소프트웨어를 개발하는 **Ralph Loop(Ralph Wiggum Technique)** 패턴을 체계적으로 정리한다. 개념 이해부터 실전 적용까지 다루는 실용 가이드를 작성한다.

### 1.2 대상 독자

- AI 코딩 도구(Claude Code, Cursor 등)를 사용 중인 개발자
- 에이전트 기반 자율 개발 워크플로우에 관심 있는 개발자
- PRD 기반 개발 프로세스를 도입하려는 팀 리드/아키텍트

### 1.3 배경

- Geoffrey Huntley가 2025년 말 고안한 AI 개발 방법론으로, 심슨의 캐릭터 "Ralph Wiggum"에서 이름을 따옴
- 2026년 현재 가장 주목받는 에이전틱 코딩 패턴 중 하나
- Anthropic이 Claude Code 공식 Ralph Wiggum 플러그인을 출시
- 핵심 인사이트: **상태는 LLM 컨텍스트가 아닌 디스크(파일 + git)에 존재**한다
- $50,000 USD 규모 계약을 $297 USD로 달성한 사례가 화제

### 1.4 관련 리소스

- **원작자 블로그**: [ghuntley.com/ralph](https://ghuntley.com/ralph/)
- **구현 가이드**: [ghuntley/how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum)
- **자율 에이전트 구현체**: [snarktank/ralph](https://github.com/snarktank/ralph)
- **Claude Code 플러그인**: [anthropics/claude-code/plugins/ralph-wiggum](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)

---

## 2. 블로그 구성

### 2.1 시리즈 구성

단일 글로 작성한다. 개념 + 실전 데모를 한 글에 담아 독자가 한번에 이해할 수 있도록 구성한다.

| 편 | 제목 (안) | 주요 내용 |
|----|-----------|-----------|
| 단일 | Ralph Loop 완벽 가이드 - AI 에이전트 자율 개발 패턴 | 개념, 구조, 3단계 워크플로우, 데모 프로젝트, 실전 적용 |

### 2.2 블로그 메타 정보

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

- **카테고리**: `ai`
- **Draft 위치**: `docs/start/ralph-loop-완벽-가이드/index.md`
- **Publish 위치**: `contents/ai/ralph-loop-완벽-가이드/`

---

## 3. 블로그 목차

```
# 1. Ralph Loop란?
  ## 1.1 탄생 배경
    - Geoffrey Huntley의 CURSED 프로젝트에서 유래
    - 이름의 유래: 심슨의 Ralph Wiggum (끈질긴 반복의 상징)
    - 2025년 말 바이럴 → 2026년 표준 패턴으로 자리잡음
  ## 1.2 핵심 아이디어
    - "상태는 디스크에, 컨텍스트는 매번 새로"
    - LLM 컨텍스트 윈도우의 한계 (60-70% 이후 성능 저하)
    - 반복 실행으로 "결국 일관성(Eventual Consistency)" 달성
  ## 1.3 Ralph Loop vs 전통적 AI 코딩
    - 일회성 프롬프트 vs 반복 루프
    - 컨텍스트 누적 vs 매번 초기화
    - 비교 테이블 + Mermaid 다이어그램

# 2. 핵심 구조: Loop의 해부학
  ## 2.1 기본 루프 스크립트
    - 가장 단순한 형태:
      while :; do cat PROMPT.md | claude-code ; done
    - 확장 버전: 모드 선택, 반복 횟수 제한, 자동 push
  ## 2.2 프로젝트 디렉토리 구조
    - loop.sh, PROMPT_plan.md, PROMPT_build.md
    - AGENTS.md, IMPLEMENTATION_PLAN.md
    - specs/ 디렉토리
  ## 2.3 컨텍스트 관리 전략
    - 결정론적 스택 할당: 매 루프마다 같은 파일 로드
    - specs에 ~5,000 토큰 할당
    - 40-60% 컨텍스트를 "스마트 존"으로 유지
    - 비싼 작업은 서브에이전트로 위임

# 3. 3단계 워크플로우
  ## 3.1 Phase 1: 요구사항 정의 (Specs)
    - JTBD(Jobs to Be Done) 기반 요구사항 분해
    - Topic of Concern 단위로 스펙 파일 생성
    - 스코프 테스트: "and 없이 한 문장으로 설명 가능한가?"
    - specs/ 디렉토리에 개별 마크다운 파일로 관리
  ## 3.2 Phase 2: 계획 (Planning)
    - PROMPT_plan.md의 역할
    - Gap Analysis: specs vs 현재 코드 비교
    - IMPLEMENTATION_PLAN.md 생성/업데이트
    - 1-2회 반복으로 완료 (구현 금지, 분석만)
  ## 3.3 Phase 3: 구현 (Building)
    - PROMPT_build.md의 역할
    - "루프당 하나의 작업만" 원칙
    - 작업 선택 → 구현 → 테스트 → 커밋 → 플랜 업데이트
    - Backpressure: 테스트/린트가 커밋을 게이팅

# 4. PRD 구조와 진행 상태 추적
  ## 4.1 PRD(Product Requirements Document)의 역할
    - 스코프 정의 + 진행 추적 = 살아있는 TODO 리스트
    - 마크다운 PRD vs JSON PRD (prd.json)
  ## 4.2 prd.json 구조
    - userStories 배열: id, title, passes, priority
    - passes 필드로 완료 상태 추적
    - 우선순위 기반 작업 선택
  ## 4.3 진행 상태 관리
    - progress.txt: 루프 간 학습 내용 전달
    - git commit history: 영속적 상태 저장소
    - AGENTS.md: 운영 지식 축적

# 5. 안전과 제어
  ## 5.1 샌드박스 환경
    - --dangerously-skip-permissions의 위험성
    - Docker, Fly Sprites, E2B 등 샌드박스 필수
    - 격리된 환경에서만 자율 실행
  ## 5.2 Backpressure 메커니즘
    - 테스트 통과 필수 (커밋 게이팅)
    - 타입 체크, 린트 검증
    - 빌드 실패 시 루프 자연 중단
  ## 5.3 관찰자의 역할
    - "루프 안이 아닌 루프 위에 앉아라"
    - 실패 패턴 관찰 → 프롬프트 조정
    - CTRL+C로 수동 개입 포인트 설정

# 6. 실전 적용 가이드
  ## 6.1 적합한 프로젝트
    - Greenfield(신규) 프로젝트에 최적
    - 기계적이고 잘 정의된 작업
    - 자동 검증 가능한 작업 (테스트 존재)
  ## 6.2 부적합한 프로젝트
    - 기존 대규모 코드베이스 (원작자 권장 X)
    - 판단력이 필요한 모호한 요구사항
    - UI/UX 관련 주관적 평가
  ## 6.3 Claude Code에서 Ralph Loop 실행하기
    - Claude Code 플러그인 설치
    - Stop hook 기반 자동 반복
    - CLAUDE.md + PROMPT.md 설정
  ## 6.4 Best Practices
    - ✅ DO: 프롬프트에 "한 가지만" 명시 / ❌ DON'T: 여러 작업을 한 루프에 넣기
    - ✅ DO: 서브에이전트를 읽기용으로 병렬 활용 / ❌ DON'T: 빌드/테스트에 여러 서브에이전트
    - ✅ DO: 플랜이 어긋나면 재생성 (비용 저렴) / ❌ DON'T: 틀어진 플랜을 억지로 따르기
    - ✅ DO: AGENTS.md에 운영 발견사항 기록 / ❌ DON'T: 프롬프트에 모든 규칙 나열
    - ✅ DO: specs 파일을 "and 없이 한 문장"으로 / ❌ DON'T: 하나의 spec에 여러 관심사
    - ✅ DO: 샌드박스 환경에서 실행 / ❌ DON'T: 프로덕션 코드에 --dangerously-skip-permissions
    - ✅ DO: 테스트/린트로 Backpressure 확보 / ❌ DON'T: 검증 없이 자동 커밋

# 7. Ralph Loop의 다양한 구현체
  ## 7.1 Geoffrey Huntley 원본 (bash + claude)
  ## 7.2 snarktank/ralph (PRD-driven, Amp/Claude Code)
  ## 7.3 Claude Code 공식 플러그인 (Stop hook 방식)
  ## 7.4 Vercel의 ralph-loop-agent (AI SDK 기반)
  ## 7.5 비교 테이블

# 8. 마무리
  ## 8.1 Ralph Loop가 바꾸는 개발자의 역할
    - 코더 → 컨텍스트 엔지니어, 관찰자, 아키텍트
    - "루프를 엔지니어링하는 것이 당신의 새로운 일"
  ## 8.2 한계와 주의점
    - 90% 완성 → 나머지 10%는 인간의 영역
    - 보안 위험: 샌드박스 없이 절대 금지
    - 비용 관리: API 호출 비용 모니터링 필요
  ## 8.3 향후 전망
    - Orchestration 레이어 진화 (The Weaving Loom)
    - Agent Teams와의 결합
    - "Everything is a Ralph Loop" 철학

# 참고 자료
```

---

## 4. 논의사항

### 4.1 블로그 범위

- [x] **단일 글 vs 시리즈**: 단일 글로 작성 (개념 + 실전을 한 글에 담아 독자가 한번에 이해 가능)
- [x] **깊이 수준**: 데모 포함 (실제 프로젝트를 Ralph Loop로 만들어보는 과정 포함)

### 4.2 샘플 코드 관련

- [x] **데모 프로젝트 포함**: `tutorials-go/ai/ralph-loop/`에 간단한 Go 프로젝트 + loop.sh + PROMPT.md 구성
- [x] **샘플 코드 범위** (Best Practice 형식으로 제공):
  - `loop.sh` - 기본 루프 스크립트 + 확장 버전 (DO/DON'T 비교)
  - `PROMPT_plan.md` - 계획 모드 프롬프트 (좋은 예 vs 나쁜 예)
  - `PROMPT_build.md` - 빌드 모드 프롬프트 (좋은 예 vs 나쁜 예)
  - `AGENTS.md` - 에이전트 설정 (필수 항목 + 권장 항목 구분)
  - `specs/` - 스펙 파일 (적절한 스코프 vs 과도한 스코프 비교)
  - `prd.json` - PRD JSON (올바른 구조 예시)
  - `CLAUDE.md` - Ralph Loop용 CLAUDE.md 설정 예시

### 4.3 다이어그램 계획

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid (flowchart) | Ralph Loop 전체 워크플로우 (Outer Loop) |
| 2 | Mermaid (flowchart) | 단일 반복의 Inner Loop (작업 선택 → 구현 → 테스트 → 커밋) |
| 3 | Mermaid (flowchart) | 3단계 워크플로우 (Specs → Planning → Building) |
| 4 | Mermaid (sequence) | 컨텍스트 관리: 전통적 방식 vs Ralph Loop |
| 5 | Mermaid (flowchart) | 프로젝트 디렉토리 구조 |
| 6 | Mermaid (flowchart) | Backpressure 메커니즘 (테스트/린트 → 커밋 게이팅) |

### 4.4 스크린샷/이미지 계획

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | 스크린샷 | Claude Code에서 Ralph Loop 실행 중인 터미널 화면 |
| 2 | 스크린샷 | git log로 본 Ralph Loop의 자동 커밋 이력 |
| 3 | 스크린샷 | IMPLEMENTATION_PLAN.md 업데이트 모습 |
| 4 | 이미지 | Ralph Wiggum 캐릭터 (저작권 고려 필요) |

### 4.5 참고 자료 상태

- [x] Geoffrey Huntley 원본 블로그 확인 완료
- [x] how-to-ralph-wiggum GitHub 가이드 확인 완료
- [x] snarktank/ralph 구현체 확인 완료
- [x] Claude Code 플러그인 확인 완료
- [ ] Vercel ralph-loop-agent 상세 확인 필요
- [ ] 실제 Ralph Loop 실행 경험 (스터디하면서 진행 예정)

---

## 5. 작성 규칙

- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **코드 블록**: bash, json, yaml, markdown 등 언어 태그 명시
- **Draft 위치**: `docs/start/ralph-loop-완벽-가이드/index.md`에 초안 작성
- **Publish**: 리뷰 후 `contents/ai/ralph-loop-완벽-가이드/`로 이동
- **인코딩**: UTF-8 필수, 생성 후 `file -I`로 확인
- **샘플 코드** (작성 시): `tutorials-go/ai/ralph-loop/`에 작성

---

## 6. 구현 순서 (마일스톤)

| 단계 | 작업 | 산출물 |
|------|------|--------|
| M1 | Ralph Loop 직접 체험 (간단한 프로젝트에 적용) | 실행 경험 + 스크린샷 확보 |
| M2 | 샘플 코드 작성 | `tutorials-go/ai/ralph-loop/` |
| M3 | 블로그 초안 작성 (섹션 1~4: 개념 + 구조 + 워크플로우 + PRD) | `docs/start/ralph-loop-완벽-가이드/index.md` |
| M4 | 블로그 초안 작성 (섹션 5~8: 안전 + 실전 + 구현체 + 마무리) | 초안 완성 |
| M5 | Mermaid 다이어그램 + 스크린샷 삽입 | 시각 자료 완성 |
| M6 | PR 생성 + 리뷰 | 리뷰 완료 |
| M7 | `contents/ai/ralph-loop-완벽-가이드/`로 이동 후 Publish | 블로그 게시 |

---

## 7. 참고 자료

### 원작자 자료
- [Ralph Wiggum as a "software engineer" - Geoffrey Huntley](https://ghuntley.com/ralph/)
- [Everything is a Ralph Loop - Geoffrey Huntley](https://ghuntley.com/loop/)
- [how-to-ralph-wiggum GitHub Repository](https://github.com/ghuntley/how-to-ralph-wiggum)
- [Inventing the Ralph Wiggum Loop - LinearB Podcast](https://linearb.io/dev-interrupted/podcast/inventing-the-ralph-wiggum-loop)

### 구현체 & 도구
- [snarktank/ralph - Autonomous AI Agent Loop](https://github.com/snarktank/ralph)
- [Claude Code Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)
- [Vercel ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent)
- [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code)
- [mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator)

### 블로그 & 분석
- [What is Ralph Loop? A New Era of Autonomous Coding - Medium](https://medium.com/@tentenco/what-is-ralph-loop-a-new-era-of-autonomous-coding-96a4bb3e2ac8)
- [2026 - The Year of the Ralph Loop Agent - DEV Community](https://dev.to/alexandergekov/2026-the-year-of-the-ralph-loop-agent-1gkj)
- [Mastering Ralph Loops - LinearB Blog](https://linearb.io/blog/ralph-loop-agentic-engineering-geoffrey-huntley)
- [11 Tips For AI Coding With Ralph Wiggum - AI Hero](https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum)
- [Ralph Wiggum AI Agents: The Coding Loop of 2026 - Leanware](https://www.leanware.co/insights/ralph-wiggum-ai-coding)
- [A Brief History of Ralph - HumanLayer Blog](https://www.humanlayer.dev/blog/brief-history-of-ralph)

### 튜토리얼
- [Ralph Loop - Goose Tutorial](https://block.github.io/goose/docs/tutorials/ralph-loop/)
- [Getting Started With Ralph - AI Hero](https://www.aihero.dev/getting-started-with-ralph)
- [Turn AI Agents Into Autonomous Software Engineers - AI Hero Event](https://www.aihero.dev/events/turn-ai-agents-into-autonomous-software-engineers-with-ralph)
