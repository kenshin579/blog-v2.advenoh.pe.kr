# 메인 페이지 명언 카드를 inspire-me QOTD로 교체 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** blog-v2 메인 페이지의 하드코딩된 명언 카드를 inspire-me(`https://inspire-me.advenoh.pe.kr`)의 widget API에서 받아오는 오늘의 명언으로 교체하고, 카드 클릭 시 새 탭으로 inspire-me 상세 페이지(`/quotes/{id}`)를 연다.

**Architecture:** 정적 export 사이트이므로 빌드 HTML에 fallback 명언을 박아두고, 브라우저 로드 후 클라이언트 컴포넌트가 widget API(`/api/widget/quote-of-the-day?language=ko`, 인증/CORS 제약 없음)를 호출해 데이터를 교체. 실패 시 fallback 유지 + 링크 비활성. 표시 컴포넌트 `QuoteCard`는 순수 함수 컴포넌트로 유지하고, 데이터 페칭은 훅 `useQuoteOfTheDay`와 클라이언트 컴포넌트 `QuoteSection`이 담당한다.

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), React 19, TypeScript, Tailwind CSS. 기존 프로젝트에 단위 테스트 인프라가 없으므로 본 plan은 **`npm run check` (tsc) + `npm run build` + 수동 브라우저 검증**으로 각 단계의 정상 동작을 확인한다. 테스트 인프라(Vitest + @testing-library 등) 도입은 본 plan 범위를 넘으며, 필요 시 후속 plan으로 진행한다.

**Spec:** `docs/superpowers/specs/2026-05-16-qotd-on-homepage-design.md`

**Branch:** `feature/qotd-on-homepage` (이미 생성됨, 스펙 커밋 `e9b8354`)

---

## File Map

| 파일 | 동작 | 책임 |
|---|---|---|
| `lib/inspireme.ts` | **신규** | API base URL 상수, widget 응답 타입, `quoteDetailUrl()`, `fetchQuoteOfTheDay()` |
| `components/home/quote-card.tsx` | **수정** | props를 `{ lines: string[] }` → `{ content, attribution, href? }`로 변경. `href` 있으면 `<a target="_blank" rel="noopener noreferrer">`로 카드 전체 wrap |
| `hooks/use-quote-of-the-day.ts` | **신규** | `useEffect` + `fetch`로 widget API 호출, fallback 초기값 → 성공 시 교체, 실패 시 유지 |
| `components/home/quote-section.tsx` | **신규** | `'use client'` 경계. 훅 호출 + 결과를 `QuoteCard`에 전달 |
| `app/page.tsx` | **수정** | `<QuoteCard ... />` 직접 호출을 `<QuoteSection fallback={QOTD_FALLBACK} />`로 교체. import 정리 |

---

## Task 1: API 클라이언트 모듈 (`lib/inspireme.ts`) 신규 작성

**Files:**
- Create: `lib/inspireme.ts`

목적: inspire-me widget API의 base URL, 응답 타입, fetch 함수를 한 모듈에 모은다. 다른 곳에서 도메인 문자열을 직접 쓰지 않도록 단일 출처로 만든다.

- [ ] **Step 1.1: `lib/inspireme.ts` 생성**

```ts
// lib/inspireme.ts

/**
 * inspire-me 외부 서비스의 공개 widget API 호출 헬퍼.
 * widget API는 인증 키가 필요 없고 모든 origin을 허용한다.
 */

export const INSPIRE_ME_BASE_URL = 'https://inspire-me.advenoh.pe.kr';

/**
 * widget API의 quote 응답 형태.
 * (backend/pkg/widget/handler.go:281-298의 widgetQuoteResponse 기준,
 *  본 클라이언트에서 사용하는 필드만 정의)
 */
export type InspireMeWidgetQuote = {
  id: string;
  content: string;
  author: string;
  language: string;
  topics?: string[];
  tags?: string[];
};

type WidgetEnvelope<T> = { data: T };

export function quoteDetailUrl(id: string): string {
  return `${INSPIRE_ME_BASE_URL}/quotes/${id}`;
}

export async function fetchQuoteOfTheDay(
  language: string = 'ko',
): Promise<InspireMeWidgetQuote | null> {
  const url = `${INSPIRE_ME_BASE_URL}/api/widget/quote-of-the-day?language=${encodeURIComponent(language)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`QOTD widget API returned ${res.status}`);
  }
  const json = (await res.json()) as WidgetEnvelope<InspireMeWidgetQuote>;
  return json?.data ?? null;
}
```

- [ ] **Step 1.2: 타입 체크 통과 확인**

Run: `npm run check`
Expected: 에러 없이 종료 (exit 0). 신규 파일이라 기존 코드에 영향 없음.

- [ ] **Step 1.3: 커밋**

```bash
git add lib/inspireme.ts
git commit -m "$(cat <<'EOF'
[feature/qotd-on-homepage] inspire-me widget API 클라이언트 모듈 추가

