# TODO: pytest 입문 - unittest에서 pytest로

## 1단계: 샘플 코드 작성

- [x] `tutorials-python/python/pytest/intro/` 프로젝트 구조 생성
- [x] `pyproject.toml` 작성 (pytest 설정 포함)
- [x] `src/calculator.py` 작성 (테스트 대상 모듈)
- [x] `tests/test_unittest_style.py` 작성 (unittest 비교용)
- [x] `tests/test_basic.py` 작성 (assert, pytest.raises, pytest.approx)
- [x] `tests/test_fixture.py` 작성 (scope, yield, autouse, 의존성 주입)
- [x] `tests/conftest.py` 작성 (프로젝트 전역 fixture)
- [x] `tests/sub/conftest.py` + `tests/sub/test_sub.py` 작성 (계층별 conftest 데모)
- [x] `tests/test_parametrize.py` 작성 (parametrize, pytest.param, indirect)
- [x] `tests/test_marking.py` 작성 (skip, skipif, xfail, 커스텀 마커)
- [x] 전체 테스트 실행 및 통과 확인 (`pytest -v`) - 58 passed, 1 skipped, 2 xfailed, 1 xpassed

## 2단계: 블로그 글 작성

- [x] `docs/start/pytest-입문-unittest에서-pytest로/index.md` 초안 작성
  - [x] 1. 개요 (배경/동기, unittest vs pytest 코드 비교)
  - [x] 2. 설치 및 프로젝트 설정 (설치, pyproject.toml, 디스커버리 규칙)
  - [x] 3. 테스트 실행 및 CLI 옵션
  - [x] 4. assertion (assert문, pytest.raises, pytest.approx)
  - [x] 5. fixture와 conftest.py (기본, 고급 패턴, conftest 계층)
  - [x] 6. parametrize와 마킹
  - [x] 7. 마무리
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] 코드 실행 결과 출력 예시 포함
- [x] GitHub 저장소 샘플 코드 링크 추가

## 3단계: 검증

- [x] `file -I index.md` 로 UTF-8 인코딩 확인 - charset=utf-8
- [x] 샘플 코드 전체 테스트 재실행 확인 - 58 passed, 1 skipped, 2 xfailed, 1 xpassed
- [x] 블로그 글 내 코드 블록과 실제 샘플 코드 일치 여부 확인
