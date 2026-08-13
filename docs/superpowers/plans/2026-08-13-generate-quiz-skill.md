# generate-quiz skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 글에 퀴즈 세트를 추가하는 작업을 `generate-quiz` skill로 고정하고, 정답 노출 같은 반복 결함을 `npm run check:quiz`로 검출한다.

**Architecture:** 절차는 `.claude/skills/generate-quiz/SKILL.md`, 규칙은 같은 폴더의 `references/quiz-rules.md`, 검증은 프로젝트 스크립트 `scripts/check-quiz.ts`에 둔다. 검증 스크립트는 `lib/quiz.ts`의 `parseQuiz`와 `normalizeBlankAnswer`를 import해서, 정답 노출 검사가 실제 채점과 똑같은 정규화를 쓰도록 한다.

**Tech Stack:** TypeScript, tsx, `yaml` 패키지. 기존 `scripts/*.ts`와 같은 방식(`tsx scripts/xxx.ts`)으로 실행한다.

**테스트 방식에 대한 주의:** 이 저장소에는 테스트 러너가 없다(`package.json`에 `test` 스크립트도 vitest/jest 의존성도 없다). 러너를 새로 들이는 것은 이 작업의 범위가 아니므로, TDD의 red/green은 **픽스처 + 종료 코드/출력 grep**으로 대체한다. 각 검사 규칙마다 그 규칙을 위반하는 픽스처를 먼저 만들고, 아직 검출되지 않음을 확인한 뒤(red), 규칙을 구현하고 검출됨을 확인한다(green). 픽스처는 `scripts/fixtures/quiz/` 아래에 두며 `contents/` 밖이라 절대 발행되지 않는다.

**진단 코드:** 에러는 `E1`~`E6`, 경고는 `W7`~`W11`이다. 스펙 8절의 번호와 일치한다. 출력에 이 코드를 찍으므로 검증 명령이 `grep -q "E4"` 형태로 정확해진다.

---

## File Structure

| 파일 | 책임 |
|------|------|
| `scripts/check-quiz.ts` | 퀴즈 블록 추출, 검사 규칙, CLI, 출력, 종료 코드. 단일 파일 (~250줄, 기존 `copy-assets.ts` 402줄보다 작다) |
| `scripts/fixtures/quiz/*/index.md` | 규칙별 위반 픽스처. `contents/` 밖이라 발행되지 않는다 |
| `.claude/skills/generate-quiz/SKILL.md` | 절차 |
| `.claude/skills/generate-quiz/references/quiz-rules.md` | 형식 규칙 + 품질 규칙 + 정답 노출 사례집 |
| `package.json` | `check:quiz` 스크립트 |
| `CLAUDE.md` | 퀴즈 절을 포인터로 축소 |

`lib/quiz.ts`는 **수정하지 않는다.** `isValidQuestion`이 export되어 있지 않지만, `yaml`의 `parse`로 얻은 원본 배열 길이와 `parseQuiz` 결과 길이를 비교하면 버려진 문항을 검출할 수 있다.

---

## Task 1: 선행 조건과 기준선 확인

**Files:** 없음 (환경 확인만)

- [ ] **Step 1: 브랜치 확인**

이 계획은 `feat/generate-quiz-skill` 브랜치에서 진행한다. 스펙 문서 커밋(`bb921f7`)이 이미 이 브랜치에 있다.

```bash
git branch --show-current
```

Expected: `feat/generate-quiz-skill`

다른 브랜치면 다음을 실행한다.

```bash
git checkout feat/generate-quiz-skill
```

- [ ] **Step 2: 의존성 설치**

현재 `node_modules`에 `remark-math`와 `rehype-katex`가 없어 `npm run check`가 실패한다.

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps`는 `netlify.toml`의 `NPM_FLAGS`와 같은 설정이다.

- [ ] **Step 3: 타입 체크 기준선 확인**

```bash
npm run check
```

Expected: 출력 없이 종료 코드 0. 아직 에러가 남아 있으면 이 계획을 진행하기 전에 원인을 보고한다 — 이후 모든 태스크가 `npm run check` 통과를 완료 조건으로 삼는다.

- [ ] **Step 4: tsx에서 lib/quiz.ts import가 되는지 확인**

이건 이미 검증된 사실이지만, 환경이 다르면 여기서 걸린다.

```bash
cat > scripts/probe-tmp.ts << 'TS'
import { parseQuiz } from '../lib/quiz';
console.log('문항수:', parseQuiz('- type: ox\n  q: "t"\n  answer: true\n  explain: "x"\n').length);
TS
npx tsx scripts/probe-tmp.ts; rm -f scripts/probe-tmp.ts
```

Expected: `문항수: 1`

---

## Task 2: 검증 스크립트 골격 + E1/E2

퀴즈 블록을 찾아 파싱하고, YAML이 깨졌거나(E1) 문항이 조용히 버려지는(E2) 경우를 잡는다.

**Files:**
- Create: `scripts/fixtures/quiz/clean/index.md`
- Create: `scripts/fixtures/quiz/broken-yaml/index.md`
- Create: `scripts/fixtures/quiz/dropped-item/index.md`
- Create: `scripts/check-quiz.ts`
- Modify: `package.json` (scripts 블록)

- [ ] **Step 1: 정상 픽스처 작성**

`scripts/fixtures/quiz/clean/index.md`:

````markdown
# 1. 본문

픽스처용 더미 본문이다.

# 2. 퀴즈

```quiz
- type: mcq
  q: "샘플 객관식 질문이다. 무엇이 맞나?"
  choices: ["첫 번째 보기 문장이다", "두 번째 보기 문장이다", "세 번째 보기 문장이다", "네 번째 보기 문장이다"]
  answer: 0
  explain: "첫 번째가 맞다. (1.1)"

- type: ox
  q: "샘플 OX 질문이다. 이 문장은 참인가?"
  answer: true
  explain: "참이다. (1.2)"

- type: code
  q: "이 코드는 무엇을 출력하나?"
  lang: go
  code: |
    fmt.Println("hello")
  choices: ["hello를 출력한다", "world를 출력한다", "빈 줄을 출력한다", "컴파일 에러가 난다"]
  answer: 0
  explain: "hello를 출력한다. (1.3)"

- type: blank
  q: "빈칸 문항이다. 하늘의 색은 ___ 이다."
  answer: ["파랑"]
  explain: "파랑이다. (1.4)"
