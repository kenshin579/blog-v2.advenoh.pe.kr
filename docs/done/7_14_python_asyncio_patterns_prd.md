# PRD: Python asyncio 실전 패턴

## 개요
Semaphore, Queue, TaskGroup 등 asyncio 고급 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 동시성 & 비동기 프로그래밍
- **번호**: 5-3
- **난이도**: 고급
- **우선순위**: ★★☆

## 다룰 내용

### Part 1. 동시성 제어 - Semaphore와 Rate Limiting
1. Semaphore (동시 실행 제한)
   - `asyncio.Semaphore(n)`: 동시 실행 코루틴 수 제한
   - `async with sem:` 패턴으로 리소스 보호
   - API rate limit 준수 예시 (초당 N개 요청 제한)
   - `BoundedSemaphore`: release 초과 방지
2. Rate Limiting (요청 속도 제한)
   - Token Bucket 알고리즘 비동기 구현
   - Sliding Window 방식
   - `aiolimiter` 라이브러리 활용

### Part 2. Task 실행과 관리 - gather, TaskGroup, Queue
3. `asyncio.gather` vs `TaskGroup` (Python 3.11+)
   - `gather`: 간편하지만 부분 실패 시 나머지 Task 처리 어려움
   - `TaskGroup`: `async with TaskGroup() as tg:` 구조적 동시성
   - `TaskGroup`의 장점: 자동 취소, ExceptionGroup으로 모든 예외 수집
   - 마이그레이션 가이드: gather → TaskGroup 전환
4. asyncio.Queue (생산자-소비자 패턴)
   - `asyncio.Queue(maxsize=N)`: 비동기 큐 생성
   - `await queue.put(item)` / `await queue.get()`
   - 다중 생산자-다중 소비자 구조 설계
   - `queue.join()` / `task_done()`: 모든 작업 완료 대기
   - `PriorityQueue`, `LifoQueue` 변형

### Part 3. 에러 처리와 안전한 종료
5. 비동기 에러 핸들링 패턴
   - `ExceptionGroup` (Python 3.11+): `except*` 문법으로 부분 처리
   - Task 취소 전파: `CancelledError` 처리 모범 사례
   - 재시도 패턴: 지수 백오프를 가진 비동기 retry
   - 에러 격리: 하나의 실패가 전체에 영향 안 주는 구조
6. Graceful Shutdown (signal 처리)
   - `loop.add_signal_handler(SIGTERM, handler)` 등록
   - 실행 중인 Task 목록 수집 → 취소 → 완료 대기
   - `asyncio.shield()`: 특정 코루틴을 취소로부터 보호
   - 실전: FastAPI/웹서버의 graceful shutdown 구현

### Part 4. 리소스 관리
7. 비동기 컨텍스트 매니저
   - `@asynccontextmanager`로 간결하게 작성
   - DB 커넥션 풀, HTTP 세션 lifecycle 관리
   - `AsyncExitStack`으로 동적 개수의 비동기 리소스 관리

### Part 5. 실전 종합 예제
8. 실전 예제
   - 비동기 웹 크롤러: Semaphore + Queue + httpx 조합
   - API 배치 호출: 수백 개 API를 동시에 호출하되 rate limit 준수
   - 파일 비동기 처리: `aiofiles`로 대량 파일 읽기/쓰기

## 블로그 글 목차 (콘텐츠 스타일)

```
# 1. 개요
- asyncio 고급 패턴 소개 및 이 글에서 다루는 범위

# 2. 동시성 제어 - Semaphore와 Rate Limiting

## 2.1 Semaphore로 동시 실행 제한하기
### 기본 사용법
### BoundedSemaphore
### API rate limit 준수 예시

## 2.2 Rate Limiting 구현하기
### Token Bucket 알고리즘
### Sliding Window 방식
### aiolimiter 라이브러리 활용

# 3. Task 실행과 관리 - gather, TaskGroup, Queue

## 3.1 asyncio.gather vs TaskGroup
### gather의 한계
### TaskGroup으로 구조적 동시성 구현하기
### gather → TaskGroup 마이그레이션 가이드

## 3.2 asyncio.Queue로 생산자-소비자 패턴 구현하기
### 기본 사용법
### 다중 생산자-다중 소비자 구조
### PriorityQueue, LifoQueue 변형

# 4. 에러 처리와 안전한 종료

## 4.1 비동기 에러 핸들링 패턴
### ExceptionGroup과 except* 문법
### CancelledError 처리
### 지수 백오프 재시도 패턴
### 에러 격리 구조

## 4.2 Graceful Shutdown
### signal handler 등록
### 실행 중인 Task 정리
### asyncio.shield()로 취소 보호
### FastAPI에서의 graceful shutdown 구현

# 5. 비동기 리소스 관리

## 5.1 비동기 컨텍스트 매니저
### @asynccontextmanager 사용법
### DB 커넥션 풀, HTTP 세션 관리
### AsyncExitStack 활용

# 6. 실전 종합 예제

## 6.1 비동기 웹 크롤러
## 6.2 API 배치 호출
## 6.3 파일 비동기 처리

# 7. 마무리

# 8. 참고
```

## 샘플 코드
- `tutorials-python/python/asyncio/patterns/`

## 참고
- https://docs.python.org/3/library/asyncio-sync.html
- https://docs.python.org/3/library/asyncio-queue.html
