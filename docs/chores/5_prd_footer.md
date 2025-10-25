# Footer 개선 PRD

## 1. 프로젝트 개요

### 목적
현재 단순한 텍스트로만 구성된 Footer를 다단 레이아웃으로 개선하여 더 많은 정보와 네비게이션을 제공

### 범위
- Footer 컴포넌트 UI 재설계
- 기존 소셜 링크, RSS, Sitemap 연동
- 카테고리 섹션 추가
- 반응형 레이아웃 구현

### 전제 조건
- 소셜 링크 URL 설정이 이미 완료되어 있음 (별도 PRD)
- RSS 피드 (`/rss.xml`) 생성 완료 (별도 PRD)
- Sitemap (`/sitemap.xml`) 생성 완료 (별도 PRD)

---

## 2. 현재 상태 (AS-IS)

### 2.1 현재 Footer 구현

**위치**: `app/layout.tsx` (40-46번 라인)

```tsx
<footer className="border-t py-6 md:py-0">
  <div className="container px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
      Built with Next.js and shadcn/ui. © 2025 Advenoh
    </p>
  </div>
</footer>
```

**화면 표시**:
```
Built with Next.js and shadcn/ui. © 2025 Advenoh
```

### 2.2 문제점
- 정보량이 매우 제한적 (단일 텍스트 라인)
- 기존 소셜 미디어 링크 미표시
- RSS/Sitemap 접근 경로 없음
- 사이트 네비게이션 지원 부족
- 시각적으로 빈약함
- 카테고리 탐색 불가능

---

## 3. 목표 상태 (TO-BE)

### 3.1 레이아웃 구조

**3단 컬럼 레이아웃 (Desktop):**

```
┌─────────────────────────────────────────────────────────────┐
│  [왼쪽 섹션]          [중앙 섹션]          [오른쪽 섹션]     │
│  - 블로그 소개        - 카테고리           - 정보            │
│  - 소셜 링크                                                │
├─────────────────────────────────────────────────────────────┤
│            © 2025 Advenoh IT Blog. All rights reserved.      │
└─────────────────────────────────────────────────────────────┘
```

**1단 레이아웃 (Mobile):**
- 왼쪽 → 중앙 → 오른쪽 순서로 세로 배치
- 각 섹션 간격 적절히 조정

### 3.2 섹션별 상세 내용

#### 왼쪽 섹션: 블로그 정보
- **타이틀**: "Advenoh IT Blog" (텍스트만, 이미지 없음)
- **설명문구**:
  ```
  기술 블로그, 프로그래밍, 개발 관련
  지식과 경험을 공유하는 개인 블로그입니다.
  ```
- **소셜 링크 아이콘**:
  - GitHub, Instagram, LinkedIn 등
  - 기존 설정된 URL 사용 (`@/config/social.ts`)
  - 새 탭에서 열기

#### 중앙 섹션: 카테고리
- **제목**: "카테고리"
- **콘텐츠**:
  - 현재 사용 중인 태그 목록 동적 생성 (최대 8-10개)
  - 예: React, TypeScript, Node.js, DevOps, Git, Python 등
  - 클릭 시 해당 태그로 필터링된 페이지로 이동 (향후 구현)

#### 오른쪽 섹션: 정보
- **제목**: "정보"
- **링크 목록**:
  - RSS 피드: `/rss.xml`
  - 사이트맵: `/sitemap.xml`
  - 시리즈 페이지: `/series`
  - ~~About 페이지~~ (추가하지 않음)

#### 하단: 저작권 정보
```
© 2025 Advenoh IT Blog. All rights reserved.
```

---

## 4. 기능 요구사항

### 4.1 Core Features

#### F1. 3단 레이아웃 구현
- **Desktop (≥768px)**: 3개 컬럼 나란히 배치
- **Mobile (<768px)**: 1개 컬럼 세로 배치
- 다크모드 지원

#### F2. 블로그 정보 섹션
- 블로그 타이틀 표시: "Advenoh IT Blog"
- 간단한 소개 문구 (2-3줄):
  ```
  기술 블로그, 프로그래밍, 개발 관련
  지식과 경험을 공유하는 개인 블로그입니다.
  ```
