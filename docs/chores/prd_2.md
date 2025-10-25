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

## 구현 내용

### 1. 소셜 링크 데이터 구조 설계
**파일**: `lib/site-config.ts` (신규 생성)

```typescript
export const socialLinks = [
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/username',
    icon: 'Linkedin',
    ariaLabel: 'LinkedIn 프로필 방문'
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/username',
    icon: 'Instagram',
    ariaLabel: 'Instagram 프로필 방문'
  },
  {
    name: 'Blog',
    url: 'https://blog.example.com',
    icon: 'BookOpen', // 또는 'Globe', 'Link'
    ariaLabel: '블로그 방문'
  }
];
```

**설계 이유**:
- 중앙화된 설정으로 URL 변경 용이
- 타입 안전성 확보
- 추가 소셜 링크 확장 가능

### 2. 소셜 링크 컴포넌트 생성
**파일**: `components/social-links.tsx` (신규 생성)

```typescript
'use client';

import Link from 'next/link';
import { Linkedin, Instagram, BookOpen } from 'lucide-react';
import { socialLinks } from '@/lib/site-config';
import { Button } from '@/components/ui/button';

const iconMap = {
  Linkedin,
  Instagram,
  BookOpen,
};

export function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((link) => {
        const Icon = iconMap[link.icon as keyof typeof iconMap];
        return (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            asChild
          >
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
```

**설계 이유**:
- Button 컴포넌트로 일관된 hover/focus 스타일 유지
- variant="ghost"로 헤더와 조화
- size="icon"으로 기존 ThemeToggle과 동일한 크기
- target="_blank"로 새 탭에서 열기 (UX 개선)
- rel="noopener noreferrer"로 보안 강화
- 동적 아이콘 매핑으로 유연성 확보

### 3. 헤더 컴포넌트 통합
**파일**: `components/site-header.tsx` (수정)

**변경 전**:
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" ...>
    <Search className="h-4 w-4" />
  </Button>
  <ThemeToggle />
</div>
```

**변경 후**:
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" ...>
    <Search className="h-4 w-4" />
  </Button>
  <SocialLinks />
  <ThemeToggle />
</div>
```

**위치 결정 이유**:
- Search와 ThemeToggle 사이 배치
- 시각적 균형 유지
- 모바일 환경에서도 자연스러운 배치

### 4. 반응형 처리 (선택사항)
모바일에서 공간 절약이 필요한 경우:

```tsx
<div className="hidden md:flex items-center gap-2">
  <SocialLinks />
</div>
```

**현재 판단**: 헤더에 충분한 공간이 있어 모든 화면에서 표시 권장

### 5. 아이콘 선택 가이드
**lucide-react 추천 아이콘**:
- LinkedIn: `Linkedin`
- Instagram: `Instagram`
- Blog: `BookOpen`, `Globe`, `PenTool`, `FileText` 중 선택

**선택 기준**:
- 웹사이트가 기술 블로그 → `BookOpen` (지식 공유 느낌)
- 개인 블로그 → `PenTool` (창작 느낌)
- 다국어 블로그 → `Globe` (글로벌 느낌)

## TODO

### Phase 1: 기본 구현
- [ ] `lib/site-config.ts` 생성
  - [ ] socialLinks 배열 정의
  - [ ] 실제 URL로 교체 (현재는 placeholder)
  - [ ] TypeScript 타입 정의
- [ ] `components/social-links.tsx` 생성
  - [ ] SocialLinks 컴포넌트 구현
  - [ ] lucide-react 아이콘 import
  - [ ] iconMap 매핑 로직 구현
  - [ ] 접근성 속성 추가 (aria-label)
- [ ] `components/site-header.tsx` 수정
  - [ ] SocialLinks import
  - [ ] 우측 액션 영역에 SocialLinks 추가
  - [ ] gap 간격 조정 확인

### Phase 2: 스타일링 및 검증
- [ ] Light mode 시각적 확인
  - [ ] 아이콘 색상 적절성
  - [ ] hover 상태 확인
  - [ ] 간격 및 정렬 확인
- [ ] Dark mode 시각적 확인
  - [ ] 아이콘 색상 적절성
  - [ ] hover 상태 확인
- [ ] 반응형 테스트
  - [ ] 모바일 (< 768px)
  - [ ] 태블릿 (768px - 1024px)
  - [ ] 데스크톱 (> 1024px)

### Phase 3: 접근성 및 UX
- [ ] 키보드 네비게이션 테스트
  - [ ] Tab으로 포커스 이동 확인
  - [ ] Enter로 링크 활성화 확인
- [ ] 스크린 리더 테스트
  - [ ] aria-label 읽기 확인
- [ ] 외부 링크 보안
  - [ ] rel="noopener noreferrer" 확인
  - [ ] target="_blank" 동작 확인

### Phase 4: 최적화 (선택사항)
- [ ] Tooltip 추가 고려
  - [ ] Radix UI Tooltip 컴포넌트 사용
  - [ ] hover 시 "LinkedIn", "Instagram" 등 텍스트 표시
- [ ] 애니메이션 추가 고려
  - [ ] hover 시 subtle scale 효과
  - [ ] framer-motion 활용 (이미 설치됨)

### Phase 5: 테스트 및 배포
- [ ] MCP Playwright로 E2E 테스트
  - [ ] 각 소셜 링크 클릭 테스트
  - [ ] 새 탭에서 열리는지 확인
  - [ ] 시각적 회귀 테스트 (스크린샷)
- [ ] TypeScript 타입 체크
  - [ ] `npm run check` 실행
- [ ] Git 커밋
  - [ ] `feat/#이슈번호-헤더-소셜-링크-추가`
  - [ ] 논리적 단위로 커밋 분리 (설정 파일 → 컴포넌트 → 통합)

## 예상 결과

### 시각적 결과
```
[Advenoh] [홈] [시리즈]                [Search] [LinkedIn] [Instagram] [Blog] [ThemeToggle]
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
