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
      // 목록 페이지(/quiz)의 카드가 /{글}/#quiz 로 링크한다.
      // 헤딩 번호가 글마다 달라 rehype-slug 의 id 를 쓸 수 없으므로 고정 id 를 심는다.
      // next 가 아직 비어 있을 때가 곧 첫 유효 세트다. codes 의 index 로 판정하면
      // 첫 블록이 파싱 실패로 건너뛰어졌을 때 어디에도 id 가 안 붙는다.
      if (next.length === 0) mount.id = 'quiz';
      // 교체(replaceWith)가 아니라 숨김+삽입. cleanup에서 복원할 수 있어야
      // StrictMode의 effect 이중 실행에서 두 번째 스캔이 소스를 다시 찾는다.
      pre.style.display = 'none';
      pre.after(mount);
      created.push({ mount, pre });
      next.push({ key: `quiz-${index}`, container: mount, questions });
    });

    // 클라이언트 마운트라 페이지 로드 시점엔 #quiz 가 없어 브라우저 자동 스크롤이
    // 걸리지 않는다. 마운트 직후 직접 이동시킨다.
    if (next.length > 0 && window.location.hash === '#quiz') {
      const target = next[0].container;
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }

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
