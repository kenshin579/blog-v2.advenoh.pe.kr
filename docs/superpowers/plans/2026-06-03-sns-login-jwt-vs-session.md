# SNS 로그인 JWT vs 세션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google OAuth 로그인 샘플을 JWT(무상태)·세션(SQLite) 두 구현으로 분리하고, 블로그를 하나의 글로 재구성해 JWT vs 세션 차이를 다룬다.

**Architecture:** OAuth code 교환·회원가입은 공통, "인증 이후 상태 유지"만 다르다. JWT 버전은 프론트 redirect + Bearer 토큰(타입 구분), 세션 버전은 백엔드 redirect + `sessions` 테이블 + HttpOnly 쿠키(서버측 로그아웃).

**Tech Stack:** Go 1.25, Echo v4, GORM, SQLite(mattn/go-sqlite3), golang-jwt/v5, React 19 + Vite + axios.

**대상 저장소:** `tutorials-go`(코드), `blog-v2.advenoh.pe.kr`(블로그). 작업은 각 저장소의 feature 브랜치에서 진행한다.

**참조 스펙:** `blog-v2.advenoh.pe.kr/docs/superpowers/specs/2026-06-03-sns-login-jwt-vs-session-design.md`

---

## 파일 구조

### Phase 1 — `tutorials-go/web/sns-login-jwt/` (기존 `sns-login` rename + 수정)
- Rename: `web/sns-login/` → `web/sns-login-jwt/` (git mv, 모듈 경로 갱신)
- Modify: `backend/service/token_service.go` — 토큰 타입 클레임(B-4)
- Modify: `backend/middleware/auth_middleware.go` — access 토큰만 허용(B-4)
- Modify: `backend/service/auth_service.go` — 재로그인 프로필 갱신(A-3)
- Modify: `backend/repository/user_repository.go` — `Update` 추가(A-3)
- Modify: `backend/config/config.go` — redirect_uri 프론트로(C-9), 시크릿 기본값(B-7)
- Modify: `docker-compose.yml` — env 정리(C-9/B-7)
- Test: `backend/service/token_service_test.go`, `backend/middleware/auth_middleware_test.go`, `backend/service/auth_service_test.go`

### Phase 2 — `tutorials-go/web/sns-login-session/` (신규)
- Create: 전체 (Phase 1 복제 후 세션화)
- Create: `backend/model/session.go` — Session 모델
- Create: `backend/repository/session_repository.go` — 세션 CRUD
- Create: `backend/service/session_service.go` — 세션 생성/검증/삭제
- Create: `backend/middleware/session_middleware.go` — 쿠키 기반 인증
- Modify: `backend/service/auth_service.go` — JWT 대신 세션 발급
- Modify: `backend/handler/auth_handler.go` — 콜백에서 쿠키 설정 + 프론트 redirect, 로그아웃 시 세션 삭제
- Remove: JWT 전용(`token_service.go`, JWT 미들웨어)
- Modify: frontend — 토큰 보관 제거, `withCredentials`, OAuthCallback 단순화
- Test: `backend/repository/session_repository_test.go`, `backend/service/session_service_test.go`, `backend/middleware/session_middleware_test.go`

### Phase 3 — `blog-v2.advenoh.pe.kr` 블로그
- Modify: `docs/read/go-google-oauth-로그인-구현-가이드/index.md` — 통합 글 재구성

---

## 사전 준비: Go 테스트 헬퍼 패턴

여러 테스트에서 in-memory SQLite를 쓴다. 각 테스트 파일에서 아래 패턴을 사용한다(중복 정의 금지: 같은 패키지 내 한 번만 정의).

```go
func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("DB 연결 실패: %v", err)
	}
	return db
}
```

---

## Phase 1: sns-login-jwt

### Task 1: 폴더 rename 및 모듈 경로 갱신

**Files:**
- Rename: `web/sns-login/` → `web/sns-login-jwt/`
- Modify: `web/sns-login-jwt/backend/go.mod`, 모든 `.go` import 경로

- [ ] **Step 1: git mv 로 폴더 이동**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git checkout -b feat/sns-login-jwt-session
git mv web/sns-login web/sns-login-jwt
```

- [ ] **Step 2: 모듈 경로 일괄 치환**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-jwt
grep -rl 'web/sns-login/backend' backend | xargs sed -i '' 's#web/sns-login/backend#web/sns-login-jwt/backend#g'
```

- [ ] **Step 3: 빌드로 경로 검증**

Run: `cd backend && go build ./...`
Expected: 에러 없이 빌드 성공

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add -A
git commit -m "refactor: sns-login → sns-login-jwt 폴더 및 모듈 경로 변경"
```

---

### Task 2: 토큰 타입 클레임 추가 (B-4)

`Claims`에 `TokenType` 필드를 추가하고, access/refresh를 구분해 발급·검증한다.

**Files:**
- Modify: `backend/service/token_service.go`
- Test: `backend/service/token_service_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/service/token_service_test.go`:
```go
package service

import (
	"testing"
)

