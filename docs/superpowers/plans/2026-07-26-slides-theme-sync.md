# 슬라이드 테마 동기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 임베드된 슬라이드와 새 탭으로 연 슬라이드가 블로그의 라이트/다크 설정을 따르게 한다.

**Architecture:** 슬라이드는 블로그와 같은 오리진에서 서빙되므로 `localStorage`를 공유한다. `scripts/copy-assets.ts`가 `public/`으로 복사하는 시점에 동기화 스크립트를 `</head>` 앞에 주입한다. 그 스크립트가 블로그의 `localStorage["theme"]`를 읽어 `<html data-theme>`에 반영하고, `storage` 이벤트로 실시간 변경을 따라간다. 슬라이드 원본은 건드리지 않는다.

**Tech Stack:** next-themes 0.4.6 (블로그), 순수 JS (주입 스크립트), tsx 빌드 스크립트

**설계 문서:** `docs/superpowers/specs/2026-07-26-slides-theme-sync-design.md`

---

## 이 프로젝트의 검증 방식 (먼저 읽을 것)

**테스트 러너가 없다.** `package.json`에 `test` 스크립트가 없고 `check`(tsc)만 있다. **테스트 프레임워크를 설치하지 말 것.** 검증은 빌드 산출물 확인과 브라우저 실측으로 한다.

브라우저 검증은 chrome-devtools MCP 도구(`navigate_page`, `evaluate_script`, `take_screenshot`, `resize_page`)로 한다. 정적 서버는 `npx serve@latest out -l 3100`으로 띄운다.

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `scripts/copy-assets.ts` | `contents/`의 정적 자산을 `public/`으로 복사 | 슬라이드 복사 시 테마 동기화 스크립트 주입 |
| `CLAUDE.md` | 프로젝트 규약 | 슬라이드가 블로그 테마를 자동으로 따른다는 한 줄 |
| `docs/superpowers/specs/2026-07-26-slides-embed-design.md` | 이전 설계 문서 | "배포본 == 원본 바이트 동일" 검증 항목 정정 |

슬라이드 원본(`contents/**/slides.html`)은 **변경하지 않는다.**

브랜치는 `feature/slides-theme-sync`이며 설계 문서 커밋(`0850ebd`)이 이미 올라가 있다.

---

### Task 1: `storage` 이벤트가 iframe에 전달되는지 실측

설계 문서의 유일한 미검증 전제다. **코드를 쓰기 전에 이것부터 확인한다.** 전달되지 않으면 설계를 postMessage 방식으로 바꿔야 하므로, 여기서 틀리면 뒤 작업이 전부 헛수고가 된다.

**Files:** 없음 (검증만)

- [ ] **Step 1: 현재 상태로 빌드하고 서버를 띄운다**

```bash
npm run build 2>&1 | grep -i "Compiled successfully\|error" | head -3
npx serve@latest out -l 3100 > /tmp/serve.log 2>&1 &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100/grafana-완벽-가이드-1-prometheus와-grafana-기초/"
```

Expected: `✓ Compiled successfully`, 그리고 `200`

- [ ] **Step 2: 글 페이지를 연다**

`navigate_page`로 `http://localhost:3100/grafana-완벽-가이드-1-prometheus와-grafana-기초/` 이동.

- [ ] **Step 3: iframe 안에 storage 리스너를 심고 블로그 테마를 바꾼다**

`evaluate_script`로 실행:

```js
() => {
  const f = document.querySelector('.slides-embed__frame');
  const w = f.contentWindow;
  w.__storageEvents = [];
  w.addEventListener('storage', (e) => {
    w.__storageEvents.push({ key: e.key, oldValue: e.oldValue, newValue: e.newValue });
  });
  // 블로그 테마를 반대로 토글 (next-themes 가 localStorage 에 쓴다)
  const before = localStorage.getItem('theme');
  const next = before === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  return { before, next, listenerInstalled: true };
}
```

- [ ] **Step 4: 이벤트가 도착했는지 확인한다**

`evaluate_script`로 실행:

```js
() => {
  const f = document.querySelector('.slides-embed__frame');
  return {
    events: f.contentWindow.__storageEvents,
    부모문서에도_왔나: '값을 바꾼 문서에는 오지 않아야 정상',
  };
}
```