* base URL 상수, 응답 타입, quoteDetailUrl(), fetchQuoteOfTheDay() 정의
* widget API는 인증 키 불필요, CORS는 모든 origin 허용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `QuoteCard` 컴포넌트 props 리팩터

**Files:**
- Modify: `components/home/quote-card.tsx`
- Modify: `app/page.tsx:192-199`

목적: `QuoteCard`의 props를 `{ lines: string[] }` → `{ content: string; attribution: string; href?: string }`로 변경. `href` 있으면 카드 전체가 새 탭 링크가 되고, 없으면 일반 `<div>`로 렌더. **이 task만으로 빌드가 깨지지 않도록** 호출자(`app/page.tsx`)도 새 props로 즉시 교체한다. fallback 명언은 그대로 유지(data fetch는 Task 3-5에서 추가).

- [ ] **Step 2.1: `components/home/quote-card.tsx` 전체 재작성**

```tsx
// components/home/quote-card.tsx

type Props = {
  content: string;
  attribution: string;
  /** 있으면 카드 전체가 새 탭 링크로 동작. 없으면 일반 카드. */
  href?: string;
};

const BASE_CLASSES =
  'col-span-12 flex min-h-[260px] flex-col justify-between rounded-card-xl bg-bento-hero-dark p-7 text-white md:col-span-4 md:min-h-[260px] md:p-8';

const LINK_CLASSES =
  'transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bento-accent';

export function QuoteCard({ content, attribution, href }: Props) {
  const body = (
    <>
      <div
        aria-hidden="true"
        className="text-6xl font-bold leading-none text-bento-accent"
        style={{ lineHeight: 0.7 }}
      >
        &ldquo;
      </div>
      <blockquote className="my-3 font-serif text-lg font-medium leading-tight tracking-tighter md:text-xl [text-wrap:balance]">
        {content}
      </blockquote>
      <cite className="text-xs not-italic text-white/60">{attribution}</cite>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BASE_CLASSES} ${LINK_CLASSES}`}
      >
        {body}
      </a>
    );
  }

  return <div className={BASE_CLASSES}>{body}</div>;
}
```

설명:
- `lines.map` 제거하고 `content`를 단일 문자열로 표시. `[text-wrap:balance]`로 자동 줄 균형.
- `href`가 truthy면 `<a target="_blank" rel="noopener noreferrer">`로 래핑하고 hover/focus 시각 피드백 추가.
- `&ldquo;`(왼쪽 큰따옴표)를 명시적으로 사용(린트 경고 회피).

- [ ] **Step 2.2: `app/page.tsx`의 `QuoteCard` 호출부 변경**

기존(라인 192-199):
```tsx
        <QuoteCard
          lines={[
            '잘 정리된 노트는',
            '미래의 나에게 보내는',
            '가장 좋은 선물.',
          ]}
          attribution="— writing principle"
        />
```

다음으로 교체:
```tsx
        <QuoteCard
          content="잘 정리된 노트는 미래의 나에게 보내는 가장 좋은 선물."
          attribution="— writing principle"
        />
```

(Task 5에서 다시 `<QuoteSection />`으로 교체하지만, 이 task만으로 빌드를 깨지 않게 임시로 새 props 형태로 호출.)

- [ ] **Step 2.3: 타입 체크 통과 확인**

Run: `npm run check`
Expected: 에러 없이 종료.

- [ ] **Step 2.4: 수동 확인 (개발 서버)**

Run: `npm run dev`
브라우저에서 `http://localhost:3000` 열고 메인 페이지의 명언 카드가 기존과 시각적으로 동등한지 확인:
- 본문 "잘 정리된 노트는 미래의 나에게 보내는 가장 좋은 선물." 가 한 단락으로 보이고 자동 줄 균형이 적용됨.
- 큰따옴표 아이콘 + attribution이 기존 위치에 표시됨.
- 커서 hover 시 클릭 가능 표시가 없는지(href 미전달이므로 일반 `<div>`).

확인 후 dev 서버 종료(Ctrl+C).

- [ ] **Step 2.5: 커밋**

