# PRD: Python Dataclasses & attrs

## 개요
dataclass의 기본/고급 기능과 attrs/cattrs 비교를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 타입 시스템 & 데이터 모델링
- **번호**: 3-2
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용
1. `@dataclass` 기본 사용법
   - `__init__`, `__repr__`, `__eq__` 자동 생성 원리
   - 필드 정의와 타입 힌트 필수 규칙
   - 기본값 설정 (immutable 타입만 직접 지정 가능)
2. `field()` 옵션
   - `default_factory`: 리스트, 딕셔너리 등 mutable 기본값
   - `repr=False`, `compare=False`: 특정 필드 제외
   - `init=False`: `__init__` 매개변수에서 제외
   - `kw_only=True` (Python 3.10+): 키워드 전용 인자
3. `__post_init__` 활용
   - 초기화 후 검증 로직 추가
   - `InitVar[T]`: init 전용 매개변수 정의
   - 파생 필드 계산 패턴 (다른 필드 값 기반)
4. frozen=True (불변 데이터클래스)
   - 불변 인스턴스: 속성 변경 시 `FrozenInstanceError`
   - `__hash__` 자동 생성 → dict 키/set 요소로 사용 가능
   - `dataclasses.replace()`로 복사 + 수정 패턴
5. 상속과 데이터클래스
   - 부모/자식 dataclass 필드 순서 규칙
   - 기본값 있는 필드 뒤에 기본값 없는 필드 불가 문제와 해결법
   - `slots=True` (Python 3.10+): 메모리 최적화와 속성 접근 속도 향상
6. dataclass vs NamedTuple vs TypedDict
   - 각각의 용도: 변경 가능 객체 vs 불변 튜플 vs 딕셔너리 스키마
   - 메모리 사용량, 생성 속도 벤치마크
   - 선택 기준 의사결정 트리
7. attrs 라이브러리 소개 및 비교
   - `@define` / `@frozen`: attrs 최신 API
   - attrs만의 장점: 슬롯 자동 생성, validator, converter
   - dataclass와의 기능 비교표
8. cattrs (직렬화/역직렬화)
   - `structure()`: dict → attrs/dataclass 객체 변환
   - `unstructure()`: 객체 → dict 변환
   - JSON/API 응답 변환 실전 예시

## 샘플 코드
- `tutorials-python/python/dataclasses/`

## 참고
- https://docs.python.org/3/library/dataclasses.html
- https://www.attrs.org/
