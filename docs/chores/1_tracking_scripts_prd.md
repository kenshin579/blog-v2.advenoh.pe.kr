# 사이트 추적 스크립트 추가 작업

## 개요
Google AdSense, Google Analytics, Naver Search Console을 모든 페이지의 head에 추가하는 작업

## 현재 프로젝트 구조
- **Framework**: Next.js (App Router)
- **Root Layout**: `app/layout.tsx`
- **라우팅 구조**:
  - `/` - Home (app/page.tsx)
  - `/series` - Series (app/series/page.tsx)
  - `/[slug]` - Article (app/[slug]/page.tsx)
  - 404 - Not found (app/not-found.tsx)

## 작업 분석

### 1. 추가할 서비스
1. **Google AdSense** - 광고 수익화
2. **Google Analytics** (ID: G-B0KLVK60W1) - 방문자 추적 및 분석
3. **Naver Search Console** - 네이버 검색엔진 등록 및 최적화

### 2. 구현 방법

#### Next.js에서 외부 스크립트 추가 방법
- **next/script의 Script 컴포넌트** 사용 (권장)
  - `strategy` 옵션으로 로딩 최적화 가능
  - `afterInteractive`: 페이지가 인터랙티브 된 후 로드
  - `lazyOnload`: 브라우저 idle 시 로드
- **metadata API** 사용 (meta 태그)
  - Naver Search Console verification meta 태그

#### 작업 위치
- **app/layout.tsx** - Root Layout (모든 페이지 공통)
  - Script 컴포넌트로 Google AdSense, Analytics 추가
  - metadata 객체에 Naver verification meta 추가

### 3. 구현 세부사항

#### 3.1 Google AdSense
```tsx
import Script from 'next/script';

// RootLayout에 추가
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8868959494983515"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

#### 3.2 Google Analytics (ID: G-B0KLVK60W1)
```tsx
// gtag.js 스크립트
<Script
  strategy="afterInteractive"
  src="https://www.googletagmanager.com/gtag/js?id=G-B0KLVK60W1"
/>

// gtag 설정 스크립트
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
```

#### 3.3 Naver Search Console
```tsx
// metadata 객체에 추가
export const metadata: Metadata = {
  // ... 기존 설정
  verification: {
    naver: '5e2f8b4431e6d7b2202d923832f2a90250e5a594',
  },
};
```

또는 직접 meta 태그 추가:
```tsx
export const metadata: Metadata = {
  // ... 기존 설정
  other: {
    'naver-site-verification': '5e2f8b4431e6d7b2202d923832f2a90250e5a594',
  },
};
```

### 4. 작업 단계

#### 4.1 준비 작업
- [x] Google Analytics ID 확인 (G-B0KLVK60W1)
- [ ] 현재 app/layout.tsx 백업
- [ ] Next.js Script 컴포넌트 문서 확인

#### 4.2 구현 작업
- [ ] app/layout.tsx 파일 수정
  - [ ] next/script import 추가
  - [ ] Google AdSense Script 추가
  - [ ] Google Analytics Script 추가 (gtag.js + config)
  - [ ] metadata에 Naver verification 추가
- [ ] 코드 포맷팅 및 정리

#### 4.3 테스트 작업
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 브라우저 개발자 도구로 확인
  - [ ] head 태그 내 스크립트 로드 확인
  - [ ] Naver meta 태그 렌더링 확인
  - [ ] 콘솔 에러 확인
- [ ] 네트워크 탭에서 스크립트 로드 확인
  - [ ] AdSense 스크립트 200 응답
  - [ ] Analytics 스크립트 200 응답
- [ ] 모든 페이지에서 스크립트 로드 확인
  - [ ] Home (/)
  - [ ] Series (/series)
  - [ ] Article (/[slug])
  - [ ] 404 (Not Found)

#### 4.4 프로덕션 검증
- [ ] 빌드 실행 (`npm run build`)
- [ ] 빌드 성공 확인
- [ ] 프로덕션 서버 실행 (`npm start`)
- [ ] 프로덕션 환경에서 스크립트 동작 확인

#### 4.5 외부 서비스 검증
- [ ] Google AdSense 관리자 페이지에서 사이트 승인 대기 확인
- [ ] Google Analytics 실시간 보고서에서 방문자 추적 확인
- [ ] Naver Search Console에서 사이트 소유권 확인

### 5. 주의사항

#### 5.1 성능 최적화
- Script 컴포넌트의 `strategy` 옵션 사용
  - `afterInteractive`: 페이지 로드 성능에 영향 최소화
  - `lazyOnload`: 덜 중요한 스크립트는 지연 로드

#### 5.2 보안
- Google Analytics ID가 공개 저장소에 노출되어도 문제없음 (공개 정보)
- Naver verification은 소유권 확인용이므로 공개 가능

#### 5.3 Next.js 버전 호환성
- Script 컴포넌트는 Next.js 11+ 지원
- App Router는 Next.js 13+ 필요
- 현재 프로젝트 Next.js 버전 확인 필요

### 6. 예상 파일 변경

```
app/layout.tsx (수정)
- next/script import 추가
- metadata에 Naver verification 추가
- RootLayout 컴포넌트에 Script 태그들 추가
```

### 7. 예상 소요 시간
- 구현: 15분
- 테스트: 10분
- 프로덕션 검증: 5분
- 외부 서비스 검증: 10분 (각 서비스 관리자 페이지 접속)
- **총 예상 시간**: 40분

### 8. 롤백 계획
- 작업 전 app/layout.tsx 백업
- Git commit 전 충분한 테스트
- 문제 발생 시 이전 버전으로 복원

### 9. 참고 문서
- [Next.js Script 컴포넌트](https://nextjs.org/docs/app/api-reference/components/script)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google Analytics 설치 가이드](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [Google AdSense 코드 배치 가이드](https://support.google.com/adsense/answer/9190028)
- [Naver Search Console](https://searchadvisor.naver.com/)
