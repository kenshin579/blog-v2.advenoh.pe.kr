# 프로젝트 요구사항 정의서 (PRD)
## Next.js Static Export로 블로그 전환

### 1. 프로젝트 개요

**목표**: 현재 Express + React/Vite 하이브리드 아키텍처를 Next.js Static Export로 전환하여 백엔드 없이 정적 페이지로 블로그 배포

**배경**:
- 현재 구조: Express.js 서버 + React (Vite) 클라이언트
- 문제점: 서버 유지보수 필요, 배포 복잡성, 서버 비용
- 해결책: 정적 사이트 생성 (SSG)으로 전환하여 서버리스 배포

---

### 2. 현재 상태 분석

#### 2.1 기술 스택
```
Backend:
- Express.js (server/index.ts)
- Port 5000에서 API + static serving
- Drizzle ORM + PostgreSQL (현재 미사용)

Frontend:
- React 18 + TypeScript
- Vite (번들러)
- Wouter (라우팅)
- shadcn/ui (컴포넌트)
- Tailwind CSS

Content:
- Markdown 파일: client/public/articles/ (샘플 8개)
- 실제 콘텐츠: contents/ (100+ 파일, 카테고리별 구성)
- Frontmatter: title, date, excerpt, tags, series, seriesOrder
- 이미지: 각 article 폴더 내 포함
```

#### 2.2 주요 기능
- 마크다운 기반 블로그 글 표시
- 카테고리/태그 필터링
- 시리즈 기능 (연속된 글 묶기)
- 다크모드
- 검색 (MiniSearch 클라이언트 사이드)
- 코드 하이라이팅 (Prism.js)
- 반응형 디자인

#### 2.3 콘텐츠 구조
```
contents/
├── algorithm/          # 알고리즘
├── cloud/              # 클라우드/DevOps
├── database/           # 데이터베이스 (JPA, MySQL 등)
├── devops/             # CI/CD, 테스팅
├── git/                # Git 관련
├── go/                 # Go 언어
├── java/               # Java
├── linux/              # Linux
├── mac/                # macOS
├── node/               # Node.js
├── python/             # Python
└── spring/             # Spring Framework

각 폴더:
└── article-title/
    ├── index.md        # 본문
    └── *.png/jpg       # 이미지
```

#### 2.4 Replit 관련 파일 (제거 대상)
```
- .replit                              # Replit 설정
- replit.md                            # Replit 문서
- package.json의 devDependencies:
  - @replit/vite-plugin-cartographer
  - @replit/vite-plugin-dev-banner
  - @replit/vite-plugin-runtime-error-modal
```

---

### 3. 요구사항

#### 3.1 기능 요구사항

**FR-1: 콘텐츠 소스 변경**
- `contents/` 폴더의 markdown 파일을 사용
- 현재 `client/public/articles/`의 샘플 파일은 제거
- 카테고리별 폴더 구조 유지

**FR-2: RSS 피드 생성**
- `/rss.xml` 또는 `/feed.xml` 경로에 RSS 2.0 피드 제공
- 최신 20개 글 포함
- 제목, 설명, 발행일, 링크, 카테고리 포함

**FR-3: Sitemap 생성**
- `/sitemap.xml` 경로에 XML sitemap 제공
- 모든 글 페이지 포함
- 홈페이지, 시리즈 페이지 포함
- `lastmod`, `changefreq`, `priority` 설정

**FR-4: 정적 사이트 생성**
- 모든 페이지를 빌드 타임에 HTML로 생성
- 클라이언트 사이드 하이드레이션 지원
- Fast Refresh (개발 모드)

#### 3.2 기술 요구사항

**TR-1: Next.js 마이그레이션**
- Next.js 14+ (App Router)
- Static Export 모드 (`output: 'export'`)
- TypeScript 지원

**TR-2: 라우팅**
```
현재 (Wouter)          →    Next.js
/                      →    app/page.tsx
/series                →    app/series/page.tsx
/article/:slug         →    app/article/[slug]/page.tsx
```

**TR-3: 마크다운 처리**
- gray-matter로 frontmatter 파싱 (현재 커스텀 파싱 대체)
- remark/rehype 생태계 사용
  - remark-gfm (GitHub Flavored Markdown)
  - rehype-prism-plus (코드 하이라이팅)
  - rehype-slug (heading ID 생성)
  - rehype-autolink-headings (자동 링크)

**TR-4: 이미지 최적화**
- Next.js Image 컴포넌트 사용
- 정적 export에서 동작하는 설정 (`unoptimized: true`)
- contents 폴더의 이미지를 public으로 복사

**TR-5: 메타데이터 (SEO)**
- Next.js Metadata API 사용
- Open Graph 태그
- Twitter Card
- Canonical URL

**TR-6: 스타일링**
- 기존 Tailwind CSS + shadcn/ui 유지
- 다크모드 (next-themes) 유지

#### 3.3 마이그레이션 요구사항

