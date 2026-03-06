# TODO: Python 동시성 비교 - threading vs multiprocessing vs asyncio

## 1단계: 샘플 코드 작성 (tutorials-python)

- [x] `tutorials-python/python/concurrency/` 디렉토리 생성
- [x] `test_gil_demo.py` - GIL 영향 시연 (CPU-bound에서 threading vs multiprocessing 성능 차이)
- [x] `test_threading_basic.py` - Thread 생성/join, Lock, Event, daemon thread
- [x] `test_multiprocessing_basic.py` - Process 생성, Pool, Queue, Pipe, shared_memory
- [x] `test_asyncio_overview.py` - async/await 기본, 간단한 비동기 I/O 예제
- [x] `test_concurrent_futures.py` - ThreadPoolExecutor, ProcessPoolExecutor, submit, map, as_completed
- [x] `test_benchmark.py` - I/O-bound, CPU-bound 벤치마크 비교
- [x] 전체 테스트 실행 및 통과 확인

## 2단계: 블로그 글 작성 (blog-v2)

- [ ] `docs/start/python-동시성-비교-threading-vs-multiprocessing-vs-asyncio/index.md` 생성
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] `# 1. 개요` 작성
  - [ ] `## 1.1 왜 동시성이 필요한가` - 순차 실행 한계, 세 가지 모델 소개
  - [ ] `## 1.2 CPU-bound vs I/O-bound 작업` - 예시, 구분 기준
- [ ] `# 2. GIL (Global Interpreter Lock)` 작성
  - [ ] `## 2.1 GIL이란` - 개념, 존재 이유
  - [ ] `## 2.2 GIL의 영향` - I/O-bound vs CPU-bound 차이
  - [ ] `## 2.3 Python 3.13+ free-threading` - PEP 703, python3.13t
- [ ] `# 3. 동시성 모델별 사용법` 작성
  - [ ] `## 3.1 threading` - Thread, Lock, Event, daemon thread
  - [ ] `## 3.2 multiprocessing` - Process, Pool, Queue, Pipe, shared_memory
  - [ ] `## 3.3 asyncio 개요` - async/await 기본, asyncio 기초 편 링크
- [ ] `# 4. concurrent.futures` 작성
  - [ ] `## 4.1 ThreadPoolExecutor` - submit, Future
  - [ ] `## 4.2 ProcessPoolExecutor` - map
  - [ ] `## 4.3 공통 패턴` - as_completed, with 문
- [ ] `# 5. 성능 벤치마크와 선택 기준` 작성
  - [ ] `## 5.1 벤치마크 비교` - I/O-bound, CPU-bound 결과 비교표
  - [ ] `## 5.2 선택 기준 의사결정 트리` - Mermaid flowchart
  - [ ] `## 5.3 한눈에 보는 비교표` - 4가지 모델 특성 비교 테이블
- [ ] `# 6. 마무리` 작성
- [ ] UTF-8 인코딩 확인 (`file -I`)

## 3단계: 리뷰 및 정리

- [ ] 블로그 글에서 tutorials-python 코드 참조/링크 확인
- [ ] 코드 블록 내 코드가 테스트 파일과 일치하는지 확인
- [ ] PR 생성
