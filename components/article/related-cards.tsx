import Link from 'next/link';

type Tone = 'sage' | 'butter' | 'rose';

const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
};

type Article = {
  slug: string;
  title: string;
  category: string;
};

type Props = {
  articles: Article[];
};

const TONES: Tone[] = ['sage', 'butter', 'rose'];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function RelatedCards({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto mt-12 max-w-canvas px-6 md:px-10">
      <h2 className="mb-4 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
        관련 글
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {articles.slice(0, 3).map((a, i) => (
          <Link
            key={a.slug}
            href={`/${encodeURIComponent(a.slug)}`}
            className={[
              'flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline transition hover:opacity-90 md:min-h-[180px]',
              TONE_BG[TONES[i % TONES.length]],
              FOCUS_RING,
            ].join(' ')}
          >
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
                {a.category}
              </div>
              <h3 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
                {a.title}
              </h3>
            </div>
            <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
