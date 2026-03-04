---
title: "Echo 프레임워크 미들웨어 완벽 가이드"
description: "Echo 빌트인 미들웨어 활용법과 JWT 인증, 구조화된 로깅 등 커스텀 미들웨어를 직접 구현하며, 실전 조합 패턴과 테스트 방법까지 다룹니다"
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - echo
  - middleware
  - jwt
  - zap
  - logging
series: "Go 웹 개발"
---

HTTP 미들웨어는 웹 프레임워크의 핵심이다. 요청 전처리부터 응답 가공까지 **횡단 관심사(Cross-cutting Concerns)**를 깔끔하게 처리한다. 이 글에서는 **Echo 프레임워크의 미들웨어 패턴**을 다룬다. 빌트인 미들웨어로 빠르게 시작하고, 구조화된 로깅과 JWT 인증 미들웨어를 직접 구현하며, 실전에서의 미들웨어 조합 패턴까지 알아본다.

> 이 글의 전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/middleware)에서 확인할 수 있다.

---

# 1. 미들웨어 개념

## 1.1 미들웨어란?

미들웨어는 **요청과 응답을 처리하는 파이프라인 사이의 중간 레이어**다. 요청이 핸들러에 도달하기 전에 사전 처리를 하고, 응답을 반환한 후에 사후 처리를 수행한다.

```go
요청 → [Middleware1] → [Middleware2] → [Handler] → 응답
      ↑                                         ↑
      └─────────────────── 역방향 처리 ─────────┘
```

이를 **양파 모델(Onion Model)** 이라고 부른다. 각 미들웨어는 다음 미들웨어를 감싸는 형태로 중첩되기 때문이다.

```mermaid
graph TD
    A["요청"] --> B["Recover 미들웨어"]
    B --> C["Logger 미들웨어"]
    C --> D["Auth 미들웨어"]
    D --> E["Handler"]
    E --> F["Auth 결과"]
    F --> G["Logger 결과"]
    G --> H["Recover 결과"]
    H --> I["응답"]
```

## 1.2 횡단 관심사(Cross-cutting Concerns) 분리

미들웨어의 주요 목적은 핵심 비즈니스 로직과 상관없는 **기술적 관심사**를 분리하는 것이다.

| 미들웨어 | 역할 |
|---|---|
| 로깅 | 모든 요청/응답 기록 |
| 인증 | JWT/OAuth 토큰 검증 |
| 인가 | 권한 확인 |
| CORS | 교차 출처 리소스 공유 |
| Rate Limiting | 요청 속도 제한 |
| 에러 복구 | 패닉 복구로 서버 크래시 방지 |

## 1.3 Echo 미들웨어 기본

### 미들웨어 시그니처

```go
type MiddlewareFunc func(HandlerFunc) HandlerFunc
```

즉, **다음 핸들러를 받아서 새로운 핸들러를 반환**하는 고차 함수다.

```go
func LoggingMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        // 요청 전처리
        log.Println("Before:", c.Request().Method, c.Request().URL)

        err := next(c)  // 핸들러 실행

        // 응답 후처리
        log.Println("After:", c.Response().Status)

        return err
    }
}
```

### 미들웨어 등록 방법

#### 글로벌 미들웨어

모든 라우트에 적용된다.

```go
e := echo.New()
e.Use(middleware.Logger())
e.Use(middleware.Recover())
```

#### 라우트별 미들웨어

특정 라우트에만 적용된다.

```go
e.GET("/public", handler)
e.GET("/protected", handler, middleware.JWTWithConfig(config))
```

#### 그룹별 미들웨어

경로 접두사를 공유하는 라우트에 적용된다.

```go
api := e.Group("/api")
api.Use(middleware.JWTWithConfig(config))
api.GET("/users", handler)      // JWT 필수
api.GET("/products", handler)   // JWT 필수

public := e.Group("/public")
// JWT 미들웨어 없음
public.GET("/login", handler)
```

