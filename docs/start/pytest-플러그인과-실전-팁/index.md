---
title: "pytest 플러그인과 실전 팁"
description: "pytest 플러그인과 실전 팁"
date: 2026-03-06
update: 2026-03-06
tags:
  - pytest
  - pytest-cov
  - pytest-xdist
  - pytest-asyncio
  - pytest-benchmark
  - coverage
  - 병렬테스트
  - 비동기테스트
  - 벤치마크
  - python
  - 파이썬
  - CI
  - GitHub Actions
series: "pytest로 테스트 마스터하기"
---

# 1. 개요

pytest는 800개 이상의 플러그인이 등록된 풍부한 생태계를 가지고 있다. `pip install pytest-{플러그인명}` 한 줄이면 설치가 끝나고, pytest가 자동으로 플러그인을 인식한다.

이 글에서는 실무에서 가장 많이 사용되는 4개 플러그인과 커스텀 확장, CI/CD 연동까지 다룬다.

| 플러그인 | 용도 | 핵심 명령어/설정 |
|---------|------|-----------------|
| pytest-cov | 코드 커버리지 측정 | `--cov=src` |
| pytest-xdist | 병렬 테스트 실행 | `-n auto` |
| pytest-asyncio | 비동기 테스트 | `asyncio_mode = "auto"` |
| pytest-benchmark | 성능 벤치마크 | `benchmark` fixture |

> 이 글의 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/pytest/plugins)에서 확인할 수 있다.

# 2. 인기 플러그인

## 2.1 pytest-cov (코드 커버리지)

