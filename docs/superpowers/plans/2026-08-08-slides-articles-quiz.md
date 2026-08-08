# 슬라이드 보유 글 퀴즈 추가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 슬라이드가 있으나 퀴즈가 없는 글 5편(한/영 10파일)에 인터랙티브 퀴즈를 추가한다.

**Architecture:** 퀴즈 인프라(파서 `lib/quiz.ts`, UI `components/article/quiz.tsx`, portal 연결)는 이미 구축·검증되어 있다. 이번 작업은 순수 콘텐츠 작성이다 — 각 글의 정리/마무리 직전에 `# N. 퀴즈` 절과 ` ```quiz ` 블록을 넣고 뒤 섹션 번호를 한 칸씩 민다.

**Tech Stack:** 마크다운 + YAML 퀴즈 펜스. 검증은 `parseQuiz`(tsx 스크립트), `npm run check`, `npm run build`, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-08-slides-articles-quiz-design.md`

---

## 시작 전 필독

**브랜치**: `docs/slides-articles-quiz` (이미 존재, 스펙 커밋 `69fc0b0`)

**퀴즈 작성 형식** — `CLAUDE.md`의 "퀴즈 (선택)" 절이 정본이고, 표본은 `contents/go/go-fx-의존성-주입/index.md`의 5장이다. 요약하면:

````markdown
```quiz
- type: mcq
  q: "질문"
  choices: ["보기1", "보기2", "보기3", "보기4"]
  answer: 1
  explain: "해설 (N.N절)"

- type: ox
  q: "명제"
  answer: false
  explain: "해설"

- type: code
  q: "이 코드를 실행하면?"
  lang: go
  code: |
    ch := make(chan int)
    ch <- 1
  choices: ["보기1", "보기2", "보기3", "보기4"]
  answer: 2
  explain: "해설"

- type: blank
  q: "빈칸이 ___ 인 문장"
  answer: ["허용답1", "허용답2"]
  explain: "해설"
```
````

**품질 규칙 (지난 작업 리뷰에서 Critical/Important로 잡혔던 것들 — 처음부터 지켜라):**
- **정답 위치 분산.** mcq/code 정답이 한 인덱스에 쏠리면 같은 버튼만 눌러 만점이 나온다. 한 인덱스가 전체의 절반을 넘지 않게
- **보기 길이 균형.** 같은 문항의 보기들이 ±20자 밴드 안에. 정답만 설명형으로 길면 길이만으로 티 난다
- mcq는 4지선다 통일. 오답은 본문을 대충 읽으면 고를 만한 혼동으로, 단 **본문 어딘가에서 참인 서술을 오답으로 배치 금지**
- `explain` 전 유형 필수, 절 참조 포함
- **본문에 근거가 있는 것만 묻는다. 새 기술적 사실을 지어내지 않는다**
- 한/영 문항 수·유형 순서·정답 인덱스 동일

**환경 주의**: 이 저장소의 `npm run dev`는 동적 slug 라우트에서 500이 난다(Turbopack dev + `output: export`, 기존 문제). **페이지 확인은 반드시 `npm run build` + `npx serve out -l 3000`으로 한다.**

**스크래치 디렉토리**: `/private/tmp/claude-501/-Users-frankoh-src-workspace-blog/5210adcd-b16b-45ce-accb-184543c13a0d/scratchpad/` — 검증 스크립트는 여기 만든다. **저장소 안에 남기지 마라.**

## 공용 검증 스크립트

Task 1에서 만들어 두고 이후 태스크에서 경로만 바꿔 재사용한다. 스크래치에 `verify-quiz.ts`로 저장:

