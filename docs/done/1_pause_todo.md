# Supabase Pause 방지 개선 Todo

## Phase 1: DB 스키마

- [x] Supabase SQL Editor에서 `health` 테이블 생성 DDL 실행 (초기 row INSERT 포함)
- [x] Table Editor에서 테이블 생성 및 id=1 row 존재 확인

## Phase 2: 워크플로우 수정

- [x] `supabase-keepalive.yml`의 Ping Supabase 스텝 수정 (단일 row UPDATE 로직)

## Phase 3: 테스트

- [x] `gh workflow run supabase-keepalive.yml` 수동 실행
- [x] GitHub Actions 로그에서 `Health check updated` 메시지 확인
- [ ] Supabase 대시보드 > `health` 테이블의 `checked_at` 타임스탬프 갱신 확인

## Phase 4: 모니터링

- [ ] 2주간 Supabase 프로젝트 pause 발생 여부 확인
- [ ] pause 미발생 시 완료 처리
