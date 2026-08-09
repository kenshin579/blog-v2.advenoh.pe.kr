import { getArticlesWithQuiz } from '@/lib/articles';
import { QuizCard } from '@/components/quiz/quiz-card';

export const metadata = {
  title: "Quiz | Frank's IT Blog",
  description: '퀴즈가 있는 글 모음',
};

export default async function QuizPage() {
  const articles = await getArticlesWithQuiz('ko');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Quiz
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Quiz
        </h1>
        <p className="mt-2 text-sm text-bento-dim">{articles.length}개의 퀴즈</p>
      </header>

      {articles.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          아직 퀴즈가 있는 글이 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {articles.map((a) => (
            <QuizCard
              key={a.slug}
              slug={a.slug}
              title={a.title}
              date={a.date}
              series={a.series}
              quizCount={a.quizCount}
              lang="ko"
              countLabel="문항"
              ariaLabel={`${a.title} 퀴즈 풀기`}
            />
          ))}
        </section>
      )}
    </main>
  );
}
