# Claude Code에서 사용하면 좋은 MCP 서버 추천 - 블로그 PRD

## 1. 목표

Claude Code CLI에서 활용할 수 있는 MCP(Model Context Protocol) 서버를 카테고리별로 정리하고, 실제 설정 방법과 활용 사례를 포함한 실용적인 가이드 블로그를 작성한다.

## 2. 배경

- MCP는 Anthropic이 개발한 개방형 표준으로, AI 모델이 외부 도구/데이터/서비스에 표준화된 인터페이스로 연결할 수 있게 해준다 ("AI의 USB-C"로 비유됨)
- Claude Code에서 MCP 서버를 연결하면 GitHub PR 생성, 브라우저 자동화, DB 쿼리, 문서 검색 등을 자연어로 수행할 수 있다
- MCP 생태계가 빠르게 성장 중이며 (PulseMCP 기준 8,200+ 서버), 개발자에게 실질적으로 유용한 서버를 선별하는 가이드가 필요하다
- 설정 방법(CLI, JSON, 스코프 관리)을 함께 다루어 바로 적용할 수 있는 실용적 글을 목표로 한다

## 3. 블로그 구성

### 3.1 MCP란 무엇인가?

**다루는 내용:**
- MCP(Model Context Protocol) 개요
  - AI 모델과 외부 도구를 연결하는 개방형 표준
  - "AI의 USB-C" 비유 설명
- MCP의 핵심 구성요소
  - Tools: AI가 호출할 수 있는 함수
  - Resources: AI가 읽을 수 있는 데이터
  - Prompts: 미리 정의된 프롬프트 템플릿
- Claude Code에서 MCP가 왜 강력한가
  - CLI 환경에서 외부 서비스와 자연스럽게 통합
  - 반복 작업 자동화 (PR 생성, 이슈 관리, DB 쿼리 등)

### 3.2 Claude Code에서 MCP 서버 설정하기

**다루는 내용:**
- Transport 유형
  - HTTP (원격 서버 권장)
  - stdio (로컬 프로세스)
  - SSE (deprecated, HTTP 사용 권장)
- CLI로 설정하기
  ```bash
  # HTTP transport
  claude mcp add --transport http <name> <url>
  # stdio transport
  claude mcp add --transport stdio <name> -- <command> [args...]
  # 환경 변수 포함
  claude mcp add --transport stdio --env API_KEY=your_key <name> -- npx -y @package/name
  # JSON으로 설정
  claude mcp add-json <name> '<json_config>'
  # Claude Desktop에서 가져오기
  claude mcp add-from-claude-desktop
  ```
- 설정 파일 스코프

  | 스코프 | 위치 | 용도 |
  |--------|------|------|
  | **Local** (기본값) | `~/.claude.json` (프로젝트 경로 하위) | 개인 전용, 현재 프로젝트만 |
  | **Project** | `.mcp.json` (프로젝트 루트) | 팀과 공유 (버전 관리) |
  | **User** | `~/.claude.json` | 모든 프로젝트에서 사용 |
  | **Managed** (기업) | `/Library/Application Support/ClaudeCode/managed-mcp.json` | IT 중앙 관리 |

- `.mcp.json` 설정 예시
  ```json
  {
    "mcpServers": {
      "github": {
        "type": "http",
        "url": "https://api.githubcopilot.com/mcp/"
      },
      "context7": {
        "type": "http",
        "url": "https://mcp.context7.com/mcp"
      },
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
  ```
- 환경 변수 확장: `${VAR}`, `${VAR:-default}` 문법
- 서버 관리 명령어
  ```bash
  claude mcp list           # 설정된 서버 목록
  claude mcp get <name>     # 서버 상세 정보
  claude mcp remove <name>  # 서버 제거
  /mcp                      # Claude Code 내에서 상태 확인
  ```

### 3.3 개발 필수 MCP 서버 추천

#### A. 버전 관리 & 코드 협업

