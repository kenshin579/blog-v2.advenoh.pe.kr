# 검색 기능 개선 PRD

## 1. 개요

본 문서는 메인 페이지의 검색 UX를 개선하여 사용자가 더 빠르고 직관적으로 콘텐츠를 검색할 수 있도록 하는 기능 개선 요구사항을 정의합니다.

**작성 날짜**: 2025-11-09
**대상 페이지**: 메인 페이지 (/) 검색 기능
**목표**: 검색 UX 개선 - Popup 대신 Inline 검색 방식으로 전환

**관련 문서**
- 구현 가이드: [2_search_implementation.md](./2_search_implementation.md)
- TODO 체크리스트: [2_search_todo.md](./2_search_todo.md)

## 2. 현재 상태 분석

### 2.1 현재 검색 기능 구조

**메인 페이지 검색 (FeatureSection)**
- 위치: `components/feature/search-bar.tsx`
- 동작 방식:
  - 검색란 클릭 시 SearchDialog 팝업 창 열림
  - Input은 readOnly로 설정되어 직접 입력 불가
  - 사용자는 팝업 창에서만 검색 가능

**헤더 검색 (SiteHeader)**
- 위치: `components/site-header.tsx`
- 동작 방식:
  - 검색 버튼 클릭 시 SearchDialog 팝업 창 열림
  - 데스크톱/모바일 반응형 버튼 제공

**SearchDialog 컴포넌트**
- 위치: `components/search-dialog.tsx`
- 기술 스택:
  - MiniSearch: 클라이언트 사이드 전문 검색 라이브러리
  - Dialog (모달): shadcn/ui Dialog 컴포넌트
- 검색 기능:
  - title, excerpt, content, tags 필드 검색
  - 퍼지 매칭, prefix 검색 지원
  - 최대 10개 결과 표시
  - 검색 결과 클릭 시 해당 글로 이동

### 2.2 현재 문제점

**메인 페이지 검색 UX 문제**
- ❌ 팝업 창 열림 단계가 추가되어 검색이 번거로움
- ❌ 검색란에 직접 입력할 수 없어 직관적이지 않음
- ❌ 검색 의도가 명확한데도 추가 클릭/인터랙션 필요
- ❌ 모바일에서 팝업 창이 전체 화면을 차지하여 컨텍스트 파악 어려움

## 3. 개선 요구사항

### 3.1 메인 페이지 검색 기능 개선

**핵심 요구사항**
- ✅ 검색란 클릭 시 팝업 창이 뜨지 않고 **바로 입력 가능**
- ✅ 사용자가 타이핑하면 **검색란 아래로 결과 목록 표시** (Dropdown/Autocomplete 방식)
- ✅ 검색 결과는 기존 MiniSearch 검색 로직 재사용
- ✅ 검색 결과 클릭 시 해당 글로 이동
- ✅ 검색란 외부 클릭 시 결과 목록 닫힘
- ✅ ESC 키로 검색 결과 목록 닫기 가능

**세부 기능 요구사항** → 상세 내용은 [구현 가이드](./2_search_implementation.md) 참조

**주요 기능**
- 검색 Input에 직접 타이핑 가능 (debounce 300ms)
- 검색란 아래 Dropdown으로 결과 표시
- 카테고리, 제목, excerpt, 태그 표시
- ESC 키 및 외부 클릭으로 Dropdown 닫기
- 반응형 디자인 (데스크톱/모바일)

### 3.2 헤더 검색 기능 유지

**요구사항**
- ✅ 헤더의 검색 버튼 기능은 **기존 팝업 방식 유지**
- ✅ 클릭 시 SearchDialog 모달 열림
- ✅ 기존 검색 기능 그대로 사용
- ✅ ⌘K 단축키도 계속 동작

**유지 이유**
- 헤더는 어느 페이지에서나 접근 가능한 글로벌 검색
- 전체 화면 모달 방식이 집중된 검색에 유리
- 메인 페이지와 차별화된 UX 제공

## 4. 기술 구현 방안

상세 기술 구현 내용은 [구현 가이드](./2_search_implementation.md)를 참조하세요.

**핵심 구현 요소**
- `hooks/use-search.ts`: 공통 검색 로직 Hook
- `components/feature/inline-search-bar.tsx`: Inline 검색 컴포넌트
- Popover 컴포넌트 사용 (shadcn/ui)
- Debounce 적용 (use-debounce 라이브러리)

## 5. 구현 체크리스트

구현 단계별 체크리스트는 [TODO 문서](./2_search_todo.md)를 참조하세요.

**주요 단계**
1. Phase 1: 기본 구현 (의존성 설치, Hook, 컴포넌트 생성)
2. Phase 2: 스타일 및 반응형
3. Phase 3: **테스트 (MCP Playwright 도구 사용)**
   - 기능 테스트: 검색, Dropdown, 페이지 이동
   - 반응형 테스트: 데스크톱/모바일
   - 브라우저 호환성: Chromium, Firefox, WebKit
4. Phase 4: 성능 확인
5. Phase 5: 최종 검증 (MCP Playwright 통합 테스트)

## 6. 성공 지표

### 6.1 기술적 지표

| 지표 | 목표 |
|------|------|
| 검색 응답 시간 | < 100ms |
| 검색 인덱스 로딩 시간 | < 500ms |
| Debounce 지연 시간 | 300ms |

### 6.2 UX 지표

| 지표 | 목표 |
|------|------|
| 검색 인터랙션 단계 | 1단계 (팝업 제거) |
| 첫 검색 결과 표시 | < 1초 |

## 7. 위험 요소 및 대응 방안

**검색 성능 저하**
- 대응: Debounce, 검색 결과 개수 제한 (10개)

**모바일 레이아웃 깨짐**
- 대응: 반응형 테스트 강화

**사용자 혼란 (헤더 vs 메인 검색)**
- 대응: 명확한 시각적 차별화

## 8. 참고 자료

**기술 문서**
- [MiniSearch GitHub](https://github.com/lucaong/minisearch)
- [shadcn/ui Popover](https://ui.shadcn.com/docs/components/popover)
- [use-debounce](https://github.com/xnimorz/use-debounce)

**UX 참고 사례**
- Google 검색: 검색어 자동완성
- Medium: 검색창 클릭 시 바로 검색 결과 표시
- Dev.to: Instant search with dropdown

## 9. 기대 효과

**사용자 경험 개선**
- 검색 인터랙션 단계 감소 (2단계 → 1단계)
- 모바일 검색 UX 개선
- 콘텐츠 발견율 증가

**구현 목표**
- 메인 페이지: Popup → Inline 검색 방식
- 헤더: 기존 Popup 방식 유지 (글로벌 검색)
