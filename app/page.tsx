import { getAllArticles } from '@/lib/articles';
import { HomeContent } from '@/components/home-content';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

export default async function HomePage() {
  const articles = await getAllArticles();

  return (
    <div className="min-h-screen">
      <HomeContent articles={articles} />
    </div>
  );
}
