# Implementation: Python Decorator 완벽 가이드

## 1. 샘플 코드 구현 (tutorials-python)

### 1.1 디렉토리 구조

```
tutorials-python/python/decorator/
├── pyproject.toml
├── src/
│   └── decorator_examples/
│       ├── __init__.py
│       ├── basic.py              # 1장: 기초 (일급 함수, 클로저, 기본 데코레이터)
│       ├── advanced.py           # 2장: 심화 (팩토리, 클래스, 체이닝)
│       └── patterns.py           # 3장: 실전 패턴 (로깅, 캐싱, retry 등)
└── tests/
    ├── __init__.py
    ├── test_basic.py
    ├── test_advanced.py
    └── test_patterns.py
```

### 1.2 basic.py - 데코레이터 기초

```python
import functools

# --- 1.1 일급 함수 & 클로저 ---
def first_class_demo():
    """함수를 인자로 전달하고 반환하는 예시"""
    def greet(name: str) -> str:
        return f"Hello, {name}!"

    def call_func(func, arg):
        return func(arg)

    return call_func(greet, "World")


def closure_demo():
    """클로저로 외부 변수를 캡처하는 예시"""
    def outer(message: str):
        def inner(name: str) -> str:
            return f"{message}, {name}!"
        return inner

    hello = outer("Hello")
    return hello("Python")  # "Hello, Python!"


# --- 1.2 함수 데코레이터 기본 ---
def simple_decorator(func):
    """기본 데코레이터 - @wraps 없이"""
    def wrapper(*args, **kwargs):
        print(f"Before: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"After: {func.__name__}")
        return result
    return wrapper


# --- 1.3 functools.wraps ---
def proper_decorator(func):
    """@wraps 적용 데코레이터"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Before: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"After: {func.__name__}")
        return result
    return wrapper
```

### 1.3 advanced.py - 데코레이터 심화

```python
import functools

# --- 2.1 데코레이터 팩토리 ---
def repeat(n: int = 2):
    """인자를 받는 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(n):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator


def flexible_decorator(func=None, *, n: int = 2):
    """@decorator / @decorator() 모두 지원"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(n):
                result = func(*args, **kwargs)
            return result
        return wrapper

    if func is not None:
        return decorator(func)
    return decorator


# --- 2.2 클래스 데코레이터 ---
class CountCalls:
    """__call__로 상태를 유지하는 데코레이터"""
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)


def add_method(cls):
    """클래스를 대상으로 하는 데코레이터"""
    cls.greet = lambda self: f"Hello from {cls.__name__}"
    return cls


# --- 2.3 데코레이터 체이닝 ---
def bold(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<b>{func(*args, **kwargs)}</b>"
    return wrapper


def italic(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<i>{func(*args, **kwargs)}</i>"
    return wrapper
```

### 1.4 patterns.py - 실전 활용 패턴

```python
import functools
import logging
import time
from functools import lru_cache

logger = logging.getLogger(__name__)

# --- 3.1 로깅 ---
def log_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"Calling {func.__name__}(args={args}, kwargs={kwargs})")
        result = func(*args, **kwargs)
        logger.info(f"{func.__name__} returned {result}")
        return result
    return wrapper


# --- 3.2 캐싱 ---
# lru_cache 사용 예시는 테스트에서 직접 @lru_cache 적용

def ttl_cache(seconds: int = 60):
    """TTL 기반 커스텀 캐시"""
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        def wrapper(*args):
            now = time.time()
            if args in cache:
                result, timestamp = cache[args]
                if now - timestamp < seconds:
                    return result
            result = func(*args)
            cache[args] = (result, now)
            return result
        return wrapper
    return decorator


# --- 3.3 retry ---
def retry(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """지수 백오프 retry 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator


# --- 3.4 실행 시간 측정 ---
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper


# --- 3.5 입력값 검증 ---
def validate_types(**type_hints):
    """인자 타입 검증 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for name, expected_type in type_hints.items():
                if name in kwargs:
                    value = kwargs[name]
                elif name in func.__code__.co_varnames:
                    idx = list(func.__code__.co_varnames).index(name)
                    if idx < len(args):
                        value = args[idx]
                    else:
                        continue
                else:
                    continue
                if not isinstance(value, expected_type):
                    raise TypeError(
                        f"{name} must be {expected_type.__name__}, got {type(value).__name__}"
                    )
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

---

## 2. 블로그 글 구현

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/
  python-decorator-완벽-가이드/
    index.md
```

