# PRD: uv - 차세대 Python 패키지 매니저

## 개요
Rust 기반 초고속 Python 패키지 매니저 uv의 설치부터 실전 활용까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 개발 환경 구축
- **번호**: 1-1
- **난이도**: 초급
- **우선순위**: ★★★

## 다룰 내용

### 1. 개요 (uv란?)
- Astral (ruff 개발사)이 만든 Rust 기반 패키지 매니저
- 핵심 컨셉: pip + pip-tools + virtualenv + pyenv를 하나로 통합
- 단일 바이너리, 글로벌 캐시로 디스크 절약
- 월간 PyPI 다운로드 ~7,500만 (Poetry ~6,600만 추월)

#### 1.1 Python 패키지 매니저 생태계 비교
- pip, Poetry, PDM, uv 각 도구의 포지셔닝
- pip + pip-tools (전통적 방식) → Poetry (올인원) → uv (차세대) 흐름 정리
- 비교표: 속도, Python 버전 관리, lock 파일, 가상환경, PyPI 배포 지원 여부
- ~~pipenv는 2026년 기준 거의 사용되지 않으므로 간단 언급만~~

#### 1.2 성능 벤치마크
- cold install: uv ~3초 vs Poetry ~11초
- lock 생성: uv ~8초 vs Poetry ~22초
- 패키지 추가: uv 거의 즉시 vs Poetry ~3초
- 캐시 히트 시 성능 차이

### 2. 설치 및 프로젝트 셋업
- `brew install uv` / `curl -LsSf https://astral.sh/uv/install.sh | sh`
- 셸 자동완성 설정 (`uv generate-shell-completion`)
- `uv init` — 새 프로젝트 생성 (pyproject.toml + .python-version)
- `uv init --lib` — 라이브러리 프로젝트 (src 레이아웃)
- `uv init --app` — 애플리케이션 프로젝트
- 생성되는 파일 구조 설명 (pyproject.toml, .python-version, uv.lock)

#### 2.1 pyproject.toml 구조
- `[project]` 섹션: name, version, dependencies, requires-python
- `[dependency-groups]` 섹션: dev 의존성 관리
- `[tool.uv]` 섹션: uv 전용 설정 (sources, index 등)
- `[build-system]` 섹션

### 3. 환경 관리 (Python 버전 + 가상환경)

#### 3.1 Python 버전 관리
- `uv python list` — 설치 가능한 Python 버전 목록
- `uv python install 3.12` — Python 설치
- `uv python pin 3.12` — 프로젝트 Python 버전 고정
- pyenv와의 비교 및 대체 가능 여부

#### 3.2 가상환경 관리
- `uv venv` — 가상환경 생성 (.venv)
- `uv venv --python 3.12` — 특정 Python 버전으로 생성
- 자동 가상환경: `uv run` 시 자동 생성/활성화
- 기존 virtualenv/venv와의 차이점

### 4. 의존성 관리

#### 4.1 패키지 추가/제거
- `uv add <패키지>` — 의존성 추가 (자동으로 uv.lock 갱신)
- `uv add --dev <패키지>` — dev 의존성 추가
- `uv add --group test <패키지>` — 커스텀 그룹에 추가
- `uv remove <패키지>` — 의존성 제거
- `uv tree` — 의존성 트리 시각화

#### 4.2 Lock & Sync
- `uv lock` — lock 파일 생성/갱신
- `uv sync` — lock 파일 기반 설치 (CI/CD에서 `--frozen` 옵션)
- uv.lock vs requirements.txt vs poetry.lock 비교
- cross-platform universal lock (모든 플랫폼 지원)
- lock 파일 커밋 전략

### 5. 실행 및 도구 (`uv run`, `uvx`)

#### 5.1 스크립트 실행 (`uv run`)
- `uv run script.py` — 프로젝트 환경에서 실행
- `uv run pytest` — 도구 실행
- 인라인 스크립트 의존성 (PEP 723)
  ```python
  # /// script
  # dependencies = ["requests"]
  # ///
  ```

#### 5.2 도구 실행 (`uvx`)
- `uvx ruff check .` — 일회성 도구 실행 (ephemeral 환경)
- `uv tool install ruff` — 글로벌 도구 설치
- pipx와의 비교 및 대체

#### 5.3 pip 호환 명령어
- `uv pip install`, `uv pip compile`, `uv pip sync`
- 기존 pip 워크플로우에서 uv로 점진적 전환 시 활용
- `uv pip compile requirements.in -o requirements.txt` (pip-tools 대체)

### 6. 기존 프로젝트 마이그레이션
- requirements.txt → uv 프로젝트 전환 단계별 가이드
- Poetry → uv 마이그레이션 (pyproject.toml 호환)
- `uv pip install -r requirements.txt` (점진적 전환)

### 7. Workspace (모노레포 관리)
- Cargo 스타일 워크스페이스 개념 소개
- `[tool.uv.workspace]` 설정
- 멀티 패키지 프로젝트에서 공유 의존성 관리
- 실전 예제: 하나의 레포에 여러 패키지 구성

### 8. uv + ruff 조합 (Astral 생태계)
- ruff 소개: Rust 기반 초고속 linter & formatter
- `uvx ruff check .` / `uvx ruff format .`
- pyproject.toml에서 ruff 설정 (`[tool.ruff]`)
- uv + ruff로 구성하는 Python 개발 환경

## 샘플 코드
- `tutorials-python/python/uv-demo/`
- pyproject.toml 예시, 마이그레이션 스크립트

## 참고
- https://docs.astral.sh/uv/
- https://github.com/astral-sh/uv
- https://docs.astral.sh/uv/guides/integration/github/
- https://docs.astral.sh/uv/guides/integration/docker/
- https://docs.astral.sh/uv/guides/migration/pip-to-project/
