# Admin 권한 관리 (RBAC) - 구현 문서

## 프로젝트 위치

`tutorials-go/rbac/`

```
rbac/
├── backend/       # Go + Echo API 서버
├── frontend/      # React + TypeScript 어드민 대시보드
├── docker-compose.yml
└── README.md
```

## 1단계: 인프라 및 프로젝트 초기화

### Docker Compose (MySQL)

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: rbac_db
      MYSQL_USER: rbac_user
      MYSQL_PASSWORD: rbac_pass
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Backend 초기화

```bash
cd tutorials-go/rbac/backend
go mod init github.com/kenshin579/tutorials-go/rbac/backend
```

주요 의존성:
- `github.com/labstack/echo/v4`
- `gorm.io/gorm` + `gorm.io/driver/mysql`
- `github.com/golang-jwt/jwt/v5`
- `golang.org/x/crypto` (bcrypt)
- `github.com/stretchr/testify`

### Frontend 초기화

```bash
cd tutorials-go/rbac/frontend
npx create-vite . --template react-ts
npm install react-router-dom axios
npm install -D tailwindcss @tailwindcss/vite
```

## 2단계: Backend - Domain 레이어

### 엔티티 정의

```go
// domain/user.go
type User struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    Email        string    `gorm:"uniqueIndex;not null" json:"email"`
    PasswordHash string    `gorm:"not null" json:"-"`
    Name         string    `gorm:"not null" json:"name"`
    Roles        []Role    `gorm:"many2many:user_roles" json:"roles"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

type UserRepository interface {
    Create(user *User) error
    FindByID(id uint) (*User, error)
    FindByEmail(email string) (*User, error)
    FindAll() ([]User, error)
    Update(user *User) error
    Delete(id uint) error
    AssignRole(userID, roleID uint) error
    RemoveRole(userID, roleID uint) error
}
```

```go
// domain/role.go
type Role struct {
    ID          uint         `gorm:"primaryKey" json:"id"`
    Name        string       `gorm:"uniqueIndex;not null" json:"name"`
    Description string       `json:"description"`
    Permissions []Permission `gorm:"many2many:role_permissions" json:"permissions"`
    CreatedAt   time.Time    `json:"created_at"`
    UpdatedAt   time.Time    `json:"updated_at"`
}

type RoleRepository interface {
    Create(role *Role) error
    FindByID(id uint) (*Role, error)
    FindAll() ([]Role, error)
    Update(role *Role) error
    Delete(id uint) error
    AssignPermission(roleID, permissionID uint) error
    RemovePermission(roleID, permissionID uint) error
}
```

```go
// domain/permission.go
type Permission struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    Resource    string    `gorm:"not null" json:"resource"`
    Action      string    `gorm:"not null" json:"action"`
    Description string    `json:"description"`
    CreatedAt   time.Time `json:"created_at"`
}

// Permission 키 생성 (예: "users:read")
func (p Permission) Key() string {
    return p.Resource + ":" + p.Action
}

type PermissionRepository interface {
    FindAll() ([]Permission, error)
    FindByUserID(userID uint) ([]Permission, error)
}
```

```go
// domain/product.go
type Product struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Name      string    `gorm:"not null" json:"name"`
    Price     float64   `gorm:"type:decimal(10,2);not null" json:"price"`
    Status    string    `gorm:"not null;default:active" json:"status"` // active, inactive
    CreatedBy uint      `gorm:"not null" json:"created_by"`
    Creator   User      `gorm:"foreignKey:CreatedBy" json:"creator"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type ProductRepository interface {
    Create(product *Product) error
    FindByID(id uint) (*Product, error)
    FindAll(activeOnly bool) ([]Product, error)
    Update(product *Product) error
    Delete(id uint) error
}
```

