# 검색 기능 개선 TODO

## Phase 1: 기본 구현 ✅

### 1.1 의존성 설치
- [x] `use-debounce` 패키지 설치
  ```bash
  npm install use-debounce
  ```

### 1.2 공통 검색 Hook 생성
- [x] `hooks/use-search.ts` 파일 생성
  - [x] MiniSearch 인스턴스 초기화
  - [x] 검색 인덱스 로딩 함수 (`loadSearchIndex`)
  - [x] 검색 실행 함수 (`search`)
  - [x] 검색 결과 초기화 함수 (`clearResults`)
  - [x] 로딩 상태 관리 (`isLoading`)

### 1.3 Inline 검색 컴포넌트 생성
- [x] `components/feature/inline-search-bar.tsx` 파일 생성
  - [x] 검색 Input 필드 구현
  - [x] Debounce 적용 (300ms)
  - [x] Popover로 결과 Dropdown 구현
  - [x] 검색 결과 렌더링 (카테고리, 제목, excerpt, 태그)
  - [x] 결과 클릭 시 페이지 이동 핸들러
  - [x] 포커스 시 검색 인덱스 로딩
  - [x] ESC 키로 Dropdown 닫기

### 1.4 FeatureSection 수정
- [x] `components/feature/feature-section.tsx` 수정
  - [x] `SearchBar` import 제거
  - [x] `InlineSearchBar` import 추가
  - [x] `onSearchClick` prop 제거
  - [x] `InlineSearchBar` 컴포넌트로 교체

## Phase 2: 스타일 및 반응형 ✅

### 2.1 반응형 디자인
- [x] 데스크톱 레이아웃 확인 (≥768px)
  - [x] 검색란 너비: `max-w-2xl`
  - [x] Dropdown 너비: 검색란과 동일
  - [x] 최대 높이: 500px
- [x] 모바일 레이아웃 확인 (<768px)
  - [x] 검색란 너비: `w-full`
  - [x] Dropdown 화면 너비 대응
  - [x] 최대 높이: 500px

### 2.2 다크모드 대응
- [x] 라이트모드 색상 확인
- [x] 다크모드 색상 확인
- [x] 호버 상태 색상 확인

## Phase 3: 테스트 (MCP Playwright 사용) ✅

### 3.1 기능 테스트 - MCP Playwright

**개발 서버 실행**
```bash
npm run dev
```

**MCP Playwright 도구 사용**
- [x] 브라우저 열기 및 메인 페이지 접속
  ```
  mcp__playwright__playwright_navigate
  - url: http://localhost:3000
  - headless: false
  ```

- [x] 검색란 포커스 테스트
  - [x] 검색란 클릭 (`mcp__playwright__playwright_click`)
  - [x] 포커스 상태 확인
  - [x] Dropdown 표시 확인

- [x] 검색 기능 테스트
  - [x] 검색어 입력 (`mcp__playwright__playwright_fill`)
    - selector: `input[placeholder*="검색"]`
    - value: "React"
  - [x] Dropdown 표시 대기 (300ms + debounce)
  - [x] 검색 결과 렌더링 확인
  - [x] 스크린샷 캡처 (`mcp__playwright__playwright_screenshot`)

- [x] 검색 결과 클릭 테스트
  - [x] 첫 번째 결과 클릭
  - [x] 페이지 이동 확인
  - [x] URL 변경 확인

- [x] Dropdown 닫기 테스트
  - [x] 검색란 포커스
  - [x] 외부 클릭 시 Dropdown 닫힘 확인
  - [x] ESC 키 (`mcp__playwright__playwright_press_key`) 입력
  - [x] Dropdown 닫힘 확인

### 3.2 수동 테스트
- [ ] 검색 기능
  - [ ] 검색란 포커스 시 Dropdown 표시
  - [ ] Debounce 동작 확인 (300ms)
  - [ ] 검색 결과 정확성 검증
  - [ ] 빈 검색어 처리
  - [ ] 검색 결과 없을 때 메시지 표시
- [ ] 인터랙션
  - [ ] 외부 클릭 시 Dropdown 닫힘
  - [ ] ESC 키로 Dropdown 닫기
  - [ ] 검색란 포커스 상태 관리

