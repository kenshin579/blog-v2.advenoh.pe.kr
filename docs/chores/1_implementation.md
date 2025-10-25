# Implementation Guide: Feature Section 추가

## 1. 프로젝트 개요

홈페이지 헤더와 article 목록 사이에 Feature Section을 추가하여 검색 및 카테고리 필터링 기능의 발견성을 향상시킵니다.

**관련 문서:** `1_prd.md`

## 2. 컴포넌트 구조

```
client/src/
  pages/
    HomePage.tsx              # Feature Section 통합
  components/
    feature/
      FeatureSection.tsx      # 메인 컨테이너 (NEW)
      SearchBar.tsx           # 검색창 컴포넌트 (NEW)
      CategoryFilter.tsx      # 카테고리 필터 (NEW)
    search/
      SearchModal.tsx         # 기존 검색 모달 (유지)
```

## 3. 컴포넌트 구현 세부사항

### 3.1 FeatureSection.tsx

**목적:** 검색창과 카테고리 필터를 감싸는 컨테이너

**Props:**
```typescript
interface FeatureSectionProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  categories: CategoryInfo[];
}

interface CategoryInfo {
  name: string;
  count: number;
}
```

**주요 기능:**
- 반응형 레이아웃 (모바일: 세로 정렬, 데스크톱: 가로 정렬)
- 배경색으로 시각적 구분 (`bg-muted` 또는 `bg-accent/5`)
- 적절한 여백 (padding/margin)

**스타일링:**
```tsx
<section className="bg-muted/50 border-y border-border py-8 mb-8">
  <div className="container max-w-4xl mx-auto px-4 space-y-6">
    <SearchBar />
    <CategoryFilter
      categories={categories}
      selectedCategory={selectedCategory}
      onCategorySelect={onCategorySelect}
    />
  </div>
</section>
```

### 3.2 SearchBar.tsx

**목적:** 항상 보이는 검색창 (클릭 시 기존 검색 모달 열기)

**Props:**
```typescript
interface SearchBarProps {
  onSearchClick?: () => void;
}
```

**구현 방식:**
```tsx
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar({ onSearchClick }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="기술 블로그 글 검색... (⌘K)"
        className="pl-10 w-full"
        onClick={onSearchClick}
        readOnly
        role="button"
        aria-label="검색 모달 열기"
      />
    </div>
  );
}
```

**기술 요구사항:**
- shadcn/ui Input 컴포넌트 사용
- lucide-react Search 아이콘
- 클릭 시 기존 SearchModal 열기 (기존 `⌘K` 기능과 동일)
- 접근성: `role="button"`, `aria-label` 추가
- 읽기 전용 (`readOnly`) - 실제 입력은 모달에서 처리

**반응형 디자인:**
- 모바일: `w-full`
- 데스크톱: `max-w-2xl mx-auto`

### 3.3 CategoryFilter.tsx

**목적:** 카테고리별 필터링 태그 표시

**Props:**
```typescript
interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

interface CategoryInfo {
  name: string;
  count: number;
}
```

**구현 방식:**
```tsx
import { Badge } from "@/components/ui/badge";

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground mr-2">카테고리:</span>
      <Badge
        variant={selectedCategory === null ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onCategorySelect(null)}
      >
        전체
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category.name}
          variant={selectedCategory === category.name ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onCategorySelect(category.name)}
        >
          {category.name}
          <span className="ml-1.5 text-xs opacity-70">
            {category.count}
          </span>
        </Badge>
      ))}
    </div>
  );
}
```

**기술 요구사항:**
- shadcn/ui Badge 컴포넌트 사용
- 선택된 카테고리: `variant="default"` (primary color)
- 미선택 카테고리: `variant="outline"`
- 각 카테고리 옆에 글 개수 표시
- 수평 스크롤 가능 (`flex-wrap` + `overflow-x-auto`)
- 클릭 시 선택 상태 토글

