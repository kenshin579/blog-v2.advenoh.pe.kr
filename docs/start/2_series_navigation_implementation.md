# 시리즈 네비게이션 구현 가이드

## 1. SeriesNavigation 컴포넌트 생성

**파일**: `components/article/series-navigation.tsx`

### Props 인터페이스

```typescript
interface SeriesNavigationProps {
  seriesName: string;
  articles: ManifestArticle[];
  currentSlug: string;
}
```

### 컴포넌트 구조

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { getArticleTitleFromSlug } from '@/lib/articles';

export function SeriesNavigation({
  seriesName,
  articles,
  currentSlug
}: SeriesNavigationProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>📚</span>
          <span>시리즈: {seriesName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {articles.map((article, index) => {
            const isCurrent = article.slug === currentSlug;
            const articleTitle = getArticleTitleFromSlug(article.slug);

            return (
              <li key={article.slug} className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[1.5rem]">
                  {index + 1}.
                </span>
                {isCurrent ? (
                  <span className="font-bold flex-1 flex items-center justify-between">
                    <span>{article.title}</span>
                    <span className="ml-2">←</span>
                  </span>
                ) : (
                  <Link
                    href={`/${articleTitle}`}
                    className="flex-1 hover:text-primary hover:underline"
                  >
                    {article.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
```

### 접근성

현재 아티클에 `aria-current="page"` 추가:

```tsx
{isCurrent ? (
  <span
    className="font-bold flex-1 flex items-center justify-between"
    aria-current="page"
  >
    <span>{article.title}</span>
    <span className="ml-2">←</span>
  </span>
) : (
  // ...
)}
```

## 2. Article Page 수정

**파일**: `app/[slug]/page.tsx`

### 2.1 시리즈 데이터 가져오기

`ArticlePage` 컴포넌트 내에서 데이터 로드 (line 84 이후):

```typescript
// 기존 코드
const manifestArticle = await findArticleByTitle(decodedSlug);
const relatedArticles = manifestArticle ? await getRelatedArticles(manifestArticle.slug, 3) : [];

// 추가: 시리즈 데이터 가져오기 및 날짜순 정렬
let seriesArticles: ManifestArticle[] = [];
if (manifestArticle?.series) {
  const articles = await getArticlesBySeries(manifestArticle.series);
  seriesArticles = articles.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
```

### 2.2 SeriesNavigation 컴포넌트 import

파일 상단에 import 추가:

```typescript
import { SeriesNavigation } from '@/components/article/series-navigation';
```

### 2.3 컴포넌트 삽입

헤더와 Separator 사이 (line 117-119)에 삽입:

```tsx
{/* 기존 헤더 끝 */}
</header>

{/* 시리즈 네비게이션 */}
{manifestArticle?.series && seriesArticles.length > 1 && (
  <SeriesNavigation
    seriesName={manifestArticle.series}
    articles={seriesArticles}
    currentSlug={manifestArticle.slug}
  />
)}

<Separator className="mb-8" />
{/* 기존 본문 시작 */}
```

**조건**: `seriesArticles.length > 1` - 시리즈에 2개 이상 아티클이 있을 때만 표시

## 3. 타입 import

**파일**: `app/[slug]/page.tsx`

`ManifestArticle` 타입이 필요하므로 import 확인:

```typescript
import {
  getArticleByTitle,
  getAllArticles,
  getRelatedArticles,
  getArticleTitleFromSlug,
  getArticlesBySeries  // 추가
} from '@/lib/articles';

// ManifestArticle 타입이 필요한 경우
import type { ManifestArticle } from '@/lib/articles';
```

## 4. Playwright 테스트

구현 완료 후 MCP Playwright로 자동화 테스트를 수행합니다.

### 4.1 시리즈 아티클 테스트

```
1. 브라우저 열기: http://localhost:3000
2. 시리즈가 있는 아티클 페이지로 이동
3. 시리즈 네비게이션 확인:
   - Card 요소 존재 확인
   - "📚 시리즈:" 텍스트 확인
   - ol 태그로 목록 렌더링 확인
   - 현재 아티클에 "←" 표시 확인
   - font-bold 클래스 확인
4. 다른 아티클 링크 클릭 → 페이지 이동 확인
```

### 4.2 시리즈 없는 아티클 테스트

```
1. 시리즈가 없는 아티클 페이지로 이동
2. 시리즈 네비게이션이 렌더링되지 않는지 확인
```

### 4.3 스크린샷 캡처

```
1. 라이트모드 스크린샷
2. 다크모드 전환 후 스크린샷
3. 모바일 뷰포트 (375x667) 스크린샷
```

### 4.4 Playwright 명령 예시

**CSS Selector 참고**:
- 시리즈 네비게이션 Card: `div.mb-8 > div` (Card 컴포넌트)
- 시리즈 제목: `h3` 태그 내 "시리즈:" 텍스트
- 아티클 목록: `ol` 태그
- 현재 아티클 표시: `span.font-bold` 내 "←" 텍스트

## 파일 변경 요약

```
생성:
  components/article/series-navigation.tsx (약 60줄)

수정:
  app/[slug]/page.tsx
    - import 추가 (2줄)
    - 시리즈 데이터 로드 및 날짜순 정렬 (6줄)
    - 컴포넌트 삽입 (7줄)
```
