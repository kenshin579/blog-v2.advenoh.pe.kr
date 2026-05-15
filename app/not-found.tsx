import Link from 'next/link';

export const metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지를 찾을 수 없습니다',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bento-bg px-6 py-20">
      <section className="mx-auto w-full max-w-canvas">
        <div className="rounded-card-xl bg-bento-hero-dark p-10 text-center text-white md:p-16">
          <div className="font-mono text-[12px] uppercase tracking-[0.18em] text-white/60">
            Error · 404
          </div>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tighter md:text-7xl">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
            요청하신 페이지가 이동되었거나 더 이상 존재하지 않습니다.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-bento-accent px-5 py-2.5 text-[13px] font-semibold text-white no-underline transition hover:opacity-90"
            >
              홈으로 돌아가기<span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-[13px] font-semibold text-white no-underline transition hover:bg-white/10"
            >
              모든 글 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
