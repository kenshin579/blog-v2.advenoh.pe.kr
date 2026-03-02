# PRD: Python ABC와 Protocol

## 개요
Abstract Base Class와 Protocol을 비교하고 인터페이스 설계 방법을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 핵심 문법 마스터
- **번호**: 2-9
- **난이도**: 중급
- **우선순위**: ★☆☆

## 다룰 내용
1. ABC (Abstract Base Class) 기본
2. `@abstractmethod`, `@abstractproperty`
3. Protocol (Python 3.8+, 구조적 서브타이핑)
4. ABC vs Protocol 비교 (명시적 vs 구조적 서브타이핑)
5. `runtime_checkable` Protocol
6. collections.abc의 주요 ABC (Iterable, Mapping, Sequence 등)
7. 실전 패턴: 플러그인 시스템, DI 컨테이너, 테스트 더블

## 샘플 코드
- `tutorials-python/python/abc-protocol/`

## 참고
- https://docs.python.org/3/library/abc.html
- https://docs.python.org/3/library/typing.html#typing.Protocol
