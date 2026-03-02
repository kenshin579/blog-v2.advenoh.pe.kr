# PRD: pytest 입문 - unittest에서 pytest로

## 개요
pytest 기본 사용법과 fixture, parametrize 등 핵심 기능을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: pytest로 테스트 마스터하기
- **번호**: 6-1
- **난이도**: 초-중급
- **우선순위**: ★★★

## 다룰 내용
1. unittest vs pytest 비교
   - 코드 비교: 동일 테스트를 unittest/pytest로 작성
   - pytest 장점: assert 문 하나로 검증, 클래스 불필요, 자동 디스커버리
   - unittest 호환: pytest로 기존 unittest 테스트 실행 가능
2. pytest 설치 및 기본 사용법
   - `uv add --dev pytest` / `pip install pytest`
   - `pytest` 명령어: 전체 실행, 특정 파일, 특정 테스트 지정
   - `-v` (상세 출력), `-s` (print 출력), `-x` (첫 실패시 중단)
   - `-k "keyword"`: 키워드로 테스트 필터링
3. assertion (assert문, 상세 에러 메시지)
   - 일반 `assert` 문 사용: `assert result == expected`
   - pytest의 assertion rewriting: 실패 시 상세 diff 자동 표시
   - `pytest.raises(ExceptionType)`: 예외 발생 검증
   - `pytest.approx(value)`: 부동소수점 비교
4. fixture (`@pytest.fixture`, scope, autouse)
   - fixture 정의: `@pytest.fixture` 데코레이터
   - scope 종류: `function`(기본), `class`, `module`, `session`
   - `yield` fixture: setup + teardown 패턴
   - `autouse=True`: 자동 적용 fixture
   - fixture 간 의존성 주입 (fixture가 fixture를 인자로 받기)
5. conftest.py
   - 역할: fixture 공유, hook 함수, 플러그인 로딩
   - 디렉토리 계층별 conftest.py 적용 범위
   - 프로젝트 전역 fixture vs 모듈별 fixture 배치 전략
6. parametrize (매개변수화 테스트)
   - `@pytest.mark.parametrize("input,expected", [...])` 기본 사용법
   - 다중 파라미터 조합
   - `pytest.param(..., id="case-name")`: 케이스별 이름 지정
   - `indirect=True`: fixture에 파라미터 전달
7. 마킹 (`@pytest.mark`)
   - `@pytest.mark.skip(reason="...")`: 테스트 건너뛰기
   - `@pytest.mark.skipif(condition)`: 조건부 건너뛰기
   - `@pytest.mark.xfail`: 실패 예상 테스트 (known bug)
   - 커스텀 마커 정의 및 `-m "marker"` 필터링
8. 테스트 디스커버리 규칙
   - 파일명: `test_*.py` 또는 `*_test.py`
   - 함수명: `test_`로 시작
   - 클래스명: `Test`로 시작 (`__init__` 없어야 함)
   - `--collect-only`: 수집된 테스트 목록 확인
9. pyproject.toml에서 pytest 설정
   - `[tool.pytest.ini_options]` 주요 옵션
   - `testpaths`, `addopts`, `markers` 설정 예시
   - `filterwarnings`: 경고 필터 설정

## 샘플 코드
- `tutorials-python/python/pytest/intro/`

## 참고
- https://docs.pytest.org/
- https://realpython.com/pytest-python-testing/
