# Hermes Agent - 자기 개선형 AI 에이전트 프레임워크 블로그 PRD

## 1. 블로그 개요

| 항목 | 내용 |
|------|------|
| **제목(안)** | Hermes Agent 완벽 가이드 - 스스로 성장하는 오픈소스 AI 에이전트 |
| **대상 독자** | AI 에이전트/자동화에 관심 있는 개발자, Claude Code/OpenClaw 사용자 |
| **카테고리** | AI / Agent Framework / Self-hosted |
| **태그** | `hermes-agent`, `nous-research`, `ai-agent`, `self-improving`, `open-source`, `mcp` |
| **참고 문서** | https://hermes-agent.nousresearch.com/docs/ |

---

## 2. Hermes Agent 소개

### Hermes Agent란?

- **Nous Research**가 개발한 오픈소스 자기 개선형(Self-improving) AI 에이전트 프레임워크
- 2026년 2월 첫 릴리즈, GitHub ~54,000+ 스타, MIT 라이선스
- "The agent that grows with you" — 사용할수록 스스로 학습하고 개선되는 에이전트
- Python 93.9%, Node.js(브라우저 자동화/WhatsApp 브릿지)
- 자체 호스팅(Self-hosted), 제로 텔레메트리

### 핵심 차별점

| 특징 | 설명 |
|------|------|
| **Learning Loop** | 복잡한 작업 완료 후 자동으로 재사용 가능한 Skill 생성 |
| **Persistent Memory** | FTS5 + 큐레이션 메모리 + Honcho 사용자 모델링 |
| **Model Agnostic** | 어떤 LLM 프로바이더든 코드 변경 없이 사용 |
| **Multi-Platform** | 15+ 메시징 플랫폼 동시 지원 (Telegram, Discord, Slack 등) |
| **Sandboxed Execution** | 6가지 터미널 백엔드 (Local, Docker, SSH, Daytona, Singularity, Modal) |
| **MCP 지원** | MCP 클라이언트 + MCP 서버 역할 모두 가능 |

---

## 3. 블로그 핵심 주제

### 3.1 아키텍처 개요

코어 엔진은 `AIAgent` (`run_agent.py`) — 동기식 오케스트레이션 시스템:

```
hermes-agent/
├── agent/          # 코어 에이전트 구현
├── gateway/        # 메시징 플랫폼 통합
├── hermes_cli/     # 터미널 UI
├── skills/         # 내장 스킬 라이브러리
├── tools/          # 40+ 도구 구현
└── cron/           # 스케줄링 시스템
```

주요 아키텍처 레이어:

| 레이어 | 설명 |
|--------|------|
| **Agent Loop** | 모든 작업을 구동하는 단일 오케스트레이션 엔진 |
| **Terminal Backends** | 6개 실행 환경 (Local, Docker, SSH, Daytona, Singularity, Modal) |
| **Messaging Gateway** | 15+ 플랫폼 연결 단일 프로세스 |
| **Memory Subsystem** | 이중 파일 메모리 + SQLite FTS5 + Honcho |
| **Skills Engine** | 점진적 공개(Progressive Disclosure) 스킬 시스템 |
| **Cron Scheduler** | 내장 스케줄 작업 실행 |

### 3.2 Learning Loop (핵심 차별점)

Hermes Agent의 핵심 — 4단계 학습 루프:

1. **Skill Creation** — 복잡한 작업(5+ 도구 호출) 완료 후 자동으로 재사용 가능한 Skill(구조화된 Markdown) 생성
2. **Skill Refinement** — 기존 Skill 재사용 시 결과를 평가하고 개선
3. **Persistent Memory** — `MEMORY.md`와 `USER.md` 파일에 지식 큐레이션 (세션 간 유지)
4. **Session Search** — SQLite FTS5로 모든 과거 대화 전문 검색 + LLM 요약

### 3.3 다계층 메모리 시스템