### 2.2 Frontmatter

```yaml
---
title: "Python Decorator 완벽 가이드: 원리부터 실전 패턴까지"
description: "Python 데코레이터의 동작 원리(일급 함수, 클로저)부터 데코레이터 팩토리, 클래스 데코레이터, 실전 활용 패턴(로깅, 캐싱, retry)까지 체계적으로 정리한다"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - decorator
  - functools
  - design-pattern
  - closure
series: "Python 함수형 패턴"
---
```

### 2.3 글 구조

| # | 섹션 | 핵심 내용 |
|---|------|----------|
| 1 | 데코레이터 기초 | |
| 1.1 | 데코레이터란? | 일급 함수, 클로저 복습, `@` 문법 = `func = decorator(func)` |
| 1.2 | 함수 데코레이터 기본 | wrapper 패턴, `*args/**kwargs`, 반환값 처리 |
| 1.3 | `functools.wraps`의 역할 | 메타데이터 보존, `__wrapped__` 속성 |
| 2 | 데코레이터 심화 | |
| 2.1 | 인자를 받는 데코레이터 | 3중 중첩 구조, 인자 선택적 데코레이터 |
| 2.2 | 클래스 데코레이터 | `__call__` 상태 유지, 클래스 대상 데코레이터 |
| 2.3 | 데코레이터 체이닝 | 적용/실행 순서, 시각화 |
| 3 | 실전 활용 패턴 | |
| 3.1 | 로깅 데코레이터 | 함수 호출/반환 자동 기록 |
| 3.2 | 캐싱 데코레이터 | `@lru_cache`, TTL 기반 커스텀 캐시 |
| 3.3 | retry 데코레이터 | 지수 백오프, 재시도 횟수 제한 |
| 3.4 | 실행 시간 측정 | `time.perf_counter()` |
| 3.5 | 입력값 검증 데코레이터 | 타입 검증 |
| 4 | 표준 라이브러리 데코레이터 정리 | |
| 4.1 | 프로퍼티 관련 | `@property`, `@setter`, `@deleter` |
| 4.2 | 메서드 관련 | `@staticmethod` vs `@classmethod` |
| 4.3 | 클래스/함수 유틸리티 | `@dataclass`, `@total_ordering`, `@singledispatch` |
| 5 | 참고 | 레퍼런스 링크 |

### 2.4 다이어그램

- **데코레이터 동작 원리**: `flowchart LR` (함수 → 데코레이터 → wrapper)
- **3중 중첩 구조 시각화**: `flowchart TB` (decorator_factory → decorator → wrapper)
- **체이닝 실행 순서**: `flowchart TB` (@bold → @italic → func → italic → bold)

### 2.5 섹션별 핵심 요소

**섹션 1.3 - @wraps 전후 비교표**:

| 항목 | `@wraps` 없음 | `@wraps` 있음 |
|------|--------------|--------------|
| `__name__` | `wrapper` | 원본 함수명 |
| `__doc__` | `None` | 원본 docstring |
| `__wrapped__` | 없음 | 원본 함수 참조 |

**섹션 4 - 표준 라이브러리 데코레이터 요약표**:

| 데코레이터 | 모듈 | 용도 |
|-----------|------|------|
| `@property` | 내장 | getter/setter/deleter 체인 |
| `@staticmethod` | 내장 | 인스턴스 불필요 메서드 |
| `@classmethod` | 내장 | 클래스를 첫 인자로 받는 메서드 |
| `@dataclass` | `dataclasses` | 데이터 클래스 자동 생성 |
| `@total_ordering` | `functools` | 비교 연산자 자동 완성 |
| `@singledispatch` | `functools` | 타입 기반 함수 오버로딩 |
| `@lru_cache` | `functools` | 메모이제이션 캐시 |