```typescript
import { parseQuiz } from './lib/quiz';
import fs from 'node:fs';

const dir = process.argv[2];
if (!dir) throw new Error('사용법: npx tsx verify-quiz.ts <글 디렉토리>');

const results: Record<string, ReturnType<typeof parseQuiz>> = {};

for (const file of ['index.md', 'index_en.md']) {
  const path = `${dir}/${file}`;
  const md = fs.readFileSync(path, 'utf-8');
  const m = md.match(/```quiz\n([\s\S]*?)```/);
  if (!m) throw new Error(`${file}: quiz 블록 없음`);
  const qs = parseQuiz(m[1]);
  results[file] = qs;

  console.log(`\n[${file}] ${qs.length}문항`);
  console.log('  유형:', qs.map((q) => q.type).join(','));
  console.log(
    '  정답:',
    qs.map((q) => (q.type === 'blank' ? `[${q.answer.join('|')}]` : String(q.answer))).join(' ')
  );
  qs.forEach((q, i) => {
    if (q.type === 'mcq' || q.type === 'code') {
      const lens = q.choices.map((c) => c.length);
      const band = Math.max(...lens) - Math.min(...lens);
      console.log(`  Q${i + 1} 보기길이 [${lens.join(',')}] band=${band}${band > 20 ? '  ← 초과!' : ''}`);
    }
  });
  const idx = qs.filter((q) => q.type === 'mcq' || q.type === 'code').map((q) => q.answer as number);
  const dist: Record<number, number> = {};
  idx.forEach((i) => (dist[i] = (dist[i] || 0) + 1));
  console.log('  정답 인덱스 분포:', JSON.stringify(dist), `(총 ${idx.length}문항)`);
}

const [ko, en] = [results['index.md'], results['index_en.md']];
if (ko.length !== en.length) throw new Error(`문항 수 불일치: ko=${ko.length} en=${en.length}`);
ko.forEach((q, i) => {
  if (q.type !== en[i].type) throw new Error(`Q${i + 1} 유형 불일치: ko=${q.type} en=${en[i].type}`);
  if (q.type !== 'blank' && String(q.answer) !== String(en[i].answer)) {
    throw new Error(`Q${i + 1} 정답 불일치: ko=${q.answer} en=${en[i].answer}`);
  }
});
console.log('\n✅ ko/en 문항 수·유형·정답 일치');
```

실행: `npx tsx <스크래치>/verify-quiz.ts "<글 디렉토리>"`

## File Structure

| 파일 | 작업 |
|------|------|
| `contents/go/golang-concurrency-1-goroutine-기초/{index.md, index_en.md}` | 퀴즈 절 삽입 + 뒤 섹션 번호 +1 |
| `contents/go/golang-concurrency-2-channel-완전-정복/{index.md, index_en.md}` | 동일 |
| `contents/go/golang-concurrency-3-select와-channel-심화/{index.md, index_en.md}` | 동일 |
| `contents/go/golang-generics-1-개요와-기본-문법/{index.md, index_en.md}` | 동일 |
| `contents/ros/urdf를-이용한-로봇-모델링/{index.md, index_en.md}` | 동일 |

코드·컴포넌트·설정 파일은 건드리지 않는다.

---

## Task 1: golang-concurrency-1 (goroutine 기초)

**Files:**
- Modify: `contents/go/golang-concurrency-1-goroutine-기초/index.md`
- Modify: `contents/go/golang-concurrency-1-goroutine-기초/index_en.md`

**목표 문항 수:** 10 (본문 485줄)

**⚠️ 이 글만 한/영 섹션 번호가 다르다.** 한국어에만 `1. 들어가며`가 있어 이후가 하나씩 밀려 있다.

| 언어 | 삽입 위치 | 재조정 |
|------|----------|--------|
| KO | `# 8. Goroutine Leak` 절 끝, `# 9. 정리` 앞 | `# 9. 퀴즈` 신설 → 기존 `9. 정리`→`10. 정리`, `10. 참고`→`11. 참고` |
| EN | `# 7. Goroutine Leak` 절 끝, `# 8. Summary` 앞 | `# 8. Quiz` 신설 → 기존 `8. Summary`→`9. Summary`, `9. References`→`10. References` |

