# Implementation Guide: 메인 페이지 Pagination 기능 추가

## 개요

이 문서는 메인 페이지에 "더 보기" 버튼 기반 pagination 기능을 추가하는 구현 가이드입니다.

**수정 파일**: `components/home-content.tsx` (단일 파일)

## 구현 단계

### Phase 1: Import 추가

**위치**: 파일 상단 (Line 1-10)

```typescript
// 기존 imports
"use client";

import { useState, useMemo, useEffect } from 'react'; // useEffect 추가
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // 새로 추가
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { DEFAULT_ARTICLE_IMAGE } from '@/lib/constants';
import { FeatureSection, CategoryInfo } from './feature';
import { SearchDialog } from './search-dialog';
```

**변경 사항**:
- `useEffect` 추가 (이미 있으면 생략)
- `Button` 컴포넌트 import 추가

---

### Phase 2: State 추가

**위치**: HomeContent 컴포넌트 내부 (Line 35-36 근처)

**Before**:
```typescript
export function HomeContent({ articles }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
```

**After**:
```typescript
export function HomeContent({ articles }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(10); // 추가
```

---

### Phase 3: filteredArticles 계산 로직 유지

**위치**: Line 52-59 (변경 없음)

```typescript
// 필터링된 articles (category 기반)
const filteredArticles = useMemo(() => {
  if (!selectedCategory) return articles;

  return articles.filter(article =>
    article.category === selectedCategory
  );
}, [articles, selectedCategory]);
```

**Note**: 이 로직은 그대로 유지합니다.

---

### Phase 4: displayedArticles 계산 로직 추가

**위치**: filteredArticles 바로 다음 (Line 60 근처)

```typescript
// 표시할 articles (pagination 적용)
const displayedArticles = useMemo(() => {
  return filteredArticles.slice(0, displayCount);
}, [filteredArticles, displayCount]);
```

**설명**:
- `filteredArticles`에서 `displayCount`개만큼 슬라이싱
- `useMemo`로 최적화 (filteredArticles 또는 displayCount 변경 시에만 재계산)

---

### Phase 5: useEffect 추가 (카테고리 변경 시 pagination 리셋)

**위치**: displayedArticles 다음 (Line 65 근처)

```typescript
// 카테고리 변경 시 pagination 리셋
useEffect(() => {
  setDisplayCount(10);
}, [selectedCategory]);
```

**설명**:
- `selectedCategory`가 변경되면 `displayCount`를 10으로 리셋
- 카테고리 필터링 후에도 항상 10개부터 시작

---

### Phase 6: handleLoadMore 함수 추가

**위치**: useEffect 다음 (Line 69 근처)

```typescript
// "더 보기" 버튼 핸들러
const handleLoadMore = () => {
  setDisplayCount(prev => prev + 10);
};
```

**설명**:
- 버튼 클릭 시 displayCount를 10씩 증가
- 함수형 업데이트로 안전하게 상태 변경

---

### Phase 7: 렌더링 부분 수정

**위치**: Line 99-152

**Before**:
```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {filteredArticles.map((article) => (
    <Link
      key={article.slug}
      href={`/${getArticleTitleFromSlug(article.slug)}`}
      className="group"
    >
      {/* ... 카드 내용 ... */}
    </Link>
  ))}
</div>
```

**After**:
```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {displayedArticles.map((article) => (
    <Link
      key={article.slug}
      href={`/${getArticleTitleFromSlug(article.slug)}`}
      className="group"
    >
      {/* ... 카드 내용 ... */}
    </Link>
  ))}
</div>
```

**변경 사항**:
- `filteredArticles.map()` → `displayedArticles.map()`로 변경

---

### Phase 8: "더 보기" 버튼 추가

**위치**: Article 그리드 `</div>` 다음, "아직 게시된 글이 없습니다" 메시지 이전 (Line 153-154 근처)

```typescript
</div>

{/* "더 보기" 버튼 */}
{filteredArticles.length > displayCount && (
  <div className="flex justify-center mt-8">
    <Button
      onClick={handleLoadMore}
      variant="outline"
      size="lg"
    >
      더 보기 ({filteredArticles.length - displayCount}개 남음)
    </Button>
  </div>
)}

{articles.length === 0 && (
  <div className="text-center py-12">
    <p className="text-muted-foreground">아직 게시된 글이 없습니다.</p>
  </div>
)}
```