```go
// domain/order.go
type OrderStatus string

const (
    OrderStatusPending   OrderStatus = "pending"
    OrderStatusConfirmed OrderStatus = "confirmed"
    OrderStatusShipped   OrderStatus = "shipped"
    OrderStatusCompleted OrderStatus = "completed"
    OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
    ID         uint        `gorm:"primaryKey" json:"id"`
    ProductID  uint        `gorm:"not null" json:"product_id"`
    Product    Product     `gorm:"foreignKey:ProductID" json:"product"`
    Quantity   int         `gorm:"not null" json:"quantity"`
    TotalPrice float64     `gorm:"type:decimal(10,2);not null" json:"total_price"`
    Status     OrderStatus `gorm:"not null;default:pending" json:"status"`
    OrderedBy  uint        `gorm:"not null" json:"ordered_by"`
    Orderer    User        `gorm:"foreignKey:OrderedBy" json:"orderer"`
    CreatedAt  time.Time   `json:"created_at"`
    UpdatedAt  time.Time   `json:"updated_at"`
}

type OrderRepository interface {
    Create(order *Order) error
    FindByID(id uint) (*Order, error)
    FindAll() ([]Order, error)
    FindByUserID(userID uint) ([]Order, error)
    Update(order *Order) error
}
```

### 주문 상태 전이 규칙

```go
// domain/order.go

// 유효한 상태 전이 정의
var validTransitions = map[OrderStatus][]OrderStatus{
    OrderStatusPending:   {OrderStatusConfirmed, OrderStatusCancelled},
    OrderStatusConfirmed: {OrderStatusShipped, OrderStatusCancelled},
    OrderStatusShipped:   {OrderStatusCompleted},
}

// Role별 허용 전이
var roleTransitions = map[string]map[OrderStatus][]OrderStatus{
    "admin": validTransitions, // 모든 전이 가능
    "manager": {
        OrderStatusConfirmed: {OrderStatusShipped, OrderStatusCancelled},
        OrderStatusPending:   {OrderStatusCancelled},
    },
    "user": {
        OrderStatusPending: {OrderStatusCancelled}, // 본인 주문만 (owner 체크는 미들웨어)
    },
}

func CanTransition(role string, from, to OrderStatus) bool {
    transitions, ok := roleTransitions[role]
    if !ok {
        return false
    }
    allowed, ok := transitions[from]
    if !ok {
        return false
    }
    for _, s := range allowed {
        if s == to {
            return true
        }
    }
    return false
}
```

## 3단계: Backend - 미들웨어 (핵심)

### JWT 인증 미들웨어

```go
// http/middleware/jwt_auth.go
func JWTAuth(jwtSecret string) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            token := extractBearerToken(c.Request().Header.Get("Authorization"))
            if token == "" {
                return echo.NewHTTPError(http.StatusUnauthorized, "missing token")
            }

            claims, err := jwt.ParseToken(token, jwtSecret)
            if err != nil {
                return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
            }

            c.Set("user_id", claims.UserID)
            c.Set("roles", claims.Roles)
            return next(c)
        }
    }
}
```

### RBAC 미들웨어

```go
// http/middleware/rbac.go
func RequirePermission(permission string, permRepo domain.PermissionRepository) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            userID := c.Get("user_id").(uint)

            permissions, err := permRepo.FindByUserID(userID)
            if err != nil {
                return echo.NewHTTPError(http.StatusInternalServerError)
            }

            for _, p := range permissions {
                if p.Key() == permission {
                    return next(c)
                }
            }

            return echo.NewHTTPError(http.StatusForbidden, "insufficient permissions")
        }
    }
}
```

### Owner 미들웨어

```go
// http/middleware/owner.go

// OwnerConfig - Owner 미들웨어 설정
type OwnerConfig struct {
    ResourceTable string   // DB 테이블명 (예: "products")
    OwnerField    string   // 소유자 필드명 (예: "created_by")
    BypassRoles   []string // owner 체크를 스킵하는 Role (예: ["admin"])
}

func RequireOwner(config OwnerConfig, db *gorm.DB) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            userID := c.Get("user_id").(uint)
            roles := c.Get("roles").([]string)

            // bypass Role 체크
            for _, role := range roles {
                for _, bypassRole := range config.BypassRoles {
                    if role == bypassRole {
                        return next(c)
                    }
                }
            }

            // 리소스 ID 추출
            resourceID := c.Param("id")

            // DB에서 리소스의 owner 필드 조회
            var ownerID uint
            err := db.Table(config.ResourceTable).
                Where("id = ?", resourceID).
                Pluck(config.OwnerField, &ownerID).Error
            if err != nil {
                return echo.NewHTTPError(http.StatusNotFound, "resource not found")
            }

            if ownerID != userID {
                return echo.NewHTTPError(http.StatusForbidden, "not the owner of this resource")
            }

            return next(c)
        }
    }
}
```

