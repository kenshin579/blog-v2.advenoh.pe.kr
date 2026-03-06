# TODO: Python asyncio 실전 패턴

## Phase 1: 샘플 코드 작성 (tutorials-python)

### 동시성 제어
- [x] `semaphore_example.py` - Semaphore 기본 사용법
  - [x] asyncio.Semaphore(n)으로 동시 실행 제한
  - [x] async with sem: 패턴
  - [x] BoundedSemaphore 비교
  - [x] API rate limit 준수 예시 (초당 N개 요청)
- [x] `rate_limiter.py` - Rate Limiting 구현
  - [x] Token Bucket 알고리즘 직접 구현
  - [x] Sliding Window 방식 구현
  - [x] aiolimiter 라이브러리 활용 예제

### Task 실행과 관리
- [x] `gather_vs_taskgroup.py` - gather vs TaskGroup 비교
  - [x] gather 기본 사용 + 부분 실패 시 동작
  - [x] TaskGroup 구조적 동시성 예제
  - [x] 자동 취소 + ExceptionGroup 수집 동작 확인
  - [x] gather → TaskGroup 마이그레이션 예제
- [x] `producer_consumer.py` - asyncio.Queue 패턴
  - [x] 기본 Queue put/get 사용법
  - [x] 다중 생산자-다중 소비자 구조
  - [x] queue.join() / task_done() 완료 대기
  - [x] PriorityQueue, LifoQueue 변형 예제

### 에러 처리와 안전한 종료
- [x] `error_handling.py` - 비동기 에러 핸들링
  - [x] ExceptionGroup + except* 문법
  - [x] CancelledError 처리 모범 사례
  - [x] 에러 격리 구조
- [x] `retry_pattern.py` - 지수 백오프 재시도
  - [x] 비동기 retry 데코레이터 구현
  - [x] 지수 백오프 + jitter 적용
- [x] `graceful_shutdown.py` - Graceful Shutdown
  - [x] loop.add_signal_handler(SIGTERM, handler) 등록
  - [x] 실행 중 Task 수집 → 취소 → 완료 대기
  - [x] asyncio.shield()로 특정 코루틴 보호

### 리소스 관리
- [x] `async_context_manager.py` - 비동기 컨텍스트 매니저
  - [x] @asynccontextmanager 사용법
  - [x] DB 커넥션 풀 / HTTP 세션 lifecycle 관리
  - [x] AsyncExitStack 활용 예제

### 실전 종합 예제
- [x] `async_crawler.py` - 비동기 웹 크롤러
  - [x] Semaphore + Queue + httpx 조합
- [x] `batch_api_call.py` - API 배치 호출
  - [x] rate limit 준수하며 수백 개 API 동시 호출
- [x] `async_file_io.py` - 파일 비동기 처리
  - [x] aiofiles로 대량 파일 읽기/쓰기

## Phase 2: 테스트 작성
- [x] pytest + pytest-asyncio 설정
- [x] 각 샘플 코드에 대한 테스트 케이스 작성
- [x] 전체 테스트 통과 확인 (46개 테스트 통과)

## Phase 3: 블로그 글 작성
- [x] `docs/start/7_14_python_asyncio_patterns/index.md` 초안 작성
  - [x] # 1. 개요
  - [x] # 2. 동시성 제어 - Semaphore와 Rate Limiting
    - [x] ## 2.1 Semaphore로 동시 실행 제한하기
    - [x] ## 2.2 Rate Limiting 구현하기
  - [x] # 3. Task 실행과 관리 - gather, TaskGroup, Queue
    - [x] ## 3.1 asyncio.gather vs TaskGroup
    - [x] ## 3.2 asyncio.Queue로 생산자-소비자 패턴 구현하기
  - [x] # 4. 에러 처리와 안전한 종료
    - [x] ## 4.1 비동기 에러 핸들링 패턴
    - [x] ## 4.2 Graceful Shutdown
  - [x] # 5. 비동기 리소스 관리
    - [x] ## 5.1 비동기 컨텍스트 매니저
  - [x] # 6. 실전 종합 예제
    - [x] ## 6.1 비동기 웹 크롤러
    - [x] ## 6.2 API 배치 호출
    - [x] ## 6.3 파일 비동기 처리
  - [x] # 7. 마무리
  - [x] # 8. 참고
- [x] 각 섹션에 GitHub 샘플 코드 링크 연결
- [x] 비교 항목 표(table) 정리 (gather vs TaskGroup 등)
- [x] UTF-8 인코딩 확인 (`file -I`) - charset=utf-8 확인

## Phase 4: 리뷰 및 발행
- [ ] PR 생성 (feature 브랜치)
- [ ] 리뷰 완료 후 `docs/merge_ready/`로 이동
- [ ] 발행 시 `contents/python/`으로 이동
