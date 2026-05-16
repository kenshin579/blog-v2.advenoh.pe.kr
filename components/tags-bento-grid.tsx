'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface TagEntry {
  tag: string;
  count: number;
  categories: string[];
  lastUsed: string;
}

type SortMode = 'count' | 'alpha' | 'recent';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

// rank별 컬러 (sage → butter → rose → lavender → cream 순환)
const COLOR_CYCLE = [
  'bg-bento-sage',
  'bg-bento-butter',
  'bg-bento-rose',
  'bg-bento-lavender',
  'bg-bento-cream',
] as const;

function colorFor(rank: number): string {
  return COLOR_CYCLE[rank % COLOR_CYCLE.length];
}

// rank별 크기 tier
// 0-1: 2-col span large card
// 2-4: 1-col medium card
// 5-10: 1-col compact card
// 11+: 1/2-col compact pill-ish card (small grid)
function tierFor(rank: number): 'xl' | 'lg' | 'md' | 'sm' {
  if (rank < 2) return 'xl';
  if (rank < 5) return 'lg';
  if (rank < 11) return 'md';
  return 'sm';
}

export function TagsBentoGrid({ entries }: { entries: TagEntry[] }) {
  const [sortMode, setSortMode] = useState<SortMode>('count');

  const sorted = useMemo(() => {
    const list = [...entries];
    if (sortMode === 'count') {
      list.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'));
    } else if (sortMode === 'alpha') {
      list.sort((a, b) => a.tag.localeCompare(b.tag, 'ko'));
    } else {
      list.sort((a, b) => b.lastUsed.localeCompare(a.lastUsed) || b.count - a.count);
    }
    return list;
  }, [entries, sortMode]);

  // Split for layout: count-sort일 때만 bento tier가 의미 있음
  const useBento = sortMode === 'count';

  return (
    <section className="mx-auto mt-12 max-w-canvas px-6 md:px-10">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[15px] text-bento-ink">
          <span className="font-semibold">{entries.length}</span>
          <span className="text-bento-dim"> 개의 태그</span>
        </p>
        <div className="flex gap-1 rounded-full bg-bento-ink/[0.06] p-1 dark:bg-white/10">
          <SortTab active={sortMode === 'count'} onClick={() => setSortMode('count')}>
            By count
          </SortTab>
          <SortTab active={sortMode === 'alpha'} onClick={() => setSortMode('alpha')}>
            A → Z
          </SortTab>
          <SortTab active={sortMode === 'recent'} onClick={() => setSortMode('recent')}>
            Recently used
          </SortTab>
        </div>
      </div>

      {useBento ? <BentoLayout sorted={sorted} /> : <FlatLayout sorted={sorted} />}
    </section>
  );
}

function BentoLayout({ sorted }: { sorted: TagEntry[] }) {
  const xl = sorted.slice(0, 2);
  const lg = sorted.slice(2, 5);
  const md = sorted.slice(5, 11);
  const sm = sorted.slice(11);

  return (
    <div className="flex flex-col gap-4">
      {/* XL: 2-col span large cards */}
      {xl.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {xl.map((e, i) => (
            <TagCard key={e.tag} entry={e} rank={i} tier="xl" />
          ))}
        </div>
      )}
      {/* LG: 3-col medium cards */}
      {lg.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {lg.map((e, i) => (
            <TagCard key={e.tag} entry={e} rank={i + 2} tier="lg" />
          ))}
        </div>
      )}
      {/* MD: 3-col compact cards */}
      {md.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {md.map((e, i) => (
            <TagCard key={e.tag} entry={e} rank={i + 5} tier="md" />
          ))}
        </div>
      )}
      {/* SM: 6-col compact cards */}
      {sm.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {sm.map((e, i) => (
            <TagCard key={e.tag} entry={e} rank={i + 11} tier="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

function FlatLayout({ sorted }: { sorted: TagEntry[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {sorted.map((e, i) => (
        <TagCard key={e.tag} entry={e} rank={i} tier="sm" />
      ))}
    </div>
  );
}

function TagCard({
  entry,
  rank,
  tier,
}: {
  entry: TagEntry;
  rank: number;
  tier: 'xl' | 'lg' | 'md' | 'sm';
}) {
  const color = colorFor(rank);

  const sizeStyles = {
    xl: {
      minH: 'min-h-[176px]',
      pad: 'p-7',
      title: 'text-3xl font-bold',
      countBadge: 'h-7 min-w-[2rem] rounded-full bg-bento-ink px-2.5 text-white',
      countText: 'text-[13px] font-semibold',
    },
    lg: {
      minH: 'min-h-[152px]',
      pad: 'p-6',
      title: 'text-2xl font-bold',
      countBadge: 'h-6 min-w-[1.75rem] rounded-full bg-bento-ink/10 px-2 text-bento-ink',
      countText: 'text-[12px] font-semibold',
    },
    md: {
      minH: 'min-h-[88px]',
      pad: 'p-4',
      title: 'text-lg font-bold',
      countBadge: 'h-5 min-w-[1.5rem] rounded-full bg-bento-ink/10 px-1.5 text-bento-ink',
      countText: 'text-[11px] font-semibold',
    },
    sm: {
      minH: 'min-h-[64px]',
      pad: 'p-3.5',
      title: 'text-sm font-semibold',
      countBadge: 'h-5 min-w-[1.5rem] rounded-full bg-bento-ink/10 px-1.5 text-bento-ink',
      countText: 'text-[10px] font-semibold',
    },
  }[tier];

  return (
    <Link
      href={`/tags/${encodeURIComponent(entry.tag)}`}
      className={[
        'group flex flex-col justify-between rounded-card no-underline transition hover:-translate-y-0.5 hover:shadow-md',
        color,
        sizeStyles.minH,
        sizeStyles.pad,
        FOCUS_RING,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={['truncate text-bento-ink', sizeStyles.title].join(' ')}>
          #{entry.tag}
        </span>
        <span
          className={[
            'inline-flex shrink-0 items-center justify-center font-mono',
            sizeStyles.countBadge,
            sizeStyles.countText,
          ].join(' ')}
        >
          {entry.count}
        </span>
      </div>
      {(tier === 'xl' || tier === 'lg') && entry.categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center rounded-full bg-bento-ink/[0.08] px-3 py-1 text-[11px] font-medium text-bento-ink"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition',
        active
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-bg'
          : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white',
        FOCUS_RING,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
