# Implementation: Python Enum 활용법

## 블로그 글 정보
- **파일 위치**: `docs/start/python-enum-활용법/index.md`
- **샘플 코드**: `tutorials-python/python/enum/`
- **시리즈**: Python 타입 시스템 & 데이터 모델링 (3-3)

## 구현 상세

### # 1. Enum 기본 문법

#### 1.1 Enum 정의와 멤버 접근
- `class Color(Enum)` 정의 예제
- 3가지 접근 방식: `Color.RED`, `Color["RED"]`, `Color(1)`
- `name`, `value` 속성 출력 예제
- `for color in Color:` 이터레이션 예제
- 싱글턴 특성: `Color.RED is Color.RED` → `True`

#### 1.2 auto() 자동 값 할당
- `auto()` 기본 사용 (1부터 순차 증가)
- `_generate_next_value_()` 오버라이드: 커스텀 값 생성 로직
- `StrEnum + auto()`: 멤버 이름을 소문자 value로 자동 매핑

### # 2. Enum 타입 종류

#### 2.1 IntEnum, StrEnum
- `IntEnum` 예제: HTTP 상태 코드 (`Status.OK == 200` → `True`)
- `StrEnum` 예제: 문자열 연산 직접 가능
- 일반 Enum과 비교 표: 타입 호환성 장단점

#### 2.2 Flag, IntFlag
- `Flag` 예제: `Permission.READ | Permission.WRITE` 비트 OR 조합
- `IntFlag` 예제: 정수 비트 연산 호환
- UNIX 파일 퍼미션 스타일 권한 시스템 구현

### # 3. Enum 커스터마이징

#### 3.1 커스텀 메서드와 프로퍼티
- 인스턴스 메서드: `describe()` 등
- 클래스 메서드: `@classmethod` 팩토리 패턴
- `@property`: 파생 속성 계산

#### 3.2 `__str__`, `__format__` 오버라이드
- 출력 포맷 커스터마이징 예제

### # 4. 비교와 직렬화

#### 4.1 `==`, `is` 비교
- `==` vs `is` 동작 차이 (Enum vs IntEnum 케이스)

#### 4.2 JSON 직렬화/역직렬화
- `value` 추출 방식
- 커스텀 `JSONEncoder` 구현
- JSON → Enum 역직렬화

#### 4.3 DB 저장 패턴
- value를 문자열/정수로 저장하는 패턴

### # 5. 실전 패턴

#### 5.1 상태 머신
- 상태 전이 규칙을 Enum 메서드로 정의 (예: `OrderStatus`)

#### 5.2 API 응답 코드
- HTTP 상태 코드 Enum + 카테고리 분류 메서드

#### 5.3 설정값 관리
- 환경별 설정(dev/staging/prod)을 Enum으로 구조화

#### 5.4 match/case와 Enum 조합
- Python 3.10+ 구조적 패턴 매칭 예제

### # 6. 마무리
- Enum 타입별 선택 가이드 표 (Enum vs IntEnum vs StrEnum vs Flag)
- 언제 Enum을 사용하면 좋은지 정리

### # 7. 참고
- https://docs.python.org/3/library/enum.html

## 샘플 코드 구조

```
tutorials-python/python/enum/
├── 01_basic_enum.py           # 1.1 기본 정의, 접근, 이터레이션
├── 02_auto_value.py           # 1.2 auto(), _generate_next_value_
├── 03_int_str_enum.py         # 2.1 IntEnum, StrEnum
├── 04_flag_enum.py            # 2.2 Flag, IntFlag, 권한 시스템
├── 05_custom_methods.py       # 3.1~3.2 커스텀 메서드, __str__
├── 06_comparison_serialize.py # 4.1~4.3 비교, JSON, DB 패턴
└── 07_practical_patterns.py   # 5.1~5.4 상태 머신, match/case
```
