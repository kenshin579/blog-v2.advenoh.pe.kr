---
name: generate-slides
description: Use when creating a presentation slide deck for a blog article (contents/{category}/{slug}/slides.html) and embedding it into the article
---

# Generate Presentation Slides (slides.html)

## Overview

이 블로그는 글마다 발표용 슬라이드를 붙일 수 있다. 글 폴더에 `slides.html`을 두고 본문에 `<!-- slides -->` 마커를 넣으면, 빌드 시 `{글주소}/slides/`로 배포되고 마커 자리에 16:9 임베드가 렌더된다.

이 스킬은 글 하나를 받아 **슬라이드를 만들고 마커까지 삽입**한다.

핵심 원칙: **엔진은 템플릿에서 그대로 가져오고, 본문 슬라이드만 새로 쓴다.** 슬라이드의 CSS(769줄)와 JS(276줄)는 검증된 자산이므로 손대지 않는다.

## When to Use

- 특정 글의 발표 자료를 만들 때 (`contents/{category}/{slug}/` → 같은 폴더 `slides.html`)
- 이미 `slides.html`이 있으면 덮어쓰기 전에 사용자에게 확인

## 대상 지정

- **단일 글**: slug(`go/go-fx-의존성-주입`) 또는 `index.md` 경로
- 한 번에 **한 글만** 처리한다. 슬라이드는 글 내용을 재구성하는 작업이라 배치로 돌리면 품질이 급격히 떨어진다.

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
- **`index_en.md`는 건드리지 않는다** — 영문 슬라이드(`slides_en.html`)가 없으면 존재하지 않는 경로를 가리키는 깨진 임베드가 된다
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
- ❌ `index_en.md`에도 마커를 넣음 → ✅ 영문 슬라이드가 없으면 넣지 않는다
- ❌ 코드 안의 `<`·`&`를 그대로 씀 → ✅ `&lt;`·`&amp;`로 이스케이프. `[]Notifier`, `&Config{}` 같은 코드에서 자주 걸린다
- ❌ 넘침 검사를 생략하고 눈으로만 확인 → ✅ 잘린 슬라이드는 개요 모드에서도 멀쩡해 보인다. 반드시 스크립트로 검사
- ❌ 엔진(CSS/JS)을 손봄 → ✅ 템플릿에서 그대로 가져온다. 무대 정렬·테마 동기화 등이 이미 맞춰져 있다

## 엔진을 고쳐야 할 때

CSS나 JS 자체를 고쳐야 하는 상황이면 **템플릿과 기존 슬라이드를 모두** 갱신해야 한다. 현재 엔진 복사본이 있는 곳:

- `.claude/skills/generate-slides/assets/deck-template.html` (정본)
- `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides.html`
- `contents/go/go-fx-의존성-주입/slides.html`

복사본이 5벌을 넘어가면 `copy-assets.ts`가 빌드 시 엔진을 주입하는 구조로 바꾸는 걸 검토한다(테마 동기화 스크립트를 주입하는 것과 같은 방식). 다만 그렇게 하면 슬라이드 원본이 자기완결형이 아니게 되므로, 그 트레이드오프를 사용자와 상의할 것.

## 참고

- 슬라이드 임베드 규약: `CLAUDE.md`의 "슬라이드 데크" 절
- 설계 배경: `docs/superpowers/specs/2026-07-26-slides-embed-design.md`, `2026-07-26-slides-theme-sync-design.md`
- 실제 사례: `contents/go/go-fx-의존성-주입/slides.html` (32장), `contents/cloud/grafana-완벽-가이드-1-.../slides.html` (38장)
