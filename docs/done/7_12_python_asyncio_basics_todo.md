# TODO: Python asyncio 기초부터 실전까지

## 1단계: 샘플 코드 작성 (`tutorials-python/python/asyncio/basics/`)

- [x] 디렉토리 구조 생성 (`tutorials-python/python/asyncio/basics/`)
- [x] `01_sync_vs_async.py` - 동기 vs 비동기 비교 예제
- [x] `02_event_loop.py` - Event Loop 기본 사용법
- [x] `03_coroutine.py` - 코루틴 기본 예제 (`async def`, `await`)
- [x] `04_task.py` - `asyncio.create_task()` 동시 실행, 취소
- [x] `05_future.py` - Future 객체 저수준 API
- [x] `06_gather_wait.py` - `asyncio.gather()`, `wait()`, `as_completed()`
- [x] `07_async_syntax.py` - `async for`, `async with`, 비동기 제네레이터
- [x] `08_error_handling.py` - 비동기 예외 처리, `TaskGroup`
- [x] 각 샘플 코드 실행 확인 (테스트 26개 통과)

## 2단계: 블로그 글 작성 (`docs/start/python-asyncio-기초부터-실전까지/index.md`)

- [x] frontmatter 작성
- [x] 1. 개요 - 동기 vs 비동기 개념 설명 + Mermaid 다이어그램
- [x] 2. asyncio 핵심 개념 - Event Loop + Mermaid 다이어그램
- [x] 2. asyncio 핵심 개념 - Coroutine 설명 + 코드 예제
- [x] 3. Task와 Future - Task 생성/관리/취소 + Future 설명
- [x] 4. 여러 코루틴 동시 실행 - gather, wait, as_completed 비교표
- [x] 5. 비동기 문법 - async for, async with, 비동기 제네레이터
- [x] 6. 에러 핸들링 - 예외 전파 + TaskGroup 비교표
- [x] 7. 실전 예제 - httpx 비동기 HTTP 요청
- [x] 8. 마치며 + 참고 링크
- [x] tutorials-python GitHub 코드 링크 추가

## 3단계: 검증

- [x] 전체 샘플 코드 실행 테스트 (26개 통과)
- [x] 블로그 글 인코딩 확인 (`file -I`) - UTF-8
- [x] `npm run build` 빌드 성공
- [x] 코드 블록 언어 태그 확인 (python)
