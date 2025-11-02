# TOC 스크롤 연동 활성화 구현

## 구현 방법: Intersection Observer API

### 수정 파일
`components/article/table-of-contents.tsx`

### 구현 상세

#### 1. State 추가
```typescript
const [activeId, setActiveId] = useState<string | null>(null);
```

#### 2. Intersection Observer 설정
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    },
    {
      rootMargin: '-20% 0px -35% 0px', // viewport 상단 20% 영역에서 감지
      threshold: 1.0,
    }
  );

  // 모든 h2, h3 요소 관찰
  items.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element) {
      observer.observe(element);
    }
  });

  // cleanup
  return () => {
    observer.disconnect();
  };
}, [items]);
```

#### 3. Active 스타일링 적용
```typescript
<a
  href={`#${item.id}`}
  className={cn(
    "hover:text-primary transition-colors block py-1",
    activeId === item.id && "text-primary font-semibold border-l-2 border-primary pl-3"
  )}
  aria-current={activeId === item.id ? "location" : undefined}
>
  {item.text}
</a>
```

### 기술적 설명

#### Intersection Observer 설정값
- **rootMargin**: `-20% 0px -35% 0px`
  - 상단 20% 영역을 감지 기준으로 설정
  - 사용자가 헤딩을 읽기 시작할 때 활성화
- **threshold**: 1.0
  - 요소가 완전히 진입해야 감지

#### Active 스타일
- `text-primary`: 테마 색상으로 강조
- `font-semibold`: 글꼴 굵기 증가
- `border-l-2 border-primary`: 좌측 보더로 시각적 표시
- `pl-3`: 보더로 인한 레이아웃 시프트 보정
- `transition-colors`: 부드러운 색상 전환

#### 접근성
- `aria-current="location"`: 스크린 리더에 현재 위치 전달
- 키보드 네비게이션: 기존 동작 유지

### 동작 흐름
1. 컴포넌트 마운트 시 Intersection Observer 생성
2. 모든 TOC item의 heading 요소 관찰 시작
3. 사용자 스크롤 → viewport 내 heading 감지
4. `isIntersecting` 콜백 → `setActiveId()` 호출
5. activeId 변경 → 해당 TOC 항목 스타일 업데이트
6. 컴포넌트 언마운트 시 observer 정리

### 성능 고려사항
- Intersection Observer는 브라우저 네이티브 API로 효율적
- 스크롤 이벤트 리스너 대비 메인 스레드 부하 감소
- 큰 문서(50+ 헤딩)에서도 부드러운 동작 보장
