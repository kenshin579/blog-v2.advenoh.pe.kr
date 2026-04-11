# 구현 계획: Hermes Agent 완벽 가이드

## 1. 블로그 글 구조

### 파일 위치
- 블로그 글: `docs/start/hermes-agent-완벽-가이드/index.md`
- 샘플 코드: 블로그 인라인 (별도 저장소 불필요 — 개념 소개 중심)

### 글 구성 (목차)

```
1. 들어가며
   1.1 Hermes Agent란?
   1.2 왜 Hermes Agent인가?
   1.3 Nous Research 소개
2. 설치 및 초기 설정
   2.1 Quick Install (60초 설치)
   2.2 수동 설치
   2.3 초기 설정 (모델 선택, API 키)
   2.4 디렉토리 구조 (~/.hermes/)
3. 핵심 아키텍처
   3.1 Agent Loop 동작 방식
   3.2 프로젝트 구조
   3.3 Context Files 우선순위
   3.4 컨텍스트 압축
4. Learning Loop — 자기 개선의 핵심
   4.1 Skill 자동 생성
   4.2 Skill 개선
   4.3 SKILL.md 파일 형식
   4.4 Skills Hub
5. 다계층 메모리 시스템
   5.1 MEMORY.md
   5.2 USER.md
   5.3 Session Search
   5.4 Honcho
5. 40+ 내장 도구
   6.1 핵심 도구
   6.2 AI 도구
   6.3 에이전트 도구
7. 실전 활용
   7.1 CLI 기본 사용법
   7.2 Python 라이브러리로 사용하기
   7.3 FastAPI 통합 예제
   7.4 Telegram/Discord 연동하기
8. 고급 기능
   8.1 서브에이전트 위임
   8.2 MCP 통합
   8.3 Cron 스케줄링
   8.4 Checkpoints
9. 다른 에이전트와의 비교
   9.1 Hermes vs Claude Code
   9.2 Hermes vs OpenClaw
   9.3 Hermes vs Aider
   9.4 선택 가이드
10. 마무리
    10.1 장단점 정리
    10.2 어떤 경우에 적합한가?
참고
```

## 2. 각 섹션별 핵심 구현 사항

### 1. 들어가며

- Nous Research 소개: Hermes, Nomos, Psyche 모델 패밀리를 만든 AI 연구소
- Hermes Agent의 포지셔닝: "코딩 에이전트"가 아닌 "범용 자율 에이전트"
- 다른 에이전트와의 차이를 한 문장으로: "사용할수록 스스로 성장하는 에이전트"
- GitHub 54K+ 스타, MIT 라이선스, 2026년 2월 출시

### 2. 설치 및 초기 설정

- Quick Install 스크립트 (`curl | bash`)
- 수동 설치 (git clone + uv)
- `hermes model`, `hermes tools`, `hermes config set` 명령어
- `~/.hermes/` 디렉토리 구조도 (Mermaid)

```
~/.hermes/
├── config.yaml          # 주요 설정
├── .env                 # API 키
├── SOUL.md              # 에이전트 아이덴티티
├── memories/            # 영구 메모리
├── skills/              # 에이전트 생성 스킬
├── cron/                # 스케줄 작업
├── sessions/            # Gateway 세션
└── logs/                # 로그
```

### 3. 핵심 아키텍처

- 전체 아키텍처 다이어그램 (Mermaid): Agent Loop을 중심으로 Tools, Memory, Skills, Gateway 연결
- `run_agent.py`의 `AIAgent` 클래스 역할 설명
- Context Files 우선순위: `.hermes.md` > `AGENTS.md` > `CLAUDE.md` > `.cursorrules` (20,000자 제한)
- 컨텍스트 압축: 50% 컨텍스트 사용 시 자동 트리거, 별도 LLM 호출

### 4. Learning Loop

