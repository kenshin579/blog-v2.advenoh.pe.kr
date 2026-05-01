# wiki-permissions 시리즈 1편 (ACL) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사내 위키 시나리오 위에서 ACL(Access Control List) 권한 모델을 풀스택(Go + React)으로 구현해 "페이지마다 사용자에게 read/edit 권한 직접 부여" 시나리오를 실행 가능한 코드로 보여준다.

**Architecture:** Backend는 Go + Echo + GORM + SQLite의 4계층(domain → repository → usecase → handler) + JWT 인증 미들웨어 + ACL 검증 미들웨어. ACL 검증은 미들웨어 단에서 path id로 page를 식별 → ACLEntry 조회 → action 매칭. Frontend는 React 19 + TS + Tailwind v4, AuthContext로 토큰 관리, 페이지 목록·상세·ShareModal로 권한 UX 시연.

**Tech Stack:** Go 1.25, Echo v4, GORM v1.25.x, mattn/go-sqlite3, golang-jwt/jwt v5, golang.org/x/crypto/bcrypt; React 19, TypeScript, Vite 6, React Router v7, Axios, Tailwind CSS v4.

**작업 위치**: `tutorials-go/wiki-permissions/1-acl/{backend,frontend}/`
**브랜치**: `feature/704-wiki-permissions-acl`
**트래킹 이슈**: `kenshin579/tutorials-go#704`
**Spec**: `docs/superpowers/specs/2026-05-01-wiki-permissions-design.md` (PR #475)

---

## File Structure

### Backend (`tutorials-go/wiki-permissions/1-acl/backend/`)

```
backend/
├── go.mod
├── go.sum
├── main.go                              # 앱 진입점
├── domain/
│   ├── user.go                          # User 엔티티
│   ├── page.go                          # Page 엔티티
│   ├── acl_entry.go                     # ACLEntry 엔티티 + Action enum
│   └── repository.go                    # Repository 인터페이스 모음
├── config/
│   ├── db.go                            # SQLite 연결 + AutoMigrate
│   └── seed.go                          # 시드 데이터 삽입
├── pkg/
│   ├── passwordhash/
│   │   ├── hash.go
│   │   └── hash_test.go
│   └── jwt/
│       ├── jwt.go
│       └── jwt_test.go
├── repository/
│   ├── user_repository.go
│   ├── user_repository_test.go
│   ├── page_repository.go
│   ├── page_repository_test.go
│   ├── acl_repository.go
│   └── acl_repository_test.go
├── usecase/
│   ├── auth_usecase.go
│   ├── auth_usecase_test.go
│   ├── page_usecase.go
│   ├── page_usecase_test.go
│   ├── acl_usecase.go
│   └── acl_usecase_test.go
└── http/
    ├── middleware/
    │   ├── jwt_auth.go
    │   ├── jwt_auth_test.go
    │   ├── acl.go
    │   └── acl_test.go
    ├── handler/
    │   ├── auth_handler.go
    │   ├── page_handler.go
    │   └── acl_handler.go
    └── router.go
```

### Frontend (`tutorials-go/wiki-permissions/1-acl/frontend/`)

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts (or v4 css 기반)
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   └── client.ts                    # Axios + 토큰 인터셉터
    ├── auth/
    │   ├── AuthContext.tsx
    │   └── ProtectedRoute.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── PageListPage.tsx
    │   └── PageDetailPage.tsx
    └── components/
        ├── Layout.tsx
        └── ShareModal.tsx
```

### Top-level READMEs

- `tutorials-go/wiki-permissions/README.md` — 시리즈 개요 + 비교 표 + 디렉토리 가이드
- `tutorials-go/wiki-permissions/1-acl/README.md` — 1편 시나리오 + 실행 방법

---

## API 명세 (1편 ACL)

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/auth/login` | public | 로그인 → JWT 발급 |
| GET | `/api/pages` | 인증 | 본인이 access 가능한 페이지 목록 |
| GET | `/api/pages/:id` | ACL `read` | 페이지 상세 |
| PUT | `/api/pages/:id` | ACL `edit` | 페이지 수정 |
| GET | `/api/pages/:id/acl` | 페이지 owner | 공유 목록 |
| POST | `/api/pages/:id/acl` | 페이지 owner | 권한 부여 |
| DELETE | `/api/pages/:id/acl/:userId` | 페이지 owner | 권한 회수 |

ACL 검증 규칙: 페이지 owner는 모든 action 가능. 그 외 사용자는 ACLEntry에 명시된 action만 가능. `read` 권한은 `edit` 권한이 있으면 자동 충족.

---

## 시드 데이터

| 사용자 | 비밀번호(평문, bcrypt 해시) |
|---|---|
| alice@example.com | `password` |
| bob@example.com | `password` |
| carol@example.com | `password` |
| dave@example.com | `password` |

| 페이지 | owner |
|---|---|
| Engineering Roadmap | alice |
| Q4 Marketing Plan | carol |
| Public Onboarding Guide | alice |

| ACL entries |
|---|
| Engineering Roadmap → bob: edit, carol: read |
| Q4 Marketing Plan → alice: read, bob: read |
| Public Onboarding Guide → bob: read, carol: read, dave: read |

테스트 케이스 매핑:
- alice가 Q4 Marketing Plan: ACL `read` 있음 → GET 가능, PUT 불가
- bob이 Engineering Roadmap: ACL `edit` 있음 → GET/PUT 가능
- dave가 Engineering Roadmap: ACL 없음 → GET/PUT 모두 403
- carol이 Q4 Marketing Plan: owner → 모두 가능
- alice가 자기 페이지 EngineeringRoadmap: owner → 모두 가능
- carol이 EngineeringRoadmap에 grant 시도 → 소유자 아님 → 403

---

# Phase 0 — 사전 준비

### Task 1: feature 브랜치 + 부모 디렉토리 생성

**Files:**
- Create: `tutorials-go/wiki-permissions/README.md` (자리표시 — 마지막 task에서 채움)
- Create: `tutorials-go/wiki-permissions/1-acl/` (디렉토리)

- [ ] **Step 1: feature 브랜치 생성**

```bash
cd /Users/user/src/workspace_blog3/tutorials-go
git checkout master && git pull origin master
git checkout -b feature/704-wiki-permissions-acl
```

- [ ] **Step 2: 부모 디렉토리 + 임시 README**

```bash
mkdir -p wiki-permissions/1-acl/backend
mkdir -p wiki-permissions/1-acl/frontend
```

`wiki-permissions/README.md` 내용 (최소 자리표시, 마지막에 보강):

```markdown
# wiki-permissions — 웹 권한 모델 비교 시리즈 (ACL/RBAC/ABAC)

블로그 시리즈 "웹 애플리케이션 권한 모델 비교 — ACL/RBAC/ABAC"의 샘플 코드.

| 편 | 디렉토리 | 모델 |
|---|---|---|
| 1편 | [`1-acl/`](./1-acl/) | Access Control List |
| 2편 | `2-rbac/` (예정) | Role-Based Access Control |
| 3편 | `3-abac/` (예정) | Attribute-Based Access Control |
```

- [ ] **Step 3: 첫 커밋**

```bash
git add wiki-permissions/README.md
git commit -m "[#704] wiki-permissions 부모 디렉토리 + README 자리표시"
```

---

# Phase 1 — Backend 인프라

### Task 2: Go 모듈 초기화 + main.go 골격

**Files:**
- Create: `tutorials-go/wiki-permissions/1-acl/backend/go.mod`
- Create: `tutorials-go/wiki-permissions/1-acl/backend/main.go`

- [ ] **Step 1: Go 모듈 초기화**

```bash
cd wiki-permissions/1-acl/backend
go mod init github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend
```

- [ ] **Step 2: 의존성 추가**

```bash
go get github.com/labstack/echo/v4@latest
go get github.com/labstack/echo/v4/middleware
go get gorm.io/gorm@latest
go get gorm.io/driver/sqlite@latest
go get github.com/golang-jwt/jwt/v5@latest
go get golang.org/x/crypto/bcrypt
go get github.com/stretchr/testify@latest
```

- [ ] **Step 3: 최소 main.go**

`main.go`:

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
	e.Logger.Fatal(e.Start(":8080"))
}
```

- [ ] **Step 4: 빌드/실행 검증**

Run:
```bash
go build ./...
go run main.go &
sleep 1
curl -s localhost:8080/health
kill %1
```
Expected: `{"status":"ok"}`

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/{go.mod,go.sum,main.go}
git commit -m "[#704] 1-acl backend: Go 모듈 초기화 및 health 엔드포인트"
```

---

### Task 3: 도메인 엔티티 (User, Page, ACLEntry)

**Files:**
- Create: `backend/domain/user.go`
- Create: `backend/domain/page.go`
- Create: `backend/domain/acl_entry.go`

- [ ] **Step 1: User 엔티티**

`domain/user.go`:

```go
package domain

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
```

- [ ] **Step 2: Page 엔티티**

`domain/page.go`:

```go
package domain

import "time"

type Page struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	OwnerID   uint      `gorm:"not null;index" json:"owner_id"`
	Owner     *User     `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

