# RSS 피드 본문 콘텐츠 추가 PRD

## 1. 개요

### 1.1 문제

현재 블로그 RSS 피드(`/rss.xml`)에 글 본문이 포함되지 않아 RSS reader에서 **제목만 표시**되고 내용이 보이지 않는다.

| 현재 (Frank's IT Blog) | 기대 (Outsider's Dev Story 등) |
|---|---|
| 제목 + 한 줄 요약(또는 제목 반복)만 표시 | 제목 + 본문 전체 HTML 표시 |

### 1.2 원인 분석

RSS 피드 생성 경로가 2곳 존재하며, 둘 다 동일한 문제가 있다.

**1) 빌드 타임 생성: `scripts/generators/rss.ts`**
- manifest에서 `excerpt`만 `<description>`에 삽입
- manifest에는 본문 콘텐츠가 없음 (메타데이터만 저장)

**2) 런타임 라우트: `app/rss.xml/route.ts`**
- `article.excerpt || article.title`을 `<description>`에 삽입
- excerpt가 없으면 **제목이 그대로 반복**됨

**공통 문제:**
- `<content:encoded>` 태그가 아예 없음
- RSS 2.0의 `content` 네임스페이스(`xmlns:content`)가 선언되지 않음
- 대부분의 RSS reader는 `<content:encoded>`가 있으면 본문으로 표시하고, 없으면 짧은 `<description>`만 보여줌

### 1.3 현재 RSS 구조

```xml
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Frank's IT Blog</title>
    ...
    <item>
      <title>MQTT v5 완벽 가이드 (1): 개념과 아키텍처 이해하기</title>
      <link>https://blog.advenoh.pe.kr/mqtt-v5-...</link>
      <pubDate>...</pubDate>
      <description>MQTT v5 완벽 가이드 (1): 개념과 아키텍처 이해하기</description>
      <!-- ❌ <content:encoded> 없음 -->
    </item>
  </channel>
</rss>
```

---

## 2. 목표

RSS reader에서 블로그 글의 **전체 본문(HTML)**이 표시되도록 한다.

### 2.1 목표 RSS 구조

```xml
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Frank's IT Blog</title>
    ...
    <item>
      <title>MQTT v5 완벽 가이드 (1): 개념과 아키텍처 이해하기</title>
      <link>https://blog.advenoh.pe.kr/mqtt-v5-...</link>
      <pubDate>...</pubDate>
      <description>글 요약 (excerpt 또는 본문 앞부분)</description>
      <content:encoded><![CDATA[
        <h2>1. MQTT란?</h2>
        <p>본문 전체 HTML...</p>
        <img src="https://blog.advenoh.pe.kr/images/..." />
        ...
      ]]></content:encoded>
    </item>
  </channel>
</rss>
```

---

## 3. 수정 범위

### 3.1 빌드 타임 RSS 생성 (주요 수정 대상)

빌드 파이프라인: `generate:manifest` → `generate:feeds` → `next build`

빌드 타임에 RSS를 생성하는 `scripts/generators/rss.ts`가 주요 수정 대상이다.

#### 3.1.1 `scripts/generators/rss.ts` 수정

| 항목 | 현재 | 변경 |
|---|---|---|
| 네임스페이스 | `xmlns:atom`만 선언 | `xmlns:content` 추가 |
| 데이터 소스 | manifest (메타데이터만) | manifest + 마크다운 파일 직접 읽기 |
| `<description>` | excerpt (없으면 비어있음) | excerpt 또는 본문 앞 300자 |
| `<content:encoded>` | 없음 | 마크다운 → HTML 변환 후 CDATA로 삽입 |
| 이미지 경로 | 해당 없음 | 상대 경로 → 절대 URL로 변환 |

**핵심 변경사항:**

1. **content 네임스페이스 추가**
   ```xml
   <rss version="2.0"
        xmlns:atom="http://www.w3.org/2005/Atom"
        xmlns:content="http://purl.org/rss/1.0/modules/content/">
   ```

