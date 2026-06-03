'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLangFromPathname } from '@/lib/i18n/lang';

export function LangRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    let pref: string | null = null;
    try { pref = localStorage.getItem('preferred-lang'); } catch {}
    if (!pref) return;
    const current = getLangFromPathname(pathname);
    if (pref === current) return;
    if (pref === 'en' && current === 'ko') {
      router.replace(pathname === '/' ? '/en' : `/en${pathname}`);
    } else if (pref === 'ko' && current === 'en') {
      router.replace(pathname.replace(/^\/en(?=\/|$)/, '') || '/');
    }
  }, [pathname, router]);
  return null;
}
