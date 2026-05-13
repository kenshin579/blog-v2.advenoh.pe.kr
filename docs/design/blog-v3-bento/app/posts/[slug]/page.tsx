import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ARTICLES, getArticle, getArticlesBySeries, formatDate, seriesSlug } from "@/lib/articles";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const seriesEps = article.series ? getArticlesBySeries(article.series) : [];
  const idx = seriesEps.findIndex((a) => a.slug === article.slug);
  const prev = idx > 0 ? seriesEps[idx - 1] : null;
  const next = idx >= 0 && idx < seriesEps.length - 1 ? seriesEps[idx + 1] : null;

  return (
    <main className="min-h-screen bg-bg pb-20">
      <Header active="Posts" />

      {/* Hero card */}
      <section className="mx-auto max-w-canvas px-10 pt-4">
        <div className="rounded-card-xl bg-lavender p-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
              {article.category}
            </span>
            {article.series && (
              <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white">
                EP {String(article.seriesOrder).padStart(2, "0")} · {article.series}
              </span>
            )}
          </div>
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tighter">
            {article.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-75">
            {article.excerpt}
          </p>
          <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-dim">
            <span>Frank Advenoh · {formatDate(article.date)}</span>
            <span>{article.readTime}m read</span>
          </div>
        </div>
      </section>

      {/* Body + sticky TOC */}
      <section className="mx-auto mt-12 grid max-w-canvas grid-cols-[1fr_240px] gap-12 px-10">
        <article className="prose-bento max-w-prose text-[17px] leading-[1.75]">
          <h2 className="mt-6 text-3xl font-bold tracking-tighter">들어가며</h2>
          <p className="mb-5 mt-3">
            Go에서 channel은 goroutine 사이의 통신 수단이자 동기화 도구입니다. 메모리를 공유하는 대신,
            "통신을 통해 메모리를 공유하라"는 Go의 철학이 가장 잘 드러나는 부분이죠.
          </p>
          <p className="mb-5">
            채널을 만들 때 두 가지 결정이 따라옵니다 — 어떤 타입을 흘릴지, 그리고 버퍼를 둘지.
          </p>

          {/* Code block */}
          <div className="my-6 overflow-x-auto rounded-card bg-[#0F0F0F] p-5 font-mono text-[13.5px] leading-relaxed text-[#E8E6E1]">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-[#7A7770]">go</div>
            <pre className="m-0">{`ch := make(chan int)        // unbuffered
ch := make(chan int, 10)    // buffered

go func() {
    ch <- 42
}()
fmt.Println(<-ch)`}</pre>
          </div>

          <h2 className="mt-10 text-3xl font-bold tracking-tighter">버퍼 채널 vs 비버퍼</h2>
          <p className="mb-5 mt-3">
            비버퍼 채널은 송수신이 만나야만 통과합니다. 버퍼 채널은 버퍼가 비어 있는 동안 송신이 대기 없이 진행되죠.
          </p>

          {/* Pull quote */}
          <blockquote className="my-8 rounded-card bg-butter p-7 font-serif text-[22px] italic leading-snug tracking-tight text-ink">
            "Don't communicate by sharing memory; share memory by communicating."
            <div className="mt-3 font-sans text-xs not-italic text-dim">— Go proverb</div>
          </blockquote>

          <p className="mb-5">
            실무에서는 비버퍼 채널을 동기화 신호로, 버퍼 채널을 유한한 큐로 활용하는 패턴이 가장 자주 등장합니다.
          </p>
        </article>

        {/* Sticky TOC */}
        <aside className="sticky top-6 self-start">
          <div className="rounded-card-lg border border-ink/10 bg-card p-5">
            <div className="mb-3 text-[10px] uppercase tracking-wider text-dim">목차</div>
            <ul className="flex flex-col gap-2">
              {[
                { id: "intro", text: "들어가며" },
                { id: "basics", text: "채널의 기본", active: true },
                { id: "buffered", text: "버퍼 채널 vs 비버퍼" },
                { id: "directional", text: "단방향 채널" },
                { id: "close", text: "close와 range 패턴" },
              ].map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block py-1 text-[13px] no-underline ${
                      s.active ? "font-semibold text-accent" : "text-ink hover:text-accent"
                    }`}
                  >
                    {s.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {/* Series nav */}
      {article.series && (
        <section className="mx-auto mt-12 max-w-prose px-10">
          <div className="rounded-card-lg border border-ink/10 bg-card p-6">
            <div className="mb-3 text-[10px] uppercase tracking-wider text-dim">
              Series · {article.series}
            </div>
            <ul className="flex flex-col gap-1">
              {seriesEps.map((e) => {
                const isCurrent = e.slug === article.slug;
                return (
                  <li key={e.slug}>
                    <Link
                      href={`/posts/${e.slug}`}
                      className={`flex items-center gap-3 rounded-xl p-2.5 no-underline text-ink ${
                        isCurrent ? "bg-lavender" : "hover:bg-ink/5"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                        {isCurrent ? "★" : e.seriesOrder}
                      </span>
                      <span className={`text-[13px] ${isCurrent ? "font-semibold" : ""}`}>
                        {e.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Prev / next */}
      {(prev || next) && (
        <section className="mx-auto mt-6 grid max-w-prose grid-cols-2 gap-3 px-10">
          {prev ? (
            <Link href={`/posts/${prev.slug}`} className="rounded-card bg-cream p-4 no-underline text-ink">
              <div className="text-[11px] text-dim">← 이전</div>
              <div className="mt-1 text-[13px] font-semibold leading-snug">{prev.title}</div>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/posts/${next.slug}`} className="rounded-card bg-ink p-4 no-underline text-white">
              <div className="text-right text-[11px] text-white/60">다음 →</div>
              <div className="mt-1 text-right text-[13px] font-semibold leading-snug">{next.title}</div>
            </Link>
          ) : <div />}
        </section>
      )}
    </main>
  );
}
