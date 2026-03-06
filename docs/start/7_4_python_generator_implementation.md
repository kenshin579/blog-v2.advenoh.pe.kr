# Implementation: Python Generator & Iterator 완벽 가이드

## 1. 샘플 코드 구현 (tutorials-python)

### 1.1 디렉토리 구조

```
tutorials-python/python/generator/
├── 01_iterator_protocol.py        # Iterator 프로토콜 예제
├── 02_generator_basics.py         # Generator 함수 기본
├── 03_generator_expression.py     # Generator Expression vs List Comprehension
├── 04_send_throw_close.py         # send(), throw(), close()
├── 05_yield_from.py               # yield from 서브 제네레이터 위임
├── 06_itertools_examples.py       # itertools 활용
├── 07_memory_benchmark.py         # 메모리 효율 비교 벤치마크
├── 08_practical_patterns.py       # 실전 패턴
└── tests/
    └── test_generator.py          # pytest 테스트
```

### 1.2 01_iterator_protocol.py - Iterator 프로토콜

- `__iter__`, `__next__` 메서드를 구현한 커스텀 Iterator 클래스
- `for` 루프가 내부적으로 `iter()` → `next()` → `StopIteration` 처리하는 흐름 시연
- 예제: `CountDown(5)` → 5, 4, 3, 2, 1

### 1.3 02_generator_basics.py - Generator 함수

- `yield`와 `return`의 차이를 보여주는 간단한 예제
- `next()` 호출 시 실행이 중단/재개되는 흐름을 print로 시각화
- generator 객체의 상태 확인 (`inspect.getgeneratorstate()`)

### 1.4 03_generator_expression.py - Generator Expression

- `(x**2 for x in range(n))` vs `[x**2 for x in range(n)]` 비교
- `sys.getsizeof()`로 메모리 차이 측정
- 선택 기준 정리 (재사용 여부, 데이터 크기)

### 1.5 04_send_throw_close.py - 양방향 통신

- `send(value)`: 러닝 평균 계산기 예제
- `throw(exc_type)`: generator 내부 예외 주입 및 처리
- `close()`: generator 정리 (리소스 해제 패턴)

### 1.6 05_yield_from.py - 서브 제네레이터 위임

- `yield from` 없이 중첩 generator 순회 vs `yield from` 사용
- `yield from iterable`로 리스트/문자열 평탄화
- 반환값 처리: `result = yield from sub_gen()`

### 1.7 06_itertools_examples.py - itertools 활용

```python
# 무한 이터레이터
from itertools import count, cycle, repeat

# 조합 이터레이터
from itertools import chain, islice, zip_longest

# 필터링
from itertools import takewhile, dropwhile, filterfalse

# 그룹핑
from itertools import groupby  # 정렬 필수 주의

# 조합론
from itertools import product, permutations, combinations
```

- 각 함수별 간결한 사용 예제
- `groupby()` 사용 시 정렬 필수인 이유 설명

### 1.8 07_memory_benchmark.py - 메모리 효율 비교

- `tracemalloc`으로 메모리 사용량 측정
- 100만 건 데이터: list vs generator 비교
- 결과를 표로 출력 (메모리, 처리 시간)

### 1.9 08_practical_patterns.py - 실전 패턴

- 대용량 파일 라인 단위 처리 파이프라인
- 무한 시퀀스: ID 생성기, 피보나치 수열
- 데이터 파이프라인: 함수 체이닝 패턴

---

## 2. 블로그 글 구현

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/
  python-generator-iterator-완벽-가이드/
    index.md
```

### 2.2 Frontmatter

```yaml
---
title: "Python Generator & Iterator 완벽 가이드"
description: "yield, generator expression, itertools를 활용한 메모리 효율적 데이터 처리를 다룹니다. Iterator 프로토콜부터 실전 파이프라인 패턴까지 한번에 알아봅니다"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - generator
  - iterator
  - yield
  - itertools
  - lazy-evaluation
series: "Python 함수형 패턴"
---
```

### 2.3 글 구조

| # | 섹션 | 핵심 내용 |
|---|------|----------|
| 1 | Iterator 프로토콜 | `__iter__`, `__next__`, `StopIteration`, 커스텀 Iterator 구현 |
| 2 | Generator 기본 | yield 함수, 생명주기, next() 흐름 시각화 |
| 2.1 | Generator 함수 (`yield`) | yield vs return, 상태 보존, 생명주기 다이어그램 |
| 2.2 | Generator Expression vs List Comprehension | 문법 비교, 메모리 차이, 선택 기준 |
| 3 | Generator 고급 기능 | 양방향 통신, 서브 제네레이터 위임 |
| 3.1 | `send()`, `throw()`, `close()` | 값 전달, 예외 주입, 종료 처리 |
| 3.2 | `yield from` | 중첩 generator 간결화, 반환값 처리 |
| 4 | itertools 활용 | 무한/조합/필터링/그룹핑/조합론 이터레이터 |
| 5 | 성능과 실전 패턴 | 벤치마크, 파이프라인, 무한 시퀀스 |
| 5.1 | 메모리 효율 비교 | tracemalloc 벤치마크, list vs generator 비교표 |
| 5.2 | 실전 패턴 | 파일 처리, ID 생성기, 데이터 파이프라인 |
| 6 | 마무리 | 요약, GitHub 코드 링크 |
| 7 | FAQ | 자주 묻는 질문 |
| 8 | 참고 | 공식 문서, 레퍼런스 링크 |

### 2.4 다이어그램

- **Generator 생명주기**: `stateDiagram-v2` (CREATED → RUNNING → SUSPENDED → CLOSED)
- **next() 호출 시 실행 흐름**: `sequenceDiagram` (호출자 ↔ generator 간 yield/next 흐름)
- **send() 양방향 통신**: `sequenceDiagram` (호출자 → send(value) → generator → yield result)
- **데이터 파이프라인**: `flowchart LR` (read → filter → transform → output)

---

## 3. 핵심 구현 포인트

### 3.1 Iterator → Generator 자연스러운 전개

- 섹션 1에서 커스텀 Iterator의 번거로움을 보여준 후, 섹션 2에서 Generator가 이를 얼마나 간결하게 해결하는지 대비
- 같은 기능을 Iterator 클래스 vs Generator 함수로 구현하여 코드 줄 수 비교

### 3.2 메모리 벤치마크로 실용성 증명

- 추상적 설명이 아닌 `tracemalloc` 실측 데이터 제공
- 100만 건 기준 list (수십 MB) vs generator (수 KB) 차이를 표로 시각화

### 3.3 실전 패턴으로 마무리

- 이론 → 고급 기능 → 성능 증명 → 실전 활용 순서로 자연스러운 흐름
- 각 패턴에 "언제 사용하면 좋은지" 가이드 포함
