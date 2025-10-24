import { Link } from "wouter";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onSearchClick: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/">
          <span className="flex items-center space-x-2 cursor-pointer" data-testid="link-home">
            <span className="text-xl font-bold">IT Blog</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            data-testid="button-search"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/series">
            <Button variant="ghost" data-testid="button-series">
              Series
            </Button>
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
