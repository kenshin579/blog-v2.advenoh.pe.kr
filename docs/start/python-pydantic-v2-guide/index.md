---
title: "Pydantic v2 완벽 가이드 - BaseModel부터 Settings까지"
description: "Pydantic v2 완벽 가이드 - BaseModel, Field, Validator, 직렬화/역직렬화, Settings 관리까지"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - pydantic
  - validation
  - fastapi
  - 파이썬
series: "FastAPI 풀스택 개발"
---

# 1. 개요

## Pydantic이란?

Pydantic은 Python 타입 힌트를 활용한 데이터 검증 라이브러리다. 런타임에 데이터 타입을 검증하고, 잘못된 데이터가 들어오면 상세한 에러 메시지를 제공한다. FastAPI의 핵심 의존성이기도 하며, API 요청/응답 모델, 설정 관리, 데이터 파싱 등 다양한 용도로 활용된다.

**왜 Pydantic을 사용하는가?**

- **타입 안전성**: 런타임에 데이터 타입을 강제하여 버그를 사전에 방지
- **자동 변환**: 문자열 `"25"`를 `int` 필드에 넣으면 자동으로 `25`로 변환
- **상세한 에러**: 어떤 필드에서 어떤 문제가 발생했는지 명확하게 알려줌
- **JSON Schema**: 모델에서 자동으로 JSON Schema 생성 → API 문서 자동화
- **IDE 지원**: 타입 힌트 기반이라 자동완성, 타입 체크 등 IDE 기능 완벽 지원

## v1 → v2 주요 변경점

Pydantic v2는 내부 엔진을 Rust 기반 `pydantic-core`로 재작성하여 성능이 대폭 향상되었다.

| 항목 | v1 | v2 |
|------|------|------|
| 내부 엔진 | 순수 Python | Rust (`pydantic-core`) |
| 성능 | 기준 | 5~50배 빠름 |
| dict 변환 | `.dict()` | `.model_dump()` |
| JSON 변환 | `.json()` | `.model_dump_json()` |
| dict → 모델 | `.parse_obj()` | `.model_validate()` |
| JSON → 모델 | `.parse_raw()` | `.model_validate_json()` |
| 설정 클래스 | `class Config:` | `model_config = ConfigDict(...)` |
| Validator | `@validator` | `@field_validator` |
| Root Validator | `@root_validator` | `@model_validator` |

마이그레이션 도구 `bump-pydantic`을 사용하면 v1 코드를 v2로 자동 변환할 수 있다.

```bash
pip install bump-pydantic
bump-pydantic .
```

# 2. BaseModel과 필드 정의

## 2.1 BaseModel 기본

`BaseModel`을 상속하여 모델을 정의한다. 필드에 타입 힌트를 선언하면 인스턴스 생성 시 자동으로 검증된다.

```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str

# 인스턴스 생성 - 자동 검증
user = User(name="홍길동", age=30, email="hong@example.com")
print(user.name)   # "홍길동"
print(user.age)    # 30
```

**자동 타입 변환**: Pydantic은 가능한 경우 자동으로 타입을 변환한다.

```python
# 문자열 "25"가 int 25로 자동 변환
user = User(name="홍길동", age="25", email="hong@example.com")
print(user.age)            # 25
print(type(user.age))      # <class 'int'>
```

**ValidationError**: 유효하지 않은 데이터를 넣으면 `ValidationError`가 발생한다.

```python
from pydantic import ValidationError

try:
    User(name="홍길동", age="not_a_number", email="hong@example.com")
except ValidationError as e:
    print(e.errors())
    # [{'type': 'int_parsing', 'loc': ('age',), 'msg': 'Input should be a valid integer...'}]
```

**메타데이터 접근**: `model_fields`로 필드 정보에 접근하고, `model_json_schema()`로 JSON Schema를 생성할 수 있다.

