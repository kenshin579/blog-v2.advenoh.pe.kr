'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Rss, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CommandK } from '@/components/command-k';
import { getLangFromPathname, localizeHref, type Lang } from '@/lib/i18n/lang';
import { getDictionary } from '@/lib/i18n/dictionaries';

const NAV = [
  { key: 'home', href: '/' },
  { key: 'posts', href: '/posts' },
  { key: 'series', href: '/series' },
  { key: 'slides', href: '/slides' },
  { key: 'tags', href: '/tags' },
] as const;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const lang: Lang = getLangFromPathname(pathname);
  const t = getDictionary(lang);

  const koHref = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const enHref = lang === 'en' ? pathname : (pathname === '/' ? '/en' : `/en${pathname}`);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-bento-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bento-bg/60">
        <div className="mx-auto flex max-w-canvas items-center justify-between gap-4 px-6 py-4 md:px-10">
          {/* Logo + wordmark */}
          <Link
            href={localizeHref('/', lang)}
            className={`flex items-center gap-3 no-underline text-bento-ink ${FOCUS_RING}`}
            aria-label="frank.blog 홈"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bento-accent text-base font-bold text-white">
              F
            </span>
            <span className="text-base font-semibold">
              frank<span className="text-bento-dim">.blog</span>
            </span>
          </Link>

          {/* Desktop pill nav */}
          <nav
            aria-label="주요 메뉴"
            className="hidden gap-1 rounded-full bg-bento-ink/[0.06] p-1 dark:bg-white/10 md:flex"
          >
            {NAV.map((n) => {
              const href = localizeHref(n.href, lang);
              const active = isActive(pathname, href);
              return (
                <Link
                  key={n.key}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'rounded-full px-3 py-1.5 text-[13px] font-medium no-underline transition',
                    active
                      ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-bg'
                      : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  {t.nav[n.key]}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Search trigger — desktop full button, mobile icon only */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className={`hidden items-center gap-2.5 rounded-full bg-bento-ink/[0.06] px-3.5 py-2 text-[13px] text-bento-dim transition hover:bg-bento-ink/10 md:flex dark:bg-white/10 dark:hover:bg-white/15 ${FOCUS_RING}`}
            >
              <Search aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-bento-ink/10 bg-bento-card px-1.5 py-0 font-mono text-[10px] font-semibold text-bento-ink dark:border-white/10">
                ⌘K
              </kbd>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="md:hidden"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </Button>

            {/* Language toggle (desktop) */}
            <div
              className="hidden items-center gap-1.5 px-1 text-[13px] md:flex"
              aria-label="Language"
            >
              <Link
                href={enHref}
                onClick={() => { try { localStorage.setItem('preferred-lang', 'en'); } catch {} }}
                aria-current={lang === 'en' ? 'true' : undefined}
                className={[
                  'no-underline transition hover:text-bento-ink dark:hover:text-white',
                  lang === 'en' ? 'font-bold text-bento-ink dark:text-white' : 'text-bento-dim',
                  FOCUS_RING,
                ].join(' ')}
              >
                EN
              </Link>
              <span aria-hidden className="text-bento-dim">│</span>
              <Link
                href={koHref}
                onClick={() => { try { localStorage.setItem('preferred-lang', 'ko'); } catch {} }}
                aria-current={lang === 'ko' ? 'true' : undefined}
                className={[
                  'no-underline transition hover:text-bento-ink dark:hover:text-white',
                  lang === 'ko' ? 'font-bold text-bento-ink dark:text-white' : 'text-bento-dim',
                  FOCUS_RING,
                ].join(' ')}
              >
                KR
              </Link>
            </div>

            {/* Theme toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="테마 변경"
              className="rounded-full bg-bento-ink/[0.06] text-bento-ink hover:bg-bento-ink/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Sun aria-hidden="true" className="h-4 w-4 dark:hidden" />
              <Moon aria-hidden="true" className="hidden h-4 w-4 dark:block" />
            </Button>

            {/* RSS — desktop pill, mobile icon */}
            <Link
              href="/rss.xml"
              aria-label="RSS 피드"
              className={`hidden rounded-full bg-bento-ink px-4 py-2 text-[13px] font-medium text-white no-underline md:inline-block dark:bg-white dark:text-bento-bg ${FOCUS_RING}`}
            >
              RSS
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              asChild
              className="md:hidden"
            >
              <Link href="/rss.xml" aria-label="RSS 피드">
                <Rss aria-hidden="true" className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="메뉴 열기"
                  className="md:hidden"
                >
                  <Menu aria-hidden="true" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-bento-bg">
                <SheetHeader>
                  <SheetTitle className="text-left text-bento-ink">메뉴</SheetTitle>
                </SheetHeader>
                <nav aria-label="모바일 메뉴" className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => {
                    const href = localizeHref(n.href, lang);
                    const active = isActive(pathname, href);
                    return (
                      <Link
                        key={n.key}
                        href={href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'rounded-card-sm px-4 py-3 text-base font-medium no-underline transition',
                          active
                            ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-bg'
                            : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white',
                          FOCUS_RING,
                        ].join(' ')}
                      >
                        {t.nav[n.key]}
                      </Link>
                    );
                  })}

                  {/* Language toggle (mobile) */}
                  <div
                    className="mt-4 flex items-center gap-1.5 border-t border-bento-ink/10 px-4 pt-4 text-sm dark:border-white/10"
                    aria-label="Language"
                  >
                    <Link
                      href={enHref}
                      onClick={() => {
                        try { localStorage.setItem('preferred-lang', 'en'); } catch {}
                        setMobileNavOpen(false);
                      }}
                      aria-current={lang === 'en' ? 'true' : undefined}
                      className={[
                        'no-underline',
                        lang === 'en' ? 'font-bold text-bento-ink dark:text-white' : 'text-bento-dim',
                        FOCUS_RING,
                      ].join(' ')}
                    >
                      EN
                    </Link>
                    <span aria-hidden className="text-bento-dim">│</span>
                    <Link
                      href={koHref}
                      onClick={() => {
                        try { localStorage.setItem('preferred-lang', 'ko'); } catch {}
                        setMobileNavOpen(false);
                      }}
                      aria-current={lang === 'ko' ? 'true' : undefined}
                      className={[
                        'no-underline',
                        lang === 'ko' ? 'font-bold text-bento-ink dark:text-white' : 'text-bento-dim',
                        FOCUS_RING,
                      ].join(' ')}
                    >
                      KR
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <CommandK open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