```
````

- [ ] **Step 2: E1/E2 위반 픽스처 작성**

`scripts/fixtures/quiz/broken-yaml/index.md`:

````markdown
# 1. 퀴즈

```quiz
- type: mcq
  choices: [
```
````

`scripts/fixtures/quiz/dropped-item/index.md`:

````markdown
# 1. 퀴즈

```quiz
- type: mcq
  q: "정답 인덱스가 보기 범위를 벗어난 문항이다"
  choices: ["가", "나"]
  answer: 5
  explain: "설명이다. (1.1)"
```
````

두 픽스처의 동작은 확인된 것이다. `broken-yaml`은 `parse`가 예외를 던져 `rawCount = null`이 되고, `dropped-item`은 `rawCount = 1`인데 `parseQuiz` 결과가 0개다.

- [ ] **Step 3: 아직 검출되지 않음을 확인 (red)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/broken-yaml
```

Expected: `Cannot find module` 계열 에러. 스크립트가 아직 없다.

- [ ] **Step 4: 스크립트 작성**

`scripts/check-quiz.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { parseQuiz, type QuizQuestion } from '../lib/quiz';

const CONTENTS_DIR = path.join(process.cwd(), 'contents');

type Level = 'error' | 'warn';

interface Finding {
  code: string;
  level: Level;
  message: string;
}

interface QuizSet {
  file: string;
  index: number;
  /** YAML 최상위가 배열일 때 그 길이. 파싱 실패거나 배열이 아니면 null */
  rawCount: number | null;
  questions: QuizQuestion[];
}

/** 마크다운에서 ```quiz 코드펜스 안의 YAML 원문만 뽑는다 */
function extractQuizBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /^```quiz[ \t]*\r?\n([\s\S]*?)^```/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function loadQuizSets(file: string): QuizSet[] {
  const markdown = fs.readFileSync(file, 'utf8');
  return extractQuizBlocks(markdown).map((source, index) => {
    let rawCount: number | null = null;
    try {
      const raw = parse(source);
      if (Array.isArray(raw)) rawCount = raw.length;
    } catch {
      rawCount = null;
    }
    return { file, index, rawCount, questions: parseQuiz(source) };
  });
}

/** E1: YAML이 깨짐 / E2: 파서가 조용히 버리는 문항 */
function checkParse(set: QuizSet): Finding[] {
  if (set.rawCount === null) {
    return [
      {
        code: 'E1',
        level: 'error',
        message: 'YAML 파싱 실패거나 최상위가 배열이 아니다 — 블록 전체가 코드 블록으로 노출된다',
      },
    ];
  }
  if (set.rawCount !== set.questions.length) {
    const dropped = set.rawCount - set.questions.length;
    return [
      {
        code: 'E2',
        level: 'error',
        message: `형식에 맞지 않아 렌더링에서 빠지는 문항이 ${dropped}개 있다 (원본 ${set.rawCount}, 유효 ${set.questions.length})`,
      },
    ];
  }
  return [];
}

function checkSet(set: QuizSet, label: string): Finding[] {
  const findings = checkParse(set);
  return findings.map((f) => ({ ...f, message: `${label} ${f.message}` }));
}

function findArticleFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findArticleFiles(full));
    else if (entry.name === 'index.md') out.push(full);
  }
  return out;
}

/** 인자는 파일 경로, 글 폴더 경로, 또는 contents 기준 slug를 받는다 */
function resolveTargets(arg?: string): string[] {
  if (!arg) return findArticleFiles(CONTENTS_DIR);
  const candidates = [arg, path.join(arg, 'index.md'), path.join(CONTENTS_DIR, arg, 'index.md')];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return [candidate];
  }
  throw new Error(`대상을 찾을 수 없다: ${arg}`);
}

function labelFor(lang: 'ko' | 'en', set: QuizSet, total: number): string {
  return total > 1 ? `[${lang} 세트 ${set.index + 1}]` : `[${lang}]`;
}

