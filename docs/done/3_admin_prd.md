# Admin 권한 관리 (RBAC) 샘플 프로젝트

## 목적

- RBAC(Role-Based Access Control) 패턴을 학습하고, best practices 기반의 샘플 코드를 작성하여 블로그 포스트로 정리한다
- 실무에서 자주 사용되는 어드민 권한 관리 시스템의 핵심 구조를 이해한다

## 요구사항

### 기능적 요구사항

#### 인증 (Authentication)
- 사용자 회원가입 (이메일, 비밀번호, 이름)
- 로그인/로그아웃 (JWT 기반)
- Access Token + Refresh Token 발급
- 토큰 갱신 (Refresh Token Rotation)

#### 권한 관리 (Authorization - RBAC)
- **Role 관리**: Role 생성/조회/수정/삭제
  - 기본 Role: `admin`, `manager`, `user`
- **Permission 관리**: Permission 생성/조회
  - Resource + Action 세밀한 조합 (예: `users:read`, `users:create`, `products:update`, `orders:status:update`)
- **Role-Permission 매핑**: Role에 Permission 할당/제거
- **User-Role 매핑**: User에 Role 할당/제거 (다중 Role 지원)

#### 상품 관리 (Products)
- 상품 CRUD (이름, 가격, 상태)
- 상품 상태: `active` / `inactive`
- manager는 본인이 등록한 상품만 수정 가능 (owner-based)
- user는 active 상품만 조회 가능

#### 주문 관리 (Orders)
- 주문 생성 (상품 선택 + 수량)
- 주문 상태 전이: `pending → confirmed → shipped → completed`
- 주문 취소: `pending` 또는 `confirmed` 상태에서 → `cancelled`
- Role별 상태 변경 권한 차등 적용
- user는 본인 주문만 조회 가능 (owner-based)

#### 접근 제어
- API 엔드포인트별 Permission 체크 미들웨어
- Owner-based 접근 제어 미들웨어 (리소스 소유자 검증)
- UI에서 Role/Permission 기반 조건부 렌더링
- 어드민 대시보드에서 사용자/Role/Permission/상품/주문 관리 UI

### 비기능적 요구사항
- 로컬 환경에서만 실행 (HTTP 통신)
- 최소한의 구현 (블로그 설명에 적합한 수준)
- 테스트 코드 포함 (핵심 비즈니스 로직)

## 기술 스택

### Backend
- Go 1.25
- Echo v4 (HTTP 프레임워크)
- GORM (ORM)
- golang-jwt/jwt (JWT 라이브러리)
- MySQL 8.0 (데이터 저장)
- testify (테스트)

### Frontend
- React 19
- TypeScript
- React Router v7 (라우팅 + Protected Route)
- Axios (HTTP 클라이언트)
- Tailwind CSS (스타일링)

## 개발 환경 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend (React) | 3000 | 어드민 대시보드 UI |
| Backend (Echo) | 8081 | REST API 서버 |
| MySQL | 3306 | 데이터 저장소 |

- Docker Compose로 MySQL 실행
- Backend/Frontend는 로컬 직접 실행

## 데이터 모델

### ERD

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
├── created_at
└── updated_at

roles
├── id (PK)
├── name (UNIQUE)       -- admin, manager, user
├── description
├── created_at
└── updated_at

permissions
├── id (PK)
├── resource            -- users, posts, roles
├── action              -- create, read, update, delete
├── description
└── created_at

user_roles (다대다)
├── user_id (FK → users)
└── role_id (FK → roles)

role_permissions (다대다)
├── role_id (FK → roles)
└── permission_id (FK → permissions)

products
├── id (PK)
├── name
├── price (decimal)
├── status              -- active, inactive
├── created_by (FK → users)
├── created_at
└── updated_at

orders
├── id (PK)
├── product_id (FK → products)
├── quantity
├── total_price (decimal)
├── status              -- pending, confirmed, shipped, completed, cancelled
├── ordered_by (FK → users)
├── created_at
└── updated_at
```

### 주문 상태 전이 다이어그램

```
pending ──→ confirmed ──→ shipped ──→ completed
  │             │
  └──→ cancelled ←──┘
