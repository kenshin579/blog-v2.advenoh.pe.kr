# Claude Code MD 파일 시스템 완벽 가이드 - 블로그 PRD

## 1. 개요

### 1.1 목적

Claude Code에서 사용하는 다양한 MD 파일과 설정 파일의 역할, 구성 방법, 계층 구조를 학습하고 블로그 시리즈로 정리한다.

### 1.2 블로그 구성

**1편으로 통합 작성한다.**


| 제목 (안)                                                                       | 핵심 내용                                                                     | 상태  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| **Claude Code 설정 파일 완벽 가이드 - CLAUDE.md, settings.json, rules, Memory** | CLAUDE.md 계층 구조, settings.json 스코프, rules 디렉토리, Auto Memory 시스템 | Draft |

### 1.3 기존 블로그와의 관계

아래 주제는 이미 작성된 글이 있으므로 이 시리즈에서 **제외**한다:


| 기존 글                                                         | 상태        | 다루는 주제                                     |
| --------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| **Claude Code 확장 기능 완벽 가이드: Command, Skill, Subagent** | 발행됨      | Command, Skill, Subagent 정의/실행/비교         |
| **Claude Code Plugin & Hooks 완벽 가이드**                      | Merge Ready | Plugin 시스템, Hooks 이벤트 자동화, Marketplace |
| **Claude Code MCP 추천 가이드**                                 | 발행됨      | MCP 프로토콜 개요, 서버 설정, 추천 조합         |
| **Claude Code 멀티 계정 전환 가이드**                           | 발행됨      | OAuth/API Key, 계정 전환                        |
| **Claude Code 최신 기능 9가지**                                 | Draft       | /btw, /voice, /batch 등 최신 명령               |

→ 이 시리즈는 **설정 파일 체계(CLAUDE.md, settings.json, rules)**와 **메모리 시스템(MEMORY.md)** 에 집중한다.

### 1.4 대상 독자

- Claude Code를 처음 사용하거나 기본 기능만 쓰고 있는 개발자
- 팀 프로젝트에 Claude Code 설정을 도입하려는 리드 개발자
- Claude Code의 설정 체계를 깊이 이해하고 최적화하고 싶은 사용자

### 1.5 관련 Repo

- **샘플 코드**: `tutorials-go/` 프로젝트에 실전 설정 예시 구성
- **블로그**: `blog-v2.advenoh.pe.kr`

---

## 2. 블로그 글 구성

### 2.1 블로그 메타 정보

```yaml
---
title: "Claude Code 설정 파일 완벽 가이드 - CLAUDE.md, settings.json, rules, Memory"
description: "Claude Code의 핵심 설정 파일인 CLAUDE.md, settings.json, rules 디렉토리, Auto Memory 시스템의 계층 구조와 구성 방법을 실전 예시와 함께 정리한다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - claude-code
  - ai-coding
  - developer-tools
  - configuration
  - auto-memory
  - CLAUDE.md
series: "Claude Code 완벽 가이드"
---
```

- **Draft 위치**: `docs/start/claude-code-설정-파일-완벽-가이드/index.md`
- **Publish 위치**: `contents/dev-tool/claude-code-설정-파일-완벽-가이드/`

### 2.2 다룰 내용 (목차)

#### 2.2.1 CLAUDE.md - 프로젝트 지침 파일

**핵심 개념:**

- Claude Code에게 프로젝트별 지시사항을 전달하는 마크다운 파일
- 세션 시작 시 자동 로드되어 Claude의 컨텍스트에 포함

**계층 구조 (4단계):**


| 스코프                  | 위치                                                      | 대상                  | Git 공유 | 로딩 시점        |
| ----------------------- | --------------------------------------------------------- | --------------------- | -------- | ---------------- |
| **Enterprise (관리)**   | macOS:`/Library/Application Support/ClaudeCode/CLAUDE.md` | 조직 전체             | IT 배포  | 항상 (제외 불가) |
| **User (개인)**         | `~/.claude/CLAUDE.md`                                     | 개인 전 프로젝트      | 비공유   | 세션 시작        |
| **Project (프로젝트)**  | `./CLAUDE.md` 또는 `./.claude/CLAUDE.md`                  | 팀 공유               | Git 커밋 | 세션 시작        |
| **Subdirectory (하위)** | `./subdirectory/CLAUDE.md`                                | 해당 디렉토리 작업 시 | 선택     | Lazy 로딩        |

