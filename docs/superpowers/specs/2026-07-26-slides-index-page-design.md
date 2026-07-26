# 발표 슬라이드 목록 페이지 설계

- 작성일: 2026-07-26
- 대상: `blog-v2.advenoh.pe.kr`
- 목표: 슬라이드가 있는 글의 발표 자료만 한곳에 모아 보고, 카드에서 바로 발표 화면으로 들어간다
- 선행 작업: `2026-07-26-slides-embed-design.md`, `2026-07-26-slides-theme-sync-design.md`

## 배경 / 동기

글마다 발표 슬라이드를 붙일 수 있게 됐고 현재 데크가 7개 쌓였다. 그런데 이 데크들에 닿는 길이 **글을 통해서밖에 없다.** 어떤 글에 발표 자료가 있는지 목록으로 볼 수 없고, 발표 자료를 찾으려면 글을 열어 본문 중간의 임베드까지 스크롤해야 한다.

`/series`가 시리즈를 모아 보여주듯, 발표 자료도 별도 페이지로 모은다.

## 요구사항

1. `/slides`에서 슬라이드가 있는 글을 카드 목록으로 보여준다
2. 카드를 누르면 **곧바로 발표 화면**(`/{articleDir}/slides/`)으로 간다 — 글 페이지를 경유하지 않는다
3. 카드는 텍스트만 쓴다. 데크 썸네일·미리보기는 만들지 않는다
4. `/en/slides`도 함께 만든다. 영문 데크가 없는 동안은 빈 상태를 보여준다
5. 헤더 네비게이션에 항목을 추가한다
6. 발표 화면에서 글로 돌아오는 경로를 만든다

## 현재 구조 (변경 전)

**빌드 순서** (`package.json`)

```
generate:manifest → generate:search → generate:feeds → copy:assets → next build
```

**데이터** — `scripts/generate-content-manifest.ts`가 `contents/`를 훑어 `public/content-manifest.json`을 만들고, 모든 페이지가 `lib/articles.ts`를 통해 그걸 읽는다.

이 스크립트는 **이미 글마다 슬라이드 유무를 계산한다.**

```ts
const slidesFile = lang === 'en' ? 'slides_en.html' : 'slides.html';
const hasSlidesFile = fs.existsSync(path.join(dirPath, slidesFile));
const hasSlidesMarker = /<!--\s*slides\s*-->/.test(contentWithoutCode);
// → 짝이 안 맞으면 경고만 찍고 값은 버린다
```

**배포** — `scripts/copy-assets.ts`가 `contents/**/slides.html` → `public/{articleDir}/slides/index.html`, `slides_en.html` → `public/en/{articleDir}/slides/index.html`로 복사하면서 테마 동기화 스크립트를 `</head>` 앞에 주입한다. 원본은 건드리지 않는다.

**네비게이션** — `components/site-header.tsx`의 `NAV` 배열 하나가 데스크톱 pill과 모바일 메뉴를 함께 그린다. 라벨은 `lib/i18n/dictionaries.ts`의 `t.nav[key]`. `/en/*` 페이지는 한국어 페이지를 복제해 `'en'`만 넘기는 구조다.

**타입 중복** — `ArticleMetadata`(스크립트)와 `ManifestArticle`(`lib/articles.ts`)이 같은 모양을 각자 손으로 선언하고 있다. 기존 부채이며 이번에 통합하지 않는다.

## 핵심 전제

- **데크 배포는 본문 마커와 무관하다.** `copy-assets.ts`는 `slides.html` 파일만 보고 복사한다. 마커(`<!-- slides -->`)는 *본문에 임베드가 박히는지*만 정한다. 따라서 마커가 없어도 `/{articleDir}/slides/`는 존재한다
- 글 주소는 카테고리를 포함하지 않는다 — `/{articleDir}/`. manifest의 `slug`는 `{category}/{articleDir}`이므로 둘을 혼동하면 안 된다
- 데크는 전부 같은 템플릿(`.claude/skills/generate-slides/assets/deck-template.html`)에서 나오므로 `.chrome`, `--ink-faint`, `--accent` 같은 구조와 변수가 보장된다

## 설계

### 1. manifest 확장 — `scripts/generate-content-manifest.ts`