| 레이어 | 설명 | 구현 |
|--------|------|------|
| **MEMORY.md** | 에이전트가 큐레이션한 환경 노트, 프로젝트 컨벤션, 학습 내용 | ~2,200자 제한 (~800 토큰) |
| **USER.md** | 사용자 프로필: 이름, 선호도, 커뮤니케이션 스타일, 워크플로우 습관 | ~1,375자 제한 (~500 토큰) |
| **Session Search** | 과거 대화 전문 검색 | SQLite FTS5 + LLM 요약 |
| **Honcho (선택)** | 12개 ID 레이어의 변증법적 사용자 모델링 | 크로스 세션 Q&A, 시맨틱 검색 |
| **외부 프로바이더** | 8개 선택적 플러그인 (Mem0, Supermemory, Holographic 등) | 지식 그래프, 시맨틱 검색 |

### 3.4 40+ 내장 도구

| Toolset | 도구 | 설명 |
|---------|------|------|
| **web** | `web_search`, `web_extract` | 인터넷 검색 및 페이지 추출 |
| **terminal** | `terminal`, `process` | 명령 실행, 백그라운드 프로세스 관리 |
| **file** | `read_file`, `patch` | 파일 읽기 및 수정 |
| **browser** | `browser_navigate`, `browser_snapshot`, `browser_vision` | 브라우저 자동화 |
| **vision** | `vision_analyze` | 이미지/비주얼 콘텐츠 분석 |
| **image_gen** | `image_generate` | 텍스트→이미지 (FAL.ai FLUX 2 Pro) |
| **tts** | `text_to_speech` | TTS (Edge, ElevenLabs, OpenAI, NeuTTS) |
| **memory** | `memory` | 영구 저장소 (추가/교체/삭제) |
| **session_search** | `session_search` | 과거 상호작용 검색 |
| **skills** | `skill_manage` | 스킬 CRUD |
| **delegation** | `delegate_task` | 격리된 서브에이전트 생성 (최대 3개 동시) |
| **code_execution** | `execute_code` | 샌드박스 Python RPC |
| **cronjob** | `cronjob` | 반복 작업 스케줄링 |

### 3.5 Skills 시스템

**agentskills.io** 오픈 표준 기반, 점진적 공개(Progressive Disclosure):

- **Level 0**: `skills_list()` — 메타데이터만 반환 (~3k 토큰)
- **Level 1**: `skill_view(name)` — 전체 콘텐츠 로드
- **Level 2**: `skill_view(name, path)` — 특정 참조 파일 조회

스킬 파일 형식 (SKILL.md):

```yaml
---
name: my-skill
description: Brief description
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]
    requires_toolsets: [terminal]
---
# Skill Title
## When to Use
## Procedure
## Pitfalls
## Verification
```

Skills Hub 소스: Official skills, skills.sh, GitHub repos, ClawHub, Well-Known endpoints, LobeHub agents

### 3.6 MCP 통합

```yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

- MCP 클라이언트: 외부 MCP 서버의 도구를 시작 시 자동 탐색 및 등록
- MCP 서버: `hermes mcp serve` 명령으로 Hermes 자체를 MCP 서버로 노출
- stdio와 HTTP 서버 모두 지원

### 3.7 멀티 플랫폼 메시징 Gateway

단일 Gateway 프로세스로 다음 플랫폼 동시 연결:

Telegram, Discord, Slack, WhatsApp, Signal, Email, SMS, Home Assistant, DingTalk, Feishu, WeCom, Weixin, BlueBubbles, Matrix, Mattermost

### 3.8 모델 유연성

코드 변경 없이 어떤 LLM 프로바이더든 사용 가능:

| 프로바이더 | 비고 |
|-----------|------|
| Nous Portal | OAuth |
| OpenRouter | 200+ 모델 |
| OpenAI | GPT 시리즈 |
| Anthropic | Claude 시리즈 |
| Google AI Studio | Gemini |
| Hugging Face | 오픈소스 모델 |
| Custom endpoints | Ollama, vLLM, SGLang, llama.cpp |

모델 전환: `hermes model [provider:model]`

---

## 4. 다른 에이전트 프레임워크와의 비교

| Feature | Hermes Agent | Claude Code | OpenClaw | Aider |
|---------|-------------|-------------|----------|-------|
| **자기 개선** | O (스킬 + 메모리 루프) | X | X | X |
| **영구 메모리** | FTS5 + 큐레이션 + Honcho | 제한적 | X | X |
| **모델 무관** | O (어떤 프로바이더든) | Claude 전용 | O | O |
| **자체 호스팅** | O | 클라우드 서비스 | O | O |
| **멀티 플랫폼** | 15+ 플랫폼 | 터미널 전용 | Web UI | 터미널 |
| **샌드박스 실행** | 6개 백엔드 | X | Docker | X |
| **스킬 자동 생성** | O | X | X | X |
| **라이선스** | MIT | 독점 | MIT | Apache 2.0 |
| **주요 용도** | 범용 자율 에이전트 | 코딩 | 코딩 | 코딩 |
| **MCP 지원** | O | O | X | X |

---

## 5. 블로그 구성 (목차)

```
# 1. 들어가며
  ## 1.1 Hermes Agent란?
  ## 1.2 왜 Hermes Agent인가? (다른 에이전트와의 차이)
  ## 1.3 Nous Research 소개

