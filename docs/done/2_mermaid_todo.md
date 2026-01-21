# Mermaid 다이어그램 렌더링 TODO

## 단계 1: 환경 설정

- [x] ~~rehype-mermaid 패키지 설치~~ → **클라이언트 사이드 mermaid.js로 변경**
  ```bash
  npm install mermaid
  ```
- [x] MCP Context7로 rehype-mermaid 최신 API 확인
- [x] Turbopack 호환성 문제로 클라이언트 렌더링 방식 선택

---

## 단계 2: 클라이언트 렌더링 구현

- [x] `components/article/mermaid-renderer.tsx` 컴포넌트 생성
  - [x] mermaid.js 클라이언트 사이드 렌더링
  - [x] 테마 변경 감지 및 다이어그램 재렌더링
  - [x] 에러 처리 (원본 코드 블록 유지)
- [x] `app/[slug]/page.tsx`에서 MermaidRenderer 사용

---

## 단계 3: 스타일링

- [x] `app/globals.css`에 Mermaid 스타일 추가
  - [x] 기본 레이아웃 스타일 (margin, overflow)
  - [x] SVG 반응형 스타일 (max-width, height)
  - [x] 에러 스타일

---

## 단계 4: 다크모드 지원

- [x] 다크모드 처리 방식 결정 → **mermaid.js 네이티브 테마 사용**
- [x] `useTheme` 훅으로 테마 변경 감지
- [x] 테마 전환 시 다이어그램 자동 재렌더링

---

## 단계 5: 테스트 (MCP Playwright 사용)

### 기본 렌더링 테스트
- [x] Flowchart 다이어그램 렌더링 확인
- [x] Sequence Diagram 렌더링 확인
- [x] Class Diagram 렌더링 확인
- [x] State Diagram 렌더링 확인

### 테마 테스트
- [x] 라이트 모드에서 다이어그램 표시 확인
- [x] 다크 모드에서 다이어그램 표시 확인
- [x] 테마 전환 시 색상 변경 확인

---

## 단계 6: 빌드 검증

- [x] `npm run build` 실행하여 빌드 성공 확인
- [x] 테스트용 마크다운 파일 작성 (`contents/test/mermaid-test/index.md`)

---

## 단계 7: 문서화 및 마무리

- [x] 테스트용 마크다운 파일 작성
- [ ] PR 생성 및 리뷰 요청
