---
title: "Python asyncio 실전 패턴 - Semaphore, TaskGroup, Queue 완벽 가이드"
description: "Python asyncio 실전 패턴 - Semaphore, TaskGroup, Queue 완벽 가이드"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - asyncio
  - semaphore
  - taskgroup
  - queue
  - rate limiting
  - 비동기
  - 파이썬
  - 동시성
  - graceful shutdown
  - exception group
  - context manager
series: "Python 동시성 & 비동기 프로그래밍"
---

# 1. 개요

asyncio의 기본적인 `async/await` 문법을 넘어, 실전에서 자주 마주하는 고급 패턴들을 다룬다. 동시 요청 제한, Task 관리, 에러 처리, 안전한 종료까지 프로덕션 환경에서 필요한 핵심 패턴을 정리한다.

이 글에서 다루는 범위는 다음과 같다.

| Part | 주제 | 핵심 키워드 |
|------|------|-------------|
| Part 1 | 동시성 제어 | Semaphore, Rate Limiting |
| Part 2 | Task 실행과 관리 | gather, TaskGroup, Queue |
| Part 3 | 에러 처리와 안전한 종료 | ExceptionGroup, Graceful Shutdown |
| Part 4 | 리소스 관리 | 비동기 컨텍스트 매니저 |
| Part 5 | 실전 종합 예제 | 크롤러, 배치 호출, 파일 처리 |

> 이 글의 예제는 Python 3.11+ 기준으로 작성되었다. TaskGroup, ExceptionGroup, `except*` 문법은 Python 3.11에서 도입되었다.

# 2. 동시성 제어 - Semaphore와 Rate Limiting

## 2.1 Semaphore로 동시 실행 제한하기

`asyncio.Semaphore`는 동시에 실행할 수 있는 코루틴 수를 제한한다. 내부적으로 카운터를 가지고 있어서 `acquire()` 시 카운터가 감소하고, `release()` 시 증가한다. 카운터가 0이면 대기한다.

### 기본 사용법

```python
async def basic_semaphore():
    sem = asyncio.Semaphore(3)  # 동시 3개까지 실행

    async def worker(name: str, duration: float):
        async with sem:  # acquire + release 자동 관리
            print(f"[{name}] 시작")
            await asyncio.sleep(duration)
            print(f"[{name}] 완료")

    tasks = [worker(f"T{i}", 0.3) for i in range(5)]
    await asyncio.gather(*tasks)  # 3개씩 실행되므로 ~0.6s
```

5개의 Task가 있지만 Semaphore가 3이므로 3개가 먼저 실행되고, 완료되면 나머지 2개가 실행된다.

### BoundedSemaphore

`BoundedSemaphore`는 `acquire()` 없이 `release()`를 호출하면 `ValueError`를 발생시킨다. 일반 `Semaphore`는 카운터만 증가시켜 버그를 숨길 수 있으므로, 안전한 코드를 위해 `BoundedSemaphore` 사용을 권장한다.

```python
sem = asyncio.Semaphore(2)
bsem = asyncio.BoundedSemaphore(2)

sem.release()   # 카운터가 3이 됨 (의도하지 않은 동작)

try:
    bsem.release()  # ValueError 발생
except ValueError as e:
    print(f"BoundedSemaphore: {e}")
```

### API Rate Limit 준수 예시

Semaphore를 데코레이터로 감싸면 깔끔하게 재사용할 수 있다.

```python
def limit_concurrency(sem: asyncio.Semaphore):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            async with sem:
                return await func(*args, **kwargs)
        return wrapper
    return decorator

sem = asyncio.Semaphore(5)

@limit_concurrency(sem)
async def call_api(api_id: int):
    await asyncio.sleep(0.1)
    return f"result-{api_id}"

results = await asyncio.gather(*[call_api(i) for i in range(20)])
```

## 2.2 Rate Limiting 구현하기