function main() {
  let targets: string[];
  try {
    targets = resolveTargets(process.argv[2]);
  } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exit(1);
  }

  let errorCount = 0;
  let warnCount = 0;
  let checked = 0;

  for (const koFile of targets) {
    const koSets = loadQuizSets(koFile);
    if (koSets.length === 0) continue;
    checked += 1;

    const enFile = koFile.replace(/index\.md$/, 'index_en.md');
    const enSets = fs.existsSync(enFile) ? loadQuizSets(enFile) : null;

    const findings: Finding[] = [];
    for (const set of koSets) findings.push(...checkSet(set, labelFor('ko', set, koSets.length)));
    if (enSets) {
      for (const set of enSets) findings.push(...checkSet(set, labelFor('en', set, enSets.length)));
    }

    const rel = path.relative(process.cwd(), koFile);
    if (findings.length === 0) {
      console.log(`✅ ${rel}`);
    } else {
      console.log(`\n📄 ${rel}${enSets ? ' (+ index_en.md)' : ''}`);
      for (const finding of findings) {
        const mark = finding.level === 'error' ? '✗' : '⚠';
        console.log(`   ${mark} ${finding.code}  ${finding.message}`);
        if (finding.level === 'error') errorCount += 1;
        else warnCount += 1;
      }
    }
  }

  console.log(`\n검사한 글 ${checked}편 · 에러 ${errorCount} · 경고 ${warnCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
```

- [ ] **Step 5: E1 검출 확인 (green)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/broken-yaml; echo "exit=$?"
```

Expected: 출력에 `✗ E1  [ko] YAML 파싱 실패...`가 있고 `exit=1`.

`parseQuiz`가 `console.warn`으로 파싱 실패를 함께 찍는다. 정상이다.

- [ ] **Step 6: E2 검출 확인 (green)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/dropped-item; echo "exit=$?"
```

Expected: `✗ E2  [ko] 형식에 맞지 않아 렌더링에서 빠지는 문항이 1개 있다 (원본 1, 유효 0)` 그리고 `exit=1`.

- [ ] **Step 7: 정상 픽스처가 통과하는지 확인**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/clean; echo "exit=$?"
```

Expected: `✅ scripts/fixtures/quiz/clean/index.md`, `에러 0 · 경고 0`, `exit=0`.

- [ ] **Step 8: npm 스크립트 추가**

`package.json`의 `scripts` 블록에서 `"check": "tsc",` 다음 줄에 추가한다.

```json
    "check:quiz": "tsx scripts/check-quiz.ts",
```

- [ ] **Step 9: npm 경유 실행 확인**

```bash
npm run check:quiz -- scripts/fixtures/quiz/clean
```

Expected: `✅` 한 줄과 `에러 0 · 경고 0`.

- [ ] **Step 10: 타입 체크**

```bash
npm run check
```

Expected: 출력 없이 종료 코드 0.

- [ ] **Step 11: 커밋**

```bash
git add scripts/check-quiz.ts scripts/fixtures package.json
git commit -m "feat: 퀴즈 검증 스크립트 골격과 YAML 파싱 검사 추가

* scripts/check-quiz.ts 신설 - lib/quiz.ts의 parseQuiz 재사용
* E1(YAML 깨짐), E2(문항 조용히 버려짐) 검사
* npm run check:quiz 추가
* 규칙별 픽스처를 scripts/fixtures/quiz/ 아래에 둔다 (contents 밖이라 발행되지 않음)"
```

---

## Task 3: blank 정답 검사 (E3/E4/E5)

정답 노출은 5편 작업에서 4편에 나온 결함이다. 이 태스크가 이 계획의 핵심이다.

**Files:**
- Create: `scripts/fixtures/quiz/blank-no-underscore/index.md`
- Create: `scripts/fixtures/quiz/blank-leak/index.md`
- Create: `scripts/fixtures/quiz/blank-self-leak/index.md`
- Modify: `scripts/check-quiz.ts`

- [ ] **Step 1: 위반 픽스처 3개 작성**

`scripts/fixtures/quiz/blank-no-underscore/index.md` — 빈칸 표시가 없다:

````markdown
# 1. 퀴즈

```quiz
- type: blank
  q: "빈칸 표시가 빠진 문항이다."
  answer: ["정답어"]
  explain: "설명이다. (1.1)"
```
````

`scripts/fixtures/quiz/blank-leak/index.md` — 1번 정답이 2번 보기에 그대로 있다:

````markdown
# 1. 퀴즈

```quiz
- type: blank
  q: "가상 시간을 진행시키는 메서드는 ___ 이다."
  answer: ["Advance"]
  explain: "설명이다. (1.1)"

- type: mcq
  q: "다음 중 FakeClock의 메서드는?"
  choices: ["Advance", "Rewind", "Freeze", "Pause"]
  answer: 0
  explain: "설명이다. (1.2)"
```
````

`scripts/fixtures/quiz/blank-self-leak/index.md` — 정답이 자기 지문에 있다:

````markdown
# 1. 퀴즈

```quiz
- type: blank
  q: "Advance는 가상 시간을 진행시킨다. 그 메서드 이름은 ___ 이다."
  answer: ["Advance"]
  explain: "설명이다. (1.1)"
```
````

- [ ] **Step 2: 아직 검출되지 않음을 확인 (red)**

```bash
for f in blank-no-underscore blank-leak blank-self-leak; do
  echo "--- $f"
  npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/$f 2>/dev/null | grep -E '✗|경고'
done
```

Expected: 세 개 모두 `✗` 줄이 없고 `에러 0 · 경고 0`. 아직 blank 검사가 없다.

- [ ] **Step 3: import에 normalizeBlankAnswer 추가**

`scripts/check-quiz.ts`의 import 줄을 다음으로 바꾼다.

```ts
import { parseQuiz, normalizeBlankAnswer, type QuizQuestion } from '../lib/quiz';
```

- [ ] **Step 4: blank 검사 구현**

`checkParse` 함수 다음에 아래 두 함수를 추가한다.

```ts
/** 한 문항에서 독자가 문제를 풀기 전에 보게 되는 텍스트를 모은다 */
function questionHaystack(question: QuizQuestion): string {
  const parts: string[] = [question.q];
  if ('choices' in question) parts.push(...question.choices);
  if ('code' in question) parts.push(question.code);
  return normalizeBlankAnswer(parts.join('\n'));
}

/** E3: 빈칸 없음 / E4: 다른 문항에 정답 노출 / E5: 자기 지문에 정답 노출 */
function checkBlanks(set: QuizSet): Finding[] {
  const findings: Finding[] = [];

  set.questions.forEach((question, i) => {
    if (question.type !== 'blank') return;
    const num = i + 1;

    if (!question.q.includes('___')) {
      findings.push({
        code: 'E3',
        level: 'error',
        message: `${num}번 blank 문항의 q에 빈칸(___)이 없다`,
      });
    }

    question.answer.forEach((answer) => {
      const needle = normalizeBlankAnswer(answer);
      if (!needle) return;

      if (normalizeBlankAnswer(question.q).includes(needle)) {
        findings.push({
          code: 'E5',
          level: 'error',
          message: `${num}번 blank 정답 "${answer}"이 자기 문항 지문에 그대로 있다`,
        });
      }

      set.questions.forEach((other, j) => {
        if (i === j) return;
        if (questionHaystack(other).includes(needle)) {
          findings.push({
            code: 'E4',
            level: 'error',
            message: `${num}번 blank 정답 "${answer}"이 ${j + 1}번 문항 지문에 노출된다`,
          });
        }
      });
    });
  });

  return findings;
}
```

`explain`은 haystack에 넣지 않는다. 그 문항을 푼 뒤에만 보이기 때문이다.

- [ ] **Step 5: checkSet에서 호출**

`checkSet`을 다음으로 바꾼다.

```ts
function checkSet(set: QuizSet, label: string): Finding[] {
  const parseFindings = checkParse(set);
  // YAML 자체가 깨졌으면 나머지 검사는 의미가 없다
  const findings =
    set.rawCount === null ? parseFindings : [...parseFindings, ...checkBlanks(set)];
  return findings.map((f) => ({ ...f, message: `${label} ${f.message}` }));
}
```

- [ ] **Step 6: 검출 확인 (green)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/blank-no-underscore 2>/dev/null | grep -q 'E3' && echo "E3 OK"
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/blank-leak 2>/dev/null | grep -q 'E4' && echo "E4 OK"
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/blank-self-leak 2>/dev/null | grep -q 'E5' && echo "E5 OK"
```

Expected: `E3 OK`, `E4 OK`, `E5 OK` 세 줄.

- [ ] **Step 7: 정상 픽스처가 여전히 통과하는지 확인**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/clean; echo "exit=$?"
```

Expected: `✅`, `에러 0 · 경고 0`, `exit=0`. `clean` 픽스처의 blank 정답 `파랑`은 다른 문항 어디에도 없다.

- [ ] **Step 8: 타입 체크**

```bash
npm run check
```

Expected: 출력 없이 종료 코드 0.

- [ ] **Step 9: 커밋**

```bash
git add scripts/check-quiz.ts scripts/fixtures
git commit -m "feat: 퀴즈 blank 정답 노출 검사 추가

* E3(빈칸 없음), E4(다른 문항에 정답 노출), E5(자기 지문에 정답 노출)
* 정답 비교에 lib/quiz.ts의 normalizeBlankAnswer를 그대로 써서 실제 채점과 같은 정규화 사용
* explain은 문항을 푼 뒤에만 보이므로 검사 대상에서 제외"
```

---

## Task 4: 한/영 대조 (E6)

**Files:**
- Create: `scripts/fixtures/quiz/pair-mismatch/index.md`
- Create: `scripts/fixtures/quiz/pair-mismatch/index_en.md`
- Modify: `scripts/check-quiz.ts`

- [ ] **Step 1: 불일치 픽스처 쌍 작성**

`scripts/fixtures/quiz/pair-mismatch/index.md`:

````markdown
# 1. 퀴즈

```quiz
- type: mcq
  q: "한국어 1번 문항이다"
  choices: ["가나다라마", "바사아자차", "카타파하가", "나다라마바"]
  answer: 0
  explain: "설명이다. (1.1)"

- type: ox
  q: "한국어 2번 문항이다"
  answer: true
  explain: "설명이다. (1.2)"
```
````

`scripts/fixtures/quiz/pair-mismatch/index_en.md` — 1번 정답 인덱스가 다르고 2번 유형이 다르다:

````markdown
# 1. Quiz

```quiz
- type: mcq
  q: "English question one"
  choices: ["Alpha bravo", "Charlie delta", "Echo foxtrot", "Golf hotel!"]
  answer: 2
  explain: "Explanation. (1.1)"

- type: mcq
  q: "English question two"
  choices: ["Alpha bravo", "Charlie delta", "Echo foxtrot", "Golf hotel!"]
  answer: 0
  explain: "Explanation. (1.2)"
```
````

- [ ] **Step 2: 아직 검출되지 않음을 확인 (red)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/pair-mismatch 2>/dev/null | grep -E '✗|에러'
```

Expected: `✗` 줄 없이 `에러 0 · 경고 0`.

- [ ] **Step 3: 대조 검사 구현**

`checkSet` 함수 다음에 추가한다.

```ts
/** E6: 한/영 세트 구조 불일치. blank 정답은 언어마다 달라야 정상이므로 비교하지 않는다 */
function checkPair(koSets: QuizSet[], enSets: QuizSet[]): Finding[] {
  if (koSets.length !== enSets.length) {
    return [
      {
        code: 'E6',
        level: 'error',
        message: `[ko↔en] 퀴즈 블록 수가 한국어 ${koSets.length}개, 영문 ${enSets.length}개로 다르다`,
      },
    ];
  }

  const findings: Finding[] = [];

  koSets.forEach((koSet, s) => {
    const enSet = enSets[s];
    const prefix = koSets.length > 1 ? `[ko↔en 세트 ${s + 1}]` : '[ko↔en]';

    if (koSet.questions.length !== enSet.questions.length) {
      findings.push({
        code: 'E6',
        level: 'error',
        message: `${prefix} 문항 수가 한국어 ${koSet.questions.length}개, 영문 ${enSet.questions.length}개로 다르다`,
      });
      return;
    }

    koSet.questions.forEach((koQ, i) => {
      const enQ = enSet.questions[i];
      const num = i + 1;

      if (koQ.type !== enQ.type) {
        findings.push({
          code: 'E6',
          level: 'error',
          message: `${prefix} ${num}번 문항 유형이 한국어 ${koQ.type}, 영문 ${enQ.type}으로 다르다`,
        });
        return;
      }

      if (koQ.type === 'blank') return;

      if (JSON.stringify(koQ.answer) !== JSON.stringify(enQ.answer)) {
        findings.push({
          code: 'E6',
          level: 'error',
          message: `${prefix} ${num}번 문항 정답이 한국어 ${JSON.stringify(koQ.answer)}, 영문 ${JSON.stringify(enQ.answer)}으로 다르다`,
        });
      }
    });
  });

  return findings;
}
```

- [ ] **Step 4: main에서 호출**

`main` 함수 안에서 `if (enSets) { ... }` 블록을 다음으로 바꾼다.

```ts
    if (enSets) {
      for (const set of enSets) findings.push(...checkSet(set, labelFor('en', set, enSets.length)));
      findings.push(...checkPair(koSets, enSets));
    }
```

- [ ] **Step 5: 검출 확인 (green)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/pair-mismatch 2>/dev/null | grep 'E6'
```

Expected: 두 줄. 1번 정답 불일치(`한국어 0, 영문 2`)와 2번 유형 불일치(`한국어 ox, 영문 mcq`).

- [ ] **Step 6: 영문판 없는 글에서 E6이 안 뜨는지 확인**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/clean 2>/dev/null | grep -c 'E6'
```

Expected: `0`. `clean` 픽스처에는 `index_en.md`가 없다.

- [ ] **Step 7: 타입 체크와 커밋**

```bash
npm run check
git add scripts/check-quiz.ts scripts/fixtures
git commit -m "feat: 퀴즈 한/영 세트 대조 검사 추가

* E6 - 블록 수, 문항 수, 유형 순서, 정답 인덱스 불일치
* blank 정답은 언어마다 달라야 정상이라 비교 대상에서 제외
* index_en.md가 없으면 검사를 건너뛴다"
```

---

## Task 5: 품질 경고 (W7~W11)

에러와 달리 사람이 판단할 항목이다. 종료 코드를 바꾸지 않는다.

**Files:**
- Create: `scripts/fixtures/quiz/warnings/index.md`
- Modify: `scripts/check-quiz.ts`

- [ ] **Step 1: 경고 픽스처 작성**

`scripts/fixtures/quiz/warnings/index.md` — W7(mcq 3문항 중 3문항이 1번), W8(보기 길이 편차), W9(3지선다), W10(절 참조 없음), W11(문항 수 3개)을 한 번에 낸다:

````markdown
# 1. 퀴즈

```quiz
- type: mcq
  q: "정답이 첫 번째에 쏠린 문항 하나"
  choices: ["가나다라마", "바사아자차", "카타파하가", "나다라마바"]
  answer: 0
  explain: "설명이다. (1.1)"

- type: mcq
  q: "정답이 첫 번째에 쏠린 문항 둘"
  choices: ["보기가 아주 길어서 길이 편차를 크게 만드는 정답 보기", "짧은 보기", "또 짧은 보기", "역시 짧음"]
  answer: 0
  explain: "설명이다. (1.2)"

- type: mcq
  q: "정답이 첫 번째에 쏠린 문항 셋"
  choices: ["가나다라마", "바사아자차", "카타파하가"]
  answer: 0
  explain: "절 참조가 없는 설명이다"
```
````

- [ ] **Step 2: 아직 검출되지 않음을 확인 (red)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/warnings 2>/dev/null | grep -E '⚠|경고'
```

Expected: `⚠` 줄 없이 `에러 0 · 경고 0`.

- [ ] **Step 3: 경고 검사 구현**

`checkBlanks` 함수 다음에 추가한다.

```ts
/** explain의 절 참조. 한국어판은 (2.2)와 (2.2절)이 섞여 있고 영문판은 (2.2)만 쓴다 */
const SECTION_REF = /\(\d+\.\d+[^)]*\)/;

