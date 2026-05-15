import Link from 'next/link';

type Item = {
  label: string;
  href?: string;
};

type Props = {
  items: Item[];
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-canvas px-6 pb-4 pt-2 text-xs md:px-10">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-bento-dim">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={['text-bento-dim no-underline hover:text-bento-ink transition', FOCUS_RING].join(' ')}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-bento-accent' : 'text-bento-dim'}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
