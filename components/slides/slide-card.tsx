import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export interface SlideCardProps {
  /** manifest 의 slug ({category}/{articleDir}) */
  slug: string;
  title: string;
  date: string;
  series?: string;
  slideCount?: number;
  /** 'ko' | 'en' — 발표 화면 경로의 언어 prefix 를 정한다 */
  lang: 'ko' | 'en';
  /** 분량 단위. ko: "장", en: "slides" */
  countLabel: string;
}

export function SlideCard({
  slug,
  title,
  date,
  series,
  slideCount,
  lang,
  countLabel,
}: SlideCardProps) {
  // 글 주소에는 카테고리가 들어가지 않는다. manifest slug 는 {category}/{articleDir} 이므로
  // 뒤쪽만 쓴다 (lib/articles.ts 의 getArticleTitleFromSlug 와 같은 규칙).
  const articleDir = slug.split('/')[1] ?? slug;
  const href = lang === 'en' ? `/en/${articleDir}/slides/` : `/${articleDir}/slides/`;

  return (
    <Link
      href={href}
      className={[
        'col-span-12 flex flex-col rounded-card-xl bg-bento-butter p-6 text-bento-ink no-underline md:col-span-6 md:p-7',
        FOCUS_RING,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Slides</span>
        {slideCount ? (
          <span className="text-xs text-bento-dim">
            {slideCount}
            {countLabel}
          </span>
        ) : null}
      </div>
      <h2 className="mb-4 text-xl font-bold tracking-tighter md:text-2xl">{title}</h2>
      <div className="mt-auto border-t border-bento-ink/10 pt-3">
        {series && (
          <div className="text-[13px] font-medium leading-snug">{series}</div>
        )}
        <div className="mt-1 text-[11px] text-bento-dim">{formatDate(date)}</div>
      </div>
    </Link>
  );
}
