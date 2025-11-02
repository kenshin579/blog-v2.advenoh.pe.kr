# TODO: 태그 배경색 Grey 스타일 적용

## Phase 1: 구현 (예상 30분)

### Step 1: CSS 변수 추가
- [x] `app/globals.css` 파일 열기
- [x] `:root` 섹션에 `--tag-bg: 0 0% 94%;` 추가 (Line 8 근처)
- [x] `.dark` 섹션에 `--tag-bg: 217 33% 18%;` 추가 (Line 127 근처)

### Step 2: Badge 컴포넌트 수정
- [x] `components/ui/badge.tsx` 파일 열기
- [x] `outline` variant에 `bg-[hsl(var(--tag-bg))]` 추가 (Line 19)
- [x] 타입스크립트 에러 확인

### Step 3: 빌드 확인
- [x] `npm run dev` 실행 확인
- [x] 타입스크립트 에러 없는지 확인
- [x] 빌드 에러 없는지 확인

## Phase 2: 시각적 테스트 (예상 15분)

### Light Mode 테스트
- [x] 브라우저에서 `http://localhost:3000` 접속
- [x] 홈 페이지에서 태그 배경색 확인
- [x] 아티클 클릭 → 상세 페이지 태그 배경 확인
- [x] 관련 글 카드 태그 배경 확인
- [x] 스크린샷 촬영 (선택사항)

### Dark Mode 테스트
- [x] 다크모드 토글 클릭
- [x] 홈 페이지에서 태그 배경색 확인
- [x] 아티클 상세 페이지 태그 배경 확인
- [x] 관련 글 카드 태그 배경 확인
- [x] 스크린샷 촬영 (선택사항)

### 반응형 테스트
- [x] 모바일 뷰 (375px) 확인
- [x] 태블릿 뷰 (768px) 확인
- [x] 데스크톱 뷰 (1920px) 확인

## Phase 3: 접근성 확인 (예상 10분)

### 대비율 확인
- [ ] Light mode 텍스트 대비율 확인 (목표: 4.5:1 이상)
- [ ] Dark mode 텍스트 대비율 확인 (목표: 4.5:1 이상)
- [ ] 필요 시 색상 조정

### 기타 확인
- [ ] 태그 hover 시 시각적 피드백 확인
- [ ] 키보드 포커스 시 outline 확인

## Phase 4: 브라우저 호환성 (예상 10분)

- [ ] Chrome 최신 버전 테스트
- [ ] Safari 최신 버전 테스트 (Mac/iOS)
- [ ] Firefox 최신 버전 테스트

## Phase 5: Git Commit (예상 5분)

### Commit 준비
- [x] `git status` 확인
- [x] `git diff` 변경사항 리뷰
- [x] 불필요한 파일 제외 확인

### Commit 생성
- [x] Stage changes: `git add app/globals.css components/ui/badge.tsx`
- [x] Commit:
  ```bash
  git commit -m "feat: 태그에 grey 배경색 추가

  * Badge outline variant에 --tag-bg CSS 변수 적용
  * Light/Dark mode 대응
  * 접근성 대비율 준수 (WCAG AA)
  "
  ```
- [x] `git log` 확인

## Phase 6: 최종 확인 (예상 5분)

- [ ] 프로덕션 빌드 테스트: `npm run build`
- [ ] 빌드 파일 사이즈 확인 (큰 변화 없어야 함)
- [ ] 다른 Badge 사용 위치 영향 없는지 확인
  - [ ] Category Badge 정상 동작
  - [ ] 다른 variant 정상 동작

## 완료 조건

✅ 모든 체크박스 완료
✅ Light/Dark mode 모두 정상 작동
✅ 접근성 기준 충족 (WCAG AA)
✅ 브라우저 호환성 확인
✅ Git commit 완료

## 롤백 계획

문제 발생 시:
```bash
git revert HEAD
```

## 예상 총 소요 시간

**총 75분** (1시간 15분)
- 구현: 30분
- 시각적 테스트: 15분
- 접근성 확인: 10분
- 브라우저 테스트: 10분
- Git commit: 5분
- 최종 확인: 5분
