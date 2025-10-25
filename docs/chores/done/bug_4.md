# Bug #4: 개별 Article 페이지에서 이미지 로딩 안됨

## 문제 현상
- 개별 article 페이지에서 마크다운에 포함된 이미지가 로딩되지 않음
- 브라우저에서 404 에러 발생

## 원인 분석

### 1. 이미지 파일 구조
**실제 이미지 위치:**
```
public/images/database/맥에서 kubernetes kind로 쉽고 빠르게 클러스터 구성하기/
  └── image-20250405151622870.png
```

**마크다운 원본 (contents/database/맥에서.../index.md):**
```markdown
![Kind Architecture](image-20250405151622870.png)
```

### 2. 경로 변환 누락
**현재 동작:**
1. `lib/markdown.ts`의 `parseMarkdown()` 함수가 마크다운을 HTML로 변환
2. 이미지 경로가 그대로 유지됨: `<img src="image-20250405151622870.png" />`
3. 브라우저는 상대 경로로 해석: `/[article-slug]/image-20250405151622870.png` (404)

**필요한 동작:**
```html
<!-- 현재 (잘못됨) -->
<img src="image-20250405151622870.png" />

<!-- 올바른 경로 -->
<img src="/images/database/맥에서 kubernetes kind로 쉽고 빠르게 클러스터 구성하기/image-20250405151622870.png" />
```

### 3. 관련 코드
**lib/markdown.ts:37-66 - parseMarkdown() 함수**
- 이미지 경로 변환 로직 없음
- HTML 생성 후 상대 경로가 그대로 유지됨

**lib/articles.ts:79-101 - getArticle() 함수**
- parseMarkdown에 slug 전달하지만, 이미지 경로 변환에 사용 안 함

## 해결 방안

### 채택한 방법: 정규식으로 HTML 후처리 (Option 3)

**구현:**
```typescript
// lib/markdown.ts
let html = String(result);

// 상대 경로 이미지만 /images/{slug}/{filename} 형식으로 변환
// HTTP/HTTPS URL이나 절대 경로는 그대로 유지
html = html.replace(
  /<img([^>]*)\ssrc="(?!http|\/)(.*?)"/g,
  `<img$1 src="/images/${slug}/$2"`
);
```

**장점:**
- 추가 패키지 불필요
- 빠른 구현
- 간단하고 명확한 로직

**단점:**
- Remark/Rehype 플러그인보다 덜 우아함
- Edge case 처리가 제한적 (현재 요구사항에는 충분)

## 테스트 결과

### Playwright 테스트
**테스트 Article**: "맥에서 Kubernetes? Kind로 쉽고 빠르게 클러스터 구성하기"

```json
{
  "currentUrl": "http://localhost:3000/맥에서 kubernetes kind로...",
  "totalImages": 1,
  "loadedImages": 1,
  "failedImages": 0,
  "images": [{
    "src": "http://localhost:3000/images/database/맥에서.../image-20250405151622870.png",
    "alt": "Kind Architecture",
    "loaded": true,
    "naturalWidth": 2048,
    "naturalHeight": 1152
  }]
}
```

✅ **결과**: 100% 이미지 로딩 성공

## 우선순위
**High** - 사용자 경험에 직접적인 영향

## 관련 파일
- lib/markdown.ts - 마크다운 파싱 및 이미지 경로 변환
- lib/articles.ts - article 로드
- app/[slug]/page.tsx - article 페이지
