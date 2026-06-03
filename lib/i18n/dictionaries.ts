import type { Lang } from './lang';

type Dict = {
  nav: { home: string; posts: string; series: string; tags: string };
  article: { related: string; prev: string; next: string; toc: string };
  posts: { all: string; categories: string };
  language: { ko: string; en: string };
  footer: { tagline: string; categories: string; info: string; rss: string; sitemap: string; series: string };
};

const ko: Dict = {
  nav: { home: '홈', posts: '글', series: '시리즈', tags: '태그' },
  article: { related: '관련 글', prev: '이전 글', next: '다음 글', toc: '목차' },
  posts: { all: '전체 글', categories: '카테고리' },
  language: { ko: '한국어', en: 'English' },
  footer: {
    tagline: '기술 블로그, 프로그래밍, 개발 관련 지식과 경험을 공유하는 개인 블로그입니다.',
    categories: '카테고리',
    info: '정보',
    rss: 'RSS',
    sitemap: '사이트맵',
    series: '시리즈',
  },
};

const en: Dict = {
  nav: { home: 'Home', posts: 'Posts', series: 'Series', tags: 'Tags' },
  article: { related: 'Related posts', prev: 'Previous', next: 'Next', toc: 'Contents' },
  posts: { all: 'All posts', categories: 'Categories' },
  language: { ko: '한국어', en: 'English' },
  footer: {
    tagline: 'A personal blog sharing knowledge and experience on tech, programming, and development.',
    categories: 'Categories',
    info: 'Info',
    rss: 'RSS',
    sitemap: 'Sitemap',
    series: 'Series',
  },
};

const dictionaries: Record<Lang, Dict> = { ko, en };

export function getDictionary(lang: Lang): Dict {
  return dictionaries[lang];
}