**GitHub MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [github/github-mcp-server](https://github.com/github/github-mcp-server) |
| 용도 | 레포지토리 관리, PR/이슈 생성, 코드 검색, CI/CD 확인 |
| 추천 이유 | 개발 워크플로우에서 가장 필수적; Claude가 직접 PR 생성, 코드 리뷰, 이슈 관리 가능 |
| Transport | HTTP |
| 설정 | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |

**GitHub Enterprise MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [github/github-mcp-server](https://github.com/github/github-mcp-server) (동일 서버, 설정만 다름) |
| 용도 | GitHub Enterprise Server(GHES) 환경에서 동일한 GitHub MCP 기능 사용 |
| 추천 이유 | 사내 GHES를 사용하는 기업 환경에서 필수; PAT(Personal Access Token) 기반 인증으로 사내 레포지토리에 접근 가능 |
| Transport | stdio |
| 설정 | `claude mcp add --transport stdio github-enterprise -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server` |
| 참고 | `GITHUB_HOST` 환경 변수로 Enterprise Server URL 지정 필요 |

#### B. 브라우저 자동화 & 테스트

**Playwright MCP Server (Microsoft 공식)**
| 항목 | 내용 |
|------|------|
| GitHub | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) |
| 용도 | 웹 자동화, 테스트, 스크래핑, 스크린샷, 폼 입력, 테스트 코드 생성 |
| 추천 이유 | 접근성 트리 기반으로 DOM보다 정확한 UI 분석; 스크린샷 기반보다 효율적 |
| Transport | stdio |
| 설정 | `claude mcp add playwright -- npx @playwright/mcp@latest` |

#### C. 문서 & 라이브러리 참조

**Context7 MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [upstash/context7](https://github.com/upstash/context7) |
| 용도 | 라이브러리/프레임워크의 최신 문서를 실시간으로 가져옴 |
| 추천 이유 | AI 학습 데이터의 outdated 문제 해결; 사용 중인 정확한 버전의 문서 참조 가능 |
| Transport | HTTP |
| 설정 | `claude mcp add --transport http context7 https://mcp.context7.com/mcp` |

#### D. 데이터베이스

**Supabase MCP Server**
| 항목 | 내용 |
|------|------|
| 용도 | 테이블 설계, 마이그레이션, SQL 쿼리, TypeScript 타입 생성 등 20+ 도구 |
| 추천 이유 | BaaS 통합으로 백엔드 전체를 자연어로 관리 가능 |

**MySQL MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [benborla/mcp-server-mysql](https://github.com/benborla/mcp-server-mysql) 또는 [designcomputer/mysql_mcp_server](https://github.com/designcomputer/mysql_mcp_server) |
| 용도 | MySQL 데이터베이스에 자연어로 쿼리, 스키마 탐색, 테이블 구조 분석 |
| 추천 이유 | MySQL을 사용하는 프로젝트에서 DB 작업을 Claude Code 내에서 바로 수행 가능; 읽기 전용 모드 지원으로 안전한 데이터 탐색 |
| Transport | stdio |
| 설정 | `claude mcp add --transport stdio mysql -- npx -y @benborla29/mcp-server-mysql` |
| 참고 | `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` 환경 변수 필요 |

#### E. 검색 & 리서치

**Brave Search MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [brave/brave-search-mcp-server](https://github.com/brave/brave-search-mcp-server) |
| 용도 | 프라이버시 중심 웹 검색 |

#### F. 지식 관리 & 문서화

**Notion MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) |
| 용도 | Notion 페이지/데이터베이스 읽기·쓰기, 검색, 코멘트 관리 |
| 추천 이유 | 프로젝트 문서, 회의록, 기술 스펙을 Claude Code에서 직접 조회·편집 가능; 개발 컨텍스트와 문서를 연결하여 생산성 향상 |
| Transport | stdio |
| 설정 | `claude mcp add --transport stdio notion -- npx -y @notionhq/notion-mcp-server` |
| 참고 | Notion Internal Integration Token 필요 (`OPENAPI_MCP_HEADERS` 환경 변수로 인증) |

#### G. 이미지 생성

**NanoBanana MCP Server**
| 항목 | 내용 |
|------|------|
| GitHub | [YCSE/nanobanana-mcp](https://github.com/YCSE/nanobanana-mcp) |
| 용도 | Google Gemini 모델을 활용한 AI 이미지 생성/편집 |
| 설정 | uvx 기반, `GEMINI_API_KEY` 환경 변수 필요 |

#### H. 고급 추론

**Sequential Thinking MCP Server**
| 항목 | 내용 |
|------|------|
| 용도 | 복잡한 작업을 논리적 단계로 분해; 아키텍처 설계, 다단계 계획 수립 |
| 설정 | `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking` |

### 3.4 추천 조합 (use case별)

**다루는 내용:**
- 개인 개발자 필수 3종 세트
  - GitHub + Context7 + Playwright
- 풀스택 개발자
  - GitHub + Context7 + Playwright + Supabase/PostgreSQL/MySQL
- 기업 환경 개발자
  - GitHub Enterprise + Context7 + Notion + Brave Search
- 블로그/콘텐츠 제작자
  - Context7 + NanoBanana + Brave Search

### 3.5 MCP 서버 찾는 곳 (레지스트리 & 마켓플레이스)

**다루는 내용:**

| 레지스트리 | URL | 설명 |
|-----------|-----|------|
| **Official MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | Anthropic 공식 레지스트리 |
| **Smithery** | [smithery.ai](https://smithery.ai) | 2,200+ 서버, 자동 설치 가이드 |
| **MCP.so** | [mcp.so](https://mcp.so) | 3,000+ 서버, 품질 등급 |
| **PulseMCP** | [pulsemcp.com/servers](https://www.pulsemcp.com/servers) | 8,230+ 서버, 매일 업데이트 |
| **awesome-mcp-servers** | [github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 큐레이션된 GitHub 목록 |

### 3.6 MCP 사용 시 주의사항 & 팁

**다루는 내용:**
- 보안 고려사항
  - API 키는 환경 변수로 관리 (`${VAR}` 문법)
  - `.mcp.json`에 시크릿 직접 포함 금지
  - Managed 스코프로 기업 보안 정책 적용
- 성능 관련
  - MCP 서버가 많으면 Tool Search 자동 활성화 (컨텍스트 윈도우의 10% 초과 시)
  - 필요한 서버만 선별하여 설정
- 트러블슈팅
  - `/mcp` 명령으로 서버 상태 확인
  - `claude mcp list`로 설정 확인
  - 로그 확인 방법

---

## 4. 작업 계획

### 4.1 사전 조사

- [ ] 각 MCP 서버 직접 설치 및 테스트
- [ ] 스크린샷 촬영 (설정 과정, 실제 사용 화면)
- [ ] GitHub Star 수, 최근 업데이트 날짜 등 최신 정보 확인

### 4.2 블로그 콘텐츠 작성

- [ ] 블로그 디렉토리 생성: `contents/posts/claude-code-mcp-추천-가이드/`
- [ ] `index.md` 작성
  - [ ] 3.1 MCP 개요 섹션
  - [ ] 3.2 설정 방법 섹션
  - [ ] 3.3 카테고리별 MCP 서버 추천 섹션
  - [ ] 3.4 추천 조합 섹션
  - [ ] 3.5 레지스트리 & 마켓플레이스 섹션
  - [ ] 3.6 주의사항 & 팁 섹션
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
| 3.1 MCP 개요 | 500자 |
| 3.2 설정 방법 | 800자 + 코드 |
| 3.3 카테고리별 추천 (8개 카테고리) | 3,000자 + 코드 |
| 3.4 추천 조합 | 400자 |
| 3.5 레지스트리 | 300자 |
| 3.6 주의사항 & 팁 | 400자 |
| **총합** | **약 5,400자 + 코드/표** |

---

## 6. 태그 & 카테고리

- **태그:** `claude-code`, `mcp`, `model-context-protocol`, `ai-tools`, `developer-tools`, `anthropic`
- **카테고리:** `AI/ML` 또는 `개발 도구`

## 7. 참고 자료

- [Claude Code MCP 공식 문서](https://code.claude.com/docs/en/mcp)
- [modelcontextprotocol/servers GitHub](https://github.com/modelcontextprotocol/servers)
- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [The Best MCP Servers for Developers in 2026 - Builder.io](https://www.builder.io/blog/best-mcp-servers-2026)
- [Best MCP Servers for Claude Code - MCPcat](https://mcpcat.io/guides/best-mcp-servers-for-claude-code/)
- [Top 10 Essential MCP Servers for Claude Code - Apidog](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/)
- [awesome-mcp-servers (punkpeye)](https://github.com/punkpeye/awesome-mcp-servers)
- [awesome-mcp-servers (wong2)](https://github.com/wong2/awesome-mcp-servers)
- [Smithery AI](https://smithery.ai)
- [MCP.so](https://mcp.so)
- [PulseMCP](https://www.pulsemcp.com/servers)
