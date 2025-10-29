# TOC 스크롤 연동 활성화 구현 TODO

## 단계 1: TableOfContents 컴포넌트 수정
- [ ] `components/article/table-of-contents.tsx` 파일 열기
- [ ] React import에 `useState`, `useEffect` 추가
```typescript
import { useState, useEffect } from 'react';
```
- [ ] `activeId` state 추가
```typescript
const [activeId, setActiveId] = useState<string | null>(null);
```
- [ ] `useEffect` 내에 Intersection Observer 구현
  - [ ] IntersectionObserver 생성 (rootMargin: `-20% 0px -35% 0px`, threshold: 1.0)
  - [ ] 모든 TOC item의 heading 요소 관찰 시작
  - [ ] `isIntersecting` 콜백에서 `setActiveId()` 호출
  - [ ] cleanup 함수로 `observer.disconnect()` 추가
- [ ] Active 스타일링 적용
  - [ ] `className`에 조건부 스타일 추가: `activeId === item.id && "text-primary font-semibold border-l-2 border-primary pl-3"`
  - [ ] `aria-current` 속성 추가: `activeId === item.id ? "location" : undefined`
- [ ] 파일 저장

## 단계 2: 기능 테스트
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 임의의 article 페이지 접속 (긴 문서 선택)
- [ ] 페이지 로드 시 첫 번째 TOC 항목 활성화 확인
- [ ] 스크롤 다운: 각 섹션 통과 시 TOC 항목 변경 확인
- [ ] 스크롤 업: 역방향 스크롤에서도 정상 동작 확인
- [ ] TOC 클릭: 클릭 시 스크롤 이동 + 활성화 확인

## 단계 3: 반응형 테스트
- [ ] 데스크톱 (lg 이상): 사이드바 TOC에서 정상 동작 확인
- [ ] 모바일 (lg 미만): 상단 TOC에서 정상 동작 확인

## 단계 4: 다크 모드 테스트
- [ ] 라이트 모드에서 active 항목 색상 대비 확인
- [ ] 다크 모드로 전환 후 active 항목 색상 대비 확인

## 단계 5: 성능 테스트
- [ ] 긴 문서 (50+ 헤딩): 부드러운 스크롤 확인
- [ ] 빠른 스크롤: 중간 섹션 건너뛰지 않는지 확인
- [ ] 페이지 이동 후 다시 돌아오기: 메모리 누수 확인

## 단계 6: 브라우저 테스트
- [ ] Chrome/Edge에서 정상 동작 확인
- [ ] Firefox에서 정상 동작 확인
- [ ] Safari에서 정상 동작 확인 (가능한 경우)

## 단계 7: 접근성 테스트
- [ ] 키보드 네비게이션: Tab/Enter 키로 TOC 탐색 가능한지 확인
- [ ] 포커스 표시: active 항목 포커스 가시성 확인

## 단계 8: 빌드 및 배포
- [ ] 타입 체크 (`npm run check`)
- [ ] 프로덕션 빌드 (`npm run build`)
- [ ] 빌드 에러 없는지 확인
- [ ] 배포 (Netlify 자동 배포)
