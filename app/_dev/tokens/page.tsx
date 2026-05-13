// Tailwind safelist — dynamic class names from COLORS/RADII arrays below
// bg-bento-bg bg-bento-card bg-bento-ink bg-bento-dim bg-bento-cream
// bg-bento-accent bg-bento-accent-soft bg-bento-sage bg-bento-rose
// bg-bento-lavender bg-bento-butter bg-bento-hero-dark
// rounded-card-sm rounded-card rounded-card-lg rounded-card-xl

export const metadata = {
  title: 'Design Tokens (dev)',
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: 'bg', key: 'bento-bg' },
  { name: 'card', key: 'bento-card' },
  { name: 'ink', key: 'bento-ink' },
  { name: 'dim', key: 'bento-dim' },
  { name: 'cream', key: 'bento-cream' },
  { name: 'accent', key: 'bento-accent' },
  { name: 'accent-soft', key: 'bento-accent-soft' },
  { name: 'sage', key: 'bento-sage' },
  { name: 'rose', key: 'bento-rose' },
  { name: 'lavender', key: 'bento-lavender' },
  { name: 'butter', key: 'bento-butter' },
  { name: 'hero-dark', key: 'bento-hero-dark' },
] as const;

const RADII = [
  { name: 'card-sm', key: 'card-sm' },
  { name: 'card', key: 'card' },
  { name: 'card-lg', key: 'card-lg' },
  { name: 'card-xl', key: 'card-xl' },
] as const;

export default function TokensPage() {
  return (
    <main className="min-h-screen bg-bento-bg p-10 text-bento-ink">
      <div className="mx-auto max-w-canvas space-y-12">
        <header>
          <h1 className="text-5xl font-bold tracking-tightest">Design Tokens</h1>
          <p className="mt-2 text-bento-dim">Sub-project #1 reference. Not indexed.</p>
        </header>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Colors</h2>
          <div className="grid grid-cols-4 gap-4">
            {COLORS.map((c) => (
              <div key={c.key} className="rounded-card bento-card overflow-hidden">
                <div className={`h-24 bg-${c.key}`} />
                <div className="p-3 text-sm">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-bento-dim">bg-{c.key}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Border Radii</h2>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r.key} className="text-center">
                <div className={`h-24 w-24 bg-bento-accent rounded-${r.key}`} />
                <div className="mt-2 text-xs text-bento-dim">rounded-{r.key}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Typography</h2>
          <div className="space-y-3">
            <div className="text-[88px] font-bold leading-[0.95] tracking-tightest">
              Field notes <span className="headline-hi">from</span> a working engineer.
            </div>
            <div className="text-4xl font-bold tracking-tighter">Heading 2 · tracking-tighter</div>
            <div className="text-2xl font-bold tracking-tight">Heading 3 · tracking-tight</div>
            <div className="text-base">Body text · 기본 본문 스타일 (Pretendard Variable)</div>
            <div className="text-base font-serif italic">Instrument Serif italic — pull quote 같은 강조용</div>
            <div className="text-sm font-mono">font-mono · JetBrains Mono 13px</div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tighter">Utility class samples</h2>
          <div className="space-y-3">
            <div className="bento-card p-6">
              <div className="font-semibold">.bento-card</div>
              <div className="text-sm text-bento-dim">border-radius 24px · bg rgb(var(--bento-card))</div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-10 w-32 flex-shrink-0 rounded-card-sm bg-bento-sage" />
              ))}
              <p className="self-center text-xs text-bento-dim">.no-scrollbar (가로 스크롤)</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
