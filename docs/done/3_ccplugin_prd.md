# Claude Code Plugin Sample - PRD

## 1. 목표

누구나 `Marketplace`로 추가하여 바로 설치·사용할 수 있는 **실용적인 Claude Code Plugin 모음**을 구축한다. 각 Plugin은 개발자가 실제로 필요로 하는 문제를 해결하며, 동시에 Plugin 개발의 best practice를 보여준다.

```bash
# 사용자가 이렇게 바로 설치할 수 있는 수준
/plugin marketplace add kenshin579/claude-code-plugin-sample
/plugin install safe-guard@cc-plugin-samples
```

## 2. 배경

- Claude Code Plugin 시스템이 출시되었지만, 실전에서 참고할 만한 오픈소스 Plugin이 부족하다
- 공식 Marketplace의 Plugin은 LSP 중심이며, Hooks·Skills·Agents를 활용한 워크플로우 Plugin 예시가 적다
- Plugin을 만들려는 개발자에게 구조, 패턴, best practice를 보여줄 레퍼런스가 필요하다
- `kenshin579/claude-code-plugin-sample` GitHub 레포가 이미 생성되어 있다

## 3. 설계 원칙

1. **즉시 사용 가능**: clone 후 `--plugin-dir`로 바로 테스트, Marketplace로 원격 설치 모두 지원
2. **실용성 우선**: 데모가 아닌, 실제 개발 워크플로우에서 쓸 수 있는 Plugin
3. **독립적**: 각 Plugin은 서로 의존성 없이 개별 설치·사용 가능
4. **최소 외부 의존성**: 시스템 기본 도구(bash, jq)만 사용, 추가 설치 불필요
5. **Best Practice 준수**: Plugin 구조, 네이밍, 환경변수, 에러 처리의 모범 사례

## 4. 레포 구조

```
claude-code-plugin-sample/
├── .claude-plugin/
│   └── marketplace.json               # Marketplace 매니페스트
├── README.md                          # 프로젝트 소개, 설치법, 각 Plugin 설명
├── CLAUDE.md                          # Claude Code 프로젝트 가이드
├── LICENSE
│
├── plugins/
│   ├── safe-guard/                    # 위험 명령 차단 & 파일 보호
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── hooks/
│   │   │   ├── hooks.json
│   │   │   ├── block-dangerous-commands.sh
│   │   │   └── protect-sensitive-files.sh
│   │   ├── commands/
│   │   │   └── safeguard-status.md
│   │   └── README.md
│   │
│   ├── code-quality/                  # 자동 린팅 & 코드 리뷰
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── hooks/
│   │   │   ├── hooks.json
│   │   │   └── auto-lint.sh
│   │   ├── skills/
│   │   │   └── code-review/
│   │   │       └── SKILL.md
│   │   ├── agents/
│   │   │   └── code-reviewer.md
│   │   ├── commands/
│   │   │   └── review.md
│   │   ├── .mcp.json                  # MCP 서버 설정 (context7)
│   │   └── README.md
│   │
│   ├── git-workflow/                  # Git 워크플로우 자동화
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/
│   │   │   ├── commit-msg/
│   │   │   │   └── SKILL.md
│   │   │   └── pr-create/
│   │   │       └── SKILL.md
│   │   ├── commands/
│   │   │   ├── commit.md
│   │   │   ├── pr.md
│   │   │   └── status.md
│   │   ├── .mcp.json                  # MCP 서버 설정 (github)
│   │   └── README.md
│   │
│   └── security-scanner/              # 보안 취약점 스캐너
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── agents/
│       │   └── security-auditor.md
│       ├── skills/
│       │   └── security-scan/
│       │       └── SKILL.md
│       ├── hooks/
│       │   ├── hooks.json
│       │   └── check-secrets.sh
│       ├── commands/
│       │   └── scan.md
│       └── README.md
│
└── docs/
    └── CONTRIBUTING.md                # Plugin 기여 가이드
```

## 5. Marketplace 매니페스트