func TestGenerateTokenPair_TokenTypes(t *testing.T) {
	s := NewTokenService("test-secret")

	pair, err := s.GenerateTokenPair(42)
	if err != nil {
		t.Fatalf("토큰 생성 실패: %v", err)
	}

	accessClaims, err := s.ValidateToken(pair.AccessToken)
	if err != nil {
		t.Fatalf("access 토큰 검증 실패: %v", err)
	}
	if accessClaims.TokenType != "access" {
		t.Errorf("access 토큰 타입 기대값 access, 실제 %q", accessClaims.TokenType)
	}
	if accessClaims.UserID != 42 {
		t.Errorf("UserID 기대값 42, 실제 %d", accessClaims.UserID)
	}

	refreshClaims, err := s.ValidateToken(pair.RefreshToken)
	if err != nil {
		t.Fatalf("refresh 토큰 검증 실패: %v", err)
	}
	if refreshClaims.TokenType != "refresh" {
		t.Errorf("refresh 토큰 타입 기대값 refresh, 실제 %q", refreshClaims.TokenType)
	}
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && go test ./service/ -run TestGenerateTokenPair_TokenTypes -v`
Expected: 컴파일 에러(`TokenType` 필드 없음)

- [ ] **Step 3: 구현**

`backend/service/token_service.go` 전체를 아래로 교체:
```go
package service

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

type TokenService struct {
	secret        []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type Claims struct {
	UserID    uint   `json:"user_id"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func NewTokenService(secret string) *TokenService {
	return &TokenService{
		secret:        []byte(secret),
		accessExpiry:  15 * time.Minute,
		refreshExpiry: 7 * 24 * time.Hour, // 7일
	}
}

func (s *TokenService) GenerateTokenPair(userID uint) (*TokenPair, error) {
	accessToken, err := s.generateToken(userID, TokenTypeAccess, s.accessExpiry)
	if err != nil {
		return nil, err
	}
	refreshToken, err := s.generateToken(userID, TokenTypeRefresh, s.refreshExpiry)
	if err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func (s *TokenService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("예상하지 못한 서명 방식: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("유효하지 않은 토큰")
	}
	return claims, nil
}

func (s *TokenService) generateToken(userID uint, tokenType string, expiry time.Duration) (string, error) {
	claims := &Claims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && go test ./service/ -run TestGenerateTokenPair_TokenTypes -v`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/service/token_service.go backend/service/token_service_test.go
git commit -m "feat: JWT access/refresh 토큰 타입 클레임 추가 (B-4)"
```

---

### Task 3: 미들웨어가 access 토큰만 허용 (B-4)

**Files:**
- Modify: `backend/middleware/auth_middleware.go`
- Test: `backend/middleware/auth_middleware_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/middleware/auth_middleware_test.go`:
```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kenshin579/tutorials-go/web/sns-login-jwt/backend/service"
	"github.com/labstack/echo/v4"
)

func TestJWTAuth_RejectsRefreshToken(t *testing.T) {
	ts := service.NewTokenService("test-secret")
	pair, _ := ts.GenerateTokenPair(7)

	e := echo.New()
	handler := JWTAuth(ts)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	// refresh 토큰으로 보호 API 호출 → 거부되어야 함
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+pair.RefreshToken)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler(c)
	if err == nil {
		t.Fatal("refresh 토큰이 거부되지 않음 (에러 nil)")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok || he.Code != http.StatusUnauthorized {
		t.Fatalf("401 기대, 실제 %v", err)
	}
}

func TestJWTAuth_AcceptsAccessToken(t *testing.T) {
	ts := service.NewTokenService("test-secret")
	pair, _ := ts.GenerateTokenPair(7)

	e := echo.New()
	handler := JWTAuth(ts)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := handler(c); err != nil {
		t.Fatalf("access 토큰이 거부됨: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("200 기대, 실제 %d", rec.Code)
	}
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && go test ./middleware/ -v`
Expected: `TestJWTAuth_RejectsRefreshToken` FAIL (refresh 토큰이 통과됨)

- [ ] **Step 3: 구현**

`backend/middleware/auth_middleware.go`의 토큰 검증 직후 타입 확인을 추가. `ValidateToken` 호출 블록을 아래로 교체:
```go
			claims, err := tokenService.ValidateToken(parts[1])
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "유효하지 않은 토큰")
			}

			// access 토큰만 보호 API 접근 허용 (refresh 토큰 차단)
			if claims.TokenType != service.TokenTypeAccess {
				return echo.NewHTTPError(http.StatusUnauthorized, "access 토큰이 필요합니다")
			}

			c.Set("user_id", claims.UserID)
			return next(c)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && go test ./middleware/ -v`
Expected: 두 테스트 모두 PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/middleware/auth_middleware.go backend/middleware/auth_middleware_test.go
git commit -m "feat: 미들웨어에서 access 토큰만 허용 (B-4)"
```

---

### Task 4: 재로그인 시 프로필 갱신 (A-3)

`findOrCreateUser`가 기존 사용자의 Name/AvatarURL을 최신 값으로 갱신한다.

**Files:**
- Modify: `backend/repository/user_repository.go` — `Update` 추가
- Modify: `backend/service/auth_service.go` — `findOrCreateUser` 갱신 로직
- Test: `backend/service/auth_service_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/service/auth_service_test.go`:
```go
package service

import (
	"testing"

	"github.com/kenshin579/tutorials-go/web/sns-login-jwt/backend/model"
	"github.com/kenshin579/tutorials-go/web/sns-login-jwt/backend/provider"
	"github.com/kenshin579/tutorials-go/web/sns-login-jwt/backend/repository"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("DB 연결 실패: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("마이그레이션 실패: %v", err)
	}
	return db
}

func TestFindOrCreateUser_UpdatesProfileOnRelogin(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewUserRepository(db)
	s := &AuthService{userRepo: repo}

	// 최초 로그인 → 생성
	u1, err := s.findOrCreateUser(&provider.UserInfo{
		Email: "a@gmail.com", Name: "홍길동", AvatarURL: "old.png",
		Provider: "google", ProviderID: "g-1",
	})
	if err != nil {
		t.Fatalf("최초 생성 실패: %v", err)
	}

	// 재로그인 → 이름/아바타 변경 반영, 같은 ID 유지
	u2, err := s.findOrCreateUser(&provider.UserInfo{
		Email: "a@gmail.com", Name: "홍길동2", AvatarURL: "new.png",
		Provider: "google", ProviderID: "g-1",
	})
	if err != nil {
		t.Fatalf("재로그인 실패: %v", err)
	}
	if u2.ID != u1.ID {
		t.Errorf("동일 사용자 ID 기대 %d, 실제 %d", u1.ID, u2.ID)
	}
	if u2.Name != "홍길동2" || u2.AvatarURL != "new.png" {
		t.Errorf("프로필 갱신 안 됨: name=%q avatar=%q", u2.Name, u2.AvatarURL)
	}
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && go test ./service/ -run TestFindOrCreateUser -v`
Expected: FAIL (프로필 갱신 안 됨 / `Update` 없음)

- [ ] **Step 3: repository에 Update 추가**

`backend/repository/user_repository.go`에 메서드 추가:
```go
// Update는 사용자 정보를 저장한다
func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
```

- [ ] **Step 4: findOrCreateUser 갱신 로직 구현**

`backend/service/auth_service.go`의 `findOrCreateUser`에서 기존 사용자 반환 부분을 교체:
```go
func (s *AuthService) findOrCreateUser(info *provider.UserInfo) (*model.User, error) {
	user, err := s.userRepo.FindByProviderID(info.Provider, info.ProviderID)
	if err == nil {
		// 재로그인: 프로필 최신화 (A-3)
		user.Name = info.Name
		user.AvatarURL = info.AvatarURL
		if err := s.userRepo.Update(user); err != nil {
			return nil, err
		}
		return user, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	newUser := &model.User{
		Email:      info.Email,
		Name:       info.Name,
		AvatarURL:  info.AvatarURL,
		Provider:   info.Provider,
		ProviderID: info.ProviderID,
	}
	if err := s.userRepo.Create(newUser); err != nil {
		return nil, err
	}
	return newUser, nil
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd backend && go test ./service/ -v`
Expected: 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add backend/repository/user_repository.go backend/service/auth_service.go backend/service/auth_service_test.go
git commit -m "feat: 재로그인 시 사용자 프로필 갱신 (A-3)"
```

---

### Task 5: redirect_uri 프론트 정렬(C-9) + 시크릿 기본값(B-7)

JWT/SPA 플로우에서는 Google이 **프론트**로 redirect하고, 프론트가 code를 백엔드 API로 전달한다.
따라서 `GoogleRedirectURL` 기본값을 프론트 콜백 라우트로 맞춘다.

**Files:**
- Modify: `backend/config/config.go`
- Modify: `docker-compose.yml`

- [ ] **Step 1: config 기본값 수정**

`backend/config/config.go`의 `Load()` 반환부에서 두 줄 교체:
```go
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:3000/auth/callback"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-only-change-me"),
```

- [ ] **Step 2: docker-compose env 정리**

`docker-compose.yml`의 backend `environment`에서 두 줄 교체:
```yaml
      - GOOGLE_REDIRECT_URL=http://localhost:3000/auth/callback
      - JWT_SECRET=${JWT_SECRET:-dev-only-change-me}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd backend && go build ./... && go vet ./...`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add backend/config/config.go docker-compose.yml
git commit -m "fix: JWT 버전 redirect_uri 프론트 정렬 및 시크릿 기본값 정리 (C-9/B-7)"
```

---

### Task 6: Phase 1 전체 테스트

- [ ] **Step 1: 전체 테스트 실행**

Run: `cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-jwt/backend && go test ./...`
Expected: 모든 패키지 PASS (no test 패키지는 `ok`/`no test files`)

- [ ] **Step 2: 빌드**

Run: `go build ./...`
Expected: 성공

---

## Phase 2: sns-login-session

### Task 7: 폴더 복제 및 모듈 경로 설정

**Files:**
- Create: `web/sns-login-session/` (sns-login-jwt 복제)

- [ ] **Step 1: 복제 후 모듈 경로 변경**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web
cp -R sns-login-jwt sns-login-session
cd sns-login-session
rm -rf backend/data backend/server frontend/node_modules frontend/dist
grep -rl 'web/sns-login-jwt/backend' backend | xargs sed -i '' 's#web/sns-login-jwt/backend#web/sns-login-session/backend#g'
# go.mod module 줄 갱신
sed -i '' 's#web/sns-login-jwt/backend#web/sns-login-session/backend#' backend/go.mod
# JWT 전용 테스트 제거 (세션 버전에서 새로 작성 → newTestDB 중복 정의 방지)
rm -f backend/service/token_service_test.go backend/service/auth_service_test.go backend/middleware/auth_middleware_test.go
```

- [ ] **Step 2: 빌드 확인**

Run: `cd backend && go build ./...`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add -A
git commit -m "chore: sns-login-session 폴더 복제 (세션 구현 기반)"
```

---

### Task 8: Session 모델

**Files:**
- Create: `backend/model/session.go`

- [ ] **Step 1: 모델 작성**

`backend/model/session.go`:
```go
package model

import "time"

// Session은 서버측 세션 (SQLite 저장)
type Session struct {
	ID        string    `gorm:"primarykey" json:"id"` // 랜덤 세션 토큰
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd backend && go build ./model/`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add backend/model/session.go
git commit -m "feat: Session 모델 추가 (세션)"
```

---

### Task 9: Session repository (TDD)

**Files:**
- Create: `backend/repository/session_repository.go`
- Test: `backend/repository/session_repository_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/repository/session_repository_test.go`:
```go
package repository

import (
	"testing"
	"time"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("DB 연결 실패: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.Session{}); err != nil {
		t.Fatalf("마이그레이션 실패: %v", err)
	}
	return db
}

func TestSessionRepository_CreateFindDelete(t *testing.T) {
	repo := NewSessionRepository(newTestDB(t))

	sess := &model.Session{ID: "tok-1", UserID: 5, ExpiresAt: time.Now().Add(time.Hour)}
	if err := repo.Create(sess); err != nil {
		t.Fatalf("생성 실패: %v", err)
	}

	found, err := repo.FindByID("tok-1")
	if err != nil {
		t.Fatalf("조회 실패: %v", err)
	}
	if found.UserID != 5 {
		t.Errorf("UserID 기대 5, 실제 %d", found.UserID)
	}

	if err := repo.Delete("tok-1"); err != nil {
		t.Fatalf("삭제 실패: %v", err)
	}
	if _, err := repo.FindByID("tok-1"); err == nil {
		t.Error("삭제 후에도 조회됨")
	}
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && go test ./repository/ -run TestSessionRepository -v`
Expected: 컴파일 에러(`NewSessionRepository` 없음)

- [ ] **Step 3: 구현**

`backend/repository/session_repository.go`:
```go
package repository

import (
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(s *model.Session) error {
	return r.db.Create(s).Error
}

func (r *SessionRepository) FindByID(id string) (*model.Session, error) {
	var s model.Session
	if err := r.db.First(&s, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) Delete(id string) error {
	return r.db.Delete(&model.Session{}, "id = ?", id).Error
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && go test ./repository/ -v`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/repository/session_repository.go backend/repository/session_repository_test.go
git commit -m "feat: SessionRepository 추가 (세션 CRUD)"
```

---

### Task 10: Session service (TDD)

세션 생성(랜덤 ID + 만료) / 검증(만료 체크) / 삭제.

**Files:**
- Create: `backend/service/session_service.go`
- Test: `backend/service/session_service_test.go`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/service/session_service_test.go`:
```go
package service

import (
	"testing"
	"time"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/repository"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("DB 연결 실패: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.Session{}); err != nil {
		t.Fatalf("마이그레이션 실패: %v", err)
	}
	return db
}

func TestSessionService_CreateAndValidate(t *testing.T) {
	repo := repository.NewSessionRepository(newTestDB(t))
	s := NewSessionService(repo, time.Hour)

	sess, err := s.Create(11)
	if err != nil {
		t.Fatalf("세션 생성 실패: %v", err)
	}
	if sess.ID == "" {
		t.Fatal("세션 ID가 비어있음")
	}

	userID, err := s.Validate(sess.ID)
	if err != nil {
		t.Fatalf("검증 실패: %v", err)
	}
	if userID != 11 {
		t.Errorf("UserID 기대 11, 실제 %d", userID)
	}
}

func TestSessionService_DeleteInvalidates(t *testing.T) {
	repo := repository.NewSessionRepository(newTestDB(t))
	s := NewSessionService(repo, time.Hour)

	sess, _ := s.Create(11)
	if err := s.Delete(sess.ID); err != nil {
		t.Fatalf("삭제 실패: %v", err)
	}
	if _, err := s.Validate(sess.ID); err == nil {
		t.Error("삭제 후에도 세션이 유효함 (서버측 로그아웃 실패)")
	}
}

func TestSessionService_RejectsExpired(t *testing.T) {
	repo := repository.NewSessionRepository(newTestDB(t))
	s := NewSessionService(repo, -time.Minute) // 이미 만료

	sess, _ := s.Create(11)
	if _, err := s.Validate(sess.ID); err == nil {
		t.Error("만료된 세션이 통과됨")
	}
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && go test ./service/ -run TestSessionService -v`
Expected: 컴파일 에러(`NewSessionService` 없음)

- [ ] **Step 3: 구현**

`backend/service/session_service.go`:
```go
package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/repository"
)

type SessionService struct {
	repo   *repository.SessionRepository
	expiry time.Duration
}

func NewSessionService(repo *repository.SessionRepository, expiry time.Duration) *SessionService {
	return &SessionService{repo: repo, expiry: expiry}
}

func (s *SessionService) Create(userID uint) (*model.Session, error) {
	sess := &model.Session{
		ID:        generateSessionID(),
		UserID:    userID,
		ExpiresAt: time.Now().Add(s.expiry),
	}
	if err := s.repo.Create(sess); err != nil {
		return nil, err
	}
	return sess, nil
}

// Validate는 세션 ID로 사용자 ID를 반환한다. 만료/없음이면 에러.
func (s *SessionService) Validate(id string) (uint, error) {
	sess, err := s.repo.FindByID(id)
	if err != nil {
		return 0, err
	}
	if time.Now().After(sess.ExpiresAt) {
		_ = s.repo.Delete(id) // 만료 세션 정리
		return 0, errors.New("만료된 세션")
	}
	return sess.UserID, nil
}

func (s *SessionService) Delete(id string) error {
	return s.repo.Delete(id)
}

func generateSessionID() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && go test ./service/ -run TestSessionService -v`
Expected: 3개 PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/service/session_service.go backend/service/session_service_test.go
git commit -m "feat: SessionService 추가 (생성/검증/만료/삭제)"
```

---

### Task 11: 세션 미들웨어 (TDD)

쿠키에서 세션 ID를 읽어 검증하고 `user_id`를 컨텍스트에 주입한다.

**Files:**
- Create: `backend/middleware/session_middleware.go`
- Test: `backend/middleware/session_middleware_test.go`
- Remove: `backend/middleware/auth_middleware.go`, `auth_middleware_test.go` (JWT 전용)

- [ ] **Step 1: JWT 미들웨어 제거**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-session/backend
rm -f middleware/auth_middleware.go
# auth_middleware_test.go 는 Task 7에서 이미 제거됨
```

- [ ] **Step 2: 실패하는 테스트 작성**

`backend/middleware/session_middleware_test.go`:
```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/repository"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/service"
	"github.com/labstack/echo/v4"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newSvc(t *testing.T) *service.SessionService {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("DB: %v", err)
	}
	db.AutoMigrate(&model.User{}, &model.Session{})
	return service.NewSessionService(repository.NewSessionRepository(db), time.Hour)
}

func TestSessionAuth_NoCookie_Rejected(t *testing.T) {
	e := echo.New()
	h := SessionAuth(newSvc(t))(func(c echo.Context) error { return c.String(200, "ok") })
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	c := e.NewContext(req, httptest.NewRecorder())
	if err := h(c); err == nil {
		t.Fatal("쿠키 없는 요청이 통과됨")
	}
}

func TestSessionAuth_ValidCookie_Passes(t *testing.T) {
	svc := newSvc(t)
	sess, _ := svc.Create(9)

	e := echo.New()
	h := SessionAuth(svc)(func(c echo.Context) error {
		if c.Get("user_id").(uint) != 9 {
			t.Errorf("user_id 기대 9")
		}
		return c.String(200, "ok")
	})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: sess.ID})
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	if err := h(c); err != nil {
		t.Fatalf("유효 쿠키가 거부됨: %v", err)
	}
}
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd backend && go test ./middleware/ -v`
Expected: 컴파일 에러(`SessionAuth` 없음)

- [ ] **Step 4: 구현**

`backend/middleware/session_middleware.go`:
```go
package middleware

import (
	"net/http"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/service"
	"github.com/labstack/echo/v4"
)

const SessionCookieName = "session_id"

// SessionAuth는 세션 쿠키를 검증하는 미들웨어
func SessionAuth(sessionService *service.SessionService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			cookie, err := c.Cookie(SessionCookieName)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "세션 쿠키가 필요합니다")
			}
			userID, err := sessionService.Validate(cookie.Value)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "유효하지 않은 세션")
			}
			c.Set("user_id", userID)
			return next(c)
		}
	}
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd backend && go test ./middleware/ -v`
Expected: 2개 PASS

- [ ] **Step 6: 커밋**

```bash
git add backend/middleware/
git commit -m "feat: 세션 쿠키 인증 미들웨어 추가, JWT 미들웨어 제거"
```

---

### Task 12: auth_service를 세션 방식으로 전환

JWT(`token_service`, `TokenPair`) 의존을 제거하고 세션을 발급한다.

**Files:**
- Modify: `backend/service/auth_service.go`
- Remove: `backend/service/token_service.go`, `token_service_test.go`

- [ ] **Step 1: token_service 제거**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-session/backend
rm -f service/token_service.go
# token_service_test.go 는 Task 7에서 이미 제거됨
```

