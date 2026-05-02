# wiki-permissions 시리즈 3편 (ABAC) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1편(ACL) / 2편(RBAC)과 같은 사내 위키 메타 컨텍스트 위에서 ABAC(Attribute-Based Access Control) 권한 모델을 풀스택(Go + React)으로 구현해 "사용자/리소스/환경의 속성으로 정책을 평가한다"는 시나리오를 실행 가능한 코드로 보여준다. 시리즈 마지막 편이며 RBAC의 한계(role explosion + 컨텍스트 부재)가 어떻게 해결되는지 코드 차원에서 비교한다.

**Architecture:** Backend는 1·2편과 같은 4계층 + JWT 미들웨어. ACLEntry / Role / Permission / 두 join 테이블이 모두 사라지고, 그 자리에 사용자/페이지의 **속성 컬럼**과 **Go 함수 형태의 정책 평가기**가 들어온다. 외부 정책 엔진(OPA, Cedar 등) 미사용 — ABAC의 본질(속성 기반 평가)에 집중하기 위해 의도적으로 단순한 미니 정책 엔진을 직접 구현. Frontend는 1·2편과 같은 React 19 + Tailwind v4 골격 재사용 + ABAC 결과 시연 화면.

**Tech Stack:** Go 1.25+, Echo v4, GORM, mattn/go-sqlite3, golang-jwt/jwt v5, golang.org/x/crypto/bcrypt; React 19, TypeScript, Vite 6, React Router v7, Axios, Tailwind CSS v4. (1·2편과 동일)

**작업 위치**: `tutorials-go/wiki-permissions/3-abac/{backend,frontend}/`
**브랜치**: `feature/704-wiki-permissions-abac`
**트래킹 이슈**: `kenshin579/tutorials-go#704`
**Spec**: `docs/superpowers/specs/2026-05-01-wiki-permissions-design.md`
**참조 plan**: `docs/superpowers/plans/2026-05-01-wiki-permissions-1-acl.md`, `docs/superpowers/plans/2026-05-01-wiki-permissions-2-rbac.md`

---

## 결정 사항 (브레인스토밍 단계에서 확정)

| 항목 | 값 |
|---|---|
| 사용자 속성 | `department_id`, `employment_type` ∈ {fulltime, contract} |
| 페이지 속성 | `confidentiality` ∈ {public, internal, confidential}, `department_id` (nullable, public은 부서 없음) |
| Department 엔티티 | `id`, `name` — engineering / marketing 2개 |
| 정책 평가기 | 외부 라이브러리(OPA/Cedar) 미사용. Go 함수 + decision struct로 직접 구현 |
| 정책 표현 | 코드(Go 함수)에 hardcode (DB 정책 테이블 미사용 — 학습 목적 단순화) |
| 시간대 / IP 등 환경 속성 | 본 편 코드에는 포함하지 않음 (글에서 ABAC의 확장 가능성으로만 언급) |
| 평가 위치 | usecase 계층 (1·2편과 동일 구조 — 글의 비교 메시지 강화) |
| 포트 | backend `:8082`, frontend `:3002` (1·2편과 동시 실행 가능) |

### 정책 매트릭스 (3편 핵심)

평가 우선순위 순:

1. **Owner 정책** — `page.owner_id == userID` 이면 모든 액션 허용 (1편의 owner short-circuit이 ABAC에서 다시 부활)
2. **Public 정책** — `page.confidentiality == "public"` 이면 모든 사용자 read 허용
3. **Internal 정책** — `page.confidentiality == "internal"` 이면 같은 부서(`page.department_id == user.department_id`) 사용자 read+edit 허용
4. **Confidential 정책** — `page.confidentiality == "confidential"` 이면 같은 부서 **정규직(`employment_type == "fulltime"`)** 만 read+edit 허용
5. **Default Deny** — 위 어디에도 해당 안 되면 거부

> RBAC의 "내 페이지만 수정"이 ABAC에서 어떻게 풀리는지: Owner 정책이 RBAC에는 표현 불가능했던 이 제약을 자연스럽게 표현한다.

---

## 시리즈 비교 메시지 (글에 사용)

