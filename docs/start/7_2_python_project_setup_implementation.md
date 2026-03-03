# Implementation: Python 프로젝트 셋업 모범 사례 (2026)

## 1. 샘플 코드 구현 (tutorials-python)

### 1.1 디렉토리 구조

```
tutorials-python/python/project-template/
├── pyproject.toml                  # 전체 프로젝트 설정 (PEP 621)
├── uv.lock                         # uv lock 파일
├── .python-version                 # Python 버전 고정
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── main.py                 # 엔트리포인트 (간단한 CLI 예제)
│       └── config.py               # 환경변수 로딩 (python-dotenv)
├── tests/
│   ├── __init__.py
│   └── test_main.py               # pytest 테스트 예제
├── .env.example                    # 환경변수 템플릿
├── .gitignore                      # .env, __pycache__, .venv 등
├── .pre-commit-config.yaml         # pre-commit 훅 설정
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI
└── README.md                       # 실행 방법 설명
```

### 1.2 pyproject.toml - 핵심 구현

**목적**: PEP 621 표준 메타데이터 + 도구 설정을 하나의 파일로 통합

```toml
[project]
name = "myapp"
version = "0.1.0"
description = "Python 프로젝트 템플릿 예제"
requires-python = ">=3.12"
dependencies = [
    "python-dotenv>=1.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "ruff>=0.9",
    "mypy>=1.14",
    "pre-commit>=4.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.ruff.lint.isort]
known-first-party = ["myapp"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"

[tool.mypy]
python_version = "3.12"
strict = true
```

### 1.3 src/myapp/config.py - 환경변수 관리

```python
import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "myapp")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
```

### 1.4 src/myapp/main.py - 엔트리포인트

```python
from myapp.config import APP_NAME, DEBUG

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to {APP_NAME}."

def main() -> None:
    print(greet("World"))
    if DEBUG:
        print("Debug mode is ON")

if __name__ == "__main__":
    main()
```

### 1.5 tests/test_main.py - pytest 예제

```python
from myapp.main import greet

def test_greet():
    result = greet("Python")
    assert "Hello, Python!" in result
```

### 1.6 .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.7
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

### 1.7 .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true
      - run: uv sync --frozen
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy src/
      - run: uv run pytest
```

---

## 2. 블로그 글 구현

### 2.1 파일 위치

```
blog-v2.advenoh.pe.kr/docs/start/
  python-프로젝트-셋업-모범-사례/
    index.md
```

### 2.2 Frontmatter

```yaml
---
title: "Python 프로젝트 셋업 모범 사례 (2026)"
description: "pyproject.toml 중심의 현대적 Python 프로젝트 구성법을 정리합니다. 디렉토리 구조, uv, ruff, pre-commit, GitHub Actions CI까지 한번에 알아봅니다"
date: 2026-03-XX
update: 2026-03-XX
tags:
  - python
  - pyproject-toml
  - uv
  - ruff
  - pre-commit
  - github-actions
  - project-setup
series: "Python 개발 환경 구축"
---
```

### 2.3 글 구조

| # | 섹션 | 핵심 내용 |
|---|------|----------|
| 1 | 들어가며 | setup.py/requirements.txt 시대 → pyproject.toml 통합 흐름 |
| 2 | 프로젝트 구조 & 초기화 | 디렉토리 구조, pyproject.toml, uv 초기화 |
| 2.1 | 디렉토리 구조 컨벤션 | src layout vs flat layout 비교표, 선택 기준 |
| 2.2 | pyproject.toml 구조 | 각 섹션 설명, PEP 621 필드, build backend 비교 |
| 2.3 | uv 또는 poetry로 초기화 | 명령어 비교, 가상환경, lock 파일, dependency-groups |
| 3 | 코드 품질 & 개발 환경 | ruff, pytest, 환경변수 |
| 3.1 | ruff 설정 | rule 선택, check/format 사용법, isort 대체 |
| 3.2 | 테스트 환경 구성 | pytest 설정, 디렉토리 구조 |
| 3.3 | 환경변수 관리 | .env, python-dotenv, .gitignore |
| 4 | 자동화 파이프라인 | pre-commit, GitHub Actions |
| 4.1 | pre-commit 훅 구성 | .pre-commit-config.yaml, 훅 등록 |
| 4.2 | GitHub Actions CI | YAML 템플릿, uv cache, 단계 구성 |
| 5 | 마무리 | 요약, GitHub 코드 링크 |
| 6 | 참고 | 공식 문서, 레퍼런스 링크 |

### 2.4 섹션별 핵심 요소

**섹션 2.1 - 디렉토리 구조**: src layout vs flat layout 비교표

| 항목 | src layout | flat layout |
|------|-----------|-------------|
| 구조 | `src/패키지명/` | `패키지명/` |
| import 충돌 | 방지됨 | 가능성 있음 |
| 적합한 규모 | 라이브러리, 중대형 | 스크립트, 소규모 |

**섹션 2.2 - build backend 비교표**:

| 항목 | hatchling | setuptools | flit |
|------|-----------|------------|------|
| 설정 복잡도 | 낮음 | 중간 | 매우 낮음 |
| 기능 범위 | 넓음 | 매우 넓음 | 최소 |
| 추천 상황 | 기본 추천 | 레거시/복잡한 빌드 | 순수 Python 패키지 |

**섹션 2.3 - uv vs poetry 명령어 비교표**:

| 작업 | uv | poetry |
|------|-----|--------|
| 프로젝트 초기화 | `uv init` | `poetry init` |
| 패키지 설치 | `uv add requests` | `poetry add requests` |
| dev 의존성 | `uv add --group dev pytest` | `poetry add --group dev pytest` |
| lock 파일 | `uv.lock` (자동) | `poetry.lock` (자동) |
| 가상환경 생성 | `uv venv` (자동) | `poetry install` (자동) |

**섹션 3.1 - ruff rule 카테고리 표**:

| 카테고리 | 설명 |
|---------|------|
| E | pycodestyle 에러 |
| F | Pyflakes |
| I | isort (import 정렬) |
| UP | pyupgrade (최신 문법) |
| B | flake8-bugbear (버그 패턴) |
| SIM | flake8-simplify (간결화) |

### 2.5 다이어그램

- **setup.py → pyproject.toml 변천사**: `flowchart LR` (들어가며 섹션)
- **src layout vs flat layout 구조 비교**: 코드 블록으로 표현 (Mermaid 불필요)
- **CI 파이프라인 흐름**: `flowchart LR` (린트 → 타입체크 → 테스트)

---

## 3. 핵심 구현 포인트

### 3.1 uv 기준으로 작성하되 poetry 대조 제공

- 본문 코드 예제는 uv 기준으로 통일
- 각 섹션에서 poetry 대응 명령어를 비교표로 제공
- uv를 기본 추천하는 이유 명시 (속도, Rust 기반, lock 파일 자동화)

### 3.2 pyproject.toml 하나로 통합 강조

- 기존: `setup.py` + `setup.cfg` + `requirements.txt` + `.flake8` + `pytest.ini`
- 현재: `pyproject.toml` 하나에 모든 설정 통합
- 블로그에서 before/after 비교로 시각적 효과

### 3.3 실제 동작하는 샘플 프로젝트

- tutorials-python에 작성한 코드가 실제로 `uv run pytest` 통과 필수
- `ruff check`, `ruff format --check`, `mypy` 모두 통과 상태 유지
