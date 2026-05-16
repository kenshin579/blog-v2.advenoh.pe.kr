'use client';

import { useEffect, useState } from 'react';

import {
  fetchQuoteOfTheDay,
  quoteDetailUrl,
} from '@/lib/inspireme';

export type QuoteViewData = {
  content: string;
  attribution: string;
  /** inspire-me 상세 페이지 절대 URL. fallback 상태일 땐 undefined. */
  href?: string;
};

/**
 * inspire-me의 오늘의 명언을 클라이언트에서 받아온다.
 * - 초기값은 호출자가 주입하는 fallback (정적 HTML에 박혀 있는 명언).
 * - 마운트 후 fetch 성공하면 새 데이터로 교체한다.
 * - 실패하면 fallback을 그대로 유지하고 콘솔에 warn만 남긴다.
 *   (명언은 데코레이션 요소라 사용자에게 에러를 노출하지 않는다.)
 */
export function useQuoteOfTheDay(fallback: QuoteViewData): QuoteViewData {
  const [data, setData] = useState<QuoteViewData>(fallback);

  useEffect(() => {
    let cancelled = false;

    fetchQuoteOfTheDay('ko')
      .then((q) => {
        if (cancelled || !q) return;
        const author = (q.author ?? '').trim();
        const id = (q.id ?? '').trim();
        setData({
          content: q.content,
          attribution: author ? `— ${author}` : fallback.attribution,
          href: id ? quoteDetailUrl(id) : undefined,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // 명언은 비핵심 데코레이션. 실패는 조용히 처리.
        console.warn('[useQuoteOfTheDay] failed to fetch QOTD:', err);
      });

    return () => {
      cancelled = true;
    };
    // fallback.attribution은 author가 비어 있을 때 대체값으로 쓰이므로 의존성에 포함.
  }, [fallback.attribution]);

  return data;
}
