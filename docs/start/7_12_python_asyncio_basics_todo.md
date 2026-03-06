# TODO: Python asyncio 기초부터 실전까지

## 1단계: 샘플 코드 작성 (`tutorials-python/python/asyncio/basics/`)

- [ ] 디렉토리 구조 생성 (`tutorials-python/python/asyncio/basics/`)
- [ ] `sync_vs_async.py` - 동기 vs 비동기 비교 예제
- [ ] `event_loop_basic.py` - Event Loop 기본 사용법
- [ ] `coroutine_basic.py` - 코루틴 기본 예제 (`async def`, `await`)
- [ ] `task_basic.py` - `asyncio.create_task()` 동시 실행
- [ ] `task_cancel.py` - Task 취소 + `CancelledError` 처리
- [ ] `future_basic.py` - Future 객체 저수준 API
- [ ] `gather_example.py` - `asyncio.gather()` 동시 실행
- [ ] `wait_example.py` - `asyncio.wait()` + `return_when` 옵션
- [ ] `as_completed_example.py` - 완료 순서대로 처리
- [ ] `async_iteration.py` - `async for`, `async with`, 비동기 제네레이터
- [ ] `error_handling.py` - 비동기 예외 처리
- [ ] `taskgroup_example.py` - `TaskGroup` (Python 3.11+)
- [ ] `async_http_request.py` - httpx 비동기 HTTP 요청 + 성능 비교
- [ ] 각 샘플 코드 실행 확인

## 2단계: 블로그 글 작성 (`docs/start/python-asyncio-기초부터-실전까지/index.md`)

- [ ] frontmatter 작성
- [ ] 1. 개요 - 동기 vs 비동기 개념 설명
- [ ] 1. 개요 - 동기/비동기 실행 흐름 Mermaid 다이어그램
- [ ] 2. asyncio 핵심 개념 - Event Loop 설명 + 코드 예제
- [ ] 2. asyncio 핵심 개념 - Event Loop 사이클 Mermaid 다이어그램
- [ ] 2. asyncio 핵심 개념 - Coroutine 설명 + 코드 예제
- [ ] 3. Task와 Future - Task 생성/관리 설명 + 코드 예제
- [ ] 3. Task와 Future - Future 객체 설명 + 코드 예제
- [ ] 4. 여러 코루틴 동시 실행 - gather, wait, as_completed 설명 + 코드 예제
- [ ] 5. 비동기 문법 - async for, async with, 비동기 제네레이터 설명 + 코드 예제
- [ ] 6. 에러 핸들링 - 예외 전파 + TaskGroup 설명 + 코드 예제
- [ ] 7. 실전 예제 - httpx 비동기 HTTP 요청 + 성능 비교
- [ ] 참고 링크 정리
- [ ] tutorials-python GitHub 코드 링크 추가

## 3단계: 검증

- [ ] 전체 샘플 코드 실행 테스트
- [ ] 블로그 글 인코딩 확인 (`file -I`)
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] 코드 블록 언어 태그 확인 (python)
