# TODO: SQLAlchemy 2.0 + SQLModel

## 1단계: 프로젝트 셋업
- [x] `tutorials-python/python/sqlalchemy/` 디렉토리 생성
- [x] `requirements.txt` 작성 (sqlalchemy, sqlmodel, aiosqlite, alembic, fastapi, pytest)
- [x] 가상환경 구성 및 의존성 설치

## 2단계: 샘플 코드 작성
- [x] `test_declarative_mapping.py` - DeclarativeBase, Mapped, mapped_column, 테이블 생성
- [x] `test_session_crud.py` - Session 컨텍스트 매니저, CRUD (add/select/update/delete), flush vs commit
- [x] `test_async_session.py` - AsyncSession + aiosqlite, async CRUD 패턴
- [x] `test_relationships.py` - 1:N, N:M 관계, back_populates, lazy loading 전략
- [x] `test_alembic.py` - Alembic 마이그레이션 기본 흐름 (init, revision, upgrade/downgrade)
- [x] `test_sqlmodel.py` - SQLModel 기본 (table=True, 데이터 모델, Pydantic 통합)
- [x] `test_fastapi_sqlmodel.py` - SQLModel + FastAPI CRUD API, Depends(get_session), TestClient
- [x] `test_performance.py` - N+1 문제 시연, selectinload/joinedload, echo=True

## 3단계: 테스트 검증
- [x] `pytest` 전체 테스트 통과 확인 (49 passed)

## 4단계: 블로그 글 작성
- [x] `docs/start/python-sqlalchemy-sqlmodel-guide/index.md` 초안 작성
- [x] 1장: SQLAlchemy 2.0 기초 (변경점, 선언적 매핑)
- [x] 2장: 세션 관리와 CRUD (동기/비동기)
- [x] 3장: 관계 설정과 마이그레이션 (1:N, N:M, Alembic)
- [x] 4장: SQLModel과 FastAPI 통합
- [x] 5장: 성능 최적화 (N+1, eager loading)
- [x] 각 섹션에 GitHub 샘플 코드 링크 추가
- [x] frontmatter 작성 (title, description, date, tags, series)

## 5단계: 리뷰 및 PR
- [x] 글 내용 최종 검토
- [x] feature 브랜치 생성 및 commit
- [x] PR 생성 (gh CLI + HEREDOC)
