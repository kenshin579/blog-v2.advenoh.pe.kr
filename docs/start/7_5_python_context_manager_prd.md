# PRD: Python Context Manager (with 문)

## 개요
__enter__/__exit__ 프로토콜과 contextlib를 활용한 리소스 관리 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 함수형 패턴
- **번호**: 2-3
- **난이도**: 중급
- **우선순위**: ★★☆

## 다룰 내용
1. with 문의 동작 원리
   - `with expr as var:` 구문이 실행하는 단계별 흐름
   - 예외 발생 시에도 `__exit__` 호출 보장 원리
   - `as` 절이 받는 값: `__enter__`의 반환값
2. `__enter__` / `__exit__` 프로토콜
   - `__enter__(self)`: 리소스 획득, 반환값 결정
   - `__exit__(self, exc_type, exc_val, exc_tb)`: 정리 로직
   - `__exit__`에서 `True` 반환 시 예외 억제 동작
   - 클래스 기반 context manager 직접 구현
3. `contextlib.contextmanager` 데코레이터
   - `yield` 기반으로 간결하게 context manager 작성
   - `yield` 전후가 `__enter__`/`__exit__`에 대응
   - try/finally 패턴으로 예외 안전성 확보
4. `contextlib.asynccontextmanager` (비동기)
   - `async with` 문법과 함께 사용
   - `__aenter__`/`__aexit__` 프로토콜
   - 비동기 리소스(DB 커넥션 풀, HTTP 세션) 관리 예시
5. `contextlib` 유틸리티
   - `suppress(*exceptions)`: 특정 예외 무시
   - `redirect_stdout`/`redirect_stderr`: 출력 리다이렉트
   - `closing()`: `close()` 메서드 자동 호출
   - `nullcontext()`: 조건부 context manager 적용
6. 중첩 context manager (`ExitStack`)
   - 동적 개수의 context manager 관리
   - `enter_context()`, `callback()` 메서드
   - `AsyncExitStack`: 비동기 버전
   - cleanup 순서 보장 (LIFO)
7. 실전 예제
   - DB 연결/트랜잭션: commit/rollback 자동 관리
   - 파일 처리: 여러 파일 동시 열기 패턴
   - 락 관리: `threading.Lock()`을 with 문으로 활용
   - 임시 리소스: `tempfile.TemporaryDirectory()`, 환경변수 임시 변경
   - 실행 시간 측정 context manager

## 샘플 코드
- `tutorials-python/python/context-manager/`

## 참고
- https://docs.python.org/3/library/contextlib.html
- https://realpython.com/python-with-statement/