**본문이 다루는 것 (출제 범위):** Concurrency vs Parallelism 구분, Go가 동시성에 강한 이유, 언제 동시성을 쓰는가, goroutine 기초(`go` 키워드, 스택 크기, main 종료 시 동작, WaitGroup), 다른 언어(OS 스레드)와의 비교, GMP 스케줄링 개념, goroutine leak(원인과 방지).

- [ ] **Step 1: 본문 읽기**

```bash
cd /Users/frankoh/src/workspace_blog/blog-v2.advenoh.pe.kr
```

`index.md` 전체를 읽어라. 특히 5·7·8장(goroutine 기초, 스케줄링, leak)이 문항의 주 재료다. 영문판도 대응 절을 읽어 용어를 맞춘다.

- [ ] **Step 2: 한국어 퀴즈 절 작성**

`# 9. 정리` 바로 앞에 아래 형태로 삽입한다. 안내문은 기존 퀴즈 글과 동일한 문장을 쓴다.

````markdown
# 9. 퀴즈

여기까지 읽었으면 풀 수 있는 문제들이다. 답을 고르면 바로 해설이 나온다.

```quiz
(10문항 — mcq/ox/code/blank 혼합)
```

````

문항 구성 지침(이 글의 소재에 맞춘 배분 예시이고, 본문을 읽고 조정해도 된다):
- `code` 2문항 — goroutine을 띄우고 main이 먼저 끝나는 코드, WaitGroup을 빠뜨린 코드 등 본문에 있는 패턴
- `ox` 2문항 — "goroutine은 OS 스레드와 1:1로 매핑된다"(X) 같은 개념 확인
- `blank` 2문항 — goroutine 초기 스택 크기, 대기용 API 이름 등 본문에 명시된 값·이름
- `mcq` 4문항 — concurrency/parallelism 구분, 스케줄링 개념, leak 원인, 언제 쓰는가

- [ ] **Step 3: 한국어 섹션 번호 재조정**

`# 9. 정리` → `# 10. 정리`, `# 10. 참고` → `# 11. 참고`로 바꾼다.

- [ ] **Step 4: 영문 퀴즈 절 작성과 번호 재조정**

`# 8. Summary` 앞에 `# 8. Quiz`를 넣고, 한국어와 **같은 문항 수·유형 순서·정답 인덱스**로 작성한다. `explain`의 절 참조는 **영문 파일의 번호**를 쓴다. 이어서 `# 8. Summary` → `# 9. Summary`, `# 9. References` → `# 10. References`.

- [ ] **Step 5: 검증**

```bash
npx tsx <스크래치>/verify-quiz.ts "contents/go/golang-concurrency-1-goroutine-기초"
```

Expected: 두 파일 10문항, 유형·정답 일치, 모든 band ≤20, 정답 인덱스 분포가 한 값에 쏠리지 않음, 마지막 줄 `✅ ko/en 문항 수·유형·정답 일치`

```bash
grep -E "^# [0-9]" "contents/go/golang-concurrency-1-goroutine-기초/index.md" | tail -4
grep -E "^# [0-9]" "contents/go/golang-concurrency-1-goroutine-기초/index_en.md" | tail -4
```

Expected KO: `8. Goroutine Leak` / `9. 퀴즈` / `10. 정리` / `11. 참고`
Expected EN: `7. Goroutine Leak` / `8. Quiz` / `9. Summary` / `10. References`

- [ ] **Step 6: 커밋**

```bash
git add "contents/go/golang-concurrency-1-goroutine-기초/"
git commit -m "docs: goroutine 기초 글에 퀴즈 추가

* 4유형 혼합 10문항 (한/영)
* 퀴즈 절 삽입에 따라 뒤 섹션 번호 재조정"
```

---

## Task 2: golang-concurrency-2 (channel 완전 정복)

**Files:**
- Modify: `contents/go/golang-concurrency-2-channel-완전-정복/index.md`
- Modify: `contents/go/golang-concurrency-2-channel-완전-정복/index_en.md`

**목표 문항 수:** 10 (본문 445줄)

한/영 섹션 번호가 동일하다.

