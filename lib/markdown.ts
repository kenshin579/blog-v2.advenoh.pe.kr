import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';

export interface ArticleFrontmatter {
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  html: string;
  firstImage?: string;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Markdown을 HTML로 변환
 */
export async function parseMarkdown(markdown: string, slug: string): Promise<Article> {
  // gray-matter로 frontmatter 파싱
  const { data, content } = matter(markdown);

  // unified로 markdown → HTML 변환
  const result = await unified()
    .use(remarkParse) // markdown → mdast
    .use(remarkGfm) // GitHub Flavored Markdown 지원
    .use(remarkRehype) // mdast → hast
    .use(rehypeSlug) // heading에 id 추가
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
    }) // heading 자동 링크
    .use(rehypePrism, {
      showLineNumbers: true,
    }) // 코드 하이라이팅
    .use(rehypeStringify) // hast → HTML
    .process(content);

  const html = String(result);
  const firstImage = extractFirstImage(content);

  return {
    slug,
    frontmatter: data as ArticleFrontmatter,
    content,
    html,
    firstImage,
  };
}

/**
 * 첫 번째 이미지 추출
 */
function extractFirstImage(content: string): string | undefined {
  const imageRegex = /!\[([^\]]*)]\(([^)]+)\)/;
  const match = content.match(imageRegex);
  return match ? match[2] : undefined;
}

/**
 * Table of Contents 추출
 */
export function extractTOC(html: string): TOCItem[] {
  const headingRegex = /<h([2-3])\s+id="([^"]+)">(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[2-3]>/g;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      id: match[2],
      text: match[3],
      level: parseInt(match[1]),
    });
  }

  return toc;
}

/**
 * 읽기 시간 계산 (분)
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