**로딩 우선순위:**

- 디렉토리 트리를 아래에서 위로 탐색 (Specific → General)
- `foo/bar/`에서 실행하면 `foo/bar/CLAUDE.md`와 `foo/CLAUDE.md` 모두 로드
- 하위 디렉토리 CLAUDE.md는 해당 디렉토리의 파일을 읽을 때 lazy 로딩
- 충돌 시 더 구체적인(하위) 설정이 우선

**각 레벨에 넣을 내용:**


| 레벨         | 넣을 내용                                      | 예시                                      |
| ------------ | ---------------------------------------------- | ----------------------------------------- |
| Enterprise   | 보안 정책, 컴플라이언스, 필수 코딩 표준        | "모든 API 호출은 HTTPS 사용 필수"         |
| User         | 개인 코딩 스타일, 선호 도구, 개인 워크플로우   | "feature 브랜치 정책, 한국어 커밋 메시지" |
| Project      | 빌드/테스트 명령, 프로젝트 아키텍처, 팀 컨벤션 | "npm run dev, 디렉토리 구조 설명"         |
| Subdirectory | 디렉토리별 언어/프레임워크 규칙                | "Go 컨벤션", "React 컴포넌트 규칙"        |

**Import 구문 (`@path`):**

```markdown
# 프로젝트 개요
@README 참조

# 빌드 명령
@package.json의 scripts 섹션 참조

# 개인 설정
@~/.claude/my-preferences.md
```

- 상대 경로는 CLAUDE.md 파일 기준
- 최대 5단계 재귀 임포트 지원
- 첫 임포트 시 승인 대화상자 표시

**Best Practices:**

- 파일당 200줄 이하 권장 (컨텍스트 소비 최소화)
- 검증 가능한 구체적 지시 작성 (나쁜 예: "코드를 깔끔하게" / 좋은 예: "2스페이스 들여쓰기 사용")
- 마크다운 헤더와 불릿으로 구조화
- 여러 CLAUDE.md 간 충돌하는 지시 제거

**실전 예시 (현재 워크스페이스):**

```
workspace_blogv2/
├── CLAUDE.md                              # 워크스페이스 전체 가이드 (7개 프로젝트 개요)
├── blog-v2.advenoh.pe.kr/CLAUDE.md        # 블로그 프로젝트 상세 (빌드, 라우팅, 컨텐츠 규칙)
├── tutorials-go/CLAUDE.md                 # Go 프로젝트 (테스트, 아키텍처 패턴)
├── charts/CLAUDE.md                       # K8s 인프라 (Terraform, ArgoCD)
└── ...
```

#### 2.2.2 settings.json - 시스템 설정 파일

**핵심 개념:**

- Claude Code의 동작을 제어하는 JSON 설정 파일
- 권한, 모델, 훅, MCP 서버 등 시스템 레벨 설정

**스코프 (3단계 + 조직용 1단계):**


| 스코프      | 위치                          | Git 공유           | 우선순위 | 설명                                      |
| ----------- | ----------------------------- | ------------------ | -------- | ----------------------------------------- |
| **User**    | `~/.claude/settings.json`     | 비공유             | 3순위    | 개인 설정 (전 프로젝트)                   |
| **Project** | `.claude/settings.json`       | Git 커밋           | 2순위    | 팀 공유 설정                              |
| **Local**   | `.claude/settings.local.json` | 비공유 (gitignore) | 1순위    | 머신별 개인 오버라이드                    |
| ~~Managed~~ | IT 관리/MDM 배포              | IT 배포            | 최상위   | 조직(Enterprise)용, 개인 개발자 해당 없음 |

**우선순위:** ~~Managed~~ > CLI 인수 > Local > Project > User

- 개인 개발자는 **User / Project / Local** 3단계만 사용

