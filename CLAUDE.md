# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IT 블로그 플랫폼 - 마크다운 기반 정적 사이트
- Next.js 16 (App Router) + React 19 + TypeScript
- **완전 정적 내보내기** (`output: 'export'`) - 백엔드도 데이터베이스도 없다
- 콘텐츠는 `contents/` 아래 마크다운 파일이고, 빌드 시 JSON으로 뽑아 쓴다
- shadcn/ui 컴포넌트 라이브러리 사용
- 한국어/영어 이중 언어 (`/` 와 `/en/`)

## Development Commands

### Essential Commands
```bash
# 개발 서버 (기본 포트 3000)
npm run dev

# 타입 체크
npm run check

# 프로덕션 빌드 (생성 스크립트 4개 실행 후 next build → out/)
npm run build

# 빌드 결과 미리보기 (out/ 을 정적 서빙, 포트 3000)
npm start
```

빌드 전용 스크립트는 개별 실행도 가능하다. `npm run build`가 아래 순서로 전부 돌린 뒤 `next build`를 호출한다.

```bash
npm run generate:manifest   # contents/ 스캔 → public/content-manifest.json
npm run generate:search     # 검색 인덱스 → public/search-index.json
npm run generate:feeds      # RSS → public/rss.xml, public/en/rss.xml
npm run copy:assets         # 글 폴더의 이미지·슬라이드를 public/ 하위로 복사
```

**lint 스크립트는 없다.** 타입 검사는 `npm run check`(tsc)로 한다.

## Project Structure

```
/app             # Next.js App Router
  layout.tsx     # 루트 레이아웃
  page.tsx       # 홈 (글 목록)
  [slug]/        # 개별 글
  posts/         # 전체 글 목록
  category/[name]/
  series/, series/[slug]/
  tags/, tags/[name]/
  slides/        # 슬라이드 데크 목록
  sitemap.ts     # sitemap.xml 생성
  robots.ts      # robots.txt 생성
  en/            # 영문 라우트 (위 구조를 그대로 미러링)
  dev/tokens/    # 디자인 토큰 확인용 내부 페이지

/components      # UI 컴포넌트
  /ui            # shadcn/ui (47개)
  /article       # 목차, mermaid 렌더러, 시리즈 네비게이션, 읽기 진행바 등
  /home, /posts, /slides, /chat

/lib
  articles.ts    # manifest 로드 + 글 조회 (캐싱)
  markdown.ts    # frontmatter 파싱 + remark/rehype 파이프라인
  i18n/          # dictionaries.ts, lang.ts
  site-config.ts, constants.ts, url.ts
  chat-api.ts    # ai-chatbot.advenoh.pe.kr 연동
  inspireme.ts   # inspire-me widget API 연동

/scripts         # 빌드 시 실행되는 생성기
  generate-content-manifest.ts
  generate-search-index.ts
  generate-feeds.ts
  copy-assets.ts
  config.ts      # 블로그 메타데이터 (title, baseUrl, author)

/contents        # 글 원본: {category}/{slug}/index.md
/docs            # 초안 워크플로우 (start → merge_ready → done)
/public          # 정적 자산 + 빌드 산출물(content-manifest.json, search-index.json, rss.xml)
/config          # popular-searches.ts, social.ts
```

### Import Aliases
`tsconfig.json`에 정의되어 있고 모두 프로젝트 루트 기준이다.
- `@/*` → `./*`
- `@/components/*` → `./components/*`
- `@/lib/*` → `./lib/*`

### Key Architectural Patterns

**빌드 타임 콘텐츠 파이프라인:**
런타임에 마크다운을 읽지 않는다. 빌드 시 `scripts/generate-content-manifest.ts`가 `contents/`를 스캔해 `public/content-manifest.json`을 만들고, 페이지들은 이 manifest를 통해 글 메타데이터를 얻는다.

- **카테고리는 디렉토리 이름에서 자동으로 결정된다.** `contents/{category}/{slug}/` 구조를 그대로 읽는다.
- 한 글 폴더에 `index.md`(한국어)와 `index_en.md`(영문)가 함께 있으면 같은 slug의 언어 변형으로 묶인다.
- manifest에는 slug, category, lang, title, date, tags, series, seriesOrder, readTime, hasSlides 등이 들어간다. 읽기 시간도 이때 계산된다.