| 언어 | 삽입 위치 | 재조정 |
|------|----------|--------|
| KO | `# 8. 실습: Producer / Consumer 패턴` 끝, `# 9. 정리` 앞 | `# 9. 퀴즈` → `10. 정리`, `11. FAQ`, `12. 참고` |
| EN | `# 8. Practice: Producer / Consumer Pattern` 끝, `# 9. Summary` 앞 | `# 9. Quiz` → `10. Summary`, `11. FAQ`, `12. References` |

**본문이 다루는 것:** Channel 개념과 생성, Send/Receive 동작, Blocking 동작, Unbuffered vs Buffered, Channel 방향 제한(`chan<-`, `<-chan`), Channel Close와 `v, ok := <-ch`, `range` over channel, Producer/Consumer 실습.

- [ ] **Step 1: 본문 읽기** — 한/영 모두. 3·4·6장(blocking, buffered, close)이 주 재료다.

- [ ] **Step 2: 한국어 퀴즈 절 작성**

`# 9. 정리` 앞에 `# 9. 퀴즈` + 안내문 + ` ```quiz ` 블록(10문항).

배분 예시:
- `code` 3문항 — unbuffered 채널에 send만 하는 데드락 코드, closed 채널 수신, `range` 종료 조건
- `ox` 2문항 — "닫힌 채널에서 수신하면 panic이 난다"(X, 제로값+ok=false) 등
- `blank` 2문항 — 방향 제한 표기, close 후 수신 시 두 번째 반환값 이름
- `mcq` 3문항 — buffered vs unbuffered 차이, close 규칙(누가 닫나), blocking 조건

- [ ] **Step 3: 한국어 번호 재조정** — `9.정리`→`10.정리`, `10.FAQ`→`11.FAQ`, `11.참고`→`12.참고`

- [ ] **Step 4: 영문 작성과 번호 재조정** — `# 9. Quiz` 삽입, 한국어와 동일 구성. `9.Summary`→`10.Summary`, `10.FAQ`→`11.FAQ`, `11.References`→`12.References`

- [ ] **Step 5: 검증**

```bash
npx tsx <스크래치>/verify-quiz.ts "contents/go/golang-concurrency-2-channel-완전-정복"
grep -E "^# [0-9]" "contents/go/golang-concurrency-2-channel-완전-정복/index.md" | tail -4
grep -E "^# [0-9]" "contents/go/golang-concurrency-2-channel-완전-정복/index_en.md" | tail -4
```

Expected KO: `8. 실습...` / `9. 퀴즈` / `10. 정리` / `11. FAQ` / `12. 참고` (tail -5로 확인해도 좋다)
Expected EN: 대응 영문 제목으로 같은 번호

- [ ] **Step 6: 커밋**

```bash
git add "contents/go/golang-concurrency-2-channel-완전-정복/"
git commit -m "docs: channel 완전 정복 글에 퀴즈 추가

* 4유형 혼합 10문항 (한/영)
* 퀴즈 절 삽입에 따라 뒤 섹션 번호 재조정"
```

---

## Task 3: golang-concurrency-3 (select와 channel 심화)

**Files:**
- Modify: `contents/go/golang-concurrency-3-select와-channel-심화/index.md`
- Modify: `contents/go/golang-concurrency-3-select와-channel-심화/index_en.md`

**목표 문항 수:** 8~10 (본문 350줄 — 무리해서 10을 채우지 말고 본문이 감당하는 만큼)

한/영 섹션 번호가 동일하다.

| 언어 | 삽입 위치 | 재조정 |
|------|----------|--------|
| KO | `# 5. Nil Channel 트릭` 끝, `# 6. 마무리` 앞 | `# 6. 퀴즈` → `7. 마무리`, `8. 참고` |
| EN | `# 5. The Nil Channel Trick` 끝, `# 6. Wrapping Up` 앞 | `# 6. Quiz` → `7. Wrapping Up`, `8. References` |

