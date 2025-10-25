# PRD: 메인 페이지 Pagination 기능 추가

## 1. 목적

메인 페이지에서 모든 article을 한 번에 렌더링하는 대신, pagination 기능을 추가하여 초기 로딩 성능을 개선하고 사용자 경험을 향상시킨다.

## 2. 현재 상황 분석

### 현재 구현
- **파일**: `components/home-content.tsx`
- **동작**: `filteredArticles.map()`으로 모든 article을 한 번에 렌더링 (Line 99-152)
- **문제점**:
  - Article 개수가 많을 경우 초기 로딩 시 모든 카드를 한 번에 렌더링하여 성능 저하 가능
  - 스크롤이 길어져 사용성 저하
  - 초기 화면 렌더링 시간 증가

### 기존 기능
- 카테고리 필터링 (FeatureSection)
- 검색 기능 (SearchDialog)
- Article 카드 그리드 레이아웃 (md:grid-cols-2 lg:grid-cols-3)

## 3. 요구사항

### 3.1 기능 요구사항

#### 초기 로딩
- 페이지 로드 시 **최대 10개의 article**만 표시
- 카테고리 필터링이 적용된 경우에도 10개씩 표시

#### "더 보기" 버튼
- Article 목록 하단에 "더 보기" 버튼 표시
- 버튼 클릭 시 **추가로 10개의 article** 표시
- 모든 article을 표시한 경우 버튼 숨김
- 남은 article 개수를 버튼에 표시 (선택사항)

#### 필터링 통합
- 카테고리 필터 변경 시 pagination 초기화 (다시 10개부터 시작)
- 필터 초기화 시에도 pagination 초기화

#### 자동 스크롤 금지
- 무한 스크롤 방식 **사용하지 않음**
- 사용자가 명시적으로 버튼을 클릭해야만 추가 로딩

### 3.2 UI/UX 요구사항

#### 버튼 디자인
- shadcn/ui Button 컴포넌트 사용
- 가운데 정렬
- 반응형 디자인 (모바일/태블릿/데스크톱)
- Hover 효과 포함

#### 버튼 텍스트
- 기본: "더 보기" 또는 "Load More"
- 선택사항: "더 보기 (N개 남음)" 형식으로 남은 개수 표시

#### 레이아웃
- 기존 그리드 레이아웃 유지 (md:grid-cols-2 lg:grid-cols-3)
- 버튼은 그리드 외부, 하단 중앙에 배치
- 적절한 여백 (margin/padding) 적용

## 4. 기술 스펙

### 4.1 상태 관리

```typescript
// components/home-content.tsx에 추가할 state
const [displayCount, setDisplayCount] = useState(10);
```

### 4.2 표시할 Article 계산

```typescript
const displayedArticles = useMemo(() => {
  return filteredArticles.slice(0, displayCount);
}, [filteredArticles, displayCount]);
```

### 4.3 "더 보기" 버튼 핸들러

```typescript
const handleLoadMore = () => {
  setDisplayCount(prev => prev + 10);
};
```

### 4.4 카테고리 필터 변경 시 Pagination 리셋

```typescript
// selectedCategory 변경 시 displayCount를 10으로 리셋
useEffect(() => {
  setDisplayCount(10);
}, [selectedCategory]);
```

### 4.5 버튼 표시 조건

```typescript
const hasMore = displayCount < filteredArticles.length;
```

## 5. 구현 파일

### 수정 대상
- `components/home-content.tsx`
  - `displayCount` state 추가
  - `displayedArticles` 계산 로직 추가
  - `handleLoadMore` 함수 추가
  - `useEffect`로 카테고리 변경 시 pagination 리셋
  - "더 보기" 버튼 UI 추가

### 필요한 Import
```typescript
import { useEffect } from 'react'; // 이미 있으면 생략
import { Button } from '@/components/ui/button';
```

## 6. 구현 상세

### 6.1 코드 변경 위치

#### State 추가 (Line 35 근처)
```typescript
const [displayCount, setDisplayCount] = useState(10);
```

#### useEffect 추가 (Line 59 근처)
```typescript
// 카테고리 변경 시 pagination 리셋
useEffect(() => {
  setDisplayCount(10);
}, [selectedCategory]);
```

#### displayedArticles 계산 (Line 52-59 대체)
```typescript
const displayedArticles = useMemo(() => {
  return filteredArticles.slice(0, displayCount);
}, [filteredArticles, displayCount]);
```

#### 렌더링 부분 수정 (Line 99-152)
- `filteredArticles.map()` → `displayedArticles.map()`로 변경

#### "더 보기" 버튼 추가 (Line 153 근처, `</div>` 다음)
```typescript
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
```

## 7. 테스트 시나리오

### 7.1 초기 로딩
- [ ] 페이지 로드 시 최대 10개의 article만 표시되는가?
- [ ] Article이 10개 미만인 경우 "더 보기" 버튼이 표시되지 않는가?

### 7.2 "더 보기" 버튼 동작
- [ ] 버튼 클릭 시 10개씩 추가로 표시되는가?
- [ ] 모든 article을 표시한 후 버튼이 사라지는가?
- [ ] 남은 개수가 정확하게 표시되는가?

### 7.3 카테고리 필터 통합
- [ ] 카테고리 선택 시 pagination이 초기화되는가? (10개로 리셋)
- [ ] 필터 초기화 시 pagination이 초기화되는가?
- [ ] 필터링된 article이 10개 미만인 경우 버튼이 표시되지 않는가?

### 7.4 UI/UX
- [ ] 버튼이 중앙에 정렬되는가?
- [ ] 모바일/태블릿/데스크톱에서 정상 동작하는가?
- [ ] Hover 효과가 적용되는가?
- [ ] 적절한 여백이 적용되어 있는가?

### 7.5 Edge Cases
- [ ] Article이 정확히 10개인 경우 버튼이 표시되지 않는가?
- [ ] Article이 0개인 경우 에러가 발생하지 않는가?
- [ ] 빠르게 여러 번 클릭 시 정상 동작하는가?

## 8. 성능 고려사항

### 8.1 렌더링 최적화
- `useMemo`를 사용하여 불필요한 재계산 방지
- `displayedArticles` 슬라이싱은 O(n) 복잡도이지만 클라이언트 사이드에서 충분히 빠름

### 8.2 메모리 사용
- 모든 article 데이터는 이미 메모리에 로드되어 있음 (props로 전달)
- Pagination은 렌더링만 제한하므로 추가 메모리 사용 없음

## 9. 향후 개선 사항 (선택)

### 9.1 URL 기반 Pagination
- 쿼리 파라미터로 페이지 번호 관리 (`?page=2`)
- 브라우저 뒤로가기 지원

### 9.2 로딩 애니메이션
- 버튼 클릭 시 스켈레톤 UI 또는 스피너 표시

### 9.3 사용자 설정
- 페이지당 표시 개수 설정 (10/20/30)
- LocalStorage에 저장

## 10. 완료 조건

- [ ] `components/home-content.tsx` 수정 완료
- [ ] 모든 테스트 시나리오 통과
- [ ] 타입 에러 없음 (`npm run check` 통과)
- [ ] 반응형 디자인 확인
- [ ] 코드 리뷰 완료