```python
# 필드 메타데이터
print(User.model_fields)
# {'name': FieldInfo(annotation=str, required=True), 'age': FieldInfo(annotation=int, required=True), ...}

# JSON Schema 자동 생성
schema = User.model_json_schema()
print(schema)
# {'title': 'User', 'type': 'object', 'properties': {'name': {'type': 'string'}, ...}, 'required': ['name', 'age', 'email']}
```

**model_fields_set**: 명시적으로 설정된 필드를 추적한다.

```python
class Profile(BaseModel):
    name: str
    bio: str = "소개 없음"
    active: bool = True

profile = Profile(name="홍길동", bio="개발자")
print(profile.model_fields_set)  # {'name', 'bio'}
# 'active'는 기본값을 사용했으므로 포함되지 않음
```

## 2.2 필드 타입과 제약조건

`Field`를 사용하여 필드에 제약조건을 추가한다.

**문자열 제약**:

```python
from pydantic import Field

class Username(BaseModel):
    name: str = Field(min_length=2, max_length=20)

Username(name="홍길동")      # OK
Username(name="")            # ValidationError - min_length 위반
Username(name="a" * 21)      # ValidationError - max_length 위반
```

**숫자 범위 제약**:

```python
class Score(BaseModel):
    value: int = Field(gt=0, le=100)  # 0 초과, 100 이하

Score(value=85)    # OK
Score(value=0)     # ValidationError - gt=0 위반
Score(value=101)   # ValidationError - le=100 위반
```

**별칭 설정**: API에서 camelCase를 사용하는 경우 유용하다.

```python
class Config(BaseModel):
    debug_mode: bool = Field(default=False, alias="debugMode")

config = Config(debugMode=True)  # 별칭으로 생성
print(config.debug_mode)         # True
```

**Annotated 패턴** (Python 3.9+): 재사용 가능한 타입 별칭을 만들 수 있다.

```python
from typing import Annotated

PositiveInt = Annotated[int, Field(ge=0)]
NonEmptyStr = Annotated[str, Field(min_length=1)]

class Product(BaseModel):
    name: NonEmptyStr
    price: PositiveInt
    quantity: PositiveInt
```

**커스텀 타입**: Pydantic은 이메일, URL 등 자주 사용되는 타입을 기본 제공한다.

```python
from pydantic import EmailStr, HttpUrl

class Contact(BaseModel):
    email: EmailStr
    website: HttpUrl

Contact(email="user@example.com", website="https://example.com")  # OK
Contact(email="not-an-email", website="not-a-url")                 # ValidationError
```

> `EmailStr`을 사용하려면 `pip install pydantic[email]`이 필요하다.

**Literal 타입**: 허용되는 값을 제한할 수 있다.

```python
from typing import Literal

class Order(BaseModel):
    status: Literal["pending", "confirmed", "shipped", "delivered"]

Order(status="confirmed")    # OK
Order(status="cancelled")    # ValidationError
```

## 2.3 중첩 모델

모델 안에 다른 모델을 필드로 사용할 수 있다.

```python
class Address(BaseModel):
    city: str
    zip_code: str

class OrderItem(BaseModel):
    product: str
    quantity: int
    price: float

class Order(BaseModel):
    order_id: str
    items: list[OrderItem]
    shipping_address: Address

# dict 데이터에서 중첩 모델 자동 변환
data = {
    "order_id": "ORD-001",
    "items": [
        {"product": "노트북", "quantity": 1, "price": 1500000},
        {"product": "마우스", "quantity": 2, "price": 35000},
    ],
    "shipping_address": {"city": "서울", "zip_code": "06000"},
}

order = Order.model_validate(data)
print(order.items[0].product)           # "노트북"
print(order.shipping_address.city)      # "서울"
print(isinstance(order.items[0], OrderItem))  # True
```

**재귀 모델**: 트리 구조처럼 자기 자신을 참조하는 모델도 가능하다.

```python
from __future__ import annotations

class TreeNode(BaseModel):
    name: str
    children: list[TreeNode] = []

tree = TreeNode(
    name="root",
    children=[
        TreeNode(name="child1", children=[
            TreeNode(name="grandchild1"),
        ]),
        TreeNode(name="child2"),
    ],
)
print(tree.children[0].children[0].name)  # "grandchild1"
```

