# TODO: Article 페이지 목차(TOC) 개선

## Phase 1: TOC 컴포넌트 분리 및 생성 ✅

### 1.1 디렉토리 구조 생성
- [x] `components/article` 디렉토리 생성
```bash
mkdir -p components/article
```

### 1.2 TOC 컴포넌트 파일 생성
- [x] `components/article/table-of-contents.tsx` 파일 생성
- [x] 다음 내용 구현:
  - `'use client'` 지시어 추가
  - `TOCItem` 인터페이스 import (from `@/lib/markdown`)
  - `TableOfContents` 컴포넌트 구현
  - `aria-label="목차"` 접근성 속성 추가
  - h2/h3 레벨에 따른 스타일 차별화
  - Hover 시 primary 색상 전환

**구현 체크리스트**:
- [x] TOCItem 인터페이스 타입 정의 확인
- [x] cn() 유틸리티 함수 import
- [x] 목차 제목 "목차" 표시
- [x] h2: font-medium
- [x] h3: ml-4 + text-muted-foreground
- [x] 링크 hover 시 text-primary

---

## Phase 2: Article 페이지 레이아웃 변경 ✅

### 2.1 Import 추가
- [x] `app/[slug]/page.tsx` 파일 열기
- [x] 상단에 import 추가:
```tsx
import { TableOfContents } from '@/components/article/table-of-contents';
```

### 2.2 Container 너비 확장
- [x] 86번 라인: `max-w-4xl` → `max-w-7xl` 변경

### 2.3 Header 섹션 유지 (변경 없음)
- [x] 87-116번 라인: Article Header 그대로 유지

### 2.4 Separator 유지
- [x] 118번 라인: Separator 그대로 유지

### 2.5 기존 TOC 제거
- [x] 120-142번 라인: 기존 aside TOC 블록 **삭제**

### 2.6 2-Column 레이아웃 구현
- [x] 120번 라인부터 새로운 레이아웃 구조 추가:

```tsx
{/* 2-Column Layout: Article + TOC Sidebar */}
<div className="flex gap-8 lg:gap-12">
  {/* Main Content Column */}
  <div className="flex-1 min-w-0">
    {/* TOC - 작은 화면에서만 표시 */}
    {toc.length > 0 && (
      <aside className="lg:hidden mb-8 p-4 bg-muted rounded-lg">
        <TableOfContents items={toc} />
      </aside>
    )}

    {/* Article Content */}
    <article
      className="prose prose-neutral dark:prose-invert max-w-none mb-12"
      dangerouslySetInnerHTML={{ __html: article.html }}
    />
  </div>

  {/* TOC Sidebar - 큰 화면에서만 표시 */}
  {toc.length > 0 && (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <TableOfContents items={toc} />
      </div>
    </aside>
  )}
</div>
```

**구현 체크리스트**:
- [x] `flex gap-8 lg:gap-12` 2컬럼 레이아웃
- [x] Main content: `flex-1 min-w-0`
- [x] 모바일 TOC: `lg:hidden` (작은 화면)
- [x] 데스크톱 TOC: `hidden lg:block` (큰 화면)
- [x] Sticky: `top-24` (헤더 높이 고려)
- [x] Max height: `max-h-[calc(100vh-6rem)]`
- [x] Overflow: `overflow-y-auto`
- [x] Sidebar 너비: `w-64 flex-shrink-0`

### 2.7 Related Articles 섹션 유지
- [x] 150번 라인 이후: Related Articles 섹션 그대로 유지
- [x] Back to Home 버튼 그대로 유지

---

## Phase 3: CSS 수정 (Heading Underline 제거) ✅

### 3.1 globals.css 파일 수정
- [x] `app/globals.css` 파일 열기
- [x] 파일 끝(416번 라인 이후)에 추가:

```css
/* Article heading 링크의 underline 제거 */
.prose a[href^="#"] {
  text-decoration: none;
}

.prose a[href^="#"]:hover {
  text-decoration: underline;
}

/* TOC 사이드바 스크롤바 스타일 (optional) */
.prose aside::-webkit-scrollbar {
  width: 4px;
}

.prose aside::-webkit-scrollbar-track {
  background: transparent;
}

.prose aside::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 2px;
}

.prose aside::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

**구현 체크리스트**:
- [x] Heading anchor 링크 underline 기본 제거
- [x] Hover 시 underline 표시 (선택 사항)
- [x] 스크롤바 너비: 4px
- [x] 스크롤바 색상: muted-foreground
- [x] Hover 시 스크롤바 진하게

---

## Phase 4: 테스트 및 검증 ✅

### 4.1 개발 서버 실행
- [x] 개발 서버 시작:
```bash
npm run dev
```

### 4.2 기능 테스트
- [x] TOC 컴포넌트가 정상적으로 렌더링됨
- [x] 데스크톱(≥1024px)에서 TOC가 오른쪽 사이드바에 표시
- [x] 모바일/태블릿(<1024px)에서 TOC가 본문 위에 표시
- [x] TOC 링크 클릭 시 해당 섹션으로 스크롤 이동
- [x] Sticky 포지셔닝이 스크롤 시 상단에 고정
- [x] Article 본문 heading의 underline이 제거됨

### 4.3 반응형 테스트
**브라우저 개발자 도구로 테스트**:
- [x] 1920px: 사이드바 TOC 표시
- [x] 1280px: 사이드바 TOC 표시
- [x] 1024px: 사이드바 TOC 표시 (breakpoint 경계)
- [x] 1023px: 상단 TOC 표시
- [x] 768px: 상단 TOC 표시
- [x] 375px: 상단 TOC 표시 (모바일)

### 4.4 시각적 테스트
- [x] Light 모드에서 색상이 정상적으로 표시됨
- [x] Dark 모드에서 색상이 정상적으로 표시됨
- [x] TOC 스크롤바가 길 때만 표시됨
- [x] 코드 블록이 레이아웃을 깨지 않음
- [x] 이미지가 레이아웃을 깨지 않음

### 4.5 접근성 테스트
- [x] TOC에 `aria-label` 속성 있음
- [x] TOC 링크가 Tab 키로 포커스 가능
- [x] Enter 키로 섹션 이동 가능
- [x] 스크린 리더로 "목차" 읽힘

### 4.6 성능 테스트
- [x] 페이지 로딩 속도가 기존과 유사함
- [x] 스크롤 성능이 부드러움 (60fps)
- [x] TOC가 많을 때(>20개) 스크롤 성능 확인

---

## Phase 5: 최종 확인 및 정리 ✅

### 5.1 코드 정리
- [x] 사용하지 않는 import 제거
- [x] 주석 정리 및 추가
- [x] 코드 포맷팅 (Prettier)

### 5.2 타입 체크
- [x] TypeScript 타입 에러 없음:
```bash
npm run check
```

### 5.3 빌드 테스트
- [x] 프로덕션 빌드 성공:
```bash
npm run build
```

### 5.4 실제 article 테스트
- [x] 짧은 article (TOC < 5개) 테스트
- [x] 긴 article (TOC > 10개) 테스트
- [x] TOC 없는 article 테스트

---

## 트러블슈팅

### Issue 1: TOC가 사이드바에 표시되지 않음
**증상**: 데스크톱에서도 TOC가 상단에 표시
**해결**:
- [ ] `lg:block` 클래스가 올바르게 적용되었는지 확인
- [ ] Tailwind breakpoint 설정 확인 (`tailwind.config.ts`)
- [ ] 브라우저 너비가 1024px 이상인지 확인

### Issue 2: Sticky가 작동하지 않음
**증상**: 스크롤 시 TOC가 따라오지 않음
**해결**:
- [ ] 부모 요소에 `overflow: hidden` 없는지 확인
- [ ] `sticky` 클래스가 적용되었는지 확인
- [ ] `top-24` 값이 적절한지 확인 (헤더 높이에 따라 조정)

### Issue 3: Article 너비가 너무 좁음
**증상**: TOC 추가 후 콘텐츠 영역이 좁아짐
**해결**:
- [ ] Container `max-w-7xl`로 변경되었는지 확인
- [ ] `flex-1 min-w-0` 클래스 확인
- [ ] Gap 값 조정 (`gap-8` → `gap-6`)

### Issue 4: 모바일에서 TOC가 보이지 않음
**증상**: 작은 화면에서 TOC가 아예 안 보임
**해결**:
- [ ] `lg:hidden` 클래스 확인
- [ ] 모바일 TOC 블록이 삭제되지 않았는지 확인
- [ ] 조건부 렌더링 `{toc.length > 0 && ...}` 확인

### Issue 5: Heading underline이 여전히 표시됨
**증상**: CSS 추가 후에도 underline 보임
**해결**:
- [ ] `globals.css`가 올바르게 import 되었는지 확인
- [ ] CSS 선택자 `.prose a[href^="#"]` 확인
- [ ] 브라우저 캐시 삭제 후 재시도
- [ ] 개발자 도구에서 CSS 적용 상태 확인

---

## 완료 체크리스트

### 필수 완료 항목
- [x] TOC 컴포넌트 생성 완료
- [x] Article 페이지 레이아웃 변경 완료
- [x] CSS 수정 완료
- [x] 데스크톱 반응형 테스트 통과
- [x] 모바일 반응형 테스트 통과
- [x] Heading underline 제거 확인
- [x] TypeScript 타입 에러 없음
- [x] 프로덕션 빌드 성공

### 선택 완료 항목
- [x] Light/Dark 모드 색상 검증
- [x] 접근성 테스트 완료
- [x] 성능 테스트 완료
- [x] 코드 리뷰 완료

---

## 예상 작업 시간

- Phase 1: TOC 컴포넌트 분리 - **30분**
- Phase 2: 레이아웃 변경 - **1시간**
- Phase 3: CSS 수정 - **15분**
- Phase 4: 테스트 및 검증 - **1시간**
- Phase 5: 정리 및 최종 확인 - **30분**

**총 예상 시간**: 약 3-4시간