- [ ] **Step 3: ACLEntry 엔티티 + Action enum**

`domain/acl_entry.go`:

```go
package domain

import "time"

type Action string

const (
	ActionRead Action = "read"
	ActionEdit Action = "edit"
)

func (a Action) Valid() bool {
	return a == ActionRead || a == ActionEdit
}

// ACLEntry: 한 사용자의 한 페이지에 대한 한 action 권한.
// (page_id, user_id, action) 복합 unique 인덱스로 중복 방지.
type ACLEntry struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PageID    uint      `gorm:"not null;uniqueIndex:idx_page_user_action" json:"page_id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_page_user_action" json:"user_id"`
	Action    Action    `gorm:"size:20;not null;uniqueIndex:idx_page_user_action" json:"action"`
	CreatedAt time.Time `json:"created_at"`
}
```

- [ ] **Step 4: 빌드 검증**

Run: `go build ./...`
Expected: 무에러 빌드.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/domain/
git commit -m "[#704] 1-acl backend: 도메인 엔티티 (User, Page, ACLEntry)"
```

---

### Task 4: DB 연결 + AutoMigrate

**Files:**
- Create: `backend/config/db.go`
- Create: `backend/config/db_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`config/db_test.go`:

```go
package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func TestOpenDB_AutoMigratesAllTables(t *testing.T) {
	db, err := OpenDB(":memory:")
	require.NoError(t, err)

	tables := []string{"users", "pages", "acl_entries"}
	for _, table := range tables {
		assert.True(t, db.Migrator().HasTable(table), "table %s should exist", table)
	}

	// FK indexes
	assert.True(t, db.Migrator().HasIndex(&domain.Page{}, "owner_id"))
	assert.True(t, db.Migrator().HasIndex(&domain.ACLEntry{}, "idx_page_user_action"))

	sqlDB, err := db.DB()
	require.NoError(t, err)
	assert.NoError(t, sqlDB.Close())
	_ = (*gorm.DB)(nil)
}
```

- [ ] **Step 2: 테스트 실행 → 컴파일 실패 확인**

Run: `go test ./config/...`
Expected: FAIL — `OpenDB` undefined.

- [ ] **Step 3: 구현**

`config/db.go`:

```go
package config

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func OpenDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&domain.User{}, &domain.Page{}, &domain.ACLEntry{}); err != nil {
		return nil, err
	}
	return db, nil
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `go test ./config/... -v`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/config/
git commit -m "[#704] 1-acl backend: SQLite 연결 + AutoMigrate"
```

---

### Task 5: bcrypt 비밀번호 해시 헬퍼

**Files:**
- Create: `backend/pkg/passwordhash/hash.go`
- Create: `backend/pkg/passwordhash/hash_test.go`

- [ ] **Step 1: 실패하는 테스트**

`pkg/passwordhash/hash_test.go`:

```go
package passwordhash

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashAndVerify(t *testing.T) {
	hash, err := Hash("password")
	require.NoError(t, err)
	assert.NotEqual(t, "password", hash)
	assert.True(t, Verify("password", hash))
	assert.False(t, Verify("wrong", hash))
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./pkg/passwordhash/...`
Expected: FAIL — undefined.

- [ ] **Step 3: 구현**

`pkg/passwordhash/hash.go`:

```go
package passwordhash

import "golang.org/x/crypto/bcrypt"

func Hash(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func Verify(plain, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./pkg/passwordhash/... -v`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/pkg/passwordhash/
git commit -m "[#704] 1-acl backend: bcrypt 비밀번호 해시 헬퍼"
```

---

### Task 6: JWT 발급/검증 헬퍼

**Files:**
- Create: `backend/pkg/jwt/jwt.go`
- Create: `backend/pkg/jwt/jwt_test.go`

- [ ] **Step 1: 실패하는 테스트**

`pkg/jwt/jwt_test.go`:

```go
package jwt

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIssueAndParse(t *testing.T) {
	secret := "test-secret"
	token, err := Issue(42, secret, time.Hour)
	require.NoError(t, err)
	require.NotEmpty(t, token)

	claims, err := Parse(token, secret)
	require.NoError(t, err)
	assert.Equal(t, uint(42), claims.UserID)
}

func TestParse_Expired(t *testing.T) {
	secret := "test-secret"
	token, _ := Issue(1, secret, -time.Hour) // 이미 만료
	_, err := Parse(token, secret)
	assert.Error(t, err)
}

func TestParse_WrongSecret(t *testing.T) {
	token, _ := Issue(1, "secret-a", time.Hour)
	_, err := Parse(token, "secret-b")
	assert.Error(t, err)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./pkg/jwt/...`
Expected: FAIL — undefined.

- [ ] **Step 3: 구현**

`pkg/jwt/jwt.go`:

```go
package jwt

import (
	"errors"
	"time"

	jwtv5 "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint `json:"user_id"`
	jwtv5.RegisteredClaims
}

func Issue(userID uint, secret string, ttl time.Duration) (string, error) {
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwtv5.RegisteredClaims{
			ExpiresAt: jwtv5.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwtv5.NewNumericDate(time.Now()),
		},
	}
	tok := jwtv5.NewWithClaims(jwtv5.SigningMethodHS256, claims)
	return tok.SignedString([]byte(secret))
}

