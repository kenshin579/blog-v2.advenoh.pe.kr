# Sub-project #1: 디자인 시스템 기반 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bento 리디자인의 디자인 토큰(색상·반경·타이포·폰트·공통 utility 클래스)을 `blog-v2.advenoh.pe.kr`에 도입하여 후속 sub-project들이 일관된 시스템 위에서 작업할 수 있게 한다.

**Architecture:** 기존 shadcn/ui 토큰(HSL 기반 `--background`, `--card`, `--accent` 등)은 마이그레이션 기간 동안 그대로 유지하고, Bento 토큰은 **`--bento-*` namespace의 RGB 기반 변수**로 별도 추가한다. Tailwind에서도 `bento-*` 키로 노출되어 `bg-bento-bg`, `text-bento-ink`, `bg-bento-accent` 같은 utility로 사용한다. sub-project #9에서 shadcn 토큰이 모두 제거된 뒤 `bento-` prefix를 떼는 정리 작업을 한다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3.4, `next-themes` (light/dark), `next/font/google` (Instrument Serif · JetBrains Mono), `@fontsource-variable/pretendard` (Pretendard Variable webfont).

**브랜치:** 모든 작업은 `feature/redesign-bento` 브랜치 위에서 수행한다. 각 task가 끝나면 sub-PR을 만들거나 단일 브랜치에 누적 커밋한다.

**참고 spec:** `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (특히 §4 디자인 시스템 기반)

---

## Files Touched

- Modify: `app/globals.css` — `--bento-*` 변수(light + dark) + 공통 utility 클래스 + 폰트 변수 chain
- Modify: `tailwind.config.ts` — `bento-*` color 키 + `card-*` borderRadius + `canvas` maxWidth + `tightest` letterSpacing
- Modify: `app/layout.tsx` — `next/font/google`로 Instrument Serif / JetBrains Mono 로드, `@fontsource-variable/pretendard` import, `<body>` className에 폰트 변수 등록
- Modify: `package.json` — `@fontsource-variable/pretendard` 의존성 추가
- Create: `app/_dev/tokens/page.tsx` — 새 토큰 시각 참조 페이지 (sub-project #2~#8 작업 시 참고용)

---

## Naming Convention Note

기존 `--card`, `--accent` 와의 충돌을 피하기 위해 Bento 토큰은 모두 `--bento-*` prefix를 사용한다. 예를 들어 프로토타입의 `--bg` → `--bento-bg`, `--card` → `--bento-card`, `--accent` → `--bento-accent` 등. 프로토타입 컴포넌트 코드를 가져올 때 클래스명(`bg-bg`, `bg-card`, `bg-accent` 등)은 `bg-bento-bg`, `bg-bento-card`, `bg-bento-accent` 로 일괄 치환해야 함을 sub-project #2 이후 plan에 명시한다.

---

### Task 1: Bento 디자인 토큰 + utility 클래스 추가

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 새 CSS 변수와 utility 클래스를 `app/globals.css`에 추가**

기존 `:root { ... }` 블록 **끝에** 다음 라인을 추가한다 (124번째 줄 `}` 닫는 괄호 바로 위에 삽입):

```css
  /* ----- Bento design tokens (Light) ----- */
  --bento-bg: 242 239 234;          /* #F2EFEA */
  --bento-card: 255 255 255;
  --bento-ink: 15 15 15;
  --bento-dim: 107 107 107;
  --bento-cream: 248 244 237;
  --bento-accent: 255 91 34;         /* #FF5B22 */
  --bento-accent-soft: 255 217 201;  /* #FFD9C9 */
  --bento-sage: 217 228 212;
  --bento-rose: 245 213 203;
  --bento-lavender: 224 213 240;
  --bento-butter: 245 230 168;
  --bento-hero-dark: 15 15 15;
```

기존 `.dark { ... }` 블록 **끝에** (235번째 줄 `}` 닫는 괄호 바로 위에 삽입):

```css
  /* ----- Bento design tokens (Dark) ----- */
  --bento-bg: 22 21 18;              /* #161512 */
  --bento-card: 31 29 26;            /* #1F1D1A */
  --bento-ink: 244 241 234;
  --bento-dim: 140 133 122;
  --bento-cream: 38 35 31;
  --bento-accent: 255 91 34;
  --bento-accent-soft: 102 51 30;
  --bento-sage: 58 74 58;
  --bento-rose: 74 47 47;
  --bento-lavender: 58 48 80;
  --bento-butter: 74 66 32;
  --bento-hero-dark: 11 11 11;
