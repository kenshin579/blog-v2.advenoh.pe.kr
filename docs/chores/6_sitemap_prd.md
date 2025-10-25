# PRD: Sitemap 및 RSS 피드 생성

## 개요
블로그의 SEO 최적화 및 구독자 편의성을 위해 XML Sitemap과 RSS 피드를 자동 생성하는 기능을 구현합니다.

## 목표
- 검색 엔진 크롤링 최적화를 위한 sitemap.xml 제공
- RSS 리더 구독을 위한 RSS 2.0 피드 제공
- 콘텐츠 업데이트 시 자동 갱신

## 범위

### In Scope
1. **Sitemap.xml 생성**
   - 모든 article 페이지 포함
   - 정적 페이지 포함 (/, /series)
   - 마지막 수정일, 우선순위, 변경 빈도 메타데이터

2. **RSS 피드 생성**
   - RSS 2.0 표준 준수
   - 최신 article 포함 (최대 20개)
   - 전체 콘텐츠 또는 excerpt 포함

3. **자동 갱신**
   - 빌드 타임 생성 방식 사용
   - manifest.json 및 article frontmatter 활용
   - 빌드 시 자동으로 sitemap.xml과 rss.xml 생성

### Out of Scope
- Atom 피드 (향후 고려)
- 이미지 sitemap
- 동영상 sitemap
- 다국어 sitemap

## 기술 요구사항

### Sitemap.xml 구조
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blog.advenoh.pe.kr/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://blog.advenoh.pe.kr/article/article-slug</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### RSS 피드 구조
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>프랭크 기술 블로그</title>
    <link>https://blog.advenoh.pe.kr</link>
    <description>개발자를 위한 기술 블로그</description>
    <language>ko</language>
    <lastBuildDate>Mon, 15 Jan 2024 00:00:00 GMT</lastBuildDate>
    <item>
      <title>Article Title</title>
      <link>https://blog.advenoh.pe.kr/article/slug</link>
      <description>Article excerpt or full content</description>
      <pubDate>Mon, 15 Jan 2024 00:00:00 GMT</pubDate>
      <guid>https://blog.advenoh.pe.kr/article/slug</guid>
    </item>
  </channel>
</rss>
```

## 구현 방식

### ✅ 선택된 방식: 빌드 타임 생성

**선택 이유:**
- 서버 부하 없음 - 정적 파일 서빙으로 빠른 응답
- CDN 캐싱 가능
- 현재 블로그 구조와 일치 (정적 사이트 생성 방식)
- 안정적이고 예측 가능한 성능

**고려사항:**
- 새 article 추가 시 재빌드 필요 (현재 워크플로우와 동일)

**구현 방식:**
- npm script로 빌드 전 sitemap/RSS 생성
- `client/public/sitemap.xml`, `client/public/rss.xml`로 출력
- 빌드 시 `dist/public/`로 복사되어 정적 파일로 서빙

### 🔄 검토된 대안: 런타임 동적 생성

**장점:** 실시간 업데이트 가능, 빌드 불필요
**단점:** 서버 부하 증가, 응답 시간 증가, 복잡도 증가
**결론:** 현재 정적 사이트 구조와 맞지 않아 미채택

## 필요 작업

### 1. 패키지 설치
```bash
npm install --save-dev fast-xml-parser  # XML 생성
# 또는
npm install --save-dev xmlbuilder2
```

### 2. 파일 구조
```
scripts/
  generate-feeds.ts # 빌드 타임 생성 메인 스크립트
  generators/
    sitemap.ts      # Sitemap 생성 로직
    rss.ts          # RSS 생성 로직
  config.ts         # 블로그 메타데이터 (title, description, baseUrl)
client/
  public/
    sitemap.xml     # 생성된 sitemap (빌드 시 생성)
    rss.xml         # 생성된 RSS 피드 (빌드 시 생성)
    robots.txt      # 검색 엔진 크롤러 설정
```

### 3. 설정 파일 추가
`scripts/config.ts`:
```typescript
export const blogConfig = {
  title: "프랭크 기술 블로그",
  description: "개발자를 위한 기술 블로그",
  baseUrl: process.env.VITE_BASE_URL || "https://blog.advenoh.pe.kr",
  language: "ko",
  author: "advenoh",
};
```

### 4. Sitemap 생성 로직 (`scripts/generators/sitemap.ts`)
- `client/public/articles/manifest.json`에서 article 목록 로드
- 각 article의 마크다운 파일에서 frontmatter (date) 추출
- 정적 페이지 URL 추가 (/, /series)
- 우선순위 및 변경 빈도 설정
- XML 생성 및 `client/public/sitemap.xml`에 저장

### 5. RSS 생성 로직 (`scripts/generators/rss.ts`)
- `client/public/articles/manifest.json`에서 article 목록 로드
- 각 article의 마크다운 파일에서 frontmatter 파싱
- date 기준 정렬 (최신순, 최대 20개)
- frontmatter에서 title, excerpt, date, tags 추출
- excerpt를 HTML로 사용 (또는 markdown → HTML 변환)
- RSS 2.0 XML 생성 및 `client/public/rss.xml`에 저장

### 6. 빌드 스크립트 수정
`package.json`:
```json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-feeds.ts",
    "build": "vite build && tsc && vite build --ssr"
  }
}
```

### 7. robots.txt 추가
`client/public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://blog.advenoh.pe.kr/sitemap.xml
```

## 우선순위 및 변경 빈도 규칙

### Sitemap Priority
- Homepage (`/`): 1.0
- Series page (`/series`): 0.9
- Individual articles: 0.8
- Other pages: 0.5

### Change Frequency
- Homepage: daily
- Articles: monthly
- Series page: weekly

## 테스트 계획

### Sitemap 검증
1. XML 문법 검증: https://www.xml-sitemaps.com/validate-xml-sitemap.html
2. Google Search Console에 sitemap 등록
3. 모든 article URL이 포함되었는지 확인

### RSS 피드 검증
1. RSS 검증: https://validator.w3.org/feed/
2. RSS 리더에서 구독 테스트 (Feedly, Inoreader 등)
3. 최신 article이 올바르게 표시되는지 확인

## 성공 지표
- Sitemap이 모든 article URL을 포함
- RSS 피드가 RSS 2.0 표준 준수
- XML 검증 도구 통과
- Google Search Console 등록 성공
- RSS 리더에서 정상 구독 가능

## 추가 고려사항
- 환경 변수로 baseUrl 관리 (`VITE_BASE_URL=https://blog.advenoh.pe.kr`)
- 개발 환경과 프로덕션 환경 분리
- lastmod 날짜를 article frontmatter의 `date` 또는 파일 수정 시간 사용
- RSS 피드에 카테고리/태그 포함 여부
- 전체 콘텐츠 vs excerpt 포함 결정 (excerpt 사용 권장)

## 참고 자료
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [Google Search Central - Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
