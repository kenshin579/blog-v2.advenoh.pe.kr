# 검색 기능 개선 구현 가이드

## 1. 개요

메인 페이지의 검색 UX를 Popup 방식에서 Inline 검색 방식으로 개선합니다.

**구현 목표**
- 메인 페이지: 검색란 클릭 → 바로 입력 → 아래에 결과 표시
- 헤더: 기존 팝업 방식 유지

## 2. 컴포넌트 구조

### 2.1 새로운 파일

```
hooks/
  └── use-search.ts           # 공통 검색 로직

components/feature/
  └── inline-search-bar.tsx   # Inline 검색 컴포넌트
```

### 2.2 수정할 파일

```
components/feature/
  └── feature-section.tsx     # InlineSearchBar 사용하도록 변경
```

## 3. 핵심 구현 사항

### 3.1 공통 검색 Hook (use-search.ts)

**목적**: SearchDialog와 InlineSearchBar에서 검색 로직 재사용

**주요 기능**
- MiniSearch 인스턴스 초기화 및 관리
- 검색 인덱스 로딩 (`/search-index.json`)
- 검색 실행 및 결과 반환
- 로딩 상태 관리

**구현 예시**
```typescript
import { useState, useEffect, useCallback } from 'react';
import MiniSearch from 'minisearch';

interface SearchDocument {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
}

export function useSearch() {
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null);
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 인덱스 로딩
  const loadSearchIndex = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/search-index.json');
      const documents: SearchDocument[] = await response.json();

      const search = new MiniSearch<SearchDocument>({
        fields: ['title', 'excerpt', 'content', 'tags'],
        storeFields: ['slug', 'title', 'excerpt', 'category', 'tags', 'date'],
        searchOptions: {
          boost: { title: 2, excerpt: 1.5, tags: 1.2 },
          fuzzy: 0.2,
          prefix: true,
        },
      });

      search.addAll(documents);
      setMiniSearch(search);
    } catch (error) {
      console.error('Failed to load search index:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색 실행
  const search = useCallback((query: string) => {
    if (!miniSearch || !query.trim()) {
      setResults([]);
      return;
    }

    try {
      const searchResults = miniSearch.search(query);
      setResults(searchResults.slice(0, 10) as unknown as SearchDocument[]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [miniSearch]);

  // 검색 결과 초기화
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    search,
    results,
    isLoading,
    loadSearchIndex,
    clearResults,
  };
}
```

### 3.2 Inline 검색 컴포넌트 (inline-search-bar.tsx)

**목적**: 메인 페이지용 Inline 검색 인터페이스

**주요 기능**
- 검색 Input (debounce 300ms)
- Popover로 결과 Dropdown 표시
- 검색 결과 렌더링 (카테고리, 제목, excerpt, 태그)
- 결과 클릭 시 페이지 이동
- 외부 클릭/ESC 키로 Dropdown 닫기

**구현 예시**
```typescript
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, FileText } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';

export function InlineSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { search, results, isLoading, loadSearchIndex, clearResults } = useSearch();

  // 검색 인덱스 로딩 (포커스 시)
  useEffect(() => {
    if (open) {
      loadSearchIndex();
    }
  }, [open, loadSearchIndex]);

  // Debounced 검색
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      search(value);
    },
    300
  );

  // Input 변경 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // 결과 선택 핸들러
  const handleSelect = useCallback((slug: string) => {
    const parts = slug.split('/');
    const title = parts[parts.length - 1];
    router.push(`/${title}`);
    setOpen(false);
    setQuery('');
    clearResults();
  }, [router, clearResults]);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="기술 블로그 글 검색..."
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            className="pl-10 w-full transition-shadow duration-200 focus-visible:shadow-md"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[500px] overflow-hidden"
        align="start"
      >
        <div className="overflow-y-auto max-h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색 인덱스 로딩 중...
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => handleSelect(result.slug)}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1 text-sm">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색어를 입력하여 글을 찾아보세요
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.3 FeatureSection 수정

**변경 사항**: `SearchBar` → `InlineSearchBar`로 교체

```typescript
"use client";

import { InlineSearchBar } from "./inline-search-bar";
import { CategoryFilter, CategoryInfo } from "./category-filter";

interface FeatureSectionProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  categories: CategoryInfo[];
}

