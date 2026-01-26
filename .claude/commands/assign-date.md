## 목적
MergeReady 라벨이 있는 PR들의 date 값을 기준으로 현재 md 파일의 date를 자동 지정한다

## 실행 단계

### 1. 현재 repo 확인
- `git remote get-url origin`으로 owner/repo 추출

### 2. MergeReady PR 조회
- GitHub MCP `search_pull_requests` 사용
- 쿼리: `label:MergeReady is:open`

### 3. 각 PR의 md 파일에서 date 추출
- 각 PR에 대해 `pull_request_read` (method: get_files)로 변경된 파일 목록 조회
- contents/ 폴더 내 `.md` 파일만 필터링
- 각 md 파일에 대해 `get_file_contents`로 내용 조회 (PR의 head branch 참조)
- frontmatter에서 `date:` 필드 파싱 (YYYY-MM-DD 형식)

### 4. 다음 date 계산
- 모든 추출된 date 중 최대값 선택
- 최대값 + 7일 = 새로운 date
- MergeReady PR이 없거나 유효한 date가 없는 경우: 오늘 날짜 + 7일 사용

### 5. 현재 md 파일 date 업데이트
- 사용자가 현재 열어둔 md 파일 확인 (ide_selection 또는 사용자에게 파일 경로 질문)
- Edit tool로 frontmatter의 `date:` 필드 수정
- `update:` 필드도 동일한 값으로 함께 수정

### 6. 결과 출력
- 수정된 date 값 안내
- 참조한 MergeReady PR 목록과 각 date 표시

## 규칙
- date 형식: YYYY-MM-DD (예: 2026-02-07)
- 7일 간격 유지
- update 필드도 반드시 함께 수정
- frontmatter가 없는 파일은 에러 메시지 출력
