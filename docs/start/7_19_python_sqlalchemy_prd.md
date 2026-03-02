# PRD: SQLAlchemy 2.0 + SQLModel

## 개요
SQLAlchemy 2.0 ORM과 SQLModel로 FastAPI 통합까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 7-2
- **난이도**: 중-고급
- **우선순위**: ★★☆

## 다룰 내용
1. SQLAlchemy 2.0 주요 변경점 (1.x → 2.0)
   - 쿼리 API 변경: `session.query()` → `select()` 문 스타일
   - 타입 힌트 통합: `Mapped[T]`, `mapped_column()`
   - `create_engine()` → `engine.begin()` 컨텍스트 매니저
   - 호환성: `future=True` 플래그로 점진적 마이그레이션
2. 선언적 매핑 (DeclarativeBase, Mapped, mapped_column)
   - `class Base(DeclarativeBase): pass` 기본 설정
   - `Mapped[int]`, `Mapped[str | None]`: 타입 힌트 기반 컬럼 정의
   - `mapped_column(primary_key=True)`, `mapped_column(String(100))`
   - `__tablename__` 설정과 테이블 자동 생성
3. 세션 관리 (Session, async_session)
   - `Session(engine)`: 동기 세션 기본 사용법
   - `with Session(engine) as session:` 컨텍스트 매니저 패턴
   - `sessionmaker`, `scoped_session`: 세션 팩토리
   - `async_session`: asyncio 환경 (asyncpg/aiosqlite 드라이버)
   - `async with AsyncSession(engine) as session:` 패턴
4. CRUD 패턴
   - Create: `session.add(obj)`, `session.add_all([...])`
   - Read: `session.execute(select(Model).where(...))`, `session.get(Model, id)`
   - Update: 객체 속성 변경 후 `session.commit()`
   - Delete: `session.delete(obj)` 또는 bulk delete
   - `session.flush()` vs `session.commit()` 차이
5. 관계 설정 (1:N, N:M)
   - 1:N: `relationship()` + `ForeignKey` 설정
   - N:M: association table 또는 association object 패턴
   - `back_populates` vs `backref` 차이
   - lazy loading 전략: `lazy="select"`, `lazy="joined"`, `lazy="selectin"`
6. 마이그레이션 (Alembic)
   - `alembic init migrations`: 초기 설정
   - `alembic revision --autogenerate -m "message"`: 자동 마이그레이션 생성
   - `alembic upgrade head` / `alembic downgrade -1`
   - `env.py` 설정과 비동기 마이그레이션
7. SQLModel 소개 (Pydantic + SQLAlchemy 통합)
   - `SQLModel` = `BaseModel` + `DeclarativeBase` 통합
   - `table=True`: 테이블 모델 vs 일반 데이터 모델
   - 하나의 클래스로 API 스키마 + DB 모델 동시 정의
   - SQLModel의 제약사항과 한계
8. SQLModel로 FastAPI 엔드포인트 구현
   - 요청/응답 모델과 DB 모델 분리 전략
   - `Depends(get_session)`: 의존성 주입으로 세션 관리
   - CRUD API 엔드포인트 전체 예시
9. 성능 팁
   - N+1 문제: lazy loading이 일으키는 쿼리 폭발
   - `selectinload()`, `joinedload()`: eager loading 적용
   - `echo=True`로 실행된 SQL 로그 확인
   - bulk 연산: `session.bulk_save_objects()` vs `insert().values([...])`

## 샘플 코드
- `tutorials-python/python/sqlalchemy/`

## 참고
- https://docs.sqlalchemy.org/en/20/
- https://sqlmodel.tiangolo.com/