`ArticleMetadata`에 선택적 필드 둘을 추가한다. 선택적이므로 기존 소비자는 영향받지 않는다.

| 필드 | 값 |
|---|---|
| `hasSlides?: boolean` | `slides.html`(en은 `slides_en.html`) **파일이 존재하면** `true` |
| `slideCount?: number` | 그 파일의 `data-n="\d+"` 매치 개수. `0`이면 필드를 생략한다 |

`hasSlides`의 기준은 **파일 존재뿐이다.** 마커를 조건에 넣으면 실제로 배포된 데크를 목록에서 빠뜨린다(핵심 전제 참고). 기존 경고 로직(`hasSlidesFile`/`hasSlidesMarker` 짝 검사)은 그대로 둔다.

`lib/articles.ts`의 `ManifestArticle`에도 **같은 두 필드를 손으로 추가한다.** 타입이 두 곳에 복제돼 있어서 한쪽만 고치면 페이지에서 필드가 안 보인다.

### 2. 조회 함수 — `lib/articles.ts`

```
getArticlesWithSlides(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]>
  manifest.articles 에서 lang 일치 && hasSlides === true 인 것만
  date 내림차순 정렬
```

기존 `getArticlesByCategory` / `getArticlesBySeries`와 같은 모양이다.

### 3. 페이지 — `app/slides/page.tsx`, `app/en/slides/page.tsx`

`app/series/page.tsx`를 본뜬 서버 컴포넌트. 두 파일은 `getArticlesWithSlides()`에 넘기는 언어와 문구만 다르다(기존 ko/en 페이지 쌍과 같은 중복 방식을 따른다).

구조:

```
metadata title/description
header   eyebrow "Slides" · h1 "Slides" · 개수 문구
section  데크 0개면 빈 상태 문구, 아니면 12칼럼 그리드 카드
```

문구는 `/series` 페이지와 같이 **각 페이지 파일에 리터럴로** 둔다(사전으로 빼지 않는다 — 기존 ko/en 페이지 쌍이 모두 이 방식이다).

| 자리 | ko | en |
|---|---|---|
| `metadata.title` | `Slides \| Frank's IT Blog` | 동일 |
| `metadata.description` | `발표 슬라이드가 있는 글 모음` | `Blog posts with presentation slide decks` |
| 개수 문구 | `{n}개의 발표 자료` | `{n} slide decks` |
| 빈 상태 | `아직 발표 자료가 없습니다.` | `No slide decks yet.` |

**카드** — `<Link href={`/${articleDir}/slides/`}>`, 같은 탭. `bg-bento-butter`(`/series`는 lavender라 나란히 놓아도 구분된다).

```
┌─────────────────────────────┐
│ SLIDES              27장    │  상단 라벨 / slideCount
│                             │
│ Golang Concurrency 3편 —    │  글 제목
│ Select와 Channel 심화 패턴   │
│ ───────────────────────     │
│ Golang Concurrency          │  series (없으면 생략)
│ 2026년 4월 8일               │  date
└─────────────────────────────┘
```

`slideCount`가 없으면 분량 표시를 빼고 나머지는 그대로 그린다.

**주의**: 카드 `href`는 manifest의 `slug`(`{category}/{articleDir}`)가 아니라 `articleDir`만 써야 한다. `slug.split('/')[1]`로 뽑는다.

### 4. 네비게이션 — `components/site-header.tsx`, `lib/i18n/dictionaries.ts`

`NAV` 배열의 `series`와 `tags` **사이**에 `{ key: 'slides', href: '/slides' }`를 넣는다. 콘텐츠 묶음(글·시리즈·슬라이드) 다음에 메타(태그)가 오는 순서다.

`dictionaries.ts`의 `nav` 타입과 ko/en 사전에 각각 `슬라이드` / `Slides`를 추가한다. 배열 하나가 데스크톱 pill과 모바일 메뉴를 함께 그리므로 양쪽에 자동 반영된다.

**확인이 필요한 위험**: pill nav 항목이 4개에서 5개로 는다. 좁은 화면에서 넘치거나 줄바꿈될 수 있다.

