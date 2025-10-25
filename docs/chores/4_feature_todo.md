# Todo: 홈페이지 서브타이틀을 Feature Section으로 통합

## 사전 준비

- [ ] 현재 브랜치 확인 (`git status`)
- [ ] 새 feature 브랜치 생성 (`git checkout -b feat/integrate-subtitle-to-feature`)
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 현재 UI 스크린샷 저장 (비교용)

## 1단계: 코드 분석 및 백업

- [ ] `client/src/components/home-content.tsx` 파일 읽기
- [ ] Hero Section 코드 위치 확인
- [ ] Feature Section 코드 위치 확인
- [ ] 기존 스타일링 클래스 파악
- [ ] Git 커밋으로 현재 상태 저장 (롤백 포인트)

## 2단계: Hero Section 제거

- [ ] Hero Section 전체 코드 삭제
  - `<section className="py-12 md:py-16 ...">` 블록 제거
  - 블로그 제목 `<h1>` 제거
  - 서브타이틀 `<p>` 제거 (Feature Section으로 이동 예정)
- [ ] 브라우저에서 변경사항 확인
- [ ] Hero Section이 완전히 제거되었는지 검증

## 3단계: Feature Section 수정

### 3.1 서브타이틀 추가
- [ ] Feature Section 최상단에 서브타이틀 추가
  ```tsx
  <p className="text-center text-lg md:text-lg text-muted-foreground mb-6">
    개발, 클라우드, 데이터베이스 관련 기술 블로그
  </p>
  ```
- [ ] 브라우저에서 서브타이틀 렌더링 확인

### 3.2 레이아웃 간격 조정
- [ ] Feature Section 패딩 조정 (`py-8 md:py-10`)
- [ ] 서브타이틀과 검색창 간격 확인 (`mb-6`)
- [ ] 검색창과 카테고리 필터 간격 확인 (기존 유지)

### 3.3 반응형 확인
- [ ] 모바일 (375px): 서브타이틀 크기 확인
- [ ] 태블릿 (768px): 레이아웃 확인
- [ ] 데스크톱 (1280px): 전체 레이아웃 확인

## 4단계: 스타일링 및 세부 조정

- [ ] 서브타이틀 색상 확인 (라이트 모드)
- [ ] 서브타이틀 색상 확인 (다크 모드)
- [ ] 텍스트 정렬 확인 (중앙)
- [ ] 폰트 크기 확인 (모바일 vs 데스크톱)
- [ ] 전체 수직 간격 조정 (필요 시)

## 5단계: 애니메이션 테스트 (선택사항)

- [ ] 페이지 새로고침 시 애니메이션 확인
- [ ] 서브타이틀 fade-in 효과 확인
- [ ] 검색창 애니메이션 확인
- [ ] 카테고리 필터 애니메이션 확인
- [ ] 순차적 등장 효과 추가 (필요 시)

## 6단계: 기능 테스트

### 6.1 검색 기능
- [ ] 검색창 클릭 → 모달 열림 확인
- [ ] ⌘K 단축키 동작 확인
- [ ] 검색 결과 정상 동작 확인

### 6.2 카테고리 필터
- [ ] "전체" 필터 클릭 동작 확인
- [ ] 개별 카테고리 필터 클릭 확인
- [ ] 필터 적용 시 포스트 목록 변경 확인
- [ ] URL 쿼리 파라미터 동작 확인

### 6.3 다크 모드
- [ ] 다크 모드 전환 확인
- [ ] 서브타이틀 색상 대비 확인
- [ ] 검색창 스타일 확인
- [ ] 카테고리 필터 스타일 확인

## 7단계: 접근성 테스트

- [ ] Tab 키로 키보드 네비게이션 확인
- [ ] ⌘K 키보드 단축키 동작 확인
- [ ] 스크린 리더 테스트 (VoiceOver/NVDA)
- [ ] 색상 대비 검사 (axe DevTools 또는 Lighthouse)

## 8단계: 크로스 브라우저 테스트

- [ ] Chrome: 정상 동작 확인
- [ ] Safari: 정상 동작 확인
- [ ] Firefox: 정상 동작 확인
- [ ] Edge: 정상 동작 확인 (선택사항)

## 9단계: 반응형 테스트 (상세)

### 모바일
- [ ] iPhone SE (375px): 레이아웃 확인
- [ ] iPhone 12 Pro (390px): 레이아웃 확인
- [ ] iPhone 12 Pro Max (428px): 레이아웃 확인

### 태블릿
- [ ] iPad Mini (768px): 레이아웃 확인
- [ ] iPad Pro (1024px): 레이아웃 확인

### 데스크톱
- [ ] 1280px: 레이아웃 확인
- [ ] 1920px: 레이아웃 확인
- [ ] 2560px: 레이아웃 확인 (선택사항)

## 10단계: 코드 품질 확인

- [ ] TypeScript 타입 체크 (`npm run check`)
- [ ] ESLint 경고 확인 및 수정
- [ ] 불필요한 import 제거
- [ ] 코드 포맷팅 (`Prettier` 또는 IDE 포맷터)
- [ ] 주석 추가 (필요 시)

## 11단계: Git 커밋

- [ ] 변경사항 확인 (`git diff`)
- [ ] 변경 파일 스테이징 (`git add client/src/components/home-content.tsx`)
- [ ] 커밋 메시지 작성
  ```
  feat: Feature Section에 서브타이틀 통합 및 Hero Section 제거
  
  * Hero Section 완전 제거하여 수직 공간 효율성 향상
  * Feature Section 상단에 서브타이틀 추가
  * 레이아웃 간격 조정 (서브타이틀-검색창: 24px)
  * 반응형 디자인 적용 (모바일/데스크톱)
  * 다크 모드 지원 확인
  ```
- [ ] 커밋 실행 (`git commit`)

## 12단계: 최종 검증

- [ ] 개발 서버 재시작 후 동작 확인
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 빌드된 파일로 실행 확인 (`npm start`)
- [ ] 콘솔 에러 확인 (브라우저 DevTools)
- [ ] 네트워크 요청 확인 (불필요한 요청 없는지)

## 13단계: Pull Request 준비

- [ ] PR 제목 작성: "feat: Feature Section에 서브타이틀 통합 및 Hero Section 제거"
- [ ] PR 설명 작성
  - Before/After 스크린샷 첨부
  - 변경사항 요약
  - 테스트 결과 요약
- [ ] 리뷰어 지정 (필요 시)
- [ ] 라벨 추가: `enhancement`, `ui`

## 14단계: 문서 업데이트 (선택사항)

- [ ] `CLAUDE.md` 업데이트 (구조 변경 반영)
- [ ] `design_guidelines.md` 업데이트 (필요 시)
- [ ] README 업데이트 (필요 시)

## 완료 체크리스트

- [ ] 모든 기능 정상 동작 확인
- [ ] 시각적 회귀 없음 확인
- [ ] 접근성 표준 준수 확인
- [ ] 성능 저하 없음 확인
- [ ] Git 커밋 완료
- [ ] PR 생성 완료 (또는 main 브랜치 병합)

## 롤백 절차 (문제 발생 시)

1. [ ] `git log` 로 이전 커밋 해시 확인
2. [ ] `git revert <commit-hash>` 실행
3. [ ] 또는 `git reset --hard <commit-hash>` (로컬만)
4. [ ] 원인 분석 후 재시도

## 참고 문서

- PRD: `docs/chores/4_prd.md`
- 구현 계획: `docs/chores/4_implementation.md`
- 디자인 가이드: `design_guidelines.md`
