# Footer 개선 작업 목록

> **참조**: [5_prd_footer.md](5_prd_footer.md) | [5_implementation_footer.md](5_implementation_footer.md)  
> **예상 총 시간**: 3-4시간

---

## 📋 작업 진행 상황

- [ ] Phase 1: 기본 구조 (1-2시간)
- [ ] Phase 2: 동적 콘텐츠 (1시간)
- [ ] Phase 3: 소셜 링크 연동 (30분)
- [ ] Phase 4: 테스트 및 최적화 (30분)

---

## Phase 1: 기본 구조 (1-2시간)

### 1.1 파일 생성 및 초기 설정

**예상 시간**: 10분

- [ ] `components/site-footer.tsx` 파일 생성
  ```bash
  touch components/site-footer.tsx
  ```
- [ ] 기본 컴포넌트 구조 작성
  - [ ] `'use client'` 디렉티브 추가
  - [ ] `export function SiteFooter()` 선언
  - [ ] 기본 JSX 구조 작성

**완료 기준**:
- 파일이 생성되고 기본 함수가 export됨
- 빌드 에러 없음

---

### 1.2 3단 레이아웃 구현

**예상 시간**: 30분

- [ ] Footer 컨테이너 구조 작성
  - [ ] `<footer>` 태그에 배경색 클래스 추가
    - Light: `bg-muted/30`
    - Dark: `dark:bg-background`
  - [ ] `border-t` 상단 경계선 추가
  
- [ ] 반응형 그리드 구현
  - [ ] `<div>` 컨테이너에 `container px-4 py-12` 클래스
  - [ ] Grid 레이아웃 설정
    - Mobile: `grid-cols-1`
    - Desktop: `md:grid-cols-3`
  - [ ] 간격 설정: `gap-8 md:gap-12`

- [ ] 3개 섹션 마크업 (임시 콘텐츠)
  - [ ] 왼쪽 섹션 (`space-y-4`)
  - [ ] 중앙 섹션 (`space-y-4`)
  - [ ] 오른쪽 섹션 (`space-y-4`)

**완료 기준**:
- Desktop(≥768px): 3단 가로 배치
- Mobile(<768px): 1단 세로 배치
- 다크모드 배경색 전환 확인

---

### 1.3 블로그 정보 섹션

**예상 시간**: 20분

- [ ] 왼쪽 섹션 구현
  - [ ] 제목 추가: "Advenoh IT Blog"
    - 클래스: `text-sm font-semibold`
  - [ ] 설명 문구 추가
    ```
    기술 블로그, 프로그래밍, 개발 관련
    지식과 경험을 공유하는 개인 블로그입니다.
    ```
    - 클래스: `text-sm text-muted-foreground leading-relaxed`
  - [ ] `<br />` 태그로 줄바꿈 처리

**완료 기준**:
- 타이틀과 설명이 올바르게 표시됨
- 다크모드에서 텍스트 색상 적절

---

### 1.4 저작권 정보 섹션

**예상 시간**: 10분

- [ ] 저작권 섹션 마크업
  - [ ] `<div>` 컨테이너 생성
    - 클래스: `mt-12 pt-8 border-t text-center text-sm text-muted-foreground`
  - [ ] 동적 연도 표시
    ```tsx
    © {new Date().getFullYear()} Advenoh IT Blog. All rights reserved.
    ```

**완료 기준**:
- 현재 연도가 동적으로 표시됨 (2025)
- 중앙 정렬 확인
- 상단 경계선 표시

---

### 1.5 layout.tsx 통합

**예상 시간**: 10분

- [ ] `app/layout.tsx` 파일 열기
- [ ] `SiteFooter` import 추가
  ```tsx
  import { SiteFooter } from '@/components/site-footer';
  ```
- [ ] 기존 Footer 제거 (40-46번 라인)
  - [ ] 기존 `<footer>` 태그 삭제
  - [ ] 모든 내부 콘텐츠 삭제