**MR-1: 제거할 항목**
- Express 서버 (server/ 폴더 전체)
- Vite 설정 (vite.config.ts)
- Wouter 라우팅
- Drizzle ORM 설정 (사용 안 함)
- Replit 관련 파일 (.replit, replit.md, @replit/* 패키지)
- client/ 폴더 구조 (Next.js 구조로 전환)

**MR-2: 유지할 항목**
- React 컴포넌트 (components/ui/)
- 스타일링 (Tailwind, shadcn/ui)
- 검색 기능 (MiniSearch)
- 유틸리티 함수 (일부 수정 필요)

**MR-3: 신규 추가**
- next.config.js (static export 설정)
- app/ 폴더 구조 (Next.js App Router)
- RSS/Sitemap 생성 스크립트
- 빌드 타임 콘텐츠 수집 로직

---

### 4. 아키텍처 변경사항

#### 4.1 Before (현재)
```
┌─────────────────────────────────────┐
│         Express Server              │
│  (server/index.ts, routes.ts)       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Vite Dev Server           │   │
│  │   (HMR, React bundling)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Static Files:                      │
│  /articles/*.md (manifest.json)     │
└─────────────────────────────────────┘
         ↓ HTTP (Port 5000)
┌─────────────────────────────────────┐
│         Browser                     │
│  - Client-side routing (Wouter)     │
│  - Runtime markdown fetch/parse     │
└─────────────────────────────────────┘
```

#### 4.2 After (Next.js Static Export)
```
┌─────────────────────────────────────┐
│      Build Time (npm run build)     │
│                                     │
│  1. contents/ 스캔                  │
│  2. Markdown → HTML 변환            │
│  3. Static HTML 생성                │
│  4. RSS/Sitemap 생성                │
│                                     │
│       ↓                             │
│  out/ (정적 파일)                   │
│  ├── index.html                     │
│  ├── article/[slug]/index.html      │
│  ├── rss.xml                        │
│  └── sitemap.xml                    │
└─────────────────────────────────────┘
         ↓ Deploy
┌─────────────────────────────────────┐
│      Netlify (CDN)                  │
│  - 정적 파일 서빙                   │
│  - No server required               │
└─────────────────────────────────────┘
```

#### 4.3 프로젝트 구조 (After)
```
blog-v2.advenoh.pe.kr/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (article list)
│   ├── article/
│   │   └── [slug]/
│   │       └── page.tsx          # Article detail
│   ├── series/
│   │   └── page.tsx              # Series page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── article-card.tsx
│   ├── search-modal.tsx
│   └── theme-toggle.tsx
│
├── lib/                          # Utilities
│   ├── articles.ts               # Article loading logic
│   ├── markdown.ts               # Markdown processing
│   └── utils.ts                  # Helpers
│
├── contents/                     # Source markdown files
│   ├── algorithm/
│   ├── cloud/
│   └── ...
│
├── public/                       # Static assets
│   ├── images/                   # Copied from contents/
│   └── favicon.ico
│
├── next.config.js                # Next.js config (static export)
├── tailwind.config.ts            # Tailwind config
└── package.json
```

---

### 5. 배포 설정 (Netlify)

**빌드 설정**:
- 빌드 명령어: `npm run build`
- 배포 디렉토리: `out`
- Node 버전: 18.x 이상

**환경 변수**:
- `NEXT_PUBLIC_SITE_URL`: 사이트 URL (예: https://advenoh.pe.kr)

---

### 6. 성공 지표

#### 6.1 기능 완성도
- 모든 contents/ 마크다운 파일이 정상 표시
- 이미지가 올바른 경로로 로드
- RSS 피드가 유효한 XML 생성
- Sitemap이 모든 페이지 포함
- 검색 기능 정상 작동
- 다크모드 정상 작동

#### 6.2 성능
- Lighthouse 점수: Performance 90+
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- 정적 파일 크기 < 500KB (페이지당)

#### 6.3 배포
- Netlify 자동 배포 성공
- 모든 페이지 404 없이 접근 가능
- RSS/Sitemap URL 접근 가능

---

### 7. 리스크 및 대응

#### 7.1 이미지 경로 이슈
- **리스크**: contents/ 폴더의 이미지가 상대 경로로 참조됨
- **대응**: 빌드 타임에 이미지를 public/으로 복사, 마크다운 내 경로 변환

#### 7.2 클라이언트 사이드 검색
- **리스크**: 100+ 글의 전체 내용을 클라이언트에서 인덱싱하면 느림
- **대응**: 빌드 타임에 검색 인덱스 미리 생성, JSON으로 제공

#### 7.3 한글 인코딩
- **리스크**: 마크다운 파일이 UTF-8이 아닐 경우 깨짐
- **대응**: 모든 파일을 UTF-8로 저장 확인, gray-matter 사용

---

### 8. 관련 문서

- **구현 계획**: [implementation.md](./implementation.md) - 상세 구현 가이드
- **작업 체크리스트**: [todo.md](./todo.md) - 단계별 작업 목록

### 9. 참고 자료

- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- Next.js Metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- RSS 2.0 Spec: https://www.rssboard.org/rss-specification
- Sitemap Protocol: https://www.sitemaps.org/protocol.html
- Netlify Deploy: https://docs.netlify.com/configure-builds/overview/