```

- **admin**: 모든 상태 전이 가능
- **manager**: `confirmed → shipped` 만 가능, `pending/confirmed → cancelled` 가능
- **user**: 상태 변경 불가, `pending → cancelled` (본인 주문만) 가능

## API 설계

### 인증 API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | 회원가입 | - |
| POST | /api/auth/login | 로그인 | - |
| POST | /api/auth/refresh | 토큰 갱신 | Refresh Token |
| POST | /api/auth/logout | 로그아웃 | Access Token |

### 사용자 API
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/users | 사용자 목록 | users:read |
| GET | /api/users/:id | 사용자 상세 | users:read |
| PUT | /api/users/:id | 사용자 수정 | users:update |
| DELETE | /api/users/:id | 사용자 삭제 | users:delete |
| POST | /api/users/:id/roles | Role 할당 | users:update |
| DELETE | /api/users/:id/roles/:roleId | Role 제거 | users:update |

### Role API
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/roles | Role 목록 | roles:read |
| POST | /api/roles | Role 생성 | roles:create |
| PUT | /api/roles/:id | Role 수정 | roles:update |
| DELETE | /api/roles/:id | Role 삭제 | roles:delete |
| POST | /api/roles/:id/permissions | Permission 할당 | roles:update |
| DELETE | /api/roles/:id/permissions/:permId | Permission 제거 | roles:update |

### 상품 API
| Method | Endpoint | Description | Permission | 비고 |
|--------|----------|-------------|------------|------|
| GET | /api/products | 상품 목록 | products:read | user는 active만 |
| GET | /api/products/:id | 상품 상세 | products:read | |
| POST | /api/products | 상품 등록 | products:create | created_by 자동 설정 |
| PUT | /api/products/:id | 상품 수정 | products:update | owner 체크 미들웨어 |
| DELETE | /api/products/:id | 상품 삭제 | products:delete | |
| PATCH | /api/products/:id/status | 상품 상태 변경 | products:status:update | active/inactive |

### 주문 API
| Method | Endpoint | Description | Permission | 비고 |
|--------|----------|-------------|------------|------|
| GET | /api/orders | 주문 목록 | orders:read | user는 본인 것만 |
| GET | /api/orders/:id | 주문 상세 | orders:read | owner 체크 미들웨어 |
| POST | /api/orders | 주문 생성 | orders:create | ordered_by 자동 설정 |
| PATCH | /api/orders/:id/status | 주문 상태 변경 | orders:status:update | Role별 전이 제한 |
| PATCH | /api/orders/:id/cancel | 주문 취소 | orders:cancel | Role별 취소 조건 차등 |

### Permission API
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/permissions | Permission 목록 | roles:read |

## Permission 전체 목록 (시드 데이터)

| Permission | 설명 | admin | manager | user |
|------------|------|:-----:|:-------:|:----:|
| `users:create` | 사용자 생성 | O | X | X |
| `users:read` | 사용자 조회 | O | O | X |
| `users:update` | 사용자 수정 | O | X | X |
| `users:delete` | 사용자 삭제 | O | X | X |
| `roles:create` | Role 생성 | O | X | X |
| `roles:read` | Role 조회 | O | O | X |
| `roles:update` | Role 수정 | O | X | X |
| `roles:delete` | Role 삭제 | O | X | X |
| `products:create` | 상품 등록 | O | O | X |
| `products:read` | 상품 조회 | O | O | O |
| `products:update` | 상품 수정 | O | O (본인 것) | X |
| `products:delete` | 상품 삭제 | O | X | X |
| `products:status:update` | 상품 상태 변경 | O | O | X |
| `orders:create` | 주문 생성 | O | O | O |
| `orders:read` | 주문 조회 | O | O | O (본인 것) |
| `orders:status:update` | 주문 상태 변경 | O | O (제한적) | X |
| `orders:cancel` | 주문 취소 | O | O (제한적) | O (본인 pending만) |

> **(본인 것)** 표시는 owner-based 미들웨어에서 추가 검증

### Role별 상품/주문 권한 상세

| 기능 | admin | manager | user |
|------|-------|---------|------|
| **상품** | | | |
| 상품 목록 조회 | 전체 (active + inactive) | 전체 (active + inactive) | active만 |
| 상품 등록 | O | O | X |
| 상품 수정 | 전체 | 본인 등록 것만 | X |
| 상품 삭제 (비활성화) | O | X | X |
| 상품 상태 변경 | O | O | X |
| **주문** | | | |
| 주문 목록 조회 | 전체 | 전체 | 본인 것만 |
| 주문 생성 | O | O | O |
| 주문 상태: pending → confirmed | O | X | X |
| 주문 상태: confirmed → shipped | O | O | X |
| 주문 상태: shipped → completed | O | X | X |
| 주문 취소: pending → cancelled | O | O | O (본인만) |
| 주문 취소: confirmed → cancelled | O | O | X |

## Owner-Based 접근 제어 미들웨어

### 설계

리소스 소유자 검증을 미들웨어에서 일괄 처리한다.

```go
// OwnerMiddleware - 리소스 소유자 검증 미들웨어
// 라우트 설정 시 resource 타입과 owner 필드를 지정
e.PUT("/api/products/:id", handler.Update,
    rbacMiddleware("products:update"),
    ownerMiddleware("products", "created_by"),  // products 테이블의 created_by 필드 검증
)