**Article Loading (`lib/articles.ts`):**
- manifest와 개별 글을 모듈 수준에서 캐싱한다 (`manifestCache`, `articleCache`)
- `Frank's IT News` 로 시작하는 시리즈는 격주 뉴스로 따로 취급한다 (`isBiweeklySeries`)

**Markdown Processing (`lib/markdown.ts`):**
- `gray-matter`로 frontmatter 파싱
- unified 파이프라인: `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-raw` → `rehype-slug` → `rehype-autolink-headings` → `rehype-prism-plus` → `rehype-stringify`
- 코드 하이라이팅은 `rehype-prism-plus`(빌드 시), Mermaid는 `components/article/mermaid-renderer.tsx`(클라이언트)
- 목차는 `components/article/table-of-contents.tsx`

**Routing (Next.js App Router):**
- 정적 내보내기라 모든 경로가 빌드 시 생성된다. `trailingSlash: true`
- 한국어가 루트(`/`), 영문이 `/en/` 하위. 영문 라우트는 한국어 구조를 그대로 미러링한다
- Netlify에서 `Accept-Language: en` 요청을 `/en/`으로 302 리다이렉트한다 (`netlify.toml`)

**Styling:**
- Tailwind CSS + shadcn/ui ("new-york" 스타일, `components.json`)
- `next-themes`로 라이트/다크 모드
- 반응형 디자인 (모바일 우선). 헤더 데스크톱 분기점은 `lg`(1024px)

## Content Management

### Article Structure

**Location:** `contents/{카테고리}/{글-제목}/index.md`

한 글은 폴더 하나다. 폴더 안에 들어가는 것들:

| 파일 | 용도 |
|------|------|
| `index.md` | 한국어 본문 (필수) |
| `index_en.md` | 영문 본문 (선택) |
| `cover.png` 등 이미지 | 본문에서 상대 경로로 참조. 빌드 시 `copy-assets.ts`가 `public/` 하위로 복사한다 |
| `slides.html` / `slides_en.html` | 발표용 슬라이드 데크 (선택, 아래 참조) |

**Required Format:**
```markdown
---
title: "글 제목"
description: "글 설명"
date: 2026-01-15
update: 2026-01-15
tags:
  - tag1
  - tag2
series: "시리즈명"  # optional
seriesOrder: 1      # optional
---

Markdown content...
```

**주의:** `category`는 frontmatter에 넣지 않는다. `contents/{category}/` 디렉토리 구조로 자동 결정된다.

**manifest는 수동으로 관리하지 않는다.** `public/content-manifest.json`은 빌드 시 `contents/`를 스캔해 자동 생성된다. 글을 추가할 때 등록할 목록 같은 것은 없다.

### 슬라이드 데크 (선택)

글에 발표용 슬라이드를 붙이려면:

1. 글 폴더에 `slides.html`(한국어) / `slides_en.html`(영문)을 둔다 — 외부 의존성 없는 자기완결형 HTML이어야 한다
2. 본문의 원하는 위치에 `<!-- slides -->`를 **자기 줄에 단독으로** 넣는다 (앞뒤 빈 줄 필수)
3. 빌드하면 `{글주소}/slides/`로 배포되고 마커 자리에 16:9 임베드가 렌더된다

데크를 만들면 `/slides` 목록 페이지에 자동으로 뜬다 — 별도 등록이 필요 없다. 목록에 뜨는 기준은 **`slides.html` 파일의 존재**이고 본문 마커와는 무관하다(마커는 본문 임베드 여부만 정한다).

배포된 데크의 하단 바에는 글로 돌아가는 링크가 붙는다(빌드 시 `copy-assets.ts`가 주입). 글 본문 임베드 안에서는 보이지 않는다.

파일과 마커의 짝이 안 맞으면 빌드 시 경고가 나온다. 모바일(767px 이하)에서는 임베드 대신 새 탭 링크가 표시된다.

**데크 제작 시 주의**: 임베드는 본문 폭에 맞춰 **720×405 정도로 렌더**된다. 1280×720 고정 무대를 스케일하는 방식이면 `transform-origin: 0 0`으로 두고 여백만큼 직접 translate 해야 한다. `transform-origin: center` + grid 중앙 정렬에 맡기면, 무대가 뷰포트보다 클 때 브라우저가 넘치는 항목을 좌상단에 고정(safe alignment)해서 축소 결과가 오른쪽 아래로 쏠린다.

