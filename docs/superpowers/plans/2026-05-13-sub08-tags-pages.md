# Sub-project #8: 태그 인덱스 + `/tags/[name]` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/tags` 인덱스를 D3 bubble chart 에서 Bento 가중치 클라우드로 리디자인. 신규 `/tags/[name]` 라우트 추가하여 Command-K 태그 결과 클릭 시 임시 404 였던 것 해소.

**Architecture:** 두 페이지 모두 server component. `/tags` 는 manifest 의 raw 태그 + 카운트 집계 후 폰트 사이즈를 글 개수에 비례 (linear 12px ~ 32px) 시키는 정적 가중치 클라우드. `/tags/[name]` 은 헤더 (#{tag} + N편) + `components/posts/posts-list.tsx`(sub#4 에서 만든 connect 패턴) 재사용. 기존 `TagsPageClient` / `tag-bubble-chart.tsx` / `d3` 의존성은 사용 안 함 — 파일 삭제는 sub#9 cleanup 단계.

**Tech Stack:** Next.js 16 App Router (server components), `lib/articles.ts` (`getAllArticles`, `getArticlesByTag`, `getArticleTitleFromSlug`), `lib/utils.ts` (`formatDate`), 기존 `components/posts/posts-list.tsx`.

**브랜치:** `feature/redesign-bento` 위에서 누적. main 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§9.3 태그)
- 기존: `app/tags/page.tsx` (TagsPageClient 호출), `components/tags-page-client.tsx`, `components/tag-bubble-chart.tsx` (모두 sub#9 에서 삭제 예정)
- 재사용 패턴: `components/posts/posts-list.tsx` (sub#4)

---

## Files Touched

### Task 1 — `/tags` 인덱스 (가중치 클라우드)
- Modify: `app/tags/page.tsx` — TagsPageClient import 제거, 인라인 weighted cloud

### Task 2 — `/tags/[name]` 신규
- Create: `app/tags/[name]/page.tsx`

### Task 3 — 검증
(변경 없음)

---

## Design Decisions

### 1. 태그 raw 그대로 사용
manifest 의 `tags` 가 case-sensitive (예: "kubernetes" vs "Kubernetes" 가 별도 entry). `getAllTags()` 가 raw 반환. 본 sub-project 에서는 그대로 사용 — 정규화는 데이터 cleanup 단계 (별도 작업) 영역. 사용자에게 노출되는 weighted cloud 에서 중복 보일 수 있음 (의도된 한계).

### 2. 가중치 클라우드 폰트 사이즈
- min count → 12px, max count → 32px, linear 보간
- 단일 태그(min==max) 시 모든 태그 18px (median)
- 클래스 attribute 가 아닌 `style={{ fontSize: '...' }}` 인라인 스타일 — 사이즈가 동적이라 Tailwind purge 안전

### 3. 태그 정렬
사용자가 찾기 쉽도록 알파벳 asc 정렬. 카운트 desc 도 고려 가능하지만 클라우드 시각화에서 카운트는 폰트 크기로 이미 표현되므로 알파벳 정렬이 자연스러움.

### 4. 태그 URL
`encodeURIComponent(tag)` 로 인코딩. 한글 태그 안전. `getArticlesByTag(tag)` 가 raw 비교이므로 URL 디코딩 후 원본 그대로 사용.

### 5. 빈 카운트 처리
태그가 0개 글에 매치되면 (이론상 manifest 정합성 문제) `notFound()`. `generateStaticParams` 가 manifest 의 태그만 빌드하므로 unreachable.

### 6. 태그 detail 본문
`/posts` 의 PostsList 재사용 — 연도 그룹 compact list. CategoryRail 은 사용 안 함 (이미 태그 필터 상태).

### 7. 기존 파일 처리
- `app/tags/page.tsx` — Modify (재작성)
- `components/tags-page-client.tsx` — 호출 site 없어짐, 파일은 sub#9 에서 삭제
- `components/tag-bubble-chart.tsx` — TagsPageClient 안에서 사용되었을 것, sub#9 에서 삭제

⚠️ 본 sub-project 에서는 위 2개 파일을 직접 삭제하지 않는다. 안전한 sub#9 cleanup 영역.

---

## Tailwind Dynamic-Class Note

`/tags` 의 폰트 사이즈는 `style={{ fontSize: ... }}` 인라인이라 Tailwind 와 무관. 다른 className 은 모두 정적. safelist 불필요.

---

### Task 1: `/tags` 인덱스 — 가중치 클라우드

**Files:**
- Modify: `app/tags/page.tsx`

⚠️ 단 1개 파일 수정. `components/tags-page-client.tsx` 및 `components/tag-bubble-chart.tsx` 는 절대 touch 금지 (sub#9 영역).

- [ ] **Step 1: `app/tags/page.tsx` 전면 재작성**

`app/tags/page.tsx` 의 전체 내용을 다음으로 덮어쓴다:

```tsx
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';

export const metadata = {
  title: "Tags | Frank's IT Blog",
  description: '태그별로 정리된 기술 블로그 글 모음',
};

const MIN_FONT = 12;
const MAX_FONT = 32;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function TagsPage() {
  const all = await getAllArticles();

  // 태그 집계 (raw, case-sensitive)
  const counts = new Map<string, number>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const entries = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, 'ko'));

  // 폰트 사이즈 linear 매핑
  const minCount = entries.reduce((acc, e) => Math.min(acc, e.count), Infinity);
  const maxCount = entries.reduce((acc, e) => Math.max(acc, e.count), 0);
  const fontSize = (count: number): number => {
    if (maxCount === minCount) return (MIN_FONT + MAX_FONT) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return MIN_FONT + ratio * (MAX_FONT - MIN_FONT);
  };

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Tags
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Tags
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {entries.length}개의 태그 · 글 개수에 따라 크기가 달라요
        </p>
      </header>

      {entries.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          등록된 태그가 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-card-xl bg-bento-card p-6 md:p-10">
            {entries.map((e) => (
              <Link
                key={e.tag}
                href={`/tags/${encodeURIComponent(e.tag)}`}
                className={[
                  'inline-flex items-baseline gap-1 no-underline text-bento-ink transition hover:text-bento-accent',
                  FOCUS_RING,
                ].join(' ')}
                style={{
                  fontSize: `${fontSize(e.count)}px`,
                  lineHeight: 1.1,
                }}
              >
                <span className="font-semibold tracking-tight">{e.tag}</span>
                <span className="text-bento-dim" style={{ fontSize: '0.65em' }}>
                  {e.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```

⚠️ 변경 노트:
- `TagsPageClient` import 제거
- 인라인 weighted cloud 렌더링 (모든 태그를 하나의 큰 카드 안에 `flex flex-wrap`)
- 각 태그 = Link to `/tags/[encoded-name]/`
- 모바일도 같은 wrap 동작 (별도 분기 불필요)

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 페이지 수 220 (동일 — 인덱스 페이지 하나 재작성).

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/tags/page.tsx && git commit -m "$(cat <<'EOF'
feat(tags): /tags 인덱스 — 가중치 클라우드 (bubble chart 제거)

* TagsPageClient 호출 제거, 인라인 weighted cloud 렌더링
* 모든 태그를 하나의 큰 카드 안에 flex wrap, 폰트 사이즈 12~32px linear 보간
* 알파벳 asc 정렬 (Korean locale)
* 각 태그 → /tags/[encoded-name] 링크 (Task 2 에서 라우트 추가)
* 기존 components/tags-page-client.tsx + tag-bubble-chart.tsx 는 sub#9 에서 삭제

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `/tags/[name]` 상세 페이지 신규

**Files:**
- Create: `app/tags/[name]/page.tsx`

⚠️ 신규 1개 파일만 생성. 다른 파일 절대 touch 금지.

- [ ] **Step 1: 디렉토리 + 파일 생성**

```bash
mkdir -p "/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/app/tags/[name]"
```

`app/tags/[name]/page.tsx` 의 전체 내용:

```tsx
import { notFound } from 'next/navigation';
import {
  getAllArticles,
  getArticlesByTag,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { PostsList } from '@/components/posts/posts-list';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await getAllArticles();
  const tags = new Set<string>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) tags.add(t);
  }
  return Array.from(tags).map((tag) => ({ name: encodeURIComponent(tag) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `#${decoded} | Frank's IT Blog`,
    description: `#${decoded} 태그가 붙은 글 모음`,
  };
}

export default async function TagDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const matched = await getArticlesByTag(decoded);
  if (matched.length === 0) notFound();

  const sorted = matched
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const articles = sorted.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Tag
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          <span className="text-bento-accent">#</span>
          {decoded}
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length}편
        </p>
      </header>

      <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
        <PostsList articles={articles} />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 라우트 목록에 `● /tags/[name]` + 태그 N개 정적 빌드 (manifest tags 수에 따라 ~100~200개).