func Parse(tokenStr, secret string) (*Claims, error) {
	tok, err := jwtv5.ParseWithClaims(tokenStr, &Claims{}, func(t *jwtv5.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwtv5.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return c, nil
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./pkg/jwt/... -v`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/pkg/jwt/
git commit -m "[#704] 1-acl backend: JWT 발급/검증 헬퍼"
```

---

# Phase 2 — Backend 데이터 계층

### Task 7: Repository 인터페이스 모음

**Files:**
- Create: `backend/domain/repository.go`

- [ ] **Step 1: 인터페이스 정의 (구현은 다음 task)**

`domain/repository.go`:

```go
package domain

type UserRepository interface {
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
	Create(u *User) error
}

type PageRepository interface {
	FindByID(id uint) (*Page, error)
	ListAccessibleBy(userID uint) ([]Page, error)
	Update(p *Page) error
	Create(p *Page) error
}

type ACLRepository interface {
	FindByPageAndUser(pageID, userID uint) ([]ACLEntry, error)
	ListByPage(pageID uint) ([]ACLEntry, error)
	Grant(pageID, userID uint, action Action) error
	Revoke(pageID, userID uint) error
}

type ErrNotFound struct{ Resource string }

func (e ErrNotFound) Error() string { return e.Resource + " not found" }
```

- [ ] **Step 2: 빌드 검증**

Run: `go build ./...`
Expected: 무에러.

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/backend/domain/repository.go
git commit -m "[#704] 1-acl backend: repository 인터페이스 정의"
```

---

### Task 8: User repository 구현

**Files:**
- Create: `backend/repository/user_repository.go`
- Create: `backend/repository/user_repository_test.go`

- [ ] **Step 1: 실패하는 테스트**

`repository/user_repository_test.go`:

```go
package repository

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func TestUserRepository_CreateAndFindByEmail(t *testing.T) {
	db, err := config.OpenDB(":memory:")
	require.NoError(t, err)
	repo := NewUserRepository(db)

	u := &domain.User{Email: "alice@example.com", Name: "Alice", PasswordHash: "x"}
	require.NoError(t, repo.Create(u))
	assert.NotZero(t, u.ID)

	found, err := repo.FindByEmail("alice@example.com")
	require.NoError(t, err)
	assert.Equal(t, u.ID, found.ID)
}

func TestUserRepository_FindByID_NotFound(t *testing.T) {
	db, err := config.OpenDB(":memory:")
	require.NoError(t, err)
	repo := NewUserRepository(db)

	_, err = repo.FindByID(999)
	var nf domain.ErrNotFound
	assert.True(t, errors.As(err, &nf))
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./repository/... -run TestUserRepository`
Expected: FAIL — undefined.

- [ ] **Step 3: 구현**

`repository/user_repository.go`:

```go
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

type UserRepository struct{ db *gorm.DB }

func NewUserRepository(db *gorm.DB) *UserRepository { return &UserRepository{db: db} }

func (r *UserRepository) Create(u *domain.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) FindByEmail(email string) (*domain.User, error) {
	var u domain.User
	if err := r.db.Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "user"}
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByID(id uint) (*domain.User, error) {
	var u domain.User
	if err := r.db.First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "user"}
		}
		return nil, err
	}
	return &u, nil
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./repository/... -run TestUserRepository -v`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/repository/user_repository.go wiki-permissions/1-acl/backend/repository/user_repository_test.go
git commit -m "[#704] 1-acl backend: UserRepository 구현 + 단위 테스트"
```

---

### Task 9: Page repository 구현

**Files:**
- Create: `backend/repository/page_repository.go`
- Create: `backend/repository/page_repository_test.go`

- [ ] **Step 1: 실패하는 테스트**

`repository/page_repository_test.go`:

```go
package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func TestPageRepository_ListAccessibleBy(t *testing.T) {
	db, err := config.OpenDB(":memory:")
	require.NoError(t, err)

	users := NewUserRepository(db)
	pages := NewPageRepository(db)
	acls := NewACLRepository(db)

	alice := &domain.User{Email: "a@x", Name: "Alice", PasswordHash: "x"}
	bob := &domain.User{Email: "b@x", Name: "Bob", PasswordHash: "x"}
	require.NoError(t, users.Create(alice))
	require.NoError(t, users.Create(bob))

	p1 := &domain.Page{Title: "Owned by Alice", OwnerID: alice.ID}
	p2 := &domain.Page{Title: "Owned by Bob, shared with Alice", OwnerID: bob.ID}
	p3 := &domain.Page{Title: "Owned by Bob, no share", OwnerID: bob.ID}
	require.NoError(t, pages.Create(p1))
	require.NoError(t, pages.Create(p2))
	require.NoError(t, pages.Create(p3))

	require.NoError(t, acls.Grant(p2.ID, alice.ID, domain.ActionRead))

	got, err := pages.ListAccessibleBy(alice.ID)
	require.NoError(t, err)
	assert.Len(t, got, 2) // p1 (owner) + p2 (shared)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./repository/... -run TestPageRepository`
Expected: FAIL — undefined.

- [ ] **Step 3: 구현**

`repository/page_repository.go`:

```go
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

type PageRepository struct{ db *gorm.DB }

func NewPageRepository(db *gorm.DB) *PageRepository { return &PageRepository{db: db} }

func (r *PageRepository) Create(p *domain.Page) error { return r.db.Create(p).Error }

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

func (r *PageRepository) Update(p *domain.Page) error { return r.db.Save(p).Error }

// ListAccessibleBy: 본인이 owner이거나 ACLEntry로 어떤 action이든 부여받은 페이지.
func (r *PageRepository) ListAccessibleBy(userID uint) ([]domain.Page, error) {
	var pages []domain.Page
	err := r.db.
		Distinct("pages.*").
		Joins("LEFT JOIN acl_entries ON acl_entries.page_id = pages.id").
		Where("pages.owner_id = ? OR acl_entries.user_id = ?", userID, userID).
		Order("pages.id ASC").
		Find(&pages).Error
	return pages, err
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./repository/... -run TestPageRepository -v`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/repository/page_repository.go wiki-permissions/1-acl/backend/repository/page_repository_test.go
git commit -m "[#704] 1-acl backend: PageRepository 구현 + 단위 테스트"
```

---

### Task 10: ACL repository 구현

**Files:**
- Create: `backend/repository/acl_repository.go`
- Create: `backend/repository/acl_repository_test.go`

- [ ] **Step 1: 실패하는 테스트**

`repository/acl_repository_test.go`:

```go
package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func TestACLRepository_GrantAndFind(t *testing.T) {
	db, err := config.OpenDB(":memory:")
	require.NoError(t, err)

	repo := NewACLRepository(db)
	require.NoError(t, repo.Grant(1, 2, domain.ActionRead))
	require.NoError(t, repo.Grant(1, 2, domain.ActionEdit))

	entries, err := repo.FindByPageAndUser(1, 2)
	require.NoError(t, err)
	assert.Len(t, entries, 2)
}

func TestACLRepository_Grant_Idempotent(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	repo := NewACLRepository(db)
	require.NoError(t, repo.Grant(1, 2, domain.ActionRead))
	require.NoError(t, repo.Grant(1, 2, domain.ActionRead)) // duplicate must not error
	entries, _ := repo.FindByPageAndUser(1, 2)
	assert.Len(t, entries, 1)
}

func TestACLRepository_Revoke_RemovesAllActions(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	repo := NewACLRepository(db)
	repo.Grant(1, 2, domain.ActionRead)
	repo.Grant(1, 2, domain.ActionEdit)

	require.NoError(t, repo.Revoke(1, 2))
	entries, _ := repo.FindByPageAndUser(1, 2)
	assert.Empty(t, entries)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./repository/... -run TestACLRepository`
Expected: FAIL.

- [ ] **Step 3: 구현**

`repository/acl_repository.go`:

```go
package repository

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

type ACLRepository struct{ db *gorm.DB }

func NewACLRepository(db *gorm.DB) *ACLRepository { return &ACLRepository{db: db} }

func (r *ACLRepository) FindByPageAndUser(pageID, userID uint) ([]domain.ACLEntry, error) {
	var entries []domain.ACLEntry
	err := r.db.Where("page_id = ? AND user_id = ?", pageID, userID).Find(&entries).Error
	return entries, err
}

func (r *ACLRepository) ListByPage(pageID uint) ([]domain.ACLEntry, error) {
	var entries []domain.ACLEntry
	err := r.db.Where("page_id = ?", pageID).Order("user_id, action").Find(&entries).Error
	return entries, err
}

func (r *ACLRepository) Grant(pageID, userID uint, action domain.Action) error {
	entry := domain.ACLEntry{PageID: pageID, UserID: userID, Action: action}
	return r.db.
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&entry).Error
}

func (r *ACLRepository) Revoke(pageID, userID uint) error {
	return r.db.Where("page_id = ? AND user_id = ?", pageID, userID).Delete(&domain.ACLEntry{}).Error
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./repository/... -v`
Expected: PASS (전체).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/repository/acl_repository.go wiki-permissions/1-acl/backend/repository/acl_repository_test.go
git commit -m "[#704] 1-acl backend: ACLRepository 구현 + 단위 테스트"
```

---

### Task 11: 시드 데이터 함수

**Files:**
- Create: `backend/config/seed.go`
- Create: `backend/config/seed_test.go`

- [ ] **Step 1: 실패하는 테스트**

`config/seed_test.go`:

```go
package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

func TestSeed_PopulatesUsersPagesACLs(t *testing.T) {
	db, err := OpenDB(":memory:")
	require.NoError(t, err)
	require.NoError(t, Seed(db))

	var userCount, pageCount, aclCount int64
	db.Model(&domain.User{}).Count(&userCount)
	db.Model(&domain.Page{}).Count(&pageCount)
	db.Model(&domain.ACLEntry{}).Count(&aclCount)

	assert.Equal(t, int64(4), userCount)
	assert.Equal(t, int64(3), pageCount)
	assert.Equal(t, int64(7), aclCount) // EngRoadmap 2 + Q4Marketing 2 + OnboardingGuide 3
}

func TestSeed_Idempotent(t *testing.T) {
	db, _ := OpenDB(":memory:")
	require.NoError(t, Seed(db))
	require.NoError(t, Seed(db)) // 두 번째 호출도 에러 없어야 함

	var userCount int64
	db.Model(&domain.User{}).Count(&userCount)
	assert.Equal(t, int64(4), userCount)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./config/... -run TestSeed`
Expected: FAIL — `Seed` undefined.

- [ ] **Step 3: 구현**

`config/seed.go`:

```go
package config

import (
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/passwordhash"
)

func Seed(db *gorm.DB) error {
	hash, err := passwordhash.Hash("password")
	if err != nil {
		return err
	}

	// User: email에 unique index가 있으므로 OnConflict DoNothing으로 idempotent 보장.
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

	// Page: title에 unique index가 없어 OnConflict로 idempotent 못 함.
	// "title + owner_id 조합으로 조회 후 없으면 삽입" 패턴 사용.
	pageSpecs := []domain.Page{
		{Title: "Engineering Roadmap", Content: "2026 engineering plan", OwnerID: byEmail["alice@example.com"]},
		{Title: "Q4 Marketing Plan", Content: "Q4 campaigns", OwnerID: byEmail["carol@example.com"]},
		{Title: "Public Onboarding Guide", Content: "Welcome", OwnerID: byEmail["alice@example.com"]},
	}
	byTitle := map[string]uint{}
	for _, p := range pageSpecs {
		var found domain.Page
		err := db.Where("title = ? AND owner_id = ?", p.Title, p.OwnerID).First(&found).Error
		switch {
		case err == nil:
			byTitle[p.Title] = found.ID
		case errors.Is(err, gorm.ErrRecordNotFound):
			created := p
			if err := db.Create(&created).Error; err != nil {
				return err
			}
			byTitle[p.Title] = created.ID
		default:
			return err
		}
	}

	// ACLEntry: idx_page_user_action 복합 unique 인덱스 → OnConflict DoNothing으로 idempotent.
	type aclSpec struct {
		page string
		user string
		act  domain.Action
	}
	specs := []aclSpec{
		{"Engineering Roadmap", "bob@example.com", domain.ActionEdit},
		{"Engineering Roadmap", "carol@example.com", domain.ActionRead},
		{"Q4 Marketing Plan", "alice@example.com", domain.ActionRead},
		{"Q4 Marketing Plan", "bob@example.com", domain.ActionRead},
		{"Public Onboarding Guide", "bob@example.com", domain.ActionRead},
		{"Public Onboarding Guide", "carol@example.com", domain.ActionRead},
		{"Public Onboarding Guide", "dave@example.com", domain.ActionRead},
	}
	entries := make([]domain.ACLEntry, 0, len(specs))
	for _, s := range specs {
		entries = append(entries, domain.ACLEntry{
			PageID: byTitle[s.page],
			UserID: byEmail[s.user],
			Action: s.act,
		})
	}
	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(&entries).Error
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./config/... -v`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/config/seed.go wiki-permissions/1-acl/backend/config/seed_test.go
git commit -m "[#704] 1-acl backend: 시드 데이터 함수 (사용자 4 + 페이지 3 + ACL 7)"
```

---

# Phase 3 — Backend 비즈니스 계층

### Task 12: Auth usecase (login)

**Files:**
- Create: `backend/usecase/auth_usecase.go`
- Create: `backend/usecase/auth_usecase_test.go`

- [ ] **Step 1: 실패하는 테스트**

`usecase/auth_usecase_test.go`:

```go
package usecase

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/passwordhash"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/repository"
)

func TestAuthUsecase_Login_Success(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	users := repository.NewUserRepository(db)
	hash, _ := passwordhash.Hash("password")
	require.NoError(t, users.Create(&domain.User{Email: "a@x", Name: "A", PasswordHash: hash}))

	uc := NewAuthUsecase(users, "secret", time.Hour)
	token, _, err := uc.Login("a@x", "password")
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestAuthUsecase_Login_WrongPassword(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	users := repository.NewUserRepository(db)
	hash, _ := passwordhash.Hash("password")
	users.Create(&domain.User{Email: "a@x", Name: "A", PasswordHash: hash})

	uc := NewAuthUsecase(users, "secret", time.Hour)
	_, _, err := uc.Login("a@x", "wrong")
	assert.ErrorIs(t, err, ErrInvalidCredentials)
}

func TestAuthUsecase_Login_UserNotFound(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	users := repository.NewUserRepository(db)
	uc := NewAuthUsecase(users, "secret", time.Hour)

	_, _, err := uc.Login("nope@x", "password")
	assert.ErrorIs(t, err, ErrInvalidCredentials)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./usecase/... -run TestAuthUsecase`
Expected: FAIL.

- [ ] **Step 3: 구현**

`usecase/auth_usecase.go`:

```go
package usecase

import (
	"errors"
	"time"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	jwthelper "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/jwt"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/passwordhash"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type AuthUsecase struct {
	users     domain.UserRepository
	jwtSecret string
	tokenTTL  time.Duration
}

func NewAuthUsecase(users domain.UserRepository, secret string, ttl time.Duration) *AuthUsecase {
	return &AuthUsecase{users: users, jwtSecret: secret, tokenTTL: ttl}
}

func (u *AuthUsecase) Login(email, plainPassword string) (token string, user *domain.User, err error) {
	found, err := u.users.FindByEmail(email)
	if err != nil {
		return "", nil, ErrInvalidCredentials
	}
	if !passwordhash.Verify(plainPassword, found.PasswordHash) {
		return "", nil, ErrInvalidCredentials
	}
	tok, err := jwthelper.Issue(found.ID, u.jwtSecret, u.tokenTTL)
	if err != nil {
		return "", nil, err
	}
	return tok, found, nil
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./usecase/... -run TestAuthUsecase -v`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/usecase/auth_usecase.go wiki-permissions/1-acl/backend/usecase/auth_usecase_test.go
git commit -m "[#704] 1-acl backend: AuthUsecase (login)"
```

---

### Task 13: ACL 검증 헬퍼 (도메인 로직)

**Files:**
- Create: `backend/domain/acl_check.go`
- Create: `backend/domain/acl_check_test.go`

- [ ] **Step 1: 실패하는 테스트**

`domain/acl_check_test.go`:

```go
package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEvaluateACL_OwnerHasFullAccess(t *testing.T) {
	page := &Page{ID: 1, OwnerID: 100}
	assert.True(t, EvaluateACL(page, 100, ActionEdit, nil))
	assert.True(t, EvaluateACL(page, 100, ActionRead, nil))
}

func TestEvaluateACL_ExplicitGrant(t *testing.T) {
	page := &Page{ID: 1, OwnerID: 100}
	entries := []ACLEntry{{PageID: 1, UserID: 200, Action: ActionRead}}
	assert.True(t, EvaluateACL(page, 200, ActionRead, entries))
	assert.False(t, EvaluateACL(page, 200, ActionEdit, entries))
}

func TestEvaluateACL_EditImpliesRead(t *testing.T) {
	page := &Page{ID: 1, OwnerID: 100}
	entries := []ACLEntry{{PageID: 1, UserID: 200, Action: ActionEdit}}
	assert.True(t, EvaluateACL(page, 200, ActionRead, entries))
	assert.True(t, EvaluateACL(page, 200, ActionEdit, entries))
}

func TestEvaluateACL_NoGrant(t *testing.T) {
	page := &Page{ID: 1, OwnerID: 100}
	assert.False(t, EvaluateACL(page, 999, ActionRead, nil))
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./domain/... -run TestEvaluateACL`
Expected: FAIL.

- [ ] **Step 3: 구현**

`domain/acl_check.go`:

```go
package domain

// EvaluateACL: page에 대해 userID가 want action을 수행할 수 있는지.
// 규칙:
// 1) page.OwnerID == userID 이면 모든 action 허용.
// 2) entries에 (page, user, action) 매칭 entry가 있으면 허용.
// 3) edit 권한이 있으면 read도 허용 (edit이 read를 함의).
func EvaluateACL(page *Page, userID uint, want Action, entries []ACLEntry) bool {
	if page == nil {
		return false
	}
	if page.OwnerID == userID {
		return true
	}
	for _, e := range entries {
		if e.UserID != userID || e.PageID != page.ID {
			continue
		}
		if e.Action == want {
			return true
		}
		if want == ActionRead && e.Action == ActionEdit {
			return true
		}
	}
	return false
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./domain/... -v`
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/domain/acl_check.go wiki-permissions/1-acl/backend/domain/acl_check_test.go
git commit -m "[#704] 1-acl backend: ACL 평가 함수 EvaluateACL"
```

---

### Task 14: Page usecase (ACL 검증 포함)

**Files:**
- Create: `backend/usecase/page_usecase.go`
- Create: `backend/usecase/page_usecase_test.go`

- [ ] **Step 1: 실패하는 테스트**

`usecase/page_usecase_test.go`:

```go
package usecase

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/repository"
)

func setupPageEnv(t *testing.T) (*PageUsecase, map[string]uint) {
	db, err := config.OpenDB(":memory:")
	require.NoError(t, err)
	require.NoError(t, config.Seed(db))

	pages := repository.NewPageRepository(db)
	acls := repository.NewACLRepository(db)
	uc := NewPageUsecase(pages, acls)

	users := repository.NewUserRepository(db)

	emailToID := map[string]uint{}
	for _, e := range []string{"alice@example.com", "bob@example.com", "carol@example.com", "dave@example.com"} {
		u, _ := users.FindByEmail(e)
		emailToID[e] = u.ID
	}
	titleToID := map[string]uint{}
	for _, title := range []string{"Engineering Roadmap", "Q4 Marketing Plan", "Public Onboarding Guide"} {
		var p domain.Page
		require.NoError(t, db.Where("title = ?", title).First(&p).Error)
		titleToID[title] = p.ID
	}
	return uc, mergeIDs(emailToID, titleToID)
}

func mergeIDs(a, b map[string]uint) map[string]uint {
	out := map[string]uint{}
	for k, v := range a {
		out["user:"+k] = v
	}
	for k, v := range b {
		out["page:"+k] = v
	}
	return out
}

func TestPageUsecase_Get_OwnerCanRead(t *testing.T) {
	uc, ids := setupPageEnv(t)
	p, err := uc.Get(ids["page:Engineering Roadmap"], ids["user:alice@example.com"])
	require.NoError(t, err)
	assert.Equal(t, "Engineering Roadmap", p.Title)
}

func TestPageUsecase_Get_GrantedUserCanRead(t *testing.T) {
	uc, ids := setupPageEnv(t)
	p, err := uc.Get(ids["page:Engineering Roadmap"], ids["user:carol@example.com"])
	require.NoError(t, err)
	assert.NotNil(t, p)
}

func TestPageUsecase_Get_NoGrantReturnsForbidden(t *testing.T) {
	uc, ids := setupPageEnv(t)
	_, err := uc.Get(ids["page:Engineering Roadmap"], ids["user:dave@example.com"])
	assert.ErrorIs(t, err, ErrForbidden)
}

func TestPageUsecase_Update_RequiresEdit(t *testing.T) {
	uc, ids := setupPageEnv(t)
	// carol은 EngRoadmap에 read만 있음 → edit 시도 시 403
	_, err := uc.Update(ids["page:Engineering Roadmap"], ids["user:carol@example.com"], "new title", "new content")
	assert.ErrorIs(t, err, ErrForbidden)

	// bob은 edit 권한 있음
	p, err := uc.Update(ids["page:Engineering Roadmap"], ids["user:bob@example.com"], "Updated", "x")
	require.NoError(t, err)
	assert.Equal(t, "Updated", p.Title)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./usecase/... -run TestPageUsecase`
Expected: FAIL.

- [ ] **Step 3: 구현**

`usecase/page_usecase.go`:

```go
package usecase

import (
	"errors"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

var ErrForbidden = errors.New("forbidden")

type PageUsecase struct {
	pages domain.PageRepository
	acls  domain.ACLRepository
}

func NewPageUsecase(pages domain.PageRepository, acls domain.ACLRepository) *PageUsecase {
	return &PageUsecase{pages: pages, acls: acls}
}

func (u *PageUsecase) ListAccessible(userID uint) ([]domain.Page, error) {
	return u.pages.ListAccessibleBy(userID)
}

func (u *PageUsecase) Get(pageID, userID uint) (*domain.Page, error) {
	page, err := u.pages.FindByID(pageID)
	if err != nil {
		return nil, err
	}
	entries, err := u.acls.FindByPageAndUser(pageID, userID)
	if err != nil {
		return nil, err
	}
	if !domain.EvaluateACL(page, userID, domain.ActionRead, entries) {
		return nil, ErrForbidden
	}
	return page, nil
}

func (u *PageUsecase) Update(pageID, userID uint, title, content string) (*domain.Page, error) {
	page, err := u.pages.FindByID(pageID)
	if err != nil {
		return nil, err
	}
	entries, err := u.acls.FindByPageAndUser(pageID, userID)
	if err != nil {
		return nil, err
	}
	if !domain.EvaluateACL(page, userID, domain.ActionEdit, entries) {
		return nil, ErrForbidden
	}
	page.Title = title
	page.Content = content
	if err := u.pages.Update(page); err != nil {
		return nil, err
	}
	return page, nil
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./usecase/... -run TestPageUsecase -v`
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/usecase/page_usecase.go wiki-permissions/1-acl/backend/usecase/page_usecase_test.go
git commit -m "[#704] 1-acl backend: PageUsecase (ACL 검증 통합)"
```

---

### Task 15: ACL usecase (grant/revoke/list — owner 검증 포함)

**Files:**
- Create: `backend/usecase/acl_usecase.go`
- Create: `backend/usecase/acl_usecase_test.go`

- [ ] **Step 1: 실패하는 테스트**

`usecase/acl_usecase_test.go`:

```go
package usecase

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/repository"
)

func TestACLUsecase_Grant_OwnerOnly(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	config.Seed(db)
	uc := NewACLUsecase(repository.NewPageRepository(db), repository.NewACLRepository(db))

	users := repository.NewUserRepository(db)
	alice, _ := users.FindByEmail("alice@example.com")
	bob, _ := users.FindByEmail("bob@example.com")
	carol, _ := users.FindByEmail("carol@example.com")

	var p domain.Page
	require.NoError(t, db.Where("title = ?", "Engineering Roadmap").First(&p).Error)

	// Alice가 owner — OK
	require.NoError(t, uc.Grant(p.ID, alice.ID, carol.ID, domain.ActionEdit))

	// Bob은 owner 아님 — Forbidden
	err := uc.Grant(p.ID, bob.ID, carol.ID, domain.ActionEdit)
	assert.ErrorIs(t, err, ErrForbidden)
}

func TestACLUsecase_Revoke_OwnerOnly(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	config.Seed(db)
	uc := NewACLUsecase(repository.NewPageRepository(db), repository.NewACLRepository(db))

	users := repository.NewUserRepository(db)
	alice, _ := users.FindByEmail("alice@example.com")
	bob, _ := users.FindByEmail("bob@example.com")

	var p domain.Page
	db.Where("title = ?", "Engineering Roadmap").First(&p)

	require.NoError(t, uc.Revoke(p.ID, alice.ID, bob.ID))

	// Bob (non-owner) tries
	err := uc.Revoke(p.ID, bob.ID, alice.ID)
	assert.ErrorIs(t, err, ErrForbidden)
}

func TestACLUsecase_List_OwnerOnly(t *testing.T) {
	db, _ := config.OpenDB(":memory:")
	config.Seed(db)
	uc := NewACLUsecase(repository.NewPageRepository(db), repository.NewACLRepository(db))

	users := repository.NewUserRepository(db)
	alice, _ := users.FindByEmail("alice@example.com")
	dave, _ := users.FindByEmail("dave@example.com")

	var p domain.Page
	db.Where("title = ?", "Engineering Roadmap").First(&p)

	entries, err := uc.List(p.ID, alice.ID)
	require.NoError(t, err)
	assert.NotEmpty(t, entries)

	_, err = uc.List(p.ID, dave.ID)
	assert.ErrorIs(t, err, ErrForbidden)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./usecase/... -run TestACLUsecase`
Expected: FAIL.

- [ ] **Step 3: 구현**

`usecase/acl_usecase.go`:

```go
package usecase

import (
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
)

type ACLUsecase struct {
	pages domain.PageRepository
	acls  domain.ACLRepository
}

func NewACLUsecase(pages domain.PageRepository, acls domain.ACLRepository) *ACLUsecase {
	return &ACLUsecase{pages: pages, acls: acls}
}

func (u *ACLUsecase) checkOwner(pageID, requesterID uint) (*domain.Page, error) {
	page, err := u.pages.FindByID(pageID)
	if err != nil {
		return nil, err
	}
	if page.OwnerID != requesterID {
		return nil, ErrForbidden
	}
	return page, nil
}

func (u *ACLUsecase) List(pageID, requesterID uint) ([]domain.ACLEntry, error) {
	if _, err := u.checkOwner(pageID, requesterID); err != nil {
		return nil, err
	}
	return u.acls.ListByPage(pageID)
}

func (u *ACLUsecase) Grant(pageID, requesterID, targetUserID uint, action domain.Action) error {
	if !action.Valid() {
		return domain.ErrNotFound{Resource: "action"}
	}
	if _, err := u.checkOwner(pageID, requesterID); err != nil {
		return err
	}
	return u.acls.Grant(pageID, targetUserID, action)
}

func (u *ACLUsecase) Revoke(pageID, requesterID, targetUserID uint) error {
	if _, err := u.checkOwner(pageID, requesterID); err != nil {
		return err
	}
	return u.acls.Revoke(pageID, targetUserID)
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./usecase/... -v`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/usecase/acl_usecase.go wiki-permissions/1-acl/backend/usecase/acl_usecase_test.go
git commit -m "[#704] 1-acl backend: ACLUsecase (owner 검증)"
```

---

# Phase 4 — Backend HTTP 계층

### Task 16: JWT 인증 미들웨어

**Files:**
- Create: `backend/http/middleware/jwt_auth.go`
- Create: `backend/http/middleware/jwt_auth_test.go`

- [ ] **Step 1: 실패하는 테스트**

`http/middleware/jwt_auth_test.go`:

```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	jwthelper "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/jwt"
)

func TestJWTAuth_ValidToken_InjectsUserID(t *testing.T) {
	secret := "s"
	tok, err := jwthelper.Issue(42, secret, time.Hour)
	require.NoError(t, err)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	var got uint
	handler := func(c echo.Context) error {
		got = UserIDFrom(c)
		return c.String(http.StatusOK, "")
	}

	mw := JWTAuth(secret)
	require.NoError(t, mw(handler)(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, uint(42), got)
}

func TestJWTAuth_MissingHeader(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := func(c echo.Context) error { return c.String(http.StatusOK, "") }
	mw := JWTAuth("s")
	err := mw(handler)(c)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusUnauthorized, httpErr.Code)
}

func TestJWTAuth_InvalidToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer not-a-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := func(c echo.Context) error { return c.String(http.StatusOK, "") }
	mw := JWTAuth("s")
	err := mw(handler)(c)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusUnauthorized, httpErr.Code)
}
```

- [ ] **Step 2: 실패 확인**

Run: `go test ./http/middleware/... -run TestJWTAuth`
Expected: FAIL.

- [ ] **Step 3: 구현**

`http/middleware/jwt_auth.go`:

```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	jwthelper "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/pkg/jwt"
)

const ctxUserID = "user_id"

func JWTAuth(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Request().Header.Get("Authorization")
			if !strings.HasPrefix(h, "Bearer ") {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing bearer token")
			}
			tok := strings.TrimPrefix(h, "Bearer ")
			claims, err := jwthelper.Parse(tok, secret)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}
			c.Set(ctxUserID, claims.UserID)
			return next(c)
		}
	}
}

