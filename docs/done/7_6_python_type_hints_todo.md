# TODO: Python Type Hints 실전 가이드

## 1단계: 샘플 코드 작성 (`tutorials-python/python/type-hints/`)

- [x] `01_basic_types.py` - 내장 타입, 컬렉션, 함수 시그니처 예제
- [x] `02_optional_union_literal.py` - Optional, Union, Literal 예제
- [x] `03_generics.py` - TypeVar, Generic, ParamSpec 예제
- [x] `04_protocol.py` - Protocol 정의 및 duck typing 예제
- [x] `05_callable_awaitable.py` - Callable, Awaitable 타입 예제
- [x] `06_utility_types.py` - TypeAlias, TypeGuard, TypedDict 예제
- [x] `07_mypy_config/pyproject.toml` - mypy 설정 샘플
- [x] `07_mypy_config/type_errors.py` - 의도적 타입 에러 예제 (mypy 에러 메시지 캡처용)
- [x] tests/test_type_hints.py - 27개 테스트 전체 통과

## 2단계: mypy 검증

- [x] 모든 샘플 코드에 `mypy --strict` 실행하여 정상 통과 확인
- [x] 의도적 에러 파일의 mypy 출력 결과 캡처

## 3단계: 블로그 글 작성 (`docs/start/python-type-hints-실전-가이드/index.md`)

- [x] frontmatter 작성 (title, description, date, tags)
- [x] 1. 타입 힌트 기본
  - [x] 1.1 내장 타입과 컬렉션
  - [x] 1.2 함수 시그니처
  - [x] 1.3 Optional, Union, Literal
- [x] 2. 제네릭과 고급 타입
  - [x] 2.1 TypeVar와 Generic
  - [x] 2.2 Protocol (구조적 서브타이핑 개요)
  - [x] 2.3 Callable, Awaitable
- [x] 3. 유틸리티 타입
  - [x] 3.1 TypeAlias
  - [x] 3.2 TypeGuard
  - [x] 3.3 TypedDict
- [x] 4. 타입 검사 도구와 실전 적용
  - [x] 4.1 mypy 설정 및 활용
  - [x] 4.2 정적 vs 런타임 타입 검사 비교표
  - [x] 4.3 점진적 타이핑 전략 (Mermaid 다이어그램 포함)
- [x] 참고 링크 섹션

## 4단계: 리뷰 및 검증

- [x] 코드 블록 실행 결과 정확성 확인
- [x] 한글 인코딩 확인 (`file -I`)
- [ ] PR 생성
