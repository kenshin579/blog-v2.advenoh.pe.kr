# PRD: Python 동시성 비교 - threading vs multiprocessing vs asyncio

## 개요
GIL 이해와 함께 세 가지 동시성 모델을 비교하고 선택 기준을 제시하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 동시성 & 비동기 프로그래밍
- **번호**: 5-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. GIL (Global Interpreter Lock) 이해
   - GIL이란: CPython에서 한 번에 하나의 스레드만 바이트코드 실행
   - GIL이 존재하는 이유: 메모리 관리(참조 카운팅) 안전성
   - GIL의 영향: I/O-bound는 괜찮지만 CPU-bound는 병렬 처리 불가
2. CPU-bound vs I/O-bound 작업
   - CPU-bound 예시: 수학 연산, 이미지 처리, 데이터 변환
   - I/O-bound 예시: 파일 읽기/쓰기, 네트워크 요청, DB 쿼리
   - 작업 유형 판별 방법과 프로파일링 팁
3. threading 모듈
   - `Thread(target=func)` 생성과 `start()`/`join()`
   - `Lock`: race condition 방지, `with lock:` 패턴
   - `Event`, `Condition`: 스레드 간 동기화/통신
   - daemon thread vs non-daemon thread
   - 주의: GIL로 인해 CPU-bound 작업에서는 효과 없음
4. multiprocessing 모듈
   - `Process(target=func)`: 별도 프로세스 생성 (GIL 우회)
   - `Pool(n)`: 프로세스 풀로 `map()`, `apply_async()` 활용
   - `Queue`, `Pipe`: 프로세스 간 통신 (IPC)
   - `shared_memory` (Python 3.8+): 고성능 데이터 공유
   - 주의: pickle 직렬화 비용, 메모리 사용량 증가
5. asyncio 개요 (event loop, coroutine - 상세는 asyncio 기초 편 참조)
   - 단일 스레드 + 협력적 멀티태스킹 원리
   - I/O-bound 작업에서의 장점
   - `async/await` 기본 개념 요약
6. concurrent.futures (ThreadPoolExecutor, ProcessPoolExecutor)
   - `ThreadPoolExecutor`: 스레드 풀 기반 고수준 API
   - `ProcessPoolExecutor`: 프로세스 풀 기반 고수준 API
   - `executor.submit(func)` → `Future` 객체
   - `executor.map(func, iterable)`: 병렬 map 패턴
   - `as_completed(futures)`: 완료 순서대로 결과 처리
7. 성능 벤치마크 비교
   - 동일 작업으로 세 방식 비교 (I/O-bound: URL 다운로드)
   - 동일 작업으로 세 방식 비교 (CPU-bound: 소수 계산)
   - 실행 시간, 메모리 사용량, CPU 사용률 측정
   - 벤치마크 결과 시각화 (표 또는 차트)
8. 선택 기준 의사결정 트리
   - I/O-bound + 대량 동시성 → asyncio
   - I/O-bound + 기존 동기 코드 → threading
   - CPU-bound → multiprocessing
   - 혼합 패턴: `asyncio` + `run_in_executor()` 조합
9. Python 3.12+/3.13+ GIL 개선
   - PEP 703: free-threading (no-GIL) 실험적 빌드
   - `python3.13t` 빌드와 `PYTHON_GIL=0` 환경변수
   - 현재 상태와 향후 로드맵
   - 기존 코드에 미치는 영향

## 샘플 코드
- `tutorials-python/python/concurrency/`

## 참고
- https://docs.python.org/3/library/concurrency.html
- https://realpython.com/python-concurrency/
