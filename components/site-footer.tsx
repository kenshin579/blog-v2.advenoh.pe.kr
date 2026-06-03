'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { socialLinks } from '@/config/social';
import { getLangFromPathname, localizeHref, type Lang } from '@/lib/i18n/lang';
import { getDictionary } from '@/lib/i18n/dictionaries';

interface Manifest {
  categories: string[];
}

export function SiteFooter() {
  const [categories, setCategories] = useState<string[]>([]);
  const pathname = usePathname();
  const lang: Lang = getLangFromPathname(pathname);
  const t = getDictionary(lang);
  const rssHref = lang === 'en' ? '/en/rss.xml' : '/rss.xml';

  useEffect(() => {
    fetch('/content-manifest.json')
      .then(res => res.json())
      .then((manifest: Manifest) => {
        setCategories(manifest.categories.slice(0, 10));
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  return (
    <footer className="bg-bento-cream dark:bg-bento-card border-t border-bento-ink/10 dark:border-white/10">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">

          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Frank's IT Blog</h3>
            <p className="text-sm text-bento-dim leading-relaxed">
              {t.footer.tagline}
            </p>
            {/* 소셜 링크 */}
            <div className="flex gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="text-bento-dim hover:text-bento-ink transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* 중앙: 카테고리 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.footer.categories}</h3>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              {categories.length > 0 ? (
                categories.map(tag => (
                  <Link
                    key={tag}
                    href={localizeHref(`/?category=${tag}`, lang)}
                    className="text-sm text-bento-dim hover:text-bento-ink hover:underline transition-colors"
                  >
                    {tag}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-bento-dim col-span-3">Loading...</span>
              )}
            </div>
          </div>

          {/* 오른쪽: 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.footer.info}</h3>
            <div className="space-y-2">
              <a
                href={rssHref}
                className="block text-sm text-bento-dim hover:text-bento-ink hover:underline transition-colors"
              >
                {t.footer.rss}
              </a>
              <a
                href="/sitemap.xml"
                className="block text-sm text-bento-dim hover:text-bento-ink hover:underline transition-colors"
              >
                {t.footer.sitemap}
              </a>
              <Link
                href={localizeHref('/series', lang)}
                className="block text-sm text-bento-dim hover:text-bento-ink hover:underline transition-colors"
              >
                {t.footer.series}
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-12 pt-8 border-t border-bento-ink/10 dark:border-white/10 text-center text-sm text-bento-dim">
          © {new Date().getFullYear()} Advenoh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
