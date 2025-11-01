# README Generator Docker화 작업 TODO

## Phase 1: Docker 컨테이너화 기본 설정

### 1.1 Dockerfile 작성
- [x] `scripts/generate_readme/Dockerfile` 생성
  - [x] `FROM python:3.13-slim` 베이스 이미지 설정
  - [x] `WORKDIR /app` 작업 디렉토리 설정
  - [x] `requirements.txt` 복사 및 의존성 설치
  - [x] `generate_readme.py` 및 `data/` 디렉토리 복사
  - [x] `ENTRYPOINT` 및 `CMD` 설정

### 1.2 .dockerignore 작성
- [x] `scripts/generate_readme/.dockerignore` 생성
  - [x] `venv/`, `__pycache__/`, `.idea/` 제외
  - [x] `*.pyc`, `.pytest_cache/` 제외

### 1.3 로컬 빌드 테스트
- [ ] Docker 이미지 빌드 실행 (Docker daemon not running)
  ```bash
  cd scripts/generate_readme
  docker build -t readme-generator:test .
  ```
- [ ] 빌드 성공 확인 및 이미지 크기 확인

## Phase 2: Makefile 작성

### 2.1 기본 타겟 구현
- [x] `scripts/generate_readme/Makefile` 생성
- [x] `docker-build` 타겟 작성
  - [x] 이미지명: `kenshin579/readme-generator:latest`
- [x] `docker-push` 타겟 작성
  - [x] Docker Hub 푸시 명령어
- [x] `docker-run` 타겟 작성
  - [x] Volume 마운트: `-v $(PWD)/../..:/workspace`
  - [x] 환경변수 전달: `CONTENT_DIR`, `BLOG_URL`
- [x] `test` 타겟 작성
  - [x] pytest 실행 명령어

### 2.2 Makefile 테스트
- [ ] `make docker-build` 실행 확인 (Docker daemon not running)
- [ ] `make docker-run` 로컬 실행 테스트 (Docker daemon not running)
- [ ] README.md 생성 결과 확인

## Phase 3: 스크립트 일반화

### 3.1 환경변수 지원 추가
- [x] `generate_readme.py` 수정
  - [x] `import os` 추가 (already present)
  - [x] 환경변수 읽기 로직 추가
    ```python
    CONTENT_DIR = os.getenv('CONTENT_DIR', 'contents')
    BLOG_URL = os.getenv('BLOG_URL', 'https://blog.advenoh.pe.kr')
    README_PATH = os.getenv('README_PATH', '/workspace/README.md')
    HEADER_TEMPLATE = os.getenv('HEADER_TEMPLATE', 'data/HEADER.md')
    ```
  - [x] 경로 설정 수정
    ```python
    WORKSPACE_DIR = os.getenv('WORKSPACE_DIR', '/workspace')
    BLOG_CONTENT_DIR = os.path.join(WORKSPACE_DIR, CONTENT_DIR)
    ```

### 3.2 README 파일 경로 수정
- [x] `README_FILE` 변수를 환경변수 기반으로 변경
- [x] `README_HEADER_FILE` 경로 수정

### 3.3 URL 생성 로직 수정
- [x] `__write_blog_list_to_file()` 메서드 수정
  - [x] `BLOG_HOME_URL` → `BLOG_URL` 환경변수 사용
  - [x] 링크 생성 로직 검증

### 3.4 스크립트 테스트
- [ ] Docker 컨테이너로 실행 테스트 (Docker daemon not running)
- [ ] 다른 환경변수 값으로 테스트
- [ ] 생성된 README.md 검증

## Phase 4: GitHub Actions 워크플로우 수정

### 4.1 워크플로우 파일 수정
- [x] `.github/workflows/generate-readme.yml` 열기
- [x] Python 설치 단계 제거
  - [x] `Set up Python` step 삭제
  - [x] `Install dependencies` step 삭제
- [x] Docker 실행 단계 추가
  ```yaml
  - name: Run README generator
    run: |
      docker run --rm \
        -v ${{ github.workspace }}:/workspace \
        -e CONTENT_DIR=contents \
        -e BLOG_URL=https://blog.advenoh.pe.kr \
        kenshin579/readme-generator:latest
  ```

### 4.2 워크플로우 테스트
- [ ] 테스트 브랜치 생성 (to be done after Docker image is pushed)
- [ ] 워크플로우 수동 트리거 또는 push로 실행
- [ ] GitHub Actions 로그 확인
- [ ] Pull Request 자동 생성 확인
- [ ] README.md 변경 내용 확인

## Phase 5: Docker Hub 배포

### 5.1 Docker Hub 준비
- [ ] Docker Hub 로그인 (Docker daemon not running locally)
  ```bash
  docker login
  ```
- [ ] 이미지 태그 확인: `kenshin579/readme-generator:latest`

### 5.2 이미지 푸시
- [ ] `make docker-push` 실행 (requires Docker daemon running)
- [ ] Docker Hub에서 이미지 확인
- [ ] Pull 테스트
  ```bash
  docker pull kenshin579/readme-generator:latest
  ```

**Note**: Docker 이미지 빌드 및 푸시는 Docker daemon이 실행 중인 환경에서 수행해야 합니다.

## Phase 6: 검증 및 정리

### 6.1 전체 워크플로우 검증
- [ ] 로컬에서 `make docker-run` 실행 성공 (after Docker image is available)
- [ ] GitHub Actions에서 정상 실행 확인 (after Docker image is pushed)
- [ ] 생성된 README.md가 기존과 동일한 포맷인지 확인

### 6.2 문서 정리
- [ ] PRD 파일 정리 (중복 내용 제거)
- [ ] 구현 문서 최종 검토
- [x] TODO 완료 항목 체크

### 6.3 버전 태깅 (선택)
- [ ] Git 태그 생성 (예: `v1.0.0`)
- [ ] Docker 이미지 버전 태그 (예: `kenshin579/readme-generator:v1.0.0`)

## 예상 작업 시간
- Phase 1: 30분
- Phase 2: 20분
- Phase 3: 40분
- Phase 4: 30분
- Phase 5: 15분
- Phase 6: 25분
- **총 예상 시간: 약 2.5-3시간**

## 주의사항
1. 기존 README 생성 로직은 변경하지 않음
2. 환경변수 기본값으로 현재 프로젝트 설정 유지
3. Docker 이미지 빌드 시 캐시 활용 (`--no-cache-dir`)
4. GitHub Actions에서 Docker 이미지가 공개 저장소에 있어야 함
