import Link from 'next/link';

type Tone = 'sage' | 'butter' | 'rose' | 'cream';

const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
  cream: 'bg-bento-cream',
};

type Props = {
  href: string;
  title: string;
  category: string;
  tone: Tone;
};

export function RecentCard({ href, title, category, tone }: Props) {
  return (
    <Link
      href={href}
      className={`col-span-6 flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-3 md:min-h-[180px] ${TONE_BG[tone]}`}
    >
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
          {category}
        </div>
        <h4 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
          {title}
        </h4>
      </div>
      <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">&#8594;</div>
    </Link>
  );
}
