import { getAllArticles, getArticleTitleFromSlug } from '@/lib/articles';
import Link from 'next/link';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT tech blog — development, cloud, database',
};

function formatDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function EnHome() {
  const articles = await getAllArticles('en');
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Frank&apos;s IT Blog</h1>
      <ul className="space-y-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/en/${getArticleTitleFromSlug(a.slug)}/`} className="font-medium hover:underline">
              {a.title}
            </Link>
            <div className="text-sm text-muted-foreground">{formatDate(a.date)}</div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm"><Link href="/en/posts/" className="underline">All posts →</Link></p>
    </main>
  );
}
