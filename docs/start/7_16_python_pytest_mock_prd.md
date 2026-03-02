# PRD: pytest 심화 - mock과 monkeypatch

## 개요
unittest.mock, pytest-mock, monkeypatch를 활용한 외부 의존성 테스트 전략을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: pytest로 테스트 마스터하기
- **번호**: 4-2
- **난이도**: 중급
- **우선순위**: ★★☆

## 다룰 내용
1. unittest.mock 기본 (Mock, MagicMock, patch)
2. pytest-mock 플러그인 (mocker fixture)
3. monkeypatch (환경변수, 속성, 메서드 교체)
4. mock vs monkeypatch 비교 및 선택 기준
5. side_effect, return_value 활용
6. 외부 API 호출 mocking
7. DB 의존성 mocking
8. assert_called_with, call_count 검증

## 샘플 코드
- `tutorials-python/python/pytest/mock/`

## 참고
- https://docs.python.org/3/library/unittest.mock.html
- https://pytest-mock.readthedocs.io/