func UserIDFrom(c echo.Context) uint {
	v, _ := c.Get(ctxUserID).(uint)
	return v
}
```

- [ ] **Step 4: 테스트 통과**

Run: `go test ./http/middleware/... -run TestJWTAuth -v`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add wiki-permissions/1-acl/backend/http/middleware/jwt_auth.go wiki-permissions/1-acl/backend/http/middleware/jwt_auth_test.go
git commit -m "[#704] 1-acl backend: JWT 인증 미들웨어"
```

---

### Task 17: Auth handler

**Files:**
- Create: `backend/http/handler/auth_handler.go`

- [ ] **Step 1: 핸들러 구현**

`http/handler/auth_handler.go`:

```go
package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/usecase"
)

type AuthHandler struct {
	auth *usecase.AuthUsecase
}

func NewAuthHandler(auth *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{auth: auth}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token string         `json:"token"`
	User  loginUser      `json:"user"`
}

type loginUser struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	tok, u, err := h.auth.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, loginResponse{
		Token: tok,
		User:  loginUser{ID: u.ID, Email: u.Email, Name: u.Name},
	})
}
```

- [ ] **Step 2: 빌드 검증**

Run: `go build ./...`
Expected: 무에러.

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/backend/http/handler/auth_handler.go
git commit -m "[#704] 1-acl backend: AuthHandler (POST /auth/login)"
```

---

### Task 18: Page handler (List/Get/Update with ACL via usecase)

**Files:**
- Create: `backend/http/handler/page_handler.go`

- [ ] **Step 1: 핸들러 구현**

`http/handler/page_handler.go`:

```go
package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	mw "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http/middleware"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/usecase"
)

