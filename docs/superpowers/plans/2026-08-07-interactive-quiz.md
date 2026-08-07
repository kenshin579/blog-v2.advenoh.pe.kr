# 인터랙티브 퀴즈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 글의 서술형 퀴즈를 객관식·OX·코드·빈칸 4유형의 인터랙티브 퀴즈(즉시 판정 + 세트 점수 집계)로 바꾼다.

**Architecture:** 마크다운의 ` ```quiz ` 코드펜스에 YAML로 문항을 쓰고, 클라이언트에서 해당 코드 블록을 찾아 React portal로 퀴즈 UI를 마운트한다(Mermaid와 같은 바꿔치기 패턴). 본문 HTML 소유권은 신설 `ArticleBody` 컨테이너로 옮기고 mermaid·quiz 후처리를 훅으로 조율한다.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, `yaml` 패키지(신규), shadcn/ui, Tailwind

**Spec:** `docs/superpowers/specs/2026-08-07-interactive-quiz-design.md`

**검증 방식에 대하여:** 이 저장소에는 테스트 러너가 없다(스크립트: dev/build/start/check뿐). 관례를 따라 새 테스트 인프라를 들이지 않고, 순수 로직(`lib/quiz.ts`)은 `npx tsx -e` 인라인 스크립트로 검증하고 UI는 dev 서버에서 눈으로 확인한다. 최종 게이트는 `npm run check`와 `npm run build`다.

---

## 사전 확인된 사실

- **검색 인덱스는 손댈 필요 없다.** `scripts/generate-search-index.ts:30`이 이미 모든 ` ``` ` 코드 블록을 인덱싱 전에 제거한다. ` ```quiz `도 자동으로 걸러진다. Task 6에서 확인만 한다.
- **RSS는 필터가 필요하다.** 계획 단계에서는 excerpt만 싣는다고 잘못 파악했으나, 실제로는 `scripts/generators/rss.ts`가 `content:encoded`로 본문 전체를 실어 퀴즈 YAML(정답 포함)이 노출된다. 최종 리뷰에서 발견되어 quiz 펜스만 제거하는 필터를 추가했다 (스펙 8장의 조건부 규칙 적용).
- 브랜치 `feat/interactive-quiz`가 이미 존재하고 스펙 커밋(`5039fee`)이 있다. 모든 작업은 이 브랜치에서 한다.
- 기존 퀴즈 위치: `contents/go/go-fx-의존성-주입/index.md:645-718`(# 5. 퀴즈 ~ # 6. 직전), 같은 폴더 `index_en.md:645` 부근(# 5. Quiz), `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md:850-923`과 그 `index_en.md`. 각 10문항 `<details>` 서술형.

## File Structure

| 파일 | 작업 | 책임 |
|------|------|------|
| `lib/quiz.ts` | Create | 문항 타입 정의 + YAML 파싱·검증 (`parseQuiz`) |
| `lib/i18n/dictionaries.ts` | Modify | `quiz` 라벨 섹션 추가 |
| `components/article/quiz.tsx` | Create | 퀴즈 세트 UI (상태·판정·점수·다시 풀기) |
| `components/article/quiz-renderer.tsx` | Create | `useQuizPortals` 훅 — 코드 블록 탐색 → portal 마운트 |
| `components/article/mermaid-renderer.tsx` | Modify | 컴포넌트 → `useMermaid` 훅으로 역할 축소 |
| `components/article/article-body.tsx` | Create | 본문 HTML 소유 + 두 후처리 훅 조율 |
| `app/[slug]/page.tsx`, `app/en/[slug]/page.tsx` | Modify | `MermaidRenderer` → `ArticleBody` 교체 |
| `contents/go/go-fx-의존성-주입/index.md`, `index_en.md` | Modify | 퀴즈 변환 |
| `contents/cloud/grafana-완벽-가이드-1-.../index.md`, `index_en.md` | Modify | 퀴즈 변환 |
| `CLAUDE.md` | Modify | 퀴즈 작성 가이드 절 |

---

## Task 1: 문항 타입과 파서 (`lib/quiz.ts`)

**Files:**
- Create: `lib/quiz.ts`
- Modify: `package.json` (`yaml` 의존성)

- [ ] **Step 1: 의존성 추가**

```bash
cd /Users/frankoh/src/workspace_blog/blog-v2.advenoh.pe.kr
npm install yaml
```

Expected: `package.json` dependencies에 `yaml` 추가. 다른 패키지 변동 없음(`git diff package.json`으로 확인).

- [ ] **Step 2: `lib/quiz.ts` 작성**

```typescript
import { parse } from 'yaml';

