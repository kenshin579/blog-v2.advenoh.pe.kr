# 시리즈 네비게이션 구현 체크리스트

## Phase 1: 컴포넌트 생성

- [ ] `components/article/series-navigation.tsx` 파일 생성
- [ ] SeriesNavigationProps 인터페이스 정의
- [ ] SeriesNavigation 컴포넌트 구현
  - [ ] Card 컴포넌트로 컨테이너 구성
  - [ ] 시리즈 이름 헤더 표시 (📚 아이콘 포함)
  - [ ] 아티클 목록 ol 태그로 구현
  - [ ] 인덱스 기반 번호 표시 (index + 1)
  - [ ] 현재 아티클: 굵은 글씨 + ← 화살표
  - [ ] 다른 아티클: Link 컴포넌트로 구현
- [ ] 접근성: aria-current="page" 추가

## Phase 2: Article Page 수정

- [ ] `app/[slug]/page.tsx` 파일 열기
- [ ] import 추가
  - [ ] SeriesNavigation 컴포넌트 import
  - [ ] getArticlesBySeries 함수 import
  - [ ] ManifestArticle 타입 import (필요시)
- [ ] 시리즈 데이터 로드 로직 추가 (line 84 이후)
  - [ ] seriesArticles 변수 선언
  - [ ] manifestArticle.series 확인
  - [ ] getArticlesBySeries() 호출
  - [ ] 날짜순 정렬 (오래된 글부터: a.date - b.date)
- [ ] 컴포넌트 삽입 (line 117-119 사이)
  - [ ] 조건부 렌더링 구현 (series 있고 articles.length > 1)
  - [ ] SeriesNavigation 컴포넌트 배치
  - [ ] props 전달 (seriesName, articles, currentSlug)

## Phase 3: 테스트

### 3.1 개발 서버 실행
- [ ] 개발 서버 실행 (`npm run dev`)

### 3.2 MCP Playwright 자동화 테스트
- [ ] Playwright로 브라우저 열기
  - [ ] `http://localhost:3000` 접속
- [ ] 시리즈가 있는 아티클 테스트
  - [ ] 시리즈 아티클 페이지로 이동 (예: Spring JPA 시리즈)
  - [ ] 시리즈 네비게이션 Card 요소 확인
  - [ ] 시리즈 제목에 "📚 시리즈:" 텍스트 포함 확인
  - [ ] 아티클 목록 ol 태그 존재 확인
  - [ ] 아티클이 날짜순으로 정렬되어 있는지 확인
  - [ ] 현재 아티클에 "←" 화살표 표시 확인
  - [ ] 현재 아티클이 굵은 글씨(font-bold)로 표시되는지 확인
  - [ ] 다른 아티클 링크 클릭 → 페이지 이동 확인
- [ ] 시리즈가 없는 아티클 테스트
  - [ ] 시리즈 없는 아티클 페이지로 이동
  - [ ] 시리즈 네비게이션이 렌더링되지 않는지 확인
- [ ] 스크린샷 캡처
  - [ ] 라이트모드 스크린샷
  - [ ] 다크모드 스크린샷 (테마 전환 후)
  - [ ] 모바일 뷰포트 스크린샷 (375x667)

### 3.3 수동 확인 (선택사항)
- [ ] 스타일 육안 확인
  - [ ] 라이트모드/다크모드 전환
  - [ ] 반응형 레이아웃 확인
- [ ] 접근성 확인
  - [ ] 키보드 Tab 키로 네비게이션 확인
  - [ ] aria-current="page" 속성 확인

## Phase 4: 마무리

- [ ] 타입 에러 확인 (`npm run check`)
- [ ] 코드 정리 및 주석 추가
- [ ] Git commit
