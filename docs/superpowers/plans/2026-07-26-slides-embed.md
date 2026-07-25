# 블로그 글 슬라이드 임베드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 폴더에 둔 `slides.html`을 `{글주소}/slides/`로 서빙하고, 본문의 `<!-- slides -->` 마커 자리에 16:9 임베드를 렌더한다.

**Architecture:** 빌드 시 자산 복사 스크립트가 `contents/{category}/{글폴더}/slides.html`을 `public/{글폴더}/slides/index.html`로 옮긴다. 렌더링은 `parseMarkdown`이 마크다운 문자열 단계에서 마커를 raw HTML 블록으로 치환하고, 이미 켜져 있는 `rehypeRaw`가 그대로 통과시킨다. 클라이언트 JS는 추가하지 않으며 모바일 분기는 CSS 미디어 쿼리 하나로 처리한다.

**Tech Stack:** Next.js App Router (정적 export), unified/remark/rehype, Tailwind + shadcn CSS 변수, tsx 스크립트

**설계 문서:** `docs/superpowers/specs/2026-07-26-slides-embed-design.md`

---

## 이 프로젝트의 검증 방식 (먼저 읽을 것)

**이 저장소에는 테스트 러너가 없다.** `package.json`에 `test` 스크립트가 없고 `check`(tsc)만 있다. vitest 도입은 설계 문서에서 명시적으로 범위 밖으로 뒀다. **테스트 프레임워크를 새로 설치하지 말 것.**

대신 두 가지로 red→green 루프를 만든다. 둘 다 실제로 동작하는 것을 확인했다.

1. **로직 검증**: `npx tsx`로 `lib/`의 함수를 직접 실행하는 임시 체크 스크립트. 구현 전에 실행해 FAIL을 확인하고, 구현 후 PASS를 확인한 뒤 스크립트를 지운다.
   - 체크 스크립트는 반드시 **`.mts` 확장자**로 만들 것. `/tmp`의 `.ts` 파일은 프로젝트의 `"type": "module"` 설정 밖이라 tsx가 CJS로 처리해 top-level await가 깨진다.
   - import 경로는 `process.cwd() + '/lib/...'`로 쓸 것. `/tmp`에서 상대 경로는 해석되지 않는다.
2. **산출물 검증**: 스크립트를 실행하고 생성된 파일과 그 내용을 확인하는 셸 명령.

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `scripts/copy-images.ts` → `scripts/copy-assets.ts` | `contents/`의 정적 자산(이미지 + 슬라이드)을 `public/`으로 복사 | 이름 변경 + 슬라이드 탐색·복사 추가 |
| `package.json` | 빌드 체인 | `copy:images` → `copy:assets` |
| `lib/markdown.ts` | 마크다운 → HTML 변환, 마커 치환 | `lang` 인자 추가 + 임베드 빌더 |
| `lib/articles.ts` | 글 로딩 | `parseMarkdown` 호출에 `lang` 전달 |
| `app/globals.css` | 본문 스타일 | 임베드 스타일 + 모바일 분기 |
| `scripts/generate-content-manifest.ts` | manifest 생성 | 마커/파일 짝 검사 경고 |
| `scripts/generate-search-index.ts` | 검색 인덱스 생성 | HTML 주석·태그 제거 |
| `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md` | 첫 적용 대상 | 마커 삽입 |

브랜치는 `feature/slides-embed`이며 설계 문서 커밋이 이미 올라가 있다.

---

### Task 1: 자산 복사 스크립트에 슬라이드 복사 추가

**Files:**
- Rename: `scripts/copy-images.ts` → `scripts/copy-assets.ts`
- Modify: `package.json` (`scripts.build`, `scripts.copy:images`)

- [ ] **Step 1: 현재 상태가 실패임을 확인 (red)**

```bash
test -f "public/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/index.html" \
  && echo "PASS" || echo "FAIL: 슬라이드가 아직 복사되지 않았다"
```

Expected: `FAIL: 슬라이드가 아직 복사되지 않았다`

- [ ] **Step 2: 파일 이름 변경**

```bash
git mv scripts/copy-images.ts scripts/copy-assets.ts
```

- [ ] **Step 3: `package.json`의 스크립트 두 줄 수정**

`"build"`의 `npm run copy:images` 부분과 `"copy:images"` 항목을 바꾼다. 변경 후 해당 두 줄은 정확히 이렇게 된다:

```json
    "build": "npm run generate:manifest && npm run generate:search && npm run generate:feeds && npm run copy:assets && next build",
    "copy:assets": "tsx scripts/copy-assets.ts",
```

- [ ] **Step 4: `copyImages` 함수를 자산 일반으로 이름 변경**

`scripts/copy-assets.ts`에서 함수 선언부만 바꾼다. 본문은 그대로 둔다.

변경 전:
```ts
/**
 * 이미지를 public/images로 복사
 */
function copyImages(images: Map<string, string>, publicDir: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [relativePath, sourcePath] of images) {
```

변경 후:
```ts
/**
 * 자산 맵을 목적지 루트로 복사한다.
 * key = 목적지 루트 기준 상대 경로, value = 원본 절대 경로
 */
function copyFiles(files: Map<string, string>, destRoot: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [relativePath, sourcePath] of files) {
```

이어서 같은 함수 본문 안의 `path.join(publicDir, relativePath)`를 `path.join(destRoot, relativePath)`로 바꾼다.

- [ ] **Step 5: 슬라이드 탐색 함수 추가**

`findImages` 함수 바로 아래에 추가한다.

```ts
/**
 * 슬라이드 데크 파일명 → public 하위 경로 prefix
 * ko: public/{글폴더}/slides/index.html
 * en: public/en/{글폴더}/slides/index.html
 */
const SLIDE_VARIANTS = [
  { file: 'slides.html', prefix: '' },
  { file: 'slides_en.html', prefix: 'en' },
];

/**
 * contents/{category}/{글폴더}/slides*.html 을 찾아
 * [목적지 상대 경로, 원본 절대 경로] 맵으로 반환한다.
 *
 * 목적지에서 category 를 떼는 규칙은 라우트가 쓰는
 * lib/articles.ts 의 getArticleTitleFromSlug() 와 동일하다.
 * (script 는 단독 node 프로세스이므로 의존성 최소화 위해 inline)
 */
function findSlides(contentsDir: string): Map<string, string> {
  const slides = new Map<string, string>();

  const categories = fs
    .readdirSync(contentsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(contentsDir, category);
    const articleDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const articleDir of articleDirs) {
      for (const { file, prefix } of SLIDE_VARIANTS) {
        const sourcePath = path.join(categoryPath, articleDir, file);
        if (!fs.existsSync(sourcePath)) continue;

        const destPath = path.join(prefix, articleDir, 'slides', 'index.html');
        slides.set(destPath, sourcePath);
      }
    }
  }

  return slides;
}
```

- [ ] **Step 6: `main()`에서 슬라이드 복사 호출**

`main()` 안에서 (a) `publicDir` 상수를 추가하고, (b) 이미지 복사 블록의 `copyImages` 호출명을 고치고, (c) `// Copy default image` 주석 **앞에** 슬라이드 블록을 넣는다.

변경 전:
```ts
  const contentsDir = path.join(process.cwd(), 'contents');
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');
```

변경 후:
```ts
  const contentsDir = path.join(process.cwd(), 'contents');
  const publicDir = path.join(process.cwd(), 'public');
  const publicImagesDir = path.join(publicDir, 'images');
```

이미지 복사 호출부 변경 전:
```ts
    const { copiedCount, skippedCount } = copyImages(images, publicImagesDir);
```

변경 후:
```ts
    const { copiedCount, skippedCount } = copyFiles(images, publicImagesDir);
```

그리고 `// Copy default image` 주석 바로 앞에 삽입:
```ts
  // 슬라이드 데크 복사 (public/{글폴더}/slides/index.html)
  console.log('\n🔍 Scanning for slides in contents/...');
  const slides = findSlides(contentsDir);
  console.log(`✅ Found ${slides.size} slide decks`);

  if (slides.size > 0) {
    const { copiedCount, skippedCount } = copyFiles(slides, publicDir);
    console.log(`✅ Slides copied: ${copiedCount}, skipped: ${skippedCount}`);
  }
```

- [ ] **Step 7: 스크립트 실행**

```bash
npx tsx scripts/copy-assets.ts
```

Expected: 출력 끝부분에 `✅ Found 1 slide decks`와 `✅ Slides copied: 1, skipped: 0`

- [ ] **Step 8: 산출물 확인 (green)**

```bash
test -f "public/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/index.html" \
  && echo "PASS: 슬라이드 복사됨" || echo "FAIL"
head -c 80 "public/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/index.html"
```

