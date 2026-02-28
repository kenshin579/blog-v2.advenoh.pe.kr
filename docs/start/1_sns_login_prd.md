# PRD: SNS 로그인 연동 블로그 포스팅

## 개요

특정 사이트에 SNS 로그인(OAuth 2.0)을 연동하는 방법을 다루는 블로그 포스팅.
샘플 코드와 함께 실제 동작하는 가입/로그인 플로우를 구현한다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Go (Golang) |
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
        │   ├── config/
        │   │   └── config.go          # 환경변수, OAuth 설정
        │   ├── handler/
        │   │   ├── auth_handler.go     # 로그인/회원가입 핸들러
        │   │   └── user_handler.go     # 사용자 정보 핸들러
        │   ├── middleware/
        │   │   └── auth_middleware.go   # JWT 인증 미들웨어
        │   ├── model/
        │   │   └── user.go             # User 모델
        │   ├── provider/
        │   │   ├── oauth_provider.go   # Provider interface
        │   │   └── google.go           # Google OAuth 구현
        │   ├── service/
        │   │   ├── auth_service.go     # 인증 비즈니스 로직
        │   │   └── token_service.go    # JWT 토큰 관리
        │   └── store/
        │       └── user_store.go       # 사용자 저장소 (in-memory)
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
| `github.com/go-chi/chi/v5` 또는 `net/http` | HTTP 라우터 |
| `github.com/go-chi/cors` | CORS 미들웨어 |

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

### 편 1: OAuth 2.0 개념과 Google 로그인 구현 (Backend)

1. OAuth 2.0 개요 (Authorization Code Flow)
2. Google Cloud Console 설정 (OAuth 클라이언트 생성)
3. Go Backend 구현
   - Provider interface 설계
   - Google OAuth 구현
   - JWT 토큰 발급
4. API 테스트

### 편 2: React Frontend 연동과 전체 플로우

1. React 프로젝트 설정
2. 로그인 UI 구현
3. OAuth 콜백 처리
4. 인증 상태 관리
5. 전체 플로우 시연

### (선택) 편 3: 다른 SNS 추가 + 프로덕션 고려사항

1. GitHub/Kakao 등 추가 Provider 구현
2. DB 연동 (PostgreSQL)
3. 보안 고려사항 (CSRF, state 파라미터, PKCE)

## Google OAuth 설정 절차

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. OAuth 동의 화면 구성
4. OAuth 2.0 클라이언트 ID 생성
   - 승인된 리다이렉션 URI: `http://localhost:3000/auth/google/callback`
5. Client ID, Client Secret 환경변수에 설정

## 논의 사항

- [ ] HTTP 라우터: `chi` vs 표준 `net/http` (Go 1.22+ ServeMux)?
- [ ] DB: in-memory로만 할지, SQLite/PostgreSQL 연동할지?
- [ ] 블로그 편 수: 1편으로 합칠지, 2~3편으로 나눌지?
- [ ] 시리즈명: "SNS 로그인 연동 가이드" 또는 "OAuth 2.0 실전 가이드"?
- [ ] tutorials-go 내 디렉토리 위치: `web/sns-login/` OK?

## 참고 자료

- [Google OAuth 2.0 공식 문서](https://developers.google.com/identity/protocols/oauth2)
- [golang.org/x/oauth2 패키지](https://pkg.go.dev/golang.org/x/oauth2)
- [JWT.io](https://jwt.io/)