**반응형 디자인:**
- 모바일: `flex-wrap`으로 자동 줄바꿈
- 데스크톱: 한 줄에 최대한 표시

## 4. 상태 관리

### 4.1 HomePage.tsx 상태 구조

```typescript
import { useState, useMemo } from "react";
import { Article } from "@/lib/articles";

// 카테고리 데이터 집계
const categories = useMemo(() => {
  const tagCounts = new Map<string, number>();

  articles.forEach(article => {
    article.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // 개수 내림차순
}, [articles]);

// 카테고리 선택 상태
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// 필터링된 articles
const filteredArticles = useMemo(() => {
  if (!selectedCategory) return articles;

  return articles.filter(article =>
    article.tags.includes(selectedCategory)
  );
}, [articles, selectedCategory]);
```

### 4.2 검색 모달 통합

```typescript
// 기존 검색 모달 상태 유지
const [isSearchOpen, setIsSearchOpen] = useState(false);

// SearchBar 클릭 핸들러
const handleSearchClick = () => {
  setIsSearchOpen(true);
};

// 기존 ⌘K 단축키 핸들러와 통합
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 5. 페이지 통합

### 5.1 HomePage.tsx 구조

```tsx
export default function HomePage() {
  const { articles, loading, error } = useArticles();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categories = useMemo(/* ... */);
  const filteredArticles = useMemo(/* ... */);

  return (
    <div className="min-h-screen">
      {/* Header - 기존 유지 */}
      <Header />

      {/* Feature Section - NEW */}
      <FeatureSection
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Article List - 필터링된 데이터 사용 */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {selectedCategory && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              필터: {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-primary hover:underline"
            >
              초기화
            </button>
          </div>
        )}

        {filteredArticles.length === 0 && selectedCategory && (
          <p className="text-center text-muted-foreground py-12">
            "{selectedCategory}" 카테고리에 해당하는 글이 없습니다.
          </p>
        )}

        <ArticleList articles={filteredArticles} />
      </main>

      {/* Search Modal - 기존 유지 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
```

## 6. 스타일링 가이드

### 6.1 Feature Section 스타일

```css
/* Tailwind 클래스 조합 */

/* 컨테이너 */
.feature-section {
  @apply bg-muted/50 border-y border-border;
  @apply py-6 md:py-8;
  @apply mb-6 md:mb-8;
}

/* 검색창 */
.search-bar {
  @apply w-full max-w-2xl mx-auto;
  @apply transition-shadow duration-200;
  @apply focus-within:shadow-md;
}

/* 카테고리 필터 */
.category-filter {
  @apply flex flex-wrap gap-2;
  @apply items-center justify-center md:justify-start;
}
```

### 6.2 반응형 브레이크포인트

```typescript
// Tailwind 기본 브레이크포인트 사용
sm: 640px   // 모바일 landscape
md: 768px   // 태블릿
lg: 1024px  // 데스크톱
```

## 7. 성능 최적화

### 7.1 Memoization

```typescript
// 카테고리 목록 - articles 변경 시에만 재계산
const categories = useMemo(() => {
  // 집계 로직
}, [articles]);

// 필터링된 articles - selectedCategory 또는 articles 변경 시에만
const filteredArticles = useMemo(() => {
  // 필터링 로직
}, [articles, selectedCategory]);
```

### 7.2 Lazy Loading

```typescript
// 검색 모달은 기존 lazy loading 유지
const SearchModal = lazy(() => import("@/components/search/SearchModal"));
```

## 8. 접근성 (A11y)

### 8.1 ARIA 속성

```tsx
// SearchBar
<Input
  role="button"
  aria-label="검색 모달 열기"
  aria-haspopup="dialog"
  aria-expanded={isSearchOpen}
/>

// CategoryFilter
<Badge
  role="button"
  aria-label={`${category.name} 카테고리 필터 (${category.count}개 글)`}
  aria-pressed={selectedCategory === category.name}
/>
```

### 8.2 키보드 내비게이션

```typescript
// 검색창: Enter 키로 모달 열기
<Input
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      onSearchClick?.();
    }
  }}
