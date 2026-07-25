# 블로그 글 슬라이드 임베드 설계

- 작성일: 2026-07-26
- 대상: `blog-v2.advenoh.pe.kr` (Next.js App Router, 정적 export, Netlify 배포)
- 목표: 글 폴더에 둔 슬라이드 HTML을 공개 URL로 서빙하고, 본문에서 원하는 위치에 임베드한다

## 배경 / 동기

`contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides.html`에 발표용 슬라이드 데크를 만들어 두었으나 블로그에서 접근할 방법이 없다.

- `contents/`는 정적 서빙 대상이 아니다. Next는 `public/`만 서빙하고, `output: 'export'`라 최종 `out/`에는 라우트 산출물과 `public/` 내용만 들어간다
- `scripts/copy-images.ts:7`의 `IMAGE_EXTENSIONS` 화이트리스트가 이미지 확장자만 복사한다. `.html`은 걸러진다
- 코드·본문 어디에도 `slides.html` 참조가 없고, Netlify의 `/* → /404.html` 규칙 때문에 임의 경로 접근도 404다

앞으로 시리즈 글에 슬라이드를 계속 붙일 계획이므로, 이 글 하나를 손으로 처리하는 대신 **규약**으로 만든다.

## 요구사항

- 글 폴더에 슬라이드 파일을 두면 별도 설정 없이 동작한다
- 한국어/영어 글에 각각 다른 데크를 붙일 수 있다 (`index.md` / `index_en.md` 페어링과 같은 패턴)
- 임베드 위치를 글마다 지정할 수 있다 (예: `# 6. 마무리` 섹션 안)
- 슬라이드만 따로 공유할 수 있는 공개 URL이 있고, 기존 글 주소 체계를 계승한다
- 모바일에서 읽을 수 없는 크기로 렌더되지 않는다
- 데크가 이미 가진 기능(전체화면 등)이 임베드 안에서 죽지 않는다

## 현재 구조 (변경 전)

- 스택: Next.js App Router + `output: 'export'`, `trailingSlash: true`, Netlify(`publish = out`)
- 콘텐츠: `contents/{category}/{글폴더}/index.md`, `index_en.md`
- 라우트 slug은 카테고리를 뺀 글 폴더명(`app/[slug]/page.tsx:34`, `getArticleTitleFromSlug()`) → 글 주소는 `/{글폴더}/`, 영문은 `/en/{글폴더}/`
- 자산 복사: `scripts/copy-images.ts` — `contents/`를 재귀 스캔해 이미지를 `public/images/{category}/{글폴더}/`로 복사. mtime·size가 같으면 스킵
- 마크다운: `lib/markdown.ts` — `remarkRehype({allowDangerousHtml:true})` + `rehypeRaw`. **sanitize 단계가 없어 raw HTML이 그대로 렌더된다** (본문에서 `<details>`를 이미 이렇게 쓰고 있다). 파싱 후 상대경로 이미지 `src`를 `/images/{slug}/`로 치환하는 문자열 후처리가 있다(`lib/markdown.ts:63-66`)
- `parseMarkdown(markdown, slug)` 호출처는 `lib/articles.ts:94` 한 곳
- `public/`은 통째로 gitignore되어 있다 (빌드 산출물)
- 테스트 러너가 없다. `package.json`에 `test` 스크립트가 없고 `check`(tsc)만 있다

## 대상 자산의 특성 (`slides.html`)

설계 판단의 근거가 되므로 명시한다.

- **자기완결형**이다. inline `<style>` + inline `<script>` 하나뿐이고 외부 CDN 요청이 0이다. 정적 파일로 올리면 그대로 동작한다
- **1280×720 고정 무대**를 `Math.min(wrap.clientWidth/1280, wrap.clientHeight/720)`로 스케일한다. 16:9 컨테이너에 최적이고, 별도 반응형 처리가 필요 없다
- 키보드: `←` `→` 이동, `o` 개요, `n` 발표자 노트, `t` 테마 토글, `f` 전체화면, `?` 도움말 (`slides.html:2215-2235`)
- `#N` 해시 딥링크를 지원한다
- **`f`(전체화면)는 `requestFullscreen()`을 호출한다.** iframe에 `allowfullscreen`이 없으면 브라우저 권한 정책이 차단하므로, 속성을 주지 않으면 이미 있는 기능이 죽는다
- iframe 안의 키 입력은 프레임을 한 번 클릭해 포커스가 잡힌 뒤에 동작한다

## 설계

### 1. 파일 규약

```
contents/{category}/{글폴더}/
  ├── index.md          ← <!-- slides --> 마커를 원하는 위치에 한 줄
  ├── index_en.md
  ├── slides.html       ← 한국어 데크
  └── slides_en.html    ← 영문 데크 (없으면 영문 글에 임베드가 뜨지 않는다)
```

본문 파일 네이밍(`index.md` / `index_en.md`)과 같은 패턴이라 새 개념이 생기지 않는다. 영문 데크는 나중에 파일만 떨구면 자동으로 붙는다.

### 2. 공개 URL

