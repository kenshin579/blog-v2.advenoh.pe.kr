# Claude Code Plugin 완벽 가이드 - 블로그 PRD

## 1. 목표

Claude Code의 플러그인 시스템을 중심으로, 확장성(Extensibility) 메커니즘 전체를 체계적으로 정리한 실용 가이드 블로그를 작성한다. Plugins, Skills, Hooks, Sub-agents, MCP 서버 등 Claude Code를 커스터마이징하는 모든 방법을 다루되, **Plugin 시스템**을 핵심 축으로 구성한다.

## 2. 배경

- Claude Code는 단순한 AI CLI 도구를 넘어, Plugins·Skills·Hooks·Sub-agents·MCP 등 풍부한 확장 메커니즘을 갖춘 **플랫폼**으로 진화하고 있다
- 2025년 12월 Anthropic이 공식 Plugin Marketplace를 런칭하여 36개 이상의 큐레이션된 플러그인을 제공하기 시작했다
- Plugin은 Skills(커스텀 슬래시 커맨드), Agents(서브에이전트), Hooks(이벤트 핸들러), MCP 서버, LSP 서버를 하나의 배포 단위로 묶을 수 있는 통합 확장 포맷이다
- 개별 확장 기능(.claude/commands, hooks 등)은 많이 소개되었지만, Plugin 시스템을 중심으로 전체 확장 생태계를 체계적으로 정리한 한국어 가이드는 부족하다
- 실제 Plugin을 만들고 배포하는 과정까지 다루어, 읽은 후 바로 자신만의 Plugin을 제작할 수 있는 실용적 글을 목표로 한다

## 3. 블로그 구성

### 3.1 Claude Code 확장성 개요

**다루는 내용:**
- Claude Code를 커스터마이징하는 5가지 방법 한눈에 보기
  | 확장 메커니즘 | 역할 | 단독 사용 | Plugin으로 묶기 |
  |---|---|---|---|
  | **Skills** | 커스텀 슬래시 커맨드 & AI 자동 호출 지식 | `.claude/skills/` | `skills/` |
  | **Hooks** | 이벤트 기반 자동화 (PreToolUse, PostToolUse 등) | `settings.json` | `hooks/hooks.json` |
  | **Sub-agents** | 전문화된 AI 에이전트 위임 | `.claude/agents/` | `agents/` |
  | **MCP 서버** | 외부 도구/서비스 통합 | `.mcp.json` | `.mcp.json` |
  | **LSP 서버** | 실시간 코드 인텔리전스 | - | `.lsp.json` |
- 단독 설정 vs Plugin의 차이점
  - 단독: 개인 워크플로우, 프로젝트 한정, 빠른 실험
  - Plugin: 팀 공유, 커뮤니티 배포, 버전 관리, 네임스페이스 분리
- Plugin이 왜 필요한가: "단독 설정 → Plugin 전환" 시나리오

### 3.2 Plugin 시스템 심화

**다루는 내용:**

