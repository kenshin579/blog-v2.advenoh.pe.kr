# PRD: Python asyncio 실전 패턴

## 개요
Semaphore, Queue, TaskGroup 등 asyncio 고급 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 비동기 프로그래밍
- **번호**: 3-3
- **난이도**: 고급
- **우선순위**: ★★☆

## 다룰 내용
1. Semaphore (동시 요청 제한)
2. asyncio.Queue (생산자-소비자 패턴)
3. `asyncio.gather` vs `TaskGroup` (Python 3.11+)
4. 비동기 에러 핸들링 패턴
5. Graceful Shutdown (signal 처리)
6. 비동기 컨텍스트 매니저
7. Rate Limiting (비동기 환경)
8. 실전 예제: 비동기 웹 크롤러, API 배치 호출

## 샘플 코드
- `tutorials-python/python/asyncio/patterns/`

## 참고
- https://docs.python.org/3/library/asyncio-sync.html
- https://docs.python.org/3/library/asyncio-queue.html
