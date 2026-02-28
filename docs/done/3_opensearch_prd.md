# OpenSearch 스터디 블로그 PRD

## 1. 개요

### 1.1 목적

OpenSearch의 핵심 개념과 Go 클라이언트를 활용한 실전 사용법을 학습하고, 블로그 글로 정리한다.
검색 엔진의 기본 원리부터 인덱스 설계, CRUD, 검색 쿼리, Aggregation, 그리고 OpenSearch Dashboards를 활용한 시각화(Top Errors, API 호출 지표 등)까지 단계별로 다루는 실전 가이드를 작성한다.

### 1.2 대상 독자

- OpenSearch/Elasticsearch를 처음 접하는 백엔드 개발자
- Go에서 검색 엔진을 연동하려는 개발자
- 전문 검색(Full-text Search) 시스템에 관심 있는 개발자

### 1.3 관련 Repo

- **블로그**: [blog-v2.advenoh.pe.kr](https://github.com/kenshin579/blog-v2.advenoh.pe.kr)
- **샘플 코드**: [tutorials-go](https://github.com/kenshin579/tutorials-go) → `database/opensearch/`

---

## 2. 블로그 구성

### 2.1 시리즈 구성

3편 시리즈로 구성한다. 1편에서 기본기를 다지고, 2편에서 실전 검색과 Aggregation을, 3편에서 Dashboards 시각화를 다룬다.

| 편 | 제목 (안) | 주요 내용 |
|----|-----------|-----------|
| 1편 | OpenSearch 입문 - 개념 이해와 Go 클라이언트로 CRUD 시작하기 | OpenSearch 개념, 환경 구성, 인덱스/매핑, 문서 CRUD |
| 2편 | OpenSearch 검색과 Aggregation - Go로 쿼리 DSL 다루기 | 검색 쿼리 (match, bool, range), Aggregation (Metric, Bucket) |
| 3편 | OpenSearch Dashboards - Top Errors와 API 호출 지표 시각화 | API 로그 데이터, Visualization 생성, 대시보드 구성 |

### 2.2 블로그 메타 정보

#### 1편

```yaml
---
title: "OpenSearch 입문 - 개념 이해와 Go 클라이언트로 CRUD 시작하기"
description: "OpenSearch의 핵심 개념(역색인, Analyzer, 매핑)을 이해하고, Go 클라이언트로 인덱스 생성부터 문서 CRUD까지 실전 예제와 함께 정리합니다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - OpenSearch
  - Elasticsearch
  - 검색엔진
  - Full-text Search
  - Go
  - golang
series: "OpenSearch 시리즈"
---
```

- **Draft 위치**: `docs/start/opensearch-입문-개념-이해와-go-클라이언트로-crud-시작하기/index.md`
- **Publish 위치**: `contents/database/opensearch-입문-개념-이해와-go-클라이언트로-crud-시작하기/`

#### 2편

```yaml
---
title: "OpenSearch 검색과 Aggregation - Go로 쿼리 DSL 다루기"
description: "match, bool, range 등 검색 쿼리와 Metric/Bucket Aggregation을 Go 클라이언트 코드와 함께 실전 예제로 정리합니다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - OpenSearch
  - 검색엔진
  - Query DSL
  - Aggregation
  - Go
  - golang
series: "OpenSearch 시리즈"
---
```

- **Draft 위치**: `docs/start/opensearch-검색과-aggregation-go로-쿼리-dsl-다루기/index.md`
- **Publish 위치**: `contents/database/opensearch-검색과-aggregation-go로-쿼리-dsl-다루기/`

#### 3편

```yaml
---
title: "OpenSearch Dashboards - Top Errors와 API 호출 지표 시각화"
description: "API 로그 데이터를 OpenSearch에 색인하고, Dashboards에서 Top Errors, 응답 시간, 엔드포인트별 호출 지표를 시각화하는 방법을 정리합니다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - OpenSearch
  - OpenSearch Dashboards
  - 로그 분석
  - 모니터링
  - Go
  - golang
series: "OpenSearch 시리즈"
---
```

- **Draft 위치**: `docs/start/opensearch-dashboards-top-errors와-api-호출-지표-시각화/index.md`
- **Publish 위치**: `contents/database/opensearch-dashboards-top-errors와-api-호출-지표-시각화/`

#### 공통

- **카테고리**: `database`

---

## 3. 블로그 목차

### 3.1 1편: OpenSearch 입문

```
# 1. OpenSearch란?
  ## 1.1 OpenSearch vs Elasticsearch
    - 역사: Elasticsearch 7.10 fork → OpenSearch 탄생 배경
    - 라이선스 차이: SSPL vs Apache 2.0
    - 호환성: REST API, 쿼리 DSL 대부분 동일
    - 기능 비교 표
  ## 1.2 핵심 개념
    - Index, Document, Field, Mapping
    - Shard와 Replica (분산 저장 원리)
    - Inverted Index (역색인)의 동작 원리
    - Analyzer: Tokenizer + Token Filter 파이프라인
  ## 1.3 언제 사용하는가?
    - 전문 검색 (Full-text Search)
    - 로그 분석 (ELK/EFK 스택)
    - 실시간 분석 (Aggregation)
    - RDBMS의 LIKE 검색 한계

# 2. 환경 구성
  ## 2.1 Docker Compose로 OpenSearch 실행
    - OpenSearch + OpenSearch Dashboards 구성
    - docker-compose.yml 작성
    - 보안 설정 (demo certificates, admin 계정)
  ## 2.2 OpenSearch Dashboards 둘러보기
    - Dev Tools 콘솔 사용법
    - 클러스터 상태 확인 (/_cat/health, /_cat/indices)
  ## 2.3 Go 클라이언트 설정
    - opensearch-go 클라이언트 라이브러리 소개
    - 연결 설정 및 Ping 테스트

# 3. 인덱스와 매핑 설계
  ## 3.1 인덱스 생성과 매핑
    - 동적 매핑 vs 명시적 매핑
    - 필드 타입: text, keyword, integer, date, boolean, nested
    - text vs keyword 차이 (분석 여부)
  ## 3.2 Analyzer 이해
    - Standard Analyzer 동작 방식
    - Custom Analyzer 구성 (tokenizer + filter)
    - Analyze API로 분석 결과 확인

# 4. 문서 CRUD (Go 코드)
  ## 4.1 문서 색인 (Create)
    - 단건 색인 (Index API)
    - 벌크 색인 (Bulk API)
  ## 4.2 문서 조회 (Read)
    - ID로 단건 조회 (Get API)
    - 전체 조회 (Search API - match_all)
  ## 4.3 문서 수정 (Update)
    - 부분 수정 (Update API)
    - Upsert 패턴
  ## 4.4 문서 삭제 (Delete)
    - 단건 삭제
    - 조건 삭제 (Delete by Query)

# 5. 마무리
  - 1편 요약
  - 다음 편 예고: 검색 쿼리와 Aggregation
```

### 3.2 2편: 검색과 Aggregation

```
# 1. 검색 쿼리
  ## 1.1 기본 검색
    - match 쿼리 (전문 검색)
    - term 쿼리 (정확한 값 매칭)
    - match_phrase 쿼리 (구문 검색)
    - multi_match 쿼리 (여러 필드 검색)
  ## 1.2 복합 쿼리
    - bool 쿼리 (must, should, must_not, filter)
    - range 쿼리 (날짜, 숫자 범위)
    - exists 쿼리
  ## 1.3 검색 결과 제어
    - 정렬 (sort)
    - 페이지네이션 (from/size, search_after)
    - 하이라이팅 (highlight)
    - Source 필터링 (_source)

# 2. Aggregation
  ## 2.1 Metric Aggregation
    - avg, sum, min, max, cardinality
  ## 2.2 Bucket Aggregation
    - terms (그룹별 집계)
    - date_histogram (시계열 집계)
    - range (범위별 집계)
  ## 2.3 중첩 Aggregation
    - Bucket 안에 Metric 조합
    - 실전 예시: 카테고리별 평균 가격

# 3. 마무리
  - 2편 요약
  - 다음 편 예고: Dashboards로 시각화
```

### 3.3 3편: Dashboards 시각화

```
# 1. OpenSearch Dashboards 소개
  ## 1.1 Dashboards란?
    - Kibana fork → OpenSearch Dashboards
    - 주요 기능: Discover, Visualize, Dashboard
    - 접속 및 기본 UI 둘러보기

# 2. 샘플 데이터: API Access Log
    - API 로그 데이터 모델 설계 (AccessLog 구조체)
    - 로그 인덱스 매핑 설정 (api-logs-YYYY.MM.DD 패턴)
    - Go 코드로 샘플 로그 데이터 벌크 색인
  ## 2.2 Index Pattern 생성
    - Dashboards에서 Index Pattern 설정 (api-logs-*)
    - 시간 필드(timestamp) 지정
    - Discover에서 로그 데이터 확인

# 3. Visualization 만들기
  ## 3.1 Top Errors 대시보드
      - Pie Chart: HTTP 상태 코드 분포 (2xx, 4xx, 5xx)
      - Data Table: Top 10 에러 메시지 (terms agg on error_message)
      - Vertical Bar: 시간대별 에러 발생 추이 (date_histogram + status_code filter)
      - Metric: 전체 에러율 (5xx 비율)
  ## 3.2 API 호출 지표 대시보드
      - Line Chart: 시간대별 API 요청 수 (date_histogram)
      - Horizontal Bar: 엔드포인트별 호출 횟수 (terms agg on endpoint)
      - Area Chart: 평균 응답 시간 추이 (date_histogram + avg agg on response_time_ms)
      - Metric: 평균 응답 시간, 총 요청 수, P95 응답 시간
      - Data Table: 느린 API Top 10 (avg response_time_ms by endpoint)
  ## 3.3 종합 대시보드
      - 위 Visualization들을 하나의 Dashboard로 조합
      - 시간 범위 필터 적용
      - 자동 새로고침 설정

# 4. Dashboard를 위한 Aggregation 쿼리 (Go)
    - 시간대별 에러 추이 쿼리 작성
    - 엔드포인트별 평균 응답 시간 쿼리 작성
    - Top N 에러 메시지 쿼리 작성
    - Percentile (P95, P99) 응답 시간 쿼리 작성

# 5. 마무리
  - 시리즈 전체 요약
  - 향후 학습 방향
    - 한국어 형태소 분석 (Nori Plugin)
    - Index Template, Index Lifecycle Management
    - 알림 설정 (Alerting Plugin)
    - 클러스터 운영 및 모니터링
    - OpenSearch와 Kubernetes 연동

# 참고
```

---

## 4. 샘플 코드 계획

### 4.1 디렉토리 구조

```
tutorials-go/database/opensearch/
├── docker-compose.yml          # OpenSearch + Dashboards 실행 환경
├── client.go                   # OpenSearch 클라이언트 초기화
├── model.go                    # 도메인 모델 (Product, AccessLog)
├── index.go                    # 인덱스 생성/삭제/매핑 관리
├── document.go                 # 문서 CRUD (색인, 조회, 수정, 삭제)
├── search.go                   # 검색 쿼리 (match, term, bool 등)
├── aggregation.go              # Aggregation 쿼리
├── dashboard.go                # 대시보드용 로그 색인 및 분석 쿼리
├── opensearch_test.go          # 통합 테스트 (testcontainers 기반)
└── testdata/
    ├── bulk_products.json      # 벌크 색인용 상품 샘플 데이터
    └── bulk_access_logs.json   # 벌크 색인용 API 로그 샘플 데이터
```

### 4.2 사용할 도메인 모델

두 가지 도메인 모델을 사용한다.

#### 모델 1: 상품 (Product) - 검색 쿼리 학습용

```go
type Product struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    Category    string    `json:"category"`
    Price       float64   `json:"price"`
    InStock     bool      `json:"in_stock"`
    Tags        []string  `json:"tags"`
    CreatedAt   time.Time `json:"created_at"`
}
```

#### 모델 2: API Access Log - Dashboards 시각화용

```go
type AccessLog struct {
    Timestamp      time.Time `json:"timestamp"`
    Method         string    `json:"method"`          // GET, POST, PUT, DELETE
    Endpoint       string    `json:"endpoint"`         // /api/v1/products, /api/v1/orders
    StatusCode     int       `json:"status_code"`      // 200, 400, 404, 500
    ResponseTimeMs float64   `json:"response_time_ms"` // 응답 시간 (밀리초)
    ErrorMessage   string    `json:"error_message"`    // 에러 시 메시지 (빈 문자열이면 정상)
    ClientIP       string    `json:"client_ip"`
    UserAgent      string    `json:"user_agent"`
    RequestBody    string    `json:"request_body"`
    ServiceName    string    `json:"service_name"`     // moneyflow-be, inspireme-be 등
}
```

> AccessLog 모델은 실제 운영 환경에서 수집되는 API 로그를 모사한다. Dashboards에서 Top Errors, API 호출 지표 등을 시각화하는 데 사용한다.

### 4.3 주요 의존성

| 라이브러리 | 용도 |
|------------|------|
| `github.com/opensearch-project/opensearch-go/v4` | OpenSearch Go 공식 클라이언트 |
| `github.com/testcontainers/testcontainers-go` | 통합 테스트 (OpenSearch 컨테이너) |
| `github.com/stretchr/testify` | 테스트 어설션 |

### 4.4 테스트 전략

- **testcontainers** 기반 통합 테스트: Docker로 OpenSearch 컨테이너를 자동 실행/종료
- 별도의 로컬 OpenSearch 설치 불필요
- `docker-compose.yml`은 직접 실습용으로 제공

### 4.5 구현할 테스트 함수 목록

```go
// 인덱스 관리
func TestCreateIndex(t *testing.T)
func TestDeleteIndex(t *testing.T)
func TestGetMapping(t *testing.T)

// 문서 CRUD
func TestIndexDocument(t *testing.T)
func TestBulkIndex(t *testing.T)
func TestGetDocument(t *testing.T)
func TestUpdateDocument(t *testing.T)
func TestDeleteDocument(t *testing.T)
func TestDeleteByQuery(t *testing.T)

// 검색 쿼리
func TestMatchQuery(t *testing.T)
func TestTermQuery(t *testing.T)
func TestMatchPhraseQuery(t *testing.T)
func TestMultiMatchQuery(t *testing.T)
func TestBoolQuery(t *testing.T)
func TestRangeQuery(t *testing.T)
func TestSearchWithSort(t *testing.T)
func TestSearchWithPagination(t *testing.T)
func TestSearchWithHighlight(t *testing.T)

// Aggregation
func TestAvgAggregation(t *testing.T)
func TestTermsAggregation(t *testing.T)
func TestDateHistogramAggregation(t *testing.T)
func TestNestedAggregation(t *testing.T)

// Dashboard용 로그 분석
func TestBulkIndexAccessLogs(t *testing.T)
func TestTopErrors(t *testing.T)                    // Top N 에러 메시지
func TestStatusCodeDistribution(t *testing.T)       // HTTP 상태 코드 분포
func TestErrorRateOverTime(t *testing.T)            // 시간대별 에러 발생 추이
func TestRequestCountByEndpoint(t *testing.T)       // 엔드포인트별 호출 횟수
func TestAvgResponseTimeOverTime(t *testing.T)      // 시간대별 평균 응답 시간
func TestSlowestEndpoints(t *testing.T)             // 느린 API Top N
func TestPercentileResponseTime(t *testing.T)       // P95, P99 응답 시간
func TestRequestCountOverTime(t *testing.T)         // 시간대별 API 요청 수
```

---

## 5. 작성 규칙

- **샘플 코드**: `tutorials-go/database/opensearch/` 리포의 실제 구현 코드를 참조/링크
- **코드 참조 형식**: `https://github.com/kenshin579/tutorials-go/blob/master/database/opensearch/{파일명}`
- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **Draft 위치**: 각 편별 `docs/start/{slug}/index.md` (상단 메타 정보 참조)
- **Publish**: 리뷰 후 `contents/database/{slug}/`로 이동

---

## 6. 필요한 다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid | OpenSearch 핵심 개념 구조 (Index → Shard → Document 관계) |
| 2 | Mermaid | Inverted Index 동작 원리 (문서 → 토큰 → 역색인 매핑) |
| 3 | Mermaid | Analyzer 파이프라인 (Text → Tokenizer → Token Filter → Terms) |
| 4 | Mermaid | Docker Compose 구성도 (OpenSearch + Dashboards) |
| 5 | Mermaid | Go 클라이언트 코드 구조 (패키지 관계도) |
| 6 | Mermaid | Bool Query 구조 (must, should, must_not, filter 관계) |
| 7 | Mermaid | AccessLog 데이터 흐름 (Go App → OpenSearch → Dashboards 시각화) |
| 8 | 스크린샷 | OpenSearch Dashboards - Dev Tools 콘솔 |
| 9 | 스크린샷 | OpenSearch Dashboards - Discover 검색 결과 |
| 10 | 스크린샷 | Dashboards - Top Errors 대시보드 (에러 코드 분포, 에러 메시지 테이블, 에러 추이) |
| 11 | 스크린샷 | Dashboards - API 호출 지표 대시보드 (요청 수, 응답 시간, 엔드포인트별 통계) |
| 12 | 스크린샷 | Dashboards - 종합 대시보드 (Visualization 조합 결과) |

---

## 7. 구현 순서 (마일스톤)

**공통 준비**

| 단계 | 작업 | 산출물 | 상태 |
|------|------|--------|------|
| M1 | PRD 작성 | 이 문서 | ✅ 완료 |
| M2 | Docker Compose 환경 구성 | `docker-compose.yml` | ⬜ 대기 |
| M3 | Go 샘플 코드 전체 작성 + 테스트 통과 | `client.go` ~ `opensearch_test.go` | ⬜ 대기 |

**1편: OpenSearch 입문**

| 단계 | 작업 | 산출물 | 상태 |
|------|------|--------|------|
| M4 | 1편 블로그 초안 작성 | `docs/start/opensearch-입문-.../index.md` | ⬜ 대기 |
| M5 | 1편 다이어그램 + 스크린샷 | Mermaid (1~4번), 스크린샷 (8번) | ⬜ 대기 |
| M6 | 1편 PR 생성 + 리뷰 + Publish | 블로그 게시 | ⬜ 대기 |

**2편: 검색과 Aggregation**

| 단계 | 작업 | 산출물 | 상태 |
|------|------|--------|------|
| M7 | 2편 블로그 초안 작성 | `docs/start/opensearch-검색과-.../index.md` | ⬜ 대기 |
| M8 | 2편 다이어그램 + 스크린샷 | Mermaid (5~6번), 스크린샷 (9번) | ⬜ 대기 |
| M9 | 2편 PR 생성 + 리뷰 + Publish | 블로그 게시 | ⬜ 대기 |

**3편: Dashboards 시각화**

| 단계 | 작업 | 산출물 | 상태 |
|------|------|--------|------|
| M10 | 3편 블로그 초안 작성 | `docs/start/opensearch-dashboards-.../index.md` | ⬜ 대기 |
| M11 | Dashboards에서 대시보드 생성 + 스크린샷 확보 | Mermaid (7번), 스크린샷 (10~12번) | ⬜ 대기 |
| M12 | 3편 PR 생성 + 리뷰 + Publish | 블로그 게시 | ⬜ 대기 |

---

## 8. 참고 자료

- [OpenSearch 공식 문서](https://opensearch.org/docs/latest/)
- [OpenSearch Go Client](https://github.com/opensearch-project/opensearch-go)
- [OpenSearch Go Client Guide](https://opensearch.org/docs/latest/clients/go/)
- [OpenSearch Query DSL](https://opensearch.org/docs/latest/query-dsl/)
- [OpenSearch Aggregations](https://opensearch.org/docs/latest/aggregations/)
- [OpenSearch Dashboards 가이드](https://opensearch.org/docs/latest/dashboards/)
- [OpenSearch Dashboards - Visualize](https://opensearch.org/docs/latest/dashboards/visualize/viz-index/)
- [OpenSearch vs Elasticsearch 비교](https://opensearch.org/faq/)
- [testcontainers-go](https://golang.testcontainers.org/)
- [기존 인프라 PRD](../../charts/docs/done/2_opensearch_prd.md) - OpenSearch 인프라 배포 참고
