import { getAllArticles, getAllSeries, getArticlesBySeries, getArticleTitleFromSlug } from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { seriesSlug } from '@/lib/url';
import { Headline } from '@/components/home/headline';
import { FeaturedCard } from '@/components/home/featured-card';
import { SeriesSpotlightCard } from '@/components/home/series-spotlight-card';
import { LatestCard } from '@/components/home/latest-card';
import { CategoriesCard } from '@/components/home/categories-card';
import { RecentCard } from '@/components/home/recent-card';
import { StatsCard } from '@/components/home/stats-card';
import { ActivityHeatmap } from '@/components/home/activity-heatmap';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

const RECENT_TONES = ['sage', 'butter', 'rose', 'cream'] as const;

const HEATMAP_WEEKS = 26;

type DayCount = { date: string; count: number };

function buildHeatmap(articles: { date: string }[]): {
  days: DayCount[];
  streakWeeks: number;
  peakPerWeek: number;
} {
  const totalDays = HEATMAP_WEEKS * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayCount[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      count: 0,
    });
  }
  const indexByDate = new Map<string, number>();
  days.forEach((d, i) => indexByDate.set(d.date, i));

  for (const a of articles) {
    const d = new Date(a.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const idx = indexByDate.get(key);
    if (idx !== undefined) days[idx].count += 1;
  }

  let streakWeeks = 0;
  for (let w = HEATMAP_WEEKS - 1; w >= 0; w--) {
    const weekDays = days.slice(w * 7, w * 7 + 7);
    const hasPost = weekDays.some((d) => d.count > 0);
    if (hasPost) streakWeeks += 1;
    else break;
  }

  let peakPerWeek = 0;
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const weekTotal = days.slice(w * 7, w * 7 + 7).reduce((acc, d) => acc + d.count, 0);
    if (weekTotal > peakPerWeek) peakPerWeek = weekTotal;
  }

  return { days, streakWeeks, peakPerWeek };
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const seriesNames = await getAllSeries();

  const totalCount = articles.length;
  const seriesCount = seriesNames.length;

  const firstYear = articles
    .map((a) => new Date(a.date).getFullYear())
    .filter((y) => !isNaN(y))
    .reduce((acc, y) => Math.min(acc, y), new Date().getFullYear());
  const yearsWriting = Math.max(1, new Date().getFullYear() - firstYear);

  const featured = articles[0];
  const latest = articles.slice(1, 5);
  const recent = articles.slice(5, 9);

  const featuredSeriesArticle = articles.find((a) => a.series);
  let spotlightEpisodes: Array<{ num: number; title: string; slug: string }> = [];
  let spotlightName = '';
  if (featuredSeriesArticle?.series) {
    spotlightName = featuredSeriesArticle.series;
    const eps = await getArticlesBySeries(spotlightName);
    spotlightEpisodes = eps.map((a, i) => ({
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

  const { days, streakWeeks, peakPerWeek } = buildHeatmap(articles);

  return (
    <main className="min-h-screen bg-bento-bg pb-20 pt-2">
      <Headline totalCount={totalCount} firstYear={firstYear} />

      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {featured && (
          <FeaturedCard
            href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
            title={featured.title}
            category={featured.category}
            date={formatDate(featured.date)}
            excerpt={featured.excerpt}
            tags={featured.tags}
          />
        )}

        <StatsCard
          stats={[
            { value: String(totalCount), label: 'POSTS' },
            { value: String(seriesCount), label: 'SERIES' },
            { value: `${yearsWriting}y`, label: 'WRITING' },
          ]}
        />

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
          <CategoriesCard categories={categories} totalCount={totalCount} />
        )}

        <ActivityHeatmap
          days={days}
          weeks={HEATMAP_WEEKS}
          streakWeeks={streakWeeks}
          peakPerWeek={peakPerWeek}
        />

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
