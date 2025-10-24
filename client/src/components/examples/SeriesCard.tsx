import { SeriesCard } from '../SeriesCard';
import { parseMarkdown } from '@/lib/markdown';
import { mockArticles } from '@/lib/mock-articles';

export default function SeriesCardExample() {
  const articles = mockArticles
    .filter(({ markdown }) => markdown.includes('series: TypeScript 마스터하기'))
    .map(({ slug, markdown }) => parseMarkdown(markdown, slug));

  return (
    <div className="p-8 max-w-3xl">
      <SeriesCard seriesName="TypeScript 마스터하기" articles={articles} />
    </div>
  );
}