**설명**:
- `filteredArticles.length > displayCount`: 남은 article이 있을 때만 버튼 표시
- `onClick={handleLoadMore}`: 클릭 시 10개씩 추가 로딩
- `variant="outline"`, `size="lg"`: shadcn/ui 버튼 스타일
- `flex justify-center mt-8`: 중앙 정렬 및 상단 여백

---

## 전체 변경 사항 요약

### 1. Imports
```diff
+ import { useEffect } from 'react'; // 이미 있으면 생략
+ import { Button } from '@/components/ui/button';
```

### 2. State
```diff
+ const [displayCount, setDisplayCount] = useState(10);
```

### 3. Computed Values
```diff
+ const displayedArticles = useMemo(() => {
+   return filteredArticles.slice(0, displayCount);
+ }, [filteredArticles, displayCount]);
```

### 4. Effects
```diff
+ useEffect(() => {
+   setDisplayCount(10);
+ }, [selectedCategory]);
```

### 5. Handlers
```diff
+ const handleLoadMore = () => {
+   setDisplayCount(prev => prev + 10);
+ };
```

### 6. Rendering
```diff
- {filteredArticles.map((article) => (
+ {displayedArticles.map((article) => (
```

```diff
+ {filteredArticles.length > displayCount && (
+   <div className="flex justify-center mt-8">
+     <Button
+       onClick={handleLoadMore}
+       variant="outline"
+       size="lg"
+     >
+       더 보기 ({filteredArticles.length - displayCount}개 남음)
+     </Button>
+   </div>
+ )}
```

---

## 주의사항

### 1. filteredArticles vs displayedArticles
- **filteredArticles**: 카테고리 필터링된 전체 articles
- **displayedArticles**: pagination 적용된 실제 표시 articles
- **버튼 조건**: `filteredArticles.length > displayCount` (전체 개수 기준)
- **렌더링**: `displayedArticles.map()` (표시 개수 제한)

### 2. 카테고리 변경 시 동작
- `selectedCategory` 변경 → `useEffect` 트리거 → `displayCount` 리셋 (10)
- `filteredArticles` 재계산 → `displayedArticles` 재계산
- 결과: 새 카테고리의 첫 10개 표시

### 3. Edge Cases
- **Article 10개 미만**: 버튼 표시 안 됨 (`filteredArticles.length <= displayCount`)
- **Article 정확히 10개**: 버튼 표시 안 됨
- **빠른 클릭**: 함수형 업데이트로 안전하게 처리

### 4. 성능
- `useMemo` 사용으로 불필요한 재계산 방지
- `slice(0, displayCount)`: O(n) 복잡도이지만 클라이언트 사이드에서 충분히 빠름
- 모든 데이터는 이미 메모리에 로드되어 있음 (추가 메모리 사용 없음)

---

## 검증 포인트

### 코드 변경 후 확인사항
1. **Import 확인**: `useEffect`, `Button` import 추가되었는가?
2. **State 확인**: `displayCount` state 추가되었는가?
3. **useMemo 확인**: `displayedArticles` 계산 로직 추가되었는가?
4. **useEffect 확인**: 카테고리 변경 시 리셋 로직 추가되었는가?
5. **Handler 확인**: `handleLoadMore` 함수 추가되었는가?
6. **Rendering 확인**: `displayedArticles.map()` 사용하는가?
7. **Button 확인**: 조건부 렌더링으로 버튼 추가되었는가?

### 타입 체크
```bash
npm run check
```

- TypeScript 에러가 없어야 함
- `displayCount`, `displayedArticles`, `handleLoadMore`에 타입 에러 없어야 함

### 브라우저 확인
```bash
npm run dev
```

1. 초기 로드 시 10개만 표시되는가?
2. "더 보기" 버튼이 표시되는가?
3. 버튼 클릭 시 10개씩 추가되는가?
4. 모든 article 표시 후 버튼이 사라지는가?
5. 카테고리 변경 시 10개로 리셋되는가?

---

## 다음 단계

구현 완료 후:
1. 타입 체크 (`npm run check`)
2. 브라우저 테스트 (dev server)
3. 반응형 테스트 (모바일/태블릿/데스크톱)
4. Edge cases 테스트 (0개, 10개, 10개 미만)
5. 코드 리뷰 및 PR 생성