Expected: `PASS: 슬라이드 복사됨` 그리고 `<!doctype html>`로 시작하는 내용

- [ ] **Step 9: 재실행 시 스킵되는지 확인**

```bash
npx tsx scripts/copy-assets.ts 2>&1 | grep "Slides copied"
```

Expected: `✅ Slides copied: 0, skipped: 1` (mtime·size가 같아 스킵)

- [ ] **Step 10: 커밋**

```bash
git add scripts/copy-assets.ts package.json
git commit -m "feat: 자산 복사 스크립트에 슬라이드 데크 복사 추가

* copy-images.ts → copy-assets.ts (이미지 외 자산도 다루므로 이름 변경)
* slides.html → public/{글폴더}/slides/index.html
* slides_en.html → public/en/{글폴더}/slides/index.html

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 마커를 임베드 블록으로 치환

**Files:**
- Modify: `lib/markdown.ts`
- Modify: `lib/articles.ts:94`
- Check: `/tmp/check-slides.mts` (임시, Step 7에서 삭제)

- [ ] **Step 1: 체크 스크립트 작성**

```bash
cat > /tmp/check-slides.mts <<'EOF'
const { parseMarkdown } = await import(process.cwd() + '/lib/markdown.ts');

const md = `---
title: 그라파나 "완벽" 가이드
---

본문 문단이다.

<!-- slides -->

마지막 문단이다.
`;

const noMarkerMd = `---
title: 마커 없는 글
---

본문뿐이다.
`;

const ko = await parseMarkdown(md, 'cloud/grafana-기초');
const en = await parseMarkdown(md, 'cloud/grafana-기초', 'en');
const bare = await parseMarkdown(noMarkerMd, 'cloud/grafana-기초');