```json
{
  "name": "cc-plugin-samples",
  "owner": {
    "name": "kenshin579",
    "url": "https://github.com/kenshin579"
  },
  "metadata": {
    "description": "실용적인 Claude Code Plugin 모음 - 보안, 코드 품질, Git 워크플로우, 보안 스캐너",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "safe-guard",
      "source": "./plugins/safe-guard",
      "description": "위험 명령 차단 및 민감 파일 보호 Plugin",
      "version": "1.0.0",
      "tags": ["security", "hooks", "protection"]
    },
    {
      "name": "code-quality",
      "source": "./plugins/code-quality",
      "description": "자동 린팅 및 코드 리뷰 Plugin",
      "version": "1.0.0",
      "tags": ["lint", "review", "quality", "mcp"]
    },
    {
      "name": "git-workflow",
      "source": "./plugins/git-workflow",
      "description": "Git 커밋, PR, 브랜치 워크플로우 자동화 Plugin",
      "version": "1.0.0",
      "tags": ["git", "workflow", "automation", "mcp"]
    },
    {
      "name": "security-scanner",
      "source": "./plugins/security-scanner",
      "description": "보안 취약점 스캔 및 시크릿 탐지 Plugin",
      "version": "1.0.0",
      "tags": ["security", "audit", "scanner"]
    }
  ]
}
```

사용자 설치 흐름:
```bash
# Marketplace 추가
/plugin marketplace add kenshin579/claude-code-plugin-sample

# 원하는 Plugin 개별 설치
/plugin install safe-guard@cc-plugin-samples
/plugin install code-quality@cc-plugin-samples

# 로컬 테스트 (개발 중)
claude --plugin-dir ./plugins/safe-guard
```

## 6. Plugin별 상세 요구사항

### 6.1 safe-guard — 위험 명령 차단 & 파일 보호

**해결하는 문제**: Claude가 실수로 위험한 명령을 실행하거나 민감한 파일을 수정하는 것을 방지

**활용하는 기능**: Hooks (PreToolUse, command 핸들러)

**plugin.json**:
```json
{
  "name": "safe-guard",
  "description": "위험 명령 차단 및 민감 파일 보호 - PreToolUse Hook으로 rm -rf, force push, DROP TABLE 등을 차단하고 .env, credentials 파일 수정을 방지",
  "version": "1.0.0",
  "author": { "name": "kenshin579", "url": "https://github.com/kenshin579" },
  "repository": "https://github.com/kenshin579/claude-code-plugin-sample",
  "license": "MIT"
}
```

**hooks/hooks.json**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/block-dangerous-commands.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/protect-sensitive-files.sh"
          }
        ]
      }
    ]
  }
}
```

**hooks/block-dangerous-commands.sh**:
- stdin JSON에서 `tool_input.command` 파싱
- 차단 패턴:
  - `rm -rf /` , `rm -rf ~` , `rm -rf .` (루트/홈/현재 디렉토리 삭제)
  - `git push --force main|master` (메인 브랜치 force push)
  - `git reset --hard` (커밋되지 않은 변경 삭제)
  - `DROP TABLE|DROP DATABASE` (DB 파괴)
  - `chmod 777` (과도한 권한 부여)
  - `> /dev/sda` (디스크 직접 쓰기)
- exit code 2 + stderr에 차단 사유 출력
- best practice: 패턴을 배열로 관리, 로깅 포함

**hooks/protect-sensitive-files.sh**:
- stdin JSON에서 `tool_input.file_path` 파싱
- 보호 대상 파턴:
  - `.env`, `.env.*` (환경변수)
  - `*credentials*`, `*secret*`, `*token*` (인증 파일)
  - `id_rsa`, `*.pem`, `*.key` (SSH/인증서 키)
  - `.git/config` (Git 설정)
- exit code 2 + stderr에 보호 사유 출력

**commands/safeguard-status.md**:
- 현재 차단 패턴 목록 표시
- 최근 차단 로그 요약 (`/tmp/safeguard-*.log`)

### 6.2 code-quality — 자동 린팅 & 코드 리뷰

**해결하는 문제**: 파일 수정 후 린팅을 잊어버리는 것을 방지하고, 코드 리뷰를 체계적으로 수행

**활용하는 기능**: Hooks (PostToolUse), Skills, Agents, Commands, MCP (context7)

**plugin.json**:
```json
{
  "name": "code-quality",
  "description": "파일 저장 후 자동 린팅, 코드 리뷰 Skill 및 리뷰 전문 Agent 제공",
  "version": "1.0.0",
  "author": { "name": "kenshin579", "url": "https://github.com/kenshin579" },
  "repository": "https://github.com/kenshin579/claude-code-plugin-sample",
  "license": "MIT"
}
```

**hooks/hooks.json**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/auto-lint.sh"
          }
        ]
      }
    ]
  }
}
```