/** 객관식. answer는 0부터 세는 정답 인덱스 */
export interface McqQuestion {
  type: 'mcq';
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

/** OX. answer가 true면 O가 정답 */
export interface OxQuestion {
  type: 'ox';
  q: string;
  answer: boolean;
  explain: string;
}

/** 코드 결과 맞히기. mcq에 코드 블록이 붙은 형태 */
export interface CodeQuestion {
  type: 'code';
  q: string;
  lang: string;
  code: string;
  choices: string[];
  answer: number;
  explain: string;
}

/** 빈칸 채우기. q의 빈칸은 ___(밑줄 3개). answer는 허용 답 배열 */
export interface BlankQuestion {
  type: 'blank';
  q: string;
  answer: string[];
  explain: string;
}

export type QuizQuestion = McqQuestion | OxQuestion | CodeQuestion | BlankQuestion;

/** blank 답 비교용 정규화: 앞뒤 공백 제거 + 소문자화 */
export function normalizeBlankAnswer(value: string): string {
  return value.trim().toLowerCase();
}

/** blank 입력이 허용 답 중 하나와 일치하는가 */
export function isBlankCorrect(input: string, accepted: string[]): boolean {
  const normalized = normalizeBlankAnswer(input);
  return accepted.some((a) => normalizeBlankAnswer(a) === normalized);
}

function isValidQuestion(item: unknown): item is QuizQuestion {
  if (typeof item !== 'object' || item === null) return false;
  const it = item as Record<string, unknown>;
  if (typeof it.q !== 'string' || !it.q) return false;
  if (typeof it.explain !== 'string' || !it.explain) return false;

  switch (it.type) {
    case 'mcq':
      return (
        Array.isArray(it.choices) &&
        it.choices.length >= 2 &&
        it.choices.every((c) => typeof c === 'string') &&
        typeof it.answer === 'number' &&
        Number.isInteger(it.answer) &&
        it.answer >= 0 &&
        it.answer < it.choices.length
      );
    case 'ox':
      return typeof it.answer === 'boolean';
    case 'code':
      return (
        typeof it.lang === 'string' &&
        typeof it.code === 'string' &&
        Array.isArray(it.choices) &&
        it.choices.length >= 2 &&
        it.choices.every((c) => typeof c === 'string') &&
        typeof it.answer === 'number' &&
        Number.isInteger(it.answer) &&
        it.answer >= 0 &&
        it.answer < it.choices.length
      );
    case 'blank':
      return (
        Array.isArray(it.answer) &&
        it.answer.length >= 1 &&
        it.answer.every((a) => typeof a === 'string')
      );
    default:
      return false;
  }
}

/**
 * quiz 코드펜스의 YAML 소스를 문항 배열로 파싱한다.
 * YAML 전체가 깨졌으면 빈 배열을 반환한다(호출부가 원래 코드 블록을 유지).
 * 개별 문항이 깨졌으면 그 문항만 건너뛰고 콘솔 경고를 남긴다.
 */
export function parseQuiz(source: string): QuizQuestion[] {
  let raw: unknown;
  try {
    raw = parse(source);
  } catch (error) {
    console.warn('퀴즈 YAML 파싱 실패:', error);
    return [];
  }
  if (!Array.isArray(raw)) {
    console.warn('퀴즈 YAML이 배열이 아니다:', typeof raw);
    return [];
  }
  const valid: QuizQuestion[] = [];
  raw.forEach((item, index) => {
    if (isValidQuestion(item)) {
      valid.push(item);
    } else {
      console.warn(`퀴즈 ${index + 1}번 문항이 형식에 맞지 않아 건너뛴다:`, item);
    }
  });
  return valid;
}
```

- [ ] **Step 3: 인라인 스크립트로 파서 검증**

```bash
npx tsx -e "
import { parseQuiz, isBlankCorrect } from './lib/quiz';
import assert from 'node:assert';

const src = \`
- type: mcq
  q: '질문1'
  choices: ['a', 'b', 'c', 'd']
  answer: 1
  explain: '해설'
- type: ox
  q: '질문2'
  answer: false
  explain: '해설'
- type: code
  q: '출력은?'
  lang: go
  code: |
    fmt.Println(1)
  choices: ['1', '2']
  answer: 0
  explain: '해설'
- type: blank
  q: '___ 방식'
  answer: ['pull', '풀']
  explain: '해설'
\`;
const qs = parseQuiz(src);
assert.equal(qs.length, 4);
assert.equal(qs[0].type, 'mcq');
assert.equal(qs[2].type === 'code' && qs[2].code.trim(), 'fmt.Println(1)');

// 깨진 문항은 건너뛰고 나머지는 살린다
const partial = parseQuiz(\`
- type: mcq
  q: '정답 인덱스 초과'
  choices: ['a', 'b']
  answer: 5
  explain: 'x'
- type: ox
  q: '정상'
  answer: true
  explain: 'o'
\`);
assert.equal(partial.length, 1);
assert.equal(partial[0].type, 'ox');

// YAML 전체 파손 → 빈 배열
assert.equal(parseQuiz('{{{{').length, 0);

// blank 정규화: 대소문자·공백 무시
assert.ok(isBlankCorrect('  Pull ', ['pull', '풀']));
assert.ok(isBlankCorrect('풀', ['pull', '풀']));
assert.ok(!isBlankCorrect('push', ['pull', '풀']));

console.log('lib/quiz.ts OK');
"
```

Expected: `lib/quiz.ts OK` 출력. (깨진 문항 경고 2줄이 함께 찍히는 것은 정상)

- [ ] **Step 4: 타입 체크 후 커밋**

```bash
npm run check
git add lib/quiz.ts package.json package-lock.json
git commit -m "feat: 퀴즈 문항 타입과 YAML 파서 추가

* mcq/ox/code/blank 4유형 타입 정의와 필드 검증
* 깨진 문항은 건너뛰고 YAML 전체 파손 시 빈 배열 반환
* blank 답 비교는 공백 제거 후 소문자 비교"
```

---

## Task 2: i18n 라벨과 퀴즈 UI (`components/article/quiz.tsx`)

**Files:**
- Modify: `lib/i18n/dictionaries.ts`
- Create: `components/article/quiz.tsx`

- [ ] **Step 1: 사전에 quiz 라벨 추가**

`lib/i18n/dictionaries.ts`의 `Dict` 타입에 아래를 추가한다 (`slides` 다음):

```typescript
  quiz: {
    check: string;
    retry: string;
    correct: string;
    incorrect: string;
    answerPrefix: string;
    scoreTemplate: string; // {score}, {total} 치환
    blankPlaceholder: string;
    o: string;
    x: string;
  };
```

`ko` 객체에 추가:

```typescript
  quiz: {
    check: '확인',
    retry: '다시 풀기',
    correct: '정답',
    incorrect: '오답',
    answerPrefix: '정답:',
    scoreTemplate: '{score} / {total} 맞았습니다',
    blankPlaceholder: '답을 입력하세요',
    o: 'O',
    x: 'X',
  },
```

`en` 객체에 추가:

```typescript
  quiz: {
    check: 'Check',
    retry: 'Try again',
    correct: 'Correct',
    incorrect: 'Incorrect',
    answerPrefix: 'Answer:',
    scoreTemplate: '{score} / {total} correct',
    blankPlaceholder: 'Type your answer',
    o: 'O',
    x: 'X',
  },
```

- [ ] **Step 2: `components/article/quiz.tsx` 작성**

```tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDictionary } from '@/lib/i18n/dictionaries';
import type { Lang } from '@/lib/i18n/lang';
import { isBlankCorrect, type QuizQuestion } from '@/lib/quiz';

interface QuizProps {
  questions: QuizQuestion[];
  lang: Lang;
}

/** 문항별 응답 상태. null이면 아직 안 풂 */
type Answer = { value: number | boolean | string; correct: boolean } | null;

export function Quiz({ questions, lang }: QuizProps) {
  const t = getDictionary(lang).quiz;
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));

  const answeredCount = answers.filter((a) => a !== null).length;
  const score = answers.filter((a) => a?.correct).length;
  const finished = answeredCount === questions.length;

  const submit = (index: number, value: number | boolean | string, correct: boolean) => {
    setAnswers((prev) => {
      if (prev[index] !== null) return prev; // 답 변경 불가
      const next = [...prev];
      next[index] = { value, correct };
      return next;
    });
  };

  const reset = () => setAnswers(questions.map(() => null));

  return (
    <div className="not-prose my-8 space-y-6">
      {questions.map((question, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={question}
          answer={answers[i]}
          onSubmit={submit}
          t={t}
        />
      ))}

      {finished && (
        <div className="rounded-lg border bg-muted/50 p-6 text-center">
          <p className="text-lg font-semibold">
            {t.scoreTemplate
              .replace('{score}', String(score))
              .replace('{total}', String(questions.length))}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
            {t.retry}
          </Button>
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  index: number;
  question: QuizQuestion;
  answer: Answer;
  onSubmit: (index: number, value: number | boolean | string, correct: boolean) => void;
  t: ReturnType<typeof getDictionary>['quiz'];
}

function QuestionCard({ index, question, answer, onSubmit, t }: QuestionCardProps) {
  const done = answer !== null;

  return (
    <div className="rounded-lg border p-5">
      <p className="font-medium">
        <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
        {question.q}
      </p>

      {question.type === 'code' && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>{question.code}</code>
        </pre>
      )}

      <div className="mt-4">
        {(question.type === 'mcq' || question.type === 'code') && (
          <ChoiceList
            choices={question.choices}
            correctIndex={question.answer}
            selected={done ? (answer.value as number) : null}
            onSelect={(choice) => onSubmit(index, choice, choice === question.answer)}
          />
        )}

        {question.type === 'ox' && (
          <ChoiceList
            choices={[t.o, t.x]}
            correctIndex={question.answer ? 0 : 1}
            selected={done ? ((answer.value as boolean) ? 0 : 1) : null}
            onSelect={(choice) => onSubmit(index, choice === 0, (choice === 0) === question.answer)}
            row
          />
        )}

        {question.type === 'blank' && (
          <BlankInput
            done={done}
            value={done ? String(answer.value) : ''}
            placeholder={t.blankPlaceholder}
            checkLabel={t.check}
            onSubmit={(input) => onSubmit(index, input, isBlankCorrect(input, question.answer))}
          />
        )}
      </div>

      {done && (
        <div
          className={cn(
            'mt-4 rounded-md border p-3 text-sm',
            answer.correct
              ? 'border-green-600/40 bg-green-500/10'
              : 'border-red-600/40 bg-red-500/10'
          )}
        >
          <p className="flex items-center gap-1.5 font-semibold">
            {answer.correct ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" /> {t.correct}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" /> {t.incorrect}
              </>
            )}
          </p>
          {!answer.correct && question.type === 'blank' && (
            <p className="mt-1 text-muted-foreground">
              {t.answerPrefix} {question.answer[0]}
            </p>
          )}
          <p className="mt-1.5">{question.explain}</p>
        </div>
      )}
    </div>
  );
}

interface ChoiceListProps {
  choices: string[];
  correctIndex: number;
  selected: number | null; // null이면 미응답
  onSelect: (index: number) => void;
  row?: boolean;
}

function ChoiceList({ choices, correctIndex, selected, onSelect, row }: ChoiceListProps) {
  const done = selected !== null;
  return (
    <div className={cn('gap-2', row ? 'flex' : 'flex flex-col')}>
      {choices.map((choice, i) => {
        const isCorrect = done && i === correctIndex;
        const isWrongPick = done && i === selected && i !== correctIndex;
        return (
          <button
            key={i}
            type="button"
            disabled={done}
            onClick={() => onSelect(i)}
            className={cn(
              'rounded-md border px-4 py-2 text-left text-sm transition-colors',
              row && 'min-w-16 text-center font-semibold',
              !done && 'hover:bg-accent hover:text-accent-foreground',
              isCorrect && 'border-green-600 bg-green-500/10',
              isWrongPick && 'border-red-600 bg-red-500/10',
              done && !isCorrect && !isWrongPick && 'opacity-60'
            )}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

interface BlankInputProps {
  done: boolean;
  value: string;
  placeholder: string;
  checkLabel: string;
  onSubmit: (input: string) => void;
}

function BlankInput({ done, value, placeholder, checkLabel, onSubmit }: BlankInputProps) {
  const [input, setInput] = useState('');
  const submit = () => {
    if (input.trim()) onSubmit(input);
  };
  return (
    <div className="flex gap-2">
      <Input
        value={done ? value : input}
        disabled={done}
        placeholder={placeholder}
        className="max-w-64"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      {!done && (
        <Button variant="secondary" size="sm" onClick={submit}>
          {checkLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크 후 커밋**

```bash
npm run check
git add lib/i18n/dictionaries.ts components/article/quiz.tsx
git commit -m "feat: 퀴즈 세트 UI 컴포넌트 추가

* 4유형 문항 렌더, 즉시 판정과 해설, 답 변경 불가
* 전 문항 응답 시 점수 카드와 다시 풀기
* ko/en 라벨을 i18n 사전에 추가"
```

---

## Task 3: 본문 컨테이너와 portal 연결

**Files:**
- Modify: `components/article/mermaid-renderer.tsx`
- Create: `components/article/quiz-renderer.tsx`
- Create: `components/article/article-body.tsx`
- Modify: `app/[slug]/page.tsx:12,174`
- Modify: `app/en/[slug]/page.tsx:12,175`

- [ ] **Step 1: `mermaid-renderer.tsx`를 훅으로 전환**

현재 파일은 `MermaidRenderer` 컴포넌트가 컨테이너 div + `dangerouslySetInnerHTML`을 소유한다. 이를 훅 `useMermaid`로 바꾼다. **effect 내부 로직(수집→병렬 렌더→교체)은 한 줄도 바꾸지 않는다.** 바뀌는 것은 껍데기뿐이다:

```tsx
'use client';

import { useEffect, type RefObject } from 'react';
import { useTheme } from 'next-themes';
import mermaid from 'mermaid';

/**
 * 컨테이너 안의 code.language-mermaid 블록을 SVG로 교체한다.
 * ArticleBody가 본문 HTML을 소유하고 이 훅을 호출한다.
 */
export function useMermaid(containerRef: RefObject<HTMLDivElement | null>, html: string) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // ... 기존 MermaidRenderer의 useEffect 본문을 그대로 옮긴다 ...
  }, [containerRef, html, resolvedTheme]);
}
```

기존 파일 하단의 `return (<div ref=... dangerouslySetInnerHTML=... />)` 부분은 삭제한다 (ArticleBody로 이동).

- [ ] **Step 2: `components/article/quiz-renderer.tsx` 작성**

```tsx
'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { parseQuiz, type QuizQuestion } from '@/lib/quiz';
import type { Lang } from '@/lib/i18n/lang';
import { Quiz } from './quiz';

