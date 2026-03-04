# Go에서 미들웨어 패턴 구현하기 - 구현 문서

> 참조: `6_13_go_middleware_prd.md`

---

## 1. 샘플 코드 구현 (tutorials-go)

### 1.1 프로젝트 구조

```
tutorials-go/golang/middleware/
├── go.mod
├── go.sum
├── main.go                     # 통합 예제 서버 (빌트인 + 커스텀 미들웨어 조합)
├── custom/
│   ├── logging.go              # 구조화된 로깅 미들웨어 (zap)
│   ├── logging_test.go
│   ├── jwt_auth.go             # JWT 인증 미들웨어
│   └── jwt_auth_test.go
└── builtin/
    └── main.go                 # Echo 빌트인 미들웨어 설정 예제
```

### 1.2 의존성

```
github.com/labstack/echo/v4
github.com/golang-jwt/jwt/v5
go.uber.org/zap
github.com/stretchr/testify
```

### 1.3 커스텀 미들웨어 구현 상세

#### custom/logging.go - 구조화된 로깅 미들웨어

- zap 로거를 주입받는 미들웨어 팩토리 패턴
- 로깅 항목: method, path, status, latency, request_id, remote_ip
- `ZapLoggerConfig` 구조체로 설정 커스터마이징 (Skipper 포함)

```go
func ZapLogger(logger *zap.Logger) echo.MiddlewareFunc {
    return ZapLoggerWithConfig(logger, DefaultZapLoggerConfig)
}

func ZapLoggerWithConfig(logger *zap.Logger, config ZapLoggerConfig) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            start := time.Now()
            err := next(c)
            logger.Info("request",
                zap.String("method", req.Method),
                zap.String("path", req.URL.Path),
                zap.Int("status", res.Status),
                zap.Duration("latency", time.Since(start)),
            )
            return err
        }
    }
}
```

#### custom/jwt_auth.go - JWT 인증 미들웨어

- HMAC(HS256) 기반 JWT 토큰 검증 (JWKS 개념은 기존 블로그 글 링크로 대체)
- `JWTConfig` 구조체: SigningKey, Skipper, TokenLookup, ContextKey
- Skipper 패턴으로 공개 API 경로 제외
- 검증된 클레임을 `echo.Context`에 저장

```go
type JWTConfig struct {
    SigningKey  []byte
    Skipper    middleware.Skipper
    ContextKey string
}

func JWTAuth(config JWTConfig) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            if config.Skipper != nil && config.Skipper(c) {
                return next(c)
            }
            // Authorization 헤더에서 Bearer 토큰 추출
            // jwt.Parse로 토큰 검증
            // 클레임을 Context에 저장
            c.Set(config.ContextKey, claims)
            return next(c)
        }
    }
}
```

기존 참고 코드:
- `keycloak/backend/middleware/auth.go` - Keycloak JWKS 연동 JWT 검증 (147줄)
- `web/sns-login/backend/middleware/auth_middleware.go` - TokenService 기반 JWT 검증

### 1.4 빌트인 미들웨어 예제 (builtin/main.go)

각 빌트인 미들웨어의 기본 사용법과 주요 Config 옵션을 보여주는 예제:

```go
// 로깅/추적
e.Use(middleware.Logger())
e.Use(middleware.RequestIDWithConfig(middleware.RequestIDConfig{
    Generator: func() string { return uuid.New().String() },
}))

// 보안
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"https://example.com"},
    AllowMethods: []string{http.MethodGet, http.MethodPost},
}))
e.Use(middleware.Secure())

// 안정성/성능
e.Use(middleware.Recover())
e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))
e.Use(middleware.BodyLimit("2M"))
e.Use(middleware.Gzip())
e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
    Timeout: 30 * time.Second,
}))
```

### 1.5 통합 예제 서버 (main.go)

실전 미들웨어 조합 패턴을 보여주는 서버:

```go
e := echo.New()

// 글로벌 미들웨어 (순서 중요)
e.Use(middleware.Recover())
e.Use(middleware.RequestID())
e.Use(custom.ZapLogger(logger))
e.Use(middleware.CORSWithConfig(corsConfig))

// 공개 API
e.GET("/health", healthHandler)
e.POST("/login", loginHandler)

// 인증 필요 API 그룹
api := e.Group("/api")
api.Use(custom.JWTAuth(jwtConfig))
api.GET("/profile", profileHandler)
```

### 1.6 테스트 구현

- `echo.New()` + `httptest.NewRequest` + `httptest.NewRecorder` 조합
- 로깅 미들웨어: zap의 `zaptest.NewLogger` 활용
- JWT 미들웨어: 유효/만료/누락 토큰 케이스 테스트
- 미들웨어 체인 통합 테스트: Recover → Logger → Auth → Handler 순서 검증

---

## 2. 블로그 글 작성 (blog-v2)

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/6_13_go_middleware/index.md
```

### 2.2 frontmatter

```yaml
---
title: "Echo 프레임워크 미들웨어 완벽 가이드"
description: "Echo 빌트인 미들웨어 활용법과 JWT 인증, 구조화된 로깅 등 커스텀 미들웨어를 직접 구현하며, 실전 조합 패턴과 테스트 방법까지 다룹니다"
date: 2026-03-XX
tags:
  - go
  - echo
  - middleware
  - jwt
series: "Go 웹 개발"
---
```

### 2.3 다이어그램

- 미들웨어 체인 양파 모델: Mermaid flowchart
- 미들웨어 실행 순서: Mermaid sequence diagram

### 2.4 참조 링크

- [JWKS(JSON Web Key Set)이란?](/article/jwks-json-web-key-set이란) - JWT/JWKS 개념 설명
- [Keycloak으로 자체 인증 서버 구축](/article/Keycloak으로-자체-인증-서버-구축) - 인증 서버 연동
- GitHub 샘플 코드 링크: `tutorials-go/golang/middleware/`