#### 3.2.1 Plugin 구조

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # 매니페스트 (name, description, version, author)
├── commands/              # 슬래시 커맨드 (마크다운 파일)
├── skills/                # Agent Skills (SKILL.md)
│   └── code-review/
│       └── SKILL.md
├── agents/                # 커스텀 서브에이전트
├── hooks/
│   └── hooks.json         # 이벤트 핸들러
├── .mcp.json              # MCP 서버 설정
└── .lsp.json              # LSP 서버 설정
```

#### 3.2.2 plugin.json 매니페스트 스키마

```json
{
  "name": "my-plugin",
  "description": "Plugin 설명",
  "version": "1.0.0",
  "author": { "name": "작성자" },
  "homepage": "https://...",
  "repository": "https://github.com/...",
  "license": "MIT"
}
```

#### 3.2.3 Plugin 개발 워크플로우

- `--plugin-dir`로 로컬 테스트
  ```bash
  claude --plugin-dir ./my-plugin
  ```
- 네임스페이싱: `/plugin-name:skill-name` 형식
- 여러 Plugin 동시 로드
  ```bash
  claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
  ```
- 디버깅: 각 컴포넌트 개별 테스트, `/help`에서 커맨드 확인

#### 3.2.4 기존 설정을 Plugin으로 마이그레이션

- `.claude/commands/` → `commands/`
- `.claude/agents/` → `agents/`
- `.claude/skills/` → `skills/`
- `settings.json`의 hooks → `hooks/hooks.json`
- 마이그레이션 전/후 비교표

### 3.3 Skills (커스텀 슬래시 커맨드)

**다루는 내용:**

#### 3.3.1 Skills 기본

- SKILL.md 파일 구조
  ```yaml
  ---
  name: my-skill
  description: 스킬 설명
  ---
  스킬 지시사항...
  ```
- 스킬 저장 위치와 스코프

  | 위치 | 경로 | 적용 범위 |
  |---|---|---|
  | Enterprise | managed settings | 조직 전체 |
  | Personal | `~/.claude/skills/<name>/SKILL.md` | 모든 프로젝트 |
  | Project | `.claude/skills/<name>/SKILL.md` | 현재 프로젝트만 |
  | Plugin | `<plugin>/skills/<name>/SKILL.md` | Plugin 활성화 시 |

#### 3.3.2 Frontmatter 옵션

| 필드 | 설명 |
|---|---|
| `name` | 스킬 이름 (소문자, 숫자, 하이픈) |
| `description` | 스킬 설명 (Claude가 자동 호출 판단에 사용) |
| `disable-model-invocation` | `true`: 수동 호출만 가능 |
| `user-invocable` | `false`: Claude만 호출 가능 |
| `allowed-tools` | 허용 도구 제한 (예: `Read, Grep, Glob`) |
| `context` | `fork`: 서브에이전트에서 실행 |
| `agent` | fork 시 사용할 에이전트 타입 |
| `hooks` | 스킬 라이프사이클 한정 hooks |
| `model` | 스킬 활성 시 사용할 모델 |

#### 3.3.3 고급 패턴

- `$ARGUMENTS` 플레이스홀더: 사용자 입력 동적 주입
- `$ARGUMENTS[N]`, `$N`: 개별 인자 접근
- `${CLAUDE_SESSION_ID}`: 세션 ID 참조
- `!`command``: 동적 컨텍스트 주입 (셸 명령 전처리)
- 지원 파일(supporting files) 구성: reference.md, examples/, scripts/
- 호출 제어: 누가 스킬을 호출할 수 있는가 (user vs model)
- `context: fork`로 서브에이전트에서 실행

### 3.4 Hooks (이벤트 기반 자동화)

**다루는 내용:**

#### 3.4.1 Hook 라이프사이클

| 이벤트 | 발생 시점 | 차단 가능 |
|---|---|---|
| `SessionStart` | 세션 시작/재개 시 | No |
| `UserPromptSubmit` | 프롬프트 제출 시 | Yes |
| `PreToolUse` | 도구 호출 전 | Yes |
| `PermissionRequest` | 권한 다이얼로그 표시 시 | Yes |
| `PostToolUse` | 도구 호출 성공 후 | No |
| `PostToolUseFailure` | 도구 호출 실패 후 | No |
| `Notification` | 알림 전송 시 | No |
| `SubagentStart` | 서브에이전트 생성 시 | No |
| `SubagentStop` | 서브에이전트 종료 시 | Yes |
| `Stop` | Claude 응답 완료 시 | Yes |
| `TeammateIdle` | 팀원 에이전트 대기 시 | Yes |
| `TaskCompleted` | 태스크 완료 표시 시 | Yes |
| `PreCompact` | 컨텍스트 압축 전 | No |
| `SessionEnd` | 세션 종료 시 | No |

#### 3.4.2 Hook 설정 형식

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

#### 3.4.3 Hook 핸들러 유형 (3가지)

| 유형 | 설명 | 사용 사례 |
|---|---|---|
| `command` | 셸 명령 실행 | 린트, 포맷팅, 파일 검증 |
| `prompt` | LLM에 단일 턴 평가 요청 | 작업 완료 여부 판단 |
| `agent` | 서브에이전트 생성하여 다중 턴 검증 | 파일 검사, 테스트 실행 후 판단 |

#### 3.4.4 실전 예시

- 위험 명령 차단 (PreToolUse + Bash matcher)
- 파일 저장 후 자동 린팅 (PostToolUse + Write|Edit matcher)
- MCP 도구 모니터링 (`mcp__memory__.*` matcher)
- 비동기 테스트 실행 (`async: true`)
- 프롬프트 기반 Stop hook (작업 완료 여부 LLM 판단)

#### 3.4.5 Hook 설정 위치

| 위치 | 스코프 | 공유 가능 |
|---|---|---|
| `~/.claude/settings.json` | 모든 프로젝트 | No |
| `.claude/settings.json` | 현재 프로젝트 | Yes (커밋 가능) |
| `.claude/settings.local.json` | 현재 프로젝트 | No (gitignore) |
| Plugin `hooks/hooks.json` | Plugin 활성화 시 | Yes |
| Skill/Agent frontmatter | 컴포넌트 활성 시 | Yes |

### 3.5 Sub-agents (전문화된 에이전트)

**다루는 내용:**

#### 3.5.1 기본 개념

- `.claude/agents/` 디렉토리에 마크다운 파일로 정의
- YAML frontmatter + 시스템 프롬프트 지시사항
- 내장 에이전트: `Bash`, `Explore`, `Plan`, `general-purpose`

#### 3.5.2 커스텀 에이전트 예시

```yaml
---
name: code-reviewer
description: 코드 리뷰 전문가
allowed-tools: Read, Grep, Glob, Bash
model: sonnet
---

