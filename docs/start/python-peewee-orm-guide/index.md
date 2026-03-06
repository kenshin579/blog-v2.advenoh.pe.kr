---
title: "Peewee ORM 실전 가이드 - 모델 정의부터 FastAPI 연동까지"
description: "경량 ORM Peewee의 모델 정의, CRUD, 쿼리 빌더, 트랜잭션, FastAPI 연동까지 실전 예제로 배우기"
date: 2026-03-06
tags:
  - Python
  - Peewee
  - ORM
  - FastAPI
  - Database
series: "FastAPI 풀스택 개발"
---

# 1. 개요

Peewee는 **경량**, **단순**, **명시적**이라는 설계 철학을 가진 Python ORM이다. SQLAlchemy가 엔터프라이즈급 추상화를 제공한다면, Peewee는 최소한의 코드로 데이터베이스 작업을 직관적으로 처리할 수 있도록 설계되었다.

## 1.1 SQLAlchemy vs Peewee 비교

| 항목 | SQLAlchemy | Peewee |
|------|-----------|--------|
| 규모 | 대규모 (Core + ORM) | 경량 (단일 파일 가능) |
| 추상화 수준 | Unit of Work, Identity Map | Active Record |
| 학습 곡선 | 높음 | 낮음 |
| 비동기 지원 | `asyncio` 네이티브 (2.0+) | `playhouse.shortcuts` 통해 제한적 |
| 마이그레이션 | Alembic (별도 패키지) | peewee-migrate (별도 패키지) |
| 커뮤니티 | 매우 큼 | 중간 |
| 지원 DB | SQLite, PostgreSQL, MySQL, Oracle 등 | SQLite, PostgreSQL, MySQL |

## 1.2 Peewee가 적합한 경우

- 소규모 프로젝트, 프로토타이핑
- 교육 목적으로 ORM 개념 학습
- SQLite 기반 로컬 애플리케이션
- 복잡한 설정 없이 빠르게 DB 연동이 필요한 경우

# 2. 모델 정의와 관계 설정

## 2.1 모델 정의

Peewee에서 모델은 `Model` 클래스를 상속받아 정의한다. `Meta` 클래스에서 데이터베이스 연결을 지정한다.

```python
import datetime
from peewee import *

db = SqliteDatabase("app.db", pragmas={"journal_mode": "wal", "foreign_keys": 1})

class BaseModel(Model):
    class Meta:
        database = db

class User(BaseModel):
    id = AutoField()
    username = CharField(unique=True, max_length=50)
    email = CharField(unique=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.datetime.now)

    class Meta:
        table_name = "users"
```

### 주요 Field 타입

| Field | 설명 | SQL 타입 |
|-------|------|----------|
| `AutoField` | 자동 증가 PK | INTEGER PRIMARY KEY |
| `CharField` | 문자열 (max_length 지정) | VARCHAR |
| `TextField` | 긴 텍스트 | TEXT |
| `IntegerField` | 정수 | INTEGER |
| `BooleanField` | 불리언 | BOOLEAN |
| `DateTimeField` | 날짜/시간 | DATETIME |
| `UUIDField` | UUID | UUID/VARCHAR |

### 주요 제약조건

- `unique=True` - 유니크 제약
- `null=True` - NULL 허용 (기본값은 NOT NULL)
- `default=value` - 기본값 지정
- `max_length=50` - 최대 길이 (CharField)

## 2.2 관계 설정

### 1:N 관계 (ForeignKeyField)

```python
class Post(BaseModel):
    id = AutoField()
    title = CharField(max_length=200)
    content = TextField()
    published = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.datetime.now)
    author = ForeignKeyField(User, backref="posts", on_delete="CASCADE")

    class Meta:
        table_name = "posts"
```

`backref="posts"`를 지정하면 `user.posts`로 역참조할 수 있다.

```python
# 사용자의 모든 글 조회
user = User.get(User.username == "alice")
for post in user.posts:
    print(post.title)
```

### N:M 관계 - 수동 중간 테이블

```python
class Tag(BaseModel):
    id = AutoField()
    name = CharField(unique=True, max_length=50)

class PostTag(BaseModel):
    post = ForeignKeyField(Post, backref="post_tags", on_delete="CASCADE")
    tag = ForeignKeyField(Tag, backref="post_tags", on_delete="CASCADE")

    class Meta:
        table_name = "post_tags"
        primary_key = False
        indexes = ((("post", "tag"), True),)  # unique together
```

### N:M 관계 - ManyToManyField

