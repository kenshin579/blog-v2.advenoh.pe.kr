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
  }, [containerRef, html, lang]);

  return mounts.map((m) =>
    createPortal(<Quiz key={m.key} questions={m.questions} lang={lang} />, m.container)
  );
}
