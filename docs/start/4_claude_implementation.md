# Claude Code 설정 파일 완벽 가이드 - 구현 문서

## 1. 산출물

| 산출물 | 위치 | 설명 |
|--------|------|------|
| 블로그 글 (Draft) | `docs/start/claude-code-설정-파일-완벽-가이드/index.md` | 한국어, 1편 통합 |
| 샘플 설정 구성 | `tutorials-go/` 프로젝트 내 `.claude/` 디렉토리 | 실전 예시용 |
| 스크린샷 | `docs/start/claude-code-설정-파일-완벽-가이드/` 하위 | 필요시 포함 |

## 2. 블로그 글 목차 구성

```
1. Claude Code 설정 파일이란?
   - 왜 설정 파일이 필요한가
   - 설정 파일 전체 구조 한눈에 보기 (Mermaid 다이어그램)

2. CLAUDE.md — 프로젝트 지침 파일
   2.1 CLAUDE.md란?
   2.2 계층 구조 (User → Project → Subdirectory)
       - Enterprise/Managed는 조직용으로 간단히 언급만
   2.3 각 레벨에 넣을 내용
   2.4 Import 구문 (@path)
   2.5 Best Practices
   2.6 실전 예시 (tutorials-go 프로젝트)

3. settings.json — 시스템 설정 파일
   3.1 CLAUDE.md vs settings.json 차이
   3.2 스코프 3단계 (User / Project / Local)
   3.3 주요 설정 항목 (모델, 권한, 환경변수 등)
   3.4 permissions 설정 상세
   3.5 .claudeignore 대안 (permissions.deny)
   3.6 실전 예시 (tutorials-go 프로젝트)

4. .claude/rules/ — 모듈식 지침 파일
   4.1 rules란? (CLAUDE.md를 여러 파일로 분리)
   4.2 무조건 로딩 vs 조건부 로딩 (paths 프론트매터)
   4.3 glob 패턴 레퍼런스
   4.4 모노레포 활용 예시
   4.5 실전 예시 (tutorials-go 프로젝트)

5. Auto Memory 시스템 — MEMORY.md
   5.1 Auto Memory란?
   5.2 저장 위치와 디렉토리 구조
   5.3 MEMORY.md 인덱스 (200줄 제한)
   5.4 메모리 타입 4가지 (user, feedback, project, reference)
   5.5 메모리에 저장하지 않을 것
   5.6 메모리 관리 (/memory, 활성화/비활성화)
   5.7 Memory vs Plan vs Task vs CLAUDE.md 비교

6. 전체 아키텍처 요약
   6.1 설정 계층 다이어그램 (Mermaid)
   6.2 ~/.claude/ 디렉토리 구조
   6.3 .claude/ 프로젝트 디렉토리 구조

7. 마무리
   - 관련 글 링크 (확장 기능, Plugin & Hooks, MCP, 멀티 계정)
```

## 3. tutorials-go 샘플 설정 구성

tutorials-go 프로젝트에 블로그 예시용 설정 파일을 구성한다.

### 3.1 생성할 파일 목록

```
tutorials-go/
├── CLAUDE.md                          # (이미 존재) 프로젝트 레벨 지침
└── .claude/
    ├── settings.json                  # 프로젝트 공유 설정 (권한, 환경변수)
    └── rules/
        ├── code-style.md              # 무조건 로딩 — Go 코드 스타일
        ├── testing.md                 # 무조건 로딩 — 테스트 컨벤션
        └── api/
            └── echo-handler.md        # 조건부 로딩 — Echo API 핸들러 규칙
                                       # paths: ["**/handler*.go", "**/route*.go"]
```

### 3.2 각 파일 내용

#### .claude/settings.json
```json
{
  "permissions": {
    "allow": [
      "Bash(go test *)",
      "Bash(go build *)",
      "Bash(go mod *)",
      "Bash(make *)"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)"
    ]
  },
  "env": {
    "GO_ENV": "development"
  }
}
```

#### .claude/rules/code-style.md
```markdown
---
---

# Go 코드 스타일

- gofmt/goimports 적용 필수
- 에러는 즉시 처리 (if err != nil 패턴)
- 패키지 export 함수에 GoDoc 주석 작성
- 변수명은 짧고 관용적으로 (err, ctx, req, resp)
```

#### .claude/rules/testing.md
```markdown
---
---

# 테스트 컨벤션

- 테스트 함수명: TestXxx_설명 형식
- 테이블 드리븐 테스트 선호
- testify/assert 사용
- 외부 의존성은 mockery로 목 생성
```

#### .claude/rules/api/echo-handler.md
```markdown
---
paths:
  - "**/handler*.go"
  - "**/route*.go"
---

# Echo API 핸들러 규칙

- Echo v4 프레임워크 사용
- 핸들러 시그니처: func(c echo.Context) error
- 에러 응답: echo.NewHTTPError(status, message)
- 입력 바인딩: c.Bind(&req)로 구조체에 바인딩
- 미들웨어 체인에서 인증/로깅 처리
```

### 3.3 스크린샷 계획

| 스크린샷 | 내용 | 사용 위치 |
|----------|------|-----------|
| `/memory` 실행 화면 | 로딩된 CLAUDE.md, rules 파일 목록 표시 | 2.2, 4.2 |
| Auto Memory 저장 시 | "Writing memory" 표시되는 CLI 화면 | 5.1 |
| rules 조건부 로딩 | API 파일 작업 시 echo-handler.md 로딩 확인 | 4.2 |

## 4. 크로스 레퍼런스

블로그 글 마무리 섹션에서 링크할 기존 글:

| 주제 | 기존 글 제목 |
|------|-------------|
| Command, Skill, Subagent | Claude Code 확장 기능 완벽 가이드 |
| Plugin, Hooks | Claude Code Plugin & Hooks 완벽 가이드 |
| MCP 서버 | Claude Code MCP 추천 가이드 |
| 계정 전환 | Claude Code 멀티 계정 전환 가이드 |

## 5. 작성 규칙

- 한국어 작성, 기술 용어는 영어 병기 (예: "자동 메모리(Auto Memory)")
- 다이어그램은 Mermaid 형식 (ASCII art 금지, HTML 태그 금지)
- 코드 블록에 언어 태그 명시 (`markdown`, `json`, `bash`)
- UTF-8 인코딩 확인 필수 (`file -I`)
- Draft는 `docs/start/`에 작성, `contents/`에 직접 넣지 않음
