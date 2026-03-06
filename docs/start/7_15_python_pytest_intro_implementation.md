# 구현 문서: pytest 입문 - unittest에서 pytest로

## 1. 샘플 코드 작성

샘플 코드 경로: `tutorials-python/python/pytest/intro/`

### 1.1 프로젝트 구조

```
tutorials-python/python/pytest/intro/
├── pyproject.toml
├── src/
│   └── calculator.py          # 테스트 대상 모듈 (사칙연산)
├── tests/
│   ├── conftest.py            # 공유 fixture 정의
│   ├── test_basic.py          # 기본 assert, pytest.raises, pytest.approx
│   ├── test_unittest_style.py # unittest로 작성한 동일 테스트 (비교용)
│   ├── test_fixture.py        # fixture scope, yield, autouse, 의존성 주입
│   ├── test_parametrize.py    # parametrize, pytest.param, indirect
│   ├── test_marking.py        # skip, skipif, xfail, 커스텀 마커
│   └── sub/
│       ├── conftest.py        # 하위 디렉토리 conftest (계층 구조 데모)
│       └── test_sub.py        # 하위 디렉토리 테스트
```

### 1.2 테스트 대상 모듈 (`calculator.py`)

- `add(a, b)`, `subtract(a, b)`, `multiply(a, b)`, `divide(a, b)`
- `divide`에서 0으로 나눌 때 `ValueError` 발생

### 1.3 테스트 파일별 구현 사항

#### `test_unittest_style.py`
- `unittest.TestCase` 기반으로 calculator 테스트 작성
- `self.assertEqual`, `self.assertRaises` 사용

#### `test_basic.py`
- 동일 테스트를 pytest `assert`문으로 작성 (unittest와 비교)
- `pytest.raises(ValueError)`로 예외 검증
- `pytest.approx()`로 부동소수점 비교

#### `test_fixture.py`
- `@pytest.fixture` 기본 사용 (calculator 인스턴스 생성)
- `scope="module"` fixture 예제
- `yield` fixture로 setup/teardown 패턴
- `autouse=True` fixture 예제
- fixture가 다른 fixture를 인자로 받는 의존성 주입 예제

#### `conftest.py` (루트)
- 프로젝트 전역 fixture 정의 (ex. `sample_data`)

#### `tests/sub/conftest.py`
- 하위 디렉토리 전용 fixture 정의 (계층별 적용 범위 데모)

#### `test_parametrize.py`
- `@pytest.mark.parametrize` 기본 사용
- 다중 파라미터 조합
- `pytest.param(..., id="case-name")` 케이스별 이름 지정
- `indirect=True`로 fixture에 파라미터 전달

#### `test_marking.py`
- `@pytest.mark.skip`, `@pytest.mark.skipif`, `@pytest.mark.xfail`
- 커스텀 마커 정의 및 `pytest -m "marker"` 필터링

### 1.4 pyproject.toml 설정

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v"
markers = [
    "slow: 느린 테스트",
    "integration: 통합 테스트",
]
filterwarnings = ["ignore::DeprecationWarning"]
```

## 2. 블로그 글 작성

작성 경로: `blog-v2.advenoh.pe.kr/docs/start/7_15_python_pytest_intro/index.md`

### 2.1 글 구조

PRD 목차 기반으로 작성. 각 섹션에서 샘플 코드를 인라인으로 포함하고, GitHub 저장소 링크로 전체 코드 참조.

### 2.2 핵심 포인트

- **1. 개요**: unittest의 boilerplate 코드 vs pytest의 간결함을 코드로 직접 비교
- **2. 설치 및 설정**: uv 기반 설치, pyproject.toml 설정, 디스커버리 규칙
- **3. CLI 옵션**: 실행 결과 스크린샷/출력 예시 포함
- **4. assertion**: assertion rewriting으로 인한 상세 에러 메시지 출력 예시
- **5. fixture와 conftest.py**: fixture scope 별 동작 차이를 출력으로 확인
- **6. parametrize와 마킹**: 테스트 실행 결과에서 파라미터별 PASSED/FAILED 표시 확인
- **7. 마무리**: 다음 시리즈 예고 (mock, plugin 등)
