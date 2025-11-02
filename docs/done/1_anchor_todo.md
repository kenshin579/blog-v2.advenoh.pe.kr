# Anchor 링크 스크롤 오프셋 구현 TODO

## 단계 1: CSS 코드 추가
- [x] `app/globals.css` 파일 열기
- [x] 417번 줄 이후 (Article heading 링크 관련 CSS 섹션) 찾기
- [x] 아래 CSS 코드 추가:
```css
/* Anchor 링크 스크롤 시 sticky 헤더 높이만큼 여유 공간 확보 */
.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  scroll-margin-top: 5rem; /* 80px = 헤더(56px) + 여유(24px) */
}
```
- [x] 파일 저장

## 단계 2: 기능 테스트
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 임의의 article 페이지 접속
- [ ] TOC 링크 클릭 시 제목이 헤더 아래 적절히 표시되는지 확인
- [ ] Article 내부 anchor 링크 클릭 시 동일한 동작 확인

## 단계 3: 브라우저 테스트
- [ ] Chrome/Edge에서 정상 동작 확인
- [ ] Firefox에서 정상 동작 확인
- [ ] Safari에서 정상 동작 확인 (가능한 경우)

## 단계 4: 반응형 테스트
- [ ] 데스크톱 (1920px): TOC 사이드바 링크 동작 확인
- [ ] 모바일 (375px): TOC 상단 표시 링크 동작 확인

## 단계 5: 다크 모드 테스트
- [ ] 라이트 모드에서 정상 동작 확인
- [ ] 다크 모드로 전환 후 정상 동작 확인

## 단계 6: 회귀 테스트
- [ ] 일반 스크롤 동작에 영향 없는지 확인
- [ ] TOC sticky 동작 정상인지 확인
- [ ] 페이지 초기 로드 시 URL에 anchor가 있는 경우 정상 동작 확인

## 단계 7: 빌드 및 배포
- [ ] 프로덕션 빌드 (`npm run build`)
- [ ] 빌드 에러 없는지 확인
- [ ] 배포 (Netlify 자동 배포)
