'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { TOCItem } from '@/lib/markdown';

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 클릭 핸들러: 즉시 activeId 설정 및 Observer 일시 비활성화
  const handleClick = useCallback((id: string) => {
    // 이전 타임아웃 정리
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // 즉시 activeId 설정
    setActiveId(id);
    isClickScrollingRef.current = true;

    // 스크롤 완료 후 Observer 다시 활성화 (500ms 후)
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 클릭으로 인한 스크롤 중에는 Observer 무시
        if (isClickScrollingRef.current) {
          return;
        }

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        // scroll-margin-top(80px)에 맞춰 rootMargin 조정
        rootMargin: '-80px 0px -35% 0px',
        threshold: 0,
      }
    );

    // 모든 h1, h2, h3 요소 관찰
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    // cleanup
    return () => {
      observer.disconnect();
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
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
              item.level === 1 && 'font-semibold text-base',
              item.level === 2 && 'ml-2 font-medium',
              item.level === 3 && 'ml-6 text-muted-foreground'
            )}
          >
            <a
              href={`#${item.id}`}
              onClick={() => handleClick(item.id)}
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