### 라우터 등록 예시

```go
// http/router.go
func SetupRoutes(e *echo.Echo, h *Handlers, mw *Middlewares) {
    api := e.Group("/api")

    // 인증 (미들웨어 없음)
    auth := api.Group("/auth")
    auth.POST("/register", h.Auth.Register)
    auth.POST("/login", h.Auth.Login)
    auth.POST("/refresh", h.Auth.Refresh)
    auth.POST("/logout", h.Auth.Logout, mw.JWT)

    // 인증 필요한 라우트
    secured := api.Group("", mw.JWT)

    // 상품 - RBAC + Owner 조합
    products := secured.Group("/products")
    products.GET("", h.Product.List, mw.RBAC("products:read"))
    products.GET("/:id", h.Product.Get, mw.RBAC("products:read"))
    products.POST("", h.Product.Create, mw.RBAC("products:create"))
    products.PUT("/:id", h.Product.Update, mw.RBAC("products:update"),
        mw.Owner(OwnerConfig{ResourceTable: "products", OwnerField: "created_by", BypassRoles: []string{"admin"}}))
    products.DELETE("/:id", h.Product.Delete, mw.RBAC("products:delete"))
    products.PATCH("/:id/status", h.Product.UpdateStatus, mw.RBAC("products:status:update"))

    // 주문 - RBAC + Owner 조합
    orders := secured.Group("/orders")
    orders.GET("", h.Order.List, mw.RBAC("orders:read"))
    orders.GET("/:id", h.Order.Get, mw.RBAC("orders:read"),
        mw.Owner(OwnerConfig{ResourceTable: "orders", OwnerField: "ordered_by", BypassRoles: []string{"admin", "manager"}}))
    orders.POST("", h.Order.Create, mw.RBAC("orders:create"))
    orders.PATCH("/:id/status", h.Order.UpdateStatus, mw.RBAC("orders:status:update"))
    orders.PATCH("/:id/cancel", h.Order.Cancel, mw.RBAC("orders:cancel"),
        mw.Owner(OwnerConfig{ResourceTable: "orders", OwnerField: "ordered_by", BypassRoles: []string{"admin", "manager"}}))

    // RBAC 관리
    users := secured.Group("/users")
    users.GET("", h.User.List, mw.RBAC("users:read"))
    users.GET("/:id", h.User.Get, mw.RBAC("users:read"))
    users.PUT("/:id", h.User.Update, mw.RBAC("users:update"))
    users.DELETE("/:id", h.User.Delete, mw.RBAC("users:delete"))
    users.POST("/:id/roles", h.User.AssignRole, mw.RBAC("users:update"))
    users.DELETE("/:id/roles/:roleId", h.User.RemoveRole, mw.RBAC("users:update"))

    roles := secured.Group("/roles")
    roles.GET("", h.Role.List, mw.RBAC("roles:read"))
    roles.POST("", h.Role.Create, mw.RBAC("roles:create"))
    roles.PUT("/:id", h.Role.Update, mw.RBAC("roles:update"))
    roles.DELETE("/:id", h.Role.Delete, mw.RBAC("roles:delete"))
    roles.POST("/:id/permissions", h.Role.AssignPermission, mw.RBAC("roles:update"))
    roles.DELETE("/:id/permissions/:permId", h.Role.RemovePermission, mw.RBAC("roles:update"))

    secured.GET("/permissions", h.Permission.List, mw.RBAC("roles:read"))
}
```

## 4단계: Backend - JWT 토큰

