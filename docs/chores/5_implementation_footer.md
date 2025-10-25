# Footer 개선 구현 가이드

> **참조**: [5_prd_footer.md](5_prd_footer.md)  
> **작업 목록**: [5_todo_footer.md](5_todo_footer.md)

---

## 1. 기술 스택

### 프레임워크 및 라이브러리
- **Next.js 15** (App Router)
- **React 18** (Hooks: useState, useEffect)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (컴포넌트 디자인 시스템)
- **Lucide React** (아이콘)

### 프로젝트 구조
```
blog-v2.advenoh.pe.kr/
├── app/
│   └── layout.tsx              # Footer 통합 위치
├── components/
│   ├── site-header.tsx         # 참고용 (구조 유사)
│   └── site-footer.tsx         # ✅ 신규 생성
├── config/
│   └── social.ts               # ✅ 소셜 링크 설정 (별도 PRD)
├── lib/
│   └── articles.ts             # loadArticles() 함수
└── public/
    ├── rss.xml                 # RSS 피드 (별도 PRD)
    └── sitemap.xml             # Sitemap (별도 PRD)
```

---

## 2. Phase별 구현 가이드

### Phase 1: 기본 구조 (1-2시간)

#### 1.1 파일 생성
```bash
# 컴포넌트 파일 생성
touch components/site-footer.tsx
```

#### 1.2 기본 컴포넌트 구조

