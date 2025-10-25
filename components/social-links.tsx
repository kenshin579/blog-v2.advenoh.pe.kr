'use client';

import Link from 'next/link';
import { Linkedin, Instagram, TrendingUp, LucideIcon } from 'lucide-react';
import { socialLinks } from '@/lib/site-config';
import { Button } from '@/components/ui/button';

// 아이콘 매핑
const iconMap: Record<string, LucideIcon> = {
  Linkedin,
  Instagram,
  TrendingUp,
};

export function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((link) => {
        const Icon = iconMap[link.icon];

        if (!Icon) {
          console.warn(`Icon not found: ${link.icon}`);
          return null;
        }

        return (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            asChild
          >
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
