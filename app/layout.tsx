import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'Advenoh IT Blog',
    template: '%s | Advenoh IT Blog',
  },
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://advenoh.pe.kr',
    siteName: 'Advenoh IT Blog',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built with Next.js and shadcn/ui. © 2025 Advenoh
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
