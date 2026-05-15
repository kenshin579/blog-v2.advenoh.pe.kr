"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARTICLES, formatDate, type Article } from "@/lib/articles";

const POPULAR = [
  { q: "kubernetes", n: 142 },
  { q: "terraform", n: 98 },
  { q: "goroutine", n: 76 },
  { q: "jpa n+1", n: 54 },
  { q: "spring boot", n: 48 },
];

type RecentItem = { slug: string; title: string; category: string; date: string };

export function CommandK({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // Load persisted state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rv = JSON.parse(localStorage.getItem("cmdk:recently_viewed") || "[]");
      const hist = JSON.parse(localStorage.getItem("cmdk:history") || "[]");
      setRecentlyViewed(rv);
      setHistory(hist);
    } catch {}
  }, [open]);

  // Reset query when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // Build flat list of selectable rows for keyboard nav
  const rows = buildRows({ query, recentlyViewed, history });

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, rows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[activeIdx];
        if (!row) return;
        if (row.kind === "article") {
          recordView({
            slug: row.slug,
            title: row.title,
            category: row.category,
            date: row.date,
          });
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/posts/${row.slug}`);
        } else if (row.kind === "tag") {
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/tags/${row.tag}`);
        } else if (row.kind === "popular" || row.kind === "history") {
          setQuery(row.q);
          setActiveIdx(0);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, rows, activeIdx, query, onClose, router]);

  // Reset active index when rows change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  if (!open) return null;

  const showEmpty = query.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 px-4 pt-[110px] backdrop-blur-sm dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] overflow-hidden rounded-[14px] bg-card shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4 dark:border-white/10">
          <span className="font-mono text-sm font-semibold tracking-wider text-accent">›</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            autoFocus
            className="flex-1 border-0 bg-transparent font-mono text-base text-ink outline-none placeholder:text-dim"
            style={{ caretColor: "rgb(var(--accent))" }}
          />
          <button
            onClick={onClose}
            className="rounded border border-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-dim dark:border-white/10"
          >
            esc
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[480px] overflow-auto py-3">
          {showEmpty ? (
            <EmptyState
              recentlyViewed={recentlyViewed}
              history={history}
              activeIdx={activeIdx}
              rows={rows}
              onClearHistory={() => {
                localStorage.setItem("cmdk:history", "[]");
                setHistory([]);
              }}
            />
          ) : (
            <SearchResults
              query={query}
              activeIdx={activeIdx}
              rows={rows}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink/10 bg-cream px-5 py-2.5 font-mono text-[11px] text-dim dark:border-white/10 dark:bg-card-alt">
          <div className="flex gap-4">
            <FooterKey keys={["↑", "↓"]}>navigate</FooterKey>
            <FooterKey keys={["↵"]}>open</FooterKey>
            <FooterKey keys={["esc"]}>close</FooterKey>
          </div>
          <div>
            <span className="text-accent">●</span> indexed · {ARTICLES.length} posts
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subviews ──────────────────────────────────────────

function EmptyState({
  recentlyViewed,
  history,
  activeIdx,
  rows,
  onClearHistory,
}: {
  recentlyViewed: RecentItem[];
  history: string[];
  activeIdx: number;
  rows: Row[];
  onClearHistory: () => void;
}) {
  return (
    <>
      {recentlyViewed.length > 0 && (
        <Section label="recently viewed" count={recentlyViewed.length}>
          {recentlyViewed.slice(0, 5).map((r, i) => {
            const rowIdx = rows.findIndex((x) => x.kind === "article" && x.slug === r.slug);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.slug}
                href={`/posts/${r.slug}`}
                active={active}
                num={String(i + 1).padStart(2, "0")}
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
          const rowIdx = rows.findIndex((x) => x.kind === "popular" && x.q === p.q);
          const active = rowIdx === activeIdx;
          return (
            <RowQuery
              key={p.q}
              active={active}
              num={String(i + 1).padStart(2, "0")}
              q={p.q}
              meta={`${p.n} searches`}
            />
          );
        })}
      </Section>

      {history.length > 0 && (
        <Section
          label="your history"
          count={history.length}
          extra={
            <button
              onClick={onClearHistory}
              className="font-mono text-[10px] text-dim hover:text-ink"
            >
              clear
            </button>
          }
        >
          {history.slice(0, 5).map((q, i) => {
            const rowIdx = rows.findIndex((x) => x.kind === "history" && x.q === q);
            const active = rowIdx === activeIdx;
            return (
              <RowQuery
                key={q}
                active={active}
                icon="↻"
                q={q}
                muted
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
}: {
  query: string;
  activeIdx: number;
  rows: Row[];
}) {
  const articles = rows.filter((r) => r.kind === "article") as Extract<Row, { kind: "article" }>[];
  const tags = rows.filter((r) => r.kind === "tag") as Extract<Row, { kind: "tag" }>[];

  if (articles.length === 0 && tags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="font-mono text-2xl text-dim">∅</span>
        <div className="text-sm font-medium text-ink">"{query}"에 대한 결과 없음</div>
        <div className="text-xs text-dim">다른 검색어를 시도해보세요</div>
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
                href={`/posts/${r.slug}`}
                active={active}
                num={String(i + 1).padStart(2, "0")}
                title={highlight(r.title, query)}
                meta={r.category}
                trailing={r.date}
                onSelect={() =>
                  recordView({ slug: r.slug, title: r.title, category: r.category, date: r.date })
                }
              />
            );
          })}
        </Section>
      )}

      {tags.length > 0 && (
        <Section label="tags" count={tags.length}>
          {tags.map((r, i) => {
            const rowIdx = rows.indexOf(r);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.tag}
                href={`/tags/${r.tag}`}
                active={active}
                num="#"
                title={highlight(r.tag, query)}
                meta={`${r.count} posts`}
                trailing=""
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

// ─── Atoms ─────────────────────────────────────────────

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
      <div className="flex items-center justify-between px-6 pb-1.5 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <span>{String(count).padStart(2, "0")}</span>
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
        "flex items-center gap-3 border-l-2 px-6 py-2 no-underline",
        active
          ? "border-accent bg-ink/5 dark:bg-white/5"
          : "border-transparent hover:bg-ink/[0.03] dark:hover:bg-white/[0.03]",
      ].join(" ")}
    >
      <span
        className={[
          "w-6 font-mono text-[11px]",
          active ? "text-accent" : "text-dim",
        ].join(" ")}
      >
        {num}
      </span>
      <span
        className={[
          "flex-1 truncate text-[14px] tracking-tight text-ink",
          active ? "font-semibold" : "font-medium",
        ].join(" ")}
      >
        {title}
      </span>
      <span className="w-[80px] truncate text-right font-mono text-[11px] text-dim">
        {meta}
      </span>
      <span className="w-[60px] truncate text-right font-mono text-[11px] text-dim">
        {trailing}
      </span>
      <span
        className={[
          "w-3.5 text-center font-mono text-[10px]",
          active ? "text-accent" : "text-transparent",
        ].join(" ")}
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
}: {
  active: boolean;
  num?: string;
  icon?: string;
  q: string;
  meta?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 border-l-2 px-6 py-2 cursor-pointer",
        active
          ? "border-accent bg-ink/5 dark:bg-white/5"
          : "border-transparent hover:bg-ink/[0.03] dark:hover:bg-white/[0.03]",
      ].join(" ")}
    >
      <span className="w-6 font-mono text-[11px] text-dim">
        {icon || num}
      </span>
      <span
        className={[
          "flex-1 font-mono text-[13px] font-medium",
          muted ? "text-dim" : "text-ink",
        ].join(" ")}
      >
        {q}
      </span>
      {meta && (
        <span className="font-mono text-[11px] text-dim">{meta}</span>
      )}
      <span className="w-3.5" />
    </div>
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
            className="min-w-[16px] rounded-[3px] border border-ink/10 bg-card px-1.5 py-0 text-center font-mono text-[10px] font-semibold text-ink dark:border-white/10"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{children}</span>
    </span>
  );
}

// ─── Search logic ──────────────────────────────────────

type Row =
  | { kind: "article"; slug: string; title: string; category: string; date: string }
  | { kind: "tag"; tag: string; count: number }
  | { kind: "popular"; q: string; n: number }
  | { kind: "history"; q: string };

function buildRows({
  query,
  recentlyViewed,
  history,
}: {
  query: string;
  recentlyViewed: RecentItem[];
  history: string[];
}): Row[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    const rows: Row[] = [];
    recentlyViewed.slice(0, 5).forEach((r) =>
      rows.push({ kind: "article", slug: r.slug, title: r.title, category: r.category, date: r.date }),
    );
    POPULAR.forEach((p) => rows.push({ kind: "popular", q: p.q, n: p.n }));
    history.slice(0, 5).forEach((h) => rows.push({ kind: "history", q: h }));
    return rows;
  }

  // Article matches: title, excerpt, tags
  const articleMatches = ARTICLES.filter((a: Article) => {
    return (
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  })
    .slice(0, 6)
    .map<Row>((a) => ({
      kind: "article",
      slug: a.slug,
      title: a.title,
      category: a.category,
      date: formatDate(a.date),
    }));

  // Tag matches with counts
  const tagMap = new Map<string, number>();
  ARTICLES.forEach((a) =>
    a.tags.forEach((t) => {
      if (t.toLowerCase().includes(q)) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }),
  );
  const tagMatches: Row[] = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag, count]) => ({ kind: "tag", tag, count }));

  return [...articleMatches, ...tagMatches];
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const lowered = text.toLowerCase();
  const i = lowered.indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded-sm bg-accent/20 px-0.5 text-ink">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}

// ─── localStorage helpers ──────────────────────────────

function recordView(item: RecentItem) {
  if (typeof window === "undefined") return;
  try {
    const cur: RecentItem[] = JSON.parse(localStorage.getItem("cmdk:recently_viewed") || "[]");
    const next = [item, ...cur.filter((x) => x.slug !== item.slug)].slice(0, 10);
    localStorage.setItem("cmdk:recently_viewed", JSON.stringify(next));
  } catch {}
}

function recordSearch(q: string) {
  if (typeof window === "undefined") return;
  try {
    const cur: string[] = JSON.parse(localStorage.getItem("cmdk:history") || "[]");
    const next = [q, ...cur.filter((x) => x !== q)].slice(0, 10);
    localStorage.setItem("cmdk:history", JSON.stringify(next));
  } catch {}
}
