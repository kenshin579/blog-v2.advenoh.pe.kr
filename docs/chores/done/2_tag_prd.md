# PRD: Article 태그에 # 프리픽스 추가

## 📋 개요

**목적**: 블로그 플랫폼의 모든 태그 표시에 `#` 기호를 추가하여 해시태그 형식으로 변경
**현재 상태**: 태그가 일반 텍스트로 표시됨 (예: `keycloak`)
**목표 상태**: 태그가 해시태그 형식으로 표시됨 (예: `#keycloak`)

## 🎯 비즈니스 목표

- 소셜 미디어 스타일의 태그 표시로 사용자 경험 향상
- 태그의 시각적 인식성 개선
- 일관된 태그 표시 형식 제공

## 📍 현재 상태 분석

### 태그 표시 위치 (총 5곳)

1. **Article 상세 페이지 - 메인 헤더**
   - 파일: `app/[slug]/page.tsx` (Line 108-116)

2. **Article 상세 페이지 - 관련 글 섹션**
   - 파일: `app/[slug]/page.tsx` (Line 195-209)

3. **홈 페이지 - Article 카드**
   - 파일: `components/home-content.tsx` (Line 151-166)

4. **Series 페이지 - Article 카드**
   - 파일: `app/series/page.tsx` (Line 76-95)

5. **검색 다이얼로그 - 검색 결과**
   - 파일: `components/search-dialog.tsx` (Line 163-171)

## ✅ 요구사항

### 기능 요구사항

1. **태그 표시 형식 변경**
   - 모든 태그 앞에 `#` 기호 추가
   - 예: `keycloak` → `#keycloak`
   - 태그 텍스트만 변경, Badge 컴포넌트 스타일은 유지

2. **일관성 유지**
   - 5개 위치 모두에서 동일한 형식 적용
   - 기존 스타일링(variant, className 등) 유지

3. **데이터 무결성**
   - 원본 데이터(markdown frontmatter)는 변경하지 않음
   - 표시 레이어에서만 # 추가

### 비기능 요구사항

1. **성능**
   - 기존 렌더링 성능 유지
   - 추가 연산 최소화

2. **접근성**
   - Badge 컴포넌트의 접근성 유지
   - 스크린 리더 호환성 유지

3. **유지보수성**
   - 코드 가독성 유지
   - 향후 태그 형식 변경 용이성

## 📝 수정 대상 파일

1. `app/[slug]/page.tsx` (2곳)
2. `components/home-content.tsx` (1곳)
3. `app/series/page.tsx` (1곳)
4. `components/search-dialog.tsx` (1곳)

## 📌 참고사항

- Badge 컴포넌트는 shadcn/ui 라이브러리 사용
- 태그 데이터는 markdown frontmatter에서 로드
- 검색 인덱스는 빌드 시 생성되므로 빌드 재실행 필요

## 📚 관련 문서

- 구현 내용: [2_tag_implementation.md](./2_tag_implementation.md)
- TODO 체크리스트: [2_tag_todo.md](./2_tag_todo.md)

## 🔍 관련 이슈

- 없음 (새로운 기능 추가)

## 📅 일정

- 예상 작업 시간: 30분
- 테스트 시간: 15분
- 총 소요 시간: 45분
