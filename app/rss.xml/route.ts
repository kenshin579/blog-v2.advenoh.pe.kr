import { getAllArticles } from '@/lib/articles';

export const dynamic = 'force-static';

export async function GET() {
  const articles = await getAllArticles();
  const siteUrl = 'https://advenoh.pe.kr';

  // 최신 20개 글만 RSS에 포함
  const latestArticles = articles.slice(0, 20);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Advenoh IT Blog</title>
    <link>${siteUrl}</link>
    <description>IT 기술 블로그 - 개발, 클라우드, 데이터베이스</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${latestArticles
      .map(
        (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}/article/${article.slug}</link>
      <guid>${siteUrl}/article/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt || article.title}]]></description>
      <category>${article.category}</category>
      ${article.tags?.map((tag) => `<category>${tag}</category>`).join('\n      ') || ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`.trim();

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