- [ ] **Step 2: auth_service.go 재작성**

`backend/service/auth_service.go` 전체 교체:
```go
package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/model"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/provider"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/repository"
	"gorm.io/gorm"
)

type AuthService struct {
	providers      map[string]provider.OAuthProvider
	userRepo       *repository.UserRepository
	sessionService *SessionService
	states         sync.Map
}

func NewAuthService(
	providers map[string]provider.OAuthProvider,
	userRepo *repository.UserRepository,
	sessionService *SessionService,
) *AuthService {
	return &AuthService{
		providers:      providers,
		userRepo:       userRepo,
		sessionService: sessionService,
	}
}

func (s *AuthService) GetAuthURL(providerName string) (string, error) {
	p, ok := s.providers[providerName]
	if !ok {
		return "", errors.New("지원하지 않는 provider: " + providerName)
	}
	state := generateState()
	s.states.Store(state, true)
	return p.GetAuthURL(state), nil
}

// HandleCallback은 OAuth 콜백을 처리하고 세션을 생성, 세션 ID를 반환한다.
func (s *AuthService) HandleCallback(ctx context.Context, providerName, code, state string) (*model.Session, *model.User, error) {
	if _, ok := s.states.LoadAndDelete(state); !ok {
		return nil, nil, errors.New("유효하지 않은 state")
	}
	p, ok := s.providers[providerName]
	if !ok {
		return nil, nil, errors.New("지원하지 않는 provider: " + providerName)
	}
	userInfo, err := p.ExchangeCode(ctx, code)
	if err != nil {
		return nil, nil, err
	}
	user, err := s.findOrCreateUser(userInfo)
	if err != nil {
		return nil, nil, err
	}
	sess, err := s.sessionService.Create(user.ID)
	if err != nil {
		return nil, nil, err
	}
	return sess, user, nil
}

func (s *AuthService) Logout(sessionID string) error {
	return s.sessionService.Delete(sessionID)
}

func (s *AuthService) GetUser(userID uint) (*model.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *AuthService) findOrCreateUser(info *provider.UserInfo) (*model.User, error) {
	user, err := s.userRepo.FindByProviderID(info.Provider, info.ProviderID)
	if err == nil {
		user.Name = info.Name
		user.AvatarURL = info.AvatarURL
		if err := s.userRepo.Update(user); err != nil {
			return nil, err
		}
		return user, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	newUser := &model.User{
		Email:      info.Email,
		Name:       info.Name,
		AvatarURL:  info.AvatarURL,
		Provider:   info.Provider,
		ProviderID: info.ProviderID,
	}
	if err := s.userRepo.Create(newUser); err != nil {
		return nil, err
	}
	return newUser, nil
}

func generateState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
```