interface QuizMount {
  key: string;
  container: HTMLElement;
  questions: QuizQuestion[];
}

/**
 * 컨테이너 안의 code.language-quiz 블록을 찾아 문항을 파싱하고,
 * pre를 마운트 포인트로 교체한 뒤 portal 배열을 반환한다.
 * 파싱 결과가 비면(YAML 파손) 코드 블록을 그대로 둔다.
 */
export function useQuizPortals(
  containerRef: RefObject<HTMLDivElement | null>,
  html: string,
  lang: Lang
) {
  const [mounts, setMounts] = useState<QuizMount[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const codes = Array.from(
      container.querySelectorAll<HTMLElement>('code.language-quiz')
    );
    const next: QuizMount[] = [];

    codes.forEach((code, index) => {
      const questions = parseQuiz(code.textContent || '');
      if (questions.length === 0) return; // 파손 → 원본 코드 블록 유지

      const pre = code.closest('pre');
      if (!pre || !document.contains(pre)) return;

      const mount = document.createElement('div');
      mount.className = 'quiz-mount';
      pre.replaceWith(mount);
      next.push({ key: `quiz-${index}`, container: mount, questions });
    });

    setMounts(next);
    return () => setMounts([]);
  }, [containerRef, html]);

  return mounts.map((m) =>
    createPortal(<Quiz key={m.key} questions={m.questions} lang={lang} />, m.container)
  );
}
```

- [ ] **Step 3: `components/article/article-body.tsx` 작성**

```tsx
'use client';

