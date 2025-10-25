# TODO: Feature Section 구현

## Phase 1: 기본 구조 및 UI ✅ 완료

### 1.1 컴포넌트 파일 생성 ✅
- [x] `components/feature/` 디렉토리 생성
- [x] `components/feature/FeatureSection.tsx` 파일 생성
- [x] `components/feature/SearchBar.tsx` 파일 생성
- [x] `components/feature/CategoryFilter.tsx` 파일 생성
- [x] `components/feature/index.ts` export 파일 생성

### 1.2 SearchBar 컴포넌트 구현 ✅
- [x] shadcn/ui Input 컴포넌트 임포트
- [x] lucide-react Search 아이콘 추가
- [x] Props 인터페이스 정의 (`SearchBarProps`)
- [x] 클릭 핸들러 구현 (검색 모달 열기)
- [x] Placeholder 텍스트 추가 ("기술 블로그 글 검색... (⌘K)")
- [x] 접근성 속성 추가 (`role="button"`, `aria-label`)
- [x] 반응형 스타일링 (모바일/데스크톱)
- [x] 읽기 전용 상태 설정 (`readOnly`)

### 1.3 CategoryFilter 컴포넌트 구현 ✅
- [x] shadcn/ui Badge 컴포넌트 임포트
- [x] Props 인터페이스 정의 (`CategoryFilterProps`, `CategoryInfo`)
- [x] "전체" 버튼 구현 (필터 초기화)
- [x] 카테고리 목록 렌더링 (map)
- [x] 선택 상태에 따른 variant 변경 (`default` vs `outline`)
- [x] 각 카테고리 옆 글 개수 표시
- [x] 클릭 핸들러 구현 (`onCategorySelect`)
- [x] 수평 스크롤 가능하도록 스타일링 (`flex-wrap`)
- [x] 반응형 디자인 (모바일: 자동 줄바꿈)

### 1.4 FeatureSection 컨테이너 구현 ✅
- [x] Props 인터페이스 정의 (`FeatureSectionProps`)
- [x] SearchBar 컴포넌트 통합
- [x] CategoryFilter 컴포넌트 통합
- [x] 배경색 스타일링 (`bg-muted/50`)
- [x] 여백 스타일링 (padding, margin)
- [x] 반응형 레이아웃 (모바일: 세로, 데스크톱: 가로)
- [x] 구분선 추가 (`border-y`)

### 1.5 HomePage 통합 ✅
- [x] HomeContent 클라이언트 컴포넌트 분리
- [x] FeatureSection 컴포넌트 임포트
- [x] Header와 Article List 사이에 FeatureSection 배치
- [x] SearchDialog 통합
- [x] 브라우저에서 UI 확인
- [x] 반응형 디자인 테스트 (모바일/태블릿/데스크톱)

## Phase 2: 필터링 로직 ✅ 완료

### 2.1 카테고리 데이터 집계 ✅
- [x] HomeContent에 `useMemo`로 카테고리 집계 로직 구현
- [x] `Map<string, number>`로 태그 카운트 계산
- [x] 중복 제거 및 개수 집계
- [x] 개수 내림차순 정렬
- [x] `CategoryInfo[]` 타입으로 변환
- [x] articles 변경 시에만 재계산되도록 의존성 설정

### 2.2 필터링 상태 관리 ✅
- [x] `selectedCategory` state 추가 (`useState<string | null>`)
- [x] `setSelectedCategory` 핸들러 구현
- [x] FeatureSection에 props 전달
- [x] 초기값 `null`로 설정 (전체 표시)

### 2.3 필터링 로직 구현 ✅
- [x] `filteredArticles` useMemo 구현
- [x] `selectedCategory === null`일 때 전체 articles 반환
- [x] `selectedCategory` 있을 때 태그 필터링
- [x] `article.tags.includes(selectedCategory)` 조건
- [x] articles와 selectedCategory 의존성 설정

