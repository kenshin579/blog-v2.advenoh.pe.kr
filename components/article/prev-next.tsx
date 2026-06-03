import Link from 'next/link';

type Article = {
  slug: string;
  title: string;
};

type Props = {
  prev: Article | null;
  next: Article | null;
  basePath?: string;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function PrevNext({ prev, next, basePath = '' }: Props) {
  if (!prev && !next) return null;

  return (
    <section className="mx-auto mt-6 grid max-w-prose grid-cols-1 gap-3 px-6 md:grid-cols-2 md:px-0">
      {prev ? (
        <Link
          href={`${basePath}/${encodeURIComponent(prev.slug)}`}
          className={[
            'rounded-card bg-bento-cream p-4 no-underline text-bento-ink transition hover:bg-bento-cream/80',
            FOCUS_RING,
          ].join(' ')}
        >
          <div className="text-[11px] text-bento-dim">← 이전</div>
          <div className="mt-1 text-[13px] font-semibold leading-snug">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`${basePath}/${encodeURIComponent(next.slug)}`}
          className={[
            'rounded-card bg-bento-ink p-4 no-underline text-white transition hover:bg-bento-ink/90',
            FOCUS_RING,
          ].join(' ')}
        >
          <div className="text-right text-[11px] text-white/60">다음 →</div>
          <div className="mt-1 text-right text-[13px] font-semibold leading-snug">{next.title}</div>
        </Link>
      ) : (
        <div />
      )}
    </section>
  );
}
