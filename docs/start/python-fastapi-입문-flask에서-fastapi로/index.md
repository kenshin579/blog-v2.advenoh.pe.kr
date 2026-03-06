---
title: "FastAPI 입문 - Flask에서 FastAPI로"
description: "FastAPI의 기본 구조, 라우팅, 의존성 주입, 자동 문서화를 다루는 가이드"
date: 2026-03-06
tags:
  - python
  - fastapi
  - flask
  - web-framework
  - rest-api
series: "FastAPI 풀스택 개발"
---

# 1. 개요

## 1.1 FastAPI란?

FastAPI는 Python 3.7+를 위한 고성능 웹 프레임워크로, 세 가지 핵심 특징을 가지고 있다.

- **자동 타입 검증**: Pydantic과 통합되어 요청/응답 데이터를 자동으로 검증한다
- **자동 API 문서 생성**: OpenAPI(Swagger) 명세를 자동으로 생성하고, 인터랙티브 문서 UI를 제공한다
- **비동기 네이티브 지원**: `async/await`를 기본 지원하여 높은 동시 처리 성능을 발휘한다

## 1.2 Flask vs FastAPI 비교

동일한 사용자 CRUD API를 Flask와 FastAPI로 구현하면서 차이를 비교해보자.

### 비교 요약

| 항목 | Flask | FastAPI |
|------|-------|---------|
| 타입 검증 | 수동 (`request.get_json()` + 직접 검증) | 자동 (Pydantic 모델) |
| API 문서 | 별도 라이브러리 필요 (flask-swagger 등) | 자동 생성 (`/docs`, `/redoc`) |
| 비동기 | 제한적 (Flask 2.0+ 부분 지원) | 네이티브 (`async def`) |
| 성능 | WSGI 기반 | ASGI 기반 (2~3배 빠름) |
| 요청 파싱 | `request.args`, `request.get_json()` | 함수 파라미터 타입 힌트 |
| 에러 응답 | 수동 JSON 포맷팅 | 자동 422 검증 에러 |

### 코드 비교: 사용자 생성 API

**Flask**

```python
@app.post("/users")
def create_user():
    data = request.get_json()
    # 수동 검증 필요
    if not data or "username" not in data or "email" not in data:
        return jsonify({"detail": "username과 email은 필수입니다"}), 422
    new_user = {
        "id": next_id,
        "username": data["username"],
        "email": data["email"],
        "full_name": data.get("full_name"),
    }
    fake_db[next_id] = new_user
    return jsonify(new_user), 201
```

**FastAPI**

```python
@router.post("", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate):
    # Pydantic이 자동 검증 (타입, 필수 필드, 제약 조건)
    new_user = {"id": next_id, **user.model_dump()}
    fake_db[next_id] = new_user
    return new_user
```

FastAPI는 Pydantic 모델을 통해 **요청 데이터 파싱, 타입 변환, 검증, 문서화를 모두 자동으로 처리**한다.

### 마이그레이션 체크리스트: Flask -> FastAPI

| 단계 | Flask | FastAPI |
|------|-------|---------|
| 앱 인스턴스 | `Flask(__name__)` | `FastAPI()` |
| 라우팅 | `@app.route("/path", methods=["GET"])` | `@app.get("/path")` |
| 요청 데이터 | `request.get_json()` | Pydantic 모델 파라미터 |
| 쿼리 파라미터 | `request.args.get("key", type=int)` | `def func(key: int = 0)` |
| 경로 파라미터 | `<int:user_id>` | `{user_id}: int` |
| 응답 | `jsonify(data), status_code` | `return data` (자동 JSON 직렬화) |
| 에러 | `return jsonify(err), 404` | `raise HTTPException(status_code=404)` |
| 서버 실행 | `app.run()` (Werkzeug) | `uvicorn app.main:app` |

# 2. 설치 및 실행

## 2.1 설치와 프로젝트 구조

uv로 프로젝트를 생성하고 의존성을 설치한다.

```bash
uv add fastapi uvicorn[standard]
```

### 최소 프로젝트 구조

`main.py` 하나로 시작할 수 있다.

```
project/
└── main.py
```

### 확장 프로젝트 구조

규모가 커지면 관심사별로 디렉토리를 분리한다.

```
project/
├── pyproject.toml
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 앱 인스턴스, 미들웨어, 라우터 등록
│   ├── routers/         # API 라우터 (엔드포인트)
│   │   └── users.py
│   ├── schemas/         # Pydantic 모델 (요청/응답)
│   │   └── user.py
│   └── dependencies.py  # 의존성 주입 함수
└── tests/
    └── test_main.py
```

## 2.2 실행 (uvicorn)

### CLI 실행

