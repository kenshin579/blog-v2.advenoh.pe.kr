# IT Biweekly News 자동 수집 시스템 - TODO 체크리스트

## Phase 1: 프로젝트 설정

### 1.1 디렉토리 구조 생성
- [x] `scripts/news/` 디렉토리 생성
- [x] `config/` 디렉토리 생성

### 1.2 Python 프로젝트 설정
- [x] `scripts/news/pyproject.toml` 작성
- [x] Python 3.12 환경 확인
- [x] 의존성 설치 테스트 (`pip install -e ./scripts/news`)

---

## Phase 2: 설정 파일 작성

### 2.1 Feed 설정
- [x] `config/feeds.yaml` 작성
- [x] RSS Feed URL 유효성 확인

### 2.2 카테고리 설정
- [x] `config/categories.yaml` 작성
- [x] 키워드 목록 검토 및 보완

---

## Phase 3: Supabase DB 설정

### 3.1 테이블 생성
- [ ] Supabase 프로젝트 접속
- [ ] `collected_articles` 테이블 생성 (scripts/news/schema.sql 참조)
- [ ] 인덱스 생성

### 3.2 환경 변수 설정
- [x] 로컬 `~/.zshrc`에 환경 변수 추가 완료
  - `BLOG_IT_NEWS_SUPABASE_URL`
  - `BLOG_IT_NEWS_SUPABASE_API_KEY`
- [ ] GitHub Secrets에 동일한 변수 추가

---

## Phase 4: Python 모듈 개발

### 4.1 DB 클라이언트 (`db_client.py`)
- [x] Supabase 클라이언트 초기화
- [x] `get_existing_urls()` 구현
- [x] `save_articles()` 구현
- [ ] 단위 테스트 작성

### 4.2 Feed 파서 (`feed_parser.py`)
- [x] `load_feeds()` 구현
- [x] `parse_feed()` 구현
- [x] `collect_all_feeds()` 구현
- [x] 날짜 필터링 로직 테스트
- [ ] 단위 테스트 작성

### 4.3 카테고리 분류 (`categorizer.py`)
- [x] `load_categories()` 구현
- [x] `categorize_article()` 구현
- [x] `categorize_articles()` 구현
- [x] 키워드 매칭 로직 테스트
- [ ] 단위 테스트 작성

### 4.4 Markdown 생성 (`markdown_generator.py`)
- [x] `get_series_name()` 구현 (상반기/하반기 분기)
- [x] `generate_markdown()` 구현
- [x] `get_output_path()` 구현
- [x] Frontmatter 형식 검증
- [ ] 단위 테스트 작성

### 4.5 메인 스크립트 (`generate_news.py`)
- [x] 전체 파이프라인 통합
- [x] GitHub Action 환경변수 출력 로직
- [x] 에러 핸들링 추가
- [ ] 통합 테스트 작성

---

## Phase 5: GitHub Action 설정

### 5.1 워크플로우 작성
- [x] `.github/workflows/biweekly-news.yml` 작성
- [x] cron 스케줄 설정 (매월 1일, 15일)
- [x] `workflow_dispatch` 추가 (수동 실행)

### 5.2 PR 생성 설정
- [x] `peter-evans/create-pull-request` 액션 설정
- [x] PR 템플릿 작성
- [x] 라벨 설정 확인

---

## Phase 6: 테스트 및 검증

### 6.1 로컬 테스트
- [x] 로컬에서 스크립트 실행 테스트
- [x] 생성된 Markdown 파일 형식 검증
- [ ] DB 저장 확인 (테이블 생성 후 확인 필요)

### 6.2 GitHub Action 테스트
- [ ] `workflow_dispatch`로 수동 실행 테스트
- [ ] PR 생성 확인
- [ ] 로그 확인 및 디버깅

---

## Phase 7: 운영 준비

### 7.1 문서화
- [ ] README 업데이트 (스크립트 사용법)
- [ ] Feed 추가 가이드 작성

### 7.2 모니터링
- [ ] 첫 자동 실행 결과 확인
- [ ] Supabase 대시보드에서 데이터 확인

---

## 완료 체크리스트

- [ ] 모든 Phase 완료
- [ ] 첫 번째 뉴스레터 PR 생성 성공
- [ ] PR merge 후 블로그 정상 표시 확인
