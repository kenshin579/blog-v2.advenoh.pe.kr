# TODO: 헤더 소셜 링크 추가

## Phase 1: 기본 구현 ⚡

### 1.1 소셜 링크 설정 파일 생성
- [ ] `lib/site-config.ts` 파일 생성
  - [ ] SocialLink 인터페이스 정의
  - [ ] socialLinks 배열 정의 (LinkedIn, Instagram, Blog)
  - [ ] 실제 URL 사용:
    - LinkedIn: https://www.linkedin.com/in/frank-oh-abb80b10/
    - Instagram: https://www.instagram.com/frank.photosnap
    - Blog: https://investment.advenoh.pe.kr/
  - [ ] TypeScript 타입 export

### 1.2 소셜 링크 컴포넌트 생성
- [ ] `components/social-links.tsx` 파일 생성
  - [ ] lucide-react 아이콘 import (Linkedin, Instagram, BookOpen)
  - [ ] iconMap 매핑 객체 생성
  - [ ] SocialLinks 컴포넌트 구현
  - [ ] Button 컴포넌트 사용 (variant="ghost", size="icon")
  - [ ] Next.js Link 컴포넌트 통합
  - [ ] 접근성 속성 추가 (aria-label)
  - [ ] 외부 링크 보안 설정 (target="_blank", rel="noopener noreferrer")

### 1.3 헤더 컴포넌트 통합
- [ ] `components/site-header.tsx` 수정
  - [ ] SocialLinks 컴포넌트 import
  - [ ] 우측 액션 영역에 SocialLinks 추가 (Search 앞에 배치)
  - [ ] gap 간격 확인 및 조정

---

## Phase 2: 스타일링 및 시각적 검증 🎨

### 2.1 Light Mode 확인
- [ ] 브라우저에서 Light mode 활성화
  - [ ] 아이콘 색상 적절성 확인
  - [ ] hover 상태 색상 변화 확인
  - [ ] 간격 및 정렬 확인
  - [ ] 다른 헤더 요소와 조화 확인

### 2.2 Dark Mode 확인
- [ ] 브라우저에서 Dark mode 활성화
  - [ ] 아이콘 색상 적절성 확인
  - [ ] hover 상태 색상 변화 확인
  - [ ] 대비(contrast) 확인

### 2.3 반응형 테스트
- [ ] 모바일 (< 768px)
  - [ ] 아이콘 크기 및 터치 타겟 확인
  - [ ] 간격 확인
  - [ ] 화면에 잘 맞는지 확인
- [ ] 태블릿 (768px - 1024px)
  - [ ] 레이아웃 확인
  - [ ] 간격 확인
- [ ] 데스크톱 (> 1024px)
  - [ ] 최종 레이아웃 확인

---

## Phase 3: 접근성 및 UX 검증 ♿

### 3.1 키보드 네비게이션
- [ ] Tab 키로 포커스 이동 테스트
  - [ ] 모든 소셜 링크가 순서대로 포커스되는지 확인
  - [ ] 포커스 표시가 명확한지 확인
- [ ] Enter 키로 링크 활성화 테스트
  - [ ] 각 링크가 새 탭에서 올바르게 열리는지 확인

### 3.2 스크린 리더 테스트
- [ ] aria-label이 올바르게 읽히는지 확인
  - [ ] "LinkedIn 프로필 방문"
  - [ ] "Instagram 프로필 방문"
  - [ ] "블로그 방문"
- [ ] 링크 목적이 명확한지 확인

### 3.3 외부 링크 보안 확인
- [ ] `rel="noopener noreferrer"` 속성 확인
- [ ] `target="_blank"` 동작 확인
- [ ] 새 탭에서 올바른 URL이 열리는지 확인

---

## Phase 4: 최적화 (선택사항) ✨

### 4.1 Tooltip 추가 고려
- [ ] Radix UI Tooltip 컴포넌트 사용 검토
- [ ] hover 시 "LinkedIn", "Instagram" 등 텍스트 표시
- [ ] 모바일에서의 동작 확인

### 4.2 애니메이션 추가 고려
- [ ] hover 시 subtle scale 효과 구현
- [ ] transition 성능 확인
- [ ] 접근성 문제 없는지 확인 (prefers-reduced-motion)

### 4.3 성능 최적화
- [ ] 번들 크기 확인
- [ ] 하이드레이션 성능 확인
- [ ] 필요시 코드 스플리팅 적용

---

## Phase 5: 테스트 및 배포 🚀

### 5.1 E2E 테스트 (선택사항)
- [ ] MCP Playwright로 E2E 테스트 작성
  - [ ] 각 소셜 링크 클릭 테스트
  - [ ] 새 탭에서 열리는지 확인
  - [ ] 시각적 회귀 테스트 (스크린샷)

### 5.2 TypeScript 타입 체크
- [ ] `npm run check` 실행
  - [ ] 타입 에러 없는지 확인
  - [ ] any 타입 사용 없는지 확인

### 5.3 빌드 테스트
- [ ] `npm run build` 실행
  - [ ] 빌드 에러 없는지 확인
  - [ ] 빌드 크기 증가 확인 (< 1KB 예상)

### 5.4 Git 커밋
- [ ] 변경 사항 검토
  - [ ] `git status` 확인
  - [ ] `git diff` 확인
- [ ] 논리적 단위로 커밋 분리
  - [ ] Commit 1: `[#이슈번호] feat: 소셜 링크 설정 파일 추가`
    - `lib/site-config.ts` 생성
  - [ ] Commit 2: `[#이슈번호] feat: 소셜 링크 컴포넌트 구현`
    - `components/social-links.tsx` 생성
  - [ ] Commit 3: `[#이슈번호] feat: 헤더에 소셜 링크 통합`
    - `components/site-header.tsx` 수정

### 5.5 배포 준비
- [ ] PR 생성 (해당하는 경우)
- [ ] 배포 후 프로덕션 환경에서 확인
  - [ ] 모든 링크 동작 확인
  - [ ] Light/Dark 모드 확인
  - [ ] 반응형 디자인 확인

---

## 우선순위 가이드

**🔴 필수 (Phase 1-3)**: 기본 기능 구현 및 접근성 검증
**🟡 권장 (Phase 4)**: UX 개선 및 최적화
**🟢 선택 (Phase 5)**: 자동화된 테스트 및 배포

---

## 체크리스트 사용법

1. 각 Phase를 순서대로 진행
2. 하위 항목을 완료하면 `[ ]`를 `[x]`로 변경
3. 문제 발견 시 해당 항목에 메모 추가
4. Phase 완료 시 이모지 업데이트 (⚡ → ✅)

예시:
```markdown
## Phase 1: 기본 구현 ✅
- [x] lib/site-config.ts 파일 생성
  - [x] SocialLink 인터페이스 정의
  - [x] socialLinks 배열 정의
```

---

## 예상 소요 시간

- **Phase 1**: 30-45분 (구현)
- **Phase 2**: 15-20분 (스타일링 검증)
- **Phase 3**: 15-20분 (접근성 검증)
- **Phase 4**: 30-60분 (선택적 최적화)
- **Phase 5**: 20-30분 (테스트 및 배포)

**총 예상 시간**: 2-3시간 (Phase 4 포함 시)
