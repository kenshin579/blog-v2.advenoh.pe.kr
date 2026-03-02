# PRD: FastAPI 실전 - 프로젝트 구조와 패턴

## 개요
레이어드 아키텍처, 미들웨어, 인증/인가, 테스트 등 프로덕션 수준의 FastAPI 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 6-2
- **난이도**: 중-고급
- **우선순위**: ★★☆

## 다룰 내용
1. 프로젝트 디렉토리 구조 (router, service, repository 레이어)
2. 미들웨어 (로깅, 타이밍, 에러 핸들링)
3. 커스텀 예외 처리 (exception handler)
4. 인증/인가 (OAuth2, JWT, 의존성 주입 활용)
5. 백그라운드 태스크 (BackgroundTasks)
6. 이벤트 훅 (lifespan)
7. 테스트 (TestClient, httpx, pytest-asyncio)
8. 설정 관리 (Pydantic BaseSettings)
9. Docker + docker-compose 배포

## 샘플 코드
- `tutorials-python/python/fastapi/advanced/`

## 참고
- https://fastapi.tiangolo.com/advanced/
- https://github.com/zhanymkanov/fastapi-best-practices
