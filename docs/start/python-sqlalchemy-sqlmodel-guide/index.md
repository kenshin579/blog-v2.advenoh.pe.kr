---
title: "SQLAlchemy 2.0 + SQLModel 완벽 가이드 - ORM부터 FastAPI 통합까지"
description: "SQLAlchemy 2.0 + SQLModel 완벽 가이드 - 선언적 매핑, CRUD, 관계 설정, Alembic, FastAPI 통합"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - sqlalchemy
  - sqlmodel
  - fastapi
  - orm
  - 파이썬
  - 데이터베이스
series: "FastAPI 풀스택 개발"
---

# 1. SQLAlchemy 2.0 기초

## 1.1 2.0 주요 변경점

SQLAlchemy 2.0은 내부 구조를 현대화하고, 타입 힌트를 본격적으로 도입했다.

| 항목 | 1.x 스타일 | 2.0 스타일 |
|------|-----------|-----------|
| 쿼리 | `session.query(User).filter(...)` | `session.execute(select(User).where(...))` |
| 컬럼 정의 | `Column(Integer, primary_key=True)` | `mapped_column(primary_key=True)` |
| 타입 | `Column(String)` | `Mapped[str]` |
| Base 클래스 | `declarative_base()` | `class Base(DeclarativeBase): pass` |
| 세션 | `session.query()` | `session.execute(select())` |

1.4 버전에서 `future=True` 플래그로 점진적 마이그레이션이 가능했고, 2.0부터는 새로운 스타일이 기본이다.

## 1.2 선언적 매핑 (DeclarativeBase, Mapped, mapped_column)

`DeclarativeBase`를 상속하여 Base 클래스를 정의하고, `Mapped[T]`와 `mapped_column()`으로 컬럼을 선언한다.

```python
from typing import Optional
from sqlalchemy import String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(100), unique=True)
    bio: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    active: Mapped[bool] = mapped_column(default=True)
```

**핵심 포인트:**
- `Mapped[str]` → NOT NULL 컬럼
- `Mapped[Optional[str]]` → nullable 컬럼
- `mapped_column(primary_key=True)` → PK 설정
- `__tablename__` → 테이블명 지정

**테이블 생성:**

```python
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)  # 모든 테이블 생성
```

# 2. 세션 관리와 CRUD

## 2.1 세션 관리

세션은 데이터베이스와의 대화를 관리하는 객체다. 컨텍스트 매니저 패턴을 사용하면 자동으로 정리된다.

```python
from sqlalchemy.orm import Session

# 컨텍스트 매니저 패턴 (권장)
with Session(engine) as session:
    # 작업 수행
    session.commit()
```

**sessionmaker 팩토리:** 세션 설정을 재사용할 때 유용하다.

```python
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=engine)

with SessionLocal() as session:
    # 작업 수행
    pass
```

## 2.2 CRUD 패턴

### Create

```python
with Session(engine) as session:
    # 단일 레코드
    user = User(name="홍길동", email="hong@example.com", age=30)
    session.add(user)
    session.commit()

    # 여러 레코드
    users = [
        User(name="김철수", email="kim@example.com"),
        User(name="이영희", email="lee@example.com"),
    ]
    session.add_all(users)
    session.commit()
```

### Read

```python
from sqlalchemy import select

with Session(engine) as session:
    # 조건 조회 - select().where()
    stmt = select(User).where(User.name == "홍길동")
    user = session.execute(stmt).scalars().first()

    # PK로 조회 - session.get()
    user = session.get(User, 1)

    # 여러 조건 + 정렬
    stmt = select(User).where(User.age >= 30).order_by(User.age)
    users = session.execute(stmt).scalars().all()
```

### Update

```python
with Session(engine) as session:
    user = session.get(User, user_id)
    user.name = "홍길동(수정)"  # 속성 직접 변경
    user.age = 31
    session.commit()  # 변경 사항 자동 감지 후 UPDATE
```

### Delete

```python
with Session(engine) as session:
    user = session.get(User, user_id)
    session.delete(user)
    session.commit()
```

### flush vs commit

