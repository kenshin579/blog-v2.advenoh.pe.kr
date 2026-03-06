---
title: "Python Enum 활용법"
description: "Python Enum 활용법"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - enum
  - IntEnum
  - StrEnum
  - Flag
  - 파이썬
  - 열거형
series: "Python 타입 시스템 & 데이터 모델링"
---

# 1. Enum 기본 문법

## 1.1 Enum 정의와 멤버 접근

Python의 `Enum`은 관련된 상수들을 하나의 클래스로 묶어 관리하는 열거형 타입이다. `enum` 모듈을 import하여 사용한다.

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3
```

Enum 멤버에 접근하는 방법은 3가지가 있다.

```python
# 1. 속성 접근
Color.RED          # <Color.RED: 1>

# 2. 이름으로 접근
Color["RED"]       # <Color.RED: 1>

# 3. 값으로 접근
Color(1)           # <Color.RED: 1>
```

각 멤버는 `name`과 `value` 속성을 가진다.

```python
print(Color.RED.name)   # "RED"
print(Color.RED.value)  # 1
```

`for` 문으로 모든 멤버를 순회할 수 있다.

```python
for color in Color:
    print(f"{color.name} = {color.value}")
# RED = 1
# GREEN = 2
# BLUE = 3
```

Enum 멤버는 **싱글턴**이므로 `is` 비교가 가능하다.

```python
Color.RED is Color.RED       # True
Color.RED is Color(1)        # True
Color.RED is Color["RED"]    # True
```

## 1.2 `auto()` 자동 값 할당

`auto()`를 사용하면 값을 수동으로 지정하지 않아도 자동으로 할당된다. 기본적으로 1부터 순차 증가한다.

```python
from enum import Enum, auto

class Priority(Enum):
    LOW = auto()      # 1
    MEDIUM = auto()   # 2
    HIGH = auto()     # 3
    CRITICAL = auto() # 4
```

`_generate_next_value_()`를 오버라이드하면 커스텀 값 생성 로직을 정의할 수 있다.

```python
class OrdinalEnum(Enum):
    @staticmethod
    def _generate_next_value_(name, start, count, last_values):
        return count  # 0부터 시작

    FIRST = auto()   # 0
    SECOND = auto()  # 1
    THIRD = auto()   # 2
```

`StrEnum`과 `auto()`를 조합하면 멤버 이름이 소문자 값으로 자동 할당된다.

```python
from enum import StrEnum, auto

class Status(StrEnum):
    ACTIVE = auto()    # "active"
    INACTIVE = auto()  # "inactive"
    PENDING = auto()   # "pending"
```

# 2. Enum 타입 종류

## 2.1 IntEnum, StrEnum

`IntEnum`은 정수와 직접 비교/연산이 가능한 Enum이다.

```python
from enum import IntEnum

class HttpStatus(IntEnum):
    OK = 200
    NOT_FOUND = 404
    INTERNAL_ERROR = 500

HttpStatus.OK == 200           # True (정수와 비교 가능)
HttpStatus.NOT_FOUND > 200     # True (크기 비교 가능)
HttpStatus.OK + 1              # 201 (산술 연산 가능)
```

`StrEnum`(Python 3.11+)은 문자열과 직접 연산이 가능하다.

```python
from enum import StrEnum

