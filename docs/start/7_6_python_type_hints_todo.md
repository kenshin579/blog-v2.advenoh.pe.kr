# TODO: Python Type Hints 실전 가이드

## 1단계: 샘플 코드 작성 (`tutorials-python/python/type-hints/`)

- [ ] `01_basic_types.py` - 내장 타입, 컬렉션, 함수 시그니처 예제
- [ ] `02_optional_union_literal.py` - Optional, Union, Literal 예제
- [ ] `03_generics.py` - TypeVar, Generic, ParamSpec 예제
- [ ] `04_protocol.py` - Protocol 정의 및 duck typing 예제
- [ ] `05_callable_awaitable.py` - Callable, Awaitable 타입 예제
- [ ] `06_utility_types.py` - TypeAlias, TypeGuard, TypedDict 예제
- [ ] `07_mypy_config/pyproject.toml` - mypy 설정 샘플
- [ ] `07_mypy_config/type_errors.py` - 의도적 타입 에러 예제 (mypy 에러 메시지 캡처용)

## 2단계: mypy 검증

- [ ] 모든 샘플 코드에 `mypy --strict` 실행하여 정상 통과 확인
- [ ] 의도적 에러 파일의 mypy 출력 결과 캡처

## 3단계: 블로그 글 작성 (`docs/start/7_6_python_type_hints/index.md`)

- [ ] frontmatter 작성 (title, description, date, tags)
- [ ] 1. 타입 힌트 기본
  - [ ] 1.1 내장 타입과 컬렉션
  - [ ] 1.2 함수 시그니처
  - [ ] 1.3 Optional, Union, Literal
- [ ] 2. 제네릭과 고급 타입
  - [ ] 2.1 TypeVar와 Generic
  - [ ] 2.2 Protocol (구조적 서브타이핑 개요)
  - [ ] 2.3 Callable, Awaitable
- [ ] 3. 유틸리티 타입
  - [ ] 3.1 TypeAlias
  - [ ] 3.2 TypeGuard
  - [ ] 3.3 TypedDict
- [ ] 4. 타입 검사 도구와 실전 적용
  - [ ] 4.1 mypy 설정 및 활용
  - [ ] 4.2 정적 vs 런타임 타입 검사 비교표
  - [ ] 4.3 점진적 타이핑 전략 (Mermaid 다이어그램 포함)
- [ ] 참고 링크 섹션

## 4단계: 리뷰 및 검증

- [ ] 코드 블록 실행 결과 정확성 확인
- [ ] 한글 인코딩 확인 (`file -I`)
- [ ] PR 생성
