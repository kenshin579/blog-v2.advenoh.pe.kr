---
title: "Python Type Hints 실전 가이드"
description: "typing 모듈의 핵심 기능과 mypy를 활용한 점진적 타이핑 전략을 다룹니다. 기본 타입부터 제네릭, Protocol, TypedDict까지 실전 예제와 함께 정리합니다"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - type-hints
  - typing
  - mypy
  - protocol
  - typeddict
series: "Python 타입 시스템 & 데이터 모델링"
---

# 1. 타입 힌트 기본

## 1.1 내장 타입과 컬렉션

Python 3.0부터 함수 어노테이션이 도입되었고, 3.5에서 `typing` 모듈이 추가되면서 본격적인 타입 힌트 시대가 열렸다.

```python
# 내장 타입
name: str = "Alice"
age: int = 30
height: float = 165.5
is_active: bool = True
data: bytes = b"hello"
```

Python 3.9+부터 내장 컬렉션 타입을 직접 제네릭으로 사용할 수 있다.

```python
# Python 3.9+ 소문자 제네릭 (권장)
numbers: list[int] = [1, 2, 3]
config: dict[str, Any] = {"host": "localhost", "port": 8080}
point: tuple[int, int] = (10, 20)
tags: set[str] = {"python", "typing"}

# 가변 길이 튜플
variable: tuple[int, ...] = (1, 2, 3, 4, 5)

# 중첩 컬렉션
matrix: list[list[int]] = [[1, 2], [3, 4]]
nested: dict[str, list[int]] = {"scores": [90, 85, 92]}
```

| Python 버전 | 구문 | 비고 |
|---|---|---|
| 3.5~3.8 | `typing.List[int]` | typing 모듈 필요 |
| 3.9+ | `list[int]` | 내장 타입 직접 사용 (권장) |
| 3.10+ | `X \| Y` | Union 대신 파이프 연산자 |
| 3.12+ | `type X = ...` | type 문법으로 별칭 정의 |

## 1.2 함수 시그니처

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

def add(a: int, b: int) -> int:
    return a + b

def print_message(msg: str) -> None:
    """반환값 없는 함수는 -> None"""
    print(msg)

def process_items(items: list[str], limit: int = 10) -> list[str]:
    """기본값이 있는 매개변수"""
    return items[:limit]
```

## 1.3 Optional, Union, Literal

### Optional — None이 될 수 있는 타입

```python
# Python 3.10+: X | None (권장)
def find_user(user_id: int) -> str | None:
    users = {1: "Alice", 2: "Bob"}
    return users.get(user_id)

# 매개변수에서 사용
def greet_user(name: str | None = None) -> str:
    if name is None:
        return "Hello, Guest!"
    return f"Hello, {name}!"
```

### Union — 여러 타입 중 하나

```python
# Python 3.10+: X | Y (권장)
def process_id(id_value: int | str) -> str:
    if isinstance(id_value, int):
        return f"ID-{id_value:06d}"
    return id_value.upper()
```

### Literal — 허용 값 제한

```python
from typing import Literal

Mode = Literal["read", "write", "append"]

def open_file(path: str, mode: Mode = "read") -> str:
    return f"Opening {path} in {mode} mode"

# mypy가 허용되지 않는 값을 잡아냄
open_file("data.txt", "read")    # OK
open_file("data.txt", "delete")  # mypy error!
```

# 2. 제네릭과 고급 타입

## 2.1 TypeVar와 Generic

### 제네릭 함수

`TypeVar`를 사용하면 입력 타입에 따라 반환 타입이 결정되는 제네릭 함수를 작성할 수 있다.

```python
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:
    """리스트의 첫 번째 요소 — 타입이 보존됨"""
    return items[0]

first([1, 2, 3])      # int로 추론
first(["a", "b"])      # str로 추론
```

### TypeVar with bound — 상한 제약

```python
class Animal:
    def speak(self) -> str: ...

class Dog(Animal):
    def speak(self) -> str:
        return "Woof!"

