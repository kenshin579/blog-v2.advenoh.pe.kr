import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

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

function parseFrontmatter(markdown: string): { data: ArticleFrontmatter; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { data: { title: '', date: '' }, content: markdown };
  }

  const frontmatterText = match[1];
  const content = match[2];

  const data: any = {};
  const lines = frontmatterText.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (key === 'tags') {
      const arrayMatch = value.match(/\[(.*?)\]/);
      if (arrayMatch) {
        data[key] = arrayMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
      }
    } else if (key === 'seriesOrder') {
      data[key] = parseInt(value);
    } else {
      data[key] = value;
    }
  }

  return { data: data as ArticleFrontmatter, content };
}

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang || 'text';
  const highlighted = Prism.languages[language]
    ? Prism.highlight(text, Prism.languages[language], language)
    : text;

  return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
};

renderer.heading = ({ tokens, depth }: { tokens: any[]; depth: number }) => {
  const text = tokens.map(t => t.text || '').join('');
  const id = text.toLowerCase().replace(/[^\w가-힣]+/g, '-');
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

function extractFirstImage(content: string): string | undefined {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
  const match = content.match(imageRegex);
  return match ? match[2] : undefined;
}

export function parseMarkdown(markdown: string, slug: string): Article {
  const { data, content } = parseFrontmatter(markdown);
  const html = marked(content) as string;
  const firstImage = extractFirstImage(content);

  return {
    slug,
    frontmatter: data,
    content,
    html,
    firstImage,
  };
}

export function extractTOC(html: string): TOCItem[] {
  const headingRegex = /<h([2-3])\s+id="([^"]+)">([^<]+)<\/h[2-3]>/g;
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

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