/** W7~W11: 사람이 판단할 품질 경고 */
function checkQuality(set: QuizSet): Finding[] {
  const findings: Finding[] = [];
  const questions = set.questions;

  if (questions.length !== 10) {
    findings.push({
      code: 'W11',
      level: 'warn',
      message: `문항이 ${questions.length}개다 (권장 10개)`,
    });
  }

  // W7: 유형별 정답 인덱스 쏠림. 문항이 1개뿐인 유형은 판단할 수 없어 건너뛴다
  const answersByType = new Map<string, number[]>();
  for (const question of questions) {
    if (question.type !== 'mcq' && question.type !== 'code') continue;
    const list = answersByType.get(question.type) ?? [];
    list.push(question.answer);
    answersByType.set(question.type, list);
  }
  for (const [type, answers] of answersByType) {
    if (answers.length < 2) continue;
    const counts = new Map<number, number>();
    for (const answer of answers) counts.set(answer, (counts.get(answer) ?? 0) + 1);
    for (const [index, count] of counts) {
      if (count * 2 > answers.length) {
        findings.push({
          code: 'W7',
          level: 'warn',
          message: `${type} ${answers.length}문항 중 ${count}문항의 정답이 ${index + 1}번에 쏠려 있다`,
        });
      }
    }
  }

  questions.forEach((question, i) => {
    const num = i + 1;

    if ('choices' in question) {
      const lengths = question.choices.map((choice) => choice.length);
      const min = Math.min(...lengths);
      const max = Math.max(...lengths);
      if (max - min > 12) {
        findings.push({
          code: 'W8',
          level: 'warn',
          message: `${num}번 보기 길이 편차가 ${max - min}자다 (${min}~${max})`,
        });
      }
    }

    if (question.type === 'mcq' && question.choices.length !== 4) {
      findings.push({
        code: 'W9',
        level: 'warn',
        message: `${num}번 mcq가 ${question.choices.length}지선다다 (4지선다 권장)`,
      });
    }

    if (!SECTION_REF.test(question.explain)) {
      findings.push({
        code: 'W10',
        level: 'warn',
        message: `${num}번 explain에 절 참조가 없다`,
      });
    }
  });

  return findings;
}
```

- [ ] **Step 4: checkSet에서 호출**

`checkSet`을 다음으로 바꾼다.

```ts
function checkSet(set: QuizSet, label: string): Finding[] {
  const parseFindings = checkParse(set);
  // YAML 자체가 깨졌으면 나머지 검사는 의미가 없다
  const findings =
    set.rawCount === null
      ? parseFindings
      : [...parseFindings, ...checkBlanks(set), ...checkQuality(set)];
  return findings.map((f) => ({ ...f, message: `${label} ${f.message}` }));
}
```

- [ ] **Step 5: 검출 확인 (green)**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/warnings 2>/dev/null | grep -oE 'W[0-9]+' | sort -u
```