**deny 규칙 특성:** 어느 레벨에서든 deny되면 다른 레벨에서 allow 불가

**주요 설정 항목:**

```jsonc
{
  // 코어 설정
  "model": "opus",                          // AI 모델 선택
  "defaultMode": "default",                 // 권한 모드
  "effortLevel": "high",                    // 추론 깊이
  "alwaysThinkingEnabled": true,            // 확장 사고 활성화

  // 권한 설정
  "permissions": {
    "allow": ["Bash(npm run *)", "Read(.)"],
    "deny": ["Bash(git push)"],
    "ask": []
  },

  // 환경 변수
  "env": {
    "NODE_ENV": "development"
  },

  // 추가 디렉토리 접근
  "additionalDirectories": ["/path/to/other"],

  // CLAUDE.md 제외
  "claudeMdExcludes": ["**/other-team/CLAUDE.md"],

  // 메모리 설정
  "autoMemoryEnabled": true,

  // 플러그인
  "enabledPlugins": { "gopls-lsp@claude-plugins-official": true },

  // 상태 줄
  "statusLine": { "type": "command", "command": "~/.claude/bin/statusline.sh" }
}
```

**CLAUDE.md vs settings.json 차이점:**


| 관점              | CLAUDE.md                       | settings.json            |
| ----------------- | ------------------------------- | ------------------------ |
| **목적**          | Claude에게 지시/가이드          | 시스템 동작 설정         |
| **형식**          | 마크다운 텍스트                 | JSON                     |
| **강제성**        | 소프트 (Claude가 따르려 시도)   | 하드 (시스템이 강제)     |
| **컨텍스트 비용** | 토큰 소비                       | 최소 비용                |
| **용도**          | 코딩 표준, 워크플로우, 아키텍처 | 권한, 모델, 훅, MCP 서버 |
| **예시**          | "2스페이스 들여쓰기 사용"       | `"model": "opus"`        |

#### 2.2.3 .claude/rules/ - 모듈식 지침 파일

**핵심 개념:**

- 대규모 프로젝트에서 CLAUDE.md를 여러 파일로 분리
- 파일 패턴 기반 조건부 로딩 지원

**디렉토리 구조:**

```
.claude/rules/
├── code-style.md        # 무조건 로딩
├── testing.md           # 무조건 로딩
├── api/
│   └── validation.md    # paths 프론트매터로 조건부 로딩
└── backend/
    └── database.md      # paths 프론트매터로 조건부 로딩
```

**조건부 로딩 (paths 프론트매터):**

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.tsx"
---

# API 개발 규칙
- 모든 엔드포인트는 입력 유효성 검사 필수
- 표준 에러 응답 형식 사용: `{ error, status }`
```

**패턴 매칭:**

- `**/*.ts` - 모든 하위 디렉토리의 TypeScript 파일
- `src/**/*` - src/ 하위 전체
- `*.md` - 프로젝트 루트의 마크다운 파일만

**심링크로 규칙 공유:**

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
```

**User-Level Rules:**

- `~/.claude/rules/`에 개인 규칙 배치
- 모든 프로젝트에 적용
- 프로젝트 rules보다 낮은 우선순위

#### 2.2.4 .claudeignore

**현재 상태:** 개발 중인 기능 (완전 구현되지 않음)

**현재 대안:**

1. `settings.json`의 `permissions.deny` 규칙 사용 (가장 확실)
2. `.gitignore`에 포함된 파일은 Claude Code가 코드베이스 분석 시 자동 제외

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

### 2.3 실전 구성 예시

**개인 + 모노레포 + 서브프로젝트 구성:**

```
~/.claude/
├── CLAUDE.md              # 개인 규칙 (Git 브랜치 정책, 한국어 커밋)
├── settings.json          # 모델, 권한, 플러그인
└── rules/
    └── preferences.md     # 개인 코딩 스타일

workspace/
├── CLAUDE.md              # 워크스페이스 전체 프로젝트 개요
├── project-a/
│   ├── CLAUDE.md          # 프로젝트 A 빌드/테스트/아키텍처
│   └── .claude/
│       ├── settings.json  # 프로젝트 A 공유 설정
│       └── rules/
│           ├── testing.md
│           └── api.md
└── project-b/
    └── CLAUDE.md          # 프로젝트 B 설정
```