- 소셜 미디어 아이콘 링크
  - 설정 파일에서 URL 로드 (`@/config/social.ts`)
  - 새 탭에서 열기 (`target="_blank" rel="noopener noreferrer"`)
  - Hover 효과

#### F3. 카테고리 섹션
- 현재 사용 중인 태그 목록 동적 생성
  - `loadArticles()` → 모든 article의 tags 수집
  - 중복 제거 후 알파벳 순 정렬
  - 최대 10개 표시
- 클릭 시 해당 태그로 필터링 (향후 구현)

#### F4. 정보 섹션
- 링크 목록:
  - RSS 피드: `/rss.xml`
  - Sitemap: `/sitemap.xml`
  - 시리즈 페이지: `/series`

#### F5. 저작권 정보
- 중앙 정렬
- 현재 연도 동적 표시: `new Date().getFullYear()`
- 블로그명: "Advenoh IT Blog"

---

## 5. 디자인 요구사항

### 5.1 스타일 가이드

#### 색상
- **배경색**:
  - Light mode: `bg-muted/30` (연한 회색)
  - Dark mode: `bg-background` (어두운 배경)
- **텍스트**:
  - 제목: `text-foreground font-semibold`
  - 본문: `text-muted-foreground`
  - 링크: `hover:text-foreground transition-colors`

#### 타이포그래피
- **섹션 제목**: `text-sm font-semibold mb-4`
- **본문 텍스트**: `text-sm leading-relaxed`
- **링크**: `text-sm hover:underline`

#### 간격
- **섹션 간 간격**: `gap-8 md:gap-12`
- **내부 여백**: `py-12 px-4`
- **요소 간 간격**: `space-y-2`

#### 아이콘
- **크기**: `w-5 h-5` (20px)
- **소셜 아이콘**: Lucide React 사용
  - GitHub: `<Github />`
  - Instagram: `<Instagram />`
  - LinkedIn: `<Linkedin />`

### 5.2 반응형 디자인

```css
/* Desktop (≥768px) */
grid-cols-3

/* Mobile (<768px) */
grid-cols-1
```

### 5.3 접근성
- 모든 링크에 적절한 `aria-label` 추가
- 소셜 아이콘에 screen reader용 텍스트
- 충분한 색상 대비 (WCAG AA 준수)
- 키보드 네비게이션 지원

---

## 6. 기술 요구사항

### 6.1 컴포넌트 구조

**파일 위치**: `components/site-footer.tsx` (신규 생성)

**이유**: 
- `components/site-header.tsx`와 대칭 구조
- 재사용 가능한 컴포넌트로 분리
- `app/layout.tsx`를 간결하게 유지

**컴포넌트 계층**:
```tsx
<SiteFooter>
  <Container>
    <FooterContent> (3-column grid)
      <AboutSection>
        - BlogInfo
        - SocialLinks
      </AboutSection>
      <CategorySection>
        - CategoryList
      </CategorySection>
      <InfoSection>
        - LinkList
      </InfoSection>
    </FooterContent>
    <Copyright />
  </Container>
</SiteFooter>
```

### 6.2 데이터 흐름

```typescript
// components/site-footer.tsx
'use client';

import { useState, useEffect } from 'react';
import { socialLinks } from '@/config/social';

export function SiteFooter() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // 모든 article 로드 후 고유 태그 추출
    loadArticles().then(articles => {
      const allTags = articles.flatMap(a => a.tags);
      const uniqueTags = [...new Set(allTags)].sort();
      setCategories(uniqueTags.slice(0, 10));
    });
  }, []);

  return (/* Footer JSX */);
}
```

### 6.3 설정 파일 연동

**소셜 링크 설정 (예상 구조):**
```typescript
// config/social.ts (별도 PRD에서 생성 예정)
import { Github, Instagram, Linkedin } from 'lucide-react';

export const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/...', icon: Github },
  { name: 'Instagram', url: 'https://instagram.com/...', icon: Instagram },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/...', icon: Linkedin },
];
```

### 6.4 사용 기술
- **프레임워크**: Next.js 15 (App Router)
- **UI 라이브러리**: shadcn/ui 컴포넌트
- **아이콘**: Lucide React
- **스타일링**: Tailwind CSS
- **��입**: TypeScript

