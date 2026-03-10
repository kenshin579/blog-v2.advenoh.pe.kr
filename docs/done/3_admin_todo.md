# Admin 권한 관리 (RBAC) - TODO

## 1단계: 인프라 및 프로젝트 초기화

- [x] Docker Compose 파일 작성 (MySQL 8.0)
- [x] `docker compose up -d`로 MySQL 실행 확인
- [x] Backend Go 프로젝트 초기화 (`go mod init`)
- [x] Backend 의존성 설치 (echo, gorm, jwt, bcrypt, testify)
- [x] Frontend React 프로젝트 초기화 (Vite + TypeScript)
- [x] Frontend 의존성 설치 (react-router-dom, axios, tailwindcss)
- [x] Backend config 구조 작성 (DB 연결, JWT 시크릿, 포트)

## 2단계: Backend - Domain 레이어

- [x] `domain/user.go` — User 엔티티 + UserRepository 인터페이스
- [x] `domain/role.go` — Role 엔티티 + RoleRepository 인터페이스
- [x] `domain/permission.go` — Permission 엔티티 + PermissionRepository 인터페이스
- [x] `domain/product.go` — Product 엔티티 + ProductRepository 인터페이스
- [x] `domain/order.go` — Order 엔티티 + OrderRepository 인터페이스
- [x] `domain/order.go` — 주문 상태 전이 규칙 (`CanTransition`, Role별 전이 맵)
- [x] `domain/order_test.go` — CanTransition 단위 테스트

## 3단계: Backend - Repository 레이어

- [x] GORM AutoMigrate로 테이블 생성
- [x] `repository/user_repository.go` — CRUD + Role 할당/제거
- [x] `repository/role_repository.go` — CRUD + Permission 할당/제거
- [x] `repository/permission_repository.go` — 전체 조회 + 사용자별 Permission 조회
- [x] `repository/product_repository.go` — CRUD + activeOnly 필터
- [x] `repository/order_repository.go` — CRUD + 사용자별 조회

## 4단계: Backend - 시드 데이터

- [x] `config/seed.go` — Permission 17개 시드
- [x] Role 3개 생성 (admin, manager, user) + Permission 매핑
- [x] 테스트 사용자 3명 생성 (admin/manager/user) + Role 할당
- [x] 테스트 상품/주문 샘플 데이터 생성
- [x] 서버 시작 시 시드 데이터 자동 삽입 (이미 존재하면 스킵)

## 5단계: Backend - JWT 토큰

- [x] `pkg/jwt/jwt.go` — Claims 구조체 정의 (UserID, Roles)
- [x] `pkg/jwt/jwt.go` — GenerateTokenPair (Access 15분, Refresh 7일)
- [x] `pkg/jwt/jwt.go` — ParseToken (검증 + Claims 추출)
- [x] `pkg/jwt/jwt_test.go` — 생성/검증/만료 테스트

## 6단계: Backend - 미들웨어

- [x] `http/middleware/jwt_auth.go` — JWT 인증 미들웨어 (Bearer 토큰 추출/검증)
- [x] `http/middleware/rbac.go` — RBAC Permission 체크 미들웨어
- [x] `http/middleware/owner.go` — Owner-based 접근 제어 미들웨어 (admin bypass)
- [x] `http/middleware/rbac_test.go` — Permission 있음/없음 테스트
- [x] `http/middleware/owner_test.go` — admin bypass, owner 일치/불일치 테스트

## 7단계: Backend - Usecase 레이어

- [x] `usecase/auth_usecase.go` — 회원가입 (bcrypt 해싱, 기본 Role 할당)
- [x] `usecase/auth_usecase.go` — 로그인 (비밀번호 검증, 토큰 발급)
- [x] `usecase/auth_usecase.go` — 토큰 갱신 (Refresh Token 검증 + 새 토큰 발급)
- [x] `usecase/user_usecase.go` — 사용자 CRUD + Role 할당/제거
- [x] `usecase/rbac_usecase.go` — Role CRUD + Permission 할당/제거
- [x] `usecase/product_usecase.go` — 상품 CRUD + Role별 목록 필터링 (active only)
- [x] `usecase/order_usecase.go` — 주문 생성 (total_price 계산)
- [x] `usecase/order_usecase.go` — 주문 목록 조회 (Role별 범위 제한)
- [x] `usecase/order_usecase.go` — 주문 상태 변경 (Role별 전이 검증)
- [x] `usecase/order_usecase.go` — 주문 취소 (Role별 취소 조건)
- [x] `usecase/order_usecase_test.go` — 상태 변경/취소 비즈니스 로직 테스트

## 8단계: Backend - Handler + Router