import { useRef } from 'react';
import type { Lang } from '@/lib/i18n/lang';
import { useMermaid } from './mermaid-renderer';
import { useQuizPortals } from './quiz-renderer';

interface ArticleBodyProps {
  html: string;
  lang: Lang;
}

/**
 * 본문 HTML을 렌더하고 mermaid(SVG 교체)·quiz(portal) 후처리를 조율한다.
 * 후처리 둘이 같은 DOM을 만지므로 소유권을 이 컴포넌트 하나로 모은다.
 */
export function ArticleBody({ html, lang }: ArticleBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useMermaid(containerRef, html);
  const quizPortals = useQuizPortals(containerRef, html, lang);

  return (
    <>
      <div
        ref={containerRef}
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {quizPortals}
    </>
  );
}
```

주의: `prose prose-lg dark:prose-invert max-w-none` 클래스는 기존 `MermaidRenderer`의 것을 그대로 가져온다.

- [ ] **Step 4: 페이지 2곳 교체**

`app/[slug]/page.tsx`:
- 12행 import를 `import { ArticleBody } from '@/components/article/article-body';`로
- 174행을 `<ArticleBody html={article.html} lang="ko" />`로

`app/en/[slug]/page.tsx`:
- 12행 import 동일 교체
- 175행을 `<ArticleBody html={article.html} lang="en" />`로

- [ ] **Step 5: mermaid 회귀 확인**

```bash
npm run check
npm run dev
```

브라우저에서 `http://localhost:3000/mermaid-다이어그램-완벽-가이드/` 를 열어 다이어그램이 SVG로 렌더되는지, 라이트/다크 전환 시 테마가 따라오는지 확인한다. (퀴즈 동작 확인은 변환된 글이 생기는 Task 4에서)

