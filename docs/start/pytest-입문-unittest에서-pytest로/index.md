---
title: "pytest 입문 - unittest에서 pytest로"
description: "pytest 기본 사용법을 정리한다. unittest와의 비교부터 assert문, fixture, conftest.py, parametrize, 마킹까지 핵심 기능을 예제와 함께 다룬다"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - pytest
  - unittest
  - testing
  - fixture
  - parametrize
  - 테스트
  - 파이썬
series: "pytest로 테스트 마스터하기"
---

# 1. 개요

Python 표준 라이브러리에 포함된 `unittest`는 Java의 JUnit 스타일을 따르는 테스트 프레임워크다. 기능적으로 충분하지만, 클래스 기반의 boilerplate 코드가 많고 assert 메서드(`assertEqual`, `assertRaises` 등)를 일일이 기억해야 하는 불편함이 있다.

`pytest`는 이런 문제를 해결하는 Python 테스트 프레임워크다. 간결한 문법, 강력한 fixture 시스템, 풍부한 플러그인 생태계를 제공한다.

## 1.1 unittest vs pytest 비교

동일한 테스트를 unittest와 pytest로 작성하여 비교해 보자.

**unittest 스타일:**

```python
import unittest
from src.calculator import Calculator

class TestCalculatorUnittest(unittest.TestCase):
    def setUp(self):
        self.calc = Calculator()

    def test_add(self):
        self.assertEqual(self.calc.add(2, 3), 5)

    def test_subtract(self):
        self.assertEqual(self.calc.subtract(10, 4), 6)

    def test_divide_by_zero(self):
        with self.assertRaises(ValueError):
            self.calc.divide(10, 0)
```

**pytest 스타일:**

```python
from src.calculator import Calculator

def test_add():
    calc = Calculator()
    assert calc.add(2, 3) == 5

def test_subtract():
    calc = Calculator()
    assert calc.subtract(10, 4) == 6

def test_divide_by_zero():
    calc = Calculator()
    with pytest.raises(ValueError):
        calc.divide(10, 0)
```

pytest의 장점:
- **클래스 불필요**: 함수만으로 테스트 작성 가능
- **assert 문 하나**: `assertEqual`, `assertTrue` 등 대신 단순 `assert`
- **assertion rewriting**: 실패 시 상세 diff 자동 표시
- **자동 디스커버리**: `test_` 접두사 파일/함수를 자동 수집
- **unittest 호환**: 기존 unittest 테스트도 pytest로 실행 가능

# 2. 설치 및 프로젝트 설정

## 2.1 설치

```bash
# uv 사용 (권장)
uv add --dev pytest

# pip 사용
pip install pytest
```

## 2.2 pyproject.toml 설정

`pyproject.toml`에서 pytest 옵션을 설정할 수 있다.

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"
markers = [
    "slow: 느린 테스트",
    "integration: 통합 테스트",
]
filterwarnings = ["ignore::DeprecationWarning"]
```

| 옵션 | 설명 |
|------|------|
| `testpaths` | 테스트 파일을 탐색할 디렉토리 |
| `addopts` | 기본 적용할 CLI 옵션 |
| `markers` | 커스텀 마커 정의 (경고 방지) |
| `filterwarnings` | 경고 필터 설정 |

## 2.3 테스트 디스커버리 규칙

pytest는 다음 규칙으로 테스트를 자동 수집한다.

| 대상 | 규칙 |
|------|------|
| 파일명 | `test_*.py` 또는 `*_test.py` |
| 함수명 | `test_`로 시작 |
| 클래스명 | `Test`로 시작 (`__init__` 없어야 함) |

`--collect-only` 옵션으로 수집된 테스트 목록을 미리 확인할 수 있다.

```bash
$ pytest --collect-only
<Module tests/test_basic.py>
  <Class TestBasicAssert>
    <Function test_add>
    <Function test_subtract>
    ...
```

# 3. 테스트 실행 및 CLI 옵션

```bash
# 전체 실행
pytest

# 특정 파일 실행
pytest tests/test_basic.py

# 특정 클래스 실행
pytest tests/test_basic.py::TestBasicAssert

# 특정 테스트 실행
pytest tests/test_basic.py::TestBasicAssert::test_add
```

주요 CLI 옵션:

| 옵션 | 설명 |
|------|------|
| `-v` | 상세 출력 (각 테스트명 표시) |
| `-s` | print 출력 표시 (캡처 비활성화) |
| `-x` | 첫 번째 실패 시 중단 |
| `-k "keyword"` | 키워드로 테스트 필터링 |
| `--tb=short` | 짧은 트레이스백 |

```bash
# 키워드 필터링: "add"가 포함된 테스트만 실행
$ pytest -k "add"
tests/test_basic.py::TestBasicAssert::test_add PASSED
tests/test_parametrize.py::TestParametrizeBasic::test_add[1-2-3] PASSED
...
```

# 4. assertion

## 4.1 기본 assert 문

pytest에서는 Python 내장 `assert` 문을 사용한다. pytest의 assertion rewriting 기능 덕분에 실패 시 상세한 비교 정보가 자동으로 표시된다.

```python
def test_add():
    calc = Calculator()
    assert calc.add(2, 3) == 5

