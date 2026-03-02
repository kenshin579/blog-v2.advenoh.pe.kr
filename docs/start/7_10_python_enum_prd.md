# PRD: Python Enum 활용법

## 개요
Enum, IntEnum, Flag의 사용법과 상태 관리 패턴을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 타입 시스템 & 데이터 모델링
- **번호**: 3-3
- **난이도**: 초-중급
- **우선순위**: ★☆☆

## 다룰 내용
1. Enum 기본 사용법
   - `class Color(Enum):` 정의와 멤버 접근 (`Color.RED`, `Color["RED"]`, `Color(1)`)
   - `name`, `value` 속성
   - 이터레이션: `for color in Color:`
   - Enum 멤버의 싱글턴 특성 (`is` 비교)
2. IntEnum, StrEnum (Python 3.11+)
   - `IntEnum`: 정수 비교/연산 가능 (`Status.OK == 200`)
   - `StrEnum`: 문자열 연산 가능 (`f"status: {Status.ACTIVE}"`)
   - 일반 Enum과의 차이: 타입 호환성 장단점
3. Flag, IntFlag (비트 연산)
   - `Flag`: 비트 OR 조합 (`Permission.READ | Permission.WRITE`)
   - `IntFlag`: 정수 비트 연산 호환
   - 권한 시스템 구현 예시 (UNIX 파일 퍼미션 스타일)
4. `auto()` 자동 값 할당
   - 기본 동작: 1부터 순차 증가
   - `_generate_next_value_()` 오버라이드로 커스텀 자동 값
   - StrEnum + auto() 패턴: 이름을 소문자 값으로 자동 할당
5. 커스텀 메서드 추가
   - 인스턴스 메서드, 클래스 메서드 정의
   - `@property` 활용한 파생 속성
   - `__str__`, `__format__` 커스터마이징
6. Enum 비교, 직렬화/역직렬화
   - `==`, `is` 비교 동작 차이
   - JSON 직렬화: `value` 추출 또는 커스텀 `JSONEncoder`
   - DB 저장 패턴 (value를 문자열/정수로 저장)
7. 실전 패턴
   - 상태 머신: 상태 전이 규칙을 Enum 메서드로 정의
   - API 응답 코드: HTTP 상태 코드 Enum
   - 설정값 관리: 환경별 설정을 Enum으로 구조화
   - match/case와 Enum 조합

## 샘플 코드
- `tutorials-python/python/enum/`

## 참고
- https://docs.python.org/3/library/enum.html
