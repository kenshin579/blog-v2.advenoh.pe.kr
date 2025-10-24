# 구현 계획서 (Implementation Plan)
## Next.js Static Export 블로그 전환

---

## 개발 프로세스 (Claude Code 작업 시)

### 작업 원칙

1. **단계별 진행**
   - [todo.md](./todo.md)의 체크리스트를 따라 단계별로 작업
   - 한 번에 하나의 Phase 또는 작업 단위로 진행
   - 각 단계 완료 후 다음 단계로 이동

2. **작업 완료 시 커밋**
   - 각 작업 또는 의미 있는 단위 완료 시 즉시 커밋
   - 커밋 메시지 형식: `[#1] 작업 내용 요약`
   - 예시:
     ```bash
     git add .
     git commit -m "[#1] Phase 1.1: Next.js 프로젝트 초기화 완료"
     ```

3. **사이트 체크**
   - 개발 서버 실행 후 사이트 동작 확인이 필요한 경우
   - **MCP Playwright 사용** (브라우저 자동화)
   - 예시 시나리오:
     - 페이지 렌더링 확인
     - 링크 동작 테스트
     - 검색 기능 테스트
     - 다크모드 전환 확인
     - 반응형 디자인 확인

### Playwright 활용 예시

**개발 서버 실행 후**:
```bash
npm run dev
```

**Claude에게 요청**:
- "localhost:3000 에서 홈페이지가 제대로 렌더링되는지 확인해줘"
- "article 페이지 링크를 클릭해서 상세 페이지로 이동되는지 테스트해줘"
- "검색 모달을 열고 'React' 키워드로 검색 결과가 나오는지 확인해줘"
- "다크모드 토글 버튼을 클릭해서 테마가 전환되는지 확인해줘"

Claude Code가 자동으로 브라우저를 제어하여 테스트하고 결과를 리포트합니다.

### 작업 흐름 예시

```
1. todo.md 확인 → Phase 1.1 작업 시작
2. Next.js 설치 및 설정 파일 생성
3. git commit -m "[#1] Phase 1.1: Next.js 프로젝트 초기화"
4. npm run dev 실행
5. Claude에게 "localhost:3000 접속해서 페이지 로드 확인해줘" 요청
6. Playwright로 자동 확인 및 스크린샷
7. 문제 발견 시 수정 → 커밋
8. todo.md에서 체크박스 체크 [x]
9. 다음 작업(Phase 1.2)으로 이동
```

---

## Phase 1: Next.js 프로젝트 초기화

### 1.1 Next.js 설치 및 기본 구조 생성

**목표**: Next.js 14+ 프로젝트 생성 및 기본 설정

**작업 내용**:
```bash
# Next.js 14 설치
npm install next@latest react@latest react-dom@latest

# TypeScript 및 타입 정의 설치
npm install -D @types/node @types/react @types/react-dom typescript

# 기본 디렉토리 생성
mkdir -p app/{article/[slug],series}
mkdir -p components/ui
mkdir -p lib
```

**파일 생성**:
- `next.config.js` - Static export 설정
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page (빈 페이지)
- `tsconfig.json` - TypeScript 설정

**next.config.js 예시**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Static export 지원
  },
  trailingSlash: true, // URL에 슬래시 추가
};

module.exports = nextConfig;
```

---

### 1.2 Tailwind CSS + shadcn/ui 마이그레이션

**목표**: 기존 스타일링 시스템을 Next.js 프로젝트로 이전

**작업 내용**:
1. 기존 `tailwind.config.ts` 복사 및 경로 수정
2. 기존 `components/ui/` 폴더 복사
3. `app/globals.css` 생성 및 Tailwind 임포트
4. 다크모드 설정 (next-themes)

**이전할 파일**:
```
client/src/components/ui/  →  components/ui/
client/src/index.css       →  app/globals.css (수정)
tailwind.config.ts         →  tailwind.config.ts (경로 수정)
components.json            →  components.json
```

**next-themes 설정**:
```typescript
// components/theme-provider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

## Phase 2: 콘텐츠 시스템 구축

### 2.1 Markdown 파일 스캔 및 메타데이터 추출

**목표**: contents/ 폴더의 모든 마크다운 파일 발견 및 파싱

**필요 패키지**:
```bash
npm install gray-matter remark remark-gfm remark-html rehype-prism-plus rehype-slug rehype-autolink-headings
```

