import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ARTICLES, getArticlesBySeries, seriesSlug } from "@/lib/articles";

const SERIES_LIST = [
  { name: "Golang Concurrency", count: 5, done: 2, blurb: "Go의 동시성 모델을 처음부터. goroutine과 channel부터 worker pool 같은 실무 패턴까지." },
  { name: "MQTT v5", count: 4, done: 1, blurb: "IoT 메시징의 사실상 표준 MQTT v5 완벽 정리." },
  { name: "Terraform", count: 5, done: 5, blurb: "IaC 표준이 된 Terraform — 기본부터 GitOps까지." },
];

export function generateStaticParams() {
  return SERIES_LIST.map((s) => ({ slug: seriesSlug(s.name) }));
}

export default function SeriesPage({ params }: { params: { slug: string } }) {
  const series = SERIES_LIST.find((s) => seriesSlug(s.name) === params.slug);
  if (!series) notFound();

  const real = getArticlesBySeries(series.name);
  const eps = Array.from({ length: series.count }, (_, i) => {
    const r = real.find((a) => a.seriesOrder === i + 1);
    return r
      ? {
          num: i + 1, title: r.title, slug: r.slug, date: r.date,
          readTime: r.readTime, status: i + 1 <= series.done ? "done" : "next",
          current: i + 1 === series.done,
        }
      : {
          num: i + 1,
          title: ["", "", "Select / sync 패턴", "Context 사용법 — 취소와 시한", "실전 패턴 — Worker Pool, Pipeline"][i] || "Coming up",
          slug: null, date: "TBD", readTime: 0,
          status: i + 1 === series.done + 1 ? "next" : "planned",
          current: false,
        };
  });
  const progress = (series.done / series.count) * 100;
  const others = SERIES_LIST.filter((s) => s.name !== series.name);

  return (
    <main className="min-h-screen bg-bg pb-20">
      <Header active="Series" />

      <div className="mx-auto max-w-canvas px-10 pb-4 text-xs text-dim">
        <Link href="/" className="text-dim no-underline">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-dim">Series</span>
        <span className="mx-2">/</span>
        <span className="font-medium text-accent">{series.name}</span>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-canvas px-10">
        <div className="grid grid-cols-[1fr_280px] items-center gap-10 rounded-card-xl bg-lavender p-12">
          <div>
            <p className="text-[12px] uppercase tracking-[0.12em] opacity-60">Series</p>
            <h1 className="my-4 text-7xl font-bold leading-[0.95] tracking-tightest">
              {series.name}.
            </h1>
            <p className="mb-7 max-w-xl text-lg leading-relaxed opacity-75">{series.blurb}</p>
            <div className="flex gap-3">
              {eps[0]?.slug && (
                <Link href={`/posts/${eps[0].slug}`} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline">
                  처음부터 읽기 →
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-card-lg bg-white/50 p-6 text-center">
            <div className="relative mx-auto mb-3 h-40 w-40">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="rgb(var(--ink) / 0.1)" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="68" fill="none"
                  stroke="rgb(var(--accent))" strokeWidth="12"
                  strokeDasharray={`${(progress / 100) * 427} 427`}
                  strokeLinecap="round" transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold tracking-tighter">{series.done}/{series.count}</div>
                <div className="text-[11px] uppercase tracking-wider text-dim">편</div>
              </div>
            </div>
            <div className="text-sm font-medium">{Math.round(progress)}% 발행 완료</div>
          </div>
        </div>
      </section>

      {/* Episodes */}
      <section className="mx-auto mt-12 max-w-3xl px-10">
        <h2 className="mb-5 text-3xl font-bold tracking-tighter">편별 목록</h2>
        <ol className="flex flex-col gap-4">
          {eps.map((e, i) => {
            const isDone = e.status === "done";
            const isNext = e.status === "next";
            const dotBg = isDone ? (e.current ? "bg-accent" : "bg-ink") : isNext ? "bg-butter" : "bg-ink/10";
            const dotFg = isDone || isNext ? (isNext ? "text-ink" : "text-white") : "text-dim";
            const cardBg = e.current ? "bg-butter" : isDone ? "bg-card" : "border border-dashed border-ink/20";
            return (
              <li key={e.num} className="grid grid-cols-[60px_1fr] gap-5">
                <div className="flex flex-col items-center">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-bold ${dotBg} ${dotFg}`}>
                    {isDone ? (e.current ? "★" : "✓") : e.num}
                  </div>
                  {i < eps.length - 1 && (
                    <div className={`mt-1 min-h-[60px] w-0.5 flex-1 ${isDone ? "bg-ink" : "bg-ink/10"}`} />
                  )}
                </div>
                {e.slug ? (
                  <Link href={`/posts/${e.slug}`} className={`block rounded-card p-5 no-underline text-ink ${cardBg}`}>
                    <EpHead e={e} isNext={isNext} />
                    <h3 className="mt-2 text-xl font-bold tracking-tighter">{e.title}</h3>
                    {isDone && <div className="mt-2 text-xs text-dim">{e.readTime} min read</div>}
                  </Link>
                ) : (
                  <div className={`block rounded-card p-5 ${cardBg}`}>
                    <EpHead e={e} isNext={isNext} />
                    <h3 className={`mt-2 text-xl font-bold tracking-tighter ${isNext ? "" : "text-dim"}`}>{e.title}</h3>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Other series */}
      <section className="mx-auto mt-16 max-w-canvas px-10">
        <h3 className="mb-4 text-2xl font-bold tracking-tighter">다른 시리즈</h3>
        <div className="grid grid-cols-3 gap-4">
          {others.map((s, i) => {
            const tints = ["bg-sage", "bg-rose", "bg-butter"];
            return (
              <Link key={s.name} href={`/series/${seriesSlug(s.name)}`} className={`flex flex-col gap-3 rounded-card-lg p-6 no-underline text-ink ${tints[i]}`}>
                <div className="text-[11px] uppercase tracking-wider opacity-60">Series</div>
                <div className="text-xl font-bold leading-snug tracking-tighter">{s.name}</div>
                <div className="mt-auto flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full bg-ink" style={{ width: `${(s.done / s.count) * 100}%` }} />
                  </div>
                  <span className="text-xs text-dim">{s.done}/{s.count}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function EpHead({ e, isNext }: { e: any; isNext: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-dim">
      <span>EP {String(e.num).padStart(2, "0")}</span>
      <span>·</span>
      <span>{e.date}</span>
      {e.current && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
          READING
        </span>
      )}
      {isNext && (
        <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
          NEXT UP
        </span>
      )}
    </div>
  );
}