e.PATCH("/api/orders/:id/cancel", handler.Cancel,
    rbacMiddleware("orders:cancel"),
    ownerMiddleware("orders", "ordered_by"),    // orders 테이블의 ordered_by 필드 검증
)
```

### 동작 방식

```
요청 → JWT 인증 → RBAC Permission 체크 → Owner 체크 → Handler
                                            │
                                            ├── admin: owner 체크 스킵 (bypass)
                                            ├── manager: resource별 설정에 따라 체크
                                            └── user: 항상 owner 체크
```

### Owner 미들웨어 설정 테이블

| Resource | Endpoint | admin | manager | user |
|----------|----------|-------|---------|------|
| products | PUT /api/products/:id | bypass | owner 체크 | - (Permission 없음) |
| orders | GET /api/orders/:id | bypass | bypass | owner 체크 |
| orders | PATCH /api/orders/:id/cancel | bypass | bypass | owner 체크 |

> admin은 모든 리소스에 대해 owner 체크를 스킵한다

## UI 구성

### 전체 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  Header: 로고 / 사용자 이름 (Role 뱃지) / 로그아웃   │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  Sidebar   │          Main Content                  │
│            │                                        │
│  - Dashboard│                                       │
│  - Products│                                        │
│  - Orders  │                                        │
│  ─────────── (admin/manager만)                      │
│  - Users   │                                        │
│  - Roles   │                                        │
│  - Perms   │                                        │
│            │                                        │
├────────────┴────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

- **Sidebar**: Role에 따라 메뉴 항목이 다르게 표시된다
- **Header**: 현재 로그인한 사용자 정보 + Role 뱃지 표시

### 페이지별 구성

#### 1. 로그인 페이지 (`/login`)
```
┌─────────────────────────────┐
│        RBAC Admin           │
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password              │  │
│  └───────────────────────┘  │
│                             │
│  [ Login ]                  │
│  회원가입 링크               │
│                             │
└─────────────────────────────┘
```
- 로그인 성공 → Dashboard로 리다이렉트
- 회원가입 링크 → Register 페이지 이동

#### 2. 회원가입 페이지 (`/register`)
```
┌─────────────────────────────┐
│        회원가입               │
│                             │
│  ┌───────────────────────┐  │
│  │ Name                  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password              │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password 확인          │  │
│  └───────────────────────┘  │
│                             │
│  [ Register ]               │
│  로그인 링크                 │
└─────────────────────────────┘
```
- 가입 성공 → 로그인 페이지로 이동
- 기본 Role `user`가 자동 할당

#### 3. Dashboard 페이지 (`/dashboard`)
```
┌─────────────────────────────────────┐
│  Dashboard                          │
│                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │ Users    │ │ Roles    │ │Perms ││
│  │   12     │ │    3     │ │  16  ││
│  └──────────┘ └──────────┘ └──────┘│
│                                     │
│  내 정보                             │
│  ┌─────────────────────────────────┐│
│  │ 이름: Frank                     ││
│  │ 이메일: frank@example.com       ││
│  │ Roles: [admin] [manager]        ││
│  │ Permissions: users:read, ...    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```
- 통계 카드: 전체 사용자 수, Role 수, Permission 수
- 내 정보: 현재 사용자의 Role/Permission 요약

#### 4. 사용자 관리 페이지 (`/users`) — `users:read` 필요
```
┌──────────────────────────────────────────────────┐
│  사용자 관리                                       │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Name     │ Email            │ Roles  │ 액션  ││
│  ├──────────┼──────────────────┼────────┼───────┤│
│  │ Frank    │ frank@email.com  │ admin  │ [편집]││
│  │ Alice    │ alice@email.com  │ manager│ [편집]││
│  │ Bob      │ bob@email.com    │ user   │ [편집]││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**사용자 상세/편집 모달** (`users:update` 필요):
```
┌──────────────────────────────┐
│  사용자 편집: Frank            │
│                              │
│  이름: [Frank          ]     │
│  이메일: frank@email.com     │
│                              │
│  Role 할당:                   │
│  ┌────────────────────────┐  │
│  │ [x] admin              │  │
│  │ [x] manager            │  │
│  │ [ ] user               │  │
│  └────────────────────────┘  │
│                              │
│  [저장]  [삭제]  [취소]       │
└──────────────────────────────┘
```
- 체크박스로 다중 Role 할당/제거
- [삭제] 버튼은 `users:delete` Permission이 있을 때만 표시

