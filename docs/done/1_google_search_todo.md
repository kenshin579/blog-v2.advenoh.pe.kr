# 구글 검색 결과 사이트 이름 표시 개선 - Todo

## 📋 구현 단계

### 1단계: 메타데이터 수정 ✅

- [x] `app/layout.tsx` - 메타데이터 수정
  - [x] title.default를 "Frank's IT Blog"로 변경
  - [x] og:site_name을 "Frank's IT Blog"로 변경
  - [x] applicationName 추가
  - [x] appleWebApp.title 추가
- [x] JSON-LD WebSite schema 추가 (Script 컴포넌트 사용)

### 2단계: 페이지별 메타데이터 확인 ✅

- [x] `app/page.tsx` (Home) - 이미 "Frank's IT Blog" 사용 중
- [x] `app/[slug]/page.tsx` (Article) - 이미 "Frank's IT Blog" 사용 중
- [x] `app/series/page.tsx` (Series) - 이미 "Frank's IT Blog" 사용 중
- [x] `app/not-found.tsx` - 메타데이터 추가

### 3단계: 빌드 및 검증 ✅

- [x] 타입 체크 (`npm run check`)
- [x] 프로덕션 빌드 (`npm run build`)
- [x] 빌드된 HTML에서 메타데이터 확인
  - [x] JSON-LD script 태그 존재 확인
  - [x] og:site_name 메타 태그 확인
  - [x] application-name 메타 태그 확인
  - [x] apple-mobile-web-app-title 메타 태그 확인

### 4단계: 배포 후 검증 (배포 후 수행)

- [ ] 프로덕션 배포
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) 통과 확인
- [ ] HTML 유효성 검사 ([validator.w3.org](https://validator.w3.org/))
- [ ] Google Search Console에서 구조화된 데이터 확인

### 5단계: 모니터링 (장기)

- [ ] 1-2주 후 실제 구글 검색 결과 확인
- [ ] Search Console에서 WebSite schema 인식 여부 확인
- [ ] 검색 결과에 "Frank's IT Blog" 표시 확인

## ✅ 완료 체크리스트

- [x] layout.tsx 메타데이터 수정 완료
- [x] JSON-LD WebSite schema 추가 완료
- [x] not-found.tsx 메타데이터 추가 완료
- [x] 타입 체크 통과
- [x] 프로덕션 빌드 성공
- [x] 빌드된 HTML에서 메타데이터 확인 완료
- [ ] 프로덕션 배포 완료
- [ ] Google Search Console 등록 및 모니터링 설정

## 📝 구현 요약

**변경 파일**:
1. `app/layout.tsx` - Metadata API 수정 + JSON-LD Schema 추가
2. `app/not-found.tsx` - metadata export 추가

**Next.js 특이사항**:
- Next.js의 Metadata API를 사용하여 SEO 메타데이터 관리
- JSON-LD는 Script 컴포넌트로 추가 (beforeInteractive strategy)
- 별도의 SiteMetadata 컴포넌트 불필요 (Metadata API로 충분)

**참고**:
- 배포 후 검색 결과 반영까지 1-2주 소요 예상
- Rich Results Test로 즉시 검증 가능
