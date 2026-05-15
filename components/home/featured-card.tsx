import Link from 'next/link';

type Props = {
  href: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
  readTime?: number;
  tags?: string[];
};

export function FeaturedCard({ href, title, category, date, excerpt, readTime, tags }: Props) {
  return (
    <Link
      href={href}
      className="relative col-span-12 row-span-1 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-8 md:row-span-2 md:min-h-[420px] md:p-10"
    >
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-wrap items-center gap-2 text-[11px] text-white/70">
        <span className="rounded-full bg-bento-accent px-3 py-1 font-semibold uppercase tracking-wider text-white">
          ★ Featured
        </span>
        <span className="capitalize">{category}</span>
        <span aria-hidden="true">·</span>
        <span>{date}</span>
        {readTime !== undefined && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readTime} min read</span>
          </>
        )}
      </div>
      <div className="relative">
        <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            {excerpt}
          </p>
        )}
      </div>
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bento-accent px-5 py-2.5 text-[13px] font-semibold text-white">
          Read article
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