**hooks/auto-lint.sh**:
- stdin JSON에서 `tool_input.file_path` 파싱
- 파일 확장자별 린터 자동 선택:
  - `.ts`, `.tsx`, `.js`, `.jsx` → `npx eslint --fix` (있으면) 또는 `npx prettier --write`
  - `.py` → `ruff check --fix` (있으면) 또는 `python -m py_compile` (문법 검사)
  - `.go` → `gofmt -w`
  - `.json` → `python -m json.tool` (문법 검증)
  - `.yaml`, `.yml` → `python -c "import yaml; yaml.safe_load(...)"`
- 린터가 설치되지 않은 경우 graceful 스킵 (에러 없이 exit 0)
- stdout으로 린트 결과 전달

**skills/code-review/SKILL.md**:
```yaml
---
name: code-review
description: 변경된 코드에 대해 품질, 보안, 성능 관점의 체계적 리뷰를 수행한다. 코드 수정 후 자동으로 호출될 수 있다.
allowed-tools: Read, Grep, Glob
---
```
- 리뷰 관점 체크리스트:
  - **보안**: 인젝션, XSS, 하드코딩된 시크릿, 부적절한 에러 노출
  - **성능**: N+1 쿼리, 불필요한 루프, 메모리 누수 패턴
  - **가독성**: 네이밍 컨벤션, 함수 길이, 매직 넘버
  - **유지보수성**: 중복 코드, 결합도, 테스트 커버리지
- 리뷰 결과 형식:
  ```
  ## 리뷰 결과
  ### 🔴 Critical (즉시 수정 필요)
  ### 🟡 Warning (개선 권장)
  ### 🟢 Good (잘된 점)
  ```

**agents/code-reviewer.md**:
```yaml
---
name: code-reviewer
description: 코드의 품질, 보안 및 유지보수성을 적극적으로 검토하는 전문 에이전트. 코드 작성 또는 수정 후 사용한다.
tools: Read, Grep, Glob, Bash
model: sonnet
---
```
- 변경된 파일을 자동 탐지 (`git diff --name-only`)
- 파일별 심층 리뷰 수행
- 요약 보고서 생성

**commands/review.md**:
- `/code-quality:review` 로 호출
- `$ARGUMENTS` 로 특정 파일/디렉토리 지정 가능
- 기본값: `git diff --name-only`로 변경된 파일 리뷰

**.mcp.json** (코드 리뷰 시 라이브러리 문서 참조용):
```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```
- **context7**: 코드 리뷰 중 사용된 라이브러리의 최신 문서를 참조할 수 있도록 Context7 MCP 서버 포함
- 코드 리뷰 Agent가 API 사용법이 맞는지 공식 문서 기반으로 검증 가능

### 6.3 git-workflow — Git 워크플로우 자동화

**해결하는 문제**: 커밋 메시지 작성, PR 생성, 브랜치 상태 확인 등 반복적인 Git 작업 자동화

**활용하는 기능**: Skills ($ARGUMENTS, 동적 컨텍스트 주입), Commands, MCP (github)

**plugin.json**:
```json
{
  "name": "git-workflow",
  "description": "Git 커밋 메시지 생성, PR 생성, 브랜치 상태 확인 자동화 Plugin",
  "version": "1.0.0",
  "author": { "name": "kenshin579", "url": "https://github.com/kenshin579" },
  "repository": "https://github.com/kenshin579/claude-code-plugin-sample",
  "license": "MIT"
}
```

**skills/commit-msg/SKILL.md**:
```yaml
---
name: commit-msg
description: 현재 staged 변경사항을 분석하여 Conventional Commits 형식의 커밋 메시지를 생성한다.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[type: feat|fix|docs|refactor|test|chore]"
---
```
- `!`git diff --cached`` 로 staged 변경사항 주입
- `!`git log --oneline -5`` 로 최근 커밋 스타일 참조
- Conventional Commits 형식 생성 (`feat:`, `fix:`, `docs:` 등)
- `$ARGUMENTS[0]` 으로 커밋 타입 힌트 전달 가능
- 한국어 커밋 메시지 지원

**skills/pr-create/SKILL.md**:
```yaml
---
name: pr-create
description: 현재 브랜치의 변경사항을 분석하여 PR 제목과 본문을 생성하고 PR을 생성한다.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[base-branch]"
---
```
- `!`git log main..HEAD --oneline`` 로 커밋 히스토리 주입
- `!`git diff main...HEAD --stat`` 로 변경 파일 요약 주입
- PR 템플릿: Summary, Changes, Test Plan
- `gh pr create` 로 PR 생성 (HEREDOC 사용)

