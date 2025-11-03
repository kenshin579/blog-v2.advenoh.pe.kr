# 메인 페이지 Viewport 기반 Pagination Todo

## Phase 1: Custom Hook 생성

### `hooks/use-viewport-size.ts`
- [ ] 파일 생성: `hooks/use-viewport-size.ts`
- [ ] `"use client"` 지시어 추가
- [ ] `ViewportSize` 타입 정의 (`'mobile' | 'tablet' | 'desktop'`)
- [ ] `useViewportSize` hook 구현
  - [ ] `useState` 초기화 (`'desktop'` 기본값)
  - [ ] `useEffect`에서 `handleResize` 함수 정의
  - [ ] Breakpoint 로직 구현 (768px, 1024px)
  - [ ] `window.addEventListener('resize')` 등록
  - [ ] Cleanup 함수에서 이벤트 리스너 제거
  - [ ] 초기 실행 `handleResize()` 호출
- [ ] Hook export

## Phase 2: 상수 정의

### `lib/constants.ts`
- [ ] `INITIAL_DISPLAY_COUNT` 객체 추가
  ```typescript
  export const INITIAL_DISPLAY_COUNT = {
    mobile: 6,
    tablet: 8,
    desktop: 12
  } as const;
  ```
- [ ] Export 확인

## Phase 3: HomeContent 컴포넌트 수정

### `components/home-content.tsx`
- [ ] Import 추가
  - [ ] `useViewportSize` from `@/hooks/use-viewport-size`
  - [ ] `INITIAL_DISPLAY_COUNT` from `@/lib/constants`
- [ ] Hook 호출
  - [ ] `const viewportSize = useViewportSize();` 추가
- [ ] State 초기화 변경
  - [ ] `displayCount` 초기값을 `INITIAL_DISPLAY_COUNT[viewportSize]`로 변경
- [ ] Viewport 변경 감지 추가
  - [ ] `useEffect` 추가 (의존성: `[viewportSize]`)
  - [ ] Effect 내에서 `setDisplayCount(INITIAL_DISPLAY_COUNT[viewportSize])`
- [ ] 카테고리 변경 Effect 수정
  - [ ] 기존 Effect 의존성에 `viewportSize` 추가
- [ ] `handleLoadMore` 함수 수정
  - [ ] 증가량을 `INITIAL_DISPLAY_COUNT[viewportSize]`로 변경

## Phase 4: 검증

### 기능 테스트
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 브라우저 DevTools 열기 (F12)

### Viewport별 초기 표시 확인
- [ ] **모바일** (<768px): 6개 표시 확인
- [ ] **태블릿** (768px~1023px): 8개 표시 확인
- [ ] **데스크톱** (≥1024px): 12개 표시 확인

### "더 보기" 버튼 동작 확인
- [ ] 모바일에서 버튼 클릭 → 6개 추가 표시
- [ ] 태블릿에서 버튼 클릭 → 8개 추가 표시
- [ ] 데스크톱에서 버튼 클릭 → 12개 추가 표시

### 리사이즈 동작 확인
- [ ] 데스크톱 → 모바일 크기 조정 시 6개로 리셋
- [ ] 모바일 → 데스크톱 크기 조정 시 12개로 리셋

### 카테고리 필터링 통합 테스트
- [ ] 카테고리 선택 시 pagination 리셋 확인
- [ ] 필터 적용 후 viewport별 개수 정상 동작 확인

### 자동화 테스트 (MCP Playwright)

#### 모바일 Viewport 자동화
- [ ] 브라우저 열기 (375×812)
- [ ] 초기 article 개수 확인: `document.querySelectorAll('.grid > a').length === 6`
- [ ] 스크린샷 캡처: "mobile-initial-6-articles"
- [ ] "더 보기" 버튼 클릭
- [ ] 증가 후 개수 확인: `length === 12`

#### 태블릿 Viewport 자동화
- [ ] 브라우저 열기 (768×1024)
- [ ] 초기 article 개수 확인: `length === 8`
- [ ] "더 보기" 버튼 클릭
- [ ] 증가 후 개수 확인: `length === 16`

#### 데스크톱 Viewport 자동화
- [ ] 브라우저 열기 (1920×1080)
- [ ] 초기 article 개수 확인: `length === 12`
- [ ] "더 보기" 버튼 클릭
- [ ] 증가 후 개수 확인: `length === 24`

#### 리사이즈 동작 자동화
- [ ] 데스크톱 크기로 시작 (12개 확인)
- [ ] Viewport 크기 변경 (모바일로)
- [ ] 자동 리셋 확인: `length === 6`

#### 카테고리 필터링 자동화
- [ ] 카테고리 버튼 클릭 (예: "Spring")
- [ ] Pagination 리셋 및 viewport별 개수 확인
- [ ] "더 보기" 동작 확인

#### 콘솔 에러 확인
- [ ] Console logs 확인: 에러 없음
- [ ] 브라우저 닫기

> 상세 Playwright 명령어: [`1_main_pagination_implementation.md`](./1_main_pagination_implementation.md#자동화-테스트-mcp-playwright)

## 완료 조건
✅ 모든 체크리스트 완료
✅ 3가지 viewport 크기에서 정상 동작
✅ 카테고리 필터링과 연동 동작
✅ 콘솔 에러 없음
✅ Playwright 자동화 테스트 통과