```tsx
// components/site-footer.tsx
'use client';

export function SiteFooter() {
  return (
    <footer className="bg-muted/30 dark:bg-background border-t">
      <div className="container px-4 py-12">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Advenoh IT Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              기술 블로그, 프로그래밍, 개발 관련<br />
              지식과 경험을 공유하는 개인 블로그입니다.
            </p>
          </div>

          {/* 중앙: 카테고리 (임시) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>

          {/* 오른쪽: 정보 (임시) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">정보</h3>
            <div className="space-y-2">
              <span className="block text-sm text-muted-foreground">Links...</span>
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

#### 1.3 layout.tsx 통합

**Before** (`app/layout.tsx` 40-46번 라인 제거):
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
// app/layout.tsx
import { SiteFooter } from '@/components/site-footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter /> {/* ✅ 추가 */}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 1.4 Phase 1 테스트
```bash
npm run dev
```

**확인 사항**:
- [ ] Footer가 페이지 하단에 표시됨
- [ ] 3단 레이아웃 (Desktop) 확인
- [ ] 1단 레이아웃 (Mobile) 확인
- [ ] 다크모드 전환 시 배경색 변경 확인
- [ ] 저작권 정보에 현재 연도 표시

---

### Phase 2: 동적 콘텐츠 (1시간)

#### 2.1 카테고리 동적 생성

```tsx
// components/site-footer.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadArticles } from '@/lib/articles';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Advenoh IT Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              기술 블로그, 프로그래밍, 개발 관련<br />
              지식과 경험을 공유하는 개인 블로그입니다.
            </p>
          </div>

          {/* 중앙: 카테고리 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map(tag => (
                  <span
                    key={tag}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Loading...</span>
              )}
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

#### 2.2 Phase 2 테스트

**확인 사항**:
- [ ] 카테고리 목록 자동 생성 (최대 10개)
- [ ] RSS 링크 동작 (`/rss.xml`)
- [ ] Sitemap 링크 동작 (`/sitemap.xml`)
- [ ] 시리즈 링크 동작 (`/series`)
- [ ] Hover 효과 확인 (링크, 카테고리)

---

### Phase 3: 소셜 링크 연동 (30분)

#### 3.1 소셜 링크 설정 import

**전제 조건**: `config/social.ts` 파일이 별도 PRD로 생성되어 있어야 함

```typescript
// config/social.ts (예상 구조)
import { Github, Instagram, Linkedin } from 'lucide-react';

export const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/username', icon: Github },
  { name: 'Instagram', url: 'https://instagram.com/username', icon: Instagram },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/username', icon: Linkedin },
];
```

#### 3.2 소셜 링크 렌더링

```tsx
// components/site-footer.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadArticles } from '@/lib/articles';
import { socialLinks } from '@/config/social'; // ✅ import

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* 왼쪽: 블로그 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Advenoh IT Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              기술 블로그, 프로그래밍, 개발 관련<br />
              지식과 경험을 공유하는 개인 블로그입니다.
            </p>
            
            {/* ✅ 소셜 링크 */}
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
              {categories.length > 0 ? (
                categories.map(tag => (
                  <span
                    key={tag}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Loading...</span>
              )}
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

#### 3.3 Phase 3 테스트

**확인 사항**:
- [ ] 소셜 아이콘 렌더링 (GitHub, Instagram, LinkedIn)
- [ ] 아이콘 크기 확인 (20px)
- [ ] Hover 효과 (색상 변경)
- [ ] 새 탭에서 열림 (`target="_blank"`)
- [ ] `aria-label` 접근성 확인

---

### Phase 4: 테스트 및 최적화 (30분)

#### 4.1 반응형 테스트

**테스트 디바이스 크기**:
```bash
# Chrome DevTools에서 테스트
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px, 1440px
```

**확인 사항**:
- [ ] 375px: 1단 레이아웃, 세로 배치
- [ ] 768px: 3단 레이아웃, 가로 배치
- [ ] 섹션 간격 적절 (gap-8 → gap-12)
- [ ] 텍스트 가독성

#### 4.2 다크모드 테스트

**테스트 방법**:
```typescript
// 브라우저 콘솔 또는 UI 토글 사용
// 또는 시스템 설정 변경
```

**확인 사항**:
- [ ] Light mode: `bg-muted/30` (연한 회색)
- [ ] Dark mode: `bg-background` (어두운 배경)
- [ ] 텍스트 색상 대비 충분
- [ ] 링크 hover 효과 확인

#### 4.3 접근성 검증

**키보드 네비게이션**:
```
Tab → 소셜 링크1 → 소셜 링크2 → ... → RSS → Sitemap → Series
```

**확인 사항**:
- [ ] Tab으로 모든 링크 접근 가능
- [ ] Enter로 링크 활성화
- [ ] Focus 표시 (outline 또는 ring)
- [ ] `aria-label` 설정 확인

**스크린리더 테스트** (선택):
```bash
# macOS VoiceOver
Cmd + F5
```

#### 4.4 성능 최적화

**리렌더링 방지**:
```tsx
// useEffect 의존성 배열 확인
useEffect(() => {
  loadArticles().then(articles => {
    // ...
  });
}, []); // ✅ 빈 배열 = 마운트 시 1회만 실행
```

**캐싱 확인**:
```typescript
// lib/articles.ts에서 캐싱 확인
// loadArticles()가 중복 호출되지 않는지 확인
```

---

## 3. 최종 완성 코드

### 3.1 SiteFooter 컴포넌트

```tsx
// components/site-footer.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
              기술 블로그, 프로그래밍, 개발 관련<br />
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
              {categories.length > 0 ? (
                categories.map(tag => (
                  <span
                    key={tag}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Loading...</span>
              )}
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

### 3.2 layout.tsx 수정

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

---

## 4. 트러블슈팅

### 4.1 카테고리 로딩되지 않음

**증상**: "Loading..." 계속 표시

**원인**:
- `loadArticles()` import 경로 오류
- articles 데이터 구조 변경

**해결**:
```tsx
// 1. import 경로 확인
import { loadArticles } from '@/lib/articles'; // ✅

// 2. 콘솔 디버깅
useEffect(() => {
  loadArticles().then(articles => {
    console.log('Articles loaded:', articles.length); // 디버깅
    const allTags = articles.flatMap(a => a.tags);
    console.log('All tags:', allTags); // 디버깅
    // ...
  });
}, []);
```

### 4.2 소셜 링크 import 오류

**증상**: `Cannot find module '@/config/social'`

**원인**: `config/social.ts` 파일 미생성

**해결**:
1. 별도 PRD로 `config/social.ts` 먼저 생성
2. 임시로 더미 데이터 사용:
```tsx
// components/site-footer.tsx (임시)
const socialLinks = [
  { name: 'GitHub', url: '#', icon: Github },
  { name: 'Instagram', url: '#', icon: Instagram },
];
```

### 4.3 다크모드 배경색 안 바뀜

**증상**: 다크모드에서도 라이트 배경색 유지

**원인**: Tailwind `dark:` 클래스 미적용

**해결**:
```tsx
// ❌ 잘못된 코드
<footer className="bg-muted/30">

// ✅ 올바른 코드
<footer className="bg-muted/30 dark:bg-background">
```

### 4.4 모바일에서 레이아웃 안 깨짐

**증상**: 모바일에서도 3단 유지

**원인**: 반응형 클래스 누락

**해결**:
```tsx
// ❌ 잘못된 코드
<div className="grid grid-cols-3">

// ✅ 올바른 코드
<div className="grid grid-cols-1 md:grid-cols-3">
```

---

## 5. 배포 전 체크리스트

### 5.1 기능 테스트
- [ ] 3단 레이아웃 (Desktop ≥768px)
- [ ] 1단 레이아웃 (Mobile <768px)
- [ ] 카테고리 자동 생성 (최대 10개)
- [ ] 소셜 링크 새 탭 열림
- [ ] RSS/Sitemap/Series 링크 동작
- [ ] 저작권 연도 동적 표시

### 5.2 스타일 테스트
- [ ] 다크모드 배경색
- [ ] 링크 hover 효과
- [ ] 아이콘 크기 (20px)
- [ ] 간격 (gap, padding, margin)
- [ ] 텍스트 가독성

### 5.3 접근성 테스트
- [ ] 키보드 네비게이션 (Tab, Enter)
- [ ] aria-label 설정
- [ ] Focus 표시
- [ ] 색상 대비 (WCAG AA)

### 5.4 성능 테스트
- [ ] `loadArticles()` 1회만 호출
- [ ] 불필요한 리렌더링 없음
- [ ] 빌드 에러 없음 (`npm run build`)

### 5.5 코드 품질
- [ ] TypeScript 타입 에러 없음 (`npm run check`)
- [ ] Lint 에러 없음
- [ ] 코드 주석 적절

---

## 6. 참고 자료

### 문서
- [5_prd_footer.md](5_prd_footer.md) - 요구사항 정의
- [5_todo_footer.md](5_todo_footer.md) - 작업 목록

### 기술 문서
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns)
- [Lucide React Icons](https://lucide.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)

### 기존 코드 참고
- `components/site-header.tsx` - 컴포넌트 구조
- `lib/articles.ts` - 데이터 로딩 패턴
- `app/layout.tsx` - 레이아웃 통합 방식
