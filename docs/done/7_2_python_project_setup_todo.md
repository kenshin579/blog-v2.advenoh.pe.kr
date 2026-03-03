# TODO: Python 프로젝트 셋업 모범 사례 (2026)

## Phase 1: 샘플 코드 작성 (tutorials-python)

### 1-1. 프로젝트 셋업
- [x] `tutorials-python/python/project-template/` 디렉토리 생성
- [x] `uv init` 으로 프로젝트 초기화
- [x] `pyproject.toml` 작성 (PEP 621 메타데이터 + 도구 설정)
- [x] `.python-version` 파일 생성
- [x] `README.md` 작성 (실행 방법 설명)

### 1-2. src layout 코드
- [x] `src/myapp/__init__.py` 생성
- [x] `src/myapp/main.py` - 엔트리포인트 (간단한 CLI 예제)
- [x] `src/myapp/config.py` - 환경변수 로딩 (python-dotenv)

### 1-3. 테스트
- [x] `tests/__init__.py` 생성
- [x] `tests/test_main.py` - pytest 테스트 예제
- [x] `uv run pytest` 통과 확인

### 1-4. 코드 품질 도구
- [x] `[tool.ruff]` 설정 후 `uv run ruff check .` 통과 확인
- [x] `uv run ruff format --check .` 통과 확인
- [x] `uv run mypy src/` 통과 확인

### 1-5. 환경변수
- [x] `.env.example` 작성 (APP_NAME, DEBUG 등)
- [x] `.gitignore` 작성 (.env, __pycache__, .venv 등)

### 1-6. 자동화 설정
- [x] `.pre-commit-config.yaml` 작성
- [ ] `pre-commit install` 및 `pre-commit run --all-files` 통과 확인
- [x] `.github/workflows/ci.yml` 작성

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 2-1. 초안 작성
- [x] `docs/start/python-프로젝트-셋업-모범-사례/index.md` 생성
- [x] 섹션 1: 들어가며 (setup.py → pyproject.toml 변천사)
- [x] 섹션 2: 프로젝트 구조 & 초기화
  - [x] 2.1 디렉토리 구조 컨벤션 (src layout vs flat layout 비교표)
  - [x] 2.2 pyproject.toml 구조 (각 섹션 설명, build backend 비교표)
  - [x] 2.3 uv 또는 poetry로 초기화 (명령어 비교표)
- [x] 섹션 3: 코드 품질 & 개발 환경
  - [x] 3.1 ruff 설정 (rule 카테고리 표, 사용법)
  - [x] 3.2 테스트 환경 구성 (pytest 설정)
  - [x] 3.3 환경변수 관리 (.env, python-dotenv)
- [x] 섹션 4: 자동화 파이프라인
  - [x] 4.1 pre-commit 훅 구성
  - [x] 4.2 GitHub Actions CI (YAML 템플릿)
- [x] 섹션 5: 마무리
- [x] 섹션 6: 참고 (레퍼런스 링크)

### 2-2. 다이어그램
- [x] setup.py → pyproject.toml 변천사 (Mermaid flowchart)
- [x] CI 파이프라인 흐름 (Mermaid flowchart)

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
