'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="rounded-card-lg border border-bento-ink/10 bg-bento-card p-4 dark:border-white/10">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-bento-dim">Reading</span>
        <span className="font-semibold text-bento-ink">{Math.round(progress)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bento-ink/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-bento-accent transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
