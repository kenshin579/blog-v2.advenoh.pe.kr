# README Generator 구현 설계

## 아키텍처 개요

```
┌─────────────────────────────────────────────────┐
│           GitHub Actions Workflow               │
│  (.github/workflows/generate-readme.yml)        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Docker Container  │
         │  (readme-generator)│
         └────────┬───────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   generate_readme.py        │
    │   - 환경변수 읽기           │
    │   - 디렉토리 탐색           │
    │   - Frontmatter 파싱        │
    │   - README.md 생성          │
    └─────────────────────────────┘
```

## 1. Docker 컨테이너화

### Dockerfile
**위치**: `scripts/generate_readme/Dockerfile`

**구조**:
```dockerfile
# Base image
FROM python:3.13-slim

# Working directory
WORKDIR /app

# Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Script
COPY generate_readme.py .
COPY data/ ./data/

# Entrypoint
ENTRYPOINT ["python", "generate_readme.py"]
CMD ["-g"]
```

**핵심 결정**:
- `python:3.13-slim` 사용 (이미지 크기 최소화)
- 멀티스테이지 빌드 불필요 (단순 Python 스크립트)
- Volume 마운트로 프로젝트 디렉토리 접근

### .dockerignore
**위치**: `scripts/generate_readme/.dockerignore`

**제외 항목**:
```
venv/
__pycache__/
.idea/
*.pyc
.pytest_cache/
```

## 2. Makefile

**위치**: `scripts/generate_readme/Makefile`

**타겟 정의**:

### docker-build
```makefile
docker-build:
	docker build -t kenshin579/readme-generator:latest .
```

### docker-push
```makefile
docker-push:
	docker push kenshin579/readme-generator:latest
```

### docker-run
```makefile
docker-run:
	docker run --rm \
		-v $(PWD)/../..:/workspace \
		-e CONTENT_DIR=contents \
		-e BLOG_URL=https://blog.advenoh.pe.kr \
		kenshin579/readme-generator:latest
```

### test
```makefile
test:
	pytest test_generate_readme.py -v
```

## 3. 스크립트 일반화

### 환경변수 지원

**필수 환경변수**:
- `CONTENT_DIR`: 콘텐츠 디렉토리 경로 (기본값: `contents`)
- `BLOG_URL`: 블로그 URL (기본값: `https://blog.advenoh.pe.kr`)

**선택 환경변수**:
- `README_PATH`: README.md 파일 경로 (기본값: `/workspace/README.md`)
- `HEADER_TEMPLATE`: 헤더 템플릿 경로 (기본값: `data/HEADER.md`)

### 코드 수정 사항

**기존 코드**:
```python
BLOG_CONTENT_DIR = '/'.join([BLOG_DIR, 'contents', 'posts'])
BLOG_HOME_URL = 'https://blog.advenoh.pe.kr'
```

**개선 코드**:
```python
import os

# 환경변수 읽기 (기본값 제공)
CONTENT_DIR = os.getenv('CONTENT_DIR', 'contents')
BLOG_URL = os.getenv('BLOG_URL', 'https://blog.advenoh.pe.kr')
README_PATH = os.getenv('README_PATH', '/workspace/README.md')
HEADER_TEMPLATE = os.getenv('HEADER_TEMPLATE', 'data/HEADER.md')

# 작업 디렉토리 기준 경로 설정
WORKSPACE_DIR = os.getenv('WORKSPACE_DIR', '/workspace')
BLOG_CONTENT_DIR = os.path.join(WORKSPACE_DIR, CONTENT_DIR)
```

### 디렉토리 구조 탐색

**현재 구조**: `contents/{category}/{post}/index.md`

**탐색 로직**:
```python
def __get_all_files_with_extension(self, path, extensions):
    """재귀적으로 마크다운 파일 탐색"""
    filenames_with_extension = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:
            ext = os.path.splitext(filename)[-1]
            for extension in extensions:
                if ext == '.' + extension:
                    filenames_with_extension.append(os.path.join(dirpath, filename))
    return filenames_with_extension
```

이 로직은 다음 구조를 모두 지원:
- `contents/{category}/{post}/index.md`
- `contents/{category}/{post}.md`
- `posts/{post}.md`

## 4. GitHub Actions 워크플로우

**위치**: `.github/workflows/generate-readme.yml`

**수정 전략**:

### 변경 사항
1. Python 설치 단계 제거
2. Docker 컨테이너 실행 단계 추가
3. 환경변수 전달

### 새로운 워크플로우
```yaml
name: Generate TOC in README

on:
  push:
    paths-ignore:
    - 'README.md'
    branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Run README generator
      run: |
        docker run --rm \
          -v ${{ github.workspace }}:/workspace \
          -e CONTENT_DIR=contents \
          -e BLOG_URL=https://blog.advenoh.pe.kr \
          kenshin579/readme-generator:latest

    - name: Create commits
      run: |
        git config user.name ${{ github.actor }}
        git config user.email 'kenshin579@hotmail.com'
        git add README.md
        git commit -am "update README file"

    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v3
      with:
        commit-message: Update README file
        branch: readme-patches
        delete-branch: true
        title: '[AUTO] Update README file'
        body: |
          Update README file
        labels: |
          automated pr
        assignees: kenshin579
        reviewers: kenshin579
```

## 5. 테스트 전략

### 로컬 테스트
```bash
# 1. Docker 이미지 빌드
cd scripts/generate_readme
make docker-build

# 2. 로컬 실행 테스트
make docker-run

# 3. README.md 생성 확인
cat ../../README.md
```

### GitHub Actions 테스트
1. 브랜치 생성하여 워크플로우 테스트
2. Pull Request 자동 생성 확인
3. README.md 내용 검증

## 파일 구조

```
blog-v2.advenoh.pe.kr/
├── .github/
│   └── workflows/
│       └── generate-readme.yml          # 수정됨
├── scripts/
│   └── generate_readme/
│       ├── Dockerfile                   # 신규
│       ├── .dockerignore                # 신규
│       ├── Makefile                     # 신규
│       ├── generate_readme.py           # 수정됨
│       ├── requirements.txt             # 기존 유지
│       ├── test_generate_readme.py      # 기존 유지
│       └── data/
│           └── HEADER.md                # 기존 유지
└── README.md                            # 생성됨
```

## 제약사항 준수

### 1. 기존 로직 유지
- `__get_blog_title()`: Frontmatter 파싱 로직 유지
- `__write_blog_list_to_file()`: README 생성 로직 유지
- 카테고리별 그룹핑 로직 유지

### 2. 결과 일관성
- 기존과 동일한 README.md 포맷 생성
- 링크 구조 유지: `{BLOG_URL}/{post-directory}/`

### 3. 이미지 크기 최적화
- `python:3.13-slim` 사용 (~120MB)
- `--no-cache-dir` 옵션으로 캐시 제거