> **실제 결과 (2026-07-26)**: 768px에서 한국어 pill 두 개(`시리즈`·`슬라이드`)가 줄바꿈됐다. 여기 적어둔 폴백 둘(라벨 축약 `발표`, `px-4`→`px-3`)을 **모두 적용해도 해결되지 않았다.** 원인은 라벨 길이가 아니라 768px 폭에 pill 5개 + 검색 + 언어 + 테마 + RSS를 다 넣는 구조 자체였다 — 항목을 늘리기 전부터 영문에서는 RSS가 잘리고 있었다.
>
> 최종 선택은 **헤더의 모바일/데스크톱 분기점을 `md`(768px)에서 `lg`(1024px)로 이동**(`components/site-header.tsx`의 `md:` 7곳)이고, 폴백 둘은 되돌렸다(라벨 `슬라이드`, 여백 `px-4`).
>
> **알려진 잔여 문제**: 본문 영역(`components/posts/*`, `components/home/*`, 글 페이지 TOC)은 여전히 `md`에서 전환된다. 768~1023px에서 헤더만 모바일이고 본문은 데스크톱 다단으로 보인다. 정렬하려면 그 컴포넌트들의 분기점도 함께 옮겨야 하며, 그건 이 작업의 범위를 넘는다.

### 5. 데크 돌아가기 링크 — `scripts/copy-assets.ts`

`injectThemeSync`와 같은 자리, 같은 방식이다. 원본 `contents/**/slides.html`은 건드리지 않는다.

주입하는 것 세 조각:

```
</head> 앞  <style>  .deck-back { … }
                     [data-framed] .deck-back { display: none }
            <script> window.self !== window.top 이면
                     document.documentElement.setAttribute('data-framed', '')

.chrome 안  <a class="deck-back" href="{articleUrl}">{label}</a>
            .deck-id 앞에 넣는다. chrome 은 flex row 라 항목 하나가 느는 것뿐이다
```

**목적지는 글 페이지다.** 데크의 원래 집이고 거기서 갤러리든 시리즈든 갈 수 있다. 갤러리로 돌아가는 건 브라우저 뒤로가기가 처리한다. 링크를 둘 두면 52px짜리 크롬 바가 붐빈다.

주소는 복사 경로를 만들 때 쓰는 값에서 그대로 나온다.

| prefix | articleUrl | label |
|---|---|---|
| `''` | `/{articleDir}/` | `← 글 보기` |
| `'en'` | `/en/{articleDir}/` | `← Article` |

라벨은 스크립트 안 리터럴로 둔다. `lib/i18n/dictionaries.ts`의 `t.slides`를 쓰는 게 이상적이지만 이 스크립트는 `tsx`로 도는 독립 프로세스라 `@/` 별칭 해석이 걸린다. 리터럴 옆에 사전 위치를 주석으로 남긴다.

**프레임 안에서는 숨긴다 — 이 설계의 핵심이다.** 데크는 글 본문에 iframe으로도 박힌다. 링크를 그냥 넣으면 *글 안의 임베드에 그 글로 가는 링크*가 생기고, 클릭하면 iframe 안에 글이 중첩되어 열린다. `</head>` 안 스크립트에서 프레임 여부를 검사하는 이유는 **첫 페인트 전에 끝내기 위해서다.** body에서 JS로 지우면 가장 흔한 화면인 글 임베드에서 링크가 한 번 깜빡였다 사라진다.

스타일은 데크의 CSS 변수(`--ink-faint`, `--accent`, `--f-mono`)로만 쓴다. 그래야 라이트/다크가 저절로 따라온다.

**실패 시**: `.chrome`을 못 찾으면 경고만 찍고 링크 없이 복사한다. 테마 동기화가 `</head>`를 못 찾을 때와 같은 태도다 — 데크 자체는 멀쩡히 동작해야 한다.

**멱등성**: 테마 동기화와 동일하다. 매번 원본(주입 없음)에서 새로 읽고 결정적으로 변환하므로 반복 빌드가 누적되지 않는다. 방어용 마커 가드도 같은 방식으로 둔다.

### 6. 문서 갱신

- `CLAUDE.md`의 "슬라이드 데크" 절에 `/slides` 목록 페이지와 돌아가기 링크를 한 줄씩 추가
- `.claude/skills/generate-slides/SKILL.md`에 "데크를 만들면 `/slides`에 자동으로 뜬다(별도 등록 불필요)"를 명시

