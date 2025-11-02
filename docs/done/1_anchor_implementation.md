# Anchor 링크 스크롤 오프셋 구현

## 구현 방법: CSS scroll-margin-top

### 수정 파일
`app/globals.css`

### 코드 추가

**위치**: 417번 줄 이후 (Article heading 링크 관련 CSS 섹션)

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

### 기술적 상세

#### 값 계산
- **헤더 높이**: 56px (`h-14` = 3.5rem)
- **여유 공간**: 24px (1.5rem)
- **합계**: 80px (5rem)

#### 동작 원리
1. 사용자가 TOC 링크(`#id`)를 클릭
2. 브라우저가 해당 heading 요소로 스크롤
3. `scroll-margin-top: 5rem`으로 인해 요소가 화면 상단에서 80px 아래에 위치
4. Sticky 헤더(56px) 아래 여유 공간(24px)에 제목이 표시됨

#### 브라우저 호환성
- Chrome/Edge: ✅ 지원
- Firefox: ✅ 지원
- Safari: ✅ 지원
- IE: ❌ 미지원 (프로젝트에서 지원 안 함)

### 영향 범위
- `.prose` 클래스 내 모든 heading 요소 (h1~h6)
- Article 페이지의 모든 anchor 링크
- TOC 사이드바 링크
- Article 내부 anchor 링크

### 부작용 없음
- 일반 스크롤 동작에 영향 없음
- TOC sticky 동작 정상 유지
- 다른 컴포넌트에 영향 없음 (`.prose` 클래스에만 적용)
