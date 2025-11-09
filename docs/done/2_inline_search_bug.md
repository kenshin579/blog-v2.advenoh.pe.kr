# 인라인 검색 창 입력 불가 버그 분석

## 문제 요약
메인 페이지의 인라인 검색 창을 클릭해도 텍스트 입력이 되지 않는 버그

## 영향 범위
- **파일**: [components/feature/inline-search-bar.tsx](../../components/feature/inline-search-bar.tsx)
- **컴포넌트**: `InlineSearchBar`
- **영향**: 사용자가 검색 기능을 전혀 사용할 수 없음 (Critical)

## 근본 원인

### 1. Popover 구조 문제 (Line 65-78)

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="기술 블로그 글 검색..."
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}  // ⚠️ 문제 지점
        className="pl-10 w-full transition-shadow duration-200 focus-visible:shadow-md"
      />
    </div>
  </PopoverTrigger>
  {/* ... PopoverContent ... */}
</Popover>
```

**문제점:**
1. **PopoverTrigger**가 Input을 포함한 `div`를 감싸고 있음
2. **PopoverTrigger**는 Radix UI 컴포넌트로, 기본적으로 클릭/포커스 이벤트를 가로채서 Popover 열림/닫힘을 제어
3. Input의 `onFocus`가 `setOpen(true)`를 호출하지만, PopoverTrigger의 이벤트 핸들링과 충돌

### 2. 이벤트 전파 충돌

**정상적인 흐름이어야 할 것:**
1. 사용자가 Input 클릭
2. Input에 포커스 → `onFocus` 실행 → `setOpen(true)`
3. Popover 열림
4. 사용자가 텍스트 입력 → `onChange` 실행 → 검색 실행

**실제 발생하는 문제:**
1. 사용자가 Input 클릭
2. **PopoverTrigger가 클릭 이벤트를 가로챔**
3. Popover는 열리지만, Input의 포커스 상태가 불안정
4. Input이 제대로 포커스를 받지 못하거나, 이벤트가 차단됨
5. **텍스트 입력이 불가능**

### 3. PopoverTrigger의 동작 방식

Radix UI의 `PopoverTrigger asChild`는:
- 자식 요소를 트리거로 변환
- 클릭, 포커스 등의 이벤트를 가로채서 Popover 제어
- **문제**: Input 같은 인터랙티브 요소를 트리거로 사용하면 기본 동작(텍스트 입력)과 충돌

## 비교: 정상 작동하는 SearchDialog

[components/search-dialog.tsx](../../components/search-dialog.tsx)는 문제가 없음:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex col">
    {/* ... */}
    <Input
      placeholder="검색어를 입력하세요... (⌘K)"
      value={query}
      onChange={(e) => handleSearch(e.target.value)}
      className="pl-10"
      autoFocus  // ✅ 정상 작동
    />
    {/* ... */}
  </DialogContent>
</Dialog>
```

**차이점:**
- Dialog는 `DialogTrigger`를 사용하지 않음
- Input이 DialogContent 내부에 직접 배치
- 키보드 단축키(⌘K)로 Dialog 열림 제어
- **Input의 기본 동작이 방해받지 않음**

## 해결 방안

### Option 1: Controlled Popover (추천)
PopoverTrigger를 제거하고 완전히 수동으로 Popover 제어:

```tsx
<div className="relative w-full max-w-2xl mx-auto">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    type="text"
    placeholder="기술 블로그 글 검색..."
    value={query}
    onChange={handleChange}
    onFocus={() => setOpen(true)}
    className="pl-10 w-full transition-shadow duration-200 focus-visible:shadow-md"
  />

  <Popover open={open} onOpenChange={setOpen}>
    <PopoverContent>
      {/* 검색 결과 */}
    </PopoverContent>
  </Popover>
</div>
```

**장점:**
- Input의 기본 동작이 보장됨
- 이벤트 충돌 없음

**단점:**
- Popover 위치를 수동으로 조정해야 할 수 있음

### Option 2: SearchDialog 방식 사용
InlineSearchBar를 제거하고 SearchDialog로 통합:

```tsx
// Header에서
<Button onClick={() => setSearchOpen(true)}>
  <Search className="h-4 w-4" />
</Button>

<SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
```

**장점:**
- 이미 검증된 안정적인 구현
- 일관된 사용자 경험

**단점:**
- 인라인 검색 경험 제거 (디자인 변경 필요)

### Option 3: Click-to-Open 방식
Input을 읽기 전용으로 만들고, 클릭 시 Dialog 열기:

```tsx
<Input
  type="text"
  placeholder="기술 블로그 글 검색..."
  value=""
  readOnly
  onClick={() => setSearchDialogOpen(true)}
  className="pl-10 w-full cursor-pointer"
/>

<SearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
```

**장점:**
- 단순하고 안정적
- SearchDialog 재사용

**단점:**
- 인라인 검색 경험 제거

## 권장 사항

**Option 1 (Controlled Popover)** 추천:
1. PopoverTrigger 제거
2. Popover를 수동으로 제어
3. Input의 onFocus/onBlur로 open 상태 관리
4. PopoverContent의 위치를 Input 기준으로 조정

이 방식이 인라인 검색 UX를 유지하면서도 버그를 해결하는 가장 적절한 방법입니다.

## 재현 단계

1. 메인 페이지 접속
2. 상단 검색 창 클릭
3. 키보드로 텍스트 입력 시도
4. **버그**: 텍스트가 입력되지 않음

## 추가 조사 필요 사항

- [ ] Popover의 `modal` 속성이 Input 포커스에 영향을 주는지 확인
- [ ] Radix UI Popover의 버전별 동작 차이 확인
- [ ] 다른 브라우저에서도 동일한 문제가 발생하는지 테스트