---

## 3. 다룰 내용: Auto Memory 시스템

#### 3.1 Auto Memory 개요

**핵심 개념:**

- Claude가 세션 중 학습한 내용을 파일로 저장하는 자동 학습 시스템
- 세션 간 지속성 제공 (다음 대화에서 이전 학습 내용 활용)
- 사용자 직접 편집 가능한 플레인 마크다운 파일

**저장 위치:**

```
~/.claude/projects/<project>/memory/
├── MEMORY.md              # 인덱스 (세션 시작 시 로드)
├── user_role.md            # 개별 메모리 파일
├── feedback_testing.md
├── project_auth.md
└── reference_linear.md
```

- `<project>`는 Git 리포지토리 경로에서 파생
- 같은 리포의 모든 worktree가 하나의 메모리 디렉토리 공유
- 로컬 머신에만 저장 (동기화 안 됨)

#### 3.2 MEMORY.md 인덱스 구조

**역할:**

- 메모리 파일들의 인덱스 (목차 역할)
- **처음 200줄만** 세션 시작 시 자동 로드
- 상세 내용은 개별 메모리 파일에 저장

**MEMORY.md 예시:**

```markdown
## User
- [user_role.md](user_role.md) - 사용자 역할 및 선호도

## Feedback
- [feedback_testing.md](feedback_testing.md) - 테스트 관련 피드백

## Project
- [project_auth.md](project_auth.md) - 인증 시스템 리팩토링 컨텍스트

## Reference
- [reference_linear.md](reference_linear.md) - Linear 프로젝트 추적 정보
```

#### 3.3 메모리 타입 (4가지)

**개별 메모리 파일 형식 (YAML 프론트매터):**

```markdown
---
name: 메모리 이름
description: 한줄 설명 (향후 관련성 판단에 사용)
type: user | feedback | project | reference
---

메모리 내용
```


| 타입          | 목적                       | 저장 시점                       | 활용 시점           |
| ------------- | -------------------------- | ------------------------------- | ------------------- |
| **user**      | 사용자 역할, 목표, 선호도  | 사용자 정보 학습 시             | 맞춤형 응답 생성 시 |
| **feedback**  | 사용자 교정/가이드         | "이렇게 하지 말고..." 피드백 시 | 같은 실수 반복 방지 |
| **project**   | 진행 중인 작업, 목표, 마감 | 프로젝트 컨텍스트 학습 시       | 작업 맥락 이해      |
| **reference** | 외부 시스템 위치 정보      | 외부 리소스 위치 학습 시        | 외부 시스템 참조 시 |

**feedback 메모리 구조:**

```markdown
---
name: 테스트에서 DB 목 사용 금지
description: 통합 테스트는 실제 DB 사용 필수
type: feedback
---

통합 테스트에서 DB를 목(mock)하지 않는다.
**Why:** 지난 분기에 목 테스트는 통과했지만 프로덕션 마이그레이션이 실패한 사건 발생
**How to apply:** 통합 테스트 작성 시 항상 실제 데이터베이스 연결 사용
```

**project 메모리 구조:**

```markdown
---
name: 모바일 릴리스 머지 프리즈
description: 2026-03-05부터 non-critical 머지 금지
type: project
---

2026-03-05부터 모바일 릴리스 브랜치 컷을 위한 머지 프리즈.
**Why:** 모바일 팀 릴리스 일정
**How to apply:** 해당 날짜 이후 non-critical PR 작업 플래그
```

#### 3.4 메모리에 저장하지 않을 것

- 코드 패턴, 컨벤션, 아키텍처 → 코드 자체에서 파악 가능
- Git 히스토리 → `git log`/`git blame`으로 확인
- 디버깅 솔루션 → 코드와 커밋 메시지에 존재
- CLAUDE.md에 이미 문서화된 내용
- 현재 대화에서만 유용한 임시 정보

#### 3.5 메모리 관리