#### 5. Role 관리 페이지 (`/roles`) — `roles:read` 필요
```
┌──────────────────────────────────────────────────┐
│  Role 관리                         [+ Role 추가]  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Role     │ 설명              │ Perms │ 액션  ││
│  ├──────────┼───────────────────┼───────┼───────┤│
│  │ admin    │ 전체 관리 권한     │  16   │ [편집]││
│  │ manager  │ 콘텐츠 관리 권한   │   8   │ [편집]││
│  │ user     │ 기본 사용자 권한   │   3   │ [편집]││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Role 편집 모달** (`roles:update` 필요):
```
┌──────────────────────────────────┐
│  Role 편집: manager               │
│                                  │
│  이름: [manager          ]       │
│  설명: [콘텐츠 관리 권한   ]       │
│                                  │
│  Permission 할당:                 │
│  ┌──────────────────────────┐    │
│  │ users                    │    │
│  │  [x] users:read          │    │
│  │  [x] users:update        │    │
│  │  [ ] users:delete        │    │
│  │  [ ] users:create        │    │
│  ├──────────────────────────┤    │
│  │ roles                    │    │
│  │  [x] roles:read          │    │
│  │  [ ] roles:create        │    │
│  │  [ ] roles:update        │    │
│  │  [ ] roles:delete        │    │
│  ├──────────────────────────┤    │
│  │ posts                    │    │
│  │  [x] posts:read          │    │
│  │  [x] posts:create        │    │
│  │  [x] posts:update        │    │
│  │  [x] posts:delete        │    │
│  └──────────────────────────┘    │
│                                  │
│  [저장]  [삭제]  [취소]           │
└──────────────────────────────────┘
```
- Resource별로 그룹핑하여 Permission 체크박스 표시
- [+ Role 추가], [삭제] 버튼은 해당 Permission이 있을 때만 표시

#### 6. Permission 조회 페이지 (`/permissions`) — `roles:read` 필요
```
┌──────────────────────────────────────────────────┐
│  Permission 목록                                  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Resource │ Action  │ 설명                    ││
│  ├──────────┼─────────┼─────────────────────────┤│
│  │ users    │ create  │ 사용자 생성              ││
│  │ users    │ read    │ 사용자 조회              ││
│  │ users    │ update  │ 사용자 수정              ││
│  │ users    │ delete  │ 사용자 삭제              ││
│  │ roles    │ create  │ Role 생성                ││
│  │ roles    │ read    │ Role 조회                ││
│  │ ...      │ ...     │ ...                     ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```
- 읽기 전용 테이블 (Permission은 시드 데이터로 관리)

#### 7. 상품 관리 페이지 (`/products`) — `products:read` 필요
```
┌────────────────────────────────────────────────────────────┐
│  상품 관리                                  [+ 상품 등록]   │
│                                                            │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 상품명    │ 가격     │ 상태     │ 등록자  │ 액션       ││
│  ├──────────┼──────────┼──────────┼────────┼────────────┤│
│  │ 노트북   │ 1,200,000│ active   │ Alice  │ [편집][삭제]││
│  │ 키보드   │   150,000│ active   │ Bob    │ [편집]      ││
│  │ 모니터   │   500,000│ inactive │ Alice  │ [편집][삭제]││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Role별 화면 차이**:
- **admin**: 전체 상품(active + inactive), [+ 상품 등록], [편집], [삭제] 모두 표시
- **manager**: 전체 상품, [+ 상품 등록], 본인 등록 상품만 [편집] 표시, [삭제] 없음
- **user**: active 상품만 표시, [+ 상품 등록] 없음, [편집]/[삭제] 없음

