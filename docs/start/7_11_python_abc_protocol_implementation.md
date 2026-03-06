# Implementation: Python ABC와 Protocol

## 블로그 글 구조

### frontmatter
```yaml
---
title: "Python ABC와 Protocol: 인터페이스 설계의 두 가지 방법"
description: "Python ABC와 Protocol: 인터페이스 설계의 두 가지 방법"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - abc
  - protocol
  - abstract base class
  - 추상 클래스
  - 구조적 서브타이핑
  - typing
  - 파이썬
  - 인터페이스
series: "Python 타입 시스템 & 데이터 모델링"
---
```

### 목차 구성
```
# 1. 개요
# 2. ABC (Abstract Base Class)
## 2.1 ABC 기본 사용법
## 2.2 @abstractmethod 활용
## 2.3 collections.abc의 주요 ABC
# 3. Protocol (구조적 서브타이핑)
## 3.1 Protocol 기본 사용법
## 3.2 runtime_checkable Protocol
# 4. ABC vs Protocol 비교
# 5. 실전 패턴
## 5.1 플러그인 시스템
## 5.2 Repository 패턴
# 6. 마무리
```

## 샘플 코드 구현

### 위치
- `tutorials-python/python/abc-protocol/`

### 필요한 파일
| 파일 | 설명 |
|---|---|
| `test_abc_basic.py` | ABC 기본: 추상 클래스 정의, 인스턴스 생성 불가, 일반+추상 메서드 혼합 |
| `test_abstractmethod.py` | @abstractmethod + @property, @classmethod, @staticmethod 조합, super() 호출 패턴 |
| `test_collections_abc.py` | collections.abc 주요 ABC 사용, __subclasshook__, register() |
| `test_protocol_basic.py` | Protocol 정의, 구조적 서브타이핑 동작 확인 |
| `test_runtime_checkable.py` | @runtime_checkable, isinstance() 검사, 제한사항 확인 |
| `test_abc_vs_protocol.py` | ABC vs Protocol 동일 인터페이스를 두 방식으로 구현하여 비교 |
| `test_patterns.py` | 실전 패턴: 플러그인 시스템, Repository 패턴 |

### 코드 작성 규칙
- 모든 예제는 `unittest.TestCase` 기반 테스트로 작성
- `python -m pytest` 또는 `python -m unittest`로 실행 가능하도록 구성
- 각 테스트 파일은 독립 실행 가능

## 블로그 글 핵심 포인트

### ABC 섹션
- ABC 상속 시 추상 메서드 미구현하면 `TypeError` 발생하는 것을 코드로 보여줌
- `@abstractmethod`와 다른 데코레이터 조합 시 순서 중요 (abstractmethod가 가장 안쪽)
- `collections.abc`는 이미 정의된 유용한 ABC 모음 → 커스텀 컬렉션 만들 때 활용

### Protocol 섹션
- Protocol은 상속 없이 메서드 시그니처만 맞으면 호환 (duck typing의 공식화)
- `runtime_checkable`은 메서드 존재 여부만 확인, 시그니처는 검사 안 함

### 비교 섹션
- 비교표 (Mermaid 또는 마크다운 테이블)로 한눈에 정리
- 선택 기준: 강한 계약이 필요하면 ABC, 유연성이 필요하면 Protocol

## 참고 자료
- https://docs.python.org/3/library/abc.html
- https://docs.python.org/3/library/typing.html#typing.Protocol
- PEP 544 – Protocols: Structural subtyping