Expected: `W10`, `W11`, `W7`, `W8`, `W9` 다섯 줄 (정렬 순서는 `W10 W11 W7 W8 W9`).

- [ ] **Step 6: 경고는 종료 코드를 바꾸지 않는지 확인**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/warnings > /dev/null 2>&1; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 7: 정상 픽스처 확인**

```bash
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/clean 2>/dev/null | grep -E '⚠|에러'
```

Expected: `⚠ W11 [ko] 문항이 4개다 (권장 10개)` 한 줄과 `에러 0 · 경고 1`.

`clean` 픽스처는 유형별로 문항이 1개씩이라 W7이 뜨지 않는다(유형별 2문항 미만은 건너뛴다). W11만 뜨는 것이 정상이다.

- [ ] **Step 8: 타입 체크와 커밋**

```bash
npm run check
git add scripts/check-quiz.ts scripts/fixtures
git commit -m "feat: 퀴즈 품질 경고 검사 추가

* W7(정답 인덱스 쏠림), W8(보기 길이 편차), W9(4지선다 아님), W10(절 참조 없음), W11(문항 수)
* 경고는 종료 코드를 바꾸지 않는다 - 사람이 판단할 항목
* W7은 유형별 문항이 2개 이상일 때만 판단한다"
```

---

## Task 6: 기존 퀴즈 8편 회귀 확인

이미 리뷰를 거친 글들이므로 **에러가 나오면 스크립트 기준이 과한 것**이다. 경고는 나와도 된다.

**Files:** 상황에 따라 `scripts/check-quiz.ts` 수정

- [ ] **Step 1: 전체 검사 실행**

```bash
npm run check:quiz 2>/dev/null | tail -40
```

Expected: 마지막 줄이 `검사한 글 8편 · 에러 0 · 경고 N`.

- [ ] **Step 2: 종료 코드 확인**

```bash
npm run check:quiz > /dev/null 2>&1; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 3: 에러가 있으면 판정**

에러가 하나라도 나오면 둘 중 하나다.

- **실제 결함**: 그 글을 고친다. 단, 이 계획의 범위는 skill 구축이므로 **고치지 말고 사용자에게 보고**한다. 스펙 3절에서 기존 퀴즈 검수는 범위 밖으로 뒀다.
- **오탐**: 스크립트 기준을 완화한다. 어느 쪽인지 판단이 안 서면 사용자에게 묻는다.

- [ ] **Step 4: 경고 분포 확인**

```bash
npm run check:quiz 2>/dev/null | grep -oE 'W[0-9]+' | sort | uniq -c | sort -rn
```

기록만 남긴다. 특정 경고가 8편 전부에서 뜬다면 그 기준이 관례와 안 맞는다는 뜻이므로 사용자에게 보고한다.

- [ ] **Step 5: 커밋 (스크립트를 고쳤을 때만)**

```bash
git add scripts/check-quiz.ts
git commit -m "fix: 기존 퀴즈 8편에서 나온 오탐 제거"
```

---

## Task 7: references/quiz-rules.md 작성

CLAUDE.md의 퀴즈 절 37줄을 옮긴다. **유실되는 규칙이 없어야 한다.**

**Files:**
- Create: `.claude/skills/generate-quiz/references/quiz-rules.md`

- [ ] **Step 1: 원본 확보**

```bash
grep -n '### 퀴즈 (선택)' CLAUDE.md
```

출력된 줄 번호부터 다음 `###`가 나오기 전까지가 원본이다. 이 범위를 읽어서 손에 쥔다.

