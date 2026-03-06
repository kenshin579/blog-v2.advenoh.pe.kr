# 구현 문서: Python asyncio 실전 패턴

## 블로그 글 정보
- **위치**: `docs/start/7_14_python_asyncio_patterns/index.md`
- **샘플 코드**: `tutorials-python/python/asyncio/patterns/`
- **시리즈**: Python 동시성 & 비동기 프로그래밍 (5-3)

## 핵심 구현 사항

### 1. 샘플 코드 작성 (tutorials-python)

#### 1.1 동시성 제어
- `semaphore_example.py`: Semaphore 기본 사용법 + BoundedSemaphore 비교
- `rate_limiter.py`: Token Bucket 알고리즘 직접 구현 + `aiolimiter` 활용 비교

#### 1.2 Task 실행과 관리
- `gather_vs_taskgroup.py`: gather와 TaskGroup 동작 비교 (성공/실패 케이스)
- `producer_consumer.py`: asyncio.Queue 기반 다중 생산자-소비자 패턴

#### 1.3 에러 처리와 안전한 종료
- `error_handling.py`: ExceptionGroup, except*, CancelledError 처리
- `retry_pattern.py`: 지수 백오프 재시도 구현
- `graceful_shutdown.py`: signal handler + Task 정리 + asyncio.shield()

#### 1.4 리소스 관리
- `async_context_manager.py`: @asynccontextmanager, AsyncExitStack 활용

#### 1.5 실전 종합 예제
- `async_crawler.py`: Semaphore + Queue + httpx 조합 웹 크롤러
- `batch_api_call.py`: rate limit 준수하며 수백 개 API 동시 호출
- `async_file_io.py`: aiofiles로 대량 파일 읽기/쓰기

### 2. 블로그 글 작성

#### 2.1 글 구조 (콘텐츠 스타일)
```
# 1. 개요
# 2. 동시성 제어 - Semaphore와 Rate Limiting
  ## 2.1 Semaphore로 동시 실행 제한하기
  ## 2.2 Rate Limiting 구현하기
# 3. Task 실행과 관리 - gather, TaskGroup, Queue
  ## 3.1 asyncio.gather vs TaskGroup
  ## 3.2 asyncio.Queue로 생산자-소비자 패턴 구현하기
# 4. 에러 처리와 안전한 종료
  ## 4.1 비동기 에러 핸들링 패턴
  ## 4.2 Graceful Shutdown
# 5. 비동기 리소스 관리
  ## 5.1 비동기 컨텍스트 매니저
# 6. 실전 종합 예제
  ## 6.1 비동기 웹 크롤러
  ## 6.2 API 배치 호출
  ## 6.3 파일 비동기 처리
# 7. 마무리
# 8. 참고
```

#### 2.2 작성 규칙
- 각 섹션마다 샘플 코드 포함 (GitHub 저장소 링크)
- 코드 블록에 `python` 언어 태그 사용
- 설명체 (`~한다`, `~이다`) 사용
- 개념 설명 → 코드 예제 → 실행 결과 → 주의사항 순서로 작성
- 비교 항목은 표(table)로 정리 (예: gather vs TaskGroup)

### 3. 기술 요구사항
- Python 3.11+ (TaskGroup, ExceptionGroup, except* 문법)
- 주요 라이브러리: `aiolimiter`, `httpx`, `aiofiles`
- 테스트: pytest + pytest-asyncio
