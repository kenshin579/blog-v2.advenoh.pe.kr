# Implementation: Python 동시성 비교 - threading vs multiprocessing vs asyncio

## 블로그 글 구조

### frontmatter
```yaml
---
title: "Python 동시성 비교: threading vs multiprocessing vs asyncio"
description: "Python 동시성 비교: threading vs multiprocessing vs asyncio"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - threading
  - multiprocessing
  - asyncio
  - concurrent.futures
  - GIL
  - 동시성
  - 병렬처리
  - 파이썬
series: "Python 동시성 & 비동기 프로그래밍"
---
```

### 목차 구성
```
# 1. 개요
## 1.1 왜 동시성이 필요한가
## 1.2 CPU-bound vs I/O-bound 작업
# 2. GIL (Global Interpreter Lock)
## 2.1 GIL이란
## 2.2 GIL의 영향
## 2.3 Python 3.13+ free-threading (no-GIL)
# 3. 동시성 모델별 사용법
## 3.1 threading
## 3.2 multiprocessing
## 3.3 asyncio 개요
# 4. concurrent.futures - 고수준 통합 API
## 4.1 ThreadPoolExecutor
## 4.2 ProcessPoolExecutor
## 4.3 공통 패턴
# 5. 성능 벤치마크와 선택 기준
## 5.1 벤치마크 비교
## 5.2 선택 기준 의사결정 트리
## 5.3 한눈에 보는 비교표
# 6. 마무리
```

## 샘플 코드 구현

### 위치
- `tutorials-python/python/concurrency/`

### 필요한 파일
| 파일 | 설명 |
|---|---|
| `test_threading_basic.py` | Thread 생성, start/join, Lock, Event, daemon thread |
| `test_multiprocessing_basic.py` | Process 생성, Pool, Queue, Pipe, shared_memory |
| `test_asyncio_overview.py` | async/await 기본, 간단한 비동기 I/O 예제 |
| `test_concurrent_futures.py` | ThreadPoolExecutor, ProcessPoolExecutor, submit, map, as_completed |
| `test_benchmark.py` | I/O-bound(URL 다운로드), CPU-bound(소수 계산) 벤치마크 비교 |
| `test_gil_demo.py` | GIL 영향 시연: CPU-bound에서 threading vs multiprocessing 성능 차이 |

### 코드 작성 규칙
- 모든 예제는 `unittest.TestCase` 기반 테스트로 작성
- `python -m pytest` 또는 `python -m unittest`로 실행 가능하도록 구성
- 각 테스트 파일은 독립 실행 가능
- 벤치마크 테스트는 실행 시간을 `time.perf_counter()`로 측정

## 블로그 글 핵심 포인트

### GIL 섹션
- GIL이 I/O-bound에서는 해제되므로 threading이 효과적인 이유를 코드로 시연
- CPU-bound에서 threading이 오히려 느려지는 것을 벤치마크로 보여줌
- Python 3.13+ free-threading은 실험적 단계임을 명시

### 동시성 모델 섹션
- threading: Lock을 사용한 race condition 방지를 실제 카운터 예제로 설명
- multiprocessing: Pool.map()으로 CPU-bound 작업 분산 처리
- asyncio: 상세 내용은 asyncio 기초 편 참조로 안내하고 개요만 다룸

### concurrent.futures 섹션
- threading/multiprocessing의 고수준 래퍼임을 강조
- submit + as_completed 패턴과 map 패턴 비교

### 벤치마크 섹션
- 동일한 I/O-bound 작업을 sequential/threading/asyncio로 비교
- 동일한 CPU-bound 작업을 sequential/threading/multiprocessing으로 비교
- 결과를 마크다운 테이블로 정리
- Mermaid flowchart로 의사결정 트리 시각화

## 참고 자료
- https://docs.python.org/3/library/concurrency.html
- https://docs.python.org/3/library/concurrent.futures.html
- https://realpython.com/python-concurrency/
- PEP 703 – Making the Global Interpreter Lock Optional in CPython
