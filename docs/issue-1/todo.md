# 작업 체크리스트 (TODO)
## Next.js Static Export 블로그 전환

**진행 상태**: 0% (0/67)

---

## Phase 1: Next.js 프로젝트 초기화 (0/12)

### 1.1 Next.js 설치 및 기본 구조
- [ ] Next.js 14+ 패키지 설치
  ```bash
  npm install next@latest react@latest react-dom@latest
  ```
- [ ] TypeScript 관련 패키지 설치
  ```bash
  npm install -D @types/node @types/react @types/react-dom typescript
  ```
- [ ] 기본 디렉토리 생성
  ```bash
  mkdir -p app/{article/[slug],series}
  mkdir -p components/ui
  mkdir -p lib
  mkdir -p scripts
  ```

### 1.2 설정 파일 생성
- [ ] `next.config.js` 작성 (static export 설정)
- [ ] `tsconfig.json` 작성 (경로 alias 설정)
- [ ] `app/layout.tsx` 작성 (Root layout)
- [ ] `app/page.tsx` 작성 (임시 홈페이지)
- [ ] `app/not-found.tsx` 작성 (404 페이지)

### 1.3 Tailwind CSS + shadcn/ui 마이그레이션
- [ ] 기존 `tailwind.config.ts` 복사 및 경로 수정
- [ ] `app/globals.css` 생성 (Tailwind imports)
- [ ] 기존 `components/ui/` 폴더 복사
- [ ] `components/theme-provider.tsx` 작성 (다크모드)
- [ ] `components.json` 확인 및 수정

---

## Phase 2: 콘텐츠 시스템 구축 (0/15)

### 2.1 필요 패키지 설치
- [ ] Markdown 처리 패키지 설치
  ```bash
  npm install gray-matter unified remark remark-gfm remark-html
  ```
- [ ] Rehype 관련 패키지 설치
  ```bash
  npm install rehype-prism-plus rehype-slug rehype-autolink-headings rehype-stringify
  ```
- [ ] 유틸리티 패키지 설치
  ```bash
  npm install -D fs-extra
  ```

### 2.2 Article 로딩 시스템
- [ ] `lib/articles.ts` 작성
  - [ ] `getCategories()` 함수 구현
  - [ ] `getArticlesByCategory()` 함수 구현
  - [ ] `getAllArticles()` 함수 구현
  - [ ] `getArticleBySlug()` 함수 구현
  - [ ] ArticleFrontmatter 타입 정의

### 2.3 Markdown 처리
- [ ] `lib/markdown.ts` 작성
  - [ ] `markdownToHtml()` 함수 구현
  - [ ] `extractTOC()` 함수 구현
  - [ ] `calculateReadingTime()` 함수 구현

### 2.4 이미지 복사 스크립트
- [ ] `scripts/copy-images.js` 작성
- [ ] package.json에 `copy-images` 스크립트 추가
- [ ] package.json에 `prebuild` 훅 추가
- [ ] 스크립트 테스트 실행

---

## Phase 3: 페이지 생성 (0/12)

### 3.1 홈페이지 (Article List)
- [ ] `app/page.tsx` 구현
  - [ ] getAllArticles() 호출
  - [ ] 날짜순 정렬
  - [ ] ArticleCard 컴포넌트 사용
- [ ] `components/article-card.tsx` 작성
  - [ ] 제목, 날짜, excerpt 표시
  - [ ] 카테고리 배지 표시
  - [ ] 태그 표시

### 3.2 Article Detail 페이지
- [ ] `app/article/[...slug]/page.tsx` 구현
  - [ ] generateStaticParams() 함수 구현
  - [ ] getArticleBySlug() 호출
  - [ ] markdownToHtml() 호출
  - [ ] TOC 추출 및 표시
  - [ ] 읽기 시간 계산
- [ ] `components/table-of-contents.tsx` 작성 (TOC 컴포넌트)

### 3.3 Series 페이지
- [ ] `app/series/page.tsx` 구현
  - [ ] getAllArticles() 호출
  - [ ] Series로 그룹화
  - [ ] seriesOrder로 정렬
  - [ ] Series별 카드 표시

### 3.4 메타데이터 (SEO)
- [ ] `app/layout.tsx` - 기본 메타데이터 추가
- [ ] `app/article/[...slug]/page.tsx` - generateMetadata() 함수 추가