```bash
sed -n '/^### 퀴즈 (선택)/,/^### 샘플 코드 작성 규칙/p' CLAUDE.md
```

- [ ] **Step 2: 규칙 문서 작성**

`.claude/skills/generate-quiz/references/quiz-rules.md`를 만든다. 구성은 다음 6절로 하고, **내용은 위에서 읽은 CLAUDE.md 원문을 그대로 옮긴다.** 요약하거나 줄이지 않는다.

1. **유형과 필드** — mcq/ox/code/blank 4유형, `answer`가 0부터지만 화면에는 1부터 번호가 붙는다는 것
2. **형식 규칙** — `explain` 필수, 문자열은 큰따옴표, `choices`는 인라인 배열, `code`는 블록 스칼라, 세트당 10문항, 영문판은 같은 문항 수·유형·정답 인덱스
3. **품질 규칙** — 정답 위치 분산, 보기 길이 균형, mcq 4지선다, 본문에 근거 있는 것만, 유형 순서 비반복
4. **정답 노출** — 전 문항이 한 화면에 동시에 렌더된다는 것, blank 정답이 다른 문항 지문에 나오면 안 된다는 것, 흔한 토큰 부적합, 문자열 검사만으로 부족한 사례(`대괄호` ↔ `[T any]`), 영문판 대소문자·공백 무시 사고(`after` ↔ `After`)
5. **배치 규칙** — 이번에 새로 고정한 내용. 아래 원문을 그대로 쓴다:

   > 글당 quiz 블록 1개. 렌더러는 여러 개를 지원하고 세트마다 점수가 따로 나지만, 관례는 1개다.
   > 위치는 본문 마지막 장 다음, 마무리·정리·FAQ·참고 앞이다. 독립 H1 장으로 만들고 제목은 `# N. 퀴즈`로 한다.
   > 도입 문장을 한 줄 붙인다. 예: "여기까지 읽었으면 풀 수 있는 문제들이다. 답을 고르면 바로 해설이 나온다."
   > 퀴즈가 있는 기존 8편이 예외 없이 이 형태다.

6. **작성 후 확인** — `npm run check:quiz`가 잡아주는 것과 못 잡는 것을 나눠 쓴다:

   > `npm run check:quiz -- <slug>`가 잡아주는 것: YAML 깨짐(E1), 조용히 빠지는 문항(E2), 빈칸 없음(E3), 다른 문항에 정답 노출(E4), 자기 지문에 정답 노출(E5), 한/영 구조 불일치(E6). 정답 쏠림·보기 길이·4지선다·절 참조·문항 수는 경고(W7~W11)로 나오며 사람이 판단한다.
   >
   > 스크립트가 못 잡는 것: `code` 스니펫이 실제로 컴파일되는지. Go는 미사용 변수가 컴파일 에러다. 의도적으로 에러를 묻는 문항이면 그 에러만 나야 한다.
   >
   > 스크립트가 못 잡는 것: 퀴즈 절을 넣어 뒤 섹션 번호를 밀었을 때 본문에 그 번호를 가리키는 참조가 남아 있는지. 한국어판과 영문판의 섹션 번호가 다를 수 있으니 파일별로 본다.

- [ ] **Step 3: 유실 검사**

CLAUDE.md 원문의 각 문단이 새 문서 어디에 들어갔는지 하나씩 짚는다. 특히 다음 다섯 가지가 빠지기 쉽다.

- `answer`는 0부터지만 화면 번호는 1부터
- YAML이 깨지면 블록 전체가 코드 블록으로 노출되고, 개별 문항이 깨지면 그 문항만 조용히 빠진다
- `대괄호`가 정답일 때 grep 0건이어도 `[T any]`가 답을 보여준다는 사례
- 영문 `after` ↔ `After` 매칭 사고
- 표본 파일 경로 (`contents/go/go-fx-의존성-주입/index.md`의 5장)

- [ ] **Step 4: 인코딩 확인**

```bash
file -I .claude/skills/generate-quiz/references/quiz-rules.md
```

Expected: `charset=utf-8`

- [ ] **Step 5: 커밋**

```bash
git add .claude/skills/generate-quiz/references/quiz-rules.md
git commit -m "docs: generate-quiz 규칙 문서 추가

* CLAUDE.md 퀴즈 절의 형식·품질 규칙과 정답 노출 사례를 그대로 이관
* 배치 규칙(글당 1개, 마지막 장 다음)을 새로 고정
* check:quiz가 잡는 것과 못 잡는 것을 구분해 기록"
```

---

## Task 8: SKILL.md 작성

**Files:**
- Create: `.claude/skills/generate-quiz/SKILL.md`

- [ ] **Step 1: 기존 skill 형식 확인**

```bash
head -30 .claude/skills/generate-slides/SKILL.md
head -25 .claude/skills/translate-article-en/SKILL.md
```

frontmatter는 `name`과 `description` 두 개뿐이고 `description`은 영어다. 본문은 한국어이며 `## Overview`, `## When to Use`, `## 대상 지정`, `## Procedure` 순서다.

- [ ] **Step 2: SKILL.md 작성**

`.claude/skills/generate-quiz/SKILL.md` (바깥 울타리는 백틱 5개다. 안쪽 백틱 3개가 실제 파일 내용이다):

`````markdown
---
name: generate-quiz
description: Use when adding an interactive quiz section to a blog article (contents/{category}/{slug}/index.md), and mirroring it into the English counterpart index_en.md
---

# Generate Quiz Section (```quiz)

## Overview