A = TypeVar("A", bound=Animal)

def make_speak(animal: A) -> str:
    """Animal 또는 하위 클래스만 허용"""
    return animal.speak()
```

### Generic 클래스

```python
from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

stack: Stack[int] = Stack()
stack.push(1)        # OK
stack.push("hello")  # mypy error!
```

## 2.2 Protocol (구조적 서브타이핑 개요)

`Protocol`은 duck typing에 타입 안전성을 부여한다. 상속 없이 **필요한 메서드만 정의**하면 된다.

```python
from typing import Protocol, runtime_checkable

class Drawable(Protocol):
    def draw(self) -> str: ...

class Circle:
    def draw(self) -> str:
        return "○"

def render(shape: Drawable) -> str:
    return shape.draw()

render(Circle())  # OK — Circle은 draw()가 있으므로 Drawable
```

`@runtime_checkable`을 붙이면 `isinstance()` 검사도 가능하다.

```python
@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

isinstance(open("file.txt"), Closeable)  # True
```

> Protocol의 상세 내용은 별도 포스팅(ABC와 Protocol 편)에서 다룬다.

## 2.3 Callable, Awaitable

### Callable — 함수/콜백 타입

```python
from collections.abc import Callable

def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

apply(lambda x, y: x + y, 3, 5)  # 8

# 임의 인자 허용
def log_call(func: Callable[..., str]) -> Callable[..., str]:
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        print(f"[log] {func.__name__} → {result}")
        return result
    return wrapper

# Callable을 반환하는 함수
def create_multiplier(factor: int) -> Callable[[int], int]:
    return lambda x: x * factor
```

### Awaitable — 비동기 함수 타입

```python
from collections.abc import Awaitable

async def process_async(task: Awaitable[str]) -> str:
    result = await task
    return result.upper()
```

# 3. 유틸리티 타입

## 3.1 TypeAlias

복잡한 타입에 별칭을 부여하여 가독성을 높인다.

```python
# Python 3.12+ type 문법 (권장)
type Vector = list[float]
type Matrix = list[Vector]
type JSON = dict[str, "JSON"] | list["JSON"] | str | int | float | bool | None

def dot_product(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))
```

## 3.2 TypeGuard

타입 가드 함수로 **타입 좁히기(narrowing)**를 수행한다.

```python
from typing import TypeGuard

def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    """True 반환 시 val의 타입이 list[str]로 좁혀짐"""
    return all(isinstance(x, str) for x in val)

def process(items: list[object]) -> str:
    if is_str_list(items):
        return ", ".join(items)  # items는 list[str]로 추론
    return str(items)
```

## 3.3 TypedDict

키별로 다른 타입을 가진 딕셔너리를 정의한다.

```python
from typing import TypedDict, Required, NotRequired

class UserProfile(TypedDict):
    name: str
    age: int
    email: str

# Python 3.11+: Required / NotRequired
class APIResponse(TypedDict):
    status: Required[int]
    data: Required[dict[str, object]]
    error: NotRequired[str]
    metadata: NotRequired[dict[str, str]]

user: UserProfile = {"name": "Alice", "age": 30, "email": "a@b.com"}  # OK
user: UserProfile = {"name": "Alice"}  # mypy error: Missing keys
```

# 4. 타입 검사 도구와 실전 적용

## 4.1 mypy 설정 및 활용

### pyproject.toml 설정

```toml
[tool.mypy]
python_version = "3.12"
strict = true

