import { getAllArticles } from '@/lib/articles';
import { TagsPageClient } from '@/components/tags-page-client';

export const metadata = {
  title: "Tags | Frank's IT Blog",
  description: '태그별로 정리된 기술 블로그 글 모음',
};

interface TagData {
  name: string;
  count: number;
  articles: any[];
}

export default async function TagsPage() {
  const allArticles = await getAllArticles();

  // 태그 데이터 수집 및 정규화
  const tagMap = new Map<string, any[]>();

  allArticles.forEach((article) => {
    if (article.tags && article.tags.length > 0) {
      article.tags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (!tagMap.has(normalizedTag)) {
          tagMap.set(normalizedTag, []);
        }
        tagMap.get(normalizedTag)!.push(article);
      });
    }
  });

  // TagData 배열로 변환 (사용 횟수 순으로 정렬)
  const tagsData: TagData[] = Array.from(tagMap.entries())
    .map(([name, articles]) => ({
      name,
      count: articles.length,
      articles,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">태그</h1>
        <p className="text-xl text-muted-foreground">
          태그를 클릭하여 관련 아티클을 찾아보세요
        </p>
      </header>

      {tagsData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">등록된 태그가 없습니다.</p>
        </div>
      ) : (
        <TagsPageClient tags={tagsData} />
      )}
    </div>
  );
}
