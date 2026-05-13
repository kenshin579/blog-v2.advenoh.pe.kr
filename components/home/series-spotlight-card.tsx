import Link from 'next/link';

type Episode = {
  num: number;
  title: string;
  slug: string;
};

type Props = {
  seriesName: string;
  seriesHref: string;
  episodes: Episode[];
};

export function SeriesSpotlightCard({ seriesName, seriesHref, episodes }: Props) {
  return (
    <Link
      href={seriesHref}
      className="col-span-12 flex flex-col rounded-card-xl bg-bento-lavender p-6 text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-4 md:p-7"
    >
      <div className="mb-3">
        <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Series</span>
      </div>
      <h3 className="mt-2 text-xl font-bold tracking-tighter md:text-2xl">{seriesName}</h3>
      <ul className="mt-auto flex flex-col gap-1 pt-6">
        {episodes.map((ep, i) => (
          <li
            key={ep.slug}
            className={`flex items-center gap-3 py-1.5 ${i > 0 ? 'border-t border-bento-ink/10' : ''}`}
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink/10 text-[10px] font-bold text-bento-dim">
              {ep.num}
            </span>
            <span className="line-clamp-1 text-[13px] text-bento-ink">
              {ep.title}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