- [ ] `<SiteFooter />` 컴포넌트 추가
  - 위치: `<main>` 바로 아래

**완료 기준**:
- 기존 Footer 완전히 제거
- 새 SiteFooter 렌더링 확인
- 빌드 에러 없음

---

### 1.6 Phase 1 테스트

**예상 시간**: 20분

- [ ] 개발 서버 실행
  ```bash
  npm run dev
  ```
- [ ] 브라우저 확인 (`localhost:3000`)
  - [ ] Footer가 페이지 하단에 표시됨
  - [ ] 3단 레이아웃 (Desktop ≥768px)
  - [ ] 1단 레이아웃 (Mobile <768px)
  
- [ ] 다크모드 테스트
  - [ ] 테마 토글 클릭
  - [ ] 배경색 변경 확인
    - Light: 연한 회색
    - Dark: 어두운 배경
  
- [ ] 반응형 테스트
  - [ ] Chrome DevTools 열기 (F12)
  - [ ] 디바이스 모드 (Ctrl/Cmd + Shift + M)
  - [ ] 375px: 1단 세로 배치
  - [ ] 768px: 3단 가로 배치
  - [ ] 1024px: 3단 가로 배치

**완료 기준**:
- [ ] 모든 레이아웃 정상 동작
- [ ] 다크모드 전환 정상
- [ ] 저작권 연도 표시 (2025)

---

## Phase 2: 동적 콘텐츠 (1시간)

### 2.1 카테고리 동적 생성

**예상 시간**: 30분

- [ ] 필요한 import 추가
  ```tsx
  import { useState, useEffect } from 'react';
  import { loadArticles } from '@/lib/articles';
  ```

- [ ] State 선언
  ```tsx
  const [categories, setCategories] = useState<string[]>([]);
  ```

- [ ] `useEffect` 구현
  - [ ] `loadArticles()` 호출
  - [ ] 모든 article의 tags 추출
    ```tsx
    const allTags = articles.flatMap(a => a.tags);
    ```
  - [ ] 중복 제거 및 정렬
    ```tsx
    const uniqueTags = [...new Set(allTags)].sort();
    ```
  - [ ] 최대 10개로 제한
    ```tsx
    setCategories(uniqueTags.slice(0, 10));
    ```
  - [ ] 의존성 배열 빈 배열로 설정 (`[]`)

- [ ] 카테고리 렌더링
  - [ ] 중앙 섹션에 동적 렌더링
  - [ ] `categories.map()` 사용
  - [ ] 각 태그에 key prop 추가
  - [ ] 클래스: `text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors`
  - [ ] Loading 상태 처리
    ```tsx
    {categories.length > 0 ? (
      categories.map(...)
    ) : (
      <span>Loading...</span>
    )}
    ```

**완료 기준**:
- [ ] 카테고리 목록 자동 생성
- [ ] 최대 10개까지만 표시
- [ ] 알파벳 순 정렬 확인
- [ ] Hover 효과 동작

---

### 2.2 정보 섹션 링크 추가

**예상 시간**: 20분

- [ ] Next.js Link import
  ```tsx
  import Link from 'next/link';
  ```

- [ ] 오른쪽 섹션 구현
  - [ ] RSS 링크
    - [ ] `<a href="/rss.xml">`
    - [ ] 클래스: `block text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors`
  - [ ] Sitemap 링크
    - [ ] `<a href="/sitemap.xml">`
    - [ ] 동일 클래스 적용
  - [ ] Series 링크
    - [ ] `<Link href="/series">`
    - [ ] 동일 클래스 적용

**완료 기준**:
- [ ] RSS 링크 동작 (`/rss.xml`)
- [ ] Sitemap 링크 동작 (`/sitemap.xml`)
- [ ] Series 링크 동작 (`/series`)
- [ ] Hover 시 underline 표시

---

### 2.3 다크모드 스타일 조정

**예상 시간**: 10분

