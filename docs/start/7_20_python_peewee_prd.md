# PRD: Peewee ORM 실전 가이드

## 개요
경량 ORM Peewee의 모델 정의부터 FastAPI 연동까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 7-3
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용
1. Peewee란? (SQLAlchemy vs Peewee 비교 관점)
   - Peewee의 설계 철학: 경량, 단순, 명시적
   - SQLAlchemy와의 차이: ORM 규모, 추상화 수준, 학습 곡선
   - 기능 비교표: 비동기 지원, 마이그레이션, 커뮤니티 생태계
   - Peewee가 적합한 경우: 소규모 프로젝트, 프로토타이핑, 교육 목적
2. 모델 정의 (Field 타입, 제약조건)
   - `class User(Model):` 기본 구조와 `Meta` 클래스
   - 주요 Field: `CharField`, `IntegerField`, `DateTimeField`, `BooleanField`
   - 제약조건: `unique=True`, `null=True`, `default=value`
   - `AutoField` (PK 자동 생성), `UUIDField`
3. CRUD 연산
   - Create: `Model.create(**data)`, `Model.insert_many(rows)`
   - Read: `Model.get_by_id(id)`, `Model.select().where(...)`
   - Update: `instance.save()`, `Model.update({...}).where(...)`
   - Delete: `instance.delete_instance()`, `Model.delete().where(...)`
   - `get_or_create()`, `create_or_get()` 편의 메서드
4. 관계 설정 (ForeignKeyField, ManyToManyField)
   - 1:N: `ForeignKeyField(Model, backref="items")`
   - N:M: `ManyToManyField(Model, backref="tags")`
   - N:M through 모델: 중간 테이블 커스터마이징
   - `prefetch()`: N+1 문제 방지
5. 쿼리 빌더
   - `select()`, `where()`, `order_by()`, `limit()` 체이닝
   - `join()`: 명시적 JOIN 쿼리
   - `fn.COUNT()`, `fn.SUM()`: 집계 함수
   - `.group_by()`, `.having()`: 그룹핑
   - `.dicts()`, `.tuples()`, `.namedtuples()`: 결과 형식 지정
6. 마이그레이션 (peewee-migrate)
   - `peewee-migrate` 패키지 설치 및 기본 사용법
   - 마이그레이션 파일 자동 생성
   - `migrate()` / `rollback()` 명령
   - SQLAlchemy Alembic과의 비교
7. 트랜잭션 관리
   - `db.atomic()`: context manager 패턴
   - 중첩 트랜잭션: savepoint 지원
   - `@db.atomic()` 데코레이터 패턴
8. FastAPI 연동 패턴
   - `Depends(get_db)`: 요청별 DB 연결 관리
   - Peewee → Pydantic 모델 변환 (`model_to_dict()`)
   - 미들웨어로 DB 연결 open/close 자동 관리
9. SQLite / PostgreSQL / MySQL 연결
   - `SqliteDatabase("app.db")`: SQLite 설정
   - `PostgresqlDatabase(...)`: PostgreSQL 설정
   - `MySQLDatabase(...)`: MySQL 설정
   - 커넥션 풀링: `PooledPostgresqlDatabase`

## 샘플 코드
- `tutorials-python/python/peewee/`

## 참고
- https://docs.peewee-orm.com/