const checks: Array<[string, boolean]> = [
  ['ko iframe src', ko.html.includes('src="/grafana-기초/slides/"')],
  ['en iframe src', en.html.includes('src="/en/grafana-기초/slides/"')],
  ['allowfullscreen 유지', ko.html.includes('allowfullscreen')],
  ['lazy 로딩', ko.html.includes('loading="lazy"')],
  ['제목 이스케이프', ko.html.includes('&#x22;완벽&#x22;')],
  ['마커 소멸', !ko.html.includes('<!-- slides -->')],
  ['앞 문단 보존', ko.html.includes('<p>본문 문단이다.</p>')],
  ['뒤 문단 보존', ko.html.includes('<p>마지막 문단이다.</p>')],
  ['마커 없으면 임베드도 없음', !bare.html.includes('slides-embed')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed += 1;
}
console.log(failed === 0 ? '\n✅ 전부 통과' : `\n❌ ${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
EOF
```

`&#x22;`는 오타가 아니다. 임베드 마크업에 `&quot;`로 넣어도 rehype-stringify가 최종 HTML에서 `&#x22;`로 직렬화한다. 실제 출력으로 확인한 값이다.

- [ ] **Step 2: 실행해서 실패 확인 (red)**

```bash
npx tsx /tmp/check-slides.mts
```

Expected (실제로 돌려서 확인한 출력이다):

```
FAIL  ko iframe src
FAIL  en iframe src
FAIL  allowfullscreen 유지
FAIL  lazy 로딩
FAIL  제목 이스케이프
FAIL  마커 소멸
PASS  앞 문단 보존
PASS  뒤 문단 보존
PASS  마커 없으면 임베드도 없음

❌ 6건 실패
```

종료 코드 1. 뒤의 세 건은 마커와 무관하게 이미 통과하는 항목이다(회귀 감지용).

- [ ] **Step 3: `lib/markdown.ts`에 임베드 빌더 추가**

`parseMarkdown` 함수 선언 **앞에** 추가한다.

```ts
/**
 * HTML 속성값에 넣기 전 이스케이프
 */
function escapeHtmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 본문의 <!-- slides --> 마커를 슬라이드 임베드 블록으로 치환한다.
 * 마커가 없으면 원본을 그대로 돌려준다.
 *
 * 마커는 반드시 자기 줄에 단독으로 있어야 한다. 문단 안에 인라인으로 넣으면
 * CommonMark 가 HTML 블록으로 인식하지 못해 마크업이 그대로 노출된다.
 */
function replaceSlidesMarker(
  content: string,
  slug: string,
  lang: 'ko' | 'en',
  title: string
): string {
  if (!/<!--\s*slides\s*-->/.test(content)) return content;

  // slug 은 {category}/{글폴더} 형태. URL 에는 글폴더만 쓴다.
  const articleDir = slug.split('/').pop() ?? slug;
  const src = lang === 'en' ? `/en/${articleDir}/slides/` : `/${articleDir}/slides/`;
  const safeTitle = escapeHtmlAttribute(title);

  const embed = [
    '<div class="slides-embed">',
    `<iframe class="slides-embed__frame" src="${src}" title="${safeTitle} 슬라이드" loading="lazy" allowfullscreen></iframe>`,
    `<a class="slides-embed__open" href="${src}" target="_blank" rel="noopener">슬라이드 새 탭에서 열기 →</a>`,
    '<p class="slides-embed__hint">슬라이드를 클릭한 뒤 <kbd>←</kbd> <kbd>→</kbd> 이동 · <kbd>f</kbd> 전체화면 · <kbd>?</kbd> 도움말</p>',
    '</div>',
  ].join('\n');

  return content.replace(/<!--\s*slides\s*-->/g, embed);
}
```

- [ ] **Step 4: `parseMarkdown` 시그니처와 파이프라인 입력 수정**

변경 전 (`lib/markdown.ts:39-57`):
```ts
export async function parseMarkdown(markdown: string, slug: string): Promise<Article> {
  // gray-matter로 frontmatter 파싱
  const { data, content } = matter(markdown);

  // unified로 markdown → HTML 변환
  const result = await unified()
    .use(remarkParse) // markdown → mdast
```

변경 후:
```ts
export async function parseMarkdown(
  markdown: string,
  slug: string,
  lang: 'ko' | 'en' = 'ko'
): Promise<Article> {
  // gray-matter로 frontmatter 파싱
  const { data, content } = matter(markdown);

  // <!-- slides --> 마커를 임베드 블록으로 치환한 사본을 렌더에만 사용한다.
  // 반환되는 content 는 원본 그대로 유지한다 (읽기 시간·첫 이미지 추출이 쓴다).
  const renderSource = replaceSlidesMarker(
    content,
    slug,
    lang,
    (data as ArticleFrontmatter).title ?? ''
  );

  // unified로 markdown → HTML 변환
  const result = await unified()
    .use(remarkParse) // markdown → mdast
```

이어서 같은 체인의 마지막 줄을 바꾼다.

변경 전:
```ts
    .process(content);
```

변경 후:
```ts
    .process(renderSource);
```

- [ ] **Step 5: 호출부에 `lang` 전달**

`lib/articles.ts:94` 변경 전:
```ts
    const article = await parseMarkdown(markdown, slug);
```

변경 후:
```ts
    const article = await parseMarkdown(markdown, slug, lang);
```

`getArticle(slug, lang)`의 `lang` 파라미터가 이미 스코프에 있다.

- [ ] **Step 6: 체크 스크립트 재실행 (green)**

```bash
npx tsx /tmp/check-slides.mts
```

Expected: 9줄 모두 `PASS`, 마지막에 `✅ 전부 통과`. 종료 코드 0.

- [ ] **Step 7: 타입 검사 후 임시 파일 삭제**

```bash
npm run check
rm -f /tmp/check-slides.mts
```

Expected: `npm run check`가 에러 없이 종료

- [ ] **Step 8: 커밋**

```bash
git add lib/markdown.ts lib/articles.ts
git commit -m "feat: <!-- slides --> 마커를 슬라이드 임베드로 치환

* parseMarkdown 에 lang 인자 추가 (ko/en 별 데크 경로 분기)
* 마커를 raw HTML 블록으로 치환, rehypeRaw 가 그대로 통과시킨다
* 반환 content 는 원본 유지 — 읽기 시간·첫 이미지 추출에 영향 없음

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 임베드 스타일과 모바일 분기

**Files:**
- Modify: `app/globals.css` (접기 블록 스타일 뒤, `/* ----- Bento utilities ----- */` 앞)

- [ ] **Step 1: CSS 추가**

`app/globals.css`에서 `.prose details[open] > *:last-child` 규칙 블록이 끝난 직후, `/* ----- Bento utilities ----- */` 주석 **앞에** 삽입한다.

기존 `details` 규칙과 같은 이유로 `.prose` / `.prose-bento`를 모두 접두어로 단다. `.prose-bento a`(614행) 같은 기존 규칙이 우선순위에서 이기지 않게 하려는 것이다.

```css
/* ----- 슬라이드 임베드 ----- */
/* 데크가 1280x720 고정 무대를 컨테이너 크기에 맞춰 스케일하므로 16:9 비율만 주면 된다. */
.prose .slides-embed,
.prose-bento .slides-embed {
  @apply my-6;
}

.prose .slides-embed__frame,
.prose-bento .slides-embed__frame {
  @apply w-full rounded-xl border;
  aspect-ratio: 16 / 9;
  background: hsl(var(--muted) / 0.4);
}

.prose .slides-embed__open,
.prose-bento .slides-embed__open {
  @apply mt-2 inline-block text-sm font-medium no-underline;
}

.prose .slides-embed__hint,
.prose-bento .slides-embed__hint {
  @apply mt-1 text-xs text-muted-foreground;
}

.prose .slides-embed__hint kbd,
.prose-bento .slides-embed__hint kbd {
  @apply rounded border px-1 py-0.5 font-mono text-[0.7rem];
}

/* 모바일 폭에서는 데크 스케일이 0.3 미만이라 글자를 읽을 수 없다.
   프레임을 숨기고 새 탭 링크를 카드형 버튼으로 승격한다. */
@media (max-width: 767px) {
  .prose .slides-embed__frame,
  .prose-bento .slides-embed__frame,
  .prose .slides-embed__hint,
  .prose-bento .slides-embed__hint {
    display: none;
  }

  .prose .slides-embed__open,
  .prose-bento .slides-embed__open {
    @apply mt-0 block rounded-xl border px-5 py-4 text-center;
    background: hsl(var(--muted) / 0.4);
  }
}
```

- [ ] **Step 2: CSS가 빌드를 깨지 않는지 확인**

```bash
npx tailwindcss -i app/globals.css -o /tmp/tw-out.css 2>&1 | tail -3
grep -c "slides-embed" /tmp/tw-out.css
rm -f /tmp/tw-out.css
```

Expected: `Done in NNNms.`로 끝나고 `grep -c` 결과가 1 이상. `@apply`에 쓴 토큰(`text-muted-foreground` 등)이 없으면 여기서 에러가 난다.

(`--config` 플래그는 불필요하다. CLI가 `tailwind.config.ts`를 자동으로 찾는다. 실행해서 확인한 동작이다.)

- [ ] **Step 3: 커밋**

```bash
git add app/globals.css
git commit -m "feat: 슬라이드 임베드 스타일과 모바일 분기 추가

* 16:9 aspect-ratio 프레임, 데크가 자체 스케일하므로 비율만 지정
* 767px 이하에서는 프레임을 숨기고 새 탭 링크를 카드형 버튼으로 대체

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 마커/파일 짝 검사 경고

**Files:**
- Modify: `scripts/generate-content-manifest.ts` (variants 루프 안)

- [ ] **Step 1: 현재 경고가 없음을 확인 (red)**

```bash
npx tsx scripts/generate-content-manifest.ts 2>&1 | grep -i "slides" || echo "FAIL: 슬라이드 관련 경고가 없다"
```

Expected: `FAIL: 슬라이드 관련 경고가 없다`
(grafana 글에 `slides.html`은 있지만 마커는 아직 없다. 경고가 나와야 정상인 상황인데 안 나온다.)

- [ ] **Step 2: 검사 코드 추가**

`scripts/generate-content-manifest.ts`의 `const { data, content } = matter(raw);` 바로 **다음 줄**에 삽입한다.

```ts
          // 슬라이드 데크와 본문 마커의 짝이 맞는지 검사한다 (경고만, 빌드는 계속)
          const slidesFile = lang === 'en' ? 'slides_en.html' : 'slides.html';
          const hasSlidesFile = fs.existsSync(path.join(dirPath, slidesFile));
          const hasSlidesMarker = /<!--\s*slides\s*-->/.test(content);

          if (hasSlidesFile && !hasSlidesMarker) {
            console.warn(
              `⚠️  ${category}/${articleDir} (${lang}): ${slidesFile} 는 있는데 본문에 <!-- slides --> 마커가 없습니다`
            );
          }
          if (hasSlidesMarker && !hasSlidesFile) {
            console.warn(
              `⚠️  ${category}/${articleDir} (${lang}): <!-- slides --> 마커는 있는데 ${slidesFile} 가 없습니다`
            );
          }
```

- [ ] **Step 3: 경고가 나오는지 확인 (green)**

```bash
npx tsx scripts/generate-content-manifest.ts 2>&1 | grep "slides"
```

Expected: 정확히 한 줄
```
⚠️  cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초 (ko): slides.html 는 있는데 본문에 <!-- slides --> 마커가 없습니다
```

이 경고는 Task 6에서 마커를 넣으면 사라진다.

- [ ] **Step 4: 커밋**

```bash
git add scripts/generate-content-manifest.ts
git commit -m "feat: 슬라이드 파일과 마커의 짝을 빌드 시 검사

* slides 파일만 있고 마커가 없거나, 그 반대인 경우 경고
* 기존 'No index.md found' 경고와 같은 방식, 빌드는 실패시키지 않는다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 검색 인덱스에서 HTML 마크업 제거

**Files:**
- Modify: `scripts/generate-search-index.ts:29-37`

이 글에는 효과가 없다. `cleanContent.slice(0, 5000)`이 앞 5000자만 인덱싱하는데 이 글의 `<details>`와 마커는 그보다 뒤에 있다. 실제 효과는 **기존 56건 정리**다 (주로 biweekly 글의 `<img>` 태그).

- [ ] **Step 1: 현재 오염 건수 확인 (red)**

```bash
npx tsx scripts/generate-search-index.ts > /dev/null 2>&1
grep -o '<img' public/search-index.json | wc -l
```

Expected: 0보다 큰 수 (확인 시점 기준 56건 문서에 태그가 남아 있다)

- [ ] **Step 2: 태그·주석 제거 추가**

`cleanContent` 체인에서 인라인 코드 제거 다음 줄에 두 줄을 삽입한다.

변경 전:
```ts
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`[^`]+`/g, '') // 인라인 코드 제거
      .replace(/!\[([^\]]*)]\(([^)]+)\)/g, '') // 이미지 제거
```

변경 후:
```ts
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`[^`]+`/g, '') // 인라인 코드 제거
      .replace(/<!--[\s\S]*?-->/g, '') // HTML 주석 제거 (<!-- slides --> 마커 포함)
      .replace(/<[^>]+>/g, '') // HTML 태그 제거 (<details>, <img>, <iframe> 등)
      .replace(/!\[([^\]]*)]\(([^)]+)\)/g, '') // 이미지 제거
