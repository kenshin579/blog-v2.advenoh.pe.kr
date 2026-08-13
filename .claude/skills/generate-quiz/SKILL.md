---
name: generate-quiz
description: Use when adding an interactive quiz section to a blog article (contents/{category}/{slug}/index.md), and mirroring it into the English counterpart index_en.md
---

# Generate Interactive Quiz (quiz block)

## Overview

이 블로그는 글 본문에 ` ```quiz ` 코드펜스로 인터랙티브 퀴즈를 넣을 수 있다. YAML로 문항을 적으면 클라이언트에서 퀴즈 UI로 렌더되고, 보기를 고르면 즉시 판정·해설이 나오며 세트 단위로 점수가 집계된다.

이 스킬은 글 하나를 받아 **퀴즈 세트를 설계 → 배치 → 검증**까지 한다.

핵심 원칙: **본문에 근거가 있는 것만 묻고, 정답이 화면에 새지 않게 한다.** 퀴즈 UI는 한 세트의 전 문항을 한 화면에 동시에 렌더하는데, 작성자는 문항을 하나씩 쓰기 때문에 이 정답 노출 결함은 눈으로 잘 안 잡힌다 — 실제로 5편 작업에서 4편에 나왔다.

**문항을 쓰기 전에 반드시 `references/quiz-rules.md`를 읽는다.** 형식·품질·정답 노출·배치·검사 코드표가 전부 거기 있다. 이 문서는 그 규칙을 반복하지 않고 절차만 안내한다.

## When to Use

- 특정 글에 퀴즈를 새로 넣을 때
- 이미 quiz 블록이 있으면 덮어쓰기 전에 사용자에게 확인한다

## 대상 지정

- **단일 글**: slug(`go/go-fx-의존성-주입`) 또는 `index.md` 경로
- 한 번에 **한 글만** 처리한다. 10문항을 본문 근거를 찾아 설계하는 작업이라, 배치로 돌리면 뒤쪽 글의 문항이 뻔해진다
- **언어**: 한국어 `index.md`를 먼저 쓴다. 같은 폴더에 `index_en.md`가 **이미 있을 때만** 영문 세트를 만든다 — 없으면 만들지 않는다

## Procedure

### 1. 규칙을 읽는다

`references/quiz-rules.md`를 전부 읽는다. 특히 4절(정답 노출)은 이 작업에서 가장 자주 걸리는 결함이므로 반드시 숙지한다.

### 2. 글을 정독하고 근거를 모은다

`index.md`를 절(`##`)별로 읽으며 문항 후보를 뽑는다. **본문에 근거가 없는 건 배제한다** — 일반적으로 맞는 사실이어도 그 글에 없으면 쓰지 않는다. 근거 절 번호를 후보마다 메모해 둔다(나중에 `explain`과 보고에 쓴다).

### 3. 세트를 설계한다

10문항을 기본으로, 유형은 mcq 4 / ox 2 / code 2 / blank 2 정도로 섞는다. 유형 순서를 기계적으로 반복하지 않는다(`mcq→code→ox→blank` 사이클 같은 것). mcq·code 정답 인덱스를 0~3에 고르게 분산시키고, blank 정답 후보에서 흔한 토큰(`any`, `struct` 같은)을 먼저 배제한다. 세부 기준은 `references/quiz-rules.md` 1~3절.

### 4. 배치 위치를 정한다

본문 마지막 장 다음, 마무리·정리·FAQ·참고 앞에 `# N. 퀴즈` H1을 신설한다. 뒤에 있던 장 번호가 하나씩 밀리므로, 번호 매기기는 `content-heading-style` 스킬의 규칙을 따른다.

### 5. 밀린 장 번호 참조를 확인한다

퀴즈 장을 끼워 넣으며 밀린 번호를 본문 다른 곳에서 가리키는 문장이 있는지 확인한다("X장에서 다룬" 같은 표현). 한국어판과 영문판의 섹션 번호가 다를 수 있으므로 파일별로 따로 본다.

### 6. 작성하고 저장한다

`index.md`에 quiz 블록을 써 넣고 저장한다. `file -I contents/{category}/{slug}/index.md`로 UTF-8인지 확인한다.

### 7. 검증한다

```bash
npm run check:quiz -- {category}/{slug}
```

**에러(E1~E9)가 0이 될 때까지 고친다.** 경고(W1~W5)는 하나씩 판단해서 고치거나 남기고, 남긴다면 이유를 9단계 보고에 적는다.

스크립트가 못 잡는 것 네 가지는 직접 확인한다(`references/quiz-rules.md` 6절 "스크립트가 못 잡는 것"에 정리):
- `code` 스니펫이 실제로 컴파일되는지 (Go는 미사용 변수가 컴파일 에러 — 의도한 에러만 나야 한다)
- 밀린 장 번호를 가리키는 참조 (5단계에서 이미 봤다면 재확인)
- 의미상 정답 노출 (문자열은 다르지만 뜻이 같은 노출, 예: `대괄호` ↔ `[T any]`)
- 유형별(mcq만, code만) 정답 인덱스 쏠림 — W1은 mcq+code 합산만 본다

### 8. 영문판

`index_en.md`가 **있으면** 같은 문항 수·유형·정답 인덱스로 작성하고 다시 `npm run check:quiz -- {category}/{slug}`로 검증한다. 영문 blank 정답이 흔한 영어 단어와 겹치는지 따로 본다 — 비교가 대소문자 무시라, 지문의 전치사 `after`가 허용 답 `After`와 매칭된 사례가 있다(`references/quiz-rules.md` 4절).

`index_en.md`가 **없으면** 한국어만 작성하고 끝낸다. "영문판 없음, 필요하면 `translate-article-en` 스킬"을 보고에 적는다. 퀴즈만 든 `index_en.md`를 새로 만들지 않는다.

### 9. 보고한다

다음을 보고한다.
- 문항 표: 번호·유형·근거 절·정답
- `check:quiz` 결과: 에러 수·경고 수와 내용(남긴 경고는 이유 포함)
- 영문판 처리 결과: 작성했는지, 없어서 건너뛰었는지

## 참고

- 규칙 전체: `references/quiz-rules.md`
- 검증 스크립트: `scripts/check-quiz.ts` (`npm run check:quiz`)
- 실제 예시: `contents/go/golang-generics-1-개요와-기본-문법/index.md`의 6장 — `check:quiz` 에러·경고 0으로 통과한다
