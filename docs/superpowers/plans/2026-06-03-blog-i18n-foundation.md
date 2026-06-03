# Blog 다국어 Foundation (Plan 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영어 콘텐츠(`index_en.md`)를 저장·발견·필터링하고 `/en/` 경로에서 영어 글을 볼 수 있게 하는 다국어 기반을 구축한다.

**Architecture:** 같은 디렉토리에 `index.md`(ko)+`index_en.md`(en) 페어링. manifest 생성 스크립트가 두 파일을 스캔해 항목마다 `lang` 필드를 부여. `lib/articles.ts`의 조회 함수가 `lang` 인자로 필터. 라우팅은 한국어를 루트에 유지하고 영어는 `app/en/` 라우트 그룹으로 미러링(정적 export, `generateStaticParams`로 `index_en.md` 있는 글만 생성).

**Tech Stack:** Next.js App Router (`output: 'export'`), TypeScript, gray-matter, tsx 스크립트. 테스트 러너 없음 → 검증은 `npm run check`(tsc), `npm run generate:manifest`(출력 확인), `next dev`(수동 확인).

**Scope (Plan 1):** 데이터 계층(manifest `lang`) + `lib/articles.ts` 언어 인자 + 기존 `-en` 1건을 `index_en.md` fixture로 이전 + `/en` 홈 + `/en/[slug]` 글 상세 + `/en/posts` 목록(언어 필터). 카테고리/태그/시리즈 `/en` 미러와 hreflang/RSS/sitemap, UI 문자열 사전·토글·언어감지는 후속 Plan(2~3)에서 다룬다.

---

## File Structure

- `scripts/generate-content-manifest.ts` — 수정: `index_en.md`도 스캔, `ArticleMetadata`에 `lang` 추가, 영어 항목 slug는 동일 `category/dir` 사용하되 `lang`으로 구분
- `lib/articles.ts` — 수정: `Manifest`/`ManifestArticle`에 `lang`, 조회 함수에 `lang` 인자, `getArticle(slug, lang)`가 `index_en.md` 읽기 지원
- `contents/cloud/ksqldb-소개/index_en.md` — 생성: 기존 `ksqldb-소개-en/index.md`를 옮긴 fixture
- `app/en/layout.tsx` — 생성: 영어 라우트 그룹 레이아웃(lang="en")
- `app/en/page.tsx` — 생성: 영어 홈(영어 글 목록)
- `app/en/[slug]/page.tsx` — 생성: 영어 글 상세
- `app/en/posts/page.tsx` — 생성: 영어 전체 글 목록

---

## Task 1: manifest 생성 스크립트에 lang 추가 및 index_en.md 스캔

**Files:**
- Modify: `scripts/generate-content-manifest.ts`

- [ ] **Step 1: `ArticleMetadata`에 `lang` 필드 추가**

`scripts/generate-content-manifest.ts` 상단 인터페이스(5-16행)를 수정:

```ts
interface ArticleMetadata {
  slug: string;
  category: string;
  lang: 'ko' | 'en';
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
  readTime?: number;
}
```

- [ ] **Step 2: 한 글 디렉토리에서 ko/en 두 파일을 모두 처리하도록 `scanContents` 수정**

`scanContents`의 article 루프(51-85행)를 다음으로 교체. `index.md`(ko)와 `index_en.md`(en)를 각각 항목으로 추가한다. slug은 두 언어 동일(`category/dir`)하고 `lang`으로 구분한다.

```ts
    for (const articleDir of articleDirs) {
      const dirPath = path.join(categoryPath, articleDir);
      const variants: Array<{ lang: 'ko' | 'en'; file: string }> = [
        { lang: 'ko', file: 'index.md' },
        { lang: 'en', file: 'index_en.md' },
      ];

      const koExists = fs.existsSync(path.join(dirPath, 'index.md'));
      if (!koExists) {
        console.warn(`⚠️  No index.md found in ${category}/${articleDir}`);
      }

      for (const { lang, file } of variants) {
        const indexPath = path.join(dirPath, file);
        if (!fs.existsSync(indexPath)) continue;

        try {
          const raw = fs.readFileSync(indexPath, 'utf-8');
          const { data, content } = matter(raw);

          const mdImageMatch = raw.match(/!\[([^\]]*)]\(([^)]+)\)/);
          const htmlImageMatch = raw.match(/<img\s[^>]*src=["']([^"']+)["']/);
          const firstImage = mdImageMatch ? mdImageMatch[2] : htmlImageMatch ? htmlImageMatch[1] : undefined;

          articles.push({
            slug: `${category}/${articleDir}`,
            category,
            lang,
            title: data.title || articleDir,
            date: data.date || new Date().toISOString(),
            excerpt: data.description ?? data.excerpt,
            tags: data.tags || [],
            series: data.series,
            seriesOrder: data.seriesOrder,
            firstImage,
            readTime: calculateReadingTime(content),
          });
        } catch (error) {
          console.error(`❌ Error processing ${category}/${articleDir} (${file}):`, error);
        }
      }
    }
```

