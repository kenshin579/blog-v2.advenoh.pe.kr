# 인라인 코드 스타일링 TODO

## 📋 구현 체크리스트

### 1단계: CSS 스타일 추가
- [x] `app/globals.css` 파일 열기
- [x] 라인 424 위치 확인 (`.prose a[href^="#"]:hover` 다음)
- [x] 인라인 코드 스타일 추가:
  ```css
  /* 인라인 코드 스타일 (backtick으로 감싼 텍스트) */
  .prose code:not([class*="language-"]) {
    @apply font-mono text-sm px-1.5 py-0.5 rounded;
    background-color: hsl(var(--muted));
    color: hsl(var(--foreground));
  }
  
  /* 코드 블록 안의 인라인 코드는 별도 배경 없음 */
  .prose pre code {
    @apply p-0 bg-transparent;
  }
  ```
- [x] 파일 저장

### 2단계: 개발 서버 테스트
- [x] 개발 서버 실행: `npm run dev`
- [x] 브라우저에서 샘플 article 확인
  - 예: `contents/mac/m1-memongo.md`
  - URL: `http://localhost:3000/{article-slug}`

### 3단계: 시각적 확인
- [x] 인라인 코드 배경 확인
  - `golang`, `memongo` 등의 텍스트에 회색 배경 표시 확인
- [x] 코드 블록 확인
  - ```bash 블록이 기존대로 표시되는지 확인
  - 코드 블록 내부 인라인 코드가 이중 배경 없는지 확인

### 4단계: Light/Dark 모드 테스트
- [x] Light 모드에서 인라인 코드 배경 확인
  - 밝은 회색 배경 (--muted: 210 40% 96%)
- [x] Dark 모드로 전환
- [x] Dark 모드에서 인라인 코드 배경 확인
  - 어두운 회색 배경 (--muted: 217 33% 17%)
- [x] 색상 대비가 충분한지 확인

### 5단계: 반응형 테스트
- [x] 데스크톱 화면 확인 (1920px)
- [x] 태블릿 화면 확인 (768px)
- [x] 모바일 화면 확인 (375px)
- [x] 모든 화면 크기에서 인라인 코드 스타일 정상 확인

### 6단계: 다양한 Article 테스트
- [x] 다른 카테고리 article 2-3개 확인
  - 예: `contents/java/*.md`, `contents/spring/*.md`
- [x] 인라인 코드가 많은 article 확인
- [x] 코드 블록과 인라인 코드가 혼재된 article 확인

### 7단계: 빌드 테스트
- [x] Production 빌드 실행: `npm run build`
- [x] 빌드 오류 없는지 확인
- [x] 빌드된 사이트 확인: `npm start`
- [x] Production 환경에서도 스타일 정상 작동 확인

### 8단계: Git 커밋
- [x] 변경사항 확인: `git diff app/globals.css`
- [x] 스테이징: `git add app/globals.css`
- [x] 커밋:
  ```bash
  git commit -m "feat: 인라인 코드 스타일링 추가

  * .prose code 선택자에 회색 배경 및 패딩 추가
  * Light/Dark 모드 지원 (--muted 테마 변수 활용)
  * 코드 블록과 인라인 코드 스타일 충돌 방지
  "
  ```

## ✅ 완료 기준
- [x] 모든 단계 체크리스트 완료
- [x] Light/Dark 모드에서 인라인 코드가 회색 배경으로 표시됨
- [x] 코드 블록 스타일은 변경되지 않음
- [x] 모바일/데스크톱 모두에서 정상 작동
- [x] Production 빌드 성공

## 🚨 문제 발생 시
1. **스타일이 적용되지 않는 경우**
   - 브라우저 캐시 삭제 (Cmd+Shift+R / Ctrl+Shift+R)
   - 개발 서버 재시작
   - CSS 선택자 우선순위 확인

2. **코드 블록에도 이중 배경이 생기는 경우**
   - `.prose pre code` 스타일이 제대로 추가되었는지 확인
   - 선택자 특이성(specificity) 확인

3. **빌드 오류**
   - CSS 문법 오류 확인 (세미콜론, 중괄호)
   - Tailwind @apply 지시자가 유효한 클래스인지 확인
