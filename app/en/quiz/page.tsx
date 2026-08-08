import { getArticlesWithQuiz } from '@/lib/articles';
import { QuizCard } from '@/components/quiz/quiz-card';

export const metadata = {
  title: "Quiz | Frank's IT Blog",
  description: 'Blog posts with quizzes',
};

export default async function QuizPage() {
  const articles = await getArticlesWithQuiz('en');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Quiz
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Quiz
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length} quiz set{articles.length === 1 ? '' : 's'}
        </p>
      </header>

      {articles.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          No posts with quizzes yet.
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
              lang="en"
              countLabel=" questions"
              ariaLabel={`Take the quiz for ${a.title}`}
            />
          ))}
        </section>
      )}
    </main>
  );
}
