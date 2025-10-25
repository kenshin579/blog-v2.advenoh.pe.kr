# PRD: 헤더 소셜 링크 추가

## 요구사항

### 기능 요구사항
- 헤더에 소셜 미디어 링크 추가 (LinkedIn, Instagram, Blog)
- 아이콘은 웹사이트의 theme/style/color와 조화롭게 통합
- Light/Dark 모드 모두에서 적절한 시각적 표현
- 반응형 디자인 (모바일/데스크톱 대응)
- hover 상태에서 적절한 피드백 제공

### 디자인 요구사항
- 현재 헤더 디자인과 일관성 유지
- 아이콘 크기: 20x20px (기존 Search 아이콘과 동일)
- 색상: muted-foreground (기본), foreground (hover)
- 간격: gap-2 또는 gap-3으로 적절한 여백 유지
- 접근성: aria-label 또는 title 속성 필수

### 기술 요구사항
- lucide-react 아이콘 라이브러리 사용 (이미 설치됨)
- 새로운 외부 라이브러리 추가 지양
- TypeScript 타입 안정성 유지
- Next.js Link 컴포넌트 활용 (외부 링크의 경우 적절한 설정)

## 현재 코드 분석

### 헤더 컴포넌트 구조 (`components/site-header.tsx`)
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="container flex h-14 items-center justify-between">
    <div className="flex items-center gap-6">
      {/* 로고 + 네비게이션 */}
    </div>

    <div className="flex items-center gap-2">
      {/* Search 버튼 */}
      {/* ThemeToggle */}
    </div>
  </div>
</header>
```

### 현재 사용 중인 아이콘
- `Search` from lucide-react (헤더)
- `Sun`, `Moon` from lucide-react (ThemeToggle)

### 색상 시스템
- Primary color: `hsl(217 91% 60%)` (Blue)
- Muted foreground: `hsl(215 16% 47%)` (Light mode)
- Foreground: `hsl(222 47% 11%)` (Light mode)
- Light/Dark 모드 자동 전환 지원

## 구현 개요

### 핵심 변경사항
1. **소셜 링크 설정 파일**: `lib/site-config.ts` 생성 (중앙 관리)
2. **소셜 링크 컴포넌트**: `components/social-links.tsx` 생성 (재사용 가능)
3. **헤더 통합**: `components/site-header.tsx` 수정 (Search 앞에 배치)

### 사용할 아이콘 (lucide-react)
- LinkedIn: `Linkedin`
- Instagram: `Instagram`
- Blog: `TrendingUp` (투자 블로그 - 상승 추세선)

### 주요 설계 원칙
- shadcn/ui Button 컴포넌트 사용 (일관된 스타일)
- `variant="ghost"` - 헤더와 자연스럽게 조화
- `target="_blank"` + `rel="noopener noreferrer"` - 보안 강화
- `aria-label` 속성 - 접근성 준수

> **📋 상세 구현 가이드**: [2_implementation.md](./2_implementation.md)
> **✅ TODO 체크리스트**: [2_todo.md](./2_todo.md)

## 예상 결과

### 시각적 결과
```
[Advenoh] [홈] [시리즈]              [LinkedIn] [Instagram] [Blog] [Search] [ThemeToggle]
```

### 기술적 결과
- 새로운 파일: 2개 (`lib/site-config.ts`, `components/social-links.tsx`)
- 수정된 파일: 1개 (`components/site-header.tsx`)
- 새로운 의존성: 0개 (lucide-react 재사용)
- 예상 번들 크기 증가: < 1KB

## 리스크 및 고려사항

### 리스크
1. **모바일 화면 공간 부족**
   - 완화: 충분한 간격 확보 확인됨 (현재 gap-2 사용)
   - 대안: 필요시 md:flex�� 모바일에서 숨김

2. **너무 많은 아이콘으로 시각적 복잡도 증가**
   - 완화: variant="ghost"로 subtle한 표현
   - 대안: Dropdown으로 통합 고려

3. **접근성 문제**
   - 완화: aria-label 명시적 추가
   - 검증: 스크린 리더 테스트 필수

### 고려사항
1. **URL 관리**: 환경 변수로 관리 고려 (배포 환경별로 다른 경우)
2. **아이콘 일관성**: 모든 소셜 아이콘이 lucide-react에 있는지 확인
3. **성능**: 클라이언트 컴포넌트이므로 hydration 고려 (현재는 문제 없음)

## 참고 자료

- [lucide-react 아이콘 목록](https://lucide.dev/icons/)
- [shadcn/ui Button 컴포넌트](https://ui.shadcn.com/docs/components/button)
- [Next.js Link 컴포넌트](https://nextjs.org/docs/app/api-reference/components/link)
- [웹 접근성 가이드 - 외부 링크](https://www.w3.org/WAI/WCAG21/Techniques/general/G201)
