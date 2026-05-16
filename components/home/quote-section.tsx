'use client';

import { QuoteCard } from '@/components/home/quote-card';
import {
  useQuoteOfTheDay,
  type QuoteViewData,
} from '@/hooks/use-quote-of-the-day';

type Props = {
  /** 빌드 시 정적 HTML에 박히는 명언. fetch 실패/지연 시에도 이 값이 표시된다. */
  fallback: QuoteViewData;
};

export function QuoteSection({ fallback }: Props) {
  const data = useQuoteOfTheDay(fallback);
  return (
    <QuoteCard
      content={data.content}
      attribution={data.attribution}
      href={data.href}
    />
  );
}
