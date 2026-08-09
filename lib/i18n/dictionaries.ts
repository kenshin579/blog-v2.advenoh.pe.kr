import type { Lang } from './lang';

type Dict = {
  nav: { home: string; posts: string; series: string; slides: string; quiz: string; tags: string };
  article: { related: string; prev: string; next: string; toc: string };
  posts: { all: string; categories: string };
  language: { ko: string; en: string };
  footer: { tagline: string; categories: string; info: string; rss: string; sitemap: string; series: string };
  slides: { frameTitle: string; open: string; hint: string };
  quiz: {
    check: string;
    retry: string;
    correct: string;
    incorrect: string;
    answerPrefix: string;
    scoreTemplate: string; // {score}, {total} 치환
    blankPlaceholder: string;
    o: string;
    x: string;
  };
};

const ko: Dict = {
  nav: { home: '홈', posts: '글', series: '시리즈', slides: '슬라이드', quiz: '퀴즈', tags: '태그' },
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
  slides: {
    frameTitle: '슬라이드',
    open: '슬라이드 새 탭에서 열기 →',
    hint: '슬라이드를 클릭한 뒤 <kbd>←</kbd> <kbd>→</kbd> 이동 · <kbd>f</kbd> 전체화면 · <kbd>?</kbd> 도움말',
  },
  quiz: {
    check: '확인',
    retry: '다시 풀기',
    correct: '정답',
    incorrect: '오답',
    answerPrefix: '정답:',
    scoreTemplate: '{score} / {total} 맞았습니다',
    blankPlaceholder: '답을 입력하세요',
    o: 'O',
    x: 'X',
  },
};

const en: Dict = {
  nav: { home: 'Home', posts: 'Posts', series: 'Series', slides: 'Slides', quiz: 'Quiz', tags: 'Tags' },
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
  slides: {
    frameTitle: 'slides',
    open: 'Open slides in a new tab →',
    hint: 'Click the slides, then <kbd>←</kbd> <kbd>→</kbd> to navigate · <kbd>f</kbd> fullscreen · <kbd>?</kbd> help',
  },
  quiz: {
    check: 'Check',
    retry: 'Try again',
    correct: 'Correct',
    incorrect: 'Incorrect',
    answerPrefix: 'Answer:',
    scoreTemplate: '{score} / {total} correct',
    blankPlaceholder: 'Type your answer',
    o: 'O',
    x: 'X',
  },
};

const dictionaries: Record<Lang, Dict> = { ko, en };

export function getDictionary(lang: Lang): Dict {
  return dictionaries[lang];
}
