# 헤더 검색 위치 변경 PRD

## 개요
헤더의 검색 기능을 현재 위치에서 맨 오른쪽으로 이동하여 더 나은 사용자 경험을 제공합니다.

## 현재 상태 분석

### 파일 위치
- **컴포넌트**: `/components/site-header.tsx`

### 현재 헤더 구조
```
[왼쪽 영역]
  - 로고 (Frank's IT Blog)
  - 내비게이션 (홈, 시리즈)

[오른쪽 영역]
  - SocialLinks (LinkedIn, GitHub, Instagram, TrendingUp)
  - Search Button (검색 ⌘K)
  - ThemeToggle (다크모드 토글)
```

### 현재 코드 구조 (38-62줄)
```tsx
<div className="flex items-center gap-2">
  <SocialLinks />
  {/* 데스크톱 검색 버튼 */}
  <Button variant="outline" size="sm" ...>
    <Search /> 검색 ⌘K
  </Button>
  {/* 모바일 검색 아이콘 */}
  <Button variant="ghost" size="icon" ...>
    <Search />
  </Button>
  <ThemeToggle />
</div>
```

## 목표

### 변경 후 헤더 구조
```
[왼쪽 영역]
  - 로고 (Frank's IT Blog)
  - 내비게이션 (홈, 시리즈)

[오른쪽 영역]
  - SocialLinks (LinkedIn, GitHub, Instagram, TrendingUp)
  - ThemeToggle (다크모드 토글)
  - Search Button (검색 ⌘K) ← 맨 오른쪽으로 이동
```

## 필요한 작업

### 1. 컴포넌트 순서 변경
**파일**: `components/site-header.tsx`
**위치**: 38-62줄

**변경 내용**:
- `<SocialLinks />` 유지 (첫 번째)
- `<ThemeToggle />` 두 번째로 이동
- Search 버튼들 맨 마지막으로 이동 (데스크톱/모바일 모두)

**변경 후 코드 순서**:
```tsx
<div className="flex items-center gap-2">
  <SocialLinks />
  <ThemeToggle />
  {/* 데스크톱 검색 버튼 */}
  <Button variant="outline" size="sm" ...>
    <Search /> 검색 ⌘K
  </Button>
  {/* 모바일 검색 아이콘 */}
  <Button variant="ghost" size="icon" ...>
    <Search />
  </Button>
</div>
```

### 2. 스타일링 확인사항
- `gap-2` 클래스가 모든 요소 간 간격을 동일하게 유지
- 반응형 클래스 유지: `hidden md:flex` (데스크톱), `md:hidden` (모바일)
- 기존 스타일링 변경 없음

### 3. 접근성 확인사항
- `aria-label="검색"` 유지 (모바일 아이콘 버튼)
- 키보드 단축키 표시 유지 (`⌘K`)
- 포커스 순서는 DOM 순서를 따름 (SocialLinks → Theme → Search)

## 기술적 고려사항

### 영향받는 컴포넌트
- **site-header.tsx**: 메인 변경 파일
- **search-dialog.tsx**: 변경 없음 (검색 기능 자체는 동일)
- **theme-toggle.tsx**: 변경 없음
- **social-links.tsx**: 변경 없음

### 반응형 동작
- **데스크톱 (md 이상)**:
  - 검색 버튼 표시 (텍스트 + 아이콘 + ⌘K)
  - 맨 오른쪽 위치

- **모바일 (md 미만)**:
  - 검색 아이콘만 표시
  - 맨 오른쪽 위치

### 상태 관리
- 변경 없음 (`searchOpen` state 동일하게 유지)
- 클릭 핸들러 동일 (`onClick={() => setSearchOpen(true)}`)

## 테스트 계획

### 시각적 테스트
- [ ] 데스크톱 뷰에서 검색 버튼이 맨 오른쪽에 위치
- [ ] 모바일 뷰에서 검색 아이콘이 맨 오른쪽에 위치
- [ ] 다크/라이트 모드 모두에서 레이아웃 정상 동작
- [ ] 요소 간 간격이 일정하게 유지

### 기능 테스트
- [ ] 검색 버튼 클릭 시 SearchDialog 정상 오픈
- [ ] 키보드 단축키 (⌘K / Ctrl+K) 정상 동작
- [ ] 모바일 검색 아이콘 클릭 정상 동작

### 접근성 테스트
- [ ] 탭 키 네비게이션 순서 확인 (SocialLinks → Theme → Search)
- [ ] 스크린 리더로 aria-label 확인
- [ ] 키보드만으로 모든 기능 접근 가능

## 구현 단계

1. **코드 변경**
   - `components/site-header.tsx` 파일 열기
   - 38-62줄의 JSX 요소 순서 변경
   - ThemeToggle을 Search 버튼들 앞으로 이동

2. **로컬 테스트**
   - `npm run dev` 실행
   - 데스크톱/모바일 뷰 확인
   - 다크/라이트 모드 전환 테스트
   - 검색 기능 동작 확인

3. **커밋**
   - 브랜치: `chores/header-search-reposition`
   - 커밋 메시지: `[chores] 헤더 검색 버튼 위치를 맨 오른쪽으로 이동`

## 예상 소요 시간
- 코드 변경: 5분
- 테스트: 10분
- 총 15분

## 우선순위
Low - UI 개선 (기능 변경 없음, 순수 레이아웃 변경)

## 성공 기준
- ✅ 검색 버튼/아이콘이 헤더 오른쪽 영역의 맨 오른쪽에 위치
- ✅ 모든 반응형 브레이크포인트에서 정상 동작
- ✅ 검색 기능 정상 작동
- ✅ 접근성 유지
