# Implementation: Python asyncio 기초부터 실전까지

## 블로그 글 정보
- **위치**: `docs/start/python-asyncio-기초부터-실전까지/index.md`
- **카테고리**: `python`
- **시리즈**: Python 동시성 & 비동기 프로그래밍 (5-2)
- **샘플 코드**: `tutorials-python/python/asyncio/basics/`

## 구현 사항

### 1. 샘플 코드 작성 (`tutorials-python/python/asyncio/basics/`)

#### 1.1 동기 vs 비동기 비교
- `sync_vs_async.py`: 동기 방식으로 여러 I/O 작업 순차 실행 vs `asyncio`로 동시 실행
- `time.time()`으로 실행 시간 측정하여 차이 출력

#### 1.2 Event Loop
- `event_loop_basic.py`: `asyncio.run()` 기본 사용법
- `asyncio.get_running_loop()` 활용 예제 포함

#### 1.3 Coroutine
- `coroutine_basic.py`: `async def` + `await` 기본 예제
- 코루틴 함수 호출 시 코루틴 객체 반환 확인 (`type()` 출력)
- `await` 없이 코루틴 호출 시 경고 발생 데모

#### 1.4 Task와 Future
- `task_basic.py`: `asyncio.create_task()` 로 동시 실행
- `task_cancel.py`: `task.cancel()` + `CancelledError` 처리
- `future_basic.py`: Future 객체 직접 사용 (저수준 API)

#### 1.5 여러 코루틴 동시 실행
- `gather_example.py`: `asyncio.gather()` 로 여러 코루틴 동시 실행, 결과 순서 보장
- `wait_example.py`: `asyncio.wait()` + `return_when` 옵션
- `as_completed_example.py`: 완료 순서대로 처리

#### 1.6 비동기 문법
- `async_iteration.py`: `async for`, `async with` 사용 예제
- 비동기 제네레이터 + 비동기 컴프리헨션 포함

#### 1.7 에러 핸들링
- `error_handling.py`: `try/except` + `await` 예외 처리
- `taskgroup_example.py`: `TaskGroup` (Python 3.11+) 예외 그룹 처리

#### 1.8 실전 예제
- `async_http_request.py`: httpx `AsyncClient`로 여러 URL 동시 요청
- 동기 `requests` vs 비동기 `httpx` 응답 시간 비교 출력

### 2. 블로그 글 작성

#### 2.1 frontmatter
```yaml
title: "Python asyncio 기초부터 실전까지"
description: "Python asyncio 기초부터 실전까지"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - asyncio
  - async
  - await
  - coroutine
  - event loop
  - task
  - future
  - gather
  - 비동기
  - 파이썬
series: "Python 동시성 & 비동기 프로그래밍"
```

#### 2.2 본문 구성
- 각 섹션마다 개념 설명 + 코드 예제 + 실행 결과 포함
- 다이어그램은 Mermaid 형식 사용 (동기/비동기 흐름 비교, Event Loop 사이클)
- 샘플 코드는 `tutorials-python/` GitHub 링크로 참조

#### 2.3 다이어그램 (Mermaid)
- 동기 vs 비동기 실행 흐름 비교: `sequenceDiagram`
- Event Loop 동작 사이클: `flowchart`
- Task/Future 관계: `classDiagram`

### 3. 의존성
- 샘플 코드에서 사용하는 패키지: `httpx`, `requests` (비교용)
- Python 3.11+ 권장 (`TaskGroup` 사용)
