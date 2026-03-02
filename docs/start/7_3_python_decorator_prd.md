# PRD: Python Decorator 완벽 가이드

## 개요
함수/클래스 데코레이터의 원리부터 실전 활용 패턴까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 함수형 패턴
- **번호**: 2-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. 데코레이터란? (일급 함수, 클로저 복습)
   - 함수를 인자로 전달하고 반환하는 일급 함수 개념
   - 클로저로 외부 변수를 캡처하는 원리
   - `@` 문법이 실제로 하는 일: `func = decorator(func)`
2. 함수 데코레이터 기본
   - wrapper 함수 패턴: `*args`, `**kwargs` 전달
   - 데코레이터 전/후 로직 삽입 구조
   - 반환값 처리 주의사항
3. `functools.wraps`의 역할
   - 없을 때 문제: `__name__`, `__doc__`, `__module__` 손실
   - `@wraps(func)` 적용 전후 비교
   - `__wrapped__` 속성으로 원본 함수 접근
4. 인자를 받는 데코레이터 (데코레이터 팩토리)
   - 3중 중첩 함수 구조 이해
   - 예시: `@repeat(n=3)`, `@timeout(seconds=5)`
   - 인자 선택적 데코레이터 (`@decorator` / `@decorator()` 모두 지원)
5. 클래스 데코레이터
   - `__call__` 메서드를 활용한 상태 유지 데코레이터
   - 클래스를 대상으로 하는 데코레이터 (클래스 속성/메서드 수정)
   - `__init_subclass__`와의 차이점
6. 데코레이터 체이닝 (여러 데코레이터 적용)
   - 실행 순서: 아래에서 위로 적용, 위에서 아래로 실행
   - 실행 순서 시각화 예시
7. 실전 활용 패턴
   - 로깅 데코레이터: 함수 호출/반환 자동 기록
   - 캐싱: `@lru_cache(maxsize=128)`, TTL 기반 커스텀 캐시
   - retry 데코레이터: 지수 백오프, 재시도 횟수 제한
   - 실행 시간 측정: `time.perf_counter()` 활용
   - 입력값 검증 데코레이터
8. 표준 라이브러리 데코레이터 정리
   - `@property`, `@setter`, `@deleter` 체인
   - `@staticmethod` vs `@classmethod` 차이
   - `@dataclass`, `@total_ordering`, `@singledispatch`

## 샘플 코드
- `tutorials-python/python/decorator/`

## 참고
- https://realpython.com/primer-on-python-decorators/
- https://docs.python.org/3/glossary.html#term-decorator
