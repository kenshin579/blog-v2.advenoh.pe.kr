# README Generator 환경변수 기반 동적 생성 구현

## 구현 개요

README Generator를 프로젝트별 하드코딩 방식에서 환경변수 기반 동적 생성 방식으로 변경하여 재사용성을 높입니다.

## 핵심 변경 사항

### 1. 환경변수 추가

**파일**: `.github/workflows/generate-readme.yml`

```yaml
- name: Run README generator
  run: |
    docker run --rm \
      -v ${{ github.workspace }}:/workspace \
      -e WORKSPACE_DIR=/workspace \
      -e CONTENT_DIR=contents \
      -e BLOG_URL=https://blog.advenoh.pe.kr \
      -e PROJECT_TITLE="Frank's IT Blog" \
      -e HITCOUNT_PATH=kenshin579/advenohpekr \
      -e NETLIFY_BADGE_ID=31900f77-681f-4ace-8b3b-906936f57a60 \
      kenshin579/readme-generator:latest
```

### 2. Python 스크립트 수정

**파일**: `scripts/generate_readme/generate_readme.py`

환경변수 로드:
```python
import os

# 환경변수 설정 (기본값: blog 프로젝트)
PROJECT_TITLE = os.getenv('PROJECT_TITLE', "Frank's IT Blog")
BLOG_URL = os.getenv('BLOG_URL', 'https://blog.advenoh.pe.kr')
HITCOUNT_PATH = os.getenv('HITCOUNT_PATH', 'kenshin579/advenohpekr')
NETLIFY_BADGE_ID = os.getenv('NETLIFY_BADGE_ID', '31900f77-681f-4ace-8b3b-906936f57a60')
```

76번 줄 수정:
```python
out_file.write(f'현재 [블로그]({BLOG_URL})에 작성된 내용입니다.\n\n')
```

### 3. HEADER.md 템플릿화

**파일**: `scripts/generate_readme/data/HEADER.md`

기존 하드코딩된 내용을 플레이스홀더로 변경:
```markdown
[![HitCount](http://hits.dwyl.io/{{HITCOUNT_PATH}})](http://hits.dwyl.io/{{HITCOUNT_PATH}})
[![Netlify Status](https://api.netlify.com/api/v1/badges/{{NETLIFY_BADGE_ID}}/deploy-status)](https://app.netlify.com/sites/advenoh/deploys)

# {{PROJECT_TITLE}} - Table of Contents
```

Python에서 템플릿 처리:
```python
def generate_header():
    with open('scripts/generate_readme/data/HEADER.md', 'r', encoding='utf-8') as f:
        template = f.read()

    # 플레이스홀더 치환
    header = template.replace('{{HITCOUNT_PATH}}', HITCOUNT_PATH)
    header = header.replace('{{NETLIFY_BADGE_ID}}', NETLIFY_BADGE_ID)
    header = header.replace('{{PROJECT_TITLE}}', PROJECT_TITLE)

    return header
```

## 프로젝트별 설정 예시

### Blog 프로젝트
```yaml
env:
  PROJECT_TITLE: "Frank's IT Blog"
  BLOG_URL: https://blog.advenoh.pe.kr
  HITCOUNT_PATH: kenshin579/advenohpekr
  NETLIFY_BADGE_ID: 31900f77-681f-4ace-8b3b-906936f57a60
```

### Investment 프로젝트
```yaml
env:
  PROJECT_TITLE: "Frank's Investment"
  BLOG_URL: https://investment.advenoh.pe.kr
  HITCOUNT_PATH: kenshin579/investmentadvenohpekr
  NETLIFY_BADGE_ID: YOUR_INVESTMENT_NETLIFY_ID
```

## Makefile 수정 사항

**파일**: `Makefile` (readme-generator 프로젝트)

기존 docker-run 타겟에 환경변수 지원 추가:

```makefile
# 기본 환경변수 (blog 프로젝트 기본값)
PROJECT_TITLE ?= Frank's IT Blog
BLOG_URL ?= https://blog.advenoh.pe.kr
HITCOUNT_PATH ?= kenshin579/advenohpekr
NETLIFY_BADGE_ID ?= 31900f77-681f-4ace-8b3b-906936f57a60

docker-run:
	docker run --rm \
		-v $(WORKSPACE_DIR):/workspace \
		-e WORKSPACE_DIR=/workspace \
		-e CONTENT_DIR=$(CONTENT_DIR) \
		-e PROJECT_TITLE="$(PROJECT_TITLE)" \
		-e BLOG_URL=$(BLOG_URL) \
		-e HITCOUNT_PATH=$(HITCOUNT_PATH) \
		-e NETLIFY_BADGE_ID=$(NETLIFY_BADGE_ID) \
		$(IMAGE_NAME):$(TAG)

# 프로젝트별 실행 예시
docker-run-blog:
	$(MAKE) docker-run \
		PROJECT_TITLE="Frank's IT Blog" \
		BLOG_URL=https://blog.advenoh.pe.kr \
		HITCOUNT_PATH=kenshin579/advenohpekr \
		NETLIFY_BADGE_ID=31900f77-681f-4ace-8b3b-906936f57a60

docker-run-investment:
	$(MAKE) docker-run \
		PROJECT_TITLE="Frank's Investment" \
		BLOG_URL=https://investment.advenoh.pe.kr \
		HITCOUNT_PATH=kenshin579/investmentadvenohpekr \
		NETLIFY_BADGE_ID=YOUR_INVESTMENT_NETLIFY_ID
```

## 장점

1. **재사용성**: 동일한 Docker 이미지를 모든 프로젝트에서 사용
2. **유지보수**: 프로젝트별 설정만 변경하면 됨
3. **확장성**: 새로운 프로젝트 추가 시 환경변수만 설정
4. **버전 관리**: 프로젝트별 HEADER.md 관리 불필요