Semaphore는 "동시 실행 수"를 제한하지만, "초당 요청 수"는 제한하지 못한다. 이를 위해 Token Bucket이나 Sliding Window 알고리즘을 사용한다.

### Token Bucket 알고리즘

일정 속도로 토큰이 채워지고, 요청 시 토큰을 소비한다. 버킷이 비면 토큰이 채워질 때까지 대기한다. 짧은 버스트를 허용하면서 평균 요청 속도를 제한할 수 있다.

```python
class TokenBucket:
    def __init__(self, rate: float, capacity: int):
        self.rate = rate          # 초당 토큰 생성 속도
        self.capacity = capacity  # 버킷 최대 용량
        self.tokens = capacity
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_refill = now

    async def acquire(self):
        async with self._lock:
            while True:
                self._refill()
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                wait_time = (1 - self.tokens) / self.rate
                await asyncio.sleep(wait_time)

    async def __aenter__(self):
        await self.acquire()
        return self

    async def __aexit__(self, *args):
        pass
```

### Sliding Window 방식

최근 N초 동안의 요청 수를 추적한다. Token Bucket보다 정확하게 "초당 N개"를 보장한다.

```python
class SlidingWindowLimiter:
    def __init__(self, max_requests: int, window_size: float = 1.0):
        self.max_requests = max_requests
        self.window_size = window_size
        self.requests: deque[float] = deque()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            while True:
                now = time.monotonic()
                # 윈도우 밖의 오래된 요청 제거
                while self.requests and self.requests[0] <= now - self.window_size:
                    self.requests.popleft()
                if len(self.requests) < self.max_requests:
                    self.requests.append(now)
                    return
                wait_time = self.requests[0] + self.window_size - now
                await asyncio.sleep(wait_time)
```

### aiolimiter 라이브러리 활용

직접 구현하는 대신 `aiolimiter` 라이브러리를 사용하면 간편하다.

```python
from aiolimiter import AsyncLimiter

# 1초당 최대 20개 요청
limiter = AsyncLimiter(max_rate=20, time_period=1)

async def call_api(api_id: int):
    async with limiter:
        # API 호출
        ...
```

> `aiolimiter`에 대한 더 자세한 내용은 [Python으로 API 호출에 Rate Limiting 적용하기](/article/python으로-api-호출에-rate-limiting-적용하기-aiolimiter와-aiometer-사용법) 글을 참고하면 된다.

# 3. Task 실행과 관리 - gather, TaskGroup, Queue

## 3.1 asyncio.gather vs TaskGroup

### gather의 한계

`asyncio.gather`는 여러 코루틴을 동시에 실행하는 가장 간단한 방법이다. 하지만 부분 실패 처리에 한계가 있다.

```python
# 기본 사용법
results = await asyncio.gather(
    fetch_data("API-1", 0.1),
    fetch_data("API-2", 0.2),
    fetch_data("API-3", 0.1),
)
```

`return_exceptions=False`(기본값)이면 첫 번째 예외만 전파되고, **나머지 Task는 취소되지 않고 백그라운드에서 계속 실행된다.** 이는 리소스 누수로 이어질 수 있다.

```python
# return_exceptions=True로 예외를 결과에 포함
results = await asyncio.gather(
    fetch_data("API-1", 0.1),
    fetch_data("API-2", 0.1, should_fail=True),
    fetch_data("API-3", 0.1),
    return_exceptions=True,
)
for r in results:
    if isinstance(r, Exception):
        print(f"실패: {r}")
    else:
        print(f"성공: {r}")
```

### TaskGroup으로 구조적 동시성 구현하기

Python 3.11에서 도입된 `TaskGroup`은 구조적 동시성(Structured Concurrency) 패턴을 구현한다. 하나의 Task가 실패하면 나머지를 **자동으로 취소**한다.

```python
async with asyncio.TaskGroup() as tg:
    tg.create_task(fetch_data("API-1", 0.3))
    tg.create_task(fetch_data("API-2", 0.1, should_fail=True))
    tg.create_task(fetch_data("API-3", 0.3))
# API-2 실패 → API-1, API-3 자동 취소 → ExceptionGroup 발생
```

