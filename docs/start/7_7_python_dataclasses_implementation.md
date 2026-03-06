# Implementation: Python Dataclasses & attrs

## 블로그 글 구조

- **파일 위치**: `docs/start/python-dataclasses-and-attrs/index.md`
- **샘플 코드**: `tutorials-python/python/dataclasses/`
- **시리즈**: Python 타입 시스템 & 데이터 모델링 (3-2)

## 샘플 코드 구성

```
tutorials-python/python/dataclasses/
├── 01_basic_usage.py          # @dataclass 기본, __init__/__repr__/__eq__, 기본값
├── 02_field_options.py        # field(), default_factory, repr/compare/init 제외, kw_only
├── 03_post_init.py            # __post_init__, InitVar, 파생 필드 계산
├── 04_frozen.py               # frozen=True, FrozenInstanceError, __hash__, replace()
├── 05_inheritance.py          # 상속 필드 순서, 기본값 문제 해결, slots=True
├── 06_comparison.py           # dataclass vs NamedTuple vs TypedDict 벤치마크
├── 07_attrs_intro.py          # @define, @frozen, validator, converter
├── 08_cattrs_serialization.py # structure(), unstructure(), JSON 변환
└── requirements.txt           # attrs, cattrs 의존성
```

## 블로그 글 섹션별 핵심 구현

### 1. dataclass 기본 문법

#### 1.1 @dataclass 기본 사용법
- `@dataclass` 데코레이터 적용 전/후 비교 예제 (boilerplate 제거 효과)
- 자동 생성되는 `__init__`, `__repr__`, `__eq__` 동작 확인
- 타입 힌트 없이 필드 정의 시 에러 발생 예시
- immutable 기본값(str, int, tuple)과 mutable 기본값(list, dict) 차이

#### 1.2 field() 옵션
- `default_factory=list` 로 mutable 기본값 안전하게 설정
- `repr=False`, `compare=False` 로 특정 필드 출력/비교에서 제외
- `init=False` 로 생성자 매개변수 제외 후 `__post_init__`에서 설정
- `kw_only=True` (Python 3.10+) 사용 예시

#### 1.3 __post_init__ 활용
- 검증 로직: 값 범위 체크, 타입 검증
- `InitVar[T]`: init에서만 받고 필드로 저장하지 않는 매개변수
- 파생 필드: 다른 필드 값 조합으로 계산되는 필드 패턴

### 2. dataclass 고급 기능

#### 2.1 frozen=True
- 불변 인스턴스 생성 및 `FrozenInstanceError` 발생 확인
- `__hash__` 자동 생성으로 dict 키, set 요소 활용
- `dataclasses.replace()`로 불변 객체 복사 + 일부 값 변경

#### 2.2 상속
- 부모/자식 필드 순서 합쳐지는 규칙
- 부모에 기본값 있는 필드 → 자식에 기본값 없는 필드 추가 시 에러 및 해결법 (`kw_only`)
- `slots=True` (Python 3.10+) 적용 시 메모리/속도 개선 수치

### 3. dataclass vs NamedTuple vs TypedDict 비교
- 세 가지 방식으로 동일한 데이터 구조 정의
- 용도별 차이: 변경 가능 객체 / 불변 튜플 / 딕셔너리 스키마
- `sys.getsizeof()`, `timeit`으로 메모리/생성 속도 벤치마크
- Mermaid 의사결정 트리 다이어그램

### 4. attrs / cattrs 생태계

#### 4.1 attrs
- `@define` (mutable), `@frozen` (immutable) API
- `validator`로 필드 값 검증 (범위, 타입, 커스텀)
- `converter`로 자동 타입 변환
- dataclass와의 기능 비교표 (표 형식)

#### 4.2 cattrs
- `structure()`: dict/JSON → attrs/dataclass 객체 변환
- `unstructure()`: 객체 → dict 변환
- 중첩 객체, 리스트 포함 JSON API 응답 변환 실전 예시