**글 주소 + `/slides/`** 로 정한다.

```
https://blog.advenoh.pe.kr/{글폴더}/slides/       ← 한국어
https://blog.advenoh.pe.kr/en/{글폴더}/slides/    ← 영문
```

짧은 ASCII 별칭(`/slides/grafana-1/`, 44자)도 검토했으나 채택하지 않았다. 이 블로그의 글 주소는 이미 인코딩 기준 131자이고, 슬라이드 주소는 거기에 `slides/` 7자가 붙은 138자다. URL 길이는 슬라이드가 새로 만드는 비용이 아니라 블로그 전체가 이미 감수하고 있는 비용이다. 반대로 별칭을 도입하면 글마다 고유 id를 짓고, manifest에 필드를 추가하고, 중복을 검사해야 한다. 얻는 것에 비해 유지비가 크다.

이 결정 덕분에 규칙이 **"글 주소 + `/slides/`"** 하나로 끝나고, 아래 4번에서 마커가 위치만 지정하면 되므로 설계가 단순해진다.

짧은 주소가 나중에 정말 필요해지면 `netlify.toml`에 리다이렉트 두 줄을 추가하면 된다. 지금은 만들지 않는다.

### 3. 자산 복사 — `scripts/copy-images.ts` → `copy-assets.ts`

이미지와 슬라이드는 경로 변환 규칙이 다르므로 탐색·복사 함수를 분리한다.

| 대상 | 원본 | 복사 위치 |
|---|---|---|
| 이미지 | `contents/{category}/{글폴더}/*.png` 등 | `public/images/{category}/{글폴더}/` (기존 그대로) |
| 한국어 데크 | `contents/{category}/{글폴더}/slides.html` | `public/{글폴더}/slides/index.html` |
| 영문 데크 | `contents/{category}/{글폴더}/slides_en.html` | `public/en/{글폴더}/slides/index.html` |

- 슬라이드 경로에서 카테고리를 떼는 규칙은 라우트가 쓰는 `getArticleTitleFromSlug()`와 같다. 스크립트는 단독 node 프로세스라 의존성을 최소화하는 기존 방침(`scripts/generate-content-manifest.ts:21-22`)에 따라 인라인 복제하되, 출처를 주석으로 남긴다
- 기존 mtime·size 비교 스킵 로직을 그대로 재사용한다
- 이제 이미지만 복사하지 않으므로 파일명을 `copy-assets.ts`로 바꾸고 `package.json`의 `copy:images` → `copy:assets`, `build` 체인 문자열을 함께 수정한다

### 4. 마커 → 임베드 렌더 — `lib/markdown.ts`

`parseMarkdown(markdown, slug)`에 `lang: 'ko' | 'en' = 'ko'` 인자를 추가한다. 호출처는 `lib/articles.ts:94` 한 곳뿐이다.

치환은 **`matter()`로 frontmatter를 분리한 뒤, unified 파이프라인에 넣기 전의 `content` 문자열**에서 수행한다(`lib/markdown.ts:41`과 `:44` 사이). 마커가 HTML 주석이라 파이프라인을 통과해 출력에도 남지만, 주석 보존 동작에 의존하지 않는 쪽이 안전하다. `rehypeRaw`가 이미 켜져 있으므로 삽입한 raw HTML 블록은 그대로 렌더된다. CommonMark의 HTML 블록 규칙상 `<div>`로 시작하는 덩어리는 내부가 마크다운으로 재해석되지 않는다.

이 시점에는 `data.title`이 이미 파싱되어 있으므로 iframe `title` 속성에 글 제목을 넣을 수 있다. 제목에 `"`나 `&`가 들어갈 수 있으므로 속성에 넣기 전 HTML 이스케이프한다.

```
마커: <!-- slides -->
base: lang === 'en' ? `/en/{글폴더}` : `/{글폴더}`   ({글폴더} = slug의 마지막 세그먼트)
```

마커가 없으면 아무 것도 하지 않는다. 마커가 있는데 슬라이드 파일이 없는 경우는 `parseMarkdown`이 파일시스템을 보지 않으므로 여기서 감지하지 않고, 7번의 빌드 경고가 담당한다.

### 5. 마크업

```html
<div class="slides-embed">
  <iframe class="slides-embed__frame" src="{base}/slides/"
          title="{글 제목} 슬라이드" loading="lazy" allowfullscreen></iframe>
  <a class="slides-embed__open" href="{base}/slides/" target="_blank" rel="noopener">
    슬라이드 새 탭에서 열기 →</a>
  <p class="slides-embed__hint">
    슬라이드를 클릭한 뒤 <kbd>←</kbd> <kbd>→</kbd> 이동 · <kbd>f</kbd> 전체화면 · <kbd>?</kbd> 도움말</p>
</div>
```

- `loading="lazy"` — 임베드가 글 최하단에 오므로 초기 로딩에 영향이 없다. 클릭 로드(파사드) 방식은 이 효과를 이미 얻고 있어 클라이언트 컴포넌트를 추가할 이유가 없다
- `allowfullscreen` — 데크의 `f` 키를 살리기 위한 필수 속성이다
- 조작 안내는 iframe 포커스 문제 때문에 필요하다
- **JS 0줄.** 새 클라이언트 컴포넌트를 만들지 않는다