```go
// pkg/jwt/jwt.go
type Claims struct {
    UserID uint     `json:"user_id"`
    Roles  []string `json:"roles"`
    jwt.RegisteredClaims
}

type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}

func GenerateTokenPair(userID uint, roles []string, secret string) (*TokenPair, error) {
    // Access Token: 15분
    accessClaims := &Claims{
        UserID: userID,
        Roles:  roles,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
        },
    }
    accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(secret))
    if err != nil {
        return nil, err
    }

    // Refresh Token: 7일
    refreshClaims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
        },
    }
    refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(secret))
    if err != nil {
        return nil, err
    }

    return &TokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}
```

## 5단계: Backend - 시드 데이터

```go
// config/seed.go
func SeedData(db *gorm.DB) error {
    // Permissions (17개)
    permissions := []domain.Permission{
        {Resource: "users", Action: "create", Description: "사용자 생성"},
        {Resource: "users", Action: "read", Description: "사용자 조회"},
        {Resource: "users", Action: "update", Description: "사용자 수정"},
        {Resource: "users", Action: "delete", Description: "사용자 삭제"},
        {Resource: "roles", Action: "create", Description: "Role 생성"},
        {Resource: "roles", Action: "read", Description: "Role 조회"},
        {Resource: "roles", Action: "update", Description: "Role 수정"},
        {Resource: "roles", Action: "delete", Description: "Role 삭제"},
        {Resource: "products", Action: "create", Description: "상품 등록"},
        {Resource: "products", Action: "read", Description: "상품 조회"},
        {Resource: "products", Action: "update", Description: "상품 수정"},
        {Resource: "products", Action: "delete", Description: "상품 삭제"},
        {Resource: "products", Action: "status:update", Description: "상품 상태 변경"},
        {Resource: "orders", Action: "create", Description: "주문 생성"},
        {Resource: "orders", Action: "read", Description: "주문 조회"},
        {Resource: "orders", Action: "status:update", Description: "주문 상태 변경"},
        {Resource: "orders", Action: "cancel", Description: "주문 취소"},
    }

    // Roles (3개) + Permission 매핑
    // admin: 전체 17개
    // manager: users:read, roles:read, products:create/read/update/status:update, orders:create/read/status:update/cancel (10개)
    // user: products:read, orders:create/read/cancel (4개)

    // 테스트 사용자
    // admin@example.com / admin123 → admin Role
    // manager@example.com / manager123 → manager Role
    // user@example.com / user123 → user Role
}
```

## 6단계: Backend - Usecase 핵심 로직

### 주문 상태 변경 (Role별 전이 제한)

```go
// usecase/order_usecase.go
func (u *OrderUsecase) UpdateStatus(userID uint, orderID uint, newStatus domain.OrderStatus, roles []string) error {
    order, err := u.orderRepo.FindByID(orderID)
    if err != nil {
        return err
    }

    // 최상위 Role로 전이 가능 여부 판단
    canTransit := false
    for _, role := range roles {
        if domain.CanTransition(role, order.Status, newStatus) {
            canTransit = true
            break
        }
    }
    if !canTransit {
        return ErrForbiddenTransition
    }

    order.Status = newStatus
    return u.orderRepo.Update(order)
}
```

### 상품 목록 조회 (Role별 필터링)

```go
// usecase/product_usecase.go
func (u *ProductUsecase) List(roles []string) ([]domain.Product, error) {
    // user Role만 있으면 active 상품만 조회
    activeOnly := !hasRole(roles, "admin") && !hasRole(roles, "manager")
    return u.productRepo.FindAll(activeOnly)
}
```

### 주문 목록 조회 (Role별 범위 제한)

```go
// usecase/order_usecase.go
func (u *OrderUsecase) List(userID uint, roles []string) ([]domain.Order, error) {
    // admin/manager는 전체, user는 본인 것만
    if hasRole(roles, "admin") || hasRole(roles, "manager") {
        return u.orderRepo.FindAll()
    }
    return u.orderRepo.FindByUserID(userID)
}
```

