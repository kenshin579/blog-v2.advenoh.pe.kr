# TODO: 메인 페이지 Pagination 기능 구현

## Phase 1: 준비 단계

### 1.1 환경 설정
- [ ] 프로젝트 루트에서 최신 코드 pull 받기
- [ ] 브랜치 생성: `git checkout -b feat/pagination-home-page`
- [ ] 의존성 확인: `npm install` (필요한 경우)

### 1.2 문서 확인
- [ ] `docs/chores/3_prd.md` 읽고 요구사항 이해
- [ ] `docs/chores/3_implementation.md` 읽고 구현 방법 이해
- [ ] 현재 `components/home-content.tsx` 파일 내용 확인

---

## Phase 2: 코드 구현

### 2.1 Import 추가
- [ ] `useEffect` import 추가 (또는 기존 확인)
- [ ] `Button` 컴포넌트 import 추가
  ```typescript
  import { Button } from '@/components/ui/button';
  ```

### 2.2 State 추가
- [ ] `displayCount` state 추가 (초기값: 10)
  ```typescript
  const [displayCount, setDisplayCount] = useState(10);
  ```

### 2.3 계산 로직 추가
- [ ] `displayedArticles` useMemo 추가
  ```typescript
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayCount);
  }, [filteredArticles, displayCount]);
  ```

### 2.4 Effect 추가
- [ ] 카테고리 변경 시 pagination 리셋 useEffect 추가
  ```typescript
  useEffect(() => {
    setDisplayCount(10);
  }, [selectedCategory]);
  ```

### 2.5 핸들러 추가
- [ ] `handleLoadMore` 함수 추가
  ```typescript
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10);
  };
  ```

### 2.6 렌더링 수정
- [ ] `filteredArticles.map()` → `displayedArticles.map()` 변경 (Line 100 근처)

### 2.7 "더 보기" 버튼 추가
- [ ] 그리드 다음에 버튼 UI 추가 (Line 153 근처)
  ```typescript
  {filteredArticles.length > displayCount && (
    <div className="flex justify-center mt-8">
      <Button
        onClick={handleLoadMore}
        variant="outline"
        size="lg"
      >
        더 보기 ({filteredArticles.length - displayCount}개 남음)
      </Button>
    </div>
  )}
  ```

---

## Phase 3: 테스트

### 3.1 타입 체크
- [ ] `npm run check` 실행
- [ ] TypeScript 에러 없는지 확인
- [ ] 필요시 타입 에러 수정

### 3.2 Dev Server 실행
- [ ] `npm run dev` 실행
- [ ] 브라우저에서 `http://localhost:3000` 접속
- [ ] 개발자 도구 콘솔에서 에러 없는지 확인

### 3.3 기본 기능 테스트
- [ ] **초기 로딩**: 페이지 로드 시 최대 10개 article만 표시되는지 확인
- [ ] **버튼 존재**: Article이 10개 초과인 경우 "더 보기" 버튼 표시 확인
- [ ] **버튼 클릭**: 버튼 클릭 시 10개씩 추가 표시되는지 확인
- [ ] **버튼 숨김**: 모든 article 표시 후 버튼이 사라지는지 확인
- [ ] **남은 개수**: 버튼에 남은 개수가 정확히 표시되는지 확인

### 3.4 카테고리 필터 통합 테스트
- [ ] 카테고리 선택 시 pagination이 10개로 리셋되는지 확인
- [ ] 카테고리 필터 초기화 시 pagination 리셋 확인
- [ ] 필터링된 article이 10개 미만인 경우 버튼 미표시 확인
- [ ] 카테고리 변경 → "더 보기" 클릭 → 다시 카테고리 변경 시 리셋 확인

### 3.5 UI/UX 테스트
- [ ] **중앙 정렬**: 버튼이 화면 중앙에 정렬되는지 확인
- [ ] **Hover 효과**: 버튼 hover 시 스타일 변경 확인
- [ ] **여백**: 버튼 상단 여백 (mt-8) 적절한지 확인
- [ ] **버튼 크기**: size="lg"로 적절한 크기인지 확인

### 3.6 반응형 테스트
- [ ] **데스크톱** (1920px): 3열 그리드, 버튼 중앙 정렬 확인
- [ ] **태블릿** (768px): 2열 그리드, 버튼 중앙 정렬 확인
- [ ] **모바일** (375px): 1열 그리드, 버튼 전체 너비 확인
- [ ] 모든 해상도에서 스크롤 및 버튼 동작 확인

