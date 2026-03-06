# TODO: Python Generator & Iterator 완벽 가이드

## Phase 1: 샘플 코드 작성 (tutorials-python)

### 1-1. 프로젝트 셋업
- [ ] `tutorials-python/python/generator/` 디렉토리 생성
- [ ] `tests/` 디렉토리 생성

### 1-2. Iterator 프로토콜
- [ ] `01_iterator_protocol.py` - 커스텀 Iterator 클래스 구현 (`__iter__`, `__next__`)
- [ ] `StopIteration` 예외 처리 예제
- [ ] `for` 루프 내부 동작 시연 코드

### 1-3. Generator 기본
- [ ] `02_generator_basics.py` - `yield` 함수 기본 예제
- [ ] `inspect.getgeneratorstate()`로 생명주기 상태 확인
- [ ] `next()` 호출 흐름 print 시각화
- [ ] `03_generator_expression.py` - Expression vs Comprehension 비교
- [ ] `sys.getsizeof()` 메모리 차이 측정

### 1-4. Generator 고급 기능
- [ ] `04_send_throw_close.py` - `send()` 러닝 평균 계산기
- [ ] `throw()` 예외 주입 예제
- [ ] `close()` 리소스 해제 패턴
- [ ] `05_yield_from.py` - 서브 제네레이터 위임 예제
- [ ] `yield from iterable` 평탄화 예제
- [ ] 반환값 처리 예제

### 1-5. itertools 활용
- [ ] `06_itertools_examples.py` - 무한 이터레이터 (`count`, `cycle`, `repeat`)
- [ ] 조합 이터레이터 (`chain`, `islice`, `zip_longest`)
- [ ] 필터링 (`takewhile`, `dropwhile`, `filterfalse`)
- [ ] 그룹핑 (`groupby`) - 정렬 필수 주의사항 포함
- [ ] 조합론 (`product`, `permutations`, `combinations`)

### 1-6. 성능과 실전 패턴
- [ ] `07_memory_benchmark.py` - `tracemalloc` 벤치마크 (100만 건 list vs generator)
- [ ] 처리 시간 측정 코드
- [ ] `08_practical_patterns.py` - 대용량 파일 처리 파이프라인
- [ ] 무한 시퀀스 (ID 생성기, 피보나치)
- [ ] 데이터 파이프라인 체이닝

### 1-7. 테스트
- [ ] `tests/test_generator.py` - 각 모듈별 테스트 작성
- [ ] `pytest` 전체 통과 확인

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 2-1. 초안 작성
- [ ] `docs/start/python-generator-iterator-완벽-가이드/index.md` 생성
- [ ] 섹션 1: Iterator 프로토콜
  - [ ] `__iter__`, `__next__` 설명
  - [ ] 커스텀 Iterator vs Generator 코드 줄 수 비교
- [ ] 섹션 2: Generator 기본
  - [ ] 2.1 Generator 함수 (`yield` vs `return`, 생명주기)
  - [ ] 2.2 Generator Expression vs List Comprehension (비교표)
- [ ] 섹션 3: Generator 고급 기능
  - [ ] 3.1 `send()`, `throw()`, `close()` (양방향 통신)
  - [ ] 3.2 `yield from` (서브 제네레이터 위임)
- [ ] 섹션 4: itertools 활용 (함수별 예제표)
- [ ] 섹션 5: 성능과 실전 패턴
  - [ ] 5.1 메모리 효율 비교 (벤치마크 결과표)
  - [ ] 5.2 실전 패턴 (파이프라인, 무한 시퀀스)
- [ ] 섹션 6: 마무리
- [ ] 섹션 7: FAQ
- [ ] 섹션 8: 참고

### 2-2. 다이어그램 (Mermaid)
- [ ] Generator 생명주기 (`stateDiagram-v2`)
- [ ] `next()` 호출 실행 흐름 (`sequenceDiagram`)
- [ ] `send()` 양방향 통신 (`sequenceDiagram`)
- [ ] 데이터 파이프라인 흐름 (`flowchart LR`)

### 2-3. 검토
- [ ] 인코딩 확인 (`file -I` → charset=utf-8)
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] 코드 예제와 tutorials-python 코드 일치 확인
- [ ] GitHub 코드 링크 정확성 확인

---

## Phase 3: 리뷰 및 발행

- [ ] PR 생성 (feature 브랜치)
- [ ] 코드 리뷰 (샘플 코드 동작 확인)
- [ ] 글 리뷰 (맞춤법, 기술 정확성)
- [ ] `docs/start/` → `docs/merge_ready/`로 이동
- [ ] `docs/merge_ready/` → `contents/python/`로 이동 및 발행
