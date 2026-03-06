# 구현 계획: SQLAlchemy 2.0 + SQLModel

## 블로그 글 구조

### 파일 경로
- 블로그 글: `docs/start/python-sqlalchemy-sqlmodel-guide/index.md`
- 샘플 코드: `../tutorials-python/python/sqlalchemy/`

### 카테고리/시리즈
- 시리즈: FastAPI 풀스택 개발 (7-2)
- 카테고리: `python`

---

## 핵심 구현 사항

### 1. 샘플 코드 작성 (`tutorials-python/python/sqlalchemy/`)

#### 1.1 프로젝트 셋업
- `requirements.txt`에 의존성 추가
  - `sqlalchemy>=2.0`
  - `sqlmodel`
  - `aiosqlite` (async 테스트)
  - `alembic`
  - `fastapi`, `httpx`
  - `pytest`, `pytest-asyncio`
- SQLite 사용 (별도 DB 서버 불필요)

#### 1.2 선언적 매핑 (`test_declarative_mapping.py`)
- DeclarativeBase, Mapped, mapped_column 기본
- 타입 힌트 기반 컬럼 정의
- 테이블 자동 생성 (create_all)

#### 1.3 세션 관리와 CRUD (`test_session_crud.py`)
- Session 컨텍스트 매니저 패턴
- CRUD: add, select/where/get, 속성 변경, delete
- flush vs commit 차이
- sessionmaker 팩토리

#### 1.4 비동기 세션 (`test_async_session.py`)
- AsyncSession + aiosqlite
- async CRUD 패턴

#### 1.5 관계 설정 (`test_relationships.py`)
- 1:N 관계: relationship + ForeignKey
- N:M 관계: association table
- back_populates 설정
- lazy loading 전략 (select, joined, selectin)

#### 1.6 Alembic 마이그레이션 (`test_alembic/`)
- alembic init, revision --autogenerate, upgrade/downgrade
- 간단한 마이그레이션 시나리오 데모

#### 1.7 SQLModel 기본 (`test_sqlmodel.py`)
- table=True vs 일반 데이터 모델
- Pydantic + SQLAlchemy 통합
- SQLModel의 장단점

#### 1.8 SQLModel + FastAPI (`test_fastapi_sqlmodel.py`)
- 요청/응답 모델과 DB 모델 분리
- Depends(get_session) 의존성 주입
- CRUD API 엔드포인트 + TestClient

#### 1.9 성능 최적화 (`test_performance.py`)
- N+1 문제 시연
- selectinload, joinedload 적용
- echo=True로 SQL 로그 확인

### 2. 블로그 글 작성

- PRD 목차 순서대로 작성
- 각 섹션마다 샘플 코드 GitHub 링크 포함
- 1.x → 2.0 변경점 비교표 포함
- SQLModel 장단점/제약사항 명시

---

## 기술 스택
- Python 3.11+
- SQLAlchemy 2.0
- SQLModel
- Alembic
- FastAPI
- pytest, pytest-asyncio
- SQLite (aiosqlite)