**활성화/비활성화:**

- `/memory` 명령으로 토글
- `settings.json`: `"autoMemoryEnabled": false`
- 환경 변수: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`

**감사/편집:**

- `/memory` 명령으로 로드된 파일 확인, 편집기에서 열기
- 모든 메모리 파일은 직접 편집/삭제 가능한 플레인 마크다운

**커스텀 저장 위치:**

```json
{ "autoMemoryDirectory": "~/my-custom-memory-dir" }
```

#### 3.6 메모리 vs 다른 지속성 메커니즘


| 메커니즘      | 범위         | 용도                      |
| ------------- | ------------ | ------------------------- |
| **Memory**    | 세션 간 지속 | 향후 대화에서 유용한 정보 |
| **Plan**      | 현재 세션    | 구현 전략 정렬            |
| **Task**      | 현재 세션    | 작업 분해 및 진행 추적    |
| **CLAUDE.md** | 영구 (Git)   | 프로젝트 규칙 및 컨벤션   |

---

## 4. 전체 아키텍처 요약

### 4.1 설정 계층 다이어그램

```
ENTERPRISE/MANAGED (재정의 불가)
    ↓
USER LAYER (개인 설정, 전 프로젝트)
├── ~/.claude/CLAUDE.md
├── ~/.claude/settings.json
├── ~/.claude/rules/
└── ~/.claude/.mcp.json
    ↓
PROJECT LAYER (팀 공유)
├── ./CLAUDE.md 또는 ./.claude/CLAUDE.md
├── ./.claude/rules/
├── ./.claude/settings.json
└── ./.claude/.mcp.json
    ↓
LOCAL LAYER (머신 전용, gitignore)
├── ./.claude/settings.local.json
└── ./.claude/.mcp.json.local
    ↓
AUTO MEMORY (자동 학습)
└── ~/.claude/projects/<project>/memory/MEMORY.md
```

### 4.2 ~/.claude/ 전체 디렉토리 구조

```
~/.claude/
├── CLAUDE.md                   # 개인 지침
├── settings.json               # 개인 설정
├── keybindings.json            # 키보드 단축키
├── rules/                      # 개인 rules (전 프로젝트)
├── .mcp.json                   # 개인 MCP 서버
├── bin/
│   └── statusline.sh           # 상태 줄 스크립트
└── projects/
    └── <project>/
        └── memory/
            ├── MEMORY.md       # 메모리 인덱스
            ├── user_role.md
            ├── feedback_*.md
            └── project_*.md
```

---

## 5. 논의사항

### 5.1 블로그 작성 관련 (결정됨)

- [X]  1편과 2편을 합쳐 **1편으로 작성**한다 (CLAUDE.md + settings.json + rules + Memory 를 한 글에)
- [X]  실전 예시는 **tutorials-go 프로젝트에 샘플 구성**을 만들어 사용한다
- [X]  필요시 **스크린샷 포함**한다
- [X]  **한국어**로 작성 (기술 용어는 영어 병기)

### 5.2 기술 검증 결과

#### .claudeignore — 미지원 (공식 기능 아님)

- GitHub Issue #579에서 **공식 미지원으로 결정** (2025년 6월 종료)
- `.claudeignore` 파일을 만들어도 Claude Code가 읽지 않음
- **공식 대안**: `settings.json`의 `permissions.deny` 규칙 사용

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

- 서드파티 훅(`claude-ignore` npm 패키지)으로 `.claudeignore` 스타일 기능 구현 가능
- → **블로그에서는 "공식 미지원, permissions.deny가 대안"으로 간단히 언급**

#### Enterprise/Managed 설정 — 조직 전용 기능

**개념:** IT 관리자가 조직 전체에 배포하는 최상위 설정. 사용자가 재정의 불가.

**누가 쓰나:**

- Claude for Teams / Enterprise 고객의 IT 관리자
- 개인 개발자에게는 **해당 없음**

**배포 방식 2가지:**

1. **Server-Managed**: Claude.ai Admin 콘솔에서 JSON 설정 → 인증 시 자동 전달
2. **Endpoint-Managed**: MDM(Jamf, Kandji 등)으로 디바이스에 직접 배포

**Managed 전용 설정 예시:**

- `disableBypassPermissionsMode` — bypass 모드 비활성화
- `allowManagedPermissionRulesOnly` — 사용자 권한 규칙 차단
- `allowManagedHooksOnly` — 관리자 승인 훅만 허용
- `allowManagedMcpServersOnly` — 승인된 MCP 서버만 허용

**저장 위치:**


| 플랫폼  | 캐시 위치                                                    |
| ------- | ------------------------------------------------------------ |
| macOS   | `~/Library/Application Support/Claude/managed-settings.json` |
| Linux   | `~/.config/Claude/managed-settings.json`                     |
| Windows | `%APPDATA%\Claude\managed-settings.json`                     |

→ **블로그에서는 "조직용 최상위 설정으로 존재하며, 개인 개발자는 User/Project 레벨만 사용"으로 간단히 언급**

#### rules 디렉토리의 paths 프론트매터 — 조건부 로딩 기능

**개념:** `.claude/rules/` 안의 규칙 파일에 `paths` YAML 프론트매터를 추가하면, 해당 파일 패턴과 매칭되는 파일을 Claude가 읽을 때만 규칙이 로딩된다.

**paths 없는 규칙 (항상 로딩):**

```markdown
---
---