type PageHandler struct{ uc *usecase.PageUsecase }

func NewPageHandler(uc *usecase.PageUsecase) *PageHandler { return &PageHandler{uc: uc} }

func (h *PageHandler) List(c echo.Context) error {
	uid := mw.UserIDFrom(c)
	pages, err := h.uc.ListAccessible(uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, pages)
}

func (h *PageHandler) Get(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return err
	}
	uid := mw.UserIDFrom(c)
	page, err := h.uc.Get(id, uid)
	return respondOrError(c, page, err)
}

type updatePageRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (h *PageHandler) Update(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return err
	}
	uid := mw.UserIDFrom(c)
	var req updatePageRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	page, err := h.uc.Update(id, uid, req.Title, req.Content)
	return respondOrError(c, page, err)
}

func parseUintParam(c echo.Context, key string) (uint, error) {
	raw := c.Param(key)
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	return uint(v), nil
}

func respondOrError(c echo.Context, page *domain.Page, err error) error {
	if err == nil {
		return c.JSON(http.StatusOK, page)
	}
	if errors.Is(err, usecase.ErrForbidden) {
		return echo.NewHTTPError(http.StatusForbidden, "forbidden")
	}
	var nf domain.ErrNotFound
	if errors.As(err, &nf) {
		return echo.NewHTTPError(http.StatusNotFound, nf.Error())
	}
	return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
}
```

- [ ] **Step 2: 빌드 검증**

Run: `go build ./...`
Expected: 무에러.

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/backend/http/handler/page_handler.go
git commit -m "[#704] 1-acl backend: PageHandler (List/Get/Update)"
```