```python
with Session(engine) as session:
    user = User(name="홍길동", email="hong@example.com")
    session.add(user)

    session.flush()     # SQL 실행 (INSERT) → ID 할당, 하지만 트랜잭션은 유지
    print(user.id)      # ID가 할당됨

    session.rollback()  # flush된 내용도 롤백됨!
```

- `flush()`: SQL을 DB에 보내지만 트랜잭션은 열려 있음 → rollback 가능
- `commit()`: 트랜잭션을 확정 → 되돌릴 수 없음

## 2.3 비동기 세션 (AsyncSession)

`aiosqlite` 드라이버와 `AsyncSession`을 사용하면 비동기 CRUD가 가능하다.

```bash
pip install aiosqlite greenlet
```

```python
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))

# 비동기 엔진
engine = create_async_engine("sqlite+aiosqlite:///:memory:")

# 테이블 생성
async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)

# 비동기 CRUD
async with AsyncSession(engine) as session:
    user = User(name="홍길동")
    session.add(user)
    await session.commit()
    await session.refresh(user)  # commit 후 속성 접근 전 반드시 refresh
    print(user.id)
```

> **주의:** 비동기 세션에서 `commit()` 후 객체의 속성에 접근하면 expired 상태라 동기 IO가 발생한다. `await session.refresh(obj)`로 명시적으로 갱신해야 한다.

# 3. 관계 설정과 마이그레이션

## 3.1 관계 설정

### 1:N 관계 (Author ↔ Book)

```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Author(Base):
    __tablename__ = "authors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    books: Mapped[list["Book"]] = relationship(back_populates="author")

class Book(Base):
    __tablename__ = "books"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100))
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"))
    author: Mapped["Author"] = relationship(back_populates="books")
```

```python
# 관계를 통한 생성
with Session(engine) as session:
    author = Author(name="김작가")
    author.books.append(Book(title="파이썬 입문"))
    author.books.append(Book(title="파이썬 심화"))
    session.add(author)
    session.commit()

# 양방향 접근
with Session(engine) as session:
    book = session.execute(select(Book).where(Book.title == "파이썬 입문")).scalars().first()
    print(book.author.name)        # "김작가" (Book → Author)
    print(book.author.books)       # [Book(...), Book(...)] (Author → Books)
```

**back_populates vs backref:**
- `back_populates`: 양쪽 모델에 명시적으로 선언 (권장)
- `backref`: 한쪽에만 선언하면 반대쪽 자동 생성 (레거시)

### N:M 관계 (Student ↔ Course)

association table을 사용한다.

```python
from sqlalchemy import Column, Table

student_course = Table(
    "student_course",
    Base.metadata,
    Column("student_id", ForeignKey("students.id"), primary_key=True),
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
)

class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    courses: Mapped[list["Course"]] = relationship(
        secondary=student_course, back_populates="students"
    )

class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100))
    students: Mapped[list["Student"]] = relationship(
        secondary=student_course, back_populates="courses"
    )
```

```python
with Session(engine) as session:
    python = Course(title="Python 기초")
    fastapi = Course(title="FastAPI 개발")

    student = Student(name="홍길동", courses=[python, fastapi])
    session.add(student)
    session.commit()

# 양방향 조회
hong = session.execute(select(Student).where(Student.name == "홍길동")).scalars().first()
print(len(hong.courses))          # 2

python = session.execute(select(Course).where(Course.title == "Python 기초")).scalars().first()
print(len(python.students))       # 1
```

### Lazy Loading 전략

| 전략 | 설명 | 사용 시점 |
|------|------|---------|
| `lazy="select"` (기본) | 관계 접근 시 별도 SELECT | 소규모 데이터 |
| `lazy="joined"` | LEFT JOIN으로 즉시 로딩 | 항상 함께 조회하는 관계 |
| `lazy="selectin"` | SELECT IN으로 즉시 로딩 | 컬렉션 관계 |

쿼리 단위로 eager loading을 적용하려면 `options()`를 사용한다:

```python
from sqlalchemy.orm import selectinload, joinedload

# selectinload: SELECT IN 쿼리 (2번 쿼리)
stmt = select(Author).options(selectinload(Author.books))

# joinedload: LEFT JOIN (1번 쿼리)
stmt = select(Author).options(joinedload(Author.books))
```

## 3.2 마이그레이션 (Alembic)

Alembic은 SQLAlchemy의 공식 마이그레이션 도구다.

```bash
# 초기화
alembic init migrations

# 마이그레이션 생성 (모델 변경 감지)
alembic revision --autogenerate -m "add users table"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1

# 현재 버전 확인
alembic current
```

**env.py 설정:** Alembic이 모델 메타데이터를 인식할 수 있도록 설정한다.

```python
# migrations/env.py
from myapp.models import Base

target_metadata = Base.metadata
```

**autogenerate**가 감지하는 변경 사항:
- 테이블 추가/삭제
- 컬럼 추가/삭제/타입 변경
- 인덱스, 유니크 제약 변경

# 4. SQLModel과 FastAPI 통합

## 4.1 SQLModel 소개

SQLModel은 Pydantic과 SQLAlchemy를 하나로 합친 라이브러리다. 하나의 클래스로 API 스키마와 DB 모델을 동시에 정의할 수 있다.

```bash
pip install sqlmodel
```

```python
from sqlmodel import Field, SQLModel

# DB 테이블 모델 (table=True)
class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    secret_name: str
    age: int | None = Field(default=None, index=True)

# 데이터 전용 모델 (table=False, 기본값)
class HeroCreate(SQLModel):
    name: str
    secret_name: str
    age: int | None = None

class HeroResponse(SQLModel):
    id: int
    name: str
    age: int | None = None
```

**핵심 차이:**
- `table=True`: DB 테이블에 매핑되는 모델
- `table=False` (기본): Pydantic 모델처럼 동작 (검증, 직렬화)

**모델 간 변환:**

```python
from sqlmodel import Session

# 데이터 모델 → DB 모델
hero_create = HeroCreate(name="스파이더맨", secret_name="피터 파커")
hero = Hero.model_validate(hero_create)

# DB 모델 → 응답 모델
response = HeroResponse.model_validate(hero)
```

**부분 업데이트 패턴:**

```python
class HeroUpdate(SQLModel):
    name: str | None = None
    secret_name: str | None = None
    age: int | None = None

# exclude_unset=True: 명시적으로 설정된 값만 업데이트
update_data = HeroUpdate(name="슈퍼맨(수정)")
hero_data = update_data.model_dump(exclude_unset=True)  # {"name": "슈퍼맨(수정)"}
hero.sqlmodel_update(hero_data)
```

## 4.2 SQLModel로 FastAPI 엔드포인트 구현

### 세션 의존성 주입

```python
from fastapi import Depends, FastAPI
from sqlmodel import Session, create_engine

engine = create_engine("sqlite:///database.db")

def get_session():
    with Session(engine) as session:
        yield session

app = FastAPI()
```

### CRUD API 전체 예시

```python
from fastapi import HTTPException, Query
from sqlmodel import select

@app.post("/heroes", response_model=HeroPublic, status_code=201)
def create_hero(*, session: Session = Depends(get_session), hero: HeroCreate):
    db_hero = Hero.model_validate(hero)
    session.add(db_hero)
    session.commit()
    session.refresh(db_hero)
    return db_hero

@app.get("/heroes", response_model=list[HeroPublic])
def read_heroes(
    *,
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    heroes = session.exec(select(Hero).offset(offset).limit(limit)).all()
    return heroes

@app.get("/heroes/{hero_id}", response_model=HeroPublic)
def read_hero(*, session: Session = Depends(get_session), hero_id: int):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="히어로를 찾을 수 없습니다")
    return hero

@app.patch("/heroes/{hero_id}", response_model=HeroPublic)
def update_hero(
    *, session: Session = Depends(get_session), hero_id: int, hero: HeroUpdate
):
    db_hero = session.get(Hero, hero_id)
    if not db_hero:
        raise HTTPException(status_code=404, detail="히어로를 찾을 수 없습니다")
    hero_data = hero.model_dump(exclude_unset=True)
    db_hero.sqlmodel_update(hero_data)
    session.add(db_hero)
    session.commit()
    session.refresh(db_hero)
    return db_hero

@app.delete("/heroes/{hero_id}")
def delete_hero(*, session: Session = Depends(get_session), hero_id: int):
    hero = session.get(Hero, hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="히어로를 찾을 수 없습니다")
    session.delete(hero)
    session.commit()
    return {"ok": True}
```

