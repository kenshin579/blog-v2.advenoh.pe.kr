# README Generator Docker화 PRD

## 배경
블로그 형식의 사이트에서 README.md 파일에 전체 article 목록을 category 별로 자동 생성하는 기능을 이미 개발했으나, 다른 repo에서 쉽게 재사용할 수 있도록 일반화가 필요합니다.

## 핵심 요구사항
1. **Docker 컨테이너화**: GitHub Actions에서 Docker로 실행
2. **Makefile 기반 빌드**: Docker 이미지 빌드/푸시를 Makefile로 관리
3. **환경변수 설정**: 하드코딩된 경로와 URL을 환경변수로 대체
4. **재사용성**: 다른 블로그 프로젝트에 최소 수정으로 적용 가능

## 관련 문서
- **구현 설계**: [1_generate_readme_implementation.md](1_generate_readme_implementation.md)
- **작업 목록**: [1_generate_readme_todo.md](1_generate_readme_todo.md)

## 기존 파일
- `.github/workflows/generate-readme.yml` - GitHub Actions workflow
- `scripts/generate_readme/generate_readme.py` - Python 스크립트
- `scripts/generate_readme/requirements.txt` - Python 의존성
- `scripts/generate_readme/data/HEADER.md` - README 헤더 템플릿

## 현재 한계점
1. 하드코딩된 경로: `BLOG_CONTENT_DIR = 'contents/posts'`
2. 하드코딩된 URL: `BLOG_HOME_URL = 'https://blog.advenoh.pe.kr'`
3. 환경 의존성: GitHub Actions에서 Python 직접 설치 필요
4. 재사용성 부족: 다른 프로젝트 적용 어려움

## 개선 목표
1. Docker 컨테이너로 환경 독립성 확보
2. 환경변수로 설정 유연성 제공
3. Makefile로 빌드/배포 자동화
4. GitHub Actions 워크플로우 단순화

## 환경변수 설계
- `CONTENT_DIR`: 콘텐츠 디렉토리 (기본값: `contents`)
- `BLOG_URL`: 블로그 URL (기본값: `https://blog.advenoh.pe.kr`)
- `README_PATH`: README 파일 경로 (기본값: `/workspace/README.md`)
- `HEADER_TEMPLATE`: 헤더 템플릿 경로 (기본값: `data/HEADER.md`)

## 성공 기준
1. Docker 이미지 빌드 및 Docker Hub 푸시 성공
2. GitHub Actions에서 Docker 컨테이너 실행 성공
3. 환경변수로 설정 변경 가능
4. 로컬에서 `make docker-run` 실행 가능
5. 기존과 동일한 README.md 생성 결과

## 제약사항
- 기존 README 생성 로직 유지
- 기존 프로젝트 README.md 결과 변경 없음
- Python 3.13 이상 사용
- Docker 이미지 크기 최소화 (slim 이미지 사용)