---

### Task 19: ACL handler (List/Grant/Revoke)

**Files:**
- Create: `backend/http/handler/acl_handler.go`

- [ ] **Step 1: 핸들러 구현**

`http/handler/acl_handler.go`:

```go
package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/domain"
	mw "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http/middleware"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/usecase"
)

type ACLHandler struct{ uc *usecase.ACLUsecase }

func NewACLHandler(uc *usecase.ACLUsecase) *ACLHandler { return &ACLHandler{uc: uc} }

func (h *ACLHandler) List(c echo.Context) error {
	pageID, err := parseUintParam(c, "id")
	if err != nil {
		return err
	}
	requester := mw.UserIDFrom(c)
	entries, err := h.uc.List(pageID, requester)
	if errors.Is(err, usecase.ErrForbidden) {
		return echo.NewHTTPError(http.StatusForbidden, "forbidden")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, entries)
}

type grantRequest struct {
	UserID uint          `json:"user_id"`
	Action domain.Action `json:"action"`
}

func (h *ACLHandler) Grant(c echo.Context) error {
	pageID, err := parseUintParam(c, "id")
	if err != nil {
		return err
	}
	requester := mw.UserIDFrom(c)
	var req grantRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	if !req.Action.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action")
	}
	if err := h.uc.Grant(pageID, requester, req.UserID, req.Action); err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *ACLHandler) Revoke(c echo.Context) error {
	pageID, err := parseUintParam(c, "id")
	if err != nil {
		return err
	}
	userID, err := parseUintParam(c, "userId")
	if err != nil {
		return err
	}
	requester := mw.UserIDFrom(c)
	if err := h.uc.Revoke(pageID, requester, userID); err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
```

- [ ] **Step 2: 빌드 검증**

Run: `go build ./...`
Expected: 무에러.

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/backend/http/handler/acl_handler.go
git commit -m "[#704] 1-acl backend: ACLHandler (List/Grant/Revoke)"
```

---

### Task 20: 라우터 통합 + main.go 완성

**Files:**
- Create: `backend/http/router.go`
- Modify: `backend/main.go`

- [ ] **Step 1: 라우터 구현**

`http/router.go`:

```go
package http

import (
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http/handler"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http/middleware"
)

type Deps struct {
	JWTSecret string
	Auth      *handler.AuthHandler
	Page      *handler.PageHandler
	ACL       *handler.ACLHandler
}

func NewRouter(d Deps) *echo.Echo {
	e := echo.New()
	e.Use(echomw.Logger())
	e.Use(echomw.Recover())
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	}))

	e.GET("/health", func(c echo.Context) error { return c.JSON(200, map[string]string{"status": "ok"}) })

	e.POST("/auth/login", d.Auth.Login)

	api := e.Group("/api", middleware.JWTAuth(d.JWTSecret))
	api.GET("/pages", d.Page.List)
	api.GET("/pages/:id", d.Page.Get)
	api.PUT("/pages/:id", d.Page.Update)
	api.GET("/pages/:id/acl", d.ACL.List)
	api.POST("/pages/:id/acl", d.ACL.Grant)
	api.DELETE("/pages/:id/acl/:userId", d.ACL.Revoke)

	return e
}
```

- [ ] **Step 2: main.go 통합**

`main.go`:

```go
package main

import (
	"log"
	"os"
	"time"

	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/config"
	httpx "github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/http/handler"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/repository"
	"github.com/kenshin579/tutorials-go/wiki-permissions/1-acl/backend/usecase"
)

