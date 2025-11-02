# PRD: Article 페이지 스크롤 연동 목차 활성화

## 1. 기능 개요

Article 페이지에서 사용자가 콘텐츠를 스크롤할 때, 현재 보고 있는 섹션에 해당하는 목차(TOC) 항목을 자동으로 하이라이트하는 기능

## 2. 현재 상태 분석

### 2.1 기존 구현
- **파일 위치**:
  - Article 페이지: `app/[slug]/page.tsx`
  - TOC 컴포넌트: `components/article/table-of-contents.tsx`
  - Markdown 유틸: `lib/markdown.ts`

- **현재 동작**:
  - TOC 항목 클릭 → 해당 섹션으로 스크롤 이동 (`#id` anchor)
  - rehypeSlug로 h2, h3 헤딩에 자동 id 부여
  - TOC는 sticky 사이드바(큰 화면) 또는 상단(작은 화면)에 고정
  - hover 시 `text-primary` 색상 변경만 제공

### 2.2 문제점
- **사용자 위치 피드백 부족**: 현재 어느 섹션을 읽고 있는지 시각적 표시 없음
- **긴 문서 네비게이션 불편**: 스크롤 위치와 TOC 연동 없어 문맥 파악 어려움
- **UX 표준 미달**: Medium, Dev.to 등 현대적 블로그는 모두 스크롤 연동 TOC 제공

## 3. 요구사항

### 3.1 기능적 요구사항 (Functional Requirements)

#### FR1. 스크롤 위치 감지
- 사용자가 페이지를 스크롤할 때 viewport 내 헤딩 요소 감지
- h2, h3 헤딩 중 현재 가장 가까운(활성) 헤딩 식별

#### FR2. 목차 활성화 표시
- 현재 활성 섹션에 해당하는 TOC 항목 시각적 하이라이트
- 하나의 TOC 항목만 활성 상태 유지
- 스크롤 시 실시간 업데이트

#### FR3. 클릭 동작 유지
- 기존 TOC 클릭 시 스크롤 이동 기능 유지
- 클릭 후 해당 항목 즉시 활성화

### 3.2 비기능적 요구사항 (Non-functional Requirements)

#### NFR1. 성능
- Intersection Observer API 사용으로 성능 최적화
- 스크롤 이벤트 throttle/debounce 불필요
- 큰 문서(50+ 헤딩)에서도 부드러운 동작

#### NFR2. 접근성 (Accessibility)
- aria-current="location" 속성으로 활성 항목 표시
- 키보드 네비게이션 지원 유지

#### NFR3. 반응형 디자인
- 모바일/데스크톱 모두 동일하게 동작
- 작은 화면(lg 미만)에서도 정상 작동

## 4. 기술적 구현 방안

### 구현 상세
Intersection Observer API를 사용한 스크롤 위치 감지 및 활성화 표시

자세한 구현 방법은 **[2_content_implementation.md](2_content_implementation.md)** 참조

## 5. UX 고려사항

### 5.1 활성화 시각 표시
- **색상**: `text-primary` (테마 색상 통일)
- **글꼴 굵기**: `font-semibold` (현재 위치 강조)
- **좌측 보더**: `border-l-2 border-primary` (Medium 스타일 차용)
- **부드러운 전환**: `transition-colors` (깜빡임 방지)

### 5.2 스크롤 경험 최적화
- **rootMargin 조정**: 상단 20% 영역을 감지 기준으로 설정
  - 사용자가 헤딩을 읽기 시작할 때 활성화
  - 너무 일찍/늦게 전환되지 않도록 튜닝

### 5.3 엣지 케이스 처리
- **페이지 최상단**: 첫 번째 TOC 항목 기본 활성화
- **페이지 최하단**: 마지막 TOC 항목 활성화
- **빠른 스크롤**: 중간 섹션 건너뛰지 않도록 IntersectionObserver 최적화

## 6. 성능 고려사항

### 6.1 최적화 전략
- **Intersection Observer 사용**: 스크롤 이벤트 리스너보다 효율적
- **관찰 대상 제한**: h2, h3만 관찰 (h1은 제외)
- **cleanup 함수**: 컴포넌트 언마운트 시 observer 정리

### 6.2 성능 측정 기준
- Time to Interactive: 변화 없음 (클라이언트 사이드 기능)
- First Contentful Paint: 영향 없음 (초기 렌더링 변경 없음)
- 스크롤 성능: 60fps 유지 (Intersection Observer 덕분)

## 7. 작업 체크리스트

단계별 구현 및 테스트 TODO는 **[2_content_todo.md](2_content_todo.md)** 참조

## 8. 성공 지표 (Success Metrics)

### 정량적 지표
- **성능**: Lighthouse Performance 점수 유지 (95+ 유지)
- **번들 크기**: +0.5KB 이하 증가 (Intersection Observer는 네이티브 API)

### 정성적 지표
- **사용성**: 사용자가 문서 내 위치를 쉽게 파악
- **표준 준수**: 현대적 블로그 UX 패턴 준수

## 9. 참고 자료

### 유사 구현 사례
- [Medium's Table of Contents](https://medium.design/)
- [Dev.to Article Navigation](https://dev.to/)
- [MDN Web Docs TOC](https://developer.mozilla.org/)

### 기술 문서
- [Intersection Observer API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [ARIA: navigation role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/navigation_role)

---

**작성일**: 2025-10-29
**작성자**: Claude (요청: 사용자)
**버전**: 1.0
