# Implementation: 태그 배경색 Grey 스타일 적용

## 구현 방안

**선택한 방안**: 방안 1 - outline variant 수정
- 기존 코드 변경 최소화
- 2개 파일만 수정 (badge.tsx, globals.css)

## 구현 상세

### 1. CSS 변수 추가 (app/globals.css)

**Light Mode** (`:root` 섹션에 추가):
```css
:root {
  /* 기존 변수들... */

  /* Tag badge 배경색 */
  --tag-bg: 0 0% 94%;  /* Light grey background */
}
```

**Dark Mode** (`.dark` 섹션에 추가):
```css
.dark {
  /* 기존 변수들... */

  /* Tag badge 배경색 */
  --tag-bg: 217 33% 18%;  /* Dark grey background */
}
```

### 2. Badge 컴포넌트 수정 (components/ui/badge.tsx)

**현재 outline variant**:
```tsx
outline: " border [border-color:var(--badge-outline)] shadow-xs"
```

**수정 후**:
```tsx
outline: "border [border-color:var(--badge-outline)] bg-[hsl(var(--tag-bg))] shadow-xs"
```

## 파일별 변경사항

### app/globals.css

**추가 위치 1**: Line 8 근처 (`:root` 섹션)
```css
:root {
  --button-outline: rgba(0,0,0, .10);
  --badge-outline: rgba(0,0,0, .05);
  --tag-bg: 0 0% 94%;  /* 추가 */

  /* ... 나머지 변수들 */
}
```

**추가 위치 2**: Line 127 근처 (`.dark` 섹션)
```css
.dark {
  --button-outline: rgba(255,255,255, .10);
  --badge-outline: rgba(255,255,255, .05);
  --tag-bg: 217 33% 18%;  /* 추가 */

  /* ... 나머지 변수들 */
}
```

### components/ui/badge.tsx

**수정 위치**: Line 19 (badgeVariants 내부)
```tsx
const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",

        // 수정: 배경색 추가
        outline: "border [border-color:var(--badge-outline)] bg-[hsl(var(--tag-bg))] shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
```

## 적용 효과

**변경 전**:
```
┌─────────────┐
│   #java     │  ← border만 있음
└─────────────┘
```

**변경 후**:
```
┌─────────────┐
│░░░#java░░░░│  ← grey 배경 추가
└─────────────┘
```

## 색상 선택 근거

### Light Mode: `0 0% 94%`
- 기존 `--muted` (210 40% 96%)보다 약간 어두운 회색
- 흰색 배경에서 명확히 구분되면서도 눈에 부담 없음
- 기존 secondary variant와 구분

### Dark Mode: `217 33% 18%`
- 기존 `--muted` (217 33% 17%)보다 약간 밝은 회색
- 어두운 배경에서 태그가 돋보이면서도 과하지 않음
- 일관된 hue/saturation으로 디자인 통일성 유지

## 접근성 확인

**대비율 계산** (WCAG AA 기준: 4.5:1 이상):
- Light mode: 검은 텍스트 (222 47% 11%) on grey bg (0 0% 94%) → 약 12:1 ✅
- Dark mode: 흰 텍스트 (210 40% 98%) on grey bg (217 33% 18%) → 약 13:1 ✅

## 영향 범위

**자동 적용되는 위치** (variant="outline" 사용):
1. 아티클 상세 페이지 헤더 태그
2. 관련 글 카드 태그
3. 홈 페이지 아티클 카드 태그

**영향 없는 위치**:
- Category Badge (variant="secondary")
- 기타 default/destructive variant 사용 Badge