export function FeatureSection({
  categories,
  selectedCategory,
  onCategorySelect,
}: FeatureSectionProps) {
  return (
    <section className="bg-muted/50 border-y border-border py-8 md:py-10 mb-6 md:mb-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        <p className="text-center text-base md:text-lg text-muted-foreground">
          개발, 클라우드, 데이터베이스 관련 기술 블로그
        </p>
        <InlineSearchBar />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        />
      </div>
    </section>
  );
}
```

## 4. 필수 의존성

### 4.1 추가 패키지 설치

```bash
npm install use-debounce
```

### 4.2 기존 패키지 (확인)

- `minisearch` - 이미 설치됨
- `@radix-ui/react-popover` - shadcn/ui Popover 사용

## 5. 반응형 디자인

### 5.1 데스크톱 (≥768px)

- 검색란 너비: `max-w-2xl`
- Dropdown: 검색란과 동일한 너비 (Popover의 `--radix-popover-trigger-width` 사용)
- 최대 높이: 500px

### 5.2 모바일 (<768px)

- 검색란 너비: `w-full` (컨테이너 내)
- Dropdown: 화면 너비에 맞게 조정
- 최대 높이: 500px (스크롤 가능)

## 6. 다크모드 대응

모든 스타일은 Tailwind CSS의 다크모드 클래스 사용:
- `bg-background`
- `text-foreground`
- `text-muted-foreground`
- `border-border`
- `hover:bg-muted`

## 7. 접근성 (a11y)

### 7.1 키보드 지원

- **Tab**: 검색란 포커스
- **ESC**: Dropdown 닫기
- **포커스 관리**: Popover가 자동으로 처리

### 7.2 ARIA 속성

Popover 컴포넌트가 자동으로 제공:
- `aria-expanded`
- `aria-haspopup`
- `role="dialog"`

## 8. 테스트 (MCP Playwright 사용)

### 8.1 개발 서버 실행

```bash
npm run dev
```

### 8.2 MCP Playwright 도구 사용

**1) 브라우저 열기 및 페이지 접속**
```
mcp__playwright__playwright_navigate
- url: http://localhost:3000
- headless: false
- width: 1280
- height: 720
```

**2) 검색란 포커스 테스트**
```
mcp__playwright__playwright_click
- selector: input[placeholder*="검색"]
```
- 포커스 상태 확인
- Dropdown 표시 확인

**3) 검색어 입력 및 결과 확인**
```
mcp__playwright__playwright_fill
- selector: input[placeholder*="검색"]
- value: React
```
- Debounce 대기 (300ms)
- 검색 결과 렌더링 확인

**4) 스크린샷 캡처**
```
mcp__playwright__playwright_screenshot
- name: search_dropdown_results
- fullPage: false
```

**5) 검색 결과 클릭**
```
mcp__playwright__playwright_click
- selector: [role="dialog"] button:first-child
```
- 페이지 이동 확인

**6) ESC 키 테스트**
```
mcp__playwright__playwright_press_key
- key: Escape
```
- Dropdown 닫힘 확인

**7) 반응형 테스트 - 모바일**
```
mcp__playwright__playwright_navigate
- url: http://localhost:3000
- width: 375
- height: 667
```
- 검색란 너비 확인
- Dropdown 화면 대응 확인

**8) 브라우저 호환성 테스트**
```
# Firefox 테스트
mcp__playwright__playwright_navigate
- browserType: firefox
- url: http://localhost:3000

# WebKit (Safari) 테스트
mcp__playwright__playwright_navigate
- browserType: webkit
- url: http://localhost:3000
```

### 8.3 수동 테스트 체크리스트

**기능 테스트**
- [ ] 검색란 포커스 시 Dropdown 표시
- [ ] 300ms debounce 동작 확인
- [ ] 검색 결과 정확성
- [ ] 결과 클릭 시 페이지 이동
- [ ] 외부 클릭 시 Dropdown 닫힘
- [ ] ESC 키로 Dropdown 닫기

**반응형 테스트**
- [ ] 데스크톱: 레이아웃 및 Dropdown 위치
- [ ] 모바일: 화면 너비 대응
- [ ] 다크모드: 모든 요소 색상 확인

## 9. 성능 고려사항

### 9.1 검색 인덱스 로딩

- **시점**: 검색란 포커스 시 (Lazy Loading)
- **캐싱**: useSearch Hook 내부에서 관리
- **로딩 상태**: `isLoading`으로 표시

### 9.2 Debouncing

- **지연 시간**: 300ms
- **라이브러리**: `use-debounce`
- **목적**: 불필요한 검색 실행 방지

### 9.3 검색 결과 제한

- **최대 개수**: 10개
- **목적**: 렌더링 성능 및 UI 가독성

## 10. 헤더 검색 유지

**중요**: 헤더의 SearchDialog는 기존 그대로 유지

**이유**
- 글로벌 검색 기능 (모든 페이지에서 접근)
- ⌘K 단축키 지원
- 전체 화면 모달 방식이 집중 검색에 유리

**변경 사항 없음**
- `components/site-header.tsx`
- `components/search-dialog.tsx`

## 11. 구현 순서

1. `hooks/use-search.ts` 생성
2. `components/feature/inline-search-bar.tsx` 생성
3. `components/feature/feature-section.tsx` 수정
4. `use-debounce` 패키지 설치
5. 기능 테스트 (MCP Playwright)
6. 반응형 및 다크모드 확인
7. 접근성 테스트

## 12. 주의사항

### 12.1 검색 인덱스 파일

- **파일 위치**: `public/search-index.json`
- **확인 필요**: 파일이 존재하는지 확인
- **없을 경우**: 빌드 스크립트에서 생성하는지 확인

### 12.2 Popover 너비 조정

- `--radix-popover-trigger-width` CSS 변수 사용
- Dropdown이 검색란과 동일한 너비 유지

### 12.3 z-index 관리

- Popover의 기본 z-index 사용
- 다른 요소와 충돌 시 조정 필요
