# PRD: 메인 페이지 기본 이미지 표시 이슈 수정

## 문제 정의

### 증상
메인 페이지에서 `firstImage`가 없는 article 카드에 기본 이미지가 표시되지 않고 404 에러 발생

### 영향
- 이미지가 없는 모든 article 카드에서 깨진 이미지 아이콘 표시
- 사용자 경험(UX) 저하
- 전문적이지 않은 블로그 외관

---

## 근본 원인 분석

### 기술적 원인
1. **기본 이미지 파일 위치 불일치**
   - 실제 위치: `attached_assets/generated_images/Default_IT_blog_image_a1b48a45.png`
   - 빌드 후 예상 위치: `public/images/default/Default_IT_blog_image_a1b48a45.png`
   - 코드에서 참조하는 경로: `/images/default/Default_IT_blog_image_a1b48a45.png`

2. **빌드 프로세스 문제**
   - `scripts/copy-images.ts`는 `contents/` 디렉토리만 스캔
   - `contents/default/` 폴더가 존재하지 않음
   - 결과적으로 기본 이미지가 `public/images/`로 복사되지 않음

3. **추가 개선사항**
   - 파일 이름이 복잡함 (`Default_IT_blog_image_a1b48a45.png`)
   - 간단한 이름으로 변경 필요 (`default.png`)

### 관련 파일
- [lib/constants.ts:5](lib/constants.ts#L5) - `DEFAULT_ARTICLE_IMAGE` 상수 정의
- [components/home-content.tsx:126-130](components/home-content.tsx#L126-L130) - 기본 이미지 사용 로직
- [scripts/copy-images.ts:83-88](scripts/copy-images.ts#L83-L88) - 이미지 복사 스크립트

---

## 요구사항

### 기능 요구사항

#### 1. 기본 이미지 파일 이름 단순화
- **우선순위**: P0 (Critical)
- **설명**: 기본 이미지 파일 이름을 `default.png`로 변경
- **상세**:
  - 소스 파일: `attached_assets/generated_images/Default_IT_blog_image_a1b48a45.png` → `default.png`
  - 대상 경로: `public/images/default/default.png`
  - 참조 경로: `/images/default/default.png`

#### 2. 기본 이미지 빌드 프로세스 수정
- **우선순위**: P0 (Critical)
- **설명**: `copy-images.ts` 스크립트가 기본 이미지를 `public/images/default/`로 복사하도록 수정
- **상세**:
  - `attached_assets/generated_images/default.png`를 소스로 지정
  - `public/images/default/` 디렉토리 생성 (없을 경우)
  - 빌드 프로세스에서 자동으로 복사

#### 3. 상수 경로 업데이트
- **우선순위**: P0 (Critical)
- **설명**: `lib/constants.ts`의 `DEFAULT_ARTICLE_IMAGE` 경로 변경
- **변경 전**: `/images/default/Default_IT_blog_image_a1b48a45.png`
- **변경 후**: `/images/default/default.png`

### 비기능 요구사항

#### 성능
- 빌드 시간에 무시할 수 있는 영향 (1개 파일 복사)

#### 유지보수성
- 기본 이미지 교체 시 단일 소스 관리
- 직관적인 파일 이름 (`default.png`)

---

## 제약사항

### 기술적 제약
- Next.js 정적 빌드 환경 (`npm run build` → `next build`)
- 기존 `.gitignore`에 `public/images/` 포함됨 (빌드 산출물)
- `attached_assets/` 디렉토리는 Git tracking 됨

### 호환성
- 기존 article들의 `firstImage` 로직 유지
- 기본 이미지 경로 변경 시 `lib/constants.ts` 동기화 필수

---

## 성공 기준

### 기능 검증
- [ ] `attached_assets/generated_images/default.png` 파일 존재
- [ ] `npm run build` 실행 시 기본 이미지가 `public/images/default/default.png`로 복사됨
- [ ] 브라우저에서 `/images/default/default.png` 접근 시 200 응답
- [ ] `firstImage` 없는 article 카드에 기본 이미지 표시됨
- [ ] 기존 `firstImage` 있는 article 카드는 정상 동작 (회귀 방지)

### 품질 기준
- [ ] 빌드 로그에 기본 이미지 복사 관련 메시지 출력
- [ ] 개발 환경(`npm run dev`)에서도 정상 동작
- [ ] 프로덕션 빌드(`npm run build` + `npm start`)에서 정상 동작

---

## 구현 문서

상세한 구현 방법 및 작업 체크리스트는 별도 문서를 참조하세요:

- **구현 가이드**: [3_main_default_implementation.md](3_main_default_implementation.md)
  - 단계별 구현 방법
  - 코드 예시
  - 빌드 검증 방법
  - 트러블슈팅 가이드

- **작업 체크리스트**: [3_main_default_todo.md](3_main_default_todo.md)
  - Phase별 작업 목록
  - 체크리스트 형식
  - 예상 소요 시간
  - Git 커밋 가이드

---

## 버전 정보
- **작성일**: 2025-11-01
- **업데이트**: 2025-11-01 (파일 이름 단순화 요구사항 추가)
- **프로젝트**: Frank's IT Blog (blog-v2.advenoh.pe.kr)
- **관련 이슈**: 메인 페이지 기본 이미지 404 에러
- **우선순위**: P0 (Critical)
