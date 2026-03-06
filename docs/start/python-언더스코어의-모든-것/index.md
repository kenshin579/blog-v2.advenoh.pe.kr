---
title: "Python 언더스코어의 모든 것"
description: "Python 언더스코어의 모든 것"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - underscore
  - naming-convention
  - dunder
  - name-mangling
  - pep8
  - 파이썬
  - 언더스코어
series: "Python 문법 Tips"
---

# 1. 들어가며

Python에서 언더스코어(`_`)는 단순한 문자 이상의 의미를 가진다. 변수명, 클래스 설계, 모듈 구조, 심지어 숫자 리터럴에서까지 다양한 역할을 수행한다. 같은 `_` 기호지만 위치와 개수에 따라 완전히 다른 의미를 가지기 때문에, 처음 Python을 접하는 개발자에게는 혼란스러울 수 있다.

이 글에서는 Python 언더스코어의 6가지 주요 용법을 정리한다.

- `_` — 임시 변수, REPL 결과값, 국제화
- `_name` — 내부 사용 컨벤션
- `name_` — 키워드 충돌 방지
- `__name` — Name Mangling
- `__name__` — 던더 메서드/속성
- `1_000_000` — 숫자 리터럴 구분자

# 2. 변수로서의 언더스코어 (`_`)

## 2.1 REPL에서 마지막 결과값

Python 인터프리터(REPL)에서 `_`는 마지막으로 평가된 표현식의 결과를 저장한다.

```python
>>> 1 + 2
3
>>> _
3
>>> _ * 10
30
>>> _
30
```

이 기능은 인터프리터 전용이며, 일반 스크립트에서는 동작하지 않는다.

## 2.2 무시 변수

값이 필요 없을 때 `_`를 관례적으로 사용한다. "이 값은 사용하지 않겠다"는 의도를 명확히 전달한다.

```python
# for 루프에서 반복 횟수만 필요한 경우
for _ in range(5):
    print("hello")

# 튜플 언패킹에서 불필요한 값 무시
first, _, last = (1, 2, 3)
print(first, last)  # 1 3

# 확장 언패킹으로 여러 값 무시
first, *_ = (1, 2, 3, 4, 5)
print(first)  # 1

*_, last = (1, 2, 3, 4, 5)
print(last)  # 5
```

## 2.3 국제화(i18n) 관례

`gettext` 모듈에서 번역 함수의 별칭으로 `_`를 사용하는 것이 오래된 관례이다.

```python
import gettext

_ = gettext.gettext

print(_("Hello, World!"))  # 로케일에 따라 번역된 문자열 출력
```

Django, Flask 등 대부분의 Python 웹 프레임워크에서도 이 패턴을 사용한다.

# 3. 네이밍 컨벤션에서의 언더스코어

## 3.1 `_name` 선행 단일 언더스코어 (내부 사용 컨벤션)

이름 앞에 `_`를 붙이면 "내부 구현용"이라는 뜻이다. 외부에서 접근은 가능하지만, 접근하지 말 것을 권장한다.

```python
class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self._session_token = None  # 내부 사용 변수

    def connect(self) -> str:
        self._session_token = self._generate_token()
        return f"Connected to {self.base_url}"

    def _generate_token(self) -> str:  # 내부 메서드
        return "secret-token-123"
```

`from module import *` 시 `_`로 시작하는 이름은 가져오지 않는다.

```python
# _internal_module.py
public_var = "I am public"
_private_var = "I am private"

def public_func():
    return "public function"

def _private_func():
    return "private function"
```

```python
from _internal_module import *

print(public_var)    # "I am public"
print(public_func()) # "public function"
print(_private_var)  # NameError: name '_private_var' is not defined
```

단, `__all__`이 정의되어 있으면 `__all__`에 명시된 이름만 export되며, `_` 접두사 규칙보다 우선한다.

```python
__all__ = ["ApiClient", "public_function"]

def public_function():
    return "I am public"

def _private_function():
    return "I am private"
```

## 3.2 `name_` 후행 단일 언더스코어 (키워드 충돌 방지)

Python 키워드와 이름이 겹칠 때 뒤에 `_`를 붙여 충돌을 피한다. PEP 8에서 공식 권장하는 방법이다.

```python
def create_element(type_: str, class_: str = "") -> dict:
    return {"type": type_, "class": class_}

# 내장 함수와 충돌 방지
list_ = [1, 2, 3]
id_ = 42
```

> **PEP 8**: "single trailing underscore by convention to avoid conflicts with Python keyword"

# 4. Name Mangling (`__name`)

