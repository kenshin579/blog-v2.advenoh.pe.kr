import { parseMarkdown, Article } from './markdown';

let articlesCache: Article[] | null = null;
let loadingPromise: Promise<Article[]> | null = null;

export async function loadArticles(): Promise<Article[]> {
  // Return cached articles if available
  if (articlesCache) {
    return articlesCache;
  }

  // Return in-flight promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start new loading process
  loadingPromise = (async () => {
    try {
      const manifestResponse = await fetch('/articles/manifest.json');
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load manifest: ${manifestResponse.statusText}`);
      }
      const manifest: string[] = await manifestResponse.json();

      const articles = await Promise.all(
        manifest.map(async (filename) => {
          const response = await fetch(`/articles/${filename}`);
          if (!response.ok) {
            throw new Error(`Failed to load ${filename}: ${response.statusText}`);
          }
          const markdown = await response.text();
          const slug = filename.replace('.md', '');
          return parseMarkdown(markdown, slug);
        })
      );

      articlesCache = articles;
      return articles;
    } catch (error) {
      console.error('Failed to load articles:', error);
      loadingPromise = null; // Reset promise so retry is possible
      throw error; // Propagate error to caller
    }
  })();

  return loadingPromise;
}

export function clearArticlesCache() {
  articlesCache = null;
  loadingPromise = null;
}