이 블로그는 글마다 인터랙티브 퀴즈를 붙일 수 있다. 본문에 ` ```quiz ` 코드펜스를 열고 YAML로 문항을 적으면 클라이언트에서 퀴즈 UI로 렌더되고, 보기를 고르면 즉시 판정·해설이 나오며 세트 단위로 점수가 집계된다.

이 스킬은 글 하나를 받아 **퀴즈 세트를 만들고 본문에 배치한 뒤 검증까지** 한다.

핵심 원칙: **본문에 근거가 있는 것만 묻고, 정답이 화면에 새지 않게 한다.** 퀴즈 UI는 한 세트의 전 문항을 한 화면에 동시에 렌더하는데 작성자는 문항을 하나씩 쓰기 때문에, 정답 노출은 눈으로 잘 안 잡힌다. 실제로 5편 작업에서 4편에 나온 결함이다.

형식·품질 규칙과 정답 노출 사례는 `references/quiz-rules.md`에 있다. **문항을 쓰기 전에 반드시 읽는다.**

## When to Use

- 특정 글에 퀴즈를 새로 넣을 때 (`contents/{category}/{slug}/index.md`)
- 이미 quiz 블록이 있으면 덮어쓰기 전에 사용자에게 확인

## 대상 지정

- **단일 글**: slug(`go/go-fx-의존성-주입`) 또는 `index.md` 경로
- 한 번에 **한 글만** 처리한다. 10문항을 글에서 근거를 찾아 설계하는 작업이라 배치로 돌리면 뒤쪽 글의 문항이 뻔해진다.
- **언어**: 한국어 `index.md`를 먼저 쓴다. 같은 폴더에 `index_en.md`가 **이미 있을 때만** 영문 세트를 만든다.

## Procedure

### 1. 규칙을 읽는다

`references/quiz-rules.md`를 읽는다. 특히 "정답 노출" 절.

### 2. 글을 정독하고 근거를 모은다

절별로 문항 후보를 뽑는다. **본문에 근거가 없는 것은 쓰지 않는다.** 일반적으로 맞는 사실이어도 그 글에 없으면 제외한다.

### 3. 세트를 설계한다

- 10문항, mcq 4 / ox 2 / code 2 / blank 2를 기본으로 한다
- 유형 순서를 기계적으로 반복하지 않는다
- mcq 정답 인덱스를 0~3에 고르게 배치하고, code·ox도 한쪽으로 쏠리지 않게 한다
- blank 정답 후보에서 흔한 토큰(`any`, `struct`, `after` 등)을 배제한다. 본문·코드 곳곳에 자연스럽게 등장해 다른 문항에서 노출된다

### 4. 배치 위치를 정한다

본문 마지막 장 다음, 마무리·정리·FAQ·참고 앞에 `# N. 퀴즈` H1 장을 신설한다. 뒤 장 번호를 하나씩 밀고 `content-heading-style` 규칙을 적용한다.

### 5. 밀린 장 번호 참조를 확인한다

본문에 그 번호를 가리키는 문장이 없는지 확인한다. 한국어판과 영문판의 섹션 번호가 서로 다를 수 있으니 파일별로 본다.

### 6. 작성하고 저장한다

저장 후 인코딩을 확인한다.

```bash
file -I contents/{category}/{slug}/index.md
```

Expected: `charset=utf-8`

### 7. 검증한다

```bash
npm run check:quiz -- {category}/{slug}
```

**에러(E1~E6)가 0이 될 때까지 고친다.** 경고(W7~W11)는 하나씩 판단해서 고칠지 남길지 정하고, 남긴다면 이유를 사용자에게 보고한다.

스크립트가 못 잡는 것 두 가지는 직접 확인한다.

- `code` 스니펫이 실제로 컴파일되는가. Go는 미사용 변수가 컴파일 에러다. 의도적으로 에러를 묻는 문항이면 **그 에러만** 나야 한다
- 5번 단계의 섹션 번호 참조

### 8. 영문판

같은 폴더에 `index_en.md`가 있으면 같은 문항 수·유형·정답 인덱스로 영문 세트를 쓰고 다시 검증한다. 영문 blank 정답이 흔한 영어 단어와 겹치는지 따로 본다 — 비교가 대소문자·공백 무시라, 지문의 전치사 `after`가 허용 답 `After`와 매칭된 사례가 있다.

`index_en.md`가 **없으면** 한국어만 작성하고 "영문판 없음, 필요하면 `translate-article-en` 스킬"을 보고하고 끝낸다. 퀴즈만 든 `index_en.md`를 만들지 않는다.

### 9. 보고한다

- 문항 표: 번호 · 유형 · 근거 절 · 정답
- `npm run check:quiz` 결과: 에러 수, 경고 수와 그 내용
- 영문판 처리 결과
`````

- [ ] **Step 3: frontmatter 확인**

```bash
head -4 .claude/skills/generate-quiz/SKILL.md
```

Expected: `---`, `name: generate-quiz`, `description: Use when adding...`, `---`

- [ ] **Step 4: 인코딩 확인**

```bash
file -I .claude/skills/generate-quiz/SKILL.md
```

Expected: `charset=utf-8`

- [ ] **Step 5: 커밋**

```bash
git add .claude/skills/generate-quiz/SKILL.md
git commit -m "feat: generate-quiz skill 추가

* 글 하나를 받아 퀴즈 세트를 설계·배치·검증하는 9단계 절차
* 한 번에 한 글만 처리 (배치하면 문항 품질이 떨어짐)
* index_en.md가 있을 때만 영문 세트 작성, 없으면 보고하고 종료"
```

---

## Task 9: CLAUDE.md 축소

**Files:**
- Modify: `CLAUDE.md` (`### 퀴즈 (선택)` 절)

- [ ] **Step 1: 대체 전 원문 백업 확인**

Task 7에서 규칙이 전부 이관됐는지 다시 본다.

```bash
sed -n '/^### 퀴즈 (선택)/,/^### 샘플 코드 작성 규칙/p' CLAUDE.md | wc -l
```

기록만 해둔다. 이 내용이 `references/quiz-rules.md`에 다 있어야 한다.

- [ ] **Step 2: 절 교체**

`### 퀴즈 (선택)`부터 `### 샘플 코드 작성 규칙` 직전까지를 다음으로 바꾼다.

```markdown
### 퀴즈 (선택)

글에 인터랙티브 퀴즈를 넣으려면 본문에 ` ```quiz ` 코드펜스를 열고 YAML로 문항을 적는다. 클라이언트에서 퀴즈 UI로 렌더되며, 보기를 고르면 즉시 판정·해설이 나오고 세트 단위로 점수가 집계된다. 표본: `contents/go/go-fx-의존성-주입/index.md`의 5장.

