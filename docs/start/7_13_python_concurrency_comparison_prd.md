# PRD: Python 동시성 비교 - threading vs multiprocessing vs asyncio

## 개요
GIL 이해와 함께 세 가지 동시성 모델을 비교하고 선택 기준을 제시하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 비동기 프로그래밍
- **번호**: 3-2
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. GIL (Global Interpreter Lock) 이해
2. CPU-bound vs I/O-bound 작업
3. threading 모듈 (Thread, Lock, Event, Condition)
4. multiprocessing 모듈 (Process, Pool, Queue, Pipe)
5. asyncio (event loop, coroutine)
6. concurrent.futures (ThreadPoolExecutor, ProcessPoolExecutor)
7. 성능 벤치마크 비교 (동일 작업, 세 방식)
8. 선택 기준 의사결정 트리
9. Python 3.12+ GIL 개선 (PEP 703, free-threading)

## 샘플 코드
- `tutorials-python/python/concurrency/`

## 참고
- https://docs.python.org/3/library/concurrency.html
- https://realpython.com/python-concurrency/
