# PRD: Python Generator & Iterator

## 개요
yield, generator expression, itertools를 활용한 메모리 효율적 데이터 처리를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-2
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. Iterator 프로토콜 (`__iter__`, `__next__`)
2. Generator 함수 (`yield`)
3. Generator Expression vs List Comprehension
4. `send()`, `throw()`, `close()`
5. `yield from` (서브 제네레이터 위임)
6. itertools 활용 (chain, islice, groupby, product 등)
7. 메모리 효율 비교 (list vs generator 벤치마크)
8. 실전 패턴: 대용량 파일 처리, 무한 시퀀스, 파이프라인

## 샘플 코드
- `tutorials-python/python/generator/`

## 참고
- https://docs.python.org/3/howto/functional.html
- https://docs.python.org/3/library/itertools.html