### 2.4 ArticleList 데이터 전달 ✅
- [x] ArticleList에 `filteredArticles` 전달 (기존 `articles` 대체)
- [x] 필터링 동작 테스트 (카테고리 클릭)
- [x] 카테고리 변경 시 목록 업데이트 확인

### 2.5 빈 상태 처리 ✅
- [x] 필터링 결과 없을 때 메시지 표시
- [x] `filteredArticles.length === 0 && selectedCategory` 조건
- [x] "해당 카테고리에 글이 없습니다" 메시지
- [x] 초기화 버튼 추가
- [x] 카테고리 없을 때 처리 (categories.length === 0)

### 2.6 현재 필터 상태 표시 ✅
- [x] 선택된 카테고리 표시 UI 추가 (Article List 상단)
- [x] "필터: {category}" 텍스트 표시
- [x] 초기화 버튼 추가
- [x] 초기화 버튼 클릭 시 `setSelectedCategory(null)` 호출
- [x] 스타일링 (작고 눈에 띄지 않게)

## Phase 3: 고급 기능 (선택사항)

### 3.1 URL 쿼리 파라미터 연동
- [ ] wouter의 `useSearchParams` 임포트
- [ ] URL에서 `category` 파라미터 읽기
- [ ] 초기 `selectedCategory` state를 URL에서 설정
- [ ] 카테고리 선택 시 URL 업데이트
- [ ] `?category=java` 형식으로 쿼리 추가
- [ ] 브라우저 뒤로 가기 지원 (`popstate` 이벤트)
- [ ] URL 공유 테스트 (북마크/공유 링크)

### 3.2 다중 카테고리 선택 (선택사항)
- [ ] `selectedCategory`를 `selectedCategories: string[]`로 변경
- [ ] 여러 카테고리 동시 선택 UI
- [ ] AND 조건 vs OR 조건 선택 옵션
- [ ] URL 쿼리: `?category=java,typescript`
- [ ] 선택된 카테고리 목록 표시
- [ ] 개별 카테고리 제거 버튼 (X 아이콘)

### 3.3 Inline 검색 결과 표시 (선택사항)
- [ ] 검색창에 직접 입력 가능하도록 변경 (`readOnly` 제거)
- [ ] 입력 시 드롭다운 결과 표시
- [ ] MiniSearch 로직 재사용
- [ ] 최대 5개 결과만 표시
- [ ] 드롭다운 클릭 시 해당 글로 이동
- [ ] "더 보기" 버튼으로 모달 열기
- [ ] 포커스 아웃 시 드롭다운 닫기

### 3.4 카테고리별 글 개수 강조
- [ ] 현재 구현에 이미 포함됨 (count 표시)
- [ ] 개수 0인 카테고리 숨기기 옵션
- [ ] 개수에 따라 Badge 크기 조정 (선택사항)

### 3.5 애니메이션 효과
- [ ] 카테고리 선택 시 fade-in/out 애니메이션
- [ ] Article List 전환 시 smooth transition
- [ ] Tailwind CSS `transition-*` 클래스 사용
- [ ] `framer-motion` 라이브러리 고려 (선택사항)
- [ ] 과도한 애니메이션 피하기 (성능 고려)

## Phase 4: 테스트 및 최적화

### 4.1 Playwright E2E 테스트
- [ ] `tests/feature-section.spec.ts` 파일 생성
- [ ] 테스트: 카테고리 클릭 → 필터링 동작 확인
- [ ] 테스트: 검색창 클릭 → 모달 열림 확인
- [ ] 테스트: "전체" 버튼 클릭 → 필터 초기화 확인
- [ ] 테스트: 빈 상태 UI 표시 확인
- [ ] 테스트: 초기화 버튼 동작 확인
- [ ] 테스트: URL 쿼리 파라미터 동작 (Phase 3 완료 시)

### 4.2 접근성 검증
- [ ] 키보드 네비게이션 테스트 (Tab, Enter, Space)
- [ ] 스크린 리더 테스트 (VoiceOver, NVDA)
- [ ] ARIA 속성 검증 (`role`, `aria-label`, `aria-pressed`)
- [ ] 포커스 표시 확인 (focus-visible)
- [ ] 색상 대비 확인 (WCAG AA 기준)
- [ ] Lighthouse 접근성 점수 확인 (90점 이상)