class LogLevel(StrEnum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

f"level: {LogLevel.DEBUG}"     # "level: debug"
LogLevel.DEBUG.upper()         # "DEBUG"
"log_" + LogLevel.INFO         # "log_info"
LogLevel.DEBUG == "debug"      # True
```

일반 `Enum`과의 차이점은 다음과 같다.

| 비교 항목 | Enum | IntEnum / StrEnum |
|---|---|---|
| 원시 타입과 비교 | 불가 (`Color.RED == 1` → `False`) | 가능 (`HttpStatus.OK == 200` → `True`) |
| 산술/문자열 연산 | 불가 | 가능 |
| 타입 안전성 | 높음 (엄격한 타입 구분) | 낮음 (암묵적 변환 가능) |
| 사용 시점 | 순수 열거형이 필요할 때 | 외부 시스템과 호환이 필요할 때 |

## 2.2 Flag, IntFlag (비트 연산)

`Flag`는 비트 OR(`|`)로 여러 멤버를 조합할 수 있는 Enum이다. 권한 시스템 구현에 적합하다.

```python
from enum import Flag, auto

class Permission(Flag):
    READ = auto()     # 1
    WRITE = auto()    # 2
    EXECUTE = auto()  # 4

    # 조합 멤버
    READ_WRITE = READ | WRITE
    ALL = READ | WRITE | EXECUTE
```

```python
# 권한 조합
rw = Permission.READ | Permission.WRITE

# 권한 확인
Permission.READ in rw      # True
Permission.EXECUTE in rw   # False
```

`IntFlag`를 사용하면 UNIX 파일 퍼미션 스타일로 구현할 수 있다.

```python
from enum import IntFlag

class FilePermission(IntFlag):
    OWNER_READ = 0o400
    OWNER_WRITE = 0o200
    OWNER_EXEC = 0o100
    GROUP_READ = 0o040
    GROUP_EXEC = 0o010
    OTHER_READ = 0o004
    OTHER_EXEC = 0o001

    OWNER_ALL = OWNER_READ | OWNER_WRITE | OWNER_EXEC  # 0o700
    DEFAULT = OWNER_ALL | GROUP_READ | GROUP_EXEC | OTHER_READ | OTHER_EXEC  # 0o755
```

# 3. Enum 커스터마이징

## 3.1 커스텀 메서드와 프로퍼티

Enum에 인스턴스 메서드, 클래스 메서드, 프로퍼티를 정의할 수 있다.

```python
class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS = (4.869e+24, 6.0518e6)
    EARTH = (5.976e+24, 6.37814e6)
    MARS = (6.421e+23, 3.3972e6)

    def __init__(self, mass: float, radius: float):
        self.mass = mass
        self.radius = radius

    @property
    def surface_gravity(self) -> float:
        G = 6.67300e-11
        return G * self.mass / (self.radius * self.radius)

    def weight_on(self, earth_weight: float) -> float:
        """지구 무게 기준으로 해당 행성에서의 무게를 계산한다."""
        return earth_weight * self.surface_gravity / Planet.EARTH.surface_gravity
```

```python
print(Planet.MARS.weight_on(70))  # 약 26.5kg (화성에서의 무게)
```

클래스 메서드를 팩토리 패턴으로 활용할 수도 있다.

```python
class Season(Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"

    @classmethod
    def from_month(cls, month: int) -> "Season":
        if month in (3, 4, 5):
            return cls.SPRING
        elif month in (6, 7, 8):
            return cls.SUMMER
        elif month in (9, 10, 11):
            return cls.AUTUMN
        else:
            return cls.WINTER

Season.from_month(7)  # Season.SUMMER
```

## 3.2 `__str__`, `__format__` 오버라이드

출력 포맷을 커스터마이징할 수 있다.

```python
class Planet(Enum):
    # ... (위와 동일)

    def __str__(self) -> str:
        return f"{self.name.capitalize()} (mass={self.mass:.2e}kg)"

    def __format__(self, format_spec: str) -> str:
        if format_spec == "short":
            return self.name.capitalize()
        return str(self)

print(Planet.EARTH)            # Earth (mass=5.98e+24kg)
print(f"{Planet.EARTH:short}") # Earth
```

# 4. 비교와 직렬화

## 4.1 `==`, `is` 비교 동작 차이

```python
from enum import Enum, IntEnum

class Color(Enum):
    RED = 1

class IntColor(IntEnum):
    RED = 1

# Enum: is와 == 모두 사용 가능, 정수와는 비교 불가
Color.RED is Color.RED     # True
Color.RED == Color.RED     # True
Color.RED == 1             # False ← 일반 Enum

# IntEnum: 정수와 직접 비교 가능
IntColor.RED == 1          # True
```

## 4.2 JSON 직렬화/역직렬화

Enum은 기본적으로 JSON 직렬화가 되지 않는다. 커스텀 `JSONEncoder`를 구현하면 된다.

```python
import json

class EnumEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return {"__enum__": type(obj).__name__, "name": obj.name, "value": obj.value}
        return super().default(obj)

# 직렬화
data = {"color": Color.RED}
json_str = json.dumps(data, cls=EnumEncoder)
# '{"color": {"__enum__": "Color", "name": "RED", "value": 1}}'
```

역직렬화는 `object_hook`을 사용한다.

```python
def decode_enum(obj):
    if "__enum__" in obj:
        return Color(obj["value"])
    return obj

restored = json.loads(json_str, object_hook=decode_enum)
# {"color": <Color.RED: 1>}
```

간단한 경우에는 `value`만 저장하고 복원하는 방법도 있다.

```python
# 직렬화: value만 추출
json.dumps({"color": Color.RED.value})  # '{"color": 1}'

# 역직렬화: value로 복원
Color(json.loads('{"color": 1}')["color"])  # Color.RED
```

## 4.3 DB 저장 패턴

데이터베이스에 저장할 때는 `value`를 문자열 또는 정수로 변환하여 저장한다.

```python
# 저장
db_value = Color.RED.value  # 1

# 복원
color = Color(db_value)     # Color.RED
```

# 5. 실전 패턴

## 5.1 상태 머신

상태 전이 규칙을 Enum 메서드로 정의하면 안전한 상태 관리가 가능하다.

```python
class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

    def next_status(self) -> list["OrderStatus"]:
        transitions = {
            OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            OrderStatus.CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: [],
            OrderStatus.CANCELLED: [],
        }
        return transitions[self]

    def can_transition_to(self, target: "OrderStatus") -> bool:
        return target in self.next_status()
```

```python
order = OrderStatus.PENDING
order.can_transition_to(OrderStatus.CONFIRMED)   # True
order.can_transition_to(OrderStatus.DELIVERED)    # False (직접 전이 불가)
```

## 5.2 API 응답 코드

HTTP 상태 코드를 Enum으로 관리하면 카테고리 분류를 메서드로 제공할 수 있다.

```python
class HttpCode(IntEnum):
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    NOT_FOUND = 404
    INTERNAL_ERROR = 500

    @property
    def category(self) -> str:
        if self.value < 300:
            return "Success"
        elif self.value < 400:
            return "Redirection"
        elif self.value < 500:
            return "Client Error"
        else:
            return "Server Error"

    @property
    def is_error(self) -> bool:
        return self.value >= 400

HttpCode.NOT_FOUND.category   # "Client Error"
HttpCode.NOT_FOUND.is_error   # True
```

## 5.3 설정값 관리

환경별 설정을 Enum으로 구조화하면 타입 안전한 설정 관리가 가능하다.

```python
class Environment(StrEnum):
    DEV = "development"
    STAGING = "staging"
    PROD = "production"

    @property
    def config(self) -> dict:
        configs = {
            Environment.DEV: {"debug": True, "db": "sqlite:///dev.db", "log_level": "DEBUG"},
            Environment.STAGING: {"debug": False, "db": "postgresql://staging/db", "log_level": "INFO"},
            Environment.PROD: {"debug": False, "db": "postgresql://prod/db", "log_level": "WARNING"},
        }
        return configs[self]

env = Environment.DEV
print(env.config["debug"])  # True
```

## 5.4 `match/case`와 Enum 조합

Python 3.10+의 구조적 패턴 매칭은 Enum과 잘 어울린다.

```python
def handle_order(status: OrderStatus) -> str:
    match status:
        case OrderStatus.PENDING:
            return "주문 확인 중..."
        case OrderStatus.CONFIRMED:
            return "주문이 확인되었습니다."
        case OrderStatus.SHIPPED:
            return "배송 중입니다."
        case OrderStatus.DELIVERED:
            return "배송 완료!"
        case OrderStatus.CANCELLED:
            return "주문이 취소되었습니다."
```

# 6. 마무리

Enum 타입별 선택 가이드를 정리하면 다음과 같다.

| 타입 | 사용 시점 | 특징 |
|---|---|---|
| `Enum` | 순수 열거형이 필요할 때 | 타입 안전성 높음, 원시 타입과 비교 불가 |
| `IntEnum` | 정수 호환이 필요할 때 (HTTP 코드, DB 값) | 정수 비교/연산 가능 |
| `StrEnum` | 문자열 호환이 필요할 때 (API 키, 설정값) | 문자열 연산 가능 (Python 3.11+) |
| `Flag` | 비트 조합이 필요할 때 (권한, 옵션) | OR 조합, in 연산 지원 |
| `IntFlag` | Flag + 정수 호환 | 정수 비트 연산 호환 |

**Enum을 사용하면 좋은 경우:**

- 상수 값의 집합이 정해져 있고, 타입 안전성이 필요할 때
- 상태 전이, 권한 관리 등 비즈니스 로직이 값에 종속될 때
- `match/case`로 분기 처리가 필요할 때
- JSON/DB 직렬화에서 의미 있는 값 표현이 필요할 때

이 글에서 작성한 전체 예제 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/main/python/enum)에서 확인할 수 있다.

# 7. 참고

- [Python enum — Support for enumerations](https://docs.python.org/3/library/enum.html)
- [PEP 435 – Adding an Enum type to the Python standard library](https://peps.python.org/pep-0435/)
- [PEP 663 – Standardizing Enum str(), repr(), and format()](https://peps.python.org/pep-0663/)
