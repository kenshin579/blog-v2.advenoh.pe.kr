# TODO: FastAPI 실전 - 프로젝트 구조와 패턴

## 1단계: 프로젝트 초기 설정
- [x] `tutorials-python/python/fastapi/advanced/` 디렉토리 생성
- [x] `pyproject.toml` / `requirements.txt` 작성 (fastapi, uvicorn, pydantic-settings, PyJWT, httpx, pytest, pytest-asyncio)
- [x] `.env.dev`, `.env.prod` 환경 파일 생성
- [x] `app/__init__.py`, 각 패키지 `__init__.py` 생성

## 2단계: 설정 관리
- [x] `app/config.py` - `BaseSettings` 기반 설정 클래스
- [x] `@lru_cache` + `get_settings()` 캐싱 패턴 구현
- [x] 환경별 `.env` 파일 분리 동작 확인

## 3단계: 레이어드 아키텍처 구현
- [x] `app/schemas/user.py` - UserCreate, UserResponse Pydantic 모델
- [x] `app/schemas/item.py` - ItemCreate, ItemResponse Pydantic 모델
- [x] `app/repositories/user_repository.py` - 인메모리 CRUD
- [x] `app/repositories/item_repository.py` - 인메모리 CRUD
- [x] `app/services/user_service.py` - 비즈니스 로직
- [x] `app/services/item_service.py` - 비즈니스 로직
- [x] `app/routers/users.py` - 사용자 CRUD 엔드포인트
- [x] `app/routers/items.py` - 아이템 CRUD 엔드포인트
- [x] `app/main.py` - FastAPI 앱 + `include_router()` 등록

## 4단계: 미들웨어
- [x] `app/middleware/timing.py` - `X-Process-Time` 헤더 미들웨어
- [x] `app/middleware/logging.py` - 요청/응답 로깅 미들웨어
- [x] `main.py`에 미들웨어 등록 + 실행 순서 확인

## 5단계: 커스텀 예외 처리
- [x] `app/exceptions/handlers.py` - 커스텀 예외 클래스 (NotFoundError, AlreadyExistsError)
- [x] 예외별 핸들러 등록 (`@app.exception_handler`)
- [x] `RequestValidationError` 핸들러 오버라이드
- [x] 일관된 에러 응답 포맷 확인: `{"detail": ..., "code": ...}`

## 6단계: 인증/인가
- [x] `app/schemas/token.py` - Token, TokenData 스키마
- [x] `app/auth/jwt.py` - JWT 생성/검증 함수 (PyJWT)
- [x] `app/routers/auth.py` - `/auth/token` 토큰 발급 엔드포인트
- [x] `OAuth2PasswordBearer` + `get_current_user` 의존성
- [x] RBAC `require_role()` 의존성 팩토리
- [x] `Security()` vs `Depends()` 차이 예제

## 7단계: 비동기 작업과 이벤트
- [x] `BackgroundTasks` 사용 예제 (사용자 생성 시 이메일 발송 시뮬레이션)
- [x] `lifespan` 이벤트 구현 (startup/shutdown 로깅)
- [x] `app.state`에 공유 리소스 저장 예제

## 8단계: 테스트 작성
- [x] `tests/conftest.py` - client, auth_headers fixture
- [x] `tests/test_users.py` - 사용자 CRUD 테스트
- [x] `tests/test_items.py` - 아이템 CRUD 테스트
- [x] `tests/test_auth.py` - 인증/인가 테스트 (토큰 발급, 보호 엔드포인트, RBAC)
- [x] `tests/test_middleware.py` - 미들웨어 동작 테스트 (X-Process-Time 헤더)
- [x] 의존성 오버라이드 테스트 예제
- [x] `httpx.AsyncClient` 비동기 테스트 예제
- [x] 전체 테스트 통과 확인: `pytest -v`

## 9단계: Docker 배포
- [x] `Dockerfile` - multi-stage 빌드 (python:3.12-slim)
- [x] `docker-compose.yml` - FastAPI + PostgreSQL + Redis
- [x] `/health` 헬스체크 엔드포인트
- [ ] `docker-compose up` 동작 확인

## 10단계: 블로그 글 작성
- [x] `docs/start/7_22_python_fastapi_advanced/index.md` 초안 작성
- [x] 각 섹션별 코드 예제 삽입 (GitHub 코드 참조 링크 포함)
- [x] Mermaid 다이어그램: 레이어드 아키텍처 흐름도
- [x] Mermaid 다이어그램: 미들웨어 실행 순서
- [x] Mermaid 다이어그램: JWT 인증 흐름
- [ ] MCP Playwright로 로컬 서버 실행 후 API 동작 확인
- [x] 인코딩 확인: `file -I index.md`
- [ ] PR 생성