Expected: `events` 배열에 `{key: "theme", newValue: "dark"|"light"}` 항목이 **1건 이상** 있어야 한다.

**빈 배열이면 설계 전제가 틀린 것이다.** 그 경우 즉시 보고하고 멈춰라. 차선책(부모 페이지에서 `postMessage`)은 설계 변경이 필요하므로 임의로 진행하지 마라.

- [ ] **Step 5: 실제 UI 토글로도 확인한다**

`localStorage.setItem`을 직접 부른 것과 next-themes가 실제로 쓰는 경로가 다를 수 있다. 헤더의 테마 토글 버튼을 실제로 눌러서도 확인하라.

```js
() => {
  const f = document.querySelector('.slides-embed__frame');
  f.contentWindow.__storageEvents = [];
  // 헤더 테마 토글 버튼을 찾아 클릭
  const btn = [...document.querySelectorAll('button')].find(b =>
    b.querySelector('svg') && /theme|테마|dark|light/i.test(b.getAttribute('aria-label') || b.title || '')
  );
  if (btn) btn.click();
  return { buttonFound: !!btn, label: btn?.getAttribute('aria-label') || btn?.title };
}
```

버튼을 못 찾으면 `take_snapshot`으로 헤더 구조를 확인해 정확한 버튼을 찾아라. 클릭 후 약 500ms 뒤 이벤트 배열을 다시 읽어 항목이 늘었는지 확인한다.

Expected: 실제 토글로도 `storage` 이벤트가 iframe에 도착한다.

- [ ] **Step 6: 결과를 보고한다**

두 방식(직접 `setItem`, 실제 버튼 클릭) 각각의 결과를 실제 출력과 함께 보고하라. 커밋할 것은 없다.

---

### Task 2: `copy-assets.ts`에 테마 동기화 스크립트 주입

**Files:**
- Modify: `scripts/copy-assets.ts`

- [ ] **Step 1: 현재 배포본에 주입 블록이 없음을 확인 (red)**

```bash
grep -c "slides-theme-sync" "out/grafana-완벽-가이드-1-prometheus와-grafana-기초/slides/index.html" || echo "0 (아직 없음)"
```

Expected: `0` 또는 `0 (아직 없음)`

- [ ] **Step 2: 주입 상수와 함수를 추가한다**

`scripts/copy-assets.ts`의 `findSlides` 함수 **바로 아래**에 추가한다.

