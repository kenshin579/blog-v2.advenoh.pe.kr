# PRD: Python Type Hints 실전 가이드

## 개요
typing 모듈의 핵심 기능과 mypy를 활용한 점진적 타이핑 전략을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 타입 시스템 & 데이터 모델링
- **번호**: 3-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. 타입 힌트 기본
   - 내장 타입: `int`, `str`, `float`, `bool`, `bytes`
   - 컬렉션: `list[int]`, `dict[str, Any]`, `tuple[int, ...]`, `set[str]`
   - Python 3.9+ 소문자 제네릭 vs `typing.List`, `typing.Dict`
   - 함수 시그니처: 매개변수 타입, 반환 타입, `-> None`
2. Optional, Union, Literal
   - `Optional[X]` = `X | None` (Python 3.10+ `|` 문법)
   - `Union[X, Y]` = `X | Y` 사용법과 패턴
   - `Literal["read", "write"]`: 허용 값 제한
   - `None` 반환 가능 함수의 올바른 타입 표기
3. TypeVar와 Generic
   - `TypeVar("T")`: 제네릭 함수 작성
   - `TypeVar("T", bound=Base)`: 상한 제약
   - `Generic[T]`: 제네릭 클래스 정의
   - `ParamSpec`, `TypeVarTuple` (Python 3.10+/3.11+)
4. Protocol 소개 (구조적 서브타이핑 개요 - 상세는 ABC와 Protocol 편 참조)
   - Protocol의 기본 개념과 duck typing과의 관계
   - 간단한 Protocol 정의 예시
5. TypeAlias, TypeGuard, TypedDict
   - `TypeAlias`: 복잡한 타입의 별칭 정의 (`type` 문법, Python 3.12+)
   - `TypeGuard`: 타입 가드 함수로 narrowing
   - `TypedDict`: 키별 타입이 다른 딕셔너리 정의
   - `Required`/`NotRequired` 필드 (Python 3.11+)
6. Callable, Awaitable
   - `Callable[[int, str], bool]`: 콜백 함수 타입 표기
   - `Callable[..., ReturnType]`: 임의 인자 허용
   - `Awaitable[T]`, `Coroutine[Any, Any, T]`: 비동기 함수 타입
7. mypy 설정 및 활용 (pyproject.toml)
   - `[tool.mypy]` 핵심 옵션: `strict`, `warn_return_any`, `disallow_untyped_defs`
   - per-module 설정 (`[[tool.mypy.overrides]]`)
   - `# type: ignore` 주석 사용 가이드라인
   - mypy 에러 메시지 읽는 방법
8. 점진적 타이핑 전략 (기존 프로젝트 마이그레이션)
   - 1단계: `mypy --strict=false`로 시작
   - 2단계: 공개 API/인터페이스부터 타입 추가
   - 3단계: 모듈 단위로 strict 모드 적용
   - stub 파일 (`.pyi`) 활용
9. 런타임 타입 검사 vs 정적 타입 검사
   - 정적: mypy, pyright, pytype 비교
   - 런타임: `isinstance()`, beartype, typeguard
   - 각 접근 방식의 장단점과 조합 전략

## 샘플 코드
- `tutorials-python/python/type-hints/`

## 참고
- https://docs.python.org/3/library/typing.html
- https://mypy.readthedocs.io/