**본문이 다루는 것:** `select` 기본(여러 채널 대기, 준비된 것이 여럿일 때 무작위 선택), `default` case(논블로킹), `time.After`를 쓴 타임아웃, Fan-in/Fan-out 패턴, nil channel 트릭(select에서 특정 케이스 비활성화).

- [ ] **Step 1: 본문 읽기** — 한/영 모두.

- [ ] **Step 2: 한국어 퀴즈 절 작성**

`# 6. 마무리` 앞에 `# 6. 퀴즈` + 안내문 + ` ```quiz ` 블록.

배분 예시(8문항 기준):
- `code` 2문항 — `default`가 있는 select의 논블로킹 동작, nil channel이 포함된 select
- `ox` 2문항 — "select에서 준비된 케이스가 여럿이면 위에서부터 순서대로 고른다"(X, 무작위) 등
- `blank` 1~2문항 — 타임아웃에 쓰는 함수 이름 등
- `mcq` 3~4문항 — default의 효과, fan-in/fan-out 구분, nil channel 트릭의 쓸모

- [ ] **Step 3: 한국어 번호 재조정** — `6.마무리`→`7.마무리`, `7.참고`→`8.참고`

- [ ] **Step 4: 영문 작성과 번호 재조정** — `# 6. Quiz` 삽입, `6.Wrapping Up`→`7.Wrapping Up`, `7.References`→`8.References`

- [ ] **Step 5: 검증**

```bash
npx tsx <스크래치>/verify-quiz.ts "contents/go/golang-concurrency-3-select와-channel-심화"
grep -E "^# [0-9]" "contents/go/golang-concurrency-3-select와-channel-심화/index.md" | tail -3
grep -E "^# [0-9]" "contents/go/golang-concurrency-3-select와-channel-심화/index_en.md" | tail -3
```

Expected KO: `6. 퀴즈` / `7. 마무리` / `8. 참고`
Expected EN: `6. Quiz` / `7. Wrapping Up` / `8. References`

- [ ] **Step 6: 커밋**

```bash
git add "contents/go/golang-concurrency-3-select와-channel-심화/"
git commit -m "docs: select와 channel 심화 글에 퀴즈 추가

* 4유형 혼합 문항 (한/영 동수)
* 퀴즈 절 삽입에 따라 뒤 섹션 번호 재조정"
```

---

## Task 4: golang-generics-1 (개요와 기본 문법)

**Files:**
- Modify: `contents/go/golang-generics-1-개요와-기본-문법/index.md`
- Modify: `contents/go/golang-generics-1-개요와-기본-문법/index_en.md`

**목표 문항 수:** 8~10 (본문 346줄)

한/영 섹션 번호가 동일하다.

| 언어 | 삽입 위치 | 재조정 |
|------|----------|--------|
| KO | `# 5. 타입 추론 (Type Inference)` 끝, `# 6. 마무리` 앞 | `# 6. 퀴즈` → `7. 마무리`, `8. FAQ`, `9. 참고` |
| EN | `# 5. Type Inference` 끝, `# 6. Wrapping Up` 앞 | `# 6. Quiz` → `7. Wrapping Up`, `8. FAQ`, `9. References` |

**본문이 다루는 것:** Generics란 무엇인가, Go에 도입된 배경, 도입 전 한계(`interface{}` + 타입 단언, 중복 함수), 기본 문법(타입 파라미터 `[T any]`, 제약, `comparable`), 타입 추론.

- [ ] **Step 1: 본문 읽기** — 한/영 모두. 3·4·5장이 주 재료다.

- [ ] **Step 2: 한국어 퀴즈 절 작성**

