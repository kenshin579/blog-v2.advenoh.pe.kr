---
name: generate-slides
description: Use when creating a presentation slide deck for a blog article (contents/{category}/{slug}/slides.html), translating an existing deck into English (slides_en.html), and embedding it into the article
---

# Generate Presentation Slides (slides.html)

## Overview

이 블로그는 글마다 발표용 슬라이드를 붙일 수 있다. 글 폴더에 `slides.html`을 두고 본문에 `<!-- slides -->` 마커를 넣으면, 빌드 시 `{글주소}/slides/`로 배포되고 마커 자리에 16:9 임베드가 렌더된다.

이 스킬은 글 하나를 받아 **슬라이드를 만들고 마커까지 삽입**한다.

핵심 원칙: **엔진은 템플릿에서 그대로 가져오고, 본문 슬라이드만 새로 쓴다.** 슬라이드의 CSS(769줄)와 JS(276줄)는 검증된 자산이므로 손대지 않는다.

## When to Use

- 특정 글의 발표 자료를 만들 때 (`contents/{category}/{slug}/` → 같은 폴더 `slides.html`)
- 기존 데크의 **영문판**을 만들 때 (`slides.html` → 같은 폴더 `slides_en.html`) — 아래 "영문 데크" 절로 간다
- 이미 대상 파일이 있으면 덮어쓰기 전에 사용자에게 확인

## 대상 지정

- **단일 글**: slug(`go/go-fx-의존성-주입`) 또는 `index.md` 경로
- 한 번에 **한 글만** 처리한다. 슬라이드는 글 내용을 재구성하는 작업이라 배치로 돌리면 품질이 급격히 떨어진다.
- **언어**: 지정이 없으면 한국어 데크로 본다. 영문판은 한국어 데크가 **이미 있을 때만** 만든다 — 글에서 새로 설계하지 않는다.

## Procedure

### 1. 글을 읽고 구성을 설계한다

`contents/{category}/{slug}/index.md`를 **전부** 읽는다. 그리고 장(`#` 헤딩) 구조를 슬라이드로 매핑한다.

- 글의 절(`##`) 하나가 슬라이드 1~2장이 되는 게 보통이다
- 표·코드가 큰 절은 두 장으로 쪼갠다
- 글에 퀴즈(`<details>`)가 있으면 그대로 퀴즈 슬라이드로 옮긴다 (5문항씩)

목표 분량은 **글 700줄당 30장 안팎**. 정답은 없지만 한 장에 한 가지 주장만 담는다는 원칙을 지키면 자연스럽게 이 근처가 된다.

설계한 구성을 사용자에게 먼저 보여주고 진행해도 좋다.

### 2. 템플릿을 복사한다

```bash
cp .claude/skills/generate-slides/assets/deck-template.html \
   "contents/{category}/{slug}/slides.html"
```

템플릿에는 엔진 전체 + **표지 1장** + 하단 크롬이 들어 있다. 표지는 내용만 바꿔 그대로 쓴다.

### 3. 제목과 액센트 색을 바꾼다

| 위치 | 바꿀 것 |
|---|---|
| `<title>` | 글 제목 |
| `<span class="deck-id">` | 하단 바에 표시될 짧은 제목 |
| 액센트 색 **6곳** | 주제에 맞는 색 (아래 표) |

액센트는 라이트/다크 각각 있고, CSS 4블록 + JS 폴백 1곳에 흩어져 있다. **JS 폴백을 빠뜨리기 쉬우니 주의.**

```bash
# 템플릿 기본값(중립 파랑) → 주제색으로 일괄 치환
sed -i '' 's|#1F5FA8|{라이트색}|g; s|rgba(31, 95, 168|rgba({라이트 rgb}|g' slides.html
sed -i '' 's|#5AA9F0|{다크색}|g; s|rgba(90, 169, 240|rgba({다크 rgb}|g' slides.html
sed -i '' 's|#04121F|{다크 잉크}|g' slides.html
```

