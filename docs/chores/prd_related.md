# PRD: Article 페이지 관련 글 섹션 UI 개선

## 개요

Article 페이지 하단의 "관련 글" 섹션을 메인 페이지의 카드 형식과 동일하게 변경하여 UI 일관성을 개선합니다.

## 현재 상태 분석

### 현재 관련 글 카드 (app/[slug]/page.tsx:155-171)

```tsx
<Card className="h-full hover:shadow-lg transition-shadow">
  <CardHeader>
    <Badge variant="secondary" className="w-fit mb-2">
      {related.category}
    </Badge>
    <CardTitle className="text-base line-clamp-2">
      {related.title}
    </CardTitle>
  </CardHeader>
</Card>
```

**특징:**
- ❌ 이미지 없음
- ❌ 날짜 표시 없음
- ❌ excerpt (발췌문) 없음
- ❌ 태그 목록 없음
- ✅ 카테고리 뱃지 있음
- ✅ 제목 표시 (line-clamp-2)

### 메인 페이지 카드 (components/home-content.tsx:117-169)

```tsx
<Card className="h-full transition-all hover:shadow-lg hover-elevate">
  <div className="aspect-video overflow-hidden rounded-t-lg">
    <img src={...} alt={...} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
  </div>
  <CardHeader>
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="secondary">{article.category}</Badge>
      <span className="text-sm text-muted-foreground">{formatDate(article.date)}</span>
    </div>
    <CardTitle className="line-clamp-2 group-hover:text-primary">{article.title}</CardTitle>
    <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {article.tags.slice(0, 3).map((tag) => (...))}
    </div>
  </CardContent>
</Card>
```

**특징:**
- ✅ 이미지 (aspect-video, hover 확대 효과)
- ✅ 날짜 표시 (formatDate)
- ✅ excerpt 표시 (line-clamp-3)
- ✅ 태그 목록 (최대 3개 + 나머지 개수)
- ✅ 카테고리 뱃지
- ✅ 제목 hover 색상 변경

## 목표

관련 글 카드를 메인 페이지와 동일한 형식으로 변경하여 다음을 달성:

1. **시각적 일관성**: 사이트 전체에서 동일한 카드 디자인 사용
2. **정보 밀도**: 이미지, 날짜, excerpt, 태그로 더 많은 정보 제공
3. **사용자 경험**: 관련 글에 대한 더 나은 컨텍스트 제공

## 필요한 작업

### 1. 데이터 구조 확인

**현재 `relatedArticles` 데이터 구조:**
```typescript
// lib/articles.ts의 getRelatedArticles() 반환 타입 확인 필요
interface RelatedArticle {
  slug: string;
  category: string;
  title: string;
  date?: string;        // ← 확인 필요
  excerpt?: string;     // ← 확인 필요
  tags?: string[];      // ← 확인 필요
  firstImage?: string;  // ← 확인 필요
}
```

**작업:**
- [ ] `lib/articles.ts`에서 `getRelatedArticles()` 함수 확인
- [ ] 필요한 필드가 포함되어 있는지 검증
- [ ] 없으면 추가 필요 (manifest.json 또는 frontmatter에서 로드)

### 2. Article 페이지 컴포넌트 수정

**파일:** `app/[slug]/page.tsx`

**변경 사항:**

#### A. Import 추가
```typescript
import { CardContent, CardDescription } from '@/components/ui/card';
import { DEFAULT_ARTICLE_IMAGE } from '@/lib/constants';
```

#### B. 관련 글 섹션 리팩토링 (155-171줄)

**변경 전:**
```tsx
<Card className="h-full hover:shadow-lg transition-shadow">
  <CardHeader>
    <Badge variant="secondary" className="w-fit mb-2">
      {related.category}
    </Badge>
    <CardTitle className="text-base line-clamp-2">
      {related.title}
    </CardTitle>
  </CardHeader>
</Card>
```

