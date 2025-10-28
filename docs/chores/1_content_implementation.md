# Implementation: Article 페이지 목차(TOC) 개선

## 개요

Article 페이지의 목차를 본문 위에서 오른쪽 사이드바로 이동하고, heading underline 표시를 제거하는 최소 구현입니다.

---

## 구현 범위

### ✅ 포함되는 기능
1. TOC 컴포넌트 분리 및 생성
2. Article 페이지 레이아웃 변경 (2컬럼)
3. TOC 사이드바 sticky 포지셔닝
4. Article 본문 heading underline 제거
5. 반응형: 데스크톱(≥1024px)만 사이드바, 그 외는 상단 표시

### ❌ 제외되는 기능 (향후 개선)
- 현재 섹션 하이라이트 (Intersection Observer)
- 태블릿/모바일 전용 drawer/collapsible
- 고급 접근성 기능 (기본 ARIA는 포함)
- TOC item별 underline 조건부 표시

---

## 1. TOC 컴포넌트 분리

### 파일 생성
**경로**: `components/article/table-of-contents.tsx`

```tsx
'use client';

import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav className="space-y-1" aria-label="목차">
      <h2 className="text-sm font-semibold mb-4 text-foreground">목차</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              item.level === 2 && 'font-medium',
              item.level === 3 && 'ml-4 text-muted-foreground'
            )}
          >
            <a
              href={`#${item.id}`}
              className="hover:text-primary transition-colors block py-1"
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

**변경 사항**:
- `'use client'` 추가 (향후 Intersection Observer 대비)
- `aria-label` 추가 (기본 접근성)
- h2는 font-medium, h3는 ml-4 + muted color
- Hover 시 primary 색상 전환
- Underline 제거

---

## 2. Article 페이지 레이아웃 변경

### 파일 수정
**경로**: `app/[slug]/page.tsx`

#### 2.1 Import 추가
```tsx
// 상단에 추가
import { TableOfContents } from '@/components/article/table-of-contents';
```

#### 2.2 레이아웃 구조 변경

**변경 전** (86-142번 라인):
```tsx
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <header className="mb-8">...</header>
  <Separator className="mb-8" />
  
  {/* TOC - 전체 너비 */}
  {toc.length > 0 && (
    <aside className="mb-8 p-4 bg-muted rounded-lg">
      ...
    </aside>
  )}
  
  {/* Article Content */}
  <article className="prose ...">...</article>
  
  <Separator className="mb-8" />
  {/* Related Articles */}
  ...
</div>
```

**변경 후**:
```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  {/* Article Header - 전체 너비 */}
  <header className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Badge>{manifestArticle?.category || 'Uncategorized'}</Badge>
      <span className="text-sm text-muted-foreground">
        {formatDate(article.frontmatter.date)}
      </span>
      <span className="text-sm text-muted-foreground">
        · {readingTime}분 읽기
      </span>
    </div>

    <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>

    {article.frontmatter.excerpt && (
      <p className="text-xl text-muted-foreground mb-4">
        {article.frontmatter.excerpt}
      </p>
    )}

    {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {article.frontmatter.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    )}
  </header>

  <Separator className="mb-8" />

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

  <Separator className="mb-8" />

  {/* Related Articles - 전체 너비 */}
  {relatedArticles.length > 0 && (
    <section className="mb-8">
      ...
    </section>
  )}

  {/* Back to Home */}
  <div className="text-center">
    <Link
      href="/"
      className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      ← 목록으로 돌아가기
    </Link>
  </div>
</div>
```

**주요 변경점**:
1. `max-w-4xl` → `max-w-7xl` (사이드바 공간 확보)
2. `flex gap-8 lg:gap-12` 2컬럼 레이아웃
3. TOC 위치:
   - 데스크톱(≥1024px): 오른쪽 사이드바 sticky
   - 모바일/태블릿(<1024px): 본문 위에 표시 (기존 방식)
4. Sticky 포지셔닝: `top-24` (헤더 높이 고려)
5. `max-h-[calc(100vh-6rem)]` + `overflow-y-auto` (긴 목차 대응)

