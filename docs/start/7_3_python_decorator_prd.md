# PRD: Python Decorator 완벽 가이드

## 개요
함수/클래스 데코레이터의 원리부터 실전 활용 패턴까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. 데코레이터란? (일급 함수, 클로저 복습)
2. 함수 데코레이터 기본
3. `functools.wraps`의 역할
4. 인자를 받는 데코레이터 (데코레이터 팩토리)
5. 클래스 데코레이터
6. 데코레이터 체이닝 (여러 데코레이터 적용)
7. 실전 활용 패턴
   - 로깅 데코레이터
   - 캐싱 (`@lru_cache`, 커스텀)
   - 인증/인가 데코레이터
   - retry 데코레이터
   - 실행 시간 측정
8. 표준 라이브러리 데코레이터 정리 (`@property`, `@staticmethod`, `@classmethod`, `@dataclass`)

## 샘플 코드
- `tutorials-python/python/decorator/`

## 참고
- https://realpython.com/primer-on-python-decorators/
- https://docs.python.org/3/glossary.html#term-decorator
