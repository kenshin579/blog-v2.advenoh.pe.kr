import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
