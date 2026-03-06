# Implementation: Python Context Manager (with 문)

## 블로그 글 구조

### 파일 경로
- **블로그 글**: `docs/start/python-context-manager-with문-완벽-가이드/index.md`
- **샘플 코드**: `tutorials-python/python/context-manager/`

### Frontmatter
```yaml
---
title: "Python Context Manager 완벽 가이드: with 문부터 contextlib까지"
description: "Python의 with 문 동작 원리, __enter__/__exit__ 프로토콜, contextlib 모듈 활용법을 실전 예제와 함께 정리한다"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - context manager
  - with
  - contextlib
  - 파이썬
series: "Python 함수형 패턴"
---
```

## 목차 구성

```
# 1. 개요
# 2. with 문의 동작 원리
  ## 2.1 `with expr as var:` 실행 흐름
  ## 2.2 예외 발생 시 `__exit__` 호출 보장
# 3. `__enter__` / `__exit__` 프로토콜
  ## 3.1 프로토콜 구조
  ## 3.2 `__exit__`의 예외 억제
  ## 3.3 클래스 기반 context manager 구현
# 4. `contextlib.contextmanager` 데코레이터
  ## 4.1 yield 기반 context manager
  ## 4.2 try/finally 패턴
# 5. `contextlib` 유틸리티
  ## 5.1 `suppress()` - 예외 무시
  ## 5.2 `redirect_stdout` / `redirect_stderr`
  ## 5.3 `closing()` - close() 자동 호출
  ## 5.4 `nullcontext()` - 조건부 적용
# 6. 중첩 Context Manager (`ExitStack`)
  ## 6.1 동적 개수 관리
  ## 6.2 `enter_context()`와 `callback()`
  ## 6.3 cleanup 순서 (LIFO)
# 7. 비동기 Context Manager
  ## 7.1 `async with`와 `__aenter__`/`__aexit__`
  ## 7.2 `asynccontextmanager` 데코레이터
  ## 7.3 `AsyncExitStack`
# 8. 실전 활용 패턴
  ## 8.1 DB 트랜잭션 관리
  ## 8.2 여러 파일 동시 처리
  ## 8.3 락 관리 (`threading.Lock`)
  ## 8.4 임시 리소스 관리
  ## 8.5 실행 시간 측정
# 9. 마무리
# 10. 참고
```

## 샘플 코드 구성

### 디렉토리: `tutorials-python/python/context-manager/`

| 파일 | 내용 |
|---|---|
| `basic_with.py` | with 문 기본 동작, as 절 반환값 확인 |
| `custom_context_manager.py` | 클래스 기반 `__enter__`/`__exit__` 직접 구현 |
| `contextmanager_decorator.py` | `@contextmanager` 데코레이터 활용, try/finally |
| `contextlib_utils.py` | `suppress`, `redirect_stdout`, `closing`, `nullcontext` 예제 |
| `exit_stack_example.py` | `ExitStack`으로 동적 context manager 관리 |
| `async_context_manager.py` | `asynccontextmanager`, `AsyncExitStack` 예제 |
| `practical_examples.py` | DB 트랜잭션, 파일 처리, 락, 임시 리소스, 시간 측정 |

### 핵심 예제 코드 스니펫

**클래스 기반 context manager:**
```python
class ManagedResource:
    def __enter__(self):
        print("리소스 획득")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("리소스 해제")
        return False  # 예외 전파
```

**@contextmanager 데코레이터:**
```python
from contextlib import contextmanager

@contextmanager
def managed_resource():
    print("리소스 획득")
    try:
        yield "resource"
    finally:
        print("리소스 해제")
```

**ExitStack 동적 관리:**
```python
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(f)) for f in file_list]
    # 모든 파일이 LIFO 순서로 자동 닫힘
```

**실행 시간 측정:**
```python
@contextmanager
def timer(label=""):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}초")
```

## 참고 자료
- https://docs.python.org/3/library/contextlib.html
- https://realpython.com/python-with-statement/