---

## 3. CSS 수정: Heading Underline 제거

### 파일 수정
**경로**: `app/globals.css`

**추가 위치**: 파일 끝 (416번 라인 이후)

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

**설명**:
- `.prose a[href^="#"]`: article 본문의 heading anchor 링크
- `text-decoration: none`: 기본 underline 제거
- `:hover`: hover 시에만 underline 표시 (선택 사항)
- Scrollbar 스타일: TOC가 길 때 깔끔한 스크롤바

---

## 4. 타입 정의 (이미 존재)

### 파일 확인
**경로**: `lib/markdown.ts`

```typescript
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}
```

**변경 없음**: 기존 인터페이스 사용

---

## 5. 디렉토리 구조 생성

```bash
mkdir -p components/article
```

---

## 구현 완료 후 예상 결과

### 데스크톱 (≥1024px)
```
┌─────────────────────────────────────────────┐
│         Article Header (full width)         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┬──────────────────┐   │
│  │                  │  TOC Sidebar     │   │
│  │  Article Content │  (sticky)        │   │
│  │                  │  - 목차          │   │
│  │                  │  - 스크롤 고정    │   │
│  │                  │                  │   │
│  └──────────────────┴──────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│         Related Articles (full width)       │
└─────────────────────────────────────────────┘
```

### 모바일/태블릿 (<1024px)
```
┌─────────────────────────────────┐
│        Article Header           │
├─────────────────────────────────┤
│     TOC (collapsible box)       │
├─────────────────────────────────┤
│        Article Content          │
├─────────────────────────────────┤
│       Related Articles          │
└─────────────────────────────────┘
```

---

## 테스트 체크리스트

### 기능 테스트
- [ ] 데스크톱에서 TOC가 오른쪽 사이드바에 표시됨
- [ ] TOC가 스크롤 시 상단에 고정됨 (sticky)
- [ ] 모바일/태블릿에서 TOC가 본문 위에 표시됨
- [ ] TOC 링크 클릭 시 해당 섹션으로 이동
- [ ] Article 본문 heading의 underline이 제거됨
- [ ] Article 콘텐츠 영역이 충분한 너비 유지

### 반응형 테스트
- [ ] 1920px: 사이드바 TOC 정상 표시
- [ ] 1280px: 사이드바 TOC 정상 표시
- [ ] 1024px: 사이드바 TOC 표시 (breakpoint)
- [ ] 768px: 상단 TOC 표시
- [ ] 375px: 상단 TOC 표시 (모바일)

### 시각적 테스트
- [ ] Light/Dark 모드에서 색상 정상
- [ ] TOC 스크롤바가 깔끔하게 표시
- [ ] 긴 TOC가 overflow-y-auto로 스크롤 가능
- [ ] 코드 블록 등이 레이아웃을 깨지 않음

---

## 향후 개선 사항 (현재 구현에서 제외)

1. **현재 섹션 하이라이트**
   - Intersection Observer API 사용
   - 활성 섹션에 primary 색상 적용

2. **TOC 접기/펴기 버튼**
   - 모바일에서 Collapsible 컴포넌트 사용
   - 초기 상태: 접힌 상태

3. **스크롤 Progress Bar**
   - Article 상단에 읽기 진행률 표시
   - TOC와 연동하여 위치 표시

4. **TOC item별 underline 감지**
   - Markdown에서 의도적인 underline 감지
   - `hasUnderline` 속성 추가

5. **키보드 네비게이션 강화**
   - Tab 네비게이션 최적화
   - Skip to content 링크

---

## 참고

### 사용한 기술
- Next.js 15 App Router
- Tailwind CSS (responsive utilities)
- CSS Sticky Positioning
- Semantic HTML5

### 관련 파일
- `app/[slug]/page.tsx` - Article 페이지
- `components/article/table-of-contents.tsx` - TOC 컴포넌트
- `lib/markdown.ts` - TOC 추출 로직
- `app/globals.css` - 글로벌 스타일
