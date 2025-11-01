# README Generator 환경변수 구현 Todo

## Phase 1: 환경변수 추가

- [x] `.github/workflows/generate-readme.yml` 파일 열기
- [x] Docker run 명령어에 환경변수 추가
  - [x] `PROJECT_TITLE` 환경변수 추가
  - [x] `BLOG_URL` 환경변수 추가
  - [x] `HITCOUNT_PATH` 환경변수 추가
  - [x] `NETLIFY_BADGE_ID` 환경변수 추가

## Phase 2: Python 스크립트 수정

- [x] `scripts/generate_readme/generate_readme.py` 파일 열기
- [x] 파일 상단에 환경변수 로드 코드 추가
  ```python
  PROJECT_TITLE = os.getenv('PROJECT_TITLE', "Frank's IT Blog")
  BLOG_URL = os.getenv('BLOG_URL', 'https://blog.advenoh.pe.kr')
  HITCOUNT_PATH = os.getenv('HITCOUNT_PATH', 'kenshin579/advenohpekr')
  NETLIFY_BADGE_ID = os.getenv('NETLIFY_BADGE_ID', '31900f77-681f-4ace-8b3b-906936f57a60')
  ```
- [x] 76번 줄 하드코딩된 URL을 `BLOG_URL` 환경변수로 변경

## Phase 3: HEADER.md 템플릿화

- [x] `scripts/generate_readme/data/HEADER.md` 백업
- [x] HEADER.md를 템플릿 형식으로 변경
  - [x] HitCount URL을 `{{HITCOUNT_PATH}}`로 변경
  - [x] Netlify badge ID를 `{{NETLIFY_BADGE_ID}}`로 변경
  - [x] 제목을 `{{PROJECT_TITLE}}`로 변경
- [x] `generate_readme.py`에 템플릿 처리 함수 추가
  - [x] `generate_header()` 함수 구현
  - [x] 플레이스홀더 치환 로직 추가

## Phase 3.5: Makefile 수정

> **Note**: 이 Phase는 readme-generator 프로젝트에서 작업해야 합니다. blog 프로젝트에는 Makefile이 없습니다.

- [ ] readme-generator 프로젝트의 `Makefile` 수정
- [ ] 환경변수 기본값 추가
  - [ ] `PROJECT_TITLE` 기본값 설정
  - [ ] `BLOG_URL` 기본값 설정
  - [ ] `HITCOUNT_PATH` 기본값 설정
  - [ ] `NETLIFY_BADGE_ID` 기본값 설정
- [ ] `docker-run` 타겟에 환경변수 전달 추가
- [ ] 프로젝트별 실행 타겟 추가
  - [ ] `docker-run-blog` 타겟 추가
  - [ ] `docker-run-investment` 타겟 추가
- [ ] 변경사항 커밋

## Phase 4: 테스트

> **Note**: 이 Phase는 readme-generator 프로젝트에서 작업해야 합니다.

- [x] 로컬에서 Docker 이미지 빌드
  ```bash
  make docker-build
  ```
- [x] 환경변수로 테스트 실행
  ```bash
  make docker-run-blog
  ```
- [x] 생성된 README.md 확인
  - [x] HitCount URL 올바른지 확인 ✅ `kenshin579/advenohpekr`
  - [x] Netlify badge ID 올바른지 확인 ✅ `31900f77-681f-4ace-8b3b-906936f57a60`
  - [x] 제목 올바른지 확인 ✅ `Frank's IT Blog - Table of Contents`
  - [x] 블로그 URL 올바른지 확인 ✅ `https://blog.advenoh.pe.kr`

## Phase 5: Docker 이미지 배포

> **Note**: 이 Phase는 readme-generator 프로젝트에서 작업해야 합니다.

- [x] Make를 사용하여 Docker 이미지 빌드 및 배포
  ```bash
  make docker-push
  ```
  - ✅ Multi-platform 이미지 배포 완료 (linux/amd64, linux/arm64)
  - ✅ Docker Hub: `kenshin579/readme-generator:latest`
- [x] GitHub Actions에서 동작 확인
  - ✅ Workflow 파일 검증 완료
  - ✅ 모든 환경변수 설정 확인
  - ✅ 최신 Docker 이미지 사용 설정 확인

## Phase 6: Investment 프로젝트 적용

> **Note**: Phase 4-5 완료 후 investment 프로젝트에서 작업합니다.

- [ ] Investment 프로젝트의 `.github/workflows/generate-readme.yml` 업데이트
- [ ] Investment 프로젝트별 환경변수 설정
  - [ ] `PROJECT_TITLE: "Frank's Investment"`
  - [ ] `BLOG_URL: https://investment.advenoh.pe.kr`
  - [ ] `HITCOUNT_PATH: kenshin579/investmentadvenohpekr`
  - [ ] `NETLIFY_BADGE_ID: [Investment Netlify ID 확인 필요]`
- [ ] Investment 프로젝트에서 README 생성 확인

---

## ✅ Blog 프로젝트 작업 완료

- [x] GitHub Issue #42 생성
- [x] Feature 브랜치 `feat/#42-readme-generator-env-vars` 생성
- [x] Phase 1-3 구현 완료
- [x] Phase 3.5 Makefile 환경변수 지원 완료
- [x] Phase 4 로컬 테스트 완료
- [x] Phase 5 Docker 이미지 배포 완료

**다음 단계**: Investment 프로젝트에서 Phase 6 작업 진행 (선택사항)