- [ ] **Step 3: 빌드(핸들러 미수정으로 실패 예상)**

Run: `cd backend && go build ./service/`
Expected: `service` 패키지는 빌드 성공 (핸들러는 Task 13에서 수정)

- [ ] **Step 4: 세션 버전 auth_service 테스트 신규 작성**

Task 7에서 복제본 `auth_service_test.go`를 삭제했으므로, 세션 모듈 경로로 새로 작성한다. `newTestDB`는 `session_service_test.go`(Task 10)에 이미 정의되어 있으니 **여기서는 재정의하지 않고 재사용**한다.

`backend/service/auth_service_test.go`:
```go
package service

import (
	"testing"

	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/provider"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/repository"
)

func TestFindOrCreateUser_UpdatesProfileOnRelogin(t *testing.T) {
	db := newTestDB(t) // session_service_test.go 정의 재사용
	repo := repository.NewUserRepository(db)
	s := &AuthService{userRepo: repo}

	u1, err := s.findOrCreateUser(&provider.UserInfo{
		Email: "a@gmail.com", Name: "홍길동", AvatarURL: "old.png",
		Provider: "google", ProviderID: "g-1",
	})
	if err != nil {
		t.Fatalf("최초 생성 실패: %v", err)
	}

	u2, err := s.findOrCreateUser(&provider.UserInfo{
		Email: "a@gmail.com", Name: "홍길동2", AvatarURL: "new.png",
		Provider: "google", ProviderID: "g-1",
	})
	if err != nil {
		t.Fatalf("재로그인 실패: %v", err)
	}
	if u2.ID != u1.ID {
		t.Errorf("동일 사용자 ID 기대 %d, 실제 %d", u1.ID, u2.ID)
	}
	if u2.Name != "홍길동2" || u2.AvatarURL != "new.png" {
		t.Errorf("프로필 갱신 안 됨: name=%q avatar=%q", u2.Name, u2.AvatarURL)
	}
}
```