**구현 파일**: `lib/articles.ts`

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENTS_DIR = path.join(process.cwd(), 'contents');

export interface ArticleFrontmatter {
  title: string;
  description?: string;
  date: string;
  update?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
}

export interface Article {
  slug: string;
  category: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

// 모든 카테고리 가져오기
export function getCategories(): string[] {
  return fs.readdirSync(CONTENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// 특정 카테고리의 모든 글 가져오기
export function getArticlesByCategory(category: string): Article[] {
  const categoryPath = path.join(CONTENTS_DIR, category);
  const articleDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return articleDirs.map(articleDir => {
    const articlePath = path.join(categoryPath, articleDir, 'index.md');
    const fileContents = fs.readFileSync(articlePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug: `${category}/${articleDir}`,
      category,
      frontmatter: data as ArticleFrontmatter,
      content,
    };
  });
}

// 모든 글 가져오기
export function getAllArticles(): Article[] {
  const categories = getCategories();
  return categories.flatMap(category => getArticlesByCategory(category));
}

// 특정 slug의 글 가져오기
export function getArticleBySlug(slug: string): Article | null {
  const [category, articleDir] = slug.split('/');
  const articlePath = path.join(CONTENTS_DIR, category, articleDir, 'index.md');

  if (!fs.existsSync(articlePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(articlePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    category,
    frontmatter: data as ArticleFrontmatter,
    content,
  };
}
```

---

### 2.2 Markdown → HTML 변환

**목표**: remark/rehype로 마크다운을 HTML로 변환

**구현 파일**: `lib/markdown.ts`

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
    })
    .use(rehypePrismPlus, {
      showLineNumbers: true,
    })
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

// TOC 추출
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function extractTOC(html: string): TOCItem[] {
  const headingRegex = /<h([2-3])\s+id="([^"]+)">([^<]+)<\/h[2-3]>/g;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      id: match[2],
      text: match[3],
      level: parseInt(match[1]),
    });
  }

  return toc;
}

// 읽기 시간 계산
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
```

---

### 2.3 이미지 경로 처리

**목표**: contents/ 폴더의 이미지를 빌드 타임에 public/으로 복사

**구현 방법**:
1. 빌드 스크립트 작성 (`scripts/copy-images.js`)
2. package.json의 build 명령어에 추가

**scripts/copy-images.js**:
```javascript
const fs = require('fs-extra');
const path = require('path');

const CONTENTS_DIR = path.join(__dirname, '../contents');
const PUBLIC_DIR = path.join(__dirname, '../public/images');

async function copyImages() {
  // public/images 디렉토리 초기화
  await fs.emptyDir(PUBLIC_DIR);

  // contents의 모든 카테고리 순회
  const categories = await fs.readdir(CONTENTS_DIR);

  for (const category of categories) {
    const categoryPath = path.join(CONTENTS_DIR, category);
    const stat = await fs.stat(categoryPath);

    if (!stat.isDirectory()) continue;

    // 각 카테고리의 article 순회
    const articles = await fs.readdir(categoryPath);

    for (const article of articles) {
      const articlePath = path.join(categoryPath, article);
      const articleStat = await fs.stat(articlePath);

      if (!articleStat.isDirectory()) continue;

      // 이미지 파일 복사
      const files = await fs.readdir(articlePath);
      const imageFiles = files.filter(file =>
        /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file)
      );

      for (const imageFile of imageFiles) {
        const sourcePath = path.join(articlePath, imageFile);
        const destPath = path.join(PUBLIC_DIR, category, article, imageFile);

        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
      }
    }
  }

  console.log('✅ Images copied to public/images/');
}

copyImages().catch(console.error);
```

**package.json 수정**:
```json
{
  "scripts": {
    "copy-images": "node scripts/copy-images.js",
    "prebuild": "npm run copy-images",
    "build": "next build"
  }
}
```

---

## Phase 3: 페이지 생성

### 3.1 홈페이지 (Article List)

**파일**: `app/page.tsx`

```typescript
import { getAllArticles } from '@/lib/articles';
import ArticleCard from '@/components/article-card';

export default function HomePage() {
  const articles = getAllArticles();

  // 날짜순 정렬 (최신순)
  const sortedArticles = articles.sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">최신 글</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedArticles.map(article => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
```

---

### 3.2 Article Detail 페이지

**파일**: `app/article/[slug]/page.tsx`

```typescript
import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import { markdownToHtml, extractTOC, calculateReadingTime } from '@/lib/markdown';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const articles = getAllArticles();

  return articles.map(article => ({
    slug: article.slug.split('/'), // ['cloud', 'docker-명령어-모음']
  }));
}

export default async function ArticlePage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/');
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const html = await markdownToHtml(article.content);
  const toc = extractTOC(html);
  const readingTime = calculateReadingTime(article.content);

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <time>{article.frontmatter.date}</time>
          <span>{readingTime}분 읽기</span>
        </div>
        {article.frontmatter.tags && (
          <div className="flex gap-2 mt-4">
            {article.frontmatter.tags.map(tag => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        )}
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  );
}
```

---

### 3.3 Series 페이지

**파일**: `app/series/page.tsx`

```typescript
import { getAllArticles } from '@/lib/articles';

export default function SeriesPage() {
  const articles = getAllArticles();

  // series로 그룹화
  const seriesMap = new Map<string, typeof articles>();

  articles.forEach(article => {
    if (article.frontmatter.series) {
      const existing = seriesMap.get(article.frontmatter.series) || [];
      seriesMap.set(article.frontmatter.series, [...existing, article]);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">시리즈</h1>
      {Array.from(seriesMap.entries()).map(([seriesName, seriesArticles]) => {
        const sorted = seriesArticles.sort((a, b) =>
          (a.frontmatter.seriesOrder || 0) - (b.frontmatter.seriesOrder || 0)
        );

        return (
          <div key={seriesName} className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{seriesName}</h2>
            <ol className="space-y-2">
              {sorted.map(article => (
                <li key={article.slug}>
                  <a href={`/article/${article.slug}`}>
                    {article.frontmatter.seriesOrder}. {article.frontmatter.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Phase 4: 검색 및 기능

### 4.1 MiniSearch 클라이언트 검색

**목표**: 빌드 타임에 검색 인덱스 생성, 클라이언트에서 사용

**검색 인덱스 생성**: `scripts/generate-search-index.js`

```javascript
const fs = require('fs-extra');
const path = require('path');
const { getAllArticles } = require('../lib/articles');

async function generateSearchIndex() {
  const articles = getAllArticles();

  const searchData = articles.map(article => ({
    id: article.slug,
    title: article.frontmatter.title,
    excerpt: article.frontmatter.description || article.frontmatter.excerpt || '',
    content: article.content.substring(0, 500), // 처음 500자만
    tags: article.frontmatter.tags || [],
    category: article.category,
  }));

  await fs.writeJSON(
    path.join(__dirname, '../public/search-index.json'),
    searchData,
    { spaces: 2 }
  );

  console.log('✅ Search index generated');
}

generateSearchIndex().catch(console.error);
```

**검색 컴포넌트**: `components/search-modal.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react';
import MiniSearch from 'minisearch';

export function SearchModal() {
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // 검색 인덱스 로드
    fetch('/search-index.json')
      .then(res => res.json())
      .then(data => {
        const ms = new MiniSearch({
          fields: ['title', 'excerpt', 'content', 'tags'],
          storeFields: ['title', 'excerpt', 'id', 'category'],
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
          },
        });

        ms.addAll(data);
        setMiniSearch(ms);
      });
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (miniSearch && q.length > 1) {
      const searchResults = miniSearch.search(q, { limit: 10 });
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="search-modal">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="검색..."
      />
      <div className="results">
        {results.map(result => (
          <a key={result.id} href={`/article/${result.id}`}>
            <h3>{result.title}</h3>
            <p>{result.excerpt}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 5: SEO 및 피드

### 5.1 RSS 피드 생성

**파일**: `app/rss.xml/route.ts`

```typescript
import { getAllArticles } from '@/lib/articles';

const SITE_URL = 'https://advenoh.pe.kr';

export async function GET() {
  const articles = getAllArticles();
  const sortedArticles = articles
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .slice(0, 20);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Advenoh IT Blog</title>
    <link>${SITE_URL}</link>
    <description>IT 기술 블로그</description>
    <language>ko</language>
    ${sortedArticles.map(article => `
    <item>
      <title><![CDATA[${article.frontmatter.title}]]></title>
      <link>${SITE_URL}/article/${article.slug}</link>
      <description><![CDATA[${article.frontmatter.description || ''}]]></description>
      <pubDate>${new Date(article.frontmatter.date).toUTCString()}</pubDate>
      <category>${article.category}</category>
      ${article.frontmatter.tags?.map(tag => `<category>${tag}</category>`).join('') || ''}
    </item>
    `).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
```

---

### 5.2 Sitemap 생성

**파일**: `app/sitemap.ts`

```typescript
import { getAllArticles } from '@/lib/articles';
import { MetadataRoute } from 'next';

const SITE_URL = 'https://advenoh.pe.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  const articlePages = articles.map(article => ({
    url: `${SITE_URL}/article/${article.slug}`,
    lastModified: article.frontmatter.update || article.frontmatter.date,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/series`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...articlePages,
  ];
}
```

---

### 5.3 Metadata API (SEO)

**파일**: `app/layout.tsx`

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Advenoh IT Blog',
    template: '%s | Advenoh IT Blog',
  },
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://advenoh.pe.kr',
    siteName: 'Advenoh IT Blog',
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

**Article 페이지 메타데이터**: `app/article/[slug]/page.tsx`

```typescript
export async function generateMetadata({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/');
  const article = getArticleBySlug(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      type: 'article',
      publishedTime: article.frontmatter.date,
      tags: article.frontmatter.tags,
    },
  };
}
```

---

## Phase 6: 클린업 및 배포

### 6.1 파일 제거

**제거할 항목**:
```bash
# Express 서버
rm -rf server/

# Vite 설정
rm vite.config.ts

# Drizzle ORM
rm drizzle.config.ts
rm -rf shared/

# Replit
rm .replit
rm replit.md

# Client 폴더 (이전 완료 후)
rm -rf client/
```

**package.json에서 제거**:
```json
{
  "devDependencies": {
    // 제거
    "@replit/vite-plugin-cartographer": "^0.3.1",
    "@replit/vite-plugin-dev-banner": "^0.1.1",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@vitejs/plugin-react": "^4.7.0",
    "vite": "^5.4.20",
    "drizzle-kit": "^0.31.4",
    "drizzle-orm": "^0.39.1"
  }
}
```

---

### 6.2 Netlify 배포 설정

**파일**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404

[[headers]]
  for = "/rss.xml"
  [headers.values]
    Content-Type = "application/xml"

[[headers]]
  for = "/sitemap.xml"
  [headers.values]
    Content-Type = "application/xml"
```

**환경 변수** (Netlify Dashboard):
```
NEXT_PUBLIC_SITE_URL=https://advenoh.pe.kr
```

---

### 6.3 빌드 및 테스트

**최종 package.json scripts**:
```json
{
  "scripts": {
    "dev": "next dev",
    "copy-images": "node scripts/copy-images.js",
    "generate-search": "node scripts/generate-search-index.js",
    "prebuild": "npm run copy-images && npm run generate-search",
    "build": "next build",
    "start": "next start"
  }
}
```

**로컬 테스트**:
```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npx serve out
```

**검증 체크리스트**:
- [ ] 모든 contents/ 마크다운 파일이 표시되는지
- [ ] 이미지가 올바르게 로드되는지
- [ ] RSS 피드 접근 가능 (`/rss.xml`)
- [ ] Sitemap 접근 가능 (`/sitemap.xml`)
- [ ] 검색 기능 작동하는지
- [ ] 다크모드 전환 작동하는지
- [ ] 모바일 반응형 디자인 확인

---

## 참고사항

### 디버깅 팁

1. **이미지가 안 보일 때**:
   - `scripts/copy-images.js` 실행 확인
   - `public/images/` 폴더에 파일 존재 확인
   - 마크다운의 이미지 경로 확인

2. **빌드 실패 시**:
   - `npm run copy-images` 수동 실행
   - TypeScript 에러 확인
   - Next.js 버전 호환성 확인

3. **검색이 안 될 때**:
   - `public/search-index.json` 생성 확인
   - 브라우저 콘솔에서 네트워크 요청 확인

### 성능 최적화

1. **이미지 최적화**:
   - WebP 포맷으로 변환 고려
   - 이미지 크기 리사이징

2. **검색 인덱스 최적화**:
   - 전체 content 대신 excerpt만 포함
   - 불필요한 필드 제거

3. **번들 크기 최적화**:
   - `next/dynamic`으로 검색 모달 lazy loading
   - 사용하지 않는 shadcn/ui 컴포넌트 제거
