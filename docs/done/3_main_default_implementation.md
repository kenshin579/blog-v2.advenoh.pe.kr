# 메인 페이지 기본 이미지 표시 - 구현 가이드

## 개요
기본 이미지가 빌드 프로세스에서 `public/images/default/`로 복사되지 않는 문제를 해결하고, 파일 이름을 `default.png`로 단순화합니다.

---

## 구현 단계

### 1단계: 파일 이름 변경

**작업 내용**: 기본 이미지 파일 이름을 `default.png`로 변경

```bash
cd attached_assets/generated_images/
mv Default_IT_blog_image_a1b48a45.png default.png
```

**검증**:
```bash
ls -la attached_assets/generated_images/default.png
# 파일이 존재하고 크기가 0보다 커야 함
```

---

### 2단계: constants.ts 경로 수정

**파일**: `lib/constants.ts`

**변경 전**:
```typescript
export const DEFAULT_ARTICLE_IMAGE = '/images/default/Default_IT_blog_image_a1b48a45.png';
```

**변경 후**:
```typescript
export const DEFAULT_ARTICLE_IMAGE = '/images/default/default.png';
```

---

### 3단계: copy-images.ts 스크립트 수정

**파일**: `scripts/copy-images.ts`

**수정 위치**: `main()` 함수 끝에 기본 이미지 복사 로직 추가

**추가할 코드**:
```typescript
function main() {
  // 기존 contents/ 이미지 복사 로직
  const contentsDir = path.join(process.cwd(), 'contents');
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');

  console.log('🔍 Scanning for images in contents/...');
  const images = new Map<string, string>();
  findImages(contentsDir, contentsDir, images);

  console.log(`✅ Found ${images.size} images`);

  if (images.size > 0) {
    console.log('📋 Copying images to public/images/...');
    const { copiedCount, skippedCount } = copyImages(images, publicImagesDir);
    console.log(`✅ Copy complete!
  - Copied: ${copiedCount} files
  - Skipped: ${skippedCount} files (unchanged)
  - Total: ${images.size} files
  `);
  }

  // ========================================
  // 🆕 기본 이미지 복사 로직 (아래 코드 추가)
  // ========================================
  console.log('\n🔍 Copying default image...');
  
  const defaultImageSource = path.join(
    process.cwd(), 
    'attached_assets', 
    'generated_images', 
    'default.png'
  );
  const defaultImageDestDir = path.join(publicImagesDir, 'default');
  const defaultImageDest = path.join(defaultImageDestDir, 'default.png');

  // 소스 파일 존재 확인
  if (!fs.existsSync(defaultImageSource)) {
    console.error(`❌ Default image not found: ${defaultImageSource}`);
    return;
  }

  // 대상 디렉토리 생성 (없을 경우)
  if (!fs.existsSync(defaultImageDestDir)) {
    fs.mkdirSync(defaultImageDestDir, { recursive: true });
  }

  // 이미지 복사
  try {
    fs.copyFileSync(defaultImageSource, defaultImageDest);
    console.log(`✅ Default image copied to ${defaultImageDest}`);
  } catch (error) {
    console.error(`❌ Failed to copy default image:`, error);
  }
}
```

**핵심 로직 설명**:
1. `attached_assets/generated_images/default.png` 소스 경로 설정
2. `public/images/default/` 디렉토리 생성 (없으면)
3. `fs.copyFileSync()`로 파일 복사
4. 성공/실패 로그 출력

---

## 빌드 검증

### 로컬 빌드 테스트

```bash
# 1. 빌드 실행
npm run build

# 2. 빌드 로그 확인
# "✅ Default image copied to ..." 메시지가 보여야 함

# 3. 복사된 파일 확인
ls -la public/images/default/
# default.png 파일이 존재해야 함

# 4. 파일 타입 확인
file public/images/default/default.png
# PNG image data로 표시되어야 함
```

### 개발 서버 테스트

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저에서 http://localhost:3000 접속

# 3. 개발자 도구 Network 탭 열기

# 4. 이미지가 없는 article 카드 찾기

# 5. Network 탭에서 /images/default/default.png 요청 확인
# Status: 200 OK
```

### 프로덕션 빌드 테스트

```bash
# 1. 프로덕션 빌드
npm run build

# 2. 프로덕션 서버 시작
npm start

# 3. 브라우저에서 http://localhost:3000 접속

# 4. 기본 이미지가 올바르게 표시되는지 확인
```

---

## 트러블슈팅

### 문제 1: "Default image not found" 에러

**원인**: `attached_assets/generated_images/default.png` 파일이 없음

**해결**:
```bash
# 파일 존재 확인
ls -la attached_assets/generated_images/default.png

# 파일이 없으면 1단계(파일 이름 변경)를 다시 수행
```

### 문제 2: 빌드는 성공했지만 이미지가 표시되지 않음

**원인**: 브라우저 캐시 또는 경로 문제

**해결**:
```bash
# 1. 빌드 결과물 확인
ls -la public/images/default/default.png

# 2. constants.ts 경로 확인
grep DEFAULT_ARTICLE_IMAGE lib/constants.ts
# 출력: export const DEFAULT_ARTICLE_IMAGE = '/images/default/default.png';

# 3. 브라우저 캐시 삭제 (개발자 도구 > Network > Disable cache)

# 4. 페이지 새로고침 (Cmd+Shift+R)
```

### 문제 3: 일부 article에만 기본 이미지가 표시됨

**원인**: `firstImage` 로직 문제 또는 데이터 불일치

**확인**:
```bash
# 1. content-manifest.json 확인
cat public/content-manifest.json | grep -A 5 "firstImage"

# 2. 특정 article의 firstImage 값 확인
# firstImage: null 또는 undefined인 경우만 기본 이미지 표시됨
```

---

## 영향받는 파일 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `attached_assets/generated_images/Default_IT_blog_image_a1b48a45.png` | 이름 변경 | → `default.png` |
| `lib/constants.ts` | 수정 | 경로를 `/images/default/default.png`로 변경 |
| `scripts/copy-images.ts` | 수정 | 기본 이미지 복사 로직 추가 |
| `public/images/default/default.png` | 생성 (빌드 시) | 빌드 프로세스에서 자동 생성 |

---

## 참고 사항

### 빌드 프로세스 순서

```bash
# package.json의 build 스크립트 실행 순서
1. npm run generate:manifest     # content-manifest.json 생성
2. npm run generate:search        # search-index.json 생성
3. npm run generate:feeds         # RSS/Sitemap 생성
4. npm run copy:images            # ⭐ 이미지 복사 (수정됨)
5. next build                     # Next.js 빌드
```

### Git 관련

- `attached_assets/generated_images/default.png`: Git tracking ✅
- `public/images/`: `.gitignore`에 포함 (빌드 산출물) ❌
- 따라서 소스 파일만 Git에 커밋되고, `public/images/`는 빌드 시마다 생성됨

---

## 버전 정보
- **작성일**: 2025-11-01
- **프로젝트**: Frank's IT Blog (blog-v2.advenoh.pe.kr)
- **관련 PRD**: [3_main_default_prd.md](3_main_default_prd.md)