> `from __future__ import annotations`를 사용하면 전방 참조(forward reference)가 가능해진다.

# 3. Validator

## 3.1 @field_validator

`@field_validator`는 단일 필드를 검증하거나 변환하는 데 사용한다.

**mode="after"** (기본값): 타입 변환이 완료된 후 검증한다.

```python
from pydantic import field_validator

class User(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("이름은 빈 문자열일 수 없습니다")
        return v.strip()  # 양쪽 공백 제거

User(name="  홍길동  ")  # name="홍길동" (strip 적용)
User(name="   ")          # ValidationError
```

**mode="before"**: 타입 변환 전에 원본(raw) 입력값을 처리한다. 문자열 파싱 등에 유용하다.

```python
class Price(BaseModel):
    amount: float

    @field_validator("amount", mode="before")
    @classmethod
    def parse_price_string(cls, v):
        if isinstance(v, str):
            cleaned = v.replace("₩", "").replace(",", "").strip()
            return float(cleaned)
        return v

Price(amount="₩1,500,000")  # amount=1500000.0
Price(amount=99.9)            # amount=99.9
```

**여러 필드에 같은 validator 적용**:

```python
class Form(BaseModel):
    first_name: str
    last_name: str

    @field_validator("first_name", "last_name")
    @classmethod
    def capitalize_name(cls, v: str) -> str:
        return v.strip().title()

form = Form(first_name="john", last_name="doe")
print(form.first_name)  # "John"
print(form.last_name)   # "Doe"
```

## 3.2 @model_validator

`@model_validator`는 여러 필드 간 교차 검증에 사용한다.

**mode="after"**: 모든 필드 검증이 완료된 후 모델 레벨에서 검증한다.

```python
from pydantic import model_validator

class DateRange(BaseModel):
    start_date: str
    end_date: str

    @model_validator(mode="after")
    def check_date_order(self):
        if self.start_date >= self.end_date:
            raise ValueError("start_date는 end_date보다 이전이어야 합니다")
        return self

DateRange(start_date="2024-01-01", end_date="2024-12-31")  # OK
DateRange(start_date="2024-12-31", end_date="2024-01-01")  # ValidationError
```

비밀번호 확인처럼 두 필드를 비교하는 경우가 대표적이다.

```python
class PasswordChange(BaseModel):
    password: str
    password_confirm: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return self
```

**mode="wrap"**: 전체 검증 흐름을 제어할 수 있다. 입력 데이터를 변환한 후 기본 검증을 실행하는 패턴에 유용하다.

```python
class FlexibleUser(BaseModel):
    name: str
    age: int

    @model_validator(mode="wrap")
    @classmethod
    def handle_string_input(cls, values, handler):
        if isinstance(values, str):
            parts = values.split(":")
            if len(parts) == 2:
                values = {"name": parts[0], "age": int(parts[1])}
        return handler(values)

# 일반 dict 입력
FlexibleUser(name="홍길동", age=30)

# 문자열 입력 → wrap validator가 dict로 변환 후 검증
user = FlexibleUser.model_validate("김철수:25")
print(user.name)  # "김철수"
print(user.age)   # 25
```

# 4. 직렬화와 역직렬화

## 4.1 직렬화 (model_dump, model_dump_json)

**model_dump()**: 모델을 dict로 변환한다.

```python
from datetime import datetime
from pydantic import Field

class Article(BaseModel):
    title: str
    content: str
    author: str = Field(alias="authorName")
    published_at: datetime
    views: int = 0
    draft: bool = True

article = Article(
    title="Pydantic 가이드",
    content="본문...",
    authorName="홍길동",
    published_at=datetime(2024, 6, 15, 10, 30),
    views=1500,
)

# 기본 dict 변환
data = article.model_dump()
print(data["author"])    # "홍길동"
print(data["views"])     # 1500
```

**include/exclude 필터링**:

```python
# 특정 필드만 포함
article.model_dump(include={"title", "author"})
# {'title': 'Pydantic 가이드', 'author': '홍길동'}

# 특정 필드 제외
article.model_dump(exclude={"content", "draft"})
# {'title': 'Pydantic 가이드', 'author': '홍길동', 'published_at': ..., 'views': 1500}
```

**by_alias**: 별칭으로 직렬화한다. API 응답에서 camelCase를 사용할 때 유용하다.

```python
article.model_dump(by_alias=True)
# {'title': 'Pydantic 가이드', 'content': '본문...', 'authorName': '홍길동', ...}
```

**exclude_defaults**: 기본값과 같은 필드를 제외한다.

```python
article.model_dump(exclude_defaults=True)
# draft=True는 기본값이므로 제외, views=1500은 기본값(0)과 다르므로 포함
```

**model_dump_json()**: JSON 문자열로 직접 변환한다.

```python
json_str = article.model_dump_json(indent=2)
print(json_str)
# {
#   "title": "Pydantic 가이드",
#   "author": "홍길동",
#   "published_at": "2024-06-15T10:30:00",
#   ...
# }
```

**@field_serializer**: 커스텀 직렬화 로직을 정의한다.

```python
from pydantic import field_serializer

class Event(BaseModel):
    name: str
    date: datetime

    @field_serializer("date")
    def serialize_date(self, value: datetime) -> str:
        return value.strftime("%Y년 %m월 %d일")

event = Event(name="컨퍼런스", date=datetime(2024, 9, 15))
print(event.model_dump())
# {'name': '컨퍼런스', 'date': '2024년 09월 15일'}
```

## 4.2 역직렬화 (model_validate, model_validate_json)

**model_validate()**: dict → 모델로 변환한다.

```python
data = {
    "title": "FastAPI 입문",
    "content": "내용...",
    "authorName": "김개발",
    "published_at": "2024-03-10T09:00:00",
}

article = Article.model_validate(data)
print(article.author)                    # "김개발"
print(article.published_at)              # 2024-03-10 09:00:00
print(type(article.published_at))        # <class 'datetime.datetime'>
```

**model_validate_json()**: JSON 문자열 → 모델로 직접 변환한다. dict를 거치지 않아 더 효율적이다.

```python
json_str = '{"title": "테스트", "content": "본문", "authorName": "작성자", "published_at": "2024-01-01T00:00:00"}'

article = Article.model_validate_json(json_str)
print(article.title)   # "테스트"
print(article.author)  # "작성자"
```

**strict=True**: 엄격 모드에서는 자동 타입 변환이 비활성화된다.

```python
class StrictModel(BaseModel):
    count: int
    active: bool

# 일반 모드: 문자열 "123" → int 123 자동 변환
normal = StrictModel.model_validate({"count": "123", "active": "true"})
print(normal.count)  # 123

# 엄격 모드: 문자열 → int 변환 거부
StrictModel.model_validate({"count": "123", "active": True}, strict=True)
# ValidationError - count는 int여야 함
```

# 5. Settings 관리

`pydantic-settings` 패키지를 사용하면 환경변수에서 설정을 자동으로 로딩할 수 있다.

```bash
pip install pydantic-settings
```

## BaseSettings 기본

```python
from pydantic_settings import BaseSettings

class AppSettings(BaseSettings):
    app_name: str = "default"
    debug: bool = False
    port: int = 8000
```

환경변수 `APP_NAME`, `DEBUG`, `PORT`가 설정되어 있으면 자동으로 매핑된다. 필드명을 대문자로 변환한 것이 환경변수명이 된다.

```bash
export APP_NAME=MyApp
export DEBUG=true
export PORT=3000
```

```python
settings = AppSettings()
print(settings.app_name)  # "MyApp"
print(settings.debug)     # True
print(settings.port)      # 3000
```

## .env 파일 로딩

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "default"
    debug: bool = False
    secret_key: str = "no-secret"
