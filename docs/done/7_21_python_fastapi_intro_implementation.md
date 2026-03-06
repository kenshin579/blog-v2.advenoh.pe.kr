# 구현 계획: FastAPI 입문 - Flask에서 FastAPI로

## 1. 샘플 코드 구현

### 위치: `tutorials-python/python/fastapi/intro/`

### 1.1 프로젝트 구조
```
tutorials-python/python/fastapi/intro/
├── pyproject.toml          # uv 프로젝트 설정 (fastapi, uvicorn)
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI 앱 인스턴스, CORS, 라우터 등록
│   ├── routers/
│   │   └── users.py        # 사용자 CRUD 라우터 (Path/Query/Body 파라미터 예시)
│   ├── schemas/
│   │   └── user.py         # Pydantic 요청/응답 모델 (UserCreate, UserResponse)
│   └── dependencies.py     # Depends 예시 (공통 쿼리 파라미터, yield 의존성)
├── flask_comparison/
│   └── flask_app.py        # 동일 API의 Flask 구현 (비교용)
└── tests/
    └── test_main.py        # httpx AsyncClient 기반 테스트
```

### 1.2 핵심 구현 항목

**main.py**
- FastAPI 인스턴스 생성 (title, description, version)
- CORSMiddleware 설정 (개발/프로덕션 분리 예시)
- 라우터 등록 (`app.include_router`)
- uvicorn programmatic 실행 (`if __name__ == "__main__"`)

**routers/users.py**
- `GET /users/{user_id}` - Path 파라미터 + 타입 자동 변환
- `GET /users` - Query 파라미터 (`skip`, `limit`) + `Query()` 검증
- `POST /users` - Body 파라미터 (Pydantic 모델)
- `PUT /users/{user_id}` - Path + Body 조합
- `DELETE /users/{user_id}` - 삭제
- `response_model`, `status_code`, `tags` 설정

**schemas/user.py**
- `UserCreate(BaseModel)` - 요청 모델
- `UserResponse(BaseModel)` - 응답 모델 (id 포함)
- `UserUpdate(BaseModel)` - 부분 업데이트 모델

**dependencies.py**
- 함수 기반 의존성: `get_db()` (yield 패턴)
- 클래스 기반 의존성: `CommonQueryParams`
- 의존성 체이닝 예시

**flask_comparison/flask_app.py**
- 동일 API를 Flask로 구현 (코드 비교용)
- 라우팅, 요청 파싱, 에러 핸들링 차이 명시

**비동기 엔드포인트 예시**
- `async def` vs `def` 차이를 보여주는 엔드포인트
- `await` 사용 예시 (httpx 등)

## 2. 블로그 글 작성

### 위치: `docs/start/7_21_python_fastapi_intro/index.md`

### 2.1 글 구조

```yaml
---
title: "FastAPI 입문 - Flask에서 FastAPI로"
description: "FastAPI의 기본 구조, 라우팅, 의존성 주입, 자동 문서화를 다루는 가이드"
date: 2026-03-XX
tags:
  - python
  - fastapi
  - flask
  - web-framework
  - rest-api
series: "FastAPI 풀스택 개발"
---
```

### 2.2 섹션별 작성 포인트

| 섹션 | 핵심 포인트 |
|------|------------|
| 1. 개요 | FastAPI 특징 3가지 + Flask vs FastAPI 비교 표 |
| 2. 설치 및 실행 | uv 기반 설치, 최소/확장 프로젝트 구조, uvicorn 실행 옵션 |
| 3. 라우팅과 요청/응답 | Path/Query/Body 파라미터 코드 예시, 요청/응답 모델 분리 |
| 4. 의존성 주입 | Depends 기본, yield 패턴, 클래스 기반, 체이닝 |
| 5. 비동기와 미들웨어 | async def vs def 가이드, CORS 설정 |
| 6. 자동 API 문서화 | Swagger UI/ReDoc 스크린샷, 커스터마이징 |

### 2.3 Flask vs FastAPI 비교 항목
- 코드 나란히 비교 (동일 API)
- 성능 벤치마크 수치 (참고 자료 기반)
- 마이그레이션 체크리스트 표

## 3. 참고 자료
- https://fastapi.tiangolo.com/
- https://fastapi.tiangolo.com/tutorial/