**테마**: 배포된 슬라이드는 블로그의 라이트/다크 설정을 자동으로 따른다(빌드 시 `copy-assets.ts`가 동기화 스크립트를 주입). 슬라이드 쪽에 별도 작업은 필요 없고, 슬라이드 자체 테마 토글(`t` 키)은 그 화면에서만 유효하다.

### 퀴즈 (선택)

글에 인터랙티브 퀴즈를 넣으려면 본문에 ` ```quiz ` 코드펜스를 열고 YAML로 문항을 적는다. 클라이언트에서 퀴즈 UI로 렌더되며, 보기를 고르면 즉시 판정·해설이 나오고 세트 단위로 점수가 집계된다. 표본: `contents/go/go-fx-의존성-주입/index.md`의 5장.

유형은 4가지: `mcq`(객관식, `answer`는 0부터 인덱스), `ox`(`answer`: true/false), `code`(`lang`+`code` 블록이 붙는 객관식), `blank`(빈칸 `___`, `answer`는 허용 답 배열 — 공백·대소문자 무시 비교).

형식 규칙:
- `explain`은 전 유형 필수. 관련 절 안내("(2.2절)")를 포함한다
- 문자열은 큰따옴표, `choices`는 인라인 배열, `code`는 블록 스칼라(`|`)
- 세트당 10문항 권장, 4유형을 섞는다
- 영문판(`index_en.md`)에도 같은 문항 수·유형·정답 인덱스로 작성한다

품질 규칙 (리뷰에서 확립됨):
- **정답 위치를 고르게 분산한다.** 정답이 한 인덱스에 쏠리면 같은 버튼만 눌러 만점이 나온다. 유형 안에서도 쏠리지 않게 본다
- **같은 문항의 보기 길이를 비슷하게 맞춘다.** 정답만 설명형으로 길면 길이만으로 정답이 티 난다
- mcq는 4지선다로 통일하고, 오답은 본문을 대충 읽으면 고를 만한 혼동으로 만든다. 단, 본문 어딘가에서 참인 서술을 오답으로 배치하지 않는다
- **본문에 근거가 있는 것만 묻는다.** 일반적으로 맞는 사실이어도 그 글에 없으면 쓰지 않는다
- 유형 순서를 기계적으로 반복하지 않는다 (`mcq→code→ox→blank` 사이클 같은 것)
- 블록을 글 중간에 여러 개 둘 수 있고 세트마다 점수가 따로 난다
- YAML이 깨지면 그 블록은 코드 블록으로 노출된다. 개별 문항이 형식에 안 맞으면 그 문항만 조용히 빠진다 — 저장 전 파싱 확인 필수

**정답 노출 (가장 자주 나오는 결함):**
퀴즈 UI는 한 세트의 **전 문항을 한 화면에 동시에** 렌더한다. 작성자는 문항을 하나씩 쓰기 때문에 이 결함은 눈으로 잘 안 잡힌다. 실제로 5편 작업에서 4편에 나왔다.

- **blank 정답 문자열이 다른 문항의 `q`·`choices`·`code`에 등장하면 안 된다.** `explain`은 그 문항을 푼 뒤에만 보이므로, 앞 문항의 `explain`이 뒤 문항 답을 흘리는 경우만 문제다
- 흔한 토큰(`any`, `struct`, `<-chan`, `after` 등)은 blank 정답으로 부적합하다. 본문·코드 곳곳에 자연스럽게 등장한다
- 문자열 검사만으로는 부족하다. 예를 들어 `대괄호`가 정답일 때 grep은 0건이어도 code 스니펫의 `[T any]`가 답을 보여준다
- 영문판은 정답이 흔한 영어 단어와 겹치는지 따로 본다. 비교가 대소문자·공백 무시라, 지문의 전치사 `after`가 허용 답 `After`와 매칭된 사례가 있다

**작성 후 확인:**
- 모든 blank 정답을 세트 전체의 `q`·`choices`·`code`에서 대소문자 무시로 grep (한/영)
- `code` 스니펫은 실제로 컴파일되는지 확인한다. Go는 미사용 변수가 컴파일 에러다. 의도적으로 에러를 묻는 문항이면 **그 에러만** 나야 한다
- 퀴즈 절을 글 중간에 넣어 뒤 섹션 번호를 밀었다면, 본문에 그 번호를 가리키는 참조가 없는지 확인한다. 한국어판과 영문판의 섹션 번호가 서로 다를 수 있으니 파일별로 본다

형식 예시와 필드 정의: `docs/superpowers/specs/2026-08-07-interactive-quiz-design.md`

### 샘플 코드 작성 규칙
- 코드 관련 블로그 글의 샘플 코드는 블로그 내부가 아닌 `../tutorials-go/`에 작성
- 블로그 글에서 GitHub 저장소 코드를 참조/링크하는 방식으로 연동
- 코드를 먼저 작성하고 테스트 통과 확인 후 블로그 글 작성

### Adding New Articles
1. `contents/{카테고리}/{글-제목}/index.md` 생성 (초안 단계라면 `docs/start/{글-제목}/index.md`)
2. YAML frontmatter 작성 (위 형식 참조)
3. `npm run dev`로 확인. manifest는 자동 생성되므로 따로 등록할 곳이 없다

#### 블로그 글 작성 워크플로우

**Draft → Review → Merge Ready → Publish** 단계로 진행한다.

**1단계: Draft 작성 (Claude Code 작업)**
- `docs/start/{글-제목}/index.md`에 초안 작성 (**`contents/`에 직접 넣지 않는다**)
- feature 브랜치에서 작업 후 PR 생성

**2단계: PR Review & Merge**
- PR 리뷰 후 merge

**3단계: Merge Ready (리뷰 완료)**
- 리뷰 완료된 글을 `docs/start/{글-제목}/` → `docs/merge_ready/{글-제목}/`으로 이동
- `docs/start/`에는 아직 리뷰 중인 draft만 남긴다

**4단계: Publish (발행)**
- `docs/merge_ready/{글-제목}/` → `contents/{카테고리}/{글-제목}/`으로 이동
- MergeReady label 추가 → 날짜에 맞게 자동 merge

## Diagram Style

**다이어그램은 반드시 Mermaid 형식으로 작성한다.**
- ASCII art 다이어그램 사용 금지
- 마크다운 코드블록에 ```mermaid 사용
- flowchart, sequence, class, state 등 적절한 Mermaid 다이어그램 타입 선택
- **노드 텍스트에 `<br/>`, `<br>` 등 HTML 태그 사용 금지** → Mermaid 파서 syntax error 발생. 줄바꿈이 필요하면 노드 텍스트를 단순화하거나 별도 노드로 분리할 것