**상품 등록/편집 모달**:
```
┌──────────────────────────────┐
│  상품 등록                    │
│                              │
│  상품명: [              ]    │
│  가격:   [              ]    │
│  상태:   (●) active          │
│          ( ) inactive        │
│                              │
│  [저장]  [취소]              │
└──────────────────────────────┘
```

#### 8. 주문 관리 페이지 (`/orders`) — `orders:read` 필요
```
┌──────────────────────────────────────────────────────────────────┐
│  주문 관리                                       [+ 주문 생성]   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ 주문번호 │ 상품     │ 수량│ 금액      │ 상태      │ 주문자│ 액션      ││
│  ├─────────┼─────────┼────┼──────────┼──────────┼──────┼──────────┤│
│  │ #001    │ 노트북   │  1 │1,200,000 │ pending  │ Bob  │[확인][취소]││
│  │ #002    │ 키보드   │  2 │  300,000 │ confirmed│ Alice│[배송]     ││
│  │ #003    │ 모니터   │  1 │  500,000 │ shipped  │ Bob  │[완료]     ││
│  │ #004    │ 키보드   │  1 │  150,000 │ cancelled│ Alice│ -        ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Role별 화면 차이**:
- **admin**: 전체 주문, 모든 상태 변경 버튼 표시
  - pending: [확인][취소] / confirmed: [배송][취소] / shipped: [완료]
- **manager**: 전체 주문, 제한된 상태 변경
  - confirmed: [배송] / pending,confirmed: [취소]
- **user**: 본인 주문만 표시
  - pending: [취소] (본인 주문만)

**주문 생성 모달**:
```
┌──────────────────────────────┐
│  주문 생성                    │
│                              │
│  상품: [드롭다운 선택  ▼]     │
│        노트북 - ₩1,200,000   │
│  수량: [  1  ]               │
│                              │
│  합계: ₩1,200,000            │
│                              │
│  [주문하기]  [취소]           │
└──────────────────────────────┘
```

### Role별 UI 접근 권한 매트릭스

| 페이지/기능 | admin | manager | user |
|------------|-------|---------|------|
| **공통** | | | |
| Dashboard | O | O | O |
| **상품 관리** | | | |
| 상품 목록 조회 | 전체 | 전체 | active만 |
| 상품 등록 | O | O | X |
| 상품 편집 | 전체 | 본인 것만 | X |
| 상품 삭제 | O | X | X |
| 상품 상태 변경 | O | O | X |
| **주문 관리** | | | |
| 주문 목록 조회 | 전체 | 전체 | 본인 것만 |
| 주문 생성 | O | O | O |
| 주문 확인 (pending→confirmed) | O | X | X |
| 주문 배송 (confirmed→shipped) | O | O | X |
| 주문 완료 (shipped→completed) | O | X | X |
| 주문 취소 (pending→cancelled) | O | O | O (본인만) |
| 주문 취소 (confirmed→cancelled) | O | O | X |
| **RBAC 관리** | | | |
| 사용자 목록 조회 | O | O | X |
| 사용자 편집/삭제 | O | X | X |
| 사용자 Role 할당 | O | X | X |
| Role 관리 (CRUD) | O | X | X |
| Permission 조회 | O | O | X |

### Frontend 권한 제어 컴포넌트

#### ProtectedRoute
```tsx
// 페이지 단위 접근 제어
<ProtectedRoute permission="users:read">
  <UsersPage />
