# Bug #5: 메인 페이지 article 카드에 기본 이미지 표시

## 요구사항

메인 페이지에서 article에 이미지가 없는 경우, 카드에 기본 이미지(Default_IT_blog_image_a1b48a45.png)를 표시해야 함.

### 현재 상태
- article에 `firstImage`가 있으면 해당 이미지를 표시
- `firstImage`가 없으면 이미지 섹션이 전혀 렌더링되지 않음
- 카드 레이아웃이 이미지 유무에 따라 불일치

### 기대 동작
- 모든 article 카드가 일관된 레이아웃을 가짐
- `firstImage`가 없는 경우 기본 이미지를 표시
- 기본 이미지: `Default_IT_blog_image_a1b48a45.png`

## 코드 분석

### 관련 파일
1. **app/page.tsx** (32-40번 줄)
   - 현재: `{article.firstImage && (...)}`로 조건부 렌더링
   - 문제: 이미지가 없으면 이미지 섹션 자체가 렌더링 안 됨

2. **lib/articles.ts**
   - `ManifestArticle` 인터페이스에 `firstImage?: string` 정의
   - manifest.json에서 firstImage 메타데이터 로드

3. **기본 이미지 위치**
   - 원본: `attached_assets/generated_images/Default_IT_blog_image_a1b48a45.png`
   - 복사 필요: `public/images/default/` 또는 `public/assets/`

### 현재 이미지 경로 구조
```
/images/{slug}/{firstImage}
예: /images/database/맥에서-kubernetes/image-20250405151622870.png
```

## 구현

### 1. 기본 이미지 준비
- `attached_assets/generated_images/Default_IT_blog_image_a1b48a45.png` 파일을 `public/images/default/` 디렉토리로 복사
- 또는 `public/default-blog-image.png`로 간단하게 배치

### 2. app/page.tsx 수정

**Before (32-40번 줄):**
```tsx
{article.firstImage && (
  <div className="aspect-video overflow-hidden rounded-t-lg">
    <img
      src={`/images/${article.slug}/${article.firstImage}`}
      alt={article.title}
      className="w-full h-full object-cover transition-transform group-hover:scale-105"
    />
  </div>
)}
```

**After:**
```tsx
<div className="aspect-video overflow-hidden rounded-t-lg">
  <img
    src={
      article.firstImage
        ? `/images/${article.slug}/${article.firstImage}`
        : '/images/default/Default_IT_blog_image_a1b48a45.png'
    }
    alt={article.title}
    className="w-full h-full object-cover transition-transform group-hover:scale-105"
  />
</div>
```

### 3. 대안: 상수로 관리

더 나은 유지보수를 위해 상수로 관리:

**lib/constants.ts (신규 파일):**
```typescript
export const DEFAULT_ARTICLE_IMAGE = '/images/default/Default_IT_blog_image_a1b48a45.png';
```

**app/page.tsx:**
```tsx
import { DEFAULT_ARTICLE_IMAGE } from '@/lib/constants';

// ...

<img
  src={article.firstImage ? `/images/${article.slug}/${article.firstImage}` : DEFAULT_ARTICLE_IMAGE}
  alt={article.title}
  className="w-full h-full object-cover transition-transform group-hover:scale-105"
/>
```

## TODO

- [ ] `public/images/default/` 디렉토리 생성
- [ ] `Default_IT_blog_image_a1b48a45.png` 파일을 public 디렉토리로 복사
- [ ] `lib/constants.ts` 파일 생성 및 `DEFAULT_ARTICLE_IMAGE` 상수 정의
- [ ] `app/page.tsx` 수정: 조건부 렌더링 제거, 삼항 연산자로 기본 이미지 사용
- [ ] 빌드 및 테스트: 이미지가 없는 article에서 기본 이미지 표시 확인
- [ ] (선택) 시리즈 페이지(`app/series/page.tsx`)에도 동일 로직 적용 필요 여부 확인

## 추가 고려사항

### 다른 페이지 확인
- `app/series/page.tsx`: 시리즈 페이지에도 article 카드가 있는지 확인
- 일관성을 위해 모든 article 카드 표시 위치에 동일한 로직 적용

### 성능
- 기본 이미지는 작은 용량으로 최적화
- Next.js Image 컴포넌트 사용 고려 (자동 최적화, lazy loading)

### 접근성
- alt 텍스트 개선: 기본 이미지일 경우 "IT 블로그 기본 이미지" 등으로 구분 가능
