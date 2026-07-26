import { getArticlesWithSlides } from '@/lib/articles';
import { SlideCard } from '@/components/slides/slide-card';

export const metadata = {
  title: "Slides | Frank's IT Blog",
  description: 'Blog posts with presentation slide decks',
};

export default async function SlidesPage() {
  const decks = await getArticlesWithSlides('en');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Slides
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Slides
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {decks.length} slide deck{decks.length === 1 ? '' : 's'}
        </p>
      </header>

      {decks.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          No slide decks yet.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {decks.map((d) => (
            <SlideCard
              key={d.slug}
              slug={d.slug}
              title={d.title}
              date={d.date}
              series={d.series}
              slideCount={d.slideCount}
              lang="en"
              countLabel=" slides"
              ariaLabel={`View slides for ${d.title}`}
            />
          ))}
        </section>
      )}
    </main>
  );
}