# 코드 스타일 규칙
- 2스페이스 들여쓰기 사용
- 함수는 50줄 이하로 작성
```

**paths 있는 규칙 (조건부 로딩):**

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.go"
---

# API 개발 규칙
- 모든 엔드포인트는 입력 유효성 검사 필수
- 표준 에러 응답 형식 사용: `{ error, code }`
```

**동작 방식:**

- `paths` 없는 규칙 → 세션 시작 시 무조건 로딩 (CLAUDE.md와 동일)
- `paths` 있는 규칙 → Claude가 매칭 파일을 **읽을 때만** 로딩
- 예: `src/api/handler.go` 수정 작업 → API 규칙 로딩됨
- 예: `src/components/Button.tsx` 수정 작업 → API 규칙 로딩 안 됨

**지원하는 glob 패턴:**


| 패턴                 | 매칭 대상                            |
| -------------------- | ------------------------------------ |
| `**/*.ts`            | 모든 하위 디렉토리의 TypeScript 파일 |
| `src/**/*`           | src/ 하위 전체 파일                  |
| `*.md`               | 프로젝트 루트의 마크다운 파일만      |
| `src/**/*.{ts,tsx}`  | TypeScript + TSX (브레이스 확장)     |
| `tests/**/*.test.ts` | tests/ 하위의 테스트 파일            |

**모노레포에서의 활용 예시:**

```
.claude/rules/
├── code-style.md              # paths 없음 → 항상 로딩
├── frontend/
│   └── react.md               # paths: ["src/app/**/*.{ts,tsx}"]
├── backend/
│   └── api-design.md          # paths: ["src/api/**/*.go"]
└── testing/
    └── conventions.md         # paths: ["**/*.test.ts", "**/*.test.go"]
```

- 프론트엔드 작업 시 → `code-style.md` + `react.md`만 로딩
- 백엔드 작업 시 → `code-style.md` + `api-design.md`만 로딩
- 불필요한 규칙이 컨텍스트를 소비하지 않아 토큰 절약

**확인 방법:** `/memory` 명령으로 현재 로딩된 rules 파일 목록 확인 가능

→ **블로그에서 실전 예시와 함께 상세히 다룬다 (tutorials-go 프로젝트에 실제 구성)**

### 5.3 기존 글과의 크로스 레퍼런스

블로그 글에서 아래 기존 글을 적절히 참조/링크한다:

- **Command, Skill, Subagent** → 「Claude Code 확장 기능 완벽 가이드」 링크
- **Plugin, Hooks** → 「Claude Code Plugin & Hooks 완벽 가이드」 링크
- **MCP 서버** → 「Claude Code MCP 추천 가이드」 링크
- **계정 전환** → 「Claude Code 멀티 계정 전환 가이드」 링크
