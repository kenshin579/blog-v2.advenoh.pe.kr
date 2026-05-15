# Sub-project #9: 운영 통합 + 최종 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bento 리디자인의 마지막 단계 — sitemap 에 신규 라우트 추가, ChatButton 토큰 매핑, 미사용 컴포넌트 + d3 의존성 일괄 삭제. main 머지 전 최종 정리.

**Architecture:** 4개 task. (1) `app/sitemap.ts` 가 신규 라우트(`/posts`, `/category/[name]`, `/series/[slug]`, `/tags/[name]`) 를 포함하도록 확장. (2) `components/chat/ChatButton.tsx` 의 shadcn `Button` 기본 primary 톤을 명시적인 `bg-bento-accent` 클래스로 교체. (3) 사용처 없어진 5개 컴포넌트 파일 + `components/feature/` 디렉토리 + `d3`/`@types/d3` 의존성 일괄 삭제. (4) 최종 회귀 검증 (npm check / build / 시각).

**Tech Stack:** Next.js 16 sitemap API, shadcn `Button` (Tailwind utility 오버라이드), `lib/articles.ts` (`getAllArticles`, `getAllSeries`).

**브랜치:** `feature/redesign-bento` 위에서 누적. main 머지는 별도 단계 (사용자 결정 영역).

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§10 운영 통합 & 최종 정리)
- 검증된 미사용 파일 목록 (grep 사전 확인 완료):
  - `components/search-dialog.tsx` — 사용처 자기 자신 + home-content.tsx 만
  - `components/home-content.tsx` — 외부 사용처 없음
  - `components/tag-bubble-chart.tsx` — tags-page-client.tsx 만 사용
  - `components/tags-page-client.tsx` — 외부 사용처 없음
  - `components/feature/*` — 외부 사용처 없음 (5개 파일)
- `d3` 의존성 — `components/tag-bubble-chart.tsx` 만 사용

---

## Files Touched

### Task 1 — sitemap 신규 라우트
- Modify: `app/sitemap.ts`

### Task 2 — ChatButton 토큰 매핑
- Modify: `components/chat/ChatButton.tsx`

### Task 3 — 미사용 자원 삭제
- Delete: `components/search-dialog.tsx`
- Delete: `components/home-content.tsx`
- Delete: `components/tag-bubble-chart.tsx`
- Delete: `components/tags-page-client.tsx`
- Delete: `components/feature/category-filter.tsx`
- Delete: `components/feature/feature-section.tsx`
- Delete: `components/feature/index.ts`
- Delete: `components/feature/inline-search-bar.tsx`
- Delete: `components/feature/search-bar.tsx`
- Modify: `package.json` — `d3`, `@types/d3` 제거
- Modify: `package-lock.json` — npm uninstall 결과

### Task 4 — 검증
(변경 없음)

---

## Design Decisions

### 1. sitemap 포함 라우트
- `/posts` (static)
- `/series` (이미 포함) — 그대로
- `/category/[name]` 각각 18개
- `/series/[slug]` 각각 15개
- `/tags/[name]` 각각 877개 — 많지만 Google 인덱스에 도움. 전체 sitemap ~1100 entries 정상 범위
- `/tags` (인덱스) 추가
- `priority`: home 1.0 / 인덱스 0.8 / 상세 0.6 / article 0.7 / tag detail 0.5 (낮은 priority — 양 많음)
- `lastModified`: 정적 페이지는 `new Date()` (빌드 시점), article 은 발행일

### 2. ChatButton 토큰 매핑
shadcn `Button size="icon"` 기본은 `bg-primary text-primary-foreground` (shadcn primary 토큰). Bento 디자인에서는 `bg-bento-accent text-white` 가 적절. 명시적 className 으로 override.

### 3. 미사용 컴포넌트 사전 검증
- grep 으로 외부 사용처 0개 확인된 파일만 삭제
- 빌드 후 `npm run build` 가 성공해야 (모든 import 검증)
- 만약 빌드 실패하면 누락된 사용처 발견 → 해당 파일 복원

### 4. `_dev/tokens` 페이지
spec §10.5 의 "선택" 항목. 디자인 토큰 시각 참조 페이지로 가치 있어 **유지**. 프로덕션 SEO 영향 없음 (robots noindex). 

