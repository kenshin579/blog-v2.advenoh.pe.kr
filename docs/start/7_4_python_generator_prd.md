# PRD: Python Generator & Iterator

## 개요
yield, generator expression, itertools를 활용한 메모리 효율적 데이터 처리를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 함수형 패턴
- **번호**: 2-2
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용

### # 1. Iterator 프로토콜
- `for` 루프가 내부적으로 호출하는 메서드 (`__iter__`, `__next__`)
- `StopIteration` 예외의 역할
- 커스텀 Iterator 클래스 직접 구현

### # 2. Generator 기본
- **## 2.1 Generator 함수 (`yield`)**
  - `yield`와 `return`의 차이: 상태 보존 원리
  - generator 객체의 생명주기 (CREATED → RUNNING → SUSPENDED → CLOSED)
  - `next()` 호출 시 실행 흐름 시각화
- **## 2.2 Generator Expression vs List Comprehension**
  - 문법 비교: `(x for x in range(n))` vs `[x for x in range(n)]`
  - 메모리 사용량 차이 (lazy vs eager evaluation)
  - 언제 어떤 것을 선택해야 하는지 기준

### # 3. Generator 고급 기능
- **## 3.1 `send()`, `throw()`, `close()`**
  - `send(value)`: generator에 값 전달하기 (양방향 통신)
  - `throw(exc_type)`: generator 내부에 예외 주입
  - `close()`: GeneratorExit 예외로 generator 종료
  - 코루틴 초기 형태로서의 generator
- **## 3.2 `yield from` (서브 제네레이터 위임)**
  - 중첩 generator 코드 간결화
  - 반환값 처리: `result = yield from sub_gen()`
  - `yield from iterable`로 이터러블 평탄화

### # 4. itertools 활용
- 무한 이터레이터: `count()`, `cycle()`, `repeat()`
- 조합 이터레이터: `chain()`, `islice()`, `zip_longest()`
- 필터링: `takewhile()`, `dropwhile()`, `filterfalse()`
- 그룹핑: `groupby()` (정렬 필수 주의)
- 조합론: `product()`, `permutations()`, `combinations()`

### # 5. 성능과 실전 패턴
- **## 5.1 메모리 효율 비교 (list vs generator 벤치마크)**
  - `sys.getsizeof()` / `tracemalloc`으로 메모리 사용량 측정
  - 100만 건 데이터 처리 시 list vs generator 비교
  - 처리 속도 vs 메모리 사용량 트레이드오프
- **## 5.2 실전 패턴**
  - 대용량 파일 처리: 라인 단위 읽기 + 변환 파이프라인
  - 무한 시퀀스: ID 생성기, 피보나치 수열
  - 데이터 파이프라인: `|` 스타일 체이닝 패턴

## 샘플 코드
- `tutorials-python/python/generator/`

## 참고
- https://docs.python.org/3/howto/functional.html
- https://docs.python.org/3/library/itertools.html
