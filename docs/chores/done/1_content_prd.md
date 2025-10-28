# PRD: Article 페이지 목차(TOC) 개선

## 1. 개요

### 1.1 배경
현재 블로그의 Article 페이지에서 목차(Table of Contents)가 article 콘텐츠 위에 표시되고 있으며, 모든 heading 항목이 underline으로 표시되는 문제가 있습니다. 이는 사용자 경험과 디자인 일관성 측면에서 개선이 필요합니다.

### 1.2 목표
- 목차를 article 오른쪽에 고정된 사이드바로 배치하여 가독성과 접근성 향상
- underline이 실제로 있는 heading만 목차에서 표시하도록 조건부 렌더링 구현

### 1.3 관련 이슈
- 목차 위치 최적화: article 읽기 경험 개선
- underline 표시 정확성: 실제 콘텐츠 구조 반영

---

## 2. 현재 상태 분석

### 2.1 현재 구조
**파일**: `app/[slug]/page.tsx` (121-142번 라인)

```tsx
{/* Table of Contents */}
{toc.length > 0 && (
  <aside className="mb-8 p-4 bg-muted rounded-lg">
    <h2 className="text-lg font-semibold mb-3">목차</h2>
    <nav>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? 'ml-4' : ''}
          >
            <a
              href={`#${item.id}`}
              className="text-sm hover:text-primary transition-colors"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
)}
```

**위치**: article 콘텐츠 위에 표시 (전체 너비)

### 2.2 TOC 추출 로직
**파일**: `lib/markdown.ts` (88-102번 라인)

```typescript
export function extractTOC(html: string): TOCItem[] {
  const headingRegex = /<h([2-3])\s+id="([^"]+)">(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[2-3]>/g;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      id: match[2],
      text: match[3],
      level: parseInt(match[1]),
    });
  }

  return toc;
}
```

### 2.3 Markdown 처리
**파일**: `lib/markdown.ts` (42-54번 라인)

```typescript
const result = await unified()
  .use(remarkParse) // markdown → mdast
  .use(remarkGfm) // GitHub Flavored Markdown 지원
  .use(remarkRehype) // mdast → hast
  .use(rehypeSlug) // heading에 id 추가
  .use(rehypeAutolinkHeadings, {
    behavior: 'wrap',
  }) // heading 자동 링크
  .use(rehypePrism, {
    showLineNumbers: true,
  }) // 코드 하이라이팅
  .use(rehypeStringify) // hast → HTML
  .process(content);
```

**문제점**: `rehypeAutolinkHeadings`가 모든 heading을 `<a>` 태그로 감싸면서 Tailwind `prose` 클래스가 자동으로 underline을 적용

### 2.4 현재 페이지 레이아웃
```
┌─────────────────────────────────┐
│        Article Header           │
├─────────────────────────────────┤
│     Separator                   │
├─────────────────────────────────┤
│     TOC (전체 너비)              │
├─────────────────────────────────┤
│     Article Content             │
│     (prose 클래스)               │
├─────────────────────────────────┤
│     Related Articles            │
└─────────────────────────────────┘
```

---

## 3. 요구사항

### 3.1 기능 요구사항

#### FR-1: 목차 위치 변경
**우선순위**: High
- **현재**: article 콘텐츠 위에 전체 너비로 표시
- **개선**: article 오른쪽에 고정된 사이드바로 배치
- **레이아웃 구조**:
  ```
  ┌─────────────────────────────────────────────┐
  │           Article Header                    │
  ├─────────────────────────────────────────────┤
  │  Article Content  │  TOC Sidebar (sticky)   │
  │  (좌측 60-70%)    │  (우측 30-40%)          │
  │                   │  - 스크롤 시 상단 고정   │
  │                   │  - 현재 섹션 하이라이트  │
  ├─────────────────────────────────────────────┤
  │           Related Articles                  │
  └─────────────────────────────────────────────┘
  ```

#### FR-2: Underline 조건부 표시
**우선순위**: Medium
- **현재**: 모든 heading 항목이 underline으로 표시됨
- **개선**: 실제로 underline이 있는 heading만 TOC에서 underline 표시
- **구현 방식**:
  1. HTML 파싱 시 heading의 텍스트 decoration 속성 확인
  2. `TOCItem` 인터페이스에 `hasUnderline` 속성 추가
  3. 조건부 클래스 적용: `underline` vs `no-underline`

### 3.2 비기능 요구사항

#### NFR-1: 반응형 디자인
- **데스크톱 (≥1024px)**: 사이드바 목차 표시
- **태블릿 (768px-1023px)**: 접을 수 있는 목차 또는 상단 배치
- **모바일 (<768px)**: 접을 수 있는 목차 또는 숨김

#### NFR-2: 성능
- TOC 렌더링이 페이지 로딩 성능에 영향을 주지 않아야 함
- Sticky 포지셔닝이 스크롤 성능을 저하시키지 않아야 함

#### NFR-3: 접근성
- 키보드 네비게이션 지원
- 스크린 리더 호환성 (ARIA 레이블)
- 충분한 색상 대비율

---

## 4. 기술 구현 계획

### 4.1 레이아웃 변경

#### 4.1.1 Article 페이지 리팩토링
**파일**: `app/[slug]/page.tsx`

**변경 전**:
```tsx
<div className="container mx-auto px-4 py-8 max-w-4xl">
  {/* Article Header */}
  <Separator />
  {/* TOC */}
  {/* Article Content */}
  {/* Related Articles */}