## 엣지 케이스

| 상황 | 동작 |
|---|---|
| 데크에 `data-n`이 없음 | `slideCount` 생략, 카드에 분량 미표시 |
| `slides.html`은 있는데 본문 마커 없음 | **갤러리에 나온다.** 데크는 실제로 배포되므로 |
| `slides_en.html`은 있는데 `index_en.md`가 없음 | 데크는 복사되지만 `/en/slides`에는 안 나온다 (아래 참고) |
| 데크 0개 | 빈 상태 문구. `/en/slides`의 현재 상태 |

세 번째는 **알면서 남겨두는 구멍이다.** manifest 생성기는 `index.md`/`index_en.md`를 기준으로 순회하고 `copy-assets.ts`는 `slides*.html`을 기준으로 순회해서, 글 없는 데크는 배포는 되고 목록에는 안 뜬다. 글이 없는데 발표 자료만 있는 건 애초에 이상한 상태라 이번에 다루지 않는다. 실제로 발생하면 그때 경고를 추가한다.

## 검증 방법

이 저장소에는 테스트 프레임워크가 없다(`devDependencies`에 vitest·jest·playwright 모두 없음). 타입 체크 + 빌드 + 실제 확인으로 검증한다.

1. `npm run check` — 두 곳(`scripts/generate-content-manifest.ts`, `lib/articles.ts`)의 타입 추가가 맞물리는지
2. `npm run build` — 기존 슬라이드 마커 경고가 그대로 나오는지 (회귀 없음)
3. `public/content-manifest.json`에서 `hasSlides: true`가 **7건**인지 — 현재 한국어 데크 수와 일치해야 한다. `slideCount`가 각 데크의 실제 장 수(예: Concurrency 3편 = 27)와 맞는지
4. `out/slides/index.html`에 카드 7장, `out/en/slides/index.html`은 빈 상태
5. 카드 `href`가 실제 배포 경로(`out/{articleDir}/slides/index.html`)와 일치하는지 — 카테고리가 섞여 들어가지 않았는지 확인
6. 배포된 데크에 `deck-back`이 들어갔는지, 그리고 **글 페이지의 임베드 안에서는 보이지 않는지** — 브라우저로 직접 확인
7. 라이트/다크 양쪽에서 돌아가기 링크 대비 확인
8. 360px 폭에서 pill nav 5개가 넘치지 않는지

## 남은 리스크

- **pill nav 5개**: 좁은 화면 넘침. 구현 중 확인해 라벨/여백으로 대응
- **타입 중복**: `ArticleMetadata`와 `ManifestArticle`을 양쪽 다 고쳐야 한다. 한쪽만 고치면 `npm run check`는 통과하는데 페이지에서 필드가 `undefined`로 나온다
- **`.chrome` 의존**: 돌아가기 링크가 데크의 내부 마크업(`.chrome`, `.deck-id`)에 의존한다. 템플릿을 바꾸면 같이 깨진다. 현재 데크 7개가 모두 같은 템플릿에서 나왔고 실패해도 경고 후 계속 진행하므로 감수한다

## 범위 밖 (YAGNI)

- **데크 썸네일** — 라이브 iframe은 한 페이지에 자기완결형 HTML을 7개 띄우게 되고 데크 JS가 전역 `keydown`을 걸어 서로 간섭할 소지가 있다. 정적 캡처는 빌드에 헤드리스 브라우저를 들여야 한다. 데크가 20개쯤 쌓여 그림이 아쉬워지면 카드에 `<img>` 한 줄 추가하는 일이라 그때 올린다
- **시리즈별 그룹핑 / 필터 / 검색** — 데크 7개에는 과하다. 날짜 내림차순 하나로 충분하다
- **네비 항목의 언어별 노출 조건** — `/en/slides`를 빈 상태로 함께 내보내기로 해서 필요 없어졌다. 영문 데크가 생기면 페이지가 코드 수정 없이 채워진다
- **`ArticleMetadata` / `ManifestArticle` 타입 통합** — 기존 부채이고 이번 작업의 목적과 무관하다
- **데크에서 갤러리로 돌아가는 링크** — 글 링크 하나로 충분하다. 크롬 바가 좁다
