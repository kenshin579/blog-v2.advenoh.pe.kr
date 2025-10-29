'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TOCItem } from '@/lib/markdown';

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 1.0,
      }
    );

    // 모든 h2, h3 요소 관찰
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    // cleanup
    return () => {
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav className="space-y-1" aria-label="목차">
      <h2 className="text-sm font-semibold mb-4 text-foreground">목차</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              item.level === 2 && 'font-medium',
              item.level === 3 && 'ml-4 text-muted-foreground'
            )}
          >
            <a
              href={`#${item.id}`}
              className={cn(
                "hover:text-primary transition-colors block py-1",
                activeId === item.id && "text-primary font-semibold border-l-2 border-primary pl-3"
              )}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