# 2. 설치 및 초기 설정
  ## 2.1 Quick Install (60초 설치)
  ## 2.2 수동 설치
  ## 2.3 초기 설정 (모델 선택, API 키)
  ## 2.4 디렉토리 구조 (~/.hermes/)

# 3. 핵심 아키텍처
  ## 3.1 Agent Loop 동작 방식
  ## 3.2 프로젝트 구조
  ## 3.3 Context Files 우선순위 (.hermes.md > AGENTS.md > CLAUDE.md)
  ## 3.4 컨텍스트 압축 (자동 압축 메커니즘)

# 4. Learning Loop — 자기 개선의 핵심
  ## 4.1 Skill 자동 생성 (5+ 도구 호출 시 트리거)
  ## 4.2 Skill 개선 (반복 사용 시 자동 리파인먼트)
  ## 4.3 SKILL.md 파일 형식 (agentskills.io 표준)
  ## 4.4 Skills Hub (소스 및 공유)

# 5. 다계층 메모리 시스템
  ## 5.1 MEMORY.md — 환경 노트 및 학습 내용
  ## 5.2 USER.md — 사용자 프로필 모델링
  ## 5.3 Session Search — 과거 대화 전문 검색
  ## 5.4 Honcho — 변증법적 사용자 모델링
  ## 5.5 외부 메모리 프로바이더 (Mem0, Supermemory 등)

# 6. 40+ 내장 도구
  ## 6.1 핵심 도구 (web, terminal, file, browser)
  ## 6.2 AI 도구 (vision, image_gen, tts)
  ## 6.3 에이전트 도구 (delegation, code_execution, cronjob)
  ## 6.4 도구 활성화/비활성화 (hermes tools)

# 7. 실전 활용
  ## 7.1 CLI 기본 사용법
  ## 7.2 Python 라이브러리로 사용하기
  ## 7.3 FastAPI 통합 예제
  ## 7.4 CI/CD 코드 리뷰 자동화
  ## 7.5 Telegram/Discord 연동하기

# 8. 고급 기능
  ## 8.1 서브에이전트 위임 (delegate_task)
  ## 8.2 MCP 통합 (클라이언트 + 서버)
  ## 8.3 Cron 스케줄링
  ## 8.4 Checkpoints (자동 스냅샷 + 롤백)
  ## 8.5 Self-Evolution (DSPy + GEPA)

# 9. 다른 에이전트와의 비교
  ## 9.1 Hermes vs Claude Code
  ## 9.2 Hermes vs OpenClaw
  ## 9.3 Hermes vs Aider
  ## 9.4 선택 가이드 (어떤 에이전트가 적합한가?)

# 10. 마무리
  ## 10.1 장단점 정리
  ## 10.2 어떤 경우에 Hermes Agent가 적합한가?
  ## 10.3 참고 링크

# 참고
```

---

## 6. 코드 예제 (블로그 포함 예정)

### 6.1 설치 및 실행

```bash
# Quick Install
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
hermes

# 모델 설정
hermes model anthropic/claude-sonnet-4
hermes tools          # 도구 활성화/비활성화
hermes config set OPENROUTER_API_KEY sk-or-v1-your-key
```

### 6.2 Python 라이브러리 기본 사용

```python
from run_agent import AIAgent

agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
)
response = agent.chat("What is the capital of France?")
```

### 6.3 대화 히스토리 유지

```python
result = agent.run_conversation(
    user_message="Search for recent Python 3.13 features",
    task_id="my-task-1",
)
print(result["final_response"])
print(f"Messages exchanged: {len(result['messages'])}")

