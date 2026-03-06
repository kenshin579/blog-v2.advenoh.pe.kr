# 구현 문서: pytest 플러그인과 실전 팁

## 블로그 글 정보
- **파일 경로**: `docs/start/pytest-플러그인과-실전-팁/index.md`
- **시리즈**: pytest로 테스트 마스터하기 (6-3)
- **샘플 코드**: `tutorials-python/python/pytest/plugins/`

## 샘플 코드 구조

```
tutorials-python/python/pytest/plugins/
├── pyproject.toml
├── src/
│   ├── calculator.py          # 커버리지 대상 (간단한 계산기)
│   └── async_service.py       # 비동기 API 호출 서비스
├── tests/
│   ├── conftest.py            # 커스텀 hook + 공유 fixture
│   ├── test_cov.py            # pytest-cov 데모
│   ├── test_xdist.py          # pytest-xdist 병렬 실행 데모
│   ├── test_asyncio.py        # pytest-asyncio 비동기 테스트
│   ├── test_benchmark.py      # pytest-benchmark 성능 측정
│   ├── test_custom_fixture.py # factory fixture, tmp_path 등
│   └── test_cli_tips.py       # --lf, --sw, --pdb 데모용
└── .github/
    └── workflows/
        └── pytest-ci.yml      # GitHub Actions CI 워크플로우 예제
```

## 섹션별 핵심 구현

### 1. 개요
- pytest 플러그인 생태계 간단 소개 (800+ 플러그인)
- 이 글에서 다루는 4개 플러그인 역할 요약표

### 2. 인기 플러그인

#### 2.1 pytest-cov
- `calculator.py`에 대한 커버리지 측정 예제
- 명령어별 출력 결과 스크린샷/텍스트
  - `pytest --cov=src --cov-report=term-missing`
  - `pytest --cov=src --cov-report=html`
- `pyproject.toml`에 커버리지 설정 작성

```toml
[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
fail_under = 80
exclude_lines = ["pragma: no cover", "if TYPE_CHECKING:"]
```

#### 2.2 pytest-xdist
- CPU 코어별 병렬 실행 데모: `pytest -n auto`
- `--dist=loadscope` vs `--dist=loadfile` 차이 설명
- fixture scope 주의사항: `session` scope fixture는 워커마다 독립 실행됨

```python
# test_xdist.py - 병렬 실행 확인용
import os

def test_worker_id(worker_id):
    """각 워커의 ID를 출력하여 병렬 실행 확인"""
    print(f"Running on worker: {worker_id}")
    assert True
```

#### 2.3 pytest-asyncio
- `asyncio_mode = "auto"` 설정으로 `@pytest.mark.asyncio` 생략
- 비동기 fixture와 비동기 테스트 함수 예제

```python
# test_asyncio.py
import pytest
import pytest_asyncio

@pytest_asyncio.fixture
async def async_client():
    client = AsyncService()
    yield client
    await client.close()

@pytest.mark.asyncio
async def test_fetch_data(async_client):
    result = await async_client.fetch("https://httpbin.org/get")
    assert result["url"] == "https://httpbin.org/get"
```

#### 2.4 pytest-benchmark
- `benchmark` fixture로 함수 실행 시간 측정
- `pedantic` 모드로 정밀 측정
- `--benchmark-compare` 결과 비교 출력

```python
# test_benchmark.py
def test_sort_performance(benchmark):
    data = list(range(1000, 0, -1))
    result = benchmark(sorted, data)
    assert result == list(range(1, 1001))

def test_sort_pedantic(benchmark):
    data = list(range(1000, 0, -1))
    benchmark.pedantic(sorted, args=(data,), rounds=100, iterations=10)
```

### 3. 커스텀 확장

#### 3.1 커스텀 fixture 패턴
- factory fixture, request fixture, tmp_path 예제

```python
# conftest.py
@pytest.fixture
def user_factory():
    def _create_user(name="test", role="admin"):
        return {"name": name, "role": role}
    return _create_user

@pytest.fixture
def db_session():
    session = create_session()
    yield session
    session.rollback()
    session.close()
```

#### 3.2 커스텀 플러그인 작성
- conftest.py에서 hook 함수 3개 구현

```python
# conftest.py
def pytest_configure(config):
    config.addinivalue_line("markers", "slow: 느린 테스트")

def pytest_collection_modifyitems(items):
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(pytest.mark.skip(reason="slow 마커 제외"))

def pytest_runtest_makereport(item, call):
    if call.when == "call" and call.excinfo is not None:
        print(f"\n[FAILED] {item.nodeid}")
```

### 4. CI/CD 연동

#### 4.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/pytest-ci.yml
name: pytest CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
      - run: pytest --cov=src --cov-report=xml -n auto
      - uses: codecov/codecov-action@v4
        with:
          file: coverage.xml
```

#### 4.2 커버리지 리포트 자동화
- Codecov/Coveralls 업로드 설정
- PR 코멘트에 커버리지 변화량 표시 (Codecov bot)

### 5. 실전 디버깅 & CLI 팁
- 각 옵션별 사용 시나리오와 명령어 예시
- `--lf`, `--sw`, `--tb`, `--pdb` 등

### 6. 마무리
- 플러그인별 비교표

| 플러그인 | 용도 | 핵심 명령어 |
|---------|------|------------|
| pytest-cov | 코드 커버리지 | `--cov=src` |
| pytest-xdist | 병렬 실행 | `-n auto` |
| pytest-asyncio | 비동기 테스트 | `@pytest.mark.asyncio` |
| pytest-benchmark | 성능 측정 | `benchmark` fixture |

## 의존성 (pyproject.toml)

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pytest-xdist>=3.5",
    "pytest-asyncio>=0.23",
    "pytest-benchmark>=4.0",
    "aiohttp>=3.9",
]
```
