type Props = {
  content: string;
  attribution: string;
  /** 있으면 카드 전체가 새 탭 링크로 동작. 없으면 일반 카드. */
  href?: string;
};

const BASE_CLASSES =
  'col-span-12 flex min-h-[260px] flex-col justify-between rounded-card-xl bg-bento-hero-dark p-7 text-white md:col-span-4 md:min-h-[260px] md:p-8';

const LINK_CLASSES =
  'transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bento-accent';

export function QuoteCard({ content, attribution, href }: Props) {
  const body = (
    <>
      <div
        aria-hidden="true"
        className="text-6xl font-bold leading-none text-bento-accent"
        style={{ lineHeight: 0.7 }}
      >
        &ldquo;
      </div>
      <blockquote className="my-3 font-serif text-lg font-medium leading-tight tracking-tighter md:text-xl [text-wrap:balance]">
        {content}
      </blockquote>
      <cite className="text-xs not-italic text-white/60">{attribution}</cite>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BASE_CLASSES} ${LINK_CLASSES}`}
      >
        {body}
      </a>
    );
  }

  return <div className={BASE_CLASSES}>{body}</div>;
}
