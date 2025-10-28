# 추적 스크립트 구현

## 목표
Google AdSense, Google Analytics, Naver Search Console을 모든 페이지에 추가

## 수정 파일
- `app/layout.tsx`

## 구현 내용

### 1. Import 추가
```tsx
import Script from 'next/script';
```

### 2. Metadata 수정
기존 metadata 객체에 Naver verification 추가:

```tsx
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
  verification: {
    naver: '5e2f8b4431e6d7b2202d923832f2a90250e5a594',
  },
};
```

### 3. RootLayout 컴포넌트 수정
`<html>` 태그 내부, `<body>` 태그 직전에 스크립트 추가:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
```

## 기술 세부사항

### Script 컴포넌트 strategy
- `afterInteractive`: 페이지가 인터랙티브된 후 로드 (성능 최적화)

### 서비스 정보
- Google AdSense: `ca-pub-8868959494983515`
- Google Analytics: `G-B0KLVK60W1`
- Naver Verification: `5e2f8b4431e6d7b2202d923832f2a90250e5a594`
