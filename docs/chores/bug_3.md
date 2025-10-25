# Bug #3: 헤더 텍스트 정렬 문제

## 문제 설명
헤더 내부의 텍스트가 메인 콘텐츠(body)보다 왼쪽으로 치우쳐 보입니다. 헤더의 "Frank's IT Blog", "홈", "시리즈" 링크와 검색 버튼이 body의 article 카드들과 시각적으로 정렬되지 않습니다.

## 원인 분석

### 현재 레이아웃 구조

1. **site-header.tsx (line 16)**
   ```tsx
   <div className="container flex h-14 items-center justify-between">
   ```
   - `container` 클래스만 사용
   - 좌우 패딩 없음

2. **page.tsx (line 16)**
   ```tsx
   <div className="container mx-auto px-4 py-8">
   ```
   - `container` + `mx-auto` + `px-4` (좌우 패딩 16px)
   - 추가 패딩으로 인해 콘텐츠 영역이 헤더보다 안쪽에 위치

3. **layout.tsx footer (line 41)**
   ```tsx
   <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
   ```
   - `container` 클래스만 사용
   - footer도 헤더와 동일한 정렬 문제 발생 가능

### Tailwind Container 기본 동작
- Tailwind의 기본 `container` 클래스는 `max-width`와 `mx-auto`를 자동 적용
- 하지만 **좌우 패딩은 기본적으로 포함하지 않음**
- `tailwind.config.ts`에 container 커스터마이징 없이 기본값 사용 중

## 해결 방안

### Option 1: site-header.tsx 수정 (추천)
헤더 컴포넌트에 `px-4` 또는 `px-6` 추가하여 body와 동일한 패딩 적용

**장점:**
- 간단하고 직접적인 수정
- 다른 컴포넌트에 영향 없음
- 빠른 해결 가능

**단점:**
- 각 컴포넌트마다 패딩을 개별 관리해야 함

### Option 2: tailwind.config.ts 전역 설정 (일관성)
`tailwind.config.ts`에서 container 기본 패딩 설정

**장점:**
- 전체 사이트에서 일관된 container 동작
- 모든 `container` 클래스가 자동으로 패딩 적용
- 유지보수 용이

**단점:**
- 기존 모든 container 적용 컴포넌트에 영향
- 예상치 못한 레이아웃 변경 가능성

### Option 3: 개별 컴포넌트별 클래스 통일
모든 컴포넌트에서 `container mx-auto px-4` 패턴 통일

**장점:**
- 명시적이고 명확한 스타일링
- 각 컴포넌트의 패딩을 세밀하게 제어 가능

**단점:**
- 반복적인 코드 작성 필요

## 구현 계획

### 1단계: 문제 재현 및 검증
- 개발 서버 실행 (`npm run dev`)
- 브라우저에서 헤더와 body 정렬 차이 확인
- 브라우저 개발자 도구로 container 패딩 확인

### 2단계: 수정 적용 (Option 1 추천)
- `components/site-header.tsx` 파일 수정
- 16번째 줄 `container` 클래스에 `px-4` 추가
  ```tsx
  // 수정 전
  <div className="container flex h-14 items-center justify-between">

  // 수정 후
  <div className="container px-4 flex h-14 items-center justify-between">
  ```

### 3단계: 반응형 대응 (선택)
모바일/태블릿/데스크톱에서 패딩을 다르게 적용하고 싶다면:
- `px-4 md:px-6 lg:px-8` 같은 반응형 클래스 고려
- body(page.tsx)도 동일한 반응형 패딩으로 통일

### 4단계: 테스트 및 검증
- 브라우저에서 헤더와 body 정렬 확인
- 모바일/태블릿/데스크톱 각 breakpoint 확인
- footer 정렬도 함께 확인
- 다크모드에서도 정상 작동 확인

### 5단계: 추가 일관성 체크
- footer도 동일한 패딩 적용 필요 여부 확인
- 다른 페이지들(`/series`, `/article/[slug]`)도 정렬 확인

## TODO

- [ ] 1단계: 현재 정렬 문제 브라우저에서 재현 확인
- [ ] 2단계: site-header.tsx에 `px-4` 추가
- [ ] 3단계: 변경 후 브라우저에서 시각적 검증
- [ ] 4단계: 모든 breakpoint에서 정렬 확인 (모바일, 태블릿, 데스크톱)
- [ ] 5단계: footer 정렬 확인 및 필요시 수정
- [ ] 6단계: 다른 페이지들(`/series`, `/article/[slug]`) 정렬 확인
- [ ] 7단계: Git 커밋 (예: `[#3] 헤더와 body 콘텐츠 정렬 통일`)

## 참고 파일
- `components/site-header.tsx` - 헤더 컴포넌트
- `app/page.tsx` - 메인 페이지 (body 콘텐츠)
- `app/layout.tsx` - 전체 레이아웃 및 footer
- `tailwind.config.ts` - Tailwind 설정

## 예상 수정 코드

```tsx
// components/site-header.tsx (line 16)

// 현재
<div className="container flex h-14 items-center justify-between">

// 수정안
<div className="container px-4 flex h-14 items-center justify-between">
```

## 검증 방법
1. `npm run dev` 실행
2. `http://localhost:3000` 접속
3. 브라우저 개발자 도구 열기 (F12)
4. 헤더의 "Frank's IT Blog" 텍스트와 아래 article 카드들의 왼쪽 여백 비교
5. 동일한 정렬선에 맞춰졌는지 확인