치환 후 `grep -c '#1F5FA8\|#5AA9F0' slides.html`이 **0**이어야 한다.

주제색 예시:

| 주제 | 라이트 | 다크 | 다크 잉크 |
|---|---|---|---|
| Go | `#0A6E8A` | `#3FC7EF` | `#031A20` |
| 모니터링·관측 | `#C24A12` | `#FF7A45` | `#170A03` |
| 데이터베이스 | `#1F5FA8` | `#5AA9F0` | `#04121F` |

라이트 색은 흰 배경에서, 다크 색은 어두운 배경에서 각각 대비가 충분해야 한다. 같은 색을 양쪽에 쓰면 한쪽이 반드시 흐려진다.

### 4. 본문 슬라이드를 작성한다

`assets/snippets.html`에서 필요한 종류를 복사해 `<div class="stage">` 안, 표지 다음에 붙인다.

스니펫 9종: 장 구분 · 불릿+코드 2단 · 코드 전면 · 표 · 카드 2단 · 아키텍처 · 단계 목록 · 트리 · 퀴즈

**각 스니펫의 "분량" 주석을 반드시 지킬 것.** 무대가 1280×720 고정이라 넘치면 화면 밖으로 잘리는데, 개요 모드에서는 잘 안 보여서 놓치기 쉽다.

### 5. 번호를 맞춘다

- `data-n="NN"`이 `01`부터 **연속**인지
- 하단 카운터의 총 장수(`/ NN`)가 실제 장 수와 같은지
- 퀴즈의 `<span class="ref">→ 슬라이드 NN</span>`이 실제 슬라이드를 가리키는지

```bash
python3 -c "
import re
s=open('contents/{category}/{slug}/slides.html',encoding='utf-8').read()
ns=re.findall(r'data-n=\"(\d+)\"',s)
print('장 수:',len(ns),'| 연속:',ns==[f'{i:02d}' for i in range(1,len(ns)+1)])
print('카운터:',re.findall(r'/ (\d+)</span>',s))
print('퀴즈 참조:',sorted(set(re.findall(r'슬라이드 [0-9][0-9 ·]*',s))))
"
```

**슬라이드를 나중에 추가하거나 나누면 뒤 번호가 전부 밀린다.** 그때는 `data-n`, 주석의 번호, 카운터, 퀴즈 참조를 **모두** 갱신해야 한다. 퀴즈 참조에 `슬라이드 08 · 09`처럼 숫자가 둘인 경우 뒤 숫자를 놓치기 쉽다.

### 6. 글에 마커를 삽입한다 (기본 동작)

`index.md`의 **첫 번째 `#` 섹션 끝**, 즉 두 번째 `#` 헤딩 바로 앞에 앞뒤 빈 줄과 함께 넣는다.

```markdown
- 마지막 항목

<!-- slides -->

# 2. 다음 장
```

섹션 이름은 글마다 다르므로(`들어가며`·`개요`·`시작하며`) **이름이 아니라 위치**로 찾는다. 첫 섹션에 넣는 이유는 마무리에 두면 끝까지 읽은 사람만 보게 되기 때문이다.

- 이미 마커가 있으면 **건너뛰고 보고**한다
- **`index_en.md`는 건드리지 않는다** — 영문 슬라이드(`slides_en.html`)가 없으면 존재하지 않는 경로를 가리키는 깨진 임베드가 된다. 영문 데크를 만들었다면 "영문 데크" 절의 5번에서 넣는다
- 사용자가 위치를 지정하거나 넣지 말라고 하면 그에 따른다

### 7. 검증한다

```bash
npm run build 2>&1 | grep -i "Slides copied\|Compiled successfully\|⚠️\|error"
ls "out/{slug}/slides/index.html"
grep -c "slides-embed__frame" "out/{slug}/index.html"   # 2 가 정상 (HTML + RSC 페이로드)
```