```

파일 **맨 끝**에 공통 utility 클래스 추가:

```css

/* ----- Bento utilities ----- */
.bento-card {
  border-radius: 24px;
  background: rgb(var(--bento-card));
}

.headline-hi {
  background: rgb(var(--bento-butter));
  padding: 0 0.15em;
  border-radius: 4px;
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 400;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

- [ ] **Step 2: 타입 검사 — 통과 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
npm run check
```

기대 결과: 에러 없음 (CSS만 추가했으므로 TS 영향 없음).

- [ ] **Step 3: 프로덕션 빌드 — 통과 확인**

```bash
npm run build
```

기대 결과: 빌드 성공. `out/` 디렉토리 생성. CSS에 새 변수가 포함되었는지 확인:

```bash
grep -l "bento-bg" out/_next/static/css/*.css | head -1
```

기대 결과: 한 줄 출력 (변수가 빌드 산출물에 포함됨).

- [ ] **Step 4: 커밋**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
feat(design-system): Bento 디자인 토큰 + utility 클래스 추가

* --bento-* namespace (light + dark) 변수 추가 (bg/card/ink/dim/cream/accent/accent-soft/sage/rose/lavender/butter)
* 기존 shadcn/ui 토큰과 충돌 없이 공존
* .bento-card, .headline-hi, .no-scrollbar 공통 utility 클래스
* sub-project #1 디자인 시스템 기반의 첫 단계

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Tailwind config 확장

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: `bento-*` color 키 + 새 borderRadius / maxWidth / letterSpacing 추가**

`tailwind.config.ts`의 `theme.extend` 안에 다음 변경을 적용한다.

**기존 `colors` 객체 안에 `status` 키 바로 위쪽**(현재 line 82, `status: {` 직전)에 다음을 추가:

```ts
        // Bento namespace tokens
        "bento-bg": "rgb(var(--bento-bg) / <alpha-value>)",
        "bento-card": "rgb(var(--bento-card) / <alpha-value>)",
        "bento-ink": "rgb(var(--bento-ink) / <alpha-value>)",
        "bento-dim": "rgb(var(--bento-dim) / <alpha-value>)",
        "bento-cream": "rgb(var(--bento-cream) / <alpha-value>)",
        "bento-accent": "rgb(var(--bento-accent) / <alpha-value>)",
        "bento-accent-soft": "rgb(var(--bento-accent-soft) / <alpha-value>)",
        "bento-sage": "rgb(var(--bento-sage) / <alpha-value>)",
        "bento-rose": "rgb(var(--bento-rose) / <alpha-value>)",
        "bento-lavender": "rgb(var(--bento-lavender) / <alpha-value>)",
        "bento-butter": "rgb(var(--bento-butter) / <alpha-value>)",
        "bento-hero-dark": "rgb(var(--bento-hero-dark) / <alpha-value>)",
```

**기존 `borderRadius` 객체 안의 마지막 sm 키 다음**(line 15, `sm: ".1875rem",` 다음)에 추가:

```ts
        "card-sm": "12px",
        "card": "20px",
        "card-lg": "24px",
        "card-xl": "32px",
```

**`borderRadius` 블록과 `colors` 블록 사이**(line 17 직전)에 `maxWidth`와 `letterSpacing` 블록 신규 추가:

```ts
      maxWidth: {
        prose: "720px",
        canvas: "1280px",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
```

⚠️ Tailwind 빌트인 `maxWidth.prose`(65ch)는 Pretendard 기준 ~520-580px로 좁아져서 프로토타입 의도(720px)와 다르므로 override 한다. `grep -rn "max-w-prose"` 로 확인 시 현재 코드베이스에 사용처가 없어 안전. `letterSpacing.tight`(-0.025em)는 빌트인 그대로 사용. 프로토타입의 `tracking-tighter`(의도: -0.025em)는 후속 sub-project에서 컴포넌트 import 시 `tracking-tight`로 치환한다.

- [ ] **Step 2: 타입 검사**

```bash
npm run check
```

기대 결과: 에러 없음.

- [ ] **Step 3: 새 utility 클래스가 컴파일되는지 확인**

임시 검증 스니펫을 만들어 빌드. `app/page.tsx`나 컴포넌트는 건드리지 말고, build 후 CSS에 새 클래스 정의가 들어갔는지만 확인:

```bash
npm run build
grep -o "bg-bento-bg\|rounded-card-xl\|max-w-canvas\|tracking-tightest" out/_next/static/css/*.css | sort -u
```

기대 결과: 위 4개 클래스 중 일부는 아직 어디서도 사용되지 않아 출력이 비어 있을 수 있다. **Tailwind는 사용되지 않은 클래스를 purge** 하므로, 출력이 비어 있어도 정상. 다음 단계에서 dev 페이지로 검증한다.

- [ ] **Step 4: 커밋**

```bash
git add tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(design-system): Tailwind config 확장 — bento-* color, card-* radius, canvas/tightest

* colors.bento-* 12개 키 추가 (bg/card/ink/dim/cream/accent/accent-soft/sage/rose/lavender/butter/hero-dark)
* borderRadius card-sm/card/card-lg/card-xl 추가
* maxWidth.canvas (1280px), letterSpacing.tightest (-0.04em) 추가
* 기존 maxWidth.prose, letterSpacing.tight 는 Tailwind 빌트인 그대로 사용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 폰트 셋업 (Pretendard / Instrument Serif / JetBrains Mono)

**Files:**
- Modify: `package.json` (의존성 추가는 npm install이 처리)
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Pretendard 의존성 설치**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
npm install @fontsource-variable/pretendard
```

기대 결과: `package.json` `dependencies`에 `@fontsource-variable/pretendard` 추가됨. `package-lock.json` 갱신.

- [ ] **Step 2: `app/layout.tsx`에 폰트 import + 변수 등록**

`app/layout.tsx` 파일 상단(현재 line 1-7 imports 영역) 마지막 import 아래에 다음을 추가:

```ts
import '@fontsource-variable/pretendard';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-instrument',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});
```

그리고 `<body>` 태그(현재 line 84)를 다음으로 교체:

```tsx
      <body className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
```

- [ ] **Step 3: `app/globals.css`의 폰트 변수 chain 갱신**

`app/globals.css`에서 line 80~82의 폰트 변수 정의를 다음으로 교체한다.

**기존**:
```css
  --font-sans: Inter, system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

**변경 후**:
```css
  --font-sans: 'Pretendard Variable', Inter, system-ui, -apple-system, sans-serif;
  --font-serif: var(--font-instrument), Georgia, serif;
  --font-mono: var(--font-jetbrains), 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

`.dark` 블록은 폰트 변수가 정의되어 있지 않아서 그대로 둔다 (라이트와 폰트는 동일).

- [ ] **Step 4: 타입 검사**

```bash
npm run check
```

기대 결과: 에러 없음.

- [ ] **Step 5: 프로덕션 빌드 + 폰트 자산 확인**

```bash
npm run build
ls out/_next/static/media/ 2>&1 | head -20
```

기대 결과: 빌드 성공. `out/_next/static/media/` 에 woff2 파일들이 생성됨 (Pretendard, Instrument Serif, JetBrains Mono).

- [ ] **Step 6: 개발 서버에서 폰트 로드 시각 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속. devtools Network 탭에서 woff2 파일 로드 확인:

- `Pretendard Variable` (또는 `pretendard-*.woff2`)
- `Instrument_Serif-*.woff2`
- `JetBrains_Mono-*.woff2`

페이지 시각 검증: 본문이 Pretendard로 렌더링되는지 확인. (Inter → Pretendard 시각 차이는 미세하지만 알아볼 수 있는 수준)

dev 서버 종료: `Ctrl+C`.

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json app/layout.tsx app/globals.css
git commit -m "$(cat <<'EOF'
feat(design-system): Pretendard / Instrument Serif / JetBrains Mono 폰트 로딩

* @fontsource-variable/pretendard 의존성 추가 (variable font)
* next/font/google 로 Instrument Serif (italic 400) · JetBrains Mono 로드
* --font-sans/serif/mono chain 을 새 폰트 변수로 갱신
* Tailwind config 의 sans/serif/mono fontFamily 키는 그대로 (--font-* 변수 참조)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 토큰 시각 참조 페이지 추가 (`/_dev/tokens`)

**Files:**
- Create: `app/_dev/tokens/page.tsx`

이 페이지는 후속 sub-project #2~#8 구현 시 색상/타이포/반경을 시각적으로 확인하는 reference. 프로덕션 빌드에 포함되지만 sitemap에는 추가하지 않으므로 일반 사용자에게 노출되지 않음. sub-project #9에서 삭제할 수도 있다 (정리 작업 시 결정).

- [ ] **Step 1: `app/_dev/tokens/page.tsx` 생성**

```tsx
export const metadata = {
  title: 'Design Tokens (dev)',
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: 'bg', key: 'bento-bg' },
  { name: 'card', key: 'bento-card' },
  { name: 'ink', key: 'bento-ink' },
  { name: 'dim', key: 'bento-dim' },
  { name: 'cream', key: 'bento-cream' },
  { name: 'accent', key: 'bento-accent' },
  { name: 'accent-soft', key: 'bento-accent-soft' },
  { name: 'sage', key: 'bento-sage' },
  { name: 'rose', key: 'bento-rose' },
  { name: 'lavender', key: 'bento-lavender' },
  { name: 'butter', key: 'bento-butter' },
  { name: 'hero-dark', key: 'bento-hero-dark' },
] as const;

const RADII = [
  { name: 'card-sm', key: 'card-sm' },
  { name: 'card', key: 'card' },
  { name: 'card-lg', key: 'card-lg' },
  { name: 'card-xl', key: 'card-xl' },
] as const;

export default function TokensPage() {
  return (
    <main className="min-h-screen bg-bento-bg p-10 text-bento-ink">
      <div className="mx-auto max-w-canvas space-y-12">
        <header>
          <h1 className="text-5xl font-bold tracking-tightest">Design Tokens</h1>
          <p className="mt-2 text-bento-dim">Sub-project #1 reference. Not indexed.</p>
        </header>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Colors</h2>
          <div className="grid grid-cols-4 gap-4">
            {COLORS.map((c) => (
              <div key={c.key} className="rounded-card bento-card overflow-hidden">
                <div className={`h-24 bg-${c.key}`} />
                <div className="p-3 text-sm">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-bento-dim">bg-{c.key}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Border Radii</h2>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r.key} className="text-center">
                <div className={`h-24 w-24 bg-bento-accent rounded-${r.key}`} />
                <div className="mt-2 text-xs text-bento-dim">rounded-{r.key}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Typography</h2>
          <div className="space-y-3">
            <div className="text-[88px] font-bold leading-[0.95] tracking-tightest">
              Field notes <span className="headline-hi">from</span> a working engineer.
            </div>
            <div className="text-4xl font-bold tracking-tighter">Heading 2 · tracking-tighter</div>
            <div className="text-2xl font-bold tracking-tight">Heading 3 · tracking-tight</div>
            <div className="text-base">Body text · 기본 본문 스타일 (Pretendard Variable)</div>
            <div className="text-base font-serif italic">Instrument Serif italic — pull quote 같은 강조용</div>
            <div className="text-sm font-mono">font-mono · JetBrains Mono 13px</div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Utility class samples</h2>
          <div className="space-y-3">
            <div className="bento-card p-6">
              <div className="font-semibold">.bento-card</div>
              <div className="text-sm text-bento-dim">border-radius 24px · bg rgb(var(--bento-card))</div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-10 w-32 flex-shrink-0 rounded-card-sm bg-bento-sage" />
              ))}
              <p className="self-center text-xs text-bento-dim">.no-scrollbar (가로 스크롤)</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
npm run check
```

기대 결과: 에러 없음.

- [ ] **Step 3: 개발 서버 시각 확인**

```bash
npm run dev
```

브라우저: `http://localhost:3000/_dev/tokens`

확인 사항:
- 12개 색상 카드가 라이트 모드 색상으로 렌더링됨
- 4개 반경 사각형이 12 / 20 / 24 / 32 px 곡률로 표시됨
- "Field notes from a working engineer." headline에서 "from" 단어가 butter 배경 + italic으로 강조됨
- 가로 스크롤 영역에서 스크롤바가 보이지 않음

다크 모드 확인:
- 사이트 헤더의 theme toggle 버튼을 클릭(또는 OS 다크 모드 활성화)
- 색상 카드가 다크 색상으로 변환되는지 확인

dev 종료: `Ctrl+C`.

- [ ] **Step 4: 프로덕션 빌드에서 페이지 생성 확인**

```bash
npm run build
ls -la out/_dev/tokens/ 2>&1
```

기대 결과: `out/_dev/tokens/index.html` 존재.

- [ ] **Step 5: 커밋**

```bash
git add app/_dev/tokens/page.tsx
git commit -m "$(cat <<'EOF'
feat(design-system): /_dev/tokens — Bento 토큰 시각 참조 페이지

* sub-project #2~#8 작업 시 색상/타이포/반경을 시각적으로 확인하는 reference 페이지
* robots: noindex (sitemap 미포함)
* sub-project #9에서 삭제 검토 (선택)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 회귀 검증 (기존 페이지가 깨지지 않았는지 확인)

이 task는 코드 변경 없이 검증만 한다. 커밋 없음.

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
npm run check
```

기대 결과: 에러 없음.

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
npm run build
```

기대 결과: 빌드 성공. `out/` 디렉토리에 모든 기존 라우트 + `_dev/tokens` 포함.

```bash
ls out/ | head -30
```

기대 결과: `index.html` (홈), `series/`, `tags/`, `404.html`, 그리고 기존 article slug 디렉토리들이 존재. `_dev/` 도 포함.

- [ ] **Step 3: 개발 서버에서 기존 페이지 시각 확인 (회귀 테스트)**

```bash
npm run dev
```

다음 URL을 순서대로 방문하면서 **현재 시각 그대로** 렌더링되는지 확인 (Bento 토큰은 *추가만* 되었고 *사용된 곳이 없으므로* 모든 기존 페이지는 변경 전과 동일해야 함):

- `http://localhost:3000/` — 홈 (shadcn 카드 그리드)
- `http://localhost:3000/series` — 시리즈 인덱스
- `http://localhost:3000/tags` — 태그 인덱스 (bubble chart)
- `http://localhost:3000/{기존 글 slug 아무거나}` — article 페이지

각 페이지에서 다음을 확인:
- 폰트가 Pretendard로 바뀐 것 외에는 시각적 변화 없음 (헤더 / 카드 / 색상 모두 그대로)
- 콘솔 에러 없음
- light/dark 토글 정상 동작

⚠️ 회귀가 발견되면 Task 1~4 중 어느 단계에서 변경된 부분 때문인지 추적하고 수정 후 이 Step을 다시 수행.

dev 종료: `Ctrl+C`.

- [ ] **Step 4: 브랜치 상태 확인 (sub-PR 머지 또는 누적 커밋 결정)**

```bash
git log --oneline feature/redesign-bento ^main
```

기대 결과: 4개 커밋이 보임 (Task 1~4의 커밋).

이 시점에서 다음 중 하나 선택:
- **Option A: 통합 브랜치에 그대로 누적** — sub-project #2 plan으로 이동
- **Option B: 임시 push + 셀프 리뷰** — `git push -u origin feature/redesign-bento` 후 GitHub에서 diff 확인 (선택)
- **Option C: sub-PR 머지** — `sub01-design-system-foundation` 브랜치를 따로 떼서 PR 만들고 `feature/redesign-bento`에 머지. 이 경우 추가 사전 작업 필요 (브랜치 재구성). 현재 셋업에서는 통합 브랜치에 직접 누적하는 게 단순.

기본은 Option A 권장.

---

## Self-Review Notes

- **Spec coverage**: §4.1 토큰 (Task 1) · §4.2 Tailwind 확장 (Task 2) · §4.3 폰트 (Task 3) · §4.4 ThemeProvider (변경 없음, 재사용 명시) · §4.5 utility 클래스 (Task 1) · §4.6 영향 범위 (모든 task의 Files 섹션) — 모두 커버됨.
- **Placeholder scan**: TBD/TODO 없음. 모든 코드 스니펫이 실제 작성 가능한 완성형.
- **Type consistency**: 변수명·utility 클래스명·Tailwind 키 모두 plan 내 일관됨 (`--bento-*` / `bento-*`).
- **결정된 트레이드오프**:
  - Tailwind 빌트인 `maxWidth.prose`(65ch)와 `letterSpacing.tight`(-0.025em)는 그대로 사용 → 프로토타입 `tracking-tighter`는 후속 sub-project에서 `tracking-tight`로 치환 필요. 이 사항은 sub-project #2 plan에 명시.
  - `_dev/tokens` 페이지는 프로덕션 빌드에 포함되지만 robots noindex로 검색에서 배제. sub-project #9 정리 시 삭제 여부 결정.