코드의 품질, 보안 및 유지보수성을 적극적으로 검토합니다.
```

#### 3.5.3 에이전트 활용

- Skill에서 `context: fork` + `agent` 필드로 위임
- `--agent <name>`으로 세션 시작 시 에이전트 지정
- Task tool을 통한 병렬 작업 위임

### 3.6 Plugin Marketplace & 배포

**다루는 내용:**

#### 3.6.1 Marketplace 개요

- Anthropic 공식 마켓플레이스: `anthropics/claude-plugins-official`
  - Claude Code 시작 시 자동 사용 가능
  - 36개 이상의 큐레이션된 Plugin 제공
- 커뮤니티 마켓플레이스: GitHub 레포, URL, 로컬 경로

#### 3.6.2 Plugin 설치

```bash
# VS Code에서: /plugins 명령
# CLI에서 Plugin 관리
claude plugin install <plugin-name>
```

- 설치 스코프 선택:
  - **Install for you**: 모든 프로젝트 (user 스코프)
  - **Install for this project**: 프로젝트 팀 공유 (project 스코프)
  - **Install locally**: 현재 레포, 현재 사용자만 (local 스코프)

#### 3.6.3 Marketplace 만들기 & 배포

- GitHub 레포를 Marketplace로 사용하는 방법
- Plugin 디렉토리 구조 + `plugin.json` 작성
- 버전 관리 (Semantic Versioning)
- README.md 작성 가이드

### 3.7 CLAUDE.md & Settings (보조 확장 메커니즘)

**다루는 내용:**

#### 3.7.1 CLAUDE.md (AI 메모리)

- 역할: Claude에게 프로젝트 컨텍스트, 코딩 규칙, 지침 제공
- 스코프:

  | 위치 | 적용 범위 |
  |---|---|
  | `CLAUDE.md` (프로젝트 루트) | 현재 프로젝트 |
  | `~/.claude/CLAUDE.md` | 모든 프로젝트 (개인) |
  | Enterprise managed | 조직 전체 |

- Skills와의 차이: CLAUDE.md는 정적 컨텍스트, Skills는 동적 기능

#### 3.7.2 Settings 파일

| 파일 | 스코프 | 용도 |
|---|---|---|
| `~/.claude/settings.json` | 사용자 전역 | 글로벌 설정, hooks, 권한 |
| `.claude/settings.json` | 프로젝트 | 프로젝트 설정, hooks |
| `.claude/settings.local.json` | 프로젝트 (로컬) | 개인 설정 (gitignore) |

- 주요 설정 항목: permissions, hooks, env, model 등
- Schema 자동완성: `"$schema": "https://json.schemastore.org/claude-code-settings.json"`

### 3.8 실전 Plugin 만들기 (튜토리얼)

**다루는 내용:**
- 처음부터 Plugin을 만드는 단계별 튜토리얼
- 예시: "blog-helper" Plugin
  1. 디렉토리 & `plugin.json` 생성
  2. Skill 추가: `/blog-helper:new-post` (새 블로그 포스트 스캐폴딩)
  3. Hook 추가: PostToolUse에서 마크다운 린팅
  4. Agent 추가: 콘텐츠 리뷰어
  5. `--plugin-dir`로 테스트
  6. GitHub에 Marketplace로 배포
- 완성된 Plugin 전체 코드 제공

### 3.9 Agent Teams (실험적 기능)

**다루는 내용:**
- Agent Teams 개요
  - 여러 Claude Code 인스턴스를 팀으로 조율
  - Team Lead + Teammates 아키텍처
- 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Delegate 모드 (Shift+Tab)
- 적합한 사용 사례
  - 리서치 & 리뷰 (병렬 조사)
  - 크로스 레이어 작업 (프론트엔드/백엔드/테스트)
  - 경쟁 가설 디버깅
- 관련 Hooks: `TeammateIdle`, `TaskCompleted`
- 제한사항: 세션당 1팀, 중첩 불가

### 3.10 IDE 통합

**다루는 내용:**
- VS Code Extension
  - 설치 & 기본 사용법
  - Plugin 관리: `/plugins` 명령으로 GUI 설치/관리
  - Marketplace 탭에서 Plugin 소스 추가/관리
  - 주요 단축키: `Cmd+Esc`, `Cmd+Shift+Esc`, `Option+K`
- JetBrains Plugin
  - IntelliJ, WebStorm, PyCharm 등 지원
  - 설치 & 설정
  - Diff 뷰어, 선택 컨텍스트, 진단 공유
  - `Cmd+Option+K`로 파일 참조 삽입

### 3.11 보안 & 기업 관리

**다루는 내용:**
- Plugin 보안 고려사항
  - Hooks는 사용자 시스템 권한으로 실행됨
  - 입력 검증, 경로 순회 방어
  - 민감 파일(.env, .git/, 키 파일) 스킵
- 기업용 관리
  - `managed-mcp.json`: IT 중앙 관리 MCP 서버
  - `allowedMcpServers` / `deniedMcpServers`: 정책 기반 제어
  - `allowManagedHooksOnly`: 사용자/프로젝트 hooks 차단
  - Managed settings로 조직 전체 Plugin/Skills 배포

---

## 4. 작업 계획

### 4.1 사전 조사

- [ ] Claude Code Plugin 공식 문서 정독 (Plugins, Skills, Hooks, Sub-agents)
- [ ] 공식 Marketplace(anthropics/claude-plugins-official) 탐색 및 주요 Plugin 분석
- [ ] 실제 Plugin 제작 테스트 (plugin.json, skills, hooks, agents)
- [ ] `--plugin-dir`로 로컬 테스트 진행
- [ ] VS Code Extension에서 Plugin 설치/관리 체험
- [ ] Agent Teams 실험적 기능 테스트 (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
- [ ] 스크린샷 촬영 (Plugin 구조, VS Code Plugin 관리, 실행 화면)

### 4.2 블로그 콘텐츠 작성

- [ ] 블로그 디렉토리 생성: `contents/posts/claude-code-plugin-완벽-가이드/`
- [ ] `index.md` 작성
  - [ ] 3.1 확장성 개요 섹션
  - [ ] 3.2 Plugin 시스템 심화 섹션
  - [ ] 3.3 Skills 섹션
  - [ ] 3.4 Hooks 섹션
  - [ ] 3.5 Sub-agents 섹션
  - [ ] 3.6 Marketplace & 배포 섹션
  - [ ] 3.7 CLAUDE.md & Settings 섹션
  - [ ] 3.8 실전 Plugin 만들기 튜토리얼 섹션
  - [ ] 3.9 Agent Teams 섹션
  - [ ] 3.10 IDE 통합 섹션
  - [ ] 3.11 보안 & 기업 관리 섹션
- [ ] frontmatter 작성 (title, date, excerpt, tags, category)
- [ ] 썸네일 이미지 생성 (NanoBanana MCP 활용)
- [ ] manifest.json에 파일 추가

### 4.3 리뷰 및 배포

- [ ] 콘텐츠 인코딩 확인 (UTF-8)
- [ ] 로컬 개발 서버에서 렌더링 확인
- [ ] feature 브랜치 생성 및 PR 작성

---

## 5. 예상 콘텐츠 분량

| 섹션 | 예상 분량 |
|------|----------|
| 3.1 확장성 개요 | 600자 |
| 3.2 Plugin 시스템 심화 | 1,200자 + 코드 |
| 3.3 Skills | 1,500자 + 코드 |
| 3.4 Hooks | 1,800자 + 코드/표 |
| 3.5 Sub-agents | 800자 + 코드 |
| 3.6 Marketplace & 배포 | 800자 |
| 3.7 CLAUDE.md & Settings | 600자 |
| 3.8 실전 Plugin 만들기 | 2,000자 + 코드 |
| 3.9 Agent Teams | 600자 |
| 3.10 IDE 통합 | 500자 |
| 3.11 보안 & 기업 관리 | 500자 |
| **총합** | **약 10,900자 + 코드/표** |

> **Note:** 분량이 많으므로 시리즈 분할도 고려
> - (1) Plugin 시스템 & Skills & Marketplace
> - (2) Hooks & Sub-agents & Agent Teams
> - (3) 실전 Plugin 만들기 튜토리얼

---

## 6. 태그 & 카테고리

- **태그:** `claude-code`, `plugin`, `skills`, `hooks`, `sub-agents`, `mcp`, `ai-tools`, `developer-tools`, `anthropic`
- **카테고리:** `AI/ML` 또는 `개발 도구`

## 7. 참고 자료

### 공식 문서
- [Claude Code Plugins - 생성 가이드](https://code.claude.com/docs/en/plugins)
- [Claude Code Plugins Reference - 기술 명세](https://code.claude.com/docs/en/plugins-reference)
- [Discover and Install Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Skills - 커스텀 슬래시 커맨드](https://code.claude.com/docs/en/skills)
- [Hooks Reference - 이벤트 핸들러](https://code.claude.com/docs/en/hooks)
- [Hooks Guide - 실전 가이드](https://code.claude.com/docs/en/hooks-guide)
- [Sub-agents](https://code.claude.com/docs/en/sub-agents)
- [MCP - Model Context Protocol](https://code.claude.com/docs/en/mcp)
- [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [CLAUDE.md - Memory](https://code.claude.com/docs/en/memory)
- [Settings](https://code.claude.com/docs/en/settings)
- [VS Code Extension](https://code.claude.com/docs/en/ide-integrations/vscode)
- [JetBrains Plugin](https://code.claude.com/docs/en/ide-integrations/jetbrains)

### 공식 GitHub
- [anthropics/claude-code - Plugins](https://github.com/anthropics/claude-code/tree/main/plugins)
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- [Agent Skills 오픈 표준](https://agentskills.io)

### 커뮤니티 & 블로그
- [Claude Code Official Plugin Marketplace Guide - Pete Gypps](https://www.petegypps.uk/blog/claude-code-official-plugin-marketplace-complete-guide-36-plugins-december-2025)
- [Improving your coding workflow with Claude Code Plugins - Composio](https://composio.dev/blog/claude-code-plugin)
- [Claude Code Agent Teams - Addy Osmani](https://addyosmani.com/blog/claude-code-agent-teams/)
- [Claude Code Marketplace](https://claudemarketplaces.com/)
- [From Tasks to Swarms: Agent Teams - alexop.dev](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/)
