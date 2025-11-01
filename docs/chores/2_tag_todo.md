# TODO: Article 태그에 # 프리픽스 추가

## 📋 Phase 1: 코드 수정

### Step 1: Article 상세 페이지 수정
- [ ] `app/[slug]/page.tsx` 파일 열기
- [ ] Line 108-116: Article 헤더 태그에 # 추가
  - `{tag}` → `#{tag}` 변경
- [ ] Line 195-209: 관련 글 섹션 태그에 # 추가
  - `{tag}` → `#{tag}` 변경

### Step 2: 홈 페이지 수정
- [ ] `components/home-content.tsx` 파일 열기
- [ ] Line 151-166: Article 카드 태그에 # 추가
  - `{tag}` → `#{tag}` 변경

### Step 3: Series 페이지 수정
- [ ] `app/series/page.tsx` 파일 열기
- [ ] Line 76-95: Article 카드 태그에 # 추가
  - `{tag}` → `#{tag}` 변경

### Step 4: 검색 다이얼로그 수정
- [ ] `components/search-dialog.tsx` 파일 열기
- [ ] Line 163-171: 검색 결과 태그에 # 추가
  - `{tag}` → `#{tag}` 변경

## 🧪 Phase 2: 테스트

### Step 5: 개발 환경 확인
- [ ] `npm run dev` 실행
- [ ] 브라우저에서 localhost:3000 접속

### Step 6: 페이지별 수동 테스트

#### 홈 페이지
- [ ] Article 카드의 태그에 # 표시 확인
- [ ] 3개 이상 태그 시 +N 표시 정상 동작 확인
- [ ] 태그 Badge 스타일 정상 유지 확인

#### Article 상세 페이지
- [ ] 임의의 article 클릭하여 상세 페이지 이동
- [ ] 상단 헤더의 태그에 # 표시 확인
- [ ] 하단 관련 글 섹션의 태그에 # 표시 확인
- [ ] 다크 모드 전환하여 태그 표시 확인

#### Series 페이지
- [ ] /series 페이지 이동
- [ ] Article 카드의 태그에 # 표시 확인
- [ ] 2개 이상 태그 시 +N 표시 정상 동작 확인

#### 검색 기능
- [ ] Cmd+K (또는 Ctrl+K)로 검색 다이얼로그 열기
- [ ] 검색어 입력하여 결과 확인
- [ ] 검색 결과의 태그에 # 표시 확인
- [ ] 검색 기능 정상 동작 확인

### Step 7: 반응형 테스트
- [ ] 모바일 화면 크기로 테스트 (375px)
- [ ] 태블릿 화면 크기로 테스트 (768px)
- [ ] 데스크탑 화면 크기로 테스트 (1024px+)

## 🔨 Phase 3: 빌드 및 배포

### Step 8: 타입 체크 및 빌드
- [ ] `npm run check` 실행하여 TypeScript 에러 확인
- [ ] `npm run build` 실행하여 빌드 성공 확인
- [ ] 빌드 경고 메시지 확인 및 해결

### Step 9: 프로덕션 빌드 테스트
- [ ] `npm start` 실행
- [ ] localhost:3000 접속하여 프로덕션 빌드 테스트
- [ ] 모든 페이지 정상 동작 확인

### Step 10: Git 커밋
- [ ] 변경된 파일 확인: `git status`
- [ ] 변경 사항 리뷰: `git diff`
- [ ] 스테이징: `git add app/ components/`
- [ ] 커밋: `git commit -m "feat: article 태그에 # 프리픽스 추가"`

## ✅ 완료 기준

- 5개 파일 모두 수정 완료
- 모든 페이지에서 태그가 # 형식으로 표시됨
- TypeScript 타입 체크 통과
- 빌드 성공
- 수동 테스트 모두 통과