### 6.5 통합 방법

**`app/layout.tsx` 수정**:

**Before** (40-46번 라인):
```tsx
<footer className="border-t py-6 md:py-0">
  <div className="container px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
      Built with Next.js and shadcn/ui. © 2025 Advenoh
    </p>
  </div>
</footer>
```

**After**:
```tsx
import { SiteFooter } from '@/components/site-footer';

// ... (in RootLayout)
<SiteFooter />
```

---

## 7. 구현 계획

### Phase 1: 기본 구조 (필수)
1. `components/site-footer.tsx` 생성
2. 3단 레이아웃 구현 (반응형)
3. 블로그 정보 섹션 (타이틀 + 설명)
4. 저작권 정보 하단 배치
5. `app/layout.tsx`에서 기존 Footer 교체

**예상 시간**: 1-2시간

**체크리스트**:
- [ ] `components/site-footer.tsx` 파일 생성
- [ ] 반응형 그리드 레이아웃 구현 (3단 → 1단)
- [ ] 블로그 정보 섹션 마크업
  - [ ] "Advenoh IT Blog" 타이틀
  - [ ] 설명 문구 추가
- [ ] 저작권 정보 추가 (동적 연도)
- [ ] `app/layout.tsx` 40-46번 라인 제거
- [ ] `SiteFooter` import 및 렌더링

### Phase 2: 동적 콘텐츠 (필수)
1. 카테고리 섹션 - 태그 목록 자동 생성
2. 정보 섹션 - 내부 링크 추가 (RSS, Sitemap, Series)
3. 다크모드 스타일 조정

**예상 시간**: 1시간

**체크리스트**:
- [ ] `loadArticles()` import 및 연동
- [ ] `useEffect`로 태그 추출 로직 구현
- [ ] 카테고리 목록 렌더링 (최대 10개)
- [ ] 정보 섹션 링크 목록 추가
  - [ ] RSS: `/rss.xml`
  - [ ] Sitemap: `/sitemap.xml`
  - [ ] Series: `/series`
- [ ] 다크모드 색상 테스트 및 조정

### Phase 3: 소셜 링크 연동 (필수)
1. 설정 파일에서 소셜 링크 로드
2. 소셜 아이콘 렌더링
3. Hover 효과 및 접근성 개선

**예상 시간**: 30분

**체크리스트**:
- [ ] `@/config/social` import
- [ ] 동적 소셜 아이콘 렌더링
- [ ] 외부 링크 속성 추가 (target, rel)
- [ ] Hover 효과 구현
- [ ] `aria-label` 추가

### Phase 4: 테스트 및 최적화 (필수)
1. 모바일 반응형 테스트
2. 다크모드 전환 테스트
3. 접근성 검증 (키보드, 스크린리더)
4. 성능 최적화 (불필요한 리렌더링 방지)

**예상 시간**: 30분

**체크리스트**:
- [ ] 모바일 디바이스 테스트 (375px, 768px, 1024px)
- [ ] 다크/라이트 모드 전환 테스트
- [ ] 키보드 네비게이션 테스트 (Tab, Enter)
- [ ] 모든 링크 동작 확인
  - [ ] 소셜 링크 새 탭 열림
  - [ ] RSS/Sitemap 접근 가능
  - [ ] Series 페이지 이동

---

## 8. 성공 지표

### 필수 달성 목표
- [ ] 3단 레이아웃 구현 완료 (Desktop)
- [ ] 1단 레이아웃 구현 완료 (Mobile)
- [ ] 다크모드 정상 작동
- [ ] 카테고리 목록 자동 생성 및 표시
- [ ] 소셜 링크 아이콘 정상 표시
- [ ] RSS, Sitemap, Series 링크 정상 작동
- [ ] 모든 외부 링크 새 탭에서 열림
- [ ] `app/layout.tsx`에서 기존 Footer 제거 완료

### 선택 달성 목표
- [ ] 카테고리 클릭 시 필터링 기능 (향후)
- [ ] Newsletter 구독 폼 (향후)
- [ ] "맨 위로" 버튼 (향후)
- [ ] 접근성 완전 검증 통과 (WCAG AA)

---

## 9. 참고 자료