- **핵심 다이어그램**: 4단계 순환 루프 (Mermaid)
  - 작업 수행 → Skill 생성 (5+ 도구 호출) → Skill 개선 (재사용 시) → Memory 축적
- SKILL.md 파일 형식 예제 (frontmatter + 구조)
- Progressive Disclosure 설명 (Level 0/1/2)
- Skills Hub 소스 목록

### 5. 다계층 메모리 시스템

- 메모리 계층 구조도 (Mermaid)
- MEMORY.md: ~2,200자 제한, 에이전트가 자동 큐레이션
- USER.md: ~1,375자 제한, 사용자 프로필
- Session Search: SQLite FTS5 + LLM 요약
- Honcho: 12개 ID 레이어 개요 (심화는 생략)
- 외부 프로바이더 목록만 언급

### 6. 40+ 내장 도구

- Toolset별 표로 정리 (web, terminal, file, browser, vision, image_gen, tts, memory, skills, delegation, code_execution, cronjob)
- `hermes tools` 명령으로 활성화/비활성화
- `execute_code` RPC 패턴 간략 소개

### 7. 실전 활용

- CLI 기본: `hermes`, `hermes -c`, `hermes chat -q`, `hermes model`
- Python 라이브러리: `AIAgent` 클래스 사용법 (chat, run_conversation)
- 도구 접근 제어: `enabled_toolsets`, `disabled_toolsets`
- FastAPI 통합: 간단한 `/chat` 엔드포인트
- Telegram 연동: Gateway 설정 개요

### 8. 고급 기능

- 서브에이전트: `delegate_task`로 최대 3개 동시 생성
- MCP: `config.yaml`에 MCP 서버 설정 + `hermes mcp serve`
- Cron: `cronjob` 도구로 반복 작업
- Checkpoints: 파괴적 작업 전 자동 스냅샷
- Self-Evolution은 간략히 언급만 (별도 저장소 링크)

### 9. 비교

- 비교 표: Hermes vs Claude Code vs OpenClaw vs Aider
- 각 에이전트별 핵심 차이 2~3줄 설명
- 선택 가이드 플로우차트 (Mermaid)

### 10. 마무리

- 장단점 요약 표
- 적합한 사용 사례
- 참고 링크

## 3. 다이어그램 목록

| 번호 | 유형 | 위치 | 설명 |
|------|------|------|------|
| 1 | Mermaid flowchart | 섹션 3 | 전체 아키텍처 (Agent Loop → Tools/Memory/Skills/Gateway) |
| 2 | Mermaid flowchart | 섹션 4 | Learning Loop 4단계 순환 흐름도 |
| 3 | Mermaid flowchart | 섹션 5 | 다계층 메모리 시스템 구조도 |
| 4 | Mermaid flowchart | 섹션 9 | 에이전트 선택 의사결정 흐름도 |

## 4. 블로그 글 작성 가이드

### frontmatter

```yaml
---
title: "Hermes Agent 완벽 가이드 - 스스로 성장하는 오픈소스 AI 에이전트"
description: "Nous Research의 자기 개선형 AI 에이전트 Hermes Agent의 아키텍처, Learning Loop, 메모리 시스템, 실전 활용법까지 완벽 가이드"
date: 2026-04-XX
tags:
  - hermes-agent
  - nous-research
  - ai-agent
  - self-improving
  - open-source
  - mcp
---
```

### 작성 원칙

- OpenClaw 블로그와 겹치는 내용 최소화: Gateway/메시징은 간략히, Learning Loop/메모리에 집중
- 코드 예제는 블로그 인라인으로 충분 (별도 tutorials-python 저장소 불필요)
- Hermes Agent 고유 차별점(Self-improving, Skills, Memory)에 가장 많은 분량 할당
- MCP 통합은 기존 MCP 블로그 참조 링크로 중복 방지
- Self-Evolution(DSPy + GEPA)은 간략히 언급만 (복잡도 높아 별도 글 가능)