- [ ] **Step 3: categories/tags/series는 언어 무관 집계 유지 확인**

`generateManifest`(94-110행)는 그대로 두되, 정렬은 `lang` 무관 날짜순 유지. 변경 불필요(확인만).

- [ ] **Step 4: 매니페스트 생성 실행 (현재는 en 글이 없어 ko만 나오는지 확인)**

Run: `npm run generate:manifest`
Expected: `✅ Found N articles` 출력. `public/content-manifest.json`의 모든 항목에 `"lang": "ko"`가 포함됨 (아직 `index_en.md` 없음).

검증: `node -e "const m=require('./public/content-manifest.json'); console.log('total',m.articles.length); console.log('langs',[...new Set(m.articles.map(a=>a.lang))])"`
Expected: `langs [ 'ko' ]`

- [ ] **Step 5: 타입 체크**

Run: `npm run check`
Expected: 에러 없이 통과

- [ ] **Step 6: 커밋**

```bash
git add scripts/generate-content-manifest.ts public/content-manifest.json
git commit -m "feat: manifest에 lang 필드 추가 및 index_en.md 스캔 지원"
```

---

## Task 2: lib/articles.ts를 언어 인지(lang-aware)로 확장

**Files:**
- Modify: `lib/articles.ts`

- [ ] **Step 1: `ManifestArticle`/`Manifest`에 `lang` 추가**

`lib/articles.ts` 5-24행의 인터페이스 수정:

```ts
interface ManifestArticle {
  slug: string;
  category: string;
  lang: 'ko' | 'en';
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
  readTime?: number;
}
```

(`Manifest` 인터페이스는 그대로)

- [ ] **Step 2: 조회 함수에 `lang` 인자 추가 (기본 'ko')**

`getAllArticles`/`getArticlesByCategory`/`getArticlesByTag`/`getArticlesBySeries`/`getAllCategories`/`getAllTags`/`getAllSeries`를 lang 필터하도록 수정. 예:

```ts
export async function getAllArticles(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(article => article.lang === lang);
}

export async function getArticlesByCategory(category: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(a => a.category === category && a.lang === lang);
}

export async function getArticlesByTag(tag: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(a => a.tags?.includes(tag) && a.lang === lang);
}

export async function getArticlesBySeries(series: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles
    .filter(a => a.series === series && a.lang === lang)
    .sort((x, y) => (x.seriesOrder || 0) - (y.seriesOrder || 0));
}

export async function getAllCategories(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang).map(a => a.category))].sort();
}

export async function getAllTags(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang).flatMap(a => a.tags || []))].sort();
}

export async function getAllSeries(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang && a.series).map(a => a.series!))].sort();
}
```

- [ ] **Step 3: `getArticle`/`getArticleByTitle`/`findArticleByTitle`/관련·인접 글에 lang 반영**

`getArticle`이 lang에 따라 파일명을 고르게 하고 캐시 키에 lang 포함:

```ts
export async function getArticle(slug: string, lang: 'ko' | 'en' = 'ko'): Promise<Article | null> {
  const cacheKey = `${lang}:${slug}`;
  if (articleCache.has(cacheKey)) {
    return articleCache.get(cacheKey)!;
  }
  try {
    const fileName = lang === 'en' ? 'index_en.md' : 'index.md';
    const filePath = path.join(process.cwd(), 'contents', slug, fileName);
    const markdown = await fs.readFile(filePath, 'utf-8');
    const article = await parseMarkdown(markdown, slug);
    articleCache.set(cacheKey, article);
    return article;
  } catch (error) {
    console.error(`Failed to load article: ${slug} (${lang})`, error);
    return null;
  }
}
```

`findArticleByTitle`/`getArticleByTitle`에 lang 인자 추가:

```ts
export async function findArticleByTitle(title: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle | null> {
  const manifest = await loadManifest();
  const found = manifest.articles.find(a =>
    a.lang === lang && getArticleTitleFromSlug(a.slug) === title
  );
  return found || null;
}

export async function getArticleByTitle(title: string, lang: 'ko' | 'en' = 'ko'): Promise<Article | null> {
  const manifestArticle = await findArticleByTitle(title, lang);
  if (!manifestArticle) return null;
  return getArticle(manifestArticle.slug, lang);
}
```

`getRelatedArticles`/`getAdjacentArticles`에도 lang 인자(기본 'ko')를 추가하고 후보를 `a.lang === lang`로 한정. (시그니처: `getRelatedArticles(slug, lang='ko', limit=5)`, `getAdjacentArticles(slug, lang='ko')` — 기존 호출부 호환 위해 limit를 뒤로)

```ts
export async function getRelatedArticles(slug: string, lang: 'ko' | 'en' = 'ko', limit = 5): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  const current = manifest.articles.find(a => a.slug === slug && a.lang === lang);
  if (!current) return [];
  return manifest.articles
    .filter(a => {
      if (a.lang !== lang) return false;
      if (a.slug === slug) return false;
      if (a.category === current.category) return true;
      const common = a.tags?.filter(t => current.tags?.includes(t));
      return common && common.length > 0;
    })
    .slice(0, limit);
}

export async function getAdjacentArticles(slug: string, lang: 'ko' | 'en' = 'ko'): Promise<{ prev: ManifestArticle | null; next: ManifestArticle | null; }> {
  const manifest = await loadManifest();
  const list = manifest.articles.filter(a => a.lang === lang);
  const idx = list.findIndex(a => a.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx < list.length - 1 ? list[idx + 1] : null,
  };
}
```

- [ ] **Step 4: 기존 호출부(한국어 라우트)는 인자 생략 시 'ko' 기본값으로 동작하는지 타입 체크**

Run: `npm run check`
Expected: 통과. 기존 `getAllArticles()` 등 인자 없는 호출은 'ko' 기본값으로 동작(동작 변화 없음). `getRelatedArticles(slug, limit)` 형태로 limit를 2번째 인자로 넘기던 기존 호출이 있으면 컴파일 에러로 드러남 → 해당 호출을 `getRelatedArticles(slug, 'ko', limit)`로 수정.

- [ ] **Step 5: 기존 라우트 빌드 확인 (회귀 없음)**

Run: `npm run generate:manifest && npm run check`
Expected: 통과.

- [ ] **Step 6: 커밋**

```bash
git add lib/articles.ts
git commit -m "feat: articles 조회 함수에 lang 인자 추가 (기본 ko)"
```

---

## Task 3: 기존 ksqldb 영어 글을 index_en.md fixture로 이전

**Files:**
- Create: `contents/cloud/ksqldb-소개/index_en.md`
- Delete: `contents/cloud/ksqldb-소개-en/` (디렉토리)

- [ ] **Step 1: 기존 영어 본문을 페어 디렉토리로 이동**

```bash
git mv "contents/cloud/ksqldb-소개-en/index.md" "contents/cloud/ksqldb-소개/index_en.md"
```

(이미지가 `ksqldb-소개-en/`에 있다면 `ksqldb-소개/`에 동일 이름이 없을 때만 함께 이동, 있으면 영어본의 이미지 참조를 공유 이미지로 맞춤. 본 fixture 글은 이미지 없음 — `ls "contents/cloud/ksqldb-소개-en/"`로 확인)

- [ ] **Step 2: 남은 -en 디렉토리 제거(비었으면)**

```bash
rmdir "contents/cloud/ksqldb-소개-en" 2>/dev/null || ls "contents/cloud/ksqldb-소개-en"
```
디렉토리에 잔여 파일이 있으면 내용을 확인 후 페어 디렉토리로 옮기고 제거.

- [ ] **Step 3: 매니페스트 재생성 및 en 항목 확인**

Run: `npm run generate:manifest`
검증: `node -e "const m=require('./public/content-manifest.json'); console.log('en',m.articles.filter(a=>a.lang==='en').map(a=>a.slug))"`
Expected: `en [ 'cloud/ksqldb-소개' ]`

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "refactor: ksqldb 영어 글을 index_en.md 페어링으로 이전"
```

---

## Task 4: 영어 라우트 그룹 레이아웃 (app/en/layout.tsx)

**Files:**
- Create: `app/en/layout.tsx`
- Read first: `app/layout.tsx` (루트 레이아웃 구조 파악 — html lang, 공통 wrapper)

- [ ] **Step 1: 루트 레이아웃 확인**

Run: `sed -n '1,80p' app/layout.tsx`
목적: 루트가 `<html lang="ko">`와 공통 헤더/푸터를 어떻게 렌더하는지 확인. `/en` 레이아웃은 동일 구조를 재사용하되 lang 컨텍스트만 'en'으로 전달.

- [ ] **Step 2: en 세그먼트 레이아웃 작성**

App Router에서 중첩 레이아웃은 `<html>`을 중복 렌더하지 않는다(루트 레이아웃이 담당). `app/en/layout.tsx`는 children을 그대로 통과시키되, 향후 UI 언어 컨텍스트의 주입 지점으로 둔다(현재는 패스스루):

```tsx
export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