### 3.7 Edge Cases 테스트
- [ ] **Article 0개**: 에러 없이 "아직 게시된 글이 없습니다" 메시지 표시 확인
- [ ] **Article 정확히 10개**: 버튼 표시 안 됨 확인
- [ ] **Article 10개 미만**: 모두 표시, 버튼 없음 확인
- [ ] **빠른 클릭**: "더 보기" 버튼 여러 번 빠르게 클릭 시 정상 동작 확인
- [ ] **카테고리 + Pagination**: 카테고리 필터링 후 pagination 정상 동작 확인

### 3.8 성능 테스트
- [ ] React DevTools Profiler로 렌더링 성능 확인
- [ ] 초기 렌더링 시 10개만 렌더링되는지 확인 (Elements 탭)
- [ ] 버튼 클릭 시 추가 10개만 렌더링되는지 확인
- [ ] 불필요한 재렌더링 없는지 확인

---

## Phase 4: 최종 검토

### 4.1 코드 리뷰
- [ ] 코드 스타일 일관성 확인
- [ ] 주석이 필요한 부분에 주석 추가
- [ ] 불필요한 console.log 제거
- [ ] import 정리 (사용하지 않는 import 제거)

### 4.2 문서 업데이트
- [ ] CLAUDE.md에 pagination 기능 설명 추가 (필요시)
- [ ] README.md 업데이트 (필요시)

### 4.3 Git Commit
- [ ] 변경 사항 확인: `git status`
- [ ] 변경 사항 리뷰: `git diff components/home-content.tsx`
- [ ] Stage 추가: `git add components/home-content.tsx`
- [ ] Commit 작성:
  ```bash
  git commit -m "feat: 메인 페이지에 Pagination 기능 추가

  * 초기 로딩 시 10개의 article만 표시
  * "더 보기" 버튼 클릭으로 10개씩 추가 로딩
  * 카테고리 필터 변경 시 pagination 자동 리셋
  * shadcn/ui Button 컴포넌트 사용
  * 반응형 디자인 지원
  "
  ```

### 4.4 빌드 테스트
- [ ] `npm run build` 실행
- [ ] 빌드 에러 없는지 확인
- [ ] 빌드 결과물 확인

### 4.5 Production 테스트
- [ ] `npm start` 실행 (프로덕션 빌드)
- [ ] 모든 기능 정상 동작 확인
- [ ] 성능 문제 없는지 확인

---

## Phase 5: PR 및 배포

### 5.1 Pull Request 생성
- [ ] GitHub에서 PR 생성
- [ ] PR 제목: "feat: 메인 페이지 Pagination 기능 추가"
- [ ] PR 설명:
  - 변경 사항 요약
  - 스크린샷 추가 (Before/After)
  - 테스트 완료 항목 체크리스트
  - 관련 이슈 링크 (있는 경우)

### 5.2 코드 리뷰 대응
- [ ] 리뷰어 코멘트 확인
- [ ] 요청사항 반영
- [ ] 추가 테스트 (필요시)

### 5.3 Merge 및 배포
- [ ] PR 승인 확인
- [ ] main 브랜치로 merge
- [ ] 배포 확인 (Netlify 등)
- [ ] Production 환경에서 최종 확인

---

## 완료 체크리스트

### 필수 완료 항목
- [ ] 코드 구현 완료 (Phase 2)
- [ ] 모든 테스트 통과 (Phase 3)
- [ ] 타입 에러 없음 (`npm run check`)
- [ ] 빌드 에러 없음 (`npm run build`)
- [ ] Git commit 완료 (Phase 4.3)

### 선택 완료 항목
- [ ] PR 생성 및 merge (Phase 5)
- [ ] 문서 업데이트 (Phase 4.2)
- [ ] 스크린샷 추가 (Phase 5.1)

---

## 트러블슈팅

### TypeScript 에러 발생 시
1. `displayCount` 타입 확인: `number` 타입이어야 함
2. `displayedArticles` 타입 확인: `Article[]` 타입이어야 함
3. `handleLoadMore` 함수 시그니처 확인

### 버튼이 표시되지 않을 때
1. `filteredArticles.length > displayCount` 조건 확인
2. `filteredArticles`와 `displayCount` 값 콘솔 확인
3. 조건부 렌더링 위치 확인

### Pagination이 리셋되지 않을 때
1. `useEffect` dependencies 배열에 `selectedCategory` 포함 확인
2. `selectedCategory` 변경 시 `setDisplayCount(10)` 호출 확인
3. React DevTools로 state 변경 추적

### 성능 문제 발생 시
1. `useMemo` dependencies 배열 확인
2. React DevTools Profiler로 렌더링 횟수 확인
3. 불필요한 재렌더링 원인 파악

---

## 참고 문서

- PRD: `docs/chores/3_prd.md`
- Implementation Guide: `docs/chores/3_implementation.md`
- shadcn/ui Button: https://ui.shadcn.com/docs/components/button
- React Hooks: https://react.dev/reference/react