그리고 **반드시 브라우저로 넘침을 검사한다.** 눈으로 훑어서는 잘린 슬라이드를 놓친다.

```bash
npx serve@latest out -l 3100 &
# http://localhost:3100/{slug}/slides/ 를 열고 아래를 실행
```

```js
() => {
  const over = [];
  const holders = [...document.querySelectorAll('.holder')];
  holders.forEach((h) => {
    h.classList.add('is-active');
    const body = h.querySelector('.slide-body');
    if (body && body.scrollHeight > body.clientHeight + 2) {
      over.push({ n: h.dataset.n, 넘침: body.scrollHeight - body.clientHeight });
    }
    h.classList.remove('is-active');
  });
  holders[0].classList.add('is-active');
  return { 검사한_장: holders.length, 넘치는_장: over };
}
```

`넘치는_장`이 빈 배열이어야 한다. 넘치면 그 슬라이드를 둘로 나누고 5번(번호 맞추기)을 다시 한다.

마지막으로 개요 모드(`o` 키)에서 전체를 한 번 훑고, 글 페이지에서 임베드가 첫 섹션과 두 번째 섹션 사이에 있는지 확인한다.

데크를 만들면 `/slides` 목록 페이지에 자동으로 올라간다. 별도 등록 작업은 없다. 빌드 후 `out/slides/index.html`에 카드가 하나 늘었는지 함께 확인하면 좋다.

## 영문 데크 (slides_en.html)

한국어 데크가 이미 있는 글에 영문판을 붙인다. **새로 설계하지 않는다** — 구조·장수·번호·액센트를 그대로 두고 **텍스트만 번역**한다. 그래야 두 데크가 같은 발표로 남고, 나중에 한쪽을 고칠 때 다른 쪽을 찾아가기 쉽다.

번역 규칙은 `translate-article-en` 스킬을 따른다: **코드의 로직·식별자는 한 글자도 바꾸지 않고, 코드 안의 한글 주석·문자열만 영어로.**

### 1. 세 조각으로 자른다

엔진을 손으로 다시 옮기면 반드시 어긋난다. 스크립트로 자르고 본문만 새로 쓴 뒤 도로 붙인다.

```bash
python3 - <<'PY'
from pathlib import Path
src = Path('contents/{category}/{slug}/slides.html').read_text(encoding='utf-8')
lines = src.split('\n')
i = next(n for n, l in enumerate(lines) if 'id="stage"' in l) + 1   # head 끝
j = next(n for n, l in enumerate(lines) if '/stage -->' in l)       # tail 시작
Path('/tmp/head.html').write_text('\n'.join(lines[:i]), encoding='utf-8')
Path('/tmp/tail.html').write_text('\n'.join(lines[j:]), encoding='utf-8')
print('본문 범위', i + 1, '~', j)
PY
```

head(`<!doctype>`+CSS)와 tail(chrome+help+JS)은 **바이트 그대로 재사용**하고, 정해진 문자열만 치환한다.

### 2. 본문을 번역해 새로 쓴다

잘라낸 본문 범위를 영어로 다시 쓴다. `data-n`·`class`·`data-chapter`·코드 하이라이팅 `<span>`은 전부 그대로 두고 텍스트 노드만 바꾼다.

`eyebrow`·`stamp`처럼 짧은 라벨은 소문자 한 단어로 옮기면(`문제`→`problem`, `확장`→`scaling`) 원본의 밀도가 유지된다. **발표자 노트(`notes-src`)도 빠짐없이 번역한다** — 노트가 한국어로 남으면 영문 발표에 쓸 수 없다.

### 3. head · tail의 정해진 자리를 치환한다

| 조각 | 바꿀 것 |
|---|---|
| head | `<html lang="ko">` → `lang="en"` · `<title>` |
| tail | `deck-id` · `발표자 노트` → `Speaker notes` · 버튼 4개(`개요`/`노트`/`테마`/`?`)와 각 `title` 속성 · `단축키` 도움말 `<h3>`과 `<dd>` 8개 |
| tail(JS) | `t.title = "슬라이드 "` → `"Slide "` |