```bash
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/tags/ 2>&1 | head -20
```

기대: `index.html` (인덱스) + 태그별 디렉토리들 (URL-encoded 한글 포함).

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/tags/[name]" && git commit -m "$(cat <<'EOF'
feat(tags): /tags/[name] 상세 페이지 신규

* 헤더: #{tag} (accent # 색상) + N편
* 본문: PostsList 재사용 (sub#4 의 연도 그룹 compact list)
* generateStaticParams 로 모든 raw 태그 정적 빌드 (encodeURIComponent)
* date desc 정렬, 매치 0개면 notFound()
* Command-K 태그 결과 클릭 + /tags 가중치 클라우드 클릭 시 임시 404 였던 것 해소

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 회귀 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 빌드 페이지 수 = 220 + 태그 N개 ≈ 300+ pages.

- [ ] **Step 3: 빌드 산출물 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
test -f out/tags/index.html && echo "index OK" || echo "index MISSING"
ls out/tags/ | wc -l
```

기대: index OK + 태그 디렉토리 100+개.

- [ ] **Step 4: 컨트롤러 시각 확인 (subagent SKIP)**

`npm start` 후 확인:

`/tags/`:
- 헤더: "TAGS" eyebrow + h1 "Tags" + "{N}개의 태그 · 글 개수에 따라 크기가 달라요"
- 큰 카드 (bento-card bg, rounded-card-xl) 안에 모든 태그 wrap 표시
- 각 태그 폰트 사이즈가 카운트에 비례 (작은 태그 12px, 큰 태그 32px)
- 카운트는 태그 옆 작은 dim 회색 숫자
- 클릭 → `/tags/[name]` 정상 이동 (이전엔 404)
- 알파벳 asc 정렬

`/tags/kubernetes/` (또는 다른 sample):
- 헤더: "TAG" + h1 "#kubernetes" (# 만 accent 색) + N편
- 본문: 연도 그룹 compact list (`/posts` 와 동일 시각)
- 카드 클릭 → article 페이지

Command-K 검색:
- "kubernetes" 입력 → tag 섹션의 "kubernetes" 결과 클릭 → `/tags/kubernetes/` 정상 이동

다크 모드: 모든 카드 정상 전환

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -40
```

기대: sub#1~#7 의 34 + sub#8 의 3 = 약 37 커밋.

---

## Self-Review Notes

### Spec coverage (§9.3)
- `/tags` 인덱스 가중치 클라우드 → Task 1 ✓
  - 모든 태그 + 글 개수 집계 (getAllTags 대신 getAllArticles 순회로 더 정확) ✓
  - 폰트 사이즈 글 개수에 비례 (12~32px) ✓
  - 클릭 시 `/tags/[name]` 이동 ✓
  - 모바일 wrap ✓
- `/tags/[name]` 신규 → Task 2 ✓
  - 헤더 #{tag} + 글 개수 ✓
  - 본문 compact list (PostsList 재사용) ✓
  - generateStaticParams ✓
  - 한글 encodeURIComponent ✓

### Placeholder scan
TBD/TODO 없음. 모든 코드 완성형.

### Type consistency
- Tag aggregation 셰이프: `{ tag: string; count: number }` — Task 1 내 일관
- `getArticlesByTag` 반환 `ManifestArticle[]` — Task 2 에서 PostsList 의 `Article` 셰이프(`{ slug, title, category, date }`)로 매핑
- `decodeURIComponent` / `encodeURIComponent` 좌우 일관

### 외부 의존성 사전 검증
- `getAllArticles`, `getArticlesByTag`, `getArticleTitleFromSlug` — `lib/articles.ts` 존재 ✓
- `PostsList` — `components/posts/posts-list.tsx` 존재 (sub#4) ✓
- bento-* 토큰 — sub#1 ✓
- 신규 import 없음

### Decoupling
- 두 페이지 모두 독립 server component, 다른 컴포넌트 의존성 최소 (PostsList 1개만)
- TagsPageClient / tag-bubble-chart.tsx 는 사용 site 사라짐 — sub#9 cleanup 에서 삭제

### Risks 및 완화
- **빌드 시간 증가**: 태그 100~200개 정적 빌드 → 빌드 시간 ~50% 증가 가능. 정상 (정적 export 의 trade-off). 빌드 실패 발생 시 BLOCKED 보고.
- **태그 케이스 중복** (e.g., "Kubernetes" vs "kubernetes"): 의도된 한계. 정규화는 데이터 cleanup 영역 (별도 작업).
- **한글 태그 URL 길이**: `encodeURIComponent("한글태그")` 길이 ~30 bytes. Next.js 정적 라우트 파일명 길이 제한(통상 255 bytes) 이내.
- **`PostsList` 의 max-prose constraint 없음**: PostsList 는 grid 형식이라 컨테이너 width 그대로 사용. 헤더가 max-w-canvas 라 일관.
- **빈 카운트 + dynamicParams=false**: manifest 의 태그가 0개 글에 매치되는 경우 (이론상 불가). `notFound()` 가드.