```bash
git add components/home/quote-card.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
[feature/qotd-on-homepage] QuoteCard props를 단일 content + 선택적 href로 리팩터

* lines: string[] → content: string + attribution + href? 로 변경
* href 있으면 카드 전체가 새 탭 링크(target=_blank, rel=noopener noreferrer)
* CSS text-wrap:balance로 자동 줄 균형, href 시 hover/focus 시각 피드백 추가
* page.tsx 호출부를 새 props로 즉시 갱신해 빌드 정상 유지

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `useQuoteOfTheDay` 훅 신규 작성

**Files:**
- Create: `hooks/use-quote-of-the-day.ts`

목적: fallback 데이터를 초기값으로 받고, 마운트 후 widget API를 호출해 성공 시 상태를 교체하는 훅. 실패 시 fallback 유지(상태 변경 없음). 응답에 `id`가 빠지면 `href`만 `undefined`로 두고 본문은 갱신(부분 graceful degrade).

- [ ] **Step 3.1: `hooks/use-quote-of-the-day.ts` 생성**

```ts
// hooks/use-quote-of-the-day.ts
'use client';

import { useEffect, useState } from 'react';

import {
  fetchQuoteOfTheDay,
  quoteDetailUrl,
} from '@/lib/inspireme';

export type QuoteViewData = {
  content: string;
  attribution: string;
  /** inspire-me 상세 페이지 절대 URL. fallback 상태일 땐 undefined. */
  href?: string;
};

/**
 * inspire-me의 오늘의 명언을 클라이언트에서 받아온다.
 * - 초기값은 호출자가 주입하는 fallback (정적 HTML에 박혀 있는 명언).
 * - 마운트 후 fetch 성공하면 새 데이터로 교체한다.
 * - 실패하면 fallback을 그대로 유지하고 콘솔에 warn만 남긴다.
 *   (명언은 데코레이션 요소라 사용자에게 에러를 노출하지 않는다.)
 */
