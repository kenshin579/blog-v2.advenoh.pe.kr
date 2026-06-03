'use client';

import { QuoteCard } from '@/components/home/quote-card';
import {
  useQuoteOfTheDay,
  type QuoteViewData,
} from '@/hooks/use-quote-of-the-day';

type Props = {
  /** 빌드 시 정적 HTML에 박히는 명언. fetch 실패/지연 시에도 이 값이 표시된다. */
  fallback: QuoteViewData;
  /** 명언 언어 (기본 ko). en이면 영어 오늘의 명언을 받아온다. */
  language?: 'ko' | 'en';
};

export function QuoteSection({ fallback, language = 'ko' }: Props) {
  const data = useQuoteOfTheDay(fallback, language);
  return (
    <QuoteCard
      content={data.content}
      attribution={data.attribution}
      href={data.href}
    />
  );
}