| 영역 | 1편 ACL | 2편 RBAC | 3편 ABAC |
|---|---|---|---|
| 권한 데이터 | `ACLEntry(page_id, user_id, action)` | `Role + Permission + UserRole + RolePermission` | **속성** (User/Page 컬럼 추가) + 코드 정책 |
| 평가 대상 | (사용자, 리소스) 매핑 | 사용자 → 역할 → 권한 lookup | (사용자 속성, 리소스 속성, 환경) → 정책 함수들 |
| 평가 함수 | `EvaluateACL` 30줄 | `HasPermission` 1줄 | 정책별 함수 + 우선순위 평가 (40~60줄) |
| owner 처리 | 자동 short-circuit | 무시 (한계) | 정책으로 명시 (한계 회복) |
| 표현력 | 낮음 (개별 grant) | 중간 (역할 그룹) | 높음 (속성 조합) |
| 운영 부담 | 사용자/페이지 수에 비례 | role 수에 비례 (role explosion) | 정책 수에 비례 (정책 설계가 핵심) |

---

## File Structure

### Backend (`tutorials-go/wiki-permissions/3-abac/backend/`)

```
backend/
├── go.mod / go.sum / main.go
├── domain/
│   ├── user.go                          # +department_id, +employment_type
│   ├── page.go                          # +confidentiality, +department_id (nullable)
│   ├── department.go                    # 신규 (간단)
│   ├── repository.go                    # 인터페이스
│   └── policy.go                        # ABAC 정책 평가기 (시리즈 핵심 코드)
├── config/
│   ├── db.go                            # SQLite + AutoMigrate
│   └── seed.go                          # 사용자 4 (속성 포함) + 페이지 3 (분류·부서) + 부서 2
├── pkg/
│   ├── passwordhash/                    # 1·2편과 100% 동일
│   └── jwt/                             # 1·2편과 100% 동일
├── repository/
│   ├── user_repository.go               # 1·2편과 비슷, department Preload
│   ├── page_repository.go               # 1·2편과 비슷, ABAC 필터링 없이 List
│   ├── department_repository.go         # 신규 (List/FindByID)
│   └── *_test.go
├── usecase/
│   ├── auth_usecase.go                  # 1·2편과 비슷, login 응답 구조 단순화
│   └── page_usecase.go                  # 정책 평가기 호출
└── http/
    ├── middleware/jwt_auth.go           # 1·2편과 100% 동일
    ├── handler/{auth_handler.go, page_handler.go}
    └── router.go
```

### Frontend (`tutorials-go/wiki-permissions/3-abac/frontend/`)

```
frontend/
└── src/
    ├── api/client.ts                    # 1·2편과 100% 동일
    ├── auth/
    │   ├── AuthContext.tsx              # user에 department/employment_type 추가
    │   └── ProtectedRoute.tsx           # 1·2편과 100% 동일
    ├── components/
    │   └── Layout.tsx                   # 1·2편과 비슷, user 속성 표시 추가
    └── pages/
        ├── LoginPage.tsx                # 1·2편과 100% 동일 (시드 계정 안내만 갱신)
        ├── PageListPage.tsx             # 페이지 목록 + 분류 뱃지 표시
        └── PageDetailPage.tsx           # 정책 결정 결과 표시 (read/edit 가능 사유)
```

> Frontend는 1·2편보다 가볍게 — RBAC의 PermissionGate 같은 일반화 없이 페이지 단위로 서버가 내려준 권한 정보를 그대로 표시. 2편의 `users:manage` 메뉴는 없음 (admin role 자체가 없음).

---

## API 명세 (3편 ABAC)

| Method | Path | 권한(정책) | 설명 |
|---|---|---|---|
| POST | `/auth/login` | public | 로그인 → JWT + user(속성 포함) |
| GET | `/api/me` | 인증 | 현재 사용자 + department/employment_type |
| GET | `/api/pages` | 정책 평가 | 본인이 read 가능한 페이지만 반환 (서버에서 필터) |
| GET | `/api/pages/:id` | 정책 평가 | 페이지 상세 + decision 객체(`{can_read, can_edit, reason}`) |
| PUT | `/api/pages/:id` | 정책 평가 (edit) | 정책 통과 시 갱신 |
| GET | `/api/departments` | 인증 | 부서 목록 (페이지 생성 등에 참조) |