- [ ] **Step 6: 커밋**

```bash
git add components/article/mermaid-renderer.tsx components/article/quiz-renderer.tsx components/article/article-body.tsx 'app/[slug]/page.tsx' 'app/en/[slug]/page.tsx'
git commit -m "feat: 본문 컨테이너 신설하고 퀴즈 portal 연결

* 본문 HTML 소유권을 ArticleBody로 모으고 mermaid를 훅으로 전환
* code.language-quiz 블록을 찾아 Quiz 컴포넌트를 portal로 마운트
* YAML 파손 시 원본 코드 블록 유지 (Mermaid 실패 처리와 동일)"
```

---

## Task 3 실행 중 발견된 수정 사항 (반영 완료)

계획에 없었지만 리뷰·검증에서 드러나 Task 3 범위로 반영된 것들:

1. **인라인 `{ __html: html }` 객체가 퀴즈를 파괴한다 (Critical).** React는 `dangerouslySetInnerHTML`을 참조 동등성으로 비교하므로, 인라인 객체를 쓰면 `setMounts` 재렌더마다 innerHTML이 재적용되어 방금 삽입한 mount가 사라진다. 프로덕션에서도 재현된다. → `useMemo(() => ({ __html: html }), [html])`로 안정화.
2. **`pre.replaceWith(mount)`는 StrictMode 이중 effect에서 깨진다.** 첫 실행이 소스를 없애 두 번째 스캔이 빈손이 된다. → 숨김+삽입(`pre.style.display='none'; pre.after(mount)`)과 cleanup 복원의 가역 패턴으로 교체.
3. **`rehype-prism-plus`가 미등록 언어에서 예외를 던진다.** `quiz` 펜스가 든 글은 `getArticle`이 null을 반환해 **글 전체가 404**가 된다. → `lib/markdown.ts`의 rehypePrism 옵션에 `ignoreMissing: true` 추가. Task 4~5의 전제 조건.

