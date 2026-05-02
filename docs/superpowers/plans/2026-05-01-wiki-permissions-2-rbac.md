# wiki-permissions 시리즈 2편 (RBAC) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1편(ACL)과 같은 사내 위키 메타 컨텍스트 위에서 RBAC(Role-Based Access Control) 권한 모델을 풀스택(Go + React)으로 구현해 "사용자에게 역할(Role)을 주고, 역할에 권한을 매핑한다" 시나리오를 실행 가능한 코드로 보여준다.

**Architecture:** Backend는 1편과 같은 4계층(domain → repository → usecase → handler) + JWT 미들웨어. ACLEntry 1테이블 대신 4테이블(Role / Permission / UserRole / RolePermission). Page.owner_id는 메타데이터로만 유지하고 권한 평가에는 사용하지 않음(RBAC 한계 → 다음 편 ABAC 동기). RBAC 평가 핵심: 사용자의 role 집합 → permission 집합 → `want resource:action` 포함 여부. Frontend는 1편과 동일한 React 19 + Tailwind v4 + AuthContext + ProtectedRoute 골격을 재사용.

**Tech Stack:** Go 1.25+, Echo v4, GORM, mattn/go-sqlite3, golang-jwt/jwt v5, golang.org/x/crypto/bcrypt; React 19, TypeScript, Vite 6, React Router v7, Axios, Tailwind CSS v4. (1편과 동일)

**작업 위치**: `tutorials-go/wiki-permissions/2-rbac/{backend,frontend}/`
**브랜치**: `feature/704-wiki-permissions-rbac`
**트래킹 이슈**: `kenshin579/tutorials-go#704`
**Spec**: `docs/superpowers/specs/2026-05-01-wiki-permissions-design.md`
**1편 plan (참조용)**: `docs/superpowers/plans/2026-05-01-wiki-permissions-1-acl.md`

---

## 결정 사항 (브레인스토밍 단계에서 확정)

| 항목 | 값 |
|---|---|
| Role 구성 | admin / editor / viewer (3개로 단순화 — guest 제거) |
| Page.owner_id 처리 | **권한 평가에서 무시**, 메타데이터로만 유지 |
| 권한 매트릭스 | 아래 표 |
| 시드 user → role | alice=admin, bob=editor, carol=viewer, dave=viewer |
| 평가 위치 | usecase 계층에 `HasPermission(userPermissions, want)` 함수 |

### 권한 매트릭스

| role | pages:read | pages:create | pages:edit | pages:delete |
|---|---|---|---|---|
| admin | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | ✓ | - |
| viewer | ✓ | - | - | - |

### 시리즈 비교 메시지 (글에 사용)

| 차이점 | 1편 ACL | 2편 RBAC |
|---|---|---|
| 권한 데이터 위치 | `ACLEntry(page_id, user_id, action)` | `UserRole + RolePermission` (사용자→역할→권한) |
| 신규 사용자 | 페이지마다 ACL entry 추가 필요 | role 1개만 부여 → 모든 페이지에 자동 적용 |
| owner 개념 | 모든 액션 자동 허용 | 무시 — "내 페이지만 편집" 표현 못함 (한계) |
| 평가 함수 | 30줄 순수 함수 | 사용자 permission 집합 lookup (trivial) |
| 비교의 무게 | 평가 로직 | **데이터 모델 + 매핑 단계** |

---

## File Structure

### Backend (`tutorials-go/wiki-permissions/2-rbac/backend/`)

```
backend/
├── go.mod
├── go.sum
├── main.go
├── domain/
│   ├── user.go                          # User (1편과 동일)
│   ├── page.go                          # Page (1편과 동일, owner_id 의미만 다름)
│   ├── role.go                          # Role 엔티티
│   ├── permission.go                    # Permission 엔티티 + Key()
│   ├── repository.go                    # 인터페이스 모음
│   └── rbac_check.go                    # HasPermission 순수 함수
├── config/
│   ├── db.go                            # SQLite + AutoMigrate (Role/Permission/join 포함)
│   └── seed.go                          # 시드 (사용자 + 페이지 + role + role_permission + user_role)
├── pkg/
│   ├── passwordhash/                    # 1편과 100% 동일
│   └── jwt/                             # 1편과 100% 동일
├── repository/
│   ├── user_repository.go               # 1편과 100% 동일
│   ├── page_repository.go               # 1편 대비 ListAccessibleBy 제거, List 단순화
│   ├── role_repository.go               # 신규
│   ├── permission_repository.go         # 신규 (FindByUserID JOIN 쿼리 핵심)
│   └── *_test.go
├── usecase/
│   ├── auth_usecase.go                  # 1편과 100% 동일
│   ├── rbac.go                          # HasPermission 호출 헬퍼 (또는 repository로 위임)
│   ├── page_usecase.go                  # ACL 평가 → RBAC 평가로 교체
│   ├── role_usecase.go                  # admin이 사용자 role 변경 (assign / revoke / list)
│   └── *_test.go
└── http/
    ├── middleware/
    │   └── jwt_auth.go                  # 1편과 100% 동일
    ├── handler/
    │   ├── auth_handler.go              # 1편과 100% 동일
    │   ├── page_handler.go              # 1편 대비 ACL 매핑 제거
    │   └── role_handler.go              # admin role 관리 핸들러
    └── router.go                        # 라우트 변경
```

### Frontend (`tutorials-go/wiki-permissions/2-rbac/frontend/`)

