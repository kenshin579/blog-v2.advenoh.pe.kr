# scripts/news 개선 TODO

## Phase 1: 출력 경로 변경

- [x] `scripts/news/markdown/generator.py` 수정
  - [x] `get_output_path()` 함수에 `base_dir` 파라미터 추가
  - [x] 경로 패턴 변경: `contents/news/biweekly-news-{date}` → `contents/biweekly/news-{date}`
- [x] `scripts/news/main.py` 수정
  - [x] 프로젝트 루트 경로 계산 로직 추가
  - [x] `get_output_path()` 호출 시 루트 경로 전달

## Phase 2: 카테고리 병합 제거

- [x] `scripts/news/main.py` 수정
  - [x] 56-57줄의 `merge_small_categories()` 호출 제거
  - [x] 12줄의 import에서 `merge_small_categories` 제거

## Phase 3: 테스트

- [x] 스크립트 실행 테스트
  - [x] `cd scripts/news && python main.py` 실행
  - [x] 출력 경로 확인: `contents/biweekly/news-{date}/index.md`
  - [x] 생성된 파일에 모든 카테고리가 포함되었는지 확인
- [x] 기존 테스트 파일 정리
  - [x] `scripts/news/contents/` 폴더 삭제 (테스트용으로 생성된 파일)
