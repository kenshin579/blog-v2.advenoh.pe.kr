'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { socialLinks } from '@/config/social';

interface Manifest {
  categories: string[];
}

export function SiteFooter() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/content-manifest.json')
      .then(res => res.json())
      .then((manifest: Manifest) => {
        setCategories(manifest.categories.slice(0, 10));
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  return (
    <footer className="bg-muted/30 dark:bg-background border-t">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">

          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Frank's IT Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              기술 블로그, 프로그래밍, 개발 관련<br />
              지식과 경험을 공유하는 개인 블로그입니다.
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* 중앙: 카테고리 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">카테고리</h3>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              {categories.length > 0 ? (
                categories.map(tag => (
                  <Link
                    key={tag}
                    href={`/?category=${tag}`}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    {tag}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-muted-foreground col-span-3">Loading...</span>
              )}
            </div>
          </div>

          {/* 오른쪽: 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">정보</h3>
            <div className="space-y-2">
              <a
                href="/rss.xml"
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                RSS
              </a>
              <a
                href="/sitemap.xml"
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                사이트맵
              </a>
              <Link
                href="/series"
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                시리즈
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Advenoh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
