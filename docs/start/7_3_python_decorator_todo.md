# TODO: Python Decorator 완벽 가이드

## Phase 1: 샘플 코드 작성 (tutorials-python)

### 1-1. 프로젝트 셋업
- [x] `tutorials-python/python/decorator/` 디렉토리 생성
- [x] `uv init`으로 프로젝트 초기화
- [x] `pyproject.toml` 작성 (pytest, ruff 설정 포함)

### 1-2. 기초 코드 (basic.py)
- [x] 일급 함수 예제 (함수를 인자로 전달/반환)
- [x] 클로저 예제 (외부 변수 캡처)
- [x] 기본 데코레이터 (`@wraps` 없이)
- [x] `@wraps` 적용 데코레이터
- [x] `@wraps` 유무 차이 확인 (`__name__`, `__doc__`, `__wrapped__`)

### 1-3. 심화 코드 (advanced.py)
- [x] 데코레이터 팩토리 (`@repeat(n=3)`)
- [x] 인자 선택적 데코레이터 (`@decorator` / `@decorator()` 모두 지원)
- [x] 클래스 기반 데코레이터 (`__call__`로 상태 유지)
- [x] 클래스를 대상으로 하는 데코레이터
- [x] 데코레이터 체이닝 예제 (`@bold`, `@italic`)

### 1-4. 실전 패턴 코드 (patterns.py)
- [x] 로깅 데코레이터
- [x] `@lru_cache` 사용 예제
- [x] TTL 기반 커스텀 캐시 데코레이터
- [x] retry 데코레이터 (지수 백오프)
- [x] 실행 시간 측정 데코레이터
- [x] 입력값 타입 검증 데코레이터

### 1-5. 테스트
- [x] `tests/test_basic.py` 작성
- [x] `tests/test_advanced.py` 작성
- [x] `tests/test_patterns.py` 작성
- [x] `uv run pytest` 전체 통과 확인 (24 passed)
- [x] `uv run ruff check .` 통과 확인

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 2-1. 초안 작성
- [x] `docs/start/python-decorator-완벽-가이드/index.md` 생성
- [x] 섹션 1: 데코레이터 기초
  - [x] 1.1 데코레이터란? (일급 함수, 클로저, `@` 문법)
  - [x] 1.2 함수 데코레이터 기본 (wrapper 패턴)
  - [x] 1.3 `functools.wraps`의 역할 (전후 비교표)
- [x] 섹션 2: 데코레이터 심화
  - [x] 2.1 인자를 받는 데코레이터 (3중 중첩 구조)
  - [x] 2.2 클래스 데코레이터 (`__call__`, 클래스 대상)
  - [x] 2.3 데코레이터 체이닝 (실행 순서 시각화)
- [x] 섹션 3: 실전 활용 패턴
  - [x] 3.1 로깅 데코레이터
  - [x] 3.2 캐싱 데코레이터 (`@lru_cache`, TTL 캐시)
  - [x] 3.3 retry 데코레이터 (지수 백오프)
  - [x] 3.4 실행 시간 측정
  - [x] 3.5 입력값 검증 데코레이터
- [x] 섹션 4: 표준 라이브러리 데코레이터 정리
  - [x] 4.1 프로퍼티 관련 (`@property` 체인)
  - [x] 4.2 메서드 관련 (`@staticmethod` vs `@classmethod`)
  - [x] 4.3 클래스/함수 유틸리티 (`@dataclass`, `@singledispatch` 등)
- [x] 섹션 5: 참고 (레퍼런스 링크)

### 2-2. 다이어그램
- [x] 데코레이터 동작 원리 (Mermaid flowchart)
- [x] 3중 중첩 구조 시각화 (Mermaid flowchart)
- [x] 체이닝 실행 순서 (Mermaid flowchart)

### 2-3. 검토
- [x] 인코딩 확인 (`file -I` → charset=utf-8)
- [ ] Mermaid 다이어그램 렌더링 확인
- [x] 코드 예제와 tutorials-python 코드 일치 확인
- [x] GitHub 코드 링크 정확성 확인

---

## Phase 3: 리뷰 및 발행

- [ ] PR 생성 (feature 브랜치)
- [ ] 코드 리뷰 (샘플 코드 동작 확인)
- [ ] 글 리뷰 (맞춤법, 기술 정확성)
- [ ] `docs/start/` → `docs/merge_ready/`로 이동
- [ ] `docs/merge_ready/` → `contents/python/`로 이동 및 발행