### 디자인 레퍼런스
- 투자 인사이트 블로그 Footer (제공된 스크린샷)
- Medium.com Footer
- Dev.to Footer
- Vercel.com Footer

### 기술 문서
- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui Typography: https://ui.shadcn.com/docs/components/typography
- Lucide Icons: https://lucide.dev/
- Tailwind Grid: https://tailwindcss.com/docs/grid-template-columns

### 기존 컴포넌트 참고
- `components/site-header.tsx` - 구조 참고

---

## 10. 리스크 및 고려사항

### 리스크
- 카테고리가 너무 많을 경우 레이아웃 깨짐 → **해결**: 최대 10개 제한
- 소셜 링크 설정 파일 구조 변경 시 Footer 수정 필요 → **완화**: 타입 정의 필요
- `loadArticles()` 호출 시 성능 이슈 → **완화**: 클라이언트 사이드 캐싱

### 고려사항
- 소셜 링크 설정은 별도 PRD에서 먼저 구현 필요
- RSS/Sitemap 생성은 별도 PRD에서 먼저 구현 필요
- 카테고리 클릭 시 필터링 기능은 별도 작업
- `'use client'` 디렉티브 필요 (useState, useEffect 사용)

### 의존성
**이 작업 전에 완료되어야 할 항목:**
1. ✅ 소셜 링크 설정 구현 (`config/social.ts`) - 별도 PRD
2. ✅ RSS 피드 생성 (`/rss.xml`) - 별도 PRD
3. ✅ Sitemap 생성 (`/sitemap.xml`) - 별도 PRD

---

## 11. 구현 예시 코드 (참고)

### SiteFooter 컴포넌트
```tsx
// components/site-footer.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Instagram, Linkedin } from 'lucide-react';
import { loadArticles } from '@/lib/articles';
import { socialLinks } from '@/config/social';

export function SiteFooter() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadArticles().then(articles => {
      const allTags = articles.flatMap(a => a.tags);
      const uniqueTags = [...new Set(allTags)].sort();
      setCategories(uniqueTags.slice(0, 10));
    });
  }, []);

  return (
    <footer className="bg-muted/30 dark:bg-background border-t">
      <div className="container px-4 py-12">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Advenoh IT Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              기술 블로그, 프로그래밍, 개발 관련
              지식과 경험을 공유하는 개인 블로그입니다.
            </p>
            {/* 소셜 링크 */}
            <div className="flex gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* 중앙: 카테고리 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(tag => (
                <span
                  key={tag}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 오른쪽: 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">정보</h3>
            <div className="space-y-2">
              <a 
                href="/rss.xml" 
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                RSS
              </a>
              <a 
                href="/sitemap.xml" 
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                사이트맵
              </a>
              <Link 
                href="/series" 
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                시리즈
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Advenoh IT Blog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

### app/layout.tsx 수정
```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer'; // ✅ 추가

export const metadata: Metadata = {
  title: {
    default: 'Advenoh IT Blog',
    template: '%s | Advenoh IT Blog',
  },
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://advenoh.pe.kr',
    siteName: 'Advenoh IT Blog',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter /> {/* ✅ 교체 */}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 설정 파일 구조 (예상)
```typescript
// config/social.ts (별도 PRD에서 생성 예정)
import { Github, Instagram, Linkedin } from 'lucide-react';

export const socialLinks = [
  { 
    name: 'GitHub', 
    url: 'https://github.com/username', 
    icon: Github 
  },
  { 
    name: 'Instagram', 
    url: 'https://instagram.com/username', 
    icon: Instagram 
  },
  { 
    name: 'LinkedIn', 
    url: 'https://linkedin.com/in/username', 
    icon: Linkedin 
  },
];
```

---

## 12. 변경 이력

- 2025-01-XX: 초안 작성
- 2025-01-XX: 소셜 링크, RSS, Sitemap을 기존 구현 사용으로 변경
- 2025-01-XX: 사용자 답변 반영 최종 수정
  - Footer 위치: `app/layout.tsx` 40-46번 라인 확인
  - 블로그 설명 문구 확정
  - 로고 이미지 없음 확인 (텍스트만 사용)
  - About 페이지 제외
  - 컴포넌트 파일명: `site-footer.tsx` (site-header와 대칭)