### 4.3 반응형 디자인 테스트
- [ ] 모바일 (320px ~ 640px) 테스트
- [ ] 태블릿 (640px ~ 1024px) 테스트
- [ ] 데스크톱 (1024px+) 테스트
- [ ] 세로/가로 방향 전환 테스트
- [ ] 다양한 디바이스에서 확인 (iPhone, iPad, Android)
- [ ] Playwright 반응형 테스트 추가

### 4.4 성능 측정
- [ ] 카테고리 집계 성능 확인 (1000개 글 기준)
- [ ] 필터링 속도 측정 (React DevTools Profiler)
- [ ] 불필요한 리렌더링 확인
- [ ] `useMemo` 의존성 검증
- [ ] Lighthouse 성능 점수 확인 (90점 이상)
- [ ] 메모리 누수 확인 (Chrome DevTools)

### 4.5 타입 체크 및 린트 ✅
- [x] TypeScript 타입 에러 해결 (`npm run check`)
- [x] Props 인터페이스 완전성 확인
- [x] 빌드 성공 확인 (`npm run build`)

### 4.6 코드 리뷰 및 최적화
- [ ] 컴포넌트 분리 적절성 검토
- [ ] 중복 코드 제거
- [ ] 매직 넘버 상수화
- [ ] 주석 추가 (복잡한 로직만)
- [ ] 성능 최적화 기회 확인

## 문서 및 배포

### 문서화
- [ ] README.md 업데이트 (Feature Section 섹션 추가)
- [ ] CHANGELOG.md 작성 (변경 사항 기록)
- [ ] 컴포넌트 사용법 문서 작성 (선택사항)
- [ ] 스크린샷 추가 (docs/ 디렉토리)

### Git 작업
- [ ] feature 브랜치 생성 (`feat/#이슈번호-feature-section`)
- [ ] 커밋 메시지 작성 (한국어, bullet points)
- [ ] PR 생성 (제목, 본문, 체크리스트)
- [ ] 코드 리뷰 반영
- [ ] main 브랜치 머지

### 배포
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 프로덕션 환경 테스트 (`npm start`)
- [ ] 배포 후 검증
- [ ] 모니터링 (에러 로그, 성능 지표)

## 우선순위 가이드

**P0 (필수):**
- Phase 1: 기본 구조 및 UI
- Phase 2: 필터링 로직
- Phase 4.1: Playwright E2E 테스트
- Phase 4.2: 접근성 검증
- Phase 4.3: 반응형 디자인 테스트

**P1 (중요):**
- Phase 4.4: 성능 측정
- Phase 4.5: 타입 체크 및 린트
- 문서 및 배포

**P2 (선택사항):**
- Phase 3.1: URL 쿼리 파라미터 연동
- Phase 3.5: 애니메이션 효과

**P3 (향후 검토):**
- Phase 3.2: 다중 카테고리 선택
- Phase 3.3: Inline 검색 결과 표시
- Phase 3.4: 카테고리별 글 개수 강조 (이미 구현됨)

## 예상 소요 시간

| Phase | 예상 시간 | 난이도 |
|-------|----------|--------|
| Phase 1 | 3-4시간 | 중 |
| Phase 2 | 2-3시간 | 중 |
| Phase 3 | 4-6시간 | 중-상 |
| Phase 4 | 3-4시간 | 중 |
| 문서/배포 | 1-2시간 | 하 |
| **총계** | **13-19시간** | |

## 완료 기준

- [ ] 모든 P0 작업 완료
- [ ] Playwright 테스트 통과율 100%
- [ ] TypeScript 타입 에러 0개
- [ ] Lighthouse 점수: 성능 90+, 접근성 90+
- [ ] 모바일/데스크톱 반응형 정상 동작
- [ ] 빈 상태 UI 정상 표시
- [ ] 검색 모달 통합 정상 동작
- [ ] PR 승인 및 main 머지
