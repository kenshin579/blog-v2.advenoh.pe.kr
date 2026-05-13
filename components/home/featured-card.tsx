import Link from 'next/link';

type Props = {
  href: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
};

export function FeaturedCard({ href, title, category, date, excerpt }: Props) {
  return (
    <Link
      href={href}
      className="relative col-span-12 row-span-1 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-7 md:row-span-2 md:min-h-[420px] md:p-10"
    >
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
      />
      <div className="relative">
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-bento-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            Featured
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
            {category}
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            {excerpt}
          </p>
        )}
      </div>
      <div className="relative flex items-end justify-between text-xs text-white/70">
        <span>{date}</span>
        <span aria-hidden="true">&#8594;</span>
      </div>
    </Link>
  );
}
