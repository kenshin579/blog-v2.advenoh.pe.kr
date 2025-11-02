# PRD: 구글 검색 결과에 사이트 이름 표시 개선

## 📋 개요

**목표**: 구글 검색 결과에서 "advenoh.pe.kr" 대신 "Frank's IT Blog"가 사이트 이름으로 표시되도록 개선

**현재 상황**:
- 구글 검색 시 각 결과 항목에 "advenoh.pe.kr" 도메인 이름이 표시됨
- 브랜드 인지도 측면에서 "Frank's IT Blog"로 표시하는 것이 더 효과적

**기대 결과**:
```
현재: advenoh.pe.kr → Frank's IT Blog - 글 제목
변경: Frank's IT Blog → 글 제목
```

## 🎯 요구사항

### 1. WebSite Schema (JSON-LD) 추가

**우선순위**: 🔴 필수

구글이 사이트 이름을 인식할 수 있도록 구조화된 데이터 추가

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Frank's IT Blog",
  "alternateName": "프랭크의 IT 블로그",
  "url": "https://blog.advenoh.pe.kr",
  "description": "개발, 클라우드, 데이터베이스 관련 기술 블로그",
  "inLanguage": "ko-KR"
}
```

**구현 위치**: 모든 페이지의 `<head>` 섹션

### 2. Open Graph 메타 태그 추가

**우선순위**: 🟡 권장

소셜 미디어 공유 및 검색 엔진 최적화

```html
<meta property="og:site_name" content="Frank's IT Blog" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ko_KR" />
```

### 3. 추가 메타 태그 최적화

**우선순위**: 🟢 선택

```html
<meta name="application-name" content="Frank's IT Blog" />
<meta name="apple-mobile-web-app-title" content="Frank's IT Blog" />
```

## 📊 기술 사양

### JSON-LD Schema 필수 속성

| 속성 | 값 | 설명 |
|------|-----|------|
| @type | WebSite | Schema.org 타입 |
| name | Frank's IT Blog | 사이트 공식 이름 |
| url | https://blog.advenoh.pe.kr | 사이트 URL |
| description | (사이트 설명) | 사이트 요약 |

### Open Graph 필수 속성

| 속성 | 값 | 설명 |
|------|-----|------|
| og:site_name | Frank's IT Blog | 소셜/검색 표시 이름 |
| og:type | website | 콘텐츠 타입 |
| og:locale | ko_KR | 언어/지역 |

## 🔍 참고 자료

- [Google Search Central - Site Names](https://developers.google.com/search/docs/appearance/site-names)
- [Schema.org - WebSite](https://schema.org/WebSite)
- [Open Graph Protocol](https://ogp.me/)
- [Rich Results Test](https://search.google.com/test/rich-results)

## ⚠️ 주의사항

1. **반영 시간**: 구글 검색 결과 반영까지 1-2주 소요 가능
2. **일관성**: 모든 페이지에 동일한 사이트 이름 적용
3. **우선순위**: JSON-LD WebSite schema가 가장 중요
4. **중복 방지**: 동일한 schema가 여러 번 선언되지 않도록 주의

## 📚 관련 문서

- [구현 가이드](./1_google_search_implementation.md)
- [작업 목록](./1_google_search_todo.md)
