# 어드민 권한 관리 블로그 시리즈 PRD

## 개요

어드민 권한 관리(RBAC)를 스터디하고, 개념 → 설계 → 샘플 프로젝트 순서로 블로그 시리즈를 작성한다.

- **샘플 저장소**: [tutorials-go/rbac/](https://github.com/kenshin579/tutorials-go/tree/main/rbac)
- **관련 PR**: [#685](https://github.com/kenshin579/tutorials-go/pull/685)
- **시리즈명**: `어드민 권한 관리`

---

## 블로그 시리즈 구성

### 블로그 1: 어드민 권한 관리 (1) - RBAC 개념과 권한 모델 설계

> 어드민 권한 관리가 왜 필요하고, 어떤 모델이 있으며, RBAC을 어떻게 설계하는가

- 어드민 권한 관리란
  - 왜 필요한가 — 관리자/매니저/일반 사용자의 접근 범위가 다른 실무 시나리오
  - 권한 관리가 없을 때 발생하는 문제
- 접근 제어 모델 비교
  - ACL (Access Control List) — 리소스별 사용자 직접 매핑
  - RBAC (Role-Based Access Control) — 역할 기반 간접 매핑
  - ABAC (Attribute-Based Access Control) — 속성 기반 정책
  - 언제 RBAC을 선택하는가
- RBAC 핵심 구성 요소
  - User, Role, Permission 3계층 구조
  - User ↔ Role (M:N), Role ↔ Permission (M:N) 관계
  - Permission 키 설계: `resource:action` 패턴 (e.g. `products:create`, `orders:status:update`)
- 권한 매트릭스 설계
  - Role 정의: admin / manager / user
  - Resource별 Permission 매핑 표
- Owner-Based 접근 제어
  - RBAC만으로 부족한 경우 — "자기 리소스만 수정 가능" 요구사항
  - RBAC + Owner 이중 제어 개념
  - Bypass Role 패턴 (admin은 소유권 체크 생략)

---

### 블로그 2: 어드민 권한 관리 (2) - 샘플 프로젝트로 보는 구현 (Go + React)

> 1편에서 설계한 RBAC을 백엔드와 프론트엔드에서 어떻게 구현하는가

- 인증과 인가의 차이
  - Authentication (인증) — "누구인가" → JWT
  - Authorization (인가) — "무엇을 할 수 있는가" → RBAC 미들웨어
- 백엔드: 미들웨어 체인으로 권한 제어
  - 요청 흐름: `JWT 인증 → RBAC Permission 체크 → Owner 소유권 체크 → Handler`
  - JWT 미들웨어: 토큰 검증 → Context에 사용자 정보 주입
  - RBAC 미들웨어: Permission 조회 → 요청된 권한과 비교
  - Owner 미들웨어: 리소스 소유자 확인, Bypass Role 처리
  - 라우트별 미들웨어 선언적 적용: `rbac()`, `owner()` 헬퍼 패턴
- 프론트엔드: 권한 기반 UI 제어
  - 서버가 보안의 주체, 프론트엔드는 UX 최적화 역할
  - AuthContext — 로그인 시 `roles[]`, `permissions[]` 전역 관리
  - ProtectedRoute — 라우트 단위 접근 제어
  - PermissionGate — 버튼/메뉴 단위 조건부 렌더링
  - Sidebar 메뉴 동적 필터링
- 참조 코드
  - `rbac/backend/http/middleware/` — JWT, RBAC, Owner 미들웨어
  - `rbac/backend/http/router.go` — 라우트별 미들웨어 체인
  - `rbac/frontend/src/auth/` — AuthContext, ProtectedRoute, usePermission
  - `rbac/frontend/src/components/` — PermissionGate, Sidebar

---

## 관련 문서

- 구현 상세: `2_admin_blog_implementation.md`
- TODO 체크리스트: `2_admin_blog_todo.md`
