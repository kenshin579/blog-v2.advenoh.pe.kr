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
import { getDictionary } from './i18n/dictionaries';

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
 * 렌더링된 HTML에서 <!-- slides --> 마커를 슬라이드 임베드 블록으로 치환한다.
 * 마커가 없으면 원본을 그대로 돌려준다.
 *
 * 반드시 markdown → HTML 변환이 끝난 뒤(파싱 후) 호출해야 한다. 코드펜스 안에
 * 마커 사용법을 예시로 적어둔 경우, rehype-stringify 가 그 리터럴 텍스트를
 * `&#x3C;!-- slides -->` 형태로 엔티티 인코딩하기 때문에 실제 블록 레벨 HTML
 * 주석(그대로 살아남는다)과 자동으로 구분된다. 파싱 전 raw markdown에 대고
 * 치환하면 코드펜스 안의 예시까지 오탐한다.
 *
 * 마커는 본문에서 자기 줄에 단독으로 있어야 한다. 문단 중간에 인라인으로 넣으면
 * <p> 안에 <div>가 중첩된 유효하지 않은 HTML이 만들어진다.
 */
function replaceSlidesMarker(
  html: string,
  slug: string,
  lang: 'ko' | 'en',
  title: string
): string {
  if (!/<!--\s*slides\s*-->/.test(html)) return html;

  const t = getDictionary(lang);
  // slug 은 {category}/{글폴더} 형태. URL 에는 글폴더만 쓴다.
  const articleDir = slug.split('/').pop() ?? slug;
  const src = lang === 'en' ? `/en/${articleDir}/slides/` : `/${articleDir}/slides/`;
  const safeTitle = escapeHtmlAttribute(title);

  const embed = [
    '<div class="slides-embed">',
    `<iframe class="slides-embed__frame" src="${src}" title="${safeTitle} ${t.slides.frameTitle}" loading="lazy" allowfullscreen></iframe>`,
    `<a class="slides-embed__open" href="${src}" target="_blank" rel="noopener">${t.slides.open}</a>`,
    `<p class="slides-embed__hint">${t.slides.hint}</p>`,
    '</div>',
  ].join('\n');

  return html.replace(/<!--\s*slides\s*-->/g, embed);
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

  const frontmatter = data as ArticleFrontmatter;
  // Normalize description → excerpt (markdown 파일은 description 키 사용, UI는 excerpt 사용)
  if (!frontmatter.excerpt && frontmatter.description) {
    frontmatter.excerpt = frontmatter.description;
  }

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
    .process(content);

  let html = String(result);

  // 상대 경로 이미지만 /images/{slug}/{filename} 형식으로 변환
  // HTTP/HTTPS URL이나 절대 경로는 그대로 유지
  html = html.replace(
    /<img([^>]*)\ssrc="(?!http|\/)(.*?)"/g,
    `<img$1 src="/images/${slug}/$2"`
  );

  // <!-- slides --> 마커를 슬라이드 임베드 블록으로 치환한다 (파싱 후 HTML 단계).
  html = replaceSlidesMarker(html, slug, lang, frontmatter.title ?? '');

  const firstImage = extractFirstImage(content);

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