pytest-cov는 [coverage.py](https://coverage.readthedocs.io/)를 pytest에 통합한 플러그인이다. 테스트가 소스 코드의 어느 부분을 실행했는지 측정하여 리포트를 생성한다.

### 설치

```bash
pip install pytest-cov
```

### 기본 사용법

```bash
# 터미널에 커버리지 출력 (누락 라인 표시)
pytest --cov=src --cov-report=term-missing

# HTML 리포트 생성
pytest --cov=src --cov-report=html

# 최소 커버리지 기준 강제 (80% 미만이면 실패)
pytest --cov=src --cov-fail-under=80
```

실행 결과 예시:

```
Name                   Stmts   Miss Branch BrPart  Cover   Missing
------------------------------------------------------------------
src/__init__.py            0      0      0      0   100%
src/calculator.py         27      0     12      0   100%
------------------------------------------------------------------
TOTAL                     27      0     12      0   100%
```

### 리포트 종류

| 옵션 | 설명 |
|------|------|
| `term` | 터미널 요약 |
| `term-missing` | 터미널 + 누락 라인 번호 |
| `html` | HTML 리포트 (`htmlcov/` 디렉토리) |
| `xml` | XML 리포트 (CI/CD 연동용) |
| `json` | JSON 리포트 |

### pyproject.toml 설정

명령줄 옵션을 매번 입력하는 대신 설정 파일에 미리 정의할 수 있다.

```toml
[tool.coverage.run]
source = ["src"]
branch = true       # branch coverage 활성화

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
]
```

- **branch coverage**: 단순히 라인 실행 여부만이 아닌, 조건문의 `True`/`False` 경로를 모두 실행했는지 측정한다
- **exclude_lines**: 커버리지 측정에서 제외할 패턴을 지정한다 (타입 체크 코드 등)

## 2.2 pytest-xdist (병렬 테스트 실행)

pytest-xdist는 테스트를 여러 CPU 코어에 분산하여 병렬로 실행한다. 테스트 수가 많은 프로젝트에서 실행 시간을 크게 단축할 수 있다.

### 설치

```bash
pip install pytest-xdist
```

### 기본 사용법

```bash
# CPU 코어 수만큼 워커 자동 생성
pytest -n auto

# 워커 수 직접 지정
pytest -n 4
```

### 분배 전략 (--dist)

| 옵션 | 설명 |
|------|------|
| `loadscope` | 같은 모듈/클래스의 테스트를 같은 워커에 분배 |
| `loadfile` | 같은 파일의 테스트를 같은 워커에 분배 |
| `loadgroup` | `@pytest.mark.xdist_group`으로 그룹 지정 |
| `each` | 모든 워커에서 모든 테스트 실행 (기본값 아님) |

```bash
# 모듈/클래스 단위로 워커 분배
pytest -n auto --dist=loadscope
```

### 병렬 실행 확인

`worker_id` fixture로 각 테스트가 어떤 워커에서 실행되는지 확인할 수 있다.

```python
def test_worker_id_check(worker_id):
    """단일 실행: worker_id = "master"
    병렬 실행: worker_id = "gw0", "gw1", ...
    """
    print(f"Running on worker: {worker_id}")
    assert worker_id is not None
```

### 주의: fixture scope와 병렬 실행

`session` scope fixture는 **워커마다 독립적으로 실행**된다. 즉, 워커가 4개면 session fixture도 4번 실행된다. DB 초기화 같은 무거운 작업이 session fixture에 있다면 `--dist=loadscope`를 사용하여 같은 모듈의 테스트가 같은 워커에서 실행되도록 해야 한다.

## 2.3 pytest-asyncio (비동기 테스트)

pytest-asyncio는 `async/await` 기반의 비동기 코드를 테스트할 수 있게 해준다.

### 설치

```bash
pip install pytest-asyncio
```

### asyncio_mode 설정

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- `auto` 모드: 모든 `async def test_*` 함수가 자동으로 비동기 테스트로 인식된다. `@pytest.mark.asyncio` 데코레이터를 생략할 수 있다
- `strict` 모드 (기본값): `@pytest.mark.asyncio`를 명시적으로 붙여야 한다

### 기본 비동기 테스트

```python
# asyncio_mode = "auto" 설정 시 데코레이터 생략 가능
async def test_basic_async():
    await asyncio.sleep(0.01)
    assert True

async def test_async_gather():
    async def delayed_value(value, delay):
        await asyncio.sleep(delay)
        return value

    results = await asyncio.gather(
        delayed_value("a", 0.01),
        delayed_value("b", 0.01),
        delayed_value("c", 0.01),
    )
    assert results == ["a", "b", "c"]
```

### 비동기 fixture

비동기 fixture는 `@pytest_asyncio.fixture` 데코레이터를 사용한다.

```python
import pytest_asyncio

@pytest_asyncio.fixture
async def async_service():
    """비동기 fixture: setup + teardown 패턴"""
    service = AsyncService()
    yield service
    await service.close()

async def test_fetch_data(async_service):
    mock_response = {"url": "https://httpbin.org/get"}
    with patch.object(async_service, "fetch_json",
                      new_callable=AsyncMock, return_value=mock_response):
        result = await async_service.fetch_json("/get")
        assert result["url"] == "https://httpbin.org/get"
```

### event loop scope 설정

기본적으로 각 테스트 함수마다 새로운 event loop가 생성된다. `loop_scope`를 변경하여 여러 테스트가 같은 event loop를 공유하도록 설정할 수 있다.

```toml
# pyproject.toml - 전역 설정
[tool.pytest.ini_options]
asyncio_default_fixture_loop_scope = "session"
asyncio_default_test_loop_scope = "function"
```

fixture별로 개별 설정도 가능하다.

```python
# fixture 단위로 loop_scope 지정
@pytest_asyncio.fixture(loop_scope="module", scope="module")
async def module_scoped_resource():
    resource = await create_expensive_resource()
    yield resource
    await resource.cleanup()
```

| loop_scope | 설명 |
|-----------|------|
| `function` | 각 테스트마다 새 event loop (기본값) |
| `module` | 모듈 내 테스트가 같은 event loop 공유 |
| `session` | 전체 세션에서 하나의 event loop 공유 |

## 2.4 pytest-benchmark (성능 벤치마크)

pytest-benchmark는 함수의 실행 시간을 정밀하게 측정하고 비교할 수 있는 플러그인이다.

### 설치

```bash
pip install pytest-benchmark
```

### 기본 사용법

`benchmark` fixture를 인자로 받아 측정할 함수를 전달한다.

```python
def test_sort_performance(benchmark):
    data = list(range(1000, 0, -1))
    result = benchmark(sorted, data)
    assert result == list(range(1, 1001))
```

### pedantic 모드 (정밀 측정)

`rounds`와 `iterations`를 직접 지정하여 정밀하게 측정한다.

```python
def test_factorial_pedantic(benchmark):
    calc = Calculator()
    benchmark.pedantic(calc.factorial, args=(10,), rounds=100, iterations=10)
```

- `rounds`: 전체 반복 횟수
- `iterations`: 각 round 내 반복 횟수

### 결과 저장 및 비교

```bash
# 결과를 baseline이라는 이름으로 저장
pytest tests/test_benchmark.py --benchmark-save=baseline

# 저장된 결과와 비교
pytest tests/test_benchmark.py --benchmark-compare=0001_baseline
```

실행 결과 예시:

```
Name (time in ns)                   Min         Max        Mean      StdDev
--------------------------------------------------------------------------
test_factorial_pedantic          137.50      320.80      152.63       19.31
test_power_pedantic              245.80      425.00      279.66       20.30
test_sort_performance          2,291.00   20,334.00    2,582.52      259.31
```

> **주의**: pytest-xdist와 pytest-benchmark는 함께 사용할 수 없다. 병렬 환경에서는 벤치마크가 자동으로 비활성화된다.

# 3. 커스텀 확장

## 3.1 커스텀 fixture 패턴

### factory fixture

테스트마다 다른 파라미터로 객체를 생성해야 할 때 유용하다.

```python
@pytest.fixture
def user_factory():
    """파라미터화된 객체 생성기"""
    def _create_user(name="test", role="admin"):
        return {"name": name, "role": role, "active": True}
    return _create_user

def test_default_user(user_factory):
    user = user_factory()
    assert user["name"] == "test"

def test_custom_user(user_factory):
    user = user_factory(name="alice", role="viewer")
    assert user["name"] == "alice"
```

### request fixture

`request` fixture로 현재 실행 중인 테스트의 메타데이터에 접근할 수 있다.

```python
@pytest.fixture
def log_test_name(request):
    test_name = request.node.name
    print(f"\n[START] {test_name}")
    yield test_name
    print(f"\n[END] {test_name}")

def test_with_request_fixture(log_test_name):
    assert "test_with_request_fixture" in log_test_name
```

### tmp_path / tmp_path_factory

임시 파일이나 디렉토리가 필요한 테스트에서 사용한다. 테스트 종료 후 자동으로 정리된다.

```python
def test_write_and_read(tmp_path):
    file = tmp_path / "output.txt"
    file.write_text("hello pytest")
    assert file.read_text() == "hello pytest"

def test_json_file(tmp_path):
    data = {"name": "test", "values": [1, 2, 3]}
    json_file = tmp_path / "data.json"
    json_file.write_text(json.dumps(data))

    loaded = json.loads(json_file.read_text())
    assert loaded == data
```

`tmp_path_factory`는 `session` scope에서 사용할 수 있어, 여러 테스트가 같은 임시 디렉토리를 공유할 때 유용하다.

```python
def test_tmp_path_factory(tmp_path_factory):
    base_dir = tmp_path_factory.mktemp("mydata")
    config_file = base_dir / "config.ini"
    config_file.write_text("[settings]\ndebug=true")
    assert config_file.exists()
```

### 데이터베이스 테스트용 세션 fixture (트랜잭션 rollback 패턴)

DB를 사용하는 테스트에서 각 테스트의 격리성을 보장하는 패턴이다.

```python
@pytest.fixture
def db_session():
    session = create_session()
    yield session
    session.rollback()   # 테스트에서 변경한 데이터를 되돌림
    session.close()
```

## 3.2 커스텀 플러그인 작성

`conftest.py`에 pytest hook 함수를 구현하면 플러그인처럼 동작하는 커스텀 확장을 만들 수 있다.

### pytest_configure: 설정 커스터마이징

```python
def pytest_configure(config):
    """커스텀 마커 등록"""
    config.addinivalue_line("markers", "slow: 느린 테스트")
    config.addinivalue_line("markers", "integration: 통합 테스트")
```

### pytest_collection_modifyitems: 테스트 수집 후 수정

```python
def pytest_collection_modifyitems(config, items):
    """slow 마커가 있는 테스트를 조건부로 skip"""
    skip_slow = config.getoption("-m", default=None)
    if skip_slow == "not slow":
        skip_marker = pytest.mark.skip(reason="--m 'not slow' 옵션으로 제외")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_marker)
```

### pytest_runtest_makereport: 테스트 결과 후처리

```python
def pytest_runtest_makereport(item, call):
    """실패한 테스트의 상세 정보를 출력"""
    if call.when == "call" and call.excinfo is not None:
        print(f"\n[FAILED] {item.nodeid}: {call.excinfo.typename}")
```

| hook 함수 | 호출 시점 | 용도 |
|-----------|----------|------|
| `pytest_configure` | pytest 시작 시 | 마커 등록, 설정 변경 |
| `pytest_collection_modifyitems` | 테스트 수집 완료 후 | 테스트 필터링, 순서 변경 |
| `pytest_runtest_makereport` | 각 테스트 실행 후 | 결과 로깅, 리포트 커스터마이징 |

# 4. CI/CD 연동

## 4.1 GitHub Actions 워크플로우

pytest와 커버리지를 CI에서 자동으로 실행하는 워크플로우 예제이다.

```yaml
name: pytest CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12", "3.13"]

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5

      - name: Set up Python ${{ matrix.python-version }}
        run: uv python install ${{ matrix.python-version }}

      - name: Install dependencies
        run: uv sync --dev

      - name: Run tests with coverage
        run: uv run pytest --cov=src --cov-report=xml --cov-report=term-missing -n auto

      - name: Upload coverage to Codecov
        if: matrix.python-version == '3.13'
        uses: codecov/codecov-action@v5
        with:
          file: coverage.xml
          fail_ci_if_error: false
```

핵심 포인트:
- `--cov-report=xml`: CI 환경에서 Codecov에 업로드할 XML 리포트 생성
- `-n auto`: 병렬 실행으로 CI 시간 단축
- `matrix`: 여러 Python 버전에서 테스트 실행

## 4.2 커버리지 리포트 자동화

### Codecov 연동

[Codecov](https://codecov.io/)를 연동하면 PR에 커버리지 변화량이 자동으로 코멘트된다.

1. Codecov 사이트에서 GitHub 저장소 연동
2. `codecov/codecov-action` 으로 XML 리포트 업로드
3. PR 코멘트에 커버리지 증감이 자동 표시됨

### Coveralls 연동

Codecov 대신 [Coveralls](https://coveralls.io/)를 사용할 수도 있다.

```yaml
- name: Upload to Coveralls
  uses: coverallsapp/github-action@v2
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    file: coverage.xml
```

# 5. 실전 디버깅 & CLI 팁

## 5.1 실패 테스트 빠르게 재실행

```bash
# 마지막 실패 테스트만 재실행
pytest --lf

# stepwise 모드: 실패 지점부터 재시작, 다음 실패에서 멈춤
pytest --sw
```

- `--lf` (last failed): 이전 실행에서 실패한 테스트만 다시 실행한다. 실패를 수정한 후 빠르게 확인할 때 유용하다
- `--sw` (stepwise): 실패가 발생하면 멈추고, 다음 실행 시 그 지점부터 이어서 실행한다

## 5.2 출력 및 디버깅

```bash
# traceback 형식 조절
pytest --tb=short    # 간단한 traceback
pytest --tb=long     # 상세한 traceback
pytest --tb=line     # 한 줄 요약

# 경고 숨기기
pytest -p no:warnings

# 실패 시 pdb 디버거 자동 진입
pytest --pdb
```

| 옵션 | 설명 |
|------|------|
| `--lf` | 마지막 실패 테스트만 재실행 |
| `--sw` | stepwise 모드 (실패 지점부터 재시작) |
| `--tb=short/long/line` | traceback 형식 조절 |
| `-p no:warnings` | 경고 숨기기 |
| `--pdb` | 실패 시 디버거 진입 |
| `-s` | print 출력 활성화 (stdout 캡처 비활성화) |
| `-x` | 첫 번째 실패에서 즉시 중단 |

# 6. 마무리

| 플러그인 | 용도 | 핵심 명령어 | 추천 상황 |
|---------|------|------------|----------|
| pytest-cov | 코드 커버리지 | `--cov=src` | 모든 프로젝트 |
| pytest-xdist | 병렬 실행 | `-n auto` | 테스트 수 100개 이상 |
| pytest-asyncio | 비동기 테스트 | `asyncio_mode = "auto"` | async/await 코드 |
| pytest-benchmark | 성능 측정 | `benchmark` fixture | 성능 크리티컬 코드 |

**프로젝트 규모별 추천 조합:**

- **소규모 프로젝트**: pytest-cov (커버리지만으로 충분)
- **중규모 프로젝트**: pytest-cov + pytest-xdist (테스트 늘어나면 병렬 실행)
- **대규모/비동기 프로젝트**: pytest-cov + pytest-xdist + pytest-asyncio + CI 연동

# 7. 참고

- [pytest 공식 플러그인 목록](https://docs.pytest.org/en/latest/reference/plugin_list.html)
- [pytest-cov 공식 문서](https://pytest-cov.readthedocs.io/)
- [pytest-xdist 공식 문서](https://pytest-xdist.readthedocs.io/)
- [pytest-asyncio 공식 문서](https://pytest-asyncio.readthedocs.io/)
- [pytest-benchmark 공식 문서](https://pytest-benchmark.readthedocs.io/)
