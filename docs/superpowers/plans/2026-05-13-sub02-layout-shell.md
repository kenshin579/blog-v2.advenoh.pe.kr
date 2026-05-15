# Sub-project #2: 공통 레이아웃 셸 (Header + Footer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bento 디자인 시스템 위에 새 Header(워드마크 · pill nav · search trigger · theme toggle · RSS · 모바일 드로어) 와 Footer 색상 토큰 매핑을 적용한다. 후속 sub-project #3~#8 의 모든 페이지가 새 레이아웃 셸 안에서 렌더링된다.

**Architecture:** `components/site-header.tsx` 를 전면 재작성하여 Bento 헤더로 교체. Search 트리거는 sub-project #3 의 Command-K 가 완성될 때까지 기존 `SearchDialog` 를 그대로 호출 (sub-project #3 에서 swap). 모바일은 shadcn `Sheet` 컴포넌트로 햄버거 드로어 구성. `components/site-footer.tsx` 는 구조 유지하고 색상 토큰만 `bento-*` 로 매핑.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3.4 (`bento-*` 토큰 — sub-project #1 도입), `next-themes`, `lucide-react` (아이콘), shadcn `Sheet`/`Button` (이미 `components/ui/` 에 존재).

**브랜치:** 모든 작업은 `feature/redesign-bento` 위에서. sub-PR 또는 누적 커밋. `main` 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§5 공통 레이아웃 셸)
- prototype 참고: `docs/design/blog-v3-bento/components/header.tsx` (5색 accent picker 는 채택 안 함)

---

## Files Touched

