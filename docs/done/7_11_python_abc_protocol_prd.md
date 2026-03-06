# PRD: Python ABC와 Protocol

## 개요
Abstract Base Class와 Protocol을 비교하고 인터페이스 설계 방법을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 타입 시스템 & 데이터 모델링
- **번호**: 3-4
- **난이도**: 중급
- **우선순위**: ★☆☆

## 다룰 내용
1. ABC (Abstract Base Class) 기본
   - `from abc import ABC, abstractmethod`
   - 추상 클래스 정의: `class Base(ABC):`
   - 인스턴스 생성 불가: `TypeError` 발생 조건
   - 일반 메서드와 추상 메서드 혼합
   1.1 `@abstractmethod` 활용
   - `@abstractmethod`: 하위 클래스에서 구현 강제
   - `@abstractmethod` + `@property` 조합 (추상 프로퍼티)
   - `@abstractmethod` + `@classmethod`/`@staticmethod` 조합
   - 추상 메서드에 기본 구현 제공 (`super()` 호출 패턴)
   1.2 `collections.abc`의 주요 ABC
   - 이터레이터: `Iterable`, `Iterator`, `Generator`
   - 컬렉션: `Sequence`, `MutableSequence`, `Mapping`, `MutableMapping`
   - `Callable`, `Hashable`, `Sized`
   - `__subclasshook__`으로 가상 하위 클래스 등록
   - `register()` 메서드로 기존 클래스에 ABC 등록
2. Protocol (Python 3.8+, 구조적 서브타이핑)
   - `from typing import Protocol`
   - Protocol 정의: 메서드 시그니처만 선언
   - 구조적 서브타이핑: 명시적 상속 없이 인터페이스 충족
   - duck typing을 타입 시스템으로 공식화한 개념
   2.1 `runtime_checkable` Protocol
   - `@runtime_checkable` 데코레이터 적용
   - `isinstance()` 검사 가능 (메서드 존재 여부만 확인)
   - 제한사항: 시그니처/반환 타입은 검사 불가
3. ABC vs Protocol 비교
   - 명시적 서브타이핑(ABC): `class Dog(Animal):` 상속 필수
   - 구조적 서브타이핑(Protocol): 메서드만 맞으면 호환
   - 장단점 비교표: 유연성, 타입 안전성, 코드 결합도
   - 선택 기준: 라이브러리 인터페이스 vs 내부 계약
4. 실전 패턴
   - 플러그인 시스템: Protocol로 플러그인 인터페이스 정의
   - DI 컨테이너: ABC/Protocol 기반 의존성 주입
   - 테스트 더블: Protocol 기반 fake/stub 구현
   - Repository 패턴: ABC로 데이터 접근 계층 추상화

## 샘플 코드
- `tutorials-python/python/abc-protocol/`

## 참고
- https://docs.python.org/3/library/abc.html
- https://docs.python.org/3/library/typing.html#typing.Protocol
