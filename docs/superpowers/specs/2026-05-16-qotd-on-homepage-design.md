---
date: 2026-05-16
status: draft
project: blog-v2.advenoh.pe.kr
related:
  - inspireme.advenoh.pe.kr (외부 API 제공)
---

# 메인 페이지 명언 카드를 inspire-me QOTD로 교체

## 1. 배경 (Context)

blog-v2 메인 페이지의 `QuoteCard`는 현재 `app/page.tsx:192-199`에 텍스트가 하드코딩되어 있다. 별도의 명언 서비스인 inspire-me(`https://inspire-me.advenoh.pe.kr/`)에 "오늘의 명언(Quote of the Day, QOTD)" 기능이 이미 구현되어 있으므로, 이를 연동해 매일 자동으로 갱신되는 명언이 표시되도록 한다. 동시에 카드를 클릭하면 inspire-me의 해당 명언 상세 페이지로 이동하게 만들어, 두 사이트 간 트래픽이 자연스럽게 연결되도록 한다.

## 2. 목표 (Goals)

- 메인 페이지 명언 카드가 매일 inspire-me의 그날의 명언을 표시한다.
- 명언 카드 전체가 클릭 가능하며, inspire-me의 해당 명언 상세 페이지(`/quotes/{id}`)를 새 탭으로 연다.
- API 호출 실패/지연 시에도 메인 페이지 레이아웃이 깨지지 않고, 사용자가 정적 fallback 명언을 즉시 본다.
- 외부 API 의존성을 최소 비용으로 추가한다(인증 키, 도메인 화이트리스트, 추가 의존성 없음).

## 3. 비목표 (Non-goals)

- 다국어 명언 표시(영어/한국어 토글). 현재 blog-v2에 언어 토글 UI가 없어 `language=ko` 고정.
- 명언 캐싱(localStorage, SWR/TanStack Query 등). 페이지당 1회 호출이라 캐싱 가치가 낮음.
- 로딩 스켈레톤. fallback이 즉시 표시되므로 불필요.
- API 실패 시 재시도 로직. 명언은 페이지의 데코레이션이며 핵심 콘텐츠가 아님.
- 명언 카테고리/태그/배경 이미지 등 추가 메타 표시.

## 4. 아키텍처

### 4.1 데이터 플로

```
[빌드 타임]
  app/page.tsx (server) → <QuoteSection fallback={{content, attribution}} />
       → QuoteSection이 'use client' 경계이지만 fallback은 server에서 props로 전달
       → 정적 HTML에 fallback 명언이 포함된 채 배포됨

[브라우저 런타임]
  1. HTML 도착 → fallback 명언 즉시 표시 (깜빡임 없음, SEO 친화적)
  2. JS 하이드레이션 → QuoteSection 내부 useQuoteOfTheDay(fallback)의
       useEffect에서 widget API fetch
       GET https://inspire-me.advenoh.pe.kr/api/widget/quote-of-the-day?language=ko
  3a. 성공 → content/attribution/href 교체, 카드 전체가 새 탭 링크가 됨
       href = https://inspire-me.advenoh.pe.kr/quotes/{id}
  3b. 실패 → fallback 유지, href 없음 → 클릭 비활성
```

### 4.2 외부 API 선택 근거

inspire-me 백엔드는 동일 QOTD 데이터에 대해 세 가지 엔드포인트를 제공한다:

| 엔드포인트 | 인증 | CORS | 적합도 |
|---|---|---|---|
| `/api/quote-of-the-day` | Internal Token | 제한적 | ❌ 내부용 |
| `/api/v1/quote-of-the-day` | API Key 필수 (Bearer) | `localhost:3000`, `inspireme.advenoh.pe.kr`만 | ⚠️ 키 발급/보관 부담 |
| `/api/widget/quote-of-the-day` | 없음 | `*` (모든 origin) | ✅ 임베드용으로 설계됨 |

본 작업에서는 **widget API**를 채택한다. 이유:
- 인증 키 없음 → 정적 사이트에서도 별도 비밀 관리 불필요.
- CORS가 모든 origin 허용 → blog-v2 도메인 추가 등의 백엔드 변경 불필요.
- IP당 분당 60회 rate limit → 일반 블로그 트래픽에 충분.
- 명시적으로 외부 임베드용으로 설계된 엔드포인트.

### 4.3 컴포넌트 단위 분리

| 단위 | 책임 | 의존 |
|---|---|---|
| `QuoteCard` | 명언 카드의 순수 표시. `href` 유무에 따라 `<a>` 또는 `<div>`로 렌더. | 없음 |
| `useQuoteOfTheDay` | inspire-me widget API 호출과 fallback 상태 관리. | `lib/inspireme` |
| `QuoteSection` | `'use client'` 경계. 훅을 호출하고 결과를 `QuoteCard`에 전달. | `QuoteCard`, `useQuoteOfTheDay` |
| `lib/inspireme` | API base URL 상수, 응답 타입, URL 빌더(`quoteDetailUrl(id)`). | 없음 |
| `app/page.tsx` | server 컴포넌트 유지. fallback 명언을 `QuoteSection`에 props로 전달. | `QuoteSection` |

각 단위는 단독으로 이해/테스트 가능하며, 표시 컴포넌트(`QuoteCard`)는 데이터 페칭에 의존하지 않는다.

## 5. 컴포넌트 API

### 5.1 `QuoteCard` props (변경)

