# PRD: SQLAlchemy 2.0 + SQLModel

## 개요
SQLAlchemy 2.0 ORM과 SQLModel로 FastAPI 통합까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 5-2
- **난이도**: 중-고급
- **우선순위**: ★★☆

## 다룰 내용
1. SQLAlchemy 2.0 주요 변경점 (1.x → 2.0)
2. 선언적 매핑 (DeclarativeBase, Mapped, mapped_column)
3. 세션 관리 (Session, async_session)
4. CRUD 패턴
5. 관계 설정 (1:N, N:M, lazy loading)
6. 마이그레이션 (Alembic)
7. SQLModel 소개 (Pydantic + SQLAlchemy 통합)
8. SQLModel로 FastAPI 엔드포인트 구현
9. 성능 팁 (N+1 문제, eager loading)

## 샘플 코드
- `tutorials-python/python/sqlalchemy/`

## 참고
- https://docs.sqlalchemy.org/en/20/
- https://sqlmodel.tiangolo.com/
