import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import {
  getArticlesByTag,
  getAllTags,
  formatDate,
} from "@/lib/articles";

export function generateStaticParams() {
  return getAllTags().map((t) => ({ name: t.tag }));
}

export default function TagPage({ params }: { params: { name: string } }) {
  const tag = decodeURIComponent(params.name);
  const list = getArticlesByTag(tag);
  if (list.length === 0) notFound();

  const tints = ["bg-sage", "bg-butter", "bg-rose", "bg-lavender"];
  const related = getAllTags()
    .filter((t) => t.tag !== tag)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-bg pb-20">
      <Header active="Tags" />

      <div className="mx-auto max-w-canvas px-10 pb-4 text-xs text-dim">
        <Link href="/" className="text-dim no-underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/tags" className="text-dim no-underline">Tags</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-accent">#{tag}</span>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-canvas grid-cols-[1fr_380px] gap-4 px-10">
        <div className="relative overflow-hidden rounded-card-xl bg-ink p-12 text-white">
          <div
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: "radial-gradient(circle, rgb(var(--accent)) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">Tag</p>
            <div className="my-4 text-[88px] font-bold leading-[0.95] tracking-tightest">
              <span className="text-accent">#</span>{tag}
            </div>
            <div className="flex gap-6 text-xs text-white/70">
              <span><strong className="text-base text-white">{list.length}</strong> 편</span>
            </div>
          </div>
        </div>

        <div className="rounded-card-lg bg-cream p-5">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-dim">
            Related tags
          </div>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t.tag}
                href={`/tags/${encodeURIComponent(t.tag)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-3.5 py-2 text-[13px] text-ink no-underline"
              >
                <span className="text-accent">#</span>{t.tag}
                <span className="text-[11px] text-dim">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article grid */}
      <section className="mx-auto mt-8 grid max-w-canvas auto-rows-[minmax(120px,auto)] grid-cols-12 gap-4 px-10">
        {list.map((a, i) => {
          const isFirst = i === 0;
          const span = isFirst ? "col-span-12" : i % 3 === 1 ? "col-span-7" : i % 3 === 2 ? "col-span-5" : "col-span-4";
          const bg = isFirst ? "bg-ink text-white" : `${tints[i % 4]} text-ink`;
          return (
            <Link
              key={a.slug}
              href={`/posts/${a.slug}`}
              className={`row-span-2 flex flex-col justify-between rounded-card-lg p-6 no-underline ${span} ${bg} ${isFirst ? "min-h-[240px]" : "min-h-[180px]"}`}
            >
              <div>
                <div className={`mb-3 text-[11px] uppercase tracking-wider ${isFirst ? "text-white/60" : "text-dim"}`}>
                  {a.category} · {formatDate(a.date)}
                </div>
                <h3 className={`font-bold leading-tight tracking-tighter ${isFirst ? "text-4xl" : "text-xl"}`}>
                  {a.title}
                </h3>
                {isFirst && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">{a.excerpt}</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {a.tags.filter((t) => t !== tag).slice(0, 2).map((t) => (
                    <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] ${isFirst ? "bg-white/10" : "bg-ink/[0.06]"}`}>
                      #{t}
                    </span>
                  ))}
                </div>
                <span className={`text-xs font-medium ${isFirst ? "text-white/70" : "text-dim"}`}>
                  {a.readTime}m →
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
