# Implementation: Python Type Hints 실전 가이드

## 블로그 글 구조

- **파일 위치**: `docs/start/7_6_python_type_hints/index.md`
- **샘플 코드**: `tutorials-python/python/type-hints/`
- **카테고리**: python

## 핵심 구현 사항

### 1. 샘플 코드 작성 (`tutorials-python/python/type-hints/`)

#### 1.1 기본 타입 힌트 예제 (`01_basic_types.py`)
- 내장 타입(`int`, `str`, `float`, `bool`, `bytes`) 변수 선언
- 컬렉션 타입(`list[int]`, `dict[str, Any]`, `tuple[int, ...]`, `set[str]`) 사용
- Python 3.9+ 소문자 제네릭 vs `typing.List`, `typing.Dict` 비교
- 함수 시그니처: 매개변수 타입, 반환 타입, `-> None`

#### 1.2 Optional/Union/Literal 예제 (`02_optional_union_literal.py`)
- `Optional[X]`과 `X | None` (3.10+) 비교
- `Union[X, Y]`과 `X | Y` 패턴
- `Literal["read", "write"]` 값 제한 예시
- `None` 반환 함수의 타입 표기

#### 1.3 제네릭 예제 (`03_generics.py`)
- `TypeVar("T")` 제네릭 함수
- `TypeVar("T", bound=Base)` 상한 제약
- `Generic[T]` 클래스 정의
- `ParamSpec`, `TypeVarTuple` 간단 예시

#### 1.4 Protocol 예제 (`04_protocol.py`)
- duck typing과 Protocol 관계 설명 코드
- 간단한 Protocol 정의 및 사용

#### 1.5 Callable/Awaitable 예제 (`05_callable_awaitable.py`)
- `Callable[[int, str], bool]` 콜백 타입
- `Callable[..., ReturnType]` 임의 인자
- `Awaitable[T]` 비동기 함수 타입

#### 1.6 유틸리티 타입 예제 (`06_utility_types.py`)
- `TypeAlias` 별칭 정의
- `TypeGuard` narrowing 함수
- `TypedDict` 정의 및 `Required`/`NotRequired`

#### 1.7 mypy 설정 예제 (`07_mypy_config/`)
- `pyproject.toml` mypy 설정 샘플
- 의도적 타입 에러 코드 + mypy 실행 결과 캡처
- `# type: ignore` 사용 예시

### 2. 블로그 글 작성 (`index.md`)

- frontmatter: title, description, date, tags(python, type-hints, mypy, typing, 타입힌트)
- 각 섹션에서 `tutorials-python/python/type-hints/`의 코드를 참조
- 코드 블록에 실행 결과 포함
- mypy 에러 메시지 예시와 해결 방법 포함
- 정적/런타임 타입 검사 도구 비교표 작성
- 점진적 마이그레이션 단계별 다이어그램 (Mermaid flowchart)

### 3. mypy 검증

- 모든 샘플 코드에 대해 `mypy --strict` 실행하여 타입 에러 없음 확인
- 의도적 에러 예제는 별도 파일로 분리하여 에러 메시지 캡처