`# 6. 마무리` 앞에 `# 6. 퀴즈` + 안내문 + ` ```quiz ` 블록.

배분 예시(8문항 기준):
- `code` 2문항 — 타입 파라미터를 쓴 함수 시그니처, 타입 추론이 되는/안 되는 호출
- `ox` 2문항 — "generics를 쓰면 런타임에 타입 단언이 필요하다"(X) 등
- `blank` 1~2문항 — 아무 타입이나 받는 제약 이름(`any`), 비교 가능 타입 제약 이름(`comparable`)
- `mcq` 3~4문항 — 도입 전 한계, 제약의 의미, 타입 추론 규칙

- [ ] **Step 3: 한국어 번호 재조정** — `6.마무리`→`7.마무리`, `7.FAQ`→`8.FAQ`, `8.참고`→`9.참고`

- [ ] **Step 4: 영문 작성과 번호 재조정** — `# 6. Quiz` 삽입, `6.Wrapping Up`→`7.Wrapping Up`, `7.FAQ`→`8.FAQ`, `8.References`→`9.References`

- [ ] **Step 5: 검증**

```bash
npx tsx <스크래치>/verify-quiz.ts "contents/go/golang-generics-1-개요와-기본-문법"
grep -E "^# [0-9]" "contents/go/golang-generics-1-개요와-기본-문법/index.md" | tail -4
grep -E "^# [0-9]" "contents/go/golang-generics-1-개요와-기본-문법/index_en.md" | tail -4
```

Expected KO: `6. 퀴즈` / `7. 마무리` / `8. FAQ` / `9. 참고`
Expected EN: `6. Quiz` / `7. Wrapping Up` / `8. FAQ` / `9. References`

- [ ] **Step 6: 커밋**

```bash
git add "contents/go/golang-generics-1-개요와-기본-문법/"
git commit -m "docs: generics 개요와 기본 문법 글에 퀴즈 추가

* 4유형 혼합 문항 (한/영 동수)
* 퀴즈 절 삽입에 따라 뒤 섹션 번호 재조정"
```

---

## Task 5: urdf (로봇 모델링)

**Files:**
- Modify: `contents/ros/urdf를-이용한-로봇-모델링/index.md`
- Modify: `contents/ros/urdf를-이용한-로봇-모델링/index_en.md`

**목표 문항 수:** 10 (본문 750줄)

한/영 섹션 번호가 동일하다. **이 글은 정리/마무리 절이 없어** 마지막 본문 절(6.도구) 다음, FAQ 앞에 넣는다.

| 언어 | 삽입 위치 | 재조정 |
|------|----------|--------|
| KO | `# 6. URDF 작성시 필요한 도구` 끝, `# 7. FAQ` 앞 | `# 7. 퀴즈` → `8. FAQ`, `9. 다음 스터디 주제`, `10. 참고` |
| EN | `# 6. Tools Needed When Writing URDF` 끝, `# 7. FAQ` 앞 | `# 7. Quiz` → `8. FAQ`, `9. Next Study Topics`, `10. References` |

**본문이 다루는 것:** URDF가 무엇인지, 모델링 대상 로봇(매니퓰레이터) 정보, description 패키지 생성, URDF 작성(link/joint 태그, joint 타입, origin·axis·limit 등 속성), 런치 파일 생성과 실행, 작성 도구(`check_urdf`, `urdf_to_graphiz`, RViz 등).

**⚠️ 도메인 주의:** ROS/로봇 도메인이라 Go 글들과 성격이 다르다. **본문이 실제로 다루는 범위 안에서만 출제하라.** ROS 일반 지식이나 본문에 없는 URDF 스펙 세부를 묻지 마라. `code` 유형은 Go 코드가 아니라 **XML(URDF) 조각**을 쓰고 `lang: xml`로 표기한다.

- [ ] **Step 1: 본문 읽기** — 한/영 모두. 1·4·6장(URDF 개념, 작성, 도구)이 주 재료다.

- [ ] **Step 2: 한국어 퀴즈 절 작성**

