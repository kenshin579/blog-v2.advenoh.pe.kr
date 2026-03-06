# 구현 계획: FastAPI 실전 - 프로젝트 구조와 패턴

## 샘플 코드 위치
- `tutorials-python/python/fastapi/advanced/`

## 프로젝트 구조

```
tutorials-python/python/fastapi/advanced/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI 앱 + lifespan + 미들웨어 등록
│   ├── config.py              # BaseSettings 설정 관리
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── users.py           # 사용자 CRUD 라우터
│   │   ├── items.py           # 아이템 CRUD 라우터
│   │   └── auth.py            # 인증 라우터 (토큰 발급)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── item_service.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   └── item_repository.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py            # User 요청/응답 모델
│   │   ├── item.py            # Item 요청/응답 모델
│   │   └── token.py           # Token 스키마
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── logging.py         # 요청/응답 로깅
│   │   └── timing.py          # X-Process-Time 헤더
│   ├── exceptions/
│   │   ├── __init__.py
│   │   └── handlers.py        # 커스텀 예외 + 핸들러
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt.py             # JWT 생성/검증, OAuth2 스키마
│   └── dependencies.py        # 공통 의존성 (get_settings, get_current_user)
├── tests/
│   ├── __init__.py
│   ├── conftest.py            # pytest fixture (client, auth_headers)
│   ├── test_users.py
│   ├── test_items.py
│   ├── test_auth.py
│   └── test_middleware.py
├── Dockerfile                 # multi-stage 빌드
├── docker-compose.yml         # FastAPI + PostgreSQL + Redis
├── .env.dev
├── .env.prod
├── pyproject.toml
└── requirements.txt
```

## 핵심 구현 사항

### 1. 레이어드 아키텍처 (Router → Service → Repository)

- **Router**: HTTP 요청/응답 처리, 스키마 검증
- **Service**: 비즈니스 로직, 트랜잭션 관리
- **Repository**: 데이터 접근 (인메모리 dict로 간소화)
- 각 레이어는 `Depends()`로 연결

```python
# routers/users.py
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, service: UserService = Depends(get_user_service)):
    return service.get_user(user_id)
```

### 2. 설정 관리 (Pydantic BaseSettings)

```python
# config.py
class Settings(BaseSettings):
    app_name: str = "FastAPI Advanced"
    database_url: str = "sqlite:///./test.db"
    secret_key: str
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env.dev")

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### 3. 미들웨어

```python
# middleware/timing.py
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time"] = str(time.perf_counter() - start)
        return response
```

```python
# middleware/logging.py - 요청/응답 로깅 (method, path, status_code)
```

### 4. 커스텀 예외 처리

```python
# exceptions/handlers.py
class NotFoundError(Exception):
    def __init__(self, resource: str, id: int):
        self.resource = resource
        self.id = id

async def not_found_handler(request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": f"{exc.resource} {exc.id} not found", "code": "NOT_FOUND"}
    )

# RequestValidationError 핸들러 오버라이드 - 일관된 에러 포맷
```

### 5. 인증/인가 (JWT + OAuth2)

```python
# auth/jwt.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    # PyJWT로 JWT 생성

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # JWT 검증 → 사용자 반환

def require_role(role: str):
    # RBAC 의존성 팩토리
    def role_checker(current_user: User = Depends(get_current_user)):
        if role not in current_user.roles:
            raise HTTPException(status_code=403)
        return current_user
    return role_checker
```

### 6. BackgroundTasks

```python
@router.post("/users/")
async def create_user(user: UserCreate, background_tasks: BackgroundTasks):
    new_user = service.create_user(user)
    background_tasks.add_task(send_welcome_email, new_user.email)
    return new_user
```

### 7. Lifespan 이벤트

```python
# main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.state.db_pool = await create_pool()
    yield
    # shutdown
    await app.state.db_pool.close()

app = FastAPI(lifespan=lifespan)
```

### 8. 테스트

```python
# conftest.py
@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = lambda: TestSettings()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    resp = client.post("/auth/token", data={"username": "test", "password": "test"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- 비동기 테스트: `httpx.AsyncClient` + `pytest-asyncio`
- 의존성 오버라이드로 외부 의존성 격리

### 9. Docker 배포

```dockerfile
# Dockerfile (multi-stage)
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY ./app /app/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [db, redis]
  db:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine
```

- 헬스체크: `GET /health` 엔드포인트
- 프로덕션: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker`

## 의존성 (주요 패키지)

```
fastapi
uvicorn[standard]
pydantic-settings
PyJWT
python-multipart
httpx
pytest
pytest-asyncio
```

## 블로그 글 구성

1. **들어가며** - 왜 프로덕션 수준의 패턴이 필요한가
2. **프로젝트 구조와 설정** - 레이어드 아키텍처, BaseSettings
3. **미들웨어와 예외 처리** - 커스텀 미들웨어, 에러 핸들러
4. **인증/인가** - OAuth2 + JWT + RBAC
5. **비동기 작업과 이벤트** - BackgroundTasks, lifespan
6. **테스트** - TestClient, 의존성 오버라이드, 비동기 테스트
7. **Docker 배포** - multi-stage 빌드, docker-compose
8. **마무리** - 정리 및 참고 자료