Run: `cd backend && go test ./service/ -run TestFindOrCreateUser -v`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/service/
git commit -m "feat: auth_service 세션 발급 방식으로 전환, token_service 제거"
```

---

### Task 13: 핸들러를 쿠키+redirect 방식으로 전환

콜백은 세션 쿠키를 설정하고 프론트로 302 redirect. 로그아웃은 세션 삭제 + 쿠키 만료.

**Files:**
- Modify: `backend/handler/auth_handler.go`
- Modify: `backend/handler/user_handler.go` (변경 없음 — 확인만)
- Modify: `backend/main.go`

- [ ] **Step 1: auth_handler.go 재작성**

`backend/handler/auth_handler.go` 전체 교체:
```go
package handler

import (
	"net/http"
	"time"

	customMiddleware "github.com/kenshin579/tutorials-go/web/sns-login-session/backend/middleware"
	"github.com/kenshin579/tutorials-go/web/sns-login-session/backend/service"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	authService *service.AuthService
	frontendURL string
}

func NewAuthHandler(authService *service.AuthService, frontendURL string) *AuthHandler {
	return &AuthHandler{authService: authService, frontendURL: frontendURL}
}

// GET /api/auth/:provider/url
func (h *AuthHandler) GetAuthURL(c echo.Context) error {
	url, err := h.authService.GetAuthURL(c.Param("provider"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"url": url})
}