치환은 **건수를 검증하며** 하는 게 안전하다. 각 문자열이 정확히 1건 매칭되지 않으면 중단시킨다.

**엔진의 CSS/JS 주석은 한국어로 그대로 둔다.** 화면에 안 보이고, 엔진을 원본과 동일하게 유지해야 나중에 엔진을 고칠 때 diff가 깨끗하다.

액센트 색은 **바꾸지 않는다.** 같은 글의 두 데크는 같은 색을 쓴다.

### 4. 합치고 검증한다

```bash
cat /tmp/head.html body_en.html /tmp/tail.html > "contents/{category}/{slug}/slides_en.html"
file -I "contents/{category}/{slug}/slides_en.html"   # charset=utf-8 확인
```

5번(번호 맞추기)을 **영문 데크에도 그대로** 돌린다. 장 수·카운터가 한국어 데크와 같아야 하고, 퀴즈 참조는 `→ 슬라이드 NN`이 아니라 `→ Slide NN`이 된다.

그리고 화면에 노출되는 한글이 남았는지 훑는다 — 주석 밖에 한글이 있으면 번역을 빠뜨린 것이다.

```bash
python3 -c "
import re
for i, l in enumerate(open('contents/{category}/{slug}/slides_en.html',encoding='utf-8'), 1):
    s = l.strip()
    if re.search(r'[가-힣]', l) and not s.startswith(('/*','*','//','<!--')):
        print(i, s[:100])
"
```

### 5. 마커를 `index_en.md`에 넣는다

**영문 데크를 만든 뒤에만** 넣는다. 위치는 한국어와 같은 규칙 — 첫 번째 `#` 섹션 끝, 두 번째 `#` 헤딩 바로 앞.

### 6. 넘침을 다시 검사한다

**영문은 같은 내용이라도 한국어보다 길어져 넘치기 쉽다.** 한국어 데크가 멀쩡했다는 건 아무 보장도 아니므로, 7번의 넘침 검사 스크립트를 `/en/{slug}/slides/`에 대해 **반드시 다시 돌린다.**

표가 많은 장(9행 이상)과 퀴즈 장이 가장 위험하다. 넘치면 문장을 줄이는 쪽을 먼저 시도하고, 그래도 넘치면 장을 나눈 뒤 **양쪽 데크의 번호를 함께** 맞춘다.

하단 크롬도 함께 본다. 버튼 라벨이 영어로 길어지므로 `.chrome`·`.keys`의 가로 넘침과 `deck-id` 잘림을 확인한다. `deck-id`는 대문자 변환·nowrap이라 길면 레일을 밀어낸다 — 짧게 잡는다(예: `uber/fx · Go DI`).

```js
() => {
  const c = document.querySelector('.chrome'), id = document.querySelector('.deck-id');
  return { chromeOverflowX: c.scrollWidth - c.clientWidth, deckIdClipped: id.scrollWidth > id.clientWidth };
}
```

마지막으로 `/en/slides` 목록에 카드가 늘었는지, 영문 글의 임베드 `src`가 `/en/...`을 가리키는지 확인한다.

## 슬라이드 작성 원칙

- **한 장에 한 가지 주장.** 제목이 곧 그 주장이 되게 쓴다 ("fx.Provide 설명" ❌ → "Provide는 등록만 한다 — 실행은 미룬다" ✅)
- **글을 그대로 옮기지 않는다.** 글은 읽는 것이고 슬라이드는 보는 것이다. 문단을 불릿으로 압축하고, 근거는 발표자 노트로 내린다
- **발표자 노트를 모든 장에 쓴다.** 무슨 말을 할지, 어디에 시간을 쓸지, 어떤 질문이 나올지. 이게 있어야 실제로 발표에 쓸 수 있다
- **표지 오른쪽 패널**에는 글의 핵심을 한 화면에 보여주는 무엇이든 넣는다(트리·아키텍처·대표 코드). 필요 없으면 지우고 왼쪽만 남긴다