교훈: 후처리 결과물을 확인할 때는 mermaid처럼 이미 되는 것 말고 **새로 만든 것(quiz 블록)이 실제 화면에 뜨는지**를 봐야 한다. Task 4~5의 브라우저 확인은 반드시 `npm run build` + `npx serve out`으로 한다 (이 환경의 `npm run dev`는 동적 slug 라우트에서 500 — 기존 문제).

---

## Task 4: go-fx 글 퀴즈 변환 (한/영)

**Files:**
- Modify: `contents/go/go-fx-의존성-주입/index.md:645-718`
- Modify: `contents/go/go-fx-의존성-주입/index_en.md` (# 5. Quiz 절)

- [ ] **Step 1: 한국어 문항 변환**

`# 5. 퀴즈` 절의 안내문과 `<details>` 10개를 전부 삭제하고, 새 안내문 한 줄 + ` ```quiz ` 블록 하나로 교체한다. **기존 답변(`**A.** ...`)의 내용과 절 참조를 `explain`으로 옮긴다. 새로운 사실을 지어내지 않는다.**

10문항의 유형 배분은 아래를 따른다. 기존 질문·답변 텍스트는 해당 파일 645-718행에 있다.

| 기존 | 유형 | 변환 방침 |
|------|------|----------|
| Q1 (Provide만 있으면 실행 안 됨) | code | 기존 질문 상황을 짧은 fx 코드로 제시하고 "실행하면?"의 4지선다로 |
| Q2 (Provide vs Supply) | mcq | 차이 설명 4지선다 (오답: 그럴듯한 혼동 3개) |
| Q3 (호출 순서 결정) | mcq | 4지선다 |
| Q4 (서버는 언제 뜨나) | mcq | 시점 4지선다 |
| Q5 (Module 간 격리 누락) | blank | 답: `fx.Private` (기존 답변 확인 후 허용 표기 배열로) |
| Q6 (코드 수정 없이 로깅) | blank | 답: `fx.Decorate` (동일) |
| Q7 (같은 타입 두 개 주입) | blank | 답: `name` 태그 계열 표기 |
| Q8 (셋 다 주입, name 태그로 되나) | ox | 답: X — group 태그를 쓴다 |
| Q9 (Replace만으로 부족) | mcq | 4지선다 |
| Q10 (Invoke vs Populate) | mcq | 2지선다 허용 |

변환 예시 (Q1 전문 — 이 수준으로 나머지도 작성한다):

````markdown
# 5. 퀴즈

여기까지 읽었으면 풀 수 있는 문제들이다. 답을 고르면 바로 해설이 나온다.

```quiz
- type: code
  q: "이 앱을 실행하면 어떻게 되나?"
  lang: go
  code: |
    fx.New(
        fx.Provide(config.New, database.New, server.New),
    ).Run()
  choices:
    - "생성자들이 등록 순서대로 실행된다"
    - "아무 생성자도 실행되지 않는다"
    - "의존성 순서에 따라 실행된다"
    - "순환 의존성 에러가 난다"
  answer: 1
  explain: "fx.Provide는 등록만 하고 실행은 미루는 lazy 등록이다. 그래프가 조립되려면 그 타입을 요구하는 fx.Invoke가 있어야 하는데 하나도 없으므로 어떤 생성자도 호출되지 않는다. (2.2절)"
```
````

blank 문항의 `q`는 `___`(밑줄 3개)가 들어가는 문장으로 다시 쓴다. 예: `"다른 Module에 새어 나가면 안 되는 등록은 ___ 로 감싼다"`.

- [ ] **Step 2: 영어 문항 변환**

`index_en.md`의 `# 5. Quiz` 절을 같은 방식으로 교체한다. 문항 수·유형 배분·정답은 한국어판과 동일해야 하고, 텍스트는 기존 영문 답변을 활용해 자연스러운 영어로 쓴다.

- [ ] **Step 3: 확인**

```bash
grep -c "<details>" contents/go/go-fx-의존성-주입/index.md contents/go/go-fx-의존성-주입/index_en.md
```

Expected: 둘 다 `0`

```bash
npx tsx -e "
import { parseQuiz } from './lib/quiz';
import fs from 'node:fs';
for (const f of ['contents/go/go-fx-의존성-주입/index.md', 'contents/go/go-fx-의존성-주입/index_en.md']) {
  const md = fs.readFileSync(f, 'utf-8');
  const m = md.match(/\`\`\`quiz\n([\s\S]*?)\`\`\`/);
  if (!m) throw new Error(f + ': quiz 블록 없음');
  const qs = parseQuiz(m[1]);
  if (qs.length !== 10) throw new Error(f + ': 문항 ' + qs.length + '개 (10개여야 함)');
  console.log(f, 'OK -', qs.map(q => q.type).join(','));
}
"
```

Expected: 두 파일 모두 `OK - code,mcq,mcq,mcq,blank,blank,blank,ox,mcq,mcq`

브라우저에서 `http://localhost:3000/go-fx-의존성-주입/`과 `http://localhost:3000/en/go-fx-의존성-주입/`을 열어: 4유형 렌더·판정·해설·점수·다시 풀기, 라이트/다크 모두 확인.

- [ ] **Step 4: 커밋**

```bash
git add contents/go/go-fx-의존성-주입/
git commit -m "docs: go-fx 글 퀴즈를 인터랙티브 형식으로 변환

* details 서술형 10문항을 mcq/ox/code/blank 혼합으로 재작성 (한/영)
* 기존 답변 내용과 절 참조를 explain으로 이관"
```

---

## Task 5: grafana 글 퀴즈 변환 (한/영)

**Files:**
- Modify: `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md:850-923`
- Modify: 같은 폴더 `index_en.md` (# 5. Quiz 절)

- [ ] **Step 1: 한국어 문항 변환**

Task 4와 같은 방식. 유형 배분:

| 기존 | 유형 | 변환 방침 |
|------|------|----------|
| Q1 (타겟 죽음 감지) | mcq | 4지선다 |
| Q2 (Counter 리셋과 rate) | mcq | 4지선다 |
| Q3 (le="0.5" 버킷) | mcq | 보기: 0.5초 이하 / 0.5초 초과 / 정확히 0.5초 / 0.5~1.0초 |
| Q4 (Histogram vs Summary) | mcq | 2지선다 + 이유가 틀린 오답 2개로 4지선다 구성 |
| Q5 (user_id Label) | ox | "user_id를 Label로 써도 된다" → X (cardinality) |
| Q6 (rate에 range vector) | code | 기존 질문의 PromQL을 code로 제시, lang: promql |
| Q7 (status=~"5..") | mcq | 4지선다 |
| Q8 (sum vs sum by) | mcq | 4지선다 |
| Q9 (localhost vs 서비스명) | blank | 답: 컨테이너/도커 네트워크 계열 표기 — 기존 답변 확인 후 허용 배열 결정 |
| Q10 (패널 비었을 때 확인 순서) | mcq | 4지선다 |

- [ ] **Step 2: 영어 문항 변환** — Task 4 Step 2와 동일 규칙.

- [ ] **Step 3: 확인**

```bash
grep -c "<details>" "contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index.md" "contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/index_en.md"
```

Expected: 둘 다 `0`

Task 4 Step 3의 tsx 스크립트를 grafana 두 파일로 바꿔 실행. Expected: 두 파일 모두 문항 10개, 유형 `mcq,mcq,mcq,mcq,ox,code,mcq,mcq,blank,mcq`

브라우저에서 두 언어 페이지 확인.

- [ ] **Step 4: 커밋**

```bash
git add "contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/"
git commit -m "docs: grafana 글 퀴즈를 인터랙티브 형식으로 변환

* details 서술형 10문항을 mcq/ox/code/blank 혼합으로 재작성 (한/영)"
```

---

## Task 6: CLAUDE.md 가이드와 최종 검증

**Files:**
- Modify: `CLAUDE.md` (Content Management 절 안, "슬라이드 데크 (선택)" 다음)

- [ ] **Step 1: 작성 가이드 추가**

````markdown
### 퀴즈 (선택)

글에 인터랙티브 퀴즈를 넣으려면 본문에 ` ```quiz ` 코드펜스를 열고 YAML로 문항을 적는다. 클라이언트에서 퀴즈 UI로 렌더되며, 보기를 고르면 즉시 판정·해설이 나오고 세트 단위로 점수가 집계된다.

유형은 4가지: `mcq`(객관식, `answer`는 0부터 인덱스), `ox`(`answer`: true/false), `code`(`lang`+`code` 블록이 붙는 객관식), `blank`(빈칸 `___`, `answer`는 허용 답 배열 — 공백·대소문자 무시 비교).

규칙:
- `explain`은 전 유형 필수. 관련 절 안내("(2.2절)")를 포함한다
- 세트당 10문항 권장, 4유형을 섞는다
- 영문판(`index_en.md`)에도 같은 문항 수·유형·정답으로 작성한다
- 블록을 글 중간에 여러 개 둘 수 있고 세트마다 점수가 따로 난다
- YAML이 깨지면 그 블록은 코드 블록으로 노출되므로 저장 전 파싱 확인

형식 예시와 필드 정의: `docs/superpowers/specs/2026-08-07-interactive-quiz-design.md`
````

- [ ] **Step 2: 최종 검증**

```bash
npm run check
npm run build
```

Expected: 둘 다 성공.

```bash
# 빌드 HTML에 퀴즈가 코드 블록으로 존재 (클라이언트 교체 전 상태)
grep -l "language-quiz" out/go-fx-의존성-주입/index.html out/en/go-fx-의존성-주입/index.html

# 검색 인덱스에 퀴즈 YAML이 없음 (기존 코드펜스 제거 로직 확인)
grep -c "type: mcq" out/search-index.json || echo "OK: 인덱스에 퀴즈 없음"
grep -c "explain:" out/search-index.json || echo "OK: 인덱스에 해설 없음"
```

Expected: grep -l은 두 파일 출력, 아래 둘은 `OK: ...` 출력.

```bash
npm start
```

빌드 결과물에서 네 페이지(go-fx·grafana × ko/en)를 열어 퀴즈 동작과 라이트/다크를 최종 확인.

- [ ] **Step 3: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: 퀴즈 작성 가이드 추가"
```

---

## Task 7: PR 생성

**Files:** 없음 (git 작업만)

- [ ] **Step 1: push와 PR 생성**

```bash
git push -u origin feat/interactive-quiz
gh pr create --assignee kenshin579 --base main --title "feat: 블로그 퀴즈를 인터랙티브 형식으로 전환" --body "$(cat <<'EOF'
## 배경

글의 퀴즈가 details 접기 서술형이라 상호작용이 없었습니다. 객관식·OX·코드 결과·빈칸 4유형의 실제 퀴즈로 바꾸고, 보기를 고르면 즉시 판정·해설이 나오며 세트를 다 풀면 점수가 집계됩니다.

## 변경 사항

* 마크다운 quiz 코드펜스 + 클라이언트 portal 교체 (Mermaid와 같은 패턴)
* lib/quiz.ts: 4유형 타입과 YAML 파싱·검증 (깨진 문항은 건너뛰고 원본 유지)
* components/article/: Quiz UI, quiz-renderer(portal), article-body(본문 소유권 통합), mermaid-renderer 훅 전환
* 기존 퀴즈 2편(go-fx, grafana) 한/영 40문항을 4유형 혼합으로 변환
* CLAUDE.md 퀴즈 작성 가이드, i18n 라벨(ko/en) 추가
* 의존성: yaml 추가

점수는 메모리에서만 유지하고 저장하지 않습니다. 검색 인덱스는 기존 코드펜스 제거 로직이 퀴즈 블록도 걸러내는 것을 확인했습니다.

## 테스트 계획

- [ ] npm run check / npm run build 통과
- [ ] 4개 페이지(go-fx·grafana × ko/en)에서 4유형 판정·해설·점수·다시 풀기 동작
- [ ] 라이트/다크 모드 확인
- [ ] mermaid 다이어그램 회귀 없음
- [ ] search-index.json에 퀴즈 YAML 미포함

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01ECYScWgZhRSGEbKvWr8Yt4
EOF
)"
```

Expected: PR URL 출력