```ts
type Props = {
  content: string;       // 명언 본문 (한 문장)
  attribution: string;   // 예: "— 소크라테스", "— writing principle"
  href?: string;         // 있으면 카드 전체가 새 탭 링크, 없으면 일반 카드
};
```

- 기존 `lines: string[]`는 제거. 단일 문자열을 받고 CSS(`text-balance`, `max-w-*`)로 시각적 줄바꿈을 처리한다.
- `href`가 있으면 `<a href target="_blank" rel="noopener noreferrer">`로 카드 전체를 감싸고 hover 상태를 추가한다.
- `href`가 없으면 `<div>`로 감싸며, hover 효과/커서 변경 없음(= fallback 시 클릭 불가가 시각적으로 명확).

### 5.2 `useQuoteOfTheDay` 반환값

```ts
type QuoteViewData = {
  content: string;
  attribution: string;
  href?: string;
};

function useQuoteOfTheDay(fallback: QuoteViewData): QuoteViewData;
```

- 초기 반환값 = `fallback`. fetch 성공 시 새로운 `QuoteViewData`로 교체된다.
- 실패/이상 응답 시 `fallback` 유지(상태 변경 없음). 구체적 에러/로딩 플래그는 노출하지 않는다(소비자가 분기할 일이 없음).
- 컴포넌트 unmount 시 응답이 늦게 도착해도 setState하지 않도록 cancelled 플래그를 사용한다.

### 5.3 inspire-me 응답 매핑

widget API 응답 (`backend/pkg/widget/handler.go:281-298`의 `widgetQuoteResponse` 기준):

```json
{
  "data": {
    "id": "q-abc123",
    "content": "오늘도 좋은 하루 되세요",
    "author": "소크라테스",
    "language": "ko",
    ...
  }
}
```

매핑 규칙:
- `content`: `data.content` 그대로.
- `attribution`: `data.author`가 있으면 `— ${data.author}`, 없거나 빈 문자열이면 fallback의 attribution을 유지.
- `href`: `data.id`가 있으면 `https://inspire-me.advenoh.pe.kr/quotes/${data.id}`, 없으면 `undefined`.

## 6. 에러/예외 처리

| 상황 | 동작 |
|---|---|
| HTTP 200 + 정상 JSON | 데이터 교체, href 활성 |
| 4xx/5xx 응답 | fallback 유지, 콘솔에 warning |
| 네트워크 실패(offline 등) | fallback 유지, 콘솔에 warning |
| JSON 파싱 실패 | fallback 유지, 콘솔에 warning |
| 응답에 `id` 없음 | content/attribution은 갱신, `href`만 undefined로 둠(부분 graceful degrade) |
| Rate limit(429) | fallback 유지(다른 실패와 동일 처리) |
| 컴포넌트 unmount 후 응답 도착 | setState 호출하지 않음(cancelled 플래그) |

핵심 원칙: 명언 카드는 데코레이션이므로 어떤 실패에도 메인 페이지 렌더를 방해하지 않는다.

## 7. 테스트 전략

### 7.1 단위 테스트 (blog-v2 기존 테스트 환경에 따라 Vitest/Jest 중 선택)

- `QuoteCard`
  - `href` 있을 때 `<a>` 렌더 및 `href`, `target="_blank"`, `rel="noopener noreferrer"` 속성 검증.
  - `href` 없을 때 `<div>` 렌더 검증, 링크/포커스 가능 요소 없음 확인.
  - `content`, `attribution` 텍스트 노출 확인.
- `useQuoteOfTheDay`
  - `fetch` mock으로 정상 응답 → fallback이 새 데이터로 교체되는지 확인.
  - 404/500 응답 → fallback 유지 확인.
  - 네트워크 실패(`fetch` reject) → fallback 유지 확인.
  - 응답에 `id` 없음 → `content/attribution`은 갱신, `href`만 `undefined` 확인.
  - unmount 후 응답 도착해도 setState 미호출 확인(act warning 없음).

### 7.2 수동 확인 (`npm run dev`)

- 메인 페이지 접속 → 초기 페인트에 fallback 명언 즉시 보임 → 잠시 후 inspire-me 명언으로 교체됨.
- 교체된 카드 클릭 → inspire-me의 해당 명언 상세 페이지가 **새 탭**으로 열림.
- devtools network를 offline으로 → 새로고침 → fallback 그대로 보이며 클릭해도 반응 없음.
- 모바일 viewport에서 카드 전체가 탭 가능한지 확인.

## 8. YAGNI 체크 (의도적 제외 항목)

- **localStorage/SWR 캐싱**: 페이지당 1회 호출이므로 캐싱 효용 < 복잡도.
- **다국어 토글**: blog-v2에 토글 UI 자체가 없음. `language=ko` 고정.
- **로딩 스켈레톤**: fallback이 즉시 렌더되므로 스켈레톤이 보일 시점이 없음.
- **재시도(retry/backoff)**: 명언은 비핵심 데코레이션. 한 번 실패하면 fallback으로 충분.
- **카테고리/태그/배경 이미지**: 현재 카드 디자인 범위 밖. 추후 별도 작업.

## 9. 미해결/추후 결정 사항

- blog-v2 테스트 환경(Vitest/Jest 여부, 셋업 상태)은 구현 시점에 확인. 만약 컴포넌트 테스트 인프라가 없으면 추가 도입 여부를 별도 논의(기본 가정은 기존 패턴 따름).
- inspire-me API base URL은 모든 환경(dev/prod)에서 production URL(`https://inspire-me.advenoh.pe.kr`)을 사용. 향후 staging이 필요해지면 환경 변수로 분리한다.
