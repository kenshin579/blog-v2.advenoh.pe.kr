# TODO: pytest 플러그인과 실전 팁

## 1단계: 샘플 코드 작성

### 프로젝트 셋업
- [x] `tutorials-python/python/pytest/plugins/` 디렉토리 생성
- [x] `pyproject.toml` 작성 (pytest, pytest-cov, pytest-xdist, pytest-asyncio, pytest-benchmark 의존성)
- [x] `src/calculator.py` 작성 (커버리지 대상 코드)
- [x] `src/async_service.py` 작성 (비동기 API 호출 서비스)

### 테스트 코드 작성
- [x] `tests/conftest.py` 작성 (커스텀 hook + 공유 fixture)
- [x] `tests/test_cov.py` 작성 (pytest-cov 데모)
- [x] `tests/test_xdist.py` 작성 (pytest-xdist 병렬 실행 데모)
- [x] `tests/test_asyncio_demo.py` 작성 (pytest-asyncio 비동기 테스트)
- [x] `tests/test_benchmark.py` 작성 (pytest-benchmark 성능 측정)
- [x] `tests/test_custom_fixture.py` 작성 (factory fixture, tmp_path 등)
- [x] `tests/test_cli_tips.py` 작성 (--lf, --sw 데모용 의도적 실패 포함)

### CI 예제
- [x] `.github/workflows/pytest-ci.yml` 예제 파일 작성

### 테스트 실행 확인
- [x] `pytest --cov=src --cov-report=term-missing` 실행 확인
- [x] `pytest -n auto` 병렬 실행 확인
- [x] `pytest tests/test_asyncio_demo.py` 비동기 테스트 확인
- [x] `pytest tests/test_benchmark.py` 벤치마크 실행 확인
- [x] 전체 `pytest` 통과 확인 (44 passed)

## 2단계: 블로그 글 작성

### 초안 작성 (`docs/start/pytest-플러그인과-실전-팁/index.md`)
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] 1. 개요: 플러그인 생태계 소개 + 역할 요약표
- [x] 2.1 pytest-cov: 기본 사용법, 리포트 종류, pyproject.toml 설정
- [x] 2.2 pytest-xdist: 병렬 실행, dist 옵션, fixture scope 주의사항
- [x] 2.3 pytest-asyncio: asyncio_mode 설정, 비동기 fixture, event loop scope
- [x] 2.4 pytest-benchmark: benchmark fixture, pedantic, 결과 비교
- [x] 3.1 커스텀 fixture 패턴: factory, request, tmp_path, DB rollback
- [x] 3.2 커스텀 플러그인 작성: pytest_configure, collection_modifyitems, makereport
- [x] 4.1 GitHub Actions 워크플로우 YAML 예제
- [x] 4.2 커버리지 리포트 자동화: Codecov 업로드, PR 코멘트
- [x] 5. 실전 디버깅 & CLI 팁: --lf, --sw, --tb, --pdb
- [x] 6. 마무리: 플러그인 비교표, 프로젝트 규모별 추천 조합
- [x] 7. 참고: 공식 문서 링크

### 품질 확인
- [x] 코드 블록의 실행 결과가 실제와 일치하는지 확인
- [x] 한글 인코딩 확인 (`file -I index.md` → charset=utf-8)
- [x] 시리즈 전편(6-1 입문, 6-2 mock)과 내용 중복 없는지 확인

## 3단계: PR 생성
- [x] feature 브랜치: `feat/363-pytest-plugins` (blog-v2), `feat/pytest-plugins` (tutorials-python)
- [x] 커밋 완료
- [ ] `gh pr create` + HEREDOC으로 PR 생성
