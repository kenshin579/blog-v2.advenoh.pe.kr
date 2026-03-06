# TODO: Peewee ORM 실전 가이드

## Phase 1: 샘플 코드 작성 (`tutorials-python/python/peewee/`)

### 1.1 프로젝트 셋업
- [x] `tutorials-python/python/peewee/` 디렉토리 생성
- [x] `requirements.txt` 작성 (peewee, fastapi, uvicorn, pytest)
- [x] 가상환경 생성 및 의존성 설치

### 1.2 모델 정의
- [x] `database.py` - SQLite DB 연결 설정
- [x] `models.py` - User 모델 (CharField, DateTimeField, BooleanField)
- [x] `models.py` - Post 모델 (ForeignKeyField 1:N 관계)
- [x] `models.py` - Tag 모델 + PostTag 중간 테이블 (N:M 관계)
- [x] `models.py` - ManyToManyField 사용 예제

### 1.3 CRUD 예제
- [x] `crud_example.py` - Create: `create()`, `insert_many()`
- [x] `crud_example.py` - Read: `get_by_id()`, `select().where()`
- [x] `crud_example.py` - Update: `save()`, `update().where()`
- [x] `crud_example.py` - Delete: `delete_instance()`, `delete().where()`
- [x] `crud_example.py` - `get_or_create()` 편의 메서드

### 1.4 쿼리 빌더 예제
- [x] `query_example.py` - select/where/order_by/limit 체이닝
- [x] `query_example.py` - join() 명시적 JOIN
- [x] `query_example.py` - fn.COUNT(), fn.SUM() 집계 함수
- [x] `query_example.py` - group_by(), having() 그룹핑
- [x] `query_example.py` - dicts(), tuples(), namedtuples() 결과 형식
- [x] `query_example.py` - prefetch() N+1 문제 방지

### 1.5 트랜잭션 예제
- [x] `transaction_example.py` - db.atomic() context manager
- [x] `transaction_example.py` - 중첩 트랜잭션 (savepoint)
- [x] `transaction_example.py` - @db.atomic() 데코레이터

### 1.6 FastAPI 연동
- [x] `fastapi_example.py` - Depends(get_db) DB 의존성 주입
- [x] `fastapi_example.py` - model_to_dict() Pydantic 변환
- [x] `fastapi_example.py` - 미들웨어 DB 연결 자동 관리

## Phase 2: 테스트 작성 및 검증

- [x] `tests/test_models.py` - 모델 생성, 관계 설정 테스트
- [x] `tests/test_crud.py` - CRUD 연산 테스트
- [x] `tests/test_queries.py` - 쿼리 빌더, 집계, 결과 형식 테스트
- [x] 전체 테스트 실행 및 통과 확인 (26개 pass)

## Phase 3: 블로그 글 작성

### 3.1 초안 작성
- [x] `docs/start/python-peewee-orm-guide/index.md` 생성
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] 1장: 개요 (설계 철학, SQLAlchemy 비교표, 적합 시나리오)
- [x] 2장: 모델 정의와 관계 설정 (Field 타입, 1:N, N:M, prefetch)
- [x] 3장: CRUD와 쿼리 (CRUD 연산, 쿼리 빌더 체이닝, 집계)
- [x] 4장: DB 연결과 운영 (멀티 DB, 트랜잭션, peewee-migrate)
- [x] 5장: FastAPI 연동 패턴 (의존성 주입, Pydantic 변환, 미들웨어)
- [x] 6장: 마무리
- [x] 7장: 참고 (공식 문서, GitHub 샘플 코드 링크)

### 3.2 검수
- [x] 코드 예제가 샘플 코드와 일치하는지 확인
- [x] GitHub 샘플 코드 링크 추가
- [x] 인코딩 확인 (`file -I` UTF-8 검증)

## Phase 4: PR 생성

- [ ] feature 브랜치 생성
- [ ] 커밋 및 푸시
- [ ] PR 생성 (gh CLI + HEREDOC)
