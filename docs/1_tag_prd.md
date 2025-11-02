# 태그 페이지 PRD (Product Requirements Document)

## 1. 개요

블로그의 태그 시스템을 시각화하고 탐색할 수 있는 전용 페이지를 구현합니다. 태그를 bubble chart로 표현하여 사용자가 직관적으로 태그의 사용 빈도를 파악하고, 관심 있는 태그를 클릭하여 관련 아티클을 쉽게 찾을 수 있도록 합니다.

## 2. 목표

- **시각적 탐색**: 태그를 bubble chart로 시각화하여 블로그의 콘텐츠 분포를 한눈에 파악
- **직관적 내비게이션**: 태그 클릭 한 번으로 관련 아티클 필터링
- **정보 계층**: 태그 사용 빈도에 따른 크기와 배치로 중요도 표현

## 3. 요구사항

### 3.1 기능 요구사항

#### FR-1: 헤더 네비게이션 확장
- 헤더의 "Series" 링크 옆에 "Tags" 링크 추가
- Tags 아이콘은 태그와 유사한 시각적 표현 (예: tag, hash, label icon)
- 모바일 반응형 지원 (햄버거 메뉴에도 포함)

#### FR-2: 태그 데이터 수집
- 모든 아티클의 frontmatter에서 tags 추출
- 각 태그별 사용 횟수 계산
- 태그 정규화 (소문자 변환, 공백 처리)

#### FR-3: Bubble Chart 시각화
- 태그를 원형 bubble로 표현
- Bubble 크기: 태그 사용 횟수에 비례
- Bubble 배치: 크기 순으로 중앙 → 가장자리 정렬
- Bubble 내부에 태그명과 개수 표시
- 색상: 다크/라이트 모드 대응

#### FR-4: 인터랙션
- Bubble 호버 시 확대 효과 또는 강조
- Bubble 클릭 시 해당 태그로 필터링된 아티클 목록 표시
- 필터링 상태 표시 (예: "TypeScript (12개 아티클)")
- 필터 해제 버튼 제공

#### FR-5: 아티클 목록 표시
- 필터링된 아티클을 카드 형태로 표시
- 각 카드에 제목, 날짜, excerpt, 태그 표시
- 아티클 클릭 시 해당 아티클 페이지로 이동

### 3.2 UI/UX 요구사항

#### UX-1: 레이아웃
```
┌─────────────────────────────────────┐
│ Header (Home | Series | Tags)       │
├─────────────────────────────────────┤
│                                     │
│       Bubble Chart Area             │
│    (태그들이 원형으로 배치)          │
│                                     │
├─────────────────────────────────────┤
│ Filtered Articles (선택 시)         │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ 카드│ │ 카드│ │ 카드│            │
│ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────┘
```

#### UX-2: Bubble Chart 레이아웃 규칙
- 가장 큰 bubble: 중앙에 배치
- 큰 bubble: 중앙 주변에 배치
- 작은 bubble: 가장자리에 배치
- Bubble 간 간격: 최소 8px 유지 (겹치지 않도록)
- 반응형: 모바일에서는 작은 bubble 크기 조정

#### UX-3: 색상 시스템
- 다크 모드:
  - Bubble 배경: `hsl(var(--primary))` 계열
  - 텍스트: `hsl(var(--primary-foreground))`
- 라이트 모드:
  - Bubble 배경: `hsl(var(--primary))` 계열
  - 텍스트: `hsl(var(--primary-foreground))`
- 호버 시: 약간의 opacity 증가 또는 scale 효과

#### UX-4: 애니메이션
- Bubble 등장: fade-in + scale 애니메이션 (0.3s)
- 호버: scale(1.05) 트랜스포메이션
- 클릭: 부드러운 스크롤로 아티클 목록으로 이동

### 3.3 기술 요구사항

#### TR-1: 라우팅
- 경로: `/tags`
- Wouter 라우터에 `/tags` 경로 추가

#### TR-2: 컴포넌트 구조
```
client/src/pages/
  ├── Tags.tsx                 # 메인 페이지 컴포넌트

client/src/components/
  ├── TagBubbleChart.tsx       # Bubble chart 컴포넌트
  ├── TagArticleList.tsx       # 필터링된 아티클 목록
  └── ui/
      └── badge.tsx            # shadcn badge (태그 표시용)
```

#### TR-3: 상태 관리
```typescript
interface TagData {
  name: string;
  count: number;
  articles: Article[];
}

interface TagsPageState {
  tags: TagData[];
  selectedTag: string | null;
  filteredArticles: Article[];
}
```

#### TR-4: Bubble Chart 라이브러리
- **옵션 1**: D3.js force simulation (추천)
  - 세밀한 커스터마이징 가능
  - 물리 기반 레이아웃 자동 계산
- **옵션 2**: Recharts 또는 Visx
  - React 친화적
  - 간단한 구현

#### TR-5: 성능 최적화
- 태그 데이터 캐싱 (`useMemo`)
- Bubble 렌더링 최적화 (대량 태그 대비)
- 아티클 목록 가상 스크롤링 (태그당 아티클 100개 이상 시)

## 4. 구현 상세

구체적인 구현 내용은 `1_tag_implementation.md` 참조
단계별 TODO는 `1_tag_todo.md` 참조

## 5. 성공 기준

### 5.1 기능 검증
- 모든 태그가 bubble chart에 표시됨
- Bubble 크기가 태그 사용 횟수를 정확히 반영
- 큰 bubble이 중앙에, 작은 bubble이 가장자리에 배치됨
- Bubble 클릭 시 올바른 아티클 목록이 표시됨
- 필터 해제 시 원래 상태로 복귀

### 5.2 UX 검증
- Bubble chart 로딩 시간 < 1초
- 호버/클릭 반응 즉각적 (< 100ms)
- 모바일에서 터치 인터랙션 정상 작동
- 다크/라이트 모드 모두에서 가독성 우수

### 5.3 코드 품질
- TypeScript 타입 에러 없음
- ESLint 경고 없음
- 컴포넌트 재사용 가능성 고려
- 주석으로 복잡한 로직 설명

## 6. 참고 자료

### 6.1 Bubble Chart 예시
- [D3 Force Bubble Chart](https://observablehq.com/@d3/bubble-chart)
- [D3 Packed Circles](https://observablehq.com/@d3/pack)

### 6.2 기술 문서
- [D3.js Documentation](https://d3js.org/)
- [Wouter Router Docs](https://github.com/molefrog/wouter)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 7. 추후 개선 사항 (Optional)

- 태그 검색 기능
- 태그 클라우드 뷰 (대안 시각화)
- 태그별 색상 테마
- 관련 태그 추천 (태그 조합 분석)
- 태그 트렌드 차트 (시간 경과에 따른 사용 빈도)
