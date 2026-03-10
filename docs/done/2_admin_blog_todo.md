# 어드민 권한 관리 블로그 시리즈 - TODO

## 1단계: 블로그 1 초안 작성

- [x] `docs/start/어드민-권한-관리-1-rbac-개념과-권한-모델-설계/index.md` 생성
- [x] frontmatter 작성 (series: "어드민 권한 관리")
- [x] 어드민 권한 관리 필요성 작성 (실무 시나리오)
- [x] ACL/RBAC/ABAC 비교표 작성
- [x] User-Role-Permission ER 다이어그램 작성 (Mermaid erDiagram)
- [x] Permission 키 설계 (`resource:action` 패턴) 설명
- [x] 권한 매트릭스 표 작성 (Role × Resource × Action)
- [x] Owner-Based 접근 제어 개념 설명
- [x] domain 엔티티 코드 발췌 (Permission, Role, User — 핵심만)
- [x] 인코딩 확인 (`file -I`)

## 2단계: 블로그 2 초안 작성

- [x] `docs/start/어드민-권한-관리-2-샘플-프로젝트로-보는-구현/index.md` 생성
- [x] frontmatter 작성 (series: "어드민 권한 관리")
- [x] 인증 vs 인가 설명
- [x] 미들웨어 체인 흐름도 작성 (Mermaid flowchart)
- [x] JWT 미들웨어 코드 발췌 및 설명
- [x] RBAC 미들웨어 코드 발췌 및 설명
- [x] Owner 미들웨어 코드 발췌 및 설명
- [x] router.go 라우트 설정 코드 발췌
- [x] ProtectedRoute 코드 발췌 및 설명
- [x] PermissionGate 코드 발췌 및 설명
- [x] Sidebar 메뉴 필터링 코드 발췌
- [x] ProtectedRoute vs PermissionGate 비교표
- [ ] Role별 화면 스크린샷 촬영 (admin/manager/user)
- [x] 전체 소스코드 GitHub 링크 추가
- [x] 인코딩 확인 (`file -I`)

## 3단계: 리뷰 및 발행

- [ ] 블로그 1 PR 생성 및 리뷰
- [ ] 블로그 2 PR 생성 및 리뷰
- [ ] 리뷰 완료 후 `docs/merge_ready/`로 이동
- [ ] `contents/go/`로 이동하여 발행
