# PRD: uv - 차세대 Python 패키지 매니저

## 개요
Rust 기반 초고속 Python 패키지 매니저 uv의 설치부터 실전 활용까지 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 개발 환경 구축
- **번호**: 1-1
- **난이도**: 초급
- **우선순위**: ★★★

## 다룰 내용
1. uv란? (pip/poetry/pipenv 대비 장점)
2. 설치 방법
3. 프로젝트 생성 및 초기화 (`uv init`)
4. 의존성 관리 (`uv add`, `uv remove`, `uv lock`)
5. pyproject.toml 구조
6. 가상환경 관리 (`uv venv`)
7. Python 버전 관리 (`uv python`)
8. 스크립트 실행 (`uv run`)
9. pip 호환 명령어 (`uv pip`)
10. 성능 벤치마크 (pip vs poetry vs uv)
11. 기존 프로젝트 마이그레이션 (requirements.txt → uv)

## 샘플 코드
- `tutorials-python/python/uv-demo/`
- pyproject.toml 예시, 마이그레이션 스크립트

## 참고
- https://docs.astral.sh/uv/
- https://github.com/astral-sh/uv
