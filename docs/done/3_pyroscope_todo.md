# TODO: Grafana Pyroscope Go Continuous Profiling

## Phase 1: 샘플 코드 작성 (tutorials-go)

### 1-1. 프로젝트 셋업
- [x] `tutorials-go/golang/profiling/pyroscope/` 디렉토리 생성
- [x] `README.md` 작성 (실행 방법 설명)

### 1-2. basic 예제
- [x] `basic/main.go` - Pyroscope SDK 초기화 + 부하 생성 (CPU, 메모리, 뮤텍스)
- [x] `basic/main_test.go` - SDK 초기화 테스트
- [x] `basic/Dockerfile` 작성

### 1-3. http-server 예제
- [x] `http-server/main.go` - Echo + Pyroscope 연동
- [x] `http-server/handler.go` - /fast, /slow, /memory 핸들러 + Labels 태깅
- [x] `http-server/main_test.go` - 핸들러 테스트
- [x] `http-server/Dockerfile` 작성

### 1-4. Docker Compose 환경
- [x] `docker-compose.yml` 작성 (Pyroscope + Grafana + App)
- [x] `grafana/provisioning/datasources/pyroscope.yml` - 데이터소스 자동 설정

### 1-5. 빌드 및 동작 확인
- [x] `go mod tidy` 의존성 정리 및 빌드 확인
- [ ] `docker compose up` 으로 전체 환경 실행 확인
- [ ] Pyroscope UI (localhost:4040) 에서 프로파일 데이터 수집 확인
- [ ] Grafana (localhost:3000) 에서 Pyroscope 데이터소스 연결 확인
- [ ] Flame Graph 정상 표시 확인

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 2-1. 초안 작성
- [x] `docs/start/grafana-pyroscope로-go-애플리케이션-continuous-profiling-시작하기/index.md` 작성
- [x] 섹션 1: 들어가며 (pprof 한계 → Continuous Profiling 필요성)
- [x] 섹션 2: Continuous Profiling이란? (비교표, 프로파일 유형)
- [x] 섹션 3: Grafana Pyroscope 아키텍처 (Mermaid 다이어그램, Push/Pull)
- [x] 섹션 4: 로컬 환경 구축 (Docker Compose 실행 가이드)
- [x] 섹션 5: Go SDK 연동 (basic 예제 코드 설명)
- [x] 섹션 6: Profiling Labels (TagWrapper, 엔드포인트별 분류)
- [x] 섹션 7: Flame Graph 분석 (읽는 법, 병목 찾기)
- [x] 섹션 8: 실전 팁 (프로덕션 주의사항, 오버헤드)
- [x] 섹션 9: 마무리
- [x] 섹션 10: 참고 (레퍼런스 링크)

### 2-2. 스크린샷 캡처
- [ ] Pyroscope UI 메인 화면 (localhost:4040)
- [ ] Grafana Explore에서 Flame Graph 조회 화면
- [ ] Grafana 비교 뷰 (두 시점 비교)
- [ ] Labels 필터링 화면

### 2-3. 검토
- [x] 인코딩 확인 (`file -I` → charset=utf-8)
- [ ] Mermaid 다이어그램 렌더링 확인
- [x] 코드 예제와 tutorials-go 코드 일치 확인
- [x] GitHub 코드 링크 정확성 확인

---

## Phase 3: 리뷰 및 발행

- [ ] PR 생성 (feature 브랜치)
- [ ] 코드 리뷰 (샘플 코드 동작 확인)
- [ ] 글 리뷰 (맞춤법, 기술 정확성)
- [ ] `docs/start/` → `docs/merge_ready/`로 이동
- [ ] `docs/merge_ready/` → `contents/go/`로 이동 및 발행