---

# 2. Echo 빌트인 미들웨어

Echo는 자주 사용되는 미들웨어를 기본 제공한다. 대부분 `WithConfig` 버전으로 커스터마이징이 가능하다.

## 2.1 로깅/추적

### RequestLoggerWithConfig - 요청/응답 로깅

```go
e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
    LogURI:    true,
    LogStatus: true,
    LogMethod: true,
    LogValuesFunc: func(c echo.Context, values middleware.RequestLoggerValues) error {
        logger.Info("request",
            zap.String("method", values.Method),
            zap.String("uri", values.URI),
            zap.Int("status", values.Status),
            zap.Duration("latency", values.Latency),
        )
        return nil
    },
}))
```

이전의 `Logger()` 미들웨어는 deprecated되었으니 `RequestLoggerWithConfig`를 사용하자.

### RequestID - 요청 추적 ID 자동 생성

```go
e.Use(middleware.RequestID())
```

각 요청에 UUID를 자동 생성해 `X-Request-ID` 헤더에 추가한다. 로그에 추적 ID를 기록해 요청 전체 경로를 추적할 수 있다.

```go
e.Use(middleware.RequestIDWithConfig(middleware.RequestIDConfig{
    Generator: func() string {
        return uuid.New().String()
    },
    TargetHeader: "X-Request-ID",
}))
```

## 2.2 보안

### CORSWithConfig - 교차 출처 리소스 공유

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"https://example.com"},
    AllowMethods: []string{http.MethodGet, http.MethodPost},
    AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
    MaxAge:       3600,
}))
```

**주요 설정:**
- `AllowOrigins`: 요청을 허용할 도메인
- `AllowMethods`: 허용할 HTTP 메서드
- `AllowHeaders`: 요청 헤더 허용
- `MaxAge`: Preflight 캐시 시간(초)

### Secure - 보안 헤더 추가

```go
e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
    XSSProtection:         "1; mode=block",
    ContentTypeNosniff:    "nosniff",
    XFrameOptions:         "DENY",
    HSTSMaxAge:            3600,
    ContentSecurityPolicy: "default-src 'self'",
}))
```

HTTP 보안 헤더를 자동 추가해 XSS, Clickjacking, MIME 스니핑 공격을 방어한다.

## 2.3 안정성/성능

### Recover - 패닉 복구

```go
e.Use(middleware.Recover())
```

핸들러에서 발생한 패닉을 캐치해 500 에러로 응답하고, 서버 크래시를 방지한다.

### RateLimiter - 요청 속도 제한

```go
e.Use(middleware.RateLimiter(
    middleware.NewRateLimiterMemoryStore(20),
))
```

초당 20개의 요청까지만 허용한다. 초과 시 429 상태코드를 반환한다.

```go
// 커스텀 설정
e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
    Store: middleware.NewRateLimiterMemoryStoreWithConfig(
        middleware.RateLimiterMemoryStoreConfig{
            Rate:      10,           // 초당 10개 요청
            Burst:     30,           // 순간 30개까지 허용
            ExpiresIn: 3 * time.Minute,
        },
    ),
}))
```

### BodyLimit - 요청 본문 크기 제한

```go
e.Use(middleware.BodyLimit("2M"))
```

요청 본문이 2MB를 초과하면 413 에러를 반환한다.

### Gzip - 응답 압축

```go
e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
    Level:     5,
    MinLength: 1024,  // 1KB 이상만 압축
}))
```

응답을 gzip으로 압축해 대역폭을 절약한다.

### ContextTimeoutWithConfig - 요청 타임아웃

```go
e.Use(middleware.ContextTimeoutWithConfig(middleware.ContextTimeoutConfig{
    Timeout: 30 * time.Second,
}))
```

요청이 30초를 초과하면 자동으로 취소된다.

---

# 3. 커스텀 미들웨어 구현

빌트인 미들웨어로 부족한 경우 직접 구현한다.

## 3.1 구조화된 로깅 미들웨어

빌트인 `Logger`는 간단한 텍스트 로깅만 지원한다. **zap을 연동한 구조화된 로깅**을 구현해보자.

```go
package custom