**commands/commit.md**:
- `/git-workflow:commit` 으로 호출
- staged 변경사항 분석 → 메시지 생성 → 커밋 실행
- `$ARGUMENTS` 로 커밋 타입 지정 가능

**commands/pr.md**:
- `/git-workflow:pr` 로 호출
- 현재 브랜치 vs base 브랜치 비교 → PR 생성
- `$ARGUMENTS` 로 base 브랜치 지정 가능 (기본: main)

**commands/status.md**:
- `/git-workflow:status` 로 호출
- 프로젝트 상태 종합 표시:
  - 현재 브랜치, 최근 커밋 5개
  - staged/unstaged/untracked 파일
  - 원격 브랜치와의 차이 (ahead/behind)

**.mcp.json** (GitHub API 연동):
```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```
- **github**: PR 생성, Issue 조회 등 GitHub API 연동
- `GITHUB_TOKEN` 환경변수로 인증 (사용자가 사전 설정 필요)
- PR Skill에서 GitHub MCP 도구를 활용하여 PR 생성, 라벨 설정, 리뷰어 지정 가능

### 6.4 security-scanner — 보안 취약점 스캐너

**해결하는 문제**: 코드에 하드코딩된 시크릿, 보안 취약점 패턴을 탐지

**활용하는 기능**: Agents, Skills, Hooks (PreToolUse), Commands

**plugin.json**:
```json
{
  "name": "security-scanner",
  "description": "코드베이스의 보안 취약점 스캔 - 시크릿 탐지, OWASP Top 10 검사, 의존성 보안 확인",
  "version": "1.0.0",
  "author": { "name": "kenshin579", "url": "https://github.com/kenshin579" },
  "repository": "https://github.com/kenshin579/claude-code-plugin-sample",
  "license": "MIT"
}
```

**agents/security-auditor.md**:
```yaml
---
name: security-auditor
description: 보안 취약점을 전문적으로 분석하는 에이전트. 코드를 읽고 OWASP Top 10, 시크릿 노출, 의존성 취약점을 검사한다.
tools: Read, Grep, Glob, Bash
model: sonnet
---
```
- 검사 항목:
  - **시크릿 탐지**: API 키, 토큰, 비밀번호 패턴 (정규식 기반)
  - **인젝션**: SQL 인젝션, Command 인젝션, XSS 패턴
  - **인증/인가**: 하드코딩된 자격증명, 약한 해시 알고리즘 (MD5, SHA1)
  - **의존성**: `package.json`, `go.mod`, `requirements.txt`에서 알려진 취약 버전
- 보고서 형식:
  ```
  ## 보안 스캔 결과
  ### 🔴 Critical
  ### 🟠 High
  ### 🟡 Medium
  ### 🔵 Low
  ### 📊 요약 통계
  ```

**skills/security-scan/SKILL.md**:
```yaml
---
name: security-scan
description: 프로젝트 전체 또는 특정 디렉토리의 보안 취약점을 스캔한다.
context: fork
agent: security-auditor
argument-hint: "[target-path]"
---
```
- `context: fork` + `agent: security-auditor` 로 서브에이전트에 위임
- `$ARGUMENTS` 로 스캔 대상 경로 지정 (기본: 프로젝트 전체)