// GET /api/auth/:provider/callback — Google이 직접 redirect (redirect_uri = 백엔드)
func (h *AuthHandler) HandleCallback(c echo.Context) error {
	providerName := c.Param("provider")
	code := c.QueryParam("code")
	state := c.QueryParam("state")
	if code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "code 파라미터가 필요합니다")
	}

	sess, _, err := h.authService.HandleCallback(c.Request().Context(), providerName, code, state)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// HttpOnly 세션 쿠키 설정 후 프론트로 redirect
	c.SetCookie(&http.Cookie{
		Name:     customMiddleware.SessionCookieName,
		Value:    sess.ID,
		Path:     "/",
		Expires:  sess.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		// Secure: true,  // 프로덕션(HTTPS)에서 활성화
	})
	return c.Redirect(http.StatusFound, h.frontendURL)
}

// POST /api/auth/logout — 세션 삭제 + 쿠키 만료 (서버측 무효화)
func (h *AuthHandler) Logout(c echo.Context) error {
	if cookie, err := c.Cookie(customMiddleware.SessionCookieName); err == nil {
		_ = h.authService.Logout(cookie.Value)
	}
	c.SetCookie(&http.Cookie{
		Name:     customMiddleware.SessionCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
	})
	return c.JSON(http.StatusOK, map[string]string{"message": "로그아웃 성공"})
}
```

- [ ] **Step 2: main.go 재배선**

`backend/main.go`에서 변경할 부분:

(a) import에서 `model.Session` 마이그레이션 추가 — AutoMigrate 줄 교체:
```go
	if err := db.AutoMigrate(&model.User{}, &model.Session{}); err != nil {
		log.Fatal("마이그레이션 실패:", err)
	}
