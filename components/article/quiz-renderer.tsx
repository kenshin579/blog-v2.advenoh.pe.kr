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
 * pre 옆에 마운트 포인트를 삽입(pre는 숨김)한 뒤 portal 배열을 반환한다.
 * cleanup에서 mount를 제거하고 pre를 복원해 StrictMode의 effect 이중 실행에도
 * 안전하다. 파싱 결과가 비면(YAML 파손) 코드 블록을 그대로 둔다.
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
    const created: { mount: HTMLElement; pre: HTMLElement }[] = [];

    codes.forEach((code, index) => {
      const questions = parseQuiz(code.textContent || '');
      if (questions.length === 0) return; // 파손 → 원본 코드 블록 유지

      const pre = code.closest('pre');
      if (!(pre instanceof HTMLElement) || !document.contains(pre)) return;

      const mount = document.createElement('div');
      mount.className = 'quiz-mount';
      // 교체(replaceWith)가 아니라 숨김+삽입. cleanup에서 복원할 수 있어야
      // StrictMode의 effect 이중 실행에서 두 번째 스캔이 소스를 다시 찾는다.
      pre.style.display = 'none';
      pre.after(mount);
      created.push({ mount, pre });
      next.push({ key: `quiz-${index}`, container: mount, questions });
    });

    setMounts(next);
    return () => {
      created.forEach(({ mount, pre }) => {
        mount.remove();
        pre.style.display = '';
      });
      setMounts([]);
    };
  }, [containerRef, html, lang]);

  return mounts.map((m) =>
    createPortal(<Quiz key={m.key} questions={m.questions} lang={lang} />, m.container)
  );
}
