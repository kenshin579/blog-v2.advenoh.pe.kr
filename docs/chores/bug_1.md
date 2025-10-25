# 헤더 브랜드명 변경

## 요구사항
헤더 맨 왼쪽에 있는 "Advenoh" 텍스트를 "Frank's IT Blog"로 변경

## 현재 상태 분석

### 위치
- **파일**: [components/site-header.tsx](../../components/site-header.tsx)
- **라인**: 18-20

### 현재 코드
```tsx
<Link href="/" className="font-bold text-xl">
  Advenoh
</Link>
```

### 컴포넌트 구조
- `SiteHeader` 컴포넌트가 전체 헤더를 담당
- Next.js Link 컴포넌트를 사용하여 홈페이지로 이동하는 브랜드 로고/텍스트
- 반응형 디자인 적용 (모바일/데스크톱)
- ThemeToggle, SearchDialog와 함께 헤더 구성

## 구현 내용

### 변경 사항
[components/site-header.tsx:19](../../components/site-header.tsx#L19)에서 텍스트 변경:
```tsx
// 변경 전
Advenoh

// 변경 후
Frank's IT Blog
```

### 영향 범위
- 헤더 브랜드명 표시만 변경
- 다른 기능(라우팅, 스타일)은 영향 없음
- 모바일/데스크톱 모두 동일하게 적용

## TODO

- [x] [components/site-header.tsx](../../components/site-header.tsx) 파일에서 19번째 줄의 "Advenoh"를 "Frank's IT Blog"로 변경
- [x] `npm run dev`로 개발 서버 실행하여 변경 사항 확인
- [x] 브라우저에서 헤더 텍스트가 "Frank's IT Blog"로 표시되는지 확인
- [x] 다크모드/라이트모드 양쪽에서 정상 표시 확인
- [x] 모바일 반응형에서도 정상 표시 확인

## 참고사항
- 스타일 클래스(`font-bold text-xl`)는 그대로 유지
- Link 컴포넌트의 href="/" 경로는 변경 불필요
- 추가 스타일 조정이 필요한 경우 tailwind 클래스 수정 고려
