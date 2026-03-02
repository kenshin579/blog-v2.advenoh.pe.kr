# PRD: Python Type Hints 실전 가이드

## 개요
typing 모듈의 핵심 기능과 mypy를 활용한 점진적 타이핑 전략을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-4
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. 타입 힌트 기본 (`int`, `str`, `list[int]`, `dict[str, Any]`)
2. Optional, Union, Literal
3. TypeVar와 Generic
4. Protocol (구조적 서브타이핑)
5. TypeAlias, TypeGuard, TypedDict
6. Callable, Awaitable
7. mypy 설정 및 활용 (pyproject.toml)
8. 점진적 타이핑 전략 (기존 프로젝트 마이그레이션)
9. 런타임 타입 검사 vs 정적 타입 검사

## 샘플 코드
- `tutorials-python/python/type-hints/`

## 참고
- https://docs.python.org/3/library/typing.html
- https://mypy.readthedocs.io/
