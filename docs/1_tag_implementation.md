# 태그 페이지 구현 명세

## 1. 라우팅 및 페이지 구조

### 1.1 라우트 추가
- **경로**: `/tags`
- **파일**: `client/src/pages/Tags.tsx`
- **라우터**: Wouter 사용

### 1.2 헤더 네비게이션
- **위치**: `client/src/components/Header.tsx`
- **추가 링크**: "Tags" (Series 옆)
- **아이콘**: `lucide-react`의 `Tag` 아이콘
- **모바일**: 햄버거 메뉴에도 포함

## 2. 데이터 처리

### 2.1 태그 데이터 수집
- **소스**: 모든 아티클의 frontmatter `tags` 필드
- **처리**:
  - 소문자 정규화
  - 태그별 사용 횟수 계산
  - 태그별 아티클 목록 저장

### 2.2 데이터 구조
```typescript
interface TagData {
  name: string;
  count: number;
  articles: Article[];
}
```

## 3. Bubble Chart 시각화

### 3.1 라이브러리 선택
- **선택**: D3.js force simulation
- **이유**: 물리 기반 레이아웃, 세밀한 커스터마이징 가능

### 3.2 Bubble 표현
- **크기**: 태그 사용 횟수에 비례 (min-max scaling)
- **배치**: Force simulation으로 자동 배치
- **내용**: 태그명 + 개수
- **색상**: `hsl(var(--primary))` 계열

### 3.3 인터랙션
- **호버**: `scale(1.05)` 효과
- **클릭**: 해당 태그 아티클 목록 표시
- **애니메이션**: fade-in + scale (0.3s)

## 4. 아티클 목록

### 4.1 필터링
- Bubble 클릭 시 해당 태그 아티클만 표시
- 필터 상태 표시: "태그명 (N개 아티클)"
- 필터 해제 버튼 제공

### 4.2 카드 레이아웃
- 제목, 날짜, excerpt, 태그 표시
- 클릭 시 아티클 페이지로 이동
- Grid 레이아웃 (반응형)

## 5. 컴포넌트 구조

```
client/src/pages/
  └── Tags.tsx              # 메인 페이지

client/src/components/
  ├── TagBubbleChart.tsx    # D3 bubble chart
  └── TagArticleList.tsx    # 필터링된 아티클 목록
```

## 6. 스타일링

### 6.1 다크/라이트 모드
- Bubble 배경: `hsl(var(--primary))`
- 텍스트: `hsl(var(--primary-foreground))`
- 호버: opacity 증가

### 6.2 반응형
- 모바일: bubble 크기 조정
- Bubble 간 간격: 최소 8px

## 7. 성능 최적화

- 태그 데이터: `useMemo` 캐싱
- 아티클 목록: 필요 시 가상 스크롤링 고려

## 8. E2E 테스트 (Playwright MCP)

### 8.1 테스트 환경
- **서버**: `npm run dev` (포트 5000)
- **도구**: Playwright MCP 서버
- **브라우저**: Chromium (headless: false)

### 8.2 테스트 시나리오

#### 네비게이션
```typescript
// /tags 페이지 접근
navigate("http://localhost:5000/tags")
screenshot("tags-page-initial")

// 헤더 링크 클릭
click("a[href='/tags']")
```

#### Bubble Chart 인터랙션
```typescript
// Bubble 존재 확인
getVisibleText() // Bubble 텍스트 포함 확인

// 호버 효과
hover("[data-tag-bubble]")
screenshot("bubble-hover")

// 클릭 및 필터링
click("[data-tag='typescript']")
screenshot("filtered-articles")
```

#### 필터링 검증
```typescript
// 필터 상태 확인
getVisibleText() // "TypeScript (N개 아티클)" 포함 확인

// 아티클 카드 확인
click(".article-card:first-child")
// URL 변경 확인: /article/{slug}

// 필터 해제
click("[data-filter-clear]")
```

#### 반응형 테스트
```typescript
// 모바일
navigate("http://localhost:5000/tags", { width: 375, height: 667 })
screenshot("tags-mobile")

// 태블릿
navigate("http://localhost:5000/tags", { width: 768, height: 1024 })
screenshot("tags-tablet")

// 데스크톱
navigate("http://localhost:5000/tags", { width: 1920, height: 1080 })
screenshot("tags-desktop")
```

#### 다크/라이트 모드
```typescript
// 다크 모드 토글
click("[data-theme-toggle]")
screenshot("tags-dark-mode")

// 라이트 모드 복귀
click("[data-theme-toggle]")
screenshot("tags-light-mode")
```

### 8.3 검증 체크리스트
- Bubble Chart 렌더링 (모든 태그 표시)
- Bubble 크기 비례 (사용 횟수 반영)
- 호버/클릭 인터랙션 동작
- 아티클 필터링 정확도
- 필터 해제 기능
- 반응형 레이아웃 (모바일/태블릿/데스크톱)
- 다크/라이트 모드 색상 대비
- 아티클 카드 → 상세 페이지 이동