> 1·2편의 페이지 CRUD에서 **delete는 의도적으로 빼기** (ABAC 정책에서 delete까지 다루면 매트릭스 복잡). 글의 비교 메시지를 명확히 하기 위함.

---

## 시드 데이터

### Department

| id | name |
|---|---|
| 1 | Engineering |
| 2 | Marketing |

### 사용자 풀

| Email | 비밀번호 | department | employment_type |
|---|---|---|---|
| alice@example.com | password | Engineering | fulltime |
| bob@example.com | password | Engineering | fulltime |
| carol@example.com | password | Marketing | fulltime |
| dave@example.com | password | Marketing | contract |

### 페이지 풀

| Title | confidentiality | department | owner |
|---|---|---|---|
| Engineering Roadmap | internal | Engineering | alice |
| Q4 Marketing Plan | confidential | Marketing | carol |
| Public Onboarding Guide | public | (none) | alice |

### 시나리오 매핑 (시연용)

| 사용자 | EngRoadmap (internal/Eng) | Q4MktPlan (confidential/Mkt) | Onboarding (public) |
|---|---|---|---|
| alice (Eng/fulltime) | **owner → all** | × (다른 부서) | read (public) |
| bob (Eng/fulltime) | read+edit (같은 부서 internal) | × (다른 부서) | read (public) |
| carol (Mkt/fulltime) | × (다른 부서 internal) | **owner → all** | read (public) |
| dave (Mkt/contract) | × (다른 부서 internal) | × (contract — confidential 거부) | read (public) |

> 4사용자 × 3페이지 = 12 케이스로 ABAC 4개 정책(owner / public / internal / confidential)이 모두 시연된다.

---

# Phase 0 — 사전 준비

### Task 1: feature 브랜치 + 부모 디렉토리

```bash
cd /Users/user/src/workspace_blog3/tutorials-go
git checkout master && git pull origin master
git checkout -b feature/704-wiki-permissions-abac
mkdir -p wiki-permissions/3-abac/backend wiki-permissions/3-abac/frontend
```

부모 README의 시리즈 표는 마지막 task에서 갱신.

---

# Phase 1 — Backend 인프라

### Task 2: Go 모듈 + main.go (port :8082)

1·2편 Task 2와 동일 패턴, 단 import path는 `3-abac`, port는 `:8082`.

**Commit**: `[#704] 3-abac backend: Go 모듈 초기화 및 health 엔드포인트 (port :8082)`

---

### Task 3: 도메인 엔티티 (User+속성, Page+속성, Department)

**`domain/department.go`** (신규):

```go
package domain

import "time"

type Department struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
}
```

**`domain/user.go`** (1·2편 + 속성):

```go
package domain

import "time"

type EmploymentType string

const (
	EmploymentFulltime EmploymentType = "fulltime"
	EmploymentContract EmploymentType = "contract"
)

type User struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Email          string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Name           string         `gorm:"size:100;not null" json:"name"`
	PasswordHash   string         `gorm:"size:255;not null" json:"-"`
	DepartmentID   uint           `gorm:"not null;index" json:"department_id"`
	Department     *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	EmploymentType EmploymentType `gorm:"size:20;not null" json:"employment_type"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}
```

**`domain/page.go`** (1·2편 + 속성):

```go
package domain

import "time"

type Confidentiality string

const (
	ConfidentialityPublic       Confidentiality = "public"
	ConfidentialityInternal     Confidentiality = "internal"
	ConfidentialityConfidential Confidentiality = "confidential"
)

type Page struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	Title           string          `gorm:"size:255;not null" json:"title"`
	Content         string          `gorm:"type:text" json:"content"`
	OwnerID         uint            `gorm:"not null;index:owner_id" json:"owner_id"`
	Owner           *User           `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Confidentiality Confidentiality `gorm:"size:20;not null" json:"confidentiality"`
	DepartmentID    *uint           `gorm:"index" json:"department_id,omitempty"` // public은 nil
	Department      *Department     `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}
