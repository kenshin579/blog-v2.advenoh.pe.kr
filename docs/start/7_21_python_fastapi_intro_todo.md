# TODO: FastAPI 입문 - Flask에서 FastAPI로

## Phase 1: 샘플 코드 프로젝트 셋업
- [ ] `tutorials-python/python/fastapi/intro/` 디렉토리 생성
- [ ] `pyproject.toml` 작성 (fastapi, uvicorn[standard], httpx, pytest, pytest-asyncio)
- [ ] `uv sync`로 의존성 설치

## Phase 2: 핵심 샘플 코드 구현
- [ ] `app/main.py` - FastAPI 인스턴스, CORS, 라우터 등록, uvicorn 실행
- [ ] `app/schemas/user.py` - Pydantic 모델 (UserCreate, UserResponse, UserUpdate)
- [ ] `app/routers/users.py` - 사용자 CRUD 라우터
  - [ ] GET `/users/{user_id}` - Path 파라미터
  - [ ] GET `/users` - Query 파라미터 (skip, limit)
  - [ ] POST `/users` - Body 파라미터 (Pydantic)
  - [ ] PUT `/users/{user_id}` - Path + Body
  - [ ] DELETE `/users/{user_id}`
- [ ] `app/dependencies.py` - 의존성 주입 예시
  - [ ] 함수 기반 의존성 (get_db, yield 패턴)
  - [ ] 클래스 기반 의존성 (CommonQueryParams)
  - [ ] 의존성 체이닝

## Phase 3: Flask 비교 코드
- [ ] `flask_comparison/flask_app.py` - 동일 API Flask 구현

## Phase 4: 비동기 및 미들웨어 예시
- [ ] `async def` vs `def` 차이를 보여주는 엔드포인트 추가
- [ ] CORS 미들웨어 설정 (개발/프로덕션 분리)

## Phase 5: 테스트
- [ ] `tests/test_main.py` - httpx AsyncClient 테스트
- [ ] 전체 테스트 통과 확인

## Phase 6: 블로그 글 작성
- [ ] `docs/start/7_21_python_fastapi_intro/index.md` 생성
- [ ] 섹션 1: 개요 (FastAPI 특징, Flask 비교 표)
- [ ] 섹션 2: 설치 및 실행 (uv, 프로젝트 구조, uvicorn)
- [ ] 섹션 3: 라우팅과 요청/응답 (코드 예시 + 설명)
- [ ] 섹션 4: 의존성 주입 (Depends, yield, 클래스, 체이닝)
- [ ] 섹션 5: 비동기와 미들웨어 (async/def 가이드, CORS)
- [ ] 섹션 6: 자동 API 문서화 (Swagger UI/ReDoc 스크린샷, 커스터마이징)
- [ ] 참고 섹션 (샘플 코드 링크, 공식 문서 링크)

## Phase 7: 리뷰 및 마무리
- [ ] 코드 인코딩 확인 (`file -I`)
- [ ] 샘플 코드와 블로그 글의 코드 일치 여부 확인
- [ ] PR 생성
