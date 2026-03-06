# Implementation: Python 패턴 매칭 (match/case)

## 블로그 글 구조

- **파일 위치**: `docs/start/python-pattern-matching-완벽-가이드/index.md`
- **샘플 코드**: `tutorials-python/python/pattern-matching/`
- **시리즈**: Python 문법 Tips (4-2)

## 샘플 코드 구성

```
tutorials-python/python/pattern-matching/
├── 01_basic_patterns.py        # 리터럴, 캡처, 와일드카드, 상수 매칭
├── 02_structural_patterns.py   # 시퀀스, 매핑, 클래스 패턴
├── 03_pattern_combinators.py   # OR 패턴, guard 조건, 중첩 패턴
├── 04_practical_examples.py    # 커맨드 파서, 상태 머신, JSON 파싱, AST 처리
├── 05_match_vs_if.py           # if/elif vs match/case 비교
└── tests/
    ├── __init__.py
    └── test_pattern_matching.py
```

## 블로그 글 섹션별 핵심 구현

### 1. 개요

- `match subject:` / `case pattern:` 기본 구조 설명
- HTTP status code 분기 예제로 첫 인상 전달
- Python 3.10+ 필수 사항 명시, 버전 확인 방법 (`sys.version_info`)

### 2. 기본 패턴

#### 2.1 리터럴 패턴
- `case 200:`, `case "hello":`, `case True:` 등 정확한 값 매칭
- 정수, 문자열, bool, None 리터럴 예시

#### 2.2 캡처 패턴
- `case x:` — 어떤 값이든 매칭하고 변수 `x`에 바인딩
- 캡처 vs 리터럴 혼동 주의 (변수명 vs 상수값)

#### 2.3 와일드카드 패턴
- `case _:` — catch-all, 값을 변수에 바인딩하지 않음
- default/else 역할로 마지막에 배치

#### 2.4 상수 매칭
- `case Status.OK:` — 점 표기(dotted name) 필수
- `case OK:` 라고 쓰면 캡처 패턴이 되는 함정 설명

### 3. 구조 패턴

#### 3.1 시퀀스 패턴
- `case [first, second]:` — 리스트/튜플 디스트럭처링
- `case [first, *rest]:` — star 패턴으로 나머지 요소 캡처
- 중첩 시퀀스: `case [["a", x], ["b", y]]:`

#### 3.2 매핑 패턴
- `case {"type": "user", "name": name}:` — 딕셔너리 키 기반 매칭
- 추가 키 허용 (partial match), `**rest`로 나머지 캡처

#### 3.3 클래스 패턴
- `case Point(x=0, y=y):` — 속성 기반 매칭
- `__match_args__` 튜플 정의로 위치 인자 매칭 지원
- `@dataclass`와의 자연스러운 조합 (자동 `__match_args__` 생성)

### 4. 패턴 조합

#### 4.1 OR 패턴
- `case 401 | 403 | 404:` — 여러 패턴을 하나로 합치기
- OR 패턴 내 캡처 변수 일관성 규칙 (양쪽 모두 동일 변수 바인딩 필요)

#### 4.2 guard 조건
- `case x if x > 0:` — 패턴 매칭 후 추가 조건 검사
- 복잡한 비즈니스 로직과의 조합 예시

#### 4.3 중첩 패턴
- `case {"users": [{"name": name}, *_]}:` — 깊은 구조 매칭
- JSON API 응답에서 중첩 데이터 추출 실전 예시

### 5. 실전 활용

#### 5.1 커맨드 파서
- CLI 인자 `["quit"]`, `["go", direction]`, `["get", item]` 분기 처리

#### 5.2 상태 머신
- 이벤트 기반 상태 전환 (State, Event 조합 매칭)
- Mermaid state diagram으로 시각화

#### 5.3 JSON/API 응답 파싱
- REST API 응답 구조별 분기 (success/error/pagination)

#### 5.4 AST 노드 처리
- 간단한 수식 평가기 (Add, Mul, Num 노드 재귀 매칭)

### 6. if/elif vs match/case 비교

- 동일 로직을 if/elif와 match/case로 나란히 비교
- match/case가 유리한 경우: 구조 분해, 복잡한 데이터 패턴
- if/elif가 나은 경우: 단순 값 비교, 범위 조건
- 성능 차이 여부 (실측 or 공식 문서 기반)