```

코드 블록과 인라인 코드를 먼저 지우므로 코드 안의 꺾쇠는 영향을 받지 않는다.

- [ ] **Step 3: 오염이 사라졌는지 확인 (green)**

```bash
npx tsx scripts/generate-search-index.ts > /dev/null 2>&1
grep -o '<img' public/search-index.json | wc -l
grep -o '<details' public/search-index.json | wc -l
```

Expected: 둘 다 `0`

- [ ] **Step 4: 커밋**

```bash
git add scripts/generate-search-index.ts
git commit -m "fix: 검색 인덱스 본문에서 HTML 주석과 태그 제거

* 인덱스 188건 중 56건에 <img> 등 마크업이 그대로 남아 있었다
* 코드 블록 제거 후에 적용해 코드 안 꺾쇠는 영향 없음

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: grafana 1편에 마커 삽입 후 전체 빌드 검증

**Files:**
- Modify: `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md`

- [ ] **Step 1: 마커 삽입**

`# 6. 마무리` 섹션의 마지막 줄(GitHub 링크 인용문)과 `# 7. 참고` 사이에 마커를 넣는다. 마커는 **자기 줄에 단독으로**, 앞뒤에 빈 줄을 둔다.

변경 전:
```markdown
> 이 글에서 사용한 전체 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/monitoring/grafana-metrics)에서 확인할 수 있다.

# 7. 참고
```

