'use client';

import { cn } from '@/lib/utils';
import { TOCItem } from '@/lib/markdown';

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
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
              className="hover:text-primary transition-colors block py-1"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