```

`.env` 파일:

```
APP_NAME=MyApp
DEBUG=true
SECRET_KEY=super-secret-key
```

> 환경변수가 `.env` 파일보다 우선한다. 실제 환경변수가 설정되어 있으면 `.env` 파일의 값은 무시된다.

## env_prefix와 env_nested_delimiter

**env_prefix**: 모든 환경변수에 접두사를 추가한다. 여러 앱이 같은 환경에서 실행될 때 충돌을 방지한다.

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MYAPP_")

    api_key: str = "default-key"
    debug: bool = False

# MYAPP_API_KEY, MYAPP_DEBUG 환경변수를 읽음
```

**env_nested_delimiter**: 중첩 모델의 필드를 환경변수로 표현할 수 있다.

```python
from pydantic import BaseModel

class DatabaseConfig(BaseModel):
    host: str = "localhost"
    port: int = 5432

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_nested_delimiter="__",
    )

    db: DatabaseConfig = DatabaseConfig()
```

```bash
export APP_DB__HOST=db.prod.com
export APP_DB__PORT=5433
```

```python
settings = Settings()
print(settings.db.host)  # "db.prod.com"
print(settings.db.port)  # 5433
```

## 다중 환경 설정 패턴

dev/staging/prod 환경별로 다른 `.env` 파일을 사용할 수 있다.

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.dev")

    database_url: str = "sqlite:///default.db"
    debug: bool = False

class ProdSettings(Settings):
    model_config = SettingsConfigDict(env_file=".env.prod")
```

# 6. 실전 활용

## 6.1 Pydantic + FastAPI 통합

FastAPI는 Pydantic을 핵심 의존성으로 사용한다. 요청/응답 모델을 분리하는 것이 대표적인 패턴이다.

```python
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field

# 요청 모델 - 회원가입
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

# 응답 모델 - password 제외
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

app = FastAPI()

@app.post("/users", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate):
    user_data = {
        "id": 1,
        "name": user.name,
        "email": user.email,
        "password": user.password,    # DB에 저장
        "created_at": datetime.now(),
    }
    return user_data  # response_model이 password를 자동 제외
```

**핵심 포인트**:
- `UserCreate`: 클라이언트가 보내는 데이터 (password 포함)
- `UserResponse`: 클라이언트에게 보내는 데이터 (password 제외)
- `response_model=UserResponse`가 응답에서 자동으로 불필요한 필드를 제거
- Swagger/ReDoc에서 자동으로 API 문서가 생성됨

## 6.2 성능 참고

Pydantic v2는 Rust 기반 `pydantic-core`를 사용하여 v1 대비 크게 성능이 향상되었다. 공식 벤치마크에 따르면:

| 작업 | v1 → v2 개선 |
|------|-------------|
| 모델 검증 | 약 5~17배 빠름 |
| JSON 직렬화 | 약 2~10배 빠름 |
| JSON 파싱 | 약 4~12배 빠름 |

> 정확한 수치는 모델 복잡도와 데이터 크기에 따라 달라진다. 자세한 내용은 [Pydantic v2 공식 문서](https://docs.pydantic.dev/latest/)를 참고한다.

# 7. 마무리

Pydantic v2의 핵심 기능을 정리하면 다음과 같다.

| 기능 | 핵심 API |
|------|---------|
| 모델 정의 | `BaseModel`, `Field`, `Annotated` |
| 검증 | `@field_validator`, `@model_validator` |
| 직렬화 | `model_dump()`, `model_dump_json()`, `@field_serializer` |
| 역직렬화 | `model_validate()`, `model_validate_json()` |
| 설정 관리 | `BaseSettings`, `SettingsConfigDict` |

Pydantic은 단순한 데이터 검증을 넘어, Python 생태계에서 타입 안전성을 확보하는 핵심 도구로 자리잡았다. FastAPI와 함께 사용하면 API 개발 생산성을 크게 높일 수 있다.

전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/pydantic)에서 확인할 수 있다.

## 참고

- [Pydantic v2 공식 문서](https://docs.pydantic.dev/latest/)
- [Pydantic v2 마이그레이션 가이드](https://docs.pydantic.dev/latest/migration/)
- [pydantic-settings 문서](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
