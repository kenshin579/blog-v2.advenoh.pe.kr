# PRD: Python Context Manager (with 문)

## 개요
__enter__/__exit__ 프로토콜과 contextlib를 활용한 리소스 관리 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-3
- **난이도**: 중급
- **우선순위**: ★★☆

## 다룰 내용
1. with 문의 동작 원리
2. `__enter__` / `__exit__` 프로토콜
3. `contextlib.contextmanager` 데코레이터
4. `contextlib.asynccontextmanager` (비동기)
5. `contextlib.suppress`, `contextlib.redirect_stdout`
6. 중첩 context manager (`ExitStack`)
7. 실전 예제
   - DB 연결/트랜잭션 관리
   - 파일 처리
   - 락 (threading.Lock)
   - 임시 디렉토리/환경변수 변경

## 샘플 코드
- `tutorials-python/python/context-manager/`

## 참고
- https://docs.python.org/3/library/contextlib.html
- https://realpython.com/python-with-statement/