---

## Phase 4: 검색 및 기능 (0/10)

### 4.1 검색 인덱스 생성
- [ ] MiniSearch 패키지 설치
  ```bash
  npm install minisearch
  ```
- [ ] `scripts/generate-search-index.js` 작성
- [ ] package.json에 `generate-search` 스크립트 추가
- [ ] prebuild 훅에 검색 인덱스 생성 추가

### 4.2 검색 UI
- [ ] `components/search-modal.tsx` 작성
  - [ ] 검색 인덱스 로드
  - [ ] MiniSearch 초기화
  - [ ] 검색 쿼리 처리
  - [ ] 검색 결과 표시
- [ ] `components/search-button.tsx` 작성 (검색 버튼)
- [ ] layout.tsx에 검색 버튼 추가

### 4.3 다크모드
- [ ] `components/theme-toggle.tsx` 작성
- [ ] layout.tsx에 ThemeProvider 추가
- [ ] layout.tsx에 ThemeToggle 버튼 추가

### 4.4 기타 컴포넌트
- [ ] `components/category-filter.tsx` 작성 (카테고리 필터)

---

## Phase 5: SEO 및 피드 (0/7)

### 5.1 RSS 피드
- [ ] `app/rss.xml/route.ts` 작성
  - [ ] getAllArticles() 호출
  - [ ] 최신 20개 글 선택
  - [ ] RSS 2.0 XML 생성
- [ ] RSS 피드 테스트 (`/rss.xml` 접근)

### 5.2 Sitemap
- [ ] `app/sitemap.ts` 작성
  - [ ] getAllArticles() 호출
  - [ ] 각 article URL 추가
  - [ ] 홈페이지, series 페이지 추가
- [ ] Sitemap 테스트 (`/sitemap.xml` 접근)

### 5.3 robots.txt
- [ ] `app/robots.ts` 작성
- [ ] robots.txt 테스트 (`/robots.txt` 접근)

### 5.4 메타데이터 완성
- [ ] Open Graph 이미지 설정
- [ ] Twitter Card 설정

---

## Phase 6: 클린업 및 배포 (0/11)

### 6.1 파일 제거
- [ ] `server/` 폴더 삭제
- [ ] `vite.config.ts` 삭제
- [ ] `drizzle.config.ts` 삭제
- [ ] `shared/` 폴더 삭제
- [ ] `.replit` 파일 삭제
- [ ] `replit.md` 파일 삭제
- [ ] `client/public/articles/` 샘플 파일 삭제

### 6.2 package.json 정리
- [ ] Replit 관련 패키지 제거
  ```
  @replit/vite-plugin-cartographer
  @replit/vite-plugin-dev-banner
  @replit/vite-plugin-runtime-error-modal
  ```
- [ ] Vite 관련 패키지 제거
  ```
  @vitejs/plugin-react
  vite
  ```
- [ ] Drizzle ORM 관련 패키지 제거
  ```
  drizzle-kit
  drizzle-orm
  @neondatabase/serverless
  ```

### 6.3 Netlify 배포 설정
- [ ] `netlify.toml` 작성
- [ ] 환경 변수 설정 (Netlify Dashboard)

### 6.4 빌드 및 테스트
- [ ] 로컬 빌드 테스트 (`npm run build`)
- [ ] 빌드 결과 확인 (`out/` 폴더)
- [ ] 로컬 서버 테스트 (`npx serve out`)

---

## 최종 검증 체크리스트 (0/10)

### 기능 완성도
- [ ] 모든 contents/ 마크다운 파일이 정상 표시
- [ ] 이미지가 올바른 경로로 로드
- [ ] RSS 피드 유효성 검증 (https://validator.w3.org/feed/)
- [ ] Sitemap 유효성 검증
- [ ] 검색 기능 정상 작동
- [ ] 다크모드 정상 작동

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
- Phase 1: 0/12 (0%)
- Phase 2: 0/15 (0%)
- Phase 3: 0/12 (0%)
- Phase 4: 0/10 (0%)
- Phase 5: 0/7 (0%)
- Phase 6: 0/11 (0%)
- 검증: 0/10 (0%)

**전체 진행률**: 0/67 (0%)
