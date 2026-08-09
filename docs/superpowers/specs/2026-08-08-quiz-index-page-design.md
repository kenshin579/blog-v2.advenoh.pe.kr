# 퀴즈 목록 페이지와 헤더 메뉴 설계

- 작성일: 2026-08-08
- 대상 저장소: `blog-v2.advenoh.pe.kr`

## 1. 목표

퀴즈가 있는 글을 모아 보는 `/quiz` 목록 페이지를 만들고 헤더 네비게이션에 메뉴를 추가한다. 기존 `/slides` 목록 페이지와 같은 구조를 따른다.

## 2. 배경

퀴즈 인프라와 콘텐츠는 이미 갖춰져 있다. 현재 퀴즈가 있는 글은 7편이고, 이는 슬라이드 데크가 있는 글 7편과 정확히 일치한다.

`/slides`는 여섯 곳을 거치는 배관으로 동작한다: manifest 생성(`hasSlides`/`slideCount`) → `lib/articles.ts`의 `getArticlesWithSlides` → 페이지 2개(ko/en) → `SlideCard` → 헤더 `NAV` → `app/sitemap.ts`. 퀴즈도 같은 경로를 따른다.

**슬라이드와 다른 점**: 슬라이드는 `slides.html` 파일 존재로 판정하지만, 퀴즈는 본문 마크다운 안의 ` ```quiz ` 펜스라 본문을 파싱해야 한다. manifest 생성 스크립트가 이미 본문을 읽고 있으므로(`matter(raw)`) 거기서 처리한다.

## 3. 링크 목적지 — 글 페이지의 퀴즈 앵커

카드를 클릭하면 `/{글}/#quiz`(영문 `/en/{글}/#quiz`)로 이동한다. 글이 열리면서 퀴즈 위치로 스크롤된다.

검토한 대안:

| 안 | 내용 | 판단 |
|----|------|------|
| **앵커 이동 (선택)** | `/{글}/#quiz` | 퀴즈는 글의 일부이므로 본문과 함께 있는 게 맞다. 신규 라우트가 목록 페이지 둘뿐이고, 퀴즈가 두 곳에 중복 존재하지 않는다 |
| 글 최상단 | `/{글}/` | 퀴즈까지 스크롤해 내려가야 해서 목록 페이지의 값어치가 반감된다 |
| 퀴즈 전용 페이지 | `/{글}/quiz/` | 슬라이드와 대칭이지만 같은 퀴즈가 두 URL에 존재하고, 본문에서 떼어내면 해설의 "(3.2절)" 참조가 갈 곳을 잃는다 |

### 앵커 방식 — 고정 id

퀴즈 절 헤딩은 글마다 다르다(`9. 퀴즈`, `6. 퀴즈`, `7. 퀴즈` / `8. Quiz`, `9. Quiz`). `rehype-slug`가 헤딩 텍스트로 id를 만들므로 앵커도 제각각이다.

**`components/article/quiz-renderer.tsx`가 마운트 지점을 만들 때 첫 세트에만 `id="quiz"`를 붙인다.** 카드는 항상 `#quiz`로 링크한다.

manifest에 앵커를 저장하는 대안은 택하지 않았다. `rehype-slug`의 slug 생성 규칙(한글·숫자·점 처리)을 생성 스크립트에서 재현해야 하는데, 어긋나도 빌드가 실패하지 않고 조용히 깨진 앵커가 된다. 고정 id는 그 위험이 없고, 절 번호가 바뀌어도 안 깨진다.

**한계**: 퀴즈 블록이 여러 개인 글에서는 첫 번째로 이동한다. 현재 모든 글이 블록 하나뿐이라 문제되지 않는다.

## 4. 구현

### 4.1 manifest에 퀴즈 정보 추가

`scripts/generate-content-manifest.ts`:

```
hasQuiz?: boolean      // ```quiz 블록이 하나라도 있고 유효 문항이 1개 이상이면
quizCount?: number     // 첫 블록의 유효 문항 수
```

문항 수는 **`lib/quiz.ts`의 `parseQuiz`를 재사용해 센다.** 정규식으로 `- type:`을 세면 형식이 깨진 문항까지 포함되어 실제 렌더 수와 어긋난다. 파서를 쓰면 UI가 실제로 그리는 수와 일치한다.

슬라이드가 파일·마커 짝 검사로 경고를 내듯, **퀴즈 블록은 있는데 유효 문항이 0개면 경고**를 낸다. YAML이 깨진 글이 조용히 목록에서 빠지는 것을 막는다. 경고만 내고 빌드는 계속한다.

### 4.2 조회 함수

`lib/articles.ts`에 `getArticlesWithSlides`와 같은 모양으로 추가한다.

```typescript
export async function getArticlesWithQuiz(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]>
```

`hasQuiz === true && a.lang === lang` 필터, 날짜 내림차순 정렬.

### 4.3 앵커 id

`components/article/quiz-renderer.tsx`의 마운트 지점 생성부:

```typescript
const mount = document.createElement('div');
mount.className = 'quiz-mount';
if (index === 0) mount.id = 'quiz';
```

**스크롤 처리가 필요하다.** 퀴즈는 클라이언트에서 마운트되므로 페이지 로드 직후엔 `#quiz` 요소가 없고, 브라우저의 자동 앵커 스크롤이 그 전에 끝나 이동이 안 될 수 있다. 마운트 직후 `location.hash === '#quiz'`이면 해당 요소로 `scrollIntoView` 한다.

**이것이 이번 작업의 유일한 불확실 요소다.** 구현 시 실제 브라우저에서 동작을 확인해야 한다.

### 4.4 목록 페이지

- `app/quiz/page.tsx`, `app/en/quiz/page.tsx` — `app/slides/page.tsx`와 `app/en/slides/page.tsx`를 본뜬다
- 헤더 라벨 `Quiz`, 개수 문구는 "N개의 퀴즈" / "N quiz set(s)"
- 빈 상태 문구: "아직 퀴즈가 있는 글이 없습니다." / "No posts with quizzes yet."

### 4.5 카드 컴포넌트

`components/quiz/quiz-card.tsx` — `components/slides/slide-card.tsx`를 본뜬다.

- 배지 텍스트 `Quiz`
- 개수 단위 "문항" / "questions" (카드에 문항 수를 표시한다)
- 링크: `/{articleDir}/#quiz`, 영문 `/en/{articleDir}/#quiz`

`SlideCard`와 구조가 거의 같지만 **별도 컴포넌트로 둔다.** 공통화하면 배지·단위·경로 규칙을 전부 props로 빼야 해서 오히려 읽기 어려워지고, 두 카드가 앞으로 다르게 진화할 여지도 있다.

### 4.6 헤더·i18n·sitemap

- `components/site-header.tsx`의 `NAV` 배열에 `{ key: 'quiz', href: '/quiz' }`를 **`slides` 다음**에 추가
- `lib/i18n/dictionaries.ts`의 `nav` 타입과 `ko`/`en` 객체에 `quiz: '퀴즈'` / `quiz: 'Quiz'`
- `app/sitemap.ts`에 `/quiz`와 `/en/quiz` 추가 (slides와 같은 `changeFrequency: 'weekly'`, `priority: 0.8`)

## 5. 검증

- `npm run check`, `npm run build` 통과
- `public/content-manifest.json`에 7편이 `hasQuiz: true`, `quizCount: 10`으로 들어갔는지 (ko/en 각각)
- `/quiz`와 `/en/quiz`가 7개 카드를 보여주는지
- **카드 클릭 시 실제로 퀴즈 절로 스크롤되는지** — 4.3절의 불확실 요소. 두 언어 모두 확인
- 헤더 메뉴가 두 언어에서 나오고, `/quiz`에서 활성 표시가 되는지
- 기존 `/slides` 회귀 없는지
- 브라우저 확인은 `npm run build` + `npx serve out -l 3000`으로 한다. 이 환경의 `npm run dev`는 동적 slug 라우트에서 500이 난다(Turbopack dev + `output: export`, 기존 문제)

## 6. 이번 범위에서 제외

- 퀴즈 전용 페이지(`/{글}/quiz/`)
- 퀴즈 콘텐츠 추가·수정
- `SlideCard`와 `QuizCard`의 공통화
- 목록 페이지의 필터·정렬 UI (날짜 내림차순 고정)

## 7. 완료 기준

- `/quiz`·`/en/quiz`가 퀴즈 보유 글 7편을 날짜 내림차순으로 보여준다
- 카드에 제목·시리즈·날짜·문항 수가 나온다
- 카드를 클릭하면 해당 글의 퀴즈 위치로 이동한다 (두 언어)
- 헤더 네비게이션에 퀴즈 메뉴가 있고 활성 표시가 동작한다
- sitemap에 두 경로가 포함된다
- `npm run check`·`npm run build` 통과, `/slides` 회귀 없음
