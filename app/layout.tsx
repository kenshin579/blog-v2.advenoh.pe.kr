import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: {
    default: "Frank's IT Blog",
    template: "%s | Frank's IT Blog",
  },
  description: '개발, 클라우드, 데이터베이스 관련 기술 블로그',
  applicationName: "Frank's IT Blog",
  appleWebApp: {
    title: "Frank's IT Blog",
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://blog.advenoh.pe.kr',
    siteName: "Frank's IT Blog",
  },
  twitter: {
    card: 'summary_large_image',
  },
  other: {
    'naver-site-verification': '5e2f8b4431e6d7b2202d923832f2a90250e5a594',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* JSON-LD WebSite Schema */}
      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: "Frank's IT Blog",
            alternateName: '프랭크의 IT 블로그',
            url: 'https://blog.advenoh.pe.kr',
            description: '개발, 클라우드, 데이터베이스 관련 기술 블로그',
            inLanguage: 'ko-KR',
          }),
        }}
      />

      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8868959494983515"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Google Analytics */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-B0KLVK60W1"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B0KLVK60W1');
          `
        }}
      />

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
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