(UI 문자열 사전·언어 Context는 Plan 2에서 이 레이아웃에 주입한다. Plan 1에서는 패스스루로 두어 라우팅만 성립시킨다.)

- [ ] **Step 3: 타입 체크**

Run: `npm run check`
Expected: 통과

- [ ] **Step 4: 커밋**

```bash
git add app/en/layout.tsx
git commit -m "feat: 영어 라우트 그룹 레이아웃 추가"
```

---

## Task 5: 영어 글 상세 페이지 (app/en/[slug]/page.tsx)

**Files:**
- Create: `app/en/[slug]/page.tsx`
- Read first: `app/[slug]/page.tsx` (한국어 글 상세 — 컴포넌트 구성·메타데이터 패턴 복제 대상)

- [ ] **Step 1: 한국어 글 상세 전체 구조 확인**

Run: `cat "app/[slug]/page.tsx"`
목적: import 컴포넌트, `generateStaticParams`, `generateMetadata`, 본문 렌더 흐름 파악. 영어판은 동일하되 모든 `articles` 조회에 `'en'`을 전달하고 링크를 `/en/...`로 만든다.

- [ ] **Step 2: 영어 글 상세 페이지 작성**

`app/[slug]/page.tsx`를 기반으로, 아래 차이만 반영해 `app/en/[slug]/page.tsx`를 작성:
- `generateStaticParams`: `getAllArticles('en')`로 영어 글만 경로 생성
- `getArticleByTitle(decodedSlug, 'en')`, `getRelatedArticles(slug, 'en')`, `getAdjacentArticles(slug, 'en')`, `getArticlesBySeries(series, 'en')` 등 모든 조회에 `'en'` 전달
- 내부 링크(브레드크럼/시리즈/이전·다음/관련)는 `/en/` prefix를 붙인다
- `generateMetadata`에 `alternates: { languages: { ko: '/{slug}/', en: '/en/{slug}/' } }` 추가(hreflang 기반 — 상세 SEO는 Plan 3에서 보강)

```tsx
export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = await getAllArticles('en');
  return articles.map((article) => ({
    slug: getArticleTitleFromSlug(article.slug),
  }));
}
```

(나머지 본문은 한국어판과 동일 컴포넌트 사용 — `MermaidRenderer`, `TableOfContents`, `HeroCard`, `PrevNext`, `RelatedCards`, `RecordView`, `ReadingProgress`, `Breadcrumb`. 한국어판 import 목록을 그대로 복제하고 데이터 조회만 `'en'`으로.)

- [ ] **Step 3: 타입 체크 및 매니페스트 재생성**

Run: `npm run generate:manifest && npm run check`
Expected: 통과

- [ ] **Step 4: dev 서버로 영어 글 렌더 확인**

Run: `npm run dev` (별도 터미널) 후 브라우저에서 `http://localhost:3000/en/ksqldb-소개/` 접속
Expected: ksqlDB 영어 글이 영어 제목/본문으로 렌더됨. 관련/이전·다음 링크가 `/en/...`을 가리킴.

- [ ] **Step 5: 커밋**

```bash
git add "app/en/[slug]/page.tsx"
git commit -m "feat: 영어 글 상세 페이지(/en/[slug]) 추가"
```

---

## Task 6: 영어 글 목록 페이지 (app/en/posts/page.tsx)

**Files:**
- Create: `app/en/posts/page.tsx`
- Read first: `app/posts/page.tsx` (한국어 목록 — 복제 대상)

- [ ] **Step 1: 한국어 posts 페이지 구조 확인**

Run: `cat app/posts/page.tsx`
목적: 목록 렌더·카드 컴포넌트·정렬 파악.

- [ ] **Step 2: 영어 posts 페이지 작성**

`app/posts/page.tsx`를 기반으로 `getAllArticles('en')`로 영어 글만 가져오고, 각 글 링크를 `/en/{slug}`로 생성. 글 카드/날짜 포맷 컴포넌트는 동일 재사용.