```

**Commit**: `[#704] 3-abac backend: 도메인 엔티티 (User+department/employment_type, Page+confidentiality/department, Department)`

---

### Task 4: DB 연결 + AutoMigrate (TDD)

1·2편 Task 4 패턴. AutoMigrate에 4개 엔티티(User, Page, Department).

테스트: 4개 테이블 + FK index 존재 확인.

**Commit**: `[#704] 3-abac backend: SQLite + AutoMigrate (User/Page/Department)`

---

### Task 5: bcrypt 헬퍼 (TDD)

**참조: 1·2편 Task 5와 100% 동일.**

**Commit**: `[#704] 3-abac backend: bcrypt 비밀번호 해시 헬퍼`

---

### Task 6: JWT 헬퍼 (TDD)

**참조: 1·2편 Task 6과 100% 동일** (import path만 변경).

**Commit**: `[#704] 3-abac backend: JWT 발급/검증 헬퍼`

---

# Phase 2 — Backend 데이터 계층

### Task 7: Repository 인터페이스

```go
package domain

type UserRepository interface {
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
	Create(u *User) error
}

type PageRepository interface {
	FindByID(id uint) (*Page, error)
	List() ([]Page, error)            // 모든 페이지 — usecase에서 정책 평가로 필터
	Update(p *Page) error
	Create(p *Page) error
}

type DepartmentRepository interface {
	FindByID(id uint) (*Department, error)
	List() ([]Department, error)
}

type ErrNotFound struct{ Resource string }
func (e ErrNotFound) Error() string { return e.Resource + " not found" }
```

**Commit**: `[#704] 3-abac backend: repository 인터페이스 정의`

---

### Task 8: User repository (TDD)

1·2편과 패턴 동일. `Preload("Department")` 추가.

**Commit**: `[#704] 3-abac backend: UserRepository (Department Preload)`

---

### Task 9: Page repository (TDD)

1·2편과 패턴 동일. `Preload("Owner")` + `Preload("Department")`.

**Commit**: `[#704] 3-abac backend: PageRepository`

---

### Task 10: Department repository (TDD)

```go
type DepartmentRepository struct{ db *gorm.DB }

var _ domain.DepartmentRepository = (*DepartmentRepository)(nil)

func NewDepartmentRepository(db *gorm.DB) *DepartmentRepository {
	return &DepartmentRepository{db: db}
}

func (r *DepartmentRepository) FindByID(id uint) (*domain.Department, error) {
	var d domain.Department
	if err := r.db.First(&d, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound{Resource: "department"}
		}
		return nil, err
	}
	return &d, nil
}

func (r *DepartmentRepository) List() ([]domain.Department, error) {
	var ds []domain.Department
	err := r.db.Order("id ASC").Find(&ds).Error
	return ds, err
}
```

**Commit**: `[#704] 3-abac backend: DepartmentRepository`

---

### Task 11: 시드 데이터 (TDD)

```go
func Seed(db *gorm.DB) error {
	// 1) Departments — name uniqueIndex + OnConflict
	depts := []domain.Department{{Name: "Engineering"}, {Name: "Marketing"}}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&depts).Error; err != nil {
		return err
	}
	deptByName := map[string]uint{}
	for _, d := range depts {
		var found domain.Department
		if err := db.Where("name = ?", d.Name).First(&found).Error; err != nil { return err }
		deptByName[d.Name] = found.ID
	}

	// 2) Users — Email uniqueIndex + OnConflict
	hash, _ := passwordhash.Hash("password")
	users := []domain.User{
		{Email: "alice@example.com", Name: "Alice", PasswordHash: hash, DepartmentID: deptByName["Engineering"], EmploymentType: domain.EmploymentFulltime},
		{Email: "bob@example.com",   Name: "Bob",   PasswordHash: hash, DepartmentID: deptByName["Engineering"], EmploymentType: domain.EmploymentFulltime},
		{Email: "carol@example.com", Name: "Carol", PasswordHash: hash, DepartmentID: deptByName["Marketing"],   EmploymentType: domain.EmploymentFulltime},
		{Email: "dave@example.com",  Name: "Dave",  PasswordHash: hash, DepartmentID: deptByName["Marketing"],   EmploymentType: domain.EmploymentContract},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&users).Error; err != nil { return err }
	byEmail := map[string]uint{}
	for _, u := range users {
		var found domain.User
		if err := db.Where("email = ?", u.Email).First(&found).Error; err != nil { return err }
		byEmail[u.Email] = found.ID
	}

	// 3) Pages — title에 unique 없음, lookup-or-create
	engID, mktID := deptByName["Engineering"], deptByName["Marketing"]
	pageSpecs := []domain.Page{
		{Title: "Engineering Roadmap", Content: "...", OwnerID: byEmail["alice@example.com"], Confidentiality: domain.ConfidentialityInternal, DepartmentID: &engID},
		{Title: "Q4 Marketing Plan",   Content: "...", OwnerID: byEmail["carol@example.com"], Confidentiality: domain.ConfidentialityConfidential, DepartmentID: &mktID},
		{Title: "Public Onboarding Guide", Content: "...", OwnerID: byEmail["alice@example.com"], Confidentiality: domain.ConfidentialityPublic, DepartmentID: nil},
	}
	for _, p := range pageSpecs {
		var found domain.Page
		err := db.Where("title = ? AND owner_id = ?", p.Title, p.OwnerID).First(&found).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			created := p
			if err := db.Create(&created).Error; err != nil { return err }
		}
	}
	return nil
}
```

테스트: count 확인 + idempotent 확인.

**Commit**: `[#704] 3-abac backend: 시드 데이터 (부서 2 + 사용자 4 with 속성 + 페이지 3 with 속성)`

---

# Phase 3 — Backend 비즈니스 계층 (시리즈 핵심 코드)

### Task 12: ABAC 정책 평가기 — `domain/policy.go` (TDD)

**시리즈 마지막 편의 핵심 코드.**

```go
package domain

// Action은 페이지에 대한 액션이다 (read/edit).
type Action string

const (
	ActionRead Action = "read"
	ActionEdit Action = "edit"
)

// Decision은 정책 평가 결과를 표현한다.
// Allowed가 true이면 액션 허용, false이면 거부.
// Reason은 사용자에게 보여줄 결정 이유 (한 줄 설명) — UX/감사용.
// Policy는 어떤 정책이 결정을 내렸는지 식별자 (디버깅/감사용).
type Decision struct {
	Allowed bool
	Reason  string
	Policy  string
}

// EvaluateABAC는 (사용자, 페이지, 액션) 트리플에 대해 ABAC 정책을 평가한다.
//
// 평가 우선순위:
//   1) Owner 정책 — page.OwnerID == user.ID 면 모든 액션 허용
//   2) Public 정책 — page.Confidentiality == public 이면 누구나 read 허용 (edit은 거부)
//   3) Internal 정책 — page.Confidentiality == internal 이면 같은 부서 read+edit 허용
//   4) Confidential 정책 — page.Confidentiality == confidential 이면 같은 부서 정규직만 read+edit 허용
//   5) Default — 위 어디에도 해당 안 되면 거부
//
// 1편(ACL)이 owner short-circuit + edit→read 함의로 평가했다면, 본 편은 정책 함수들의 우선순위 평가다.
// 외부 정책 엔진(OPA/Cedar)이 아닌 Go 함수로 구현해 ABAC의 본질에 집중한다.
func EvaluateABAC(user *User, page *Page, action Action) Decision {
	if user == nil || page == nil {
		return Decision{Allowed: false, Reason: "user or page is nil", Policy: "guard"}
	}

	// 1) Owner
	if page.OwnerID == user.ID {
		return Decision{Allowed: true, Reason: "owner of the page", Policy: "owner"}
	}

	// 2) Public
	if page.Confidentiality == ConfidentialityPublic {
		if action == ActionRead {
			return Decision{Allowed: true, Reason: "public page", Policy: "public"}
		}
		return Decision{Allowed: false, Reason: "public page is read-only for non-owners", Policy: "public"}
	}

	// internal/confidential은 부서 매칭 필요
	if page.DepartmentID == nil || *page.DepartmentID != user.DepartmentID {
		return Decision{Allowed: false, Reason: "different department", Policy: "department-match"}
	}

	// 3) Internal
	if page.Confidentiality == ConfidentialityInternal {
		return Decision{Allowed: true, Reason: "same department, internal page", Policy: "internal"}
	}

	// 4) Confidential
	if page.Confidentiality == ConfidentialityConfidential {
		if user.EmploymentType != EmploymentFulltime {
			return Decision{Allowed: false, Reason: "confidential pages require fulltime employment", Policy: "confidential"}
		}
		return Decision{Allowed: true, Reason: "same department, fulltime, confidential page", Policy: "confidential"}
	}

	return Decision{Allowed: false, Reason: "no policy matched", Policy: "default-deny"}
}
```

테스트 (시드 시나리오의 12 케이스 — 4 사용자 × 3 페이지):

```go
func TestEvaluateABAC_OwnerAllAccess(t *testing.T)
func TestEvaluateABAC_PublicReadButNotEdit(t *testing.T)
func TestEvaluateABAC_InternalSameDepartment(t *testing.T)
func TestEvaluateABAC_InternalDifferentDepartment(t *testing.T)
func TestEvaluateABAC_ConfidentialFulltime(t *testing.T)
func TestEvaluateABAC_ConfidentialContract(t *testing.T)
func TestEvaluateABAC_ConfidentialDifferentDepartment(t *testing.T)
func TestEvaluateABAC_NilGuard(t *testing.T)
```

각 테스트는 Decision의 `Allowed` + `Policy` 필드를 검증.

**Commit**: `[#704] 3-abac backend: ABAC 정책 평가기 EvaluateABAC (4 정책 + decision struct)`

---

### Task 13: Auth usecase

1·2편과 동일 패턴. login 응답에 user의 department/employment_type 속성 포함 (User 자체에 GORM Preload로 들어옴).

**Commit**: `[#704] 3-abac backend: AuthUsecase (login + 사용자 속성 응답)`

---

### Task 14: Page usecase (정책 통합)

```go
type PageUsecase struct {
	pages domain.PageRepository
	users domain.UserRepository
}

var ErrForbidden = errors.New("forbidden")

func NewPageUsecase(pages domain.PageRepository, users domain.UserRepository) *PageUsecase {
	return &PageUsecase{pages: pages, users: users}
}

// List는 모든 페이지를 가져온 뒤 ABAC read 정책을 통과한 페이지만 반환한다.
// (1·2편의 List는 권한 체크가 동일하게 적용되거나 SQL로 미리 필터됐지만,
// ABAC은 사용자 속성과 페이지 속성을 결합 평가하므로 메모리 필터가 자연스럽다.)
func (u *PageUsecase) List(userID uint) ([]domain.Page, error) {
	user, err := u.users.FindByID(userID)
	if err != nil { return nil, err }
	all, err := u.pages.List()
	if err != nil { return nil, err }
	out := make([]domain.Page, 0, len(all))
	for i := range all {
		if domain.EvaluateABAC(user, &all[i], domain.ActionRead).Allowed {
			out = append(out, all[i])
		}
	}
	return out, nil
}

// PageWithDecision은 페이지 + 호출자가 가진 액션 결정 정보를 함께 응답한다.
type PageWithDecision struct {
	Page    *domain.Page
	CanRead domain.Decision
	CanEdit domain.Decision
}

func (u *PageUsecase) Get(pageID, userID uint) (*PageWithDecision, error) {
	user, err := u.users.FindByID(userID)
	if err != nil { return nil, err }
	page, err := u.pages.FindByID(pageID)
	if err != nil { return nil, err }
	canRead := domain.EvaluateABAC(user, page, domain.ActionRead)
	if !canRead.Allowed {
		return nil, ErrForbidden
	}
	canEdit := domain.EvaluateABAC(user, page, domain.ActionEdit)
	return &PageWithDecision{Page: page, CanRead: canRead, CanEdit: canEdit}, nil
}

func (u *PageUsecase) Update(pageID, userID uint, title, content string) (*domain.Page, error) {
	user, err := u.users.FindByID(userID)
	if err != nil { return nil, err }
	page, err := u.pages.FindByID(pageID)
	if err != nil { return nil, err }
	if !domain.EvaluateABAC(user, page, domain.ActionEdit).Allowed {
		return nil, ErrForbidden
	}
	page.Title = title
	page.Content = content
	return page, u.pages.Update(page)
}
```

테스트 (시드 사용 — 12 케이스 매트릭스 일부):
- `TestPageUsecase_List_FiltersByPolicy_Bob` — bob (Eng/fulltime) → 모든 페이지 read 가능 (owner 없는 경우는 internal Eng + public)
- `TestPageUsecase_List_FiltersByPolicy_Dave` — dave (Mkt/contract) → public만
- `TestPageUsecase_Get_DecisionWithCanEdit` — bob이 Q4 페이지 Get → 다른 부서라 Forbidden
- `TestPageUsecase_Update_RequiresEditDecision` — alice가 자기 페이지 Update OK / bob이 Q4 Update → Forbidden

**Commit**: `[#704] 3-abac backend: PageUsecase (정책 통합 + decision 응답)`

---

# Phase 4 — Backend HTTP 계층

### Task 15: JWT 인증 미들웨어 (TDD)

**참조: 1·2편 Task 16과 100% 동일.**

**Commit**: `[#704] 3-abac backend: JWT 인증 미들웨어`

---

### Task 16: Auth handler

1·2편 패턴. login 응답:

```go
type loginResponse struct {
    Token string    `json:"token"`
    User  loginUser `json:"user"` // department + employment_type 포함
}
```

> 1편처럼 단순. RBAC의 permissions/roles는 ABAC에는 없음.

**Commit**: `[#704] 3-abac backend: AuthHandler`

---

### Task 17: Page handler (decision 응답 포함)

```go
// Get 응답 형식
type pageGetResponse struct {
    Page     domain.Page    `json:"page"`
    CanRead  domain.Decision `json:"can_read"`
    CanEdit  domain.Decision `json:"can_edit"`
}
```

기타 List/Update는 1·2편 패턴.

**Commit**: `[#704] 3-abac backend: PageHandler (decision 응답)`

---

### Task 18: Department handler

```go
// GET /api/departments — 인증된 사용자에게 부서 목록 반환
```

**Commit**: `[#704] 3-abac backend: DepartmentHandler`

---

### Task 19: 라우터 + main.go

1·2편 패턴, port :8082, DB `wiki-abac.db`. 라우트 변경 (delete 없음, ACL/role 없음, departments 추가).

**Commit**: `[#704] 3-abac backend: 라우터 + main.go 통합 (port :8082)`

---

### Task 20: Backend README

1·2편 README 패턴 + 정책 매트릭스 + 시리즈 비교.

**Commit**: `[#704] 3-abac backend: README 작성`

---

# Phase 5 — Frontend 인프라

### Task 21: Vite + React + Tailwind 초기화 (port 3002)

**참조: 1·2편 Task 22와 동일.** `vite.config.ts` proxy → `:8082`, port → `:3002`.

**Commit**: `[#704] 3-abac frontend: Vite + React 19 + TS + Tailwind v4 초기화 (port 3002)`

---

### Task 22: API client + AuthContext + ProtectedRoute + LoginPage

1편 패턴 (RBAC의 permissions[] 없음). AuthContext의 User에 `department`, `employment_type` 추가.

**Commit**: `[#704] 3-abac frontend: API 클라이언트 + AuthContext + ProtectedRoute + LoginPage`

---

# Phase 6 — Frontend 화면

### Task 23: Layout + 페이지 목록 (분류 뱃지)

```tsx
// PageListPage — 페이지마다 confidentiality 뱃지 표시
<span className={confidentialityBadge(page.confidentiality)}>
  {page.confidentiality}
</span>
```

뱃지 색상: public(녹색), internal(주황), confidential(빨강).

**Commit**: `[#704] 3-abac frontend: Layout + 페이지 목록 (분류 뱃지)`

---

### Task 24: 페이지 상세 (정책 결정 표시)

```tsx
// PageDetailPage — 서버가 내려준 decision을 사용자에게 명시적으로 보여줌
<div className="p-3 bg-blue-50 border-l-4 border-blue-500">
  <p>읽기 권한: {data.can_read.allowed ? '✓' : '✗'} — {data.can_read.reason}</p>
  <p>편집 권한: {data.can_edit.allowed ? '✓' : '✗'} — {data.can_edit.reason}</p>
</div>

{data.can_edit.allowed && <button onClick={edit}>편집</button>}
```

> ABAC의 미덕: 사용자에게 "왜 이 액션이 허용/거부됐는지" 이유를 자연스럽게 표시 가능. RBAC의 단순 yes/no보다 풍부한 UX.

**Commit**: `[#704] 3-abac frontend: 페이지 상세 (정책 결정 reason 표시)`

---

### Task 25: App.tsx 라우터 통합

1편 패턴. `/users` 같은 admin 라우트 없음 (ABAC에는 admin role이 없음).

**Commit**: `[#704] 3-abac frontend: 라우터 통합`

---

### Task 26: README들

- `3-abac/frontend/README.md`
- `3-abac/README.md` — 시리즈 비교 표 + 정책 매트릭스
- 부모 `wiki-permissions/README.md` — 3편 "예정" 제거 + 시리즈 종합 표

**Commit**: `[#704] 3-abac: README 작성 (frontend, 3편 통합, 부모 시리즈 종합 표)`

---

# Phase 7 — PR 생성

### Task 27: 최종 검증 + push + PR

1·2편 Task 31 패턴:

1. backend: `go test ./...` + `go build` + `go vet` + `gofmt -l`
2. frontend: `npm run build`
3. 인코딩 일괄 확인
4. push: `feature/704-wiki-permissions-abac`
5. PR: `[#704] feat: wiki-permissions 3편 ABAC 풀스택 샘플 코드 (시리즈 완결)`
6. reviewer: kenshin579

PR 본문에 1·2·3편 종합 비교 표 + 시드 시나리오 + 시리즈 완결 안내 포함.

---

## 자체 검증 사항 (실행자가 PR 전 확인)

- [ ] backend `go test ./...` PASS — 특히 `EvaluateABAC` 8개 테스트
- [ ] backend `go build ./...` 무에러
- [ ] frontend `npm run build` 무에러
- [ ] 시드 시나리오 12 케이스 cURL 시연:
  - alice가 EngRoadmap update OK (owner)
  - bob이 EngRoadmap update OK (같은 부서 internal)
  - carol이 EngRoadmap GET → 403 (다른 부서)
  - dave가 Q4 GET → 403 (contract → confidential 거부)
  - 모두 Public Onboarding GET OK
- [ ] 페이지 상세에서 decision의 reason이 한국어/영문으로 표시됨
- [ ] 1편(:8080/:3000), 2편(:8081/:3001), 3편(:8082/:3002) 동시 실행 비교

---

## 1·2편과의 차이 요약 (실행자 참고)

| 영역 | 1편 ACL | 2편 RBAC | 3편 ABAC |
|---|---|---|---|
| 도메인 추가 | ACLEntry 1테이블 | Role + Permission + 자동 join 2 | User/Page에 컬럼 추가 + Department 1테이블 |
| 평가 함수 | `EvaluateACL` 30줄 | `HasPermission` 1줄 | `EvaluateABAC` 40~60줄 (정책 우선순위) |
| 평가 입력 | (page, user, want, entries) | (perms, want) | (user, page, action) |
| 평가 출력 | bool | bool | Decision struct (Allowed + Reason + Policy) |
| 핵심 SQL | LEFT JOIN acl_entries | JOIN role_permissions + user_roles | (DB JOIN 최소 — 정책은 메모리에서) |
| Frontend 게이팅 | 없음 | PermissionGate (사전) | decision 메시지로 표시 (왜 허용/거부) |
| owner 처리 | short-circuit | 무시 (한계) | 정책으로 명시 (한계 회복) |
| 한계 시나리오 | cross product 폭발 | role explosion + 컨텍스트 부재 | 정책 설계 복잡도 (좋은 정책 카탈로그가 운영 핵심) |

## Notes

- 시간대/IP 같은 환경 속성은 본 plan 코드에 포함하지 않음. 글에서 ABAC의 확장 가능성으로만 언급.
- DB에 정책을 저장하지 않고 코드(Go 함수)로 표현. 학습 목적의 단순화이며, 운영에서는 OPA(Open Policy Agent)나 Cedar 같은 정책 엔진을 권장한다는 안내를 글에 포함한다.
- 본 plan은 3편(ABAC) 코드에 한정한다. 시리즈 종합 비교 글, 운영 환경 OPA 도입 가이드 등은 별도 작업.