```ts
/**
 * 배포되는 슬라이드에 주입할 테마 동기화 스크립트.
 * 슬라이드 원본(contents/**\/slides.html)은 건드리지 않는다 — 원본은 외부 의존성 없는
 * 자기완결형으로 유지하고, public/ 으로 복사되는 사본에만 이 기능을 얹는다.
 *
 * 슬라이드는 블로그와 같은 오리진에서 서빙되므로 localStorage 를 공유한다.
 * 그래서 블로그의 next-themes 값을 그대로 읽을 수 있다.
 */
const THEME_SYNC_MARKER = 'data-slides-theme-sync';

const THEME_SYNC_SCRIPT = `<!-- 아래 블록은 scripts/copy-assets.ts 가 배포 시 주입한다. 원본 slides.html 에는 없다. -->
<script ${THEME_SYNC_MARKER}>
(function () {
  "use strict";
  var BLOG_KEY = "theme";      /* next-themes 기본 storageKey */
  var DECK_KEY = "deck-theme"; /* 슬라이드 자체 저장 키 */

  function prefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* 블로그 테마를 light/dark 로 확정한다. "system" 이거나 값이 없으면 OS 설정을 따른다. */
  function resolveBlogTheme() {
    var v = null;
    try { v = localStorage.getItem(BLOG_KEY); } catch (e) {}
    if (v === "light" || v === "dark") { return v; }
    return prefersDark() ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    /* 슬라이드 자체 초기화 코드가 문서 하단에서 deck-theme 를 읽어 속성을 다시 설정한다.
       미리 같은 값으로 맞춰 두면 서로 싸우지 않고, 이전에 슬라이드에서 토글해 둔 값이
       블로그 값으로 덮여 "다시 열면 블로그 기준" 규칙이 성립한다. */
    try { localStorage.setItem(DECK_KEY, theme); } catch (e) {}
  }

  /* 슬라이드의 테마 전환 경로를 그대로 탄다.
     toggleTheme() 이 표지 스파크라인을 다시 그리는 drawHero() 를 부르는데,
     그 함수들이 IIFE 안에 있어 밖에서 직접 호출할 수 없기 때문이다. */
  function switchTo(theme) {
    if (document.documentElement.getAttribute("data-theme") === theme) { return; }
    var btn = document.getElementById("btnTheme");
    if (btn) { btn.click(); } else { apply(theme); }
  }

  apply(resolveBlogTheme());

  /* 블로그에서 테마를 바꾸면 같은 오리진의 이 문서로 storage 이벤트가 온다.
     (값을 바꾼 문서 자신에게는 오지 않는다) */
  window.addEventListener("storage", function (e) {
    if (e.key !== BLOG_KEY) { return; }
    switchTo(resolveBlogTheme());
  });

  /* 블로그가 "system" 인 동안 OS 테마가 바뀌는 경우 */
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      var v = null;
      try { v = localStorage.getItem(BLOG_KEY); } catch (e) {}
      if (v === "light" || v === "dark") { return; } /* 명시 설정이면 OS 변화를 무시 */
      switchTo(prefersDark() ? "dark" : "light");
    });
  } catch (e) {}
})();
</script>
`;

/**
 * </head> 바로 앞에 테마 동기화 스크립트를 끼워 넣는다.
 * 첫 페인트 전에 테마가 확정되어야 깜빡임이 없다.
 */
function injectThemeSync(html: string, label: string): string {
  if (html.includes(THEME_SYNC_MARKER)) return html;

  const idx = html.lastIndexOf('</head>');
  if (idx === -1) {
    console.warn(`⚠️  ${label}: </head> 를 찾을 수 없어 테마 동기화 스크립트를 주입하지 못했습니다`);
    return html;
  }

  return html.slice(0, idx) + THEME_SYNC_SCRIPT + html.slice(idx);
}
```

- [ ] **Step 3: 슬라이드 전용 복사 함수를 추가한다**

`injectThemeSync` 바로 아래에 추가한다.

```ts
/**
 * 슬라이드를 주입과 함께 복사한다.
 * 내용이 바뀌므로 copyFiles() 의 fs.copyFileSync 경로를 쓸 수 없고,
 * mtime/size 스킵도 적용하지 않는다 (주입으로 크기가 달라져 매번 다시 쓴다).
 * 슬라이드는 글당 1~2개뿐이라 비용이 무시할 수준이다.
 */
function copySlides(slides: Map<string, string>, destRoot: string) {
  let copiedCount = 0;

  for (const [relativePath, sourcePath] of slides) {
    const destPath = path.join(destRoot, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    try {
      const html = injectThemeSync(fs.readFileSync(sourcePath, 'utf-8'), relativePath);
      fs.writeFileSync(destPath, html, 'utf-8');
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${relativePath}:`, error);
    }
  }

  return copiedCount;
}
```

- [ ] **Step 4: `main()`의 슬라이드 블록을 교체한다**

변경 전:
```ts
  if (slides.size > 0) {
    const { copiedCount, skippedCount } = copyFiles(slides, publicDir);
    console.log(`✅ Slides copied: ${copiedCount}, skipped: ${skippedCount}`);
  } else {
    console.log('ℹ️  No slides to copy from contents/');
  }
```

변경 후:
```ts
  if (slides.size > 0) {
    const copiedCount = copySlides(slides, publicDir);
    console.log(`✅ Slides copied: ${copiedCount} (테마 동기화 스크립트 주입)`);
  } else {
    console.log('ℹ️  No slides to copy from contents/');
  }
