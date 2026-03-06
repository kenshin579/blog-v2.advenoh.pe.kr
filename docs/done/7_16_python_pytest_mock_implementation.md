# Implementation: pytest 심화 - mock과 monkeypatch

## 블로그 글 정보
- **위치**: `docs/start/pytest-심화-mock과-monkeypatch/index.md`
- **카테고리**: `python`
- **시리즈**: pytest로 테스트 마스터하기 (6-2)
- **샘플 코드**: `tutorials-python/python/pytest/mock/`

## 구현 사항

### 1. 샘플 코드 작성 (`tutorials-python/python/pytest/mock/`)

#### 1.1 프로젝트 구조
```
tutorials-python/python/pytest/mock/
├── app/
│   ├── __init__.py
│   ├── service.py          # 외부 API 호출하는 서비스 클래스
│   ├── repository.py       # DB 접근 계층 (Repository 패턴)
│   └── config.py           # 환경변수 기반 설정
├── tests/
│   ├── __init__.py
│   ├── test_mock_basic.py          # Mock, MagicMock 기본
│   ├── test_patch.py               # @patch, patch.object, patch.dict
│   ├── test_mocker.py              # pytest-mock mocker fixture
│   ├── test_monkeypatch.py         # monkeypatch fixture
│   ├── test_side_effect.py         # return_value, side_effect
│   ├── test_assert_called.py       # assert_called 계열 검증
│   ├── test_api_mocking.py         # 외부 API 호출 mocking
│   └── test_db_mocking.py          # DB 의존성 mocking
└── conftest.py
```

#### 1.2 Mock 기본 (`test_mock_basic.py`)
- `Mock()` 객체 생성 및 속성/메서드 자동 생성 확인
- `MagicMock()` 매직 메서드 동작 (`__len__`, `__iter__`, `__getitem__`)
- `Mock(spec=ClassName)`: spec으로 인터페이스 제한

#### 1.3 patch 활용 (`test_patch.py`)
- `@patch("app.service.requests.get")`: 데코레이터 방식
- `with patch.object(Service, "fetch")`: 컨텍스트 매니저 방식
- `patch.dict(os.environ, {"KEY": "value"})`: 딕셔너리 패칭
- patch 경로 규칙 데모: import 위치 기준으로 패치 대상 결정

#### 1.4 pytest-mock (`test_mocker.py`)
- `mocker.patch("app.service.requests.get")`: fixture 기반 패칭
- `mocker.spy(service, "process")`: 실제 실행 + 호출 기록
- `mocker.stub(name="callback")`: 빈 stub 생성
- mocker는 테스트 종료 시 자동 정리됨을 보여주는 예제

#### 1.5 monkeypatch (`test_monkeypatch.py`)
- `monkeypatch.setattr()`: 클래스 메서드/함수 교체
- `monkeypatch.setenv()` / `delenv()`: 환경변수 조작
- `monkeypatch.chdir()`: 작업 디렉토리 변경
- `monkeypatch.syspath_prepend()`: sys.path 수정

#### 1.6 반환값 제어 (`test_side_effect.py`)
- `mock.return_value = 42`: 단일 반환값
- `mock.side_effect = [1, 2, 3]`: 순차적 반환값
- `mock.side_effect = lambda x: x * 2`: 커스텀 함수
- `mock.side_effect = ValueError("error")`: 예외 발생

#### 1.7 호출 검증 (`test_assert_called.py`)
- `assert_called_once()`, `assert_called_with()`, `assert_called_once_with()`
- `call_count`, `call_args`, `call_args_list` 활용
- `assert_not_called()`: 미호출 검증
- `assert_any_call()`: 특정 인자로 한 번이라도 호출 검증

#### 1.8 외부 API mocking (`test_api_mocking.py`)
- `mocker.patch`로 `requests.get` / `httpx.Client.get` 응답 mocking
- `responses` 라이브러리: `@responses.activate` 데코레이터 + 응답 등록
- `respx` 라이브러리: httpx용 mock (route 기반)
- 상태 코드별 분기 테스트 (200, 404, 500)

#### 1.9 DB 의존성 mocking (`test_db_mocking.py`)
- Repository 패턴: `UserRepository` 인터페이스 mock 주입
- `mocker.patch.object(session, "execute")`: SQLAlchemy session mock
- fixture로 mock repository 제공하여 서비스 계층 테스트

### 2. 블로그 글 작성

#### 2.1 frontmatter
```yaml
title: "pytest 심화 - mock과 monkeypatch: 외부 의존성 테스트 전략"
description: "unittest.mock, pytest-mock, monkeypatch를 활용한 mock 테스트 전략을 정리한다. Mock/MagicMock 기본부터 side_effect, 호출 검증, 외부 API/DB mocking 실전 패턴까지 다룬다"
date: 2026-03-06
update: 2026-03-06
tags:
  - python
  - pytest
  - mock
  - unittest-mock
  - pytest-mock
  - monkeypatch
  - testing
  - 테스트
series: "pytest로 테스트 마스터하기"
```

#### 2.2 본문 구성
- 각 섹션마다 개념 설명 + 코드 예제 + 실행 결과 포함
- 다이어그램은 Mermaid 형식 사용
- 샘플 코드는 `tutorials-python/` GitHub 링크로 참조
- mock vs monkeypatch 비교표 포함

#### 2.3 다이어그램 (Mermaid)
- Mock 도구 선택 가이드: `flowchart` (의사결정 트리)
- patch 동작 원리: `sequenceDiagram` (원본 → mock 교체 → 복원 흐름)
- mock vs monkeypatch 비교: 표(table)로 정리

### 3. 의존성
- 샘플 코드에서 사용하는 패키지: `pytest`, `pytest-mock`, `requests`, `httpx`, `responses`, `respx`
- Python 3.9+ 권장
