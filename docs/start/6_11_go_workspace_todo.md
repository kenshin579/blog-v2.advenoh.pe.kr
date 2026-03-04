# Go Workspace로 멀티 모듈 프로젝트 관리하기 - TODO

> PRD: `6_11_go_workspace_prd.md`
> 구현 문서: `6_11_go_workspace_implementation.md`

---

## Phase 1: 기존 코드 확인

- [x] `golang/workspace/` 코드 구조 및 빌드 확인
- [x] `go work sync` 정상 동작 확인

## Phase 2: 블로그 글 작성

- [x] `docs/start/go-workspace-멀티-모듈-프로젝트-관리하기/index.md` 초안 작성
  - [x] frontmatter 작성 (title, description, date, tags)
  - [x] §1 들어가며 (멀티 모듈 문제, replace 한계, go.work 등장)
  - [x] §2 기본 사용법 (go work init, use, go.work 파일 구조)
  - [x] §3 예제: 공유 라이브러리 + 서비스 멀티 모듈
  - [x] §4 Workspace 주요 명령어
  - [x] §5 실전 팁과 주의사항 (gitignore, CI/CD, 비교표)
  - [x] §6 마무리
  - [x] §7 참고
- [x] 코드 블록에 tutorials-go GitHub 링크 참조
- [x] `file -I`로 UTF-8 인코딩 확인