```

- [ ] **Step 5: 스크립트를 실행한다**

```bash
npx tsx scripts/copy-assets.ts 2>&1 | grep -i "slide"
```

Expected:
```
🔍 Scanning for slides in contents/...
✅ Found 1 slide decks
✅ Slides copied: 1 (테마 동기화 스크립트 주입)
```

- [ ] **Step 6: 주입 결과를 확인한다 (green)**

```bash
R=$(pwd); D="grafana-완벽-가이드-1-prometheus와-grafana-기초"
echo "--- 배포본에 주입됨 ---"
grep -c "slides-theme-sync" "$R/public/$D/slides/index.html"
echo "--- 원본에는 없음 ---"
grep -c "slides-theme-sync" "$R/contents/cloud/$D/slides.html" || echo "0 (정상)"
echo "--- </head> 앞에 있는지 ---"
grep -n "slides-theme-sync\|</head>" "$R/public/$D/slides/index.html" | head -4
echo "--- 주입분 제외하면 원본과 동일한지 ---"
python3 - <<'PY'
import re, os
R = os.getcwd(); D = "grafana-완벽-가이드-1-prometheus와-grafana-기초"
src = open(f"{R}/contents/cloud/{D}/slides.html", encoding="utf-8").read()
dst = open(f"{R}/public/{D}/slides/index.html", encoding="utf-8").read()
stripped = re.sub(r"<!-- 아래 블록은 scripts/copy-assets\.ts.*?</script>\n", "", dst, flags=re.S)
print("주입분 제외 후 원본과 동일:", stripped == src)
print("주입 블록 크기:", len(dst) - len(stripped), "bytes")
PY
```

Expected: 배포본 1건 이상, 원본 0건, 주입 위치가 `</head>` 바로 앞, 그리고 `주입분 제외 후 원본과 동일: True`

- [ ] **Step 7: 타입 검사**

```bash
npm run check
```

Expected: 에러 없음 (`.next/dev/types/validator.ts` 관련 사전 존재 에러는 무시)

- [ ] **Step 8: 커밋**

```bash
git add scripts/copy-assets.ts
git commit -m "feat: 배포 시 슬라이드에 블로그 테마 동기화 스크립트 주입

* 같은 오리진이라 localStorage 를 공유 — 블로그의 next-themes 값을 그대로 읽는다
* </head> 앞에 주입해 첫 페인트 전에 테마 확정 (깜빡임 없음)
* storage 이벤트로 블로그 테마 변경을 실시간 반영
* 슬라이드 원본은 건드리지 않는다 — 자기완결형 유지

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 브라우저로 전 시나리오 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 빌드하고 서버를 띄운다**

```bash
npm run build 2>&1 | grep -i "Compiled successfully\|error" | head -3
pkill -f "serve@latest out" 2>/dev/null
npx serve@latest out -l 3100 > /tmp/serve.log 2>&1 &
sleep 4
```

- [ ] **Step 2: 블로그 다크 → 임베드도 다크**

`evaluate_script`로 `localStorage.setItem('theme','dark')` 설정 후 글 페이지를 새로 열고, iframe 안 `data-theme`를 읽는다.

```js
() => {
  const f = document.querySelector('.slides-embed__frame');
  return {
    블로그: document.documentElement.className,
    슬라이드: f.contentDocument.documentElement.getAttribute('data-theme'),
  };
}
```

Expected: 블로그 클래스에 `dark` 포함, 슬라이드 `data-theme === "dark"`

- [ ] **Step 3: 블로그 라이트 → 임베드도 라이트**

`localStorage.setItem('theme','light')` 후 페이지를 새로 열고 같은 확인.

Expected: 슬라이드 `data-theme === "light"`. `take_screenshot`으로 실제로 밝은 배경인지 눈으로도 확인한다.

- [ ] **Step 4: 실시간 반영 — 글에서 토글하면 임베드가 즉시 바뀐다**

헤더의 테마 토글 버튼을 실제로 클릭하고(Task 1 Step 5에서 찾은 버튼), 약 500ms 뒤 iframe의 `data-theme`가 바뀌었는지 확인한다. **페이지를 새로고침하지 말 것** — 실시간 반영을 보는 검증이다.

Expected: 새로고침 없이 `data-theme`가 반대로 바뀐다. `take_screenshot`으로 표지 스파크라인 색까지 바뀌었는지 확인한다.

- [ ] **Step 5: 새 탭 — 블로그와 같은 테마로 열린다**

블로그를 라이트로 둔 상태에서 `/{글폴더}/slides/`로 직접 이동해 `data-theme`를 확인하고, 다크로 바꾼 뒤 같은 확인을 반복한다.