**퀴즈를 새로 쓰거나 고칠 때는 `generate-quiz` skill을 쓴다.** 형식·품질 규칙과 정답 노출 사례는 `.claude/skills/generate-quiz/references/quiz-rules.md`에, 검증은 `npm run check:quiz`에 있다.

형식 예시와 필드 정의: `docs/superpowers/specs/2026-08-07-interactive-quiz-design.md`
```

마지막 줄(형식 예시 링크)은 원문에 있던 것이므로 유지한다.

- [ ] **Step 3: 줄 수 감소 확인**

```bash
git diff --stat CLAUDE.md
```

Expected: 30줄 안팎 감소.

- [ ] **Step 4: 인코딩 확인**

```bash
file -I CLAUDE.md
```

Expected: `charset=utf-8`

- [ ] **Step 5: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md 퀴즈 절을 generate-quiz skill 포인터로 축소

* 상세 규칙은 .claude/skills/generate-quiz/references/quiz-rules.md로 이관
* 매 세션 로드되는 CLAUDE.md에서 30줄 감소"
```

---

## Task 10: 최종 검증과 PR

**Files:** 없음

- [ ] **Step 1: 전체 검증**

```bash
npm run check
npm run check:quiz > /dev/null 2>&1; echo "check:quiz exit=$?"
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/clean > /dev/null 2>&1; echo "clean exit=$?"
npx tsx scripts/check-quiz.ts scripts/fixtures/quiz/blank-leak > /dev/null 2>&1; echo "leak exit=$?"
```

Expected: `npm run check`는 출력 없음, `check:quiz exit=0`, `clean exit=0`, `leak exit=1`.

- [ ] **Step 2: 픽스처가 발행 대상이 아닌지 확인**

```bash
npm run generate:manifest 2>/dev/null | tail -3
grep -c 'fixtures' public/content-manifest.json
```

Expected: manifest 생성 성공, `fixtures` 검색 결과 `0`.

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 빌드 성공. 실패하면 원인을 보고한다. 이 계획은 `contents/`를 건드리지 않으므로 빌드 실패는 다른 원인일 가능성이 높다.

- [ ] **Step 4: 커밋 이력 확인**

```bash
git log --oneline main..HEAD
```

Expected: 스펙 커밋 1개 + Task 2·3·4·5·7·8·9 커밋 (Task 6은 스크립트를 고쳤을 때만).

- [ ] **Step 5: 푸시와 PR 생성**

```bash
git push -u origin feat/generate-quiz-skill
```

```bash
gh pr create --assignee kenshin579 --base main --title "feat: generate-quiz skill과 퀴즈 검증 스크립트 추가" --body "$(cat <<'EOF'
## 배경

글에 퀴즈 세트를 추가하는 작업을 skill로 고정한다. 지금까지 작성 규칙은 CLAUDE.md에 있었고 검증은 매번 임시 스크립트로 했다.

정답 노출은 5편 작업에서 4편에 나온 결함이고, 사후 검수 커밋도 이미 세 번 있었다(`7ce565b`, `7289e77`, `71de075`). 퀴즈 UI가 한 세트의 전 문항을 한 화면에 동시에 렌더하는데 작성자는 문항을 하나씩 쓰기 때문에 눈으로 잘 안 잡힌다.

## 변경

- `.claude/skills/generate-quiz/SKILL.md` — 9단계 절차, 한 번에 한 글
- `.claude/skills/generate-quiz/references/quiz-rules.md` — CLAUDE.md에서 이관한 형식·품질 규칙과 정답 노출 사례
- `scripts/check-quiz.ts` + `npm run check:quiz` — `lib/quiz.ts`의 `parseQuiz`·`normalizeBlankAnswer`를 재사용해 렌더러와 검증기가 갈라지지 않게 함
- `CLAUDE.md` 퀴즈 절 30줄 축소 (매 세션 로드되는 파일)

에러(E1~E6)는 종료 코드 1, 경고(W7~W11)는 0이다. 배치 규칙(글당 1개, 본문 마지막 장 다음)은 기존 8편의 관례를 그대로 고정했다.

설계 문서: `docs/superpowers/specs/2026-08-13-generate-quiz-skill-design.md`

## 테스트 계획

- [ ] `npm run check` 통과
- [ ] `npm run check:quiz` — 기존 퀴즈 8편에서 에러 0
- [ ] 위반 픽스처에서 E1~E6이 각각 검출되고 종료 코드 1
- [ ] 정상 픽스처에서 에러 0, 종료 코드 0
- [ ] `content-manifest.json`에 픽스처가 들어가지 않음
- [ ] `npm run build` 성공

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: 결과 보고**

PR URL, 기존 8편 검사 결과(에러 수·경고 분포), 실패했거나 건너뛴 항목을 사용자에게 보고한다.

---

## Self-Review

**스펙 커버리지**

| 스펙 항목 | 태스크 |
|-----------|--------|
| 3절 산출물 5개 | Task 2(스크립트·package.json), 7(references), 8(SKILL.md), 9(CLAUDE.md) |
| 6절 skill 절차 9단계 | Task 8 |
| 7절 배치 규칙 고정 | Task 7 5번 절, Task 8 Procedure 4단계 |
| 8절 E1~E6 | Task 2(E1·E2), 3(E3·E4·E5), 4(E6) |
| 8절 W7~W11 | Task 5 |
| 8절 CLI 인자 해석 | Task 2 `resolveTargets` |
| 9절 CLAUDE.md 축소 | Task 9 |
| 10절 완료 기준 | Task 6(기존 8편 에러 0), Task 3~5(픽스처 검출), Task 10(tsc·빌드) |
| 11절 선행 조건 | Task 1 |

**타입 일관성**

`Finding`(`code`/`level`/`message`), `QuizSet`(`file`/`index`/`rawCount`/`questions`), `Level`은 Task 2에서 정의하고 이후 태스크가 같은 이름으로 쓴다. `checkSet`은 Task 2에서 만들어 Task 3과 Task 5에서 두 번 교체되는데, 매번 전체 코드를 다시 실었다. `checkParse`/`checkBlanks`/`checkQuality`/`checkPair`/`questionHaystack`/`labelFor`/`resolveTargets`/`findArticleFiles`/`extractQuizBlocks`/`loadQuizSets`가 전부 정의된 이름이다.

**남은 판단 지점**

Task 6에서 기존 8편에 에러가 나올 경우 "실제 결함이면 고치지 말고 보고"로 정했다. 스펙 3절이 기존 퀴즈 검수를 범위 밖으로 뒀기 때문이다.
