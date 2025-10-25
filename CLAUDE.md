# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IT 블로그 플랫폼 - 마크다운 기반 정적 사이트 생성기
- React 18 + TypeScript + Express.js 풀스택 애플리케이션
- 마크다운 파일에서 기술 블로그 콘텐츠를 로드하여 표시
- shadcn/ui 컴포넌트 라이브러리 사용

## Development Commands

### Essential Commands
```bash
# Development server with hot-reload
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Run production build
npm start

# Database migration (Drizzle ORM)
npm run db:push
```

## Project Structure

### Architectural Overview

**Monorepo Layout:**
```
/client          # React frontend (Vite)
  /src
    /components  # UI components (shadcn/ui + custom)
    /pages       # Route pages (Home, Article, Series, NotFound)
    /lib         # Utilities (articles.ts, markdown.ts)
    /hooks       # React hooks
  /public
    /articles    # Markdown article files + manifest.json

/server          # Express backend
  index.ts       # Main server entry
  routes.ts      # API routes (minimal)
  storage.ts     # In-memory storage implementation
  vite.ts        # Vite dev middleware

/shared          # Shared types and schema
  schema.ts      # Drizzle ORM schema (users table)

/contents        # 빈 디렉토리 (현재 사용 안 함)
```

### Import Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Key Architectural Patterns

**Article Loading System:**
- `client/src/lib/articles.ts` - Promise-based caching prevents duplicate fetches
- `loadArticles()` - Loads from `/articles/manifest.json`, then fetches each .md file
- Cache persists until `clearArticlesCache()` called
- 검색 모달은 lazy loading으로 최적화

**Markdown Processing:**
- `client/src/lib/markdown.ts` - YAML frontmatter 파싱 + marked 라이브러리
- Prism.js로 코드 하이라이팅 (TypeScript, JavaScript, JSX, TSX, CSS, Bash, JSON)
- TOC 자동 생성 (heading 요소에서 추출)
- 읽기 시간 계산 (200 단어/분)

**Routing (Wouter):**
- `/` - Home page (article listing)
- `/series` - Series page (articles grouped by series)
- `/article/:slug` - Individual article view
- 404 - Not found page

**Styling:**
- Tailwind CSS with shadcn/ui components
- Light/Dark mode with localStorage persistence
- Typography: Inter (headings/body), JetBrains Mono (code)
- 반응형 디자인 (모바일 우선)

## Content Management

### Article Structure
**Location:** `client/public/articles/*.md`

**Required Format:**
```markdown
---
title: "Article Title"
date: "2024-01-15"
excerpt: "Brief description"
tags: ["typescript", "react"]
series: "Series Name"  # optional
seriesOrder: 1          # optional
---

Markdown content...
```

**manifest.json:** Must list all article filenames for discovery

### Adding New Articles
1. `client/public/articles/` 디렉토리에 `.md` 파일 생성
2. YAML frontmatter 작성 (위 형식 참조)
3. `manifest.json`에 파일명 추가
4. 브라우저에서 캐시 클리어 후 확인 (`clearArticlesCache()`)

## Design System

**Component Library:** shadcn/ui (Radix UI primitives)
- `client/src/components/ui/` - shadcn components
- `components.json` - shadcn configuration ("new-york" style)

**Design Guidelines:** `design_guidelines.md` 참조
- Medium/Dev.to 스타일 개발자 중심 디자인
- 콘텐츠 가독성 최우선
- 코드 블록 최적화 (복사 버튼, 언어 레이블, 라인 넘버)

## Git Workflow

**Branch Naming:**
- `feat/#이슈번호-설명` - 새 기능
- `fix/#이슈번호-설명` - 버그 수정
- `docs/#이슈번호-설명` - 문서

**Commit Messages (한국어):**
```
[#이슈번호] 간결한 설명

* 변경 사항 상세 설명 (bullet points)
* 기술적 세부사항이나 맥락 추가
```

**Commit Types (선택):** feat, fix, docs, style, refactor, test, chore

상세 가이드라인: `.github/git-commit-instructions.md` 참조

## Database

**ORM:** Drizzle ORM with PostgreSQL (Neon serverless)
**Schema:** `shared/schema.ts` - users table (id, username, password)
**Configuration:** `drizzle.config.ts`
**Environment:** `DATABASE_URL` 환경 변수 필요

**현재 상태:** 데이터베이스 구성되어 있으나 블로그는 정적 파일 시스템 사용

## Search

**Library:** MiniSearch (클라이언트 사이드 전문 검색)
- title, excerpt, tags, content 검색
- 퍼지 매칭 활성화
- 검색 모달 열릴 때 lazy loading
- 최대 10개 결과 제한

## Build System

**Development:**
- Vite dev server for client (HMR)
- tsx for server hot-reload
- Port 5000 (Express server)

**Production:**
- Vite builds client → `dist/public/`
- esbuild bundles server → `dist/index.js`
- Express serves static files from `dist/public/`

## Korean Content Encoding

**IMPORTANT:** All markdown files MUST be UTF-8 encoded

**Verify encoding:**
```bash
file -I client/public/articles/your-file.md
# Expected: text/plain; charset=utf-8
```

**If encoding broken, use heredoc:**
```bash
cat > file.md << 'EOF'
한글 내용...
EOF
```
