'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TOCItem } from '@/lib/markdown';

interface TableOfContentsProps {
  items: TOCItem[];
  /** When true, renders as collapsible <details> (for mobile). Default false = sidebar list */
  collapsible?: boolean;
}

export function TableOfContents({ items, collapsible = false }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback((id: string) => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    setActiveId(id);
    isClickScrollingRef.current = true;
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      {
        rootMargin: '-80px 0px -35% 0px',
        threshold: 0,
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const list = (
    <ul className="flex flex-col border-l border-bento-ink/15 dark:border-white/15">
      {items.map((item) => {
        const active = item.id === activeId;
        const isTopLevel = item.level <= 2;
        return (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 0.75 + 0.75}rem` }}
            className={
              active
                ? '-ml-px border-l-2 border-bento-accent'
                : ''
            }
          >
            <a
              href={`#${item.id}`}
              onClick={() => handleClick(item.id)}
              className={[
                'block py-2 text-[13px] no-underline transition',
                active
                  ? 'font-semibold text-bento-accent'
                  : isTopLevel
                    ? 'font-medium text-bento-ink hover:text-bento-accent'
                    : 'text-bento-dim hover:text-bento-ink',
              ].join(' ')}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (collapsible) {
    return (
      <details className="rounded-card-lg bg-bento-bg">
        <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-bento-dim">
          Contents · {items.length}
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    );
  }

  return (
    <div className="rounded-card-lg bg-bento-bg p-5">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-bento-dim">Contents</div>
      {list}
    </div>
  );
}
