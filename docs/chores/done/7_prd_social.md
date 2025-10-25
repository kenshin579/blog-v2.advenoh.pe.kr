# PRD: 헤더에 GitHub 소셜 링크 추가

## 개요
헤더의 소셜 링크 섹션에 GitHub 링크를 추가하여 사용자가 프로필을 쉽게 방문할 수 있도록 함

## 배경
- 현재 헤더에는 LinkedIn, Instagram, 투자 블로그 3개의 소셜 링크가 있음
- GitHub 프로필을 노출하여 개발 활동 및 오픈소스 기여를 공유할 필요
- GitHub: https://github.com/kenshin579

## 목표
헤더의 소셜 링크 섹션에 GitHub 아이콘 및 링크를 추가

## 현재 시스템 구조

### 관련 파일
1. **`lib/site-config.ts`** - 소셜 링크 설정 관리
   - `socialLinks` 배열에 모든 소셜 링크 정의
   - 각 링크: name, url, icon, ariaLabel

2. **`components/social-links.tsx`** - 소셜 링크 렌더링 컴포넌트
   - lucide-react 아이콘 라이브러리 사용
   - `iconMap` 객체에 아이콘 매핑
   - 현재 아이콘: Linkedin, Instagram, TrendingUp

3. **`components/site-header.tsx`** - 헤더 컴포넌트
   - `<SocialLinks />` 컴포넌트 포함

### 현재 소셜 링크 목록
```typescript
[
  { name: 'LinkedIn', url: '...', icon: 'Linkedin', ariaLabel: 'LinkedIn 프로필 방문' },
  { name: 'Instagram', url: '...', icon: 'Instagram', ariaLabel: 'Instagram 프로필 방문' },
  { name: 'Blog', url: '...', icon: 'TrendingUp', ariaLabel: '투자 블로그 방문' }
]
```

## 필요한 작업

### 1. lib/site-config.ts 수정
**목적**: GitHub 링크 추가

**변경 사항**:
```typescript
{
  name: 'GitHub',
  url: 'https://github.com/kenshin579',
  icon: 'Github',
  ariaLabel: 'GitHub 프로필 방문'
}
```

**추가 위치**:
- LinkedIn 다음에 추가 (개발 관련 링크를 앞쪽에 배치)
- 최종 순서: LinkedIn → GitHub → Instagram → Blog

### 2. components/social-links.tsx 수정
**목적**: Github 아이콘 매핑 추가

**변경 사항**:
1. lucide-react에서 `Github` 아이콘 import 추가
   ```typescript
   import { Linkedin, Instagram, TrendingUp, Github } from 'lucide-react';
   ```

2. iconMap에 Github 추가
   ```typescript
   const iconMap: Record<string, LucideIcon> = {
     Linkedin,
     Instagram,
     TrendingUp,
     Github,  // 추가
   };
   ```

## 기술 스택
- **아이콘 라이브러리**: lucide-react (이미 설치됨)
- **컴포넌트**: shadcn/ui Button 컴포넌트 활용
- **스타일링**: Tailwind CSS

## 예상 결과
- 헤더 우측 상단에 GitHub 아이콘 버튼 표시
- 클릭 시 https://github.com/kenshin579 새 탭으로 열림
- 접근성: "GitHub 프로필 방문" 라벨 제공
- 기존 소셜 링크들과 동일한 스타일 및 hover 효과

## 검증 기준
- [ ] GitHub 아이콘이 헤더에 정상 표시됨
- [ ] 아이콘 클릭 시 올바른 URL로 이동 (새 탭)
- [ ] 아이콘 hover 시 기존 링크들과 동일한 효과
- [ ] 반응형 디자인 유지 (모바일/데스크톱)
- [ ] 접근성 라벨 정상 작동

## 리스크 및 고려사항
- **리스크**: 없음 (기존 패턴 재사용, 단순 추가)
- **의존성**: lucide-react의 `Github` 아이콘 존재 확인 필요 (일반적으로 제공됨)

## 참고사항
- 기존 PR #10에서 TrendingUp 아이콘 관련 작업 있었음
- 일관된 패턴 유지: site-config.ts에서 데이터 관리, social-links.tsx에서 렌더링
