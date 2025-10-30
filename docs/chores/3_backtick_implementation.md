# 인라인 코드 스타일링 구현 가이드

## 구현 개요
마크다운의 backtick(`)으로 감싼 인라인 코드에 회색 배경을 적용하는 CSS 스타일 추가

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **스타일링**: Tailwind CSS
- **마크다운 처리**: unified + remark + rehype

## 구현 방안

### 1. globals.css 스타일 추가

**파일 경로**: `app/globals.css`

**추가 위치**: 라인 424 이후 (`.prose a[href^="#"]:hover` 다음)

**추가할 CSS 코드**:
```css
/* 인라인 코드 스타일 (backtick으로 감싼 텍스트) */
.prose code:not([class*="language-"]) {
  @apply font-mono text-sm px-1.5 py-0.5 rounded;
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
}

/* 코드 블록 안의 인라인 코드는 별도 배경 없음 */
.prose pre code {
  @apply p-0 bg-transparent;
}
```

### 2. 스타일 상세 설명

#### 인라인 코드 선택자
```css
.prose code:not([class*="language-"])
```
- `.prose`: Article 페이지의 prose 컨테이너 내부만 적용
- `code:not([class*="language-"])`: class가 없는 `<code>` 태그만 선택
- 코드 블록의 `<code class="language-*">` 태그는 제외

#### 스타일 속성
- `font-mono`: monospace 폰트 (JetBrains Mono)
- `text-sm`: 작은 폰트 크기 (14px)
- `px-1.5`: 좌우 패딩 6px
- `py-0.5`: 상하 패딩 2px
- `rounded`: 모서리 둥글게 (border-radius: 0.25rem)
- `background-color: hsl(var(--muted))`: 테마 변수 사용 (Light/Dark 자동 전환)
- `color: hsl(var(--foreground))`: 텍스트 색상

#### 코드 블록 내부 코드
```css
.prose pre code
```
- 코드 블록(`<pre>`) 안의 `<code>`는 패딩과 배경 제거
- 코드 블록의 배경이 이미 적용되어 있으므로 중복 방지

### 3. 테마 변수 참조

**Light 모드** (`app/globals.css` 라인 59-61):
```css
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;
--foreground: 222 47% 11%;
```

**Dark 모드** (`app/globals.css` 라인 177-179):
```css
--muted: 217 33% 17%;
--muted-foreground: 215 20% 65%;
--foreground: 210 40% 98%;
```

## 구현 후 확인사항

### 1. 시각적 확인
- 인라인 코드가 회색 배경으로 표시되는가?
- Light/Dark 모드 전환 시 배경색이 적절하게 변경되는가?
- 패딩과 border-radius가 적용되어 보기 좋은가?

### 2. 기능 확인
- 코드 블록(```로 감싼 부분)은 기존 스타일 유지하는가?
- 인라인 코드와 코드 블록이 명확히 구분되는가?
- 모바일/데스크톱 모두에서 정상 작동하는가?

### 3. 접근성 확인
- 색상 대비(contrast ratio)가 충분한가?
- 텍스트가 읽기 쉬운가?

## 테스트 샘플

테스트할 마크다운 예시:
```markdown
M1 맥북 + `golang` + `memongo` 조합으로 개발하고 있다면...

해결책은 2가지가 있고 개인적으로 `memongo` 옵션을 기억해서...

\`\`\`bash
npm run dev
\`\`\`
```

기대 결과:
- `golang`, `memongo`: 회색 배경 인라인 코드
- 코드 블록: 기존 스타일 유지

## 롤백 방법

문제 발생 시 추가한 CSS 코드를 제거하면 됩니다:
```bash
# 변경 전 상태로 복구
git checkout app/globals.css
```
