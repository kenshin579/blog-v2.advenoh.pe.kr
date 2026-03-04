# Go 프로젝트 레이아웃과 Clean Architecture - TODO

> PRD: `6_7_go_clean_architecture_prd.md`
> 구현 문서: `6_7_go_clean_architecture_implementation.md`

---

## Phase 1: 기존 코드 확인

- [x] `go-clean-arch-v1/` 코드 구조 및 빌드 확인
- [x] `go-clean-arch-v2/` 코드 구조 및 빌드 확인
- [x] V1/V2 디렉토리 트리 캡처

## Phase 2: 블로그 글 작성

- [x] `docs/start/go-clean-architecture/index.md` 초안 작성
  - [x] frontmatter 작성 (title, description, date, tags)
  - [x] §1 들어가며 (프로젝트 구조 설계의 중요성)
  - [x] §2 Clean Architecture 개요 (원칙, 의존성 규칙, Mermaid 다이어그램, 레이어별 역할)
  - [x] §3 실전 예제: Article CRUD API
    - [x] §3.1 Domain 레이어 (엔티티, 인터페이스 발췌)
    - [x] §3.2 Repository 레이어 (MySQL 구현, cursor 페이지네이션 발췌)
    - [x] §3.3 UseCase 레이어 (errgroup 동시 조회, context 타임아웃 발췌)
    - [x] §3.4 Handler 레이어 (라우트 등록, 에러 매핑, Validator 발췌)
  - [x] §4 프로젝트 구조 비교: V1 vs V2 (디렉토리 트리, 비교표, DI 간단 언급)
  - [x] §5 테스트 전략 (Handler/UseCase/Repository 각 Mock 주입 패턴 발췌)
  - [x] §6 마무리
  - [x] §참고
- [x] 코드 블록에 tutorials-go GitHub 링크 참조
- [x] `file -I`로 UTF-8 인코딩 확인