## Common Mistakes

- ❌ `.tree`에 raw 텍스트를 넣음 → ✅ 각 줄을 `<span class="lv">`로 감싼다. 안 그러면 줄바꿈이 사라져 한 줄로 흐른다
- ❌ 표에 10행 넘게 넣음 → ✅ 본문에 표만 있으면 9행, 콜아웃과 함께면 5~6행. 넘치면 두 장으로
- ❌ 슬라이드를 나눈 뒤 뒤 번호를 안 고침 → ✅ `data-n`·카운터·퀴즈 참조를 모두 갱신 (특히 `슬라이드 08 · 09`의 뒤 숫자)
- ❌ 액센트를 CSS만 바꾸고 JS 폴백을 빠뜨림 → ✅ `grep -c` 로 템플릿 기본색이 0인지 확인
- ❌ 영문 데크 없이 `index_en.md`에 마커를 넣음 → ✅ `slides_en.html`을 먼저 만든다
- ❌ 영문 데크를 글(`index_en.md`)에서 새로 설계함 → ✅ 한국어 데크를 번역한다. 구조가 갈리면 두 데크가 다른 발표가 된다
- ❌ 영문 데크에서 넘침 검사를 생략함 → ✅ 영어가 길어 새로 넘치는 장이 생긴다. 한국어가 멀쩡했던 건 보장이 아니다
- ❌ 엔진의 한국어 CSS/JS 주석까지 번역함 → ✅ 그대로 둔다. 엔진은 두 데크가 동일해야 한다
- ❌ 코드 안의 `<`·`&`를 그대로 씀 → ✅ `&lt;`·`&amp;`로 이스케이프. `[]Notifier`, `&Config{}` 같은 코드에서 자주 걸린다
- ❌ 넘침 검사를 생략하고 눈으로만 확인 → ✅ 잘린 슬라이드는 개요 모드에서도 멀쩡해 보인다. 반드시 스크립트로 검사
- ❌ 엔진(CSS/JS)을 손봄 → ✅ 템플릿에서 그대로 가져온다. 무대 정렬·테마 동기화 등이 이미 맞춰져 있다

## 엔진을 고쳐야 할 때

CSS나 JS 자체를 고쳐야 하는 상황이면 **템플릿과 기존 슬라이드를 모두** 갱신해야 한다. 정본은 `.claude/skills/generate-slides/assets/deck-template.html`이고, 나머지 복사본은 이걸로 찾는다:

```bash
find .claude/skills/generate-slides/assets contents -name "slides.html" -o -name "slides_en.html" -o -name "deck-template.html"
```

**영문 데크는 복사본을 두 배로 늘린다.** 이미 정본 1 + 데크 8벌이라 아래 임계를 넘겼다.

복사본이 5벌을 넘어가면 `copy-assets.ts`가 빌드 시 엔진을 주입하는 구조로 바꾸는 걸 검토한다(테마 동기화 스크립트를 주입하는 것과 같은 방식). 다만 그렇게 하면 슬라이드 원본이 자기완결형이 아니게 되므로, 그 트레이드오프를 사용자와 상의할 것.

## 참고

- 슬라이드 임베드 규약: `CLAUDE.md`의 "슬라이드 데크" 절
- 설계 배경: `docs/superpowers/specs/2026-07-26-slides-embed-design.md`, `2026-07-26-slides-theme-sync-design.md`
- 실제 사례: `contents/go/go-fx-의존성-주입/slides.html` (32장), `contents/cloud/grafana-완벽-가이드-1-.../slides.html` (38장)
- 영문 데크 실제 사례: `contents/go/go-fx-의존성-주입/slides_en.html` (한국어판과 32장 동일)
- 번역 규칙 원본: `translate-article-en` 스킬
