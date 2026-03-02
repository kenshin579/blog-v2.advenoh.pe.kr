# PRD: Python asyncio 기초부터 실전까지

## 개요
event loop, coroutine, Task, Future 등 asyncio 핵심 개념을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 동시성 & 비동기 프로그래밍
- **번호**: 5-2
- **난이도**: 중-고급
- **우선순위**: ★★★

## 다룰 내용
1. 동기 vs 비동기 개념
   - 블로킹 I/O의 문제: 대기 시간 동안 CPU 유휴
   - 비동기의 핵심: I/O 대기 중 다른 작업 실행
   - 동기/비동기 실행 흐름 다이어그램 비교
2. Event Loop 이해
   - event loop의 역할: 코루틴 스케줄링과 I/O 멀티플렉싱
   - `asyncio.run()`: event loop 생성/실행/종료 원스톱
   - `asyncio.get_event_loop()` vs `asyncio.get_running_loop()` 차이
   - event loop의 실행 사이클 시각화
3. Coroutine (`async def`, `await`)
   - `async def`로 코루틴 함수 정의
   - `await`의 의미: 제어권 반환 + 결과 대기
   - 코루틴 객체 vs 코루틴 함수 차이
   - `await` 가능한 객체: coroutine, Task, Future
4. Task 생성 및 관리 (`asyncio.create_task`)
   - `asyncio.create_task(coro)`: 코루틴을 동시 실행 가능한 Task로 래핑
   - Task 이름 지정: `create_task(coro, name="my-task")`
   - `task.cancel()`: 취소 요청과 `CancelledError` 처리
   - `task.result()`, `task.done()` 상태 확인
5. Future 객체
   - Future: 미래에 완료될 결과의 placeholder
   - Task가 Future의 서브클래스인 관계
   - `future.set_result()`, `future.set_exception()` (저수준 API)
6. `asyncio.gather` vs `asyncio.wait`
   - `gather(*coros)`: 여러 코루틴 동시 실행, 결과 순서 보장
   - `gather(return_exceptions=True)`: 예외를 결과로 수집
   - `wait(tasks, return_when=FIRST_COMPLETED)`: 세밀한 완료 조건 제어
   - `as_completed(coros)`: 완료된 순서대로 처리
7. 비동기 반복 (`async for`, `async with`)
   - `async for`: `__aiter__`, `__anext__` 프로토콜
   - `async with`: `__aenter__`, `__aexit__` 프로토콜
   - 비동기 제네레이터: `async def gen():` + `yield`
   - 비동기 컴프리헨션: `[x async for x in aiter]`
8. 에러 핸들링 (비동기 예외 전파)
   - `try/except` 내에서 `await` 예외 처리
   - `gather`에서 예외 발생 시 다른 Task 동작
   - `TaskGroup` (Python 3.11+) 예외 그룹 처리
   - unhandled exception 경고와 대응법
9. 실전 예제: 비동기 HTTP 요청
   - httpx `AsyncClient` 기본 사용법
   - 여러 URL 동시 요청 (gather 활용)
   - 응답 시간 비교: 동기 requests vs 비동기 httpx

## 샘플 코드
- `tutorials-python/python/asyncio/basics/`

## 참고
- https://docs.python.org/3/library/asyncio.html
- https://realpython.com/async-io-python/
