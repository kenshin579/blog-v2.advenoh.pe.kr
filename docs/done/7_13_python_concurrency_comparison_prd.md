# PRD: Python 동시성 비교 - threading vs multiprocessing vs asyncio

## 개요
GIL 이해와 함께 세 가지 동시성 모델을 비교하고 선택 기준을 제시하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 동시성 & 비동기 프로그래밍
- **번호**: 5-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용

# 1. 개요
## 1.1 왜 동시성이 필요한가
   - 순차 실행의 한계: I/O 대기 시간 낭비, CPU 활용률 저하
   - Python이 제공하는 세 가지 동시성 모델 소개 (threading, multiprocessing, asyncio)
## 1.2 CPU-bound vs I/O-bound 작업
   - CPU-bound 예시: 수학 연산, 이미지 처리, 데이터 변환
   - I/O-bound 예시: 파일 읽기/쓰기, 네트워크 요청, DB 쿼리
   - 작업 유형에 따라 최적의 동시성 모델이 달라지는 이유

# 2. GIL (Global Interpreter Lock)
## 2.1 GIL이란
   - CPython에서 한 번에 하나의 스레드만 바이트코드 실행
   - GIL이 존재하는 이유: 메모리 관리(참조 카운팅) 안전성
## 2.2 GIL의 영향
   - I/O-bound: GIL이 해제되므로 threading 효과 있음
   - CPU-bound: GIL로 인해 멀티스레드여도 병렬 실행 불가
## 2.3 Python 3.13+ free-threading (no-GIL)
   - PEP 703: free-threading 실험적 빌드
   - `python3.13t` 빌드와 `PYTHON_GIL=0` 환경변수
   - 현재 상태와 향후 로드맵, 기존 코드에 미치는 영향

# 3. 동시성 모델별 사용법
## 3.1 threading
   - `Thread(target=func)` 생성과 `start()`/`join()`
   - `Lock`: race condition 방지, `with lock:` 패턴
   - `Event`, `Condition`: 스레드 간 동기화/통신
   - daemon thread vs non-daemon thread
   - 주의: GIL로 인해 CPU-bound 작업에서는 효과 없음
## 3.2 multiprocessing
   - `Process(target=func)`: 별도 프로세스 생성 (GIL 우회)
   - `Pool(n)`: 프로세스 풀로 `map()`, `apply_async()` 활용
   - `Queue`, `Pipe`: 프로세스 간 통신 (IPC)
   - `shared_memory` (Python 3.8+): 고성능 데이터 공유
   - 주의: pickle 직렬화 비용, 메모리 사용량 증가
## 3.3 asyncio 개요
   - 단일 스레드 + 협력적 멀티태스킹 원리
   - I/O-bound 작업에서의 장점
   - `async/await` 기본 개념 요약
   - 상세는 [asyncio 기초 편](7_12) 참조

# 4. concurrent.futures - 고수준 통합 API
## 4.1 ThreadPoolExecutor
   - 스레드 풀 기반 고수준 API
   - `executor.submit(func)` → `Future` 객체
## 4.2 ProcessPoolExecutor
   - 프로세스 풀 기반 고수준 API
   - `executor.map(func, iterable)`: 병렬 map 패턴
## 4.3 공통 패턴
   - `as_completed(futures)`: 완료 순서대로 결과 처리
   - `with` 문으로 executor 자동 정리

# 5. 성능 벤치마크와 선택 기준
## 5.1 벤치마크 비교
   - I/O-bound 벤치마크: URL 다운로드 (sequential vs threading vs asyncio)
   - CPU-bound 벤치마크: 소수 계산 (sequential vs multiprocessing)
   - 실행 시간, 메모리 사용량, CPU 사용률 측정
   - 벤치마크 결과 비교표
## 5.2 선택 기준 의사결정 트리
   - I/O-bound + 대량 동시성 → asyncio
   - I/O-bound + 기존 동기 코드 → threading
   - CPU-bound → multiprocessing
   - 혼합 패턴: `asyncio` + `run_in_executor()` 조합
## 5.3 한눈에 보는 비교표
   - threading / multiprocessing / asyncio / concurrent.futures 특성 비교

# 6. 마무리

## 샘플 코드
- `tutorials-python/python/concurrency/`

## 참고
- https://docs.python.org/3/library/concurrency.html
- https://realpython.com/python-concurrency/
- PEP 703 – Making the Global Interpreter Lock Optional in CPython
