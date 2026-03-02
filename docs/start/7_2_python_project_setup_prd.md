# PRD: Python 프로젝트 셋업 모범 사례 (2026)

## 개요
pyproject.toml 중심의 현대적 Python 프로젝트 구성법을 정리하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 개발 환경 구축
- **번호**: 1-2
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용
1. pyproject.toml 구조와 각 섹션 설명
2. uv 또는 poetry로 프로젝트 초기화
3. ruff (린터/포매터) 설정
4. pre-commit 훅 구성
5. GitHub Actions CI 파이프라인
6. 디렉토리 구조 컨벤션 (src layout vs flat layout)
7. 테스트 환경 구성 (pytest)
8. 환경변수 관리 (.env, python-dotenv)

## 샘플 코드
- `tutorials-python/python/project-template/`

## 참고
- https://packaging.python.org/en/latest/
- https://docs.astral.sh/ruff/