`# 7. FAQ` 앞에 `# 7. 퀴즈` + 안내문 + ` ```quiz ` 블록(10문항).

배분 예시:
- `code` 2문항 — `lang: xml`로 link/joint 태그 조각을 주고 무엇을 정의하는지, 빠진 속성이 무엇인지
- `ox` 2문항 — 본문에 명시된 사실 기반 명제
- `blank` 2문항 — 로봇의 강체를 나타내는 태그 이름(`link`), 연결부 태그 이름(`joint`), 검증 도구 이름 등 본문에 나온 것
- `mcq` 4문항 — URDF의 용도, joint 타입 구분, 런치 파일 역할, 도구의 쓰임

- [ ] **Step 3: 한국어 번호 재조정** — `7.FAQ`→`8.FAQ`, `8.다음 스터디 주제`→`9.다음 스터디 주제`, `9.참고`→`10.참고`

- [ ] **Step 4: 영문 작성과 번호 재조정** — `# 7. Quiz` 삽입, `7.FAQ`→`8.FAQ`, `8.Next Study Topics`→`9.Next Study Topics`, `9.References`→`10.References`

- [ ] **Step 5: 검증**

```bash
npx tsx <스크래치>/verify-quiz.ts "contents/ros/urdf를-이용한-로봇-모델링"
grep -E "^# [0-9]" "contents/ros/urdf를-이용한-로봇-모델링/index.md" | tail -4
grep -E "^# [0-9]" "contents/ros/urdf를-이용한-로봇-모델링/index_en.md" | tail -4
```

Expected KO: `7. 퀴즈` / `8. FAQ` / `9. 다음 스터디 주제` / `10. 참고`
Expected EN: `7. Quiz` / `8. FAQ` / `9. Next Study Topics` / `10. References`

- [ ] **Step 6: 커밋**

```bash
git add "contents/ros/urdf를-이용한-로봇-모델링/"
git commit -m "docs: URDF 로봇 모델링 글에 퀴즈 추가

* 4유형 혼합 10문항 (한/영), code 유형은 XML 조각 사용
* 퀴즈 절 삽입에 따라 뒤 섹션 번호 재조정"
```

---

## Task 6: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 파싱 재검증**

```bash
for d in \
  "contents/go/golang-concurrency-1-goroutine-기초" \
  "contents/go/golang-concurrency-2-channel-완전-정복" \
  "contents/go/golang-concurrency-3-select와-channel-심화" \
  "contents/go/golang-generics-1-개요와-기본-문법" \
  "contents/ros/urdf를-이용한-로봇-모델링"; do
  echo "########## $d"
  npx tsx <스크래치>/verify-quiz.ts "$d"
done
```

Expected: 5개 글 모두 ko/en 일치, band 초과 없음, 정답 분포가 한 값에 쏠리지 않음

- [ ] **Step 2: 빌드**

```bash
npm run check
npm run build
```

Expected: 둘 다 성공

- [ ] **Step 3: 산출물 확인**

```bash
# 10개 페이지에 퀴즈 코드 블록이 있는지 (클라이언트 교체 전 상태)
for p in \
  "out/golang-concurrency-1-goroutine-기초/index.html" \
  "out/en/golang-concurrency-1-goroutine-기초/index.html" \
  "out/golang-concurrency-2-channel-완전-정복/index.html" \
  "out/en/golang-concurrency-2-channel-완전-정복/index.html" \
  "out/golang-concurrency-3-select와-channel-심화/index.html" \
  "out/en/golang-concurrency-3-select와-channel-심화/index.html" \
  "out/golang-generics-1-개요와-기본-문법/index.html" \
  "out/en/golang-generics-1-개요와-기본-문법/index.html" \
  "out/urdf를-이용한-로봇-모델링/index.html" \
  "out/en/urdf를-이용한-로봇-모델링/index.html"; do
  printf "%-70s %s\n" "$(basename $(dirname $p))" "$(grep -c 'language-quiz' "$p")"
done

# 검색 인덱스·RSS에 퀴즈 YAML이 없는지 (기존 필터로 자동 충족 — 확인만)
grep -c "type: mcq" out/search-index.json || echo "OK: 인덱스 깨끗"
grep -c "explain:" public/rss.xml || echo "OK: RSS 깨끗"
```

Expected: 10개 페이지 모두 1 이상, 아래 둘은 `OK: ...`

