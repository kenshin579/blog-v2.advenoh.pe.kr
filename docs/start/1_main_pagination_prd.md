# 메인 페이지 Pagination 개선 PRD

## 문제 분석

### 현재 상황
메인 페이지(`app/page.tsx` → `components/home-content.tsx`)에서 articles가 **고정된 10개씩만** 표시되고 있습니다.

### 원인 분석

#### 1. 고정된 초기 표시 개수
**위치:** `components/home-content.tsx:38`
```typescript
const [displayCount, setDisplayCount] = useState(10);
```

- 초기 상태값이 하드코딩된 10으로 고정
- 브라우저 viewport 크기와 무관하게 동일한 개수 표시
- 사용자 화면 크기에 최적화되지 않음

#### 2. 수동 "더 보기" 버튼 방식
**위치:** `components/home-content.tsx:173-183`
```typescript
{filteredArticles.length > displayCount && (
  <div className="flex justify-center mt-8">
    <Button onClick={handleLoadMore}>
      더 보기 ({filteredArticles.length - displayCount}개 남음)
    </Button>
  </div>
)}
```

**현재 동작:**
- 사용자가 명시적으로 "더 보기" 버튼을 클릭해야만 추가 로딩
- 버튼 클릭 시 10개씩 추가 표시 (`setDisplayCount(prev => prev + 10)`)
- 자동 로딩 기능 없음

#### 3. Responsive 최적화 부재
**레이아웃 구조:** `components/home-content.tsx:116`
```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```

**Viewport별 표시 개수:**
- **모바일 (< 768px)**: 1열 → 10개 표시 (세로 스크롤 매우 길어짐)
- **태블릿 (768px ~ 1024px)**: 2열 → 10개 표시 (5행)
- **데스크톱 (> 1024px)**: 3열 → 10개 표시 (3.33행)

**문제점:**
- 큰 화면에서는 3행만 차지하여 많은 공백 발생
- 작은 화면에서는 10개 스크롤이 과도하게 길어짐
- 화면 크기에 따른 최적 표시 개수가 다름에도 불구하고 일괄 10개 적용

#### 4. 전체 데이터 로딩 방식
**위치:** `lib/articles.ts:45-48`
```typescript
export async function getAllArticles(): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles;
}
```

**현재 구조:**
- 서버에서 전체 141개 articles를 한 번에 로딩 (manifest 기반)
- 클라이언트에서 `slice(0, displayCount)`로 제한
- 실제로는 모든 데이터가 이미 메모리에 존재
- Pagination은 UI 레벨에서만 동작 (진정한 lazy loading 아님)

## 개선 방향

### 목표
브라우저 viewport 크기에 따라 **초기 표시 개수를 동적으로 조정**하여 사용자 경험을 최적화합니다.

### 해결 방법
- Custom Hook으로 viewport 크기 감지 (모바일/태블릿/데스크톱)
- Viewport별 최적 표시 개수 설정: 모바일 6개, 태블릿 8개, 데스크톱 12개
- 기존 "더 보기" 버튼 유지 (viewport별 증가량 자동 조정)
- 화면 크기 변경 시 자동으로 표시 개수 재계산

> 상세 구현 내용: [`1_main_pagination_implementation.md`](./1_main_pagination_implementation.md)
> 작업 체크리스트: [`1_main_pagination_todo.md`](./1_main_pagination_todo.md)

### 기대 효과

#### Before (현재)
| Viewport | 열 수 | 초기 표시 | 행 수 | 문제점 |
|---------|------|---------|------|--------|
| 모바일 | 1 | 10개 | 10행 | 스크롤 과도하게 길어짐 |
| 태블릿 | 2 | 10개 | 5행 | 적절함 |
| 데스크톱 | 3 | 10개 | 3.33행 | 공백 많음, 정보 부족 |

#### After (개선 후)
| Viewport | 열 수 | 초기 표시 | 행 수 | 효과 |
|---------|------|---------|------|------|
| 모바일 | 1 | 6개 | 6행 | ✅ 스크롤 부담 감소 |
| 태블릿 | 2 | 8개 | 4행 | ✅ 적절한 정보량 |
| 데스크톱 | 3 | 12개 | 4행 | ✅ 화면 활용도 향상 |

## 참고 정보
- 전체 articles 수: 141개 (contents 디렉토리)
- 현재 초기 표시: 10개 고정
- 추가 로딩 단위: 10개씩 증가
- Manifest 파일: `public/content-manifest.json` (빌드 시 생성)