클래스 내부에서 `__`로 시작하는(하지만 `__`로 끝나지 않는) 이름은 Python 인터프리터가 자동으로 `_ClassName__name` 형태로 변환한다. 이를 **Name Mangling**이라 한다.

```python
class Base:
    def __init__(self):
        self.public = "public"
        self._protected = "protected"
        self.__private = "mangled"  # _Base__private로 변환됨

    def get_private(self) -> str:
        return self.__private

obj = Base()
print(obj.public)       # "public"
print(obj._protected)   # "protected"
print(obj.get_private()) # "mangled"
print(obj.__private)     # AttributeError!
```

`dir()`로 mangled된 이름을 확인할 수 있다.

```python
print([attr for attr in dir(obj) if "private" in attr])
# ['_Base__private']
```

Name Mangling의 주된 목적은 **상속 시 이름 충돌 방지**이다.

```python
class Account:
    def __init__(self, balance: float):
        self.__balance = balance  # _Account__balance

    def get_balance(self) -> float:
        return self.__balance

class SavingsAccount(Account):
    def __init__(self, balance: float, interest_rate: float):
        super().__init__(balance)
        self.__balance = balance * (1 + interest_rate)  # _SavingsAccount__balance

    def get_projected_balance(self) -> float:
        return self.__balance

savings = SavingsAccount(1000, 0.05)
print(savings.get_balance())           # 1000 (부모의 __balance)
print(savings.get_projected_balance()) # 1050.0 (자식의 __balance)
```

부모와 자식 클래스에서 동일한 `__balance`를 사용하지만, mangling 덕분에 `_Account__balance`와 `_SavingsAccount__balance`로 각각 다른 속성으로 저장된다.

> **주의**: Name Mangling은 캡슐화가 아닌 이름 충돌 방지가 목적이다. 접근 제어를 위해 남용하지 말자. 대부분의 경우 `_name` 컨벤션만으로 충분하다.

# 5. 던더 메서드와 속성 (`__name__`)

`__`로 시작하고 `__`로 끝나는 이름을 **던더(dunder, double underscore)** 메서드 또는 속성이라 한다. Python이 특별한 목적으로 예약한 이름이며, 직접 새로운 던더를 만들어서는 안 된다.

## 5.1 주요 매직 메서드

```python
class Vector:
    def __init__(self, x: float, y: float):  # 생성/초기화
        self.x = x
        self.y = y

    def __repr__(self) -> str:  # 개발자용 문자열 표현
        return f"Vector({self.x}, {self.y})"

    def __str__(self) -> str:  # 사용자용 문자열 표현
        return f"({self.x}, {self.y})"

    def __eq__(self, other) -> bool:  # == 비교
        if not isinstance(other, Vector):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __lt__(self, other) -> bool:  # < 비교
        return (self.x**2 + self.y**2) < (other.x**2 + other.y**2)

    def __add__(self, other):  # + 연산
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float):  # * 연산
        return Vector(self.x * scalar, self.y * scalar)
```

```python
v1 = Vector(1, 2)
v2 = Vector(3, 4)

print(repr(v1))    # Vector(1, 2)
print(str(v1))     # (1, 2)
print(v1 == v2)    # False
print(v1 + v2)     # (4, 6)
print(v1 * 3)      # (3, 6)
```

주요 매직 메서드를 카테고리별로 정리하면 다음과 같다.

| 카테고리 | 메서드 | 설명 |
|---|---|---|
| 생성/초기화 | `__init__`, `__new__` | 객체 초기화, 생성 |
| 문자열 표현 | `__repr__`, `__str__` | 개발자용/사용자용 표현 |
| 비교 | `__eq__`, `__lt__`, `__le__`, `__gt__` | 동등성, 크기 비교 |
| 산술 연산 | `__add__`, `__sub__`, `__mul__` | +, -, * 연산 |
| 컨테이너 | `__len__`, `__getitem__`, `__contains__` | len(), 인덱싱, in |
| 컨텍스트 매니저 | `__enter__`, `__exit__` | with 문 지원 |

## 5.2 주요 매직 속성

```python
def sample_function():
    """샘플 함수의 독스트링"""
    pass

print(sample_function.__name__)    # "sample_function"
print(sample_function.__doc__)     # "샘플 함수의 독스트링"
print(sample_function.__module__)  # "__main__"

print(Vector.__name__)    # "Vector"
print(Vector.__module__)  # "__main__"
```

## 5.3 `if __name__ == "__main__":` 패턴

Python 파일이 직접 실행될 때 `__name__`은 `"__main__"`이 되고, 다른 모듈에서 import될 때는 모듈명이 된다.

