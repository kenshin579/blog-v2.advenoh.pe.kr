# PRD: Python 프로젝트 셋업 모범 사례 (2026)

## 개요
pyproject.toml 중심의 현대적 Python 프로젝트 구성법을 정리하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 개발 환경 구축
- **번호**: 1-2
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용

# 1. 들어가며

# 2. 프로젝트 구조 & 초기화
## 2.1 디렉토리 구조 컨벤션 (src layout vs flat layout)
   - src layout: `src/패키지명/` 구조, import 충돌 방지 장점
   - flat layout: `패키지명/` 구조, 간결함 장점
   - 프로젝트 규모별 선택 기준
## 2.2 pyproject.toml 구조와 각 섹션 설명
   - `[project]`: name, version, dependencies, requires-python, optional-dependencies
   - `[build-system]`: build backend 선택 (hatchling vs setuptools vs flit)
   - `[tool.*]`: ruff, pytest, mypy 등 도구별 설정 섹션
   - PEP 621 표준 메타데이터 필드 정리
## 2.3 uv 또는 poetry로 프로젝트 초기화
   - `uv init` vs `poetry init` 명령어 비교
   - 가상환경 생성 및 패키지 설치/제거 워크플로우
   - lock 파일 관리 (uv.lock vs poetry.lock)
   - dev dependencies 그룹 분리 (`[dependency-groups]`)

# 3. 코드 품질 & 개발 환경
## 3.1 ruff (린터/포매터) 설정
   - pyproject.toml 내 `[tool.ruff]` 설정 방법
   - rule 선택 가이드 (E, F, I, UP, B, SIM 등 주요 카테고리)
   - `ruff check --fix`, `ruff format` 기본 사용법
   - isort 대체 설정 (`[tool.ruff.lint.isort]`)
## 3.2 테스트 환경 구성 (pyproject.toml pytest 설정 - 사용법 상세는 pytest 입문 편 참조)
   - `[tool.pytest.ini_options]`: testpaths, addopts, markers 설정
   - 테스트 디렉토리 구조 (`tests/` 배치 패턴)
## 3.3 환경변수 관리 (.env, python-dotenv)
   - `.env` 파일 구조와 `.env.example` 패턴
   - python-dotenv 기본 사용법 (`load_dotenv()`)
   - `.gitignore`에 `.env` 등록 필수 사항

# 4. 자동화 파이프라인
## 4.1 pre-commit 훅 구성
   - `.pre-commit-config.yaml` 작성 예시
   - ruff, mypy, trailing-whitespace, end-of-file-fixer 훅 등록
   - `pre-commit install` / `pre-commit run --all-files` 사용법
## 4.2 GitHub Actions CI 파이프라인
   - 기본 CI 워크플로우 YAML 템플릿
   - uv cache 활용한 빌드 속도 최적화
   - 린트 → 타입체크 → 테스트 단계 구성

# 5. 마무리

## 샘플 코드
- `tutorials-python/python/project-template/`

## 참고
- https://packaging.python.org/en/latest/
- https://docs.astral.sh/ruff/