`ManyToManyField`를 사용하면 중간 테이블을 자동 생성할 수 있다. 더 간결하지만 커스터마이징은 제한적이다.

```python
class Article(BaseModel):
    id = AutoField()
    title = CharField(max_length=200)
    tags = ManyToManyField(Tag, backref="articles")

ArticleTag = Article.tags.get_through_model()

# 테이블 생성 시 중간 테이블도 포함
db.create_tables([Article, Tag, ArticleTag])
```

```python
# 태그 추가/제거
article = Article.create(title="Peewee Guide")
python_tag = Tag.create(name="Python")

article.tags.add(python_tag)           # 태그 추가
article.tags.remove(python_tag)        # 태그 제거
print(article.tags.count())            # 태그 수 조회
```

### prefetch()로 N+1 문제 방지

```python
from peewee import prefetch

users = User.select()
posts = Post.select()
users_with_posts = prefetch(users, posts)

for user in users_with_posts:
    print(f"{user.username}: {[p.title for p in user.posts]}")
```

`prefetch()`는 2개의 쿼리만 실행한다 (사용자 목록 1회 + 글 목록 1회). `user.posts`를 루프 안에서 매번 호출하면 N+1 문제가 발생하므로 `prefetch()`를 사용하자.

# 3. CRUD와 쿼리

## 3.1 CRUD 연산

### Create

```python
# 단건 생성
user = User.create(username="alice", email="alice@example.com")

# 다건 생성 (insert_many)
users = [
    {"username": "bob", "email": "bob@example.com"},
    {"username": "charlie", "email": "charlie@example.com"},
]
User.insert_many(users).execute()
```

### Read

```python
# PK로 조회
user = User.get_by_id(1)

# 조건 조회
active_users = User.select().where(User.is_active == True)
for user in active_users:
    print(user.username)
```

### Update

```python
# 인스턴스 수정 후 save()
user = User.get_by_id(1)
user.email = "new@example.com"
user.save()

# 벌크 업데이트
rows = User.update(is_active=False).where(User.username == "bob").execute()
```

### Delete

```python
# 단건 삭제
user = User.get_by_id(1)
user.delete_instance()

# 벌크 삭제
rows = User.delete().where(User.is_active == False).execute()
```

### get_or_create

```python
# 있으면 조회, 없으면 생성
user, created = User.get_or_create(
    username="alice",
    defaults={"email": "alice@example.com"},
)
print(f"created={created}")  # True: 새로 생성, False: 기존 조회
```

## 3.2 쿼리 빌더

### 체이닝

```python
posts = (
    Post.select()
    .where(Post.published == True)
    .order_by(Post.created_at.desc())
    .limit(3)
)
```

### JOIN

```python
# 명시적 JOIN
query = (
    Post.select(Post, User)
    .join(User)
    .where(User.username == "alice")
)
for post in query:
    print(f"{post.title} by {post.author.username}")
```

### 집계 함수

```python
from peewee import fn

# 사용자별 글 수
query = (
    User.select(User.username, fn.COUNT(Post.id).alias("post_count"))
    .join(Post)
    .group_by(User.username)
)
for row in query:
    print(f"{row.username}: {row.post_count}개")
```

### group_by + having

```python
# 글이 3개 이상인 사용자만 조회
query = (
    User.select(User.username, fn.COUNT(Post.id).alias("post_count"))
    .join(Post)
    .group_by(User.username)
    .having(fn.COUNT(Post.id) > 3)
)
```

### 결과 형식

```python
# 딕셔너리로 받기
rows = User.select().dicts()
# [{'id': 1, 'username': 'alice', 'email': 'alice@example.com', ...}]

# 튜플로 받기
rows = User.select().tuples()
# [(1, 'alice', 'alice@example.com', ...)]

# 네임드 튜플로 받기
rows = User.select().namedtuples()
# [Row(id=1, username='alice', email='alice@example.com', ...)]
```

# 4. DB 연결과 운영

## 4.1 데이터베이스 연결

### SQLite

```python
db = SqliteDatabase("app.db", pragmas={
    "journal_mode": "wal",
    "foreign_keys": 1,
})
```

### PostgreSQL

```python
db = PostgresqlDatabase(
    "mydb",
    user="postgres",
    password="secret",
    host="localhost",
    port=5432,
)
```

### MySQL

```python
db = MySQLDatabase(
    "mydb",
    user="root",
    password="secret",
    host="localhost",
    port=3306,
)
```

### 커넥션 풀링

```python
from playhouse.pool import PooledPostgresqlDatabase

db = PooledPostgresqlDatabase(
    "mydb",
    user="postgres",
    max_connections=20,
    stale_timeout=300,  # 5분
)
```

