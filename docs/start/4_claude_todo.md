# Claude Code 설정 파일 완벽 가이드 - TODO

## 1단계: 샘플 설정 구성 (tutorials-go)

- [x] `.claude/settings.json` 생성 (권한, 환경변수)
- [x] `.claude/rules/code-style.md` 생성 (무조건 로딩 — Go 코드 스타일)
- [x] `.claude/rules/testing.md` 생성 (무조건 로딩 — 테스트 컨벤션)
- [x] `.claude/rules/api/echo-handler.md` 생성 (조건부 로딩 — paths 프론트매터)
- [ ] `/memory` 명령으로 rules 파일 로딩 확인 (사용자 직접 확인 필요)
- [ ] 스크린샷 캡처 (사용자 직접 캡처 필요)

## 2단계: 블로그 Draft 작성

- [x] `docs/start/claude-code-설정-파일-완벽-가이드/index.md` 디렉토리 생성
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] 섹션 1: Claude Code 설정 파일이란? (개요 + 전체 구조 Mermaid 다이어그램)
- [x] 섹션 2: CLAUDE.md (계층 구조, 각 레벨 용도, Import 구문, Best Practices)
- [x] 섹션 3: settings.json (스코프, 주요 설정 항목, permissions, .claudeignore 대안)
- [x] 섹션 4: .claude/rules/ (무조건/조건부 로딩, paths 프론트매터, 모노레포 예시)
- [x] 섹션 5: Auto Memory (MEMORY.md 인덱스, 4가지 타입, 관리 방법)
- [x] 섹션 6: 전체 아키텍처 요약 (설정 계층 다이어그램, 디렉토리 구조)
- [x] 섹션 7: 마무리 (관련 글 크로스 레퍼런스 링크)

## 3단계: 검증

- [x] `file -I` 로 UTF-8 인코딩 확인
- [x] Mermaid 다이어그램 렌더링 확인 (HTML 태그 미사용)
- [ ] tutorials-go 샘플 설정이 실제로 동작하는지 확인 (사용자 직접 확인 필요)
- [x] 기존 글과 내용 중복 없는지 확인

## 4단계: PR 생성

- [ ] feature 브랜치 생성 (`feature/{issue-number}-claude-code-config-guide`)
- [ ] 커밋 (블로그 글 + tutorials-go 샘플 설정)
- [ ] `gh pr create` + HEREDOC으로 PR 생성
- [ ] reviewer 지정 (kenshin579)