변경 후:
```markdown
> 이 글에서 사용한 전체 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/monitoring/grafana-metrics)에서 확인할 수 있다.

<!-- slides -->

# 7. 참고
```

`index_en.md`는 건드리지 않는다. 영문 데크(`slides_en.html`)가 없으므로 마커를 넣으면 깨진 임베드가 생긴다.

- [ ] **Step 2: 인코딩 확인**

```bash
file -I "contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md"
```

Expected: `charset=utf-8` 포함

- [ ] **Step 3: 전체 빌드**

```bash
npm run build 2>&1 | tee /tmp/build.log | tail -20
```

Expected: 빌드 성공.

**만약 `public/`과 라우트 경로 충돌로 빌드가 실패하면** — 설계 문서에 적어둔 미확인 리스크가 현실화된 것이다. 차선책으로 전환한다:
1. `scripts/copy-assets.ts`의 `SLIDE_VARIANTS` 목적지를 `path.join('slides', prefix, articleDir, 'index.html')`로 바꾼다 (→ `public/slides/{글폴더}/`, en은 `public/slides/en/{글폴더}/`)
2. `lib/markdown.ts`의 `replaceSlidesMarker`에서 `src`를 `lang === 'en' ? \`/slides/en/${articleDir}/\` : \`/slides/${articleDir}/\``로 바꾼다
3. 설계 문서 2번 절에 실제 채택된 경로와 그 이유를 기록한다
4. Task 2의 체크 스크립트를 새 경로로 고쳐 다시 돌린다

