# README Generator 버그 분석

## 문제 개요

investment 프로젝트(https://github.com/kenshin579/investment.advenoh.pe.kr)에서 blog 프로젝트의 `generate_readme.yml`을 복사하여 실행했을 때 다음 문제가 발생:

1. HitCount, Netlify Status 배지가 깨짐
2. 헤더 제목이 "Frank's IT Blog"로 잘못 표시 (올바른 제목: "Frank's Investment")

## 근본 원인 분석

### 1. 배지 URL 하드코딩 문제

**위치**: `scripts/generate_readme/data/HEADER.md:1-2`

**문제점**:
- HitCount URL: `kenshin579/advenohpekr` - blog 프로젝트용 경로
- Netlify badge ID: `31900f77-681f-4ace-8b3b-906936f57a60` - blog 프로젝트의 Netlify ID

**결과**: investment 프로젝트에서 blog 프로젝트의 통계를 표시하거나 404 에러 발생

### 2. 헤더 제목 하드코딩 문제

**위치**: `scripts/generate_readme/data/HEADER.md:4`

**문제점**:
- 제목이 "Frank's IT Blog"로 하드코딩됨
- investment 프로젝트는 "Frank's Investment"여야 함

### 3. 블로그 URL 하드코딩 문제

**위치**: `scripts/generate_readme/generate_readme.py:76`

**문제점**:
- 소개 텍스트에 blog URL이 하드코딩됨
- `BLOG_URL` 환경변수를 사용하지 않음

## 해결 방안

환경변수 기반 동적 생성 방식으로 변경 (상세 구현: `1_bug_implementation.md` 참조)

## 구현 계획

구현 단계별 체크리스트: `1_bug_todo.md` 참조

## 참고 정보

- **현재 blog 프로젝트 설정**: `.github/workflows/generate-readme.yml:30`
- **README Generator 스크립트**: `scripts/generate_readme/generate_readme.py`
- **헤더 템플릿**: `scripts/generate_readme/data/HEADER.md`
