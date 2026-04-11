# PostgreSQL vs MySQL 완벽 비교 가이드 - 구현 문서

## 1. 현재 상태

| 항목 | 상태 | 경로 |
|------|------|------|
| PRD | 완료 | `docs/start/13_db_prd.md` |
| 블로그 초안 | 완료 | `docs/start/postgresql-vs-mysql-완벽-비교/index.md` |
| 커버 이미지 | 미완료 | `docs/start/postgresql-vs-mysql-완벽-비교/cover.png` |
| Publish | 미완료 | `contents/database/postgresql-vs-mysql-완벽-비교/` |

## 2. 블로그 글 구조 (14개 섹션, 1편)

| # | 섹션 | 포함 요소 |
|---|------|----------|
| 1 | 핵심 아키텍처 차이 | Mermaid 2개 (MVCC 흐름, 프로세스 모델), 비교 표 2개 |
| 2 | SQL 표준 준수 | 비교 매트릭스, SQL 코드 예시 (RETURNING, FILTER, ON DUPLICATE KEY) |
| 3 | 데이터 타입 비교 | JSON/배열/특수타입/벡터 비교 표 4개, SQL 코드 예시 |
| 4 | 성능 특성 | Mermaid 1개 (OLTP vs OLAP), 비교 표 2개 |
| 5 | 인덱스 타입 | Mermaid 1개 (인덱스 선택 흐름도), SQL 예시 (Partial/Expression/Covering) |
| 6 | 동시성 제어 | 격리 수준 표, Gap Lock SQL 예시, 잠금 비교 표 |
| 7 | 복제 및 고가용성 | Mermaid 2개 (PG 복제, MySQL 복제), HA 솔루션 표 |
| 8 | 확장 생태계 | 확장 비교 표 3개 |
| 9 | 최신 버전 기능 | PG 17, MySQL 8.4 LTS, MySQL 9.x 기능 표 |
| 10 | 클라우드 서비스 | 클라우드별 비교 표, Serverless 서비스 표 |
| 11 | 라이선스 | 라이선스 비교 표, 실무 영향 설명 |
| 12 | 실제 사용 사례 | 글로벌 기업 표, 국내 기업 표, 업종별 가이드 |
| 13 | 장단점 요약 | PG 장점 7개/단점 5개, MySQL 장점 7개/단점 7개 |
| 14 | DB 선택 가이드 | Mermaid 1개 (의사결정 흐름도), 최종 요약 표 |

## 3. 다이어그램 목록

블로그 초안에 이미 포함된 Mermaid 다이어그램:

| # | 위치 | 유형 | 설명 |
|---|------|------|------|
| 1 | 1.1 | flowchart | PostgreSQL MVCC vs MySQL MVCC 흐름 |
| 2 | 1.3 | flowchart | 프로세스 vs 스레드 모델 |
| 3 | 4.2 | flowchart | OLTP vs OLAP 비교 |
| 4 | 5.3 | flowchart | 인덱스 선택 결정 트리 |
| 5 | 7.1 | flowchart | PostgreSQL 복제 아키텍처 |
| 6 | 7.2 | flowchart | MySQL 복제 아키텍처 |
| 7 | 14.1 | flowchart | DB 선택 의사결정 흐름도 |

## 4. 리뷰 체크포인트

### 4.1 내용 정확성

- [ ] PostgreSQL 17 신기능 공식 릴리즈 노트와 대조
- [ ] MySQL 8.4 LTS / 9.x 신기능 공식 릴리즈 노트와 대조
- [ ] 기업 사용 사례 최신 정보 확인 (특히 국내 기업)
- [ ] 벤치마크 수치 인용 시 출처 명시 여부

### 4.2 Mermaid 다이어그램

- [ ] 모든 다이어그램 렌더링 확인 (노드 텍스트에 `<br/>` 사용 안 함)
- [ ] 흐름도 가독성 확인

### 4.3 블로그 포맷

- [ ] frontmatter 형식 (title, description, date, tags)
- [ ] 카테고리 디렉토리: `contents/database/`
- [ ] 한글 인코딩 UTF-8 확인
- [ ] 커버 이미지 생성 및 배치

## 5. Publish 워크플로우

```
1. feature 브랜치 생성
   git checkout -b docs/13-postgresql-vs-mysql

2. 변경 파일 커밋
   - docs/start/13_db_prd.md
   - docs/start/13_db_implementation.md
   - docs/start/13_db_todo.md
   - docs/start/postgresql-vs-mysql-완벽-비교/index.md

3. PR 생성 (gh pr create)

4. 리뷰 완료 후
   docs/start/postgresql-vs-mysql-완벽-비교/ → contents/database/postgresql-vs-mysql-완벽-비교/

5. 발행
```
