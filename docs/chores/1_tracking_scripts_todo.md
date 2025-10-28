# 추적 스크립트 작업 체크리스트

## Phase 1: 구현
- [x] `app/layout.tsx` 파일 열기
- [x] `import Script from 'next/script';` 추가
- [x] metadata 객체에 Naver verification 추가 (`other` 속성 사용)
- [x] `<html>` 태그 내 Google AdSense Script 추가
- [x] `<html>` 태그 내 Google Analytics Script 2개 추가
- [x] 코드 포맷팅 확인

## Phase 2: 로컬 테스트
- [x] 개발 서버 실행: `npm run dev`
- [x] 브라우저 개발자 도구 열기 (F12)
- [x] Elements 탭에서 `<head>` 태그 확인
  - [x] `<meta name="naver-site-verification">` 태그 존재
  - [x] AdSense 스크립트 로드됨
  - [x] Analytics 스크립트 2개 로드됨
- [x] Console 탭에서 에러 없는지 확인
- [x] Network 탭에서 스크립트 로드 확인
  - [x] `adsbygoogle.js` 200 응답
  - [x] `gtag/js` 200 응답
- [x] 여러 페이지 이동하며 스크립트 유지 확인
  - [x] Home (/)
  - [x] Series (/series)
  - [x] Article 페이지 (/[slug])

## Phase 3: 빌드 검증
- [x] 빌드 실행: `npm run build`
- [x] 빌드 성공 확인 (에러 없음)
- [x] 148개 페이지 정상 생성

## Phase 4: 완료
- [x] todo 파일 업데이트
- [x] 변경사항 커밋

## 검증 결과

### 로컬 테스트 (Phase 2)
```json
{
  "naver": "5e2f8b4431e6d7b2202d923832f2a90250e5a594",
  "gtag": true,
  "dataLayer": true,
  "adsense": 1,
  "allScriptsValid": true
}
```

### 빌드 결과 (Phase 3)
- Total pages: 148 (141 articles + 7 static pages)
- Build status: ✅ Success
- TypeScript: ✅ Passed
