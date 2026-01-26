# Assign Date Skill PRD

## 1. 개요

### 1.1 목적
MergeReady 라벨이 있는 PR들의 date 값을 기준으로 현재 작업 중인 md 파일의 date를 자동 지정하는 Skill 생성

### 1.2 배경
- 블로그 포스트 발행 시 date 값을 수동으로 계산하는 번거로움
- 기존 PR들의 발행 일정과 충돌 방지 필요
- 7일 간격으로 순차적 발행 일정 관리

### 1.3 대상 프로젝트
| 프로젝트 | Repository | 콘텐츠 경로 |
|----------|------------|-------------|
| blog-v2.advenoh.pe.kr | kenshin579/blog-v2.advenoh.pe.kr | contents/{category}/{slug}/index.md |
| investment.advenoh.pe.kr | kenshin579/investment.advenoh.pe.kr | contents/{category}/{slug}/index.md |

---

## 2. 요구사항

### 2.1 기능 요구사항

#### FR-1: MergeReady PR 조회
- GitHub MCP를 사용하여 해당 repo의 PR 목록 조회
- 필터 조건: `label:MergeReady`, `state:open`
- 각 PR에서 변경된 md 파일 목록 추출

#### FR-2: Date 값 추출
- 각 PR의 md 파일에서 frontmatter의 `date` 필드 파싱
- 형식: `YYYY-MM-DD` (예: 2026-01-24)
- 유효하지 않은 date는 무시

#### FR-3: 다음 Date 계산
- 모든 MergeReady PR의 date 중 최대값 선택
- 최대값 + 7일 = 새로운 date
- MergeReady PR이 없는 경우: 오늘 날짜 + 7일

#### FR-4: 현재 파일 Date 업데이트
- 현재 작업 중인 md 파일의 frontmatter에서 date 필드 수정
- `update` 필드도 동일한 값으로 업데이트 (존재하는 경우)

### 2.2 비기능 요구사항

#### NFR-1: 프로젝트 자동 감지
- 현재 작업 디렉토리 기반으로 프로젝트 자동 판별
- blog-v2 또는 investment 중 해당 프로젝트의 repo 사용

#### NFR-2: 에러 처리
- GitHub API 실패 시 명확한 에러 메시지
- MergeReady PR이 없을 때 기본 동작 안내

---

## 3. Skill 설계

### 3.1 Skill 파일 위치
```
~/.claude/skills/assign-date.md
```

### 3.2 Skill 호출 방식
```
/assign-date
```

### 3.3 워크플로우

```
┌─────────────────────────────────────┐
│ 1. 현재 프로젝트 감지               │
│    - cwd 기반으로 repo 판별         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 2. MergeReady PR 조회               │
│    - GitHub MCP: list_pull_requests │
│    - filter: label=MergeReady       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 3. 각 PR의 md 파일 date 추출        │
│    - pull_request_read (get_files)  │
│    - get_file_contents              │
│    - frontmatter date 파싱          │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 4. 최대 date + 7일 계산             │
│    - max(dates) + 7 days            │
│    - 없으면: today + 7 days         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 5. 현재 md 파일 date 업데이트       │
│    - Edit tool로 frontmatter 수정   │
│    - date, update 필드 변경         │
└─────────────────────────────────────┘
```

### 3.4 프로젝트별 설정

| 항목 | blog-v2 | investment |
|------|---------|------------|
| **owner** | kenshin579 | kenshin579 |
| **repo** | blog-v2.advenoh.pe.kr | investment.advenoh.pe.kr |
| **date 필드** | 필수 | 필수 |
| **update 필드** | 필수 (함께 수정) | 선택 (있으면 수정) |

---

## 4. 예시 시나리오

### 입력 상태
- **MergeReady PR #1**: date: 2026-01-24
- **MergeReady PR #2**: date: 2026-01-31
- **현재 md 파일**: date: 미지정 또는 임시값

### 출력 결과
- **계산**: max(2026-01-24, 2026-01-31) + 7 = **2026-02-07**
- **현재 md 파일**: date: 2026-02-07, update: 2026-02-07

---

## 5. 제약사항 및 고려사항

### 5.1 제약사항
- GitHub MCP 인증 필요
- 현재 파일이 md 파일이어야 함
- frontmatter가 YAML 형식이어야 함

### 5.2 엣지 케이스
| 케이스 | 처리 방안 |
|--------|-----------|
| MergeReady PR 없음 | 오늘 + 7일 사용 |
| PR에 md 파일 없음 | 해당 PR 스킵 |
| date 필드 없음 | 해당 파일 스킵 |
| 잘못된 date 형식 | 해당 파일 스킵, 경고 출력 |

---

## 6. 검증 방법

### 6.1 수동 테스트
1. MergeReady 라벨이 있는 PR 2개 이상 준비
2. 새 md 파일 생성 또는 기존 파일 열기
3. `/assign-date` 실행
4. date 필드가 예상 값으로 업데이트되었는지 확인

### 6.2 검증 체크리스트
- [ ] MergeReady PR의 date 값을 정확히 추출
- [ ] 최대 date + 7일 계산 정확성
- [ ] frontmatter date 필드 업데이트
- [ ] update 필드 동시 업데이트 (해당 시)
- [ ] 에러 상황 적절한 메시지 출력