- [ ] 모든 섹션 다크모드 확인
  - [ ] 제목 색상: `text-foreground`
  - [ ] 본문 색상: `text-muted-foreground`
  - [ ] 링크 hover: `hover:text-foreground`

- [ ] 다크모드 테스트
  - [ ] 테마 토글 전환
  - [ ] 텍스트 가독성 확인
  - [ ] 링크 hover 효과 확인

**완료 기준**:
- [ ] 다크모드에서 모든 텍스트 가독성 확보
- [ ] Hover 효과 정상 동작

---

### 2.4 Phase 2 테스트

**예상 시간**: 10분

- [ ] 카테고리 테스트
  - [ ] 페이지 새로고침
  - [ ] 카테고리 목록 로딩 확인
  - [ ] 최대 10개까지만 표시 확인
  - [ ] Hover 효과 확인

- [ ] 정보 링크 테스트
  - [ ] RSS 링크 클릭 → `/rss.xml` 접근
  - [ ] Sitemap 링크 클릭 → `/sitemap.xml` 접근
  - [ ] Series 링크 클릭 → `/series` 페이지 이동

**완료 기준**:
- [ ] 카테고리 자동 생성 정상
- [ ] 모든 링크 정상 동작
- [ ] Hover 효과 정상

---

## Phase 3: 소셜 링크 연동 (30분)

### 3.1 소셜 링크 설정 확인

**예상 시간**: 5분

**전제 조건**: `config/social.ts` 파일 존재 확인

- [ ] `config/social.ts` 파일 존재 확인
  ```bash
  ls config/social.ts
  ```
- [ ] 파일 내용 확인
  - [ ] `socialLinks` export 확인
  - [ ] 각 링크 구조 확인 (name, url, icon)

**만약 파일이 없다면**:
- [ ] 별도 PRD 먼저 진행 (소셜 링크 설정)
- [ ] 또는 임시 더미 데이터 사용

---

### 3.2 소셜 링크 import 및 렌더링

**예상 시간**: 15분

- [ ] import 추가
  ```tsx
  import { socialLinks } from '@/config/social';
  ```

- [ ] 아이콘 import 추가 (필요시)
  ```tsx
  import { Github, Instagram, Linkedin } from 'lucide-react';
  ```

- [ ] 왼쪽 섹션에 소셜 링크 추가
  - [ ] `<div className="flex gap-4">` 컨테이너
  - [ ] `socialLinks.map()` 사용
  - [ ] 각 링크 렌더링
    - [ ] `key={link.name}`
    - [ ] `href={link.url}`
    - [ ] `target="_blank"`
    - [ ] `rel="noopener noreferrer"`
    - [ ] `aria-label={link.name}`
  - [ ] 아이콘 렌더링
    - [ ] `<link.icon className="w-5 h-5" />`

**완료 기준**:
- [ ] 소셜 아이콘 렌더링 (GitHub, Instagram, LinkedIn 등)
- [ ] 아이콘 크기 20px (w-5 h-5)
- [ ] 새 탭에서 열림

---

### 3.3 Hover 효과 및 접근성

**예상 시간**: 10분

- [ ] Hover 효과 추가
  - [ ] 클래스: `text-muted-foreground hover:text-foreground transition-colors`
  
- [ ] 접근성 설정
  - [ ] 각 링크에 `aria-label` 추가
  - [ ] `rel="noopener noreferrer"` 확인

- [ ] 테스트
  - [ ] 마우스 hover 시 색상 변경 확인
  - [ ] 새 탭에서 링크 열림 확인
  - [ ] 키보드 Tab으로 접근 가능 확인

**완료 기준**:
- [ ] Hover 효과 정상 동작
- [ ] 외부 링크 새 탭 열림
- [ ] aria-label 설정 완료

---

### 3.4 Phase 3 테스트

**예상 시간**: 5분

- [ ] 소셜 아이콘 렌더링 확인
  - [ ] GitHub 아이콘 표시
  - [ ] Instagram 아이콘 표시
  - [ ] LinkedIn 아이콘 표시
  
