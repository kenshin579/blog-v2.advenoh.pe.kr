import { getAllArticles, getArticlesBySeries, getArticleTitleFromSlug } from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { Headline } from '@/components/home/headline';
import { FeaturedCard } from '@/components/home/featured-card';
import { SeriesSpotlightCard } from '@/components/home/series-spotlight-card';
import { LatestCard } from '@/components/home/latest-card';
import { CategoriesCard } from '@/components/home/categories-card';
import { RecentCard } from '@/components/home/recent-card';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

const RECENT_TONES = ['sage', 'butter', 'rose', 'cream'] as const;

function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const totalCount = articles.length;

  const featured = articles[0];
  const latest = articles.slice(1, 5);
  const recent = articles.slice(5, 9);

  const featuredSeriesArticle = articles.find((a) => a.series);
  let spotlightEpisodes: Array<{ num: number; title: string; slug: string }> = [];
  let spotlightName = '';
  if (featuredSeriesArticle?.series) {
    spotlightName = featuredSeriesArticle.series;
    const eps = await getArticlesBySeries(spotlightName);
    spotlightEpisodes = eps
      .slice()
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
      .map((a, i) => ({
        num: a.seriesOrder ?? i + 1,
        title: a.title,
        slug: getArticleTitleFromSlug(a.slug),
      }));
  }

  const categoryCounts = new Map<string, number>();
  for (const a of articles) {
    categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20 pt-2">
      <Headline totalCount={totalCount} />

      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {featured && (
          <FeaturedCard
            href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
            title={featured.title}
            category={featured.category}
            date={formatDate(featured.date)}
            excerpt={featured.excerpt}
          />
        )}

        {spotlightName && (
          <SeriesSpotlightCard
            seriesName={spotlightName}
            seriesHref={`/series/${encodeURIComponent(seriesSlug(spotlightName))}`}
            episodes={spotlightEpisodes}
          />
        )}

        {latest.length > 0 && (
          <LatestCard
            items={latest.map((a) => ({
              slug: getArticleTitleFromSlug(a.slug),
              title: a.title,
              date: formatDate(a.date),
            }))}
          />
        )}

        {categories.length > 0 && (
          <CategoriesCard categories={categories} />
        )}

        {recent.map((a, i) => (
          <RecentCard
            key={a.slug}
            href={`/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
            title={a.title}
            category={a.category}
            tone={RECENT_TONES[i % RECENT_TONES.length]}
          />
        ))}
      </section>
    </main>
  );
}
