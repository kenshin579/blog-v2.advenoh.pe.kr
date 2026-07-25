import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';

export interface ArticleFrontmatter {
  title: string;
  date: string;
  excerpt?: string;
  description?: string;
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
 * HTML 속성값에 넣기 전 이스케이프
 */
function escapeHtmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 본문의 <!-- slides --> 마커를 슬라이드 임베드 블록으로 치환한다.
 * 마커가 없으면 원본을 그대로 돌려준다.
 *
 * 마커는 반드시 자기 줄에 단독으로 있어야 한다. 문단 안에 인라인으로 넣으면
 * CommonMark 가 HTML 블록으로 인식하지 못해 마크업이 그대로 노출된다.
 */
function replaceSlidesMarker(
  content: string,
  slug: string,
  lang: 'ko' | 'en',
  title: string
): string {
  if (!/<!--\s*slides\s*-->/.test(content)) return content;

  // slug 은 {category}/{글폴더} 형태. URL 에는 글폴더만 쓴다.
  const articleDir = slug.split('/').pop() ?? slug;
  const src = lang === 'en' ? `/en/${articleDir}/slides/` : `/${articleDir}/slides/`;
  const safeTitle = escapeHtmlAttribute(title);

  const embed = [
    '<div class="slides-embed">',
    `<iframe class="slides-embed__frame" src="${src}" title="${safeTitle} 슬라이드" loading="lazy" allowfullscreen></iframe>`,
    `<a class="slides-embed__open" href="${src}" target="_blank" rel="noopener">슬라이드 새 탭에서 열기 →</a>`,
    '<p class="slides-embed__hint">슬라이드를 클릭한 뒤 <kbd>←</kbd> <kbd>→</kbd> 이동 · <kbd>f</kbd> 전체화면 · <kbd>?</kbd> 도움말</p>',
    '</div>',
  ].join('\n');

  return content.replace(/<!--\s*slides\s*-->/g, embed);
}

/**
 * Markdown을 HTML로 변환
 */
export async function parseMarkdown(
  markdown: string,
  slug: string,
  lang: 'ko' | 'en' = 'ko'
): Promise<Article> {
  // gray-matter로 frontmatter 파싱
  const { data, content } = matter(markdown);

  // <!-- slides --> 마커를 임베드 블록으로 치환한 사본을 렌더에만 사용한다.
  // 반환되는 content 는 원본 그대로 유지한다 (읽기 시간·첫 이미지 추출이 쓴다).
  const renderSource = replaceSlidesMarker(
    content,
    slug,
    lang,
    (data as ArticleFrontmatter).title ?? ''
  );

  // unified로 markdown → HTML 변환
  const result = await unified()
    .use(remarkParse) // markdown → mdast
    .use(remarkGfm) // GitHub Flavored Markdown 지원
    .use(remarkRehype, { allowDangerousHtml: true }) // mdast → hast
    .use(rehypeRaw) // raw HTML 파싱
    .use(rehypeSlug) // heading에 id 추가
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
    }) // heading 자동 링크
    .use(rehypePrism, {
      showLineNumbers: true,
    }) // 코드 하이라이팅
    .use(rehypeStringify) // hast → HTML
    .process(renderSource);

  let html = String(result);

  // 상대 경로 이미지만 /images/{slug}/{filename} 형식으로 변환
  // HTTP/HTTPS URL이나 절대 경로는 그대로 유지
  html = html.replace(
    /<img([^>]*)\ssrc="(?!http|\/)(.*?)"/g,
    `<img$1 src="/images/${slug}/$2"`
  );

  const firstImage = extractFirstImage(content);

  const frontmatter = data as ArticleFrontmatter;
  // Normalize description → excerpt (markdown 파일은 description 키 사용, UI는 excerpt 사용)
  if (!frontmatter.excerpt && frontmatter.description) {
    frontmatter.excerpt = frontmatter.description;
  }

  return {
    slug,
    frontmatter,
    content,
    html,
    firstImage,
  };
}

/**
 * 첫 번째 이미지 추출
 */
function extractFirstImage(content: string): string | undefined {
  // 마크다운 이미지: ![alt](path)
  const mdMatch = content.match(/!\[([^\]]*)]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[2];

  // HTML 이미지: <img src="path" />
  const htmlMatch = content.match(/<img\s[^>]*src=["']([^"']+)["']/);
  if (htmlMatch) return htmlMatch[1];

  return undefined;
}

/**
 * HTML 엔티티 디코딩
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Table of Contents 추출
 */
export function extractTOC(html: string): TOCItem[] {
  const headingRegex = /<h([1-3])\s+id="([^"]+)">(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[1-3]>/g;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      id: match[2],
      text: decodeHtmlEntities(match[3]),
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
