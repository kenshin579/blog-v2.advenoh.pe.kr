# TODO: pytest 심화 - mock과 monkeypatch

## 1단계: 샘플 코드 작성 (`tutorials-python/python/pytest/mock/`)

- [x] 디렉토리 구조 생성 (`app/`, `tests/`)
- [x] `app/service.py` - 외부 API 호출 서비스 클래스
- [x] `app/repository.py` - DB 접근 계층 (Repository 패턴)
- [x] `app/config.py` - 환경변수 기반 설정
- [x] `tests/test_mock_basic.py` - Mock, MagicMock, spec 기본 예제
- [x] `tests/test_patch.py` - @patch, patch.object, patch.dict 예제
- [x] `tests/test_mocker.py` - pytest-mock mocker fixture 예제
- [x] `tests/test_monkeypatch.py` - monkeypatch setattr/setenv/chdir 예제
- [x] `tests/test_side_effect.py` - return_value, side_effect 예제
- [x] `tests/test_assert_called.py` - assert_called 계열 검증 예제
- [x] `tests/test_api_mocking.py` - responses/respx 라이브러리 활용
- [x] `tests/test_db_mocking.py` - Repository mock 주입, session mock
- [x] `conftest.py` - 공통 fixture 정의
- [x] 전체 테스트 실행 확인 (`pytest -v`) - 57 passed

## 2단계: 블로그 글 작성 (`docs/start/pytest-심화-mock과-monkeypatch/index.md`)

- [x] frontmatter 작성
- [x] 1. Mock이란? - mock 필요성, 용어 정리 (mock/stub/spy)
- [x] 2.1 unittest.mock - Mock, MagicMock, @patch 설명 + 코드 예제
- [x] 2.2 pytest-mock - mocker fixture 설명 + 코드 예제
- [x] 2.3 monkeypatch - setattr, setenv 설명 + 코드 예제
- [x] 2.4 mock vs monkeypatch - 비교표 + 선택 가이드 flowchart (Mermaid)
- [x] 3.1 return_value와 side_effect - 반환값 제어 설명 + 코드 예제
- [x] 3.2 assert_called 계열 검증 - 호출 검증 설명 + 코드 예제
- [x] 4.1 외부 API 호출 mocking - responses/respx 설명 + 코드 예제
- [x] 4.2 DB 의존성 mocking - Repository 패턴 mock + 코드 예제
- [x] 5. 마무리
- [x] 참고 링크 정리
- [x] tutorials-python GitHub 코드 링크 추가

## 3단계: 검증

- [x] 전체 샘플 코드 테스트 실행 (`pytest -v`) - 57 passed
- [x] 블로그 글 인코딩 확인 (`file -I`) - charset=utf-8
- [x] Mermaid 다이어그램 렌더링 확인 - flowchart 포함
- [x] 코드 블록 언어 태그 확인 (python)