**SQLModel의 장단점:**

| 장점 | 단점 |
|------|------|
| 하나의 클래스로 API + DB 모델 | SQLAlchemy 고급 기능 일부 미지원 |
| Pydantic 검증 내장 | relationship 설정이 복잡할 수 있음 |
| FastAPI와 완벽한 통합 | 대규모 프로젝트에서는 순수 SQLAlchemy 선호 |
| 코드 중복 감소 | SQLAlchemy 버전 의존성 |

# 5. 성능 최적화

## 5.1 N+1 문제

N+1 문제는 ORM에서 가장 흔한 성능 이슈다. 목록을 조회한 후 각 항목의 관계 데이터에 접근할 때 추가 쿼리가 발생한다.

```python
# N+1 문제 발생!
with Session(engine) as session:
    depts = session.execute(select(Department)).scalars().all()  # 1번 쿼리

    for dept in depts:
        print(dept.employees)  # 각 부서마다 추가 쿼리 → N번!
# 총 1 + N번 쿼리 실행
```

### 해결: Eager Loading

```python
from sqlalchemy.orm import selectinload, joinedload

# selectinload: SELECT ... WHERE id IN (...) 쿼리 (2번)
stmt = select(Department).options(selectinload(Department.employees))
depts = session.execute(stmt).scalars().all()
# → 2번 쿼리로 모든 데이터 로딩

# joinedload: LEFT JOIN (1번)
stmt = select(Department).options(joinedload(Department.employees))
depts = session.execute(stmt).unique().scalars().all()
# → 1번 JOIN 쿼리로 모든 데이터 로딩
```

| 방법 | 쿼리 수 | 적합한 상황 |
|------|--------|-----------|
| lazy (기본) | 1 + N | 관계 데이터에 접근하지 않는 경우 |
| selectinload | 2 | 컬렉션 관계 (1:N) |
| joinedload | 1 | 단일 관계 (N:1), 소규모 데이터 |

## 5.2 SQL 로그 확인

`echo=True`로 실행되는 SQL을 확인할 수 있다. 개발 중 N+1 문제를 발견하는 데 유용하다.

```python
engine = create_engine("sqlite:///mydb.db", echo=True)
# 모든 SQL 쿼리가 로그에 출력됨
```

# 6. 마무리

SQLAlchemy 2.0의 핵심 기능을 정리하면 다음과 같다.

| 기능 | 핵심 API |
|------|---------|
| 모델 정의 | `DeclarativeBase`, `Mapped[T]`, `mapped_column()` |
| 세션 | `Session`, `AsyncSession`, `sessionmaker` |
| CRUD | `session.add()`, `select().where()`, `session.get()`, `session.delete()` |
| 관계 | `relationship()`, `ForeignKey`, `back_populates` |
| 마이그레이션 | Alembic (`revision`, `upgrade`, `downgrade`) |
| FastAPI 통합 | SQLModel, `Depends(get_session)` |
| 성능 | `selectinload()`, `joinedload()`, `echo=True` |

SQLAlchemy 2.0은 타입 힌트를 통해 코드 가독성과 IDE 지원을 크게 개선했다. SQLModel과 함께 사용하면 FastAPI 프로젝트에서 데이터베이스 작업을 간결하게 처리할 수 있다.

전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/sqlalchemy)에서 확인할 수 있다.

## 참고

- [SQLAlchemy 2.0 공식 문서](https://docs.sqlalchemy.org/en/20/)
- [SQLModel 공식 문서](https://sqlmodel.tiangolo.com/)
- [Alembic 문서](https://alembic.sqlalchemy.org/en/latest/)
