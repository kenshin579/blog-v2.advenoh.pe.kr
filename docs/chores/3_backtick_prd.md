# 인라인 코드 스타일링 PRD (Product Requirements Document)

## 개요
마크다운 article에서 backtick(`)으로 감싼 인라인 코드 텍스트에 회색 배경을 적용하여 가독성을 향상시킨다.

## 배경
- 현재 article의 인라인 코드(`<code>` 태그)에 배경 스타일이 적용되지 않아 일반 텍스트와 구분이 어려움
- 이미지에서 보이는 것처럼 `S&P500`, `코스피`, `코스닥` 등의 인라인 코드가 회색 배경으로 강조되어야 함
- Medium, Dev.to 등 주요 개발 블로그 플랫폼에서 표준으로 사용하는 패턴

## 현재 시스템 분석

### 프로젝트 구조
- **프레임워크**: Next.js (App Router)
- **마크다운 처리**: unified + remark + rehype 파이프라인 (`lib/markdown.ts`)
- **스타일링**: Tailwind CSS + Typography plugin
- **글로벌 CSS**: `app/globals.css`

### 마크다운 → HTML 변환 플로우
1. 마크다운 파일 (`contents/**/*.md`) 읽기
2. `lib/markdown.ts`의 `parseMarkdown()` 함수로 처리
3. unified 파이프라인: markdown → mdast → hast → HTML
4. 인라인 코드 backtick(`) → `<code>` 태그로 변환
5. Article 페이지 (`app/[slug]/page.tsx`)에서 `prose` 클래스로 렌더링

### 현재 스타일 상태
**`app/globals.css` (라인 355-360):**
```css
code[class*="language-"],
pre[class*="language-"] {
  @apply font-mono text-sm md:text-base leading-relaxed;
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
}
```
- 위 스타일은 코드 블록(`<pre><code class="language-*">`)에만 적용됨
- 인라인 코드(`<code>` without class)에는 적용되지 않음

## 요구사항

### 기능 요구사항
1. **인라인 코드 배경 적용**
   - 마크다운의 backtick(`)으로 감싼 텍스트에 회색 배경 적용
   - HTML: `<code>` 태그 (class 속성 없음)

2. **Light/Dark 모드 지원**
   - Light 모드: 밝은 회색 배경
   - Dark 모드: 어두운 회색 배경
   - 기존 Tailwind 테마 변수 활용

3. **스타일 세부사항**
   - 배경색: `hsl(var(--muted))` 사용 (기존 테마 시스템과 일관성)
   - 텍스트 색상: 약간 강조된 색상 (선택 사항)
   - 패딩: 좌우 여백으로 배경이 텍스트를 감싸도록
   - 모서리: 약간 둥글게 (border-radius)
   - 폰트: monospace 계열 (`var(--font-mono)`)

### 비기능 요구사항
1. **기존 코드 블록 스타일 유지**
   - `<pre><code class="language-*">` 스타일은 변경하지 않음

2. **Tailwind Typography(prose) 호환성**
   - Article 페이지의 `prose` 클래스와 충돌 없어야 함

3. **접근성**
   - 충분한 색상 대비(contrast ratio) 유지

## 성공 기준
1. ✅ 마크다운의 backtick 텍스트가 회색 배경으로 표시됨
2. ✅ Light/Dark 모드에서 적절한 배경색 표시
3. ✅ 코드 블록(`<pre><code>`)의 스타일은 변경되지 않음
4. ✅ 기존 article들이 정상적으로 렌더링됨
5. ✅ 모바일/데스크톱 모두에서 정상 작동

## 우선순위
- **Priority**: P1 (높음)
- **Estimated Effort**: 10분 (CSS 수정만 필요)
- **Risk**: 낮음 (간단한 스타일 추가)

## 관련 문서
- **구현 가이드**: [3_backtick_implementation.md](./3_backtick_implementation.md)
- **TODO 체크리스트**: [3_backtick_todo.md](./3_backtick_todo.md)
- **Design Guidelines**: [design_guidelines.md](../../design_guidelines.md)

## 참고
- 기존 CSS: `app/globals.css`
- Article 렌더링: `app/[slug]/page.tsx`
- Markdown 처리: `lib/markdown.ts`
