# 구현 계획: Peewee ORM 실전 가이드

## 시리즈 정보
- **시리즈**: FastAPI 풀스택 개발 (7-3)
- **난이도**: 초-중급
- **샘플 코드 위치**: `tutorials-python/python/peewee/`

## 1. 샘플 코드 구현

### 1.1 프로젝트 구조
```
tutorials-python/python/peewee/
  models.py          # User, Post, Tag 모델 정의 (1:N, N:M 관계)
  database.py        # DB 연결 설정 (SQLite)
  crud_example.py    # CRUD 연산 예제
  query_example.py   # 쿼리 빌더 예제 (join, 집계, 결과 형식)
  transaction_example.py  # 트랜잭션 관리 예제
  fastapi_example.py # FastAPI 연동 패턴
  tests/
    test_models.py    # 모델 및 관계 테스트
    test_crud.py      # CRUD 테스트
    test_queries.py   # 쿼리 빌더 테스트
  requirements.txt    # peewee, fastapi, uvicorn, pytest
```

### 1.2 모델 정의 (`models.py`)
- `User` 모델: CharField(username), DateTimeField(created_at), BooleanField(is_active)
- `Post` 모델: ForeignKeyField(User, backref="posts"), CharField(title), TextField(content)
- `Tag` 모델: CharField(name, unique=True)
- `PostTag` 중간 테이블: ForeignKeyField(Post), ForeignKeyField(Tag)
- ManyToManyField 사용 예제 포함

### 1.3 CRUD 예제 (`crud_example.py`)
- `create()`, `insert_many()` - 단건/다건 생성
- `get_by_id()`, `select().where()` - 조회
- `save()`, `update().where()` - 수정
- `delete_instance()`, `delete().where()` - 삭제
- `get_or_create()` 편의 메서드

### 1.4 쿼리 빌더 예제 (`query_example.py`)
- `select().where().order_by().limit()` 체이닝
- `join()` 명시적 JOIN
- `fn.COUNT()`, `fn.SUM()` 집계 함수
- `.group_by()`, `.having()` 그룹핑
- `.dicts()`, `.tuples()`, `.namedtuples()` 결과 형식
- `prefetch()` N+1 문제 방지

### 1.5 트랜잭션 예제 (`transaction_example.py`)
- `db.atomic()` context manager
- 중첩 트랜잭션 (savepoint)
- `@db.atomic()` 데코레이터

### 1.6 FastAPI 연동 (`fastapi_example.py`)
- `Depends(get_db)` 요청별 DB 연결
- `model_to_dict()` Peewee -> Pydantic 변환
- 미들웨어 DB 연결 자동 관리

## 2. 블로그 글 작성

### 2.1 글 구조 (`docs/start/python-peewee-orm-guide/index.md`)

```yaml
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
```

### 2.2 섹션별 핵심 내용

**1. 개요**
- Peewee 설계 철학 소개
- SQLAlchemy vs Peewee 비교표 (비동기, 마이그레이션, 학습 곡선, 커뮤니티)
- 적합한 사용 시나리오

**2. 모델 정의와 관계 설정**
- 모델 기본 구조 + Meta 클래스 코드
- Field 타입별 예제 코드
- 1:N, N:M 관계 설정 코드
- prefetch() 사용법

**3. CRUD와 쿼리**
- CRUD 각 연산별 코드 예제
- 쿼리 빌더 체이닝 예제
- 집계/그룹핑 예제

**4. DB 연결과 운영**
- SQLite/PostgreSQL/MySQL 연결 코드
- 커넥션 풀링 설정
- 트랜잭션 관리 패턴
- peewee-migrate 기본 사용법

**5. FastAPI 연동 패턴**
- DB 의존성 주입 코드
- Pydantic 모델 변환 코드
- 미들웨어 패턴 코드

**6. 마무리**
- 핵심 정리, 적합한 사용 시나리오 재강조

**7. 참고**
- 공식 문서 링크, GitHub 샘플 코드 링크