- [ ] **Step 4: 빌드 경고 확인**

```bash
grep -i "slides" /tmp/build.log
```

Expected: 출력 없음 (Task 4에서 나오던 마커 누락 경고가 사라졌어야 한다)

- [ ] **Step 5: 산출물 확인**

```bash
test -f "out/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/index.html" \
  && echo "PASS: 슬라이드 배포됨" || echo "FAIL"
grep -c "slides-embed__frame" "out/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.html"
grep -o 'src="/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/"' \
  "out/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.html" | head -1
```

Expected: `PASS: 슬라이드 배포됨`, `grep -c` 결과 1, 그리고 src 문자열 한 줄 출력

- [ ] **Step 6: 영문 글에는 임베드가 없는지 확인**

```bash
grep -c "slides-embed" "out/en/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.html"
```

Expected: `0` (영문 본문에 마커를 넣지 않았다)

- [ ] **Step 7: 로컬 서빙 후 수동 확인**

```bash
npm run start
```

브라우저에서 확인할 것:
1. `http://localhost:3000/grafana-완벽-가이드-1-prometheus와-grafana-기초/` — 마무리 섹션 아래에 16:9 슬라이드가 보인다
2. 프레임을 클릭한 뒤 `←` `→`로 슬라이드가 넘어간다
3. `f`를 누르면 전체화면이 되고 `ESC`로 빠져나온다 (`allowfullscreen` 확인)
4. "슬라이드 새 탭에서 열기" 링크가 `/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/`로 열린다
5. 브라우저 창을 767px 이하로 줄이면 프레임과 조작 안내가 사라지고 카드형 링크만 남는다
6. 라이트/다크 테마를 각각 켜고 임베드 주변 여백과 테두리가 어색하지 않은지 본다

- [ ] **Step 8: 커밋**

```bash
git add "contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md"
git commit -m "docs: grafana 1편 마무리 섹션에 슬라이드 임베드 추가

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 프로젝트 문서 갱신

**Files:**
- Modify: `CLAUDE.md` (blog-v2 프로젝트 루트)

- [ ] **Step 1: 규약을 CLAUDE.md에 기록**

`## Content Management` 섹션의 `### 샘플 코드 작성 규칙` **앞에** 추가한다.

```markdown
### 슬라이드 데크 (선택)

글에 발표용 슬라이드를 붙이려면:

1. 글 폴더에 `slides.html`(한국어) / `slides_en.html`(영문)을 둔다 — 외부 의존성 없는 자기완결형 HTML이어야 한다
2. 본문의 원하는 위치에 `<!-- slides -->`를 **자기 줄에 단독으로** 넣는다 (앞뒤 빈 줄 필수)
3. 빌드하면 `{글주소}/slides/`로 배포되고 마커 자리에 16:9 임베드가 렌더된다

파일과 마커의 짝이 안 맞으면 빌드 시 경고가 나온다. 모바일(767px 이하)에서는 임베드 대신 새 탭 링크가 표시된다.
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: 슬라이드 데크 규약을 CLAUDE.md 에 기록

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 완료 조건

- [ ] `npm run check` 통과
- [ ] `npm run build` 성공, 슬라이드 관련 경고 없음
- [ ] `out/{글폴더}/slides/index.html` 생성
- [ ] 글 페이지에 임베드 렌더, 전체화면·키보드 동작 확인
- [ ] 767px 이하에서 카드형 링크로 대체 확인
- [ ] `grep -o '<img' public/search-index.json | wc -l`이 0
- [ ] PR 생성 (`gh pr create` + HEREDOC, 리뷰어 지정 없이)
