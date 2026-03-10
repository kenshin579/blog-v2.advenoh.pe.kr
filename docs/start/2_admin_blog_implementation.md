# 어드민 권한 관리 블로그 시리즈 - 구현 문서

## 파일 구조

```
docs/start/
├── 어드민-권한-관리-1-rbac-개념과-권한-모델-설계/
│   └── index.md
└── 어드민-권한-관리-2-샘플-프로젝트로-보는-구현/
    └── index.md
```

최종 발행 시 `contents/go/` 디렉토리로 이동한다.

---

## 블로그 1: RBAC 개념과 권한 모델 설계

### frontmatter

```yaml
title: "어드민 권한 관리 (1) - RBAC 개념과 권한 모델 설계"
description: "어드민 권한 관리 (1) - RBAC 개념과 권한 모델 설계"
date: 2026-03-15
update: 2026-03-15
tags:
  - go
  - rbac
  - 권한관리
  - 접근제어
  - 어드민
series: "어드민 권한 관리"
```

### 목차 구성

```
# 1. 어드민 권한 관리란
  - 왜 필요한가 (실무 시나리오)
  - 권한 관리가 없을 때 발생하는 문제

# 2. 접근 제어 모델 비교
  - ACL / RBAC / ABAC 비교표
  - 언제 RBAC을 선택하는가

# 3. RBAC 핵심 구성 요소
  - User, Role, Permission 3계층 구조
  - ER 다이어그램 (Mermaid erDiagram)
  - Permission 키 설계: resource:action 패턴

# 4. 권한 매트릭스 설계
  - Role 정의 (admin / manager / user)
  - Resource별 Permission 매핑 표

# 5. Owner-Based 접근 제어
  - RBAC만으로 부족한 경우
  - RBAC + Owner 이중 제어 개념
  - Bypass Role 패턴

# 6. 마무리
```

### 다이어그램 목록

1. **ER 다이어그램** — User-Role-Permission M:N 관계 (Mermaid `erDiagram`)
2. **RBAC 계층 구조** — User → Role → Permission 흐름 (Mermaid `flowchart`)

### 표 목록

1. **ACL/RBAC/ABAC 비교표** — 정의, 장단점, 적합한 경우
2. **권한 매트릭스** — Role × Resource × Action (PR #685의 README 표 참조)

### 코드 발췌 대상

- `domain/permission.go` — Permission 엔티티, `Key()` 메서드 (핵심 5줄)
- `domain/role.go` — Role 엔티티, `many2many:role_permissions` (핵심 5줄)
- `domain/user.go` — User 엔티티, `many2many:user_roles` (핵심 5줄)

---

## 블로그 2: 샘플 프로젝트로 보는 구현 (Go + React)

### frontmatter

```yaml
title: "어드민 권한 관리 (2) - 샘플 프로젝트로 보는 구현 (Go + React)"
description: "어드민 권한 관리 (2) - 샘플 프로젝트로 보는 구현 (Go + React)"
date: 2026-03-16
update: 2026-03-16
tags:
  - go
  - echo
  - react
  - jwt
  - rbac
  - 미들웨어
series: "어드민 권한 관리"
```

### 목차 구성

```
# 1. 인증과 인가
  - Authentication vs Authorization
  - JWT Access/Refresh Token 구조

# 2. 백엔드: 미들웨어 체인으로 권한 제어
  - 요청 흐름도 (JWT → RBAC → Owner → Handler)
  - JWT 미들웨어 — 토큰 검증, Context 주입
  - RBAC 미들웨어 — Permission 비교
  - Owner 미들웨어 — 소유자 확인, Bypass Role
  - 라우트별 선언적 적용 (router.go)

# 3. 프론트엔드: 권한 기반 UI 제어
  - AuthContext — roles/permissions 전역 관리
  - ProtectedRoute — 라우트 단위 접근 제어
  - PermissionGate — UI 요소 단위 조건부 렌더링
  - Sidebar 메뉴 동적 필터링

# 4. 마무리
  - 전체 소스코드 GitHub 링크
```

### 다이어그램 목록

1. **미들웨어 체인 흐름도** — 요청 → JWT → RBAC → Owner → Handler (Mermaid `flowchart LR`)

### 표 목록

1. **ProtectedRoute vs PermissionGate 비교** — 적용 단위, 용도, 예시

### 코드 발췌 대상 (핵심 부분만)

- `middleware/jwt_auth.go` — `JWTAuth()` 함수 전체 (~15줄)
- `middleware/rbac.go` — `RequirePermission()` 함수 전체 (~15줄)
- `middleware/owner.go` — `OwnerConfig` 구조체 + `RequireOwner()` 핵심 (~20줄)
- `http/router.go` — products/orders 라우트 설정 부분 (~15줄)
- `frontend/src/auth/ProtectedRoute.tsx` — 전체 (~15줄)
- `frontend/src/components/PermissionGate.tsx` — 전체 (~15줄)
- `frontend/src/components/Sidebar.tsx` — 메뉴 필터링 핵심 부분 (~10줄)

### 스크린샷 필요

- admin 로그인 시 Sidebar (모든 메뉴 표시)
- manager 로그인 시 Sidebar (admin 메뉴 숨김)
- user 로그인 시 Sidebar (조회만 가능)