- [ ] **Step 4: 브라우저 확인**

```bash
npx serve out -l 3000
```

Playwright MCP로 아래 5개 한국어 페이지와 대응 영문 페이지를 열어 퀴즈 렌더(원본 YAML 노출 없음)와 판정 동작을 확인한다:
- `/golang-concurrency-1-goroutine-기초/`, `/en/golang-concurrency-1-goroutine-기초/`
- `/golang-concurrency-2-channel-완전-정복/`, `/en/...`
- `/golang-concurrency-3-select와-channel-심화/`, `/en/...`
- `/golang-generics-1-개요와-기본-문법/`, `/en/...`
- `/urdf를-이용한-로봇-모델링/`, `/en/...`

각 페이지에서 최소 한 문항을 클릭해 판정과 해설이 나오는지 확인하고, 한국어 1편은 끝까지 풀어 점수 카드까지 본다. 스크린샷을 남긴다. 확인 후 serve 종료.

- [ ] **Step 5: 목차 확인**

브라우저에서 아무 글이나 열어 우측 목차(TOC)에 새 퀴즈 절이 올바른 번호로 나타나는지 확인한다. 목차는 헤딩에서 자동 생성되므로 코드 변경은 없지만 실제로 반영됐는지 눈으로 본다.

---

## Task 7: PR 생성

**Files:** 없음

- [ ] **Step 1: push와 PR 생성**

```bash
git push -u origin docs/slides-articles-quiz
gh pr create --assignee kenshin579 --base main --title "docs: 슬라이드 보유 글 5편에 퀴즈 추가" --body "$(cat <<'EOF'
## 배경

`/slides` 목록에 오르는 글 7편 중 퀴즈가 있는 건 2편(go-fx, grafana)뿐이었습니다. 나머지 5편에 퀴즈를 추가합니다. 슬라이드가 붙을 만큼 학습 분량이 있는 글이라 퀴즈의 값어치가 큽니다.

퀴즈 인프라는 이미 구축되어 있어 이번 작업은 콘텐츠 작성입니다.

## 변경 사항

한/영 각각에 4유형(mcq/ox/code/blank) 혼합 퀴즈를 추가하고, 퀴즈 절 삽입에 따라 뒤 섹션 번호를 재조정했습니다.

| 글 | 문항 수 |
|----|--------|
| golang-concurrency-1 goroutine 기초 | 10 |
| golang-concurrency-2 channel 완전 정복 | 10 |
| golang-concurrency-3 select와 channel 심화 | (실제 수) |
| golang-generics-1 개요와 기본 문법 | (실제 수) |
| urdf 로봇 모델링 | 10 |

`concurrency-1`은 한국어에만 `1. 들어가며`가 있어 한/영 섹션 번호가 원래부터 어긋나 있었습니다. 각 파일의 실제 번호에 맞춰 재조정했고, 해설의 절 참조도 해당 언어 기준으로 적었습니다.

## 검증

- [x] 5편 모두 ko/en 문항 수·유형 순서·정답 인덱스 일치
- [x] mcq 보기 길이 밴드 ≤20, 정답 인덱스 분포 쏠림 없음
- [x] 섹션 번호 재조정 확인 (한/영)
- [x] `npm run check` / `npm run build` 통과
- [x] 10개 페이지에서 퀴즈 렌더·판정 동작 (Playwright)
- [x] 목차에 퀴즈 절 반영
- [ ] Netlify deploy preview 확인

## 다음 작업

퀴즈가 있는 글을 모아 보는 `/quiz` 목록 페이지와 헤더 메뉴는 별도 PR로 진행합니다. 이 PR이 머지되면 대상 글이 7편이 되어 목록이 채워진 상태로 검증할 수 있습니다.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01ECYScWgZhRSGEbKvWr8Yt4
EOF
)"
```

PR 본문의 "(실제 수)"는 Task 3·4에서 확정된 문항 수로 채운다.

Expected: PR URL 출력