**hooks/hooks.json**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/check-secrets.sh"
          }
        ]
      }
    ]
  }
}
```

**hooks/check-secrets.sh**:
- 파일에 작성될 내용(`tool_input.content` 또는 `tool_input.new_string`)에서 시크릿 패턴 검사
- 탐지 패턴:
  - `AKIA[0-9A-Z]{16}` (AWS Access Key)
  - `ghp_[a-zA-Z0-9]{36}` (GitHub Personal Token)
  - `sk-[a-zA-Z0-9]{48}` (OpenAI API Key)
  - `password\s*=\s*['"][^'"]+` (하드코딩된 비밀번호)
  - `-----BEGIN (RSA|EC|DSA) PRIVATE KEY-----` (Private Key)
- 탐지 시 exit code 2 + 경고 메시지

**commands/scan.md**:
- `/security-scanner:scan` 으로 호출
- 전체 프로젝트 보안 스캔 실행
- `$ARGUMENTS` 로 특정 경로 스캔 가능

## 7. Best Practice 체크리스트

각 Plugin이 준수해야 할 패턴:

### 7.1 Plugin 구조
- [ ] `.claude-plugin/plugin.json` 에 name, description, version 필수 포함
- [ ] `README.md` 에 설치법, 사용법, 설정 옵션 문서화
- [ ] 모든 경로에 `${CLAUDE_PLUGIN_ROOT}` 환경변수 사용 (절대경로 금지)

### 7.2 Hook 스크립트
- [ ] stdin JSON 파싱에 `jq` 사용, 필드 없을 때 `// empty` 로 안전 처리
- [ ] exit code 규약 준수: 0=허용, 2=차단
- [ ] stderr에 사용자 친화적 차단 메시지 출력
- [ ] 외부 도구 미설치 시 graceful 스킵 (에러 없이 exit 0)
- [ ] 스크립트 상단에 `#!/bin/bash` shebang + 주석으로 동작 설명
- [ ] `set -euo pipefail` 로 안전한 스크립트 실행

### 7.3 Skills
- [ ] `description` 필드에 Claude가 자동 호출 판단할 수 있는 충분한 설명
- [ ] `allowed-tools` 로 필요한 도구만 명시적 허용
- [ ] `argument-hint` 로 사용자에게 인자 힌트 제공
- [ ] 읽기 전용 작업은 `allowed-tools: Read, Grep, Glob` 으로 제한

### 7.4 Agents
- [ ] `description` 필드에 어떤 상황에서 사용되는지 명확히 기술
- [ ] `tools` 필드로 최소 권한 원칙 적용
- [ ] `model` 지정 (비용 최적화)
- [ ] 구조화된 출력 형식 정의 (심각도, 위치, 제안)

### 7.5 Commands
- [ ] `$ARGUMENTS` 플레이스홀더로 사용자 입력 지원
- [ ] 기본값 동작 정의 (인자 없이 호출해도 동작)

## 8. 비기능 요구사항

### 8.1 호환성
- macOS, Linux 모두 동작 (bash, jq 기반)
- 린터 등 외부 도구는 설치 여부를 확인 후 graceful 스킵
- Claude Code v1.0.33 이상 대상

### 8.2 보안
- Hook 스크립트에서 사용자 입력(JSON)을 변수에 안전하게 할당
- 경로 순회(`..`) 방어
- 임시 파일 사용 시 `/tmp/` + 고유 prefix 사용

### 8.3 문서화
- 루트 `README.md`: 프로젝트 소개, Marketplace 추가 방법, 각 Plugin 요약
- 각 Plugin `README.md`: 기능 설명, 설치, 사용법, 커스터마이징 방법
- Hook 스크립트: 주석으로 동작 원리 설명
- `docs/CONTRIBUTING.md`: 새 Plugin 기여 가이드

## 9. 작업 계획

### Phase 1: 프로젝트 초기 설정
- [ ] 레포 초기화 (`README.md`, `CLAUDE.md`, `LICENSE`, `.gitignore`)
- [ ] Marketplace 매니페스트 (`.claude-plugin/marketplace.json`) 생성
- [ ] 디렉토리 구조 생성

### Phase 2: Core Plugins 구현
- [ ] `safe-guard` Plugin 구현 (Hooks 중심 — 가장 기본적이고 필수적)
- [ ] `code-quality` Plugin 구현 (Hooks + Skills + Agents)
- [ ] `git-workflow` Plugin 구현 (Skills + Commands)
- [ ] `security-scanner` Plugin 구현 (Agents + Skills + Hooks)

### Phase 3: 문서화 및 검증
- [ ] 각 Plugin README.md 작성
- [ ] 루트 README.md 완성
- [ ] `docs/CONTRIBUTING.md` 작성
- [ ] 각 Plugin `--plugin-dir` 로컬 테스트
- [ ] Marketplace 설치 테스트
- [ ] 인코딩 확인 (UTF-8)

### Phase 4: 배포
- [ ] feature 브랜치 생성 및 PR 작성
- [ ] GitHub 레포 Push

## 10. 참고 자료

- [Claude Code Plugins 공식 문서](https://code.claude.com/docs/en/plugins)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Discover and Install Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Sub-agents](https://code.claude.com/docs/en/sub-agents)
- [PR #148: Claude Code Plugin & Hooks 완벽 가이드](https://github.com/kenshin579/blog-v2.advenoh.pe.kr/pull/148)
