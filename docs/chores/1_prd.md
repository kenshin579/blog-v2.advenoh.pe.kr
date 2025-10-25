# PRD: 홈페이지 Feature 영역 추가

## 1. 문제 정의

### 현재 상황
- 헤더("Advenoh IT Blog" + 부제목) 바로 아래 article 목록이 표시됨
- 헤더와 콘텐츠 사이의 전환이 너무 직접적이어서 시각적으로 어색함
- 검색 기능은 존재하지만 모달 형태로만 접근 가능 (⌘K)
- 카테고리/태그 필터링 기능 부재

### 사용자 불편사항
- 원하는 주제의 글을 찾기 위해 스크롤해야 함
- 특정 카테고리의 글만 보고 싶어도 방법이 없음
- 검색 기능이 숨겨져 있어 발견성이 낮음

## 2. 목표

### 비즈니스 목표
- 콘텐츠 발견성(discoverability) 향상
- 사용자 체류 시간 증가
- 특정 주제에 관심 있는 사용자의 탐색 경험 개선

### 사용자 경험 목표
- 시각적으로 자연스러운 페이지 흐름 제공
- 검색/필터링 기능을 쉽게 발견하고 사용할 수 있도록 개선
- 카테고리별 콘텐츠 탐색 가능

## 3. 제안 솔루션

### 페이지 구조 재설계

```
┌─────────────────────────────────────┐
│ Header                              │
│ - Logo/Title                        │
│ - Navigation (시리즈, 검색 버튼 등) │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Feature Section (NEW)               │
│ ┌─────────────────────────────────┐ │
│ │ Search Bar                      │ │
│ │ (inline, always visible)        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Category Filter Tags            │ │
│ │ [All] [Java] [Python] [Docker]  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Article List                        │
│ (filtered by selected category)    │
└─────────────────────────────────────┘
```

### 핵심 기능

#### 3.1 Feature Section 추가
- 헤더와 article 목록 사이에 새로운 섹션 추가
- 배경색/여백으로 시각적 구분
- 반응형 디자인 (모바일: 세로 정렬, 데스크톱: 가로 정렬)

#### 3.2 Inline Search Bar
**현재 상태:**
- 검색 모달 (⌘K 단축키로만 접근)
- MiniSearch 라이브러리 사용
- lazy loading으로 최적화

**개선 방향:**
- Feature Section에 항상 보이는 검색창 추가
- 검색창 클릭 시 기존 검색 모달 열기 (기존 기능 유지)
- 또는 inline 검색 결과 표시 (드롭다운 형태)
- Placeholder: "기술 블로그 글 검색... (⌘K)"

**기술 구현:**
- 검색창 컴포넌트: shadcn/ui Input + Search icon
- 클릭 이벤트: 기존 SearchModal 열기 또는 inline 결과 표시
- 접근성: ARIA labels, keyboard navigation

#### 3.3 Category Filter
**기능 요구사항:**
- 모든 article의 tags를 집계하여 카테고리 목록 생성
- 클릭 가능한 pill/badge 형태로 표시
- 선택된 카테고리의 글만 필터링하여 표시
- "전체" 버튼으로 필터 초기화

**UI/UX 요구사항:**
- Badge 컴포넌트 사용 (shadcn/ui)
- 선택된 카테고리는 다른 스타일로 강조 (primary color)
- 수평 스크롤 가능 (많은 카테고리 대응)
- 각 카테고리 옆에 글 개수 표시 (선택사항)

**데이터 구조:**
```typescript
// 예시
categories: Array<{
  name: string;        // "java", "docker", "kubernetes"
  count: number;       // 해당 태그를 가진 글 개수
  selected: boolean;   // 현재 선택 여부
}>
```

**필터링 로직:**
- 카테고리 선택 시 해당 tag를 포함한 articles만 표시
- 다중 선택 지원 여부: Phase 1에서는 단일 선택, Phase 2에서 다중 선택 고려
- URL 쿼리 파라미터 연동 고려 (`?category=java`)

## 4. 기술 요구사항

### 4.1 컴포넌트 구조
```
<HomePage>
  <Header />
  <FeatureSection>        // NEW
    <SearchBar />         // NEW
    <CategoryFilter />    // NEW
  </FeatureSection>
  <ArticleList
    articles={filteredArticles}
  />
</HomePage>
```