import (
    "time"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
    "go.uber.org/zap"
)

type ZapLoggerConfig struct {
    Skipper middleware.Skipper
}

func ZapLogger(logger *zap.Logger) echo.MiddlewareFunc {
    return ZapLoggerWithConfig(logger, ZapLoggerConfig{
        Skipper: middleware.DefaultSkipper,
    })
}

func ZapLoggerWithConfig(logger *zap.Logger, config ZapLoggerConfig) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            if config.Skipper(c) {
                return next(c)
            }

            start := time.Now()
            req := c.Request()
            res := c.Response()

            err := next(c)

            fields := []zap.Field{
                zap.String("method", req.Method),
                zap.String("path", req.URL.Path),
                zap.Int("status", res.Status),
                zap.Duration("latency", time.Since(start)),
                zap.String("remote_ip", c.RealIP()),
                zap.String("request_id", res.Header().Get(echo.HeaderXRequestID)),
            }

            if err != nil {
                fields = append(fields, zap.Error(err))
                logger.Error("request", fields...)
            } else {
                logger.Info("request", fields...)
            }

            return err
        }
    }
}
```

**주요 포인트:**

1. **Skipper 패턴**: `/health` 같은 경로는 로깅에서 제외할 수 있다.
2. **구조화된 로깅**: JSON 형식으로 기계가 파싱하기 쉬운 로그를 남긴다.
3. **에러 구분**: 요청 에러는 `logger.Error()`, 정상 응답은 `logger.Info()`로 구분한다.

### 사용법

```go
logger, _ := zap.NewProduction()
defer logger.Sync()

e := echo.New()
e.Use(custom.ZapLogger(logger))
```

## 3.2 JWT 인증 미들웨어

**토큰 기반 인증**을 구현한다. HMAC 서명 검증 방식을 다룬다. (Keycloak 같은 JWKS 기반 검증은 [JWKS(JSON Web Key Set)이란?](/article/jwks-json-web-key-set이란) 블로그 글 참조)

```go
package custom

