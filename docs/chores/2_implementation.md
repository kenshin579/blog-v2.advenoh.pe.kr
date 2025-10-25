# Implementation Guide: 헤더 소셜 링크 추가

## 개요

헤더에 소셜 미디어 링크(LinkedIn, Instagram, Blog)를 추가하여 방문자가 쉽게 소셜 프로필에 접근할 수 있도록 합니다.

## 구현 사항

### 1. 소셜 링크 설정 파일 생성

**파일**: `lib/site-config.ts`

소셜 링크 데이터를 중앙에서 관리하기 위한 설정 파일을 생성합니다.

```typescript
export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  ariaLabel: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/frank-oh-abb80b10/',
    icon: 'Linkedin',
    ariaLabel: 'LinkedIn 프로필 방문'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/frank.photosnap',
    icon: 'Instagram',
    ariaLabel: 'Instagram 프로필 방문'
  },
  {
    name: 'Blog',
    url: 'https://investment.advenoh.pe.kr/',
    icon: 'BookOpen',
    ariaLabel: '투자 블로그 방문'
  }
];
```

**설계 근거**:
- TypeScript 타입 안정성 확보
- URL 변경 시 한 곳에서만 수정
- 새로운 소셜 링크 추가 용이
- 접근성 속성 중앙 관리

### 2. 소셜 링크 컴포넌트 생성

**파일**: `components/social-links.tsx`

소셜 링크를 렌더링하는 재사용 가능한 컴포넌트를 생성합니다.

```typescript
'use client';

import Link from 'next/link';
import { Linkedin, Instagram, BookOpen, LucideIcon } from 'lucide-react';
import { socialLinks } from '@/lib/site-config';
import { Button } from '@/components/ui/button';

// 아이콘 매핑
const iconMap: Record<string, LucideIcon> = {
  Linkedin,
  Instagram,
  BookOpen,
};

export function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((link) => {
        const Icon = iconMap[link.icon];

        if (!Icon) {
          console.warn(`Icon not found: ${link.icon}`);
          return null;
        }

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

**설계 근거**:
- `Button` 컴포넌트로 일관된 스타일 유지
- `variant="ghost"` - 헤더와 자연스럽게 조화
- `size="icon"` - ThemeToggle과 동일한 크기
- `target="_blank"` - 새 탭에서 열기 (UX 개선)
- `rel="noopener noreferrer"` - 보안 강화
- 동적 아이콘 매핑으로 확장성 확보
- 'use client' - Next.js 클라이언트 컴포넌트

### 3. 헤더 컴포넌트 통합

**파일**: `components/site-header.tsx`

기존 헤더에 SocialLinks 컴포넌트를 추가합니다.

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
import { SocialLinks } from '@/components/social-links';

// ...

<div className="flex items-center gap-2">
  <SocialLinks />
  <Button variant="outline" ...>
    <Search className="h-4 w-4" />
  </Button>
  <ThemeToggle />
</div>
```

**배치 근거**:
- Search 앞에 배치하여 소셜 링크를 우선 노출
- 시각적 균형 유지
- 모바일에서도 자연스러운 배치

### 4. 실제 URL 정보

위 코드 예시에는 실제 URL이 이미 반영되어 있습니다:

- **LinkedIn**: https://www.linkedin.com/in/frank-oh-abb80b10/
- **Instagram**: https://www.instagram.com/frank.photosnap
- **Blog**: https://investment.advenoh.pe.kr/ (투자 블로그)

**Blog 아이콘 선택**:
- `BookOpen` 사용 (투자/지식 공유 블로그에 적합)
- 필요시 `TrendingUp` (투자 관련), `LineChart` (투자 분석) 등으로 변경 가능

### 5. 반응형 처리 (선택사항)

모바일에서 공간이 부족한 경우:

```tsx
<div className="hidden md:flex items-center gap-2">
  <SocialLinks />
</div>
```

**현재 권장사항**: 헤더에 충분한 공간이 있어 모든 화면에서 표시

## 기술 스택

- **React**: 컴포넌트 기반 UI
- **Next.js**: Link 컴포넌트, 클라이언트 컴포넌트
- **TypeScript**: 타입 안전성
- **lucide-react**: 아이콘 라이브러리 (기존 설치됨)
- **shadcn/ui**: Button 컴포넌트
- **Tailwind CSS**: 스타일링

## 예상 결과

### 시각적 레이아웃
```
[Advenoh] [홈] [시리즈]              [LinkedIn] [Instagram] [Blog] [Search] [ThemeToggle]
```

### 파일 변경 사항
- 새로운 파일: 2개
  - `lib/site-config.ts`
  - `components/social-links.tsx`
- 수정된 파일: 1개
  - `components/site-header.tsx`
- 새로운 의존성: 0개 (lucide-react 재사용)
- 예상 번들 크기 증가: < 1KB

## 접근성 고려사항

- ✅ `aria-label` 속성으로 스크린 리더 지원
- ✅ 키보드 네비게이션 (Tab 키로 포커스 이동)
- ✅ 외부 링크 보안 (`rel="noopener noreferrer"`)
- ✅ 충분한 터치 타겟 크기 (44x44px)
- ✅ Light/Dark 모드 모두 적절한 대비

## 보안 고려사항

- `target="_blank"` 사용 시 `rel="noopener noreferrer"` 필수
  - `noopener`: 새 창에서 `window.opener` 접근 차단
  - `noreferrer`: Referer 헤더 전송 방지

## 성능 최적화

- 클라이언트 컴포넌트로 하이드레이션 최소화
- 아이콘 tree-shaking (lucide-react는 개별 import 지원)
- 정적 링크이므로 추가 API 호출 없음

## 확장 가능성

### 추가 소셜 링크
1. `lib/site-config.ts`의 `socialLinks` 배열에 추가
2. `components/social-links.tsx`의 `iconMap`에 아이콘 추가
3. lucide-react에서 아이콘 import

### Tooltip 추가 (선택사항)
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// hover 시 "LinkedIn", "Instagram" 등 텍스트 표시
```

### 애니메이션 추가 (선택사항)
```tsx
// hover 시 subtle scale 효과
className="transition-transform hover:scale-110"
```

## 트러블슈팅

### 아이콘이 표시되지 않는 경우
1. lucide-react 설치 확인: `npm list lucide-react`
2. iconMap에 아이콘 추가 확인
3. 콘솔 경고 메시지 확인

### 링크가 작동하지 않는 경우
1. URL 형식 확인 (https:// 포함)
2. Next.js Link 컴포넌트 사용 확인
3. target="_blank" 속성 확인

### 스타일이 적용되지 않는 경우
1. Button 컴포넌트 import 확인
2. Tailwind CSS 클래스 확인
3. Dark mode 테스트

## 참고 자료

- [lucide-react 아이콘 목록](https://lucide.dev/icons/)
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
- [Next.js Link](https://nextjs.org/docs/app/api-reference/components/link)
- [웹 접근성 - 외부 링크](https://www.w3.org/WAI/WCAG21/Techniques/general/G201)