# per-module 설정
[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[[tool.mypy.overrides]]
module = "third_party_lib.*"
ignore_missing_imports = true
```

### 핵심 옵션

| 옵션 | 설명 |
|------|------|
| `strict = true` | 모든 strict 옵션 활성화 |
| `disallow_untyped_defs` | 타입 없는 함수 정의 금지 |
| `warn_return_any` | Any 반환 시 경고 |
| `disallow_any_generics` | `list` 대신 `list[int]` 강제 |
| `check_untyped_defs` | 타입 없는 함수 내부도 검사 |

### mypy 에러 메시지 읽기

```python
# error: Incompatible types in assignment
result: str = add(1, 2)  # add는 int 반환

# error: Item "None" has no attribute "upper"
value = find_user(1)     # str | None
print(value.upper())     # None일 수 있음!

# 올바른 방법: None 체크
if value is not None:
    print(value.upper())  # OK
```

### `# type: ignore` 사용 가이드

```python
import untyped_library  # type: ignore[import-untyped]

result = dynamic_func()  # type: ignore[no-any-return]
```

> 가능하면 `# type: ignore`를 피하고, 에러 코드를 명시하여 범위를 제한한다.

## 4.2 정적 vs 런타임 타입 검사

| 도구 | 종류 | 특징 |
|------|------|------|
| **mypy** | 정적 | Python 공식, 가장 넓은 생태계 |
| **pyright** | 정적 | Microsoft, VS Code 통합, 빠름 |
| **pytype** | 정적 | Google, 타입 추론 강력 |
| **isinstance()** | 런타임 | 내장, Protocol과 조합 가능 |
| **beartype** | 런타임 | 데코레이터 기반, 빠름 |
| **typeguard** | 런타임 | 함수 호출 시 타입 검증 |

**추천 조합**: mypy (정적) + isinstance (런타임, 필요 시)

## 4.3 점진적 타이핑 전략

기존 프로젝트에 타입 힌트를 한 번에 추가하는 것은 비현실적이다. 단계적으로 적용한다.

```mermaid
flowchart LR
    A["1단계\nmypy --strict=false"] --> B["2단계\n공개 API 타입 추가"]
    B --> C["3단계\n모듈 단위 strict"]
    C --> D["4단계\n전체 strict"]
```

### 1단계: 느슨하게 시작

```toml
[tool.mypy]
python_version = "3.12"
# strict = false (기본값)
warn_return_any = true
```

### 2단계: 공개 API부터 타입 추가

- 함수 시그니처(매개변수, 반환 타입)부터 추가
- 내부 구현은 나중에

### 3단계: 모듈 단위 strict 적용

```toml
[[tool.mypy.overrides]]
module = "myapp.core.*"
strict = true

[[tool.mypy.overrides]]
module = "myapp.legacy.*"
ignore_errors = true
```

### 4단계: 전체 strict

```toml
[tool.mypy]
strict = true
```

### stub 파일 (.pyi) 활용

타입이 없는 서드파티 라이브러리에 타입 정보를 제공한다.

```python
# third_party.pyi
def process(data: dict[str, int]) -> list[str]: ...
```

# 5. 마무리

| 개념 | 핵심 |
|------|------|
| 기본 타입 | `int`, `str`, `list[int]`, `dict[str, Any]` |
| Optional/Union | `X \| None`, `X \| Y` (3.10+) |
| Literal | 허용 값 제한 |
| TypeVar/Generic | 제네릭 함수/클래스 |
| Protocol | 구조적 서브타이핑 (duck typing + 타입 안전성) |
| Callable | 함수/콜백 타입 |
| TypeAlias | 복잡한 타입 별칭 |
| TypeGuard | 타입 좁히기 |
| TypedDict | 키별 타입이 다른 딕셔너리 |
| mypy | 정적 타입 검사 도구 |

> 전체 샘플 코드는 [GitHub - tutorials-python/python/type-hints](https://github.com/kenshin579/tutorials-python/tree/master/python/type-hints)에서 확인할 수 있다.

# 6. 참고

- [Python 공식 문서 - typing](https://docs.python.org/3/library/typing.html)
- [mypy 공식 문서](https://mypy.readthedocs.io/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
- [PEP 544 - Protocols](https://peps.python.org/pep-0544/)
- [PEP 589 - TypedDict](https://peps.python.org/pep-0589/)
- [PEP 604 - Allow X | Y syntax](https://peps.python.org/pep-0604/)
- [PEP 695 - Type Parameter Syntax](https://peps.python.org/pep-0695/)
