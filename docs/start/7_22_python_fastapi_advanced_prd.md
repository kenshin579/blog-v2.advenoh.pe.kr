# PRD: FastAPI 실전 - 프로젝트 구조와 패턴

## 개요
레이어드 아키텍처, 미들웨어, 인증/인가, 테스트 등 프로덕션 수준의 FastAPI 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 7-5
- **난이도**: 중-고급
- **우선순위**: ★★☆

## 다룰 내용

# 1. 들어가며

# 2. 프로젝트 구조와 설정

## 2.1 프로젝트 디렉토리 구조 (router, service, repository 레이어)
   - `app/routers/`: 도메인별 라우터 분리 (`users.py`, `items.py`)
   - `app/services/`: 비즈니스 로직 계층
   - `app/repositories/`: 데이터 접근 계층
   - `app/schemas/`: Pydantic 요청/응답 모델
   - `APIRouter`로 라우터 모듈화 및 `include_router()` 등록

## 2.2 설정 관리 (Pydantic BaseSettings)
   - `BaseSettings`로 환경변수 기반 설정 관리
   - `Depends(get_settings)`: 설정을 의존성으로 주입
   - `@lru_cache` + `get_settings()`: 설정 캐싱 패턴
   - 환경별 설정 파일 분리 (`.env.dev`, `.env.prod`)

# 3. 미들웨어와 예외 처리

## 3.1 미들웨어 (로깅, 타이밍, 에러 핸들링)
   - `@app.middleware("http")`: 커스텀 미들웨어 함수
   - 요청/응답 로깅 미들웨어 구현
   - 응답 시간 측정 미들웨어 (`X-Process-Time` 헤더)
   - `BaseHTTPMiddleware` 클래스 기반 미들웨어
   - 미들웨어 실행 순서 (등록 역순)

## 3.2 커스텀 예외 처리 (exception handler)
   - `@app.exception_handler(CustomError)`: 예외별 핸들러 등록
   - `HTTPException` vs 커스텀 예외 클래스 설계
   - 일관된 에러 응답 포맷: `{"detail": ..., "code": ...}`
   - `RequestValidationError` 핸들러 오버라이드

# 4. 인증/인가 (OAuth2, JWT, 의존성 주입 활용)
   - `OAuth2PasswordBearer(tokenUrl="token")`: 토큰 스키마
   - JWT 토큰 생성/검증: `python-jose` 또는 `PyJWT`
   - `Depends(get_current_user)`: 인증 의존성 체이닝
   - 역할 기반 접근 제어 (RBAC): 권한 검사 의존성
   - `Security()` vs `Depends()` 차이

# 5. 비동기 작업과 이벤트

## 5.1 백그라운드 태스크 (BackgroundTasks)
   - `background_tasks.add_task(func, *args)`: 태스크 등록
   - 사용 사례: 이메일 발송, 로그 기록, 알림 전송
   - 주의: 무거운 작업은 Celery/RQ 등 별도 큐 사용 권장

## 5.2 이벤트 훅 (lifespan)
   - `@asynccontextmanager async def lifespan(app):` 패턴
   - startup: DB 커넥션 풀 초기화, 캐시 워밍업
   - shutdown: 리소스 정리, 커넥션 풀 종료
   - `app.state`에 공유 리소스 저장

# 6. 테스트 (TestClient, httpx, pytest-asyncio)
   - `TestClient(app)`: 동기 테스트 (requests 호환 API)
   - `httpx.AsyncClient(app=app)`: 비동기 테스트
   - 의존성 오버라이드: `app.dependency_overrides[dep] = mock_dep`
   - DB 테스트: 테스트용 DB + 트랜잭션 rollback 패턴
   - fixture 설계: `client`, `db_session`, `auth_headers`

# 7. Docker + docker-compose 배포
   - `Dockerfile`: multi-stage 빌드 (slim 이미지)
   - `docker-compose.yml`: FastAPI + PostgreSQL + Redis 구성
   - uvicorn `--workers` vs gunicorn + uvicorn worker
   - 헬스체크 엔드포인트 (`/health`)

# 8. 마무리

## 샘플 코드
- `tutorials-python/python/fastapi/advanced/`

## 참고
- https://fastapi.tiangolo.com/advanced/
- https://github.com/zhanymkanov/fastapi-best-practices