# 멀티턴
result1 = agent.run_conversation("My name is Alice")
history = result1["messages"]
result2 = agent.run_conversation(
    "What's my name?",
    conversation_history=history,
)
```

### 6.4 도구 접근 제어

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    enabled_toolsets=["web"],        # 웹 도구만 활성화
    quiet_mode=True,
)
```

### 6.5 FastAPI 통합

```python
from fastapi import FastAPI
from pydantic import BaseModel
from run_agent import AIAgent

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    model: str = "anthropic/claude-sonnet-4"

@app.post("/chat")
async def chat(request: ChatRequest):
    agent = AIAgent(
        model=request.model,
        quiet_mode=True,
        skip_context_files=True,
        skip_memory=True,
    )
    response = agent.chat(request.message)
    return {"response": response}
```

### 6.6 CI/CD 코드 리뷰

```python
import subprocess
from run_agent import AIAgent

diff = subprocess.check_output(["git", "diff", "main...HEAD"]).decode()
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
    disabled_toolsets=["terminal", "browser"],
)
review = agent.chat(
    f"Review this PR diff for bugs, security issues, and style problems:\n\n{diff}"
)
```

### 6.7 MCP 서버 설정

```yaml
# ~/.hermes/config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

---

## 7. 논의사항

### 7.1 블로그 범위

- [ ] **1편 vs 시리즈**: 내용이 방대하므로 시리즈로 분할할지 1편으로 압축할지 결정 필요
  - 1편안: 소개 + 설치 + 핵심 개념(Learning Loop, 메모리) + 간단 실습 + 비교
  - 시리즈안: 1편(소개+설치+아키텍처), 2편(메모리+스킬 심화), 3편(실전 활용+비교)
- [ ] **실습 범위**: 실제 Hermes Agent를 설치하고 실습한 결과를 포함할지, 개념 위주로 작성할지
- [ ] **코드 예제 위치**: Python 예제를 `tutorials-python/`에 작성할지 블로그 인라인으로 충분할지

### 7.2 기술적 논의

- [ ] **비교 대상 선정**: Claude Code, OpenClaw, Aider 외에 추가 비교할 에이전트가 있는지 (OpenHands, Cline 등)
- [ ] **Self-Evolution**: DSPy + GEPA 자동 진화 기능은 고급 내용인데 블로그에 포함할 깊이 결정
- [ ] **Honcho 메모리**: 변증법적 사용자 모델링까지 다룰지, MEMORY.md/USER.md 수준에서 마무리할지
- [ ] **MCP 통합**: 별도 섹션으로 심화할지 간단 소개 수준으로 유지할지 (기존 MCP 블로그와 중복 고려)

### 7.3 콘텐츠 전략

- [ ] **OpenClaw 블로그와의 차별화**: 기존 OpenClaw PRD(5_openclaw_prd.md)와 겹치는 부분 정리 (메시징 Gateway, 멀티 에이전트 등)
- [ ] **스크린샷/실습 자료**: Hermes CLI 실행 화면, 스킬 자동 생성 과정, Telegram 연동 결과 등
- [ ] **실제 Skill 생성 시연**: 복잡한 작업 수행 → 자동 Skill 생성 → 재사용하는 과정을 직접 보여줄지

### 7.4 일정

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | PRD 작성 및 구조 확정 | ✅ 완료 |
| 2 | Hermes Agent 설치 및 실습 | ⬜ 대기 |
| 3 | 블로그 초안 작성 | ⬜ 대기 |
| 4 | 코드 예제 작성 및 테스트 | ⬜ 대기 |
| 5 | 스크린샷/다이어그램 제작 | ⬜ 대기 |
| 6 | 리뷰 및 발행 | ⬜ 대기 |

---

## 8. 필요한 이미지/다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid | Hermes Agent 전체 아키텍처 (Agent Loop → Tools/Memory/Skills/Gateway) |
| 2 | Mermaid | Learning Loop 4단계 순환 흐름도 |
| 3 | Mermaid | 다계층 메모리 시스템 구조도 |
| 4 | Mermaid | 메시징 Gateway 라우팅 흐름 |
| 5 | Mermaid | Hermes vs Claude Code vs OpenClaw 기능 비교 다이어그램 |
| 6 | 스크린샷 | Hermes CLI 실행 화면 |
| 7 | 스크린샷 | Skill 자동 생성 과정 |

---

## 9. 장단점 정리 (블로그 작성 시 참고)

### 장점

1. **자기 개선**: 사용할수록 Skill과 Memory가 축적되어 점점 나아짐
2. **완전 오픈소스 (MIT)**: 자체 호스팅, 수정, 상업적 사용 자유
3. **모델 무관**: 어떤 LLM이든 코드 변경 없이 교체 가능
4. **범용 에이전트**: 코딩뿐 아니라 리서치, DevOps, 스마트홈 등 다양한 용도
5. **멀티 플랫폼**: $5/월 VPS에서 Telegram으로 원격 작업 가능
6. **6개 샌드박스 백엔드**: 로컬부터 Docker, SSH, Modal까지 유연한 실행 환경
7. **MCP 양방향 지원**: 클라이언트 + 서버 역할 모두 가능

### 단점/고려사항

1. **초기 설정 복잡**: API 키, 모델, Gateway 설정 등 초기 투자 필요
2. **Self-hosted 운영 부담**: 직접 인프라 관리 필요 (vs 매니지드 서비스)
3. **학습 곡선**: Skills, Memory, Context Files 등 개념 이해 필요
4. **프로젝트 성숙도**: 2026년 2월 출시로 아직 초기 단계
5. **문서 부족 가능성**: 빠르게 성장 중이라 문서가 기능을 따라가지 못할 수 있음

---

## 10. 핵심 용어 정리

| 용어 | 설명 |
|------|------|
| **Learning Loop** | 작업 완료 → Skill 생성 → Skill 개선 → 메모리 축적의 순환 루프 |
| **Skill** | 재사용 가능한 구조화된 워크플로우 (SKILL.md 형식) |
| **MEMORY.md** | 에이전트가 큐레이션한 환경 노트 및 학습 내용 |
| **USER.md** | 사용자 프로필 (선호도, 스타일, 습관) |
| **SOUL.md** | 에이전트 아이덴티티 (시스템 프롬프트) |
| **Gateway** | 15+ 메시징 플랫폼과 에이전트를 연결하는 중앙 라우터 |
| **Toolset** | 관련 도구들의 그룹 (web, terminal, file 등) |
| **Delegation** | 격리된 서브에이전트에게 작업 위임 |
| **Honcho** | 12개 ID 레이어의 변증법적 사용자 모델링 시스템 |
| **Context Files** | 프로젝트별 지침 파일 (.hermes.md, AGENTS.md, CLAUDE.md) |
| **Checkpoint** | 파괴적 작업 전 자동 파일시스템 스냅샷 |
| **Progressive Disclosure** | 스킬 메타데이터 → 전체 내용 → 참조 파일 순으로 점진적 로딩 |

---

## 11. 참고 링크

### 공식

- [Hermes Agent 공식 사이트](https://hermes-agent.nousresearch.com/)
- [GitHub - NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
- [공식 문서](https://hermes-agent.nousresearch.com/docs/)
- [설치 가이드](https://hermes-agent.nousresearch.com/docs/getting-started/installation/)

### 기능별 문서

- [도구 & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools)
- [Skills 시스템](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/)
- [Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)
- [Memory Providers](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers)
- [MCP 통합](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [Honcho Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/honcho/)
- [Python 라이브러리 사용법](https://hermes-agent.nousresearch.com/docs/guides/python-library/)

### 커뮤니티 & 비교

- [GitHub - hermes-agent-self-evolution](https://github.com/NousResearch/hermes-agent-self-evolution)
- [awesome-hermes-agent](https://github.com/0xNyk/awesome-hermes-agent)
- [Hermes Agent: A Self-Improving AI Agent (DEV Community)](https://dev.to/arshtechpro/hermes-agent-a-self-improving-ai-agent-that-runs-anywhere-2b7d)
- [Persistent AI Agents Compared (The New Stack)](https://thenewstack.io/persistent-ai-agents-compared/)
- [Claude vs Hermes vs OpenClaw (Medium)](https://medium.com/@Daniel.O.Ayo/claude-vs-hermes-vs-openclaw-which-ai-agent-is-actually-worth-paying-for-in-2026-81ad77de8225)
