'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchDialog } from '@/components/search-dialog';

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl">
              Frank's IT Blog
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                홈
              </Link>
              <Link
                href="/series"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                시리즈
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">검색</span>
              <kbd className="hidden lg:inline-block px-2 py-0.5 text-xs bg-muted rounded">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="md:hidden"
              aria-label="검색"
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
