import Link from "next/link";
import { Header } from "@/components/header";
import { getAllTags, ARTICLES } from "@/lib/articles";

export default function TagsPage() {
  const tags = getAllTags();
  const max = tags[0]?.count ?? 1;

  return (
    <main className="min-h-screen bg-bg pb-20">
      <Header active="Tags" />

      <div className="mx-auto max-w-canvas px-10 pb-4 text-xs text-dim">
        <Link href="/" className="text-dim no-underline">Home</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-accent">Tags</span>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-canvas px-10">
        <div className="relative overflow-hidden rounded-card-xl bg-ink p-12 text-white">
          <div
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: "radial-gradient(circle, rgb(var(--accent)) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">All tags</p>
            <div className="my-4 text-[88px] font-bold leading-[0.95] tracking-tightest">
              #{tags.length}<span className="text-white/40"> tags</span>
            </div>
            <p className="max-w-lg text-lg leading-relaxed text-white/75">
              {ARTICLES.length}편의 글을 가로지르는 주제어. 클릭해서 관련된 모든 글을 모아보세요.
            </p>
          </div>
        </div>
      </section>

      {/* Tag cloud */}
      <section className="mx-auto mt-8 max-w-canvas px-10">
        <div className="rounded-card-lg bg-card p-8">
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => {
              const weight = count / max; // 0..1
              const size =
                weight > 0.66 ? "text-2xl font-semibold" :
                weight > 0.33 ? "text-lg font-medium" :
                "text-sm";
              return (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className={`inline-flex items-baseline gap-1.5 rounded-full bg-ink/[0.05] px-4 py-2 text-ink no-underline transition hover:bg-ink/10 ${size}`}
                >
                  <span className="text-accent">#</span>
                  <span>{tag}</span>
                  <span className="text-[11px] font-mono text-dim">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