- [ ] **Step 3: 타입 체크**

Run: `npm run check`
Expected: 통과

- [ ] **Step 4: dev 확인**

`http://localhost:3000/en/posts/` 접속 → 영어 글(ksqlDB)만 목록에 노출, 한국어 글은 안 보임.
Expected: 영어 글 1건만 표시.

- [ ] **Step 5: 커밋**

```bash
git add app/en/posts/page.tsx
git commit -m "feat: 영어 글 목록 페이지(/en/posts) 추가"
```

---

## Task 7: 영어 홈 페이지 (app/en/page.tsx)

**Files:**
- Create: `app/en/page.tsx`
- Read first: `app/page.tsx` (한국어 홈 — 복제 대상, 단 위젯이 많으므로 Plan 1에서는 최소 구성)

- [ ] **Step 1: 한국어 홈 구조 확인**

Run: `sed -n '1,60p' app/page.tsx`
목적: 홈이 사용하는 데이터 조회(`getAllArticles`, `getAllSeries` 등) 파악.

- [ ] **Step 2: 영어 홈 작성 (최소: 최신 영어 글 목록 + 헤드라인)**

Plan 1에서는 홈 전체 위젯(히트맵·QOTD 등)을 복제하지 않고, 영어 글 목록 중심의 최소 홈을 구성한다. 데이터는 `getAllArticles('en')`/`getAllSeries('en')` 사용, 모든 링크 `/en/` prefix.

```tsx
import { getAllArticles } from '@/lib/articles';
import { getArticleTitleFromSlug } from '@/lib/articles';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT tech blog — development, cloud, database',
};

export default async function EnHome() {
  const articles = await getAllArticles('en');
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Frank&apos;s IT Blog</h1>
      <ul className="space-y-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/en/${getArticleTitleFromSlug(a.slug)}/`} className="font-medium hover:underline">
              {a.title}
            </Link>
            <div className="text-sm text-muted-foreground">{formatDate(a.date)}</div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm"><Link href="/en/posts/" className="underline">All posts →</Link></p>
    </main>
  );
}
```

(홈 위젯 완전 현지화는 Plan 2의 UI 사전 도입 후 별도로 다룬다. Plan 1의 목표는 영어 진입점이 존재하고 영어 글만 노출되는 것.)

- [ ] **Step 3: 타입 체크 + 전체 빌드**

Run: `npm run generate:manifest && npm run check && npm run build`
Expected: 빌드 성공. `out/en/index.html`, `out/en/ksqldb-소개/index.html`, `out/en/posts/index.html` 생성됨.

검증: `ls out/en/ && ls out/en/posts/`
Expected: 각 디렉토리에 `index.html` 존재.

- [ ] **Step 4: dev 확인**

`http://localhost:3000/en/` → 영어 글(ksqlDB) 목록과 `All posts →` 링크 노출.

- [ ] **Step 5: 커밋**

```bash
git add app/en/page.tsx
git commit -m "feat: 영어 홈 페이지(/en) 추가 (최소 구성)"
```

---

## Self-Review 결과 (작성자 점검)

- **Spec coverage:** Plan 1 범위(콘텐츠 구조, manifest lang, /en 라우팅, 언어 필터, 기존 -en 1건 이전)는 Task 1~7로 모두 커버. 카테고리/태그/시리즈 `/en` 미러, hreflang/RSS/sitemap, UI 사전·토글·언어감지는 명시적으로 Plan 2~3로 이연(스코프 섹션에 기재).
- **Placeholder scan:** "TODO/적절히 처리" 류 없음. 각 코드 스텝에 실제 코드 포함. 단 Task 5는 한국어 상세 페이지 전체를 복제하는 작업이라 "동일 컴포넌트 재사용"으로 기술 — 실행 시 `cat app/[slug]/page.tsx` 결과를 토대로 동일 import를 그대로 복제하도록 Step 1에서 강제.
- **Type consistency:** `lang: 'ko' | 'en'` 타입을 manifest 스크립트와 lib/articles.ts에서 동일하게 사용. `getRelatedArticles(slug, lang, limit)` 시그니처 변경으로 기존 호출부 깨짐 가능성을 Task 2 Step 4에서 명시적으로 잡도록 함.
- **Scope check:** Plan 1은 그 자체로 동작·빌드 가능한 결과물(영어 진입점 + 필터링)을 낸다. 나머지는 Plan 2~3.
