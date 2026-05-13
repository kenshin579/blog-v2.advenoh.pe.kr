import Link from "next/link";
import { Header } from "@/components/header";
import { ARTICLES, CATEGORIES, formatDate, categorySlug, seriesSlug } from "@/lib/articles";

export default function HomePage() {
  const featured = ARTICLES[0];
  const biweekly = ARTICLES.slice(1, 5);
  const recent = ARTICLES.slice(5, 9);
  const series = {
    name: "Golang Concurrency",
    eps: [
      { num: 1, title: "Goroutine 기초", done: true },
      { num: 2, title: "Channel 완전 정복", done: true, current: true },
      { num: 3, title: "Select / sync 패턴", done: false },
      { num: 4, title: "Context 사용법", done: false },
      { num: 5, title: "실전 패턴 — Worker Pool", done: false },
    ],
  };

  return (
    <main className="min-h-screen bg-bg pb-20 pt-2">
      <Header active="Home" />

      {/* Headline */}
      <section className="mx-auto max-w-canvas px-10 pb-10 pt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-dim">
          Field notes from a working engineer
        </p>
        <h1 className="mt-4 text-[88px] font-bold leading-[0.95] tracking-tightest">
          Field notes <span className="headline-hi">from</span> a working engineer.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dim">
          Cloud · JVM · Go · Database. 격주로 발행. 178편 누적.
        </p>
      </section>

      {/* Bento grid */}
      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-4 px-10">
        {/* Featured */}
        <Link
          href={`/posts/${featured.slug}`}
          className="relative col-span-7 row-span-2 flex flex-col justify-between overflow-hidden rounded-card-xl bg-ink p-10 text-white no-underline min-h-[420px]"
        >
          <div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, rgb(var(--accent)) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <div className="mb-6 flex gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                Featured
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
                {featured.category}
              </span>
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tighter">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">
              {featured.excerpt}
            </p>
          </div>
          <div className="relative flex items-end justify-between text-xs text-white/70">
            <span>{formatDate(featured.date)}</span>
            <span>{featured.readTime}m read →</span>
          </div>
        </Link>

        {/* Series spotlight */}
        <Link
          href={`/series/${seriesSlug(series.name)}`}
          className="col-span-5 flex flex-col rounded-card-xl bg-lavender p-7 text-ink no-underline"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Active Series</span>
            <span className="text-xs text-dim">2/5</span>
          </div>
          <h3 className="mb-4 text-2xl font-bold tracking-tighter">{series.name}</h3>
          <ul className="flex flex-col gap-1">
            {series.eps.map((e, i) => (
              <li
                key={e.num}
                className={`flex items-center gap-3 py-1.5 ${i > 0 ? "border-t border-ink/10" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    e.done ? "bg-ink text-white" : "bg-ink/10 text-dim"
                  }`}
                >
                  {e.done ? "✓" : e.num}
                </span>
                <span className={`text-[13px] ${e.done ? "text-ink" : "text-dim"}`}>
                  {e.title}
                </span>
              </li>
            ))}
          </ul>
        </Link>

        {/* Biweekly — large card */}
        <div className="col-span-7 rounded-card-xl bg-accent p-7 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Biweekly</h3>
            <span className="text-[11px] uppercase tracking-wider opacity-75">매 격주 화요일</span>
          </div>
          <ul>
            {biweekly.map((a, i) => (
              <li key={a.slug}>
                <Link
                  href={`/posts/${a.slug}`}
                  className={`flex items-start gap-3 py-3 no-underline text-white ${
                    i > 0 ? "border-t border-white/20" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold leading-snug">{a.title}</div>
                    <div className="mt-1 text-[11px] opacity-75">
                      {formatDate(a.date)} · {a.readTime}m
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div className="col-span-5 rounded-card-xl bg-cream p-7">
          <h3 className="mb-4 text-base font-bold">Browse by topic</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                href={`/category/${categorySlug(c.name)}`}
                className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-[13px] text-ink no-underline"
              >
                {c.name}
                <span className="text-[11px] text-dim">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent — 4 small cards */}
        {recent.map((a, i) => {
          const tints = ["bg-sage", "bg-butter", "bg-rose", "bg-cream"];
          return (
            <Link
              key={a.slug}
              href={`/posts/${a.slug}`}
              className={`col-span-3 flex min-h-[180px] flex-col justify-between rounded-card-lg ${tints[i]} p-5 text-ink no-underline`}
            >
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
                  {a.category}
                </div>
                <h4 className="text-[15px] font-semibold leading-snug tracking-tight">
                  {a.title}
                </h4>
              </div>
              <div className="mt-3 text-[10px] text-dim">{a.readTime}m</div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
