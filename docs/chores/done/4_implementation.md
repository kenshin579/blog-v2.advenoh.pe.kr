# 구현 계획: 홈페이지 서브타이틀을 Feature Section으로 통합

## 개요

Hero Section을 제거하고 서브타이틀을 Feature Section 상단에 통합하여 페이지 레이아웃을 개선합니다.

## 파일 변경 목록

### 1. `client/src/components/home-content.tsx`

**변경 내용:**
- Hero Section 제거
- Feature Section에 서브타이틀 추가
- 레이아웃 간격 조정

**변경 전 구조:**
```tsx
<div className="min-h-screen">
  {/* Hero Section */}
  <section className="...">
    <h1>Frank's IT Blog</h1>
    <p>개발, 클라우드, 데이터베이스 관련 기술 블로그</p>
  </section>
  
  {/* Feature Section */}
  <section className="...">
    {/* 검색창 */}
    {/* 카테고리 필터 */}
  </section>
  
  {/* Blog Posts */}
</div>
```

**변경 후 구조:**
```tsx
<div className="min-h-screen">
  {/* Feature Section with Subtitle */}
  <section className="...">
    {/* 서브타이틀 */}
    <p className="text-center text-lg md:text-lg text-muted-foreground mb-6">
      개발, 클라우드, 데이터베이스 관련 기술 블로그
    </p>
    
    {/* 검색창 */}
    {/* 카테고리 필터 */}
  </section>
  
  {/* Blog Posts */}
</div>
```

## 상세 구현 내용

### Hero Section 제거

**현재 코드 (제거 대상):**
```tsx
<section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/20">
  <div className="container mx-auto px-4">
    <div className="text-center space-y-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        Frank's IT Blog
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
        개발, 클라우드, 데이터베이스 관련 기술 블로그
      </p>
    </div>
  </div>
</section>
```

**삭제 이유:**
- 헤더에 이미 "Frank's IT Blog" 제목이 있어 중복
- 수직 공간을 과도하게 차지
- Feature Section과 분리되어 시각적 계층 구조 불명확

### Feature Section 수정

**서브타이틀 추가 위치:**
Feature Section 최상단, 검색창 위에 배치

**스타일 클래스:**
```tsx
<p className="text-center text-lg md:text-lg text-muted-foreground mb-6">
  개발, 클라우드, 데이터베이스 관련 기술 블로그
</p>
```

**클래스 설명:**
- `text-center`: 중앙 정렬
- `text-lg`: 18px 폰트 크기 (모바일/데스크톱 동일)
- `text-muted-foreground`: 보조 텍스트 색상 (회색 톤)
- `mb-6`: 하단 여백 24px (검색창과의 간격)

**Feature Section 전체 패딩 조정:**
```tsx
<section className="py-8 md:py-10 border-b">
  {/* 서브타이틀 + 검색창 + 필터 */}
</section>
```

- `py-8`: 상하 패딩 32px (모바일)
- `md:py-10`: 상하 패딩 40px (데스크톱)

### 레이아웃 간격 조정

**서브타이틀 ~ 검색창:**
- `mb-6` (24px)

**검색창 ~ 카테고리 필터:**
- 기존 `mb-6` 유지 (24px)

**전체 레이아웃:**
```
[서브타이틀]
   ↓ 24px
[검색창]
   ↓ 24px
[카테고리 필터]
```

## 반응형 디자인

### 모바일 (<768px)
```tsx
<p className="text-base md:text-lg ...">
  개발, 클라우드, 데이터베이스 관련 기술 블로그
</p>
```
- 폰트 크기: 16px
- 패딩: 32px (상하)

### 데스크톱 (≥768px)
- 폰트 크기: 18px
- 패딩: 40px (상하)

## 애니메이션

**기존 Feature Section 애니메이션 유지:**
```tsx
<section className="... animate-in fade-in slide-in-from-bottom-4 duration-500">
```

**순차적 등장 효과 (선택사항):**
```tsx
<p className="... animate-in fade-in slide-in-from-bottom-2 duration-300">
  서브타이틀
</p>

<div className="... animate-in fade-in slide-in-from-bottom-3 duration-400 delay-100">
  검색창
</div>

<div className="... animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
  카테고리 필터
</div>
```

## 접근성 고려사항

### Semantic HTML
- 서브타이틀은 `<p>` 태그 사용 (제목 아님)
- 검색창은 `role="search"` 유지
- 카테고리 필터는 `role="group"` with `aria-label="카테고리 필터"`

### 색상 대비
- `text-muted-foreground`: WCAG AA 기준 충족 확인
- 다크 모드에서도 충분한 대비 확인

### 키보드 네비게이션
- Tab 순서: 서브타이틀(skip) → 검색창 → 카테고리 필터
- 기존 키보드 단축키 (⌘K) 동작 유지

## 테스트 계획

### 시각적 회귀 테스트
1. 모바일 (375px, 414px)
2. 태블릿 (768px, 1024px)
3. 데스크톱 (1280px, 1920px)

### 기능 테스트
1. 검색창 클릭/포커스 동작
2. 카테고리 필터 선택 동작
3. 다크 모드 전환 시 서브타이틀 색상
4. 페이지 로드 애니메이션

### 접근성 테스트
1. 스크린 리더 테스트 (VoiceOver, NVDA)
2. 키보드 네비게이션 테스트
3. 색상 대비 테스트 (axe DevTools)

## 예상 영향

### 긍정적 영향
- 페이지 높이 약 100-150px 감소
- 첫 번째 블로그 포스트가 더 빨리 노출
- 시각적 계층 구조 개선
- 제목 중복 제거

### 위험 요소
- 기존 레이아웃에 익숙한 사용자의 혼란 (낮음)
- 애니메이션 타이밍 조정 필요 가능성 (낮음)

### 성능 영향
- 없음 (DOM 요소 오히려 감소)

## 롤백 계획

Git을 통한 쉬운 롤백 가능:
```bash
git revert <commit-hash>
```

또는 Hero Section 코드 복원으로 즉시 원상 복구 가능

## 참고 자료

- PRD: `docs/chores/4_prd.md`
- 디자인 가이드라인: `design_guidelines.md`
- 기존 Feature Section 구현: PR #11
- Tailwind CSS 문서: https://tailwindcss.com/docs