/>

// 카테고리 Badge: Space/Enter 키로 선택
<Badge
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCategorySelect(category.name);
    }
  }}
  tabIndex={0}
/>
```

## 9. 테스트 전략

### 9.1 단위 테스트 (필요 시)

```typescript
// CategoryFilter.test.tsx
describe("CategoryFilter", () => {
  it("전체 버튼 클릭 시 null 전달", () => {
    const onSelect = jest.fn();
    render(<CategoryFilter onCategorySelect={onSelect} />);
    fireEvent.click(screen.getByText("전체"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
```

### 9.2 Playwright E2E 테스트

```typescript
// tests/feature-section.spec.ts
test("카테고리 클릭 시 필터링 동작", async ({ page }) => {
  await page.goto("/");

  // 카테고리 클릭
  await page.click('text="typescript"');

  // 필터링된 결과 확인
  const articles = await page.locator("article").count();
  expect(articles).toBeGreaterThan(0);

  // 초기화 버튼 확인
  await expect(page.locator("text=필터: typescript")).toBeVisible();
});

test("검색창 클릭 시 모달 열림", async ({ page }) => {
  await page.goto("/");

  // 검색창 클릭
  await page.click('input[placeholder*="검색"]');

  // 모달 열림 확인
  await expect(page.locator("role=dialog")).toBeVisible();
});
```

## 10. URL 쿼리 파라미터 연동 (Phase 3)

### 10.1 구현 방식

```typescript
import { useSearchParams } from "wouter";

// 쿼리 파라미터에서 카테고리 읽기
const [searchParams, setSearchParams] = useSearchParams();
const categoryFromUrl = searchParams.get("category");

const [selectedCategory, setSelectedCategory] = useState<string | null>(
  categoryFromUrl
);

// 카테고리 선택 시 URL 업데이트
const handleCategorySelect = (category: string | null) => {
  setSelectedCategory(category);

  if (category) {
    setSearchParams({ category });
  } else {
    setSearchParams({});
  }
};
```

### 10.2 브라우저 히스토리

```typescript
// 뒤로 가기 시 카테고리 상태 동기화
useEffect(() => {
  const handlePopState = () => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get("category"));
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);
```

## 11. 빈 상태 처리

### 11.1 필터링 결과 없음

```tsx
{filteredArticles.length === 0 && selectedCategory && (
  <div className="text-center py-12">
    <p className="text-muted-foreground mb-4">
      "{selectedCategory}" 카테고리에 해당하는 글이 없습니다.
    </p>
    <button
      onClick={() => setSelectedCategory(null)}
      className="text-primary hover:underline"
    >
      전체 글 보기
    </button>
  </div>
)}
```

### 11.2 카테고리 없음

```tsx
{categories.length === 0 && (
  <p className="text-sm text-muted-foreground">
    아직 카테고리가 없습니다.
  </p>
)}
```

## 12. 마이그레이션 체크리스트

- [ ] FeatureSection 컴포넌트 생성
- [ ] SearchBar 컴포넌트 생성
- [ ] CategoryFilter 컴포넌트 생성
- [ ] HomePage에 상태 관리 추가
- [ ] 카테고리 집계 로직 구현
- [ ] 필터링 로직 구현
- [ ] 검색 모달 통합
- [ ] 반응형 스타일링
- [ ] 접근성 검증
- [ ] Playwright 테스트 작성
- [ ] URL 쿼리 파라미터 연동 (선택사항)
- [ ] 빈 상태 UI 구현

## 13. 참고 자료

- **PRD:** `docs/chores/1_prd.md`
- **Design Guidelines:** `design_guidelines.md`
- **shadcn/ui Components:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Wouter (Routing):** https://github.com/molefrog/wouter