Expected: 두 경우 모두 블로그 설정과 일치

- [ ] **Step 6: 슬라이드 내 토글 — 그 화면만 바뀌고, 다시 열면 블로그 기준**

슬라이드 페이지에서 `#btnTheme`를 클릭해 테마가 뒤집히는지 확인하고, 그 다음 페이지를 새로고침해 블로그 설정으로 돌아오는지 확인한다.

```js
() => {
  const before = document.documentElement.getAttribute('data-theme');
  document.getElementById('btnTheme').click();
  return { before, after: document.documentElement.getAttribute('data-theme') };
}
```

Expected: 클릭으로 뒤집히고, 새로고침하면 블로그 설정으로 복귀

- [ ] **Step 7: `system` 모드 — OS 설정을 따른다**

`localStorage.setItem('theme','system')` 후 페이지를 열어 슬라이드가 OS 설정과 일치하는지 확인한다. `emulate` 도구로 `prefers-color-scheme`를 바꿀 수 있으면 양쪽 다 확인한다.

Expected: 슬라이드가 OS 설정을 따른다

- [ ] **Step 8: 결과를 보고한다**

Step 2~7 각각의 실제 출력과 스크린샷을 함께 보고하라. 커밋할 것은 없다. 서버는 `pkill -f "serve@latest out"`로 정리한다.

---

### Task 4: 문서 갱신

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-07-26-slides-embed-design.md`

- [ ] **Step 1: `CLAUDE.md`에 한 줄 추가**

`### 슬라이드 데크 (선택)` 섹션의 **데크 제작 시 주의** 문단 바로 뒤에 추가한다.

```markdown
**테마**: 배포된 슬라이드는 블로그의 라이트/다크 설정을 자동으로 따른다(빌드 시 `copy-assets.ts`가 동기화 스크립트를 주입). 슬라이드 쪽에 별도 작업은 필요 없고, 슬라이드 자체 테마 토글(`t` 키)은 그 화면에서만 유효하다.
```

- [ ] **Step 2: 이전 설계 문서에 교차 참조를 남긴다**

`docs/superpowers/specs/2026-07-26-slides-embed-design.md`의 **`### 3. 자산 복사`** 절 끝에 한 줄 추가한다. 그 문서는 복사가 원본을 그대로 옮기는 것처럼 서술하고 있는데, 이제 슬라이드는 내용이 바뀌므로 그 사실을 남겨야 한다.

```markdown
> **갱신 (2026-07-26)**: 슬라이드는 이제 복사 시 테마 동기화 스크립트가 주입되어 배포본이 원본과 동일하지 않다. 원본은 여전히 자기완결형으로 유지된다. `2026-07-26-slides-theme-sync-design.md` 참조.
```

절의 정확한 위치와 끝나는 지점은 파일을 읽어 확인하라.

- [ ] **Step 3: 인코딩 확인**

```bash
file -I CLAUDE.md docs/superpowers/specs/2026-07-26-slides-embed-design.md
```

Expected: 둘 다 `charset=utf-8`

- [ ] **Step 4: 커밋**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-07-26-slides-embed-design.md
git commit -m "docs: 슬라이드 테마 동기화를 규약과 이전 설계 문서에 반영

* CLAUDE.md — 배포 슬라이드가 블로그 테마를 자동으로 따른다는 안내
* 이전 설계 문서의 '배포본 == 원본 바이트 동일' 검증 항목 정정

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 완료 조건

- [ ] `storage` 이벤트가 iframe에 전달됨을 실측으로 확인 (Task 1)
- [ ] 배포본에 주입 블록 존재, 원본에는 없음, 주입분 제외 시 원본과 동일
- [ ] `npm run check` 통과, `npm run build` 성공
- [ ] 블로그 라이트/다크에 임베드가 각각 일치
- [ ] 글에서 토글 시 임베드가 새로고침 없이 즉시 반영 (스파크라인 포함)
- [ ] 새 탭으로 열어도 블로그와 같은 테마
- [ ] 슬라이드 내 토글은 그 화면만 바꾸고, 다시 열면 블로그 기준으로 복귀
- [ ] PR 생성 (`gh pr create` + HEREDOC, 리뷰어 지정 없이)