func main() {
	dsn := envOr("DB_DSN", "wiki-acl.db")
	secret := envOr("JWT_SECRET", "dev-secret")
	addr := envOr("ADDR", ":8080")

	db, err := config.OpenDB(dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	if err := config.Seed(db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	users := repository.NewUserRepository(db)
	pages := repository.NewPageRepository(db)
	acls := repository.NewACLRepository(db)

	authUC := usecase.NewAuthUsecase(users, secret, 24*time.Hour)
	pageUC := usecase.NewPageUsecase(pages, acls)
	aclUC := usecase.NewACLUsecase(pages, acls)

	deps := httpx.Deps{
		JWTSecret: secret,
		Auth:      handler.NewAuthHandler(authUC),
		Page:      handler.NewPageHandler(pageUC),
		ACL:       handler.NewACLHandler(aclUC),
	}
	e := httpx.NewRouter(deps)
	e.Logger.Fatal(e.Start(addr))
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
```

- [ ] **Step 3: 통합 빌드 + 실행**

Run:
```bash
go build ./...
go test ./...
```
Expected: 모든 테스트 PASS.

수동 검증:
```bash
rm -f wiki-acl.db
go run main.go &
sleep 2
TOKEN=$(curl -s -X POST localhost:8080/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password"}' | jq -r .token)
curl -s -H "Authorization: Bearer $TOKEN" localhost:8080/api/pages | jq '. | length'
kill %1
```
Expected: 3 (alice는 모든 페이지에 access).

- [ ] **Step 4: 커밋**

```bash
git add wiki-permissions/1-acl/backend/http/router.go wiki-permissions/1-acl/backend/main.go
echo "wiki-acl.db" >> wiki-permissions/1-acl/backend/.gitignore
git add wiki-permissions/1-acl/backend/.gitignore
git commit -m "[#704] 1-acl backend: 라우터 + main.go 통합 (서버 동작 가능)"
```

---

### Task 21: Backend README

**Files:**
- Create: `backend/README.md`

- [ ] **Step 1: README 작성**

`backend/README.md`:

````markdown
# 1-acl backend

Go + Echo + GORM + SQLite 기반 ACL 풀스택 샘플의 백엔드.

## 실행

```bash
go run main.go
# 기본: :8080, DB 파일 wiki-acl.db (자동 생성, 시드 적용)
```

환경변수: `DB_DSN`, `JWT_SECRET`, `ADDR` (모두 옵션).

## 시드 계정

모든 사용자의 비밀번호: `password`

| Email | 역할(시나리오) |
|---|---|
| alice@example.com | Engineering Roadmap, Public Onboarding Guide owner |
| bob@example.com | Engineering Roadmap edit, Q4/Onboarding read |
| carol@example.com | Q4 Marketing Plan owner, Engineering Roadmap read |
| dave@example.com | Public Onboarding Guide read만 |

## 주요 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| POST | `/auth/login` | 로그인 |
| GET | `/api/pages` | 본인이 access 가능한 페이지 목록 |
| GET | `/api/pages/:id` | 페이지 상세 (`read` 필요) |
| PUT | `/api/pages/:id` | 페이지 수정 (`edit` 필요) |
| GET | `/api/pages/:id/acl` | 공유 목록 (owner 전용) |
| POST | `/api/pages/:id/acl` | 권한 부여 (owner 전용) |
| DELETE | `/api/pages/:id/acl/:userId` | 권한 회수 (owner 전용) |

## 테스트

```bash
go test ./...
```
````

- [ ] **Step 2: 인코딩 확인 + 커밋**

```bash
file -I wiki-permissions/1-acl/backend/README.md
git add wiki-permissions/1-acl/backend/README.md
git commit -m "[#704] 1-acl backend: README 작성"
```

---

# Phase 5 — Frontend 인프라

### Task 22: Vite + React + TS + Tailwind v4 초기화

**Files:**
- Create: `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`

- [ ] **Step 1: Vite 템플릿 생성**

```bash
cd wiki-permissions/1-acl/frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: 의존성 추가**

```bash
npm install react-router-dom@^7 axios
npm install -D tailwindcss@^4 @tailwindcss/vite
```

- [ ] **Step 3: Tailwind v4 설정**

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, proxy: { '/api': 'http://localhost:8080', '/auth': 'http://localhost:8080' } },
});
```

`src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: 최소 App.tsx**

`src/App.tsx`:

```tsx
export default function App() {
  return <div className="p-8 text-2xl">wiki-permissions / 1-acl</div>;
}
```

- [ ] **Step 5: 실행 검증**

```bash
npm run dev &
sleep 3
curl -s localhost:3000/ | head -5
kill %1
```
Expected: HTML 응답.

- [ ] **Step 6: 커밋**

```bash
git add wiki-permissions/1-acl/frontend
echo "node_modules/" >> wiki-permissions/1-acl/frontend/.gitignore
echo "dist/" >> wiki-permissions/1-acl/frontend/.gitignore
git add wiki-permissions/1-acl/frontend/.gitignore
git commit -m "[#704] 1-acl frontend: Vite + React 19 + TS + Tailwind v4 초기화"
```

---

### Task 23: API 클라이언트 (Axios + 토큰 인터셉터)

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: 클라이언트 작성**

`src/api/client.ts`:

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
```

- [ ] **Step 2: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/api/client.ts
git commit -m "[#704] 1-acl frontend: API 클라이언트 (토큰 인터셉터)"
```

---

### Task 24: AuthContext

**Files:**
- Create: `frontend/src/auth/AuthContext.tsx`

- [ ] **Step 1: AuthContext 구현**

`src/auth/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (saved && token) {
      return { user: JSON.parse(saved), isAuthenticated: true };
    }
    return { user: null, isAuthenticated: false };
  });

  async function login(email: string, password: string) {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, isAuthenticated: true });
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setState({ user: null, isAuthenticated: false });
  }

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/auth/AuthContext.tsx
git commit -m "[#704] 1-acl frontend: AuthContext"
```

---

### Task 25: ProtectedRoute + Login 페이지

**Files:**
- Create: `frontend/src/auth/ProtectedRoute.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: ProtectedRoute**

`src/auth/ProtectedRoute.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 2: LoginPage**

`src/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/pages');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '로그인 실패');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">wiki-permissions / 1-acl</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 w-full rounded border p-2"
          placeholder="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-full rounded border p-2"
          placeholder="password"
        />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 p-2 text-white">로그인</button>
        <p className="mt-3 text-xs text-slate-500">
          시드 계정: alice / bob / carol / dave @example.com (모두 password)
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/auth/ProtectedRoute.tsx wiki-permissions/1-acl/frontend/src/pages/LoginPage.tsx
git commit -m "[#704] 1-acl frontend: ProtectedRoute + LoginPage"
```

---

### Task 26: Layout + 페이지 목록

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/PageListPage.tsx`

- [ ] **Step 1: Layout**

`src/components/Layout.tsx`:

```tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function onLogout() {
    logout();
    navigate('/login');
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <h1 className="font-bold">wiki-permissions / 1-acl</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.email}</span>
          <button onClick={onLogout} className="rounded border px-2 py-1">로그아웃</button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: PageListPage**

`src/pages/PageListPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Page {
  id: number;
  title: string;
  owner_id: number;
}

export default function PageListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/pages')
      .then((r) => setPages(r.data))
      .catch((e) => setError(e.response?.data?.message ?? 'failed'));
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">내가 접근 가능한 페이지</h2>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="divide-y rounded bg-white shadow">
        {pages.map((p) => (
          <li key={p.id} className="p-4 hover:bg-slate-50">
            <Link to={`/pages/${p.id}`} className="text-blue-600">
              {p.title}
            </Link>
          </li>
        ))}
        {pages.length === 0 && !error && <li className="p-4 text-slate-500">접근 가능한 페이지가 없습니다.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/components/Layout.tsx wiki-permissions/1-acl/frontend/src/pages/PageListPage.tsx
git commit -m "[#704] 1-acl frontend: Layout + 페이지 목록"
```

---

### Task 27: 페이지 상세 (read/edit 게이팅)

**Files:**
- Create: `frontend/src/pages/PageDetailPage.tsx`

- [ ] **Step 1: PageDetailPage**

`src/pages/PageDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import ShareModal from '../components/ShareModal';

interface Page {
  id: number;
  title: string;
  content: string;
  owner_id: number;
}

export default function PageDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState<Page | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get<Page>(`/api/pages/${id}`)
      .then((r) => {
        setPage(r.data);
        setDraftTitle(r.data.title);
        setDraftContent(r.data.content);
      })
      .catch((e) => setError(e.response?.data?.message ?? 'failed'));
  }, [id]);

  async function save() {
    try {
      const r = await apiClient.put<Page>(`/api/pages/${id}`, { title: draftTitle, content: draftContent });
      setPage(r.data);
      setEditing(false);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'failed');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!page) return <p>로딩...</p>;

  const isOwner = user?.id === page.owner_id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {editing ? (
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="flex-1 rounded border p-2 text-xl font-semibold"
          />
        ) : (
          <h2 className="text-xl font-semibold">{page.title}</h2>
        )}
        <div className="flex gap-2">
          {isOwner && (
            <button onClick={() => setShareOpen(true)} className="rounded border px-3 py-1 text-sm">
              공유 관리
            </button>
          )}
          {!editing && (
            <button onClick={() => setEditing(true)} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
              편집
            </button>
          )}
          {editing && (
            <>
              <button onClick={save} className="rounded bg-green-600 px-3 py-1 text-sm text-white">
                저장
              </button>
              <button onClick={() => setEditing(false)} className="rounded border px-3 py-1 text-sm">
                취소
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          className="h-48 w-full rounded border p-2 font-mono text-sm"
        />
      ) : (
        <pre className="whitespace-pre-wrap rounded bg-white p-4 shadow">{page.content}</pre>
      )}
      {isOwner && shareOpen && page && (
        <ShareModal pageId={page.id} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
```

> 주: 편집 버튼은 일단 모두에게 보이지만, 권한 없으면 `PUT`이 403으로 거부된다. 더 정교한 게이팅(편집 버튼을 사전에 숨김)은 후속 개선 — 글에서 ACL의 frontend 한계로 언급.

- [ ] **Step 2: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/pages/PageDetailPage.tsx
git commit -m "[#704] 1-acl frontend: 페이지 상세 (편집/저장/공유 진입)"
```

---

### Task 28: ShareModal (ACL 관리)

**Files:**
- Create: `frontend/src/components/ShareModal.tsx`

- [ ] **Step 1: ShareModal**

`src/components/ShareModal.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface ACLEntry {
  id: number;
  page_id: number;
  user_id: number;
  action: 'read' | 'edit';
}

interface Props {
  pageId: number;
  onClose: () => void;
}

export default function ShareModal({ pageId, onClose }: Props) {
  const [entries, setEntries] = useState<ACLEntry[]>([]);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState<'read' | 'edit'>('read');
  const [error, setError] = useState('');

  function load() {
    apiClient
      .get<ACLEntry[]>(`/api/pages/${pageId}/acl`)
      .then((r) => setEntries(r.data))
      .catch((e) => setError(e.response?.data?.message ?? 'failed'));
  }

  useEffect(load, [pageId]);

  async function grant() {
    try {
      await apiClient.post(`/api/pages/${pageId}/acl`, { user_id: Number(userId), action });
      setUserId('');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'failed');
    }
  }

  async function revoke(uid: number) {
    try {
      await apiClient.delete(`/api/pages/${pageId}/acl/${uid}`);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'failed');
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">공유 관리 — page #{pageId}</h3>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <ul className="mb-4 max-h-48 divide-y overflow-auto rounded border">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-2 text-sm">
              <span>user #{e.user_id} — {e.action}</span>
              <button onClick={() => revoke(e.user_id)} className="text-red-600">회수</button>
            </li>
          ))}
          {entries.length === 0 && <li className="p-2 text-sm text-slate-500">공유된 사용자 없음</li>}
        </ul>

        <div className="flex gap-2">
          <input
            placeholder="user id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-24 rounded border p-1"
          />
          <select value={action} onChange={(e) => setAction(e.target.value as any)} className="rounded border p-1">
            <option value="read">read</option>
            <option value="edit">edit</option>
          </select>
          <button onClick={grant} className="rounded bg-blue-600 px-3 text-white">부여</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/components/ShareModal.tsx
