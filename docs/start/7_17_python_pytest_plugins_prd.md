# PRD: pytest 플러그인과 실전 팁

## 개요
pytest-cov, pytest-xdist, pytest-asyncio 등 플러그인 활용과 CI 연동을 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: pytest로 테스트 마스터하기
- **번호**: 6-3
- **난이도**: 중급
- **우선순위**: ★☆☆

## 다룰 내용
1. pytest-cov (코드 커버리지)
   - `pytest --cov=src --cov-report=html`: 기본 사용법
   - 커버리지 리포트 종류: terminal, html, xml, json
   - `--cov-fail-under=80`: 최소 커버리지 기준 강제
   - `.coveragerc` / `pyproject.toml` 설정 (제외 패턴, branch coverage)
2. pytest-xdist (병렬 테스트 실행)
   - `pytest -n auto`: CPU 코어 수만큼 워커 생성
   - `pytest -n 4`: 워커 수 직접 지정
   - `--dist=loadscope`: 모듈/클래스 단위로 워커 분배
   - 주의: fixture scope와 병렬 실행의 상호작용
3. pytest-asyncio (비동기 테스트)
   - `@pytest.mark.asyncio`: 비동기 테스트 함수 마킹
   - `asyncio_mode = "auto"` 설정으로 마킹 생략 가능
   - 비동기 fixture 작성: `@pytest_asyncio.fixture`
   - event loop scope 설정
4. pytest-benchmark (성능 벤치마크)
   - `benchmark` fixture로 함수 실행 시간 측정
   - `benchmark.pedantic(func, rounds=100)`: 정밀 측정
   - `--benchmark-compare`: 이전 결과와 비교
   - `--benchmark-save=name`: 결과 저장
5. 커스텀 fixture 패턴
   - factory fixture: 파라미터화된 객체 생성기
   - request fixture: 테스트 메타데이터 접근
   - tmp_path / tmp_path_factory: 임시 파일/디렉토리
   - 데이터베이스 테스트용 세션 fixture (트랜잭션 rollback 패턴)
6. 커스텀 플러그인 작성
   - conftest.py에서 hook 함수 구현
   - `pytest_configure(config)`: 설정 커스터마이징
   - `pytest_collection_modifyitems(items)`: 테스트 수집 후 수정
   - `pytest_runtest_makereport(item, call)`: 테스트 결과 후처리
7. GitHub Actions CI 연동
   - CI 워크플로우 YAML: pytest + coverage 실행
   - coverage xml 리포트 → Codecov/Coveralls 업로드
   - PR 코멘트에 커버리지 변화량 자동 표시
   - 테스트 실패 시 에러 요약 표시
8. 실전 팁
   - `pytest --lf`: 마지막 실패 테스트만 재실행
   - `pytest --sw`: stepwise 모드 (실패 지점부터 재시작)
   - `pytest -p no:warnings`: 경고 숨기기
   - `--tb=short/long/line`: traceback 형식 조절
   - `pdb` 연동: `pytest --pdb` (실패 시 디버거 진입)

## 샘플 코드
- `tutorials-python/python/pytest/plugins/`

## 참고
- https://docs.pytest.org/en/latest/reference/plugin_list.html
- https://pytest-cov.readthedocs.io/