```bash
# 기본 실행 (개발 서버, 자동 리로드)
uvicorn app.main:app --reload

# 옵션 지정
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

주요 옵션:
- `--reload`: 코드 변경 시 자동 재시작 (개발용)
- `--host`: 바인딩 호스트 (기본: `127.0.0.1`)
- `--port`: 포트 번호 (기본: `8000`)
- `--workers`: 워커 프로세스 수 (프로덕션용, `--reload`와 함께 사용 불가)

### Programmatic 실행

코드 내에서 직접 uvicorn을 호출할 수도 있다.

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

# 3. 라우팅과 요청/응답

## 3.1 라우팅 (Path, Query, Body 파라미터)

FastAPI는 함수 파라미터의 타입 힌트로 요청 데이터를 자동 파싱한다.

### Path 파라미터

URL 경로에 포함된 변수를 자동으로 타입 변환한다.

```python
@router.get("/{user_id}")
def get_user(
    user_id: int = Path(ge=1, description="사용자 ID"),
):
    if user_id not in fake_db:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return fake_db[user_id]
```

- `user_id: int` - 문자열을 자동으로 정수 변환
- `Path(ge=1)` - 추가 검증 규칙 (1 이상)

### Query 파라미터

함수 파라미터 중 Path에 포함되지 않은 것은 자동으로 Query 파라미터가 된다.

```python
@router.get("")
def list_users(
    skip: int = Query(default=0, ge=0, description="건너뛸 항목 수"),
    limit: int = Query(default=10, ge=1, le=100, description="반환할 최대 항목 수"),
):
    users = list(fake_db.values())
    return users[skip : skip + limit]
```

호출 예시: `GET /users?skip=0&limit=10`

### Body 파라미터

Pydantic 모델을 파라미터 타입으로 지정하면 요청 body를 자동으로 파싱/검증한다.

```python
@router.post("", status_code=201)
def create_user(user: UserCreate):
    new_user = {"id": next_id, **user.model_dump()}
    fake_db[next_id] = new_user
    return new_user
```

### HTTP 메서드별 데코레이터

```python
@app.get("/items")      # 조회
@app.post("/items")     # 생성
@app.put("/items/{id}") # 전체 수정
@app.patch("/items/{id}") # 부분 수정
@app.delete("/items/{id}") # 삭제
```

## 3.2 요청/응답 모델 (Pydantic 활용)

요청과 응답에 서로 다른 모델을 사용하는 것이 좋은 패턴이다.

```python
from pydantic import BaseModel, Field

# 요청 모델: 생성 시 필요한 필드만
class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50, examples=["frank"])
    email: str = Field(examples=["frank@example.com"])
    full_name: str | None = Field(default=None, examples=["Frank Oh"])

# 요청 모델: 수정 시 모든 필드 선택적
class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=50)
    email: str | None = None
    full_name: str | None = None

# 응답 모델: id 포함
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None = None
```

### 응답 모델 지정

```python
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user: UserUpdate, user_id: int = Path(ge=1)):
    stored = fake_db[user_id]
    update_data = user.model_dump(exclude_unset=True)  # 설정된 필드만 추출
    stored.update(update_data)
    return stored
```

- `response_model=UserResponse`: 응답 데이터를 해당 모델로 직렬화하고 문서화
- `model_dump(exclude_unset=True)`: 클라이언트가 보내지 않은 필드를 제외 (부분 업데이트 구현)

# 4. 의존성 주입

FastAPI의 의존성 주입 시스템은 `Depends`를 사용하여 공통 로직을 재사용한다.

## 4.1 Depends 기본

### 함수 기반 의존성

```python
from fastapi import Depends

def get_db():
    """DB 세션을 시뮬레이션하는 yield 의존성."""
    db = {"connection": "active"}
    print("DB 세션 열림")
    try:
        yield db
    finally:
        print("DB 세션 닫힘")  # 요청 끝나면 자동 실행

@router.get("")
def list_users(db=Depends(get_db)):
    # db를 사용하여 데이터 조회
    ...
```

`yield` 의존성은 **setup/teardown 패턴**을 구현한다. `yield` 이전이 setup, `finally` 블록이 teardown이다. DB 세션, 파일 핸들 등 리소스 관리에 유용하다.

### 의존성 체이닝

의존성이 다른 의존성에 의존할 수 있다.

```python
def get_current_user(db=Depends(get_db)):
    """DB 의존성에 의존하는 인증 의존성."""
    return {"user_id": 1, "username": "admin", "db_status": db["connection"]}

@router.get("/me/profile")
def get_my_profile(current_user=Depends(get_current_user)):
    # get_current_user -> get_db 순서로 의존성 해결
    return current_user
```

## 4.2 고급 의존성 패턴

### 클래스 기반 의존성

callable 객체(클래스)를 의존성으로 사용할 수 있다.

```python
from fastapi import Query

