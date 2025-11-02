# 구글 검색 결과 사이트 이름 표시 개선 - 구현 가이드

## 📦 구현 개요

구글 검색에서 "Frank's IT Blog"가 사이트 이름으로 표시되도록 SEO 메타데이터 추가

## 🏗️ 구현 상세

### 1. SiteMetadata 컴포넌트 생성

**파일**: `client/src/components/SiteMetadata.tsx`

```tsx
import { useEffect } from 'react';

interface SiteMetadataProps {
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  url?: string;
}

export function SiteMetadata({
  title,
  description = "개발, 클라우드, 데이터베이스 관련 기술 블로그",
  type = "website",
  url = "https://blog.advenoh.pe.kr"
}: SiteMetadataProps) {
  useEffect(() => {
    // 동적으로 title 업데이트
    if (title) {
      document.title = `${title} | Frank's IT Blog`;
    } else {
      document.title = "Frank's IT Blog";
    }

    // JSON-LD schema 추가
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Frank's IT Blog",
      "alternateName": "프랭크의 IT 블로그",
      "url": url,
      "description": description,
      "inLanguage": "ko-KR"
    };

    const scriptId = 'site-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    
    scriptTag.textContent = JSON.stringify(schema);

    // Open Graph 메타 태그 업데이트
    updateMetaTag('property', 'og:site_name', "Frank's IT Blog");
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:locale', 'ko_KR');
    updateMetaTag('property', 'og:title', title || "Frank's IT Blog");
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', url);

    // 추가 메타 태그
    updateMetaTag('name', 'application-name', "Frank's IT Blog");
    updateMetaTag('name', 'apple-mobile-web-app-title', "Frank's IT Blog");
    
  }, [title, description, type, url]);

  return null;
}

function updateMetaTag(attrName: string, attrValue: string, content: string) {
  let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}
```

### 2. 페이지별 적용

#### Home.tsx
```tsx
import { SiteMetadata } from '@/components/SiteMetadata';

export default function Home() {
  return (
    <>
      <SiteMetadata 
        description="개발, 클라우드, 데이터베이스 관련 기술 블로그"
      />
      {/* 기존 코드 */}
    </>
  );
}
```

#### Article.tsx
```tsx
import { SiteMetadata } from '@/components/SiteMetadata';

export default function Article() {
  const article = /* article 로딩 로직 */;
  
  return (
    <>
      <SiteMetadata 
        title={article.title}
        description={article.excerpt}
        type="article"
        url={`https://blog.advenoh.pe.kr/article/${article.slug}`}
      />
      {/* 기존 코드 */}
    </>
  );
}
```

#### SeriesPage.tsx
```tsx
import { SiteMetadata } from '@/components/SiteMetadata';

export default function SeriesPage() {
  return (
    <>
      <SiteMetadata 
        title="시리즈"
        description="주제별로 정리된 시리즈 글 모음"
      />
      {/* 기존 코드 */}
    </>
  );
}
```

#### NotFound.tsx
```tsx
import { SiteMetadata } from '@/components/SiteMetadata';

export default function NotFound() {
  return (
    <>
      <SiteMetadata 
        title="페이지를 찾을 수 없습니다"
        description="요청하신 페이지를 찾을 수 없습니다"
      />
      {/* 기존 코드 */}
    </>
  );
}
```

### 3. HTML 템플릿 기본 메타 태그

**파일**: `client/index.html`

`<head>` 섹션에 추가:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- 기본 메타 태그 (fallback) -->
  <meta name="application-name" content="Frank's IT Blog" />
  <meta name="apple-mobile-web-app-title" content="Frank's IT Blog" />
  <meta property="og:site_name" content="Frank's IT Blog" />
  
  <title>Frank's IT Blog</title>
  
  <!-- 기존 코드 -->
</head>
```

## 🔍 검증 방법

### 1. 로컬 개발 환경

```bash
npm run dev
```

브라우저 개발자 도구 → Elements → `<head>` 태그 확인:
- `<script type="application/ld+json">` 존재 여부
- `<meta property="og:site_name">` 값 확인

### 2. Rich Results Test

배포 후:
1. [Google Rich Results Test](https://search.google.com/test/rich-results) 접속
2. 사이트 URL 입력
3. WebSite schema 인식 확인

### 3. Google Search Console

1. [Search Console](https://search.google.com/search-console) 접속
2. "향상" → "구조화된 데이터" 확인
3. WebSite 항목 확인

## ⚙️ 기술 노트

### JSON-LD 동적 생성 이유
- React 컴포넌트로 페이지별 메타데이터 동적 관리
- SSR 없이 CSR 환경에서도 동작
- Googlebot은 JavaScript 실행 후 크롤링하므로 문제없음

### useEffect 사용
- 컴포넌트 마운트 시 메타 태그 주입
- 페이지 전환 시 자동 업데이트
- 중복 방지 로직 포함

### 중복 방지
- `getElementById`로 기존 script 태그 재사용
- `querySelector`로 기존 meta 태그 업데이트
- 새 태그 생성은 존재하지 않을 때만

## 📊 예상 결과

**검색 결과 표시 변경**:
```
Before: advenoh.pe.kr
        https://blog.advenoh.pe.kr › article › some-article
        
After:  Frank's IT Blog
        https://blog.advenoh.pe.kr › article › some-article
```

**반영 시간**: 1-2주 (Google 크롤링 주기에 따라 변동)