## 4.2 트랜잭션 관리

### db.atomic() context manager

```python
with db.atomic():
    User.create(username="alice", email="alice@example.com")
    User.create(username="bob", email="bob@example.com")
# 블록 정상 종료 시 자동 COMMIT, 예외 발생 시 ROLLBACK
```

### 중첩 트랜잭션 (savepoint)

```python
with db.atomic() as outer:
    User.create(username="dave", email="dave@example.com")

    try:
        with db.atomic() as inner:
            User.create(username="eve", email="eve@example.com")
            raise IntegrityError("내부 트랜잭션 롤백")
    except IntegrityError:
        pass  # inner savepoint만 롤백

# dave는 저장됨, eve는 롤백됨
```

### @db.atomic() 데코레이터

```python
@db.atomic()
def create_user_atomic(username: str, email: str):
    return User.create(username=username, email=email)
```

## 4.3 마이그레이션 (peewee-migrate)

```bash
pip install peewee-migrate
```

```python
from peewee_migrate import Router

router = Router(db, migrate_dir="migrations")

# 마이그레이션 자동 생성
router.create("add_user_table", auto=["myapp.models"])

# 마이그레이션 실행
router.run()

# 롤백
router.rollback()
```

| 항목 | peewee-migrate | Alembic (SQLAlchemy) |
|------|---------------|---------------------|
| 자동 생성 | `auto` 파라미터 | `--autogenerate` |
| 실행 | `router.run()` | `alembic upgrade head` |
| 롤백 | `router.rollback()` | `alembic downgrade -1` |
| 설정 | Python 코드만 | `alembic.ini` + `env.py` |

# 5. FastAPI 연동 패턴

## 5.1 DB 의존성 주입

```python
from fastapi import Depends, FastAPI

def get_db():
    if db.is_closed():
        db.connect()
    try:
        yield db
    finally:
        if not db.is_closed():
            db.close()

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int, _db=Depends(get_db)):
    try:
        user = User.get_by_id(user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    return model_to_dict(user, exclude=[User.created_at])
```

## 5.2 Peewee -> Pydantic 변환

`playhouse.shortcuts.model_to_dict()`를 사용하면 Peewee 모델 인스턴스를 딕셔너리로 변환할 수 있다. FastAPI는 딕셔너리를 자동으로 Pydantic 모델에 매핑한다.

```python
from playhouse.shortcuts import model_to_dict
from pydantic import BaseModel as PydanticBase

class UserResponse(PydanticBase):
    id: int
    username: str
    email: str
    is_active: bool

@app.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate, _db=Depends(get_db)):
    user = User.create(username=user_data.username, email=user_data.email)
    return model_to_dict(user, exclude=[User.created_at])
```

## 5.3 미들웨어로 DB 연결 관리

```python
@app.middleware("http")
async def db_session_middleware(request, call_next):
    if db.is_closed():
        db.connect(reuse_if_open=True)
    try:
        response = await call_next(request)
    finally:
        if not db.is_closed():
            db.close()
    return response
```

미들웨어 방식을 사용하면 각 엔드포인트에서 `Depends(get_db)`를 명시하지 않아도 된다. 프로젝트 규모에 따라 선택하면 된다.

# 6. 마무리

Peewee는 **적은 코드로 데이터베이스 작업을 직관적으로 처리**할 수 있는 경량 ORM이다. Active Record 패턴 기반으로 모델 정의부터 CRUD, 쿼리 빌더, 트랜잭션까지 일관된 API를 제공한다.

핵심 정리:
- **모델 정의**: `Model` 상속 + `Meta` 클래스로 DB 연결
- **관계**: `ForeignKeyField` (1:N), `ManyToManyField` (N:M)
- **N+1 방지**: `prefetch()` 사용
- **트랜잭션**: `db.atomic()` context manager / 데코레이터
- **FastAPI 연동**: `Depends(get_db)` + `model_to_dict()`

소규모 프로젝트나 프로토타이핑에서 빠르게 DB 연동이 필요하다면 Peewee를 고려해보자. 복잡한 비동기 처리나 대규모 엔터프라이즈 환경에서는 SQLAlchemy가 더 적합할 수 있다.

# 7. 참고

- [Peewee 공식 문서](https://docs.peewee-orm.com/)
- [Peewee GitHub](https://github.com/coleifer/peewee)
- [peewee-migrate GitHub](https://github.com/klen/peewee_migrate)
- [샘플 코드 - GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/peewee)
