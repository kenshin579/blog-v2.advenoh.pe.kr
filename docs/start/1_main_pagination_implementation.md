# 메인 페이지 Viewport 기반 Pagination 구현

## 기술 스택
- React Hooks: `useState`, `useEffect`
- Window API: `window.innerWidth`, `resize` 이벤트
- Tailwind Breakpoints: `md:768px`, `lg:1024px`
- TypeScript

## 구현 내용

### 1. Custom Hook: `useViewportSize`

**파일:** `hooks/use-viewport-size.ts`

```typescript
"use client";

import { useState, useEffect } from 'react';

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewportSize('mobile');
      } else if (width < 1024) {
        setViewportSize('tablet');
      } else {
        setViewportSize('desktop');
      }
    };

    handleResize(); // 초기 실행
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewportSize;
}
```

**핵심 로직:**
- Tailwind breakpoint 기준 (768px, 1024px)
- 초기 렌더링 시 즉시 viewport 크기 감지
- resize 이벤트로 동적 감지
- cleanup으로 메모리 누수 방지

### 2. 상수 정의

**파일:** `lib/constants.ts` (기존 파일에 추가)

```typescript
// Viewport별 초기 article 표시 개수
export const INITIAL_DISPLAY_COUNT = {
  mobile: 6,   // 1열 × 6행
  tablet: 8,   // 2열 × 4행
  desktop: 12  // 3열 × 4행
} as const;
```

### 3. HomeContent 컴포넌트 수정

**파일:** `components/home-content.tsx`

#### 변경 사항

**Import 추가:**
```typescript
import { useViewportSize } from '@/hooks/use-viewport-size';
import { INITIAL_DISPLAY_COUNT } from '@/lib/constants';
```

**State 초기화 변경:**
```typescript
// Before
const [displayCount, setDisplayCount] = useState(10);

// After
const viewportSize = useViewportSize();
const [displayCount, setDisplayCount] = useState(
  INITIAL_DISPLAY_COUNT[viewportSize]
);
```

**Viewport 변경 감지 추가:**
```typescript
// viewport 크기 변경 시 displayCount 초기화
useEffect(() => {
  setDisplayCount(INITIAL_DISPLAY_COUNT[viewportSize]);
}, [viewportSize]);
```

**"더 보기" 핸들러 수정:**
```typescript
// Before
const handleLoadMore = () => {
  setDisplayCount(prev => prev + 10);
};

// After
const handleLoadMore = () => {
  setDisplayCount(prev => prev + INITIAL_DISPLAY_COUNT[viewportSize]);
};
```

## 전체 수정 코드 (components/home-content.tsx)

```typescript
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useViewportSize } from '@/hooks/use-viewport-size';
import { INITIAL_DISPLAY_COUNT } from '@/lib/constants';
// ... 기타 imports

export function HomeContent({ articles }: HomeContentProps) {
  const viewportSize = useViewportSize();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(
    INITIAL_DISPLAY_COUNT[viewportSize]
  );

  // ... 기존 categories, filteredArticles, displayedArticles 로직

  // viewport 크기 변경 시 displayCount 초기화
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT[viewportSize]);
  }, [viewportSize]);

  // 카테고리 변경 시 pagination 리셋
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT[viewportSize]);
  }, [selectedCategory, viewportSize]);

  // "더 보기" 버튼 핸들러
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + INITIAL_DISPLAY_COUNT[viewportSize]);
  };

  // ... 나머지 JSX는 동일
}
```

## 주요 변경점 요약

| 항목 | Before | After |
|-----|--------|-------|
| 초기 표시 개수 | 고정 10개 | Viewport별 동적 (6/8/12) |
| 증가 개수 | 고정 +10개 | Viewport별 동적 (+6/+8/+12) |
| Viewport 감지 | 없음 | Custom Hook으로 감지 |
| 리사이즈 대응 | 없음 | 자동 재계산 |
