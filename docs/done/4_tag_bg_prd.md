# PRD: 태그 배경색 Grey 스타일 적용

## 1. 개요

**목표**: 블로그 게시글의 태그(#tag)에 grey 배경색을 추가하여 가독성과 시각적 구분성 향상

**현재 상태**:
- 태그는 `Badge` 컴포넌트의 `variant="outline"` 사용
- border만 있고 배경색이 없는 상태
- Light mode: `rgba(0,0,0, .05)` border
- Dark mode: `rgba(255,255,255, .05)` border

**변경 후**:
- 태그에 light grey 배경 추가
- Light/Dark mode 모두 대응
- 기존 border 유지 또는 조정

## 2. 영향받는 파일 및 컴포넌트

### 2.1 태그 표시 위치
1. **아티클 상세 페이지** (app/[slug]/page.tsx:108-116)
   ```tsx
   {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
     <div className="flex flex-wrap gap-2">
       {article.frontmatter.tags.map((tag) => (
         <Badge key={tag} variant="outline">
           #{tag}
         </Badge>
       ))}
     </div>
   )}
   ```

2. **관련 글 카드** (app/[slug]/page.tsx:195-209)
   ```tsx
   {related.tags && related.tags.length > 0 && (
     <CardContent>
       <div className="flex flex-wrap gap-2">
         {related.tags.slice(0, 3).map((tag) => (
           <Badge key={tag} variant="outline" className="text-xs">
             #{tag}
           </Badge>
         ))}
       </div>
     </CardContent>
   )}
   ```

3. **홈 페이지 아티클 카드** (components/home-content.tsx:151-166)
   ```tsx
   {article.tags && article.tags.length > 0 && (
     <CardContent>
       <div className="flex flex-wrap gap-2">
         {article.tags.slice(0, 3).map((tag) => (
           <Badge key={tag} variant="outline" className="text-xs">
             #{tag}
           </Badge>
         ))}
       </div>
     </CardContent>
   )}
   ```

### 2.2 Badge 컴포넌트
- **파일**: components/ui/badge.tsx
- **현재 variants**: default, secondary, destructive, outline
- **outline variant 현재 스타일**:
  ```tsx
  outline: " border [border-color:var(--badge-outline)] shadow-xs"
  ```

### 2.3 스타일 설정 파일
- **CSS 변수**: app/globals.css
  - Line 8: `--badge-outline: rgba(0,0,0, .05);` (Light mode)
  - Line 127: `--badge-outline: rgba(255,255,255, .05);` (Dark mode)

## 3. 구현 방안

### 방안 1: outline variant 수정 (✅ 선택)
**장점**: 기존 코드 변경 최소화
**수정 파일**: `components/ui/badge.tsx`, `app/globals.css` (2개)
**예상 시간**: 30분

### 방안 2: 새로운 variant 추가
**장점**: 의미론적으로 명확
**수정 파일**: badge.tsx, globals.css, page.tsx, home-content.tsx (5개)
**예상 시간**: 1시간

**결정**: 방안 1 선택 (코드 변경 최소화)

## 4. 구현 상세

구현 상세 내용은 [4_tag_bg_implementation.md](./4_tag_bg_implementation.md) 참조

## 5. 작업 체크리스트

작업 단계별 체크리스트는 [4_tag_bg_todo.md](./4_tag_bg_todo.md) 참조

## 6. 승인 및 구현

**작성자**: Claude Code
**작성일**: 2025-11-01
**우선순위**: Medium
**승인 상태**: 대기중