## 수학 공식 (LaTeX)

수식은 LaTeX로 쓴다. 빌드 시 KaTeX가 HTML로 렌더링하므로 클라이언트 JS는 실리지 않는다.

**표기법은 markora(JetBrains 마크다운 에디터) 기준으로 통일한다.** 글쓴이가 markora로 편집하므로, 거기서 수식 블록으로 인식되지 않는 표기는 쓰지 않는다.

````markdown
인라인 수식은 $p = (1 - e^{-kn/m})^k$ 처럼 문장에 섞어 쓴다.

디스플레이 수식은 math 코드펜스로 쓴다:

```math
m = -\frac{n \ln p}{(\ln 2)^2}
```
````

- **디스플레이 수식은 `$$...$$`가 아니라 ` ```math ` 펜스로 쓴다.** `$$`도 blog에서는 렌더되지만 markora는 이를 수식으로 인식하지 못해 편집기에서 그냥 텍스트로 보인다 (markora는 `frontend/src/markdown/customParse.ts`에서 `codeBlock('math', ...)`로 직렬화한다)
- 인라인은 양쪽 다 `$...$`로 같다. 단 markora의 정규식이 더 엄격하니 **여는 `$` 뒤와 닫는 `$` 앞에 공백을 두지 않는다** (`$ x $` ✗ / `$x$` ✓)

**주의사항:**
- **산문에서 달러 금액을 쓸 때는 `\$`로 이스케이프한다.** `$5에서 $10 사이` 처럼 쓰면 그 사이가 수식으로 해석된다. (markora는 `$` 뒤 숫자를 통화로 보고 넘어가지만 blog의 remark-math는 수식으로 잡으므로, blog 기준에 맞춰 이스케이프할 것)
- 코드펜스(```)와 인라인 코드(`` ` ``) 안의 `$`는 변환되지 않는다. shell 변수·MongoDB 연산자 등은 그대로 두면 된다
- **제목(heading)에는 수식을 쓰지 않는다.** 목차 추출 정규식이 매칭하지 못해 TOC에서 빠진다
- **인라인 수식에 `\frac`을 쓰지 않는다.** 행 높이가 튀어 문단이 들쭉날쭉해진다. `1/m` 같은 슬래시 형태를 쓰고, `\frac`은 디스플레이 수식에만 쓴다
- RSS 피드는 경량 파이프라인을 쓰므로 수식이 원문 그대로 나간다
- 수식이 아니라 코드인 것(`h1 + i*h2`, `pos%64` 등)은 인라인 코드로 두고 수식으로 바꾸지 않는다

## Design System

**Component Library:** shadcn/ui (Radix UI primitives)
- `components/ui/` - shadcn 컴포넌트
- `components.json` - shadcn 설정 ("new-york" 스타일)

**Design Guidelines:** `design_guidelines.md` 참조
- Medium/Dev.to 스타일 개발자 중심 디자인
- 콘텐츠 가독성 최우선
- 코드 블록 최적화 (복사 버튼, 언어 레이블, 라인 넘버)

## Git Workflow

**Branch Naming:**
- `feat/#이슈번호-설명` - 새 기능
- `fix/#이슈번호-설명` - 버그 수정
- `docs/#이슈번호-설명` - 문서

**Commit Messages (한국어):**
```
[#이슈번호] 간결한 설명

* 변경 사항 상세 설명 (bullet points)
* 기술적 세부사항이나 맥락 추가
```

**Commit Types (선택):** feat, fix, docs, style, refactor, test, chore

상세 가이드라인: `.github/git-commit-instructions.md` 참조

## Database

**없다.** 이 블로그에는 데이터베이스도 백엔드도 없다. 모든 콘텐츠는 `contents/` 아래 마크다운 파일이고, 빌드 시 JSON으로 뽑아 정적 사이트로 내보낸다.

외부 서비스 연동이 두 개 있지만 별도 서비스의 공개 API를 호출하는 것뿐이다.
- `lib/chat-api.ts` → `ai-chatbot.advenoh.pe.kr` (블로그 Q&A 챗봇)
- `lib/inspireme.ts` → `inspire-me.advenoh.pe.kr` (명언 위젯)

## Search

**Library:** MiniSearch (클라이언트 사이드 전문 검색)
- 인덱스는 빌드 시 `scripts/generate-search-index.ts`가 `public/search-index.json`으로 생성한다
- 검색 UI는 `components/command-k.tsx` (Cmd+K)
- 인기 검색어는 `config/popular-searches.ts`에 수동 큐레이션되어 있다 (분석 연동 없음)

## Build System

**Development:**
- `next dev` (기본 포트 3000)

**Production:**
- `npm run build` → 생성 스크립트 4개 실행 후 `next build`
- `output: 'export'`이므로 결과물은 `out/` 디렉토리의 정적 파일
- `npm start`는 `npx serve out -l 3000`으로 결과물을 미리보기한다

**Deployment (Netlify):**
- `netlify.toml`: `command = "npm run build"`, `publish = "out"`
- Node 22, `NPM_FLAGS = "--legacy-peer-deps"`
- deploy preview 컨텍스트는 빌드를 건너뛴다
- `Accept-Language: en` 요청을 `/en/`으로 302 리다이렉트
- 레거시 `-en` 접미사 URL은 `/en/{ko-slug}/`로 301 리다이렉트

**GitHub Actions (`.github/workflows/`):**
- `auto-merge-pr.yml` - 매일 07:00 KST에 조건을 만족하는 PR 자동 머지
- `auto-assign-pr.yml`, `label-merge-conflict.yml`, `fix-post-date.yml`
- `biweekly-news.yml` - 격주 뉴스 글 생성
- `generate-readme.yml`, `supabase-keepalive.yml`

## Korean Content Encoding

**IMPORTANT:** All markdown files MUST be UTF-8 encoded

**Verify encoding:**
```bash
file -I contents/{카테고리}/{글-제목}/index.md
# Expected: text/plain; charset=utf-8
```

**If encoding broken, use heredoc:**
```bash
cat > file.md << 'EOF'
한글 내용...
EOF
```
