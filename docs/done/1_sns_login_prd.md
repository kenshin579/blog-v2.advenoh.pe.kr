# PRD: SNS 로그인 연동 블로그 포스팅

## 개요

특정 사이트에 SNS 로그인(OAuth 2.0)을 연동하는 방법을 다루는 블로그 포스팅.
샘플 코드와 함께 실제 동작하는 가입/로그인 플로우를 구현한다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Go 1.25 (Golang) |
| **Frontend** | React |
| **인증** | OAuth 2.0 |
| **SNS Provider** | Google (구현 대상), 확장 가능한 구조 |
| **샘플 코드 위치** | `tutorials-go` repo |

## 요구사항

### 기능 요구사항

1. **회원가입 (Sign Up)**
   - Google OAuth로 최초 로그인 시 자동 회원가입
   - 사용자 정보 저장 (이메일, 이름, 프로필 이미지, provider)

2. **로그인 (Sign In)**
   - Google OAuth를 통한 로그인
   - JWT 토큰 발급 (Access Token + Refresh Token)
   - 로그인 상태 유지

3. **로그아웃**
   - JWT 토큰 무효화

4. **확장 가능한 구조**
   - 코드 상으로는 Google만 구현하지만, 다른 SNS(GitHub, Kakao, Naver 등) 추가가 용이한 구조
   - Provider interface 패턴 활용

### 비기능 요구사항

- CORS 설정 (FE/BE 분리 환경)
- 환경변수로 OAuth credentials 관리
- 에러 핸들링 및 적절한 HTTP 상태 코드

## 아키텍처

```
[React App] → [Go Backend API] → [Google OAuth 2.0]
     ↑              ↓
     └──── JWT Token ────┘
```

### OAuth 2.0 Authorization Code Flow

```
1. 사용자 → React: "Google로 로그인" 클릭
2. React → Google: Authorization URL로 리다이렉트
3. Google → React: Authorization Code 반환 (callback URL)
4. React → Go API: Authorization Code 전송
5. Go API → Google: Code로 Access Token 교환
6. Go API → Google: Access Token으로 사용자 정보 조회
7. Go API → DB: 사용자 생성/조회
8. Go API → React: JWT 토큰 반환
```

## 프로젝트 구조 (tutorials-go)

```
tutorials-go/
└── web/
    └── sns-login/
        ├── backend/
        │   ├── main.go
        │   ├── go.mod
        │   ├── .env.example            # 환경변수 템플릿
        │   ├── config/
        │   │   └── config.go           # 환경변수, OAuth 설정
        │   ├── handler/
        │   │   ├── auth_handler.go     # 로그인/회원가입 핸들러 (Echo)
        │   │   └── user_handler.go     # 사용자 정보 핸들러 (Echo)
        │   ├── middleware/
        │   │   └── auth_middleware.go   # JWT 인증 미들웨어 (Echo)
        │   ├── model/
        │   │   └── user.go             # User GORM 모델
        │   ├── provider/
        │   │   ├── oauth_provider.go   # Provider interface
        │   │   └── google.go           # Google OAuth 구현
        │   ├── repository/
        │   │   └── user_repository.go  # 사용자 저장소 (GORM + SQLite)
        │   ├── service/
        │   │   ├── auth_service.go     # 인증 비즈니스 로직
        │   │   └── token_service.go    # JWT 토큰 관리
        │   └── data/
        │       └── app.db              # SQLite 데이터 파일 (자동 생성)
        └── frontend/
            ├── package.json
            ├── src/
            │   ├── App.tsx
            │   ├── components/
            │   │   ├── LoginButton.tsx     # SNS 로그인 버튼
            │   │   ├── UserProfile.tsx     # 로그인 후 프로필
            │   │   └── ProtectedRoute.tsx  # 인증 필요 라우트
            │   ├── hooks/
            │   │   └── useAuth.ts          # 인증 상태 관리 훅
            │   ├── services/
            │   │   └── authService.ts      # API 호출
            │   └── types/
            │       └── auth.ts             # 타입 정의
            └── .env.example
```

## Backend 주요 설계

### Provider Interface

```go
// provider/oauth_provider.go
type OAuthProvider interface {
    GetAuthURL(state string) string
    ExchangeCode(ctx context.Context, code string) (*UserInfo, error)
    Name() string
}

type UserInfo struct {
    Email     string
    Name      string
    AvatarURL string
    Provider  string
    ProviderID string
}
```

### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/auth/{provider}/url` | OAuth 인증 URL 반환 |
| POST | `/api/auth/{provider}/callback` | Authorization Code로 로그인/가입 |
| POST | `/api/auth/refresh` | Access Token 갱신 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/user/me` | 현재 사용자 정보 (인증 필요) |

### 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `golang.org/x/oauth2` | OAuth 2.0 클라이언트 |
| `github.com/golang-jwt/jwt/v5` | JWT 토큰 생성/검증 |
| `github.com/labstack/echo/v4` | HTTP 프레임워크 (라우터 + 미들웨어) |
| `github.com/mattn/go-sqlite3` 또는 `modernc.org/sqlite` | SQLite 드라이버 |
| `gorm.io/gorm` + `gorm.io/driver/sqlite` | ORM |

## Frontend 주요 설계

### 페이지 구성

- **로그인 페이지**: Google 로그인 버튼
- **콜백 페이지**: OAuth callback 처리
- **홈 페이지**: 로그인 후 사용자 프로필 표시

### 상태 관리

- `useAuth` 훅으로 인증 상태 관리
- localStorage에 JWT 토큰 저장
- Axios interceptor로 자동 토큰 첨부

## 블로그 포스팅 구성 (안)

### 블로그 목차 (1편 구성)

```
# 1. 들어가며
  - 왜 SNS 로그인인가? (비밀번호 관리 부담, UX 개선, 보안 위임)
  - 완성 결과 미리보기

# 2. OAuth 2.0 핵심 개념
  ## 2.1 OAuth 2.0이란?
    - 인증(Authentication) vs 인가(Authorization)
    - OAuth 2.0의 4가지 역할 (Resource Owner, Client, Authorization Server, Resource Server)
  ## 2.2 Authorization Code Flow
    - 전체 흐름 Mermaid 시퀀스 다이어그램
    - 각 단계 상세 설명 (Authorization Request → Code → Token Exchange → API Call)
    - 왜 Authorization Code Flow인가? (비교표: Implicit, Client Credentials, ROPC)
  ## 2.3 주요 보안 요소
    - state 파라미터 (CSRF 방지)
    - PKCE (Proof Key for Code Exchange) 개념 소개
    - Redirect URI 검증

# 3. Google Cloud Console 설정
  ## 3.1 프로젝트 생성
  ## 3.2 OAuth 동의 화면 구성
  ## 3.3 OAuth 2.0 클라이언트 ID 생성

# 4. Go Backend 구현
  ## 4.1 프로젝트 구조
  ## 4.2 Provider Interface 설계
  ## 4.3 Google OAuth Provider 구현
  ## 4.4 JWT 토큰 관리
  ## 4.5 인증 미들웨어
  ## 4.6 API 핸들러 구현
  ## 4.7 SQLite + GORM 연동

# 5. React Frontend 연동
  ## 5.1 인증 서비스 및 API 클라이언트
  ## 5.2 로그인 UI 구현 (LoginButton, OAuth 콜백, UserProfile)
  ## 5.3 인증 상태 관리 (useAuth 훅, ProtectedRoute)

# 6. 전체 플로우 시연
  ## 6.1 docker-compose로 Backend + Frontend 실행
  ## 6.2 회원가입 / 로그인 / 로그아웃 시연
  ## 6.3 CORS 설정

# 7. 마무리
  - 핵심 포인트 요약
  - 참고 자료
```

### 프로덕션 보안 고려사항 (블로그 마무리 섹션에 간단히 언급)

| 항목 | 설명 |
|------|------|
| **PKCE** | Authorization Code 가로채기 공격 방지. 클라이언트가 code_verifier/code_challenge 쌍을 생성하여 Code 교환 시 검증 |
| **Refresh Token Rotation** | Refresh Token 사용 시마다 새 토큰 발급. 탈취된 토큰의 재사용을 감지/차단 |
| **Rate Limiting** | 로그인/토큰 갱신 API에 요청 횟수 제한. 브루트포스 공격 방지 |
| **Secure Cookie vs localStorage** | JWT를 localStorage 대신 HttpOnly + Secure + SameSite 쿠키에 저장하여 XSS 공격으로부터 보호 |
| **HTTPS 필수** | OAuth 리다이렉트 및 토큰 전송 시 중간자 공격(MITM) 방지 |
| **state 파라미터** | CSRF 방지용 랜덤 값. 인증 요청과 콜백이 동일 세션인지 검증 |

## Google OAuth 설정 절차

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. OAuth 동의 화면 구성
4. OAuth 2.0 클라이언트 ID 생성
   - 승인된 리다이렉션 URI: `http://localhost:3000/auth/google/callback`
5. Client ID, Client Secret 환경변수에 설정

## 논의 사항

- [x] HTTP 프레임워크: **Echo v4** 사용
- [x] Go 버전: **1.25**
- [x] DB: **SQLite** (GORM + gorm.io/driver/sqlite)
- [x] 블로그 편 수: **1편** (Backend + Frontend 통합)
- [x] 시리즈: **없음** (단독 글)
- [x] tutorials-go 내 디렉토리 위치: `web/sns-login/` ✅

## 참고 자료

- [Google OAuth 2.0 공식 문서](https://developers.google.com/identity/protocols/oauth2)
- [golang.org/x/oauth2 패키지](https://pkg.go.dev/golang.org/x/oauth2)
- [JWT.io](https://jwt.io/)
