export type Lang = 'ko' | 'en';

/** pathname 앞부분이 /en 이면 'en', 아니면 'ko' */
export function getLangFromPathname(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ko';
}

/** 한국어 루트 기준 경로를 활성 언어 경로로 변환. ko는 그대로, en은 /en prefix. */
export function localizeHref(href: string, lang: Lang): string {
  if (lang === 'ko') return href;
  if (href === '/') return '/en';
  return `/en${href.startsWith('/') ? '' : '/'}${href}`;
}