export function useQuoteOfTheDay(fallback: QuoteViewData): QuoteViewData {
  const [data, setData] = useState<QuoteViewData>(fallback);

  useEffect(() => {
    let cancelled = false;

    fetchQuoteOfTheDay('ko')
      .then((q) => {
        if (cancelled || !q) return;
        const author = (q.author ?? '').trim();
        const id = (q.id ?? '').trim();
        setData({
          content: q.content,
          attribution: author ? `— ${author}` : fallback.attribution,
          href: id ? quoteDetailUrl(id) : undefined,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // 명언은 비핵심 데코레이션. 실패는 조용히 처리.
        console.warn('[useQuoteOfTheDay] failed to fetch QOTD:', err);
      });

    return () => {
      cancelled = true;
    };
    // fallback.attribution은 author가 비어 있을 때 대체값으로 쓰이므로 의존성에 포함.
  }, [fallback.attribution]);

  return data;
}
```

설명:
- `'use client'` 명시(클라이언트에서만 동작).
- `cancelled` 플래그로 unmount 후 setState 방지.
- `author`/`id`가 공백/없음일 때를 모두 falsy로 통합 처리.
- 성공 시에만 setState (실패 시 초기 fallback이 그대로 유지됨).

- [ ] **Step 3.2: 타입 체크 통과 확인**

Run: `npm run check`
Expected: 에러 없이 종료. (이 훅은 아직 사용처가 없지만 export만 있으면 TS는 통과.)

- [ ] **Step 3.3: 커밋**

```bash
git add hooks/use-quote-of-the-day.ts
git commit -m "$(cat <<'EOF'
[feature/qotd-on-homepage] useQuoteOfTheDay 훅 추가

* fallback을 초기 상태로 받아 마운트 후 widget API fetch
* 성공: content/attribution/href로 상태 교체 (id 없으면 href만 undefined)
* 실패: fallback 유지 + console.warn (사용자에게 에러 노출 안 함)
* unmount 시 setState 방지(cancelled 플래그)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `QuoteSection` 클라이언트 컴포넌트 신규 작성

**Files:**
- Create: `components/home/quote-section.tsx`

목적: server 컴포넌트인 `app/page.tsx`와 클라이언트 훅 사이의 경계. 훅을 호출하고 결과를 `QuoteCard`에 그대로 넘긴다. 책임이 매우 작아 한 파일로 분리한다(`QuoteCard`는 순수 표시 유지).

- [ ] **Step 4.1: `components/home/quote-section.tsx` 생성**

```tsx
// components/home/quote-section.tsx
'use client';

import { QuoteCard } from '@/components/home/quote-card';
import {
  useQuoteOfTheDay,
  type QuoteViewData,
} from '@/hooks/use-quote-of-the-day';

type Props = {
  /** 빌드 시 정적 HTML에 박히는 명언. fetch 실패/지연 시에도 이 값이 표시된다. */
  fallback: QuoteViewData;
};

export function QuoteSection({ fallback }: Props) {
  const data = useQuoteOfTheDay(fallback);
  return (
    <QuoteCard
      content={data.content}
      attribution={data.attribution}
      href={data.href}
    />
  );
}
```

- [ ] **Step 4.2: 타입 체크 통과 확인**

Run: `npm run check`
Expected: 에러 없이 종료.

- [ ] **Step 4.3: 커밋**

```bash
git add components/home/quote-section.tsx
git commit -m "$(cat <<'EOF'
[feature/qotd-on-homepage] QuoteSection 클라이언트 컴포넌트 추가

* 'use client' 경계: server page에서 받은 fallback을 훅에 전달, 결과를 QuoteCard로 렌더
* QuoteCard는 순수 표시 컴포넌트로 유지(데이터 페칭과 분리)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `app/page.tsx`에서 `QuoteCard` 직접 호출을 `QuoteSection`으로 교체

**Files:**
- Modify: `app/page.tsx` (import 라인 12 부근, 사용처 라인 192 부근)

목적: 메인 페이지가 더 이상 `QuoteCard`를 직접 사용하지 않고, fallback 명언을 `QuoteSection`에 props로 전달하도록 변경. 이 task가 완료되면 페이지는 정적 HTML에서는 fallback 명언을, 브라우저 로드 후엔 inspire-me의 그날의 명언을 표시한다.

- [ ] **Step 5.1: `app/page.tsx` import 라인 교체**

기존(라인 12):
```tsx
import { QuoteCard } from '@/components/home/quote-card';
```

다음으로 교체:
```tsx
import { QuoteSection } from '@/components/home/quote-section';
```

- [ ] **Step 5.2: `app/page.tsx`에 fallback 상수 추가**

기존(라인 20 근처, 다른 const 옆):
```tsx
const RECENT_TONES = ['sage', 'butter', 'rose', 'cream'] as const;
```

바로 아래(또는 가까운 위치)에 추가(파일 상단의 다른 import 옆에 `QuoteViewData` 타입도 함께 import):

```tsx
// 다른 import 옆 (예: QuoteSection import 바로 아래)
import type { QuoteViewData } from '@/hooks/use-quote-of-the-day';
```

```tsx
// const RECENT_TONES 아래
const QOTD_FALLBACK: QuoteViewData = {
  content: '잘 정리된 노트는 미래의 나에게 보내는 가장 좋은 선물.',
  attribution: '— writing principle',
};
```

설명: `as const` 대신 명시적 타입 어노테이션을 써서 `QuoteSection`의 `fallback` props 타입과 의도된 일치를 명확히 한다.

- [ ] **Step 5.3: `app/page.tsx`의 `<QuoteCard ... />` 호출을 `<QuoteSection fallback={...} />`로 교체**

기존(Task 2 이후 상태, 라인 192-195 근처):
```tsx
        <QuoteCard
          content="잘 정리된 노트는 미래의 나에게 보내는 가장 좋은 선물."
          attribution="— writing principle"
        />
```

다음으로 교체:
```tsx
        <QuoteSection fallback={QOTD_FALLBACK} />
```

- [ ] **Step 5.4: 타입 체크 통과 확인**

Run: `npm run check`
Expected: 에러 없이 종료. (`QuoteCard` import가 사라졌으니 미사용 import 경고도 없음.)

- [ ] **Step 5.5: 정적 export 빌드 통과 확인**

Run: `npm run build`
Expected: 빌드 성공. `out/` 디렉토리가 생성되고 메인 페이지(`out/index.html`)에 fallback 명언 텍스트("잘 정리된 노트는 미래의 나에게 보내는 가장 좋은 선물.")가 포함되어 있어야 함.

확인:
```bash
grep -c "잘 정리된 노트는" out/index.html
# Expected: 1 이상 (정적 HTML에 fallback 명언이 박혀 있음)
```

- [ ] **Step 5.6: 커밋**

```bash
git add app/page.tsx
git commit -m "$(cat <<'EOF'
[feature/qotd-on-homepage] 메인 페이지에서 QuoteSection으로 inspire-me QOTD 연동

* QuoteCard 직접 호출을 <QuoteSection fallback={QOTD_FALLBACK} />로 교체
* 정적 HTML에 fallback 명언이 박힘 → 브라우저에서 widget API로 교체
* QuoteCard import 제거

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 통합 수동 검증

**Files:** 없음(검증 전용 task)

목적: 사용자 시나리오 3개(정상 / offline / 새 탭)가 모두 의도대로 동작하는지 브라우저에서 확인.

- [ ] **Step 6.1: 개발 서버 기동**

Run: `npm run dev`
브라우저에서 `http://localhost:3000` 열기.

- [ ] **Step 6.2: 정상 시나리오 확인**

- [ ] 초기 페인트에 fallback 명언("잘 정리된 노트는 …")이 **즉시** 보임(스켈레톤/공백 없음).
- [ ] 1-2초 안에 명언이 inspire-me의 오늘의 명언으로 교체됨(텍스트가 다르면 정상).
- [ ] 교체된 카드에 hover 시 시각 피드백(`opacity-90`)이 나타남.
- [ ] DevTools Network 탭에서 `GET https://inspire-me.advenoh.pe.kr/api/widget/quote-of-the-day?language=ko` 요청이 200으로 응답함.
- [ ] DevTools Console에 에러/경고 없음.

- [ ] **Step 6.3: 새 탭 이동 확인**

- [ ] 교체된 명언 카드 클릭 → **새 탭**으로 `https://inspire-me.advenoh.pe.kr/quotes/{id}` 형식의 URL이 열림.
- [ ] 원래 blog-v2 탭은 그대로 유지됨.
- [ ] 모바일 viewport(DevTools 디바이스 모드)에서도 카드 전체가 탭 가능한 영역인지 확인.

- [ ] **Step 6.4: 오프라인 fallback 시나리오 확인**

- [ ] DevTools Network 탭에서 throttling을 **Offline**으로 설정.
- [ ] 페이지 새로고침(Cmd+R).
- [ ] fallback 명언("잘 정리된 노트는 …")이 그대로 표시됨.
- [ ] 카드에 hover해도 클릭 가능 표시 없음(`<a>`가 아닌 `<div>`로 렌더됨).
- [ ] 카드를 클릭해도 아무 일도 일어나지 않음.
- [ ] Console에 `[useQuoteOfTheDay] failed to fetch QOTD: ...` warning이 한 번 찍힘(에러 아님).

- [ ] **Step 6.5: throttling 해제 및 dev 서버 종료**

DevTools Network throttling을 No throttling으로 복원, 터미널에서 dev 서버 Ctrl+C로 종료.

- [ ] **Step 6.6: 정적 export 산출물 sanity 체크**

Run: `npm run build && npx serve@latest out -l 3001`
별도 터미널에서 `curl -s http://localhost:3001/ | grep -c "잘 정리된 노트는"` 실행 → 1 이상이면 정적 HTML에 fallback이 박혀 있음. Ctrl+C로 serve 종료.

- [ ] **Step 6.7: 검증 완료 커밋 (선택, no-op 변경이 있을 때만)**

검증 중 코드 변경이 없었다면 추가 커밋 불필요. 만약 빌드 산출물 외 변경이 발생했다면 별도 task로 빼서 해결한다(이 plan은 종료).

---

## Out of Scope (의도적으로 본 plan에서 제외한 항목)

- **단위 테스트 추가**: blog-v2에 테스트 인프라(Vitest/Jest/@testing-library)가 없음. 인프라 도입은 별도 plan으로 처리.
- **blog-v2 CLAUDE.md 갱신**: 현재 파일이 outdated(React 18 + Express로 적혀 있으나 실제는 Next.js 16 App Router 정적 export). 본 작업과 무관하므로 별도 PR로 처리 권장.
- **다국어/언어 토글**: 스펙 §3 비목표.
- **캐싱(localStorage/SWR/TanStack Query)**: 스펙 §3 비목표. 페이지당 1회 호출이라 캐싱 가치가 낮음.
- **로딩 스켈레톤**: fallback이 즉시 렌더되므로 스켈레톤이 보일 시점이 없음.
- **재시도/backoff**: 명언은 비핵심 데코레이션. 한 번 실패하면 fallback으로 충분.

---

## Done Criteria

- [ ] 모든 Task의 모든 Step 체크박스 완료.
- [ ] `npm run check`, `npm run build` 모두 통과.
- [ ] 정상/오프라인/새 탭 시나리오 모두 수동 확인 완료.
- [ ] `feature/qotd-on-homepage` 브랜치에 의도된 커밋만 존재(빌드 산출물 같은 의도치 않은 변경 없음).
- [ ] 사용자가 PR 생성을 요청하면 `gh pr create` + HEREDOC으로 PR 작성.