**변경 후:**
```tsx
<Link key={related.slug} href={`/${getArticleTitleFromSlug(related.slug)}`} className="group">
  <Card className="h-full transition-all hover:shadow-lg hover-elevate">
    {/* 이미지 섹션 */}
    <div className="aspect-video overflow-hidden rounded-t-lg">
      <img
        src={
          related.firstImage
            ? `/images/${related.slug}/${related.firstImage}`
            : DEFAULT_ARTICLE_IMAGE
        }
        alt={related.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
    </div>

    {/* 헤더 섹션 */}
    <CardHeader>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary">{related.category}</Badge>
        <span className="text-sm text-muted-foreground">
          {formatDate(related.date)}
        </span>
      </div>
      <CardTitle className="line-clamp-2 group-hover:text-primary">
        {related.title}
      </CardTitle>
      {related.excerpt && (
        <CardDescription className="line-clamp-3">
          {related.excerpt}
        </CardDescription>
      )}
    </CardHeader>

    {/* 태그 섹션 */}
    {related.tags && related.tags.length > 0 && (
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {related.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {related.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{related.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    )}
  </Card>
</Link>
```

#### C. Link 구조 변경
```tsx
// 변경 전: Link가 Card를 감싸는 구조
<Link key={related.slug} href={`/${getArticleTitleFromSlug(related.slug)}`}>
  <Card>...</Card>
</Link>

// 변경 후: Link에 className="group" 추가하여 hover 효과 전파
<Link key={related.slug} href={`/${getArticleTitleFromSlug(related.slug)}`} className="group">
  <Card>...</Card>
</Link>
```

### 3. 스타일 추가 확인

**CSS 클래스 검증:**
- [ ] `hover-elevate` 클래스가 globals.css에 정의되어 있는지 확인
- [ ] 없으면 추가:
  ```css
  .hover-elevate {
    transition: transform 0.2s ease-in-out;
  }
  .hover-elevate:hover {
    transform: translateY(-4px);
  }
  ```

### 4. 상수 파일 확인

**파일:** `lib/constants.ts`

```typescript
// DEFAULT_ARTICLE_IMAGE 상수가 정의되어 있는지 확인
export const DEFAULT_ARTICLE_IMAGE = '/images/default-article.jpg';
```

- [ ] 상수 파일 존재 여부 확인
- [ ] 기본 이미지 경로 검증
- [ ] 이미지 파일 존재 여부 확인

## 구현 체크리스트

### Phase 1: 데이터 준비
- [ ] `lib/articles.ts`의 `getRelatedArticles()` 함수 분석
- [ ] 필요한 필드 (date, excerpt, tags, firstImage) 포함 여부 확인
- [ ] 누락된 필드가 있으면 추가 구현

### Phase 2: UI 컴포넌트 수정
- [ ] `app/[slug]/page.tsx`에 필요한 import 추가
- [ ] 관련 글 카드 마크업을 메인 페이지 형식으로 변경
- [ ] Link의 `className="group"` 추가

### Phase 3: 스타일 검증
- [ ] `hover-elevate` CSS 클래스 존재 확인
- [ ] 기본 이미지 상수 및 파일 확인
- [ ] 반응형 레이아웃 테스트 (md:grid-cols-3)

### Phase 4: 테스트
- [ ] 로컬 환경에서 visual regression 확인
- [ ] 관련 글이 있는 article 페이지 테스트
- [ ] 관련 글이 없는 article 페이지 테스트
- [ ] 모바일/태블릿/데스크톱 반응형 확인
- [ ] 이미지 로딩 및 fallback 동작 확인
- [ ] Hover 효과 (카드 elevation, 이미지 확대, 제목 색상) 확인

## 예상 결과

### Before
- 간단한 카드 (카테고리 + 제목만)
- 시각적으로 단조로움
- 정보 부족

### After
- 메인 페이지와 동일한 풍부한 카드
- 이미지 + 카테고리 + 날짜 + 제목 + excerpt + 태그
- 일관된 사용자 경험
- 더 나은 컨텍스트 제공

## 참고 파일

- `app/[slug]/page.tsx` (수정 대상)
- `components/home-content.tsx` (참고 형식)
- `lib/articles.ts` (데이터 소스)
- `lib/constants.ts` (상수 정의)
- `app/globals.css` (스타일 정의)

## 우선순위

🔴 High Priority:
- 데이터 구조 확인 및 필드 추가
- UI 컴포넌트 변경

🟡 Medium Priority:
- 스타일 검증 및 추가
- 반응형 테스트

🟢 Low Priority:
- 애니메이션 미세 조정
- 접근성 개선 (aria-label 등)