### 5. d3 의존성 제거
`tag-bubble-chart.tsx` 만 사용 → 삭제 후 자동으로 미사용. `npm uninstall d3 @types/d3` 로 정리.

### 6. minisearch / mermaid / 기타 deps
- `minisearch` — Command-K 에서 사용 중. 유지.
- `mermaid` — Article 페이지 다이어그램 렌더링. 유지.
- `framer-motion` — ChatButton 의 `AnimatePresence` 사용. 유지.
- shadcn Card / Badge / Separator — 다른 곳에서 사용 여부 확인 필요 (이번 plan 범위 밖, 별도 cleanup 가능).

### 7. shadcn 토큰 정리 (globals.css)
spec §10.5 마지막 항목 "shadcn/ui 미사용 토큰 정리" — 위험 큼 (기존 shadcn `Button`, `Sheet` 등이 여전히 사용). 이번 plan 범위에서 제외. 별도 cleanup 사이클 영역.

### 8. 기타 dead code
- spec §10.5 "dead imports / dead code 일괄 정리" — 신중 영역. 이번 plan 의 4개 task 범위로 한정.

---

## Tailwind Dynamic-Class Note

ChatButton 의 새 className 은 정적 문자열. safelist 불필요.

---

### Task 1: sitemap 신규 라우트 추가

**Files:**
- Modify: `app/sitemap.ts`

⚠️ 단 1개 파일 수정. 다른 파일 절대 touch 금지.

- [ ] **Step 1: `app/sitemap.ts` 전면 재작성**

기존 38줄 정도. 다음으로 덮어쓴다:

```ts
import { MetadataRoute } from 'next';
import { getAllArticles, getAllSeries, getArticleTitleFromSlug } from '@/lib/articles';
import { seriesSlug } from '@/lib/url';

export const dynamic = 'force-static';

const SITE_URL = 'https://blog.advenoh.pe.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();
  const seriesNames = await getAllSeries();

  const now = new Date();

  // Article URLs
  const articleUrls: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/${getArticleTitleFromSlug(article.slug)}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Category URLs (deduped, lowercase)
  const categorySet = new Set<string>();
  for (const a of articles) categorySet.add(a.category.toLowerCase());
  const categoryUrls: MetadataRoute.Sitemap = Array.from(categorySet).map((name) => ({
    url: `${SITE_URL}/category/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Series detail URLs
  const seriesUrls: MetadataRoute.Sitemap = seriesNames.map((name) => ({
    url: `${SITE_URL}/series/${encodeURIComponent(seriesSlug(name))}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Tag detail URLs (raw tag names from articles)
  const tagSet = new Set<string>();
  for (const a of articles) {
    if (!a.tags) continue;
    for (const t of a.tags) tagSet.add(t);
  }
  const tagUrls: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/posts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/series`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  return [...staticPages, ...articleUrls, ...categoryUrls, ...seriesUrls, ...tagUrls];
}
```

⚠️ 변경 노트:
- `SITE_URL` 상수 추출
- `getAllSeries` + `seriesSlug` import 추가
- Category / Series / Tag URLs 신규 추가
- `/posts`, `/tags` 정적 페이지 항목 추가
- changeFrequency / priority 차등 적용

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. `out/sitemap.xml` 에 새 URL 들이 포함됨.

```bash
grep -c "<url>" /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/sitemap.xml
```

기대: ~1100 (178 articles + 18 categories + 15 series + 877 tags + 4 static = ~1092).

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/sitemap.ts && git commit -m "$(cat <<'EOF'
feat(seo): sitemap 에 신규 라우트 추가 — /posts, /category, /series detail, /tags detail

* /posts, /tags 정적 페이지 추가
* category/[name] 각 18개 (lowercase) priority 0.6
* series/[slug] 각 15개 priority 0.6
* tags/[name] 각 877개 (raw 태그) priority 0.5
* 총 sitemap entries ~1100개 (이전 ~180 → 6배 확장)
* SITE_URL 상수 추출, lib/url.ts 의 seriesSlug 재사용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: ChatButton 색상 토큰 매핑

**Files:**
- Modify: `components/chat/ChatButton.tsx`

⚠️ 단 1개 파일 수정. 다른 파일 절대 touch 금지.

- [ ] **Step 1: ChatButton className 수정**

`components/chat/ChatButton.tsx` 에서 다음 라인을 찾아 변경한다:

기존:
```tsx
className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
```

→

```tsx
className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-bento-accent text-white shadow-lg hover:bg-bento-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg"
```

⚠️ 변경 노트:
- `z-50` → `z-40`: CommandK 모달이 `z-50` 이므로 ChatButton 이 모달 위에 떠 있는 충돌 방지
- `bg-bento-accent text-white` 명시: shadcn primary 톤 대신 Bento accent
- `hover:bg-bento-accent/90`: 호버 톤
- focus-visible ring: a11y 보강

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/chat/ChatButton.tsx && git commit -m "$(cat <<'EOF'
feat(chat): ChatButton 색상 토큰 Bento 매핑 + z-index 충돌 해소

* shadcn primary → bg-bento-accent text-white 명시
* hover 톤 + focus-visible ring (a11y)
* z-50 → z-40: CommandK 모달(z-50) 과 충돌 방지

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 미사용 자원 삭제 (`rm` 사용 — 신중)

**Files (DELETIONS, intentional):**
- Delete: `components/search-dialog.tsx`
- Delete: `components/home-content.tsx`
- Delete: `components/tag-bubble-chart.tsx`
- Delete: `components/tags-page-client.tsx`
- Delete: `components/feature/category-filter.tsx`
- Delete: `components/feature/feature-section.tsx`
- Delete: `components/feature/index.ts`
- Delete: `components/feature/inline-search-bar.tsx`
- Delete: `components/feature/search-bar.tsx`
- Delete: `components/feature/` (디렉토리, 비어 있게 됨)

**Files (MODIFICATIONS):**
- Modify: `package.json` — `d3`, `@types/d3` 제거 via `npm uninstall`
- Modify: `package-lock.json`

⚠️ **이 task 가 가장 risky.** 잘못 삭제하면 import 깨짐. 절차:
1. 각 파일 삭제 전 grep 으로 사용처 0 확인 (사전 plan 단계에서 완료)
2. 일괄 삭제 후 `npm run build` 로 import 검증
3. 빌드 실패 시 BLOCKED (해당 파일 git restore 로 복원)

- [ ] **Step 1: 사용처 0 재확인 (정직성 가드)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
echo "--- search-dialog references (excluding self) ---"
grep -rln "SearchDialog\|search-dialog" app/ components/ lib/ 2>&1 | grep -v "components/search-dialog.tsx" | head
echo "--- home-content references (excluding self) ---"
grep -rln "HomeContent\|home-content" app/ components/ lib/ 2>&1 | grep -v "components/home-content.tsx" | head
echo "--- tag-bubble-chart references (excluding self + tags-page-client) ---"
grep -rln "TagBubbleChart\|tag-bubble-chart" app/ components/ lib/ 2>&1 | grep -v "components/tag-bubble-chart.tsx" | grep -v "components/tags-page-client.tsx" | head
echo "--- tags-page-client references (excluding self) ---"
grep -rln "TagsPageClient\|tags-page-client" app/ components/ lib/ 2>&1 | grep -v "components/tags-page-client.tsx" | head
echo "--- feature dir references (excluding self) ---"
grep -rln "components/feature\|@/components/feature" app/ components/ lib/ 2>&1 | grep -v "components/feature/" | head
echo "--- d3 references (outside components) ---"
grep -rln "from 'd3'\|from \"d3\"\|require('d3')" app/ components/ lib/ scripts/ 2>&1 | grep -v "tag-bubble-chart.tsx" | head
```

기대:
- search-dialog: 0 결과 (또는 components/home-content.tsx 만)
- home-content: 0 결과
- tag-bubble-chart: 0 결과 (또는 tags-page-client.tsx 만 — 둘 다 삭제됨)
- tags-page-client: 0 결과
- feature: 0 결과
- d3: 0 결과

위 grep 결과 중 **삭제 대상이 아닌 다른 파일이 등장하면 STOP + BLOCKED.**

- [ ] **Step 2: 컴포넌트 삭제 + d3 의존성 제거**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git rm components/search-dialog.tsx
git rm components/home-content.tsx
git rm components/tag-bubble-chart.tsx
git rm components/tags-page-client.tsx
git rm -r components/feature/
npm uninstall d3 @types/d3
```

기대:
- 9개 파일 git rm
- npm uninstall 결과: `removed N packages`

- [ ] **Step 3: 타입 검사 + 빌드 — import 검증**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 만약 에러 나면 어떤 파일이 deleted 모듈 import 중 — BLOCKED + 누락 파일명 quote.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 1097 페이지 (동일 — 페이지 수 영향 없음).

```bash
ls components/feature 2>&1 | head -3
```

기대: `No such file or directory` (디렉토리 삭제됨).

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add -A && git commit -m "$(cat <<'EOF'
chore: 미사용 컴포넌트 + d3 의존성 일괄 삭제 (sub#9 cleanup)

* components/search-dialog.tsx — CommandK 로 교체됨 (sub#3)
* components/home-content.tsx — Bento 홈으로 교체됨 (sub#4)
* components/tag-bubble-chart.tsx — 가중치 클라우드로 교체됨 (sub#8)
* components/tags-page-client.tsx — 사용처 없어짐
* components/feature/* (5 files) — 사용처 없어짐
* d3, @types/d3 — tag-bubble-chart 만 사용했음 (삭제 후 미사용)
* 사전 grep 으로 외부 사용처 0 확인 후 일괄 삭제

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 최종 회귀 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 페이지 수 1097 (변동 없음).

- [ ] **Step 3: sitemap 확장 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -c "<url>" out/sitemap.xml
grep -E "/posts</loc>|/tags</loc>|/category/cloud|/series/golang-concurrency|/tags/kubernetes" out/sitemap.xml | head -10
```

기대: ~1100 entries + 신규 라우트 sample 매치 확인.

- [ ] **Step 4: 빌드 산출물 정합성 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
test -f out/index.html && echo "home OK"
test -f out/posts/index.html && echo "/posts OK"
test -f out/series/index.html && echo "/series OK"
test -f out/tags/index.html && echo "/tags OK"
test -f out/category/cloud/index.html && echo "/category/cloud OK"
test -f out/series/golang-concurrency/index.html && echo "/series/golang-concurrency OK"
test -f out/dev/tokens/index.html && echo "/dev/tokens OK"
ls "out/tags/Claude Code/" >/dev/null 2>&1 && echo "/tags/Claude Code OK" || echo "/tags/Claude Code MISSING"
```

기대: 8개 모두 OK.

- [ ] **Step 5: 컨트롤러 시각 확인 (subagent SKIP)**

`npm start` 후 확인:

전체 사이트 일관성:
- 홈 (`/`) — Bento 그리드 (Featured/Series spotlight/Latest/Categories/Recent)
- 헤더 nav (Home/Posts/Series/Tags) 모든 페이지에서 active 상태 정확
- `/posts` — 카테고리 sticky rail + 연도 그룹 list
- 모든 article 페이지 (`/[slug]`) — Hero (lavender) + prose-bento + (시리즈 시) Series nav + Prev/Next + Related
- `/category/[name]` — Featured + 톤 cycling grid
- `/series/[slug]` — Hero (lavender) + 에피소드 list
- `/tags/[name]` — Hero + 연도 그룹 list
- `/dev/tokens` — 디자인 시스템 reference (개발용)

검색:
- ⌘K 모달 정상
- 검색 결과 / Recently viewed / Popular this week / Your history 정상
- Tag 클릭 → `/tags/[name]` 정상 이동 (이전엔 404 였음)

ChatButton:
- 우하단 고정, accent 컬러
- 모달 위에 떠 있지 않음 (z-40 < z-50)
- 호버 시 톤 darker

다크 모드:
- 모든 페이지 토글 정상
- 폰트/카드/색상 톤 light/dark 자동 전환

모바일:
- 헤더 햄버거 + Sheet 드로어
- Bento 카드 stack
- Article TOC collapsible
- Posts category chip 가로 레일
- /tags 가중치 클라우드 wrap

운영:
- AdSense 스크립트 로드 (devtools Network)
- GA 스크립트 로드
- JSON-LD WebSite Schema in `<head>`
- RSS `/rss.xml` 정상

- [ ] **Step 6: 브랜치 상태 최종 확인 + 머지 준비**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
echo "--- commits ---"
git log --oneline feature/redesign-bento ^main | wc -l
git log --oneline feature/redesign-bento ^main | head -5
git log --oneline feature/redesign-bento ^main | tail -5
echo "--- diff stat ---"
git diff main feature/redesign-bento --stat | tail -10
echo "--- branch state ---"
git status --short
```

기대:
- 약 41개 커밋 (sub#1~#8 의 38 + sub#9 의 3)
- main 대비 큰 diff (수십 파일 신규/수정/삭제)
- 깨끗한 working tree (또는 tsconfig.tsbuildinfo 만 modified)

이 시점에서 사용자는 main 으로 머지할지 결정 (별도 단계, 본 plan 의 범위 아님).

---

## Self-Review Notes

### Spec coverage (§10)
- §10.1 sitemap & SEO → Task 1 ✓
  - 새 라우트 추가 ✓
- §10.2 RSS → 변경 없음 (글 단위만 유지, 인덱스 라우트는 RSS 미포함 — 기존 동작 유지)
- §10.3 AdSense / GA → 변경 없음 (그대로 유지)
- §10.4 ChatButton → Task 2 ✓
  - 색상 토큰 ✓
  - z-index 충돌 ✓
- §10.5 미사용 자원 정리 → Task 3 ✓
  - search-dialog, home-content, tag-bubble-chart, tags-page-client, feature/* 삭제 ✓
  - d3 의존성 제거 ✓
  - shadcn 토큰 정리 — 본 plan 범위 밖 (위험성, 별도 cleanup)
  - dead imports — 본 plan 범위 밖 (각 sub-project 가 자기 영역 정리)
- §10.6 에러 처리 → 변경 없음 (각 sub-project 가 notFound() 가드 이미 구현)
- §11 최종 검증 → Task 4 ✓

### Placeholder scan
TBD/TODO 없음. 모든 명령/코드 완성형.

### Type consistency
- sitemap.ts 의 URL 생성: `lib/url.ts` 의 `seriesSlug` 재사용
- ChatButton className 변경 외 시그니처 동일

### 외부 의존성 사전 검증
- `getAllArticles`, `getAllSeries`, `getArticleTitleFromSlug` — `lib/articles.ts` 존재 ✓
- `seriesSlug` — `lib/url.ts` 존재 (sub#7) ✓
- bento-* 토큰 — sub#1 ✓
- 삭제 대상 파일들의 외부 import 0 (Task 3 Step 1 으로 재확인)

### Decoupling
- Task 1, 2 는 서로 독립 (병렬 가능)
- Task 3 는 Task 1, 2 와 독립이지만 Task 1, 2 의 변경 직후 안전성 검증 + 한 번에 머지가 자연스러움
- Task 4 는 모두 끝난 뒤

### Risks 및 완화
- **Task 3 의 destructive 동작**: `git rm` + `npm uninstall` 은 되돌릴 수 있음 (`git restore` + `npm install`). 빌드 실패 시 즉시 BLOCKED 보고하고 복원 후 디버깅.
- **sitemap 사이즈 증가**: 1097 entries 는 Google 의 50,000 URL 제한 이내. 한 파일 sitemap 으로 충분.
- **tag detail priority 0.5**: 너무 높으면 SEO 점수 분산. 0.5 적절. category 0.6, article 0.7 보다 낮음.
- **ChatButton z-index**: CommandK 모달이 z-50. ChatButton z-40. 모달 위에 안 가려져야 하는 다른 UI 없음 (toast 등). 안전.
- **dev/tokens 페이지**: prod 배포되지만 robots noindex, sitemap 미포함. SEO 영향 없음. 유지 결정.
- **/dev/tokens 가 sitemap 에 포함되지 않음**: Task 1 코드에서 명시적으로 제외하지 않았지만 generateStaticParams 같은 자동 포함 메커니즘 없음. 안전.
- **macOS case-insensitive 파일시스템 이슈** (sub#8 에서 발견): production Linux 에서는 정상. 본 plan 의 검증은 macOS 로컬이라 일부 case-mixed 태그 (Kubernetes vs kubernetes) 가 충돌하지만 production 영향 없음.