### 6. 스타일 — `app/globals.css`

기존 `.prose-bento details` 카드 스타일(519행 부근) 옆에 배치한다.

- 데스크톱: `.slides-embed__frame`에 `aspect-ratio: 16/9`, 본문 폭 100%. 아래에 새 탭 링크와 조작 안내
- 모바일(`max-width: 767px`): `__frame`과 `__hint`를 `display:none`, `__open`을 카드형 버튼으로 승격

모바일 폭 360px에서는 데크 스케일이 0.28이라 글자를 읽을 수 없다. 미디어 쿼리 하나로 갈라 모바일 독자는 새 탭에서 가로로 보게 한다. JS 분기는 쓰지 않는다.

데크에는 `t` 키 테마 토글이 들어 있어 라이트/다크 대응은 데크가 자체적으로 처리한다. 블로그 테마와 연동하지 않는다.

### 7. 빌드 검증 경고 — `scripts/generate-content-manifest.ts`

이미 md 본문을 읽고 있으므로 여기서 짝이 맞는지 검사하고 경고만 출력한다. manifest 스키마는 변경하지 않는다(2번 결정으로 id 필드가 불필요해졌다).

- 슬라이드 파일은 있는데 마커가 없음 → 경고
- 마커는 있는데 슬라이드 파일이 없음 → 경고

기존 `⚠️  No index.md found` 경고(`scripts/generate-content-manifest.ts:61`)와 같은 방식이다. 빌드를 실패시키지는 않는다.

### 8. 검색 인덱스 정리 — `scripts/generate-search-index.ts`

`cleanContent`(29-36행)가 코드블록·이미지·링크는 정리하지만 **HTML 태그는 지우지 않는다.** 현재 인덱스 188건 중 **56건**의 본문에 `<img src="biweekly.png" ...>` 같은 마크업이 그대로 남아 있다. 코드블록 제거 뒤에 주석 제거와 태그 제거를 추가한다. 코드블록을 먼저 지우므로 코드 안의 꺾쇠는 영향을 받지 않는다.

단, **이 글에는 효과가 없다.** `cleanContent.slice(0, 5000)`으로 앞 5000자만 인덱싱하는데, 이 글의 `<details>` 블록과 마커는 모두 그 뒤에 있어 애초에 인덱스에 들어가지 않는다. 실제 효과는 기존 56건 정리이고, 마커 제거는 짧은 글에서 마커가 앞쪽에 올 경우를 위한 예방이다.

## 적용

grafana 1편 `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md`의 `# 6. 마무리` 안, 다음 편 예고 문단 뒤에 `<!-- slides -->`를 넣는다. 영문 데크는 이번에 만들지 않으므로 `index_en.md`는 건드리지 않는다.

## 검증 방법

테스트 러너가 없고 vitest 도입은 이번 범위를 넘는다. 빌드 산출물로 검증한다.

1. `npm run check` — 타입 검사 (`parseMarkdown` 시그니처 변경 반영 확인)
2. `npm run build` — `out/{글폴더}/slides/index.html` 생성 확인, manifest 경고가 뜨지 않는지 확인
3. `npm run start` — 글 페이지에서 임베드 렌더, `f` 전체화면 동작, 새 탭 링크, 모바일 폭(≤767px) fallback 확인
4. 검색 인덱스에서 HTML 마크업이 제거됐는지 확인 — `grep -o '<img' public/search-index.json | wc -l`이 0

## 미확인 지점 / 리스크

- **`public/{글폴더}/slides/`와 라우트 산출물 `out/{글폴더}/index.html`이 같은 디렉토리를 공유한다.** 파일 경로가 정확히 겹치지 않아 문제없을 것으로 보지만 검증되지 않은 추측이다. 위 2단계 빌드에서 확인한다. Next가 거부하면 차선은 `/slides/{글폴더}/`이며, 글 주소 계승은 포기하되 한글 slug는 유지한다
- `next dev`가 `public/` 하위 디렉토리의 `index.html`을 자동 해석하는지 불확실하다. dev에서 확인이 안 되면 `/{글폴더}/slides/index.html`로 직접 접근해 확인하고, 최종 판단은 `npm run build` + `npm run start`로 한다
- 글 폴더명이 기존 라우트(`series`, `tags`, `posts`, `en` 등)와 충돌하면 문제가 되지만, 그런 이름의 글은 지금도 `/{글폴더}/` 라우트와 충돌하므로 새로 생기는 위험이 아니다

## 범위 밖 (YAGNI)

- 짧은 공유 별칭(`/s/{id}`) — 필요해지면 Netlify 리다이렉트로 추가
- 슬라이드 전용 og 이미지·메타 태그·sitemap 등록
- 슬라이드 목록 페이지
- 블로그 테마와 데크 테마 연동
- 클릭 로드(파사드) 방식 — `loading="lazy"`로 이미 해결
- 다른 글로의 소급 적용