- [ ] 링크 동작 확인
  - [ ] 각 아이콘 클릭 → 새 탭 열림
  - [ ] 올바른 URL로 이동
  
- [ ] Hover 효과 확인
  - [ ] 마우스 올렸을 때 색상 변경
  - [ ] transition 애니메이션 확인

**완료 기준**:
- [ ] 모든 소셜 아이콘 정상 표시
- [ ] 링크 동작 정상
- [ ] Hover 효과 정상

---

## Phase 4: 테스트 및 최적화 (30분)

### 4.1 반응형 테스트

**예상 시간**: 10분

- [ ] Chrome DevTools 열기 (F12)
- [ ] 디바이스 모드 활성화 (Ctrl/Cmd + Shift + M)

- [ ] 375px (Mobile Small)
  - [ ] 1단 레이아웃 확인
  - [ ] 섹션 세로 배치 확인
  - [ ] 텍스트 가독성 확인
  - [ ] 소셜 아이콘 크기 적절
  
- [ ] 768px (Tablet)
  - [ ] 3단 레이아웃 전환 확인
  - [ ] 간격 적절 (gap-12)
  
- [ ] 1024px (Desktop)
  - [ ] 3단 레이아웃 유지
  - [ ] 전체 레이아웃 균형 확인
  
- [ ] 1440px (Large Desktop)
  - [ ] 레이아웃 정상
  - [ ] 중앙 정렬 확인

**완료 기준**:
- [ ] 모든 디바이스 크기에서 정상 동작
- [ ] 레이아웃 깨짐 없음
- [ ] 텍스트 가독성 확보

---

### 4.2 다크모드 테스트

**예상 시간**: 5분

- [ ] 라이트 모드 확인
  - [ ] 배경: `bg-muted/30` (연한 회색)
  - [ ] 텍스트: 충분한 대비
  - [ ] 링크 hover: 색상 변경
  
- [ ] 다크 모드 확인
  - [ ] 배경: `dark:bg-background` (어두운 배경)
  - [ ] 텍스트: 충분한 대비
  - [ ] 링크 hover: 색상 변경
  
- [ ] 전환 테스트
  - [ ] 테마 토글 클릭
  - [ ] 부드러운 전환 확인
  - [ ] 모든 요소 색상 변경 확인

**완료 기준**:
- [ ] 라이트/다크 모드 모두 정상
- [ ] 색상 대비 충분 (WCAG AA)
- [ ] 전환 애니메이션 자연스러움

---

### 4.3 접근성 검증

**예상 시간**: 10분

- [ ] 키보드 네비게이션 테스트
  - [ ] Tab 키로 모든 링크 접근
    - [ ] 소셜 링크1 → 소셜 링크2 → 소셜 링크3
    - [ ] RSS → Sitemap → Series
  - [ ] Enter 키로 링크 활성화
  - [ ] Focus 표시 확인 (outline 또는 ring)
  
- [ ] aria-label 확인
  - [ ] 모든 소셜 링크에 aria-label 설정
  - [ ] 브라우저 개발자 도구로 속성 확인
  
- [ ] 색상 대비 확인
  - [ ] Chrome DevTools → Lighthouse
  - [ ] Accessibility 점수 확인
  - [ ] 색상 대비 이슈 해결

**완료 기준**:
- [ ] 모든 링크 키보드 접근 가능
- [ ] aria-label 설정 완료
- [ ] 색상 대비 WCAG AA 준수

---

### 4.4 성능 최적화

**예상 시간**: 5분

- [ ] 리렌더링 확인
  - [ ] React DevTools Profiler 실행
  - [ ] 불필요한 리렌더링 체크
  - [ ] `useEffect` 의존성 배열 확인 (`[]`)
  
- [ ] `loadArticles()` 호출 확인
  - [ ] 콘솔에 로그 추가
    ```tsx
    console.log('Loading articles...');
    ```
  - [ ] 페이지 로드 시 1회만 호출 확인
  