## 7단계: Frontend - 인증 및 권한 컨텍스트

### AuthContext

```tsx
// auth/AuthContext.tsx
interface AuthState {
  user: User | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
}

// 로그인 응답에서 user, roles, permissions를 받아 context에 저장
// Access Token은 메모리(state)에 저장
// Refresh Token은 httpOnly cookie (서버에서 Set-Cookie)
```

### usePermission 훅

```tsx
// auth/usePermission.ts
function usePermission() {
  const { permissions, roles, user } = useAuth();

  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasRole = (role: string) => roles.includes(role);
  const isOwner = (resourceOwnerId: number) => user?.id === resourceOwnerId;

  return { hasPermission, hasRole, isOwner };
}
```

### ProtectedRoute

```tsx
// auth/ProtectedRoute.tsx
function ProtectedRoute({ permission, children }: Props) {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = usePermission();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (permission && !hasPermission(permission)) return <Navigate to="/dashboard" />;

  return children;
}
```

### PermissionGate

```tsx
// components/PermissionGate.tsx
function PermissionGate({ permission, ownerId, children }: Props) {
  const { hasPermission, isOwner, hasRole } = usePermission();

  if (!hasPermission(permission)) return null;

  // owner 체크가 필요한 경우
  if (ownerId !== undefined) {
    if (hasRole("admin")) return children;        // admin bypass
    if (!isOwner(ownerId)) return null;           // 본인 것만
  }

  return children;
}
```

## 8단계: Frontend - 핵심 페이지

### Sidebar (Role 기반 메뉴)

```tsx
// components/Sidebar.tsx
const menuItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/products", label: "상품 관리", permission: "products:read" },
  { path: "/orders", label: "주문 관리", permission: "orders:read" },
  // 구분선
  { path: "/users", label: "사용자 관리", permission: "users:read" },
  { path: "/roles", label: "Role 관리", permission: "roles:read" },
  { path: "/permissions", label: "Permission", permission: "roles:read" },
];

// permission이 없는 메뉴는 렌더링하지 않음
```

### 상품 페이지 - Role별 버튼 차이

```tsx
// pages/ProductsPage.tsx
// [+ 상품 등록] → PermissionGate permission="products:create"
// [편집] → PermissionGate permission="products:update" ownerId={product.created_by}
// [삭제] → PermissionGate permission="products:delete"
```

### 주문 페이지 - 상태별 액션 버튼

```tsx
// components/OrderStatusBadge.tsx
// Role + 현재 상태에 따라 표시할 버튼 결정
// admin + pending → [확인][취소]
// admin + confirmed → [배송][취소]
// manager + confirmed → [배송]
// user + pending + 본인 → [취소]
```

### Axios 인터셉터 (토큰 자동 갱신)

```tsx
// api/client.ts
// 요청 인터셉터: Authorization 헤더에 Access Token 추가
// 응답 인터셉터: 401 발생 시 → /api/auth/refresh 호출 → 토큰 갱신 → 원래 요청 재시도
// refresh도 실패하면 → 로그아웃
```

## CORS 설정

```go
// main.go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete},
    AllowHeaders:     []string{echo.HeaderContentType, echo.HeaderAuthorization},
    AllowCredentials: true, // httpOnly cookie를 위해 필요
}))
```

## 테스트 전략

### Backend 단위 테스트 (testify)

- `pkg/jwt/jwt_test.go`: 토큰 생성/검증/만료
- `http/middleware/rbac_test.go`: Permission 있음/없음 → 통과/403
- `http/middleware/owner_test.go`: admin bypass, owner 일치/불일치
- `domain/order_test.go`: `CanTransition()` — 유효/무효 전이, Role별 제한
- `usecase/order_usecase_test.go`: 상태 변경 비즈니스 로직

### Frontend 수동 테스트 (MCP Playwright)

- 3개 계정(admin/manager/user)으로 로그인하여 UI 차이 확인
- 상품/주문 페이지에서 Role별 버튼 표시 여부 검증
- 권한 없는 페이지 접근 시 리다이렉트 확인
