# PRD: FastAPI 입문 - Flask에서 FastAPI로

## 개요
FastAPI의 기본 구조, 라우팅, 의존성 주입, 자동 문서화를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 7-4
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용

# 1. 개요
## 1.1 FastAPI란?
   - 자동 타입 검증 (Pydantic 통합)
   - 자동 API 문서 생성 (OpenAPI/Swagger)
   - 비동기 네이티브 지원 (`async/await`)
## 1.2 Flask vs FastAPI 비교
   - 성능 비교: Flask vs FastAPI 벤치마크
   - 동일 API를 Flask/FastAPI로 구현한 코드 나란히 비교
   - 라우팅, 요청 파싱, 에러 핸들링 차이점
   - 마이그레이션 가이드: Flask → FastAPI 전환 체크리스트

# 2. 설치 및 실행
## 2.1 설치와 프로젝트 구조
   - `uv add fastapi uvicorn[standard]`
   - 최소 프로젝트 구조: `main.py` 하나로 시작
   - 확장된 구조: `app/`, `routers/`, `schemas/`, `models/` 디렉토리
## 2.2 실행 (uvicorn)
   - `uvicorn app.main:app --reload`: 개발 서버
   - `--host`, `--port`, `--workers` 옵션
   - programmatic 실행: `uvicorn.run()` 코드 내 호출

# 3. 라우팅과 요청/응답
## 3.1 라우팅 (Path, Query, Body 파라미터)
   - Path 파라미터: `@app.get("/users/{user_id}")`, 타입 자동 변환
   - Query 파라미터: `def read(skip: int = 0, limit: int = 10)`
   - Body 파라미터: Pydantic 모델로 자동 파싱/검증
   - `Path()`, `Query()`, `Body()`: 추가 검증 규칙과 메타데이터
   - HTTP 메서드별 데코레이터: `@app.get/post/put/patch/delete`
## 3.2 요청/응답 모델 (Pydantic 활용 - 모델 정의 상세는 Pydantic 편 참조)
   - 요청 모델 vs 응답 모델 분리 패턴
   - `response_model=UserResponse`: 응답 스키마 지정
   - `response_model_exclude_unset=True`: 미설정 필드 제외
   - `status_code=201`: 응답 상태 코드 지정

# 4. 의존성 주입
## 4.1 `Depends` 기본
   - `Depends(func)`: 함수 기반 의존성 주입
   - 의존성 체이닝: 의존성이 다른 의존성에 의존
## 4.2 고급 의존성 패턴
   - `yield` 의존성: setup/teardown 패턴 (DB 세션 관리)
   - 클래스 기반 의존성: `Depends(CommonQueryParams)`

# 5. 비동기와 미들웨어
## 5.1 비동기 엔드포인트 (`async def`)
   - `async def` vs `def`: FastAPI에서의 차이 (스레드풀 자동 실행)
   - `await`로 비동기 DB/HTTP 호출
   - 언제 `async def`를 쓰고 언제 `def`를 쓰는지 가이드
## 5.2 CORS 미들웨어
   - `CORSMiddleware` 추가 방법
   - `allow_origins`, `allow_methods`, `allow_headers` 설정
   - 개발 환경 vs 프로덕션 환경 CORS 설정 차이

# 6. 자동 API 문서화
## 6.1 Swagger UI와 ReDoc
   - `/docs`: Swagger UI (인터랙티브 테스트 가능)
   - `/redoc`: ReDoc (읽기 전용 문서)
## 6.2 문서 커스터마이징
   - `tags`, `summary`, `description`: 엔드포인트 문서 커스터마이징
   - `responses={404: {"description": "Not found"}}`: 응답 문서화

# 7. 참고

## 샘플 코드
- `tutorials-python/python/fastapi/intro/`

## 참고
- https://fastapi.tiangolo.com/
- https://fastapi.tiangolo.com/tutorial/
