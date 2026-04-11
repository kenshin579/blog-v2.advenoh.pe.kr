# PostgreSQL vs MySQL 완벽 비교 가이드 - PRD

## 1. 개요

### 1.1 목적

PostgreSQL과 MySQL의 기술적 차이점을 아키텍처, 데이터 타입, 성능, 인덱스, 확장 생태계, 클라우드 지원, 라이선스까지 13가지 관점에서 심층 비교하는 블로그 글을 작성한다.

### 1.2 대상 독자

- RDBMS 선택을 고민하는 백엔드 개발자
- PostgreSQL 또는 MySQL 한쪽만 경험한 개발자
- 클라우드 DB 서비스 선정을 검토 중인 DevOps/SRE
- 데이터베이스 기초부터 심화까지 비교 학습하려는 개발자

### 1.3 비교 기준 버전

| DB | 버전 | 릴리즈 |
|----|------|--------|
| PostgreSQL | 17.x | 2024.09 |
| MySQL | 8.4 LTS | 2024.04 |
| MySQL | 9.x Innovation | 2024.07~ |

### 1.4 관련 Repo

- **블로그 Repo**: [blog-v2.advenoh.pe.kr](https://github.com/kenshin579/blog-v2.advenoh.pe.kr)

---

## 2. 블로그 구성

### 2.1 시리즈 구성

**1편**으로 작성한다.

### 2.2 블로그 메타 정보

```yaml
---
title: "PostgreSQL vs MySQL: 개발자를 위한 완벽 비교 가이드"
description: "PostgreSQL 17과 MySQL 8.4/9.x를 아키텍처, 데이터 타입, 성능, 인덱스, 확장 생태계, 클라우드 지원까지 심층 비교합니다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - PostgreSQL
  - MySQL
  - Database
  - RDBMS
  - 비교
  - InnoDB
  - pgvector
---
```

- **카테고리**: `database`
- **Draft 위치**: `docs/start/postgresql-vs-mysql-완벽-비교/index.md`
- **Publish 위치**: `contents/database/postgresql-vs-mysql-완벽-비교/`

---

## 3. 블로그 목차

```
# 1. 들어가며
  ## 1.1 이 글의 대상 독자
  ## 1.2 비교 버전 (PostgreSQL 17, MySQL 8.4/9.x)

# 2. 핵심 아키텍처 차이
  ## 2.1 MVCC 구현 방식
    - PostgreSQL: Heap 내 tuple versioning + VACUUM
    - MySQL (InnoDB): Undo Log 기반 + Purge Thread
    - 비교 표: MVCC 위치, 구 버전 관리, 쓰기 오버헤드, 팽창 위험
  ## 2.2 스토리지 엔진 구조
    - PostgreSQL: 단일 스토리지 엔진 (Heap + WAL)
    - MySQL: 플러그인형 스토리지 엔진 (InnoDB, MyISAM, Memory, NDB 등)
  ## 2.3 프로세스 vs 스레드 모델
    - PostgreSQL: Multi-Process (fork, PgBouncer 필요)
    - MySQL: Multi-Thread (스레드 풀, 메모리 효율적)
    - 실무 영향: 연결 관리와 확장성

# 3. SQL 표준 준수
  ## 3.1 공통 지원 기능 (CTE, Window Function, LATERAL 등)
  ## 3.2 PostgreSQL만 지원 (RETURNING, FULL OUTER JOIN, MERGE, FILTER 등)
  ## 3.3 MySQL만 지원하거나 다르게 지원 (ON DUPLICATE KEY UPDATE 등)
  ## 3.4 MySQL 8.0에서 추가된 기능 (Invisible Index, Functional Index 등)

# 4. 데이터 타입 비교
  ## 4.1 JSON 지원: PostgreSQL JSONB vs MySQL JSON
    - GIN 인덱스, containment 연산, JSON_TABLE
  ## 4.2 배열 및 복합 타입
    - PostgreSQL: INT[], TEXT[], COMPOSITE, DOMAIN
    - MySQL: 네이티브 배열 없음, JSON 배열로 대체
  ## 4.3 특수 타입
    - PostgreSQL: UUID, INET, CIDR, TSVECTOR, RANGE, HSTORE
    - MySQL: TINYINT(1) as BOOLEAN, SET, ENUM, YEAR
  ## 4.4 AI 벡터: pgvector vs MySQL VECTOR (9.x)

# 5. 성능 특성
  ## 5.1 읽기 집중 vs 쓰기 집중 워크로드
  ## 5.2 OLTP vs OLAP
  ## 5.3 벤치마크 참고 (Sysbench, TPC-H, pgbench)

# 6. 인덱스 타입
  ## 6.1 PostgreSQL 인덱스
    - B-tree, Hash, GiST, SP-GiST, GIN, BRIN, Bloom
    - Partial Index, Expression Index, Covering Index (INCLUDE)
  ## 6.2 MySQL 인덱스
    - B-tree, Full-Text, Spatial, Multi-Valued, Functional, Invisible
    - Adaptive Hash Index (AHI)
  ## 6.3 인덱스 선택 가이드 (Mermaid 결정 트리)

# 7. 동시성 제어
  ## 7.1 트랜잭션 격리 수준 비교
    - PostgreSQL 기본: Read Committed / MySQL 기본: Repeatable Read
  ## 7.2 PostgreSQL SSI (Serializable Snapshot Isolation)
  ## 7.3 MySQL Gap Lock / Next-Key Lock

# 8. 복제 및 고가용성
  ## 8.1 PostgreSQL 복제
    - Streaming Replication, Logical Replication
    - HA: Patroni, Repmgr, Stolon
  ## 8.2 MySQL 복제
    - Binlog 복제, GTID
    - HA: Group Replication, InnoDB Cluster, InnoDB ClusterSet

# 9. 확장 생태계
  ## 9.1 PostgreSQL 핵심 확장
    - PostGIS (GIS), pgvector (AI), TimescaleDB (시계열), Citus (분산)
    - FDW, pg_stat_statements, pg_trgm, pg_cron 등
  ## 9.2 MySQL 플러그인/컴포넌트
    - Clone Plugin, Audit Plugin, MeCab, HeatWave
    - Percona: MyRocks, XtraBackup, ProxySQL

# 10. 최신 버전 신기능 (2024~2025)
  ## 10.1 PostgreSQL 17
    - VACUUM 개선, JSON_TABLE, WAL 최적화, Logical Replication Failover
  ## 10.2 MySQL 8.4 LTS
    - 레거시 파라미터 정리, 복제 용어 통일, caching_sha2_password 기본값
  ## 10.3 MySQL 9.x Innovation
    - VECTOR 타입, HNSW 인덱스, JavaScript Stored Programs

# 11. 클라우드 관리형 서비스
  ## 11.1 PostgreSQL 클라우드 서비스
    - AWS: RDS, Aurora PostgreSQL
    - Google: Cloud SQL, AlloyDB
    - Azure: Flexible Server, Cosmos DB for PostgreSQL (Citus)
    - 기타: Supabase, Neon, Timescale Cloud, Aiven
  ## 11.2 MySQL 클라우드 서비스
    - AWS: RDS, Aurora MySQL
    - Google: Cloud SQL
    - Oracle: MySQL HeatWave
    - 기타: PlanetScale, TiDB Cloud

# 12. 라이선스
  ## 12.1 PostgreSQL License (Permissive, BSD/MIT 유사)
  ## 12.2 MySQL GPL v2 + 상업 이중 라이선스 (Oracle)
  ## 12.3 실무 영향 비교

# 13. 어떤 DB를 선택해야 할까?
  ## 13.1 PostgreSQL이 유리한 경우
    - 복잡한 데이터 모델, GIS, AI/벡터, 시계열, OLAP, 데이터 무결성
  ## 13.2 MySQL이 유리한 경우
    - 웹앱 OLTP, 고처리량 단순 쓰기, WordPress/PHP 생태계, Aurora MySQL
  ## 13.3 선택 흐름도 (Mermaid)

# 14. 마무리
  ## 14.1 한눈에 보는 요약 표
  ## 14.2 트렌드: PostgreSQL 채택 증가 추세

# 참고
```

---

## 4. 핵심 비교 내용 (글 작성 시 참고 자료)

### 4.1 아키텍처 비교 요약

| 항목 | PostgreSQL | MySQL (InnoDB) |
|------|-----------|----------------|
| MVCC 위치 | Heap 내 tuple | Undo Tablespace |
| 구 버전 관리 | VACUUM | Purge Thread |
| 쓰기 오버헤드 | 상대적으로 높음 | 상대적으로 낮음 |
| 팽창 위험 | Table Bloat | Undo Bloat |
| 프로세스 모델 | Multi-Process (fork) | Multi-Thread |
| 연결 관리 | PgBouncer 필수 | 스레드 풀 내장 가능 |
| 스토리지 엔진 | 단일 (Heap + WAL) | 플러그인형 (InnoDB, MyISAM 등) |
| 기본 격리 수준 | Read Committed | Repeatable Read |

### 4.2 SQL 기능 지원 매트릭스

| 기능 | PostgreSQL | MySQL |
|------|-----------|-------|
| CTE (WITH) | 8.4+ (2005~) | 8.0+ (2018) |
| Window Function | 8.4+ (2008) | 8.0+ (2018) |
| LATERAL JOIN | 9.3+ (2013) | 8.0.14+ (2019) |
| FULL OUTER JOIN | 지원 | 미지원 |
| RETURNING 절 | 지원 | 미지원 |
| MERGE 문 | 15+ (2022) | 미지원 |
| CHECK 제약 | 완전 지원 | 8.0.16+ (실제 강제) |
| JSON_TABLE | 17+ (2024) | 8.0+ (2018) |
| Functional Index | 지원 | 8.0+ |
| Invisible Index | 미지원 | 8.0+ |

### 4.3 데이터 타입 비교

| 타입 | PostgreSQL | MySQL |
|------|-----------|-------|
| JSON | JSON + JSONB (바이너리, GIN) | JSON (바이너리, Multi-Valued Index) |
| 배열 | INT[], TEXT[] 등 네이티브 | 미지원 (JSON 배열로 대체) |
| UUID | UUID 타입 + gen_random_uuid() | UUID 함수만 (전용 타입 없음) |
| 네트워크 | INET, CIDR, MACADDR | 미지원 |
| 전문검색 | TSVECTOR, TSQUERY | FULLTEXT Index |
| 범위 | RANGE, MULTIRANGE | 미지원 |
| 기하학 | POINT, LINE, POLYGON 등 | Spatial (제한적) |
| 벡터 (AI) | pgvector 확장 (0.7+) | VECTOR 타입 (9.0+) |
| ENUM | ALTER TYPE 필요 | ALTER TABLE 재구성 |

### 4.4 인덱스 비교

| 인덱스 타입 | PostgreSQL | MySQL |
|-------------|-----------|-------|
| B-tree | 기본 | 기본 (InnoDB) |
| Hash | 10+ (WAL 안전) | Memory 엔진 전용 |
| GiST | 지원 (공간, IP 등) | 미지원 |
| GIN | 지원 (JSONB, 배열, FTS) | 미지원 |
| BRIN | 지원 (시계열, 로그) | 미지원 |
| Full-Text | GIN + TSVECTOR | FULLTEXT Index |
| Spatial | PostGIS 확장 | R-Tree (제한적) |
| Multi-Valued | 미지원 | 8.0.17+ (JSON 배열) |
| Partial Index | 지원 | 미지원 |
| Covering (INCLUDE) | 11+ | 미지원 |

### 4.5 복제/HA 비교

| 항목 | PostgreSQL | MySQL |
|------|-----------|-------|
| 물리 복제 | Streaming Replication (WAL) | Binlog Replication |
| 논리 복제 | Logical Replication (10+) | GTID (5.6+) |
| 다중 마스터 | BDR (서드파티) | Group Replication (Multi-Primary) |
| HA 솔루션 | Patroni (사실상 표준) | InnoDB Cluster (공식) |
| 분산 DB | Citus | NDB Cluster, Vitess (서드파티) |

### 4.6 확장 생태계 비교

| 분야 | PostgreSQL | MySQL |
|------|-----------|-------|
| GIS | PostGIS (업계 표준) | Spatial (제한적) |
| AI 벡터 | pgvector (LangChain 기본 지원) | VECTOR (9.0+, 초기 단계) |
| 시계열 | TimescaleDB | 미지원 (HeatWave로 부분 보완) |
| 분산 | Citus | NDB Cluster, Vitess |
| 성능 통계 | pg_stat_statements | Performance Schema |
| 물리 백업 | pg_basebackup | Percona XtraBackup |
| 연결 풀 | PgBouncer, Pgpool-II | ProxySQL, MySQL Router |

### 4.7 클라우드 서비스 비교

| 클라우드 | PostgreSQL | MySQL |
|---------|-----------|-------|
| AWS | RDS, Aurora PostgreSQL | RDS, Aurora MySQL |
| Google | Cloud SQL, AlloyDB | Cloud SQL |
| Azure | Flexible Server, Cosmos DB (Citus) | Flexible Server |
| Oracle | - | MySQL HeatWave |
| Serverless | Neon, Supabase | PlanetScale, TiDB Cloud |

### 4.8 라이선스 비교

| 항목 | PostgreSQL | MySQL |
|------|-----------|-------|
| 라이선스 | PostgreSQL License (BSD/MIT 유사) | GPL v2 + 상업 이중 라이선스 |
| Copyleft | 없음 | 있음 (GPL) |
| 소스 공개 의무 | 없음 | 임베딩 시 필요 (또는 상업 라이선스) |
| 관리 주체 | PGDG (커뮤니티) | Oracle Corporation |
| SaaS 사용 | 제약 없음 | GPL 문제 없음 (네트워크 배포 해당 안 됨) |

### 4.9 장단점 요약

#### PostgreSQL 장점

1. SQL 표준 준수율 최고 (RETURNING, MERGE, FULL OUTER JOIN 등)
2. 풍부한 데이터 타입 (JSONB, 배열, RANGE, 네트워크, 기하학)
3. 다양한 인덱스 (GIN, GiST, BRIN, Partial, Covering)
4. 강력한 확장 생태계 (PostGIS, pgvector, TimescaleDB, Citus)
5. Serializable Snapshot Isolation (SSI) - 완전한 직렬화 보장
6. Permissive 라이선스 - 상업적 사용 자유
7. 복잡한 분석 쿼리 성능 (Parallel Query)
8. 커뮤니티 거버넌스 - 특정 기업 의존 없음

#### PostgreSQL 단점

1. VACUUM 관리 필요 (Table Bloat 위험, autovacuum 튜닝)
2. Multi-Process 모델로 연결 풀러(PgBouncer) 필수
3. 단순 PK 조회는 MySQL InnoDB 클러스터드 인덱스보다 느릴 수 있음
4. 순수 INSERT/UPDATE 쓰기 성능이 MySQL 대비 다소 낮음
5. 플러그인형 스토리지 엔진 미지원 (단일 스토리지)
6. 초기 학습 곡선이 MySQL보다 높음

#### MySQL 장점

1. 단순 OLTP 성능 우수 (PK 조회, 고처리량 쓰기)
2. InnoDB 클러스터드 인덱스로 PK 기반 조회 구조적 이점
3. Multi-Thread 모델로 연결 관리 효율적
4. 플러그인형 스토리지 엔진 (InnoDB, MyISAM, Memory 등)
5. 풍부한 웹 생태계 (WordPress, PHP, LAMP 스택)
6. Oracle 엔터프라이즈 지원 (MySQL Enterprise)
7. InnoDB Cluster로 쉬운 HA 구성
8. 직관적이고 낮은 학습 곡선

#### MySQL 단점

1. SQL 표준 준수 부족 (FULL OUTER JOIN, RETURNING, MERGE 미지원)
2. 제한된 데이터 타입 (배열 없음, UUID 타입 없음)
3. 인덱스 종류 제한 (GIN, GiST, BRIN 없음)
4. GPL 라이선스 제약 (임베딩 시 상업 라이선스 필요)
5. Oracle 의존 거버넌스 (커뮤니티 방향성 우려)
6. 확장 생태계 빈약 (PostGIS, pgvector, TimescaleDB에 해당하는 것 없음)
7. 복잡한 분석 쿼리 성능 제한 (Parallel Query 제한적)
8. Gap Lock으로 인한 잠금 경합 이슈 (RR 격리에서)

---

## 5. 작성 규칙

- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **비교 표**: 각 섹션마다 핵심 비교 표 포함
- **코드 예시**: SQL 쿼리 예시로 기능 차이 설명 (PostgreSQL vs MySQL 대비)
- **Draft 위치**: `docs/start/postgresql-vs-mysql-완벽-비교/index.md`에 초안 작성
- **Publish**: 리뷰 후 `contents/database/postgresql-vs-mysql-완벽-비교/`로 이동

---

## 6. 필요한 이미지/다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid | PostgreSQL MVCC vs MySQL MVCC 흐름 비교 |
| 2 | Mermaid | PostgreSQL 프로세스 모델 vs MySQL 스레드 모델 |
| 3 | Mermaid | PostgreSQL 인덱스 타입별 사용 사례 결정 트리 |
| 4 | Mermaid | 복제 아키텍처 비교 (Streaming Replication vs Group Replication) |
| 5 | Mermaid | 확장 생태계 맵 (pgvector, PostGIS, TimescaleDB 등) |
| 6 | Mermaid | DB 선택 의사결정 흐름도 |

---

## 7. 구현 순서 (마일스톤)

| 단계 | 작업 | 산출물 | 상태 |
|------|------|--------|------|
| M1 | PRD 작성 및 목차 확정 | `docs/start/13_db_prd.md` | 완료 |
| M2 | 블로그 초안 작성 (1편, 14개 섹션 통합) | `docs/start/postgresql-vs-mysql-완벽-비교/index.md` | 완료 |
| M3 | 리뷰 및 내용 보완 | 정확성 검증, 다이어그램 확인 | 대기 |
| M4 | 커버 이미지 생성 | `cover.png` | 대기 |
| M5 | PR 생성 + 리뷰 | 리뷰 완료 | 대기 |
| M6 | `contents/database/`로 이동 후 Publish | 블로그 게시 | 대기 |

---

## 8. 인기도/채택 트렌드 (참고)

| 지표 | PostgreSQL | MySQL |
|------|-----------|-------|
| DB-Engines 순위 (2025) | 4위 (상승세) | 2위 (안정) |
| Stack Overflow 2024 | 49.0% (1위) | 40.3% (2위) |
| 트렌드 | 2022년부터 MySQL 추월, 지속 상승 | 안정적 기반 유지 |

---

## 9. 참고 자료

### 공식 문서

- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/)
- [PostgreSQL 17 Release Notes](https://www.postgresql.org/docs/17/release-17.html)
- [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL 8.4 Release Notes](https://dev.mysql.com/doc/relnotes/mysql/8.4/en/)
- [MySQL 9.1 Release Notes](https://dev.mysql.com/doc/relnotes/mysql/9.1/en/)

### 확장/도구

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [PostGIS Documentation](https://postgis.net/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Citus Documentation](https://docs.citusdata.com/)
- [Patroni GitHub](https://github.com/zalando/patroni)

### 비교/벤치마크

- [DB-Engines Ranking](https://db-engines.com/en/ranking)
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/)
- [Percona Blog - PostgreSQL vs MySQL](https://www.percona.com/blog/)
- [Bytebase - PostgreSQL vs MySQL](https://www.bytebase.com/blog/postgres-vs-mysql/)

### 클라우드

- [AWS Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/postgresql-features/)
- [AWS Aurora MySQL](https://aws.amazon.com/rds/aurora/mysql-features/)
- [Google AlloyDB](https://cloud.google.com/alloydb)
- [Supabase](https://supabase.com/)
- [Neon Serverless PostgreSQL](https://neon.tech/)
- [PlanetScale](https://planetscale.com/)