```

(b) 서비스 배선 교체 (`tokenService`/`authService`/`authHandler`/JWT 미들웨어 부분):
```go
	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)
	sessionService := service.NewSessionService(sessionRepo, 7*24*time.Hour) // 세션 7일
	authService := service.NewAuthService(providers, userRepo, sessionService)

	authHandler := handler.NewAuthHandler(authService, cfg.FrontendURL)
	userHandler := handler.NewUserHandler(authService)
```

(c) 라우트에서 refresh 제거 + 보호 라우트 미들웨어 교체:
```go
	auth := api.Group("/auth")
	auth.GET("/:provider/url", authHandler.GetAuthURL)
	auth.GET("/:provider/callback", authHandler.HandleCallback)
	auth.POST("/logout", authHandler.Logout)

	user := api.Group("/user", customMiddleware.SessionAuth(sessionService))
	user.GET("/me", userHandler.GetMe)
```

(d) import에 `"time"` 추가, 미사용 import 정리(`echoMiddleware`는 CORS에 계속 사용).

- [ ] **Step 3: CORS에 credentials 허용 확인**

`backend/main.go`의 CORS 설정에 이미 `AllowCredentials: true`가 있다. `AllowOrigins`가 `cfg.FrontendURL`인지 확인(와일드카드면 쿠키 전송 불가).

- [ ] **Step 4: config redirect_uri를 백엔드로 (세션은 백엔드 redirect)**

`backend/config/config.go`의 `GoogleRedirectURL` 기본값 교체:
```go
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
```
그리고 `JWTSecret` 필드는 세션 버전에서 미사용 → config에서 제거하고 `Load()`에서도 해당 줄 삭제. (참조하는 곳이 없어야 빌드됨)

- [ ] **Step 5: 빌드 + 전체 테스트**

Run: `cd backend && go build ./... && go test ./...`
Expected: 빌드 성공, 모든 테스트 PASS

- [ ] **Step 6: 커밋**

```bash
git add backend/
git commit -m "feat: 세션 쿠키 콜백/로그아웃 핸들러 및 main 배선"
```

---

### Task 14: 프론트엔드 세션화

토큰 보관을 제거하고 쿠키 기반으로 전환. Google이 백엔드로 redirect 후 다시 프론트("/")로 오므로 별도 콜백 페이지 불필요.

**Files:**
- Modify: `frontend/src/services/authService.ts`
- Modify: `frontend/src/hooks/useAuth.ts`
- Modify: `frontend/src/App.tsx`
- Remove: `frontend/src/components/OAuthCallback.tsx`
- Modify: `frontend/src/types/auth.ts`

- [ ] **Step 1: authService.ts 재작성**

`frontend/src/services/authService.ts`:
```typescript
import axios from 'axios';
import type { User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

// withCredentials: 쿠키를 교차 출처 요청에 포함
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export async function getGoogleAuthURL(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/api/auth/google/url');
  return data.url;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/user/me');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}
```

- [ ] **Step 2: useAuth.ts 재작성**

`frontend/src/hooks/useAuth.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';
import { getMe, logout as logoutApi } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  return { user, loading, isAuthenticated: !!user, logout };
}
```

- [ ] **Step 3: App.tsx 재작성 (콜백 라우트 제거)**

`frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginButton } from './components/LoginButton';
import { UserProfile } from './components/UserProfile';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginButton />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <UserProfile user={user!} onLogout={logout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: OAuthCallback 제거 + types 정리**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-session/frontend
rm src/components/OAuthCallback.tsx
```
`frontend/src/types/auth.ts`에서 `TokenPair`, `AuthResponse` 제거(User만 남김):
```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  provider: string;
}
```

- [ ] **Step 5: 프론트 빌드 확인**

Run: `cd frontend && npm install && npm run build`
Expected: 타입 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add web/sns-login-session/frontend
git commit -m "feat: 프론트엔드 세션 쿠키 방식으로 전환 (토큰 보관 제거)"
```

---

### Task 15: 세션 버전 docker-compose 정리

**Files:**
- Modify: `web/sns-login-session/docker-compose.yml`

- [ ] **Step 1: env에서 JWT 제거, redirect 백엔드로**

`docker-compose.yml`의 backend `environment` 교체:
```yaml
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
      - FRONTEND_URL=http://localhost:3000
      - SERVER_PORT=8080
```

- [ ] **Step 2: 커밋**

```bash
git add web/sns-login-session/docker-compose.yml
git commit -m "chore: 세션 버전 docker-compose env 정리"
```

---

### Task 16: Phase 2 통합 검증

- [ ] **Step 1: 백엔드 전체 테스트/빌드**

Run: `cd /Users/user/src/workspace_blogv2/tutorials-go/web/sns-login-session/backend && go test ./... && go build ./...`
Expected: 전부 PASS / 빌드 성공

- [ ] **Step 2: (수동) 실제 OAuth 플로우 확인 메모**

`.env`에 Google 자격증명 설정 후 `docker compose up -d`로 다음 확인(자동화 불가, 수동):
- 로그인 → `/api/user/me` 200, `sessions` 테이블에 row 생성
- 로그아웃 → 같은 쿠키로 `/api/user/me` 호출 시 401 (서버측 무효화 검증)

```bash
sqlite3 backend/data/app.db "SELECT id, user_id, expires_at FROM sessions;"
```

---

## Phase 3: 블로그 재구성

