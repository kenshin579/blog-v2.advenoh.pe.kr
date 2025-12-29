# Supabase Pause 방지 TODO

## Phase 1: Workflow 생성

- [ ] `.github/workflows/supabase-keepalive.yml` 파일 생성
- [ ] cron 스케줄 설정 (6일마다: `0 0 */6 * *`)
- [ ] Python 환경 및 supabase 패키지 설치 step 추가
- [ ] Supabase ping 로직 구현

## Phase 2: 테스트

- [ ] workflow_dispatch로 수동 실행 테스트
- [ ] GitHub Actions 로그에서 성공 메시지 확인
- [ ] Supabase 대시보드에서 활동 기록 확인

## Phase 3: 모니터링

- [ ] 첫 자동 실행 결과 확인 (6일 후)
- [ ] 1개월간 모니터링 후 pause 발생 여부 체크
- [ ] (필요시) INSERT 로직 추가 검토