2. **마크다운 파일 직접 읽기**: manifest에는 본문이 없으므로, 각 article의 `contents/{category}/{slug}/index.md` 파일을 직접 읽어 HTML로 변환

3. **마크다운 → HTML 변환**: 기존 `lib/markdown.ts`의 unified 파이프라인을 재사용하거나, RSS용 경량 변환 함수 작성
   - RSS에는 코드 하이라이팅, TOC 링크 등이 불필요할 수 있으므로 경량 버전 고려
   - 단, Mermaid 코드블록은 코드로 표시 (RSS에서 렌더링 불가)

4. **이미지 절대 경로 변환**: 상대 경로 이미지를 `https://blog.advenoh.pe.kr/images/{slug}/filename` 형태로 변환

5. **`<description>` 개선**: excerpt가 없는 경우 본문 HTML에서 텍스트만 추출하여 앞 300자를 사용

#### 3.1.2 마크다운 변환 함수

`scripts/generators/rss.ts` 내부 또는 별도 유틸로 RSS용 마크다운 변환 함수 추가:

```typescript
// RSS용 경량 마크다운 → HTML 변환
async function markdownToHtml(markdown: string, slug: string, baseUrl: string): Promise<string> {
  // unified + remarkParse + remarkGfm + remarkRehype + rehypeStringify
  // 코드 하이라이팅, heading 링크 등은 제외 (RSS에서 불필요)
  // 이미지 상대 경로 → 절대 URL 변환
}
```

### 3.2 런타임 RSS 라우트 (제거 또는 리다이렉트)

**파일:** `app/rss.xml/route.ts`

현재 빌드 타임(`scripts/generators/rss.ts`)과 런타임(`app/rss.xml/route.ts`) 두 곳에서 RSS를 생성하고 있어 중복된다.

| 옵션 | 설명 |
|---|---|
| A. 런타임 라우트 제거 | 빌드 타임 생성된 `public/rss.xml`이 자동으로 서빙됨. 라우트 삭제 |
| B. 런타임 라우트도 동일하게 수정 | 두 곳 모두 유지하되 content:encoded 추가 |

**권장: 옵션 A** — 런타임 라우트를 제거하고 빌드 타임 생성만 사용. 이유:
- 본문 HTML 생성은 비용이 크므로 빌드 타임에 한 번만 처리하는 것이 효율적
- 두 곳에서 RSS를 생성하면 불일치가 발생할 수 있음
- `public/rss.xml`은 Next.js가 정적 파일로 자동 서빙

---

## 4. 데이터 흐름 (변경 후)

```
contents/{category}/{slug}/index.md
  │
  ├──→ generate-content-manifest.ts → content-manifest.json (메타데이터)
  │                                          │
  └──→ generate-feeds.ts ← ─ ─ ─ ─ ─ ─ ─ ─ ┘
         │
         ├──→ rss.ts (수정됨)
         │      1. manifest에서 최신 20개 article 목록 조회
         │      2. 각 article의 index.md 파일 직접 읽기
         │      3. 마크다운 → HTML 변환 (경량 파이프라인)
         │      4. 이미지 상대 경로 → 절대 URL 변환
         │      5. <content:encoded>에 HTML 삽입
         │      6. <description>에 excerpt 또는 본문 앞 300자
         │      └──→ public/rss.xml
         │
         └──→ sitemap.ts (변경 없음)
               └──→ public/sitemap.xml
```

---

## 5. 수정 파일 목록

| 파일 | 작업 |
|---|---|
| `scripts/generators/rss.ts` | content:encoded 추가, 마크다운 파일 읽기 + HTML 변환 로직 추가 |
| `app/rss.xml/route.ts` | 삭제 (빌드 타임 생성으로 통합) |

---

## 6. 검증 방법

1. `npm run build` 실행 후 `public/rss.xml` 확인
   - `xmlns:content` 네임스페이스 존재 확인
   - 각 `<item>`에 `<content:encoded>` 존재 확인
   - 이미지 경로가 절대 URL인지 확인
2. RSS validator (https://validator.w3.org/feed/) 에서 유효성 검증
3. RSS reader (Feedly, Reeder 등)에서 본문 표시 확인