git commit -m "[#704] 1-acl frontend: ShareModal (ACL grant/revoke)"
```

---

### Task 29: 라우터 통합 (App.tsx + main.tsx)

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: App.tsx**

`src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import PageListPage from './pages/PageListPage';
import PageDetailPage from './pages/PageDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/pages" element={<PageListPage />} />
            <Route path="/pages/:id" element={<PageDetailPage />} />
            <Route index element={<Navigate to="/pages" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/pages" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: main.tsx 확인**

`src/main.tsx` (Vite 기본값에서 import './index.css'가 있어야 함; 없으면 추가):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: dev 서버 + 통합 검증**

Run (백엔드 + 프론트 동시):
```bash
# 터미널 1
cd wiki-permissions/1-acl/backend && rm -f wiki-acl.db && go run main.go

# 터미널 2
cd wiki-permissions/1-acl/frontend && npm run dev
```

브라우저에서 http://localhost:3000 → alice 로그인 → 페이지 목록 3개 보임 → Engineering Roadmap 클릭 → 편집 가능 → 공유 관리 → bob/carol 권한 확인.

- [ ] **Step 4: 커밋**

```bash
git add wiki-permissions/1-acl/frontend/src/App.tsx wiki-permissions/1-acl/frontend/src/main.tsx
git commit -m "[#704] 1-acl frontend: 라우터 통합 (Login + 페이지 목록/상세 + 공유)"
```

---

### Task 30: Frontend README + 1편 통합 README

**Files:**
- Create: `frontend/README.md`
- Create: `wiki-permissions/1-acl/README.md`
- Modify: `wiki-permissions/README.md`

- [ ] **Step 1: frontend README**

`frontend/README.md`:

````markdown
# 1-acl frontend

React 19 + TS + Vite + Tailwind v4. 백엔드(localhost:8080)와 함께 동작.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

## 화면

- `/login` — 시드 계정으로 로그인 (alice/bob/carol/dave @example.com / password)
- `/pages` — 본인이 access 가능한 페이지 목록
- `/pages/:id` — 페이지 상세 (편집·저장, owner는 공유 관리 모달)

ACL 권한 검증은 모두 서버에서 수행되며, 프론트는 서버의 403 응답을 기반으로 UX를 노출한다.
````

- [ ] **Step 2: 1편 통합 README**

`wiki-permissions/1-acl/README.md`:

````markdown
# 1편 — ACL (Access Control List)

페이지마다 사용자에게 read/edit 권한을 직접 부여하는 가장 단순한 권한 모델.

## 구성

- `backend/` — Go + Echo + GORM + SQLite (자세한 내용은 backend/README.md)
- `frontend/` — React 19 + TS + Vite + Tailwind v4 (자세한 내용은 frontend/README.md)

## 빠른 시작

```bash
# Backend
cd backend && go run main.go &

# Frontend
cd frontend && npm install && npm run dev
```

브라우저: http://localhost:3000

## 시드 시나리오

| 사용자 | 비밀번호 | 권한 요약 |
|---|---|---|
| alice@example.com | password | Engineering Roadmap, Public Onboarding Guide owner / Q4 Marketing Plan read |
| bob@example.com | password | Engineering Roadmap edit / Q4·Onboarding read |
| carol@example.com | password | Q4 Marketing Plan owner / Engineering Roadmap read |
| dave@example.com | password | Public Onboarding Guide read |

## 관련 블로그 글

- 시리즈: 웹 권한 모델 비교
- 1편: ACL — 페이지 단위 공유 (작성 예정)
````

- [ ] **Step 3: 부모 README 보강**

`wiki-permissions/README.md` (Task 1의 자리표시를 보강):

````markdown
# wiki-permissions — 웹 권한 모델 비교 시리즈 (ACL/RBAC/ABAC)

블로그 시리즈 "웹 애플리케이션 권한 모델 비교 — ACL/RBAC/ABAC"의 풀스택 샘플 코드.

## 메타 컨텍스트

사내 위키 / 협업 문서 도구(Notion·Confluence 풍)를 가상 시나리오로 두고, 각 편이 그 안의 다른 측면을 다룬다. 같은 도메인 코어(User, Page) 위에 모델별 권한 데이터를 추가하는 방식.

## 구성

| 편 | 디렉토리 | 모델 | 시나리오 |
|---|---|---|---|
| 1편 | [`1-acl/`](./1-acl/) | Access Control List | 페이지마다 사용자에게 read/edit 직접 부여 |
| 2편 | `2-rbac/` (예정) | Role-Based Access Control | admin/editor/viewer/guest 역할 기반 |
| 3편 | `3-abac/` (예정) | Attribute-Based Access Control | 분류 + 부서 + 고용형태 등 속성 기반 정책 |

## 공통 기술 스택

- Backend: Go + Echo + GORM + SQLite + JWT
- Frontend: React 19 + TS + Vite + Tailwind v4

각 편의 코드는 self-contained하다. 하나의 디렉토리만 클론해도 독립 실행 가능.
````

- [ ] **Step 4: 인코딩 확인 + 커밋**

```bash
file -I wiki-permissions/1-acl/README.md wiki-permissions/1-acl/frontend/README.md wiki-permissions/README.md
git add wiki-permissions/1-acl/README.md wiki-permissions/1-acl/frontend/README.md wiki-permissions/README.md
git commit -m "[#704] 1-acl: README 작성 (frontend, 1편 통합, 부모 보강)"
```

---

# Phase 6 — PR 생성

### Task 31: 최종 검증 + push + PR 생성

- [ ] **Step 1: 전체 빌드 + 테스트**

```bash
cd wiki-permissions/1-acl/backend && go test ./... && go build ./...
cd ../frontend && npm run build
```
Expected: 모두 성공.

- [ ] **Step 2: 인코딩 일괄 확인 (한글 파일)**

```bash
find wiki-permissions/1-acl -name '*.md' -exec file -I {} \; | grep -v "charset=utf-8" || echo "all utf-8"
```
Expected: `all utf-8`.

- [ ] **Step 3: push**

```bash
git push -u origin feature/704-wiki-permissions-acl
```

- [ ] **Step 4: PR 생성**

```bash
gh pr create --title "[#704] feat: wiki-permissions 1편 ACL 풀스택 샘플 코드" \
  --reviewer kenshin579 \
  --body "$(cat <<'EOF'
## Summary
- `wiki-permissions/1-acl/` 신규: ACL 권한 모델의 풀스택 샘플 코드
- Backend: Go + Echo + GORM + SQLite, JWT 인증, ACL 평가 함수, repository/usecase/handler 4계층
- Frontend: React 19 + TS + Vite + Tailwind v4, AuthContext + ProtectedRoute + 페이지 목록/상세 + ShareModal
- 시드 데이터: 사용자 4명, 페이지 3개, ACL 7개 (시나리오는 README 참고)

## 시나리오
- alice (owner of Engineering Roadmap, Public Onboarding Guide)
- bob (edit Engineering Roadmap, read Q4/Onboarding)
- carol (owner of Q4 Marketing Plan, read Engineering Roadmap)
- dave (read Public Onboarding Guide만)

## 관련
- 시리즈 트래킹 이슈: #704
- spec: kenshin579/blog-v2.advenoh.pe.kr#475

## Test plan
- [x] backend `go test ./...` 모든 단위 테스트 PASS
- [x] backend `go build ./...` 무에러
- [x] frontend `npm run build` 무에러
- [ ] 수동 검증: alice/bob/carol/dave로 각각 로그인 → 시드 시나리오대로 페이지 목록·상세·편집·공유 동작 확인
- [ ] 수동 검증: dave로 EngineeringRoadmap 직접 URL(`/pages/1`) 접근 시 서버 403 응답 확인
EOF
)"
```

Expected: PR URL 출력. PR URL 기록.

- [ ] **Step 5: PR 작업 종료 (체크리스트 업데이트)**

블로그 작업(`blog-v2#474`)의 체크리스트에서 "1편 코드 PR" 항목을 체크한다 (PR 머지 후 별도 단계).

---

## 자체 검증 사항 (실행자가 PR 전 확인)

- [ ] backend `go test ./...` PASS
- [ ] backend `go build ./...` 무에러
- [ ] frontend `npm run build` 무에러
- [ ] backend + frontend 동시 실행 시 alice 로그인 → 페이지 목록 3개
- [ ] dave 로그인 → 페이지 목록 1개 (Public Onboarding Guide만)
- [ ] dave가 `/pages/1` 직접 접근 시 403 에러 표시
- [ ] alice가 Engineering Roadmap에서 공유 관리 → bob/carol 항목 보임 → dave에게 read 부여 → dave 로그인 시 목록에 추가됨
- [ ] 모든 한글 .md 파일 UTF-8

## Notes

- 본 plan은 1편(ACL)에 한정한다. 2편(RBAC) / 3편(ABAC)은 별도 plan으로 작성 (spec의 점진적 PR 전략).
- 1편 코드 PR이 머지된 뒤, 같은 spec을 참조해 1편 글(blog-v2 `docs/start/`) plan을 별도로 작성한다.