### 4.2 상태 관리
```typescript
// HomePage 또는 전역 상태
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState<string>("");

// 파생 상태
const filteredArticles = useMemo(() => {
  let result = allArticles;

  // 카테고리 필터
  if (selectedCategory) {
    result = result.filter(article =>
      article.tags.includes(selectedCategory)
    );
  }

  // 검색 필터 (선택사항)
  if (searchQuery) {
    // MiniSearch 활용
  }

  return result;
}, [allArticles, selectedCategory, searchQuery]);
```

### 4.3 디자인 시스템
- **Spacing**: Feature Section과 주변 요소 간 적절한 여백
- **Color**:
  - Feature Section 배경: `bg-muted` 또는 `bg-accent/5`
  - 선택된 카테고리: `bg-primary text-primary-foreground`
- **Typography**: 검색창 placeholder는 `text-muted-foreground`
- **Responsive**:
  - Mobile: 검색창 전체 너비, 카테고리 수평 스크롤
  - Desktop: 검색창 중앙 정렬 (max-width), 카테고리 wrap

### 4.4 성능 고려사항
- 카테고리 목록은 articles 로드 시 한 번만 계산 (memoization)
- 필터링은 클라이언트 사이드에서 처리 (현재 데이터 규모 작음)
- Lazy loading은 기존 검색 모달 방식 유지

## 5. 구현 단계

### Phase 1: 기본 구조 및 UI
- [ ] FeatureSection 컴포넌트 생성
- [ ] SearchBar 컴포넌트 생성 (클릭 시 기존 모달 열기)
- [ ] CategoryFilter 컴포넌트 생성
- [ ] HomePage에 통합 및 스타일링

### Phase 2: 필터링 로직
- [ ] 카테고리 데이터 집계 로직 구현
- [ ] 필터링 상태 관리
- [ ] ArticleList에 필터링된 데이터 전달
- [ ] 빈 상태(empty state) 처리

### Phase 3: 고급 기능
- [ ] URL 쿼리 파라미터 연동 (`?category=java`)
- [ ] 다중 카테고리 선택 지원 (선택사항)
- [ ] Inline 검색 결과 표시 (드롭다운)
- [ ] 카테고리별 글 개수 표시
- [ ] 애니메이션 효과 (필터링 전환 시)

### Phase 4: 테스트 및 최적화
- [ ] Playwright 테스트: 카테고리 클릭 → 필터링 동작 확인
- [ ] Playwright 테스트: 검색창 클릭 → 모달 열림 확인
- [ ] 접근성 검증 (키보드 navigation, screen reader)
- [ ] 반응형 디자인 테스트 (mobile, tablet, desktop)
- [ ] 성능 측정 (필터링 속도, 렌더링 성능)

## 6. 성공 지표

### 정량적 지표
- Feature Section 구현 완료 및 배포
- 카테고리 필터링 동작 정확도 100%
- 모바일/데스크톱 반응형 지원 100%
- 접근성 검증 통과 (WCAG AA)

### 정성적 지표
- 시각적 페이지 흐름 자연스러움
- 검색/필터 기능 발견성 향상
- 사용자 경험 개선

## 7. 제외 사항

### 현재 범위 밖
- 서버 사이드 필터링 (현재 클라이언트 사이드로 충분)
- 고급 검색 필터 (날짜 범위, 정렬 옵션 등)
- 카테고리 계층 구조 (현재 flat tags 구조)
- 개인화된 추천 시스템

## 8. 참고 디자인

### 벤치마크 사이트
- Medium.com: 상단 검색바 + 토픽 태그
- Dev.to: 검색 + 태그 클라우드
- Hashnode: Feature hero section with search

### 디자인 가이드라인
- `design_guidelines.md` 참조: Medium/Dev.to 스타일 개발자 중심 디자인
- 콘텐츠 가독성 최우선
- 깔끔하고 미니멀한 UI

## 9. 위험 요소 및 대응

### 기술적 위험
- **카테고리 수 증가**: 수평 스크롤 또는 "더보기" 버튼으로 대응
- **성능 저하 (많은 articles)**: 현재 규모 작음, 향후 pagination 고려
- **검색 모달과 inline 검색 충돌**: Phase 1에서는 검색창 클릭 → 모달 열기로 단순화

### UX 위험
- **Feature Section이 너무 커서 article 목록 밀림**: 적절한 높이 제한, 간결한 UI
- **모바일에서 공간 부족**: 수직 정렬 및 컴팩트한 디자인
