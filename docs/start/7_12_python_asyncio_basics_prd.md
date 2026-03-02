# PRD: Python asyncio 기초부터 실전까지

## 개요
event loop, coroutine, Task, Future 등 asyncio 핵심 개념을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 비동기 프로그래밍
- **번호**: 3-1
- **난이도**: 중-고급
- **우선순위**: ★★★

## 다룰 내용
1. 동기 vs 비동기 개념
2. Event Loop 이해
3. Coroutine (`async def`, `await`)
4. Task 생성 및 관리 (`asyncio.create_task`)
5. Future 객체
6. `asyncio.gather` vs `asyncio.wait`
7. 비동기 반복 (`async for`, `async with`)
8. 에러 핸들링 (비동기 예외 전파)
9. 실전 예제: 비동기 HTTP 요청 (aiohttp/httpx)

## 샘플 코드
- `tutorials-python/python/asyncio/basics/`

## 참고
- https://docs.python.org/3/library/asyncio.html
- https://realpython.com/async-io-python/
