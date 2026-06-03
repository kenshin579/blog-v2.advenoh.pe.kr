import Link from 'next/link';
import { getArticleTitleFromSlug } from '@/lib/articles';

interface ManifestArticle {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
}

interface SeriesNavigationProps {
  seriesName: string;
  articles: ManifestArticle[];
  currentSlug: string;
  basePath?: string;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function SeriesNavigation({
  seriesName,
  articles,
  currentSlug,
  basePath = '',
}: SeriesNavigationProps) {
  return (
    <section className="mx-auto mt-12 max-w-prose px-6 md:px-0">
      <div className="rounded-card-lg border border-bento-ink/10 bg-bento-card p-6 dark:border-white/10">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-bento-dim">
          Series · {seriesName}
        </div>
        <ul className="flex flex-col gap-1">
          {articles.map((article, index) => {
            const isCurrent = article.slug === currentSlug;
            const articleTitle = getArticleTitleFromSlug(article.slug);
            return (
              <li key={article.slug}>
                <Link
                  href={`${basePath}/${encodeURIComponent(articleTitle)}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-card-sm p-2.5 no-underline text-bento-ink transition',
                    isCurrent ? 'bg-bento-lavender' : 'hover:bg-bento-ink/5 dark:hover:bg-white/5',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-[10px] font-bold text-white">
                    {isCurrent ? '★' : article.seriesOrder ?? index + 1}
                  </span>
                  <span className={['text-[13px] leading-snug', isCurrent ? 'font-semibold' : ''].join(' ')}>
                    {article.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