def test_assert_with_message():
    calc = Calculator()
    result = calc.add(2, 3)
    assert result == 5, f"Expected 5 but got {result}"
```

리스트, 딕셔너리, 문자열 비교 시에도 어떤 요소가 다른지 자동으로 diff를 보여준다.

```python
# 실패 시 출력 예시:
# E       AssertionError: assert [1, 2, 3] == [1, 2, 4]
# E         At index 2 diff: 3 != 4
```

## 4.2 예외 및 근사값 검증

### pytest.raises

`pytest.raises`로 예외 발생을 검증한다.

```python
import pytest

def test_raises_기본():
    calc = Calculator()
    with pytest.raises(ValueError):
        calc.divide(10, 0)

def test_raises_메시지_검증():
    """match로 예외 메시지를 정규식으로 검증."""
    with pytest.raises(ValueError, match="0으로 나눌 수 없습니다"):
        divide(10, 0)

def test_raises_예외_객체_접근():
    """발생한 예외 객체에 접근할 수 있다."""
    with pytest.raises(ValueError) as exc_info:
        divide(10, 0)
    assert "0으로 나눌 수 없습니다" in str(exc_info.value)
```

### pytest.approx

부동소수점 비교 시 `pytest.approx`를 사용한다.

```python
def test_approx():
    assert 0.1 + 0.2 == pytest.approx(0.3)

def test_approx_상대_오차():
    assert 100.0 == pytest.approx(99.5, rel=0.01)  # 1% 이내

def test_approx_리스트():
    assert [0.1 + 0.2, 0.2 + 0.4] == pytest.approx([0.3, 0.6])
```

# 5. fixture와 conftest.py

## 5.1 fixture 기본

fixture는 테스트에 필요한 데이터나 객체를 제공하는 함수다. `@pytest.fixture` 데코레이터로 정의하고, 테스트 함수의 인자로 받아 사용한다.

```python
import pytest
from src.calculator import Calculator

@pytest.fixture
def calculator():
    return Calculator()

def test_add(calculator):
    """calculator fixture를 인자로 받아 사용."""
    assert calculator.add(2, 3) == 5
```

### scope

fixture의 생성/소멸 범위를 지정한다.

| scope | 설명 |
|-------|------|
| `function` | 각 테스트 함수마다 새로 생성 (기본값) |
| `class` | 테스트 클래스당 한 번 |
| `module` | 모듈(파일)당 한 번 |
| `session` | 전체 테스트 세션에서 한 번 |

```python
@pytest.fixture(scope="module")
def module_calculator():
    """모듈 전체에서 하나의 인스턴스를 공유."""
    print("\n[module_calculator] 생성됨")
    return Calculator()
```

## 5.2 fixture 고급 패턴

### yield fixture (setup + teardown)

`yield` 앞은 setup, 뒤는 teardown으로 동작한다.

```python
@pytest.fixture
def resource():
    # setup
    print("\n[setup] 리소스 초기화")
    data = {"connection": "open", "items": []}
    yield data
    # teardown
    print("\n[teardown] 리소스 정리")
    data["connection"] = "closed"
    data["items"].clear()

def test_yield_fixture(resource):
    assert resource["connection"] == "open"
    resource["items"].append("item1")
    assert len(resource["items"]) == 1
```

### autouse

`autouse=True`로 설정하면 테스트 함수에서 인자로 받지 않아도 자동 실행된다.

```python
@pytest.fixture(autouse=True)
def log_test_name(request):
    """각 테스트 시작 시 자동으로 실행."""
    print(f"\n▶ Running: {request.node.name}")
    yield
```

### fixture 간 의존성 주입

fixture가 다른 fixture를 인자로 받을 수 있다.

```python
@pytest.fixture
def base_number():
    return 10

@pytest.fixture
def doubled_number(base_number):
    """base_number fixture에 의존."""
    return base_number * 2

def test_fixture_chain(doubled_number):
    assert doubled_number == 20
```

## 5.3 conftest.py

`conftest.py`는 fixture를 여러 테스트 파일에서 공유하기 위한 파일이다.

### 디렉토리 계층별 적용 범위

```
tests/
├── conftest.py         # 전체 tests/ 하위에서 사용 가능
├── test_basic.py
├── test_fixture.py
└── sub/
    ├── conftest.py     # tests/sub/ 하위에서만 사용 가능
    └── test_sub.py
```

상위 `conftest.py`의 fixture는 하위 디렉토리에서도 접근 가능하지만, 하위 `conftest.py`의 fixture는 해당 디렉토리에서만 사용 가능하다.

```python
# tests/conftest.py
@pytest.fixture
def calculator():
    return Calculator()

# tests/sub/conftest.py
@pytest.fixture
def sub_only_fixture():
    return {"scope": "sub", "value": 42}