</ProtectedRoute>
```

#### PermissionGate
```tsx
// UI 요소 단위 조건부 렌더링
<PermissionGate permission="users:delete">
  <Button variant="destructive">삭제</Button>
</PermissionGate>
```

### 라우트 구조

| Path | 페이지 | 필요 Permission | 비고 |
|------|--------|----------------|------|
| `/login` | LoginPage | - | 비인증 사용자만 |
| `/register` | RegisterPage | - | 비인증 사용자만 |
| `/dashboard` | DashboardPage | (로그인만) | 모든 인증 사용자 |
| `/products` | ProductsPage | products:read | 상품 관리 |
| `/orders` | OrdersPage | orders:read | 주문 관리 |
| `/users` | UsersPage | users:read | 사용자 관리 (admin/manager) |
| `/roles` | RolesPage | roles:read | Role 관리 (admin) |
| `/permissions` | PermissionsPage | roles:read | Permission 조회 (admin/manager) |

## 구현 플로우

### 인증 플로우
1. 사용자가 이메일/비밀번호로 로그인 요청
2. Backend에서 비밀번호 검증 후 JWT (Access + Refresh Token) 발급
3. Access Token에 사용자 ID, Role 목록 포함
4. Frontend는 Access Token을 메모리에, Refresh Token을 HttpOnly Cookie에 저장
5. API 요청 시 Authorization 헤더에 Access Token 포함

### 권한 체크 플로우
1. 요청이 들어오면 JWT 미들웨어에서 Access Token 검증
2. Token에서 사용자 ID 추출
3. RBAC 미들웨어에서 사용자의 Role → Permission 조회
4. 요청된 API에 필요한 Permission과 비교
5. Permission이 있으면 통과, 없으면 403 Forbidden

### Frontend 권한 체크
1. 로그인 시 사용자의 Role/Permission 목록을 받아 Context에 저장
2. ProtectedRoute 컴포넌트로 페이지 접근 제어
3. `usePermission` 훅으로 UI 요소 조건부 렌더링

## 구현 지침

- 구현은 최소한으로 한다 (블로그 설명에 적합한 수준)
- FE 개발은 React + TypeScript로 `frontend/` 폴더에 작성한다
- BE 개발은 Go + Echo로 `backend/` 폴더에 작성한다
- Clean Architecture 패턴 적용 (domain → repository → usecase → http)
- library 사용 시 mcp context7로 최신 코드 확인하여 작성한다
- 기존 `tutorials-go/keycloak/` 프로젝트의 구조와 패턴을 참고한다

> 프로젝트 구조, 테스트 시나리오, 구현 상세는 `3_admin_implementation.md` / `3_admin_todo.md` 참조

## 블로그 작성 계획

> 별도 PRD 참조: `3_admin_blog_prd.md` (7편 시리즈 구성)

## 논의 사항

### 결정 완료
- [x] Casbin 라이브러리 사용 vs 직접 구현? → **직접 구현** (학습 목적)
- [x] Permission 계층 구조 (hierarchical RBAC) 포함 여부? → **flat RBAC만** (1차)
- [x] Refresh Token 저장소: DB vs Redis? → **DB** (1차)
- [x] 비밀번호 해싱: bcrypt vs argon2? → **bcrypt** (표준적, 충분)
- [x] Frontend 상태 관리: Context API vs Zustand? → **Context API** (최소 구현)
- [x] 실무 도메인: → **상품(Products) + 주문(Orders)** (Role별 차이를 직관적으로 보여줌)
- [x] 구현 범위: → **상품 + 주문 둘 다** (owner-based + 상태 전이 패턴 커버)
- [x] 주문 상태 전이: → **cancelled 분기 포함** (Role별 취소 조건 차등)
- [x] Permission 설계: → **세밀하게** (`products:status:update`, `orders:cancel` 등 분리)
- [x] Owner-based 접근 체크: → **미들웨어에서 일괄 처리** (admin bypass, resource/field 설정 방식)

### 추후 확장 가능
- OAuth 2.0 / Keycloak 연동 (기존 keycloak 프로젝트와 통합)
- Permission 계층 구조 (admin은 manager의 모든 권한 상속)
- Audit Log (누가 언제 어떤 권한 변경했는지)
- API Rate Limiting (Role별 차등)
- Multi-tenancy 지원
