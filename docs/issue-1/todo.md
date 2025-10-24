# 작업 체크리스트 (TODO)
## Next.js Static Export 블로그 전환

**진행 상태**: 86% (66/77)

---

## Phase 1: Next.js 프로젝트 초기화 (12/12) ✅

### 1.1 Next.js 설치 및 기본 구조
- [x] Next.js 14+ 패키지 설치 (16.0.0)
  ```bash
  npm install next@latest react@latest react-dom@latest
  ```
- [x] TypeScript 관련 패키지 설치
  ```bash
  npm install -D @types/node @types/react @types/react-dom typescript
  ```
- [x] 기본 디렉토리 생성
  ```bash
  mkdir -p app/{article/[slug],series}
  mkdir -p components/ui
  mkdir -p lib
  mkdir -p scripts
  ```

### 1.2 설정 파일 생성
- [x] `next.config.js` 작성 (static export 설정)
- [x] `tsconfig.json` 작성 (경로 alias 설정)
- [x] `app/layout.tsx` 작성 (Root layout + ThemeProvider)
- [x] `app/page.tsx` 작성 (Article grid homepage)
- [x] `app/not-found.tsx` 작성 (404 페이지)

### 1.3 Tailwind CSS + shadcn/ui 마이그레이션
- [x] 기존 `tailwind.config.ts` 복사 및 경로 수정
- [x] `app/globals.css` 생성 (Tailwind imports + theme variables)
- [x] 기존 `components/ui/` 폴더 복사 (47개 컴포넌트)
- [x] `components/theme-provider.tsx` 작성 (다크모드)
- [x] `components.json` 확인 및 수정

---

## Phase 2: 콘텐츠 시스템 구축 (14/15) ✅

### 2.1 필요 패키지 설치
- [x] Markdown 처리 패키지 설치
  ```bash
  npm install gray-matter unified remark remark-gfm remark-html
  ```
- [x] Rehype 관련 패키지 설치
  ```bash
  npm install rehype-prism-plus rehype-slug rehype-autolink-headings rehype-stringify
  ```
- [x] 유틸리티 패키지 (필요시 추가)

### 2.2 Article 로딩 시스템
- [x] `lib/articles.ts` 작성 (141개 articles 지원)
  - [x] `getAllCategories()` 함수 구현
  - [x] `getArticlesByCategory()` 함수 구현
  - [x] `getAllArticles()` 함수 구현
  - [x] `getArticle()` 함수 구현
  - [x] ArticleFrontmatter 타입 정의
  - [x] `scripts/generate-content-manifest.ts` 작성 (manifest 기반 로딩)

### 2.3 Markdown 처리
- [x] `lib/markdown.ts` 작성 (remark/rehype 기반)
  - [x] `parseMarkdown()` 함수 구현
  - [x] `extractTOC()` 함수 구현
  - [x] `calculateReadingTime()` 함수 구현

### 2.4 이미지 복사 스크립트
- [x] `scripts/copy-images.ts` 작성 (549개 이미지 복사)
- [x] package.json에 `copy:images` 스크립트 추가
- [ ] package.json에 `prebuild` 훅 추가
- [x] 스크립트 테스트 실행

---

## Phase 3: 페이지 생성 (11/12) ✅

### 3.1 홈페이지 (Article List)
- [x] `app/page.tsx` 구현
  - [x] getAllArticles() 호출
  - [x] 날짜순 정렬 (manifest에서 자동)
  - [x] ArticleCard inline 구현
- [x] Card UI 구현
  - [x] 제목, 날짜, excerpt 표시
  - [x] 카테고리 배지 표시
  - [x] 태그 표시
  - [x] 이미지 썸네일 표시

### 3.2 Article Detail 페이지
- [x] `app/article/[...slug]/page.tsx` 구현
  - [x] generateStaticParams() 함수 구현 (141개 articles)
  - [x] getArticle() 호출
  - [x] parseMarkdown() 호출
  - [x] TOC 추출 및 표시 (inline)
  - [x] 읽기 시간 계산
  - [x] Related articles 표시

### 3.3 Series 페이지
- [x] `app/series/page.tsx` 구현 (5개 series)
  - [x] getAllSeries() 호출
  - [x] getArticlesBySeries() 호출
  - [x] Series로 그룹화
  - [x] seriesOrder로 정렬
  - [x] Series별 카드 표시

### 3.4 메타데이터 (SEO)
- [x] `app/layout.tsx` - 기본 메타데이터 추가
- [x] `app/article/[...slug]/page.tsx` - generateMetadata() 함수 추가
- [x] `lib/utils.ts` - formatDate 유틸리티 추가

---

## Phase 4: 검색 및 기능 (9/10) ✅

### 4.1 검색 인덱스 생성
- [x] MiniSearch 패키지 설치 (already installed)
- [x] `scripts/generate-search-index.ts` 작성 (591KB index)
- [x] package.json에 `generate:search` 스크립트 추가
- [ ] prebuild 훅에 검색 인덱스 생성 추가