</div>
```

**변경 후**:
```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  {/* Article Header */}
  <Separator />

  <div className="flex gap-8">
    {/* Main Content */}
    <article className="flex-1 min-w-0">
      {/* Article Content */}
    </article>

    {/* TOC Sidebar */}
    {toc.length > 0 && (
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <TableOfContents items={toc} />
        </div>
      </aside>
    )}
  </div>

  {/* Related Articles */}
</div>
```

#### 4.1.2 TOC 컴포넌트 분리
**새 파일**: `components/article/table-of-contents.tsx`

```tsx
interface TOCItem {
  id: string;
  text: string;
  level: number;
  hasUnderline?: boolean;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Intersection Observer로 현재 섹션 추적
  useEffect(() => {
    // Implementation...
  }, [items]);

  return (
    <nav className="space-y-1">
      <h2 className="text-sm font-semibold mb-4">목차</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              'text-sm',
              item.level === 3 && 'ml-4'
            )}
          >
            <a
              href={`#${item.id}`}
              className={cn(
                'hover:text-primary transition-colors',
                activeId === item.id && 'text-primary font-medium',
                item.hasUnderline && 'underline'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### 4.2 Underline 감지 로직

#### 4.2.1 TOCItem 인터페이스 확장
**파일**: `lib/markdown.ts`

```typescript
export interface TOCItem {
  id: string;
  text: string;
  level: number;
  hasUnderline?: boolean;  // 추가
}
```

#### 4.2.2 extractTOC 함수 개선
**파일**: `lib/markdown.ts`

```typescript
export function extractTOC(html: string): TOCItem[] {
  // h2, h3 태그 매칭 (style 속성 포함)
  const headingRegex = /<h([2-3])\s+([^>]*)id="([^"]+)"([^>]*)>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[2-3]>/g;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const level = parseInt(match[1]);
    const id = match[3];
    const text = match[5];

    // style 속성에서 text-decoration 확인
    const hasUnderline = /text-decoration:\s*underline|text-decoration-line:\s*underline/.test(fullTag);

    toc.push({
      id,
      text,
      level,
      hasUnderline,
    });
  }

  return toc;
}
```

**대안 방식**: Markdown 파싱 단계에서 감지
- `remark` 플러그인으로 markdown AST에서 heading의 text decoration 확인
- HTML 변환 전에 metadata 수집

### 4.3 반응형 구현

#### 4.3.1 브레이크포인트 정의
```css
/* Desktop: 사이드바 목차 표시 */
@media (min-width: 1024px) {
  .toc-sidebar { display: block; }
}

/* Tablet: 접을 수 있는 목차 */
@media (min-width: 768px) and (max-width: 1023px) {
  .toc-collapsible { display: block; }
}

/* Mobile: 숨김 또는 drawer */
@media (max-width: 767px) {
  .toc-sidebar { display: none; }
}
```

#### 4.3.2 모바일 TOC 대안
- **옵션 1**: Sheet 컴포넌트로 drawer 구현
- **옵션 2**: 상단 접을 수 있는 영역
- **옵션 3**: 완전 숨김 (스크롤 progress bar로 대체)

---

## 5. 테스트 계획

### 5.1 기능 테스트
- [ ] TOC가 article 오른쪽 사이드바에 정확히 표시됨
- [ ] Sticky 포지셔닝이 스크롤 시 올바르게 동작함
- [ ] 현재 섹션이 TOC에서 하이라이트됨
- [ ] Underline이 있는 heading만 TOC에서 underline 표시
- [ ] 반응형 레이아웃이 모든 화면 크기에서 올바르게 동작함

### 5.2 시각적 회귀 테스트
- [ ] 데스크톱 (1920px, 1440px, 1280px)
- [ ] 태블릿 (1024px, 768px)
- [ ] 모바일 (375px, 320px)

### 5.3 접근성 테스트
- [ ] 키보드 네비게이션 (Tab, Enter)
- [ ] 스크린 리더 테스트 (VoiceOver, NVDA)
- [ ] 색상 대비율 검증 (WCAG 2.1 AA)

### 5.4 성능 테스트
- [ ] Lighthouse 성능 점수 ≥90
- [ ] 스크롤 성능 (60fps 유지)
- [ ] TOC 렌더링 시간 <100ms

---

## 6. 마일스톤

### Phase 1: 레이아웃 개편 (우선순위: High)
- [ ] TOC 컴포넌트 분리
- [ ] Article 페이지 레이아웃 변경
- [ ] Sticky 포지셔닝 구현
- [ ] 현재 섹션 하이라이트 기능

**예상 작업 시간**: 4-6시간

### Phase 2: Underline 조건부 표시 (우선순위: Medium)
- [ ] TOCItem 인터페이스 확장
- [ ] extractTOC 함수 개선
- [ ] 조건부 렌더링 로직 구현
- [ ] 테스트 및 검증

**예상 작업 시간**: 2-3시간

### Phase 3: 반응형 최적화 (우선순위: Medium)
- [ ] 태블릿/모바일 레이아웃 구현
- [ ] 브레이크포인트별 테스트
- [ ] 접근성 개선
- [ ] 성능 최적화

**예상 작업 시간**: 3-4시간

---

## 7. 성공 지표

### 7.1 사용자 경험
- TOC 접근성 향상: 스크롤 없이 article 전체 구조 파악 가능
- 현재 위치 추적: active section 하이라이트로 독자의 위치 인식 개선

### 7.2 기술 지표
- 페이지 로딩 성능: Lighthouse 점수 유지 또는 향상
- 스크롤 성능: 60fps 유지
- 반응형 호환성: 모든 화면 크기에서 정상 동작

### 7.3 코드 품질
- 컴포넌트 재사용성: TOC 컴포넌트 분리로 유지보수성 향상
- 타입 안정성: TypeScript 타입 정의 완료
- 테스트 커버리지: 주요 기능 테스트 완료

---

## 8. 잠재적 위험 및 대응

### 8.1 레이아웃 변경으로 인한 콘텐츠 너비 감소
**위험**: article 콘텐츠 영역이 좁아져 가독성 저하
**대응**:
- max-w-7xl로 전체 컨테이너 확장
- 코드 블록 등은 가로 스크롤 유지
- 반응형 브레이크포인트 세밀 조정

### 8.2 Sticky 포지셔닝 성능 문제
**위험**: 스크롤 시 성능 저하 (jank)
**대응**:
- CSS transform/opacity만 사용
- Intersection Observer 디바운싱
- will-change 속성 활용

### 8.3 Underline 감지 정확도
**위험**: HTML 파싱으로 underline 감지 실패
**대응**:
- 정규식 패턴 다양화
- 테스트 케이스 확장
- 대안: markdown AST 파싱 단계에서 감지

### 8.4 반응형 레이아웃 복잡도 증가
**위험**: 다양한 화면 크기 지원으로 버그 증가
**대응**:
- 단계별 브레이크포인트 테스트
- 시각적 회귀 테스트 자동화
- 모바일 우선 접근 방식

---

## 9. 참고 자료

### 9.1 유사 구현 사례
- [Next.js Documentation](https://nextjs.org/docs): 우측 사이드바 TOC
- [MDN Web Docs](https://developer.mozilla.org): Sticky TOC with active tracking
- [React Documentation](https://react.dev): 반응형 TOC 구현

### 9.2 기술 문서
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [CSS Sticky Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 9.3 관련 라이브러리
- [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings)
- [remark-toc](https://github.com/remarkjs/remark-toc)
- [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer)
