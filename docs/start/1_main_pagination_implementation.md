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

## 자동화 테스트 (MCP Playwright)

구현 완료 후 MCP Playwright를 사용하여 브라우저에서 실제 동작을 검증합니다.

### 테스트 시나리오

#### 1. 모바일 Viewport 테스트 (< 768px)
```bash
# 브라우저 열기 (모바일 크기)
mcp__playwright__playwright_navigate
  url: "http://localhost:3000"
  width: 375
  height: 812
  headless: false

# 초기 article 개수 확인 (6개 예상)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"

# 스크린샷 캡처
mcp__playwright__playwright_screenshot
  name: "mobile-initial-6-articles"
  fullPage: true

# "더 보기" 버튼 클릭
mcp__playwright__playwright_click
  selector: "button:has-text('더 보기')"

# 증가 후 개수 확인 (12개 예상)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"
```

#### 2. 태블릿 Viewport 테스트 (768px ~ 1023px)
```bash
# 브라우저 열기 (태블릿 크기)
mcp__playwright__playwright_navigate
  url: "http://localhost:3000"
  width: 768
  height: 1024
  headless: false

# 초기 article 개수 확인 (8개 예상)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"

# "더 보기" 버튼 클릭 후 확인 (16개 예상)
```

#### 3. 데스크톱 Viewport 테스트 (≥ 1024px)
```bash
# 브라우저 열기 (데스크톱 크기)
mcp__playwright__playwright_navigate
  url: "http://localhost:3000"
  width: 1920
  height: 1080
  headless: false

# 초기 article 개수 확인 (12개 예상)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"

# "더 보기" 버튼 클릭 후 확인 (24개 예상)
```

#### 4. 리사이즈 동작 테스트
```bash
# 데스크톱에서 시작
mcp__playwright__playwright_navigate
  url: "http://localhost:3000"
  width: 1920
  height: 1080

# 초기 개수 확인 (12개)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"

# JavaScript로 viewport 크기 변경 (모바일로)
mcp__playwright__playwright_evaluate
  script: "window.resizeTo(375, 812)"

# 약간 대기 (resize 이벤트 처리)
# 변경 후 개수 확인 (6개로 리셋되어야 함)
```

#### 5. 카테고리 필터링 통합 테스트
```bash
# 브라우저 열기
mcp__playwright__playwright_navigate
  url: "http://localhost:3000"
  width: 1920
  height: 1080

# 카테고리 선택 (예: "Spring")
mcp__playwright__playwright_click
  selector: "button:has-text('Spring')"

# 필터링 후 개수 확인 (12개 또는 더 적을 수 있음)
mcp__playwright__playwright_evaluate
  script: "document.querySelectorAll('.grid > a').length"

# "더 보기" 버튼 동작 확인
```

### 검증 포인트

**자동화로 확인할 항목:**
- [ ] 모바일 초기 로딩: 6개 정확히 표시
- [ ] 태블릿 초기 로딩: 8개 정확히 표시
- [ ] 데스크톱 초기 로딩: 12개 정확히 표시
- [ ] "더 보기" 클릭: viewport별 증가량 정확
- [ ] 리사이즈 시: 자동으로 개수 재계산
- [ ] 카테고리 필터: pagination 리셋 동작
- [ ] 콘솔 에러: 없음 확인

**Playwright 장점:**
- 실제 브라우저에서 실행 (Chrome/Firefox/Safari)
- Viewport 크기 정확한 시뮬레이션
- JavaScript 실행 및 DOM 검증
- 스크린샷으로 시각적 확인 가능
