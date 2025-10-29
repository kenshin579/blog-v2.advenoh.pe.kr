# Anchor 링크 스크롤 이슈 수정

## 문제 정의

### 현상
- TOC(목차)에서 anchor 링크 클릭 시 해당 제목으로 스크롤됨
- 그러나 sticky 헤더가 제목을 가려서 실제로는 제목이 화면 상단 밖으로 밀려남
- 사용자가 제목을 보려면 수동으로 스크롤을 조금 내려야 함

### 재현 방법
1. https://blog.advenoh.pe.kr/keycloak으로-자체-인증-서버-구축/#21-keycloak-설치 접속
2. 페이지가 "2.1 Keycloak 설치" 섹션으로 스크롤됨
3. 하지만 제목이 상단 헤더에 가려져 보이지 않음

### 영향 범위
- 모든 article 페이지의 anchor 링크 (`app/[slug]/page.tsx`)
- TOC 사이드바 링크 (`components/article/table-of-contents.tsx`)
- Article 콘텐츠 내부의 heading anchor 링크

---

## 원인 분석

### 관련 컴포넌트

#### 1. SiteHeader (`components/site-header.tsx`)
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="container px-4 flex h-14 items-center justify-between">
```
- **높이**: `h-14` = 56px (Tailwind: 14 * 4px)
- **위치**: `sticky top-0` - 화면 상단에 고정
- **z-index**: `z-50` - 다른 요소 위에 표시

#### 2. TableOfContents (`components/article/table-of-contents.tsx`)
```tsx
<a
  href={`#${item.id}`}
  className="hover:text-primary transition-colors block py-1"
>
  {item.text}
</a>
```
- 브라우저 기본 anchor 링크 사용
- JavaScript scroll 동작 없음

#### 3. Article Page (`app/[slug]/page.tsx`)
```tsx
<article
  className="prose prose-neutral dark:prose-invert max-w-none mb-12"
  dangerouslySetInnerHTML={{ __html: article.html }}
/>
```
- 마크다운 HTML이 직접 렌더링됨
- heading 요소에 id 속성이 있음 (markdown.ts에서 생성)

### 기술적 원인
1. **브라우저 기본 동작**: `<a href="#id">` 클릭 시 해당 요소의 정확한 위치로 스크롤
2. **Sticky 헤더 간섭**: 고정 헤더(56px)가 콘텐츠 위에 겹쳐져서 제목을 가림
3. **Scroll offset 부재**: heading 요소에 스크롤 여백이 설정되지 않음

---

## 해결 방안: CSS `scroll-margin-top` 사용

### 선택한 이유
1. **간단함**: CSS 3줄로 해결, JavaScript 불필요
2. **성능**: 브라우저 네이티브 동작 활용
3. **호환성**: 모던 브라우저 모두 지원 (IE 제외)
4. **유지보수**: heading 요소에만 적용, 부작용 없음

### 구현 상세
자세한 구현 방법은 **[1_anchor_implementation.md](1_anchor_implementation.md)** 참조

### 작업 체크리스트
단계별 TODO는 **[1_anchor_todo.md](1_anchor_todo.md)** 참조

---

## 관련 파일

### 수정 필요
- `app/globals.css` - scroll-margin-top 추가

### 영향받는 파일 (수정 불필요)
- `components/article/table-of-contents.tsx` - TOC 컴포넌트
- `app/[slug]/page.tsx` - Article 페이지
- `components/site-header.tsx` - 헤더 컴포넌트
- `lib/markdown.ts` - heading id 생성

---

## 참고 자료

- [MDN: scroll-margin-top](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top)
- [CSS Scroll Snap - scroll-padding vs scroll-margin](https://css-tricks.com/fixing-smooth-scrolling-with-find-on-page/)
- Browser support: https://caniuse.com/mdn-css_properties_scroll-margin-top