### Task 17: index.md 통합 글로 재작성

**Files:**
- Modify: `blog-v2.advenoh.pe.kr/docs/read/go-google-oauth-로그인-구현-가이드/index.md`

스펙 §4 목차를 따른다. 아래 내용을 반드시 반영한다(나머지 기존 본문은 유지/이동):

1. **프론트매터 tags**: `session`, `cookie`, `jwt-vs-session` 추가
2. **들어가며**: "OAuth(신원 위임)와 세션 유지 방식(JWT/세션)은 별개"라는 문장 추가
3. **3장 Google Console**: 승인된 redirect URI를 **두 개** 등록하도록 수정
   - JWT 버전: `http://localhost:3000/auth/callback` (프론트)
   - 세션 버전: `http://localhost:8080/api/auth/google/callback` (백엔드)
   - 각 URI가 왜 다른지(플로우 차이) 설명
4. **공통 구현 절**: `findOrCreateUser` 코드 스니펫 추가(A-1), state 저장/검증(`sync.Map` + `LoadAndDelete`) 코드 추가(B-6)
5. **JWT 절**: SPA 토큰 플로우 다이어그램 + 토큰 타입 구분(B-4) 설명. `google.go` 스니펫은 실제 코드처럼 `io.ReadAll`+`json.Unmarshal`+에러 처리로 교체(D-10). 콜백 스니펫에 `code == ""` 검증 포함(D-11)
6. **세션 절(신규)**: 서버 redirect 플로우 다이어그램 + `Session` 모델/미들웨어/쿠키 코드 + "로그아웃 = 세션 삭제(서버측 무효화)" 강조(B-5)
7. **JWT vs 세션 비교표**: 스펙 §4 표 삽입 + 선택 가이드. "왜 JWT가 필수가 아닌지"(B-8) 명시
8. **마무리**: 프로덕션 고려사항 유지 + **A-2 한계 각주**("같은 이메일을 다른 provider로 가입 시 계정 연결은 이 글 범위 밖")
9. **GitHub 링크**: `web/sns-login` → `web/sns-login-jwt`, `web/sns-login-session` 두 개로 갱신. JWT 시크릿 기본값/포트 표기 통일(B-7/D-12)

- [ ] **Step 1: 위 9개 항목을 반영해 index.md 수정**

(편집 작업. 각 코드 스니펫은 Phase 1/2에서 확정된 실제 파일 내용과 1:1 일치시킨다.)

- [ ] **Step 2: 인코딩 확인**

Run: `file -I "docs/read/go-google-oauth-로그인-구현-가이드/index.md"`
Expected: `charset=utf-8`

- [ ] **Step 3: 코드-블로그 일치 점검**

블로그의 모든 Go/TS 스니펫을 해당 실제 파일과 대조(토큰 타입, 세션 미들웨어, 콜백 redirect, findOrCreate). 불일치 0건.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add "docs/read/go-google-oauth-로그인-구현-가이드/index.md"
git commit -m "docs: SNS 로그인 글 재구성 — JWT/세션 두 구현 및 비교"
```

---

## Phase 4: 마무리

### Task 18: PR 생성

- [ ] **Step 1: tutorials-go PR**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git push -u origin feat/sns-login-jwt-session
gh pr create --base master --assignee kenshin579 --title "feat: SNS 로그인 JWT/세션 두 구현 분리" --body "$(cat <<'EOF'
## Summary
- `web/sns-login` → `web/sns-login-jwt`로 rename, JWT 토큰 타입 구분(B-4)·프로필 갱신(A-3)·redirect_uri 정렬(C-9)·시크릿 정리(B-7)
- `web/sns-login-session` 신규: SQLite `sessions` 테이블 + HttpOnly 쿠키, 서버측 로그아웃

## Test plan
- [x] sns-login-jwt: `go test ./...` PASS
- [x] sns-login-session: `go test ./...` PASS
- [ ] (수동) 실제 Google OAuth 로그인/로그아웃 플로우 확인
EOF
)"
```

- [ ] **Step 2: blog-v2 PR**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git push -u origin docs/sns-login-jwt-session-spec
gh pr create --base main --assignee kenshin579 --title "docs: SNS 로그인 JWT vs 세션 글 재구성" --body "$(cat <<'EOF'
## Summary
- 설계/계획 문서 추가, 기존 글을 JWT/세션 통합 구성으로 재작성
- JWT vs 세션 비교표, 두 구현 GitHub 링크

## Test plan
- [x] 인코딩 UTF-8 확인
- [x] 모든 코드 스니펫이 실제 샘플 코드와 일치
EOF
)"
```

---

## Self-Review 결과

- **스펙 커버리지**: §2 구조→T1/T7, §3.2 JWT→T2~T5, §3.3 세션→T8~T15, §3.4 A-2 보류→T17 각주, §4 블로그→T17, §5 순서→Phase 구성, §6 완료기준→T6/T16/T17 검증. 누락 없음.
- **D-10/D-11**: 실제 코드는 이미 충족 → 블로그 스니펫 정렬(T17)로만 처리. 코드 태스크에서 제외(중복 방지).
- **타입 일관성**: `Claims.TokenType`, `service.TokenTypeAccess`, `SessionCookieName`, `SessionService.Create/Validate/Delete`, `AuthService.HandleCallback`(세션 버전은 `*model.Session` 반환) — 태스크 간 시그니처 일치 확인.
- **중복 `newTestDB`**: 같은 패키지 내 1회 정의 규칙 명시(T10에서 정의, T4/T12 주의 노트 포함).