# tests/sub/test_sub.py
def test_두_fixture_동시_사용(calculator, sub_only_fixture):
    """상위 + 하위 conftest fixture를 동시에 사용."""
    result = calculator.multiply(sub_only_fixture["value"], 2)
    assert result == 84
```

# 6. parametrize와 마킹

## 6.1 parametrize (매개변수화 테스트)

`@pytest.mark.parametrize`로 여러 입력값에 대해 동일 테스트를 반복 실행한다.

### 기본 사용법

```python
@pytest.mark.parametrize("a, b, expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
])
def test_add(a, b, expected):
    calc = Calculator()
    assert calc.add(a, b) == expected
```

실행 결과에서 각 파라미터 조합이 별도 테스트로 표시된다.

```
test_add[1-2-3] PASSED
test_add[0-0-0] PASSED
test_add[-1-1-0] PASSED
test_add[100-200-300] PASSED
```

### 다중 파라미터 조합

`@pytest.mark.parametrize`를 여러 개 적용하면 모든 조합이 실행된다.

```python
@pytest.mark.parametrize("a", [1, 2])
@pytest.mark.parametrize("b", [10, 20])
def test_multiply_조합(a, b):
    """2 x 2 = 4가지 조합이 실행된다."""
    calc = Calculator()
    assert calc.multiply(a, b) == a * b
```

### pytest.param (케이스별 이름 지정)

```python
@pytest.mark.parametrize("a, b, expected", [
    pytest.param(2, 3, 5, id="양수-덧셈"),
    pytest.param(-1, -1, -2, id="음수-덧셈"),
    pytest.param(0, 0, 0, id="영-덧셈"),
])
def test_add_with_id(a, b, expected):
    calc = Calculator()
    assert calc.add(a, b) == expected
```

```
test_add_with_id[양수-덧셈] PASSED
test_add_with_id[음수-덧셈] PASSED
test_add_with_id[영-덧셈] PASSED
```

### indirect (fixture에 파라미터 전달)

`indirect=True`를 사용하면 parametrize 값이 fixture에 전달된다.

```python
@pytest.fixture
def input_value(request):
    """parametrize에서 전달된 값을 가공하여 반환."""
    return request.param * 2

@pytest.mark.parametrize("input_value, expected", [
    (5, 10),
    (3, 6),
], indirect=["input_value"])
def test_indirect(input_value, expected):
    assert input_value == expected
```

## 6.2 마킹 (`@pytest.mark`)

### skip / skipif

```python
@pytest.mark.skip(reason="아직 구현되지 않은 기능")
def test_skip():
    assert False

@pytest.mark.skipif(
    sys.platform == "win32",
    reason="Windows에서는 실행하지 않음",
)
def test_skipif():
    assert True
```

### xfail

실패가 예상되는 테스트에 사용한다.

```python
@pytest.mark.xfail(reason="known bug: 부동소수점 정밀도 이슈")
def test_xfail():
    assert 0.1 + 0.2 == 0.3  # 실패 → xfail 표시

@pytest.mark.xfail(strict=True)
def test_xfail_strict():
    """strict=True: 성공하면 오히려 테스트 실패로 처리."""
    assert 0.1 + 0.2 == 0.3
```

### 커스텀 마커

`pyproject.toml`에 마커를 등록하고 `-m` 옵션으로 필터링한다.

```toml
[tool.pytest.ini_options]
markers = [
    "slow: 느린 테스트",
    "integration: 통합 테스트",
]
```

```python
@pytest.mark.slow
def test_slow():
    total = sum(Calculator().add(i, i) for i in range(100))
    assert total == 9900

@pytest.mark.integration
def test_integration():
    calc = Calculator()
    result = calc.multiply(calc.add(2, 3), calc.subtract(10, 4))
    assert result == 30
```

```bash
# slow 마커 테스트만 실행
pytest -m slow

# slow가 아닌 테스트만 실행
pytest -m "not slow"

# slow 또는 integration
pytest -m "slow or integration"
```

# 7. 마무리

이 글에서 다룬 내용을 정리하면 다음과 같다.

- **unittest vs pytest**: pytest는 assert 문 하나로 검증하고 클래스가 불필요하다
- **설치 및 설정**: `uv add --dev pytest`, `pyproject.toml`에서 옵션 설정
- **CLI 옵션**: `-v`, `-s`, `-x`, `-k`, `--collect-only`
- **assertion**: assertion rewriting, `pytest.raises`, `pytest.approx`
- **fixture**: scope, yield, autouse, 의존성 주입
- **conftest.py**: 디렉토리 계층별 fixture 공유
- **parametrize**: 매개변수화 테스트, `pytest.param`, `indirect`
- **마킹**: skip, skipif, xfail, 커스텀 마커

다음 시리즈에서는 [mock과 monkeypatch를 활용한 외부 의존성 테스트 전략](/pytest-심화-mock과-monkeypatch)에 대해 다룰 예정이다.

> 전체 소스는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/pytest/intro)에서 확인할 수 있다.

## 참고

- https://docs.pytest.org/
- https://realpython.com/pytest-python-testing/
