# Bug #2: Article URL 구조 변경 및 404 오류 해결

## 문제 정의

### 현재 상황
- Article URL: `http://localhost:3000/article/java/Keycloak으로-자체-인증-서버-구축/`
- 메인 페이지에서 개별 article 클릭 시 404 오류 발생

### 요구사항
- Article URL을 `http://localhost:3000/Keycloak으로-자체-인증-서버-구축/`로 변경
- `/article/` 프리픽스와 category 부분 제거
- Article title만 URL에 사용

## 코드 분석

### 1. 현재 프로젝트 구조

```
app/
├── article/[...slug]/page.tsx    # Article 상세 페이지 (catch-all route)
├── page.tsx                      # 홈페이지
├── series/page.tsx               # 시리즈 페이지
└── layout.tsx                    # Root layout

contents/
├── java/
│   └── Keycloak으로-자체-인증-서버-구축/
│       └── index.md
├── cloud/
├── database/
└── ...

lib/
└── articles.ts                   # Article 로딩 로직

public/
└── content-manifest.json         # Article 메타데이터
```

### 2. Slug 형식

**현재 Slug 구조:**
```typescript
// manifest.json
{
  "slug": "java/Keycloak으로-자체-인증-서버-구축",
  "category": "java",
  "title": "Keycloak으로 자체 인증 서버 구축"
}
```

- Format: `{category}/{article-title}`
- File path: `contents/{category}/{article-title}/index.md`

### 3. URL 생성 위치

**현재 `/article/` 프리픽스를 사용하는 파일:**

1. **app/page.tsx:28** - 홈페이지
```typescript
<Link href={`/article/${article.slug}`}>
```

2. **app/series/page.tsx:55** - 시리즈 페이지
```typescript
<Link href={`/article/${article.slug}`}>
```

3. **app/article/[...slug]/page.tsx:148** - 관련 글
```typescript
<Link href={`/article/${related.slug}`}>
```

### 4. Article 로딩 로직

**lib/articles.ts:79-101**
```typescript
export async function getArticle(slug: string): Promise<Article | null> {
  try {
    // contents/{category}/{article-dir}/index.md 경로
    const filePath = path.join(process.cwd(), 'contents', slug, 'index.md');
    const markdown = await fs.readFile(filePath, 'utf-8');
    const article = await parseMarkdown(markdown, slug);
    articleCache.set(slug, article);
    return article;
  } catch (error) {
    console.error(`Failed to load article: ${slug}`, error);
    return null;
  }
}
```

- 현재는 `slug`가 `{category}/{article-title}` 형식이어야 파일 로드 가능
- Category 제거 시 파일 경로 찾기 불가능

## 구현 방안

### Option 1: Article Title만 사용 (요구사항 충족)

#### 장점
- URL이 짧고 깔끔: `/Keycloak으로-자체-인증-서버-구축`
- 요구사항 완전 충족

#### 단점
- **Article 이름 충돌 위험**: 다른 category에 같은 이름의 article 존재 가능
- Manifest 재구성 필요
- File system 구조는 `{category}/{article-title}` 유지하므로 mapping 필요

#### 구현 단계

1. **Helper 함수 생성** - `lib/articles.ts`
```typescript
/**
 * Category를 제외한 article title만 추출
 */
export function getArticleSlugWithoutCategory(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

/**
 * Article title로 전체 slug 찾기
 */
export async function findArticleByTitle(title: string): Promise<ManifestArticle | null> {
  const manifest = await loadManifest();
  return manifest.articles.find(article => {
    const articleTitle = article.slug.split('/').pop();
    return articleTitle === title;
  }) || null;
}

/**
 * Article title로 article 가져오기
 */
export async function getArticleByTitle(title: string): Promise<Article | null> {
  const manifestArticle = await findArticleByTitle(title);
  if (!manifestArticle) {
    return null;
  }
  return getArticle(manifestArticle.slug);
}
```

2. **Route 변경**
   - `app/article/[...slug]/page.tsx` 삭제
   - `app/[slug]/page.tsx` 생성