### 3.3 반응형 테스트 - MCP Playwright ✅

**데스크톱 테스트**
- [x] 뷰포트 설정: 1920x1080
  ```
  mcp__playwright__playwright_navigate
  - url: http://localhost:3000
  - width: 1920
  - height: 1080
  ```
  - [x] 검색란 너비 확인 (max-w-2xl)
  - [x] Dropdown 너비 확인
  - [x] 스크린샷 캡처

**모바일 테스트**
- [x] 뷰포트 설정: 375x667 (iPhone SE)
  ```
  mcp__playwright__playwright_navigate
  - url: http://localhost:3000
  - width: 375
  - height: 667
  ```
  - [x] 검색란 너비 확인 (w-full)
  - [x] Dropdown 화면 대응 확인
  - [x] 터치 인터랙션 테스트
  - [x] 스크린샷 캡처

### 3.4 브라우저 호환성 - MCP Playwright

- [ ] Chromium 브라우저 테스트
  ```
  mcp__playwright__playwright_navigate
  - browserType: chromium
  - url: http://localhost:3000
  ```

- [ ] Firefox 브라우저 테스트
  ```
  mcp__playwright__playwright_navigate
  - browserType: firefox
  - url: http://localhost:3000
  ```

- [ ] WebKit (Safari) 브라우저 테스트
  ```
  mcp__playwright__playwright_navigate
  - browserType: webkit
  - url: http://localhost:3000
  ```

### 3.5 접근성 테스트
- [ ] 키보드 내비게이션 (Tab, ESC)
- [ ] ARIA 속성 확인
- [ ] 포커스 관리 확인

## Phase 4: 성능 확인

### 4.1 성능 측정
- [ ] 검색 인덱스 로딩 시간 확인 (< 500ms 목표)
- [ ] 검색 응답 시간 확인 (< 100ms 목표)
- [ ] Debounce 지연 시간 확인 (300ms)

### 4.2 최적화 (필요 시)
- [ ] 검색 인덱스 캐싱 확인
- [ ] 메모리 사용량 확인
- [ ] 번들 사이즈 증가량 확인

## Phase 5: 최종 검증

### 5.1 헤더 검색 기능 확인
- [ ] 헤더 검색 버튼 정상 동작
- [ ] SearchDialog 모달 열림 확인
- [ ] ⌘K 단축키 동작 확인
- [ ] 헤더 검색 기능 유지 확인

### 5.2 통합 테스트 - MCP Playwright

**메인 페이지 Inline 검색 테스트**
- [ ] 메인 페이지 접속
  ```
  mcp__playwright__playwright_navigate
  - url: http://localhost:3000
  ```
- [ ] FeatureSection 내 검색란 확인
- [ ] 검색어 입력 및 결과 표시 확인
- [ ] 검색 결과 클릭 시 페이지 이동

**헤더 팝업 검색 테스트**
- [ ] 헤더 검색 버튼 클릭
  ```
  mcp__playwright__playwright_click
  - selector: button[aria-label="검색"]
  ```
- [ ] SearchDialog 모달 표시 확인
- [ ] 모달 내 검색 기능 확인
- [ ] ⌘K 단축키 테스트
  ```
  mcp__playwright__playwright_press_key
  - key: Meta+k
  ```

**검색 방식 공존 확인**
- [ ] 메인 페이지에서 Inline 검색 실행
- [ ] 결과 클릭 후 글 페이지 이동
- [ ] 헤더 검색 버튼으로 팝업 검색 실행
- [ ] 두 검색 결과 일관성 비교
- [ ] 전체 시나리오 스크린샷 캡처

### 5.3 최종 점검
- [ ] 모든 기능 정상 동작
- [ ] 반응형 디자인 완성
- [ ] 다크모드 대응 완료
- [ ] 접근성 기준 충족
- [ ] 성능 목표 달성

## 완료 후 작업

### 문서 정리
- [ ] 구현 완료 사항 기록
- [ ] 알려진 이슈 문서화
- [ ] 개선 제안 사항 정리
