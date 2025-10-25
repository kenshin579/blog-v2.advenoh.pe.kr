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
      <header className="container mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Frank's IT Blog</h1>
        <p className="text-xl text-muted-foreground">
          개발, 클라우드, 데이터베이스 관련 기술 블로그
        </p>
      </header>

      <HomeContent articles={articles} />
    </div>
  );
}