```python
# my_module.py
def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    # 직접 실행할 때만 동작
    print(greet("World"))
```

```python
# 직접 실행: python my_module.py
# → __name__ == "__main__" → greet() 호출됨

# import 시: import my_module
# → __name__ == "my_module" → greet() 호출되지 않음
```

이 패턴을 사용하면 모듈을 라이브러리로도, 독립 스크립트로도 사용할 수 있다.

# 6. 숫자 리터럴에서의 언더스코어 (`1_000_000`)

Python 3.6부터 숫자 리터럴에 `_`를 자릿수 구분자로 사용할 수 있다. 값에는 영향을 주지 않으며 가독성만 향상시킨다.

```python
# 10진수
million = 1_000_000
billion = 1_000_000_000
price = 29_900

# 16진수
hex_color = 0xFF_FF_FF  # 흰색 (16777215)
hex_mask = 0xFF_00

# 2진수
byte_mask = 0b1111_0000
permissions = 0b0111_0101

# 8진수
octal_perm = 0o7_55

# 소수점
pi = 3.14_15_92
avogadro = 6.022_140_76e23
```

`_`를 넣을 수 없는 위치가 있다.

```python
# 아래는 모두 SyntaxError
_100     # 이것은 변수명
100_     # 숫자 끝에 불가
1__000   # 연속 언더스코어 불가
0_xFF    # 접두사 바로 뒤 불가
```

# 7. 실전 비교표 및 주의사항

## 7.1 한눈에 비교표

| 패턴 | 이름 | 의미 | 접근 가능 | 사용 시점 |
|---|---|---|---|---|
| `_` | 단일 언더스코어 | 임시/무시 변수 | - | 값이 필요 없을 때 |
| `_name` | 선행 단일 | 내부 사용 | O (컨벤션) | 모듈/클래스 내부 구현 |
| `name_` | 후행 단일 | 키워드 충돌 방지 | O | `class`, `type` 등과 겹칠 때 |
| `__name` | 선행 이중 | Name Mangling | `_Class__name`으로 접근 | 상속 시 이름 충돌 방지 |
| `__name__` | 던더 | 매직 메서드/속성 | O | Python 예약 프로토콜 구현 |
| `1_000` | 숫자 구분자 | 가독성 향상 | - | 큰 숫자 리터럴 |

## 7.2 판단 기준

- **외부에 공개하지 않을 내부 변수/메서드** → `_name`
- **Python 키워드와 이름이 겹치는 경우** → `name_`
- **상속 구조에서 부모/자식 간 속성 충돌이 우려되는 경우** → `__name`
- **Python 프로토콜을 구현하는 경우** (연산자 오버로딩, 문자열 표현 등) → `__name__`

## 7.3 흔한 실수와 안티패턴

**1. `__name`을 캡슐화 목적으로 남용하기**

```python
# 안티패턴 - 캡슐화를 위해 name mangling 사용
class User:
    def __init__(self):
        self.__name = "Alice"  # 불필요한 mangling

# 권장 - 단일 언더스코어로 충분
class User:
    def __init__(self):
        self._name = "Alice"  # 내부 사용 컨벤션
```

**2. 새로운 던더 이름을 직접 만들기**

```python
# 안티패턴 - 사용자 정의 던더
class MyClass:
    def __custom_method__(self):  # Python 예약 네임스페이스 침범
        pass

# 권장 - 일반 메서드명 사용
class MyClass:
    def custom_method(self):
        pass
```

**3. `import *`에 의존하기**

```python
# 안티패턴
from some_module import *

# 권장 - 명시적 import
from some_module import ApiClient, public_function
```

# 8. 마치며

Python에서 언더스코어는 위치와 개수에 따라 전혀 다른 의미를 가진다. 핵심을 요약하면 다음과 같다.

- `_`는 임시 변수나 REPL 결과값에 사용한다
- `_name`은 내부 구현을 나타내는 **컨벤션**이다
- `name_`은 키워드 충돌을 피하는 간단한 방법이다
- `__name`은 상속 시 이름 충돌을 방지하는 **Name Mangling**이다
- `__name__`은 Python이 예약한 **던더 메서드/속성**이다
- 숫자 리터럴의 `_`는 가독성을 위한 **구분자**이다

이 글에서 작성한 전체 예제 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/main/python/underscore)에서 확인할 수 있다.

# 9. 참고

- [Python Lexical Analysis - Identifiers](https://docs.python.org/3/reference/lexical_analysis.html#identifiers)
- [PEP 8 - Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [PEP 515 - Underscores in Numeric Literals](https://peps.python.org/pep-0515/)
