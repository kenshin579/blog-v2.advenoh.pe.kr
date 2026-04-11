# PostgreSQL vs MySQL 완벽 비교 가이드 - TODO

## Phase 1: 기획 및 초안

- [x] PRD 작성 (`13_db_prd.md`)
- [x] 구현 문서 작성 (`13_db_implementation.md`)
- [x] 블로그 초안 작성 (`postgresql-vs-mysql-완벽-비교/index.md`)
  - [x] 1. 핵심 아키텍처 차이 (MVCC, 스토리지, 프로세스 모델)
  - [x] 2. SQL 표준 준수 (비교 매트릭스 + 코드 예시)
  - [x] 3. 데이터 타입 비교 (JSON, 배열, 특수 타입, 벡터)
  - [x] 4. 성능 특성 (읽기/쓰기, OLTP/OLAP)
  - [x] 5. 인덱스 타입 (7종 비교 + 선택 흐름도)
  - [x] 6. 동시성 제어 (격리 수준, SSI vs Gap Lock)
  - [x] 7. 복제 및 고가용성
  - [x] 8. 확장 생태계
  - [x] 9. 최신 버전 기능 (PG 17, MySQL 8.4/9.x)
  - [x] 10. 클라우드 관리형 서비스
  - [x] 11. 라이선스
  - [x] 12. 실제 사용 사례 (글로벌/국내 기업)
  - [x] 13. 장단점 요약
  - [x] 14. DB 선택 가이드 (의사결정 흐름도)
- [x] Mermaid 다이어그램 작성 (7개)

## Phase 2: 리뷰 및 보완

- [x] 내용 정확성 검증
  - [x] PostgreSQL 17 릴리즈 노트와 대조
  - [x] MySQL 8.4/9.x 릴리즈 노트와 대조
  - [x] 기업 사용 사례 최신 정보 확인
- [x] Mermaid 다이어그램 렌더링 확인 (7개, `<br/>` 태그 0개)
- [x] 글 전체 통독 (흐름, 가독성)
- [x] 오탈자/문법 검수
- [x] 섹션 2 heading 번호 스타일 일관성 수정

## Phase 3: 커버 이미지 및 발행 준비

- [ ] 커버 이미지 생성 (`cover.png`)
- [x] frontmatter date 확정 (2026-04-11)
- [x] 한글 인코딩 확인 (`file -I` → UTF-8)

## Phase 4: PR 및 발행

- [x] feature 브랜치 생성 (`docs/442-postgresql-vs-mysql`)
- [ ] 변경 파일 커밋
- [ ] PR 생성 (`gh pr create`)
- [ ] 리뷰 완료
- [ ] `docs/start/` → `contents/database/`로 이동
- [ ] 발행 완료