- Modify (전면 재작성): `components/site-header.tsx`
- Modify (색상 토큰만): `components/site-footer.tsx`
- 의존: 기존 파일 (변경 없음)
  - `components/ui/sheet.tsx` — shadcn Sheet (모바일 드로어)
  - `components/ui/button.tsx` — shadcn Button
  - `components/theme-provider.tsx` — next-themes wrapper
  - `components/search-dialog.tsx` — 기존 검색 모달 (sub-project #3 에서 CommandK 로 교체)
  - `components/social-links.tsx` — 기존 소셜 링크 (Header 에는 사용하지 않음, Footer 에 그대로 유지)

---

## Design Decisions

### 1. Posts 라우트
`/posts` 는 sub-project #4 에서 생성된다. 그때까지 nav 의 Posts 클릭 시 404 페이지 노출 (production 미배포 상태 + main 머지 시점에 #4 도 끝나 있어 OK).

### 2. Search 트리거
sub-project #3 의 Command-K 가 끝날 때까지 기존 `SearchDialog` 를 호출. sub-project #3 의 plan Task 안에서 `<SearchDialog>` → `<CommandK>` 1줄 교체.

### 3. 워드마크 카피
spec §5.1 대로 기본값 `frank.blog` 사용. F 로고는 `bg-bento-accent` 정사각 + 흰색 글자.

### 4. Sticky 헤더
기존 헤더의 `sticky top-0 z-50` + `backdrop-blur` 유지. 배경은 `bg-bento-bg/95` 로 변경.

### 5. SocialLinks
spec §5.1 의 새 헤더 요소 목록에 SocialLinks 가 포함되지 않는다. 새 Header 에서 제거하고, Footer 에는 그대로 유지.

### 6. 활성 nav state
Next.js `usePathname()` 으로 현재 경로 판정. `/` → Home, `/posts*` → Posts, `/series*` → Series, `/tags*` → Tags, `/[slug]` → 활성 nav 없음.

---

## Tailwind Dynamic-Class Note

Header/Footer 의 className 은 모두 정적 문자열이므로 Tailwind purge 가 정상 인식한다. Sub-project #1 의 `app/dev/tokens/page.tsx` 에서 사용한 dynamic class safelist 패턴은 불필요.

---

### Task 1: Header 전면 재작성 (데스크탑 + 모바일)

**Files:**
- Modify: `components/site-header.tsx` (전면 재작성)

⚠️ **이 task 는 Header 컴포넌트 한 파일만 변경한다. 다른 파일 (예: layout.tsx, globals.css, tsconfig.json 등) 은 절대 수정 금지.** 만약 npm run check / build 가 사전 존재 에러로 실패하면 BLOCKED 보고 (절대 untracked 파일 삭제 등 destructive 회피 금지 — sub-project #1 Task 1 사고 참고).

- [ ] **Step 1: 현재 Header 구조 확인**

```bash
cat /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/components/site-header.tsx
```

기대: 약 76줄. shadcn Button + lucide-react Search/Tag + ThemeToggle + SearchDialog + SocialLinks 사용. Sticky `border-b bg-background/95 backdrop-blur` 패턴.

- [ ] **Step 2: site-header.tsx 전면 교체**

`components/site-header.tsx` 의 전체 내용을 다음으로 덮어쓴다:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Rss, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SearchDialog } from '@/components/search-dialog';

const NAV = [
  { name: 'Home', href: '/' },
  { name: 'Posts', href: '/posts' },
  { name: 'Series', href: '/series' },
  { name: 'Tags', href: '/tags' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-bento-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bento-bg/60">
        <div className="mx-auto flex max-w-canvas items-center justify-between gap-4 px-6 py-4 md:px-10">
          {/* Logo + wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 no-underline text-bento-ink"
            aria-label="Frank's IT Blog 홈"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bento-accent text-base font-bold text-white">
              F
            </span>
            <span className="text-base font-semibold">
              frank<span className="text-bento-dim">.blog</span>
            </span>
          </Link>

          {/* Desktop pill nav */}
          <nav
            aria-label="주요 메뉴"
            className="hidden gap-1 rounded-full bg-bento-ink/[0.06] p-1 dark:bg-white/10 md:flex"
          >
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.name}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'rounded-full px-4 py-1.5 text-[13px] font-medium no-underline transition',
                    active
                      ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
                      : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white',
                  ].join(' ')}
                >
                  {n.name}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Search trigger — desktop full button, mobile icon only */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="hidden items-center gap-2.5 rounded-full bg-bento-ink/[0.06] px-3.5 py-2 text-[13px] text-bento-dim transition hover:bg-bento-ink/10 md:flex dark:bg-white/10 dark:hover:bg-white/15"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-bento-ink/10 bg-bento-card px-1.5 py-0 font-mono text-[10px] font-semibold text-bento-ink dark:border-white/10">
                ⌘K
              </kbd>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="테마 전환"
              className="rounded-full bg-bento-ink/[0.06] text-bento-ink hover:bg-bento-ink/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>

            {/* RSS — desktop pill, mobile icon */}
            <Link
              href="/rss.xml"
              aria-label="RSS 피드"
              className="hidden rounded-full bg-bento-ink px-4 py-2 text-[13px] font-medium text-white no-underline md:inline-block dark:bg-white dark:text-bento-ink"
            >
              RSS
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              asChild
              className="md:hidden"
            >
              <Link href="/rss.xml" aria-label="RSS 피드">
                <Rss className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="메뉴 열기"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-bento-bg">
                <SheetHeader>
                  <SheetTitle className="text-left text-bento-ink">메뉴</SheetTitle>
                </SheetHeader>
                <nav aria-label="모바일 메뉴" className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => {
                    const active = isActive(pathname, n.href);
                    return (
                      <Link
                        key={n.name}
                        href={n.href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'rounded-card-sm px-4 py-3 text-base font-medium no-underline transition',
                          active
                            ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
                            : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white',
                        ].join(' ')}
                      >
                        {n.name}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
```

⚠️ **변경 노트**:
- 기존 `<header className="sticky top-0 z-50 w-full border-b bg-background/95 ...">` → `bg-bento-bg/95` + `border-b` 제거 (Bento 미학)
- 기존 nav (홈/시리즈/태그 3개) → 4개 (Home/Posts/Series/Tags) 영문
- ThemeToggle 별도 import 제거 → 인라인 useTheme 훅으로 통합 (Sun/Moon lucide 아이콘)
- SocialLinks import 제거 (Footer 만 사용)
- SearchDialog 는 그대로 유지 (sub-project #3 에서 CommandK 로 교체)

- [ ] **Step 3: 타입 검사**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 만약 에러 발생 시 quote 해서 BLOCKED 보고 (회피 시도 금지).

- [ ] **Step 4: 빌드 통과 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 빌드 실패 시 에러 quote + BLOCKED.

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/site-header.tsx && git commit -m "$(cat <<'EOF'
feat(layout): Bento Header 재작성 — 워드마크 · pill nav · 검색 · 테마 · RSS · 모바일 드로어

* SiteHeader 전면 재작성: F 로고 + frank.blog 워드마크
* 4개 nav (Home / Posts / Series / Tags), 활성 항목 ink/white 강조
* 데스크탑: pill nav + Search 캡슐(⌘K kbd) + Theme toggle + RSS 캡슐
* 모바일: 햄버거 → shadcn Sheet 드로어 (4개 nav 세로 스택), Search/Theme/RSS 아이콘 단독
* sticky top-0 + backdrop-blur 유지, 배경 bento-bg/95 로 매핑
* SearchDialog 는 그대로 호출 — sub-project #3 CommandK 완성 시 교체
* SocialLinks 는 Footer 에만 유지 (Header 에서 제거)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Footer 색상 토큰 매핑

**Files:**
- Modify: `components/site-footer.tsx`

⚠️ **Footer 의 구조/JSX 는 변경하지 않는다. 색상 클래스만 `bento-*` 로 치환.** 이 task 도 한 파일만 수정.

- [ ] **Step 1: 현재 Footer 색상 클래스 확인**

```bash
grep -n "bg-\|text-\|border-" /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/components/site-footer.tsx
```

기대 결과 예시 (현재 코드):
- `bg-muted/30 dark:bg-background border-t`
- `text-sm text-muted-foreground`
- 등등

- [ ] **Step 2: 색상 클래스 일괄 치환**

`components/site-footer.tsx` 전체를 Read 한 뒤, 다음 매핑 규칙에 따라 클래스를 치환한다. **JSX 구조는 절대 변경하지 않는다.**

| 기존 | 변경 |
|---|---|
| `bg-muted/30 dark:bg-background` | `bg-bento-cream dark:bg-bento-card` |
| `border-t` (footer 외곽) | `border-t border-bento-ink/10 dark:border-white/10` |
| `text-muted-foreground` | `text-bento-dim` |
| `text-foreground` | `text-bento-ink` |
| `hover:text-primary` | `hover:text-bento-accent` |
| `text-primary` | `text-bento-accent` |
| `bg-card` (있다면) | `bg-bento-card` |

치환 후, 모든 `bg-`/`text-`/`border-` 클래스가 `bento-*` 또는 표준 Tailwind 색상(`white`/`black` 등) 만 사용하는지 확인.

⚠️ shadcn `Button` 컴포넌트 (예: SocialLinks 안) 의 내부 className 은 건드리지 않는다 — 그 컴포넌트는 자체적으로 shadcn 토큰을 사용. Footer 의 외곽 wrapper, 헤딩, 본문, 링크의 클래스만 치환.

- [ ] **Step 3: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/site-footer.tsx && git commit -m "$(cat <<'EOF'
feat(layout): Footer 색상 토큰 bento-* 로 매핑

* 외곽 bg: bg-muted/30 dark:bg-background → bg-bento-cream dark:bg-bento-card
* border-t: border-bento-ink/10 dark:border-white/10 추가
* 본문/메타 text 색상을 bento-ink, bento-dim 으로 매핑
* 링크 hover/primary 색상을 bento-accent 로 매핑
* JSX 구조 변경 없음, SocialLinks 내부 shadcn Button 그대로

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 회귀 검증

**Files:** (변경 없음)

이 task 는 검증만. 코드 변경 + 커밋 없음.

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 모든 기존 라우트 (`/`, `/[slug]` × 175, `/series`, `/tags`) + `/dev/tokens` 정적 생성.

- [ ] **Step 3: 빌드 산출물 라우트 확인**

```bash
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/ | head -10
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/series/ 2>&1 | head -5
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/tags/ 2>&1 | head -5
```

기대: 모두 정상 존재.

- [ ] **Step 4: 컨트롤러가 dev 서버에서 시각 확인 (subagent 는 SKIP, controller 가 진행)**

이 step 은 controller 가 `npm run dev` 실행 후 직접 브라우저에서 확인. subagent 는 이 step 을 수행하지 않음.

확인 사항 (controller 용):
- `http://localhost:3000/` — 새 헤더가 보임 (F 로고, 4개 pill nav, Search 캡슐 with ⌘K, Sun/Moon, RSS 캡슐), 활성 nav 는 Home
- `http://localhost:3000/series` — 활성 nav 는 Series
- `http://localhost:3000/tags` — 활성 nav 는 Tags
- `http://localhost:3000/posts` — 404 (sub-project #4 에서 채워질 예정 — 정상)
- `http://localhost:3000/{기존 article slug}` — 헤더는 유지, 활성 nav 없음
- 브라우저 width 768px 미만으로 줄임 → pill nav 가 햄버거로 변환, Search/Theme/RSS 가 아이콘만, 햄버거 클릭 시 우측 Sheet 열림
- 다크 모드 토글 정상 동작 (Sun ↔ Moon 아이콘 전환, 헤더 배경/텍스트 색상 다크로 전환)
- Search 버튼 클릭 → 기존 `SearchDialog` 모달 정상 열림 (sub-project #3 에서 CommandK 로 교체 예정)
- RSS 클릭 → `/rss.xml` 다운로드/표시
- Footer: 새 색상 토큰 (cream / dim / ink / accent), 구조는 그대로 (3-column, 카테고리 리스트, 소셜 링크)

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -15
```

기대: sub-project #1 의 10 커밋 + sub-project #2 의 2~3 커밋 = 약 12~13 커밋.

---

## Self-Review Notes

- **Spec coverage** (§5):
  - §5.1 Header 구조 → Task 1 (logo, pill nav, search, theme, RSS, sticky)
  - §5.2 Sticky → Task 1 (`sticky top-0 z-50 backdrop-blur`)
  - §5.3 모바일 → Task 1 (Sheet 드로어, 아이콘 모드)
  - §5.4 Footer → Task 2 (색상 토큰만 매핑, 구조 유지)
  - §5.5 영향 범위 → Task 1 + Task 2 의 Files 섹션
  - 모두 커버됨.
- **Placeholder scan**: TBD/TODO 없음. 모든 코드 스니펫 완성형.
- **Type consistency**:
  - `NAV`/`isActive` 함수 시그니처 일관됨
  - 모든 색상 클래스가 `bento-*` namespace
  - shadcn 컴포넌트 (Button, Sheet) 는 기존 import 경로 그대로
- **외부 의존성 사전 검증 완료**:
  - `components/ui/sheet.tsx` 존재 ✓
  - `components/ui/button.tsx` 존재 ✓
  - `lucide-react` (Search, Rss, Menu, Sun, Moon) — package.json 에 있음 ✓
  - `next-themes` 의 useTheme — 이미 사용 중 ✓
  - `next/navigation` 의 usePathname — Next.js 16 기본 ✓
  - `/rss.xml` — `public/rss.xml` 또는 빌드 시 생성됨 ✓
- **Decoupling 확인**:
  - Search 트리거가 SearchDialog 와 결합 → sub-project #3 에서 CommandK 로 교체 시 1줄 수정 (`<SearchDialog>` → `<CommandK>` + import 변경) — coupling 최소화
  - Posts 라우트 미존재 → 임시 404 허용 (sub-project #4 에서 채움)
  - Footer JSX 구조 변경 없음 → 회귀 위험 최소
- **변경된 디자인 결정 사항 없음** — sub-project #1 spec/plan 위에서 정상 누적
