---
title: "Python ABC와 Protocol: 인터페이스 설계의 두 가지 방법"
description: "Python ABC와 Protocol: 인터페이스 설계의 두 가지 방법"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - abc
  - protocol
  - abstract base class
  - 추상 클래스
  - 구조적 서브타이핑
  - typing
  - 파이썬
  - 인터페이스
series: "Python 타입 시스템 & 데이터 모델링"
---

> 전체 소스 코드는 [tutorials-python/python/abc-protocol](https://github.com/kenshin579/tutorials-python/tree/master/python/abc-protocol)을 참조한다.

# 1. 개요

Python에서 인터페이스를 설계하는 방법은 크게 두 가지가 있다.

- **ABC (Abstract Base Class)**: 상속을 통한 **명시적 서브타이핑(nominal subtyping)**. 하위 클래스가 반드시 ABC를 상속해야 한다.
- **Protocol**: 메서드 시그니처만 맞으면 호환되는 **구조적 서브타이핑(structural subtyping)**. Python의 duck typing을 타입 시스템으로 공식화한 개념이다.

Java나 Go의 인터페이스에 익숙하다면, ABC는 Java의 `abstract class`, Protocol은 Go의 `interface`와 유사하다고 생각하면 된다.

이 글에서는 두 방식의 사용법을 살펴보고, 어떤 상황에서 어떤 방식을 선택해야 하는지 비교한다.

# 2. ABC (Abstract Base Class)

## 2.1 ABC 기본 사용법

`abc` 모듈의 `ABC` 클래스를 상속하고 `@abstractmethod`로 추상 메서드를 정의한다. 추상 메서드를 구현하지 않으면 인스턴스 생성 시 `TypeError`가 발생한다.

```python
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

    def describe(self) -> str:
        """일반 메서드: 하위 클래스에서 그대로 사용 가능"""
        return f"I am a {self.__class__.__name__} and I say: {self.speak()}"

class Dog(Animal):
    def speak(self) -> str:
        return "Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return "Meow!"
```

ABC의 핵심은 **런타임 강제**다. 추상 메서드를 구현하지 않으면 인스턴스를 만들 수 없다.

```python
dog = Dog()
dog.describe()  # "I am a Dog and I say: Woof!"

Animal()  # TypeError: Can't instantiate abstract class Animal
           # with abstract method speak

# 추상 메서드를 구현하지 않은 하위 클래스도 마찬가지
class IncompleteAnimal(Animal):
    pass

IncompleteAnimal()  # TypeError
```

일반 메서드와 추상 메서드를 혼합할 수 있다. `describe()`처럼 기본 구현을 제공하면서, `speak()`은 하위 클래스에서 반드시 구현하도록 강제하는 패턴이 자주 사용된다.

## 2.2 @abstractmethod 활용

`@abstractmethod`는 `@property`, `@classmethod`, `@staticmethod`와 조합할 수 있다. 이때 `@abstractmethod`가 **가장 안쪽(아래쪽)**에 위치해야 한다.

### @abstractmethod + @property

```python
class Shape(ABC):
    @property
    @abstractmethod
    def area(self) -> float:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

class Circle(Shape):
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def area(self) -> float:
        return 3.14159 * self._radius ** 2

    @property
    def name(self) -> str:
        return "Circle"
```

### @abstractmethod + @classmethod

```python
class Serializable(ABC):
    @classmethod
    @abstractmethod
    def from_string(cls, data: str) -> "Serializable":
        pass

class User(Serializable):
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    @classmethod
    def from_string(cls, data: str) -> "User":
        name, age = data.split(",")
        return cls(name.strip(), int(age.strip()))

user = User.from_string("Alice, 30")
# User(name="Alice", age=30)
```

### @abstractmethod + @staticmethod

```python
class Validator(ABC):
    @staticmethod
    @abstractmethod
    def validate(value: str) -> bool:
        pass

class EmailValidator(Validator):
    @staticmethod
    def validate(value: str) -> bool:
        return "@" in value and "." in value

EmailValidator.validate("user@example.com")  # True
```

### super() 호출 패턴

추상 메서드에도 기본 구현을 제공할 수 있다. 하위 클래스에서 `super()`로 호출하면 기본 동작을 확장하는 패턴을 만들 수 있다.

```python
class Logger(ABC):
    @abstractmethod
    def log(self, message: str) -> str:
        """기본 포맷 제공"""
        return f"[LOG] {message}"

class FileLogger(Logger):
    def log(self, message: str) -> str:
        base = super().log(message)
        return f"{base} -> file"

class ConsoleLogger(Logger):
    def log(self, message: str) -> str:
        base = super().log(message)
        return f"{base} -> console"

FileLogger().log("hello")    # "[LOG] hello -> file"
ConsoleLogger().log("hello") # "[LOG] hello -> console"
```

## 2.3 collections.abc의 주요 ABC

Python 표준 라이브러리의 `collections.abc`는 자주 사용되는 ABC를 미리 정의해 두었다. 커스텀 컬렉션을 만들 때 이 ABC들을 상속하면 필수 메서드만 구현하면 나머지 메서드가 자동으로 제공된다.

| ABC | 필수 메서드 | 자동 제공 |
|-----|-----------|----------|
| `Iterable` | `__iter__` | - |
| `Iterator` | `__next__` | `__iter__` |
| `Sequence` | `__getitem__`, `__len__` | `__contains__`, `index`, `count`, `__reversed__` |
| `MutableSequence` | `__getitem__`, `__setitem__`, `__delitem__`, `__len__`, `insert` | `append`, `clear`, `reverse`, `extend`, `pop`, ... |
| `Mapping` | `__getitem__`, `__len__`, `__iter__` | `__contains__`, `keys`, `items`, `values`, `get`, ... |
| `Callable` | `__call__` | - |
| `Hashable` | `__hash__` | - |
| `Sized` | `__len__` | - |

예를 들어, `Sequence`를 상속하면 `__getitem__`과 `__len__`만 구현하면 `index`, `count`, `__contains__` 등이 자동으로 제공된다.

```python
from collections.abc import Sequence

class FixedList(Sequence):
    def __init__(self, *items):
        self._items = list(items)

    def __getitem__(self, index):
        return self._items[index]

    def __len__(self):
        return len(self._items)

fl = FixedList(10, 20, 30, 20)
fl.index(20)  # 1  (자동 제공)
fl.count(20)  # 2  (자동 제공)
30 in fl      # True (자동 제공)
```

내장 타입들은 이미 `collections.abc`에 등록되어 있다.

```python
from collections.abc import MutableSequence, Sequence, Mapping, Sized, Callable

isinstance([1, 2], MutableSequence)  # True
isinstance((1, 2), Sequence)         # True
isinstance({"a": 1}, Mapping)        # True
isinstance("hello", Sized)           # True
isinstance(len, Callable)            # True
```

### __subclasshook__으로 가상 하위 클래스 자동 인식

`__subclasshook__`를 정의하면 상속이나 `register()` 없이도 특정 조건을 만족하는 클래스를 자동으로 하위 클래스로 인식할 수 있다.

```python
from abc import ABCMeta

class Closeable(metaclass=ABCMeta):
    @classmethod
    def __subclasshook__(cls, subclass):
        if cls is Closeable:
            if hasattr(subclass, "close") and callable(subclass.close):
                return True
        return NotImplemented

class FileWrapper:
    def close(self):
        pass

isinstance(FileWrapper(), Closeable)  # True (close() 메서드가 있으므로)
```

### register()로 기존 클래스에 ABC 등록

외부 라이브러리 클래스처럼 수정할 수 없는 클래스를 ABC의 하위 클래스로 등록할 수 있다. 단, `register()`는 MRO에 영향을 주지 않는 **가상 하위 클래스(virtual subclass)** 등록이다.

```python
from abc import ABCMeta

class Printable(metaclass=ABCMeta):
    pass

class Document:
    def render(self) -> str:
        return "Document content"

Printable.register(Document)

isinstance(Document(), Printable)  # True
Printable in Document.__mro__      # False (MRO에는 포함되지 않음)
```

# 3. Protocol (구조적 서브타이핑)

## 3.1 Protocol 기본 사용법

`typing.Protocol`을 상속하여 메서드 시그니처만 선언하면 된다. 구현 클래스는 **Protocol을 상속하지 않아도** 메서드만 맞으면 호환된다. Python 3.8부터 사용 가능하다.

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> str: ...

class Circle:
    def __init__(self, radius: float):
        self.radius = radius

    def draw(self) -> str:
        return f"Drawing circle with radius {self.radius}"

class Square:
    def __init__(self, side: float):
        self.side = side

    def draw(self) -> str:
        return f"Drawing square with side {self.side}"
```

`Circle`과 `Square`는 `Drawable`을 상속하지 않았지만, `draw()` 메서드가 있으므로 `Drawable` 타입으로 사용할 수 있다.

```python
def render(item: Drawable) -> str:
    return item.draw()

render(Circle(5))   # "Drawing circle with radius 5"
render(Square(4))   # "Drawing square with side 4"
```

### Protocol에 속성 정의

메서드뿐만 아니라 속성도 Protocol에 정의할 수 있다.

```python
class Named(Protocol):
    name: str

class Person:
    def __init__(self, name: str):
        self.name = name

class Robot:
    def __init__(self, serial: str):
        self.name = f"Robot-{serial}"

def greet(entity: Named) -> str:
    return f"Hello, {entity.name}!"

greet(Person("Alice"))  # "Hello, Alice!"
greet(Robot("X100"))    # "Hello, Robot-X100!"
```

### Protocol 조합

여러 Protocol을 조합하여 복합 인터페이스를 만들 수 있다.

```python
class Resizable(Protocol):
    def resize(self, factor: float) -> None: ...

class Widget(Drawable, Resizable, Protocol):
    pass

def process_widget(widget: Widget) -> str:
    widget.resize(2.0)
    return widget.draw()
```

## 3.2 runtime_checkable Protocol

기본적으로 Protocol은 타입 체커(mypy 등)만 검사하고, 런타임에서 `isinstance()` 검사는 불가능하다. `@runtime_checkable`을 붙이면 런타임 검사가 가능해진다.

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

class DatabaseConnection:
    def close(self) -> None:
        pass

isinstance(DatabaseConnection(), Closeable)  # True
```

### 제한사항: 메서드 존재 여부만 확인

`runtime_checkable`은 메서드의 **존재 여부만** 확인한다. 시그니처(매개변수, 반환 타입)는 검사하지 않는다.

```python
class FakeCloseable:
    def close(self, force: bool = False) -> str:  # 시그니처가 다름
        return "closed"

isinstance(FakeCloseable(), Closeable)  # True (메서드 이름만 확인)
```

시그니처까지 정확하게 검증하려면 `mypy` 같은 정적 타입 체커를 사용해야 한다.

### @runtime_checkable이 없으면 isinstance() 사용 불가

```python
class NonCheckable(Protocol):
    def process(self) -> None: ...

class Impl:
    def process(self) -> None:
        pass

isinstance(Impl(), NonCheckable)  # TypeError!
```

### 활용: 안전한 유틸리티 함수

`runtime_checkable`을 활용하면 타입에 따라 안전하게 분기하는 유틸리티를 만들 수 있다.

```python
def safe_close(obj: object) -> bool:
    if isinstance(obj, Closeable):
        obj.close()
        return True
    return False

safe_close(DatabaseConnection())  # True
safe_close("not closeable")       # False
```

# 4. ABC vs Protocol 비교

| 특성 | ABC | Protocol |
|------|-----|----------|
| **서브타이핑** | 명시적 (nominal) | 구조적 (structural) |
| **상속 필요** | 필수 | 불필요 |
| **런타임 강제** | `TypeError` 발생 | 없음 (타입 체커가 검사) |
| **isinstance()** | 항상 가능 | `@runtime_checkable` 필요 |
| **서드파티 클래스** | `register()` 필요 | 메서드만 맞으면 호환 |
| **코드 결합도** | 높음 (상속 의존) | 낮음 (구조만 일치) |
| **도입 시점** | Python 2.6 | Python 3.8 |

```python
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

# ABC 방식: 반드시 상속 필요
class NotifierABC(ABC):
    @abstractmethod
    def send(self, message: str) -> str:
        pass

class EmailNotifierABC(NotifierABC):  # 상속 필수
    def send(self, message: str) -> str:
        return f"[Email] {message}"

# Protocol 방식: 상속 불필요
@runtime_checkable
class NotifierProtocol(Protocol):
    def send(self, message: str) -> str: ...

class EmailNotifierProto:  # 상속 없음
    def send(self, message: str) -> str:
        return f"[Email] {message}"
```

가장 큰 차이는 **서드파티 클래스와의 호환성**이다.

```python
class ThirdPartyNotifier:
    """외부 라이브러리 클래스 (수정 불가)"""
    def send(self, message: str) -> str:
        return f"[ThirdParty] {message}"

# ABC: 상속하지 않았으므로 호환 불가
isinstance(ThirdPartyNotifier(), NotifierABC)       # False

# Protocol: send() 메서드가 있으므로 호환
isinstance(ThirdPartyNotifier(), NotifierProtocol)   # True
```

### 선택 기준

- **ABC를 선택하는 경우**: 구현을 강제해야 하고, 기본 구현을 제공하며, 상속 계층이 명확한 내부 코드
- **Protocol을 선택하는 경우**: 외부 라이브러리와의 호환성이 필요하고, 느슨한 결합을 원하며, duck typing을 타입 시스템으로 보강하고 싶은 경우

# 5. 실전 패턴

## 5.1 플러그인 시스템 (Protocol)

Protocol은 플러그인 시스템처럼 **확장 가능한 인터페이스**를 정의할 때 적합하다. 플러그인 개발자가 특정 클래스를 상속할 필요 없이 메서드만 구현하면 된다.

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Plugin(Protocol):
    name: str
    def execute(self, data: dict) -> dict: ...

class LoggingPlugin:
    name = "logging"

    def execute(self, data: dict) -> dict:
        data["logged"] = True
        return data

class ValidationPlugin:
    name = "validation"

    def execute(self, data: dict) -> dict:
        if "value" in data and isinstance(data["value"], int) and data["value"] > 0:
            data["valid"] = True
        else:
            data["valid"] = False
        return data

class PluginManager:
    def __init__(self):
        self._plugins: list[Plugin] = []

    def register(self, plugin: Plugin) -> None:
        if isinstance(plugin, Plugin):
            self._plugins.append(plugin)
        else:
            raise TypeError(f"{type(plugin).__name__} does not satisfy Plugin protocol")

    def run(self, data: dict) -> dict:
        for plugin in self._plugins:
            data = plugin.execute(data)
        return data

manager = PluginManager()
manager.register(LoggingPlugin())
manager.register(ValidationPlugin())
result = manager.run({"value": 5})
# {"value": 5, "logged": True, "valid": True}
```

## 5.2 Repository 패턴 (ABC)

Repository 패턴처럼 **데이터 접근 계층을 추상화**할 때는 ABC가 적합하다. 필수 메서드 구현을 강제하면서 공통 유틸리티 메서드(`exists()`)를 기본 구현으로 제공할 수 있다.

```python
from abc import ABC, abstractmethod

class Entity:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

class Repository(ABC):
    @abstractmethod
    def find_by_id(self, id: int) -> Entity | None:
        pass

    @abstractmethod
    def find_all(self) -> list[Entity]:
        pass

    @abstractmethod
    def save(self, entity: Entity) -> None:
        pass

    @abstractmethod
    def delete(self, id: int) -> bool:
        pass

    def exists(self, id: int) -> bool:
        """일반 메서드: 기본 구현 제공"""
        return self.find_by_id(id) is not None

class InMemoryRepository(Repository):
    def __init__(self):
        self._store: dict[int, Entity] = {}

    def find_by_id(self, id: int) -> Entity | None:
        return self._store.get(id)

    def find_all(self) -> list[Entity]:
        return list(self._store.values())

    def save(self, entity: Entity) -> None:
        self._store[entity.id] = entity

    def delete(self, id: int) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False

repo = InMemoryRepository()
repo.save(Entity(1, "Alice"))
repo.exists(1)       # True (기본 구현 활용)
repo.find_by_id(1)   # Entity(id=1, name='Alice')
```

실제 프로젝트에서는 `InMemoryRepository` 외에 `SQLRepository`, `MongoRepository` 등을 같은 ABC를 상속하여 구현하고, DI로 주입하는 방식으로 사용한다.

# 6. 마무리

Python에서 인터페이스를 설계하는 두 가지 방법을 살펴보았다.

- **ABC**: 상속 기반의 명시적 계약. 런타임에 구현을 강제하고, 기본 구현을 제공할 수 있다. `collections.abc`처럼 표준 라이브러리에서도 널리 사용된다.
- **Protocol**: 구조 기반의 암묵적 계약. duck typing을 타입 시스템으로 공식화하여, 상속 없이도 인터페이스 호환성을 보장한다.

둘 중 하나만 사용해야 하는 것은 아니다. 프로젝트 내부의 핵심 추상화에는 ABC를, 외부 연동이나 플러그인 인터페이스에는 Protocol을 사용하는 것이 일반적인 패턴이다.