여러 Task가 동시에 실패하면 `ExceptionGroup`으로 **모든 예외를 수집**한다.

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(task_that_fails_1())
        tg.create_task(task_that_fails_2())
except* ValueError as eg:
    for exc in eg.exceptions:
        print(f"ValueError: {exc}")
except* TypeError as eg:
    for exc in eg.exceptions:
        print(f"TypeError: {exc}")
```

### gather vs TaskGroup 비교

| 항목 | `gather` | `TaskGroup` |
|------|----------|-------------|
| Python 버전 | 3.4+ | 3.11+ |
| 실패 시 동작 | 첫 예외만 전파, 나머지 계속 실행 | 전체 취소 |
| 예외 수집 | `return_exceptions=True` 필요 | `ExceptionGroup` 자동 수집 |
| 리소스 누수 | 가능 | 없음 (자동 취소) |
| 결과 수집 | 리스트로 반환 | 직접 수집 필요 |

### gather → TaskGroup 마이그레이션 가이드

```python
# Before: gather
results = await asyncio.gather(
    fetch("A"), fetch("B"), fetch("C"),
)

# After: TaskGroup
results = {}
async def run_and_store(key):
    results[key] = await fetch(key)

async with asyncio.TaskGroup() as tg:
    tg.create_task(run_and_store("A"))
    tg.create_task(run_and_store("B"))
    tg.create_task(run_and_store("C"))
```

## 3.2 asyncio.Queue로 생산자-소비자 패턴 구현하기

### 기본 사용법

`asyncio.Queue`는 비동기 FIFO 큐다. `put()`과 `get()`이 모두 코루틴이어서 `await`로 호출한다.

```python
queue: asyncio.Queue[str] = asyncio.Queue(maxsize=5)

# 데이터 넣기
await queue.put("item-1")

# 데이터 꺼내기
item = await queue.get()
queue.task_done()  # 처리 완료 알림
```

`maxsize`를 지정하면 큐가 가득 찼을 때 `put()`이 대기한다. 이를 통해 **배압(backpressure)** 을 구현할 수 있다.

### 다중 생산자-다중 소비자 구조

```python
async def producer(name: str, queue: asyncio.Queue, count: int):
    for i in range(count):
        await queue.put((name, i))

async def consumer(name: str, queue: asyncio.Queue):
    while True:
        try:
            item = await asyncio.wait_for(queue.get(), timeout=0.5)
        except asyncio.TimeoutError:
            break
        # 처리 로직
        queue.task_done()

queue = asyncio.Queue(maxsize=10)
producers = [producer("P1", queue, 5), producer("P2", queue, 5)]
consumers = [consumer("C1", queue), consumer("C2", queue), consumer("C3", queue)]
await asyncio.gather(*producers, *consumers)
```

`queue.join()`을 사용하면 모든 항목의 `task_done()`이 호출될 때까지 대기할 수 있다.

```python
workers = [asyncio.create_task(worker(f"W{i}")) for i in range(3)]
for i in range(9):
    await queue.put(i)
await queue.join()  # 모든 작업 완료 대기
for w in workers:
    w.cancel()  # 워커 정리
```

### PriorityQueue, LifoQueue 변형

```python
# PriorityQueue: 낮은 값이 높은 우선순위
pq: asyncio.PriorityQueue = asyncio.PriorityQueue()
await pq.put((1, "높은 우선순위"))
await pq.put((3, "낮은 우선순위"))
await pq.put((2, "중간 우선순위"))

item = await pq.get()  # (1, "높은 우선순위")

