import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { create } from 'xmlbuilder2';
import { blogConfig } from '../config';

interface ArticleMetadata {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
  lang: 'ko' | 'en';
}

interface Manifest {
  articles: ArticleMetadata[];
  categories: string[];
  tags: string[];
  series: string[];
  generatedAt: string;
}

/**
 * 마크다운 → HTML 변환 (RSS용 경량 파이프라인)
 */
async function markdownToHtml(markdown: string, slug: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);

  let html = String(result);

  // 상대 경로 이미지 → 절대 URL 변환 (./ 접두사 제거 포함)
  html = html.replace(
    /<img([^>]*)\ssrc="(?!http|\/)(.*?)"/g,
    (_, attrs, imgPath) => {
      const cleanPath = imgPath.replace(/^\.\//, '');
      return `<img${attrs} src="${blogConfig.baseUrl}/images/${slug}/${cleanPath}"`;
    }
  );

  return html;
}

/**
 * HTML에서 텍스트만 추출하여 요약 생성
 */
function extractTextSummary(html: string, maxLength: number = 300): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 마크다운 파일에서 본문 읽기
 */
function readArticleContent(slug: string, lang: 'ko' | 'en' = 'ko'): string | null {
  const contentsDir = path.join(process.cwd(), 'contents');
  const fileName = lang === 'en' ? 'index_en.md' : 'index.md';
  const indexPath = path.join(contentsDir, slug, fileName);

  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️  Article not found: ${indexPath}`);
    return null;
  }

  const raw = fs.readFileSync(indexPath, 'utf-8');
  const { content } = matter(raw);
  return content;
}

/**
 * RSS 2.0 피드 생성
 */
export async function generateRSS(manifestPath: string, outputPath: string, lang: 'ko' | 'en' = 'ko'): Promise<void> {
  console.log('📡 Generating RSS feed...');

  // Manifest 로드
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    return;
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  const langPrefix = lang === 'en' ? '/en' : '';

  // 언어 필터링 후 최신 article 20개 (이미 날짜순 정렬되어 있음)
  const filtered = manifest.articles.filter((a) => a.lang === lang);
  const recentArticles = filtered.slice(0, 20);

  // RSS XML 생성
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', {
      version: '2.0',
      'xmlns:atom': 'http://www.w3.org/2005/Atom',
      'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
    });

  const channel = root.ele('channel');

  // 채널 정보
  channel.ele('title').txt(blogConfig.title);
  channel.ele('link').txt(`${blogConfig.baseUrl}${langPrefix}`);
  channel.ele('description').txt(blogConfig.description);
  channel.ele('language').txt(lang === 'en' ? 'en' : blogConfig.language);
  channel.ele('lastBuildDate').txt(new Date().toUTCString());
  channel.ele('atom:link', {
    href: `${blogConfig.baseUrl}${langPrefix}/rss.xml`,
    rel: 'self',
    type: 'application/rss+xml',
  });

  // Article 아이템 추가
  for (const article of recentArticles) {
    const item = channel.ele('item');
    const articleUrl = `${blogConfig.baseUrl}${langPrefix}/${article.slug.split('/').pop()}`;

    item.ele('title').txt(article.title);
    item.ele('link').txt(articleUrl);
    item.ele('guid', { isPermaLink: 'true' }).txt(articleUrl);
    item.ele('pubDate').txt(new Date(article.date).toUTCString());

    // 본문 HTML 생성
    const markdown = readArticleContent(article.slug, lang);
    if (markdown) {
      const html = await markdownToHtml(markdown, article.slug);

      // description: excerpt 또는 본문 앞 300자
      const description = article.excerpt || extractTextSummary(html);
      item.ele('description').txt(description);

      // content:encoded: 본문 전체 HTML (CDATA)
      item.ele('content:encoded').dat(html);
    } else if (article.excerpt) {
      item.ele('description').txt(article.excerpt);
    }

    // 카테고리 (category 태그)
    if (article.category) {
      item.ele('category').txt(article.category);
    }

    // 태그 (category 태그로 추가)
    if (article.tags && article.tags.length > 0) {
      for (const tag of article.tags) {
        item.ele('category').txt(tag);
      }
    }

    // 시리즈 정보 (category 태그로 추가)
    if (article.series) {
      item.ele('category').txt(`Series: ${article.series}`);
    }

    // 작성자 정보
    if (blogConfig.email) {
      item.ele('author').txt(`${blogConfig.email} (${blogConfig.author})`);
    }
  }

  // XML 파일 저장
  const xml = root.end({ prettyPrint: true });
  fs.writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ RSS feed generated at ${outputPath}`);
  console.log(`📊 Total items: ${recentArticles.length} (latest 20 articles)`);
}