- [ ] 빌드 테스트
  - [ ] `npm run build` 실행
  - [ ] 빌드 에러 없음 확인
  - [ ] 빌드 크기 확인

**완료 기준**:
- [ ] `loadArticles()` 1회만 호출
- [ ] 불필요한 리렌더링 없음
- [ ] 빌드 성공

---

### 4.5 최종 통합 테스트

**예상 시간**: 5분

- [ ] 전체 기능 테스트
  - [ ] 모든 링크 동작 확인
  - [ ] 반응형 레이아웃 확인
  - [ ] 다크모드 전환 확인
  - [ ] 카테고리 로딩 확인
  
- [ ] 브라우저 호환성 (선택)
  - [ ] Chrome: 정상
  - [ ] Firefox: 정상
  - [ ] Safari: 정상
  - [ ] Edge: 정상
  
- [ ] 코드 품질
  - [ ] `npm run check` (TypeScript)
  - [ ] Lint 에러 없음
  - [ ] 콘솔 경고 없음

**완료 기준**:
- [ ] 모든 기능 정상 동작
- [ ] 브라우저 호환성 확보
- [ ] 코드 품질 검증 통과

---

## ✅ 최종 완료 체크리스트

### 기능
- [ ] 3단 레이아웃 (Desktop ≥768px)
- [ ] 1단 레이아웃 (Mobile <768px)
- [ ] 블로그 정보 섹션 (타이틀 + 설명)
- [ ] 소셜 링크 아이콘 (GitHub, Instagram, LinkedIn)
- [ ] 카테고리 자동 생성 (최대 10개)
- [ ] 정보 링크 (RSS, Sitemap, Series)
- [ ] 저작권 정보 (동적 연도)

### 스타일
- [ ] 다크모드 배경색 (`bg-muted/30` / `dark:bg-background`)
- [ ] 링크 hover 효과 (`hover:text-foreground`)
- [ ] 아이콘 크기 (20px)
- [ ] 간격 (gap-8 → gap-12)
- [ ] 텍스트 가독성

### 접근성
- [ ] 키보드 네비게이션 (Tab, Enter)
- [ ] aria-label 설정 (모든 소셜 링크)
- [ ] Focus 표시
- [ ] 색상 대비 (WCAG AA)

### 성능
- [ ] `loadArticles()` 1회만 호출
- [ ] 불필요한 리렌더링 없음
- [ ] 빌드 성공 (`npm run build`)

### 코드 품질
- [ ] TypeScript 타입 에러 없음 (`npm run check`)
- [ ] Lint 에러 없음
- [ ] 콘솔 경고 없음
- [ ] 기존 Footer 제거 (`app/layout.tsx`)

---

## 🚨 블로커 및 의존성

### 의존성 확인 필요
- [ ] `config/social.ts` 파일 존재 (별도 PRD)
- [ ] `/rss.xml` 생성 완료 (별도 PRD)
- [ ] `/sitemap.xml` 생성 완료 (별도 PRD)

### 만약 의존성이 없다면
1. **임시 조치**: 더미 데이터 사용
   - 소셜 링크: `url: '#'`
   - RSS/Sitemap: 링크 비활성화 또는 숨김

2. **장기 조치**: 별도 PRD 먼저 진행
   - 소셜 링크 설정 PRD
   - RSS 생성 PRD
   - Sitemap 생성 PRD

---

## 📝 작업 완료 후

- [ ] Git commit
  ```bash
  git add .
  git commit -m "feat: Footer 개선 - 3단 레이아웃 및 동적 콘텐츠 추가"
  ```
- [ ] Pull Request 생성
- [ ] 리뷰 요청
- [ ] 배포

---

## 🔗 참고 문서

- [5_prd_footer.md](5_prd_footer.md) - 요구사항 정의
- [5_implementation_footer.md](5_implementation_footer.md) - 구현 가이드