# LifoQueue: 스택 (후입선출)
lq: asyncio.LifoQueue = asyncio.LifoQueue()
await lq.put("first")
await lq.put("second")
item = await lq.get()  # "second"
```

# 4. 에러 처리와 안전한 종료

## 4.1 비동기 에러 핸들링 패턴

### ExceptionGroup과 except* 문법

Python 3.11에서 도입된 `except*`는 `ExceptionGroup` 안의 예외를 타입별로 분리해서 처리한다.

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(task_a())  # ValueError 발생
        tg.create_task(task_b())  # TypeError 발생
        tg.create_task(task_c())  # 성공
except* ValueError as eg:
    for exc in eg.exceptions:
        print(f"ValueError: {exc}")
except* TypeError as eg:
    for exc in eg.exceptions:
        print(f"TypeError: {exc}")
```

> `except*` 블록 안에서는 `return`, `break`, `continue`를 사용할 수 없다.

### CancelledError 처리

Task가 취소되면 `CancelledError`가 발생한다. 이때 **정리 작업을 수행한 후 반드시 다시 raise**해야 한다.

```python
async def long_running_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # 정리 작업 (DB 연결 해제, 파일 닫기 등)
        await cleanup()
        raise  # 반드시 다시 raise

task = asyncio.create_task(long_running_task())
task.cancel(msg="타임아웃으로 인한 취소")  # Python 3.9+
```

### 지수 백오프 재시도 패턴

네트워크 요청 실패 시 지수적으로 대기 시간을 늘려가며 재시도한다. `jitter`를 추가하면 여러 클라이언트가 동시에 재시도하는 thundering herd 문제를 방지할 수 있다.

```python
def async_retry(max_retries=3, base_delay=0.1, max_delay=10.0,
                exceptions=(Exception,), jitter=True):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_retries:
                        raise
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    if jitter:
                        delay *= random.uniform(0.5, 1.5)
                    await asyncio.sleep(delay)
        return wrapper
    return decorator

@async_retry(max_retries=5, exceptions=(ConnectionError, TimeoutError))
async def flaky_api_call(url: str):
    ...
```

### 에러 격리 구조

개별 Task의 실패가 전체에 영향을 주지 않게 하려면 래퍼 함수로 에러를 격리한다.

```python
async def safe_execute(coro, default=None):
    try:
        return await coro
    except Exception as e:
        print(f"에러 격리: {e}")
        return default

results = await asyncio.gather(
    safe_execute(call_api("users")),
    safe_execute(call_api("orders"), default={}),
    safe_execute(call_api("products")),
)
```

TaskGroup에서 부분 실패를 허용하려면 Task 내부에서 예외를 처리한다.

```python
async with asyncio.TaskGroup() as tg:
    async def safe_task(name, should_fail):
        try:
            if should_fail:
                raise ValueError(f"{name} 실패")
            results[name] = f"{name} 성공"
        except ValueError as e:
            results[name] = f"에러: {e}"

    tg.create_task(safe_task("API-1", False))
    tg.create_task(safe_task("API-2", True))
```

## 4.2 Graceful Shutdown

### signal handler 등록

`loop.add_signal_handler`로 SIGTERM/SIGINT 신호를 처리한다.

```python
async def main():
    shutdown_event = asyncio.Event()

    def signal_handler():
        print("SIGTERM 수신 - shutdown 시작")
        shutdown_event.set()

    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGTERM, signal_handler)
    loop.add_signal_handler(signal.SIGINT, signal_handler)

    await shutdown_event.wait()
```

### 실행 중인 Task 정리

모든 실행 중인 Task를 수집하고 취소한다.

```python
current = asyncio.current_task()
all_tasks = [t for t in asyncio.all_tasks() if t is not current and not t.done()]

for task in all_tasks:
    task.cancel()

await asyncio.gather(*all_tasks, return_exceptions=True)
```

### asyncio.shield()로 취소 보호

`asyncio.shield()`로 감싼 코루틴은 외부 취소에 영향을 받지 않는다. DB 커밋이나 파일 저장 같은 중요 작업에 사용한다.

```python
async def main_task():
    try:
        result = await asyncio.shield(important_cleanup())
        return result
    except asyncio.CancelledError:
        print("메인은 취소되었지만 shield 내부 작업은 계속 진행")
        raise
```