```typescript
// app/[slug]/page.tsx
import { getArticleByTitle, getAllArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles();

  return articles.map((article) => ({
    slug: article.slug.split('/').pop(), // category 제거
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const article = await getArticleByTitle(resolvedParams.slug);

  if (!article) {
    return { title: '게시글을 찾을 수 없습니다' };
  }

  return {
    title: `${article.frontmatter.title} | Advenoh IT Blog`,
    description: article.frontmatter.excerpt || article.frontmatter.title,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const article = await getArticleByTitle(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  // 기존 로직 유지...
}
```

3. **URL 생성 변경** - 3개 파일 수정

**app/page.tsx**
```typescript
// BEFORE
href={`/article/${article.slug}`}

// AFTER
href={`/${article.slug.split('/').pop()}`}
```

**app/series/page.tsx**
```typescript
// BEFORE
href={`/article/${article.slug}`}

// AFTER
href={`/${article.slug.split('/').pop()}`}
```

**새로 생성된 app/[slug]/page.tsx 내부**
```typescript
// 관련 글 링크
href={`/${related.slug.split('/').pop()}`}
```

4. **Category Badge 유지** - `app/[slug]/page.tsx`
```typescript
// Line 80: category는 manifest의 category 필드 사용
<Badge>{article.frontmatter.category || 'Uncategorized'}</Badge>
```

### Option 2: `/article/` 프리픽스만 제거 (안전한 방법)

#### 장점
- 구현 간단
- Article 이름 충돌 없음
- File system 구조와 일치

#### 단점
- URL이 여전히 길음: `/java/Keycloak으로-자체-인증-서버-구축`
- 요구사항 미충족 (category 여전히 포함)

#### 구현 단계

1. **Route 이동**
   - `app/article/[...slug]/page.tsx` → `app/[...slug]/page.tsx`로 이동

2. **URL 생성 변경**
```typescript
// 모든 파일에서
// BEFORE
href={`/article/${article.slug}`}

// AFTER
href={`/${article.slug}`}
```

## 권장 사항

### ⚠️ 중요 고려사항

**Article 이름 충돌 검증 필요:**
```bash
# 중복 article 이름 확인
cd contents
find . -mindepth 2 -maxdepth 2 -type d | sed 's|.*/||' | sort | uniq -d
```

만약 중복이 없다면 **Option 1** 추천, 중복이 있다면 **Option 2** 추천

### 추천 구현 순서

1. **중복 검증**: Article 이름 중복 확인
2. **Helper 함수 추가**: `lib/articles.ts`
3. **새 Route 생성**: `app/[slug]/page.tsx`
4. **URL 링크 수정**: 3개 파일 (page.tsx, series/page.tsx, [slug]/page.tsx)
5. **기존 Route 삭제**: `app/article/[...slug]/`
6. **테스트**: 로컬 환경에서 확인
7. **Build 검증**: `npm run build` 실행하여 static generation 확인

## TODO

- [ ] Article 이름 중복 검증
- [ ] `lib/articles.ts`에 helper 함수 추가
  - [ ] `getArticleSlugWithoutCategory()`
  - [ ] `findArticleByTitle()`
  - [ ] `getArticleByTitle()`
- [ ] `app/[slug]/page.tsx` 생성
  - [ ] `generateStaticParams()` 구현
  - [ ] `generateMetadata()` 구현
  - [ ] Article 렌더링 로직 이식
- [ ] URL 링크 수정
  - [ ] `app/page.tsx:28`
  - [ ] `app/series/page.tsx:55`
  - [ ] `app/[slug]/page.tsx` (관련 글)
- [ ] `app/article/[...slug]/` 디렉토리 삭제
- [ ] 로컬 테스트
  - [ ] 홈페이지 → Article 이동
  - [ ] 시리즈 페이지 → Article 이동
  - [ ] 관련 글 → Article 이동
- [ ] Build 검증 (`npm run build`)
- [ ] 404 오류 해결 확인

## 참고 링크

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