import (
    "errors"
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

type JWTConfig struct {
    SigningKey []byte
    Skipper    middleware.Skipper
    ContextKey string
}

type Claims struct {
    UserID   string `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

func JWTAuth(config JWTConfig) echo.MiddlewareFunc {
    if config.ContextKey == "" {
        config.ContextKey = "user"
    }
    if len(config.SigningKey) == 0 {
        panic("jwt middleware: signing key is required")
    }

    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            // Skipper: 공개 경로는 인증 건너뛰기
            if config.Skipper != nil && config.Skipper(c) {
                return next(c)
            }

            // Authorization 헤더에서 Bearer 토큰 추출
            token, err := extractToken(c.Request())
            if err != nil {
                return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
            }

            // 토큰 검증
            claims, err := validateToken(token, config.SigningKey)
            if err != nil {
                return echo.NewHTTPError(http.StatusUnauthorized, "유효하지 않은 토큰")
            }

            // Context에 클레임 저장
            c.Set(config.ContextKey, claims)
            return next(c)
        }
    }
}

func extractToken(r *http.Request) (string, error) {
    authHeader := r.Header.Get("Authorization")
    if authHeader == "" {
        return "", errors.New("Authorization 헤더가 필요합니다")
    }

    parts := strings.SplitN(authHeader, " ", 2)
    if len(parts) != 2 || parts[0] != "Bearer" {
        return "", errors.New("잘못된 Authorization 형식")
    }

    return parts[1], nil
}

func validateToken(tokenString string, signingKey []byte) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("잘못된 서명 방식")
        }
        return signingKey, nil
    })
    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("유효하지 않은 클레임")
    }

    return claims, nil
}
```

### 사용법

```go
e.POST("/login", func(c echo.Context) error {
    // 로그인 처리 후 토큰 반환
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, &custom.Claims{
        UserID:   "user-123",
        Username: "alice",
        Role:     "user",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
        },
    })
    tokenString, _ := token.SignedString(signingKey)
    return c.JSON(http.StatusOK, map[string]string{
        "token": tokenString,
    })
})

// 인증 필요
api := e.Group("/api")
api.Use(custom.JWTAuth(custom.JWTConfig{
    SigningKey: signingKey,
}))
api.GET("/profile", func(c echo.Context) error {
    claims := c.Get("user").(*custom.Claims)
    return c.JSON(http.StatusOK, claims)
})

// 공개 경로
public := e.Group("")
public.Use(custom.JWTAuth(custom.JWTConfig{
    SigningKey: signingKey,
    Skipper: func(c echo.Context) bool {
        return c.Path() == "/health"
    },
}))
public.GET("/health", func(c echo.Context) error {
    return c.String(http.StatusOK, "ok")
})
```

---

# 4. 실전 활용

## 4.1 미들웨어 순서의 중요성

**미들웨어는 등록 순서대로 실행된다.** 글로벌 미들웨어의 권장 순서는:

```go
e := echo.New()

// 1. Recover: 패닉 처리 (가장 먼저)
e.Use(middleware.Recover())

// 2. RequestID: 요청 추적 (Logger 전에)
e.Use(middleware.RequestID())

// 3. Logger: 로깅 (모든 요청 기록)
e.Use(middleware.RequestLoggerWithConfig(loggerConfig))

// 4. CORS: 교차 출처 (보안)
e.Use(middleware.CORSWithConfig(corsConfig))

// 5. Auth: 인증 (비즈니스 로직 전에)
e.Use(custom.JWTAuth(jwtConfig))

// 라우트 정의
e.GET("/health", handler)
```

### 순서가 중요한 이유

- **Recover 먼저**: 뒤의 미들웨어에서 패닉이 발생해도 처리한다.
- **Logger 앞에**: RequestID를 먼저 생성해 Logger에서 사용한다.
- **Auth 뒤에**: 인증 실패 시 이후 미들웨어/핸들러는 실행되지 않는다.

## 4.2 Skipper 패턴

특정 경로에서 미들웨어를 건너뛸 수 있다.

```go
api := e.Group("/api")
api.Use(custom.JWTAuth(custom.JWTConfig{
    SigningKey: signingKey,
    Skipper: func(c echo.Context) bool {
        // /api/health, /api/login은 토큰 검증 안 함
        path := c.Path()
        return path == "/api/health" || path == "/api/login"
    },
}))
```

## 4.3 미들웨어 팩토리 패턴

미들웨어를 생성할 때 설정값을 전달하는 패턴이다. 위의 `JWTAuth` 같은 함수가 팩토리 패턴의 예다.

```go
// 설정을 받는 팩토리
func NewAuthMiddleware(config AuthConfig) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            // config 사용
            return next(c)
        }
    }
}

// 사용
e.Use(NewAuthMiddleware(AuthConfig{
    SecretKey: "secret",
}))
```

## 4.4 미들웨어 테스트

`httptest`를 사용해 미들웨어를 독립적으로 테스트한다.

```go
func TestJWTAuth_ValidToken(t *testing.T) {
    // JWT 토큰 생성
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, &custom.Claims{
        UserID: "user-123",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
        },
    })
    tokenString, _ := token.SignedString(testKey)

    // Echo 서버 설정
    e := echo.New()
    e.Use(custom.JWTAuth(custom.JWTConfig{SigningKey: testKey}))
    e.GET("/test", func(c echo.Context) error {
        claims := c.Get("user").(*custom.Claims)
        return c.JSON(http.StatusOK, claims)
    })

    // HTTP 요청 시뮬레이션
    req := httptest.NewRequest(http.MethodGet, "/test", nil)
    req.Header.Set("Authorization", "Bearer "+tokenString)
    rec := httptest.NewRecorder()

    // 서버 실행
    e.ServeHTTP(rec, req)

    // 검증
    assert.Equal(t, http.StatusOK, rec.Code)
}
```

### 테스트 시나리오

- ✅ 유효한 토큰 → 200
- ✅ 만료된 토큰 → 401
- ✅ 토큰 누락 → 401
- ✅ 잘못된 형식 → 401
- ✅ Skipper 경로 → 200 (토큰 검증 안 함)

---

# 5. 완전한 예제

빌트인 미들웨어와 커스텀 미들웨어를 조합한 완전한 서버다.

```go
package main

import (
    "net/http"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
    "go.uber.org/zap"

    "github.com/kenshin579/tutorials-go/golang/middleware/custom"
)

var signingKey = []byte("my-secret-key")

func main() {
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    e := echo.New()

    // 글로벌 미들웨어 체인
    e.Use(middleware.Recover())
    e.Use(middleware.RequestID())
    e.Use(custom.ZapLogger(logger))
    e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{"*"},
    }))

    // 공개 엔드포인트
    e.GET("/health", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
    })

    e.POST("/login", func(c echo.Context) error {
        type LoginReq struct {
            Username string `json:"username"`
            Password string `json:"password"`
        }
        var req LoginReq
        c.Bind(&req)

        // 데모용 인증
        if req.Username != "admin" || req.Password != "password" {
            return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
        }

        // JWT 토큰 생성
        claims := &custom.Claims{
            UserID:   "user-123",
            Username: req.Username,
            Role:     "admin",
            RegisteredClaims: jwt.RegisteredClaims{
                ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
            },
        }
        token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
        tokenString, _ := token.SignedString(signingKey)

        return c.JSON(http.StatusOK, map[string]string{"token": tokenString})
    })

    // 인증 필요 API
    api := e.Group("/api")
    api.Use(custom.JWTAuth(custom.JWTConfig{
        SigningKey: signingKey,
    }))
    api.GET("/profile", func(c echo.Context) error {
        claims := c.Get("user").(*custom.Claims)
        return c.JSON(http.StatusOK, claims)
    })

    e.Logger.Fatal(e.Start(":8080"))
}
```

### 사용 예제

```bash
# 1. 헬스 체크 (토큰 불필요)
curl http://localhost:8080/health

# 2. 로그인 (토큰 발급)
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 응답:
# {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# 3. 인증 필요 API (토큰 포함)
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 응답:
# {"user_id": "user-123", "username": "admin", "role": "admin"}
```

---

# 6. 마무리

Echo 미들웨어의 핵심:

1. **빌트인 미들웨어부터 시작**: Logger, CORS, Recover 등 자주 쓰는 것은 기본 제공된다.
2. **미들웨어 순서 중요**: Recover → Logger → Auth 순서가 권장된다.
3. **Skipper로 유연성 확보**: 특정 경로는 미들웨어를 건너뛸 수 있다.
4. **Context에 데이터 전달**: 미들웨어에서 인증 정보를 Context에 저장해 핸들러에서 사용한다.
5. **테스트 가능한 설계**: 미들웨어를 팩토리 함수로 만들어 테스트하기 쉽게 한다.

더 깊은 내용:
- [JWKS(JSON Web Key Set)이란?](/article/jwks-json-web-key-set이란) - 공개 키 기반 JWT 검증
- [Keycloak으로 자체 인증 서버 구축](/article/Keycloak으로-자체-인증-서버-구축) - 엔터프라이즈 인증 솔루션

전체 샘플 코드는 [GitHub 저장소](https://github.com/kenshin579/tutorials-go/tree/master/golang/middleware)에서 확인하고, `go test ./...`로 테스트도 실행해보자.
