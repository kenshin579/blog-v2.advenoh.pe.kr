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