### 4.2 검색 UI
- [x] `components/search-dialog.tsx` 작성
  - [x] 검색 인덱스 로드
  - [x] MiniSearch 초기화 (fuzzy search + boost)
  - [x] 검색 쿼리 처리
  - [x] 검색 결과 표시 (최대 10개)
- [x] `components/site-header.tsx` 작성 (검색 버튼 포함)
- [x] layout.tsx에 SiteHeader 추가
- [x] ⌘K/Ctrl+K 단축키 지원

### 4.3 다크모드
- [x] `components/theme-toggle.tsx` 작성
- [x] layout.tsx에 ThemeProvider 추가 (already done in Phase 1)
- [x] layout.tsx에 ThemeToggle 버튼 추가 (in SiteHeader)

### 4.4 기타 컴포넌트
- [ ] `components/category-filter.tsx` 작성 (카테고리 필터) - optional

---

## Phase 5: SEO 및 피드 (5/7) ✅

### 5.1 RSS 피드
- [x] `app/rss.xml/route.ts` 작성
  - [x] getAllArticles() 호출
  - [x] 최신 20개 글 선택
  - [x] RSS 2.0 XML 생성
- [ ] RSS 피드 테스트 (`/rss.xml` 접근) - 빌드 후 테스트

### 5.2 Sitemap
- [x] `app/sitemap.ts` 작성
  - [x] getAllArticles() 호출
  - [x] 각 article URL 추가 (141개)
  - [x] 홈페이지, series 페이지 추가
- [ ] Sitemap 테스트 (`/sitemap.xml` 접근) - 빌드 후 테스트

### 5.3 robots.txt
- [x] `app/robots.ts` 작성
- [x] robots.txt 설정 완료

### 5.4 메타데이터 완성
- [ ] Open Graph 이미지 설정 - optional
- [ ] Twitter Card 설정 - optional

---

## Phase 6: 클린업 및 배포 (10/11) ✅

### 6.1 파일 제거
- [x] `server/` 폴더 이동 (server.old)
- [x] `client/` 폴더 이동 (client.old)
- [x] `vite.config.ts` 삭제
- [x] `drizzle.config.ts` 삭제
- [x] `shared/` 폴더 삭제
- [x] `.replit` 파일 삭제
- [x] `replit.md` 파일 삭제

### 6.2 package.json 정리
- [x] Replit 관련 패키지 제거
  ```
  @replit/vite-plugin-cartographer
  @replit/vite-plugin-dev-banner
  @replit/vite-plugin-runtime-error-modal
  ```
- [x] Vite 관련 패키지 제거
  ```
  @vitejs/plugin-react
  vite
  ```
- [x] Drizzle ORM 관련 패키지 제거
  ```
  drizzle-kit
  drizzle-orm
  @neondatabase/serverless
  ```
- [x] 의존성 설치 완료 (251개 패키지 제거)

### 6.3 Netlify 배포 설정
- [x] `netlify.toml` 작성
- [ ] 환경 변수 설정 (Netlify Dashboard)

### 6.4 빌드 및 테스트
- [x] 로컬 빌드 테스트 (`npm run build`) - 148개 페이지 생성 완료
- [x] 빌드 결과 확인 (`out/` 폴더)
- [x] 로컬 서버 테스트 (`npx serve out -l 3000`)

---

## 최종 검증 체크리스트 (4/10) 🔄

### 기능 완성도
- [x] 모든 contents/ 마크다운 파일이 정상 표시 (141개 articles)
- [x] 이미지가 올바른 경로로 로드 (549개 images)
- [ ] RSS 피드 유효성 검증 (https://validator.w3.org/feed/) - 배포 후 테스트
- [ ] Sitemap 유효성 검증 - 배포 후 테스트
- [x] 검색 기능 정상 작동 (검색 다이얼로그 열림 확인)
- [x] 다크모드 정상 작동 (테마 토글 확인)

### 성능
- [ ] Lighthouse 점수 확인 (Performance 90+)
- [ ] 페이지 로딩 속도 확인 (FCP < 1.5s, LCP < 2.5s)

### 배포
- [ ] Netlify 자동 배포 성공
- [ ] 모든 페이지 404 없이 접근 가능

---

## 진행 상황 업데이트 방법

체크리스트 항목을 완료하면 다음과 같이 표시:
- [x] 완료된 작업
- [ ] 미완료 작업

**진행률 계산**:
- Phase 1: 12/12 (100%) ✅
- Phase 2: 14/15 (93%) ✅
- Phase 3: 12/12 (100%) ✅
- Phase 4: 9/10 (90%) ✅
- Phase 5: 5/7 (71%) ✅
- Phase 6: 10/11 (91%) ✅
- 검증: 4/10 (40%) 🔄

**전체 진행률**: 66/77 (86%)
