# PRD: pytest 심화 - mock과 monkeypatch

## 개요
unittest.mock, pytest-mock, monkeypatch를 활용한 외부 의존성 테스트 전략을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: pytest로 테스트 마스터하기
- **번호**: 6-2
- **난이도**: 중급
- **우선순위**: ★★☆

## 다룰 내용
1. unittest.mock 기본 (Mock, MagicMock, patch)
   - `Mock()`: 범용 mock 객체, 아무 속성/메서드 접근 가능
   - `MagicMock()`: 매직 메서드(`__len__`, `__iter__` 등) 자동 지원
   - `@patch("module.Class")`: 특정 객체를 mock으로 교체
   - `patch.object()`, `patch.dict()` 변형
   - patch 대상 경로 규칙: "사용하는 곳"을 패치 (import 경로 기준)
2. pytest-mock 플러그인 (mocker fixture)
   - `mocker.patch("module.func")`: fixture 기반 깔끔한 패칭
   - `mocker.spy(obj, "method")`: 실제 실행 + 호출 기록
   - `mocker.stub(name="my_stub")`: 빈 stub 생성
   - unittest.mock 대비 장점: fixture scope 자동 정리
3. monkeypatch (환경변수, 속성, 메서드 교체)
   - `monkeypatch.setattr(obj, "attr", value)`: 속성/메서드 교체
   - `monkeypatch.setenv("KEY", "value")`: 환경변수 설정
   - `monkeypatch.delenv("KEY")`: 환경변수 삭제
   - `monkeypatch.chdir(path)`: 작업 디렉토리 변경
   - `monkeypatch.syspath_prepend(path)`: sys.path 수정
4. mock vs monkeypatch 비교 및 선택 기준
   - monkeypatch: 단순 값 교체에 적합 (환경변수, 속성)
   - mock: 호출 검증이 필요한 경우 (call_count, call_args)
   - 비교표: 기능, 사용 편의성, 검증 능력
5. side_effect, return_value 활용
   - `return_value`: 단일 반환값 설정
   - `side_effect = [val1, val2, val3]`: 순차적 반환값
   - `side_effect = func`: 커스텀 함수로 동적 반환
   - `side_effect = Exception("error")`: 예외 발생 시뮬레이션
6. 외부 API 호출 mocking
   - httpx/requests 응답 mocking 패턴
   - `responses` 라이브러리: requests용 HTTP mock
   - `respx` 라이브러리: httpx용 HTTP mock
   - 응답 상태 코드, 헤더, body 커스터마이징
7. DB 의존성 mocking
   - Repository 패턴: DB 계층 추상화 후 mock 주입
   - SQLAlchemy session mock 패턴
   - 트랜잭션 rollback 기반 테스트 격리
8. assert_called 계열 검증
   - `assert_called_once()`: 정확히 1회 호출 검증
   - `assert_called_with(*args, **kwargs)`: 인자 검증
   - `assert_called_once_with()`: 1회 호출 + 인자 동시 검증
   - `call_count`, `call_args_list`: 호출 이력 상세 확인
   - `assert_not_called()`: 미호출 검증

## 샘플 코드
- `tutorials-python/python/pytest/mock/`

## 참고
- https://docs.python.org/3/library/unittest.mock.html
- https://pytest-mock.readthedocs.io/
