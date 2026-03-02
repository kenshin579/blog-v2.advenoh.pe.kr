# PRD: Python Dataclasses & attrs

## 개요
dataclass의 기본/고급 기능과 attrs/cattrs 비교를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-5
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용
1. `@dataclass` 기본 사용법
2. `field()` 옵션 (default_factory, repr, compare 등)
3. `__post_init__` 활용
4. frozen=True (불변 데이터클래스)
5. 상속과 데이터클래스
6. dataclass vs NamedTuple vs TypedDict
7. attrs 라이브러리 소개 및 비교
8. cattrs (직렬화/역직렬화)

## 샘플 코드
- `tutorials-python/python/dataclasses/`

## 참고
- https://docs.python.org/3/library/dataclasses.html
- https://www.attrs.org/
