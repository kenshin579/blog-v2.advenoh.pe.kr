'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MiniSearch from 'minisearch';
import { POPULAR } from '@/config/popular-searches';
import {
  type RecentItem,
  getHistory,
  getRecentlyViewed,
  recordSearch,
  recordView,
  clearHistory,
} from '@/lib/cmdk-storage';

// ────────────────────────────────────────────────────────────────────
// Types

type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
};

type Row =
  | { kind: 'article'; slug: string; title: string; category: string; date: string }
  | { kind: 'tag'; tag: string; count: number }
  | { kind: 'popular'; q: string; n: number }
  | { kind: 'history'; q: string };

function urlSlug(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────────────
// Main component

export function CommandK({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [docs, setDocs] = useState<SearchDocument[]>([]);
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);

  useEffect(() => {
    if (!open || miniSearch || indexLoading) return;
    setIndexLoading(true);
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((documents: SearchDocument[]) => {
        const ms = new MiniSearch<SearchDocument>({
          fields: ['title', 'excerpt', 'content', 'tags'],
          storeFields: ['slug', 'title', 'excerpt', 'category', 'tags', 'date'],
          searchOptions: {
            boost: { title: 2, excerpt: 1.5, tags: 1.2 },
            fuzzy: 0.2,
            prefix: true,
          },
        });
        ms.addAll(documents);
        setMiniSearch(ms);
        setDocs(documents);
      })
      .catch((err) => {
        console.warn('[CommandK] failed to load search index:', err);
      })
      .finally(() => setIndexLoading(false));
  }, [open, miniSearch, indexLoading]);

  useEffect(() => {
    if (!open) return;
    setRecentlyViewed(getRecentlyViewed());
    setHistory(getHistory());
    setQuery('');
    setActiveIdx(0);
  }, [open]);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const empty: Row[] = [];
      recentlyViewed.slice(0, 5).forEach((r) =>
        empty.push({ kind: 'article', slug: r.slug, title: r.title, category: r.category, date: r.date }),
      );
      POPULAR.forEach((p) => empty.push({ kind: 'popular', q: p.q, n: p.n }));
      history.slice(0, 5).forEach((h) => empty.push({ kind: 'history', q: h }));
      return empty;
    }

    if (!miniSearch) return [];

    const hits = miniSearch.search(q).slice(0, 6) as unknown as SearchDocument[];
    const articleRows: Row[] = hits.map((h) => ({
      kind: 'article',
      slug: urlSlug(h.slug),
      title: h.title,
      category: h.category,
      date: formatDate(h.date),
    }));

    const tagMap = new Map<string, number>();
    for (const d of docs) {
      for (const t of d.tags) {
        if (t.toLowerCase().includes(q)) {
          tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
        }
      }
    }
    const tagRows: Row[] = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({ kind: 'tag', tag, count }));

    return [...articleRows, ...tagRows];
  }, [query, miniSearch, docs, recentlyViewed, history]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const row = rows[activeIdx];
        if (!row) return;
        e.preventDefault();
        if (row.kind === 'article') {
          recordView({
            slug: row.slug,
            title: row.title,
            category: row.category,
            date: row.date,
          });
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/${encodeURIComponent(row.slug)}`);
        } else if (row.kind === 'tag') {
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/tags/${encodeURIComponent(row.tag)}`);
        } else if (row.kind === 'popular' || row.kind === 'history') {
          setQuery(row.q);
          setActiveIdx(0);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, rows, activeIdx, query, onClose, router]);

  if (!open) return null;

  const showEmpty = query.trim().length === 0;
  const totalIndexed = docs.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="검색"
      className="fixed inset-0 z-50 flex items-start justify-center bg-bento-ink/50 px-4 pt-[110px] backdrop-blur-sm dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] overflow-hidden rounded-[14px] bg-bento-card shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-bento-ink/10 px-5 py-4 dark:border-white/10">
          <span aria-hidden="true" className="font-mono text-sm font-semibold tracking-wider text-bento-accent">
            ›
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            autoFocus
            aria-label="검색어"
            className="flex-1 border-0 bg-transparent font-mono text-base text-bento-ink outline-none placeholder:text-bento-dim"
            style={{ caretColor: 'rgb(var(--bento-accent))' }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="검색 닫기"
            className="rounded border border-bento-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-bento-dim dark:border-white/10"
          >
            esc
          </button>
        </div>

        <div className="max-h-[480px] overflow-auto py-3">
          {showEmpty ? (
            <EmptyState
              recentlyViewed={recentlyViewed}
              history={history}
              activeIdx={activeIdx}
              rows={rows}
              onPickHistory={(q) => {
                setQuery(q);
                setActiveIdx(0);
              }}
              onPickPopular={(q) => {
                setQuery(q);
                setActiveIdx(0);
              }}
              onClearHistory={() => {
                clearHistory();
                setHistory([]);
              }}
            />
          ) : !miniSearch ? (
            <div className="px-6 py-8 text-center font-mono text-xs text-bento-dim">
              검색 인덱스를 불러오는 중…
            </div>
          ) : (
            <SearchResults
              query={query}
              activeIdx={activeIdx}
              rows={rows}
              onActivateArticle={(row) => {
                recordView({
                  slug: row.slug,
                  title: row.title,
                  category: row.category,
                  date: row.date,
                });
                if (query.trim()) recordSearch(query.trim());
                onClose();
              }}
              onActivateTag={() => {
                if (query.trim()) recordSearch(query.trim());
                onClose();
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-bento-ink/10 bg-bento-cream px-5 py-2.5 font-mono text-[11px] text-bento-dim dark:border-white/10 dark:bg-bento-card">
          <div className="flex gap-4">
            <FooterKey keys={['↑', '↓']}>navigate</FooterKey>
            <FooterKey keys={['↵']}>open</FooterKey>
            <FooterKey keys={['esc']}>close</FooterKey>
          </div>
          <div>
            <span aria-hidden="true" className="text-bento-accent">●</span> indexed · {totalIndexed} posts
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Subviews

function EmptyState({
  recentlyViewed,
  history,
  activeIdx,
  rows,
  onPickHistory,
  onPickPopular,
  onClearHistory,
}: {
  recentlyViewed: RecentItem[];
  history: string[];
  activeIdx: number;
  rows: Row[];
  onPickHistory: (q: string) => void;
  onPickPopular: (q: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <>
      {recentlyViewed.length > 0 && (
        <Section label="recently viewed" count={Math.min(recentlyViewed.length, 5)}>
          {recentlyViewed.slice(0, 5).map((r, i) => {
            const rowIdx = rows.findIndex((x) => x.kind === 'article' && x.slug === r.slug);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.slug}
                href={`/${encodeURIComponent(r.slug)}`}
                active={active}
                num={String(i + 1).padStart(2, '0')}
                title={r.title}
                meta={r.category}
                trailing={r.date}
              />
            );
          })}
        </Section>
      )}

      <Section label="popular this week" count={POPULAR.length}>
        {POPULAR.map((p, i) => {
          const rowIdx = rows.findIndex((x) => x.kind === 'popular' && x.q === p.q);
          const active = rowIdx === activeIdx;
          return (
            <RowQuery
              key={p.q}
              active={active}
              num={String(i + 1).padStart(2, '0')}
              q={p.q}
              meta={`${p.n} searches`}
              onPick={() => onPickPopular(p.q)}
            />
          );
        })}
      </Section>

      {history.length > 0 && (
        <Section
          label="your history"
          count={Math.min(history.length, 5)}
          extra={
            <button
              type="button"
              onClick={onClearHistory}
              className="font-mono text-[10px] text-bento-dim hover:text-bento-ink"
            >
              clear
            </button>
          }
        >
          {history.slice(0, 5).map((q) => {
            const rowIdx = rows.findIndex((x) => x.kind === 'history' && x.q === q);
            const active = rowIdx === activeIdx;
            return (
              <RowQuery
                key={q}
                active={active}
                icon="↻"
                q={q}
                muted
                onPick={() => onPickHistory(q)}
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

function SearchResults({
  query,
  activeIdx,
  rows,
  onActivateArticle,
  onActivateTag,
}: {
  query: string;
  activeIdx: number;
  rows: Row[];
  onActivateArticle: (row: { slug: string; title: string; category: string; date: string }) => void;
  onActivateTag: (row: { tag: string }) => void;
}) {
  const articles = rows.filter((r): r is Extract<Row, { kind: 'article' }> => r.kind === 'article');
  const tags = rows.filter((r): r is Extract<Row, { kind: 'tag' }> => r.kind === 'tag');

  if (articles.length === 0 && tags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span aria-hidden="true" className="font-mono text-2xl text-bento-dim">∅</span>
        <div className="text-sm font-medium text-bento-ink">"{query}"에 대한 결과 없음</div>
        <div className="text-xs text-bento-dim">다른 검색어를 시도해보세요</div>
      </div>
    );
  }

  return (
    <>
      {articles.length > 0 && (
        <Section label="articles" count={articles.length}>
          {articles.map((r, i) => {
            const rowIdx = rows.indexOf(r);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.slug}
                href={`/${encodeURIComponent(r.slug)}`}
                active={active}
                num={String(i + 1).padStart(2, '0')}
                title={highlight(r.title, query)}
                meta={r.category}
                trailing={r.date}
                onSelect={() => onActivateArticle(r)}
              />
            );
          })}
        </Section>
      )}

      {tags.length > 0 && (
        <Section label="tags" count={tags.length}>
          {tags.map((r) => {
            const rowIdx = rows.indexOf(r);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.tag}
                href={`/tags/${encodeURIComponent(r.tag)}`}
                active={active}
                num="#"
                title={highlight(r.tag, query)}
                meta={`${r.count} posts`}
                trailing=""
                onSelect={() => onActivateTag(r)}
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Atoms

function Section({
  label,
  count,
  extra,
  children,
}: {
  label: string;
  count: number;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-6 pb-1.5 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-bento-dim">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <span>{String(count).padStart(2, '0')}</span>
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function RowLink({
  href,
  active,
  num,
  title,
  meta,
  trailing,
  onSelect,
}: {
  href: string;
  active: boolean;
  num: string;
  title: React.ReactNode;
  meta: string;
  trailing: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={[
        'flex items-center gap-3 border-l-2 px-6 py-2 no-underline',
        active
          ? 'border-bento-accent bg-bento-ink/5 dark:bg-white/5'
          : 'border-transparent hover:bg-bento-ink/[0.03] dark:hover:bg-white/[0.03]',
      ].join(' ')}
    >
      <span
        className={[
          'w-6 font-mono text-[11px]',
          active ? 'text-bento-accent' : 'text-bento-dim',
        ].join(' ')}
      >
        {num}
      </span>
      <span
        className={[
          'flex-1 truncate text-[14px] tracking-tight text-bento-ink',
          active ? 'font-semibold' : 'font-medium',
        ].join(' ')}
      >
        {title}
      </span>
      <span className="w-[80px] truncate text-right font-mono text-[11px] text-bento-dim">
        {meta}
      </span>
      <span className="w-[60px] truncate text-right font-mono text-[11px] text-bento-dim">
        {trailing}
      </span>
      <span
        aria-hidden="true"
        className={[
          'w-3.5 text-center font-mono text-[10px]',
          active ? 'text-bento-accent' : 'text-transparent',
        ].join(' ')}
      >
        ↵
      </span>
    </Link>
  );
}

function RowQuery({
  active,
  num,
  icon,
  q,
  meta,
  muted,
  onPick,
}: {
  active: boolean;
  num?: string;
  icon?: string;
  q: string;
  meta?: string;
  muted?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        'flex w-full items-center gap-3 border-l-2 px-6 py-2 text-left',
        active
          ? 'border-bento-accent bg-bento-ink/5 dark:bg-white/5'
          : 'border-transparent hover:bg-bento-ink/[0.03] dark:hover:bg-white/[0.03]',
      ].join(' ')}
    >
      <span aria-hidden="true" className="w-6 font-mono text-[11px] text-bento-dim">
        {icon || num}
      </span>
      <span
        className={[
          'flex-1 font-mono text-[13px] font-medium',
          muted ? 'text-bento-dim' : 'text-bento-ink',
        ].join(' ')}
      >
        {q}
      </span>
      {meta && (
        <span className="font-mono text-[11px] text-bento-dim">{meta}</span>
      )}
      <span aria-hidden="true" className="w-3.5" />
    </button>
  );
}

function FooterKey({
  keys,
  children,
}: {
  keys: string[];
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[16px] rounded-[3px] border border-bento-ink/10 bg-bento-card px-1.5 py-0 text-center font-mono text-[10px] font-semibold text-bento-ink dark:border-white/10"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{children}</span>
    </span>
  );
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const lowered = text.toLowerCase();
  const i = lowered.indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded-sm bg-bento-accent/20 px-0.5 text-bento-ink">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}
