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
  const [resetKey, setResetKey] = useState(0);

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

  const reset = () => {
    setAnswers(questions.map(() => null));
    setResetKey((k) => k + 1); // 전 문항 리마운트 → BlankInput 로컬 상태도 초기화
  };

  return (
    <div className="not-prose my-8 space-y-6">
      {questions.map((question, i) => (
        <QuestionCard
          key={`${resetKey}-${i}`}
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
            numbered
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
          role="status"
          aria-live="polite"
          className={cn(
            'mt-4 rounded-md border p-3 text-sm',
            answer.correct
              ? 'border-green-600/40 dark:border-green-500/40 bg-green-500/10'
              : 'border-red-600/40 dark:border-red-500/40 bg-red-500/10'
          )}
        >
          <p className="flex items-center gap-1.5 font-semibold">
            {answer.correct ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> {t.correct}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" /> {t.incorrect}
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
  /** 보기 앞에 번호를 붙인다. O/X처럼 보기가 자명한 유형에는 쓰지 않는다 */
  numbered?: boolean;
}

function ChoiceList({ choices, correctIndex, selected, onSelect, row, numbered }: ChoiceListProps) {
  const done = selected !== null;
  return (
    <div className={cn('gap-2', row ? 'flex' : 'flex flex-col')}>
      {choices.map((choice, i) => {
        const isCorrect = done && i === correctIndex;
        const isWrongPick = done && i === selected && i !== correctIndex;
        const label = (
          <>
            {choice}
            {isCorrect && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5" />}
          </>
        );
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
              isCorrect && 'border-green-600 dark:border-green-500 bg-green-500/10',
              isWrongPick && 'border-red-600 dark:border-red-500 bg-red-500/10',
              done && !isCorrect && !isWrongPick && 'opacity-60'
            )}
          >
            {numbered ? (
              // 보기가 두 줄로 접힐 때 둘째 줄이 번호 아래로 흐르지 않도록 flex로 건다
              <span className="flex items-start gap-2">
                <span className="shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                <span>{label}</span>
              </span>
            ) : (
              label
            )}
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
