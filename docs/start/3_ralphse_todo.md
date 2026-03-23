# Ralph Loop 블로그 - TODO

## 단계 1: 사전 조사 & 스터디

- [ ] Geoffrey Huntley 원본 블로그 정독 ([ghuntley.com/ralph](https://ghuntley.com/ralph/))
- [ ] [how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) README 정독
- [ ] [snarktank/ralph](https://github.com/snarktank/ralph) 구현체 분석
- [ ] [Claude Code Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md) 확인
- [ ] Vercel [ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) 상세 확인
- [ ] Ralph Loop 직접 실행 체험 (간단한 프로젝트에 적용)
- [ ] 실행 중 스크린샷 확보 (터미널, git log, IMPLEMENTATION_PLAN.md)

## 단계 2: 샘플 코드 작성 (`tutorials-go/ai/ralph-loop/`)

- [x] 디렉토리 생성: `tutorials-go/ai/ralph-loop/`
- [x] `go.mod` 초기화 (루트 모듈에 포함)
- [x] `main.go` 작성 (간단한 HTTP API 서버)
- [x] `main_test.go` 작성 (Backpressure용 테스트)
- [x] `loop.sh` 작성 (기본 + 확장 버전, 모드 선택/반복 제한/자동 push)
- [x] `PROMPT_plan.md` 작성 (Best Practice: 좋은 예 vs 나쁜 예 주석 포함)
- [x] `PROMPT_build.md` 작성 (Best Practice: DO/DON'T 주석 포함)
- [x] `AGENTS.md` 작성 (필수 항목 + 권장 항목 구분)
- [x] `CLAUDE.md` 작성 (Ralph Loop용 설정 예시)
- [x] `specs/api-server.md` 작성 (적절한 스코프 예시)
- [x] `specs/health-check.md` 작성 (적절한 스코프 예시)
- [x] `prd.json` 작성 (올바른 구조 예시)
- [x] `README.md` 작성 (프로젝트 설명 + 실행 방법)
- [x] `go test ./...` 테스트 통과 확인

## 단계 3: 블로그 초안 작성 (전반부 - 섹션 1~4)

- [x] `docs/start/ralph-loop-완벽-가이드/index.md` 생성
- [x] frontmatter 작성 (title, description, date, tags)
- [x] 섹션 1: Ralph Loop란? (탄생 배경, 핵심 아이디어, 전통 AI 코딩과 비교)
- [x] 섹션 2: 핵심 구조 (loop.sh 코드 블록, 디렉토리 구조, 컨텍스트 관리)
- [x] 섹션 3: 3단계 워크플로우 (Specs → Planning → Building, 프롬프트 예시)
- [x] 섹션 4: PRD 구조와 진행 상태 추적 (prd.json 코드 블록, progress.txt)

## 단계 4: 블로그 초안 작성 (후반부 - 섹션 5~8)

- [x] 섹션 5: 안전과 제어 (샌드박스, Backpressure, 관찰자 역할)
- [x] 섹션 6: 실전 적용 가이드 (적합/부적합 프로젝트, Claude Code 설정, Best Practices DO/DON'T)
- [x] 섹션 7: 구현체 비교 (4개 구현체 비교 테이블)
- [x] 섹션 8: 마무리 (개발자 역할 변화, 한계, 향후 전망)
- [x] 참고 자료 섹션 작성

## 단계 5: 다이어그램 & 시각 자료

- [x] Mermaid: Ralph Loop 전체 워크플로우 (Outer Loop) — 섹션 1.3에 포함
- [x] Mermaid: 단일 반복 Inner Loop (작업 선택 → 구현 → 테스트 → 커밋) — 섹션 3.3에 포함
- [x] Mermaid: 3단계 워크플로우 (Specs → Planning → Building) — 섹션 3에 포함
- [x] Mermaid: 컨텍스트 관리 비교 (전통 vs Ralph Loop) — 섹션 2.3에 시퀀스 다이어그램 포함
- [x] Mermaid: 프로젝트 디렉토리 구조 — 섹션 2.2에 파일 관리 주체 다이어그램 포함
- [x] Mermaid: Backpressure 메커니즘 — 섹션 5.2에 포함
- [ ] 스크린샷 삽입 (터미널, git log, IMPLEMENTATION_PLAN.md) — 실행 체험 후 추가

## 단계 6: 검수 & 배포

- [ ] UTF-8 인코딩 확인 (`file -I`)
- [ ] 로컬 개발 서버에서 렌더링 확인 (`npm run dev`)
- [ ] tutorials-go 샘플 코드 테스트 통과 확인
- [ ] 블로그 본문에서 tutorials-go 코드 참조 링크 확인
- [ ] feature 브랜치 생성
- [ ] PR 생성 + 리뷰 요청
- [ ] 리뷰 완료 후 `contents/ai/ralph-loop-완벽-가이드/`로 이동