class CommonQueryParams:
    def __init__(
        self,
        skip: int = Query(default=0, ge=0, description="건너뛸 항목 수"),
        limit: int = Query(default=10, ge=1, le=100, description="반환할 최대 항목 수"),
    ):
        self.skip = skip
        self.limit = limit

@router.get("")
def list_users(commons: CommonQueryParams = Depends()):
    users = list(fake_db.values())
    return users[commons.skip : commons.skip + commons.limit]
```

`Depends()`에 클래스를 전달하지 않아도, 타입 힌트에서 자동으로 추론한다.

### Annotated를 활용한 타입 별칭

반복되는 의존성 선언을 `Annotated`로 간결하게 만들 수 있다.

```python
from typing import Annotated

CommonParams = Annotated[CommonQueryParams, Depends()]
DB = Annotated[dict, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]

@router.get("")
def list_users(commons: CommonParams, db: DB):
    ...
```

# 5. 비동기와 미들웨어

## 5.1 비동기 엔드포인트 (async def)

### async def vs def

FastAPI에서 `def`와 `async def` 두 가지 방식 모두 지원한다.

```python
# 동기 함수: FastAPI가 스레드풀에서 실행 (블로킹 I/O에 적합)
@app.get("/sync")
def sync_endpoint():
    result = blocking_db_query()  # 동기 DB 호출
    return result

# 비동기 함수: 이벤트 루프에서 직접 실행 (비동기 I/O에 적합)
@app.get("/async")
async def async_endpoint():
    result = await async_db_query()  # 비동기 DB 호출
    return result
```

### 언제 무엇을 사용할까?

| 상황 | 사용 | 이유 |
|------|------|------|
| 비동기 라이브러리 (httpx, asyncpg 등) | `async def` | `await` 필요 |
| 동기 라이브러리 (requests, psycopg2 등) | `def` | 스레드풀에서 안전하게 실행 |
| CPU 집약적 작업 | `def` | 이벤트 루프 블로킹 방지 |
| 단순한 데이터 반환 | 둘 다 가능 | I/O 없으면 차이 없음 |

> **주의**: `async def` 안에서 동기 블로킹 호출을 하면 전체 이벤트 루프가 멈춘다. 동기 라이브러리를 사용한다면 `def`를 사용하자.

## 5.2 CORS 미들웨어

브라우저에서 다른 출처의 API를 호출하려면 CORS 설정이 필요하다.

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 허용할 출처
    allow_credentials=True,
    allow_methods=["*"],                      # 허용할 HTTP 메서드
    allow_headers=["*"],                      # 허용할 헤더
)
```

### 개발 vs 프로덕션

```python
import os

# 개발 환경: 모든 출처 허용
if os.getenv("ENV") == "development":
    origins = ["*"]
else:
    # 프로덕션: 특정 도메인만 허용
    origins = ["https://myapp.com", "https://admin.myapp.com"]
```

# 6. 자동 API 문서화

## 6.1 Swagger UI와 ReDoc

FastAPI는 코드에서 자동으로 OpenAPI 스펙을 생성하고, 두 가지 문서 UI를 제공한다.

- **Swagger UI** (`/docs`): 인터랙티브 API 테스트 가능
- **ReDoc** (`/redoc`): 읽기 전용 문서

서버를 실행한 후 브라우저에서 접속하면 된다.

```bash
uvicorn app.main:app --reload
# http://localhost:8000/docs    → Swagger UI
# http://localhost:8000/redoc   → ReDoc
```

## 6.2 문서 커스터마이징

### 엔드포인트 문서화

```python
@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="사용자 상세 조회",
    description="ID로 사용자 정보를 조회합니다",
    tags=["users"],
    responses={404: {"description": "사용자를 찾을 수 없음"}},
)
def get_user(user_id: int = Path(ge=1, description="사용자 ID")):
    ...
```

- `summary`: 엔드포인트 한 줄 설명
- `description`: 상세 설명
- `tags`: 그룹 분류 (Swagger UI에서 그룹핑)
- `responses`: 추가 응답 상태 코드 문서화

### 앱 수준 문서화

```python
app = FastAPI(
    title="FastAPI 입문 예제",
    description="FastAPI의 기본 구조, 라우팅, 의존성 주입, 자동 문서화 예제",
    version="0.1.0",
)
```

# 7. 참고

## 샘플 코드

전체 샘플 코드는 GitHub에서 확인할 수 있다.
- [tutorials-python/python/fastapi/intro/](https://github.com/kenshin579/tutorials-python/tree/master/python/fastapi/intro)

## 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [FastAPI 튜토리얼](https://fastapi.tiangolo.com/tutorial/)