### 타임아웃 있는 Graceful Shutdown

타임아웃 내에 종료되지 않으면 강제 취소한다.

```python
done, pending = await asyncio.wait(tasks, timeout=5.0)
if pending:
    print(f"{len(pending)}개 Task 강제 취소")
    for task in pending:
        task.cancel()
    await asyncio.gather(*pending, return_exceptions=True)
```

# 5. 비동기 리소스 관리

## 5.1 비동기 컨텍스트 매니저

### @asynccontextmanager 사용법

`@asynccontextmanager`를 사용하면 클래스 없이 간결하게 비동기 컨텍스트 매니저를 만들 수 있다.

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def db_transaction(conn_name: str):
    print(f"[{conn_name}] 트랜잭션 시작")
    committed = False
    try:
        yield conn_name
        committed = True
        print(f"[{conn_name}] 커밋")
    except Exception as e:
        print(f"[{conn_name}] 롤백 (에러: {e})")
        raise
    finally:
        status = "커밋됨" if committed else "롤백됨"
        print(f"[{conn_name}] 트랜잭션 종료 ({status})")

async with db_transaction("main-db") as conn:
    # INSERT, UPDATE 등 수행
    ...
```

### DB 커넥션 풀, HTTP 세션 관리

클래스 기반으로 `__aenter__`와 `__aexit__`를 구현하면 연결/해제 lifecycle을 관리할 수 있다.

```python
class AsyncDBConnection:
    def __init__(self, db_name: str):
        self.db_name = db_name

    async def __aenter__(self):
        await self._connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._disconnect()
        return False  # 예외를 전파

async with AsyncDBConnection("mydb") as conn:
    result = await conn.query("SELECT * FROM users")
```

### AsyncExitStack 활용

`AsyncExitStack`은 동적 개수의 비동기 리소스를 관리할 때 유용하다.

```python
from contextlib import AsyncExitStack

async with AsyncExitStack() as stack:
    # 동적으로 여러 DB 연결 생성
    connections = []
    for name in ["db-1", "db-2", "db-3"]:
        conn = await stack.enter_async_context(AsyncDBConnection(name))
        connections.append(conn)

    # 모든 연결에서 쿼리 실행
    for conn in connections:
        await conn.query("SELECT 1")
# AsyncExitStack을 벗어나면 모든 연결이 자동 해제
```

비동기/동기 정리 콜백도 등록할 수 있다. 콜백은 LIFO(후입선출) 순서로 실행된다.

```python
async with AsyncExitStack() as stack:
    stack.push_async_callback(async_cleanup, "세션")
    stack.callback(sync_cleanup, "로그")
```

# 6. 실전 종합 예제

## 6.1 비동기 웹 크롤러

Semaphore + Queue + httpx를 조합한 비동기 웹 크롤러이다.

```python
class AsyncCrawler:
    def __init__(self, max_concurrent: int = 5, num_workers: int = 3):
        self.sem = asyncio.Semaphore(max_concurrent)
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.num_workers = num_workers
        self.results: dict[str, dict] = {}

    async def fetch(self, url: str) -> dict:
        async with self.sem:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10)
                return {"url": url, "status": response.status_code,
                        "length": len(response.text)}

    async def worker(self, worker_id: int):
        while True:
            url = await self.queue.get()
            try:
                result = await self.fetch(url)
                self.results[url] = result
            except Exception as e:
                self.results[url] = {"url": url, "error": str(e)}
            finally:
                self.queue.task_done()

    async def crawl(self, urls: list[str]) -> dict[str, dict]:
        for url in urls:
            await self.queue.put(url)

        workers = [asyncio.create_task(self.worker(i))
                   for i in range(self.num_workers)]
        await self.queue.join()  # 모든 URL 처리 대기
        for w in workers:
            w.cancel()
        return self.results