```
frontend/
├── (Vite scaffold — 1편과 100% 동일)
└── src/
    ├── api/client.ts                    # 1편과 100% 동일
    ├── auth/
    │   ├── AuthContext.tsx              # 1편 대비 user에 roles[] / permissions[] 추가
    │   └── ProtectedRoute.tsx           # 1편과 동일 (인증만 체크)
    ├── components/
    │   ├── Layout.tsx                   # 1편 대비 admin 메뉴 추가 (사용자 role 관리)
    │   └── PermissionGate.tsx           # 신규 — 권한 기반 UI 게이팅
    └── pages/
        ├── LoginPage.tsx                # 1편과 동일
        ├── PageListPage.tsx             # 1편과 동일 (모두에게 모든 페이지 노출)
        ├── PageDetailPage.tsx           # 1편 대비 ShareModal → PermissionGate(pages:edit) 사용
        └── UsersPage.tsx                # admin 전용 — 사용자별 role 변경
```

### Top-level

- `wiki-permissions/2-rbac/README.md` — 2편 시나리오 + 실행 방법
- `wiki-permissions/README.md` — 시리즈 표 업데이트 (2편 "예정" → 정상 링크)

---

## API 명세 (2편 RBAC)

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/auth/login` | public | 로그인 → JWT 발급 + roles/permissions 응답 |
| GET | `/api/me` | 인증 | 현재 사용자 + roles + permissions |
| GET | `/api/pages` | `pages:read` | 페이지 목록 (모든 페이지) |
| GET | `/api/pages/:id` | `pages:read` | 페이지 상세 |
| POST | `/api/pages` | `pages:create` | 페이지 생성 |
| PUT | `/api/pages/:id` | `pages:edit` | 페이지 수정 |
| DELETE | `/api/pages/:id` | `pages:delete` | 페이지 삭제 |
| GET | `/api/users` | admin role | 사용자 목록 + 각자 roles |
| POST | `/api/users/:id/roles` | admin role | 사용자에게 role 부여 |
| DELETE | `/api/users/:id/roles/:roleId` | admin role | 사용자 role 회수 |

> 1편의 ACL 라우트(`/api/pages/:id/acl`) 제거. 대신 사용자 역할 관리 라우트가 그 자리.

---

## 시드 데이터

### 사용자 풀 (1편과 동일)

| Email | 비밀번호 |
|---|---|
| alice@example.com | password |
| bob@example.com | password |
| carol@example.com | password |
| dave@example.com | password |

### 페이지 풀 (1편과 동일)

| Title | owner |
|---|---|
| Engineering Roadmap | alice |
| Q4 Marketing Plan | carol |
| Public Onboarding Guide | alice |

### Role + RolePermission

| role | permissions |
|---|---|
| admin | pages:read, pages:create, pages:edit, pages:delete, users:read, users:manage |
| editor | pages:read, pages:create, pages:edit |
| viewer | pages:read |

### UserRole

| 사용자 | role |
|---|---|
| alice | admin |
| bob | editor |
| carol | viewer |
| dave | viewer |

### 시나리오 매핑

- alice (admin): 모든 페이지 모든 액션 + 사용자 role 관리
- bob (editor): 모든 페이지 read/create/edit, delete 불가
- carol (viewer): 모든 페이지 read만
- dave (viewer): 모든 페이지 read만 (carol과 동등)
- bob이 pages:delete 시도 → 403
- carol이 pages:edit 시도 → 403
- alice가 사용자 role 변경 → 200; bob이 시도 → 403

> 한계 시나리오 (글에서 ABAC 동기로 사용): "**내가 만든 페이지만 수정**" 같은 owner-aware 정책은 RBAC만으로 표현 불가. alice가 만든 페이지를 alice 외 다른 admin이 수정해도 됨.

---

# Phase 0 — 사전 준비

### Task 1: feature 브랜치 + 부모 디렉토리

**Files:**
- Create: `tutorials-go/wiki-permissions/2-rbac/{backend,frontend}/` (디렉토리)

**Steps**:

```bash
cd /Users/user/src/workspace_blog3/tutorials-go
git checkout master && git pull origin master
git checkout -b feature/704-wiki-permissions-rbac
mkdir -p wiki-permissions/2-rbac/backend wiki-permissions/2-rbac/frontend
```

이 task는 디렉토리 scaffolding만이라 commit 없음. 실제 첫 commit은 Task 2의 Go 모듈 초기화부터.

---

# Phase 1 — Backend 인프라

### Task 2: Go 모듈 초기화 + main.go 골격

**Files:**
- Create: `2-rbac/backend/{go.mod, go.sum, main.go}`

**Steps**:

```bash
cd wiki-permissions/2-rbac/backend
go mod init github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend
go get github.com/labstack/echo/v4@latest github.com/labstack/echo/v4/middleware
go get gorm.io/gorm@latest gorm.io/driver/sqlite@latest
go get github.com/golang-jwt/jwt/v5@latest golang.org/x/crypto/bcrypt
go get github.com/stretchr/testify@latest
```

`main.go`는 1편 Task 2와 동일한 health-only 골격으로 시작:

```go
package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	e.Logger.Fatal(e.Start(":8081")) // 2편은 포트 :8081 (1편과 동시 실행 가능)
}
```

> 포트를 `:8081`로 둔 이유: 1편(`:8080`)과 동시에 띄워 비교 시연하기 위해.

**Commit**: `[#704] 2-rbac backend: Go 모듈 초기화 및 health 엔드포인트`

---

### Task 3: 도메인 엔티티 (User, Page, Role, Permission)

**Files:**
- Create: `2-rbac/backend/domain/{user.go, page.go, role.go, permission.go}`

**`user.go`** (1편과 동일):

```go
package domain

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Roles        []Role    `gorm:"many2many:user_roles" json:"roles,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
```

> 1편과 차이: `Roles []Role` 추가. `many2many:user_roles` 태그로 GORM이 join 테이블 자동 생성.

**`page.go`** (1편과 동일):

```go
package domain

import "time"

type Page struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	OwnerID   uint      `gorm:"not null;index:owner_id" json:"owner_id"`
	Owner     *User     `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

> Owner_id는 그대로 유지(메타데이터)이지만 RBAC 평가는 무시.

**`role.go`** (신규):

```go
package domain

import "time"

type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Description string       `gorm:"size:255" json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions" json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
}
```

**`permission.go`** (신규):

```go
package domain

import "time"

type Permission struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Resource  string    `gorm:"size:100;not null;uniqueIndex:idx_resource_action" json:"resource"`
	Action    string    `gorm:"size:100;not null;uniqueIndex:idx_resource_action" json:"action"`
	CreatedAt time.Time `json:"created_at"`
}

// Key는 "resource:action" 형태로 권한을 표현한다 (예: "pages:edit").
func (p Permission) Key() string { return p.Resource + ":" + p.Action }
```

**Commit**: `[#704] 2-rbac backend: 도메인 엔티티 (User, Page, Role, Permission)`

---

### Task 4: DB 연결 + AutoMigrate (TDD)

**Files:**
- Create: `2-rbac/backend/config/db.go`
- Create: `2-rbac/backend/config/db_test.go`

`db.go` 구현 (1편과 패턴 동일, AutoMigrate 대상이 4 엔티티 + 자동 join):

```go
package config

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
)

// OpenDB는 SQLite를 열고 도메인 엔티티(User, Page, Role, Permission)를 AutoMigrate한다.
// many2many 태그가 user_roles, role_permissions 테이블을 자동 생성한다.
func OpenDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&domain.User{}, &domain.Page{}, &domain.Role{}, &domain.Permission{}); err != nil {
		return nil, err
	}
	return db, nil
}
```

`db_test.go`:

```go
package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOpenDB_AutoMigratesAllTables(t *testing.T) {
	db, err := OpenDB(":memory:")
	require.NoError(t, err)

	tables := []string{"users", "pages", "roles", "permissions", "user_roles", "role_permissions"}
	for _, table := range tables {
		assert.True(t, db.Migrator().HasTable(table), "table %s should exist", table)
	}
}
```

**Commit**: `[#704] 2-rbac backend: SQLite + AutoMigrate (4 엔티티 + 2 join 테이블)`

---

### Task 5: bcrypt 헬퍼 (TDD)

**참조: 1편 Task 5와 100% 동일**

`pkg/passwordhash/{hash.go, hash_test.go}` 파일을 1편 코드 그대로 복사. `Hash`/`Verify` 시그니처 동일. GoDoc 동일.

**Commit**: `[#704] 2-rbac backend: bcrypt 비밀번호 해시 헬퍼`

---

### Task 6: JWT 헬퍼 (TDD)

**참조: 1편 Task 6과 100% 동일**

`pkg/jwt/{jwt.go, jwt_test.go}`를 1편 그대로 복사. `Claims`/`Issue`/`Parse` 시그니처 동일. import alias `jwtv5` 동일.

**Commit**: `[#704] 2-rbac backend: JWT 발급/검증 헬퍼`

---

# Phase 2 — Backend 데이터 계층

### Task 7: Repository 인터페이스 (`domain/repository.go`)

```go
package domain

type UserRepository interface {
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
	List() ([]User, error)
	Create(u *User) error
	AssignRole(userID, roleID uint) error
	RevokeRole(userID, roleID uint) error
}

type PageRepository interface {
	FindByID(id uint) (*Page, error)
	List() ([]Page, error)              // 1편의 ListAccessibleBy → List로 단순화
	Create(p *Page) error
	Update(p *Page) error
	Delete(id uint) error
}

type RoleRepository interface {
	FindByID(id uint) (*Role, error)
	FindByName(name string) (*Role, error)
	List() ([]Role, error)
}

type PermissionRepository interface {
	// FindByUserID는 사용자 → role → permission JOIN 결과를 반환한다.
	FindByUserID(userID uint) ([]Permission, error)
}

type ErrNotFound struct{ Resource string }

func (e ErrNotFound) Error() string { return e.Resource + " not found" }
```

**Commit**: `[#704] 2-rbac backend: repository 인터페이스 정의`

---

### Task 8: User repository (TDD)

**Files**: `repository/user_repository.go`, `_test.go`

1편 UserRepository 그대로 + `List`, `AssignRole`, `RevokeRole` 추가:

```go
func (r *UserRepository) List() ([]domain.User, error) {
	var users []domain.User
	err := r.db.Preload("Roles").Order("id ASC").Find(&users).Error
	return users, err
}

func (r *UserRepository) AssignRole(userID, roleID uint) error {
	user := &domain.User{ID: userID}
	role := &domain.Role{ID: roleID}
	return r.db.Model(user).Association("Roles").Append(role)
}

func (r *UserRepository) RevokeRole(userID, roleID uint) error {
	user := &domain.User{ID: userID}
	role := &domain.Role{ID: roleID}
	return r.db.Model(user).Association("Roles").Delete(role)
}
```

`FindByEmail`, `FindByID`도 `Preload("Roles")` 추가하여 사용자 조회 시 role도 함께 로딩.

테스트 (3개):
- `TestUserRepository_CreateAndFindByEmail` (1편 동일)
- `TestUserRepository_AssignAndRevokeRole` — assign 후 List에서 role 보임 → revoke 후 사라짐
- `TestUserRepository_FindByID_NotFound` (1편 동일)

**Commit**: `[#704] 2-rbac backend: UserRepository (List + role assign/revoke 추가)`

---

### Task 9: Page repository (TDD)

**Files**: `repository/page_repository.go`, `_test.go`

1편 PageRepository 단순화 — `ListAccessibleBy` 제거, `List` 추가, `Delete` 추가:

```go
type PageRepository struct{ db *gorm.DB }

var _ domain.PageRepository = (*PageRepository)(nil)

func NewPageRepository(db *gorm.DB) *PageRepository { return &PageRepository{db: db} }

func (r *PageRepository) FindByID(id uint) (*domain.Page, error) {
	var p domain.Page
	if err := r.db.First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "page"}
		}
		return nil, err
	}
	return &p, nil
}

func (r *PageRepository) List() ([]domain.Page, error) {
	var pages []domain.Page
	err := r.db.Order("id ASC").Find(&pages).Error
	return pages, err
}

func (r *PageRepository) Create(p *domain.Page) error { return r.db.Create(p).Error }
func (r *PageRepository) Update(p *domain.Page) error { return r.db.Save(p).Error }
func (r *PageRepository) Delete(id uint) error        { return r.db.Delete(&domain.Page{}, id).Error }
```

테스트:
- `TestPageRepository_List_ReturnsAllPages` — 모든 페이지 반환 (RBAC에서는 권한 필터링이 usecase 단)
- `TestPageRepository_FindByID_NotFound` (1편 동일)
- `TestPageRepository_Delete` — 생성 후 삭제

**Commit**: `[#704] 2-rbac backend: PageRepository (List/Delete 추가, ACL 종속 제거)`

---

### Task 10: Role repository (TDD)

**Files**: `repository/role_repository.go`, `_test.go`

```go
type RoleRepository struct{ db *gorm.DB }

var _ domain.RoleRepository = (*RoleRepository)(nil)

func NewRoleRepository(db *gorm.DB) *RoleRepository { return &RoleRepository{db: db} }

func (r *RoleRepository) FindByID(id uint) (*domain.Role, error) {
	var role domain.Role
	if err := r.db.Preload("Permissions").First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "role"}
		}
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) FindByName(name string) (*domain.Role, error) {
	var role domain.Role
	if err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "role"}
		}
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) List() ([]domain.Role, error) {
	var roles []domain.Role
	err := r.db.Preload("Permissions").Order("id ASC").Find(&roles).Error
	return roles, err
}
```

테스트:
- `TestRoleRepository_FindByName_PreloadsPermissions`
- `TestRoleRepository_FindByID_NotFound`

**Commit**: `[#704] 2-rbac backend: RoleRepository`

---

### Task 11: Permission repository — JOIN 핵심 (TDD)

**Files**: `repository/permission_repository.go`, `_test.go`

이 파일이 RBAC에서 데이터 측면 핵심. user → role → permission 3계층을 한 SQL로 JOIN한다.

```go
type PermissionRepository struct{ db *gorm.DB }

var _ domain.PermissionRepository = (*PermissionRepository)(nil)

func NewPermissionRepository(db *gorm.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

// FindByUserID는 사용자 → role → permission 3-hop JOIN으로 권한을 모은다.
// 같은 permission이 여러 role에 묶여 중복될 수 있어 Distinct로 정리한다.
func (r *PermissionRepository) FindByUserID(userID uint) ([]domain.Permission, error) {
	var perms []domain.Permission
	err := r.db.
		Distinct("permissions.*").
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Joins("JOIN user_roles ON user_roles.role_id = role_permissions.role_id").
		Where("user_roles.user_id = ?", userID).
		Order("permissions.resource, permissions.action").
		Find(&perms).Error
	return perms, err
}
```

테스트 (시드 사용):
- `TestPermissionRepository_FindByUserID_AdminGetsAll` — alice(admin) → 6개 permission
- `TestPermissionRepository_FindByUserID_ViewerGetsRead` — carol(viewer) → 1개 (pages:read)
- `TestPermissionRepository_FindByUserID_DistinctOnMultipleRoles` — 한 사용자에게 여러 role 부여 시 중복 permission 한 번만

**Commit**: `[#704] 2-rbac backend: PermissionRepository (user→role→permission JOIN)`

---

### Task 12: 시드 데이터 (TDD)

**Files**: `config/seed.go`, `_test.go`

시드 순서:

```go
package config

import (
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/pkg/passwordhash"
)

// Seed는 RBAC 시리즈 2편 시연을 위한 데이터를 삽입한다 (idempotent).
//   사용자 4 + 페이지 3 + Permission 6 + Role 3 + RolePermission 매트릭스 + UserRole 매핑.
func Seed(db *gorm.DB) error {
	// 1) Users (1편과 동일 패턴)
	hash, err := passwordhash.Hash("password")
	if err != nil {
		return err
	}
	users := []domain.User{
		{Email: "alice@example.com", Name: "Alice", PasswordHash: hash},
		{Email: "bob@example.com", Name: "Bob", PasswordHash: hash},
		{Email: "carol@example.com", Name: "Carol", PasswordHash: hash},
		{Email: "dave@example.com", Name: "Dave", PasswordHash: hash},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&users).Error; err != nil {
		return err
	}
	byEmail := map[string]uint{}
	for _, u := range users {
		var found domain.User
		if err := db.Where("email = ?", u.Email).First(&found).Error; err != nil {
			return err
		}
		byEmail[u.Email] = found.ID
	}

	// 2) Pages (1편 lookup-or-create 패턴)
	pageSpecs := []domain.Page{
		{Title: "Engineering Roadmap", Content: "...", OwnerID: byEmail["alice@example.com"]},
		{Title: "Q4 Marketing Plan", Content: "...", OwnerID: byEmail["carol@example.com"]},
		{Title: "Public Onboarding Guide", Content: "...", OwnerID: byEmail["alice@example.com"]},
	}
	for _, p := range pageSpecs {
		var found domain.Page
		err := db.Where("title = ? AND owner_id = ?", p.Title, p.OwnerID).First(&found).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			created := p
			if err := db.Create(&created).Error; err != nil {
				return err
			}
		}
	}

	// 3) Permissions (idx_resource_action unique → OnConflict)
	permSpecs := []domain.Permission{
		{Resource: "pages", Action: "read"},
		{Resource: "pages", Action: "create"},
		{Resource: "pages", Action: "edit"},
		{Resource: "pages", Action: "delete"},
		{Resource: "users", Action: "read"},
		{Resource: "users", Action: "manage"},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&permSpecs).Error; err != nil {
		return err
	}
	permByKey := map[string]uint{}
	for _, p := range permSpecs {
		var found domain.Permission
		if err := db.Where("resource = ? AND action = ?", p.Resource, p.Action).First(&found).Error; err != nil {
			return err
		}
		permByKey[p.Key()] = found.ID
	}

	// 4) Roles
	roleSpecs := []domain.Role{
		{Name: "admin", Description: "All permissions"},
		{Name: "editor", Description: "Pages CRUD except delete"},
		{Name: "viewer", Description: "Read pages only"},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&roleSpecs).Error; err != nil {
		return err
	}
	roleByName := map[string]uint{}
	for _, r := range roleSpecs {
		var found domain.Role
		if err := db.Where("name = ?", r.Name).First(&found).Error; err != nil {
			return err
		}
		roleByName[r.Name] = found.ID
	}

	// 5) RolePermission 매트릭스
	matrix := map[string][]string{
		"admin":  {"pages:read", "pages:create", "pages:edit", "pages:delete", "users:read", "users:manage"},
		"editor": {"pages:read", "pages:create", "pages:edit"},
		"viewer": {"pages:read"},
	}
	for roleName, keys := range matrix {
		role := &domain.Role{ID: roleByName[roleName]}
		for _, k := range keys {
			perm := &domain.Permission{ID: permByKey[k]}
			if err := db.Model(role).Association("Permissions").Append(perm); err != nil {
				return err
			}
		}
	}

	// 6) UserRole 매트릭스
	userRoles := map[string]string{
		"alice@example.com": "admin",
		"bob@example.com":   "editor",
		"carol@example.com": "viewer",
		"dave@example.com":  "viewer",
	}
	for email, roleName := range userRoles {
		user := &domain.User{ID: byEmail[email]}
		role := &domain.Role{ID: roleByName[roleName]}
		if err := db.Model(user).Association("Roles").Append(role); err != nil {
			return err
		}
	}

	return nil
}
```

> **idempotency 주의**: GORM `Association.Append`는 중복 호출 시 join 테이블에 중복 row를 만들 수 있다. 두 번째 시드 실행 시 user_roles, role_permissions에 중복이 생기지 않도록 GORM 버전이 자동 dedup 하는지 확인 필요. 만약 안 되면 `Replace` 또는 lookup-or-create 패턴으로 변경.

테스트:
- `TestSeed_PopulatesAll` — counts: 4 users / 3 pages / 6 permissions / 3 roles / 4 user_roles / 10 role_permissions (admin 6 + editor 3 + viewer 1)
- `TestSeed_Idempotent` — 두 번 호출 후 count 동일

**Commit**: `[#704] 2-rbac backend: 시드 데이터 (사용자4 + 페이지3 + role3 + permission6 + 매트릭스)`

---

# Phase 3 — Backend 비즈니스 계층

### Task 13: Auth usecase

**참조: 1편 Task 12와 거의 동일**

차이점: `Login` 응답에 user의 roles + permissions 포함. JWT 발급은 동일 (user_id만 토큰에 담음 — permissions는 매 요청 시 DB에서 조회).

```go
package usecase

import (
	"errors"
	"time"

	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
	jwthelper "github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/pkg/jwt"
	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/pkg/passwordhash"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

// LoginResult는 access token + 사용자 + 권한 정보를 포함한다.
type LoginResult struct {
	Token       string
	User        *domain.User
	Permissions []domain.Permission
}

type AuthUsecase struct {
	users     domain.UserRepository
	perms     domain.PermissionRepository
	jwtSecret string
	tokenTTL  time.Duration
}

func NewAuthUsecase(users domain.UserRepository, perms domain.PermissionRepository, secret string, ttl time.Duration) *AuthUsecase {
	return &AuthUsecase{users: users, perms: perms, jwtSecret: secret, tokenTTL: ttl}
}

func (u *AuthUsecase) Login(email, plainPassword string) (*LoginResult, error) {
	found, err := u.users.FindByEmail(email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	if !passwordhash.Verify(plainPassword, found.PasswordHash) {
		return nil, ErrInvalidCredentials
	}
	tok, err := jwthelper.Issue(found.ID, u.jwtSecret, u.tokenTTL)
	if err != nil {
		return nil, err
	}
	perms, err := u.perms.FindByUserID(found.ID)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: tok, User: found, Permissions: perms}, nil
}
```

테스트 3개 (Login_Success, Login_WrongPassword, Login_UserNotFound) — 1편과 동일 패턴 + Permissions 검증.

**Commit**: `[#704] 2-rbac backend: AuthUsecase (login + permissions 응답)`

---

### Task 14: RBAC 평가 함수 + Page usecase

**Files:** `usecase/page_usecase.go`, `_test.go`

Permission lookup이 trivial해 별도 `EvaluateRBAC` 함수 대신 inline:

```go
package usecase

import (
	"errors"

	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
)

var ErrForbidden = errors.New("forbidden")

// HasPermission은 사용자의 permission 집합에 want("resource:action")가 포함되는지 확인한다.
func HasPermission(perms []domain.Permission, want string) bool {
	for _, p := range perms {
		if p.Key() == want {
			return true
		}
	}
	return false
}

type PageUsecase struct {
	pages domain.PageRepository
	perms domain.PermissionRepository
}

func NewPageUsecase(pages domain.PageRepository, perms domain.PermissionRepository) *PageUsecase {
	return &PageUsecase{pages: pages, perms: perms}
}

func (u *PageUsecase) requirePerm(userID uint, want string) error {
	ps, err := u.perms.FindByUserID(userID)
	if err != nil {
		return err
	}
	if !HasPermission(ps, want) {
		return ErrForbidden
	}
	return nil
}

func (u *PageUsecase) List(userID uint) ([]domain.Page, error) {
	if err := u.requirePerm(userID, "pages:read"); err != nil {
		return nil, err
	}
	return u.pages.List()
}

func (u *PageUsecase) Get(pageID, userID uint) (*domain.Page, error) {
	if err := u.requirePerm(userID, "pages:read"); err != nil {
		return nil, err
	}
	return u.pages.FindByID(pageID)
}

func (u *PageUsecase) Create(userID uint, title, content string) (*domain.Page, error) {
	if err := u.requirePerm(userID, "pages:create"); err != nil {
		return nil, err
	}
	p := &domain.Page{Title: title, Content: content, OwnerID: userID}
	if err := u.pages.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (u *PageUsecase) Update(pageID, userID uint, title, content string) (*domain.Page, error) {
	if err := u.requirePerm(userID, "pages:edit"); err != nil {
		return nil, err
	}
	page, err := u.pages.FindByID(pageID)
	if err != nil {
		return nil, err
	}
	page.Title = title
	page.Content = content
	if err := u.pages.Update(page); err != nil {
		return nil, err
	}
	return page, nil
}

func (u *PageUsecase) Delete(pageID, userID uint) error {
	if err := u.requirePerm(userID, "pages:delete"); err != nil {
		return err
	}
	return u.pages.Delete(pageID)
}
```

테스트 (시드 사용 — alice/bob/carol):
- `TestPageUsecase_List_AnyAuthenticatedReadsAll` — alice/bob/carol/dave 모두 List 성공
- `TestPageUsecase_Update_RequiresEdit` — bob(editor) OK; carol(viewer) Forbidden
- `TestPageUsecase_Delete_OnlyAdmin` — alice(admin) OK; bob(editor) Forbidden
- `TestPageUsecase_Create_RequiresCreate` — alice/bob OK; carol Forbidden
- `TestHasPermission_Lookup` — 순수 함수 단위 테스트

**Commit**: `[#704] 2-rbac backend: PageUsecase + HasPermission (RBAC 통합)`

---

### Task 15: Role usecase (admin 전용 사용자 role 관리)

**Files**: `usecase/role_usecase.go`, `_test.go`

```go
package usecase

import (
	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
)

type RoleUsecase struct {
	users domain.UserRepository
	roles domain.RoleRepository
	perms domain.PermissionRepository
}

func NewRoleUsecase(users domain.UserRepository, roles domain.RoleRepository, perms domain.PermissionRepository) *RoleUsecase {
	return &RoleUsecase{users: users, roles: roles, perms: perms}
}

func (u *RoleUsecase) requireAdmin(userID uint) error {
	ps, err := u.perms.FindByUserID(userID)
	if err != nil {
		return err
	}
	if !HasPermission(ps, "users:manage") {
		return ErrForbidden
	}
	return nil
}

func (u *RoleUsecase) ListUsers(requesterID uint) ([]domain.User, error) {
	if err := u.requireAdmin(requesterID); err != nil {
		return nil, err
	}
	return u.users.List()
}

func (u *RoleUsecase) ListRoles(requesterID uint) ([]domain.Role, error) {
	if err := u.requireAdmin(requesterID); err != nil {
		return nil, err
	}
	return u.roles.List()
}

func (u *RoleUsecase) AssignRole(requesterID, targetUserID, roleID uint) error {
	if err := u.requireAdmin(requesterID); err != nil {
		return err
	}
	return u.users.AssignRole(targetUserID, roleID)
}

func (u *RoleUsecase) RevokeRole(requesterID, targetUserID, roleID uint) error {
	if err := u.requireAdmin(requesterID); err != nil {
		return err
	}
	return u.users.RevokeRole(targetUserID, roleID)
}
```

테스트 (시드 사용):
- `TestRoleUsecase_AssignRole_AdminOK_OthersForbidden`
- `TestRoleUsecase_RevokeRole_AdminOK_OthersForbidden`
- `TestRoleUsecase_ListUsers_AdminOnly`

**Commit**: `[#704] 2-rbac backend: RoleUsecase (admin 사용자 role 관리)`

---

# Phase 4 — Backend HTTP 계층

### Task 16: JWT 인증 미들웨어 (TDD)

**참조: 1편 Task 16과 100% 동일** (`http/middleware/jwt_auth.go`).

**Commit**: `[#704] 2-rbac backend: JWT 인증 미들웨어`

---

### Task 17: Auth handler

`http/handler/auth_handler.go`:

```go
package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/2-rbac/backend/usecase"
)

type AuthHandler struct{ auth *usecase.AuthUsecase }

func NewAuthHandler(auth *usecase.AuthUsecase) *AuthHandler { return &AuthHandler{auth: auth} }

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginUser struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type loginResponse struct {
	Token       string             `json:"token"`
	User        loginUser          `json:"user"`
	Permissions []string           `json:"permissions"`
	Roles       []domain.Role      `json:"roles"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	res, err := h.auth.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	permKeys := make([]string, 0, len(res.Permissions))
	for _, p := range res.Permissions {
		permKeys = append(permKeys, p.Key())
	}
	return c.JSON(http.StatusOK, loginResponse{
		Token:       res.Token,
		User:        loginUser{ID: res.User.ID, Email: res.User.Email, Name: res.User.Name},
		Permissions: permKeys,
		Roles:       res.User.Roles,
	})
}
```

**Commit**: `[#704] 2-rbac backend: AuthHandler (POST /auth/login + permissions 응답)`

---

### Task 18: Page handler

1편 Task 18 패턴 + RBAC 차이 (Create/Delete 추가, ACL 매핑 제거):

```go
// (생략) Get/List/Create/Update/Delete 5개 핸들러
// 모두 mw.UserIDFrom(c)으로 user_id 추출 후 usecase 호출
// 에러 매핑: ErrForbidden → 403, ErrNotFound → 404, 그 외 → 500
```

**Commit**: `[#704] 2-rbac backend: PageHandler (List/Get/Create/Update/Delete)`

---

### Task 19: Role handler (admin 전용)

`http/handler/role_handler.go`:

```go
// Endpoints:
//   GET  /api/users
//   POST /api/users/:id/roles      body: {role_id: 1}
//   DELETE /api/users/:id/roles/:roleId
//   GET  /api/roles
// 모두 admin role 필요 (usecase 단에서 검증)
```

**Commit**: `[#704] 2-rbac backend: RoleHandler (admin 사용자 role 관리)`

---

### Task 20: 라우터 + main.go

1편 Task 20 패턴. 라우트 매핑이 다름:

```go
e.POST("/auth/login", d.Auth.Login)

api := e.Group("/api", middleware.JWTAuth(d.JWTSecret))
api.GET("/me", d.Auth.Me) // 현재 사용자 + 권한 (선택, 또는 생략)

// pages
api.GET("/pages", d.Page.List)
api.GET("/pages/:id", d.Page.Get)
api.POST("/pages", d.Page.Create)
api.PUT("/pages/:id", d.Page.Update)
api.DELETE("/pages/:id", d.Page.Delete)

// users (admin)
api.GET("/users", d.Role.ListUsers)
api.POST("/users/:id/roles", d.Role.Assign)
api.DELETE("/users/:id/roles/:roleId", d.Role.Revoke)
api.GET("/roles", d.Role.ListRoles)
```

main.go: 1편과 동일 패턴, port `:8081`, DB `wiki-rbac.db`.

**Commit**: `[#704] 2-rbac backend: 라우터 + main.go 통합`

---

### Task 21: Backend README

1편 README와 같은 형식 + RBAC 설명:

```markdown
# 2-rbac backend

Go + Echo + GORM + SQLite 기반 RBAC 풀스택 샘플 백엔드.

## 시드 계정 (모두 비밀번호 password)

| Email | Role | 가능한 액션 |
|---|---|---|
| alice@example.com | admin | 모든 페이지 모든 액션 + 사용자 role 관리 |
| bob@example.com | editor | 페이지 read/create/edit |
| carol@example.com | viewer | 페이지 read만 |
| dave@example.com | viewer | 페이지 read만 |

## 엔드포인트 (생략 — 위 API 명세 표 참고)

## 1편(ACL)과의 차이점 표 (생략)
```

**Commit**: `[#704] 2-rbac backend: README 작성`

---

# Phase 5 — Frontend 인프라

### Task 22: Vite + React + Tailwind 초기화

**참조: 1편 Task 22와 100% 동일** (포트만 `3001`로 — 1편 frontend와 동시 실행 가능).

**Commit**: `[#704] 2-rbac frontend: Vite + React 19 + TS + Tailwind v4 초기화`

---

### Task 23: API client

**참조: 1편 Task 23과 100% 동일** (`src/api/client.ts`).

**Commit**: `[#704] 2-rbac frontend: API 클라이언트`

---

### Task 24: AuthContext (1편 + permissions 추가)

`src/auth/AuthContext.tsx` — 1편 base + `permissions: string[]` 추가:

```tsx
export interface User {
  id: number;
  email: string;
  name: string;
  permissions: string[];
  roles: { id: number; name: string }[];
}

// login 응답에서 permissions / roles까지 저장
```

**Commit**: `[#704] 2-rbac frontend: AuthContext (permissions/roles 포함)`

---

### Task 25: ProtectedRoute + LoginPage

**참조: 1편 Task 25와 100% 동일.**

**Commit**: `[#704] 2-rbac frontend: ProtectedRoute + LoginPage`

---

# Phase 6 — Frontend 화면

### Task 26: PermissionGate + Layout

`src/components/PermissionGate.tsx`:

```tsx
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Props {
  permission: string;
  children: ReactNode;
}

// PermissionGate는 사용자가 want permission을 가졌을 때만 children을 렌더링한다.
// (예: <PermissionGate permission="pages:edit">편집 버튼</PermissionGate>)
export default function PermissionGate({ permission, children }: Props) {
  const { user } = useAuth();
  if (!user?.permissions.includes(permission)) return null;
  return <>{children}</>;
}
```

Layout — 1편 base + admin 메뉴 추가 (`PermissionGate permission="users:manage"`로 게이팅):

```tsx
<nav>
  <NavLink to="/pages">페이지</NavLink>
  <PermissionGate permission="users:manage">
    <NavLink to="/users">사용자 관리</NavLink>
  </PermissionGate>
</nav>
```

**Commit**: `[#704] 2-rbac frontend: PermissionGate + Layout (admin 메뉴 게이팅)`

---

### Task 27: 페이지 목록 + 상세

`PageListPage.tsx` — 1편과 거의 동일 (모든 페이지 노출).

`PageDetailPage.tsx` — 1편 base + RBAC 게이팅:

```tsx
<PermissionGate permission="pages:edit">
  <button>편집</button>
</PermissionGate>
<PermissionGate permission="pages:delete">
  <button>삭제</button>
</PermissionGate>
```

**Commit**: `[#704] 2-rbac frontend: 페이지 목록 + 상세 (PermissionGate 적용)`

---

### Task 28: UsersPage (admin 전용)

```tsx
// admin이 사용자 목록을 보고 role을 추가/제거.
// /api/users로 사용자 + 현재 role 가져옴.
// /api/roles로 role 목록 가져옴.
// drop-down으로 role 선택 + assign/revoke 버튼.
```

**Commit**: `[#704] 2-rbac frontend: UsersPage (admin 사용자 role 관리)`

---

### Task 29: App.tsx 라우터

```tsx
<Route path="/login" element={<LoginPage />} />
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="/pages" element={<PageListPage />} />
  <Route path="/pages/:id" element={<PageDetailPage />} />
  <Route path="/users" element={<UsersPage />} />
  <Route index element={<Navigate to="/pages" replace />} />
</Route>
```

> `/users`는 `PermissionGate`로 메뉴는 가려지지만 라우트는 누구나 접근 가능. 서버가 403 응답 → 화면이 비어 보임. 또는 추가 가드 컴포넌트로 메뉴 미노출 사용자 진입 시 `/pages`로 리다이렉트.

**Commit**: `[#704] 2-rbac frontend: 라우터 통합`

---

### Task 30: README들

- `2-rbac/frontend/README.md` — 1편 패턴
- `2-rbac/README.md` — 2편 시나리오 + 1편/3편 링크
- `wiki-permissions/README.md` 보강 — "2편 (예정)" 표기 제거 + 2편 디렉토리 링크화

**Commit**: `[#704] 2-rbac: README 작성 (frontend, 2편 통합, 부모 보강)`

---

# Phase 7 — PR 생성

### Task 31: 최종 검증 + push + PR

1편 Task 31과 동일 흐름:

1. backend: `go test ./...` + `go build ./...` + `go vet` + `gofmt -l .`
2. frontend: `npm run build`
3. 인코딩 일괄 확인 (한글 .md, node_modules 제외)
4. push: `feature/704-wiki-permissions-rbac`
5. PR: `[#704] feat: wiki-permissions 2편 RBAC 풀스택 샘플 코드`
6. reviewer: kenshin579

PR 본문에 1편/2편 비교 표 + 시드 시나리오 + 후속 작업(2편 글, 3편) 포함.

---

## 자체 검증 사항 (실행자가 PR 전 확인)

- [ ] backend `go test ./...` PASS (config/domain/repository/usecase/middleware 모두)
- [ ] backend `go build ./...` 무에러
- [ ] frontend `npm run build` 무에러
- [ ] backend + frontend 동시 실행 시 alice 로그인 → 모든 메뉴 + 페이지 + 사용자 관리 보임
- [ ] bob 로그인 → 페이지 편집 가능, 삭제 불가, 사용자 관리 메뉴 안 보임
- [ ] carol 로그인 → 페이지 읽기만 가능
- [ ] alice가 사용자 관리에서 dave에게 admin role 부여 → dave 재로그인 시 사용자 관리 메뉴 노출
- [ ] 모든 한글 .md UTF-8

---

## 1편과의 차이 요약 (실행자 참고)

| 영역 | 1편 ACL | 2편 RBAC |
|---|---|---|
| 도메인 추가 | ACLEntry 1테이블 | Role / Permission 2테이블 + 자동 join 2테이블 |
| 평가 함수 | `EvaluateACL` 30줄 순수 함수 (owner short-circuit + edit→read 함의) | `HasPermission(perms, "resource:action")` 한 줄 lookup |
| 핵심 SQL | LEFT JOIN acl_entries (ListAccessibleBy) | JOIN role_permissions + JOIN user_roles (FindByUserID) |
| 미들웨어 | JWT only | JWT only — RBAC은 usecase에서 |
| Frontend 게이팅 | 없음 (모든 사용자에게 편집 버튼 노출) | `PermissionGate` 컴포넌트로 사전 게이팅 |
| 시드 권한 데이터 | ACL entry 7개 | Role 3 + Permission 6 + RolePermission 10 + UserRole 4 |
| owner 처리 | owner_id로 short-circuit (모든 액션 허용) | owner_id 무시 — 메타데이터 |
| 한계 시나리오 | 사용자/페이지 cross product 폭발 | "내 페이지만 수정" 표현 불가 (다음 편 ABAC 동기) |

## Notes

- 본 plan은 2편(RBAC) 코드에 한정한다. 글 draft, 3편(ABAC)은 별도 plan.
- 1편과 같은 파일/패턴은 짧게 참조 처리했다 — 실행자는 1편 plan(`2026-05-01-wiki-permissions-1-acl.md`)과 머지된 1편 코드를 reference로 사용해도 된다.
- 시리즈의 비교 메시지(평가가 단순해지는 대신 데이터 모델이 풍부해진다)를 코드 차원에서 드러내는 것이 목적이다.