- [x] `http/handler/auth_handler.go` — register, login, refresh, logout
- [x] `http/handler/user_handler.go` — CRUD + Role 할당/제거
- [x] `http/handler/rbac_handler.go` — Role CRUD + Permission 할당/제거 + Permission 목록
- [x] `http/handler/product_handler.go` — CRUD + 상태 변경
- [x] `http/handler/order_handler.go` — 생성, 목록, 상세, 상태 변경, 취소
- [x] `http/router.go` — 전체 라우트 등록 (미들웨어 조합)
- [x] CORS 설정 (localhost:3000 허용)
- [x] `main.go` — 서버 엔트리포인트 (DB 연결, 시드, 라우터 셋업)

## 9단계: Backend 통합 테스트

- [x] 서버 실행 후 curl/httpie로 API 동작 확인
- [x] admin 계정: 모든 API 접근 가능 확인
- [x] manager 계정: 본인 상품만 수정 가능, 타인 상품 403 확인
- [x] manager 계정: confirmed→shipped 가능, pending→confirmed 403 확인
- [x] user 계정: active 상품만 조회, 본인 주문만 조회 확인
- [x] user 계정: 본인 주문 pending→cancelled 가능, confirmed 취소 403 확인

## 10단계: Frontend - 프로젝트 구조 및 인증

- [x] Tailwind CSS 설정
- [x] `api/client.ts` — Axios 인스턴스 + 요청/응답 인터셉터 (토큰 자동 갱신)
- [x] `auth/AuthContext.tsx` — 인증 상태 관리 (user, roles, permissions)
- [x] `auth/usePermission.ts` — hasPermission, hasRole, isOwner 훅
- [x] `auth/ProtectedRoute.tsx` — Permission 기반 라우트 보호
- [x] `components/PermissionGate.tsx` — UI 요소 조건부 렌더링 (owner 체크 포함)

## 11단계: Frontend - 레이아웃 및 공통 컴포넌트

- [x] `components/Layout.tsx` — Header + Sidebar + Main Content 레이아웃
- [x] `components/Sidebar.tsx` — Role 기반 메뉴 렌더링 (구분선 포함)
- [x] `App.tsx` — React Router 설정 (ProtectedRoute 적용)

## 12단계: Frontend - 인증 페이지

- [x] `pages/LoginPage.tsx` — 이메일/비밀번호 폼, 로그인 → Dashboard 리다이렉트
- [x] `pages/RegisterPage.tsx` — 회원가입 폼, 성공 → 로그인 페이지 이동

## 13단계: Frontend - Dashboard

- [x] `pages/DashboardPage.tsx` — 통계 카드 (사용자 수, Role 수, Permission 수)
- [x] `pages/DashboardPage.tsx` — 내 정보 (이름, 이메일, Role 뱃지, Permission 목록)

## 14단계: Frontend - 상품 관리

- [x] `pages/ProductsPage.tsx` — 상품 목록 테이블
- [x] Role별 화면 차이: admin(전체+삭제), manager(전체+본인편집), user(active만)
- [x] `components/ProductModal.tsx` — 상품 등록/편집 모달
- [x] PermissionGate 적용: [+ 상품 등록], [편집], [삭제] 버튼

## 15단계: Frontend - 주문 관리

- [x] `pages/OrdersPage.tsx` — 주문 목록 테이블
- [x] Role별 화면 차이: admin(전체+모든액션), manager(전체+제한액션), user(본인만)
- [x] `components/OrderCreateModal.tsx` — 주문 생성 모달 (상품 드롭다운 + 수량)
- [x] `components/OrderStatusBadge.tsx` — 상태 뱃지 + Role별 액션 버튼

## 16단계: Frontend - RBAC 관리 페이지

- [x] `pages/UsersPage.tsx` — 사용자 목록 + 편집 모달
- [x] `components/UserEditModal.tsx` — 사용자 편집 + Role 체크박스 할당
- [x] `pages/RolesPage.tsx` — Role 목록 + 편집 모달
- [x] `components/RoleEditModal.tsx` — Role 편집 + Resource별 Permission 체크박스
- [x] `pages/PermissionsPage.tsx` — Permission 읽기 전용 테이블

## 17단계: Frontend 수동 테스트 (MCP Playwright)

- [x] admin 로그인: 모든 메뉴 + 모든 액션 버튼 표시 확인
- [x] manager 로그인: 상품/주문 메뉴, 본인 상품만 편집 가능 확인
- [x] user 로그인: 상품(active만)/주문(본인만), RBAC 관리 메뉴 숨김 확인
- [x] 주문 상태별 액션 버튼이 Role에 맞게 표시되는지 확인
- [x] 권한 없는 페이지 URL 직접 접근 시 리다이렉트 확인
- [ ] 토큰 만료 → 자동 갱신 → API 재요청 플로우 확인

## 18단계: README 및 마무리

- [x] `tutorials-go/rbac/README.md` — 실행 방법, API 문서, 테스트 계정
- [x] 코드 정리 및 불필요한 파일 제거

> 블로그 포스트 작성은 별도 PRD 참조: `3_admin_blog_prd.md`