```

## 6.2 API 배치 호출

수백 개 API를 동시에 호출하되, Semaphore + TaskGroup으로 동시 실행 수를 제한한다.

```python
async def batch_api_call(api_ids: list[int], max_concurrent: int = 10):
    sem = asyncio.Semaphore(max_concurrent)
    results: dict[int, dict] = {}

    async def call_api(api_id: int):
        async with sem:
            await asyncio.sleep(0.05)  # API 호출
            results[api_id] = {"id": api_id, "data": f"response-{api_id}"}

    async with asyncio.TaskGroup() as tg:
        for api_id in api_ids:
            tg.create_task(call_api(api_id))

    return results
```

대량 처리 시 청크 단위로 나눠 처리하면 메모리 사용을 줄일 수 있다.

```python
async def chunked_batch(items: list, chunk_size: int = 10, delay: float = 1.0):
    all_results = []
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i + chunk_size]
        results = await asyncio.gather(*[process(item) for item in chunk])
        all_results.extend(results)
        if i + chunk_size < len(items):
            await asyncio.sleep(delay)  # 청크 사이 대기
    return all_results
```

## 6.3 파일 비동기 처리

Python의 기본 파일 I/O는 동기 방식이다. `loop.run_in_executor()`로 스레드 풀에서 실행하면 이벤트 루프를 블로킹하지 않는다.

```python
loop = asyncio.get_running_loop()

def write_sync(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

await loop.run_in_executor(None, write_sync, "file.txt", "내용")
```

`aiofiles` 라이브러리를 사용하면 더 간결하다.

```python
import aiofiles

async with aiofiles.open("file.txt", mode="w", encoding="utf-8") as f:
    await f.write("비동기 파일 쓰기")

async with aiofiles.open("file.txt", mode="r", encoding="utf-8") as f:
    content = await f.read()
```

대량 파일 처리 시 Semaphore로 동시 I/O를 제한해야 시스템 리소스를 보호할 수 있다.

```python
sem = asyncio.Semaphore(5)

async def process_file(path: str):
    async with sem:
        content = await loop.run_in_executor(None, read_sync, path)
        return {"path": path, "lines": content.count("\n")}

results = await asyncio.gather(*[process_file(p) for p in paths])
```

# 7. 마무리

이 글에서 다룬 asyncio 고급 패턴을 정리하면 다음과 같다.

| 패턴 | 용도 | 핵심 API |
|------|------|----------|
| Semaphore | 동시 실행 수 제한 | `asyncio.Semaphore(n)` |
| Rate Limiting | 초당 요청 수 제한 | Token Bucket, Sliding Window |
| TaskGroup | 구조적 동시성 | `async with TaskGroup()` |
| Queue | 생산자-소비자 | `asyncio.Queue(maxsize=N)` |
| ExceptionGroup | 다중 에러 처리 | `except* ErrorType` |
| Graceful Shutdown | 안전한 종료 | `add_signal_handler`, `shield()` |
| 비동기 컨텍스트 매니저 | 리소스 lifecycle | `@asynccontextmanager` |
| 재시도 | 네트워크 복원력 | 지수 백오프 + jitter |

실전에서는 이 패턴들을 조합해서 사용한다. 예를 들어 비동기 웹 크롤러는 Semaphore(동시성 제한) + Queue(작업 분배) + 재시도(복원력)를 함께 사용한다.

전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-python/tree/master/python/asyncio/patterns)에서 확인할 수 있다.

# 8. 참고

- [Python asyncio 공식 문서 - Synchronization Primitives](https://docs.python.org/3/library/asyncio-sync.html)
- [Python asyncio 공식 문서 - Queues](https://docs.python.org/3/library/asyncio-queue.html)
- [Python asyncio 공식 문서 - Task Groups](https://docs.python.org/3/library/asyncio-task.html#task-groups)
- [PEP 654 - Exception Groups and except*](https://peps.python.org/pep-0654/)
- [Python으로 API 호출에 Rate Limiting 적용하기](/article/python으로-api-호출에-rate-limiting-적용하기-aiolimiter와-aiometer-사용법)
