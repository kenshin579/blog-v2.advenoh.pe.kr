# PRD: Python Decorator 완벽 가이드

## 개요
함수/클래스 데코레이터의 원리부터 실전 활용 패턴까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 함수형 패턴
- **번호**: 2-1
- **난이도**: 중급
- **우선순위**: ★★★

## 목차

# 1. 데코레이터 기초
## 1.1 데코레이터란?
- 함수를 인자로 전달하고 반환하는 일급 함수 개념
- 클로저로 외부 변수를 캡처하는 원리
- `@` 문법이 실제로 하는 일: `func = decorator(func)`

## 1.2 함수 데코레이터 기본
- wrapper 함수 패턴: `*args`, `**kwargs` 전달
- 데코레이터 전/후 로직 삽입 구조
- 반환값 처리 주의사항

## 1.3 `functools.wraps`의 역할
- 없을 때 문제: `__name__`, `__doc__`, `__module__` 손실
- `@wraps(func)` 적용 전후 비교
- `__wrapped__` 속성으로 원본 함수 접근

# 2. 데코레이터 심화
## 2.1 인자를 받는 데코레이터 (데코레이터 팩토리)
- 3중 중첩 함수 구조 이해
- 예시: `@repeat(n=3)`, `@timeout(seconds=5)`
- 인자 선택적 데코레이터 (`@decorator` / `@decorator()` 모두 지원)

## 2.2 클래스 데코레이터
- `__call__` 메서드를 활용한 상태 유지 데코레이터
- 클래스를 대상으로 하는 데코레이터 (클래스 속성/메서드 수정)
- `__init_subclass__`와의 차이점

## 2.3 데코레이터 체이닝
- 실행 순서: 아래에서 위로 적용, 위에서 아래로 실행
- 실행 순서 시각화 예시

# 3. 실전 활용 패턴
## 3.1 로깅 데코레이터
- 함수 호출/반환 자동 기록

## 3.2 캐싱 데코레이터
- `@lru_cache(maxsize=128)`, TTL 기반 커스텀 캐시

## 3.3 retry 데코레이터
- 지수 백오프, 재시도 횟수 제한

## 3.4 실행 시간 측정
- `time.perf_counter()` 활용

## 3.5 입력값 검증 데코레이터

# 4. 표준 라이브러리 데코레이터 정리
## 4.1 프로퍼티 관련
- `@property`, `@setter`, `@deleter` 체인

## 4.2 메서드 관련
- `@staticmethod` vs `@classmethod` 차이

## 4.3 클래스/함수 유틸리티
- `@dataclass`, `@total_ordering`, `@singledispatch`

## 샘플 코드
- `tutorials-python/python/decorator/`

## 참고
- https://realpython.com/primer-on-python-decorators/
- https://docs.python.org/3/glossary.html#term-decorator
